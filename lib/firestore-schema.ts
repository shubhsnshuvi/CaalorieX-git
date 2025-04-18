/**
 * Firestore Schema for IFCT Foods Collection
 *
 * This is a reference for the expected structure of documents in the 'ifct_foods' collection.
 * You can use this as a guide when populating your Firestore database.
 */

interface IFCTFood {
  // Basic information
  id: string // Unique identifier
  name: string // Food name
  description?: string // Detailed description
  category: string // Food category (e.g., "Rice", "Bread", "Curry")
  region?: string // Region of origin (e.g., "North Indian", "South Indian")

  // Dietary information
  isVegetarian: boolean // Is the food vegetarian?
  isVegan: boolean // Is the food vegan?
  containsGluten?: boolean // Does the food contain gluten?
  containsOnionGarlic?: boolean // Does the food contain onion or garlic? (for Jain diet)
  containsRootVegetables?: boolean // Does the food contain root vegetables? (for Jain diet)

  // Nutritional information (per 100g)
  nutrients: {
    calories: number // Energy in kcal
    protein: number // Protein in grams
    carbohydrates: number // Carbohydrates in grams
    fat: number // Fat in grams
    fiber?: number // Dietary fiber in grams
    sugar?: number // Sugar in grams
    sodium?: number // Sodium in milligrams
    calcium?: number // Calcium in milligrams
    iron?: number // Iron in milligrams
    vitaminA?: number // Vitamin A in micrograms
    vitaminC?: number // Vitamin C in milligrams
  }

  // Serving information
  standardPortion?: {
    amount: number // Amount in the unit specified
    unit: string // Unit of measurement (e.g., "g", "ml", "piece")
    description?: string // Human-readable description (e.g., "1 cup", "2 pieces")
  }

  // Search optimization
  keywords: string[] // Keywords for searching

  // Metadata
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  source?: string // Source of the data
}

/**
 * Example IFCT Food Document
 */
const exampleIFCTFood: IFCTFood = {
  id: "idli-001",
  name: "Idli",
  description: "Steamed rice cake, a popular South Indian breakfast item",
  category: "Breakfast",
  region: "South Indian",

  isVegetarian: true,
  isVegan: true,
  containsGluten: false,
  containsOnionGarlic: false,
  containsRootVegetables: false,

  nutrients: {
    calories: 39,
    protein: 2,
    carbohydrates: 8,
    fat: 0.1,
    fiber: 0.2,
    sodium: 0,
    calcium: 10,
    iron: 0.5,
  },

  standardPortion: {
    amount: 40,
    unit: "g",
    description: "1 piece",
  },

  keywords: ["idli", "breakfast", "south indian", "rice cake", "steamed", "vegetarian", "vegan"],

  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  source: "IFCT 2017",
}

export type { IFCTFood }
export { exampleIFCTFood }
