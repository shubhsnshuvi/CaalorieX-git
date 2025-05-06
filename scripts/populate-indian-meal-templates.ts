import { saveMealTemplate, type MealTemplate } from "../lib/meal-templates-firestore"

// Easy Indian breakfast templates
const easyIndianBreakfastTemplates: MealTemplate[] = [
  {
    name: "Poha with Peanuts and Vegetables",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance", "weight-gain"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease"],
    medicalConditionsUnsafe: ["nut-allergy"],
    allergens: ["peanuts"],
    calories: 250,
    protein: 8,
    carbs: 40,
    fat: 7,
    ingredients: [
      {
        name: "Flattened rice (poha)",
        quantity: "1 cup",
        nutritionalInfo: {
          calories: 180,
          protein: 4,
          carbs: 36,
          fat: 1,
        },
      },
      {
        name: "Peanuts",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 35,
          protein: 2,
          carbs: 1,
          fat: 3,
        },
      },
      {
        name: "Onion, chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Green peas",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 15,
          protein: 1,
          carbs: 3,
          fat: 0,
        },
      },
      {
        name: "Oil",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4.5,
        },
      },
      {
        name: "Mustard seeds, curry leaves, turmeric",
        quantity: "to taste",
        nutritionalInfo: {
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    preparation:
      "Rinse poha, drain, and set aside. Heat oil, add mustard seeds, curry leaves, and turmeric. Add onions, peas, and peanuts. Mix in poha, salt, and lemon juice. Cook for 5 minutes.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "Central India",
    difficulty: "easy",
    prepTime: 15,
  },
  {
    name: "Bread Upma with Vegetables",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance"],
    medicalConditionsSafe: ["thyroid", "pcod"],
    medicalConditionsUnsafe: ["gluten-allergy"],
    allergens: ["gluten"],
    calories: 220,
    protein: 7,
    carbs: 35,
    fat: 6,
    ingredients: [
      {
        name: "Whole wheat bread slices",
        quantity: "4 slices",
        nutritionalInfo: {
          calories: 160,
          protein: 6,
          carbs: 30,
          fat: 2,
        },
      },
      {
        name: "Mixed vegetables (carrots, beans, peas)",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 25,
          protein: 1,
          carbs: 5,
          fat: 0,
        },
      },
      {
        name: "Onion, chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Oil",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4.5,
        },
      },
      {
        name: "Mustard seeds, curry leaves, turmeric",
        quantity: "to taste",
        nutritionalInfo: {
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    preparation:
      "Cut bread into small cubes. Heat oil, add mustard seeds, curry leaves, and turmeric. Add onions and vegetables, sauté until soft. Add bread cubes and salt, mix well. Cook for 5 minutes.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "South India",
    difficulty: "easy",
    prepTime: 10,
  },
  {
    name: "Besan Chilla with Mint Chutney",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease", "high-cholesterol"],
    medicalConditionsUnsafe: [],
    allergens: [],
    calories: 180,
    protein: 10,
    carbs: 20,
    fat: 7,
    ingredients: [
      {
        name: "Gram flour (besan)",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 120,
          protein: 8,
          carbs: 18,
          fat: 2,
        },
      },
      {
        name: "Onion, finely chopped",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Tomato, finely chopped",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Green chili, finely chopped",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 1,
          protein: 0.1,
          carbs: 0.2,
          fat: 0,
        },
      },
      {
        name: "Oil",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4.5,
        },
      },
      {
        name: "Mint chutney",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0.5,
        },
      },
    ],
    preparation:
      "Mix besan with water to make a smooth batter. Add chopped vegetables, salt, and spices. Heat a non-stick pan, pour a ladleful of batter, spread it thin. Cook until golden brown on both sides. Serve with mint chutney.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: true,
    isHighProtein: true,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "easy",
    prepTime: 15,
  },
]

