/**
 * Diet preference handler for meal planning
 * This module provides functions to check if foods comply with specific diet preferences
 * and to adjust meal plans based on dietary requirements.
 */

// Define food properties that affect diet preferences
export interface FoodDietProperties {
  isVegetarian: boolean
  isVegan: boolean
  isEggetarian: boolean
  containsGluten: boolean
  containsOnionGarlic: boolean
  containsRootVegetables: boolean
  isProcessed: boolean
  isRefined: boolean
  isHighGlycemic: boolean
  isHighFat: boolean
  isHighProtein: boolean
  isHighCarb: boolean
  isLowCarb: boolean
  isLowFat: boolean
  isLowProtein: boolean
  isLowCalorie: boolean
  isHighCalorie: boolean
  isFermented: boolean
  isRaw: boolean
  isFried: boolean
  isBaked: boolean
  isSteamed: boolean
  isBoiled: boolean
  isGrilled: boolean
  isRoasted: boolean
  isSauteed: boolean
  isStewed: boolean
  isBraised: boolean
  isPickled: boolean
  isCured: boolean
  isSmoked: boolean
  isDried: boolean
  isFresh: boolean
  isFrozen: boolean
  isCanned: boolean
  isPackaged: boolean
  isOrganic: boolean
  isNonGMO: boolean
  isLocal: boolean
  isSeasonal: boolean
  isWhole: boolean
  isRefined: boolean
  isProcessed: boolean
  isUltraProcessed: boolean
  isNatural: boolean
  isArtificial: boolean
  isAdditiveFree: boolean
  isPreservativeFree: boolean
  isSugarFree: boolean
  isSaltFree: boolean
  isOilFree: boolean
  isGlutenFree: boolean
  isDairyFree: boolean
  isEggFree: boolean
  isNutFree: boolean
  isSoyFree: boolean
  isWheatFree: boolean
  isCornFree: boolean
  isYeastFree: boolean
  isAlcoholFree: boolean
  isCaffeineFree: boolean
  isTheobromineFree: boolean
  isHistamineFree: boolean
  isFODMAPFree: boolean
  isLectinFree: boolean
  isOxalateFree: boolean
  isGoitrogenFree: boolean
  isPurineFree: boolean
  isSalicylateFree: boolean
  isAminesFree: boolean
  isGlutamateFree: boolean
  isSulfiteFree: boolean
  isNitrateFree: boolean
  isNightShadeFree: boolean
  isPhytoestrogensLow: boolean
  isKosher: boolean
  isHalal: boolean
  bloodType?: string
  region?: string
}

