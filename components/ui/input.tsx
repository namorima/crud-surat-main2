import * as React from "react"

import { cn } from "@/lib/utils"

// iOS/iPadOS Safari draws date and time inputs as native widgets: taller than
// h-9 and with an intrinsic min width that overflows grid and flex cells.
const DATE_TYPES = new Set(["date", "time", "datetime-local", "month", "week"])
const dateClasses =
  "block min-w-0 max-w-full appearance-none leading-5 text-left [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:min-h-5 [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          type && DATE_TYPES.has(type) ? dateClasses : "flex",
          "h-9 w-full px-2.5 py-2 rounded-2lg border-0 bg-background-tertiary-default text-body-regular text-text-primary ring-2 ring-inset ring-transparent transition-[box-shadow,background-color] placeholder:text-text-tertiary hover:ring-border-button-hover focus-visible:outline-none focus-visible:ring-border-button-active disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text aria-invalid:bg-background-tertiary-error file:border-0 file:bg-transparent file:text-body-medium file:text-text-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
