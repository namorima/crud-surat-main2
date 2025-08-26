
"use client"

import { cn } from "@/lib/utils"
import type { Bayaran } from "@/types/bayaran"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Share2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface BayaranTableProps {
  displayedBayaran: Bayaran[]
  columnVisibility: {
    id: boolean
    daripadaTarikh: boolean
    perkara: boolean
    nilaiBayaran: boolean
    bayaranKe: boolean
    noKontrak: boolean
    tarikhBayar: boolean
  }
  handleSort: (field: keyof Bayaran) => void
  setSelectedBayaran: (bayaran: Bayaran | null) => void
  setShowDetailDialog: (show: boolean) => void
  getKategoriColor: (kategori: string) => string
  getStatusColor: (status: string) => string
  getStatusBadgeStyle: (status: string) => React.CSSProperties
  formatCurrency: (value: string) => string
  renderNotaKakiWithLinks: (notaKaki: string) => React.ReactNode
  handleKontrakFilter: (kontrak: string) => void
  handleShare: (bayaran: Bayaran) => void
  isGeneratingImage: boolean
  sharingBayaran: Bayaran | null
  isSharing: boolean
  loading: boolean
  error: string | null
  fetchWithCache: () => void
  selectedRows: string[]
  setSelectedRows: (ids: string[]) => void
}

