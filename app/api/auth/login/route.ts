import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { comparePassword, isHashedPassword, hashPassword } from "@/lib/password"
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password } = body

    if (!id || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Replaced when the staff member moved unit (their usernames are archived as
    // "<id>~<stamp>", so this only guards a direct hit on an archived row)
    if (user.is_active === false) {
      return NextResponse.json(
        { error: "Akaun ini telah dinyahaktifkan" },
        { status: 401 }
      )
    }

    // Verify password - support both hashed and plain text (for transparent migration)
    let isPasswordValid = false
    let needsMigration = false

    if (isHashedPassword(user.password)) {
      // Already hashed - use bcrypt compare
      isPasswordValid = await comparePassword(password, user.password)
    } else {
      // Plain text (legacy) - direct comparison
      isPasswordValid = password === user.password
      needsMigration = isPasswordValid // If valid, migrate to hashed
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Transparent migration: hash plain text password
    if (needsMigration) {
      try {
        const hashedPassword = await hashPassword(password)
        await supabaseAdmin
          .from("users")
          .update({ password: hashedPassword })
          .eq("username", id)
        
        user.password = hashedPassword // Update local copy
      } catch (migrationError) {
        console.error("Error migrating password:", migrationError)
        // Continue with login even if migration fails
      }
    }

    // Return user data (excluding sensitive password)
    const response = NextResponse.json({
      id: user.username,
      username: user.username,
      name: user.name,
      role: user.role,
      role_id: user.role_id,
      type: user.type || "",
      email: user.email || undefined,
      is_password_changed: user.is_password_changed || false,
      must_change_password: user.must_change_password || false,
      last_password_change: user.last_password_change || undefined,
    })
    // Every other /api route requires this cookie (middleware.ts).
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken({ uid: user.username, role: user.role, roleId: user.role_id }),
      sessionCookieOptions,
    )
    return response
  } catch (error: any) {
    console.error("Error during login:", error)
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    )
  }
}
