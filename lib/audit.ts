import { supabaseAdmin } from "./supabase"
import { getSession } from "./session"
import { ADMIN_ROLES } from "./server-auth"
import type { AuditChange, AuditEntry } from "@/types/audit"

/** Who is acting: the signed-in user from the session cookie, not a name the client sends. */
export type Actor = { userId: string; name: string }

export async function getActor(request: Request, fallbackName?: string): Promise<Actor> {
  const session = await getSession(request)
  if (!session) return { userId: "", name: fallbackName || "Unknown" }
  const { data } = await supabaseAdmin.from("users").select("name").eq("username", session.uid).maybeSingle()
  return { userId: session.uid, name: data?.name || fallbackName || session.uid }
}

/** Admin and Super Admin only: legacy role, or the RBAC role named "semua" / "admin". */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const session = await getSession(request)
  if (!session) return false
  if (ADMIN_ROLES.includes(session.role)) return true
  if (!session.roleId) return false
  const { data } = await supabaseAdmin.from("roles").select("name").eq("id", session.roleId).maybeSingle()
  return !!data && ["semua", "admin"].includes(data.name)
}

/** DB columns shown in the audit, with their labels in the app. */
export const SURAT_AUDIT_FIELDS: Record<string, string> = {
  bil: "Bil",
  kategori: "Kategori",
  kaedah: "Kaedah",
  tarikh: "Tarikh",
  daripada_kepada: "Daripada / Kepada",
  perkara: "Perkara",
  unit: "Unit",
  tindakan_pic: "Tindakan PIC",
  fail: "Fail",
  untuk_makluman: "Untuk Makluman",
  status: "Status",
  tarikh_selesai: "Tarikh Selesai",
  nota: "Nota",
  komen: "Komen",
  reference: "Reference",
}

export const BAYARAN_AUDIT_FIELDS: Record<string, string> = {
  daripada: "Daripada",
  tarikh_terima: "Tarikh Terima",
  perkara: "Perkara",
  nilai_bayaran: "Nilai Bayaran",
  bayaran_ke: "Bayaran Ke",
  kategori: "Kategori",
  no_kontrak: "No Kontrak",
  tarikh_memo_ladang: "Tarikh Memo Ladang",
  status_ladang: "Status Ladang",
  tarikh_ppnp: "Tarikh PPN (P)",
  tarikh_pn: "Tarikh PN",
  tarikh_hantar: "Tarikh Hantar",
  penerima: "Penerima",
  status_bayaran: "Status Bayaran",
  tarikh_bayar: "Tarikh Bayar",
  nombor_baucer: "No Baucer",
  nota_kaki: "Nota Kaki",
}

const show = (value: unknown) => {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Ya" : "Tidak"
  const text = String(value).trim()
  // DB dates (YYYY-MM-DD) as the app shows them
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : text
}

/** Fields whose value differs between two DB rows (only the listed columns). */
export function diffRows(before: Record<string, any> | null, after: Record<string, any> | null, fields: Record<string, string>): AuditChange[] {
  const changes: AuditChange[] = []
  for (const [field, label] of Object.entries(fields)) {
    const from = show(before?.[field])
    const to = show(after?.[field])
    if (from !== to) changes.push({ field, label, from, to })
  }
  return changes
}

/** Logging never fails the change it records. */
export async function logSuratAudit(entry: {
  suratId?: string | null
  bil?: number | null
  action: "CREATE" | "UPDATE" | "DELETE"
  actor: Actor
  details: string
  changes?: AuditChange[]
}) {
  const { error } = await supabaseAdmin.from("audit_surat").insert({
    surat_id: entry.suratId ?? null,
    bil: entry.bil ?? null,
    action: entry.action,
    user_id: entry.actor.userId || null,
    user_name: entry.actor.name,
    details: entry.details,
    changes: entry.changes?.length ? entry.changes : null,
  })
  if (error) console.error("Error adding surat audit log:", error)
}

/** Newest first. type "surat" looks up by surat id (falling back to bil for rows logged without one). */
export async function getAuditEntries(type: "surat" | "bayaran", id: string, bil?: number): Promise<AuditEntry[]> {
  const table = type === "surat" ? "audit_surat" : "audit_bayaran"
  let query = supabaseAdmin.from(table).select("*").order("created_at", { ascending: false }).limit(200)
  query =
    type === "surat"
      ? bil
        ? query.or(`surat_id.eq.${id},and(surat_id.is.null,bil.eq.${bil})`)
        : query.eq("surat_id", id)
      : query.eq("bayaran_id", id)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    id: row.id,
    action: row.action,
    userName: row.user_name || "",
    userId: row.user_id || "",
    details: row.details || "",
    changes: Array.isArray(row.changes) ? row.changes : [],
    createdAt: row.created_at,
  }))
}
