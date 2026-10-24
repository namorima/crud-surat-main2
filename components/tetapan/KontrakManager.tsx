"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiRefreshLine, RiSearchLine } from "@remixicon/react"
import type { Kontrak, KontrakInput } from "@/types/kontrak"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { JENIS_KERJA, KONTRAK_KATEGORI, tahunFromTarikh } from "@/lib/kontrak-input"

const EMPTY: KontrakInput = {
  kawasan: "",
  noKontrak: "",
  kategori: "",
  namaKontraktor: "",
  tarikhMula: "",
  tarikhAkhir: "",
  jenisKerja: "",
  kerja: "",
}

/** Radix Select cannot hold "", so an unset optional field uses this value. */
const NONE = "__none"

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
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kontrak | null>(null)
  const [form, setForm] = useState<KontrakInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Kontrak | null>(null)
  const [kontraktorNames, setKontraktorNames] = useState<string[]>([])

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
    if (!q) return items
    return items.filter((item) =>
      [item.kawasan, item.noKontrak, item.kategori, item.namaKontraktor, item.kerja, item.jenisKerja, String(item.tahunKontrak ?? "")].some(
        (value) => value.toLowerCase().includes(q),
      ),
    )
  }, [items, query])

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
      kategori: item.kategori,
      namaKontraktor: item.namaKontraktor,
      tarikhMula: item.tarikhMula,
      tarikhAkhir: item.tarikhAkhir,
      jenisKerja: item.jenisKerja,
      kerja: item.kerja,
    })
    setFormOpen(true)
  }

  const setField = (field: keyof KontrakInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/kontrak/${editing.id}` : "/api/kontrak", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menyimpan kontrak"))
      const { bayaranUpdated } = (await response.json()) as { bayaranUpdated: number }
      toast.success(editing ? "Kontrak dikemas kini" : "Kontrak ditambah", {
        description: bayaranUpdated > 0 ? `${bayaranUpdated} rekod bayaran dikemas kini dengan nama kontraktor ini.` : undefined,
      })
      setFormOpen(false)
      await load()
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
      setDeleting(null)
      await load()
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
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari no kontrak, kerja, kontraktor, kawasan atau tahun…"
            className="pl-8"
            aria-label="Cari kontrak"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {items.length === 0 ? "Tiada kontrak lagi" : "Tiada kontrak sepadan dengan carian"}
          </p>
        ) : (
          <>
            {/* Desktop only: with the sidebar, the table needs ~1000px */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table xl:block">
              <div className="relative max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>
                        No Kontrak
                        <span className="block text-caption-1-regular">Kawasan</span>
                      </th>
                      <th className="min-w-[200px]">Kerja</th>
                      <th>Kategori</th>
                      <th>Nama Kontraktor</th>
                      <th>Jenis Kerja</th>
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
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-background-secondary-default">
                        <td>
                          <span className="block text-body-semibold">{item.noKontrak}</span>
                          <span className="block text-caption-1-regular text-text-tertiary">{item.kawasan}</span>
                        </td>
                        <td className="max-w-[320px]">
                          {item.kerja ? (
                            <span className="line-clamp-2" title={item.kerja}>
                              {item.kerja}
                            </span>
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
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
                        <td className="text-text-secondary">{item.jenisKerja || <span className="text-text-tertiary">-</span>}</td>
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
            <ul className="grid gap-2 md:grid-cols-2 xl:hidden">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-body-semibold text-text-primary">{item.noKontrak}</span>
                      {item.kategori && (
                        <Chip variant="caption" color={bayaranKategoriChip(item.kategori)}>
                          {item.kategori}
                        </Chip>
                      )}
                    </div>
                    <span className="truncate text-body-medium text-text-primary">{item.namaKontraktor || "-"}</span>
                    {item.kerja && <span className="line-clamp-2 text-body-regular text-text-secondary">{item.kerja}</span>}
                    <span className="truncate text-caption-1-regular text-text-tertiary">
                      {[item.kawasan, item.jenisKerja].filter(Boolean).join(" · ")}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kontrak" : "Tambah Kontrak"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Nama kontraktor yang baru akan disalin ke semua rekod bayaran dengan No Kontrak ini."
                : "Kontrak baru akan muncul dalam pilihan No Kontrak di borang Bayaran."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kontrak-kawasan">
                Kawasan <span className="text-text-error-primary">*</span>
              </Label>
              <Input id="kontrak-kawasan" list="kontrak-kawasan-options" value={form.kawasan} onChange={setField("kawasan")} required />
              <datalist id="kontrak-kawasan-options">
                {kawasanOptions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="kontrak-no">
                  No Kontrak <span className="text-text-error-primary">*</span>
                </Label>
                <Input id="kontrak-no" value={form.noKontrak} onChange={setField("noKontrak")} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kontrak-kategori">Kategori</Label>
                <Select
                  value={form.kategori || NONE}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, kategori: value === NONE ? "" : value }))}
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
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontrak-kerja">Kerja</Label>
              <Textarea
                id="kontrak-kerja"
                rows={2}
                value={form.kerja}
                onChange={setField("kerja")}
                placeholder="Contoh: Kerja Mengangkut BTS Di Ladang …"
                className="min-h-[60px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontrak-nama">Nama Kontraktor</Label>
              <Select
                value={form.namaKontraktor || NONE}
                onValueChange={(value) => setForm((prev) => ({ ...prev, namaKontraktor: value === NONE ? "" : value }))}
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
              <p className="text-caption-1-regular text-text-tertiary">Tiada dalam senarai? Tambah dahulu di tab Kontraktor.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontrak-jenis">Jenis Kerja</Label>
              <Select
                value={form.jenisKerja || NONE}
                onValueChange={(value) => setForm((prev) => ({ ...prev, jenisKerja: value === NONE ? "" : value }))}
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
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor="kontrak-mula">Tarikh Mula</Label>
                <Input id="kontrak-mula" type="date" value={form.tarikhMula} onChange={setField("tarikhMula")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kontrak-akhir">Tarikh Akhir</Label>
                <Input
                  id="kontrak-akhir"
                  type="date"
                  min={form.tarikhMula || undefined}
                  value={form.tarikhAkhir}
                  onChange={setField("tarikhAkhir")}
                />
              </div>
              <div className="col-span-2 grid gap-1.5 sm:col-span-1">
                <Label htmlFor="kontrak-tahun">Tahun Kontrak</Label>
                <Input
                  id="kontrak-tahun"
                  value={tahunFromTarikh(form.tarikhMula) ?? ""}
                  placeholder="Auto"
                  readOnly
                  tabIndex={-1}
                  className="sm:w-24"
                  title="Diambil daripada Tarikh Mula"
                />
              </div>
            </div>
            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <RiLoader4Line className="animate-spin" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
