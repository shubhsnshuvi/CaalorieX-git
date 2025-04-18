/**
 * Diet preference handler for meal planning
 * This module provides functions to check if foods comply with specific diet preferences
 * and to adjust meal plans based on dietary requirements.
 */

// Define food properties that affect diet preferences
export interface FoodDietProperties {
  isVegetarian: boolean
  isVegan: boolean
  isEggetarian: boolean
  containsGluten: boolean
  containsOnionGarlic: boolean
  containsRootVegetables: boolean
  isProcessed: boolean
  isRefined: boolean
  isHighGlycemic: boolean
  isHighFat: boolean
  isHighProtein: boolean
  isHighCarb: boolean
  isLowCarb: boolean
  isLowFat: boolean
  isLowProtein: boolean
  isLowCalorie: boolean
  isHighCalorie: boolean
  isFermented: boolean
  isRaw: boolean
  isFried: boolean
  isBaked: boolean
  isSteamed: boolean
  isBoiled: boolean
  isGrilled: boolean
  isRoasted: boolean
  isSauteed: boolean
  isStewed: boolean
  isBraised: boolean
  isPickled: boolean
  isCured: boolean
  isSmoked: boolean
  isDried: boolean
  isFresh: boolean
  isFrozen: boolean
  isCanned: boolean
  isPackaged: boolean
  isOrganic: boolean
  isNonGMO: boolean
  isLocal: boolean
  isSeasonal: boolean
  isWhole: boolean
  isRefined: boolean
  isProcessed: boolean
  isUltraProcessed: boolean
  isNatural: boolean
  isArtificial: boolean
  isAdditiveFree: boolean
  isPreservativeFree: boolean
  isSugarFree: boolean
  isSaltFree: boolean
  isOilFree: boolean
  isGlutenFree: boolean
  isDairyFree: boolean
  isEggFree: boolean
  isNutFree: boolean
  isSoyFree: boolean
  isWheatFree: boolean
  isCornFree: boolean
  isYeastFree: boolean
  isAlcoholFree: boolean
  isCaffeineFree: boolean
  isTheobromineFree: boolean
  isHistamineFree: boolean
  isFODMAPFree: boolean
  isLectinFree: boolean
  isOxalateFree: boolean
  isGoitrogenFree: boolean
  isPurineFree: boolean
  isSalicylateFree: boolean
  isAminesFree: boolean
  isGlutamateFree: boolean
  isSulfiteFree: boolean
  isNitrateFree: boolean
  isNightShadeFree: boolean
  isPhytoestrogensLow: boolean
  isKosher: boolean
  isHalal: boolean
}

// Foods allowed for specific diet preferences
const DIET_ALLOWED_FOODS = {
  vegetarian: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "tofu",
    "tempeh",
    "seitan",
    "milk",
    "cheese",
    "yogurt",
    "butter",
  ],
  vegan: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "tofu",
    "tempeh",
    "seitan",
    "plant milk",
    "nutritional yeast",
    "vegan cheese",
  ],
  "indian-vegetarian": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "honey",
    "paneer",
    "ghee",
    "milk",
    "curd",
    "butter",
    "rice",
    "wheat",
    "dal",
  ],
  "non-veg": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "beef",
    "pork",
    "lamb",
  ],
  eggetarian: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "milk",
    "cheese",
    "yogurt",
    "butter",
  ],
  "gluten-free": [
    "vegetable",
    "fruit",
    "rice",
    "corn",
    "potato",
    "quinoa",
    "millet",
    "buckwheat",
    "amaranth",
    "teff",
    "sorghum",
    "tapioca",
    "arrowroot",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "egg",
    "dairy",
    "nut",
    "seed",
    "legume",
    "bean",
  ],
  "intermittent-fasting": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "water",
    "tea",
    "coffee",
  ],
  "blood-type": {
    A: ["vegetable", "fruit", "tofu", "legume", "grain", "seafood"],
    B: ["meat", "dairy", "vegetable", "fruit", "grain", "seafood"],
    AB: ["seafood", "tofu", "dairy", "vegetable", "fruit", "grain"],
    O: ["meat", "fish", "vegetable", "fruit"],
  },
  "hindu-fasting": [
    "fruit",
    "milk",
    "yogurt",
    "potato",
    "sweet potato",
    "water chestnut",
    "buckwheat",
    "amaranth",
    "rock salt",
    "ginger",
    "cumin",
    "green vegetable",
  ],
  "jain-diet": ["grain", "legume", "dairy", "fruit", "above-ground vegetable", "nut", "seed"],
  "sattvic-diet": [
    "fruit",
    "vegetable",
    "whole grain",
    "legume",
    "nut",
    "seed",
    "milk",
    "ghee",
    "honey",
    "jaggery",
    "herb",
    "spice",
  ],
  "indian-regional": {
    north: ["wheat", "dairy", "vegetable", "legume", "paneer", "chicken", "lamb"],
    south: ["rice", "coconut", "vegetable", "legume", "seafood", "yogurt"],
    east: ["rice", "fish", "vegetable", "mustard", "panch phoron"],
    west: ["wheat", "rice", "legume", "vegetable", "dairy", "jaggery"],
    central: ["wheat", "corn", "legume", "vegetable", "dairy"],
  },
  keto: [
    "meat",
    "fish",
    "egg",
    "high-fat dairy",
    "above-ground vegetable",
    "nut",
    "seed",
    "avocado",
    "olive oil",
    "coconut oil",
    "butter",
    "ghee",
    "cream",
  ],
  paleo: ["meat", "fish", "egg", "vegetable", "fruit", "nut", "seed", "healthy oil"],
  whole30: ["meat", "fish", "egg", "vegetable", "fruit", "nut", "seed", "healthy oil"],
  mediterranean: [
    "vegetable",
    "fruit",
    "whole grain",
    "legume",
    "nut",
    "seed",
    "olive oil",
    "fish",
    "seafood",
    "poultry",
    "egg",
    "dairy",
    "herb",
    "spice",
  ],
  dash: ["vegetable", "fruit", "whole grain", "lean protein", "low-fat dairy", "nut", "seed", "legume", "healthy oil"],
  mind: [
    "green leafy vegetable",
    "other vegetable",
    "nut",
    "berry",
    "bean",
    "whole grain",
    "fish",
    "poultry",
    "olive oil",
    "wine",
  ],
  "low-fodmap": [
    "meat",
    "fish",
    "egg",
    "certain vegetable",
    "certain fruit",
    "lactose-free dairy",
    "certain grain",
    "certain nut",
    "certain seed",
  ],
}

