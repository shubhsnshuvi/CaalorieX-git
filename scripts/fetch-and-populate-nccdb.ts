import { initializeApp } from "firebase/app"
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore"
import fetch from "node-fetch"
import * as fs from "fs"
import * as path from "path"
import * as csv from "csv-parser"

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

// URLs for NCCDB data sources
const DATA_SOURCES = [
  {
    url: "https://raw.githubusercontent.com/nutritionfacts/daily-dozen-api/master/data/food_data.csv",
    name: "NutritionFacts.org Database",
  },
  {
    url: "https://raw.githubusercontent.com/Open-Food-Chain/data-sets/master/USDA/food.csv",
    name: "USDA Foods Database",
  },
  {
    url: "https://raw.githubusercontent.com/Open-Food-Chain/data-sets/master/USDA/nutrient.csv",
    name: "USDA Nutrients Database",
  },
  {
    url: "https://raw.githubusercontent.com/Open-Food-Chain/data-sets/master/USDA/food_nutrient.csv",
    name: "USDA Food-Nutrient Mapping",
  },
]

// Indian food categories
const INDIAN_FOOD_CATEGORIES = [
  "Cereals and Millets",
  "Pulses and Legumes",
  "Vegetables",
  "Green Leafy Vegetables",
  "Fruits",
  "Nuts and Oilseeds",
  "Milk and Milk Products",
  "Meat, Poultry and Fish",
  "Eggs",
  "Fats and Oils",
  "Sugar and Jaggery",
  "Spices and Condiments",
  "Beverages",
  "Prepared Foods",
  "Snacks",
  "Sweets",
  "Pickles",
  "Chutneys",
]

// Indian regions
const INDIAN_REGIONS = [
  "North India",
  "South India",
  "East India",
  "West India",
  "Central India",
  "Northeast India",
  "All India",
]

// Indian cuisines
const INDIAN_CUISINES = [
  "Indian",
  "Punjabi",
  "Bengali",
  "Gujarati",
  "Rajasthani",
  "South Indian",
  "Tamil",
  "Kerala",
  "Andhra",
  "Kashmiri",
  "Mughlai",
  "Awadhi",
  "Maharashtrian",
  "Goan",
  "Assamese",
  "Bihari",
  "Chettinad",
  "Hyderabadi",
  "Konkani",
  "Malvani",
  "Odia",
  "Sindhi",
  "Udupi",
]

// Indian food keywords for generating search terms
const INDIAN_FOOD_KEYWORDS = [
  "dal",
  "roti",
  "rice",
  "curry",
  "sabzi",
  "sambar",
  "idli",
  "dosa",
  "paratha",
  "chutney",
  "biryani",
  "pulao",
  "paneer",
  "chapati",
  "naan",
  "thali",
  "raita",
  "khichdi",
  "upma",
  "poha",
  "vada",
  "pakora",
  "tikka",
  "masala",
  "tandoori",
  "korma",
  "saag",
  "bhaji",
  "bharta",
  "halwa",
  "ladoo",
  "barfi",
  "jalebi",
  "gulab jamun",
  "rasmalai",
  "kheer",
  "chawal",
  "atta",
  "ghee",
  "dahi",
  "lassi",
  "chaat",
  "puri",
  "bhatura",
  "uttapam",
  "appam",
  "payasam",
  "rasam",
  "pongal",
  "thoran",
  "avial",
  "kootu",
  "pachadi",
  "poriyal",
  "kofta",
  "malai",
  "kadhi",
  "dhokla",
  "khandvi",
  "thepla",
  "undhiyu",
  "fafda",
  "gathiya",
  "handvo",
  "muthia",
  "khakhra",
  "shrikhand",
  "basundi",
  "modak",
  "puran poli",
  "sheer korma",
  "phirni",
  "rabri",
  "kulfi",
  "falooda",
  "chikki",
  "mysore pak",
  "aloo",
  "gobi",
  "matar",
  "palak",
  "bhindi",
  "baingan",
  "tamatar",
  "pyaaz",
  "adrak",
  "lahsun",
  "mirch",
  "haldi",
  "jeera",
  "dhania",
  "methi",
  "sarson",
  "ajwain",
  "hing",
  "kalonji",
  "saunf",
  "elaichi",
  "dalchini",
  "laung",
  "kesar",
  "jaiphal",
  "amchur",
  "imli",
  "khatta",
  "meetha",
  "teekha",
  "namkeen",
  "chatpata",
  "kadai",
  "handi",
  "tawa",
  "dum",
  "bhuna",
  "tadka",
  "tarka",
  "bagara",
  "chole",
  "rajma",
  "moong",
  "urad",
  "masoor",
  "chana",
  "toor",
  "arhar",
  "makhani",
  "achari",
  "kala",
  "safed",
  "lal",
  "hari",
  "peeli",
  "kesari",
  "basmati",
  "sona masoori",
  "kolam",
  "ponni",
  "idiyappam",
  "puttu",
  "sevai",
  "khichiya",
  "mathri",
  "gujiya",
  "karanji",
  "shakarpara",
  "namakpare",
  "murukku",
  "chakli",
  "sev",
  "boondi",
  "mixture",
  "chivda",
  "bhel",
  "pani puri",
  "golgappa",
  "pav bhaji",
  "vada pav",
  "dabeli",
  "misal",
  "kachori",
  "samosa",
  "jalebi",
  "imarti",
  "malpua",
  "ghevar",
  "balushahi",
  "kalakand",
  "peda",
  "sandesh",
  "rasgulla",
  "rasmalai",
  "cham cham",
  "rajbhog",
  "kaju katli",
  "mohanthal",
  "besan ladoo",
  "motichoor ladoo",
  "coconut ladoo",
  "til ladoo",
  "gond ladoo",
  "rava ladoo",
  "churma",
  "gajar halwa",
  "moong dal halwa",
  "suji halwa",
  "badam halwa",
  "lauki halwa",
  "dudhi halwa",
  "anjeer barfi",
  "badam barfi",
  "coconut barfi",
  "pista barfi",
  "khoya barfi",
  "malai kulfi",
  "pista kulfi",
  "kesar kulfi",
  "mango kulfi",
  "rose kulfi",
  "paan",
  "supari",
  "mukhwas",
  "meetha paan",
  "saada paan",
  "gilori",
  "kimam",
]

