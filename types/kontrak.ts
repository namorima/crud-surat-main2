export interface Kontrak {
  id: string
  kawasan: string
  noKontrak: string
  kategori: string
  namaKontraktor: string
  /** YYYY-MM-DD, or "" when not set */
  tarikhMula: string
  /** YYYY-MM-DD, or "" when not set */
  tarikhAkhir: string
  /** Year of tarikhMula, kept by the database (generated column) */
  tahunKontrak: number | null
  jenisKerja: string
}

export type KontrakInput = Omit<Kontrak, "id" | "tahunKontrak">
