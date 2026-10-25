import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/server-auth"
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getActiveUserByStaffId,
  deactivateUserForReplacement,
  restoreReplacedUser,
} from "@/lib/supabase-db"

/** Password hashes never leave the server. */
function withoutPassword<T extends { password?: unknown }>(user: T): Omit<T, "password"> {
  const { password: _password, ...rest } = user
  return rest
}

export async function GET(request: Request) {
  const guard = await requirePermission(request, { resource: "pengguna", action: "view" }, ["semua", "Super Admin", "admin"])
  if (guard.denied) return guard.denied
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const users = await getAllUsers()
    return NextResponse.json(users.map(withoutPassword))
  } catch (error: any) {
    console.error("Error fetching users data:", error)
    return NextResponse.json(
      { error: "Failed to fetch users from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission(request, { resource: "pengguna", action: "create" }, ["semua", "Super Admin", "admin"])
  if (guard.denied) return guard.denied
  try {
    const body = await request.json()

    if (!body.username || !body.password || !body.name || !body.role_id) {
      return NextResponse.json(
        { error: "username, password, name, and role_id are required" },
        { status: 400 }
      )
    }

    const staffId = String(body.username).trim()

    // Same staff ID already active: the person moved unit. Only replace (deactivate
    // the old account) when the admin confirmed it in the form.
    const existing = await getActiveUserByStaffId(staffId)
    if (existing && body.replaceExisting !== true) {
      return NextResponse.json(
        { error: `ID staf ${staffId} sudah digunakan oleh ${existing.name}`, existing },
        { status: 409 }
      )
    }

    const archived = existing ? await deactivateUserForReplacement(staffId) : null
    let user
    try {
      user = await createUser({
        username: staffId,
        password: body.password,
        name: body.name,
        role_id: body.role_id,
        type: body.type
      })
    } catch (createError) {
      // Put the old account back so the staff member is never left without one
      if (archived) await restoreReplacedUser(archived, staffId).catch((e) => console.error("Restore failed:", e))
      throw createError
    }

    return NextResponse.json(
      { ...(user ? withoutPassword(user) : user), replaced: archived ? existing : null },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePermission(request, { resource: "pengguna", action: "edit" }, ["semua", "Super Admin", "admin"])
  if (guard.denied) return guard.denied
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("id")

    if (!username) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    const user = await updateUser(username, {
      password: body.password,
      name: body.name,
      role_id: body.role_id,
      type: body.type
    })

    return NextResponse.json(user ? withoutPassword(user) : user)
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePermission(request, { resource: "pengguna", action: "delete" }, ["semua", "Super Admin", "admin"])
  if (guard.denied) return guard.denied
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("id")

    if (!username) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      )
    }

    await deleteUser(username)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    )
  }
}
