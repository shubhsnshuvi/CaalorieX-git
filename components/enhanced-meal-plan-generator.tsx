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
import { Loader2, RefreshCw } from 'lucide-react'
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore"
import { useAuth } from "@/lib/use-auth"
import { MealPlanPdf } from "./meal-plan-pdf"
import { useSearchParams } from "next/navigation"

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

export function EnhancedMealPlanGenerator({ userData }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const searchParams = useSearchParams()
  const goalParam = searchParams?.get("goal")
  const [dietPreference, setDietPreference] = useState(userData?.dietPreference || "omnivore")
  const [dietGoal, setDietGoal(goalParam || userData?.dietGoal || "weight-loss")] = useState(userData?.dietGoal || "weight-loss")
  const [calorieGoal, setCalorieGoal] = useState(userData?.targetCalories || 2000)
  const [dietPeriod, setDietPeriod] = useState("one-week")
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>(
    userData?.medicalConditions || ["none"],
  )
  const [mealPlanHistory, setMealPlanHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch meal plan history when component mounts
  useEffect(() => {
    if (user) {
      fetchMealPlanHistory()
    }
  }, [user])

  // Update state when userData changes
  useEffect(() => {
    if (userData) {
      setDietPreference(userData.dietPreference || "omnivore")
      // Use the goal from URL parameter if available, otherwise use from userData
      setDietGoal(goalParam || userData.dietGoal || "weight-loss")
      setCalorieGoal(userData.targetCalories || 2000)
      setSelectedMedicalConditions(userData.medicalConditions || ["none"])
    }
  }, [userData, goalParam])

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
      const userSubscription = userData?.subscription || "free"

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

      // Simulate meal plan generation (in a real app, this would call an API)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a sample meal plan based on preferences
      const generatedMealPlan = generateSampleMealPlan(
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
      })

      // Refresh the meal plan history
      fetchMealPlanHistory()

      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan is ready!",
      })
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

  const generateSampleMealPlan = (
    preference: string,
    goal: string,
    calories: number,
    period: string,
    medicalConditions: string[],
  ): MealPlan[] => {
    // This is a simplified example - in a real app, you would use a more sophisticated algorithm
    // or call an external API to generate meal plans based on the user's preferences

    const days = period === "one-day" ? 1 : period === "three-days" ? 3 : 7
    const mealPlan: MealPlan[] = []

    // Check if there are medical conditions to consider
    const hasMedicalConditions = !medicalConditions.includes("none")

    for (let i = 0; i < days; i++) {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i % 7]

      // Adjust food choices based on diet preference and medical conditions
      let breakfastFood = "Scrambled Eggs with Whole Grain Toast"
      let lunchFood = "Grilled Chicken Salad with Olive Oil Dressing"
      let dinnerFood = "Baked Salmon with Sweet Potato and Broccoli"
      let snackFood = "Greek Yogurt with Berries and Nuts"

      if (preference === "vegetarian" || preference === "indian-vegetarian") {
        breakfastFood = "Vegetable Omelette with Whole Grain Toast"
        lunchFood = "Quinoa Salad with Roasted Vegetables"
        dinnerFood = "Lentil Curry with Brown Rice"
        snackFood = "Hummus with Vegetable Sticks"
        
        // Add more variety for vegetarian options
        if (i % 2 === 0) {
          breakfastFood = "Greek Yogurt with Granola and Fresh Fruit"
          lunchFood = "Mediterranean Chickpea Salad"
          dinnerFood = "Vegetable Stir Fry with Tofu and Brown Rice"
          snackFood = "Cottage Cheese with Sliced Peaches"
        } else if (i % 3 === 0) {
          breakfastFood = "Spinach and Feta Omelette with Whole Grain Toast"
          lunchFood = "Caprese Sandwich on Whole Grain Bread"
          dinnerFood = "Eggplant Parmesan with Side Salad"
          snackFood = "Trail Mix with Nuts and Dried Fruits"
        }
      } else if (preference === "vegan") {
        breakfastFood = "Overnight Oats with Almond Milk and Berries"
        lunchFood = "Buddha Bowl with Tofu and Tahini Dressing"
        dinnerFood = "Chickpea and Vegetable Curry with Brown Rice"
        snackFood = "Apple Slices with Almond Butter"
      } else if (preference === "keto") {
        breakfastFood = "Avocado and Bacon Omelette"
        lunchFood = "Chicken Caesar Salad (No Croutons)"
        dinnerFood = "Grilled Steak with Buttered Vegetables"
        snackFood = "Cheese and Nuts"
      }

      // Adjust for medical conditions
      if (hasMedicalConditions) {
        if (medicalConditions.includes("diabetes")) {
          // Lower carb options for diabetes
          breakfastFood += " (Low GI)"
          lunchFood += " (Low GI)"
          dinnerFood += " (Low GI)"
          snackFood = "Low Sugar Greek Yogurt with Berries"
        }

        if (medicalConditions.includes("hypertension")) {
          // Lower sodium options for hypertension
          breakfastFood += " (Low Sodium)"
          lunchFood += " (Low Sodium)"
          dinnerFood += " (Low Sodium)"
        }

        if (medicalConditions.includes("high-cholesterol")) {
          // Heart-healthy options for high cholesterol
          breakfastFood = "Oatmeal with Berries and Flaxseeds"
          dinnerFood = "Grilled Fish with Steamed Vegetables"
        }
      }

      const dayMeals = {
        day: dayName,
        meals: [
          {
            meal: "Breakfast",
            time: "8:00 AM",
            food: breakfastFood,
            quantity: "1 serving",
            calories: Math.round(calories * 0.25),
            protein: Math.round((calories * 0.25 * (goal === "muscle-gain" ? 0.4 : 0.3)) / 4),
            carbs: Math.round((calories * 0.25 * (goal === "weight-loss" ? 0.3 : 0.4)) / 4),
            fat: Math.round((calories * 0.25 * 0.3) / 9),
            source: "custom",
          },
          {
            meal: "Lunch",
            time: "12:30 PM",
            food: lunchFood,
            quantity: "1 serving",
            calories: Math.round(calories * 0.35),
            protein: Math.round((calories * 0.35 * (goal === "muscle-gain" ? 0.4 : 0.3)) / 4),
            carbs: Math.round((calories * 0.35 * (goal === "weight-loss" ? 0.3 : 0.4)) / 4),
            fat: Math.round((calories * 0.35 * 0.3) / 9),
            source: "custom",
          },
          {
            meal: "Dinner",
            time: "7:00 PM",
            food: dinnerFood,
            quantity: "1 serving",
            calories: Math.round(calories * 0.3),
            protein: Math.round((calories * 0.3 * (goal === "muscle-gain" ? 0.4 : 0.3)) / 4),
            carbs: Math.round((calories * 0.3 * (goal === "weight-loss" ? 0.3 : 0.4)) / 4),
            fat: Math.round((calories * 0.3 * 0.3) / 9),
            source: "custom",
          },
          {
            meal: "Snack",
            time: "4:00 PM",
            food: snackFood,
            quantity: "1 serving",
            calories: Math.round(calories * 0.1),
            protein: Math.round((calories * 0.1 * 0.3) / 4),
            carbs: Math.round((calories * 0.1 * 0.4) / 4),
            fat: Math.round((calories * 0.1 * 0.3) / 9),
            source: "custom",
          },
        ],
      }

      mealPlan.push(dayMeals)
    }

    return mealPlan
  }

  const loadMealPlan = (plan: any) => {
    setDietPreference(plan.dietPreference || "omnivore")
    setDietGoal(plan.dietGoal || "weight-loss")
    setCalorieGoal(plan.calorieGoal || 2000)
    setDietPeriod(plan.dietPeriod || "one-week")
    setSelectedMedicalConditions(plan.medicalConditions || ["none"])
    setMealPlan(plan.mealPlan || [])

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
                  <Label htmlFor="calorie-goal">Daily Calorie Goal</Label>
                  <Input
                    id="calorie-goal"
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(Number.parseInt(e.target.value) || 2000)}
                    min={1200}
                    max={4000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-period">Diet Period</Label>
                  <Select value={dietPeriod} onValueChange={setDietPeriod}>
                    <SelectTrigger id="diet-period">
                      <SelectValue placeholder="Select diet period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-day">One Day</SelectItem>
                      <SelectItem value="three-days">Three Days</SelectItem>
                      <SelectItem value="one-week">One Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Medical Conditions Section */}
              <div className="space-y-2">
                <Label>Medical Conditions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                  {medicalConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition.id}`}
                        checked={selectedMedicalConditions.includes(condition.id)}
                        onCheckedChange={(checked) => handleMedicalConditionChange(condition.id, checked === true)}
                      />
                      <Label htmlFor={`condition-${condition.id}`} className="text-sm">
                        {condition.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
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
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Meal Plan</CardTitle>
            <CardDescription>
              Based on your {dietPreference} diet preference and {dietGoal.replace("-", " ")} goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mealPlan.map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">{day.day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {day.meals.map((meal, mealIndex) => (
                      <Card key={mealIndex} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">{meal.meal}</CardTitle>
                            {meal.time && <span className="text-sm text-muted-foreground">{meal.time}</span>}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <p className="font-medium">{meal.food}</p>
                          <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                          <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
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
