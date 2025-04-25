"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/use-auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function UserProfile() {
  const { user, userData, loading, error, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "male",
    weight: "",
    height: "",
    dietPreference: "non-veg",
    dietGoal: "weight-loss",
    medicalConditions: "",
    allergies: "",
    activityLevel: "moderate",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [localLoading, setLocalLoading] = useState(true)

  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        age: userData.age?.toString() || "",
        gender: userData.gender || "male",
        weight: userData.weight?.toString() || "",
        height: userData.height?.toString() || "",
        dietPreference: userData.dietPreference || "non-veg",
        dietGoal: userData.dietGoal || "weight-loss",
        medicalConditions: Array.isArray(userData.medicalConditions)
          ? userData.medicalConditions.join(", ")
          : userData.medicalConditions || "",
        allergies: userData.allergies || "",
        activityLevel: userData.activityLevel || "moderate",
      })
      setLocalLoading(false)
    } else if (!loading) {
      setLocalLoading(false)
    }
  }, [userData, loading])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Save profile data
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Convert string values to numbers where needed
      const dataToSave = {
        ...formData,
        age: Number.parseInt(formData.age) || 0,
        weight: Number.parseFloat(formData.weight) || 0,
        height: Number.parseFloat(formData.height) || 0,
        medicalConditions: formData.medicalConditions.split(",").map((item) => item.trim()),
      }

      // Update the user document
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, dataToSave)

      // Refresh user data in context
      await refreshUserData()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state
  if (localLoading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Loading your profile information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription className="text-red-500">Error loading profile</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={refreshUserData} className="mt-4 button-orange">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Update your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="input-dark"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className="input-dark opacity-70"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className="input-dark"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
              <SelectTrigger className="select-dark">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Activity Level</Label>
            <Select
              value={formData.activityLevel}
              onValueChange={(value) => handleSelectChange("activityLevel", value)}
            >
              <SelectTrigger className="select-dark">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                <SelectItem value="very-active">Very Active (hard exercise daily)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              className="input-dark"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              className="input-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dietPreference">Diet Preference</Label>
            <Select
              value={formData.dietPreference}
              onValueChange={(value) => handleSelectChange("dietPreference", value)}
            >
              <SelectTrigger className="select-dark">
                <SelectValue placeholder="Select diet preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="indian-vegetarian">Indian Vegetarian</SelectItem>
                <SelectItem value="gluten-free">Gluten Free</SelectItem>
                <SelectItem value="jain-diet">Jain Diet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dietGoal">Diet Goal</Label>
            <Select value={formData.dietGoal} onValueChange={(value) => handleSelectChange("dietGoal", value)}>
              <SelectTrigger className="select-dark">
                <SelectValue placeholder="Select diet goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight-loss">Weight Loss</SelectItem>
                <SelectItem value="weight-gain">Weight Gain</SelectItem>
                <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
                <SelectItem value="low-carb">Low Carb</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicalConditions">Medical Conditions (comma separated)</Label>
          <Textarea
            id="medicalConditions"
            name="medicalConditions"
            value={formData.medicalConditions}
            onChange={handleChange}
            className="input-dark min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies (comma separated)</Label>
          <Textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            className="input-dark min-h-[80px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving} className="button-orange">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
