import { type NextRequest, NextResponse } from "next/server"
import { getAllSurat, addSurat, updateSurat, deleteSurat } from "@/lib/google-sheets"

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const data = await getAllSurat()

    // Ensure we're returning an array even if the API returns null or undefined
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("Error fetching surat data:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.unit || !body.tindakanPic || !body.status) {
      return NextResponse.json({ error: "Unit, Tindakan PIC, and Status are required fields" }, { status: 400 })
    }

    // Get all existing data to determine the next row index
    const existingData = await getAllSurat()
    const rowIndex = existingData.length > 0 ? existingData.length : 0

    await addSurat(rowIndex, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding surat:", error)
    return NextResponse.json({ error: "Failed to add data", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowIndex, data } = body

    // Validate required fields
    if (!data.unit || !data.tindakanPic || !data.status) {
      return NextResponse.json({ error: "Unit, Tindakan PIC, and Status are required fields" }, { status: 400 })
    }

    await updateSurat(rowIndex, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating surat:", error)
    return NextResponse.json({ error: "Failed to update data", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rowIndex = Number.parseInt(searchParams.get("rowIndex") || "0", 10)

    if (isNaN(rowIndex)) {
      return NextResponse.json({ error: "Invalid row index" }, { status: 400 })
    }

    await deleteSurat(rowIndex)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting surat:", error)
    return NextResponse.json({ error: "Failed to delete data", details: error.message }, { status: 500 })
  }
}
