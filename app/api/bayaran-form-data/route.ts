import { NextResponse } from "next/server"
import {
  getDaripadaKepadaValues,
  getStatusLadangData,
  getContractCategoryData,
  getPenerimaData,
  getStatusBayaranData,
} from "@/lib/supabase-db"

export async function GET() {
  try {
    // Fetch all required data in parallel
    const [daripadaSuggestions, statusLadangData, contractCategoryData, penerimaData, statusBayaranData] =
      await Promise.all([
        getDaripadaKepadaValues(),
        getStatusLadangData(),
        getContractCategoryData(),
        getPenerimaData(),
        getStatusBayaranData(),
      ])

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
      // kawasan -> contractors of its AKTIF PIECERATE kontrak (Nama Kontraktor for a PIECERATE bayaran)
      piecerateKontraktor: contractCategoryData.piecerateKontraktor,
      penerimaData,
      statusBayaranData,
    })
  } catch (error) {
    console.error("Error fetching form data:", error)
    return NextResponse.json({ error: "Failed to fetch form data" }, { status: 500 })
  }
}
