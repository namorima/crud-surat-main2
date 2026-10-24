import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

/** Whether the browser still holds a valid session cookie (middleware already rejects missing ones). */
export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Sila log masuk semula" }, { status: 401 })
  return NextResponse.json({ uid: session.uid, exp: session.exp })
}
