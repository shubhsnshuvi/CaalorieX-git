"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-2">We encountered an error while loading your dashboard.</p>
      <p className="text-sm text-red-500 mb-6 max-w-md">Error details: {error.message || "Unknown error"}</p>
      <div className="flex gap-4">
        <Button
          onClick={() => {
            // Clear any cached state that might be causing issues
            window.sessionStorage.clear()
            reset()
          }}
        >
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Return to home</Button>
        </Link>
      </div>
    </div>
  )
}
