"use client"

import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText, BarChart3, Users, Settings, LogOut, Home, CreditCard, RefreshCw } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import type { PermissionCheck } from "@/types/rbac"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

type NavigationItem = {
  name: string
  href: string
  icon: any
  requiredPermission: PermissionCheck
  legacyRoles?: string[] // For backward compatibility
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    requiredPermission: { resource: 'dashboard', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"]
  },
  {
    name: "Surat",
    href: "/dashboard/surat",
    icon: FileText,
    requiredPermission: { resource: 'surat', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
  {
    name: "Bayaran",
    href: "/dashboard/bayaran",
    icon: CreditCard,
    requiredPermission: { resource: 'bayaran', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"]
  },
  {
    name: "Statistik",
    href: "/dashboard/statistik",
    icon: BarChart3,
    requiredPermission: { resource: 'statistik', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "PEMASARAN", "PERANCANG", "MSPO"],
  },
  {
    name: "Pengguna",
    href: "/dashboard/pengguna",
    icon: Users,
    requiredPermission: { resource: 'pengguna', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin"]
  },
  {
    name: "Tetapan",
    href: "/dashboard/tetapan",
    icon: Settings,
    requiredPermission: { resource: 'tetapan', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
]

export function Sidebar() {
  const { user, logout, refreshPermissions } = useAuth()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter navigation based on user permissions or legacy role
  const filteredNavigation = navigation.filter((item) => {
    // REMOVED: Blanket block for VIEW and PENERIMA types
    // Now allowing RBAC permission check to determine access for these user types
    // Previously blocked these users unconditionally from Surat and Tetapan
    
    // Check RBAC permissions first
    if (user?.permissions && user.permissions.length > 0) {
      return hasPermission(user.permissions, item.requiredPermission)
    }

    // Fallback to legacy role check for backward compatibility
    if (item.legacyRoles && user?.role) {
      // KEWANGAN role specific filtering (legacy)
      if (user.role === "KEWANGAN") {
        return item.name === "Bayaran"
      }
      
      return item.legacyRoles.includes(user.role)
    }

    return false
  })

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true)
    try {
      await refreshPermissions()
      toast({
        title: "Permissions Refreshed",
        description: "Your permissions have been updated successfully. The page will reload.",
      })
      // Reload page to reflect new permissions
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className="flex h-16 items-center border-b px-4">
        <h2 className="text-lg font-semibold">CRUD Surat</h2>
      </div>
      <div className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-secondary text-secondary-foreground")}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </div>
      <div className="border-t p-4">
        <div className="mb-2 text-sm text-muted-foreground">Logged in as: {user?.name}</div>
        <div className="mb-4 text-xs text-muted-foreground">Role: {user?.role}</div>
        <div className="space-y-2">
          {user?.role_id && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleRefreshPermissions}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh Permissions"}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
