"use client"

import { CalorieTracker } from "@/components/calorie-tracker"
import { useAuth } from "@/lib/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CalorieTrackerPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>You must be logged in to access the calorie tracker.</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Calorie Tracker</h1>
      <CalorieTracker />
    </div>
  )
}
