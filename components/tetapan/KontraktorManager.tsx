"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiSearchLine } from "@remixicon/react"
import type { Kontraktor, KontraktorInput } from "@/types/kontraktor"
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
import { BANK_SUGGESTIONS } from "@/lib/kontraktor-input"

const EMPTY: KontraktorInput = { namaKontraktor: "", noVendor: "", namaAkaun: "", nomborAkaun: "", jenisBank: "" }

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

/** Tetapan → Kontraktor: contractor master data; feeds the Nama Kontraktor dropdown in Kontrak. */
export function KontraktorManager({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<Kontraktor[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kontraktor | null>(null)
  const [form, setForm] = useState<KontraktorInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Kontraktor | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/kontraktor")
      if (!response.ok) throw new Error(await readError(response, "Gagal memuatkan kontraktor"))
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
    return items.filter((item) =>
      [item.namaKontraktor, item.noVendor, item.namaAkaun, item.nomborAkaun, item.jenisBank].some((value) =>
        value.toLowerCase().includes(q),
      ),
    )
  }, [items, query])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (item: Kontraktor) => {
    setEditing(item)
    setForm({
      namaKontraktor: item.namaKontraktor,
      noVendor: item.noVendor,
      namaAkaun: item.namaAkaun,
      nomborAkaun: item.nomborAkaun,
      jenisBank: item.jenisBank,
    })
    setFormOpen(true)
  }

  const setField = (field: keyof KontraktorInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.namaKontraktor.trim()) {
      toast.error("Nama Kontraktor wajib diisi")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/kontraktor/${editing.id}` : "/api/kontraktor", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menyimpan kontraktor"))
      const result = await response.json()
      const renamed = editing && (result.kontrakUpdated > 0 || result.bayaranUpdated > 0)
      toast.success(editing ? "Kontraktor dikemas kini" : "Kontraktor ditambah", {
        description: renamed
          ? `Nama baharu disalin ke ${result.kontrakUpdated} kontrak dan ${result.bayaranUpdated} rekod bayaran.`
          : undefined,
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
      const response = await fetch(`/api/kontraktor/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Gagal memadam kontraktor"))
      toast.success(`${deleting.namaKontraktor} dipadam`)
      setDeleting(null)
      await load()
    } catch (error: any) {
      toast.error(error.message)
      setDeleting(null)
    }
  }

  const actionsFor = (item: Kontraktor) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(item) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(item), danger: true },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Kontraktor</CardTitle>
          <CardDescription>
            Maklumat vendor dan akaun bank kontraktor. Senarai ini menjadi pilihan Nama Kontraktor di tab Kontrak.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openAdd} className="shrink-0">
            <RiAddLine />
            Tambah Kontraktor
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, no vendor, akaun atau bank…"
            className="pl-8"
            aria-label="Cari kontraktor"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {items.length === 0 ? "Tiada kontraktor lagi" : "Tiada kontraktor sepadan dengan carian"}
          </p>
        ) : (
          <>
            {/* Tablet landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table lg:block">
              <div className="relative max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Nama Kontraktor</th>
                      <th>No Vendor</th>
                      <th>Nama Akaun</th>
                      <th>Nombor Akaun</th>
                      <th>Jenis Bank</th>
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
                        <td className="text-body-semibold">{item.namaKontraktor}</td>
                        <td className="tabular-nums">{item.noVendor || <Dash />}</td>
                        <td>{item.namaAkaun || <Dash />}</td>
                        <td className="tabular-nums">{item.nomborAkaun || <Dash />}</td>
                        <td className="text-text-secondary">{item.jenisBank || <Dash />}</td>
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

            {/* Phones and iPad portrait */}
            <ul className="motion-stagger grid gap-2 md:grid-cols-2 lg:hidden">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-body-semibold text-text-primary">{item.namaKontraktor}</span>
                    {item.noVendor && <span className="text-caption-1-regular text-text-tertiary">Vendor: {item.noVendor}</span>}
                    {(item.nomborAkaun || item.jenisBank) && (
                      <span className="text-body-regular text-text-secondary tabular-nums">
                        {[item.jenisBank, item.nomborAkaun].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {item.namaAkaun && <span className="truncate text-caption-1-regular text-text-tertiary">{item.namaAkaun}</span>}
                  </div>
                  {canEdit && <RowActions className="-me-1.5 size-7" actions={actionsFor(item)} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">Jumlah: {items.length} kontraktor</p>
      </CardFooter>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kontraktor" : "Tambah Kontraktor"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Menukar nama kontraktor turut mengemas kini kontrak dan rekod bayaran yang menggunakan nama lama."
                : "Kontraktor baharu akan muncul dalam pilihan Nama Kontraktor di tab Kontrak."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kontraktor-nama">
                Nama Kontraktor <span className="text-text-error-primary">*</span>
              </Label>
              <Input id="kontraktor-nama" value={form.namaKontraktor} onChange={setField("namaKontraktor")} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontraktor-vendor">No Vendor</Label>
              <Input id="kontraktor-vendor" value={form.noVendor} onChange={setField("noVendor")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kontraktor-akaun-nama">Nama Akaun</Label>
              <Input id="kontraktor-akaun-nama" value={form.namaAkaun} onChange={setField("namaAkaun")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="kontraktor-akaun-no">Nombor Akaun</Label>
                <Input
                  id="kontraktor-akaun-no"
                  inputMode="numeric"
                  value={form.nomborAkaun}
                  onChange={setField("nomborAkaun")}
                  placeholder="Contoh: 5621-2345-6789"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kontraktor-bank">Jenis Bank</Label>
                <Input id="kontraktor-bank" list="kontraktor-bank-options" value={form.jenisBank} onChange={setField("jenisBank")} />
                <datalist id="kontraktor-bank-options">
                  {BANK_SUGGESTIONS.map((bank) => (
                    <option key={bank} value={bank} />
                  ))}
                </datalist>
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
            <AlertDialogTitle>Padam {deleting?.namaKontraktor}?</AlertDialogTitle>
            <AlertDialogDescription>
              Kontraktor yang masih digunakan oleh mana-mana kontrak tidak boleh dipadam.
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
