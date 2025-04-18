/**
 * Medical condition handler for meal planning
 * This module provides functions to check if foods are safe for specific medical conditions
 * and to adjust meal plans based on medical requirements.
 */

// Define food properties that affect medical conditions
export interface FoodMedicalProperties {
  glycemicIndex?: number // For diabetes
  sodiumContent?: number // For hypertension, heart disease
  saturatedFatContent?: number // For heart disease, high cholesterol
  fiberContent?: number // For diabetes, PCOS
  sugarContent?: number // For diabetes
  caffeineContent?: number // For thyroid, hypertension
  goitrogensContent?: boolean // For thyroid
  insulinIndex?: number // For PCOS
  histamineContent?: boolean // For allergies
  fodmapContent?: boolean // For IBS
  purineContent?: number // For gout
  oxalateContent?: number // For kidney stones
  tyramine?: boolean // For migraines
}

// Define thresholds for different medical conditions
const MEDICAL_THRESHOLDS = {
  diabetes: {
    maxGlycemicIndex: 55,
    maxSugarContent: 5, // g per 100g
    minFiberContent: 3, // g per 100g
  },
  thyroid: {
    maxCaffeineContent: 50, // mg per serving
    avoidGoitrogens: true,
  },
  pcod: {
    maxInsulinIndex: 50,
    minFiberContent: 5, // g per 100g
    maxSugarContent: 5, // g per 100g
  },
  "high-cholesterol": {
    maxSaturatedFatContent: 2, // g per 100g
    minFiberContent: 3, // g per 100g
  },
  hypertension: {
    maxSodiumContent: 140, // mg per 100g
    maxCaffeineContent: 50, // mg per serving
  },
  "heart-disease": {
    maxSaturatedFatContent: 1.5, // g per 100g
    maxSodiumContent: 120, // mg per 100g
    minFiberContent: 3, // g per 100g
  },
  ibs: {
    avoidFodmap: true,
  },
  gout: {
    maxPurineContent: 50, // mg per 100g
  },
  "kidney-stones": {
    maxOxalateContent: 10, // mg per 100g
  },
  migraines: {
    avoidTyramine: true,
  },
}

// Foods to avoid for specific medical conditions
const FOODS_TO_AVOID = {
  diabetes: [
    "sugar",
    "candy",
    "chocolate",
    "soda",
    "juice",
    "white bread",
    "white rice",
    "pastry",
    "cake",
    "cookie",
    "ice cream",
    "honey",
    "maple syrup",
    "jam",
    "jelly",
  ],
  thyroid: [
    "soy",
    "tofu",
    "soybean",
    "cabbage",
    "broccoli",
    "cauliflower",
    "kale",
    "brussels sprouts",
    "bok choy",
    "turnip",
    "rutabaga",
    "radish",
    "millet",
    "peach",
    "peanut",
    "pine nut",
    "strawberry",
  ],
  pcod: [
    "white bread",
    "pastry",
    "cake",
    "cookie",
    "soda",
    "juice",
    "candy",
    "processed food",
    "fried food",
    "fast food",
    "white rice",
    "potato chips",
  ],
  "high-cholesterol": [
    "butter",
    "ghee",
    "lard",
    "fatty meat",
    "skin",
    "organ meat",
    "full-fat dairy",
    "cheese",
    "cream",
    "ice cream",
    "coconut oil",
    "palm oil",
    "fried food",
    "fast food",
  ],
  hypertension: [
    "salt",
    "soy sauce",
    "pizza",
    "canned soup",
    "processed meat",
    "bacon",
    "ham",
    "salami",
    "sausage",
    "frozen dinner",
    "pickle",
    "ketchup",
    "mustard",
    "salad dressing",
  ],
  "heart-disease": [
    "butter",
    "ghee",
    "lard",
    "fatty meat",
    "skin",
    "organ meat",
    "full-fat dairy",
    "cheese",
    "cream",
    "ice cream",
    "coconut oil",
    "palm oil",
    "fried food",
    "fast food",
    "salt",
  ],
  ibs: [
    "onion",
    "garlic",
    "wheat",
    "rye",
    "barley",
    "apple",
    "pear",
    "watermelon",
    "cauliflower",
    "mushroom",
    "milk",
    "ice cream",
    "yogurt",
    "soft cheese",
    "beans",
    "lentils",
  ],
  gout: [
    "organ meat",
    "liver",
    "kidney",
    "sweetbread",
    "game meat",
    "sardine",
    "mackerel",
    "anchovy",
    "herring",
    "scallop",
    "beer",
    "liquor",
    "yeast",
  ],
  "kidney-stones": ["spinach", "rhubarb", "beet", "swiss chard", "chocolate", "tea", "nuts", "peanut", "wheat bran"],
  migraines: [
    "aged cheese",
    "cured meat",
    "smoked fish",
    "yeast extract",
    "soy sauce",
    "miso",
    "teriyaki",
    "alcohol",
    "chocolate",
    "caffeine",
    "msg",
    "artificial sweetener",
  ],
}

