/**
 * "Respon To Bayaran" from a surat: the Surat page leaves the fields here and
 * opens /dashboard/bayaran?tambah=surat, which opens Tambah Rekod Bayaran with
 * them filled in. Per tab (sessionStorage), read once, and only if recent.
 */
export type BayaranPrefill = { daripada: string; tarikhTerima: string; perkara: string; bil: number }

const KEY = "bayaran:dari-surat"
const MAX_AGE = 2 * 60 * 1000

/** DD/MM/YYYY (surat) → YYYY-MM-DD (date input); "" when it is not a date */
export function toInputDate(ddmmyyyy: string): string {
  const [d, m, y] = (ddmmyyyy || "").split("/")
  return d && m && y && /^\d{4}$/.test(y) ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : ""
}

export function saveBayaranPrefill(prefill: BayaranPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), prefill }))
  } catch {
    // storage blocked: the Bayaran page opens an empty form instead
  }
}

export function takeBayaranPrefill(): BayaranPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw) return null
    const { at, prefill } = JSON.parse(raw) as { at: number; prefill: BayaranPrefill }
    return Date.now() - at < MAX_AGE && prefill ? prefill : null
  } catch {
    return null
  }
}
