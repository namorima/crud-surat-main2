import { NextResponse } from "next/server"
import { updateFail, deleteFail } from "@/lib/supabase-db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { id } = params

    // Validation
    if (!body.part || !body.noFail || !body.unit) {
      return NextResponse.json({ error: "Missing required fields: part, noFail, unit" }, { status: 400 })
    }

    const updatedFail = await updateFail(id, body)
    return NextResponse.json(updatedFail)
  } catch (error) {
    console.error("Error updating FAIL:", error)
    return NextResponse.json(
      { error: "Failed to update FAIL in Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const { id } = params

    await deleteFail(id)
    return NextResponse.json({ success: true, message: "Fail deleted successfully" })
  } catch (error) {
    console.error("Error deleting FAIL:", error)
    return NextResponse.json(
      { error: "Failed to delete FAIL from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}
