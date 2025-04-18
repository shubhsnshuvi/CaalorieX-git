/**
 * IFCT (Indian Food Composition Tables) API Service
 * This service fetches Indian food data from Firebase
 */
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Cache for storing API responses to reduce database reads
const apiCache: Record<string, any> = {}

/**
 * Search for foods in the IFCT database
 * @param searchTerm Search query
 * @param maxResults Number of results to return
 * @returns Search results
 */
export async function searchIFCTFoods(searchTerm: string, maxResults = 25): Promise<any[]> {
  const cacheKey = `ifct-search-${searchTerm}-${maxResults}`

  // Check if we have cached results
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey]
  }

  try {
    // Create a reference to the IFCT foods collection
    const foodsRef = collection(db, "ifct_foods")

    // Create a query against the collection
    // Note: This assumes you have a text search index set up in Firebase
    // If not, you might need to use a different approach like fetching all and filtering
    const q = query(foodsRef, where("keywords", "array-contains", searchTerm.toLowerCase()), limit(maxResults))

    const querySnapshot = await getDocs(q)
    const results: any[] = []

    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Cache the results
    apiCache[cacheKey] = results

    return results
  } catch (error) {
    console.error("Error searching IFCT foods:", error)
    throw error
  }
}

/**
 * Get detailed food information by ID
 * @param foodId ID of the food in the IFCT database
 * @returns Detailed food information
 */
export async function getIFCTFoodDetails(foodId: string): Promise<any> {
  const cacheKey = `ifct-food-${foodId}`

  // Check if we have cached results
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey]
  }

  try {
    const docRef = doc(db, "ifct_foods", foodId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()

      // Cache the results
      apiCache[cacheKey] = data

      return data
    } else {
      throw new Error(`Food with ID ${foodId} not found in IFCT database`)
    }
  } catch (error) {
    console.error("Error getting IFCT food details:", error)
    throw error
  }
}

/**
 * Get foods for a specific meal type with preference for Indian cuisine
 * @param mealType Meal type (e.g., "Breakfast", "Lunch", "Dinner", "Snack")
 * @param dietPreference Dietary preference
 * @returns Array of foods
 */
export async function getIFCTFoodsForMealType(mealType: string, dietPreference: string): Promise<any[]> {
  const cacheKey = `ifct-meal-${mealType}-${dietPreference}`

  // Check if we have cached results
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey]
  }

  try {
    // Define search terms based on meal type
    let searchTerms: string[] = []

    switch (mealType.toLowerCase()) {
      case "breakfast":
        searchTerms = ["idli", "dosa", "upma", "poha", "paratha", "chilla", "uttapam"]
        break
      case "lunch":
        searchTerms = ["rice", "roti", "dal", "sabzi", "curry", "biryani", "pulao", "thali"]
        break
      case "dinner":
        searchTerms = ["roti", "sabzi", "dal", "curry", "khichdi", "paratha"]
        break
      case "snack":
        searchTerms = ["pakora", "samosa", "chaat", "bhel", "vada", "dhokla", "kachori"]
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
      searchTerms = searchTerms.filter((term) => !["non-veg", "chicken", "fish", "meat"].includes(term))
    } else if (dietPreference === "vegan") {
      searchTerms = searchTerms.filter(
        (term) => !["non-veg", "chicken", "fish", "meat", "paneer", "milk", "curd", "ghee"].includes(term),
      )
    } else if (dietPreference === "jain-diet") {
      searchTerms = searchTerms.filter((term) => !["onion", "garlic", "potato", "non-veg"].includes(term))
    }

    // Randomly select a search term
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]

    // Search for foods
    const results = await searchIFCTFoods(randomTerm, 25)

    // Cache the results
    apiCache[cacheKey] = results

    return results
  } catch (error) {
    console.error(`Error getting IFCT foods for ${mealType}:`, error)
    return []
  }
}

/**
 * Calculate appropriate portion size based on diet goal and food type
 * @param food Food object from IFCT database
 * @param dietGoal Diet goal (e.g., "weight-loss", "weight-gain")
 * @param mealType Meal type (e.g., "Breakfast", "Lunch", "Dinner", "Snack")
 * @returns Portion size in grams and description
 */
