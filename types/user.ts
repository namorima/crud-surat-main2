import type { Permission } from './rbac'

export type User = {
  id: string
  password: string
  name: string
  role: string // Keep for backward compatibility
  role_id?: string // New field for RBAC
  permissions?: Permission[] // New field for RBAC
  type?: string // This will contain values like "VIEW", "PENERIMA", or empty for normal users
}
