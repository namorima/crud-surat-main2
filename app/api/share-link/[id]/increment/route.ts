import { NextResponse } from "next/server"
import { incrementShareLinkAccess } from "@/lib/google-sheets"

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    await incrementShareLinkAccess(id)
    return NextResponse.json({ success: true, message: "Access count incremented" })
  } catch (error) {
    console.error("Error incrementing share link access count:", error)
    return NextResponse.json(
      { error: "Failed to increment access count", details: error.message },
      { status: 500 },
    )
  }
}