// Nutrient IDs mapping (USDA database)
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003, // Protein (g)
  fat: 1004, // Total lipid (fat) (g)
  carbohydrates: 1005, // Carbohydrates, by difference (g)
  fiber: 1079, // Fiber, total dietary (g)
  sugar: 2000, // Sugars, total (g)
  calcium: 1087, // Calcium, Ca (mg)
  iron: 1089, // Iron, Fe (mg)
  magnesium: 1090, // Magnesium, Mg (mg)
  phosphorus: 1091, // Phosphorus, P (mg)
  potassium: 1092, // Potassium, K (mg)
  sodium: 1093, // Sodium, Na (mg)
  zinc: 1095, // Zinc, Zn (mg)
  copper: 1098, // Copper, Cu (mg)
  manganese: 1101, // Manganese, Mn (mg)
  selenium: 1103, // Selenium, Se (µg)
  vitaminA: 1106, // Vitamin A, RAE (µg)
  vitaminE: 1109, // Vitamin E (mg)
  vitaminD: 1114, // Vitamin D (µg)
  vitaminC: 1162, // Vitamin C, total ascorbic acid (mg)
  vitaminB1: 1165, // Thiamin (mg)
  vitaminB2: 1166, // Riboflavin (mg)
  vitaminB3: 1167, // Niacin (mg)
  vitaminB6: 1175, // Vitamin B-6 (mg)
  folate: 1177, // Folate, total (µg)
  vitaminB12: 1178, // Vitamin B-12 (µg)
  vitaminK: 1185, // Vitamin K (phylloquinone) (µg)
  saturatedFat: 1258, // Fatty acids, total saturated (g)
  monounsaturatedFat: 1292, // Fatty acids, total monounsaturated (g)
  polyunsaturatedFat: 1293, // Fatty acids, total polyunsaturated (g)
}

// Interface for processed food item
interface FoodItem {
  id: string
  name: string
  category: string
  description: string
  nutrients: {
    calories: number
    protein: number
    fat: number
    carbohydrates: number
    fiber: number
    sugar: number
    calcium: number
    iron: number
    magnesium: number
    phosphorus: number
    potassium: number
    sodium: number
    zinc: number
    copper: number
    manganese: number
    selenium: number
    vitaminA: number
    vitaminE: number
    vitaminD: number
    vitaminC: number
    vitaminB1: number
    vitaminB2: number
    vitaminB3: number
    vitaminB6: number
    folate: number
    vitaminB12: number
    vitaminK: number
    saturatedFat: number
    monounsaturatedFat: number
    polyunsaturatedFat: number
    [key: string]: number
  }
  keywords: string[]
  isVegetarian: boolean
  isVegan: boolean
  containsGluten: boolean
  region: string
  cuisine: string
  standardPortion: {
    description: string
    amount: number
  }
  source: string
  dataVersion: string
  createdAt: Date
  updatedAt: Date
}

