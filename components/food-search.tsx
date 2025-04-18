"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, Loader2, Database, BookOpen, ChefHat, Utensils } from "lucide-react"
import { collection, query, where, getDocs, limit, collectionGroup } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define the food item interface
interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  source: "ifct" | "usda" | "custom" | "template" | "recipe"
  category?: string
  description?: string
}

export function FoodSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "ifct" | "usda" | "custom" | "templates" | "recipes">("all")
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])

  // Fetch recent foods on initial load
  useEffect(() => {
    if (isInitialLoad) {
      fetchRecentFoods()
      setIsInitialLoad(false)
    }
  }, [isInitialLoad])

  // Update the fetchRecentFoods function to ensure it fetches custom foods and recipes
  const fetchRecentFoods = async () => {
    try {
      setIsSearching(true)
      const recentItems: FoodItem[] = []

      // Fetch from IFCT foods
      const ifctFoodsRef = collection(db, "ifct_foods")
      const ifctQuery = query(ifctFoodsRef, limit(5))
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
          source: "ifct",
          category: data.category || "General",
          description: data.description || "",
        })
      })

      // Fetch from foodDatabase collection
      const foodDbRef = collectionGroup(db, "foodDatabase")
      const foodDbQuery = query(foodDbRef, limit(5))
      const foodDbSnapshot = await getDocs(foodDbQuery)

      foodDbSnapshot.forEach((doc) => {
        const data = doc.data()
        recentItems.push({
          id: doc.id,
          name: data.name || data.foodName || "Custom Food",
          calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
          protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
          fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
          carbs: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
          source: "custom",
          category: data.category || data.foodCategory || "Custom",
          description: data.description || "",
        })
      })

      // Fetch from meal_templates collection
      const templatesRef = collectionGroup(db, "meal_templates")
      const templatesQuery = query(templatesRef, limit(5))
      const templatesSnapshot = await getDocs(templatesQuery)

      templatesSnapshot.forEach((doc) => {
        const data = doc.data()
        recentItems.push({
          id: doc.id,
          name: data.name || data.templateName || "Meal Template",
          calories: data.totalNutrition?.calories || 0,
          protein: data.totalNutrition?.protein || 0,
          fat: data.totalNutrition?.fat || 0,
          carbs: data.totalNutrition?.carbs || 0,
          source: "template",
          category: data.category || data.mealType || "Template",
          description: data.description || "",
        })
      })

      // Fetch from recipes collection
      const recipesRef = collectionGroup(db, "recipes")
      const recipesQuery = query(recipesRef, limit(5))
      const recipesSnapshot = await getDocs(recipesQuery)

      recipesSnapshot.forEach((doc) => {
        const data = doc.data()
        recentItems.push({
          id: doc.id,
          name: data.name || data.recipeName || "Recipe",
          calories: data.totalNutrition?.calories || 0,
          protein: data.totalNutrition?.protein || 0,
          fat: data.totalNutrition?.fat || 0,
          carbs: data.totalNutrition?.carbs || 0,
          source: "recipe",
          category: data.category || "Recipe",
          description: data.description || "",
        })
      })

      setRecentFoods(recentItems)
    } catch (error) {
      console.error("Error fetching recent foods:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Function to search IFCT database
  const searchIFCT = async (term: string): Promise<FoodItem[]> => {
    try {
      // Create a reference to the IFCT foods collection
      const foodsRef = collection(db, "ifct_foods")

      // Create a query against the collection
      // First try exact keyword match
      let q = query(foodsRef, where("keywords", "array-contains", term.toLowerCase()), limit(20))

      let querySnapshot = await getDocs(q)
      const results: FoodItem[] = []

      // If no results, try partial match
      if (querySnapshot.empty) {
        // This is a simple approach - in a production app, you might want to use
        // a more sophisticated search like Algolia or Firebase's full-text search
        q = query(foodsRef, limit(100))
        querySnapshot = await getDocs(q)

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const name = data.name?.toLowerCase() || ""

          if (name.includes(term.toLowerCase())) {
            results.push({
              id: doc.id,
              name: data.name || "Unknown Food",
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbs: data.nutrients?.carbohydrates || 0,
              source: "ifct",
              category: data.category || "General",
              description: data.description || "",
            })
          }
        })
      } else {
        // Process exact matches
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          results.push({
            id: doc.id,
            name: data.name || "Unknown Food",
            calories: data.nutrients?.calories || 0,
            protein: data.nutrients?.protein || 0,
            fat: data.nutrients?.fat || 0,
            carbs: data.nutrients?.carbohydrates || 0,
            source: "ifct",
            category: data.category || "General",
            description: data.description || "",
          })
        })
      }

      return results
    } catch (error) {
      console.error("Error searching IFCT foods:", error)
      throw error
    }
  }

  // Update the searchCustomFoods function to include recipes
  const searchCustomFoods = async (term: string): Promise<FoodItem[]> => {
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
            source: "custom",
            category: data.category || data.foodCategory || "Custom",
            description: data.description || "",
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
            source: "recipe",
            category: data.category || "Recipe",
            description: data.description || "",
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
            source: "template",
            category: data.category || data.mealType || "Template",
            description: data.description || "",
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

        return {
          id: food.fdcId,
          name: food.description || "Unknown Food",
          calories,
          protein,
          fat,
          carbs,
          source: "usda",
          category: food.foodCategory || "USDA",
          description: food.additionalDescriptions || "",
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
            source: "recipe",
            category: data.category || "Recipe",
            description: data.description || "",
          })
        }
      })

      return results
    } catch (error) {
      console.error("Error searching recipes:", error)
      throw error
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
      const [ifctResults, usdaResults, customResults, templateResults, recipeResults] = await Promise.all([
        searchIFCT(searchTerm),
        searchUSDA(searchTerm),
        searchCustomFoods(searchTerm),
        searchMealTemplates(searchTerm),
        searchRecipes(searchTerm),
      ])

      // Prioritize results
      // 1. Custom foods, recipes, and templates
      // 2. Indian foods from IFCT
      // 3. Other IFCT foods
      // 4. Indian foods from USDA
      // 5. Other USDA foods

      const indianFoodsIFCT = ifctResults.filter((food) => isIndianFood(food.name))
      const otherFoodsIFCT = ifctResults.filter((food) => !isIndianFood(food.name))
      const indianFoodsUSDA = usdaResults.filter((food) => isIndianFood(food.name))
      const otherFoodsUSDA = usdaResults.filter((food) => !isIndianFood(food.name))

      const allResults = [
        ...customResults,
        ...recipeResults,
        ...templateResults,
        ...indianFoodsIFCT,
        ...otherFoodsIFCT,
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
    if (activeTab === "usda") return result.source === "usda"
    if (activeTab === "custom") return result.source === "custom"
    if (activeTab === "recipe") return result.source === "recipe"
    if (activeTab === "templates") return result.source === "template"
    return false
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Food Search</CardTitle>
        <CardDescription>Search for foods in IFCT, USDA, custom foods, and meal templates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for a food item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All Results</TabsTrigger>
                <TabsTrigger value="ifct">IFCT</TabsTrigger>
                <TabsTrigger value="usda">USDA</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="recipe">Recipes</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="ifct" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="usda" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="custom" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="recipe" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
              <TabsContent value="templates" className="mt-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((food) => (
                    <FoodCard key={`${food.source}-${food.id}`} food={food} />
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No results found in this category</div>
                )}
              </TabsContent>
            </Tabs>
          ) : !isSearching && searchTerm ? (
            <div className="text-center py-8 text-muted-foreground">No results found for "{searchTerm}"</div>
          ) : !searchTerm ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Recent Foods</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {recentFoods.map((food) => (
                  <FoodCard key={`${food.source}-${food.id}`} food={food} />
                ))}
              </div>
              {recentFoods.length === 0 && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">Enter a food item to search</div>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

// Food card component
function FoodCard({ food }: { food: FoodItem }) {
  // Determine background color based on source
  const getBgColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-50"
      case "usda":
        return "bg-blue-50"
      case "custom":
        return "bg-green-50"
      case "template":
        return "bg-purple-50"
      case "recipe":
        return "bg-pink-50"
      default:
        return "bg-gray-50"
    }
  }

  // Determine badge color based on source
  const getBadgeColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "usda":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "custom":
        return "bg-green-100 text-green-800 border-green-200"
      case "template":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "recipe":
        return "bg-pink-100 text-pink-800 border-pink-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
    <Card className="overflow-hidden">
      <div className={`p-2 ${getBgColor(food.source)}`}>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={getBadgeColor(food.source)}>
            {getIcon(food.source)}
            {getSourceName(food.source)}
          </Badge>
          {food.category && <span className="text-xs text-muted-foreground">{food.category}</span>}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2">{food.name}</h3>
        {food.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{food.description}</p>}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Energy</div>
            <div className="font-medium">{food.calories} kcal</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Protein</div>
            <div className="font-medium">{food.protein} g</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Fat</div>
            <div className="font-medium">{food.fat} g</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Carbs</div>
            <div className="font-medium">{food.carbs} g</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
