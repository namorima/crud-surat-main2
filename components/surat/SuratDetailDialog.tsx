"use client"

import type { ReactNode } from "react"
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiChat3Line,
  RiEditLine,
  RiLoader4Line,
  RiReplyLine,
  RiShareLine,
} from "@remixicon/react"
import type { Surat } from "@/types/surat"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chip, type ChipProps } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { suratStatusChip, unitChip } from "@/lib/ui-status"
import { cx } from "@/utils/cx"
import { TextWithBilLinks } from "@/components/surat/bil-links"
import { AuditButton } from "@/components/dashboard/audit-dialog"

type ChipColor = NonNullable<ChipProps["color"]>

/** Fail part chips keep the hues of the old FAIL_PART_COLORS map. */
const FAIL_PART_CHIP: Record<string, ChipColor> = {
  HASIL: "yellow",
  "PERTANIAN AM": "lime",
  KONTRAK: "orange",
}

/** One label/value cell. */
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-caption-1-medium text-text-tertiary">{label}</dt>
      <dd className="min-w-0 text-body-regular text-text-primary break-words">{children}</dd>
    </div>
  )
}

export interface SuratDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surat: Surat | null
  /** "B1 5 - PENGHASILAN (ANGKUT)", or "-" when the surat has no fail. */
  failLabel: string
  /** HASIL / PERTANIAN AM / KONTRAK, for the chip colour. */
  failPart: string
  canEdit: boolean
  /** Admin / Super Admin: show the audit (clock) button */
  showAudit?: boolean
  /** This surat's share image is being generated. */
  sharing: boolean
  /** Any share image is being generated (disables Share). */
  generatingImage: boolean
  onRespond: (surat: Surat) => void
  onEdit: (surat: Surat) => void
  onShare: (surat: Surat) => void
  /** Open another surat by BIL (reference chip and #123 in notes). */
  onBilClick: (bil: string) => void
}

/** "Maklumat Surat #…": compact BoardUI detail view with Tutup / Respon / Edit / Share. */
export function SuratDetailDialog({
  open,
  onOpenChange,
  surat,
  failLabel,
  failPart,
  canEdit,
  showAudit = false,
  sharing,
  generatingImage,
  onRespond,
  onEdit,
  onShare,
  onBilClick,
}: SuratDetailDialogProps) {
  const isMasuk = surat?.kategori === "MASUK"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[620px] sm:p-0">
        <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-headline-semibold text-text-primary">Maklumat Surat #{surat?.bil}</DialogTitle>
            {surat && (
              <Chip variant="caption" color={suratStatusChip(surat.status)}>
                {surat.status}
              </Chip>
            )}
            {surat && showAudit && (
              <span className="ms-auto">
                <AuditButton type="surat" id={surat.id} bil={surat.bil} title={`Surat #${surat.bil}`} />
              </span>
            )}
          </div>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {surat ? `${surat.tarikh} · ${surat.daripadaKepada}` : "Maklumat terperinci untuk surat ini."}
          </DialogDescription>
        </DialogHeader>

        {surat && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <p className="text-body-semibold text-text-primary break-words">{surat.perkara}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-background-secondary-default p-3 sm:grid-cols-3 sm:p-4 dark:bg-background-primary-default">
              <Field label="Kategori">
                <span className={cx("inline-flex items-center gap-1 font-medium", isMasuk ? "text-text-destructive" : "text-accent-600 dark:text-accent-400")}>
                  {isMasuk ? <RiArrowDownLine className="size-4" aria-hidden /> : <RiArrowUpLine className="size-4" aria-hidden />}
                  {surat.kategori}
                </span>
              </Field>
              <Field label="Tarikh">{surat.tarikh || "-"}</Field>
              <Field label="Tarikh Selesai">{surat.tarikhSelesai || "-"}</Field>
              {/* A surat masuk comes from someone; a surat keluar goes to someone */}
              <Field label={surat.kategori === "KELUAR" ? "Kepada" : surat.kategori === "MASUK" ? "Daripada" : "Daripada / Kepada"} className="col-span-2 sm:col-span-3">
                {surat.daripadaKepada || "-"}
              </Field>
              <Field label="Unit">
                {surat.unit ? (
                  <Chip variant="caption" color={unitChip(surat.unit)}>
                    {surat.unit}
                  </Chip>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Tindakan PIC">{surat.tindakanPic || "-"}</Field>
              <Field label="Reference">
                {surat.reference ? (
                  <button type="button" onClick={() => onBilClick(surat.reference)} className="cursor-pointer" title={`Buka surat #${surat.reference}`}>
                    <Chip variant="caption" color="blue">Respon: #{surat.reference}</Chip>
                  </button>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Fail" className="col-span-2 sm:col-span-3">
                {failLabel && failLabel !== "-" ? (
                  <Chip variant="caption" color={FAIL_PART_CHIP[failPart] ?? "neutral"} className="max-w-full whitespace-normal text-left">
                    {failLabel}
                  </Chip>
                ) : (
                  "-"
                )}
              </Field>
            </dl>

            {surat.nota && (
              <section className="mt-3 rounded-2xl border border-border-table p-3 sm:p-4">
                <h3 className="text-caption-1-medium text-text-tertiary">Nota</h3>
                <p className="mt-1 whitespace-pre-wrap text-body-regular text-text-destructive break-words">
                  <TextWithBilLinks text={surat.nota} onBilClick={onBilClick} />
                </p>
              </section>
            )}

            {surat.komen && (
              <section className="mt-3 rounded-2xl bg-status-blue-background p-3 sm:p-4">
                <h3 className="flex items-center gap-1.5 text-caption-1-medium text-status-blue-text">
                  <RiChat3Line className="size-4" aria-hidden />
                  Komen Pengurus
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-body-regular text-text-primary break-words">{surat.komen}</p>
              </section>
            )}
          </div>
        )}

        {surat && (
          <footer className="grid grid-cols-4 gap-2 border-t border-border-table px-4 py-3 sm:flex sm:justify-end sm:px-6">
            <Button variant="secondary" size="small" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Tutup
            </Button>
            <Button
              variant="secondary"
              size="small"
              leadingIcon={RiReplyLine}
              onClick={() => onRespond(surat)}
              disabled={!!surat.reference}
              title={surat.reference ? "Surat ini sudah menjadi respon" : "Respon"}
              aria-label="Respon"
              className="w-full sm:w-auto"
            >
              <span className="hidden min-[400px]:inline">Respon</span>
            </Button>
            {canEdit ? (
              <Button variant="secondary" size="small" leadingIcon={RiEditLine} onClick={() => onEdit(surat)} title="Edit" aria-label="Edit" className="w-full sm:w-auto">
                <span className="hidden min-[400px]:inline">Edit</span>
              </Button>
            ) : (
              <span className="sm:hidden" aria-hidden />
            )}
            <Button
              variant="primary"
              size="small"
              leadingIcon={sharing ? undefined : RiShareLine}
              onClick={() => onShare(surat)}
              disabled={generatingImage}
              title="Share"
              aria-label="Share"
              className="w-full sm:w-auto"
            >
              {sharing ? (
                <span className="inline-flex items-center gap-1.5">
                  <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                  <span className="hidden min-[400px]:inline">Menjana…</span>
                </span>
              ) : (
                <span className="hidden min-[400px]:inline">Share</span>
              )}
            </Button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  )
}
