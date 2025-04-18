"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedMealPlanGenerator } from "@/components/enhanced-meal-plan-generator"
import { MealPlanHistory } from "@/components/meal-plan-history"
import { UserProfile } from "@/components/user-profile"
import { Chatbot } from "@/components/chatbot"
import { DietitianCard } from "@/components/dietitian-card"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Target, History, User2, MessageCircleQuestion, Crown, Database, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Function to determine BMI status based on gender
const getBmiStatus = (bmi: number, gender: string) => {
  if (gender === "female") {
    if (bmi < 18.0)
      return { status: "Underweight", color: "text-blue-600 bg-blue-50", badgeColor: "bg-blue-100 text-blue-800" }
    if (bmi >= 18.0 && bmi < 24.0)
      return { status: "Normal weight", color: "text-green-600 bg-green-50", badgeColor: "bg-green-100 text-green-800" }
    if (bmi >= 24.0 && bmi < 29.0)
      return {
        status: "Overweight",
        color: "text-yellow-600 bg-yellow-50",
        badgeColor: "bg-yellow-100 text-yellow-800",
      }
    return { status: "Obese", color: "text-red-600 bg-red-50", badgeColor: "bg-red-100 text-red-800" }
  } else {
    // Male
    if (bmi < 18.5)
      return { status: "Underweight", color: "text-blue-600 bg-blue-50", badgeColor: "bg-blue-100 text-blue-800" }
    if (bmi >= 18.5 && bmi < 25.0)
      return { status: "Normal weight", color: "text-green-600 bg-green-50", badgeColor: "bg-green-100 text-green-800" }
    if (bmi >= 25.0 && bmi < 30.0)
      return {
        status: "Overweight",
        color: "text-yellow-600 bg-yellow-50",
        badgeColor: "bg-yellow-100 text-yellow-800",
      }
    return { status: "Obese", color: "text-red-600 bg-red-50", badgeColor: "bg-red-100 text-red-800" }
  }
}

// Function to format diet goal for display
const formatDietGoal = (goal: string) => {
  if (!goal) return "Not set"
  return goal
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setUserData(docSnap.data())
      } else {
        console.error("No user data found in Firestore")
        setError("User profile not found. Please contact support.")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to load user data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUserData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  // Safety check - if userData is null, show a fallback UI
  if (!userData) {
    return (
      <div className="container mx-auto p-4">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Setup Required</AlertTitle>
          <AlertDescription>
            Your profile information is missing. Please contact support or try logging out and back in.
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>Refresh</Button>
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate BMI with gender adjustment
  const standardBmi = userData?.weight && userData?.height ? userData.weight / Math.pow(userData.height / 100, 2) : null

  // Apply gender adjustment if gender is available
  const bmi =
    standardBmi && userData?.gender ? (userData.gender === "female" ? standardBmi * 0.95 : standardBmi) : standardBmi

  // Get BMI status if BMI is available
  const bmiStatus =
    bmi && userData?.gender ? getBmiStatus(bmi, userData.gender) : bmi ? getBmiStatus(bmi, "male") : null

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {userData.fullName.split(" ")[0]}</h2>
          <p className="text-muted-foreground mt-1">Manage your nutrition journey and track your progress</p>
        </div>
        {userData?.subscription === "free" ? (
          <Link href="/dashboard/upgrade">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
        ) : (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 text-sm shadow-sm">
            <Crown className="mr-2 h-4 w-4" />
            Premium Member
          </Badge>
        )}
      </div>

      {/* Dietitian Card */}
      <DietitianCard isPremium={userData?.subscription === "premium"} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-b">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Subscription</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-green-600 dark:text-green-400"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold capitalize">{userData?.subscription || "Free"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {userData?.subscription === "premium" ? "Unlimited meal plans" : "Unlimited meal plans for testing"}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-b">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Diet Preference</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold capitalize">
              {userData?.dietPreference === "indian-vegetarian"
                ? "Indian Vegetarian"
                : userData?.dietPreference === "hindu-fasting"
                  ? "Hindu Fasting"
                  : userData?.dietPreference === "jain-diet"
                    ? "Jain Diet"
                    : userData?.dietPreference === "sattvic-diet"
                      ? "Sattvic Diet"
                      : userData?.dietPreference === "indian-regional"
                        ? "Indian Regional"
                        : userData?.dietPreference || "Not set"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your current diet preference</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-b">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Diet Goal</CardTitle>
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{formatDietGoal(userData?.dietGoal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Your current diet goal</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-b">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">USDA + IFCT</div>
            <p className="text-xs text-muted-foreground mt-1">Comprehensive nutrition data from both databases</p>
          </CardContent>
        </Card>
        <Card className={`overflow-hidden border-0 shadow-md ${bmiStatus ? bmiStatus.color : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
            <CardTitle className="text-sm font-medium">BMI</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{bmi ? bmi.toFixed(1) : "N/A"}</div>
            {bmiStatus && (
              <div className="mt-1">
                <Badge className={`font-normal ${bmiStatus.badgeColor}`}>{bmiStatus.status}</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              kg/m² ({userData?.gender === "female" ? "Female" : "Male"})
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="enhanced-meal-plan" className="w-full">
        {/* Mobile-friendly tabs with icons */}
        <TabsList className="grid w-full grid-cols-4 h-auto mb-6 p-1 bg-muted/80 backdrop-blur-sm sticky top-[65px] z-10 shadow-sm">
          <TabsTrigger
            value="enhanced-meal-plan"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Sparkles className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Meal Plan</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <History className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">History</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <User2 className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="support"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <MessageCircleQuestion className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Support</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="enhanced-meal-plan" className="space-y-4 mt-2">
          <EnhancedMealPlanGenerator userData={userData} />
        </TabsContent>
        <TabsContent value="history" className="space-y-4 mt-2">
          <MealPlanHistory />
        </TabsContent>
        <TabsContent value="profile" className="space-y-4 mt-2">
          <UserProfile userData={userData} onProfileUpdate={refreshUserData} />
        </TabsContent>
        <TabsContent value="support" className="space-y-4 mt-2">
          <Chatbot />
        </TabsContent>
      </Tabs>
    </div>
  )
}
