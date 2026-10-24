import { redirect } from "next/navigation"

// Statistik was merged into the Dashboard; keep old links and bookmarks working.
export default function StatistikPage() {
  redirect("/dashboard")
}
