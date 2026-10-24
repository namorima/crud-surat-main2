import type { Bayaran } from "@/types/bayaran"
import type { ShareLinkFilter } from "@/types/share-link"

/** DD/MM/YYYY (how getAllBayaran returns dates) or ISO → Date; null when unparseable. */
function parseTarikh(value: string): Date | null {
  if (!value) return null
  const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const date = ddmmyyyy ? new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** The bayaran rows a share link may show. Runs on the server so other rows never leave it. */
export function filterBayaranForShareLink(all: Bayaran[], filters: ShareLinkFilter): Bayaran[] {
  const has = (list?: string[]) => Array.isArray(list) && list.length > 0
  return all.filter((item) => {
    if (has(filters.kategori) && !filters.kategori!.includes(item.kategori)) return false
    if (has(filters.noKontrak) && !filters.noKontrak!.includes(item.noKontrak)) return false
    if (has(filters.kawasan) && !filters.kawasan!.includes(item.daripada)) return false
    if (has(filters.statusBayaran) && !filters.statusBayaran!.includes(item.statusBayaran)) return false
    if (has(filters.namaKontraktor) && !filters.namaKontraktor!.includes(item.namaKontraktor)) return false
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const tarikh = parseTarikh(item.tarikhTerima)
      if (!tarikh) return false
      if (filters.dateRange?.from && tarikh < new Date(filters.dateRange.from)) return false
      if (filters.dateRange?.to && tarikh > new Date(filters.dateRange.to)) return false
    }
    return true
  })
}