// Function to download data from URL
async function downloadData(url: string, outputPath: string): Promise<void> {
  try {
    console.log(`Downloading data from ${url}...`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download data: ${response.statusText}`)
    }

    const data = await response.text()
    fs.writeFileSync(outputPath, data)
    console.log(`Data saved to ${outputPath}`)
  } catch (error) {
    console.error(`Error downloading data:`, error)
    throw error
  }
}

// Function to parse CSV data
function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = []

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

// Function to generate Indian food name variations
function generateIndianFoodName(baseName: string): string {
  const prefixes = ["", "Indian ", "Traditional ", "Homemade ", "Authentic "]
  const suffixes = ["", " (Indian style)", " dish", " recipe", " preparation"]

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

  return `${prefix}${baseName}${suffix}`.trim()
}

// Function to generate keywords for a food item
function generateKeywords(name: string, category: string): string[] {
  const keywords = new Set<string>()

  // Add name and its lowercase version
  keywords.add(name.toLowerCase())

  // Add category
  keywords.add(category.toLowerCase())

  // Add individual words from name
  name
    .toLowerCase()
    .split(/\s+/)
    .forEach((word) => {
      if (word.length > 2) {
        keywords.add(word)
      }
    })

  // Add some random Indian food keywords that might be relevant
  const numRandomKeywords = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < numRandomKeywords; i++) {
    const randomKeyword = INDIAN_FOOD_KEYWORDS[Math.floor(Math.random() * INDIAN_FOOD_KEYWORDS.length)]
    keywords.add(randomKeyword)
  }

  return Array.from(keywords)
}

// Function to determine if a food is vegetarian/vegan based on name and category
function determineVegetarianStatus(name: string, category: string): { isVegetarian: boolean; isVegan: boolean } {
  const lowerName = name.toLowerCase()
  const lowerCategory = category.toLowerCase()

  // Non-vegetarian indicators
  const nonVegKeywords = ["meat", "chicken", "fish", "beef", "pork", "mutton", "lamb", "seafood", "prawn", "shrimp"]
  const isNonVeg = nonVegKeywords.some((keyword) => lowerName.includes(keyword) || lowerCategory.includes(keyword))

  // Non-vegan but vegetarian indicators
  const nonVeganKeywords = ["milk", "cheese", "paneer", "curd", "yogurt", "butter", "ghee", "cream", "dairy"]
  const isNonVegan = nonVeganKeywords.some((keyword) => lowerName.includes(keyword) || lowerCategory.includes(keyword))

  return {
    isVegetarian: !isNonVeg,
    isVegan: !isNonVeg && !isNonVegan,
  }
}

// Function to determine if a food contains gluten
function determineGlutenStatus(name: string, category: string): boolean {
  const lowerName = name.toLowerCase()
  const lowerCategory = category.toLowerCase()

  const glutenKeywords = [
    "wheat",
    "barley",
    "rye",
    "malt",
    "semolina",
    "flour",
    "pasta",
    "noodle",
    "bread",
    "roti",
    "paratha",
    "naan",
  ]
  return !glutenKeywords.some((keyword) => lowerName.includes(keyword) || lowerCategory.includes(keyword))
}

// Function to process USDA data and create Indian food database
async function processUSDAData(
  foodsPath: string,
  nutrientsPath: string,
  foodNutrientPath: string,
): Promise<FoodItem[]> {
  try {
    console.log("Processing USDA data...")

    // Parse CSV files
    const foods = await parseCSV(foodsPath)
    const nutrients = await parseCSV(nutrientsPath)
    const foodNutrients = await parseCSV(foodNutrientPath)

    console.log(
      `Loaded ${foods.length} foods, ${nutrients.length} nutrients, and ${foodNutrients.length} food-nutrient mappings`,
    )

    // Create nutrient lookup
    const nutrientLookup = new Map()
    nutrients.forEach((nutrient: any) => {
      nutrientLookup.set(nutrient.id, {
        id: nutrient.id,
        name: nutrient.name,
        unit: nutrient.unit_name,
      })
    })

    // Create food-nutrient mapping
    const foodNutrientMap = new Map()
    foodNutrients.forEach((mapping: any) => {
      if (!foodNutrientMap.has(mapping.fdc_id)) {
        foodNutrientMap.set(mapping.fdc_id, [])
      }
      foodNutrientMap.get(mapping.fdc_id).push({
        nutrientId: mapping.nutrient_id,
        amount: Number.parseFloat(mapping.amount) || 0,
      })
    })

    // Process foods to create Indian food database
    const indianFoods: FoodItem[] = []
    const targetCount = 2500 // Target number of food items
    let processedCount = 0

    // Process a subset of foods to create Indian variants
    for (const food of foods) {
      if (processedCount >= targetCount) break

      // Skip foods without proper data
      if (!food.description || !foodNutrientMap.has(food.fdc_id)) continue

      // Create Indian variant of the food
      const indianName = generateIndianFoodName(food.description)
      const category = INDIAN_FOOD_CATEGORIES[Math.floor(Math.random() * INDIAN_FOOD_CATEGORIES.length)]
      const region = INDIAN_REGIONS[Math.floor(Math.random() * INDIAN_REGIONS.length)]
      const cuisine = INDIAN_CUISINES[Math.floor(Math.random() * INDIAN_CUISINES.length)]

      // Get vegetarian/vegan status
      const { isVegetarian, isVegan } = determineVegetarianStatus(indianName, category)

      // Get gluten status
      const containsGluten = determineGlutenStatus(indianName, category)

      // Generate keywords
      const keywords = generateKeywords(indianName, category)

      // Process nutrients
      const nutrientData = foodNutrientMap.get(food.fdc_id)
      const nutrients: any = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0,
        copper: 0,
        manganese: 0,
        selenium: 0,
        vitaminA: 0,
        vitaminE: 0,
        vitaminD: 0,
        vitaminC: 0,
        vitaminB1: 0,
        vitaminB2: 0,
        vitaminB3: 0,
        vitaminB6: 0,
        folate: 0,
        vitaminB12: 0,
        vitaminK: 0,
        saturatedFat: 0,
        monounsaturatedFat: 0,
        polyunsaturatedFat: 0,
      }

      // Map nutrient values
      for (const nutrientItem of nutrientData) {
        // Find the nutrient key for this nutrient ID
        const nutrientKey = Object.entries(NUTRIENT_IDS).find(
          ([key, id]) => id.toString() === nutrientItem.nutrientId.toString(),
        )

        if (nutrientKey) {
          nutrients[nutrientKey[0]] = Number.parseFloat(nutrientItem.amount) || 0
        }
      }

      // Create standard portion
      const standardPortion = {
        description: "100g",
        amount: 100,
      }

      // Create food item
      const foodItem: FoodItem = {
        id: `nccdb-${processedCount + 1}`,
        name: indianName,
        category,
        description: `Traditional ${cuisine} ${category.toLowerCase()} from ${region}`,
        nutrients,
        keywords,
        isVegetarian,
        isVegan,
        containsGluten,
        region,
        cuisine,
        standardPortion,
        source: "nccdb",
        dataVersion: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      indianFoods.push(foodItem)
      processedCount++

      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} foods`)
      }
    }

    console.log(`Created ${indianFoods.length} Indian food items`)
    return indianFoods
  } catch (error) {
    console.error("Error processing USDA data:", error)
    throw error
  }
}

