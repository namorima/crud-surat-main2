import { NextResponse } from "next/server"
import {
  getDaripadaKepadaValues,
  getStatusLadangData,
  getContractCategoryData,
  getPenerimaData,
  getStatusBayaranData,
  getAllKontraktor,
} from "@/lib/supabase-db"

export async function GET() {
  try {
    // Fetch all required data in parallel
    const [daripadaSuggestions, statusLadangData, contractCategoryData, penerimaData, statusBayaranData, kontraktor] =
      await Promise.all([
        getDaripadaKepadaValues(),
        getStatusLadangData(),
        getContractCategoryData(),
        getPenerimaData(),
        getStatusBayaranData(),
        // The form still loads if the kontraktor list cannot be read
        getAllKontraktor().catch(() => []),
      ])

    // Nama Kontraktor choices for a PIECERATE bayaran (no kontrak): the Kontraktor
    // list plus names already used on kontrak, A-Z
    const kontraktorNames = Array.from(
      new Set([...kontraktor.map((k) => k.namaKontraktor), ...Object.values(contractCategoryData.contractorData)].filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      daripadaSuggestions,
      statusLadangData, // Use data from AUTH sheet with colors
      contractData: contractCategoryData.contractData,
      categoryData: contractCategoryData.categoryData,
      allContracts: contractCategoryData.allContracts,
      allCategories: contractCategoryData.allCategories,
      contractorData: contractCategoryData.contractorData,
      kontrakInfo: contractCategoryData.kontrakInfo,
      kontrakInfoByKawasan: contractCategoryData.kontrakInfoByKawasan,
      closedContracts: contractCategoryData.closedContracts,
      closedByKawasan: contractCategoryData.closedByKawasan,
      kontraktorNames,
      penerimaData,
      statusBayaranData,
    })
  } catch (error) {
    console.error("Error fetching form data:", error)
    return NextResponse.json({ error: "Failed to fetch form data" }, { status: 500 })
  }
}
