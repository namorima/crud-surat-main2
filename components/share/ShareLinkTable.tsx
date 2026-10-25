"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { RiDeleteBinLine, RiExternalLinkLine, RiFileCopyLine, RiLoader4Line } from "@remixicon/react"
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
import { Chip } from "@/components/base/badges/chip"
import { RowActions } from "@/components/dashboard/row-actions"
import type { ShareLink } from "@/types/share-link"
import { FilterSummaryBadges } from "./FilterSummaryBadges"

interface ShareLinkTableProps {
  shareLinks: ShareLink[]
  onDelete: (linkId: string) => Promise<void>
  baseUrl: string
}

const isExpired = (expiresAt?: string) => Boolean(expiresAt) && new Date(expiresAt!) < new Date()

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

function StatusChip({ expired }: { expired: boolean }) {
  return (
    <Chip variant="caption" color={expired ? "rose" : "lime"}>
      {expired ? "Tamat Tempoh" : "Aktif"}
    </Chip>
  )
}

export function ShareLinkTable({ shareLinks, onDelete, baseUrl }: ShareLinkTableProps) {
  const [selectedLink, setSelectedLink] = useState<ShareLink | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyToClipboard = async (linkId: string) => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}/share/${linkId}`)
      toast.success("Link berjaya disalin!")
    } catch {
      toast.error("Gagal menyalin link")
    }
  }

  const openInNewTab = (linkId: string) => {
    window.open(`${baseUrl}/share/${linkId}`, "_blank", "noopener,noreferrer")
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedLink) return

    setIsDeleting(true)
    try {
      await onDelete(selectedLink.linkId)
      toast.success("Pautan berjaya dipadam")
      setSelectedLink(null)
    } catch {
      toast.error("Gagal memadam pautan")
    } finally {
      setIsDeleting(false)
    }
  }

  const actionsFor = (link: ShareLink) => [
    { label: "Salin Link", icon: RiFileCopyLine, onSelect: () => copyToClipboard(link.linkId) },
    { label: "Buka Link", icon: RiExternalLinkLine, onSelect: () => openInNewTab(link.linkId) },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setSelectedLink(link), danger: true },
  ]

  if (shareLinks.length === 0) {
    return <p className="py-10 text-center text-body-regular text-text-secondary">Tiada pautan dikongsi</p>
  }

  return (
    <>
      {/* iPad landscape and desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-border-table lg:block">
        <div className="relative max-h-[60dvh] overflow-auto">
          <table className="bui-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Pautan</th>
                <th>Filter</th>
                <th>Dicipta</th>
                <th>Luput</th>
                <th className="text-end!">Akses</th>
                <th>Status</th>
                <th className="w-[56px]">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shareLinks.map((link) => {
                const expired = isExpired(link.expiresAt)
                return (
                  <tr key={link.linkId} className="hover:bg-background-secondary-default">
                    <td className="max-w-[16rem]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-body-semibold text-text-primary">
                          {link.description || <span className="text-text-tertiary">Tiada keterangan</span>}
                        </span>
                        <span className="font-mono text-caption-1-regular text-text-tertiary">{link.linkId}</span>
                      </div>
                    </td>
                    <td className="max-w-[22rem]">
                      <FilterSummaryBadges filterJson={link.filterJson} />
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="whitespace-nowrap text-caption-1-regular text-text-secondary tabular-nums">{formatDate(link.createdAt)}</span>
                        <span className="text-caption-1-regular text-text-tertiary">{link.createdBy}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-caption-1-regular text-text-secondary tabular-nums">
                      {link.expiresAt ? formatDate(link.expiresAt) : <span className="text-text-tertiary">Tiada</span>}
                    </td>
                    <td className="text-end tabular-nums">{link.accessCount}</td>
                    <td>
                      <StatusChip expired={expired} />
                    </td>
                    <td className="text-end">
                      <RowActions actions={actionsFor(link)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones and iPad portrait */}
      <ul className="grid gap-2 md:grid-cols-2 lg:hidden">
        {shareLinks.map((link) => {
          const expired = isExpired(link.expiresAt)
          return (
            <li key={link.linkId} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 text-body-semibold text-text-primary">
                    {link.description || <span className="text-text-tertiary">Tiada keterangan</span>}
                  </span>
                  <StatusChip expired={expired} />
                </div>
                <FilterSummaryBadges filterJson={link.filterJson} />
                <span className="text-caption-1-regular text-text-tertiary tabular-nums">
                  {[
                    link.createdBy,
                    formatDate(link.createdAt),
                    link.expiresAt && `Luput ${formatDate(link.expiresAt)}`,
                    `${link.accessCount} akses`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="truncate font-mono text-caption-2-regular text-text-tertiary">{link.linkId}</span>
              </div>
              <RowActions className="-me-1.5 size-7" actions={actionsFor(link)} />
            </li>
          )
        })}
      </ul>

      <AlertDialog open={Boolean(selectedLink)} onOpenChange={(open) => !open && !isDeleting && setSelectedLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam pautan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink?.description ? `${selectedLink.description} (${selectedLink.linkId}). ` : `Pautan ${selectedLink?.linkId}. `}
              Pautan akan dipadam secara kekal dan tidak boleh diakses lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-button-danger">
              {isDeleting && <RiLoader4Line className="animate-spin" />}
              {isDeleting ? "Memadam..." : "Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
