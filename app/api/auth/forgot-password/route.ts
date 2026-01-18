import { NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if email exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("username, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      // Don't reveal if email exists or not for security
      // Always return success message
      return NextResponse.json({
        success: true,
        message: "If the email exists, a password reset link has been sent."
      })
    }

    // Send password reset email using Supabase Auth
    // Note: This uses Supabase's built-in email service
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (resetError) {
      console.error("Error sending reset email:", resetError)
      // Still return success for security (don't reveal if email exists)
      return NextResponse.json({
        success: true,
        message: "If the email exists, a password reset link has been sent."
      })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully"
    })
  } catch (error: any) {
    console.error("Error in forgot password:", error)
    // Return success message to not reveal if email exists
    return NextResponse.json({
      success: true,
      message: "If the email exists, a password reset link has been sent."
    })
  }
}
