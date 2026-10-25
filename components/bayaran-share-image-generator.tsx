"use client"

import { useRef, useEffect } from "react"
import type { Bayaran } from "@/types/bayaran"
import { uploadToImgBB } from "@/lib/imgbb-service"

interface BayaranShareImageGeneratorProps {
  bayaran: Bayaran
  /** Kerja and nilai of the record's kontrak, when the page has loaded them. */
  kontrakInfo?: { kerja: string; nilaiKontrak: number | null }
  onImageGenerated: (imageUrl: string, directLink: string) => void
  onError: (error: Error) => void
}

// BoardUI light palette, as hex because canvas cannot read CSS variables reliably.
const C = {
  page: "#ffffff",
  panel: "#f4f4f5",
  border: "#e4e4e7",
  text: "#18181b",
  secondary: "#52525b",
  tertiary: "#a1a1aa",
  accent: "#2563eb",
  done: "#65a30d",
  doneBg: "#ecfccb",
  doneText: "#3f6212",
  cancel: "#e11d48",
  cancelBg: "#ffe4e6",
  cancelText: "#9f1239",
  chipBg: "#f4f4f5",
  chipText: "#3f3f46",
}

const KATEGORI_CHIP: Record<string, [string, string]> = {
  "PERTANIAN AM": ["#ecfccb", "#3f6212"],
  "ANGKUT BTS": ["#ffedd5", "#9a3412"],
  PIECERATE: ["#dbeafe", "#1e40af"],
  KIMIA: ["#fef9c3", "#854d0e"],
  KONTRAK: ["#f3e8ff", "#6b21a8"],
}

const W = 420 // CSS px; drawn at 2x for sharp text in WhatsApp
const SCALE = 2
const PAD = 20
const INNER = 14 // padding inside cards