export function calculateIFCTPortionSize(
  food: any,
  dietGoal: string,
  mealType: string,
): { amount: number; unit: string; description: string } {
  // Default portion size
  let portionSize = 100 // grams
  let unit = "g"

  // Get standard portion from food data if available
  if (food.standardPortion) {
    portionSize = food.standardPortion.amount || portionSize
    unit = food.standardPortion.unit || unit
  }

  // Adjust based on food category
  const foodCategory = food.category?.toLowerCase() || ""
  const foodName = food.name?.toLowerCase() || ""

  // Adjust portion size based on food category
  if (
    foodCategory.includes("rice") ||
    foodName.includes("rice") ||
    foodName.includes("pulao") ||
    foodName.includes("biryani")
  ) {
    portionSize = 150 // g cooked rice
    unit = "g"
  } else if (
    foodCategory.includes("bread") ||
    foodName.includes("roti") ||
    foodName.includes("paratha") ||
    foodName.includes("naan")
  ) {
    portionSize = 30 // g per roti/bread
    unit = "g"
    return { amount: portionSize, unit, description: "1 piece" }
  } else if (foodCategory.includes("curry") || foodName.includes("curry") || foodName.includes("sabzi")) {
    portionSize = 150 // g of curry
    unit = "g"
  } else if (foodCategory.includes("dal") || foodName.includes("dal")) {
    portionSize = 150 // g of dal
    unit = "g"
  } else if (foodName.includes("idli")) {
    portionSize = 40 // g per idli
    unit = "g"
    return { amount: portionSize, unit, description: "2 pieces" }
  } else if (foodName.includes("dosa")) {
    portionSize = 80 // g per dosa
    unit = "g"
    return { amount: portionSize, unit, description: "1 medium" }
  }

  // Adjust based on diet goal
  if (dietGoal === "weight-loss") {
    portionSize = Math.round(portionSize * 0.8) // 20% smaller portions
  } else if (dietGoal === "weight-gain" || dietGoal === "muscle-building") {
    portionSize = Math.round(portionSize * 1.2) // 20% larger portions
  }

  // Adjust based on meal type
  if (mealType === "Snack") {
    portionSize = Math.round(portionSize * 0.5) // Smaller portions for snacks
  } else if (mealType === "Dinner" || mealType === "Lunch") {
    portionSize = Math.round(portionSize * 1.1) // Slightly larger portions for main meals
  }

  // Format the description
  let portionDescription = `${portionSize} ${unit}`

  // Add common household measures if applicable
  if (unit === "g" && portionSize >= 100 && portionSize <= 200) {
    portionDescription = `${portionSize} g (about ${Math.round(portionSize / 100)} cup)`
  } else if (unit === "ml" && portionSize >= 240) {
    portionDescription = `${portionSize} ml (about ${Math.round(portionSize / 240)} cup)`
  }

  return { amount: portionSize, unit, description: portionDescription }
}

/**
 * Calculate nutrition for a portion of food
 * @param food Food object from IFCT database
 * @param portionSize Portion size in grams
 * @returns Object with calories, protein, carbs, and fat for the portion
 */
