"use client"

import type React from "react"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import type { Bayaran } from "@/types/bayaran"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  ArrowUpDown,
  Settings,
  Search,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowDown,
  ArrowDownUp,
  Menu,
  Plus,
  DollarSign,
  Share2,
  Edit,
  FilePen,
  FilePenLineIcon as Signature,
  Send,
  Trash2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { BayaranShareImageGenerator } from "@/components/bayaran-share-image-generator"
import { toast } from "sonner"

// Number of items per page
const ITEMS_PER_PAGE = 15

// Kategori colors
const KATEGORI_COLORS: Record<string, string> = {
  "PERTANIAN AM": "bg-[#d4edbc] text-[#2c5f13] border-[#a9d97c]",
  "ANGKUT BTS": "bg-[#ffc8aa] text-[#7d2c00] border-[#ff9966]",
  PIECERATE: "bg-[#bfe1f6] text-[#0a558c] border-[#7cc4e8]",
  KIMIA: "bg-[#ffe5a0] text-[#7a4f01] border-[#ffd24c]",
  KONTRAK: "bg-[#e6cff2] text-[#5b1e7b] border-[#c884e4]",
}

export default function BayaranPage() {
  const { user } = useAuth()
  const [bayaran, setBayaran] = useState<Bayaran[]>([])
  const [filteredBayaran, setFilteredBayaran] = useState<Bayaran[]>([])
  const [displayedBayaran, setDisplayedBayaran] = useState<Bayaran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [kategoriFilter, setKategoriFilter] = useState<string>("all")
  const [kontrakFilter, setKontrakFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBayaran, setEditingBayaran] = useState<Bayaran | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sorting state - Default sort by ID descending (largest first)
  const [sortField, setSortField] = useState<keyof Bayaran | null>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    daripadaTarikh: true, // Combined column
    perkara: true, // Will include kategori, status, baucer
    nilaiBayaran: true,
    bayaranKe: true,
    noKontrak: true, // New column
    tarikhBayar: true,
  })

  // Form data states
  const [formData, setFormData] = useState({
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

  const [formOptions, setFormOptions] = useState({
    daripadaSuggestions: [] as string[],
    statusLadangData: [] as string[], // Changed to string array
    contractData: {} as Record<string, string[]>,
    categoryData: {} as Record<string, Record<string, string[]>>,
    allContracts: [] as string[],
    allCategories: [] as string[],
    penerimaData: [] as Array<{ name: string; unit: string; display: string; defaultStatus: string }>,
    statusBayaranData: [] as Array<{ status: string; colorHex: string }>,
  })

  const [showDaripadaDropdown, setShowDaripadaDropdown] = useState(false)
  const [filteredDaripadaSuggestions, setFilteredDaripadaSuggestions] = useState<string[]>([])
  const [formDataLoading, setFormDataLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Share functionality states
  const [sharingBayaran, setSharingBayaran] = useState<Bayaran | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isSharing, setIsSharing] = useState(false) // loading animation

  // Get unique values for filtering
  const uniqueKategori = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.kategori))).filter(Boolean),
    [bayaran],
  )
  const uniqueStatus = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.statusBayaran))).filter(Boolean),
    [bayaran],
  )
  const uniqueKontrak = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.noKontrak))).filter(Boolean),
    [bayaran],
  )

  // Cache mechanism
  const fetchWithCache = useCallback(async () => {
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
    const currentTime = Date.now()

    // If data was fetched recently, use cached data
    if (lastFetchTime && currentTime - lastFetchTime < CACHE_DURATION && bayaran.length > 0) {
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
      const response = await fetch("/api/bayaran")

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data)
        throw new Error("Invalid data format received from server")
      }

      setBayaran(data)

      // Update last fetch time
      setLastFetchTime(currentTime)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [lastFetchTime, bayaran.length])

  useEffect(() => {
    fetchWithCache()

    // Set up periodic refresh
    const intervalId = setInterval(
      () => {
        fetchWithCache()
      },
      10 * 60 * 1000,
    ) // Refresh every 10 minutes

    return () => clearInterval(intervalId)
  }, [fetchWithCache])

  useEffect(() => {
    filterBayaran()
  }, [bayaran, searchQuery, statusFilter, kategoriFilter, kontrakFilter, dateFilter, user, sortField, sortDirection])

  useEffect(() => {
    // Update displayed bayaran based on pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setDisplayedBayaran(filteredBayaran.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(filteredBayaran.length / ITEMS_PER_PAGE))
  }, [filteredBayaran, currentPage])

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

  // Fetch form data when add dialog opens
  useEffect(() => {
    if (showAddDialog || showEditDialog) {
      fetchFormData()
    }
  }, [showAddDialog, showEditDialog])

  const fetchFormData = async () => {
    try {
      setFormDataLoading(true)
      const response = await fetch("/api/bayaran-form-data")
      if (response.ok) {
        const data = await response.json()
        setFormOptions({
          daripadaSuggestions: data.daripadaSuggestions || [],
          statusLadangData: data.statusLadangData || [], // Now it's a string array
          contractData: data.contractData || {},
          categoryData: data.categoryData || {},
          allContracts: data.allContracts || [],
          allCategories: data.allCategories || [],
          penerimaData: data.penerimaData || [],
          statusBayaranData: data.statusBayaranData || [],
        })
        setFilteredDaripadaSuggestions(data.daripadaSuggestions || [])
        setFilteredPenerimaData(data.penerimaData || [])
      } else {
        console.error("Failed to fetch form data:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching form data:", error)
    } finally {
      setFormDataLoading(false)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Auto-filter for ID searches starting with #
    if (value.startsWith("#")) {
      const idNumber = value.substring(1)
      if (idNumber && !isNaN(Number(idNumber))) {
        // Filter bayaran by ID
        const filtered = bayaran.filter((item) => item.id === idNumber)
        setFilteredBayaran(filtered)
        setCurrentPage(1)
      }
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if it's an ID search with single result
    if (searchQuery.startsWith("#")) {
      const idNumber = searchQuery.substring(1)
      if (idNumber && !isNaN(Number(idNumber))) {
        const foundBayaran = bayaran.find((item) => item.id === idNumber)
        if (foundBayaran) {
          setSelectedBayaran(foundBayaran)
          setShowDetailDialog(true)
          return
        }
      }
    }

    filterBayaran()
  }

  const filterBayaran = () => {
    if (!Array.isArray(bayaran)) {
      setFilteredBayaran([])
      return
    }

    let filtered = [...bayaran]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()

      // Handle ID search with # prefix
      if (query.startsWith("#")) {
        const idNumber = query.substring(1)
        if (idNumber && !isNaN(Number(idNumber))) {
          filtered = filtered.filter((item) => item.id === idNumber)
        } else {
          filtered = []
        }
      } else {
        // Regular search
        filtered = filtered.filter(
          (item) =>
            (item.daripada || "").toLowerCase().includes(query) ||
            (item.perkara || "").toLowerCase().includes(query) ||
            (item.kategori || "").toLowerCase().includes(query) ||
            (item.bayaranKe || "").toLowerCase().includes(query) ||
            (item.penerima || "").toLowerCase().includes(query) ||
            (item.nomborBaucer || "").toLowerCase().includes(query) ||
            (item.id || "").toLowerCase().includes(query),
        )
      }
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.statusBayaran === statusFilter)
    }

    // Apply kategori filter
    if (kategoriFilter !== "all") {
      filtered = filtered.filter((item) => item.kategori === kategoriFilter)
    }

    // Apply kontrak filter
    if (kontrakFilter !== "all") {
      filtered = filtered.filter((item) => item.noKontrak === kontrakFilter)
    }

    // Apply date filter - default to 2025 if no specific date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, "dd/MM/yyyy")
      filtered = filtered.filter((item) => item.tarikhTerima === filterDate)
    } else {
      // Default filter for 2025 - show all 2025 records
      filtered = filtered.filter((item) => {
        if (!item.tarikhTerima) return false
        const dateParts = item.tarikhTerima.split("/")
        if (dateParts.length !== 3) return false
        const year = dateParts[2]
        return year === "2025"
      })
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] || ""
        const bValue = b[sortField] || ""

        // Special handling for ID field to sort numerically
        if (sortField === "id") {
          const aNum = Number.parseInt(String(aValue)) || 0
          const bNum = Number.parseInt(String(bValue)) || 0
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum
        }

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

    setFilteredBayaran(filtered)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  const handleSort = (field: keyof Bayaran) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    filterBayaran()
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleKategoriFilter = (kategori: string) => {
    setKategoriFilter(kategori)
  }

  const handleKontrakFilter = (kontrak: string) => {
    setKontrakFilter(kontrak)
  }

  const handleDateFilter = (date: Date | undefined) => {
    setDateFilter(date)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setKategoriFilter("all")
    setKontrakFilter("all")
    setDateFilter(undefined)
    setShowSearchInput(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDaripadaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      daripada: value,
      noKontrak: "", // Reset dependent fields
      kategori: "",
    }))

    // Filter suggestions
    const filtered = formOptions.daripadaSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredDaripadaSuggestions(filtered)
  }

  const handleKontrakChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      noKontrak: value,
      kategori: "", // Reset dependent field
    }))
  }

  const getAvailableKontraks = () => {
    if (formData.daripada.toUpperCase() === "LADANG NEGERI") {
      return formOptions.allContracts
    }
    return formOptions.contractData[formData.daripada] || []
  }

  const getAvailableKategoris = () => {
    if (formData.daripada.toUpperCase() === "LADANG NEGERI") {
      return formOptions.allCategories
    }
    if (!formData.daripada || !formData.noKontrak) return []
    return formOptions.categoryData[formData.daripada]?.[formData.noKontrak] || []
  }

  // Get status color from AUTH sheet data
  const getStatusColor = (status: string) => {
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status)
    if (statusData) {
      return `text-white border-0`
    }

    // Fallback colors if not found in AUTH sheet
    switch (status?.toLowerCase()) {
      case "selesai":
      case "dibayar":
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
      case "pending":
      case "menunggu":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
      case "dalam proses":
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
      case "batal":
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Get status background color for badges
  const getStatusBadgeStyle = (status: string) => {
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status)
    if (statusData) {
      return { backgroundColor: statusData.colorHex, color: "white", border: "none" }
    }
    return {}
  }

  // Get kategori color
  const getKategoriColor = (kategori: string) => {
    return KATEGORI_COLORS[kategori?.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  // Format currency
  const formatCurrency = (value: string) => {
    if (!value) return "-"
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.-]/g, "")
    if (isNaN(Number(numericValue))) return value
    return `RM ${Number(numericValue).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format currency for input with auto formatting - Updated to handle larger amounts
  const formatCurrencyInput = (value: string) => {
    if (!value) return ""
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.-]/g, "")
    if (isNaN(Number(numericValue))) return value

    // Handle larger numbers up to 999,999,999.99
    const number = Number(numericValue)
    if (number > 999999999.99) {
      return "999,999,999.99"
    }

    return number.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Handle currency input change - Updated to handle larger amounts
  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the current cursor position
    const cursorPos = e.target.selectionStart || 0

    // Get the current value without commas
    const currentValue = formData.nilaiBayaran

    // Get the new value from the input
    let newValue = e.target.value

    // Remove all non-numeric characters except decimal point
    newValue = newValue.replace(/[^\d.]/g, "")

    // Ensure only one decimal point
    const parts = newValue.split(".")
    if (parts.length > 2) {
      newValue = parts[0] + "." + parts.slice(1).join("")
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      newValue = parts[0] + "." + parts[1].substring(0, 2)
    }

    // Check if the number exceeds the maximum limit (999,999,999.99)
    const numericValue = Number(newValue)
    if (numericValue > 999999999.99) {
      newValue = "999999999.99"
    }

    // Store the raw numeric value in state
    setFormData((prev) => ({ ...prev, nilaiBayaran: newValue }))

    // Calculate new cursor position based on added/removed commas
    const oldCommaCount = (formatCurrencyInput(currentValue).match(/,/g) || []).length
    const newCommaCount = (formatCurrencyInput(newValue).match(/,/g) || []).length
    const commasDiff = newCommaCount - oldCommaCount

    // Set cursor position after the component updates
    setTimeout(() => {
      const input = e.target
      if (input) {
        const newPos = Math.max(0, cursorPos + commasDiff)
        input.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  // Format date to display as "5 Mei 2025"
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"

    const dateParts = dateString.split("/")
    if (dateParts.length !== 3) return dateString

    const day = Number.parseInt(dateParts[0], 10).toString() // Remove leading zero
    const month = Number.parseInt(dateParts[1], 10)
    const year = dateParts[2]

    const monthNames = [
      "Januari",
      "Februari",
      "Mac",
      "April",
      "Mei",
      "Jun",
      "Julai",
      "Ogos",
      "September",
      "Oktober",
      "November",
      "Disember",
    ]

    return `${day} ${monthNames[month - 1]} ${year}`
  }

  // Extract unit from penerima display
  const extractPenerimaWithUnit = (penerima: string) => {
    if (!penerima) return ""

    // 1. Cari data penerima yang sesuai dari formOptions.penerimaData
    const penerimaData = formOptions.penerimaData.find((item) => item.name === penerima || item.display === penerima)

    // 2. Jika ditemukan, kembalikan format "Nama (Unit)"
    if (penerimaData) {
      return `${penerimaData.name} (${penerimaData.unit})`
    }

    // 3. Jika input sudah mengandung format "Nama (Unit)", kembalikan apa adanya
    if (penerima.includes("(") && penerima.includes(")")) {
      return penerima
    }

    // 4. Default: kembalikan nama saja
    return penerima
  }

  const [selectedBayaran, setSelectedBayaran] = useState<Bayaran | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const [showPenerimaDropdown, setShowPenerimaDropdown] = useState(false)
  const [filteredPenerimaData, setFilteredPenerimaData] = useState<
    Array<{ name: string; unit: string; display: string }>
  >([])

  const handlePenerimaChange = (value: string) => {
    setFormData((prev) => {
      // Find the selected penerima to get their default status
      const selectedPenerima = formOptions.penerimaData.find((item) => item.display === value)
      // Always extract name before parentheses
      const nameOnly = value.split(" (")[0]
      return {
        ...prev,
        penerima: nameOnly,
        statusBayaran: selectedPenerima?.defaultStatus || prev.statusBayaran,
      }
    })

    // Filter penerima suggestions
    const filtered = formOptions.penerimaData.filter(
      (item) =>
        item.display.toLowerCase().includes(value.toLowerCase()) ||
        item.name.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredPenerimaData(filtered)
  }

  // Helper functions for conditional visibility
  const shouldShowAdvancedFields = () => {
    return formData.tarikhMemoLadang !== ""
  }

  // Helper functions for conditional visibility - Updated to show fields when Tarikh PN is filled
  const shouldShowHandoverFields = () => {
    return formData.tarikhMemoLadang !== "" && (formData.tarikhHantar !== "" || formData.tarikhPn !== "")
  }

  const shouldShowCompletionFields = () => {
    return formData.tarikhMemoLadang !== "" && formData.tarikhHantar !== "" && formData.statusBayaran === "SELESAI"
  }

  const getStatusBayaranColor = (status: string) => {
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status)
    return statusData?.colorHex || "#6b7280"
  }

  // Save functionality - Updated to handle both add and edit properly with forced refresh
  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!formData.daripada || !formData.tarikhTerima || !formData.perkara) {
        toast.error("Sila isi semua medan yang diperlukan")
        return
      }

      const payload = {
        ...formData,
      }

      let response
      if (editingBayaran) {
        // Update existing record
        response = await fetch(`/api/bayaran/${editingBayaran.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new record
        response = await fetch("/api/bayaran", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        toast.success(`Rekod bayaran berjaya ${editingBayaran ? "dikemaskini" : "disimpan"}!`)

        // Reset form after successful save
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

        setShowAddDialog(false)
        setShowEditDialog(false)
        setEditingBayaran(null)

        // Force refresh data by clearing cache and fetching new data
        setLastFetchTime(null)
        await fetchWithCache()

        // Also force re-filter to update the display
        setTimeout(() => {
          filterBayaran()
        }, 100)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || `Gagal ${editingBayaran ? "mengemaskini" : "menyimpan"} rekod bayaran`)
      }
    } catch (error) {
      console.error("Error saving bayaran:", error)
      toast.error("Ralat semasa menyimpan rekod bayaran")
    } finally {
      setSaving(false)
    }
  }

  // Add helper function for date conversion
  const convertDateForEdit = (dateString: string): string => {
    if (!dateString) return ""
    const parts = dateString.split("/")
    if (parts.length !== 3) return ""
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Edit functionality
  const handleEdit = (bayaran: Bayaran) => {
    setEditingBayaran(bayaran)
    setFormData({
      daripada: bayaran.daripada,
      tarikhTerima: convertDateForEdit(bayaran.tarikhTerima),
      perkara: bayaran.perkara,
      nilaiBayaran: bayaran.nilaiBayaran.replace(/[^\d.-]/g, ""), // Remove currency formatting
      bayaranKe: bayaran.bayaranKe,
      kategori: bayaran.kategori,
      noKontrak: bayaran.noKontrak,
      tarikhMemoLadang: convertDateForEdit(bayaran.tarikhMemoLadang),
      statusLadang: bayaran.statusLadang,
      tarikhHantar: convertDateForEdit(bayaran.tarikhHantar),
      tarikhPpnP: convertDateForEdit(bayaran.tarikhPpnP),
      tarikhPn: convertDateForEdit(bayaran.tarikhPn),
      penerima: bayaran.penerima,
      statusBayaran: bayaran.statusBayaran,
      tarikhBayar: convertDateForEdit(bayaran.tarikhBayar),
      nomborBaucer: bayaran.nomborBaucer,
      notaKaki: bayaran.notaKaki,
    })
    setShowEditDialog(true)
  }

  // Delete functionality
  const handleDelete = async () => {
    if (!selectedBayaran) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/bayaran/${selectedBayaran.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Rekod bayaran berjaya dipadam")
        setShowDetailDialog(false)
        // Force refresh data
        setLastFetchTime(null)
        await fetchWithCache()
        setTimeout(() => {
          filterBayaran()
        }, 100)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Gagal memadam rekod bayaran")
      }
    } catch (error) {
      console.error("Error deleting bayaran:", error)
      toast.error("Ralat semasa memadam rekod bayaran")
    } finally {
      setShowDeleteConfirm(false)
      setIsDeleting(false)
    }
  }

  // Share functionality
  const handleShare = (bayaran: Bayaran) => {
    setIsSharing(true) // loading animation
    setSharingBayaran(bayaran)
    setIsGeneratingImage(true)
  }

  const handleImageGenerated = (imageUrl: string, directLink: string) => {
    setIsGeneratingImage(false)
    setIsSharing(false) // loading animation
    setSharingBayaran(null)

    if (sharingBayaran) {
      const message = `📌*REKOD BAYARAN #${sharingBayaran.id}*
      _${sharingBayaran.statusBayaran.toUpperCase()}_ ${sharingBayaran.tarikhBayar ? "✅" : "🕑"}

${sharingBayaran.tarikhBayar ? `*✅ Tarikh Bayar : ${sharingBayaran.tarikhBayar}*\n> Baucer : _${sharingBayaran.nomborBaucer}_` : "> ☑️ Tarikh Bayar : (belum bayar)"}
> ↑————————-
${sharingBayaran.tarikhHantar ? `*✅ Tarikh Hantar : ${sharingBayaran.tarikhHantar}*` : "> ☑️ Tarikh Hantar : (belum hantar)"}
> ↑————————
${sharingBayaran.tarikhPn ? `*✅ Tarikh PN : ${sharingBayaran.tarikhPn}*` : "> ☑️ Tarikh PN : (belum proses)"}
> ↑————————
${sharingBayaran.tarikhPpnP ? `*✅ Tarikh PPN (P) : ${sharingBayaran.tarikhPpnP}*` : "> ☑️ Tarikh PPN (P) : (belum proses)"}
> ↑————————
${sharingBayaran.tarikhMemoLadang ? `*✅ Tarikh Memo : ${sharingBayaran.tarikhMemoLadang}*` : "> ☑️ Tarikh Memo : (belum dibuat)"}
> ↑————————
*✅ Tarikh Terima : ${sharingBayaran.tarikhTerima}*
> _Daripada : *${sharingBayaran.daripada.toUpperCase()}*_
> |——————————————
*${sharingBayaran.perkara.toUpperCase()}*
> KE : _${sharingBayaran.bayaranKe}_ *|* _${sharingBayaran.noKontrak}_
> _${formatCurrency(sharingBayaran.nilaiBayaran)}_
> *Nota Kaki:* _${sharingBayaran.notaKaki}_

Detail: ${directLink}
> (exp 24 hours)`

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
      window.location.href = whatsappUrl
    }
  }

  const handleImageError = (error: Error) => {
    setIsGeneratingImage(false)
    setIsSharing(false) //loading animation
    setSharingBayaran(null)
    toast.error("Gagal menjana imej untuk dikongsi")
    console.error("Image generation error:", error)
  }

  // Function to handle #S links in Nota Kaki
  const handleSuratLinkClick = async (bilNumber: string) => {
    try {
      setLoadingSurat(true)
      const response = await fetch(`/api/surat/${bilNumber}`)

      if (response.ok) {
        const suratData = await response.json()
        setSelectedSurat(suratData)
        setShowSuratModal(true)
      } else {
        toast.error(`Surat #${bilNumber} tidak dijumpai`)
      }
    } catch (error) {
      console.error("Error fetching surat:", error)
      toast.error("Ralat semasa mengambil data surat")
    } finally {
      setLoadingSurat(false)
    }
  }

  const renderNotaKakiWithLinks = (notaKaki: string) => {
    if (!notaKaki) return null

    // Regex to find #S followed by numbers
    const regex = /#S(\d+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(notaKaki)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(notaKaki.slice(lastIndex, match.index))
      }

      // Add the clickable link
      const bilNumber = match[1]
      parts.push(
        <button
          key={match.index}
          onClick={() => handleSuratLinkClick(bilNumber)}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
          disabled={loadingSurat}
        >
          #S{bilNumber}
        </button>,
      )

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < notaKaki.length) {
      parts.push(notaKaki.slice(lastIndex))
    }

    return parts.length > 0 ? parts : notaKaki
  }

  const [showSuratModal, setShowSuratModal] = useState(false)
  const [selectedSurat, setSelectedSurat] = useState<any>(null)
  const [loadingSurat, setLoadingSurat] = useState(false)

  if (loading && bayaran.length === 0) {
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
              {(statusFilter !== "all" || kategoriFilter !== "all" || kontrakFilter !== "all" || dateFilter) && (
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
                          <Select value={kategoriFilter} onValueChange={handleKategoriFilter}>
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
                          <Select value={kontrakFilter} onValueChange={handleKontrakFilter}>
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

              {/* Add Button */}
              {!showSearchInput && (user?.role === "semua" || user?.role === "PERLADANGAN") && (
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
                          onCheckedChange={(checked) => setColumnVisibility((prev) => ({ ...prev, id: !!checked }))}
                        />
                        <Label htmlFor="col-id">ID</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-daripadaTarikh"
                          checked={columnVisibility.daripadaTarikh}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, daripadaTarikh: !!checked }))
                          }
                        />
                        <Label htmlFor="col-daripadaTarikh">Daripada/Tarikh</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-noKontrak"
                          checked={columnVisibility.noKontrak}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, noKontrak: !!checked }))
                          }
                        />
                        <Label htmlFor="col-noKontrak">No Kontrak</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="col-tarikhBayar"
                          checked={columnVisibility.tarikhBayar}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, tarikhBayar: !!checked }))
                          }
                        />
                        <Label htmlFor="col-tarikhBayar">Tarikh Bayar</Label>
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
                          id="col-nilaiBayaran"
                          checked={columnVisibility.nilaiBayaran}
                          onCheckedChange={(checked) =>
                            setColumnVisibility((prev) => ({ ...prev, nilaiBayaran: !!checked }))
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
        <CardContent className="overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop view */}
            <div className="hidden md:block max-h-[calc(100vh-200px)] overflow-y-auto">
              <Table>
                <TableHeader className="table-header sticky top-0 z-20 bg-card shadow-sm">
                  <TableRow>
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
                      >
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

          {/* Pagination - Non-sticky for mobile */}
          {filteredBayaran.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4 md:mb-0">
              <div className="text-xs text-muted-foreground">
                List {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBayaran.length)} from {filteredBayaran.length}
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
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
                      <Label className="text-sm font-medium text-muted-foreground">No Kontrak</Label>
                      <p className="text-sm mt-1">{selectedBayaran.noKontrak || "-"}</p>
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
                    <Label className="text-sm font-medium text-muted-foreground">No Kontrak</Label>
                    <p className="text-sm">{selectedBayaran.noKontrak || "-"}</p>
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
                          <p className="text-xs text-muted-foreground mt-1">Status: {selectedBayaran.statusLadang}</p>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Rekod Bayaran</DialogTitle>
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
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2">
                            <p className="text-sm text-muted-foreground mb-2">Tiada hasil dijumpai.</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Keep the current input value
                                setShowDaripadaDropdown(false)
                              }}
                              className="w-full"
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
                                setFormData((prev) => ({ ...prev, daripada: suggestion, noKontrak: "", kategori: "" }))
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, tarikhTerima: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="perkara">Perkara</Label>
                <Textarea
                  id="perkara"
                  value={formData.perkara}
                  onChange={(e) => setFormData((prev) => ({ ...prev, perkara: e.target.value }))}
                  rows={3}
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
                  />
                </div>
                <div className="flex-[0.3]">
                  <Label htmlFor="bayaranKe">Bayaran Ke</Label>
                  <Input
                    id="bayaranKe"
                    value={formData.bayaranKe}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bayaranKe: e.target.value }))}
                  />
                </div>
              </div>

              {/* Mobile layout: No Kontrak and Kategori in one line */}
              <div className="md:hidden flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="noKontrak">No Kontrak</Label>
                  <Select value={formData.noKontrak} onValueChange={handleKontrakChange} disabled={!formData.daripada}>
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
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, kategori: value }))}
                    disabled={!formData.daripada || !formData.noKontrak}
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
                <Select value={formData.noKontrak} onValueChange={handleKontrakChange} disabled={!formData.daripada}>
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, kategori: value }))}
                  disabled={!formData.daripada || !formData.noKontrak}
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, statusLadang: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status ladang" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.statusLadangData.map((status) => (
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
                    setFormData((prev) => ({
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, tarikhPpnP: e.target.value }))}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Tarikh PN</Label>
                      <Input
                        type="date"
                        value={formData.tarikhPn}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tarikhPn: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tarikh Hantar</Label>
                    <Input
                      type="date"
                      value={formData.tarikhHantar}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                    />
                  </div>
                </>
              )}

              {/* Show only if both Memo Ladang and Hantar dates are filled */}
              {shouldShowHandoverFields() && (
                <>
                  {/* Penerima with dropdown */}
                  <div>
                    <Label>Penerima</Label>
                    <Popover open={showPenerimaDropdown} onOpenChange={setShowPenerimaDropdown}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={showPenerimaDropdown}
                          className="w-full justify-between bg-transparent"
                        >
                          {formData.penerima || "Pilih atau taip nama penerima..."}
                          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Cari nama penerima..."
                            value={formData.penerima}
                            onValueChange={handlePenerimaChange}
                          />
                          <CommandList>
                            <CommandEmpty>Tiada hasil dijumpai.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredPenerimaData.map((item) => (
                                <CommandItem
                                  key={item.display}
                                  value={item.display}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      penerima: item.display,
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

                  {/* Status Bayaran with colors from AUTH sheet */}
                  <div>
                    <Label>Status Bayaran</Label>
                    <Select
                      value={formData.statusBayaran}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
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
                        {formOptions.statusBayaranData.map((item) => (
                          <SelectItem key={item.status} value={item.status}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.colorHex }} />
                              {item.status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, nomborBaucer: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Nota Kaki</Label>
                <Textarea
                  placeholder="Masukkan nota tambahan"
                  className="min-h-[80px]"
                  value={formData.notaKaki}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notaKaki: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
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
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rekod Bayaran #{editingBayaran?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Same form structure as Add Dialog */}
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
                      disabled={user?.role === "KEWANGAN"}
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
                        disabled={user?.role === "KEWANGAN"}
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
                              disabled={user?.role === "KEWANGAN"}
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
                                setFormData((prev) => ({ ...prev, daripada: suggestion, noKontrak: "", kategori: "" }))
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, tarikhTerima: e.target.value }))}
                  disabled={user?.role === "KEWANGAN"}
                />
              </div>

              <div>
                <Label htmlFor="perkara">Perkara</Label>
                <Textarea
                  id="perkara"
                  value={formData.perkara}
                  onChange={(e) => setFormData((prev) => ({ ...prev, perkara: e.target.value }))}
                  rows={3}
                  disabled={user?.role === "KEWANGAN"}
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
                    disabled={user?.role === "KEWANGAN"}
                  />
                </div>
                <div className="flex-[0.3]">
                  <Label htmlFor="bayaranKe">Bayaran Ke</Label>
                  <Input
                    id="bayaranKe"
                    value={formData.bayaranKe}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bayaranKe: e.target.value }))}
                    disabled={user?.role === "KEWANGAN"}
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
                    disabled={!formData.daripada || user?.role === "KEWANGAN"}
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
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, kategori: value }))}
                    disabled={!formData.daripada || !formData.noKontrak || user?.role === "KEWANGAN"}
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
                  disabled={!formData.daripada || user?.role === "KEWANGAN"}
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, kategori: value }))}
                  disabled={!formData.daripada || !formData.noKontrak || user?.role === "KEWANGAN"}
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

            {/* Right Column - Same as Add Dialog */}
            <div className="space-y-4">
              {/* Status Ladang - Normal dropdown without auto-update */}
              <div>
                <Label>Status Ladang</Label>
                <Select
                  value={formData.statusLadang}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, statusLadang: value }))}
                  disabled={user?.role === "KEWANGAN"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status ladang" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.statusLadangData.map((status) => (
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
                    setFormData((prev) => ({
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
                  disabled={user?.role === "KEWANGAN"}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, tarikhPpnP: e.target.value }))}
                        disabled={user?.role === "KEWANGAN"}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Tarikh PN</Label>
                      <Input
                        type="date"
                        value={formData.tarikhPn}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tarikhPn: e.target.value }))}
                        disabled={user?.role === "KEWANGAN"}
                      />
                    </div>
                  </div>

                  <div hidden>
                    <Label>Tarikh Hantar</Label>
                    <Input
                      type="date"
                      value={formData.tarikhHantar}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                      disabled={user?.role === "KEWANGAN"}
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
                          setFormData((prev) => ({
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
                        disabled={user?.role === "KEWANGAN"}
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
                            disabled={user?.role === "KEWANGAN"}
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
                              disabled={user?.role === "KEWANGAN"}
                            />
                            <CommandList>
                              <CommandEmpty>Tiada hasil dijumpai.</CommandEmpty>
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {filteredPenerimaData.map((item) => (
                                  <CommandItem
                                    key={item.display}
                                    value={item.display}
                                    onSelect={() => {
                                      setFormData((prev) => ({
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
                          setFormData((prev) => ({
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
                          {formOptions.statusBayaranData.map((item) => (
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, tarikhBayar: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, nomborBaucer: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Nota Kaki</Label>
                <Textarea
                  placeholder="Masukkan nota tambahan"
                  className="min-h-[80px]"
                  value={formData.notaKaki}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notaKaki: e.target.value }))}
                  disabled={user?.role === "KEWANGAN"}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setEditingBayaran(null)
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
              {saving ? "Menyimpan..." : "Kemaskini"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Image Generator */}
      {sharingBayaran && (
        <BayaranShareImageGenerator
          bayaran={sharingBayaran}
          onImageGenerated={handleImageGenerated}
          onError={handleImageError}
        />
      )}

      {/* Surat Modal */}
      <Dialog open={showSuratModal} onOpenChange={setShowSuratModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">#{selectedSurat?.bil}</Badge>
              Maklumat Surat #{selectedSurat?.bil}
            </DialogTitle>
          </DialogHeader>
          {selectedSurat && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">BIL</Label>
                  <p className="text-sm font-medium">{selectedSurat.bil}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Daripada/Kepada</Label>
                  <p className="text-sm">{selectedSurat.daripadaKepada}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tarikh</Label>
                  <p className="text-sm">{selectedSurat.tarikh}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Perkara</Label>
                  <p className="text-sm whitespace-normal break-words">{selectedSurat.perkara}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kategori</Label>
                  <Badge variant="outline" className="text-xs">
                    {selectedSurat.kategori}
                  </Badge>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unit</Label>
                  <p className="text-sm">{selectedSurat.unit}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fail</Label>
                  <p className="text-sm">{selectedSurat.fail}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tindakan PIC</Label>
                  <p className="text-sm">{selectedSurat.tindakanPic}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant="outline" className="text-xs">
                    {selectedSurat.status}
                  </Badge>
                </div>

                {selectedSurat.tarikhSelesai && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tarikh Selesai</Label>
                    <p className="text-sm">{selectedSurat.tarikhSelesai}</p>
                  </div>
                )}

                {selectedSurat.nota && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nota</Label>
                    <p className="text-sm whitespace-normal break-words">{selectedSurat.nota}</p>
                  </div>
                )}

                {selectedSurat.komen && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Komen</Label>
                    <p className="text-sm whitespace-normal break-words">{selectedSurat.komen}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowSuratModal(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
