"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface BMICalculatorProps {
  weight?: number
  height?: number
  gender?: string
}

export function BMICalculator({
  weight: initialWeight,
  height: initialHeight,
  gender: initialGender,
}: BMICalculatorProps) {
  const { user, userData } = useAuth()
  const [bmi, setBmi] = useState<number | null>(null)
  const [bmiCategory, setBmiCategory] = useState<string>("")
  const [bmiStatus, setBmiStatus] = useState<string>("")
  const [bmiColor, setBmiColor] = useState<string>("bg-gray-500")
  const [loading, setLoading] = useState(true)

  // Added state for manual input
  const [weight, setWeight] = useState<number>(initialWeight || 70)
  const [height, setHeight] = useState<number>(initialHeight || 170)
  const [gender, setGender] = useState<string>(initialGender || "male")

  useEffect(() => {
    const calculateBMI = async () => {
      setLoading(true)

      try {
        if (!user?.uid) {
          // Use the props or default values if no user
          if (initialHeight && initialWeight) {
            calculateBMIValues(initialWeight, initialHeight, initialGender || "male")
          }
          setLoading(false)
          return
        }

        // Try to get user profile data
        const userProfileRef = doc(db, "users", user.uid, "profile", "details")
        const profileDoc = await getDoc(userProfileRef)

        let heightValue = initialHeight || 0
        let weightValue = initialWeight || 0
        let genderValue = initialGender || "male"

        if (profileDoc.exists()) {
          const profileData = profileDoc.data()
          heightValue = profileData.height || heightValue
          weightValue = profileData.weight || weightValue
          genderValue = profileData.gender || genderValue
        } else if (userData) {
          // Fallback to userData if profile doesn't exist
          heightValue = userData.height || heightValue
          weightValue = userData.weight || weightValue
          genderValue = userData.gender || genderValue
        }

        // Update state with fetched values
        setHeight(heightValue)
        setWeight(weightValue)
        setGender(genderValue)

        // Calculate BMI with fetched values
        calculateBMIValues(weightValue, heightValue, genderValue)
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
  }, [user?.uid, userData, initialHeight, initialWeight, initialGender])

  // Function to calculate BMI values
  const calculateBMIValues = (weightValue: number, heightValue: number, genderValue: string) => {
    if (heightValue > 0 && weightValue > 0) {
      // Convert height from cm to meters
      const heightInMeters = heightValue / 100

      // Calculate BMI: weight (kg) / (height (m) * height (m))
      const calculatedBMI = weightValue / (heightInMeters * heightInMeters)

      // Round to 1 decimal place
      const roundedBMI = Math.round(calculatedBMI * 10) / 10

      setBmi(roundedBMI)

      // Determine BMI category and color
      let category = ""
      let status = ""
      let color = ""

      if (calculatedBMI < 18.5) {
        category = "Underweight"
        status = "You are underweight. Consider consulting with a nutritionist for a healthy weight gain plan."
        color = "bg-blue-500"
      } else if (calculatedBMI >= 18.5 && calculatedBMI < 25) {
        category = "Normal weight"
        status = "You have a healthy weight. Maintain your current lifestyle with balanced diet and regular exercise."
        color = "bg-green-500"
      } else if (calculatedBMI >= 25 && calculatedBMI < 30) {
        category = "Overweight"
        status = "You are overweight. Consider a moderate calorie deficit and increased physical activity."
        color = "bg-yellow-500"
      } else {
        category = "Obese"
        status = "You are in the obese category. It's recommended to consult with a healthcare professional."
        color = "bg-red-500"
      }

      setBmiCategory(category)
      setBmiStatus(status)
      setBmiColor(color)
    } else {
      setBmi(null)
      setBmiCategory("No data")
      setBmiStatus("")
      setBmiColor("bg-gray-500")
    }
  }

  // Handle manual recalculation
  const handleRecalculate = () => {
    calculateBMIValues(weight, height, gender)
  }

  // Calculate progress value for the BMI scale (0-40 scale)
  const getBmiProgress = () => {
    if (bmi === null) return 0

    // Clamp BMI between 0 and 40 for the progress bar
    const clampedBmi = Math.min(Math.max(bmi, 0), 40)

    // Convert to percentage (0-40 scale to 0-100%)
    return (clampedBmi / 40) * 100
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Your BMI</span>
              <span className="text-2xl font-bold text-white">{bmi !== null ? bmi : "N/A"}</span>
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
                <span
                  className={`font-medium ${
                    bmiCategory === "Underweight"
                      ? "text-blue-400"
                      : bmiCategory === "Normal weight"
                        ? "text-green-400"
                        : bmiCategory === "Overweight"
                          ? "text-yellow-400"
                          : bmiCategory === "Obese"
                            ? "text-red-400"
                            : "text-white"
                  }`}
                >
                  {bmiCategory}
                </span>
              </div>
              {bmiStatus && (
                <div className="mt-2">
                  <div
                    className={`text-sm p-2 rounded ${
                      bmiCategory === "Underweight"
                        ? "bg-blue-900/30 text-blue-200"
                        : bmiCategory === "Normal weight"
                          ? "bg-green-900/30 text-green-200"
                          : bmiCategory === "Overweight"
                            ? "bg-yellow-900/30 text-yellow-200"
                            : bmiCategory === "Obese"
                              ? "bg-red-900/30 text-red-200"
                              : "text-gray-300"
                    }`}
                  >
                    {bmiStatus}
                  </div>
                </div>
              )}
            </div>
          </div>

          {bmi !== null && bmiCategory && (
            <div className="mt-4 bg-gray-800 p-4 rounded-md">
              <h4 className="font-medium text-white mb-2">Recommended Diet Goal</h4>
              <div className="space-y-2">
                {bmiCategory === "Underweight" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-white">
                      Weight Gain - Focus on nutrient-dense foods to gain healthy weight
                    </span>
                  </div>
                )}
                {bmiCategory === "Normal weight" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-white">
                      Weight Maintenance - Continue balanced diet to maintain your healthy weight
                    </span>
                  </div>
                )}
                {bmiCategory === "Overweight" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-white">Weight Loss - Moderate calorie deficit with balanced nutrition</span>
                  </div>
                )}
                {bmiCategory === "Obese" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-white">
                      Weight Loss - Focus on sustainable weight loss with professional guidance
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => {
                    // Navigate to meal plan generator with recommended goal
                    const recommendedGoal =
                      bmiCategory === "Underweight"
                        ? "weight-gain"
                        : bmiCategory === "Normal weight"
                          ? "weight-maintenance"
                          : "weight-loss"

                    window.location.href = `/dashboard?tab=enhanced-meal-plan&goal=${recommendedGoal}`
                  }}
                  className="w-full mt-2 bg-orange-600 hover:bg-orange-700"
                >
                  Generate Meal Plan with This Goal
                </Button>
              </div>
            </div>
          )}

          {/* Manual BMI Calculator Section */}
          <div className="mt-6 border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Calculate Your BMI</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="text-white">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="input-dark text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-white">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="input-dark text-white"
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="gender" className="text-white">
                Gender
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="select-dark text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleRecalculate} className="button-orange w-full">
              Calculate BMI
            </Button>
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
        </>
      )}
    </div>
  )
}
