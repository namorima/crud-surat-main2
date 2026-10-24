export interface Kontrak {
  id: string
  kawasan: string
  noKontrak: string
  kategori: string
  namaKontraktor: string
}

export type KontrakInput = Omit<Kontrak, "id">
