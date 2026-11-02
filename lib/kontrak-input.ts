import type { KontrakEot, KontrakInput, KontrakStatus } from "@/types/kontrak"

export const KONTRAK_KATEGORI = ["KONTRAK", "PERTANIAN AM", "ANGKUT BTS", "KIMIA", "PIECERATE"] as const
export const JENIS_KERJA = ["RUNDING TERUS", "SEBUTHARGA KAWASAN", "KUASA EKSEKUTIF", "KONTRAK HQ"] as const
export const KONTRAK_STATUS: readonly KontrakStatus[] = ["AKTIF", "SELESAI", "TIDAK AKTIF"]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * No Kontrak compared for duplicates: spaces and case are ignored, so
 * "JLNDK21/26" and "jlndk 21/26" are the same kontrak.
 */
export function kontrakNoKey(noKontrak: string): string {
  return (noKontrak || "").replace(/\s+/g, "").toUpperCase()
}

/** Year shown as Tahun Kontrak: the year of tarikh mula (YYYY-MM-DD). */
export function tahunFromTarikh(tarikhMula: string): number | null {
  return ISO_DATE.test(tarikhMula) ? Number(tarikhMula.slice(0, 4)) : null
}

/** "RM 1,234.50" / "1234.5" / 1234.5 → 1234.5; "" → null; anything else → NaN. */
export function parseNilai(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const text = String(value).replace(/rm/i, "").replace(/[,\s]/g, "")
  if (!text) return null
  return /^\d+(\.\d{0,2})?$/.test(text) ? Number(text) : Number.NaN
}

/** Trims the fields and checks them; returns an error message or the clean input. */
export function parseKontrakInput(body: any): KontrakInput | string {
  const text = (value: unknown) => String(value ?? "").trim()
  const input: KontrakInput = {
    kawasan: text(body?.kawasan).toUpperCase(),
    noKontrak: text(body?.noKontrak).toUpperCase(),
    noPo: text(body?.noPo).toUpperCase(),
    kategori: text(body?.kategori).toUpperCase(),
    namaKontraktor: text(body?.namaKontraktor).toUpperCase(),
    tarikhMula: text(body?.tarikhMula),
    tarikhAkhir: text(body?.tarikhAkhir),
    jenisKerja: text(body?.jenisKerja).toUpperCase(),
    // Free text: kept as typed rather than upper-cased.
    kerja: text(body?.kerja).replace(/\s+/g, " "),
    nilaiKontrak: parseNilai(body?.nilaiKontrak),
    wcp: parseNilai(body?.wcp),
    vo: parseNilai(body?.vo),
    eot: [],
    status: (text(body?.status).toUpperCase() || "AKTIF") as KontrakStatus,
  }
  if (!input.kawasan || !input.noKontrak) return "Kawasan dan No Kontrak wajib diisi"
  if (!KONTRAK_STATUS.includes(input.status)) return `Status tidak sah: ${input.status}`
  // Kategori is picked from KONTRAK_KATEGORI in the form; older rows may hold
  // other values, so the server does not reject them.
  if (Number.isNaN(input.nilaiKontrak)) return "Nilai kontrak tidak sah (contoh: 125000.00)"
  if (input.nilaiKontrak !== null && input.nilaiKontrak > 999_999_999_999.99) return "Nilai kontrak terlalu besar"
  if (Number.isNaN(input.wcp)) return "Nilai WCP tidak sah (contoh: 6250.00)"
  if (input.wcp !== null && input.wcp > 999_999_999_999.99) return "Nilai WCP terlalu besar"
  if (Number.isNaN(input.vo)) return "Nilai Arahan Perubahan (VO) tidak sah (contoh: 15000.00)"
  if (input.vo !== null && input.vo > 999_999_999_999.99) return "Nilai Arahan Perubahan (VO) terlalu besar"
  // Sambung Masa (EOT): rows without a date are dropped; Kali ke defaults to the row's place
  const eotRows: unknown[] = Array.isArray(body?.eot) ? body.eot : []
  const eot: KontrakEot[] = []
  for (const [i, row] of eotRows.entries()) {
    const tarikh = text((row as any)?.tarikh)
    if (!tarikh) continue
    if (!ISO_DATE.test(tarikh)) return "Tarikh Sambung Masa (EOT) tidak sah"
    const kaliText = text((row as any)?.kali)
    const kali = kaliText ? Number(kaliText) : i + 1
    if (!Number.isInteger(kali) || kali < 1 || kali > 99) return "Kali ke Sambung Masa (EOT) mesti nombor 1 hingga 99"
    eot.push({ kali, tarikh })
  }
  if (new Set(eot.map((e) => e.kali)).size !== eot.length) return "Kali ke Sambung Masa (EOT) tidak boleh berulang"
  input.eot = eot.sort((a, b) => a.kali - b.kali)
  if (input.jenisKerja && !(JENIS_KERJA as readonly string[]).includes(input.jenisKerja)) {
    return `Jenis kerja tidak sah: ${input.jenisKerja}`
  }
  for (const [label, value] of [["Tarikh Mula", input.tarikhMula], ["Tarikh Akhir", input.tarikhAkhir]] as const) {
    if (value && !ISO_DATE.test(value)) return `${label} tidak sah`
  }
  if (input.tarikhMula && input.tarikhAkhir && input.tarikhAkhir < input.tarikhMula) {
    return "Tarikh Akhir tidak boleh sebelum Tarikh Mula"
  }
  return input
}
