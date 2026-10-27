"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFilter3Line,
  RiForbidLine,
  RiLoader4Line,
  RiSearchLine,
} from "@remixicon/react"
import type { Fail } from "@/types/fail"
import type { Locker } from "@/types/locker"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Chip } from "@/components/base/badges/chip"
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
import { PartBadge, partWarna } from "@/components/tetapan/part-badge"
import { RowActions } from "@/components/dashboard/row-actions"
import { cx } from "@/utils/cx"

const ALL_UNITS = "__all__"
/** localStorage key for the Setup Fail unit filter (per browser). */
const UNIT_FILTER_KEY = "tetapan:setup-fail:unit"

type FailForm = Omit<Fail, "id" | "isActive">

type StatusFilter = "aktif" | "tidak-aktif" | "semua"

/** Same unit, part, locker and no fail, ignoring case and spacing. */
const sameFail = (a: FailForm, b: FailForm) =>
  (["unit", "part", "noLocker", "noFail"] as const).every((key) => (a[key] || "").trim().toUpperCase() === (b[key] || "").trim().toUpperCase())

/** Radix Select cannot hold "", so an unset field uses this value. */
const NONE = "__none"

/**
 * Radix Select inside a form reports "" when its value is set before the
 * list was ever opened (its hidden native select has no such option yet).
 * Real choices are never "" here (clearing uses NONE), so drop those calls.
 */
const onPick = (apply: (value: string) => void) => (value: string) => {
  if (value !== "") apply(value === NONE ? "" : value)
}

