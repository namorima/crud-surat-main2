import { supabaseAdmin } from "./supabase"
import type { Surat } from "@/types/surat"
import type { User } from "@/types/user"
import type { Bayaran } from "@/types/bayaran"
import type { Fail } from "@/types/fail"
import type { ShareLink } from "@/types/share-link"
import type { Kontrak, KontrakInput } from "@/types/kontrak"
import type { Kontraktor, KontraktorInput } from "@/types/kontraktor"
import { hashPassword, isHashedPassword } from "./password"

// ===== SURAT FUNCTIONS =====

// Helper function to convert date from DD/MM/YYYY to YYYY-MM-DD for database storage
function formatDateToDB(dateString: string | null): string | null {
  if (!dateString) return null
  try {
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return dateString
  } catch (error) {
    console.error("Error formatting date:", error)
    return null
  }
}

// Helper function to convert date from YYYY-MM-DD to DD/MM/YYYY for display
function formatDateFromDB(dateString: string | null): string {
  if (!dateString) return ""
  try {
    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes("/")) {
      return dateString
    }
    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-")
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }
    return dateString
  } catch (error) {
    console.error("Error formatting date from DB:", error)
    return dateString || ""
  }
}

export async function getAllSurat(): Promise<Surat[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("surat")
      .select("*")
      .order("bil", { ascending: false })

    if (error) throw error

    return (
      data?.map((row) => ({
        id: row.id,
        bil: row.bil,
        daripadaKepada: row.daripada_kepada,
        tarikh: formatDateFromDB(row.tarikh),
        perkara: row.perkara,
        kategori: row.kategori,
        unit: row.unit,
        fail: row.fail || "",
        tindakanPic: row.tindakan_pic || "",
        status: row.status as "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL",
        tarikhSelesai: formatDateFromDB(row.tarikh_selesai),
        nota: row.nota || "",
        komen: row.komen || "",
        reference: row.reference || "",
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching surat from Supabase:", error)
    throw new Error(`Failed to fetch surat from Supabase: ${error.message}`)
  }
}

export async function addSurat(rowIndex: number, surat: Omit<Surat, "id" | "bil">): Promise<number> {
  try {
    // Let database auto-generate BIL using sequence
    // Don't pass bil in insert - it will use DEFAULT nextval('surat_bil_seq')
    const { data, error } = await supabaseAdmin.from("surat").insert({
      daripada_kepada: surat.daripadaKepada,
      tarikh: formatDateToDB(surat.tarikh),
      perkara: surat.perkara,
      kategori: surat.kategori,
      unit: surat.unit,
      fail: surat.fail || null,
      tindakan_pic: surat.tindakanPic || null,
      status: surat.status,
      tarikh_selesai: formatDateToDB(surat.tarikhSelesai),
      nota: surat.nota || null,
      komen: surat.komen || null,
      reference: surat.reference || null,
    })
    .select('bil')
    .single()

    if (error) throw error
    
    // Return the generated BIL
    return data.bil
  } catch (error: any) {
    console.error("Error adding surat to Supabase:", error)
    throw new Error(`Failed to add surat to Supabase: ${error.message}`)
  }
}

export async function updateSurat(bilNumber: number, surat: Omit<Surat, "id">): Promise<void> {
  try {
    // Find surat by bil number instead of array index
    const { data: existingSurat, error: fetchError } = await supabaseAdmin
      .from("surat")
      .select("id")
      .eq("bil", bilNumber)
      .single()

    if (fetchError || !existingSurat) {
      throw new Error(`Surat with bil ${bilNumber} not found`)
    }

    const { error } = await supabaseAdmin
      .from("surat")
      .update({
        bil: surat.bil,
        daripada_kepada: surat.daripadaKepada,
        tarikh: formatDateToDB(surat.tarikh),
        perkara: surat.perkara,
        kategori: surat.kategori,
        unit: surat.unit,
        fail: surat.fail || null,
        tindakan_pic: surat.tindakanPic || null,
        status: surat.status,
        tarikh_selesai: formatDateToDB(surat.tarikhSelesai),
        nota: surat.nota || null,
        komen: surat.komen || null,
        reference: surat.reference || null,
      })
      .eq("id", existingSurat.id)

    if (error) throw error
  } catch (error: any) {
    console.error("Error updating surat in Supabase:", error)
    throw new Error(`Failed to update surat in Supabase: ${error.message}`)
  }
}

export async function deleteSurat(bilNumber: number): Promise<void> {
  try {
    console.log(`Attempting to delete surat with bil: ${bilNumber}`)
    
    // Use maybeSingle() instead of single() to handle potential duplicates
    const { data: existingSurat, error: fetchError } = await supabaseAdmin
      .from("surat")
      .select("id")
      .eq("bil", bilNumber)
      .maybeSingle()

    if (fetchError) {
      console.error(`Error fetching surat with bil ${bilNumber}:`, fetchError)
      throw new Error(`Error finding surat with bil ${bilNumber}: ${fetchError.message || JSON.stringify(fetchError)}`)
    }

    if (!existingSurat) {
      throw new Error(`Surat with bil ${bilNumber} not found`)
    }

    console.log(`Found surat with id: ${existingSurat.id}, proceeding with deletion`)

    const { error } = await supabaseAdmin.from("surat").delete().eq("id", existingSurat.id)

    if (error) {
      console.error(`Error deleting surat with id ${existingSurat.id}:`, error)
      throw error
    }

    console.log(`Successfully deleted surat with bil ${bilNumber}`)
  } catch (error: any) {
    console.error("Error deleting surat from Supabase:", error)
    const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error))
    throw new Error(`Failed to delete surat from Supabase: ${errorMessage}`)
  }
}

// ===== USER FUNCTIONS =====

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("*").order("name")

    if (error) throw error

    return (
      data?.map((row) => ({
        id: row.username,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        role_id: row.role_id || undefined,
        type: row.type || "",
        email: row.email || undefined,
        is_password_changed: row.is_password_changed || false,
        must_change_password: row.must_change_password || false,
        last_password_change: row.last_password_change || undefined,
        staff_id: row.staff_id || row.username,
        is_active: row.is_active !== false,
        deactivated_at: row.deactivated_at || undefined,
        replaced_by: row.replaced_by || undefined,
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching users from Supabase:", error)
    throw new Error(`Failed to fetch users from Supabase: ${error.message}`)
  }
}

export async function createUser(userData: {
  username: string
  password: string
  name: string
  role_id: string
  type?: string
}): Promise<User> {
  try {
    // Get role name from role_id for backward compatibility
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", userData.role_id)
      .single()

    // Hash password before storing
    const plainPassword = userData.password || userData.username
    const hashedPassword = await hashPassword(plainPassword)

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        username: userData.username,
        staff_id: userData.username,
        password: hashedPassword, // Store hashed password
        name: userData.name,
        role: roleData?.name || "viewer", // Fallback for legacy role field
        role_id: userData.role_id,
        type: userData.type || null,
        email: null, // Will be set when user changes password
        is_password_changed: false,
        must_change_password: true, // Force password change on first login
        last_password_change: null,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.username,
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role,
      role_id: data.role_id,
      type: data.type || "",
      email: data.email || undefined,
      is_password_changed: data.is_password_changed || false,
      must_change_password: data.must_change_password || false,
      last_password_change: data.last_password_change || undefined,
    }
  } catch (error: any) {
    console.error("Error creating user in Supabase:", error)
    throw new Error(`Failed to create user in Supabase: ${error.message}`)
  }
}

/** The active account that holds this staff ID (username), if any. */
export async function getActiveUserByStaffId(staffId: string): Promise<{ username: string; name: string; role: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("username, name, role")
    .eq("username", staffId)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Staff moving unit: frees the staff ID for a new account by deactivating the
 * current one. Its username becomes "<staff_id>~<yyyymmddhhmi>" (username stays
 * unique and the old login stops working); staff_id, name and history are kept.
 * Returns the archived username so a failed create can restore it.
 */
export async function deactivateUserForReplacement(staffId: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)
  const archived = `${staffId}~${stamp}`
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      username: archived,
      staff_id: staffId,
      is_active: false,
      deactivated_at: new Date().toISOString(),
      replaced_by: staffId,
    })
    .eq("username", staffId)
    .eq("is_active", true)
  if (error) throw error
  return archived
}

