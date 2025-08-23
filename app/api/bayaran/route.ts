import { type NextRequest, NextResponse } from "next/server"
import { getAllBayaran, addBayaran } from "@/lib/google-sheets"

export async function GET() {
  try {
    const data = await getAllBayaran()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/bayaran:", error)
    return NextResponse.json({ error: "Failed to fetch bayaran data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.daripada || !body.tarikhTerima || !body.perkara) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert date format if needed (from YYYY-MM-DD to DD/MM/YYYY)
    const formattedData = {
      ...body,
      tarikhTerima: body.tarikhTerima ? formatDateForSheet(body.tarikhTerima) : "",
      tarikhMemoLadang: body.tarikhMemoLadang ? formatDateForSheet(body.tarikhMemoLadang) : "",
      tarikhHantar: body.tarikhHantar ? formatDateForSheet(body.tarikhHantar) : "",
      tarikhBayar: body.tarikhBayar ? formatDateForSheet(body.tarikhBayar) : "",
      tarikhPpnP: body.tarikhPpnP ? formatDateForSheet(body.tarikhPpnP) : "",
      tarikhPn: body.tarikhPn ? formatDateForSheet(body.tarikhPn) : "",
    }

    await addBayaran(formattedData)
    return NextResponse.json({ success: true, message: "Bayaran record added successfully" })
  } catch (error) {
    console.error("Error in POST /api/bayaran:", error)
    return NextResponse.json({ error: "Failed to add bayaran record" }, { status: 500 })
  }
}

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForSheet(dateString: string): string {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}
