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
import { History, User2, Sparkles, Utensils, RefreshCw, BarChart3, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, userData, loading, error, refreshUserData } = useAuth()
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
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center">
          <Link href="/dashboard/upgrade">
            <Button className="button-orange w-full sm:w-auto">Upgrade to Premium</Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto mb-8 p-1 bg-gray-800/80 backdrop-blur-sm sticky top-[65px] z-10 shadow-md rounded-xl overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <BarChart3 className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="enhanced-meal-plan"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Sparkles className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">AI Meal Plan</span>
          </TabsTrigger>
          <TabsTrigger
            value="calorie-tracker"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Utensils className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Calorie Tracker</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <History className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">History</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <User2 className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-8 shadow-lg border border-gray-800">
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {userData?.fullName || "User"}</h1>
              <p className="text-gray-300 mb-6 max-w-2xl">
                Track your nutrition, generate personalized meal plans, and achieve your health goals with CalorieX.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveTab("calorie-tracker")} className="button-orange">
                  <Utensils className="mr-2 h-4 w-4" />
                  Track Calories
                </Button>
                <Button onClick={() => setActiveTab("enhanced-meal-plan")} className="bg-gray-700 hover:bg-gray-600">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Meal Plan
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Dietitian Section */}
          <div className="mb-6">
            <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-green-500/10">
                    <User2 className="h-5 w-5 text-green-500" />
                  </div>
                  Your Personal Dietitian
                </CardTitle>
                <CardDescription>Get expert nutrition guidance from our certified dietitian</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <DietitianCard />
              </CardContent>
            </Card>
          </div>

          {/* Main Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                  </div>
                  BMI Calculator
                </CardTitle>
                <CardDescription>Calculate your Body Mass Index</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {userData && (
                  <BMICalculator
                    weight={userData.weight || 70}
                    height={userData.height || 170}
                    gender={userData.gender || "male"}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                    <Utensils className="h-5 w-5 text-orange-500" />
                  </div>
                  Calorie Tracker
                </CardTitle>
                <CardDescription>Track your daily nutrition</CardDescription>
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
                  <Button onClick={() => setActiveTab("calorie-tracker")} className="button-orange w-full">
                    Open Calorie Tracker
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                  </div>
                  AI Meal Plan Generator
                </CardTitle>
                <CardDescription>Create personalized meal plans</CardDescription>
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

          {/* Secondary Features */}
          <div className="grid gap-6">
            <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                    <History className="h-5 w-5 text-orange-500" />
                  </div>
                  Meal Plan History
                </CardTitle>
                <CardDescription>View your previous meal plans</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <FileText className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-medium">Your Meal Plan History</h3>
                  <p className="text-muted-foreground">Access and review your previously generated meal plans</p>
                  <Button className="button-orange w-full" onClick={() => setActiveTab("history")}>
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enhanced-meal-plan" className="space-y-6">
          <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                AI Meal Plan Generator
              </CardTitle>
              <CardDescription>Create a personalized meal plan with AI</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedMealPlanGenerator userData={userData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                  <History className="h-5 w-5 text-orange-500" />
                </div>
                Meal Plan History
              </CardTitle>
              <CardDescription>View your previous meal plans</CardDescription>
            </CardHeader>
            <CardContent>
              <MealPlanHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                  <User2 className="h-5 w-5 text-orange-500" />
                </div>
                Your Profile
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfile />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-6">
          <Card className="card-gradient overflow-hidden border-gray-800 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="mr-3 p-2 rounded-full bg-orange-500/10">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                </div>
                AI Nutrition Assistant
              </CardTitle>
              <CardDescription>Get answers to your nutrition questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Chatbot />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calorie-tracker" className="space-y-6">
          <CalorieTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
