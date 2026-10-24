import { NextResponse } from "next/server"
import { updateKontrak, deleteKontrak } from "@/lib/supabase-db"
import { parseKontrakInput } from "@/lib/kontrak-input"
import { kontrakErrorResponse } from "@/lib/kontrak-api"

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
    return kontrakErrorResponse(error, "Failed to update kontrak")
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
