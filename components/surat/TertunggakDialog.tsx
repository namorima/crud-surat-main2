"use client"

import { useEffect, useMemo, useState } from "react"
import { RiCheckboxCircleLine, RiTimeLine } from "@remixicon/react"
import type { Surat } from "@/types/surat"
import type { Tertunggak } from "@/lib/dashboard-stats"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chip } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control"
import { suratStatusChip, unitChip } from "@/lib/ui-status"

type Order = "baru" | "lama"
/** localStorage key for the chosen order (per browser). */
const ORDER_KEY = "surat:tertunggak:order"

/** Older is redder: more than 90 days rose, otherwise orange. */
function HariChip({ hari }: { hari: number }) {
  return (
    <Chip variant="caption" color={hari > 90 ? "rose" : "orange"} className="tabular-nums">
      {hari} hari
    </Chip>
  )
}

export interface TertunggakDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** From suratTertunggak(): open surat older than 30 days, oldest first (the dialog can show newest first). */
  items: Tertunggak[]
  /** Opens Maklumat Surat for one of them. */
  onOpenSurat: (surat: Surat) => void
}

/** "Surat Tertunggak": open letters older than 30 days, worked out from the surat records. */
export function TertunggakDialog({ open, onOpenChange, items, onOpenSurat }: TertunggakDialogProps) {
  // Newest first by default; remembered across visits
  const [order, setOrderState] = useState<Order>("baru")
  useEffect(() => {
    try {
      if (localStorage.getItem(ORDER_KEY) === "lama") setOrderState("lama")
    } catch {
      // storage blocked: keep newest first
    }
  }, [])
  const setOrder = (value: Order) => {
    setOrderState(value)
    try {
      localStorage.setItem(ORDER_KEY, value)
    } catch {
      // not persisted; the order still applies for this visit
    }
  }
  const rows = useMemo(() => (order === "lama" ? items : [...items].reverse()), [items, order])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px] sm:p-0">
        <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-headline-semibold text-text-primary">Surat Tertunggak</DialogTitle>
            <Chip variant="caption" color={items.length > 0 ? "rose" : "lime"} className="tabular-nums">
              {items.length}
            </Chip>
          </div>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            Surat yang belum selesai (bukan SELESAI atau BATAL) dan melebihi 30 hari dari tarikh surat.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {items.length > 1 && (
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-caption-1-medium text-text-tertiary">Susunan</span>
              <SegmentedControl
                aria-label="Susunan surat tertunggak"
                selectedKeys={[order]}
                onSelectionChange={(keys) => {
                  const key = [...keys][0]
                  if (key) setOrder(key as Order)
                }}
              >
                <SegmentedControlItem id="baru">Paling baru</SegmentedControlItem>
                <SegmentedControlItem id="lama">Paling lama</SegmentedControlItem>
              </SegmentedControl>
            </div>
          )}
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <RiCheckboxCircleLine className="size-10 text-status-lime-text" aria-hidden />
              <p className="text-body-regular text-text-secondary">Tiada surat tertunggak</p>
            </div>
          ) : (
            <>
              {/* iPad landscape and desktop */}
              <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
                <table className="bui-table">
                  <thead>
                    <tr>
                      <th className="w-[72px]">Bil</th>
                      <th>Perkara</th>
                      <th>Unit / PIC</th>
                      <th>Status</th>
                      <th className="text-end!">Hari</th>
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {rows.map(({ surat, hari }) => (
                      <tr key={surat.id} className="hover:bg-background-secondary-default">
                        <td>
                          <button
                            type="button"
                            onClick={() => onOpenSurat(surat)}
                            className="cursor-pointer text-body-semibold text-accent-600 tabular-nums hover:underline dark:text-accent-400"
                            title={`Buka surat #${surat.bil}`}
                          >
                            #{surat.bil}
                          </button>
                        </td>
                        <td className="max-w-[300px]">
                          <span className="line-clamp-2" title={surat.perkara}>
                            {surat.perkara}
                          </span>
                          <span className="block text-caption-1-regular text-text-tertiary tabular-nums">
                            {surat.tarikh} · {surat.kategori}
                          </span>
                        </td>
                        <td>
                          {surat.unit ? (
                            <Chip variant="caption" color={unitChip(surat.unit)}>
                              {surat.unit}
                            </Chip>
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
                          <span className="block pt-0.5 text-caption-1-regular text-text-secondary">{surat.tindakanPic || "-"}</span>
                        </td>
                        <td>
                          <Chip variant="caption" color={suratStatusChip(surat.status)}>
                            {surat.status}
                          </Chip>
                        </td>
                        <td className="text-end">
                          <HariChip hari={hari} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phones: tap a card to open the surat */}
              <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
                {rows.map(({ surat, hari }) => (
                  <li key={surat.id}>
                    <button
                      type="button"
                      onClick={() => onOpenSurat(surat)}
                      className="motion-press flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl border border-border-button-default p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="text-body-semibold text-text-primary tabular-nums">#{surat.bil}</span>
                          <Chip variant="caption" color={suratStatusChip(surat.status)}>
                            {surat.status}
                          </Chip>
                        </span>
                        <HariChip hari={hari} />
                      </span>
                      <span className="line-clamp-2 text-body-regular text-text-primary [overflow-wrap:anywhere]">{surat.perkara}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-caption-1-regular text-text-tertiary">
                        <RiTimeLine className="size-3.5" aria-hidden />
                        <span className="tabular-nums">{surat.tarikh}</span>
                        {surat.unit && (
                          <Chip variant="caption" color={unitChip(surat.unit)}>
                            {surat.unit}
                          </Chip>
                        )}
                        {surat.tindakanPic && <span className="text-text-secondary">{surat.tindakanPic}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <footer className="flex border-t border-border-table px-4 py-3 sm:justify-end sm:px-6">
          <Button variant="secondary" size="small" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Tutup
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
