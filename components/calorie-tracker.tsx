"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/use-auth"
import { searchAllFoodSources } from "@/lib/firestore-utils"
import { calculateIFCTNutritionForPortion } from "@/lib/ifct-api"
import { calculateNutritionForPortion } from "@/lib/usda-api"
import { PlusCircle, Trash2, Search, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Types
interface FoodItem {
  id: string
  name: string
  source: string
  quantity: number
  servingSize: {
    amount: number
    unit: string
    description?: string
  }
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface MealData {
  name: string
  foods: FoodItem[]
  isOpen: boolean
}

interface DailyGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function CalorieTracker() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<any | null>(null)
  const [selectedMeal, setSelectedMeal] = useState("breakfast")
  const [quantity, setQuantity] = useState(1)
  const [servingSize, setServingSize] = useState<{ amount: number; unit: string }>({ amount: 100, unit: "g" })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70,
  })

  const [meals, setMeals] = useState<MealData[]>([
    { name: "Breakfast", foods: [], isOpen: true },
    { name: "Lunch", foods: [], isOpen: true },
    { name: "Dinner", foods: [], isOpen: true },
    { name: "Snacks", foods: [], isOpen: true },
  ])

  // Calculate daily totals
  const dailyTotals = meals.reduce(
    (acc, meal) => {
      const mealTotals = meal.foods.reduce(
        (mealAcc, food) => {
          mealAcc.calories += food.nutrition.calories * food.quantity
          mealAcc.protein += food.nutrition.protein * food.quantity
          mealAcc.carbs += food.nutrition.carbs * food.quantity
          mealAcc.fat += food.nutrition.fat * food.quantity
          return mealAcc
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      )

      acc.calories += mealTotals.calories
      acc.protein += mealTotals.protein
      acc.carbs += mealTotals.carbs
      acc.fat += mealTotals.fat
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  // Calculate remaining calories and macros
  const remaining = {
    calories: dailyGoals.calories - dailyTotals.calories,
    protein: dailyGoals.protein - dailyTotals.protein,
    carbs: dailyGoals.carbs - dailyTotals.carbs,
    fat: dailyGoals.fat - dailyTotals.fat,
  }

  // Calculate percentages for progress bars
  const percentages = {
    calories: Math.min(100, (dailyTotals.calories / dailyGoals.calories) * 100),
    protein: Math.min(100, (dailyTotals.protein / dailyGoals.protein) * 100),
    carbs: Math.min(100, (dailyTotals.carbs / dailyGoals.carbs) * 100),
    fat: Math.min(100, (dailyTotals.fat / dailyGoals.fat) * 100),
  }

  // Load user's daily goals and meals from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) return

      try {
        // Load daily goals
        const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
        const goalsDoc = await getDoc(goalsDocRef)

        if (goalsDoc.exists()) {
          setDailyGoals(goalsDoc.data() as DailyGoals)
        } else {
          // Create default goals if they don't exist
          await setDoc(goalsDocRef, dailyGoals)
        }

        // Load today's meals
        const today = new Date().toISOString().split("T")[0]

        // Create the parent documents if they don't exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const mealsDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", today)
        const mealsDoc = await getDoc(mealsDocRef)

        if (mealsDoc.exists()) {
          const data = mealsDoc.data()
          if (data.meals) {
            // Ensure the loaded meals have the isOpen property
            const loadedMeals = data.meals.map((meal: any) => ({
              ...meal,
              isOpen: true,
            }))
            setMeals(loadedMeals)
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Don't set an error state here, just use the default values
      }
    }

    if (user?.uid) {
      loadUserData()
    }
  }, [user?.uid])

  // Save meals to Firestore whenever they change
  useEffect(() => {
    const saveMeals = async () => {
      if (!user?.uid) return

      try {
        const today = new Date().toISOString().split("T")[0]

        // Ensure parent collections/documents exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const mealsDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", today)

        // Only save the necessary data (exclude isOpen state)
        const mealsToSave = meals.map((meal) => ({
          name: meal.name,
          foods: meal.foods,
        }))

        await setDoc(mealsDocRef, { meals: mealsToSave, updatedAt: new Date() }, { merge: true })
      } catch (error) {
        console.error("Error saving meals:", error)
        // Don't show an error to the user, just log it
      }
    }

    // Only save if we have meals and a user
    if (user?.uid && meals.some((meal) => meal.foods.length > 0)) {
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveMeals, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [meals, user?.uid])

  // Search for foods
  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      // First try to use the imported function
      let results = []
      try {
        results = await searchAllFoodSources(searchTerm.trim(), 20)
      } catch (searchError) {
        console.error("Error with searchAllFoodSources:", searchError)
        // Fallback to a basic search implementation
        results = await fallbackFoodSearch(searchTerm.trim())
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Error searching for foods:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Fallback search function if the imported one fails
  const fallbackFoodSearch = async (term: string) => {
    // Basic implementation that returns some default foods
    return [
      {
        id: "default-1",
        name: "Banana",
        source: "default",
        nutrition: {
          calories: 105,
          protein: 1.3,
          carbs: 27,
          fat: 0.4,
        },
      },
      {
        id: "default-2",
        name: "Apple",
        source: "default",
        nutrition: {
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        },
      },
      {
        id: "default-3",
        name: "Rice (cooked)",
        source: "default",
        nutrition: {
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3,
        },
      },
    ].filter((food) => food.name.toLowerCase().includes(term.toLowerCase()))
  }

  const handleFoodSelect = (food: any) => {
    setSelectedFood(food)
    setShowSearchResults(false)
  }

  // Add food to meal
  const addFoodToMeal = () => {
    if (!selectedFood) return

    // Calculate nutrition based on the food source
    let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }

    try {
      if (selectedFood.source === "ifct") {
        nutrition = calculateIFCTNutritionForPortion(selectedFood, servingSize.amount)
      } else if (selectedFood.source === "usda") {
        nutrition = calculateNutritionForPortion(selectedFood, servingSize.amount)
      } else if (selectedFood.source === "default") {
        // For default foods, adjust nutrition based on serving size
        const ratio = servingSize.amount / 100
        nutrition = {
          calories: selectedFood.nutrition.calories * ratio,
          protein: selectedFood.nutrition.protein * ratio,
          carbs: selectedFood.nutrition.carbs * ratio,
          fat: selectedFood.nutrition.fat * ratio,
        }
      } else {
        // For custom foods or other sources
        nutrition = {
          calories: selectedFood.nutrition?.calories || selectedFood.nutrients?.calories || 0,
          protein: selectedFood.nutrition?.protein || selectedFood.nutrients?.protein || 0,
          carbs: selectedFood.nutrition?.carbs || selectedFood.nutrients?.carbohydrates || 0,
          fat: selectedFood.nutrition?.fat || selectedFood.nutrients?.fat || 0,
        }
      }
    } catch (error) {
      console.error("Error calculating nutrition:", error)
      // Use default values if calculation fails
      nutrition = {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
      }
    }

    const newFood: FoodItem = {
      id: `${selectedFood.id || "unknown"}-${Date.now()}`,
      name: selectedFood.name || selectedFood.foodName || selectedFood.description || "Unknown Food",
      source: selectedFood.source || "unknown",
      quantity: quantity,
      servingSize: {
        amount: servingSize.amount,
        unit: servingSize.unit,
        description: `${servingSize.amount} ${servingSize.unit}`,
      },
      nutrition,
    }

    setMeals((prevMeals) =>
      prevMeals.map((meal) =>
        meal.name.toLowerCase() === selectedMeal.toLowerCase() ? { ...meal, foods: [...meal.foods, newFood] } : meal,
      ),
    )

    // Reset selection
    setSelectedFood(null)
    setQuantity(1)
  }

  // Remove food from meal
  const removeFoodFromMeal = (mealName: string, foodId: string) => {
    setMeals((prevMeals) =>
      prevMeals.map((meal) =>
        meal.name.toLowerCase() === mealName.toLowerCase()
          ? { ...meal, foods: meal.foods.filter((food) => food.id !== foodId) }
          : meal,
      ),
    )
  }

  // Toggle meal section
  const toggleMealSection = (mealName: string) => {
    setMeals((prevMeals) =>
      prevMeals.map((meal) => (meal.name === mealName ? { ...meal, isOpen: !meal.isOpen } : meal)),
    )
  }

  // Update daily goals
  const updateDailyGoals = async (newGoals: Partial<DailyGoals>) => {
    if (!user?.uid) return

    try {
      const updatedGoals = { ...dailyGoals, ...newGoals }
      setDailyGoals(updatedGoals)

      const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
      await updateDoc(goalsDocRef, updatedGoals)
    } catch (error) {
      console.error("Error updating daily goals:", error)
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Daily Summary - Sticky Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2 shadow-md">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Daily Summary</span>
              <span className={`text-xl ${remaining.calories < 0 ? "text-red-500" : "text-green-500"}`}>
                {remaining.calories < 0 ? "-" : ""}
                {Math.abs(remaining.calories)} kcal remaining
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Calories</span>
                  <span>
                    {dailyTotals.calories} / {dailyGoals.calories}
                  </span>
                </div>
                <Progress
                  value={percentages.calories}
                  className="h-2"
                  indicatorClassName={remaining.calories < 0 ? "bg-red-500" : "bg-orange-500"}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Protein</span>
                  <span>
                    {dailyTotals.protein}g / {dailyGoals.protein}g
                  </span>
                </div>
                <Progress value={percentages.protein} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Carbs</span>
                  <span>
                    {dailyTotals.carbs}g / {dailyGoals.carbs}g
                  </span>
                </div>
                <Progress value={percentages.carbs} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fat</span>
                  <span>
                    {dailyTotals.fat}g / {dailyGoals.fat}g
                  </span>
                </div>
                <Progress value={percentages.fat} className="h-2" indicatorClassName="bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Food Search Section */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Add Food</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Search for a food (e.g., banana, roti, rice)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="input-dark flex-grow"
                  />
                  <Button onClick={handleSearch} className="ml-2 button-orange" disabled={isSearching}>
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="flex justify-between items-center p-2 border-b border-gray-700">
                      <span className="text-sm font-medium">Search Results</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSearchResults(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul>
                      {searchResults.map((food) => (
                        <li
                          key={`${food.source}-${food.id}`}
                          className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800"
                          onClick={() => handleFoodSelect(food)}
                        >
                          <div className="font-medium">{food.name || food.foodName || food.description}</div>
                          <div className="text-xs text-gray-400">
                            Source:{" "}
                            {food.source === "ifct"
                              ? "Indian Food Database"
                              : food.source === "custom"
                                ? "Custom Foods"
                                : food.source === "template"
                                  ? "Meal Template"
                                  : "USDA"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && !isSearching && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3">
                    No foods found. Try a different search term.
                  </div>
                )}
              </div>
            </div>

            {selectedFood && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="font-medium mb-2">
                  {selectedFood.name || selectedFood.foodName || selectedFood.description}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Meal</label>
                    <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                      <SelectTrigger className="select-dark">
                        <SelectValue placeholder="Select meal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Serving Size</label>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="1"
                        value={servingSize.amount}
                        onChange={(e) =>
                          setServingSize({ ...servingSize, amount: Number.parseInt(e.target.value) || 0 })
                        }
                        className="input-dark w-20 mr-2"
                      />
                      <Select
                        value={servingSize.unit}
                        onValueChange={(value) => setServingSize({ ...servingSize, unit: value })}
                      >
                        <SelectTrigger className="select-dark w-24">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="cup">cup</SelectItem>
                          <SelectItem value="tbsp">tbsp</SelectItem>
                          <SelectItem value="tsp">tsp</SelectItem>
                          <SelectItem value="piece">piece</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Quantity</label>
                    <Input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                      className="input-dark"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedFood(null)} className="mr-2 button-outline">
                    Cancel
                  </Button>
                  <Button onClick={addFoodToMeal} className="button-orange">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add to {selectedMeal}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meal Sections */}
      <div className="space-y-4">
        {meals.map((meal) => (
          <Card key={meal.name} className="card-gradient overflow-hidden">
            <div
              className="flex justify-between items-center p-4 cursor-pointer"
              onClick={() => toggleMealSection(meal.name)}
            >
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{meal.name}</h3>
                <div className="ml-2 text-sm text-gray-400">
                  {meal.foods.length} {meal.foods.length === 1 ? "item" : "items"} |{" "}
                  {meal.foods.reduce((acc, food) => acc + food.nutrition.calories * food.quantity, 0)} kcal
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                {meal.isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>

            {meal.isOpen && (
              <div className="px-4 pb-4">
                {meal.foods.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No foods added to {meal.name.toLowerCase()} yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-700">
                          <th className="pb-2">Food</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2 text-right">Calories</th>
                          <th className="pb-2 text-right">Protein</th>
                          <th className="pb-2 text-right">Carbs</th>
                          <th className="pb-2 text-right">Fat</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.foods.map((food) => (
                          <tr key={food.id} className="border-b border-gray-800">
                            <td className="py-2">{food.name}</td>
                            <td className="py-2">
                              {food.quantity} × {food.servingSize.amount}
                              {food.servingSize.unit}
                            </td>
                            <td className="py-2 text-right">{Math.round(food.nutrition.calories * food.quantity)}</td>
                            <td className="py-2 text-right">{Math.round(food.nutrition.protein * food.quantity)}g</td>
                            <td className="py-2 text-right">{Math.round(food.nutrition.carbs * food.quantity)}g</td>
                            <td className="py-2 text-right">{Math.round(food.nutrition.fat * food.quantity)}g</td>
                            <td className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFoodFromMeal(meal.name, food.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-gray-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="pt-2" colSpan={2}>
                            Total
                          </td>
                          <td className="pt-2 text-right">
                            {meal.foods.reduce((acc, food) => acc + food.nutrition.calories * food.quantity, 0)}
                          </td>
                          <td className="pt-2 text-right">
                            {meal.foods.reduce((acc, food) => acc + food.nutrition.protein * food.quantity, 0)}g
                          </td>
                          <td className="pt-2 text-right">
                            {meal.foods.reduce((acc, food) => acc + food.nutrition.carbs * food.quantity, 0)}g
                          </td>
                          <td className="pt-2 text-right">
                            {meal.foods.reduce((acc, food) => acc + food.nutrition.fat * food.quantity, 0)}g
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeal(meal.name.toLowerCase())
                      setSearchTerm("")
                      setShowSearchResults(false)
                    }}
                    className="button-outline"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Food to {meal.name}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Nutrition Goals Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Daily Calories</label>
              <Input
                type="number"
                value={dailyGoals.calories}
                onChange={(e) => updateDailyGoals({ calories: Number.parseInt(e.target.value) || 0 })}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Protein (g)</label>
              <Input
                type="number"
                value={dailyGoals.protein}
                onChange={(e) => updateDailyGoals({ protein: Number.parseInt(e.target.value) || 0 })}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Carbs (g)</label>
              <Input
                type="number"
                value={dailyGoals.carbs}
                onChange={(e) => updateDailyGoals({ carbs: Number.parseInt(e.target.value) || 0 })}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Fat (g)</label>
              <Input
                type="number"
                value={dailyGoals.fat}
                onChange={(e) => updateDailyGoals({ fat: Number.parseInt(e.target.value) || 0 })}
                className="input-dark"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
