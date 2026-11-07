"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { RiArrowDownSLine, RiFileList3Line, RiFilter3Line, RiLoader4Line, RiMailLine, RiMoneyDollarCircleLine, RiRefreshLine, RiUser3Line } from "@remixicon/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { ACTION, Changes, formatWhen } from "@/components/dashboard/audit-dialog"
import type { AktivitiItem, AktivitiPage } from "@/types/audit"
import type { User } from "@/types/user"
import { cx } from "@/utils/cx"

const ALL = "semua"

type Filters = { jenis: string; aksi: string; user: string; dari: string; hingga: string }
const EMPTY: Filters = { jenis: ALL, aksi: ALL, user: ALL, dari: "", hingga: "" }

const JENIS_LABEL: Record<AktivitiItem["jenis"], string> = { surat: "Surat", bayaran: "Rekod Bayaran" }

/** "Surat #2391" / "Rekod Bayaran #286", linked to the record while it still exists. */
function RecordRef({ item }: { item: AktivitiItem }) {
  const Icon = item.jenis === "surat" ? RiMailLine : RiMoneyDollarCircleLine
  const label = `${JENIS_LABEL[item.jenis]} ${item.ref != null ? `#${item.ref}` : ""}`.trim()
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
      <span className="tabular-nums">{label}</span>
    </>
  )
  if (item.ref == null || item.action === "DELETE") {
    return <span className="inline-flex items-center gap-1.5 text-body-medium text-text-secondary">{content}</span>
  }
  const href = item.jenis === "surat" ? `/dashboard/surat?buka=${item.ref}` : `/dashboard/bayaran?buka=${item.ref}`
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md text-body-medium text-text-primary outline-none hover:text-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring"
      title={`Buka ${label}`}
    >
      {content}
    </Link>
  )
}

function ActionChip({ action }: { action: string }) {
  const info = ACTION[action] ?? { label: action, color: "neutral" as const }
  return (
    <Chip variant="caption" color={info.color}>
      {info.label}
    </Chip>
  )
}

/**
 * Pengguna → Aktiviti (admin and Super Admin only): who keyed, edited and
 * deleted surat and Rekod Bayaran, newest first, from GET /api/aktiviti.
 */
