import type { Bayaran } from "@/types/bayaran"
import type { Surat } from "@/types/surat"

/** Dashboard aggregations. Pure functions so the page only renders. */

export type Period = "12m" | "year" | "all"

export type Row = { label: string; value: number; count?: number }

const DAY = 24 * 60 * 60 * 1000
const MONTHS = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"]

/** "DD/MM/YYYY" (API display format) or "YYYY-MM-DD" → Date, else null. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  let m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return null
}

/** "RM 4,053.05" / "4053.05" → 4053.05 (0 when empty or not a number). */
export function parseAmount(value: string | null | undefined): number {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function formatRM(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) return `RM ${(value / 1_000_000).toFixed(2)} juta`
  if (compact && Math.abs(value) >= 10_000) return `RM ${(value / 1000).toFixed(1)}k`
  return `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "year") return new Date(now.getFullYear(), 0, 1)
  if (period === "12m") return new Date(now.getFullYear(), now.getMonth() - 11, 1)
  return null
}

export const PERIOD_LABEL: Record<Period, string> = {
  "12m": "12 bulan terakhir",
  year: `Tahun ${new Date().getFullYear()}`,
  all: "Semua rekod",
}

function inPeriod(date: Date | null, start: Date | null): boolean {
  if (!start) return true
  return !!date && date >= start
}

/** Last N calendar months ending this month (oldest first), capped by the period start. */
export function monthBuckets(period: Period, now = new Date(), max = 12) {
  const start = periodStart(period, now)
  const buckets: { key: string; label: string; start: Date }[] = []
  for (let i = max - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    if (start && d < new Date(start.getFullYear(), start.getMonth(), 1)) continue
    const yy = String(d.getFullYear()).slice(2)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTHS[d.getMonth()]} ${yy}`, start: d })
  }
  return buckets
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

/** Sum (or count) per label, largest first; the tail past `top` folds into "Lain-lain". */
function groupRows<T>(
  items: T[],
  labelOf: (item: T) => string,
  valueOf: (item: T) => number,
  top = 0,
): Row[] {
  const map = new Map<string, Row>()
  for (const item of items) {
    const label = labelOf(item)
    const row = map.get(label) ?? { label, value: 0, count: 0 }
    row.value += valueOf(item)
    row.count = (row.count ?? 0) + 1
    map.set(label, row)
  }
  const rows = [...map.values()].sort((a, b) => b.value - a.value)
  if (!top || rows.length <= top) return rows
  const rest = rows.slice(top)
  return [
    ...rows.slice(0, top),
    {
      label: `Lain-lain (${rest.length})`,
      value: rest.reduce((s, r) => s + r.value, 0),
      count: rest.reduce((s, r) => s + (r.count ?? 0), 0),
    },
  ]
}

const clean = (value: string | null | undefined, fallback: string) => (value || "").trim() || fallback

function average(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null
}

function ageBuckets<T>(items: T[], dateOf: (item: T) => Date | null, edges: number[], valueOf: (item: T) => number, now: Date) {
  const labels = edges.map((edge, i) => (i === 0 ? `≤ ${edge} hari` : `${edges[i - 1] + 1}–${edge} hari`))
  labels.push(`> ${edges[edges.length - 1]} hari`)
  const rows: Row[] = labels.map((label) => ({ label, value: 0, count: 0 }))
  for (const item of items) {
    const d = dateOf(item)
    if (!d) continue
    const days = Math.floor((now.getTime() - d.getTime()) / DAY)
    let i = edges.findIndex((edge) => days <= edge)
    if (i === -1) i = edges.length
    rows[i].value += valueOf(item)
    rows[i].count = (rows[i].count ?? 0) + 1
  }
  return rows
}

// ---------------------------------------------------------------- Bayaran

export const isPaid = (b: Bayaran) => (b.statusBayaran || "").toUpperCase() === "SELESAI"
export const isCancelled = (b: Bayaran) => (b.statusBayaran || "").toUpperCase() === "BATAL"

