
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface BulkEditDialogProps {
  showBulkEditDialog: boolean
  setShowBulkEditDialog: (show: boolean) => void
  selectedRows: string[]
  setSelectedRows: (ids: string[]) => void
  formOptions: any
  fetchWithCache: () => void
  user: any
}

export function BulkEditDialog({
  showBulkEditDialog,
  setShowBulkEditDialog,
  selectedRows,
  setSelectedRows,
  formOptions,
  fetchWithCache,
  user,
}: BulkEditDialogProps) {
  const [newStatus, setNewStatus] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleBulkUpdate = async () => {
    if (!newStatus) {
      toast.error("Sila pilih status baru")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/bayaran/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedRows, newStatus, user: user?.name || "Unknown" }),
      })

      if (response.ok) {
        toast.success("Status rekod berjaya dikemaskini")
        setShowBulkEditDialog(false)
        setSelectedRows([])
        await fetchWithCache()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Gagal mengemaskini status rekod")
      }
    } catch (error) {
      console.error("Error updating bulk status:", error)
      toast.error("Ralat semasa mengemaskini status rekod")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kemaskini Status Pukal</DialogTitle>
        </DialogHeader>
        <div>
          <p>Anda akan mengemaskini status untuk {selectedRows.length} rekod.</p>
          <div className="mt-4">
            <Label htmlFor="newStatus">Status Baru</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status baru" />
              </SelectTrigger>
              <SelectContent>
                {formOptions.statusBayaranData.map((item: any) => (
                  <SelectItem key={item.status} value={item.status}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      {item.status}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkEditDialog(false)}>
            Batal
          </Button>
          <Button onClick={handleBulkUpdate} disabled={isUpdating}>
            {isUpdating ? "Mengemaskini..." : "Kemaskini"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
