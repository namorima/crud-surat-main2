import type { ReactNode } from "react"
import { RiMailOpenLine } from "@remixicon/react"
import { cx } from "@/utils/cx"

/** Brand mark shared by the sign-in and password screens. */
export function AuthMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-2lg bg-linear-to-b from-accent-500 to-accent-600 shadow-nav-selected">
      <RiMailOpenLine className="size-5 text-white" aria-hidden />
    </span>
  )
}

/**
 * Full-height page frame for the auth screens, after BoardUI's auth card:
 * page ground, safe-area padding for iPhone notches, centred 400px card.
 */
export function AuthScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "flex min-h-dvh flex-col items-center justify-center gap-4 bg-background-full px-4",
        "pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
      <p className="text-caption-1-regular text-text-tertiary">Sistem Pengurusan Surat dan Bayaran</p>
    </div>
  )
}

/** The card surface itself (BoardUI auth-card recipe). */
export const authCardClass =
  "w-full max-w-[400px] rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-xs sm:p-8 dark:bg-background-secondary-default"