function InactiveChip() {
  return (
    <Chip variant="caption" color="neutral">
      Tidak aktif
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
  onOpenLocker,
}: {
  canEdit: boolean
  /** Sees and manages every unit; otherwise only the user's own unit. */
  canViewAll: boolean
  userUnit: string
  /** Switches to the Setup Locker tab (from the form's "no locker" hint). */
  onOpenLocker?: () => void
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
  const [lockers, setLockers] = useState<Locker[]>([])
  // Status filter: active fails by default, or only the disabled ones, or both
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktif")
  // Adding a fail that repeats an active one: disable the old one (asked in the form)
  const [disableOld, setDisableOld] = useState(true)

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

  // Part and No. Locker choices, and the Part badge colours (Tetapan → Setup Locker)
  useEffect(() => {
    fetch("/api/locker")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to fetch locker"))))
      .then(setLockers)
      .catch((error) => console.error("Error fetching locker:", error))
  }, [])

  useEffect(() => {
    if (!canViewAll) return
    fetch("/api/unit-pic")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to fetch units"))))
      .then((data) => setUnits(data.units || []))
      .catch((error) => console.error("Error fetching units:", error))
  }, [canViewAll])

  // Unit filter (users who see every unit only); remembered across reloads
  const [unitFilter, setUnitFilterState] = useState(ALL_UNITS)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(UNIT_FILTER_KEY)
      if (saved) setUnitFilterState(saved)
    } catch {
      // storage blocked (private mode): keep "Semua unit"
    }
  }, [])
  const setUnitFilter = (value: string) => {
    setUnitFilterState(value)
    try {
      if (value === ALL_UNITS) localStorage.removeItem(UNIT_FILTER_KEY)
      else localStorage.setItem(UNIT_FILTER_KEY, value)
    } catch {
      // not persisted; the filter still applies for this visit
    }
  }
  const activeUnit = canViewAll ? unitFilter : ALL_UNITS

  // Non-admin users only see their own unit's fails
  const ownUnit = useMemo(
    () => (canViewAll ? items : items.filter((fail) => fail.unit === userUnit)),
    [items, canViewAll, userUnit],
  )
  const inactiveCount = useMemo(() => ownUnit.filter((fail) => !fail.isActive).length, [ownUnit])
  const visible = useMemo(
    () =>
      statusFilter === "semua" ? ownUnit : ownUnit.filter((fail) => fail.isActive === (statusFilter === "aktif")),
    [ownUnit, statusFilter],
  )

  // Units from Unit PIC plus any unit already used by a fail (and the saved one, so it still shows)
  const unitOptions = useMemo(() => {
    const all = new Set([...units, ...items.map((fail) => fail.unit).filter(Boolean)])
    if (unitFilter !== ALL_UNITS) all.add(unitFilter)
    return Array.from(all).sort((a, b) => a.localeCompare(b))
  }, [units, items, unitFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visible.filter(
      (fail) =>
        (activeUnit === ALL_UNITS || fail.unit === activeUnit) &&
        (!q ||
          [fail.part, fail.noLocker, fail.noFail, fail.pecahan, fail.pecahanKecil, fail.unit].some((value) =>
            (value || "").toLowerCase().includes(q),
          )),
    )
  }, [visible, query, activeUnit])

  const narrowed = Boolean(query.trim()) || activeUnit !== ALL_UNITS

  // Active fails the new one repeats (Tambah Fail only)
  const duplicates = useMemo(
    () => (editing || !form.noFail.trim() || !form.noLocker ? [] : items.filter((fail) => fail.isActive && sameFail(fail, form))),
    [editing, items, form],
  )

  // The form offers the parts set up for its unit, then the lockers of that part.
  // A value no longer in Setup Locker (an older fail) stays selectable so editing keeps it.
  const unitLockers = useMemo(() => lockers.filter((locker) => locker.unit === form.unit), [lockers, form.unit])
  const partChoices = useMemo(() => {
    const parts = Array.from(new Set(unitLockers.map((locker) => locker.part))).sort((a, b) => a.localeCompare(b))
    return form.part && !parts.includes(form.part) ? [...parts, form.part] : parts
  }, [unitLockers, form.part])
  const lockerChoices = useMemo(() => {
    const nos = unitLockers.filter((locker) => locker.part === form.part).map((locker) => locker.noLocker).sort((a, b) => a.localeCompare(b))
    return form.noLocker && !nos.includes(form.noLocker) ? [...nos, form.noLocker] : nos
  }, [unitLockers, form.part, form.noLocker])
  const isListedPart = (part: string) => unitLockers.some((locker) => locker.part === part)
  const isListedLocker = (noLocker: string) => unitLockers.some((locker) => locker.part === form.part && locker.noLocker === noLocker)

  const setUnit = (unit: string) => setForm((prev) => (prev.unit === unit ? prev : { ...prev, unit, part: "", noLocker: "" }))
  const setPart = (part: string) =>
    setForm((prev) => {
      // A part kept in a single locker fills it in
      const nos = lockers.filter((locker) => locker.unit === prev.unit && locker.part === part).map((locker) => locker.noLocker)
      return { ...prev, part, noLocker: nos.length === 1 ? nos[0] : nos.includes(prev.noLocker) ? prev.noLocker : "" }
    })

  const openAdd = () => {
    setEditing(null)
    // A unit picked in the filter is the likely unit for the new fail
    setForm(activeUnit !== ALL_UNITS ? { ...empty, unit: activeUnit } : empty)
    setDisableOld(true)
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
    if (!form.unit || !form.part.trim() || !form.noLocker.trim() || !form.noFail.trim()) {
      toast.error("Sila isi Unit, Part, No. Locker dan No. Fail")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/fail/${editing.id}` : "/api/fail", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? form : { ...form, disableExisting: duplicates.length > 0 && disableOld }),
      })
      if (!response.ok) throw new Error("Failed to save fail")
      const { disabledIds = [], ...saved }: Fail & { disabledIds?: string[] } = await response.json()
      setItems((prev) =>
        editing
          ? prev.map((f) => (f.id === editing.id ? saved : f))
          : [...prev.map((f) => (disabledIds.includes(f.id) ? { ...f, isActive: false } : f)), saved],
      )
      toast.success(editing ? "Fail telah dikemaskini" : "Fail baru telah ditambah", {
        description: disabledIds.length > 0 ? `${disabledIds.length} fail lama yang sama telah dinyahaktifkan.` : undefined,
      })
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

  const setActive = async (fail: Fail, isActive: boolean) => {
    try {
      const response = await fetch(`/api/fail/${fail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) throw new Error("Failed to change fail status")
      const saved: Fail = await response.json()
      setItems((prev) => prev.map((f) => (f.id === saved.id ? saved : f)))
      toast.success(isActive ? `Fail ${fail.noFail} diaktifkan semula` : `Fail ${fail.noFail} dinyahaktifkan`, {
        description: isActive ? undefined : "Ia tidak lagi muncul dalam borang Surat baharu. Surat lama tidak berubah.",
      })
    } catch (error) {
      console.error("Error changing fail status:", error)
      toast.error("Gagal menukar status fail")
    }
  }

  const actionsFor = (fail: Fail) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => openEdit(fail) },
    fail.isActive
      ? { label: "Nyahaktif", icon: RiForbidLine, onSelect: () => setActive(fail, false) }
      : { label: "Aktifkan", icon: RiCheckboxCircleLine, onSelect: () => setActive(fail, true) },
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari part, locker, no fail, pecahan atau unit…"
              className="pl-8"
              aria-label="Cari fail"
            />
          </div>
          <div className={cx("grid gap-2 sm:flex", canViewAll && "grid-cols-2")}>
          {canViewAll && (
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger
                aria-label="Tapis unit"
                className={cx("sm:w-52", unitFilter !== ALL_UNITS && "ring-border-button-active")}
              >
                {/* div, not span: the trigger line-clamps direct span children */}
                <div className="flex min-w-0 items-center gap-1.5">
                  <RiFilter3Line className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                  <span className="truncate">
                    <SelectValue />
                  </span>
                </div>
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
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger
              aria-label="Tapis status"
              className={cx("sm:w-44", statusFilter !== "aktif" && "ring-border-button-active")}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {statusFilter === "tidak-aktif" ? (
                  <RiForbidLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                ) : (
                  <RiCheckboxCircleLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                )}
                <span className="truncate">
                  <SelectValue />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="tidak-aktif">Tidak aktif ({inactiveCount})</SelectItem>
              <SelectItem value="semua">Semua status</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">
            {visible.length === 0
              ? statusFilter === "tidak-aktif"
                ? "Tiada fail tidak aktif"
                : "Tiada data fail"
              : query.trim()
                ? "Tiada fail sepadan dengan carian"
                : `Tiada fail untuk unit ${activeUnit}`}
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
                      <tr key={fail.id} className={cx("hover:bg-background-secondary-default", !fail.isActive && "text-text-tertiary")}>
                        <td>
                          <PartBadge part={fail.part} warna={partWarna(lockers, fail)} />
                        </td>
                        <td className="tabular-nums">{fail.noLocker || <Dash />}</td>
                        <td className="tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-body-semibold">{fail.noFail}</span>
                            {!fail.isActive && <InactiveChip />}
                          </span>
                        </td>
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
            <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
              {filtered.map((fail) => (
                <li key={fail.id} className={cx("flex items-start gap-2 rounded-2xl border border-border-button-default p-3", !fail.isActive && "border-dashed")}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cx("text-body-semibold tabular-nums", fail.isActive ? "text-text-primary" : "text-text-tertiary")}>Fail {fail.noFail}</span>
                      <PartBadge part={fail.part} warna={partWarna(lockers, fail)} />
                      {!fail.isActive && <InactiveChip />}
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
          Jumlah: {narrowed ? `${filtered.length} / ` : ""}
          {visible.length} fail{statusFilter === "tidak-aktif" && " tidak aktif"}
          {activeUnit !== ALL_UNITS && ` · Unit ${activeUnit}`}
          {statusFilter === "aktif" && inactiveCount > 0 && ` · ${inactiveCount} tidak aktif disembunyikan`}
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
              <Field
                label="Unit"
                htmlFor="fail-unit"
                required
                hint={canViewAll ? undefined : "Unit diisi automatik berdasarkan role anda"}
              >
                {canViewAll ? (
                  <Select value={form.unit} onValueChange={onPick(setUnit)}>
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
              <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1fr_140px]">
                <Field label="Part" htmlFor="fail-part" required>
                  <Select value={form.part || NONE} onValueChange={onPick(setPart)} disabled={!form.unit}>
                    <SelectTrigger id="fail-part">
                      <SelectValue placeholder={form.unit ? "Pilih part" : "Pilih unit dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {partChoices.length === 0 && (
                        <SelectItem value={NONE} disabled>
                          Tiada part untuk unit ini
                        </SelectItem>
                      )}
                      {partChoices.map((part) => (
                        <SelectItem key={part} value={part}>
                          <PartBadge part={part} warna={partWarna(lockers, { unit: form.unit, part })} />
                          {!isListedPart(part) && <span className="ms-1.5 text-caption-1-regular text-text-tertiary">tiada di Setup Locker</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="No. Locker" htmlFor="fail-locker" required className="w-28 sm:w-auto">
                  <Select
                    value={form.noLocker || NONE}
                    onValueChange={onPick((noLocker) => setForm((prev) => ({ ...prev, noLocker })))}
                    disabled={!form.part}
                  >
                    <SelectTrigger id="fail-locker">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {lockerChoices.length === 0 && (
                        <SelectItem value={NONE} disabled>
                          Tiada locker
                        </SelectItem>
                      )}
                      {lockerChoices.map((noLocker) => (
                        <SelectItem key={noLocker} value={noLocker}>
                          {noLocker}
                          {!isListedLocker(noLocker) && <span className="ms-1.5 text-caption-1-regular text-text-tertiary">lama</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {form.unit && unitLockers.length === 0 && (
                <p className="-mt-1 text-caption-1-regular text-text-secondary">
                  Tiada locker untuk unit {form.unit}.{" "}
                  {onOpenLocker ? (
                    <button
                      type="button"
                      className="font-semibold text-text-destructive underline-offset-2 hover:underline"
                      onClick={() => {
                        setFormOpen(false)
                        onOpenLocker()
                      }}
                    >
                      Tambah di Setup Locker
                    </button>
                  ) : (
                    "Tambah di tab Setup Locker."
                  )}
                </p>
              )}
              <Field label="No. Fail" htmlFor="fail-no" required>
                <Input id="fail-no" value={form.noFail} onChange={setField("noFail")} placeholder="2" aria-describedby={duplicates.length > 0 ? "fail-duplicate" : undefined} />
              </Field>
              {duplicates.length > 0 && (
                <div id="fail-duplicate" className="-mt-1 flex flex-col gap-2 rounded-xl bg-status-yellow-background p-3 text-caption-1-regular text-status-yellow-text">
                  <p>
                    Fail <b>{form.part} · Locker {form.noLocker} · No. {form.noFail}</b> untuk unit {form.unit} sudah wujud
                    {duplicates[0].pecahan || duplicates[0].pecahanKecil
                      ? ` (${[duplicates[0].pecahan, duplicates[0].pecahanKecil].filter(Boolean).join(" · ")})`
                      : ""}
                    {duplicates.length > 1 ? ` dan ${duplicates.length - 1} lagi` : ""}. Adakah anda mahu menyahaktifkan fail lama?
                    Fail lama tidak akan muncul dalam borang Surat baharu, tetapi surat lama tidak berubah.
                  </p>
                  <label className="flex cursor-pointer items-start gap-2 text-caption-1-medium">
                    <Checkbox checked={disableOld} onCheckedChange={(checked) => setDisableOld(checked === true)} className="mt-0.5" />
                    Ya, nyahaktifkan fail lama
                  </label>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pecahan" htmlFor="fail-pecahan">
                  <Input id="fail-pecahan" value={form.pecahan} onChange={setField("pecahan")} />
                </Field>
                <Field label="Pecahan Kecil" htmlFor="fail-pecahan-kecil">
                  <Input id="fail-pecahan-kecil" value={form.pecahanKecil} onChange={setField("pecahanKecil")} />
                </Field>
              </div>
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
                ) : duplicates.length > 0 && disableOld ? (
                  "Simpan & nyahaktif lama"
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
