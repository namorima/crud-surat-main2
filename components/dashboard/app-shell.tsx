"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { RiMenuLine } from "@remixicon/react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { IconButton } from "@/components/base/buttons/icon-button"
import { cx } from "@/utils/cx"

const AppShellContext = createContext<{ openNav: () => void } | null>(null)

/**
 * Dashboard frame, after BoardUI's app-shell: the floating sidebar from `lg`
 * (iPad landscape and desktop) and an overlay drawer below it (iPhone and
 * iPad portrait), opened by each page's <NavTrigger />.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!navOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navOpen])

  return (
    <AppShellContext.Provider value={{ openNav: () => setNavOpen(true) }}>
      <div className="relative flex h-dvh w-full gap-3 overflow-hidden bg-background-full lg:p-3">
        <Sidebar className="hidden lg:flex" />

        {navOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi">
            <button
              type="button"
              aria-label="Tutup navigasi"
              onClick={() => setNavOpen(false)}
              className="absolute inset-0 cursor-pointer bg-black/40 animate-in fade-in-0 duration-200"
            />
            <div className="relative flex h-full p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-left-8 fade-in-0 duration-200">
              <Sidebar mobile onClose={() => setNavOpen(false)} />
            </div>
          </div>
        )}

        <main
          className={cx(
            "relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto",
            "px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "sm:px-4 sm:pt-4 lg:px-1 lg:pt-1 lg:pb-1",
          )}
        >
          <div className="mx-auto w-full max-w-[1300px]">{children}</div>
        </main>
      </div>
    </AppShellContext.Provider>
  )
}

/** Hamburger shown below `lg`, where the sidebar lives in a drawer. */
export function NavTrigger({ className }: { className?: string }) {
  const shell = useContext(AppShellContext)
  if (!shell) return null
  return (
    <IconButton
      icon={RiMenuLine}
      size="small"
      aria-label="Buka navigasi"
      onClick={shell.openNav}
      className={cx("lg:hidden", className)}
    />
  )
}
