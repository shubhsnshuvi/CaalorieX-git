"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  href?: string
  label?: string
  variant?: "default" | "ghost" | "outline"
  className?: string
}

export function BackButton({ href, label = "Back", variant = "ghost", className = "" }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button variant={variant} onClick={handleClick} className={`flex items-center gap-1 ${className}`}>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
