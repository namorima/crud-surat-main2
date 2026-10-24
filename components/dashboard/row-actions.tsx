"use client"

import { useState, type ComponentType } from "react"
import { RiLoader4Line, RiMoreFill } from "@remixicon/react"
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown"
import { cx } from "@/utils/cx"

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>

export type RowAction = {
  label: string
  icon: IconComponent
  onSelect: () => void
  disabled?: boolean
  danger?: boolean
  loading?: boolean
  hidden?: boolean
}

/** The "…" menu at the end of a table row or list card (BoardUI Dropdown). */
export function RowActions({ actions, label = "Tindakan", className }: { actions: RowAction[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const shown = actions.filter((action) => !action.hidden)

  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger
        aria-label={label}
        className={cx(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-2lg text-foreground-icon-secondary",
          "hover:bg-background-secondary-hover hover:text-foreground-icon-primary",
          className,
        )}
      >
        <RiMoreFill className="size-5" aria-hidden />
      </DropdownTrigger>
      <DropdownPopover aria-label={label} placement="bottom end" className="w-52">
        {shown.map((action) => (
          <DropdownItem
            key={action.label}
            disabled={action.disabled || action.loading}
            onSelect={() => {
              setOpen(false)
              action.onSelect()
            }}
            className="px-2 py-1.5"
          >
            {action.loading ? (
              <RiLoader4Line className="size-4 shrink-0 animate-spin text-foreground-icon-secondary" aria-hidden />
            ) : (
              <action.icon
                className={cx("size-4 shrink-0", action.danger ? "text-foreground-icon-error" : "text-foreground-icon-secondary")}
                aria-hidden
              />
            )}
            <span className={cx("text-body-medium", action.danger ? "text-text-error-primary" : "text-text-primary")}>
              {action.label}
            </span>
          </DropdownItem>
        ))}
      </DropdownPopover>
    </Dropdown>
  )
}
