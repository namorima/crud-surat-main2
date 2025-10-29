import { NextResponse } from "next/server"
import { getShareLinkById, deleteShareLink } from "@/lib/google-sheets"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const { id } = await params

    const shareLink = await getShareLinkById(id)

    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }

    // Check if link has expired
    if (shareLink.expiresAt) {
      const expiryDate = new Date(shareLink.expiresAt)
      const now = new Date()
      if (expiryDate < now) {
        return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
      }
    }

    return NextResponse.json(shareLink)
  } catch (error) {
    console.error("Error fetching share link:", error)
    return NextResponse.json(
      { error: "Failed to fetch share link", details: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const { id } = await params

    await deleteShareLink(id)
    return NextResponse.json({ success: true, message: "Share link deleted successfully" })
  } catch (error) {
    console.error("Error deleting share link:", error)
    return NextResponse.json(
      { error: "Failed to delete share link", details: error.message },
      { status: 500 },
    )
  }
}
