import type { Surat } from "@/types/surat"
import type { Bayaran } from "@/types/bayaran"
import { formatRM, parseAmount, parseDate } from "./dashboard-stats"

/** Weekly (Isnin–Ahad) or monthly reports, as PDFs from the Download page. */

export type Jenis = "mingguan" | "bulanan"

export type Tempoh = { jenis: Jenis; from: Date; to: Date; label: string }

const BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"]

const pad = (n: number) => String(n).padStart(2, "0")
export const ddmmyyyy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The week (Monday to Sunday) or month that contains anchor. */
export function tempoh(jenis: Jenis, anchor: Date): Tempoh {
  if (jenis === "bulanan") {
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    return { jenis, from, to, label: `${BULAN[from.getMonth()]} ${from.getFullYear()}` }
  }
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - ((anchor.getDay() + 6) % 7))
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
  return { jenis, from, to, label: `${ddmmyyyy(from)} – ${ddmmyyyy(to)}` }
}

/** The previous (-1) or next (+1) week / month. */
export function geser(t: Tempoh, delta: number): Tempoh {
  return t.jenis === "bulanan"
    ? tempoh("bulanan", new Date(t.from.getFullYear(), t.from.getMonth() + delta, 1))
    : tempoh("mingguan", new Date(t.from.getFullYear(), t.from.getMonth(), t.from.getDate() + 7 * delta))
}

const within = (value: string, t: Tempoh) => {
  const d = parseDate(value)
  return !!d && d >= t.from && d <= t.to
}

/** Surat in the period by tarikh, oldest first. */
export function suratDalam(surat: Surat[], t: Tempoh): Surat[] {
  return surat
    .filter((s) => within(s.tarikh, t))
    .sort((a, b) => (parseDate(a.tarikh)!.getTime() - parseDate(b.tarikh)!.getTime()) || a.bil - b.bil)
}

/** Rekod bayaran in the period by tarikh terima, oldest first. */
export function bayaranDalam(bayaran: Bayaran[], t: Tempoh): Bayaran[] {
  return bayaran
    .filter((b) => within(b.tarikhTerima, t))
    .sort(
      (a, b) =>
        (parseDate(a.tarikhTerima)!.getTime() - parseDate(b.tarikhTerima)!.getTime()) || (a.ids ?? 0) - (b.ids ?? 0),
    )
}

export const jumlahNilai = (rows: Bayaran[]) => rows.reduce((sum, b) => sum + parseAmount(b.nilaiBayaran), 0)

export function namaFail(laporan: "Surat" | "Rekod-Bayaran", t: Tempoh) {
  const bila = t.jenis === "bulanan" ? ymd(t.from).slice(0, 7) : ymd(t.from)
  return `Laporan-${laporan}-${t.jenis === "bulanan" ? "Bulanan" : "Mingguan"}-${bila}.pdf`
}

type Meta = { tempoh: Tempoh; dijanaOleh: string; unit?: string }

// A4 portrait, millimetres
const PAGE_W = 210
const PAGE_H = 297
const M = 14
const INK: [number, number, number] = [17, 24, 39]
const MUTED: [number, number, number] = [107, 114, 128]
const LINE: [number, number, number] = [209, 213, 219]

// The PDF's built-in font has no en dash
const pdfLabel = (t: Tempoh) => (t.jenis === "bulanan" ? t.label : `${ddmmyyyy(t.from)} hingga ${ddmmyyyy(t.to)}`)

async function loadPdf() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  return { jsPDF, autoTable }
}

function header(doc: any, title: string, meta: Meta, ringkasan: string) {
  let y = M + 2
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED)
  doc.text("SISTEM PENGURUSAN SURAT DAN BAYARAN", M, y)
  y += 7
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...INK)
  doc.text(`${title} ${meta.tempoh.jenis === "bulanan" ? "BULANAN" : "MINGGUAN"}`, M, y)
  y += 6
  doc.setFont("helvetica", "normal").setFontSize(10)
  doc.text(`Tempoh: ${pdfLabel(meta.tempoh)}`, M, y)
  if (meta.unit) {
    y += 5
    doc.text(`Unit: ${meta.unit}`, M, y)
  }
  y += 5
  doc.setFontSize(8.5).setTextColor(...MUTED)
  const now = new Date()
  doc.text(`${ringkasan}  ·  Dijana ${ddmmyyyy(now)} ${pad(now.getHours())}:${pad(now.getMinutes())} oleh ${meta.dijanaOleh}`, M, y)
  y += 3
  doc.setDrawColor(...LINE).setLineWidth(0.3).line(M, y, PAGE_W - M, y)
  return y + 4
}

