"use client"

import { useRef, useEffect } from "react"
import type { Surat } from "@/types/surat"
import { uploadToImgBB } from "@/lib/imgbb-service"
import { CHIP_HEX, appFont, roundRect, wrapLines } from "@/lib/share-canvas"
import { suratStatusChip, unitChip } from "@/lib/ui-status"

interface ShareImageGeneratorProps {
  surat: Surat
  /** Fail as shown in Maklumat Surat, e.g. "B1 5 - PENGHASILAN (ANGKUT)". */
  failLabel?: string
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
  masuk: "#dc2626",
  keluar: "#2563eb",
}

const W = 420 // CSS px; drawn at 2x for sharp text in WhatsApp
const SCALE = 2
const PAD = 20
const INNER = 14 // padding inside cards

/**
 * Lays the card out top to bottom, the same way as Maklumat Surat #…. Every
 * block measures its own wrapped text and advances y by its real height, so
 * nothing overlaps. Run once with draw=false to get the height, then to paint.
 */
function layout(ctx: CanvasRenderingContext2D, font: string, s: Surat, failLabel: string | undefined, draw: boolean): number {
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`
  const text = (str: string, x: number, y: number, weight: number, size: number, color: string, align: CanvasTextAlign = "left") => {
    if (!draw) return
    ctx.font = f(weight, size)
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = "top"
    ctx.fillText(str, x, y)
    ctx.textAlign = "left"
  }
  const paragraph = (str: string, x: number, y: number, maxW: number, weight: number, size: number, lineH: number, color: string) => {
    ctx.font = f(weight, size)
    const lines = wrapLines(ctx, str, maxW)
    lines.forEach((line, i) => text(line, x, y + i * lineH, weight, size, color))
    return lines.length * lineH
  }
  const chipWidth = (str: string, size = 11) => {
    ctx.font = f(600, size)
    return ctx.measureText(str).width + 12
  }
  const chip = (str: string, x: number, y: number, [bg, fg]: [string, string], size = 11) => {
    const w = chipWidth(str, size)
    if (draw) {
      roundRect(ctx, x, y, w, size + 10, 6)
      ctx.fillStyle = bg
      ctx.fill()
    }
    text(str, x + 6, y + 5, 600, size, fg)
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
  /** Kategori arrow drawn as a path, so it does not depend on the font. */
  const arrow = (x: number, y: number, down: boolean, color: string) => {
    if (!draw) return
    ctx.beginPath()
    ctx.moveTo(x + 6, y + (down ? 1 : 11))
    ctx.lineTo(x + 6, y + (down ? 11 : 1))
    ctx.moveTo(x + 2, y + (down ? 7 : 5))
    ctx.lineTo(x + 6, y + (down ? 11 : 1))
    ctx.lineTo(x + 10, y + (down ? 7 : 5))
    ctx.strokeStyle = color
    ctx.lineWidth = 1.75
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  const contentW = W - PAD * 2
  const isMasuk = s.kategori === "MASUK"
  let y = PAD

  // Header: title + status chip
  const statusW = s.status ? chipWidth(s.status) : 0
  text(`Surat #${s.bil}`, PAD, y + 2, 700, 20, C.text)
  if (s.status) chip(s.status, W - PAD - statusW, y + 2, CHIP_HEX[suratStatusChip(s.status)])
  y += 32

  // Kategori with its arrow, then the date
  const katColor = isMasuk ? C.masuk : C.keluar
  arrow(PAD, y + 1, isMasuk, katColor)
  text(s.kategori || "-", PAD + 15, y, 600, 12, katColor)
  ctx.font = f(600, 12)
  const katW = ctx.measureText(s.kategori || "-").width
  text(`· ${s.tarikh || "-"}`, PAD + 15 + katW + 6, y, 400, 12, C.secondary)
  y += 22

  // Daripada (MASUK) / Kepada (KELUAR)
  text(s.kategori === "KELUAR" ? "Kepada" : s.kategori === "MASUK" ? "Daripada" : "Daripada / Kepada", PAD, y, 500, 11, C.tertiary)
  y += 16
  y += paragraph(s.daripadaKepada || "-", PAD, y, contentW, 500, 13, 18, C.text)
  y += 12

  // Perkara
  y += paragraph(s.perkara || "-", PAD, y, contentW, 600, 15, 21, C.text)
  y += 14

  // Fields card
  type Row = { label: string; value?: string; chip?: [string, [string, string]]; full?: boolean }
  const rows: Row[] = [
    { label: "Unit", value: s.unit ? undefined : "-", chip: s.unit ? [s.unit, CHIP_HEX[unitChip(s.unit)]] : undefined },
    { label: "Tindakan PIC", value: s.tindakanPic || "-" },
  ]
  if (s.tarikhSelesai) rows.push({ label: "Tarikh Selesai", value: s.tarikhSelesai })
  if (s.reference) rows.push({ label: "Reference", chip: [`Respon: #${s.reference}`, CHIP_HEX.blue] })
  if (failLabel && failLabel !== "-") rows.push({ label: "Fail", value: failLabel, full: true })

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
        const vh = r.chip ? (chip(r.chip[0], x, ry + 17, r.chip[1]), 21) : paragraph(r.value || "-", x, ry + 17, w, 500, 13, 18, C.text)
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

  // Nota and Komen Pengurus, as in the dialog
  const note = (label: string, body: string, fill: string | undefined, labelColor: string, bodyColor: string) => {
    ctx.font = f(400, 13)
    const lines = wrapLines(ctx, body, contentW - INNER * 2)
    const h = INNER + 17 + lines.length * 18 + INNER
    card(y, h, fill)
    text(label, PAD + INNER, y + INNER, 500, 11, labelColor)
    lines.forEach((line, i) => text(line, PAD + INNER, y + INNER + 17 + i * 18, 400, 13, bodyColor))
    y += h + 10
  }
  if (s.nota) note("Nota", s.nota, undefined, C.tertiary, C.masuk)
  if (s.komen) note("Komen Pengurus", s.komen, CHIP_HEX.blue[0], CHIP_HEX.blue[1], C.text)

  // Footer
  y += 4
  text("Dijana oleh Sistem Pengurusan Surat dan Bayaran.", PAD, y, 400, 10, C.tertiary)
  y += 14 + PAD
  return y
}

export function ShareImageGenerator({ surat, failLabel, onImageGenerated, onError }: ShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read once: a label or new callbacks arriving later must not regenerate (and re-upload) the image
  const failLabelRef = useRef(failLabel)
  const callbacks = useRef({ onImageGenerated, onError })
  callbacks.current = { onImageGenerated, onError }

  useEffect(() => {
    const generateImage = async () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const font = await appFont()
      const height = layout(ctx, font, surat, failLabelRef.current, false)
      canvas.width = W * SCALE
      canvas.height = Math.ceil(height * SCALE)
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
      ctx.fillStyle = C.page
      ctx.fillRect(0, 0, W, height)
      layout(ctx, font, surat, failLabelRef.current, true)

      try {
        const imageUrl = canvas.toDataURL("image/png")
        const directLink = await uploadToImgBB(imageUrl)
        callbacks.current.onImageGenerated(imageUrl, directLink)
      } catch (error) {
        callbacks.current.onError(error as Error)
      }
    }

    generateImage()
  }, [surat])

  return <canvas ref={canvasRef} style={{ display: "none" }} />
}
