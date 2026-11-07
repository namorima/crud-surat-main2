import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session"

/** `code` says why: no-cookie | invalid | inactive (shown on the login page). */
const signedOut = (code: "no-cookie" | "invalid" | "inactive") => {
  const response = NextResponse.json({ error: "Sila log masuk semula", code }, { status: 401 })
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 })
  return response
}

/**
 * Whether the browser still holds a valid session (middleware already rejects
 * missing ones, and renews old ones). Checked when the app opens: since the
 * session now slides, an account that was deleted or deactivated is signed
 * out here instead of staying in.
 */
export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) {
    const hasCookie = (request.headers.get("cookie") || "").split(/;\s*/).some((part) => part.startsWith(`${SESSION_COOKIE}=`))
    return signedOut(hasCookie ? "invalid" : "no-cookie")
  }
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("username, is_active")
    .eq("username", session.uid)
    .maybeSingle()
  // A database hiccup must not sign everyone out; only a missing or inactive account does
  if (!error && (!data || data.is_active === false)) return signedOut("inactive")
  return NextResponse.json({ uid: session.uid, exp: session.exp })
}
