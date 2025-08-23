"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent) => {
    if (e.clientX <= 10 && !isSidebarVisible) {
      setIsSidebarVisible(true)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }

    // Check if sidebar visibility preference is stored
    const storedSidebarVisibility = localStorage.getItem("sidebarVisible")
    if (storedSidebarVisibility !== null) {
      setIsSidebarVisible(storedSidebarVisibility === "true")
    }

    // Add event listener for mouse movement
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarVisible) {
        setIsSidebarVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSidebarVisible])

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible
    setIsSidebarVisible(newVisibility)
    localStorage.setItem("sidebarVisible", String(newVisibility))
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Hidden by default */}
      <div
        ref={sidebarRef}
        className={`hidden md:block transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
