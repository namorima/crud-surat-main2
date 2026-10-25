"use client"

import type React from "react"
import {
  RiArrowDownLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiChat3Line,
  RiDeleteBinLine,
  RiEditLine,
  RiReplyLine,
  RiStickyNoteLine,
  RiWhatsappLine,
} from "@remixicon/react"
import type { Surat } from "@/types/surat"
import { Chip } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { Pagination } from "@/components/base/pagination/pagination"
import { RowActions, type RowAction } from "@/components/dashboard/row-actions"
import { suratStatusChip, unitChip } from "@/lib/ui-status"
import { TextWithBilLinks } from "@/components/surat/bil-links"
import { cx } from "@/utils/cx"
import { useListPaging } from "@/hooks/use-list-paging"

export type SuratColumnVisibility = {
  bil: boolean
  tarikh: boolean
  kategori: boolean
  perkara: boolean
  reference: boolean
  nota: boolean
  actions: boolean
}

export interface SuratListProps {
  items: Surat[]
  totalCount: number
  loading: boolean
  error: string | null
  onReload: () => void
  columnVisibility: SuratColumnVisibility
  onSort: (field: string) => void
  onOpenDetail: (item: Surat) => void
  onUnitFilter: (unit: string) => void
  onStatusFilter: (status: string) => void
  onReferenceClick: (bil: string) => void
  onRespond: (bil: number) => void
  onEdit: (item: Surat) => void
  onComment: (item: Surat) => void
  onShare: (item: Surat) => void
  onDelete: (item: Surat) => void
  canEditFull: boolean
  canComment: boolean
  canDelete: boolean
  generatingImage: boolean
  sharingItemId: string | null
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

const KATEGORI_TEXT: Record<string, string> = {
  MASUK: "text-rose-600 dark:text-rose-400",
  KELUAR: "text-accent-600 dark:text-accent-400",
}

function KategoriLabel({ kategori, iconOnly, className }: { kategori: string; iconOnly?: boolean; className?: string }) {
  return (
    <span
      className={cx("inline-flex items-center gap-0.5 text-caption-1-medium", KATEGORI_TEXT[kategori], className)}
      title={iconOnly ? kategori : undefined}
    >
      {kategori === "MASUK" && <RiArrowDownLine className="size-3.5" aria-hidden />}
      {kategori === "KELUAR" && <RiArrowUpLine className="size-3.5" aria-hidden />}
      {iconOnly ? <span className="sr-only">{kategori}</span> : kategori}
    </span>
  )
}

/** One-line nota with clickable #BIL references (plain text, never HTML). */
function NotaText({
  nota,
  onReferenceClick,
  className,
}: {
  nota: string
  onReferenceClick: (bil: string) => void
  className?: string
}) {
  return (
    <p className={cx("flex min-w-0 items-start gap-1 text-caption-1-regular text-text-destructive", className)}>
      <RiStickyNoteLine className="mt-px size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 line-clamp-2">
        <TextWithBilLinks text={nota} onBilClick={onReferenceClick} />
      </span>
    </p>
  )
}

function KomenText({ komen, className }: { komen: string; className?: string }) {
  return (
    <p className={cx("flex min-w-0 items-start gap-1 text-caption-1-regular text-status-blue-text", className)}>
      <RiChat3Line className="mt-px size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 line-clamp-2">
        <span className="text-caption-1-semibold">Komen:</span> {komen}
      </span>
    </p>
  )
}

function SortHeader({ label, field, onSort }: { label: string; field: string; onSort: (field: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md text-body-medium text-text-tertiary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      {label}
      <RiArrowUpDownLine className="size-3.5" aria-hidden />
    </button>
  )
}

function ReferenceChip({
  item,
  onReferenceClick,
  onRespond,
}: {
  item: Surat
  onReferenceClick: (bil: string) => void
  onRespond: (bil: number) => void
}) {
  if (item.reference) {
    return (
      <button type="button" onClick={() => onReferenceClick(item.reference)} className="cursor-pointer" title={`Buka surat #${item.reference}`}>
        <Chip variant="caption" color="blue" className="tabular-nums">
          #{item.reference}
        </Chip>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onRespond(item.bil)}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 text-caption-1-medium text-text-tertiary outline-none hover:bg-background-secondary-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      <RiReplyLine className="size-3.5" aria-hidden />
      Respon
    </button>
  )
}

function UnitChip({ item, onUnitFilter }: { item: Surat; onUnitFilter: (unit: string) => void }) {
  if (!item.unit) return <span className="text-caption-1-regular text-text-tertiary">-</span>
  return (
    <button type="button" onClick={() => onUnitFilter(item.unit)} className="cursor-pointer" title={`Tapis unit ${item.unit}`}>
      <Chip variant="caption" color={unitChip(item.unit)}>
        {item.unit}
      </Chip>
    </button>
  )
}

function StatusChip({ item, onStatusFilter }: { item: Surat; onStatusFilter: (status: string) => void }) {
  return (
    <button type="button" onClick={() => onStatusFilter(item.status)} className="cursor-pointer" title={`Tapis status ${item.status}`}>
      <Chip variant="caption" color={suratStatusChip(item.status)}>
        {item.status}
      </Chip>
    </button>
  )
}

function EmptyState({ loading, error, onReload }: Pick<SuratListProps, "loading" | "error" | "onReload">) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      {loading ? (
        <div className="size-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      ) : error ? (
        <p className="text-body-regular text-text-error-primary">Error loading data. Please try again.</p>
      ) : (
        <>
          <p className="text-body-regular text-text-secondary">Tiada data surat dijumpai</p>
          <Button variant="secondary" size="small" onClick={onReload}>
            Muat Semula Data
          </Button>
        </>
      )}
    </div>
  )
}

