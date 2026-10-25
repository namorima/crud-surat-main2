"use client"

import { PageLoader } from "@/components/dashboard/page-loader"
import type React from "react"
import type { FXNotification } from "@/types/fx-notification"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { hasPermission } from "@/lib/rbac"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Edit,
  AlertCircle,
  Settings,
  Search,
  X,
  Calendar,
  SlidersHorizontal,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Share2,
  Bell,
  MessageSquare,
  Reply,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavTrigger } from "@/components/dashboard/app-shell"
import { SuratList } from "@/components/surat/SuratList"
import { SuratDetailDialog } from "@/components/surat/SuratDetailDialog"
import { SuratFormDialog } from "@/components/surat/SuratFormDialog"
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
  const [failComboboxOpen, setFailComboboxOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailSurat, setDetailSurat] = useState<Surat | null>(null)


  // Filtered units based on user role (Hybrid Approach)
  const filteredUnits = useMemo(() => {
    if (!user) return []
    
    // Admin and PENGURUS can see all units
    if (user.role === "semua" || user.role === "PENGURUS") {
      return units
    }
    
    // Other users can only see their own unit (case-insensitive matching)
    const matchingUnit = units.find(unit => unit.toLowerCase() === user.role.toLowerCase())
    if (matchingUnit) {
      return [matchingUnit]
    }
    
    return []
  }, [units, user])

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
  const canEdit = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'surat', action: 'edit' })
    : (user?.role === "semua" || user?.role === surat.find((s) => s.unit === user.role)?.unit)
  
  const canDelete = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'surat', action: 'delete' })
    : (user?.role === "semua")
  
  const canViewAll = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'surat', action: 'view' })
    : (user?.role === "semua" || user?.role === "PENGURUS")
  
  const canComment = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'surat', action: 'edit' })
    : (user?.role === "PENGURUS")
  
  const canEditFull = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'surat', action: 'edit' })
    : (user?.role === "semua" || user?.role === surat.find((s) => s.unit === user.role)?.unit)
  
  const canCreate = (user?.permissions && user.permissions.length > 0)
    ? hasPermission(user.permissions, { resource: 'surat', action: 'create' })
    : true // Legacy: all users without RBAC permissions can create

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
          rowIndex: currentSurat.bil,
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

  // Filter FAIL data based on user's unit for PERLADANGAN and selected unit in form
  useEffect(() => {
    if (!user || failData.length === 0) {
      setFilteredFailData([])
      return
    }

    // Filter fail data based on unit restriction
    let filtered = failData.filter((fail) => {
      // If user role is "semua", show all fails
      if (user.role === "semua") {
        return true
      }
      // If fail.unit is PERLADANGAN, only show to users with PERLADANGAN role
      if (fail.unit === "PERLADANGAN") {
        return user.role === "PERLADANGAN"
      }
      // Otherwise, show to all users
      return true
    })

    // Further filter by selected unit in form (if unit is selected)
    if (formData.unit) {
      filtered = filtered.filter((fail) => fail.unit === formData.unit)
    }

    setFilteredFailData(filtered)
  }, [failData, user, formData.unit])

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
        // The date input needs YYYY-MM-DD
        tarikhSelesai: prev.tarikhSelesai || formatDateToInput(getCurrentDateFormatted()),
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
      filtered = filtered.filter((item) => 
        item.unit.toLowerCase().trim() === user.role.toLowerCase().trim()
      )
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
      // DD/MM/YYYY would sort by day as text; compare as YYYYMMDD instead
      const dateKey = (value: unknown) => {
        const m = String(value || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0
      }
      filtered.sort((a, b) => {
        if (sortField === "tarikh" || sortField === "tarikhSelesai") {
          const diff = dateKey(a[sortField]) - dateKey(b[sortField])
          return sortDirection === "asc" ? diff : -diff
        }
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
      // Don't set BIL manually - let backend auto-generate using database sequence
      // Format dates for API
      const formattedData = {
        ...formData,
        // Remove bil from formData - backend will auto-generate it
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

      // Get the generated BIL from response
      const result = await response.json()
      const generatedBil = result.bil

      // If this is a response to another letter, update the original letter's reference field and status
      if (referenceBil) {
        const originalSurat = surat.find((item) => item.bil === referenceBil)
        if (originalSurat) {
          const updatedOriginalSurat = {
            ...originalSurat,
            reference: generatedBil.toString(), // Use generated BIL from backend
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
              rowIndex: originalSurat.bil,
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
          rowIndex: currentSurat.bil,
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
      const response = await fetch(`/api/surat?rowIndex=${currentSurat.bil}`, {
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

    // Auto-set unit based on user role for non-admin users (case-insensitive matching)
    let defaultUnit = ""
    if (user?.role && user.role !== "semua" && user.role !== "PENGURUS") {
      // Find matching unit with case-insensitive comparison
      const matchingUnit = units.find(unit => unit.toLowerCase() === user.role.toLowerCase())
      if (matchingUnit) {
        defaultUnit = matchingUnit
      }
    }

    // A Respon goes the other way from the surat it answers: a reply to a MASUK
    // letter starts as KELUAR (still editable), a reply to a KELUAR one as MASUK
    const original = referenceValue ? surat.find((item) => String(item.bil) === referenceValue) : undefined
    const isRespon = Boolean(referenceValue) && original?.kategori !== "KELUAR"
    const today = formatDateToInput(getCurrentDateFormatted())

    setFormData({
      bil: 0, // BIL will be auto-generated by backend, this is just placeholder
      daripadaKepada: "",
      tarikh: today,
      perkara: "",
      kategori: isRespon ? "KELUAR" : "MASUK",
      unit: defaultUnit,
      fail: "",
      tindakanPic: "",
      status: isRespon ? "SELESAI" : "BELUM PROSES",
      tarikhSelesai: isRespon ? today : "",
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
    } else if (name === "unit") {
      // When unit changes, reset fail selection
      setFormData((prev) => ({ ...prev, [name]: value, fail: "" }))
      setSelectedFailId("")
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
      <PageLoader />
    )
  }

  return (
    <div className="space-y-6">
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
              <NavTrigger />
              <CardTitle className="text-base md:text-xl">Surat</CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {/* Clear Filter Button - Only shows when filters are applied */}
              {(statusFilter !== "all" || unitFilter !== "all" || kategoriFilter !== "all" || dateFilter) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearAllFilters}
                  className="transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-500 h-8 w-8"
                  title="Clear all filters"
                >
                  <X className="h-4 w-4" />
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
                    <X className="h-4 w-4" />
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
                  className="transition-all duration-200 hover:scale-105 h-8 w-8"
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              )}

              {/* Date Filter - Icon Only */}
              {!showSearchInput && (
                <Popover>
                  <PopoverTrigger asChild>
                    {/* Phones pick the date from the Tarikh tab in the filter popover instead. */}
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(dateFilter && "text-primary", "hidden h-8 w-8 md:inline-flex")}
                    >
                      <Calendar className="h-4 w-4" />
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
                        "h-8 w-8",
                      )}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="sr-only">Filters</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Tabs defaultValue="status" className="w-full">
                      <TabsList className="m-2 mb-0 grid w-[calc(100%-1rem)] grid-cols-4 md:grid-cols-3">
                        <TabsTrigger value="status">Status</TabsTrigger>
                        <TabsTrigger value="unit">Unit</TabsTrigger>
                        <TabsTrigger value="kategori">Kategori</TabsTrigger>
                        <TabsTrigger value="tarikh" className="md:hidden">
                          Tarikh
                        </TabsTrigger>
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
                      <TabsContent value="tarikh" className="flex justify-center p-2 md:hidden">
                        <CalendarComponent mode="single" selected={dateFilter} onSelect={handleDateFilter} />
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
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Paparan &amp; Isih</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <div className="p-2 text-body-medium text-text-secondary">Lajur</div>
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
                      <div className="mb-2 text-body-medium text-text-secondary">Isih</div>
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
                        "relative h-8 w-8",
                        notificationCount > 0 && "text-red-500 border-red-200",
                      )}
                      onClick={fetchFXNotifications}
                    >
                      <Bell className="h-4 w-4" />
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
                                          className="text-xs block w-fit text-neutral-900"
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
                                        className="text-xs w-fit text-neutral-900"
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
              {!showSearchInput && canCreate && (
                <Button
                  size="icon"
                  onClick={() => {
                    resetForm()
                    handleOpenAddDialog()
                  }}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Tambah Surat</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-6 sm:pb-6">
          <SuratList
            items={displayedSurat}
            totalCount={filteredSurat.length}
            loading={loading}
            error={error}
            onReload={fetchWithCache}
            columnVisibility={columnVisibility}
            onSort={(field) => handleSort(field as any)}
            onOpenDetail={(item) => {
              setDetailSurat(item)
              setIsDetailModalOpen(true)
            }}
            onUnitFilter={handleUnitFilter}
            onStatusFilter={handleStatusFilter}
            onReferenceClick={handleBilReferenceClick}
            onRespond={handleOpenAddDialog}
            onEdit={openEditDialog}
            onComment={openCommentDialog}
            onShare={handleShareToWhatsApp}
            onDelete={openDeleteDialog}
            canEditFull={Boolean(canEditFull)}
            canComment={Boolean(canComment)}
            canDelete={Boolean(canDelete)}
            generatingImage={generatingImage}
            sharingItemId={sharingItemId}
            page={currentPage}
            pageSize={ITEMS_PER_PAGE}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />

          {/* Mobile Footer */}
          <div className="md:hidden pt-4 text-center text-caption-1-regular text-text-tertiary">Made By Akmal</div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <SuratFormDialog
        mode="add"
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            // Reset reference when closing dialog
            setReferenceBil(null)
            resetForm()
          }
        }}
        referenceBil={referenceBil}
        referencePerkara={referenceBil ? surat.find((item) => item.bil === referenceBil)?.perkara : undefined}
        unitOptions={filteredUnits}
        formData={formData}
        formErrors={formErrors}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        daripadaKepadaSuggestions={daripadaKepadaSuggestions}
        perkaraSuggestions={perkaraSuggestions}
        unitPicMap={unitPicMap}
        failOptions={filteredFailData}
        selectedFailId={selectedFailId}
        failComboboxOpen={failComboboxOpen}
        setFailComboboxOpen={setFailComboboxOpen}
        formatFailDisplay={formatFailDisplay}
        formatDateToDisplay={formatDateToDisplay}
        canComment={!!canComment}
        saving={isSaving}
        onSave={handleAddSurat}
        onCancel={() => setIsAddDialogOpen(false)}
      />

      {/* Edit Dialog */}
      <SuratFormDialog
        mode="edit"
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        unitOptions={units}
        unitLocked={user?.role !== "semua" && user?.role !== "PENGURUS"}
        formData={formData}
        formErrors={formErrors}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        daripadaKepadaSuggestions={daripadaKepadaSuggestions}
        perkaraSuggestions={perkaraSuggestions}
        unitPicMap={unitPicMap}
        failOptions={filteredFailData}
        selectedFailId={selectedFailId}
        failComboboxOpen={failComboboxOpen}
        setFailComboboxOpen={setFailComboboxOpen}
        formatFailDisplay={formatFailDisplay}
        formatDateToDisplay={formatDateToDisplay}
        canComment={!!canComment}
        saving={isSaving}
        onSave={handleEditSurat}
        onCancel={() => setIsEditDialogOpen(false)}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-3 md:p-6">
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
      <SuratDetailDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        surat={detailSurat}
        failLabel={detailSurat ? getFullFailDisplay(detailSurat.fail, failData) : "-"}
        failPart={detailSurat ? getFailPartFromStoredValue(detailSurat.fail, failData) : ""}
        canEdit={!!canEditFull}
        sharing={!!detailSurat && sharingItemId === detailSurat.id}
        generatingImage={generatingImage}
        onRespond={(item) => {
          setIsDetailModalOpen(false)
          handleOpenAddDialog(item.bil)
        }}
        onEdit={(item) => {
          setIsDetailModalOpen(false)
          openEditDialog(item)
        }}
        onShare={handleShareToWhatsApp}
        onBilClick={handleBilReferenceClick}
      />

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
