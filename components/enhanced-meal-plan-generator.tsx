"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, Info, Calculator } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore"
import { useAuth } from "@/lib/use-auth"
import { MealPlanPdf } from "./meal-plan-pdf"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    tags?: string[]
    description?: string
    ingredients?: string[]
    preparation?: string
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

// Diet tags for meal categorization
const dietTags = {
  "high-protein": { label: "High Protein", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  "low-carb": { label: "Low Carb", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  "high-fiber": { label: "High Fiber", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  "heart-healthy": { label: "Heart Healthy", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  "low-sodium": { label: "Low Sodium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  "low-fat": { label: "Low Fat", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  "gluten-free": { label: "Gluten Free", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  "dairy-free": { label: "Dairy Free", color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300" },
  vegetarian: {
    label: "Vegetarian",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  vegan: { label: "Vegan", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300" },
  keto: { label: "Keto", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
  paleo: { label: "Paleo", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
  mediterranean: {
    label: "Mediterranean",
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  },
  indian: { label: "Indian", color: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300" },
  asian: { label: "Asian", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300" },
  mexican: { label: "Mexican", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300" },
}

export function EnhancedMealPlanGenerator({ userData }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  const searchParams = useSearchParams()
  const goalParam = searchParams?.get("goal")
  const [dietPreference, setDietPreference] = useState(userData?.dietPreference || "omnivore")
  const [dietGoal, setDietGoal] = useState(goalParam || userData?.dietGoal || "weight-loss")
  const [calorieGoal, setCalorieGoal] = useState(userData?.targetCalories || 2000)
  const [dietPeriod, setDietPeriod] = useState("one-week")
  const [goalWeight, setGoalWeight] = useState(
    userData?.weight ? (userData.dietGoal === "weight-gain" ? userData.weight + 5 : userData.weight - 5) : 65,
  )
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>(
    userData?.medicalConditions || ["none"],
  )
  const [mealPlanHistory, setMealPlanHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Calculate daily calorie goal based on goal weight and timeframe
  const calculateCalorieGoal = useCallback(() => {
    if (!userData || !userData.weight || !goalWeight) return 2000

    // Get user data
    const currentWeight = userData.weight
    const height = userData.height || 170
    const age = userData.age || 30
    const gender = userData.gender || "male"
    const activityLevel = userData.activityLevel || "moderate"

    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    let bmr
    if (gender === "male") {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161
    }

    // Apply activity multiplier
    let tdee // Total Daily Energy Expenditure
    switch (activityLevel) {
      case "sedentary":
        tdee = bmr * 1.2
        break
      case "light":
        tdee = bmr * 1.375
        break
      case "moderate":
        tdee = bmr * 1.55
        break
      case "active":
        tdee = bmr * 1.725
        break
      case "very-active":
        tdee = bmr * 1.9
        break
      default:
        tdee = bmr * 1.55 // Default to moderate
    }

    // Calculate calorie adjustment based on goal
    const weightDiff = currentWeight - goalWeight
    const isWeightLoss = weightDiff > 0

    // Convert diet period to days
    let periodInDays
    switch (dietPeriod) {
      case "one-day":
        periodInDays = 1
        break
      case "three-days":
        periodInDays = 3
        break
      case "one-week":
        periodInDays = 7
        break
      case "three-weeks":
        periodInDays = 21
        break
      case "one-month":
        periodInDays = 30
        break
      case "two-months":
        periodInDays = 60
        break
      case "three-months":
        periodInDays = 90
        break
      case "four-months":
        periodInDays = 120
        break
      case "five-months":
        periodInDays = 150
        break
      case "six-months":
        periodInDays = 180
        break
      default:
        periodInDays = 7
    }

    // For weight loss/gain: 1kg = ~7700 calories
    // Safe weight loss/gain is about 0.5-1kg per week
    const caloriesPerDay = (Math.abs(weightDiff) * 7700) / periodInDays

    // Limit daily calorie deficit/surplus to safe levels
    const maxDailyCalorieChange = 1000 // Max 1000 calorie deficit/surplus per day
    const actualCalorieChange = Math.min(caloriesPerDay, maxDailyCalorieChange)

    // Calculate target calories
    let targetCalories
    if (isWeightLoss) {
      targetCalories = Math.max(1200, tdee - actualCalorieChange) // Minimum 1200 calories
    } else {
      targetCalories = tdee + actualCalorieChange
    }

    return Math.round(targetCalories)
  }, [userData, goalWeight, dietPeriod])

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
      // Use the goal from URL parameter if available, otherwise use from userData
      setDietGoal(goalParam || userData.dietGoal || "weight-loss")
      setSelectedMedicalConditions(userData.medicalConditions || ["none"])

      // Set initial goal weight based on current weight
      if (userData.weight) {
        // Default goal weight is 5kg less than current weight for weight loss, 5kg more for weight gain
        setGoalWeight(userData.dietGoal === "weight-gain" ? userData.weight + 5 : userData.weight - 5)
      }
    }
  }, [userData, goalParam])

  // Update calorie goal when goal weight or diet period changes
  useEffect(() => {
    if (userData && goalWeight) {
      const newCalorieGoal = calculateCalorieGoal()
      setCalorieGoal(newCalorieGoal)
    }
  }, [userData, goalWeight, dietPeriod, calculateCalorieGoal])

  // Update goal weight when diet goal changes
  useEffect(() => {
    if (userData && userData.weight) {
      if (dietGoal === "weight-gain" || dietGoal === "muscle-gain") {
        setGoalWeight(userData.weight + 5)
      } else if (dietGoal === "weight-loss") {
        setGoalWeight(userData.weight - 5)
      } else {
        setGoalWeight(userData.weight) // For maintenance
      }
    }
  }, [dietGoal, userData])

  const fetchMealPlanHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const mealPlansRef = collection(db, "mealPlans")
      const q = query(mealPlansRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
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

  const generateMealPlan = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate a meal plan",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setMealPlan([])

    try {
      // Check if user has subscription or has used less than 3 free meal plans
      const mealPlansRef = collection(db, "mealPlans")
      const q = query(mealPlansRef, where("userId", "==", user.uid))
      const querySnapshot = await getDocs(q)

      const userMealPlans = querySnapshot.docs.map((doc) => doc.data())

      // Get subscription status from userData, default to "free" if not available
      const userSubscription = userData?.subscription || "free"

      // For testing purposes, we'll temporarily disable the subscription check
      // In a production environment, you would uncomment this code
      /*
      if (userSubscription !== "premium" && userMealPlans.length >= 3) {
        toast({
          title: "Free limit reached",
          description: "You've used all your free meal plans. Please upgrade to premium.",
          variant: "destructive",
        })
        setIsGenerating(false)
        
        // Redirect to the upgrade page
        window.location.href = "/dashboard/upgrade"
        return
      }
      */

      // Simulate meal plan generation (in a real app, this would call an API)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a professional meal plan based on preferences
      const generatedMealPlan = generateProfessionalMealPlan(
        dietPreference,
        dietGoal,
        calorieGoal,
        dietPeriod,
        selectedMedicalConditions,
      )
      setMealPlan(generatedMealPlan)

      // Save the meal plan to Firestore
      await addDoc(collection(db, "mealPlans"), {
        userId: user.uid,
        dietPreference,
        dietGoal,
        calorieGoal,
        dietPeriod,
        goalWeight,
        medicalConditions: selectedMedicalConditions,
        mealPlan: generatedMealPlan,
        createdAt: Timestamp.now(),
      })

      // Refresh the meal plan history
      fetchMealPlanHistory()

      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan is ready!",
      })
    } catch (error) {
      console.error("Error generating meal plan:", error)
      toast({
        title: "Error",
        description: "Failed to generate meal plan",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateProfessionalMealPlan = (
    preference: string,
    goal: string,
    calories: number,
    period: string,
    medicalConditions: string[],
  ): MealPlan[] => {
    // Convert period to number of days
    let days
    switch (period) {
      case "one-day":
        days = 1
        break
      case "three-days":
        days = 3
        break
      case "one-week":
        days = 7
        break
      case "three-weeks":
        days = 21
        break
      case "one-month":
        days = 30
        break
      case "two-months":
        days = 60
        break
      case "three-months":
        days = 90
        break
      case "four-months":
        days = 120
        break
      case "five-months":
        days = 150
        break
      case "six-months":
        days = 180
        break
      default:
        days = 7
    }

    // For longer periods, we'll generate a week of meals and repeat them
    // with some variation to avoid monotony
    const mealPlan: MealPlan[] = []
    const baseWeekDays = Math.min(days, 7)

    // Check if there are medical conditions to consider
    const hasMedicalConditions = !medicalConditions.includes("none")

    // Professional meal plans based on diet preferences
    const vegetarianMeals = {
      breakfast: [
        {
          food: "Greek Yogurt Parfait with Berries and Granola",
          quantity: "1 cup yogurt, 1/2 cup berries, 1/4 cup granola",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A protein-rich breakfast with probiotics, antioxidants, and fiber.",
          ingredients: ["Greek yogurt", "Mixed berries", "Low-sugar granola", "Honey", "Chia seeds"],
          preparation:
            "Layer yogurt, berries, and granola in a glass. Drizzle with honey and sprinkle with chia seeds.",
        },
        {
          food: "Spinach and Feta Omelette with Whole Grain Toast",
          quantity: "3 eggs, 1 cup spinach, 30g feta, 1 slice toast",
          tags: ["vegetarian", "high-protein", "low-carb"],
          description: "A nutrient-dense breakfast rich in protein, iron, and calcium.",
          ingredients: ["Eggs", "Fresh spinach", "Feta cheese", "Olive oil", "Whole grain bread", "Avocado (optional)"],
          preparation: "Sauté spinach, whisk eggs, pour over spinach, add feta, fold when set. Serve with toast.",
        },
        {
          food: "Overnight Oats with Almond Butter and Banana",
          quantity: "1/2 cup oats, 1 tbsp almond butter, 1 banana",
          tags: ["vegetarian", "high-fiber", "heart-healthy"],
          description: "A fiber-rich breakfast that provides sustained energy throughout the morning.",
          ingredients: ["Rolled oats", "Almond milk", "Almond butter", "Banana", "Cinnamon", "Maple syrup"],
          preparation: "Mix oats and milk, refrigerate overnight. Top with almond butter, sliced banana, and cinnamon.",
        },
        {
          food: "Avocado Toast with Poached Eggs",
          quantity: "2 slices bread, 1/2 avocado, 2 eggs",
          tags: ["vegetarian", "high-protein", "heart-healthy"],
          description: "A balanced breakfast with healthy fats, protein, and complex carbohydrates.",
          ingredients: ["Whole grain bread", "Avocado", "Eggs", "Cherry tomatoes", "Microgreens", "Red pepper flakes"],
          preparation: "Toast bread, spread mashed avocado, top with poached eggs, tomatoes, and seasonings.",
        },
        {
          food: "Protein-Packed Smoothie Bowl",
          quantity: "1 bowl (approx. 16 oz)",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A nutrient-dense breakfast that's perfect for post-workout recovery.",
          ingredients: [
            "Protein powder",
            "Frozen berries",
            "Banana",
            "Spinach",
            "Almond milk",
            "Granola",
            "Chia seeds",
          ],
          preparation:
            "Blend protein powder, fruits, spinach, and milk. Pour into bowl and top with granola and seeds.",
        },
      ],
      lunch: [
        {
          food: "Mediterranean Chickpea Salad",
          quantity: "1 large bowl (approx. 2 cups)",
          tags: ["vegetarian", "high-fiber", "heart-healthy", "mediterranean"],
          description: "A protein-rich salad with Mediterranean flavors and heart-healthy fats.",
          ingredients: [
            "Chickpeas",
            "Cucumber",
            "Cherry tomatoes",
            "Red onion",
            "Feta cheese",
            "Kalamata olives",
            "Olive oil",
            "Lemon juice",
            "Herbs",
          ],
          preparation:
            "Combine all ingredients in a bowl, dress with olive oil and lemon juice, season with herbs and spices.",
        },
        {
          food: "Quinoa Buddha Bowl with Roasted Vegetables",
          quantity: "1 bowl (approx. 2 cups)",
          tags: ["vegetarian", "high-protein", "high-fiber"],
          description: "A balanced bowl with complete proteins, complex carbs, and essential nutrients.",
          ingredients: [
            "Quinoa",
            "Roasted sweet potato",
            "Roasted broccoli",
            "Avocado",
            "Chickpeas",
            "Tahini dressing",
          ],
          preparation:
            "Arrange quinoa, roasted vegetables, and chickpeas in a bowl. Top with avocado and drizzle with tahini dressing.",
        },
        {
          food: "Lentil Soup with Whole Grain Bread",
          quantity: "1 bowl soup (approx. 1.5 cups), 1 slice bread",
          tags: ["vegetarian", "high-fiber", "high-protein"],
          description: "A hearty, protein-rich soup that provides sustained energy.",
          ingredients: [
            "Red lentils",
            "Carrots",
            "Celery",
            "Onion",
            "Garlic",
            "Vegetable broth",
            "Spices",
            "Whole grain bread",
          ],
          preparation:
            "Sauté vegetables, add lentils and broth, simmer until lentils are tender. Serve with whole grain bread.",
        },
        {
          food: "Caprese Sandwich on Whole Grain Bread",
          quantity: "1 sandwich",
          tags: ["vegetarian", "heart-healthy", "mediterranean"],
          description: "A classic Italian sandwich with fresh ingredients and balanced macronutrients.",
          ingredients: ["Whole grain bread", "Fresh mozzarella", "Tomatoes", "Basil", "Balsamic glaze", "Olive oil"],
          preparation: "Layer mozzarella, tomatoes, and basil on bread. Drizzle with olive oil and balsamic glaze.",
        },
        {
          food: "Spinach and Mushroom Frittata with Side Salad",
          quantity: "1/4 frittata, 1 cup salad",
          tags: ["vegetarian", "high-protein", "low-carb"],
          description: "A protein-rich lunch that's perfect for meal prep and leftovers.",
          ingredients: [
            "Eggs",
            "Spinach",
            "Mushrooms",
            "Onion",
            "Feta cheese",
            "Mixed greens",
            "Olive oil",
            "Balsamic vinegar",
          ],
          preparation: "Sauté vegetables, add beaten eggs, top with cheese, bake until set. Serve with dressed salad.",
        },
      ],
      dinner: [
        {
          food: "Eggplant Parmesan with Side Salad",
          quantity: "1 serving (approx. 1.5 cups), 1 cup salad",
          tags: ["vegetarian", "heart-healthy", "mediterranean"],
          description: "A classic Italian dish that's rich in flavor and nutrients.",
          ingredients: [
            "Eggplant",
            "Tomato sauce",
            "Mozzarella cheese",
            "Parmesan cheese",
            "Breadcrumbs",
            "Mixed greens",
            "Olive oil",
          ],
          preparation: "Layer breaded eggplant with sauce and cheese, bake until bubbly. Serve with dressed salad.",
        },
        {
          food: "Vegetable Stir Fry with Tofu and Brown Rice",
          quantity: "1.5 cups stir fry, 1/2 cup rice",
          tags: ["vegetarian", "high-protein", "high-fiber", "asian"],
          description: "A nutrient-dense dinner with complete proteins and complex carbohydrates.",
          ingredients: [
            "Firm tofu",
            "Broccoli",
            "Bell peppers",
            "Carrots",
            "Snow peas",
            "Brown rice",
            "Soy sauce",
            "Ginger",
            "Garlic",
          ],
          preparation: "Stir fry tofu and vegetables with ginger and garlic. Serve over brown rice with soy sauce.",
        },
        {
          food: "Lentil and Vegetable Curry with Basmati Rice",
          quantity: "1.5 cups curry, 1/2 cup rice",
          tags: ["vegetarian", "high-protein", "high-fiber", "indian"],
          description: "A protein-rich curry with warming spices and complex flavors.",
          ingredients: [
            "Green lentils",
            "Cauliflower",
            "Spinach",
            "Tomatoes",
            "Onion",
            "Garlic",
            "Curry spices",
            "Coconut milk",
            "Basmati rice",
          ],
          preparation:
            "Sauté vegetables, add lentils, spices, tomatoes, and coconut milk. Simmer until lentils are tender. Serve with rice.",
        },
        {
          food: "Stuffed Bell Peppers with Quinoa and Black Beans",
          quantity: "2 stuffed peppers",
          tags: ["vegetarian", "high-protein", "high-fiber", "mexican"],
          description: "A complete meal with balanced macronutrients and vibrant flavors.",
          ingredients: ["Bell peppers", "Quinoa", "Black beans", "Corn", "Tomatoes", "Onion", "Cheese", "Spices"],
          preparation:
            "Mix quinoa, beans, vegetables, and spices. Stuff into peppers, top with cheese, and bake until peppers are tender.",
        },
        {
          food: "Mushroom Risotto with Roasted Asparagus",
          quantity: "1.5 cups risotto, 1 cup asparagus",
          tags: ["vegetarian", "heart-healthy", "mediterranean"],
          description: "A creamy, comforting dish with earthy flavors and essential nutrients.",
          ingredients: [
            "Arborio rice",
            "Mushrooms",
            "Onion",
            "Garlic",
            "Vegetable broth",
            "Parmesan cheese",
            "Asparagus",
            "Olive oil",
          ],
          preparation:
            "Sauté mushrooms and onions, add rice, gradually add broth until creamy. Roast asparagus separately. Combine to serve.",
        },
      ],
      snack: [
        {
          food: "Hummus with Vegetable Sticks",
          quantity: "1/4 cup hummus, 1 cup vegetables",
          tags: ["vegetarian", "high-fiber", "heart-healthy"],
          description: "A protein-rich snack with fiber and healthy fats.",
          ingredients: ["Hummus", "Carrots", "Cucumber", "Bell peppers", "Celery"],
          preparation: "Serve hummus with sliced vegetables for dipping.",
        },
        {
          food: "Greek Yogurt with Honey and Walnuts",
          quantity: "1 cup yogurt, 1 tbsp honey, 1 tbsp walnuts",
          tags: ["vegetarian", "high-protein", "heart-healthy"],
          description: "A protein-rich snack with probiotics and omega-3 fatty acids.",
          ingredients: ["Greek yogurt", "Honey", "Walnuts"],
          preparation: "Top yogurt with honey and chopped walnuts.",
        },
        {
          food: "Apple Slices with Almond Butter",
          quantity: "1 apple, 2 tbsp almond butter",
          tags: ["vegetarian", "high-fiber", "heart-healthy"],
          description: "A balanced snack with fiber, healthy fats, and natural sweetness.",
          ingredients: ["Apple", "Almond butter"],
          preparation: "Slice apple and serve with almond butter for dipping.",
        },
        {
          food: "Trail Mix with Nuts and Dried Fruits",
          quantity: "1/4 cup (approx. 30g)",
          tags: ["vegetarian", "high-protein", "heart-healthy"],
          description: "A portable snack with healthy fats, protein, and natural energy.",
          ingredients: ["Almonds", "Walnuts", "Cashews", "Dried cranberries", "Dried apricots", "Dark chocolate chips"],
          preparation: "Mix all ingredients and store in an airtight container.",
        },
        {
          food: "Cottage Cheese with Pineapple",
          quantity: "1/2 cup cottage cheese, 1/2 cup pineapple",
          tags: ["vegetarian", "high-protein", "low-carb"],
          description: "A protein-rich snack with digestive enzymes and calcium.",
          ingredients: ["Cottage cheese", "Fresh pineapple"],
          preparation: "Top cottage cheese with pineapple chunks.",
        },
      ],
    }

    const veganMeals = {
      breakfast: [
        {
          food: "Overnight Oats with Chia Seeds and Berries",
          quantity: "1/2 cup oats, 1 tbsp chia, 1/2 cup berries",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A fiber-rich breakfast that provides sustained energy throughout the morning.",
          ingredients: ["Rolled oats", "Almond milk", "Chia seeds", "Mixed berries", "Maple syrup", "Cinnamon"],
          preparation: "Mix oats, milk, and chia seeds, refrigerate overnight. Top with berries and maple syrup.",
        },
        {
          food: "Tofu Scramble with Vegetables and Whole Grain Toast",
          quantity: "1 cup scramble, 1 slice toast",
          tags: ["vegan", "high-protein", "high-fiber"],
          description: "A protein-rich breakfast with essential nutrients and fiber.",
          ingredients: [
            "Firm tofu",
            "Nutritional yeast",
            "Turmeric",
            "Bell peppers",
            "Spinach",
            "Onion",
            "Whole grain bread",
          ],
          preparation: "Crumble and sauté tofu with vegetables and spices. Serve with toast.",
        },
        {
          food: "Avocado Toast with Roasted Chickpeas",
          quantity: "2 slices bread, 1/2 avocado, 1/4 cup chickpeas",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A balanced breakfast with healthy fats, protein, and complex carbohydrates.",
          ingredients: [
            "Whole grain bread",
            "Avocado",
            "Roasted chickpeas",
            "Cherry tomatoes",
            "Microgreens",
            "Lemon juice",
          ],
          preparation: "Toast bread, spread mashed avocado, top with roasted chickpeas, tomatoes, and seasonings.",
        },
        {
          food: "Green Smoothie Bowl with Granola and Fruit",
          quantity: "1 bowl (approx. 16 oz)",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A nutrient-dense breakfast packed with vitamins, minerals, and antioxidants.",
          ingredients: ["Spinach", "Banana", "Mango", "Plant-based milk", "Vegan granola", "Berries", "Chia seeds"],
          preparation:
            "Blend spinach, banana, mango, and milk. Pour into bowl and top with granola, berries, and seeds.",
        },
        {
          food: "Quinoa Breakfast Bowl with Fruit and Nuts",
          quantity: "1 cup quinoa, 1/2 cup fruit, 1 tbsp nuts",
          tags: ["vegan", "high-protein", "high-fiber"],
          description: "A protein-rich breakfast with complete amino acids and essential nutrients.",
          ingredients: ["Quinoa", "Almond milk", "Cinnamon", "Mixed fruits", "Almonds", "Maple syrup"],
          preparation: "Cook quinoa in almond milk with cinnamon. Top with fruits, nuts, and maple syrup.",
        },
      ],
      lunch: [
        {
          food: "Buddha Bowl with Quinoa, Roasted Vegetables, and Tahini Dressing",
          quantity: "1 bowl (approx. 2 cups)",
          tags: ["vegan", "high-protein", "high-fiber"],
          description: "A balanced bowl with complete proteins, complex carbs, and essential nutrients.",
          ingredients: [
            "Quinoa",
            "Roasted sweet potato",
            "Roasted broccoli",
            "Avocado",
            "Chickpeas",
            "Tahini",
            "Lemon juice",
          ],
          preparation:
            "Arrange quinoa, roasted vegetables, and chickpeas in a bowl. Top with avocado and drizzle with tahini dressing.",
        },
        {
          food: "Lentil and Vegetable Soup with Whole Grain Bread",
          quantity: "1 bowl soup (approx. 1.5 cups), 1 slice bread",
          tags: ["vegan", "high-fiber", "high-protein"],
          description: "A hearty, protein-rich soup that provides sustained energy.",
          ingredients: [
            "Red lentils",
            "Carrots",
            "Celery",
            "Onion",
            "Garlic",
            "Vegetable broth",
            "Spices",
            "Whole grain bread",
          ],
          preparation:
            "Sauté vegetables, add lentils and broth, simmer until lentils are tender. Serve with whole grain bread.",
        },
        {
          food: "Mediterranean Chickpea Wrap",
          quantity: "1 wrap",
          tags: ["vegan", "high-fiber", "heart-healthy", "mediterranean"],
          description: "A protein-rich wrap with Mediterranean flavors and heart-healthy fats.",
          ingredients: [
            "Whole grain wrap",
            "Hummus",
            "Chickpeas",
            "Cucumber",
            "Tomato",
            "Red onion",
            "Lettuce",
            "Tahini sauce",
          ],
          preparation: "Spread hummus on wrap, add chickpeas and vegetables, drizzle with tahini sauce, and roll up.",
        },
        {
          food: "Spinach and Mushroom Tofu Quiche (Crustless)",
          quantity: "1 slice (1/6 of quiche)",
          tags: ["vegan", "high-protein", "low-carb"],
          description: "A protein-rich lunch that's perfect for meal prep and leftovers.",
          ingredients: [
            "Firm tofu",
            "Nutritional yeast",
            "Spinach",
            "Mushrooms",
            "Onion",
            "Garlic",
            "Turmeric",
            "Black salt",
          ],
          preparation: "Blend tofu with nutritional yeast and seasonings, fold in sautéed vegetables, bake until set.",
        },
        {
          food: "Quinoa Tabbouleh Salad",
          quantity: "1 large bowl (approx. 2 cups)",
          tags: ["vegan", "high-fiber", "heart-healthy", "mediterranean"],
          description: "A refreshing salad with complete proteins and vibrant herbs and flavors.",
          ingredients: ["Quinoa", "Parsley", "Mint", "Tomatoes", "Cucumber", "Red onion", "Lemon juice", "Olive oil"],
          preparation: "Mix cooked quinoa with chopped herbs and vegetables, dress with lemon juice and olive oil.",
        },
      ],
      dinner: [
        {
          food: "Chickpea and Vegetable Curry with Brown Rice",
          quantity: "1.5 cups curry, 1/2 cup rice",
          tags: ["vegan", "high-protein", "high-fiber", "indian"],
          description: "A protein-rich curry with warming spices and complex flavors.",
          ingredients: [
            "Chickpeas",
            "Cauliflower",
            "Spinach",
            "Tomatoes",
            "Onion",
            "Garlic",
            "Curry spices",
            "Coconut milk",
            "Brown rice",
          ],
          preparation:
            "Sauté vegetables, add chickpeas, spices, tomatoes, and coconut milk. Simmer until flavors meld. Serve with rice.",
        },
        {
          food: "Lentil Bolognese with Whole Grain Pasta",
          quantity: "1.5 cups sauce, 1 cup pasta",
          tags: ["vegan", "high-protein", "high-fiber", "mediterranean"],
          description: "A hearty, protein-rich sauce with complex carbohydrates for sustained energy.",
          ingredients: [
            "Green lentils",
            "Mushrooms",
            "Carrots",
            "Celery",
            "Onion",
            "Garlic",
            "Tomatoes",
            "Italian herbs",
            "Whole grain pasta",
          ],
          preparation:
            "Sauté vegetables, add lentils, tomatoes, and herbs. Simmer until lentils are tender. Serve over pasta.",
        },
        {
          food: "Stuffed Bell Peppers with Quinoa and Black Beans",
          quantity: "2 stuffed peppers",
          tags: ["vegan", "high-protein", "high-fiber", "mexican"],
          description: "A complete meal with balanced macronutrients and vibrant flavors.",
          ingredients: [
            "Bell peppers",
            "Quinoa",
            "Black beans",
            "Corn",
            "Tomatoes",
            "Onion",
            "Nutritional yeast",
            "Spices",
          ],
          preparation:
            "Mix quinoa, beans, vegetables, and spices. Stuff into peppers, top with nutritional yeast, and bake until peppers are tender.",
        },
        {
          food: "Vegetable Stir Fry with Tofu and Brown Rice",
          quantity: "1.5 cups stir fry, 1/2 cup rice",
          tags: ["vegan", "high-protein", "high-fiber", "asian"],
          description: "A nutrient-dense dinner with complete proteins and complex carbohydrates.",
          ingredients: [
            "Firm tofu",
            "Broccoli",
            "Bell peppers",
            "Carrots",
            "Snow peas",
            "Brown rice",
            "Soy sauce",
            "Ginger",
            "Garlic",
          ],
          preparation: "Stir fry tofu and vegetables with ginger and garlic. Serve over brown rice with soy sauce.",
        },
        {
          food: "Roasted Vegetable and Chickpea Bowl with Tahini Sauce",
          quantity: "1 bowl (approx. 2 cups)",
          tags: ["vegan", "high-protein", "high-fiber", "mediterranean"],
          description: "A colorful, nutrient-dense bowl with balanced macronutrients and flavors.",
          ingredients: [
            "Chickpeas",
            "Sweet potato",
            "Brussels sprouts",
            "Red onion",
            "Quinoa",
            "Tahini",
            "Lemon juice",
            "Garlic",
          ],
          preparation: "Roast chickpeas and vegetables, serve over quinoa, drizzle with tahini sauce.",
        },
      ],
      snack: [
        {
          food: "Hummus with Vegetable Sticks",
          quantity: "1/4 cup hummus, 1 cup vegetables",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A protein-rich snack with fiber and healthy fats.",
          ingredients: ["Hummus", "Carrots", "Cucumber", "Bell peppers", "Celery"],
          preparation: "Serve hummus with sliced vegetables for dipping.",
        },
        {
          food: "Energy Balls with Dates and Nuts",
          quantity: "2 balls (approx. 30g)",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A nutrient-dense snack with natural energy and essential nutrients.",
          ingredients: ["Dates", "Almonds", "Walnuts", "Chia seeds", "Cacao powder", "Vanilla extract"],
          preparation: "Process dates and nuts in a food processor, roll into balls, refrigerate until firm.",
        },
        {
          food: "Apple Slices with Almond Butter",
          quantity: "1 apple, 2 tbsp almond butter",
          tags: ["vegan", "high-fiber", "heart-healthy"],
          description: "A balanced snack with fiber, healthy fats, and natural sweetness.",
          ingredients: ["Apple", "Almond butter"],
          preparation: "Slice apple and serve with almond butter for dipping.",
        },
        {
          food: "Roasted Chickpeas",
          quantity: "1/4 cup (approx. 30g)",
          tags: ["vegan", "high-protein", "high-fiber"],
          description: "A crunchy, protein-rich snack that's perfect for on-the-go.",
          ingredients: ["Chickpeas", "Olive oil", "Spices (paprika, cumin, garlic powder)"],
          preparation: "Toss chickpeas with oil and spices, roast until crispy.",
        },
        {
          food: "Smoothie with Plant-Based Protein",
          quantity: "1 smoothie (approx. 16 oz)",
          tags: ["vegan", "high-protein", "high-fiber"],
          description: "A nutrient-dense snack that's perfect for post-workout recovery.",
          ingredients: ["Plant-based protein powder", "Banana", "Berries", "Spinach", "Almond milk", "Flaxseeds"],
          preparation: "Blend all ingredients until smooth.",
        },
      ],
    }

    const ketoMeals = {
      breakfast: [
        {
          food: "Avocado and Bacon Omelette",
          quantity: "3 eggs, 1/2 avocado, 2 slices bacon",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A high-fat, low-carb breakfast that provides sustained energy.",
          ingredients: ["Eggs", "Avocado", "Bacon", "Cheddar cheese", "Butter", "Salt", "Pepper"],
          preparation:
            "Cook bacon, set aside. Whisk eggs, pour into pan, add cheese, avocado, and crumbled bacon. Fold and serve.",
        },
        {
          food: "Keto Breakfast Bowl with Sausage and Eggs",
          quantity: "2 eggs, 2 sausages, 1/4 cup cheese",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A protein-rich breakfast with healthy fats and minimal carbs.",
          ingredients: ["Eggs", "Sausage", "Cheddar cheese", "Spinach", "Avocado", "Butter"],
          preparation: "Cook sausage, scramble eggs in butter, combine with cheese and spinach, top with avocado.",
        },
        {
          food: "Coconut Flour Pancakes with Berries and Whipped Cream",
          quantity: "3 pancakes, 1/4 cup berries, 2 tbsp cream",
          tags: ["keto", "low-carb", "gluten-free"],
          description: "A low-carb alternative to traditional pancakes with healthy fats.",
          ingredients: ["Coconut flour", "Eggs", "Cream cheese", "Almond milk", "Berries", "Heavy cream", "Erythritol"],
          preparation: "Mix batter, cook pancakes, top with whipped cream and berries.",
        },
        {
          food: "Chia Seed Pudding with Coconut and Berries",
          quantity: "1 cup pudding, 2 tbsp coconut, 1/4 cup berries",
          tags: ["keto", "low-carb", "dairy-free"],
          description: "A high-fiber, high-fat breakfast with minimal carbs.",
          ingredients: ["Chia seeds", "Coconut milk", "Vanilla extract", "Erythritol", "Shredded coconut", "Berries"],
          preparation:
            "Mix chia seeds, coconut milk, vanilla, and sweetener. Refrigerate overnight. Top with coconut and berries.",
        },
        {
          food: "Keto Green Smoothie with Avocado and MCT Oil",
          quantity: "1 smoothie (approx. 16 oz)",
          tags: ["keto", "low-carb", "high-fat"],
          description: "A nutrient-dense smoothie with healthy fats and minimal carbs.",
          ingredients: ["Avocado", "Spinach", "Almond milk", "MCT oil", "Protein powder", "Erythritol", "Ice"],
          preparation: "Blend all ingredients until smooth.",
        },
      ],
      lunch: [
        {
          food: "Chicken Caesar Salad (No Croutons)",
          quantity: "1 large bowl (approx. 2 cups)",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A protein-rich salad with healthy fats and minimal carbs.",
          ingredients: [
            "Grilled chicken breast",
            "Romaine lettuce",
            "Parmesan cheese",
            "Caesar dressing",
            "Bacon bits",
            "Avocado",
          ],
          preparation: "Toss lettuce with dressing, top with chicken, cheese, bacon, and avocado.",
        },
        {
          food: "Tuna Salad Lettuce Wraps",
          quantity: "3 wraps",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A protein-rich lunch with healthy fats and minimal carbs.",
          ingredients: ["Canned tuna", "Mayonnaise", "Celery", "Red onion", "Dill", "Lettuce leaves", "Avocado"],
          preparation: "Mix tuna with mayo, celery, onion, and dill. Serve in lettuce leaves with avocado.",
        },
        {
          food: "Zucchini Noodles with Pesto and Grilled Chicken",
          quantity: "1.5 cups zoodles, 4 oz chicken",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A low-carb alternative to pasta with protein and healthy fats.",
          ingredients: [
            "Zucchini",
            "Grilled chicken breast",
            "Basil pesto",
            "Cherry tomatoes",
            "Parmesan cheese",
            "Pine nuts",
          ],
          preparation:
            "Spiralize zucchini, sauté briefly, toss with pesto, top with chicken, tomatoes, cheese, and pine nuts.",
        },
        {
          food: "Avocado and Bacon Burger (No Bun)",
          quantity: "1 burger patty, 1/2 avocado, 2 slices bacon",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A high-fat, high-protein lunch with minimal carbs.",
          ingredients: [
            "Ground beef patty",
            "Bacon",
            "Avocado",
            "Cheddar cheese",
            "Lettuce",
            "Tomato",
            "Onion",
            "Mayonnaise",
          ],
          preparation: "Cook burger and bacon, serve wrapped in lettuce with toppings.",
        },
        {
          food: "Cauliflower Fried Rice with Shrimp",
          quantity: "1.5 cups rice, 4 oz shrimp",
          tags: ["keto", "high-protein", "low-carb", "asian"],
          description: "A low-carb alternative to fried rice with protein and healthy fats.",
          ingredients: [
            "Cauliflower rice",
            "Shrimp",
            "Eggs",
            "Green onions",
            "Garlic",
            "Ginger",
            "Soy sauce",
            "Sesame oil",
          ],
          preparation:
            "Sauté cauliflower rice with garlic and ginger, add shrimp and scrambled eggs, season with soy sauce and sesame oil.",
        },
      ],
      dinner: [
        {
          food: "Grilled Steak with Buttered Vegetables",
          quantity: "6 oz steak, 1 cup vegetables",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A protein-rich dinner with healthy fats and minimal carbs.",
          ingredients: ["Ribeye steak", "Asparagus", "Broccoli", "Butter", "Garlic", "Herbs", "Salt", "Pepper"],
          preparation: "Grill steak to desired doneness, sauté vegetables in butter with garlic and herbs.",
        },
        {
          food: "Baked Salmon with Creamed Spinach",
          quantity: "6 oz salmon, 1 cup spinach",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A nutrient-dense dinner with omega-3 fatty acids and minimal carbs.",
          ingredients: [
            "Salmon fillet",
            "Spinach",
            "Heavy cream",
            "Cream cheese",
            "Garlic",
            "Parmesan cheese",
            "Butter",
            "Lemon",
          ],
          preparation:
            "Bake salmon with lemon and herbs, sauté spinach with garlic, add cream and cheese until creamy.",
        },
        {
          food: "Chicken Alfredo with Zucchini Noodles",
          quantity: "4 oz chicken, 1.5 cups zoodles",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A low-carb alternative to pasta with protein and healthy fats.",
          ingredients: [
            "Chicken breast",
            "Zucchini",
            "Heavy cream",
            "Parmesan cheese",
            "Butter",
            "Garlic",
            "Italian herbs",
          ],
          preparation:
            "Sauté chicken, set aside. Spiralize zucchini, sauté briefly. Make alfredo sauce with cream, butter, and cheese. Combine all ingredients.",
        },
        {
          food: "Beef and Vegetable Stir Fry",
          quantity: "4 oz beef, 1.5 cups vegetables",
          tags: ["keto", "high-protein", "low-carb", "asian"],
          description: "A protein-rich dinner with low-carb vegetables and healthy fats.",
          ingredients: [
            "Beef strips",
            "Broccoli",
            "Bell peppers",
            "Mushrooms",
            "Garlic",
            "Ginger",
            "Soy sauce",
            "Sesame oil",
          ],
          preparation: "Stir fry beef and vegetables with garlic and ginger, season with soy sauce and sesame oil.",
        },
        {
          food: "Stuffed Bell Peppers with Ground Beef and Cauliflower Rice",
          quantity: "2 stuffed peppers",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A complete meal with protein, healthy fats, and minimal carbs.",
          ingredients: [
            "Bell peppers",
            "Ground beef",
            "Cauliflower rice",
            "Onion",
            "Garlic",
            "Tomato sauce",
            "Cheese",
            "Spices",
          ],
          preparation:
            "Mix beef, cauliflower rice, and seasonings, stuff into peppers, top with cheese, and bake until peppers are tender.",
        },
      ],
      snack: [
        {
          food: "Cheese and Nuts",
          quantity: "1 oz cheese, 1 oz nuts",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A high-fat, high-protein snack with minimal carbs.",
          ingredients: ["Cheddar cheese", "Almonds", "Walnuts", "Macadamia nuts"],
          preparation: "Serve cheese with a variety of nuts.",
        },
        {
          food: "Avocado Deviled Eggs",
          quantity: "3 egg halves",
          tags: ["keto", "high-protein", "low-carb"],
          description: "A protein-rich snack with healthy fats and minimal carbs.",
          ingredients: ["Hard-boiled eggs", "Avocado", "Mayonnaise", "Dijon mustard", "Paprika", "Salt", "Pepper"],
          preparation: "Halve eggs, mix yolks with avocado and mayo, pipe back into whites, sprinkle with paprika.",
        },
        {
          food: "Cucumber Slices with Cream Cheese",
          quantity: "1 cucumber, 2 tbsp cream cheese",
          tags: ["keto", "low-carb", "vegetarian"],
          description: "A refreshing, low-carb snack with healthy fats.",
          ingredients: ["Cucumber", "Cream cheese", "Dill", "Lemon zest", "Salt", "Pepper"],
          preparation: "Slice cucumber, top with seasoned cream cheese.",
        },
        {
          food: "Bacon-Wrapped Asparagus",
          quantity: "6 spears",
          tags: ["keto", "low-carb", "high-fat"],
          description: "A savory, high-fat snack with minimal carbs.",
          ingredients: ["Asparagus spears", "Bacon", "Olive oil", "Garlic powder", "Salt", "Pepper"],
          preparation: "Wrap asparagus spears with bacon, bake until bacon is crispy.",
        },
        {
          food: "Keto Fat Bombs",
          quantity: "2 bombs (approx. 30g)",
          tags: ["keto", "high-fat", "low-carb"],
          description: "A high-fat snack designed to provide energy on a ketogenic diet.",
          ingredients: ["Coconut oil", "Almond butter", "Cocoa powder", "Erythritol", "Vanilla extract", "Salt"],
          preparation: "Mix ingredients, pour into molds, freeze until solid.",
        },
      ],
    }

    const omnivoreAndPaleoMeals = {
      breakfast: [
        {
          food: "Scrambled Eggs with Bacon and Avocado",
          quantity: "3 eggs, 2 slices bacon, 1/2 avocado",
          tags: ["high-protein", "low-carb", "paleo"],
          description: "A protein-rich breakfast with healthy fats and minimal carbs.",
          ingredients: ["Eggs", "Bacon", "Avocado", "Chives", "Salt", "Pepper"],
          preparation: "Cook bacon, scramble eggs, serve with sliced avocado and chopped chives.",
        },
        {
          food: "Greek Yogurt Parfait with Berries and Nuts",
          quantity: "1 cup yogurt, 1/2 cup berries, 2 tbsp nuts",
          tags: ["high-protein", "high-fiber"],
          description: "A protein-rich breakfast with probiotics, antioxidants, and healthy fats.",
          ingredients: ["Greek yogurt", "Mixed berries", "Almonds", "Walnuts", "Honey", "Cinnamon"],
          preparation: "Layer yogurt, berries, and nuts in a glass. Drizzle with honey and sprinkle with cinnamon.",
        },
        {
          food: "Protein Pancakes with Berries and Maple Syrup",
          quantity: "3 pancakes, 1/2 cup berries, 1 tbsp syrup",
          tags: ["high-protein", "high-fiber"],
          description: "A protein-rich alternative to traditional pancakes with fiber and natural sweetness.",
          ingredients: [
            "Protein powder",
            "Banana",
            "Eggs",
            "Oats",
            "Baking powder",
            "Cinnamon",
            "Berries",
            "Maple syrup",
          ],
          preparation: "Blend ingredients, cook pancakes, top with berries and a small amount of maple syrup.",
        },
        {
          food: "Breakfast Burrito with Eggs, Vegetables, and Salsa",
          quantity: "1 burrito",
          tags: ["high-protein", "high-fiber"],
          description: "A balanced breakfast with protein, complex carbs, and vegetables.",
          ingredients: [
            "Whole grain tortilla",
            "Eggs",
            "Bell peppers",
            "Onion",
            "Spinach",
            "Black beans",
            "Cheese",
            "Salsa",
            "Avocado",
          ],
          preparation: "Scramble eggs with vegetables, wrap in tortilla with beans, cheese, salsa, and avocado.",
        },
        {
          food: "Smoked Salmon and Avocado Toast",
          quantity: "2 slices bread, 3 oz salmon, 1/2 avocado",
          tags: ["high-protein", "heart-healthy"],
          description: "A nutrient-dense breakfast with omega-3 fatty acids, protein, and healthy fats.",
          ingredients: [
            "Whole grain bread",
            "Smoked salmon",
            "Avocado",
            "Cream cheese",
            "Red onion",
            "Capers",
            "Lemon juice",
            "Dill",
          ],
          preparation:
            "Toast bread, spread with cream cheese and mashed avocado, top with salmon, onion, capers, and dill.",
        },
      ],
      lunch: [
        {
          food: "Grilled Chicken Salad with Olive Oil Dressing",
          quantity: "4 oz chicken, 2 cups greens, 2 tbsp dressing",
          tags: ["high-protein", "low-carb", "paleo"],
          description: "A protein-rich salad with healthy fats and a variety of vegetables.",
          ingredients: [
            "Grilled chicken breast",
            "Mixed greens",
            "Cherry tomatoes",
            "Cucumber",
            "Red onion",
            "Avocado",
            "Olive oil",
            "Lemon juice",
            "Herbs",
          ],
          preparation: "Arrange greens and vegetables, top with sliced chicken, dress with olive oil and lemon juice.",
        },
        {
          food: "Turkey and Avocado Wrap",
          quantity: "1 wrap",
          tags: ["high-protein", "high-fiber"],
          description: "A balanced lunch with lean protein, healthy fats, and complex carbs.",
          ingredients: [
            "Whole grain wrap",
            "Turkey breast",
            "Avocado",
            "Lettuce",
            "Tomato",
            "Red onion",
            "Mustard",
            "Hummus",
          ],
          preparation: "Spread wrap with hummus, layer with turkey, avocado, and vegetables, roll up tightly.",
        },
        {
          food: "Quinoa Bowl with Grilled Chicken and Roasted Vegetables",
          quantity: "1/2 cup quinoa, 4 oz chicken, 1 cup vegetables",
          tags: ["high-protein", "high-fiber", "heart-healthy"],
          description: "A balanced bowl with complete proteins, complex carbs, and essential nutrients.",
          ingredients: [
            "Quinoa",
            "Grilled chicken breast",
            "Roasted sweet potato",
            "Roasted broccoli",
            "Avocado",
            "Tahini",
            "Lemon juice",
            "Herbs",
          ],
          preparation:
            "Arrange quinoa, chicken, and roasted vegetables in a bowl. Top with avocado and drizzle with tahini dressing.",
        },
        {
          food: "Tuna Nicoise Salad",
          quantity: "1 large bowl (approx. 2 cups)",
          tags: ["high-protein", "low-carb", "mediterranean"],
          description: "A protein-rich salad with healthy fats and a variety of vegetables.",
          ingredients: [
            "Canned tuna",
            "Mixed greens",
            "Green beans",
            "Cherry tomatoes",
            "Hard-boiled eggs",
            "Olives",
            "Potatoes",
            "Olive oil",
            "Lemon juice",
            "Dijon mustard",
          ],
          preparation:
            "Arrange greens, vegetables, eggs, and tuna on a plate, dress with olive oil, lemon juice, and mustard.",
        },
        {
          food: "Beef and Vegetable Stir Fry with Brown Rice",
          quantity: "4 oz beef, 1 cup vegetables, 1/2 cup rice",
          tags: ["high-protein", "high-fiber", "asian"],
          description: "A balanced lunch with protein, complex carbs, and a variety of vegetables.",
          ingredients: [
            "Beef strips",
            "Broccoli",
            "Bell peppers",
            "Carrots",
            "Garlic",
            "Ginger",
            "Soy sauce",
            "Brown rice",
          ],
          preparation: "Stir fry beef and vegetables with garlic and ginger, serve over brown rice with soy sauce.",
        },
      ],
      dinner: [
        {
          food: "Baked Salmon with Sweet Potato and Broccoli",
          quantity: "6 oz salmon, 1/2 cup sweet potato, 1 cup broccoli",
          tags: ["high-protein", "heart-healthy", "paleo"],
          description: "A nutrient-dense dinner with omega-3 fatty acids, complex carbs, and fiber.",
          ingredients: [
            "Salmon fillet",
            "Sweet potato",
            "Broccoli",
            "Olive oil",
            "Lemon",
            "Garlic",
            "Herbs",
            "Salt",
            "Pepper",
          ],
          preparation: "Bake salmon with lemon and herbs, roast sweet potato and broccoli with olive oil and garlic.",
        },
        {
          food: "Grilled Steak with Roasted Vegetables and Quinoa",
          quantity: "6 oz steak, 1 cup vegetables, 1/2 cup quinoa",
          tags: ["high-protein", "high-fiber", "paleo"],
          description: "A protein-rich dinner with complex carbs and a variety of vegetables.",
          ingredients: [
            "Sirloin steak",
            "Asparagus",
            "Bell peppers",
            "Zucchini",
            "Quinoa",
            "Olive oil",
            "Garlic",
            "Herbs",
            "Salt",
            "Pepper",
          ],
          preparation:
            "Grill steak to desired doneness, roast vegetables with olive oil and garlic, serve with cooked quinoa.",
        },
        {
          food: "Turkey Meatballs with Zucchini Noodles and Marinara",
          quantity: "4 meatballs, 1.5 cups zoodles, 1/2 cup sauce",
          tags: ["high-protein", "low-carb", "paleo"],
          description: "A protein-rich dinner with a low-carb alternative to pasta.",
          ingredients: [
            "Ground turkey",
            "Almond flour",
            "Egg",
            "Italian herbs",
            "Zucchini",
            "Marinara sauce",
            "Parmesan cheese",
            "Garlic",
            "Olive oil",
          ],
          preparation:
            "Form and bake meatballs, spiralize and sauté zucchini, heat marinara sauce, combine and top with cheese.",
        },
        {
          food: "Chicken Stir Fry with Brown Rice",
          quantity: "4 oz chicken, 1 cup vegetables, 1/2 cup rice",
          tags: ["high-protein", "high-fiber", "asian"],
          description: "A balanced dinner with lean protein, complex carbs, and a variety of vegetables.",
          ingredients: [
            "Chicken breast",
            "Broccoli",
            "Bell peppers",
            "Carrots",
            "Snow peas",
            "Garlic",
            "Ginger",
            "Soy sauce",
            "Brown rice",
          ],
          preparation: "Stir fry chicken and vegetables with garlic and ginger, serve over brown rice with soy sauce.",
        },
        {
          food: "Shrimp and Vegetable Skewers with Quinoa",
          quantity: "6 oz shrimp, 1 cup vegetables, 1/2 cup quinoa",
          tags: ["high-protein", "high-fiber", "mediterranean"],
          description: "A protein-rich dinner with complex carbs and a variety of vegetables.",
          ingredients: [
            "Shrimp",
            "Bell peppers",
            "Zucchini",
            "Red onion",
            "Cherry tomatoes",
            "Quinoa",
            "Olive oil",
            "Lemon",
            "Garlic",
            "Herbs",
          ],
          preparation:
            "Skewer shrimp and vegetables, grill until shrimp is cooked, serve over quinoa with lemon and herbs.",
        },
      ],
      snack: [
        {
          food: "Greek Yogurt with Berries and Nuts",
          quantity: "1 cup yogurt, 1/4 cup berries, 1 tbsp nuts",
          tags: ["high-protein", "high-fiber"],
          description: "A protein-rich snack with probiotics, antioxidants, and healthy fats.",
          ingredients: ["Greek yogurt", "Mixed berries", "Almonds", "Honey"],
          preparation: "Top yogurt with berries, nuts, and a drizzle of honey.",
        },
        {
          food: "Apple Slices with Almond Butter",
          quantity: "1 apple, 2 tbsp almond butter",
          tags: ["high-fiber", "heart-healthy", "paleo"],
          description: "A balanced snack with fiber, healthy fats, and natural sweetness.",
          ingredients: ["Apple", "Almond butter"],
          preparation: "Slice apple and serve with almond butter for dipping.",
        },
        {
          food: "Hard-Boiled Eggs with Cherry Tomatoes",
          quantity: "2 eggs, 1/2 cup tomatoes",
          tags: ["high-protein", "low-carb", "paleo"],
          description: "A protein-rich snack with minimal carbs and essential nutrients.",
          ingredients: ["Eggs", "Cherry tomatoes", "Salt", "Pepper"],
          preparation: "Boil eggs, peel and slice, serve with cherry tomatoes, season with salt and pepper.",
        },
        {
          food: "Trail Mix with Nuts, Seeds, and Dried Fruit",
          quantity: "1/4 cup (approx. 30g)",
          tags: ["high-protein", "high-fiber", "paleo"],
          description: "A portable snack with healthy fats, protein, and natural energy.",
          ingredients: [
            "Almonds",
            "Walnuts",
            "Pumpkin seeds",
            "Dried cranberries",
            "Dried apricots",
            "Dark chocolate chips",
          ],
          preparation: "Mix all ingredients and store in an airtight container.",
        },
        {
          food: "Protein Smoothie with Fruit and Greens",
          quantity: "1 smoothie (approx. 16 oz)",
          tags: ["high-protein", "high-fiber"],
          description: "A nutrient-dense snack that's perfect for post-workout recovery.",
          ingredients: ["Protein powder", "Banana", "Berries", "Spinach", "Almond milk", "Chia seeds"],
          preparation: "Blend all ingredients until smooth.",
        },
      ],
    }

    // Select appropriate meal plans based on diet preference
    let mealOptions
    switch (preference) {
      case "vegetarian":
      case "indian-vegetarian":
        mealOptions = vegetarianMeals
        break
      case "vegan":
        mealOptions = veganMeals
        break
      case "keto":
        mealOptions = ketoMeals
        break
      case "paleo":
      case "omnivore":
      default:
        mealOptions = omnivoreAndPaleoMeals
        break
    }

    // Generate base week of meal plans
    for (let i = 0; i < baseWeekDays; i++) {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i % 7]

      // Select meals for this day (ensuring variety by using the day index)
      const breakfast = mealOptions.breakfast[i % mealOptions.breakfast.length]
      const lunch = mealOptions.lunch[i % mealOptions.lunch.length]
      const dinner = mealOptions.dinner[i % mealOptions.dinner.length]
      const snack = mealOptions.snack[i % mealOptions.snack.length]

      // Adjust for medical conditions if needed
      if (hasMedicalConditions) {
        // Example adjustments for specific conditions
        if (medicalConditions.includes("diabetes")) {
          // Adjust meals for diabetes - lower carb options
          if (breakfast.food.toLowerCase().includes("pancake") || breakfast.food.toLowerCase().includes("oat")) {
            breakfast.tags.push("low-gi")
            breakfast.description += " Modified for diabetes management with lower glycemic index ingredients."
          }

          if (lunch.food.toLowerCase().includes("rice") || lunch.food.toLowerCase().includes("pasta")) {
            lunch.food += " (with reduced portion of carbs)"
            lunch.description += " Modified for diabetes management with reduced carbohydrate content."
          }

          if (dinner.food.toLowerCase().includes("potato") || dinner.food.toLowerCase().includes("rice")) {
            dinner.food += " (with reduced portion of carbs)"
            dinner.description += " Modified for diabetes management with reduced carbohydrate content."
          }

          if (snack.food.toLowerCase().includes("fruit") || snack.food.toLowerCase().includes("dried")) {
            snack.food = "Low-Sugar Greek Yogurt with Berries"
            snack.quantity = "3/4 cup yogurt, 1/4 cup berries"
            snack.description = "A diabetes-friendly snack with protein and limited natural sugars."
            snack.tags.push("low-gi")
          }
        }

        if (medicalConditions.includes("hypertension")) {
          // Adjust meals for hypertension - lower sodium options
          breakfast.food += " (Low Sodium)"
          lunch.food += " (Low Sodium)"
          dinner.food += " (Low Sodium)"

          breakfast.description += " Prepared with minimal salt for hypertension management."
          lunch.description += " Prepared with minimal salt for hypertension management."
          dinner.description += " Prepared with minimal salt for hypertension management."

          breakfast.tags.push("low-sodium")
          lunch.tags.push("low-sodium")
          dinner.tags.push("low-sodium")
        }

        if (medicalConditions.includes("high-cholesterol")) {
          // Adjust meals for high cholesterol - heart-healthy options
          if (breakfast.food.toLowerCase().includes("egg") && breakfast.food.toLowerCase().includes("bacon")) {
            breakfast.food = "Oatmeal with Berries and Flaxseeds"
            breakfast.quantity = "1 cup oatmeal, 1/2 cup berries, 1 tbsp flaxseeds"
            breakfast.description = "A heart-healthy breakfast rich in soluble fiber to help lower cholesterol."
            breakfast.tags = ["heart-healthy", "high-fiber", "low-fat"]
          }

          if (lunch.food.toLowerCase().includes("cheese") || lunch.food.toLowerCase().includes("beef")) {
            lunch.food = lunch.food.replace("Beef", "Lean Turkey").replace("Cheese", "Reduced-Fat Cheese")
            lunch.description += " Modified with lean protein and reduced saturated fat for heart health."
            lunch.tags.push("heart-healthy")
          }

          if (dinner.food.toLowerCase().includes("steak")) {
            dinner.food = "Grilled Fish with Steamed Vegetables"
            dinner.quantity = "6 oz fish, 1.5 cups vegetables"
            dinner.description = "A heart-healthy dinner rich in omega-3 fatty acids and low in saturated fat."
            dinner.tags = ["heart-healthy", "high-protein", "low-fat"]
          }
        }
      }

      // Adjust macros based on diet goal
      let proteinMultiplier = 1.0
      let carbMultiplier = 1.0
      let fatMultiplier = 1.0

      switch (goal) {
        case "weight-loss":
          carbMultiplier = 0.8
          fatMultiplier = 0.9
          break
        case "weight-gain":
        case "muscle-gain":
          proteinMultiplier = 1.3
          carbMultiplier = 1.2
          break
        case "keto":
          proteinMultiplier = 1.1
          carbMultiplier = 0.2
          fatMultiplier = 1.5
          break
      }

      // Calculate macros based on calorie distribution and diet goal
      const breakfastCalories = Math.round(calories * 0.25)
      const lunchCalories = Math.round(calories * 0.35)
      const dinnerCalories = Math.round(calories * 0.3)
      const snackCalories = Math.round(calories * 0.1)

      // Create the day's meal plan
      const dayMeals = {
        day: dayName,
        meals: [
          {
            meal: "Breakfast",
            time: "8:00 AM",
            food: breakfast.food,
            quantity: breakfast.quantity,
            calories: breakfastCalories,
            protein: Math.round((breakfastCalories * 0.3 * proteinMultiplier) / 4),
            carbs: Math.round((breakfastCalories * 0.4 * carbMultiplier) / 4),
            fat: Math.round((breakfastCalories * 0.3 * fatMultiplier) / 9),
            tags: breakfast.tags,
            description: breakfast.description,
            ingredients: breakfast.ingredients,
            preparation: breakfast.preparation,
          },
          {
            meal: "Lunch",
            time: "12:30 PM",
            food: lunch.food,
            quantity: lunch.quantity,
            calories: lunchCalories,
            protein: Math.round((lunchCalories * 0.3 * proteinMultiplier) / 4),
            carbs: Math.round((lunchCalories * 0.4 * carbMultiplier) / 4),
            fat: Math.round((lunchCalories * 0.3 * fatMultiplier) / 9),
            tags: lunch.tags,
            description: lunch.description,
            ingredients: lunch.ingredients,
            preparation: lunch.preparation,
          },
          {
            meal: "Dinner",
            time: "7:00 PM",
            food: dinner.food,
            quantity: dinner.quantity,
            calories: dinnerCalories,
            protein: Math.round((dinnerCalories * 0.3 * proteinMultiplier) / 4),
            carbs: Math.round((dinnerCalories * 0.4 * carbMultiplier) / 4),
            fat: Math.round((dinnerCalories * 0.3 * fatMultiplier) / 9),
            tags: dinner.tags,
            description: dinner.description,
            ingredients: dinner.ingredients,
            preparation: dinner.preparation,
          },
          {
            meal: "Snack",
            time: "4:00 PM",
            food: snack.food,
            quantity: snack.quantity,
            calories: snackCalories,
            protein: Math.round((snackCalories * 0.3 * proteinMultiplier) / 4),
            carbs: Math.round((snackCalories * 0.4 * carbMultiplier) / 4),
            fat: Math.round((snackCalories * 0.3 * fatMultiplier) / 9),
            tags: snack.tags,
            description: snack.description,
            ingredients: snack.ingredients,
            preparation: snack.preparation,
          },
        ],
      }

      mealPlan.push(dayMeals)
    }

    // For periods longer than a week, repeat the base week with variations
    if (days > 7) {
      const baseWeek = [...mealPlan]

      // Generate remaining weeks with variations
      for (let week = 1; week < Math.ceil(days / 7); week++) {
        for (let day = 0; day < 7 && mealPlan.length < days; day++) {
          const baseDay = baseWeek[day]
          const newDay = JSON.parse(JSON.stringify(baseDay)) // Deep clone

          // Add some variation to meal names for variety
          newDay.meals.forEach((meal: any, index: number) => {
            // Add variation indicator to avoid monotony in longer plans
            if (week % 2 === 0) {
              meal.food = meal.food.includes("(Variation") ? meal.food : `${meal.food} (Variation ${week})`
            }

            // Slightly adjust calories and macros for variety
            const variation = 0.95 + Math.random() * 0.1 // 0.95-1.05 multiplier
            meal.calories = Math.round(meal.calories * variation)
            meal.protein = Math.round(meal.protein * variation)
            meal.carbs = Math.round(meal.carbs * variation)
            meal.fat = Math.round(meal.fat * variation)
          })

          mealPlan.push(newDay)
        }
      }
    }

    return mealPlan
  }

  const loadMealPlan = (plan: any) => {
    setDietPreference(plan.dietPreference || "omnivore")
    setDietGoal(plan.dietGoal || "weight-loss")
    setCalorieGoal(plan.calorieGoal || 2000)
    setDietPeriod(plan.dietPeriod || "one-week")
    setSelectedMedicalConditions(plan.medicalConditions || ["none"])
    if (plan.goalWeight) {
      setGoalWeight(plan.goalWeight)
    }
    setMealPlan(plan.mealPlan || [])

    toast({
      title: "Meal plan loaded",
      description: "Your saved meal plan has been loaded",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Personalized Meal Plan</CardTitle>
          <CardDescription>Create a customized meal plan based on your dietary preferences and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate Plan</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="generate" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diet-preference">Diet Preference</Label>
                  <Select value={dietPreference} onValueChange={setDietPreference}>
                    <SelectTrigger id="diet-preference">
                      <SelectValue placeholder="Select diet preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Omnivore</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                      <SelectItem value="indian-vegetarian">Indian Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-goal">Diet Goal</Label>
                  <Select value={dietGoal} onValueChange={setDietGoal}>
                    <SelectTrigger id="diet-goal">
                      <SelectValue placeholder="Select diet goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem value="weight-maintenance">Weight Maintenance</SelectItem>
                      <SelectItem value="weight-gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                      <SelectItem value="general-health">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calorie-goal">Daily Calorie Goal</Label>
                  <Input
                    id="calorie-goal"
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(Number.parseInt(e.target.value) || 2000)}
                    min={1200}
                    max={4000}
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated based on your profile and goal weight</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-weight">Goal Weight (kg)</Label>
                  <Input
                    id="goal-weight"
                    type="number"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(Number.parseInt(e.target.value) || 65)}
                    min={40}
                    max={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your target weight to achieve within the selected diet period
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-period">Diet Period</Label>
                  <Select value={dietPeriod} onValueChange={setDietPeriod}>
                    <SelectTrigger id="diet-period">
                      <SelectValue placeholder="Select diet period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-day">One Day</SelectItem>
                      <SelectItem value="three-days">Three Days</SelectItem>
                      <SelectItem value="one-week">One Week</SelectItem>
                      <SelectItem value="three-weeks">Three Weeks</SelectItem>
                      <SelectItem value="one-month">One Month</SelectItem>
                      <SelectItem value="two-months">Two Months</SelectItem>
                      <SelectItem value="three-months">Three Months</SelectItem>
                      <SelectItem value="four-months">Four Months</SelectItem>
                      <SelectItem value="five-months">Five Months</SelectItem>
                      <SelectItem value="six-months">Six Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weight-progress">Weight Progress</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const newCalorieGoal = calculateCalorieGoal()
                        setCalorieGoal(newCalorieGoal)
                        toast({
                          title: "Calorie goal updated",
                          description: `Calorie goal recalculated to ${newCalorieGoal} calories per day.`,
                        })
                      }}
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Recalculate
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current: <span className="font-medium">{userData?.weight || "N/A"} kg</span> → Goal:{" "}
                    <span className="font-medium">{goalWeight} kg</span>
                    <span className="ml-2">
                      ({userData?.weight && goalWeight ? (userData.weight > goalWeight ? "-" : "+") : ""}
                      {userData?.weight && goalWeight ? Math.abs(userData.weight - goalWeight).toFixed(1) : "?"} kg)
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Conditions Section */}
              <div className="space-y-2">
                <Label>Medical Conditions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                  {medicalConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition.id}`}
                        checked={selectedMedicalConditions.includes(condition.id)}
                        onCheckedChange={(checked) => handleMedicalConditionChange(condition.id, checked === true)}
                      />
                      <Label htmlFor={`condition-${condition.id}`} className="text-sm">
                        {condition.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select any medical conditions to customize your meal plan accordingly.
                </p>
              </div>

              <Button onClick={generateMealPlan} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Meal Plan"
                )}
              </Button>
            </TabsContent>
            <TabsContent value="history">
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mealPlanHistory.length > 0 ? (
                <div className="space-y-4">
                  {mealPlanHistory.map((plan, index) => (
                    <Card key={plan.id || index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <CardTitle className="text-base">
                              {plan.dietPreference.charAt(0).toUpperCase() + plan.dietPreference.slice(1)} Diet
                            </CardTitle>
                            <CardDescription>
                              {new Date(plan.createdAt.seconds * 1000).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => loadMealPlan(plan)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            Goal:{" "}
                            {plan.dietGoal
                              .split("-")
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </div>
                          <div>Calories: {plan.calorieGoal}</div>
                          <div>Period: {plan.dietPeriod.replace("-", " ")}</div>
                          <div>
                            Meals: {plan.mealPlan?.reduce((acc: number, day: any) => acc + day.meals.length, 0) || 0}
                          </div>
                          {plan.goalWeight && <div>Goal Weight: {plan.goalWeight} kg</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No meal plan history found. Generate your first meal plan!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {mealPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Meal Plan</CardTitle>
            <CardDescription>
              Based on your {dietPreference.replace("-", " ")} diet preference and {dietGoal.replace("-", " ")} goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {mealPlan.map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">{day.day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {day.meals.map((meal, mealIndex) => (
                      <Card key={mealIndex} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">{meal.meal}</CardTitle>
                            {meal.time && <span className="text-sm text-muted-foreground">{meal.time}</span>}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div>
                            <h4 className="font-medium text-lg">{meal.food}</h4>
                            <p className="text-sm text-muted-foreground">{meal.quantity}</p>

                            {/* Meal tags */}
                            {meal.tags && meal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {meal.tags.map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    className={`text-xs ${dietTags[tag]?.color || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}
                                  >
                                    {dietTags[tag]?.label || tag.replace("-", " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Meal description */}
                            {meal.description && (
                              <p className="text-sm mt-2 text-muted-foreground">{meal.description}</p>
                            )}
                          </div>

                          {/* Nutritional information */}
                          <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="font-semibold">{meal.calories}</p>
                              <p className="text-xs text-muted-foreground">Calories</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.protein}g</p>
                              <p className="text-xs text-muted-foreground">Protein</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.carbs}g</p>
                              <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                            <div>
                              <p className="font-semibold">{meal.fat}g</p>
                              <p className="text-xs text-muted-foreground">Fat</p>
                            </div>
                          </div>

                          {/* Ingredients and preparation */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="mt-2 w-full">
                                  <Info className="h-4 w-4 mr-2" />
                                  View Recipe Details
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-4" side="bottom">
                                <div className="space-y-2">
                                  <h5 className="font-medium">Ingredients:</h5>
                                  <ul className="list-disc pl-5 text-sm">
                                    {meal.ingredients?.map((ingredient: string, i: number) => (
                                      <li key={i}>{ingredient}</li>
                                    ))}
                                  </ul>

                                  <h5 className="font-medium pt-2">Preparation:</h5>
                                  <p className="text-sm">{meal.preparation}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <MealPlanPdf
              mealPlan={mealPlan}
              dietPreference={dietPreference}
              dietGoal={dietGoal}
              calorieGoal={calorieGoal}
              dietPeriod={dietPeriod}
            />
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
