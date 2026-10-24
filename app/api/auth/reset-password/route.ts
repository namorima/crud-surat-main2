import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { hashPassword } from "@/lib/password"
import { PASSWORD_RESET_ENABLED, RESET_DISABLED_MESSAGE } from "@/lib/password-reset-flag"
import { consumeResetToken, validateNewPassword } from "@/lib/password-reset"

export async function POST(request: Request) {
  if (!PASSWORD_RESET_ENABLED) {
    return NextResponse.json({ error: RESET_DISABLED_MESSAGE }, { status: 410 })
  }
  try {
    const { token, newPassword } = await request.json()

    if (typeof token !== "string" || token.length < 20) {
      return NextResponse.json({ error: "Pautan reset tidak sah atau telah tamat tempoh" }, { status: 400 })
    }
    const invalid = validateNewPassword(newPassword)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const userId = await consumeResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: "Pautan reset tidak sah atau telah tamat tempoh" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        password: await hashPassword(newPassword),
        is_password_changed: true,
        must_change_password: false,
        last_password_change: new Date().toISOString(),
      })
      .eq("id", userId)
    if (error) throw error

    return NextResponse.json({ success: true, message: "Kata laluan berjaya ditukar" })
  } catch (error) {
    console.error("Error in password reset:", error)
    return NextResponse.json({ error: "Gagal reset kata laluan. Sila cuba lagi." }, { status: 500 })
  }
}
