"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBankCardLine,
  RiDownload2Line,
  RiLoader4Line,
  RiMailOpenLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import type { Surat } from "@/types/surat"
import type { Bayaran } from "@/types/bayaran"
import { useAuth } from "@/lib/auth-provider"
import { NavTrigger } from "@/components/dashboard/app-shell"
import { PageLoader } from "@/components/dashboard/page-loader"
import { useNavigation } from "@/components/dashboard/sidebar"
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control"
import { Button } from "@/components/base/buttons/button"
import { formatRM } from "@/lib/dashboard-stats"
import {
  bayaranDalam,
  geser,
  jumlahNilai,
  laporanBayaranPdf,
  laporanSuratPdf,
  suratDalam,
  tempoh,
  type Jenis,
  type Tempoh,
} from "@/lib/laporan"
import { cx } from "@/utils/cx"

const PREVIEW = 5
const pad = (n: number) => String(n).padStart(2, "0")

/** Laporan Surat and Laporan Rekod Bayaran, weekly or monthly, as A4 portrait PDFs. */
export default function DownloadPage() {
  const { user } = useAuth()
  const nav = useNavigation()
  const canSurat = nav.some((item) => item.href === "/dashboard/surat")
  const canBayaran = nav.some((item) => item.href === "/dashboard/bayaran")
  // As on the Surat page: only admins and PENGURUS see every unit
  const unitOnly = user && user.role !== "semua" && user.role !== "PENGURUS" ? user.role : undefined

  const [jenis, setJenis] = useState<Jenis>("mingguan")
  const [t, setT] = useState<Tempoh>(() => tempoh("mingguan", new Date()))
  const [surat, setSurat] = useState<Surat[]>([])
  const [bayaran, setBayaran] = useState<Bayaran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"surat" | "bayaran" | null>(null)

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
        const [s, b] = await Promise.all([canSurat ? load("/api/surat") : [], canBayaran ? load("/api/bayaran") : []])
        if (!cancelled) {
          setSurat(s)
          setBayaran(b)
        }
      } catch (e) {
        console.error("Download fetch failed:", e)
        if (!cancelled) setError("Gagal memuatkan data. Sila cuba lagi.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canSurat, canBayaran])

  const suratRows = useMemo(() => {
    const mine = unitOnly ? surat.filter((s) => (s.unit || "").trim().toLowerCase() === unitOnly.trim().toLowerCase()) : surat
    return suratDalam(mine, t)
  }, [surat, t, unitOnly])
  const bayaranRows = useMemo(() => bayaranDalam(bayaran, t), [bayaran, t])

  const changeJenis = (next: Jenis) => {
    setJenis(next)
    // Keep the same place in time: the month of the week's Monday, or the first week of the month
    setT(tempoh(next, t.from))
  }

  const isNow = tempoh(jenis, new Date()).from.getTime() === t.from.getTime()
  const meta = { tempoh: t, dijanaOleh: user?.name || user?.username || "-", unit: unitOnly }

  const download = async (which: "surat" | "bayaran") => {
    setBusy(which)
    try {
      if (which === "surat") await laporanSuratPdf(suratRows, meta)
      else await laporanBayaranPdf(bayaranRows, meta)
    } catch (e) {
      console.error("PDF failed:", e)
      setError("Gagal menjana PDF. Sila cuba lagi.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-2 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <NavTrigger />
          <h1 className="truncate px-1 text-title-2-medium text-text-primary">Download</h1>
        </div>
        <SegmentedControl
          aria-label="Jenis laporan"
          selectedKeys={[jenis]}
          onSelectionChange={(keys) => {
            const next = String([...keys][0] ?? "") as Jenis
            if (next && next !== jenis) changeJenis(next)
          }}
        >
          <SegmentedControlItem id="mingguan">Mingguan</SegmentedControlItem>
          <SegmentedControlItem id="bulanan">Bulanan</SegmentedControlItem>
        </SegmentedControl>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-3xl bg-background-primary-default p-2 shadow-card dark:bg-background-secondary-default" aria-label="Tempoh laporan">
        <IconButton label={jenis === "bulanan" ? "Bulan sebelum" : "Minggu sebelum"} onClick={() => setT(geser(t, -1))}>
          <RiArrowLeftSLine className="size-5" aria-hidden />
        </IconButton>
        <div className="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
          <span className="text-caption-1-regular text-text-tertiary">{jenis === "bulanan" ? "Bulan" : "Minggu (Isnin – Ahad)"}</span>
          <span className="text-body-semibold text-text-primary tabular-nums" aria-live="polite">
            {t.label}
          </span>
        </div>
        <IconButton label={jenis === "bulanan" ? "Bulan berikut" : "Minggu berikut"} onClick={() => setT(geser(t, 1))}>
          <RiArrowRightSLine className="size-5" aria-hidden />
        </IconButton>
        <div className="flex w-full items-center gap-2 border-t border-border-table pt-2 sm:w-auto sm:border-t-0 sm:border-l sm:pt-0 sm:pl-2">
          <input
            type={jenis === "bulanan" ? "month" : "date"}
            aria-label={jenis === "bulanan" ? "Pilih bulan" : "Pilih tarikh dalam minggu"}
            value={
              jenis === "bulanan"
                ? `${t.from.getFullYear()}-${pad(t.from.getMonth() + 1)}`
                : `${t.from.getFullYear()}-${pad(t.from.getMonth() + 1)}-${pad(t.from.getDate())}`
            }
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number)
              if (y && m) setT(tempoh(jenis, new Date(y, m - 1, d || 1)))
            }}
            className="h-8 min-w-0 flex-1 rounded-lg bg-background-tertiary-default px-2 text-body-regular text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring sm:flex-none"
          />
          <Button variant="secondary" size="small" onClick={() => setT(tempoh(jenis, new Date()))} disabled={isNow}>
            {jenis === "bulanan" ? "Bulan ini" : "Minggu ini"}
          </Button>
        </div>
      </section>

      {error && <p className="rounded-2xl bg-status-rose-background p-3 text-body-regular text-status-rose-text">{error}</p>}

      {loading ? (
        <PageLoader inline />
      ) : !canSurat && !canBayaran ? (
        <p className="rounded-2xl border border-border-table bg-background-primary-default p-6 text-center text-body-regular text-text-secondary">
          Tiada laporan yang boleh dimuat turun untuk akaun anda.
        </p>
      ) : (
        <div className="motion-stagger grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          {canSurat && (
            <ReportCard
              icon={RiMailOpenLine}
              title="Laporan Surat"
              caption={`Ikut tarikh surat${unitOnly ? ` · Unit ${unitOnly}` : ""}`}
              stats={[
                { label: "Surat", value: String(suratRows.length) },
                { label: "Masuk", value: String(suratRows.filter((s) => s.kategori === "MASUK").length) },
                { label: "Keluar", value: String(suratRows.filter((s) => s.kategori === "KELUAR").length) },
              ]}
              columns="Bil, Tarikh, Kategori, Perkara, Unit / PIC, Status"
              preview={suratRows.slice(0, PREVIEW).map((s) => ({ key: s.id, left: `#${s.bil}`, main: s.perkara, right: s.status }))}
              more={suratRows.length - PREVIEW}
              empty="Tiada surat dalam tempoh ini."
              busy={busy === "surat"}
              onDownload={() => download("surat")}
            />
          )}
          {canBayaran && (
            <ReportCard
              icon={RiBankCardLine}
              title="Laporan Rekod Bayaran"
              caption="Ikut tarikh terima"
              stats={[
                { label: "Rekod", value: String(bayaranRows.length) },
                { label: "Jumlah nilai", value: formatRM(jumlahNilai(bayaranRows)), wide: true },
              ]}
              columns="ID, Tarikh Terima, Daripada, Perkara, Nilai, Kontraktor, Status Bayaran"
              preview={bayaranRows.slice(0, PREVIEW).map((b) => ({ key: b.id, left: `#${b.ids ?? b.id}`, main: b.perkara, right: b.statusBayaran }))}
              more={bayaranRows.length - PREVIEW}
              empty="Tiada rekod bayaran dalam tempoh ini."
              busy={busy === "bayaran"}
              onDownload={() => download("bayaran")}
            />
          )}
        </div>
      )}
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="motion-press inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-foreground-icon-secondary outline-none hover:bg-background-secondary-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      {children}
    </button>
  )
}

