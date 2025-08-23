import { NextResponse } from "next/server"
import { getUnitAndPicData } from "@/lib/google-sheets"

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

    const data = await getUnitAndPicData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching unit and PIC data:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}
