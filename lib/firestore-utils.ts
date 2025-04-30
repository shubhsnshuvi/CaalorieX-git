import { collection, query, getDocs, limit, collectionGroup } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { searchIFCTFoods } from "@/lib/ifct-api"
import { getFoodsForMealType } from "@/lib/usda-api"

// Function to search for foods across all sources (IFCT, USDA, custom)
export async function searchAllFoodSources(searchTerm: string, maxResults = 20) {
  const results: any[] = []
  const term = searchTerm.toLowerCase()

  try {
    // Search in IFCT foods
    const ifctFoodsRef = collection(db, "ifct_foods")

    // Try to find foods that start with the search term
    // This is a simple approach - in a production app, you might want to use
    // a more sophisticated search like Algolia or Firebase's full-text search
    const ifctQuery = query(ifctFoodsRef, limit(maxResults))
    const ifctSnapshot = await getDocs(ifctQuery)

    ifctSnapshot.forEach((doc) => {
      const data = doc.data()
      const name = (data.name || "").toLowerCase()

      // Check if the food name starts with the search term
      if (name.startsWith(term)) {
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
        })
      }
    })

    // If we don't have enough results, try a contains match
    if (results.length < maxResults / 2) {
      ifctSnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || "").toLowerCase()

        // Check if the food name contains the search term but doesn't start with it
        // (to avoid duplicates from the previous check)
        if (!name.startsWith(term) && name.includes(term)) {
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
          })
        }
      })
    }

    // Search in custom foods
    const customFoodsRef = collectionGroup(db, "foodDatabase")
    const customQuery = query(customFoodsRef, limit(maxResults))
    const customSnapshot = await getDocs(customQuery)

    customSnapshot.forEach((doc) => {
      const data = doc.data()
      const foodName = (data.name || data.foodName || "").toLowerCase()

      // Prioritize foods that start with the search term
      if (foodName.startsWith(term)) {
        results.push({
          id: doc.id,
          name: data.name || data.foodName || "Custom Food",
          source: "custom",
          nutrients: {
            calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
            protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
            carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
            fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
          },
        })
      }
    })

    // Add foods that contain the term but don't start with it
    if (results.length < maxResults) {
      customSnapshot.forEach((doc) => {
        const data = doc.data()
        const foodName = (data.name || data.foodName || "").toLowerCase()

        if (!foodName.startsWith(term) && foodName.includes(term)) {
          results.push({
            id: doc.id,
            name: data.name || data.foodName || "Custom Food",
            source: "custom",
            nutrients: {
              calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
              protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
              carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
              fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
            },
          })
        }
      })
    }

    // If we have fewer than maxResults, try to search USDA via our API
    if (results.length < maxResults) {
      try {
        const response = await fetch(`/api/food-search?action=search&query=${encodeURIComponent(term)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.foods && data.foods.length > 0) {
            const remainingSlots = maxResults - results.length

            // Sort USDA foods to prioritize those that start with the search term
            const usdaFoods = data.foods.sort((a: any, b: any) => {
              const aName = (a.description || "").toLowerCase()
              const bName = (b.description || "").toLowerCase()

              const aStartsWith = aName.startsWith(term)
              const bStartsWith = bName.startsWith(term)

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
              })
            })
          }
        }
      } catch (error) {
        console.error("Error searching USDA foods:", error)
      }
    }

    return results
  } catch (error) {
    console.error("Error searching foods:", error)
    return []
  }
}

/**
 * Get foods for a meal type from all available sources
 * @param mealType Meal type (e.g., "Breakfast", "Lunch", "Dinner", "Snack")
 * @param dietPreference Dietary preference
 * @param allergyList List of allergies to exclude
 * @returns Array of foods from all sources
 */
export async function getFoodsForMealTypeFromAllSources(
  mealType: string,
  dietPreference: string,
  allergyList: string[] = [],
): Promise<any[]> {
  try {
    const results: any[] = []

    // 1. Get foods from IFCT database
    try {
      // Define search terms based on meal type and diet preference
      let searchTerms: string[] = []

      switch (mealType.toLowerCase()) {
        case "breakfast":
          if (dietPreference.includes("indian")) {
            searchTerms = ["idli", "dosa", "upma", "poha", "paratha", "chilla", "uttapam"]
          } else {
            searchTerms = ["cereal", "oatmeal", "egg", "toast", "pancake", "waffle", "yogurt", "fruit"]
          }
          break
        case "lunch":
          if (dietPreference.includes("indian")) {
            searchTerms = ["rice", "roti", "dal", "sabzi", "curry", "biryani", "pulao", "thali"]
          } else {
            searchTerms = ["sandwich", "salad", "soup", "wrap", "bowl"]
          }
          break
        case "dinner":
          if (dietPreference.includes("indian")) {
            searchTerms = ["roti", "sabzi", "dal", "curry", "khichdi", "paratha"]
          } else {
            searchTerms = ["chicken", "fish", "beef", "pork", "tofu", "pasta", "rice", "potato"]
          }
          break
        case "snack":
          if (dietPreference.includes("indian")) {
            searchTerms = ["pakora", "samosa", "chaat", "bhel", "vada", "dhokla", "kachori"]
          } else {
            searchTerms = ["fruit", "nuts", "yogurt", "granola", "bar", "smoothie"]
          }
          break
        default:
          searchTerms = ["food", "meal", "dish"]
      }

      // Filter search terms based on dietary preference
      if (
        dietPreference === "vegetarian" ||
        dietPreference === "indian-vegetarian" ||
        dietPreference === "sattvic-diet"
      ) {
        searchTerms = searchTerms.filter((term) => !["chicken", "fish", "beef", "pork"].includes(term))
        if (mealType.toLowerCase() === "dinner") {
          searchTerms.push("lentil", "bean", "chickpea", "paneer")
        }
      } else if (dietPreference === "vegan") {
        searchTerms = searchTerms.filter((term) => !["chicken", "fish", "beef", "pork", "egg", "yogurt"].includes(term))
        searchTerms.push("tofu", "tempeh", "seitan", "lentil", "bean")
      } else if (dietPreference === "jain-diet") {
        searchTerms = searchTerms.filter(
          (term) => !["chicken", "fish", "beef", "pork", "egg", "potato", "onion", "garlic"].includes(term),
        )
        searchTerms.push("lentil", "bean", "rice", "fruit")
      } else if (dietPreference === "keto") {
        searchTerms = searchTerms.filter((term) => !["rice", "bread", "pasta", "cereal", "potato"].includes(term))
        searchTerms.push("avocado", "cheese", "egg", "meat", "fish", "nuts", "seeds")
      }

      // Randomly select a search term
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]

      // Search for foods
      const ifctFoods = await searchIFCTFoods(randomTerm, 10)

      // Filter out foods with allergies
      const filteredIFCTFoods = ifctFoods.filter((food) => {
        const name = food.name?.toLowerCase() || ""
        return !allergyList.some((allergy) => name.includes(allergy.toLowerCase()))
      })

      // Add source property
      filteredIFCTFoods.forEach((food) => {
        food.source = "ifct"
        results.push(food)
      })
    } catch (error) {
      console.error("Error getting IFCT foods:", error)
    }

    // 2. Get foods from USDA database
    try {
      const usdaFoods = await getFoodsForMealType(mealType, dietPreference)

      // Filter out foods with allergies
      const filteredUSDAFoods = usdaFoods.filter((food) => {
        const description = food.description?.toLowerCase() || ""
        return !allergyList.some((allergy) => description.includes(allergy.toLowerCase()))
      })

      // Add source property
      filteredUSDAFoods.forEach((food) => {
        food.source = "usda"
        results.push(food)
      })
    } catch (error) {
      console.error("Error getting USDA foods:", error)
    }

    // 3. Get custom foods and meal templates from Firestore
    try {
      // Fetch custom foods from foodDatabase collection
      const foodDbRef = collection(db, "foodDatabase")
      const foodDbSnapshot = await getDocs(foodDbRef)

      foodDbSnapshot.forEach((doc) => {
        const data = doc.data()
        const foodName = data.name || data.foodName || ""
        const category = (data.category || data.foodCategory || "").toLowerCase()

        // Check if the food matches the meal type and diet preference
        const matchesMealType =
          category.includes(mealType.toLowerCase()) ||
          (mealType === "Breakfast" && category.includes("breakfast")) ||
          (mealType === "Lunch" && category.includes("lunch")) ||
          (mealType === "Dinner" && category.includes("dinner")) ||
          (mealType === "Snack" && category.includes("snack"))

        // Check if the food matches the diet preference
        const matchesDietPreference =
          dietPreference === "non-veg" || // non-veg can eat anything
          (dietPreference === "vegetarian" && data.isVegetarian) ||
          (dietPreference === "vegan" && data.isVegan) ||
          (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
          (dietPreference === "gluten-free" && !data.containsGluten) ||
          (dietPreference === "jain-diet" && !data.containsOnionGarlic && !data.containsRootVegetables)

        // Check if the food contains any allergens
        const hasNoAllergies = !allergyList.some(
          (allergy) =>
            foodName.toLowerCase().includes(allergy) ||
            (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
        )

        if (matchesMealType && matchesDietPreference && hasNoAllergies) {
          results.push({
            id: doc.id,
            name: foodName,
            description: data.description || "",
            nutrients: {
              calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
              protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
              carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
              fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
            },
            source: "custom",
            isVegetarian: data.isVegetarian || false,
            isVegan: data.isVegan || false,
            containsGluten: data.containsGluten || false,
          })
        }
      })

      // Fetch meal templates that match the meal type
      const templatesRef = collection(db, "meal_templates")
      const templatesSnapshot = await getDocs(templatesRef)

      templatesSnapshot.forEach((doc) => {
        const data = doc.data()
        const templateName = data.name || data.templateName || ""
        const mealTypeCategory = (data.mealType || "").toLowerCase()

        // Check if the template matches the meal type
        const matchesMealType =
          mealTypeCategory.includes(mealType.toLowerCase()) ||
          (mealType === "Breakfast" && mealTypeCategory.includes("breakfast")) ||
          (mealType === "Lunch" && mealTypeCategory.includes("lunch")) ||
          (mealType === "Dinner" && mealTypeCategory.includes("dinner")) ||
          (mealType === "Snack" && mealTypeCategory.includes("snack"))

        // Check if the template matches the diet preference
        const matchesDietPreference =
          dietPreference === "non-veg" || // non-veg can eat anything
          (dietPreference === "vegetarian" && data.isVegetarian) ||
          (dietPreference === "vegan" && data.isVegan) ||
          (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
          (dietPreference === "gluten-free" && !data.containsGluten)

        // Check if the template contains any allergens
        const hasNoAllergies = !allergyList.some(
          (allergy) =>
            templateName.toLowerCase().includes(allergy) ||
            (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
        )

        if (matchesMealType && matchesDietPreference && hasNoAllergies) {
          results.push({
            id: doc.id,
            name: templateName,
            description: data.description || "",
            nutrients: {
              calories: data.totalNutrition?.calories || 0,
              protein: data.totalNutrition?.protein || 0,
              carbohydrates: data.totalNutrition?.carbs || 0,
              fat: data.totalNutrition?.fat || 0,
            },
            source: "template",
            isVegetarian: data.isVegetarian || false,
            isVegan: data.isVegan || false,
            containsGluten: data.containsGluten || false,
          })
        }
      })
    } catch (error) {
      console.error("Error fetching custom foods and templates:", error)
    }

    return results
  } catch (error) {
    console.error("Error getting foods for meal type:", error)
    return []
  }
}
