"use client";

import type React from "react";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-provider";
import type { Bayaran } from "@/types/bayaran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BayaranShareImageGenerator } from "@/components/bayaran-share-image-generator";
import { BayaranTable } from "@/components/bayaran/BayaranTable";
import { DetailDialog } from "@/components/bayaran/DetailDialog";
import { AddEditForm } from "@/components/bayaran/AddEditForm";
import { BulkEditDialog } from "@/components/bayaran/BulkEditDialog";
import { BayaranHeader } from "@/components/bayaran/BayaranHeader";
import { toast } from "sonner";

// Number of items per page
const ITEMS_PER_PAGE = 15;

// Kategori colors
const KATEGORI_COLORS: Record<string, string> = {
  "PERTANIAN AM": "bg-[#d4edbc] text-[#2c5f13] border-[#a9d97c]",
  "ANGKUT BTS": "bg-[#ffc8aa] text-[#7d2c00] border-[#ff9966]",
  PIECERATE: "bg-[#bfe1f6] text-[#0a558c] border-[#7cc4e8]",
  KIMIA: "bg-[#ffe5a0] text-[#7a4f01] border-[#ffd24c]",
  KONTRAK: "bg-[#e6cff2] text-[#5b1e7b] border-[#c884e4]",
};

export default function BayaranPage() {
  const { user } = useAuth();
  const [bayaran, setBayaran] = useState<Bayaran[]>([]);
  const [filteredBayaran, setFilteredBayaran] = useState<Bayaran[]>([]);
  const [displayedBayaran, setDisplayedBayaran] = useState<Bayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [kontrakFilter, setKontrakFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<[Date | undefined, Date | undefined]>([
    undefined,
    undefined,
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBayaran, setEditingBayaran] = useState<Bayaran | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  // Sorting state - Default sort by ID descending (largest first)
  const [sortField, setSortField] = useState<keyof Bayaran | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    daripadaTarikh: true, // Combined column
    perkara: true, // Will include kategori, status, baucer
    nilaiBayaran: true,
    bayaranKe: true,
    noKontrak: true, // New column
    tarikhBayar: true,
  });

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
  });

  const [formOptions, setFormOptions] = useState({
    daripadaSuggestions: [] as string[],
    statusLadangData: [] as string[], // Changed to string array
    contractData: {} as Record<string, string[]>,
    categoryData: {} as Record<string, Record<string, string[]>>,
    allContracts: [] as string[],
    allCategories: [] as string[],
    contractorData: {} as Record<string, string>, // noKontrak -> namaKontraktor
    penerimaData: [] as Array<{
      name: string;
      unit: string;
      display: string;
      defaultStatus: string;
    }>,
    statusBayaranData: [] as Array<{ status: string; colorHex: string }>,
  });

  const [showDaripadaDropdown, setShowDaripadaDropdown] = useState(false);
  const [filteredDaripadaSuggestions, setFilteredDaripadaSuggestions] = useState<string[]>([]);
  const [formDataLoading, setFormDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Share functionality states
  const [sharingBayaran, setSharingBayaran] = useState<Bayaran | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false); // loading animation

  // Get unique values for filtering
  const uniqueKategori = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.kategori))).filter(Boolean),
    [bayaran]
  );
  const uniqueStatus = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.statusBayaran))).filter(Boolean),
    [bayaran]
  );
  const uniqueKontrak = useMemo(
    () => Array.from(new Set(bayaran.map((item) => item.noKontrak))).filter(Boolean),
    [bayaran]
  );

  // Cache mechanism
  const fetchWithCache = useCallback(async () => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = Date.now();

    // If data was fetched recently, use cached data
    if (lastFetchTime && currentTime - lastFetchTime < CACHE_DURATION && bayaran.length > 0) {
      return;
    }

    setLoading(true);
    // Add a subtle loading animation to the card
    const card = document.querySelector(".card-hover");
    if (card) {
      card.classList.add("animate-pulse");
      setTimeout(() => {
        card.classList.remove("animate-pulse");
      }, 1000);
    }
    setError(null);

    try {
      const response = await fetch("/api/bayaran");

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        throw new Error("Invalid data format received from server");
      }

      setBayaran(data);

      // Update last fetch time
      setLastFetchTime(currentTime);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime, bayaran.length]);

  useEffect(() => {
    fetchWithCache();

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchWithCache();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(intervalId);
  }, [fetchWithCache]);

  useEffect(() => {
    filterBayaran();
  }, [
    bayaran,
    searchQuery,
    statusFilter,
    kategoriFilter,
    kontrakFilter,
    dateFilter,
    user,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    // Update displayed bayaran based on pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedBayaran(filteredBayaran.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredBayaran.length / ITEMS_PER_PAGE));
  }, [filteredBayaran, currentPage]);

  // Focus search input when search button is clicked
  useEffect(() => {
    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      if (showSearchInput && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showSearchInput]);

  // Fetch form data when add dialog opens
  useEffect(() => {
    if (showAddDialog || showEditDialog) {
      fetchFormData();
    }
  }, [showAddDialog, showEditDialog]);

  const fetchFormData = async () => {
    try {
      setFormDataLoading(true);
      const response = await fetch("/api/bayaran-form-data");
      if (response.ok) {
        const data = await response.json();
        setFormOptions({
          daripadaSuggestions: data.daripadaSuggestions || [],
          statusLadangData: data.statusLadangData || [], // Now it's a string array
          contractData: data.contractData || {},
          categoryData: data.categoryData || {},
          allContracts: data.allContracts || [],
          allCategories: data.allCategories || [],
          contractorData: data.contractorData || {},
          penerimaData: data.penerimaData || [],
          statusBayaranData: data.statusBayaranData || [],
        });
        setFilteredDaripadaSuggestions(data.daripadaSuggestions || []);
        setFilteredPenerimaData(data.penerimaData || []);
      } else {
        console.error("Failed to fetch form data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
    } finally {
      setFormDataLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Auto-filter for ID searches starting with #
    if (value.startsWith("#")) {
      const idNumber = value.substring(1);
      if (idNumber && !isNaN(Number(idNumber))) {
        // Filter bayaran by ID
        const filtered = bayaran.filter((item) => item.id === idNumber);
        setFilteredBayaran(filtered);
        setCurrentPage(1);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if it's an ID search with single result
    if (searchQuery.startsWith("#")) {
      const idNumber = searchQuery.substring(1);
      if (idNumber && !isNaN(Number(idNumber))) {
        const foundBayaran = bayaran.find((item) => item.id === idNumber);
        if (foundBayaran) {
          setSelectedBayaran(foundBayaran);
          setShowDetailDialog(true);
          return;
        }
      }
    }

    filterBayaran();
  };

  const filterBayaran = () => {
    if (!Array.isArray(bayaran)) {
      setFilteredBayaran([]);
      return;
    }

    let filtered = [...bayaran];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      // Handle ID search with # prefix
      if (query.startsWith("#")) {
        const idNumber = query.substring(1);
        if (idNumber && !isNaN(Number(idNumber))) {
          filtered = filtered.filter((item) => item.id === idNumber);
        } else {
          filtered = [];
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
            (item.id || "").toLowerCase().includes(query)
        );
      }
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.statusBayaran === statusFilter);
    }

    // Apply kategori filter
    if (kategoriFilter !== "all") {
      filtered = filtered.filter((item) => item.kategori === kategoriFilter);
    }

    // Apply kontrak filter
    if (kontrakFilter !== "all") {
      filtered = filtered.filter((item) => item.noKontrak === kontrakFilter);
    }

    // Apply date range filter
    if (dateFilter[0]) {
      const fromDate = dateFilter[0];
      const toDate = dateFilter[1] || fromDate; // If no end date, use start date

      filtered = filtered.filter((item) => {
        if (!item.tarikhTerima) return false;
        const dateParts = item.tarikhTerima.split("/");
        if (dateParts.length !== 3) return false;
        const itemDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

        if (isNaN(itemDate.getTime())) return false;

        // Normalize dates to remove time part
        const from = new Date(fromDate.setHours(0, 0, 0, 0));
        const to = new Date(toDate.setHours(23, 59, 59, 999));

        return itemDate >= from && itemDate <= to;
      });
    } else {
      // Default filter for 2025 - show all 2025 records
      filtered = filtered.filter((item) => {
        if (!item.tarikhTerima) return false;
        const dateParts = item.tarikhTerima.split("/");
        if (dateParts.length !== 3) return false;
        const year = dateParts[2];
        return year === "2025";
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";

        // Special handling for ID field to sort numerically
        if (sortField === "id") {
          const aNum = Number.parseInt(String(aValue)) || 0;
          const bNum = Number.parseInt(String(bValue)) || 0;
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (sortDirection === "asc") {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }

    setFilteredBayaran(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Bayaran) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterBayaran();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleKategoriFilter = (kategori: string) => {
    setKategoriFilter(kategori);
  };

  const handleKontrakFilter = (kontrak: string) => {
    setKontrakFilter(kontrak);
  };

  const handleDateFilter = (date: Date | undefined) => {
    setDateFilter(date);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setKategoriFilter("all");
    setKontrakFilter("all");
    setDateFilter([undefined, undefined]);
    setShowSearchInput(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDaripadaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      daripada: value,
      noKontrak: "", // Reset dependent fields
      kategori: "",
    }));

    // Filter suggestions
    const filtered = formOptions.daripadaSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDaripadaSuggestions(filtered);
  };

  const handleKontrakChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      noKontrak: value,
      kategori: "", // Reset dependent field
    }));
  };

  const getAvailableKontraks = () => {
    if (formData.daripada.toUpperCase() === "LADANG NEGERI") {
      return formOptions.allContracts;
    }
    return formOptions.contractData[formData.daripada] || [];
  };

  const getAvailableKategoris = () => {
    if (formData.daripada.toUpperCase() === "LADANG NEGERI") {
      return formOptions.allCategories;
    }
    if (!formData.daripada || !formData.noKontrak) return [];
    return formOptions.categoryData[formData.daripada]?.[formData.noKontrak] || [];
  };

  // Get status color from AUTH sheet data
  const getStatusColor = (status: string) => {
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status);
    if (statusData) {
      return `text-white border-0`;
    }

    // Fallback colors if not found in AUTH sheet
    switch (status?.toLowerCase()) {
      case "selesai":
      case "dibayar":
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200";
      case "pending":
      case "menunggu":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200";
      case "dalam proses":
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200";
      case "batal":
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Get status background color for badges
  const getStatusBadgeStyle = (status: string) => {
    // Special handling for Hold / KIV status
    if (status === "Hold / KIV") {
      return { backgroundColor: "#000000", color: "#ffffff", border: "none" };
    }
    
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status);
    if (statusData) {
      return { backgroundColor: statusData.colorHex, color: "white", border: "none" };
    }
    return {};
  };

  // Get kategori color
  const getKategoriColor = (kategori: string) => {
    return KATEGORI_COLORS[kategori?.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Format currency
  const formatCurrency = (value: string) => {
    if (!value) return "-";
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.-]/g, "");
    if (isNaN(Number(numericValue))) return value;
    return `RM ${Number(numericValue).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format currency for input with auto formatting - Updated to handle larger amounts
  const formatCurrencyInput = (value: string) => {
    if (!value) return "";
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.-]/g, "");
    if (isNaN(Number(numericValue))) return value;

    // Handle larger numbers up to 999,999,999.99
    const number = Number(numericValue);
    if (number > 999999999.99) {
      return "999,999,999.99";
    }

    return number.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Handle currency input change - Updated to handle larger amounts
  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the current cursor position
    const cursorPos = e.target.selectionStart || 0;

    // Get the current value without commas
    const currentValue = formData.nilaiBayaran;

    // Get the new value from the input
    let newValue = e.target.value;

    // Remove all non-numeric characters except decimal point
    newValue = newValue.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const parts = newValue.split(".");
    if (parts.length > 2) {
      newValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      newValue = parts[0] + "." + parts[1].substring(0, 2);
    }

    // Check if the number exceeds the maximum limit (999,999,999.99)
    const numericValue = Number(newValue);
    if (numericValue > 999999999.99) {
      newValue = "999999999.99";
    }

    // Store the raw numeric value in state
    setFormData((prev) => ({ ...prev, nilaiBayaran: newValue }));

    // Calculate new cursor position based on added/removed commas
    const oldCommaCount = (formatCurrencyInput(currentValue).match(/,/g) || []).length;
    const newCommaCount = (formatCurrencyInput(newValue).match(/,/g) || []).length;
    const commasDiff = newCommaCount - oldCommaCount;

    // Set cursor position after the component updates
    setTimeout(() => {
      const input = e.target;
      if (input) {
        const newPos = Math.max(0, cursorPos + commasDiff);
        input.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Format date to display as "5 Mei 2025"
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    const dateParts = dateString.split("/");
    if (dateParts.length !== 3) return dateString;

    const day = Number.parseInt(dateParts[0], 10).toString(); // Remove leading zero
    const month = Number.parseInt(dateParts[1], 10);
    const year = dateParts[2];

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
    ];

    return `${day} ${monthNames[month - 1]} ${year}`;
  };

  // Extract unit from penerima display
  const extractPenerimaWithUnit = (penerima: string) => {
    if (!penerima) return "";

    // 1. Cari data penerima yang sesuai dari formOptions.penerimaData
    const penerimaData = formOptions.penerimaData.find(
      (item) => item.name === penerima || item.display === penerima
    );

    // 2. Jika ditemukan, kembalikan format "Nama (Unit)"
    if (penerimaData) {
      return `${penerimaData.name} (${penerimaData.unit})`;
    }

    // 3. Jika input sudah mengandung format "Nama (Unit)", kembalikan apa adanya
    if (penerima.includes("(") && penerima.includes(")")) {
      return penerima;
    }

    // 4. Default: kembalikan nama saja
    return penerima;
  };

  const [selectedBayaran, setSelectedBayaran] = useState<Bayaran | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [showPenerimaDropdown, setShowPenerimaDropdown] = useState(false);
  const [filteredPenerimaData, setFilteredPenerimaData] = useState<
    Array<{ name: string; unit: string; display: string }>
  >([]);

  const handlePenerimaChange = (value: string) => {
    setFormData((prev) => {
      // Find the selected penerima to get their default status
      const selectedPenerima = formOptions.penerimaData.find((item) => item.display === value);
      // Always extract name before parentheses
      const nameOnly = value.split(" (")[0];
      return {
        ...prev,
        penerima: nameOnly,
        statusBayaran: selectedPenerima?.defaultStatus || prev.statusBayaran,
      };
    });

    // Filter penerima suggestions
    const filtered = formOptions.penerimaData.filter(
      (item) =>
        item.display.toLowerCase().includes(value.toLowerCase()) ||
        item.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPenerimaData(filtered);
  };

  // Helper functions for conditional visibility
  const shouldShowAdvancedFields = () => {
    return formData.tarikhMemoLadang !== "";
  };

  // Helper functions for conditional visibility - Updated to show fields when Tarikh PN is filled
  const shouldShowHandoverFields = () => {
    return (
      formData.tarikhMemoLadang !== "" && (formData.tarikhHantar !== "" || formData.tarikhPn !== "")
    );
  };

  const shouldShowCompletionFields = () => {
    return (
      formData.tarikhMemoLadang !== "" &&
      formData.tarikhHantar !== "" &&
      formData.statusBayaran === "SELESAI"
    );
  };

  const getStatusBayaranColor = (status: string) => {
    const statusData = formOptions.statusBayaranData.find((item) => item.status === status);
    return statusData?.colorHex || "#6b7280";
  };

  // Save functionality - Updated to handle both add and edit properly with forced refresh
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.daripada || !formData.tarikhTerima || !formData.perkara) {
        toast.error("Sila isi semua medan yang diperlukan");
        return;
      }

      const payload = {
        ...formData,
        user: user?.name || "Unknown",
      };

      let response;
      if (editingBayaran) {
        // Update existing record
        response = await fetch(`/api/bayaran/${editingBayaran.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record
        response = await fetch("/api/bayaran", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(`Rekod bayaran berjaya ${editingBayaran ? "dikemaskini" : "disimpan"}!`);

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
        });

        setShowAddDialog(false);
        setShowEditDialog(false);
        setEditingBayaran(null);

        // Force refresh data by clearing cache and fetching new data
        setLastFetchTime(null);
        await fetchWithCache();

        // Also force re-filter to update the display
        setTimeout(() => {
          filterBayaran();
        }, 100);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error || `Gagal ${editingBayaran ? "mengemaskini" : "menyimpan"} rekod bayaran`
        );
      }
    } catch (error) {
      console.error("Error saving bayaran:", error);
      toast.error("Ralat semasa menyimpan rekod bayaran");
    } finally {
      setSaving(false);
    }
  };

  // Add helper function for date conversion
  const convertDateForEdit = (dateString: string): string => {
    if (!dateString) return "";
    const parts = dateString.split("/");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  // Edit functionality
  const handleEdit = (bayaran: Bayaran) => {
    setEditingBayaran(bayaran);
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
    });
    setShowEditDialog(true);
  };

  // Delete functionality
  const handleDelete = async () => {
    if (!selectedBayaran) return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/bayaran/${selectedBayaran.id}?user=${user?.name || "Unknown"}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Rekod bayaran berjaya dipadam");
        setShowDetailDialog(false);
        // Force refresh data
        setLastFetchTime(null);
        await fetchWithCache();
        setTimeout(() => {
          filterBayaran();
        }, 100);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gagal memadam rekod bayaran");
      }
    } catch (error) {
      console.error("Error deleting bayaran:", error);
      toast.error("Ralat semasa memadam rekod bayaran");
    } finally {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // Share functionality
  const handleShare = (bayaran: Bayaran) => {
    setIsSharing(true); // loading animation
    setSharingBayaran(bayaran);
    setIsGeneratingImage(true);
  };

  const handleImageGenerated = (imageUrl: string, directLink: string) => {
    setIsGeneratingImage(false);
    setIsSharing(false); // loading animation
    setSharingBayaran(null);
    //todo baiki whatsapp status
    if (sharingBayaran) {
      const isCancelled = sharingBayaran.statusBayaran.toLowerCase() === "batal";
      const statusIcon = isCancelled ? "⛔" : sharingBayaran.tarikhBayar ? "✅" : "🕑";
      const checkIcon = isCancelled ? "⛔" : "✅";

      const message = `📌*REKOD BAYARAN #${sharingBayaran.id}*
      _${sharingBayaran.statusBayaran.toUpperCase()}_ ${statusIcon}

${
  sharingBayaran.tarikhBayar
    ? `*${checkIcon} Tarikh Bayar : ${sharingBayaran.tarikhBayar}*\n> Baucer : _${sharingBayaran.nomborBaucer}_`
    : "> ☑️ Tarikh Bayar : (belum bayar)"
}
> ↑————————-
${
  sharingBayaran.tarikhHantar
    ? `*${checkIcon} Tarikh Hantar : ${sharingBayaran.tarikhHantar}*`
    : "> ☑️ Tarikh Hantar : (belum hantar)"
}
> ↑————————
${
  sharingBayaran.tarikhPn
    ? `*${checkIcon} Tarikh PN : ${sharingBayaran.tarikhPn}*`
    : "> ☑️ Tarikh PN : (belum proses)"
}
> ↑————————
${
  sharingBayaran.tarikhPpnP
    ? `*${checkIcon} Tarikh PPN (P) : ${sharingBayaran.tarikhPpnP}*`
    : "> ☑️ Tarikh PPN (P) : (belum proses)"
}
> ↑————————
${
  sharingBayaran.tarikhMemoLadang
    ? `*${checkIcon} Tarikh Memo : ${sharingBayaran.tarikhMemoLadang}*`
    : "> ☑️ Tarikh Memo : (belum dibuat)"
}
> ↑————————
*${checkIcon} Tarikh Terima : ${sharingBayaran.tarikhTerima}*
> _Daripada : *${sharingBayaran.daripada.toUpperCase()}*_
> |——————————————
*${sharingBayaran.perkara.toUpperCase()}*
> KE : _${sharingBayaran.bayaranKe}_ *|* _${sharingBayaran.noKontrak}_
> _${formatCurrency(sharingBayaran.nilaiBayaran)}_
> *Nota Kaki:* _${sharingBayaran.notaKaki}_

Detail: ${directLink}
> (exp 24 hours)`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;
    }
  };

  const handleImageError = (error: Error) => {
    setIsGeneratingImage(false);
    setIsSharing(false); //loading animation
    setSharingBayaran(null);
    toast.error("Gagal menjana imej untuk dikongsi");
    console.error("Image generation error:", error);
  };

  // Function to handle #S links in Nota Kaki
  const handleSuratLinkClick = async (bilNumber: string) => {
    try {
      setLoadingSurat(true);
      const response = await fetch(`/api/surat/${bilNumber}`);

      if (response.ok) {
        const suratData = await response.json();
        setSelectedSurat(suratData);
        setShowSuratModal(true);
      } else {
        toast.error(`Surat #${bilNumber} tidak dijumpai`);
      }
    } catch (error) {
      console.error("Error fetching surat:", error);
      toast.error("Ralat semasa mengambil data surat");
    } finally {
      setLoadingSurat(false);
    }
  };

  const renderNotaKakiWithLinks = (notaKaki: string) => {
    if (!notaKaki) return null;

    // Regex to find #S followed by numbers
    const regex = /#S(\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(notaKaki)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(notaKaki.slice(lastIndex, match.index));
      }

      // Add the clickable link
      const bilNumber = match[1];
      parts.push(
        <button
          key={match.index}
          onClick={() => handleSuratLinkClick(bilNumber)}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
          disabled={loadingSurat}
        >
          #S{bilNumber}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < notaKaki.length) {
      parts.push(notaKaki.slice(lastIndex));
    }

    return parts.length > 0 ? parts : notaKaki;
  };

  const [showSuratModal, setShowSuratModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<any>(null);
  const [loadingSurat, setLoadingSurat] = useState(false);

  if (loading && bayaran.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
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
        <BayaranHeader
          user={user}
          showSearchInput={showSearchInput}
          setShowSearchInput={setShowSearchInput}
          searchQuery={searchQuery}
          handleSearchInputChange={handleSearchInputChange}
          handleSearchSubmit={handleSearchSubmit}
          searchInputRef={searchInputRef}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          statusFilter={statusFilter}
          kategoriFilter={kategoriFilter}
          kontrakFilter={kontrakFilter}
          clearAllFilters={clearAllFilters}
          setSortField={setSortField}
          setSortDirection={setSortDirection}
          uniqueStatus={uniqueStatus}
          uniqueKategori={uniqueKategori}
          uniqueKontrak={uniqueKontrak}
          setStatusFilter={setStatusFilter}
          setKategoriFilter={setKategoriFilter}
          setKontrakFilter={setKontrakFilter}
          selectedRows={selectedRows}
          setShowAddDialog={setShowAddDialog}
          setShowBulkEditDialog={setShowBulkEditDialog}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
        <CardContent className="overflow-hidden">
          <BayaranTable
            displayedBayaran={displayedBayaran}
            columnVisibility={columnVisibility}
            handleSort={handleSort}
            setSelectedBayaran={setSelectedBayaran}
            setShowDetailDialog={setShowDetailDialog}
            getKategoriColor={getKategoriColor}
            getStatusColor={getStatusColor}
            getStatusBadgeStyle={getStatusBadgeStyle}
            formatCurrency={formatCurrency}
            renderNotaKakiWithLinks={renderNotaKakiWithLinks}
            handleKontrakFilter={handleKontrakFilter}
            handleShare={handleShare}
            isGeneratingImage={isGeneratingImage}
            sharingBayaran={sharingBayaran}
            isSharing={isSharing}
            loading={loading}
            error={error}
            fetchWithCache={fetchWithCache}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
          />

          {/* Pagination - Non-sticky for mobile */}
          {filteredBayaran.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4 md:mb-0">
              <div className="text-xs text-muted-foreground">
                List {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBayaran.length)} from{" "}
                {filteredBayaran.length}
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

      <DetailDialog
        showDetailDialog={showDetailDialog}
        setShowDetailDialog={setShowDetailDialog}
        selectedBayaran={selectedBayaran}
        handleEdit={handleEdit}
        handleShare={handleShare}
        isSharing={isSharing}
        isGeneratingImage={isGeneratingImage}
        user={user}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleDelete={handleDelete}
        isDeleting={isDeleting}
        getKategoriColor={getKategoriColor}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        extractPenerimaWithUnit={extractPenerimaWithUnit}
        renderNotaKakiWithLinks={renderNotaKakiWithLinks}
      />

      <AddEditForm
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        editingBayaran={editingBayaran}
        setEditingBayaran={setEditingBayaran}
        formData={formData}
        setFormData={setFormData}
        formOptions={formOptions}
        handleSave={handleSave}
        saving={saving}
        user={user}
        showDaripadaDropdown={showDaripadaDropdown}
        setShowDaripadaDropdown={setShowDaripadaDropdown}
        handleDaripadaChange={handleDaripadaChange}
        filteredDaripadaSuggestions={filteredDaripadaSuggestions}
        handleKontrakChange={handleKontrakChange}
        getAvailableKontraks={getAvailableKontraks}
        getAvailableKategoris={getAvailableKategoris}
        handleCurrencyInputChange={handleCurrencyInputChange}
        formatCurrencyInput={formatCurrencyInput}
        shouldShowAdvancedFields={shouldShowAdvancedFields}
        shouldShowHandoverFields={shouldShowHandoverFields}
        shouldShowCompletionFields={shouldShowCompletionFields}
        showPenerimaDropdown={showPenerimaDropdown}
        setShowPenerimaDropdown={setShowPenerimaDropdown}
        handlePenerimaChange={handlePenerimaChange}
        filteredPenerimaData={filteredPenerimaData}
        KATEGORI_COLORS={KATEGORI_COLORS}
      />

      <BulkEditDialog
        showBulkEditDialog={showBulkEditDialog}
        setShowBulkEditDialog={setShowBulkEditDialog}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        formOptions={formOptions}
        fetchWithCache={fetchWithCache}
        user={user}
      />

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
                  <Label className="text-sm font-medium text-muted-foreground">
                    Daripada/Kepada
                  </Label>
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      Tarikh Selesai
                    </Label>
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
  );
}
