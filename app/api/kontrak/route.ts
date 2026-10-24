import { NextResponse } from "next/server"
import { getAllKontrak, addKontrak } from "@/lib/supabase-db"
import { parseKontrakInput } from "@/lib/kontrak-input"
import { kontrakErrorResponse } from "@/lib/kontrak-api"

export async function GET() {
  try {
    const data = await getAllKontrak()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching kontrak:", error)
    return kontrakErrorResponse(error, "Failed to fetch kontrak")
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
    return kontrakErrorResponse(error, "Failed to add kontrak")
  }
}
