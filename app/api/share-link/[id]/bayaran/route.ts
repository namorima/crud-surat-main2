import { NextResponse } from "next/server"
import { getAllBayaran, getShareLinkById } from "@/lib/supabase-db"
import { filterBayaranForShareLink } from "@/lib/share-filter"
import type { ShareLinkFilter } from "@/types/share-link"

/**
 * Public (no session): the bayaran rows a share link is allowed to show.
 * Filtering happens here so the full table never reaches the browser.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shareLink = await getShareLinkById(id)
    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
    }

    let filters: ShareLinkFilter = {}
    try {
      filters = JSON.parse(shareLink.filterJson || "{}")
    } catch {
      return NextResponse.json({ error: "Invalid share link filter" }, { status: 500 })
    }

    return NextResponse.json(filterBayaranForShareLink(await getAllBayaran(), filters))
  } catch (error: any) {
    console.error("Error fetching shared bayaran:", error)
    return NextResponse.json({ error: "Failed to fetch shared bayaran", details: error.message }, { status: 500 })
  }
}
