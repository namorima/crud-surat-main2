import { NextResponse } from "next/server"
import { requireUnitEdit } from "@/lib/server-auth"
import { getAllLocker, addLocker } from "@/lib/supabase-db"
import { parseLockerInput } from "@/lib/locker-input"
import { lockerErrorResponse } from "@/lib/locker-api"

// Signed-in users only (middleware); Setup Fail filters to the user's unit.
export async function GET() {
  try {
    return NextResponse.json(await getAllLocker())
  } catch (error: any) {
    console.error("Error fetching locker:", error)
    return lockerErrorResponse(error, "Failed to fetch locker")
  }
}

export async function POST(request: Request) {
  const input = parseLockerInput(await request.json().catch(() => null))
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 })
  const guard = await requireUnitEdit(request, [input.unit])
  if (guard.denied) return guard.denied
  try {
    return NextResponse.json(await addLocker(input), { status: 201 })
  } catch (error: any) {
    console.error("Error adding locker:", error)
    return lockerErrorResponse(error, "Failed to add locker")
  }
}