export function calculateIFCTNutritionForPortion(
  food: any,
  portionSize: number,
): { calories: number; protein: number; carbs: number; fat: number } {
  // Get nutrition values per 100g
  const caloriesPer100g = food.nutrients?.calories || food.energy || 0
  const proteinPer100g = food.nutrients?.protein || food.protein || 0
  const carbsPer100g = food.nutrients?.carbohydrates || food.carbohydrates || 0
  const fatPer100g = food.nutrients?.fat || food.fat || 0

  // Calculate for the given portion size
  const multiplier = portionSize / 100

  // Calculate values
  let calories = Math.round(caloriesPer100g * multiplier)
  let protein = Math.round(proteinPer100g * multiplier)
  let carbs = Math.round(carbsPer100g * multiplier)
  let fat = Math.round(fatPer100g * multiplier)

  // Ensure we don't return zero values for essential nutrients
  // If the data is missing, use reasonable defaults based on food category
  if (calories <= 0) {
    // Estimate calories based on macronutrients if available
    if (protein > 0 || carbs > 0 || fat > 0) {
      calories = protein * 4 + carbs * 4 + fat * 9
    } else {
      // Default to a reasonable value based on food category
      const foodName = food.name?.toLowerCase() || ""
      if (foodName.includes("rice") || foodName.includes("roti") || foodName.includes("bread")) {
        calories = 150 * multiplier
      } else if (foodName.includes("dal") || foodName.includes("curry")) {
        calories = 120 * multiplier
      } else if (foodName.includes("vegetable") || foodName.includes("sabzi")) {
        calories = 80 * multiplier
      } else {
        calories = 100 * multiplier
      }
    }
  }

  // Ensure protein is not zero
  if (protein <= 0) {
    const foodName = food.name?.toLowerCase() || ""
    if (foodName.includes("dal") || foodName.includes("paneer") || foodName.includes("milk")) {
      protein = 8 * multiplier
    } else if (foodName.includes("rice") || foodName.includes("roti")) {
      protein = 3 * multiplier
    } else {
      protein = 5 * multiplier
    }
  }

  // Ensure carbs is not zero
  if (carbs <= 0) {
    const foodName = food.name?.toLowerCase() || ""
    if (foodName.includes("rice") || foodName.includes("roti") || foodName.includes("bread")) {
      carbs = 25 * multiplier
    } else if (foodName.includes("dal")) {
      carbs = 15 * multiplier
    } else if (foodName.includes("vegetable") || foodName.includes("sabzi")) {
      carbs = 10 * multiplier
    } else {
      carbs = 15 * multiplier
    }
  }

  // Ensure fat is not zero
  if (fat <= 0) {
    const foodName = food.name?.toLowerCase() || ""
    if (foodName.includes("ghee") || foodName.includes("oil") || foodName.includes("butter")) {
      fat = 10 * multiplier
    } else if (foodName.includes("paneer") || foodName.includes("milk")) {
      fat = 6 * multiplier
    } else {
      fat = 3 * multiplier
    }
  }

  return {
    calories,
    protein,
    carbs,
    fat,
  }
}

/**
 * Check if a food is suitable for a specific diet preference
 * @param food Food object from IFCT database
 * @param dietPreference Diet preference
 * @returns Boolean indicating if the food is suitable
 */
export function isFoodSuitableForDiet(food: any, dietPreference: string): boolean {
  const foodCategory = food.category?.toLowerCase() || ""
  const foodName = food.name?.toLowerCase() || ""
  const isVegetarian = food.isVegetarian || false
  const isVegan = food.isVegan || false
  const containsGluten = food.containsGluten || false
  const containsOnionGarlic = food.containsOnionGarlic || false
  const containsRootVegetables = food.containsRootVegetables || false

  switch (dietPreference) {
    case "vegetarian":
    case "indian-vegetarian":
      return isVegetarian
    case "vegan":
      return isVegan
    case "non-veg":
      return true // All foods are acceptable
    case "eggetarian":
      return isVegetarian || foodName.includes("egg") || foodCategory.includes("egg")
    case "gluten-free":
      return !containsGluten
    case "jain-diet":
      return isVegetarian && !containsOnionGarlic && !containsRootVegetables
    case "sattvic-diet":
      return isVegetarian && !containsOnionGarlic && !foodName.includes("spicy")
    case "hindu-fasting":
      // Foods allowed during Hindu fasting
      return (
        foodName.includes("sabudana") ||
        foodName.includes("potato") ||
        foodName.includes("sweet potato") ||
        foodName.includes("fruit") ||
        foodName.includes("nuts") ||
        foodName.includes("milk") ||
        foodName.includes("curd") ||
        foodName.includes("makhana") ||
        foodName.includes("rajgira") ||
        foodName.includes("singhara") ||
        foodName.includes("kuttu")
      )
    default:
      return true
  }
}
