"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BmiCalculator } from "@/components/bmi-calculator"
import { EnhancedMealPlanGenerator } from "@/components/enhanced-meal-plan-generator"
import { DailyMealTracker } from "@/components/daily-meal-tracker"
import { UserProfile } from "@/components/user-profile"
import { DashboardNav } from "@/components/dashboard-nav"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your nutrition and meal plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <DashboardNav activeItem="dashboard" />

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="meal-plan">Meal Plan</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BmiCalculator />
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Nutrition</CardTitle>
                    <CardDescription>Track your daily calorie and macronutrient intake</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DailyMealTracker />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="meal-plan">
              <EnhancedMealPlanGenerator />
            </TabsContent>

            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
