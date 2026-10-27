"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RiDeleteBinLine, RiEditLine, RiHistoryLine, RiLoader4Line, RiLockPasswordLine, RiSearchLine, RiUserAddLine } from "@remixicon/react"
import { useAuth } from "@/lib/auth-provider"
import { hasPermission } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Button } from "@/components/base/buttons/button"
import { Chip } from "@/components/base/badges/chip"
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs"
import { NavTrigger } from "@/components/dashboard/app-shell"
import { RowActions } from "@/components/dashboard/row-actions"
import { RoleManager } from "@/components/pengguna/RoleManager"
import { UnitPicManager } from "@/components/pengguna/UnitPicManager"
import { UserForm } from "@/components/pengguna/UserForm"
import type { User } from "@/types/user"
import { cx } from "@/utils/cx"
import type { Role } from "@/types/rbac"

type Pending = { kind: "delete" | "reset"; user: User }

function TypeChip({ type }: { type?: string }) {
  if (!type) return <span className="text-text-tertiary">-</span>
  return (
    <Chip variant="caption" color={type === "PENERIMA" ? "purple" : "yellow"}>
      {type}
    </Chip>
  )
}

/** "Tidak aktif sejak …" for an account replaced when its staff member moved unit */
function InactiveNote({ user }: { user: User }) {
  const since = user.deactivated_at ? new Date(user.deactivated_at).toLocaleDateString("ms-MY") : ""
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Chip variant="caption" color="gray">
        Tidak aktif
      </Chip>
      {since && <span className="text-caption-1-regular text-text-tertiary">sejak {since} · bertukar unit</span>}
    </span>
  )
}

