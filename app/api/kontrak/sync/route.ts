import { NextResponse } from "next/server"
import { syncAllBayaranKontraktor } from "@/lib/supabase-db"

/** Re-copies nama_kontraktor from kontrak onto every bayaran row. */
export async function POST() {
  try {
    const bayaranUpdated = await syncAllBayaranKontraktor()
    return NextResponse.json({ bayaranUpdated })
  } catch (error: any) {
    console.error("Error syncing nama kontraktor:", error)
    return NextResponse.json({ error: "Failed to sync nama kontraktor", details: error.message }, { status: 500 })
  }
}
