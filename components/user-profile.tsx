"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { BMICalculator } from "./bmi-calculator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const medicalConditions = [
  { id: "none", label: "None" },
  { id: "diabetes", label: "Diabetes" },
  { id: "thyroid", label: "Thyroid" },
  { id: "pcod", label: "PCOD/PCOS" },
  { id: "high-cholesterol", label: "High Cholesterol" },
  { id: "hypertension", label: "Hypertension" },
  { id: "heart-disease", label: "Heart Disease" },
]

const activityLevels = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "light", label: "Lightly active (light exercise/sports 1-3 days/week)" },
  { value: "moderate", label: "Moderately active (moderate exercise/sports 3-5 days/week)" },
  { value: "active", label: "Very active (hard exercise/sports 6-7 days a week)" },
  { value: "extra-active", label: "Extra active (very hard exercise, physical job or training twice a day)" },
]

// Updated Zod Schema with new fields
const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender.",
  }),
  age: z.coerce.number().positive("Please enter a valid age."),
  weight: z.coerce.number().positive("Please enter a valid weight in kg."),
  height: z.coerce.number().positive("Please enter a valid height in cm."),
  dietPreference: z.enum(
    [
      "vegetarian",
      "vegan",
      "non-veg",
      "eggetarian",
      "gluten-free",
      "intermittent-fasting",
      "blood-type",
      "indian-vegetarian",
      "hindu-fasting",
      "jain-diet",
      "sattvic-diet",
      "indian-regional",
    ],
    {
      required_error: "Please select a diet preference.",
    },
  ),
  dietGoal: z.enum(["weight-loss", "weight-gain", "muscle-building", "lean-mass", "keto", "maintenance"], {
    required_error: "Please select a diet goal.",
  }),
  medicalConditions: z.array(z.string()).default([]),
  allergies: z.string().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "extra-active"], {
    required_error: "Please select your activity level.",
  }),
})

export function UserProfile({
  userData: initialUserData,
  onProfileUpdate,
}: {
  userData: any
  onProfileUpdate?: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(initialUserData)
  const [bmiKey, setBmiKey] = useState<number>(0) // Key to force BMI component to re-render

  // Initialize form with user data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      gender: userData?.gender || "male",
      age: userData?.age || 0,
      weight: userData?.weight || 0,
      height: userData?.height || 0,
      dietPreference: userData?.dietPreference || "non-veg",
      dietGoal: userData?.dietGoal || "weight-loss",
      medicalConditions: userData?.medicalConditions || [],
      allergies: userData?.allergies || "",
      activityLevel: userData?.activityLevel || "moderate",
    },
  })

  // Update form when userData changes
  useEffect(() => {
    if (userData) {
      form.reset({
        fullName: userData.fullName || "",
        gender: userData.gender || "male",
        age: userData.age || 0,
        weight: userData.weight || 0,
        height: userData.height || 0,
        dietPreference: userData.dietPreference || "non-veg",
        dietGoal: userData.dietGoal || "weight-loss",
        medicalConditions: userData.medicalConditions || [],
        allergies: userData.allergies || "",
        activityLevel: userData.activityLevel || "moderate",
      })
    }
  }, [userData, form])

  // Check if userData is valid
  if (!userData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load your profile data. Please try refreshing the page or contact support.
        </AlertDescription>
      </Alert>
    )
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      })
      setIsUpdating(false)
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, values)

      // Fetch the updated user data from Firestore
      const updatedUserDoc = await getDoc(userRef)
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data()

        // Update the local state with the new data
        setUserData(updatedUserData)

        // Force BMI component to re-render
        setBmiKey((prevKey) => prevKey + 1)

        // Call the onProfileUpdate callback if provided
        if (onProfileUpdate) {
          onProfileUpdate()
        }
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile. Please try again.")
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Calculate BMI to provide a recommended diet goal
  const bmi = userData?.weight && userData?.height ? userData.weight / Math.pow(userData.height / 100, 2) : null

  // Get recommended diet goal based on BMI and gender
  const getRecommendedDietGoal = (bmi: number, gender: string) => {
    if (bmi < 18.5) return "weight-gain"
    if (bmi >= 25) return "weight-loss"
    return gender === "male" ? "muscle-building" : "lean-mass"
  }

  const recommendedGoal = bmi && userData?.gender ? getRecommendedDietGoal(bmi, userData.gender) : null

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="175" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dietPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Preference</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select diet preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="indian-vegetarian">Indian Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                          <SelectItem value="eggetarian">Eggetarian</SelectItem>
                          <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                          <SelectItem value="intermittent-fasting">Intermittent Fasting</SelectItem>
                          <SelectItem value="blood-type">Blood Type Diet</SelectItem>
                          <SelectItem value="hindu-fasting">Hindu Fasting</SelectItem>
                          <SelectItem value="jain-diet">Jain Diet</SelectItem>
                          <SelectItem value="sattvic-diet">Sattvic Diet</SelectItem>
                          <SelectItem value="indian-regional">Indian Regional Diet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dietGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Goal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select diet goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weight-loss">Weight Loss</SelectItem>
                          <SelectItem value="weight-gain">Weight Gain</SelectItem>
                          <SelectItem value="muscle-building">Muscle Building</SelectItem>
                          <SelectItem value="lean-mass">Lean Mass Gain</SelectItem>
                          <SelectItem value="keto">Keto Diet</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      {recommendedGoal && field.value !== recommendedGoal && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on your BMI, we recommend a{" "}
                          <span
                            className="text-primary cursor-pointer underline"
                            onClick={() => form.setValue("dietGoal", recommendedGoal)}
                          >
                            {recommendedGoal.replace("-", " ")}
                          </span>{" "}
                          goal.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Activity Level Field */}
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Activity Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      This helps us calculate your daily calorie needs more accurately.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allergies Field */}
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies/Intolerances</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any food allergies or intolerances (e.g., nuts, dairy, shellfish)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      We'll ensure these foods are excluded from your meal plans.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medical Conditions Field */}
              <FormField
                control={form.control}
                name="medicalConditions"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">Medical Conditions</FormLabel>
                      <FormDescription>
                        Select any medical conditions you have for personalized meal plans.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {medicalConditions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="medicalConditions"
                          render={({ field }) => {
                            return (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      // If "None" is selected, clear all other selections
                                      if (item.id === "none" && checked) {
                                        return field.onChange(["none"])
                                      }

                                      // If any other condition is selected, remove "None"
                                      let newValue = field.value?.filter((value) => value !== "none") || []

                                      if (checked) {
                                        newValue.push(item.id)
                                      } else {
                                        newValue = newValue.filter((value) => value !== item.id)
                                      }

                                      // If no conditions are selected, default to "None"
                                      if (newValue.length === 0) {
                                        newValue = ["none"]
                                      }

                                      return field.onChange(newValue)
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* BMI Calculator */}
      {userData?.weight && userData?.height && (
        <BMICalculator
          key={bmiKey} // This forces re-render when data changes
          weight={userData.weight}
          height={userData.height}
          gender={userData.gender || "male"}
        />
      )}
    </div>
  )
}
