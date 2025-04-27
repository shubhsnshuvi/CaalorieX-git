"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface BMICalculatorProps {
  weight: number
  height: number
  gender: string
}

export function BMICalculator({ weight, height, gender }: BMICalculatorProps) {
  const [bmi, setBmi] = useState<number | null>(null)
  const [bmiInfo, setBmiInfo] = useState<any | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)

  // Calculate BMI whenever weight, height, or gender changes
  useEffect(() => {
    // Calculate BMI with gender adjustment
    // Standard BMI calculation
    const standardBmi = weight && height ? weight / Math.pow(height / 100, 2) : null

    // Gender-adjusted BMI (slight adjustment based on gender)
    // For females, BMI tends to be slightly higher due to higher body fat percentage
    // For males, we'll use the standard BMI
    const calculatedBmi = standardBmi ? (gender === "female" ? standardBmi * 0.95 : standardBmi) : null

    setBmi(calculatedBmi)

    // Calculate progress percentage for the BMI scale (from 15 to 35)
    if (calculatedBmi) {
      setProgressPercentage(Math.min(Math.max(((calculatedBmi - 15) / 20) * 100, 0), 100))
      setBmiInfo(getBmiCategory(calculatedBmi, gender))
    }
  }, [weight, height, gender])

  // Determine BMI category and color based on gender
  const getBmiCategory = (bmi: number, gender: string) => {
    // Slightly different thresholds for males and females
    if (gender === "female") {
      if (bmi < 18.0)
        return {
          category: "Underweight",
          color: "text-blue-600",
          bgColor: "bg-blue-600",
          progressColor: "bg-blue-500",
          cardBgColor: "bg-blue-50 border-blue-200",
          description: "You may need to gain some weight. Consult with our dietitian for a personalized plan.",
          recommendedGoal: "Weight Gain",
        }
      if (bmi >= 18.0 && bmi < 24.0)
        return {
          category: "Normal weight",
          color: "text-green-600",
          bgColor: "bg-green-600",
          progressColor: "bg-green-500",
          cardBgColor: "bg-green-50 border-green-200",
          description: "Your weight is within the healthy range. Keep up the good work!",
          recommendedGoal: "Lean Mass Gain",
        }
      if (bmi >= 24.0 && bmi < 29.0)
        return {
          category: "Overweight",
          color: "text-yellow-600",
          bgColor: "bg-yellow-600",
          progressColor: "bg-yellow-500",
          cardBgColor: "bg-yellow-50 border-yellow-200",
          description: "You may benefit from losing some weight. Our meal plans can help you achieve this goal.",
          recommendedGoal: "Weight Loss",
        }
      return {
        category: "Obese",
        color: "text-red-600",
        bgColor: "bg-red-600",
        progressColor: "bg-red-500",
        cardBgColor: "bg-red-50 border-red-200",
        description:
          "It's recommended to lose weight to reduce health risks. Our dietitian can create a specialized plan for you.",
        recommendedGoal: "Weight Loss",
      }
    } else {
      // Male
      if (bmi < 18.5)
        return {
          category: "Underweight",
          color: "text-blue-600",
          bgColor: "bg-blue-600",
          progressColor: "bg-blue-500",
          cardBgColor: "bg-blue-50 border-blue-200",
          description: "You may need to gain some weight. Consult with our dietitian for a personalized plan.",
          recommendedGoal: "Weight Gain",
        }
      if (bmi >= 18.5 && bmi < 25.0)
        return {
          category: "Normal weight",
          color: "text-green-600",
          bgColor: "bg-green-600",
          progressColor: "bg-green-500",
          cardBgColor: "bg-green-50 border-green-200",
          description: "Your weight is within the healthy range. Keep up the good work!",
          recommendedGoal: "Muscle Building",
        }
      if (bmi >= 25.0 && bmi < 30.0)
        return {
          category: "Overweight",
          color: "text-yellow-600",
          bgColor: "bg-yellow-600",
          progressColor: "bg-yellow-500",
          cardBgColor: "bg-yellow-50 border-yellow-200",
          description: "You may benefit from losing some weight. Our meal plans can help you achieve this goal.",
          recommendedGoal: "Weight Loss",
        }
      return {
        category: "Obese",
        color: "text-red-600",
        bgColor: "bg-red-600",
        progressColor: "bg-red-500",
        cardBgColor: "bg-red-50 border-red-200",
        description:
          "It's recommended to lose weight to reduce health risks. Our dietitian can create a specialized plan for you.",
        recommendedGoal: "Weight Loss",
      }
    }
  }

  if (!bmi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>BMI Calculator</CardTitle>
          <CardDescription>Please update your weight and height to calculate BMI</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={bmiInfo?.cardBgColor}>
      <CardHeader>
        <CardTitle>Your BMI ({gender === "male" ? "Male" : "Female"})</CardTitle>
        <CardDescription>Body Mass Index is a measure of body fat based on height and weight</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">15</span>
          <span className="text-sm font-medium">25</span>
          <span className="text-sm font-medium">35+</span>
        </div>
        <Progress value={progressPercentage} className={`h-3 ${bmiInfo?.progressColor}`} />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{bmi.toFixed(1)}</div>
            <div className={`text-sm font-medium ${bmiInfo?.color}`}>{bmiInfo?.category}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Weight</div>
            <div className="text-lg">{weight} kg</div>
          </div>
        </div>

        <div className="pt-2 text-sm">
          <p>{bmiInfo?.description}</p>
          <p className="mt-2">
            <span className="font-medium">Recommended Diet Goal: </span>
            <Badge className={`font-normal bg-opacity-20 ${bmiInfo?.color} bg-opacity-20`}>
              {bmiInfo?.recommendedGoal}
            </Badge>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs sm:grid-cols-4">
          <div className="rounded-md bg-blue-100 p-2">
            <div className="font-medium">Underweight</div>
            <div className="text-blue-600">{gender === "female" ? "< 18.0" : "< 18.5"}</div>
          </div>
          <div className="rounded-md bg-green-100 p-2">
            <div className="font-medium">Normal</div>
            <div className="text-green-600">{gender === "female" ? "18.0-24.0" : "18.5-25.0"}</div>
          </div>
          <div className="rounded-md bg-yellow-100 p-2">
            <div className="font-medium">Overweight</div>
            <div className="text-yellow-600">{gender === "female" ? "24.0-29.0" : "25.0-30.0"}</div>
          </div>
          <div className="rounded-md bg-red-100 p-2">
            <div className="font-medium">Obese</div>
            <div className="text-red-600">{gender === "female" ? "> 29.0" : "> 30.0"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
