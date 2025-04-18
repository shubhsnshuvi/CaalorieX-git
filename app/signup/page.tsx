"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/use-auth"
import { Navbar } from "@/components/navbar"
import { BackButton } from "@/components/back-button"

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

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender.",
  }),
  age: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
    message: "Please enter a valid age.",
  }),
  weight: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
    message: "Please enter a valid weight in kg.",
  }),
  height: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
    message: "Please enter a valid height in cm.",
  }),
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
  medicalConditions: z.array(z.string()).default([]),
  allergies: z.string().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "extra-active"], {
    required_error: "Please select your activity level.",
  }),
})

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      gender: "male",
      age: "",
      weight: "",
      height: "",
      dietPreference: "non-veg",
      medicalConditions: [],
      allergies: "",
      activityLevel: "moderate",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true) // ✅ Show loading before starting async
    try {
      const userData = {
        fullName: values.fullName,
        gender: values.gender,
        age: Number.parseInt(values.age),
        weight: Number.parseInt(values.weight),
        height: Number.parseInt(values.height),
        dietPreference: values.dietPreference,
        dietGoal: "weight-loss", // Default diet goal
        medicalConditions: values.medicalConditions,
        allergies: values.allergies || "",
        activityLevel: values.activityLevel,
      }

      await signup(values.email, values.password, userData)
      alert("Signup successful!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Signup error:", error.message)
      alert(`Signup failed: ${error.message}`) // ✅ Show detailed error
    } finally {
      setIsLoading(false) // ✅ Ensure loading state is turned off
    }
  }

  return (
    <>
      <Navbar />
      <div className="container flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-green-600" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">CalorieX</span>
            </Link>
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "CalorieX has completely transformed my approach to healthy eating. The personalized meal plans are
                exactly what I needed to stay on track."
              </p>
              <footer className="text-sm">Sarah Johnson</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex items-center mb-4 lg:hidden">
              <BackButton href="/" />
            </div>
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">Enter your details below to create your account</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="grid grid-cols-3 gap-4">
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
                <FormField
                  control={form.control}
                  name="dietPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                {/* Activity Level Field */}
                <FormField
                  control={form.control}
                  name="activityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Activity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <div className="mb-4">
                        <FormLabel className="text-base">Medical Conditions</FormLabel>
                        <FormDescription>
                          Select any medical conditions you have for personalized meal plans.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                                        return checked
                                          ? field.onChange([...field.value, item.id])
                                          : field.onChange(field.value?.filter((value) => value !== item.id))
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

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </Form>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
