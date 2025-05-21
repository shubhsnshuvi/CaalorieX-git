/**
 * Food Nutrient Update Script
 *
 * This script updates existing food items in the database with detailed nutritional information.
 * It's useful when you want to add or update specific nutrient data for foods that already exist.
 *
 * Usage:
 * 1. Set up your Firebase credentials in your environment
 * 2. Run this script with: npx ts-node scripts/update-food-nutrients.ts
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

// Define the nutrient updates
interface NutrientUpdate {
  foodId: string
  vitamins?: Record<string, number>
  minerals?: Record<string, number>
  aminoAcids?: Record<string, number>
  fattyAcids?: Record<string, number>
}

// List of nutrient updates for specific foods
const nutrientUpdates: NutrientUpdate[] = [
  // Example: Update rice nutrients
  {
    foodId: "rice-white-cooked",
    vitamins: {
      a: 0,
      c: 0,
      d: 0,
      e: 0.1,
      k: 0,
      b1: 0.02,
      b2: 0.01,
      b3: 0.4,
      b5: 0.4,
      b6: 0.05,
      b7: 0.6,
      b9: 2,
      b12: 0,
    },
    minerals: {
      calcium: 10,
      iron: 0.2,
      magnesium: 12,
      phosphorus: 43,
      potassium: 35,
      sodium: 1,
      zinc: 0.8,
      copper: 0.1,
      manganese: 0.5,
      selenium: 7.5,
      fluoride: 8.4,
    },
  },
  // Add more updates as needed
]

async function updateFoodNutrients() {
  console.log(`Starting to update nutrients for ${nutrientUpdates.length} food items...`)

  let successCount = 0
  let errorCount = 0

  for (const update of nutrientUpdates) {
    try {
      const foodRef = db.collection("ifct_foods").doc(update.foodId)
      const foodDoc = await foodRef.get()

      if (!foodDoc.exists) {
        console.warn(`⚠️ Food with ID ${update.foodId} not found in database`)
        errorCount++
        continue
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      }

      if (update.vitamins) updateData.vitamins = update.vitamins
      if (update.minerals) updateData.minerals = update.minerals
      if (update.aminoAcids) updateData.aminoAcids = update.aminoAcids
      if (update.fattyAcids) updateData.fattyAcids = update.fattyAcids

      await foodRef.update(updateData)
      console.log(`✅ Updated nutrients for ${foodDoc.data()?.name || update.foodId}`)
      successCount++
    } catch (error) {
      console.error(`❌ Error updating nutrients for ${update.foodId}:`, error)
      errorCount++
    }
  }

  console.log(`Nutrient updates complete!`)
  console.log(`Successfully updated: ${successCount} items`)
  console.log(`Failed to update: ${errorCount} items`)
}

// Execute the function
updateFoodNutrients()
  .then(() => {
    console.log("Script execution completed.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Script execution failed:", error)
    process.exit(1)
  })
