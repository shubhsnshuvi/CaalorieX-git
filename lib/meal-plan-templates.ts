import { collection, addDoc, getDocs, doc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define types for meal plan templates
export interface MealTemplate {
  id?: string
  name: string
  mealType: string // Breakfast, Lunch, Dinner, Snack
  dietPreference: string[] // vegetarian, vegan, non-veg, etc.
  dietGoal: string[] // weight-loss, muscle-building, etc.
  medicalConditionsSafe: string[] // conditions this meal is safe for
  medicalConditionsUnsafe: string[] // conditions this meal is unsafe for
  allergens: string[] // common allergens in this meal
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: {
    name: string
    quantity: string
    nutritionalInfo?: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
  }[]
  preparation?: string
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isLowCarb: boolean
  isHighProtein: boolean
  isLowFat: boolean
  isLowSodium: boolean
  isLowSugar: boolean
  region?: string // For cultural preferences
  createdAt?: any
  updatedAt?: any
}

/**
 * Save a meal template to Firestore
 * @param template The meal template to save
 * @returns The ID of the saved template
 */
export async function saveMealTemplate(template: MealTemplate): Promise<string> {
  try {
    const templateData = {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "meal_templates"), templateData)
    return docRef.id
  } catch (error) {
    console.error("Error saving meal template:", error)
    throw error
  }
}

/**
 * Get meal templates that match specific criteria
 * @param criteria Object containing filter criteria
 * @returns Array of matching meal templates
 */
export async function getMealTemplates(criteria: {
  mealType?: string
  dietPreference?: string
  dietGoal?: string
  medicalConditions?: string[]
  allergies?: string[]
  minCalories?: number
  maxCalories?: number
  isVegetarian?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
}): Promise<MealTemplate[]> {
  try {
    // Start with all templates
    const templatesRef = collection(db, "meal_templates")
    const querySnapshot = await getDocs(templatesRef)

    const templates: MealTemplate[] = []
    querySnapshot.forEach((docSnap) => {
      templates.push({ id: docSnap.id, ...docSnap.data() } as MealTemplate)
    })

    // Apply filters
    return templates.filter((template) => {
      // Filter by meal type
      if (criteria.mealType && template.mealType !== criteria.mealType) {
        return false
      }

      // Filter by diet preference
      if (criteria.dietPreference && !template.dietPreference.includes(criteria.dietPreference)) {
        return false
      }

      // Filter by diet goal
      if (criteria.dietGoal && !template.dietGoal.includes(criteria.dietGoal)) {
        return false
      }

      // Filter by medical conditions (exclude templates unsafe for user's conditions)
      if (criteria.medicalConditions && criteria.medicalConditions.length > 0) {
        for (const condition of criteria.medicalConditions) {
          if (condition !== "none" && template.medicalConditionsUnsafe.includes(condition)) {
            return false
          }
        }
      }

      // Filter by allergies
      if (criteria.allergies && criteria.allergies.length > 0) {
        for (const allergen of criteria.allergies) {
          if (template.allergens.some((a) => a.toLowerCase().includes(allergen.toLowerCase()))) {
            return false
          }
        }
      }

      // Filter by calorie range
      if (criteria.minCalories && template.calories < criteria.minCalories) {
        return false
      }
      if (criteria.maxCalories && template.calories > criteria.maxCalories) {
        return false
      }

      // Filter by dietary restrictions
      if (criteria.isVegetarian && !template.isVegetarian) {
        return false
      }
      if (criteria.isVegan && !template.isVegan) {
        return false
      }
      if (criteria.isGlutenFree && !template.isGlutenFree) {
        return false
      }

      return true
    })
  } catch (error) {
    console.error("Error getting meal templates:", error)
    throw error
  }
}

/**
 * Get a meal template by ID
 * @param id The ID of the template to get
 * @returns The meal template
 */