export function bayaranStats(all: Bayaran[], period: Period, now = new Date()) {
  const start = periodStart(period, now)
  const rows = all.filter((b) => inPeriod(parseDate(b.tarikhTerima), start))
  const active = rows.filter((b) => !isCancelled(b))
  const paid = active.filter(isPaid)
  const unpaid = active.filter((b) => !isPaid(b))
  const sum = (list: Bayaran[]) => list.reduce((s, b) => s + parseAmount(b.nilaiBayaran), 0)
  const amount = (b: Bayaran) => parseAmount(b.nilaiBayaran)

  const daysToPay = paid
    .map((b) => {
      const from = parseDate(b.tarikhTerima)
      const to = parseDate(b.tarikhBayar)
      return from && to ? Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY)) : null
    })
    .filter((d): d is number => d !== null)

  const months = monthBuckets(period, now)
  const monthly = months.map((m) => ({ label: m.label, dibayar: 0, belum: 0, rekod: 0 }))
  const index = new Map(months.map((m, i) => [m.key, i]))
  for (const b of active) {
    const d = parseDate(b.tarikhTerima)
    const i = d ? index.get(monthKey(d)) : undefined
    if (i === undefined) continue
    monthly[i][isPaid(b) ? "dibayar" : "belum"] += amount(b)
    monthly[i].rekod += 1
  }

  const stages: { label: string; done: (b: Bayaran) => boolean }[] = [
    { label: "Diterima", done: () => true },
    { label: "Memo Ladang", done: (b) => !!b.tarikhMemoLadang },
    { label: "PPN (P)", done: (b) => !!b.tarikhPpnP },
    { label: "PN", done: (b) => !!b.tarikhPn },
    { label: "Dihantar ke Kewangan", done: (b) => !!b.tarikhHantar },
    { label: "Dibayar", done: (b) => isPaid(b) || !!b.tarikhBayar },
  ]
  const funnel: Row[] = stages.map((s) => ({ label: s.label, value: active.filter(s.done).length }))

  return {
    total: { count: active.length, amount: sum(active) },
    paid: { count: paid.length, amount: sum(paid) },
    unpaid: { count: unpaid.length, amount: sum(unpaid) },
    cancelled: rows.length - active.length,
    avgDaysToPay: average(daysToPay),
    monthly,
    funnel,
    status: groupRows(rows, (b) => clean(b.statusBayaran, "Tiada status"), () => 1),
    kawasan: groupRows(active, (b) => clean(b.daripada, "Tidak diketahui").toUpperCase(), amount, 7),
    kategori: groupRows(active, (b) => clean(b.kategori, "Tiada kategori"), amount, 6),
    kontraktor: groupRows(
      active.filter((b) => (b.namaKontraktor || "").trim()),
      (b) => b.namaKontraktor.trim().toUpperCase(),
      amount,
      6,
    ),
    unpaidByPenerima: groupRows(unpaid, (b) => clean(b.penerima, "Belum ditetapkan"), amount, 6),
    unpaidAge: ageBuckets(unpaid, (b) => parseDate(b.tarikhTerima), [30, 60, 90], amount, now),
    // From Tarikh Hantar (to Kewangan); records not sent yet are left out
    unpaidAgeHantar: ageBuckets(unpaid, (b) => parseDate(b.tarikhHantar), [30, 60, 90], amount, now),
  }
}

export type KontrakRow = {
  key: string
  kawasan: string
  noKontrak: string
  kontraktor: string
  kategori: string
  paid: number
  unpaid: number
  count: number
}

/**
 * Bayaran per kontrak (kawasan + no kontrak) in the period, largest total
 * first. Batal records and records without a no kontrak are left out;
 * kawasan / kategori "" means all.
 */
export function kontrakBayaran(
  all: Bayaran[],
  period: Period,
  filter: { kawasan?: string; kategori?: string } = {},
  now = new Date(),
): KontrakRow[] {
  const start = periodStart(period, now)
  const map = new Map<string, KontrakRow>()
  for (const b of all) {
    const noKontrak = (b.noKontrak || "").trim().toUpperCase()
    if (!noKontrak || isCancelled(b) || !inPeriod(parseDate(b.tarikhTerima), start)) continue
    const kawasan = clean(b.daripada, "Tidak diketahui").toUpperCase()
    const kategori = clean(b.kategori, "Tiada kategori")
    if (filter.kawasan && kawasan !== filter.kawasan) continue
    if (filter.kategori && kategori !== filter.kategori) continue
    const key = `${kawasan}|${noKontrak}`
    const row = map.get(key) ?? { key, kawasan, noKontrak, kontraktor: "", kategori, paid: 0, unpaid: 0, count: 0 }
    row[isPaid(b) ? "paid" : "unpaid"] += parseAmount(b.nilaiBayaran)
    row.count += 1
    if (!row.kontraktor && b.namaKontraktor) row.kontraktor = b.namaKontraktor.trim().toUpperCase()
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => b.paid + b.unpaid - (a.paid + a.unpaid))
}

export type KontrakDetail = {
  /** Every non-batal bayaran of the kontrak (any period), oldest tarikh terima first */
  rows: Bayaran[]
  jumlahNilai: number
  jumlahWangTahanan: number
  /** Nilai of the WCP bayaran */
  jumlahWcp: number
  /** Kemajuan claimed: nilai + wang tahanan of every bayaran except WCP and WANG TAHANAN (release) */
  kemajuan: number
}

/**
 * The bayaran of one kontrak (kawasan + no kontrak) for the Dashboard detail.
 * Peratus Bayaran = kemajuan / Nilai Kontrak: KEMAJUAN (and records keyed before
 * Jenis Bayaran, and PIECERATE) count their nilai plus the wang tahanan held
 * back; WCP is left out, and a WANG TAHANAN bayaran (the retention paid out
 * later) too, since its amount is already counted with its kemajuan.
 */
