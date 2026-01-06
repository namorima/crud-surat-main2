import { NextResponse } from 'next/server'
import {
  getRoles,
  getRoleWithPermissions,
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole
} from '@/lib/supabase-rbac'
import type { CreateRoleInput, UpdateRoleInput } from '@/types/rbac'

// GET /api/roles - Get all roles
// GET /api/roles?id=xxx - Get specific role with permissions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('id')

    if (roleId) {
      // Get specific role with permissions
      const role = await getRoleWithPermissions(roleId)
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(role)
    } else {
      // Get all roles
      const roles = await getRoles()
      return NextResponse.json(roles)
    }
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create new role
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.name || !body.display_name) {
      return NextResponse.json(
        { error: 'name and display_name are required' },
        { status: 400 }
      )
    }

    const input: CreateRoleInput = {
      name: body.name,
      display_name: body.display_name,
      description: body.description
    }

    const role = await createRole(input)

    // If permissions are provided, assign them
    if (body.permission_ids && Array.isArray(body.permission_ids)) {
      await updateRolePermissions(role.id, body.permission_ids)
    }

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

// PATCH /api/roles - Update role
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Update role metadata if provided
    if (body.display_name !== undefined || body.description !== undefined) {
      const input: UpdateRoleInput = {
        id: body.id,
        display_name: body.display_name,
        description: body.description
      }
      await updateRole(input)
    }

    // Update permissions if provided
    if (body.permission_ids && Array.isArray(body.permission_ids)) {
      await updateRolePermissions(body.id, body.permission_ids)
    }

    // Fetch and return updated role with permissions
    const updatedRole = await getRoleWithPermissions(body.id)
    
    if (!updatedRole) {
      return NextResponse.json(
        { error: 'Role not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedRole)
  } catch (error: any) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/roles?id=xxx - Delete role
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('id')

    if (!roleId) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await deleteRole(roleId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
