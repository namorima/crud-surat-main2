"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { RiErrorWarningLine, RiLockLine, RiUser3Line } from "@remixicon/react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(id, password)
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
          {PASSWORD_RESET_ENABLED ? (
            <div className="flex items-center justify-end">
              <LinkButton href="/forgot-password">Lupa Kata Laluan?</LinkButton>
            </div>
          ) : (
            <p className="text-right text-sm text-text-secondary">Lupa kata laluan? Hubungi pentadbir.</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sedang Masuk..." : "Log Masuk"}
          </Button>
        </form>
      </div>
    </AuthScreen>
  )
}
