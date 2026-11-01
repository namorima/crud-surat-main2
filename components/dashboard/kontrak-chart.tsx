"use client"

import { useEffect, useMemo, useState } from "react"
import type { Bayaran } from "@/types/bayaran"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartCard } from "@/components/dashboard/charts"
import { formatRM, kontrakBayaran, type Period } from "@/lib/dashboard-stats"
import { cx } from "@/utils/cx"

type KontrakInfo = { kerja: string; nilaiKontrak: number | null }

const ALL = "__all"
const SHOWN = 10
// The chosen filters survive reloads (per browser)
const KAWASAN_KEY = "dashboard:kontrak:kawasan"
const KATEGORI_KEY = "dashboard:kontrak:kategori"

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
      caption="Ikut kawasan; rekod tanpa No Kontrak (cth. Piecerate) dan rekod batal tidak dikira"
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
          <ul className="flex flex-col gap-3">
            {shown.map((row, i) => {
              const total = row.paid + row.unpaid
              const nilai = info[row.kawasan]?.[row.noKontrak]?.nilaiKontrak ?? null
              const used = nilai ? Math.round((total / nilai) * 100) : null
              return (
                <li
                  key={row.key}
                  className="flex flex-col gap-1"
                  title={`${row.noKontrak} (${row.kawasan}): dibayar ${formatRM(row.paid)}, belum dibayar ${formatRM(row.unpaid)}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0">
                      <span className="text-caption-1-semibold text-text-primary">{row.noKontrak}</span>
                      <span className="ms-1.5 text-caption-1-regular text-text-secondary [overflow-wrap:anywhere]">
                        {[kawasanShown === ALL && row.kawasan, row.kontraktor].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-caption-1-semibold text-text-primary tabular-nums">
                      {formatRM(total, true)}
                      <span className="ms-1 font-normal text-text-tertiary">· {row.count} rekod</span>
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-[var(--viz-track)]" aria-hidden>
                    <div
                      className="motion-bar h-full"
                      style={{ width: `${(row.paid / top) * 100}%`, background: "var(--viz-1)", animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    />
                    <div
                      className="motion-bar h-full"
                      style={{ width: `${(row.unpaid / top) * 100}%`, background: "var(--viz-2)", animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    />
                  </div>
                  <span className="text-caption-2-regular text-text-tertiary tabular-nums">
                    Dibayar {formatRM(row.paid, true)} · Belum {formatRM(row.unpaid, true)}
                    {used !== null && (
                      <span className={cx(used > 100 && "font-medium text-text-destructive")}>
                        {" "}
                        · {used}% daripada nilai kontrak {formatRM(nilai!, true)}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
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
    </ChartCard>
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
