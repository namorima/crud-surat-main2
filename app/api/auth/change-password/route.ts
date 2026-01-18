import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { hashPassword, comparePassword, isHashedPassword } from "@/lib/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, email, userId, isFirstTime } = body

    if (!newPassword || !userId) {
      return NextResponse.json(
        { error: "New password and user ID are required" },
        { status: 400 }
      )
    }

    // Password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and number" },
        { status: 400 }
      )
    }

    // Get user data - userId is actually the username from localStorage
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify current password if not first time
    if (!isFirstTime) {
      // Support both hashed and plain text passwords (for transparent migration)
      const isValid = isHashedPassword(user.password)
        ? await comparePassword(currentPassword, user.password)
        : currentPassword === user.password // Legacy plain text

      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        )
      }
    }

    // Check new password doesn't match username
    if (newPassword === user.username) {
      return NextResponse.json(
        { error: "Password cannot be the same as your username" },
        { status: 400 }
      )
    }

    // Hash the new password before storing
    const hashedPassword = await hashPassword(newPassword)

    // Update user in database
    const updateData: any = {
      password: hashedPassword, // Store hashed password
      is_password_changed: true,
      must_change_password: false,
      last_password_change: new Date().toISOString(),
    }

    // Add email if provided
    if (email && email !== user.email) {
      updateData.email = email
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("username", userId)

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully"
    })
  } catch (error: any) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Failed to change password", details: error.message },
      { status: 500 }
    )
  }
}
