"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/user"

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

  const login = async (id: string, password: string) => {
    setLoading(true)
    try {
      // Fetch users from the API
      const response = await fetch("/api/auth")
      const users = await response.json()

      // Find the user with matching ID and password
      const foundUser = users.find((u: User) => u.id === id && u.password === password)

      if (foundUser) {
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
            // Continue with login even if permissions fetch fails
            foundUser.permissions = []
          }
        }

        setUser(foundUser)
        localStorage.setItem("user", JSON.stringify(foundUser))
        
        // Redirect based on permissions or legacy role
        // Check if user has bayaran:view permission
        const hasBayaranView = foundUser.permissions?.some(
          (p: { resource: string; action: string }) => p.resource === 'bayaran' && p.action === 'view'
        )
        
        // Fallback to legacy role check if no permissions
        if (hasBayaranView || (!foundUser.permissions?.length && foundUser.role === "KEWANGAN")) {
          router.push("/dashboard/bayaran")
        } else {
          router.push("/dashboard/surat")
        }
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
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
