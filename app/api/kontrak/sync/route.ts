import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/server-auth"
import { syncAllBayaranKontraktor } from "@/lib/supabase-db"

/** Re-copies nama_kontraktor from kontrak onto every bayaran row. */
export async function POST(request: Request) {
  const guard = await requirePermission(
    request,
    [{ resource: "tetapan", action: "manage_all_units" }, { resource: "tetapan", action: "edit" }],
    ["semua", "Super Admin"],
  )
  if (guard.denied) return guard.denied
  try {
    const bayaranUpdated = await syncAllBayaranKontraktor()
    return NextResponse.json({ bayaranUpdated })
  } catch (error: any) {
    console.error("Error syncing nama kontraktor:", error)
    return NextResponse.json({ error: "Failed to sync nama kontraktor", details: error.message }, { status: 500 })
  }
}
