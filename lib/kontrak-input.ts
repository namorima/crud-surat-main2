import type { KontrakInput } from "@/types/kontrak"

export const KONTRAK_KATEGORI = ["KONTRAK", "PERTANIAN AM", "ANGKUT BTS", "KIMIA", "PIECERATE"] as const
export const JENIS_KERJA = ["RUNDING TERUS", "SEBUTHARGA KAWASAN", "KUASA EKSEKUTIF", "KONTRAK HQ"] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Year shown as Tahun Kontrak: the year of tarikh mula (YYYY-MM-DD). */
export function tahunFromTarikh(tarikhMula: string): number | null {
  return ISO_DATE.test(tarikhMula) ? Number(tarikhMula.slice(0, 4)) : null
}

/** Trims the fields and checks them; returns an error message or the clean input. */
export function parseKontrakInput(body: any): KontrakInput | string {
  const text = (value: unknown) => String(value ?? "").trim()
  const input: KontrakInput = {
    kawasan: text(body?.kawasan).toUpperCase(),
    noKontrak: text(body?.noKontrak).toUpperCase(),
    kategori: text(body?.kategori).toUpperCase(),
    namaKontraktor: text(body?.namaKontraktor).toUpperCase(),
    tarikhMula: text(body?.tarikhMula),
    tarikhAkhir: text(body?.tarikhAkhir),
    jenisKerja: text(body?.jenisKerja).toUpperCase(),
    // Free text: kept as typed rather than upper-cased.
    kerja: text(body?.kerja).replace(/\s+/g, " "),
  }
  if (!input.kawasan || !input.noKontrak) return "Kawasan dan No Kontrak wajib diisi"
  // Kategori is picked from KONTRAK_KATEGORI in the form; older rows may hold
  // other values, so the server does not reject them.
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
