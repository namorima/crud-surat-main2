import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/server-auth"
import { getAllKontraktor, addKontraktor } from "@/lib/supabase-db"
import { parseKontraktorInput } from "@/lib/kontraktor-input"

function errorResponse(error: any, fallback: string) {
  const message = String(error?.message ?? "")
  if (message.includes("sudah wujud")) return NextResponse.json({ error: message }, { status: 409 })
  if (message.includes("kontraktor") && message.includes("does not exist")) {
    return NextResponse.json(
      { error: "Jadual kontraktor belum wujud. Jalankan create-kontraktor.sql dalam Supabase.", details: message },
      { status: 500 },
    )
  }
  return NextResponse.json({ error: fallback, details: message }, { status: 500 })
}

export async function GET(request: Request) {
  const guard = await requirePermission(request, { resource: "tetapan", action: "manage_all_units" }, ["semua", "Super Admin"])
  if (guard.denied) return guard.denied
  try {
    return NextResponse.json(await getAllKontraktor())
  } catch (error: any) {
    console.error("Error fetching kontraktor:", error)
    return errorResponse(error, "Failed to fetch kontraktor")
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission(
    request,
    [{ resource: "tetapan", action: "manage_all_units" }, { resource: "tetapan", action: "edit" }],
    ["semua", "Super Admin"],
  )
  if (guard.denied) return guard.denied
  try {
    const input = parseKontraktorInput(await request.json())
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 })
    return NextResponse.json(await addKontraktor(input), { status: 201 })
  } catch (error: any) {
    console.error("Error adding kontraktor:", error)
    return errorResponse(error, "Failed to add kontraktor")
  }
}
