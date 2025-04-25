"use client"

import { CalorieTracker } from "@/components/calorie-tracker"
import { useAuth } from "@/lib/use-auth"
import { Loader2 } from "lucide-react"

export default function CalorieTrackerPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-7xl p-4">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-6">You need to be signed in to access the Calorie Tracker.</p>
          <a href="/login" className="button-orange px-6 py-2 rounded-md">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calorie Tracker</h1>
        <p className="text-muted-foreground mt-1">Track your daily food intake and nutrition goals</p>
      </div>

      <CalorieTracker />
    </div>
  )
}
