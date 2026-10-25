"use client"

import type React from "react"
import { RiArrowUpDownLine, RiLoader4Line, RiShareLine } from "@remixicon/react"
import type { Bayaran } from "@/types/bayaran"
import { Chip } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { Checkbox } from "@/components/base/checkbox/checkbox"
import { Pagination } from "@/components/base/pagination/pagination"
import { bayaranKategoriChip } from "@/lib/ui-status"
import { cx } from "@/utils/cx"
import { useListPaging } from "@/hooks/use-list-paging"
import { StageDots, isBayaranHold, isBayaranSelesai } from "@/components/bayaran/progress"

interface BayaranTableProps {
  displayedBayaran: Bayaran[]
  columnVisibility: {
    id: boolean
    daripadaTarikh: boolean
    perkara: boolean
    nilaiBayaran: boolean
    bayaranKe: boolean
    noKontrak: boolean
    tarikhBayar: boolean
  }
  handleSort: (field: keyof Bayaran) => void
  setSelectedBayaran: (bayaran: Bayaran | null) => void
  setShowDetailDialog: (show: boolean) => void
  /** Colour configured for a status in status_config (STATUS BAYARAN), if any. */
  getStatusHex: (status: string) => string | undefined
  formatCurrency: (value: string) => string
  renderNotaKakiWithLinks: (notaKaki: string) => React.ReactNode
  handleKontrakFilter: (kontrak: string) => void
  handleShare: (bayaran: Bayaran) => void
  isGeneratingImage: boolean
  sharingBayaran: Bayaran | null
  isSharing: boolean
  loading: boolean
  error: string | null
  fetchWithCache: () => void
  selectedRows: string[]
  setSelectedRows: (ids: string[]) => void
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Used when status_config has no colour for a status (same hues as before). */
const STATUS_FALLBACK: Record<string, "lime" | "rose" | "blue" | "orange"> = {
  selesai: "lime",
  dibayar: "lime",
  completed: "lime",
  batal: "rose",
  cancelled: "rose",
  "dalam proses": "blue",
  processing: "blue",
  pending: "orange",
  menunggu: "orange",
}

function StatusChip({ status, hex }: { status: string; hex?: string }) {
  if (!status) return null
  const fallback = STATUS_FALLBACK[status.toLowerCase()] ?? "neutral"
  return (
    <Chip variant="caption" color={hex ? "soft" : fallback} className="gap-1.5 text-text-primary">
      {hex && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: hex }} aria-hidden />}
      {status}
    </Chip>
  )
}

function SortHeader({ label, onClick, end }: { label: string; onClick: () => void; end?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex cursor-pointer items-center gap-1 rounded-md text-body-medium text-text-tertiary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        end && "flex-row-reverse",
      )}
    >
      {label}
      <RiArrowUpDownLine className="size-3.5" aria-hidden />
    </button>
  )
}

