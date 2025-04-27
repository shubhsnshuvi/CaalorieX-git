"use client"

import { CalorieTracker } from "@/components/calorie-tracker"
import { BackButton } from "@/components/back-button"

export default function CalorieTrackerPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-3xl font-bold ml-2">Calorie Tracker</h1>
      </div>

      <CalorieTracker />
    </div>
  )
}
