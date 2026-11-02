import type { KawasanInput } from "@/types/kawasan"

/** Trims and normalises the fields; returns an error message or the clean input. */
export function parseKawasanInput(body: any): KawasanInput | string {
  const text = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ")
  const input: KawasanInput = {
    namaKawasan: text(body?.namaKawasan).toUpperCase(),
    kodLokasi: text(body?.kodLokasi).toUpperCase(),
  }
  if (!input.namaKawasan) return "Nama Kawasan wajib diisi"
  if (input.namaKawasan.length > 100) return "Nama Kawasan terlalu panjang"
  if (input.kodLokasi.length > 50) return "Kod Lokasi terlalu panjang"
  return input
}
