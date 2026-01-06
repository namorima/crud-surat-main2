import { supabase } from './supabase'
import type { Role, Permission, CreateRoleInput, UpdateRoleInput } from '@/types/rbac'

/**
 * Get all roles from database
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('display_name')

    if (error) {
      console.error('Error fetching roles:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('getRoles error:', error)
    throw error
  }
}

/**
 * Get role by ID with its permissions
 */
export async function getRoleWithPermissions(roleId: string): Promise<Role | null> {
  try {
    // Fetch role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (roleError) {
      console.error('Error fetching role:', roleError)
      throw roleError
    }

    if (!role) return null

    // Fetch permissions for this role
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          id,
          resource,
          action,
          display_name,
          description
        )
      `)
      .eq('role_id', roleId)

    if (permError) {
      console.error('Error fetching role permissions:', permError)
      throw permError
    }

    // Extract permissions from the join result
    const permissions = rolePermissions?.map((rp: any) => rp.permissions).filter(Boolean) || []

    return {
      ...role,
      permissions
    }
  } catch (error) {
    console.error('getRoleWithPermissions error:', error)
    throw error
  }
}

/**
 * Get all permissions from database
 */
export async function getPermissions(): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource, action')

    if (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('getPermissions error:', error)
    throw error
  }
}

/**
 * Get permissions grouped by resource
 */
export async function getPermissionsGrouped(): Promise<Record<string, Permission[]>> {
  try {
    const permissions = await getPermissions()
    
    const grouped: Record<string, Permission[]> = {}
    
    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = []
      }
      grouped[perm.resource].push(perm)
    }
    
    return grouped
  } catch (error) {
    console.error('getPermissionsGrouped error:', error)
    throw error
  }
}

/**
 * Create new role
 */
export async function createRole(input: CreateRoleInput): Promise<Role> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: input.name,
        display_name: input.display_name,
        description: input.description,
        is_system_role: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('createRole error:', error)
    throw error
  }
}

/**
 * Update role
 */
export async function updateRole(input: UpdateRoleInput): Promise<Role> {
  try {
    const updateData: any = {}
    
    if (input.display_name !== undefined) {
      updateData.display_name = input.display_name
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description
    }

    const { data, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('updateRole error:', error)
    throw error
  }
}

/**
 * Update role permissions
 * Replaces all existing permissions with new ones
 */
export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<void> {
  try {
    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) {
      console.error('Error deleting role permissions:', deleteError)
      throw deleteError
    }

    // Insert new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(
          permissionIds.map((permId) => ({
            role_id: roleId,
            permission_id: permId
          }))
        )

      if (insertError) {
        console.error('Error inserting role permissions:', insertError)
        throw insertError
      }
    }
  } catch (error) {
    console.error('updateRolePermissions error:', error)
    throw error
  }
}

/**
 * Delete role
 * Only allows deleting custom roles (not system roles)
 */
export async function deleteRole(roleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('is_system_role', false) // Only allow deleting custom roles

    if (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  } catch (error) {
    console.error('deleteRole error:', error)
    throw error
  }
}

/**
 * Get user permissions by user ID
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    // First get user's role_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (userError || !user?.role_id) {
      console.error('Error fetching user or no role_id:', userError)
      return []
    }

    // Get role with permissions
    const role = await getRoleWithPermissions(user.role_id)
    
    return role?.permissions || []
  } catch (error) {
    console.error('getUserPermissions error:', error)
    return []
  }
}
