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
  {
    name: "Vermicelli Upma with Vegetables",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance"],
    medicalConditionsSafe: ["thyroid", "pcod"],
    medicalConditionsUnsafe: ["gluten-allergy"],
    allergens: ["gluten"],
    calories: 230,
    protein: 6,
    carbs: 40,
    fat: 5,
    ingredients: [
      {
        name: "Vermicelli",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 160,
          protein: 5,
          carbs: 35,
          fat: 1,
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
      "Dry roast vermicelli until light brown. Heat oil, add mustard seeds, curry leaves, and turmeric. Add onions and vegetables, sauté until soft. Add roasted vermicelli, water, and salt. Cook until vermicelli is soft and water is absorbed.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "South India",
    difficulty: "easy",
    prepTime: 15,
  },
  {
    name: "Vegetable Sandwich with Mint Chutney",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance"],
    medicalConditionsSafe: ["thyroid", "pcod"],
    medicalConditionsUnsafe: ["gluten-allergy"],
    allergens: ["gluten"],
    calories: 250,
    protein: 8,
    carbs: 40,
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
        name: "Cucumber, sliced",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 5,
          protein: 0.3,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Tomato, sliced",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 5,
          protein: 0.3,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Onion, sliced",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0,
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
      {
        name: "Butter",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 35,
          protein: 0,
          carbs: 0,
          fat: 4,
        },
      },
    ],
    preparation:
      "Apply butter on bread slices. Spread mint chutney on one slice. Layer with cucumber, tomato, and onion slices. Cover with another bread slice. Cut diagonally and serve.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "Pan-India",
    difficulty: "easy",
    prepTime: 10,
  },
  {
    name: "Sprouts Salad with Lemon Dressing",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian", "vegan", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease", "high-cholesterol", "pcod"],
    medicalConditionsUnsafe: [],
    allergens: [],
    calories: 150,
    protein: 9,
    carbs: 25,
    fat: 2,
    ingredients: [
      {
        name: "Mixed sprouts (moong, chana)",
        quantity: "1 cup",
        nutritionalInfo: {
          calories: 120,
          protein: 8,
          carbs: 22,
          fat: 1,
        },
      },
      {
        name: "Cucumber, chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 5,
          protein: 0.3,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Tomato, chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 5,
          protein: 0.3,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Onion, chopped",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Lemon juice",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 3,
          protein: 0.1,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Chaat masala",
        quantity: "1/2 tsp",
        nutritionalInfo: {
          calories: 2,
          protein: 0.1,
          carbs: 0.4,
          fat: 0.1,
        },
      },
    ],
    preparation:
      "Mix all sprouts and vegetables in a bowl. Add lemon juice, chaat masala, and salt. Toss well and serve immediately.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "Pan-India",
    difficulty: "easy",
    prepTime: 5,
  },
  {
    name: "Daliya (Broken Wheat) Porridge",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease", "high-cholesterol"],
    medicalConditionsUnsafe: ["gluten-allergy"],
    allergens: ["gluten"],
    calories: 200,
    protein: 7,
    carbs: 35,
    fat: 3,
    ingredients: [
      {
        name: "Broken wheat (daliya)",
        quantity: "1/3 cup",
        nutritionalInfo: {
          calories: 150,
          protein: 6,
          carbs: 32,
          fat: 1,
        },
      },
      {
        name: "Mixed vegetables (carrots, beans, peas)",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 15,
          protein: 0.7,
          carbs: 3,
          fat: 0,
        },
      },
      {
        name: "Onion, chopped",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 5,
          protein: 0.2,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Oil",
        quantity: "1/2 tsp",
        nutritionalInfo: {
          calories: 20,
          protein: 0,
          carbs: 0,
          fat: 2.2,
        },
      },
      {
        name: "Cumin seeds, turmeric",
        quantity: "to taste",
        nutritionalInfo: {
          calories: 5,
          protein: 0.1,
          carbs: 0.5,
          fat: 0.3,
        },
      },
    ],
    preparation:
      "Heat oil, add cumin seeds and turmeric. Add onions and vegetables, sauté until soft. Add broken wheat and water. Cook until soft and water is absorbed. Add salt to taste.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "easy",
    prepTime: 15,
  },
  {
    name: "Moong Dal Cheela with Curd",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "thyroid", "heart-disease", "high-cholesterol"],
    medicalConditionsUnsafe: ["lactose-intolerance"],
    allergens: ["dairy"],
    calories: 220,
    protein: 12,
    carbs: 30,
    fat: 5,
    ingredients: [
      {
        name: "Yellow moong dal (soaked for 4 hours)",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 120,
          protein: 9,
          carbs: 22,
          fat: 1,
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
        name: "Curd",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 30,
          protein: 2.5,
          carbs: 2.5,
          fat: 1.5,
        },
      },
    ],
    preparation:
      "Grind soaked moong dal with water to make a smooth batter. Add chopped vegetables, salt, and spices. Heat a non-stick pan, pour a ladleful of batter, spread it thin. Cook until golden brown on both sides. Serve with curd.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
    region: "North India",
    difficulty: "easy",
    prepTime: 15,
  },
]

// Function to populate meal templates
async function populateIndianMealTemplates() {
  try {
    console.log(`Starting to populate ${easyIndianBreakfastTemplates.length} Indian breakfast templates...`)

    for (const template of easyIndianBreakfastTemplates) {
      // Add to Firestore
      const id = await saveMealTemplate(template)
      console.log(`Added template: ${template.name} with ID: ${id}`)
    }

    console.log("Successfully populated Indian meal templates!")
  } catch (error) {
    console.error("Error populating Indian meal templates:", error)
  }
}

// Run the function
populateIndianMealTemplates()