export async function getMealTemplateById(id: string): Promise<MealTemplate | null> {
  try {
    const docRef = doc(db, "meal_templates", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MealTemplate
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting meal template:", error)
    throw error
  }
}

/**
 * Generate fallback meal templates based on diet preferences and goals
 * @param mealType The type of meal (Breakfast, Lunch, Dinner, Snack)
 * @param dietPreference The diet preference
 * @param dietGoal The diet goal
 * @param calorieTarget The target calories for the meal
 * @returns A meal template
 */
export function generateFallbackTemplate(
  mealType: string,
  dietPreference: string,
  dietGoal: string,
  calorieTarget: number,
): MealTemplate {
  // Default macronutrient ratios based on diet goal
  let proteinRatio = 0.25 // 25% of calories from protein
  let carbRatio = 0.5 // 50% of calories from carbs
  let fatRatio = 0.25 // 25% of calories from fat

  // Adjust macronutrient ratios based on diet goal
  if (dietGoal === "muscle-building" || dietGoal === "lean-mass") {
    proteinRatio = 0.3 // 30% protein
    carbRatio = 0.45 // 45% carbs
    fatRatio = 0.25 // 25% fat
  } else if (dietGoal === "weight-loss") {
    proteinRatio = 0.3 // 30% protein
    carbRatio = 0.4 // 40% carbs
    fatRatio = 0.3 // 30% fat
  } else if (dietGoal === "keto") {
    proteinRatio = 0.25 // 25% protein
    carbRatio = 0.05 // 5% carbs
    fatRatio = 0.7 // 70% fat
  }

  // Calculate macros in grams
  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fat: 9 calories per gram
  const protein = Math.round((calorieTarget * proteinRatio) / 4)
  const carbs = Math.round((calorieTarget * carbRatio) / 4)
  const fat = Math.round((calorieTarget * fatRatio) / 9)

  // Generate meal name based on diet preference and meal type
  let mealName = ""
  let ingredients = []
  let isVegetarian = false
  let isVegan = false
  let isGlutenFree = false

  // Set dietary flags based on preference
  if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian") {
    isVegetarian = true
  } else if (dietPreference === "vegan") {
    isVegetarian = true
    isVegan = true
  } else if (dietPreference === "gluten-free") {
    isGlutenFree = true
  }

  // Generate meal name and ingredients based on meal type and diet preference
  if (mealType === "Breakfast") {
    if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian") {
      mealName = "Vegetarian Breakfast Bowl"
      ingredients = [
        { name: "Oatmeal", quantity: "1 cup" },
        { name: "Greek yogurt", quantity: "1/2 cup" },
        { name: "Mixed berries", quantity: "1/2 cup" },
        { name: "Honey", quantity: "1 tbsp" },
        { name: "Almonds", quantity: "10 pieces" },
      ]
    } else if (dietPreference === "vegan") {
      mealName = "Vegan Breakfast Bowl"
      ingredients = [
        { name: "Oatmeal", quantity: "1 cup" },
        { name: "Almond milk", quantity: "1/2 cup" },
        { name: "Mixed berries", quantity: "1/2 cup" },
        { name: "Maple syrup", quantity: "1 tbsp" },
        { name: "Chia seeds", quantity: "1 tbsp" },
      ]
    } else if (dietPreference === "gluten-free") {
      mealName = "Gluten-Free Breakfast Bowl"
      ingredients = [
        { name: "Gluten-free oats", quantity: "1 cup" },
        { name: "Greek yogurt", quantity: "1/2 cup" },
        { name: "Mixed berries", quantity: "1/2 cup" },
        { name: "Honey", quantity: "1 tbsp" },
        { name: "Walnuts", quantity: "10 pieces" },
      ]
    } else if (dietPreference === "keto") {
      mealName = "Keto Breakfast"
      ingredients = [
        { name: "Eggs", quantity: "2 large" },
        { name: "Avocado", quantity: "1/2" },
        { name: "Spinach", quantity: "1 cup" },
        { name: "Cheddar cheese", quantity: "1/4 cup" },
        { name: "Olive oil", quantity: "1 tbsp" },
      ]
    } else {
      mealName = "Protein Breakfast"
      ingredients = [
        { name: "Eggs", quantity: "2 large" },
        { name: "Whole grain toast", quantity: "2 slices" },
        { name: "Avocado", quantity: "1/2" },
        { name: "Spinach", quantity: "1 cup" },
        { name: "Olive oil", quantity: "1 tsp" },
      ]
    }
  } else if (mealType === "Lunch") {
    if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian") {
      mealName = "Vegetarian Lunch Bowl"
      ingredients = [
        { name: "Quinoa", quantity: "1 cup" },
        { name: "Mixed vegetables", quantity: "1 cup" },
        { name: "Chickpeas", quantity: "1/2 cup" },
        { name: "Feta cheese", quantity: "1/4 cup" },
        { name: "Olive oil dressing", quantity: "1 tbsp" },
      ]
    } else if (dietPreference === "vegan") {
      mealName = "Vegan Lunch Bowl"
      ingredients = [
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Mixed vegetables", quantity: "1 cup" },
        { name: "Tofu", quantity: "100g" },
        { name: "Avocado", quantity: "1/2" },
        { name: "Tahini dressing", quantity: "1 tbsp" },
      ]
    } else if (dietPreference === "gluten-free") {
      mealName = "Gluten-Free Lunch Bowl"
      ingredients = [
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Grilled chicken", quantity: "100g" },
        { name: "Mixed vegetables", quantity: "1 cup" },
        { name: "Avocado", quantity: "1/2" },
        { name: 'Olive oil dressing", quantity: 1 tbsp' },
      ]
    } else if (dietPreference === "keto") {
      mealName = "Keto Lunch"
      ingredients = [
        { name: "Grilled chicken", quantity: "150g" },
        { name: "Avocado", quantity: "1/2" },
        { name: "Spinach", quantity: "2 cups" },
        { name: "Feta cheese", quantity: "1/4 cup" },
        { name: "Olive oil dressing", quantity: "2 tbsp" },
      ]
    } else {
      mealName = "Protein Lunch Bowl"
      ingredients = [
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Grilled chicken", quantity: "150g" },
        { name: "Mixed vegetables", quantity: "1 cup" },
        { name: "Avocado", quantity: "1/2" },
        { name: "Olive oil dressing", quantity: "1 tbsp" },
      ]
    }
  } else if (mealType === "Dinner") {
    if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian") {
      mealName = "Vegetarian Dinner Plate"
      ingredients = [
        { name: "Lentil curry", quantity: "1 cup" },
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Steamed vegetables", quantity: "1 cup" },
        { name: "Greek yogurt", quantity: "1/4 cup" },
        { name: "Olive oil", quantity: "1 tsp" },
      ]
    } else if (dietPreference === "vegan") {
      mealName = "Vegan Dinner Plate"
      ingredients = [
        { name: "Chickpea curry", quantity: "1 cup" },
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Steamed vegetables", quantity: "1 cup" },
        { name: "Coconut yogurt", quantity: "1/4 cup" },
        { name: "Olive oil", quantity: "1 tsp" },
      ]
    } else if (dietPreference === "gluten-free") {
      mealName = "Gluten-Free Dinner Plate"
      ingredients = [
        { name: "Grilled salmon", quantity: "150g" },
        { name: "Quinoa", quantity: "1 cup" },
        { name: "Steamed vegetables", quantity: "1 cup" },
        { name: "Lemon juice", quantity: "1 tbsp" },
        { name: "Olive oil", quantity: "1 tsp" },
      ]
    } else if (dietPreference === "keto") {
      mealName = "Keto Dinner"
      ingredients = [
        { name: "Grilled salmon", quantity: "200g" },
        { name: "Cauliflower rice", quantity: "1 cup" },
        { name: "Asparagus", quantity: "1 cup" },
        { name: "Butter", quantity: "1 tbsp" },
        { name: "Lemon juice", quantity: "1 tsp" },
      ]
    } else {
      mealName = "Protein Dinner Plate"
      ingredients = [
        { name: "Grilled salmon", quantity: "150g" },
        { name: "Brown rice", quantity: "1 cup" },
        { name: "Steamed vegetables", quantity: "1 cup" },
        { name: "Lemon juice", quantity: "1 tbsp" },
        { name: "Olive oil", quantity: "1 tsp" },
      ]
    }
  } else {
    // Snack
    if (dietPreference === "vegetarian" || dietPreference === "indian-vegetarian") {
      mealName = "Vegetarian Snack"
      ingredients = [
        { name: "Greek yogurt", quantity: "1 cup" },
        { name: "Mixed berries", quantity: "1/2 cup" },
        { name: "Honey", quantity: "1 tsp" },
        { name: "Almonds", quantity: "10 pieces" },
      ]
    } else if (dietPreference === "vegan") {
      mealName = "Vegan Snack"
      ingredients = [
        { name: "Hummus", quantity: "1/4 cup" },
        { name: "Carrot sticks", quantity: "1 cup" },
        { name: "Cucumber slices", quantity: "1 cup" },
        { name: "Mixed nuts", quantity: "1/4 cup" },
      ]
    } else if (dietPreference === "gluten-free") {
      mealName = "Gluten-Free Snack"
      ingredients = [
        { name: "Rice cakes", quantity: "2" },
        { name: "Almond butter", quantity: "1 tbsp" },
        { name: "Banana", quantity: "1 small" },
        { name: "Cinnamon", quantity: "1/4 tsp" },
      ]
    } else if (dietPreference === "keto") {
      mealName = "Keto Snack"
      ingredients = [
        { name: "Cheese cubes", quantity: "1/4 cup" },
        { name: "Olives", quantity: "10" },
        { name: "Almonds", quantity: "1/4 cup" },
        { name: "Celery sticks", quantity: "2" },
      ]
    } else {
      mealName = "Protein Snack"
      ingredients = [
        { name: "Protein shake", quantity: "1 scoop" },
        { name: "Almond milk", quantity: "1 cup" },
        { name: "Banana", quantity: "1 small" },
        { name: "Peanut butter", quantity: "1 tbsp" },
      ]
    }
  }

  // Create and return the fallback template
  return {
    name: mealName,
    mealType: mealType,
    dietPreference: [dietPreference],
    dietGoal: [dietGoal],
    medicalConditionsSafe: ["none"],
    medicalConditionsUnsafe: [],
    allergens: [],
    calories: calorieTarget,
    protein: protein,
    carbs: carbs,
    fat: fat,
    ingredients: ingredients,
    preparation: "Combine all ingredients and enjoy.",
    isVegetarian: isVegetarian,
    isVegan: isVegan,
    isGlutenFree: isGlutenFree,
    isLowCarb: dietGoal === "keto",
    isHighProtein: dietGoal === "muscle-building" || dietGoal === "lean-mass",
    isLowFat: dietGoal === "weight-loss",
    isLowSodium: false,
    isLowSugar: dietGoal === "weight-loss" || dietGoal === "keto",
  }
}
