import { NextResponse } from "next/server"
import { updateKontrak, deleteKontrak } from "@/lib/supabase-db"
import { parseKontrakInput } from "@/lib/kontrak-input"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const input = parseKontrakInput(await request.json())
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 })
    }
    const result = await updateKontrak(id, input)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error updating kontrak:", error)
    const duplicate = String(error.message).includes("sudah wujud")
    return NextResponse.json(
      { error: duplicate ? error.message : "Failed to update kontrak", details: error.message },
      { status: duplicate ? 409 : 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteKontrak(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting kontrak:", error)
    return NextResponse.json({ error: "Failed to delete kontrak", details: error.message }, { status: 500 })
  }
}