export function BayaranTable({
  displayedBayaran,
  columnVisibility,
  handleSort,
  setSelectedBayaran,
  setShowDetailDialog,
  getStatusHex,
  formatCurrency,
  renderNotaKakiWithLinks,
  handleKontrakFilter,
  handleShare,
  isGeneratingImage,
  sharingBayaran,
  isSharing,
  loading,
  error,
  fetchWithCache,
  selectedRows,
  setSelectedRows,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: BayaranTableProps) {
  const { rootRef, scrollBoxRef, goToPage } = useListPaging(onPageChange)
  const openDetail = (item: Bayaran) => {
    setSelectedBayaran(item)
    setShowDetailDialog(true)
  }

  const toggleRow = (id: string, checked: boolean) =>
    setSelectedRows(checked ? [...selectedRows, id] : selectedRows.filter((rowId) => rowId !== id))

  const allSelected = selectedRows.length === displayedBayaran.length && displayedBayaran.length > 0

  const empty = (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      {loading ? (
        <div className="size-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      ) : error ? (
        <p className="text-body-regular text-text-error-primary">Error loading data. Please try again.</p>
      ) : (
        <>
          <p className="text-body-regular text-text-secondary">Tiada data bayaran dijumpai</p>
          <Button variant="secondary" size="small" onClick={fetchWithCache}>
            Muat Semula Data
          </Button>
        </>
      )}
    </div>
  )

  const IdButton = ({ item, className }: { item: Bayaran; className?: string }) => (
    <button
      type="button"
      onClick={() => openDetail(item)}
      className={cx(
        "cursor-pointer rounded-md text-body-semibold text-text-primary tabular-nums outline-none hover:text-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring dark:hover:text-accent-400",
        className,
      )}
    >
      #{item.ids ?? item.id}
    </button>
  )

  const HoldChip = ({ item }: { item: Bayaran }) =>
    isBayaranHold(item) ? (
      <Chip variant="caption" color="gray" className="bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950">
        HOLD / KIV
      </Chip>
    ) : null

  const KontrakChip = ({ item }: { item: Bayaran }) =>
    item.noKontrak ? (
      <button type="button" onClick={() => handleKontrakFilter(item.noKontrak || "")} className="cursor-pointer" title={item.noKontrak}>
        <Chip variant="caption" color="soft" className="border border-border-button-default tabular-nums">
          {item.noKontrak}
        </Chip>
      </button>
    ) : null

  return (
    <div ref={rootRef} className="flex flex-col">
      {/* Tablet and desktop: BoardUI table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
        <div ref={scrollBoxRef} className="relative max-h-[calc(100dvh-220px)] overflow-auto">
          <table className="bui-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-[44px]">
                  <Checkbox
                    size="sm"
                    aria-label="Pilih semua"
                    isSelected={allSelected}
                    onChange={(checked) => setSelectedRows(checked ? displayedBayaran.map((item) => item.id) : [])}
                  />
                </th>
                {columnVisibility.id && (
                  <th className="w-[68px]">
                    <SortHeader label="ID" onClick={() => handleSort("ids")} />
                  </th>
                )}
                {columnVisibility.daripadaTarikh && (
                  <th className="w-[150px]">
                    <SortHeader label="Terima" onClick={() => handleSort("tarikhTerima")} />
                  </th>
                )}
                {columnVisibility.perkara && (
                  <th className="min-w-[240px]">
                    <SortHeader label="Perkara" onClick={() => handleSort("perkara")} />
                  </th>
                )}
                {columnVisibility.nilaiBayaran && (
                  <th className="w-[132px] text-end">
                    <SortHeader label="Nilai" onClick={() => handleSort("nilaiBayaran")} end />
                  </th>
                )}
                {columnVisibility.noKontrak && (
                  <th className="hidden w-[160px] lg:table-cell">
                    <SortHeader label="Kontraktor" onClick={() => handleSort("namaKontraktor")} />
                  </th>
                )}
                <th className="w-[150px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedBayaran.length === 0 ? (
                <tr>
                  <td colSpan={7}>{empty}</td>
                </tr>
              ) : (
                displayedBayaran.map((item) => (
                  <tr
                    key={item.id}
                    data-state={selectedRows.includes(item.id) ? "selected" : undefined}
                    className="hover:bg-background-secondary-default data-[state=selected]:bg-accent-50 dark:data-[state=selected]:bg-accent-950/40"
                  >
                    <td className="align-top">
                      <Checkbox
                        size="sm"
                        aria-label={`Pilih #${item.ids ?? item.id}`}
                        isSelected={selectedRows.includes(item.id)}
                        onChange={(checked) => toggleRow(item.id, checked)}
                      />
                    </td>
                    {columnVisibility.id && (
                      <td className="align-top">
                        <IdButton item={item} />
                      </td>
                    )}
                    {columnVisibility.daripadaTarikh && (
                      <td className="align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-body-regular text-text-primary tabular-nums">{item.tarikhTerima}</span>
                          <span className="text-caption-1-regular text-text-tertiary">{item.daripada}</span>
                        </div>
                      </td>
                    )}
                    {columnVisibility.perkara && (
                      <td className="align-top">
                        <div className="flex min-w-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            className="cursor-pointer text-left text-body-medium text-text-primary outline-none hover:text-accent-600 focus-visible:underline dark:hover:text-accent-400"
                          >
                            {item.perkara}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.kategori && (
                              <Chip variant="caption" color={bayaranKategoriChip(item.kategori)}>
                                {item.kategori}
                              </Chip>
                            )}
                            <KontrakChip item={item} />
                            {/* Kontraktor folds in here until its column appears at lg */}
                            {columnVisibility.noKontrak && item.namaKontraktor && (
                              <span className="text-caption-1-regular text-text-secondary lg:hidden">{item.namaKontraktor}</span>
                            )}
                          </div>
                          {item.notaKaki && (
                            <p className="line-clamp-2 text-caption-1-regular break-words text-text-destructive">
                              {renderNotaKakiWithLinks(item.notaKaki)}
                            </p>
                          )}
                        </div>
                      </td>
                    )}
                    {columnVisibility.nilaiBayaran && (
                      <td className="align-top text-end whitespace-nowrap">
                        <span className="text-body-semibold text-text-primary tabular-nums">{formatCurrency(item.nilaiBayaran)}</span>
                        {columnVisibility.bayaranKe && item.bayaranKe && (
                          <span className="block text-caption-1-regular text-text-tertiary">Bayaran ke-{item.bayaranKe}</span>
                        )}
                      </td>
                    )}
                    {columnVisibility.noKontrak && (
                      <td className="hidden align-top break-words text-body-regular text-text-secondary lg:table-cell">
                        {item.namaKontraktor || "-"}
                      </td>
                    )}
                    <td className="align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          <StatusChip status={item.statusBayaran} hex={getStatusHex(item.statusBayaran)} />
                          <HoldChip item={item} />
                        </div>
                        <StageDots item={item} />
                        {columnVisibility.tarikhBayar && item.tarikhBayar && (
                          <span className="text-caption-1-regular text-text-tertiary tabular-nums">Dibayar {item.tarikhBayar}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones: compact cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {displayedBayaran.length === 0 ? (
          <li>{empty}</li>
        ) : (
          displayedBayaran.map((item) => {
            const sharingThis = sharingBayaran?.id === item.id && isSharing
            return (
              <li
                key={item.id}
                className="flex flex-col gap-1.5 rounded-2xl border border-border-table bg-background-primary-default p-3 shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <IdButton item={item} className="shrink-0" />
                  <span className="shrink-0 text-caption-1-regular text-text-secondary tabular-nums">{item.tarikhTerima}</span>
                  <span className="ms-auto flex min-w-0 justify-end gap-1">
                    <HoldChip item={item} />
                    <StatusChip status={item.statusBayaran} hex={getStatusHex(item.statusBayaran)} />
                  </span>
                  <button
                    type="button"
                    aria-label="Kongsi"
                    onClick={() => handleShare(item)}
                    disabled={isGeneratingImage || sharingThis}
                    className="-me-1.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-2lg text-foreground-icon-secondary hover:bg-background-secondary-hover disabled:opacity-50"
                  >
                    {sharingThis ? (
                      <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RiShareLine className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                <button type="button" onClick={() => openDetail(item)} className="cursor-pointer text-left">
                  <p className="line-clamp-2 text-body-medium text-text-primary">{item.perkara}</p>
                </button>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-caption-1-regular text-text-tertiary">
                    {item.daripada}
                    {item.namaKontraktor ? ` · ${item.namaKontraktor}` : ""}
                  </span>
                  <span className="shrink-0 text-body-semibold text-text-primary tabular-nums">
                    {formatCurrency(item.nilaiBayaran)}
                    {item.bayaranKe && (
                      <span className="ms-1 text-caption-1-regular text-text-tertiary">· Ke-{item.bayaranKe}</span>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.kategori && (
                    <Chip variant="caption" color={bayaranKategoriChip(item.kategori)}>
                      {item.kategori}
                    </Chip>
                  )}
                  <KontrakChip item={item} />
                  {item.nomborBaucer && (
                    <Chip variant="caption" color={isBayaranSelesai(item) ? "lime" : "soft"}>
                      {item.nomborBaucer}
                    </Chip>
                  )}
                  <StageDots item={item} className="ms-auto" />
                </div>
                {item.notaKaki && (
                  <p className="line-clamp-2 text-caption-1-regular break-words text-text-destructive">
                    {renderNotaKakiWithLinks(item.notaKaki)}
                  </p>
                )}
              </li>
            )
          })
        )}
      </ul>

      {totalCount > 0 && (
        <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption-1-regular text-text-tertiary">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} daripada {totalCount}
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            previousLabel="Sebelum"
            nextLabel="Seterusnya"
            aria-label="Halaman bayaran"
            className="sm:w-auto sm:justify-end"
          />
        </div>
      )}
    </div>
  )
}
