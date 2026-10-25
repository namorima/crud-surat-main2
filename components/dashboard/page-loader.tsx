import { cx } from "@/utils/cx"

/**
 * Full-page loading spinner, centred in the visible content area. Pages sit in
 * a wrapper with no fixed height inside the AppShell scroll area, so h-full
 * collapses and the spinner ended up at the top; size it from the viewport.
 * `inline` centres it in the space below a page header instead.
 */
export function PageLoader({ inline = false, label = "Memuatkan…" }: { inline?: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "flex w-full flex-col items-center justify-center gap-3",
        inline ? "min-h-[55dvh]" : "min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-3rem)]",
      )}
    >
      <div className="size-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" aria-hidden />
      <span className="text-caption-1-regular text-text-tertiary">{label}</span>
    </div>
  )
}
