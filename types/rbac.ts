export type Permission = {
  id: string
  resource: string
  action: string
  display_name: string
  description?: string
  created_at?: string
}

export type Role = {
  id: string
  name: string
  display_name: string
  description?: string
  is_system_role: boolean
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export type RolePermission = {
  id: string
  role_id: string
  permission_id: string
  created_at?: string
}

// Helper type untuk check permissions
export type PermissionCheck = {
  resource: string
  action: string
}

// Type untuk create/update operations
export type CreateRoleInput = {
  name: string
  display_name: string
  description?: string
}

export type UpdateRoleInput = {
  id: string
  display_name?: string
  description?: string
}

export type AssignPermissionsInput = {
  role_id: string
  permission_ids: string[]
}
