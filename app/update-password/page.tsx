"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { confirmPasswordReset, verifyPasswordResetCode, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/use-auth"
import { BackButton } from "@/components/back-button"

// Define form schema using Zod
const formSchema = z
  .object({
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function UpdatePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ensureUserProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [actionCode, setActionCode] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const oobCode = searchParams.get("oobCode")

    if (!oobCode) {
      setStatus({
        type: "error",
        message: "Invalid or expired password reset link. Please request a new password reset link.",
      })
      setIsVerifying(false)
      return
    }

    setActionCode(oobCode)

    // Verify the password reset code
    const verifyCode = async () => {
      try {
        const email = await verifyPasswordResetCode(auth, oobCode)
        setEmail(email)
        setIsVerifying(false)
      } catch (error) {
        console.error("Error verifying reset code:", error)
        setStatus({
          type: "error",
          message: "Invalid or expired password reset link. Please request a new password reset link.",
        })
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [searchParams])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!actionCode || !email) return

    setIsLoading(true)
    setStatus(null)

    try {
      // Confirm password reset with Firebase
      await confirmPasswordReset(auth, actionCode, values.password)

      // Show success message
      setStatus({
        type: "success",
        message: "Your password has been successfully updated! You will be automatically logged in.",
      })

      // Clear the form
      form.reset()

      // Automatically log the user in with the new password
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, values.password)

        // Ensure user profile exists
        await ensureUserProfile(userCredential.user)

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (loginError) {
        console.error("Auto-login error:", loginError)
        // If auto-login fails, still redirect to login page
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error: any) {
      console.error("Password update error:", error)

      setStatus({
        type: "error",
        message: "Failed to update password. The link may have expired. Please request a new password reset link.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side - Quote Section */}
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
                "Security is important to us. Create a strong password to keep your account safe."
              </p>
              <footer className="text-sm">CalorieX Security Team</footer>
            </blockquote>
          </div>
        </div>

        {/* Right Side - Update Password Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex items-center mb-4">
              <BackButton href="/reset-password" />
            </div>
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create new password</h1>
              {email && (
                <p className="text-sm text-muted-foreground">
                  Update password for <span className="font-medium">{email}</span>
                </p>
              )}
            </div>

            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link...</p>
              </div>
            ) : (
              <>
                {status && (
                  <Alert
                    variant={status.type === "error" ? "destructive" : "default"}
                    className={status.type === "success" ? "border-green-500 text-green-800 bg-green-50" : ""}
                  >
                    {status.type === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <AlertTitle>{status.type === "error" ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}

                {!status?.type || status?.type === "error" ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Password must be at least 6 characters long
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="ml-2 text-sm">Logging you in...</p>
                  </div>
                )}

                {(!status?.type || status?.type === "error") && (
                  <div className="flex items-center justify-center">
                    <Link
                      href="/reset-password"
                      className="flex items-center text-sm text-muted-foreground hover:text-primary"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Request a new reset link
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
