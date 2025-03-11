"use client"

import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>
      </SidebarInset>
    </div>
  )
}

