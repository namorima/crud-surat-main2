import { type NextRequest, NextResponse } from "next/server"
import { updateBayaran, getAllBayaran, deleteBayaran } from "@/lib/supabase-db"
import { BayaranSchema } from "@/types/bayaran-schema"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const user = request.nextUrl.searchParams.get("user") || "Unknown"

    // Get current data to find the row index
    const allBayaran = await getAllBayaran()
    const rowIndex = allBayaran.findIndex((item) => item.id === id)

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Bayaran record not found" }, { status: 404 })
    }

    await deleteBayaran(rowIndex, user)
    return NextResponse.json({ success: true, message: "Bayaran record deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/bayaran/[id]:", error)
    return NextResponse.json({ error: "Failed to delete bayaran record" }, { status: 500 })
  }
}
