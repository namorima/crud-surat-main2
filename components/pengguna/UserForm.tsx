"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { RiLoader4Line, RiLockPasswordLine } from "@remixicon/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/base/buttons/button"
import {
  FormField,
  dialogBodyClass,
  dialogFooterClass,
  dialogFrameClass,
  dialogHeaderClass,
} from "@/components/dashboard/form-field"
import type { User } from "@/types/user"
import type { Role } from "@/types/rbac"

type UserFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  /** All accounts, to spot a staff ID that is already in use when adding */
  users?: User[]
  onSuccess?: () => void
}

const TYPES = [
  { value: "none", label: "Biasa" },
  { value: "VIEW", label: "VIEW" },
  { value: "PENERIMA", label: "PENERIMA" },
]

export function UserForm({ open, onOpenChange, user, users = [], onSuccess }: UserFormProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  // Adding a staff ID that already has an active account: the person moved unit
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [serverConflict, setServerConflict] = useState<{ name: string; role: string } | null>(null)
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
    setConfirmReplace(false)
    setServerConflict(null)
  }, [user, open])

  const typedId = formData.username.trim()
  const clash = !user && typedId
    ? users.find((u) => u.is_active !== false && u.id === typedId) ?? null
    : null
  const conflict: { name: string; role: string; type?: string } | null = clash
    ? { name: clash.name, role: clash.role, type: clash.type }
    : serverConflict

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
    if (!formData.role_id) {
      toast.error("Sila pilih role")
      return
    }
    if (conflict && !confirmReplace) {
      toast.error("Sahkan dahulu bahawa akaun lama akan dinyahaktifkan")
      return
    }
    setLoading(true)

    try {
      const url = user ? `/api/auth?id=${user.id}` : "/api/auth"
      const method = user ? "PATCH" : "POST"

      const body: Record<string, string | boolean | null> = {
        username: typedId,
        name: formData.name,
        role_id: formData.role_id,
        type: formData.type || null
      }

      // Only include password if it's provided (for new users or password change)
      if (formData.password) {
        body.password = formData.password
      }
      if (!user && conflict && confirmReplace) body.replaceExisting = true

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        toast.success(user ? "Pengguna dikemaskini" : "Pengguna baru dicipta", {
          description: result.replaced
            ? `Akaun lama ${result.replaced.name} (${result.replaced.role}) telah dinyahaktifkan.`
            : undefined,
        })
        onSuccess?.()
        onOpenChange(false)
      } else if (response.status === 409) {
        // The list was out of date: someone holds this staff ID after all
        const error = await response.json().catch(() => ({}))
        if (error.existing) setServerConflict({ name: error.existing.name, role: error.existing.role })
        toast.error(error.error || "ID staf sudah digunakan")
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || "Gagal menyimpan pengguna")
      }
    } catch (error) {
      console.error("Error saving user:", error)
      toast.error("Gagal menyimpan pengguna")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogFrameClass} sm:max-w-md`}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="pr-8 text-headline-semibold text-text-primary">
            {user ? `Edit ${user.name}` : "Tambah Pengguna Baru"}
          </DialogTitle>
          <DialogDescription className="text-caption-1-regular text-text-secondary">
            {user ? "Kemaskini maklumat pengguna." : "Cipta pengguna baru untuk sistem."} Medan bertanda * wajib diisi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className={dialogBodyClass}>
            <FormField
              label="ID Staf / Username"
              htmlFor="username"
              required={!user}
              hint={user ? "ID staf tidak boleh ditukar." : "Pengguna log masuk dengan ID ini."}
            >
              <Input
                id="username"
                autoComplete="off"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value })
                  setConfirmReplace(false)
                  setServerConflict(null)
                }}
                required
                disabled={!!user}
                aria-invalid={Boolean(conflict) && !confirmReplace}
              />
              {conflict && (
                <div className="mt-1 flex flex-col gap-2 rounded-xl bg-status-yellow-background p-3 text-caption-1-regular text-status-yellow-text">
                  <p>
                    ID staf <b>{typedId}</b> sudah digunakan oleh <b>{conflict.name}</b> ({conflict.role}). Jika pegawai ini
                    bertukar unit, akaun lama akan <b>dinyahaktifkan</b>: tidak boleh log masuk dan tidak boleh dipilih
                    sebagai Penerima rekod bayaran baharu, tetapi rekod lama kekal.
                  </p>
                  <label className="flex cursor-pointer items-start gap-2 text-caption-1-medium">
                    <Checkbox
                      checked={confirmReplace}
                      onCheckedChange={(checked) => {
                        setConfirmReplace(checked === true)
                        // Same person: carry over name and jenis (the role is what changes)
                        if (checked === true)
                          setFormData((prev) => ({
                            ...prev,
                            name: prev.name.trim() ? prev.name : conflict.name,
                            type: prev.type || conflict.type || "",
                          }))
                      }}
                      className="mt-0.5"
                    />
                    Nyahaktifkan akaun lama dan cipta akaun baharu untuk unit baharu
                  </label>
                </div>
              )}
            </FormField>
            {user ? (
              <FormField label="Kata Laluan" htmlFor="password" hint="Biarkan kosong jika tidak mahu ubah.">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </FormField>
            ) : (
              // New accounts start with the staff ID as password and must change it on first login
              <FormField label="Kata Laluan Awal">
                <div className="flex items-start gap-2 rounded-xl bg-background-secondary-default p-3 text-caption-1-regular text-text-secondary">
                  <RiLockPasswordLine className="mt-0.5 size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
                  <p>
                    Sama dengan ID staf
                    {typedId && (
                      <>
                        {" "}
                        (<span className="font-mono text-text-primary">{typedId}</span>)
                      </>
                    )}
                    . Pengguna wajib menukar kata laluan semasa log masuk kali pertama.
                  </p>
                </div>
              </FormField>
            )}
            <FormField label="Nama Penuh" htmlFor="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Role" htmlFor="role_id" required>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
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
              </FormField>
              <FormField label="Jenis" htmlFor="type">
                <Select
                  value={formData.type || "none"}
                  onValueChange={(value) => setFormData({ ...formData, type: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <p className="text-caption-2-regular text-text-tertiary">
              Jenis VIEW / PENERIMA menghadkan akses kepada halaman tertentu.
            </p>
          </div>
          <div className={dialogFooterClass}>
            <Button type="button" variant="secondary" size="small" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 sm:flex-none">
              Batal
            </Button>
            <Button
              type="submit"
              size="small"
              disabled={loading || (Boolean(conflict) && !confirmReplace)}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <RiLoader4Line className="size-4 animate-spin" aria-hidden />
                  Menyimpan...
                </span>
              ) : user ? (
                "Kemaskini"
              ) : conflict ? (
                "Cipta & nyahaktif lama"
              ) : (
                "Cipta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
