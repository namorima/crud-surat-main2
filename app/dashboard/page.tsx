"use client"

import { useEffect, useMemo, useState } from "react"
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiTimerLine,
} from "@remixicon/react"
import type { Surat } from "@/types/surat"
import type { Bayaran } from "@/types/bayaran"
import { NavTrigger } from "@/components/dashboard/app-shell"
import { PageLoader } from "@/components/dashboard/page-loader"
import { useNavigation } from "@/components/dashboard/sidebar"
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control"
import { BarList, ChartCard, KpiGrid, MonthlyStack, ORDINAL } from "@/components/dashboard/charts"
import {
  PERIOD_LABEL,
  bayaranStats,
  formatRM,
  suratStats,
  type Period,
} from "@/lib/dashboard-stats"

type View = "bayaran" | "surat"

const count = (n: number) => n.toLocaleString("en-MY")
const days = (n: number | null) => (n === null ? "-" : `${Math.round(n)} hari`)
const rekod = (n?: number) => (n === undefined ? undefined : `${count(n)} rekod`)

/** Dashboard + Statistik in one page: Bayaran and Surat analysis, per permission. */
export default function DashboardPage() {
  const nav = useNavigation()
  const canBayaran = nav.some((item) => item.href === "/dashboard/bayaran")
  const canSurat = nav.some((item) => item.href === "/dashboard/surat")

  const [view, setView] = useState<View>("bayaran")
  const [period, setPeriod] = useState<Period>("12m")
  const [bayaran, setBayaran] = useState<Bayaran[]>([])
  const [surat, setSurat] = useState<Surat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fall back to the one section the user may see
  const shown: View | null = view === "bayaran" ? (canBayaran ? "bayaran" : canSurat ? "surat" : null) : canSurat ? "surat" : canBayaran ? "bayaran" : null

  useEffect(() => {
    let cancelled = false
    const load = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url}: ${res.status}`)
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [b, s] = await Promise.all([canBayaran ? load("/api/bayaran") : [], canSurat ? load("/api/surat") : []])
        if (!cancelled) {
          setBayaran(b)
          setSurat(s)
        }
      } catch (e) {
        console.error("Dashboard fetch failed:", e)
        if (!cancelled) setError("Gagal memuatkan data. Sila cuba lagi.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canBayaran, canSurat])

  const b = useMemo(() => bayaranStats(bayaran, period), [bayaran, period])
  const s = useMemo(() => suratStats(surat, period), [surat, period])

  return (
    <div className="flex flex-col gap-3 pb-2 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <NavTrigger />
          <h1 className="truncate px-1 text-title-2-medium text-text-primary">Dashboard</h1>
        </div>
        {canBayaran && canSurat && (
          <SegmentedControl
            aria-label="Paparan dashboard"
            selectedKeys={[shown ?? view]}
            onSelectionChange={(keys) => setView((String([...keys][0] ?? view) as View) || view)}
          >
            <SegmentedControlItem id="bayaran">Bayaran</SegmentedControlItem>
            <SegmentedControlItem id="surat">Surat</SegmentedControlItem>
          </SegmentedControl>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          aria-label="Tempoh"
          variant="plain"
          selectedKeys={[period]}
          onSelectionChange={(keys) => setPeriod((String([...keys][0] ?? period) as Period) || period)}
        >
          <SegmentedControlItem id="12m">12 bulan</SegmentedControlItem>
          <SegmentedControlItem id="year">Tahun ini</SegmentedControlItem>
          <SegmentedControlItem id="all">Semua</SegmentedControlItem>
        </SegmentedControl>
        <span className="text-caption-1-regular text-text-tertiary">
          {shown === "surat" ? "Ikut tarikh surat" : "Ikut tarikh terima"} · {PERIOD_LABEL[period]}
        </span>
      </div>

      {loading ? (
        <PageLoader inline />
      ) : error ? (
        <p className="rounded-2xl border border-border-table bg-background-primary-default p-6 text-center text-body-regular text-text-secondary">{error}</p>
      ) : shown === "bayaran" ? (
        <BayaranSection stats={b} />
      ) : shown === "surat" ? (
        <SuratSection stats={s} />
      ) : (
        <p className="rounded-2xl border border-border-table bg-background-primary-default p-6 text-center text-body-regular text-text-secondary">
          Tiada data yang boleh dipaparkan untuk akaun anda.
        </p>
      )}
    </div>
  )
}

function BayaranSection({ stats }: { stats: ReturnType<typeof bayaranStats> }) {
  const paidShare = stats.total.amount ? Math.round((stats.paid.amount / stats.total.amount) * 100) : 0
  const funnelStart = stats.funnel[0]?.value ?? 0

  return (
    <>
      <KpiGrid
        items={[
          { icon: RiMoneyDollarCircleLine, label: "Jumlah nilai", value: formatRM(stats.total.amount, true), sub: rekod(stats.total.count) },
          { icon: RiTimeLine, label: "Belum dibayar", value: formatRM(stats.unpaid.amount, true), sub: rekod(stats.unpaid.count) },
          { icon: RiCheckboxCircleLine, label: "Sudah dibayar", value: formatRM(stats.paid.amount, true), sub: `${rekod(stats.paid.count)} · ${paidShare}% nilai` },
          { icon: RiTimerLine, label: "Purata tempoh bayar", value: days(stats.avgDaysToPay), sub: "Tarikh terima → bayar" },
        ]}
      />

      <ChartCard title="Nilai bayaran bulanan" caption="Ikut bulan tarikh terima; tidak termasuk rekod batal">
        <MonthlyStack
          data={stats.monthly}
          series={[
            { key: "dibayar", label: "Sudah dibayar", color: "var(--viz-1)" },
            { key: "belum", label: "Belum dibayar", color: "var(--viz-2)" },
          ]}
          format={(v) => formatRM(v)}
          axisFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
      </ChartCard>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard title="Peringkat proses" caption="Berapa rekod sudah melepasi setiap peringkat">
          <BarList
            rows={stats.funnel}
            max={funnelStart}
            format={count}
            sub={(row) => (funnelStart ? `${Math.round((row.value / funnelStart) * 100)}%` : undefined)}
          />
        </ChartCard>

        <ChartCard title="Umur bayaran tertunggak" caption="Rekod belum dibayar, dikira dari tarikh terima">
          <BarList rows={stats.unpaidAge} format={(v) => formatRM(v)} sub={(r) => rekod(r.count)} colors={ORDINAL} empty="Tiada bayaran tertunggak." />
        </ChartCard>

        <ChartCard title="Nilai mengikut kawasan" caption="Daripada (ladang / unit)">
          <BarList rows={stats.kawasan} format={(v) => formatRM(v, true)} sub={(r) => rekod(r.count)} />
        </ChartCard>

        <ChartCard title="Nilai mengikut kategori">
          <BarList rows={stats.kategori} format={(v) => formatRM(v, true)} sub={(r) => rekod(r.count)} />
        </ChartCard>

        <ChartCard title="Kontraktor utama" caption="Jumlah nilai bayaran tertinggi">
          <BarList rows={stats.kontraktor} format={(v) => formatRM(v, true)} sub={(r) => rekod(r.count)} empty="Tiada rekod dengan nama kontraktor." />
        </ChartCard>

        <ChartCard title="Belum dibayar mengikut penerima" caption="Siapa sedang memegang bayaran tertunggak">
          <BarList rows={stats.unpaidByPenerima} format={(v) => formatRM(v, true)} sub={(r) => rekod(r.count)} empty="Tiada bayaran tertunggak." />
        </ChartCard>

        <ChartCard title="Status bayaran" caption={stats.cancelled ? `Termasuk ${stats.cancelled} rekod batal` : undefined} className="lg:col-span-2">
          <BarList rows={stats.status} format={(v) => `${count(v)} rekod`} />
        </ChartCard>
      </div>
    </>
  )
}

function SuratSection({ stats }: { stats: ReturnType<typeof suratStats> }) {
  return (
    <>
      <KpiGrid
        items={[
          { icon: RiFileList3Line, label: "Jumlah surat", value: count(stats.total), sub: `${count(stats.open)} belum selesai` },
          { icon: RiTimeLine, label: "Belum proses", value: count(stats.pending) },
          { icon: RiErrorWarningLine, label: "Dalam tindakan", value: count(stats.inProgress) },
          {
            icon: RiCheckboxCircleLine,
            label: "Kadar selesai",
            value: stats.doneRate === null ? "-" : `${Math.round(stats.doneRate * 100)}%`,
            sub: `Purata ${days(stats.avgDaysToClose)}`,
          },
        ]}
      />

      <ChartCard title="Surat bulanan" caption="Bilangan surat masuk dan keluar ikut bulan">
        <MonthlyStack
          data={stats.monthly}
          series={[
            { key: "masuk", label: "Masuk", color: "var(--viz-1)" },
            { key: "keluar", label: "Keluar", color: "var(--viz-2)" },
          ]}
          format={count}
          axisFormat={(v) => String(v)}
        />
      </ChartCard>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard title="Status surat">
          <BarList rows={stats.status} format={(v) => `${count(v)} surat`} />
        </ChartCard>

        <ChartCard title="Umur surat belum selesai" caption="Dikira dari tarikh surat">
          <BarList rows={stats.openAge} format={(v) => `${count(v)} surat`} colors={ORDINAL} empty="Tiada surat tertunggak." />
        </ChartCard>

        <ChartCard title="Surat tertunggak mengikut PIC" caption="Belum proses, dalam tindakan dan hold">
          <BarList rows={stats.openByPic} format={(v) => `${count(v)} surat`} empty="Tiada surat tertunggak." />
        </ChartCard>

        <ChartCard title="Surat mengikut unit">
          <BarList rows={stats.unit} format={(v) => `${count(v)} surat`} />
        </ChartCard>
      </div>
    </>
  )
}
