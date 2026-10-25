"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { RiAddLine, RiArrowDownSLine, RiCheckLine, RiCloseLine, RiLoader4Line } from "@remixicon/react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/base/buttons/button"
import { cx } from "@/utils/cx"
import type { ShareLinkFilter } from "@/types/share-link"

interface FormOptions {
  daripadaSuggestions: string[]
  allContracts: string[]
  allCategories: string[]
  contractorData: Record<string, string>
  statusBayaranData: Array<{ status: string; colorHex: string }>
}

interface ShareLinkFormProps {
  onSubmit: (filter: ShareLinkFilter, expiresAt?: string, description?: string) => Promise<void>
  isSubmitting: boolean
  onCancel?: () => void
}

const KATEGORI_OPTIONS = ["PERTANIAN AM", "ANGKUT BTS", "PIECERATE", "KIMIA", "KONTRAK"]

/** Trigger styled like an input; opens a popover. */
const triggerClass =
  "flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-2lg bg-background-tertiary-default px-2.5 text-left text-body-regular text-text-primary outline-none ring-2 ring-inset ring-transparent transition-[box-shadow] hover:ring-border-button-hover focus-visible:ring-border-button-active data-[state=open]:ring-border-button-active"

function Field({ label, htmlFor, className, children }: { label: ReactNode; htmlFor?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-caption-1-medium text-text-secondary">
        {label}
      </Label>
      {children}
    </div>
  )
}

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-table p-3 sm:p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="flex items-center gap-2 text-body-semibold text-text-primary">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-caption-2-semibold text-text-secondary">
            {step}
          </span>
          {title}
        </h3>
        {hint && <p className="ps-7 text-caption-1-regular text-text-tertiary">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function SelectedChips({ values, onRemove }: { values: string[]; onRemove: (value: string) => void }) {
  if (values.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-background-secondary-default py-0.5 ps-1.5 pe-0.5 text-caption-1-medium text-text-primary"
        >
          <span className="min-w-0 truncate">{value}</span>
          <button
            type="button"
            onClick={() => onRemove(value)}
            aria-label={`Buang ${value}`}
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-foreground-icon-tertiary hover:bg-background-tertiary-default hover:text-foreground-icon-primary"
          >
            <RiCloseLine className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  )
}

/** Searchable multi-select: popover list with checkboxes, picks shown as removable chips. */
function MultiPick({
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
  selected,
  onChange,
}: {
  label: string
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <Field label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={triggerClass}>
            <span className={cx("truncate", selected.length === 0 && "text-text-tertiary")}>
              {selected.length === 0 ? placeholder : `${selected.length} dipilih`}
            </span>
            {selected.length === 0 ? (
              <RiAddLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
            ) : (
              <RiArrowDownSLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option} onSelect={() => toggle(option)}>
                    <Checkbox checked={selected.includes(option)} className="mr-2" />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <SelectedChips values={selected} onRemove={toggle} />
    </Field>
  )
}

export function ShareLinkForm({ onSubmit, isSubmitting, onCancel }: ShareLinkFormProps) {
  const [formOptions, setFormOptions] = useState<FormOptions>({
    daripadaSuggestions: [],
    allContracts: [],
    allCategories: [],
    contractorData: {},
    statusBayaranData: [],
  })
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedKategori, setSelectedKategori] = useState<string[]>([])
  const [selectedKontrak, setSelectedKontrak] = useState<string[]>([])
  const [selectedKawasan, setSelectedKawasan] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedKontraktor, setSelectedKontraktor] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange>()

  // Form fields
  const [description, setDescription] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>()
  const [noExpiry, setNoExpiry] = useState(true)

  // Popover states
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [expiryOpen, setExpiryOpen] = useState(false)

  // Two months side by side only where they fit
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)")
    const update = () => setWide(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const response = await fetch("/api/bayaran-form-data")
        if (!response.ok) throw new Error("Failed to fetch form options")
        const data = await response.json()

        setFormOptions({
          daripadaSuggestions: data.daripadaSuggestions || [],
          allContracts: data.allContracts || [],
          allCategories: data.allCategories || [],
          contractorData: data.contractorData || {},
          statusBayaranData: data.statusBayaranData || [],
        })
      } catch {
        toast.error("Gagal memuatkan pilihan filter")
      } finally {
        setLoading(false)
      }
    }

    fetchFormOptions()
  }, [])

  const allKontraktorNames = useMemo(() => {
    return Array.from(new Set(Object.values(formOptions.contractorData))).filter(Boolean)
  }, [formOptions.contractorData])

  const handleSubmit = async () => {
    // Build filter object
    const filter: ShareLinkFilter = {}

    if (selectedKategori.length > 0) filter.kategori = selectedKategori
    if (selectedKontrak.length > 0) filter.noKontrak = selectedKontrak
    if (selectedKawasan.length > 0) filter.kawasan = selectedKawasan
    if (selectedStatus.length > 0) filter.statusBayaran = selectedStatus
    if (selectedKontraktor.length > 0) filter.namaKontraktor = selectedKontraktor
    if (dateRange?.from || dateRange?.to) {
      filter.dateRange = {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      }
    }

    // Validation - at least one filter required
    if (Object.keys(filter).length === 0) {
      toast.error("Sila pilih sekurang-kurangnya satu filter")
      return
    }

    if (!noExpiry && !expiryDate) {
      toast.error("Sila pilih tarikh luput atau tandakan Tiada tarikh luput")
      return
    }

    const expiresAtString = noExpiry ? undefined : expiryDate?.toISOString()

    await onSubmit(filter, expiresAtString, description || undefined)
  }

  const handleReset = () => {
    setSelectedKategori([])
    setSelectedKontrak([])
    setSelectedKawasan([])
    setSelectedStatus([])
    setSelectedKontraktor([])
    setDateRange(undefined)
    setDescription("")
    setExpiryDate(undefined)
    setNoExpiry(true)
  }

  const toggleKategori = (value: string) =>
    setSelectedKategori((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-body-regular text-text-secondary">
        <RiLoader4Line className="size-5 animate-spin" aria-hidden />
        Memuatkan...
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:gap-4 sm:px-6">
        <Section step={1} title="Penapis Data" hint="Pilih sekurang-kurangnya satu. Penerima pautan hanya melihat rekod yang sepadan.">
          <Field label="Kategori">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kategori">
              {KATEGORI_OPTIONS.map((kategori) => {
                const active = selectedKategori.includes(kategori)
                return (
                  <button
                    key={kategori}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleKategori(kategori)}
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2 text-caption-1-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                      active
                        ? "border-accent-600 bg-accent-600 text-text-white"
                        : "border-border-button-default text-text-secondary hover:bg-background-secondary-default hover:text-text-primary",
                    )}
                  >
                    {active && <RiCheckLine className="size-3.5" aria-hidden />}
                    {kategori}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <MultiPick
              label="No Kontrak"
              placeholder="Pilih kontrak"
              searchPlaceholder="Cari kontrak..."
              emptyText="Tiada kontrak dijumpai"
              options={formOptions.allContracts}
              selected={selectedKontrak}
              onChange={setSelectedKontrak}
            />
            <MultiPick
              label="Nama Kontraktor"
              placeholder="Pilih kontraktor"
              searchPlaceholder="Cari kontraktor..."
              emptyText="Tiada kontraktor dijumpai"
              options={allKontraktorNames}
              selected={selectedKontraktor}
              onChange={setSelectedKontraktor}
            />
            <MultiPick
              label="Kawasan"
              placeholder="Pilih kawasan"
              searchPlaceholder="Cari kawasan..."
              emptyText="Tiada kawasan dijumpai"
              options={formOptions.daripadaSuggestions}
              selected={selectedKawasan}
              onChange={setSelectedKawasan}
            />
            <MultiPick
              label="Status Bayaran"
              placeholder="Pilih status"
              searchPlaceholder="Cari status..."
              emptyText="Tiada status dijumpai"
              options={formOptions.statusBayaranData.map((item) => item.status)}
              selected={selectedStatus}
              onChange={setSelectedStatus}
            />
          </div>

          <Field label="Julat Tarikh" htmlFor="date-range">
            <div className="flex items-center gap-1.5">
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <button type="button" id="date-range" className={cx(triggerClass, "md:max-w-[calc(50%-0.375rem)]")}>
                    <span className={cx("truncate tabular-nums", !dateRange?.from && "text-text-tertiary")}>
                      {dateRange?.from
                        ? dateRange.to
                          ? `${dateRange.from.toLocaleDateString("ms-MY")} - ${dateRange.to.toLocaleDateString("ms-MY")}`
                          : dateRange.from.toLocaleDateString("ms-MY")
                        : "Pilih tarikh"}
                    </span>
                    <RiArrowDownSLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range)
                      if (range?.from && range?.to) {
                        setDateRangeOpen(false)
                      }
                    }}
                    captionLayout="dropdown"
                    initialFocus
                    numberOfMonths={wide ? 2 : 1}
                  />
                </PopoverContent>
              </Popover>
              {dateRange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  iconOnly
                  leadingIcon={RiCloseLine}
                  aria-label="Padam tarikh"
                  onClick={() => setDateRange(undefined)}
                />
              )}
            </div>
          </Field>
        </Section>

        <Section step={2} title="Tetapan Pautan">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tarikh Luput" htmlFor="expiry-date">
              <label className="flex h-9 cursor-pointer items-center gap-2 text-body-regular text-text-primary">
                <Checkbox id="no-expiry" checked={noExpiry} onCheckedChange={(checked) => setNoExpiry(checked === true)} />
                Tiada tarikh luput
              </label>
              {!noExpiry && (
                <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" id="expiry-date" className={triggerClass}>
                      <span className={cx("truncate tabular-nums", !expiryDate && "text-text-tertiary")}>
                        {expiryDate ? expiryDate.toLocaleDateString("ms-MY") : "Pilih tarikh"}
                      </span>
                      <RiArrowDownSLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setExpiryDate(date)
                        setExpiryOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </Field>
            <Field label="Keterangan" htmlFor="description">
              <Textarea
                id="description"
                placeholder="Contoh: Untuk audit Q1 2025"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
          </div>
        </Section>
      </div>

      <div className="flex gap-2 border-t border-border-table px-4 py-3 sm:px-6">
        <Button type="button" variant="ghost" size="small" onClick={handleReset} disabled={isSubmitting}>
          Reset
        </Button>
        <div className="ms-auto flex gap-2">
          {onCancel && (
            <Button type="button" variant="secondary" size="small" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
          )}
          <Button type="button" size="small" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                Menjana...
              </span>
            ) : (
              "Jana Pautan"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
