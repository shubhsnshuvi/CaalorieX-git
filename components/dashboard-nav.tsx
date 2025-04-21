"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/use-auth"
import { Menu, X, Database } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo Image */}
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-black p-0.5">
              <div className="absolute inset-0.5 rounded-full bg-black dark:bg-gray-950 flex items-center justify-center">
                <Image src="/images/logo.png" alt="CalorieX Logo" width={36} height={36} className="object-cover" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-black bg-clip-text text-transparent">
              CalorieX
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/daily-meal-tracker"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/daily-meal-tracker" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Daily Meal Diary
          </Link>
          <Link
            href="/food-database"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/food-database" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="flex items-center">
              <Database className="mr-1 h-4 w-4" />
              Food Database
            </span>
          </Link>
          <Link
            href="/dashboard/upgrade"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/dashboard/upgrade" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Upgrade
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Support</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>
                <Link href="/daily-meal-tracker" className="w-full">
                  Contact Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden p-4 border-t bg-background">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={toggleMenu}
            >
              Dashboard
            </Link>
            <Link
              href="/daily-meal-tracker"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/daily-meal-tracker" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={toggleMenu}
            >
              Daily Meal Diary
            </Link>
            <Link
              href="/food-database"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/food-database" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={toggleMenu}
            >
              <span className="flex items-center">
                <Database className="mr-1 h-4 w-4" />
                Food Database
              </span>
            </Link>
            <Link
              href="/dashboard/upgrade"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/dashboard/upgrade" ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={toggleMenu}
            >
              Upgrade
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="justify-start px-0">
              Logout
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
