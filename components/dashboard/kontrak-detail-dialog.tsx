"use client"

import { useMemo } from "react"
import type { Bayaran } from "@/types/bayaran"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { dialogBodyClass, dialogFooterClass, dialogFrameClass, dialogHeaderClass } from "@/components/dashboard/form-field"
import { formatRM, isPaid, kontrakDetail, parseAmount, type KontrakRow } from "@/lib/dashboard-stats"
import { cx } from "@/utils/cx"

export type KontrakInfo = { kerja: string; nilaiKontrak: number | null; wcp?: number | null }

const rm = (n: number) => formatRM(n)

/**
 * Dashboard → Bayaran mengikut No Kontrak → a bar: every bayaran of that kontrak
 * (any period), with Bayaran Ke, Jenis, Nilai and Wang Tahanan, the totals, and
 * Peratus Bayaran = kemajuan incl. wang tahanan (not WCP) / Nilai Kontrak.
 */
export function KontrakDetailDialog({
  row,
  bayaran,
  info,
  onClose,
}: {
  row: KontrakRow | null
  bayaran: Bayaran[]
  info?: KontrakInfo
  onClose: () => void
}) {
  const detail = useMemo(() => (row ? kontrakDetail(bayaran, row.kawasan, row.noKontrak) : null), [row, bayaran])
  const nilaiKontrak = info?.nilaiKontrak ?? null
  const peratus = detail && nilaiKontrak ? (detail.kemajuan / nilaiKontrak) * 100 : null

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cx(dialogFrameClass, "sm:max-w-4xl")}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="pr-8 text-headline-semibold text-text-primary">No Kontrak {row?.noKontrak}</DialogTitle>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {[row?.kawasan, row?.kontraktor].filter(Boolean).join(" · ")}
            {info?.kerja && <span className="block">{info.kerja}</span>}
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className={cx(dialogBodyClass, "gap-4")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tile label="Nilai Kontrak" value={nilaiKontrak === null ? "-" : rm(nilaiKontrak)} />
              <Tile label="Nilai WCP (kontrak)" value={info?.wcp == null ? "-" : rm(info.wcp)} />
              <Tile label="Kemajuan + Wang Tahanan" value={rm(detail.kemajuan)} sub="Tidak termasuk WCP" />
              <Tile
                label="Peratus Bayaran"
                value={peratus === null ? "-" : `${peratus.toFixed(1)}%`}
                sub={peratus === null ? "Nilai Kontrak belum diisi" : undefined}
                danger={peratus !== null && peratus > 100}
              />
            </div>
            {peratus !== null && (
              <div className="h-2 overflow-hidden rounded-full bg-[var(--viz-track)]" aria-hidden>
                <div
                  className={cx("motion-bar h-full", peratus > 100 && "bg-[var(--viz-2)]")}
                  style={{ width: `${Math.min(100, peratus)}%`, background: peratus > 100 ? undefined : "var(--viz-1)" }}
                />
              </div>
            )}

            {/* md+: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <table className="w-full text-body-regular">
                <thead className="bg-background-secondary-default text-caption-1-medium text-text-secondary dark:bg-background-primary-default">
                  <tr>
                    <th className="px-3 py-2 text-start">ID</th>
                    <th className="px-3 py-2 text-start">Tarikh Terima</th>
                    <th className="px-3 py-2 text-start">Bayaran Ke</th>
                    <th className="px-3 py-2 text-start">Jenis Bayaran</th>
                    <th className="px-3 py-2 text-end">Nilai</th>
                    <th className="px-3 py-2 text-end">Wang Tahanan</th>
                    <th className="px-3 py-2 text-start">Status</th>
                  </tr>
                </thead>
                <tbody className="motion-stagger divide-y divide-border-table">
                  {detail.rows.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2 tabular-nums text-text-secondary">#{b.ids ?? "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{b.tarikhTerima || "-"}</td>
                      <td className="px-3 py-2">{b.bayaranKe || "-"}</td>
                      <td className="px-3 py-2">{b.jenisBayaran ? <JenisChip jenis={b.jenisBayaran} /> : <span className="text-text-tertiary">-</span>}</td>
                      <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">{rm(parseAmount(b.nilaiBayaran))}</td>
                      <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">
                        {b.wangTahanan ? rm(parseAmount(b.wangTahanan)) : <span className="text-text-tertiary">-</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <PaidChip b={b} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border-table bg-background-secondary-default text-body-semibold dark:bg-background-primary-default">
                  <tr>
                    <td className="px-3 py-2" colSpan={4}>
                      Jumlah ({detail.rows.length} rekod)
                    </td>
                    <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">{rm(detail.jumlahNilai)}</td>
                    <td className="px-3 py-2 text-end whitespace-nowrap tabular-nums">{rm(detail.jumlahWangTahanan)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Phones: cards */}
            <ul className="motion-stagger flex flex-col gap-2 md:hidden">
              {detail.rows.map((b) => (
                <li key={b.id} className="flex flex-col gap-1 rounded-2xl border border-border-button-default p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-caption-1-medium text-text-secondary tabular-nums">
                      #{b.ids ?? "-"} · {b.tarikhTerima || "-"}
                    </span>
                    <PaidChip b={b} />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-body-regular">
                      {b.jenisBayaran && <JenisChip jenis={b.jenisBayaran} />}
                      {b.bayaranKe && <span className="text-text-secondary">Bayaran ke-{b.bayaranKe}</span>}
                    </span>
                    <span className="text-body-semibold tabular-nums">{rm(parseAmount(b.nilaiBayaran))}</span>
                  </div>
                  {b.wangTahanan && (
                    <span className="text-caption-1-regular text-text-secondary tabular-nums">
                      Wang Tahanan {rm(parseAmount(b.wangTahanan))}
                    </span>
                  )}
                </li>
              ))}
              <li className="flex flex-col gap-0.5 rounded-2xl bg-background-secondary-default p-3 text-body-semibold dark:bg-background-primary-default">
                <span className="flex justify-between gap-2">
                  <span>Jumlah ({detail.rows.length} rekod)</span>
                  <span className="tabular-nums">{rm(detail.jumlahNilai)}</span>
                </span>
                <span className="flex justify-between gap-2 text-caption-1-regular text-text-secondary">
                  <span>Wang Tahanan</span>
                  <span className="tabular-nums">{rm(detail.jumlahWangTahanan)}</span>
                </span>
              </li>
            </ul>

            <dl className="grid gap-1 text-caption-1-regular text-text-secondary">
              <div className="flex justify-between gap-2">
                <dt>Jumlah WCP dibayar</dt>
                <dd className="tabular-nums">{rm(detail.jumlahWcp)}</dd>
              </div>
              <p className="text-caption-2-regular text-text-tertiary">
                Semua rekod kontrak ini (tidak ikut tempoh Dashboard), rekod batal tidak dikira. Peratus Bayaran = Nilai Bayaran +
                Wang Tahanan bagi semua bayaran kecuali WCP dan Wang Tahanan (pelepasan), dibahagi Nilai Kontrak.
              </p>
            </dl>
          </div>
        )}

        <footer className={dialogFooterClass}>
          <Button variant="secondary" size="small" onClick={onClose} className="flex-1 sm:flex-none">
            Tutup
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function Tile({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-background-secondary-default p-3 dark:bg-background-primary-default">
      <span className="text-caption-1-medium text-text-tertiary">{label}</span>
      <span className={cx("text-body-semibold tabular-nums text-text-primary [overflow-wrap:anywhere]", danger && "text-text-destructive")}>{value}</span>
      {sub && <span className="text-caption-2-regular text-text-tertiary">{sub}</span>}
    </div>
  )
}

function JenisChip({ jenis }: { jenis: string }) {
  return (
    <Chip variant="caption" color={jenis === "WCP" ? "orange" : jenis === "WANG TAHANAN" ? "purple" : "blue"}>
      {jenis}
    </Chip>
  )
}

function PaidChip({ b }: { b: Bayaran }) {
  return isPaid(b) ? (
    <Chip variant="caption" color="lime">
      Dibayar
    </Chip>
  ) : (
    <Chip variant="caption" color="gray">
      {b.statusBayaran || "Belum"}
    </Chip>
  )
}
