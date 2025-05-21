/**
 * Food Database Export Script
 *
 * This script exports the food database from Firestore to a JSON file.
 * This can be useful for backup purposes or for transferring data between environments.
 *
 * Usage:
 * 1. Set up your Firebase credentials in your environment
 * 2. Run this script with: npx ts-node scripts/export-food-database.ts
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

async function exportFoodDatabase() {
  try {
    console.log("Starting food database export...")

    // Export IFCT foods
    const ifctSnapshot = await db.collection("ifct_foods").get()
    const ifctFoods = ifctSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Found ${ifctFoods.length} IFCT food items`)

    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, "../exports")
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir)
    }

    // Write to file
    const exportPath = path.join(exportDir, `food-database-export-${new Date().toISOString().split("T")[0]}.json`)
    fs.writeFileSync(exportPath, JSON.stringify(ifctFoods, null, 2))

    console.log(`Successfully exported food database to ${exportPath}`)
    return ifctFoods.length
  } catch (error) {
    console.error("Error exporting food database:", error)
    throw error
  }
}

// Execute the function
exportFoodDatabase()
  .then((count) => {
    console.log(`Exported ${count} food items successfully.`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Export failed:", error)
    process.exit(1)
  })
