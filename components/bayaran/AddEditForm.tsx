"use client"

import type { ReactNode } from "react"
import { RiArrowUpDownLine, RiLockLine } from "@remixicon/react"
import type { Bayaran } from "@/types/bayaran"
import type { User } from "@/types/user"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button as UiButton } from "@/components/ui/button"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { bayaranKategoriChip } from "@/lib/ui-status"
import { cx } from "@/utils/cx"

interface AddEditFormProps {
  showAddDialog: boolean
  setShowAddDialog: (show: boolean) => void
  showEditDialog: boolean
  setShowEditDialog: (show: boolean) => void
  editingBayaran: Bayaran | null
  setEditingBayaran: (bayaran: Bayaran | null) => void
  formData: any
  setFormData: (formData: any) => void
  formOptions: any
  handleSave: () => void
  saving: boolean
  user: User | null
  showDaripadaDropdown: boolean
  setShowDaripadaDropdown: (show: boolean) => void
  handleDaripadaChange: (value: string) => void
  filteredDaripadaSuggestions: string[]
  handleKontrakChange: (value: string) => void
  getAvailableKontraks: () => string[]
  getAvailableKategoris: () => string[]
  handleCurrencyInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatCurrencyInput: (value: string) => string
  shouldShowAdvancedFields: () => boolean
  shouldShowHandoverFields: () => boolean
  shouldShowCompletionFields: () => boolean
  penerimaData: Array<{ name: string; unit: string; display: string; defaultStatus?: string; active?: boolean }>
  /** Legacy class map; kategori options now use BoardUI chips. */
  KATEGORI_COLORS?: Record<string, string>
}

const EMPTY_FORM = {
  daripada: "",
  tarikhTerima: "",
  perkara: "",
  nilaiBayaran: "",
  bayaranKe: "",
  kategori: "",
  noKontrak: "",
  tarikhMemoLadang: "",
  statusLadang: "",
  tarikhHantar: "",
  tarikhPpnP: "",
  tarikhPn: "",
  penerima: "",
  statusBayaran: "",
  tarikhBayar: "",
  nomborBaucer: "",
  notaKaki: "",
}

/** Label + control. */
function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-caption-1-medium text-text-secondary">
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Numbered form section; `hint` replaces the body while the step is not reachable yet. */
function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-table p-3 sm:p-4">
      <h3 className="flex items-center gap-2 text-body-semibold text-text-primary">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-caption-2-semibold text-text-secondary">
          {step}
        </span>
        {title}
      </h3>
      {hint ? <p className="text-caption-1-regular text-text-tertiary">{hint}</p> : children}
    </section>
  )
}

const Dot = ({ color }: { color?: string }) => (
  <span className="size-2.5 shrink-0 rounded-full border border-border-button-default" style={{ backgroundColor: color }} aria-hidden />
)

