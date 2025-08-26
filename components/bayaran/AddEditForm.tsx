
"use client"

import type { Bayaran } from "@/types/bayaran"
import type { User } from "@/types/user"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowUpDown } from "lucide-react"

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
  showPenerimaDropdown: boolean
  setShowPenerimaDropdown: (show: boolean) => void
  handlePenerimaChange: (value: string) => void
  filteredPenerimaData: any[]
  KATEGORI_COLORS: Record<string, string>
}

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
  showPenerimaDropdown,
  setShowPenerimaDropdown,
  handlePenerimaChange,
  filteredPenerimaData,
  KATEGORI_COLORS,
}: AddEditFormProps) {
  const isEdit = !!editingBayaran

  return (
    <Dialog open={showAddDialog || showEditDialog} onOpenChange={isEdit ? setShowEditDialog : setShowAddDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Rekod Bayaran #${editingBayaran?.id}` : "Tambah Rekod Bayaran"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Daripada with suggestions - allows custom input */}
            <div>
              <Label>Daripada</Label>
              <Popover open={showDaripadaDropdown} onOpenChange={setShowDaripadaDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={showDaripadaDropdown}
                    className="w-full justify-between bg-transparent"
                    disabled={user?.role === "KEWANGAN" && isEdit}
                  >
                    {formData.daripada || "Pilih atau taip nama/organisasi..."}
                    <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Cari atau taip nama..."
                      value={formData.daripada}
                      onValueChange={handleDaripadaChange}
                      disabled={user?.role === "KEWANGAN" && isEdit}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">Tiada hasil dijumpai.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowDaripadaDropdown(false)
                            }}
                            className="w-full"
                            disabled={user?.role === "KEWANGAN" && isEdit}
                          >
                            Gunakan "{formData.daripada}"
                          </Button>
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
            </div>

            <div>
              <Label htmlFor="tarikhTerima">Tarikh Terima</Label>
              <Input
                id="tarikhTerima"
                type="date"
                value={formData.tarikhTerima}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhTerima: e.target.value }))}
                disabled={user?.role === "KEWANGAN" && isEdit}
              />
            </div>

            <div>
              <Label htmlFor="perkara">Perkara</Label>
              <Textarea
                id="perkara"
                value={formData.perkara}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, perkara: e.target.value }))}
                rows={3}
                disabled={user?.role === "KEWANGAN" && isEdit}
              />
            </div>

            {/* Nilai Bayaran and Bayaran Ke on same line */}
            <div className="flex gap-2">
              <div className="flex-[0.7]">
                <Label htmlFor="nilaiBayaran">Nilai Bayaran</Label>
                <Input
                  id="nilaiBayaran"
                  type="text"
                  value={formatCurrencyInput(formData.nilaiBayaran)}
                  onChange={handleCurrencyInputChange}
                  placeholder="0.00"
                  disabled={user?.role === "KEWANGAN" && isEdit}
                />
              </div>
              <div className="flex-[0.3]">
                <Label htmlFor="bayaranKe">Bayaran Ke</Label>
                <Input
                  id="bayaranKe"
                  value={formData.bayaranKe}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, bayaranKe: e.target.value }))}
                  disabled={user?.role === "KEWANGAN" && isEdit}
                />
              </div>
            </div>

            {/* Mobile layout: No Kontrak and Kategori in one line */}
            <div className="md:hidden flex gap-2">
              <div className="flex-1">
                <Label htmlFor="noKontrak">No Kontrak</Label>
                <Select
                  value={formData.noKontrak}
                  onValueChange={handleKontrakChange}
                  disabled={!formData.daripada || (user?.role === "KEWANGAN" && isEdit)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih no kontrak" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableKontraks().map((kontrak) => (
                      <SelectItem key={kontrak} value={kontrak}>
                        {kontrak}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, kategori: value }))}
                  disabled={!formData.daripada || !formData.noKontrak || (user?.role === "KEWANGAN" && isEdit)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableKategoris().map((kategori) => (
                      <SelectItem key={kategori} value={kategori}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: KATEGORI_COLORS[kategori?.toUpperCase()]
                                ? KATEGORI_COLORS[kategori?.toUpperCase()]
                                    .split(" ")[0]
                                    .replace("bg-[", "")
                                    .replace("]", "")
                                : "#6b7280",
                            }}
                          />
                          {kategori}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop layout: Separate rows */}
            <div className="hidden md:block">
              <Label htmlFor="noKontrak">No Kontrak</Label>
              <Select
                value={formData.noKontrak}
                onValueChange={handleKontrakChange}
                disabled={!formData.daripada || (user?.role === "KEWANGAN" && isEdit)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih no kontrak" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableKontraks().map((kontrak) => (
                    <SelectItem key={kontrak} value={kontrak}>
                      {kontrak}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:block">
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(value) => setFormData((prev: any) => ({ ...prev, kategori: value }))}
                disabled={!formData.daripada || !formData.noKontrak || (user?.role === "KEWANGAN" && isEdit)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableKategoris().map((kategori) => (
                    <SelectItem key={kategori} value={kategori}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: KATEGORI_COLORS[kategori?.toUpperCase()]
                              ? KATEGORI_COLORS[kategori?.toUpperCase()]
                                  .split(" ")[0]
                                  .replace("bg-[", "")
                                  .replace("]", "")
                              : "#6b7280",
                          }}
                        />
                        {kategori}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Status Ladang - Normal dropdown without auto-update */}
            <div>
              <Label>Status Ladang</Label>
              <Select
                value={formData.statusLadang}
                onValueChange={(value) => setFormData((prev: any) => ({ ...prev, statusLadang: value }))}
                disabled={user?.role === "KEWANGAN" && isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status ladang" />
                </SelectTrigger>
                <SelectContent>
                  {formOptions.statusLadangData.map((status: any) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarikh Memo Ladang - Moved here */}
            <div>
              <Label htmlFor="tarikhMemoLadang">Tarikh Memo Ladang</Label>
              <Input
                id="tarikhMemoLadang"
                type="date"
                value={formData.tarikhMemoLadang}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    tarikhMemoLadang: e.target.value,
                    // Reset dependent fields when memo ladang date is cleared
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
                disabled={user?.role === "KEWANGAN" && isEdit}
              />
            </div>

            {/* Conditional Fields - Show only if Tarikh Memo Ladang is filled */}
            {shouldShowAdvancedFields() && (
              <>
                {/* Tarikh PPN (P) and Tarikh PN in one line */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Tarikh PPN (P)</Label>
                    <Input
                      type="date"
                      value={formData.tarikhPpnP}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhPpnP: e.target.value }))}
                      disabled={user?.role === "KEWANGAN" && isEdit}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Tarikh PN</Label>
                    <Input
                      type="date"
                      value={formData.tarikhPn}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhPn: e.target.value }))}
                      disabled={user?.role === "KEWANGAN" && isEdit}
                    />
                  </div>
                </div>

                <div hidden>
                  <Label>Tarikh Hantar</Label>
                  <Input
                    type="date"
                    value={formData.tarikhHantar}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tarikhHantar: e.target.value,
                        // Reset dependent fields when hantar date is cleared
                        ...(e.target.value === "" && {
                          penerima: "",
                          statusBayaran: "",
                          tarikhBayar: "",
                          nomborBaucer: "",
                        }),
                      }))
                    }
                    disabled={user?.role === "KEWANGAN" && isEdit}
                  />
                </div>
              </>
            )}

            {/* Show only if both Memo Ladang and Hantar dates are filled */}
            {shouldShowHandoverFields() && (
              <>
                {/* Tarikh Hantar and Penerima in one line */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Tarikh Hantar</Label>
                    <Input
                      type="date"
                      value={formData.tarikhHantar}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          tarikhHantar: e.target.value,
                          // Reset dependent fields when hantar date is cleared
                          ...(e.target.value === "" && {
                            penerima: "",
                            statusBayaran: "",
                            tarikhBayar: "",
                            nomborBaucer: "",
                          }),
                        }))
                      }
                      disabled={user?.role === "KEWANGAN" && isEdit}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Penerima</Label>
                    <Popover open={showPenerimaDropdown} onOpenChange={setShowPenerimaDropdown}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={showPenerimaDropdown}
                          className="w-full justify-between bg-transparent"
                          disabled={user?.role === "KEWANGAN" && isEdit}
                        >
                          {formData.penerima || "Pilih nama penerima..."}
                          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Cari nama penerima..."
                            value={formData.penerima}
                            onValueChange={handlePenerimaChange}
                            disabled={user?.role === "KEWANGAN" && isEdit}
                          />
                          <CommandList>
                            <CommandEmpty>Tiada hasil dijumpai.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredPenerimaData.map((item) => (
                                <CommandItem
                                  key={item.display}
                                  value={item.display}
                                  onSelect={() => {
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      penerima: item.name,
                                      statusBayaran: item.defaultStatus || prev.statusBayaran,
                                    }))
                                    setShowPenerimaDropdown(false)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-xs text-muted-foreground">({item.unit})</span>
                                    {item.defaultStatus && (
                                      <span className="text-xs text-blue-600">Default: {item.defaultStatus}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Status Bayaran and Tarikh Bayar in one line */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Status Bayaran</Label>
                    <Select
                      value={formData.statusBayaran}
                      onValueChange={(value) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          statusBayaran: value,
                          // Reset completion fields if status is not SELESAI
                          ...(value !== "SELESAI" && {
                            tarikhBayar: "",
                            nomborBaucer: "",
                          }),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status bayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.statusBayaranData.map((item: any) => (
                          <SelectItem key={item.status} value={item.status}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              {item.status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Tarikh Bayar</Label>
                    <Input
                      type="date"
                      value={formData.tarikhBayar}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, tarikhBayar: e.target.value }))}
                      disabled={formData.statusBayaran !== "SELESAI"}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Show only if status is SELESAI */}
            {shouldShowCompletionFields() && (
              <div>
                <Label>Nombor Baucer</Label>
                <Input
                  placeholder="Masukkan nombor baucer"
                  value={formData.nomborBaucer}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, nomborBaucer: e.target.value }))}
                />
              </div>
            )}

            <div>
              <Label>Nota Kaki</Label>
              <Textarea
                placeholder="Masukkan nota tambahan"
                className="min-h-[80px]"
                value={formData.notaKaki}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, notaKaki: e.target.value }))}
                disabled={user?.role === "KEWANGAN" && isEdit}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (isEdit) {
                setShowEditDialog(false)
                setEditingBayaran(null)
              } else {
                setShowAddDialog(false)
              }
              setFormData({
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
              })
            }}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : isEdit ? "Kemaskini" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
