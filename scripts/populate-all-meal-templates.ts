import { populateIndianMealTemplates } from "./populate-indian-meal-templates"
import { populateMoreIndianMealTemplates } from "./populate-more-indian-meal-templates"

async function populateAllMealTemplates() {
  try {
    console.log("Starting to populate all meal templates...")

    // Run the original Indian meal templates script
    await populateIndianMealTemplates()

    // Run the additional Indian meal templates script
    await populateMoreIndianMealTemplates()

    console.log("Successfully populated all meal templates!")
  } catch (error) {
    console.error("Error populating all meal templates:", error)
  }
}

// Run the function
populateAllMealTemplates()
