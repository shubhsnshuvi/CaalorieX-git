"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/use-auth"
import { searchAllFoodSources } from "@/lib/firestore-utils"
import { calculateIFCTNutritionForPortion } from "@/lib/ifct-api"
import { calculateNutritionForPortion } from "@/lib/usda-api"
import { PlusCircle, Trash2, X, RefreshCw, Edit, Save, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hasUser, setHasUser] = useState(false)

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

  // Load user's daily goals and diary entries from Firestore
  useEffect(() => {
    setHasUser(!!user?.uid)
  }, [user?.uid])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

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

        // Load today's diary entries
        const today = new Date().toISOString().split("T")[0]

        // Create the parent documents if they don't exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", today)
        const diaryDoc = await getDoc(diaryDocRef)

        if (diaryDoc.exists()) {
          const data = diaryDoc.data()
          if (data.entries) {
            setDiaryEntries(data.entries)
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Don't set an error state here, just use the default values
      }
    }

    if (hasUser) {
      loadUserData()
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [hasUser, dailyGoals, user?.uid])

  // If there's an error loading user data, show an error message with a retry button
  if (error) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{error}</p>
          <Button onClick={refreshUserData} className="button-orange w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  // Save diary entries to Firestore whenever they change
  useEffect(() => {
    const saveDiaryEntries = async () => {
      if (!user?.uid) return

      try {
        const today = new Date().toISOString().split("T")[0]

        // Ensure parent collections/documents exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", today)

        // Save the diary entries
        await setDoc(diaryDocRef, { entries: diaryEntries, updatedAt: new Date() }, { merge: true })
      } catch (error) {
        console.error("Error saving diary entries:", error)
        // Don't show an error to the user, just log it
      }
    }

    // Only save if we have entries and a user
    if (user?.uid && diaryEntries.length > 0) {
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveDiaryEntries, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [diaryEntries, user?.uid])

  // Handle search input change with immediate results
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Always show search results when typing, even with a single character
    if (term.trim().length > 0) {
      setShowSearchResults(true)
      setIsSearching(true)

      // Use a very short timeout for the first few characters to make it feel instant
      const debounceTime = term.length <= 2 ? 50 : 200

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // First try to use the imported function
          let results = []
          try {
            results = await searchAllFoodSources(term.trim(), 20)
          } catch (searchError) {
            console.error("Error with searchAllFoodSources:", searchError)
            // Fallback to a basic search implementation
            results = await fallbackFoodSearch(term.trim())
          }

          setSearchResults(results)
        } catch (error) {
          console.error("Error searching for foods:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, debounceTime)
    } else {
      setShowSearchResults(false)
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Fallback search function if the imported one fails
  const fallbackFoodSearch = async (term: string) => {
    // Basic implementation that returns some default foods
    const foods = [
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
      {
        id: "default-4",
        name: "Bread, white",
        source: "default",
        nutrition: {
          calories: 75,
          protein: 2.6,
          carbs: 14,
          fat: 1.0,
        },
      },
      {
        id: "default-5",
        name: "Butter",
        source: "default",
        nutrition: {
          calories: 102,
          protein: 0.1,
          carbs: 0.1,
          fat: 11.5,
        },
      },
      {
        id: "default-6",
        name: "Broccoli",
        source: "default",
        nutrition: {
          calories: 34,
          protein: 2.8,
          carbs: 6.6,
          fat: 0.4,
        },
      },
    ]

    // Filter foods that start with the search term (case insensitive)
    return foods.filter((food) => food.name.toLowerCase().startsWith(term.toLowerCase()))
  }

  const handleFoodSelect = (food: any) => {
    setSelectedFood(food)
    setShowSearchResults(false)
  }

  // Add food to diary
  const addFoodToDiary = () => {
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
    }

    setDiaryEntries((prev) => [...prev, newFood].sort((a, b) => a.timestamp - b.timestamp))

    // Reset selection
    setSelectedFood(null)
    setQuantity(1)
    setSearchTerm("")
  }

  // Add note to diary
  const addNoteToDiary = () => {
    if (!newNote.trim()) return

    const note: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: newNote.trim(),
      timestamp: Date.now(),
    }

    setDiaryEntries((prev) => [...prev, note].sort((a, b) => a.timestamp - b.timestamp))
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
                {Math.abs(Math.round(remaining.calories))} kcal remaining
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
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
                <div className="flex justify-between">
                  <span>Protein</span>
                  <span>
                    {Math.round(dailyTotals.protein)}g / {dailyGoals.protein}g
                  </span>
                </div>
                <Progress value={percentages.protein} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Carbs</span>
                  <span>
                    {Math.round(dailyTotals.carbs)}g / {dailyGoals.carbs}g
                  </span>
                </div>
                <Progress value={percentages.carbs} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
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
          <CardTitle>Add Food</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search for a food (e.g., banana, roti, rice)"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input-dark flex-grow"
                />

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

                {showSearchResults && searchResults.length === 0 && isSearching && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3">
                    Searching for "{searchTerm}"...
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && !isSearching && searchTerm.trim() !== "" && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Button onClick={addFoodToDiary} className="button-orange">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Food
                  </Button>
                </div>
              </div>
            )}

            {/* Add Note Section */}
            <div className="mt-4">
              <label className="block text-sm mb-1">Add Note</label>
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Add a note (e.g., 'Feeling hungry today', 'Skipped breakfast')"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input-dark flex-grow"
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
          <CardTitle>Food Diary</CardTitle>
        </CardHeader>
        <CardContent>
          {diaryEntries.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No entries yet. Add foods or notes to get started.</div>
          ) : (
            <div className="space-y-4">
              {diaryEntries.map((entry) => {
                if (isFoodItem(entry)) {
                  // Render food item
                  return (
                    <div key={entry.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-gray-400">
                          {entry.quantity} × {entry.servingSize.amount}
                          {entry.servingSize.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div>{Math.round(entry.nutrition.calories * entry.quantity)} kcal</div>
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
                            className="input-dark"
                            rows={2}
                            id={`note-edit-${entry.id}`}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingNoteId(null)}
                              className="button-outline"
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
                          <div className="whitespace-pre-wrap">{entry.content}</div>
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
