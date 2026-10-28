import { supabaseAdmin } from "./supabase"
import type { Actor } from "./audit"
import type { KomenNotifikasi, SuratKomen } from "@/types/surat-komen"

export const KOMEN_MAX = 2000

const toKomen = (row: any): SuratKomen => ({
  id: row.id,
  suratId: row.surat_id,
  userId: row.user_id || "",
  userName: row.user_name || "",
  isi: row.isi || "",
  createdAt: row.created_at,
})

/** A surat's thread, oldest first. */
export async function getKomen(suratId: string): Promise<SuratKomen[]> {
  const { data, error } = await supabaseAdmin
    .from("surat_komen")
    .select("*")
    .eq("surat_id", suratId)
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map(toKomen)
}

/** Count and latest komen per surat, for the Surat list. */
export async function getKomenSummary(): Promise<Map<string, { count: number; latest: SuratKomen }>> {
  const { data, error } = await supabaseAdmin
    .from("surat_komen")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  const summary = new Map<string, { count: number; latest: SuratKomen }>()
  for (const row of data || []) {
    const prev = summary.get(row.surat_id)
    summary.set(row.surat_id, { count: (prev?.count ?? 0) + 1, latest: toKomen(row) })
  }
  return summary
}

/**
 * Adds a komen and notifies whoever keyed the surat and everyone who already
 * commented on it, except the author.
 */
export async function addKomen(suratId: string, isi: string, actor: Actor): Promise<SuratKomen> {
  const { data: surat, error: suratError } = await supabaseAdmin.from("surat").select("id, created_by").eq("id", suratId).maybeSingle()
  if (suratError) throw new Error(suratError.message)
  if (!surat) throw new Error("Surat tidak dijumpai")

  const { data, error } = await supabaseAdmin
    .from("surat_komen")
    .insert({ surat_id: suratId, user_id: actor.userId || null, user_name: actor.name, isi })
    .select("*")
    .single()
  if (error) throw new Error(error.message)

  const { data: earlier } = await supabaseAdmin.from("surat_komen").select("user_id").eq("surat_id", suratId).not("user_id", "is", null)
  const recipients = new Set<string>([surat.created_by, ...(earlier || []).map((r) => r.user_id)].filter(Boolean))
  recipients.delete(actor.userId)
  if (recipients.size > 0) {
    const { error: notifyError } = await supabaseAdmin
      .from("surat_komen_notifikasi")
      .insert([...recipients].map((userId) => ({ user_id: userId, komen_id: data.id, surat_id: suratId })))
    // A missed notification never fails the komen
    if (notifyError) console.error("Error adding komen notification:", notifyError)
  }
  return toKomen(data)
}

/** The komen, for checking who may delete it. */
export async function getKomenById(id: string): Promise<SuratKomen | null> {
  const { data, error } = await supabaseAdmin.from("surat_komen").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toKomen(data) : null
}

export async function deleteKomen(id: string) {
  const { error } = await supabaseAdmin.from("surat_komen").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

/** Unread komen for a user, newest first. */
export async function getUnreadNotifikasi(userId: string): Promise<KomenNotifikasi[]> {
  const { data, error } = await supabaseAdmin
    .from("surat_komen_notifikasi")
    .select("id, surat_id, surat_komen(user_name, isi, created_at), surat(bil, perkara)")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data || []).flatMap((row: any) => {
    const komen = Array.isArray(row.surat_komen) ? row.surat_komen[0] : row.surat_komen
    const surat = Array.isArray(row.surat) ? row.surat[0] : row.surat
    if (!komen || !surat) return []
    return [
      {
        id: row.id,
        suratId: row.surat_id,
        bil: surat.bil,
        perkara: surat.perkara || "",
        userName: komen.user_name || "",
        isi: komen.isi || "",
        createdAt: komen.created_at,
      },
    ]
  })
}

/** Marks a user's unread komen as read: all of them, or one surat's. */
export async function markNotifikasiRead(userId: string, suratId?: string) {
  let query = supabaseAdmin.from("surat_komen_notifikasi").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null)
  if (suratId) query = query.eq("surat_id", suratId)
  const { error } = await query
  if (error) throw new Error(error.message)
}
