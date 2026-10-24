import type { KontraktorInput } from "@/types/kontraktor"

/** Suggestions for Jenis Bank; any other bank can still be typed. */
export const BANK_SUGGESTIONS = [
  "MAYBANK",
  "CIMB BANK",
  "BANK ISLAM",
  "BANK RAKYAT",
  "BANK MUAMALAT",
  "RHB BANK",
  "PUBLIC BANK",
  "HONG LEONG BANK",
  "AMBANK",
  "AFFIN BANK",
  "ALLIANCE BANK",
  "AGROBANK",
  "BANK SIMPANAN NASIONAL",
] as const

/** Trims and normalises the fields; returns an error message or the clean input. */
export function parseKontraktorInput(body: any): KontraktorInput | string {
  const text = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ")
  const input: KontraktorInput = {
    namaKontraktor: text(body?.namaKontraktor).toUpperCase(),
    noVendor: text(body?.noVendor).toUpperCase(),
    namaAkaun: text(body?.namaAkaun).toUpperCase(),
    // Account numbers keep digits and dashes only.
    nomborAkaun: text(body?.nomborAkaun).replace(/[^\d-]/g, ""),
    jenisBank: text(body?.jenisBank).toUpperCase(),
  }
  if (!input.namaKontraktor) return "Nama Kontraktor wajib diisi"
  if (text(body?.nomborAkaun) && !input.nomborAkaun) return "Nombor Akaun hanya boleh mengandungi nombor"
  return input
}
