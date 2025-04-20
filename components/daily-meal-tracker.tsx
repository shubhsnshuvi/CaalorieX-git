"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Search, Trash2, Calendar, Edit, Save, X, Info } from "lucide-react"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Define types for meal tracking
interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: string
  source: string
}

interface MealEntry {
  id?: string
  mealType: string
  foods: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

interface DailyMealLog {
  id?: string
  date: string
  meals: MealEntry[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  calorieGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  notes?: string
  createdAt?: any
  updatedAt?: any
}

export function DailyMealTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [mealLog, setMealLog] = useState<DailyMealLog | null>(null)
  const [activeMeal, setActiveMeal] = useState<string>("Breakfast")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [proteinGoal, setProteinGoal] = useState(150)
  const [carbsGoal, setCarbsGoal] = useState(225)
  const [fatGoal, setFatGoal] = useState(67)
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  // Fetch user's meal log for the selected date
  useEffect(() => {
    if (user) {
      fetchMealLog()
    }
  }, [user, selectedDate])

  // Fetch user's meal plans
  useEffect(() => {
    if (user) {
      fetchMealPlans()
    }
  }, [user])

  const fetchMealLog = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      const mealLogsRef = collection(db, "users", user.uid, "mealLogs")
      const q = query(mealLogsRef, where("date", "==", dateString))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Meal log exists for this date
        const docData = querySnapshot.docs[0].data() as DailyMealLog
        setMealLog({
          ...docData,
          id: querySnapshot.docs[0].id,
        })

