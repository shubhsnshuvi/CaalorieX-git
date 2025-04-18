"use client"

import { useState } from "react"
import { MealPlanGenerator } from "@/components/meal-plan-generator"
import { UsdaMealPlanGenerator } from "@/components/usda-meal-plan-generator"
import { Button } from "@/components/ui/button"

export function EnhancedMealPlanGenerator({ userData }: { userData: any }) {
  const [useUSDA, setUseUSDA] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Meal Plan Generator</h3>
        <Button variant="outline" onClick={() => setUseUSDA(!useUSDA)}>
          Switch to {useUSDA ? "Basic" : "USDA"}
        </Button>
      </div>

      {useUSDA ? <UsdaMealPlanGenerator userData={userData} /> : <MealPlanGenerator userData={userData} />}
    </div>
  )
}