// Foods allowed for specific diet preferences - UPDATED WITH SCIENTIFIC ACCURACY
const DIET_ALLOWED_FOODS = {
  vegetarian: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "tofu",
    "tempeh",
    "seitan",
    "milk",
    "cheese",
    "yogurt",
    "butter",
    "paneer",
    "ghee",
    "whey",
    "casein",
  ],
  vegan: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "tofu",
    "tempeh",
    "seitan",
    "plant milk",
    "nutritional yeast",
    "vegan cheese",
    "plant-based",
    "soy",
    "almond milk",
    "oat milk",
    "coconut milk",
    "rice milk",
    "hemp milk",
    "flax milk",
    "cashew milk",
    "pea protein",
    "rice protein",
    "hemp protein",
    "algae",
    "spirulina",
    "chlorella",
  ],
  "indian-vegetarian": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "honey",
    "paneer",
    "ghee",
    "milk",
    "curd",
    "butter",
    "rice",
    "wheat",
    "dal",
    "chapati",
    "roti",
    "paratha",
    "dosa",
    "idli",
    "upma",
    "poha",
    "khichdi",
    "sabzi",
    "curry",
    "chutney",
    "raita",
    "lassi",
    "buttermilk",
    "kheer",
    "halwa",
    "ladoo",
    "barfi",
    "jalebi",
  ],
  "non-veg": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "beef",
    "pork",
    "lamb",
    "chicken",
    "turkey",
    "duck",
    "goose",
    "quail",
    "venison",
    "bison",
    "rabbit",
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "shrimp",
    "crab",
    "lobster",
    "oyster",
    "clam",
    "mussel",
    "scallop",
  ],
  eggetarian: [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "honey",
    "milk",
    "cheese",
    "yogurt",
    "butter",
    "paneer",
    "ghee",
    "whey",
    "casein",
    "egg white",
    "egg yolk",
    "whole egg",
    "egg powder",
  ],
  "gluten-free": [
    "vegetable",
    "fruit",
    "rice",
    "corn",
    "potato",
    "quinoa",
    "millet",
    "buckwheat",
    "amaranth",
    "teff",
    "sorghum",
    "tapioca",
    "arrowroot",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "egg",
    "dairy",
    "nut",
    "seed",
    "legume",
    "bean",
    "gluten-free oats",
    "gluten-free bread",
    "gluten-free pasta",
    "gluten-free flour",
    "gluten-free cereal",
    "gluten-free snack",
  ],
  "intermittent-fasting": [
    "vegetable",
    "fruit",
    "grain",
    "legume",
    "nut",
    "seed",
    "dairy",
    "egg",
    "meat",
    "poultry",
    "fish",
    "seafood",
    "water",
    "tea",
    "coffee",
    "bone broth",
    "electrolyte",
    "mineral water",
  ],
  "blood-type": {
    A: [
      "vegetable",
      "fruit",
      "tofu",
      "legume",
      "grain",
      "seafood",
      "turkey",
      "chicken",
      "olive oil",
      "soy",
      "pineapple",
      "garlic",
      "onion",
      "broccoli",
      "spinach",
      "rice",
      "oats",
    ],
    B: [
      "meat",
      "dairy",
      "vegetable",
      "fruit",
      "grain",
      "seafood",
      "egg",
      "turkey",
      "lamb",
      "rabbit",
      "yogurt",
      "milk",
      "cheese",
      "olive oil",
      "rice",
      "oats",
      "banana",
      "grape",
    ],
    AB: [
      "seafood",
      "tofu",
      "dairy",
      "vegetable",
      "fruit",
      "grain",
      "turkey",
      "lamb",
      "egg",
      "yogurt",
      "milk",
      "olive oil",
      "rice",
      "oats",
      "banana",
      "grape",
      "pineapple",
    ],
    O: [
      "meat",
      "fish",
      "vegetable",
      "fruit",
      "egg",
      "seafood",
      "beef",
      "lamb",
      "turkey",
      "cod",
      "salmon",
      "spinach",
      "broccoli",
      "olive oil",
      "walnut",
      "pumpkin seed",
      "plum",
      "fig",
      "pineapple",
    ],
  },
  "hindu-fasting": [
    "fruit",
    "milk",
    "yogurt",
    "potato",
    "sweet potato",
    "water chestnut",
    "buckwheat",
    "amaranth",
    "rock salt",
    "ginger",
    "cumin",
    "green vegetable",
    "sabudana",
    "rajgira",
    "singhara",
    "kuttu",
    "makhana",
    "sendha namak",
    "coconut",
    "dry fruit",
    "nut",
    "ghee",
  ],
  "jain-diet": [
    "grain",
    "legume",
    "dairy",
    "fruit",
    "above-ground vegetable",
    "nut",
    "seed",
    "milk",
    "curd",
    "ghee",
    "butter",
    "paneer",
    "cheese",
    "wheat",
    "rice",
    "dal",
    "moong",
    "chana",
    "toor",
    "urad",
    "masoor",
    "apple",
    "banana",
    "orange",
    "grape",
    "mango",
    "papaya",
    "pear",
    "almond",
    "cashew",
    "walnut",
    "pista",
  ],
  "sattvic-diet": [
    "fruit",
    "vegetable",
    "whole grain",
    "legume",
    "nut",
    "seed",
    "milk",
    "ghee",
    "honey",
    "jaggery",
    "herb",
    "spice",
    "rice",
    "wheat",
    "barley",
    "oats",
    "moong dal",
    "chana dal",
    "toor dal",
    "urad dal",
    "masoor dal",
    "apple",
    "banana",
    "orange",
    "grape",
    "mango",
    "papaya",
    "pear",
    "almond",
    "cashew",
    "walnut",
    "pista",
    "coconut",
    "ginger",
    "turmeric",
    "cinnamon",
    "cardamom",
    "clove",
    "cumin",
    "coriander",
  ],
  "indian-regional": {
    north: [
      "wheat",
      "dairy",
      "vegetable",
      "legume",
      "paneer",
      "chicken",
      "lamb",
      "roti",
      "paratha",
      "naan",
      "butter",
      "ghee",
      "rajma",
      "chole",
      "dal makhani",
      "aloo",
      "gobi",
      "matar",
      "palak",
      "paneer",
      "chicken curry",
      "butter chicken",
      "tandoori chicken",
      "kebab",
      "biryani",
      "pulao",
      "lassi",
      "raita",
      "chaat",
      "samosa",
      "pakora",
      "jalebi",
      "gulab jamun",
      "barfi",
      "ladoo",
    ],
    south: [
      "rice",
      "coconut",
      "vegetable",
      "legume",
      "seafood",
      "yogurt",
      "idli",
      "dosa",
      "vada",
      "uttapam",
      "appam",
      "sambhar",
      "rasam",
      "coconut chutney",
      "tomato chutney",
      "fish curry",
      "prawn curry",
      "crab curry",
      "chicken curry",
      "egg curry",
      "avial",
      "poriyal",
      "kootu",
      "payasam",
      "kesari",
      "mysore pak",
    ],
    east: [
      "rice",
      "fish",
      "vegetable",
      "mustard",
      "panch phoron",
      "fish curry",
      "machher jhol",
      "shorshe ilish",
      "chingri malai curry",
      "aloo posto",
      "begun bhaja",
      "cholar dal",
      "luchi",
      "kosha mangsho",
      "mishti doi",
      "rasgulla",
      "sandesh",
      "pantua",
      "malpua",
    ],
    west: [
      "wheat",
      "rice",
      "legume",
      "vegetable",
      "dairy",
      "jaggery",
      "thepla",
      "dhokla",
      "khandvi",
      "fafda",
      "pav bhaji",
      "vada pav",
      "misal pav",
      "puran poli",
      "modak",
      "shrikhand",
      "basundi",
      "dal dhokli",
      "undhiyu",
      "batata vada",
      "sabudana khichdi",
      "poha",
      "thalipeeth",
    ],
    central: [
      "wheat",
      "corn",
      "legume",
      "vegetable",
      "dairy",
      "bafla",
      "dal bati churma",
      "poha",
      "jalebi",
      "malpua",
      "imarti",
      "khichdi",
      "kadhi",
      "gatte ki sabzi",
      "ker sangri",
      "laal maas",
      "safed maas",
      "chakki ki sabzi",
      "bhutta",
      "makki ki roti",
      "sarson ka saag",
    ],
  },
  keto: [
    "meat",
    "fish",
    "egg",
    "high-fat dairy",
    "above-ground vegetable",
    "nut",
    "seed",
    "avocado",
    "olive oil",
    "coconut oil",
    "butter",
    "ghee",
    "cream",
    "cheese",
    "bacon",
    "fatty fish",
    "fatty meat",
    "spinach",
    "kale",
    "broccoli",
    "cauliflower",
    "zucchini",
    "asparagus",
    "bell pepper",
    "cucumber",
    "celery",
    "mushroom",
    "almond",
    "walnut",
    "macadamia",
    "pecan",
    "flaxseed",
    "chia seed",
    "hemp seed",
    "pumpkin seed",
    "sunflower seed",
    "mct oil",
    "lard",
    "tallow",
    "duck fat",
  ],
  paleo: [
    "meat",
    "fish",
    "egg",
    "vegetable",
    "fruit",
    "nut",
    "seed",
    "healthy oil",
    "grass-fed beef",
    "free-range chicken",
    "wild-caught fish",
    "pasture-raised pork",
    "lamb",
    "venison",
    "bison",
    "turkey",
    "duck",
    "salmon",
    "tuna",
    "mackerel",
    "sardine",
    "leafy green",
    "cruciferous vegetable",
    "root vegetable",
    "berry",
    "apple",
    "pear",
    "citrus",
    "melon",
    "almond",
    "walnut",
    "macadamia",
    "pecan",
    "hazelnut",
    "pine nut",
    "olive oil",
    "coconut oil",
    "avocado oil",
    "ghee",
    "honey",
    "maple syrup",
  ],
  whole30: [
    "meat",
    "fish",
    "egg",
    "vegetable",
    "fruit",
    "nut",
    "seed",
    "healthy oil",
    "grass-fed beef",
    "free-range chicken",
    "wild-caught fish",
    "pasture-raised pork",
    "lamb",
    "venison",
    "bison",
    "turkey",
    "duck",
    "salmon",
    "tuna",
    "mackerel",
    "sardine",
    "leafy green",
    "cruciferous vegetable",
    "root vegetable",
    "berry",
    "apple",
    "pear",
    "citrus",
    "melon",
    "almond",
    "walnut",
    "macadamia",
    "pecan",
    "hazelnut",
    "pine nut",
    "olive oil",
    "coconut oil",
    "avocado oil",
    "ghee",
  ],
  mediterranean: [
    "vegetable",
    "fruit",
    "whole grain",
    "legume",
    "nut",
    "seed",
    "olive oil",
    "fish",
    "seafood",
    "poultry",
    "egg",
    "dairy",
    "herb",
    "spice",
    "leafy green",
    "tomato",
    "cucumber",
    "eggplant",
    "zucchini",
    "bell pepper",
    "onion",
    "garlic",
    "olive",
    "citrus",
    "grape",
    "fig",
    "date",
    "pomegranate",
    "wheat",
    "barley",
    "oats",
    "rice",
    "chickpea",
    "lentil",
    "bean",
    "almond",
    "walnut",
    "pistachio",
    "pine nut",
    "salmon",
    "sardine",
    "mackerel",
    "tuna",
    "shrimp",
    "mussel",
    "clam",
    "octopus",
    "squid",
    "chicken",
    "turkey",
    "yogurt",
    "cheese",
    "feta",
    "halloumi",
    "basil",
    "oregano",
    "thyme",
    "rosemary",
    "sage",
    "mint",
    "parsley",
    "cinnamon",
    "cumin",
    "red wine",
  ],
  dash: ["vegetable", "fruit", "whole grain", "lean protein", "low-fat dairy", "nut", "seed", "legume", "healthy oil"],
  mind: [
    "green leafy vegetable",
    "other vegetable",
    "nut",
    "berry",
    "bean",
    "whole grain",
    "fish",
    "poultry",
    "olive oil",
    "wine",
  ],
  "low-fodmap": [
    "meat",
    "fish",
    "egg",
    "certain vegetable",
    "certain fruit",
    "lactose-free dairy",
    "certain grain",
    "certain nut",
    "certain seed",
  ],
}

