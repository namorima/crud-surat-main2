export type Surat = {
  id: string
  bil: number
  daripadaKepada: string
  tarikh: string
  perkara: string
  kategori: string
  unit: string
  fail: string
  tindakanPic: string
  status: "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL"
  tarikhSelesai: string | null
  nota: string
  komen: string
  reference: string // Column M - Bil surat yang dilink (untuk respon)
}