// Indian lunch templates with Roti, Sabji, Daal, and Rice
const indianLunchTemplates: MealTemplate[] = [
  {
    name: "Roti, Dal, Rice, and Mixed Vegetable Sabji",
    mealType: "Lunch",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance", "weight-gain"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease"],
    medicalConditionsUnsafe: [],
    allergens: ["gluten"],
    calories: 550,
    protein: 15,
    carbs: 80,
    fat: 12,
    ingredients: [
      {
        name: "Whole wheat flour (for roti)",
        quantity: "2 rotis",
        nutritionalInfo: {
          calories: 140,
          protein: 5,
          carbs: 30,
          fat: 1,
        },
      },
      {
        name: "Toor dal",
        quantity: "1/2 cup cooked",
        nutritionalInfo: {
          calories: 120,
          protein: 7,
          carbs: 20,
          fat: 1,
        },
      },
      {
        name: "Rice",
        quantity: "1/2 cup cooked",
        nutritionalInfo: {
          calories: 120,
          protein: 2,
          carbs: 25,
          fat: 0,
        },
      },
      {
        name: "Mixed vegetables (for sabji)",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 50,
          protein: 2,
          carbs: 10,
          fat: 0,
        },
      },
      {
        name: "Spices and oil",
        quantity: "As needed",
        nutritionalInfo: {
          calories: 120,
          protein: 0,
          carbs: 0,
          fat: 10,
        },
      },
    ],
    preparation:
      "Make rotis from whole wheat dough. Cook dal with spices. Prepare mixed vegetable curry. Serve with steamed rice.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "medium",
    prepTime: 30,
  },
  {
    name: "Rajma Chawal with Roti and Raita",
    mealType: "Lunch",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance", "weight-gain", "muscle-building"],
    medicalConditionsSafe: ["thyroid", "heart-disease"],
    medicalConditionsUnsafe: [],
    allergens: ["dairy", "gluten"],
    calories: 600,
    protein: 18,
    carbs: 90,
    fat: 15,
    ingredients: [
      {
        name: "Kidney beans (rajma)",
        quantity: "1/2 cup cooked",
        nutritionalInfo: {
          calories: 110,
          protein: 8,
          carbs: 20,
          fat: 0,
        },
      },
      {
        name: "Rice",
        quantity: "1/2 cup cooked",
        nutritionalInfo: {
          calories: 120,
          protein: 2,
          carbs: 25,
          fat: 0,
        },
      },
      {
        name: "Whole wheat flour (for roti)",
        quantity: "2 rotis",
        nutritionalInfo: {
          calories: 140,
          protein: 5,
          carbs: 30,
          fat: 1,
        },
      },
      {
        name: "Yogurt (for raita)",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 30,
          protein: 2,
          carbs: 2,
          fat: 2,
        },
      },
      {
        name: "Cucumber (for raita)",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Onion, tomato, spices, and oil",
        quantity: "As needed",
        nutritionalInfo: {
          calories: 190,
          protein: 1,
          carbs: 11,
          fat: 12,
        },
      },
    ],
    preparation: "Cook rajma with onion, tomato, and spices. Serve with steamed rice, rotis, and cucumber raita.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: false,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "medium",
    prepTime: 40,
  },
]

// Indian dinner templates with Roti and Sabji
const indianDinnerTemplates: MealTemplate[] = [
  {
    name: "Roti, Dal, and Seasonal Vegetable Sabzi",
    mealType: "Dinner",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease"],
    medicalConditionsUnsafe: [],
    allergens: ["gluten"],
    calories: 450,
    protein: 12,
    carbs: 65,
    fat: 10,
    ingredients: [
      {
        name: "Whole wheat flour (for roti)",
        quantity: "2 rotis",
        nutritionalInfo: {
          calories: 140,
          protein: 5,
          carbs: 30,
          fat: 1,
        },
      },
      {
        name: "Moong dal",
        quantity: "1/2 cup cooked",
        nutritionalInfo: {
          calories: 120,
          protein: 7,
          carbs: 20,
          fat: 0,
        },
      },
      {
        name: "Seasonal vegetables",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 50,
          protein: 2,
          carbs: 10,
          fat: 0,
        },
      },
      {
        name: "Spices, ghee, and oil",
        quantity: "As needed",
        nutritionalInfo: {
          calories: 140,
          protein: 0,
          carbs: 0,
          fat: 15,
        },
      },
    ],
    preparation: "Make rotis from whole wheat dough. Cook dal with spices. Prepare seasonal vegetable curry.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "easy",
    prepTime: 30,
  },
]

