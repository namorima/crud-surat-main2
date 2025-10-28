import { NextResponse } from "next/server"
import { getAllShareLinks, addShareLink } from "@/lib/google-sheets"

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

    const data = await getAllShareLinks()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching share links:", error)
    return NextResponse.json(
      { error: "Failed to fetch share links from Google Sheets", details: error.message },
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
    if (!body.filterJson || !body.createdBy || !body.createdAt) {
      return NextResponse.json(
        { error: "Missing required fields: filterJson, createdBy, createdAt" },
        { status: 400 },
      )
    }

    const linkId = await addShareLink(body)
    return NextResponse.json({ linkId }, { status: 201 })
  } catch (error) {
    console.error("Error creating share link:", error)
    return NextResponse.json(
      { error: "Failed to create share link", details: error.message },
      { status: 500 },
    )
  }
}
