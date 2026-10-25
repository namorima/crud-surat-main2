"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { RiDeleteBinLine, RiEditLine, RiLoader4Line, RiShieldKeyholeLine, RiShieldLine } from "@remixicon/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { RowActions } from "@/components/dashboard/row-actions"
import {
  FormField,
  dialogBodyClass,
  dialogFooterClass,
  dialogFrameClass,
  dialogHeaderClass,
} from "@/components/dashboard/form-field"
import type { Role, Permission } from "@/types/rbac"

type RoleManagerProps = {
  onRoleCreated?: () => void
  onRoleUpdated?: () => void
  onRoleDeleted?: () => void
}

function RoleTypeChip({ system }: { system?: boolean }) {
  return (
    <Chip variant="caption" color={system ? "blue" : "soft"}>
      {system ? "Sistem" : "Custom"}
    </Chip>
  )
}

function SavingLabel({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return busy ? (
    <span className="inline-flex items-center gap-1.5">
      <RiLoader4Line className="size-4 animate-spin" aria-hidden />
      Menyimpan...
    </span>
  ) : (
    <>{children}</>
  )
}

export function RoleManager({ onRoleCreated, onRoleUpdated, onRoleDeleted }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
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
      toast.error("Gagal memuatkan senarai role")
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions?grouped=true")
      setPermissionsGrouped(await response.json())
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
    setSelectedPermissionIds([])
    setLoadingPermissions(true)
    setIsPermissionDialogOpen(true)

    // Fetch role with permissions
    try {
      const response = await fetch(`/api/roles?id=${role.id}`)
      const roleData = await response.json()
      setSelectedPermissionIds(roleData.permissions?.map((p: Permission) => p.id) || [])
    } catch (error) {
      console.error("Error fetching role permissions:", error)
      toast.error("Gagal memuatkan permissions role ini")
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.display_name.trim()) {
      toast.error("Sila isi Nama Role dan Nama Paparan")
      return
    }
    setSubmitting(true)
    try {
      const body = editingRole ? { id: editingRole.id, ...formData } : formData

      const response = await fetch("/api/roles", {
        method: editingRole ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error("Failed to save role")
      await fetchRoles()
      setIsDialogOpen(false)
      toast.success(editingRole ? "Role dikemaskini" : "Role baru dicipta")
      if (editingRole) {
        onRoleUpdated?.()
      } else {
        onRoleCreated?.()
      }
    } catch (error) {
      console.error("Error saving role:", error)
      toast.error("Gagal menyimpan role")
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

      if (!response.ok) throw new Error("Failed to save permissions")
      await fetchRoles()
      setIsPermissionDialogOpen(false)
      toast.success(`Permissions ${selectedRoleForPermissions.display_name} disimpan`)
      onRoleUpdated?.()
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast.error("Gagal menyimpan permissions")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDeleteRole = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deletingRole) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/roles?id=${deletingRole.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete role")
      await fetchRoles()
      toast.success(`Role ${deletingRole.display_name} dipadam`)
      setDeletingRole(null)
      onRoleDeleted?.()
    } catch (error) {
      console.error("Error deleting role:", error)
      toast.error("Gagal memadam role. Pastikan tiada pengguna masih menggunakannya.")
    } finally {
      setSubmitting(false)
    }
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    )
  }

  const toggleGroup = (perms: Permission[], on: boolean) => {
    const ids = perms.map((p) => p.id)
    setSelectedPermissionIds((prev) => (on ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id))))
  }

  const actionsFor = (role: Role) => [
    { label: "Urus Permissions", icon: RiShieldKeyholeLine, onSelect: () => handleManagePermissions(role) },
    { label: "Edit", icon: RiEditLine, onSelect: () => handleEditRole(role), hidden: role.is_system_role },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setDeletingRole(role), danger: true, hidden: role.is_system_role },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle>Role & Permissions</CardTitle>
          <CardDescription>
            Role menentukan halaman dan tindakan yang dibenarkan. Role sistem boleh diubah permissions sahaja.
          </CardDescription>
        </div>
        <Button size="small" leadingIcon={RiShieldLine} onClick={handleCreateRole} className="shrink-0 self-start">
          Tambah Role
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
            <RiLoader4Line className="size-5 animate-spin" aria-hidden />
            Memuatkan...
          </div>
        ) : roles.length === 0 ? (
          <p className="py-10 text-center text-body-regular text-text-secondary">Tiada role</p>
        ) : (
          <>
            {/* iPad landscape and desktop */}
            <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
              <div className="relative max-h-[60dvh] overflow-auto">
                <table className="bui-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Nama Role</th>
                      <th>Penerangan</th>
                      <th>Jenis</th>
                      <th className="w-[56px]">
                        <span className="sr-only">Tindakan</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="motion-stagger">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-background-secondary-default">
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-body-semibold text-text-primary">{role.display_name}</span>
                            <span className="font-mono text-caption-1-regular text-text-tertiary">{role.name}</span>
                          </div>
                        </td>
                        <td className="text-text-secondary">{role.description || <span className="text-text-tertiary">-</span>}</td>
                        <td>
                          <RoleTypeChip system={role.is_system_role} />
                        </td>
                        <td className="text-end">
                          <RowActions actions={actionsFor(role)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phones */}
            <ul className="motion-stagger grid gap-2 md:hidden">
              {roles.map((role) => (
                <li key={role.id} className="flex items-start gap-2 rounded-2xl border border-border-button-default p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-body-semibold text-text-primary">{role.display_name}</span>
                      <RoleTypeChip system={role.is_system_role} />
                    </div>
                    {role.description && <span className="text-body-regular text-text-secondary">{role.description}</span>}
                    <span className="font-mono text-caption-1-regular text-text-tertiary">{role.name}</span>
                  </div>
                  <RowActions className="-me-1.5 size-7" actions={actionsFor(role)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-body-regular text-text-secondary">Jumlah: {roles.length} role</p>
      </CardFooter>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${dialogFrameClass} sm:max-w-md`}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
              {editingRole ? "Edit Role" : "Tambah Role Baru"}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              {editingRole ? "Kemaskini maklumat role." : "Cipta role baru, kemudian tetapkan permissionsnya."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className={dialogBodyClass}>
              <FormField label="Nama Role (ID)" htmlFor="role-name" required hint={editingRole ? "ID role tidak boleh ditukar." : undefined}>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="contoh: custom_role"
                  disabled={!!editingRole}
                />
              </FormField>
              <FormField label="Nama Paparan" htmlFor="role-display" required>
                <Input
                  id="role-display"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="contoh: Custom Role"
                />
              </FormField>
              <FormField label="Penerangan" htmlFor="role-description">
                <Textarea
                  id="role-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penerangan role..."
                  rows={3}
                />
              </FormField>
            </div>
            <div className={dialogFooterClass}>
              <Button type="button" variant="secondary" size="small" onClick={() => setIsDialogOpen(false)} disabled={submitting} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" size="small" disabled={submitting} className="flex-1 sm:flex-none">
                <SavingLabel busy={submitting}>{editingRole ? "Kemaskini" : "Cipta"}</SavingLabel>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className={`${dialogFrameClass} sm:max-w-2xl`}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
              Permissions · {selectedRoleForPermissions?.display_name}
            </DialogTitle>
            <DialogDescription className="text-caption-1-regular text-text-secondary">
              Pilih permissions yang dibenarkan untuk role ini. {selectedPermissionIds.length} dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            {loadingPermissions ? (
              <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
                <RiLoader4Line className="size-5 animate-spin" aria-hidden />
                Memuatkan...
              </div>
            ) : (
              Object.entries(permissionsGrouped).map(([resource, perms]) => {
                const chosen = perms.filter((p) => selectedPermissionIds.includes(p.id)).length
                const all = chosen === perms.length
                return (
                  <section key={resource} className="flex flex-col gap-2 rounded-2xl border border-border-table p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-body-semibold capitalize text-text-primary">
                        {resource}
                        <span className="ms-2 text-caption-1-regular text-text-tertiary tabular-nums">
                          {chosen}/{perms.length}
                        </span>
                      </h3>
                      <Button type="button" variant="ghost" size="xs" onClick={() => toggleGroup(perms, !all)}>
                        {all ? "Buang semua" : "Pilih semua"}
                      </Button>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          htmlFor={`perm-${perm.id}`}
                          className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 hover:bg-background-secondary-default"
                        >
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={selectedPermissionIds.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                            className="mt-0.5"
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="text-body-medium text-text-primary">{perm.display_name}</span>
                            {perm.description && <span className="text-caption-1-regular text-text-tertiary">{perm.description}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                )
              })
            )}
          </div>
          <div className={dialogFooterClass}>
            <Button type="button" variant="secondary" size="small" onClick={() => setIsPermissionDialogOpen(false)} disabled={submitting} className="flex-1 sm:flex-none">
              Batal
            </Button>
            <Button type="button" size="small" onClick={handleSavePermissions} disabled={submitting || loadingPermissions} className="flex-1 sm:flex-none">
              <SavingLabel busy={submitting}>Simpan Permissions</SavingLabel>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingRole)} onOpenChange={(open) => !open && !submitting && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam role {deletingRole?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak boleh dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} disabled={submitting} className="bg-button-danger">
              {submitting && <RiLoader4Line className="animate-spin" />}
              {submitting ? "Memadam..." : "Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
