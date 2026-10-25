"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiSearchLine } from "@remixicon/react"
import type { Fail } from "@/types/fail"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { RowActions } from "@/components/dashboard/row-actions"
import { cx } from "@/utils/cx"

const FAIL_PARTS = ["HASIL", "PERTANIAN AM", "KONTRAK"]

/** Same hues as the fail dots in the Surat form. */
const FAIL_PART_DOT: Record<string, string> = {
  HASIL: "bg-yellow-400",
  "PERTANIAN AM": "bg-lime-500",
  KONTRAK: "bg-orange-400",
  PERLADANGAN: "bg-pink-400",
}

type FailForm = Omit<Fail, "id">

function PartChip({ part }: { part: string }) {
  return (
    <Chip variant="caption" color="soft" className="gap-1.5">
      <span className={cx("size-2 shrink-0 rounded-full", FAIL_PART_DOT[part] ?? "bg-neutral-400")} aria-hidden />
      {part}
    </Chip>
  )
}

function Dash() {
  return <span className="text-text-tertiary">-</span>
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-caption-1-medium text-text-secondary">
        {label}
        {required && <span className="ms-0.5 text-text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-caption-2-regular text-text-tertiary">{hint}</p>}
    </div>
  )
}

/** Tetapan → Setup Fail: the fail list each unit picks from when filing a surat. */
export function FailManager({
  canEdit,
  canViewAll,
  userUnit,
}: {
  canEdit: boolean
  /** Sees and manages every unit; otherwise only the user's own unit. */
  canViewAll: boolean
  userUnit: string
}) {
  const empty: FailForm = { part: "", noLocker: "", noFail: "", pecahan: "", pecahanKecil: "", unit: canViewAll ? "" : userUnit }

  const [items, setItems] = useState<Fail[]>([])
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Fail | null>(null)
  const [form, setForm] = useState<FailForm>(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Fail | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/fail")
        if (!response.ok) throw new Error("Failed to fetch FAIL data")
        setItems(await response.json())
      } catch (error) {
        console.error("Error fetching FAIL data:", error)
        toast.error("Gagal memuatkan data fail")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!canViewAll) return
    fetch("/api/unit-pic")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to fetch units"))))
      .then((data) => setUnits(data.units || []))
      .catch((error) => console.error("Error fetching units:", error))
  }, [canViewAll])

  // Non-admin users only see their own unit's fails
  const visible = useMemo(
    () => (canViewAll ? items : items.filter((fail) => fail.unit === userUnit)),
    [items, canViewAll, userUnit],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return visible
    return visible.filter((fail) =>
      [fail.part, fail.noLocker, fail.noFail, fail.pecahan, fail.pecahanKecil, fail.unit].some((value) =>
        (value || "").toLowerCase().includes(q),
      ),
    )
  }, [visible, query])

  const openAdd = () => {
    setEditing(null)
    setForm(empty)
    setFormOpen(true)
  }

  const openEdit = (fail: Fail) => {
    setEditing(fail)
    setForm({
      part: fail.part,
      noLocker: fail.noLocker,
      noFail: fail.noFail,
      pecahan: fail.pecahan,
      pecahanKecil: fail.pecahanKecil,
      unit: fail.unit,
    })
    setFormOpen(true)
  }

  const setField = (field: keyof FailForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.part.trim() || !form.noFail.trim() || !form.unit) {
      toast.error("Sila isi Part, No. Fail dan Unit")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/fail/${editing.id}` : "/api/fail", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error("Failed to save fail")
      const saved: Fail = await response.json()
      setItems((prev) => (editing ? prev.map((f) => (f.id === editing.id ? saved : f)) : [...prev, saved]))
      toast.success(editing ? "Fail telah dikemaskini" : "Fail baru telah ditambah")
      setFormOpen(false)
    } catch (error) {
      console.error("Error saving fail:", error)
      toast.error(editing ? "Gagal mengemaskini fail" : "Gagal menambah fail baru")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deleting) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/fail/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete fail")
      setItems((prev) => prev.filter((f) => f.id !== deleting.id))
      toast.success("Fail telah dipadam")
      setDeleting(null)
    } catch (error) {
      console.error("Error deleting fail:", error)
      toast.error("Gagal memadam fail")
    } finally {
      setIsDeleting(false)
    }
  }

  const actionsFor = (fail: Fail) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(fail) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(fail), danger: true },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Setup Fail</CardTitle>
          <CardDescription>
            Senarai fail {canViewAll ? "semua unit" : `untuk unit ${userUnit}`}. Fail ini menjadi pilihan Fail dalam borang Surat.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="small" leadingIcon={RiAddLine} onClick={openAdd} className="shrink-0 self-start">
            Tambah Fail
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari part, locker, no fail, pecahan atau unit…"
            className="pl-8"
            aria-label="Cari fail"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {visible.length === 0 ? "Tiada data fail" : "Tiada fail sepadan dengan carian"}
          </p>
        ) : (
          <>
            {/* iPad landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="relative max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Part</th>
                      <th>No. Locker</th>
                      <th>No. Fail</th>
                      <th>Pecahan</th>
                      <th>Pecahan Kecil</th>
                      <th>Unit</th>
                      {canEdit && (
                        <th className="w-[56px]">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((fail) => (
                      <tr key={fail.id} className="hover:bg-background-secondary-default">
                        <td>
                          <PartChip part={fail.part} />
                        </td>
                        <td className="tabular-nums">{fail.noLocker || <Dash />}</td>
                        <td className="text-body-semibold tabular-nums">{fail.noFail}</td>
                        <td>{fail.pecahan || <Dash />}</td>
                        <td className="text-text-secondary">{fail.pecahanKecil || <Dash />}</td>
                        <td className="text-text-secondary">{fail.unit}</td>
                        {canEdit && (
                          <td className="text-end">
                            <RowActions actions={actionsFor(fail)} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones */}
            <ul className="motion-stagger grid gap-2 md:hidden">
              {filtered.map((fail) => (
                <li key={fail.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-body-semibold text-text-primary tabular-nums">Fail {fail.noFail}</span>
                      <PartChip part={fail.part} />
                    </div>
                    {(fail.pecahan || fail.pecahanKecil) && (
                      <span className="text-body-regular text-text-secondary">
                        {[fail.pecahan, fail.pecahanKecil].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    <span className="text-caption-1-regular text-text-tertiary">
                      {[fail.unit, fail.noLocker && `Locker ${fail.noLocker}`].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {canEdit && <RowActions className="-me-1.5 size-7" actions={actionsFor(fail)} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">
          Jumlah: {query ? `${filtered.length} / ` : ""}
          {visible.length} fail
        </p>
      </CardFooter>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg sm:p-0">
          <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
              {editing ? "Kemaskini Fail" : "Tambah Fail Baru"}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editing ? "Kemaskini maklumat fail yang dipilih." : "Masukkan maklumat fail baru."} Medan bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-4 py-4 sm:px-6">
              <Field label="Part" htmlFor="fail-part" required>
                <Input id="fail-part" list="fail-part-options" value={form.part} onChange={setField("part")} placeholder="PERTANIAN AM" />
                <datalist id="fail-part-options">
                  {FAIL_PARTS.map((part) => (
                    <option key={part} value={part} />
                  ))}
                </datalist>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="No. Locker" htmlFor="fail-locker">
                  <Input id="fail-locker" value={form.noLocker} onChange={setField("noLocker")} placeholder="B1" />
                </Field>
                <Field label="No. Fail" htmlFor="fail-no" required>
                  <Input id="fail-no" value={form.noFail} onChange={setField("noFail")} placeholder="2" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pecahan" htmlFor="fail-pecahan">
                  <Input id="fail-pecahan" value={form.pecahan} onChange={setField("pecahan")} />
                </Field>
                <Field label="Pecahan Kecil" htmlFor="fail-pecahan-kecil">
                  <Input id="fail-pecahan-kecil" value={form.pecahanKecil} onChange={setField("pecahanKecil")} />
                </Field>
              </div>
              <Field
                label="Unit"
                htmlFor="fail-unit"
                required
                hint={canViewAll ? undefined : "Unit diisi automatik berdasarkan role anda"}
              >
                {canViewAll ? (
                  <Select value={form.unit} onValueChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}>
                    <SelectTrigger id="fail-unit">
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="fail-unit" value={form.unit} disabled />
                )}
              </Field>
            </div>

            <div className="flex gap-2 border-t border-border-table px-4 py-3 sm:justify-end sm:px-6">
              <Button type="button" variant="secondary" size="small" onClick={() => setFormOpen(false)} disabled={saving} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" size="small" disabled={saving} className="flex-1 sm:flex-none">
                {saving ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                    Menyimpan...
                  </span>
                ) : editing ? (
                  "Kemaskini"
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !isDeleting && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Fail {deleting?.noFail}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && `${deleting.part} · ${deleting.unit}. `}Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-button-danger">
              {isDeleting && <RiLoader4Line className="animate-spin" />}
              {isDeleting ? "Memadam..." : "Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
