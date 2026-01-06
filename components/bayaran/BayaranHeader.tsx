"use client"

import type React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Menu,
  Search,
  X,
  Calendar,
  SlidersHorizontal,
  ArrowDownUp,
  ArrowDown,
  Edit,
  Plus,
  Settings,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Sidebar } from "@/components/dashboard/sidebar"
import { hasPermission } from "@/lib/rbac"
import type { User } from "@/types/user"
import type { Bayaran } from "@/types/bayaran"

interface BayaranHeaderProps {
  user: User | null
  showSearchInput: boolean
  setShowSearchInput: (show: boolean) => void
  searchQuery: string
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchSubmit: (e: React.FormEvent) => void
  searchInputRef: React.RefObject<HTMLInputElement>
  dateFilter: [Date | undefined, Date | undefined]
  setDateFilter: (date: [Date | undefined, Date | undefined] | ((range: any) => [any, any])) => void;
  statusFilter: string
  kategoriFilter: string
  kontrakFilter: string
  clearAllFilters: () => void
  setSortField: (field: keyof Bayaran) => void
  setSortDirection: (direction: "asc" | "desc") => void
  uniqueStatus: string[]
  uniqueKategori: string[]
  uniqueKontrak: string[]
  setStatusFilter: (status: string) => void
  setKategoriFilter: (kategori: string) => void
  setKontrakFilter: (kontrak: string) => void
  selectedRows: string[]
  setShowAddDialog: (show: boolean) => void
  setShowBulkEditDialog: (show: boolean) => void
  columnVisibility: any
  setColumnVisibility: (visibility: any) => void
}

