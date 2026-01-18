import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { hashPassword } from "@/lib/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Get user to get username
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("username")
      .eq("username", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Hash the username as the new password
    const hashedPassword = await hashPassword(user.username)

    // Reset password to username (hashed) and force password change
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password: hashedPassword,
        must_change_password: true,
        is_password_changed: false,
        last_password_change: null,
      })
      .eq("username", userId)

    if (updateError) {
      console.error("Error resetting password:", updateError)
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for user ${userId}`
    })
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password", details: error.message },
      { status: 500 }
    )
  }
}
