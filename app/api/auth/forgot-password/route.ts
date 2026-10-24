import { NextResponse } from "next/server"

// Disabled: users live in our own `users` table, not Supabase Auth, so the
// old Supabase reset email was never sent. Admins reset passwords from Pengguna.
export async function POST() {
  return NextResponse.json(
    { error: "Fungsi lupa kata laluan dimatikan sementara. Sila hubungi pentadbir untuk reset kata laluan." },
    { status: 410 }
  )
}
