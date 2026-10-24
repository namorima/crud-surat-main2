import type { KontrakInput } from "@/types/kontrak"

/** Trims the fields and checks the required ones; returns an error message or the clean input. */
export function parseKontrakInput(body: any): KontrakInput | string {
  const input: KontrakInput = {
    kawasan: String(body?.kawasan ?? "").trim().toUpperCase(),
    noKontrak: String(body?.noKontrak ?? "").trim().toUpperCase(),
    kategori: String(body?.kategori ?? "").trim().toUpperCase(),
    namaKontraktor: String(body?.namaKontraktor ?? "").trim().toUpperCase(),
  }
  if (!input.kawasan || !input.noKontrak) return "Kawasan dan No Kontrak wajib diisi"
  return input
}
