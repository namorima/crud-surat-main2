"use client"

import type React from "react"
import type { FXNotification } from "@/types/fx-notification"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import type { Surat } from "@/types/surat"
import type { Fail } from "@/types/fail"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  AlertCircle,
  ArrowUpDown,
  Settings,
  Search,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  ArrowDown,
  ArrowUp,
  ArrowDownUp,
  Menu,
  Loader2,
  Share2,
  Bell,
  MessageSquare,
  Reply,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ShareImageGenerator } from "@/components/share-image-generator"

// Number of items per page
const ITEMS_PER_PAGE = 15

// Unit color mapping
const UNIT_COLORS = {
  PERLADANGAN: "#ffe5a0", // light yellow
  PERANCANG: "#bfe1f6", // light blue
  TKA: "#ffcfc9", // light red/pink
  MSPO: "#ffcfc9", // light red/pink
  PEMASARAN: "#d4edbc", // light green
}

// FAIL part color mapping
const FAIL_PART_COLORS = {
  HASIL: "#fef3c7", // yellow-100
  "PERTANIAN AM": "#d1fae5", // green-100
  KONTRAK: "#fed7aa", // orange-100
}

// Helper function to format fail display text (for showing in UI - uses PECAHAN and PECAHAN KECIL)
const formatFailDisplay = (fail: Fail): string => {
  // If PECAHAN is empty, use PECAHAN KECIL directly
  if (!fail.pecahan && fail.pecahanKecil) {
    return fail.pecahanKecil
  }

  // If PECAHAN is empty and PECAHAN KECIL is also empty, return "-"
  if (!fail.pecahan) return "-"

  // If both PECAHAN and PECAHAN KECIL exist, show both
  if (fail.pecahanKecil) {
    return `${fail.pecahan} (${fail.pecahanKecil})`
  }

  // If only PECAHAN exists, show PECAHAN only
  return fail.pecahan
}

// Helper function to get fail value for storage (uses NO LOCKER and NO FAIL)
const getFailValue = (fail: Fail): string => {
  if (!fail.noLocker && !fail.noFail) return "-"
  return `${fail.noLocker} ${fail.noFail}`.trim()
}

// Helper function to get full fail display from stored value (for detail view)
// Format: "B1 5 - PENGHASILAN (ANGKUT)" where B1 5 is stored value, PENGHASILAN (ANGKUT) is display
const getFullFailDisplay = (storedValue: string, failData: Fail[]): string => {
  if (!storedValue || storedValue === "-") return "-"

  // Find the fail object that matches the stored value
  const matchingFail = failData.find((fail) => getFailValue(fail) === storedValue)

  if (matchingFail) {
    const displayPart = formatFailDisplay(matchingFail)
    return `${storedValue} - ${displayPart}`
  }

  // If no match found, just return the stored value
  return storedValue
}

// Helper function to get fail part from stored value
const getFailPartFromStoredValue = (storedValue: string, failData: Fail[]): string => {
  if (!storedValue || storedValue === "-") return ""

  // Find the fail object that matches the stored value
  const matchingFail = failData.find((fail) => getFailValue(fail) === storedValue)

  return matchingFail ? matchingFail.part : ""
}

// Helper function to get fail part color
const getFailPartColor = (part: string): string => {
  return FAIL_PART_COLORS[part as keyof typeof FAIL_PART_COLORS] || "#ffffff"
}

