import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/server-auth"
import { updateKontraktor, deleteKontraktor } from "@/lib/supabase-db"
import { parseKontraktorInput } from "@/lib/kontraktor-input"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(
    request,
    [{ resource: "tetapan", action: "manage_all_units" }, { resource: "tetapan", action: "edit" }],
    ["semua", "Super Admin"],
  )
  if (guard.denied) return guard.denied
  try {
    const { id } = await params
    const input = parseKontraktorInput(await request.json())
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 })
    return NextResponse.json(await updateKontraktor(id, input))
  } catch (error: any) {
    console.error("Error updating kontraktor:", error)
    const message = String(error?.message ?? "")
    const duplicate = message.includes("sudah wujud")
    return NextResponse.json(
      { error: duplicate ? message : "Failed to update kontraktor", details: message },
      { status: duplicate ? 409 : 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission(
    request,
    [{ resource: "tetapan", action: "manage_all_units" }, { resource: "tetapan", action: "edit" }],
    ["semua", "Super Admin"],
  )
  if (guard.denied) return guard.denied
  try {
    const { id } = await params
    await deleteKontraktor(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting kontraktor:", error)
    const message = String(error?.message ?? "")
    const inUse = message.includes("masih digunakan")
    return NextResponse.json(
      { error: inUse ? message : "Failed to delete kontraktor", details: message },
      { status: inUse ? 409 : 500 },
    )
  }
}
