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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { Role, Permission } from "@/types/rbac"
import { Loader2, Trash2, Edit, Shield } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type RoleManagerProps = {
  onRoleCreated?: () => void
  onRoleUpdated?: () => void
  onRoleDeleted?: () => void
}

export function RoleManager({ onRoleCreated, onRoleUpdated, onRoleDeleted }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: ""
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const [permResponse, groupedResponse] = await Promise.all([
        fetch("/api/permissions"),
        fetch("/api/permissions?grouped=true")
      ])
      const permData = await permResponse.json()
      const groupedData = await groupedResponse.json()
      setPermissions(permData)
      setPermissionsGrouped(groupedData)
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleCreateRole = () => {
    setEditingRole(null)
    setFormData({ name: "", display_name: "", description: "" })
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || ""
    })
    setIsDialogOpen(true)
  }

  const handleManagePermissions = async (role: Role) => {
    setSelectedRoleForPermissions(role)
    
    // Fetch role with permissions
    try {
      const response = await fetch(`/api/roles?id=${role.id}`)
      const roleData = await response.json()
      const permIds = roleData.permissions?.map((p: Permission) => p.id) || []
      setSelectedPermissionIds(permIds)
    } catch (error) {
      console.error("Error fetching role permissions:", error)
      setSelectedPermissionIds([])
    }
    
    setIsPermissionDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const url = editingRole ? "/api/roles" : "/api/roles"
      const method = editingRole ? "PATCH" : "POST"
      
      const body = editingRole
        ? { id: editingRole.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchRoles()
        setIsDialogOpen(false)
        if (editingRole) {
          onRoleUpdated?.()
        } else {
          onRoleCreated?.()
        }
      }
    } catch (error) {
      console.error("Error saving role:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleForPermissions) return
    
    setSubmitting(true)
    try {
      const response = await fetch("/api/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRoleForPermissions.id,
          permission_ids: selectedPermissionIds
        })
      })

      if (response.ok) {
        await fetchRoles()
        setIsPermissionDialogOpen(false)
        onRoleUpdated?.()
      }
    } catch (error) {
      console.error("Error saving permissions:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Adakah anda pasti mahu memadam role ini?")) return

    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchRoles()
        onRoleDeleted?.()
      }
    } catch (error) {
      console.error("Error deleting role:", error)
    }
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    )
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
        <h3 className="text-lg font-semibold">Pengurusan Role</h3>
        <Button onClick={handleCreateRole}>
          <Shield className="mr-2 h-4 w-4" />
          Tambah Role
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Role</TableHead>
            <TableHead>Penerangan</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.display_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {role.description || "-"}
              </TableCell>
              <TableCell>
                {role.is_system_role ? (
                  <Badge variant="secondary">System</Badge>
                ) : (
                  <Badge variant="outline">Custom</Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManagePermissions(role)}
                >
                  <Shield className="h-4 w-4" />
                </Button>
                {!role.is_system_role && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Tambah Role Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Kemaskini maklumat role"
                : "Cipta role baru untuk sistem"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Role (ID)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="contoh: custom_role"
                disabled={!!editingRole}
              />
            </div>
            <div>
              <Label htmlFor="display_name">Nama Paparan</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="contoh: Custom Role"
              />
            </div>
            <div>
              <Label htmlFor="description">Penerangan</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Penerangan role..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRole ? "Kemaskini" : "Cipta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Urus Permissions - {selectedRoleForPermissions?.display_name}
            </DialogTitle>
            <DialogDescription>
              Pilih permissions yang dibenarkan untuk role ini
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(permissionsGrouped).map(([resource, perms]) => (
                <div key={resource} className="space-y-2">
                  <h4 className="font-semibold capitalize">{resource}</h4>
                  <div className="space-y-2 pl-4">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.id}
                          checked={selectedPermissionIds.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <Label htmlFor={perm.id} className="cursor-pointer">
                          <span className="font-medium">{perm.display_name}</span>
                          {perm.description && (
                            <span className="text-sm text-muted-foreground ml-2">
                              - {perm.description}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePermissions} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