/** Undo deactivateUserForReplacement when the new account could not be created. */
export async function restoreReplacedUser(archivedUsername: string, staffId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ username: staffId, is_active: true, deactivated_at: null, replaced_by: null })
    .eq("username", archivedUsername)
  if (error) throw error
}

export async function updateUser(
  username: string,
  userData: {
    password?: string
    name?: string
    role_id?: string
    type?: string
  }
): Promise<User> {
  try {
    const updateData: any = {}

    if (userData.name !== undefined) {
      updateData.name = userData.name
    }

    if (userData.password !== undefined) {
      // Only hash if not already hashed
      updateData.password = isHashedPassword(userData.password)
        ? userData.password
        : await hashPassword(userData.password)
    }

    if (userData.role_id !== undefined) {
      updateData.role_id = userData.role_id

      // Update legacy role field for backward compatibility
      const { data: roleData } = await supabaseAdmin
        .from("roles")
        .select("name")
        .eq("id", userData.role_id)
        .single()

      if (roleData) {
        updateData.role = roleData.name
      }
    }

    if (userData.type !== undefined) {
      updateData.type = userData.type || null
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("username", username)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.username,
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role,
      role_id: data.role_id,
      type: data.type || "",
      email: data.email || undefined,
      is_password_changed: data.is_password_changed || false,
      must_change_password: data.must_change_password || false,
      last_password_change: data.last_password_change || undefined,
    }
  } catch (error: any) {
    console.error("Error updating user in Supabase:", error)
    throw new Error(`Failed to update user in Supabase: ${error.message}`)
  }
}