// Foods to avoid for specific diet preferences - UPDATED WITH SCIENTIFIC ACCURACY
const DIET_AVOID_FOODS = {
  vegetarian: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
    "beef",
    "pork",
    "lamb",
    "chicken",
    "turkey",
    "duck",
    "goose",
    "quail",
    "venison",
    "bison",
    "rabbit",
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "shrimp",
    "crab",
    "lobster",
    "oyster",
    "clam",
    "mussel",
    "scallop",
    "anchovy",
    "fish sauce",
    "worcestershire sauce",
  ],
  vegan: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "dairy",
    "egg",
    "honey",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
    "whey",
    "casein",
    "lactose",
    "beeswax",
    "shellac",
    "carmine",
    "isinglass",
    "lanolin",
    "vitamin D3 from animal sources",
    "omega-3 from fish oil",
    "bone char processed sugar",
    "milk",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "ice cream",
    "mayonnaise",
    "ghee",
    "paneer",
  ],
  "indian-vegetarian": [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "egg",
    "gelatin",
    "animal rennet",
    "beef",
    "pork",
    "lamb",
    "chicken",
    "turkey",
    "duck",
    "goose",
    "quail",
    "venison",
    "bison",
    "rabbit",
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "shrimp",
    "crab",
    "lobster",
    "oyster",
    "clam",
    "mussel",
    "scallop",
    "egg white",
    "egg yolk",
    "whole egg",
    "egg powder",
  ],
  eggetarian: [
    "meat",
    "poultry",
    "fish",
    "seafood",
    "gelatin",
    "lard",
    "animal rennet",
    "animal stock",
    "animal fat",
    "animal broth",
    "beef",
    "pork",
    "lamb",
    "chicken",
    "turkey",
    "duck",
    "goose",
    "quail",
    "venison",
    "bison",
    "rabbit",
    "salmon",
    "tuna",
    "cod",
    "tilapia",
    "shrimp",
    "crab",
    "lobster",
    "oyster",
    "clam",
    "mussel",
    "scallop",
  ],
  "gluten-free": [
    "wheat",
    "barley",
    "rye",
    "triticale",
    "spelt",
    "kamut",
    "semolina",
    "durum",
    "farina",
    "graham",
    "bulgur",
    "couscous",
    "seitan",
    "malt",
    "brewer's yeast",
    "wheat starch",
    "wheat bran",
    "wheat germ",
    "wheat flour",
    "bread",
    "pasta",
    "cereal",
    "cracker",
    "cookie",
    "cake",
    "pie",
    "pastry",
    "beer",
    "ale",
    "lager",
    "soy sauce",
    "teriyaki sauce",
    "hoisin sauce",
    "miso",
    "seitan",
  ],
  "intermittent-fasting": [
    "any food during fasting period",
    "caloric beverage during fasting period",
    "sugar",
    "milk",
    "cream",
    "honey",
    "syrup",
    "juice",
    "soda",
    "alcohol",
    "protein shake",
    "smoothie",
    "broth with added fat",
  ],
  "hindu-fasting": [
    "grain",
    "rice",
    "wheat",
    "millet",
    "corn",
    "onion",
    "garlic",
    "meat",
    "egg",
    "lentil",
    "common salt",
    "alcohol",
    "non-vegetarian food",
    "regular salt",
    "mustard oil",
    "sesame oil",
    "sunflower oil",
    "refined oil",
    "bread",
    "pasta",
    "noodle",
    "cereal",
    "all-purpose flour",
    "maida",
    "besan",
    "urad dal",
    "chana dal",
    "moong dal",
    "masoor dal",
    "toor dal",
  ],
  "jain-diet": [
    "meat",
    "egg",
    "honey",
    "root vegetable",
    "onion",
    "garlic",
    "potato",
    "carrot",
    "beetroot",
    "radish",
    "turmeric",
    "ginger",
    "underground vegetable",
    "fermented food",
    "alcohol",
    "mushroom",
    "eggplant",
    "brinjal",
    "green leafy vegetable at night",
    "curd at night",
    "milk at night",
    "sprouted grain",
    "sprouted legume",
    "food stored overnight",
  ],
  "sattvic-diet": [
    "meat",
    "egg",
    "fish",
    "onion",
    "garlic",
    "mushroom",
    "alcohol",
    "tobacco",
    "processed food",
    "stale food",
    "fried food",
    "spicy food",
    "sour food",
    "pungent food",
    "bitter food",
    "astringent food",
    "overripe fruit",
    "underripe fruit",
    "fermented food",
    "canned food",
    "frozen food",
    "microwaved food",
    "leftover food",
    "restaurant food",
    "fast food",
    "junk food",
    "refined sugar",
    "white flour",
    "artificial sweetener",
    "artificial flavor",
    "artificial color",
    "preservative",
    "caffeine",
    "chocolate",
    "vinegar",
  ],
  keto: [
    "sugar",
    "grain",
    "legume",
    "high-carb fruit",
    "high-carb vegetable",
    "tuber",
    "root vegetable",
    "low-fat dairy",
    "sweetener",
    "bread",
    "pasta",
    "rice",
    "cereal",
    "oatmeal",
    "corn",
    "potato",
    "sweet potato",
    "bean",
    "lentil",
    "chickpea",
    "pea",
    "banana",
    "apple",
    "orange",
    "grape",
    "mango",
    "pineapple",
    "watermelon",
    "honey",
    "maple syrup",
    "agave",
    "molasses",
    "jam",
    "jelly",
    "candy",
    "chocolate",
    "cake",
    "cookie",
    "ice cream",
    "soda",
    "juice",
    "milk chocolate",
    "low-fat yogurt",
    "skim milk",
  ],
  paleo: [
    "grain",
    "legume",
    "dairy",
    "refined sugar",
    "salt",
    "potato",
    "processed food",
    "wheat",
    "corn",
    "rice",
    "oat",
    "barley",
    "rye",
    "quinoa",
    "bean",
    "lentil",
    "peanut",
    "soybean",
    "chickpea",
    "milk",
    "cheese",
    "yogurt",
    "butter",
    "cream",
    "ice cream",
    "white sugar",
    "brown sugar",
    "corn syrup",
    "artificial sweetener",
    "candy",
    "chocolate",
    "cake",
    "cookie",
    "bread",
    "pasta",
    "cereal",
    "cracker",
    "chip",
    "vegetable oil",
    "margarine",
    "shortening",
    "artificial flavor",
    "artificial color",
    "preservative",
    "additive",
  ],
  whole30: [
    "sugar",
    "alcohol",
    "grain",
    "legume",
    "dairy",
    "carrageenan",
    "MSG",
    "sulfite",
    "processed food",
    "baked good",
    "junk food",
    "dessert",
    "added sugar",
    "artificial sweetener",
    "natural sweetener",
    "honey",
    "maple syrup",
    "agave",
    "stevia",
    "splenda",
    "equal",
    "sweet'n low",
    "wine",
    "beer",
    "liquor",
    "wheat",
    "corn",
    "rice",
    "oat",
    "barley",
    "rye",
    "quinoa",
    "bean",
    "lentil",
    "peanut",
    "soybean",
    "chickpea",
    "milk",
    "cheese",
    "yogurt",
    "butter",
    "cream",
    "ice cream",
    "bread",
    "pasta",
    "cereal",
    "cracker",
    "chip",
    "candy",
    "chocolate",
    "cake",
    "cookie",
  ],
  "low-fodmap": [
    "onion",
    "garlic",
    "wheat",
    "rye",
    "barley",
    "dairy",
    "legume",
    "certain fruit",
    "certain vegetable",
    "honey",
    "high-fructose corn syrup",
    "apple",
    "pear",
    "watermelon",
    "mango",
    "honey",
    "cauliflower",
    "mushroom",
    "bean",
    "lentil",
    "chickpea",
    "milk",
    "ice cream",
    "soft cheese",
    "yogurt",
    "custard",
    "artificial sweetener",
    "rum",
    "inulin",
    "fructan",
  ],
}

