"use client"

import { useState, useEffect, useRef } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, AlertCircle, Clock, Calculator, InfoIcon, AlertTriangle } from "lucide-react"
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MealPlanPdf } from "@/components/meal-plan-pdf"
import { generateMealPlanFromTemplates } from "@/lib/meal-plan-templates"

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
      "keto",
      "paleo",
      "whole30",
      "mediterranean",
      "dash",
      "mind",
      "low-fodmap",
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

// Helper function to sanitize data for Firestore
// This removes undefined values and converts them to null
const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null
  if (obj === null) return null
  if (typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item))
  }

  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeForFirestore(value)
  }

  return sanitized
}

export function EnhancedMealPlanGenerator({ userData }: { userData: any }) {
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

  // Parse allergies into an array
  const parseAllergies = (allergiesString: string): string[] => {
    if (!allergiesString) return []
    return allergiesString
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to generate a meal plan.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Parse allergies
      const allergiesList = parseAllergies(userData?.allergies || "")

      // Generate meal plan from templates
      const generatedMealPlan = await generateMealPlanFromTemplates({
        dietPreference: values.dietPreference,
        dietGoal: values.dietGoal,
        medicalConditions: userData?.medicalConditions || ["none"],
        allergies: allergiesList,
        calorieGoal: Number.parseInt(values.calorieGoal),
      })

      // Sanitize the meal plan to remove any undefined values
      const sanitizedMealPlan = sanitizeForFirestore(generatedMealPlan)

      setMealPlan(sanitizedMealPlan)

      // Prepare data for Firestore
      const mealPlanData = {
        dietPreference: values.dietPreference,
        dietGoal: values.dietGoal,
        calorieGoal: Number.parseInt(values.calorieGoal),
        dietPeriod: values.dietPeriod,
        goalWeight: values.goalWeight ? Number.parseInt(values.goalWeight) : null,
        medicalConditions: userData?.medicalConditions || ["none"],
        allergies: userData?.allergies || "",
        activityLevel: userData?.activityLevel || "moderate",
        plan: sanitizedMealPlan,
        createdAt: serverTimestamp(),
        source: "enhanced", // Mark this as an enhanced meal plan
      }

      // Save meal plan to Firestore
      const mealPlanRef = await addDoc(collection(db, "users", user.uid, "mealPlans"), mealPlanData)

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
              <CardTitle>Generate Personalized Meal Plan</CardTitle>
              <CardDescription>
                Create a scientifically accurate meal plan tailored to your preferences and health needs
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
                              <SelectItem value="keto">Keto</SelectItem>
                              <SelectItem value="paleo">Paleo</SelectItem>
                              <SelectItem value="mediterranean">Mediterranean</SelectItem>
                              <SelectItem value="dash">DASH</SelectItem>
                              <SelectItem value="low-fodmap">Low FODMAP</SelectItem>
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
                        Generating Meal Plan...
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
                    Scientifically tailored meal plan based on your preferences
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
                          <Card key={mealIndex} className={meal.warning ? "border-yellow-300" : ""}>
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
                              {meal.warning && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                                  <div className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-1 flex-shrink-0" />
                                    <p className="text-xs text-yellow-800">{meal.warning}</p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            {meal.ingredients && (
                              <CardFooter className="flex flex-col items-start pt-0">
                                <p className="text-xs font-medium mb-1">Ingredients:</p>
                                <ul className="text-xs text-muted-foreground list-disc pl-4">
                                  {meal.ingredients.map((ingredient: any, i: number) => (
                                    <li key={i}>
                                      {ingredient.name} ({ingredient.quantity})
                                    </li>
                                  ))}
                                </ul>
                              </CardFooter>
                            )}
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
