"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import {
  RiArrowDownLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiChat3Line,
  RiCheckLine,
  RiFileCopyLine,
  RiHandHeartLine,
  RiLoader4Line,
  RiMailLine,
  RiReplyLine,
} from "@remixicon/react"
import type { Fail } from "@/types/fail"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { Checkbox } from "@/components/base/checkbox/checkbox"
import { cx } from "@/utils/cx"

const STATUSES = ["BELUM PROSES", "HOLD / KIV", "DALAM TINDAKAN", "SELESAI", "BATAL"] as const

/** How the surat was sent or received; a new surat starts as MELALUI EMEL. */
export const KAEDAH = ["MELALUI EMEL", "SERAHAN TANGAN"] as const

/** Fail part dots keep the hues of FAIL_PART_COLORS. */
const FAIL_PART_DOT: Record<string, string> = {
  HASIL: "bg-yellow-400",
  "PERTANIAN AM": "bg-lime-500",
  KONTRAK: "bg-orange-400",
}

export type SuratFormData = {
  daripadaKepada: string
  tarikh: string
  perkara: string
  kategori: string
  kaedah: string
  unit: string
  tindakanPic: string
  status: string
  tarikhSelesai: string
  nota: string
  komen: string
  reference: string
  untukMakluman: boolean
}

