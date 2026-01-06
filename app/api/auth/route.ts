import { NextResponse } from "next/server"
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/supabase-db"

export async function GET() {
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
    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Error fetching users data:", error)
    return NextResponse.json(
      { error: "Failed to fetch users from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.username || !body.password || !body.name || !body.role_id) {
      return NextResponse.json(
        { error: "username, password, name, and role_id are required" },
        { status: 400 }
      )
    }

    const user = await createUser({
      username: body.username,
      password: body.password,
      name: body.name,
      role_id: body.role_id,
      type: body.type
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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
