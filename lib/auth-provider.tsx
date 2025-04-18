"use client"

import type React from "react"

import { createContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  signup: (email: string, password: string, userData: any) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getUserData: () => Promise<any>
  resetPassword: (email: string) => Promise<void>
  ensureUserProfile: (user: User) => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  getUserData: async () => ({}),
  resetPassword: async () => {},
  ensureUserProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Function to ensure a user profile exists
  const ensureUserProfile = async (currentUser: User) => {
    if (!currentUser || !currentUser.uid) {
      throw new Error("Invalid user provided to ensureUserProfile")
    }

    try {
      const docRef = doc(db, "users", currentUser.uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        // Create a basic profile if one doesn't exist
        const defaultProfile = {
          email: currentUser.email,
          fullName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          createdAt: new Date().toISOString(),
          subscription: "free",
          mealPlansGenerated: 0,
          // Default values for required fields
          gender: "male",
          age: 30,
          weight: 70,
          height: 170,
          dietPreference: "non-veg",
          dietGoal: "weight-loss",
          medicalConditions: ["none"],
          allergies: "",
          activityLevel: "moderate",
        }

        await setDoc(docRef, defaultProfile)

        toast({
          title: "Profile created",
          description: "We've created a default profile for you. Please update your details.",
        })

        // Return the created profile
        return defaultProfile
      }

      // Return the existing profile data
      return docSnap.data()
    } catch (error) {
      console.error("Error ensuring user profile:", error)
      toast({
        title: "Profile Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    // Set loading to true initially
    setLoading(true)

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)

        // If user is logged in, ensure they have a profile
        if (currentUser) {
          await ensureUserProfile(currentUser)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Auth state change error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const signup = async (email: string, password: string, userData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
        subscription: "free",
        mealPlansGenerated: 0,
      })

      toast({
        title: "Account created successfully",
        description: "Welcome to CalorieX!",
      })
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Ensure user has a profile after login
      await ensureUserProfile(userCredential.user)

      toast({
        title: "Logged in successfully",
        description: "Welcome back to CalorieX!",
      })
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Invalid email or password"

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later"
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Logged out successfully",
      })
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  const getUserData = async () => {
    if (!user) return null

    try {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data()
      } else {
        // If no user document exists, create one with default values
        await ensureUserProfile(user)

        // Try to get the document again
        const newDocSnap = await getDoc(docRef)
        return newDocSnap.exists() ? newDocSnap.data() : null
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      return null
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password.",
      })
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        getUserData,
        resetPassword,
        ensureUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
