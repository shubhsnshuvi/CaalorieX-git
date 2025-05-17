"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useAuth } from "@/lib/use-auth"
import {
  Trash2,
  X,
  Edit,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Search,
  GripVertical,
  FileText,
  Droplet,
  History,
  SortDesc,
  PlusCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, addDays, subDays, parseISO, isToday, isYesterday, isTomorrow } from "date-fns"
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DndContext } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Types
interface FoodItem {
  id: string
  name: string
  source: string
  quantity: number
  servingSize: {
    amount: number
    unit: string
    description?: string
  }
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    // Extended nutrition data
    vitamins?: {
      a?: number
      c?: number
      d?: number
      e?: number
      k?: number
      b1?: number
      b2?: number
      b3?: number
      b5?: number
      b6?: number
      b7?: number
      b9?: number
      b12?: number
    }
    minerals?: {
      calcium?: number
      iron?: number
      magnesium?: number
      phosphorus?: number
      potassium?: number
      sodium?: number
      zinc?: number
      copper?: number
      manganese?: number
      selenium?: number
      fluoride?: number
    }
    aminoAcids?: {
      histidine?: number
      isoleucine?: number
      leucine?: number
      lysine?: number
      methionine?: number
      phenylalanine?: number
      threonine?: number
      tryptophan?: number
      valine?: number
    }
    fattyAcids?: {
      saturated?: number
      monounsaturated?: number
      polyunsaturated?: number
      omega3?: number
      omega6?: number
      trans?: number
    }
  }
  timestamp: number
  category?: string
  isFavorite?: boolean
  foodName?: string
  description?: string
}

interface NoteItem {
  id: string
  content: string
  timestamp: number
  isEditing?: boolean
}

type DiaryEntry = FoodItem | NoteItem

interface DailyGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  water?: number
  // Extended nutrition goals
  vitamins?: {
    a?: number // IU
    c?: number // mg
    d?: number // IU
    e?: number // mg
    k?: number // mcg
    b1?: number // mg
    b2?: number // mg
    b3?: number // mg
    b5?: number // mg
    b6?: number // mg
    b7?: number // mcg
    b9?: number // mcg
    b12?: number // mcg
  }
  minerals?: {
    calcium?: number // mg
    iron?: number // mg
    magnesium?: number // mg
    phosphorus?: number // mg
    potassium?: number // mg
    sodium?: number // mg
    zinc?: number // mg
    copper?: number // mg
    manganese?: number // mg
    selenium?: number // mcg
    fluoride?: number // mg
  }
  aminoAcids?: {
    histidine?: number // mg
    isoleucine?: number // mg
    leucine?: number // mg
    lysine?: number // mg
    methionine?: number // mg
    phenylalanine?: number // mg
    threonine?: number // mg
    tryptophan?: number // mg
    valine?: number // mg
  }
  fattyAcids?: {
    saturated?: number // g
    monounsaturated?: number // g
    polyunsaturated?: number // g
    omega3?: number // g
    omega6?: number // g
    trans?: number // g
  }
}

interface WaterIntake {
  amount: number // in ml
  timestamp: number
}

interface DailyLog {
  entries: DiaryEntry[]
  water: WaterIntake[]
  date: string
  updatedAt: Timestamp
}

// Unit conversion utilities
const unitConversions = {
  // Base conversions to grams (approximate)
  toGrams: {
    g: 1,
    ml: 1, // Assuming water density for simplicity
    oz: 28.35,
    cup: 240, // Assuming water/liquid
    tbsp: 15,
    tsp: 5,
    piece: 100, // Default assumption
  },
  // Descriptive names for units
  unitNames: {
    g: "grams",
    ml: "milliliters",
    oz: "ounces",
    cup: "cups",
    tbsp: "tablespoons",
    tsp: "teaspoons",
    piece: "pieces",
  },
}

// Default nutrition goals for extended nutrients
const defaultExtendedNutritionGoals = {
  vitamins: {
    a: 5000, // IU
    c: 90, // mg
    d: 600, // IU
    e: 15, // mg
    k: 120, // mcg
    b1: 1.2, // mg
    b2: 1.3, // mg
    b3: 16, // mg
    b5: 5, // mg
    b6: 1.7, // mg
    b7: 30, // mcg
    b9: 400, // mcg
    b12: 2.4, // mcg
  },
  minerals: {
    calcium: 1000, // mg
    iron: 18, // mg
    magnesium: 400, // mg
    phosphorus: 700, // mg
    potassium: 3500, // mg
    sodium: 2300, // mg
    zinc: 11, // mg
    copper: 0.9, // mg
    manganese: 2.3, // mg
    selenium: 55, // mcg
    fluoride: 4, // mg
  },
  aminoAcids: {
    histidine: 700, // mg
    isoleucine: 1400, // mg
    leucine: 2730, // mg
    lysine: 2100, // mg
    methionine: 700, // mg
    phenylalanine: 1750, // mg
    threonine: 1050, // mg
    tryptophan: 280, // mg
    valine: 1820, // mg
  },
  fattyAcids: {
    saturated: 20, // g
    monounsaturated: 44, // g
    polyunsaturated: 22, // g
    omega3: 1.6, // g
    omega6: 17, // g
    trans: 2, // g
  },
}

// Convert between units
const convertAmount = (amount: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return amount

  // Convert to grams first (as base unit)
  const inGrams = amount * (unitConversions.toGrams[fromUnit as keyof typeof unitConversions.toGrams] || 1)

  // Then convert from grams to target unit
  const conversionFactor = unitConversions.toGrams[toUnit as keyof typeof unitConversions.toGrams] || 1
  return Math.round((inGrams / conversionFactor) * 100) / 100
}

// Helper function to check if an item is a food item
const isFoodItem = (item: DiaryEntry): item is FoodItem => {
  return (item as FoodItem).nutrition !== undefined
}

// Helper function to check if an item is a note
const isNoteItem = (item: DiaryEntry): item is NoteItem => {
  return (item as NoteItem).content !== undefined
}

// Format date for display
const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMM d")
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

