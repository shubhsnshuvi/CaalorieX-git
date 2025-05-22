/**
 * This file contains fixes and improvements for the food search functionality
 * in the CalorieX application.
 */

import { collection, query, where, getDocs, limit, collectionGroup } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Enhanced search function for IFCT foods with better keyword matching
 * @param term Search term
 * @returns Array of matching food items
 */
export async function searchIFCTFoodsEnhanced(term: string, maxResults = 20) {
  try {
    const results: any[] = []
    const lowerTerm = term.toLowerCase()

    // First try exact keyword match
    const keywordQuery = query(
      collection(db, "ifct_foods"),
      where("keywords", "array-contains", lowerTerm),
      limit(maxResults),
    )

    const keywordSnapshot = await getDocs(keywordQuery)

    if (!keywordSnapshot.empty) {
      keywordSnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          name: data.name || "Unknown Food",
          source: "ifct",
          nutrients: data.nutrients || {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
          },
          category: data.category || "General",
          description: data.description || "",
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
          containsOnionGarlic: data.containsOnionGarlic || false,
          containsRootVegetables: data.containsRootVegetables || false,
          region: data.region || "",
          cuisine: data.cuisine || "Indian",
        })
      })
    }

    // If we don't have enough results, try partial name match
    if (results.length < maxResults / 2) {
      // Get all foods and filter client-side for partial matches
      // This is not ideal for large datasets but works for our demo
      const allFoodsQuery = query(collection(db, "ifct_foods"), limit(100))

      const allFoodsSnapshot = await getDocs(allFoodsQuery)

      allFoodsSnapshot.forEach((doc) => {
        // Skip if already in results
        if (results.some((r) => r.id === doc.id)) return

        const data = doc.data()
        const name = (data.name || "").toLowerCase()
        const description = (data.description || "").toLowerCase()
        const category = (data.category || "").toLowerCase()

        if (name.includes(lowerTerm) || description.includes(lowerTerm) || category.includes(lowerTerm)) {
          results.push({
            id: doc.id,
            name: data.name || "Unknown Food",
            source: "ifct",
            nutrients: data.nutrients || {
              calories: 0,
              protein: 0,
              carbohydrates: 0,
              fat: 0,
            },
            category: data.category || "General",
            description: data.description || "",
            isVegetarian: data.isVegetarian || false,
            isVegan: data.isVegan || false,
            containsGluten: data.containsGluten || false,
            containsOnionGarlic: data.containsOnionGarlic || false,
            containsRootVegetables: data.containsRootVegetables || false,
            region: data.region || "",
            cuisine: data.cuisine || "Indian",
          })
        }
      })
    }

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()

      // Exact matches first
      if (aName === lowerTerm && bName !== lowerTerm) return -1
      if (aName !== lowerTerm && bName === lowerTerm) return 1

      // Then starts with
      if (aName.startsWith(lowerTerm) && !bName.startsWith(lowerTerm)) return -1
      if (!aName.startsWith(lowerTerm) && bName.startsWith(lowerTerm)) return 1

      // Then alphabetical
      return aName.localeCompare(bName)
    })

    // Limit to requested number of results
    return results.slice(0, maxResults)
  } catch (error) {
    console.error("Error searching IFCT foods:", error)
    throw error
  }
}

/**
 * Enhanced search function for all food sources with better error handling
 * @param searchTerm Search term
 * @param limitCount Maximum number of results to return
 * @returns Array of matching food items from all sources
 */
