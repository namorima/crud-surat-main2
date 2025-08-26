import { google } from "googleapis"
import type { Surat } from "@/types/surat"
import type { User } from "@/types/user"
import type { Bayaran } from "@/types/bayaran"

// Initialize the Google Sheets API
const initializeSheets = async () => {
  try {
    // Format the private key correctly
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || ""

    // If the private key doesn't contain newlines, replace escaped newlines
    if (!privateKey.includes("\n") && privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n")
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL || "",
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    return sheets
  } catch (error) {
    console.error("Error initializing Google Sheets:", error)
    throw new Error(`Failed to initialize Google Sheets: ${error.message}`)
  }
}

// Get all data from the SURAT sheet
export async function getAllSurat(): Promise<Surat[]> {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SURAT!A2:L",
    })

    const rows = response.data.values || []

    // If no data is returned, return an empty array instead of null
    if (!rows || rows.length === 0) {
      return []
    }

    return rows.map((row, index) => ({
      id: index.toString(),
      bil: Number.parseInt(row[0]) || 0,
      daripadaKepada: row[1] || "",
      tarikh: row[2] || "",
      perkara: row[3] || "",
      kategori: row[4] || "",
      unit: row[5] || "",
      fail: row[6] || "",
      tindakanPic: row[7] || "",
      status: (row[8] || "BELUM PROSES") as "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL",
      tarikhSelesai: row[9] || null,
      nota: row[10] || "",
      komen: row[11] || "",
    }))
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error)
    throw new Error(`Failed to fetch data from Google Sheets: ${error.message}`)
  }
}

// Get all users from the AUTH sheet
export async function getAllUsers(): Promise<User[]> {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "AUTH!A2:D",
    })

    const rows = response.data.values || []

    // If no data is returned, return an empty array instead of null
    if (!rows || rows.length === 0) {
      return []
    }

    return rows.map((row, index) => ({
      id: row[0] || index.toString(),
      password: row[1] || "",
      name: row[2] || "",
      role: row[3] || "viewer",
    }))
  } catch (error) {
    console.error("Error fetching users from Google Sheets:", error)
    throw new Error(`Failed to fetch users from Google Sheets: ${error.message}`)
  }
}



// Get unique daripada/kepada values from SURAT sheet
export async function getDaripadaKepadaValues() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SURAT!B2:B",
    })

    const rows = response.data.values || []

    // If no data is returned, return empty array
    if (!rows || rows.length === 0) {
      return []
    }

    // Extract unique values
    const values = rows.map((row) => row[0] || "").filter((val) => val.trim() !== "")
    const uniqueValues = Array.from(new Set(values))

    // Ensure we have at least one value
    if (uniqueValues.length === 0) {
      uniqueValues.push("Tiada data")
    }

    return uniqueValues
  } catch (error) {
    console.error("Error fetching daripada/kepada values from Google Sheets:", error)
    return []
  }
}

// Add a new row to the sheet - Fixed to prevent skipping rows
export async function addSurat(rowIndex: number, surat: Omit<Surat, "id">): Promise<void> {
  try {
    const sheets = await initializeSheets()

    // Append the new row directly to the end of the data
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SURAT!A2:L",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            surat.bil,
            surat.daripadaKepada,
            surat.tarikh,
            surat.perkara,
            surat.kategori,
            surat.unit,
            surat.fail,
            surat.tindakanPic,
            surat.status,
            surat.tarikhSelesai,
            surat.nota,
            surat.komen,
          ],
        ],
      },
    })
  } catch (error) {
    console.error("Error adding data to Google Sheets:", error)
    throw new Error(`Failed to add data to Google Sheets: ${error.message}`)
  }
}

