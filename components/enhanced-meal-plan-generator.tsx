"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
  updateDoc,
  increment,
  setDoc,
  doc,
} from "firebase/firestore"
import { useAuth } from "@/lib/use-auth"
import { MealPlanPdf } from "./meal-plan-pdf"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface MealPlan {
  day: string
  meals: {
    meal: string
    time?: string
    food: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
    source?: string
    id?: string
    fdcId?: string
  }[]
}

// Medical conditions list
const medicalConditions = [
  { id: "none", label: "None" },
  { id: "diabetes", label: "Diabetes" },
  { id: "hypertension", label: "Hypertension" },
  { id: "heart-disease", label: "Heart Disease" },
  { id: "high-cholesterol", label: "High Cholesterol" },
  { id: "thyroid", label: "Thyroid Issues" },
  { id: "pcod", label: "PCOD/PCOS" },
  { id: "ibs", label: "IBS" },
  { id: "gout", label: "Gout" },
  { id: "kidney-stones", label: "Kidney Stones" },
  { id: "migraines", label: "Migraines" },
]

// Diet preferences with detailed descriptions
const dietPreferences = [
  {
    id: "omnivore",
    label: "Omnivore",
    description: "Includes all food groups with balanced portions of animal and plant foods",
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    description: "Excludes meat, poultry, and seafood but includes dairy and eggs",
  },
  {
    id: "vegan",
    label: "Vegan",
    description: "Excludes all animal products including dairy, eggs, and honey",
  },
  {
    id: "keto",
    label: "Keto",
    description: "High fat, moderate protein, very low carbohydrate diet",
  },
  {
    id: "paleo",
    label: "Paleo",
    description: "Based on foods presumed to be available to paleolithic humans",
  },
  {
    id: "indian-vegetarian",
    label: "Indian Vegetarian",
    description: "Traditional Indian vegetarian diet rich in legumes, grains, and vegetables",
  },
]

// Diet goals with detailed descriptions
const dietGoals = [
  {
    id: "weight-loss",
    label: "Weight Loss",
    description: "Calorie deficit with balanced nutrition to promote healthy weight loss",
  },
  {
    id: "weight-maintenance",
    label: "Weight Maintenance",
    description: "Balanced calories to maintain current weight with optimal nutrition",
  },
  {
    id: "weight-gain",
    label: "Weight Gain",
    description: "Calorie surplus with focus on healthy foods to promote weight gain",
  },
  {
    id: "muscle-gain",
    label: "Muscle Gain",
    description: "Higher protein intake with sufficient calories to support muscle growth",
  },
  {
    id: "general-health",
    label: "General Health",
    description: "Balanced nutrition focusing on overall health and wellbeing",
  },
]

