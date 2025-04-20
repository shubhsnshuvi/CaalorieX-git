"use client"
import { DailyMealTracker } from "@/components/daily-meal-tracker"
import { useAuth } from "@/lib/use-auth"

export default function FoodDatabasePage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Meal Tracker</h1>
        <p className="text-muted-foreground mt-1">Track your daily food intake and nutrition goals</p>
      </div>

      <DailyMealTracker />
    </div>
  )
}
