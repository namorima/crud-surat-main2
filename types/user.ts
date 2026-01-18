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
}
