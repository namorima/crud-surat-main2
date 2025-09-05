import { NextResponse } from "next/server"
import {
  getDaripadaKepadaValues,
  getStatusLadangData,
  getContractCategoryData,
  getPenerimaData,
  getStatusBayaranData,
  getAllBayaran,
} from "@/lib/google-sheets"

export async function GET() {
  try {
    // Fetch all required data in parallel
    const [daripadaSuggestions, statusLadangData, contractCategoryData, penerimaData, statusBayaranData, allBayaran] =
      await Promise.all([
        getDaripadaKepadaValues(),
        getStatusLadangData(),
        getContractCategoryData(),
        getPenerimaData(),
        getStatusBayaranData(),
        getAllBayaran(),
      ])

    return NextResponse.json({
      daripadaSuggestions,
      statusLadangData, // Use data from AUTH sheet with colors
      contractData: contractCategoryData.contractData,
      categoryData: contractCategoryData.categoryData,
      allContracts: contractCategoryData.allContracts,
      allCategories: contractCategoryData.allCategories,
      penerimaData,
      statusBayaranData,
    })
  } catch (error) {
    console.error("Error fetching form data:", error)
    return NextResponse.json({ error: "Failed to fetch form data" }, { status: 500 })
  }
}
