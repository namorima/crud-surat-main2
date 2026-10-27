import { NextResponse } from "next/server"

/** Maps a locker DB error to a response the Setup Locker form can show as-is. */
export function lockerErrorResponse(error: any, fallback: string) {
  const message = String(error?.message ?? "")
  if (message.includes("sudah wujud") || message.includes("masih digunakan")) {
    return NextResponse.json({ error: message }, { status: 409 })
  }
  if (message.includes("locker") && message.includes("does not exist")) {
    return NextResponse.json(
      { error: "Jadual locker belum wujud. Jalankan create-locker.sql dalam Supabase.", details: message },
      { status: 500 },
    )
  }
  return NextResponse.json({ error: fallback, details: message }, { status: 500 })
}
