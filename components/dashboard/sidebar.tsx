"use client"

import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText, BarChart3, Users, Settings, LogOut, Home, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"] },
  { name: "Surat", href: "/dashboard/surat", icon: FileText, roles: ["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"] },
  { name: "Bayaran", href: "/dashboard/bayaran", icon: CreditCard, roles: ["semua", "PERLADANGAN", "PENGURUS", "KEWANGAN"] },
  {
    name: "Statistik",
    href: "/dashboard/statistik",
    icon: BarChart3,
    roles: ["semua", "admin", "PERLADANGAN", "PENGURUS"],
  },
  { name: "Pengguna", href: "/dashboard/pengguna", icon: Users, roles: ["semua", "admin"] },
  { name: "Tetapan", href: "/dashboard/tetapan", icon: Settings, roles: ["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Filter navigation based on user role and type
  const filteredNavigation = navigation.filter((item) => {
    // Block VIEW and PENERIMA types from accessing Surat and Tetapan
    if (user?.type && (user.type === "VIEW" || user.type === "PENERIMA")) {
      if (item.name === "Surat" || item.name === "Tetapan") {
        return false
      }
    }

    // KEWANGAN role specific filtering
    if (user?.role === "KEWANGAN") {
      // KEWANGAN can only see Bayaran (unless they have VIEW/PENERIMA type, already filtered above)
      return item.name === "Bayaran"
    }

    // For other roles, check if role is in the allowed roles array
    return item.roles.includes(user?.role || "")
  })

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
        <Button variant="outline" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
