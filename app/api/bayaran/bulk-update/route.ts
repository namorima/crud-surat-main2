
import { type NextRequest, NextResponse } from "next/server"
import { bulkUpdateBayaranStatus } from "@/lib/supabase-db"
import { BulkUpdateBayaranSchema } from "@/types/bayaran-schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, newStatus, user } = body

    // Validate input using Zod
    const validatedData = BulkUpdateBayaranSchema.parse({ ids, newStatus, user })

    await bulkUpdateBayaranStatus(validatedData.ids, validatedData.newStatus, validatedData.user || "Unknown")
    return NextResponse.json({ success: true, message: "Bayaran records updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error in POST /api/bayaran/bulk-update:", error)
    return NextResponse.json({ error: "Failed to update bayaran records" }, { status: 500 })
  }
}