function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-"
  const numericValue = String(value).replace(/[^\d.-]/g, "")
  if (numericValue === "" || isNaN(Number(numericValue))) return String(value)
  return `RM ${Number(numericValue).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Split text into lines that fit maxWidth (long words are broken by character). */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of (text || "").split(/\n/)) {
    let line = ""
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth) {
        line = test
        continue
      }
      if (line) lines.push(line)
      // A single word wider than the box: hard-break it
      let rest = word
      while (ctx.measureText(rest).width > maxWidth && rest.length > 1) {
        let cut = rest.length - 1
        while (cut > 1 && ctx.measureText(rest.slice(0, cut)).width > maxWidth) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    lines.push(line)
  }
  return lines.length ? lines : [""]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Lays the card out top to bottom. Every block measures its own wrapped text
 * and advances y by its real height, so nothing overlaps. Run once with
 * draw=false to get the height, then again to paint.
 */
function layout(ctx: CanvasRenderingContext2D, font: string, b: Bayaran, info: BayaranShareImageGeneratorProps["kontrakInfo"], draw: boolean): number {
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`
  const text = (s: string, x: number, y: number, weight: number, size: number, color: string, align: CanvasTextAlign = "left") => {
    if (!draw) return
    ctx.font = f(weight, size)
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = "top"
    ctx.fillText(s, x, y)
    ctx.textAlign = "left"
  }
  const paragraph = (s: string, x: number, y: number, maxW: number, weight: number, size: number, lineH: number, color: string) => {
    ctx.font = f(weight, size)
    const lines = wrapLines(ctx, s, maxW)
    lines.forEach((line, i) => text(line, x, y + i * lineH, weight, size, color))
    return lines.length * lineH
  }
  const chipWidth = (s: string, size = 11) => {
    ctx.font = f(600, size)
    return ctx.measureText(s).width + 12
  }
  const chip = (s: string, x: number, y: number, bg: string, fg: string, size = 11) => {
    const w = chipWidth(s, size)
    if (draw) {
      roundRect(ctx, x, y, w, size + 10, 6)
      ctx.fillStyle = bg
      ctx.fill()
    }
    text(s, x + 6, y + 5, 600, size, fg)
    return w
  }
  const card = (y: number, h: number, fill?: string) => {
    if (!draw) return
    roundRect(ctx, PAD, y, W - PAD * 2, h, 14)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    } else {
      ctx.strokeStyle = C.border
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  const cancelled = b.statusBayaran?.toUpperCase() === "BATAL"
  const paid = b.statusBayaran?.toLowerCase() === "selesai"
  const contentW = W - PAD * 2

  let y = PAD

  // Header: title + status chip
  const status = b.statusBayaran || ""
  const statusW = status ? chipWidth(status) : 0
  text(`Rekod Bayaran #${b.ids ?? b.id}`, PAD, y + 2, 700, 20, C.text)
  if (status) {
    chip(
      status,
      W - PAD - statusW,
      y + 2,
      cancelled ? C.cancelBg : paid ? C.doneBg : C.chipBg,
      cancelled ? C.cancelText : paid ? C.doneText : C.chipText,
    )
  }
  y += 30
  y += paragraph([b.tarikhTerima && `Diterima ${b.tarikhTerima}`, b.daripada].filter(Boolean).join(" · "), PAD, y, contentW, 400, 12, 16, C.secondary)
  y += 12

  // Perkara
  y += paragraph(b.perkara || "-", PAD, y, contentW, 600, 15, 21, C.text)
  y += 12

  // Amount panel
  const ke = b.bayaranKe ? `Bayaran ke-${b.bayaranKe}` : ""
  const amountH = 64
  card(y, amountH, C.panel)
  text("Nilai Bayaran", PAD + INNER, y + 12, 500, 11, C.tertiary)
  text(formatCurrency(b.nilaiBayaran), PAD + INNER, y + 28, 700, 22, cancelled ? C.cancelText : C.text)
  if (ke) chip(ke, W - PAD - INNER - chipWidth(ke), y + amountH - 32, C.page, C.secondary)
  y += amountH + 10

  // Fields card
  type Row = { label: string; value?: string; chip?: [string, string, string]; full?: boolean }
  const kat = b.kategori ? KATEGORI_CHIP[b.kategori] ?? [C.chipBg, C.chipText] : null
  const rows: Row[] = [
    { label: "Kategori", value: kat ? undefined : "-", chip: kat ? [b.kategori, kat[0], kat[1]] : undefined },
    { label: "No Kontrak", value: b.noKontrak || "-" },
    { label: "Nama Kontraktor", value: b.namaKontraktor || "-", full: true },
  ]
  if (b.noKontrak && info?.kerja) rows.push({ label: "Kerja", value: info.kerja, full: true })
  if (b.noKontrak && info?.nilaiKontrak != null) rows.push({ label: "Nilai Kontrak", value: formatCurrency(info.nilaiKontrak), full: true })

  const colW = (contentW - INNER * 2 - 16) / 2
  const fieldsTop = y
  // Measure first; the border is drawn once the card's height is known
  const drawRows = (paint: boolean) => {
    const prev = draw
    if (!paint) draw = false
    let ry = y + INNER
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const pair = !row.full && rows[i + 1] && !rows[i + 1].full ? [row, rows[i + 1]] : [row]
      let h = 0
      pair.forEach((r, j) => {
        const x = PAD + INNER + j * (colW + 16)
        const w = pair.length === 2 ? colW : contentW - INNER * 2
        text(r.label, x, ry, 500, 11, C.tertiary)
        const vh = r.chip
          ? (chip(r.chip[0], x, ry + 17, r.chip[1], r.chip[2]), 21)
          : paragraph(r.value || "-", x, ry + 17, w, 500, 13, 18, C.text)
        h = Math.max(h, 17 + vh)
      })
      ry += h + 12
      if (pair.length === 2) i++
    }
    draw = prev
    return ry - 12 + INNER
  }
  const fieldsBottom = drawRows(false)
  card(fieldsTop, fieldsBottom - fieldsTop)
  drawRows(true)
  y = fieldsBottom + 10

  // Tracking card
  type Step = { label: string; date: string; note?: string }
  const steps: Step[] = [
    { label: "Dibayar", date: b.tarikhBayar, note: b.nomborBaucer ? `Baucer ${b.nomborBaucer}` : undefined },
    { label: "Hantar ke Kewangan", date: b.tarikhHantar, note: b.penerima ? `Kepada: ${b.penerima}` : undefined },
    { label: "PN", date: b.tarikhPn },
    { label: "PPN (P)", date: b.tarikhPpnP },
    { label: "Memo Ladang", date: b.tarikhMemoLadang, note: b.statusLadang || undefined },
    { label: "Diterima", date: b.tarikhTerima, note: b.daripada ? `Daripada: ${b.daripada}` : undefined },
  ]
  const trackTop = y
  const dotX = PAD + INNER + 10
  const textX = dotX + 22
  const textW = W - PAD - INNER - textX
  const stepLayout = (paint: boolean) => {
    const prev = draw
    let ty = y + INNER
    if (!paint) draw = false
    text("Tracking Bayaran", PAD + INNER, ty, 700, 14, C.text)
    ty += 28
    const positions: Array<{ y: number; h: number; done: boolean }> = []
    steps.forEach((s) => {
      const done = !!s.date
      const dateLabel = done ? s.date : s.label === "Dibayar" ? "Belum dibayar" : "-"
      ctx.font = f(400, 12)
      const dateW = ctx.measureText(dateLabel).width
      const labelH = paragraph(s.label, textX, ty + 1, textW - dateW - 12, 600, 13, 18, done ? C.text : C.secondary)
      text(dateLabel, W - PAD - INNER, ty + 2, 400, 12, done ? C.text : C.tertiary, "right")
      let h = Math.max(labelH, 20)
      if (s.note) h += paragraph(s.note, textX, ty + h, textW, 400, 11, 15, C.secondary)
      positions.push({ y: ty, h, done })
      ty += Math.max(h, 22) + 14
    })
    draw = prev
    return { bottom: ty - 14 + INNER, positions }
  }
  const measured = stepLayout(false)
  card(trackTop, measured.bottom - trackTop)
  if (draw) {
    const { positions } = measured
    // Connector lines first, then dots on top
    for (let i = 0; i < positions.length - 1; i++) {
      ctx.beginPath()
      ctx.moveTo(dotX, positions[i].y + 20)
      ctx.lineTo(dotX, positions[i + 1].y - 2)
      ctx.strokeStyle = C.border
      ctx.lineWidth = 2
      ctx.stroke()
    }
    positions.forEach((p) => {
      const cy = p.y + 9
      ctx.beginPath()
      ctx.arc(dotX, cy, 9, 0, Math.PI * 2)
      if (cancelled) {
        ctx.fillStyle = C.cancel
        ctx.fill()
      } else if (p.done) {
        ctx.fillStyle = C.done
        ctx.fill()
        // check mark drawn as a path so it does not depend on the font
        ctx.beginPath()
        ctx.moveTo(dotX - 4, cy)
        ctx.lineTo(dotX - 1, cy + 3)
        ctx.lineTo(dotX + 4, cy - 3)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()
      } else {
        ctx.fillStyle = C.page
        ctx.fill()
        ctx.strokeStyle = C.border
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }
  stepLayout(true)
  y = measured.bottom + 10

  // Nota kaki
  if (b.notaKaki) {
    ctx.font = f(400, 12)
    const noteLines = wrapLines(ctx, b.notaKaki, contentW - INNER * 2)
    const noteH = INNER + 16 + noteLines.length * 17 + INNER
    card(y, noteH, C.cancelBg)
    text("Nota Kaki", PAD + INNER, y + INNER, 600, 11, C.cancelText)
    noteLines.forEach((line, i) => text(line, PAD + INNER, y + INNER + 16 + i * 17, 400, 12, C.cancelText))
    y += noteH + 10
  }

  // Footer
  y += 4
  text("Dijana oleh sistem. Tiada tandatangan diperlukan.", PAD, y, 400, 10, C.tertiary)
  y += 14 + PAD
  return y
}

export function BayaranShareImageGenerator({ bayaran, kontrakInfo, onImageGenerated, onError }: BayaranShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read once: info arriving later must not regenerate (and re-upload) the image
  const infoRef = useRef(kontrakInfo)

  useEffect(() => {
    const generateImage = async () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Same font as the app, so the image matches the screen
      const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif"
      try {
        await document.fonts?.ready
      } catch {
        // fonts API unavailable; draw with whatever is loaded
      }

      const height = layout(ctx, font, bayaran, infoRef.current, false)
      canvas.width = W * SCALE
      canvas.height = Math.ceil(height * SCALE)
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
      ctx.fillStyle = C.page
      ctx.fillRect(0, 0, W, height)
      layout(ctx, font, bayaran, infoRef.current, true)

      try {
        const imageUrl = canvas.toDataURL("image/png")
        const directLink = await uploadToImgBB(imageUrl)
        onImageGenerated(imageUrl, directLink)
      } catch (error) {
        onError(error as Error)
      }
    }

    generateImage()
  }, [bayaran, onImageGenerated, onError])

  return <canvas ref={canvasRef} style={{ display: "none" }} />
}
