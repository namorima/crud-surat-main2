import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session"

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

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: "Sila log masuk semula" }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
