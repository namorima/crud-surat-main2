"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Bayaran } from "@/types/bayaran"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartCard } from "@/components/dashboard/charts"
import { KontrakDetailDialog, type KontrakInfo } from "@/components/dashboard/kontrak-detail-dialog"
import { formatRM, kontrakBayaran, type KontrakRow, type Period } from "@/lib/dashboard-stats"
import { cx } from "@/utils/cx"

const ALL = "__all"
const SHOWN = 10
// The chosen filters survive reloads (per browser)
const KAWASAN_KEY = "dashboard:kontrak:kawasan"
const KATEGORI_KEY = "dashboard:kontrak:kategori"
// The kontrak whose detail was open when a Rekod Bayaran was opened from it, so
// coming back to the Dashboard opens it again (per tab)
const OPEN_KEY = "dashboard:kontrak:buka"

const readSaved = (key: string) => {
  try {
    return localStorage.getItem(key) || ALL
  } catch {
    return ALL
  }
}
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

/**
 * Dashboard → Bayaran: value paid and unpaid per kontrak (kawasan + no kontrak)
 * in the period, filtered by Kawasan and Kategori. When the kontrak has a Nilai
 * Kontrak (Tetapan → Kontrak), the share of it already claimed is shown too.
 */
export function KontrakChart({ bayaran, period }: { bayaran: Bayaran[]; period: Period }) {
  const [kawasan, setKawasan] = useState(ALL)
  const [kategori, setKategori] = useState(ALL)
  const [showAll, setShowAll] = useState(false)
  const [info, setInfo] = useState<Record<string, Record<string, KontrakInfo>>>({})
  // The kontrak whose bayaran are shown in the detail dialog
  const [selected, setSelected] = useState<KontrakRow | null>(null)
  const router = useRouter()

  useEffect(() => {
    setKawasan(readSaved(KAWASAN_KEY))
    setKategori(readSaved(KATEGORI_KEY))
    // Nilai Kontrak per kawasan and no kontrak; the chart works without it
    fetch("/api/bayaran-form-data")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.kontrakInfoByKawasan && setInfo(data.kontrakInfoByKawasan))
      .catch(() => {})
  }, [])

  const all = useMemo(() => kontrakBayaran(bayaran, period), [bayaran, period])

  // Back from a Rekod Bayaran opened in the detail: show that kontrak again
  useEffect(() => {
    if (!all.length) return
    let key: string | null = null
    try {
      key = sessionStorage.getItem(OPEN_KEY)
      sessionStorage.removeItem(OPEN_KEY)
    } catch {}
    const row = key ? all.find((r) => r.key === key) : undefined
    if (row) setSelected(row)
  }, [all])
  const kawasanOptions = useMemo(() => [...new Set(all.map((r) => r.kawasan))].sort(), [all])
  const kategoriOptions = useMemo(
    () => [...new Set(all.filter((r) => kawasan === ALL || r.kawasan === kawasan).map((r) => r.kategori))].sort(),
    [all, kawasan],
  )
  // A saved choice that has no rows in this period falls back to all
  const kawasanShown = kawasan !== ALL && kawasanOptions.includes(kawasan) ? kawasan : ALL
  const kategoriShown = kategori !== ALL && kategoriOptions.includes(kategori) ? kategori : ALL

  const rows = useMemo(
    () => all.filter((r) => (kawasanShown === ALL || r.kawasan === kawasanShown) && (kategoriShown === ALL || r.kategori === kategoriShown)),
    [all, kawasanShown, kategoriShown],
  )
  const shown = showAll ? rows : rows.slice(0, SHOWN)
  const top = Math.max(0, ...rows.map((r) => r.paid + r.unpaid))
  const totals = rows.reduce((t, r) => ({ paid: t.paid + r.paid, unpaid: t.unpaid + r.unpaid }), { paid: 0, unpaid: 0 })

  return (
    <ChartCard
      title="Bayaran mengikut No Kontrak"
      caption="Ikut kawasan; rekod tanpa No Kontrak (cth. Piecerate) dan rekod batal tidak dikira. Klik kontrak untuk butiran bayaran."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={kawasanShown}
          onValueChange={(value) => {
            if (!value) return
            setKawasan(value)
            save(KAWASAN_KEY, value)
            setShowAll(false)
          }}
        >
          <SelectTrigger className="h-8 w-full sm:w-[220px]" aria-label="Tapis kawasan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kawasan</SelectItem>
            {kawasanOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={kategoriShown}
          onValueChange={(value) => {
            if (!value) return
            setKategori(value)
            save(KATEGORI_KEY, value)
            setShowAll(false)
          }}
        >
          <SelectTrigger className="h-8 w-full sm:w-[180px]" aria-label="Tapis kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kategori</SelectItem>
            {kategoriOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-caption-1-regular text-text-secondary sm:ms-auto sm:w-auto">
          <Legend color="var(--viz-1)" label={`Sudah dibayar ${formatRM(totals.paid, true)}`} />
          <Legend color="var(--viz-2)" label={`Belum dibayar ${formatRM(totals.unpaid, true)}`} />
        </div>
      </div>

      {rows.length === 0 || top <= 0 ? (
        <p className="py-4 text-center text-caption-1-regular text-text-tertiary">Tiada bayaran berkontrak dalam tempoh dan tapisan ini.</p>
      ) : (
        <>
          <KontrakBars rows={shown} info={info} showKawasan={kawasanShown === ALL} onSelect={setSelected} />
          {rows.length > SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="self-start rounded-md px-1 text-caption-1-medium text-accent-600 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring dark:text-accent-400"
            >
              {showAll ? "Tunjuk 10 teratas" : `Tunjuk semua (${rows.length} kontrak)`}
            </button>
          )}
        </>
      )}
      <KontrakDetailDialog
        row={selected}
        bayaran={bayaran}
        info={selected ? info[selected.kawasan]?.[selected.noKontrak] : undefined}
        onClose={() => setSelected(null)}
        onOpenBayaran={(b) => {
          try {
            if (selected) sessionStorage.setItem(OPEN_KEY, selected.key)
          } catch {}
          router.push(`/dashboard/bayaran?buka=${encodeURIComponent(b.id)}&dari=dashboard`)
        }}
      />
    </ChartCard>
  )
}

