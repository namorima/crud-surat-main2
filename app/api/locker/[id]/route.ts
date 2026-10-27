import { NextResponse } from "next/server"
import { requireUnitEdit } from "@/lib/server-auth"
import { getLockerById, updateLocker, deleteLocker } from "@/lib/supabase-db"
import { parseLockerInput } from "@/lib/locker-input"
import { lockerErrorResponse } from "@/lib/locker-api"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const input = parseLockerInput(await request.json().catch(() => null))
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 })
  try {
    const existing = await getLockerById(id)
    if (!existing) return NextResponse.json({ error: "Locker tidak dijumpai" }, { status: 404 })
    // Both the current and the new unit must be the user's to manage
    const guard = await requireUnitEdit(request, [existing.unit, input.unit])
    if (guard.denied) return guard.denied
    return NextResponse.json(await updateLocker(existing, input))
  } catch (error: any) {
    console.error("Error updating locker:", error)
    return lockerErrorResponse(error, "Failed to update locker")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const existing = await getLockerById(id)
    if (!existing) return NextResponse.json({ error: "Locker tidak dijumpai" }, { status: 404 })
    const guard = await requireUnitEdit(request, [existing.unit])
    if (guard.denied) return guard.denied
    await deleteLocker(existing)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting locker:", error)
    return lockerErrorResponse(error, "Failed to delete locker")
  }
}
