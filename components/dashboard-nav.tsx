"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/use-auth"
import { Menu, X, Utensils, HelpCircle, User2 } from "lucide-react"
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo Image */}
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-orange-600 p-0.5">
              <div className="absolute inset-0.5 rounded-full bg-black dark:bg-gray-950 flex items-center justify-center">
                <Image src="/images/logo.png" alt="CalorieX Logo" width={36} height={36} className="object-cover" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              CalorieX
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-orange-500 ${
              pathname === "/dashboard" ? "text-orange-500" : "text-gray-300"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-orange-500 ${
              pathname === "/dashboard" && pathname.includes("daily-meal-tracker") ? "text-orange-500" : "text-gray-300"
            }`}
          >
            <span className="flex items-center">
              <Utensils className="mr-1 h-4 w-4" />
              Daily Meal Diary
            </span>
          </Link>
          <Link
            href="/dashboard/upgrade"
            className={`text-sm font-medium transition-colors hover:text-orange-500 ${
              pathname === "/dashboard/upgrade" ? "text-orange-500" : "text-gray-300"
            }`}
          >
            Upgrade
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-gray-300 hover:text-orange-500">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-gray-300 hover:text-orange-500">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-gray-300">
              <DropdownMenuItem className="hover:bg-gray-800 hover:text-orange-500 focus:bg-gray-800 focus:text-orange-500">
                <Link href="/contact" className="w-full flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800 hover:text-orange-500 focus:bg-gray-800 focus:text-orange-500">
                <div className="w-full flex items-center" onClick={handleLogout}>
                  <User2 className="h-4 w-4 mr-2" />
                  Logout
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden p-4 border-t border-gray-800 bg-black">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/dashboard" ? "text-orange-500" : "text-gray-300"
              }`}
              onClick={toggleMenu}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/dashboard" && pathname.includes("daily-meal-tracker")
                  ? "text-orange-500"
                  : "text-gray-300"
              }`}
              onClick={toggleMenu}
            >
              <span className="flex items-center">
                <Utensils className="mr-1 h-4 w-4" />
                Daily Meal Diary
              </span>
            </Link>
            <Link
              href="/dashboard/upgrade"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/dashboard/upgrade" ? "text-orange-500" : "text-gray-300"
              }`}
              onClick={toggleMenu}
            >
              Upgrade
            </Link>
            <div className="pt-2 border-t border-gray-800">
              <Link
                href="/contact"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-orange-500 flex items-center"
                onClick={toggleMenu}
              >
                <HelpCircle className="mr-1 h-4 w-4" />
                Contact Support
              </Link>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="justify-start px-0 text-gray-300 hover:text-orange-500"
            >
              <User2 className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
