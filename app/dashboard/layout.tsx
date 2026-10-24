"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { AppShell } from "@/components/dashboard/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AppShell>{children}</AppShell>
  )
}