// Foods to avoid for specific diet preferences
const DIET_AVOID_FOODS = {
  vegetarian: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
  ],
  vegan: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "dairy",
    "egg",
    "honey",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
    "whey",
    "casein",
    "lactose",
    "beeswax",
    "shellac",
    "carmine",
    "isinglass",
  ],
  "indian-vegetarian": ["meat", "poultry", "fish", "seafood", "egg", "gelatin", "animal rennet"],
  eggetarian: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
  ],
  "gluten-free": [
    "wheat",
    "barley",
    "rye",
    "triticale",
    "spelt",
    "kamut",
    "semolina",
    "durum",
    "farina",
    "graham",
    "bulgur",
    "couscous",
    "seitan",
    "malt",
    "brewer's yeast",
  ],
  "intermittent-fasting": ["any food during fasting period", "caloric beverage during fasting period"],
  "hindu-fasting": [
    "grain",
    "rice",
    "wheat",
    "millet",
    "corn",
    "onion",
    "garlic",
    "meat",
    "egg",
    "lentil",
    "common salt",
    "alcohol",
  ],
  "jain-diet": [
    "meat",
    "egg",
    "honey",
    "root vegetable",
    "onion",
    "garlic",
    "potato",
    "carrot",
    "beetroot",
    "radish",
    "turmeric",
    "ginger",
    "underground vegetable",
    "fermented food",
    "alcohol",
  ],
  "sattvic-diet": [
    "meat",
    "egg",
    "fish",
    "onion",
    "garlic",
    "mushroom",
    "alcohol",
    "tobacco",
    "processed food",
    "stale food",
    "fried food",
    "spicy food",
    "sour food",
  ],
  keto: [
    "sugar",
    "grain",
    "legume",
    "high-carb fruit",
    "high-carb vegetable",
    "tuber",
    "root vegetable",
    "low-fat dairy",
    "sweetener",
  ],
  paleo: ["grain", "legume", "dairy", "refined sugar", "salt", "potato", "processed food"],
  whole30: [
    "sugar",
    "alcohol",
    "grain",
    "legume",
    "dairy",
    "carrageenan",
    "MSG",
    "sulfite",
    "processed food",
    "baked good",
    "junk food",
    "dessert",
  ],
  "low-fodmap": [
    "onion",
    "garlic",
    "wheat",
    "rye",
    "barley",
    "dairy",
    "legume",
    "certain fruit",
    "certain vegetable",
    "honey",
    "high-fructose corn syrup",
  ],
}

/**
 * Check if a food complies with a specific diet preference
 * @param foodName The name of the food
 * @param dietPreference The diet preference to check
 * @param properties Optional detailed properties of the food
 * @returns Boolean indicating if the food complies
 */
