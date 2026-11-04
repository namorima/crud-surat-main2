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
  /** "MELALUI EMEL" | "SERAHAN TANGAN"; "" on surat keyed before it was asked */
  kaedah?: string
  /** For information only: saved as SELESAI on the day it was ticked */
  untukMakluman?: boolean
  /** Komen thread (surat_komen): how many, and the newest; set by GET /api/surat */
  komenCount?: number
  komenTerakhir?: { userName: string; isi: string } | null
  /** "#tag" found in any komen of this surat (lower case); set by GET /api/surat */
  komenTags?: string[]
  /** Rekod Bayaran ids made from this surat with "Respon To Bayaran"; set by GET /api/surat */
  bayaranRefs?: number[]
}
