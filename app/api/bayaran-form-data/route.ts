import { NextResponse } from "next/server"
import {
  getDaripadaKepadaValues,
  getStatusLadangData,
  getContractCategoryData,
  getPenerimaData,
  getStatusBayaranData,
  getKawasanNames,
  getAllKontraktor,
} from "@/lib/supabase-db"

export async function GET() {
  try {
    // Fetch all required data in parallel
    const [daripadaSuggestions, statusLadangData, contractCategoryData, penerimaData, statusBayaranData, kawasanList, kontraktorList] =
      await Promise.all([
        getDaripadaKepadaValues(),
        getStatusLadangData(),
        getContractCategoryData(),
        getPenerimaData(),
        getStatusBayaranData(),
        getKawasanNames(),
        // Names only (no bank details): Nama Kontraktor for a LEBIH 5K bayaran
        getAllKontraktor()
          .then((rows) => rows.map((row) => row.namaKontraktor).filter(Boolean))
          .catch(() => [] as string[]),
      ])

    return NextResponse.json({
      daripadaSuggestions,
      // Daripada choices of Tambah / Edit Rekod Bayaran (Tetapan → Kawasan)
      kawasanList,
      // Every contractor in Tetapan → Kontraktor (Nama Kontraktor of a LEBIH 5K bayaran)
      kontraktorList,
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
