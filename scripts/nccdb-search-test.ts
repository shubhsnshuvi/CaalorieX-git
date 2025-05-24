import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore"
import * as readline from "readline"

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Function to search NCCDB foods
async function searchNccdbFoods(searchTerm: string) {
  try {
    console.log(`\nSearching for "${searchTerm}" in NCCDB foods...`)

    // Search by keyword
    const keywordQuery = query(
      collection(db, "nccdb_foods"),
      where("keywords", "array-contains", searchTerm.toLowerCase()),
      limit(10),
    )

    const keywordSnapshot = await getDocs(keywordQuery)

    if (keywordSnapshot.empty) {
      console.log("No exact keyword matches found. Trying partial name match...")

      // Get all foods and filter by name (not efficient for production, but works for testing)
      const allFoodsQuery = query(collection(db, "nccdb_foods"), limit(1000))
      const allFoodsSnapshot = await getDocs(allFoodsQuery)

      const results = []
      allFoodsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(data)
        }
      })

      if (results.length === 0) {
        console.log("No results found.")
      } else {
        console.log(`Found ${results.length} results with partial name match:`)
        results.slice(0, 10).forEach((food, index) => {
          console.log(`\n${index + 1}. ${food.name} (${food.category})`)
          console.log(`   Cuisine: ${food.cuisine}, Region: ${food.region}`)
          console.log(
            `   Calories: ${food.nutrients.calories}, Protein: ${food.nutrients.protein}g, Carbs: ${food.nutrients.carbohydrates}g, Fat: ${food.nutrients.fat}g`,
          )
          console.log(`   Keywords: ${food.keywords.join(", ")}`)
        })

        if (results.length > 10) {
          console.log(`\n...and ${results.length - 10} more results.`)
        }
      }
    } else {
      console.log(`Found ${keywordSnapshot.size} results with exact keyword match:`)
      keywordSnapshot.forEach((doc, index) => {
        const food = doc.data()
        console.log(`\n${index + 1}. ${food.name} (${food.category})`)
        console.log(`   Cuisine: ${food.cuisine}, Region: ${food.region}`)
        console.log(
          `   Calories: ${food.nutrients.calories}, Protein: ${food.nutrients.protein}g, Carbs: ${food.nutrients.carbohydrates}g, Fat: ${food.nutrients.fat}g`,
        )
        console.log(`   Keywords: ${food.keywords.join(", ")}`)
      })
    }
  } catch (error) {
    console.error("Error searching NCCDB foods:", error)
  }
}

// Interactive search function
function startInteractiveSearch() {
  rl.question('\nEnter a food to search for (or "exit" to quit): ', async (answer) => {
    if (answer.toLowerCase() === "exit") {
      rl.close()
      process.exit(0)
    } else {
      await searchNccdbFoods(answer)
      startInteractiveSearch()
    }
  })
}

// Start the interactive search
console.log("NCCDB Food Search Test")
console.log("=====================")
console.log("This tool allows you to test searching the NCCDB food database.")
startInteractiveSearch()
