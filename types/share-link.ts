export type ShareLink = {
  linkId: string
  filterJson: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  description?: string
  accessCount: number
}

export type ShareLinkFilter = {
  kategori?: string[]
  noKontrak?: string[]
  kawasan?: string[]
  statusBayaran?: string[]
  namaKontraktor?: string[]
  dateRange?: {
    from?: string
    to?: string
  }
}
