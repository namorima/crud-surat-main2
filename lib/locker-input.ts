import type { LockerInput } from "@/types/locker"

/** Part badge colours offered in Setup Locker (any #rrggbb is accepted). */
export const LOCKER_WARNA = [
  { name: "Kuning", hex: "#facc15" },
  { name: "Hijau muda", hex: "#84cc16" },
  { name: "Hijau", hex: "#22c55e" },
  { name: "Teal", hex: "#2dd4bf" },
  { name: "Cyan", hex: "#22d3ee" },
  { name: "Biru", hex: "#60a5fa" },
  { name: "Ungu", hex: "#a78bfa" },
  { name: "Merah jambu", hex: "#f472b6" },
  { name: "Merah", hex: "#f87171" },
  { name: "Oren", hex: "#fb923c" },
  { name: "Kelabu", hex: "#a3a3a3" },
] as const

export const DEFAULT_WARNA = "#a3a3a3"

const HEX = /^#[0-9a-f]{6}$/

const text = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "")

/** Validates a POST/PUT body; returns the input or an error message. */
export function parseLockerInput(body: any): LockerInput | string {
  const input: LockerInput = {
    unit: text(body?.unit).toUpperCase(),
    part: text(body?.part).toUpperCase(),
    noLocker: text(body?.noLocker).toUpperCase(),
    warna: (text(body?.warna) || DEFAULT_WARNA).toLowerCase(),
  }
  if (!input.unit || !input.part || !input.noLocker) return "Unit, Part dan No. Locker wajib diisi"
  if (!HEX.test(input.warna)) return "Warna tidak sah (contoh: #facc15)"
  return input
}
