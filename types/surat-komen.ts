/** One komen in a surat's thread, as /api/surat-komen returns it. */
export interface SuratKomen {
  id: string
  suratId: string
  /** Username of the author; empty for the migrated "Komen Pengurus" */
  userId: string
  userName: string
  isi: string
  /** ISO timestamp */
  createdAt: string
}

/** An unread komen on a surat the user keyed or commented on (/api/komen-notifikasi). */
export interface KomenNotifikasi {
  id: string
  suratId: string
  bil: number
  perkara: string
  userName: string
  isi: string
  createdAt: string
}
