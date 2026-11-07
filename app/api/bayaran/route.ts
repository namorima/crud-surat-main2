import { type NextRequest, NextResponse } from "next/server"
import { getAllBayaran, addBayaran, selesaikanSuratDariBayaran } from "@/lib/supabase-db"
import { SURAT_AUDIT_FIELDS, diffRows, getActor, logSuratAudit } from "@/lib/audit"
import { BayaranBaruSchema, KONTRAKTOR_BY_NAME, LEBIH_5K } from "@/types/bayaran-schema"
import { z } from "zod"

export async function GET() {
  try {
    const data = await getAllBayaran()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/bayaran:", error)
    return NextResponse.json({ error: "Failed to fetch bayaran data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: any
  
  try {
    // Step 1: Parse JSON
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError)
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: jsonError instanceof Error ? jsonError.message : String(jsonError)
      }, { status: 400 })
    }
    
    console.log("=== POST /api/bayaran ===")
    console.log("Body keys:", Object.keys(body))
    
    // dariSuratBil: made with "Respon To Bayaran" on that surat
    const { user, dariSuratBil, ...bayaranData } = body

    // Step 2: Validate with Zod
    let validatedData: any
    try {
      // A new record needs Perkara, Nilai Bayaran and Bayaran Ke
      validatedData = BayaranBaruSchema.parse(bayaranData)
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error("Validation Error:", zodError.errors)
        return NextResponse.json({ 
          error: "Validation failed", 
          details: zodError.errors 
        }, { status: 400 })
      }
      throw zodError
    }

    // Step 3: Pass data directly (dates already in YYYY-MM-DD format)
    const formattedData = {
      ...validatedData,
      // Looked up from the kontrak by supabase-db; a PIECERATE or LEBIH 5K bayaran
      // has no kontrak and keeps the contractor picked in the form
      namaKontraktor: KONTRAKTOR_BY_NAME.includes(validatedData.jenisBayaran ?? "") ? validatedData.namaKontraktor || "" : "",
      // "Respon To Bayaran": remember the surat it answers (Reference Bayaran)
      suratBil: Number.isInteger(Number(dariSuratBil)) && Number(dariSuratBil) > 0 ? Number(dariSuratBil) : null,
      // LEBIH 5K has no kategori or kontrak
      ...(validatedData.jenisBayaran === LEBIH_5K ? { kategori: "", noKontrak: "" } : {}),
      // A WCP bayaran has no Bayaran Ke
      bayaranKe: validatedData.jenisBayaran === "WCP" ? "" : validatedData.bayaranKe,
      // Only a KEMAJUAN bayaran can be the last (Akhir) one (left as is when not sent)
      bayaranAkhir:
        validatedData.bayaranAkhir === undefined ? undefined : validatedData.jenisBayaran === "KEMAJUAN" && validatedData.bayaranAkhir,
      // Only a KEMAJUAN bayaran keeps Wang Tahanan (left as is when not sent)
      wangTahanan:
        validatedData.wangTahanan === undefined || validatedData.jenisBayaran === "KEMAJUAN" ? validatedData.wangTahanan : "",
    }

    // Step 4: Add to database
    const actor = await getActor(request, user)
    let baru: Awaited<ReturnType<typeof addBayaran>> = null
    try {
      // Who keyed it comes from the session; the client's name is only a fallback
      baru = await addBayaran(formattedData, actor)
    } catch (dbError) {
      console.error("Database Error:", dbError)
      return NextResponse.json({ 
        error: "Database operation failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 })
    }
    
    // Step 5: the surat it answers becomes SELESAI with today's tarikh selesai.
    // The bayaran is already saved, so a failure here only skips the surat.
    let suratSelesai: number | null = null
    const bil = Number(dariSuratBil)
    if (Number.isInteger(bil) && bil > 0) {
      try {
        const done = await selesaikanSuratDariBayaran(bil)
        if (done) {
          suratSelesai = bil
          await logSuratAudit({
            suratId: done.after.id,
            bil,
            action: "UPDATE",
            actor,
            details: `Status: ${done.before.status || "-"} → SELESAI (Respon To Bayaran)`,
            changes: diffRows(done.before, done.after, SURAT_AUDIT_FIELDS),
          })
        }
      } catch (suratError) {
        console.error("Error closing surat after Respon To Bayaran:", suratError)
      }
    }

    return NextResponse.json({ success: true, message: "Bayaran record added successfully", suratSelesai, id: baru?.id ?? null, ids: baru?.ids ?? null })
    
  } catch (error) {
    console.error("=== Unexpected Error ===")
    console.error("Error:", error)
    console.error("Type:", error?.constructor?.name)
    console.error("Message:", error instanceof Error ? error.message : String(error))
    console.error("Stack:", error instanceof Error ? error.stack : "N/A")
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      type: error?.constructor?.name || "Unknown"
    }, { status: 500 })
  }
}

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForSheet(dateString: string): string {
  if (!dateString) return ""
  try {
    const [year, month, day] = dateString.split("-")
    if (!year || !month || !day) {
      console.warn("Invalid date format:", dateString)
      return ""
    }
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateString)
    return ""
  }
}
