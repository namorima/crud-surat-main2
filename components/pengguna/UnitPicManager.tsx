"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiForbidLine,
  RiLoader4Line,
  RiSearchLine,
  RiUserLine,
} from "@remixicon/react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
import type { User } from "@/types/user"
import { cx } from "@/utils/cx"

/** One PIC with every unit they are PIC of (unit_pic keeps one row per pair). */
type PicGroup = { pic: string; units: string[]; user?: User; isActive: boolean }

const norm = (s: string) => s.trim().toUpperCase()

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return body.error || fallback
  } catch {
    return fallback
  }
}

function InactiveChip() {
  return (
    <Chip variant="caption" color="neutral">
      Tidak aktif
    </Chip>
  )
}

function UnitChips({ units }: { units: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {units.map((unit) => (
        <Chip key={unit} variant="caption" color="soft">
          {unit}
        </Chip>
      ))}
    </div>
  )
}

/**
 * Pengguna → Unit PIC: who can be picked as Tindakan (PIC) for each unit in the
 * Surat form. Shown per person; one dialog sets all of a person's units.
 */
export function UnitPicManager() {
  const [unitPics, setUnitPics] = useState<UnitPic[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPic, setEditingPic] = useState<string | null>(null)
  const [pic, setPic] = useState("")
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [newUnit, setNewUnit] = useState("")
  const [extraUnits, setExtraUnits] = useState<string[]>([])
  const [picOpen, setPicOpen] = useState(false)
  const [picSearch, setPicSearch] = useState("")

  const [deleting, setDeleting] = useState<PicGroup | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchUnitPics = async () => {
    try {
      const response = await fetch("/api/unit-pic?format=raw")
      if (!response.ok) throw new Error("Failed to fetch")
      setUnitPics(await response.json())
    } catch (error) {
      console.error("Error fetching unit-pics:", error)
      toast.error("Gagal memuatkan data Unit PIC")
    }
  }

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchUnitPics(),
        fetch("/api/auth")
          .then((response) => (response.ok ? response.json() : []))
          // Only active accounts: a replaced account (staff moved unit) is not offered as PIC
          .then((data) => setUsers(Array.isArray(data) ? data.filter((u: User) => u.is_active !== false) : []))
          .catch((error) => console.error("Error fetching users:", error)),
      ])
      setLoading(false)
    }
    load()
  }, [])

  const userByName = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => u.name && map.set(norm(u.name), u))
    return map
  }, [users])

  const groups = useMemo<PicGroup[]>(() => {
    const map = new Map<string, Set<string>>()
    const active = new Set<string>()
    unitPics.forEach((row) => {
      if (!map.has(row.pic)) map.set(row.pic, new Set())
      map.get(row.pic)!.add(row.unit)
      if (row.is_active !== false) active.add(row.pic)
    })
    // Disabled PICs go last
    return Array.from(map, ([name, units]) => ({
      pic: name,
      units: Array.from(units).sort((a, b) => a.localeCompare(b)),
      user: userByName.get(norm(name)),
      isActive: active.has(name),
    })).sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.pic.localeCompare(b.pic))
  }, [unitPics, userByName])

  const allUnits = useMemo(
    () => Array.from(new Set([...unitPics.map((row) => row.unit), ...extraUnits])).sort((a, b) => a.localeCompare(b)),
    [unitPics, extraUnits],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.pic.toLowerCase().includes(q) ||
        (g.user?.id || "").toLowerCase().includes(q) ||
        g.units.some((unit) => unit.toLowerCase().includes(q)),
    )
  }, [groups, query])

  const inactiveCount = groups.filter((g) => !g.isActive).length
  const editingGroup = editingPic ? groups.find((g) => g.pic === editingPic) : undefined

  const unitsOf = (name: string) => groups.find((g) => norm(g.pic) === norm(name))?.units ?? []

  // PIC choices: every user, then PICs who are not system users (kept so old data stays editable)
  const picChoices = useMemo(() => {
    const fromUsers = users
      .filter((u) => u.name)
      .map((u) => ({ name: u.name, sub: [u.id, u.role].filter(Boolean).join(" · "), isUser: true }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const others = groups.filter((g) => !g.user).map((g) => ({ name: g.pic, sub: "Bukan pengguna sistem", isUser: false }))
    return { fromUsers, others }
  }, [users, groups])

  const openAdd = () => {
    setEditingPic(null)
    setPic("")
    setSelectedUnits([])
    setNewUnit("")
    setExtraUnits([])
    setDialogOpen(true)
  }

  const openEdit = (group: PicGroup) => {
    setEditingPic(group.pic)
    setPic(group.pic)
    setSelectedUnits(group.units)
    setNewUnit("")
    setExtraUnits([])
    setDialogOpen(true)
  }

  const choosePic = (name: string) => {
    // Reuse the spelling already stored ("SITI AMINAH" vs user "Siti Aminah") so the
    // same person never ends up as two PICs in the Surat form
    const existingGroup = groups.find((g) => norm(g.pic) === norm(name))
    setPic(existingGroup?.pic ?? name)
    setPicOpen(false)
    setPicSearch("")
    // Picking someone who already has units carries them in, so saving never drops any
    if (existingGroup) setSelectedUnits((prev) => Array.from(new Set([...prev, ...existingGroup.units])))
  }

  const toggleUnit = (unit: string) =>
    setSelectedUnits((prev) => (prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]))

  const addNewUnit = () => {
    const unit = newUnit.trim().toUpperCase()
    if (!unit) return
    if (!allUnits.includes(unit)) setExtraUnits((prev) => [...prev, unit])
    setSelectedUnits((prev) => (prev.includes(unit) ? prev : [...prev, unit]))
    setNewUnit("")
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pic.trim()) {
      toast.error("Sila pilih PIC")
      return
    }
    if (selectedUnits.length === 0) {
      toast.error("Pilih sekurang-kurangnya satu unit")
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("/api/unit-pic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pic: pic.trim(),
          units: selectedUnits,
          previousPic: editingPic && editingPic !== pic.trim() ? editingPic : undefined,
        }),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menyimpan Unit PIC"))
      await fetchUnitPics()
      setDialogOpen(false)
      toast.success(`${pic.trim()}: ${selectedUnits.length} unit disimpan`)
    } catch (error: any) {
      console.error("Error saving unit-pic:", error)
      toast.error(error.message || "Gagal menyimpan Unit PIC")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deleting) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/unit-pic?pic=${encodeURIComponent(deleting.pic)}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Gagal memadam Unit PIC"))
      await fetchUnitPics()
      toast.success(`${deleting.pic} dibuang dari semua unit`)
      setDeleting(null)
    } catch (error: any) {
      console.error("Error deleting unit-pic:", error)
      toast.error(error.message || "Gagal memadam Unit PIC")
    } finally {
      setSubmitting(false)
    }
  }

  const setActive = async (name: string, isActive: boolean) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/unit-pic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pic: name, isActive }),
      })
      if (!response.ok) throw new Error(await readError(response, "Gagal menukar status PIC"))
      setUnitPics((prev) => prev.map((row) => (row.pic === name ? { ...row, is_active: isActive } : row)))
      toast.success(isActive ? `${name} diaktifkan semula` : `${name} dinyahaktifkan`, {
        description: isActive
          ? "Boleh dipilih semula sebagai Tindakan PIC."
          : "Tidak lagi dipaparkan dalam borang Surat baharu. Surat sedia ada tidak berubah.",
      })
      setDialogOpen(false)
    } catch (error: any) {
      console.error("Error changing PIC status:", error)
      toast.error(error.message || "Gagal menukar status PIC")
    } finally {
      setSubmitting(false)
    }
  }

  const actionsFor = (group: PicGroup) => [
    { label: "Atur Unit", icon: RiEditLine, onSelect: () => openEdit(group) },
    group.isActive
      ? { label: "Nyahaktif", icon: RiForbidLine, onSelect: () => setActive(group.pic, false) }
      : { label: "Aktifkan", icon: RiCheckboxCircleLine, onSelect: () => setActive(group.pic, true) },
    { label: "Buang dari semua unit", icon: RiDeleteBinLine, onSelect: () => setDeleting(group), danger: true },
  ]

  const picUser = pic ? userByName.get(norm(pic)) : undefined
  const typed = picSearch.trim()
  const typedIsKnown =
    !typed || [...picChoices.fromUsers, ...picChoices.others].some((c) => norm(c.name) === norm(typed))

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Unit PIC</CardTitle>
          <CardDescription>
            Pegawai yang boleh dipilih sebagai Tindakan (PIC) bagi setiap unit dalam borang Surat. Seorang PIC boleh berada
            dalam beberapa unit.
          </CardDescription>
        </div>
        <Button size="small" leadingIcon={RiAddLine} onClick={openAdd} className="shrink-0 self-start">
          Tambah PIC
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari PIC atau unit…"
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
            {groups.length === 0 ? "Tiada data Unit PIC" : "Tiada padanan untuk carian"}
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
                      <th className="w-[34%]">PIC</th>
                      <th>Unit</th>
                      <th className="w-[56px]">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {filtered.map((group) => (
                      <tr key={group.pic} className={cx("hover:bg-background-secondary-default", !group.isActive && "opacity-60")}>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-body-semibold text-text-primary">{group.pic}</span>
                              {!group.isActive && <InactiveChip />}
                            </span>
                            <span className="text-caption-1-regular text-text-tertiary">
                              {group.user ? group.user.id : "Bukan pengguna sistem"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <UnitChips units={group.units} />
                        </td>
                        <td className="text-end">
                          <RowActions actions={actionsFor(group)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones: compact cards, tap the card to set units */}
            <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
              {filtered.map((group) => (
                <li
                  key={group.pic}
                  className={cx("flex items-start gap-2 rounded-2xl border border-border-button-default p-3", !group.isActive && "border-dashed opacity-70")}
                >
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    className="motion-press flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                  >
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate text-body-semibold text-text-primary">{group.pic}</span>
                      <span className="shrink-0 text-caption-1-regular text-text-tertiary">
                        {group.units.length} unit{!group.user && " · bukan pengguna"}
                      </span>
                      {!group.isActive && <InactiveChip />}
                    </span>
                    <UnitChips units={group.units} />
                  </button>
                  <RowActions className="-me-1.5 size-7" actions={actionsFor(group)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">
          Jumlah: {groups.length} PIC dalam {allUnits.length - extraUnits.length} unit
          {inactiveCount > 0 && ` · ${inactiveCount} tidak aktif`}
        </p>
      </CardFooter>

      {/* Atur Unit: one person, all their units */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`${dialogFrameClass} sm:max-w-lg`}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
              {editingPic ? `Atur Unit · ${editingPic}` : "Tambah PIC"}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editingGroup && !editingGroup.isActive
                ? "PIC ini tidak aktif: tidak dipaparkan dalam borang Surat baharu."
                : "Pilih pegawai, kemudian tandakan semua unit yang dijaganya."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className={dialogBodyClass}>
              <FormField label="PIC (Person In Charge)" htmlFor="unitpic-pic" required>
                <Popover open={picOpen} onOpenChange={setPicOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="unitpic-pic"
                      className="flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-2lg bg-background-tertiary-default px-2.5 text-left text-body-regular text-text-primary outline-none ring-2 ring-inset ring-transparent hover:ring-border-button-hover focus-visible:ring-border-button-active data-[state=open]:ring-border-button-active"
                    >
                      <span className={cx("flex min-w-0 items-center gap-1.5", !pic && "text-text-tertiary")}>
                        <RiUserLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                        <span className="truncate">{pic || "Pilih pengguna"}</span>
                      </span>
                      <RiArrowDownSLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama atau username…" value={picSearch} onValueChange={setPicSearch} />
                      <CommandList className="max-h-[min(18rem,50dvh)]">
                        <CommandEmpty>Tiada pengguna sepadan</CommandEmpty>
                        <CommandGroup heading="Pengguna">
                          {picChoices.fromUsers.map((c, i) => (
                            <CommandItem key={`u-${i}-${c.name}`} value={`${c.name} ${c.sub}`} onSelect={() => choosePic(c.name)}>
                              <RiCheckLine className={cx("mr-2 size-4", norm(pic) === norm(c.name) ? "opacity-100" : "opacity-0")} />
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate">{c.name}</span>
                                <span className="truncate text-caption-1-regular text-text-tertiary">{c.sub}</span>
                              </span>
                              {unitsOf(c.name).length > 0 && (
                                <span className="ms-2 shrink-0 text-caption-2-regular text-text-tertiary">{unitsOf(c.name).length} unit</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {picChoices.others.length > 0 && (
                          <CommandGroup heading="PIC sedia ada (bukan pengguna)">
                            {picChoices.others.map((c) => (
                              <CommandItem key={`o-${c.name}`} value={`${c.name} lain`} onSelect={() => choosePic(c.name)}>
                                <RiCheckLine className={cx("mr-2 size-4", norm(pic) === norm(c.name) ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{c.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {!typedIsKnown && (
                          <CommandGroup heading="Nama lain">
                            <CommandItem value={`__typed ${typed}`} onSelect={() => choosePic(typed.toUpperCase())}>
                              <RiAddLine className="mr-2 size-4" />
                              Guna nama “{typed.toUpperCase()}”
                            </CommandItem>
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {pic && !picUser && (
                  <p className="text-caption-2-regular text-text-tertiary">Nama ini bukan pengguna sistem.</p>
                )}
              </FormField>

              <FormField
                label={
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>
                      Unit <span className="text-text-destructive">*</span>
                      <span className="ms-1.5 font-normal text-text-tertiary tabular-nums">{selectedUnits.length} dipilih</span>
                    </span>
                    <span className="flex gap-1">
                      <Button type="button" variant="ghost" size="xs" onClick={() => setSelectedUnits(allUnits)}>
                        Semua
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => setSelectedUnits([])}>
                        Kosongkan
                      </Button>
                    </span>
                  </span>
                }
              >
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Unit">
                  {allUnits.map((unit) => {
                    const active = selectedUnits.includes(unit)
                    return (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleUnit(unit)}
                        className={cx(
                          "motion-press inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-caption-1-medium outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                          active
                            ? "border-accent-600 bg-accent-600 text-text-white"
                            : "border-border-button-default text-text-secondary hover:bg-background-secondary-default hover:text-text-primary",
                        )}
                      >
                        {active && <RiCheckLine className="size-3.5" aria-hidden />}
                        {unit}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addNewUnit()
                      }
                    }}
                    placeholder="Unit baharu"
                    aria-label="Unit baharu"
                  />
                  <Button type="button" variant="secondary" size="small" leadingIcon={RiAddLine} onClick={addNewUnit} disabled={!newUnit.trim()}>
                    Tambah
                  </Button>
                </div>
              </FormField>
            </div>
            <div className={dialogFooterClass}>
              {editingGroup && (
                <Button
                  type="button"
                  variant={editingGroup.isActive ? "danger" : "secondary"}
                  size="small"
                  leadingIcon={editingGroup.isActive ? RiForbidLine : RiCheckboxCircleLine}
                  onClick={() => setActive(editingGroup.pic, !editingGroup.isActive)}
                  disabled={submitting}
                  className="flex-1 sm:me-auto sm:flex-none"
                >
                  {editingGroup.isActive ? "Nyahaktif" : "Aktifkan"}
                </Button>
              )}
              <Button type="button" variant="secondary" size="small" onClick={() => setDialogOpen(false)} disabled={submitting} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" size="small" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !submitting && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buang {deleting?.pic} dari semua unit?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.pic} tidak lagi boleh dipilih sebagai PIC bagi {deleting?.units.join(", ")}. Surat sedia ada tidak
              berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={submitting} className="bg-button-danger">
              {submitting && <RiLoader4Line className="animate-spin" />}
              {submitting ? "Memadam..." : "Buang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
