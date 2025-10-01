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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
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
  const [view, setView] = useState('bayaran')
  const [surat, setSurat] = useState<Surat[]>([])
  const [bayaran, setBayaran] = useState<Bayaran[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKawasan, setSelectedKawasan] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedKawasanForKategori, setSelectedKawasanForKategori] = useState<string | null>(null)
  const [selectedStatusForStatus, setSelectedStatusForStatus] = useState<string | null>(null)
  const [selectedKawasanForStatus, setSelectedKawasanForStatus] = useState<string | null>(null)

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
    { name: 'selesai', label: 'Selesai Bayar', value: selesaiBayaran, fill: 'var(--color-selesai)' },
    { name: 'belum', label: 'Belum Bayar', value: belumBayar, fill: 'var(--color-belum)' },
    { name: 'hold', label: 'Hold / KIV', value: holdKivBayaran, fill: 'var(--color-hold)' },
  ]

  const bayaranStatusConfig = {
    value: {
      label: "Jumlah",
    },
    selesai: {
      label: "Selesai Bayar",
      color: "#22c55e",
    },
    belum: {
      label: "Belum Bayar", 
      color: "#f97316",
    },
    hold: {
      label: "Hold / KIV",
      color: "#eab308",
    },
  } satisfies ChartConfig

  // Group bayaran by status with kawasan breakdown for kategori tab
  const bayaranByStatusWithKawasan = bayaran.reduce((acc, item) => {
    const status = item.statusBayaran || 'Tidak Diketahui'
    const kawasan = item.daripada || 'Tidak Diketahui'
    
    if (!acc[status]) {
      acc[status] = { status, kawasanBreakdown: {} }
    }
    
    if (!acc[status].kawasanBreakdown[kawasan]) {
      acc[status].kawasanBreakdown[kawasan] = 0
    }
    
    acc[status].kawasanBreakdown[kawasan] += 1
    
    return acc
  }, {} as Record<string, { status: string; kawasanBreakdown: Record<string, number> }>)

  // Convert to chart data format for status with stacked kawasan
  const bayaranKategoriData = Object.entries(bayaranByStatusWithKawasan).map(([status, data]) => {
    const result: any = { status }
    Object.entries(data.kawasanBreakdown).forEach(([kawasan, count]) => {
      result[kawasan] = count
    })
    return result
  })

  // Get unique kawasan names for config
  const uniqueKawasan = [...new Set(bayaran.map(item => item.daripada || 'Tidak Diketahui'))].sort()
  
  // Enhanced color palette with more distinct colors
  const kawasanColors = [
    '#22c55e', // green
    '#f97316', // orange  
    '#eab308', // yellow
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f472b6', // rose
    '#a855f7', // violet
    '#0ea5e9', // sky
    '#65a30d', // green-600
    '#dc2626', // red-600
  ]

  const bayaranKategoriConfig = uniqueKawasan.reduce((config, kawasan, index) => {
    config[kawasan] = {
      label: kawasan,
      color: kawasanColors[index % kawasanColors.length],
    }
    return config
  }, {} as ChartConfig)

  // Data for kawasan drill-down with kontrak stacking
  const kawasanDrilldownData = selectedStatus 
    ? bayaran
        .filter(item => item.statusBayaran === selectedStatus)
        .reduce((acc, item) => {
          const kawasan = item.daripada || 'Tidak Diketahui'
          const kontrak = item.noKontrak || 'Tiada Kontrak'
          
          if (!acc[kawasan]) {
            acc[kawasan] = { kawasan, kontrakBreakdown: {} }
          }
          
          if (!acc[kawasan].kontrakBreakdown[kontrak]) {
            acc[kawasan].kontrakBreakdown[kontrak] = 0
          }
          
          acc[kawasan].kontrakBreakdown[kontrak] += 1
          
          return acc
        }, {} as Record<string, { kawasan: string; kontrakBreakdown: Record<string, number> }>)
    : {}

  // Convert kawasan drill-down to chart format
  const kawasanChartData = Object.entries(kawasanDrilldownData).map(([kawasan, data]) => {
    const result: any = { kawasan }
    Object.entries(data.kontrakBreakdown).forEach(([kontrak, count]) => {
      result[kontrak] = count
    })
    return result
  })

  // Get unique kontrak for colors
  const uniqueKontrak = selectedStatus 
    ? [...new Set(bayaran.filter(item => item.statusBayaran === selectedStatus).map(item => item.noKontrak || 'Tiada Kontrak'))].sort()
    : []

  // Different color palette for kontrak to distinguish from kawasan
  const kontrakColors = [
    '#1f2937', // gray-800
    '#7c3aed', // violet-600
    '#059669', // emerald-600
    '#dc2626', // red-600
    '#2563eb', // blue-600
    '#ea580c', // orange-600
    '#7c2d12', // orange-900
    '#166534', // green-800
    '#1e1b4b', // indigo-900
    '#7e22ce', // purple-600
    '#0f766e', // teal-700
    '#be123c', // rose-700
    '#374151', // gray-700
    '#4338ca', // indigo-600
    '#b91c1c', // red-700
    '#0369a1', // sky-700
    '#16a34a', // green-600
    '#c2410c', // orange-700
  ]

  const kontrakConfig = uniqueKontrak.reduce((config, kontrak, index) => {
    config[kontrak] = {
      label: kontrak,
      color: kontrakColors[index % kontrakColors.length],
    }
    return config
  }, {} as ChartConfig)

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

  // Data for Status tab drilldown
  const kawasanDataForSelectedStatusTab = selectedStatusForStatus
    ? bayaran
        .filter((item) => item.statusBayaran === selectedStatusForStatus)
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

  const kontrakDataForStatusDrilldown = (selectedStatusForStatus && selectedKawasanForStatus)
    ? bayaran
        .filter((item) => item.statusBayaran === selectedStatusForStatus && item.daripada === selectedKawasanForStatus)
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
            <Tabs value={view} onValueChange={(value) => { setView(value); setSelectedKawasan(null); setSelectedStatus(null); setSelectedKawasanForKategori(null); setSelectedStatusForStatus(null); setSelectedKawasanForStatus(null); }} className="w-[200px]">
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
                      <div className="flex justify-between items-center">
                        <CardTitle>
                          {!selectedStatusForStatus
                            ? 'Statistik Status Bayaran'
                            : selectedStatusForStatus && !selectedKawasanForStatus
                            ? `Pecahan Kawasan untuk Status: ${selectedStatusForStatus}`
                            : `Pecahan Kontrak untuk Kawasan: ${selectedKawasanForStatus}`}
                        </CardTitle>
                        {(selectedStatusForStatus || selectedKawasanForStatus) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedKawasanForStatus) {
                                setSelectedKawasanForStatus(null)
                              } else {
                                setSelectedStatusForStatus(null)
                              }
                            }}
                          >
                            Kembali
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                      {!selectedStatusForStatus ? (
                        <ChartContainer
                          config={bayaranStatusConfig}
                          className="mx-auto aspect-square max-h-[250px]"
                        >
                          <PieChart>
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                              data={bayaranStatusData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              onClick={(entry) => {
                                // Map display names to actual status values
                                const statusMapping = {
                                  'selesai': 'SELESAI',
                                  'belum': 'KEWANGAN',
                                  'hold': 'HOLD / KIV'
                                }
                                setSelectedStatusForStatus(statusMapping[entry.name] || entry.name)
                              }}
                            />
                          </PieChart>
                        </ChartContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={
                              selectedStatusForStatus && !selectedKawasanForStatus
                                ? kawasanDataForSelectedStatusTab
                                : kontrakDataForStatusDrilldown
                            }
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} />
                            <YAxis />
                            <Tooltip formatter={(value) => `RM ${Number(value).toLocaleString()}`} />
                            <Bar dataKey="value" fill="#3b82f6" onClick={(data) => {
                                if (selectedStatusForStatus && !selectedKawasanForStatus) {
                                    setSelectedKawasanForStatus(data.name)
                                }
                            }} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="kategori" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm md:text-base">
                          {!selectedStatus
                            ? 'Statistik Status Bayaran (Kawasan)'
                            : `Pecahan Kawasan untuk Status: ${selectedStatus}`}
                        </CardTitle>
                        {selectedStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStatus(null)}
                          >
                            Kembali
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-2 md:px-6">
                      <div className="space-y-4">
                        <ChartContainer
                          config={selectedStatus ? kontrakConfig : bayaranKategoriConfig}
                          className="h-[300px] md:h-[400px] w-full"
                        >
                          <BarChart
                            accessibilityLayer
                            data={selectedStatus ? kawasanChartData : bayaranKategoriData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                          >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                              dataKey={selectedStatus ? "kawasan" : "status"}
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={0}
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                            />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                            />
                            <ChartLegend
                              content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />}
                            />
                            {selectedStatus ? (
                              // Show kontrak breakdown for selected status
                              uniqueKontrak.map((kontrak, index) => (
                                <Bar
                                  key={kontrak}
                                  dataKey={kontrak}
                                  stackId="a"
                                  fill={kontrakColors[index % kontrakColors.length]}
                                  radius={index === 0 ? [0, 0, 4, 4] : index === uniqueKontrak.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                  animationBegin={index * 100}
                                  animationDuration={1000}
                                  animationEasing="ease-out"
                                />
                              ))
                            ) : (
                              // Show kawasan breakdown by status
                              uniqueKawasan.map((kawasan, index) => (
                                <Bar
                                  key={kawasan}
                                  dataKey={kawasan}
                                  stackId="a"
                                  fill={kawasanColors[index % kawasanColors.length]}
                                  radius={index === 0 ? [0, 0, 4, 4] : index === uniqueKawasan.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                  animationBegin={index * 100}
                                  animationDuration={1000}
                                  animationEasing="ease-out"
                                  onClick={(data) => {
                                    if (!selectedStatus) {
                                      setSelectedStatus(data.status)
                                    }
                                  }}
                                />
                              ))
                            )}
                          </BarChart>
                        </ChartContainer>
                        {/* Mobile hint */}
                        <p className="text-xs text-muted-foreground text-center md:hidden">
                          Tip: Pusingkan skrin untuk paparan yang lebih baik
                        </p>
                      </div>
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