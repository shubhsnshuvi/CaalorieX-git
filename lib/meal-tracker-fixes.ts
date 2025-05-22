/**
 * This file contains fixes and improvements for the meal tracker functionality
 * in the CalorieX application.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Enhanced function to fetch a user's meal log with better error handling
 * @param userId User ID
 * @param dateString Date string in format 'yyyy-MM-dd'
 * @returns Meal log for the specified date or null if not found
 */
export async function fetchUserMealLog(userId: string, dateString: string) {
  if (!userId || !dateString) {
    console.error("Missing required parameters: userId or dateString")
    return null
  }

  try {
    const mealLogsRef = collection(db, "users", userId, "mealLogs")
    const q = query(mealLogsRef, where("date", "==", dateString))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data()
      return {
        ...docData,
        id: querySnapshot.docs[0].id,
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching meal log:", error)
    throw error
  }
}

/**
 * Create a new meal log for a user
 * @param userId User ID
 * @param dateString Date string in format 'yyyy-MM-dd'
 * @param nutritionGoals User's nutrition goals
 * @returns Newly created meal log
 */
export async function createMealLog(userId: string, dateString: string, nutritionGoals: any) {
  if (!userId || !dateString) {
    console.error("Missing required parameters: userId or dateString")
    throw new Error("Missing required parameters")
  }

  try {
    const newMealLog = {
      date: dateString,
      meals: [
        { mealType: "Breakfast", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
        { mealType: "Lunch", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
        { mealType: "Dinner", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
        { mealType: "Snack", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
      ],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      calorieGoal: nutritionGoals?.calorieGoal || 2000,
      proteinGoal: nutritionGoals?.proteinGoal || 150,
      carbsGoal: nutritionGoals?.carbsGoal || 225,
      fatGoal: nutritionGoals?.fatGoal || 67,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const mealLogsRef = collection(db, "users", userId, "mealLogs")
    const docRef = await addDoc(mealLogsRef, newMealLog)

    return {
      ...newMealLog,
      id: docRef.id,
    }
  } catch (error) {
    console.error("Error creating meal log:", error)
    throw error
  }
}

/**
 * Add a food item to a meal in the user's meal log
 * @param userId User ID
 * @param mealLogId Meal log ID
 * @param mealType Meal type (Breakfast, Lunch, Dinner, Snack)
 * @param food Food item to add
 * @returns Updated meal log
 */
export async function addFoodToMeal(userId: string, mealLogId: string, mealType: string, food: any) {
  if (!userId || !mealLogId || !mealType || !food) {
    console.error("Missing required parameters")
    throw new Error("Missing required parameters")
  }

  try {
    // Get the current meal log
    const mealLogRef = doc(db, "users", userId, "mealLogs", mealLogId)
    const mealLogDoc = await getDoc(mealLogRef)

    if (!mealLogDoc.exists()) {
      throw new Error("Meal log not found")
    }

    const mealLog = mealLogDoc.data()

    // Find the meal to update
    const updatedMeals = mealLog.meals.map((meal: any) => {
      if (meal.mealType === mealType) {
        // Add food to this meal
        const updatedFoods = [...meal.foods, food]

        // Recalculate meal totals
        const totalCalories = updatedFoods.reduce((sum: number, f: any) => sum + (f.calories || 0), 0)
        const totalProtein = updatedFoods.reduce((sum: number, f: any) => sum + (f.protein || 0), 0)
        const totalCarbs = updatedFoods.reduce((sum: number, f: any) => sum + (f.carbs || 0), 0)
        const totalFat = updatedFoods.reduce((sum: number, f: any) => sum + (f.fat || 0), 0)

        return {
          ...meal,
          foods: updatedFoods,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
        }
      }
      return meal
    })

    // Recalculate daily totals
    const totalCalories = updatedMeals.reduce((sum: number, meal: any) => sum + meal.totalCalories, 0)
    const totalProtein = updatedMeals.reduce((sum: number, meal: any) => sum + meal.totalProtein, 0)
    const totalCarbs = updatedMeals.reduce((sum: number, meal: any) => sum + meal.totalCarbs, 0)
    const totalFat = updatedMeals.reduce((sum: number, meal: any) => sum + meal.totalFat, 0)

    const updatedMealLog = {
      ...mealLog,
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      updatedAt: serverTimestamp(),
    }

    // Update the meal log in Firestore
    await updateDoc(mealLogRef, updatedMealLog)

    // Add to recent foods
    try {
      const recentFoodsRef = collection(db, "users", userId, "recentFoods")
      await addDoc(recentFoodsRef, {
        ...food,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error("Error adding to recent foods:", error)
      // Continue even if adding to recent foods fails
    }

    return {
      ...updatedMealLog,
      id: mealLogId,
    }
  } catch (error) {
    console.error("Error adding food to meal:", error)
    throw error
  }
}

/**
 * Fetch user's recent foods with better error handling
 * @param userId User ID
 * @param maxResults Maximum number of results to return
 * @returns Array of recent foods
 */
export async function fetchRecentFoods(userId: string, maxResults = 5) {
  if (!userId) {
    console.error("Missing required parameter: userId")
    return []
  }

  try {
    const recentFoodsRef = collection(db, "users", userId, "recentFoods")
    const q = query(recentFoodsRef, orderBy("timestamp", "desc"), limit(maxResults))
    const querySnapshot = await getDocs(q)

    const recentFoods: any[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      recentFoods.push({
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
        timestamp: data.timestamp?.toDate() || new Date(),
      })
    })

    return recentFoods
  } catch (error) {
    console.error("Error fetching recent foods:", error)
    return []
  }
}

/**
 * Fetch user's favorite foods with better error handling
 * @param userId User ID
 * @param maxResults Maximum number of results to return
 * @returns Array of favorite foods
 */
export async function fetchFavoriteFoods(userId: string, maxResults = 5) {
  if (!userId) {
    console.error("Missing required parameter: userId")
    return []
  }

  try {
    const favoriteFoodsRef = collection(db, "users", userId, "favoriteFoods")
    const q = query(favoriteFoodsRef, limit(maxResults))
    const querySnapshot = await getDocs(q)

    const favoriteFoods: any[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      favoriteFoods.push({
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
        timestamp: data.timestamp?.toDate() || new Date(),
      })
    })

    return favoriteFoods
  } catch (error) {
    console.error("Error fetching favorite foods:", error)
    return []
  }
}
