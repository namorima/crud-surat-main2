"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiSearchLine } from "@remixicon/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { RowActions } from "@/components/dashboard/row-actions"
import {
  FormField,
  dialogBodyClass,
  dialogFooterClass,
  dialogFrameClass,
  dialogHeaderClass,
} from "@/components/dashboard/form-field"
import type { UnitPic } from "@/types/unit-pic"

/** Pengguna → Unit PIC: who can be picked as Tindakan (PIC) for each unit in the Surat form. */
export function UnitPicManager() {
  const [unitPics, setUnitPics] = useState<UnitPic[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnitPic, setEditingUnitPic] = useState<UnitPic | null>(null)
  const [deleting, setDeleting] = useState<UnitPic | null>(null)
  const [formData, setFormData] = useState({
    unit: "",
    pic: ""
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUnitPics()
  }, [])

  const fetchUnitPics = async () => {
    try {
      const response = await fetch("/api/unit-pic?format=raw")
      const data = await response.json()
      setUnitPics(data)
    } catch (error) {
      console.error("Error fetching unit-pics:", error)
      toast.error("Gagal memuatkan data Unit PIC")
    } finally {
      setLoading(false)
    }
  }

  const units = useMemo(() => Array.from(new Set(unitPics.map((u) => u.unit))).sort(), [unitPics])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return unitPics
      .filter((u) => !q || u.unit.toLowerCase().includes(q) || u.pic.toLowerCase().includes(q))
      .sort((a, b) => a.unit.localeCompare(b.unit) || a.pic.localeCompare(b.pic))
  }, [unitPics, query])

  const handleCreate = () => {
    setEditingUnitPic(null)
    setFormData({ unit: "", pic: "" })
    setIsDialogOpen(true)
  }

  const handleEdit = (unitPic: UnitPic) => {
    setEditingUnitPic(unitPic)
    setFormData({
      unit: unitPic.unit,
      pic: unitPic.pic
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.unit.trim() || !formData.pic.trim()) {
      toast.error("Sila isi Unit dan PIC")
      return
    }
    setSubmitting(true)
    try {
      const body = editingUnitPic ? { id: editingUnitPic.id, ...formData } : formData

      const response = await fetch("/api/unit-pic", {
        method: editingUnitPic ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error("Failed to save")
      await fetchUnitPics()
      setIsDialogOpen(false)
      toast.success(editingUnitPic ? "Unit PIC berjaya dikemaskini" : "Unit PIC berjaya ditambah")
    } catch (error) {
      console.error("Error saving unit-pic:", error)
      toast.error("Gagal menyimpan Unit PIC")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deleting) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/unit-pic?id=${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      await fetchUnitPics()
      toast.success("Unit PIC berjaya dipadam")
      setDeleting(null)
    } catch (error) {
      console.error("Error deleting unit-pic:", error)
      toast.error("Gagal memadam Unit PIC")
    } finally {
      setSubmitting(false)
    }
  }

  const actionsFor = (unitPic: UnitPic) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => handleEdit(unitPic) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(unitPic), danger: true },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Unit PIC</CardTitle>
          <CardDescription>Pegawai yang boleh dipilih sebagai Tindakan (PIC) bagi setiap unit dalam borang Surat.</CardDescription>
        </div>
        <Button size="small" leadingIcon={RiAddLine} onClick={handleCreate} className="shrink-0 self-start">
          Tambah PIC
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari unit atau PIC…"
            className="pl-8"
            aria-label="Cari Unit PIC"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {unitPics.length === 0 ? "Tiada data Unit PIC" : "Tiada padanan untuk carian"}
          </p>
        ) : (
          <>
            {/* iPad landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="relative max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Unit</th>
                      <th>PIC (Person In Charge)</th>
                      <th className="w-[56px]">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((unitPic) => (
                      <tr key={unitPic.id} className="hover:bg-background-secondary-default">
                        <td>
                          <Chip variant="caption" color="soft">
                            {unitPic.unit}
                          </Chip>
                        </td>
                        <td className="text-body-semibold">{unitPic.pic}</td>
                        <td className="text-end">
                          <RowActions actions={actionsFor(unitPic)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones */}
            <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
              {filtered.map((unitPic) => (
                <li key={unitPic.id} className="flex items-center gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-body-semibold text-text-primary">{unitPic.pic}</span>
                    <span className="text-caption-1-regular text-text-tertiary">{unitPic.unit}</span>
                  </div>
                  <RowActions className="-me-1.5 size-7" actions={actionsFor(unitPic)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">
          Jumlah: {unitPics.length} PIC dalam {units.length} unit
        </p>
      </CardFooter>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${dialogFrameClass} sm:max-w-md`}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
              {editingUnitPic ? "Edit Unit PIC" : "Tambah Unit PIC Baru"}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editingUnitPic ? "Kemaskini maklumat Unit PIC." : "Tambah PIC baru untuk unit."} Medan bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className={dialogBodyClass}>
              <FormField label="Unit" htmlFor="unitpic-unit" required hint="Pilih unit sedia ada atau taip unit baharu.">
                <Input
                  id="unitpic-unit"
                  list="unitpic-unit-options"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Contoh: PENTADBIRAN"
                />
                <datalist id="unitpic-unit-options">
                  {units.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </FormField>
              <FormField label="PIC (Person In Charge)" htmlFor="unitpic-pic" required>
                <Input
                  id="unitpic-pic"
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  placeholder="Contoh: Ahmad bin Ali"
                />
              </FormField>
            </div>
            <div className={dialogFooterClass}>
              <Button type="button" variant="secondary" size="small" onClick={() => setIsDialogOpen(false)} disabled={submitting} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" size="small" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                    Menyimpan...
                  </span>
                ) : editingUnitPic ? (
                  "Kemaskini"
                ) : (
                  "Tambah"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !submitting && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam {deleting?.pic}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.pic} tidak lagi boleh dipilih sebagai PIC unit {deleting?.unit}. Surat sedia ada tidak berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={submitting} className="bg-button-danger">
              {submitting && <RiLoader4Line className="animate-spin" />}
              {submitting ? "Memadam..." : "Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