/**
 * Check if a food complies with a specific diet preference
 * @param foodName The name of the food
 * @param dietPreference The diet preference to check
 * @param properties Optional detailed properties of the food
 * @returns Boolean indicating if the food complies
 */
export function doesFoodComplyWithDiet(
  foodName: string,
  dietPreference: string,
  properties?: FoodDietProperties,
): boolean {
  // Convert food name to lowercase for comparison
  const lowerFoodName = foodName.toLowerCase()

  // If the diet preference is not recognized, assume the food complies
  if (
    !Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference) &&
    !Object.keys(DIET_AVOID_FOODS).includes(dietPreference)
  ) {
    return true
  }

  // Check if the food is in the avoid list for this diet
  if (Object.keys(DIET_AVOID_FOODS).includes(dietPreference)) {
    const avoidList = DIET_AVOID_FOODS[dietPreference as keyof typeof DIET_AVOID_FOODS]
    if (Array.isArray(avoidList) && avoidList.some((food) => lowerFoodName.includes(food))) {
      return false
    }
  }

  // Check if the food is in the allowed list for this diet
  if (Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference)) {
    const allowedList = DIET_ALLOWED_FOODS[dietPreference as keyof typeof DIET_ALLOWED_FOODS]

    // Handle special case for blood-type diet
    if (dietPreference === "blood-type") {
      // Default to type O if not specified
      const bloodType = properties?.bloodType || "O"
      const allowedForType = (allowedList as any)[bloodType]

      if (Array.isArray(allowedForType) && !allowedForType.some((food) => lowerFoodName.includes(food))) {
        return false
      }
    }
    // Handle special case for Indian regional diets
    else if (dietPreference === "indian-regional") {
      // Default to north if not specified
      const region = properties?.region || "north"
      const allowedForRegion = (allowedList as any)[region]

      if (Array.isArray(allowedForRegion) && !allowedForRegion.some((food) => lowerFoodName.includes(food))) {
        return false
      }
    }
    // Handle normal case
    else if (Array.isArray(allowedList) && !allowedList.some((food) => lowerFoodName.includes(food))) {
      return false
    }
  }

  // If detailed properties are provided, check them
  if (properties) {
    switch (dietPreference) {
      case "vegetarian":
        if (!properties.isVegetarian) {
          return false
        }
        break

      case "vegan":
        if (!properties.isVegan) {
          return false
        }
        break

      case "indian-vegetarian":
        if (!properties.isVegetarian || !properties.isEggFree) {
          return false
        }
        break

      case "eggetarian":
        if (!properties.isVegetarian || properties.isEggFree) {
          return false
        }
        break

      case "gluten-free":
        if (!properties.isGlutenFree) {
          return false
        }
        break

      case "jain-diet":
        if (
          !properties.isVegetarian ||
          !properties.isEggFree ||
          properties.containsOnionGarlic ||
          properties.containsRootVegetables
        ) {
          return false
        }
        break

      case "sattvic-diet":
        if (
          !properties.isVegetarian ||
          !properties.isEggFree ||
          properties.containsOnionGarlic ||
          properties.isProcessed ||
          properties.isFried ||
          properties.isHighGlycemic
        ) {
          return false
        }
        break

      case "keto":
        if (!properties.isLowCarb || !properties.isHighFat) {
          return false
        }
        break
    }
  }

  // If no issues found, the food complies with the diet
  return true
}