function ReportCard({
  icon: Icon,
  title,
  caption,
  stats,
  columns,
  preview,
  more,
  empty,
  busy,
  onDownload,
}: {
  icon: RemixiconComponentType
  title: string
  caption: string
  stats: { label: string; value: string; wide?: boolean }[]
  columns: string
  preview: { key: string; left: string; main: string; right: string }[]
  more: number
  empty: string
  busy: boolean
  onDownload: () => void
}) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-background-primary-default p-4 shadow-card dark:bg-background-secondary-default">
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background-tertiary-default text-foreground-icon-secondary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-semibold text-text-primary">{title}</h2>
          <p className="text-caption-1-regular text-text-tertiary">{caption}</p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={cx("rounded-2xl bg-background-secondary-default px-3 py-2 dark:bg-background-primary-default", s.wide && "col-span-2")}>
            <dt className="text-caption-1-regular text-text-tertiary">{s.label}</dt>
            <dd className="truncate text-title-3-semibold text-text-primary tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {preview.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-table py-6 text-center text-body-regular text-text-tertiary">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-table rounded-2xl border border-border-table">
          {preview.map((row) => (
            <li key={row.key} className="flex items-center gap-2 px-3 py-2 text-body-regular">
              <span className="w-12 shrink-0 text-caption-1-medium text-text-tertiary tabular-nums">{row.left}</span>
              <span className="min-w-0 flex-1 truncate text-text-primary">{row.main || "-"}</span>
              <span className="shrink-0 text-caption-1-regular text-text-secondary">{row.right || "-"}</span>
            </li>
          ))}
          {more > 0 && <li className="px-3 py-2 text-caption-1-regular text-text-tertiary">+{more} lagi dalam PDF</li>}
        </ul>
      )}

      <p className="text-caption-2-regular text-text-tertiary">
        PDF A4 potret · Kolum: {columns} · Ruangan Disemak Oleh dan Disahkan Oleh di bawah
      </p>

      <Button
        size="small"
        leadingIcon={busy ? undefined : RiDownload2Line}
        onClick={onDownload}
        disabled={busy}
        className="w-full sm:ms-auto sm:w-auto"
      >
        {busy ? (
          <span className="inline-flex items-center gap-1.5">
            <RiLoader4Line className="size-4 animate-spin" aria-hidden />
            Menjana PDF…
          </span>
        ) : (
          "Muat turun PDF"
        )}
      </Button>
    </section>
  )
}
