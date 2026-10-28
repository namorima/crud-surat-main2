"use client"

import { useState } from "react"
import { RiArrowRightLine, RiHistoryLine, RiLoader4Line } from "@remixicon/react"
import type { User } from "@/types/user"
import type { AuditEntry } from "@/types/audit"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chip, type ChipProps } from "@/components/base/badges/chip"
import { Button } from "@/components/base/buttons/button"
import { cx } from "@/utils/cx"

/** Admin and Super Admin see the audit (the API checks again). */
export const canViewAudit = (user: User | null) => !!user && ["semua", "Super Admin", "admin"].includes(user.role)

const ACTION: Record<string, { label: string; color: NonNullable<ChipProps["color"]> }> = {
  CREATE: { label: "Dikeyin", color: "lime" },
  UPDATE: { label: "Dikemaskini", color: "blue" },
  BULK_UPDATE_STATUS: { label: "Status (pukal)", color: "purple" },
  DELETE: { label: "Dipadam", color: "rose" },
}

const formatWhen = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Changes({ entry }: { entry: AuditEntry }) {
  if (entry.changes.length === 0) return null
  // A new or deleted record lists its values, not before → after
  const snapshot = entry.action === "CREATE" || entry.action === "DELETE"
  return (
    <dl className="mt-2 grid gap-1.5 rounded-xl bg-background-secondary-default p-2.5 text-caption-1-regular dark:bg-background-primary-default">
      {entry.changes.map((change) => (
        <div key={change.field} className="grid grid-cols-[minmax(84px,30%)_1fr] gap-2">
          <dt className="text-text-tertiary">{change.label}</dt>
          <dd className="min-w-0 break-words text-text-primary [overflow-wrap:anywhere]">
            {snapshot ? (
              (entry.action === "DELETE" ? change.from : change.to) || "-"
            ) : (
              <span className="inline-flex flex-wrap items-center gap-1">
                <span className="text-text-secondary line-through decoration-text-tertiary">{change.from || "-"}</span>
                <RiArrowRightLine className="size-3 shrink-0 text-text-tertiary" aria-label="kepada" />
                <span className="font-medium">{change.to || "-"}</span>
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Clock button for the detail dialogs: opens who keyed, edited and deleted the
 * record (GET /api/audit), newest first. Render it only when canViewAudit(user).
 */
export function AuditButton({
  type,
  id,
  bil,
  title,
}: {
  type: "surat" | "bayaran"
  id: string
  /** Surat only: finds entries logged before the surat had an id in the log */
  bil?: number
  /** e.g. "Surat #24" */
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [error, setError] = useState("")

  const load = async () => {
    setEntries(null)
    setError("")
    try {
      const params = new URLSearchParams({ type, id })
      if (bil) params.set("bil", String(bil))
      const response = await fetch(`/api/audit?${params}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error || "Gagal memuatkan audit")
      setEntries(body)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          load()
        }}
        aria-label={`Audit ${title}`}
        title="Audit: siapa keyin, kemaskini dan padam"
        className="motion-press inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-foreground-icon-secondary outline-none transition-colors hover:bg-background-secondary-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      >
        <RiHistoryLine className="size-4.5" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px] sm:p-0">
          <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
            <DialogTitle className="flex items-center gap-2 pr-8 text-headline-semibold text-text-primary">
              <RiHistoryLine className="size-5 text-foreground-icon-secondary" aria-hidden />
              Audit · {title}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              Siapa yang keyin, kemaskini dan padam rekod ini. Yang terbaru di atas.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {error ? (
              <p className="py-8 text-center text-body-regular text-text-destructive">{error}</p>
            ) : entries === null ? (
              <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
                <RiLoader4Line className="size-5 animate-spin" aria-hidden />
                Memuatkan...
              </div>
            ) : entries.length === 0 ? (
              <p className="py-10 text-center text-body-regular text-text-secondary">
                Tiada rekod audit lagi. Perubahan akan direkodkan mulai sekarang.
              </p>
            ) : (
              <ol className="motion-stagger relative flex flex-col gap-4">
                {entries.map((entry, i) => {
                  const action = ACTION[entry.action] ?? { label: entry.action, color: "neutral" as const }
                  return (
                    <li key={entry.id} className="relative ps-6">
                      {/* timeline line and dot */}
                      {i < entries.length - 1 && (
                        <span className="absolute top-4 bottom-[-1rem] left-[5px] w-px bg-border-table" aria-hidden />
                      )}
                      <span
                        className={cx(
                          "absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-background-primary-default",
                          entry.action === "DELETE" ? "bg-status-rose-text" : entry.action === "CREATE" ? "bg-status-lime-text" : "bg-accent-600",
                        )}
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Chip variant="caption" color={action.color}>
                          {action.label}
                        </Chip>
                        <span className="text-body-semibold text-text-primary">{entry.userName || "Tidak diketahui"}</span>
                        {entry.userId && <span className="text-caption-1-regular text-text-tertiary">@{entry.userId}</span>}
                      </div>
                      <p className="mt-0.5 text-caption-1-regular text-text-tertiary tabular-nums">{formatWhen(entry.createdAt)}</p>
                      {entry.details && <p className="mt-1 text-body-regular text-text-secondary">{entry.details}</p>}
                      <Changes entry={entry} />
                    </li>
                  )
                })}
              </ol>
            )}
          </div>

          <footer className="flex border-t border-border-table px-4 py-3 sm:justify-end sm:px-6">
            <Button variant="secondary" size="small" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Tutup
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  )
}