// Sortable Food Item Component
function SortableFoodItem({
  entry,
  toggleFavorite,
  removeEntryFromDiary,
  updateFoodServingSize,
}: {
  entry: FoodItem
  toggleFavorite: (food: FoodItem) => void
  removeEntryFromDiary: (id: string) => void
  updateFoodServingSize: (id: string, amount: number, unit: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAmount, setEditedAmount] = useState(entry.servingSize.amount)
  const [editedUnit, setEditedUnit] = useState(entry.servingSize.unit)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const handleUnitChange = (newUnit: string) => {
    // Convert the amount when unit changes
    const convertedAmount = convertAmount(editedAmount, editedUnit, newUnit)
    setEditedAmount(convertedAmount)
    setEditedUnit(newUnit)
  }

  const handleSave = () => {
    if (editedAmount <= 0) return

    if (editedAmount !== entry.servingSize.amount || editedUnit !== entry.servingSize.unit) {
      updateFoodServingSize(entry.id, editedAmount, editedUnit)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditedAmount(entry.servingSize.amount)
      setEditedUnit(entry.servingSize.unit)
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Calculate total calories and nutrients based on quantity and serving size
  const totalCalories = Math.round(entry.nutrition.calories * entry.quantity)
  const totalProtein = Math.round(entry.nutrition.protein * entry.quantity)
  const totalCarbs = Math.round(entry.nutrition.carbs * entry.quantity)
  const totalFat = Math.round(entry.nutrition.fat * entry.quantity)

  return (
    <div
      ref={setNodeRef}
      {...(isEditing ? {} : { ...attributes, ...listeners })}
      style={style}
      className={`bg-gray-800 p-3 rounded-md flex justify-between items-center ${
        isEditing ? "" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "border-2 border-orange-500 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2 w-1/3">
        <div className="p-1 hover:bg-gray-700 rounded">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <div className="font-medium text-white flex items-center">
            {entry.name}
            {entry.isFavorite && <Heart className="h-3 w-3 ml-1 text-red-500 fill-red-500" />}
          </div>
          <div className="text-xs text-gray-400">{entry.category || "Food"}</div>
        </div>
      </div>

      {/* Center section with editable serving size */}
      <div
        className="flex-1 flex justify-center items-center"
        onClick={(e) => {
          if (!isEditing) {
            e.stopPropagation()
            setIsEditing(true)
          }
        }}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 py-1" onClick={(e) => e.stopPropagation()}>
            <Input
              type="number"
              min="1"
              step="1"
              value={editedAmount}
              onChange={(e) => setEditedAmount(Number(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="bg-gray-700 border-gray-600 text-white h-8 w-20 px-2 py-1"
              ref={inputRef}
            />
            <Select value={editedUnit} onValueChange={handleUnitChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="oz">oz</SelectItem>
                <SelectItem value="cup">cup</SelectItem>
                <SelectItem value="tbsp">tbsp</SelectItem>
                <SelectItem value="tsp">tsp</SelectItem>
                <SelectItem value="piece">piece</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-white hover:bg-gray-700 px-3 py-1 rounded cursor-pointer">
            <span className="text-lg font-medium">
              {entry.quantity > 1 ? `${entry.quantity} × ` : ""}
              {entry.servingSize.amount}
              {entry.servingSize.unit}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-1/3 justify-end">
        <div className="text-right">
          <div className="text-white">{totalCalories} kcal</div>
          <div className="text-xs text-gray-400">
            P: {totalProtein}g | C: {totalCarbs}g | F: {totalFat}g
          </div>
        </div>
        <div className="flex" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(entry)
                  }}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                >
                  <Heart className={`h-4 w-4 ${entry.isFavorite ? "text-red-500 fill-red-500" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{entry.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeEntryFromDiary(entry.id)
                  }}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove food</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

// Sortable Note Item Component
function SortableNoteItem({
  entry,
  startEditingNote,
  removeEntryFromDiary,
  saveEditedNote,
  editingNoteId,
}: {
  entry: NoteItem
  startEditingNote: (id: string | null) => void
  removeEntryFromDiary: (id: string) => void
  saveEditedNote: (id: string, content: string) => void
  editingNoteId: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingNoteId === entry.id && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editingNoteId, entry.id])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      if (textareaRef.current) {
        saveEditedNote(entry.id, textareaRef.current.value)
      }
    } else if (e.key === "Escape") {
      startEditingNote(null)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editingNoteId !== entry.id ? { ...attributes, ...listeners } : {})}
      className={`bg-gray-700 p-3 rounded-md border-l-4 border-orange-500 ${
        isDragging ? "border-2 border-orange-500 shadow-lg" : ""
      } ${editingNoteId !== entry.id ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {editingNoteId === entry.id ? (
        <div className="flex flex-col gap-2">
          <Textarea
            defaultValue={entry.content}
            className="bg-gray-800 border-gray-700 text-white"
            rows={2}
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (textareaRef.current) {
                saveEditedNote(entry.id, textareaRef.current.value)
              }
            }}
          />
          <div className="text-xs text-gray-400">Press Ctrl+Enter to save or click outside to save</div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <div className="p-1 hover:bg-gray-600 rounded mt-1">
              <GripVertical className="h-4 w-4 text-gray-500" />
            </div>
            <div className="whitespace-pre-wrap text-white">{entry.content}</div>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingNote(entry.id)
                    }}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeEntryFromDiary(entry.id)
                    }}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  )
}

// Nutrient Bar Component for detailed nutrition
function NutrientBar({
  name,
  current,
  goal,
  unit,
  color = "bg-blue-500",
}: {
  name: string
  current: number
  goal: number
  unit: string
  color?: string
}) {
  const percentage = Math.min(100, (current / goal) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{name}</span>
        <span className="text-white">
          {current.toFixed(1)} / {goal} {unit}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" indicatorClassName={color} />
    </div>
  )
}

// Nutrient Donut Chart Component
function NutrientDonutChart({
  title,
  nutrients,
  goals,
  emptyMessage = "No data available",
}: {
  title: string
  nutrients: Record<string, number> | undefined
  goals: Record<string, number> | undefined
  emptyMessage?: string
}) {
  const topNutrients = useMemo(() => {
    if (!nutrients || !goals) return []
    return getTopNutrients(nutrients, goals)
  }, [nutrients, goals])

  if (!topNutrients.length) {
    return (
      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="text-white font-medium mb-2">{title}</h3>
        <div className="text-gray-400 text-center py-6">{emptyMessage}</div>
      </div>
    )
  }

  // Calculate total for the pie chart (using percentage of goal)
  const total = topNutrients.reduce((sum, item) => sum + (item.value / item.goal) * 100, 0)

  // Calculate segments for the donut chart
  let currentAngle = 0
  const segments = topNutrients.map((item, index) => {
    const percentage = (item.value / item.goal) * 100
    const normalizedPercentage = total > 0 ? (percentage / total) * 100 : 0
    const startAngle = currentAngle
    currentAngle += normalizedPercentage * 3.6 // 3.6 degrees per percentage point (360 / 100)

    return {
      ...item,
      percentage,
      normalizedPercentage,
      startAngle,
      endAngle: currentAngle,
    }
  })

  return (
    <div className="bg-gray-800 p-4 rounded-md">
      <h3 className="text-white font-medium mb-2">{title}</h3>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Donut Chart */}
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background circle */}
            <circle cx="50" cy="50" r="40" fill="#374151" />

            {/* Segments */}
            {segments.map((segment, index) => {
              // Convert angles to radians
              const startAngle = (segment.startAngle - 90) * (Math.PI / 180)
              const endAngle = (segment.endAngle - 90) * (Math.PI / 180)

              // Calculate path
              const x1 = 50 + 40 * Math.cos(startAngle)
              const y1 = 50 + 40 * Math.sin(startAngle)
              const x2 = 50 + 40 * Math.cos(endAngle)
              const y2 = 50 + 40 * Math.sin(endAngle)

              // Determine if the arc should be drawn as a large arc
              const largeArcFlag = segment.normalizedPercentage > 50 ? 1 : 0

              // Create path
              const path = [`M 50 50`, `L ${x1} ${y1}`, `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

              return (
                <path
                  key={index}
                  d={path}
                  fill={`var(--${segment.color})`}
                  className="hover:opacity-80 transition-opacity"
                />
              )
            })}

            {/* Inner circle for donut hole */}
            <circle cx="50" cy="50" r="25" fill="#1F2937" />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-400">Top {segments.length}</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 gap-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${segment.color.replace("text-", "bg-")}`}></div>
              <div className="flex-1 text-sm text-white">{segment.name}</div>
              <div className="text-sm text-gray-400">
                {Math.round(segment.value)}/{segment.goal} ({Math.round(segment.percentage)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper functions for nutrient names, units, and colors

// Vitamin helpers
function getVitaminName(key: string): string {
  const names: Record<string, string> = {
    a: "Vitamin A",
    c: "Vitamin C",
    d: "Vitamin D",
    e: "Vitamin E",
    k: "Vitamin K",
    b1: "Vitamin B1 (Thiamine)",
    b2: "Vitamin B2 (Riboflavin)",
    b3: "Vitamin B3 (Niacin)",
    b5: "Vitamin B5 (Pantothenic Acid)",
    b6: "Vitamin B6 (Pyridoxine)",
    b7: "Vitamin B7 (Biotin)",
    b9: "Vitamin B9 (Folate)",
    b12: "Vitamin B12 (Cobalamin)",
  }
  return names[key] || `Vitamin ${key.toUpperCase()}`
}

function getVitaminUnit(key: string): string {
  const units: Record<string, string> = {
    a: "IU",
    d: "IU",
    b7: "mcg",
    b9: "mcg",
    b12: "mcg",
    k: "mcg",
  }
  return units[key] || "mg"
}

function getVitaminColor(key: string): string {
  const colors: Record<string, string> = {
    a: "bg-orange-500",
    c: "bg-yellow-500",
    d: "bg-yellow-600",
    e: "bg-green-500",
    k: "bg-green-600",
    b1: "bg-blue-400",
    b2: "bg-blue-500",
    b3: "bg-blue-600",
    b5: "bg-indigo-400",
    b6: "bg-indigo-500",
    b7: "bg-indigo-600",
    b9: "bg-purple-500",
    b12: "bg-purple-600",
  }
  return colors[key] || "bg-blue-500"
}

// Mineral helpers
function getMineralName(key: string): string {
  const names: Record<string, string> = {
    calcium: "Calcium",
    iron: "Iron",
    magnesium: "Magnesium",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    sodium: "Sodium",
    zinc: "Zinc",
    copper: "Copper",
    manganese: "Manganese",
    selenium: "Selenium",
    fluoride: "Fluoride",
  }
  return names[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

function getMineralUnit(key: string): string {
  const units: Record<string, string> = {
    selenium: "mcg",
  }
  return units[key] || "mg"
}

function getMineralColor(key: string): string {
  const colors: Record<string, string> = {
    calcium: "bg-gray-400",
    iron: "bg-red-600",
    magnesium: "bg-green-500",
    phosphorus: "bg-yellow-500",
    potassium: "bg-purple-500",
    sodium: "bg-blue-500",
    zinc: "bg-gray-500",
    copper: "bg-orange-500",
    manganese: "bg-pink-500",
    selenium: "bg-yellow-600",
    fluoride: "bg-blue-400",
  }
  return colors[key] || "bg-gray-500"
}

// Amino acid helpers
function getAminoAcidName(key: string): string {
  const names: Record<string, string> = {
    histidine: "Histidine",
    isoleucine: "Isoleucine",
    leucine: "Leucine",
    lysine: "Lysine",
    methionine: "Methionine",
    phenylalanine: "Phenylalanine",
    threonine: "Threonine",
    tryptophan: "Tryptophan",
    valine: "Valine",
  }
  return names[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

// Fatty acid helpers
function getFattyAcidName(key: string): string {
  const names: Record<string, string> = {
    saturated: "Saturated Fat",
    monounsaturated: "Monounsaturated Fat",
    polyunsaturated: "Polyunsaturated Fat",
    omega3: "Omega-3 Fatty Acids",
    omega6: "Omega-6 Fatty Acids",
    trans: "Trans Fat",
  }
  return names[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

function getFattyAcidColor(key: string): string {
  const colors: Record<string, string> = {
    saturated: "bg-red-500",
    monounsaturated: "bg-yellow-500",
    polyunsaturated: "bg-green-500",
    omega3: "bg-blue-500",
    omega6: "bg-purple-500",
    trans: "bg-red-600",
  }
  return colors[key] || "bg-yellow-500"
}

// Helper function to get top nutrients for visualization
function getTopNutrients(
  nutrients: Record<string, number> = {},
  goals: Record<string, number> = {},
  count = 5,
): { name: string; value: number; goal: number; color: string }[] {
  if (!nutrients || Object.keys(nutrients).length === 0) return []

  // Filter out undefined or zero values
  const filteredEntries = Object.entries(nutrients).filter(
    ([key, value]) => value !== undefined && value > 0 && goals[key] !== undefined && goals[key] > 0,
  )

  // Sort by percentage of goal achieved
  const sortedEntries = filteredEntries.sort((a, b) => {
    const aPercentage = (a[1] / goals[a[0]]) * 100
    const bPercentage = (b[1] / goals[b[0]]) * 100
    return bPercentage - aPercentage
  })

  // Take top N entries
  const topEntries = sortedEntries.slice(0, count)

  // Map to required format with colors
  return topEntries.map(([key, value], index) => {
    let color
    let name

    if (
      key.startsWith("vitamin") ||
      ["a", "c", "d", "e", "k", "b1", "b2", "b3", "b5", "b6", "b7", "b9", "b12"].includes(key)
    ) {
      color = getVitaminColor(key)
      name = getVitaminName(key)
    } else if (
      [
        "calcium",
        "iron",
        "magnesium",
        "phosphorus",
        "potassium",
        "sodium",
        "zinc",
        "copper",
        "manganese",
        "selenium",
        "fluoride",
      ].includes(key)
    ) {
      color = getMineralColor(key)
      name = getMineralName(key)
    } else if (
      [
        "histidine",
        "isoleucine",
        "leucine",
        "lysine",
        "methionine",
        "phenylalanine",
        "threonine",
        "tryptophan",
        "valine",
      ].includes(key)
    ) {
      color = `bg-purple-${300 + index * 100}`
      name = getAminoAcidName(key)
    } else if (["saturated", "monounsaturated", "polyunsaturated", "omega3", "omega6", "trans"].includes(key)) {
      color = getFattyAcidColor(key)
      name = getFattyAcidName(key)
    } else {
      // Default colors if category not recognized
      const colorOptions = [
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-red-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-orange-500",
      ]
      color = colorOptions[index % colorOptions.length]
      name = key.charAt(0).toUpperCase() + key.slice(1)
    }

    return {
      name,
      value,
      goal: goals[key],
      color: color.replace("bg-", ""),
    }
  })
}

export function CalorieTracker() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"diary" | "goals">("diary")
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 66,
  })
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [showFoodDialog, setShowFoodDialog] = useState<boolean>(false)
  const [servingSize, setServingSize] = useState<{ amount: number; unit: string }>({
    amount: 1,
    unit: "piece",
  })
  const [quantity, setQuantity] = useState<number>(1)
  const [newNote, setNewNote] = useState<string>("")
  const [showNoteDialog, setShowNoteDialog] = useState<boolean>(false)
  const [waterAmount, setWaterAmount] = useState<number>(250)
  const [showWaterDialog, setShowWaterDialog] = useState<boolean>(false)
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [showRecentFoods, setShowRecentFoods] = useState<boolean>(false)
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([])
  const [showFavoriteFoods, setShowFavoriteFoods] = useState<boolean>(false)
  const [sortOrder, setSortOrder] = useState<"time" | "category" | "custom">("time")
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Fetch daily log on date change
  useEffect(() => {
    if (!user) return

    const fetchDailyLog = async () => {
      const dailyLogRef = doc(db, "users", user.uid, "dailyLogs", selectedDate)
      const dailyLogSnap = await getDoc(dailyLogRef)

      if (dailyLogSnap.exists()) {
        setDailyLog(dailyLogSnap.data() as DailyLog)
      } else {
        // Create a new daily log if one doesn't exist
        await setDoc(dailyLogRef, {
          entries: [],
          water: [],
          date: selectedDate,
          updatedAt: Timestamp.now(),
        })
        setDailyLog({ entries: [], water: [], date: selectedDate, updatedAt: Timestamp.now() })
      }
    }

    fetchDailyLog()
  }, [user, selectedDate])

  // Fetch daily goals on mount
  useEffect(() => {
    if (!user) return

    const fetchDailyGoals = async () => {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists() && userSnap.data().dailyGoals) {
        setDailyGoals(userSnap.data().dailyGoals)
      }
    }

    fetchDailyGoals()
  }, [user])

  // Fetch recent foods on mount
  useEffect(() => {
    if (!user) return

    const fetchRecentFoods = async () => {
      const recentFoodsRef = collection(db, "users", user.uid, "recentFoods")
      const q = query(recentFoodsRef, orderBy("timestamp", "desc"), limit(10))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        foods.push(doc.data() as FoodItem)
      })
      setRecentFoods(foods)
    }

    fetchRecentFoods()
  }, [user])

  // Fetch favorite foods on mount
  useEffect(() => {
    if (!user) return

    const fetchFavoriteFoods = async () => {
      const favoriteFoodsRef = collection(db, "users", user.uid, "favoriteFoods")
      const q = query(favoriteFoodsRef, orderBy("timestamp", "desc"), limit(10))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        foods.push(doc.data() as FoodItem)
      })
      setFavoriteFoods(foods)
    }

    fetchFavoriteFoods()
  }, [user])

  // Update daily log in Firestore
  const updateDailyLog = async (updatedLog: DailyLog) => {
    if (!user) return

    const dailyLogRef = doc(db, "users", user.uid, "dailyLogs", selectedDate)
    await updateDoc(dailyLogRef, {
      entries: updatedLog.entries,
      water: updatedLog.water,
      updatedAt: Timestamp.now(),
    })
  }

  // Update daily goals in Firestore
  const updateDailyGoalsInFirestore = async (updatedGoals: DailyGoals) => {
    if (!user) return

    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, {
      dailyGoals: updatedGoals,
    })
  }

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  // Go to previous day
  const goToPreviousDay = () => {
    const previousDate = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
    setSelectedDate(previousDate)
  }

  // Go to next day
  const goToNextDay = () => {
    const nextDate = format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
    setSelectedDate(nextDate)
  }

  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setShowSearchResults(term.length > 0)

    if (term.length > 0) {
      setIsSearching(true)
      searchFoods(term)
        .then((results) => {
          setSearchResults(results)
          setIsSearching(false)
        })
        .catch((error) => {
          console.error("Error searching foods:", error)
          setIsSearching(false)
        })
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Search foods from various sources
  const searchFoods = async (term: string): Promise<FoodItem[]> => {
    if (!user) return []

    const usdaFoods = await searchUsdaFoods(term)
    const ifctFoods = await searchIfctFoods(term)
    const customFoods = await searchCustomFoods(term, user.uid)
    const templateFoods = await searchTemplateFoods(term, user.uid)
    const defaultFoods = await searchDefaultFoods(term)

    // Combine and deduplicate results
    const combinedResults: FoodItem[] = [...usdaFoods, ...ifctFoods, ...customFoods, ...templateFoods, ...defaultFoods]
    const uniqueResults = Array.from(
      new Map(combinedResults.map((item) => [`${item.source}-${item.id}`, item])).values(),
    )

    return uniqueResults
  }

  // Replace the searchUsdaFoods function with this version that uses our server API route
  // instead of directly accessing the USDA API with the API key

  const searchUsdaFoods = async (term: string): Promise<FoodItem[]> => {
    try {
      // Use our server API route instead of directly accessing the USDA API
      const response = await fetch(`/api/usda?action=search&query=${encodeURIComponent(term)}`)

      if (!response.ok) {
        throw new Error(`USDA API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.foods) {
        return data.foods.map((food: any) => ({
          id: food.fdcId.toString(),
          name: food.description || food.foodDescription || "Unknown Food",
          source: "usda",
          quantity: 1,
          servingSize: {
            amount: 1,
            unit: "piece",
          },
          nutrition: {
            calories: food.foodNutrients?.find((nutrient: any) => nutrient.nutrientName === "Energy")?.value || 0,
            protein: food.foodNutrients?.find((nutrient: any) => nutrient.nutrientName === "Protein")?.value || 0,
            carbs:
              food.foodNutrients?.find((nutrient: any) => nutrient.nutrientName === "Carbohydrate, by difference")
                ?.value || 0,
            fat: food.foodNutrients?.find((nutrient: any) => nutrient.nutrientName === "Total lipid (fat)")?.value || 0,
          },
          timestamp: Date.now(),
        }))
      } else {
        return []
      }
    } catch (error) {
      console.error("Error searching USDA foods:", error)
      return []
    }
  }

  // Search IFCT foods
  const searchIfctFoods = async (term: string): Promise<FoodItem[]> => {
    try {
      const ifctFoodsRef = collection(db, "ifctFoods")
      const q = query(ifctFoodsRef, where("foodName", ">=", term), where("foodName", "<=", term + "\uf8ff"), limit(5))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        foods.push({
          id: doc.id,
          name: data.foodName || "Unknown Food",
          foodName: data.foodName,
          description: data.foodName,
          source: "ifct",
          quantity: 1,
          servingSize: {
            amount: 100,
            unit: "g",
          },
          nutrition: {
            calories: data.Energy || 0,
            protein: data.Protein || 0,
            carbs: data.Carbohydrate || 0,
            fat: data.Fat || 0,
          },
          timestamp: Date.now(),
        })
      })
      return foods
    } catch (error) {
      console.error("Error searching IFCT foods:", error)
      return []
    }
  }

  // Search custom foods
  const searchCustomFoods = async (term: string, userId: string): Promise<FoodItem[]> => {
    try {
      const customFoodsRef = collection(db, "users", userId, "customFoods")
      const q = query(customFoodsRef, where("name", ">=", term), where("name", "<=", term + "\uf8ff"), limit(5))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        foods.push({
          id: doc.id,
          name: data.name || "Custom Food",
          source: "custom",
          quantity: 1,
          servingSize: {
            amount: data.servingSize?.amount || 1,
            unit: data.servingSize?.unit || "serving",
          },
          nutrition: {
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
          },
          timestamp: Date.now(),
        })
      })
      return foods
    } catch (error) {
      console.error("Error searching custom foods:", error)
      return []
    }
  }

  // Search template foods
  const searchTemplateFoods = async (term: string, userId: string): Promise<FoodItem[]> => {
    try {
      const templateFoodsRef = collection(db, "users", userId, "mealTemplates")
      const q = query(templateFoodsRef, where("name", ">=", term), where("name", "<=", term + "\uf8ff"), limit(5))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        foods.push({
          id: doc.id,
          name: data.name || data.templateName || "Meal Template",
          source: "template",
          quantity: 1,
          servingSize: {
            amount: 1,
            unit: "serving",
          },
          nutrition: {
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
          },
          timestamp: Date.now(),
        })
      })
      return foods
    } catch (error) {
      console.error("Error searching template foods:", error)
      return []
    }
  }

  // Search default foods
  const searchDefaultFoods = async (term: string): Promise<FoodItem[]> => {
    try {
      const defaultFoodsRef = collection(db, "defaultFoods")
      const q = query(defaultFoodsRef, where("name", ">=", term), where("name", "<=", term + "\uf8ff"), limit(5))
      const querySnapshot = await getDocs(q)
      const foods: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        foods.push({
          id: doc.id,
          name: data.name || "Default Food",
          source: "default",
          quantity: 1,
          servingSize: {
            amount: 1,
            unit: "serving",
          },
          nutrition: {
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
          },
          timestamp: Date.now(),
        })
      })
      return foods
    } catch (error) {
      console.error("Error searching default foods:", error)
      return []
    }
  }

  // Handle food selection from search results
  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food)
    setServingSize(food.servingSize)
    setShowSearchResults(false)
    setShowFoodDialog(true)
    setQuantity(1)

    // Add to recent foods
    addFoodToRecentFoods(food)

    // Clear search input
    setSearchTerm("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
  }

  // Add food to recent foods
  const addFoodToRecentFoods = async (food: FoodItem) => {
    if (!user) return

    try {
      // Check if the food already exists in recent foods
      const recentFoodsRef = collection(db, "users", user.uid, "recentFoods")
      const q = query(recentFoodsRef, where("id", "==", food.id), where("source", "==", food.source), limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Add the food to recent foods if it doesn't exist
        await addDoc(recentFoodsRef, {
          ...food,
          timestamp: Date.now(),
        })

        // Update the recentFoods state
        setRecentFoods((prevFoods) => [food, ...prevFoods.slice(0, 9)])
      } else {
        // If the food exists, update its timestamp
        querySnapshot.forEach(async (docSnapshot) => {
          const foodRef = doc(db, "users", user.uid, "recentFoods", docSnapshot.id)
          await updateDoc(foodRef, {
            timestamp: Date.now(),
          })

          // Update the recentFoods state
          setRecentFoods((prevFoods) => {
            const updatedFoods = prevFoods.map((prevFood) => {
              if (prevFood.id === food.id && prevFood.source === food.source) {
                return { ...prevFood, timestamp: Date.now() }
              }
              return prevFood
            })
            return updatedFoods.sort((a, b) => b.timestamp - a.timestamp)
          })
        })
      }
    } catch (error) {
      console.error("Error adding food to recent foods:", error)
    }
  }

  // Toggle favorite food status
  const toggleFavorite = async (food: FoodItem) => {
    if (!user) return

    try {
      const favoriteFoodsRef = collection(db, "users", user.uid, "favoriteFoods")
      const q = query(favoriteFoodsRef, where("id", "==", food.id), where("source", "==", food.source), limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // Add the food to favorites if it doesn't exist
        await addDoc(favoriteFoodsRef, {
          ...food,
          timestamp: Date.now(),
        })
        setFavoriteFoods((prevFoods) => [food, ...prevFoods.slice(0, 9)])

        // Update the food in the diary to be a favorite
        updateFoodInDiary(food.id, food.source, { isFavorite: true })
      } else {
        // Remove the food from favorites if it exists
        querySnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(docSnapshot.ref)
        })
        setFavoriteFoods((prevFoods) =>
          prevFoods.filter((prevFood) => prevFood.id !== food.id || prevFood.source !== food.source),
        )

        // Update the food in the diary to not be a favorite
        updateFoodInDiary(food.id, food.source, { isFavorite: false })
      }
    } catch (error) {
      console.error("Error toggling favorite food:", error)
    }
  }

  // Update food in diary
  const updateFoodInDiary = async (foodId: string, foodSource: string, updates: Partial<FoodItem>) => {
    if (!user || !dailyLog) return

    const updatedEntries = dailyLog.entries.map((entry) => {
      if (isFoodItem(entry) && entry.id === foodId && entry.source === foodSource) {
        return { ...entry, ...updates }
      }
      return entry
    })

    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }
    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
  }

  // Handle serving size unit change
  const handleServingSizeUnitChange = (unit: string) => {
    setServingSize({ ...servingSize, unit })
  }

  // Calculate nutrition value based on serving size and quantity
  const calculateNutritionValue = (food: FoodItem, nutrient: string, amount: number, unit: string): number => {
    let baseValue = 0

    if (nutrient === "calories") {
      baseValue = food.nutrition.calories
    } else if (nutrient === "protein") {
      baseValue = food.nutrition.protein
    } else if (nutrient === "carbohydrates") {
      baseValue = food.nutrition.carbs
    } else if (nutrient === "fat") {
      baseValue = food.nutrition.fat
    }

    const convertedAmount = convertAmount(amount, unit, food.servingSize.unit)
    const valuePerServing = (baseValue / food.servingSize.amount) * convertedAmount

    return Math.round(valuePerServing * quantity)
  }

  // Add food to diary
  const addFoodToDiary = async () => {
    if (!user || !dailyLog || !selectedFood) return

    const foodToAdd: FoodItem = {
      ...selectedFood,
      id: `${selectedFood.id}-${Date.now()}`, // Ensure unique ID
      quantity: quantity,
      servingSize: {
        amount: servingSize.amount,
        unit: servingSize.unit,
      },
      timestamp: Date.now(),
    }

    const updatedEntries = [...dailyLog.entries, foodToAdd]
    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
    setShowFoodDialog(false)
  }

  // Add note to diary
  const addNoteToDiary = async () => {
    if (!user || !dailyLog || !newNote.trim()) return

    const noteToAdd: NoteItem = {
      id: Date.now().toString(), // Unique ID for the note
      content: newNote.trim(),
      timestamp: Date.now(),
    }

    const updatedEntries = [...dailyLog.entries, noteToAdd]
    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
    setShowNoteDialog(false)
    setNewNote("")
  }

  // Start editing note
  const startEditingNote = (id: string | null) => {
    setEditingNoteId(id)
  }

  // Save edited note
  const saveEditedNote = async (id: string, content: string) => {
    if (!user || !dailyLog) return

    const updatedEntries = dailyLog.entries.map((entry) => {
      if (isNoteItem(entry) && entry.id === id) {
        return { ...entry, content: content }
      }
      return entry
    })

    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }
    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
    setEditingNoteId(null)
  }

  // Add water intake
  const addWaterIntake = async () => {
    if (!user || !dailyLog) return

    const waterEntry: WaterIntake = {
      amount: waterAmount,
      timestamp: Date.now(),
    }

    const updatedWater = [...dailyLog.water, waterEntry]
    const updatedLog: DailyLog = { ...dailyLog, water: updatedWater }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
    setShowWaterDialog(false)
  }

  // Remove water entry
  const removeWaterEntry = async (timestamp: number) => {
    if (!user || !dailyLog) return

    const updatedWater = dailyLog.water.filter((entry) => entry.timestamp !== timestamp)
    const updatedLog: DailyLog = { ...dailyLog, water: updatedWater }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
  }

  // Remove entry from diary
  const removeEntryFromDiary = async (id: string) => {
    if (!user || !dailyLog) return

    const updatedEntries = dailyLog.entries.filter((entry) => entry.id !== id)
    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
  }

  // Update food serving size
  const updateFoodServingSize = async (id: string, amount: number, unit: string) => {
    if (!user || !dailyLog) return

    const updatedEntries = dailyLog.entries.map((entry) => {
      if (isFoodItem(entry) && entry.id === id) {
        return {
          ...entry,
          servingSize: {
            amount: amount,
            unit: unit,
          },
        }
      }
      return entry
    })

    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }
    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
  }

  // Update daily goals
  const updateDailyGoals = async (updates: Partial<DailyGoals>) => {
    if (!user) return

    const updatedGoals = { ...dailyGoals, ...updates }
    setDailyGoals(updatedGoals as DailyGoals)
    await updateDailyGoalsInFirestore(updatedGoals as DailyGoals)
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false)
    const { active, over } = event

    if (!over || active?.id === over?.id) {
      return
    }

    const oldIndex = dailyLog?.entries.findIndex((item) => item.id === active.id)
    const newIndex = dailyLog?.entries.findIndex((item) => item.id === over.id)

    if (oldIndex === undefined || newIndex === undefined || !dailyLog) {
      return
    }

    const updatedEntries = arrayMove(dailyLog.entries, oldIndex, newIndex)
    const updatedLog: DailyLog = { ...dailyLog, entries: updatedEntries }

    setDailyLog(updatedLog)
    await updateDailyLog(updatedLog)
  }

  // Sort diary entries
  const sortedDiaryEntries = useMemo(() => {
    if (!dailyLog) return []

    const sortedEntries = [...dailyLog.entries]

    if (sortOrder === "time") {
      sortedEntries.sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOrder === "category") {
      sortedEntries.sort((a, b) => {
        if (isFoodItem(a) && isFoodItem(b)) {
          return (a.category || "Food").localeCompare(b.category || "Food")
        } else if (isFoodItem(a)) {
          return -1 // Food items before notes
        } else if (isFoodItem(b)) {
          return 1 // Food items before notes
        } else {
          return 0 // Keep original order for notes
        }
      })
    }

    return sortedEntries
  }, [dailyLog, sortOrder])

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0
    let fiber = 0
    let sugar = 0
    let sodium = 0
    const vitamins: Record<string, number> = {}
    const minerals: Record<string, number> = {}
    const aminoAcids: Record<string, number> = {}
    const fattyAcids: Record<string, number> = {}

    if (dailyLog) {
      dailyLog.entries.forEach((entry) => {
        if (isFoodItem(entry)) {
          const totalCalories = entry.nutrition.calories * entry.quantity
          const totalProtein = entry.nutrition.protein * entry.quantity
          const totalCarbs = entry.nutrition.carbs * entry.quantity
          const totalFat = entry.nutrition.fat * entry.quantity
          const totalFiber = (entry.nutrition.fiber || 0) * entry.quantity
          const totalSugar = (entry.nutrition.sugar || 0) * entry.quantity
          const totalSodium = (entry.nutrition.sodium || 0) * entry.quantity

          calories += totalCalories
          protein += totalProtein
          carbs += totalCarbs
          fat += totalFat
          fiber += totalFiber
          sugar += totalSugar
          sodium += totalSodium

          // Aggregate vitamins
          if (entry.nutrition.vitamins) {
            Object.entries(entry.nutrition.vitamins).forEach(([key, value]) => {
              if (value) {
                vitamins[key] = (vitamins[key] || 0) + value * entry.quantity
              }
            })
          }

          // Aggregate minerals
          if (entry.nutrition.minerals) {
            Object.entries(entry.nutrition.minerals).forEach(([key, value]) => {
              if (value) {
                minerals[key] = (minerals[key] || 0) + value * entry.quantity
              }
            })
          }

          // Aggregate amino acids
          if (entry.nutrition.aminoAcids) {
            Object.entries(entry.nutrition.aminoAcids).forEach(([key, value]) => {
              if (value) {
                aminoAcids[key] = (aminoAcids[key] || 0) + value * entry.quantity
              }
            })
          }

          // Aggregate fatty acids
          if (entry.nutrition.fattyAcids) {
            Object.entries(entry.nutrition.fattyAcids).forEach(([key, value]) => {
              if (value) {
                fattyAcids[key] = (fattyAcids[key] || 0) + value * entry.quantity
              }
            })
          }
        }
      })
    }

    return {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      vitamins,
      minerals,
      aminoAcids,
      fattyAcids,
    }
  }, [dailyLog])

  // Calculate total water intake
  const totalWaterIntake = useMemo(() => {
    let total = 0
    if (dailyLog) {
      dailyLog.water.forEach((entry) => {
        total += entry.amount
      })
    }
    return total
  }, [dailyLog])

  // Calculate macro distribution
  const macroDistribution = useMemo(() => {
    const total = dailyTotals.protein + dailyTotals.carbs + dailyTotals.fat
    const protein = total > 0 ? (dailyTotals.protein / total) * 100 : 0
    const carbs = total > 0 ? (dailyTotals.carbs / total) * 100 : 0
    const fat = total > 0 ? (dailyTotals.fat / total) * 100 : 0

    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    }
  }, [dailyTotals])

  // Calculate remaining values
  const remaining = useMemo(() => {
    const calories = dailyGoals.calories - dailyTotals.calories

    return {
      calories,
    }
  }, [dailyTotals, dailyGoals])

  // Calculate percentages
  const percentages = useMemo(() => {
    const calories = Math.min(100, (dailyTotals.calories / dailyGoals.calories) * 100)
    const protein = Math.min(100, (dailyTotals.protein / dailyGoals.protein) * 100)
    const carbs = Math.min(100, (dailyTotals.carbs / dailyGoals.carbs) * 100)
    const fat = Math.min(100, (dailyTotals.fat / dailyGoals.fat) * 100)
    const fiber = Math.min(100, (dailyTotals.fiber / (dailyGoals.fiber || 30)) * 100)
    const sugar = Math.min(100, (dailyTotals.sugar / (dailyGoals.sugar || 50)) * 100)
    const sodium = Math.min(100, (dailyTotals.sodium / (dailyGoals.sodium || 2300)) * 100)
    const water = Math.min(100, (totalWaterIntake / (dailyGoals.water || 2000)) * 100)

    return {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      water,
    }
  }, [dailyTotals, dailyGoals, totalWaterIntake])

  // Add CSS variables for chart colors
  const chartColorStyles = `
  :root {
    --blue-300: rgb(147, 197, 253);
    --blue-400: rgb(96, 165, 250);
    --blue-500: rgb(59, 130, 246);
    --blue-600: rgb(37, 99, 235);
    --green-400: rgb(74, 222, 128);
    --green-500: rgb(34, 197, 94);
    --green-600: rgb(22, 163, 74);
    --yellow-400: rgb(250, 204, 21);
    --yellow-500: rgb(234, 179, 8);
    --yellow-600: rgb(202, 138, 4);
    --red-400: rgb(248, 113, 113);
    --red-500: rgb(239, 68, 68);
    --red-600: rgb(220, 38, 38);
    --purple-300: rgb(216, 180, 254);
    --purple-400: rgb(192, 132, 252);
    --purple-500: rgb(168, 85, 247);
    --purple-600: rgb(147, 51, 234);
    --orange-400: rgb(251, 146, 60);
    --orange-500: rgb(249, 115, 22);
    --orange-600: rgb(234, 88, 12);
    --pink-400: rgb(244, 114, 182);
    --pink-500: rgb(236, 72, 153);
    --pink-600: rgb(219, 39, 119);
    --indigo-400: rgb(129, 140, 248);
    --indigo-500: rgb(99, 102, 241);
    --indigo-600: rgb(79, 70, 229);
  }
`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: chartColorStyles }} />
      <div className="flex flex-col space-y-4">
        {/* Top Section: Date Navigation, Search, and Macro Summary */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardContent className="p-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={goToPreviousDay} className="text-white hover:bg-gray-800">
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold text-white">{formatDateForDisplay(selectedDate)}</h2>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-orange-500 mr-1" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white w-auto text-sm"
                  />
                </div>
              </div>

              <Button variant="ghost" onClick={goToNextDay} className="text-white hover:bg-gray-800">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Macro Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Calories</span>
                  <span className={`text-sm ${remaining.calories < 0 ? "text-red-500" : "text-green-500"}`}>
                    {Math.round(dailyTotals.calories)} / {dailyGoals.calories}
                  </span>
                </div>
                <Progress
                  value={percentages.calories}
                  className="h-2 mt-1"
                  indicatorClassName={remaining.calories < 0 ? "bg-red-500" : "bg-orange-500"}
                />
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Protein</span>
                  <span className="text-sm text-white">
                    {Math.round(dailyTotals.protein)}g / {dailyGoals.protein}g
                  </span>
                </div>
                <Progress value={percentages.protein} className="h-2 mt-1" indicatorClassName="bg-blue-500" />
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Carbs</span>
                  <span className="text-sm text-white">
                    {Math.round(dailyTotals.carbs)}g / {dailyGoals.carbs}g
                  </span>
                </div>
                <Progress value={percentages.carbs} className="h-2 mt-1" indicatorClassName="bg-green-500" />
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Fat</span>
                  <span className="text-sm text-white">
                    {Math.round(dailyTotals.fat)}g / {dailyGoals.fat}g
                  </span>
                </div>
                <Progress value={percentages.fat} className="h-2 mt-1" indicatorClassName="bg-yellow-500" />
              </div>
            </div>

            {/* Search Bar and Quick Actions */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for a food item..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="bg-gray-800 border-gray-700 text-white pl-8"
                    ref={searchInputRef}
                  />
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="flex justify-between items-center p-2 border-b border-gray-700">
                      <span className="text-sm font-medium text-white">Search Results</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSearchResults(false)}
                        className="h-6 w-6 p-0 text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul>
                      {searchResults.map((food) => (
                        <li
                          key={`${food.source}-${food.id}`}
                          className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800 text-white"
                          onClick={() => handleFoodSelect(food)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{food.name || food.foodName || food.description}</div>
                              <div className="text-xs text-gray-400">
                                {food.source === "ifct"
                                  ? "Indian Food Database"
                                  : food.source === "custom"
                                    ? "Custom Foods"
                                    : food.source === "template"
                                      ? "Meal Template"
                                      : food.source === "default"
                                        ? "Default Foods"
                                        : "USDA"}
                              </div>
                            </div>
                            {food.isFavorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && isSearching && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3 text-white">
                    Searching for "{searchTerm}"...
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && !isSearching && searchTerm.trim() !== "" && (
                  <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3 text-white">
                    No foods found. Try a different search term.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => setShowNoteDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Note
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowWaterDialog(true)}>
                  <Droplet className="h-4 w-4 mr-1" />
                  Water
                </Button>
              </div>
            </div>

            {/* Quick Access Buttons */}
            <div className="flex justify-between mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecentFoods(!showRecentFoods)}
                className="text-white border-gray-700"
              >
                <History className="h-4 w-4 mr-1" />
                Recent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFavoriteFoods(!showFavoriteFoods)}
                className="text-white border-gray-700"
              >
                <Heart className="h-4 w-4 mr-1" />
                Favorites
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "time" ? "category" : "time")}
                className="text-white border-gray-700"
              >
                <SortDesc className="h-4 w-4 mr-1" />
                {sortOrder === "time" ? "By Time" : sortOrder === "category" ? "By Type" : "Custom Order"}
              </Button>
            </div>

            {/* Recent Foods Panel */}
            {showRecentFoods && recentFoods.length > 0 && (
              <div className="mt-3 bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-medium">Recent Foods</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecentFoods(false)}
                    className="h-6 w-6 p-0 text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-24">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recentFoods.map((food) => (
                      <Button
                        key={food.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-left text-white hover:bg-gray-700 h-auto py-1"
                        onClick={() => handleFoodSelect(food)}
                      >
                        <div className="truncate flex-1">
                          {food.name}
                          <span className="text-xs text-gray-400 ml-1">
                            ({Math.round(food.nutrition.calories)} kcal)
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Favorite Foods Panel */}
            {showFavoriteFoods && favoriteFoods.length > 0 && (
              <div className="mt-3 bg-gray-800 p-2 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-medium">Favorite Foods</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFavoriteFoods(false)}
                    className="h-6 w-6 p-0 text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-24">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {favoriteFoods.map((food) => (
                      <Button
                        key={food.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-left text-white hover:bg-gray-700 h-auto py-1"
                        onClick={() => handleFoodSelect(food)}
                      >
                        <div className="truncate flex-1 flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                          {food.name}
                          <span className="text-xs text-gray-400 ml-1">
                            ({Math.round(food.nutrition.calories)} kcal)
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Food Diary List */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex justify-between items-center">
              <span>Food Diary</span>
              <span className={`text-sm ${remaining.calories < 0 ? "text-red-500" : "text-green-500"}`}>
                {remaining.calories < 0 ? "Over by " : ""}
                {Math.abs(Math.round(remaining.calories))} kcal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDiaryEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No entries yet. Add foods or notes to get started.</div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setIsDragging(false)}
              >
                <SortableContext
                  items={sortedDiaryEntries.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sortedDiaryEntries.map((entry) => {
                      if (isFoodItem(entry)) {
                        // Render food item
                        return (
                          <SortableFoodItem
                            key={entry.id}
                            entry={entry}
                            toggleFavorite={toggleFavorite}
                            removeEntryFromDiary={removeEntryFromDiary}
                            updateFoodServingSize={updateFoodServingSize}
                          />
                        )
                      } else if (isNoteItem(entry)) {
                        // Render note item
                        return (
                          <SortableNoteItem
                            key={entry.id}
                            entry={entry}
                            startEditingNote={startEditingNote}
                            removeEntryFromDiary={removeEntryFromDiary}
                            saveEditedNote={saveEditedNote}
                            editingNoteId={editingNoteId}
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Water Intake Log */}
            {dailyLog?.water.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                  Water Intake
                </h3>
                <div className="space-y-2">
                  {dailyLog.water.map((entry) => (
                    <div
                      key={entry.timestamp}
                      className="bg-gray-800 p-2 rounded-md flex justify-between items-center border-l-4 border-blue-500"
                    >
                      <div>
                        <div className="text-white">{entry.amount}ml</div>
                        <div className="text-xs text-gray-400">{format(new Date(entry.timestamp), "h:mm a")}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWaterEntry(entry.timestamp)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Summary */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Macronutrient Distribution */}
            <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
              <div className="w-40 h-40 rounded-full border-8 border-gray-700 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(
          rgb(59, 130, 246) 0% ${macroDistribution.protein}%, 
          rgb(34, 197, 94) ${macroDistribution.protein}% ${macroDistribution.protein + macroDistribution.carbs}%, 
          rgb(234, 179, 8) ${macroDistribution.protein + macroDistribution.carbs}% 100%
        )`,
                  }}
                ></div>
                <div className="w-28 h-28 bg-gray-800 rounded-full flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{Math.round(dailyTotals.calories)}</div>
                    <div className="text-sm text-gray-400">calories</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center flex-1">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-white font-medium">Protein</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.protein)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.protein}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-white font-medium">Carbs</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.carbs)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.carbs}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-white font-medium">Fat</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Math.round(dailyTotals.fat)}g</div>
                  <div className="text-sm text-gray-400">{macroDistribution.fat}%</div>
                </div>
              </div>
            </div>

            {/* Detailed Nutrition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-white font-medium">Macronutrients</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Calories</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.calories)} / {dailyGoals.calories} kcal
                    </span>
                  </div>
                  <Progress
                    value={percentages.calories}
                    className="h-2"
                    indicatorClassName={remaining.calories < 0 ? "bg-red-500" : "bg-orange-500"}
                  />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Protein</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.protein)} / {dailyGoals.protein} g
                    </span>
                  </div>
                  <Progress value={percentages.protein} className="h-2" indicatorClassName="bg-blue-500" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Carbs</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.carbs)} / {dailyGoals.carbs} g
                    </span>
                  </div>
                  <Progress value={percentages.carbs} className="h-2" indicatorClassName="bg-green-500" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fat</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.fat)} / {dailyGoals.fat} g
                    </span>
                  </div>
                  <Progress value={percentages.fat} className="h-2" indicatorClassName="bg-yellow-500" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-medium">Additional Nutrients</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fiber</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.fiber)} / {dailyGoals.fiber || 30} g
                    </span>
                  </div>
                  <Progress value={percentages.fiber} className="h-2" indicatorClassName="bg-purple-500" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sugar</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.sugar)} / {dailyGoals.sugar || 50} g
                    </span>
                  </div>
                  <Progress value={percentages.sugar} className="h-2" indicatorClassName="bg-pink-500" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sodium</span>
                    <span className="text-white">
                      {Math.round(dailyTotals.sodium)} / {dailyGoals.sodium || 2300} mg
                    </span>
                  </div>
                  <Progress value={percentages.sodium} className="h-2" indicatorClassName="bg-red-500" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Water</span>
                    <span className="text-white">
                      {totalWaterIntake} / {dailyGoals.water || 2000} ml
                    </span>
                  </div>
                  <Progress value={percentages.water} className="h-2" indicatorClassName="bg-blue-500" />
                </div>
              </div>
            </div>

            {/* Micronutrient Donut Charts */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <NutrientDonutChart
                title="Vitamins"
                nutrients={dailyTotals.vitamins}
                goals={dailyGoals.vitamins}
                emptyMessage="No vitamin data recorded today"
              />

              <NutrientDonutChart
                title="Minerals"
                nutrients={dailyTotals.minerals}
                goals={dailyGoals.minerals}
                emptyMessage="No mineral data recorded today"
              />

              <NutrientDonutChart
                title="Amino Acids"
                nutrients={dailyTotals.aminoAcids}
                goals={dailyGoals.aminoAcids}
                emptyMessage="No amino acid data recorded today"
              />

              <NutrientDonutChart
                title="Fatty Acids"
                nutrients={dailyTotals.fattyAcids}
                goals={dailyGoals.fattyAcids}
                emptyMessage="No fatty acid data recorded today"
              />
            </div>

            {/* Info tooltip for micronutrient charts */}
            <div className="mt-2 flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-sm text-gray-400 cursor-help">
                      <Info className="h-4 w-4 mr-1" />
                      <span>About micronutrient charts</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      These charts show your top 5 micronutrients by percentage of daily goal achieved. The fuller the
                      segment, the closer you are to meeting your daily target for that nutrient.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Daily Goals Button */}
            <div className="mt-6">
              <Button onClick={() => setActiveTab("goals")} className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                Adjust Daily Goals
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Food Dialog */}
        <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Add Food</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedFood?.name || "Add this food to your diary"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-white">Serving Size</label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="1"
                      value={servingSize.amount}
                      onChange={(e) => setServingSize({ ...servingSize, amount: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white w-20 mr-2"
                    />
                    <Select value={servingSize.unit} onValueChange={handleServingSizeUnitChange}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-24">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white">Quantity</label>
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {selectedFood && (
                <div className="bg-gray-800 p-3 rounded-md">
                  <h4 className="font-medium text-white mb-2">
                    Nutrition Info (per {servingSize.amount}
                    {servingSize.unit})
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Calories:</span>
                      <span className="text-white">
                        {calculateNutritionValue(selectedFood, "calories", servingSize.amount, servingSize.unit)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Protein:</span>
                      <span className="text-white">
                        {calculateNutritionValue(selectedFood, "protein", servingSize.amount, servingSize.unit)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Carbs:</span>
                      <span className="text-white">
                        {calculateNutritionValue(selectedFood, "carbohydrates", servingSize.amount, servingSize.unit)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fat:</span>
                      <span className="text-white">
                        {calculateNutritionValue(selectedFood, "fat", servingSize.amount, servingSize.unit)}g
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFoodDialog(false)} className="border-gray-700 text-white">
                Cancel
              </Button>
              <Button onClick={addFoodToDiary} className="bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Food
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Note Dialog */}
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a note about your meals, feelings, or anything else
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Textarea
                placeholder="E.g., 'Breakfast: 2 eggs and toast', 'Feeling hungry today', 'Skipped lunch'"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNoteDialog(false)} className="border-gray-700 text-white">
                Cancel
              </Button>
              <Button onClick={addNoteToDiary} className="bg-orange-600 hover:bg-orange-700" disabled={!newNote.trim()}>
                <FileText className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Water Dialog */}
        <Dialog open={showWaterDialog} onOpenChange={setShowWaterDialog}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Add Water</DialogTitle>
              <DialogDescription className="text-gray-400">Track your water intake</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm mb-1 text-white">Amount (ml)</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWaterAmount(Math.max(50, waterAmount - 50))}
                    className="border-gray-700 text-white"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="50"
                    step="50"
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(Number.parseInt(e.target.value) || 0)}
                    className="bg-gray-800 border-gray-700 text-white text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWaterAmount(waterAmount + 50)}
                    className="border-gray-700 text-white"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-white"
                  onClick={() => setWaterAmount(250)}
                >
                  250ml
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-white"
                  onClick={() => setWaterAmount(500)}
                >
                  500ml
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-white"
                  onClick={() => setWaterAmount(1000)}
                >
                  1000ml
                </Button>
              </div>

              <div className="bg-gray-800 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Today's water intake</div>
                    <div className="text-gray-400 text-sm">Target: {dailyGoals.water || 2000}ml</div>
                  </div>
                  <div className="text-white font-medium">{totalWaterIntake}ml</div>
                </div>
                <Progress value={percentages.water} className="h-2 mt-2" indicatorClassName="bg-blue-500" />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowWaterDialog(false)}
                className="border-gray-700 text-white"
              >
                Cancel
              </Button>
              <Button onClick={addWaterIntake} className="bg-blue-600 hover:bg-blue-700">
                <Droplet className="h-4 w-4 mr-1" />
                Add Water
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Goals Dialog */}
        <Dialog
          open={activeTab === "goals"}
          onOpenChange={(open) => {
            if (!open) setActiveTab("diary")
          }}
        >
          <DialogContent className="bg-gray-900 text-white border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nutrition Goals</DialogTitle>
              <DialogDescription className="text-gray-400">Set your daily nutrition targets</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div>
                <label className="block text-sm mb-1 text-white">Daily Calories</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailyGoals.calories}
                    onChange={(e) => updateDailyGoals({ calories: Number.parseInt(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <span className="text-white">kcal</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-white">Protein</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={dailyGoals.protein}
                      onChange={(e) => updateDailyGoals({ protein: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <span className="text-white">g</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white">Carbs</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={dailyGoals.carbs}
                      onChange={(e) => updateDailyGoals({ carbs: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <span className="text-white">g</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white">Fat</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={dailyGoals.fat}
                      onChange={(e) => updateDailyGoals({ fat: Number.parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <span className="text-white">g</span>
                  </div>
                </div>
              </div>

              <Accordion type="multiple" className="bg-gray-800 rounded-md">
                {/* Basic Nutrients */}
                <AccordionItem value="basic-nutrients" className="border-b border-gray-700">
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">
                    Basic Nutrients
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-white">Fiber</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={dailyGoals.fiber || 30}
                            onChange={(e) => updateDailyGoals({ fiber: Number.parseInt(e.target.value) || 0 })}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                          <span className="text-white">g</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-white">Sugar</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={dailyGoals.sugar || 50}
                            onChange={(e) => updateDailyGoals({ sugar: Number.parseInt(e.target.value) || 0 })}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                          <span className="text-white">g</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-white">Sodium</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={dailyGoals.sodium || 2300}
                            onChange={(e) => updateDailyGoals({ sodium: Number.parseInt(e.target.value) || 0 })}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                          <span className="text-white">mg</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm mb-1 text-white">Water</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={dailyGoals.water || 2000}
                          onChange={(e) => updateDailyGoals({ water: Number.parseInt(e.target.value) || 0 })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <span className="text-white">ml</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Vitamins */}
                <AccordionItem value="vitamins" className="border-b border-gray-700">
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">Vitamins</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyGoals.vitamins &&
                        Object.entries(dailyGoals.vitamins).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm mb-1 text-white">{getVitaminName(key)}</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={value || 0}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateDailyGoals({
                                    vitamins: {
                                      ...dailyGoals.vitamins,
                                      [key]: newValue,
                                    },
                                  })
                                }}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <span className="text-white">{getVitaminUnit(key)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Minerals */}
                <AccordionItem value="minerals" className="border-b border-gray-700">
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">Minerals</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyGoals.minerals &&
                        Object.entries(dailyGoals.minerals).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm mb-1 text-white">{getMineralName(key)}</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={value || 0}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateDailyGoals({
                                    minerals: {
                                      ...dailyGoals.minerals,
                                      [key]: newValue,
                                    },
                                  })
                                }}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <span className="text-white">{getMineralUnit(key)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Amino Acids */}
                <AccordionItem value="amino-acids" className="border-b border-gray-700">
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">Amino Acids</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyGoals.aminoAcids &&
                        Object.entries(dailyGoals.aminoAcids).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm mb-1 text-white">{getAminoAcidName(key)}</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={value || 0}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateDailyGoals({
                                    aminoAcids: {
                                      ...dailyGoals.aminoAcids,
                                      [key]: newValue,
                                    },
                                  })
                                }}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <span className="text-white">mg</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Fatty Acids */}
                <AccordionItem value="fatty-acids" className="border-b-0">
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">Fatty Acids</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyGoals.fattyAcids &&
                        Object.entries(dailyGoals.fattyAcids).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm mb-1 text-white">{getFattyAcidName(key)}</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={value || 0}
                                onChange={(e) => {
                                  const newValue = Number.parseInt(e.target.value) || 0
                                  updateDailyGoals({
                                    fattyAcids: {
                                      ...dailyGoals.fattyAcids,
                                      [key]: newValue,
                                    },
                                  })
                                }}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <span className="text-white">g</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <DialogFooter>
              <Button onClick={() => setActiveTab("diary")} className="w-full bg-orange-600 hover:bg-orange-700">
                Save & Return to Diary
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
