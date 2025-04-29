"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/use-auth"
import { PlusCircle, Trash2, X, RefreshCw, Edit, Save, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  timestamp: number
  category?: string // Added for meal categorization (breakfast, lunch, dinner, snack)
}

interface NoteItem {
  id: string
  content: string
  timestamp: number
  isEditing?: boolean
}

type DiaryEntry = FoodItem | NoteItem

interface DailyGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Helper function to check if an item is a food item
const isFoodItem = (item: DiaryEntry): item is FoodItem => {
  return (item as FoodItem).nutrition !== undefined
}

// Helper function to check if an item is a note
const isNoteItem = (item: DiaryEntry): item is NoteItem => {
  return (item as NoteItem).content !== undefined
}

export function CalorieTracker() {
  const { user, userData, loading, error, refreshUserData } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [servingSize, setServingSize] = useState<{ amount: number; unit: string }>({ amount: 100, unit: "g" })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70,
  })
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedCategory, setSelectedCategory] = useState<string>("any")

  // Calculate daily totals
  const dailyTotals = diaryEntries.reduce(
    (acc, entry) => {
      if (isFoodItem(entry)) {
        acc.calories += entry.nutrition.calories * entry.quantity
        acc.protein += entry.nutrition.protein * entry.quantity
        acc.carbs += entry.nutrition.carbs * entry.quantity
        acc.fat += entry.nutrition.fat * entry.quantity
      }
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

  // Direct search function for IFCT foods - IMPROVED FOR REAL-TIME SEARCH
  const searchIFCTFoods = async (term: string) => {
    if (!term || term.length < 2) return []

    try {
      console.log("Searching IFCT for:", term)
      const foodsRef = collection(db, "ifct_foods")
      const results: any[] = []

      // First try exact keyword match
      let q = query(foodsRef, where("keywords", "array-contains", term.toLowerCase()), limit(10))
      let querySnapshot = await getDocs(q)

      if (querySnapshot.empty && term.length > 0) {
        // If no results, try partial match with a limit
        q = query(foodsRef, limit(50))
        querySnapshot = await getDocs(q)

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const name = (data.name || "").toLowerCase()

          if (name.includes(term.toLowerCase())) {
            results.push({
              id: doc.id,
              name: data.name || "Unknown Food",
              source: "ifct",
              nutrients: {
                calories: data.nutrients?.calories || 0,
                protein: data.nutrients?.protein || 0,
                fat: data.nutrients?.fat || 0,
                carbohydrates: data.nutrients?.carbohydrates || 0,
              },
              category: data.category || "General",
            })
          }
        })
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          results.push({
            id: doc.id,
            name: data.name || "Unknown Food",
            source: "ifct",
            nutrients: {
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbohydrates: data.nutrients?.carbohydrates || 0,
            },
            category: data.category || "General",
          })
        })
      }

      console.log(`Found ${results.length} IFCT results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching IFCT foods:", error)
      return []
    }
  }

  // Search USDA database - IMPROVED FOR REAL-TIME SEARCH
  const searchUSDAFoods = async (term: string) => {
    if (!term || term.length < 2) return []

    try {
      console.log("Searching USDA for:", term)
      // Use the API proxy route
      const response = await fetch(`/api/usda?action=search&query=${encodeURIComponent(term)}`)

      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.foods || data.foods.length === 0) {
        return []
      }

      const results = data.foods.map((food: any) => {
        // Extract nutrients
        const nutrients = food.foodNutrients || []
        const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
        const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
        const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0
        const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0

        return {
          id: food.fdcId,
          name: food.description || "Unknown Food",
          source: "usda",
          nutrients: {
            calories: calories,
            protein: protein,
            fat: fat,
            carbohydrates: carbs,
          },
          category: food.foodCategory || "USDA",
        }
      })

      console.log(`Found ${results.length} USDA results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching USDA foods:", error)
      return []
    }
  }

  // Fallback search function with default foods
  const getFallbackFoods = (term: string) => {
    const defaultFoods = [
      {
        id: "default-1",
        name: "Banana",
        source: "default",
        nutrients: {
          calories: 105,
          protein: 1.3,
          fat: 0.4,
          carbohydrates: 27,
        },
        category: "Fruits",
      },
      {
        id: "default-2",
        name: "Apple",
        source: "default",
        nutrients: {
          calories: 95,
          protein: 0.5,
          fat: 0.3,
          carbohydrates: 25,
        },
        category: "Fruits",
      },
      {
        id: "default-3",
        name: "Rice (cooked)",
        source: "default",
        nutrients: {
          calories: 130,
          protein: 2.7,
          fat: 0.3,
          carbohydrates: 28,
        },
        category: "Grains",
      },
      {
        id: "default-4",
        name: "Bread, white",
        source: "default",
        nutrients: {
          calories: 75,
          protein: 2.6,
          fat: 1.0,
          carbohydrates: 14,
        },
        category: "Grains",
      },
      {
        id: "default-5",
        name: "Chicken Breast (cooked)",
        source: "default",
        nutrients: {
          calories: 165,
          protein: 31,
          fat: 3.6,
          carbohydrates: 0,
        },
        category: "Protein",
      },
      {
        id: "default-6",
        name: "Egg, whole",
        source: "default",
        nutrients: {
          calories: 72,
          protein: 6.3,
          fat: 4.8,
          carbohydrates: 0.4,
        },
        category: "Protein",
      },
      {
        id: "default-7",
        name: "Milk, whole",
        source: "default",
        nutrients: {
          calories: 61,
          protein: 3.2,
          fat: 3.3,
          carbohydrates: 4.8,
        },
        category: "Dairy",
      },
      {
        id: "default-8",
        name: "Spinach, raw",
        source: "default",
        nutrients: {
          calories: 23,
          protein: 2.9,
          fat: 0.4,
          carbohydrates: 3.6,
        },
        category: "Vegetables",
      },
      {
        id: "default-9",
        name: "Lentils, cooked",
        source: "default",
        nutrients: {
          calories: 116,
          protein: 9.0,
          fat: 0.4,
          carbohydrates: 20.0,
        },
        category: "Legumes",
      },
      {
        id: "default-10",
        name: "Salmon, cooked",
        source: "default",
        nutrients: {
          calories: 206,
          protein: 22.1,
          fat: 12.4,
          carbohydrates: 0,
        },
        category: "Protein",
      },
    ]

    if (!term) return defaultFoods

    return defaultFoods.filter((food) => food.name.toLowerCase().includes(term.toLowerCase()))
  }

  // IMPROVED REAL-TIME SEARCH FUNCTION
  const performSearch = async (term: string) => {
    if (!term || term.trim() === "") {
      setSearchResults(getFallbackFoods(""))
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    console.log("Performing search for:", term)

    try {
      // Search in parallel for faster results
      const [ifctResults, usdaResults] = await Promise.all([searchIFCTFoods(term), searchUSDAFoods(term)])

      // Get fallback results if needed
      const fallbackResults = term.length >= 2 ? getFallbackFoods(term) : []

      // Combine all results
      const combinedResults = [...ifctResults, ...usdaResults, ...fallbackResults]

      // Prioritize exact matches
      const exactMatches = combinedResults.filter((food) => food.name.toLowerCase() === term.toLowerCase())

      const startsWithMatches = combinedResults.filter(
        (food) =>
          food.name.toLowerCase().startsWith(term.toLowerCase()) && food.name.toLowerCase() !== term.toLowerCase(),
      )

      const otherMatches = combinedResults.filter(
        (food) =>
          !food.name.toLowerCase().startsWith(term.toLowerCase()) && food.name.toLowerCase() !== term.toLowerCase(),
      )

      // Sort results by relevance
      const sortedResults = [...exactMatches, ...startsWithMatches, ...otherMatches]

      // Limit to 20 results for performance
      const limitedResults = sortedResults.slice(0, 20)

      console.log(`Found ${limitedResults.length} total results for "${term}"`)
      setSearchResults(limitedResults)
    } catch (error) {
      console.error("Search error:", error)
      // Use fallback foods if search fails
      setSearchResults(getFallbackFoods(term))
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change with immediate results
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Show search results immediately when typing
    if (term.trim().length > 0) {
      setShowSearchResults(true)

      // Use a very short timeout for immediate response
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term)
      }, 100) // Very short timeout for immediate response
    } else {
      setShowSearchResults(false)
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Load user's daily goals and diary entries from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setIsUserLoading(false)
        return
      }

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

        // Load diary entries for the selected date
        await loadDiaryEntriesForDate(selectedDate)
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsUserLoading(false)
      }
    }

    loadUserData()
  }, [user?.uid, selectedDate])

  // Load diary entries for a specific date
  const loadDiaryEntriesForDate = async (date: string) => {
    if (!user?.uid) return

    try {
      // Create the parent documents if they don't exist
      const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
      await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

      const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", date)
      const diaryDoc = await getDoc(diaryDocRef)

      if (diaryDoc.exists()) {
        const data = diaryDoc.data()
        if (data.entries) {
          setDiaryEntries(data.entries)
        } else {
          setDiaryEntries([])
        }
      } else {
        setDiaryEntries([])
      }
    } catch (error) {
      console.error(`Error loading diary entries for ${date}:`, error)
      setDiaryEntries([])
    }
  }

  // Save diary entries to Firestore whenever they change
  useEffect(() => {
    const saveDiaryEntries = async () => {
      if (!user?.uid) return

      try {
        // Ensure parent collections/documents exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", selectedDate)

        // Save the diary entries
        await setDoc(diaryDocRef, { entries: diaryEntries, updatedAt: new Date() }, { merge: true })
      } catch (error) {
        console.error("Error saving diary entries:", error)
      }
    }

    // Only save if we have a user
    if (user?.uid) {
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveDiaryEntries, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [diaryEntries, user?.uid, selectedDate])

  const handleFoodSelect = (food: any) => {
    console.log("Selected food:", food)
    setSelectedFood(food)
    setShowSearchResults(false)
  }

  // Add food to diary
  const addFoodToDiary = () => {
    if (!selectedFood) return

    console.log("Adding food to diary:", selectedFood)

    // Calculate nutrition based on the food source and serving size
    const nutrition = {
      calories: calculateNutritionValue(selectedFood, "calories", servingSize.amount),
      protein: calculateNutritionValue(selectedFood, "protein", servingSize.amount),
      carbs: calculateNutritionValue(selectedFood, "carbohydrates", servingSize.amount),
      fat: calculateNutritionValue(selectedFood, "fat", servingSize.amount),
    }

    const newFood: FoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: selectedFood.name || selectedFood.foodName || selectedFood.description || "Unknown Food",
      source: selectedFood.source || "unknown",
      quantity: quantity,
      servingSize: {
        amount: servingSize.amount,
        unit: servingSize.unit,
        description: `${servingSize.amount} ${servingSize.unit}`,
      },
      nutrition,
      timestamp: Date.now(),
      category:
        selectedCategory !== "any" ? selectedCategory : determineFoodCategory(selectedFood.name, new Date().getHours()),
    }

    console.log("New food entry:", newFood)

    // Add the new food item to the diary entries
    setDiaryEntries((prev) => {
      const newEntries = [...prev, newFood].sort((a, b) => a.timestamp - b.timestamp)
      console.log("Updated diary entries:", newEntries)
      return newEntries
    })

    // Reset selection
    setSelectedFood(null)
    setQuantity(1)
    setSearchTerm("")
  }

  // Determine food category based on name and time of day
  const determineFoodCategory = (foodName: string, hour: number): string => {
    const name = foodName.toLowerCase()

    // Check for specific food types
    if (
      name.includes("breakfast") ||
      name.includes("cereal") ||
      name.includes("oatmeal") ||
      name.includes("pancake") ||
      name.includes("waffle") ||
      name.includes("toast") ||
      name.includes("idli") ||
      name.includes("dosa") ||
      name.includes("upma") ||
      name.includes("poha")
    ) {
      return "breakfast"
    }

    if (name.includes("dinner") || name.includes("supper")) {
      return "dinner"
    }

    if (name.includes("lunch")) {
      return "lunch"
    }

    if (
      name.includes("snack") ||
      name.includes("cookie") ||
      name.includes("chips") ||
      name.includes("nuts") ||
      name.includes("fruit") ||
      name.includes("yogurt")
    ) {
      return "snack"
    }

    // Determine by time of day
    if (hour >= 5 && hour < 11) {
      return "breakfast"
    } else if (hour >= 11 && hour < 15) {
      return "lunch"
    } else if (hour >= 15 && hour < 18) {
      return "snack"
    } else {
      return "dinner"
    }
  }

  // Calculate nutrition value based on serving size
  const calculateNutritionValue = (food: any, nutrient: string, amount: number) => {
    // Default per 100g
    const baseAmount = 100
    const ratio = amount / baseAmount

    // Try to get the nutrient value from different possible structures
    let value = 0

    if (food.nutrients && food.nutrients[nutrient] !== undefined) {
      value = food.nutrients[nutrient]
    } else if (food.nutrition && food.nutrition[nutrient] !== undefined) {
      value = food.nutrition[nutrient]
    } else if (food.nutritionalInfo && food.nutritionalInfo[nutrient] !== undefined) {
      value = food.nutritionalInfo[nutrient]
    } else if (nutrient === "carbs" && food.nutrients && food.nutrients.carbohydrates !== undefined) {
      value = food.nutrients.carbohydrates
    } else if (nutrient === "carbs" && food.nutrition && food.nutrition.carbohydrates !== undefined) {
      value = food.nutrition.carbohydrates
    }

    return value * ratio
  }

  // Add note to diary
  const addNoteToDiary = () => {
    if (!newNote.trim()) return

    console.log("Adding note to diary:", newNote)

    const note: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: newNote.trim(),
      timestamp: Date.now(),
    }

    // Add the new note to the diary entries
    setDiaryEntries((prev) => {
      const newEntries = [...prev, note].sort((a, b) => a.timestamp - b.timestamp)
      console.log("Updated diary entries with note:", newEntries)
      return newEntries
    })

    setNewNote("")
  }

  // Start editing a note
  const startEditingNote = (id: string) => {
    setEditingNoteId(id)
  }

  // Save edited note
  const saveEditedNote = (id: string, content: string) => {
    setDiaryEntries((prev) =>
      prev.map((entry) => {
        if (isNoteItem(entry) && entry.id === id) {
          return { ...entry, content }
        }
        return entry
      }),
    )
    setEditingNoteId(null)
  }

  // Remove entry from diary
  const removeEntryFromDiary = (id: string) => {
    setDiaryEntries((prev) => prev.filter((entry) => entry.id !== id))
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

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
  }

  // Filter diary entries by category
  const filteredDiaryEntries = diaryEntries.filter((entry) => {
    if (selectedCategory === "any") return true
    if (isNoteItem(entry)) return true
    return (entry as FoodItem).category === selectedCategory
  })

  // If there's an error loading user data, show an error message with a retry button
  if (error) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white">{error}</p>
          <Button onClick={refreshUserData} className="button-orange w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If still loading, show a loading indicator
  if (loading || isUserLoading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-white">Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Date Selector */}
      <Card className="card-gradient">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <label htmlFor="date-selector" className="text-white font-medium">
              Select Date:
            </label>
            <Input
              id="date-selector"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="input-dark w-auto text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary - Sticky Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2 shadow-md">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-white">
              <span>Daily Summary</span>
              <span className={`text-xl ${remaining.calories < 0 ? "text-red-500" : "text-green-500"}`}>
                {remaining.calories < 0 ? "-" : ""}
                {Math.abs(Math.round(remaining.calories))} kcal remaining
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Calories</span>
                  <span>
                    {Math.round(dailyTotals.calories)} / {dailyGoals.calories}
                  </span>
                </div>
                <Progress
                  value={percentages.calories}
                  className="h-2"
                  indicatorClassName={remaining.calories < 0 ? "bg-red-500" : "bg-orange-500"}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Protein</span>
                  <span>
                    {Math.round(dailyTotals.protein)}g / {dailyGoals.protein}g
                  </span>
                </div>
                <Progress value={percentages.protein} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Carbs</span>
                  <span>
                    {Math.round(dailyTotals.carbs)}g / {dailyGoals.carbs}g
                  </span>
                </div>
                <Progress value={percentages.carbs} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>Fat</span>
                  <span>
                    {Math.round(dailyTotals.fat)}g / {dailyGoals.fat}g
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
          <CardTitle className="text-white">Add Food</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search for a food item..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-dark flex-grow text-white"
                />

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="flex justify-between items-center p-2 border-b border-gray-700">
                      <span className="text-sm font-medium text-white">Search Results</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSearchResults(false)}
                        className="h-6 w-6 p-0 text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul>
                      {searchResults.map((food) => (
                        <li
                          key={`${food.source}-${food.id}`}
                          className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800 text-white"
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
                                  : food.source === "default"
                                    ? "Default Foods"
                                    : "USDA"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && isSearching && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3 text-white">
                    Searching for "{searchTerm}"...
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && !isSearching && searchTerm.trim() !== "" && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3 text-white">
                    No foods found. Try a different search term.
                  </div>
                )}
              </div>
            </div>

            {/* Meal Category Selector */}
            <div>
              <label className="block text-sm mb-1 text-white">Meal Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="select-dark text-white">
                  <SelectValue placeholder="Select meal category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Category</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedFood && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="font-medium mb-2 text-white">
                  {selectedFood.name || selectedFood.foodName || selectedFood.description}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-white">Serving Size</label>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="1"
                        value={servingSize.amount}
                        onChange={(e) =>
                          setServingSize({ ...servingSize, amount: Number.parseInt(e.target.value) || 0 })
                        }
                        className="input-dark w-20 mr-2 text-white"
                      />
                      <Select
                        value={servingSize.unit}
                        onValueChange={(value) => setServingSize({ ...servingSize, unit: value })}
                      >
                        <SelectTrigger className="select-dark w-24 text-white">
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
                    <label className="block text-sm mb-1 text-white">Quantity</label>
                    <Input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                      className="input-dark text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFood(null)}
                    className="mr-2 button-outline text-white"
                  >
                    Cancel
                  </Button>
                  <Button onClick={addFoodToDiary} className="button-orange">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Food
                  </Button>
                </div>
              </div>
            )}

            {/* Add Note Section */}
            <div className="mt-4">
              <label className="block text-sm mb-1 text-white">Add Note</label>
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Add a note (e.g., 'Feeling hungry today', 'Skipped breakfast')"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input-dark flex-grow text-white"
                  rows={2}
                />
                <Button onClick={addNoteToDiary} className="button-orange mt-1" disabled={!newNote.trim()}>
                  <FileText className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Diary */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-white">Food Diary</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "any" ? "default" : "outline"}
                onClick={() => setSelectedCategory("any")}
                className={selectedCategory === "any" ? "bg-orange-600" : "text-white"}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "breakfast" ? "default" : "outline"}
                onClick={() => setSelectedCategory("breakfast")}
                className={selectedCategory === "breakfast" ? "bg-blue-600" : "text-white"}
              >
                Breakfast
              </Button>
              <Button
                variant={selectedCategory === "lunch" ? "default" : "outline"}
                onClick={() => setSelectedCategory("lunch")}
                className={selectedCategory === "lunch" ? "bg-green-600" : "text-white"}
              >
                Lunch
              </Button>
              <Button
                variant={selectedCategory === "dinner" ? "default" : "outline"}
                onClick={() => setSelectedCategory("dinner")}
                className={selectedCategory === "dinner" ? "bg-purple-600" : "text-white"}
              >
                Dinner
              </Button>
              <Button
                variant={selectedCategory === "snack" ? "default" : "outline"}
                onClick={() => setSelectedCategory("snack")}
                className={selectedCategory === "snack" ? "bg-yellow-600" : "text-white"}
              >
                Snack
              </Button>
            </div>
          </div>

          {filteredDiaryEntries.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No entries yet. Add foods or notes to get started.</div>
          ) : (
            <div className="space-y-4">
              {filteredDiaryEntries.map((entry) => {
                if (isFoodItem(entry)) {
                  // Render food item
                  const categoryColor =
                    entry.category === "breakfast"
                      ? "border-blue-500"
                      : entry.category === "lunch"
                        ? "border-green-500"
                        : entry.category === "dinner"
                          ? "border-purple-500"
                          : entry.category === "snack"
                            ? "border-yellow-500"
                            : "border-gray-500"

                  return (
                    <div
                      key={entry.id}
                      className={`bg-gray-800 p-3 rounded-md flex justify-between items-center border-l-4 ${categoryColor}`}
                    >
                      <div>
                        <div className="font-medium text-white">{entry.name}</div>
                        <div className="text-sm text-gray-400">
                          {entry.quantity} × {entry.servingSize.amount}
                          {entry.servingSize.unit}
                          {entry.category && (
                            <span className="ml-2">
                              • {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white">{Math.round(entry.nutrition.calories * entry.quantity)} kcal</div>
                          <div className="text-xs text-gray-400">
                            P: {Math.round(entry.nutrition.protein * entry.quantity)}g | C:{" "}
                            {Math.round(entry.nutrition.carbs * entry.quantity)}g | F:{" "}
                            {Math.round(entry.nutrition.fat * entry.quantity)}g
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEntryFromDiary(entry.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove food</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )
                } else if (isNoteItem(entry)) {
                  // Render note item
                  return (
                    <div key={entry.id} className="bg-gray-700 p-3 rounded-md border-l-4 border-orange-500">
                      {editingNoteId === entry.id ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            defaultValue={entry.content}
                            className="input-dark text-white"
                            rows={2}
                            id={`note-edit-${entry.id}`}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingNoteId(null)}
                              className="button-outline text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.getElementById(`note-edit-${entry.id}`) as HTMLTextAreaElement
                                if (textarea) {
                                  saveEditedNote(entry.id, textarea.value)
                                }
                              }}
                              className="button-orange"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="whitespace-pre-wrap text-white">{entry.content}</div>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingNote(entry.id)}
                                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit note</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEntryFromDiary(entry.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-gray-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove note</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrition Goals Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-white">Nutrition Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1 text-white">Daily Calories</label>
              <Input
                type="number"
                value={dailyGoals.calories}
                onChange={(e) => updateDailyGoals({ calories: Number.parseInt(e.target.value) || 0 })}
                className="input-dark text-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white">Protein (g)</label>
              <Input
                type="number"
                value={dailyGoals.protein}
                onChange={(e) => updateDailyGoals({ protein: Number.parseInt(e.target.value) || 0 })}
                className="input-dark text-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white">Carbs (g)</label>
              <Input
                type="number"
                value={dailyGoals.carbs}
                onChange={(e) => updateDailyGoals({ carbs: Number.parseInt(e.target.value) || 0 })}
                className="input-dark text-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white">Fat (g)</label>
              <Input
                type="number"
                value={dailyGoals.fat}
                onChange={(e) => updateDailyGoals({ fat: Number.parseInt(e.target.value) || 0 })}
                className="input-dark text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
