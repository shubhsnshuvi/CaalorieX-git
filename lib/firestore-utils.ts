import { collection, collectionGroup, query, where, getDocs, limit, type QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Search for items in a collection group with multiple query constraints
 * @param collectionGroupName The name of the collection group to search
 * @param constraints Array of query constraints
 * @param limitCount Maximum number of results to return
 * @returns Array of matching documents
 */
export async function searchCollectionGroup(
  collectionGroupName: string,
  constraints: QueryConstraint[] = [],
  limitCount = 50,
) {
  try {
    const collectionRef = collectionGroup(db, collectionGroupName)
    const queryConstraints = [...constraints]

    if (limitCount > 0) {
      queryConstraints.push(limit(limitCount))
    }

    const q = query(collectionRef, ...queryConstraints)
    const querySnapshot = await getDocs(q)

    const results: any[] = []
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
        path: doc.ref.path,
      })
    })

    return results
  } catch (error) {
    console.error(`Error searching collection group ${collectionGroupName}:`, error)
    throw error
  }
}

/**
 * Search for items in a specific collection with multiple query constraints
 * @param collectionPath The path to the collection
 * @param constraints Array of query constraints
 * @param limitCount Maximum number of results to return
 * @returns Array of matching documents
 */
export async function searchCollection(collectionPath: string, constraints: QueryConstraint[] = [], limitCount = 50) {
  try {
    const collectionRef = collection(db, collectionPath)
    const queryConstraints = [...constraints]

    if (limitCount > 0) {
      queryConstraints.push(limit(limitCount))
    }

    const q = query(collectionRef, ...queryConstraints)
    const querySnapshot = await getDocs(q)

    const results: any[] = []
    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return results
  } catch (error) {
    console.error(`Error searching collection ${collectionPath}:`, error)
    throw error
  }
}

/**
 * Search for food items across all food-related collections
 * @param searchTerm The search term
 * @param limitCount Maximum number of results to return per collection
 * @returns Array of matching food items
 */
export async function searchAllFoodSources(searchTerm: string, limitCount = 20) {
  try {
    const lowerSearchTerm = searchTerm.toLowerCase()

    // Search results from each source
    const results: any[] = []

    // 1. Search IFCT foods
    try {
      const ifctFoods = await searchCollection(
        "ifct_foods",
        [where("keywords", "array-contains", lowerSearchTerm)],
        limitCount,
      )

      results.push(
        ...ifctFoods.map((food) => ({
          ...food,
          source: "ifct",
        })),
      )
    } catch (error) {
      console.error("Error searching IFCT foods:", error)
    }

    // 2. Search custom foods
    try {
      const customFoods = await searchCollectionGroup("foodDatabase", [], limitCount * 2)

      // Filter by search term manually since we can't use array-contains on collection groups
      const filteredCustomFoods = customFoods
        .filter((food) => {
          const name = (food.name || food.foodName || "").toLowerCase()
          const category = (food.category || food.foodCategory || "").toLowerCase()
          const description = (food.description || "").toLowerCase()

          return (
            name.includes(lowerSearchTerm) ||
            category.includes(lowerSearchTerm) ||
            description.includes(lowerSearchTerm)
          )
        })
        .slice(0, limitCount)

      results.push(
        ...filteredCustomFoods.map((food) => ({
          ...food,
          source: "custom",
        })),
      )
    } catch (error) {
      console.error("Error searching custom foods:", error)
    }

    // 3. Search meal templates
    try {
      const mealTemplates = await searchCollectionGroup("meal_templates", [], limitCount * 2)

      // Filter by search term manually
      const filteredTemplates = mealTemplates
        .filter((template) => {
          const name = (template.name || template.templateName || "").toLowerCase()
          const category = (template.category || template.mealType || "").toLowerCase()
          const description = (template.description || "").toLowerCase()

          return (
            name.includes(lowerSearchTerm) ||
            category.includes(lowerSearchTerm) ||
            description.includes(lowerSearchTerm)
          )
        })
        .slice(0, limitCount)

      results.push(
        ...filteredTemplates.map((template) => ({
          ...template,
          source: "template",
        })),
      )
    } catch (error) {
      console.error("Error searching meal templates:", error)
    }

    return results
  } catch (error) {
    console.error("Error searching all food sources:", error)
    return []
  }
}

/**
 * Get food items for a specific meal type from all sources
 * @param mealType The meal type (Breakfast, Lunch, Dinner, Snack)
 * @param dietPreference The diet preference
 * @param allergyList List of allergens to exclude
 * @returns Array of suitable food items
 */
