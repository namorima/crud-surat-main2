"use client"

import { Badge } from "@/components/ui/badge"
import type { ShareLinkFilter } from "@/types/share-link"
import { Calendar } from "lucide-react"

interface FilterSummaryBadgesProps {
  filterJson: string
  className?: string
}

export function FilterSummaryBadges({ filterJson, className = "" }: FilterSummaryBadgesProps) {
  let filters: ShareLinkFilter
  try {
    filters = JSON.parse(filterJson)
  } catch (error) {
    return <Badge variant="outline">Invalid filter</Badge>
  }

  const hasFilters =
    filters.kategori?.length ||
    filters.noKontrak?.length ||
    filters.kawasan?.length ||
    filters.statusBayaran?.length ||
    filters.namaKontraktor?.length ||
    filters.dateRange?.from ||
    filters.dateRange?.to

  if (!hasFilters) {
    return <Badge variant="outline">Tiada filter</Badge>
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {filters.kategori?.map((kategori) => (
        <Badge key={kategori} variant="secondary" className="text-xs">
          Kategori: {kategori}
        </Badge>
      ))}

      {filters.noKontrak?.map((kontrak) => (
        <Badge key={kontrak} variant="secondary" className="text-xs">
          Kontrak: {kontrak}
        </Badge>
      ))}

      {filters.kawasan?.map((kawasan) => (
        <Badge key={kawasan} variant="secondary" className="text-xs">
          Kawasan: {kawasan}
        </Badge>
      ))}

      {filters.statusBayaran?.map((status) => (
        <Badge key={status} variant="secondary" className="text-xs">
          Status: {status}
        </Badge>
      ))}

      {filters.namaKontraktor?.map((kontraktor) => (
        <Badge key={kontraktor} variant="secondary" className="text-xs">
          Kontraktor: {kontraktor}
        </Badge>
      ))}

      {(filters.dateRange?.from || filters.dateRange?.to) && (
        <Badge variant="secondary" className="text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {filters.dateRange.from && filters.dateRange.to
            ? `${new Date(filters.dateRange.from).toLocaleDateString("ms-MY")} - ${new Date(filters.dateRange.to).toLocaleDateString("ms-MY")}`
            : filters.dateRange.from
              ? `Dari ${new Date(filters.dateRange.from).toLocaleDateString("ms-MY")}`
              : `Hingga ${new Date(filters.dateRange.to!).toLocaleDateString("ms-MY")}`}
        </Badge>
      )}
    </div>
  )
}
