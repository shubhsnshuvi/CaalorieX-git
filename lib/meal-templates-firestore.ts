import { collection, addDoc, getDocs, query, where, limit, doc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Define types for meal templates
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
  difficulty: string // easy, medium, hard
  prepTime: number // in minutes
  createdAt?: any
  updatedAt?: any
}

// Define types for recipes
export interface Recipe {
  id?: string
  name: string
  mealType: string // Breakfast, Lunch, Dinner, Snack
  dietPreference: string[] // vegetarian, vegan, non-veg, etc.
  dietGoal: string[] // weight-loss, muscle-building, etc.
  medicalConditionsSafe: string[] // conditions this recipe is safe for
  medicalConditionsUnsafe: string[] // conditions this recipe is unsafe for
  allergens: string[] // common allergens in this recipe
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
  steps: string[]
  prepTime: number // in minutes
  cookTime: number // in minutes
  difficulty: string // easy, medium, hard
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
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
 * Save a recipe to Firestore
 * @param recipe The recipe to save
 * @returns The ID of the saved recipe
 */
export async function saveRecipe(recipe: Recipe): Promise<string> {
  try {
    const recipeData = {
      ...recipe,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "recipes"), recipeData)
    return docRef.id
  } catch (error) {
    console.error("Error saving recipe:", error)
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
  difficulty?: string
  maxPrepTime?: number
  limitCount?: number
}): Promise<MealTemplate[]> {
  try {
    const limitCount = criteria.limitCount || 50
    const queryConstraints: any[] = []

    // Add query constraints based on criteria
    if (criteria.mealType) {
      queryConstraints.push(where("mealType", "==", criteria.mealType))
    }

    if (criteria.dietPreference) {
      queryConstraints.push(where("dietPreference", "array-contains", criteria.dietPreference))
    }

    if (criteria.dietGoal) {
      queryConstraints.push(where("dietGoal", "array-contains", criteria.dietGoal))
    }

    if (criteria.isVegetarian) {
      queryConstraints.push(where("isVegetarian", "==", true))
    }

    if (criteria.isVegan) {
      queryConstraints.push(where("isVegan", "==", true))
    }

    if (criteria.isGlutenFree) {
      queryConstraints.push(where("isGlutenFree", "==", true))
    }

    if (criteria.difficulty) {
      queryConstraints.push(where("difficulty", "==", criteria.difficulty))
    }

    if (criteria.maxPrepTime) {
      queryConstraints.push(where("prepTime", "<=", criteria.maxPrepTime))
    }

    // Create and execute query
    const templatesRef = collection(db, "meal_templates")
    const q = query(templatesRef, ...queryConstraints, limit(limitCount))
    const querySnapshot = await getDocs(q)

    const templates: MealTemplate[] = []
    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as MealTemplate)
    })

    // Apply additional filtering that can't be done with Firestore queries
    return templates.filter((template) => {
      // Filter by calorie range
      if (criteria.minCalories && template.calories < criteria.minCalories) {
        return false
      }
      if (criteria.maxCalories && template.calories > criteria.maxCalories) {
        return false
      }

      // Filter by medical conditions
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

      return true
    })
  } catch (error) {
    console.error("Error getting meal templates:", error)
    throw error
  }
}

/**
 * Get recipes that match specific criteria
 * @param criteria Object containing filter criteria
 * @returns Array of matching recipes
 */
export async function getRecipes(criteria: {
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
  difficulty?: string
  maxPrepTime?: number
  maxCookTime?: number
  limitCount?: number
}): Promise<Recipe[]> {
  try {
    const limitCount = criteria.limitCount || 50
    const queryConstraints: any[] = []

    // Add query constraints based on criteria
    if (criteria.mealType) {
      queryConstraints.push(where("mealType", "==", criteria.mealType))
    }

    if (criteria.dietPreference) {
      queryConstraints.push(where("dietPreference", "array-contains", criteria.dietPreference))
    }

    if (criteria.dietGoal) {
      queryConstraints.push(where("dietGoal", "array-contains", criteria.dietGoal))
    }

    if (criteria.isVegetarian) {
      queryConstraints.push(where("isVegetarian", "==", true))
    }

    if (criteria.isVegan) {
      queryConstraints.push(where("isVegan", "==", true))
    }

    if (criteria.isGlutenFree) {
      queryConstraints.push(where("isGlutenFree", "==", true))
    }

    if (criteria.difficulty) {
      queryConstraints.push(where("difficulty", "==", criteria.difficulty))
    }

    if (criteria.maxPrepTime) {
      queryConstraints.push(where("prepTime", "<=", criteria.maxPrepTime))
    }

    if (criteria.maxCookTime) {
      queryConstraints.push(where("cookTime", "<=", criteria.maxCookTime))
    }

    // Create and execute query
    const recipesRef = collection(db, "recipes")
    const q = query(recipesRef, ...queryConstraints, limit(limitCount))
    const querySnapshot = await getDocs(q)

    const recipes: Recipe[] = []
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() } as Recipe)
    })

    // Apply additional filtering that can't be done with Firestore queries
    return recipes.filter((recipe) => {
      // Filter by calorie range
      if (criteria.minCalories && recipe.calories < criteria.minCalories) {
        return false
      }
      if (criteria.maxCalories && recipe.calories > criteria.maxCalories) {
        return false
      }

      // Filter by medical conditions
      if (criteria.medicalConditions && criteria.medicalConditions.length > 0) {
        for (const condition of criteria.medicalConditions) {
          if (condition !== "none" && recipe.medicalConditionsUnsafe.includes(condition)) {
            return false
          }
        }
      }

      // Filter by allergies
      if (criteria.allergies && criteria.allergies.length > 0) {
        for (const allergen of criteria.allergies) {
          if (recipe.allergens.some((a) => a.toLowerCase().includes(allergen.toLowerCase()))) {
            return false
          }
        }
      }

      return true
    })
  } catch (error) {
    console.error("Error getting recipes:", error)
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
 * Get a recipe by ID
 * @param id The ID of the recipe to get
 * @returns The recipe
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const docRef = doc(db, "recipes", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Recipe
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting recipe:", error)
    throw error
  }
}

/**
 * Get easy-to-make breakfast templates for Indian vegetarian diet
 * @returns Array of easy breakfast templates
 */
export async function getEasyIndianBreakfastTemplates(): Promise<MealTemplate[]> {
  try {
    const templates = await getMealTemplates({
      mealType: "Breakfast",
      dietPreference: "indian-vegetarian",
      difficulty: "easy",
      maxPrepTime: 20, // 20 minutes or less
      limitCount: 10,
    })

    return templates
  } catch (error) {
    console.error("Error getting easy Indian breakfast templates:", error)
    return []
  }
}
