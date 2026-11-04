import { NextResponse } from "next/server"
import { getKawasanNames } from "@/lib/supabase-db"

/**
 * Kawasan names only, for any signed-in user (middleware checks the session).
 * The Surat page uses it to offer "Respon To Bayaran" for a MASUK surat whose
 * Daripada is a kawasan.
 */
export async function GET() {
  return NextResponse.json(await getKawasanNames())
}
