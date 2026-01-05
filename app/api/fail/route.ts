import { NextResponse } from "next/server"
import { getAllFail, addFail } from "@/lib/supabase-db"

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

    const data = await getAllFail()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching FAIL data:", error)
    return NextResponse.json(
      { error: "Failed to fetch FAIL data from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
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

    // Validation
    if (!body.part || !body.noFail || !body.unit) {
      return NextResponse.json({ error: "Missing required fields: part, noFail, unit" }, { status: 400 })
    }

    const newFail = await addFail(body)
    return NextResponse.json(newFail, { status: 201 })
  } catch (error) {
    console.error("Error adding FAIL:", error)
    return NextResponse.json(
      { error: "Failed to add FAIL to Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}
