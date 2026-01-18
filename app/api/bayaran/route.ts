import { type NextRequest, NextResponse } from "next/server"
import { getAllBayaran, addBayaran } from "@/lib/supabase-db"
import { BayaranSchema } from "@/types/bayaran-schema"
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
    
    const { user, ...bayaranData } = body

    // Step 2: Validate with Zod
    let validatedData: any
    try {
      validatedData = BayaranSchema.parse(bayaranData)
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
      namaKontraktor: "", // Will be auto-populated by supabase-db
    }

    // Step 4: Add to database
    try {
      await addBayaran(formattedData, user || "Unknown")
    } catch (dbError) {
      console.error("Database Error:", dbError)
      return NextResponse.json({ 
        error: "Database operation failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: "Bayaran record added successfully" })
    
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
