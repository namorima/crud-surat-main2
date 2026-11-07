"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { RiErrorWarningLine, RiInformationLine, RiLockLine, RiUser3Line } from "@remixicon/react"
import { describeLogoutReason, readLogoutReason } from "@/lib/logout-reason"
import { recallLogin, rememberLogin } from "@/lib/remember-login"
import { Checkbox } from "@/components/base/checkbox/checkbox"
import { LinkButton } from "@/components/base/buttons/link-button"
import { PASSWORD_RESET_ENABLED } from "@/lib/password-reset-flag"
import { Button } from "@/components/base/buttons/button"
import { Input } from "@/components/base/input/input"
import { AuthMark, AuthScreen, authCardClass } from "@/components/auth/AuthScreen"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, loading } = useAuth()
  // Why the app signed this browser out on its own, if it did (cleared on the next login)
  const [logoutNote, setLogoutNote] = useState<string | null>(null)
  useEffect(() => {
    const reason = readLogoutReason()
    if (reason) setLogoutNote(describeLogoutReason(reason))
  }, [])
  // "Ingat log masuk": ticked by default; fills in the ID (and the password the browser saved)
  const [remember, setRemember] = useState(true)
  useEffect(() => {
    let cancelled = false
    recallLogin().then((saved) => {
      if (cancelled) return
      setRemember(saved.on)
      if (saved.id) setId((current) => current || saved.id)
      if (saved.password) setPassword((current) => current || saved.password)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(id, password)
      void rememberLogin(remember, id, password)
    } catch (err) {
      setError("Login gagal. Sila periksa ID dan kata laluan anda.")
    }
  }

  return (
    <AuthScreen>
      <div className={authCardClass}>
        <div className="mb-5">
          <AuthMark />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-title-2-medium text-text-primary">CRUD Surat</h1>
          <p className="text-body-regular text-text-secondary">Masukkan ID dan kata laluan untuk akses sistem</p>
        </div>

        {logoutNote && !error && (
          <div
            role="status"
            className="mt-5 flex items-start gap-2 rounded-2lg bg-background-secondary-default p-3 text-caption-1-regular text-text-secondary"
          >
            <RiInformationLine className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{logoutNote}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-2lg bg-notification-error-background p-3 text-body-regular text-notification-error-foreground"
          >
            <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            name="id"
            label="ID"
            placeholder="Masukkan ID Staf"
            autoComplete="username"
            leadingIcon={RiUser3Line}
            value={id}
            onChange={setId}
            isRequired
          />
          <Input
            name="password"
            type="password"
            label="Kata Laluan"
            placeholder="Masukkan kata laluan"
            autoComplete="current-password"
            leadingIcon={RiLockLine}
            value={password}
            onChange={setPassword}
            isRequired
          />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <Checkbox isSelected={remember} onChange={setRemember} size="sm">
              Ingat log masuk di pelayar ini
            </Checkbox>
            {PASSWORD_RESET_ENABLED ? (
              <LinkButton href="/forgot-password">Lupa Kata Laluan?</LinkButton>
            ) : (
              <p className="text-sm text-text-secondary">Lupa kata laluan? Hubungi pentadbir.</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sedang Masuk..." : "Log Masuk"}
          </Button>
        </form>
      </div>
    </AuthScreen>
  )
}
