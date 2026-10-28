import { type NextRequest, NextResponse } from "next/server"
import { getAllSurat, addSurat, updateSurat, deleteSurat, getSuratRow } from "@/lib/supabase-db"
import { SURAT_AUDIT_FIELDS, diffRows, getActor, logSuratAudit } from "@/lib/audit"
import { getSession } from "@/lib/session"

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
    const session = await getSession(request)
    const generatedBil = await addSurat(0, body, session?.uid) // rowIndex not used anymore

    const created = await getSuratRow(generatedBil).catch(() => null)
    await logSuratAudit({
      suratId: created?.id,
      bil: generatedBil,
      action: "CREATE",
      actor: await getActor(request),
      details: `Surat #${generatedBil} dikeyin`,
      changes: diffRows(null, created, SURAT_AUDIT_FIELDS),
    })
    
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

    const before = await getSuratRow(rowIndex).catch(() => null)
    await updateSurat(rowIndex, data)
    const after = await getSuratRow(data.bil ?? rowIndex).catch(() => null)
    const changes = diffRows(before, after, SURAT_AUDIT_FIELDS)
    if (changes.length > 0) {
      const statusChange = changes.find((c) => c.field === "status")
      await logSuratAudit({
        suratId: after?.id ?? before?.id,
        bil: after?.bil ?? rowIndex,
        action: "UPDATE",
        actor: await getActor(request),
        details: statusChange ? `Status: ${statusChange.from || "-"} → ${statusChange.to || "-"}` : `${changes.length} medan dikemaskini`,
        changes,
      })
    }
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
    const before = await getSuratRow(rowIndex).catch(() => null)
    await deleteSurat(rowIndex)
    await logSuratAudit({
      suratId: before?.id,
      bil: rowIndex,
      action: "DELETE",
      actor: await getActor(request),
      details: `Surat #${rowIndex} dipadam`,
      // Keeps what was deleted
      changes: diffRows(before, null, SURAT_AUDIT_FIELDS),
    })
    console.log("deleteSurat completed successfully")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting surat:", error)
    console.error("Error stack:", error?.stack)
    return NextResponse.json({ error: "Failed to delete data", details: error?.message || String(error) }, { status: 500 })
  }
}
