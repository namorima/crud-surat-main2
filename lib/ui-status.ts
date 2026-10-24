import type { ChipProps } from "@/components/base/badges/chip"

type ChipColor = NonNullable<ChipProps["color"]>

/** BoardUI chip colour for each Surat status. */
export const SURAT_STATUS_CHIP: Record<string, ChipColor> = {
  "BELUM PROSES": "neutral",
  "DALAM TINDAKAN": "blue",
  SELESAI: "lime",
  "HOLD / KIV": "orange",
  BATAL: "rose",
}

/** Row/card tint for each Surat status (tokens defined in app/globals.css). */
export const SURAT_STATUS_SURFACE: Record<string, string> = {
  "DALAM TINDAKAN": "bg-status-surface-tindakan",
  SELESAI: "bg-status-surface-selesai",
  "HOLD / KIV": "bg-status-surface-hold",
  BATAL: "bg-status-surface-batal",
}

/** Unit chips keep the hues of the old UNIT_COLORS map, as dark-mode-safe chip colours. */
export const UNIT_CHIP: Record<string, ChipColor> = {
  PERLADANGAN: "yellow",
  PERANCANG: "cyan",
  TKA: "rose",
  MSPO: "rose",
  PEMASARAN: "lime",
}

export const suratStatusChip = (status: string): ChipColor => SURAT_STATUS_CHIP[status] ?? "neutral"
export const unitChip = (unit: string): ChipColor => UNIT_CHIP[unit] ?? "neutral"

/** Bayaran kategori chips (hues of the old KATEGORI_COLORS map). */
export const BAYARAN_KATEGORI_CHIP: Record<string, ChipColor> = {
  "PERTANIAN AM": "lime",
  "ANGKUT BTS": "orange",
  PIECERATE: "cyan",
  KIMIA: "yellow",
  KONTRAK: "purple",
}

export const bayaranKategoriChip = (kategori: string): ChipColor =>
  BAYARAN_KATEGORI_CHIP[kategori?.toUpperCase()] ?? "neutral"