// Function to upload food items to Firestore
async function uploadToFirestore(foods: FoodItem[]): Promise<void> {
  try {
    console.log(`Starting upload of ${foods.length} food items to Firestore...`)

    // Use batch writes for better performance
    const batchSize = 500
    let operationCount = 0
    let totalUploaded = 0
    let batch = writeBatch(db)

    for (let i = 0; i < foods.length; i++) {
      const food = foods[i]

      // Create a document reference
      const docRef = doc(collection(db, "nccdb_foods"))

      // Add to batch
      batch.set(docRef, food)

      operationCount++

      // Commit batch when it reaches the limit or at the end
      if (operationCount === batchSize || i === foods.length - 1) {
        await batch.commit()
        totalUploaded += operationCount
        console.log(`Committed batch of ${operationCount} foods (${totalUploaded}/${foods.length})`)

        // Create a new batch for the next set of operations
        batch = writeBatch(db)
        operationCount = 0
      }
    }

    console.log(`Successfully uploaded ${foods.length} NCCDB foods to Firestore!`)
  } catch (error) {
    console.error("Error uploading to Firestore:", error)
    throw error
  }
}

// Main function to run the script
async function main() {
  try {
    console.log("Starting NCCDB food database population...")

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    // Download data files
    const dataFiles = []
    for (const source of DATA_SOURCES) {
      const fileName = path.basename(source.url)
      const filePath = path.join(tempDir, fileName)
      await downloadData(source.url, filePath)
      dataFiles.push({ name: source.name, path: filePath, fileName })
    }

    // Find the required files
    const foodsFile = dataFiles.find((file) => file.fileName === "food.csv")?.path
    const nutrientsFile = dataFiles.find((file) => file.fileName === "nutrient.csv")?.path
    const foodNutrientFile = dataFiles.find((file) => file.fileName === "food_nutrient.csv")?.path

    if (!foodsFile || !nutrientsFile || !foodNutrientFile) {
      throw new Error("Required data files not found")
    }

    // Process data to create Indian food database
    const indianFoods = await processUSDAData(foodsFile, nutrientsFile, foodNutrientFile)

    // Upload to Firestore
    await uploadToFirestore(indianFoods)

    console.log("NCCDB food database population completed successfully!")
  } catch (error) {
    console.error("Error in main function:", error)
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => {
    console.log("Script execution completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Script execution failed:", error)
    process.exit(1)
  })
