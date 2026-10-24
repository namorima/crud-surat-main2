/**
 * Signed session cookie for API routes.
 *
 * Login sets an HttpOnly cookie holding `payload.signature` (HMAC-SHA256),
 * and middleware.ts rejects /api requests without a valid one. Uses only Web
 * Crypto so it runs in both the Edge middleware and Node route handlers.
 *
 * Secret: SESSION_SECRET, falling back to SUPABASE_SERVICE_ROLE_KEY (also
 * server-only) so a deploy without the new variable keeps working.
 */

export const SESSION_COOKIE = "crud_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  /** username (the app's user id) */
  uid: string
  role: string
  roleId: string | null
  /** expiry, seconds since epoch */
  exp: number
}

const encoder = new TextEncoder()

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set")
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ])
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)))
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function createSessionToken(user: { uid: string; role: string; roleId?: string | null }): Promise<string> {
  const payload: SessionPayload = {
    uid: user.uid,
    role: user.role || "",
    roleId: user.roleId ?? null,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  return `${body}.${toBase64Url(await hmac(body))}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null
  try {
    if (!timingSafeEqual(fromBase64Url(signature), await hmac(body))) return null
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

/** Reads the session from a request's Cookie header (route handlers). */
export async function getSession(request: Request): Promise<SessionPayload | null> {
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return verifySessionToken(match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
}
