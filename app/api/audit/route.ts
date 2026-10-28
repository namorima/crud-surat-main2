import { NextResponse } from "next/server"
import { getAuditEntries, isAdminRequest } from "@/lib/audit"

/**
 * GET /api/audit?type=surat&id=<surat id>&bil=<bil>  or  ?type=bayaran&id=<bayaran id>
 * Who keyed, edited or deleted the record, newest first. Admin and Super Admin only.
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Hanya admin dan Super Admin boleh melihat audit" }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const id = searchParams.get("id") || ""
  const bil = Number(searchParams.get("bil")) || undefined
  if ((type !== "surat" && type !== "bayaran") || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "type (surat | bayaran) dan id diperlukan" }, { status: 400 })
  }
  try {
    return NextResponse.json(await getAuditEntries(type, id, type === "surat" ? bil : undefined))
  } catch (error: any) {
    console.error("Error fetching audit:", error)
    const missing = String(error?.message || "").includes("audit_surat")
    return NextResponse.json(
      { error: missing ? "Jadual audit belum wujud. Jalankan create-audit-surat.sql dalam Supabase." : "Gagal memuatkan audit", details: error?.message },
      { status: 500 },
    )
  }
}
