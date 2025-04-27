"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Settings,
  User,
  FileText,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Utensils,
  Sparkles,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

export function DashboardNav() {
  const pathname = usePathname()
  const [showSupport, setShowSupport] = useState(false)

  const mainNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "AI Meal Plan",
      href: "/dashboard?tab=enhanced-meal-plan",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: "Meal Plans",
      href: "/dashboard?tab=meal-plans",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Calorie Tracker",
      href: "/calorie-tracker",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/dashboard?tab=profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  const supportNavItems: NavItem[] = [
    {
      title: "Help & Support",
      href: "/dashboard?tab=support",
      icon: <HelpCircle className="h-5 w-5" />,
    },
    {
      title: "Chat with AI",
      href: "/dashboard?tab=chatbot",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard?tab=settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="grid items-start gap-2">
      {mainNavItems.map((item, index) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href.includes("?tab=") &&
            pathname.includes(item.href.split("?")[0]) &&
            pathname.includes(item.href.split("?tab=")[1]))
        return (
          <Link
            key={index}
            href={item.disabled ? "#" : item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "transparent",
              item.disabled && "cursor-not-allowed opacity-80",
            )}
          >
            {item.icon}
            <span className="ml-3">{item.title}</span>
          </Link>
        )
      })}

      <div className="relative">
        <Button variant="ghost" className="w-full justify-between" onClick={() => setShowSupport(!showSupport)}>
          <span className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-3" />
            Support & Settings
          </span>
          {showSupport ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showSupport && (
          <div className="mt-1 space-y-1">
            {supportNavItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "transparent",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
