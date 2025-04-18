"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Check } from "lucide-react"
import { BackButton } from "@/components/back-button"

const formSchema = z.object({
  transactionId: z.string().min(6, {
    message: "Transaction ID must be at least 6 characters.",
  }),
})

export default function UpgradePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionId: "",
    },
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            setUserData(docSnap.data())

            // If user is already premium, redirect to dashboard
            if (docSnap.data().subscription === "premium") {
              router.push("/dashboard")
              toast({
                title: "Already Premium",
                description: "You are already a premium user.",
              })
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserData()
  }, [user, router, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return

    setIsSubmitting(true)
    try {
      // In a real implementation, this would call an API to verify the payment
      // For this demo, we'll simulate a payment verification process

      // 1. Send transaction data to Google Sheets via API
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          transactionId: values.transactionId,
        }),
      })

      // 2. For demo purposes, we'll assume the payment is verified
      // In a real implementation, you would check the response from the API

      // 3. Update user subscription status
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        subscription: "premium",
        premiumSince: new Date().toISOString(),
      })

      toast({
        title: "Upgrade successful",
        description: "You are now a premium user!",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error upgrading to premium:", error)
      toast({
        title: "Upgrade failed",
        description: "Failed to verify payment. Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <BackButton href="/dashboard" />
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Premium</h1>
      </div>
      <p className="text-muted-foreground">Unlock unlimited meal plans and expert dietitian support</p>

      {/* Dietitian Profile Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle>Meet Your Personal Dietitian</CardTitle>
          <CardDescription>Premium members get personalized diet plans directly from our expert</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src="/images/dietitian.jpg" alt="Dietitian" />
            <AvatarFallback className="text-2xl">SV</AvatarFallback>
          </Avatar>
          <div className="space-y-4 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold">Shubhanshu Vishwakarma</h3>
              <p className="text-muted-foreground">Certified Nutrition Expert</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Certified Dietitian
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Nutrition Specialist
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  5+ Years Experience
                </Badge>
              </div>
            </div>
            <p className="text-sm md:text-base">
              "I'm passionate about helping people achieve their health goals through personalized nutrition plans. As a
              premium member, you'll receive customized meal plans tailored specifically to your body type, preferences,
              and health objectives."
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Current plan</CardDescription>
            <div className="mt-4 text-4xl font-bold">
              ₹0<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>3 AI-generated meal plans per month</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Basic nutritional information</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Support chatbot</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4 text-red-500"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Unlimited meal plans</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4 text-red-500"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Personalized dietitian consultation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <CardDescription>Recommended</CardDescription>
            <div className="mt-4 text-4xl font-bold">
              ₹499<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Unlimited AI-generated meal plans</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Detailed nutritional information</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Priority support chatbot</span>
              </li>
              <li className="flex items-center font-medium">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Personalized diet plans from Shubhanshu Vishwakarma</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Customized workout plans</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Scan the QR code to make a payment and enter the transaction ID below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium">Scan to Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground">
                Scan the QR code using any UPI app and complete the payment.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <img src="/images/payment-qr.jpg" alt="UPI QR Code" className="h-64 w-64" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Amount: ₹499</p>
              <p>UPI ID: caloriex@upi</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID (UTR)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the transaction ID from your payment receipt" {...field} />
                    </FormControl>
                    <FormDescription>
                      You can find the transaction ID (UTR) in your payment app after completing the payment.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? "Verifying Payment..." : "Verify Payment"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
