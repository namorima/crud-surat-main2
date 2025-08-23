"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Surat } from "@/types/surat"
import { ArrowLeft } from "lucide-react"

export default function SuratDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [surat, setSurat] = useState<Surat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSurat = async () => {
      try {
        const response = await fetch("/api/surat")
        const data = await response.json()
        const found = data.find((item: Surat) => item.id === params.id)

        if (found) {
          setSurat(found)
        }
      } catch (error) {
        console.error("Error fetching surat:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSurat()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!surat) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Surat tidak dijumpai</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/surat")}>
          Kembali ke Senarai Surat
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/surat")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-2xl font-bold">Maklumat Surat</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maklumat Asas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bil</p>
                <p>{surat.bil}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    surat.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : surat.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {surat.status}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Daripada/Kepada</p>
              <p>{surat.daripadaKepada}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tarikh</p>
              <p>{surat.tarikh}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Perkara</p>
              <p>{surat.perkara}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maklumat Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kategori</p>
              <p>{surat.kategori || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unit</p>
              <p>{surat.unit || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fail</p>
              <p>{surat.fail || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tindakan PIC</p>
              <p>{surat.tindakanPic || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tarikh Selesai</p>
              <p>{surat.tarikhSelesai || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{surat.nota || "Tiada nota"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