/** Disemak Oleh / Disahkan Oleh under the table, moved to a new page when it does not fit. */
function tandatangan(doc: any, startY: number) {
  const height = 42
  let y = startY + 10
  if (y + height > PAGE_H - M - 8) {
    doc.addPage()
    y = M + 6
  }
  const gap = 14
  const w = (PAGE_W - M * 2 - gap) / 2
  ;["Disemak Oleh:", "Disahkan Oleh:"].forEach((label, i) => {
    const x = M + i * (w + gap)
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK)
    doc.text(label, x, y)
    doc.setDrawColor(...INK).setLineWidth(0.3).line(x, y + 18, x + w * 0.8, y + 18)
    doc.setFont("helvetica", "normal").setFontSize(8.5)
    ;["Nama", "Jawatan", "Tarikh"].forEach((row, r) => {
      const ry = y + 24 + r * 6
      doc.text(`${row}`, x, ry)
      doc.text(":", x + 16, ry)
      doc.setDrawColor(...LINE).line(x + 19, ry + 0.8, x + w * 0.8, ry + 0.8)
    })
  })
}

/** "Halaman 1 / 3" and the report name on every page. */
function footer(doc: any, nama: string) {
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED)
    doc.text(nama, M, PAGE_H - 8)
    doc.text(`Halaman ${p} / ${pages}`, PAGE_W - M, PAGE_H - 8, { align: "right" })
  }
}

const tableStyle = {
  theme: "grid" as const,
  margin: { left: M, right: M, top: M, bottom: 16 },
  styles: { font: "helvetica", fontSize: 8, cellPadding: 1.6, textColor: INK, lineColor: LINE, lineWidth: 0.2, valign: "top" as const, overflow: "linebreak" as const },
  headStyles: { fillColor: [243, 244, 246] as [number, number, number], textColor: INK, fontStyle: "bold" as const },
  showHead: "everyPage" as const,
}

export async function laporanSuratPdf(rows: Surat[], meta: Meta) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const masuk = rows.filter((s) => s.kategori === "MASUK").length
  const ringkasan = `Jumlah: ${rows.length} surat (MASUK ${masuk}, KELUAR ${rows.length - masuk})`
  const startY = header(doc, "LAPORAN SURAT", meta, ringkasan)
  autoTable(doc, {
    ...tableStyle,
    startY,
    head: [["Bil", "Tarikh", "Kategori", "Perkara", "Unit / PIC", "Status"]],
    body: rows.length
      ? rows.map((s) => [String(s.bil), s.tarikh || "-", s.kategori || "-", s.perkara || "-", [s.unit, s.tindakanPic].filter(Boolean).join("\n") || "-", s.status || "-"])
      : [[{ content: "Tiada surat dalam tempoh ini.", colSpan: 6, styles: { halign: "center", textColor: MUTED } }]],
    columnStyles: {
      0: { cellWidth: 12, halign: "right" },
      1: { cellWidth: 20 },
      2: { cellWidth: 18 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 34 },
      5: { cellWidth: 26 },
    },
  })
  tandatangan(doc, (doc as any).lastAutoTable.finalY)
  footer(doc, `Laporan Surat · ${pdfLabel(meta.tempoh)}`)
  doc.save(namaFail("Surat", meta.tempoh))
}

export async function laporanBayaranPdf(rows: Bayaran[], meta: Meta) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const total = jumlahNilai(rows)
  const startY = header(doc, "LAPORAN REKOD BAYARAN", meta, `Jumlah: ${rows.length} rekod · Nilai ${formatRM(total)}`)
  autoTable(doc, {
    ...tableStyle,
    startY,
    head: [["ID", "Tarikh Terima", "Daripada", "Perkara", { content: "Nilai", styles: { halign: "right" } }, "Kontraktor", "Status Bayaran"]],
    body: rows.length
      ? rows.map((b) => [
          String(b.ids ?? b.id),
          b.tarikhTerima || "-",
          b.daripada || "-",
          b.perkara || "-",
          b.nilaiBayaran ? formatRM(parseAmount(b.nilaiBayaran)) : "-",
          b.namaKontraktor || "-",
          b.statusBayaran || "-",
        ])
      : [[{ content: "Tiada rekod bayaran dalam tempoh ini.", colSpan: 7, styles: { halign: "center", textColor: MUTED } }]],
    foot: rows.length
      ? [[{ content: "Jumlah", colSpan: 4, styles: { halign: "right" } }, { content: formatRM(total), styles: { halign: "right" } }, { content: "", colSpan: 2 }]]
      : undefined,
    footStyles: { fillColor: [243, 244, 246], textColor: INK, fontStyle: "bold" },
    showFoot: "lastPage",
    columnStyles: {
      0: { cellWidth: 11, halign: "right" },
      1: { cellWidth: 19 },
      2: { cellWidth: 24 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 32 },
      6: { cellWidth: 24 },
    },
  })
  tandatangan(doc, (doc as any).lastAutoTable.finalY)
  footer(doc, `Laporan Rekod Bayaran · ${pdfLabel(meta.tempoh)}`)
  doc.save(namaFail("Rekod-Bayaran", meta.tempoh))
}