export function kontrakDetail(all: Bayaran[], kawasan: string, noKontrak: string): KontrakDetail {
  const rows = all
    .filter(
      (b) =>
        !isCancelled(b) &&
        (b.noKontrak || "").trim().toUpperCase() === noKontrak &&
        clean(b.daripada, "Tidak diketahui").toUpperCase() === kawasan,
    )
    .sort(
      (a, b) =>
        (parseDate(a.tarikhTerima)?.getTime() ?? 0) - (parseDate(b.tarikhTerima)?.getTime() ?? 0) || (a.ids ?? 0) - (b.ids ?? 0),
    )
  let jumlahNilai = 0
  let jumlahWangTahanan = 0
  let jumlahWcp = 0
  let kemajuan = 0
  for (const b of rows) {
    const nilai = parseAmount(b.nilaiBayaran)
    const tahanan = parseAmount(b.wangTahanan)
    const jenis = (b.jenisBayaran || "").toUpperCase()
    jumlahNilai += nilai
    jumlahWangTahanan += tahanan
    if (jenis === "WCP") jumlahWcp += nilai
    else if (jenis !== "WANG TAHANAN") kemajuan += nilai + tahanan
  }
  return { rows, jumlahNilai, jumlahWangTahanan, jumlahWcp, kemajuan }
}

// ---------------------------------------------------------------- Surat

const isDone = (s: Surat) => s.status === "SELESAI"
const isOpen = (s: Surat) => s.status !== "SELESAI" && s.status !== "BATAL"

/** Roles that see every unit's surat (Surat page and Dashboard); everyone else sees only the unit named like their role. */
export const SEMUA_UNIT_ROLES = ["semua", "Super Admin", "admin", "PENGURUS"]

/** Surat of the user's own unit (unit = role, ignoring case); all of them for SEMUA_UNIT_ROLES. */
export function suratForRole(all: Surat[], role: string | undefined): Surat[] {
  if (!role || SEMUA_UNIT_ROLES.includes(role)) return all
  const unit = role.trim().toLowerCase()
  return all.filter((s) => (s.unit || "").trim().toLowerCase() === unit)
}

export type Tertunggak = { surat: Surat; hari: number }

/**
 * Surat Tertunggak: open surat (not SELESAI or BATAL) whose tarikh is more than
 * minDays days ago, oldest first. Surat without a readable tarikh are left out.
 */
export function suratTertunggak(all: Surat[], now = new Date(), minDays = 30): Tertunggak[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const rows: Tertunggak[] = []
  for (const surat of all) {
    if (!isOpen(surat)) continue
    const tarikh = parseDate(surat.tarikh)
    if (!tarikh) continue
    const hari = Math.round((today - tarikh.getTime()) / DAY)
    if (hari > minDays) rows.push({ surat, hari })
  }
  return rows.sort((a, b) => b.hari - a.hari || b.surat.bil - a.surat.bil)
}

export const SURAT_STATUS_ORDER = ["BELUM PROSES", "DALAM TINDAKAN", "HOLD / KIV", "SELESAI", "BATAL"]

export function suratStats(all: Surat[], period: Period, now = new Date()) {
  const start = periodStart(period, now)
  const rows = all.filter((s) => inPeriod(parseDate(s.tarikh), start))
  const open = rows.filter(isOpen)
  const done = rows.filter(isDone)
  const countable = rows.filter((s) => s.status !== "BATAL")

  const daysToClose = done
    .map((s) => {
      const from = parseDate(s.tarikh)
      const to = parseDate(s.tarikhSelesai)
      return from && to ? Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY)) : null
    })
    .filter((d): d is number => d !== null)

  const months = monthBuckets(period, now)
  const monthly = months.map((m) => ({ label: m.label, masuk: 0, keluar: 0 }))
  const index = new Map(months.map((m, i) => [m.key, i]))
  for (const s of rows) {
    const d = parseDate(s.tarikh)
    const i = d ? index.get(monthKey(d)) : undefined
    if (i === undefined) continue
    monthly[i][(s.kategori || "").toUpperCase() === "KELUAR" ? "keluar" : "masuk"] += 1
  }

  const status = groupRows(rows, (s) => s.status || "Tiada status", () => 1).sort(
    (a, b) => SURAT_STATUS_ORDER.indexOf(a.label) - SURAT_STATUS_ORDER.indexOf(b.label),
  )

  return {
    total: rows.length,
    pending: rows.filter((s) => s.status === "BELUM PROSES").length,
    inProgress: rows.filter((s) => s.status === "DALAM TINDAKAN").length,
    open: open.length,
    doneRate: countable.length ? done.length / countable.length : null,
    avgDaysToClose: average(daysToClose),
    monthly,
    status,
    unit: groupRows(rows, (s) => clean(s.unit, "Tiada unit").toUpperCase(), () => 1, 6),
    // Every surat not SELESAI (BATAL included), per PIC
    openByPic: groupRows(
      rows.filter((s) => s.status !== "SELESAI"),
      (s) => clean(s.tindakanPic, "Tiada PIC").toUpperCase(),
      () => 1,
      7,
    ),
    openAge: ageBuckets(open, (s) => parseDate(s.tarikh), [7, 30, 90], () => 1, now),
  }
}
