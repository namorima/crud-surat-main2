'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Surat } from '@/types/surat'
import type { Bayaran } from '@/types/bayaran'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { FileText, Clock, CheckCircle, AlertCircle, Menu, DollarSign, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/dashboard/sidebar'

const CustomXAxisTick = ({ x, y, payload }) => {
  const value = payload.value
  if (!value) return null

  const words = String(value).split(' ')
  return (
    <g transform={`translate(${x},${y})`}>
      {words.map((word, i) => (
        <text key={i} x={0} y={i * 12} dy={12} textAnchor="middle" fill="#666" fontSize={10}>
          {word}
        </text>
      ))}
    </g>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [view, setView] = useState('surat')
  const [surat, setSurat] = useState<Surat[]>([])
  const [bayaran, setBayaran] = useState<Bayaran[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKawasan, setSelectedKawasan] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedKawasanForKategori, setSelectedKawasanForKategori] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (view === 'surat') {
          const response = await fetch('/api/surat')
          const data = await response.json()
          setSurat(data)
        } else {
          const response = await fetch('/api/bayaran')
          const data = await response.json()
          setBayaran(data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [view])

  // --- Surat Statistics ---
  const totalSurat = Array.isArray(surat) ? surat.length : 0
  const pendingSurat = Array.isArray(surat) ? surat.filter((item) => item.status === 'BELUM PROSES').length : 0
  const inProgressSurat = Array.isArray(surat) ? surat.filter((item) => item.status === 'DALAM TINDAKAN').length : 0
  const completedSurat = Array.isArray(surat) ? surat.filter((item) => item.status === 'SELESAI').length : 0

  const suratStatusData = [
    { name: 'BELUM PROSES', value: pendingSurat, color: '#f97316' },
    { name: 'DALAM TINDAKAN', value: inProgressSurat, color: '#3b82f6' },
    { name: 'SELESAI', value: completedSurat, color: '#22c55e' },
  ]

  const suratCategoryData = surat.reduce(
    (acc, item) => {
      const category = item.kategori || 'Tidak Dikategorikan'
      const existingCategory = acc.find((c) => c.name === category)
      if (existingCategory) {
        existingCategory.value += 1
      } else {
        acc.push({ name: category, value: 1 })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  const suratUnitData = surat.reduce(
    (acc, item) => {
      const unit = item.unit || 'Tidak Ditetapkan'
      const existingUnit = acc.find((u) => u.name === unit)
      if (existingUnit) {
        existingUnit.value += 1
      } else {
        acc.push({ name: unit, value: 1 })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  // --- Bayaran Statistics ---
  const totalBayaran = Array.isArray(bayaran) ? bayaran.length : 0
  const belumBayar = Array.isArray(bayaran) ? bayaran.filter((item) => item.statusBayaran === 'KEWANGAN').length : 0
  const selesaiBayaran = Array.isArray(bayaran) ? bayaran.filter((item) => item.statusBayaran === 'SELESAI').length : 0
  const holdKivBayaran = Array.isArray(bayaran) ? bayaran.filter((item) => item.statusBayaran === 'HOLD / KIV').length : 0

  const bayaranStatusData = [
    { name: 'Selesai Bayar', value: selesaiBayaran, color: '#22c55e' },
    { name: 'Belum Bayar', value: belumBayar, color: '#f97316' },
    { name: 'Hold / KIV', value: holdKivBayaran, color: '#eab308' },
  ]

  const bayaranKategoriData = [
    { name: 'KEWANGAN', value: belumBayar },
    { name: 'SELESAI', value: selesaiBayaran },
  ]

  const bayaranUnitData = bayaran.reduce(
    (acc, item) => {
      const kawasan = item.daripada || 'Tidak Diketahui'
      const nilai = parseFloat(item.nilaiBayaran.replace(/[^0-9.-]+/g, '')) || 0
      const existingKawasan = acc.find((k) => k.name === kawasan)
      if (existingKawasan) {
        existingKawasan.value += nilai
      } else {
        acc.push({ name: kawasan, value: nilai })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  const kontrakDataForSelectedKawasan = selectedKawasan
    ? bayaran
        .filter((item) => item.daripada === selectedKawasan)
        .reduce((acc, item) => {
          const kontrak = item.noKontrak || 'Tiada Kontrak'
          const nilai = parseFloat(item.nilaiBayaran.replace(/[^0-9.-]+/g, '')) || 0
          const existingKontrak = acc.find((k) => k.name === kontrak)
          if (existingKontrak) {
            existingKontrak.value += nilai
          } else {
            acc.push({ name: kontrak, value: nilai })
          }
          return acc
        }, [] as { name: string; value: number }[])
    : []

  const kawasanDataForSelectedStatus = selectedStatus
    ? bayaran
        .filter((item) => item.statusBayaran === selectedStatus)
        .reduce((acc, item) => {
          const kawasan = item.daripada || 'Tidak Diketahui'
          const nilai = parseFloat(item.nilaiBayaran.replace(/[^0-9.-]+/g, '')) || 0
          const existingKawasan = acc.find((k) => k.name === kawasan)
          if (existingKawasan) {
            existingKawasan.value += nilai
          } else {
            acc.push({ name: kawasan, value: nilai })
          }
          return acc
        }, [] as { name: string; value: number }[])
    : []

  const kontrakDataForKategoriDrilldown = (selectedStatus && selectedKawasanForKategori)
    ? bayaran
        .filter((item) => item.statusBayaran === selectedStatus && item.daripada === selectedKawasanForKategori)
        .reduce((acc, item) => {
          const kontrak = item.noKontrak || 'Tiada Kontrak'
          const nilai = parseFloat(item.nilaiBayaran.replace(/[^0-9.-]+/g, '')) || 0
          const existingKontrak = acc.find((k) => k.name === kontrak)
          if (existingKontrak) {
            existingKontrak.value += nilai
          } else {
            acc.push({ name: kontrak, value: nilai })
          }
          return acc
        }, [] as { name: string; value: number }[])
    : []

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
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
              <CardTitle className="text-base md:text-xl">Dashboard</CardTitle>
            </div>
            <Tabs value={view} onValueChange={(value) => { setView(value); setSelectedKawasan(null); setSelectedStatus(null); setSelectedKawasanForKategori(null); }} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="surat">Surat</TabsTrigger>
                <TabsTrigger value="bayaran">Bayaran</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'surat' && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Surat</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalSurat}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Belum Diproses</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingSurat}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Dalam Tindakan</CardTitle>
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inProgressSurat}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedSurat}</div>
                  </CardContent>
                </Card>
              </div>
              <Tabs defaultValue="status" className="mt-6">
                <TabsList>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="category">Kategori</TabsTrigger>
                  <TabsTrigger value="unit">Unit</TabsTrigger>
                </TabsList>
                <TabsContent value="status" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Status Surat</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={suratStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {suratStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="category" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Kategori Surat</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={suratCategoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="unit" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Unit</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={suratUnitData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
          {view === 'bayaran' && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Rekod Bayaran</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalBayaran}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Belum Bayar</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{belumBayar}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Selesai Bayaran</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selesaiBayaran}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Hold / KIV</CardTitle>
                    <PauseCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{holdKivBayaran}</div>
                  </CardContent>
                </Card>
              </div>
              <Tabs defaultValue="status" className="mt-6">
                <TabsList>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="kategori">Kategori</TabsTrigger>
                  <TabsTrigger value="unit">Unit</TabsTrigger>
                </TabsList>
                <TabsContent value="status" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Status Bayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bayaranStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {bayaranStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="kategori" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>
                          {!selectedStatus
                            ? 'Statistik Kategori Bayaran'
                            : selectedStatus && !selectedKawasanForKategori
                            ? `Pecahan Kawasan untuk Status: ${selectedStatus}`
                            : `Pecahan Kontrak untuk Kawasan: ${selectedKawasanForKategori}`}
                        </CardTitle>
                        {(selectedStatus || selectedKawasanForKategori) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedKawasanForKategori) {
                                setSelectedKawasanForKategori(null)
                              } else {
                                setSelectedStatus(null)
                              }
                            }}
                          >
                            Kembali
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={
                            !selectedStatus
                              ? bayaranKategoriData
                              : selectedStatus && !selectedKawasanForKategori
                              ? kawasanDataForSelectedStatus
                              : kontrakDataForKategoriDrilldown
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                          <YAxis />
                          <Tooltip formatter={(value) => selectedStatus ? `RM ${Number(value).toLocaleString()}` : value} />
                          <Bar dataKey="value" fill="#3b82f6" onClick={(data) => {
                              if (!selectedStatus) {
                                  setSelectedStatus(data.name)
                              } else if (selectedStatus && !selectedKawasanForKategori) {
                                  setSelectedKawasanForKategori(data.name)
                              }
                          }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="unit" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>
                          {selectedKawasan
                            ? `Jumlah Bayaran (RM) mengikut Kontrak untuk ${selectedKawasan}`
                            : 'Jumlah Bayaran (RM) mengikut Kawasan'}
                        </CardTitle>
                        {selectedKawasan && (
                          <Button variant="outline" onClick={() => setSelectedKawasan(null)}>
                            Kembali
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {selectedKawasan ? (
                          <BarChart data={kontrakDataForSelectedKawasan}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                            <YAxis />
                            <Tooltip formatter={(value) => `RM ${Number(value).toLocaleString()}`} />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        ) : (
                          <BarChart data={bayaranUnitData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                            <YAxis />
                            <Tooltip formatter={(value) => `RM ${Number(value).toLocaleString()}`} />
                            <Bar dataKey="value" fill="#22c55e" onClick={(data) => setSelectedKawasan(data.name)} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}