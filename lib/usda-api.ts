/**
 * USDA FoodData Central API Service
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

// The base URL for the USDA FoodData Central API
const USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

// Cache for storing API responses to reduce API calls
const apiCache: Record<string, any> = {}

/**
 * Search for foods in the USDA database
 * @param query Search query
 * @param pageSize Number of results to return
 * @param pageNumber Page number for pagination
 * @param apiKey USDA API key
 * @returns Search results
 */
export async function searchFoods(query: string, pageSize = 25, pageNumber = 1, apiKey?: string): Promise<any> {
  const cacheKey = `search-${query}-${pageSize}-${pageNumber}`

  // Check if we have cached results
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey]
  }

  try {
    // If apiKey is provided, use direct API access, otherwise use the proxy route
    let response

    if (apiKey) {
      response = await fetch(`${USDA_API_BASE_URL}/foods/search?api_key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
          pageSize,
          pageNumber,
          sortBy: "dataType.keyword",
          sortOrder: "asc",
        }),
      })
    } else {
      // Use the API proxy route
      response = await fetch(`/api/usda?action=search&query=${encodeURIComponent(query)}`)
    }

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the results
    apiCache[cacheKey] = data

    return data
  } catch (error) {
    console.error("Error searching USDA foods:", error)
    throw error
  }
}

/**
 * Get detailed food information by FDC ID
 * @param fdcId FDC ID of the food
 * @param apiKey USDA API key
 * @returns Detailed food information
 */
export async function getFoodDetails(fdcId: string, apiKey?: string): Promise<any> {
  const cacheKey = `food-${fdcId}`

  // Check if we have cached results
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey]
  }

  try {
    let response

    if (apiKey) {
      response = await fetch(`${USDA_API_BASE_URL}/food/${fdcId}?api_key=${apiKey}`)
    } else {
      // Use the API proxy route
      response = await fetch(`/api/usda?action=details&fdcId=${fdcId}`)
    }

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the results
    apiCache[cacheKey] = data

    return data
  } catch (error) {
    console.error("Error getting food details:", error)
    throw error
  }
}

/**
 * Get nutrient information for a food
 * @param food Food object from USDA API
 * @param nutrientNumbers Array of nutrient numbers to retrieve
 * @returns Object with nutrient values
 */
export function getNutrients(food: any, nutrientNumbers: number[]): Record<number, number> {
  const nutrients: Record<number, number> = {}

  if (!food.foodNutrients) {
    return nutrients
  }

  for (const nutrient of food.foodNutrients) {
    if (nutrientNumbers.includes(nutrient.nutrient?.number)) {
      nutrients[nutrient.nutrient.number] = nutrient.amount || 0
    }
  }

  return nutrients
}

/**
 * Common nutrient numbers in the USDA database
 */
export const NUTRIENT_NUMBERS = {
  CALORIES: 208,
  PROTEIN: 203,
  FAT: 204,
  CARBS: 205,
  FIBER: 291,
  SUGAR: 269,
  CALCIUM: 301,
  IRON: 303,
  SODIUM: 307,
  VITAMIN_C: 401,
  VITAMIN_A: 320,
  VITAMIN_D: 328,
  VITAMIN_E: 323,
  VITAMIN_K: 430,
  VITAMIN_B6: 415,
  VITAMIN_B12: 418,
  FOLATE: 417,
  ZINC: 309,
  MAGNESIUM: 304,
  POTASSIUM: 306,
  CHOLESTEROL: 601,
  SATURATED_FAT: 606,
  TRANS_FAT: 605,
  MONOUNSATURATED_FAT: 645,
  POLYUNSATURATED_FAT: 646,
}

/**
 * Get macronutrient information for a food
 * @param food Food object from USDA API
 * @returns Object with calories, protein, carbs, and fat
 */
export function getMacros(food: any): { calories: number; protein: number; carbs: number; fat: number } {
  const nutrients = getNutrients(food, [
    NUTRIENT_NUMBERS.CALORIES,
    NUTRIENT_NUMBERS.PROTEIN,
    NUTRIENT_NUMBERS.CARBS,
    NUTRIENT_NUMBERS.FAT,
  ])

  return {
    calories: nutrients[NUTRIENT_NUMBERS.CALORIES] || 0,
    protein: nutrients[NUTRIENT_NUMBERS.PROTEIN] || 0,
    carbs: nutrients[NUTRIENT_NUMBERS.CARBS] || 0,
    fat: nutrients[NUTRIENT_NUMBERS.FAT] || 0,
  }
}

/**
 * Get a list of foods that match dietary preferences
 * @param dietPreference Dietary preference (e.g., "vegetarian", "vegan")
 * @param apiKey USDA API key
 * @param count Number of foods to return
 * @returns Array of foods
 */
export async function getFoodsByDietaryPreference(dietPreference: string, apiKey: string, count = 50): Promise<any[]> {
  let searchTerms: string[] = []

  // Define search terms based on dietary preference
  switch (dietPreference) {
    case "vegetarian":
      searchTerms = ["vegetable", "fruit", "grain", "legume", "dairy", "egg", "tofu", "tempeh", "seitan"]
      break
    case "vegan":
      searchTerms = ["vegetable", "fruit", "grain", "legume", "tofu", "tempeh", "seitan", "plant-based"]
      break
    case "non-veg":
      searchTerms = ["chicken", "beef", "pork", "fish", "seafood", "meat", "poultry"]
      break
    case "eggetarian":
      searchTerms = ["vegetable", "fruit", "grain", "legume", "dairy", "egg"]
      break
    case "gluten-free":
      searchTerms = ["rice", "corn", "potato", "quinoa", "buckwheat", "amaranth", "millet", "gluten-free"]
      break
    case "indian-vegetarian":
      searchTerms = ["lentil", "chickpea", "rice", "paneer", "vegetable", "spice", "curry"]
      break
    case "hindu-fasting":
      searchTerms = ["potato", "fruit", "nut", "seed", "milk", "yogurt", "buckwheat", "amaranth"]
      break
    case "jain-diet":
      searchTerms = ["legume", "grain", "fruit", "dairy", "seed", "nut"]
      break
    case "sattvic-diet":
      searchTerms = ["rice", "wheat", "fruit", "vegetable", "legume", "dairy", "honey"]
      break
    case "indian-regional":
      searchTerms = [
        "rice",
        "wheat",
        "lentil",
        "vegetable",
        "spice",
        "curry",
        "yogurt",
        "coconut",
        "mustard",
        "tamarind",
      ]
      break
    default:
      searchTerms = ["vegetable", "fruit", "grain", "protein", "dairy"]
  }

  // Randomly select a search term
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]

  try {
    const results = await searchFoods(randomTerm, count, 1, apiKey)
    return results.foods || []
  } catch (error) {
    console.error(`Error getting foods for ${dietPreference} diet:`, error)
    return []
  }
}

/**
 * Get a list of foods for a specific meal type
 * @param mealType Meal type (e.g., "Breakfast", "Lunch", "Dinner", "Snack")
 * @param dietPreference Dietary preference
 * @param apiKey USDA API key
 * @returns Array of foods
 */
export async function getFoodsForMealType(mealType: string, dietPreference: string, apiKey?: string): Promise<any[]> {
  let searchTerms: string[] = []

  // Define search terms based on meal type
  switch (mealType.toLowerCase()) {
    case "breakfast":
      searchTerms = ["cereal", "oatmeal", "egg", "toast", "pancake", "waffle", "yogurt", "fruit"]
      break
    case "lunch":
      searchTerms = ["sandwich", "salad", "soup", "wrap", "bowl"]
      break
    case "dinner":
      searchTerms = ["chicken", "fish", "beef", "pork", "tofu", "pasta", "rice", "potato"]
      break
    case "snack":
      searchTerms = ["fruit", "nuts", "yogurt", "granola", "bar", "smoothie"]
      break
    default:
      searchTerms = ["meal", "food", "dish"]
  }

  // Filter search terms based on dietary preference
  if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian" || dietPreference === "sattvic-diet") {
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
  } else if (dietPreference === "hindu-fasting") {
    searchTerms = ["potato", "fruit", "nut", "seed", "milk", "yogurt", "buckwheat", "amaranth"]
  }

  // Randomly select a search term
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]

  try {
    const results = await searchFoods(randomTerm, 25, 1, apiKey)
    return results.foods || []
  } catch (error) {
    console.error(`Error getting foods for ${mealType}:`, error)
    return []
  }
}

/**
 * Calculate appropriate portion size based on diet goal and food type
 * @param food Food object from USDA API
 * @param dietGoal Diet goal (e.g., "weight-loss", "weight-gain")
 * @param mealType Meal type (e.g., "Breakfast", "Lunch", "Dinner", "Snack")
 * @returns Portion size in grams and description
 */
export function calculatePortionSize(
  food: any,
  dietGoal: string,
  mealType: string,
): { amount: number; unit: string; description: string } {
  // Default portion size
  let portionSize = 100 // grams
  let unit = "g"

  // Adjust based on food category
  const foodCategory = food.foodCategory?.toLowerCase() || ""
  const description = food.description?.toLowerCase() || ""

  // Check if the food has a serving size
  const servingSizeNutrient = food.foodPortions?.[0]
  if (servingSizeNutrient) {
    portionSize = servingSizeNutrient.gramWeight || portionSize
    unit = "g"
  }

  // Adjust portion size based on food category
  if (foodCategory.includes("dairy") || description.includes("milk") || description.includes("yogurt")) {
    portionSize = 240 // ml
    unit = "ml"
  } else if (foodCategory.includes("grain") || description.includes("cereal") || description.includes("rice")) {
    portionSize = 50 // g dry
    unit = "g"
  } else if (foodCategory.includes("meat") || description.includes("chicken") || description.includes("beef")) {
    portionSize = 85 // g
    unit = "g"
  } else if (foodCategory.includes("fruit") || description.includes("fruit")) {
    portionSize = 150 // g
    unit = "g"
  } else if (foodCategory.includes("vegetable") || description.includes("vegetable")) {
    portionSize = 100 // g
    unit = "g"
  } else if (description.includes("egg")) {
    portionSize = 50 // g (1 egg)
    unit = "g"
    return { amount: portionSize, unit, description: "1 large egg" }
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
 * @param food Food object from USDA API
 * @param portionSize Portion size in grams
 * @returns Object with calories, protein, carbs, and fat for the portion
 */
export function calculateNutritionForPortion(
  food: any,
  portionSize: number,
): { calories: number; protein: number; carbs: number; fat: number } {
  // Try to get macros using the getMacros function
  const macros = getMacros(food)

  // Calculate the multiplier for the portion size
  const multiplier = portionSize / 100

  // Calculate values
  let calories = Math.round(macros.calories * multiplier)
  let protein = Math.round(macros.protein * multiplier)
  let carbs = Math.round(macros.carbs * multiplier)
  let fat = Math.round(macros.fat * multiplier)

  // If any essential value is missing or zero, try to extract it directly from foodNutrients
  if (calories <= 0 || protein <= 0) {
    const nutrients = food.foodNutrients || []

    // Look for calories (energy)
    if (calories <= 0) {
      const calorieNutrient = nutrients.find(
        (n: any) =>
          n.nutrientId === 1008 ||
          n.nutrientNumber === "208" ||
          (n.nutrientName && n.nutrientName.toLowerCase().includes("energy")) ||
          (n.name && n.name.toLowerCase().includes("energy")),
      )

      if (calorieNutrient) {
        calories = Math.round((calorieNutrient.value || calorieNutrient.amount || 0) * multiplier)
      }
    }

    // Look for protein
    if (protein <= 0) {
      const proteinNutrient = nutrients.find(
        (n: any) =>
          n.nutrientId === 1003 ||
          n.nutrientNumber === "203" ||
          (n.nutrientName && n.nutrientName.toLowerCase().includes("protein")) ||
          (n.name && n.name.toLowerCase().includes("protein")),
      )

      if (proteinNutrient) {
        protein = Math.round((proteinNutrient.value || proteinNutrient.amount || 0) * multiplier)
      }
    }

    // Look for carbs
    if (carbs <= 0) {
      const carbsNutrient = nutrients.find(
        (n: any) =>
          n.nutrientId === 1005 ||
          n.nutrientNumber === "205" ||
          (n.nutrientName && n.nutrientName.toLowerCase().includes("carbohydrate")) ||
          (n.name && n.name.toLowerCase().includes("carbohydrate")),
      )

      if (carbsNutrient) {
        carbs = Math.round((carbsNutrient.value || carbsNutrient.amount || 0) * multiplier)
      }
    }

    // Look for fat
    if (fat <= 0) {
      const fatNutrient = nutrients.find(
        (n: any) =>
          n.nutrientId === 1004 ||
          n.nutrientNumber === "204" ||
          (n.nutrientName && n.nutrientName.toLowerCase().includes("fat")) ||
          (n.name && n.name.toLowerCase().includes("fat")),
      )

      if (fatNutrient) {
        fat = Math.round((fatNutrient.value || fatNutrient.amount || 0) * multiplier)
      }
    }
  }

  // If still missing values, estimate based on food description
  if (calories <= 0 || protein <= 0 || carbs <= 0 || fat <= 0) {
    const description = food.description?.toLowerCase() || ""

    // Estimate calories if still missing
    if (calories <= 0) {
      if (description.includes("rice") || description.includes("bread") || description.includes("pasta")) {
        calories = 150 * multiplier
      } else if (description.includes("vegetable") || description.includes("fruit")) {
        calories = 80 * multiplier
      } else if (description.includes("meat") || description.includes("chicken") || description.includes("fish")) {
        calories = 200 * multiplier
      } else if (description.includes("milk") || description.includes("yogurt")) {
        calories = 120 * multiplier
      } else {
        calories = 100 * multiplier
      }
    }

    // Estimate protein if still missing
    if (protein <= 0) {
      if (description.includes("meat") || description.includes("chicken") || description.includes("fish")) {
        protein = 20 * multiplier
      } else if (description.includes("milk") || description.includes("yogurt") || description.includes("cheese")) {
        protein = 8 * multiplier
      } else if (description.includes("bean") || description.includes("lentil")) {
        protein = 15 * multiplier
      } else if (description.includes("rice") || description.includes("bread") || description.includes("pasta")) {
        protein = 3 * multiplier
      } else {
        protein = 5 * multiplier
      }
    }

    // Estimate carbs if still missing
    if (carbs <= 0) {
      if (description.includes("rice") || description.includes("bread") || description.includes("pasta")) {
        carbs = 30 * multiplier
      } else if (description.includes("vegetable")) {
        carbs = 10 * multiplier
      } else if (description.includes("fruit")) {
        carbs = 15 * multiplier
      } else if (description.includes("bean") || description.includes("lentil")) {
        carbs = 20 * multiplier
      } else {
        carbs = 15 * multiplier
      }
    }

    // Estimate fat if still missing
    if (fat <= 0) {
      if (description.includes("oil") || description.includes("butter")) {
        fat = 10 * multiplier
      } else if (description.includes("meat") || description.includes("cheese")) {
        fat = 8 * multiplier
      } else if (description.includes("milk") || description.includes("yogurt")) {
        fat = 4 * multiplier
      } else {
        fat = 3 * multiplier
      }
    }
  }

  // Final check to ensure no zero values
  calories = Math.max(calories, 10)
  protein = Math.max(protein, 1)
  carbs = Math.max(carbs, 1)
  fat = Math.max(fat, 1)

  return {
    calories,
    protein,
    carbs,
    fat,
  }
}
