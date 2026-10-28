import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getActor, isAdminRequest } from "@/lib/audit"
import { KOMEN_MAX, addKomen, deleteKomen, getKomen, getKomenById } from "@/lib/surat-komen"

const UUID = /^[0-9a-f-]{36}$/i

// Any signed-in user (middleware checks the session) can read and add komen
export async function GET(request: NextRequest) {
  const suratId = request.nextUrl.searchParams.get("suratId") || ""
  if (!UUID.test(suratId)) return NextResponse.json({ error: "suratId tidak sah" }, { status: 400 })
  try {
    return NextResponse.json(await getKomen(suratId))
  } catch (error: any) {
    console.error("Error fetching komen:", error)
    return NextResponse.json({ error: "Gagal memuatkan komen" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Sila log masuk" }, { status: 401 })
  const body = await request.json().catch(() => null)
  const suratId = typeof body?.suratId === "string" ? body.suratId : ""
  const isi = typeof body?.isi === "string" ? body.isi.trim() : ""
  if (!UUID.test(suratId)) return NextResponse.json({ error: "suratId tidak sah" }, { status: 400 })
  if (!isi) return NextResponse.json({ error: "Komen kosong" }, { status: 400 })
  if (isi.length > KOMEN_MAX) return NextResponse.json({ error: `Komen melebihi ${KOMEN_MAX} aksara` }, { status: 400 })
  try {
    return NextResponse.json(await addKomen(suratId, isi, await getActor(request)))
  } catch (error: any) {
    console.error("Error adding komen:", error)
    return NextResponse.json({ error: error.message || "Gagal menghantar komen" }, { status: 500 })
  }
}

/** The author, or an admin / Super Admin, may delete a komen. */
export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Sila log masuk" }, { status: 401 })
  const id = request.nextUrl.searchParams.get("id") || ""
  if (!UUID.test(id)) return NextResponse.json({ error: "id tidak sah" }, { status: 400 })
  try {
    const komen = await getKomenById(id)
    if (!komen) return NextResponse.json({ error: "Komen tidak dijumpai" }, { status: 404 })
    if (komen.userId !== session.uid && !(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Hanya penulis komen boleh memadamnya" }, { status: 403 })
    }
    await deleteKomen(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting komen:", error)
    return NextResponse.json({ error: "Gagal memadam komen" }, { status: 500 })
  }
}
