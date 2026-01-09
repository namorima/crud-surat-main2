"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UnitPic } from "@/types/unit-pic"
import { Loader2, Trash2, Edit, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

export function UnitPicManager() {
  const { toast } = useToast()
  const [unitPics, setUnitPics] = useState<UnitPic[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnitPic, setEditingUnitPic] = useState<UnitPic | null>(null)
  const [formData, setFormData] = useState({
    unit: "",
    pic: ""
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUnitPics()
  }, [])

  const fetchUnitPics = async () => {
    try {
      const response = await fetch("/api/unit-pic?format=raw")
      const data = await response.json()
      setUnitPics(data)
    } catch (error) {
      console.error("Error fetching unit-pics:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data Unit PIC",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUnitPic(null)
    setFormData({ unit: "", pic: "" })
    setIsDialogOpen(true)
  }

  const handleEdit = (unitPic: UnitPic) => {
    setEditingUnitPic(unitPic)
    setFormData({
      unit: unitPic.unit,
      pic: unitPic.pic
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const url = "/api/unit-pic"
      const method = editingUnitPic ? "PATCH" : "POST"
      
      const body = editingUnitPic
        ? { id: editingUnitPic.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchUnitPics()
        setIsDialogOpen(false)
        toast({
          title: "Berjaya",
          description: editingUnitPic ? "Unit PIC berjaya dikemaskini" : "Unit PIC berjaya ditambah"
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving unit-pic:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan Unit PIC",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Adakah anda pasti mahu memadam Unit PIC ini?")) return

    try {
      const response = await fetch(`/api/unit-pic?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchUnitPics()
        toast({
          title: "Berjaya",
          description: "Unit PIC berjaya dipadam"
        })
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting unit-pic:", error)
      toast({
        title: "Error",
        description: "Gagal memadam Unit PIC",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pengurusan Unit PIC</h3>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah PIC
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>PIC (Person In Charge)</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unitPics.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Tiada data Unit PIC
              </TableCell>
            </TableRow>
          ) : (
            unitPics.map((unitPic) => (
              <TableRow key={unitPic.id}>
                <TableCell className="font-medium">{unitPic.unit}</TableCell>
                <TableCell>{unitPic.pic}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(unitPic)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(unitPic.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnitPic ? "Edit Unit PIC" : "Tambah Unit PIC Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingUnitPic
                ? "Kemaskini maklumat Unit PIC"
                : "Tambah PIC baru untuk unit"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit">Unit <span className="text-red-500">*</span></Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Contoh: PENTADBIRAN"
              />
            </div>
            <div>
              <Label htmlFor="pic">PIC (Person In Charge) <span className="text-red-500">*</span></Label>
              <Input
                id="pic"
                value={formData.pic}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                placeholder="Contoh: Ahmad bin Ali"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.unit || !formData.pic}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUnitPic ? "Kemaskini" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
