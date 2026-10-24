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
import { SURAT_STATUS_SURFACE, suratStatusChip, unitChip } from "@/lib/ui-status"
import { cx } from "@/utils/cx"

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
  formatBilReferences: (text: string) => string
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

const KATEGORI_TEXT: Record<string, string> = {
  MASUK: "text-rose-600 dark:text-rose-400",
  KELUAR: "text-accent-600 dark:text-accent-400",
}

function KategoriLabel({ kategori, className }: { kategori: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-0.5 text-body-medium", KATEGORI_TEXT[kategori], className)}>
      {kategori}
      {kategori === "MASUK" && <RiArrowDownLine className="size-4" aria-hidden />}
      {kategori === "KELUAR" && <RiArrowUpLine className="size-4" aria-hidden />}
    </span>
  )
}

/** Nota text with clickable #BIL references (rendered by formatBilReferences). */
function NotaText({
  nota,
  format,
  onReferenceClick,
  className,
}: {
  nota: string
  format: (text: string) => string
  onReferenceClick: (bil: string) => void
  className?: string
}) {
  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const bil = target.getAttribute("data-bil")
    if (bil) onReferenceClick(bil)
  }
  return (
    <p className={cx("flex items-start gap-1 text-caption-1-regular text-text-error-primary", className)} onClick={onClick}>
      <RiStickyNoteLine className="mt-px size-3.5 shrink-0" aria-hidden />
      <span dangerouslySetInnerHTML={{ __html: format(nota) }} />
    </p>
  )
}

function KomenText({ komen, className }: { komen: string; className?: string }) {
  return (
    <p className={cx("flex items-start gap-1 text-caption-1-regular text-accent-600 dark:text-accent-400", className)}>
      <RiChat3Line className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
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
      <button type="button" onClick={() => onReferenceClick(item.reference)} className="cursor-pointer">
        <Chip variant="caption" color="gray" className="border border-border-button-default">
          {item.reference}
        </Chip>
      </button>
    )
  }
  return (
    <button type="button" onClick={() => onRespond(item.bil)} className="cursor-pointer">
      <Chip variant="caption" color="soft" className="gap-1 hover:text-text-primary">
        <RiReplyLine className="size-3.5" aria-hidden />
        Respon
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
    formatBilReferences,
    page,
    pageSize,
    totalPages,
    onPageChange,
  } = props

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
    <div className="flex flex-col">
      {/* Tablet and desktop: BoardUI table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
        <div className="max-h-[calc(100dvh-220px)] overflow-auto">
          <table className="bui-table">
            <thead className="sticky top-0 z-10">
              <tr>
                {cols.bil && (
                  <th className="w-[72px]">
                    <SortHeader label="Bil" field="bil" onSort={onSort} />
                  </th>
                )}
                {cols.kategori && (
                  <th className="w-[200px]">
                    <SortHeader label="Kategori" field="kategori" onSort={onSort} />
                    <span className="block text-caption-1-regular">
                      {cols.tarikh ? "Tarikh · " : ""}Daripada/Kepada
                    </span>
                  </th>
                )}
                {cols.perkara && (
                  <th>
                    <SortHeader label="Perkara" field="perkara" onSort={onSort} />
                  </th>
                )}
                {cols.reference && (
                  <th className="w-[120px]">
                    <SortHeader label="Reference" field="reference" onSort={onSort} />
                  </th>
                )}
                <th className="w-[56px] text-end">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState loading={props.loading} error={props.error} onReload={props.onReload} />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={cx("hover:bg-background-secondary-default", SURAT_STATUS_SURFACE[item.status])}>
                    {cols.bil && (
                      <td className="align-top">
                        <BilButton item={item} />
                      </td>
                    )}
                    {cols.kategori && (
                      <td className="align-top">
                        <div className="flex flex-col gap-0.5">
                          <KategoriLabel kategori={item.kategori} />
                          {cols.tarikh && <span className="text-body-regular text-text-secondary tabular-nums">{item.tarikh}</span>}
                          <span className="text-caption-1-regular text-text-tertiary">{item.daripadaKepada}</span>
                        </div>
                      </td>
                    )}
                    {cols.perkara && (
                      <td className="align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-body-medium text-text-primary">{item.perkara}</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button type="button" onClick={() => onUnitFilter(item.unit)} className="cursor-pointer">
                              <Chip variant="caption" color={unitChip(item.unit)}>
                                {item.unit}
                              </Chip>
                            </button>
                            {item.tindakanPic && (
                              <Chip variant="caption" color={unitChip(item.unit)}>
                                PIC: {item.tindakanPic}
                              </Chip>
                            )}
                            <button type="button" onClick={() => onStatusFilter(item.status)} className="cursor-pointer">
                              <Chip variant="caption" color={suratStatusChip(item.status)}>
                                {item.status}
                              </Chip>
                            </button>
                          </div>
                          {cols.nota && item.nota && (
                            <NotaText nota={item.nota} format={formatBilReferences} onReferenceClick={onReferenceClick} />
                          )}
                          {item.komen && <KomenText komen={item.komen} />}
                        </div>
                      </td>
                    )}
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
              className={cx(
                "flex flex-col gap-1.5 rounded-2xl border border-border-button-default bg-background-primary-default p-3 dark:bg-background-secondary-default",
                SURAT_STATUS_SURFACE[item.status],
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <BilButton item={item} className="shrink-0" />
                <KategoriLabel kategori={item.kategori} className="shrink-0 text-caption-1-medium" />
                <span className="min-w-0 truncate text-caption-1-regular text-text-secondary tabular-nums">{item.tarikh}</span>
                <span className="ms-auto shrink-0">
                  <Chip variant="caption" color={suratStatusChip(item.status)}>
                    {item.status}
                  </Chip>
                </span>
                <RowActions actions={actionsFor(item, true)} className="-me-1.5 size-7" />
              </div>
              <p className="line-clamp-2 text-body-medium text-text-primary">{item.perkara}</p>
              <p className="truncate text-caption-1-regular text-text-tertiary">
                {item.kategori === "MASUK" ? "Daripada: " : "Kepada: "}
                {item.daripadaKepada}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip variant="caption" color={unitChip(item.unit)}>
                  {item.unit}
                </Chip>
                {item.tindakanPic && (
                  <Chip variant="caption" color={unitChip(item.unit)}>
                    PIC: {item.tindakanPic}
                  </Chip>
                )}
                {item.reference && <ReferenceChip item={item} onReferenceClick={onReferenceClick} onRespond={onRespond} />}
              </div>
              {item.nota && (
                <NotaText
                  nota={item.nota}
                  format={formatBilReferences}
                  onReferenceClick={onReferenceClick}
                  className="line-clamp-2"
                />
              )}
              {item.komen && <KomenText komen={item.komen} className="line-clamp-2" />}
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
            onChange={onPageChange}
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
