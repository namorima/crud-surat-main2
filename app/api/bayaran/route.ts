import { type NextRequest, NextResponse } from "next/server"
import { getAllBayaran, addBayaran } from "@/lib/supabase-db"
import { BayaranSchema } from "@/types/bayaran-schema"
import { z } from "zod"

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
    const { user, ...bayaranData } = body

    // Validate input using Zod
    const validatedData = BayaranSchema.parse(bayaranData)

    // Convert date format if needed (from YYYY-MM-DD to DD/MM/YYYY)
    const formattedData = {
      ...validatedData,
      namaKontraktor: "", // Will be auto-populated by supabase-db from kontrak table
      tarikhTerima: validatedData.tarikhTerima ? formatDateForSheet(validatedData.tarikhTerima) : "",
      tarikhMemoLadang: validatedData.tarikhMemoLadang ? formatDateForSheet(validatedData.tarikhMemoLadang) : "",
      tarikhHantar: validatedData.tarikhHantar ? formatDateForSheet(validatedData.tarikhHantar) : "",
      tarikhBayar: validatedData.tarikhBayar ? formatDateForSheet(validatedData.tarikhBayar) : "",
      tarikhPpnP: validatedData.tarikhPpnP ? formatDateForSheet(validatedData.tarikhPpnP) : "",
      tarikhPn: validatedData.tarikhPn ? formatDateForSheet(validatedData.tarikhPn) : "",
    }

    await addBayaran(formattedData, user || "Unknown")
    return NextResponse.json({ success: true, message: "Bayaran record added successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
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
