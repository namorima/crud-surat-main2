import { NextResponse } from 'next/server'
import { getPermissions, getPermissionsGrouped } from '@/lib/supabase-rbac'

// GET /api/permissions - Get all permissions
// GET /api/permissions?grouped=true - Get permissions grouped by resource
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const grouped = searchParams.get('grouped') === 'true'

    if (grouped) {
      const permissions = await getPermissionsGrouped()
      return NextResponse.json(permissions)
    } else {
      const permissions = await getPermissions()
      return NextResponse.json(permissions)
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
