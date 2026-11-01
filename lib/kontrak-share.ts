import type { Bayaran } from "@/types/bayaran"
import { formatRM, isPaid, parseAmount, type KontrakDetail, type KontrakRow } from "@/lib/dashboard-stats"
import { CHIP_HEX, appFont, roundRect, wrapLines } from "@/lib/share-canvas"

/** What the Dashboard kontrak detail shares to WhatsApp (text and image). */
export type KontrakShare = {
  row: KontrakRow
  detail: KontrakDetail
  kerja?: string
  nilaiKontrak: number | null
  wcp: number | null
}

const rm = (n: number) => formatRM(n)
const peratusOf = (s: KontrakShare) => (s.nilaiKontrak ? (s.detail.kemajuan / s.nilaiKontrak) * 100 : null)
const statusOf = (b: Bayaran) => (isPaid(b) ? "Dibayar" : b.statusBayaran || "Belum")

/** WhatsApp text (WhatsApp markdown: *bold*, _italic_, > quote). */
export function kontrakShareText(s: KontrakShare, imageLink?: string): string {
  const peratus = peratusOf(s)
  const lines = [
    `📌*KONTRAK ${s.row.noKontrak}*`,
    `_${[s.row.kawasan, s.row.kontraktor].filter(Boolean).join(" · ")}_`,
    ...(s.kerja ? [`> ${s.kerja}`] : []),
    "",
    `*Nilai Kontrak:* ${s.nilaiKontrak === null ? "-" : rm(s.nilaiKontrak)}`,
    `*Nilai WCP (kontrak):* ${s.wcp === null ? "-" : rm(s.wcp)}`,
    `*Kemajuan + Wang Tahanan:* ${rm(s.detail.kemajuan)}`,
    `*Peratus Bayaran:* ${peratus === null ? "-" : `${peratus.toFixed(1)}%${peratus > 100 ? " ⚠️" : ""}`}`,
    "",
    `*Senarai Bayaran (${s.detail.rows.length} rekod)*`,
    ...s.detail.rows.flatMap((b) => {
      const head = [`#${b.ids ?? "-"}`, b.tarikhTerima, b.bayaranKe && `Ke-${b.bayaranKe}${b.bayaranAkhir ? " (Akhir)" : ""}`, b.jenisBayaran].filter(Boolean).join(" · ")
      const tahanan = b.wangTahanan ? ` (WT ${rm(parseAmount(b.wangTahanan))})` : ""
      return [`${isPaid(b) ? "✅" : "🕑"} ${head}`, `> ${rm(parseAmount(b.nilaiBayaran))}${tahanan} · _${statusOf(b)}_`]
    }),
    "",
    `*Jumlah:* ${rm(s.detail.jumlahNilai)}`,
    `*Wang Tahanan:* ${rm(s.detail.jumlahWangTahanan)}`,
    `*WCP dibayar:* ${rm(s.detail.jumlahWcp)}`,
  ]
  if (imageLink) lines.push("", `Imej: ${imageLink}`, "> (exp 24 jam)")
  return lines.join("\n")
}

// BoardUI light palette as hex (canvas cannot read CSS variables)
const C = {
  page: "#ffffff",
  panel: "#f4f4f5",
  border: "#e4e4e7",
  text: "#18181b",
  secondary: "#52525b",
  tertiary: "#a1a1aa",
  accent: "#2563eb",
  danger: "#be123c",
  track: "#e4e4e7",
  bar: "#2f7de1",
  over: "#e8693a",
}
const W = 420
const SCALE = 2
const PAD = 20

