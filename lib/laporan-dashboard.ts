import type { Bayaran } from "@/types/bayaran"
import {
  PERIOD_LABEL,
  bayaranStats,
  formatRM,
  isCancelled,
  isPaid,
  kontrakBayaran,
  parseAmount,
  parseDate,
  periodStart,
  type Period,
  type Row,
} from "./dashboard-stats"
import { INK, LINE, M, MUTED, PAGE_H, PAGE_W, ddmmyyyy, footer, loadPdf, pad, tableStyle } from "./laporan"

/**
 * Dashboard → Bayaran as an A4 portrait PDF: one kawasan, or every kawasan with
 * a summary first and then one section per kawasan (each on its own page).
 * The figures are the Dashboard's own (bayaranStats / kontrakBayaran) for the period.
 */

type KontrakInfo = { kerja: string; nilaiKontrak: number | null }

export const SEMUA_KAWASAN = "__semua"

/** How a bayaran's kawasan is named everywhere on the Dashboard. */
export const kawasanOf = (b: Bayaran) => (b.daripada || "").trim().toUpperCase() || "TIDAK DIKETAHUI"

/** Kawasan with a record in the period, A-Z. */
export function kawasanDalam(bayaran: Bayaran[], period: Period, now = new Date()): string[] {
  const start = periodStart(period, now)
  const names = new Set<string>()
  for (const b of bayaran) {
    const d = parseDate(b.tarikhTerima)
    if (start && (!d || d < start)) continue
    names.add(kawasanOf(b))
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function tempohLabel(period: Period, now: Date) {
  const start = periodStart(period, now)
  return start ? `${PERIOD_LABEL[period]} (${ddmmyyyy(start)} hingga ${ddmmyyyy(now)})` : PERIOD_LABEL[period]
}

// The PDF's built-in font has no "≤" (Dashboard ageing label "≤ 30 hari")
const pdfSafe = (text: string) => text.replace(/≤\s*/g, "Hingga ")

// Full amounts in the PDF (no compact "k" / "juta")
const rm = (v: number) => formatRM(v)
const hari = (n: number | null) => (n === null ? "-" : `${Math.round(n)} hari`)

/** Starts a new page when less than `need` mm is left. */
function ensureSpace(doc: any, y: number, need: number) {
  if (y + need <= PAGE_H - 18) return y
  doc.addPage()
  return M + 4
}

/** A table title, with room left for a few rows under it. */
function heading(doc: any, text: string, y: number, need = 30) {
  y = ensureSpace(doc, y, need)
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK)
  doc.text(text, M, y)
  return y + 2.5
}

function pageHeader(doc: any, kawasanLabel: string, period: Period, dijanaOleh: string, now: Date) {
  let y = M + 2
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED)
  doc.text("SISTEM PENGURUSAN SURAT DAN BAYARAN", M, y)
  y += 7
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...INK)
  doc.text("LAPORAN DASHBOARD BAYARAN", M, y)
  y += 6
  doc.setFont("helvetica", "normal").setFontSize(10)
  doc.text(`Kawasan: ${kawasanLabel}`, M, y)
  y += 5
  doc.text(`Tempoh: ${tempohLabel(period, now)}`, M, y)
  y += 5
  doc.setFontSize(8.5).setTextColor(...MUTED)
  doc.text(`Ikut tarikh terima; rekod batal tidak dikira  ·  Dijana ${ddmmyyyy(now)} ${pad(now.getHours())}:${pad(now.getMinutes())} oleh ${dijanaOleh}`, M, y)
  y += 3
  doc.setDrawColor(...LINE).setLineWidth(0.3).line(M, y, PAGE_W - M, y)
  return y + 6
}

const small = { ...tableStyle, styles: { ...tableStyle.styles, fontSize: 7.8 } }
const right = { halign: "right" as const }

