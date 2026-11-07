import { NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/audit"
import { getAktiviti } from "@/lib/aktiviti"

/**
 * GET /api/aktiviti?jenis=surat|bayaran&aksi=CREATE|UPDATE|DELETE&user=<username>&dari=YYYY-MM-DD&hingga=YYYY-MM-DD&sebelum=<iso>
 * Pengguna → Aktiviti: users' surat and Rekod Bayaran activity, newest first. Admin and Super Admin only.
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Hanya admin dan Super Admin boleh melihat aktiviti" }, { status: 403 })
  }
  const params = new URL(request.url).searchParams
  const jenis = params.get("jenis")
  const aksi = params.get("aksi")
  try {
    return NextResponse.json(
      await getAktiviti({
        jenis: jenis === "surat" || jenis === "bayaran" ? jenis : undefined,
        aksi: aksi && ["CREATE", "UPDATE", "DELETE"].includes(aksi) ? aksi : undefined,
        userId: params.get("user") || undefined,
        dari: params.get("dari") || undefined,
        hingga: params.get("hingga") || undefined,
        sebelum: params.get("sebelum") || undefined,
        limit: Number(params.get("limit")) || undefined,
      }),
    )
  } catch (error: any) {
    console.error("Error fetching aktiviti:", error)
    return NextResponse.json({ error: "Gagal memuatkan aktiviti", details: error?.message }, { status: 500 })
  }
}
