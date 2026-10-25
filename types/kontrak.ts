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
  /** Name of the work, e.g. "Kerja Mengangkut BTS Di Ladang ..." */
  kerja: string
  /** Contract value in RM, or null when not set */
  nilaiKontrak: number | null
  /** Only AKTIF contracts are offered in Tambah Rekod Bayaran */
  status: KontrakStatus
}

export type KontrakStatus = "AKTIF" | "SELESAI" | "TIDAK AKTIF"

export type KontrakInput = Omit<Kontrak, "id" | "tahunKontrak">
