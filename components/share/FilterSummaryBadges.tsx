"use client"

import type { ReactNode } from "react"
import { RiCalendarLine } from "@remixicon/react"
import { Chip } from "@/components/base/badges/chip"
import type { ShareLinkFilter } from "@/types/share-link"
import { cx } from "@/utils/cx"

interface FilterSummaryBadgesProps {
  filterJson: string
  className?: string
}

function FilterChip({ label, value }: { label?: string; value: ReactNode }) {
  return (
    <Chip variant="caption" color="soft" className="max-w-full gap-1 whitespace-normal text-left">
      {label && <span className="text-text-tertiary">{label}:</span>}
      <span className="min-w-0 break-words text-text-primary">{value}</span>
    </Chip>
  )
}

const date = (iso: string) => new Date(iso).toLocaleDateString("ms-MY")

export function FilterSummaryBadges({ filterJson, className = "" }: FilterSummaryBadgesProps) {
  let filters: ShareLinkFilter
  try {
    filters = JSON.parse(filterJson)
  } catch {
    return <FilterChip value="Invalid filter" />
  }

  const range = filters.dateRange
  const hasFilters =
    filters.kategori?.length ||
    filters.noKontrak?.length ||
    filters.kawasan?.length ||
    filters.statusBayaran?.length ||
    filters.namaKontraktor?.length ||
    range?.from ||
    range?.to

  if (!hasFilters) {
    return <FilterChip value="Tiada filter" />
  }

  return (
    <div className={cx("flex flex-wrap gap-1", className)}>
      {filters.kategori?.map((kategori) => <FilterChip key={`k-${kategori}`} label="Kategori" value={kategori} />)}
      {filters.noKontrak?.map((kontrak) => <FilterChip key={`n-${kontrak}`} label="Kontrak" value={kontrak} />)}
      {filters.kawasan?.map((kawasan) => <FilterChip key={`a-${kawasan}`} label="Kawasan" value={kawasan} />)}
      {filters.statusBayaran?.map((status) => <FilterChip key={`s-${status}`} label="Status" value={status} />)}
      {filters.namaKontraktor?.map((kontraktor) => (
        <FilterChip key={`c-${kontraktor}`} label="Kontraktor" value={kontraktor} />
      ))}
      {(range?.from || range?.to) && (
        <FilterChip
          value={
            <span className="inline-flex items-center gap-1">
              <RiCalendarLine className="size-3.5 shrink-0 text-foreground-icon-tertiary" aria-hidden />
              {range.from && range.to
                ? `${date(range.from)} - ${date(range.to)}`
                : range.from
                  ? `Dari ${date(range.from)}`
                  : `Hingga ${date(range.to!)}`}
            </span>
          }
        />
      )}
    </div>
  )
}
