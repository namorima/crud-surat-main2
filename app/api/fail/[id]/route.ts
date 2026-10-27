import { NextResponse } from "next/server"
import { updateFail, deleteFail, setFailActive } from "@/lib/supabase-db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params

    // Validation
    if (!body.part || !body.noFail || !body.unit) {
      return NextResponse.json({ error: "Missing required fields: part, noFail, unit" }, { status: 400 })
    }

    const updatedFail = await updateFail(id, body)
    return NextResponse.json(updatedFail)
  } catch (error) {
    console.error("Error updating FAIL:", error)
    return NextResponse.json(
      { error: "Failed to update FAIL in Supabase", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

/** { isActive: boolean }: disable a fail (hidden from the Surat form) or enable it again. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (typeof body?.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be true or false" }, { status: 400 })
    }
    return NextResponse.json(await setFailActive(id, body.isActive))
  } catch (error) {
    console.error("Error changing FAIL status:", error)
    return NextResponse.json(
      { error: "Failed to change FAIL status in Supabase", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await deleteFail(id)
    return NextResponse.json({ success: true, message: "Fail deleted successfully" })
  } catch (error) {
    console.error("Error deleting FAIL:", error)
    return NextResponse.json(
      { error: "Failed to delete FAIL from Supabase", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
