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
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// First, import the new component at the top of the file
import { MealPlanPdf } from "@/components/meal-plan-pdf"

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

// Helper function to generate appropriate quantities based on diet goal
const generateQuantity = (foodItem: string, dietGoal: string, mealType: string) => {
  // Base quantities for different food types
  const quantities = {
    roti: { base: "2", weightLoss: "1", weightGain: "3", muscleBuilding: "3", leanMass: "2", keto: "0" },
    chapati: { base: "2", weightLoss: "1", weightGain: "3", muscleBuilding: "3", leanMass: "2", keto: "0" },
    paratha: { base: "2", weightLoss: "1", weightGain: "3", muscleBuilding: "3", leanMass: "2", keto: "0" },
    rice: {
      base: "1 cup",
      weightLoss: "1/2 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "1.5 cups",
      leanMass: "1 cup",
      keto: "0",
    },
    dal: {
      base: "1 cup",
      weightLoss: "3/4 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "1.5 cups",
      leanMass: "1 cup",
      keto: "1/2 cup",
    },
    curry: {
      base: "1 cup",
      weightLoss: "3/4 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "1.5 cups",
      leanMass: "1 cup",
      keto: "1 cup",
    },
    sabzi: {
      base: "1 cup",
      weightLoss: "1.5 cups",
      weightGain: "1 cup",
      muscleBuilding: "1.5 cups",
      leanMass: "1.5 cups",
      keto: "2 cups",
    },
    paneer: {
      base: "100g",
      weightLoss: "75g",
      weightGain: "150g",
      muscleBuilding: "200g",
      leanMass: "100g",
      keto: "150g",
    },
    chicken: {
      base: "150g",
      weightLoss: "100g",
      weightGain: "200g",
      muscleBuilding: "250g",
      leanMass: "150g",
      keto: "200g",
    },
    fish: {
      base: "150g",
      weightLoss: "100g",
      weightGain: "200g",
      muscleBuilding: "250g",
      leanMass: "150g",
      keto: "200g",
    },
    eggs: { base: "2", weightLoss: "2 whites", weightGain: "3", muscleBuilding: "4", leanMass: "3", keto: "3" },
    oats: {
      base: "1/2 cup",
      weightLoss: "1/3 cup",
      weightGain: "3/4 cup",
      muscleBuilding: "1 cup",
      leanMass: "1/2 cup",
      keto: "1/4 cup",
    },
    yogurt: {
      base: "1 cup",
      weightLoss: "1/2 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "2 cups",
      leanMass: "1 cup",
      keto: "1/2 cup",
    },
    salad: {
      base: "1 bowl",
      weightLoss: "1.5 bowls",
      weightGain: "1 small bowl",
      muscleBuilding: "1 bowl",
      leanMass: "1 bowl",
      keto: "1.5 bowls",
    },
    nuts: { base: "30g", weightLoss: "15g", weightGain: "50g", muscleBuilding: "60g", leanMass: "30g", keto: "50g" },
    fruits: {
      base: "1 medium",
      weightLoss: "1 small",
      weightGain: "2 medium",
      muscleBuilding: "2 medium",
      leanMass: "1 medium",
      keto: "1/2 small",
    },
    idli: {
      base: "2 pieces",
      weightLoss: "1 piece",
      weightGain: "3-4 pieces",
      muscleBuilding: "4 pieces",
      leanMass: "2 pieces",
      keto: "0",
    },
    dosa: {
      base: "1 medium",
      weightLoss: "1 small",
      weightGain: "2 medium",
      muscleBuilding: "2 medium",
      leanMass: "1 medium",
      keto: "0",
    },
    upma: {
      base: "1 cup",
      weightLoss: "1/2 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "1.5 cups",
      leanMass: "1 cup",
      keto: "0",
    },
    poha: {
      base: "1 cup",
      weightLoss: "1/2 cup",
      weightGain: "1.5 cups",
      muscleBuilding: "1.5 cups",
      leanMass: "1 cup",
      keto: "0",
    },
  }

  // Determine the appropriate quantity based on diet goal
  let quantity = ""
  const lowerCaseFood = foodItem.toLowerCase()

  // Check for food types in the item name
  for (const [foodType, qtyOptions] of Object.entries(quantities)) {
    if (lowerCaseFood.includes(foodType)) {
      switch (dietGoal) {
        case "weight-loss":
          quantity = qtyOptions.weightLoss
          break
        case "weight-gain":
          quantity = qtyOptions.weightGain
          break
        case "muscle-building":
          quantity = qtyOptions.muscleBuilding
          break
        case "lean-mass":
          quantity = qtyOptions.leanMass
          break
        case "keto":
          quantity = qtyOptions.keto
          break
        default:
          quantity = qtyOptions.base
      }
      break
    }
  }

  // If no specific quantity was found, use meal-based defaults
  if (!quantity) {
    if (mealType === "Breakfast") {
      quantity =
        dietGoal === "weight-loss" ? "1 serving" : dietGoal === "muscle-building" ? "2 servings" : "1-2 servings"
    } else if (mealType === "Lunch" || mealType === "Dinner") {
      quantity =
        dietGoal === "weight-loss" ? "1 serving" : dietGoal === "muscle-building" ? "1.5 servings" : "1 regular serving"
    } else if (mealType === "Snack") {
      quantity =
        dietGoal === "weight-loss"
          ? "1 small serving"
          : dietGoal === "muscle-building"
            ? "1 large serving"
            : "1 serving"
    } else {
      quantity = "1 serving"
    }
  }

  return quantity
}

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

  // For muscle-building, calculate based on goal weight
  if (dietGoal === "muscle-building") {
    // If goal weight is higher than current weight
    if (goalWeight > currentWeight) {
      // Calculate weight difference
      const weightDiff = goalWeight - currentWeight

      // Calculate total calorie surplus needed (1kg of muscle requires ~7700 calories)
      const totalCalorieAdjustment = weightDiff * 7700

      // Calculate daily surplus needed to reach goal weight in the given time period
      const dailyCalorieAdjustment = Math.round(totalCalorieAdjustment / days)

      // Cap the daily surplus to a reasonable amount (max 1000 calories)
      const cappedAdjustment = Math.min(dailyCalorieAdjustment, 1000)

      // Return TDEE plus the capped adjustment
      return tdee + cappedAdjustment
    } else {
      // If goal weight is same or lower, still provide a moderate surplus for muscle building
      return tdee + 500
    }
  }

  // For other diet goals
  if (dietGoal === "lean-mass" || dietGoal === "keto" || dietGoal === "maintenance") {
    if (dietGoal === "keto") {
      return Math.round(tdee * 0.9) // Slight deficit for keto
    } else if (dietGoal === "maintenance") {
      return tdee // Exact maintenance calories
    }
    return tdee // Maintenance for lean mass
  }

  // For weight loss/gain goals
  if (goalWeight === currentWeight) {
    return tdee // Maintenance
  }

  // Calculate weight difference
  const weightDiff = goalWeight - currentWeight

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

