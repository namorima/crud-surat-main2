import type { Bayaran } from "@/types/bayaran"

/**
 * The Dashboard already holds every bayaran. When it opens a Rekod Bayaran on
 * the Bayaran page, it leaves them here so that page can show the record at
 * once instead of waiting for /api/bayaran; the page still fetches fresh data
 * behind it. Per tab (sessionStorage), read once, and only if recent.
 */
const KEY = "bayaran:seed"
const MAX_AGE = 2 * 60 * 1000

export function saveBayaranSeed(rows: Bayaran[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), rows }))
  } catch {
    // storage full or blocked: the page just fetches as usual
  }
}

export function takeBayaranSeed(): Bayaran[] | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw) return null
    const { at, rows } = JSON.parse(raw) as { at: number; rows: Bayaran[] }
    return Date.now() - at < MAX_AGE && Array.isArray(rows) ? rows : null
  } catch {
    return null
  }
}