// Indian snack templates
const indianSnackTemplates: MealTemplate[] = [
  {
    name: "Masala Chai with Rusk",
    mealType: "Snack",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["maintenance"],
    medicalConditionsSafe: ["thyroid"],
    medicalConditionsUnsafe: ["diabetes", "lactose-intolerance"],
    allergens: ["dairy", "gluten"],
    calories: 150,
    protein: 4,
    carbs: 25,
    fat: 4,
    ingredients: [
      {
        name: "Tea leaves",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 2,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      },
      {
        name: "Milk",
        quantity: "1 cup",
        nutritionalInfo: {
          calories: 80,
          protein: 4,
          carbs: 6,
          fat: 4,
        },
      },
      {
        name: "Ginger",
        quantity: "1 small piece",
        nutritionalInfo: {
          calories: 3,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Cardamom",
        quantity: "2 pods",
        nutritionalInfo: {
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Sugar",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 20,
          protein: 0,
          carbs: 5,
          fat: 0,
        },
      },
      {
        name: "Rusk",
        quantity: "2 pieces",
        nutritionalInfo: {
          calories: 80,
          protein: 1,
          carbs: 15,
          fat: 2,
        },
      },
    ],
    preparation: "Boil water with tea leaves and spices, add milk and sugar, simmer. Serve with rusk.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: false,
    region: "Pan-India",
    difficulty: "easy",
    prepTime: 10,
  },
  {
    name: "Bhel Puri",
    mealType: "Snack",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance"],
    medicalConditionsSafe: ["thyroid"],
    medicalConditionsUnsafe: ["diabetes"],
    allergens: ["gluten"],
    calories: 220,
    protein: 5,
    carbs: 40,
    fat: 6,
    ingredients: [
      {
        name: "Puffed rice (murmura)",
        quantity: "2 cups",
        nutritionalInfo: {
          calories: 140,
          protein: 3,
          carbs: 30,
          fat: 0.5,
        },
      },
      {
        name: "Sev (crispy noodles)",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 40,
          protein: 1,
          carbs: 5,
          fat: 2.5,
        },
      },
      {
        name: "Onion, finely chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Tomato, finely chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Tamarind chutney",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 30,
          protein: 0.2,
          carbs: 7,
          fat: 0.1,
        },
      },
      {
        name: "Mint chutney",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0.1,
        },
      },
    ],
    preparation:
      "Mix puffed rice, sev, chopped onions, tomatoes, and coriander leaves. Add tamarind and mint chutneys, chat masala, and salt. Toss well and serve immediately.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: false,
    isLowSugar: false,
    region: "West India",
    difficulty: "easy",
    prepTime: 10,
  },
]

// Function to populate meal templates
async function populateIndianMealTemplates() {
  try {
    console.log(`Starting to populate ${easyIndianBreakfastTemplates.length} Indian breakfast templates...`)

    for (const template of easyIndianBreakfastTemplates) {
      // Add to Firestore
      const id = await saveMealTemplate(template)
      console.log(`Added breakfast template: ${template.name} with ID: ${id}`)
    }

    console.log(`Starting to populate ${indianLunchTemplates.length} Indian lunch templates...`)
    for (const template of indianLunchTemplates) {
      const id = await saveMealTemplate(template)
      console.log(`Added lunch template: ${template.name} with ID: ${id}`)
    }

    console.log(`Starting to populate ${indianDinnerTemplates.length} Indian dinner templates...`)
    for (const template of indianDinnerTemplates) {
      const id = await saveMealTemplate(template)
      console.log(`Added dinner template: ${template.name} with ID: ${id}`)
    }

    console.log(`Starting to populate ${indianSnackTemplates.length} Indian snack templates...`)
    for (const template of indianSnackTemplates) {
      const id = await saveMealTemplate(template)
      console.log(`Added snack template: ${template.name} with ID: ${id}`)
    }

    console.log("Successfully populated Indian meal templates!")
  } catch (error) {
    console.error("Error populating Indian meal templates:", error)
  }
}

// Export the function to be used in other scripts
export { populateIndianMealTemplates }

// Run the function if this script is executed directly
if (require.main === module) {
  populateIndianMealTemplates()
}
