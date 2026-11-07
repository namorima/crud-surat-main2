import { supabaseAdmin } from "./supabase"
import type { AktivitiItem, AktivitiPage } from "@/types/audit"

/**
 * Pengguna → Aktiviti: who keyed, edited and deleted surat and Rekod Bayaran,
 * newest first, from audit_surat and audit_bayaran merged. Paged with a
 * `sebelum` cursor (the created_at of the last row shown).
 */
export type AktivitiQuery = {
  jenis?: "surat" | "bayaran"
  /** CREATE | UPDATE | DELETE (UPDATE also takes BULK_UPDATE_STATUS) */
  aksi?: string
  /** username (audit user_id) */
  userId?: string
  /** YYYY-MM-DD, whole days in Malaysia time */
  dari?: string
  hingga?: string
  /** ISO timestamp: only rows older than this */
  sebelum?: string
  limit?: number
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
// Malaysia is UTC+8 all year
const startOfDay = (day: string) => `${day}T00:00:00+08:00`
const endOfDay = (day: string) => `${day}T23:59:59.999+08:00`

/** "#286" in "Rekod bayaran #286 dikeyin", for rows whose record is gone. */
const refInDetails = (details: string | null) => {
  const m = (details || "").match(/#(\d+)/)
  return m ? Number(m[1]) : null
}

export async function getAktiviti(q: AktivitiQuery): Promise<AktivitiPage> {
  const limit = Math.min(Math.max(q.limit || 50, 1), 200)

  const filter = <T extends { eq: any; in: any; gte: any; lte: any; lt: any; order: any; limit: any }>(query: T): T => {
    let next: any = query
    if (q.aksi === "UPDATE") next = next.in("action", ["UPDATE", "BULK_UPDATE_STATUS"])
    else if (q.aksi) next = next.eq("action", q.aksi)
    if (q.userId) next = next.eq("user_id", q.userId)
    if (q.dari && DAY.test(q.dari)) next = next.gte("created_at", startOfDay(q.dari))
    if (q.hingga && DAY.test(q.hingga)) next = next.lte("created_at", endOfDay(q.hingga))
    if (q.sebelum) next = next.lt("created_at", q.sebelum)
    return next.order("created_at", { ascending: false }).limit(limit + 1)
  }

  const [suratRes, bayaranRes] = await Promise.all([
    q.jenis === "bayaran"
      ? Promise.resolve({ data: [], error: null })
      : filter(supabaseAdmin.from("audit_surat").select("id, surat_id, bil, action, user_id, user_name, details, changes, created_at")),
    q.jenis === "surat"
      ? Promise.resolve({ data: [], error: null })
      : filter(supabaseAdmin.from("audit_bayaran").select("id, bayaran_id, action, user_id, user_name, details, changes, created_at")),
  ])
  if (suratRes.error) throw new Error(suratRes.error.message)
  if (bayaranRes.error) throw new Error(bayaranRes.error.message)

  // A Rekod Bayaran shows as its ID number (ids), looked up for the rows on this page
  const bayaranIds = [...new Set((bayaranRes.data || []).map((row: any) => row.bayaran_id).filter(Boolean))]
  const idsByUuid = new Map<string, number>()
  if (bayaranIds.length) {
    const { data } = await supabaseAdmin.from("bayaran").select("id, ids").in("id", bayaranIds)
    for (const row of data || []) if (row.ids != null) idsByUuid.set(row.id, row.ids)
  }

  const items: AktivitiItem[] = [
    ...(suratRes.data || []).map((row: any) => ({
      id: `s-${row.id}`,
      jenis: "surat" as const,
      action: row.action,
      userId: row.user_id || "",
      userName: row.user_name || "",
      recordId: row.surat_id || null,
      ref: row.bil ?? refInDetails(row.details),
      details: row.details || "",
      changes: Array.isArray(row.changes) ? row.changes : [],
      createdAt: row.created_at,
    })),
    ...(bayaranRes.data || []).map((row: any) => ({
      id: `b-${row.id}`,
      jenis: "bayaran" as const,
      action: row.action,
      userId: row.user_id || "",
      userName: row.user_name || "",
      recordId: row.bayaran_id || null,
      ref: (row.bayaran_id && idsByUuid.get(row.bayaran_id)) ?? refInDetails(row.details),
      details: row.details || "",
      changes: Array.isArray(row.changes) ? row.changes : [],
      createdAt: row.created_at,
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))

  const page = items.slice(0, limit)
  const more = items.length > limit
  return { items: page, sebelum: more ? page[page.length - 1].createdAt : null }
}
