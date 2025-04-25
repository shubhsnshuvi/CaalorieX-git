"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MealPlanHistory } from "@/components/meal-plan-history"
import { UserProfile } from "@/components/user-profile"
import { CalorieTracker } from "@/components/calorie-tracker"
import { DietitianCard } from "@/components/dietitian-card"
import Link from "next/link"
import { History, User2, Sparkles, Utensils } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { BMICalculator } from "@/components/bmi-calculator"
import { MealPlanGenerator } from "@/components/meal-plan-generator"
import { Chatbot } from "@/components/chatbot"
import { BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
            <span className="mt-1 sm:mt-0">Meal Plan</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <History className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">History</span>
          </TabsTrigger>
          <TabsTrigger
            value="daily-meal-tracker"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Utensils className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Daily Meal Diary</span>
          </TabsTrigger>
          <TabsTrigger
            value="calorie-tracker"
            className="flex flex-col py-3 px-1 h-auto text-xs sm:text-sm sm:flex-row sm:items-center sm:gap-2 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-orange-500 rounded-md transition-all"
          >
            <Utensils className="h-4 w-4 mx-auto sm:mx-0" />
            <span className="mt-1 sm:mt-0">Calorie Tracker</span>
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
                <CardTitle>Daily Meal Diary</CardTitle>
                <CardDescription className="text-black">Track your meals and nutrition</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <BarChart3 className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-medium">Daily Meal Diary</h3>
                  <p className="text-muted-foreground">Search foods, track meals, and monitor your nutrition</p>
                  <Link href="/daily-meal-tracker">
                    <Button className="button-orange w-full">Open Meal Diary</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-gradient">
              <CardHeader className="card-header-gradient">
                <CardTitle>Generate Meal Plan</CardTitle>
                <CardDescription className="text-black">Create a personalized meal plan</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <MealPlanGenerator />
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
        <TabsContent value="meal-plans" className="space-y-4">
          <MealPlanHistory />
        </TabsContent>
        <TabsContent value="profile" className="space-y-4">
          <UserProfile />
        </TabsContent>
        <TabsContent value="chatbot" className="space-y-4">
          <Chatbot />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings content will be added soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="support" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Get help with using CalorieX</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Support content will be added soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calorie-tracker" className="space-y-4 mt-2">
          <CalorieTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
