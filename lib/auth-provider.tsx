"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/user"
import { clearLogoutReason, codeOf, saveLogoutReason } from "@/lib/logout-reason"

type AuthContextType = {
  user: User | null
  login: (id: string, password: string) => Promise<void>
  logout: () => void
  refreshPermissions: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)

            // The API now needs the session cookie set at login. A user saved
            // before that (or whose cookie expired) has to sign in again.
            const sessionResponse = await fetch("/api/auth/session").catch(() => null)
            if (sessionResponse?.status === 401) {
              saveLogoutReason({ path: "/api/auth/session", code: await codeOf(sessionResponse), source: "buka-aplikasi" })
              localStorage.removeItem("user")
              setLoading(false)
              return
            }

            // If user has role_id but no permissions, fetch them
            if (parsedUser.role_id && !parsedUser.permissions) {
              try {
                const permResponse = await fetch(`/api/auth/permissions?userId=${parsedUser.id}`)
                if (permResponse.ok) {
                  const permissions = await permResponse.json()
                  parsedUser.permissions = permissions
                  // Update localStorage with permissions
                  localStorage.setItem("user", JSON.stringify(parsedUser))
                }
              } catch (permError) {
                console.error("Error fetching permissions on load:", permError)
              }
            }
            
            setUser(parsedUser)
          } catch (e) {
            console.error("Error parsing user from localStorage:", e)
            localStorage.removeItem("user")
          }
        }
      }
      setLoading(false)
    }
    
    loadUser()
  }, [])

  // A 401 from one of our /api routes may mean the session is gone. Before
  // signing out, ask /api/auth/session once (shared by 401s that arrive
  // together): only a 401 there too signs the user out, and why is saved for
  // the login page. A stray 401 (or one from another site) no longer signs out.
  const sessionCheck = useRef<Promise<Response | null> | null>(null)
  useEffect(() => {
    const originalFetch = window.fetch
    const checkSession = () => {
      if (!sessionCheck.current) {
        sessionCheck.current = originalFetch("/api/auth/session", { cache: "no-store" })
          .catch(() => null)
          .finally(() => {
            setTimeout(() => (sessionCheck.current = null), 2000)
          })
      }
      return sessionCheck.current
    }
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status !== 401) return response
      const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url
      const target = new URL(url, window.location.origin)
      const path = target.pathname
      if (
        target.origin !== window.location.origin ||
        !path.startsWith("/api/") ||
        path.startsWith("/api/auth/login") ||
        path.startsWith("/api/auth/change-password") ||
        !localStorage.getItem("user")
      ) {
        return response
      }
      const check = await checkSession()
      // Network error or a session that is still fine: keep the user signed in
      if (check?.status !== 401) return response
      if (localStorage.getItem("user")) {
        saveLogoutReason({ path, code: (await codeOf(check)) ?? (await codeOf(response)), source: "permintaan-api" })
        localStorage.removeItem("user")
        setUser(null)
        router.push("/login")
      }
      return response
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [router])

  const login = async (id: string, password: string) => {
    setLoading(true)
    try {
      // Call server-side login API to verify password (handles bcrypt & migration)
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password })
      })

      if (!loginResponse.ok) {
        const error = await loginResponse.json()
        throw new Error(error.error || "Invalid credentials")
      }

      const foundUser = await loginResponse.json()

      // Fetch user permissions if they have a role_id
      if (foundUser.role_id) {
        try {
          const permResponse = await fetch(`/api/auth/permissions?userId=${foundUser.id}`)
          if (permResponse.ok) {
            const permissions = await permResponse.json()
            foundUser.permissions = permissions
          }
        } catch (permError) {
          console.error("Error fetching permissions:", permError)
          foundUser.permissions = []
        }
      }

      setUser(foundUser)
      localStorage.setItem("user", JSON.stringify(foundUser))
      clearLogoutReason()
      
      // Check if user must change password (first-time login or forced reset)
      if (foundUser.must_change_password) {
        router.push("/change-password")
        return
      }
      
      // Redirect based on permissions or legacy role
      const hasBayaranView = foundUser.permissions?.some(
        (p: { resource: string; action: string }) => p.resource === 'bayaran' && p.action === 'view'
      )
      
      if (hasBayaranView || (!foundUser.permissions?.length && foundUser.role === "KEWANGAN")) {
        router.push("/dashboard/bayaran")
      } else {
        router.push("/dashboard/surat")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearLogoutReason()
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  const refreshPermissions = async () => {
    if (!user || !user.role_id) {
      console.warn("Cannot refresh permissions: user not logged in or no role_id")
      return
    }

    try {
      const permResponse = await fetch(`/api/auth/permissions?userId=${user.id}`)
      if (permResponse.ok) {
        const permissions = await permResponse.json()
        const updatedUser = { ...user, permissions }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        console.log("Permissions refreshed successfully")
      } else {
        console.error("Failed to refresh permissions: API returned error")
      }
    } catch (error) {
      console.error("Error refreshing permissions:", error)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, refreshPermissions, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