/** Card like the dialog: header, 4 tiles, peratus bar, bayaran list, totals. */
function layout(ctx: CanvasRenderingContext2D, font: string, s: KontrakShare, draw: boolean): number {
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`
  const text = (t: string, x: number, y: number, weight: number, size: number, color: string, align: CanvasTextAlign = "left") => {
    if (!draw) return
    ctx.font = f(weight, size)
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = "top"
    ctx.fillText(t, x, y)
    ctx.textAlign = "left"
  }
  const paragraph = (t: string, x: number, y: number, maxW: number, weight: number, size: number, lineH: number, color: string) => {
    ctx.font = f(weight, size)
    const lines = wrapLines(ctx, t, maxW)
    lines.forEach((line, i) => text(line, x, y + i * lineH, weight, size, color))
    return lines.length * lineH
  }
  const box = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
    if (!draw) return
    roundRect(ctx, x, y, w, h, r)
    ctx.fillStyle = fill
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  const chip = (t: string, xRight: number, y: number, [bg, fg]: [string, string]) => {
    ctx.font = f(600, 11)
    const w = ctx.measureText(t).width + 14
    box(xRight - w, y, w, 20, 10, bg)
    text(t, xRight - w / 2, y + 4, 600, 11, fg, "center")
  }

  const inner = W - PAD * 2
  let y = PAD
  y += paragraph(`No Kontrak ${s.row.noKontrak}`, PAD, y, inner, 700, 18, 24, C.text)
  y += 2
  y += paragraph([s.row.kawasan, s.row.kontraktor].filter(Boolean).join(" · "), PAD, y, inner, 500, 12, 16, C.secondary)
  if (s.kerja) y += paragraph(s.kerja, PAD, y, inner, 400, 12, 16, C.secondary)
  y += 14

  // Tiles, 2 x 2
  const peratus = peratusOf(s)
  const tiles: [string, string, string?][] = [
    ["Nilai Kontrak", s.nilaiKontrak === null ? "-" : rm(s.nilaiKontrak)],
    ["Nilai WCP (kontrak)", s.wcp === null ? "-" : rm(s.wcp)],
    ["Kemajuan + Wang Tahanan", rm(s.detail.kemajuan)],
    ["Peratus Bayaran", peratus === null ? "-" : `${peratus.toFixed(1)}%`, peratus !== null && peratus > 100 ? C.danger : undefined],
  ]
  const gap = 8
  const tw = (inner - gap) / 2
  const th = 52
  tiles.forEach(([label, value, color], i) => {
    const x = PAD + (i % 2) * (tw + gap)
    const ty = y + Math.floor(i / 2) * (th + gap)
    box(x, ty, tw, th, 12, C.panel)
    text(label, x + 12, ty + 10, 500, 11, C.tertiary)
    text(value, x + 12, ty + 27, 700, 14, color ?? C.text)
  })
  y += th * 2 + gap + 12

  if (peratus !== null) {
    box(PAD, y, inner, 6, 3, C.track)
    box(PAD, y, Math.max(6, (inner * Math.min(100, peratus)) / 100), 6, 3, peratus > 100 ? C.over : C.bar)
    y += 18
  }

  // Bayaran list
  text(`Senarai Bayaran (${s.detail.rows.length} rekod)`, PAD, y, 700, 13, C.text)
  y += 22
  for (const b of s.detail.rows) {
    const tahanan = b.wangTahanan ? `Wang Tahanan ${rm(parseAmount(b.wangTahanan))}` : ""
    const sub = [b.bayaranKe && `Bayaran ke-${b.bayaranKe}${b.bayaranAkhir ? " (Akhir)" : ""}`, b.jenisBayaran].filter(Boolean).join(" · ")
    const h = 58 + (tahanan ? 16 : 0)
    box(PAD, y, inner, h, 12, C.page, C.border)
    text(`#${b.ids ?? "-"}`, PAD + 12, y + 11, 700, 12, C.accent)
    ctx.font = f(700, 12)
    const idW = ctx.measureText(`#${b.ids ?? "-"}`).width
    text(` · ${b.tarikhTerima || "-"}`, PAD + 12 + idW, y + 11, 500, 12, C.secondary)
    chip(statusOf(b), PAD + inner - 12, y + 8, isPaid(b) ? CHIP_HEX.lime : CHIP_HEX.gray)
    text(sub || "-", PAD + 12, y + 33, 500, 12, C.secondary)
    text(rm(parseAmount(b.nilaiBayaran)), PAD + inner - 12, y + 32, 700, 13, C.text, "right")
    if (tahanan) text(tahanan, PAD + 12, y + 50, 400, 11, C.tertiary)
    y += h + 6
  }

  // Totals
  y += 4
  const totals: [string, string][] = [
    ["Jumlah", rm(s.detail.jumlahNilai)],
    ["Wang Tahanan", rm(s.detail.jumlahWangTahanan)],
    ["WCP dibayar", rm(s.detail.jumlahWcp)],
  ]
  const totalH = 14 + totals.length * 20
  box(PAD, y, inner, totalH, 12, C.panel)
  totals.forEach(([label, value], i) => {
    const ty = y + 9 + i * 20
    text(label, PAD + 12, ty, i === 0 ? 700 : 500, 12, i === 0 ? C.text : C.secondary)
    text(value, PAD + inner - 12, ty, i === 0 ? 700 : 500, 12, i === 0 ? C.text : C.secondary, "right")
  })
  y += totalH + 10
  const now = new Date()
  text(
    `Dijana ${now.toLocaleDateString("en-GB")} · tidak termasuk rekod batal`,
    PAD,
    y,
    400,
    10,
    C.tertiary,
  )
  return y + 14 + PAD
}

/** PNG data URL of the kontrak card (2x for sharp text). */
export async function kontrakShareImage(s: KontrakShare): Promise<string> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas tidak disokong")
  const font = await appFont()
  const height = layout(ctx, font, s, false)
  canvas.width = W * SCALE
  canvas.height = Math.ceil(height * SCALE)
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = C.page
  ctx.fillRect(0, 0, W, height)
  layout(ctx, font, s, true)
  return canvas.toDataURL("image/png")
}