export function BayaranHeader({
  user,
  showSearchInput,
  setShowSearchInput,
  searchQuery,
  handleSearchInputChange,
  handleSearchSubmit,
  searchInputRef,
  dateFilter,
  setDateFilter,
  statusFilter,
  kategoriFilter,
  kontrakFilter,
  clearAllFilters,
  setSortField,
  setSortDirection,
  uniqueStatus,
  uniqueKategori,
  uniqueKontrak,
  setStatusFilter,
  setKategoriFilter,
  setKontrakFilter,
  selectedRows,
  setShowAddDialog,
  setShowBulkEditDialog,
  columnVisibility,
  setColumnVisibility,
}: BayaranHeaderProps) {
  // Permission checks
  const canCreate = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'bayaran', action: 'create' })
    : (user?.role === "semua" || user?.role === "PERLADANGAN")
  
  const canBulkEdit = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'bayaran', action: 'edit' })
    : (user?.role === "semua")
  
  return (
    <CardHeader className="pb-3 sticky top-0 z-10 bg-card">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[250px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Main navigation sidebar</SheetDescription>
              </SheetHeader>
              <Sidebar />
            </SheetContent>
          </Sheet>
          <CardTitle className="text-base md:text-xl">Rekod Bayaran</CardTitle>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {/* Mobile toolbar */}
          <div className="flex md:hidden items-center gap-1">
            {/* Sort Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent">
                  <ArrowDownUp className="h-3 w-3" />
                  <span className="sr-only">Sort</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <div className="p-2 space-y-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setSortField("id")
                      setSortDirection("desc")
                    }}
                  >
                    <ArrowDown className="mr-2 h-3 w-3" />
                    ID (Besar ke Kecil)
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setSortField("tarikhTerima")
                      setSortDirection("desc")
                    }}
                  >
                    <ArrowDown className="mr-2 h-3 w-3" />
                    Tarikh (Terbaru)
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setSortField("nilaiBayaran")
                      setSortDirection("desc")
                    }}
                  >
                    <ArrowDown className="mr-2 h-3 w-3" />
                    Nilai (Tinggi ke Rendah)
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filter Button - Only shows when filters are applied */}
          {(statusFilter !== "all" ||
            kategoriFilter !== "all" ||
            kontrakFilter !== "all" ||
            (dateFilter && dateFilter[0])) && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearAllFilters}
              className="transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-500 h-7 w-7 md:h-8 md:w-8 bg-transparent"
              title="Clear all filters"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
              <span className="sr-only">Clear Filters</span>
            </Button>
          )}

          {/* Search Button/Input */}
          {showSearchInput ? (
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Cari..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-[200px] md:w-[300px] pr-8 h-7 md:h-auto text-xs md:text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => {
                  setShowSearchInput(false)
                }}
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
                <span className="sr-only">Clear Search</span>
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowSearchInput(true)
              }}
              className="transition-all duration-200 hover:scale-105 h-7 w-7 md:h-8 md:w-8"
            >
              <Search className="h-3 w-3 md:h-4 md:w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          {/* Date Filter - Icon Only */}
          {!showSearchInput && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(dateFilter[0] && "text-primary", "h-7 w-7 md:h-8 md:w-8")}
                >
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="sr-only">Filter Tarikh</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateFilter[0], to: dateFilter[1] }}
                  onSelect={(range) => setDateFilter([range?.from, range?.to])}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Combined Filters */}
          {!showSearchInput && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    (statusFilter !== "all" || kategoriFilter !== "all" || kontrakFilter !== "all") &&
                      "text-primary",
                    "h-7 w-7 md:h-8 md:w-8",
                  )}
                >
                  <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="sr-only">Filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="kategori">Kategori</TabsTrigger>
                    <TabsTrigger value="kontrak">No Kontrak</TabsTrigger>
                  </TabsList>
                  <TabsContent value="status" className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Status Bayaran</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          {uniqueStatus.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  <TabsContent value="kategori" className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          {uniqueKategori.map((kategori) => (
                            <SelectItem key={kategori} value={kategori}>
                              {kategori}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  <TabsContent value="kontrak" className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>No Kontrak</Label>
                      <Select value={kontrakFilter} onValueChange={setKontrakFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih no kontrak" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kontrak</SelectItem>
                          {uniqueKontrak.map((kontrak) => (
                            <SelectItem key={kontrak} value={kontrak}>
                              {kontrak}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={
                      statusFilter === "all" &&
                      kategoriFilter === "all" &&
                      kontrakFilter === "all" &&
                      !dateFilter[0] &&
                      !searchQuery
                    }
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Add Button */}
          {!showSearchInput && canCreate && (
            <Button
              variant="default"
              size="icon"
              onClick={() => setShowAddDialog(true)}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Tambah Rekod Bayaran"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="sr-only">Tambah Rekod</span>
            </Button>
          )}

          {/* Bulk Action Button */}
          {selectedRows.length > 0 && canBulkEdit && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowBulkEditDialog(true)}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Bulk Edit"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4" />
              <span className="sr-only">Bulk Edit</span>
            </Button>
          )}

          {/* Column Settings */}
          {!showSearchInput && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8 bg-transparent">
                  <Settings className="h-3 w-3 md:h-4 w-4" />
                  <span className="sr-only">Column Settings</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <div className="p-2 text-sm font-medium">Toggle Columns</div>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-id"
                      checked={columnVisibility.id}
                      onCheckedChange={(checked) => setColumnVisibility((prev: any) => ({ ...prev, id: !!checked }))}
                    />
                    <Label htmlFor="col-id">ID</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-daripadaTarikh"
                      checked={columnVisibility.daripadaTarikh}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev: any) => ({ ...prev, daripadaTarikh: !!checked }))
                      }
                    />
                    <Label htmlFor="col-daripadaTarikh">Daripada/Tarikh</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-noKontrak"
                      checked={columnVisibility.noKontrak}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev: any) => ({ ...prev, noKontrak: !!checked }))
                      }
                    />
                    <Label htmlFor="col-noKontrak">No Kontrak</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-tarikhBayar"
                      checked={columnVisibility.tarikhBayar}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev: any) => ({ ...prev, tarikhBayar: !!checked }))
                      }
                    />
                    <Label htmlFor="col-tarikhBayar">Tarikh Bayar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-perkara"
                      checked={columnVisibility.perkara}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev: any) => ({ ...prev, perkara: !!checked }))
                      }
                    />
                    <Label htmlFor="col-perkara">Perkara</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-nilaiBayaran"
                      checked={columnVisibility.nilaiBayaran}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev: any) => ({ ...prev, nilaiBayaran: !!checked }))
                      }
                    />
                    <Label htmlFor="col-nilaiBayaran">Nilai Bayaran</Label>
                  </div>
                </div>

                {/* Sort options */}
                <div className="border-t pt-2 pb-2 px-2">
                  <div className="text-sm font-medium mb-2">Sort By</div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full justify-start text-xs bg-transparent"
                      onClick={() => {
                        setSortField("id")
                        setSortDirection("desc")
                      }}
                    >
                      <ArrowDown className="mr-2 h-3 w-3" />
                      ID (Besar ke Kecil)
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full justify-start text-xs bg-transparent"
                      onClick={() => {
                        setSortField("tarikhTerima")
                        setSortDirection("desc")
                      }}
                    >
                      <ArrowDown className="mr-2 h-3 w-3" />
                      Tarikh (Terbaru)
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full justify-start text-xs bg-transparent"
                      onClick={() => {
                        setSortField("nilaiBayaran")
                        setSortDirection("desc")
                      }}
                    >
                      <ArrowDown className="mr-2 h-3 w-3" />
                      Nilai (Tinggi)
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </CardHeader>
  )
}
