import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { comparePassword, isHashedPassword, hashPassword } from "@/lib/password"

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
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
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
  } catch (error: any) {
    console.error("Error during login:", error)
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    )
  }
}
