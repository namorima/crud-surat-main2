import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/server-auth"
import { getAllKawasan, addKawasan } from "@/lib/supabase-db"
import { parseKawasanInput } from "@/lib/kawasan-input"

function errorResponse(error: any, fallback: string) {
  const message = String(error?.message ?? "")
  if (message.includes("sudah wujud")) return NextResponse.json({ error: message }, { status: 409 })
  if (message.includes("kawasan") && message.includes("does not exist")) {
    return NextResponse.json(
      { error: "Jadual kawasan belum wujud. Jalankan create-kawasan.sql dalam Supabase.", details: message },
      { status: 500 },
    )
  }
  return NextResponse.json({ error: fallback, details: message }, { status: 500 })
}

export async function GET(request: Request) {
  const guard = await requirePermission(request, { resource: "tetapan", action: "manage_all_units" }, ["semua", "Super Admin"])
  if (guard.denied) return guard.denied
  try {
    return NextResponse.json(await getAllKawasan())
  } catch (error: any) {
    console.error("Error fetching kawasan:", error)
    return errorResponse(error, "Failed to fetch kawasan")
  }
}

export async function POST(request: Request) {
  // Tetapan admins, and users who add Rekod Bayaran (the + by Daripada)
  let guard = await requirePermission(request, { resource: "bayaran", action: "create" }, ["semua", "Super Admin", "PERLADANGAN"])
  if (guard.denied) {
    guard = await requirePermission(
      request,
      [{ resource: "tetapan", action: "manage_all_units" }, { resource: "tetapan", action: "edit" }],
      ["semua", "Super Admin"],
    )
  }
  if (guard.denied) return guard.denied
  try {
    const input = parseKawasanInput(await request.json())
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 })
    return NextResponse.json(await addKawasan(input), { status: 201 })
  } catch (error: any) {
    console.error("Error adding kawasan:", error)
    return errorResponse(error, "Failed to add kawasan")
  }
}