export function AddEditForm({
  showAddDialog,
  setShowAddDialog,
  showEditDialog,
  setShowEditDialog,
  editingBayaran,
  setEditingBayaran,
  formData,
  setFormData,
  formOptions,
  handleSave,
  saving,
  user,
  showDaripadaDropdown,
  setShowDaripadaDropdown,
  handleDaripadaChange,
  filteredDaripadaSuggestions,
  handleKontrakChange,
  getAvailableKontraks,
  getAvailableKategoris,
  handleCurrencyInputChange,
  formatCurrencyInput,
  shouldShowAdvancedFields,
  shouldShowHandoverFields,
  shouldShowCompletionFields,
  penerimaData,
}: AddEditFormProps) {
  const isEdit = !!editingBayaran
  // KEWANGAN and PENERIMA may only change status bayaran, tarikh bayar and baucer of an existing record
  const locked = (user?.role === "KEWANGAN" || user?.type === "PENERIMA") && isEdit

  // One option per name (Select values must be unique), active accounts only:
  // a deactivated penerima (moved unit) cannot be picked for new records. An
  // older record keeps its penerima selectable even if it is no longer listed.
  const activePenerima = penerimaData.filter((item) => item.active !== false)
  const penerimaOptions = activePenerima.filter(
    (item, i, all) => item.name && all.findIndex((other) => other.name === item.name) === i
  )
  if (formData.penerima && !penerimaOptions.some((item) => item.name === formData.penerima)) {
    const old = penerimaData.find((item) => item.name === formData.penerima)
    penerimaOptions.unshift({
      name: formData.penerima,
      unit: old?.unit ?? "",
      display: old ? `${old.display} · tidak aktif` : formData.penerima,
    })
  }

  const close = () => {
    if (isEdit) {
      setShowEditDialog(false)
      setEditingBayaran(null)
    } else {
      setShowAddDialog(false)
    }
    setFormData({ ...EMPTY_FORM })
  }

  const kontrakSelect = (
    <Select value={formData.noKontrak} onValueChange={handleKontrakChange} disabled={!formData.daripada || locked}>
      <SelectTrigger id="noKontrak">
        <SelectValue placeholder={formData.daripada ? "Pilih no kontrak" : "Pilih Daripada dahulu"} />
      </SelectTrigger>
      <SelectContent>
        {getAvailableKontraks().map((kontrak) => (
          <SelectItem key={kontrak} value={kontrak}>
            {kontrak}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const kategoriSelect = (
    <Select
      value={formData.kategori}
      onValueChange={(value) => setFormData((prev: any) => ({ ...prev, kategori: value }))}
      disabled={!formData.daripada || !formData.noKontrak || locked}
    >
      <SelectTrigger id="kategori">
        <SelectValue placeholder="Pilih kategori" />
      </SelectTrigger>
      <SelectContent>
        {getAvailableKategoris().map((kategori) => (
          <SelectItem key={kategori} value={kategori}>
            <Chip variant="caption" color={bayaranKategoriChip(kategori)}>
              {kategori}
            </Chip>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <Dialog open={showAddDialog || showEditDialog} onOpenChange={isEdit ? setShowEditDialog : setShowAddDialog}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-4xl sm:p-0">
        <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
            {isEdit ? `Edit Rekod Bayaran #${editingBayaran?.ids ?? editingBayaran?.id}` : "Tambah Rekod Bayaran"}
          </DialogTitle>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {locked ? (
              <span className="inline-flex items-center gap-1">
                <RiLockLine className="size-3.5" aria-hidden />
                Untuk peranan anda, hanya Status Bayaran, Tarikh Bayar dan Nombor Baucer boleh dikemas kini.
              </span>
            ) : (
              "Bahagian seterusnya dibuka apabila tarikh sebelumnya diisi."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <Section step={1} title="Maklumat Bayaran">
              {/* Daripada: pick a suggestion or keep what was typed */}
              <Field label="Daripada">
                <Popover open={showDaripadaDropdown} onOpenChange={setShowDaripadaDropdown}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={showDaripadaDropdown}
                      disabled={locked}
                      className={cx(
                        "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-2lg bg-background-tertiary-default px-2.5 text-left text-body-regular ring-2 ring-inset ring-transparent outline-none transition-[box-shadow] hover:ring-border-button-hover focus-visible:ring-border-button-active disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text",
                        formData.daripada ? "text-text-primary" : "text-text-tertiary",
                      )}
                    >
                      <span className="truncate">{formData.daripada || "Pilih atau taip nama/organisasi..."}</span>
                      <RiArrowUpDownLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Cari atau taip nama..."
                        value={formData.daripada}
                        onValueChange={handleDaripadaChange}
                        disabled={locked}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2">
                            <p className="mb-2 text-caption-1-regular text-text-secondary">Tiada hasil dijumpai.</p>
                            <UiButton size="sm" variant="outline" onClick={() => setShowDaripadaDropdown(false)} className="w-full" disabled={locked}>
                              Gunakan "{formData.daripada}"
                            </UiButton>
                          </div>
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {filteredDaripadaSuggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion}
                              value={suggestion}
                              onSelect={() => {
                                setFormData((prev: any) => ({ ...prev, daripada: suggestion, noKontrak: "", kategori: "" }))
                                setShowDaripadaDropdown(false)
                              }}
                            >
                              {suggestion}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>

              <Field label="Tarikh Terima" htmlFor="tarikhTerima">
                <Input
                  id="tarikhTerima"
                  type="date"
                  value={formData.tarikhTerima}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhTerima: e.target.value }))}
                  disabled={locked}
                />
              </Field>

              <Field label="Perkara" htmlFor="perkara">
                <Textarea
                  id="perkara"
                  value={formData.perkara}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, perkara: e.target.value }))}
                  rows={3}
                  placeholder="Cth. Permohonan bayaran piecerate menuai BTS"
                  disabled={locked}
                />
              </Field>

              <div className="grid grid-cols-[1fr_6rem] gap-3">
                <Field label="Nilai Bayaran" htmlFor="nilaiBayaran">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-body-medium text-text-tertiary">RM</span>
                    <Input
                      id="nilaiBayaran"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(formData.nilaiBayaran)}
                      onChange={handleCurrencyInputChange}
                      placeholder="0.00"
                      className="pl-9 tabular-nums"
                      disabled={locked}
                    />
                  </div>
                </Field>
                <Field label="Bayaran Ke" htmlFor="bayaranKe">
                  <Input
                    id="bayaranKe"
                    inputMode="numeric"
                    value={formData.bayaranKe}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, bayaranKe: e.target.value }))}
                    disabled={locked}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="No Kontrak" htmlFor="noKontrak">
                  {kontrakSelect}
                </Field>
                <Field label="Kategori" htmlFor="kategori">
                  {kategoriSelect}
                </Field>
              </div>
            </Section>

            <div className="flex flex-col gap-3 md:gap-4">
              <Section step={2} title="Proses Ladang">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status Ladang">
                    <Select
                      value={formData.statusLadang}
                      onValueChange={(value) => setFormData((prev: any) => ({ ...prev, statusLadang: value }))}
                      disabled={locked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.statusLadangData.map((item: any) => (
                          <SelectItem key={item.status} value={item.status}>
                            <span className="flex items-center gap-2">
                              <Dot color={item.colorHex} />
                              {item.status}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tarikh Memo Ladang" htmlFor="tarikhMemoLadang">
                    <Input
                      id="tarikhMemoLadang"
                      type="date"
                      value={formData.tarikhMemoLadang}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          tarikhMemoLadang: e.target.value,
                          // Clearing the memo date clears every later step
                          ...(e.target.value === "" && {
                            tarikhPpnP: "",
                            tarikhPn: "",
                            tarikhHantar: "",
                            penerima: "",
                            statusBayaran: "",
                            tarikhBayar: "",
                            nomborBaucer: "",
                          }),
                        }))
                      }
                      disabled={locked}
                    />
                  </Field>
                </div>

                {shouldShowAdvancedFields() && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tarikh PPN (P)" htmlFor="tarikhPpnP">
                      <Input
                        id="tarikhPpnP"
                        type="date"
                        value={formData.tarikhPpnP}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhPpnP: e.target.value }))}
                        disabled={locked}
                      />
                    </Field>
                    <Field label="Tarikh PN" htmlFor="tarikhPn">
                      <Input
                        id="tarikhPn"
                        type="date"
                        value={formData.tarikhPn}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhPn: e.target.value }))}
                        disabled={locked}
                      />
                    </Field>
                  </div>
                )}
              </Section>

              <Section
                step={3}
                title="Kewangan"
                hint={
                  !shouldShowAdvancedFields()
                    ? "Isi Tarikh Memo Ladang untuk teruskan."
                    : !shouldShowHandoverFields()
                      ? "Isi Tarikh PN untuk menghantar ke Kewangan."
                      : undefined
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tarikh Hantar" htmlFor="tarikhHantar">
                    <Input
                      id="tarikhHantar"
                      type="date"
                      value={formData.tarikhHantar}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          tarikhHantar: e.target.value,
                          // Clearing the hantar date clears the payment fields
                          ...(e.target.value === "" && {
                            penerima: "",
                            statusBayaran: "",
                            tarikhBayar: "",
                            nomborBaucer: "",
                          }),
                        }))
                      }
                      disabled={locked}
                    />
                  </Field>
                  <Field label="Penerima">
                    <Select
                      value={formData.penerima || undefined}
                      onValueChange={(name) => {
                        const selected = penerimaOptions.find((item) => item.name === name)
                        setFormData((prev: any) => ({
                          ...prev,
                          penerima: name,
                          statusBayaran: selected?.defaultStatus || prev.statusBayaran,
                        }))
                      }}
                      disabled={locked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih penerima" />
                      </SelectTrigger>
                      <SelectContent>
                        {penerimaOptions.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status Bayaran">
                    <Select
                      value={formData.statusBayaran}
                      onValueChange={(value) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          statusBayaran: value,
                          // Only SELESAI keeps the paid date and voucher
                          ...(value !== "SELESAI" && {
                            tarikhBayar: "",
                            nomborBaucer: "",
                          }),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.statusBayaranData.map((item: any) => (
                          <SelectItem key={item.status} value={item.status}>
                            <span className="flex items-center gap-2">
                              <Dot color={item.colorHex} />
                              {item.status}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tarikh Bayar" htmlFor="tarikhBayar">
                    <Input
                      id="tarikhBayar"
                      type="date"
                      value={formData.tarikhBayar}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhBayar: e.target.value }))}
                      disabled={formData.statusBayaran !== "SELESAI"}
                    />
                  </Field>
                </div>

                {shouldShowCompletionFields() && (
                  <Field label="Nombor Baucer" htmlFor="nomborBaucer">
                    <Input
                      id="nomborBaucer"
                      placeholder="Masukkan nombor baucer"
                      value={formData.nomborBaucer}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, nomborBaucer: e.target.value }))}
                    />
                  </Field>
                )}
              </Section>

              <Field label="Nota Kaki" htmlFor="notaKaki">
                <Textarea
                  id="notaKaki"
                  placeholder="Nota tambahan. Taip #S123 untuk pautan ke surat 123."
                  className="min-h-[72px]"
                  value={formData.notaKaki}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, notaKaki: e.target.value }))}
                  disabled={locked}
                />
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border-table px-4 py-3 sm:px-6">
          <Button variant="secondary" size="small" onClick={close} className="flex-1 sm:flex-none">
            Batal
          </Button>
          <Button variant="primary" size="small" onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? "Menyimpan..." : isEdit ? "Kemaskini" : "Simpan"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
