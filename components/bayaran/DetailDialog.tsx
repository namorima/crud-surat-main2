"use client"

import type { ComponentType, ReactNode } from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileEditLine,
  RiInboxArchiveLine,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
  RiQuillPenLine,
  RiSendPlaneLine,
  RiShareLine,
} from "@remixicon/react"
import type { Bayaran } from "@/types/bayaran"
import type { User } from "@/types/user"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Chip } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { bayaranKategoriChip } from "@/lib/ui-status"
import { hasPermission } from "@/lib/rbac"
import { cx } from "@/utils/cx"
import { StageDots, isBayaranBatal, isBayaranHold, isBayaranSelesai } from "@/components/bayaran/progress"

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>

interface DetailDialogProps {
  showDetailDialog: boolean
  setShowDetailDialog: (show: boolean) => void
  selectedBayaran: Bayaran | null
  handleEdit: (bayaran: Bayaran) => void
  handleShare: (bayaran: Bayaran) => void
  isSharing: boolean
  isGeneratingImage: boolean
  user: User | null
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (show: boolean) => void
  handleDelete: () => void
  isDeleting: boolean
  /** Legacy class map; kategori now uses BoardUI chips. */
  getKategoriColor?: (kategori: string) => string
  formatCurrency: (value: string) => string
  formatDate: (dateString: string) => string
  extractPenerimaWithUnit: (penerima: string) => string
  renderNotaKakiWithLinks: (notaKaki: string) => ReactNode
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-caption-1-medium text-text-tertiary">{label}</dt>
      <dd className="min-w-0 text-body-regular text-text-primary break-words">{children}</dd>
    </div>
  )
}

type Step = { label: string; date: string; pending: string; icon: IconComponent; extra?: ReactNode }

