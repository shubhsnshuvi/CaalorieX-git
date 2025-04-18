"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Clock, Calculator, InfoIcon } from "lucide-react"
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  collectionGroup,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MealPlanPdf } from "@/components/meal-plan-pdf"
import { getFoodsForMealType, calculatePortionSize, calculateNutritionForPortion, getFoodDetails } from "@/lib/usda-api"
import { calculateIFCTPortionSize, calculateIFCTNutritionForPortion } from "@/lib/ifct-api"

// Import the new utility functions
import { getFoodsForMealTypeFromAllSources } from "@/lib/firestore-utils"

const formSchema = z.object({
  dietPreference: z.enum(
    [
      "vegetarian",
      "vegan",
      "non-veg",
      "eggetarian",
      "gluten-free",
      "intermittent-fasting",
      "blood-type",
      "indian-vegetarian",
      "hindu-fasting",
      "jain-diet",
      "sattvic-diet",
      "indian-regional",
    ],
    {
      required_error: "Please select a diet preference.",
    },
  ),
  dietGoal: z.enum(["weight-loss", "weight-gain", "muscle-building", "lean-mass", "keto", "maintenance"], {
    required_error: "Please select a diet goal.",
  }),
  calorieGoal: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
    message: "Please enter a valid calorie goal.",
  }),
  dietPeriod: z.enum(["4-weeks", "2-months", "3-months", "4-months", "5-months", "6-months"], {
    required_error: "Please select a diet period.",
  }),
  goalWeight: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0), {
      message: "Please enter a valid goal weight in kg.",
    }),
})

// Calculate TDEE (Total Daily Energy Expenditure)
const calculateTDEE = (weight: number, height: number, age: number, gender: string, activityLevel: string) => {
  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr = 0
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }

  // Apply activity multiplier
  const activityMultipliers: { [key: string]: number } = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise/sports 1-3 days/week
    moderate: 1.55, // Moderate exercise/sports 3-5 days/week
    active: 1.725, // Hard exercise/sports 6-7 days a week
    "extra-active": 1.9, // Very hard exercise, physical job or training twice a day
  }

  const multiplier = activityMultipliers[activityLevel] || 1.55
  return Math.round(bmr * multiplier)
}

// Calculate daily calorie goal based on TDEE, goal weight, and diet period
const calculateCalorieGoal = (
  currentWeight: number,
  goalWeight: number,
  tdee: number,
  dietPeriod: string,
  dietGoal: string,
) => {
  // Convert diet period to days
  const periodToDays: { [key: string]: number } = {
    "4-weeks": 28,
    "2-months": 60,
    "3-months": 90,
    "4-months": 120,
    "5-months": 150,
    "6-months": 180,
  }

  const days = periodToDays[dietPeriod] || 28

  // Calculate weight difference
  const weightDiff = goalWeight - currentWeight

  // For maintenance goals
  if (dietGoal === "lean-mass" || dietGoal === "muscle-building" || dietGoal === "keto" || dietGoal === "maintenance") {
    if (dietGoal === "muscle-building") {
      return tdee + 300 // Slight surplus for muscle building
    } else if (dietGoal === "keto") {
      return Math.round(tdee * 0.9) // Slight deficit for keto
    } else if (dietGoal === "maintenance") {
      return tdee // Exact maintenance calories
    }
    return tdee // Maintenance for lean mass
  }

  // For weight loss/gain goals
  if (weightDiff === 0) {
    return tdee // Maintenance
  }

  // Calculate daily calorie adjustment needed
  // 1 kg of body weight = approximately 7700 calories
  const totalCalorieAdjustment = weightDiff * 7700
  const dailyCalorieAdjustment = Math.round(totalCalorieAdjustment / days)

  // Cap the daily adjustment to reasonable limits
  let adjustedCalories = tdee + dailyCalorieAdjustment

  // Safety limits: don't go below 1200 for women or 1500 for men
  // Don't exceed 1000 calorie surplus or deficit
  if (dailyCalorieAdjustment > 0) {
    adjustedCalories = Math.min(tdee + 1000, adjustedCalories)
  } else {
    adjustedCalories = Math.max(1200, adjustedCalories)
    adjustedCalories = Math.max(tdee - 1000, adjustedCalories)
  }

  return Math.round(adjustedCalories)
}

