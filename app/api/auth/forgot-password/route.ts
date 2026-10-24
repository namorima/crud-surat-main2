import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { issueResetToken, sendResetEmail } from "@/lib/password-reset"

// Same reply whether or not the email is registered, so the form cannot be
// used to find out which emails have accounts.
const GENERIC_REPLY = {
  success: true,
  message: "Jika email itu berdaftar, pautan reset kata laluan telah dihantar.",
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Sila masukkan alamat email yang sah" }, { status: 400 })
    }

    // Case-insensitive exact match: escape the ILIKE wildcards
    const pattern = email.trim().replace(/[\\%_]/g, (c) => `\\${c}`)
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .ilike("email", pattern)
      .limit(2)
    if (error) throw error

    // Unknown email, or shared by several accounts: send nothing
    if (!users || users.length !== 1) return NextResponse.json(GENERIC_REPLY)
    const user = users[0]

    const token = await issueResetToken(user.id)
    if (!token) return NextResponse.json(GENERIC_REPLY)

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "")
    // Token in the fragment: it is never sent to the server in requests or Referer headers
    await sendResetEmail(user.email, user.name || "", `${siteUrl}/reset-password#token=${token}`)

    return NextResponse.json(GENERIC_REPLY)
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(GENERIC_REPLY)
  }
}
