import { type NextRequest, NextResponse } from "next/server"
import { getAllSurat, addSurat, updateSurat, deleteSurat } from "@/lib/supabase-db"

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables for Supabase")
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 },
      )
    }

    const data = await getAllSurat()

    // Ensure we're returning an array even if the API returns null or undefined
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error: any) {
    console.error("Error fetching data:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from Supabase", details: error?.message || String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.unit || !body.tindakanPic || !body.status) {
      return NextResponse.json({ error: "Unit, Tindakan PIC, and Status are required fields" }, { status: 400 })
    }

    // addSurat will now return the database-generated BIL
    // No need to calculate next BIL manually - database sequence handles it
    const generatedBil = await addSurat(0, body) // rowIndex not used anymore
    
    return NextResponse.json({ success: true, bil: generatedBil })
  } catch (error: any) {
    console.error("Error adding surat:", error)
    return NextResponse.json({ error: "Failed to add data", details: error?.message || String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowIndex, data } = body

    // Validate required fields
    if (!data.unit || !data.tindakanPic || !data.status) {
      return NextResponse.json({ error: "Unit, Tindakan PIC, and Status are required fields" }, { status: 400 })
    }

    await updateSurat(rowIndex, data)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating surat:", error)
    return NextResponse.json({ error: "Failed to update data", details: error?.message || String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rowIndexParam = searchParams.get("rowIndex")
    
    console.log("DELETE request received")
    console.log("rowIndex param:", rowIndexParam)
    
    const rowIndex = Number.parseInt(rowIndexParam || "0", 10)
    
    console.log("Parsed rowIndex:", rowIndex)

    if (isNaN(rowIndex)) {
      console.error("Invalid rowIndex - NaN")
      return NextResponse.json({ error: "Invalid row index" }, { status: 400 })
    }

    console.log("Calling deleteSurat with bil:", rowIndex)
    await deleteSurat(rowIndex)
    console.log("deleteSurat completed successfully")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting surat:", error)
    console.error("Error stack:", error?.stack)
    return NextResponse.json({ error: "Failed to delete data", details: error?.message || String(error) }, { status: 500 })
  }
}
