import { NextResponse } from "next/server"
import { google } from "googleapis"

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

// Get FX notifications data
export async function getFXNotifications() {
  try {
    const sheets = await initializeSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "FX!A2:F",
    })

    const rows = response.data.values || []

    // If no data is returned, return an empty array
    if (!rows || rows.length === 0) {
      return []
    }

    return rows
      .map((row, index) => ({
        id: index.toString(),
        bil: Number.parseInt(row[0]) || 0,
        perkara: row[1] || "",
        unit: row[2] || "",
        tindakan: row[3] || "",
        status: row[4] || "",
        hari: Number.parseInt(row[5]) || 0,
      }))
      .filter((item) => {
        // Filter out invalid BIL numbers
        return item.bil > 0 && !isNaN(item.bil) && item.bil.toString() !== "N/A"
      })
  } catch (error) {
    console.error("Error fetching FX notifications from Google Sheets:", error)
    throw new Error(`Failed to fetch FX notifications: ${error.message}`)
  }
}

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing required environment variables for Google Sheets API")
      return NextResponse.json(
        { error: "Server configuration error: Missing Google Sheets credentials" },
        { status: 500 },
      )
    }

    const data = await getFXNotifications()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching FX notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch FX notifications from Google Sheets", details: error.message },
      { status: 500 },
    )
  }
}
