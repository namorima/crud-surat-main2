export type Bayaran = {
  id: string
  ids?: number  // Original numeric ID from Google Sheets
  daripada: string
  tarikhTerima: string
  /** KEMAJUAN | WCP | WANG TAHANAN | PIECERATE; empty on records keyed before it */
  jenisBayaran?: string
  perkara: string
  nilaiBayaran: string
  /** Empty for a WCP bayaran (Bayaran Ke is not asked) */
  bayaranKe: string
  /** Wang Tahanan amount ("12,345.00"), optional; "" when the record has none */
  wangTahanan?: string
  kategori: string
  noKontrak: string
  namaKontraktor: string // New field - Column S
  tarikhMemoLadang: string
  statusLadang: string
  tarikhHantar: string
  tarikhPpnP: string // New field - Column Q
  tarikhPn: string // New field - Column R
  penerima: string
  statusBayaran: string
  tarikhBayar: string
  nomborBaucer: string
  notaKaki: string
}
