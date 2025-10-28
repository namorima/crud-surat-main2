"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import { Copy, MoreHorizontal, Trash2, Loader2, ExternalLink } from "lucide-react"
import type { ShareLink } from "@/types/share-link"
import { FilterSummaryBadges } from "./FilterSummaryBadges"

interface ShareLinkTableProps {
  shareLinks: ShareLink[]
  onDelete: (linkId: string) => Promise<void>
  baseUrl: string
}

export function ShareLinkTable({ shareLinks, onDelete, baseUrl }: ShareLinkTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<ShareLink | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyToClipboard = async (linkId: string) => {
    const url = `${baseUrl}/share/${linkId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link berjaya disalin!")
    } catch {
      toast.error("Gagal menyalin link")
    }
  }

  const openInNewTab = (linkId: string) => {
    const url = `${baseUrl}/share/${linkId}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const handleDeleteClick = (link: ShareLink) => {
    setSelectedLink(link)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLink) return

    setIsDeleting(true)
    try {
      await onDelete(selectedLink.linkId)
      toast.success("Pautan berjaya dipadam")
      setDeleteDialogOpen(false)
      setSelectedLink(null)
    } catch (error) {
      toast.error("Gagal memadam pautan")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (shareLinks.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Tiada pautan dikongsi</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Link ID</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Filter</TableHead>
              <TableHead>Dicipta Oleh</TableHead>
              <TableHead>Tarikh Cipta</TableHead>
              <TableHead>Tarikh Luput</TableHead>
              <TableHead className="w-[80px]">Akses</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[80px]">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shareLinks.map((link) => {
              const expired = isExpired(link.expiresAt)
              return (
                <TableRow key={link.linkId}>
                  <TableCell className="font-mono text-xs">{link.linkId}</TableCell>
                  <TableCell>
                    {link.description || <span className="text-muted-foreground italic">Tiada</span>}
                  </TableCell>
                  <TableCell>
                    <FilterSummaryBadges filterJson={link.filterJson} />
                  </TableCell>
                  <TableCell>{link.createdBy}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(link.createdAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {link.expiresAt ? formatDate(link.expiresAt) : <span className="italic">Tiada</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{link.accessCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expired ? "destructive" : "default"} className={expired ? "" : "bg-green-600"}>
                      {expired ? "Tamat" : "Aktif"}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => copyToClipboard(link.linkId)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Salin Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openInNewTab(link.linkId)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Buka Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(link)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Padam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adakah anda pasti?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh dibatalkan. Pautan ini akan dipadam secara kekal dan tidak boleh diakses lagi.
              {selectedLink && (
                <div className="mt-2">
                  <p className="font-medium">Link ID: {selectedLink.linkId}</p>
                  {selectedLink.description && <p className="text-sm">Keterangan: {selectedLink.description}</p>}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
    </>
  )
}