// Function to fetch custom foods and meal templates from Firestore
const fetchCustomFoodsAndTemplates = async (
  mealType: string,
  dietPreference: string,
  allergyList: string[],
): Promise<any[]> => {
  try {
    const results: any[] = []

    // Fetch custom foods from foodDatabase collection
    const foodDbRef = collectionGroup(db, "foodDatabase")
    const foodDbSnapshot = await getDocs(foodDbRef)

    foodDbSnapshot.forEach((doc) => {
      const data = doc.data()
      const foodName = data.name || data.foodName || ""
      const category = (data.category || data.foodCategory || "").toLowerCase()

      // Check if the food matches the meal type and diet preference
      const matchesMealType =
        category.includes(mealType.toLowerCase()) ||
        (mealType === "Breakfast" && category.includes("breakfast")) ||
        (mealType === "Lunch" && category.includes("lunch")) ||
        (mealType === "Dinner" && category.includes("dinner")) ||
        (mealType === "Snack" && category.includes("snack"))

      // Check if the food matches the diet preference
      const matchesDietPreference =
        dietPreference === "non-veg" || // non-veg can eat anything
        (dietPreference === "vegetarian" && data.isVegetarian) ||
        (dietPreference === "vegan" && data.isVegan) ||
        (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
        (dietPreference === "gluten-free" && !data.containsGluten) ||
        (dietPreference === "jain-diet" && !data.containsOnionGarlic && !data.containsRootVegetables)

      // Check if the food contains any allergens
      const hasNoAllergies = !allergyList.some(
        (allergy) =>
          foodName.toLowerCase().includes(allergy) ||
          (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
      )

      if (matchesMealType && matchesDietPreference && hasNoAllergies) {
        results.push({
          id: doc.id,
          name: foodName,
          description: data.description || "",
          nutrients: {
            calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
            protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
            carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
            fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
          },
          source: "custom",
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
        })
      }
    })

    // Fetch meal templates that match the meal type
    const templatesRef = collectionGroup(db, "meal_templates")
    const templatesSnapshot = await getDocs(templatesRef)

    templatesSnapshot.forEach((doc) => {
      const data = doc.data()
      const templateName = data.name || data.templateName || ""
      const mealTypeCategory = (data.mealType || "").toLowerCase()

      // Check if the template matches the meal type
      const matchesMealType =
        mealTypeCategory.includes(mealType.toLowerCase()) ||
        (mealType === "Breakfast" && mealTypeCategory.includes("breakfast")) ||
        (mealType === "Lunch" && mealTypeCategory.includes("lunch")) ||
        (mealType === "Dinner" && mealTypeCategory.includes("dinner")) ||
        (mealType === "Snack" && mealTypeCategory.includes("snack"))

      // Check if the template matches the diet preference
      const matchesDietPreference =
        dietPreference === "non-veg" || // non-veg can eat anything
        (dietPreference === "vegetarian" && data.isVegetarian) ||
        (dietPreference === "vegan" && data.isVegan) ||
        (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
        (dietPreference === "gluten-free" && !data.containsGluten)

      // Check if the template contains any allergens
      const hasNoAllergies = !allergyList.some(
        (allergy) =>
          templateName.toLowerCase().includes(allergy) ||
          (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
      )

      if (matchesMealType && matchesDietPreference && hasNoAllergies) {
        results.push({
          id: doc.id,
          name: templateName,
          description: data.description || "",
          nutrients: {
            calories: data.totalNutrition?.calories || 0,
            protein: data.totalNutrition?.protein || 0,
            carbohydrates: data.totalNutrition?.carbs || 0,
            fat: data.totalNutrition?.fat || 0,
          },
          source: "template",
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
        })
      }
    })

    return results
  } catch (error) {
    console.error("Error fetching custom foods and templates:", error)
    return []
  }
}

// Update the generateUsdaMealPlan function to use both databases
const generateUsdaMealPlan = async (
  dietPreference: string,
  dietGoal: string,
  calorieGoal: number,
  dietPeriod: string,
  medicalConditions: string[] = [],
  allergies = "",
  activityLevel = "moderate",
) => {
  // We'll use the API proxy route instead of direct API access
  // No need to check for API key here

  const meals = ["Breakfast", "Lunch", "Dinner", "Snack"]
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Calculate target calories per meal
  const breakfastCalories = Math.round(calorieGoal * 0.25) // 25% of daily calories
  const lunchCalories = Math.round(calorieGoal * 0.35) // 35% of daily calories
  const dinnerCalories = Math.round(calorieGoal * 0.3) // 30% of daily calories
  const snackCalories = Math.round(calorieGoal * 0.1) // 10% of daily calories

  const mealCalories = {
    Breakfast: breakfastCalories,
    Lunch: lunchCalories,
    Dinner: dinnerCalories,
    Snack: snackCalories,
  }

  // Parse allergies to exclude foods
  const allergyList = allergies
    ? allergies
        .toLowerCase()
        .split(",")
        .map((item) => item.trim())
    : []

  // Determine if we should prefer Indian foods based on diet preference
  const preferIndianFoods = [
    "indian-vegetarian",
    "hindu-fasting",
    "jain-diet",
    "sattvic-diet",
    "indian-regional",
  ].includes(dietPreference)

  // Generate meal plan for each day
  const mealPlan = await Promise.all(
    days.map(async (day) => {
      // Generate meals for the day
      const dayMeals = await Promise.all(
        meals.map(async (meal) => {
          try {
            // Skip breakfast for intermittent fasting
            if (dietPreference === "intermittent-fasting" && meal === "Breakfast") {
              return null
            }

            // Decide which database to use based on preference and randomness
            // For Indian diet preferences, use IFCT more often
            const useIFCT = preferIndianFoods
              ? Math.random() < 0.8 // 80% chance for Indian preferences
              : Math.random() < 0.3 // 30% chance for other preferences

            let food
            let portion
            let nutrition
            let source

            // Try to get food from the preferred database first
            try {
              // First, try to get foods from all sources
              const allFoods = await getFoodsForMealTypeFromAllSources(meal, dietPreference, allergyList)

              // Prioritize custom foods and templates (50% chance)
              const customFoodsAndTemplates = allFoods.filter((f) => f.source === "custom" || f.source === "template")
              const ifctFoods = allFoods.filter((f) => f.source === "ifct")

              if (customFoodsAndTemplates.length > 0 && Math.random() < 0.5) {
                // Select a random custom food or template
                food = customFoodsAndTemplates[Math.floor(Math.random() * customFoodsAndTemplates.length)]

                // Calculate portion size based on source
                if (food.source === "template") {
                  // For templates, use the predefined portion
                  portion = {
                    amount: 1,
                    unit: "serving",
                    description: "1 serving",
                  }

                  // Use the template's nutrition values directly
                  nutrition = {
                    calories: food.totalNutrition?.calories || 0,
                    protein: food.totalNutrition?.protein || 0,
                    carbs: food.totalNutrition?.carbs || 0,
                    fat: food.totalNutrition?.fat || 0,
                  }
                } else {
                  // For custom foods, calculate portion size
                  portion = {
                    amount: 100,
                    unit: "g",
                    description: "1 serving",
                  }

                  // Calculate nutrition based on portion
                  nutrition = {
                    calories: food.nutrients?.calories || food.nutritionalInfo?.calories || 0,
                    protein: food.nutrients?.protein || food.nutritionalInfo?.protein || 0,
                    carbs: food.nutrients?.carbohydrates || food.nutritionalInfo?.carbs || 0,
                    fat: food.nutrients?.fat || food.nutritionalInfo?.fat || 0,
                  }
                }

                source = food.source
              } else if (ifctFoods.length > 0 && useIFCT) {
                // Use IFCT foods if available and preferred
                food = ifctFoods[Math.floor(Math.random() * ifctFoods.length)]

                // Calculate portion size
                portion = calculateIFCTPortionSize(food, dietGoal, meal)

                // Calculate nutrition
                nutrition = calculateIFCTNutritionForPortion(food, portion.amount)

                source = "ifct"
              } else {
                // Fall back to USDA
                throw new Error("Trying USDA database instead")
              }
            } catch (primaryError) {
              // If the preferred database fails, try the other one
              try {
                console.log(`Falling back to USDA database: ${primaryError.message}`)

                // Use USDA database
                const foods = await getFoodsForMealType(meal, dietPreference)

                // Filter out foods with allergies
                const filteredFoods = foods.filter((food) => {
                  const description = food.description?.toLowerCase() || ""
                  return !allergyList.some((allergy) => description.includes(allergy))
                })

                if (filteredFoods.length === 0) {
                  throw new Error(`No suitable foods found for ${meal}`)
                }

                // Select a random food
                food = filteredFoods[Math.floor(Math.random() * filteredFoods.length)]

                // Get detailed nutritional information for the selected food
                try {
                  const detailedFood = await getFoodDetails(food.fdcId)
                  if (detailedFood) {
                    food = detailedFood
                  }
                } catch (detailError) {
                  console.error("Error getting detailed food info:", detailError)
                  // Continue with the basic food info
                }

                // Calculate portion size
                portion = calculatePortionSize(food, dietGoal, meal)

                // Calculate nutrition
                nutrition = calculateNutritionForPortion(food, portion.amount)

                // Validate calculated nutrition
                if (nutrition.calories <= 0 || nutrition.protein <= 0) {
                  // Try to extract nutrition directly from food nutrients
                  const nutrients = food.foodNutrients || []
                  const caloriesNutrient = nutrients.find(
                    (n: any) =>
                      n.nutrientId === 1008 ||
                      n.nutrientNumber === "208" ||
                      n.nutrientName?.toLowerCase().includes("energy") ||
                      n.name?.toLowerCase().includes("energy"),
                  )

                  const proteinNutrient = nutrients.find(
                    (n: any) =>
                      n.nutrientId === 1003 ||
                      n.nutrientNumber === "203" ||
                      n.nutrientName?.toLowerCase().includes("protein") ||
                      n.name?.toLowerCase().includes("protein"),
                  )

                  const fatNutrient = nutrients.find(
                    (n: any) =>
                      n.nutrientId === 1004 ||
                      n.nutrientNumber === "204" ||
                      n.nutrientName?.toLowerCase().includes("fat") ||
                      n.name?.toLowerCase().includes("fat"),
                  )

                  const carbsNutrient = nutrients.find(
                    (n: any) =>
                      n.nutrientId === 1005 ||
                      n.nutrientNumber === "205" ||
                      n.nutrientName?.toLowerCase().includes("carbohydrate") ||
                      n.name?.toLowerCase().includes("carbohydrate"),
                  )

                  if (caloriesNutrient && proteinNutrient) {
                    // Adjust for portion size
                    const portionMultiplier = portion.amount / 100
                    nutrition = {
                      calories: Math.round((caloriesNutrient.value || 0) * portionMultiplier),
                      protein: Math.round((proteinNutrient.value || 0) * portionMultiplier),
                      carbs: Math.round((carbsNutrient?.value || 0) * portionMultiplier),
                      fat: Math.round((fatNutrient?.value || 0) * portionMultiplier),
                    }
                  }

                  // If still invalid, use reasonable defaults based on meal type
                  if (nutrition.calories <= 0 || nutrition.protein <= 0) {
                    nutrition = getDefaultNutrition(meal, dietGoal)
                  }
                }

                source = "usda"
              } catch (fallbackError) {
                console.error(`Error with fallback database: ${fallbackError.message}`)

                // If both databases fail, use default values
                food = {
                  description: `${dietPreference === "vegetarian" ? "Vegetarian" : dietPreference === "vegan" ? "Vegan" : "Mixed"} ${meal}`,
                  fdcId: "default",
                }
                portion = { description: "1 serving", amount: 100, unit: "g" }
                nutrition = getDefaultNutrition(meal, dietGoal)
                source = "fallback"
              }
            }

            // Add meal time for intermittent fasting
            let mealTime = null
            if (dietPreference === "intermittent-fasting") {
              if (meal === "Lunch") {
                mealTime = "12:00 PM"
              } else if (meal === "Snack") {
                mealTime = "4:00 PM"
              } else if (meal === "Dinner") {
                mealTime = "8:00 PM"
              }
            }

            // Return meal data
            return mealTime
              ? {
                  meal,
                  time: mealTime,
                  food:
                    source === "ifct"
                      ? food.name
                      : source === "custom" || source === "template"
                        ? food.name
                        : food.description,
                  quantity: portion.description,
                  calories: nutrition.calories,
                  protein: nutrition.protein,
                  carbs: nutrition.carbs,
                  fat: nutrition.fat,
                  source: source,
                  id: source === "ifct" ? food.id : source === "custom" || source === "template" ? food.id : food.fdcId,
                }
              : {
                  meal,
                  food:
                    source === "ifct"
                      ? food.name
                      : source === "custom" || source === "template"
                        ? food.name
                        : food.description,
                  quantity: portion.description,
                  calories: nutrition.calories,
                  protein: nutrition.protein,
                  carbs: nutrition.carbs,
                  fat: nutrition.fat,
                  source: source,
                  id: source === "ifct" ? food.id : source === "custom" || source === "template" ? food.id : food.fdcId,
                }
          } catch (error) {
            console.error(`Error generating meal for ${day} ${meal}:`, error)

            // Fallback to a generic meal if both APIs fail
            return {
              meal,
              food: `${dietPreference === "vegetarian" ? "Vegetarian" : dietPreference === "vegan" ? "Vegan" : "Mixed"} ${meal}`,
              quantity: "1 serving",
              calories: mealCalories[meal as keyof typeof mealCalories],
              protein: Math.round((mealCalories[meal as keyof typeof mealCalories] * 0.25) / 4), // 25% of calories from protein
              carbs: Math.round((mealCalories[meal as keyof typeof mealCalories] * 0.5) / 4), // 50% of calories from carbs
              fat: Math.round((mealCalories[meal as keyof typeof mealCalories] * 0.25) / 9), // 25% of calories from fat
              source: "fallback",
            }
          }
        }),
      )

      return {
        day,
        meals: dayMeals.filter(Boolean), // Filter out null meals (for intermittent fasting)
      }
    }),
  )

  return mealPlan
}

export function UsdaMealPlanGenerator({ userData }: { userData: any }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState<any>(null)
  const [tdee, setTdee] = useState<number | null>(null)
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null)
  const [calorieAdjustment, setCalorieAdjustment] = useState<{ type: string; amount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mealPlanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mealPlan && mealPlanRef.current) {
      mealPlanRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [mealPlan])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietPreference: userData?.dietPreference || "non-veg",
      dietGoal: userData?.dietGoal || "weight-loss",
      calorieGoal: "2000",
      dietPeriod: "4-weeks",
      goalWeight: userData?.weight ? userData.weight.toString() : "",
    },
  })

  // Check if userData is valid
  const isValidUserData = !!userData

  // Get recommended diet goal based on BMI and gender
  const getRecommendedDietGoal = (bmi: number, gender: string) => {
    if (bmi < 18.5) return "weight-gain"
    if (bmi >= 25) return "weight-loss"
    return gender === "male" ? "muscle-building" : "lean-mass"
  }

  // Calculate BMI with gender adjustment
  const standardBmi = userData?.weight && userData?.height ? userData.weight / Math.pow(userData.height / 100, 2) : null

  // Apply gender adjustment if gender is available
  const bmi =
    standardBmi && userData?.gender ? (userData.gender === "female" ? standardBmi * 0.95 : standardBmi) : standardBmi

  // Get recommended diet goal
  const recommendedGoal =
    bmi && userData?.gender
      ? getRecommendedDietGoal(bmi, userData.gender)
      : bmi
        ? getRecommendedDietGoal(bmi, "male")
        : null

  // Calculate TDEE and recommended calories when form values change
  const [calculatedValues, setCalculatedValues] = useState<{
    tdee: number | null
    calories: number | null
    calorieAdjustment: { type: string; amount: number } | null
  }>({
    tdee: null,
    calories: null,
    calorieAdjustment: null,
  })

  // Fix the dependency array in the useEffect to properly watch form values
  useEffect(() => {
    if (
      isValidUserData &&
      userData?.weight &&
      userData?.height &&
      userData?.age &&
      userData?.gender &&
      userData?.activityLevel
    ) {
      const calculatedTDEE = calculateTDEE(
        userData.weight,
        userData.height,
        userData.age,
        userData.gender,
        userData.activityLevel,
      )

      // Use form.getValues() instead of watch to avoid dependency issues
      const formValues = form.getValues()
      const goalWeight = formValues.goalWeight ? Number.parseInt(formValues.goalWeight) : userData.weight
      const dietGoal = formValues.dietGoal
      const dietPeriod = formValues.dietPeriod

      if (goalWeight && dietGoal && dietPeriod) {
        const calories = calculateCalorieGoal(userData.weight, goalWeight, calculatedTDEE, dietPeriod, dietGoal)

        let calorieAdjustment = null
        if (calories > calculatedTDEE) {
          calorieAdjustment = {
            type: "surplus",
            amount: calories - calculatedTDEE,
          }
        } else if (calories < calculatedTDEE) {
          calorieAdjustment = {
            type: "deficit",
            amount: calculatedTDEE - calories,
          }
        }

        setCalculatedValues({
          tdee: calculatedTDEE,
          calories: calories,
          calorieAdjustment: calorieAdjustment,
        })

        // Update the calorie goal field
        form.setValue("calorieGoal", calories.toString())
      } else {
        setCalculatedValues({
          tdee: calculatedTDEE,
          calories: null,
          calorieAdjustment: null,
        })
      }
    } else {
      setCalculatedValues({
        tdee: null,
        calories: null,
        calorieAdjustment: null,
      })
    }
  }, [userData, form, isValidUserData])

  // Add a separate effect to watch form changes
  useEffect(() => {
    // Set up a subscription to form changes
    const subscription = form.watch((value, { name }) => {
      // Only recalculate if relevant fields change
      if (name === "goalWeight" || name === "dietGoal" || name === "dietPeriod") {
        if (
          isValidUserData &&
          userData?.weight &&
          userData?.height &&
          userData?.age &&
          userData?.gender &&
          userData?.activityLevel
        ) {
          const calculatedTDEE = calculateTDEE(
            userData.weight,
            userData.height,
            userData.age,
            userData.gender,
            userData.activityLevel,
          )

          const formValues = form.getValues()
          const goalWeight = formValues.goalWeight ? Number.parseInt(formValues.goalWeight) : userData.weight
          const dietGoal = formValues.dietGoal
          const dietPeriod = formValues.dietPeriod

          if (goalWeight && dietGoal && dietPeriod) {
            const calories = calculateCalorieGoal(userData.weight, goalWeight, calculatedTDEE, dietPeriod, dietGoal)

            let calorieAdjustment = null
            if (calories > calculatedTDEE) {
              calorieAdjustment = {
                type: "surplus",
                amount: calories - calculatedTDEE,
              }
            } else if (calories < calculatedTDEE) {
              calorieAdjustment = {
                type: "deficit",
                amount: calculatedTDEE - calories,
              }
            }

            setCalculatedValues({
              tdee: calculatedTDEE,
              calories: calories,
              calorieAdjustment: calorieAdjustment,
            })

            // Update the calorie goal field
            form.setValue("calorieGoal", calories.toString())
          }
        }
      }
    })

    // Clean up subscription
    return () => subscription.unsubscribe()
  }, [form, userData, isValidUserData])

  useEffect(() => {
    setTdee(calculatedValues.tdee)
    setCalculatedCalories(calculatedValues.calories)
    setCalorieAdjustment(calculatedValues.calorieAdjustment)
  }, [calculatedValues])

  // Check if user has medical conditions
  const hasMedicalConditions =
    userData?.medicalConditions && userData.medicalConditions.length > 0 && !userData.medicalConditions.includes("none")

  // Check if user has allergies
  const hasAllergies = userData?.allergies && userData.allergies.trim() !== ""

  // Check if user is on intermittent fasting
  const isIntermittentFasting = userData?.dietPreference === "intermittent-fasting"

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to generate a meal plan.",
        variant: "destructive",
      })
      return
    }

    // Removed the free plan limit check for testing purposes
    // Original code:
    // if (userData.subscription === "free" && userData.mealPlansGenerated >= 3) {
    //   toast({
    //     title: "Meal plan limit reached",
    //     description: "Upgrade to premium for unlimited meal plans.",
    //     variant: "destructive",
    //   })
    //
    //   // Redirect to the upgrade page after showing the toast
    //   setTimeout(() => {
    //     window.location.href = "/dashboard/upgrade"
    //   }, 1500)
    //
    //   return
    // }

    setIsGenerating(true)
    setError(null)

    try {
      // Generate meal plan with USDA data
      let generatedMealPlan
      try {
        generatedMealPlan = await generateUsdaMealPlan(
          values.dietPreference,
          values.dietGoal,
          Number.parseInt(values.calorieGoal),
          values.dietPeriod,
          userData?.medicalConditions || [],
          userData?.allergies || "",
          userData?.activityLevel || "moderate",
        )
      } catch (usdaError) {
        console.error("USDA API error:", usdaError)
        // Fallback to basic meal plan generator if USDA API fails
        toast({
          title: "USDA API Unavailable",
          description: "Falling back to basic meal plan generator.",
          variant: "warning",
        })

        // Import the basic meal plan generator function
        const { generateMealPlan } = await import("./meal-plan-generator")

        generatedMealPlan = await generateMealPlan(
          values.dietPreference,
          values.dietGoal,
          Number.parseInt(values.calorieGoal),
          values.dietPeriod,
          userData?.medicalConditions || [],
          userData?.allergies || "",
          userData?.activityLevel || "moderate",
        )
      }

      setMealPlan(generatedMealPlan)

      // Save meal plan to Firestore
      const mealPlanRef = await addDoc(collection(db, "users", user.uid, "mealPlans"), {
        dietPreference: values.dietPreference,
        dietGoal: values.dietGoal,
        calorieGoal: Number.parseInt(values.calorieGoal),
        dietPeriod: values.dietPeriod,
        goalWeight: values.goalWeight ? Number.parseInt(values.goalWeight) : null,
        medicalConditions: userData?.medicalConditions || [],
        allergies: userData?.allergies || "",
        activityLevel: userData?.activityLevel || "moderate",
        plan: generatedMealPlan,
        createdAt: serverTimestamp(),
        source: "usda", // Mark this as a USDA-sourced meal plan
      })

      // Update user's meal plan count
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        mealPlansGenerated: increment(1),
      })

      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan using USDA data is ready!",
      })
    } catch (error: any) {
      console.error("Error generating meal plan:", error)
      setError(error.message || "Failed to generate meal plan. Please try again.")
      toast({
        title: "Error",
        description: "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {!isValidUserData ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load your profile data. Please try refreshing the page or contact support.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Generate Meal Plan with USDA Data</CardTitle>
              <CardDescription>
                Create a personalized 7-day meal plan based on your preferences using official USDA nutritional data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasMedicalConditions && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Medical Conditions Detected</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Your meal plan will be tailored to accommodate your medical conditions:
                    {userData.medicalConditions.map((condition: string) => (
                      <Badge key={condition} className="ml-1 mr-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {condition === "pcod"
                          ? "PCOD/PCOS"
                          : condition === "high-cholesterol"
                            ? "High Cholesterol"
                            : condition === "heart-disease"
                              ? "Heart Disease"
                              : condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </Badge>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {hasAllergies && (
                <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Allergies/Intolerances</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your meal plan will exclude: <span className="font-medium">{userData.allergies}</span>
                  </AlertDescription>
                </Alert>
              )}

              {isIntermittentFasting && (
                <Alert className="mb-4 bg-purple-50 border-purple-200">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-800">Intermittent Fasting</AlertTitle>
                  <AlertDescription className="text-purple-700">
                    Your meal plan will follow a 16:8 fasting schedule (8-hour eating window).
                  </AlertDescription>
                </Alert>
              )}

              {tdee && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <Calculator className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Calorie Calculation</AlertTitle>
                  <AlertDescription className="text-green-700">
                    <div className="flex flex-col gap-1">
                      <div>
                        Your estimated TDEE: <span className="font-medium">{tdee} calories/day</span>
                      </div>
                      {calculatedCalories && (
                        <div>
                          Recommended daily intake:{" "}
                          <span className="font-medium">{calculatedCalories} calories/day</span>
                          {calorieAdjustment && (
                            <span className="ml-1">
                              ({calorieAdjustment.type === "deficit" ? "-" : "+"}
                              {calorieAdjustment.amount} calories)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dietPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diet Preference</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diet preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="indian-vegetarian">Indian Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                              <SelectItem value="eggetarian">Eggetarian</SelectItem>
                              <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                              <SelectItem value="intermittent-fasting">Intermittent Fasting</SelectItem>
                              <SelectItem value="blood-type">Blood Type Diet</SelectItem>
                              <SelectItem value="hindu-fasting">Hindu Fasting</SelectItem>
                              <SelectItem value="jain-diet">Jain Diet</SelectItem>
                              <SelectItem value="sattvic-diet">Sattvic Diet</SelectItem>
                              <SelectItem value="indian-regional">Indian Regional Diet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">Choose your preferred diet type.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diet Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diet goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight-loss">Weight Loss</SelectItem>
                              <SelectItem value="weight-gain">Weight Gain</SelectItem>
                              <SelectItem value="muscle-building">Muscle Building</SelectItem>
                              <SelectItem value="lean-mass">Lean Mass Gain</SelectItem>
                              <SelectItem value="keto">Keto Diet</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          {recommendedGoal && field.value !== recommendedGoal && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Based on your BMI, we recommend a{" "}
                              <span
                                className="text-primary cursor-pointer underline"
                                onClick={() => form.setValue("dietGoal", recommendedGoal)}
                              >
                                {recommendedGoal.replace("-", " ")}
                              </span>{" "}
                              goal.
                            </p>
                          )}
                          <FormDescription className="text-xs">Choose your health and fitness goal.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dietPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diet Period</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diet period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="4-weeks">4 Weeks</SelectItem>
                              <SelectItem value="2-months">2 Months</SelectItem>
                              <SelectItem value="3-months">3 Months</SelectItem>
                              <SelectItem value="4-months">4 Months</SelectItem>
                              <SelectItem value="5-months">5 Months</SelectItem>
                              <SelectItem value="6-months">6 Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Select how long you plan to follow this diet.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter your target weight" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter your target weight to calculate daily calorie needs.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="calorieGoal"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Daily Calorie Goal</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  This value is automatically calculated based on your current weight, goal weight,
                                  activity level, and diet period. You can adjust it if needed.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input type="number" placeholder="2000" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {userData?.activityLevel && (
                            <span>Adjusted for your {userData.activityLevel.replace("-", " ")} activity level.</span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating with USDA Data...
                      </>
                    ) : (
                      "Generate Meal Plan"
                    )}
                  </Button>
                  {userData.subscription === "free" && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Unlimited meal plans available for testing
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {mealPlan && (
            <Card ref={mealPlanRef}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your 7-Day Meal Plan</CardTitle>
                  <CardDescription>
                    Personalized meal plan based on nutritional data
                    {hasMedicalConditions && <span className="ml-1">and medical conditions</span>}
                    {hasAllergies && <span className="ml-1">with allergen exclusions</span>}
                  </CardDescription>
                </div>
                <MealPlanPdf
                  mealPlan={mealPlan}
                  dietPreference={form.getValues("dietPreference")}
                  dietGoal={form.getValues("dietGoal")}
                  calorieGoal={Number.parseInt(form.getValues("calorieGoal"))}
                  dietPeriod={form.getValues("dietPeriod")}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mealPlan.map((day: any, index: number) => (
                    <div key={index} className="space-y-4">
                      <h3 className="font-bold text-lg">{day.day}</h3>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {day.meals.map((meal: any, mealIndex: number) => (
                          <Card key={mealIndex}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                {meal.meal}
                                {meal.time && <span className="ml-2 text-xs text-muted-foreground">{meal.time}</span>}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="font-medium">{meal.food}</p>
                              <p className="text-sm text-muted-foreground mt-1">Quantity: {meal.quantity}</p>
                              <div className="mt-2 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Calories:</span>
                                  <span>{meal.calories} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Protein:</span>
                                  <span>{meal.protein}g</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Carbs:</span>
                                  <span>{meal.carbs}g</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Fat:</span>
                                  <span>{meal.fat}g</span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs">
                                {meal.source === "usda" && meal.id && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">
                                    USDA ID: {meal.id}
                                  </Badge>
                                )}
                                {meal.source === "ifct" && meal.id && (
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-800">
                                    IFCT ID: {meal.id}
                                  </Badge>
                                )}
                                {meal.source === "custom" && meal.id && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-800">
                                    Custom Food
                                  </Badge>
                                )}
                                {meal.source === "template" && meal.id && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-800">
                                    Meal Template
                                  </Badge>
                                )}
                                {meal.source === "fallback" && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-800">
                                    Generic
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}

// Function to get default nutrition values based on meal type and diet goal
function getDefaultNutrition(mealType: string, dietGoal: string) {
  // Base values by meal type
  let baseCalories = 0
  let baseProtein = 0
  let baseCarbs = 0
  let baseFat = 0

  switch (mealType) {
    case "Breakfast":
      baseCalories = 400
      baseProtein = 20
      baseCarbs = 50
      baseFat = 15
      break
    case "Lunch":
      baseCalories = 600
      baseProtein = 30
      baseCarbs = 70
      baseFat = 20
      break
    case "Dinner":
      baseCalories = 500
      baseProtein = 25
      baseCarbs = 60
      baseFat = 18
      break
    case "Snack":
      baseCalories = 200
      baseProtein = 10
      baseCarbs = 25
      baseFat = 8
      break
    default:
      baseCalories = 400
      baseProtein = 20
      baseCarbs = 50
      baseFat = 15
  }

  // Adjust based on diet goal
  let calorieMultiplier = 1
  let proteinMultiplier = 1
  let carbsMultiplier = 1
  let fatMultiplier = 1

  switch (dietGoal) {
    case "weight-loss":
      calorieMultiplier = 0.8
      carbsMultiplier = 0.7
      break
    case "weight-gain":
      calorieMultiplier = 1.2
      proteinMultiplier = 1.2
      break
    case "muscle-building":
      proteinMultiplier = 1.5
      break
    case "keto":
      carbsMultiplier = 0.2
      fatMultiplier = 1.5
      break
  }

  return {
    calories: Math.round(baseCalories * calorieMultiplier),
    protein: Math.round(baseProtein * proteinMultiplier),
    carbs: Math.round(baseCarbs * carbsMultiplier),
    fat: Math.round(baseFat * fatMultiplier),
  }
}
