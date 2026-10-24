"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiRefreshLine, RiSearchLine } from "@remixicon/react"
import type { Kontrak, KontrakInput } from "@/types/kontrak"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { RowActions } from "@/components/dashboard/row-actions"
import { bayaranKategoriChip } from "@/lib/ui-status"

const EMPTY: KontrakInput = { kawasan: "", noKontrak: "", kategori: "", namaKontraktor: "" }

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
  const kategoriOptions = useMemo(() => [...new Set(items.map((item) => item.kategori).filter(Boolean))].sort(), [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      [item.kawasan, item.noKontrak, item.kategori, item.namaKontraktor].some((value) => value.toLowerCase().includes(q)),
    )
  }, [items, query])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (item: Kontrak) => {
    setEditing(item)
    setForm({ kawasan: item.kawasan, noKontrak: item.noKontrak, kategori: item.kategori, namaKontraktor: item.namaKontraktor })
    setFormOpen(true)
  }

  const setField = (field: keyof KontrakInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kawasan.trim() || !form.noKontrak.trim()) {
      toast.error("Kawasan dan No Kontrak wajib diisi")
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
            placeholder="Cari kawasan, no kontrak atau kontraktor…"
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
            {/* Tablet and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Kawasan</th>
                      <th>No Kontrak</th>
                      <th>Kategori</th>
                      <th>Nama Kontraktor</th>
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
                        <td className="text-text-secondary">{item.kawasan}</td>
                        <td className="text-body-semibold">{item.noKontrak}</td>
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

            {/* Phones */}
            <ul className="flex flex-col gap-2 md:hidden">
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
                    <span className="truncate text-caption-1-regular text-text-tertiary">{item.kawasan}</span>
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
                <Input id="kontrak-kategori" list="kontrak-kategori-options" value={form.kategori} onChange={setField("kategori")} />
                <datalist id="kontrak-kategori-options">
                  {kategoriOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontrak-nama">Nama Kontraktor</Label>
              <Input id="kontrak-nama" value={form.namaKontraktor} onChange={setField("namaKontraktor")} placeholder="Contoh: ABC SDN BHD" />
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
