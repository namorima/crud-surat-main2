import type { Permission } from './rbac'

export type User = {
  id: string
  username: string
  password: string
  name: string
  role: string // Keep for backward compatibility
  role_id?: string // New field for RBAC
  permissions?: Permission[] // New field for RBAC
  type?: string // This will contain values like "VIEW", "PENERIMA", or empty for normal users
  email?: string // For password recovery
  is_password_changed?: boolean // Track if password has been changed
  must_change_password?: boolean // Force password change on first login
  last_password_change?: string // Track last password change timestamp
  staff_id?: string // Real staff ID; equals username except on a replaced (deactivated) account
  is_active?: boolean // false once a newer account with the same staff ID replaced it
  deactivated_at?: string
  replaced_by?: string // username of the account that replaced this one
}
