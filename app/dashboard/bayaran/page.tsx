"use client";

import { Skeleton } from "skullet/react"
import { SAMPLE_BAYARAN } from "@/lib/skeleton-samples"
import { useRowFlash } from "@/lib/use-row-flash"
import type React from "react";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { takeBayaranSeed } from "@/lib/bayaran-seed";
import { takeBayaranPrefill } from "@/lib/bayaran-prefill";
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
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
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
import { inRange } from "@/components/dashboard/date-range-filter";
import { parseDate } from "@/lib/dashboard-stats";
import { BayaranTable } from "@/components/bayaran/BayaranTable";
import { matchesBayaranSearch, parseRecordNumber } from "@/lib/bayaran-search";
import { TAG_EVENT } from "@/lib/tags";
import { LinkedText } from "@/components/shared/linked-text";
import { DetailDialog, type KontrakInfo } from "@/components/bayaran/DetailDialog";
import { AddEditForm } from "@/components/bayaran/AddEditForm";
import { BulkEditDialog } from "@/components/bayaran/BulkEditDialog";
import { BayaranHeader } from "@/components/bayaran/BayaranHeader";
import { toast } from "sonner";
import { KEMAJUAN, LEBIH_5K, PIECERATE, WCP, bayaranFormErrors } from "@/types/bayaran-schema";

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

  // A "#tag" clicked in a Nota Kaki lists the records that carry it
  useEffect(() => {
    const onTag = (e: Event) => {
      const tag = (e as CustomEvent<{ tag: string }>).detail?.tag;
      if (!tag) return;
      setShowDetailDialog(false);
      setSearchQuery(`#${tag}`);
      setShowSearchInput(true);
    };
    window.addEventListener(TAG_EVENT, onTag);
    return () => window.removeEventListener(TAG_EVENT, onTag);
  }, []);
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
  // Surat this new record answers ("Respon To Bayaran"); saving it closes that surat
  const [dariSuratBil, setDariSuratBil] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  // Sorting state - Default sort by IDS descending (largest first)
  const [sortField, setSortField] = useState<keyof Bayaran | null>("ids");
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
    jenisBayaran: "KEMAJUAN",
    perkara: "",
    nilaiBayaran: "",
    // Shown and sent only while "Wang Tahanan" is ticked
    adaWangTahanan: false,
    wangTahanan: "",
    bayaranKe: "",
    bayaranAkhir: false,
    kategori: "",
    noKontrak: "",
    namaKontraktor: "",
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
    kawasanList: [] as string[], // Daripada choices (Tetapan → Kawasan)
    kontraktorList: [] as string[], // every contractor (Nama Kontraktor of LEBIH 5K)
    statusLadangData: [] as Array<{status: string, colorHex: string}>, // Array of objects with status and colorHex
    contractData: {} as Record<string, string[]>,
    categoryData: {} as Record<string, Record<string, string[]>>,
    allContracts: [] as string[],
    allCategories: [] as string[],
    contractorData: {} as Record<string, string>, // noKontrak -> namaKontraktor
    kontrakInfo: {} as Record<string, KontrakInfo>, // noKontrak -> kerja, nilai kontrak (first kawasan)
    kontrakInfoByKawasan: {} as Record<string, Record<string, KontrakInfo>>, // kawasan -> noKontrak -> info
    closedContracts: [] as string[], // closed in every kawasan (LADANG NEGERI list)
    closedByKawasan: {} as Record<string, string[]>,
    piecerateKontraktor: {} as Record<string, string[]>, // kawasan -> contractors of its AKTIF PIECERATE kontrak // SELESAI / TIDAK AKTIF per kawasan: not offered for new records
    penerimaData: [] as Array<{
      name: string;
      unit: string;
      display: string;
      defaultStatus: string;
      active?: boolean;
    }>,
    statusBayaranData: [] as Array<{ status: string; colorHex: string }>,
  });

  const [formDataLoading, setFormDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Field errors of the Tambah / Edit form, shown after a save attempt
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Opened from the Dashboard (?buka=): start from the rows it already had, so
  // the Rekod Bayaran shows at once; the fetch below refreshes them
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("buka")) return;
    const seed = takeBayaranSeed();
    if (seed?.length) setBayaran((prev) => (prev.length ? prev : seed));
  }, []);

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

  // A record just added flashes in the list, on the page that holds it
  const filteredIds = useMemo(() => filteredBayaran.map((item) => item.id), [filteredBayaran]);
  const { flashKey: flashId, flash: flashBayaran } = useRowFlash(filteredIds, ITEMS_PER_PAGE, setCurrentPage);

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

  const formDataLoaded = useRef(false);

  const fetchFormData = async () => {
    try {
      setFormDataLoading(true);
      const response = await fetch("/api/bayaran-form-data");
      if (response.ok) {
        const data = await response.json();
        setFormOptions({
          daripadaSuggestions: data.daripadaSuggestions || [],
          kawasanList: data.kawasanList || [],
          kontraktorList: data.kontraktorList || [],
          statusLadangData: data.statusLadangData || [], // Now it's a string array
          contractData: data.contractData || {},
          categoryData: data.categoryData || {},
          allContracts: data.allContracts || [],
          allCategories: data.allCategories || [],
          contractorData: data.contractorData || {},
          kontrakInfo: data.kontrakInfo || {},
          kontrakInfoByKawasan: data.kontrakInfoByKawasan || {},
          closedContracts: data.closedContracts || [],
          closedByKawasan: data.closedByKawasan || {},
          piecerateKontraktor: data.piecerateKontraktor || {},
          penerimaData: data.penerimaData || [],
          statusBayaranData: data.statusBayaranData || [],
        });
        formDataLoaded.current = true;
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
    // filterBayaran runs from the effect on searchQuery
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // "*119" + Enter opens that record directly
    if (searchQuery.trim().startsWith("*")) {
      const recordNumber = parseRecordNumber(searchQuery);
      const foundBayaran = recordNumber !== null ? bayaran.find((item) => item.ids === recordNumber) : undefined;
      if (foundBayaran) {
        setSelectedBayaran(foundBayaran);
        setShowDetailDialog(true);
        return;
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

    // Apply search filter (record number, Nilai Bayaran, text fields)
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) => matchesBayaranSearch(item, searchQuery));
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
      // Whole days, inclusive; a single day when there is no end date
      filtered = filtered.filter((item) => inRange(parseDate(item.tarikhTerima), dateFilter));
    } else if (!searchQuery.trim()) {
      // Default: this year and last year only (by tarikh terima). A search
      // looks through every year, so an older record can still be found.
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      filtered = filtered.filter((item) => {
        if (!item.tarikhTerima) return false;
        const dateParts = item.tarikhTerima.split("/");
        if (dateParts.length !== 3) return false;
        const year = parseInt(dateParts[2]);
        return year === currentYear || year === previousYear;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";

        // Numbers and DD/MM/YYYY dates must not be compared as text
        const numeric = (value: unknown): number | null => {
          if (sortField === "ids") return Number(value) || 0;
          if (sortField === "nilaiBayaran") return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
          if (String(sortField).startsWith("tarikh")) {
            const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0;
          }
          return null;
        };
        const aNum = numeric(aValue);
        const bNum = numeric(bValue);
        if (aNum !== null && bNum !== null) {
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
      // A PIECERATE bayaran keeps its kategori (and contractor) whatever the Daripada
      kategori: prev.jenisBayaran === PIECERATE ? PIECERATE : "",
    }));
  };

  // A kawasan added with the + by Daripada joins the list straight away
  const handleKawasanAdded = (nama: string) => {
    setFormOptions((prev) => ({
      ...prev,
      kawasanList: prev.kawasanList.includes(nama)
        ? prev.kawasanList
        : [...prev.kawasanList, nama].sort((a, b) => a.localeCompare(b)),
    }));
  };

  // Kategori is picked first; No Kontrak then lists that kategori's contracts
  // (each kontrak has one kategori in the kontrak table)
  const kategoriOf = (noKontrak: string, daripada = formData.daripada) => {
    const own = formOptions.categoryData[daripada]?.[noKontrak];
    if (own?.length) return own;
    for (const byKontrak of Object.values(formOptions.categoryData)) {
      if (byKontrak[noKontrak]?.length) return byKontrak[noKontrak];
    }
    return [];
  };

  // Open contracts of the Daripada (any kategori). Closed ones (SELESAI / TIDAK
  // AKTIF) are hidden; a record that already uses one keeps it so editing does not wipe it
  const openKontraksOf = (daripada: string, keep = "") => {
    const all =
      daripada.toUpperCase() === "LADANG NEGERI" ? formOptions.allContracts : formOptions.contractData[daripada] || [];
    // A kontrak is its kawasan + no kontrak: the same number may be open in one kawasan and closed in another
    const closed = new Set(
      daripada.toUpperCase() === "LADANG NEGERI" ? formOptions.closedContracts : formOptions.closedByKawasan[daripada] || []
    );
    return all.filter((noKontrak) => !closed.has(noKontrak) || noKontrak === keep);
  };

  // Kerja / nilai of a bayaran's kontrak: its own kawasan's, else the number's first
  const kontrakInfoOf = (b: Bayaran) =>
    formOptions.kontrakInfoByKawasan[b.daripada]?.[b.noKontrak] ?? formOptions.kontrakInfo[b.noKontrak];

  const kontraksFor = (daripada: string, kategori: string, keep = "") =>
    kategori ? openKontraksOf(daripada, keep).filter((k) => kategoriOf(k, daripada).includes(kategori)) : [];

  const handleKategoriChange = (value: string) => {
    setFormData((prev) => {
      const options = kontraksFor(prev.daripada, value);
      return {
        ...prev,
        kategori: value,
        // Keep a no kontrak that still fits; a kategori with one contract fills it in
        noKontrak: options.includes(prev.noKontrak) ? prev.noKontrak : options.length === 1 ? options[0] : "",
      };
    });
  };

  // PIECERATE needs no kontrak: kategori becomes PIECERATE (its input is hidden)
  // and the contractor is picked by name. Leaving it clears those again.
  const handleJenisBayaranChange = (value: string) => {
    setFormData((prev) => {
      // Coming from a jenis whose contractor is picked by name, that name goes
      const fromNamed = prev.jenisBayaran === PIECERATE || prev.jenisBayaran === LEBIH_5K;
      if (value === PIECERATE)
        return { ...prev, jenisBayaran: value, kategori: PIECERATE, noKontrak: "", ...(fromNamed ? { namaKontraktor: "" } : {}), adaWangTahanan: false, wangTahanan: "", bayaranAkhir: false };
      // LEBIH 5K: no kategori or kontrak (hidden); the contractor is picked from the whole list
      if (value === LEBIH_5K)
        return { ...prev, jenisBayaran: value, kategori: "", noKontrak: "", ...(fromNamed ? { namaKontraktor: "" } : {}), adaWangTahanan: false, wangTahanan: "", bayaranAkhir: false };
      // WCP is paid once: Bayaran Ke is hidden and cleared
      let next = value === WCP ? { ...prev, jenisBayaran: value, bayaranKe: "" } : { ...prev, jenisBayaran: value };
      // Only KEMAJUAN offers the Wang Tahanan tick
      if (value !== KEMAJUAN) next = { ...next, adaWangTahanan: false, wangTahanan: "", bayaranAkhir: false };
      if (fromNamed) return { ...next, kategori: "", noKontrak: "", namaKontraktor: "" };
      return next;
    });
  };

  // PIECERATE: Nama Kontraktor lists the contractors of the Daripada's AKTIF
  // PIECERATE kontrak; an edited record keeps its own name
  const getPiecerateKontraktors = () => {
    const names = [...(formOptions.piecerateKontraktor[formData.daripada] || [])];
    if (formData.namaKontraktor && !names.includes(formData.namaKontraktor)) names.unshift(formData.namaKontraktor);
    return names;
  };

  // LEBIH 5K: Nama Kontraktor lists every contractor (Tetapan → Kontraktor); an
  // edited record keeps its own name
  const getSemuaKontraktors = () => {
    const names = [...formOptions.kontraktorList];
    if (formData.namaKontraktor && !names.includes(formData.namaKontraktor)) names.unshift(formData.namaKontraktor);
    return names;
  };

  // New PIECERATE record: follow the Daripada, filling in its only contractor
  useEffect(() => {
    if (editingBayaran || formData.jenisBayaran !== PIECERATE) return;
    const names = formOptions.piecerateKontraktor[formData.daripada] || [];
    if (names.includes(formData.namaKontraktor)) return;
    const next = names.length === 1 ? names[0] : "";
    if (next !== formData.namaKontraktor) setFormData((prev) => ({ ...prev, namaKontraktor: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.daripada, formData.jenisBayaran, formOptions.piecerateKontraktor, editingBayaran]);

  const handleKontrakChange = (value: string) => {
    setFormData((prev) => ({ ...prev, noKontrak: value }));
  };

  const getAvailableKontraks = () => {
    const options = kontraksFor(formData.daripada, formData.kategori, formData.noKontrak);
    // An older record whose no kontrak does not match its kategori keeps it
    return formData.noKontrak && !options.includes(formData.noKontrak) ? [formData.noKontrak, ...options] : options;
  };

  // Once shown, errors clear as the fields are filled; closing the form drops them
  useEffect(() => {
    if (!showAddDialog && !showEditDialog) {
      setFormErrors({});
      return;
    }
    setFormErrors((prev) =>
      Object.keys(prev).length === 0 ? prev : bayaranFormErrors(formData, !editingBayaran, { kategori: getAvailableKategoris(), kontrak: getAvailableKontraks(), kontraktor: getPiecerateKontraktors(), semuaKontraktor: getSemuaKontraktors() })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, showAddDialog, showEditDialog, editingBayaran]);

  const getAvailableKategoris = () => {
    if (!formData.daripada) return [];
    const kategoris =
      formData.daripada.toUpperCase() === "LADANG NEGERI"
        ? [...formOptions.allCategories]
        : Array.from(new Set(openKontraksOf(formData.daripada).flatMap((k) => kategoriOf(k))));
    // PIECERATE is a Jenis Bayaran, so it is not offered as a Kategori (an older record keeps its own below)
    const options = kategoris.filter((k) => k.toUpperCase() !== PIECERATE);
    // An older record keeps its kategori selectable
    if (formData.kategori && !options.includes(formData.kategori)) options.unshift(formData.kategori);
    return options;
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

  // Get status ladang color from AUTH sheet data
  const getStatusLadangColor = (status: string) => {
    const statusData = formOptions.statusLadangData.find((item) => item.status === status);
    if (statusData) {
      return `text-white border-0`;
    }

    // Fallback colors if not found in AUTH sheet
    switch (status?.toLowerCase()) {
      case "selesai":
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

  // Get status ladang background color for badges
  const getStatusLadangBadgeStyle = (status: string) => {
    const statusData = formOptions.statusLadangData.find((item) => item.status === status);
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
  // Nilai Bayaran, or Wang Tahanan when field says so
  const handleCurrencyInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "nilaiBayaran" | "wangTahanan" = "nilaiBayaran",
  ) => {
    // Get the current cursor position
    const cursorPos = e.target.selectionStart || 0;

    // Get the current value without commas
    const currentValue = formData[field];

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
    setFormData((prev) => ({ ...prev, [field]: newValue }));

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
    const exact = formOptions.penerimaData.find((item) => item.display === penerima);
    if (exact) return exact.display;
    const byName = formOptions.penerimaData.filter((item) => item.name === penerima);

    // 2. Satu akaun sahaja: kembalikan format "Nama (Unit)". Jika nama sama wujud
    //    dalam beberapa unit (pengguna bertukar unit), unit sebenar rekod lama
    //    tidak diketahui, jadi papar nama sahaja.
    if (byName.length > 0) {
      const units = new Set(byName.map((item) => item.unit));
      return units.size === 1 ? `${byName[0].name} (${byName[0].unit})` : penerima;
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

  // Closing Tambah Rekod Bayaran without saving forgets the surat it came from
  // (declared before the ?tambah=surat effect so that one wins on first load)
  useEffect(() => {
    if (!showAddDialog) setDariSuratBil(null);
  }, [showAddDialog]);

  // /dashboard/bayaran?tambah=surat ("Respon To Bayaran" on a surat): Tambah
  // Rekod Bayaran opens with Daripada, Tarikh Terima and Perkara from that surat
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tambah") !== "surat") return;
    window.history.replaceState(null, "", window.location.pathname);
    const prefill = takeBayaranPrefill();
    if (!prefill) return;
    setEditingBayaran(null);
    setDariSuratBil(prefill.bil);
    setFormData((prev) => ({
      ...prev,
      daripada: prefill.daripada,
      tarikhTerima: prefill.tarikhTerima,
      perkara: prefill.perkara,
      jenisBayaran: "KEMAJUAN",
      kategori: "",
      noKontrak: "",
      namaKontraktor: "",
    }));
    setShowAddDialog(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /dashboard/bayaran?buka=<id>[&dari=dashboard] opens that Rekod Bayaran (from
  // the Dashboard's kontrak detail). Coming from the Dashboard, closing the
  // detail (or the edit form opened from it) goes back there.
  const router = useRouter();
  const backToDashboard = useRef<"idle" | "opening" | "open">("idle");
  useEffect(() => {
    if (!bayaran.length) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("buka");
    if (!id) return;
    const found = bayaran.find((item) => item.id === id || String(item.ids) === id);
    window.history.replaceState(null, "", window.location.pathname);
    if (!found) {
      toast.error("Rekod bayaran tidak dijumpai");
      return;
    }
    // From the Dashboard or a surat's Reference Bayaran: closing goes back there
    if (params.get("dari") === "dashboard" || params.get("dari") === "surat") backToDashboard.current = "opening";
    setSelectedBayaran(found);
    setShowDetailDialog(true);
  }, [bayaran]);
  useEffect(() => {
    const open = showDetailDialog || showEditDialog;
    if (backToDashboard.current === "opening" && open) backToDashboard.current = "open";
    else if (backToDashboard.current === "open" && !open) {
      backToDashboard.current = "idle";
      router.back();
    }
  }, [showDetailDialog, showEditDialog, router]);

  // The detail dialog shows kerja / nilai kontrak from the form data; load it once
  useEffect(() => {
    if (showDetailDialog && !formDataLoaded.current) {
      fetchFormData();
    }
  }, [showDetailDialog]);

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

      // Validate required fields (a new record also needs Nilai, Bayaran Ke and,
      // when the Daripada has contracts, No Kontrak)
      const errors = bayaranFormErrors(formData, !editingBayaran, { kategori: getAvailableKategoris(), kontrak: getAvailableKontraks(), kontraktor: getPiecerateKontraktors(), semuaKontraktor: getSemuaKontraktors() });
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Sila isi semua medan yang diperlukan");
        return;
      }

      const { adaWangTahanan, ...fields } = formData;
      const payload = {
        ...fields,
        // Unticked or not KEMAJUAN: the record has no Wang Tahanan; WCP: no Bayaran Ke
        wangTahanan: adaWangTahanan && fields.jenisBayaran === KEMAJUAN ? fields.wangTahanan : "",
        bayaranKe: fields.jenisBayaran === WCP ? "" : fields.bayaranKe,
        // Akhir: KEMAJUAN only
        bayaranAkhir: fields.jenisBayaran === KEMAJUAN && fields.bayaranAkhir,
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
        // Create new record (from "Respon To Bayaran": the server then closes that surat)
        response = await fetch("/api/bayaran", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dariSuratBil ? { ...payload, dariSuratBil } : payload),
        });
      }

      if (response.ok) {
        const result = editingBayaran ? null : await response.clone().json().catch(() => null);
        toast.success(`Rekod bayaran berjaya ${editingBayaran ? "dikemaskini" : "disimpan"}!`, {
          description: result?.suratSelesai ? `Surat #${result.suratSelesai} kini SELESAI.` : undefined,
        });
        setDariSuratBil(null);
        if (result?.id) flashBayaran(result.id);

        // Reset form after successful save
        setFormData({
          daripada: "",
          tarikhTerima: "",
          jenisBayaran: "KEMAJUAN",
          perkara: "",
          nilaiBayaran: "",
          adaWangTahanan: false,
          wangTahanan: "",
          bayaranKe: "",
          bayaranAkhir: false,
          kategori: "",
          noKontrak: "",
          namaKontraktor: "",
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
        // The list re-filters itself when the new rows arrive (the bayaran effect).
        // No delayed filterBayaran() here: its closure holds the old rows and,
        // when the refetch is quick, put the stale list back.
        await fetchWithCache();
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.details?.[0]?.message ||
            errorData.error ||
            `Gagal ${editingBayaran ? "mengemaskini" : "menyimpan"} rekod bayaran`
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
      // An older record may have none; it stays empty until picked
      jenisBayaran: bayaran.jenisBayaran || "",
      perkara: bayaran.perkara,
      nilaiBayaran: bayaran.nilaiBayaran.replace(/[^\d.-]/g, ""), // Remove currency formatting
      adaWangTahanan: !!bayaran.wangTahanan,
      wangTahanan: (bayaran.wangTahanan || "").replace(/[^\d.-]/g, ""),
      bayaranKe: bayaran.bayaranKe,
      bayaranAkhir: !!bayaran.bayaranAkhir,
      kategori: bayaran.kategori,
      noKontrak: bayaran.noKontrak,
      namaKontraktor: bayaran.namaKontraktor || "",
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

      const message = `📌*REKOD BAYARAN #${sharingBayaran.ids ?? sharingBayaran.id}*
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
> *Kontrak* : ${sharingBayaran.namaKontraktor || "-"}
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

  // Nota Kaki: "#S123" opens surat 123, "#123" opens Rekod Bayaran 123 and
  // "#tag" lists the records with that tag (LinkedText; never rendered as HTML)
  const openBayaranById = (ids: string) => {
    const found = bayaran.find((item) => String(item.ids) === ids);
    if (!found) {
      toast.error(`Rekod bayaran #${ids} tidak dijumpai`);
      return;
    }
    setSelectedBayaran(found);
    setShowDetailDialog(true);
  };
  const renderNotaKakiWithLinks = (notaKaki: string) =>
    notaKaki ? <LinkedText text={notaKaki} onSurat={handleSuratLinkClick} onNumber={openBayaranById} /> : null;

  const [showSuratModal, setShowSuratModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<any>(null);
  const [loadingSurat, setLoadingSurat] = useState(false);

  // First load: the table is drawn as a skullet skeleton laid out from sample records
  const firstLoad = loading && bayaran.length === 0;

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
        <BayaranHeader
          user={user}
          showSearchInput={showSearchInput}
          setShowSearchInput={setShowSearchInput}
          searchQuery={searchQuery}
          handleSearchInputChange={handleSearchInputChange}
          clearSearch={() => {
            setSearchQuery("");
            setShowSearchInput(false);
          }}
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
        <CardContent className="px-2 pb-3 sm:px-6 sm:pb-6">
          <Skeleton loading={firstLoad} label="Memuatkan rekod bayaran">
          <BayaranTable
            displayedBayaran={firstLoad ? SAMPLE_BAYARAN : displayedBayaran}
            columnVisibility={columnVisibility}
            handleSort={handleSort}
            setSelectedBayaran={setSelectedBayaran}
            setShowDetailDialog={setShowDetailDialog}
            getStatusHex={(status) => (getStatusBadgeStyle(status) as { backgroundColor?: string }).backgroundColor}
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
            totalCount={firstLoad ? SAMPLE_BAYARAN.length : filteredBayaran.length}
            page={currentPage}
            pageSize={ITEMS_PER_PAGE}
            totalPages={firstLoad ? 1 : totalPages}
            onPageChange={handlePageChange}
            flashId={flashId}
          />
          </Skeleton>

        </CardContent>
      </Card>

      <DetailDialog
        showDetailDialog={showDetailDialog}
        setShowDetailDialog={setShowDetailDialog}
        selectedBayaran={selectedBayaran}
        kontrakInfo={selectedBayaran?.noKontrak ? kontrakInfoOf(selectedBayaran) : undefined}
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
        formErrors={formErrors}
        user={user}
        handleDaripadaChange={handleDaripadaChange}
        onKawasanAdded={handleKawasanAdded}
        handleKontrakChange={handleKontrakChange}
        handleKategoriChange={handleKategoriChange}
        handleJenisBayaranChange={handleJenisBayaranChange}
        getPiecerateKontraktors={getPiecerateKontraktors}
        getSemuaKontraktors={getSemuaKontraktors}
        getAvailableKontraks={getAvailableKontraks}
        getAvailableKategoris={getAvailableKategoris}
        handleCurrencyInputChange={handleCurrencyInputChange}
        formatCurrencyInput={formatCurrencyInput}
        shouldShowAdvancedFields={shouldShowAdvancedFields}
        shouldShowHandoverFields={shouldShowHandoverFields}
        shouldShowCompletionFields={shouldShowCompletionFields}
        penerimaData={formOptions.penerimaData}
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
          kontrakInfo={sharingBayaran.noKontrak ? kontrakInfoOf(sharingBayaran) : undefined}
          onImageGenerated={handleImageGenerated}
          onError={handleImageError}
        />
      )}

      {/* Surat Modal */}
      <Dialog open={showSuratModal} onOpenChange={setShowSuratModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
