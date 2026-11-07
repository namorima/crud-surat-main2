/** One changed field in an audit entry; values as the app shows them (dates DD/MM/YYYY). */
export interface AuditChange {
  field: string
  label: string
  from: string
  to: string
}

/** A row of audit_surat or audit_bayaran, as GET /api/audit returns it. */
export interface AuditEntry {
  id: string
  /** CREATE | UPDATE | DELETE | BULK_UPDATE_STATUS */
  action: string
  userName: string
  /** Username of the signed-in user; empty on older entries */
  userId: string
  details: string
  changes: AuditChange[]
  /** ISO timestamp */
  createdAt: string
}

/** One row of Pengguna → Aktiviti (GET /api/aktiviti): a surat or Rekod Bayaran audit entry. */
export interface AktivitiItem {
  /** "s-<audit id>" or "b-<audit id>" */
  id: string
  jenis: "surat" | "bayaran"
  /** CREATE | UPDATE | DELETE | BULK_UPDATE_STATUS */
  action: string
  userId: string
  userName: string
  /** surat / bayaran row id; null once deleted or on older rows */
  recordId: string | null
  /** BIL of the surat, or ID (ids) of the Rekod Bayaran */
  ref: number | null
  details: string
  changes: AuditChange[]
  /** ISO timestamp */
  createdAt: string
}

export interface AktivitiPage {
  items: AktivitiItem[]
  /** Pass back as `sebelum` for the next page; null when there is no more */
  sebelum: string | null
}
