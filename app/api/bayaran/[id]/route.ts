import { type NextRequest, NextResponse } from "next/server"
import { updateBayaran, getAllBayaran } from "@/lib/google-sheets"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params

    // Validate required fields
    if (!body.daripada || !body.tarikhTerima || !body.perkara) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current data to find the row index
    const allBayaran = await getAllBayaran()
    const rowIndex = allBayaran.findIndex((item) => item.id === id)

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Bayaran record not found" }, { status: 404 })
    }

    // Convert date format if needed (from YYYY-MM-DD to DD/MM/YYYY)
    const formattedData = {
      ...body,
      id: id, // Keep the original ID
      tarikhTerima: body.tarikhTerima ? formatDateForSheet(body.tarikhTerima) : "",
      tarikhMemoLadang: body.tarikhMemoLadang ? formatDateForSheet(body.tarikhMemoLadang) : "",
      tarikhHantar: body.tarikhHantar ? formatDateForSheet(body.tarikhHantar) : "",
      tarikhBayar: body.tarikhBayar ? formatDateForSheet(body.tarikhBayar) : "",
      tarikhPpnP: body.tarikhPpnP ? formatDateForSheet(body.tarikhPpnP) : "",
      tarikhPn: body.tarikhPn ? formatDateForSheet(body.tarikhPn) : "",
    }

    await updateBayaran(rowIndex, formattedData)
    return NextResponse.json({ success: true, message: "Bayaran record updated successfully" })
  } catch (error) {
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
