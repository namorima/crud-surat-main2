import type React from "react"
import Script from "next/script"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-provider"
import { DirectionProvider } from "@/components/foundations/direction/direction"
import "./globals.css"

// BoardUI's type scale (styles/typography.css) expects Inter on --font-inter.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] })

export const metadata = {
  title: "Sistem Pengurusan Surat dan Bayaran",
  description: "Sistem Pengurusan Surat dan Bayaran - Dashboard untuk pengurusan surat dan rekod bayaran",
  generator: 'v0.dev'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ms" dir="ltr" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full font-sans">
        {/* Apply the stored theme before first paint. The key matches BoardUI's
            ThemeToggle; the old next-themes "theme" key is honoured once so
            existing dark-mode users keep their choice. */}
        <Script id="boardui-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("boardui:theme")||localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){document.documentElement.classList.remove("dark")}})();`}
        </Script>
        <DirectionProvider locale="ms-MY">
          <AuthProvider>{children}</AuthProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
