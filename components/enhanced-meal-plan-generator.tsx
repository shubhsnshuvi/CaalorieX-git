"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, Info, Calculator } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore"
import { useAuth } from "@/lib/use-auth"
import { MealPlanPdf } from "./meal-plan-pdf"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getMealTemplates, type MealTemplate } from "@/lib/meal-templates-firestore"
import { Progress } from "@/components/ui/progress"

interface MealPlan {
  day: string
  meals: {
    meal: string
    time?: string
    food: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
    source?: string
    id?: string
    fdcId?: string
    tags?: string[]
    description?: string
    ingredients?: string[]
    preparation?: string
  }[]
}

// Medical conditions list
const medicalConditions = [
  { id: "none", label: "None" },
  { id: "diabetes", label: "Diabetes" },
  { id: "hypertension", label: "Hypertension" },
  { id: "heart-disease", label: "Heart Disease" },
  { id: "high-cholesterol", label: "High Cholesterol" },
  { id: "thyroid", label: "Thyroid Issues" },
  { id: "pcod", label: "PCOD/PCOS" },
  { id: "ibs", label: "IBS" },
  { id: "gout", label: "Gout" },
  { id: "kidney-stones", label: "Kidney Stones" },
  { id: "migraines", label: "Migraines" },
]

// Diet tags for meal categorization
const dietTags = {
  "high-protein": { label: "High Protein", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  "low-carb": { label: "Low Carb", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  "high-fiber": { label: "High Fiber", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  "heart-healthy": { label: "Heart Healthy", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  "low-sodium": { label: "Low Sodium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  "low-fat": { label: "Low Fat", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  "gluten-free": { label: "Gluten Free", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  "dairy-free": { label: "Dairy Free", color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300" },
  vegetarian: {
    label: "Vegetarian",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  vegan: { label: "Vegan", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300" },
  keto: { label: "Keto", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
  paleo: { label: "Paleo", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
  mediterranean: {
    label: "Mediterranean",
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  },
  indian: { label: "Indian", color: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300" },
  asian: { label: "Asian", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300" },
  mexican: { label: "Mexican", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300" },
}

// Extended diet periods
const dietPeriods = [
  { value: "one-day", label: "One Day" },
  { value: "three-days", label: "Three Days" },
  { value: "one-week", label: "One Week" },
  { value: "two-weeks", label: "Two Weeks" },
  { value: "one-month", label: "One Month" },
  { value: "two-months", label: "Two Months" },
  { value: "three-months", label: "Three Months" },
  { value: "six-months", label: "Six Months" },
]

// Activity level multipliers for TDEE calculation
const activityMultipliers = {
  sedentary: 1.2, // Little or no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  "very-active": 1.9, // Very hard exercise & physical job or 2x training
}

export function EnhancedMealPlanGenerator({ userData }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const searchParams = useSearchParams()
  const goalParam = searchParams?.get("goal")
  const [dietPreference, setDietPreference] = useState(userData?.dietPreference || "omnivore")
  const [dietGoal, setDietGoal] = useState<string>(goalParam || userData?.dietGoal || "weight-loss")
  const [calorieGoal, setCalorieGoal] = useState(userData?.targetCalories || 2000)
  const [dietPeriod, setDietPeriod] = useState("one-week")
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>(
    userData?.medicalConditions || ["none"],
  )
  const [mealPlanHistory, setMealPlanHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [mealTemplates, setMealTemplates] = useState<{ [key: string]: MealTemplate[] }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  })

  // New state variables for goal weight feature
  const [goalWeight, setGoalWeight] = useState<number>(userData?.weight ? userData.weight - 5 : 65)
  const [isCalculating, setIsCalculating] = useState(false)
  const [weightDifference, setWeightDifference] = useState<number>(0)
  const [weightProgress, setWeightProgress] = useState<number>(0)
  const [userManuallySetGoalWeight, setUserManuallySetGoalWeight] = useState(false)

  // State for detailed calorie calculation information
  const [calorieCalculationDetails, setCalorieCalculationDetails] = useState<{
    maintenanceCalories: number
    goalCalories: number
    weightDifference: number
    estimatedDays: number
    bmr: number
    tdee: number
  }>({
    maintenanceCalories: 0,
    goalCalories: 0,
    weightDifference: 0,
    estimatedDays: 0,
    bmr: 0,
    tdee: 0,
  })

  // Fetch meal plan history when component mounts
  useEffect(() => {
    if (user) {
      fetchMealPlanHistory()
    }
  }, [user])

  // Fetch meal templates when component mounts
  useEffect(() => {
    if (dietPreference) {
      fetchMealTemplates()
    }
  }, [dietPreference])

  // Update state when userData changes
  useEffect(() => {
    if (userData) {
      setDietPreference(userData.dietPreference || "omnivore")
      // Use the goal from URL parameter if available, otherwise use from userData
      setDietGoal(goalParam || userData.dietGoal || "weight-loss")
      setCalorieGoal(userData.targetCalories || 2000)
      setSelectedMedicalConditions(userData.medicalConditions || ["none"])

      // Set goal weight based on current weight
      if (userData.weight) {
        // Default goal weight is 5kg less than current weight for weight loss
        // or 5kg more for weight gain
        const defaultGoalWeight = userData.dietGoal === "weight-gain" ? userData.weight + 5 : userData.weight - 5
        setGoalWeight(defaultGoalWeight)

        // Calculate weight difference and progress
        calculateWeightDifference(userData.weight, defaultGoalWeight)
      }

      // Calculate calorie goal based on profile data
      if (userData.weight && userData.height && userData.age && userData.gender && userData.activityLevel) {
        calculateCalorieGoal()
      }
    }
  }, [userData, goalParam])

  // Recalculate calorie goal when relevant factors change
  useEffect(() => {
    if (userData?.weight && userData?.height && userData?.age && userData?.gender) {
      // Remove any conditions that might prevent calculation
      calculateCalorieGoal()
    }
  }, [goalWeight, dietPeriod, userData, dietGoal])

  // Calculate weight difference and progress percentage
  const calculateWeightDifference = (currentWeight: number, targetWeight: number) => {
    const difference = currentWeight - targetWeight
    setWeightDifference(difference)

    // Calculate progress as percentage (how close to goal)
    // For weight loss: if current > target, progress is 0-100%
    // For weight gain: if current < target, progress is 0-100%
    if (dietGoal === "weight-loss") {
      // For weight loss, starting weight is 0% progress, goal weight is 100%
      const startingGap = userData.weight - targetWeight
      const currentGap = currentWeight - targetWeight
      const progress = startingGap > 0 ? ((startingGap - currentGap) / startingGap) * 100 : 0
      setWeightProgress(Math.max(0, Math.min(100, progress)))
    } else if (dietGoal === "weight-gain") {
      // For weight gain, starting weight is 0% progress, goal weight is 100%
      const startingGap = targetWeight - userData.weight
      const currentGap = targetWeight - currentWeight
      const progress = startingGap > 0 ? ((startingGap - currentGap) / startingGap) * 100 : 0
      setWeightProgress(Math.max(0, Math.min(100, progress)))
    } else {
      // For maintenance, progress is 100% if within 1kg of target
      const progress = Math.abs(difference) <= 1 ? 100 : 0
      setWeightProgress(progress)
    }
  }

  // Add this function after the calculateWeightDifference function
  const getBmiStatus = () => {
    if (!userData?.weight || !userData?.height) return null

    // Calculate BMI: weight (kg) / (height (m) * height (m))
    const heightInMeters = userData.height / 100
    const bmi = userData.weight / (heightInMeters * heightInMeters)

    // Determine BMI category
    if (bmi < 18.5) return { status: "Underweight", color: "text-blue-500", recommendation: "weight-gain" }
    if (bmi >= 18.5 && bmi < 25)
      return { status: "Normal weight", color: "text-green-500", recommendation: "weight-maintenance" }
    if (bmi >= 25 && bmi < 30) return { status: "Overweight", color: "text-yellow-500", recommendation: "weight-loss" }
    return { status: "Obese", color: "text-red-500", recommendation: "weight-loss" }
  }

  // Calculate appropriate calorie goal based on user data and goals
  const calculateCalorieGoal = () => {
    setIsCalculating(true)
    console.log("Calculating calorie goal with goal weight:", goalWeight)

    try {
      if (!userData.weight || !userData.height || !userData.age || !userData.gender) {
        toast({
          title: "Missing profile data",
          description: "Please complete your profile with weight, height, age, and gender information.",
          variant: "destructive",
        })
        setIsCalculating(false)
        return
      }

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr
      if (userData.gender === "male") {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5
      } else {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161
      }

      // Calculate TDEE (Total Daily Energy Expenditure)
      const activityLevel = userData.activityLevel || "moderate"
      const tdee = Math.round(bmr * activityMultipliers[activityLevel])

      // Store the maintenance calories for reference
      const maintenanceCalories = tdee

      // Calculate weight difference
      const weightDiff = userData.weight - goalWeight

      // Calculate calorie adjustment based on weight difference
      // Each kg of body fat = approximately 7700 calories
      let calculatedCalorieGoal

      if (Math.abs(weightDiff) < 0.1) {
        // If the difference is negligible, maintain current weight
        calculatedCalorieGoal = maintenanceCalories
      } else if (weightDiff > 0) {
        // Need to lose weight - create a deficit
        // Calculate deficit per day based on weight difference
        // For each kg to lose, create a deficit of 7700 calories spread over the diet period

        // Convert diet period to days
        const periodInDays = getPeriodInDays(dietPeriod)

        // Calculate total calorie deficit needed
        const totalDeficitNeeded = weightDiff * 7700

        // Calculate daily deficit
        let dailyDeficit = Math.round(totalDeficitNeeded / periodInDays)

        // Cap the daily deficit to ensure healthy weight loss (max 1000 calories/day deficit)
        dailyDeficit = Math.min(dailyDeficit, 1000)

        // Calculate goal calories
        calculatedCalorieGoal = maintenanceCalories - dailyDeficit

        // Ensure minimum healthy calorie intake
        const minCalories = userData.gender === "male" ? 1500 : 1200
        calculatedCalorieGoal = Math.max(calculatedCalorieGoal, minCalories)
      } else {
        // Need to gain weight - create a surplus
        // Calculate surplus per day based on weight difference
        // For each kg to gain, create a surplus of 7700 calories spread over the diet period

        // Convert diet period to days
        const periodInDays = getPeriodInDays(dietPeriod)

        // Calculate total calorie surplus needed
        const totalSurplusNeeded = Math.abs(weightDiff) * 7700

        // Calculate daily surplus
        let dailySurplus = Math.round(totalSurplusNeeded / periodInDays)

        // Cap the daily surplus to ensure healthy weight gain (max 500 calories/day surplus)
        dailySurplus = Math.min(dailySurplus, 500)

        // Calculate goal calories
        calculatedCalorieGoal = maintenanceCalories + dailySurplus
      }

      // Round to nearest 50 calories for simplicity
      calculatedCalorieGoal = Math.round(calculatedCalorieGoal / 50) * 50

      // Update calorie goal
      setCalorieGoal(calculatedCalorieGoal)
      console.log("Updated calorie goal to:", calculatedCalorieGoal)

      // Calculate estimated time to reach goal
      const estimatedDays = calculateEstimatedDaysToGoal(weightDiff, calculatedCalorieGoal, maintenanceCalories)

      // Update calculation details for display
      setCalorieCalculationDetails({
        maintenanceCalories,
        goalCalories: calculatedCalorieGoal,
        weightDifference: weightDiff,
        estimatedDays,
        bmr: Math.round(bmr),
        tdee: maintenanceCalories,
      })

      // Show toast notification
      toast({
        title: "Calorie goal updated",
        description: `Your daily calorie goal has been set to ${calculatedCalorieGoal} calories based on your target weight of ${goalWeight}kg.`,
      })
    } catch (error) {
      console.error("Error calculating calorie goal:", error)
      toast({
        title: "Calculation error",
        description: "There was an error calculating your calorie goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Helper function to convert diet period to days
  const getPeriodInDays = (period: string): number => {
    switch (period) {
      case "one-day":
        return 1
      case "three-days":
        return 3
      case "one-week":
        return 7
      case "two-weeks":
        return 14
      case "one-month":
        return 30
      case "two-months":
        return 60
      case "three-months":
        return 90
      case "six-months":
        return 180
      default:
        return 30
    }
  }

  // Helper function to calculate estimated days to reach goal
  const calculateEstimatedDaysToGoal = (
    weightDiff: number,
    goalCalories: number,
    maintenanceCalories: number,
  ): number => {
    if (Math.abs(weightDiff) < 0.1) return 0 // Already at goal

    const calorieDeficitOrSurplus = Math.abs(maintenanceCalories - goalCalories)
    if (calorieDeficitOrSurplus < 10) return Number.POSITIVE_INFINITY // No significant deficit/surplus

    // Calculate days based on 7700 calories per kg
    return Math.round((Math.abs(weightDiff) * 7700) / calorieDeficitOrSurplus)
  }

  const fetchMealTemplates = async () => {
    try {
      // Fetch breakfast templates
      const breakfastTemplates = await getMealTemplates({
        mealType: "Breakfast",
        dietPreference: dietPreference,
        limitCount: 20,
      })

      // Fetch lunch templates
      const lunchTemplates = await getMealTemplates({
        mealType: "Lunch",
        dietPreference: dietPreference,
        limitCount: 20,
      })

      // Fetch dinner templates
      const dinnerTemplates = await getMealTemplates({
        mealType: "Dinner",
        dietPreference: dietPreference,
        limitCount: 20,
      })

      // Fetch snack templates
      const snackTemplates = await getMealTemplates({
        mealType: "Snack",
        dietPreference: dietPreference,
        limitCount: 20,
      })

      setMealTemplates({
        breakfast: breakfastTemplates,
        lunch: lunchTemplates,
        dinner: dinnerTemplates,
        snack: snackTemplates,
      })
    } catch (error) {
      console.error("Error fetching meal templates:", error)
    }
  }

  const fetchMealPlanHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const mealPlansRef = collection(db, "mealPlans")
      const q = query(mealPlansRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
      const querySnapshot = await getDocs(q)

      const history = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setMealPlanHistory(history)
    } catch (error) {
      console.error("Error fetching meal plan history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch meal plan history",
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Handle medical condition checkbox change
  const handleMedicalConditionChange = (condition: string, checked: boolean) => {
    if (condition === "none" && checked) {
      setSelectedMedicalConditions(["none"])
    } else {
      let updatedConditions = [...selectedMedicalConditions]

      if (checked) {
        // Remove 'none' if it exists
        updatedConditions = updatedConditions.filter((c) => c !== "none")
        updatedConditions.push(condition)
      } else {
        updatedConditions = updatedConditions.filter((c) => c !== condition)

        // If no conditions selected, add 'none'
        if (updatedConditions.length === 0) {
          updatedConditions = ["none"]
        }
      }

      setSelectedMedicalConditions(updatedConditions)
    }
  }

  // Modify the generateMealPlan function to add auto-scroll at the end
  const generateMealPlan = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate a meal plan",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setMealPlan([])

    try {
      // Check if user has subscription or has used less than 3 free meal plans
      const mealPlansRef = collection(db, "mealPlans")
      const q = query(mealPlansRef, where("userId", "==", user.uid))
      const querySnapshot = await getDocs(q)

      const userMealPlans = querySnapshot.docs.map((doc) => doc.data())

      // Get subscription status from userData, default to "free" if not available
      const userSubscription = userData?.subscription || "free"

      // For testing purposes, we'll temporarily disable the subscription check
      // In a production environment, you would uncomment this code
      /*
      if (userSubscription !== "premium" && userMealPlans.length >= 3) {
        toast({
          title: "Free limit reached",
          description: "You've used all your free meal plans. Please upgrade to premium.",
          variant: "destructive",
        })
        setIsGenerating(false)
        
        // Redirect to the upgrade page
        window.location.href = "/dashboard/upgrade"
        return
      }
      */

      // Simulate meal plan generation (in a real app, this would call an API)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a professional meal plan based on preferences
      const generatedMealPlan = generateProfessionalMealPlan(
        dietPreference,
        dietGoal,
        calorieGoal,
        dietPeriod,
        selectedMedicalConditions,
      )
      setMealPlan(generatedMealPlan)

      // Save the meal plan to Firestore
      await addDoc(collection(db, "mealPlans"), {
        userId: user.uid,
        dietPreference,
        dietGoal,
        calorieGoal,
        dietPeriod,
        medicalConditions: selectedMedicalConditions,
        mealPlan: generatedMealPlan,
        createdAt: Timestamp.now(),
        goalWeight: goalWeight || null,
      })

      // Refresh the meal plan history
      fetchMealPlanHistory()

      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan is ready!",
      })

      // Add auto-scroll to the meal plan section
      setTimeout(() => {
        const mealPlanElement = document.getElementById("meal-plan-section")
        if (mealPlanElement) {
          mealPlanElement.scrollIntoView({ behavior: "smooth", block: "start" })
          // Add focus for accessibility
          mealPlanElement.setAttribute("tabindex", "-1")
          mealPlanElement.focus({ preventScroll: true })
        }
      }, 300) // Increased timeout to ensure DOM is updated
    } catch (error) {
      console.error("Error generating meal plan:", error)
      toast({
        title: "Error",
        description: "Failed to generate meal plan",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateProfessionalMealPlan = (
    preference: string,
    goal: string,
    calories: number,
    period: string,
    medicalConditions: string[],
  ): MealPlan[] => {
    const days =
      period === "one-day"
        ? 1
        : period === "three-days"
          ? 3
          : period === "one-week"
            ? 7
            : period === "two-weeks"
              ? 14
              : period === "one-month"
                ? 30
                : period === "two-months"
                  ? 60
                  : period === "three-months"
                    ? 90
                    : period === "six-months"
                      ? 180
                      : 7
    const mealPlan: MealPlan[] = []

    // Check if there are medical conditions to consider
    const hasMedicalConditions = !medicalConditions.includes("none")

    // Generate meal plan for each day
    // For longer periods, we'll generate a week of meals and repeat them
    const uniqueDays = Math.min(days, 7)

    for (let i = 0; i < uniqueDays; i++) {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i % 7]

      // Select meals for this day (ensuring variety by using the day index)
      // If we have templates from Firestore, use those, otherwise fall back to defaults
      let breakfast, lunch, dinner, snack

      // For breakfast
      if (mealTemplates.breakfast.length > 0) {
        breakfast = mealTemplates.breakfast[i % mealTemplates.breakfast.length]
      } else {
        // Fallback to default breakfast options
        const defaultBreakfasts = getDefaultMeals(preference, "breakfast")
        breakfast = defaultBreakfasts[i % defaultBreakfasts.length]
      }

      // For lunch
      if (mealTemplates.lunch.length > 0) {
        lunch = mealTemplates.lunch[i % mealTemplates.lunch.length]
      } else {
        // Fallback to default lunch options
        const defaultLunches = getDefaultMeals(preference, "lunch")
        lunch = defaultLunches[i % defaultLunches.length]
      }

      // For dinner
      if (mealTemplates.dinner.length > 0) {
        dinner = mealTemplates.dinner[i % mealTemplates.dinner.length]
      } else {
        // Fallback to default dinner options
        const defaultDinners = getDefaultMeals(preference, "dinner")
        dinner = defaultDinners[i % defaultDinners.length]
      }

      // For snack
      if (mealTemplates.snack.length > 0) {
        snack = mealTemplates.snack[i % mealTemplates.snack.length]
      } else {
        // Fallback to default snack options
        const defaultSnacks = getDefaultMeals(preference, "snack")
        snack = defaultSnacks[i % defaultSnacks.length]
      }

      // Adjust for medical conditions if needed
      if (hasMedicalConditions) {
        // Example adjustments for specific conditions
        if (medicalConditions.includes("diabetes")) {
          // Adjust meals for diabetes - lower carb options
          if (breakfast.name.toLowerCase().includes("pancake") || breakfast.name.toLowerCase().includes("oat")) {
            breakfast.tags = breakfast.tags || []
            breakfast.tags.push("low-gi")
            breakfast.description =
              (breakfast.description || "") + " Modified for diabetes management with lower glycemic index ingredients."
          }

          if (lunch.name.toLowerCase().includes("rice") || lunch.name.toLowerCase().includes("pasta")) {
            lunch.name += " (with reduced portion of carbs)"
            lunch.description =
              (lunch.description || "") + " Modified for diabetes management with reduced carbohydrate content."
          }

          if (dinner.name.toLowerCase().includes("potato") || dinner.name.toLowerCase().includes("rice")) {
            dinner.name += " (with reduced portion of carbs)"
            dinner.description =
              (dinner.description || "") + " Modified for diabetes management with reduced carbohydrate content."
          }

          if (snack.name.toLowerCase().includes("fruit") || snack.name.toLowerCase().includes("dried")) {
            snack.name = "Low-Sugar Greek Yogurt with Berries"
            snack.quantity = "3/4 cup yogurt, 1/4 cup berries"
            snack.description = "A diabetes-friendly snack with protein and limited natural sugars."
            snack.tags = snack.tags || []
            snack.tags.push("low-gi")
          }
        }

        if (medicalConditions.includes("hypertension")) {
          // Adjust meals for hypertension - lower sodium options
          breakfast.name += " (Low Sodium)"
          lunch.name += " (Low Sodium)"
          dinner.name += " (Low Sodium)"

          breakfast.description =
            (breakfast.description || "") + " Prepared with minimal salt for hypertension management."
          lunch.description = (lunch.description || "") + " Prepared with minimal salt for hypertension management."
          dinner.description = (dinner.description || "") + " Prepared with minimal salt for hypertension management."

          breakfast.tags = breakfast.tags || []
          lunch.tags = lunch.tags || []
          dinner.tags = dinner.tags || []

          breakfast.tags.push("low-sodium")
          lunch.tags.push("low-sodium")
          dinner.tags.push("low-sodium")
        }

        if (medicalConditions.includes("high-cholesterol")) {
          // Adjust meals for high cholesterol - heart-healthy options
          if (breakfast.name.toLowerCase().includes("egg") && breakfast.name.toLowerCase().includes("bacon")) {
            breakfast.name = "Oatmeal with Berries and Flaxseeds"
            breakfast.quantity = "1 cup oatmeal, 1/2 cup berries, 1 tbsp flaxseeds"
            breakfast.description = "A heart-healthy breakfast rich in soluble fiber to help lower cholesterol."
            breakfast.tags = ["heart-healthy", "high-fiber", "low-fat"]
          }

          if (lunch.name.toLowerCase().includes("cheese") || lunch.name.toLowerCase().includes("beef")) {
            lunch.name = lunch.name.replace("Beef", "Lean Turkey").replace("Cheese", "Reduced-Fat Cheese")
            lunch.description =
              (lunch.description || "") + " Modified with lean protein and reduced saturated fat for heart health."
            lunch.tags = lunch.tags || []
            lunch.tags.push("heart-healthy")
          }

          if (dinner.name.toLowerCase().includes("steak")) {
            dinner.name = "Grilled Fish with Steamed Vegetables"
            dinner.quantity = "6 oz fish, 1.5 cups vegetables"
            dinner.description = "A heart-healthy dinner rich in omega-3 fatty acids and low in saturated fat."
            dinner.tags = ["heart-healthy", "high-protein", "low-fat"]
          }
        }
      }

      // Adjust macros based on diet goal
      let proteinMultiplier = 1.0
      let carbMultiplier = 1.0
      let fatMultiplier = 1.0

      switch (goal) {
        case "weight-loss":
          carbMultiplier = 0.8
          fatMultiplier = 0.9
          break
        case "weight-gain":
        case "muscle-gain":
          proteinMultiplier = 1.3
          carbMultiplier = 1.2
          break
        case "keto":
          proteinMultiplier = 1.1
          carbMultiplier = 0.2
          fatMultiplier = 1.5
          break
      }

      // Calculate macros based on calorie distribution and diet goal
      const breakfastCalories = Math.round(calories * 0.25)
      const lunchCalories = Math.round(calories * 0.35)
      const dinnerCalories = Math.round(calories * 0.3)
      const snackCalories = Math.round(calories * 0.1)

      // Create the day's meal plan
      const dayMeals = {
        day: dayName,
        meals: [
          {
            meal: "Breakfast",
            time: "8:00 AM",
            food: breakfast.name,
            quantity: breakfast.quantity || getDefaultQuantity("breakfast"),
            calories: breakfast.calories || breakfastCalories,
            protein: breakfast.protein || Math.round((breakfastCalories * 0.3 * proteinMultiplier) / 4),
            carbs: breakfast.carbs || Math.round((breakfastCalories * 0.4 * carbMultiplier) / 4),
            fat: breakfast.fat || Math.round((breakfastCalories * 0.3 * fatMultiplier) / 9),
            tags: breakfast.tags || [],
            description: breakfast.description || "",
            ingredients: breakfast.ingredients?.map((ing) => ing.name) || [],
            preparation: breakfast.preparation || "",
          },
          {
            meal: "Lunch",
            time: "12:30 PM",
            food: lunch.name,
            quantity: lunch.quantity || getDefaultQuantity("lunch"),
            calories: lunch.calories || lunchCalories,
            protein: lunch.protein || Math.round((lunchCalories * 0.3 * proteinMultiplier) / 4),
            carbs: lunch.carbs || Math.round((lunchCalories * 0.4 * carbMultiplier) / 4),
            fat: lunch.fat || Math.round((lunchCalories * 0.3 * fatMultiplier) / 9),
            tags: lunch.tags || [],
            description: lunch.description || "",
            ingredients: lunch.ingredients?.map((ing) => ing.name) || [],
            preparation: lunch.preparation || "",
          },
          {
            meal: "Dinner",
            time: "7:00 PM",
            food: dinner.name,
            quantity: dinner.quantity || getDefaultQuantity("dinner"),
            calories: dinner.calories || dinnerCalories,
            protein: dinner.protein || Math.round((dinnerCalories * 0.3 * proteinMultiplier) / 4),
            carbs: dinner.carbs || Math.round((dinnerCalories * 0.4 * carbMultiplier) / 4),
            fat: dinner.fat || Math.round((dinnerCalories * 0.3 * fatMultiplier) / 9),
            tags: dinner.tags || [],
            description: dinner.description || "",
            ingredients: dinner.ingredients?.map((ing) => ing.name) || [],
            preparation: dinner.preparation || "",
          },
          {
            meal: "Snack",
            time: "4:00 PM",
            food: snack.name,
            quantity: snack.quantity || getDefaultQuantity("snack"),
            calories: snack.calories || snackCalories,
            protein: snack.protein || Math.round((snackCalories * 0.3 * proteinMultiplier) / 4),
            carbs: snack.carbs || Math.round((snackCalories * 0.4 * carbMultiplier) / 4),
            fat: snack.fat || Math.round((snackCalories * 0.3 * fatMultiplier) / 9),
            tags: snack.tags || [],
            description: snack.description || "",
            ingredients: snack.ingredients?.map((ing) => ing.name) || [],
            preparation: snack.preparation || "",
          },
        ],
      }

      mealPlan.push(dayMeals)
    }

    return mealPlan
  }

  // Helper function to get default quantity based on meal type
  const getDefaultQuantity = (mealType: string): string => {
    switch (mealType) {
      case "breakfast":
        return "1 serving"
      case "lunch":
        return "1 plate"
      case "dinner":
        return "1 plate"
      case "snack":
        return "1 serving"
      default:
        return "1 serving"
    }
  }

  // Helper function to get default meals based on diet preference and meal type
  const getDefaultMeals = (preference: string, mealType: string): any[] => {
    // Default Indian vegetarian meals
    const indianVegetarianMeals = {
      breakfast: [
        {
          name: "Poha with Peanuts and Vegetables",
          quantity: "1 cup",
          tags: ["vegetarian", "indian-vegetarian", "high-fiber"],
          description: "A light and nutritious breakfast made with flattened rice, vegetables, and peanuts.",
          ingredients: [
            "Flattened rice (poha)",
            "Peanuts",
            "Onion",
            "Green peas",
            "Curry leaves",
            "Mustard seeds",
            "Turmeric",
            "Lemon juice",
          ],
          preparation:
            "Rinse poha, drain, and set aside. Heat oil, add mustard seeds, curry leaves, and turmeric. Add onions, peas, and peanuts. Mix in poha, salt, and lemon juice. Cook for 5 minutes.",
        },
        {
          name: "Upma with Mixed Vegetables",
          quantity: "1 cup",
          tags: ["vegetarian", "indian-vegetarian", "high-fiber"],
          description: "A savory semolina breakfast with mixed vegetables and spices.",
          ingredients: [
            "Semolina (rava)",
            "Mixed vegetables",
            "Onion",
            "Green chilies",
            "Ginger",
            "Curry leaves",
            "Mustard seeds",
            "Urad dal",
            "Chana dal",
          ],
          preparation:
            "Dry roast semolina. Heat oil, add mustard seeds, dals, curry leaves, and vegetables. Add water, bring to boil, add semolina, stir continuously until cooked.",
        },
        {
          name: "Moong Dal Chilla with Mint Chutney",
          quantity: "2 chillas",
          tags: ["vegetarian", "indian-vegetarian", "high-protein"],
          description: "A protein-rich pancake made with split yellow moong dal and spices.",
          ingredients: [
            "Yellow moong dal",
            "Green chilies",
            "Ginger",
            "Cumin powder",
            "Turmeric",
            "Coriander leaves",
            "Mint chutney",
          ],
          preparation:
            "Soak dal for 4 hours, grind to smooth batter with spices and herbs. Make thin pancakes on a hot griddle.",
        },
        {
          name: "Besan Chilla with Curd",
          quantity: "2 chillas, 1/2 cup curd",
          tags: ["vegetarian", "indian-vegetarian", "high-protein"],
          description: "A savory pancake made with gram flour, vegetables, and spices.",
          ingredients: [
            "Gram flour (besan)",
            "Onion",
            "Tomato",
            "Green chilies",
            "Coriander leaves",
            "Cumin powder",
            "Turmeric",
            "Curd",
          ],
          preparation:
            "Mix besan with water to make smooth batter, add chopped vegetables and spices. Make thin pancakes on a hot griddle. Serve with curd.",
        },
        {
          name: "Oats Idli with Sambar",
          quantity: "4 idlis, 1/2 cup sambar",
          tags: ["vegetarian", "indian-vegetarian", "high-fiber"],
          description: "A healthy twist to traditional idli made with oats and served with sambar.",
          ingredients: ["Oats", "Semolina", "Curd", "Carrot", "Green peas", "Mustard seeds", "Curry leaves", "Sambar"],
          preparation:
            "Dry roast oats, mix with semolina, curd, and vegetables. Steam in idli molds. Serve with sambar.",
        },
      ],
      lunch: [
        {
          name: "Roti, Dal, Rice, and Mixed Vegetable Sabzi",
          quantity: "2 rotis, 1/2 cup dal, 1/2 cup rice, 1/2 cup sabzi",
          tags: ["vegetarian", "indian-vegetarian", "balanced"],
          description: "A complete Indian thali with whole wheat flatbread, lentil curry, rice, and vegetable curry.",
          ingredients: ["Whole wheat flour", "Toor dal", "Rice", "Mixed vegetables", "Spices", "Ghee"],
          preparation:
            "Make rotis from whole wheat dough. Cook dal with spices. Prepare mixed vegetable curry. Serve with steamed rice.",
        },
        {
          name: "Rajma Chawal with Roti and Raita",
          quantity: "1/2 cup rajma, 1/2 cup rice, 2 rotis, 1/4 cup raita",
          tags: ["vegetarian", "indian-vegetarian", "high-protein"],
          description: "Kidney bean curry served with rice, whole wheat flatbread, and yogurt side dish.",
          ingredients: ["Kidney beans", "Rice", "Whole wheat flour", "Onion", "Tomato", "Spices", "Yogurt", "Cucumber"],
          preparation: "Cook rajma with onion, tomato, and spices. Serve with steamed rice, rotis, and cucumber raita.",
        },
        {
          name: "Chole Bhature with Pickle and Onions",
          quantity: "1/2 cup chole, 2 bhature, salad",
          tags: ["vegetarian", "indian-vegetarian", "high-protein"],
          description: "Spicy chickpea curry served with fried bread, pickle, and onion salad.",
          ingredients: ["Chickpeas", "All-purpose flour", "Onion", "Tomato", "Spices", "Pickle", "Onion salad"],
          preparation:
            "Cook chickpeas with onion, tomato, and spices. Make bhature dough, deep fry. Serve with pickle and onion salad.",
        },
        {
          name: "Palak Paneer with Roti and Jeera Rice",
          quantity: "1/2 cup palak paneer, 2 rotis, 1/2 cup rice",
          tags: ["vegetarian", "indian-vegetarian", "high-protein"],
          description: "Cottage cheese cubes in spinach gravy served with whole wheat flatbread and cumin rice.",
          ingredients: [
            "Spinach",
            "Cottage cheese (paneer)",
            "Whole wheat flour",
            "Rice",
            "Cumin seeds",
            "Spices",
            "Cream",
          ],
          preparation:
            "Blanch spinach, blend, cook with spices. Add paneer cubes. Make rotis. Prepare jeera rice with cumin tempering.",
        },
        {
          name: "Dal Khichdi with Kadhi and Papad",
          quantity: "1 cup khichdi, 1/2 cup kadhi, 1 papad",
          tags: ["vegetarian", "indian-vegetarian", "easy-digestion"],
          description: "A comforting one-pot meal of rice and lentils served with yogurt curry and crispy papad.",
          ingredients: ["Rice", "Moong dal", "Yogurt", "Gram flour (besan)", "Spices", "Ghee", "Papad"],
          preparation:
            "Cook rice and dal together with spices. Prepare kadhi by cooking besan and yogurt mixture with spices. Roast papad.",
        },
      ],
      dinner: [
        {
          name: "Roti, Dal, and Seasonal Vegetable Sabzi",
          quantity: "2 rotis, 1/2 cup dal, 1/2 cup sabzi",
          tags: ["vegetarian", "indian-vegetarian", "light"],
          description: "A light dinner with whole wheat flatbread, lentil curry, and seasonal vegetable curry.",
          ingredients: ["Whole wheat flour", "Moong dal", "Seasonal vegetables", "Spices", "Ghee"],
          preparation: "Make rotis from whole wheat dough. Cook dal with spices. Prepare seasonal vegetable curry.",
        },
        {
          name: "Vegetable Pulao with Raita",
          quantity: "1 cup pulao, 1/2 cup raita",
          tags: ["vegetarian", "indian-vegetarian", "one-pot"],
          description: "A fragrant rice dish cooked with mixed vegetables and spices, served with yogurt side dish.",
          ingredients: ["Basmati rice", "Mixed vegetables", "Whole spices", "Yogurt", "Cucumber", "Mint leaves"],
          preparation: "Sauté vegetables with spices, add rice and water, cook until done. Serve with cucumber raita.",
        },
        {
          name: "Masala Dosa with Sambar and Coconut Chutney",
          quantity: "1 dosa, 1/2 cup sambar, 2 tbsp chutney",
          tags: ["vegetarian", "indian-vegetarian", "south-indian"],
          description:
            "A crispy rice and lentil crepe filled with spiced potato filling, served with lentil soup and coconut chutney.",
          ingredients: ["Rice", "Urad dal", "Potato", "Onion", "Spices", "Coconut", "Toor dal"],
          preparation:
            "Ferment rice and dal batter, make thin crepes. Prepare potato filling with spices. Serve with sambar and coconut chutney.",
        },
        {
          name: "Paneer Butter Masala with Roti and Jeera Rice",
          quantity: "1/2 cup curry, 2 rotis, 1/2 cup rice",
          tags: ["vegetarian", "indian-vegetarian", "rich"],
          description: "Cottage cheese cubes in rich tomato gravy served with whole wheat flatbread and cumin rice.",
          ingredients: [
            "Cottage cheese (paneer)",
            "Tomato",
            "Cream",
            "Butter",
            "Spices",
            "Whole wheat flour",
            "Rice",
            "Cumin seeds",
          ],
          preparation:
            "Cook tomato gravy with spices, add paneer and cream. Make rotis. Prepare jeera rice with cumin tempering.",
        },
        {
          name: "Vegetable Khichdi with Kadhi",
          quantity: "1 cup khichdi, 1/2 cup kadhi",
          tags: ["vegetarian", "indian-vegetarian", "easy-digestion"],
          description: "A light and digestible one-pot meal of rice, lentils, and vegetables served with yogurt curry.",
          ingredients: ["Rice", "Moong dal", "Mixed vegetables", "Yogurt", "Gram flour (besan)", "Spices", "Ghee"],
          preparation:
            "Cook rice, dal, and vegetables together with spices. Prepare kadhi by cooking besan and yogurt mixture with spices.",
        },
      ],
      snack: [
        {
          name: "Masala Chai with Rusk",
          quantity: "1 cup chai, 2 rusks",
          tags: ["vegetarian", "indian-vegetarian", "light"],
          description: "Spiced Indian tea served with crispy twice-baked bread.",
          ingredients: ["Tea leaves", "Milk", "Ginger", "Cardamom", "Cinnamon", "Sugar", "Rusk"],
          preparation: "Boil water with tea leaves and spices, add milk and sugar, simmer. Serve with rusk.",
        },
        {
          name: "Dhokla with Green Chutney",
          quantity: "2 pieces dhokla, 1 tbsp chutney",
          tags: ["vegetarian", "indian-vegetarian", "steamed"],
          description:
            "A steamed savory cake made from fermented rice and chickpea flour, served with spicy green chutney.",
          ingredients: [
            "Rice flour",
            "Gram flour (besan)",
            "Yogurt",
            "Eno fruit salt",
            "Green chilies",
            "Coriander leaves",
            "Mustard seeds",
          ],
          preparation:
            "Mix flours with yogurt and water, ferment, add Eno, steam. Prepare tempering and green chutney.",
        },
        {
          name: "Bhel Puri",
          quantity: "1 cup",
          tags: ["vegetarian", "indian-vegetarian", "chaat"],
          description: "A popular street food made with puffed rice, vegetables, and tangy chutneys.",
          ingredients: [
            "Puffed rice",
            "Sev",
            "Onion",
            "Tomato",
            "Potato",
            "Tamarind chutney",
            "Mint chutney",
            "Lemon juice",
          ],
          preparation: "Mix puffed rice with vegetables, add chutneys and lemon juice just before serving.",
        },
        {
          name: "Roasted Makhana (Foxnuts)",
          quantity: "1/4 cup",
          tags: ["vegetarian", "indian-vegetarian", "low-calorie"],
          description: "A light and nutritious snack of roasted lotus seeds.",
          ingredients: ["Foxnuts (makhana)", "Ghee", "Rock salt", "Black pepper"],
          preparation: "Roast makhana in ghee until crispy, sprinkle with rock salt and black pepper.",
        },
        {
          name: "Vegetable Cutlet with Mint Chutney",
          quantity: "2 cutlets, 1 tbsp chutney",
          tags: ["vegetarian", "indian-vegetarian", "evening-snack"],
          description: "Crispy patties made with mixed vegetables and spices, served with mint chutney.",
          ingredients: [
            "Potato",
            "Mixed vegetables",
            "Bread crumbs",
            "Spices",
            "Mint",
            "Coriander leaves",
            "Green chilies",
          ],
          preparation:
            "Mash boiled vegetables with spices, shape into patties, coat with bread crumbs, shallow fry. Serve with mint chutney.",
        },
      ],
    }

    // Default vegetarian meals
    const vegetarianMeals = {
      breakfast: [
        {
          name: "Greek Yogurt Parfait with Berries and Granola",
          quantity: "1 cup yogurt, 1/2 cup berries, 1/4 cup granola",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A protein-rich breakfast with probiotics, antioxidants, and fiber.",
          ingredients: ["Greek yogurt", "Mixed berries", "Low-sugar granola", "Honey", "Chia seeds"],
          preparation:
            "Layer yogurt, berries, and granola in a glass. Drizzle with honey and sprinkle with chia seeds.",
        },
        {
          name: "Spinach and Feta Omelette with Whole Grain Toast",
          quantity: "3 eggs, 1 cup spinach, 30g feta, 1 slice toast",
          tags: ["vegetarian", "high-protein", "low-carb"],
          description: "A nutrient-dense breakfast rich in protein, iron, and calcium.",
          ingredients: ["Eggs", "Fresh spinach", "Feta cheese", "Olive oil", "Whole grain bread", "Avocado (optional)"],
          preparation: "Sauté spinach, whisk eggs, pour over spinach, add feta, fold when set. Serve with toast.",
        },
        {
          name: "Overnight Oats with Almond Butter and Banana",
          quantity: "1/2 cup oats, 1 tbsp almond butter, 1 banana",
          tags: ["vegetarian", "high-fiber", "heart-healthy"],
          description: "A fiber-rich breakfast that provides sustained energy throughout the morning.",
          ingredients: ["Rolled oats", "Almond milk", "Almond butter", "Banana", "Cinnamon", "Maple syrup"],
          preparation: "Mix oats and milk, refrigerate overnight. Top with almond butter, sliced banana, and cinnamon.",
        },
        {
          name: "Avocado Toast with Poached Eggs",
          quantity: "2 slices bread, 1/2 avocado, 2 eggs",
          tags: ["vegetarian", "high-protein", "heart-healthy"],
          description: "A balanced breakfast with healthy fats, protein, and complex carbohydrates.",
          ingredients: ["Whole grain bread", "Avocado", "Eggs", "Cherry tomatoes", "Microgreens", "Red pepper flakes"],
          preparation: "Toast bread, spread mashed avocado, top with poached eggs, tomatoes, and seasonings.",
        },
        {
          name: "Protein-Packed Smoothie Bowl",
          quantity: "1 bowl (approx. 16 oz)",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A nutrient-dense breakfast that's perfect for post-workout recovery.",
          ingredients: [
            "Protein powder",
            "Frozen berries",
            "Banana",
            "Spinach",
            "Almond milk",
            "Granola",
            "Chia seeds",
          ],
          preparation:
            "Blend protein powder, fruits, spinach, and milk. Pour into bowl and top with granola and seeds.",
        },
      ],
      lunch: [
        {
          name: "Mediterranean Chickpea Salad",
          quantity: "1 large bowl (approx. 2 cups)",
          tags: ["vegetarian", "high-fiber", "heart-healthy", "mediterranean"],
          description: "A protein-rich salad with Mediterranean flavors and heart-healthy fats.",
          ingredients: [
            "Chickpeas",
            "Cucumber",
            "Cherry tomatoes",
            "Red onion",
            "Feta cheese",
            "Kalamata olives",
            "Olive oil",
            "Lemon juice",
            "Herbs",
          ],
          preparation:
            "Combine all ingredients in a bowl, dress with olive oil and lemon juice, season with herbs and spices.",
        },
        {
          name: "Quinoa Buddha Bowl with Roasted Vegetables",
          quantity: "1 bowl (approx. 2 cups)",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A balanced bowl with complete proteins, complex carbs, and essential nutrients.",
          ingredients: [
            "Quinoa",
            "Roasted sweet potato",
            "Roasted broccoli",
            "Avocado",
            "Chickpeas",
            "Tahini dressing",
          ],
          preparation:
            "Arrange quinoa, roasted vegetables, and chickpeas in a bowl. Top with avocado and drizzle with tahini dressing.",
        },
      ],
    }

    // Default vegan meals
    const veganMeals = {
      breakfast: [
        {
          name: "Overnight Oats with Chia Seeds and Berries",
          quantity: "1/2 cup oats, 1 tbsp chia, 1/2 cup berries",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A fiber-rich breakfast that provides sustained energy throughout the morning.",
          ingredients: ["Rolled oats", "Almond milk", "Chia seeds", "Mixed berries", "Maple syrup", "Cinnamon"],
          preparation: "Mix oats, milk, and chia seeds, refrigerate overnight. Top with berries and maple syrup.",
        },
      ],
    }

    // Default keto meals
    const ketoMeals = {
      breakfast: [
        {
          name: "Avocado and Bacon Omelette",
          quantity: "3 eggs, 1/2 avocado, 2 slices bacon",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A high-fat, low-carb breakfast that provides sustained energy.",
          ingredients: ["Eggs", "Avocado", "Bacon", "Cheddar cheese", "Butter", "Salt", "Pepper"],
          preparation:
            "Cook bacon, set aside. Whisk eggs, pour into pan, add cheese, avocado, and crumbled bacon. Fold and serve.",
        },
      ],
    }

    // Default paleo/omnivore meals
    const paleoMeals = {
      breakfast: [
        {
          name: "Scrambled Eggs with Bacon and Avocado",
          quantity: "3 eggs, 2 slices bacon, 1/2 avocado",
          tags: ["high-protein", "low-carb", "paleo"],
          description: "A protein-rich breakfast with healthy fats and minimal carbs.",
          ingredients: ["Eggs", "Bacon", "Avocado", "Chives", "Salt", "Pepper"],
          preparation: "Cook bacon, scramble eggs, serve with sliced avocado and chopped chives.",
        },
      ],
    }

    // Select appropriate meal options based on diet preference and meal type
    switch (preference) {
      case "indian-vegetarian":
        return indianVegetarianMeals[mealType] || []
      case "vegetarian":
        return vegetarianMeals[mealType] || []
      case "vegan":
        return veganMeals[mealType] || []
      case "keto":
        return ketoMeals[mealType] || []
      case "paleo":
      case "omnivore":
      default:
        return paleoMeals[mealType] || []
    }
  }

  const loadMealPlan = (plan: any) => {
    setDietPreference(plan.dietPreference || "omnivore")
    setDietGoal(plan.dietGoal || "weight-loss")
    setCalorieGoal(plan.calorieGoal || 2000)
    setDietPeriod(plan.dietPeriod || "one-week")
    setSelectedMedicalConditions(plan.medicalConditions || ["none"])
    setMealPlan(plan.mealPlan || [])

    // Load goal weight if available
    if (plan.goalWeight) {
      setGoalWeight(plan.goalWeight)

      // Calculate weight difference if user data is available
      if (userData?.weight) {
        calculateWeightDifference(userData.weight, plan.goalWeight)
      }
    }

    toast({
      title: "Meal plan loaded",
      description: "Your saved meal plan has been loaded",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Personalized Meal Plan</CardTitle>
          <CardDescription>Create a customized meal plan based on your dietary preferences and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate Plan</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="generate" className="space-y-4 mt-4">
              {/* Weight and Calorie Goal Section */}
              {userData?.weight && (
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-orange-500" />
                      Weight & Calorie Calculator
                    </CardTitle>
                    <CardDescription>
                      Set your goal weight to automatically calculate your daily calorie needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Current vs Goal Weight Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Weight Status</h4>

                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <div className="text-2xl font-bold">{userData.weight} kg</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Current Weight</div>
                          </div>
                          <div className="text-2xl font-bold">→</div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{goalWeight} kg</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Goal Weight</div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Current: {userData.weight} kg</span>
                            <span>Goal: {goalWeight} kg</span>
                          </div>
                          <Progress
                            value={weightProgress}
                            className="h-2"
                            indicatorClassName={
                              weightDifference > 0
                                ? "bg-green-500"
                                : weightDifference < 0
                                  ? "bg-blue-500"
                                  : "bg-orange-500"
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-2 ${weightDifference > 0 ? "bg-green-500" : weightDifference < 0 ? "bg-blue-500" : "bg-orange-500"}`}
                            ></div>
                            <span className="text-sm font-medium">
                              {weightDifference > 0
                                ? `Lose ${weightDifference.toFixed(1)} kg`
                                : weightDifference < 0
                                  ? `Gain ${Math.abs(weightDifference).toFixed(1)} kg`
                                  : "Maintain weight"}
                            </span>
                          </div>
                          {calorieCalculationDetails.estimatedDays > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Est. time:{" "}
                              {calorieCalculationDetails.estimatedDays > 180
                                ? "6+ months"
                                : calorieCalculationDetails.estimatedDays > 30
                                  ? `${Math.round(calorieCalculationDetails.estimatedDays / 30)} months`
                                  : `${calorieCalculationDetails.estimatedDays} days`}
                            </span>
                          )}
                        </div>

                        {/* BMI Status */}
                        {getBmiStatus() && (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">BMI Status:</span>
                              <span className={`text-sm font-medium ${getBmiStatus()?.color}`}>
                                {getBmiStatus()?.status}
                              </span>
                            </div>
                            {getBmiStatus()?.recommendation !== dietGoal && (
                              <div className="mt-1 text-xs text-orange-500">
                                Recommended:{" "}
                                {getBmiStatus()
                                  ?.recommendation.split("-")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Calorie Calculation
                        </h4>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-2xl font-bold">{calorieGoal}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Daily Calorie Goal</div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                calorieCalculationDetails.goalCalories < calorieCalculationDetails.maintenanceCalories
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : calorieCalculationDetails.goalCalories >
                                      calorieCalculationDetails.maintenanceCalories
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              }`}
                            >
                              {calorieCalculationDetails.goalCalories < calorieCalculationDetails.maintenanceCalories
                                ? `${calorieCalculationDetails.maintenanceCalories - calorieCalculationDetails.goalCalories} cal deficit`
                                : calorieCalculationDetails.goalCalories > calorieCalculationDetails.maintenanceCalories
                                  ? `${calorieCalculationDetails.goalCalories - calorieCalculationDetails.maintenanceCalories} cal surplus`
                                  : "Maintenance"}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">BMR:</span>
                              <span>{calorieCalculationDetails.bmr} calories</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">TDEE (Maintenance):</span>
                              <span>{calorieCalculationDetails.maintenanceCalories} calories</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Activity Level:</span>
                              <span className="capitalize">{userData.activityLevel || "moderate"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Diet Period:</span>
                              <span className="capitalize">{dietPeriod.replace(/-/g, " ")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Goal Weight and Calorie Input Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="goal-weight" className="text-sm font-medium">
                            Goal Weight (kg)
                          </Label>
                          <div className="flex">
                            <Input
                              id="goal-weight"
                              type="number"
                              value={goalWeight}
                              onChange={(e) => {
                                const newGoalWeight = Number.parseFloat(e.target.value) || userData.weight
                                setGoalWeight(newGoalWeight)
                                setUserManuallySetGoalWeight(true)
                                if (userData.weight) {
                                  calculateWeightDifference(userData.weight, newGoalWeight)
                                  // Force immediate recalculation
                                  setTimeout(() => {
                                    calculateCalorieGoal()
                                  }, 0)
                                }
                              }}
                              min={30}
                              max={200}
                              step={0.5}
                              className="rounded-r-none"
                            />
                            <div className="flex">
                              <Button
                                variant="outline"
                                className="rounded-l-none border-l-0 px-2"
                                onClick={() => {
                                  const newGoalWeight = goalWeight - 0.5
                                  setGoalWeight(newGoalWeight)
                                  setUserManuallySetGoalWeight(true)
                                  if (userData.weight) {
                                    calculateWeightDifference(userData.weight, newGoalWeight)
                                    // Force immediate recalculation
                                    setTimeout(() => {
                                      calculateCalorieGoal()
                                    }, 0)
                                  }
                                }}
                              >
                                -
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-l-none border-l-0 px-2"
                                onClick={() => {
                                  const newGoalWeight = goalWeight + 0.5
                                  setGoalWeight(newGoalWeight)
                                  setUserManuallySetGoalWeight(true)
                                  if (userData.weight) {
                                    calculateWeightDifference(userData.weight, newGoalWeight)
                                    // Force immediate recalculation
                                    setTimeout(() => {
                                      calculateCalorieGoal()
                                    }, 0)
                                  }
                                }}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="calorie-goal" className="text-sm font-medium">
                            Daily Calorie Goal
                          </Label>
                          <div className="flex">
                            <Input
                              id="calorie-goal"
                              type="number"
                              value={calorieGoal}
                              onChange={(e) => setCalorieGoal(Number.parseInt(e.target.value) || 2000)}
                              min={1200}
                              max={4000}
                              step={50}
                              className="rounded-r-none"
                            />
                            <Button
                              variant="outline"
                              className="rounded-l-none border-l-0"
                              onClick={calculateCalorieGoal}
                              disabled={isCalculating}
                            >
                              {isCalculating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Calculator className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diet-preference">Diet Preference</Label>
                  <Select value={dietPreference} onValueChange={setDietPreference}>
                    <SelectTrigger id="diet-preference">
                      <SelectValue placeholder="Select diet preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Omnivore</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                      <SelectItem value="indian-vegetarian">Indian Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-goal">Diet Goal</Label>
                  <Select value={dietGoal} onValueChange={setDietGoal}>
                    <SelectTrigger id="diet-goal">
                      <SelectValue placeholder="Select diet goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem value="weight-maintenance">Weight Maintenance</SelectItem>
                      <SelectItem value="weight-gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                      <SelectItem value="general-health">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-period">Diet Period</Label>
                  <Select value={dietPeriod} onValueChange={setDietPeriod}>
                    <SelectTrigger id="diet-period">
                      <SelectValue placeholder="Select diet period" />
                    </SelectTrigger>
                    <SelectContent>
                      {dietPeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Medical Conditions Section */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Medical Conditions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2 border rounded-md p-4 bg-white dark:bg-gray-800">
                  {medicalConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`condition-${condition.id}`}
                        checked={selectedMedicalConditions.includes(condition.id)}
                        onCheckedChange={(checked) => handleMedicalConditionChange(condition.id, checked === true)}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`condition-${condition.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        {condition.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Select any medical conditions to customize your meal plan accordingly.
                </p>
              </div>

              <Button onClick={generateMealPlan} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Meal Plan"
                )}
              </Button>
            </TabsContent>
            <TabsContent value="history">
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mealPlanHistory.length > 0 ? (
                <div className="space-y-4">
                  {mealPlanHistory.map((plan, index) => (
                    <Card key={plan.id || index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <CardTitle className="text-base">
                              {plan.dietPreference.charAt(0).toUpperCase() + plan.dietPreference.slice(1)} Diet
                            </CardTitle>
                            <CardDescription>
                              {new Date(plan.createdAt.seconds * 1000).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => loadMealPlan(plan)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            Goal:{" "}
                            {plan.dietGoal
                              .split("-")
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </div>
                          <div>Calories: {plan.calorieGoal}</div>
                          <div>Period: {plan.dietPeriod.replace("-", " ")}</div>
                          <div>
                            Meals: {plan.mealPlan?.reduce((acc: number, day: any) => acc + day.meals.length, 0) || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No meal plan history found. Generate your first meal plan!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {mealPlan.length > 0 && (
        <Card id="meal-plan-section">
          <CardHeader>
            <CardTitle>Your Personalized Meal Plan</CardTitle>
            <CardDescription>
              Based on your {dietPreference.replace("-", " ")} diet preference and {dietGoal.replace("-", " ")} goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {mealPlan.map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">{day.day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {day.meals.map((meal, mealIndex) => (
                      <Card key={mealIndex} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">{meal.meal}</CardTitle>
                            {meal.time && <span className="text-sm text-muted-foreground">{meal.time}</span>}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div>
                            <h4 className="font-medium text-lg">{meal.food}</h4>
                            <p className="text-sm text-muted-foreground">{meal.quantity}</p>

                            {/* Meal tags */}
                            {meal.tags && meal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {meal.tags.map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    className={`text-xs ${dietTags[tag]?.color || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}
                                  >
                                    {dietTags[tag]?.label || tag.replace("-", " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Meal description */}
                            {meal.description && (
                              <p className="text-sm mt-2 text-muted-foreground">{meal.description}</p>
                            )}
                          </div>

                          {/* Nutritional information */}
                          <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="font-semibold">{meal.calories}</p>
                              <p className="text-xs text-muted-foreground">Calories</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.protein}g</p>
                              <p className="text-xs text-muted-foreground">Protein</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.carbs}g</p>
                              <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.fat}g</p>
                              <p className="text-xs text-muted-foreground">Fat</p>
                            </div>
                          </div>

                          {/* Ingredients and preparation */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="mt-2 w-full">
                                  <Info className="h-4 w-4 mr-2" />
                                  View Recipe Details
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-4" side="bottom">
                                <div className="space-y-2">
                                  <h5 className="font-medium">Ingredients:</h5>
                                  <ul className="list-disc pl-5 text-sm">
                                    {meal.ingredients?.map((ingredient: string, i: number) => (
                                      <li key={i}>{ingredient}</li>
                                    ))}
                                  </ul>

                                  <h5 className="font-medium pt-2">Preparation:</h5>
                                  <p className="text-sm">{meal.preparation}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <MealPlanPdf
              mealPlan={mealPlan}
              dietPreference={dietPreference}
              dietGoal={dietGoal}
              calorieGoal={calorieGoal}
              dietPeriod={dietPeriod}
            />
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
