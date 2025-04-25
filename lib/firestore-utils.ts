import { collection, query, where, getDocs, limit, collectionGroup } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Function to search for foods across all sources (IFCT, USDA, custom)
export async function searchAllFoodSources(searchTerm: string, maxResults = 20) {
  const results: any[] = []
  const term = searchTerm.toLowerCase()

  try {
    // Search in IFCT foods
    const ifctFoodsRef = collection(db, "ifct_foods")
    const ifctQuery = query(ifctFoodsRef, where("keywords", "array-contains", term), limit(Math.floor(maxResults / 2)))

    const ifctSnapshot = await getDocs(ifctQuery)

    ifctSnapshot.forEach((doc) => {
      const data = doc.data()
      results.push({
        id: doc.id,
        name: data.name || "Unknown Food",
        source: "ifct",
        nutrients: data.nutrients || {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
      })
    })

    // Search in custom foods
    const customFoodsRef = collectionGroup(db, "foodDatabase")
    const customQuery = query(customFoodsRef, limit(Math.floor(maxResults / 4)))
    const customSnapshot = await getDocs(customQuery)

    customSnapshot.forEach((doc) => {
      const data = doc.data()
      const foodName = data.name || data.foodName || ""

      // Only include if it matches the search term
      if (foodName.toLowerCase().includes(term)) {
        results.push({
          id: doc.id,
          name: foodName,
          source: "custom",
          nutrients: {
            calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
            protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
            carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
            fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
          },
        })
      }
    })

    // If we have fewer than maxResults, try to search USDA via our API
    if (results.length < maxResults) {
      try {
        const response = await fetch(`/api/food-search?action=search&query=${encodeURIComponent(term)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.foods && data.foods.length > 0) {
            const remainingSlots = maxResults - results.length

            data.foods.slice(0, remainingSlots).forEach((food: any) => {
              // Extract nutrients
              const nutrients = food.foodNutrients || []
              const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
              const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
              const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0
              const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0

              results.push({
                id: food.fdcId,
                name: food.description || "Unknown Food",
                source: "usda",
                nutrients: {
                  calories,
                  protein,
                  carbs,
                  fat,
                },
              })
            })
          }
        }
      } catch (error) {
        console.error("Error searching USDA foods:", error)
      }
    }

    return results
  } catch (error) {
    console.error("Error searching foods:", error)
    return []
  }
}

// Function to get foods for meal type from all sources
export async function getFoodsForMealTypeFromAllSources(
  mealType: string,
  dietPreference: string,
  allergyList: string[] = [],
) {
  try {
    const results: any[] = []

    // Fetch custom foods from foodDatabase collection
    const foodDbRef = collectionGroup(db, "foodDatabase")
    const foodDbSnapshot = await getDocs(foodDbRef)

    foodDbSnapshot.forEach((doc) => {
      const data = doc.data()
      const foodName = data.name || data.foodName || ""
      const category = (data.category || data.foodCategory || "").toLowerCase()

      // Check if the food matches the meal type and diet preference
      const matchesMealType =
        category.includes(mealType.toLowerCase()) ||
        (mealType === "Breakfast" && category.includes("breakfast")) ||
        (mealType === "Lunch" && category.includes("lunch")) ||
        (mealType === "Dinner" && category.includes("dinner")) ||
        (mealType === "Snack" && category.includes("snack"))

      // Check if the food matches the diet preference
      const matchesDietPreference =
        dietPreference === "non-veg" || // non-veg can eat anything
        (dietPreference === "vegetarian" && data.isVegetarian) ||
        (dietPreference === "vegan" && data.isVegan) ||
        (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
        (dietPreference === "gluten-free" && !data.containsGluten) ||
        (dietPreference === "jain-diet" && !data.containsOnionGarlic && !data.containsRootVegetables)

      // Check if the food contains any allergens
      const hasNoAllergies = !allergyList.some(
        (allergy) =>
          foodName.toLowerCase().includes(allergy) ||
          (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
      )

      if (matchesMealType && matchesDietPreference && hasNoAllergies) {
        results.push({
          id: doc.id,
          name: foodName,
          description: data.description || "",
          nutrients: {
            calories: data.nutrients?.calories || data.nutritionalInfo?.calories || 0,
            protein: data.nutrients?.protein || data.nutritionalInfo?.protein || 0,
            carbohydrates: data.nutrients?.carbohydrates || data.nutritionalInfo?.carbs || 0,
            fat: data.nutrients?.fat || data.nutritionalInfo?.fat || 0,
          },
          source: "custom",
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
        })
      }
    })

    // Fetch meal templates that match the meal type
    const templatesRef = collectionGroup(db, "meal_templates")
    const templatesSnapshot = await getDocs(templatesRef)

    templatesSnapshot.forEach((doc) => {
      const data = doc.data()
      const templateName = data.name || data.templateName || ""
      const mealTypeCategory = (data.mealType || "").toLowerCase()

      // Check if the template matches the meal type
      const matchesMealType =
        mealTypeCategory.includes(mealType.toLowerCase()) ||
        (mealType === "Breakfast" && mealTypeCategory.includes("breakfast")) ||
        (mealType === "Lunch" && mealTypeCategory.includes("lunch")) ||
        (mealType === "Dinner" && mealTypeCategory.includes("dinner")) ||
        (mealType === "Snack" && mealTypeCategory.includes("snack"))

      // Check if the template matches the diet preference
      const matchesDietPreference =
        dietPreference === "non-veg" || // non-veg can eat anything
        (dietPreference === "vegetarian" && data.isVegetarian) ||
        (dietPreference === "vegan" && data.isVegan) ||
        (dietPreference === "indian-vegetarian" && data.isVegetarian) ||
        (dietPreference === "gluten-free" && !data.containsGluten)

      // Check if the template contains any allergens
      const hasNoAllergies = !allergyList.some(
        (allergy) =>
          templateName.toLowerCase().includes(allergy) ||
          (data.allergens && data.allergens.some((a: string) => a.toLowerCase().includes(allergy))),
      )

      if (matchesMealType && matchesDietPreference && hasNoAllergies) {
        results.push({
          id: doc.id,
          name: templateName,
          description: data.description || "",
          nutrients: {
            calories: data.totalNutrition?.calories || 0,
            protein: data.totalNutrition?.protein || 0,
            carbs: data.totalNutrition?.carbs || 0,
            fat: data.totalNutrition?.fat || 0,
          },
          source: "template",
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          containsGluten: data.containsGluten || false,
        })
      }
    })

    return results
  } catch (error) {
    console.error("Error fetching custom foods and templates:", error)
    return []
  }
}
