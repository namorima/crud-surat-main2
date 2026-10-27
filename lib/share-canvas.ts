import type { ChipProps } from "@/components/base/badges/chip"

/** BoardUI chip colours (light mode) as hex [background, text]: canvas cannot read CSS variables reliably. */
export const CHIP_HEX: Record<NonNullable<ChipProps["color"]>, [string, string]> = {
  lime: ["#ecfccb", "#3f6212"],
  rose: ["#ffe4e6", "#9f1239"],
  yellow: ["#fef9c3", "#854d0e"],
  cyan: ["#cffafe", "#155e75"],
  blue: ["#dbeafe", "#1e40af"],
  purple: ["#f3e8ff", "#6b21a8"],
  orange: ["#ffedd5", "#9a3412"],
  neutral: ["#e4e4e7", "#52525b"],
  gray: ["#f4f4f5", "#18181b"],
  soft: ["#f4f4f5", "#52525b"],
}

/** Split text into lines that fit maxWidth (long words are broken by character). */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** The app's font, once loaded, so the image matches the screen. */
export async function appFont(): Promise<string> {
  try {
    await document.fonts?.ready
  } catch {
    // fonts API unavailable; draw with whatever is loaded
  }
  return getComputedStyle(document.body).fontFamily || "system-ui, sans-serif"
}
