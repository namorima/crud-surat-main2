import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, renewSessionToken, sessionCookieOptions, shouldRenewSession, verifySessionToken } from "@/lib/session"

/**
 * API routes that work without a session: signing in, password recovery, and
 * the read-only public share-link page (/share/[id]).
 */
const PUBLIC_API: { method: string; pattern: RegExp }[] = [
  { method: "POST", pattern: /^\/api\/auth\/login$/ },
  { method: "POST", pattern: /^\/api\/auth\/logout$/ },
  { method: "POST", pattern: /^\/api\/auth\/forgot-password$/ },
  { method: "POST", pattern: /^\/api\/auth\/reset-password$/ },
  { method: "GET", pattern: /^\/api\/share-link\/[^/]+$/ },
  { method: "GET", pattern: /^\/api\/share-link\/[^/]+\/bayaran$/ },
  { method: "POST", pattern: /^\/api\/share-link\/[^/]+\/increment$/ },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_API.some((route) => route.method === request.method && route.pattern.test(pathname))
  if (isPublic) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) {
    // `code` tells the client why (shown on the login page after an automatic logout)
    return NextResponse.json({ error: "Sila log masuk semula", code: token ? "invalid" : "no-cookie" }, { status: 401 })
  }
  // Sliding session: a day after the cookie was issued, the next request gets
  // a renewed one, so people who keep using the app are not signed out
  const response = NextResponse.next()
  if (shouldRenewSession(session)) {
    response.cookies.set(SESSION_COOKIE, await renewSessionToken(session), sessionCookieOptions)
  }
  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