/**
 * Adjust a meal plan for a specific diet preference
 * @param mealPlan The original meal plan
 * @param dietPreference The diet preference
 * @returns Adjusted meal plan
 */
export function adjustMealPlanForDietPreference(mealPlan: any[], dietPreference: string): any[] {
  // If no diet preference, return the original plan
  if (!dietPreference) {
    return mealPlan
  }

  // Process each day in the meal plan
  return mealPlan.map((day) => {
    // Process each meal in the day
    const adjustedMeals = day.meals.map((meal: any) => {
      // Check if the meal complies with the diet
      const complies = doesFoodComplyWithDiet(meal.food, dietPreference)

      // If the meal complies, return it unchanged
      if (complies) {
        return meal
      }

      // If the meal doesn't comply, add a warning
      return {
        ...meal,
        warning: `This meal may not comply with your ${dietPreference} diet. Consider substituting with a ${dietPreference}-friendly alternative.`,
      }
    })

    return {
      ...day,
      meals: adjustedMeals,
    }
  })
}

/**
 * Get recommended foods for a specific diet preference
 * @param dietPreference The diet preference
 * @returns Array of recommended foods
 */
export function getRecommendedFoodsForDiet(dietPreference: string): string[] {
  if (Object.keys(DIET_ALLOWED_FOODS).includes(dietPreference)) {
    const allowedList = DIET_ALLOWED_FOODS[dietPreference as keyof typeof DIET_ALLOWED_FOODS]

    // Handle special cases
    if (dietPreference === "blood-type" || dietPreference === "indian-regional") {
      // Flatten all values for these special cases
      const allAllowed: string[] = []
      Object.values(allowedList as Record<string, string[]>).forEach((foods) => {
        allAllowed.push(...foods)
      })
      return [...new Set(allAllowed)] // Remove duplicates
    }

    return allowedList as string[]
  }
  return []
}

