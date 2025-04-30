"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import jsPDF from "jspdf"

interface MealPlanPdfProps {
  mealPlan: any
  dietPreference: string
  dietGoal: string
  calorieGoal: number
  dietPeriod: string
}

// The component is exported as MealPlanPdf (lowercase 'p' in "Pdf")
export function MealPlanPdf({ mealPlan, dietPreference, dietGoal, calorieGoal, dietPeriod }: MealPlanPdfProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const formatDietPreference = (pref: string) => {
    return pref === "indian-vegetarian" ? "Indian Vegetarian" : pref.charAt(0).toUpperCase() + pref.slice(1)
  }

  const formatDietGoal = (goal: string) => {
    return goal
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDietPeriod = (period: string) => {
    return period.replace("-", " ")
  }

  // Check if this is a USDA-sourced meal plan
  const isUsdaMealPlan = mealPlan && mealPlan.some((day: any) => day.meals && day.meals.some((meal: any) => meal.fdcId))

  const generatePDF = async () => {
    if (!mealPlan || mealPlan.length === 0) {
      console.error("No meal plan data available")
      return
    }

    setIsGenerating(true)

    try {
      // Create a new PDF document
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2

      // Add logo and title
      pdf.setFillColor(76, 175, 80) // Green color
      pdf.rect(0, 0, pageWidth, 30, "F")

      pdf.setTextColor(255, 255, 255) // White text
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      pdf.text("CalorieX Meal Plan", pageWidth / 2, 20, { align: "center" })

      // Add meal plan details
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont("helvetica", "normal")

      // Add a section for plan details with a light background
      pdf.setFillColor(240, 240, 240)
      pdf.rect(margin, 40, contentWidth, 30, "F")

      pdf.setFont("helvetica", "bold")
      pdf.text("Plan Details", margin + 5, 48)
      pdf.setFont("helvetica", "normal")

      pdf.text(`Diet Preference: ${formatDietPreference(dietPreference)}`, margin + 5, 56)
      pdf.text(`Diet Goal: ${formatDietGoal(dietGoal)}`, margin + 5, 64)
      pdf.text(`Calorie Goal: ${calorieGoal} calories/day`, pageWidth / 2 + 5, 56)
      pdf.text(`Diet Period: ${formatDietPeriod(dietPeriod)}`, pageWidth / 2 + 5, 64)

      // Add USDA data source badge if applicable
      if (isUsdaMealPlan) {
        pdf.setFillColor(200, 230, 255)
        pdf.rect(margin, 75, 60, 10, "F")
        pdf.setTextColor(0, 100, 200)
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "bold")
        pdf.text("USDA Nutritional Data", margin + 5, 82)
      }

      // Add generation date
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 90)

      // Add a line separator
      pdf.setDrawColor(76, 175, 80)
      pdf.setLineWidth(0.5)
      pdf.line(margin, 95, pageWidth - margin, 95)

      let yPosition = 105

      // Loop through each day in the meal plan
      for (const day of mealPlan) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = 20
        }

        // Add day header with background
        pdf.setFillColor(230, 247, 230)
        pdf.rect(margin, yPosition - 6, contentWidth, 10, "F")

        pdf.setFontSize(14)
        pdf.setTextColor(0, 128, 0)
        pdf.setFont("helvetica", "bold")
        pdf.text(day.day, margin + 5, yPosition)
        yPosition += 12

        // Loop through each meal for the day
        for (const meal of day.meals) {
          // Check if we need a new page
          if (yPosition > pageHeight - 50) {
            pdf.addPage()
            yPosition = 20
          }

          // Add meal details with a light border
          pdf.setDrawColor(200, 200, 200)
          pdf.setLineWidth(0.2)
          pdf.rect(margin, yPosition - 5, contentWidth, meal.source ? 35 : 30)

          // Add meal title
          pdf.setFontSize(12)
          pdf.setTextColor(0, 0, 0)
          pdf.setFont("helvetica", "bold")
          pdf.text(`${meal.meal}:`, margin + 5, yPosition)

          // Add meal time if available
          if (meal.time) {
            pdf.setFontSize(10)
            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(100, 100, 100)
            pdf.text(`(${meal.time})`, margin + 25, yPosition)
          }

          yPosition += 6

          // Add food and quantity
          pdf.setFontSize(11)
          pdf.setTextColor(0, 0, 0)
          pdf.setFont("helvetica", "normal")
          pdf.text(`${meal.food} (${meal.quantity})`, margin + 10, yPosition)
          yPosition += 6

          // Add nutrition info
          pdf.setFontSize(10)
          pdf.setTextColor(100, 100, 100)
          pdf.text(
            `Calories: ${meal.calories} kcal | Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g`,
            margin + 10,
            yPosition,
          )
          yPosition += 6

          // Add source info if available
          if (meal.source) {
            pdf.setFontSize(8)
            if (meal.source === "usda") {
              pdf.setTextColor(0, 100, 200)
              pdf.text(`USDA ID: ${meal.id || "N/A"}`, margin + 10, yPosition)
            } else if (meal.source === "ifct") {
              pdf.setTextColor(200, 100, 0)
              pdf.text(`IFCT ID: ${meal.id || "N/A"}`, margin + 10, yPosition)
            } else {
              pdf.setTextColor(100, 100, 100)
              pdf.text(`Source: ${meal.source}`, margin + 10, yPosition)
            }
            yPosition += 6
          } else {
            yPosition += 6
          }
        }

        // Add space between days
        yPosition += 8
      }

      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)

        // Add footer line
        pdf.setDrawColor(76, 175, 80)
        pdf.setLineWidth(0.5)
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)

        // Add footer text
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text("Generated by CalorieX - Your Personalized Nutrition Journey", pageWidth / 2, pageHeight - 15, {
          align: "center",
        })
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10)
      }

      // Save the PDF
      pdf.save("CalorieX-Meal-Plan.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating || !mealPlan || mealPlan.length === 0}
      variant="outline"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download as PDF
        </>
      )}
    </Button>
  )
}