export default function PenggunaPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [query, setQuery] = useState("")
  // Accounts replaced when the staff member moved unit; hidden unless asked for
  const [showInactive, setShowInactive] = useState(false)
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [working, setWorking] = useState(false)

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
  }, [user, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/auth")
      if (!response.ok) throw new Error("Failed to fetch users")
      setUsers(await response.json())
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Gagal memuatkan senarai pengguna")
    } finally {
      setLoadingUsers(false)
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

  const deleteUser = async (target: User) => {
    const response = await fetch(`/api/auth?id=${target.id}`, { method: "DELETE" })
    if (!response.ok) throw new Error("Gagal memadam pengguna")
    toast.success(`${target.name} dipadam`)
  }

  const resetPassword = async (target: User) => {
    const response = await fetch(`/api/auth/reset-password-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id })
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Gagal reset kata laluan: ${error.error || "Ralat tidak diketahui"}`)
    }
    toast.success(`Kata laluan ${target.name} telah direset`, {
      description: "Pengguna akan dipaksa tukar kata laluan pada log masuk seterusnya.",
    })
  }

  const confirmPending = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!pending) return
    setWorking(true)
    try {
      if (pending.kind === "delete") await deleteUser(pending.user)
      else await resetPassword(pending.user)
      setPending(null)
      await fetchUsers()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Tindakan gagal")
    } finally {
      setWorking(false)
    }
  }

  const getRoleName = (user: User): string => {
    if (user.role_id) {
      const role = roles.find(r => r.id === user.role_id)
      return role?.display_name || user.role
    }
    return user.role
  }

  const activeUsers = useMemo(() => users.filter((u) => u.is_active !== false), [users])
  const inactiveCount = users.length - activeUsers.length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = showInactive ? users : activeUsers
    if (!q) return pool
    return pool.filter((u) =>
      [u.staff_id || u.id, u.name, getRoleName(u), u.type].some((value) => (value || "").toLowerCase().includes(q)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, activeUsers, showInactive, roles, query])

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

  const hasActions = Boolean(canEditUser || canDeleteUser)

  // A deactivated account is history only: it can be deleted but not edited or reset
  const actionsFor = (u: User) => [
    { label: "Edit", icon: RiEditLine, onSelect: () => handleEditUser(u), hidden: !canEditUser || u.is_active === false },
    {
      label: "Reset Kata Laluan",
      icon: RiLockPasswordLine,
      onSelect: () => setPending({ kind: "reset", user: u }),
      hidden: !canEditUser || u.is_active === false,
    },
    { label: "Padam", icon: RiDeleteBinLine, onSelect: () => setPending({ kind: "delete", user: u }), danger: true, hidden: !canDeleteUser },
  ]

  return (
    <div className="flex flex-col gap-3 pb-2 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <NavTrigger />
          <h1 className="truncate px-1 text-title-2-medium text-text-primary">Pengguna</h1>
        </div>
      </header>

      <Tabs defaultSelectedKey="users" className="gap-3 sm:gap-4">
        {/* Scrolls sideways on narrow phones instead of wrapping */}
        <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
          <TabList aria-label="Pengguna" className="w-max min-w-full">
            <Tab id="users" count={loadingUsers ? undefined : activeUsers.length}>
              Pengguna
            </Tab>
            {canManageRoles && <Tab id="roles">Role & Permissions</Tab>}
            {canManageRoles && <Tab id="unit-pic">Unit PIC</Tab>}
          </TabList>
        </div>

        <TabPanel id="users">
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="space-y-1">
                <CardTitle>Senarai Pengguna</CardTitle>
                <CardDescription>Akaun yang boleh log masuk ke sistem, beserta role dan jenis akses.</CardDescription>
              </div>
              {canCreateUser && (
                <Button size="small" leadingIcon={RiUserAddLine} onClick={handleAddUser} className="shrink-0 self-start">
                  Tambah Pengguna
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-icon-tertiary" aria-hidden />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari ID staf, nama, role atau jenis…"
                    className="pl-8"
                    aria-label="Cari pengguna"
                  />
                </div>
                {inactiveCount > 0 && (
                  <button
                    type="button"
                    aria-pressed={showInactive}
                    onClick={() => setShowInactive((v) => !v)}
                    className={cx(
                      "motion-press inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-2lg border px-2.5 text-caption-1-medium outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                      showInactive
                        ? "border-accent-600 bg-accent-600 text-text-white"
                        : "border-border-button-default text-text-secondary hover:bg-background-secondary-default",
                    )}
                  >
                    <RiHistoryLine className="size-4" aria-hidden />
                    <span className="hidden min-[400px]:inline">Tidak aktif</span>
                    <span className="tabular-nums">{inactiveCount}</span>
                  </button>
                )}
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center gap-2 py-10 text-body-regular text-text-secondary">
                  <RiLoader4Line className="size-5 animate-spin" aria-hidden />
                  Memuatkan...
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-body-regular text-text-secondary">
                  {users.length === 0 ? "Tiada pengguna" : "Tiada pengguna sepadan dengan carian"}
                </p>
              ) : (
                <>
                  {/* iPad landscape and desktop */}
                  <div className="hidden overflow-hidden rounded-2xl border border-border-table md:block">
                    {/* No inner vertical scroll: a nested scroll area traps touch scrolling on iPad; the page scrolls */}
                    <div className="relative overflow-x-auto">
                      <table className="bui-table">
                        <thead className="sticky top-0 z-10">
                          <tr>
                            <th>ID Staf</th>
                            <th>Nama</th>
                            <th>Role</th>
                            <th>Jenis</th>
                            {hasActions && (
                              <th className="w-[56px]">
                                <span className="sr-only">Tindakan</span>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="motion-stagger">
                          {filtered.map((u) => (
                            <tr
                              key={u.id}
                              className={cx("hover:bg-background-secondary-default", u.is_active === false && "text-text-tertiary")}
                            >
                              <td className="font-mono text-body-regular">{u.staff_id || u.id}</td>
                              <td>
                                <div className="flex flex-col gap-0.5">
                                  <span className={cx("text-body-semibold", u.is_active === false && "text-text-secondary")}>{u.name}</span>
                                  {u.is_active === false && <InactiveNote user={u} />}
                                </div>
                              </td>
                              <td>
                                <Chip variant="caption" color="soft">
                                  {getRoleName(u)}
                                </Chip>
                              </td>
                              <td>
                                <TypeChip type={u.type} />
                              </td>
                              {hasActions && (
                                <td className="text-end">
                                  <RowActions actions={actionsFor(u)} />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Phones */}
                  <ul className="motion-stagger grid grid-cols-1 gap-2 md:hidden">
                    {filtered.map((u) => (
                      <li
                        key={u.id}
                        className={cx(
                          "flex items-start gap-2 rounded-2xl border border-border-button-default p-3",
                          u.is_active === false && "border-dashed bg-background-secondary-default",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className={cx("text-body-semibold", u.is_active === false ? "text-text-secondary" : "text-text-primary")}>
                            {u.name}
                          </span>
                          <span className="font-mono text-caption-1-regular text-text-tertiary">{u.staff_id || u.id}</span>
                          {u.is_active === false && <InactiveNote user={u} />}
                          <div className="flex flex-wrap items-center gap-1">
                            <Chip variant="caption" color="soft">
                              {getRoleName(u)}
                            </Chip>
                            {u.type && <TypeChip type={u.type} />}
                          </div>
                        </div>
                        {hasActions && <RowActions className="-me-1.5 size-7" actions={actionsFor(u)} />}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>

            <CardFooter>
              <p className="text-body-regular text-text-secondary">
                Jumlah: {query ? `${filtered.length} / ` : ""}
                {activeUsers.length} pengguna aktif
                {inactiveCount > 0 && ` · ${inactiveCount} tidak aktif`}
              </p>
            </CardFooter>
          </Card>
        </TabPanel>

        {canManageRoles && (
          <TabPanel id="roles">
            <RoleManager onRoleCreated={fetchRoles} onRoleUpdated={fetchRoles} onRoleDeleted={fetchRoles} />
          </TabPanel>
        )}

        {canManageRoles && (
          <TabPanel id="unit-pic">
            <UnitPicManager />
          </TabPanel>
        )}
      </Tabs>

      <UserForm open={isUserFormOpen} onOpenChange={setIsUserFormOpen} user={editingUser} users={users} onSuccess={fetchUsers} />

      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && !working && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "delete" ? `Padam ${pending.user.name}?` : `Reset kata laluan ${pending?.user.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "delete"
                ? `Akaun ${pending.user.staff_id || pending.user.id} akan dipadam dan tidak boleh log masuk lagi. Tindakan ini tidak boleh dibatalkan.`
                : "Kata laluan akan dikembalikan kepada username, dan pengguna dipaksa tukar kata laluan pada log masuk seterusnya."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPending}
              disabled={working}
              className={pending?.kind === "delete" ? "bg-button-danger" : undefined}
            >
              {working && <RiLoader4Line className="animate-spin" />}
              {pending?.kind === "delete" ? (working ? "Memadam..." : "Padam") : working ? "Mereset..." : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