/**
 * Get scientifically accurate macronutrient ratios for different diet preferences
 * @param dietPreference The diet preference
 * @returns Object with macronutrient ratios
 */
export function getMacroRatiosForDiet(dietPreference: string): { protein: number; carbs: number; fat: number } {
  // Default balanced diet
  const defaultRatio = { protein: 0.25, carbs: 0.5, fat: 0.25 }

  switch (dietPreference) {
    case "keto":
      return { protein: 0.2, carbs: 0.05, fat: 0.75 }
    case "paleo":
      return { protein: 0.3, carbs: 0.4, fat: 0.3 }
    case "vegan":
    case "vegetarian":
    case "indian-vegetarian":
      return { protein: 0.2, carbs: 0.55, fat: 0.25 }
    case "mediterranean":
      return { protein: 0.2, carbs: 0.5, fat: 0.3 }
    case "gluten-free":
      return defaultRatio // Same as balanced
    case "intermittent-fasting":
      return defaultRatio // Depends on what you eat during eating window
    case "low-fodmap":
      return defaultRatio // Focus is on specific foods, not macros
    default:
      return defaultRatio
  }
}

/**
 * Get scientifically accurate calorie adjustments for different diet goals
 * @param dietGoal The diet goal
 * @param tdee Total Daily Energy Expenditure
 * @returns Adjusted calorie target
 */
export function getCalorieAdjustmentForGoal(dietGoal: string, tdee: number): number {
  switch (dietGoal) {
    case "weight-loss":
      return Math.round(tdee * 0.8) // 20% deficit
    case "weight-gain":
      return Math.round(tdee * 1.15) // 15% surplus
    case "muscle-building":
      return Math.round(tdee * 1.1) // 10% surplus
    case "lean-mass":
      return Math.round(tdee * 1.05) // 5% surplus
    case "keto":
      return Math.round(tdee * 0.9) // 10% deficit
    case "maintenance":
    default:
      return tdee
  }
}
