
"use client"

import type { Bayaran } from "@/types/bayaran"
import type { User } from "@/types/user"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Share2, X, Trash2, DollarSign, Send, FilePen, FilePenLineIcon as Signature } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface DetailDialogProps {
  showDetailDialog: boolean
  setShowDetailDialog: (show: boolean) => void
  selectedBayaran: Bayaran | null
  handleEdit: (bayaran: Bayaran) => void
  handleShare: (bayaran: Bayaran) => void
  isSharing: boolean
  isGeneratingImage: boolean
  user: User | null
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (show: boolean) => void
  handleDelete: () => void
  isDeleting: boolean
  getKategoriColor: (kategori: string) => string
  formatCurrency: (value: string) => string
  formatDate: (dateString: string) => string
  extractPenerimaWithUnit: (penerima: string) => string
  renderNotaKakiWithLinks: (notaKaki: string) => React.ReactNode
}

export function DetailDialog({
  showDetailDialog,
  setShowDetailDialog,
  selectedBayaran,
  handleEdit,
  handleShare,
  isSharing,
  isGeneratingImage,
  user,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  isDeleting,
  getKategoriColor,
  formatCurrency,
  formatDate,
  extractPenerimaWithUnit,
  renderNotaKakiWithLinks,
}: DetailDialogProps) {
  return (
    <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant={selectedBayaran?.statusBayaran?.toLowerCase() === "selesai" ? "default" : "outline"}
              className={cn(
                selectedBayaran?.statusBayaran?.toLowerCase() === "selesai"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "",
              )}
            >
              #{selectedBayaran?.id}
            </Badge>
            Detail Rekod Bayaran
          </DialogTitle>
        </DialogHeader>
        {selectedBayaran && (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Daripada</Label>
                  <p className="text-sm font-medium">{selectedBayaran.daripada}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Perkara</Label>
                  <p className="text-sm whitespace-normal break-words">{selectedBayaran.perkara}</p>
                </div>
                {/* Mobile layout: Kategori and No Kontrak in one line */}
                <div className="md:hidden flex gap-2">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-muted-foreground">Kategori</Label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getKategoriColor(selectedBayaran.kategori || ""))}
                      >
                        {selectedBayaran.kategori}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-muted-foreground">Nama Kontraktor</Label>
                    <p className="text-sm mt-1">
                      {selectedBayaran.namaKontraktor && selectedBayaran.noKontrak
                        ? `${selectedBayaran.namaKontraktor} (${selectedBayaran.noKontrak})`
                        : selectedBayaran.namaKontraktor || selectedBayaran.noKontrak || "-"}
                    </p>
                  </div>
                </div>
                {/* Desktop layout: Kategori only */}
                <div className="hidden md:block">
                  <Label className="text-sm font-medium text-muted-foreground">Kategori</Label>
                  <div className="ml-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getKategoriColor(selectedBayaran.kategori || ""))}
                    >
                      {selectedBayaran.kategori}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {/* Mobile layout: Nilai Bayaran and Bayaran Ke in one line */}
                <div className="md:hidden flex gap-2">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-muted-foreground">Nilai Bayaran</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedBayaran.nilaiBayaran)}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-muted-foreground">Bayaran Ke</Label>
                    <p className="text-sm">{selectedBayaran.bayaranKe}</p>
                  </div>
                </div>
                {/* Desktop layout: Separate rows */}
                <div className="hidden md:block">
                  <Label className="text-sm font-medium text-muted-foreground">Nilai Bayaran</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedBayaran.nilaiBayaran)}</p>
                </div>
                <div className="hidden md:block">
                  <Label className="text-sm font-medium text-muted-foreground">Bayaran Ke</Label>
                  <p className="text-sm">{selectedBayaran.bayaranKe}</p>
                </div>
                <div className="hidden md:block">
                  <Label className="text-sm font-medium text-muted-foreground">Nama Kontraktor</Label>
                  <p className="text-sm">
                    {selectedBayaran.namaKontraktor && selectedBayaran.noKontrak
                      ? `${selectedBayaran.namaKontraktor} (${selectedBayaran.noKontrak})`
                      : selectedBayaran.namaKontraktor || selectedBayaran.noKontrak || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Tracking Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tracking Bayaran</h3>
              <div className="relative">
                {/* Timeline Line - Behind icons and semi-transparent */}
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-300 opacity-50 -z-10"></div>

                {/* Timeline Items */}
                <div className="space-y-6">
                  {/* Tarikh Bayar */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhBayar
                          ? "bg-red-500 text-white"
                          : selectedBayaran.tarikhBayar
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhBayar ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : selectedBayaran.tarikhBayar ? (
                        <span className="text-white">✓</span>
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh Bayar</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBayaran.tarikhBayar ? formatDate(selectedBayaran.tarikhBayar) : "Belum dibayar"}
                        </p>
                      </div>
                      {selectedBayaran.nomborBaucer && (
                        <div className="mt-1 ml-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              selectedBayaran.statusBayaran?.toLowerCase() === "selesai"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "",
                            )}
                          >
                            {selectedBayaran.nomborBaucer}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarikh Hantar */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhHantar
                          ? "bg-red-500 text-white"
                          : selectedBayaran.tarikhHantar
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhHantar ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : selectedBayaran.tarikhHantar ? (
                        <span className="text-white">✓</span>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh Hantar</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBayaran.tarikhHantar ? formatDate(selectedBayaran.tarikhHantar) : "Belum dihantar"}
                        </p>
                      </div>
                      {selectedBayaran.penerima && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Kepada: {extractPenerimaWithUnit(selectedBayaran.penerima)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tarikh PN */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhPn
                          ? "bg-red-500 text-white"
                          : selectedBayaran.tarikhPn
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhPn ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : selectedBayaran.tarikhPn ? (
                        <span className="text-white">✓</span>
                      ) : (
                        <FilePen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh PN</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBayaran.tarikhPn ? formatDate(selectedBayaran.tarikhPn) : "Belum diproses"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tarikh PPN (P) */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhPpnP
                          ? "bg-red-500 text-white"
                          : selectedBayaran.tarikhPpnP
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhPpnP ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : selectedBayaran.tarikhPpnP ? (
                        <span className="text-white">✓</span>
                      ) : (
                        <Signature className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh PPN (P)</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBayaran.tarikhPpnP ? formatDate(selectedBayaran.tarikhPpnP) : "Belum diproses"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tarikh Memo Ladang */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhMemoLadang
                          ? "bg-red-500 text-white"
                          : selectedBayaran.tarikhMemoLadang
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && selectedBayaran.tarikhMemoLadang ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : selectedBayaran.tarikhMemoLadang ? (
                        <span className="text-white">✓</span>
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh Memo Ladang</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBayaran.tarikhMemoLadang
                            ? formatDate(selectedBayaran.tarikhMemoLadang)
                            : "Belum dibuat"}
                        </p>
                      </div>
                      {selectedBayaran.statusLadang && (
                        <div className="mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              selectedBayaran.statusLadang === "Hold / KIV" 
                                ? "bg-black text-white border-black hover:bg-gray-800" 
                                : ""
                            )}
                          >
                            {selectedBayaran.statusLadang}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarikh Terima */}
                  <div className="flex items-start space-x-4 relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        selectedBayaran.statusBayaran?.toUpperCase() === "BATAL"
                          ? "bg-red-500 text-white"
                          : "bg-green-500 text-white",
                      )}
                    >
                      {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" ? (
                        <span className="text-white font-bold text-lg">!</span>
                      ) : (
                        <span className="text-white">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Tarikh Terima</p>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedBayaran.tarikhTerima)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Daripada: {selectedBayaran.daripada}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nota Kaki Section */}
            {selectedBayaran.notaKaki && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nota Kaki</Label>
                  {selectedBayaran.statusBayaran?.toUpperCase() === "BATAL" && (
                    <Badge variant="destructive" className="text-xs">
                      BATAL
                    </Badge>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs text-red-500 whitespace-normal break-words">
                    {renderNotaKakiWithLinks(selectedBayaran.notaKaki)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex flex-row gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {(user?.role === "semua" || user?.role === "PERLADANGAN" || (user?.role === "KEWANGAN" && selectedBayaran?.statusBayaran === "KEWANGAN")) && (
              <Button
                variant="outline"
                onClick={() => selectedBayaran && handleEdit(selectedBayaran)}
                className="flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => selectedBayaran && handleShare(selectedBayaran)}
              disabled={isSharing || isGeneratingImage}
              className="flex-1 sm:flex-none"
            >
              {isSharing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  <span className="hidden sm:inline">Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
            <Button onClick={() => setShowDetailDialog(false)} className="flex-1 sm:flex-none">
              <span className="hidden sm:inline mr-2">Tutup</span>
              <X className="h-4 w-4 sm:hidden" />
            </Button>
            {user?.role === "semua" && (
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none">
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Padam</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Adakah anda pasti?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak boleh dibuat asal. Ini akan memadamkan rekod bayaran secara kekal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                          Memadam...
                        </>
                      ) : (
                        "Padam"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