// Update a row in the sheet
export async function updateSurat(rowIndex: number, surat: Omit<Surat, "id">): Promise<void> {
  try {
    const sheets = await initializeSheets()
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `SURAT!A${rowIndex + 2}:L${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            surat.bil,
            surat.daripadaKepada,
            surat.tarikh,
            surat.perkara,
            surat.kategori,
            surat.unit,
            surat.fail,
            surat.tindakanPic,
            surat.status,
            surat.tarikhSelesai,
            surat.nota,
            surat.komen,
          ],
        ],
      },
    })
  } catch (error) {
    console.error("Error updating data in Google Sheets:", error)
    throw new Error(`Failed to update data in Google Sheets: ${error.message}`)
  }
}

// Delete a row from the sheet - Fixed to handle errors properly
export async function deleteSurat(rowIndex: number): Promise<void> {
  try {
    const sheets = await initializeSheets()

    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    })

    // Find the SURAT sheet ID
    const sheetId =
      spreadsheet.data.sheets?.find((sheet) => sheet.properties?.title === "SURAT")?.properties?.sheetId || 0

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1, // +1 because of header row
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    console.error("Error deleting data from Google Sheets:", error)
    throw new Error(`Failed to delete data from Google Sheets: ${error.message}`)
  }
}

// Get all data from the REKOD BAYARAN sheet - Updated to include new columns
export async function getAllBayaran(): Promise<Bayaran[]> {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "REKOD BAYARAN!A2:R", // Extended to column R
    })

    const rows = response.data.values || []

    // If no data is returned, return an empty array instead of null
    if (!rows || rows.length === 0) {
      return []
    }

    return rows.map((row, index) => ({
      id: row[0] || (index + 1).toString(), // Use actual ID from column A
      daripada: row[1] || "",
      tarikhTerima: row[2] || "", // Combined TARIKH TERIMA
      perkara: row[3] || "",
      nilaiBayaran: row[4] || "",
      bayaranKe: row[5] || "",
      kategori: row[6] || "",
      noKontrak: row[7] || "",
      tarikhMemoLadang: row[8] || "",
      statusLadang: row[9] || "",
      tarikhHantar: row[10] || "",
      penerima: row[11] || "",
      statusBayaran: row[12] || "",
      tarikhBayar: row[13] || "",
      nomborBaucer: row[14] || "",
      notaKaki: row[15] || "",
      tarikhPpnP: row[16] || "", // New field - Column Q
      tarikhPn: row[17] || "", // New field - Column R
    }))
  } catch (error) {
    console.error("Error fetching bayaran data from Google Sheets:", error)
    throw new Error(`Failed to fetch bayaran data from Google Sheets: ${error.message}`)
  }
}

// Add a new bayaran record to the REKOD BAYARAN sheet
export async function addBayaran(bayaran: Omit<Bayaran, "id">): Promise<void> {
  try {
    const sheets = await initializeSheets()

    // Get the current data to determine the next ID
    const currentData = await getAllBayaran()
    const nextId =
      currentData.length > 0 ? Math.max(...currentData.map((item) => Number.parseInt(item.id) || 0)) + 1 : 1

    // Prepare the row data in the correct order
    const rowData = [
      nextId, // Column A - ID
      bayaran.daripada || "", // Column B
      bayaran.tarikhTerima || "", // Column C
      bayaran.perkara || "", // Column D
      bayaran.nilaiBayaran || "", // Column E
      bayaran.bayaranKe || "", // Column F
      bayaran.kategori || "", // Column G
      bayaran.noKontrak || "", // Column H
      bayaran.tarikhMemoLadang || "", // Column I
      bayaran.statusLadang || "", // Column J
      bayaran.tarikhHantar || "", // Column K
      bayaran.penerima || "", // Column L
      bayaran.statusBayaran || "", // Column M
      bayaran.tarikhBayar || "", // Column N
      bayaran.nomborBaucer || "", // Column O
      bayaran.notaKaki || "", // Column P
      bayaran.tarikhPpnP || "", // Column Q
      bayaran.tarikhPn || "", // Column R
    ]

    console.log("Adding bayaran with data:", rowData)

    // Append the new row directly to the end of the data
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "REKOD BAYARAN!A2:R",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowData],
      },
    })

    console.log("Bayaran added successfully:", result.data)
  } catch (error) {
    console.error("Error adding bayaran to Google Sheets:", error)
    throw new Error(`Failed to add bayaran to Google Sheets: ${error.message}`)
  }
}

// Update a bayaran record in the REKOD BAYARAN sheet
export async function updateBayaran(rowIndex: number, bayaran: Omit<Bayaran, "id">): Promise<void> {
  try {
    const sheets = await initializeSheets()
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `REKOD BAYARAN!A${rowIndex + 2}:R${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            bayaran.id, // Keep the existing ID
            bayaran.daripada,
            bayaran.tarikhTerima,
            bayaran.perkara,
            bayaran.nilaiBayaran,
            bayaran.bayaranKe,
            bayaran.kategori,
            bayaran.noKontrak,
            bayaran.tarikhMemoLadang,
            bayaran.statusLadang,
            bayaran.tarikhHantar,
            bayaran.penerima,
            bayaran.statusBayaran,
            bayaran.tarikhBayar,
            bayaran.nomborBaucer,
            bayaran.notaKaki,
            bayaran.tarikhPpnP,
            bayaran.tarikhPn,
          ],
        ],
      },
    })
  } catch (error) {
    console.error("Error updating bayaran in Google Sheets:", error)
    throw new Error(`Failed to update bayaran in Google Sheets: ${error.message}`)
  }
}

