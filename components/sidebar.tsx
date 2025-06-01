"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Users,
  Wrench,
  FileText,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  PenToolIcon as Tool,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="font-bold text-lg">CalibrationPro</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <NavItem href="/" icon={<Home />} label="Dashboard" collapsed={collapsed} />
          <NavItem href="/calibrations/new" icon={<PlusCircle />} label="New Calibration" collapsed={collapsed} />
          <NavItem href="/customers/new" icon={<Users />} label="New Customer" collapsed={collapsed} />
          <NavItem href="/calibrations" icon={<FileText />} label="Calibrations" collapsed={collapsed} />
          <NavItem href="/customers" icon={<Users />} label="Customers" collapsed={collapsed} />
          <NavItem href="/equipment" icon={<Wrench />} label="Equipment" collapsed={collapsed} />
          <NavItem href="/upcoming" icon={<Calendar />} label="Upcoming" collapsed={collapsed} />
          <NavItem href="/tools" icon={<Tool />} label="Tools" collapsed={collapsed} />
          <NavItem href="/admin" icon={<Settings />} label="Admin" collapsed={collapsed} />
        </nav>
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
}

function NavItem({ href, icon, label, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors",
        href === "/" && "bg-blue-50 text-blue-700",
      )}
    >
      <span className="mr-3">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
