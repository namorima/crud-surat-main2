"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Bayaran } from "@/types/bayaran"

interface PublicBayaranTableProps {
  bayaran: Bayaran[]
}

const KATEGORI_COLORS: Record<string, string> = {
  "PERTANIAN AM": "bg-[#d4edbc] text-[#2c5f13] border-[#a9d97c]",
  "ANGKUT BTS": "bg-[#ffc8aa] text-[#7d2c00] border-[#ff9966]",
  PIECERATE: "bg-[#bfe1f6] text-[#0a558c] border-[#7cc4e8]",
  KIMIA: "bg-[#ffe5a0] text-[#7a4f01] border-[#ffd24c]",
  KONTRAK: "bg-[#e6cff2] text-[#5b1e7b] border-[#c884e4]",
}

const formatCurrency = (value: string) => {
  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(num)
}

const formatDate = (dateString: string) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PublicBayaranTable({ bayaran }: PublicBayaranTableProps) {
  if (bayaran.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Tiada data bayaran</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Daripada</TableHead>
              <TableHead>Tarikh Terima</TableHead>
              <TableHead>Perkara</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>No Kontrak</TableHead>
              <TableHead>Nama Kontraktor</TableHead>
              <TableHead>Nilai Bayaran</TableHead>
              <TableHead>Status Bayaran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bayaran.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">#{item.id}</TableCell>
                <TableCell>{item.daripada}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(item.tarikhTerima)}</TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">{item.perkara}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${KATEGORI_COLORS[item.kategori] || ""}`}
                  >
                    {item.kategori}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.noKontrak || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{item.namaKontraktor || "-"}</TableCell>
                <TableCell className="font-medium">{formatCurrency(item.nilaiBayaran)}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.statusBayaran === "SELESAI" ? "default" : "secondary"}
                    className={`text-xs ${item.statusBayaran === "SELESAI" ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
                  >
                    {item.statusBayaran}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {bayaran.map((item) => (
          <Card key={item.id} className="p-3">
            {/* Top Row: ID + Daripada + Status */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <Badge variant="outline" className="w-fit mb-1">
                  #{item.id}
                </Badge>
                <span className="font-medium">{item.daripada}</span>
                <span className="text-xs text-muted-foreground">{formatDate(item.tarikhTerima)}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={item.statusBayaran === "SELESAI" ? "default" : "secondary"}
                  className={`text-xs ${item.statusBayaran === "SELESAI" ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
                >
                  {item.statusBayaran}
                </Badge>
                {item.noKontrak && (
                  <Badge variant="outline" className="text-xs">
                    {item.noKontrak}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm line-clamp-2">{item.perkara}</p>

              <div className="flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${KATEGORI_COLORS[item.kategori] || ""}`}
                >
                  {item.kategori}
                </Badge>
                {item.namaKontraktor && (
                  <Badge variant="secondary" className="text-xs">
                    {item.namaKontraktor}
                  </Badge>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">Nilai Bayaran</span>
                <span className="font-medium">{formatCurrency(item.nilaiBayaran)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
