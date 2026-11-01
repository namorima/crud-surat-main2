"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiRefreshLine, RiSearchLine } from "@remixicon/react"
import type { Kontrak, KontrakInput, KontrakStatus } from "@/types/kontrak"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Chip } from "@/components/base/badges/chip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RowActions } from "@/components/dashboard/row-actions"
import { bayaranKategoriChip } from "@/lib/ui-status"
import { cx } from "@/utils/cx"
import { JENIS_KERJA, KONTRAK_KATEGORI, KONTRAK_STATUS, parseNilai, tahunFromTarikh } from "@/lib/kontrak-input"
import { FormField, dialogBodyClass, dialogFooterClass, dialogFrameClass, dialogHeaderClass } from "@/components/dashboard/form-field"
import { KontraktorFormDialog } from "@/components/tetapan/KontraktorManager"

/** The form keeps nilai as typed text; the server parses it. */
type KontrakForm = Omit<KontrakInput, "nilaiKontrak" | "wcp"> & { nilaiKontrak: string; wcp: string }

const formatNilai = (value: number) =>
  value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const EMPTY: KontrakForm = {
  kawasan: "",
  noKontrak: "",
  noPo: "",
  kategori: "",
  namaKontraktor: "",
  tarikhMula: "",
  tarikhAkhir: "",
  jenisKerja: "",
  kerja: "",
  nilaiKontrak: "",
  wcp: "",
  status: "AKTIF",
}

/** Only AKTIF contracts are offered in Tambah Rekod Bayaran, so only the others get a chip. */
function StatusChip({ status }: { status: KontrakStatus }) {
  if (status === "AKTIF") return null
  return (
    <Chip variant="caption" color={status === "SELESAI" ? "blue" : "gray"}>
      {status === "SELESAI" ? "Selesai" : "Tidak aktif"}
    </Chip>
  )
}

/** The Status filter survives reloads (per browser). */
const STATUS_FILTER_KEY = "tetapan:kontrak:status"
const STATUS_FILTERS: readonly (KontrakStatus | "ALL")[] = ["ALL", ...KONTRAK_STATUS]

/** Radix Select cannot hold "", so an unset optional field uses this value. */
const NONE = "__none"

/** A titled group of fields in the Tambah / Edit Kontrak form. */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-table p-3 sm:p-4">
      <h3 className="text-body-semibold text-text-primary">{title}</h3>
      {children}
    </section>
  )
}

/** An RM amount typed as text; tidied to "1,234.50" when the field is left. */
function RmInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-body-medium text-text-tertiary">RM</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const n = parseNilai(value)
          if (n !== null && !Number.isNaN(n)) onChange(formatNilai(n))
        }}
        placeholder="0.00"
        className="pl-9 tabular-nums"
      />
    </div>
  )
}

/** YYYY-MM-DD → DD/MM/YYYY for display. */
function formatTarikh(value: string) {
  const [year, month, day] = value.split("-")
  return value && day ? `${day}/${month}/${year}` : ""
}

function Tempoh({ item }: { item: Kontrak }) {
  if (!item.tarikhMula && !item.tarikhAkhir) return <span className="text-text-tertiary">-</span>
  return (
    <span className="tabular-nums">
      {formatTarikh(item.tarikhMula) || "?"} – {formatTarikh(item.tarikhAkhir) || "?"}
    </span>
  )
}

/** Same order as GET /api/kontrak (kawasan, then no kontrak). */
function sortKontrak(list: Kontrak[]) {
  return [...list].sort((a, b) => a.kawasan.localeCompare(b.kawasan) || a.noKontrak.localeCompare(b.noKontrak))
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return body.error || fallback
  } catch {
    return fallback
  }
}

