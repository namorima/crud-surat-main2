import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// BoardUI button recipe (components/base/buttons/button.tsx) on the shadcn API.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2lg text-body-medium select-none cursor-pointer button-press-motion outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-button-primary text-white shadow-xs",
        destructive: "bg-button-danger text-white shadow-xs",
        outline:
          "border border-border-button-default bg-background-primary-default text-text-primary shadow-xs hover:border-border-button-hover hover:bg-background-primary-hover active:bg-background-primary-active",
        secondary:
          "bg-background-secondary-default text-text-primary hover:bg-background-secondary-hover",
        ghost: "text-text-primary hover:bg-background-secondary-hover",
        link: "h-auto p-0 text-accent-600 underline-offset-4 hover:underline dark:text-accent-400",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 rounded-lg px-2.5",
        xs: "h-7 rounded-lg px-2 text-caption-1-semibold [&_svg]:size-3.5",
        lg: "h-10 px-5",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
