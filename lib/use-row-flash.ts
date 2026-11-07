"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** How long a new row keeps flashing (matches `row-flash` in app/globals.css). */
export const ROW_FLASH_MS = 3600

/**
 * Marks a newly added record so its row flashes in the list (Surat,
 * Rekod Bayaran). `flash(key)` after saving; once the refreshed list holds the
 * key, the page turns to the page that has it and `flashKey` stays set for
 * ROW_FLASH_MS so the row can carry the `row-flash` class.
 *
 * `keys` are the filtered, sorted keys in list order (memoize them).
 */
export function useRowFlash<K extends string | number>(keys: K[], pageSize: number, setPage: (page: number) => void) {
  const [flashKey, setFlashKey] = useState<K | null>(null)
  const pending = useRef<K | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  const flash = useCallback(
    (key: K | null | undefined) => {
      if (key === null || key === undefined) return
      stop()
      pending.current = key
      setFlashKey(null)
      // A record the filters hide never shows up: give up after a while
      timer.current = setTimeout(() => {
        pending.current = null
      }, 15000)
    },
    [stop],
  )

  useEffect(() => {
    const key = pending.current
    if (key === null) return
    const index = keys.indexOf(key)
    if (index < 0) return
    pending.current = null
    stop()
    setPage(Math.floor(index / pageSize) + 1)
    setFlashKey(key)
    timer.current = setTimeout(() => setFlashKey(null), ROW_FLASH_MS)
  }, [keys, pageSize, setPage, stop])

  // Bring the flashing row into view (the table on iPad / desktop, the card on phones)
  useEffect(() => {
    if (flashKey === null) return
    const frame = requestAnimationFrame(() => {
      const row = Array.from(document.querySelectorAll<HTMLElement>(".row-flash")).find((el) => el.getClientRects().length > 0)
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    })
    return () => cancelAnimationFrame(frame)
  }, [flashKey])

  useEffect(() => stop, [stop])

  return { flashKey, flash }
}
