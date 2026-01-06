import { type NextRequest, NextResponse } from "next/server"
import { updateBayaran, getAllBayaran, deleteBayaran, addAuditLog } from "@/lib/supabase-db"
import { BayaranSchema } from "@/types/bayaran-schema"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"

// Test GET handler to verify route is accessible
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("[GET /api/bayaran/[id]] Route is accessible! ID:", id)
  return NextResponse.json({ 
    message: "Route is working", 
    id: id,
    timestamp: new Date().toISOString()
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    const { user, ...bayaranData } = body

    // Validate input using Zod
    const validatedData = BayaranSchema.parse(bayaranData)

    // Get current data to find the row index
    const allBayaran = await getAllBayaran()
    const rowIndex = allBayaran.findIndex((item) => item.id === id)

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Bayaran record not found" }, { status: 404 })
    }

    // Convert date format if needed (from YYYY-MM-DD to DD/MM/YYYY)
    const formattedData = {
      ...validatedData,
      id: id, // Keep the original ID
      tarikhTerima: validatedData.tarikhTerima ? formatDateForSheet(validatedData.tarikhTerima) : "",
      tarikhMemoLadang: validatedData.tarikhMemoLadang ? formatDateForSheet(validatedData.tarikhMemoLadang) : "",
      tarikhHantar: validatedData.tarikhHantar ? formatDateForSheet(validatedData.tarikhHantar) : "",
      tarikhBayar: validatedData.tarikhBayar ? formatDateForSheet(validatedData.tarikhBayar) : "",
      tarikhPpnP: validatedData.tarikhPpnP ? formatDateForSheet(validatedData.tarikhPpnP) : "",
      tarikhPn: validatedData.tarikhPn ? formatDateForSheet(validatedData.tarikhPn) : "",
    }

    await updateBayaran(rowIndex, formattedData, user || "Unknown")
    return NextResponse.json({ success: true, message: "Bayaran record updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error in PUT /api/bayaran/[id]:", error)
    return NextResponse.json({ error: "Failed to update bayaran record" }, { status: 500 })
  }
}

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForSheet(dateString: string): string {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = request.nextUrl.searchParams.get("user") || "Unknown"

    console.log("[DELETE] ===== START DELETE REQUEST =====")
    console.log("[DELETE] Received ID:", id)
    console.log("[DELETE] User:", user)

    // Query Supabase directly - without .single() to avoid errors
    const { data: records, error: fetchError } = await supabaseAdmin
      .from("bayaran")
      .select("id, ids")
      .eq("id", id)

    console.log("[DELETE] Query result - records:", records)
    console.log("[DELETE] Query result - error:", fetchError)

    if (fetchError) {
      console.error("[DELETE] Supabase query error:", fetchError)
      return NextResponse.json({ 
        error: "Database query failed", 
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!records || records.length === 0) {
      console.error("[DELETE] Record not found for ID:", id)
      return NextResponse.json({ 
        error: "Bayaran record not found",
        searchedId: id 
      }, { status: 404 })
    }

    const existingRecord = records[0]
    console.log("[DELETE] Found record:", existingRecord)

    // Add audit log before deletion
    try {
      await addAuditLog({
        bayaranId: id,
        user: user,
        action: "DELETE",
        details: `Rekod bayaran #${existingRecord.ids || id} dipadam`,
      })
      console.log("[DELETE] Audit log added successfully")
    } catch (auditError) {
      console.error("[DELETE] Audit log failed (continuing anyway):", auditError)
    }

    // Delete from Supabase
    console.log("[DELETE] Attempting to delete record with ID:", id)
    const { error: deleteError } = await supabaseAdmin
      .from("bayaran")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("[DELETE] Delete operation failed:", deleteError)
      return NextResponse.json({ 
        error: "Failed to delete record",
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log("[DELETE] ===== DELETE SUCCESSFUL =====")
    return NextResponse.json({ 
      success: true, 
      message: "Bayaran record deleted successfully",
      deletedId: id,
      deletedIds: existingRecord.ids
    })
  } catch (error: any) {
    console.error("[DELETE] ===== UNEXPECTED ERROR =====")
    console.error("[DELETE] Error:", error)
    console.error("[DELETE] Error message:", error?.message)
    console.error("[DELETE] Error stack:", error?.stack)
    return NextResponse.json({ 
      error: "Failed to delete bayaran record",
      details: error?.message || "Unknown error"
    }, { status: 500 })
  }
}
