"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types/user"
import type { Role } from "@/types/rbac"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { RoleManager } from "@/components/pengguna/RoleManager"
import { UnitPicManager } from "@/components/pengguna/UnitPicManager"
import { UserForm } from "@/components/pengguna/UserForm"
import { Menu, UserPlus, Edit, Trash2, Loader2, RotateCcw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hasPermission } from "@/lib/rbac"

export default function PenggunaPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user has permission to view pengguna
    const canViewPengguna = user?.permissions && user.permissions.length > 0
      ? hasPermission(user.permissions, { resource: 'pengguna', action: 'view' })
      : (user?.role === "semua" || user?.role === "Super Admin" || user?.role === "admin")

    if (!canViewPengguna) {
      router.push("/dashboard")
      return
    }

    fetchUsers()
    fetchRoles()
    setLoading(false)
  }, [user, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/auth")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setIsUserFormOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsUserFormOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Adakah anda pasti mahu memadam pengguna ini?")) return

    try {
      const response = await fetch(`/api/auth?id=${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        alert("Gagal memadam pengguna")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Gagal memadam pengguna")
    }
  }

  const handleResetPassword = async (userId: string, username: string) => {
    if (!confirm(`Reset password untuk ${username}? Password akan dikembalikan ke username dan pengguna akan dipaksa tukar password pada login seterusnya.`)) return

    try {
      const response = await fetch(`/api/auth/reset-password-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        alert(`Password untuk ${username} telah direset. Pengguna akan dipaksa tukar password pada login seterusnya.`)
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(`Gagal reset password: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Gagal reset password")
    }
  }

  const getRoleName = (user: User): string => {
    if (user.role_id) {
      const role = roles.find(r => r.id === user.role_id)
      return role?.display_name || user.role
    }
    return user.role
  }

  // Check permissions
  const canManageRoles = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'pengguna', action: 'manage_roles' })
    : (user?.role === "semua" || user?.role === "Super Admin" || user?.role === "admin")

  const canCreateUser = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'pengguna', action: 'create' })
    : (user?.role === "semua" || user?.role === "Super Admin" || user?.role === "admin")

  const canEditUser = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'pengguna', action: 'edit' })
    : (user?.role === "semua" || user?.role === "Super Admin" || user?.role === "admin")

  const canDeleteUser = user?.permissions && user.permissions.length > 0
    ? hasPermission(user.permissions, { resource: 'pengguna', action: 'delete' })
    : (user?.role === "semua" || user?.role === "Super Admin" || user?.role === "admin")

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
              <CardTitle className="text-base md:text-xl">Pengurusan Pengguna & Role</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Pengguna</TabsTrigger>
              {canManageRoles && <TabsTrigger value="roles">Role & Permissions</TabsTrigger>}
              {canManageRoles && <TabsTrigger value="unit-pic">UNIT PIC</TabsTrigger>}
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Jumlah pengguna: {users.length}
                </p>
                {canCreateUser && (
                  <Button onClick={handleAddUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tambah Pengguna
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.id}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getRoleName(u)}</Badge>
                        </TableCell>
                        <TableCell>
                          {u.type ? (
                            <Badge variant="outline">{u.type}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {canEditUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canEditUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(u.id, u.name)}
                              title="Reset Password"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {canManageRoles && (
              <TabsContent value="roles" className="space-y-4">
                <RoleManager
                  onRoleCreated={fetchRoles}
                  onRoleUpdated={fetchRoles}
                  onRoleDeleted={fetchRoles}
                />
              </TabsContent>
            )}

            {canManageRoles && (
              <TabsContent value="unit-pic" className="space-y-4">
                <UnitPicManager />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <UserForm
        open={isUserFormOpen}
        onOpenChange={setIsUserFormOpen}
        user={editingUser}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
