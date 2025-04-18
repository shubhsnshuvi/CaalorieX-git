"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, Check, Loader2 } from "lucide-react"
import { collection, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

export function IFCTDataUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus("uploading")
    setUploadProgress(0)
    setErrorMessage(null)

    try {
      // Read the file
      const fileContent = await file.text()
      const ifctData = JSON.parse(fileContent)

      if (!Array.isArray(ifctData)) {
        throw new Error("Invalid IFCT data format. Expected an array of food items.")
      }

      // Process the data in batches to avoid Firestore limits
      const batchSize = 500
      const totalItems = ifctData.length
      let processedItems = 0

      for (let i = 0; i < totalItems; i += batchSize) {
        const batch = writeBatch(db)
        const currentBatch = ifctData.slice(i, i + batchSize)

        currentBatch.forEach((item: any, index: number) => {
          // Generate a document ID
          const docId = `ifct_${item.id || `food_${i + index}`}`
          const foodRef = doc(collection(db, "ifct_foods"), docId)

          // Process the food item
          const processedItem = {
            id: docId,
            name: item.name || "Unknown Food",
            category: item.category || "Uncategorized",
            isVegetarian: item.isVegetarian || true,
            isVegan: item.isVegan || false,
            containsGluten: item.containsGluten || false,
            containsOnionGarlic: item.containsOnionGarlic || false,
            containsRootVegetables: item.containsRootVegetables || false,
            nutrients: {
              calories: item.nutrients?.calories || item.energy || 0,
              protein: item.nutrients?.protein || item.protein || 0,
              carbohydrates: item.nutrients?.carbohydrates || item.carbohydrates || 0,
              fat: item.nutrients?.fat || item.fat || 0,
              fiber: item.nutrients?.fiber || item.fiber || 0,
              sugar: item.nutrients?.sugar || item.sugar || 0,
              sodium: item.nutrients?.sodium || item.sodium || 0,
              calcium: item.nutrients?.calcium || item.calcium || 0,
              iron: item.nutrients?.iron || item.iron || 0,
            },
            standardPortion: {
              amount: item.standardPortion?.amount || 100,
              unit: item.standardPortion?.unit || "g",
            },
            // Generate keywords for better searching
            keywords: generateKeywords(item.name),
            source: "ifct",
            updatedAt: new Date().toISOString(),
          }

          batch.set(foodRef, processedItem)
        })

        // Commit the batch
        await batch.commit()

        // Update progress
        processedItems += currentBatch.length
        const progress = Math.round((processedItems / totalItems) * 100)
        setUploadProgress(progress)
      }

      setUploadStatus("success")
      toast({
        title: "Upload successful",
        description: `${totalItems} IFCT food items have been uploaded to the database.`,
      })
    } catch (error: any) {
      console.error("Error uploading IFCT data:", error)
      setUploadStatus("error")
      setErrorMessage(error.message || "Failed to upload IFCT data. Please check the file format and try again.")
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload IFCT data.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Function to generate search keywords from food name
  const generateKeywords = (name: string): string[] => {
    if (!name) return []

    const keywords = new Set<string>()
    const normalizedName = name.toLowerCase().trim()

    // Add the full name
    keywords.add(normalizedName)

    // Add individual words
    const words = normalizedName.split(/\s+/)
    words.forEach((word) => {
      if (word.length > 2) {
        keywords.add(word)
      }
    })

    // Add common Indian food categories
    const indianFoodCategories = [
      "dal",
      "roti",
      "rice",
      "curry",
      "sabzi",
      "sambar",
      "idli",
      "dosa",
      "paratha",
      "chutney",
      "biryani",
      "pulao",
      "paneer",
      "chapati",
      "naan",
    ]

    indianFoodCategories.forEach((category) => {
      if (normalizedName.includes(category)) {
        keywords.add(category)
      }
    })

    return Array.from(keywords)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload IFCT Food Data</CardTitle>
        <CardDescription>Upload your IFCT food data JSON file to populate the Indian food database.</CardDescription>
      </CardHeader>
      <CardContent>
        {uploadStatus === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {uploadStatus === "success" && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Upload Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              IFCT food data has been successfully uploaded to the database.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="ifct-file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">JSON file (max 10MB)</p>
              </div>
              <input
                id="ifct-file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {uploadStatus === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          <Button
            onClick={() => document.getElementById("ifct-file-upload")?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Select IFCT Data File"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
