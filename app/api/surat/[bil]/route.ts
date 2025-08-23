import { type NextRequest, NextResponse } from "next/server"
import { getAllSurat } from "@/lib/google-sheets"

export async function GET(request: NextRequest, { params }: { params: { bil: string } }) {
  try {
    const bil = Number.parseInt(params.bil)

    if (isNaN(bil)) {
      return NextResponse.json({ error: "Invalid BIL number" }, { status: 400 })
    }

    const allSurat = await getAllSurat()
    const surat = allSurat.find((s) => s.bil === bil)

    if (!surat) {
      return NextResponse.json({ error: "Surat not found" }, { status: 404 })
    }

    return NextResponse.json(surat)
  } catch (error) {
    console.error("Error fetching surat by BIL:", error)
    return NextResponse.json({ error: "Failed to fetch surat" }, { status: 500 })
  }
}
