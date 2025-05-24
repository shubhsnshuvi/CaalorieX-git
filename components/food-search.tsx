"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, Loader2, Database, BookOpen, ChefHat, Utensils, Star } from "lucide-react"
import { collection, query, where, getDocs, limit, collectionGroup, orderBy, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"

// Define the food item interface
interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber?: number
  source: "ifct" | "usda" | "custom" | "template" | "recipe" | "nccdb"
  category?: string
  description?: string
  servingSize?: string
  servingWeight?: number
  isFavorite?: boolean
  isVegetarian?: boolean
  isVegan?: boolean
  containsGluten?: boolean
  region?: string
  cuisine?: string
}

interface FoodSearchProps {
  onSelectFood?: (food: FoodItem) => void
  showRecent?: boolean
  showFavorites?: boolean
}

export function FoodSearch({ onSelectFood, showRecent = true, showFavorites = true }: FoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "ifct" | "nccdb" | "usda" | "custom" | "templates" | "recipes">(
    "all",
  )
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  // Fetch recent foods on initial load
  useEffect(() => {
    if (isInitialLoad && user) {
      fetchRecentFoods()
      if (showFavorites) {
        fetchFavoriteFoods()
      }
      setIsInitialLoad(false)
    }
  }, [isInitialLoad, user, showFavorites])

  // Update the fetchRecentFoods function to ensure it fetches custom foods and recipes
  const fetchRecentFoods = async () => {
    if (!user || !showRecent) return

    try {
      setIsSearching(true)
      const recentItems: FoodItem[] = []

      // Fetch from recent foods collection
      const recentFoodsRef = collection(db, "users", user.uid, "recentFoods")
      const recentQuery = query(recentFoodsRef, orderBy("timestamp", "desc"), limit(5))
      const recentSnapshot = await getDocs(recentQuery)

      recentSnapshot.forEach((doc) => {
        const data = doc.data()
        recentItems.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          calories: data.calories || 0,
          protein: data.protein || 0,
          fat: data.fat || 0,
          carbs: data.carbs || 0,
          fiber: data.fiber || 0,
          source: data.source || "custom",
          category: data.category || "Recent",
          description: data.description || "",
          servingSize: data.servingSize || "100g",
          servingWeight: data.servingWeight || 100,
        })
      })

      // If we don't have enough recent foods, fetch some default foods
      if (recentItems.length < 5) {
        // Fetch from IFCT foods
        const ifctFoodsRef = collection(db, "ifct_foods")
        const ifctQuery = query(ifctFoodsRef, limit(5 - recentItems.length))
        const ifctSnapshot = await getDocs(ifctQuery)

        ifctSnapshot.forEach((doc) => {
          const data = doc.data()
          recentItems.push({
            id: doc.id,
            name: data.name || "Unknown Food",
            calories: data.nutrients?.calories || 0,
            protein: data.nutrients?.protein || 0,
            fat: data.nutrients?.fat || 0,
            carbs: data.nutrients?.carbohydrates || 0,
            fiber: data.nutrients?.fiber || 0,
            source: "ifct",
            category: data.category || "General",
            description: data.description || "",
            servingSize: "100g",
            servingWeight: 100,
          })
        })
      }

      setRecentFoods(recentItems)
    } catch (error) {
      console.error("Error fetching recent foods:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Fetch favorite foods
  const fetchFavoriteFoods = async () => {
    if (!user || !showFavorites) return

    try {
      const favoriteItems: FoodItem[] = []

      // Fetch from favorite foods collection
      const favoriteFoodsRef = collection(db, "users", user.uid, "favoriteFoods")
      const favoriteQuery = query(favoriteFoodsRef, limit(5))
      const favoriteSnapshot = await getDocs(favoriteQuery)

      favoriteSnapshot.forEach((doc) => {
        const data = doc.data()
        favoriteItems.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          calories: data.calories || 0,
          protein: data.protein || 0,
          fat: data.fat || 0,
          carbs: data.carbs || 0,
          fiber: data.fiber || 0,
          source: data.source || "custom",
          category: data.category || "Favorite",
          description: data.description || "",
          servingSize: data.servingSize || "100g",
          servingWeight: data.servingWeight || 100,
          isFavorite: true,
        })
      })

      setFavoriteFoods(favoriteItems)
    } catch (error) {
      console.error("Error fetching favorite foods:", error)
    }
  }

  // Function to search IFCT database
  const searchIFCTAndNCCDB = async (term: string): Promise<FoodItem[]> => {
    try {
      const results: FoodItem[] = []

      // Search IFCT foods
      const ifctFoodsRef = collection(db, "ifct_foods")
      const q = query(ifctFoodsRef, where("keywords", "array-contains", term.toLowerCase()), limit(20))
      const querySnapshot = await getDocs(q)

      // Process IFCT results
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          calories: data.nutrients?.calories || 0,
          protein: data.nutrients?.protein || 0,
          fat: data.nutrients?.fat || 0,
          carbs: data.nutrients?.carbohydrates || 0,
          fiber: data.nutrients?.fiber || 0,
          source: "ifct",
          category: data.category || "General",
          description: data.description || "",
          servingSize: data.standardPortion?.description || "100g",
          servingWeight: data.standardPortion?.amount || 100,
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
          region: data.region || "",
          cuisine: data.cuisine || "Indian",
        })
      })

      // Search NCCDB foods
      const nccdbFoodsRef = collection(db, "nccdb_foods")
      const nccdbQuery = query(nccdbFoodsRef, where("keywords", "array-contains", term.toLowerCase()), limit(20))
      const nccdbSnapshot = await getDocs(nccdbQuery)

      // Process NCCDB results
      nccdbSnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          calories: data.nutrients?.calories || 0,
          protein: data.nutrients?.protein || 0,
          fat: data.nutrients?.fat || 0,
          carbs: data.nutrients?.carbohydrates || 0,
          fiber: data.nutrients?.fiber || 0,
          source: "nccdb",
          category: data.category || "General",
          description: data.description || "",
          servingSize: data.standardPortion?.description || "100g",
          servingWeight: data.standardPortion?.amount || 100,
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
          region: data.region || "",
          cuisine: data.cuisine || "Indian",
        })
      })

      // If no exact matches, try partial matching
      if (results.length === 0) {
        // Search IFCT with partial matching
        const allIFCTQuery = query(ifctFoodsRef, limit(100))
        const allIFCTSnapshot = await getDocs(allIFCTQuery)

        allIFCTSnapshot.forEach((doc) => {
          const data = doc.data()
          const name = (data.name || "").toLowerCase()
          const description = (data.description || "").toLowerCase()
          const category = (data.category || "").toLowerCase()

          if (
            name.includes(term.toLowerCase()) ||
            description.includes(term.toLowerCase()) ||
            category.includes(term.toLowerCase())
          ) {
            results.push({
              id: doc.id,
              name: data.name || "Unknown Food",
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbs: data.nutrients?.carbohydrates || 0,
              fiber: data.nutrients?.fiber || 0,
              source: "ifct",
              category: data.category || "General",
              description: data.description || "",
              servingSize: data.standardPortion?.description || "100g",
              servingWeight: data.standardPortion?.amount || 100,
              isVegetarian: data.isVegetarian || false,
              isVegan: data.isVegan || false,
              containsGluten: data.containsGluten || false,
              region: data.region || "",
              cuisine: data.cuisine || "Indian",
            })
          }
        })

        // Search NCCDB with partial matching
        const allNCCDBQuery = query(nccdbFoodsRef, limit(100))
        const allNCCDBSnapshot = await getDocs(allNCCDBQuery)

        allNCCDBSnapshot.forEach((doc) => {
          const data = doc.data()
          const name = (data.name || "").toLowerCase()
          const description = (data.description || "").toLowerCase()
          const category = (data.category || "").toLowerCase()

          if (
            name.includes(term.toLowerCase()) ||
            description.includes(term.toLowerCase()) ||
            category.includes(term.toLowerCase())
          ) {
            results.push({
              id: doc.id,
              name: data.name || "Unknown Food",
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbs: data.nutrients?.carbohydrates || 0,
              fiber: data.nutrients?.fiber || 0,
              source: "nccdb",
              category: data.category || "General",
              description: data.description || "",
              servingSize: data.standardPortion?.description || "100g",
              servingWeight: data.standardPortion?.amount || 100,
              isVegetarian: data.isVegetarian || false,
              isVegan: data.isVegan || false,
              containsGluten: data.containsGluten || false,
              region: data.region || "",
              cuisine: data.cuisine || "Indian",
            })
          }
        })
      }

      return results
    } catch (error) {
      console.error("Error searching IFCT and NCCDB foods:", error)
      throw error
    }
  }

  // Update the searchCustomFoods function to include recipes
  const searchCustomFoods = async (term: string): Promise<FoodItem[]> => {
    if (!user) return []

    try {
      const results: FoodItem[] = []

      // Search in foodDatabase collection group (to get all subcollections)
      const foodDbRef = collectionGroup(db, "foodDatabase")
      const foodDbSnapshot = await getDocs(foodDbRef)

      foodDbSnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || data.foodName || "")?.toLowerCase()
        const category = (data.category || data.foodCategory || "")?.toLowerCase()
        const description = (data.description || "")?.toLowerCase()

        if (
          name.includes(term.toLowerCase()) ||
          category.includes(term.toLowerCase()) ||
          description.includes(term.toLowerCase())
        ) {
          results.push({
            id: doc.id,
            name: data.name || data.foodName || "Custom Food",
            calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
            protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
            fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
            carbs: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
            fiber: data.nutrients?.fiber || data.nutritionalInfo?.fiber || 0,
            source: "custom",
            category: data.category || data.foodCategory || "Custom",
            description: data.description || "",
            servingSize: data.servingSize || "100g",
            servingWeight: data.servingWeight || 100,
          })
        }
      })

      // Search in recipes collection group
      const recipesRef = collectionGroup(db, "recipes")
      const recipesSnapshot = await getDocs(recipesRef)

      recipesSnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || data.recipeName || "")?.toLowerCase()
        const category = (data.category || "")?.toLowerCase()
        const description = (data.description || "")?.toLowerCase()

        if (
          name.includes(term.toLowerCase()) ||
          category.includes(term.toLowerCase()) ||
          description.includes(term.toLowerCase())
        ) {
          results.push({
            id: doc.id,
            name: data.name || data.recipeName || "Recipe",
            calories: data.totalNutrition?.calories || 0,
            protein: data.totalNutrition?.protein || 0,
            fat: data.totalNutrition?.fat || 0,
            carbs: data.totalNutrition?.carbs || 0,
            fiber: data.totalNutrition?.fiber || 0,
            source: "recipe",
            category: data.category || "Recipe",
            description: data.description || "",
            servingSize: data.servingSize || "1 serving",
            servingWeight: data.servingWeight || 100,
          })
        }
      })

      return results
    } catch (error) {
      console.error("Error searching custom foods:", error)
      throw error
    }
  }

  // Function to search meal templates
  const searchMealTemplates = async (term: string): Promise<FoodItem[]> => {
    try {
      const results: FoodItem[] = []

      // Search in meal_templates collection group
      const templatesRef = collectionGroup(db, "meal_templates")
      const templatesSnapshot = await getDocs(templatesRef)

      templatesSnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || data.templateName || "")?.toLowerCase()
        const category = (data.category || data.mealType || "")?.toLowerCase()
        const description = (data.description || "")?.toLowerCase()

        if (
          name.includes(term.toLowerCase()) ||
          category.includes(term.toLowerCase()) ||
          description.includes(term.toLowerCase())
        ) {
          results.push({
            id: doc.id,
            name: data.name || data.templateName || "Meal Template",
            calories: data.totalNutrition?.calories || 0,
            protein: data.totalNutrition?.protein || 0,
            fat: data.totalNutrition?.fat || 0,
            carbs: data.totalNutrition?.carbs || 0,
            fiber: data.totalNutrition?.fiber || 0,
            source: "template",
            category: data.category || data.mealType || "Template",
            description: data.description || "",
            servingSize: "1 serving",
            servingWeight: 100,
          })
        }
      })

      return results
    } catch (error) {
      console.error("Error searching meal templates:", error)
      throw error
    }
  }

  // Function to search USDA database
  const searchUSDA = async (term: string): Promise<FoodItem[]> => {
    try {
      // Use the API proxy route instead of direct API access
      const response = await fetch(`/api/usda?action=search&query=${encodeURIComponent(term)}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const results = await response.json()

      if (!results.foods || results.foods.length === 0) {
        return []
      }

      return results.foods.map((food: any) => {
        // Extract nutrients
        const nutrients = food.foodNutrients || []
        const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
        const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
        const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0
        const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0
        const fiber = nutrients.find((n: any) => n.nutrientNumber === "291")?.value || 0

        return {
          id: food.fdcId.toString(),
          name: food.description || "Unknown Food",
          calories,
          protein,
          fat,
          carbs,
          fiber,
          source: "usda",
          category: food.foodCategory || "USDA",
          description: food.additionalDescriptions || "",
          servingSize: "100g",
          servingWeight: 100,
        }
      })
    } catch (error) {
      console.error("Error searching USDA foods:", error)
      throw error
    }
  }

  // Function to check if a food is an Indian food
  const isIndianFood = (name: string): boolean => {
    const indianFoodKeywords = [
      "dal",
      "roti",
      "rice",
      "curry",
      "sabzi",
      "sambar",
      "idli",
      "dosa",
      "paratha",
      "chutney",
      "biryani",
      "pulao",
      "paneer",
      "chapati",
      "naan",
      "thali",
      "raita",
      "khichdi",
      "upma",
      "poha",
      "vada",
      "pakora",
      "tikka",
      "masala",
      "tandoori",
      "korma",
      "saag",
      "bhaji",
      "bharta",
      "halwa",
      "ladoo",
      "barfi",
      "jalebi",
      "gulab jamun",
      "rasmalai",
      "kheer",
    ]

    const lowerName = name.toLowerCase()
    return indianFoodKeywords.some((keyword) => lowerName.includes(keyword))
  }

  // Add a function to search recipes
  const searchRecipes = async (term: string): Promise<FoodItem[]> => {
    if (!user) return []

    try {
      const results: FoodItem[] = []

      // Search in recipes collection group
      const recipesRef = collectionGroup(db, "recipes")
      const recipesSnapshot = await getDocs(recipesRef)

      recipesSnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || data.recipeName || "")?.toLowerCase()
        const category = (data.category || "")?.toLowerCase()
        const description = (data.description || "")?.toLowerCase()

        if (
          name.includes(term.toLowerCase()) ||
          category.includes(term.toLowerCase()) ||
          description.includes(term.toLowerCase())
        ) {
          results.push({
            id: doc.id,
            name: data.name || data.recipeName || "Recipe",
            calories: data.totalNutrition?.calories || 0,
            protein: data.totalNutrition?.protein || 0,
            fat: data.totalNutrition?.fat || 0,
            carbs: data.totalNutrition?.carbs || 0,
            fiber: data.totalNutrition?.fiber || 0,
            source: "recipe",
            category: data.category || "Recipe",
            description: data.description || "",
            servingSize: data.servingSize || "1 serving",
            servingWeight: data.servingWeight || 100,
          })
        }
      })

      return results
    } catch (error) {
      console.error("Error searching recipes:", error)
      throw error
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

    // Always search immediately when typing, even with a single character
    if (term.trim().length > 0) {
      setIsSearching(true)

      // Use a very short timeout for immediate response
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch()
      }, 50) // Very short timeout for immediate response
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Update the handleSearch function to include recipes
  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])

    try {
      // Search in all databases in parallel
      const [ifctNccdbResults, usdaResults, customResults, templateResults, recipeResults] = await Promise.all([
        searchIFCTAndNCCDB(searchTerm),
        searchUSDA(searchTerm),
        searchCustomFoods(searchTerm),
        searchMealTemplates(searchTerm),
        searchRecipes(searchTerm),
      ])

      // Prioritize results
      // 1. Custom foods, recipes, and templates
      // 2. Indian foods from IFCT and NCCDB
      // 3. Other IFCT and NCCDB foods
      // 4. Indian foods from USDA
      // 5. Other USDA foods

      const indianFoodsIFCTNCCDB = ifctNccdbResults.filter((food) => isIndianFood(food.name))
      const otherFoodsIFCTNCCDB = ifctNccdbResults.filter((food) => !isIndianFood(food.name))
      const indianFoodsUSDA = usdaResults.filter((food) => isIndianFood(food.name))
      const otherFoodsUSDA = usdaResults.filter((food) => !isIndianFood(food.name))

      const allResults = [
        ...customResults,
        ...recipeResults,
        ...templateResults,
        ...indianFoodsIFCTNCCDB,
        ...otherFoodsIFCTNCCDB,
        ...indianFoodsUSDA,
        ...otherFoodsUSDA,
      ]

      setSearchResults(allResults)
    } catch (error: any) {
      console.error("Search error:", error)
      setError(error.message || "Failed to search for foods. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  // Filter results based on active tab
  const filteredResults = searchResults.filter((result) => {
    if (activeTab === "all") return true
    if (activeTab === "ifct") return result.source === "ifct"
    if (activeTab === "nccdb") return result.source === "nccdb"
    if (activeTab === "usda") return result.source === "usda"
    if (activeTab === "custom") return result.source === "custom"
    if (activeTab === "recipes") return result.source === "recipe"
    if (activeTab === "templates") return result.source === "template"
    return false
  })

  // Handle food selection
  const handleFoodSelect = (food: FoodItem) => {
    if (onSelectFood) {
      onSelectFood(food)
    }

    // Add to recent foods if user is logged in
    if (user) {
      addToRecentFoods(food)
    }
  }

  // Add food to recent foods
  const addToRecentFoods = async (food: FoodItem) => {
    if (!user) return

    try {
      // Add to recent foods collection
      const recentFoodsRef = collection(db, "users", user.uid, "recentFoods")
      await addDoc(recentFoodsRef, {
        ...food,
        timestamp: new Date(),
      })

      // Refresh recent foods
      fetchRecentFoods()
    } catch (error) {
      console.error("Error adding to recent foods:", error)
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (food: FoodItem) => {
    if (!user) return

    try {
      if (food.isFavorite) {
        // Remove from favorites
        const favoriteFoodsRef = collection(db, "users", user.uid, "favoriteFoods")
        const q = query(favoriteFoodsRef, where("id", "==", food.id), where("source", "==", food.source))
        const querySnapshot = await getDocs(q)

        querySnapshot.forEach(async (doc) => {
          await doc.ref.delete()
        })
      } else {
        // Add to favorites
        const favoriteFoodsRef = collection(db, "users", user.uid, "favoriteFoods")
        await addDoc(favoriteFoodsRef, {
          ...food,
          isFavorite: true,
          timestamp: new Date(),
        })
      }

      // Refresh favorites
      fetchFavoriteFoods()

      // Update search results
      setSearchResults(
        searchResults.map((item) =>
          item.id === food.id && item.source === food.source ? { ...item, isFavorite: !item.isFavorite } : item,
        ),
      )
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="text-white">Food Search</CardTitle>
        <CardDescription className="text-gray-300">
          Search for foods in IFCT, USDA, custom foods, and meal templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for a food item..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 input-dark text-white"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()} className="button-orange">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchResults.length > 0 ? (
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-7 tabs-list">
                <TabsTrigger value="all" className="tab-trigger text-white">
                  All Results
                </TabsTrigger>
                <TabsTrigger value="ifct" className="tab-trigger text-white">
                  IFCT
                </TabsTrigger>
                <TabsTrigger value="nccdb" className="tab-trigger text-white">
                  NCCDB
                </TabsTrigger>
                <TabsTrigger value="usda" className="tab-trigger text-white">
                  USDA
                </TabsTrigger>
                <TabsTrigger value="custom" className="tab-trigger text-white">
                  Custom
                </TabsTrigger>
                <TabsTrigger value="recipes" className="tab-trigger text-white">
                  Recipes
                </TabsTrigger>
                <TabsTrigger value="templates" className="tab-trigger text-white">
                  Templates
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="ifct" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="nccdb" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="usda" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="custom" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="recipes" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="templates" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard
                      key={`${food.source}-${food.id}`}
                      food={food}
                      onSelect={handleFoodSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No results found in this category</div>
                )}
              </TabsContent>
            </Tabs>
          ) : !isSearching && searchTerm ? (
            <div className="text-center py-8 text-gray-400">No results found for "{searchTerm}"</div>
          ) : !searchTerm ? (
            <div className="space-y-4">
              {showRecent && recentFoods.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Recent Foods</h3>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {recentFoods.map((food) => (
                      <FoodCard
                        key={`recent-${food.source}-${food.id}`}
                        food={food}
                        onSelect={handleFoodSelect}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showFavorites && favoriteFoods.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Favorite Foods</h3>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteFoods.map((food) => (
                      <FoodCard
                        key={`favorite-${food.source}-${food.id}`}
                        food={food}
                        onSelect={handleFoodSelect}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!showRecent && !showFavorites && !isSearching && (
                <div className="text-center py-8 text-gray-400">Enter a food item to search</div>
              )}

              {showRecent &&
                recentFoods.length === 0 &&
                showFavorites &&
                favoriteFoods.length === 0 &&
                !isSearching && <div className="text-center py-8 text-gray-400">Enter a food item to search</div>}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

// Food card component
interface FoodCardProps {
  food: FoodItem
  onSelect: (food: FoodItem) => void
  onToggleFavorite: (food: FoodItem) => void
}

function FoodCard({ food, onSelect, onToggleFavorite }: FoodCardProps) {
  // Determine background color based on source
  const getBgColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-950"
      case "nccdb":
        return "bg-amber-950"
      case "usda":
        return "bg-blue-950"
      case "custom":
        return "bg-green-950"
      case "template":
        return "bg-purple-950"
      case "recipe":
        return "bg-pink-950"
      default:
        return "bg-gray-950"
    }
  }

  // Determine badge color based on source
  const getBadgeColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-900 text-orange-100 border-orange-800"
      case "nccdb":
        return "bg-amber-900 text-amber-100 border-amber-800"
      case "usda":
        return "bg-blue-900 text-blue-100 border-blue-800"
      case "custom":
        return "bg-green-900 text-green-100 border-green-800"
      case "template":
        return "bg-purple-900 text-purple-100 border-purple-800"
      case "recipe":
        return "bg-pink-900 text-pink-100 border-pink-800"
      default:
        return "bg-gray-900 text-gray-100 border-gray-800"
    }
  }

  // Get icon based on source
  const getIcon = (source: string) => {
    switch (source) {
      case "ifct":
        return <BookOpen className="h-3 w-3 mr-1" />
      case "usda":
        return <Database className="h-3 w-3 mr-1" />
      case "custom":
        return <ChefHat className="h-3 w-3 mr-1" />
      case "template":
        return <Utensils className="h-3 w-3 mr-1" />
      case "recipe":
        return <Utensils className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  // Get source display name
  const getSourceName = (source: string) => {
    switch (source) {
      case "ifct":
        return "IFCT"
      case "nccdb":
        return "NCCDB"
      case "usda":
        return "USDA"
      case "custom":
        return "Custom"
      case "template":
        return "Template"
      case "recipe":
        return "Recipe"
      default:
        return source
    }
  }

  return (
    <Card className="overflow-hidden card-gradient">
      <div className={`p-2 ${getBgColor(food.source)}`}>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={getBadgeColor(food.source)}>
            {getIcon(food.source)}
            {getSourceName(food.source)}
          </Badge>
          {food.category && <span className="text-xs text-gray-400">{food.category}</span>}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2 text-white">{food.name}</h3>
        {food.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{food.description}</p>}

        {/* Add region and cuisine if available */}
        {food.region && (
          <p className="text-xs text-gray-400 mb-2">
            <span className="font-medium">Region:</span> {food.region}
            {food.cuisine && ` • ${food.cuisine}`}
          </p>
        )}

        {/* Add dietary info if available */}
        {(food.isVegetarian !== undefined || food.isVegan !== undefined) && (
          <div className="flex gap-1 mb-2">
            {food.isVegetarian && (
              <Badge variant="outline" className="bg-green-900 text-green-100 border-green-800 text-xs">
                Vegetarian
              </Badge>
            )}
            {food.isVegan && (
              <Badge variant="outline" className="bg-green-900 text-green-100 border-green-800 text-xs">
                Vegan
              </Badge>
            )}
            {food.containsGluten === false && (
              <Badge variant="outline" className="bg-blue-900 text-blue-100 border-blue-800 text-xs">
                Gluten-Free
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">Energy</div>
            <div className="font-medium text-white">{food.calories} kcal</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">Protein</div>
            <div className="font-medium text-white">{food.protein} g</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">Fat</div>
            <div className="font-medium text-white">{food.fat} g</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">Carbs</div>
            <div className="font-medium text-white">{food.carbs} g</div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleFavorite(food)}
            className="text-gray-400 hover:text-yellow-400"
          >
            <Star className={`h-4 w-4 ${food.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => onSelect(food)} className="bg-orange-600 hover:bg-orange-700">
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
