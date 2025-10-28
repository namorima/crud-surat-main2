"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronDownIcon, X, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
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
}

const KATEGORI_OPTIONS = ["PERTANIAN AM", "ANGKUT BTS", "PIECERATE", "KIMIA", "KONTRAK"]

export function ShareLinkForm({ onSubmit, isSubmitting }: ShareLinkFormProps) {
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
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>()

  // Form fields
  const [description, setDescription] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>()
  const [noExpiry, setNoExpiry] = useState(true)

  // Popover states
  const [kontrakOpen, setKontrakOpen] = useState(false)
  const [kawasanOpen, setKawasanOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [kontraktorOpen, setKontraktorOpen] = useState(false)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [expiryOpen, setExpiryOpen] = useState(false)

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
      } catch (error) {
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

  const toggleSelection = (value: string, selected: string[], setSelected: (val: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const removeSelection = (value: string, selected: string[], setSelected: (val: string[]) => void) => {
    setSelected(selected.filter((v) => v !== value))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuatkan...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cipta Pautan Kongsi Baru</CardTitle>
        <CardDescription>Pilih filter untuk data bayaran yang ingin dikongsi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mobile: Stack vertically, Desktop: Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kategori - Full Width */}
          <div className="space-y-2 md:col-span-2">
            <Label>Kategori (pilihan)</Label>
            <div className="flex flex-wrap gap-2">
              {KATEGORI_OPTIONS.map((kategori) => (
                <Badge
                  key={kategori}
                  variant={selectedKategori.includes(kategori) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSelection(kategori, selectedKategori, setSelectedKategori)}
                >
                  {kategori}
                  {selectedKategori.includes(kategori) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Row 2: No Kontrak, Kawasan, Status Bayaran */}
          <div className="space-y-2">
            <Label>No Kontrak (pilihan)</Label>
            <Popover open={kontrakOpen} onOpenChange={setKontrakOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Pilih Kontrak
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kontrak..." />
                  <CommandList>
                    <CommandEmpty>Tiada kontrak dijumpai</CommandEmpty>
                    <CommandGroup>
                      {formOptions.allContracts.map((kontrak) => (
                        <CommandItem
                          key={kontrak}
                          onSelect={() => {
                            toggleSelection(kontrak, selectedKontrak, setSelectedKontrak)
                          }}
                        >
                          <Checkbox checked={selectedKontrak.includes(kontrak)} className="mr-2" />
                          {kontrak}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedKontrak.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedKontrak.map((kontrak) => (
                  <Badge key={kontrak} variant="secondary">
                    {kontrak}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeSelection(kontrak, selectedKontrak, setSelectedKontrak)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Kawasan (pilihan)</Label>
            <Popover open={kawasanOpen} onOpenChange={setKawasanOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Pilih Kawasan
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kawasan..." />
                  <CommandList>
                    <CommandEmpty>Tiada kawasan dijumpai</CommandEmpty>
                    <CommandGroup>
                      {formOptions.daripadaSuggestions.map((kawasan) => (
                        <CommandItem
                          key={kawasan}
                          onSelect={() => {
                            toggleSelection(kawasan, selectedKawasan, setSelectedKawasan)
                          }}
                        >
                          <Checkbox checked={selectedKawasan.includes(kawasan)} className="mr-2" />
                          {kawasan}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedKawasan.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedKawasan.map((kawasan) => (
                  <Badge key={kawasan} variant="secondary">
                    {kawasan}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeSelection(kawasan, selectedKawasan, setSelectedKawasan)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status Bayaran (pilihan)</Label>
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Pilih Status
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari status..." />
                  <CommandList>
                    <CommandEmpty>Tiada status dijumpai</CommandEmpty>
                    <CommandGroup>
                      {formOptions.statusBayaranData.map((item) => (
                        <CommandItem
                          key={item.status}
                          onSelect={() => {
                            toggleSelection(item.status, selectedStatus, setSelectedStatus)
                          }}
                        >
                          <Checkbox checked={selectedStatus.includes(item.status)} className="mr-2" />
                          {item.status}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedStatus.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedStatus.map((status) => (
                  <Badge key={status} variant="secondary">
                    {status}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeSelection(status, selectedStatus, setSelectedStatus)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Nama Kontraktor, Julat Tarikh */}
          <div className="space-y-2">
            <Label>Nama Kontraktor (pilihan)</Label>
            <Popover open={kontraktorOpen} onOpenChange={setKontraktorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Pilih Kontraktor
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kontraktor..." />
                  <CommandList>
                    <CommandEmpty>Tiada kontraktor dijumpai</CommandEmpty>
                    <CommandGroup>
                      {allKontraktorNames.map((kontraktor) => (
                        <CommandItem
                          key={kontraktor}
                          onSelect={() => {
                            toggleSelection(kontraktor, selectedKontraktor, setSelectedKontraktor)
                          }}
                        >
                          <Checkbox checked={selectedKontraktor.includes(kontraktor)} className="mr-2" />
                          {kontraktor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedKontraktor.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedKontraktor.map((kontraktor) => (
                  <Badge key={kontraktor} variant="secondary">
                    {kontraktor}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeSelection(kontraktor, selectedKontraktor, setSelectedKontraktor)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range" className="px-1">
              Julat Tarikh (pilihan)
            </Label>
            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date-range"
                  className="w-full justify-between font-normal"
                >
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString("ms-MY")} - {dateRange.to.toLocaleDateString("ms-MY")}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString("ms-MY")
                    )
                  ) : (
                    "Pilih tarikh"
                  )}
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
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
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange(undefined)}
                className="h-8 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Padam tarikh
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="no-expiry"
                checked={noExpiry}
                onCheckedChange={(checked) => setNoExpiry(checked === true)}
              />
              <Label htmlFor="no-expiry" className="cursor-pointer font-normal">
                Tiada tarikh luput
              </Label>
            </div>
            {!noExpiry && (
              <>
                <Label htmlFor="expiry-date" className="px-1">
                  Tarikh Luput
                </Label>
                <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="expiry-date"
                      className={cn("w-full justify-between font-normal", !expiryDate && "text-muted-foreground")}
                    >
                      {expiryDate ? expiryDate.toLocaleDateString("ms-MY") : "Pilih tarikh"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
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
              </>
            )}
          </div>
        </div>

        {/* Description - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="description">Keterangan (pilihan)</Label>
          <Textarea
            id="description"
            placeholder="Contoh: Untuk audit Q1 2025"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menjana...
              </>
            ) : (
              "Jana Pautan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
