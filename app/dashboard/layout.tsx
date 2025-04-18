"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/use-auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, ensureUserProfile } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if we've finished loading and there's no user
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        // Ensure user has a profile
        ensureUserProfile(user)
          .then(() => {
            setAuthChecked(true)
          })
          .catch((err) => {
            console.error("Error ensuring user profile:", err)
            setProfileError("Failed to load or create your profile. Please try logging out and back in.")
            setAuthChecked(true)
          })
      }
    }
  }, [user, loading, router, ensureUserProfile])

  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Show error if there was a problem with the profile
  if (profileError) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardNav />
        <div className="flex-1 p-8">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated, render the dashboard
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
