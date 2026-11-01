export interface Kontrak {
  id: string
  kawasan: string
  noKontrak: string
  /** No Purchase Order (PO), optional; "" when not set */
  noPo: string
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
  /** Wang Cagaran Prestasi (WCP) in RM, or null when not set */
  wcp: number | null
  /** Arahan Perubahan (VO) value in RM, or null when none */
  vo: number | null
  /** Sambung Masa (EOT): each extension's number and date (YYYY-MM-DD), by kali */
  eot: KontrakEot[]
  /** Only AKTIF contracts are offered in Tambah Rekod Bayaran */
  status: KontrakStatus
}

export type KontrakEot = { kali: number; tarikh: string }

export type KontrakStatus = "AKTIF" | "SELESAI" | "TIDAK AKTIF"

export type KontrakInput = Omit<Kontrak, "id" | "tahunKontrak">
