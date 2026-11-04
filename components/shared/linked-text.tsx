"use client"

import { Fragment } from "react"
import { LINK_TOKEN, pickTag, tagOf } from "@/lib/tags"

const linkClass = "cursor-pointer font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-400"

/**
 * Note text with "#123" (onNumber), "#S123" (onSurat) and "#tag" as buttons.
 * Everything else is plain text, so markup typed into a note never runs.
 * A tag asks the page to filter by it (pickTag) unless onTag is given.
 */
export function LinkedText({
  text,
  onNumber,
  onSurat,
  onTag = pickTag,
}: {
  text: string
  onNumber?: (n: string) => void
  onSurat?: (bil: string) => void
  onTag?: (tag: string) => void
}) {
  if (!text) return null
  return (
    <>
      {text.split(LINK_TOKEN).map((part, i) => {
        const button = (label: string, run: () => void, title: string) => (
          <button
            key={i}
            type="button"
            title={title}
            onClick={(e) => {
              e.stopPropagation()
              run()
            }}
            className={linkClass}
          >
            {label}
          </button>
        )
        if (/^#S\d+$/.test(part) && onSurat) return button(part, () => onSurat(part.slice(2)), `Buka surat ${part.slice(1)}`)
        if (/^#\d+$/.test(part) && onNumber) return button(part, () => onNumber(part.slice(1)), `Buka ${part}`)
        const tag = tagOf(part)
        if (tag) return button(part, () => onTag(tag), `Senarai yang ada tag ${part}`)
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
