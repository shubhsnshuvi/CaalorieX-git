"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/use-auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function BMICalculator() {
  const { user, userData } = useAuth()
  const [bmi, setBmi] = useState<number | null>(null)
  const [bmiCategory, setBmiCategory] = useState<string>("")
  const [bmiColor, setBmiColor] = useState<string>("bg-gray-500")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateBMI = async () => {
      setLoading(true)

      try {
        if (!user?.uid) {
          setLoading(false)
          return
        }

        // Try to get user profile data
        const userProfileRef = doc(db, "users", user.uid, "profile", "details")
        const profileDoc = await getDoc(userProfileRef)

        let height = 0
        let weight = 0
        let gender = "male" // default

        if (profileDoc.exists()) {
          const profileData = profileDoc.data()
          height = profileData.height || 0
          weight = profileData.weight || 0
          gender = profileData.gender || "male"

          console.log("Profile data loaded:", { height, weight, gender })
        } else if (userData) {
          // Fallback to userData if profile doesn't exist
          height = userData.height || 0
          weight = userData.weight || 0
          gender = userData.gender || "male"

          console.log("Using userData:", { height, weight, gender })
        }

        if (height > 0 && weight > 0) {
          // Convert height from cm to meters
          const heightInMeters = height / 100

          // Calculate BMI: weight (kg) / (height (m) * height (m))
          const calculatedBMI = weight / (heightInMeters * heightInMeters)

          // Round to 1 decimal place
          const roundedBMI = Math.round(calculatedBMI * 10) / 10

          setBmi(roundedBMI)

          // Determine BMI category and color
          let category = ""
          let color = ""

          if (calculatedBMI < 18.5) {
            category = "Underweight"
            color = "bg-blue-500"
          } else if (calculatedBMI >= 18.5 && calculatedBMI < 25) {
            category = "Normal weight"
            color = "bg-green-500"
          } else if (calculatedBMI >= 25 && calculatedBMI < 30) {
            category = "Overweight"
            color = "bg-yellow-500"
          } else {
            category = "Obese"
            color = "bg-red-500"
          }

          setBmiCategory(category)
          setBmiColor(color)

          console.log("BMI calculated:", { bmi: roundedBMI, category, color })
        } else {
          console.log("Missing height or weight data")
          setBmi(null)
          setBmiCategory("No data")
          setBmiColor("bg-gray-500")
        }
      } catch (error) {
        console.error("Error calculating BMI:", error)
        setBmi(null)
        setBmiCategory("Error")
        setBmiColor("bg-gray-500")
      } finally {
        setLoading(false)
      }
    }

    calculateBMI()
  }, [user?.uid, userData])

  // Calculate progress value for the BMI scale (0-40 scale)
  const getBmiProgress = () => {
    if (bmi === null) return 0

    // Clamp BMI between 0 and 40 for the progress bar
    const clampedBmi = Math.min(Math.max(bmi, 0), 40)

    // Convert to percentage (0-40 scale to 0-100%)
    return (clampedBmi / 40) * 100
  }

  return (
    <Card className="card-gradient">
      <CardHeader className="card-header-gradient">
        <CardTitle className="text-black">BMI Calculator</CardTitle>
        <CardDescription className="text-black opacity-90">Body Mass Index</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : bmi === null ? (
          <div className="text-center py-4 text-white">
            <p>Please update your height and weight in your profile to calculate BMI.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Your BMI</span>
              <span className="text-2xl font-bold text-white">{bmi}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm text-white">
                <span>0</span>
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>40</span>
              </div>
              <Progress value={getBmiProgress()} className="h-3" indicatorClassName={bmiColor} />
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-white">Category:</span>
                <span className="font-medium text-white">{bmiCategory}</span>
              </div>
            </div>

            <div className="text-sm text-gray-300">
              <p>BMI is calculated based on your height and weight.</p>
              <p className="mt-1">
                <span className="text-blue-400">Underweight: </span>
                <span className="text-white">Below 18.5</span>
              </p>
              <p>
                <span className="text-green-400">Normal weight: </span>
                <span className="text-white">18.5 - 24.9</span>
              </p>
              <p>
                <span className="text-yellow-400">Overweight: </span>
                <span className="text-white">25 - 29.9</span>
              </p>
              <p>
                <span className="text-red-400">Obese: </span>
                <span className="text-white">30 or higher</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
