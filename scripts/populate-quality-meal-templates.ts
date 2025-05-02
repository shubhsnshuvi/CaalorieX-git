import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || "{}")

if (!serviceAccount.private_key) {
  console.error("Firebase private key is missing. Please check your environment variables.")
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
})

const db = getFirestore()

// High-quality meal templates
const mealTemplates = [
  // Standard diet templates
  {
    name: "Balanced Nutrition Plan",
    dietType: "standard",
    totalCalories: 2000,
    suitableFor: ["general"],
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        calories: 500,
        items: [
          {
            name: "Oatmeal with Berries",
            portion: "1",
            unit: "bowl",
            calories: 300,
            protein: 10,
            carbs: 45,
            fat: 8,
            fiber: 6,
          },
          { name: "Greek Yogurt", portion: "100", unit: "g", calories: 100, protein: 15, carbs: 5, fat: 2, fiber: 0 },
          { name: "Almonds", portion: "15", unit: "g", calories: 100, protein: 4, carbs: 3, fat: 9, fiber: 2 },
        ],
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        calories: 200,
        items: [
          { name: "Apple", portion: "1", unit: "medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4 },
          { name: "Peanut Butter", portion: "1", unit: "tbsp", calories: 105, protein: 4, carbs: 3, fat: 8, fiber: 1 },
        ],
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        calories: 600,
        items: [
          {
            name: "Grilled Chicken Breast",
            portion: "120",
            unit: "g",
            calories: 200,
            protein: 38,
            carbs: 0,
            fat: 4,
            fiber: 0,
          },
          { name: "Brown Rice", portion: "100", unit: "g", calories: 150, protein: 3, carbs: 32, fat: 1, fiber: 2 },
          {
            name: "Steamed Broccoli",
            portion: "100",
            unit: "g",
            calories: 55,
            protein: 3.7,
            carbs: 11,
            fat: 0.6,
            fiber: 5,
          },
          { name: "Olive Oil", portion: "1", unit: "tbsp", calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 },
          { name: "Mixed Salad", portion: "100", unit: "g", calories: 75, protein: 1, carbs: 5, fat: 5, fiber: 2 },
        ],
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        calories: 200,
        items: [
          { name: "Cottage Cheese", portion: "100", unit: "g", calories: 120, protein: 14, carbs: 3, fat: 5, fiber: 0 },
          {
            name: "Pineapple Chunks",
            portion: "100",
            unit: "g",
            calories: 80,
            protein: 0.5,
            carbs: 20,
            fat: 0,
            fiber: 2,
          },
        ],
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        calories: 500,
        items: [
          { name: "Baked Salmon", portion: "120", unit: "g", calories: 240, protein: 30, carbs: 0, fat: 12, fiber: 0 },
          { name: "Quinoa", portion: "80", unit: "g", calories: 120, protein: 4, carbs: 21, fat: 2, fiber: 3 },
          {
            name: "Roasted Vegetables",
            portion: "150",
            unit: "g",
            calories: 140,
            protein: 4,
            carbs: 18,
            fat: 7,
            fiber: 6,
          },
        ],
      },
    ],
  },

  // Vegetarian diet templates
  {
    name: "Balanced Vegetarian Plan",
    dietType: "vegetarian",
    totalCalories: 1800,
    suitableFor: ["general"],
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        calories: 450,
        items: [
          {
            name: "Whole Grain Toast",
            portion: "2",
            unit: "slices",
            calories: 160,
            protein: 8,
            carbs: 30,
            fat: 2,
            fiber: 6,
          },
          { name: "Avocado", portion: "0.5", unit: "medium", calories: 160, protein: 2, carbs: 8, fat: 15, fiber: 7 },
          { name: "Scrambled Tofu", portion: "100", unit: "g", calories: 130, protein: 15, carbs: 2, fat: 8, fiber: 1 },
        ],
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        calories: 200,
        items: [
          { name: "Mixed Berries", portion: "100", unit: "g", calories: 70, protein: 1, carbs: 17, fat: 0.5, fiber: 8 },
          {
            name: "Almond Milk Yogurt",
            portion: "150",
            unit: "g",
            calories: 130,
            protein: 5,
            carbs: 15,
            fat: 7,
            fiber: 2,
          },
        ],
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        calories: 550,
        items: [
          { name: "Lentil Soup", portion: "250", unit: "ml", calories: 200, protein: 12, carbs: 30, fat: 4, fiber: 8 },
          {
            name: "Whole Grain Bread",
            portion: "1",
            unit: "slice",
            calories: 80,
            protein: 4,
            carbs: 15,
            fat: 1,
            fiber: 3,
          },
          {
            name: "Mixed Green Salad",
            portion: "100",
            unit: "g",
            calories: 70,
            protein: 2,
            carbs: 5,
            fat: 5,
            fiber: 3,
          },
          { name: "Walnuts", portion: "15", unit: "g", calories: 100, protein: 2, carbs: 2, fat: 10, fiber: 1 },
          {
            name: "Balsamic Vinaigrette",
            portion: "1",
            unit: "tbsp",
            calories: 100,
            protein: 0,
            carbs: 2,
            fat: 10,
            fiber: 0,
          },
        ],
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        calories: 150,
        items: [
          { name: "Hummus", portion: "50", unit: "g", calories: 100, protein: 5, carbs: 10, fat: 5, fiber: 3 },
          { name: "Carrot Sticks", portion: "100", unit: "g", calories: 50, protein: 1, carbs: 12, fat: 0, fiber: 3 },
        ],
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        calories: 450,
        items: [
          {
            name: "Chickpea Curry",
            portion: "200",
            unit: "g",
            calories: 250,
            protein: 12,
            carbs: 30,
            fat: 10,
            fiber: 8,
          },
          { name: "Brown Rice", portion: "80", unit: "g", calories: 120, protein: 3, carbs: 25, fat: 1, fiber: 2 },
          { name: "Steamed Spinach", portion: "100", unit: "g", calories: 80, protein: 5, carbs: 10, fat: 2, fiber: 4 },
        ],
      },
    ],
  },

  // Low-carb diet templates
  {
    name: "Low-Carb Nutrition Plan",
    dietType: "low-carb",
    totalCalories: 1900,
    suitableFor: ["diabetes", "weight-loss"],
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        calories: 450,
        items: [
          { name: "Eggs", portion: "2", unit: "large", calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 },
          { name: "Avocado", portion: "0.5", unit: "medium", calories: 160, protein: 2, carbs: 8, fat: 15, fiber: 7 },
          { name: "Spinach", portion: "50", unit: "g", calories: 50, protein: 3, carbs: 3, fat: 2, fiber: 2 },
          { name: "Olive Oil", portion: "1", unit: "tsp", calories: 40, protein: 0, carbs: 0, fat: 4.5, fiber: 0 },
          { name: "Cherry Tomatoes", portion: "50", unit: "g", calories: 60, protein: 1, carbs: 3, fat: 4, fiber: 1 },
        ],
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        calories: 200,
        items: [
          {
            name: "Greek Yogurt (Full Fat)",
            portion: "100",
            unit: "g",
            calories: 130,
            protein: 10,
            carbs: 4,
            fat: 10,
            fiber: 0,
          },
          { name: "Blueberries", portion: "50", unit: "g", calories: 70, protein: 0.5, carbs: 8, fat: 0.5, fiber: 2 },
        ],
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        calories: 550,
        items: [
          {
            name: "Grilled Salmon",
            portion: "150",
            unit: "g",
            calories: 300,
            protein: 36,
            carbs: 0,
            fat: 15,
            fiber: 0,
          },
          { name: "Mixed Greens", portion: "100", unit: "g", calories: 50, protein: 2, carbs: 5, fat: 2, fiber: 3 },
          { name: "Cucumber", portion: "100", unit: "g", calories: 30, protein: 1, carbs: 6, fat: 0, fiber: 2 },
          { name: "Feta Cheese", portion: "30", unit: "g", calories: 90, protein: 5, carbs: 1, fat: 7, fiber: 0 },
          {
            name: "Olive Oil Dressing",
            portion: "1",
            unit: "tbsp",
            calories: 80,
            protein: 0,
            carbs: 0,
            fat: 9,
            fiber: 0,
          },
        ],
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        calories: 200,
        items: [
          { name: "Almonds", portion: "30", unit: "g", calories: 180, protein: 6, carbs: 6, fat: 16, fiber: 3 },
          { name: "Celery Sticks", portion: "100", unit: "g", calories: 20, protein: 1, carbs: 4, fat: 0, fiber: 2 },
        ],
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        calories: 500,
        items: [
          {
            name: "Grilled Chicken Thighs",
            portion: "150",
            unit: "g",
            calories: 300,
            protein: 28,
            carbs: 0,
            fat: 20,
            fiber: 0,
          },
          {
            name: "Cauliflower Rice",
            portion: "150",
            unit: "g",
            calories: 50,
            protein: 4,
            carbs: 10,
            fat: 0,
            fiber: 5,
          },
          {
            name: "Roasted Brussels Sprouts",
            portion: "100",
            unit: "g",
            calories: 80,
            protein: 3,
            carbs: 8,
            fat: 4,
            fiber: 4,
          },
          { name: "Butter", portion: "1", unit: "tsp", calories: 70, protein: 0, carbs: 0, fat: 8, fiber: 0 },
        ],
      },
    ],
  },

  // High-protein diet templates
  {
    name: "High-Protein Nutrition Plan",
    dietType: "high-protein",
    totalCalories: 2200,
    suitableFor: ["muscle-gain", "athletes"],
    meals: [
      {
        name: "Breakfast",
        time: "7:00 AM",
        calories: 550,
        items: [
          { name: "Eggs", portion: "3", unit: "large", calories: 210, protein: 18, carbs: 1.5, fat: 15, fiber: 0 },
          {
            name: "Turkey Bacon",
            portion: "3",
            unit: "slices",
            calories: 120,
            protein: 15,
            carbs: 1,
            fat: 7,
            fiber: 0,
          },
          {
            name: "Whole Grain Toast",
            portion: "1",
            unit: "slice",
            calories: 80,
            protein: 4,
            carbs: 15,
            fat: 1,
            fiber: 3,
          },
          { name: "Spinach", portion: "50", unit: "g", calories: 40, protein: 3, carbs: 3, fat: 1, fiber: 2 },
          { name: "Olive Oil", portion: "1", unit: "tsp", calories: 40, protein: 0, carbs: 0, fat: 4.5, fiber: 0 },
        ],
      },
      {
        name: "Mid-Morning Snack",
        time: "10:00 AM",
        calories: 300,
        items: [
          {
            name: "Protein Shake",
            portion: "1",
            unit: "serving",
            calories: 150,
            protein: 25,
            carbs: 5,
            fat: 2,
            fiber: 1,
          },
          { name: "Banana", portion: "1", unit: "medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3 },
          { name: "Almond Butter", portion: "1", unit: "tbsp", calories: 45, protein: 2, carbs: 2, fat: 5, fiber: 1 },
        ],
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        calories: 650,
        items: [
          {
            name: "Grilled Chicken Breast",
            portion: "180",
            unit: "g",
            calories: 300,
            protein: 54,
            carbs: 0,
            fat: 7,
            fiber: 0,
          },
          { name: "Sweet Potato", portion: "150", unit: "g", calories: 150, protein: 2, carbs: 35, fat: 0, fiber: 5 },
          { name: "Broccoli", portion: "100", unit: "g", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5 },
          { name: "Quinoa", portion: "50", unit: "g", calories: 80, protein: 3, carbs: 15, fat: 1, fiber: 2 },
          { name: "Olive Oil", portion: "1", unit: "tbsp", calories: 65, protein: 0, carbs: 0, fat: 7, fiber: 0 },
        ],
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        calories: 250,
        items: [
          { name: "Greek Yogurt", portion: "150", unit: "g", calories: 150, protein: 20, carbs: 8, fat: 4, fiber: 0 },
          { name: "Mixed Berries", portion: "100", unit: "g", calories: 70, protein: 1, carbs: 17, fat: 0.5, fiber: 8 },
          { name: "Chia Seeds", portion: "1", unit: "tbsp", calories: 30, protein: 1, carbs: 2, fat: 2, fiber: 2 },
        ],
      },
      {
        name: "Dinner",
        time: "7:30 PM",
        calories: 450,
        items: [
          {
            name: "Lean Beef Steak",
            portion: "150",
            unit: "g",
            calories: 250,
            protein: 40,
            carbs: 0,
            fat: 10,
            fiber: 0,
          },
          { name: "Brown Rice", portion: "70", unit: "g", calories: 100, protein: 2, carbs: 22, fat: 1, fiber: 2 },
          { name: "Asparagus", portion: "100", unit: "g", calories: 40, protein: 4, carbs: 4, fat: 0, fiber: 2 },
          { name: "Olive Oil", portion: "1", unit: "tsp", calories: 60, protein: 0, carbs: 0, fat: 7, fiber: 0 },
        ],
      },
    ],
  },

  // Keto diet templates
  {
    name: "Ketogenic Nutrition Plan",
    dietType: "keto",
    totalCalories: 1800,
    suitableFor: ["weight-loss", "epilepsy"],
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        calories: 500,
        items: [
          { name: "Eggs", portion: "2", unit: "large", calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 },
          { name: "Bacon", portion: "3", unit: "slices", calories: 150, protein: 12, carbs: 0, fat: 12, fiber: 0 },
          { name: "Avocado", portion: "0.5", unit: "medium", calories: 160, protein: 2, carbs: 8, fat: 15, fiber: 7 },
          { name: "Spinach", portion: "50", unit: "g", calories: 50, protein: 3, carbs: 3, fat: 2, fiber: 2 },
        ],
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        calories: 200,
        items: [
          { name: "Macadamia Nuts", portion: "30", unit: "g", calories: 200, protein: 2, carbs: 4, fat: 22, fiber: 3 },
        ],
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        calories: 550,
        items: [
          {
            name: "Grilled Salmon",
            portion: "150",
            unit: "g",
            calories: 300,
            protein: 36,
            carbs: 0,
            fat: 15,
            fiber: 0,
          },
          { name: "Mixed Greens", portion: "100", unit: "g", calories: 50, protein: 2, carbs: 5, fat: 2, fiber: 3 },
          { name: "Olive Oil", portion: "1", unit: "tbsp", calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 },
          { name: "Feta Cheese", portion: "30", unit: "g", calories: 80, protein: 5, carbs: 1, fat: 6, fiber: 0 },
        ],
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        calories: 150,
        items: [
          { name: "Celery Sticks", portion: "100", unit: "g", calories: 20, protein: 1, carbs: 4, fat: 0, fiber: 2 },
          { name: "Cream Cheese", portion: "30", unit: "g", calories: 130, protein: 2, carbs: 1, fat: 13, fiber: 0 },
        ],
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        calories: 400,
        items: [
          { name: "Ribeye Steak", portion: "120", unit: "g", calories: 300, protein: 25, carbs: 0, fat: 22, fiber: 0 },
          {
            name: "Cauliflower Mash",
            portion: "150",
            unit: "g",
            calories: 50,
            protein: 4,
            carbs: 10,
            fat: 0,
            fiber: 5,
          },
          { name: "Butter", portion: "1", unit: "tbsp", calories: 50, protein: 0, carbs: 0, fat: 11, fiber: 0 },
        ],
      },
    ],
  },
]

// Function to populate the database with meal templates
async function populateMealTemplates() {
  try {
    const batch = db.batch()
    const mealTemplatesRef = db.collection("mealTemplates")

    for (const template of mealTemplates) {
      const docRef = mealTemplatesRef.doc()
      batch.set(docRef, {
        ...template,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    await batch.commit()
    console.log(`Successfully added ${mealTemplates.length} meal templates to the database.`)
  } catch (error) {
    console.error("Error populating meal templates:", error)
  }
}

// Execute the function
populateMealTemplates()
  .then(() => {
    console.log("Meal template population completed.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to populate meal templates:", error)
    process.exit(1)
  })
