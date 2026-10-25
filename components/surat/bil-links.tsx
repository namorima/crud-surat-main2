"use client"

import { Fragment } from "react"

/**
 * Note text where "#123" becomes a button that opens surat 123. Everything
 * else is rendered as plain text, so markup typed into a note never runs.
 */
export function TextWithBilLinks({ text, onBilClick }: { text: string; onBilClick: (bil: string) => void }) {
  return (
    <>
      {text.split(/(#\d+)/g).map((part, i) =>
        /^#\d+$/.test(part) ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onBilClick(part.slice(1))
            }}
            className="cursor-pointer font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-400"
          >
            {part}
          </button>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