export function AktivitiLog({ users }: { users: User[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [items, setItems] = useState<AktivitiItem[] | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  const userOptions = useMemo(
    () => [...users].filter((u) => u.username).sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username)),
    [users],
  )

  const fetchPage = useCallback(
    async (sebelum?: string) => {
      const params = new URLSearchParams()
      if (filters.jenis !== ALL) params.set("jenis", filters.jenis)
      if (filters.aksi !== ALL) params.set("aksi", filters.aksi)
      if (filters.user !== ALL) params.set("user", filters.user)
      if (filters.dari) params.set("dari", filters.dari)
      if (filters.hingga) params.set("hingga", filters.hingga)
      if (sebelum) params.set("sebelum", sebelum)
      const response = await fetch(`/api/aktiviti?${params}`, { cache: "no-store" })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error || "Gagal memuatkan aktiviti")
      return body as AktivitiPage
    },
    [filters],
  )

  const reload = useCallback(async () => {
    setItems(null)
    setError("")
    setOpen(null)
    try {
      const page = await fetchPage()
      setItems(page.items)
      setNext(page.sebelum)
    } catch (e: any) {
      setError(e.message)
      setItems([])
    }
  }, [fetchPage])

  useEffect(() => {
    reload()
  }, [reload])

  const loadMore = async () => {
    if (!next) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(next)
      setItems((prev) => [...(prev || []), ...page.items])
      setNext(page.sebelum)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const set = (key: keyof Filters) => (value: string) => setFilters((prev) => ({ ...prev, [key]: value }))
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY)
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id))

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Aktiviti Pengguna</CardTitle>
          <CardDescription>Sejarah keyin, kemaskini dan padam Surat dan Rekod Bayaran. Yang terbaru di atas.</CardDescription>
        </div>
        <Button size="small" variant="secondary" leadingIcon={RiRefreshLine} onClick={reload} className="shrink-0 self-start">
          Muat semula
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center">
          <Select value={filters.user} onValueChange={set("user")}>
            <SelectTrigger aria-label="Tapis pengguna" className={cx("col-span-2 lg:w-56", filters.user !== ALL && "ring-border-button-active")}>
              <div className="flex min-w-0 items-center gap-1.5">
                <RiUser3Line className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                <span className="truncate">
                  <SelectValue />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua pengguna</SelectItem>
              {userOptions.map((u) => (
                <SelectItem key={u.username} value={u.username}>
                  {u.name || u.username} ({u.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.jenis} onValueChange={set("jenis")}>
            <SelectTrigger aria-label="Tapis jenis" className={cx("lg:w-44", filters.jenis !== ALL && "ring-border-button-active")}>
              <div className="flex min-w-0 items-center gap-1.5">
                <RiFileList3Line className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                <span className="truncate">
                  <SelectValue />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Surat & Bayaran</SelectItem>
              <SelectItem value="surat">Surat</SelectItem>
              <SelectItem value="bayaran">Rekod Bayaran</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.aksi} onValueChange={set("aksi")}>
            <SelectTrigger aria-label="Tapis aktiviti" className={cx("lg:w-44", filters.aksi !== ALL && "ring-border-button-active")}>
              <div className="flex min-w-0 items-center gap-1.5">
                <RiFilter3Line className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                <span className="truncate">
                  <SelectValue />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua aktiviti</SelectItem>
              <SelectItem value="CREATE">Dikeyin</SelectItem>
              <SelectItem value="UPDATE">Dikemaskini</SelectItem>
              <SelectItem value="DELETE">Dipadam</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex min-w-0 items-center gap-1.5 text-caption-1-regular text-text-tertiary">
            Dari
            <Input type="date" value={filters.dari} max={filters.hingga || undefined} onChange={(e) => set("dari")(e.target.value)} aria-label="Dari tarikh" className="min-w-0" />
          </label>
          <label className="flex min-w-0 items-center gap-1.5 text-caption-1-regular text-text-tertiary">
            Hingga
            <Input type="date" value={filters.hingga} min={filters.dari || undefined} onChange={(e) => set("hingga")(e.target.value)} aria-label="Hingga tarikh" className="min-w-0" />
          </label>
          {filtered && (
            <Button size="small" variant="ghost" onClick={() => setFilters(EMPTY)} className="col-span-2 justify-self-start lg:col-span-1">
              Kosongkan tapisan
            </Button>
          )}
        </div>

        {error && <p className="rounded-xl bg-notification-error-background p-3 text-body-regular text-notification-error-foreground">{error}</p>}

        {items === null ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan aktiviti...
          </div>
        ) : items.length === 0 ? (
          !error && <p className="py-10 text-center text-body-regular text-text-secondary">Tiada aktiviti{filtered ? " sepadan dengan tapisan" : ""}.</p>
        ) : (
          <>
            {/* iPad landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="relative overflow-x-auto">
                <table className="bui-table">
                  <thead>
                    <tr>
                      <th className="w-[148px]">Masa</th>
                      <th>Pengguna</th>
                      <th className="w-[130px]">Aktiviti</th>
                      <th>Surat / Rekod Bayaran</th>
                      <th>Butiran</th>
                      <th className="w-[44px]">
                        <span className="sr-only">Perubahan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <AktivitiRow key={item.id} item={item} open={open === item.id} onToggle={() => toggle(item.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones */}
            <ul className="flex flex-col gap-2 md:hidden">
              {items.map((item) => (
                <li key={item.id} className="rounded-2xl border border-border-table p-3">
                  <div className="flex items-start justify-between gap-2">
                    <RecordRef item={item} />
                    <ActionChip action={item.action} />
                  </div>
                  <p className="mt-1 text-body-medium text-text-primary">
                    {item.userName || "Tidak diketahui"}
                    {item.userId && <span className="ms-1 text-caption-1-regular text-text-tertiary">@{item.userId}</span>}
                  </p>
                  <p className="text-caption-1-regular text-text-tertiary tabular-nums">{formatWhen(item.createdAt)}</p>
                  {item.details && <p className="mt-1 text-caption-1-regular text-text-secondary">{item.details}</p>}
                  {item.changes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-expanded={open === item.id}
                      className="mt-1 inline-flex cursor-pointer items-center gap-1 text-caption-1-medium text-accent-600"
                    >
                      {open === item.id ? "Sembunyi perubahan" : `Lihat ${item.changes.length} medan`}
                    </button>
                  )}
                  {open === item.id && <Changes entry={item} />}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-caption-1-regular text-text-tertiary tabular-nums">{items.length} aktiviti dipaparkan</span>
              {next && (
                <Button size="small" variant="secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Memuatkan..." : "Muat lagi"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function AktivitiRow({ item, open, onToggle }: { item: AktivitiItem; open: boolean; onToggle: () => void }) {
  const hasChanges = item.changes.length > 0
  return (
    <>
      <tr>
        <td className="whitespace-nowrap tabular-nums text-text-secondary">{formatWhen(item.createdAt)}</td>
        <td>
          <span className="block text-body-medium text-text-primary">{item.userName || "Tidak diketahui"}</span>
          {item.userId && <span className="text-caption-1-regular text-text-tertiary">@{item.userId}</span>}
        </td>
        <td>
          <ActionChip action={item.action} />
        </td>
        <td>
          <RecordRef item={item} />
        </td>
        <td className="text-text-secondary">{item.details || "-"}</td>
        <td>
          {hasChanges && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-label={open ? "Sembunyi perubahan" : "Lihat perubahan"}
              title={open ? "Sembunyi perubahan" : "Lihat perubahan"}
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-foreground-icon-secondary outline-none hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              <RiArrowDownSLine className={cx("size-4.5 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="pt-0">
            <Changes entry={item} />
          </td>
        </tr>
      )}
    </>
  )
}