/** One kawasan: KPIs, per no kontrak, kategori / status, unpaid age / penerima. */
function seksyen(doc: any, autoTable: any, rows: Bayaran[], kawasan: string, period: Period, info: Record<string, Record<string, KontrakInfo>>, now: Date, y: number) {
  const stats = bayaranStats(rows, period, now)
  const paidShare = stats.total.amount ? Math.round((stats.paid.amount / stats.total.amount) * 100) : 0

  y = heading(doc, `Kawasan: ${kawasan}`, y, 40)
  autoTable(doc, {
    ...small,
    startY: y,
    head: [["Jumlah nilai", "Sudah dibayar", "Belum dibayar", "Purata tempoh bayar"]],
    body: [
      [
        `${rm(stats.total.amount)}\n${stats.total.count} rekod`,
        `${rm(stats.paid.amount)}\n${stats.paid.count} rekod · ${paidShare}% nilai`,
        `${rm(stats.unpaid.amount)}\n${stats.unpaid.count} rekod`,
        `${hari(stats.avgDaysToPay)}\nTarikh terima hingga bayar`,
      ],
    ],
    styles: { ...small.styles, fontSize: 8.5, cellPadding: 2.2 },
  })
  y = doc.lastAutoTable.finalY + 7

  // Per no kontrak, plus one line for records without one (e.g. Piecerate) so the totals add up
  const kontrak = kontrakBayaran(rows, period, {}, now)
  const start = periodStart(period, now)
  const tanpa = rows.filter((b) => {
    const d = parseDate(b.tarikhTerima)
    return !(b.noKontrak || "").trim() && !isCancelled(b) && !(start && (!d || d < start))
  })
  const tanpaPaid = tanpa.filter(isPaid).reduce((s, b) => s + parseAmount(b.nilaiBayaran), 0)
  const tanpaAll = tanpa.reduce((s, b) => s + parseAmount(b.nilaiBayaran), 0)
  y = heading(doc, "Bayaran mengikut No Kontrak", y)
  autoTable(doc, {
    ...small,
    startY: y,
    head: [["No Kontrak", "Kontraktor", { content: "Rekod", styles: right }, { content: "Dibayar", styles: right }, { content: "Belum", styles: right }, { content: "Jumlah", styles: right }, { content: "% Nilai Kontrak", styles: right }]],
    body: [
      ...kontrak.map((k) => {
        const total = k.paid + k.unpaid
        const nilai = info[k.kawasan]?.[k.noKontrak]?.nilaiKontrak ?? null
        return [k.noKontrak, k.kontraktor || "-", String(k.count), rm(k.paid), rm(k.unpaid), rm(total), nilai ? `${Math.round((total / nilai) * 100)}% / ${rm(nilai)}` : "-"]
      }),
      ...(tanpa.length
        ? [[{ content: "Tanpa No Kontrak (cth. Piecerate)", colSpan: 2, styles: { textColor: MUTED } }, String(tanpa.length), rm(tanpaPaid), rm(tanpaAll - tanpaPaid), rm(tanpaAll), "-"]]
        : []),
      ...(!kontrak.length && !tanpa.length ? [[{ content: "Tiada bayaran dalam tempoh ini.", colSpan: 7, styles: { halign: "center", textColor: MUTED } }]] : []),
    ],
    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: "auto" }, 2: { cellWidth: 12, ...right }, 3: { cellWidth: 25, ...right }, 4: { cellWidth: 25, ...right }, 5: { cellWidth: 25, ...right }, 6: { cellWidth: 27, ...right } },
  })
  y = doc.lastAutoTable.finalY + 7

  // Two small tables side by side, twice
  const half = (PAGE_W - M * 2 - 6) / 2
  type Side = { title: string; rows: Row[]; value?: { head: string; of: (r: Row) => string } }
  const pair = (sides: [Side, Side]) => {
    y = ensureSpace(doc, y, 34)
    const top = y
    let bottom = y
    sides.forEach((side, i) => {
      const x = M + i * (half + 6)
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK)
      doc.text(side.title, x, top)
      const cols = side.value ? 3 : 2
      autoTable(doc, {
        ...small,
        startY: top + 2.5,
        margin: { left: x, right: PAGE_W - x - half, top: M, bottom: 16 },
        tableWidth: half,
        head: [["", { content: "Rekod", styles: right }, ...(side.value ? [{ content: side.value.head, styles: right }] : [])]],
        body: side.rows.length
          ? side.rows.map((r) => [pdfSafe(r.label), String(r.count ?? "-"), ...(side.value ? [side.value.of(r)] : [])])
          : [[{ content: "Tiada data.", colSpan: cols, styles: { halign: "center", textColor: MUTED } }]],
        columnStyles: { 1: { cellWidth: 14, ...right }, 2: { cellWidth: 30, ...right } },
      })
      bottom = Math.max(bottom, doc.lastAutoTable.finalY)
    })
    y = bottom + 7
  }
  const nilai = { head: "Nilai", of: (r: Row) => rm(r.value) }
  pair([
    { title: "Mengikut kategori", rows: stats.kategori, value: nilai },
    { title: "Status bayaran", rows: stats.status },
  ])
  pair([
    { title: "Umur bayaran tertunggak", rows: stats.unpaidAge, value: nilai },
    { title: "Belum dibayar mengikut penerima", rows: stats.unpaidByPenerima, value: nilai },
  ])
  return y
}

