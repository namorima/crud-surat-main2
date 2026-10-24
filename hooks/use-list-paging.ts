import { useCallback, useRef } from "react"

/**
 * Page changes in a paginated list start reading from the top: resets the
 * table's own scroll box and the AppShell <main> scroll area.
 */
export function useListPaging(onPageChange: (page: number) => void) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollBoxRef = useRef<HTMLDivElement>(null)

  const goToPage = useCallback(
    (page: number) => {
      onPageChange(page)
      scrollBoxRef.current?.scrollTo({ top: 0 })
      const scroller = rootRef.current?.closest("main")
      if (scroller) scroller.scrollTo({ top: 0 })
      else window.scrollTo({ top: 0 })
    },
    [onPageChange],
  )

  return { rootRef, scrollBoxRef, goToPage }
}
