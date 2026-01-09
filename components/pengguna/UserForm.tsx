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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User } from "@/types/user"
import type { Role } from "@/types/rbac"
import { Loader2 } from "lucide-react"

type UserFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess?: () => void
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role_id: "",
    type: ""
  })

  useEffect(() => {
    // Fetch roles when dialog opens
    if (open) {
      fetchRoles()
    }
  }, [open])

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.id,
        password: "", // Don't populate password for security
        name: user.name,
        role_id: user.role_id || "",
        type: user.type || ""
      })
    } else {
      setFormData({
        username: "",
        password: "",
        name: "",
        role_id: "",
        type: ""
      })
    }
  }, [user])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/auth?id=${user.id}` : "/api/auth"
      const method = user ? "PATCH" : "POST"

      const body: any = {
        username: formData.username,
        name: formData.name,
        role_id: formData.role_id,
        type: formData.type || null
      }

      // Only include password if it's provided (for new users or password change)
      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to save user"}`)
      }
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Failed to save user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Kemaskini maklumat pengguna"
              : "Cipta pengguna baru untuk sistem"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username / ID</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={!!user}
              />
            </div>
            <div>
              <Label htmlFor="password">
                Password {user && "(Biarkan kosong jika tidak mahu ubah)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
              />
            </div>
            <div>
              <Label htmlFor="name">Nama Penuh</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="role_id">Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                required
              >
                <SelectTrigger id="role_id">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type (Optional)</Label>
              <Select
                value={formData.type || "none"}
                onValueChange={(value) => setFormData({ ...formData, type: value === "none" ? "" : value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="VIEW">VIEW</SelectItem>
                  <SelectItem value="PENERIMA">PENERIMA</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Type VIEW/PENERIMA akan menghadkan akses kepada halaman tertentu
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Kemaskini" : "Cipta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
