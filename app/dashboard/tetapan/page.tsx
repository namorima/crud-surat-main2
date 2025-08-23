"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Menu } from "lucide-react"

export default function TetapanPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Tetapan disimpan",
        description: "Tetapan anda telah berjaya disimpan.",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
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
              <CardTitle className="text-base md:text-xl">Tetapan</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="umum">
            <TabsList>
              <TabsTrigger value="umum">Umum</TabsTrigger>
              <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
              <TabsTrigger value="integrasi">Integrasi</TabsTrigger>
            </TabsList>

            <TabsContent value="umum" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tetapan Umum</CardTitle>
                  <CardDescription>Konfigurasi tetapan umum untuk aplikasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">Nama Aplikasi</Label>
                    <Input id="app-name" defaultValue="CRUD Surat" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-id">ID Google Sheet</Label>
                    <Input id="sheet-id" placeholder="Masukkan ID Google Sheet" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-name">Nama Sheet</Label>
                    <Input id="sheet-name" defaultValue="SURAT" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Mod Gelap</Label>
                      <p className="text-sm text-muted-foreground">Aktifkan mod gelap untuk aplikasi.</p>
                    </div>
                    <Switch id="dark-mode" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Tetapan"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifikasi" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tetapan Notifikasi</CardTitle>
                  <CardDescription>Konfigurasi tetapan notifikasi untuk aplikasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notifikasi Email</Label>
                      <p className="text-sm text-muted-foreground">Terima notifikasi melalui email.</p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="status-updates">Kemaskini Status</Label>
                      <p className="text-sm text-muted-foreground">Terima notifikasi apabila status surat berubah.</p>
                    </div>
                    <Switch id="status-updates" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-letters">Surat Baru</Label>
                      <p className="text-sm text-muted-foreground">Terima notifikasi apabila surat baru ditambah.</p>
                    </div>
                    <Switch id="new-letters" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Tetapan"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="integrasi" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tetapan Integrasi</CardTitle>
                  <CardDescription>Konfigurasi integrasi dengan perkhidmatan luar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-api-key">Google API Key</Label>
                    <Input id="google-api-key" type="password" placeholder="Masukkan Google API Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-client-email">Google Client Email</Label>
                    <Input id="google-client-email" placeholder="Masukkan Google Client Email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-private-key">Google Private Key</Label>
                    <Input id="google-private-key" type="password" placeholder="Masukkan Google Private Key" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Tetapan"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
