import type { ReactNode } from "react"

/** Remounts on every dashboard navigation, so each page rises in softly. */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="motion-page">{children}</div>
}
