"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiMenuLine } from "@remixicon/react"
import { useNavigation } from "@/components/dashboard/sidebar"
import { cx } from "@/utils/cx"

const MAX_TABS = 4

const tabClass = (selected: boolean) =>
  cx(
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 outline-none",
    "motion-press focus-visible:ring-2 focus-visible:ring-border-focus-ring",
    selected
      ? "bg-background-primary-default text-accent-600 shadow-card dark:text-accent-400"
      : "text-foreground-icon-secondary active:bg-background-secondary-hover",
  )

/**
 * iPhone navigation (below `sm`): the first four pages the user may open,
 * plus "Lagi", which opens the full drawer (other pages, theme, logout).
 */
export function BottomTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname()
  const tabs = useNavigation().slice(0, MAX_TABS)

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden"
    >
      <div className="flex items-stretch gap-1 rounded-3xl border border-border-button-white bg-background-secondary-default/95 p-1 shadow-sidebar backdrop-blur-md">
        {tabs.map((item) => {
          const selected = pathname === item.href
          return (
            <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={tabClass(selected)}>
              <item.icon className="size-5 shrink-0" aria-hidden />
              <span className={cx("max-w-full truncate text-caption-2-medium", !selected && "text-text-secondary")}>
                {item.name}
              </span>
            </Link>
          )
        })}
        <button type="button" onClick={onMore} className={cx(tabClass(false), "cursor-pointer")}>
          <RiMenuLine className="size-5 shrink-0" aria-hidden />
          <span className="text-caption-2-medium text-text-secondary">Lagi</span>
        </button>
      </div>
    </nav>
  )
}