/** Vertical timeline, newest step first (same order as before). */
function Timeline({ steps, cancelled, formatDate }: { steps: Step[]; cancelled: boolean; formatDate: (d: string) => string }) {
  return (
    <ol className="relative flex flex-col">
      {steps.map((step, i) => {
        const done = !!step.date
        const last = i === steps.length - 1
        return (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border-table" aria-hidden />}
            <span
              className={cx(
                "relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full",
                done && cancelled
                  ? "bg-rose-500 text-white"
                  : done
                    ? "bg-lime-600 text-white"
                    : "border border-border-table bg-background-primary-default text-foreground-icon-tertiary",
              )}
              aria-hidden
            >
              {done && cancelled ? (
                <RiCloseLine className="size-4" />
              ) : done ? (
                <RiCheckLine className="size-4" />
              ) : (
                <step.icon className="size-4" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={cx("text-body-medium", done ? "text-text-primary" : "text-text-secondary")}>{step.label}</span>
                <span className={cx("text-caption-1-regular tabular-nums", done ? "text-text-primary" : "text-text-tertiary")}>
                  {done ? formatDate(step.date) : step.pending}
                </span>
              </div>
              {step.extra}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** "Detail Rekod Bayaran": compact BoardUI view with Tutup / Edit / Share / Padam. */
export function DetailDialog({
  showDetailDialog,
  setShowDetailDialog,
  selectedBayaran: b,
  handleEdit,
  handleShare,
  isSharing,
  isGeneratingImage,
  user,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  isDeleting,
  formatCurrency,
  formatDate,
  extractPenerimaWithUnit,
  renderNotaKakiWithLinks,
}: DetailDialogProps) {
  const canEdit =
    user?.permissions && user.permissions.length > 0
      ? hasPermission(user.permissions, { resource: "bayaran", action: "edit" })
      : user?.role === "semua" || user?.role === "PERLADANGAN" || (user?.role === "KEWANGAN" && b?.statusBayaran === "KEWANGAN")

  const canDelete =
    user?.permissions && user.permissions.length > 0
      ? hasPermission(user.permissions, { resource: "bayaran", action: "delete" })
      : user?.role === "semua"

  const cancelled = !!b && isBayaranBatal(b)

  const steps: Step[] = b
    ? [
        {
          label: "Dibayar",
          date: b.tarikhBayar,
          pending: "Belum dibayar",
          icon: RiMoneyDollarCircleLine,
          extra: b.nomborBaucer ? (
            <Chip variant="caption" color={isBayaranSelesai(b) ? "lime" : "soft"} className="w-fit">
              Baucer {b.nomborBaucer}
            </Chip>
          ) : undefined,
        },
        {
          label: "Hantar ke Kewangan",
          date: b.tarikhHantar,
          pending: "Belum dihantar",
          icon: RiSendPlaneLine,
          extra: b.penerima ? (
            <span className="text-caption-1-regular text-text-secondary">Kepada: {extractPenerimaWithUnit(b.penerima)}</span>
          ) : undefined,
        },
        { label: "PN", date: b.tarikhPn, pending: "Belum diproses", icon: RiFileEditLine },
        { label: "PPN (P)", date: b.tarikhPpnP, pending: "Belum diproses", icon: RiQuillPenLine },
        {
          label: "Memo Ladang",
          date: b.tarikhMemoLadang,
          pending: "Belum dibuat",
          icon: RiFileEditLine,
          extra: b.statusLadang ? (
            <Chip
              variant="caption"
              color="soft"
              className={cx("w-fit", isBayaranHold(b) && "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950")}
            >
              {b.statusLadang}
            </Chip>
          ) : undefined,
        },
        {
          label: "Diterima",
          date: b.tarikhTerima,
          pending: "-",
          icon: RiInboxArchiveLine,
          extra: <span className="text-caption-1-regular text-text-secondary">Daripada: {b.daripada}</span>,
        },
      ]
    : []

  return (
    <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px] sm:p-0">
        <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-headline-semibold text-text-primary">Rekod Bayaran #{b?.ids ?? b?.id}</DialogTitle>
            {b?.statusBayaran && (
              <Chip variant="caption" color={isBayaranSelesai(b) ? "lime" : cancelled ? "rose" : "neutral"}>
                {b.statusBayaran}
              </Chip>
            )}
            {b && isBayaranHold(b) && (
              <Chip variant="caption" color="gray" className="bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950">
                HOLD / KIV
              </Chip>
            )}
          </div>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {b ? `Diterima ${b.tarikhTerima} · ${b.daripada}` : "Detail rekod bayaran."}
          </DialogDescription>
        </DialogHeader>

        {b && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <p className="text-body-semibold text-text-primary break-words">{b.perkara}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.1fr] md:gap-4">
              <div className="flex flex-col gap-3">
                {/* Amount */}
                <div className="flex items-end justify-between gap-3 rounded-2xl bg-background-secondary-default p-3 sm:p-4 dark:bg-background-primary-default">
                  <div className="min-w-0">
                    <p className="text-caption-1-medium text-text-tertiary">Nilai Bayaran</p>
                    <p className="text-title-2-semibold text-text-primary tabular-nums">{formatCurrency(b.nilaiBayaran)}</p>
                  </div>
                  {b.bayaranKe && (
                    <Chip variant="caption" color="soft" className="shrink-0 border border-border-button-default">
                      Bayaran ke-{b.bayaranKe}
                    </Chip>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border-table p-3 sm:p-4">
                  <Field label="Kategori">
                    {b.kategori ? (
                      <Chip variant="caption" color={bayaranKategoriChip(b.kategori)}>
                        {b.kategori}
                      </Chip>
                    ) : (
                      "-"
                    )}
                  </Field>
                  <Field label="No Kontrak">{b.noKontrak || "-"}</Field>
                  <Field label="Nama Kontraktor" className="col-span-2">
                    {b.namaKontraktor || "-"}
                  </Field>
                  <Field label="Peringkat" className="col-span-2">
                    <StageDots item={b} />
                  </Field>
                </dl>

                {b.notaKaki && (
                  <section className="rounded-2xl border border-border-table p-3 sm:p-4">
                    <h3 className="text-caption-1-medium text-text-tertiary">Nota Kaki</h3>
                    <p className="mt-1 text-body-regular text-text-destructive break-words whitespace-pre-wrap">
                      {renderNotaKakiWithLinks(b.notaKaki)}
                    </p>
                  </section>
                )}
              </div>

              <section className="rounded-2xl border border-border-table p-3 sm:p-4">
                <h3 className="mb-3 text-body-semibold text-text-primary">Tracking Bayaran</h3>
                <Timeline steps={steps} cancelled={cancelled} formatDate={formatDate} />
              </section>
            </div>
          </div>
        )}

        {b && (
          <footer className="flex items-center gap-2 border-t border-border-table px-4 py-3 sm:px-6">
            {canDelete && (
              <Button
                variant="danger"
                size="small"
                leadingIcon={RiDeleteBinLine}
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Padam"
                title="Padam"
              >
                <span className="hidden min-[400px]:inline">Padam</span>
              </Button>
            )}
            <div className="ms-auto flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={() => setShowDetailDialog(false)}>
                Tutup
              </Button>
              {canEdit && (
                <Button variant="secondary" size="small" leadingIcon={RiEditLine} onClick={() => {
                    setShowDetailDialog(false)
                    handleEdit(b)
                  }}
                  aria-label="Edit" title="Edit">
                  <span className="hidden min-[400px]:inline">Edit</span>
                </Button>
              )}
              <Button
                variant="primary"
                size="small"
                leadingIcon={isSharing ? undefined : RiShareLine}
                onClick={() => handleShare(b)}
                disabled={isSharing || isGeneratingImage}
                aria-label="Share"
                title="Share"
              >
                {isSharing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                    <span className="hidden min-[400px]:inline">Menjana…</span>
                  </span>
                ) : (
                  <span className="hidden min-[400px]:inline">Share</span>
                )}
              </Button>
            </div>
          </footer>
        )}
        {/* Inside the content so clicks in the confirm do not count as outside the detail */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Padam rekod #{b?.ids ?? b?.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak boleh dibuat asal. Ini akan memadamkan rekod bayaran secara kekal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Memadam..." : "Padam"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>

    </Dialog>
  )
}
