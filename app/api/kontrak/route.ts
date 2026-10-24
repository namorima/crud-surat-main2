import { NextResponse } from "next/server"
import { getAllKontrak, addKontrak } from "@/lib/supabase-db"
import { parseKontrakInput } from "@/lib/kontrak-input"

export async function GET() {
  try {
    const data = await getAllKontrak()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching kontrak:", error)
    return NextResponse.json({ error: "Failed to fetch kontrak", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const input = parseKontrakInput(await request.json())
    if (typeof input === "string") {
      return NextResponse.json({ error: input }, { status: 400 })
    }
    const result = await addKontrak(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error adding kontrak:", error)
    const duplicate = String(error.message).includes("sudah wujud")
    return NextResponse.json(
      { error: duplicate ? error.message : "Failed to add kontrak", details: error.message },
      { status: duplicate ? 409 : 500 },
    )
  }
}
