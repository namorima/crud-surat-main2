"use client"

import { useMemo, useState } from "react"
import { RiDownload2Line, RiLoader4Line } from "@remixicon/react"
import { toast } from "sonner"
import type { Bayaran } from "@/types/bayaran"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/base/buttons/button"
import { FormField, dialogBodyClass, dialogFooterClass, dialogFrameClass, dialogHeaderClass } from "@/components/dashboard/form-field"
import { PERIOD_LABEL, type Period } from "@/lib/dashboard-stats"
import { SEMUA_KAWASAN, kawasanDalam } from "@/lib/laporan-dashboard"
import { cx } from "@/utils/cx"

/**
 * Dashboard → Bayaran as a PDF for one kawasan, or for all kawasan grouped
 * (summary, then one section per kawasan). Uses the Dashboard's period.
 */
export function DashboardPdfButton({ bayaran, period, dijanaOleh }: { bayaran: Bayaran[]; period: Period; dijanaOleh: string }) {
  const [open, setOpen] = useState(false)
  const [kawasan, setKawasan] = useState(SEMUA_KAWASAN)
  const [busy, setBusy] = useState(false)
  const kawasanList = useMemo(() => kawasanDalam(bayaran, period), [bayaran, period])
  const chosen = kawasan === SEMUA_KAWASAN || kawasanList.includes(kawasan) ? kawasan : SEMUA_KAWASAN

  const download = async () => {
    setBusy(true)
    try {
      // Nilai Kontrak for the "% Nilai Kontrak" column; the report works without it
      const info = await fetch("/api/bayaran-form-data")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data?.kontrakInfoByKawasan)
        .catch(() => undefined)
      const { laporanDashboardPdf } = await import("@/lib/laporan-dashboard")
      await laporanDashboardPdf(bayaran, { period, kawasan: chosen, dijanaOleh, kontrakInfoByKawasan: info })
      setOpen(false)
    } catch (error) {
      console.error("Dashboard PDF failed:", error)
      toast.error("Gagal menjana PDF. Sila cuba lagi.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="secondary" size="small" leadingIcon={RiDownload2Line} onClick={() => setOpen(true)} disabled={!bayaran.length}>
        PDF
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cx(dialogFrameClass, "sm:max-w-[440px]")}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">Muat turun Dashboard Bayaran</DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              PDF A4 potret untuk {PERIOD_LABEL[period].toLowerCase()}, ikut tarikh terima.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <FormField
              label="Kawasan"
              htmlFor="pdf-kawasan"
              hint={
                chosen === SEMUA_KAWASAN
                  ? `Ringkasan semua kawasan, kemudian satu bahagian bagi setiap kawasan (${kawasanList.length} kawasan).`
                  : "KPI, bayaran mengikut No Kontrak, kategori, status, umur tertunggak dan penerima bagi kawasan ini."
              }
            >
              <Select value={chosen} onValueChange={(value) => value && setKawasan(value)}>
                <SelectTrigger id="pdf-kawasan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEMUA_KAWASAN}>Semua kawasan (ikut kawasan)</SelectItem>
                  {kawasanList.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <footer className={dialogFooterClass}>
            <Button variant="secondary" size="small" onClick={() => setOpen(false)} disabled={busy} className="flex-1 sm:flex-none">
              Batal
            </Button>
            <Button size="small" leadingIcon={busy ? undefined : RiDownload2Line} onClick={download} disabled={busy} className="flex-1 sm:flex-none">
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                  Menjana…
                </span>
              ) : (
                "Muat turun PDF"
              )}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  )
}