        // Set goals from the meal log
        setCalorieGoal(docData.calorieGoal || 2000)
        setProteinGoal(docData.proteinGoal || 150)
        setCarbsGoal(docData.carbsGoal || 225)
        setFatGoal(docData.fatGoal || 67)
      } else {
        // Create a new meal log for this date
        const newMealLog: DailyMealLog = {
          date: dateString,
          meals: [
            { mealType: "Breakfast", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
            { mealType: "Lunch", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
            { mealType: "Dinner", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
            { mealType: "Snack", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
          ],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          calorieGoal: calorieGoal,
          proteinGoal: proteinGoal,
          carbsGoal: carbsGoal,
          fatGoal: fatGoal,
        }

        const docRef = await addDoc(mealLogsRef, {
          ...newMealLog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setMealLog({
          ...newMealLog,
          id: docRef.id,
        })
      }
    } catch (error) {
      console.error("Error fetching meal log:", error)
      setError("Failed to load meal log. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMealPlans = async () => {
    if (!user) return

    try {
      const mealPlansRef = collection(db, "users", user.uid, "mealPlans")
      const querySnapshot = await getDocs(mealPlansRef)

      const plans: any[] = []
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })
      })

      // Sort by creation date, newest first
      plans.sort((a, b) => b.createdAt - a.createdAt)
      setMealPlans(plans)
    } catch (error) {
      console.error("Error fetching meal plans:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      // Search in Firestore collections
      const results = await searchFoods(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching foods:", error)
      setError("Failed to search for foods. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const searchFoods = async (term: string): Promise<FoodItem[]> => {
    // This is a simplified version - in a real app, you'd implement a more sophisticated search
    const results: FoodItem[] = []

    try {
      // Search in IFCT foods
      const ifctFoodsRef = collection(db, "ifct_foods")
      const ifctQuery = query(ifctFoodsRef, where("keywords", "array-contains", term.toLowerCase()))
      const ifctSnapshot = await getDocs(ifctQuery)

      ifctSnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          calories: data.nutrients?.calories || 0,
          protein: data.nutrients?.protein || 0,
          carbs: data.nutrients?.carbohydrates || 0,
          fat: data.nutrients?.fat || 0,
          quantity: "100g",
          source: "ifct",
        })
      })

      // Search in USDA foods (via our API)
      try {
        const response = await fetch(`/api/food-search?action=search&query=${encodeURIComponent(term)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.foods && data.foods.length > 0) {
            data.foods.forEach((food: any) => {
              // Extract nutrients
              const nutrients = food.foodNutrients || []
              const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
              const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
              const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0
              const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0

              results.push({
                id: food.fdcId,
                name: food.description || "Unknown Food",
                calories,
                protein,
                carbs,
                fat,
                quantity: "100g",
                source: "usda",
              })
            })
          }
        }
      } catch (error) {
        console.error("Error searching USDA foods:", error)
      }

      // Search in custom foods
      // This would be implemented in a real app

      return results
    } catch (error) {
      console.error("Error searching foods:", error)
      return []
    }
  }

  const addFoodToMeal = (food: FoodItem) => {
    if (!mealLog) return

    // Find the active meal
    const updatedMeals = mealLog.meals.map((meal) => {
      if (meal.mealType === activeMeal) {
        // Add food to this meal
        const updatedFoods = [...meal.foods, food]

        // Recalculate meal totals
        const totalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0)
        const totalProtein = updatedFoods.reduce((sum, food) => sum + food.protein, 0)
        const totalCarbs = updatedFoods.reduce((sum, food) => sum + food.carbs, 0)
        const totalFat = updatedFoods.reduce((sum, food) => sum + food.fat, 0)

        return {
          ...meal,
          foods: updatedFoods,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
        }
      }
      return meal
    })

    // Recalculate daily totals
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.totalCalories, 0)
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
    const totalCarbs = updatedMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
    const totalFat = updatedMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

    const updatedMealLog = {
      ...mealLog,
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }

    setMealLog(updatedMealLog)
    saveMealLog(updatedMealLog)

    toast({
      title: "Food added",
      description: `${food.name} added to ${activeMeal}`,
    })
  }

  const removeFoodFromMeal = (mealType: string, foodIndex: number) => {
    if (!mealLog) return

    // Find the meal
    const updatedMeals = mealLog.meals.map((meal) => {
      if (meal.mealType === mealType) {
        // Remove food from this meal
        const updatedFoods = meal.foods.filter((_, index) => index !== foodIndex)

        // Recalculate meal totals
        const totalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0)
        const totalProtein = updatedFoods.reduce((sum, food) => sum + food.protein, 0)
        const totalCarbs = updatedFoods.reduce((sum, food) => sum + food.carbs, 0)
        const totalFat = updatedFoods.reduce((sum, food) => sum + food.fat, 0)

        return {
          ...meal,
          foods: updatedFoods,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
        }
      }
      return meal
    })

    // Recalculate daily totals
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.totalCalories, 0)
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
    const totalCarbs = updatedMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
    const totalFat = updatedMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

    const updatedMealLog = {
      ...mealLog,
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }

    setMealLog(updatedMealLog)
    saveMealLog(updatedMealLog)

    toast({
      title: "Food removed",
      description: `Food removed from ${mealType}`,
    })
  }

  const saveMealLog = async (mealLogData: DailyMealLog) => {
    if (!user || !mealLogData.id) return

    try {
      const mealLogRef = doc(db, "users", user.uid, "mealLogs", mealLogData.id)
      await updateDoc(mealLogRef, {
        ...mealLogData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error saving meal log:", error)
      toast({
        title: "Error",
        description: "Failed to save meal log. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveNutritionGoals = async () => {
    if (!user || !mealLog?.id) return

    try {
      const mealLogRef = doc(db, "users", user.uid, "mealLogs", mealLog.id)
      await updateDoc(mealLogRef, {
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        updatedAt: serverTimestamp(),
      })

      setMealLog({
        ...mealLog,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
      })

      setIsEditing(false)

      toast({
        title: "Goals updated",
        description: "Your nutrition goals have been updated.",
      })
    } catch (error) {
      console.error("Error saving nutrition goals:", error)
      toast({
        title: "Error",
        description: "Failed to save nutrition goals. Please try again.",
        variant: "destructive",
      })
    }
  }

  const importMealPlan = async () => {
    if (!user || !mealLog?.id || !selectedMealPlan) return

    try {
      // Get the selected meal plan
      const mealPlanRef = doc(db, "users", user.uid, "mealPlans", selectedMealPlan)
      const mealPlanDoc = await getDoc(mealPlanRef)

      if (!mealPlanDoc.exists()) {
        throw new Error("Meal plan not found")
      }

      const mealPlanData = mealPlanDoc.data()
      const mealPlanItems = mealPlanData.plan || []

      // Find today's meals in the meal plan
      const today = new Date().getDay()
      const dayIndex = today === 0 ? 6 : today - 1 // Convert to 0-6 (Monday-Sunday)
      const todayMeals = mealPlanItems[dayIndex]?.meals || []

      // Convert meal plan items to food items
      const mealMap: Record<string, FoodItem[]> = {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: [],
      }

      todayMeals.forEach((meal: any) => {
        const foodItem: FoodItem = {
          id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: meal.food,
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          quantity: meal.quantity || "1 serving",
          source: "meal-plan",
        }

        const mealType = meal.meal
        if (mealMap[mealType]) {
          mealMap[mealType].push(foodItem)
        }
      })

      // Update the meal log with the imported meals
      const updatedMeals = mealLog.meals.map((meal) => {
        const importedFoods = mealMap[meal.mealType] || []

        if (importedFoods.length === 0) {
          return meal
        }

        // Add imported foods to existing foods
        const updatedFoods = [...meal.foods, ...importedFoods]

        // Recalculate meal totals
        const totalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0)
        const totalProtein = updatedFoods.reduce((sum, food) => sum + food.protein, 0)
        const totalCarbs = updatedFoods.reduce((sum, food) => sum + food.carbs, 0)
        const totalFat = updatedFoods.reduce((sum, food) => sum + food.fat, 0)

        return {
          ...meal,
          foods: updatedFoods,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
        }
      })

      // Recalculate daily totals
      const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.totalCalories, 0)
      const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
      const totalCarbs = updatedMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
      const totalFat = updatedMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

      const updatedMealLog = {
        ...mealLog,
        meals: updatedMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      }

      setMealLog(updatedMealLog)
      saveMealLog(updatedMealLog)

      setIsImportDialogOpen(false)

      toast({
        title: "Meal plan imported",
        description: "Today's meals from your meal plan have been imported.",
      })
    } catch (error) {
      console.error("Error importing meal plan:", error)
      toast({
        title: "Error",
        description: "Failed to import meal plan. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Meal Tracker</CardTitle>
          <CardDescription>Track your daily food intake and nutrition</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(selectedDate, "MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Import Meal Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Meal Plan</DialogTitle>
                <DialogDescription>Select a meal plan to import today's meals into your tracker.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select onValueChange={(value) => setSelectedMealPlan(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meal plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.dietPreference} - {plan.dietGoal} ({format(plan.createdAt, "MMM d, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={importMealPlan} disabled={!selectedMealPlan}>
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {mealLog && (
          <div className="space-y-6">
            {/* Nutrition Summary */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Nutrition Summary</CardTitle>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveNutritionGoals}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Goals
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Calories */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Calories</div>
                      <div>
                        {mealLog.totalCalories} /{" "}
                        {isEditing ? (
                          <Input
                            type="number"
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(Number(e.target.value))}
                            className="w-20 h-6 inline-block"
                          />
                        ) : (
                          mealLog.calorieGoal
                        )}
                      </div>
                    </div>
                    <Progress value={(mealLog.totalCalories / mealLog.calorieGoal) * 100} className="h-2" />
                  </div>

                  {/* Protein */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Protein</div>
                      <div>
                        {mealLog.totalProtein}g /{" "}
                        {isEditing ? (
                          <Input
                            type="number"
                            value={proteinGoal}
                            onChange={(e) => setProteinGoal(Number(e.target.value))}
                            className="w-20 h-6 inline-block"
                          />
                        ) : (
                          mealLog.proteinGoal
                        )}
                        g
                      </div>
                    </div>
                    <Progress value={(mealLog.totalProtein / mealLog.proteinGoal) * 100} className="h-2 bg-blue-100" />
                  </div>

                  {/* Carbs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Carbs</div>
                      <div>
                        {mealLog.totalCarbs}g /{" "}
                        {isEditing ? (
                          <Input
                            type="number"
                            value={carbsGoal}
                            onChange={(e) => setCarbsGoal(Number(e.target.value))}
                            className="w-20 h-6 inline-block"
                          />
                        ) : (
                          mealLog.carbsGoal
                        )}
                        g
                      </div>
                    </div>
                    <Progress value={(mealLog.totalCarbs / mealLog.carbsGoal) * 100} className="h-2 bg-green-100" />
                  </div>

                  {/* Fat */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Fat</div>
                      <div>
                        {mealLog.totalFat}g /{" "}
                        {isEditing ? (
                          <Input
                            type="number"
                            value={fatGoal}
                            onChange={(e) => setFatGoal(Number(e.target.value))}
                            className="w-20 h-6 inline-block"
                          />
                        ) : (
                          mealLog.fatGoal
                        )}
                        g
                      </div>
                    </div>
                    <Progress value={(mealLog.totalFat / mealLog.fatGoal) * 100} className="h-2 bg-yellow-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Tabs */}
            <Tabs defaultValue="Breakfast" value={activeMeal} onValueChange={setActiveMeal}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="Breakfast">Breakfast</TabsTrigger>
                <TabsTrigger value="Lunch">Lunch</TabsTrigger>
                <TabsTrigger value="Dinner">Dinner</TabsTrigger>
                <TabsTrigger value="Snack">Snack</TabsTrigger>
              </TabsList>

              {mealLog.meals.map((meal) => (
                <TabsContent key={meal.mealType} value={meal.mealType} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{meal.mealType}</h3>
                    <div className="text-sm text-muted-foreground">
                      {meal.totalCalories} kcal | {meal.totalProtein}g protein | {meal.totalCarbs}g carbs |{" "}
                      {meal.totalFat}g fat
                    </div>
                  </div>

                  {/* Food Search */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search for a food item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                      <Search className="h-4 w-4 mr-1" />
                      Search
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Search Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {searchResults.map((food) => (
                          <Card key={food.id} className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium line-clamp-1">{food.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {food.calories} kcal | {food.protein}g protein | {food.carbs}g carbs | {food.fat}g
                                    fat
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => addFoodToMeal(food)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {food.source.toUpperCase()}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Foods in Meal */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Foods in {meal.mealType}</h4>
                    {meal.foods.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No foods added to {meal.mealType} yet. Search for foods to add them.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {meal.foods.map((food, index) => (
                          <Card key={`${food.id}-${index}`} className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{food.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {food.quantity} | {food.calories} kcal | {food.protein}g protein | {food.carbs}g
                                    carbs | {food.fat}g fat
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFoodFromMeal(meal.mealType, index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {food.source.toUpperCase()}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Tracking Info
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Track your daily food intake and nutrition goals.</p>
                <p>Search for foods to add them to your meals.</p>
                <p>Import meals from your meal plans.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button variant="outline" onClick={fetchMealLog}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}
