import type { Bayaran } from "@/types/bayaran"

/** "#119" or "119" → 119; anything else → null. */
export function parseRecordNumber(query: string): number | null {
  const m = query.trim().match(/^#?\s*(\d+)$/)
  return m ? Number(m[1]) : null
}

/** Digits and decimal point only: "RM 4,053.05" → "4053.05". */
function amountDigits(value: string): string {
  return value.replace(/[^\d.]/g, "")
}

/**
 * Search box match for a bayaran row.
 * - "#119": only the record with that number
 * - a plain number also matches the record number exactly, and Nilai Bayaran
 *   (typed as 4053.05, 4,053.05, RM 4053 or 4053.0)
 * - any text: daripada, perkara, kategori, bayaran ke, penerima, baucer,
 *   no kontrak, nama kontraktor
 */
export function matchesBayaranSearch(item: Bayaran, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true

  const recordNumber = parseRecordNumber(query)
  if (query.startsWith("#")) return recordNumber !== null && item.ids === recordNumber
  if (recordNumber !== null && item.ids === recordNumber) return true

  const queryAmount = amountDigits(query)
  if (queryAmount && /\d/.test(queryAmount) && /^[rm\d\s.,]+$/.test(query)) {
    const raw = amountDigits(item.nilaiBayaran || "")
    const value = Number(raw)
    if (raw && !Number.isNaN(value)) {
      const fixed = value.toFixed(2)
      if (raw.includes(queryAmount) || fixed.includes(queryAmount)) return true
    }
  }

  return [
    item.daripada,
    item.perkara,
    item.kategori,
    item.bayaranKe,
    item.penerima,
    item.nomborBaucer,
    item.noKontrak,
    item.namaKontraktor,
  ].some((field) => (field || "").toLowerCase().includes(query))
}