// Foods recommended for specific medical conditions
const FOODS_RECOMMENDED = {
  diabetes: [
    "leafy greens",
    "broccoli",
    "cauliflower",
    "cucumber",
    "tomato",
    "bell pepper",
    "zucchini",
    "eggplant",
    "beans",
    "lentils",
    "chickpeas",
    "quinoa",
    "brown rice",
    "oats",
    "barley",
    "fish",
    "chicken",
    "turkey",
    "tofu",
    "nuts",
    "seeds",
    "olive oil",
    "avocado",
  ],
  thyroid: [
    "seafood",
    "fish",
    "seaweed",
    "dairy",
    "egg",
    "chicken",
    "beef",
    "nuts",
    "whole grain",
    "fresh fruit",
    "vegetable",
    "brazil nut",
    "yogurt",
    "milk",
  ],
  pcod: [
    "leafy greens",
    "broccoli",
    "cauliflower",
    "bell pepper",
    "tomato",
    "cucumber",
    "beans",
    "lentils",
    "chickpeas",
    "quinoa",
    "brown rice",
    "oats",
    "barley",
    "fish",
    "chicken",
    "turkey",
    "tofu",
    "nuts",
    "seeds",
    "olive oil",
    "avocado",
    "cinnamon",
    "turmeric",
  ],
  "high-cholesterol": [
    "oats",
    "barley",
    "beans",
    "lentils",
    "eggplant",
    "okra",
    "nuts",
    "soy",
    "fatty fish",
    "salmon",
    "mackerel",
    "sardine",
    "fruit",
    "vegetable",
    "olive oil",
    "avocado",
  ],
  hypertension: [
    "banana",
    "orange",
    "spinach",
    "kale",
    "potato",
    "sweet potato",
    "beans",
    "lentils",
    "fish",
    "chicken",
    "turkey",
    "yogurt",
    "oats",
    "garlic",
    "olive oil",
    "dark chocolate",
  ],
  "heart-disease": [
    "salmon",
    "tuna",
    "mackerel",
    "sardine",
    "nuts",
    "seeds",
    "olive oil",
    "avocado",
    "oats",
    "barley",
    "brown rice",
    "quinoa",
    "beans",
    "lentils",
    "fruit",
    "vegetable",
    "leafy greens",
    "berries",
    "dark chocolate",
    "tomato",
    "garlic",
    "onion",
  ],
  ibs: [
    "rice",
    "potato",
    "carrot",
    "cucumber",
    "lettuce",
    "zucchini",
    "bell pepper",
    "egg",
    "chicken",
    "turkey",
    "fish",
    "lactose-free dairy",
    "hard cheese",
    "oats",
    "quinoa",
  ],
  gout: [
    "fruit",
    "vegetable",
    "whole grain",
    "legume",
    "low-fat dairy",
    "egg",
    "chicken",
    "turkey",
    "plant oil",
    "nuts",
    "seeds",
    "cherry",
    "coffee",
    "water",
  ],
  "kidney-stones": [
    "water",
    "lemon juice",
    "lime juice",
    "orange",
    "melon",
    "banana",
    "cucumber",
    "cauliflower",
    "cabbage",
    "peas",
    "chicken",
    "egg",
    "white fish",
    "olive oil",
    "herb",
  ],
  migraines: [
    "fresh fruit",
    "fresh vegetable",
    "fresh meat",
    "fresh fish",
    "rice",
    "oats",
    "quinoa",
    "fresh bread",
    "egg",
    "milk",
    "water",
    "ginger",
    "turmeric",
    "omega-3",
  ],
}

/**
 * Check if a food is safe for a specific medical condition
 * @param foodName The name of the food
 * @param medicalCondition The medical condition to check
 * @param properties Optional detailed properties of the food
 * @returns Boolean indicating if the food is safe
 */
