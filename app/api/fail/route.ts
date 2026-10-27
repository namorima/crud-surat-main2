import { NextResponse } from "next/server"
import { getAllFail, addFail, disableMatchingFails } from "@/lib/supabase-db"

export async function GET() {
  try {
    const data = await getAllFail()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching FAIL data:", error)
    return NextResponse.json(
      { error: "Failed to fetch FAIL data from Supabase", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation
    if (!body.part || !body.noFail || !body.unit) {
      return NextResponse.json({ error: "Missing required fields: part, noFail, unit" }, { status: 400 })
    }

    const newFail = await addFail(body)
    // The new fail replaces older ones with the same unit, part, locker and no fail
    const disabledIds = body.disableExisting ? await disableMatchingFails(newFail) : []
    return NextResponse.json({ ...newFail, disabledIds }, { status: 201 })
  } catch (error) {
    console.error("Error adding FAIL:", error)
    return NextResponse.json(
      { error: "Failed to add FAIL to Supabase", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
