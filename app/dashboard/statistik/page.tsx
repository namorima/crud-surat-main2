"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Surat } from "@/types/surat"
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
  LineChart,
  Line,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Menu } from "lucide-react"

export default function StatistikPage() {
  const [surat, setSurat] = useState<Surat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/surat")
        const data = await response.json()
        setSurat(data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Status data
  const statusData = [
    {
      name: "BELUM PROSES",
      value: Array.isArray(surat) ? surat.filter((item) => item.status === "BELUM PROSES").length : 0,
      color: "#f97316",
    },
    {
      name: "DALAM TINDAKAN",
      value: Array.isArray(surat) ? surat.filter((item) => item.status === "DALAM TINDAKAN").length : 0,
      color: "#3b82f6",
    },
    {
      name: "SELESAI",
      value: Array.isArray(surat) ? surat.filter((item) => item.status === "SELESAI").length : 0,
      color: "#22c55e",
    },
    {
      name: "HOLD / KIV",
      value: Array.isArray(surat) ? surat.filter((item) => item.status === "HOLD / KIV").length : 0,
      color: "#eab308",
    },
    {
      name: "BATAL",
      value: Array.isArray(surat) ? surat.filter((item) => item.status === "BATAL").length : 0,
      color: "#ef4444",
    },
  ]

  // Category data
  const categoryData = Array.isArray(surat)
    ? surat.reduce(
        (acc, item) => {
          const category = item.kategori || "Tidak Dikategorikan"
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
    : []

  // Unit data
  const unitData = Array.isArray(surat)
    ? surat.reduce(
        (acc, item) => {
          const unit = item.unit || "Tidak Ditetapkan"
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
    : []

  // Monthly data
  const monthlyData = Array.isArray(surat)
    ? surat.reduce(
        (acc, item) => {
          if (!item.tarikh) return acc

          const date = new Date(item.tarikh)
          const month = date.toLocaleString("ms-MY", { month: "long" })
          const existingMonth = acc.find((m) => m.name === month)

          if (existingMonth) {
            existingMonth.value += 1
          } else {
            acc.push({ name: month, value: 1 })
          }

          return acc
        },
        [] as { name: string; value: number }[],
      )
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
              <CardTitle className="text-base md:text-xl">Statistik</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="category">Kategori</TabsTrigger>
              <TabsTrigger value="unit">Unit</TabsTrigger>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Status Surat</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
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
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
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
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitData}>
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

            <TabsContent value="monthly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Bulanan</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