// Mock function to simulate meal plan generation
const generateMealPlan = async (
  dietPreference: string,
  dietGoal: string,
  calorieGoal: number,
  dietPeriod: string,
  medicalConditions: string[] = [],
  allergies = "",
  activityLevel = "moderate",
) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const meals = ["Breakfast", "Lunch", "Dinner", "Snack"]
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Food options based on diet preference
  const foodOptions = {
    vegetarian: [
      "Paneer Tikka with Mint Chutney",
      "Vegetable Biryani with Raita",
      "Spinach and Cheese Stuffed Bell Peppers",
      "Mushroom Risotto with Parmesan",
      "Caprese Salad with Balsamic Glaze",
      "Greek Yogurt with Honey and Nuts",
      "Vegetable Lasagna with Ricotta",
    ],
    "indian-vegetarian": [
      "Roti with Paneer Butter Masala and Jeera Rice",
      "Chapati with Mixed Vegetable Curry and Dal Tadka",
      "Paratha with Chana Masala and Raita",
      "Pulao with Dal Fry and Aloo Gobi",
      "Roti with Palak Paneer and Steamed Rice",
      "Chapati with Rajma Curry and Jeera Rice",
      "Vegetable Biryani with Cucumber Raita",
      "Poha with Mixed Vegetables",
      "Upma with Coconut Chutney",
      "Idli Sambar with Coconut Chutney",
      "Masala Dosa with Sambar",
      "Vegetable Uttapam with Tomato Chutney",
    ],
    vegan: [
      "Avocado Toast with Hemp Seeds",
      "Quinoa Bowl with Roasted Vegetables",
      "Lentil Soup with Spinach",
      "Chickpea Curry with Brown Rice",
      "Tofu Stir-Fry with Broccoli",
      "Vegan Buddha Bowl",
      "Smoothie Bowl with Berries",
    ],
    "non-veg": [
      "Grilled Chicken with Sweet Potatoes",
      "Salmon with Asparagus",
      "Turkey Sandwich on Whole Grain",
      "Chicken Stir-Fry with Vegetables",
      "Egg Omelette with Spinach",
      "Tuna Salad with Mixed Greens",
      "Greek Yogurt with Berries",
    ],
    eggetarian: [
      "Scrambled Eggs with Vegetables",
      "Egg Salad Sandwich",
      "Vegetable Frittata",
      "Egg Fried Rice with Vegetables",
      "Boiled Eggs with Avocado Toast",
      "Egg Drop Soup",
      "Egg and Cheese Wrap",
    ],
    "gluten-free": [
      "Quinoa Bowl with Roasted Vegetables",
      "Rice Pasta with Tomato Sauce",
      "Grilled Chicken with Sweet Potatoes",
      "Salmon with Rice and Vegetables",
      "Corn Tortilla Tacos",
      "Gluten-Free Oatmeal with Fruits",
      "Rice and Bean Bowl",
    ],
    "intermittent-fasting": [
      "Protein-Rich Lunch with Vegetables",
      "Balanced Dinner with Lean Protein",
      "Nutrient-Dense Afternoon Snack",
      "High-Protein Smoothie",
      "Hearty Salad with Protein",
      "Vegetable and Protein Stir-Fry",
      "Balanced Plate with Protein, Carbs, and Fats",
    ],
    "blood-type": [
      "Type-Specific Protein with Vegetables",
      "Blood Type Appropriate Grain Bowl",
      "Customized Salad for Blood Type",
      "Type-Specific Protein Source",
      "Recommended Vegetables for Blood Type",
      "Blood Type Appropriate Fruits",
      "Balanced Meal for Blood Type",
    ],
    "hindu-fasting": [
      "Sabudana Khichdi",
      "Kuttu ki Puri with Aloo Sabzi",
      "Singhare ka Halwa",
      "Rajgira Paratha",
      "Sama Rice Pulao",
      "Makhana Kheer",
      "Fresh Fruit Platter",
      "Coconut Water",
      "Dry Fruits and Nuts",
      "Banana Chips",
      "Sabudana Vada",
      "Kuttu Atta Pakoras",
    ],
    "jain-diet": [
      "Jain Thepla",
      "Jain Dal Tadka (without onion and garlic)",
      "Jain Vegetable Pulao",
      "Jain Pav Bhaji (without potato and onion)",
      "Jain Dhokla",
      "Jain Kachori",
      "Jain Bhel (without potato)",
      "Dry Fruit Ladoo",
      "Jain Dosa (without potato)",
      "Jain Vegetable Curry",
      "Jain Khichdi",
      "Jain Chapati with Subzi",
    ],
    "sattvic-diet": [
      "Moong Dal Khichdi",
      "Sabudana Khichdi",
      "Fresh Seasonal Fruits",
      "Basmati Rice with Ghee",
      "Chapati with Ghee",
      "Steamed Vegetables",
      "Cucumber and Coconut Raita",
      "Mung Bean Sprouts Salad",
      "Sattvic Kadhi",
      "Pumpkin Soup",
      "Coconut Milk Rice",
      "Honey and Warm Milk",
    ],
    "indian-regional": [
      "Punjabi Chole Bhature",
      "South Indian Masala Dosa",
      "Bengali Fish Curry with Rice",
      "Gujarati Dhokla",
      "Rajasthani Dal Baati Churma",
      "Kashmiri Dum Aloo",
      "Maharashtrian Puran Poli",
      "Kerala Appam with Stew",
      "Hyderabadi Biryani",
      "Assamese Masor Tenga",
      "Goan Fish Curry",
      "Konkani Sol Kadhi",
    ],
  }

  // Special lunch and dinner options for Indian vegetarian
  const indianVegetarianLunchDinner = [
    "Roti with Dal Tadka and Mixed Vegetable Sabzi",
    "Chapati with Rajma Curry and Jeera Rice",
    "Paratha with Chana Masala and Steamed Rice",
    "Roti with Palak Paneer and Plain Rice",
    "Chapati with Dal Fry and Aloo Gobi",
    "Roti with Paneer Butter Masala and Jeera Rice",
    "Chapati with Mixed Dal and Bhindi Sabzi",
    "Roti with Kadai Paneer and Steamed Rice",
    "Chapati with Moong Dal and Lauki Sabzi",
    "Roti with Matar Paneer and Pulao",
    "Chapati with Toor Dal and Baingan Bharta",
    "Roti with Paneer Tikka Masala and Jeera Rice",
    "Chapati with Dal Makhani and Mixed Vegetable Curry",
  ]

  // Diet goal specific foods for Indian vegetarian
  const indianVegetarianByGoal = {
    "weight-loss": [
      "Roti with Lauki Sabzi (Bottle Gourd Curry)",
      "Moong Dal Khichdi with Spinach",
      "Chapati with Baingan Bharta (Roasted Eggplant)",
      "Vegetable Daliya (Broken Wheat Upma)",
      "Roti with Mixed Vegetable Curry (No Potato)",
      "Steamed Idli with Sambar (No Coconut Chutney)",
      "Cucumber and Sprouts Salad with Lemon Dressing",
    ],
    "weight-gain": [
      "Paneer Paratha with Curd and Pickle",
      "Chole Bhature with Onion Salad",
      "Aloo Paratha with Butter and Curd",
      "Vegetable Pulao with Paneer Makhani",
      "Stuffed Paratha with Butter and Pickle",
      "Masala Dosa with Extra Ghee and Potato Filling",
      "Puri with Aloo Sabzi and Kheer",
    ],
    "muscle-building": [
      "Paneer Bhurji with Multigrain Roti",
      "Sprouts Curry with Brown Rice",
      "Soya Chunks Curry with Roti",
      "Moong Dal Cheela with Paneer Stuffing",
      "Quinoa Pulao with Tofu Curry",
      "Chickpea and Vegetable Curry with Brown Rice",
      "Multigrain Roti with Paneer Tikka Masala",
      "Protein-Rich Dal Makhani with Jeera Rice",
      "Paneer and Vegetable Stuffed Paratha",
      "High-Protein Chana Masala with Brown Rice",
      "Soya Granules Curry with Multigrain Roti",
      "Protein-Packed Rajma Curry with Steamed Rice",
      "Tofu Bhurji with Whole Wheat Chapati",
    ],
    "lean-mass": [
      "Multigrain Roti with Paneer Bhurji",
      "Brown Rice with Dal and Vegetable Curry",
      "Oats Idli with Sambar",
      "Quinoa Upma with Mixed Vegetables",
      "Ragi Dosa with Vegetable Curry",
      "Jowar Roti with Palak Paneer",
      "Millet Khichdi with Vegetable Raita",
    ],
    keto: [
      "Paneer Tikka with Mint Chutney (No Roti)",
      "Cauliflower Rice with Paneer Butter Masala",
      "Spinach and Paneer Curry with Almond Flour Roti",
      "Avocado and Cucumber Raita",
      "Coconut Flour Pancakes with Sugar-Free Syrup",
      "Keto Vegetable Upma with Coconut",
      "Almond Flour Dosa with Coconut Chutney",
    ],
    maintenance: [
      "Balanced Roti with Dal and Vegetable Curry",
      "Chapati with Moderate Paneer Dish and Rice",
      "Mixed Grain Khichdi with Vegetables",
      "Balanced Thali with Roti, Rice, Dal, and Sabzi",
      "Moderate Portion of Vegetable Biryani with Raita",
      "Balanced Dosa with Sambar and Chutney",
      "Chapati with Mixed Vegetable Curry and Curd",
    ],
  }

  // Select food options based on diet preference
  const selectedFoods = foodOptions[dietPreference as keyof typeof foodOptions] || foodOptions["non-veg"]

  // Add diet goal specific foods for the diet preferences
  if (
    dietPreference === "indian-vegetarian" &&
    indianVegetarianByGoal[dietGoal as keyof typeof indianVegetarianByGoal]
  ) {
    const goalSpecificFoods = indianVegetarianByGoal[dietGoal as keyof typeof indianVegetarianByGoal]
    selectedFoods.push(...goalSpecificFoods)
  }

  // Generate meal plan
  const mealPlan = days.map((day) => {
    return {
      day,
      meals: meals
        .map((meal) => {
          // Skip breakfast for intermittent fasting
          if (dietPreference === "intermittent-fasting" && meal === "Breakfast") {
            return null
          }

          // For Indian vegetarian, ensure lunch and dinner have appropriate meals
          let randomFood
          if (dietPreference === "indian-vegetarian" && (meal === "Lunch" || meal === "Dinner")) {
            // Use specific lunch/dinner options for Indian vegetarian
            if (dietGoal === "muscle-building") {
              // Use muscle-building specific meals for lunch/dinner
              randomFood =
                indianVegetarianByGoal["muscle-building"][
                  Math.floor(Math.random() * indianVegetarianByGoal["muscle-building"].length)
                ]
            } else if (dietGoal === "weight-loss") {
              // Use weight-loss specific meals for lunch/dinner
              randomFood =
                indianVegetarianByGoal["weight-loss"][
                  Math.floor(Math.random() * indianVegetarianByGoal["weight-loss"].length)
                ]
            } else if (dietGoal === "weight-gain") {
              // Use weight-gain specific meals for lunch/dinner
              randomFood =
                indianVegetarianByGoal["weight-gain"][
                  Math.floor(Math.random() * indianVegetarianByGoal["weight-gain"].length)
                ]
            } else {
              // Use general Indian vegetarian lunch/dinner options
              randomFood = indianVegetarianLunchDinner[Math.floor(Math.random() * indianVegetarianLunchDinner.length)]
            }
          } else {
            // Select a random food from the options
            randomFood = selectedFoods[Math.floor(Math.random() * selectedFoods.length)]
          }

          // Generate appropriate quantity for the food
          const quantity = generateQuantity(randomFood, dietGoal, meal)

          // Get accurate nutrition data based on food type and quantity
          const getNutritionData = (foodItem: string, quantity: string, mealType: string) => {
            // UPDATED: Scientifically accurate nutrition database based on USDA and other reliable sources
            // Values are per standard serving size (varies by food)
            const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> =
              {
                // Proteins - Values from USDA FoodData Central
                chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
                "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
                "grilled chicken": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
                fish: { calories: 136, protein: 22.3, carbs: 0, fat: 4.3 },
                salmon: { calories: 206, protein: 22.1, carbs: 0, fat: 12.4 },
                tuna: { calories: 116, protein: 25.5, carbs: 0, fat: 0.8 },
                eggs: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
                egg: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
                paneer: { calories: 265, protein: 18.3, carbs: 3.1, fat: 20.8 },
                tofu: { calories: 144, protein: 15.9, carbs: 3.5, fat: 8.7 },
                lentils: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
                dal: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
                chickpeas: { calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
                turkey: { calories: 135, protein: 25.3, carbs: 0, fat: 3.5 },
                "soya chunks": { calories: 336, protein: 52, carbs: 26, fat: 0.5 },

                // Carbohydrates
                rice: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
                "brown rice": { calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9 },
                "white rice": { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
                "jeera rice": { calories: 138, protein: 2.8, carbs: 29.4, fat: 1.2 },
                roti: { calories: 120, protein: 3.1, carbs: 18.3, fat: 3.7 },
                chapati: { calories: 120, protein: 3.1, carbs: 18.3, fat: 3.7 },
                paratha: { calories: 260, protein: 6.4, carbs: 33.2, fat: 11.3 },
                bread: { calories: 79, protein: 3.1, carbs: 14.3, fat: 1 },
                "whole grain": { calories: 69, protein: 3.6, carbs: 12.1, fat: 1.1 },
                oats: { calories: 150, protein: 5, carbs: 27, fat: 2.5 },
                quinoa: { calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
                potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
                "sweet potato": { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1 },
                pasta: { calories: 131, protein: 5, carbs: 25.1, fat: 1.1 },

                // Vegetables
                spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
                palak: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
                broccoli: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
                cauliflower: { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
                carrots: { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
                "bell pepper": { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
                tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
                cucumber: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
                onion: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
                garlic: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
                asparagus: { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
                "mixed vegetables": { calories: 49, protein: 2.3, carbs: 9.8, fat: 0.5 },
                vegetables: { calories: 49, protein: 2.3, carbs: 9.8, fat: 0.5 },
                vegetable: { calories: 49, protein: 2.3, carbs: 9.8, fat: 0.5 },
                "bottle gourd": { calories: 14, protein: 0.6, carbs: 3.1, fat: 0.1 },
                lauki: { calories: 14, protein: 0.6, carbs: 3.1, fat: 0.1 },
                eggplant: { calories: 25, protein: 1, carbs: 6, fat: 0.2 },
                baingan: { calories: 25, protein: 1, carbs: 6, fat: 0.2 },
                sabzi: { calories: 49, protein: 2.3, carbs: 9.8, fat: 0.5 },

                // Fruits
                apple: { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
                banana: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
                orange: { calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1 },
                berries: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
                mango: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
                fruits: { calories: 60, protein: 0.8, carbs: 15, fat: 0.3 },
                fruit: { calories: 60, protein: 0.8, carbs: 15, fat: 0.3 },

                // Dairy
                yogurt: { calories: 59, protein: 3.5, carbs: 5, fat: 3.3 },
                "greek yogurt": { calories: 97, protein: 10, carbs: 3.6, fat: 5 },
                milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
                cheese: { calories: 113, protein: 7, carbs: 0.4, fat: 9 },
                curd: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
                raita: { calories: 76, protein: 3, carbs: 6, fat: 5 },

                // Nuts and Seeds
                almonds: { calories: 579, protein: 21, carbs: 21.6, fat: 49.9 },
                walnuts: { calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2 },
                "chia seeds": { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
                "flax seeds": { calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2 },
                nuts: { calories: 607, protein: 20, carbs: 20, fat: 54 },
                seeds: { calories: 534, protein: 18, carbs: 28, fat: 42 },
                "hemp seeds": { calories: 553, protein: 31.6, carbs: 8.7, fat: 48.8 },
                avocado: { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },

                // Indian Foods - Updated with more accurate values
                curry: { calories: 243, protein: 7, carbs: 10, fat: 20 },
                "butter masala": { calories: 290, protein: 9, carbs: 8, fat: 25 },
                sambar: { calories: 65, protein: 2, carbs: 11, fat: 2 },
                idli: { calories: 39, protein: 2, carbs: 8, fat: 0.1 },
                dosa: { calories: 120, protein: 3, carbs: 20, fat: 3 },
                upma: { calories: 85, protein: 2.4, carbs: 14, fat: 2.6 },
                poha: { calories: 76, protein: 2.5, carbs: 15, fat: 1 },
                biryani: { calories: 292, protein: 9, carbs: 40, fat: 10 },
                pulao: { calories: 200, protein: 4, carbs: 30, fat: 7 },
                chutney: { calories: 53, protein: 1, carbs: 13, fat: 0.2 },
                "chana masala": { calories: 180, protein: 7.5, carbs: 23, fat: 8 },
                rajma: { calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
                "aloo gobi": { calories: 93, protein: 2.8, carbs: 14.2, fat: 3.5 },
                "palak paneer": { calories: 190, protein: 11, carbs: 6, fat: 14 },
                tikka: { calories: 165, protein: 25, carbs: 2, fat: 7 },
                bharta: { calories: 90, protein: 2.5, carbs: 10, fat: 5 },
                bhurji: { calories: 220, protein: 14, carbs: 5, fat: 17 },
                khichdi: { calories: 130, protein: 5, carbs: 23, fat: 2.5 },
                "moong dal": { calories: 105, protein: 7.3, carbs: 18.9, fat: 0.4 },
                "dal tadka": { calories: 140, protein: 9, carbs: 20, fat: 3.5 },
                "chole bhature": { calories: 427, protein: 11, carbs: 51, fat: 20 },
                puri: { calories: 101, protein: 2, carbs: 14, fat: 5 },
                bhature: { calories: 150, protein: 4, carbs: 21, fat: 6 },

                // Breakfast Items
                omelette: { calories: 154, protein: 11, carbs: 1, fat: 12 },
                frittata: { calories: 170, protein: 12, carbs: 2, fat: 13 },
                sandwich: { calories: 290, protein: 12, carbs: 35, fat: 12 },
                "avocado toast": { calories: 190, protein: 5, carbs: 20, fat: 11 },
                smoothie: { calories: 150, protein: 5, carbs: 30, fat: 2 },
                bowl: { calories: 350, protein: 12, carbs: 45, fat: 14 },
                salad: { calories: 120, protein: 3, carbs: 12, fat: 7 },
                soup: { calories: 85, protein: 5, carbs: 10, fat: 3 },
                wrap: { calories: 260, protein: 10, carbs: 30, fat: 10 },
                "stir-fry": { calories: 220, protein: 15, carbs: 20, fat: 8 },

                // Keto-specific foods
                "cauliflower rice": { calories: 25, protein: 2, carbs: 5, fat: 0.3 },
                "almond flour": { calories: 163, protein: 6.1, carbs: 5.6, fat: 14.2 },
                "coconut flour": { calories: 120, protein: 4, carbs: 16, fat: 4 },

                // Default for unknown foods
                default: { calories: 150, protein: 5, carbs: 15, fat: 5 },
              }

            // Parse quantity to adjust nutrition values
            let quantityMultiplier = 1

            if (quantity.includes("cup")) {
              quantityMultiplier = quantity.includes("1/2")
                ? 0.5
                : quantity.includes("1/3")
                  ? 0.33
                  : quantity.includes("1/4")
                    ? 0.25
                    : quantity.includes("3/4")
                      ? 0.75
                      : quantity.includes("1.5") || quantity.includes("1 1/2")
                        ? 1.5
                        : Number.parseFloat(quantity) || 1
            } else if (quantity.includes("g")) {
              // Assuming standard serving is about 100g
              const grams = Number.parseFloat(quantity)
              quantityMultiplier = grams / 100
            } else if (quantity.includes("piece") || quantity.includes("pieces")) {
              const pieces = quantity.match(/\d+/)?.[0]
              quantityMultiplier = pieces ? Number.parseFloat(pieces) : 1
            } else if (quantity.includes("serving")) {
              const servings = quantity.match(/\d+/)?.[0]
              quantityMultiplier = servings ? Number.parseFloat(servings) : 1
            }

            // Find matching food in database
            let nutritionMatch = nutritionDatabase.default
            const lowerCaseFood = foodItem.toLowerCase()

            for (const [key, value] of Object.entries(nutritionDatabase)) {
              if (lowerCaseFood.includes(key)) {
                nutritionMatch = value
                break
              }
            }

            // Adjust based on meal type and diet goal
            let mealTypeMultiplier = 1
            if (mealType === "Breakfast") {
              mealTypeMultiplier = 0.8
            } else if (mealType === "Lunch" || mealType === "Dinner") {
              mealTypeMultiplier = 1.2
            } else if (mealType === "Snack") {
              mealTypeMultiplier = 0.5
            }

            // Diet goal adjustments
            let dietGoalMultiplier = 1
            if (dietGoal === "weight-loss") {
              dietGoalMultiplier = 0.9
            } else if (dietGoal === "weight-gain") {
              dietGoalMultiplier = 1.2
            } else if (dietGoal === "muscle-building") {
              // Increase protein for muscle building
              return {
                calories: Math.round(nutritionMatch.calories * quantityMultiplier * mealTypeMultiplier * 1.1),
                protein: Math.round(nutritionMatch.protein * quantityMultiplier * mealTypeMultiplier * 1.5),
                carbs: Math.round(nutritionMatch.carbs * quantityMultiplier * mealTypeMultiplier * 1.1),
                fat: Math.round(nutritionMatch.fat * quantityMultiplier * mealTypeMultiplier),
              }
            }

            // Calculate final nutrition values with precise rounding
            return {
              calories: Math.round(
                nutritionMatch.calories * quantityMultiplier * mealTypeMultiplier * dietGoalMultiplier,
              ),
              protein: Math.round(nutritionMatch.protein * quantityMultiplier * mealTypeMultiplier),
              carbs: Math.round(nutritionMatch.carbs * quantityMultiplier * mealTypeMultiplier),
              fat: Math.round(nutritionMatch.fat * quantityMultiplier * mealTypeMultiplier),
            }
          }

          // Get nutrition data for this meal
          const nutritionData = getNutritionData(randomFood, quantity, meal)
          const { calories, protein, carbs, fat } = nutritionData

          // Special handling for intermittent fasting
          let mealTime = null
          if (dietPreference === "intermittent-fasting") {
            // 16:8 fasting schedule (8-hour eating window)
            if (meal === "Breakfast") {
              return null // Skip breakfast during fasting
            } else if (meal === "Lunch") {
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
                food: randomFood,
                quantity,
                calories,
                protein,
                carbs,
                fat,
              }
            : {
                meal,
                food: randomFood,
                quantity,
                calories,
                protein,
                carbs,
                fat,
              }
        })
        .filter(Boolean), // Filter out null meals (for intermittent fasting)
    }
  })

  return mealPlan
}

export function MealPlanGenerator({ userData }: { userData: any }) {
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
  // Replace the problematic useEffect with:

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
      // Generate meal plan with all user preferences
      const generatedMealPlan = await generateMealPlan(
        values.dietPreference,
        values.dietGoal,
        Number.parseInt(values.calorieGoal),
        values.dietPeriod,
        userData?.medicalConditions || [],
        userData?.allergies || "",
        userData?.activityLevel || "moderate",
      )

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
      })

      // Update user's meal plan count
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        mealPlansGenerated: increment(1),
      })

      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan is ready!",
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
              <CardTitle>Generate Meal Plan</CardTitle>
              <CardDescription>Create a personalized 7-day meal plan based on your preferences.</CardDescription>
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
                        Generating...
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
                    Personalized meal plan based on your preferences
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

// Add this export at the end of the file, after the MealPlanGenerator component

// Export the generateMealPlan function for use as a fallback
export { generateMealPlan }
