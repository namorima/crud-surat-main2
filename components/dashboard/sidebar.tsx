"use client"

import { useAuth } from "@/lib/auth-provider"
import {
  RiBankCardLine,
  RiCloseLine,
  RiDownload2Line,
  RiHome5Line,
  RiLogoutBoxRLine,
  RiMailOpenLine,
  RiRefreshLine,
  RiSettings4Line,
  RiSideBarFill,
  RiTeamLine,
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { hasPermission } from "@/lib/rbac"
import type { PermissionCheck } from "@/types/rbac"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/application/theme/theme-toggle"
import { Avatar } from "@/components/base/avatar/avatar"
import { cx } from "@/utils/cx"

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>

type NavigationItem = {
  name: string
  href: string
  icon: IconComponent
  requiredPermission: PermissionCheck
  /** Also shown when the user has any of these (e.g. Dashboard absorbed Statistik). */
  alsoPermissions?: PermissionCheck[]
  legacyRoles?: string[] // For backward compatibility
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: RiHome5Line,
    requiredPermission: { resource: 'dashboard', action: 'view' },
    // Statistik was merged into Dashboard; its viewers keep access
    alsoPermissions: [{ resource: 'statistik', action: 'view' }],
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
  {
    name: "Surat",
    href: "/dashboard/surat",
    icon: RiMailOpenLine,
    requiredPermission: { resource: 'surat', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
  {
    name: "Bayaran",
    href: "/dashboard/bayaran",
    icon: RiBankCardLine,
    requiredPermission: { resource: 'bayaran', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"]
  },
  {
    name: "Pengguna",
    href: "/dashboard/pengguna",
    icon: RiTeamLine,
    requiredPermission: { resource: 'pengguna', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin"]
  },
  {
    // Laporan Surat / Rekod Bayaran PDFs: open to anyone who sees either page
    name: "Download",
    href: "/dashboard/download",
    icon: RiDownload2Line,
    requiredPermission: { resource: 'surat', action: 'view' },
    alsoPermissions: [{ resource: 'bayaran', action: 'view' }],
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
  {
    name: "Tetapan",
    href: "/dashboard/tetapan",
    icon: RiSettings4Line,
    requiredPermission: { resource: 'tetapan', action: 'view' },
    legacyRoles: ["semua", "Super Admin", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]
  },
]

export type { NavigationItem }

/** Navigation rows the signed-in user may open (RBAC first, legacy roles as fallback). */
export function useNavigation(): NavigationItem[] {
  const { user } = useAuth()

  // Filter navigation based on user permissions or legacy role
  return navigation.filter((item) => {
    // REMOVED: Blanket block for VIEW and PENERIMA types
    // Now allowing RBAC permission check to determine access for these user types
    // Previously blocked these users unconditionally from Surat and Tetapan

    // Check RBAC permissions first
    if (user?.permissions && user.permissions.length > 0) {
      return [item.requiredPermission, ...(item.alsoPermissions ?? [])].some((check) =>
        hasPermission(user.permissions!, check)
      )
    }

    // Fallback to legacy role check for backward compatibility
    if (item.legacyRoles && user?.role) {
      // KEWANGAN role specific filtering (legacy)
      if (user.role === "KEWANGAN") {
        return item.name === "Bayaran" || item.name === "Download"
      }

      return item.legacyRoles.includes(user.role)
    }

    return false
  })
}

const COLLAPSED_STORAGE_KEY = "sidebar:collapsed"

/** Label slot that fades and shrinks away when the rail collapses. */
function Collapsible({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,filter] duration-300 ease-in-out",
        collapsed ? "max-w-0 opacity-0 blur-[3px]" : "max-w-full opacity-100 blur-0",
      )}
    >
      {children}
    </span>
  )
}

const rowClass = (collapsed: boolean, isSelected = false) =>
  cx(
    "flex items-center gap-2 overflow-hidden rounded-2lg p-2 outline-none",
    "transition-[width,background-color] duration-300 ease-in-out",
    "focus-visible:ring-2 focus-visible:ring-border-focus-ring",
    collapsed ? "w-9" : "w-full",
    isSelected
      ? "bg-linear-to-b from-accent-500 to-accent-600 shadow-nav-selected"
      : "hover:bg-background-secondary-hover",
  )

function NavRowContent({
  icon: Icon,
  label,
  collapsed,
  isSelected = false,
  iconClassName,
}: {
  icon: IconComponent
  label: string
  collapsed: boolean
  isSelected?: boolean
  iconClassName?: string
}) {
  return (
    <>
      <Icon
        className={cx("size-5 shrink-0", isSelected ? "text-white" : "text-foreground-icon-secondary", iconClassName)}
        aria-hidden
      />
      <Collapsible collapsed={collapsed}>
        <span className={cx("text-body-medium whitespace-nowrap", isSelected ? "text-white" : "text-text-secondary")}>
          {label}
        </span>
      </Collapsible>
    </>
  )
}

function initialsOf(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function Sidebar({
  mobile = false,
  onClose,
  className,
}: {
  /** Rendered inside the phone/tablet drawer: always expanded, close button instead of collapse. */
  mobile?: boolean
  onClose?: () => void
  className?: string
} = {}) {
  const { user, logout, refreshPermissions } = useAuth()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [collapsedState, setCollapsedState] = useState(false)
  const collapsed = mobile ? false : collapsedState

  useEffect(() => {
    if (mobile) return
    try {
      setCollapsedState(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1")
    } catch {}
  }, [mobile])

  const toggleCollapsed = () => {
    const next = !collapsedState
    setCollapsedState(next)
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0")
    } catch {}
  }

  const filteredNavigation = useNavigation()

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
    <aside
      className={cx(
        "flex h-full shrink-0 flex-col justify-between overflow-hidden",
        "rounded-3xl border border-border-button-white bg-background-secondary-default shadow-sidebar",
        "transition-[width] duration-300 ease-in-out",
        // Collapsed: 1px border + 11px padding leaves an exact 36px column for the w-9 rows.
        collapsed ? "w-[60px] px-[11px] py-3" : mobile ? "w-[272px] max-w-[calc(100vw-1rem)] p-3" : "w-[248px] p-3",
        className,
      )}
    >
      <div className="-m-2 flex min-h-0 w-[calc(100%+16px)] flex-col gap-4 overflow-y-auto p-2 [scrollbar-width:none]">
        {/* Brand + collapse control */}
        <div
          className={cx(
            "flex w-full",
            collapsed ? "flex-col-reverse items-start gap-2.5" : "flex-row items-center justify-between gap-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2lg bg-linear-to-b from-accent-500 to-accent-600 shadow-nav-selected">
              <RiMailOpenLine className="size-5 text-white" aria-hidden />
            </span>
            <Collapsible collapsed={collapsed}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-headline-semibold text-text-primary">CRUD Surat</span>
                <span className="truncate text-caption-1-medium text-text-tertiary">Surat &amp; Bayaran</span>
              </span>
            </Collapsible>
          </div>
          {mobile ? (
            <button
              type="button"
              aria-label="Tutup navigasi"
              onClick={onClose}
              className="flex size-9 cursor-pointer items-center justify-center rounded-2lg text-foreground-icon-secondary hover:bg-background-secondary-hover"
            >
              <RiCloseLine className="size-5" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              aria-label={collapsed ? "Kembangkan sidebar" : "Kecilkan sidebar"}
              aria-expanded={!collapsed}
              onClick={toggleCollapsed}
              className={cx(
                "cursor-pointer text-foreground-icon-secondary",
                collapsed && "flex w-9 items-center justify-center",
              )}
            >
              <RiSideBarFill
                className={cx("size-5 transition-transform duration-300 ease-in-out", collapsed ? "" : "-scale-x-100")}
                aria-hidden
              />
            </button>
          )}
        </div>

        <nav className={cx("flex w-full flex-col gap-1", !collapsed && "px-0.5")}>
          {filteredNavigation.map((item) => {
            const isSelected = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                aria-current={isSelected ? "page" : undefined}
                aria-label={item.name}
                title={collapsed ? item.name : undefined}
                className={rowClass(collapsed, isSelected)}
              >
                <NavRowContent icon={item.icon} label={item.name} collapsed={collapsed} isSelected={isSelected} />
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3">
        {collapsed ? <ThemeToggle collapsed /> : <ThemeToggle appearance="sidebar-segmented" />}

        <nav className="flex w-full flex-col gap-1">
          {user?.role_id && (
            <button
              type="button"
              onClick={handleRefreshPermissions}
              disabled={isRefreshing}
              title={collapsed ? "Refresh Permissions" : undefined}
              className={cx(rowClass(collapsed), "cursor-pointer disabled:cursor-wait disabled:opacity-60")}
            >
              <NavRowContent
                icon={RiRefreshLine}
                label={isRefreshing ? "Refreshing..." : "Refresh Permissions"}
                collapsed={collapsed}
                iconClassName={isRefreshing ? "animate-spin" : undefined}
              />
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Logout" : undefined}
            className={cx(rowClass(collapsed), "cursor-pointer")}
          >
            <NavRowContent icon={RiLogoutBoxRLine} label="Logout" collapsed={collapsed} />
          </button>
        </nav>

        {/* Signed-in user */}
        <div
          className={cx(
            "flex items-center gap-2 rounded-2xl bg-background-primary-default shadow-card",
            collapsed ? "w-9 justify-center p-0.5" : "w-full p-2",
          )}
          title={collapsed ? `${user?.name ?? ""} (${user?.role ?? ""})` : undefined}
        >
          <Avatar size="md" color="blue" initials={initialsOf(user?.name)} />
          <Collapsible collapsed={collapsed}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body-medium text-text-primary">{user?.name}</span>
              <span className="truncate text-caption-1-medium text-text-tertiary">{user?.role}</span>
            </span>
          </Collapsible>
        </div>
      </div>
    </aside>
  )
}
