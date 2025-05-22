/**
 * This script diagnoses and fixes issues in the Firestore database
 * related to food items and meal tracking.
 */

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
  ? {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }
  : require("../serviceAccountKey.json")

initializeApp({
  credential: cert(serviceAccount as any),
})

const db = getFirestore()

// Function to check and fix missing fields in food items
async function checkAndFixFoodItems() {
  console.log("Checking food items for missing fields...")

  const foodsRef = db.collection("ifct_foods")
  const snapshot = await foodsRef.get()

  let fixedCount = 0
  let totalCount = 0

  for (const doc of snapshot.docs) {
    totalCount++
    const data = doc.data()
    let needsUpdate = false
    const updates: any = {}

    // Check for missing nutrients
    if (!data.nutrients) {
      updates.nutrients = {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      }
      needsUpdate = true
    } else {
      // Check for missing nutrient fields
      const nutrients = data.nutrients
      const requiredNutrients = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium"]

      for (const nutrient of requiredNutrients) {
        if (nutrients[nutrient] === undefined) {
          if (!updates.nutrients) updates.nutrients = { ...nutrients }
          updates.nutrients[nutrient] = 0
          needsUpdate = true
        }
      }
    }

    // Check for missing keywords
    if (!data.keywords || !Array.isArray(data.keywords) || data.keywords.length === 0) {
      // Generate keywords from name and category
      const keywords = new Set<string>()

      if (data.name) {
        data.name
          .toLowerCase()
          .split(/\s+/)
          .forEach((word: string) => {
            if (word.length > 2) keywords.add(word)
          })
      }

      if (data.category) {
        keywords.add(data.category.toLowerCase())
      }

      if (data.isVegetarian) keywords.add("vegetarian")
      if (data.isVegan) keywords.add("vegan")

      updates.keywords = Array.from(keywords)
      needsUpdate = true
    }

    // Check for missing boolean fields
    const booleanFields = ["isVegetarian", "isVegan", "containsGluten"]
    for (const field of booleanFields) {
      if (data[field] === undefined) {
        updates[field] = false
        needsUpdate = true
      }
    }

    // Update the document if needed
    if (needsUpdate) {
      await foodsRef.doc(doc.id).update(updates)
      fixedCount++
    }
  }

  console.log(`Fixed ${fixedCount} out of ${totalCount} food items.`)
}

// Function to check and fix meal logs
async function checkAndFixMealLogs() {
  console.log("Checking meal logs for issues...")

  const usersRef = db.collection("users")
  const usersSnapshot = await usersRef.get()

  let fixedCount = 0
  let totalCount = 0

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id
    const mealLogsRef = db.collection(`users/${userId}/mealLogs`)
    const mealLogsSnapshot = await mealLogsRef.get()

    for (const mealLogDoc of mealLogsSnapshot.docs) {
      totalCount++
      const mealLog = mealLogDoc.data()
      let needsUpdate = false
      const updates: any = {}

      // Check for missing meals
      if (!mealLog.meals || !Array.isArray(mealLog.meals)) {
        updates.meals = [
          { mealType: "Breakfast", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
          { mealType: "Lunch", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
          { mealType: "Dinner", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
          { mealType: "Snack", foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
        ]
        needsUpdate = true
      } else {
        // Check for missing meal types
        const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"]
        const existingMealTypes = mealLog.meals.map((meal: any) => meal.mealType)

        for (const mealType of mealTypes) {
          if (!existingMealTypes.includes(mealType)) {
            updates.meals = [
              ...mealLog.meals,
              {
                mealType,
                foods: [],
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
              },
            ]
            needsUpdate = true
          }
        }
      }

      // Check for missing nutrition goals
      const nutritionGoals = ["calorieGoal", "proteinGoal", "carbsGoal", "fatGoal"]
      const defaultValues = [2000, 150, 225, 67]

      for (let i = 0; i < nutritionGoals.length; i++) {
        const goal = nutritionGoals[i]
        if (mealLog[goal] === undefined) {
          updates[goal] = defaultValues[i]
          needsUpdate = true
        }
      }

      // Check for missing totals
      const totals = ["totalCalories", "totalProtein", "totalCarbs", "totalFat"]

      for (const total of totals) {
        if (mealLog[total] === undefined) {
          // Calculate from meals
          if (mealLog.meals && Array.isArray(mealLog.meals)) {
            updates[total] = mealLog.meals.reduce((sum: number, meal: any) => sum + (meal[total] || 0), 0)
          } else {
            updates[total] = 0
          }
          needsUpdate = true
        }
      }

      // Update the document if needed
      if (needsUpdate) {
        await mealLogsRef.doc(mealLogDoc.id).update(updates)
        fixedCount++
      }
    }
  }

  console.log(`Fixed ${fixedCount} out of ${totalCount} meal logs.`)
}

// Main function to run the script
async function main() {
  try {
    console.log("Starting database diagnosis and fix script...")

    // Check and fix food items
    await checkAndFixFoodItems()

    // Check and fix meal logs
    await checkAndFixMealLogs()

    console.log("Script completed successfully!")
  } catch (error) {
    console.error("Error running script:", error)
  }
}

// Run the script
main()