// Delete a row from the REKOD BAYARAN sheet
export async function deleteBayaran(rowIndex: number): Promise<void> {
  try {
    const sheets = await initializeSheets()

    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    })

    // Find the REKOD BAYARAN sheet ID
    const sheetId =
      spreadsheet.data.sheets?.find((sheet) => sheet.properties?.title === "REKOD BAYARAN")?.properties?.sheetId || 0

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1, // +1 because of header row
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    console.error("Error deleting bayaran from Google Sheets:", error)
    throw new Error(`Failed to delete bayaran from Google Sheets: ${error.message}`)
  }
}

// Get Status Ladang data from AUTH sheet column P and Q
export async function getStatusLadangData() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "AUTH!P2:Q",
    })

    const rows = response.data.values || []

    if (!rows || rows.length === 0) {
      return []
    }

    return rows
      .map((row) => ({
        status: row[0] || "",
        colorHex: row[1] || "#6b7280", // Default gray color
      }))
      .filter((item) => item.status.trim() !== "")
  } catch (error) {
    console.error("Error fetching status ladang data from Google Sheets:", error)
    return []
  }
}

// Get Penerima data from UNIT sheet
export async function getPenerimaData() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "UNIT!A2:C", // Fetch Unit, PIC, and potential default status
    })

    const rows = response.data.values || []

    if (!rows || rows.length === 0) {
      return []
    }

    return rows
      .map((row) => {
        const unit = row[0] || ""
        const name = row[1] || ""
        const defaultStatus = row[2] || "" // Column C for default status

        return {
          unit,
          name,
          display: `${name} (${unit})`,
          defaultStatus,
        }
      })
      .filter((item) => item.name.trim() !== "" && item.unit.trim() !== "")
  } catch (error) {
    console.error("Error fetching penerima data from Google Sheets:", error)
    return []
  }
}

// Get contract and category data from AUTH sheet - Updated for LADANG NEGERI logic
export async function getContractCategoryData() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "AUTH!L2:N",
    })

    const rows = response.data.values || []

    if (!rows || rows.length === 0) {
      return { contractData: {}, categoryData: {}, allContracts: [], allCategories: [] }
    }

    // Group data by daripada (column L)
    const contractData: Record<string, string[]> = {}
    const categoryData: Record<string, Record<string, string[]>> = {}
    const allContracts: string[] = []
    const allCategories: string[] = []

    rows.forEach((row) => {
      const daripada = row[0] || ""
      const noKontrak = row[1] || ""
      const kategori = row[2] || ""

      if (daripada.trim() === "") return

      // Build contract data
      if (!contractData[daripada]) {
        contractData[daripada] = []
      }
      if (noKontrak && !contractData[daripada].includes(noKontrak)) {
        contractData[daripada].push(noKontrak)
      }

      // Build category data
      if (!categoryData[daripada]) {
        categoryData[daripada] = {}
      }
      if (!categoryData[daripada][noKontrak]) {
        categoryData[daripada][noKontrak] = []
      }
      if (kategori && !categoryData[daripada][noKontrak].includes(kategori)) {
        categoryData[daripada][noKontrak].push(kategori)
      }

      // Collect all contracts and categories for LADANG NEGERI
      if (noKontrak && !allContracts.includes(noKontrak)) {
        allContracts.push(noKontrak)
      }
      if (kategori && !allCategories.includes(kategori)) {
        allCategories.push(kategori)
      }
    })

    return { contractData, categoryData, allContracts, allCategories }
  } catch (error) {
    console.error("Error fetching contract and category data from Google Sheets:", error)
    return { contractData: {}, categoryData: {}, allContracts: [], allCategories: [] }
  }
}

// Get Status Bayaran data from AUTH sheet column X and Y
export async function getStatusBayaranData() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "AUTH!X2:Y",
    })

    const rows = response.data.values || []

    if (!rows || rows.length === 0) {
      return []
    }

    return rows
      .map((row) => ({
        status: row[0] || "",
        colorHex: row[1] || "#6b7280", // Default gray color
      }))
      .filter((item) => item.status.trim() !== "")
  } catch (error) {
    console.error("Error fetching status bayaran data from Google Sheets:", error)
    return []
  }
}
// Get Unit and PIC data from UNIT sheet
export async function getUnitAndPicData() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "UNIT!A2:B",
    })

    const rows = response.data.values || []

    if (!rows || rows.length === 0) {
      return { units: [], unitPicMap: {} }
    }

    const unitPicMap: Record<string, string[]> = {}

    rows.forEach((row) => {
      const unit = row[0] || ""
      const pic = row[1] || ""

      if (unit) {
        if (!unitPicMap[unit]) {
          unitPicMap[unit] = []
        }
        if (pic && !unitPicMap[unit].includes(pic)) {
          unitPicMap[unit].push(pic)
        }
      }
    })

    const units = Object.keys(unitPicMap)

    return { units, unitPicMap }
  } catch (error) {
    console.error("Error fetching unit and PIC data from Google Sheets:", error)
    return { units: [], unitPicMap: {} }
  }
}