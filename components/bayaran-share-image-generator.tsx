"use client"

import { useRef, useEffect } from "react"
import type { Bayaran } from "@/types/bayaran"
import { uploadToImgBB } from "@/lib/imgbb-service"

interface BayaranShareImageGeneratorProps {
  bayaran: Bayaran
  onImageGenerated: (imageUrl: string, directLink: string) => void
  onError: (error: Error) => void
}

export function BayaranShareImageGenerator({ bayaran, onImageGenerated, onError }: BayaranShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const formatCurrency = (value: string) => {
    if (!value) return "-"
    const numericValue = value.replace(/[^\d.-]/g, "")
    if (isNaN(Number(numericValue))) return value
    return `RM ${Number(numericValue).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getKategoriColor = (kategori: string) => {
    const KATEGORI_COLORS: Record<string, string> = {
      "PERTANIAN AM": "#d4edbc",
      "ANGKUT BTS": "#ffc8aa",
      PIECERATE: "#bfe1f6",
      KIMIA: "#ffe5a0",
      KONTRAK: "#e6cff2",
    }
    return KATEGORI_COLORS[kategori] || "#e5e7eb"
  }

  const drawTimelineItem = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    value: string,
    active: boolean,
    note?: string,
    isCancelled: boolean = false
  ) => {
    const iconColor = isCancelled ? "#dc2626" : active ? "#22c55e" : "#d1d5db"
    const iconText = isCancelled ? "!" : active ? "✓" : ""

    ctx.beginPath()
    ctx.arc(x, y, 10, 0, 2 * Math.PI)
    ctx.fillStyle = iconColor
    ctx.fill()

    if (active) {
      ctx.fillStyle = "white"
      ctx.font = "bold 14px Inter"
      ctx.fillText(iconText, x - 5, y + 5)
    }

    ctx.beginPath()
    ctx.moveTo(x, y + 10)
    ctx.lineTo(x, y + 60)
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = "#000"
    ctx.font = "bold 14px Inter"
    ctx.fillText(label, x + 20, y - 4)
    ctx.font = "14px Inter"
    ctx.fillText(value || "-", x + 20, y + 16)

    if (note) {
      ctx.font = "italic 12px Inter"
      ctx.fillStyle = "#4b5563"
      ctx.fillText(note, x + 20, y + 34)
    }
  }

  // ✅ Fungsi balut teks untuk Perkara
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const words = text.split(" ")
    let line = ""
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " "
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y)
        line = words[n] + " "
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
    return y + lineHeight // ✅ Kembalikan posisi y selepas baris terakhir
  }

  useEffect(() => {
    const generateImage = async () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 400
      let startY = 320
      canvas.height = startY + (6 * 70) + 130

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#000000"
      ctx.font = "bold 24px Inter"
      ctx.fillText("Detail Rekod Bayaran", 20, 40)
      ctx.font = "bold 20px Inter"
      ctx.fillText(`#${bayaran.id}`, canvas.width - 90, 40)

      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(20, 60, canvas.width - 40, 200)

      ctx.fillStyle = "#000"
      ctx.font = "14px Inter"
      ctx.fillText("Daripada:", 30, 90)
      ctx.font = "bold 14px Inter"
      ctx.fillText(bayaran.daripada, 130, 90)

      ctx.font = "14px Inter"
      ctx.fillText("Perkara:", 30, 120)
      ctx.font = "bold 14px Inter"
      const perkaraY = wrapText(ctx, bayaran.perkara, 130, 120, 240, 16) // ✅ wrap text

      ctx.font = "14px Inter"
      ctx.fillText("Kategori:", 30, perkaraY)
      ctx.fillStyle = getKategoriColor(bayaran.kategori)
      ctx.fillRect(130, perkaraY - 15, 100, 20)
      ctx.fillStyle = "#000"
      ctx.font = "bold 12px Inter"
      ctx.fillText(bayaran.kategori, 135, perkaraY)

      ctx.font = "14px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText("No Kontrak:", 30, perkaraY + 30)
      ctx.font = "bold 14px Inter"
      ctx.fillText(bayaran.noKontrak || "-", 130, perkaraY + 30)

      ctx.font = "14px Inter"
      ctx.fillText("Nilai:", 30, perkaraY + 60)
      ctx.font = "bold 14px Inter"
      ctx.fillStyle = bayaran.tarikhBayar ? "#16a34a" : "#dc2626"
      ctx.fillText(formatCurrency(bayaran.nilaiBayaran), 130, perkaraY + 60)

      ctx.font = "14px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText("Bayaran Ke:", 30, perkaraY + 90)
      ctx.font = "bold 14px Inter"
      ctx.fillText(bayaran.bayaranKe || "-", 130, perkaraY + 90)

      // Add BATAL badge if status is BATAL
      const isCancelled = bayaran.statusBayaran?.toUpperCase() === "BATAL"
      if (isCancelled) {
        ctx.fillStyle = "#dc2626"
        ctx.fillRect(canvas.width - 120, 10, 100, 30)
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 14px Inter"
        ctx.fillText("BATAL", canvas.width - 90, 30)
      }

      ctx.font = "bold 18px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText("Tracking Bayaran:", 20, 280)

      drawTimelineItem(
        ctx,
        40,
        startY,
        "Tarikh Bayar",
        bayaran.tarikhBayar,
        !!bayaran.tarikhBayar,
        bayaran.nomborBaucer ? `Baucer: ${bayaran.nomborBaucer}` : undefined,
        isCancelled
      )
      startY += 70
      drawTimelineItem(
        ctx,
        40,
        startY,
        "Tarikh Hantar",
        bayaran.tarikhHantar,
        !!bayaran.tarikhHantar,
        bayaran.penerima ? `Penerima: ${bayaran.penerima}` : undefined,
        isCancelled
      )
      startY += 70
      drawTimelineItem(ctx, 40, startY, "Tarikh PN", bayaran.tarikhPn, !!bayaran.tarikhPn, undefined, isCancelled)
      startY += 70
      drawTimelineItem(ctx, 40, startY, "Tarikh PPN (P)", bayaran.tarikhPpnP, !!bayaran.tarikhPpnP, undefined, isCancelled)
      startY += 70
      drawTimelineItem(ctx, 40, startY, "Memo Ladang", bayaran.tarikhMemoLadang, !!bayaran.tarikhMemoLadang, undefined, isCancelled)
      startY += 70
      drawTimelineItem(
        ctx,
        40,
        startY,
        "Terima",
        bayaran.tarikhTerima,
        !!bayaran.tarikhTerima,
        bayaran.daripada ? `Daripada: ${bayaran.daripada}` : undefined,
        isCancelled
      )

      if (bayaran.notaKaki) {
        ctx.fillStyle = "#dc2626"
        ctx.font = "italic 12px Inter"
        ctx.fillText(`Nota: ${bayaran.notaKaki}`, 20, startY + 60)
      }

      ctx.font = "10px Inter"
      ctx.fillStyle = "#9ca3af"
      ctx.fillText("Generated by computer. No signature required.", 20, startY + 80)

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
