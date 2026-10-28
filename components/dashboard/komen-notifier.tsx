"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { RiChat3Line } from "@remixicon/react"
import type { KomenNotifikasi } from "@/types/surat-komen"
import { Button } from "@/components/base/buttons/button"
import { KOMEN_OPEN_EVENT, KOMEN_READ_EVENT } from "@/components/surat/KomenThread"

/** Unread komen grouped per surat: the newest one and how many. */
type Group = { latest: KomenNotifikasi; count: number }

const SHOWN = 3
const REFRESH_MS = 5 * 60 * 1000

const group = (items: KomenNotifikasi[]): Group[] => {
  const bySurat = new Map<string, Group>()
  // items are newest first, so the first of each surat is its latest
  for (const item of items) {
    const prev = bySurat.get(item.suratId)
    bySurat.set(item.suratId, prev ? { ...prev, count: prev.count + 1 } : { latest: item, count: 1 })
  }
  return [...bySurat.values()]
}

const markRead = (suratId?: string) =>
  fetch("/api/komen-notifikasi", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(suratId ? { suratId } : {}),
  }).catch(() => {})

/**
 * New komen on surat the user keyed (or commented on), shown when they open the
 * app: "Buka komen" opens Maklumat Surat at its komen, "Abaikan" marks it read.
 */
export function KomenNotifier() {
  const router = useRouter()
  const pathname = usePathname()
  const [groups, setGroups] = useState<Group[]>([])
  const lastFetch = useRef(0)

  const load = useCallback(async () => {
    lastFetch.current = Date.now()
    try {
      const res = await fetch("/api/komen-notifikasi")
      if (!res.ok) return
      const items: KomenNotifikasi[] = await res.json()
      setGroups(group(items))
    } catch {
      // Notifications are a nicety; the page works without them
    }
  }, [])

  useEffect(() => {
    load()
    // Back to the tab after a while: check again
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetch.current > REFRESH_MS) load()
    }
    // A thread opened by hand clears its own notifications
    const onRead = (e: Event) => {
      const suratId = (e as CustomEvent<{ suratId: string }>).detail?.suratId
      setGroups((prev) => prev.filter((g) => g.latest.suratId !== suratId))
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener(KOMEN_READ_EVENT, onRead)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener(KOMEN_READ_EVENT, onRead)
    }
  }, [load])

  const dismiss = (suratId: string) => {
    setGroups((prev) => prev.filter((g) => g.latest.suratId !== suratId))
    markRead(suratId)
  }

  const open = (g: Group) => {
    dismiss(g.latest.suratId)
    if (pathname === "/dashboard/surat") {
      window.dispatchEvent(new CustomEvent(KOMEN_OPEN_EVENT, { detail: { bil: g.latest.bil } }))
    } else {
      router.push(`/dashboard/surat?komen=${g.latest.bil}`)
    }
  }

  const dismissAll = () => {
    setGroups([])
    markRead()
  }

  if (groups.length === 0) return null
  const total = groups.reduce((n, g) => n + g.count, 0)

  return (
    <aside
      aria-label="Notifikasi komen"
      aria-live="polite"
      className="fixed inset-x-3 top-3 z-50 flex flex-col gap-2 rounded-3xl bg-background-secondary-default p-3 shadow-dropdown animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:w-[380px] sm:slide-in-from-bottom-2"
    >
      <header className="flex items-center gap-2 px-1">
        <span className="flex size-7 items-center justify-center rounded-full bg-status-blue-background text-status-blue-text">
          <RiChat3Line className="size-4" aria-hidden />
        </span>
        <h2 className="flex-1 text-body-semibold text-text-primary">
          {total} komen baru
        </h2>
        {groups.length > 1 && (
          <button
            type="button"
            onClick={dismissAll}
            className="cursor-pointer rounded-md px-1.5 py-0.5 text-caption-1-medium text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          >
            Abaikan semua
          </button>
        )}
      </header>

      <ul className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto">
        {groups.slice(0, SHOWN).map((g) => (
          <li key={g.latest.suratId} className="rounded-2xl bg-background-primary-default p-3 dark:bg-neutral-800">
            <p className="text-caption-1-regular text-text-secondary">
              <span className="text-caption-1-semibold text-text-primary">{g.latest.userName}</span> mengomen{" "}
              <span className="text-caption-1-semibold text-text-primary">Surat #{g.latest.bil}</span>
              {g.count > 1 && <span> · {g.count} komen</span>}
            </p>
            {g.latest.perkara && <p className="mt-0.5 truncate text-caption-2-regular text-text-tertiary">{g.latest.perkara}</p>}
            <p className="mt-1.5 line-clamp-2 text-body-regular text-text-primary break-words">“{g.latest.isi}”</p>
            <div className="mt-2.5 flex gap-2">
              <Button variant="secondary" size="small" onClick={() => dismiss(g.latest.suratId)} className="flex-1">
                Abaikan
              </Button>
              <Button variant="primary" size="small" onClick={() => open(g)} className="flex-1">
                Buka komen
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {groups.length > SHOWN && (
        <p className="px-1 text-caption-1-regular text-text-tertiary">+{groups.length - SHOWN} surat lagi</p>
      )}
    </aside>
  )
}