export function SuratList(props: SuratListProps) {
  const {
    items,
    totalCount,
    columnVisibility: cols,
    onSort,
    onOpenDetail,
    onUnitFilter,
    onStatusFilter,
    onReferenceClick,
    onRespond,
    page,
    pageSize,
    totalPages,
    onPageChange,
  } = props
  const { rootRef, scrollBoxRef, goToPage } = useListPaging(onPageChange)

  const actionsFor = (item: Surat, includeRespond: boolean): RowAction[] => [
    { label: "Edit", icon: RiEditLine, onSelect: () => props.onEdit(item), disabled: !props.canEditFull },
    { label: "Komen", icon: RiChat3Line, onSelect: () => props.onComment(item), hidden: !props.canComment },
    {
      label: "Respon",
      icon: RiReplyLine,
      onSelect: () => onRespond(item.bil),
      hidden: !includeRespond || Boolean(item.reference),
    },
    {
      label: "Share Ke WhatsApp",
      icon: RiWhatsappLine,
      onSelect: () => props.onShare(item),
      disabled: props.generatingImage,
      loading: props.sharingItemId === item.id,
    },
    { label: "Delete", icon: RiDeleteBinLine, onSelect: () => props.onDelete(item), disabled: !props.canDelete, danger: true },
  ]

  const BilButton = ({ item, className }: { item: Surat; className?: string }) => (
    <button
      type="button"
      onClick={() => onOpenDetail(item)}
      className={cx(
        "cursor-pointer rounded-md text-body-semibold text-text-primary tabular-nums outline-none hover:text-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        className,
      )}
    >
      #{item.bil}
    </button>
  )

  return (
    <div ref={rootRef} className="flex flex-col">
      {/* Tablet and desktop: BoardUI table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
        <div ref={scrollBoxRef} className="relative max-h-[calc(100dvh-220px)] overflow-auto">
          <table className="bui-table">
            <thead className="sticky top-0 z-10">
              <tr>
                {cols.bil && (
                  <th className="w-[68px]">
                    <SortHeader label="Bil" field="bil" onSort={onSort} />
                  </th>
                )}
                {(cols.tarikh || cols.kategori) && (
                  <th className="w-[112px]">
                    <SortHeader label={cols.tarikh ? "Tarikh" : "Kategori"} field={cols.tarikh ? "tarikh" : "kategori"} onSort={onSort} />
                  </th>
                )}
                {cols.perkara && (
                  <th>
                    <SortHeader label="Perkara" field="perkara" onSort={onSort} />
                  </th>
                )}
                <th className="hidden w-[150px] lg:table-cell">Unit / PIC</th>
                <th className="w-[128px]">Status</th>
                {cols.reference && (
                  <th className="w-[96px]">
                    <SortHeader label="Ref" field="reference" onSort={onSort} />
                  </th>
                )}
                <th className="w-[48px] text-end">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState loading={props.loading} error={props.error} onReload={props.onReload} />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-background-secondary-default">
                    {cols.bil && (
                      <td className="align-top">
                        <BilButton item={item} />
                      </td>
                    )}
                    {(cols.tarikh || cols.kategori) && (
                      <td className="align-top">
                        <div className="flex flex-col gap-0.5">
                          {cols.tarikh && <span className="text-body-regular text-text-primary tabular-nums">{item.tarikh}</span>}
                          {cols.kategori && <KategoriLabel kategori={item.kategori} />}
                        </div>
                      </td>
                    )}
                    {cols.perkara && (
                      <td className="align-top">
                        <div className="flex min-w-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(item)}
                            className="cursor-pointer text-left text-body-medium text-text-primary outline-none hover:text-accent-600 focus-visible:underline dark:hover:text-accent-400"
                          >
                            {item.perkara}
                          </button>
                          <span className="text-caption-1-regular text-text-tertiary">
                            {item.kategori === "KELUAR" ? "Kepada: " : "Daripada: "}
                            {item.daripadaKepada || "-"}
                          </span>
                          {/* Unit / PIC fold under perkara until the column appears at lg */}
                          <span className="flex flex-wrap items-center gap-1.5 lg:hidden">
                            <UnitChip item={item} onUnitFilter={onUnitFilter} />
                            {item.tindakanPic && <span className="text-caption-1-regular text-text-secondary">{item.tindakanPic}</span>}
                          </span>
                          {cols.nota && item.nota && <NotaText nota={item.nota} onReferenceClick={onReferenceClick} />}
                          {item.komen && <KomenText komen={item.komen} />}
                        </div>
                      </td>
                    )}
                    <td className="hidden align-top lg:table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <UnitChip item={item} onUnitFilter={onUnitFilter} />
                        <span className="text-caption-1-regular text-text-secondary">{item.tindakanPic || "-"}</span>
                      </div>
                    </td>
                    <td className="align-top">
                      <StatusChip item={item} onStatusFilter={onStatusFilter} />
                    </td>
                    {cols.reference && (
                      <td className="align-top">
                        <ReferenceChip item={item} onReferenceClick={onReferenceClick} onRespond={onRespond} />
                      </td>
                    )}
                    <td className="align-top text-end">
                      <RowActions actions={actionsFor(item, false)} />
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
        {items.length === 0 ? (
          <li>
            <EmptyState loading={props.loading} error={props.error} onReload={props.onReload} />
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1.5 rounded-2xl border border-border-table bg-background-primary-default p-3 shadow-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <BilButton item={item} className="shrink-0" />
                <span className="shrink-0 text-caption-1-regular text-text-secondary tabular-nums">{item.tarikh}</span>
                <KategoriLabel kategori={item.kategori} iconOnly className="shrink-0" />
                <span className="ms-auto shrink-0">
                  <StatusChip item={item} onStatusFilter={onStatusFilter} />
                </span>
                <RowActions actions={actionsFor(item, true)} className="-me-1.5 size-7" />
              </div>
              <button type="button" onClick={() => onOpenDetail(item)} className="cursor-pointer text-left">
                <p className="line-clamp-2 text-body-medium text-text-primary">{item.perkara}</p>
                <p className="mt-0.5 truncate text-caption-1-regular text-text-tertiary">
                  {item.kategori === "KELUAR" ? "Kepada: " : "Daripada: "}
                  {item.daripadaKepada || "-"}
                </p>
              </button>
              <div className="flex flex-wrap items-center gap-1.5">
                <UnitChip item={item} onUnitFilter={onUnitFilter} />
                {item.tindakanPic && <span className="text-caption-1-regular text-text-secondary">PIC {item.tindakanPic}</span>}
                {item.reference && (
                  <span className="ms-auto">
                    <ReferenceChip item={item} onReferenceClick={onReferenceClick} onRespond={onRespond} />
                  </span>
                )}
              </div>
              {item.nota && <NotaText nota={item.nota} onReferenceClick={onReferenceClick} />}
              {item.komen && <KomenText komen={item.komen} />}
            </li>
          ))
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
            aria-label="Halaman surat"
            className="sm:w-auto sm:justify-end"
          />
        </div>
      )}
    </div>
  )
}