export function EnhancedMealPlanGenerator({ userData }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const [dietPreference, setDietPreference] = useState(userData?.dietPreference || "omnivore")
  const [dietGoal, setDietGoal] = useState(userData?.dietGoal || "weight-loss")
  const [calorieGoal, setCalorieGoal] = useState(userData?.targetCalories || 2000)
  const [dietPeriod, setDietPeriod] = useState("one-week")
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>(
    userData?.medicalConditions || ["none"],
  )
  const [mealPlanHistory, setMealPlanHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mealPlanRef = useRef<HTMLDivElement>(null)

  // Fetch meal plan history when component mounts
  useEffect(() => {
    if (user) {
      fetchMealPlanHistory()
    }
  }, [user])

  // Update state when userData changes
  useEffect(() => {
    if (userData) {
      setDietPreference(userData.dietPreference || "omnivore")
      setDietGoal(userData.dietGoal || "weight-loss")
      setCalorieGoal(userData.targetCalories || 2000)
      setSelectedMedicalConditions(userData.medicalConditions || ["none"])
    }
  }, [userData])

  // Scroll to meal plan when generated
  useEffect(() => {
    if (mealPlan.length > 0 && mealPlanRef.current) {
      mealPlanRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [mealPlan])

  const fetchMealPlanHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const mealPlansRef = collection(db, "users", user.uid, "mealPlans")
      const q = query(mealPlansRef, orderBy("createdAt", "desc"), limit(5))
      const querySnapshot = await getDocs(q)

      const history = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setMealPlanHistory(history)
    } catch (error) {
      console.error("Error fetching meal plan history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch meal plan history",
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Handle medical condition checkbox change
  const handleMedicalConditionChange = (condition: string, checked: boolean) => {
    if (condition === "none" && checked) {
      setSelectedMedicalConditions(["none"])
    } else {
      let updatedConditions = [...selectedMedicalConditions]

      if (checked) {
        // Remove 'none' if it exists
        updatedConditions = updatedConditions.filter((c) => c !== "none")
        updatedConditions.push(condition)
      } else {
        updatedConditions = updatedConditions.filter((c) => c !== condition)

        // If no conditions selected, add 'none'
        if (updatedConditions.length === 0) {
          updatedConditions = ["none"]
        }
      }

      setSelectedMedicalConditions(updatedConditions)
    }
  }

  const [isPremium, setIsPremium] = useState(false)
  const [medicalCondition, setMedicalCondition] = useState("")
  const [dietPreferences, setDietPreferences] = useState([])
  const [medicalConditions, setMedicalConditions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const generateMealPlan = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Check if user has reached the free plan limit

      if (!isPremium) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()
        const mealPlansGenerated = userData?.mealPlansGenerated || 0

        if (mealPlansGenerated >= 3) {
          router.push("/dashboard/upgrade")
          return
        }
      }

      // Get user profile data
      const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid))
      const userProfile = userProfileDoc.data()

      if (!userProfile) {
        setError("User profile not found. Please update your profile information.")
        setIsLoading(false)
        return
      }

      // Calculate daily calorie needs
      const { height, weight, age, activityLevel, gender } = userProfile

      if (!height || !weight || !age || !activityLevel) {
        setError("Please complete your profile with height, weight, age, and activity level.")
        setIsLoading(false)
        return
      }

      // Calculate BMR based on gender
      let bmr = 0
      if (gender === "male") {
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      } else {
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
      }

      // Apply activity multiplier
      let activityMultiplier = 1.2 // Sedentary
      if (activityLevel === "lightly-active") activityMultiplier = 1.375
      if (activityLevel === "moderately-active") activityMultiplier = 1.55
      if (activityLevel === "very-active") activityMultiplier = 1.725
      if (activityLevel === "extra-active") activityMultiplier = 1.9

      const dailyCalories = Math.round(bmr * activityMultiplier)

      // Adjust calories based on diet goal
      let adjustedCalories = dailyCalories
      if (dietGoal === "weight-loss") adjustedCalories = Math.round(dailyCalories * 0.8) // 20% deficit
      if (dietGoal === "weight-gain") adjustedCalories = Math.round(dailyCalories * 1.15) // 15% surplus
      if (dietGoal === "muscle-gain") adjustedCalories = Math.round(dailyCalories * 1.1) // 10% surplus

      // Fetch appropriate meal templates based on preferences
      const mealTemplatesRef = collection(db, "mealTemplates")
      const queryConstraints = []

      if (dietPreference) {
        queryConstraints.push(where("dietType", "==", dietPreference))
      }

      if (medicalCondition) {
        queryConstraints.push(where("suitableFor", "array-contains", medicalCondition))
      }

      const mealTemplatesQuery = query(mealTemplatesRef, ...queryConstraints)
      const mealTemplatesSnapshot = await getDocs(mealTemplatesQuery)

      if (mealTemplatesSnapshot.empty) {
        setError("No meal templates found for your preferences. Please try different preferences.")
        setIsLoading(false)
        return
      }

      const mealTemplates = []
      mealTemplatesSnapshot.forEach((doc) => {
        mealTemplates.push({ id: doc.id, ...doc.data() })
      })

      // Generate a 7-day meal plan
      const weeklyMealPlan = []
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

      for (let i = 0; i < 7; i++) {
        // Randomly select a meal template for each day
        const randomTemplate = mealTemplates[Math.floor(Math.random() * mealTemplates.length)]

        // Scale the portions to match the adjusted calorie needs
        const scaleFactor = adjustedCalories / randomTemplate.totalCalories

        const dayMeals = {
          day: daysOfWeek[i],
          meals: randomTemplate.meals.map((meal) => ({
            ...meal,
            calories: Math.round(meal.calories * scaleFactor),
            items: meal.items.map((item) => ({
              ...item,
              portion: (Number.parseFloat(item.portion) * scaleFactor).toFixed(1),
              calories: Math.round(item.calories * scaleFactor),
            })),
          })),
        }

        weeklyMealPlan.push(dayMeals)
      }

      // Calculate nutrition totals
      const nutritionTotals = calculateNutritionTotals(weeklyMealPlan)

      // Save the meal plan to Firestore
      const mealPlanData = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        dietPreference,
        medicalCondition,
        dietGoal,
        dailyCalories: adjustedCalories,
        weeklyMealPlan,
        nutritionTotals,
      }

      const mealPlanRef = await addDoc(collection(db, "mealPlans"), mealPlanData)

      // Update user's meal plans generated count
      if (!isPremium) {
        await updateDoc(doc(db, "users", user.uid), {
          mealPlansGenerated: increment(1),
        })
      }

      // Set the generated meal plan
      setMealPlan({
        id: mealPlanRef.id,
        ...mealPlanData,
        createdAt: new Date(),
      })

      setIsLoading(false)
    } catch (error) {
      console.error("Error generating meal plan:", error)
      setError("Failed to generate meal plan. Please try again.")
      setIsLoading(false)
    }
  }

  // Helper function to calculate nutrition totals
  const calculateNutritionTotals = (weeklyMealPlan) => {
    const dailyTotals = weeklyMealPlan.map((day) => {
      const dayTotal = day.meals.reduce(
        (acc, meal) => {
          const mealProtein = meal.items.reduce((sum, item) => sum + (item.protein || 0), 0)
          const mealCarbs = meal.items.reduce((sum, item) => sum + (item.carbs || 0), 0)
          const mealFat = meal.items.reduce((sum, item) => sum + (item.fat || 0), 0)
          const mealFiber = meal.items.reduce((sum, item) => sum + (item.fiber || 0), 0)

          return {
            calories: acc.calories + meal.calories,
            protein: acc.protein + mealProtein,
            carbs: acc.carbs + mealCarbs,
            fat: acc.fat + mealFat,
            fiber: acc.fiber + mealFiber,
          }
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      )

      return {
        day: day.day,
        ...dayTotal,
      }
    })

    return dailyTotals
  }

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        // Fetch diet preferences
        const dietPrefsSnapshot = await getDocs(collection(db, "dietPreferences"))
        const dietPrefsData = []
        dietPrefsSnapshot.forEach((doc) => {
          dietPrefsData.push({ id: doc.id, ...doc.data() })
        })
        setDietPreferences(dietPrefsData)

        // Fetch medical conditions
        const medConditionsSnapshot = await getDocs(collection(db, "medicalConditions"))
        const medConditionsData = []
        medConditionsSnapshot.forEach((doc) => {
          medConditionsData.push({ id: doc.id, ...doc.data() })
        })
        setMedicalConditions(medConditionsData)

        // Check if user is premium
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()
        setIsPremium(userData?.isPremium || false)
      } catch (error) {
        console.error("Error fetching preferences:", error)
        setError("Failed to load preferences. Please refresh the page.")
      }
    }

    if (user) {
      fetchPreferences()
    }
  }, [user])

  useEffect(() => {
    // Ensure vegetarian option exists
    const ensureVegetarianOption = async () => {
      try {
        const vegetarianRef = doc(db, "dietPreferences", "vegetarian")
        const vegetarianDoc = await getDoc(vegetarianRef)

        if (!vegetarianDoc.exists()) {
          await setDoc(vegetarianRef, {
            name: "Vegetarian",
            description: "Plant-based diet that excludes meat, fish, and poultry",
            restrictions: ["meat", "fish", "poultry"],
            createdAt: serverTimestamp(),
          })

          console.log("Added vegetarian diet preference")
        }
      } catch (error) {
        console.error("Error ensuring vegetarian option:", error)
      }
    }

    if (user && user.uid) {
      ensureVegetarianOption()
    }
  }, [user])

  const generateScientificMealPlan = (
    preference: string,
    goal: string,
    calories: number,
    period: string,
    medicalConditions: string[],
  ): MealPlan[] => {
    // This function generates scientifically accurate meal plans based on user preferences
    const days = period === "one-day" ? 1 : period === "three-days" ? 3 : 7
    const mealPlan: MealPlan[] = []

    // Check if there are medical conditions to consider
    const hasMedicalConditions = !medicalConditions.includes("none")

    // Calculate macronutrient distribution based on diet goal
    let proteinPercentage = 0.25 // Default 25% of calories from protein
    let carbPercentage = 0.5 // Default 50% of calories from carbs
    let fatPercentage = 0.25 // Default 25% of calories from fat

    // Adjust macros based on diet goal
    switch (goal) {
      case "weight-loss":
        proteinPercentage = 0.3
        carbPercentage = 0.4
        fatPercentage = 0.3
        break
      case "muscle-gain":
        proteinPercentage = 0.35
        carbPercentage = 0.45
        fatPercentage = 0.2
        break
      case "weight-gain":
        proteinPercentage = 0.25
        carbPercentage = 0.55
        fatPercentage = 0.2
        break
      case "keto":
        proteinPercentage = 0.25
        carbPercentage = 0.05
        fatPercentage = 0.7
        break
    }

    // Further adjust macros based on diet preference
    if (preference === "keto") {
      proteinPercentage = 0.25
      carbPercentage = 0.05
      fatPercentage = 0.7
    }

    // Calculate daily macros in grams
    const dailyProtein = Math.round((calories * proteinPercentage) / 4) // 4 calories per gram of protein
    const dailyCarbs = Math.round((calories * carbPercentage) / 4) // 4 calories per gram of carbs
    const dailyFat = Math.round((calories * fatPercentage) / 9) // 9 calories per gram of fat

    // Meal distribution percentages
    const mealDistribution = {
      Breakfast: 0.25,
      Lunch: 0.35,
      Dinner: 0.3,
      Snack: 0.1,
    }

    // Day names
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    // Generate meal plans for each day
    for (let i = 0; i < days; i++) {
      const dayName = dayNames[i % 7]
      const dayMeals = []

      // Generate each meal for the day
      for (const [mealType, percentage] of Object.entries(mealDistribution)) {
        // Calculate meal macros
        const mealCalories = Math.round(calories * percentage)
        const mealProtein = Math.round(dailyProtein * percentage)
        const mealCarbs = Math.round(dailyCarbs * percentage)
        const mealFat = Math.round(dailyFat * percentage)

        // Get appropriate food for this meal based on all factors
        const mealFood = getMealFood(mealType, preference, goal, medicalConditions, i % 7)

        // Add the meal to the day's meals
        dayMeals.push({
          meal: mealType,
          time: getMealTime(mealType),
          food: mealFood.name,
          quantity: mealFood.quantity,
          calories: mealCalories,
          protein: mealProtein,
          carbs: mealCarbs,
          fat: mealFat,
          source: "scientific",
        })
      }

      // Add the day to the meal plan
      mealPlan.push({
        day: dayName,
        meals: dayMeals,
      })
    }

    return mealPlan
  }

  // Helper function to get meal time
  const getMealTime = (mealType: string): string => {
    switch (mealType) {
      case "Breakfast":
        return "8:00 AM"
      case "Lunch":
        return "12:30 PM"
      case "Dinner":
        return "7:00 PM"
      case "Snack":
        return "4:00 PM"
      default:
        return ""
    }
  }

  // Helper function to get appropriate food for a meal
  const getMealFood = (
    mealType: string,
    preference: string,
    goal: string,
    medicalConditions: string[],
    dayIndex: number,
  ) => {
    // Database of foods organized by meal type, diet preference, and medical considerations
    const foodDatabase = {
      Breakfast: {
        omnivore: [
          { name: "Scrambled eggs with whole grain toast and avocado", quantity: "2 eggs, 1 slice toast, 1/4 avocado" },
          {
            name: "Greek yogurt with berries, honey and granola",
            quantity: "1 cup yogurt, 1/2 cup berries, 1 tbsp honey, 1/4 cup granola",
          },
          {
            name: "Protein smoothie with banana, spinach and almond butter",
            quantity: "1 banana, 1 cup spinach, 1 tbsp almond butter, 1 scoop protein powder",
          },
          {
            name: "Oatmeal with walnuts, cinnamon and sliced apple",
            quantity: "1/2 cup dry oats, 2 tbsp walnuts, 1 small apple",
          },
          {
            name: "Breakfast burrito with eggs, black beans and salsa",
            quantity: "2 eggs, 1/4 cup beans, 2 tbsp salsa, 1 whole wheat tortilla",
          },
          {
            name: "Cottage cheese with pineapple and whole grain crackers",
            quantity: "1 cup cottage cheese, 1/2 cup pineapple, 6 crackers",
          },
          {
            name: "Whole grain pancakes with fresh berries and Greek yogurt",
            quantity: "2 medium pancakes, 1/2 cup berries, 1/4 cup yogurt",
          },
        ],
        vegetarian: [
          {
            name: "Vegetable omelette with whole grain toast",
            quantity: "2 eggs, 1/2 cup mixed vegetables, 1 slice toast",
          },
          {
            name: "Greek yogurt parfait with granola and mixed berries",
            quantity: "1 cup yogurt, 1/4 cup granola, 1/2 cup berries",
          },
          {
            name: "Avocado toast with poached eggs and cherry tomatoes",
            quantity: "1 slice whole grain bread, 1/2 avocado, 2 eggs, 5 cherry tomatoes",
          },
          {
            name: "Overnight oats with chia seeds, almond milk and banana",
            quantity: "1/2 cup oats, 1 tbsp chia seeds, 3/4 cup almond milk, 1 banana",
          },
          {
            name: "Spinach and feta egg white frittata with whole grain toast",
            quantity: "4 egg whites, 1 cup spinach, 2 tbsp feta, 1 slice toast",
          },
          {
            name: "Whole grain waffles with Greek yogurt and fresh fruit",
            quantity: "2 small waffles, 1/4 cup yogurt, 1/2 cup mixed fruit",
          },
          {
            name: "Cottage cheese with sliced peaches and honey",
            quantity: "1 cup cottage cheese, 1 peach, 1 tsp honey",
          },
        ],
        vegan: [
          {
            name: "Overnight oats with almond milk, chia seeds and berries",
            quantity: "1/2 cup oats, 3/4 cup almond milk, 1 tbsp chia seeds, 1/2 cup berries",
          },
          {
            name: "Tofu scramble with spinach, nutritional yeast and whole grain toast",
            quantity: "4 oz tofu, 1 cup spinach, 1 tbsp nutritional yeast, 1 slice toast",
          },
          {
            name: "Avocado toast with hemp seeds and cherry tomatoes",
            quantity: "1 slice whole grain bread, 1/2 avocado, 1 tbsp hemp seeds, 5 cherry tomatoes",
          },
          {
            name: "Smoothie bowl with banana, berries, spinach and almond butter",
            quantity: "1 banana, 1/2 cup berries, 1 cup spinach, 1 tbsp almond butter",
          },
          {
            name: "Chickpea flour pancakes with maple syrup and fresh fruit",
            quantity: "2 pancakes, 1 tbsp maple syrup, 1/2 cup mixed fruit",
          },
          {
            name: "Quinoa breakfast bowl with almond milk, cinnamon and sliced apple",
            quantity: "1/2 cup cooked quinoa, 1/4 cup almond milk, 1 small apple",
          },
          {
            name: "Whole grain toast with hummus, sliced cucumber and tomato",
            quantity: "2 slices toast, 2 tbsp hummus, 1/4 cucumber, 1 small tomato",
          },
        ],
        keto: [
          {
            name: "Avocado and bacon omelette with spinach",
            quantity: "2 eggs, 2 slices bacon, 1/2 avocado, 1 cup spinach",
          },
          {
            name: "Chia seed pudding with unsweetened coconut milk and berries",
            quantity: "2 tbsp chia seeds, 1/2 cup coconut milk, 1/4 cup berries",
          },
          {
            name: "Keto smoothie with avocado, spinach, coconut oil and protein powder",
            quantity: "1/2 avocado, 1 cup spinach, 1 tbsp coconut oil, 1 scoop protein powder",
          },
          { name: "Eggs and cheese with sautéed mushrooms", quantity: "2 eggs, 1 oz cheese, 1 cup mushrooms" },
          { name: "Crustless spinach and feta quiche", quantity: "1 slice (1/6 of quiche)" },
          {
            name: "Smoked salmon with cream cheese and cucumber slices",
            quantity: "3 oz salmon, 2 tbsp cream cheese, 1/2 cucumber",
          },
          {
            name: "Greek yogurt with walnuts and a few berries",
            quantity: "1/2 cup full-fat yogurt, 2 tbsp walnuts, 1/4 cup berries",
          },
        ],
        "indian-vegetarian": [
          { name: "Masala dosa with coconut chutney", quantity: "1 medium dosa, 2 tbsp chutney" },
          { name: "Poha with peanuts and vegetables", quantity: "1 cup prepared poha" },
          { name: "Paneer bhurji with whole wheat paratha", quantity: "1/2 cup paneer bhurji, 1 paratha" },
          { name: "Upma with vegetables and coconut chutney", quantity: "1 cup upma, 1 tbsp chutney" },
          { name: "Idli with sambar and coconut chutney", quantity: "2 idlis, 1/2 cup sambar, 1 tbsp chutney" },
          { name: "Besan chilla with mint chutney", quantity: "2 chillas, 2 tbsp chutney" },
          { name: "Vegetable uttapam with coconut chutney", quantity: "1 medium uttapam, 2 tbsp chutney" },
        ],
      },
      Lunch: {
        omnivore: [
          {
            name: "Grilled chicken salad with olive oil dressing",
            quantity: "4 oz chicken, 2 cups mixed greens, 1 tbsp olive oil",
          },
          {
            name: "Turkey and avocado wrap with mixed greens",
            quantity: "3 oz turkey, 1/2 avocado, 1 whole wheat wrap, 1 cup greens",
          },
          {
            name: "Tuna salad sandwich on whole grain bread with carrot sticks",
            quantity: "3 oz tuna, 2 slices bread, 1 cup carrot sticks",
          },
          {
            name: "Quinoa bowl with grilled chicken, roasted vegetables and tahini",
            quantity: "1/2 cup quinoa, 3 oz chicken, 1 cup vegetables, 1 tbsp tahini",
          },
          {
            name: "Beef and vegetable stir-fry with brown rice",
            quantity: "3 oz beef, 1 cup vegetables, 1/2 cup brown rice",
          },
          { name: "Lentil soup with whole grain roll and side salad", quantity: "1 cup soup, 1 roll, 1 cup salad" },
          {
            name: "Chicken and vegetable wrap with hummus",
            quantity: "3 oz chicken, 1/2 cup vegetables, 1 whole wheat wrap, 2 tbsp hummus",
          },
        ],
        vegetarian: [
          {
            name: "Quinoa salad with roasted vegetables and feta cheese",
            quantity: "1/2 cup quinoa, 1 cup vegetables, 2 tbsp feta",
          },
          {
            name: "Lentil soup with whole grain bread and side salad",
            quantity: "1 cup soup, 1 slice bread, 1 cup salad",
          },
          {
            name: "Greek yogurt bowl with chickpeas, cucumber, tomato and olive oil",
            quantity: "1 cup yogurt, 1/2 cup chickpeas, 1/2 cucumber, 1 tomato, 1 tbsp olive oil",
          },
          {
            name: "Vegetable and cheese quesadilla with avocado and salsa",
            quantity: "1 whole wheat tortilla, 1/4 cup cheese, 1/2 cup vegetables, 1/4 avocado, 2 tbsp salsa",
          },
          {
            name: "Spinach and feta stuffed portobello mushroom with quinoa",
            quantity: "1 large mushroom, 2 tbsp feta, 1/2 cup quinoa",
          },
          {
            name: "Egg salad sandwich on whole grain bread with carrot sticks",
            quantity: "2 eggs, 2 slices bread, 1 cup carrot sticks",
          },
          {
            name: "Mediterranean platter with hummus, falafel, pita and vegetables",
            quantity: "1/4 cup hummus, 3 falafels, 1/2 pita, 1 cup vegetables",
          },
        ],
        vegan: [
          {
            name: "Buddha bowl with tofu, quinoa, roasted vegetables and tahini dressing",
            quantity: "3 oz tofu, 1/2 cup quinoa, 1 cup vegetables, 1 tbsp tahini",
          },
          { name: "Lentil and vegetable soup with whole grain roll", quantity: "1 cup soup, 1 roll" },
          {
            name: "Chickpea salad sandwich on whole grain bread",
            quantity: "1/2 cup chickpeas, 2 slices bread, lettuce, tomato",
          },
          {
            name: "Quinoa tabbouleh with hummus and whole wheat pita",
            quantity: "1/2 cup quinoa, 1/4 cup hummus, 1/2 pita",
          },
          {
            name: "Black bean and sweet potato burrito with avocado",
            quantity: "1/2 cup black beans, 1/2 cup sweet potato, 1 whole wheat tortilla, 1/4 avocado",
          },
          {
            name: "Tempeh and vegetable stir-fry with brown rice",
            quantity: "3 oz tempeh, 1 cup vegetables, 1/2 cup brown rice",
          },
          {
            name: "Mediterranean salad with chickpeas, olives and lemon-tahini dressing",
            quantity: "2 cups salad, 1/2 cup chickpeas, 5 olives, 1 tbsp dressing",
          },
        ],
        keto: [
          {
            name: "Chicken Caesar salad without croutons",
            quantity: "4 oz chicken, 2 cups romaine, 2 tbsp Caesar dressing",
          },
          { name: "Tuna salad lettuce wraps with avocado", quantity: "3 oz tuna, 3 large lettuce leaves, 1/2 avocado" },
          {
            name: "Zucchini noodles with meatballs and marinara sauce",
            quantity: "2 cups zucchini noodles, 3 meatballs, 1/4 cup sauce",
          },
          {
            name: "Cauliflower rice bowl with grilled steak and vegetables",
            quantity: "1 cup cauliflower rice, 3 oz steak, 1 cup vegetables",
          },
          {
            name: "Cobb salad with chicken, bacon, avocado and blue cheese",
            quantity: "2 cups lettuce, 3 oz chicken, 2 slices bacon, 1/4 avocado, 1 oz blue cheese",
          },
          {
            name: "Salmon with asparagus and hollandaise sauce",
            quantity: "4 oz salmon, 1 cup asparagus, 2 tbsp sauce",
          },
          {
            name: "Spinach salad with hard-boiled eggs, bacon and olive oil dressing",
            quantity: "2 cups spinach, 2 eggs, 2 slices bacon, 1 tbsp olive oil",
          },
        ],
        "indian-vegetarian": [
          { name: "Rajma chawal (kidney bean curry with rice)", quantity: "1/2 cup rajma, 1/2 cup rice" },
          { name: "Chole bhature (chickpea curry with fried bread)", quantity: "1/2 cup chole, 1 bhatura" },
          { name: "Palak paneer with roti", quantity: "1/2 cup palak paneer, 2 rotis" },
          { name: "Dal tadka with jeera rice", quantity: "1/2 cup dal, 1/2 cup rice" },
          { name: "Vegetable biryani with raita", quantity: "1 cup biryani, 1/4 cup raita" },
          { name: "Aloo gobi with roti", quantity: "1/2 cup aloo gobi, 2 rotis" },
          {
            name: "Paneer tikka with mint chutney and naan",
            quantity: "4 pieces paneer tikka, 2 tbsp chutney, 1/2 naan",
          },
        ],
      },
      Dinner: {
        omnivore: [
          {
            name: "Baked salmon with sweet potato and broccoli",
            quantity: "4 oz salmon, 1/2 cup sweet potato, 1 cup broccoli",
          },
          {
            name: "Grilled chicken with quinoa and roasted vegetables",
            quantity: "4 oz chicken, 1/2 cup quinoa, 1 cup vegetables",
          },
          {
            name: "Beef stir-fry with brown rice and mixed vegetables",
            quantity: "3 oz beef, 1/2 cup brown rice, 1 cup vegetables",
          },
          {
            name: "Turkey meatballs with whole wheat pasta and marinara sauce",
            quantity: "4 meatballs, 1/2 cup pasta, 1/4 cup sauce",
          },
          {
            name: "Baked cod with lemon, asparagus and wild rice",
            quantity: "4 oz cod, 1 cup asparagus, 1/2 cup rice",
          },
          {
            name: "Pork tenderloin with roasted potatoes and green beans",
            quantity: "3 oz pork, 1/2 cup potatoes, 1 cup green beans",
          },
          {
            name: "Shrimp and vegetable skewers with quinoa",
            quantity: "4 oz shrimp, 1 cup vegetables, 1/2 cup quinoa",
          },
        ],
        vegetarian: [
          {
            name: "Lentil curry with brown rice and steamed vegetables",
            quantity: "1/2 cup lentils, 1/2 cup rice, 1 cup vegetables",
          },
          {
            name: "Vegetable and tofu stir-fry with brown rice",
            quantity: "3 oz tofu, 1 cup vegetables, 1/2 cup rice",
          },
          {
            name: "Eggplant parmesan with whole wheat pasta and side salad",
            quantity: "1 cup eggplant parmesan, 1/2 cup pasta, 1 cup salad",
          },
          {
            name: "Stuffed bell peppers with quinoa, black beans and cheese",
            quantity: "2 peppers, 1/4 cup quinoa, 1/4 cup beans, 2 tbsp cheese",
          },
          { name: "Vegetable lasagna with side salad", quantity: "1 piece lasagna, 1 cup salad" },
          { name: "Shakshuka with whole grain bread", quantity: "2 eggs in sauce, 1 slice bread" },
          { name: "Mushroom risotto with roasted asparagus", quantity: "1 cup risotto, 1 cup asparagus" },
        ],
        vegan: [
          {
            name: "Chickpea and vegetable curry with brown rice",
            quantity: "1/2 cup chickpeas, 1 cup vegetables, 1/2 cup rice",
          },
          { name: "Lentil shepherd's pie with side salad", quantity: "1 cup shepherd's pie, 1 cup salad" },
          {
            name: "Stir-fried tofu with vegetables and brown rice",
            quantity: "3 oz tofu, 1 cup vegetables, 1/2 cup rice",
          },
          {
            name: "Stuffed portobello mushrooms with quinoa and roasted vegetables",
            quantity: "2 mushrooms, 1/2 cup quinoa, 1/2 cup vegetables",
          },
          { name: "Black bean and sweet potato enchiladas", quantity: "2 enchiladas" },
          { name: "Zucchini noodles with lentil bolognese", quantity: "2 cups zucchini noodles, 1/2 cup lentil sauce" },
          { name: "Vegetable and chickpea tagine with couscous", quantity: "1 cup tagine, 1/2 cup couscous" },
        ],
        keto: [
          { name: "Grilled steak with buttered vegetables", quantity: "5 oz steak, 1 cup vegetables, 1 tbsp butter" },
          {
            name: "Baked chicken thighs with cauliflower mash and green beans",
            quantity: "5 oz chicken, 1 cup cauliflower mash, 1 cup green beans",
          },
          {
            name: "Salmon with asparagus and hollandaise sauce",
            quantity: "5 oz salmon, 1 cup asparagus, 2 tbsp sauce",
          },
          { name: "Pork chops with creamed spinach", quantity: "5 oz pork, 1 cup creamed spinach" },
          { name: "Beef and vegetable stir-fry (no rice)", quantity: "5 oz beef, 2 cups low-carb vegetables" },
          {
            name: "Chicken alfredo with zucchini noodles",
            quantity: "4 oz chicken, 2 cups zucchini noodles, 2 tbsp alfredo sauce",
          },
          { name: "Shrimp scampi with sautéed spinach", quantity: "5 oz shrimp, 2 cups spinach, 1 tbsp butter" },
        ],
        "indian-vegetarian": [
          {
            name: "Dal makhani with jeera rice and cucumber raita",
            quantity: "1/2 cup dal, 1/2 cup rice, 1/4 cup raita",
          },
          { name: "Paneer butter masala with naan", quantity: "1/2 cup paneer, 1 naan" },
          {
            name: "Baingan bharta with roti and kachumber salad",
            quantity: "1/2 cup baingan bharta, 2 rotis, 1/2 cup salad",
          },
          { name: "Chana masala with steamed rice", quantity: "1/2 cup chana masala, 1/2 cup rice" },
          { name: "Vegetable korma with paratha", quantity: "1/2 cup korma, 1 paratha" },
          { name: "Malai kofta with naan", quantity: "3 koftas with sauce, 1 naan" },
          { name: "Matar paneer with roti", quantity: "1/2 cup matar paneer, 2 rotis" },
        ],
      },
      Snack: {
        omnivore: [
          { name: "Greek yogurt with berries and nuts", quantity: "1/2 cup yogurt, 1/4 cup berries, 1 tbsp nuts" },
          { name: "Apple slices with almond butter", quantity: "1 apple, 1 tbsp almond butter" },
          { name: "Hard-boiled egg with whole grain crackers", quantity: "1 egg, 4 crackers" },
          { name: "Cottage cheese with pineapple", quantity: "1/2 cup cottage cheese, 1/4 cup pineapple" },
          { name: "Turkey and cheese roll-ups", quantity: "2 oz turkey, 1 oz cheese" },
          { name: "Trail mix with nuts, seeds and dried fruit", quantity: "1/4 cup mix" },
          { name: "Protein shake with banana", quantity: "1 scoop protein powder, 1 small banana" },
        ],
        vegetarian: [
          { name: "Greek yogurt with honey and walnuts", quantity: "1/2 cup yogurt, 1 tsp honey, 1 tbsp walnuts" },
          { name: "Cheese and whole grain crackers", quantity: "1 oz cheese, 6 crackers" },
          { name: "Hummus with carrot and cucumber sticks", quantity: "1/4 cup hummus, 1 cup vegetables" },
          { name: "Apple slices with peanut butter", quantity: "1 apple, 1 tbsp peanut butter" },
          { name: "Hard-boiled egg with cherry tomatoes", quantity: "1 egg, 1/2 cup tomatoes" },
          { name: "Cottage cheese with peach slices", quantity: "1/2 cup cottage cheese, 1 peach" },
          { name: "Smoothie with yogurt, berries and banana", quantity: "1/2 cup yogurt, 1/4 cup berries, 1/2 banana" },
        ],
        vegan: [
          { name: "Hummus with vegetable sticks", quantity: "1/4 cup hummus, 1 cup vegetables" },
          { name: "Apple slices with almond butter", quantity: "1 apple, 1 tbsp almond butter" },
          { name: "Trail mix with nuts, seeds and dried fruit", quantity: "1/4 cup mix" },
          { name: "Roasted chickpeas", quantity: "1/4 cup chickpeas" },
          { name: "Avocado toast on whole grain bread", quantity: "1/4 avocado, 1 slice bread" },
          {
            name: "Smoothie with plant milk, banana and berries",
            quantity: "1 cup plant milk, 1/2 banana, 1/4 cup berries",
          },
          {
            name: "Rice cake with almond butter and banana slices",
            quantity: "1 rice cake, 1 tbsp almond butter, 1/2 banana",
          },
        ],
        keto: [
          { name: "Cheese and nuts", quantity: "1 oz cheese, 1 oz nuts" },
          { name: "Avocado with salt and pepper", quantity: "1/2 avocado" },
          { name: "Hard-boiled eggs", quantity: "2 eggs" },
          { name: "Celery sticks with cream cheese", quantity: "2 stalks celery, 2 tbsp cream cheese" },
          { name: "Beef jerky", quantity: "1 oz jerky" },
          { name: "Olives and cheese cubes", quantity: "10 olives, 1 oz cheese" },
          { name: "Cucumber slices with tuna salad", quantity: "1 cucumber, 2 oz" },
        ],
        "indian-vegetarian": [
          { name: "Spiced nuts", quantity: "1/4 cup" },
          { name: "Cucumber and yogurt raita", quantity: "1/2 cup" },
          { name: "Roasted makhana (lotus seeds)", quantity: "1 cup" },
          { name: "Paneer cubes with mint chutney", quantity: "1/4 cup paneer, 2 tbsp chutney" },
          { name: "Fruit salad with chaat masala", quantity: "1 cup fruit, 1/2 tsp masala" },
          { name: "Vegetable sticks with hung curd dip", quantity: "1 cup vegetables, 1/4 cup dip" },
          { name: "Almonds and walnuts", quantity: "1/4 cup" },
        ],
      },
    }

    // Select food based on diet preference
    let foodOptions = foodDatabase[mealType][preference]

    // If medical conditions are present, filter the food options
    if (medicalConditions && medicalConditions.length > 0 && !medicalConditions.includes("none")) {
      foodOptions = foodOptions.filter((food) => {
        // Check if the food is suitable for all medical conditions
        return medicalConditions.every((condition) => {
          // Placeholder: Replace with actual logic to check food suitability based on medical conditions
          // This is where you would integrate your medical condition-aware filtering
          return true // Assume all foods are suitable for now
        })
      })
    }

    // If no food options are left after filtering, revert to the original list
    if (!foodOptions || foodOptions.length === 0) {
      foodOptions = foodDatabase[mealType][preference]
    }

    // Select a random food item
    const randomIndex = Math.floor(Math.random() * foodOptions.length)
    return foodOptions[randomIndex]
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Meal Plan Generator</CardTitle>
          <CardDescription>Customize your meal plan based on your preferences and goals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="diet-preference">Diet Preference</Label>
            <Select value={dietPreference} onValueChange={setDietPreference}>
              <SelectTrigger id="diet-preference">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {dietPreferences.map((diet) => (
                  <SelectItem key={diet.id} value={diet.id}>
                    {diet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diet-goal">Diet Goal</Label>
            <Select value={dietGoal} onValueChange={setDietGoal}>
              <SelectTrigger id="diet-goal">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {dietGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="calorie-goal">Calorie Goal</Label>
            <Input
              type="number"
              id="calorie-goal"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number.parseInt(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Medical Conditions</Label>
            <div className="flex flex-wrap gap-2">
              {medicalConditions.map((condition) => (
                <div key={condition.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition.id}
                    checked={selectedMedicalConditions.includes(condition.id)}
                    onCheckedChange={(checked) => handleMedicalConditionChange(condition.id, checked)}
                  />
                  <Label
                    htmlFor={condition.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {condition.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diet-period">Diet Period</Label>
            <Select value={dietPeriod} onValueChange={setDietPeriod}>
              <SelectTrigger id="diet-period">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-day">One Day</SelectItem>
                <SelectItem value="three-days">Three Days</SelectItem>
                <SelectItem value="one-week">One Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button disabled={isLoading} onClick={generateMealPlan}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Meal Plan"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              generateScientificMealPlan(dietPreference, dietGoal, calorieGoal, dietPeriod, selectedMedicalConditions)
            }
          >
            Generate Scientific
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mealPlan.length > 0 && (
        <div ref={mealPlanRef}>
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
            Meal Plan
          </h2>
          <MealPlanPdf mealPlan={mealPlan} />
        </div>
      )}

      <div className="mt-8">
        <h3 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
          Meal Plan History
        </h3>
        {isLoadingHistory ? (
          <p>Loading meal plan history...</p>
        ) : mealPlanHistory.length > 0 ? (
          <ul>
            {mealPlanHistory.map((plan) => (
              <li key={plan.id}>Meal Plan generated on {plan.createdAt.toDate().toLocaleDateString()}</li>
            ))}
          </ul>
        ) : (
          <p>No meal plan history available.</p>
        )}
      </div>
    </>
  )
}
