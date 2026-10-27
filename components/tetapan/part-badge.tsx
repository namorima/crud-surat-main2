import type { Locker } from "@/types/locker"
import { Chip } from "@/components/base/badges/chip"

/** Older hues, used when no locker in Setup Locker matches a fail. */
const FALLBACK_WARNA: Record<string, string> = {
  HASIL: "#facc15",
  "PERTANIAN AM": "#84cc16",
  KONTRAK: "#fb923c",
  PERLADANGAN: "#f472b6",
}

/**
 * The Part badge colour for a fail: its own locker in Setup Locker, else the
 * same part in that unit, else the same part anywhere, else the old hues.
 */
export function partWarna(lockers: Locker[], fail: { unit: string; part: string; noLocker?: string }) {
  const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase()
  const ofPart = lockers.filter((locker) => same(locker.part, fail.part))
  const ofUnit = ofPart.filter((locker) => same(locker.unit, fail.unit))
  return (
    ofUnit.find((locker) => same(locker.noLocker, fail.noLocker || ""))?.warna ??
    ofUnit[0]?.warna ??
    ofPart[0]?.warna ??
    FALLBACK_WARNA[fail.part.toUpperCase()]
  )
}

export function PartBadge({ part, warna }: { part: string; warna?: string }) {
  return (
    <Chip variant="caption" color="soft" className="gap-1.5">
      <span
        className="size-2 shrink-0 rounded-full bg-neutral-400"
        style={warna ? { backgroundColor: warna } : undefined}
        aria-hidden
      />
      {part}
    </Chip>
  )
}
