/**
 * Migration Script: Google Sheets to Supabase
 * 
 * This script migrates all data from Google Sheets to Supabase database.
 * Run this script AFTER creating the database schema in Supabase.
 * 
 * Usage: npx tsx scripts/migrate-to-supabase.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv"
config({ path: ".env.local" })

import { supabaseAdmin } from "../lib/supabase"
import {
  getAllSurat,
  getAllBayaran,
  getAllFail,
  getAllUsers,
  getUnitAndPicData,
  getContractCategoryData,
  getStatusLadangData,
  getStatusBayaranData,
  getAllShareLinks,
} from "../lib/google-sheets"

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD
function convertDateFormat(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === "") return null
  
  try {
    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split("/")
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    
    return null
  } catch (error) {
    console.warn(`Failed to convert date: ${dateStr}`)
    return null
  }
}

interface MigrationStats {
  table: string
  totalRecords: number
  successCount: number
  errorCount: number
  errors: string[]
}

async function migrateSurat(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "surat",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("📋 Migrating SURAT data...")
    const suratData = await getAllSurat()
    stats.totalRecords = suratData.length

    for (const surat of suratData) {
      try {
        // Skip records with empty required fields
        const tarikhConverted = convertDateFormat(surat.tarikh)
        if (!tarikhConverted) {
          stats.errorCount++
          stats.errors.push(`Bil ${surat.bil}: Skipped - empty tarikh field`)
          continue
        }

        const { error } = await supabaseAdmin.from("surat").insert({
          bil: surat.bil,
          daripada_kepada: surat.daripadaKepada,
          tarikh: tarikhConverted,
          perkara: surat.perkara,
          kategori: surat.kategori,
          unit: surat.unit,
          fail: surat.fail || null,
          tindakan_pic: surat.tindakanPic || null,
          status: surat.status,
          tarikh_selesai: convertDateFormat(surat.tarikhSelesai),
          nota: surat.nota || null,
          komen: surat.komen || null,
          reference: surat.reference || null,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`Bil ${surat.bil}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`Bil ${surat.bil}: ${err.message}`)
      }
    }

    console.log(`✅ SURAT: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating SURAT:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateBayaran(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "bayaran",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("💰 Migrating BAYARAN data...")
    const bayaranData = await getAllBayaran()
    stats.totalRecords = bayaranData.length

    for (const bayaran of bayaranData) {
      try {
        // Skip records with empty required fields
        const tarikhTerimaConverted = convertDateFormat(bayaran.tarikhTerima)
        if (!tarikhTerimaConverted) {
          stats.errorCount++
          stats.errors.push(`ID ${bayaran.id}: Skipped - empty tarikh_terima field`)
          continue
        }

        const { error } = await supabaseAdmin.from("bayaran").insert({
          daripada: bayaran.daripada,
          tarikh_terima: tarikhTerimaConverted,
          perkara: bayaran.perkara,
          nilai_bayaran: bayaran.nilaiBayaran,
          bayaran_ke: bayaran.bayaranKe || null,
          kategori: bayaran.kategori || null,
          no_kontrak: bayaran.noKontrak || null,
          nama_kontraktor: bayaran.namaKontraktor || null,
          tarikh_memo_ladang: convertDateFormat(bayaran.tarikhMemoLadang),
          status_ladang: bayaran.statusLadang || null,
          tarikh_hantar: convertDateFormat(bayaran.tarikhHantar),
          tarikh_ppnp: convertDateFormat(bayaran.tarikhPpnP),
          tarikh_pn: convertDateFormat(bayaran.tarikhPn),
          penerima: bayaran.penerima || null,
          status_bayaran: bayaran.statusBayaran || null,
          tarikh_bayar: convertDateFormat(bayaran.tarikhBayar),
          nombor_baucer: bayaran.nomborBaucer || null,
          nota_kaki: bayaran.notaKaki || null,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`ID ${bayaran.id}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`ID ${bayaran.id}: ${err.message}`)
      }
    }

    console.log(`✅ BAYARAN: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating BAYARAN:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateFail(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "fail",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("📁 Migrating FAIL data...")
    const failData = await getAllFail()
    stats.totalRecords = failData.length

    for (const fail of failData) {
      try {
        const { error } = await supabaseAdmin.from("fail").insert({
          part: fail.part,
          no_locker: fail.noLocker || null,
          no_fail: fail.noFail,
          pecahan: fail.pecahan || null,
          pecahan_kecil: fail.pecahanKecil || null,
          unit: fail.unit,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`ID ${fail.id}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`ID ${fail.id}: ${err.message}`)
      }
    }

    console.log(`✅ FAIL: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating FAIL:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateUsers(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "users",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("👥 Migrating USERS data...")
    const usersData = await getAllUsers()
    stats.totalRecords = usersData.length

    for (const user of usersData) {
      try {
        const { error } = await supabaseAdmin.from("users").insert({
          username: user.id,
          password: user.password,
          name: user.name,
          role: user.role,
          type: user.type || null,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`User ${user.id}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`User ${user.id}: ${err.message}`)
      }
    }

    console.log(`✅ USERS: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating USERS:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateUnitPic(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "unit_pic",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("🏢 Migrating UNIT_PIC data...")
    const { units, unitPicMap } = await getUnitAndPicData()

    const unitPicRecords: { unit: string; pic: string }[] = []
    for (const unit of units) {
      const pics = unitPicMap[unit] || []
      for (const pic of pics) {
        unitPicRecords.push({ unit, pic })
      }
    }

    stats.totalRecords = unitPicRecords.length

    for (const record of unitPicRecords) {
      try {
        const { error } = await supabaseAdmin.from("unit_pic").insert(record)

        if (error) {
          stats.errorCount++
          stats.errors.push(`${record.unit} - ${record.pic}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`${record.unit} - ${record.pic}: ${err.message}`)
      }
    }

    console.log(`✅ UNIT_PIC: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating UNIT_PIC:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateKontrak(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "kontrak",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("📄 Migrating KONTRAK data...")
    const { contractData, categoryData, contractorData } = await getContractCategoryData()

    const kontrakRecords: {
      kawasan: string
      no_kontrak: string
      kategori: string | null
      nama_kontraktor: string | null
    }[] = []

    for (const kawasan in contractData) {
      const contracts = contractData[kawasan]
      for (const noKontrak of contracts) {
        const categories = categoryData[kawasan]?.[noKontrak] || []
        const namaKontraktor = contractorData[noKontrak] || null

        if (categories.length > 0) {
          for (const kategori of categories) {
            kontrakRecords.push({
              kawasan,
              no_kontrak: noKontrak,
              kategori,
              nama_kontraktor: namaKontraktor,
            })
          }
        } else {
          kontrakRecords.push({
            kawasan,
            no_kontrak: noKontrak,
            kategori: null,
            nama_kontraktor: namaKontraktor,
          })
        }
      }
    }

    stats.totalRecords = kontrakRecords.length

    for (const record of kontrakRecords) {
      try {
        const { error } = await supabaseAdmin.from("kontrak").insert(record)

        if (error) {
          stats.errorCount++
          stats.errors.push(`${record.kawasan} - ${record.no_kontrak}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`${record.kawasan} - ${record.no_kontrak}: ${err.message}`)
      }
    }

    console.log(`✅ KONTRAK: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating KONTRAK:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateStatusConfig(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "status_config",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("⚙️ Migrating STATUS_CONFIG data...")
    const statusLadang = await getStatusLadangData()
    const statusBayaran = await getStatusBayaranData()

    const allStatuses = [
      ...statusLadang.map((s) => ({ ...s, kategori: "STATUS LADANG" })),
      ...statusBayaran.map((s) => ({ ...s, kategori: "STATUS BAYARAN" })),
    ]

    stats.totalRecords = allStatuses.length

    for (const status of allStatuses) {
      try {
        const { error } = await supabaseAdmin.from("status_config").insert({
          status: status.status,
          color_hex: status.colorHex,
          kategori: status.kategori,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`${status.status}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`${status.status}: ${err.message}`)
      }
    }

    console.log(`✅ STATUS_CONFIG: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating STATUS_CONFIG:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function migrateShareLinks(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "share_links",
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  try {
    console.log("🔗 Migrating SHARE_LINKS data...")
    const shareLinks = await getAllShareLinks()
    stats.totalRecords = shareLinks.length

    for (const link of shareLinks) {
      try {
        const { error } = await supabaseAdmin.from("share_links").insert({
          link_id: link.linkId,
          filter_json: JSON.parse(link.filterJson),
          created_by: link.createdBy,
          expires_at: link.expiresAt || null,
          description: link.description || null,
          access_count: link.accessCount,
        })

        if (error) {
          stats.errorCount++
          stats.errors.push(`Link ${link.linkId}: ${error.message}`)
        } else {
          stats.successCount++
        }
      } catch (err: any) {
        stats.errorCount++
        stats.errors.push(`Link ${link.linkId}: ${err.message}`)
      }
    }

    console.log(`✅ SHARE_LINKS: ${stats.successCount}/${stats.totalRecords} migrated`)
  } catch (error: any) {
    console.error("❌ Error migrating SHARE_LINKS:", error.message)
    stats.errors.push(`Fatal error: ${error.message}`)
  }

  return stats
}

async function runMigration() {
  console.log("🚀 Starting migration from Google Sheets to Supabase...")
  console.log("=" .repeat(60))

  const allStats: MigrationStats[] = []

  // Run migrations in sequence
  allStats.push(await migrateUsers())
  allStats.push(await migrateUnitPic())
  allStats.push(await migrateKontrak())
  allStats.push(await migrateStatusConfig())
  allStats.push(await migrateSurat())
  allStats.push(await migrateBayaran())
  allStats.push(await migrateFail())
  allStats.push(await migrateShareLinks())

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 MIGRATION SUMMARY")
  console.log("=".repeat(60))

  let totalRecords = 0
  let totalSuccess = 0
  let totalErrors = 0

  for (const stat of allStats) {
    totalRecords += stat.totalRecords
    totalSuccess += stat.successCount
    totalErrors += stat.errorCount

    console.log(`\n${stat.table.toUpperCase()}:`)
    console.log(`  Total: ${stat.totalRecords}`)
    console.log(`  Success: ${stat.successCount}`)
    console.log(`  Errors: ${stat.errorCount}`)

    if (stat.errors.length > 0) {
      console.log(`  Error details:`)
      stat.errors.slice(0, 5).forEach((err) => console.log(`    - ${err}`))
      if (stat.errors.length > 5) {
        console.log(`    ... and ${stat.errors.length - 5} more errors`)
      }
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`OVERALL: ${totalSuccess}/${totalRecords} records migrated successfully`)
  console.log(`Total errors: ${totalErrors}`)
  console.log("=".repeat(60))

  if (totalErrors === 0) {
    console.log("\n✅ Migration completed successfully!")
  } else {
    console.log("\n⚠️ Migration completed with some errors. Please review the logs above.")
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error("💥 Fatal error during migration:", error)
  process.exit(1)
})
