import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '9297'

    // 1. Check user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // 2. Check if role exists
    let role = null
    let roleError = null
    if (user?.role_id) {
      const result = await supabase
        .from('roles')
        .select('*')
        .eq('id', user.role_id)
        .single()
      role = result.data
      roleError = result.error
    }

    // 3. Check role permissions
    let rolePermissions = []
    let permError = null
    if (user?.role_id) {
      const result = await supabase
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
        .eq('role_id', user.role_id)
      rolePermissions = result.data || []
      permError = result.error
    }

    // 4. Get all roles (for comparison)
    const { data: allRoles } = await supabase
      .from('roles')
      .select('id, name, display_name')

    // 5. Get all permissions
    const { data: allPermissions } = await supabase
      .from('permissions')
      .select('id, resource, action, display_name')
      .limit(10)

    return NextResponse.json({
      debug: {
        user: {
          data: user,
          error: userError?.message
        },
        role: {
          data: role,
          error: roleError?.message
        },
        rolePermissions: {
          data: rolePermissions,
          error: permError?.message,
          count: rolePermissions.length
        },
        allRoles: {
          data: allRoles,
          count: allRoles?.length || 0
        },
        allPermissions: {
          data: allPermissions,
          count: allPermissions?.length || 0
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
