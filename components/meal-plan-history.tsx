"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MealPlanPdf } from "@/components/meal-plan-pdf"

export function MealPlanHistory() {
  const { user } = useAuth()
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMealPlans = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const mealPlansRef = collection(db, "users", user.uid, "mealPlans")
        const q = query(mealPlansRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)

        const plans: any[] = []
        querySnapshot.forEach((doc) => {
          plans.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })
        })

        setMealPlans(plans)
      } catch (error: any) {
        console.error("Error fetching meal plans:", error)
        setError(error.message || "Failed to load meal plan history. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchMealPlans()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (mealPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meal Plan History</CardTitle>
          <CardDescription>You haven't generated any meal plans yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Format diet period for display
  const formatDietPeriod = (period: string) => {
    if (!period) return ""
    return period.replace("-", " ")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meal Plan History</CardTitle>
          <CardDescription>View your previously generated meal plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {mealPlans.map((plan, index) => (
              <AccordionItem key={plan.id} value={plan.id}>
                <div className="flex w-full justify-between items-center">
                  <AccordionTrigger className="flex-1">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center gap-2">
                        <span>Meal Plan {index + 1}</span>
                        {plan.source === "usda" && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>USDA</span>
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-1 items-center">
                        <span>{format(plan.createdAt, "PPP")}</span> •<span>{plan.calorieGoal} calories</span> •
                        <span>{plan.dietPreference}</span>
                        {plan.dietPeriod && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs font-normal">
                              {formatDietPeriod(plan.dietPeriod)}
                            </Badge>
                          </>
                        )}
                        {plan.goalWeight && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs font-normal">
                              Goal: {plan.goalWeight} kg
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                    {/* The key issue was here - we need to ensure the plan.plan data is available */}
                    {plan.plan && (
                      <MealPlanPdf
                        key={`pdf-${plan.id}`}
                        mealPlan={plan.plan}
                        dietPreference={plan.dietPreference || "non-veg"}
                        dietGoal={plan.dietGoal || "weight-loss"}
                        calorieGoal={plan.calorieGoal || 2000}
                        dietPeriod={plan.dietPeriod || "4-weeks"}
                      />
                    )}
                  </div>
                </div>
                <AccordionContent>
                  <div className="space-y-6">
                    {plan.plan &&
                      plan.plan.map((day: any, dayIndex: number) => (
                        <div key={dayIndex} className="space-y-2">
                          <h3 className="font-bold">{day.day}</h3>
                          <div className="grid gap-2">
                            {day.meals.map((meal: any, mealIndex: number) => (
                              <div key={mealIndex} className="rounded-md border p-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">{meal.meal}</span>
                                  <span className="text-sm text-muted-foreground">{meal.calories} kcal</span>
                                </div>
                                <p>{meal.food}</p>
                                {meal.quantity && (
                                  <p className="text-sm text-muted-foreground">Quantity: {meal.quantity}</p>
                                )}
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <span>Protein: {meal.protein}g</span> •<span> Carbs: {meal.carbs}g</span> •
                                  <span> Fat: {meal.fat}g</span>
                                </div>
                                {meal.fdcId && (
                                  <div className="mt-1 text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      USDA FDC ID: {meal.fdcId}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
