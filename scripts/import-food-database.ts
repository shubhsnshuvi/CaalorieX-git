/**
 * Food Database Import Script
 *
 * This script imports a food database JSON file into Firestore.
 * This can be useful for restoring from a backup or transferring data between environments.
 *
 * Usage:
 * 1. Set up your Firebase credentials in your environment
 * 2. Place your JSON export file in the exports directory
 * 3. Run this script with: npx ts-node scripts/import-food-database.ts <filename>
 */

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import * as fs from "fs"
import * as path from "path"

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

async function importFoodDatabase(filename: string) {
  try {
    console.log("Starting food database import...")

    // Get the file path
    const importDir = path.join(__dirname, "../exports")
    const filePath = path.join(importDir, filename)

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    // Read the file
    const fileData = fs.readFileSync(filePath, "utf8")
    const foods = JSON.parse(fileData)

    console.log(`Found ${foods.length} food items to import`)

    // Process in batches to avoid rate limiting
    const batchSize = 20
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize)
      const promises = batch.map(async (food: any) => {
        try {
          // Add to ifct_foods collection
          await db.collection("ifct_foods").doc(food.id).set(food)
          console.log(`✅ Imported ${food.name}`)
          successCount++
          return true
        } catch (error) {
          console.error(`❌ Error importing ${food.name}:`, error)
          errorCount++
          return false
        }
      })

      await Promise.all(promises)
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(foods.length / batchSize)}`)
    }

    console.log(`Import complete!`)
    console.log(`Successfully imported: ${successCount} items`)
    console.log(`Failed to import: ${errorCount} items`)

    return successCount
  } catch (error) {
    console.error("Error importing food database:", error)
    throw error
  }
}

// Get filename from command line arguments
const filename = process.argv[2]
if (!filename) {
  console.error("Please provide a filename to import")
  process.exit(1)
}

// Execute the function
importFoodDatabase(filename)
  .then((count) => {
    console.log(`Imported ${count} food items successfully.`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Import failed:", error)
    process.exit(1)
  })