export async function laporanDashboardPdf(
  bayaran: Bayaran[],
  opts: { period: Period; kawasan: string; dijanaOleh: string; kontrakInfoByKawasan?: Record<string, Record<string, KontrakInfo>> },
) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const now = new Date()
  const info = opts.kontrakInfoByKawasan ?? {}
  const semua = opts.kawasan === SEMUA_KAWASAN
  const kawasanList = semua ? kawasanDalam(bayaran, opts.period, now) : [opts.kawasan]

  let y = pageHeader(doc, semua ? "Semua kawasan (ikut kawasan)" : opts.kawasan, opts.period, opts.dijanaOleh, now)

  if (semua) {
    // Summary of every kawasan first
    const summary = kawasanList.map((k) => {
      const s = bayaranStats(bayaran.filter((b) => kawasanOf(b) === k), opts.period, now)
      return { k, s }
    })
    const total = bayaranStats(bayaran, opts.period, now)
    y = heading(doc, "Ringkasan mengikut kawasan", y)
    autoTable(doc, {
      ...small,
      startY: y,
      head: [["Kawasan", { content: "Rekod", styles: right }, { content: "Jumlah nilai", styles: right }, { content: "Sudah dibayar", styles: right }, { content: "Belum dibayar", styles: right }, { content: "% dibayar", styles: right }]],
      body: summary.map(({ k, s }) => [
        k,
        String(s.total.count),
        rm(s.total.amount),
        rm(s.paid.amount),
        rm(s.unpaid.amount),
        s.total.amount ? `${Math.round((s.paid.amount / s.total.amount) * 100)}%` : "-",
      ]),
      foot: [
        [
          "Jumlah",
          String(total.total.count),
          rm(total.total.amount),
          rm(total.paid.amount),
          rm(total.unpaid.amount),
          total.total.amount ? `${Math.round((total.paid.amount / total.total.amount) * 100)}%` : "-",
        ],
      ],
      footStyles: { fillColor: [243, 244, 246], textColor: INK, fontStyle: "bold" },
      showFoot: "lastPage",
      columnStyles: { 1: { ...right, cellWidth: 14 }, 2: right, 3: right, 4: right, 5: { ...right, cellWidth: 18 } },
    })
    // Each kawasan on its own page
    for (const k of kawasanList) {
      doc.addPage()
      seksyen(doc, autoTable, bayaran.filter((b) => kawasanOf(b) === k), k, opts.period, info, now, M + 4)
    }
  } else {
    seksyen(doc, autoTable, bayaran.filter((b) => kawasanOf(b) === opts.kawasan), opts.kawasan, opts.period, info, now, y)
  }

  const label = semua ? "Semua kawasan" : opts.kawasan
  footer(doc, `Laporan Dashboard Bayaran · ${label} · ${PERIOD_LABEL[opts.period]}`)
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  doc.save(`Laporan-Dashboard-Bayaran-${semua ? "Semua-Kawasan" : opts.kawasan.replace(/[^A-Z0-9]+/gi, "-")}-${stamp}.pdf`)
}
