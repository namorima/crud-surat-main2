/**
 * Why the app signed someone out on its own (not the Logout button), kept in
 * localStorage so the login page can show it. Helps find what signs people
 * out, e.g. after a deploy.
 */

export const LOGOUT_REASON_KEY = "auth:logout-reason"

export type LogoutReason = {
  /** ISO time it happened */
  at: string
  /** The /api request that was refused (401) */
  path: string
  /** Why the server refused, from its 401 reply: "no-cookie" | "invalid" | "inactive" */
  code?: string
  /** Where the app found out: opening the app, or a later request */
  source: "buka-aplikasi" | "permintaan-api"
  /** The address the app was open on */
  host: string
}

export function saveLogoutReason(reason: Omit<LogoutReason, "at" | "host">) {
  try {
    const full: LogoutReason = { ...reason, at: new Date().toISOString(), host: window.location.host }
    localStorage.setItem(LOGOUT_REASON_KEY, JSON.stringify(full))
  } catch {
    // storage blocked: nothing to remember
  }
}

export function readLogoutReason(): LogoutReason | null {
  try {
    const raw = localStorage.getItem(LOGOUT_REASON_KEY)
    return raw ? (JSON.parse(raw) as LogoutReason) : null
  } catch {
    return null
  }
}

export function clearLogoutReason() {
  try {
    localStorage.removeItem(LOGOUT_REASON_KEY)
  } catch {
    // ignore
  }
}

const CODE_TEXT: Record<string, string> = {
  "no-cookie": "pelayar tidak menghantar cookie sesi",
  invalid: "cookie sesi tidak sah atau tamat tempoh",
  inactive: "akaun tidak wujud atau tidak aktif",
}

/** One line for the login page, in Malay. */
export function describeLogoutReason(reason: LogoutReason): string {
  const bila = new Date(reason.at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })
  const sebab = (reason.code && CODE_TEXT[reason.code]) || "sesi ditolak (401)"
  const di = reason.source === "buka-aplikasi" ? "semasa membuka aplikasi" : `pada ${reason.path}`
  return `Anda dilog keluar secara automatik ${bila} ${di}: ${sebab}. Alamat: ${reason.host}`
}

/** The `code` field of a 401 reply, if any. */
export async function codeOf(response: Response): Promise<string | undefined> {
  try {
    const body = await response.clone().json()
    return typeof body?.code === "string" ? body.code : undefined
  } catch {
    return undefined
  }
}