export async function searchAllFoodSourcesEnhanced(searchTerm: string, limitCount = 20) {
  try {
    const lowerSearchTerm = searchTerm.toLowerCase()
    const results: any[] = []

    // Search in parallel for better performance
    const [ifctResults, customResults, recipeResults] = await Promise.allSettled([
      // 1. Search IFCT foods
      searchIFCTFoodsEnhanced(lowerSearchTerm, limitCount),

      // 2. Search custom foods
      (async () => {
        try {
          const customFoods = await searchCollectionGroup("foodDatabase", [], limitCount * 2)

          // Filter by search term manually since we can't use array-contains on collection groups
          return customFoods
            .filter((food) => {
              const name = (food.name || food.foodName || "").toLowerCase()
              const category = (food.category || food.foodCategory || "").toLowerCase()
              const description = (food.description || "").toLowerCase()

              return (
                name.includes(lowerSearchTerm) ||
                category.includes(lowerSearchTerm) ||
                description.includes(lowerSearchTerm)
              )
            })
            .slice(0, limitCount)
            .map((food) => ({
              ...food,
              source: "custom",
            }))
        } catch (error) {
          console.error("Error searching custom foods:", error)
          return []
        }
      })(),

      // 3. Search recipes
      (async () => {
        try {
          const recipes = await searchCollectionGroup("recipes", [], limitCount * 2)

          // Filter by search term manually
          return recipes
            .filter((recipe) => {
              const name = (recipe.name || "").toLowerCase()
              const category = (recipe.category || "").toLowerCase()
              const description = (recipe.description || "").toLowerCase()

              return (
                name.includes(lowerSearchTerm) ||
                category.includes(lowerSearchTerm) ||
                description.includes(lowerSearchTerm)
              )
            })
            .slice(0, limitCount)
            .map((recipe) => ({
              ...recipe,
              source: "recipe",
            }))
        } catch (error) {
          console.error("Error searching recipes:", error)
          return []
        }
      })(),
    ])

    // Add successful results to the combined results array
    if (ifctResults.status === "fulfilled") {
      results.push(...ifctResults.value)
    }

    if (customResults.status === "fulfilled") {
      results.push(...customResults.value)
    }

    if (recipeResults.status === "fulfilled") {
      results.push(...recipeResults.value)
    }

    // 4. Search USDA via our API if we have fewer than limitCount results
    if (results.length < limitCount) {
      try {
        const response = await fetch(`/api/food-search?action=search&query=${encodeURIComponent(lowerSearchTerm)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.foods && data.foods.length > 0) {
            const remainingSlots = limitCount - results.length

            // Sort USDA foods to prioritize those that start with the search term
            const usdaFoods = data.foods.sort((a: any, b: any) => {
              const aName = (a.description || "").toLowerCase()
              const bName = (b.description || "").toLowerCase()

              const aStartsWith = aName.startsWith(lowerSearchTerm)
              const bStartsWith = bName.startsWith(lowerSearchTerm)

              if (aStartsWith && !bStartsWith) return -1
              if (!aStartsWith && bStartsWith) return 1
              return 0
            })

            usdaFoods.slice(0, remainingSlots).forEach((food: any) => {
              // Extract nutrients
              const nutrients = food.foodNutrients || []
              const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
              const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
              const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0
              const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0

              results.push({
                id: food.fdcId,
                name: food.description || "Unknown Food",
                source: "usda",
                nutrients: {
                  calories,
                  protein,
                  carbs,
                  fat,
                },
                category: food.foodCategory || "USDA",
                description: food.additionalDescriptions || "",
              })
            })
          }
        }
      } catch (error) {
        console.error("Error searching USDA foods:", error)
        // Continue without USDA results
      }
    }

    return results
  } catch (error) {
    console.error("Error searching all food sources:", error)
    return []
  }
}

/**
 * Helper function to search collection groups with better error handling
 */
export async function searchCollectionGroup(collectionGroupName: string, constraints: any[] = [], limitCount = 50) {
  try {
    const collectionRef = collectionGroup(db, collectionGroupName)
    const queryConstraints = [...constraints]

    if (limitCount > 0) {
      queryConstraints.push(limit(limitCount))
    }

    const q = query(collectionRef, ...queryConstraints)
    const querySnapshot = await getDocs(q)

    const results: any[] = []
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
        path: doc.ref.path,
      })
    })

    return results
  } catch (error) {
    console.error(`Error searching collection group ${collectionGroupName}:`, error)
    throw error
  }
}