/** Tetapan → Kontrak: the kontrak table that drives No Kontrak options and Nama Kontraktor on Bayaran. */
export function KontrakManager({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<Kontrak[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  // AKTIF by default; a choice the user made is kept (localStorage)
  const [statusFilter, setStatusFilter] = useState<KontrakStatus | "ALL">("AKTIF")
  // Restore the saved Status filter once in the browser (localStorage may be blocked)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATUS_FILTER_KEY) as KontrakStatus | "ALL" | null
      if (saved && STATUS_FILTERS.includes(saved)) setStatusFilter(saved)
    } catch {}
  }, [])
  const changeStatusFilter = (value: KontrakStatus | "ALL") => {
    setStatusFilter(value)
    try {
      localStorage.setItem(STATUS_FILTER_KEY, value)
    } catch {}
  }
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kontrak | null>(null)
  const [form, setForm] = useState<KontrakForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Kontrak | null>(null)
  const [kontraktorNames, setKontraktorNames] = useState<string[]>([])
  // Tambah Kontraktor opened from the Nama Kontraktor field, on top of this form
  const [kontraktorFormOpen, setKontraktorFormOpen] = useState(false)

  // Nama Kontraktor choices come from Tetapan → Kontraktor; refreshed each time the form opens.
  const loadKontraktorNames = async () => {
    try {
      const response = await fetch("/api/kontraktor")
      if (!response.ok) throw new Error(await readError(response, "Gagal memuatkan senarai kontraktor"))
      const list: { namaKontraktor: string }[] = await response.json()
      setKontraktorNames(list.map((item) => item.namaKontraktor))
    } catch (error: any) {
      toast.error(error.message)
    }
  }
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/kontrak")
      if (!response.ok) throw new Error(await readError(response, "Gagal memuatkan kontrak"))
      setItems(await response.json())
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const kawasanOptions = useMemo(() => [...new Set(items.map((item) => item.kawasan).filter(Boolean))].sort(), [items])
  // The fixed list, plus an older value on the row being edited so it is not silently dropped.
  // Keep a name that is not (yet) in the Kontraktor list selectable on the row being edited.
  const namaOptions = useMemo(
    () => (form.namaKontraktor && !kontraktorNames.includes(form.namaKontraktor) ? [form.namaKontraktor, ...kontraktorNames] : kontraktorNames),
    [form.namaKontraktor, kontraktorNames],
  )

  const kategoriOptions = useMemo(
    () => (form.kategori && !(KONTRAK_KATEGORI as readonly string[]).includes(form.kategori) ? [...KONTRAK_KATEGORI, form.kategori] : [...KONTRAK_KATEGORI]),
    [form.kategori],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byStatus = statusFilter === "ALL" ? items : items.filter((item) => item.status === statusFilter)
    if (!q) return byStatus
    return byStatus.filter((item) =>
      [item.kawasan, item.noKontrak, item.noPo, item.kategori, item.namaKontraktor, item.kerja, item.jenisKerja, String(item.tahunKontrak ?? ""), String(item.nilaiKontrak ?? "")].some(
        (value) => value.toLowerCase().includes(q),
      ),
    )
  }, [items, query, statusFilter])

  const openAdd = () => {
    loadKontraktorNames()
    setEditing(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (item: Kontrak) => {
    loadKontraktorNames()
    setEditing(item)
    setForm({
      kawasan: item.kawasan,
      noKontrak: item.noKontrak,
      noPo: item.noPo,
      kategori: item.kategori,
      namaKontraktor: item.namaKontraktor,
      tarikhMula: item.tarikhMula,
      tarikhAkhir: item.tarikhAkhir,
      jenisKerja: item.jenisKerja,
      kerja: item.kerja,
      nilaiKontrak: item.nilaiKontrak === null ? "" : formatNilai(item.nilaiKontrak),
      wcp: item.wcp === null ? "" : formatNilai(item.wcp),
      status: item.status,
    })
    setFormOpen(true)
  }

  const setField = (field: keyof KontrakForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kawasan.trim() || !form.noKontrak.trim()) {
      toast.error("Kawasan dan No Kontrak wajib diisi")
      return
    }
    if (form.tarikhMula && form.tarikhAkhir && form.tarikhAkhir < form.tarikhMula) {
      toast.error("Tarikh Akhir tidak boleh sebelum Tarikh Mula")
      return
    }
    if (Number.isNaN(parseNilai(form.nilaiKontrak))) {
      toast.error("Nilai kontrak tidak sah (contoh: 125000.00)")
      return
    }
    if (Number.isNaN(parseNilai(form.wcp))) {
      toast.error("Nilai WCP tidak sah (contoh: 6250.00)")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/kontrak/${editing.id}` : "/api/kontrak", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menyimpan kontrak"))
      const { kontrak: saved, bayaranUpdated } = (await response.json()) as { kontrak: Kontrak; bayaranUpdated: number }
      // Apply the save locally instead of reloading the list: rows of the same
      // kawasan and no kontrak take its contractor name and status, as the server did
      setItems((prev) =>
        sortKontrak([
          ...prev
            .filter((item) => item.id !== saved.id)
            .map((item) =>
              item.noKontrak !== saved.noKontrak || item.kawasan !== saved.kawasan
                ? item
                : editing
                  ? { ...item, namaKontraktor: saved.namaKontraktor, status: saved.status }
                  : // A new row only renames its siblings when it names a contractor
                    { ...item, namaKontraktor: saved.namaKontraktor || item.namaKontraktor },
            ),
          saved,
        ]),
      )
      toast.success(editing ? "Kontrak dikemas kini" : "Kontrak ditambah", {
        description: bayaranUpdated > 0 ? `${bayaranUpdated} rekod bayaran dikemas kini dengan nama kontraktor ini.` : undefined,
      })
      setFormOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      const response = await fetch(`/api/kontrak/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Gagal memadam kontrak"))
      toast.success(`Kontrak ${deleting.noKontrak} dipadam`)
      setItems((prev) => prev.filter((item) => item.id !== deleting.id))
      setDeleting(null)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const syncAll = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/kontrak/sync", { method: "POST" })
      if (!response.ok) throw new Error(await readError(response, "Gagal mengemas kini rekod bayaran"))
      const { bayaranUpdated } = (await response.json()) as { bayaranUpdated: number }
      toast.success(`${bayaranUpdated} rekod bayaran dikemas kini`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Kontrak & Kontraktor</CardTitle>
          <CardDescription>
            No Kontrak dan Nama Kontraktor yang dipilih dalam borang Bayaran. Menukar nama kontraktor turut mengemas kini
            rekod bayaran sedia ada.
          </CardDescription>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={syncAll} disabled={syncing} title="Salin semula nama kontraktor ke semua rekod bayaran">
              {syncing ? <RiLoader4Line className="animate-spin" /> : <RiRefreshLine />}
              <span className="hidden sm:inline">Kemas kini Bayaran</span>
            </Button>
            <Button size="sm" onClick={openAdd}>
              <RiAddLine />
              Tambah Kontrak
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari no kontrak, no PO, kerja, kontraktor, kawasan atau tahun…"
              className="pl-8"
              aria-label="Cari kontrak"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => value && changeStatusFilter(value as KontrakStatus | "ALL")}>
            <SelectTrigger className="w-[148px] shrink-0 sm:w-[160px]" aria-label="Tapis status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              {KONTRAK_STATUS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {items.length === 0 ? "Tiada kontrak lagi" : "Tiada kontrak sepadan dengan carian atau status"}
          </p>
        ) : (
          <>
            {/* Desktop only: with the sidebar, the table needs ~1000px */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table xl:block">
              {/* No inner vertical scroll: a nested scroll area traps touch scrolling on iPad; the page scrolls */}
              <div className="relative overflow-x-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>
                        No Kontrak
                        <span className="block text-caption-1-regular">Kawasan · No PO</span>
                      </th>
                      <th className="min-w-[200px]">
                        Kerja
                        <span className="block text-caption-1-regular">Jenis Kerja</span>
                      </th>
                      <th>Kategori</th>
                      <th>Nama Kontraktor</th>
                      <th className="text-end!">Nilai</th>
                      <th>
                        Tempoh
                        <span className="block text-caption-1-regular">Tahun</span>
                      </th>
                      {canEdit && (
                        <th className="w-[56px]">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((item) => (
                      <tr key={item.id} className={cx("hover:bg-background-secondary-default", item.status !== "AKTIF" && "text-text-secondary")}>
                        <td>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-body-semibold">{item.noKontrak}</span>
                            <StatusChip status={item.status} />
                          </span>
                          <span className="block text-caption-1-regular text-text-tertiary">
                            {item.kawasan}
                            {item.noPo && <> · PO {item.noPo}</>}
                          </span>
                        </td>
                        <td className="max-w-[320px]">
                          {item.kerja ? (
                            <span className="line-clamp-2" title={item.kerja}>
                              {item.kerja}
                            </span>
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
                          {item.jenisKerja && <span className="block text-caption-1-regular text-text-tertiary">{item.jenisKerja}</span>}
                        </td>
                        <td>
                          {item.kategori ? (
                            <Chip variant="caption" color={bayaranKategoriChip(item.kategori)}>
                              {item.kategori}
                            </Chip>
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
                        </td>
                        <td>{item.namaKontraktor || <span className="text-text-tertiary">-</span>}</td>
                        <td className="whitespace-nowrap text-end text-body-semibold tabular-nums">
                          {item.nilaiKontrak === null ? <span className="font-normal text-text-tertiary">-</span> : `RM ${formatNilai(item.nilaiKontrak)}`}
                          {item.wcp !== null && (
                            <span className="block text-caption-1-regular font-normal text-text-tertiary">WCP RM {formatNilai(item.wcp)}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-text-secondary">
                          <Tempoh item={item} />
                          {item.tahunKontrak && (
                            <span className="block text-caption-1-regular text-text-tertiary">Tahun {item.tahunKontrak}</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="text-end">
                            <RowActions
                              actions={[
                                { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(item) },
                                { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(item), danger: true },
                              ]}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones and iPads */}
            <ul className="motion-stagger grid grid-cols-1 gap-2 md:grid-cols-2 xl:hidden">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="min-w-0 text-body-semibold text-text-primary [overflow-wrap:anywhere]">{item.noKontrak}</span>
                      {item.kategori && (
                        <Chip variant="caption" color={bayaranKategoriChip(item.kategori)}>
                          {item.kategori}
                        </Chip>
                      )}
                      <StatusChip status={item.status} />
                    </div>
                    {/* The amount drops under the name when both do not fit */}
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span className="min-w-0 flex-1 basis-40 line-clamp-2 text-body-medium text-text-primary [overflow-wrap:anywhere]">
                        {item.namaKontraktor || "-"}
                      </span>
                      {item.nilaiKontrak !== null && (
                        <span className="shrink-0 text-body-semibold text-text-primary tabular-nums">RM {formatNilai(item.nilaiKontrak)}</span>
                      )}
                    </div>
                    {item.kerja && <span className="line-clamp-2 text-body-regular text-text-secondary">{item.kerja}</span>}
                    <span className="truncate text-caption-1-regular text-text-tertiary">
                      {[item.kawasan, item.noPo && `PO ${item.noPo}`, item.jenisKerja, item.wcp !== null && `WCP RM ${formatNilai(item.wcp)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {(item.tarikhMula || item.tarikhAkhir) && (
                      <span className="text-caption-1-regular text-text-secondary">
                        <Tempoh item={item} />
                        {item.tahunKontrak && <span className="text-text-tertiary"> · Tahun {item.tahunKontrak}</span>}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <RowActions
                      className="-me-1.5 size-7"
                      actions={[
                        { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(item) },
                        { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(item), danger: true },
                      ]}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">Jumlah: {items.length} kontrak</p>
      </CardFooter>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        {/* Fixed size on desktop (the body scrolls), a full-width sheet on phones.
            From md: Maklumat Kontrak on the left, Nilai & Tempoh over Kerja & Kontraktor on the right */}
        <DialogContent
          className={cx(
            dialogFrameClass,
            "max-h-[92dvh] sm:h-[min(680px,90dvh)] sm:w-[680px] sm:max-w-[calc(100vw-2rem)] md:h-[min(720px,90dvh)] md:w-[960px]",
          )}
        >
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">{editing ? "Edit Kontrak" : "Tambah Kontrak"}</DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editing
                ? "Nama kontraktor yang baru akan disalin ke rekod bayaran kawasan ini dengan No Kontrak ini."
                : "Kontrak baru akan muncul dalam pilihan No Kontrak di borang Bayaran."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className={cx(dialogBodyClass, "gap-4 md:grid md:grid-cols-2 md:items-start")}>
              <FormSection title="Maklumat Kontrak">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Kawasan" htmlFor="kontrak-kawasan" required>
                    <Input id="kontrak-kawasan" list="kontrak-kawasan-options" value={form.kawasan} onChange={setField("kawasan")} required />
                    <datalist id="kontrak-kawasan-options">
                      {kawasanOptions.map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </FormField>
                  <FormField
                    label="Status"
                    htmlFor="kontrak-status"
                    hint={form.status !== "AKTIF" ? "Tidak dipaparkan di Tambah Rekod Bayaran; rekod sedia ada tidak berubah." : undefined}
                  >
                    <Select value={form.status} onValueChange={(value) => value && setForm((prev) => ({ ...prev, status: value as KontrakStatus }))}>
                      <SelectTrigger id="kontrak-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KONTRAK_STATUS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="No Kontrak" htmlFor="kontrak-no" required>
                    <Input id="kontrak-no" value={form.noKontrak} onChange={setField("noKontrak")} required />
                  </FormField>
                  <FormField label="No Purchase Order (PO)" htmlFor="kontrak-po">
                    <Input id="kontrak-po" value={form.noPo} onChange={setField("noPo")} placeholder="Pilihan" autoComplete="off" />
                  </FormField>
                  <FormField label="Kategori" htmlFor="kontrak-kategori">
                    <Select
                      value={form.kategori || NONE}
                      onValueChange={(value) => value && setForm((prev) => ({ ...prev, kategori: value === NONE ? "" : value }))}
                    >
                      <SelectTrigger id="kontrak-kategori">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Tiada</SelectItem>
                        {kategoriOptions.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Jenis Kerja" htmlFor="kontrak-jenis">
                    <Select
                      value={form.jenisKerja || NONE}
                      onValueChange={(value) => value && setForm((prev) => ({ ...prev, jenisKerja: value === NONE ? "" : value }))}
                    >
                      <SelectTrigger id="kontrak-jenis">
                        <SelectValue placeholder="Pilih jenis kerja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Tiada</SelectItem>
                        {JENIS_KERJA.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </FormSection>

              <div className="flex flex-col gap-4">
                <FormSection title="Nilai & Tempoh">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Nilai Kontrak" htmlFor="kontrak-nilai" className="col-span-2 sm:col-span-1">
                      <RmInput id="kontrak-nilai" value={form.nilaiKontrak} onChange={(value) => setForm((prev) => ({ ...prev, nilaiKontrak: value }))} />
                    </FormField>
                    <FormField label="Wang Cagaran Prestasi (WCP)" htmlFor="kontrak-wcp" className="col-span-2 sm:col-span-1">
                      <RmInput id="kontrak-wcp" value={form.wcp} onChange={(value) => setForm((prev) => ({ ...prev, wcp: value }))} />
                    </FormField>
                    <FormField label="Tarikh Mula" htmlFor="kontrak-mula">
                      <Input id="kontrak-mula" type="date" value={form.tarikhMula} onChange={setField("tarikhMula")} />
                    </FormField>
                    <FormField label="Tarikh Akhir" htmlFor="kontrak-akhir">
                      <Input
                        id="kontrak-akhir"
                        type="date"
                        min={form.tarikhMula || undefined}
                        value={form.tarikhAkhir}
                        onChange={setField("tarikhAkhir")}
                      />
                    </FormField>
                    <FormField label="Tahun Kontrak" htmlFor="kontrak-tahun" hint="Daripada Tarikh Mula">
                      <Input id="kontrak-tahun" value={tahunFromTarikh(form.tarikhMula) ?? ""} placeholder="Auto" readOnly tabIndex={-1} />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="Kerja & Kontraktor">
                  <FormField label="Kerja" htmlFor="kontrak-kerja">
                    <Textarea
                      id="kontrak-kerja"
                      rows={2}
                      value={form.kerja}
                      onChange={setField("kerja")}
                      placeholder="Contoh: Kerja Mengangkut BTS Di Ladang …"
                      className="min-h-[60px]"
                    />
                  </FormField>
                  <FormField
                    label="Nama Kontraktor"
                    htmlFor="kontrak-nama"
                    hint={
                      <span className="inline-flex flex-wrap items-center gap-x-1">
                        Tiada dalam senarai?
                        <button
                          type="button"
                          onClick={() => setKontraktorFormOpen(true)}
                          className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm font-medium text-accent-600 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring dark:text-accent-400"
                        >
                          <RiAddLine className="size-3.5" aria-hidden />
                          Tambah kontraktor baru
                        </button>
                      </span>
                    }
                  >
                    <Select
                      value={form.namaKontraktor || NONE}
                      onValueChange={(value) => value && setForm((prev) => ({ ...prev, namaKontraktor: value === NONE ? "" : value }))}
                    >
                      <SelectTrigger id="kontrak-nama">
                        <SelectValue placeholder="Pilih kontraktor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Tiada</SelectItem>
                        {namaOptions.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormSection>
              </div>
            </div>
            <footer className={dialogFooterClass}>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                {saving && <RiLoader4Line className="animate-spin" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>

      {/* Outside the kontrak <form>, so saving a contractor never submits the kontrak */}
      <KontraktorFormDialog
        open={kontraktorFormOpen}
        onOpenChange={setKontraktorFormOpen}
        onSaved={(kontraktor) => {
          setKontraktorNames((prev) =>
            prev.includes(kontraktor.namaKontraktor) ? prev : [...prev, kontraktor.namaKontraktor].sort((a, b) => a.localeCompare(b)),
          )
          // The new contractor is picked for this kontrak
          setForm((prev) => ({ ...prev, namaKontraktor: kontraktor.namaKontraktor }))
        }}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam kontrak {deleting?.noKontrak}?</AlertDialogTitle>
            <AlertDialogDescription>
              Kontrak ini tidak lagi muncul dalam borang Bayaran. Rekod bayaran sedia ada kekal dengan nama kontraktor yang
              sudah disimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-button-danger">
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
