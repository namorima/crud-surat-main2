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
