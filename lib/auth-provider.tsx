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
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  userData: any | null
  signup: (email: string, password: string, userData: any) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getUserData: () => Promise<any>
  resetPassword: (email: string) => Promise<void>
  ensureUserProfile: (user: User) => Promise<void>
  refreshUserData: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  userData: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  getUserData: async () => ({}),
  resetPassword: async () => {},
  ensureUserProfile: async () => {},
  refreshUserData: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
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
          createdAt: serverTimestamp(),
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

        await setDoc(docRef, defaultProfile, { merge: true })

        toast({
          title: "Profile created",
          description: "We've created a default profile for you. Please update your details.",
        })

        // Return the created profile with the id
        return { id: currentUser.uid, ...defaultProfile }
      }

      // Return the existing profile data with the id
      return { id: currentUser.uid, ...docSnap.data() }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
      setError("Failed to set up user profile. Please try again.")
      toast({
        title: "Profile Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!user) {
      setError("No user logged in")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getUserData()
      setUserData(data)
    } catch (error) {
      console.error("Error refreshing user data:", error)
      setError("Failed to refresh user data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set loading to true initially
    setLoading(true)
    setError(null)

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)

        // If user is logged in, ensure they have a profile
        if (currentUser) {
          try {
            const profileData = await ensureUserProfile(currentUser)
            setUserData(profileData)
            setError(null)
          } catch (error) {
            console.error("Error loading user profile:", error)
            setError("Unable to load your profile data. Please try refreshing the page or contact support.")
          }
        } else {
          setUserData(null)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Auth state change error:", error)
        setError("Authentication error. Please try again.")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const signup = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true)
      setError(null)

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store additional user data in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...userData,
          email,
          createdAt: serverTimestamp(),
          subscription: "free",
          mealPlansGenerated: 0,
        },
        { merge: true },
      )

      // Get the complete user data
      const profileData = await getUserData()
      setUserData(profileData)

      toast({
        title: "Account created successfully",
        description: "Welcome to CalorieX!",
      })
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "Failed to create account")
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Ensure user has a profile after login
      const profileData = await ensureUserProfile(userCredential.user)
      setUserData(profileData)

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

      setError(errorMessage)
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      setUserData(null)
      setError(null)
      toast({
        title: "Logged out successfully",
      })
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to log out")
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getUserData = async () => {
    if (!user) return null

    try {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: user.uid, ...docSnap.data() }
      } else {
        // If no user document exists, create one with default values
        const profileData = await ensureUserProfile(user)

        // Return the created profile data
        return profileData
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Unable to load your profile data. Please try refreshing the page or contact support.")
      return null
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password.",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to send password reset email")
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        userData,
        signup,
        login,
        logout,
        getUserData,
        resetPassword,
        ensureUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