export function isFoodSafeForCondition(
  foodName: string,
  medicalCondition: string,
  properties?: FoodMedicalProperties,
): boolean {
  // Convert food name to lowercase for comparison
  const lowerFoodName = foodName.toLowerCase()

  // If the condition is not recognized, assume the food is safe
  if (!Object.keys(FOODS_TO_AVOID).includes(medicalCondition)) {
    return true
  }

  // Check if the food is in the avoid list for this condition
  const avoidList = FOODS_TO_AVOID[medicalCondition as keyof typeof FOODS_TO_AVOID]
  if (avoidList.some((food) => lowerFoodName.includes(food))) {
    return false
  }

  // If detailed properties are provided, check against thresholds
  if (properties && MEDICAL_THRESHOLDS[medicalCondition as keyof typeof MEDICAL_THRESHOLDS]) {
    const thresholds = MEDICAL_THRESHOLDS[medicalCondition as keyof typeof MEDICAL_THRESHOLDS]

    switch (medicalCondition) {
      case "diabetes":
        if (
          (properties.glycemicIndex !== undefined && properties.glycemicIndex > thresholds.maxGlycemicIndex) ||
          (properties.sugarContent !== undefined && properties.sugarContent > thresholds.maxSugarContent) ||
          (properties.fiberContent !== undefined && properties.fiberContent < thresholds.minFiberContent)
        ) {
          return false
        }
        break

      case "thyroid":
        if (
          (properties.caffeineContent !== undefined && properties.caffeineContent > thresholds.maxCaffeineContent) ||
          (properties.goitrogensContent !== undefined && properties.goitrogensContent && thresholds.avoidGoitrogens)
        ) {
          return false
        }
        break

      case "pcod":
        if (
          (properties.insulinIndex !== undefined && properties.insulinIndex > thresholds.maxInsulinIndex) ||
          (properties.fiberContent !== undefined && properties.fiberContent < thresholds.minFiberContent) ||
          (properties.sugarContent !== undefined && properties.sugarContent > thresholds.maxSugarContent)
        ) {
          return false
        }
        break

      case "high-cholesterol":
        if (
          (properties.saturatedFatContent !== undefined &&
            properties.saturatedFatContent > thresholds.maxSaturatedFatContent) ||
          (properties.fiberContent !== undefined && properties.fiberContent < thresholds.minFiberContent)
        ) {
          return false
        }
        break

      case "hypertension":
        if (
          (properties.sodiumContent !== undefined && properties.sodiumContent > thresholds.maxSodiumContent) ||
          (properties.caffeineContent !== undefined && properties.caffeineContent > thresholds.maxCaffeineContent)
        ) {
          return false
        }
        break

      case "heart-disease":
        if (
          (properties.saturatedFatContent !== undefined &&
            properties.saturatedFatContent > thresholds.maxSaturatedFatContent) ||
          (properties.sodiumContent !== undefined && properties.sodiumContent > thresholds.maxSodiumContent) ||
          (properties.fiberContent !== undefined && properties.fiberContent < thresholds.minFiberContent)
        ) {
          return false
        }
        break

      case "ibs":
        if (properties.fodmapContent !== undefined && properties.fodmapContent && thresholds.avoidFodmap) {
          return false
        }
        break

      case "gout":
        if (properties.purineContent !== undefined && properties.purineContent > thresholds.maxPurineContent) {
          return false
        }
        break

      case "kidney-stones":
        if (properties.oxalateContent !== undefined && properties.oxalateContent > thresholds.maxOxalateContent) {
          return false
        }
        break

      case "migraines":
        if (properties.tyramine !== undefined && properties.tyramine && thresholds.avoidTyramine) {
          return false
        }
        break
    }
  }

  // If no issues found, the food is considered safe
  return true
}

/**
 * Get recommended foods for a specific medical condition
 * @param medicalCondition The medical condition
 * @returns Array of recommended foods
 */
export function getRecommendedFoodsForCondition(medicalCondition: string): string[] {
  if (Object.keys(FOODS_RECOMMENDED).includes(medicalCondition)) {
    return FOODS_RECOMMENDED[medicalCondition as keyof typeof FOODS_RECOMMENDED]
  }
  return []
}

/**
 * Adjust a meal plan for specific medical conditions
 * @param mealPlan The original meal plan
 * @param medicalConditions Array of medical conditions
 * @returns Adjusted meal plan
 */
export function adjustMealPlanForMedicalConditions(mealPlan: any[], medicalConditions: string[]): any[] {
  // If no medical conditions or only "none", return the original plan
  if (
    !medicalConditions ||
    medicalConditions.length === 0 ||
    (medicalConditions.length === 1 && medicalConditions[0] === "none")
  ) {
    return mealPlan
  }

  // Process each day in the meal plan
  return mealPlan.map((day) => {
    // Process each meal in the day
    const adjustedMeals = day.meals.map((meal: any) => {
      // Check if the meal is safe for all conditions
      let isSafe = true
      const unsafeConditions: string[] = []

      for (const condition of medicalConditions) {
        if (condition !== "none" && !isFoodSafeForCondition(meal.food, condition)) {
          isSafe = false
          unsafeConditions.push(condition)
        }
      }

      // If the meal is safe, return it unchanged
      if (isSafe) {
        return meal
      }

      // If the meal is unsafe, add a warning
      return {
        ...meal,
        warning: `This meal may not be suitable for the following conditions: ${unsafeConditions.join(", ")}. Consider substituting with ${getRecommendedFoodsForCondition(unsafeConditions[0]).slice(0, 3).join(", ")}.`,
      }
    })

    return {
      ...day,
      meals: adjustedMeals,
    }
  })
}