export function doesFoodComplyWithDiet(
  foodName: string,
  dietPreference: string,
  properties?: FoodDietProperties,
): boolean {
  // Convert food name to lowercase for comparison
  const lowerFoodName = foodName.toLowerCase()

  // If the diet preference is not recognized, assume the food complies
  if (
    !Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference) &&
    !Object.keys(DIET_AVOID_FOODS).includes(dietPreference)
  ) {
    return true
  }

  // Check if the food is in the avoid list for this diet
  if (Object.keys(DIET_AVOID_FOODS).includes(dietPreference)) {
    const avoidList = DIET_AVOID_FOODS[dietPreference as keyof typeof DIET_AVOID_FOODS]
    if (Array.isArray(avoidList) && avoidList.some((food) => lowerFoodName.includes(food))) {
      return false
    }
  }

  // Check if the food is in the allowed list for this diet
  if (Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference)) {
    const allowedList = DIET_ALLOWED_FOODS[dietPreference as keyof typeof DIET_ALLOWED_FOODS]

    // Handle special case for blood-type diet
    if (dietPreference === "blood-type") {
      // Default to type O if not specified
      const bloodType = properties?.bloodType || "O"
      const allowedForType = (allowedList as any)[bloodType]

      if (Array.isArray(allowedForType) && !allowedForType.some((food) => lowerFoodName.includes(food))) {
        return false
      }
    }
    // Handle special case for Indian regional diets
    else if (dietPreference === "indian-regional") {
      // Default to north if not specified
      const region = properties?.region || "north"
      const allowedForRegion = (allowedList as any)[region]

      if (Array.isArray(allowedForRegion) && !allowedForRegion.some((food) => lowerFoodName.includes(food))) {
        return false
      }
    }
    // Handle normal case
    else if (Array.isArray(allowedList) && !allowedList.some((food) => lowerFoodName.includes(food))) {
      return false
    }
  }

  // If detailed properties are provided, check them
  if (properties) {
    switch (dietPreference) {
      case "vegetarian":
        if (!properties.isVegetarian) {
          return false
        }
        break

      case "vegan":
        if (!properties.isVegan) {
          return false
        }
        break

      case "indian-vegetarian":
        if (!properties.isVegetarian || !properties.isEggFree) {
          return false
        }
        break

      case "eggetarian":
        if (!properties.isVegetarian || properties.isEggFree) {
          return false
        }
        break

      case "gluten-free":
        if (!properties.isGlutenFree) {
          return false
        }
        break

      case "jain-diet":
        if (
          !properties.isVegetarian ||
          !properties.isEggFree ||
          !properties.containsOnionGarlic ||
          !properties.containsRootVegetables
        ) {
          return false
        }
        break

      case "sattvic-diet":
        if (
          !properties.isVegetarian ||
          !properties.isEggFree ||
          properties.containsOnionGarlic ||
          properties.isProcessed ||
          properties.isFried ||
          properties.isHighGlycemic
        ) {
          return false
        }
        break

      case "keto":
        if (!properties.isLowCarb || !properties.isHighFat) {
          return false
        }
        break
    }
  }

  // If no issues found, the food complies with the diet
  return true
}

/**
 * Adjust a meal plan for a specific diet preference
 * @param mealPlan The original meal plan
 * @param dietPreference The diet preference
 * @returns Adjusted meal plan
 */
export function adjustMealPlanForDietPreference(mealPlan: any[], dietPreference: string): any[] {
  // If no diet preference, return the original plan
  if (!dietPreference) {
    return mealPlan
  }

  // Process each day in the meal plan
  return mealPlan.map((day) => {
    // Process each meal in the day
    const adjustedMeals = day.meals.map((meal: any) => {
      // Check if the meal complies with the diet
      const complies = doesFoodComplyWithDiet(meal.food, dietPreference)

      // If the meal complies, return it unchanged
      if (complies) {
        return meal
      }

      // If the meal doesn't comply, add a warning
      return {
        ...meal,
        warning: `This meal may not comply with your ${dietPreference} diet. Consider substituting with a ${dietPreference}-friendly alternative.`,
      }
    })

    return {
      ...day,
      meals: adjustedMeals,
    }
  })
}

/**
 * Get recommended foods for a specific diet preference
 * @param dietPreference The diet preference
 * @returns Array of recommended foods
 */
export function getRecommendedFoodsForDiet(dietPreference: string): string[] {
  if (Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference)) {
    const allowedList = DIET_ALLOWED_FOODS[dietPreference as keyof typeof DIET_ALLOWED_FOODS]

    // Handle special cases
    if (dietPreference === "blood-type" || dietPreference === "indian-regional") {
      // Flatten all values for these special cases
      const allAllowed: string[] = []
      Object.values(allowedList as Record<string, string[]>).forEach((foods) => {
        allAllowed.push(...foods)
      })
      return [...new Set(allAllowed)] // Remove duplicates
    }

    return allowedList as string[]
  }
  return []
}
