"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/use-auth"
import { MealPlanHistory } from "@/components/meal-plan-history"
import { UserProfile } from "@/components/user-profile"
import { CalorieTracker } from "@/components/calorie-tracker"
import { DietitianCard } from "@/components/dietitian-card"
import { EnhancedMealPlanGenerator } from "@/components/enhanced-meal-plan-generator"
import { Chatbot } from "@/components/chatbot"
import { BMICalculator } from "@/components/bmi-calculator"
import { History, User2, Sparkles, Utensils, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading, error, refreshUserData } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // If there's an error loading user data, show an error message with a retry button
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md card-gradient">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>There was a problem loading your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error}</p>
            <Button onClick={refreshUserData} className="button-orange w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md card-gradient">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>Please wait while we load your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/upgrade">
            <Button className="button-orange">Upgrade to Premium</Button>
          </Link>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto mb-6 p-1 bg-gray-800/80 backdrop-blur-sm sticky top-[65px] z-10 shadow-sm">
          <TabsTrigger
            value="enhanced-meal-plan"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Sparkles className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">AI Meal Plan</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <History className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">History</span>
          </TabsTrigger>
          <TabsTrigger
            value="calorie-tracker"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Utensils className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Calorie Tracker</span>
          </TabsTrigger>
          <TabsTrigger
            value="chatbot"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Sparkles className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">AI Assistant</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <User2 className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>BMI Calculator</CardTitle>
                <CardDescription className="text-black">Calculate your Body Mass Index</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <BMICalculator />
              </CardContent>
            </Card>
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>Calorie Tracker</CardTitle>
                <CardDescription className="text-black">Track your daily nutrition</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Utensils className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-medium">Track Your Daily Calories</h3>
                  <p className="text-muted-foreground">
                    Log your meals, track macros, and monitor your nutrition goals
                  </p>
                  <Link href="/calorie-tracker">
                    <Button className="button-orange w-full">Open Calorie Tracker</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>AI Meal Plan Generator</CardTitle>
                <CardDescription className="text-black">Create personalized meal plans</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Sparkles className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-medium">AI-Powered Meal Plans</h3>
                  <p className="text-muted-foreground">Generate customized meal plans based on your preferences</p>
                  <Button className="button-orange w-full" onClick={() => setActiveTab("enhanced-meal-plan")}>
                    Generate Meal Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>Meal Plan History</CardTitle>
                <CardDescription className="text-black">View your previous meal plans</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <History className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-medium">Your Meal Plan History</h3>
                  <p className="text-muted-foreground">Access and review your previously generated meal plans</p>
                  <Button className="button-orange w-full" onClick={() => setActiveTab("history")}>
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>Personal Dietitian</CardTitle>
                <CardDescription className="text-black">Get expert nutrition advice</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <DietitianCard />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enhanced-meal-plan" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader className="card-header-gradient">
              <CardTitle>AI Meal Plan Generator</CardTitle>
              <CardDescription className="text-black">Create a personalized meal plan with AI</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedMealPlanGenerator userData={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MealPlanHistory />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <UserProfile />
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-4">
          <Chatbot />
        </TabsContent>

        <TabsContent value="calorie-tracker" className="space-y-4">
          <CalorieTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
