"use client"

import { useRef, useEffect } from "react"
import type { Surat } from "@/types/surat"
import { uploadToImgBB } from "@/lib/imgbb-service"

interface ShareImageGeneratorProps {
  surat: Surat
  onImageGenerated: (imageUrl: string, directLink: string) => void
  onError: (error: Error) => void
}

export function ShareImageGenerator({ surat, onImageGenerated, onError }: ShareImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "HOLD / KIV":
        return { bg: "#fff9e6", border: "#f59e0b" }
      case "DALAM TINDAKAN":
        return { bg: "#e6f1ff", border: "#3b82f6" }
      case "SELESAI":
        return { bg: "#e6ffee", border: "#22c55e" }
      case "BATAL":
        return { bg: "#ffe6e6", border: "#ef4444" }
      default:
        return { bg: "#f3f4f6", border: "#6b7280" }
    }
  }

  // Get unit color
  const getUnitColor = (unit: string) => {
    const UNIT_COLORS: Record<string, string> = {
      PERLADANGAN: "#ffe5a0",
      PERANCANG: "#bfe1f6",
      TKA: "#ffcfc9",
      MSPO: "#ffcfc9",
      PEMASARAN: "#d4edbc",
    }
    return UNIT_COLORS[unit] || "#f3f4f6"
  }

  useEffect(() => {
    const generateImage = async () => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions
      canvas.width = 600
      canvas.height = 400

      // Get status colors
      const statusColors = getStatusColor(surat.status)

      // Draw background
      ctx.fillStyle = statusColors.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw border
      ctx.strokeStyle = statusColors.border
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 20)
      ctx.stroke()

      // Draw BIL number
      ctx.font = "bold 36px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText(`#${surat.bil}`, 30, 60)

      // Draw status badge
      const statusText = surat.status
      ctx.font = "bold 18px Inter"
      const statusWidth = ctx.measureText(statusText).width + 40

      // Status badge background
      ctx.fillStyle = statusColors.border
      ctx.beginPath()
      ctx.roundRect(canvas.width - statusWidth - 30, 40, statusWidth, 40, 20)
      ctx.fill()

      // Status text
      ctx.fillStyle = "#fff"
      ctx.fillText(statusText, canvas.width - statusWidth - 30 + 20, 65)

      // Draw kategori
      ctx.font = "18px Inter"
      ctx.fillStyle = "#666"
      ctx.fillText("Kategori:", 30, 110)

      ctx.font = "bold 18px Inter"
      ctx.fillStyle = surat.kategori === "MASUK" ? "#dc2626" : "#2563eb"
      ctx.fillText(`${surat.kategori} ${surat.kategori === "MASUK" ? "↓" : "↑"}`, 130, 110)

      // Draw tarikh
      ctx.font = "18px Inter"
      ctx.fillStyle = "#666"
      ctx.fillText("Tarikh:", 30, 150)

      ctx.font = "bold 18px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText(surat.tarikh, 130, 150)

      // Draw daripada/kepada - Changed to non-bold and gray color
      ctx.font = "18px Inter"
      ctx.fillStyle = "#666"
      ctx.fillText(`DARIPADA/KEPADA: ${surat.daripadaKepada}`, 30, 190)

      // Draw perkara (subject)
      ctx.font = "bold 18px Inter"
      ctx.fillStyle = "#000"

      // Handle long text with wrapping
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(" ")
        let line = ""
        let testLine = ""
        let lineCount = 0

        for (let n = 0; n < words.length; n++) {
          testLine = line + words[n] + " "
          const metrics = ctx.measureText(testLine)
          const testWidth = metrics.width

          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y + lineCount * lineHeight)
            line = words[n] + " "
            lineCount++
          } else {
            line = testLine
          }
        }

        ctx.fillText(line, x, y + lineCount * lineHeight)
        return lineCount
      }

      const lineCount = wrapText(surat.perkara, 30, 230, canvas.width - 60, 30)

      // Draw unit and PIC badges
      const yPosition = 240 + lineCount * 30

      // Unit badge
      ctx.fillStyle = getUnitColor(surat.unit)
      ctx.beginPath()
      ctx.roundRect(30, yPosition, 200, 40, 20)
      ctx.fill()

      ctx.font = "bold 18px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText(surat.unit, 70, yPosition + 25)

      // PIC badge
      ctx.fillStyle = getUnitColor(surat.unit)
      ctx.beginPath()
      ctx.roundRect(250, yPosition, 200, 40, 20)
      ctx.fill()

      ctx.font = "bold 18px Inter"
      ctx.fillStyle = "#000"
      ctx.fillText(`PIC: ${surat.tindakanPic}`, 270, yPosition + 25)

      // Draw nota if exists
      if (surat.nota) {
        ctx.font = "18px Inter"
        ctx.fillStyle = "#dc2626"
        ctx.fillText(`Nota: ${surat.nota}`, 30, yPosition + 80)
      }

      try {
        // Convert canvas to image URL
        const imageUrl = canvas.toDataURL("image/png")

        // Upload to ImgBB
        const directLink = await uploadToImgBB(imageUrl)

        // Call the callback with both the local image URL and the direct link
        onImageGenerated(imageUrl, directLink)
      } catch (error) {
        onError(error as Error)
      }
    }

    generateImage()
  }, [surat, onImageGenerated, onError])

  return <canvas ref={canvasRef} style={{ display: "none" }} />
}
