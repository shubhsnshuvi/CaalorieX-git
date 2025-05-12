"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { useAuth } from "@/lib/use-auth"
import {
  PlusCircle,
  Trash2,
  X,
  RefreshCw,
  Edit,
  Save,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Droplet,
  Plus,
  Filter,
  SortDesc,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, addDays, subDays, parseISO, isToday, isYesterday, isTomorrow } from "date-fns"

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
    fiber?: number
    sugar?: number
    sodium?: number
  }
  timestamp: number
  category: string // breakfast, lunch, dinner, snack
  isFavorite?: boolean
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
  fiber?: number
  sugar?: number
  sodium?: number
  water?: number
}

interface WaterIntake {
  amount: number // in ml
  timestamp: number
}

interface DailyLog {
  entries: DiaryEntry[]
  water: WaterIntake[]
  date: string
  updatedAt: Timestamp
}

// Helper function to check if an item is a food item
const isFoodItem = (item: DiaryEntry): item is FoodItem => {
  return (item as FoodItem).nutrition !== undefined
}

// Helper function to check if an item is a note
const isNoteItem = (item: DiaryEntry): item is NoteItem => {
  return (item as NoteItem).content !== undefined
}

// Format date for display
const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMM d")
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

export function CalorieTracker() {
  // Auth and user data
  const { user, userData, loading: authLoading, error: authError, refreshUserData } = useAuth()

  // State for food search and selection
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [servingSize, setServingSize] = useState<{ amount: number; unit: string }>({ amount: 100, unit: "g" })
  const [showSearchResults, setShowSearchResults] = useState(false)

  // State for diary entries and goals
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70,
    fiber: 30,
    sugar: 50,
    sodium: 2300,
    water: 2000,
  })
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"diary" | "summary" | "goals">("diary")
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([])
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [showFoodDialog, setShowFoodDialog] = useState(false)
  const [showWaterDialog, setShowWaterDialog] = useState(false)
  const [waterAmount, setWaterAmount] = useState(250)
  const [sortOrder, setSortOrder] = useState<"time" | "category">("time")

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const setSearchInputRef = useRef<(input: HTMLInputElement | null) => void>(() => {})

  // Calculate daily totals from diary entries
  const dailyTotals = useMemo(() => {
    return diaryEntries.reduce(
      (acc, entry) => {
        if (isFoodItem(entry)) {
          acc.calories += entry.nutrition.calories * entry.quantity
          acc.protein += entry.nutrition.protein * entry.quantity
          acc.carbs += entry.nutrition.carbs * entry.quantity
          acc.fat += entry.nutrition.fat * entry.quantity

          if (entry.nutrition.fiber) {
            acc.fiber += entry.nutrition.fiber * entry.quantity
          }

          if (entry.nutrition.sugar) {
            acc.sugar += entry.nutrition.sugar * entry.quantity
          }

          if (entry.nutrition.sodium) {
            acc.sodium += entry.nutrition.sodium * entry.quantity
          }
        }
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    )
  }, [diaryEntries])

  // Calculate total water intake
  const totalWaterIntake = useMemo(() => {
    return waterIntake.reduce((total, item) => total + item.amount, 0)
  }, [waterIntake])

  // Calculate remaining calories and macros
  const remaining = useMemo(
    () => ({
      calories: dailyGoals.calories - dailyTotals.calories,
      protein: dailyGoals.protein - dailyTotals.protein,
      carbs: dailyGoals.carbs - dailyTotals.carbs,
      fat: dailyGoals.fat - dailyTotals.fat,
      fiber: (dailyGoals.fiber || 30) - dailyTotals.fiber,
      sugar: (dailyGoals.sugar || 50) - dailyTotals.sugar,
      sodium: (dailyGoals.sodium || 2300) - dailyTotals.sodium,
      water: (dailyGoals.water || 2000) - totalWaterIntake,
    }),
    [dailyGoals, dailyTotals, totalWaterIntake],
  )

  // Calculate percentages for progress bars
  const percentages = useMemo(
    () => ({
      calories: Math.min(100, (dailyTotals.calories / dailyGoals.calories) * 100),
      protein: Math.min(100, (dailyTotals.protein / dailyGoals.protein) * 100),
      carbs: Math.min(100, (dailyTotals.carbs / dailyGoals.carbs) * 100),
      fat: Math.min(100, (dailyTotals.fat / dailyGoals.fat) * 100),
      fiber: Math.min(100, (dailyTotals.fiber / (dailyGoals.fiber || 30)) * 100),
      sugar: Math.min(100, (dailyTotals.sugar / (dailyGoals.sugar || 50)) * 100),
      sodium: Math.min(100, (dailyTotals.sodium / (dailyGoals.sodium || 2300)) * 100),
      water: Math.min(100, (totalWaterIntake / (dailyGoals.water || 2000)) * 100),
    }),
    [dailyGoals, dailyTotals, totalWaterIntake],
  )

  // Calculate macronutrient distribution
  const macroDistribution = useMemo(() => {
    const totalCalories = dailyTotals.calories
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 }

    return {
      protein: Math.round(((dailyTotals.protein * 4) / totalCalories) * 100),
      carbs: Math.round(((dailyTotals.carbs * 4) / totalCalories) * 100),
      fat: Math.round(((dailyTotals.fat * 9) / totalCalories) * 100),
    }
  }, [dailyTotals])

  // Filter diary entries by category
  const filteredDiaryEntries = useMemo(() => {
    let entries = [...diaryEntries]

    // Apply category filter
    if (selectedCategory !== "all") {
      entries = entries.filter((entry) => {
        if (isNoteItem(entry)) return selectedCategory === "notes"
        return (entry as FoodItem).category === selectedCategory
      })
    }

    // Apply sorting
    if (sortOrder === "time") {
      entries.sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOrder === "category") {
      entries.sort((a, b) => {
        if (isNoteItem(a) && isFoodItem(b)) return 1
        if (isFoodItem(a) && isNoteItem(b)) return -1
        if (isFoodItem(a) && isFoodItem(b)) {
          const categoryOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 }
          return categoryOrder[a.category] - categoryOrder[b.category]
        }
        return 0
      })
    }

    return entries
  }, [diaryEntries, selectedCategory, sortOrder])

  // Group entries by meal category for summary view
  const entriesByCategory = useMemo(() => {
    const grouped = {
      breakfast: [] as FoodItem[],
      lunch: [] as FoodItem[],
      dinner: [] as FoodItem[],
      snack: [] as FoodItem[],
    }

    diaryEntries.forEach((entry) => {
      if (isFoodItem(entry) && entry.category in grouped) {
        grouped[entry.category as keyof typeof grouped].push(entry)
      }
    })

    return grouped
  }, [diaryEntries])

  // Calculate totals by category
  const totalsByCategory = useMemo(() => {
    const result = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    }

    Object.entries(entriesByCategory).forEach(([category, items]) => {
      items.forEach((item) => {
        result[category as keyof typeof result].calories += item.nutrition.calories * item.quantity
        result[category as keyof typeof result].protein += item.nutrition.protein * item.quantity
        result[category as keyof typeof result].carbs += item.nutrition.carbs * item.quantity
        result[category as keyof typeof result].fat += item.nutrition.fat * item.quantity
      })
    })

    return result
  }, [entriesByCategory])

  // Load user's daily goals and diary entries from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setIsUserLoading(false)
        return
      }

      try {
        console.log(`Loading user data for date: ${selectedDate}`)
        setIsUserLoading(true)

        // Load daily goals
        const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
        const goalsDoc = await getDoc(goalsDocRef)

        if (goalsDoc.exists()) {
          console.log("Daily goals loaded:", goalsDoc.data())
          setDailyGoals(goalsDoc.data() as DailyGoals)
        } else {
          // Create default goals if they don't exist
          const defaultGoals = {
            calories: 2000,
            protein: 100,
            carbs: 250,
            fat: 70,
            fiber: 30,
            sugar: 50,
            sodium: 2300,
            water: 2000,
          }
          console.log("Creating default goals:", defaultGoals)
          await setDoc(goalsDocRef, defaultGoals)
          setDailyGoals(defaultGoals)
        }

        // Load diary entries for the selected date
        await loadDiaryEntriesForDate(selectedDate)

        // Load favorite foods
        await loadFavoriteFoods()

        // Load recent foods
        await loadRecentFoods()
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
      console.log(`Loading diary entries for date: ${date}`)

      // Create the parent documents if they don't exist
      const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
      await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

      const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", date)
      const diaryDoc = await getDoc(diaryDocRef)

      if (diaryDoc.exists()) {
        const data = diaryDoc.data() as DailyLog
        console.log(`Found diary entries for ${date}:`, data)

        if (data.entries) {
          setDiaryEntries(data.entries)
        } else {
          setDiaryEntries([])
        }

        if (data.water) {
          setWaterIntake(data.water)
        } else {
          setWaterIntake([])
        }
      } else {
        console.log(`No diary entries found for ${date}, creating empty log`)
        setDiaryEntries([])
        setWaterIntake([])
      }
    } catch (error) {
      console.error(`Error loading diary entries for ${date}:`, error)
      setDiaryEntries([])
      setWaterIntake([])
    }
  }

  // Load favorite foods
  const loadFavoriteFoods = async () => {
    if (!user?.uid) return

    try {
      console.log("Loading favorite foods")
      const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
      const q = query(favoritesRef, limit(10))
      const querySnapshot = await getDocs(q)

      const favorites: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FoodItem
        favorites.push({
          ...data,
          id: doc.id,
          isFavorite: true,
        })
      })

      console.log(`Loaded ${favorites.length} favorite foods`)
      setFavoriteFoods(favorites)
    } catch (error) {
      console.error("Error loading favorite foods:", error)
    }
  }

  // Load recent foods
  const loadRecentFoods = async () => {
    if (!user?.uid) return

    try {
      console.log("Loading recent foods")
      const recentRef = collection(db, "users", user.uid, "recentFoods")
      const q = query(recentRef, orderBy("timestamp", "desc"), limit(10))
      const querySnapshot = await getDocs(q)

      const recent: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FoodItem
        recent.push({
          ...data,
          id: doc.id,
        })
      })

      console.log(`Loaded ${recent.length} recent foods`)
      setRecentFoods(recent)
    } catch (error) {
      console.error("Error loading recent foods:", error)
    }
  }

  // Save diary entries to Firestore whenever they change
  useEffect(() => {
    const saveDiaryEntries = async () => {
      if (!user?.uid) return

      try {
        console.log(`Saving diary entries for date: ${selectedDate}`)

        // Ensure parent collections/documents exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", selectedDate)

        // Save the diary entries and water intake
        await setDoc(
          diaryDocRef,
          {
            entries: diaryEntries,
            water: waterIntake,
            date: selectedDate,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        )

        console.log("Diary entries saved successfully")
      } catch (error) {
        console.error("Error saving diary entries:", error)
      }
    }

    // Only save if we have a user and entries have been loaded (not during initial load)
    if (user?.uid && !isUserLoading) {
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveDiaryEntries, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [diaryEntries, waterIntake, user?.uid, selectedDate, isUserLoading])

  // Direct search function for IFCT foods
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
                fiber: data.nutrients?.fiber || 0,
                sugar: data.nutrients?.sugar || 0,
                sodium: data.nutrients?.sodium || 0,
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
              fiber: data.nutrients?.fiber || 0,
              sugar: data.nutrients?.sugar || 0,
              sodium: data.nutrients?.sodium || 0,
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

  // Search USDA database
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
        const fiber = nutrients.find((n: any) => n.nutrientNumber === "291")?.value || 0
        const sugar = nutrients.find((n: any) => n.nutrientNumber === "269")?.value || 0
        const sodium = nutrients.find((n: any) => n.nutrientNumber === "307")?.value || 0

        return {
          id: food.fdcId,
          name: food.description || "Unknown Food",
          source: "usda",
          nutrients: {
            calories: calories,
            protein: protein,
            fat: fat,
            carbohydrates: carbs,
            fiber: fiber,
            sugar: sugar,
            sodium: sodium,
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

  // Search custom foods
  const searchCustomFoods = async (term: string) => {
    if (!user?.uid || !term || term.length < 2) return []

    try {
      console.log("Searching custom foods for:", term)
      const results: any[] = []

      // Search in user's custom foods
      const customFoodsRef = collection(db, "users", user.uid, "customFoods")
      const q = query(customFoodsRef, limit(20))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || "").toLowerCase()

        if (name.includes(term.toLowerCase())) {
          results.push({
            id: doc.id,
            name: data.name || "Custom Food",
            source: "custom",
            nutrients: {
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbohydrates: data.nutrients?.carbohydrates || 0,
              fiber: data.nutrients?.fiber || 0,
              sugar: data.nutrients?.sugar || 0,
              sodium: data.nutrients?.sodium || 0,
            },
            category: data.category || "Custom",
          })
        }
      })

      console.log(`Found ${results.length} custom food results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching custom foods:", error)
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
          fiber: 3.1,
          sugar: 14,
          sodium: 1,
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
          fiber: 4.4,
          sugar: 19,
          sodium: 2,
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
          fiber: 0.6,
          sugar: 0.1,
          sodium: 1,
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
          fiber: 0.8,
          sugar: 1.5,
          sodium: 150,
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
          fiber: 0,
          sugar: 0,
          sodium: 74,
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
          fiber: 0,
          sugar: 0.4,
          sodium: 71,
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
          fiber: 0,
          sugar: 4.8,
          sodium: 44,
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
          fiber: 2.2,
          sugar: 0.4,
          sodium: 79,
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
          fiber: 7.9,
          sugar: 1.8,
          sodium: 2,
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
          fiber: 0,
          sugar: 0,
          sodium: 59,
        },
        category: "Protein",
      },
    ]

    if (!term) return defaultFoods

    return defaultFoods.filter((food) => food.name.toLowerCase().includes(term.toLowerCase()))
  }

  // Perform search across all sources
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
      const [ifctResults, usdaResults, customResults] = await Promise.all([
        searchIFCTFoods(term),
        searchUSDAFoods(term),
        searchCustomFoods(term),
      ])

      // Get fallback results if needed
      const fallbackResults = term.length >= 2 ? getFallbackFoods(term) : []

      // Combine all results
      const combinedResults = [...ifctResults, ...usdaResults, ...customResults, ...fallbackResults]

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

      // Check if foods are favorites
      const enhancedResults = await enhanceResultsWithFavoriteStatus(limitedResults)

      console.log(`Found ${enhancedResults.length} total results for "${term}"`)
      setSearchResults(enhancedResults)
    } catch (error) {
      console.error("Search error:", error)
      // Use fallback foods if search fails
      setSearchResults(getFallbackFoods(term))
    } finally {
      setIsSearching(false)
    }
  }

  // Enhance search results with favorite status
  const enhanceResultsWithFavoriteStatus = async (results: any[]) => {
    if (!user?.uid) return results

    try {
      // Get all favorite food IDs
      const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
      const querySnapshot = await getDocs(favoritesRef)

      const favoriteIds = new Set()
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        favoriteIds.add(`${data.source}-${data.id}`)
      })

      // Mark favorites in results
      return results.map((food) => ({
        ...food,
        isFavorite: favoriteIds.has(`${food.source}-${food.id}`),
      }))
    } catch (error) {
      console.error("Error enhancing results with favorite status:", error)
      return results
    }
  }

  // Handle search input change with debounce
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

      // Use a short timeout for responsive search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term)
      }, 300)
    } else {
      setShowSearchResults(false)
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Handle food selection
  const handleFoodSelect = (food: any) => {
    console.log("Selected food:", food)
    setSelectedFood(food)
    setShowSearchResults(false)
    setShowFoodDialog(true)

    // Set default serving size based on food type
    const defaultServingSize = getDefaultServingSize(food)
    setServingSize(defaultServingSize)
  }

  // Get default serving size based on food type
  const getDefaultServingSize = (food: any) => {
    const category = (food.category || "").toLowerCase()
    const name = (food.name || "").toLowerCase()

    if (category.includes("beverage") || name.includes("milk") || name.includes("juice") || name.includes("drink")) {
      return { amount: 240, unit: "ml" }
    } else if (category.includes("fruit") || name.includes("fruit")) {
      return { amount: 100, unit: "g" }
    } else if (category.includes("vegetable") || name.includes("vegetable")) {
      return { amount: 100, unit: "g" }
    } else if (
      category.includes("meat") ||
      name.includes("chicken") ||
      name.includes("beef") ||
      name.includes("fish")
    ) {
      return { amount: 85, unit: "g" }
    } else if (name.includes("rice") || name.includes("pasta") || name.includes("noodle")) {
      return { amount: 150, unit: "g" }
    } else if (name.includes("bread") || name.includes("toast")) {
      return { amount: 30, unit: "g" }
    } else if (name.includes("egg")) {
      return { amount: 50, unit: "g" }
    }

    return { amount: 100, unit: "g" }
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
      fiber: calculateNutritionValue(selectedFood, "fiber", servingSize.amount),
      sugar: calculateNutritionValue(selectedFood, "sugar", servingSize.amount),
      sodium: calculateNutritionValue(selectedFood, "sodium", servingSize.amount),
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
        selectedCategory !== "all" ? selectedCategory : determineFoodCategory(selectedFood.name, new Date().getHours()),
      isFavorite: selectedFood.isFavorite || false,
    }

    console.log("New food entry:", newFood)

    // Add the new food item to the diary entries
    setDiaryEntries((prev) => {
      const newEntries = [...prev, newFood].sort((a, b) => a.timestamp - b.timestamp)
      console.log("Updated diary entries:", newEntries)
      return newEntries
    })

    // Add to recent foods
    addToRecentFoods(newFood)

    // Reset selection
    setSelectedFood(null)
    setQuantity(1)
    setSearchTerm("")
    setShowFoodDialog(false)
  }

  // Add to recent foods
  const addToRecentFoods = async (food: FoodItem) => {
    if (!user?.uid) return

    try {
      console.log("Adding to recent foods:", food.name)
      const recentRef = collection(db, "users", user.uid, "recentFoods")

      // Check if already exists
      const q = query(recentRef, where("name", "==", food.name), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Update existing entry
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, { timestamp: Date.now() })
      } else {
        // Add new entry
        await addDoc(recentRef, {
          ...food,
          timestamp: Date.now(),
        })
      }

      // Refresh recent foods
      await loadRecentFoods()
    } catch (error) {
      console.error("Error adding to recent foods:", error)
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (food: FoodItem) => {
    if (!user?.uid) return

    try {
      console.log(`${food.isFavorite ? "Removing from" : "Adding to"} favorites:`, food.name)

      if (food.isFavorite) {
        // Remove from favorites
        const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
        const q = query(favoritesRef, where("name", "==", food.name), limit(1))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref)
        }
      } else {
        // Add to favorites
        const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
        await addDoc(favoritesRef, {
          ...food,
          isFavorite: true,
          timestamp: Date.now(),
        })
      }

      // Update diary entries
      setDiaryEntries((prev) =>
        prev.map((entry) => {
          if (isFoodItem(entry) && entry.name === food.name) {
            return { ...entry, isFavorite: !food.isFavorite }
          }
          return entry
        }),
      )

      // Refresh favorite foods
      await loadFavoriteFoods()
    } catch (error) {
      console.error("Error toggling favorite status:", error)
    }
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

    return Math.round(value * ratio * 10) / 10 // Round to 1 decimal place
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

  // Add water intake
  const addWaterIntake = () => {
    console.log(`Adding water intake: ${waterAmount}ml`)

    const newWaterEntry: WaterIntake = {
      amount: waterAmount,
      timestamp: Date.now(),
    }

    setWaterIntake((prev) => [...prev, newWaterEntry])
    setShowWaterDialog(false)
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

  // Remove water entry
  const removeWaterEntry = (timestamp: number) => {
    setWaterIntake((prev) => prev.filter((entry) => entry.timestamp !== timestamp))
  }

  // Update daily goals
  const updateDailyGoals = async (newGoals: Partial<DailyGoals>) => {
    if (!user?.uid) return

    try {
      console.log("Updating daily goals:", newGoals)
      const updatedGoals = { ...dailyGoals, ...newGoals }
      setDailyGoals(updatedGoals)

      const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
      await updateDoc(goalsDocRef, updatedGoals)

      console.log("Daily goals updated successfully")
    } catch (error) {
      console.error("Error updating daily goals:", error)
    }
  }

  // Handle date change
  const handleDateChange = (date: string) => {
    console.log("Changing date to:", date)
    setSelectedDate(date)
  }

  // Go to previous day
  const goToPreviousDay = () => {
    const currentDate = parseISO(selectedDate)
    const previousDay = subDays(currentDate, 1)
    handleDateChange(format(previousDay, "yyyy-MM-dd"))
  }

  // Go to next day
  const goToNextDay = () => {
    const currentDate = parseISO(selectedDate)
    const nextDay = addDays(currentDate, 1)
    handleDateChange(format(nextDay, "yyyy-MM-dd"))
  }

  // Go to today
  const goToToday = () => {
    handleDateChange(new Date().toISOString().split("T")[0])
  }

  // If there's an error loading user data, show an error message with a retry button
  if (authError) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white">{authError}</p>
          <Button onClick={refreshUserData} className="bg-orange-600 hover:bg-orange-700 w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If still loading, show a loading indicator
  if (authLoading || isUserLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
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
      {/* Date Navigation */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goToPreviousDay} className="text-white hover:bg-gray-800">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only md:not-sr-only md:ml-2">Previous Day</span>
            </Button>

            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-white">{formatDateForDisplay(selectedDate)}</h2>
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 text-orange-500 mr-1" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white w-auto text-sm"
                />
              </div>
            </div>

            <Button variant="ghost" onClick={goToNextDay} className="text-white hover:bg-gray-800">
              <span className="sr-only md:not-sr-only md:mr-2">Next Day</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {!isToday(parseISO(selectedDate)) && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-orange-500 border-orange-500 hover:bg-orange-950"
              >
                Go to Today
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="diary" onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="bg-gray-800 border-gray-700 grid grid-cols-3">
          <TabsTrigger value="diary" className="data-[state=active]:bg-orange-600 text-white">
            Food Diary
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-orange-600 text-white">
            Summary
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-orange-600 text-white">
            Goals
          </TabsTrigger>
        </TabsList>

        {/* Diary Tab */}
        <TabsContent value="diary" className="space-y-6">
          {/* Daily Summary - Sticky Header */}
          <div className="sticky top-0 z-10 bg-background pt-4 pb-2 shadow-md">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
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

                {/* Water Intake */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplet className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-white">
                      Water: {totalWaterIntake}ml / {dailyGoals.water || 2000}ml
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWaterDialog(true)}
                    className="text-blue-500 border-blue-500 hover:bg-blue-950"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Water
                  </Button>
                </div>
                <Progress value={percentages.water} className="h-2 mt-2" indicatorClassName="bg-blue-500" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setSelectedCategory("breakfast")
                setSearchInputRef.current?.focus()
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Breakfast
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setSelectedCategory("lunch")
                setSearchInputRef.current?.focus()
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Lunch
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setSelectedCategory("dinner")
                setSearchInputRef.current?.focus()
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Dinner
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => {
                setSelectedCategory("snack")
                setSearchInputRef.current?.focus()
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Snack
            </Button>
          </div>

          {/* Food Search Section */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
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
                      className="bg-gray-800 border-gray-700 text-white"
                      ref={searchInputRef}
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
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{food.name || food.foodName || food.description}</div>
                                  <div className="text-xs text-gray-400">
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
                                </div>
                                {food.isFavorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
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
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select meal category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                      <SelectItem value="notes">Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recent Foods */}
                {recentFoods.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-white font-medium mb-2 flex items-center">
                      <History className="h-4 w-4 mr-1" />
                      Recent Foods
                    </h3>
                    <ScrollArea className="h-24 rounded-md border border-gray-700">
                      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recentFoods.map((food) => (
                          <Button
                            key={food.id}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left text-white border-gray-700 hover:bg-gray-800"
                            onClick={() => handleFoodSelect(food)}
                          >
                            <div className="truncate">
                              {food.name}
                              <span className="text-xs text-gray-400 ml-1">
                                ({Math.round(food.nutrition.calories)} kcal)
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Favorite Foods */}
                {favoriteFoods.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-white font-medium mb-2 flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      Favorite Foods
                    </h3>
                    <ScrollArea className="h-24 rounded-md border border-gray-700">
                      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {favoriteFoods.map((food) => (
                          <Button
                            key={food.id}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left text-white border-gray-700 hover:bg-gray-800"
                            onClick={() => handleFoodSelect(food)}
                          >
                            <div className="truncate flex items-center">
                              <Heart className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                              {food.name}
                              <span className="text-xs text-gray-400 ml-1">
                                ({Math.round(food.nutrition.calories)} kcal)
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
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
                      className="bg-gray-800 border-gray-700 text-white flex-grow"
                      rows={2}
                    />
                    <Button
                      onClick={addNoteToDiary}
                      className="bg-orange-600 hover:bg-orange-700 mt-1"
                      disabled={!newNote.trim()}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Diary */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white">Food Diary</CardTitle>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "time" ? "category" : "time")}
                        className="h-8 w-8 p-0 text-white border-gray-700"
                      >
                        <SortDesc className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort by {sortOrder === "time" ? "category" : "time"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className="h-8 w-8 p-0 text-white border-gray-700"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset filters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("all")}
                    className={selectedCategory === "all" ? "bg-orange-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedCategory === "breakfast" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("breakfast")}
                    className={selectedCategory === "breakfast" ? "bg-blue-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    Breakfast
                  </Button>
                  <Button
                    variant={selectedCategory === "lunch" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("lunch")}
                    className={selectedCategory === "lunch" ? "bg-green-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    Lunch
                  </Button>
                  <Button
                    variant={selectedCategory === "dinner" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("dinner")}
                    className={selectedCategory === "dinner" ? "bg-purple-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    Dinner
                  </Button>
                  <Button
                    variant={selectedCategory === "snack" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("snack")}
                    className={selectedCategory === "snack" ? "bg-yellow-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    Snack
                  </Button>
                  <Button
                    variant={selectedCategory === "notes" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("notes")}
                    className={selectedCategory === "notes" ? "bg-gray-600" : "text-white border-gray-700"}
                    size="sm"
                  >
                    Notes
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
                            <div className="font-medium text-white flex items-center">
                              {entry.name}
                              {entry.isFavorite && <Heart className="h-3 w-3 ml-1 text-red-500 fill-red-500" />}
                            </div>
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
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-white">
                                {Math.round(entry.nutrition.calories * entry.quantity)} kcal
                              </div>
                              <div className="text-xs text-gray-400">
                                P: {Math.round(entry.nutrition.protein * entry.quantity)}g | C:{" "}
                                {Math.round(entry.nutrition.carbs * entry.quantity)}g | F:{" "}
                                {Math.round(entry.nutrition.fat * entry.quantity)}g
                              </div>
                            </div>
                            <div className="flex">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleFavorite(entry)}
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                                    >
                                      <Heart
                                        className={`h-4 w-4 ${entry.isFavorite ? "text-red-500 fill-red-500" : ""}`}
                                      />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{entry.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
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
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
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
                                className="bg-gray-800 border-gray-700 text-white"
                                rows={2}
                                id={`note-edit-${entry.id}`}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingNoteId(null)}
                                  className="border-gray-600 text-white"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const textarea = document.getElementById(
                                      `note-edit-${entry.id}`,
                                    ) as HTMLTextAreaElement
                                    if (textarea) {
                                      saveEditedNote(entry.id, textarea.value)
                                    }
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700"
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
                                        className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-gray-700"
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

              {/* Water Intake Log */}
              {waterIntake.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                    Water Intake
                  </h3>
                  <div className="space-y-2">
                    {waterIntake.map((entry) => (
                      <div
                        key={entry.timestamp}
                        className="bg-gray-800 p-2 rounded-md flex justify-between items-center border-l-4 border-blue-500"
                      >
                        <div>
                          <div className="text-white">{entry.amount}ml</div>
                          <div className="text-xs text-gray-400">{format(new Date(entry.timestamp), "h:mm a")}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWaterEntry(entry.timestamp)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Macronutrient Distribution */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Macronutrient Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 rounded-full border-8 border-gray-700 flex items-center justify-center relative">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        rgb(59, 130, 246) 0% ${macroDistribution.protein}%, 
                        rgb(34, 197, 94) ${macroDistribution.protein}% ${macroDistribution.protein + macroDistribution.carbs}%, 
                        rgb(234, 179, 8) ${macroDistribution.protein + macroDistribution.carbs}% 100%
                      )`,
                    }}
                  ></div>
                  <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{Math.round(dailyTotals.calories)}</div>
                      <div className="text-sm text-gray-400">calories</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-white font-medium">Protein</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.protein)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.protein}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-white font-medium">Carbs</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.carbs)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.carbs}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-white font-medium">Fat</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.fat)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.fat}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Summary */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Meal Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(entriesByCategory).map(([category, foods]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium capitalize">{category}</h3>
                      <div className="text-white font-medium">
                        {Math.round(totalsByCategory[category as keyof typeof totalsByCategory].calories)} kcal
                      </div>
                    </div>

                    {foods.length === 0 ? (
                      <div className="text-gray-400 text-sm italic">No foods logged</div>
                    ) : (
                      <div className="space-y-2">
                        {foods.map((food) => (
                          <div key={food.id} className="bg-gray-800 p-2 rounded-md flex justify-between">
                            <div className="text-white">
                              {food.name}
                              <span className="text-gray-400 text-sm ml-2">
                                {food.quantity} × {food.servingSize.amount}
                                {food.servingSize.unit}
                              </span>
                            </div>
                            <div className="text-white">{Math.round(food.nutrition.calories * food.quantity)} kcal</div>
                          </div>
                        ))}

                        <div className="flex justify-between text-sm pt-1">
                          <div className="text-gray-400">
                            P: {Math.round(totalsByCategory[category as keyof typeof totalsByCategory].protein)}g | C:{" "}
                            {Math.round(totalsByCategory[category as keyof typeof totalsByCategory].carbs)}g | F:{" "}
                            {Math.round(totalsByCategory[category as keyof typeof totalsByCategory].fat)}g
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className="my-4 bg-gray-700" />
                  </div>
                ))}

                {/* Water Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium flex items-center">
                      <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                      Water
                    </h3>
                    <div className="text-white font-medium">
                      {totalWaterIntake} / {dailyGoals.water || 2000}ml
                    </div>
                  </div>

                  <Progress value={percentages.water} className="h-2" indicatorClassName="bg-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Nutrition Goals</CardTitle>
              <CardDescription className="text-gray-400">Set your daily nutrition targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-1 text-white">Daily Calories</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={dailyGoals.calories}
                      onChange={(e) => updateDailyGoals({ calories: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <span className="text-white">kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-white">Protein</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.protein}
                        onChange={(e) => updateDailyGoals({ protein: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-white">Carbs</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.carbs}
                        onChange={(e) => updateDailyGoals({ carbs: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-white">Fat</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.fat}
                        onChange={(e) => updateDailyGoals({ fat: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">g</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-white">Fiber</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.fiber || 30}
                        onChange={(e) => updateDailyGoals({ fiber: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-white">Sugar</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.sugar || 50}
                        onChange={(e) => updateDailyGoals({ sugar: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">g</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-white">Sodium</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={dailyGoals.sodium || 2300}
                        onChange={(e) => updateDailyGoals({ sodium: Number.parseInt(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <span className="text-white">mg</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-white">Water</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={dailyGoals.water || 2000}
                      onChange={(e) => updateDailyGoals({ water: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <span className="text-white">ml</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => setActiveTab("diary")}>
                Save & Return to Diary
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Food Dialog */}
      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Food</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedFood?.name || "Add this food to your diary"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-white">Serving Size</label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    min="1"
                    value={servingSize.amount}
                    onChange={(e) => setServingSize({ ...servingSize, amount: Number.parseInt(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700 text-white w-20 mr-2"
                  />
                  <Select
                    value={servingSize.unit}
                    onValueChange={(value) => setServingSize({ ...servingSize, unit: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-24">
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
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-white">Meal Category</label>
              <Select
                value={
                  selectedCategory !== "all"
                    ? selectedCategory
                    : determineFoodCategory(selectedFood?.name || "", new Date().getHours())
                }
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select meal category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedFood && (
              <div className="bg-gray-800 p-3 rounded-md">
                <h4 className="font-medium text-white mb-2">
                  Nutrition Info (per {servingSize.amount}
                  {servingSize.unit})
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Calories:</span>
                    <span className="text-white">
                      {calculateNutritionValue(selectedFood, "calories", servingSize.amount)} kcal
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protein:</span>
                    <span className="text-white">
                      {calculateNutritionValue(selectedFood, "protein", servingSize.amount)}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Carbs:</span>
                    <span className="text-white">
                      {calculateNutritionValue(selectedFood, "carbohydrates", servingSize.amount)}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fat:</span>
                    <span className="text-white">
                      {calculateNutritionValue(selectedFood, "fat", servingSize.amount)}g
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFoodDialog(false)} className="border-gray-700 text-white">
              Cancel
            </Button>
            <Button onClick={addFoodToDiary} className="bg-orange-600 hover:bg-orange-700">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Water Dialog */}
      <Dialog open={showWaterDialog} onOpenChange={setShowWaterDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Water</DialogTitle>
            <DialogDescription className="text-gray-400">Track your water intake</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm mb-1 text-white">Amount (ml)</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWaterAmount(Math.max(50, waterAmount - 50))}
                  className="border-gray-700 text-white"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="50"
                  step="50"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(Number.parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700 text-white text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWaterAmount(waterAmount + 50)}
                  className="border-gray-700 text-white"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-white"
                onClick={() => setWaterAmount(250)}
              >
                250ml
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-white"
                onClick={() => setWaterAmount(500)}
              >
                500ml
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-white"
                onClick={() => setWaterAmount(1000)}
              >
                1000ml
              </Button>
            </div>

            <div className="bg-gray-800 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Today's water intake</div>
                  <div className="text-gray-400 text-sm">Target: {dailyGoals.water || 2000}ml</div>
                </div>
                <div className="text-white font-medium">{totalWaterIntake}ml</div>
              </div>
              <Progress value={percentages.water} className="h-2 mt-2" indicatorClassName="bg-blue-500" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaterDialog(false)} className="border-gray-700 text-white">
              Cancel
            </Button>
            <Button onClick={addWaterIntake} className="bg-blue-600 hover:bg-blue-700">
              <Droplet className="h-4 w-4 mr-1" />
              Add Water
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
