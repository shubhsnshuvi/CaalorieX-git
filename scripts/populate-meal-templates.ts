import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import type { MealTemplate } from "../lib/meal-plan-templates"

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

// Sample meal templates
const mealTemplates: MealTemplate[] = [
  // Breakfast templates
  {
    name: "Vegetable Omelette with Whole Grain Toast",
    mealType: "Breakfast",
    dietPreference: ["non-veg", "eggetarian"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "high-cholesterol", "hypertension"],
    medicalConditionsUnsafe: ["egg-allergy"],
    allergens: ["egg", "gluten"],
    calories: 350,
    protein: 20,
    carbs: 30,
    fat: 15,
    ingredients: [
      {
        name: "Eggs",
        quantity: "2 large",
        nutritionalInfo: {
          calories: 140,
          protein: 12,
          carbs: 0,
          fat: 10,
        },
      },
      {
        name: "Bell peppers, chopped",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 0,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Spinach",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 10,
          protein: 1,
          carbs: 1,
          fat: 0,
        },
      },
      {
        name: "Onion, chopped",
        quantity: "2 tbsp",
        nutritionalInfo: {
          calories: 10,
          protein: 0,
          carbs: 2,
          fat: 0,
        },
      },
      {
        name: "Whole grain bread",
        quantity: "1 slice",
        nutritionalInfo: {
          calories: 80,
          protein: 4,
          carbs: 15,
          fat: 1,
        },
      },
      {
        name: "Olive oil",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4.5,
        },
      },
    ],
    preparation: "Sauté vegetables in olive oil, add beaten eggs, cook until set, and serve with toast.",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: false,
    isLowSodium: true,
    isLowSugar: true,
  },
  {
    name: "Overnight Oats with Berries and Nuts",
    mealType: "Breakfast",
    dietPreference: ["vegetarian", "indian-vegetarian", "vegan"],
    dietGoal: ["weight-loss", "maintenance", "weight-gain"],
    medicalConditionsSafe: ["diabetes", "high-cholesterol", "hypertension", "heart-disease"],
    medicalConditionsUnsafe: ["nut-allergy"],
    allergens: ["nuts", "may contain gluten"],
    calories: 320,
    protein: 12,
    carbs: 45,
    fat: 10,
    ingredients: [
      {
        name: "Rolled oats",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
        },
      },
      {
        name: "Almond milk",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 15,
          protein: 0.5,
          carbs: 0.5,
          fat: 1.5,
        },
      },
      {
        name: "Mixed berries",
        quantity: "1/4 cup",
        nutritionalInfo: {
          calories: 25,
          protein: 0.5,
          carbs: 5,
          fat: 0,
        },
      },
      {
        name: "Chia seeds",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 60,
          protein: 2,
          carbs: 5,
          fat: 4,
        },
      },
      {
        name: "Almonds, chopped",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 45,
          protein: 2,
          carbs: 1,
          fat: 4,
        },
      },
      {
        name: "Cinnamon",
        quantity: "1/4 tsp",
        nutritionalInfo: {
          calories: 2,
          protein: 0,
          carbs: 0.5,
          fat: 0,
        },
      },
    ],
    preparation:
      "Mix oats, milk, chia seeds, and cinnamon in a jar. Refrigerate overnight. Top with berries and nuts before serving.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
  },
  // Add more breakfast templates...

  // Lunch templates
  {
    name: "Quinoa Bowl with Roasted Vegetables and Chickpeas",
    mealType: "Lunch",
    dietPreference: ["vegetarian", "indian-vegetarian", "vegan", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "high-cholesterol", "hypertension", "heart-disease", "thyroid"],
    medicalConditionsUnsafe: [],
    allergens: [],
    calories: 420,
    protein: 15,
    carbs: 65,
    fat: 12,
    ingredients: [
      {
        name: "Quinoa, cooked",
        quantity: "3/4 cup",
        nutritionalInfo: {
          calories: 170,
          protein: 6,
          carbs: 30,
          fat: 2.5,
        },
      },
      {
        name: "Chickpeas, cooked",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 120,
          protein: 6,
          carbs: 20,
          fat: 2,
        },
      },
      {
        name: "Mixed vegetables (bell peppers, zucchini, carrots)",
        quantity: "1 cup",
        nutritionalInfo: {
          calories: 50,
          protein: 2,
          carbs: 10,
          fat: 0,
        },
      },
      {
        name: "Olive oil",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 120,
          protein: 0,
          carbs: 0,
          fat: 14,
        },
      },
      {
        name: "Lemon juice",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 1,
          protein: 0,
          carbs: 0.5,
          fat: 0,
        },
      },
      {
        name: "Mixed herbs and spices",
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
      "Roast vegetables with olive oil and spices. Mix with cooked quinoa and chickpeas. Dress with lemon juice.",
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
  },
  // Add more lunch templates...

  // Dinner templates
  {
    name: "Grilled Salmon with Steamed Vegetables and Brown Rice",
    mealType: "Dinner",
    dietPreference: ["non-veg", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["diabetes", "high-cholesterol", "hypertension", "heart-disease", "thyroid"],
    medicalConditionsUnsafe: ["fish-allergy"],
    allergens: ["fish"],
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 15,
    ingredients: [
      {
        name: "Salmon fillet",
        quantity: "150g",
        nutritionalInfo: {
          calories: 250,
          protein: 30,
          carbs: 0,
          fat: 12,
        },
      },
      {
        name: "Brown rice, cooked",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 110,
          protein: 2.5,
          carbs: 23,
          fat: 1,
        },
      },
      {
        name: "Broccoli, steamed",
        quantity: "1 cup",
        nutritionalInfo: {
          calories: 55,
          protein: 3.7,
          carbs: 11.2,
          fat: 0.6,
        },
      },
      {
        name: "Carrots, steamed",
        quantity: "1/2 cup",
        nutritionalInfo: {
          calories: 25,
          protein: 0.6,
          carbs: 6,
          fat: 0.1,
        },
      },
      {
        name: "Olive oil",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 40,
          protein: 0,
          carbs: 0,
          fat: 4.5,
        },
      },
      {
        name: "Lemon juice",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 1,
          protein: 0,
          carbs: 0.5,
          fat: 0,
        },
      },
      {
        name: "Herbs and spices",
        quantity: "to taste",
        nutritionalInfo: {
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
      },
    ],
    preparation: "Season salmon with herbs and grill. Serve with steamed vegetables and brown rice.",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    isLowFat: true,
    isLowSodium: true,
    isLowSugar: true,
  },
  // Add more dinner templates...

  // Snack templates
  {
    name: "Greek Yogurt with Honey and Nuts",
    mealType: "Snack",
    dietPreference: ["vegetarian", "indian-vegetarian", "gluten-free"],
    dietGoal: ["weight-loss", "maintenance", "muscle-building"],
    medicalConditionsSafe: ["thyroid"],
    medicalConditionsUnsafe: ["diabetes", "lactose-intolerance", "nut-allergy"],
    allergens: ["dairy", "nuts"],
    calories: 200,
    protein: 15,
    carbs: 20,
    fat: 8,
    ingredients: [
      {
        name: "Greek yogurt",
        quantity: "3/4 cup",
        nutritionalInfo: {
          calories: 130,
          protein: 15,
          carbs: 5,
          fat: 4,
        },
      },
      {
        name: "Honey",
        quantity: "1 tsp",
        nutritionalInfo: {
          calories: 20,
          protein: 0,
          carbs: 6,
          fat: 0,
        },
      },
      {
        name: "Mixed nuts, chopped",
        quantity: "1 tbsp",
        nutritionalInfo: {
          calories: 50,
          protein: 2,
          carbs: 2,
          fat: 4,
        },
      },
    ],
    preparation: "Mix Greek yogurt with honey and top with chopped nuts.",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: true,
    isHighProtein: true,
    isLowFat: false,
    isLowSodium: true,
    isLowSugar: false,
  },
  // Add more snack templates...
]

// Function to populate meal templates
async function populateMealTemplates() {
  try {
    console.log(`Starting to populate ${mealTemplates.length} meal templates...`)

    for (const template of mealTemplates) {
      // Add timestamp
      const templateWithTimestamp = {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, "meal_templates"), templateWithTimestamp)
      console.log(`Added template: ${template.name} with ID: ${docRef.id}`)
    }

    console.log("Successfully populated meal templates!")
  } catch (error) {
    console.error("Error populating meal templates:", error)
  }
}

// Run the function
populateMealTemplates()
