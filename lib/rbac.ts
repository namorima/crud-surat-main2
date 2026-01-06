import type { Permission, PermissionCheck } from '@/types/rbac'

/**
 * Check if user has specific permission
 * @param userPermissions - Array of user's permissions
 * @param check - Permission to check (resource + action)
 * @returns true if user has the permission
 */
export function hasPermission(
  userPermissions: Permission[],
  check: PermissionCheck
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }
  
  return userPermissions.some(
    (p) => p.resource === check.resource && p.action === check.action
  )
}

/**
 * Check if user has any of the permissions
 * @param userPermissions - Array of user's permissions
 * @param checks - Array of permissions to check
 * @returns true if user has at least one of the permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  checks: PermissionCheck[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }
  
  return checks.some((check) => hasPermission(userPermissions, check))
}

/**
 * Check if user has all permissions
 * @param userPermissions - Array of user's permissions
 * @param checks - Array of permissions to check
 * @returns true if user has all the permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  checks: PermissionCheck[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }
  
  return checks.every((check) => hasPermission(userPermissions, check))
}

/**
 * Get permissions for a specific resource
 * @param userPermissions - Array of user's permissions
 * @param resource - Resource name (e.g., 'surat', 'bayaran')
 * @returns Array of permissions for the resource
 */
export function getResourcePermissions(
  userPermissions: Permission[],
  resource: string
): Permission[] {
  if (!userPermissions || userPermissions.length === 0) {
    return []
  }
  
  return userPermissions.filter((p) => p.resource === resource)
}

/**
 * Check if user can perform action on resource
 * @param userPermissions - Array of user's permissions
 * @param resource - Resource name
 * @param action - Action name
 * @returns true if user can perform the action
 */
export function canPerformAction(
  userPermissions: Permission[],
  resource: string,
  action: string
): boolean {
  return hasPermission(userPermissions, { resource, action })
}

/**
 * Get all actions user can perform on a resource
 * @param userPermissions - Array of user's permissions
 * @param resource - Resource name
 * @returns Array of action names
 */
export function getResourceActions(
  userPermissions: Permission[],
  resource: string
): string[] {
  const resourcePerms = getResourcePermissions(userPermissions, resource)
  return resourcePerms.map((p) => p.action)
}

/**
 * Check if user has view permission for a resource
 * Convenience function for common check
 */
export function canView(userPermissions: Permission[], resource: string): boolean {
  return hasPermission(userPermissions, { resource, action: 'view' })
}

/**
 * Check if user has create permission for a resource
 * Convenience function for common check
 */
export function canCreate(userPermissions: Permission[], resource: string): boolean {
  return hasPermission(userPermissions, { resource, action: 'create' })
}

/**
 * Check if user has edit permission for a resource
 * Convenience function for common check
 */
export function canEdit(userPermissions: Permission[], resource: string): boolean {
  return hasPermission(userPermissions, { resource, action: 'edit' })
}

/**
 * Check if user has delete permission for a resource
 * Convenience function for common check
 */
export function canDelete(userPermissions: Permission[], resource: string): boolean {
  return hasPermission(userPermissions, { resource, action: 'delete' })
}
