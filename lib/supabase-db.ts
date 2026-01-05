import { supabaseAdmin } from "./supabase"
import type { Surat } from "@/types/surat"
import type { User } from "@/types/user"
import type { Bayaran } from "@/types/bayaran"
import type { Fail } from "@/types/fail"
import type { ShareLink } from "@/types/share-link"

// ===== SURAT FUNCTIONS =====

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
        tarikh: row.tarikh,
        perkara: row.perkara,
        kategori: row.kategori,
        unit: row.unit,
        fail: row.fail || "",
        tindakanPic: row.tindakan_pic || "",
        status: row.status as "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL",
        tarikhSelesai: row.tarikh_selesai || null,
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

export async function addSurat(rowIndex: number, surat: Omit<Surat, "id">): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("surat").insert({
      bil: surat.bil,
      daripada_kepada: surat.daripadaKepada,
      tarikh: surat.tarikh,
      perkara: surat.perkara,
      kategori: surat.kategori,
      unit: surat.unit,
      fail: surat.fail || null,
      tindakan_pic: surat.tindakanPic || null,
      status: surat.status,
      tarikh_selesai: surat.tarikhSelesai || null,
      nota: surat.nota || null,
      komen: surat.komen || null,
      reference: surat.reference || null,
    })

    if (error) throw error
  } catch (error: any) {
    console.error("Error adding surat to Supabase:", error)
    throw new Error(`Failed to add surat to Supabase: ${error.message}`)
  }
}

export async function updateSurat(rowIndex: number, surat: Omit<Surat, "id">): Promise<void> {
  try {
    // Get all surat to find the one at the given index
    const allSurat = await getAllSurat()
    const targetSurat = allSurat[rowIndex]

    if (!targetSurat) {
      throw new Error(`Surat at index ${rowIndex} not found`)
    }

    const { error } = await supabaseAdmin
      .from("surat")
      .update({
        bil: surat.bil,
        daripada_kepada: surat.daripadaKepada,
        tarikh: surat.tarikh,
        perkara: surat.perkara,
        kategori: surat.kategori,
        unit: surat.unit,
        fail: surat.fail || null,
        tindakan_pic: surat.tindakanPic || null,
        status: surat.status,
        tarikh_selesai: surat.tarikhSelesai || null,
        nota: surat.nota || null,
        komen: surat.komen || null,
        reference: surat.reference || null,
      })
      .eq("id", targetSurat.id)

    if (error) throw error
  } catch (error: any) {
    console.error("Error updating surat in Supabase:", error)
    throw new Error(`Failed to update surat in Supabase: ${error.message}`)
  }
}

export async function deleteSurat(rowIndex: number): Promise<void> {
  try {
    // Get all surat to find the one at the given index
    const allSurat = await getAllSurat()
    const targetSurat = allSurat[rowIndex]

    if (!targetSurat) {
      throw new Error(`Surat at index ${rowIndex} not found`)
    }

    const { error } = await supabaseAdmin.from("surat").delete().eq("id", targetSurat.id)

    if (error) throw error
  } catch (error: any) {
    console.error("Error deleting surat from Supabase:", error)
    throw new Error(`Failed to delete surat from Supabase: ${error.message}`)
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
        password: row.password,
        name: row.name,
        role: row.role,
        type: row.type || "",
      })) || []
    )
  } catch (error: any) {
    console.error("Error fetching users from Supabase:", error)
    throw new Error(`Failed to fetch users from Supabase: ${error.message}`)
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

// Helper function to convert date from YYYY-MM-DD to DD/MM/YYYY
function formatDateFromDB(dateString: string | null): string {
  if (!dateString) return ""
  try {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  } catch (error) {
    return dateString || ""
  }
}

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
        details: `Rekod bayaran baru dicipta`,
      })
    }
  } catch (error: any) {
    console.error("Error adding bayaran to Supabase:", error)
    throw new Error(`Failed to add bayaran to Supabase: ${error.message}`)
  }
}

export async function updateBayaran(rowIndex: number, bayaran: Omit<Bayaran, "id">, user: string): Promise<void> {
  try {
    // Get all bayaran to find the one at the given index
    const allBayaran = await getAllBayaran()
    const targetBayaran = allBayaran[rowIndex]

    if (!targetBayaran) {
      throw new Error(`Bayaran at index ${rowIndex} not found`)
    }

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
      .eq("id", targetBayaran.id)

    if (error) throw error

    await addAuditLog({
      bayaranId: targetBayaran.id,
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
      .select("name, type")
      .eq("type", "PENERIMA")
      .order("name")

    if (error) throw error

    return (
      data?.map((row) => ({
        unit: "", // Not available in users table
        name: row.name,
        display: row.name,
        defaultStatus: "",
      })) || []
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

      // Collect all contracts and categories for LADANG NEGERI
      if (noKontrak && !allContracts.includes(noKontrak)) {
        allContracts.push(noKontrak)
      }
      if (kategori && !allCategories.includes(kategori)) {
        allCategories.push(kategori)
      }
    })

    return { contractData, categoryData, allContracts, allCategories, contractorData }
  } catch (error: any) {
    console.error("Error fetching contract and category data from Supabase:", error)
    throw new Error(`Failed to fetch contract and category data from Supabase: ${error.message}`)
  }
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