export async function deleteUser(username: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("users").delete().eq("username", username)

    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting user from Supabase:", error)
    throw new Error(`Failed to delete user from Supabase: ${error.message}`)
  }
}


// ===== DARIPADA/KEPADA VALUES =====

export async function getDaripadaKepadaValues() {
  try {
    const { data, error } = await supabaseAdmin
      .from("surat")
      .select("daripada_kepada")
      .not("daripada_kepada", "is", null)
      .not("daripada_kepada", "eq", "")

    if (error) throw error

    const values = data?.map((row) => row.daripada_kepada).filter((val) => val.trim() !== "") || []
    const uniqueValues = Array.from(new Set(values))

    if (uniqueValues.length === 0) {
      uniqueValues.push("Tiada data")
    }

    return uniqueValues
  } catch (error: any) {
    console.error("Error fetching daripada/kepada values from Supabase:", error)
    throw new Error(`Failed to fetch daripada/kepada values from Supabase: ${error.message}`)
  }
}

// ===== BAYARAN FUNCTIONS =====

export async function getAllBayaran(): Promise<Bayaran[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("bayaran")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((row) => ({
        id: row.id,
        ids: row.ids,  // Original numeric ID from Google Sheets
        daripada: row.daripada,
        tarikhTerima: formatDateFromDB(row.tarikh_terima),
        perkara: row.perkara,
        nilaiBayaran: row.nilai_bayaran,
        bayaranKe: row.bayaran_ke || "",
        kategori: row.kategori || "",
        noKontrak: row.no_kontrak || "",
        namaKontraktor: row.nama_kontraktor || "",
        tarikhMemoLadang: formatDateFromDB(row.tarikh_memo_ladang),
        statusLadang: row.status_ladang || "",
        tarikhHantar: formatDateFromDB(row.tarikh_hantar),
        tarikhPpnP: formatDateFromDB(row.tarikh_ppnp),
        tarikhPn: formatDateFromDB(row.tarikh_pn),
        penerima: row.penerima || "",
        statusBayaran: row.status_bayaran || "",
        tarikhBayar: formatDateFromDB(row.tarikh_bayar),
        nomborBaucer: row.nombor_baucer || "",
        notaKaki: row.nota_kaki || "",
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching bayaran from Supabase:", error)
    throw new Error(`Failed to fetch bayaran from Supabase: ${error.message}`)
  }
}

export async function addBayaran(bayaran: Omit<Bayaran, "id">, user: string): Promise<void> {
  try {
    // Get next available ids number
    const { data: maxIdsData } = await supabaseAdmin
      .from("bayaran")
      .select("ids")
      .not("ids", "is", null) // Filter out NULL values
      .order("ids", { ascending: false })
      .limit(1)

    const nextIds = (maxIdsData?.[0]?.ids || 0) + 1

    // Get contractor name from kontrak table
    let namaKontraktor = ""
    if (bayaran.noKontrak) {
      const { data: kontrakData } = await supabaseAdmin
        .from("kontrak")
        .select("nama_kontraktor")
        .eq("no_kontrak", bayaran.noKontrak)
        .limit(1)
        .single()

      namaKontraktor = kontrakData?.nama_kontraktor || ""
    }

    const { data, error } = await supabaseAdmin
      .from("bayaran")
      .insert({
        ids: nextIds, // Auto-increment numeric ID
        daripada: bayaran.daripada,
        tarikh_terima: bayaran.tarikhTerima,
        perkara: bayaran.perkara,
        nilai_bayaran: bayaran.nilaiBayaran,
        bayaran_ke: bayaran.bayaranKe || null,
        kategori: bayaran.kategori || null,
        no_kontrak: bayaran.noKontrak || null,
        nama_kontraktor: namaKontraktor || null,
        tarikh_memo_ladang: bayaran.tarikhMemoLadang || null,
        status_ladang: bayaran.statusLadang || null,
        tarikh_hantar: bayaran.tarikhHantar || null,
        tarikh_ppnp: bayaran.tarikhPpnP || null,
        tarikh_pn: bayaran.tarikhPn || null,
        penerima: bayaran.penerima || null,
        status_bayaran: bayaran.statusBayaran || null,
        tarikh_bayar: bayaran.tarikhBayar || null,
        nombor_baucer: bayaran.nomborBaucer || null,
        nota_kaki: bayaran.notaKaki || null,
      })
      .select()
      .single()

    if (error) throw error

    // Add audit log
    if (data) {
      await addAuditLog({
        bayaranId: data.id,
        user: user,
        action: "CREATE",
        details: `Rekod bayaran #${data.ids} dicipta`,
      })
    }
  } catch (error: any) {
    console.error("Error adding bayaran to Supabase:", error)
    throw new Error(`Failed to add bayaran to Supabase: ${error.message}`)
  }
}

export async function updateBayaran(id: string, bayaran: Omit<Bayaran, "id">, user: string): Promise<void> {
  try {
    // Get contractor name from kontrak table
    let namaKontraktor = ""
    if (bayaran.noKontrak) {
      const { data: kontrakData } = await supabaseAdmin
        .from("kontrak")
        .select("nama_kontraktor")
        .eq("no_kontrak", bayaran.noKontrak)
        .limit(1)
        .single()

      namaKontraktor = kontrakData?.nama_kontraktor || ""
    }

    const { error } = await supabaseAdmin
      .from("bayaran")
      .update({
        daripada: bayaran.daripada,
        tarikh_terima: formatDateToDB(bayaran.tarikhTerima),
        perkara: bayaran.perkara,
        nilai_bayaran: bayaran.nilaiBayaran,
        bayaran_ke: bayaran.bayaranKe || null,
        kategori: bayaran.kategori || null,
        no_kontrak: bayaran.noKontrak || null,
        nama_kontraktor: namaKontraktor || null,
        tarikh_memo_ladang: formatDateToDB(bayaran.tarikhMemoLadang),
        status_ladang: bayaran.statusLadang || null,
        tarikh_hantar: formatDateToDB(bayaran.tarikhHantar),
        tarikh_ppnp: formatDateToDB(bayaran.tarikhPpnP),
        tarikh_pn: formatDateToDB(bayaran.tarikhPn),
        penerima: bayaran.penerima || null,
        status_bayaran: bayaran.statusBayaran || null,
        tarikh_bayar: formatDateToDB(bayaran.tarikhBayar),
        nombor_baucer: bayaran.nomborBaucer || null,
        nota_kaki: bayaran.notaKaki || null,
      })
      .eq("id", id)

    if (error) throw error

    await addAuditLog({
      bayaranId: id,
      user: user,
      action: "UPDATE",
      details: `Rekod bayaran dikemaskini`,
    })
  } catch (error: any) {
    console.error("Error updating bayaran in Supabase:", error)
    throw new Error(`Failed to update bayaran in Supabase: ${error.message}`)
  }
}

export async function deleteBayaran(rowIndex: number, user: string): Promise<void> {
  try {
    // Get all bayaran to find the one at the given index
    const allBayaran = await getAllBayaran()
    const targetBayaran = allBayaran[rowIndex]

    if (!targetBayaran) {
      throw new Error(`Bayaran at index ${rowIndex} not found`)
    }

    await addAuditLog({
      bayaranId: targetBayaran.id,
      user: user,
      action: "DELETE",
      details: `Rekod bayaran dipadam`,
    })

    const { error } = await supabaseAdmin.from("bayaran").delete().eq("id", targetBayaran.id)

    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting bayaran from Supabase:", error)
    throw new Error(`Failed to delete bayaran from Supabase: ${error.message}`)
  }
}

export async function bulkUpdateBayaranStatus(ids: string[], newStatus: string, user: string): Promise<void> {
  try {
    // Update all records with the given IDs
    const { error } = await supabaseAdmin.from("bayaran").update({ status_bayaran: newStatus }).in("id", ids)

    if (error) throw error

    // Add audit logs for each updated record
    for (const id of ids) {
      await addAuditLog({
        bayaranId: id,
        user: user,
        action: "BULK_UPDATE_STATUS",
        details: `Status rekod dikemaskini kepada '${newStatus}'`,
      })
    }
  } catch (error: any) {
    console.error("Error bulk updating bayaran status in Supabase:", error)
    throw new Error(`Failed to bulk update bayaran status in Supabase: ${error.message}`)
  }
}

export async function addAuditLog(log: {
  bayaranId: string
  user: string
  action: string
  details: string
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("audit_bayaran").insert({
      bayaran_id: log.bayaranId,
      user_name: log.user,
      action: log.action,
      details: log.details,
    })

    if (error) throw error
  } catch (error: any) {
    console.error("Error adding audit log to Supabase:", error)
    // Don't throw error here because the main operation should not fail if logging fails
  }
}

// ===== REFERENCE DATA FUNCTIONS =====

export async function getStatusLadangData() {
  try {
    const { data, error } = await supabaseAdmin
      .from("status_config")
      .select("*")
      .eq("kategori", "STATUS LADANG")
      .order("status")

    if (error) throw error

    return (
      data?.map((row) => ({
        status: row.status,
        colorHex: row.color_hex,
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching status ladang data from Supabase:", error)
    throw new Error(`Failed to fetch status ladang data from Supabase: ${error.message}`)
  }
}

export async function getPenerimaData() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(`
        name, 
        type,
        role_id,
        is_active,
        roles (
          name
        )
      `)
      .eq("type", "PENERIMA")
      .order("is_active", { ascending: false })
      .order("name")

    if (error) throw error

    return (
      data?.map((row: any) => {
        const roleName = row.roles?.name || row.type || ""
        return {
          unit: roleName,
          name: row.name,
          display: `${row.name} (${roleName})`,
          defaultStatus: "",
          // Deactivated accounts stay listed so old records still show their unit,
          // but the Bayaran form does not offer them for new records
          active: row.is_active !== false,
        }
      }) || []
    )
  } catch (error: any) {
    console.error("Error fetching penerima data from Supabase:", error)
    throw new Error(`Failed to fetch penerima data from Supabase: ${error.message}`)
  }
}

export async function getContractCategoryData() {
  try {
    const { data, error } = await supabaseAdmin.from("kontrak").select("*").order("kawasan")

    if (error) throw error

    const contractData: Record<string, string[]> = {}
    const categoryData: Record<string, Record<string, string[]>> = {}
    const contractorData: Record<string, string> = {}
    // Kerja and nilai per no kontrak (sibling rows share them; first filled value wins)
    const kontrakInfo: Record<string, { kerja: string; nilaiKontrak: number | null }> = {}
    const allContracts: string[] = []
    const allCategories: string[] = []

    data?.forEach((row) => {
      const kawasan = row.kawasan || ""
      const noKontrak = row.no_kontrak || ""
      const kategori = row.kategori || ""
      const namaKontraktor = row.nama_kontraktor || ""

      if (kawasan.trim() === "") return

      // Build contract data
      if (!contractData[kawasan]) {
        contractData[kawasan] = []
      }
      if (noKontrak && !contractData[kawasan].includes(noKontrak)) {
        contractData[kawasan].push(noKontrak)
      }

      // Build category data
      if (!categoryData[kawasan]) {
        categoryData[kawasan] = {}
      }
      if (!categoryData[kawasan][noKontrak]) {
        categoryData[kawasan][noKontrak] = []
      }
      if (kategori && !categoryData[kawasan][noKontrak].includes(kategori)) {
        categoryData[kawasan][noKontrak].push(kategori)
      }

      // Build contractor data mapping
      if (noKontrak && namaKontraktor) {
        contractorData[noKontrak] = namaKontraktor
      }

      if (noKontrak) {
        const info = (kontrakInfo[noKontrak] ??= { kerja: "", nilaiKontrak: null })
        if (!info.kerja && row.kerja) info.kerja = row.kerja
        if (info.nilaiKontrak === null && row.nilai_kontrak !== null && row.nilai_kontrak !== undefined) {
          info.nilaiKontrak = Number(row.nilai_kontrak)
        }
      }

      // Collect all contracts and categories for LADANG NEGERI
      if (noKontrak && !allContracts.includes(noKontrak)) {
        allContracts.push(noKontrak)
      }
      if (kategori && !allCategories.includes(kategori)) {
        allCategories.push(kategori)
      }
    })

    return { contractData, categoryData, allContracts, allCategories, contractorData, kontrakInfo }
  } catch (error: any) {
    console.error("Error fetching contract and category data from Supabase:", error)
    throw new Error(`Failed to fetch contract and category data from Supabase: ${error.message}`)
  }
}

// ===== KONTRAK FUNCTIONS =====
// Bayaran rows keep a copy of nama_kontraktor (looked up when a bayaran is
// saved), so changing a contractor here also rewrites that copy.

function mapKontrakRow(row: any): Kontrak {
  return {
    id: row.id,
    kawasan: row.kawasan || "",
    noKontrak: row.no_kontrak || "",
    kategori: row.kategori || "",
    namaKontraktor: row.nama_kontraktor || "",
    tarikhMula: row.tarikh_mula || "",
    tarikhAkhir: row.tarikh_akhir || "",
    tahunKontrak: row.tahun_kontrak ?? null,
    jenisKerja: row.jenis_kerja || "",
    kerja: row.kerja || "",
    nilaiKontrak: row.nilai_kontrak === null || row.nilai_kontrak === undefined ? null : Number(row.nilai_kontrak),
  }
}

function kontrakToRow(input: KontrakInput) {
  return {
    kawasan: input.kawasan,
    no_kontrak: input.noKontrak,
    kategori: input.kategori || null,
    nama_kontraktor: input.namaKontraktor || null,
    tarikh_mula: input.tarikhMula || null,
    tarikh_akhir: input.tarikhAkhir || null,
    jenis_kerja: input.jenisKerja || null,
    kerja: input.kerja || null,
    nilai_kontrak: input.nilaiKontrak,
  }
}

export async function getAllKontrak(): Promise<Kontrak[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("kontrak")
      .select("*")
      .order("kawasan")
      .order("no_kontrak")

    if (error) throw error
    return (data || []).map(mapKontrakRow)
  } catch (error: any) {
    console.error("Error fetching kontrak from Supabase:", error)
    throw new Error(`Failed to fetch kontrak from Supabase: ${error.message}`)
  }
}

/**
 * One contract number can have several kontrak rows (one per kategori), and
 * bayaran rows look the name up by contract number alone. Keep every sibling
 * row and every bayaran on the same name; returns the bayaran rows updated.
 */
async function applyNamaKontraktor(noKontrak: string, namaKontraktor: string): Promise<number> {
  if (!noKontrak) return 0
  const nama = namaKontraktor || null

  const { error: siblingError } = await supabaseAdmin
    .from("kontrak")
    .update({ nama_kontraktor: nama })
    .eq("no_kontrak", noKontrak)
  if (siblingError) throw siblingError

  const { data, error } = await supabaseAdmin
    .from("bayaran")
    .update({ nama_kontraktor: nama })
    .eq("no_kontrak", noKontrak)
    .select("id")
  if (error) throw error
  return data?.length || 0
}

async function assertKontrakUnique(input: KontrakInput, exceptId?: string) {
  let query = supabaseAdmin
    .from("kontrak")
    .select("id, kategori")
    .eq("kawasan", input.kawasan)
    .eq("no_kontrak", input.noKontrak)
  if (exceptId) query = query.neq("id", exceptId)
  const { data, error } = await query
  if (error) throw error
  const kategori = input.kategori || ""
  if (data?.some((row) => (row.kategori || "") === kategori)) {
    throw new Error(`Kontrak ${input.noKontrak} (${input.kawasan}${kategori ? `, ${kategori}` : ""}) sudah wujud`)
  }
}

export async function addKontrak(input: KontrakInput): Promise<{ kontrak: Kontrak; bayaranUpdated: number }> {
  try {
    await assertKontrakUnique(input)
    const { data, error } = await supabaseAdmin
      .from("kontrak")
      .insert(kontrakToRow(input))
      .select()
      .single()

    if (error) throw error
    const bayaranUpdated = input.namaKontraktor ? await applyNamaKontraktor(input.noKontrak, input.namaKontraktor) : 0
    return { kontrak: { ...mapKontrakRow(data), namaKontraktor: input.namaKontraktor }, bayaranUpdated }
  } catch (error: any) {
    console.error("Error adding kontrak to Supabase:", error)
    throw new Error(error.message)
  }
}

export async function updateKontrak(
  id: string,
  input: KontrakInput,
): Promise<{ kontrak: Kontrak; bayaranUpdated: number }> {
  try {
    await assertKontrakUnique(input, id)
    const { data, error } = await supabaseAdmin
      .from("kontrak")
      .update(kontrakToRow(input))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    const bayaranUpdated = await applyNamaKontraktor(input.noKontrak, input.namaKontraktor)
    return { kontrak: mapKontrakRow(data), bayaranUpdated }
  } catch (error: any) {
    console.error("Error updating kontrak in Supabase:", error)
    throw new Error(error.message)
  }
}

export async function deleteKontrak(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("kontrak").delete().eq("id", id)
    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting kontrak from Supabase:", error)
    throw new Error(`Failed to delete kontrak from Supabase: ${error.message}`)
  }
}

/** Re-copies every contractor name onto its bayaran rows (one-off backfill). */
export async function syncAllBayaranKontraktor(): Promise<number> {
  try {
    // First named row per contract number wins, matching the bayaran lookup.
    const names = new Map<string, string>()
    for (const kontrak of await getAllKontrak()) {
      if (kontrak.noKontrak && kontrak.namaKontraktor && !names.has(kontrak.noKontrak)) {
        names.set(kontrak.noKontrak, kontrak.namaKontraktor)
      }
    }
    let total = 0
    for (const [noKontrak, nama] of names) {
      const { data, error } = await supabaseAdmin
        .from("bayaran")
        .update({ nama_kontraktor: nama })
        .eq("no_kontrak", noKontrak)
        .select("id")
      if (error) throw error
      total += data?.length || 0
    }
    return total
  } catch (error: any) {
    console.error("Error syncing nama kontraktor to bayaran:", error)
    throw new Error(`Failed to sync nama kontraktor: ${error.message}`)
  }
}

// ===== KONTRAKTOR FUNCTIONS =====
// Contractor master data. kontrak.nama_kontraktor and bayaran.nama_kontraktor
// hold the name as text, so renaming a contractor rewrites both.

function mapKontraktorRow(row: any): Kontraktor {
  return {
    id: row.id,
    namaKontraktor: row.nama_kontraktor || "",
    noVendor: row.no_vendor || "",
    namaAkaun: row.nama_akaun || "",
    nomborAkaun: row.nombor_akaun || "",
    jenisBank: row.jenis_bank || "",
  }
}

function kontraktorToRow(input: KontraktorInput) {
  return {
    nama_kontraktor: input.namaKontraktor,
    no_vendor: input.noVendor || null,
    nama_akaun: input.namaAkaun || null,
    nombor_akaun: input.nomborAkaun || null,
    jenis_bank: input.jenisBank || null,
  }
}

function kontraktorError(error: any, nama: string): Error {
  // 23505: kontraktor_nama_unique
  if (error?.code === "23505") return new Error(`Kontraktor ${nama} sudah wujud`)
  return new Error(error?.message || String(error))
}

export async function getAllKontraktor(): Promise<Kontraktor[]> {
  try {
    const { data, error } = await supabaseAdmin.from("kontraktor").select("*").order("nama_kontraktor")
    if (error) throw error
    return (data || []).map(mapKontraktorRow)
  } catch (error: any) {
    console.error("Error fetching kontraktor from Supabase:", error)
    throw new Error(`Failed to fetch kontraktor from Supabase: ${error.message}`)
  }
}

export async function addKontraktor(input: KontraktorInput): Promise<Kontraktor> {
  const { data, error } = await supabaseAdmin.from("kontraktor").insert(kontraktorToRow(input)).select().single()
  if (error) {
    console.error("Error adding kontraktor to Supabase:", error)
    throw kontraktorError(error, input.namaKontraktor)
  }
  return mapKontraktorRow(data)
}

export async function updateKontraktor(
  id: string,
  input: KontraktorInput,
): Promise<{ kontraktor: Kontraktor; kontrakUpdated: number; bayaranUpdated: number }> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("kontraktor")
    .select("nama_kontraktor")
    .eq("id", id)
    .single()
  if (findError) throw new Error(findError.message)

  const { data, error } = await supabaseAdmin
    .from("kontraktor")
    .update({ ...kontraktorToRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("Error updating kontraktor in Supabase:", error)
    throw kontraktorError(error, input.namaKontraktor)
  }

  // Carry a rename over to the kontrak and bayaran rows that use the old name.
  let kontrakUpdated = 0
  let bayaranUpdated = 0
  const oldName = existing?.nama_kontraktor || ""
  if (oldName && oldName !== input.namaKontraktor) {
    const kontrak = await supabaseAdmin
      .from("kontrak")
      .update({ nama_kontraktor: input.namaKontraktor })
      .eq("nama_kontraktor", oldName)
      .select("id")
    if (kontrak.error) throw new Error(kontrak.error.message)
    const bayaran = await supabaseAdmin
      .from("bayaran")
      .update({ nama_kontraktor: input.namaKontraktor })
      .eq("nama_kontraktor", oldName)
      .select("id")
    if (bayaran.error) throw new Error(bayaran.error.message)
    kontrakUpdated = kontrak.data?.length || 0
    bayaranUpdated = bayaran.data?.length || 0
  }

  return { kontraktor: mapKontraktorRow(data), kontrakUpdated, bayaranUpdated }
}

/** Refuses while a kontrak still names this contractor. */
export async function deleteKontraktor(id: string): Promise<void> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("kontraktor")
    .select("nama_kontraktor")
    .eq("id", id)
    .single()
  if (findError) throw new Error(findError.message)

  const { count, error: countError } = await supabaseAdmin
    .from("kontrak")
    .select("id", { count: "exact", head: true })
    .eq("nama_kontraktor", existing.nama_kontraktor)
  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error(`Kontraktor ini masih digunakan oleh ${count} kontrak. Tukar kontrak tersebut dahulu.`)
  }

  const { error } = await supabaseAdmin.from("kontraktor").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function getStatusBayaranData() {
  try {
    const { data, error } = await supabaseAdmin
      .from("status_config")
      .select("*")
      .eq("kategori", "STATUS BAYARAN")
      .order("status")

    if (error) throw error

    return (
      data?.map((row) => ({
        status: row.status,
        colorHex: row.color_hex,
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching status bayaran data from Supabase:", error)
    throw new Error(`Failed to fetch status bayaran data from Supabase: ${error.message}`)
  }
}

export async function getUnitAndPicData() {
  try {
    const { data, error } = await supabaseAdmin.from("unit_pic").select("*").order("unit")

    if (error) throw error

    const unitPicMap: Record<string, string[]> = {}

    data?.forEach((row) => {
      const unit = row.unit || ""
      const pic = row.pic || ""

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
  } catch (error: any) {
    console.error("Error fetching unit and PIC data from Supabase:", error)
    throw new Error(`Failed to fetch unit and PIC data from Supabase: ${error.message}`)
  }
}

// ===== FAIL FUNCTIONS =====

export async function getAllFail(): Promise<Fail[]> {
  try {
    const { data, error } = await supabaseAdmin.from("fail").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((row, index) => ({
        id: index.toString(),
        part: row.part,
        noLocker: row.no_locker || "",
        noFail: row.no_fail,
        pecahan: row.pecahan || "",
        pecahanKecil: row.pecahan_kecil || "",
        unit: row.unit,
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching fail data from Supabase:", error)
    throw new Error(`Failed to fetch fail data from Supabase: ${error.message}`)
  }
}

export async function addFail(failData: Omit<Fail, "id">): Promise<Fail> {
  try {
    const { data, error } = await supabaseAdmin
      .from("fail")
      .insert({
        part: failData.part,
        no_locker: failData.noLocker || null,
        no_fail: failData.noFail,
        pecahan: failData.pecahan || null,
        pecahan_kecil: failData.pecahanKecil || null,
        unit: failData.unit,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      part: data.part,
      noLocker: data.no_locker || "",
      noFail: data.no_fail,
      pecahan: data.pecahan || "",
      pecahanKecil: data.pecahan_kecil || "",
      unit: data.unit,
    }
  } catch (error: any) {
    console.error("Error adding fail to Supabase:", error)
    throw new Error(`Failed to add fail to Supabase: ${error.message}`)
  }
}

export async function updateFail(id: string, failData: Omit<Fail, "id">): Promise<Fail> {
  try {
    // Get all fail to find the one at the given index
    const allFail = await getAllFail()
    const targetFail = allFail[parseInt(id)]

    if (!targetFail) {
      throw new Error(`Fail at index ${id} not found`)
    }

    const { data, error } = await supabaseAdmin
      .from("fail")
      .update({
        part: failData.part,
        no_locker: failData.noLocker || null,
        no_fail: failData.noFail,
        pecahan: failData.pecahan || null,
        pecahan_kecil: failData.pecahanKecil || null,
        unit: failData.unit,
      })
      .eq("id", targetFail.id)
      .select()
      .single()

    if (error) throw error

    return {
      id: id,
      ...failData,
    }
  } catch (error: any) {
    console.error("Error updating fail in Supabase:", error)
    throw new Error(`Failed to update fail in Supabase: ${error.message}`)
  }
}

export async function deleteFail(id: string): Promise<void> {
  try {
    // Get all fail to find the one at the given index
    const allFail = await getAllFail()
    const targetFail = allFail[parseInt(id)]

    if (!targetFail) {
      throw new Error(`Fail at index ${id} not found`)
    }

    const { error } = await supabaseAdmin.from("fail").delete().eq("id", targetFail.id)

    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting fail from Supabase:", error)
    throw new Error(`Failed to delete fail from Supabase: ${error.message}`)
  }
}

// ===== SHARE LINK FUNCTIONS =====

export async function getAllShareLinks(): Promise<ShareLink[]> {
  try {
    const { data, error } = await supabaseAdmin.from("share_links").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((row) => ({
        linkId: row.link_id,
        filterJson: JSON.stringify(row.filter_json),
        createdBy: row.created_by,
        createdAt: row.created_at,
        expiresAt: row.expires_at || undefined,
        description: row.description || undefined,
        accessCount: row.access_count || 0,
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching share links from Supabase:", error)
    throw new Error(`Failed to fetch share links from Supabase: ${error.message}`)
  }
}

export async function getShareLinkById(linkId: string): Promise<ShareLink | null> {
  try {
    const { data, error } = await supabaseAdmin.from("share_links").select("*").eq("link_id", linkId).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw error
    }

    return {
      linkId: data.link_id,
      filterJson: JSON.stringify(data.filter_json),
      createdBy: data.created_by,
      createdAt: data.created_at,
      expiresAt: data.expires_at || undefined,
      description: data.description || undefined,
      accessCount: data.access_count || 0,
    }
  } catch (error: any) {
    console.error("Error fetching share link by ID from Supabase:", error)
    throw new Error(`Failed to fetch share link by ID from Supabase: ${error.message}`)
  }
}

export async function addShareLink(data: Omit<ShareLink, "linkId" | "accessCount">): Promise<string> {
  try {
    // Generate unique link ID (12 character random string)
    const linkId = crypto.randomUUID().replace(/-/g, "").substring(0, 12)

    const { error } = await supabaseAdmin.from("share_links").insert({
      link_id: linkId,
      filter_json: JSON.parse(data.filterJson),
      created_by: data.createdBy,
      expires_at: data.expiresAt || null,
      description: data.description || null,
      access_count: 0,
    })

    if (error) throw error

    return linkId
  } catch (error: any) {
    console.error("Error adding share link to Supabase:", error)
    throw new Error(`Failed to add share link to Supabase: ${error.message}`)
  }
}

export async function deleteShareLink(linkId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("share_links").delete().eq("link_id", linkId)

    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting share link from Supabase:", error)
    throw new Error(`Failed to delete share link from Supabase: ${error.message}`)
  }
}

export async function incrementShareLinkAccess(linkId: string): Promise<void> {
  try {
    // Get current access count
    const link = await getShareLinkById(linkId)

    if (!link) {
      throw new Error("Share link not found")
    }

    const newCount = (link.accessCount || 0) + 1

    const { error } = await supabaseAdmin.from("share_links").update({ access_count: newCount }).eq("link_id", linkId)

    if (error) throw error
  } catch (error: any) {
    console.error("Error incrementing share link access count in Supabase:", error)
    throw new Error(`Failed to increment share link access count in Supabase: ${error.message}`)
  }
}
