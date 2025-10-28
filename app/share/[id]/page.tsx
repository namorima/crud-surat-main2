"use client"

import { use, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileText } from "lucide-react"
import type { Bayaran } from "@/types/bayaran"
import type { ShareLink, ShareLinkFilter } from "@/types/share-link"
import { PublicBayaranTable } from "@/components/share/PublicBayaranTable"
import { FilterSummaryBadges } from "@/components/share/FilterSummaryBadges"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SharePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [bayaran, setBayaran] = useState<Bayaran[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch share link details
        const linkResponse = await fetch(`/api/share-link/${resolvedParams.id}`)

        if (!linkResponse.ok) {
          if (linkResponse.status === 404) {
            throw new Error("Pautan tidak dijumpai atau tidak sah")
          } else if (linkResponse.status === 410) {
            throw new Error("Pautan telah tamat tempoh")
          }
          throw new Error("Gagal memuatkan pautan")
        }

        const linkData: ShareLink = await linkResponse.json()
        setShareLink(linkData)

        // Increment access count
        fetch(`/api/share-link/${resolvedParams.id}/increment`, {
          method: "POST",
        }).catch(() => {
          // Silently fail - access count is not critical
        })

        // Fetch all bayaran data
        const bayaranResponse = await fetch("/api/bayaran")
        if (!bayaranResponse.ok) {
          throw new Error("Gagal memuatkan data bayaran")
        }

        const allBayaran: Bayaran[] = await bayaranResponse.json()

        // Apply filters
        const filters: ShareLinkFilter = JSON.parse(linkData.filterJson)
        let filtered = [...allBayaran]

        if (filters.kategori && filters.kategori.length > 0) {
          filtered = filtered.filter((item) => filters.kategori!.includes(item.kategori))
        }

        if (filters.noKontrak && filters.noKontrak.length > 0) {
          filtered = filtered.filter((item) => filters.noKontrak!.includes(item.noKontrak))
        }

        if (filters.kawasan && filters.kawasan.length > 0) {
          filtered = filtered.filter((item) => filters.kawasan!.includes(item.daripada))
        }

        if (filters.statusBayaran && filters.statusBayaran.length > 0) {
          filtered = filtered.filter((item) => filters.statusBayaran!.includes(item.statusBayaran))
        }

        if (filters.namaKontraktor && filters.namaKontraktor.length > 0) {
          filtered = filtered.filter((item) => filters.namaKontraktor!.includes(item.namaKontraktor))
        }

        if (filters.dateRange) {
          if (filters.dateRange.from) {
            const fromDate = new Date(filters.dateRange.from)
            filtered = filtered.filter((item) => {
              const itemDate = new Date(item.tarikhTerima)
              return itemDate >= fromDate
            })
          }
          if (filters.dateRange.to) {
            const toDate = new Date(filters.dateRange.to)
            filtered = filtered.filter((item) => {
              const itemDate = new Date(item.tarikhTerima)
              return itemDate <= toDate
            })
          }
        }

        setBayaran(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ralat tidak diketahui")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Memuatkan data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ralat</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl md:text-2xl">Rekod Bayaran</CardTitle>
                <CardDescription>Sistem Pengurusan Surat dan Bayaran</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {shareLink?.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Keterangan:</p>
                <p className="text-sm">{shareLink.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Filter yang Digunakan:</p>
              <FilterSummaryBadges filterJson={shareLink?.filterJson || "{}"} />
            </div>

            {shareLink?.expiresAt && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Pautan ini sah hingga:{" "}
                  <span className="font-medium">
                    {new Date(shareLink.expiresAt).toLocaleDateString("ms-MY", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Senarai Rekod Bayaran</CardTitle>
            <CardDescription>
              Jumlah rekod: <span className="font-medium">{bayaran.length}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicBayaranTable bayaran={bayaran} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Dikuasakan oleh Sistem Pengurusan Surat dan Bayaran</p>
          <p className="text-xs mt-1">Data yang dipaparkan adalah berdasarkan filter yang ditetapkan</p>
        </div>
      </div>
    </div>
  )
}
