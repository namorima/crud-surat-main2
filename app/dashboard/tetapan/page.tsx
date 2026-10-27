"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RiAddLine, RiArrowLeftLine, RiLoader4Line } from "@remixicon/react"
import { toast as sonnerToast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/base/buttons/button"
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs"
import { useToast } from "@/hooks/use-toast"
import { NavTrigger } from "@/components/dashboard/app-shell"
import { useAuth } from "@/lib/auth-provider"
import { hasPermission } from "@/lib/rbac"
import type { ShareLink, ShareLinkFilter } from "@/types/share-link"
import { ShareLinkForm } from "@/components/share/ShareLinkForm"
import { ShareLinkTable } from "@/components/share/ShareLinkTable"
import { FailManager } from "@/components/tetapan/FailManager"
import { LockerManager } from "@/components/tetapan/LockerManager"
import { KontrakManager } from "@/components/tetapan/KontrakManager"
import { KontraktorManager } from "@/components/tetapan/KontraktorManager"

export default function TetapanPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSurat = searchParams.get("from") === "surat"

  // Permission checks
  const canEditTetapan = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'tetapan', action: 'edit' })
    : (user?.role === "semua" || user?.role === "Super Admin")

  // Check if user can view all units
  // If user has permissions, check RBAC. Otherwise, check legacy role.
  const canViewAll = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'tetapan', action: 'manage_all_units' })
    : (user?.role === "semua" || user?.role === "Super Admin")

  // Get user's unit - use role as unit for non-admin users
  const userUnit = user?.role || ""

  const [tab, setTab] = useState<string>("setup-fail")

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

  // Fetch share links (only for users with permission)
  useEffect(() => {
    if (!canViewAll) {
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
    <div className="flex flex-col gap-3 pb-2 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <NavTrigger />
          <h1 className="truncate px-1 text-title-2-medium text-text-primary">Tetapan</h1>
        </div>
        {fromSurat && (
          <Button variant="secondary" size="small" leadingIcon={RiArrowLeftLine} onClick={() => router.back()}>
            Kembali
          </Button>
        )}
      </header>

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))} className="gap-3 sm:gap-4">
        {/* Scrolls sideways on narrow phones instead of wrapping */}
        <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
          <TabList aria-label="Tetapan" className="w-max min-w-full">
            <Tab id="setup-fail">Setup Fail</Tab>
            <Tab id="setup-locker">Setup Locker</Tab>
            {canViewAll && (
              <Tab id="pautan-kongsi" count={loadingShareLinks ? undefined : shareLinks.length}>
                Pautan Kongsi
              </Tab>
            )}
            {canViewAll && <Tab id="kontrak">Kontrak</Tab>}
            {canViewAll && <Tab id="kontraktor">Kontraktor</Tab>}
          </TabList>
        </div>

        <TabPanel id="setup-fail">
          <FailManager
            canEdit={Boolean(canEditTetapan)}
            canViewAll={Boolean(canViewAll)}
            userUnit={userUnit}
            onOpenLocker={() => setTab("setup-locker")}
          />
        </TabPanel>

        <TabPanel id="setup-locker">
          <LockerManager canEdit={Boolean(canEditTetapan)} canViewAll={Boolean(canViewAll)} userUnit={userUnit} />
        </TabPanel>

        {canViewAll && (
          <TabPanel id="pautan-kongsi">
            <Card>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="space-y-1">
                  <CardTitle>Pautan Kongsi</CardTitle>
                  <CardDescription>Pautan baca sahaja bagi rekod bayaran yang ditapis, untuk dikongsi kepada pihak luar.</CardDescription>
                </div>
                <Button size="small" leadingIcon={RiAddLine} onClick={() => setIsShareLinkDialogOpen(true)} className="shrink-0 self-start">
                  Cipta Pautan
                </Button>
              </CardHeader>
              <CardContent>
                {loadingShareLinks ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
                    <RiLoader4Line className="size-5 animate-spin" aria-hidden />
                    Memuatkan...
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
                <p className="text-body-regular text-text-secondary">Jumlah: {shareLinks.length} pautan</p>
              </CardFooter>
            </Card>

            <Dialog open={isShareLinkDialogOpen} onOpenChange={setIsShareLinkDialogOpen}>
              <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-[760px] sm:p-0">
                <DialogHeader className="space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5">
                  <DialogTitle className="pr-8 text-headline-semibold text-text-primary">Cipta Pautan Kongsi</DialogTitle>
                  <DialogDescription className="text-caption-1-regular text-text-secondary">
                    Pilih filter untuk data bayaran yang ingin dikongsi. Pautan disalin ke clipboard selepas dijana.
                  </DialogDescription>
                </DialogHeader>
                <ShareLinkForm
                  onSubmit={handleCreateShareLink}
                  isSubmitting={isSubmittingShareLink}
                  onCancel={() => setIsShareLinkDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </TabPanel>
        )}

        {canViewAll && (
          <TabPanel id="kontrak">
            <KontrakManager canEdit={Boolean(canEditTetapan)} />
          </TabPanel>
        )}

        {canViewAll && (
          <TabPanel id="kontraktor">
            <KontraktorManager canEdit={Boolean(canEditTetapan)} />
          </TabPanel>
        )}
      </Tabs>
    </div>
  )
}
