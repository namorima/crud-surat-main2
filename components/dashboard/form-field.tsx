import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cx } from "@/utils/cx"

/** Label + control + optional hint, as used in the BoardUI dialogs. */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-caption-1-medium text-text-secondary">
        {label}
        {required && <span className="ms-0.5 text-text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-caption-2-regular text-text-tertiary">{hint}</p>}
    </div>
  )
}

/** Header / scrolling body / footer frame for a BoardUI form dialog's content. */
export const dialogFrameClass = "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:p-0"
export const dialogHeaderClass = "space-y-1 border-b border-border-table px-4 pt-4 pb-3 text-left sm:px-6 sm:pt-5"
export const dialogBodyClass = "grid min-h-0 flex-1 content-start gap-3 overflow-y-auto px-4 py-4 sm:px-6"
export const dialogFooterClass = "flex gap-2 border-t border-border-table px-4 py-3 sm:justify-end sm:px-6"
