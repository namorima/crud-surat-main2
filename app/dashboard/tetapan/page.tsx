"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Menu, Plus, Loader2, Edit, Trash2, MoreHorizontal, ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import type { Fail, FailPart } from "@/types/fail"
import type { ShareLink, ShareLinkFilter } from "@/types/share-link"
import { ShareLinkForm } from "@/components/share/ShareLinkForm"
import { ShareLinkTable } from "@/components/share/ShareLinkTable"
import { toast as sonnerToast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// FAIL part color mapping
const FAIL_PART_COLORS = {
  HASIL: "#fef3c7", // yellow-100
  "PERTANIAN AM": "#dcfce7", // green-100
  KONTRAK: "#dbeafe", // blue-100
  PERLADANGAN: "#fce7f3", // pink-100
}

const getFailPartColor = (part: string): string => {
  return FAIL_PART_COLORS[part as keyof typeof FAIL_PART_COLORS] || "#f3f4f6"
}

export default function TetapanPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSurat = searchParams.get("from") === "surat"
  const [loading, setLoading] = useState(false)
  const [failData, setFailData] = useState<Fail[]>([])
  const [filteredFailData, setFilteredFailData] = useState<Fail[]>([])
  const [loadingFail, setLoadingFail] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentFail, setCurrentFail] = useState<Fail | null>(null)
  const [units, setUnits] = useState<string[]>([])
  const [formData, setFormData] = useState({
    part: "",
    noLocker: "",
    noFail: "",
    pecahan: "",
    pecahanKecil: "",
    unit: user?.role === "semua" ? "" : user?.role || "",
  })

  // Share Link state
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loadingShareLinks, setLoadingShareLinks] = useState(true)
  const [isSubmittingShareLink, setIsSubmittingShareLink] = useState(false)
  const [isShareLinkDialogOpen, setIsShareLinkDialogOpen] = useState(false)

  // Access control: Block VIEW and PENERIMA types
  useEffect(() => {
    if (user && (user.type === "VIEW" || user.type === "PENERIMA")) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak mempunyai akses ke halaman Tetapan",
        variant: "destructive",
      })
      router.push("/dashboard/surat")
    }
  }, [user, router, toast])

  // Fetch FAIL data
  useEffect(() => {
    const fetchFailData = async () => {
      try {
        setLoadingFail(true)
        const response = await fetch("/api/fail")
        if (!response.ok) throw new Error("Failed to fetch FAIL data")
        const data = await response.json()
        setFailData(data)
      } catch (error) {
        console.error("Error fetching FAIL data:", error)
        toast({
          title: "Ralat",
          description: "Gagal memuatkan data FAIL",
          variant: "destructive",
        })
      } finally {
        setLoadingFail(false)
      }
    }

    fetchFailData()
  }, [])

  // Fetch share links (only for "semua" role)
  useEffect(() => {
    if (user?.role !== "semua") {
      setLoadingShareLinks(false)
      return
    }

    const fetchShareLinks = async () => {
      try {
        setLoadingShareLinks(true)
        const response = await fetch("/api/share-link")
        if (!response.ok) throw new Error("Failed to fetch share links")
        const data = await response.json()
        setShareLinks(data)
      } catch (error) {
        console.error("Error fetching share links:", error)
        sonnerToast.error("Gagal memuatkan senarai pautan kongsi")
      } finally {
        setLoadingShareLinks(false)
      }
    }

    fetchShareLinks()
  }, [user])

  // Fetch units for dropdown
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch("/api/unit-pic")
        if (!response.ok) throw new Error("Failed to fetch units")
        const data = await response.json()
        setUnits(data.units || [])
      } catch (error) {
        console.error("Error fetching units:", error)
      }
    }

    if (user?.role === "semua") {
      fetchUnits()
    }
  }, [user])

  // Filter FAIL data based on user's unit
  useEffect(() => {
    if (!user || failData.length === 0) {
      setFilteredFailData([])
      return
    }

    // If user role is "semua", show all fails
    if (user.role === "semua") {
      setFilteredFailData(failData)
      return
    }

    // Otherwise, filter by user's unit/role
    const filtered = failData.filter((fail) => fail.unit === user.role)
    setFilteredFailData(filtered)
  }, [failData, user])

  const handleSave = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Tetapan disimpan",
        description: "Tetapan anda telah berjaya disimpan.",
      })
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      part: "",
      noLocker: "",
      noFail: "",
      pecahan: "",
      pecahanKecil: "",
      unit: user?.role === "semua" ? "" : user?.role || "",
    })
  }

  const handleAddFail = async () => {
    // Validation
    if (!formData.part || !formData.noFail || !formData.unit) {
      toast({
        title: "Ralat",
        description: "Sila isi semua field yang diperlukan (Part, No. Fail, Unit)",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to add fail")

      const newFail = await response.json()

      // Update local state
      setFailData((prev) => [...prev, newFail])

      toast({
        title: "Berjaya",
        description: "Fail baru telah ditambah",
      })

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error adding fail:", error)
      toast({
        title: "Ralat",
        description: "Gagal menambah fail baru",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditClick = (fail: Fail) => {
    setCurrentFail(fail)
    setFormData({
      part: fail.part,
      noLocker: fail.noLocker,
      noFail: fail.noFail,
      pecahan: fail.pecahan,
      pecahanKecil: fail.pecahanKecil,
      unit: fail.unit,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateFail = async () => {
    if (!currentFail) return

    // Validation
    if (!formData.part || !formData.noFail || !formData.unit) {
      toast({
        title: "Ralat",
        description: "Sila isi semua field yang diperlukan (Part, No. Fail, Unit)",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/fail/${currentFail.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to update fail")

      const updatedFail = await response.json()

      // Update local state
      setFailData((prev) => prev.map((f) => (f.id === currentFail.id ? updatedFail : f)))

      toast({
        title: "Berjaya",
        description: "Fail telah dikemaskini",
      })

      setIsEditDialogOpen(false)
      setCurrentFail(null)
      resetForm()
    } catch (error) {
      console.error("Error updating fail:", error)
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini fail",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (fail: Fail) => {
    setCurrentFail(fail)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteFail = async () => {
    if (!currentFail) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/fail/${currentFail.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete fail")

      // Update local state
      setFailData((prev) => prev.filter((f) => f.id !== currentFail.id))

      toast({
        title: "Berjaya",
        description: "Fail telah dipadam",
      })

      setIsDeleteDialogOpen(false)
      setCurrentFail(null)
    } catch (error) {
      console.error("Error deleting fail:", error)
      toast({
        title: "Ralat",
        description: "Gagal memadam fail",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Share Link functions
  const handleCreateShareLink = async (
    filter: ShareLinkFilter,
    expiresAt?: string,
    description?: string
  ) => {
    if (!user) return

    try {
      setIsSubmittingShareLink(true)
      const response = await fetch("/api/share-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterJson: JSON.stringify(filter),
          createdBy: user.name,
          createdAt: new Date().toISOString(),
          expiresAt,
          description,
        }),
      })

      if (!response.ok) throw new Error("Failed to create share link")

      const { linkId } = await response.json()

      // Refresh share links list
      const fetchResponse = await fetch("/api/share-link")
      if (fetchResponse.ok) {
        const data = await fetchResponse.json()
        setShareLinks(data)
      }

      sonnerToast.success("Pautan berjaya dijana!")

      // Copy link to clipboard
      const baseUrl = window.location.origin
      const url = `${baseUrl}/share/${linkId}`
      try {
        await navigator.clipboard.writeText(url)
        sonnerToast.success("Link telah disalin ke clipboard!")
      } catch {
        // Clipboard copy failed, but link was created successfully
      }

      // Close dialog
      setIsShareLinkDialogOpen(false)
    } catch (error) {
      console.error("Error creating share link:", error)
      sonnerToast.error("Gagal menjana pautan")
    } finally {
      setIsSubmittingShareLink(false)
    }
  }

  const handleDeleteShareLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/share-link/${linkId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete share link")

      // Update local state
      setShareLinks((prev) => prev.filter((link) => link.linkId !== linkId))
    } catch (error) {
      console.error("Error deleting share link:", error)
      throw error // Re-throw to let ShareLinkTable handle the error toast
    }
  }

  return (
    <div className="space-y-6">
      <Card className="card-hover transition-all duration-300 ease-in-out hover:shadow-md">
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
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <CardTitle className="text-base md:text-xl">Tetapan</CardTitle>
            </div>
            {fromSurat && (
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup-fail">
            <TabsList>
              <TabsTrigger value="setup-fail">Setup Fail</TabsTrigger>
              {user?.role === "semua" && <TabsTrigger value="pautan-kongsi">Pautan Kongsi</TabsTrigger>}
              <TabsTrigger value="integrasi">Integrasi</TabsTrigger>
            </TabsList>

            <TabsContent value="setup-fail" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Setup Fail</CardTitle>
                      <CardDescription>
                        Senarai fail {user?.role === "semua" ? "semua unit" : `untuk unit ${user?.role}`}
                      </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Fail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Tambah Fail Baru</DialogTitle>
                          <DialogDescription>Masukkan maklumat fail baru di bawah.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {/* Row 1: Part, No. Locker, No. Fail */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="part">
                                Part <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="part"
                                name="part"
                                value={formData.part}
                                onChange={handleInputChange}
                                placeholder="PERTANIAN AM"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="noLocker">No. Locker</Label>
                              <Input
                                id="noLocker"
                                name="noLocker"
                                value={formData.noLocker}
                                onChange={handleInputChange}
                                placeholder="B1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="noFail">
                                No. Fail <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="noFail"
                                name="noFail"
                                value={formData.noFail}
                                onChange={handleInputChange}
                                placeholder="2"
                              />
                            </div>
                          </div>

                          {/* Row 2: Pecahan, Pecahan Kecil */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="pecahan">Pecahan</Label>
                              <Input
                                id="pecahan"
                                name="pecahan"
                                value={formData.pecahan}
                                onChange={handleInputChange}
                                placeholder="Masukkan pecahan"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pecahanKecil">Pecahan Kecil</Label>
                              <Input
                                id="pecahanKecil"
                                name="pecahanKecil"
                                value={formData.pecahanKecil}
                                onChange={handleInputChange}
                                placeholder="Masukkan pecahan kecil"
                              />
                            </div>
                          </div>

                          {/* Row 3: Unit */}
                          <div className="space-y-2">
                            <Label htmlFor="unit">
                              Unit <span className="text-red-500">*</span>
                            </Label>
                            {user?.role === "semua" ? (
                              <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                                <SelectTrigger>
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
                              <>
                                <Input
                                  id="unit"
                                  name="unit"
                                  value={formData.unit}
                                  onChange={handleInputChange}
                                  placeholder="Unit"
                                  disabled
                                  className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Unit auto-filled berdasarkan role anda</p>
                              </>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
                            Batal
                          </Button>
                          <Button onClick={handleAddFail} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Fail Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Kemaskini Fail</DialogTitle>
                          <DialogDescription>Kemaskini maklumat fail yang dipilih.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {/* Row 1: Part, No. Locker, No. Fail */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-part">Part</Label>
                              <Input
                                id="edit-part"
                                placeholder="PERTANIAN AM"
                                value={formData.part}
                                onChange={(e) => handleInputChange("part", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-noLocker">No. Locker</Label>
                              <Input
                                id="edit-noLocker"
                                placeholder="B1"
                                value={formData.noLocker}
                                onChange={(e) => handleInputChange("noLocker", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-noFail">
                                No. Fail <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="edit-noFail"
                                placeholder="2"
                                value={formData.noFail}
                                onChange={(e) => handleInputChange("noFail", e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          {/* Row 2: Pecahan, Pecahan Kecil */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-pecahan">Pecahan</Label>
                              <Input
                                id="edit-pecahan"
                                value={formData.pecahan}
                                onChange={(e) => handleInputChange("pecahan", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-pecahanKecil">Pecahan Kecil</Label>
                              <Input
                                id="edit-pecahanKecil"
                                value={formData.pecahanKecil}
                                onChange={(e) => handleInputChange("pecahanKecil", e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Row 3: Unit */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-unit">
                              Unit <span className="text-red-500">*</span>
                            </Label>
                            {user?.role === "semua" ? (
                              <>
                                <Select
                                  value={formData.unit}
                                  onValueChange={(value) => handleSelectChange("unit", value)}
                                >
                                  <SelectTrigger id="edit-unit">
                                    <SelectValue placeholder="Pilih Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {units.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            ) : (
                              <>
                                <Input id="edit-unit" disabled className="bg-muted" value={formData.unit} />
                              </>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                            Batal
                          </Button>
                          <Button onClick={handleUpdateFail} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengemaskini...
                              </>
                            ) : (
                              "Kemaskini"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Padam Fail</AlertDialogTitle>
                          <AlertDialogDescription>
                            Adakah anda pasti untuk memadam fail ini? Tindakan ini tidak boleh dibatalkan.
                            {currentFail && (
                              <div className="mt-4 p-3 bg-muted rounded-md">
                                <p className="font-medium">
                                  {currentFail.part} - {currentFail.noFail}
                                </p>
                                <p className="text-sm text-muted-foreground">{currentFail.unit}</p>
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteFail}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memadam...
                              </>
                            ) : (
                              "Padam"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingFail ? (
                    <div className="flex justify-center py-8">
                      <p className="text-muted-foreground">Memuatkan data...</p>
                    </div>
                  ) : filteredFailData.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <p className="text-muted-foreground">Tiada data fail</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">No</TableHead>
                            <TableHead>Part</TableHead>
                            <TableHead>No. Locker</TableHead>
                            <TableHead>No. Fail</TableHead>
                            <TableHead>Pecahan</TableHead>
                            <TableHead>Pecahan Kecil</TableHead>
                            <TableHead>Unit</TableHead>
                            {user?.role === "semua" && <TableHead className="w-[80px]">Tindakan</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFailData.map((fail, index) => (
                            <TableRow key={fail.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: getFailPartColor(fail.part),
                                    borderColor: getFailPartColor(fail.part),
                                  }}
                                >
                                  {fail.part}
                                </Badge>
                              </TableCell>
                              <TableCell>{fail.noLocker || "-"}</TableCell>
                              <TableCell className="font-medium">{fail.noFail}</TableCell>
                              <TableCell>{fail.pecahan || "-"}</TableCell>
                              <TableCell>{fail.pecahanKecil || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{fail.unit}</Badge>
                              </TableCell>
                              {user?.role === "semua" && (
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Buka menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleEditClick(fail)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteClick(fail)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Padam
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Jumlah: {filteredFailData.length} fail
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="pautan-kongsi" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Senarai Pautan Kongsi</CardTitle>
                      <CardDescription>Pautan yang telah dijana untuk dikongsi kepada pihak luar</CardDescription>
                    </div>
                    <Dialog open={isShareLinkDialogOpen} onOpenChange={setIsShareLinkDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Cipta Pautan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Cipta Pautan Kongsi Baru</DialogTitle>
                          <DialogDescription>Pilih filter untuk data bayaran yang ingin dikongsi</DialogDescription>
                        </DialogHeader>
                        <ShareLinkForm onSubmit={handleCreateShareLink} isSubmitting={isSubmittingShareLink} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingShareLinks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Memuatkan...</span>
                    </div>
                  ) : (
                    <ShareLinkTable
                      shareLinks={shareLinks}
                      onDelete={handleDeleteShareLink}
                      baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">Jumlah: {shareLinks.length} pautan</p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="integrasi" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tetapan Integrasi</CardTitle>
                  <CardDescription>Konfigurasi integrasi dengan perkhidmatan luar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-api-key">Google API Key</Label>
                    <Input id="google-api-key" type="password" placeholder="Masukkan Google API Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-client-email">Google Client Email</Label>
                    <Input id="google-client-email" placeholder="Masukkan Google Client Email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-private-key">Google Private Key</Label>
                    <Input id="google-private-key" type="password" placeholder="Masukkan Google Private Key" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Tetapan"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