export default function SuratPage() {
  const { user } = useAuth()
  const [surat, setSurat] = useState<Surat[]>([])
  const [filteredSurat, setFilteredSurat] = useState<Surat[]>([])
  const [displayedSurat, setDisplayedSurat] = useState<Surat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [kategoriFilter, setKategoriFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSurat, setCurrentSurat] = useState<Surat | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  const [perkaraSuggestions, setPerkaraSuggestions] = useState<string[]>([])
  const [daripadaKepadaSuggestions, setDaripadaKepadaSuggestions] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [unitPicMap, setUnitPicMap] = useState<Record<string, string[]>>({})
  const [failData, setFailData] = useState<Fail[]>([])
  const [filteredFailData, setFilteredFailData] = useState<Fail[]>([])
  const [selectedFailId, setSelectedFailId] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailSurat, setDetailSurat] = useState<Surat | null>(null)

  // FX Notifications state
  const [fxNotifications, setFxNotifications] = useState<FXNotification[]>([])
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  // Add these state variables inside the component
  const [generatingImage, setGeneratingImage] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<Surat | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [sharingItemId, setSharingItemId] = useState<string | null>(null)

  // Sorting state
  const [sortField, setSortField] = useState<keyof Surat | null>("bil")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    bil: true,
    tarikh: true,
    kategori: true,
    perkara: true,
    reference: true,
    nota: true,
    actions: true,
  })

  // Form state
  const [formData, setFormData] = useState({
    bil: 0,
    daripadaKepada: "",
    tarikh: "",
    perkara: "",
    kategori: "MASUK",
    unit: "",
    fail: "",
    tindakanPic: "",
    status: "BELUM PROSES" as "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL",
    tarikhSelesai: "",
    nota: "",
    komen: "",
    reference: "",
  })

  // State untuk reference bil (untuk respon surat)
  const [referenceBil, setReferenceBil] = useState<number | null>(null)

  // Check user permissions
  const canEdit = user?.role === "semua" || user?.role === surat.find((s) => s.unit === user.role)?.unit
  const canDelete = user?.role === "semua"
  const canViewAll = user?.role === "semua" || user?.role === "PENGURUS"
  const canComment = user?.role === "PENGURUS"
  const canEditFull = user?.role === "semua" || user?.role === surat.find((s) => s.unit === user.role)?.unit

  // Add these state variables after the existing state declarations
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Add this function to handle comment submission
  const handleAddComment = async () => {
    if (!currentSurat || !commentText.trim()) return

    setIsAddingComment(true)
    try {
      // Create updated data with the new comment
      const updatedData = {
        ...currentSurat,
        komen: commentText.trim(),
      }

      const response = await fetch("/api/surat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowIndex: Number.parseInt(currentSurat.id),
          data: updatedData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error updating comment: ${response.status} ${response.statusText}`)
      }

      setIsCommentDialogOpen(false)
      setCommentText("")
      setCurrentSurat(null)
      // Invalidate cache to force refresh
      setLastFetchTime(null)
      fetchWithCache()
    } catch (error) {
      console.error("Error adding comment:", error)
      setError(error.message || "Failed to add comment. Please try again.")
    } finally {
      setIsAddingComment(false)
    }
  }

  // Add this function to open comment dialog
  const openCommentDialog = (surat: Surat) => {
    setCurrentSurat(surat)
    setCommentText(surat.komen || "")
    setIsCommentDialogOpen(true)
  }

  // Get unique units for filtering
  const uniqueUnits = useMemo(() => Array.from(new Set(surat.map((item) => item.unit))).filter(Boolean), [surat])

  // Get the highest BIL value
  const getNextBilValue = useCallback(() => {
    if (!surat || surat.length === 0) return 1

    const highestBil = Math.max(...surat.map((item) => item.bil || 0))
    return highestBil + 1
  }, [surat])

  // Date formatting functions
  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return ""

    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes("/")) {
      return dateString
    }

    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateString.includes("-")) {
      const parts = dateString.split("-")
      if (parts.length === 3) {
        return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`
      }
    }

    return dateString
  }

  const formatDateToInput = (dateString: string) => {
    if (!dateString) return ""

    // If in DD/MM/YYYY format, convert to YYYY-MM-DD for input
    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
      }
    }

    // If already in YYYY-MM-DD format, return as is
    return dateString
  }

  const getCurrentDateFormatted = () => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, "0")
    const month = (today.getMonth() + 1).toString().padStart(2, "0")
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Cache mechanism
  const fetchWithCache = useCallback(async () => {
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
    const currentTime = Date.now()

    // If data was fetched recently, use cached data
    if (lastFetchTime && currentTime - lastFetchTime < CACHE_DURATION && surat.length > 0) {
      return
    }

    setLoading(true)
    // Add a subtle loading animation to the card
    const card = document.querySelector(".card-hover")
    if (card) {
      card.classList.add("animate-pulse")
      setTimeout(() => {
        card.classList.remove("animate-pulse")
      }, 1000)
    }
    setError(null)

    try {
      const response = await fetch("/api/surat")

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data)
        throw new Error("Invalid data format received from server")
      }

      setSurat(data)

      // Extract unique perkara values for suggestions
      const uniquePerkara = Array.from(new Set(data.map((item) => item.perkara))).filter(Boolean)
      setPerkaraSuggestions(uniquePerkara)

      // Update last fetch time
      setLastFetchTime(currentTime)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error.message || "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [lastFetchTime, surat.length])

  // Fetch Unit and PIC data
  const fetchUnitAndPicData = useCallback(async () => {
    try {
      const response = await fetch("/api/unit-pic")
      if (!response.ok) {
        throw new Error(`Error fetching unit and PIC data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUnits(data.units || [])
      setUnitPicMap(data.unitPicMap || {})
    } catch (error) {
      console.error("Error fetching unit and PIC data:", error)
    }
  }, [])

  // Fetch FAIL data
  const fetchFailData = useCallback(async () => {
    try {
      const response = await fetch("/api/fail")
      if (!response.ok) {
        throw new Error(`Error fetching FAIL data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setFailData(data || [])
    } catch (error) {
      console.error("Error fetching FAIL data:", error)
    }
  }, [])

  // Filter FAIL data based on user's unit for PERLADANGAN
  useEffect(() => {
    if (!user || failData.length === 0) {
      setFilteredFailData([])
      return
    }

    // Filter fail data based on unit restriction
    const filtered = failData.filter((fail) => {
      // If fail.unit is PERLADANGAN, only show to users with PERLADANGAN role
      if (fail.unit === "PERLADANGAN") {
        return user.role === "PERLADANGAN"
      }
      // Otherwise, show to all users
      return true
    })

    setFilteredFailData(filtered)
  }, [failData, user])

  // Fetch DaripadaKepada suggestions
  const fetchDaripadaKepadaSuggestions = useCallback(async () => {
    try {
      const response = await fetch("/api/daripada-kepada")
      if (!response.ok) {
        throw new Error(`Error fetching daripada/kepada data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDaripadaKepadaSuggestions(data || [])
    } catch (error) {
      console.error("Error fetching daripada/kepada suggestions:", error)
    }
  }, [])

  // Fetch FX notifications
  const fetchFXNotifications = useCallback(async () => {
    setNotificationLoading(true)
    try {
      const response = await fetch("/api/fx-notifications")
      if (!response.ok) {
        throw new Error(`Error fetching FX notifications: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setFxNotifications(data || [])
      setNotificationCount(data?.length || 0)
    } catch (error) {
      console.error("Error fetching FX notifications:", error)
    } finally {
      setNotificationLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWithCache()
    fetchUnitAndPicData()
    fetchFailData()
    fetchDaripadaKepadaSuggestions()
    fetchFXNotifications()

    // Set up periodic refresh
    const intervalId = setInterval(
      () => {
        fetchWithCache()
        fetchFXNotifications()
      },
      10 * 60 * 1000,
    ) // Refresh every 10 minutes

    return () => clearInterval(intervalId)
  }, [fetchWithCache, fetchUnitAndPicData, fetchDaripadaKepadaSuggestions, fetchFXNotifications])

  useEffect(() => {
    filterSurat()
  }, [surat, searchQuery, statusFilter, unitFilter, kategoriFilter, dateFilter, user, sortField, sortDirection])

  useEffect(() => {
    // Update displayed surat based on pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setDisplayedSurat(filteredSurat.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(filteredSurat.length / ITEMS_PER_PAGE))
  }, [filteredSurat, currentPage])

  // Focus search input when search button is clicked
  useEffect(() => {
    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      if (showSearchInput && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [showSearchInput])

  // Update PIC options when unit changes
  useEffect(() => {
    if (formData.unit && !formData.tindakanPic) {
      // If unit is selected but no PIC is selected, reset PIC
      setFormData((prev) => ({ ...prev, tindakanPic: "" }))
    }
  }, [formData.unit])

  // Auto-set status to SELESAI when kategori is KELUAR
  useEffect(() => {
    if (formData.kategori === "KELUAR") {
      setFormData((prev) => ({
        ...prev,
        status: "SELESAI",
        tarikhSelesai: prev.tarikhSelesai || getCurrentDateFormatted(),
      }))
    }
  }, [formData.kategori])

  const filterSurat = () => {
    if (!Array.isArray(surat)) {
      setFilteredSurat([])
      return
    }

    let filtered = [...surat]

    // Filter by user role/unit if not admin or pengurus
    if (user && user.role !== "semua" && user.role !== "PENGURUS") {
      filtered = filtered.filter((item) => item.unit === user.role)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          (item.daripadaKepada || "").toLowerCase().includes(query) ||
          (item.perkara || "").toLowerCase().includes(query) ||
          (item.kategori || "").toLowerCase().includes(query) ||
          (item.unit || "").toLowerCase().includes(query) ||
          (item.tindakanPic || "").toLowerCase().includes(query) ||
          (item.reference || "").toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Apply unit filter
    if (unitFilter !== "all") {
      filtered = filtered.filter((item) => item.unit === unitFilter)
    }

    // Apply kategori filter
    if (kategoriFilter !== "all") {
      filtered = filtered.filter((item) => item.kategori === kategoriFilter)
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, "dd/MM/yyyy")
      filtered = filtered.filter((item) => item.tarikh === filterDate)
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] || ""
        const bValue = b[sortField] || ""

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        const aString = String(aValue).toLowerCase()
        const bString = String(bValue).toLowerCase()

        if (sortDirection === "asc") {
          return aString.localeCompare(bString)
        } else {
          return bString.localeCompare(aString)
        }
      })
    }

    setFilteredSurat(filtered)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  const handleSort = (field: keyof Surat) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    filterSurat()
  }

  const handleUnitFilter = (unit: string) => {
    setUnitFilter(unit)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleKategoriFilter = (kategori: string) => {
    setKategoriFilter(kategori)
  }

  const handleDateFilter = (date: Date | undefined) => {
    setDateFilter(date)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setUnitFilter("all")
    setKategoriFilter("all")
    setDateFilter(undefined)
    setShowSearchInput(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.unit) {
      errors.unit = "Unit wajib diisi"
    }

    if (!formData.tindakanPic) {
      errors.tindakanPic = "Tindakan PIC wajib diisi"
    }

    if (!formData.status) {
      errors.status = "Status wajib diisi"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Function to open add dialog with reference
  const handleOpenAddDialog = (refBil?: number) => {
    if (refBil) {
      setReferenceBil(refBil)
      resetForm(refBil)
    } else {
      setReferenceBil(null)
      resetForm()
    }
    setIsAddDialogOpen(true)
  }

  const handleAddSurat = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      // Set the BIL to the next value
      const nextBil = getNextBilValue()

      // Format dates for API
      const formattedData = {
        ...formData,
        bil: nextBil,
        tarikh: formatDateToDisplay(formData.tarikh),
        tarikhSelesai: formData.tarikhSelesai ? formatDateToDisplay(formData.tarikhSelesai) : "",
      }

      const response = await fetch("/api/surat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        throw new Error(`Error adding data: ${response.status} ${response.statusText}`)
      }

      // If this is a response to another letter, update the original letter's reference field and status
      if (referenceBil) {
        const originalSurat = surat.find((item) => item.bil === referenceBil)
        if (originalSurat) {
          const updatedOriginalSurat = {
            ...originalSurat,
            reference: nextBil.toString(),
            status: "SELESAI" as const, // Auto-update status to SELESAI when Respon is added
            tarikhSelesai: getCurrentDateFormatted(), // Auto-fill tarikhSelesai with today's date
          }

          // Update the original surat with the new reference and status
          const updateResponse = await fetch("/api/surat", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rowIndex: Number.parseInt(originalSurat.id),
              data: updatedOriginalSurat,
            }),
          })

          if (!updateResponse.ok) {
            console.error("Failed to update original surat reference and status")
          }
        }
      }

      setIsAddDialogOpen(false)
      setReferenceBil(null)
      resetForm()
      // Invalidate cache to force refresh
      setLastFetchTime(null)
      fetchWithCache()
    } catch (error) {
      console.error("Error adding surat:", error)
      setError(error.message || "Failed to add data. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSurat = async () => {
    if (!currentSurat) return

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      // Format dates for API
      const formattedData = {
        ...formData,
        tarikh: formatDateToDisplay(formData.tarikh),
        tarikhSelesai: formData.tarikhSelesai ? formatDateToDisplay(formData.tarikhSelesai) : "",
      }

      const response = await fetch("/api/surat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowIndex: Number.parseInt(currentSurat.id),
          data: formattedData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error updating data: ${response.status} ${response.statusText}`)
      }

      setIsEditDialogOpen(false)
      resetForm()
      // Invalidate cache to force refresh
      setLastFetchTime(null)
      fetchWithCache()
    } catch (error) {
      console.error("Error updating surat:", error)
      setError(error.message || "Failed to update data. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSurat = async () => {
    if (!currentSurat) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/surat?rowIndex=${currentSurat.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error deleting data: ${response.status} ${response.statusText}`)
      }

      setIsDeleteDialogOpen(false)
      // Invalidate cache to force refresh
      setLastFetchTime(null)
      fetchWithCache()
    } catch (error) {
      console.error("Error deleting surat:", error)
      setError(error.message || "Failed to delete data. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (surat: Surat) => {
    setCurrentSurat(surat)
    setFormData({
      bil: surat.bil,
      daripadaKepada: surat.daripadaKepada,
      tarikh: formatDateToInput(surat.tarikh),
      perkara: surat.perkara,
      kategori: surat.kategori || "MASUK",
      unit: surat.unit,
      fail: surat.fail,
      tindakanPic: surat.tindakanPic,
      status: surat.status || "BELUM PROSES",
      tarikhSelesai: surat.tarikhSelesai ? formatDateToInput(surat.tarikhSelesai) : "",
      nota: surat.nota,
      komen: surat.komen || "",
      reference: surat.reference || "",
    })

    // Find the fail object that matches the stored value
    const matchingFail = filteredFailData.find((fail) => getFailValue(fail) === surat.fail)
    if (matchingFail) {
      setSelectedFailId(matchingFail.id)
    } else {
      setSelectedFailId("")
    }

    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (surat: Surat) => {
    setCurrentSurat(surat)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = (refBil?: number) => {
    const referenceValue = refBil !== undefined ? refBil.toString() : (referenceBil ? referenceBil.toString() : "")

    setFormData({
      bil: getNextBilValue(),
      daripadaKepada: "",
      tarikh: formatDateToInput(getCurrentDateFormatted()),
      perkara: "",
      kategori: "MASUK",
      unit: user?.role !== "semua" && user?.role !== "PENGURUS" ? user?.role : "",
      fail: "",
      tindakanPic: "",
      status: "BELUM PROSES",
      tarikhSelesai: "",
      nota: "",
      komen: "",
      reference: referenceValue,
    })
    setFormErrors({})
    setCurrentSurat(null)
    setSelectedFailId("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Auto uppercase for specific fields
    if (name === "daripadaKepada" || name === "perkara" || name === "fail") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    // Special handling for fail field
    if (name === "fail") {
      setSelectedFailId(value)
      // Find the selected fail object and get its storage value
      const selectedFail = filteredFailData.find((fail) => fail.id === value)
      if (selectedFail) {
        const storageValue = getFailValue(selectedFail)
        setFormData((prev) => ({ ...prev, [name]: storageValue }))
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // If unit is changed, reset tindakanPic
    if (name === "unit") {
      setFormData((prev) => ({ ...prev, tindakanPic: "" }))
    }

    // If kategori is changed to KELUAR, set status to SELESAI
    if (name === "kategori" && value === "KELUAR") {
      setFormData((prev) => ({
        ...prev,
        status: "SELESAI",
        tarikhSelesai: prev.tarikhSelesai || formatDateToInput(getCurrentDateFormatted()),
      }))
    }
  }

  const handlePerkaraSelect = (perkara: string) => {
    setFormData((prev) => ({ ...prev, perkara }))
  }

  const handleDaripadaKepadaSelect = (daripadaKepada: string) => {
    setFormData((prev) => ({ ...prev, daripadaKepada }))
  }

  const toggleSearch = () => {
    setShowSearchInput(!showSearchInput)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "HOLD / KIV":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
      case "DALAM TINDAKAN":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
      case "SELESAI":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
      case "BATAL":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Get unit color
  const getUnitColor = (unit: string) => {
    return UNIT_COLORS[unit] || "#f3f4f6" // default light gray if no color defined
  }

  // Function to convert BIL references in text to clickable spans
  const formatBilReferences = (text: string) => {
    if (!text) return ""

    // Replace #123 patterns with clickable spans
    return text.replace(/#(\d+)/g, (match, bilNumber) => {
      return `<span class="text-blue-600 cursor-pointer hover:underline" data-bil="${bilNumber}">${match}</span>`
    })
  }

  const handleBilReferenceClick = (bilNumber: string) => {
    // Find the surat with the matching BIL
    const foundSurat = surat.find((item) => item.bil === Number.parseInt(bilNumber))
    if (foundSurat) {
      setDetailSurat(foundSurat)
      setIsDetailModalOpen(true)
    }
  }

  // Add this function to handle BIL search
  // Add it around line ~600, near the other search-related functions

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  // Add this new function to handle the search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if the search query is a BIL reference (starts with #)
    const bilMatch = searchQuery.match(/^#(\d+)$/)
    if (bilMatch) {
      const bilNumber = bilMatch[1]
      // Find the surat with the matching BIL
      const foundSurat = surat.find((item) => item.bil === Number.parseInt(bilNumber))
      if (foundSurat) {
        setDetailSurat(foundSurat)
        setIsDetailModalOpen(true)
        // Clear the search after opening the modal
        setSearchQuery("")
        setShowSearchInput(false)
      }
    }
  }

  // Add this function to generate the WhatsApp share text
  const generateWhatsAppShareText = (item: Surat) => {
    const statusText = item.status === "DALAM TINDAKAN" ? "DALAM TINDAKAN" : item.status
    const kategoriText = item.kategori === "MASUK" ? "MASUK ↓" : "KELUAR ↑"

    let shareText = `#${item.bil}\n\n`
    shareText += `${statusText}\n\n`
    shareText += `Kategori: ${kategoriText}\n`
    shareText += `Tarikh: ${item.tarikh}\n`
    shareText += `DARIPADA: ${item.daripadaKepada}\n\n`
    shareText += `${item.perkara}\n\n`
    shareText += `${item.unit}\n`
    shareText += `PIC: ${item.tindakanPic}\n`

    if (item.reference) {
      shareText += `Respon : ${item.reference}\n`
    }
    shareText += `\n`

    if (item.nota) {
      shareText += `Nota: ${item.nota}\n`
    }

    return encodeURIComponent(shareText)
  }

  // Add this function to handle WhatsApp sharing with image
  const handleShareToWhatsApp = (item: Surat) => {
    setGeneratingImage(true)
    setShareItem(item)
    setSharingItemId(item.id)
  }

  // Replace the handleImageGenerated function with this:
  const handleImageGenerated = async (imageUrl: string, directLink: string) => {
    setShareImageUrl(imageUrl)
    setGeneratingImage(false)
    setSharingItemId(null)

    // Create the formatted text for WhatsApp with the new format
    const kategoriEmoji = shareItem?.kategori === "MASUK" ? "🔴" : "🔵"
    const daripadaKepada = shareItem?.kategori === "MASUK" ? "DARIPADA" : "KEPADA"

    const text =
      `📌*#${shareItem?.bil}* _${shareItem?.kategori}_ ${kategoriEmoji}\n\n` +
      `> ${shareItem?.tarikh} 📆\n` +
      `> ${daripadaKepada} : *_${shareItem?.daripadaKepada}_*\n\n` +
      `*${shareItem?.perkara}*\n\n` +
      `Detail: ${directLink}`

    // Determine if we're on mobile
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    // Create the WhatsApp URL
    const whatsappUrl = isMobileDevice
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`

    // Open WhatsApp
    window.location.href = whatsappUrl;

    // Reset states
    setShareItem(null)
    setShareImageUrl(null)
  }

  // Add this function to handle errors
  const handleShareError = (error: Error) => {
    console.error("Error sharing to WhatsApp:", error)
    setShareError("Failed to upload image. Please try again.")
    setGeneratingImage(false)
    setSharingItemId(null)
    setShareItem(null)
  }

  // Add this function after the handleShareError function
  const handleNotificationBilClick = (bilNumber: number) => {
    // Find the surat with the matching BIL
    const foundSurat = surat.find((item) => item.bil === bilNumber)
    if (foundSurat) {
      setDetailSurat(foundSurat)
      setIsDetailModalOpen(true)
      setIsNotificationModalOpen(false) // Close notification modal
    }
  }

  if (loading && surat.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-screen overflow-hidden">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              <CardTitle className="text-base md:text-xl">Surat</CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {/* Mobile toolbar */}
              <div className="flex md:hidden items-center gap-1">
                {/* Sort Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-7 w-7">
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
                          setSortField("bil")
                          setSortDirection("desc")
                        }}
                      >
                        <ArrowDown className="mr-2 h-3 w-3" />
                        Bil (Besar ke Kecil)
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setSortField("bil")
                          setSortDirection("asc")
                        }}
                      >
                        <ArrowUp className="mr-2 h-3 w-3" />
                        Bil (Kecil ke Besar)
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setSortField("tarikh")
                          setSortDirection("desc")
                        }}
                      >
                        <ArrowDown className="mr-2 h-3 w-3" />
                        Tarikh (Terbaru)
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Filter Button - Only shows when filters are applied */}
              {(statusFilter !== "all" || unitFilter !== "all" || kategoriFilter !== "all" || dateFilter) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearAllFilters}
                  className="transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-500 h-7 w-7 md:h-8 md:w-8"
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
                      setSearchQuery("")
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
                      className={cn(dateFilter && "text-primary", "h-7 w-7 md:h-8 md:w-8")}
                    >
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="sr-only">Filter Tarikh</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent mode="single" selected={dateFilter} onSelect={handleDateFilter} initialFocus />
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
                        (statusFilter !== "all" || unitFilter !== "all" || kategoriFilter !== "all") && "text-primary",
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
                        <TabsTrigger value="unit">Unit</TabsTrigger>
                        <TabsTrigger value="kategori">Kategori</TabsTrigger>
                      </TabsList>
                      <TabsContent value="status" className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Status</SelectItem>
                              <SelectItem value="BELUM PROSES">BELUM PROSES</SelectItem>
                              <SelectItem value="HOLD / KIV">HOLD / KIV</SelectItem>
                              <SelectItem value="DALAM TINDAKAN">DALAM TINDAKAN</SelectItem>
                              <SelectItem value="SELESAI">SELESAI</SelectItem>
                              <SelectItem value="BATAL">BATAL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      <TabsContent value="unit" className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select value={unitFilter} onValueChange={handleUnitFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Unit</SelectItem>
                              {uniqueUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      <TabsContent value="kategori" className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Kategori</Label>
                          <Select value={kategoriFilter} onValueChange={handleKategoriFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Kategori</SelectItem>
                              <SelectItem value="MASUK">MASUK</SelectItem>
                              <SelectItem value="KELUAR">KELUAR</SelectItem>
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
                          unitFilter === "all" &&
                          kategoriFilter === "all" &&
                          !dateFilter &&
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

              {/* Column Settings */}
              {!showSearchInput && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                      <Settings className="h-3 w-3 md:h-4 w-4" />
                      <span className="sr-only">Column Settings</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <div className="p-2 text-sm font-medium">Toggle Columns</div>
                    <div className="p-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-bil"
                          checked={columnVisibility.bil}
                          onCheckedChange={(checked) => setColumnVisibility((prev) => ({ ...prev, bil: !!checked }))}
                        />
                        <Label htmlFor="col-bil">Bil</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-tarikh"
                          checked={columnVisibility.tarikh}
                          onCheckedChange={(checked) => setColumnVisibility((prev) => ({ ...prev, tarikh: !!checked }))}
                        />
                        <Label htmlFor="col-tarikh">Tarikh</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-kategori"
                          checked={columnVisibility.kategori}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, kategori: !!checked }))
                          }
                        />
                        <Label htmlFor="col-kategori">Kategori</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-perkara"
                          checked={columnVisibility.perkara}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, perkara: !!checked }))
                          }
                        />
                        <Label htmlFor="col-perkara">Perkara</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-reference"
                          checked={columnVisibility.reference}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, reference: !!checked }))
                          }
                        />
                        <Label htmlFor="col-reference">Reference</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-nota"
                          checked={columnVisibility.nota}
                          onCheckedChange={(checked) => setColumnVisibility((prev) => ({ ...prev, nota: !!checked }))}
                        />
                        <Label htmlFor="col-nota">Nota</Label>
                      </div>
                    </div>

                    {/* Sort options */}
                    <div className="border-t pt-2 pb-2 px-2">
                      <div className="text-sm font-medium mb-2">Sort By</div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-full justify-start text-xs"
                          onClick={() => {
                            setSortField("bil")
                            setSortDirection("desc")
                          }}
                        >
                          <ArrowDown className="mr-2 h-3 w-3" />
                          Bil (Besar ke Kecil)
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-full justify-start text-xs"
                          onClick={() => {
                            setSortField("bil")
                            setSortDirection("asc")
                          }}
                        >
                          <ArrowUp className="mr-2 h-3 w-3" />
                          Bil (Kecil ke Besar)
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-full justify-start text-xs"
                          onClick={() => {
                            setSortField("tarikh")
                            setSortDirection("desc")
                          }}
                        >
                          <ArrowDown className="mr-2 h-3 w-3" />
                          Tarikh (Terbaru)
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Notification Button */}
              {!showSearchInput && (
                <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "relative h-7 w-7 md:h-8 md:w-8",
                        notificationCount > 0 && "text-red-500 border-red-200",
                      )}
                      onClick={fetchFXNotifications}
                    >
                      <Bell className="h-3 w-3 md:h-4 md:w-4" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      )}
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden p-3 md:p-6">
                    <DialogHeader className="p-0 md:p-2">
                      <DialogTitle className="text-base md:text-lg flex items-center gap-2">
                        <Bell className="h-4 w-4 text-red-500" />
                        Surat Tertunggak ({notificationCount})
                      </DialogTitle>
                      <DialogDescription className="text-xs md:text-sm">
                        Surat yang belum selesai dan melebihi 30 hari
                      </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-hidden">
                      {notificationLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : fxNotifications.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          <p className="text-muted-foreground">Tiada surat tertunggak</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                          {/* Desktop view */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[80px]">Bil</TableHead>
                                  <TableHead className="w-[300px]">Perkara</TableHead>
                                  <TableHead className="w-[180px]">Unit / Tindakan</TableHead>
                                  <TableHead className="w-[100px]">Status</TableHead>
                                  <TableHead className="w-[80px] text-right">Hari</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {fxNotifications.map((item) => (
                                  <TableRow key={item.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                      <span
                                        className="cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={() => handleNotificationBilClick(item.bil)}
                                      >
                                        #{item.bil}
                                      </span>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                      <div className="whitespace-normal break-words" title={item.perkara}>
                                        {item.perkara}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <Badge
                                          variant="outline"
                                          style={{
                                            backgroundColor: getUnitColor(item.unit),
                                            borderColor: getUnitColor(item.unit),
                                          }}
                                          className="text-xs block w-fit"
                                        >
                                          {item.unit}
                                        </Badge>
                                        <div className="text-xs text-muted-foreground">{item.tindakan}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>{item.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant="destructive" className="text-xs">
                                        {item.hari} hari
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile view */}
                          <div className="md:hidden space-y-3">
                            {fxNotifications.map((item) => (
                              <Card key={item.id} className="p-3 border-l-4 border-l-red-500">
                                <div className="flex justify-between items-start mb-2">
                                  <span
                                    className="font-bold text-sm cursor-pointer hover:text-blue-600 hover:underline"
                                    onClick={() => handleNotificationBilClick(item.bil)}
                                  >
                                    #{item.bil}
                                  </span>
                                  <Badge variant="destructive" className="text-xs">
                                    {item.hari} hari
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <h3 className="font-medium text-xs whitespace-normal break-words">
                                      {item.perkara}
                                    </h3>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-1">
                                      <Badge
                                        variant="outline"
                                        style={{
                                          backgroundColor: getUnitColor(item.unit),
                                          borderColor: getUnitColor(item.unit),
                                        }}
                                        className="text-xs w-fit"
                                      >
                                        {item.unit}
                                      </Badge>
                                      <Badge className={`text-xs w-fit ${getStatusColor(item.status)}`}>
                                        {item.status}
                                      </Badge>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">Tindakan:</span> {item.tindakan}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>
                        Tutup
                      </Button>
                      <Button onClick={fetchFXNotifications} disabled={notificationLoading}>
                        {notificationLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memuat...
                          </>
                        ) : (
                          <>
                            <Bell className="mr-2 h-4 w-4" />
                            Muat Semula
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Add Button */}
              {!showSearchInput && canEditFull && (
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={(open) => {
                    setIsAddDialogOpen(open)
                    if (!open) {
                      // Reset reference when closing dialog
                      setReferenceBil(null)
                      resetForm()
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      onClick={() => {
                        resetForm()
                        handleOpenAddDialog()
                      }}
                      className="h-7 w-7 md:h-8 md:w-8"
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="sr-only">Tambah Surat</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-3 md:p-6">
                    <DialogHeader className="p-0 md:p-2">
                      <DialogTitle className="text-base md:text-lg">Tambah Surat Baru</DialogTitle>
                      <DialogDescription className="text-xs md:text-sm">
                        Masukkan maklumat surat baru di bawah.
                        {referenceBil && (
                          <span className="block mt-1 text-blue-600 font-medium">
                            Respon kepada Surat Bil: {referenceBil}
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-3 md:gap-4 md:py-4">
                      {referenceBil && (
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="reference" className="text-xs md:text-sm">
                            Reference (Bil Surat Asal)
                          </Label>
                          <Input
                            id="reference"
                            name="reference"
                            value={formData.reference}
                            readOnly
                            disabled
                            className="h-8 md:h-10 text-xs md:text-sm bg-muted"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="daripadaKepada" className="text-xs md:text-sm">
                            Daripada/Kepada
                          </Label>
                          <div className="relative">
                            <Input
                              id="daripadaKepada"
                              name="daripadaKepada"
                              value={formData.daripadaKepada}
                              onChange={handleInputChange}
                              className="w-full h-8 md:h-10 text-xs md:text-sm"
                              list="daripadaKepada-suggestions"
                            />
                            <datalist id="daripadaKepada-suggestions">
                              {daripadaKepadaSuggestions
                                .filter((p) => p.toLowerCase().includes(formData.daripadaKepada.toLowerCase()))
                                .slice(0, 5)
                                .map((daripadaKepada) => (
                                  <option key={daripadaKepada} value={daripadaKepada} />
                                ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="tarikh" className="text-xs md:text-sm">
                            Tarikh (DD/MM/YYYY)
                          </Label>
                          <Input
                            id="tarikh"
                            name="tarikh"
                            type="date"
                            value={formData.tarikh}
                            onChange={handleInputChange}
                            className="h-8 md:h-10 text-xs md:text-sm"
                          />
                          <div className="text-xs text-muted-foreground">
                            Format: {formatDateToDisplay(formData.tarikh) || "DD/MM/YYYY"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="perkara" className="text-xs md:text-sm">
                          Perkara
                        </Label>
                        <div className="relative">
                          <Input
                            id="perkara"
                            name="perkara"
                            value={formData.perkara}
                            onChange={handleInputChange}
                            className="w-full h-8 md:h-10 text-xs md:text-sm"
                            list="perkara-suggestions"
                          />
                          <datalist id="perkara-suggestions">
                            {perkaraSuggestions
                              .filter((p) => p.toLowerCase().includes(formData.perkara.toLowerCase()))
                              .slice(0, 5)
                              .map((perkara) => (
                                <option key={perkara} value={perkara} />
                              ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="kategori" className="text-xs md:text-sm">
                            Kategori
                          </Label>
                          <Select
                            value={formData.kategori}
                            onValueChange={(value) => handleSelectChange("kategori", value)}
                          >
                            <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MASUK">MASUK</SelectItem>
                              <SelectItem value="KELUAR">KELUAR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="unit" className="text-xs md:text-sm">
                            Unit <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => handleSelectChange("unit", value)}
                            disabled={user?.role !== "semua" && user?.role !== "PENGURUS"}
                          >
                            <SelectTrigger
                              className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.unit ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Pilih unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.length > 0 ? (
                                units.map((unit) => (
                                  <SelectItem key={unit} value={unit || "unknown"}>
                                    {unit || "Unknown"}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Loading units...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="fail" className="text-xs md:text-sm">
                            Fail
                          </Label>
                          <Select
                            value={selectedFailId}
                            onValueChange={(value) => handleSelectChange("fail", value)}
                          >
                            <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                              <SelectValue placeholder="Pilih fail" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredFailData.length > 0 ? (
                                filteredFailData.map((fail) => (
                                  <SelectItem
                                    key={fail.id}
                                    value={fail.id}
                                    style={{
                                      backgroundColor: getFailPartColor(fail.part),
                                    }}
                                  >
                                    {formatFailDisplay(fail)}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Loading fails...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="tindakanPic" className="text-xs md:text-sm">
                            Tindakan PIC <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.tindakanPic}
                            onValueChange={(value) => handleSelectChange("tindakanPic", value)}
                            disabled={!formData.unit}
                          >
                            <SelectTrigger
                              className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.tindakanPic ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Pilih PIC" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.unit && unitPicMap[formData.unit] && unitPicMap[formData.unit].length > 0 ? (
                                unitPicMap[formData.unit].map((pic) => (
                                  <SelectItem key={pic} value={pic || "unknown"}>
                                    {pic || "Unknown"}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-pic">Tiada PIC</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formErrors.tindakanPic && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.tindakanPic}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="status" className="text-xs md:text-sm">
                            Status <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value)}
                            disabled={formData.kategori === "KELUAR"}
                          >
                            <SelectTrigger
                              className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.status ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BELUM PROSES">BELUM PROSES</SelectItem>
                              <SelectItem value="HOLD / KIV">HOLD / KIV</SelectItem>
                              <SelectItem value="DALAM TINDAKAN">DALAM TINDAKAN</SelectItem>
                              <SelectItem value="SELESAI">SELESAI</SelectItem>
                              <SelectItem value="BATAL">BATAL</SelectItem>
                            </SelectContent>
                          </Select>
                          {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="tarikhSelesai" className="text-xs md:text-sm">
                            Tarikh Selesai (DD/MM/YYYY)
                          </Label>
                          <Input
                            id="tarikhSelesai"
                            name="tarikhSelesai"
                            type="date"
                            value={formData.tarikhSelesai}
                            onChange={handleInputChange}
                            disabled={formData.status !== "SELESAI" && formData.kategori !== "KELUAR"}
                            className="h-8 md:h-10 text-xs md:text-sm"
                          />
                          <div className="text-xs text-muted-foreground">
                            Format: {formatDateToDisplay(formData.tarikhSelesai) || "DD/MM/YYYY"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label htmlFor="nota" className="text-xs md:text-sm">
                          Nota
                        </Label>
                        <Textarea
                          id="nota"
                          name="nota"
                          value={formData.nota}
                          onChange={handleInputChange}
                          rows={3}
                          className="text-xs md:text-sm"
                        />
                      </div>
                      {canComment && (
                        <div className="space-y-1 md:space-y-2">
                          <Label htmlFor="komen" className="text-xs md:text-sm flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            Komen Pengurus
                          </Label>
                          <Textarea
                            id="komen"
                            name="komen"
                            value={formData.komen}
                            onChange={handleInputChange}
                            rows={2}
                            className="text-xs md:text-sm"
                            placeholder="Tambah komen sebagai pengurus..."
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter className="sticky bottom-0 pt-2 pb-2 bg-background flex flex-col sm:flex-row gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="w-full sm:w-auto sm:mr-2 text-xs md:text-sm h-8 md:h-10"
                        disabled={isSaving}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleAddSurat}
                        className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-10"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          "Simpan"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop view */}
            <div className="hidden md:block max-h-[calc(100vh-200px)] overflow-y-auto">
              <Table>
                <TableHeader className="table-header sticky top-0 z-20 bg-card shadow-sm">
                  <TableRow>
                    {columnVisibility.bil && (
                      <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort("bil")}>
                        <div className="flex items-center">
                          Bil
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.kategori && (
                      <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort("kategori")}>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            Kategori
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                          {columnVisibility.tarikh && <div className="text-xs text-muted-foreground mt-1">Tarikh</div>}
                          <div className="text-xs text-muted-foreground mt-1">Daripada/Kepada</div>
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.perkara && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort("perkara")}>
                        <div className="flex items-center">
                          Perkara
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.reference && (
                      <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("reference")}>
                        <div className="flex items-center">
                          Reference
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSurat.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {loading ? (
                          <div className="flex justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        ) : error ? (
                          <div className="text-destructive">Error loading data. Please try again.</div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">Tiada data surat dijumpai</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={fetchWithCache}>
                              Muat Semula Data
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedSurat.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "table-row text-sm transition-all duration-200 hover:bg-muted/30",
                          item.status === "SELESAI" && "bg-green-50/50",
                          item.status === "DALAM TINDAKAN" && "bg-blue-50/50",
                          item.status === "HOLD / KIV" && "bg-orange-50/50",
                          item.status === "BATAL" && "bg-red-50/50",
                        )}
                      >
                        {columnVisibility.bil && (
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              {item.status === "SELESAI" ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600 cursor-pointer"
                                  onClick={() => {
                                    setDetailSurat(item)
                                    setIsDetailModalOpen(true)
                                  }}
                                >
                                  #{item.bil}
                                </Badge>
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-blue-600 hover:underline font-medium"
                                  onClick={() => {
                                    setDetailSurat(item)
                                    setIsDetailModalOpen(true)
                                  }}
                                >
                                  #{item.bil}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {columnVisibility.kategori && (
                          <TableCell className="py-2">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span
                                  className={cn(
                                    "font-medium",
                                    item.kategori === "MASUK"
                                      ? "text-red-600"
                                      : item.kategori === "KELUAR"
                                        ? "text-blue-600"
                                        : "",
                                  )}
                                >
                                  {item.kategori}
                                </span>
                                {item.kategori === "MASUK" && <ArrowDown className="ml-1 h-4 w-4 text-red-600" />}
                                {item.kategori === "KELUAR" && <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />}
                              </div>
                              {columnVisibility.tarikh && (
                                <div
                                  className={cn(
                                    "text-sm mt-1",
                                    item.kategori === "MASUK"
                                      ? "text-red-600"
                                      : item.kategori === "KELUAR"
                                        ? "text-blue-600"
                                        : "",
                                  )}
                                >
                                  {item.tarikh}
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground mt-1">{item.daripadaKepada}</div>
                            </div>
                          </TableCell>
                        )}
                        {columnVisibility.perkara && (
                          <TableCell className="py-2">
                            <div className="space-y-1">
                              <div className="font-medium">{item.perkara}</div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer hover:bg-secondary text-xs transition-all duration-200 hover:scale-105"
                                  onClick={() => handleUnitFilter(item.unit)}
                                  style={{
                                    backgroundColor: getUnitColor(item.unit),
                                    borderColor: getUnitColor(item.unit),
                                  }}
                                >
                                  {item.unit}
                                </Badge>
                                {item.tindakanPic && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: getUnitColor(item.unit),
                                      borderColor: getUnitColor(item.unit),
                                    }}
                                  >
                                    PIC: {item.tindakanPic}
                                  </Badge>
                                )}
                                <Badge
                                  className={`cursor-pointer text-xs ${getStatusColor(item.status)}`}
                                  onClick={() => handleStatusFilter(item.status)}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              {item.nota && (
                                <div
                                  className="text-red-500 text-xs mt-1"
                                  dangerouslySetInnerHTML={{ __html: formatBilReferences(item.nota) }}
                                  onClick={(e) => {
                                    // Check if the clicked element has a data-bil attribute
                                    const target = e.target as HTMLElement
                                    if (target.hasAttribute("data-bil")) {
                                      const bilNumber = target.getAttribute("data-bil")
                                      if (bilNumber) {
                                        handleBilReferenceClick(bilNumber)
                                      }
                                    }
                                  }}
                                />
                              )}
                              {item.komen && (
                                <div className="text-blue-600 text-xs mt-1 flex items-start gap-1">
                                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="font-medium">Komen:</span> {item.komen}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {columnVisibility.reference && (
                          <TableCell className="py-2">
                            {item.reference ? (
                              <Badge
                                variant="outline"
                                className="cursor-pointer bg-black text-white hover:bg-black/80"
                                onClick={() => handleBilReferenceClick(item.reference)}
                              >
                                {item.reference}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleOpenAddDialog(item.bil)}
                              >
                                Respon
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(item)} disabled={!canEditFull}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {canComment && (
                                <DropdownMenuItem onClick={() => openCommentDialog(item)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Komen
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleShareToWhatsApp(item)}
                                disabled={generatingImage}
                                className="cursor-pointer"
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                {sharingItemId === item.id ? (
                                  <span className="flex items-center">
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Generating...
                                  </span>
                                ) : (
                                  "Share Ke WhatsApp"
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(item)}
                                disabled={!canDelete}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pb-4">
              {displayedSurat.length === 0 ? (
                <div className="text-center py-8">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : error ? (
                    <div className="text-destructive">Error loading data. Please try again.</div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground">Tiada data surat dijumpai</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={fetchWithCache}>
                        Muat Semula Data
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                displayedSurat.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-3 transition-all duration-200 hover:bg-muted/30 ${
                      item.status === "SELESAI"
                        ? "border-green-500 bg-green-50/50"
                        : item.status === "DALAM TINDAKAN"
                          ? "border-blue-500 bg-blue-50/50"
                          : item.status === "HOLD / KIV"
                            ? "border-orange-500 bg-orange-50/50"
                            : item.status === "BATAL"
                              ? "border-red-500 bg-red-50/50"
                              : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <span
                          className="font-bold text-sm mr-2 cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => {
                            setDetailSurat(item)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          #{item.bil}
                        </span>
                        {item.status === "SELESAI" && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {item.status === "BATAL" && <XCircle className="h-3 w-3 text-red-500" />}
                      </div>
                      <div className="flex items-center">
                        <Badge className={`text-[10px] ${getStatusColor(item.status)}`}>{item.status}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)} disabled={!canEditFull}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canComment && (
                              <DropdownMenuItem onClick={() => openCommentDialog(item)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Komen
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(item)}
                              disabled={!canDelete}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-muted-foreground mr-2">Kategori:</span>
                        <div className="flex items-center">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              item.kategori === "MASUK"
                                ? "text-red-600"
                                : item.kategori === "KELUAR"
                                  ? "text-blue-600"
                                  : "",
                            )}
                          >
                            {item.kategori}
                          </span>
                          {item.kategori === "MASUK" && <ArrowDown className="ml-1 h-3 w-3 text-red-600" />}
                          {item.kategori === "KELUAR" && <ArrowUp className="ml-1 h-3 w-3 text-blue-600" />}
                        </div>
                      </div>
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-muted-foreground mr-2">Tarikh:</span>
                        <span className="text-xs">{item.tarikh}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {item.kategori === "MASUK" ? "DARIPADA: " : "KEPADA: "}
                        {item.daripadaKepada}
                      </p>
                    </div>

                    <div className="mb-2">
                      <h3 className="font-medium text-xs">{item.perkara}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{ backgroundColor: getUnitColor(item.unit), borderColor: getUnitColor(item.unit) }}
                      >
                        {item.unit}
                      </Badge>
                      {item.tindakanPic && (
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ backgroundColor: getUnitColor(item.unit), borderColor: getUnitColor(item.unit) }}
                        >
                          PIC: {item.tindakanPic}
                        </Badge>
                      )}
                      {item.reference ? (
                        <Badge
                          variant="outline"
                          className="cursor-pointer text-[10px] bg-black text-white hover:bg-black/80"
                          onClick={() => handleBilReferenceClick(item.reference)}
                        >
                          {item.reference}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer text-[10px] hover:bg-secondary/80"
                          onClick={() => handleOpenAddDialog(item.bil)}
                        >
                          Respon
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 ml-auto rounded-full bg-green-500 hover:bg-green-600 border-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareToWhatsApp(item)
                        }}
                        disabled={generatingImage}
                      >
                        {sharingItemId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        ) : (
                          <Share2 className="h-3 w-3 text-white" />
                        )}
                        <span className="sr-only">Share Ke WhatsApp</span>
                      </Button>
                    </div>

                    {item.nota && (
                      <div
                        className="mt-2 text-[10px] text-red-500"
                        onClick={(e) => {
                          // Check if the clicked element has a data-bil attribute
                          const target = e.target as HTMLElement
                          if (target.hasAttribute("data-bil")) {
                            const bilNumber = target.getAttribute("data-bil")
                            if (bilNumber) {
                              handleBilReferenceClick(bilNumber)
                            }
                          }
                        }}
                      >
                        <span className="font-medium">Nota:</span>{" "}
                        <span dangerouslySetInnerHTML={{ __html: formatBilReferences(item.nota) }} />
                      </div>
                    )}

                    {item.komen && (
                      <div className="mt-2 text-[10px] text-blue-600 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Komen:</span> {item.komen}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Pagination - Non-sticky for mobile */}
          {filteredSurat.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4 md:mb-0">
              <div className="text-xs text-muted-foreground">
                List {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSurat.length)} from {filteredSurat.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 p-0 md:h-8 md:w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Previous Page</span>
                </Button>
                <div className="text-xs">
                  {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 p-0 md:h-8 md:w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next Page</span>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Footer */}
          <div className="md:hidden text-center text-xs text-muted-foreground py-4 border-t mt-4">Made By Akmal</div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-3 md:p-6">
          <DialogHeader className="p-0 md:p-2">
            <DialogTitle className="text-base md:text-lg">Edit Surat</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Kemaskini maklumat surat.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3 md:gap-4 md:py-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="daripadaKepada-edit" className="text-xs md:text-sm">
                  Daripada/Kepada
                </Label>
                <div className="relative">
                  <Input
                    id="daripadaKepada-edit"
                    name="daripadaKepada"
                    value={formData.daripadaKepada}
                    onChange={handleInputChange}
                    className="w-full h-8 md:h-10 text-xs md:text-sm"
                    list="daripadaKepada-edit-suggestions"
                  />
                  <datalist id="daripadaKepada-edit-suggestions">
                    {daripadaKepadaSuggestions
                      .filter((p) => p.toLowerCase().includes(formData.daripadaKepada.toLowerCase()))
                      .slice(0, 5)
                      .map((daripadaKepada) => (
                        <option key={daripadaKepada} value={daripadaKepada} />
                      ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="tarikh-edit" className="text-xs md:text-sm">
                  Tarikh (DD/MM/YYYY)
                </Label>
                <Input
                  id="tarikh-edit"
                  name="tarikh"
                  type="date"
                  value={formData.tarikh}
                  onChange={handleInputChange}
                  className="h-8 md:h-10 text-xs md:text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  Format: {formatDateToDisplay(formData.tarikh) || "DD/MM/YYYY"}
                </div>
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="perkara-edit" className="text-xs md:text-sm">
                Perkara
              </Label>
              <div className="relative">
                <Input
                  id="perkara-edit"
                  name="perkara"
                  value={formData.perkara}
                  onChange={handleInputChange}
                  className="w-full h-8 md:h-10 text-xs md:text-sm"
                  list="perkara-edit-suggestions"
                />
                <datalist id="perkara-edit-suggestions">
                  {perkaraSuggestions
                    .filter((p) => p.toLowerCase().includes(formData.perkara.toLowerCase()))
                    .slice(0, 5)
                    .map((perkara) => (
                      <option key={perkara} value={perkara} />
                    ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="kategori-edit" className="text-xs md:text-sm">
                  Kategori
                </Label>
                <Select value={formData.kategori} onValueChange={(value) => handleSelectChange("kategori", value)}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASUK">MASUK</SelectItem>
                    <SelectItem value="KELUAR">KELUAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="unit-edit" className="text-xs md:text-sm">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleSelectChange("unit", value)}
                  disabled={user?.role !== "semua" && user?.role !== "PENGURUS"}
                >
                  <SelectTrigger
                    className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.unit ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.length > 0 ? (
                      units.map((unit) => (
                        <SelectItem key={unit} value={unit || "unknown"}>
                          {unit || "Unknown"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading">Loading units...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="fail-edit" className="text-xs md:text-sm">
                  Fail
                </Label>
                <Select
                  value={selectedFailId}
                  onValueChange={(value) => handleSelectChange("fail", value)}
                >
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                    <SelectValue placeholder="Pilih fail" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredFailData.length > 0 ? (
                      filteredFailData.map((fail) => (
                        <SelectItem
                          key={fail.id}
                          value={fail.id}
                          style={{
                            backgroundColor: getFailPartColor(fail.part),
                          }}
                        >
                          {formatFailDisplay(fail)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading">Loading fails...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="tindakanPic-edit" className="text-xs md:text-sm">
                  Tindakan PIC <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tindakanPic}
                  onValueChange={(value) => handleSelectChange("tindakanPic", value)}
                  disabled={!formData.unit}
                >
                  <SelectTrigger
                    className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.tindakanPic ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Pilih PIC" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.unit && unitPicMap[formData.unit] && unitPicMap[formData.unit].length > 0 ? (
                      unitPicMap[formData.unit].map((pic) => (
                        <SelectItem key={pic} value={pic || "unknown"}>
                          {pic || "Unknown"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-pic">Tiada PIC</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.tindakanPic && <p className="text-red-500 text-xs mt-1">{formErrors.tindakanPic}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="status-edit" className="text-xs md:text-sm">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                  disabled={formData.kategori === "KELUAR"}
                >
                  <SelectTrigger
                    className={`h-8 md:h-10 text-xs md:text-sm ${formErrors.status ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BELUM PROSES">BELUM PROSES</SelectItem>
                    <SelectItem value="HOLD / KIV">HOLD / KIV</SelectItem>
                    <SelectItem value="DALAM TINDAKAN">DALAM TINDAKAN</SelectItem>
                    <SelectItem value="SELESAI">SELESAI</SelectItem>
                    <SelectItem value="BATAL">BATAL</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="tarikhSelesai-edit" className="text-xs md:text-sm">
                  Tarikh Selesai (DD/MM/YYYY)
                </Label>
                <Input
                  id="tarikhSelesai-edit"
                  name="tarikhSelesai"
                  type="date"
                  value={formData.tarikhSelesai}
                  onChange={handleInputChange}
                  disabled={formData.status !== "SELESAI" && formData.kategori !== "KELUAR"}
                  className="h-8 md:h-10 text-xs md:text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  Format: {formatDateToDisplay(formData.tarikhSelesai) || "DD/MM/YYYY"}
                </div>
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="nota-edit" className="text-xs md:text-sm">
                Nota
              </Label>
              <Textarea
                id="nota-edit"
                name="nota"
                value={formData.nota}
                onChange={handleInputChange}
                rows={3}
                className="text-xs md:text-sm"
              />
            </div>
            {canComment && (
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="komen-edit" className="text-xs md:text-sm flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  Komen Pengurus
                </Label>
                <Textarea
                  id="komen-edit"
                  name="komen"
                  value={formData.komen}
                  onChange={handleInputChange}
                  rows={2}
                  className="text-xs md:text-sm"
                  placeholder="Tambah komen sebagai pengurus..."
                />
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 pt-2 pb-2 bg-background flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto sm:mr-2 text-xs md:text-sm h-8 md:h-10"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditSurat}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-10"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[400px] p-3 md:p-6">
          <DialogHeader className="p-0 md:p-2">
            <DialogTitle className="text-base md:text-lg">Padam Surat</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Adakah anda pasti untuk memadam surat ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto sm:mr-2 text-xs md:text-sm h-8 md:h-10"
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSurat}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-10"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Memadam...
                </>
              ) : (
                "Padam"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
<Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-3 md:p-6">
    <DialogHeader className="p-0 md:p-2">
      <DialogTitle className="text-base md:text-lg">Maklumat Surat #{detailSurat?.bil}</DialogTitle>
      <DialogDescription className="text-xs md:text-sm">Maklumat terperinci untuk surat ini.</DialogDescription>
    </DialogHeader>

    {detailSurat && (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Status</h3>
            <Badge className={getStatusColor(detailSurat.status)}>{detailSurat.status}</Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Kategori</h3>
            <div className="flex items-center">
              <span className={detailSurat.kategori === "MASUK" ? "text-red-600" : "text-blue-600"}>
                {detailSurat.kategori}
              </span>
              {detailSurat.kategori === "MASUK" && <ArrowDown className="ml-1 h-4 w-4 text-red-600" />}
              {detailSurat.kategori === "KELUAR" && <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Daripada/Kepada</h3>
            <p className="text-sm">{detailSurat.daripadaKepada}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Tarikh</h3>
            <p className="text-sm">{detailSurat.tarikh}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Perkara</h3>
          <p className="text-sm">{detailSurat.perkara}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Unit</h3>
            <Badge
              variant="outline"
              style={{
                backgroundColor: getUnitColor(detailSurat.unit),
                borderColor: getUnitColor(detailSurat.unit),
              }}
            >
              {detailSurat.unit}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Tindakan PIC</h3>
            <p className="text-sm">{detailSurat.tindakanPic || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Reference</h3>
            {detailSurat.reference ? (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleBilReferenceClick(detailSurat.reference)}
              >
                Respon : {detailSurat.reference}
              </Badge>
            ) : (
              <p className="text-sm">-</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Tarikh Selesai</h3>
            <p className="text-sm">{detailSurat.tarikhSelesai || "-"}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Fail</h3>
          {detailSurat.fail && detailSurat.fail !== "-" ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: getFailPartColor(getFailPartFromStoredValue(detailSurat.fail, failData)),
                  borderColor: getFailPartColor(getFailPartFromStoredValue(detailSurat.fail, failData)),
                }}
              >
                {getFullFailDisplay(detailSurat.fail, failData)}
              </Badge>
            </div>
          ) : (
            <p className="text-sm">-</p>
          )}
        </div>

        {detailSurat.nota && (
          <div>
            <h3 className="text-sm font-medium mb-1">Nota</h3>
            <div
              className="text-sm text-red-500"
              dangerouslySetInnerHTML={{ __html: formatBilReferences(detailSurat.nota) }}
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.hasAttribute("data-bil")) {
                  const bilNumber = target.getAttribute("data-bil")
                  if (bilNumber) {
                    handleBilReferenceClick(bilNumber)
                  }
                }
              }}
            />
          </div>
        )}

        {detailSurat.komen && (
          <div>
            <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Komen Pengurus
            </h3>
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">{detailSurat.komen}</div>
          </div>
        )}
      </div>
    )}

    <DialogFooter className="flex flex-row justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => setIsDetailModalOpen(false)}
        className="p-2 w-[30%] sm:w-auto bg-red-600 text-white hover:bg-red-700 hover:text-white border-red-600"
        title="Tutup"
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Tutup</span>
      </Button>
      {detailSurat && (
        <Button
          variant="outline"
          onClick={() => {
            setIsDetailModalOpen(false)
            handleOpenAddDialog(detailSurat.bil)
          }}
          className="p-2 w-[30%] sm:w-auto"
          title="Respon"
          disabled={!!detailSurat.reference}
        >
          <Reply className="h-4 w-4" />
          <span className="hidden sm:inline">Respon</span>
        </Button>
      )}
      {canEditFull && detailSurat && (
        <Button
          onClick={() => {
            setIsDetailModalOpen(false)
            openEditDialog(detailSurat)
          }}
          className="p-2 w-[30%] sm:w-auto"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      )}
      {detailSurat && (
        <Button
          variant="outline"
          onClick={() => handleShareToWhatsApp(detailSurat)}
          disabled={generatingImage}
          className="p-2 w-[30%] sm:w-auto"
          title="Share"
        >
          {sharingItemId === detailSurat.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{sharingItemId === detailSurat.id ? "Generating..." : "Share"}</span>
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-3 md:p-6">
          <DialogHeader className="p-0 md:p-2">
            <DialogTitle className="text-base md:text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Komen Pengurus
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Tambah atau kemaskini komen untuk surat #{currentSurat?.bil}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment-text" className="text-sm font-medium">
                Komen
              </Label>
              <Textarea
                id="comment-text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="text-sm"
                placeholder="Masukkan komen anda di sini..."
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCommentDialogOpen(false)
                setCommentText("")
                setCurrentSurat(null)
              }}
              className="w-full sm:w-auto sm:mr-2 text-xs md:text-sm h-8 md:h-10"
              disabled={isAddingComment}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddComment}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-10"
              disabled={isAddingComment || !commentText.trim()}
            >
              {isAddingComment ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Komen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {shareItem && (
        <ShareImageGenerator surat={shareItem} onImageGenerated={handleImageGenerated} onError={handleShareError} />
      )}
      {shareError && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{shareError}</AlertDescription>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => setShareError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  )
}
