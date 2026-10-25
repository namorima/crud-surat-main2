"use client"

import type { ComponentType, ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Row } from "@/lib/dashboard-stats"
import { useIsMobile } from "@/hooks/use-mobile"
import { cx } from "@/utils/cx"

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>

/** Card frame for one analysis block: title, optional caption, body. */
export function ChartCard({
  title,
  caption,
  action,
  className,
  children,
}: {
  title: string
  caption?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-col gap-3 rounded-2xl border border-border-table bg-background-primary-default p-4 shadow-xs sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-body-semibold text-text-primary">{title}</h2>
          {caption && <p className="mt-0.5 text-caption-1-regular text-text-secondary">{caption}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export type Kpi = {
  icon: IconComponent
  label: string
  value: string
  /** Second line under the value, e.g. a record count. */
  sub?: string
}

/** Headline numbers: two per row on phones, four from `lg`. */
export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="motion-stagger grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div
          key={k.label}
          className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border-table bg-background-primary-default p-3 shadow-xs sm:rounded-3xl sm:p-4"
        >
          <div className="flex items-center gap-1.5 text-text-secondary">
            <k.icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate text-caption-1-medium">{k.label}</span>
          </div>
          <span className="truncate text-title-3-semibold text-text-primary sm:text-title-2-semibold">{k.value}</span>
          {k.sub && <span className="truncate text-caption-1-regular text-text-tertiary">{k.sub}</span>}
        </div>
      ))}
    </div>
  )
}

/**
 * Horizontal bars as plain HTML: label and value sit on their own line above
 * the bar, so long names (kawasan, kontraktor) wrap on phones instead of being
 * clipped by a chart axis. One hue unless `colors` gives an ordinal ramp.
 */
export function BarList({
  rows,
  format = (v) => v.toLocaleString("en-MY"),
  sub,
  colors,
  max,
  empty = "Tiada data dalam tempoh ini.",
}: {
  rows: Row[]
  format?: (value: number) => string
  /** Extra text after the value, e.g. "12 rekod". */
  sub?: (row: Row) => string | undefined
  /** One CSS colour per row (ordinal ramp); defaults to --viz-1. */
  colors?: string[]
  /** Scale bars against this instead of the largest row (e.g. funnel start). */
  max?: number
  empty?: string
}) {
  const top = max ?? Math.max(0, ...rows.map((r) => r.value))
  if (!rows.length || top <= 0) return <p className="py-4 text-center text-caption-1-regular text-text-tertiary">{empty}</p>

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const pct = Math.max(0, Math.min(100, (row.value / top) * 100))
        const extra = sub?.(row)
        return (
          <li key={row.label} className="flex flex-col gap-1" title={`${row.label}: ${format(row.value)}${extra ? ` · ${extra}` : ""}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-caption-1-medium text-text-primary">{row.label}</span>
              <span className="shrink-0 text-right text-caption-1-semibold text-text-primary tabular-nums">
                {format(row.value)}
                {extra && <span className="ms-1 font-normal text-text-tertiary">· {extra}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--viz-track)]">
              <div
                className="motion-bar h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-soft)]"
                style={{
                  width: `${pct}%`,
                  minWidth: row.value > 0 ? 4 : 0,
                  background: colors?.[i] ?? "var(--viz-1)",
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export const ORDINAL = ["var(--viz-ord-1)", "var(--viz-ord-2)", "var(--viz-ord-3)", "var(--viz-ord-4)"]

type Series = { key: string; label: string; color: string }

/**
 * Stacked monthly columns (two series, one y-axis) with a hover/tap tooltip,
 * a legend, and a table fallback. Phones show every other month label.
 */
export function MonthlyStack({
  data,
  series,
  format,
  axisFormat,
}: {
  data: Record<string, string | number>[]
  series: [Series, Series]
  format: (value: number) => string
  axisFormat: (value: number) => string
}) {
  const isMobile = useIsMobile()
  const hasData = data.some((d) => series.some((s) => Number(d[s.key]) > 0))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-caption-1-medium text-text-secondary">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>
      {hasData ? (
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={isMobile ? "18%" : "28%"} maxBarSize={28}>
              <CartesianGrid vertical={false} stroke="var(--color-border-table)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--color-border-table)" }}
                interval={isMobile && data.length > 6 ? 1 : 0}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                tickFormatter={(v: string) => (isMobile ? v.split(" ")[0] : v)}
              />
              <YAxis
                width={isMobile ? 38 : 48}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                tickFormatter={axisFormat}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "var(--viz-track)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-border-table bg-background-primary-default px-3 py-2 text-caption-1-regular shadow-md">
                      <p className="mb-1 text-caption-1-semibold text-text-primary">{label}</p>
                      {series.map((s) => {
                        const v = Number(payload.find((p) => p.dataKey === s.key)?.value ?? 0)
                        return (
                          <p key={s.key} className="flex items-center gap-1.5 text-text-secondary">
                            <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                            {s.label}: <span className="font-semibold text-text-primary tabular-nums">{format(v)}</span>
                          </p>
                        )
                      })}
                    </div>
                  ) : null
                }
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="m"
                  fill={s.color}
                  stroke="var(--color-background-primary-default)"
                  strokeWidth={1}
                  radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-caption-1-regular text-text-tertiary">Tiada data dalam tempoh ini.</p>
      )}
      {hasData && (
        <details className="text-caption-1-regular text-text-secondary">
          <summary className="cursor-pointer select-none text-caption-1-medium text-accent-600 dark:text-accent-400">Lihat jadual</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[260px] text-left tabular-nums">
              <thead>
                <tr className="text-text-tertiary">
                  <th className="py-1 pr-2 font-medium">Bulan</th>
                  {series.map((s) => (
                    <th key={s.key} className="py-1 pr-2 text-right font-medium">{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={String(d.label)} className="border-t border-border-table">
                    <td className="py-1 pr-2 text-text-primary">{d.label}</td>
                    {series.map((s) => (
                      <td key={s.key} className="py-1 pr-2 text-right text-text-primary">{format(Number(d[s.key] ?? 0))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
