"use client"

import { useState } from "react"
import { RangeCalendar } from "react-aria-components"
import { CalendarDate, endOfMonth, getLocalTimeZone, startOfMonth, startOfYear, today } from "@internationalized/date"
import { RiCalendarLine, RiCloseLine } from "@remixicon/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/base/buttons/button"
import { MonthPanel, formatChipDate } from "@/components/base/date-picker/shared"
import { cx } from "@/utils/cx"

/** [from, to] as the pages keep it; to may be missing for a single day. */
export type DateRange = [Date | undefined, Date | undefined]

type Range = { start: CalendarDate; end: CalendarDate }

const toCalendarDate = (date: Date) => new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
const toDate = (date: CalendarDate) => date.toDate(getLocalTimeZone())

function presets(): { label: string; range: Range }[] {
  const now = today(getLocalTimeZone())
  const lastMonth = now.subtract({ months: 1 })
  return [
    { label: "Hari ini", range: { start: now, end: now } },
    { label: "7 hari lepas", range: { start: now.subtract({ days: 6 }), end: now } },
    { label: "Bulan ini", range: { start: startOfMonth(now), end: now } },
    { label: "Bulan lepas", range: { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) } },
    { label: "Tahun ini", range: { start: startOfYear(now), end: now } },
  ]
}

const sameRange = (a: Range | null, b: Range) => !!a && a.start.compare(b.start) === 0 && a.end.compare(b.end) === 0

/** Short text for a range: "05/10/2026" or "01/10/2026 – 27/10/2026". */
export function formatRange([from, to]: DateRange) {
  if (!from) return ""
  const a = formatChipDate(toCalendarDate(from))
  const b = to ? formatChipDate(toCalendarDate(to)) : a
  return a === b ? a : `${a} – ${b}`
}

/** True when date (no time) is within [from, to] inclusive; to defaults to from. */
export function inRange(date: Date | null, [from, to]: DateRange) {
  if (!from) return true
  if (!date) return false
  const day = toCalendarDate(date)
  return day.compare(toCalendarDate(from)) >= 0 && day.compare(toCalendarDate(to ?? from)) <= 0
}

/**
 * Header icon button that opens a BoardUI range calendar (react-aria, as in
 * components/base/date-picker) with quick ranges. The choice is applied with
 * "Guna"; "Kosongkan" removes the filter.
 */
export function DateRangeFilter({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Tapis tarikh",
}: {
  value: DateRange
  onChange: (value: DateRange) => void
  className?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = useState(false)
  const committed: Range | null = value[0] ? { start: toCalendarDate(value[0]), end: toCalendarDate(value[1] ?? value[0]) } : null
  const [pending, setPending] = useState<Range | null>(committed)
  const active = !!value[0]

  const apply = (range: Range | null) => {
    onChange(range ? [toDate(range.start), toDate(range.end)] : [undefined, undefined])
    setOpen(false)
  }

  const days = pending ? pending.end.compare(pending.start) + 1 : 0

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setPending(committed)
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={active ? `${ariaLabel}: ${formatRange(value)}` : ariaLabel}
          title={active ? formatRange(value) : ariaLabel}
          className={cx(
            "relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-background shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-border-focus-ring",
            active && "border-accent-600 text-accent-600 dark:border-accent-400 dark:text-accent-400",
            className,
          )}
        >
          <RiCalendarLine className="size-4" aria-hidden />
          {active && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-600 dark:bg-accent-400" aria-hidden />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(358px,calc(100vw-16px))] rounded-3xl border-0 bg-background-secondary-default p-2 shadow-dropdown">
        <RangeCalendar aria-label={ariaLabel} value={pending} onChange={setPending} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 px-1 pt-1" role="group" aria-label="Julat pantas">
            {presets().map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPending(preset.range)}
                className={cx(
                  "motion-press h-7 cursor-pointer rounded-lg px-2 text-caption-1-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                  sameRange(pending, preset.range)
                    ? "bg-accent-600 text-text-white"
                    : "bg-background-primary-default text-text-secondary hover:text-text-primary",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <MonthPanel offset={0} showPrev showNext />
          </div>
        </RangeCalendar>
        <div className="flex flex-col gap-2 px-1 pt-2 pb-1">
          <p className="text-caption-1-regular text-text-secondary tabular-nums">
            {pending
              ? `${formatRange([toDate(pending.start), toDate(pending.end)])} · ${days} hari`
              : "Klik tarikh mula dan tarikh akhir (klik dua kali untuk satu hari)"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              leadingIcon={RiCloseLine}
              onClick={() => apply(null)}
              disabled={!active && !pending}
              className="flex-1"
            >
              Kosongkan
            </Button>
            <Button type="button" size="small" onClick={() => apply(pending)} disabled={!pending} className="flex-1">
              Guna
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
