import { NextResponse } from "next/server"

/** Maps a kontrak DB error to a response the Tetapan form can show as-is. */
export function kontrakErrorResponse(error: any, fallback: string) {
  const message = String(error?.message ?? "")
  if (message.includes("sudah wujud")) {
    return NextResponse.json({ error: message }, { status: 409 })
  }
  // Columns from add-kontrak-fields.sql missing (migration not run yet).
  if (/(tarikh_mula|tarikh_akhir|jenis_kerja|tahun_kontrak)/.test(message)) {
    return NextResponse.json(
      { error: "Lajur baharu kontrak belum wujud. Jalankan add-kontrak-fields.sql dalam Supabase.", details: message },
      { status: 500 },
    )
  }
  if (message.includes("kontrak_tarikh_check")) {
    return NextResponse.json({ error: "Tarikh Akhir tidak boleh sebelum Tarikh Mula" }, { status: 400 })
  }
  return NextResponse.json({ error: fallback, details: message }, { status: 500 })
}
