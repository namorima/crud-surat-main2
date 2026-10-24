import { NextResponse } from "next/server"

// Disabled: the old handler accepted any token and reset the first user's
// password. Admins reset passwords from Pengguna (/api/auth/reset-password-admin)
// until token-based recovery is in place.
export async function POST() {
  return NextResponse.json(
    { error: "Reset kata laluan melalui pautan dimatikan sementara. Sila hubungi pentadbir." },
    { status: 410 }
  )
}