export interface SuratFormDialogProps {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: SuratFormData
  formErrors: Record<string, string>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (name: string, value: string) => void
  /** Ticked: status SELESAI with today's tarikh selesai */
  onUntukMaklumanChange: (checked: boolean) => void
  /** Add mode: the surat this one replies to. */
  referenceBil?: number | null
  /** Add mode, Respon: perkara of the surat being answered, offered as a one-tap copy */
  referencePerkara?: string
  daripadaKepadaSuggestions: string[]
  perkaraSuggestions: string[]
  unitOptions: string[]
  unitLocked?: boolean
  unitPicMap: Record<string, string[]>
  failOptions: Fail[]
  selectedFailId: string
  failComboboxOpen: boolean
  setFailComboboxOpen: (open: boolean) => void
  formatFailDisplay: (fail: Fail) => string
  formatDateToDisplay: (date: string) => string
  canComment: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  error?: string
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
      {error ? (
        <p className="text-caption-1-regular text-text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-caption-2-regular text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  )
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-table p-3 sm:p-4">
      <h3 className="flex items-center gap-2 text-body-semibold text-text-primary">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-caption-2-semibold text-text-secondary">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

const errorRing = "ring-2 ring-inset ring-border-error-default"

/** Tambah / Edit Surat in one BoardUI form; the page keeps all state and saving. */
export function SuratFormDialog(props: SuratFormDialogProps) {
  const {
    mode,
    open,
    onOpenChange,
    formData,
    formErrors,
    onInputChange,
    onSelectChange,
    referenceBil,
    unitPicMap,
    failOptions,
    selectedFailId,
    failComboboxOpen,
    setFailComboboxOpen,
    formatFailDisplay,
    formatDateToDisplay,
    saving,
  } = props
  const id = (name: string) => (mode === "edit" ? `${name}-edit` : name)
  // Perkara is a textarea (long subjects wrap), so its suggestions are our own list, not a datalist
  const [perkaraFocused, setPerkaraFocused] = useState(false)
  const isKeluar = formData.kategori === "KELUAR"
  // Both KELUAR and Untuk Makluman save as SELESAI
  const statusLocked = isKeluar || formData.untukMakluman
  const selectedFail = failOptions.find((fail) => fail.id === selectedFailId)
  const activePics = (formData.unit && unitPicMap[formData.unit]) || []
  // A surat being edited keeps its PIC even if that PIC was disabled (or moved) since
  const keepsOldPic = mode === "edit" && !!formData.tindakanPic && !activePics.includes(formData.tindakanPic)
  const pics = keepsOldPic ? [...activePics, formData.tindakanPic] : activePics

  const suggestions = (list: string[], value: string) =>
    list.filter((p) => p.toLowerCase().includes((value || "").toLowerCase())).slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-[860px] sm:p-0">
        <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-headline-semibold text-text-primary">{mode === "edit" ? "Edit Surat" : "Tambah Surat Baru"}</DialogTitle>
            {mode === "add" && referenceBil && (
              <Chip variant="caption" color="blue" className="gap-1">
                <RiReplyLine className="size-3.5" aria-hidden />
                Respon kepada #{referenceBil}
              </Chip>
            )}
          </div>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {mode === "edit" ? "Kemaskini maklumat surat." : "Masukkan maklumat surat baru."} Medan bertanda * wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <Section step={1} title="Maklumat Surat">
              <Field label="Kategori">
                {/* Two-option toggle; MASUK/KELUAR also changes the status rules below */}
                <div role="radiogroup" aria-label="Kategori" className="grid grid-cols-2 gap-1 rounded-2lg bg-background-tertiary-default p-1">
                  {(["MASUK", "KELUAR"] as const).map((k) => {
                    const active = formData.kategori === k
                    return (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onSelectChange("kategori", k)}
                        className={cx(
                          "flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg text-body-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                          active
                            ? cx("bg-background-primary-default shadow-xs dark:bg-neutral-700", k === "MASUK" ? "text-rose-600 dark:text-rose-400" : "text-accent-600 dark:text-accent-400")
                            : "text-text-secondary hover:text-text-primary",
                        )}
                      >
                        {k === "MASUK" ? <RiArrowDownLine className="size-4" aria-hidden /> : <RiArrowUpLine className="size-4" aria-hidden />}
                        {k}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field label="Kaedah">
                <div role="radiogroup" aria-label="Kaedah" className="grid grid-cols-2 gap-1 rounded-2lg bg-background-tertiary-default p-1">
                  {KAEDAH.map((k) => {
                    const active = formData.kaedah === k
                    const Icon = k === "MELALUI EMEL" ? RiMailLine : RiHandHeartLine
                    return (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onSelectChange("kaedah", k)}
                        className={cx(
                          "flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg text-body-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                          active
                            ? "bg-background-primary-default text-text-primary shadow-xs dark:bg-neutral-700"
                            : "text-text-secondary hover:text-text-primary",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        {k}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-[1fr_9rem] gap-3">
                <Field label={isKeluar ? "Kepada" : "Daripada"} htmlFor={id("daripadaKepada")}>
                  <Input
                    id={id("daripadaKepada")}
                    name="daripadaKepada"
                    value={formData.daripadaKepada}
                    onChange={onInputChange}
                    list={id("daripadaKepada-suggestions")}
                    autoComplete="off"
                  />
                  <datalist id={id("daripadaKepada-suggestions")}>
                    {suggestions(props.daripadaKepadaSuggestions, formData.daripadaKepada).map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Tarikh" htmlFor={id("tarikh")} hint={formatDateToDisplay(formData.tarikh) || "DD/MM/YYYY"}>
                  <Input id={id("tarikh")} name="tarikh" type="date" value={formData.tarikh} onChange={onInputChange} />
                </Field>
              </div>

              <Field
                label={
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>Perkara</span>
                    {mode === "add" && referenceBil && props.referencePerkara && (
                      <button
                        type="button"
                        onClick={() => onSelectChange("perkara", props.referencePerkara!)}
                        className="motion-press inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-caption-1-medium text-accent-600 outline-none hover:bg-background-secondary-default focus-visible:ring-2 focus-visible:ring-border-focus-ring dark:text-accent-400"
                      >
                        <RiFileCopyLine className="size-3.5" aria-hidden />
                        Salin perkara surat #{referenceBil}
                      </button>
                    )}
                  </span>
                }
                htmlFor={id("perkara")}
              >
                <div className="relative">
                  <Textarea
                    id={id("perkara")}
                    name="perkara"
                    value={formData.perkara}
                    onChange={onInputChange}
                    onFocus={() => setPerkaraFocused(true)}
                    onBlur={() => setPerkaraFocused(false)}
                    rows={3}
                    autoComplete="off"
                    className="min-h-[4.75rem] resize-y [field-sizing:content] max-h-48"
                  />
                  {perkaraFocused && formData.perkara.trim().length >= 2 && (() => {
                    const matches = suggestions(props.perkaraSuggestions, formData.perkara).filter((v) => v !== formData.perkara)
                    if (matches.length === 0) return null
                    return (
                      <ul
                        role="listbox"
                        aria-label="Cadangan perkara"
                        className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border-button-default bg-background-primary-default p-1 shadow-dropdown"
                      >
                        {matches.map((v) => (
                          <li key={v}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              // mousedown keeps the textarea focused until the pick lands
                              onMouseDown={(e) => {
                                e.preventDefault()
                                onSelectChange("perkara", v)
                              }}
                              className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-body-regular text-text-primary hover:bg-background-secondary-default"
                            >
                              {v}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>
              </Field>

              {mode === "add" && referenceBil && (
                <Field label="Reference (Bil surat asal)" htmlFor="reference">
                  <Input id="reference" name="reference" value={formData.reference} readOnly disabled />
                </Field>
              )}
            </Section>

            <Section step={2} title="Tindakan">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit" htmlFor={id("unit")} required error={formErrors.unit}>
                  <Select value={formData.unit} onValueChange={(v) => onSelectChange("unit", v)} disabled={props.unitLocked}>
                    <SelectTrigger id={id("unit")} className={cx(formErrors.unit && errorRing)}>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.unitOptions.length > 0 ? (
                        props.unitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit || "unknown"}>
                            {unit || "Unknown"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading">Loading units...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tindakan PIC" htmlFor={id("tindakanPic")} required error={formErrors.tindakanPic}>
                  <Select value={formData.tindakanPic} onValueChange={(v) => onSelectChange("tindakanPic", v)} disabled={!formData.unit}>
                    <SelectTrigger id={id("tindakanPic")} className={cx(formErrors.tindakanPic && errorRing)}>
                      <SelectValue placeholder={formData.unit ? "Pilih PIC" : "Pilih unit dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pics.length > 0 ? (
                        pics.map((pic) => (
                          <SelectItem key={pic} value={pic || "unknown"}>
                            {pic || "Unknown"}
                            {keepsOldPic && pic === formData.tindakanPic && (
                              <span className="ms-1.5 text-caption-1-regular text-text-tertiary">tiada dalam senarai PIC</span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-pic">Tiada PIC</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Fail" htmlFor={id("fail")}>
                <Popover open={failComboboxOpen} onOpenChange={setFailComboboxOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id={id("fail")}
                      type="button"
                      role="combobox"
                      aria-expanded={failComboboxOpen}
                      disabled={!formData.unit}
                      className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-2lg bg-background-tertiary-default px-2.5 text-left text-body-regular ring-2 ring-inset ring-transparent outline-none transition-[box-shadow] hover:ring-border-button-hover focus-visible:ring-border-button-active disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text"
                    >
                      {selectedFail ? (
                        <span className="flex min-w-0 items-center gap-2 text-text-primary">
                          <span className={cx("size-2 shrink-0 rounded-full", FAIL_PART_DOT[selectedFail.part] ?? "bg-neutral-300")} aria-hidden />
                          <span className="truncate">{formatFailDisplay(selectedFail)}</span>
                        </span>
                      ) : (
                        <span className="truncate text-text-tertiary">{formData.unit ? "Pilih fail" : "Pilih unit dahulu"}</span>
                      )}
                      <RiArrowUpDownLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari fail..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>
                          {formData.unit ? (
                            <div className="p-2 text-center text-caption-1-regular">
                              <p className="text-text-secondary">Tiada fail untuk unit ini.</p>
                              <p className="mt-1">
                                Sila ke{" "}
                                <Link href="/dashboard/tetapan?from=surat" className="font-bold text-red-600 hover:text-red-700 hover:underline">
                                  Setup Fail
                                </Link>{" "}
                                untuk tambah pilihan fail.
                              </p>
                            </div>
                          ) : (
                            "Pilih unit dahulu"
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {failOptions.map((fail) => (
                            <CommandItem
                              key={fail.id}
                              value={formatFailDisplay(fail)}
                              onSelect={() => {
                                onSelectChange("fail", fail.id)
                                setFailComboboxOpen(false)
                              }}
                            >
                              <span className={cx("size-2 shrink-0 rounded-full", FAIL_PART_DOT[fail.part] ?? "bg-neutral-300")} aria-hidden />
                              <span className="min-w-0 flex-1">{formatFailDisplay(fail)}</span>
                              <RiCheckLine className={cx("size-4 shrink-0", selectedFailId === fail.id ? "opacity-100" : "opacity-0")} aria-hidden />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
            </Section>

            <Section step={3} title="Status">
              <div className="flex flex-col gap-0.5 rounded-xl bg-background-secondary-default px-3 py-2.5 dark:bg-background-primary-default">
                <Checkbox id={id("untukMakluman")} isSelected={formData.untukMakluman} onChange={props.onUntukMaklumanChange}>
                  Untuk Makluman
                </Checkbox>
                <p className="ps-6 text-caption-2-regular text-text-tertiary">Status terus SELESAI dengan tarikh selesai hari ini.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Status"
                  htmlFor={id("status")}
                  required
                  error={formErrors.status}
                  hint={formData.untukMakluman ? "Untuk makluman terus SELESAI." : isKeluar ? "Surat keluar terus SELESAI." : undefined}
                >
                  <Select value={formData.status} onValueChange={(v) => onSelectChange("status", v)} disabled={statusLocked}>
                    <SelectTrigger id={id("status")} className={cx("text-left", formErrors.status && errorRing)}>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Tarikh Selesai"
                  htmlFor={id("tarikhSelesai")}
                  hint={formatDateToDisplay(formData.tarikhSelesai) || (formData.status !== "SELESAI" && !statusLocked ? "Untuk status SELESAI" : "DD/MM/YYYY")}
                >
                  <Input
                    id={id("tarikhSelesai")}
                    name="tarikhSelesai"
                    type="date"
                    value={formData.tarikhSelesai}
                    onChange={onInputChange}
                    disabled={formData.status !== "SELESAI" && !statusLocked}
                  />
                </Field>
              </div>
            </Section>

            <div className="flex flex-col gap-3">
              <Field label="Nota" htmlFor={id("nota")}>
                <Textarea
                  id={id("nota")}
                  name="nota"
                  value={formData.nota}
                  onChange={onInputChange}
                  rows={3}
                  placeholder="Taip #123 untuk pautan ke surat 123."
                />
              </Field>
              {props.canComment && (
                <Field
                  label={
                    <span className="inline-flex items-center gap-1">
                      <RiChat3Line className="size-3.5" aria-hidden />
                      Komen Pengurus
                    </span>
                  }
                  htmlFor={id("komen")}
                >
                  <Textarea
                    id={id("komen")}
                    name="komen"
                    value={formData.komen}
                    onChange={onInputChange}
                    rows={2}
                    placeholder="Tambah komen sebagai pengurus..."
                  />
                </Field>
              )}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border-table px-4 py-3 sm:px-6">
          <Button variant="secondary" size="small" onClick={props.onCancel} disabled={saving} className="flex-1 sm:flex-none">
            Batal
          </Button>
          <Button variant="primary" size="small" onClick={props.onSave} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? (
              <span className="inline-flex items-center gap-1.5">
                <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                Menyimpan...
              </span>
            ) : (
              "Simpan"
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
