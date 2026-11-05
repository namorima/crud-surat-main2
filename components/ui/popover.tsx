"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, onWheel, onTouchMove, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      // The content is portalled outside an open Dialog, whose scroll lock
      // (react-remove-scroll, listening on document) would swallow wheel and
      // touch scrolling here, so a long list in the popover could not scroll.
      // Stopping the event inside the popover keeps it from reaching that lock.
      onWheel={(e) => {
        e.stopPropagation()
        onWheel?.(e)
      }}
      onTouchMove={(e) => {
        e.stopPropagation()
        onTouchMove?.(e)
      }}
      className={cn(
        "z-50 w-72 rounded-2xl border border-border-button-default bg-background-primary-default text-text-primary shadow-dropdown p-3 outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
