import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore"

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

async function getNccdbStats() {
  try {
    console.log("Fetching NCCDB database statistics...")

    // Get total count
    const nccdbRef = collection(db, "nccdb_foods")
    const snapshot = await getDocs(nccdbRef)
    const totalCount = snapshot.size

    console.log(`Total NCCDB food items: ${totalCount}`)

    // Get sample items
    const sampleQuery = query(nccdbRef, limit(5))
    const sampleSnapshot = await getDocs(sampleQuery)

    console.log("\nSample NCCDB food items:")
    sampleSnapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`- ${data.name} (${data.category}) - ${data.cuisine} cuisine from ${data.region}`)
      console.log(
        `  Calories: ${data.nutrients.calories}, Protein: ${data.nutrients.protein}g, Carbs: ${data.nutrients.carbohydrates}g, Fat: ${data.nutrients.fat}g`,
      )
      console.log(`  Keywords: ${data.keywords.join(", ")}`)
      console.log()
    })

    // Get category distribution
    const categories = new Map()
    snapshot.forEach((doc) => {
      const category = doc.data().category
      categories.set(category, (categories.get(category) || 0) + 1)
    })

    console.log("\nCategory distribution:")
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`- ${category}: ${count} items (${((count / totalCount) * 100).toFixed(1)}%)`)
      })

    // Get cuisine distribution
    const cuisines = new Map()
    snapshot.forEach((doc) => {
      const cuisine = doc.data().cuisine
      cuisines.set(cuisine, (cuisines.get(cuisine) || 0) + 1)
    })

    console.log("\nCuisine distribution:")
    Array.from(cuisines.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cuisine, count]) => {
        console.log(`- ${cuisine}: ${count} items (${((count / totalCount) * 100).toFixed(1)}%)`)
      })

    // Get vegetarian/vegan stats
    let vegCount = 0
    let veganCount = 0
    let glutenFreeCount = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.isVegetarian) vegCount++
      if (data.isVegan) veganCount++
      if (!data.containsGluten) glutenFreeCount++
    })

    console.log("\nDietary statistics:")
    console.log(`- Vegetarian: ${vegCount} items (${((vegCount / totalCount) * 100).toFixed(1)}%)`)
    console.log(`- Vegan: ${veganCount} items (${((veganCount / totalCount) * 100).toFixed(1)}%)`)
    console.log(`- Gluten-free: ${glutenFreeCount} items (${((glutenFreeCount / totalCount) * 100).toFixed(1)}%)`)
  } catch (error) {
    console.error("Error getting NCCDB stats:", error)
  }
}

// Run the stats function
getNccdbStats()
  .then(() => {
    console.log("\nNCCDB statistics fetched successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to fetch NCCDB statistics:", error)
    process.exit(1)
  })
