"use client"

import { useEffect, useRef, useState } from "react"
import { RiChat3Line, RiDeleteBinLine, RiLoader4Line, RiSendPlane2Line } from "@remixicon/react"
import type { SuratKomen } from "@/types/surat-komen"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/base/buttons/button"
import { TextWithBilLinks } from "@/components/surat/bil-links"
import { cx } from "@/utils/cx"

const MAX = 2000

/** The notifier listens for this so a thread opened by hand also clears its notifications. */
export const KOMEN_READ_EVENT = "komen-notifikasi:read"
/** { bil }: the Surat page opens that surat at its komen (sent by the notifier) */
export const KOMEN_OPEN_EVENT = "komen-notifikasi:open"

const formatWhen = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?"

/**
 * Komen thread of one surat (Maklumat Surat): every signed-in user can read and
 * add komen; authors (and admins) can delete their own. Opening it marks the
 * user's notifications for this surat as read.
 */
export function KomenThread({
  suratId,
  username,
  isAdmin,
  autoFocus,
  onBilClick,
  onChanged,
}: {
  suratId: string
  /** The signed-in user's username, to mark their own komen */
  username: string
  isAdmin: boolean
  /** Focus the box (opened from "Komen" or a notification) */
  autoFocus?: boolean
  onBilClick: (bil: string) => void
  /** New count and newest komen, so the list can update without a reload */
  onChanged?: (count: number, latest: SuratKomen | null) => void
}) {
  const [komen, setKomen] = useState<SuratKomen[] | null>(null)
  const [error, setError] = useState("")
  const [isi, setIsi] = useState("")
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const boxRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setKomen(null)
    setError("")
    fetch(`/api/surat-komen?suratId=${suratId}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Gagal memuatkan komen")
        if (!cancelled) setKomen(body)
      })
      .catch((e) => !cancelled && setError(e.message))
    // Seen: clear this surat's notifications
    fetch("/api/komen-notifikasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suratId }),
    })
      .then(() => window.dispatchEvent(new CustomEvent(KOMEN_READ_EVENT, { detail: { suratId } })))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [suratId])

  useEffect(() => {
    if (!autoFocus || komen === null) return
    endRef.current?.scrollIntoView({ block: "nearest" })
    boxRef.current?.focus({ preventScroll: true })
  }, [autoFocus, komen === null])

  const update = (next: SuratKomen[]) => {
    setKomen(next)
    onChanged?.(next.length, next[next.length - 1] ?? null)
  }

  const send = async () => {
    const text = isi.trim()
    if (!text || sending) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/surat-komen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suratId, isi: text }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || "Gagal menghantar komen")
      update([...(komen ?? []), body])
      setIsi("")
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    setDeleting(id)
    setError("")
    try {
      const res = await fetch(`/api/surat-komen?id=${id}`, { method: "DELETE" })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || "Gagal memadam komen")
      update((komen ?? []).filter((k) => k.id !== id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="mt-3 rounded-2xl border border-border-table p-3 sm:p-4" aria-label="Komen">
      <h3 className="flex items-center gap-1.5 text-caption-1-medium text-text-tertiary">
        <RiChat3Line className="size-4" aria-hidden />
        Komen{komen && komen.length > 0 ? ` (${komen.length})` : ""}
      </h3>

      {komen === null && !error ? (
        <div className="flex items-center gap-2 py-4 text-caption-1-regular text-text-secondary">
          <RiLoader4Line className="size-4 animate-spin" aria-hidden />
          Memuatkan komen...
        </div>
      ) : komen && komen.length === 0 ? (
        <p className="py-3 text-caption-1-regular text-text-tertiary">Belum ada komen. Jadilah yang pertama.</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-3">
          {(komen ?? []).map((k) => {
            const own = !!username && k.userId === username
            return (
              <li key={k.id} className="flex gap-2.5">
                <span
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-caption-2-semibold",
                    own ? "bg-accent-600 text-text-white" : "bg-background-tertiary-default text-text-secondary",
                  )}
                  aria-hidden
                >
                  {initials(k.userName)}
                </span>
                <div className={cx("min-w-0 flex-1 rounded-xl px-3 py-2", own ? "bg-status-blue-background" : "bg-background-secondary-default dark:bg-background-primary-default")}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-caption-1-semibold text-text-primary">{k.userName || "Tidak diketahui"}</span>
                    <span className="text-caption-2-regular text-text-tertiary tabular-nums">{formatWhen(k.createdAt)}</span>
                    {own || isAdmin ? (
                      <button
                        type="button"
                        onClick={() => remove(k.id)}
                        disabled={deleting === k.id}
                        aria-label="Padam komen"
                        title="Padam komen"
                        className="ms-auto inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-foreground-icon-tertiary outline-none hover:bg-background-secondary-hover hover:text-text-destructive focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:opacity-50"
                      >
                        {deleting === k.id ? <RiLoader4Line className="size-3.5 animate-spin" aria-hidden /> : <RiDeleteBinLine className="size-3.5" aria-hidden />}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-body-regular text-text-primary break-words [overflow-wrap:anywhere]">
                    <TextWithBilLinks text={k.isi} onBilClick={onBilClick} />
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {error && <p className="mt-2 text-caption-1-regular text-text-destructive">{error}</p>}

      <div ref={endRef} className="mt-3 flex items-end gap-2">
        <Textarea
          ref={boxRef}
          value={isi}
          onChange={(e) => setIsi(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            // Ctrl/Cmd + Enter sends; Enter alone is a new line
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          rows={2}
          placeholder="Tulis komen... (#123 untuk pautan surat)"
          aria-label="Tulis komen"
          className="min-h-[2.75rem] flex-1 resize-none [field-sizing:content] max-h-40"
        />
        <Button
          type="button"
          size="small"
          leadingIcon={sending ? undefined : RiSendPlane2Line}
          onClick={send}
          disabled={!isi.trim() || sending}
          aria-label="Hantar komen"
          className="shrink-0"
        >
          {sending ? <RiLoader4Line className="size-4 animate-spin" aria-hidden /> : <span className="hidden sm:inline">Hantar</span>}
        </Button>
      </div>
    </section>
  )
}
