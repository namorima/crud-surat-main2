import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUnreadNotifikasi, markNotifikasiRead } from "@/lib/surat-komen"

/** The signed-in user's unread komen. */
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Sila log masuk" }, { status: 401 })
  try {
    return NextResponse.json(await getUnreadNotifikasi(session.uid))
  } catch (error: any) {
    console.error("Error fetching komen notifications:", error)
    return NextResponse.json({ error: "Gagal memuatkan notifikasi" }, { status: 500 })
  }
}

/** { suratId? }: marks that surat's (or all) unread komen as read. */
export async function PATCH(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Sila log masuk" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const suratId = typeof body?.suratId === "string" && /^[0-9a-f-]{36}$/i.test(body.suratId) ? body.suratId : undefined
  try {
    await markNotifikasiRead(session.uid, suratId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking komen notifications:", error)
    return NextResponse.json({ error: "Gagal mengemaskini notifikasi" }, { status: 500 })
  }
}
