"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiSearchLine } from "@remixicon/react"
import type { Kawasan, KawasanInput } from "@/types/kawasan"
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
import { RowActions } from "@/components/dashboard/row-actions"

const EMPTY: KawasanInput = { namaKawasan: "", kodLokasi: "" }

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return body.error || fallback
  } catch {
    return fallback
  }
}

function Dash() {
  return <span className="text-text-tertiary">-</span>
}

/** Tetapan → Kawasan: master list of kawasan with their Kod Lokasi. */
export function KawasanManager({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<Kawasan[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kawasan | null>(null)
  const [deleting, setDeleting] = useState<Kawasan | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/kawasan")
      if (!response.ok) throw new Error(await readError(response, "Gagal memuatkan kawasan"))
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => [item.namaKawasan, item.kodLokasi].some((value) => value.toLowerCase().includes(q)))
  }, [items, query])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item: Kawasan) => {
    setEditing(item)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      const response = await fetch(`/api/kawasan/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Gagal memadam kawasan"))
      toast.success(`${deleting.namaKawasan} dipadam`)
      setDeleting(null)
      await load()
    } catch (error: any) {
      toast.error(error.message)
      setDeleting(null)
    }
  }

  const actionsFor = (item: Kawasan) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(item) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(item), danger: true },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Kawasan</CardTitle>
          <CardDescription>Senarai kawasan dan kod lokasinya.</CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openAdd} className="shrink-0">
            <RiAddLine />
            Tambah Kawasan
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama kawasan atau kod lokasi…"
            className="pl-8"
            aria-label="Cari kawasan"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {items.length === 0 ? "Tiada kawasan lagi" : "Tiada kawasan sepadan dengan carian"}
          </p>
        ) : (
          <>
            {/* Tablet and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="relative overflow-x-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Nama Kawasan</th>
                      <th>Kod Lokasi</th>
                      {canEdit && (
                        <th className="w-[56px]">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-background-secondary-default">
                        <td className="text-body-semibold">{item.namaKawasan}</td>
                        <td className="tabular-nums">{item.kodLokasi || <Dash />}</td>
                        {canEdit && (
                          <td className="text-end">
                            <RowActions actions={actionsFor(item)} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones */}
            <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-body-semibold text-text-primary">{item.namaKawasan}</span>
                    <span className="text-caption-1-regular text-text-tertiary tabular-nums">
                      Kod Lokasi: {item.kodLokasi || "-"}
                    </span>
                  </div>
                  {canEdit && <RowActions className="-me-1.5 size-7" actions={actionsFor(item)} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">Jumlah: {items.length} kawasan</p>
      </CardFooter>

      <KawasanFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={() => load()} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam {deleting?.namaKawasan}?</AlertDialogTitle>
            <AlertDialogDescription>Kawasan yang masih digunakan oleh mana-mana kontrak tidak boleh dipadam.</AlertDialogDescription>
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

/** Tambah / Edit Kawasan dialog; also opened from Tambah / Edit Rekod Bayaran (+ by Daripada). */
export function KawasanFormDialog({
  open,
  onOpenChange,
  editing = null,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Kawasan | null
  onSaved: (kawasan: Kawasan) => void
}) {
  const [form, setForm] = useState<KawasanInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(editing ? { namaKawasan: editing.namaKawasan, kodLokasi: editing.kodLokasi } : EMPTY)
  }, [open, editing])

  const setField = (field: keyof KawasanInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    // A form opened from another form must not submit that one too
    e.stopPropagation()
    if (!form.namaKawasan.trim()) {
      toast.error("Nama Kawasan wajib diisi")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/kawasan/${editing.id}` : "/api/kawasan", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menyimpan kawasan"))
      const result = await response.json()
      const renamed = editing && (result.kontrakUpdated > 0 || result.bayaranUpdated > 0)
      toast.success(editing ? "Kawasan dikemas kini" : "Kawasan ditambah", {
        description: renamed
          ? `Nama baharu disalin ke ${result.kontrakUpdated} kontrak dan ${result.bayaranUpdated} rekod bayaran.`
          : undefined,
      })
      onOpenChange(false)
      // POST returns the row; PUT returns { kawasan, kontrakUpdated, bayaranUpdated }
      onSaved(result.kawasan ?? result)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Kawasan" : "Tambah Kawasan"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Menukar nama kawasan turut mengemas kini kontrak dan rekod bayaran yang menggunakan nama lama."
              : "Masukkan nama kawasan dan kod lokasinya."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="kawasan-nama">
              Nama Kawasan <span className="text-text-error-primary">*</span>
            </Label>
            <Input id="kawasan-nama" value={form.namaKawasan} onChange={setField("namaKawasan")} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="kawasan-kod">Kod Lokasi</Label>
            <Input id="kawasan-kod" value={form.kodLokasi} onChange={setField("kodLokasi")} />
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
  )
}
