/**
 * IFCT Data Import Script
 *
 * This script helps import IFCT data into Firestore.
 * You can run this script locally to populate your Firestore database.
 *
 * Usage:
 * 1. Prepare your IFCT data in a JSON file
 * 2. Update the file path in this script
 * 3. Run the script with Node.js
 */

import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore"
import fs from "fs"
import path from "path"
import type { IFCTFood } from "../lib/firestore-schema"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Path to your IFCT data JSON file
const dataFilePath = path.join(__dirname, "ifct-data.json")

async function importIFCTData() {
  try {
    // Read the JSON file
    const rawData = fs.readFileSync(dataFilePath, "utf8")
    const foods: IFCTFood[] = JSON.parse(rawData)

    console.log(`Found ${foods.length} foods to import`)

    // Use batched writes for better performance
    const batchSize = 500 // Firestore allows max 500 operations per batch
    let operationsCount = 0
    let batch = writeBatch(db)

    for (const food of foods) {
      // Add keywords if not present
      if (!food.keywords) {
        food.keywords = generateKeywords(food)
      }

      // Add timestamps if not present
      if (!food.createdAt) {
        food.createdAt = new Date().toISOString()
      }
      if (!food.updatedAt) {
        food.updatedAt = new Date().toISOString()
      }

      // Add to batch
      const foodRef = doc(collection(db, "ifct_foods"), food.id)
      batch.set(foodRef, food)
      operationsCount++

      // Commit batch when it reaches the limit
      if (operationsCount >= batchSize) {
        await batch.commit()
        console.log(`Imported ${operationsCount} foods`)
        batch = writeBatch(db)
        operationsCount = 0
      }
    }

    // Commit any remaining operations
    if (operationsCount > 0) {
      await batch.commit()
      console.log(`Imported remaining ${operationsCount} foods`)
    }

    console.log("IFCT data import completed successfully")
  } catch (error) {
    console.error("Error importing IFCT data:", error)
  }
}

// Helper function to generate keywords for search
function generateKeywords(food: IFCTFood): string[] {
  const keywords = new Set<string>()

  // Add name words
  food.name
    .toLowerCase()
    .split(" ")
    .forEach((word) => {
      if (word.length > 2) keywords.add(word)
    })

  // Add category
  keywords.add(food.category.toLowerCase())

  // Add region if available
  if (food.region) {
    keywords.add(food.region.toLowerCase())
  }

  // Add dietary keywords
  if (food.isVegetarian) keywords.add("vegetarian")
  if (food.isVegan) keywords.add("vegan")
  if (food.containsGluten === false) keywords.add("gluten-free")

  return Array.from(keywords)
}

// Run the import
importIFCTData()
