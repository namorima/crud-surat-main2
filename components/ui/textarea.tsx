import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full px-2.5 py-2 rounded-2lg border-0 bg-background-tertiary-default text-body-regular text-text-primary ring-2 ring-inset ring-transparent transition-[box-shadow,background-color] placeholder:text-text-tertiary hover:ring-border-button-hover focus-visible:outline-none focus-visible:ring-border-button-active disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text aria-invalid:bg-background-tertiary-error",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
