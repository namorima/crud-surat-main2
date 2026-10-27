"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { RiAddLine, RiCheckLine, RiDeleteBinLine, RiEditLine, RiLoader4Line, RiSearchLine } from "@remixicon/react"
import type { Locker, LockerInput } from "@/types/locker"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { RowActions } from "@/components/dashboard/row-actions"
import { FormField, dialogBodyClass, dialogFooterClass, dialogFrameClass, dialogHeaderClass } from "@/components/dashboard/form-field"
import { PartBadge } from "@/components/tetapan/part-badge"
import { DEFAULT_WARNA, LOCKER_WARNA } from "@/lib/locker-input"
import { cx } from "@/utils/cx"

const ALL_UNITS = "__all__"

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return body.error || fallback
  } catch {
    return fallback
  }
}

function Swatch({ warna }: { warna: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-caption-1-regular text-text-secondary tabular-nums">
      <span className="size-3.5 shrink-0 rounded-full border border-border-table" style={{ backgroundColor: warna }} aria-hidden />
      {warna}
    </span>
  )
}

/** Tetapan → Setup Locker: the Part and No. Locker choices per unit for Setup Fail, and each Part badge colour. */
export function LockerManager({
  canEdit,
  canViewAll,
  userUnit,
}: {
  canEdit: boolean
  /** Sees and manages every unit; otherwise only the user's own unit. */
  canViewAll: boolean
  userUnit: string
}) {
  const empty: LockerInput = { unit: canViewAll ? "" : userUnit, part: "", noLocker: "", warna: DEFAULT_WARNA }

  const [items, setItems] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [unitFilter, setUnitFilter] = useState(ALL_UNITS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Locker | null>(null)
  const [form, setForm] = useState<LockerInput>(empty)
  // Picking a part already used in the unit takes its colour until a colour is chosen by hand
  const [warnaTouched, setWarnaTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Locker | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/locker")
        if (!response.ok) throw new Error(await readError(response, "Gagal memuatkan data locker"))
        setItems(await response.json())
      } catch (error: any) {
        toast.error(error.message)
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

  const visible = useMemo(
    () => (canViewAll ? items : items.filter((locker) => locker.unit === userUnit)),
    [items, canViewAll, userUnit],
  )

  const unitOptions = useMemo(
    () => Array.from(new Set([...units, ...items.map((locker) => locker.unit)].filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [units, items],
  )

  const activeUnit = canViewAll ? unitFilter : ALL_UNITS
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visible.filter(
      (locker) =>
        (activeUnit === ALL_UNITS || locker.unit === activeUnit) &&
        (!q || [locker.unit, locker.part, locker.noLocker].some((value) => value.toLowerCase().includes(q))),
    )
  }, [visible, query, activeUnit])

  // Parts already set up in the form's unit, offered as suggestions
  const partOptions = useMemo(
    () => Array.from(new Set(items.filter((locker) => locker.unit === form.unit).map((locker) => locker.part))).sort(),
    [items, form.unit],
  )

  const openAdd = () => {
    setEditing(null)
    setForm(activeUnit !== ALL_UNITS ? { ...empty, unit: activeUnit } : empty)
    setWarnaTouched(false)
    setFormOpen(true)
  }

  const openEdit = (locker: Locker) => {
    setEditing(locker)
    setForm({ unit: locker.unit, part: locker.part, noLocker: locker.noLocker, warna: locker.warna })
    setWarnaTouched(true)
    setFormOpen(true)
  }

  const setPart = (part: string) => {
    setForm((prev) => {
      const match = !warnaTouched && items.find((locker) => locker.unit === prev.unit && locker.part.toUpperCase() === part.trim().toUpperCase())
      return { ...prev, part, warna: match ? match.warna : prev.warna }
    })
  }

  const setWarna = (warna: string) => {
    setWarnaTouched(true)
    setForm((prev) => ({ ...prev, warna }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.unit || !form.part.trim() || !form.noLocker.trim()) {
      toast.error("Sila isi Unit, Part dan No. Locker")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/locker/${editing.id}` : "/api/locker", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readError(response, editing ? "Gagal mengemaskini locker" : "Gagal menambah locker"))
      const result = await response.json()
      const saved: Locker = editing ? result.locker : result
      setItems((prev) =>
        [...prev.filter((locker) => locker.id !== saved.id), saved].sort(
          (a, b) => a.unit.localeCompare(b.unit) || a.part.localeCompare(b.part) || a.noLocker.localeCompare(b.noLocker),
        ),
      )
      const failUpdated: number = editing ? result.failUpdated : 0
      toast.success(editing ? "Locker dikemaskini" : "Locker ditambah", {
        description: failUpdated > 0 ? `${failUpdated} fail dipindahkan ke ${saved.part} · Locker ${saved.noLocker}.` : undefined,
      })
      setFormOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deleting) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/locker/${deleting.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Gagal memadam locker"))
      setItems((prev) => prev.filter((locker) => locker.id !== deleting.id))
      toast.success(`Locker ${deleting.noLocker} dipadam`)
      setDeleting(null)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const actionsFor = (locker: Locker) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(locker) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeleting(locker), danger: true },
  ]
  const isPreset = LOCKER_WARNA.some((preset) => preset.hex === form.warna.toLowerCase())

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Setup Locker</CardTitle>
          <CardDescription>
            Part dan No. Locker {canViewAll ? "bagi setiap unit" : `untuk unit ${userUnit}`}. Ia menjadi pilihan dalam borang Setup Fail, dan warna
            menentukan badge Part.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="small" leadingIcon={RiAddLine} onClick={openAdd} className="shrink-0 self-start">
            Tambah Locker
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari unit, part atau no. locker…" className="pl-8" aria-label="Cari locker" />
          </div>
          {canViewAll && (
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger aria-label="Tapis unit" className="sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_UNITS}>Semua unit</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {visible.length === 0 ? "Tiada locker lagi" : "Tiada locker sepadan dengan carian"}
          </p>
        ) : (
          <>
            {/* iPad landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              {/* No inner vertical scroll: a nested scroll area traps touch scrolling on iPad; the page scrolls */}
              <div className="relative overflow-x-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Unit</th>
                      <th>Part</th>
                      <th>No. Locker</th>
                      <th>Warna</th>
                      {canEdit && (
                        <th className="w-[56px]">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((locker) => (
                      <tr key={locker.id} className="hover:bg-background-secondary-default">
                        <td className="text-text-secondary">{locker.unit}</td>
                        <td>
                          <PartBadge part={locker.part} warna={locker.warna} />
                        </td>
                        <td className="text-body-semibold tabular-nums">{locker.noLocker}</td>
                        <td>
                          <Swatch warna={locker.warna} />
                        </td>
                        {canEdit && (
                          <td className="text-end">
                            <RowActions actions={actionsFor(locker)} />
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
              {filtered.map((locker) => (
                <li key={locker.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-body-semibold text-text-primary tabular-nums">Locker {locker.noLocker}</span>
                      <PartBadge part={locker.part} warna={locker.warna} />
                    </div>
                    <span className="text-caption-1-regular text-text-tertiary">
                      {locker.unit} · {locker.warna}
                    </span>
                  </div>
                  {canEdit && <RowActions className="-me-1.5 size-7" actions={actionsFor(locker)} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">
          Jumlah: {filtered.length !== visible.length ? `${filtered.length} / ` : ""}
          {visible.length} locker
        </p>
      </CardFooter>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={cx(dialogFrameClass, "sm:max-w-lg")}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">{editing ? "Kemaskini Locker" : "Tambah Locker"}</DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editing ? "Menukar Unit, Part atau No. Locker turut memindahkan fail di dalamnya." : "Locker baru menjadi pilihan dalam borang Setup Fail."}{" "}
              Medan bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className={dialogBodyClass}>
              <FormField label="Unit" htmlFor="locker-unit" required hint={canViewAll ? undefined : "Unit diisi automatik berdasarkan role anda"}>
                {canViewAll ? (
                  <Select value={form.unit} onValueChange={(unit) => setForm((prev) => ({ ...prev, unit }))}>
                    <SelectTrigger id="locker-unit">
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="locker-unit" value={form.unit} disabled />
                )}
              </FormField>
              <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1fr_140px]">
                <FormField label="Part" htmlFor="locker-part" required>
                  <Input
                    id="locker-part"
                    list="locker-part-options"
                    value={form.part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder="PERTANIAN AM"
                    autoComplete="off"
                    className="uppercase"
                  />
                  <datalist id="locker-part-options">
                    {partOptions.map((part) => (
                      <option key={part} value={part} />
                    ))}
                  </datalist>
                </FormField>
                <FormField label="No. Locker" htmlFor="locker-no" required className="w-28 sm:w-auto">
                  <Input
                    id="locker-no"
                    value={form.noLocker}
                    onChange={(e) => setForm((prev) => ({ ...prev, noLocker: e.target.value }))}
                    placeholder="B1"
                    autoComplete="off"
                    className="uppercase"
                  />
                </FormField>
              </div>
              <FormField label="Warna badge Part" hint="Badge ini dipaparkan pada Part di Setup Fail.">
                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Warna badge Part">
                  {LOCKER_WARNA.map((preset) => {
                    const selected = preset.hex === form.warna.toLowerCase()
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={preset.name}
                        title={preset.name}
                        onClick={() => setWarna(preset.hex)}
                        className={cx(
                          "motion-press flex size-8 items-center justify-center rounded-full border border-border-table outline-none focus-visible:ring-2 focus-visible:ring-border-button-active",
                          selected && "ring-2 ring-text-primary ring-offset-2 ring-offset-background-primary-default",
                        )}
                        style={{ backgroundColor: preset.hex }}
                      >
                        {selected && <RiCheckLine className="size-4 text-neutral-900" aria-hidden />}
                      </button>
                    )
                  })}
                  {/* Any other colour */}
                  <label
                    className={cx(
                      "relative flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border-table px-2.5 text-caption-1-medium text-text-secondary",
                      !isPreset && "ring-2 ring-text-primary ring-offset-2 ring-offset-background-primary-default",
                    )}
                  >
                    <span className="size-4 rounded-full border border-border-table" style={{ backgroundColor: form.warna }} aria-hidden />
                    Lain
                    <input
                      type="color"
                      value={form.warna}
                      onChange={(e) => setWarna(e.target.value)}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                      aria-label="Pilih warna lain"
                    />
                  </label>
                </div>
              </FormField>
              <div className="flex items-center gap-2 rounded-xl bg-background-secondary-default px-3 py-2">
                <span className="text-caption-1-regular text-text-tertiary">Pratonton</span>
                <PartBadge part={form.part.trim().toUpperCase() || "PART"} warna={form.warna} />
              </div>
            </div>

            <div className={dialogFooterClass}>
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
            <AlertDialogTitle>Padam Locker {deleting?.noLocker}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && `${deleting.part} · ${deleting.unit}. `}Locker yang masih mempunyai fail tidak boleh dipadam.
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
