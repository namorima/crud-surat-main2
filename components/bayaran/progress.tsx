"use client"

import type { Bayaran } from "@/types/bayaran"
import { cx } from "@/utils/cx"

/** Process steps after Terima, in order. Shared by the list and the detail dialog. */
export const BAYARAN_STEPS: { key: keyof Bayaran; label: string; short: string }[] = [
  { key: "tarikhMemoLadang", label: "Memo Ladang", short: "Memo" },
  { key: "tarikhPpnP", label: "PPN (P)", short: "PPN(P)" },
  { key: "tarikhPn", label: "PN", short: "PN" },
  { key: "tarikhHantar", label: "Hantar ke Kewangan", short: "Hantar" },
  { key: "tarikhBayar", label: "Dibayar", short: "Bayar" },
]

export const isBayaranSelesai = (item: Bayaran) => item.statusBayaran?.toLowerCase() === "selesai"
export const isBayaranBatal = (item: Bayaran) => item.statusBayaran?.toUpperCase() === "BATAL"
export const isBayaranHold = (item: Bayaran) => item.statusLadang?.toUpperCase() === "HOLD / KIV"

/** How far the record has gone: index of the last step done (-1 = only received). */
export function bayaranStepIndex(item: Bayaran): number {
  let last = -1
  BAYARAN_STEPS.forEach((step, i) => {
    if (item[step.key]) last = i
  })
  if (isBayaranSelesai(item)) last = BAYARAN_STEPS.length - 1
  return last
}

export function bayaranStageLabel(item: Bayaran): string {
  const i = bayaranStepIndex(item)
  return i < 0 ? "Diterima" : BAYARAN_STEPS[i].short
}

/**
 * Five small segments, filled up to the last step done: accent while in
 * progress, lime when paid, rose when cancelled. The label carries the
 * meaning so colour is never the only cue.
 */
export function StageDots({ item, className }: { item: Bayaran; className?: string }) {
  const done = bayaranStepIndex(item)
  const fill = isBayaranBatal(item) ? "bg-rose-500" : isBayaranSelesai(item) ? "bg-lime-600" : "bg-accent-500"
  return (
    <span
      className={cx("inline-flex items-center gap-1.5", className)}
      title={`Peringkat: ${bayaranStageLabel(item)}`}
    >
      <span className="inline-flex gap-0.5" aria-hidden>
        {BAYARAN_STEPS.map((step, i) => (
          <span key={step.key} className={cx("h-1.5 w-3 rounded-full", i <= done ? fill : "bg-background-tertiary-default")} />
        ))}
      </span>
      <span className="text-caption-2-medium text-text-tertiary">{bayaranStageLabel(item)}</span>
    </span>
  )
}