export function BayaranTable({
  displayedBayaran,
  columnVisibility,
  handleSort,
  setSelectedBayaran,
  setShowDetailDialog,
  getKategoriColor,
  getStatusColor,
  getStatusBadgeStyle,
  formatCurrency,
  renderNotaKakiWithLinks,
  handleKontrakFilter,
  handleShare,
  isGeneratingImage,
  sharingBayaran,
  isSharing,
  loading,
  error,
  fetchWithCache,
  selectedRows,
  setSelectedRows,
}: BayaranTableProps) {
  return (
    <div className="overflow-x-auto">
      {/* Desktop view */}
      <div className="hidden md:block max-h-[calc(100vh-200px)] overflow-y-auto">
        <Table>
          <TableHeader className="table-header sticky top-0 z-20 bg-card shadow-sm">
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedRows.length === displayedBayaran.length && displayedBayaran.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRows(displayedBayaran.map((item) => item.id))
                    } else {
                      setSelectedRows([])
                    }
                  }}
                />
              </TableHead>
              {columnVisibility.id && (
                <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort("id")}>
                  <div className="flex items-center">
                    ID
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {columnVisibility.daripadaTarikh && (
                <TableHead className="w-[150px]">
                  <div className="flex items-center">Daripada / Tarikh</div>
                </TableHead>
              )}
              {columnVisibility.perkara && (
                <TableHead className="w-[400px] cursor-pointer" onClick={() => handleSort("perkara")}>
                  <div className="flex items-center">
                    Perkara / Details
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {columnVisibility.nilaiBayaran && (
                <TableHead
                  className="w-[150px] cursor-pointer text-right"
                  onClick={() => handleSort("nilaiBayaran")}
                >
                  <div className="flex items-center justify-end">
                    Nilai Bayaran
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {columnVisibility.bayaranKe && (
                <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("bayaranKe")}>
                  <div className="flex items-center">
                    Bayaran Ke
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {columnVisibility.noKontrak && (
                <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("noKontrak")}>
                  <div className="flex items-center">
                    No Kontrak
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {columnVisibility.tarikhBayar && (
                <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("tarikhBayar")}>
                  <div className="flex items-center">
                    Tarikh Bayar
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedBayaran.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : error ? (
                    <div className="text-destructive">Error loading data. Please try again.</div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground">Tiada data bayaran dijumpai</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={fetchWithCache}
                      >
                        Muat Semula Data
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              displayedBayaran.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "table-row text-sm transition-all duration-200 hover:bg-muted/30",
                    item.statusBayaran?.toLowerCase() === "selesai" &&
                      "bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900",
                    item.statusBayaran?.toUpperCase() === "BATAL" &&
                      "bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-800 dark:text-red-200 font-medium",
                  )}
                  data-state={selectedRows.includes(item.id) && "selected"}
                >
                  <TableCell className="py-2">
                    <Checkbox
                      checked={selectedRows.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRows([...selectedRows, item.id])
                        } else {
                          setSelectedRows(selectedRows.filter((id) => id !== item.id))
                        }
                      }}
                    />
                  </TableCell>
                  {columnVisibility.id && (
                    <TableCell className="py-2">
                      <Badge
                        variant={
                          item.statusBayaran?.toUpperCase() === "BATAL" ||
                          item.statusBayaran?.toLowerCase() === "selesai"
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "cursor-pointer",
                          item.statusBayaran?.toUpperCase() === "BATAL"
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-700"
                            : item.statusBayaran?.toLowerCase() === "selesai"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : item.tarikhHantar
                                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                : "hover:bg-primary/90",
                        )}
                        onClick={() => {
                          setSelectedBayaran(item)
                          setShowDetailDialog(true)
                        }}
                      >
                        #{item.id}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.daripadaTarikh && (
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <div className="text-xs text-muted-foreground">{item.tarikhTerima}</div>
                        <div className="font-medium">{item.daripada}</div>
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.perkara && (
                    <TableCell className="py-2">
                      <div className="space-y-2">
                        <div className="whitespace-normal break-words max-w-[300px]" title={item.perkara}>
                          {item.perkara}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getKategoriColor(item.kategori || ""))}
                          >
                            {item.kategori}
                          </Badge>
                          <Badge
                            className={`text-xs ${getStatusColor(item.statusBayaran)}`}
                            style={getStatusBadgeStyle(item.statusBayaran)}
                          >
                            {item.statusBayaran}
                          </Badge>
                          {item.noKontrak && (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-muted"
                              onClick={() => handleKontrakFilter(item.noKontrak || "")}
                            >
                              {item.noKontrak}
                            </Badge>
                          )}
                        </div>
                        {item.notaKaki && (
                          <div className="mt-1">
                            <p className="text-xs text-red-500 whitespace-normal break-words">
                              {renderNotaKakiWithLinks(item.notaKaki)}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.nilaiBayaran && (
                    <TableCell className="py-2 text-right font-medium">
                      {formatCurrency(item.nilaiBayaran)}
                    </TableCell>
                  )}
                  {columnVisibility.bayaranKe && <TableCell className="py-2">{item.bayaranKe}</TableCell>}
                  {columnVisibility.noKontrak && <TableCell className="py-2">{item.noKontrak || "-"}</TableCell>}
                  {columnVisibility.tarikhBayar && (
                    <TableCell className="py-2">{item.tarikhBayar || "-"}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pb-4">
        {displayedBayaran.length === 0 ? (
          <div className="text-center py-8">
            {loading ? (
              <div className="flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-destructive">Error loading data. Please try again.</div>
            ) : (
              <div>
                <p className="text-muted-foreground">Tiada data bayaran dijumpai</p>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={fetchWithCache}>
                  Muat Semula Data
                </Button>
              </div>
            )}
          </div>
        ) : (
          displayedBayaran.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "p-3 transition-all duration-200 hover:bg-muted/30",
                item.statusBayaran?.toUpperCase() === "BATAL"
                  ? "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:hover:bg-red-900"
                  : item.statusBayaran?.toLowerCase() === "selesai"
                    ? "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900"
                    : item.tarikhHantar
                      ? "border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900"
                      : "",
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <Badge
                    variant={
                      item.statusBayaran?.toUpperCase() === "BATAL" ||
                      item.statusBayaran?.toLowerCase() === "selesai"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "mb-1 w-fit cursor-pointer",
                      item.statusBayaran?.toUpperCase() === "BATAL"
                        ? "bg-red-600 hover:bg-red-700 text-white border-red-700"
                        : item.statusBayaran?.toLowerCase() === "selesai"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : item.tarikhHantar
                            ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                            : "",
                    )}
                    onClick={() => {
                      setSelectedBayaran(item)
                      setShowDetailDialog(true)
                    }}
                  >
                    #{item.id}
                  </Badge>
                  <span className="font-medium text-sm">{item.daripada}</span>
                  <span className="text-xs text-muted-foreground">{item.tarikhTerima}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Badge
                      className={`text-[10px] ${getStatusColor(item.statusBayaran)}`}
                      style={getStatusBadgeStyle(item.statusBayaran)}
                    >
                      {item.statusBayaran}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleShare(item)}
                      disabled={isGeneratingImage || (sharingBayaran?.id === item.id && isSharing)}
                    >
                      {sharingBayaran?.id === item.id && isSharing ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {item.noKontrak && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-red-800 dark:text-red-700 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer mt-1"
                      onClick={() => handleKontrakFilter(item.noKontrak)}
                    >
                      {item.noKontrak}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm whitespace-normal break-words">{item.perkara}</p>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={cn("text-[10px]", getKategoriColor(item.kategori || ""))}>
                    {item.kategori}
                  </Badge>
                  {item.nomborBaucer && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        item.statusBayaran?.toLowerCase() === "selesai"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "",
                      )}
                    >
                      {item.nomborBaucer}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{formatCurrency(item.nilaiBayaran)}</span>
                  <span className="text-xs text-muted-foreground font-bold">{item.bayaranKe}</span>
                </div>

                {item.notaKaki && (
                  <div className="mt-2">
                    <p className="text-xs text-red-500 whitespace-normal break-words">
                      {renderNotaKakiWithLinks(item.notaKaki)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