type BarDatum = { label: string; paid: number; unpaid: number; total: number; row: KontrakRow; nilai: number | null }

const axisRM = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}j` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))

/** Horizontal stacked bars (paid / unpaid) per kontrak; a bar or its label opens the detail. */
function KontrakBars({
  rows,
  info,
  showKawasan,
  onSelect,
}: {
  rows: KontrakRow[]
  info: Record<string, Record<string, KontrakInfo>>
  showKawasan: boolean
  onSelect: (row: KontrakRow) => void
}) {
  const isMobile = useIsMobile()
  const data: BarDatum[] = rows.map((row) => ({
    label: showKawasan && !isMobile ? `${row.noKontrak} · ${row.kawasan}` : row.noKontrak,
    paid: row.paid,
    unpaid: row.unpaid,
    total: row.paid + row.unpaid,
    row,
    nilai: info[row.kawasan]?.[row.noKontrak]?.nilaiKontrak ?? null,
  }))
  const pick = (entry: unknown) => {
    const datum = (entry as { payload?: BarDatum })?.payload
    if (datum?.row) onSelect(datum.row)
  }
  const labelWidth = isMobile ? 84 : showKawasan ? 200 : 120

  return (
    <div className="w-full" style={{ height: data.length * (isMobile ? 34 : 38) + 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: isMobile ? 44 : 64, left: 0, bottom: 0 }}
          barCategoryGap="22%"
          onClick={(state) => {
            const i = (state as { activeTooltipIndex?: number | string } | null)?.activeTooltipIndex
            const datum = i === undefined || i === null ? undefined : data[Number(i)]
            if (datum) onSelect(datum.row)
          }}
          className="cursor-pointer"
        >
          <CartesianGrid horizontal={false} stroke="var(--color-border-table)" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: "var(--color-border-table)" }}
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            tickFormatter={axisRM}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--viz-track)" }}
            content={({ active, payload }) => {
              const d = active ? (payload?.[0]?.payload as BarDatum | undefined) : undefined
              if (!d) return null
              const used = d.nilai ? Math.round((d.total / d.nilai) * 100) : null
              return (
                <div className="max-w-64 rounded-xl border border-border-table bg-background-primary-default px-3 py-2 text-caption-1-regular shadow-md">
                  <p className="text-caption-1-semibold text-text-primary">{d.row.noKontrak}</p>
                  <p className="mb-1 text-text-tertiary">{[d.row.kawasan, d.row.kontraktor].filter(Boolean).join(" · ")}</p>
                  <p className="flex items-center gap-1.5 text-text-secondary">
                    <span className="size-2 rounded-sm" style={{ background: "var(--viz-1)" }} aria-hidden />
                    Sudah dibayar: <span className="font-semibold text-text-primary tabular-nums">{formatRM(d.paid)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-text-secondary">
                    <span className="size-2 rounded-sm" style={{ background: "var(--viz-2)" }} aria-hidden />
                    Belum dibayar: <span className="font-semibold text-text-primary tabular-nums">{formatRM(d.unpaid)}</span>
                  </p>
                  <p className="mt-1 text-text-secondary tabular-nums">
                    {d.row.count} rekod
                    {used !== null && (
                      <span className={cx(used > 100 && "font-medium text-text-destructive")}> · {used}% daripada nilai kontrak {formatRM(d.nilai!, true)}</span>
                    )}
                  </p>
                  <p className="mt-1 text-caption-2-regular text-text-tertiary">Klik untuk butiran bayaran</p>
                </div>
              )
            }}
          />
          <Bar dataKey="paid" stackId="k" fill="var(--viz-1)" isAnimationActive={false} onClick={pick} />
          <Bar dataKey="unpaid" stackId="k" fill="var(--viz-2)" radius={[0, 4, 4, 0]} isAnimationActive={false} onClick={pick}>
            <LabelList
              dataKey="total"
              position="right"
              // Phones: "72.0k" so the label stays on one line
              formatter={(v: unknown) => (isMobile ? formatRM(Number(v), true).replace("RM ", "") : formatRM(Number(v), true))}
              style={{ fontSize: 11, fill: "var(--color-text-primary)", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  )
}
