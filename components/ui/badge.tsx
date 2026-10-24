import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-caption-1-medium whitespace-nowrap transition-colors focus:outline-hidden focus:ring-2 focus:ring-border-focus-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent-600 text-white",
        secondary:
          "border-transparent bg-background-tertiary-default text-text-secondary",
        destructive:
          "border-transparent bg-status-rose-background text-status-rose-text",
        outline: "border-border-button-default text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