export async function getFoodsForMealTypeFromAllSources(
  mealType: string,
  dietPreference: string,
  allergyList: string[] = [],
) {
  try {
    const results: any[] = []

    // 1. Get foods from IFCT
    try {
      const ifctFoods = await searchCollection("ifct_foods", [limit(50)])

      // Filter foods based on meal type, diet preference, and allergies
      const filteredIFCTFoods = ifctFoods.filter((food) => {
        const category = (food.category || "").toLowerCase()
        const name = (food.name || "").toLowerCase()

        // Check if matches meal type
        const matchesMealType =
          category.includes(mealType.toLowerCase()) ||
          (mealType === "Breakfast" && category.includes("breakfast")) ||
          (mealType === "Lunch" && category.includes("lunch")) ||
          (mealType === "Dinner" && category.includes("dinner")) ||
          (mealType === "Snack" && category.includes("snack"))

        // Check if matches diet preference
        const matchesDietPreference =
          dietPreference === "non-veg" || // non-veg can eat anything
          (dietPreference === "vegetarian" && food.isVegetarian) ||
          (dietPreference === "vegan" && food.isVegan) ||
          (dietPreference === "indian-vegetarian" && food.isVegetarian) ||
          (dietPreference === "gluten-free" && !food.containsGluten) ||
          (dietPreference === "jain-diet" && !food.containsOnionGarlic && !food.containsRootVegetables)

        // Check if contains allergens
        const hasNoAllergies = !allergyList.some((allergy) => name.includes(allergy))

        return matchesMealType && matchesDietPreference && hasNoAllergies
      })

      results.push(
        ...filteredIFCTFoods.map((food) => ({
          ...food,
          source: "ifct",
        })),
      )
    } catch (error) {
      console.error("Error getting IFCT foods for meal type:", error)
    }

    // 2. Get custom foods
    try {
      const customFoods = await searchCollectionGroup("foodDatabase", [], 100)

      // Filter foods based on meal type, diet preference, and allergies
      const filteredCustomFoods = customFoods.filter((food) => {
        const category = (food.category || food.foodCategory || "").toLowerCase()
        const name = (food.name || food.foodName || "").toLowerCase()

        // Check if matches meal type
        const matchesMealType =
          category.includes(mealType.toLowerCase()) ||
          (mealType === "Breakfast" && category.includes("breakfast")) ||
          (mealType === "Lunch" && category.includes("lunch")) ||
          (mealType === "Dinner" && category.includes("dinner")) ||
          (mealType === "Snack" && category.includes("snack"))

        // Check if matches diet preference
        const matchesDietPreference =
          dietPreference === "non-veg" || // non-veg can eat anything
          (dietPreference === "vegetarian" && food.isVegetarian) ||
          (dietPreference === "vegan" && food.isVegan) ||
          (dietPreference === "indian-vegetarian" && food.isVegetarian) ||
          (dietPreference === "gluten-free" && !food.containsGluten) ||
          (dietPreference === "jain-diet" && !food.containsOnionGarlic && !food.containsRootVegetables)

        // Check if contains allergens
        const hasNoAllergies = !allergyList.some(
          (allergy) =>
            name.includes(allergy) ||
            (food.allergens && food.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
        )

        return matchesMealType && matchesDietPreference && hasNoAllergies
      })

      results.push(
        ...filteredCustomFoods.map((food) => ({
          ...food,
          source: "custom",
        })),
      )
    } catch (error) {
      console.error("Error getting custom foods for meal type:", error)
    }

    // 3. Get meal templates
    try {
      const mealTemplates = await searchCollectionGroup("meal_templates", [], 100)

      // Filter templates based on meal type, diet preference, and allergies
      const filteredTemplates = mealTemplates.filter((template) => {
        const mealTypeCategory = (template.mealType || template.category || "").toLowerCase()
        const name = (template.name || template.templateName || "").toLowerCase()

        // Check if matches meal type
        const matchesMealType =
          mealTypeCategory.includes(mealType.toLowerCase()) ||
          (mealType === "Breakfast" && mealTypeCategory.includes("breakfast")) ||
          (mealType === "Lunch" && mealTypeCategory.includes("lunch")) ||
          (mealType === "Dinner" && mealTypeCategory.includes("dinner")) ||
          (mealType === "Snack" && mealTypeCategory.includes("snack"))

        // Check if matches diet preference
        const matchesDietPreference =
          dietPreference === "non-veg" || // non-veg can eat anything
          (dietPreference === "vegetarian" && template.isVegetarian) ||
          (dietPreference === "vegan" && template.isVegan) ||
          (dietPreference === "indian-vegetarian" && template.isVegetarian) ||
          (dietPreference === "gluten-free" && !template.containsGluten)

        // Check if contains allergens
        const hasNoAllergies = !allergyList.some(
          (allergy) =>
            name.includes(allergy) ||
            (template.allergens && template.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
        )

        return matchesMealType && matchesDietPreference && hasNoAllergies
      })

      results.push(
        ...filteredTemplates.map((template) => ({
          ...template,
          source: "template",
        })),
      )
    } catch (error) {
      console.error("Error getting meal templates for meal type:", error)
    }

    return results
  } catch (error) {
    console.error("Error getting foods for meal type from all sources:", error)
    return []
  }
}
