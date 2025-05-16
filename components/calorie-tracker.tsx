"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { useAuth } from "@/lib/use-auth"
import {
  Trash2,
  X,
  RefreshCw,
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
  startEditingNote: (id: string) => void
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

// Nutrient Chart Component for visualizing micronutrient distributions
function NutrientChart({
  distribution,
  getColor,
  getName,
  title,
  emptyMessage = "No data available",
}: {
  distribution: Record<string, number>
  getColor: (key: string) => string
  getName: (key: string) => string
  title: string
  emptyMessage?: string
}) {
  const entries = Object.entries(distribution)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <div className="text-gray-400">{emptyMessage}</div>
      </div>
    )
  }

  // Sort entries by percentage (descending)
  entries.sort((a, b) => b[1] - a[1])

  // Calculate cumulative percentages for the conic gradient
  let cumulativePercentage = 0
  const gradientStops = entries.map(([key, percentage]) => {
    const start = cumulativePercentage
    cumulativePercentage += percentage
    return {
      key,
      start,
      end: cumulativePercentage,
      color: getColor(key).replace("bg-", ""),
    }
  })

  // Generate the conic gradient CSS
  const conicGradient = `conic-gradient(${gradientStops
    .map((stop) => `${tailwindBgToColor(stop.color)} ${stop.start}% ${stop.end}%`)
    .join(", ")})`

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
      <div className="w-40 h-40 rounded-full border-8 border-gray-700 flex items-center justify-center relative">
        <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }}></div>
        <div className="w-28 h-28 bg-gray-800 rounded-full flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{title}</div>
            <div className="text-xs text-gray-400">{entries.length} tracked</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center flex-1">
        {entries.slice(0, 6).map(([key, percentage]) => (
          <div key={key}>
            <div className="flex items-center justify-center gap-1">
              <div className={`w-3 h-3 rounded-full ${getColor(key)}`}></div>
              <span className="text-white font-medium text-sm truncate">{getName(key)}</span>
            </div>
            <div className="text-lg font-bold text-white">{Math.round(percentage)}%</div>
            <div className="text-xs text-gray-400">
              {Math.round(dailyTotals[key as keyof typeof dailyTotals] || 0)} /{" "}
              {dailyGoals[key as keyof typeof dailyGoals] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CalorieTracker() {
  // Auth and user data
  const { user, userData, loading: authLoading, error: authError, refreshUserData } = useAuth()

  // State for food search and selection
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [servingSize, setServingSize] = useState<{ amount: number; unit: string }>({ amount: 100, unit: "g" })
  const [showSearchResults, setShowSearchResults] = useState(false)

  // State for diary entries and goals
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70,
    fiber: 30,
    sugar: 50,
    sodium: 2300,
    water: 2000,
    ...defaultExtendedNutritionGoals,
  })
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([])
  const [newNote, setNewNote] = useState("")
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(isUserLoading)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState<"diary" | "summary" | "goals">("diary")
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([])
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [showFoodDialog, setShowFoodDialog] = useState(false)
  const [showWaterDialog, setShowWaterDialog] = useState(false)
  const [waterAmount, setWaterAmount] = useState(250)
  const [sortOrder, setSortOrder] = useState<"time" | "category" | "custom">("time")
  const [showRecentFoods, setShowRecentFoods] = useState(false)
  const [showFavoriteFoods, setShowFavoriteFoods] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedNutrients, setExpandedNutrients] = useState<string[]>([])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8px to 5px for easier activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Calculate daily totals from diary entries
  const dailyTotals = useMemo(() => {
    return diaryEntries.reduce(
      (acc, entry) => {
        if (isFoodItem(entry)) {
          acc.calories += entry.nutrition.calories * entry.quantity
          acc.protein += entry.nutrition.protein * entry.quantity
          acc.carbs += entry.nutrition.carbs * entry.quantity
          acc.fat += entry.nutrition.fat * entry.quantity

          if (entry.nutrition.fiber) {
            acc.fiber += entry.nutrition.fiber * entry.quantity
          }

          if (entry.nutrition.sugar) {
            acc.sugar += entry.nutrition.sugar * entry.quantity
          }

          if (entry.nutrition.sodium) {
            acc.sodium += entry.nutrition.sodium * entry.quantity
          }

          // Add extended nutrition data if available
          if (entry.nutrition.vitamins) {
            if (!acc.vitamins) acc.vitamins = {}
            Object.entries(entry.nutrition.vitamins).forEach(([key, value]) => {
              const k = key as keyof typeof entry.nutrition.vitamins
              if (!acc.vitamins![k]) acc.vitamins![k] = 0
              acc.vitamins![k] = (acc.vitamins![k] || 0) + (value || 0) * entry.quantity
            })
          }

          if (entry.nutrition.minerals) {
            if (!acc.minerals) acc.minerals = {}
            Object.entries(entry.nutrition.minerals).forEach(([key, value]) => {
              const k = key as keyof typeof entry.nutrition.minerals
              if (!acc.minerals![k]) acc.minerals![k] = 0
              acc.minerals![k] = (acc.minerals![k] || 0) + (value || 0) * entry.quantity
            })
          }

          if (entry.nutrition.aminoAcids) {
            if (!acc.aminoAcids) acc.aminoAcids = {}
            Object.entries(entry.nutrition.aminoAcids).forEach(([key, value]) => {
              const k = key as keyof typeof entry.nutrition.aminoAcids
              if (!acc.aminoAcids![k]) acc.aminoAcids![k] = 0
              acc.aminoAcids![k] = (acc.aminoAcids![k] || 0) + (value || 0) * entry.quantity
            })
          }

          if (entry.nutrition.fattyAcids) {
            if (!acc.fattyAcids) acc.fattyAcids = {}
            Object.entries(entry.nutrition.fattyAcids).forEach(([key, value]) => {
              const k = key as keyof typeof entry.nutrition.fattyAcids
              if (!acc.fattyAcids![k]) acc.fattyAcids![k] = 0
              acc.fattyAcids![k] = (acc.fattyAcids![k] || 0) + (value || 0) * entry.quantity
            })
          }
        }
        return acc
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        vitamins: {},
        minerals: {},
        aminoAcids: {},
        fattyAcids: {},
      },
    )
  }, [diaryEntries])

  // Calculate micronutrient distributions
  const vitaminDistribution = useMemo(() => {
    if (!dailyGoals.vitamins || !dailyTotals.vitamins) return {}

    const distribution: Record<string, number> = {}
    let totalPercentage = 0

    Object.entries(dailyGoals.vitamins).forEach(([key, goal]) => {
      if (!goal) return
      const current = dailyTotals.vitamins?.[key as keyof typeof dailyTotals.vitamins] || 0
      const percentage = Math.min(100, (current / goal) * 100)
      distribution[key] = percentage
      totalPercentage += percentage
    })

    // Normalize to ensure total is 100%
    if (totalPercentage > 0) {
      Object.keys(distribution).forEach((key) => {
        distribution[key] = (distribution[key] / totalPercentage) * 100
      })
    }

    return distribution
  }, [dailyGoals.vitamins, dailyTotals.vitamins])

  const mineralDistribution = useMemo(() => {
    if (!dailyGoals.minerals || !dailyTotals.minerals) return {}

    const distribution: Record<string, number> = {}
    let totalPercentage = 0

    Object.entries(dailyGoals.minerals).forEach(([key, goal]) => {
      if (!goal) return
      const current = dailyTotals.minerals?.[key as keyof typeof dailyTotals.minerals] || 0
      const percentage = Math.min(100, (current / goal) * 100)
      distribution[key] = percentage
      totalPercentage += percentage
    })

    // Normalize to ensure total is 100%
    if (totalPercentage > 0) {
      Object.keys(distribution).forEach((key) => {
        distribution[key] = (distribution[key] / totalPercentage) * 100
      })
    }

    return distribution
  }, [dailyGoals.minerals, dailyTotals.minerals])

  const aminoAcidDistribution = useMemo(() => {
    if (!dailyGoals.aminoAcids || !dailyTotals.aminoAcids) return {}

    const distribution: Record<string, number> = {}
    let totalPercentage = 0

    Object.entries(dailyGoals.aminoAcids).forEach(([key, goal]) => {
      if (!goal) return
      const current = dailyTotals.aminoAcids?.[key as keyof typeof dailyTotals.aminoAcids] || 0
      const percentage = Math.min(100, (current / goal) * 100)
      distribution[key] = percentage
      totalPercentage += percentage
    })

    // Normalize to ensure total is 100%
    if (totalPercentage > 0) {
      Object.keys(distribution).forEach((key) => {
        distribution[key] = (distribution[key] / totalPercentage) * 100
      })
    }

    return distribution
  }, [dailyGoals.aminoAcids, dailyTotals.aminoAcids])

  const fattyAcidDistribution = useMemo(() => {
    if (!dailyGoals.fattyAcids || !dailyTotals.fattyAcids) return {}

    const distribution: Record<string, number> = {}
    let totalPercentage = 0

    Object.entries(dailyGoals.fattyAcids).forEach(([key, goal]) => {
      if (!goal) return
      const current = dailyTotals.fattyAcids?.[key as keyof typeof dailyTotals.fattyAcids] || 0
      const percentage = Math.min(100, (current / goal) * 100)
      distribution[key] = percentage
      totalPercentage += percentage
    })

    // Normalize to ensure total is 100%
    if (totalPercentage > 0) {
      Object.keys(distribution).forEach((key) => {
        distribution[key] = (distribution[key] / totalPercentage) * 100
      })
    }

    return distribution
  }, [dailyGoals.fattyAcids, dailyTotals.fattyAcids])

  // Function to convert Tailwind bg color class to CSS color
  function tailwindBgToColor(bgClass: string): string {
    // Extract the color and shade from the class
    const match = bgClass.match(/bg-([a-z]+)-(\d+)/)
    if (!match) return "rgb(59, 130, 246)" // Default blue-500

    const [, color, shade] = match

    // Map of Tailwind colors to RGB values
    const colorMap: Record<string, Record<string, string>> = {
      red: {
        "500": "rgb(239, 68, 68)",
        "600": "rgb(220, 38, 38)",
      },
      orange: {
        "500": "rgb(249, 115, 22)",
        "600": "rgb(234, 88, 12)",
      },
      yellow: {
        "500": "rgb(234, 179, 8)",
        "600": "rgb(202, 138, 4)",
      },
      green: {
        "500": "rgb(34, 197, 94)",
        "600": "rgb(22, 163, 74)",
      },
      blue: {
        "400": "rgb(96, 165, 250)",
        "500": "rgb(59, 130, 246)",
        "600": "rgb(37, 99, 235)",
      },
      indigo: {
        "400": "rgb(129, 140, 248)",
        "500": "rgb(99, 102, 241)",
        "600": "rgb(79, 70, 229)",
      },
      purple: {
        "500": "rgb(168, 85, 247)",
        "600": "rgb(147, 51, 234)",
      },
      pink: {
        "500": "rgb(236, 72, 153)",
      },
      gray: {
        "400": "rgb(156, 163, 175)",
        "500": "rgb(107, 114, 128)",
      },
    }

    return colorMap[color]?.[shade] || "rgb(59, 130, 246)"
  }

  // Load user's daily goals and diary entries from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setIsUserLoading(false)
        return
      }

      try {
        console.log(`Loading user data for date: ${selectedDate}`)
        setIsUserLoading(true)

        // Load daily goals
        const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
        const goalsDoc = await getDoc(goalsDocRef)

        if (goalsDoc.exists()) {
          console.log("Daily goals loaded:", goalsDoc.data())
          const loadedGoals = goalsDoc.data() as DailyGoals

          // Merge with default extended nutrition goals
          const mergedGoals = {
            ...loadedGoals,
            vitamins: { ...defaultExtendedNutritionGoals.vitamins, ...loadedGoals.vitamins },
            minerals: { ...defaultExtendedNutritionGoals.minerals, ...loadedGoals.minerals },
            aminoAcids: { ...defaultExtendedNutritionGoals.aminoAcids, ...loadedGoals.aminoAcids },
            fattyAcids: { ...defaultExtendedNutritionGoals.fattyAcids, ...loadedGoals.fattyAcids },
          }

          setDailyGoals(mergedGoals)
        } else {
          // Create default goals if they don't exist
          const defaultGoals = {
            calories: userData?.dailyCalorieIntake || 2000,
            protein: 100,
            carbs: 250,
            fat: 70,
            fiber: 30,
            sugar: 50,
            sodium: 2300,
            water: 2000,
            ...defaultExtendedNutritionGoals,
          }
          console.log("Creating default goals:", defaultGoals)
          await setDoc(goalsDocRef, defaultGoals)
          setDailyGoals(defaultGoals)
        }

        // Load diary entries for the selected date
        await loadDiaryEntriesForDate(selectedDate)

        // Load favorite foods
        await loadFavoriteFoods()

        // Load recent foods
        await loadRecentFoods()
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsUserLoading(false)
      }
    }

    loadUserData()
  }, [user?.uid, selectedDate, userData?.dailyCalorieIntake])

  // Calculate total water intake
  const totalWaterIntake = useMemo(() => {
    return waterIntake.reduce((total, item) => total + item.amount, 0)
  }, [waterIntake])

  // Calculate remaining calories and macros
  const remaining = useMemo(
    () => ({
      calories: dailyGoals.calories - dailyTotals.calories,
      protein: dailyGoals.protein - dailyTotals.protein,
      carbs: dailyGoals.carbs - dailyTotals.carbs,
      fat: dailyGoals.fat - dailyTotals.fat,
      fiber: (dailyGoals.fiber || 30) - dailyTotals.fiber,
      sugar: (dailyGoals.sugar || 50) - dailyTotals.sugar,
      sodium: (dailyGoals.sodium || 2300) - dailyTotals.sodium,
      water: (dailyGoals.water || 2000) - totalWaterIntake,
    }),
    [dailyGoals, dailyTotals, totalWaterIntake],
  )

  // Calculate percentages for progress bars
  const percentages = useMemo(
    () => ({
      calories: Math.min(100, (dailyTotals.calories / dailyGoals.calories) * 100),
      protein: Math.min(100, (dailyTotals.protein / dailyGoals.protein) * 100),
      carbs: Math.min(100, (dailyTotals.carbs / dailyGoals.carbs) * 100),
      fat: Math.min(100, (dailyTotals.fat / dailyGoals.fat) * 100),
      fiber: Math.min(100, (dailyTotals.fiber / (dailyGoals.fiber || 30)) * 100),
      sugar: Math.min(100, (dailyTotals.sugar / (dailyGoals.sugar || 50)) * 100),
      sodium: Math.min(100, (dailyTotals.sodium / (dailyGoals.sodium || 2300)) * 100),
      water: Math.min(100, (totalWaterIntake / (dailyGoals.water || 2000)) * 100),
    }),
    [dailyGoals, dailyTotals, totalWaterIntake],
  )

  // Calculate macronutrient distribution
  const macroDistribution = useMemo(() => {
    const totalCalories = dailyTotals.calories
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 }

    return {
      protein: Math.round(((dailyTotals.protein * 4) / totalCalories) * 100),
      carbs: Math.round(((dailyTotals.carbs * 4) / totalCalories) * 100),
      fat: Math.round(((dailyTotals.fat * 9) / totalCalories) * 100),
    }
  }, [dailyTotals])

  // Sort diary entries
  const sortedDiaryEntries = useMemo(() => {
    if (sortOrder === "custom") {
      // When in custom order (after drag and drop), return entries as is
      return diaryEntries
    }

    const entries = [...diaryEntries]

    // Apply sorting
    if (sortOrder === "time") {
      entries.sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOrder === "category") {
      entries.sort((a, b) => {
        if (isNoteItem(a) && isFoodItem(b)) return 1
        if (isFoodItem(a) && isNoteItem(b)) return -1
        return 0
      })
    }

    return entries
  }, [diaryEntries, sortOrder])

  // Toggle expanded nutrient sections
  const toggleNutrientSection = (section: string) => {
    setExpandedNutrients((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  // Sync daily goals with user profile data
  useEffect(() => {
    if (userData?.dailyCalorieIntake && userData.dailyCalorieIntake !== dailyGoals.calories) {
      updateDailyGoals({ calories: userData.dailyCalorieIntake })
    }
  }, [userData?.dailyCalorieIntake])

  // Load diary entries for a specific date
  const loadDiaryEntriesForDate = async (date: string) => {
    if (!user?.uid) return

    try {
      console.log(`Loading diary entries for date: ${date}`)

      // Create the parent documents if they don't exist
      const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
      await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

      const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", date)
      const diaryDoc = await getDoc(diaryDocRef)

      if (diaryDoc.exists()) {
        const data = diaryDoc.data() as DailyLog
        console.log(`Found diary entries for ${date}:`, data)

        if (data.entries) {
          setDiaryEntries(data.entries)
        } else {
          setDiaryEntries([])
        }

        if (data.water) {
          setWaterIntake(data.water)
        } else {
          setWaterIntake([])
        }
      } else {
        console.log(`No diary entries found for ${date}, creating empty log`)
        setDiaryEntries([])
        setWaterIntake([])
      }
    } catch (error) {
      console.error(`Error loading diary entries for ${date}:`, error)
      setDiaryEntries([])
      setWaterIntake([])
    }
  }

  // Load favorite foods
  const loadFavoriteFoods = async () => {
    if (!user?.uid) return

    try {
      console.log("Loading favorite foods")
      const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
      const q = query(favoritesRef, limit(10))
      const querySnapshot = await getDocs(q)

      const favorites: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FoodItem
        favorites.push({
          ...data,
          id: doc.id,
          isFavorite: true,
        })
      })

      console.log(`Loaded ${favorites.length} favorite foods`)
      setFavoriteFoods(favorites)
    } catch (error) {
      console.error("Error loading favorite foods:", error)
    }
  }

  // Load recent foods
  const loadRecentFoods = async () => {
    if (!user?.uid) return

    try {
      console.log("Loading recent foods")
      const recentRef = collection(db, "users", user.uid, "recentFoods")
      const q = query(recentRef, orderBy("timestamp", "desc"), limit(10))
      const querySnapshot = await getDocs(q)

      const recent: FoodItem[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FoodItem
        recent.push({
          ...data,
          id: doc.id,
        })
      })

      console.log(`Loaded ${recent.length} recent foods`)
      setRecentFoods(recent)
    } catch (error) {
      console.error("Error loading recent foods:", error)
    }
  }

  // Save diary entries to Firestore whenever they change
  useEffect(() => {
    const saveDiaryEntries = async () => {
      if (!user?.uid) return

      try {
        console.log(`Saving diary entries for date: ${selectedDate}`)

        // Ensure parent collections/documents exist
        const nutritionDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs")
        await setDoc(nutritionDocRef, { lastUpdated: new Date() }, { merge: true })

        const diaryDocRef = doc(db, "users", user.uid, "nutrition", "dailyLogs", "logs", selectedDate)

        // Save the diary entries and water intake
        await setDoc(
          diaryDocRef,
          {
            entries: diaryEntries,
            water: waterIntake,
            date: selectedDate,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        )

        console.log("Diary entries saved successfully")
      } catch (error) {
        console.error("Error saving diary entries:", error)
      }
    }

    // Only save if we have a user and entries have been loaded (not during initial load)
    if (user?.uid && !isUserLoading) {
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveDiaryEntries, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [diaryEntries, waterIntake, user?.uid, selectedDate, isUserLoading])

  // Direct search function for IFCT foods
  const searchIFCTFoods = async (term: string) => {
    if (!term || term.length < 2) return []

    try {
      console.log("Searching IFCT for:", term)
      const foodsRef = collection(db, "ifct_foods")
      const results: any[] = []

      // First try exact keyword match
      let q = query(foodsRef, where("keywords", "array-contains", term.toLowerCase()), limit(10))
      let querySnapshot = await getDocs(q)

      if (querySnapshot.empty && term.length > 0) {
        // If no results, try partial match with a limit
        q = query(foodsRef, limit(50))
        querySnapshot = await getDocs(q)

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const name = (data.name || "").toLowerCase()

          if (name.includes(term.toLowerCase())) {
            results.push({
              id: doc.id,
              name: data.name || "Unknown Food",
              source: "ifct",
              nutrients: {
                calories: data.nutrients?.calories || 0,
                protein: data.nutrients?.protein || 0,
                fat: data.nutrients?.fat || 0,
                carbohydrates: data.nutrients?.carbohydrates || 0,
                fiber: data.nutrients?.fiber || 0,
                sugar: data.nutrients?.sugar || 0,
                sodium: data.nutrients?.sodium || 0,
                // Add extended nutrition data if available
                vitamins: data.nutrients?.vitamins || {},
                minerals: data.nutrients?.minerals || {},
                aminoAcids: data.nutrients?.aminoAcids || {},
                fattyAcids: data.nutrients?.fattyAcids || {},
              },
              category: data.category || "General",
            })
          }
        })
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          results.push({
            id: doc.id,
            name: data.name || "Unknown Food",
            source: "ifct",
            nutrients: {
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbohydrates: data.nutrients?.carbohydrates || 0,
              fiber: data.nutrients?.fiber || 0,
              sugar: data.nutrients?.sugar || 0,
              sodium: data.nutrients?.sodium || 0,
              // Add extended nutrition data if available
              vitamins: data.nutrients?.vitamins || {},
              minerals: data.nutrients?.minerals || {},
              aminoAcids: data.nutrients?.aminoAcids || {},
              fattyAcids: data.nutrients?.fattyAcids || {},
            },
            category: data.category || "General",
          })
        })
      }

      console.log(`Found ${results.length} IFCT results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching IFCT foods:", error)
      return []
    }
  }

  // Search USDA database
  const searchUSDAFoods = async (term: string) => {
    if (!term || term.length < 2) return []

    try {
      console.log("Searching USDA for:", term)
      // Use the API proxy route
      const response = await fetch(`/api/usda?action=search&query=${encodeURIComponent(term)}`)

      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.foods || data.foods.length === 0) {
        return []
      }

      const results = data.foods.map((food: any) => {
        // Extract nutrients
        const nutrients = food.foodNutrients || []
        const calories = nutrients.find((n: any) => n.nutrientNumber === "208")?.value || 0
        const protein = nutrients.find((n: any) => n.nutrientNumber === "203")?.value || 0
        const fat = nutrients.find((n: any) => n.nutrientNumber === "204")?.value || 0
        const carbs = nutrients.find((n: any) => n.nutrientNumber === "205")?.value || 0
        const fiber = nutrients.find((n: any) => n.nutrientNumber === "291")?.value || 0
        const sugar = nutrients.find((n: any) => n.nutrientNumber === "269")?.value || 0
        const sodium = nutrients.find((n: any) => n.nutrientNumber === "307")?.value || 0

        // Extract extended nutrition data
        const vitamins = {
          a: nutrients.find((n: any) => n.nutrientNumber === "320")?.value || 0,
          c: nutrients.find((n: any) => n.nutrientNumber === "401")?.value || 0,
          d: nutrients.find((n: any) => n.nutrientNumber === "328")?.value || 0,
          e: nutrients.find((n: any) => n.nutrientNumber === "323")?.value || 0,
          k: nutrients.find((n: any) => n.nutrientNumber === "430")?.value || 0,
          b1: nutrients.find((n: any) => n.nutrientNumber === "404")?.value || 0,
          b2: nutrients.find((n: any) => n.nutrientNumber === "405")?.value || 0,
          b3: nutrients.find((n: any) => n.nutrientNumber === "406")?.value || 0,
          b5: nutrients.find((n: any) => n.nutrientNumber === "410")?.value || 0,
          b6: nutrients.find((n: any) => n.nutrientNumber === "415")?.value || 0,
          b9: nutrients.find((n: any) => n.nutrientNumber === "417")?.value || 0,
          b12: nutrients.find((n: any) => n.nutrientNumber === "418")?.value || 0,
        }

        const minerals = {
          calcium: nutrients.find((n: any) => n.nutrientNumber === "301")?.value || 0,
          iron: nutrients.find((n: any) => n.nutrientNumber === "303")?.value || 0,
          magnesium: nutrients.find((n: any) => n.nutrientNumber === "304")?.value || 0,
          phosphorus: nutrients.find((n: any) => n.nutrientNumber === "305")?.value || 0,
          potassium: nutrients.find((n: any) => n.nutrientNumber === "306")?.value || 0,
          sodium: nutrients.find((n: any) => n.nutrientNumber === "307")?.value || 0,
          zinc: nutrients.find((n: any) => n.nutrientNumber === "309")?.value || 0,
          copper: nutrients.find((n: any) => n.nutrientNumber === "312")?.value || 0,
          manganese: nutrients.find((n: any) => n.nutrientNumber === "315")?.value || 0,
          selenium: nutrients.find((n: any) => n.nutrientNumber === "317")?.value || 0,
        }

        const fattyAcids = {
          saturated: nutrients.find((n: any) => n.nutrientNumber === "606")?.value || 0,
          monounsaturated: nutrients.find((n: any) => n.nutrientNumber === "645")?.value || 0,
          polyunsaturated: nutrients.find((n: any) => n.nutrientNumber === "646")?.value || 0,
          omega3: nutrients.find((n: any) => n.nutrientNumber === "851")?.value || 0,
          omega6: nutrients.find((n: any) => n.nutrientNumber === "618")?.value || 0,
          trans: nutrients.find((n: any) => n.nutrientNumber === "605")?.value || 0,
        }

        return {
          id: food.fdcId,
          name: food.description || "Unknown Food",
          source: "usda",
          nutrients: {
            calories: calories,
            protein: protein,
            fat: fat,
            carbohydrates: carbs,
            fiber: fiber,
            sugar: sugar,
            sodium: sodium,
            vitamins,
            minerals,
            fattyAcids,
          },
          category: food.foodCategory || "USDA",
        }
      })

      console.log(`Found ${results.length} USDA results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching USDA foods:", error)
      return []
    }
  }

  // Search custom foods
  const searchCustomFoods = async (term: string) => {
    if (!user?.uid || !term || term.length < 2) return []

    try {
      console.log("Searching custom foods for:", term)
      const results: any[] = []

      // Search in user's custom foods
      const customFoodsRef = collection(db, "users", user.uid, "customFoods")
      const q = query(customFoodsRef, limit(20))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const name = (data.name || "").toLowerCase()

        if (name.includes(term.toLowerCase())) {
          results.push({
            id: doc.id,
            name: data.name || "Custom Food",
            source: "custom",
            nutrients: {
              calories: data.nutrients?.calories || 0,
              protein: data.nutrients?.protein || 0,
              fat: data.nutrients?.fat || 0,
              carbohydrates: data.nutrients?.carbohydrates || 0,
              fiber: data.nutrients?.fiber || 0,
              sugar: data.nutrients?.sugar || 0,
              sodium: data.nutrients?.sodium || 0,
              vitamins: data.nutrients?.vitamins || {},
              minerals: data.nutrients?.minerals || {},
              aminoAcids: data.nutrients?.aminoAcids || {},
              fattyAcids: data.nutrients?.fattyAcids || {},
            },
            category: data.category || "Custom",
          })
        }
      })

      console.log(`Found ${results.length} custom food results for "${term}"`)
      return results
    } catch (error) {
      console.error("Error searching custom foods:", error)
      return []
    }
  }

  // Fallback search function with default foods
  const getFallbackFoods = (term: string) => {
    const defaultFoods = [
      {
        id: "default-1",
        name: "Banana",
        source: "default",
        nutrients: {
          calories: 105,
          protein: 1.3,
          fat: 0.4,
          carbohydrates: 27,
          fiber: 3.1,
          sugar: 14,
          sodium: 1,
          vitamins: {
            a: 64, // IU
            c: 10.3, // mg
            b6: 0.4, // mg
          },
          minerals: {
            potassium: 422, // mg
            magnesium: 32, // mg
          },
        },
        category: "Fruits",
      },
      {
        id: "default-2",
        name: "Apple",
        source: "default",
        nutrients: {
          calories: 95,
          protein: 0.5,
          fat: 0.3,
          carbohydrates: 25,
          fiber: 4.4,
          sugar: 19,
          sodium: 2,
          vitamins: {
            c: 8.4, // mg
          },
          minerals: {
            potassium: 195, // mg
          },
        },
        category: "Fruits",
      },
      {
        id: "default-3",
        name: "Rice (cooked)",
        source: "default",
        nutrients: {
          calories: 130,
          protein: 2.7,
          fat: 0.3,
          carbohydrates: 28,
          fiber: 0.6,
          sugar: 0.1,
          sodium: 1,
          minerals: {
            magnesium: 12, // mg
            phosphorus: 43, // mg
          },
        },
        category: "Grains",
      },
      {
        id: "default-4",
        name: "Bread, white",
        source: "default",
        nutrients: {
          calories: 75,
          protein: 2.6,
          fat: 1.0,
          carbohydrates: 14,
          fiber: 0.8,
          sugar: 1.5,
          sodium: 150,
          vitamins: {
            b1: 0.1, // mg
            b3: 1.3, // mg
          },
        },
        category: "Grains",
      },
      {
        id: "default-5",
        name: "Chicken Breast (cooked)",
        source: "default",
        nutrients: {
          calories: 165,
          protein: 31,
          fat: 3.6,
          carbohydrates: 0,
          fiber: 0,
          sugar: 0,
          sodium: 74,
          vitamins: {
            b3: 13.7, // mg
            b6: 0.6, // mg
          },
          minerals: {
            phosphorus: 228, // mg
            selenium: 27.6, // mcg
          },
          aminoAcids: {
            leucine: 2331, // mg
            lysine: 2706, // mg
          },
        },
        category: "Protein",
      },
      {
        id: "default-6",
        name: "Egg, whole",
        source: "default",
        nutrients: {
          calories: 72,
          protein: 6.3,
          fat: 4.8,
          carbohydrates: 0.4,
          fiber: 0,
          sugar: 0.4,
          sodium: 71,
          vitamins: {
            a: 270, // IU
            d: 41, // IU
            b12: 0.6, // mcg
          },
          minerals: {
            iron: 0.9, // mg
            phosphorus: 99, // mg
          },
          fattyAcids: {
            saturated: 1.6, // g
            monounsaturated: 1.9, // g
            polyunsaturated: 0.7, // g
          },
        },
        category: "Protein",
      },
      {
        id: "default-7",
        name: "Milk, whole",
        source: "default",
        nutrients: {
          calories: 61,
          protein: 3.2,
          fat: 3.3,
          carbohydrates: 4.8,
          fiber: 0,
          sugar: 4.8,
          sodium: 44,
          vitamins: {
            a: 102, // IU
            d: 49, // IU
            b12: 0.5, // mcg
          },
          minerals: {
            calcium: 113, // mg
            phosphorus: 84, // mg
          },
          fattyAcids: {
            saturated: 1.9, // g
            monounsaturated: 0.8, // g
            polyunsaturated: 0.2, // g
          },
        },
        category: "Dairy",
      },
      {
        id: "default-8",
        name: "Spinach, raw",
        source: "default",
        nutrients: {
          calories: 23,
          protein: 2.9,
          fat: 0.4,
          carbohydrates: 3.6,
          fiber: 2.2,
          sugar: 0.4,
          sodium: 79,
          vitamins: {
            a: 9377, // IU
            c: 28.1, // mg
            k: 483, // mcg
          },
          minerals: {
            calcium: 99, // mg
            iron: 2.7, // mg
            magnesium: 79, // mg
          },
        },
        category: "Vegetables",
      },
      {
        id: "default-9",
        name: "Lentils, cooked",
        source: "default",
        nutrients: {
          calories: 116,
          protein: 9.0,
          fat: 0.4,
          carbohydrates: 20.0,
          fiber: 7.9,
          sugar: 1.8,
          sodium: 2,
          vitamins: {
            b1: 0.2, // mg
            b5: 0.6, // mg
            b9: 179, // mcg
          },
          minerals: {
            iron: 3.3, // mg
            phosphorus: 180, // mg
            potassium: 365, // mg
          },
        },
        category: "Legumes",
      },
      {
        id: "default-10",
        name: "Salmon, cooked",
        source: "default",
        nutrients: {
          calories: 206,
          protein: 22.1,
          fat: 12.4,
          carbohydrates: 0,
          fiber: 0,
          sugar: 0,
          sodium: 59,
          vitamins: {
            d: 570, // IU
            b3: 8.6, // mg
            b12: 2.6, // mcg
          },
          minerals: {
            phosphorus: 218, // mg
            selenium: 36.5, // mcg
          },
          fattyAcids: {
            saturated: 2.1, // g
            monounsaturated: 3.8, // g
            polyunsaturated: 3.9, // g
            omega3: 2.3, // g
          },
        },
        category: "Protein",
      },
    ]

    if (!term) return defaultFoods

    return defaultFoods.filter((food) => food.name.toLowerCase().includes(term.toLowerCase()))
  }

  // Perform search across all sources
  const performSearch = async (term: string) => {
    if (!term || term.trim() === "") {
      setSearchResults(getFallbackFoods(""))
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    console.log("Performing search for:", term)

    try {
      // Search in parallel for faster results
      const [ifctResults, usdaResults, customResults] = await Promise.all([
        searchIFCTFoods(term),
        searchUSDAFoods(term),
        searchCustomFoods(term),
      ])

      // Get fallback results if needed
      const fallbackResults = term.length >= 2 ? getFallbackFoods(term) : []

      // Combine all results
      const combinedResults = [...ifctResults, ...usdaResults, ...customResults, ...fallbackResults]

      // Prioritize exact matches
      const exactMatches = combinedResults.filter((food) => food.name.toLowerCase() === term.toLowerCase())

      const startsWithMatches = combinedResults.filter(
        (food) =>
          food.name.toLowerCase().startsWith(term.toLowerCase()) && food.name.toLowerCase() !== term.toLowerCase(),
      )

      const otherMatches = combinedResults.filter(
        (food) =>
          !food.name.toLowerCase().startsWith(term.toLowerCase()) && food.name.toLowerCase() !== term.toLowerCase(),
      )

      // Sort results by relevance
      const sortedResults = [...exactMatches, ...startsWithMatches, ...otherMatches]

      // Limit to 20 results for performance
      const limitedResults = sortedResults.slice(0, 20)

      // Check if foods are favorites
      const enhancedResults = await enhanceResultsWithFavoriteStatus(limitedResults)

      console.log(`Found ${enhancedResults.length} total results for "${term}"`)
      setSearchResults(enhancedResults)
    } catch (error) {
      console.error("Search error:", error)
      // Use fallback foods if search fails
      setSearchResults(getFallbackFoods(term))
    } finally {
      setIsSearching(false)
    }
  }

  // Enhance search results with favorite status
  const enhanceResultsWithFavoriteStatus = async (results: any[]) => {
    if (!user?.uid) return results

    try {
      // Get all favorite food IDs
      const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
      const querySnapshot = await getDocs(favoritesRef)

      const favoriteIds = new Set()
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        favoriteIds.add(`${data.source}-${data.id}`)
      })

      // Mark favorites in results
      return results.map((food) => ({
        ...food,
        isFavorite: favoriteIds.has(`${food.source}-${food.id}`),
      }))
    } catch (error) {
      console.error("Error enhancing results with favorite status:", error)
      return results
    }
  }

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Show search results immediately when typing
    if (term.trim().length > 0) {
      setShowSearchResults(true)

      // Use a short timeout for responsive search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term)
      }, 300)
    } else {
      setShowSearchResults(false)
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Handle food selection
  const handleFoodSelect = (food: any) => {
    console.log("Selected food:", food)
    setSelectedFood(food)
    setShowSearchResults(false)
    setShowFoodDialog(true)

    // Set default serving size based on food type
    const defaultServingSize = getDefaultServingSize(food)
    setServingSize(defaultServingSize)
  }

  // Get default serving size based on food type
  const getDefaultServingSize = (food: any) => {
    const category = (food.category || "").toLowerCase()
    const name = (food.name || "").toLowerCase()

    if (category.includes("beverage") || name.includes("milk") || name.includes("juice") || name.includes("drink")) {
      return { amount: 240, unit: "ml" }
    } else if (category.includes("fruit") || name.includes("fruit")) {
      return { amount: 100, unit: "g" }
    } else if (category.includes("vegetable") || name.includes("vegetable")) {
      return { amount: 100, unit: "g" }
    } else if (
      category.includes("meat") ||
      name.includes("chicken") ||
      name.includes("beef") ||
      name.includes("fish")
    ) {
      return { amount: 85, unit: "g" }
    } else if (name.includes("rice") || name.includes("pasta") || name.includes("noodle")) {
      return { amount: 150, unit: "g" }
    } else if (name.includes("bread") || name.includes("toast")) {
      return { amount: 30, unit: "g" }
    } else if (name.includes("egg")) {
      return { amount: 50, unit: "g" }
    }

    return { amount: 100, unit: "g" }
  }

  // Handle serving size unit change with conversion
  const handleServingSizeUnitChange = (newUnit: string) => {
    // Convert the amount when unit changes
    const convertedAmount = convertAmount(servingSize.amount, servingSize.unit, newUnit)
    setServingSize({
      amount: convertedAmount,
      unit: newUnit,
    })
  }

  // Add food to diary
  const addFoodToDiary = () => {
    if (!selectedFood) return

    console.log("Adding food to diary:", selectedFood)

    // Calculate nutrition based on the food source and serving size
    const nutrition = {
      calories: calculateNutritionValue(selectedFood, "calories", servingSize.amount, servingSize.unit),
      protein: calculateNutritionValue(selectedFood, "protein", servingSize.amount, servingSize.unit),
      carbs: calculateNutritionValue(selectedFood, "carbohydrates", servingSize.amount, servingSize.unit),
      fat: calculateNutritionValue(selectedFood, "fat", servingSize.amount, servingSize.unit),
      fiber: calculateNutritionValue(selectedFood, "fiber", servingSize.amount, servingSize.unit),
      sugar: calculateNutritionValue(selectedFood, "sugar", servingSize.amount, servingSize.unit),
      sodium: calculateNutritionValue(selectedFood, "sodium", servingSize.amount, servingSize.unit),
      // Add extended nutrition data if available
      vitamins: selectedFood.nutrients?.vitamins
        ? {
            a: calculateNutritionValue(selectedFood, "vitamins.a", servingSize.amount, servingSize.unit),
            c: calculateNutritionValue(selectedFood, "vitamins.c", servingSize.amount, servingSize.unit),
            d: calculateNutritionValue(selectedFood, "vitamins.d", servingSize.amount, servingSize.unit),
            e: calculateNutritionValue(selectedFood, "vitamins.e", servingSize.amount, servingSize.unit),
            k: calculateNutritionValue(selectedFood, "vitamins.k", servingSize.amount, servingSize.unit),
            b1: calculateNutritionValue(selectedFood, "vitamins.b1", servingSize.amount, servingSize.unit),
            b2: calculateNutritionValue(selectedFood, "vitamins.b2", servingSize.amount, servingSize.unit),
            b3: calculateNutritionValue(selectedFood, "vitamins.b3", servingSize.amount, servingSize.unit),
            b5: calculateNutritionValue(selectedFood, "vitamins.b5", servingSize.amount, servingSize.unit),
            b6: calculateNutritionValue(selectedFood, "vitamins.b6", servingSize.amount, servingSize.unit),
            b9: calculateNutritionValue(selectedFood, "vitamins.b9", servingSize.amount, servingSize.unit),
            b12: calculateNutritionValue(selectedFood, "vitamins.b12", servingSize.amount, servingSize.unit),
          }
        : undefined,
      minerals: selectedFood.nutrients?.minerals
        ? {
            calcium: calculateNutritionValue(selectedFood, "minerals.calcium", servingSize.amount, servingSize.unit),
            iron: calculateNutritionValue(selectedFood, "minerals.iron", servingSize.amount, servingSize.unit),
            magnesium: calculateNutritionValue(
              selectedFood,
              "minerals.magnesium",
              servingSize.amount,
              servingSize.unit,
            ),
            phosphorus: calculateNutritionValue(
              selectedFood,
              "minerals.phosphorus",
              servingSize.amount,
              servingSize.unit,
            ),
            potassium: calculateNutritionValue(
              selectedFood,
              "minerals.potassium",
              servingSize.amount,
              servingSize.unit,
            ),
            sodium: calculateNutritionValue(selectedFood, "minerals.sodium", servingSize.amount, servingSize.unit),
            zinc: calculateNutritionValue(selectedFood, "minerals.zinc", servingSize.amount, servingSize.unit),
            copper: calculateNutritionValue(selectedFood, "minerals.copper", servingSize.amount, servingSize.unit),
            manganese: calculateNutritionValue(
              selectedFood,
              "minerals.manganese",
              servingSize.amount,
              servingSize.unit,
            ),
            selenium: calculateNutritionValue(selectedFood, "minerals.selenium", servingSize.amount, servingSize.unit),
          }
        : undefined,
      aminoAcids: selectedFood.nutrients?.aminoAcids
        ? {
            histidine: calculateNutritionValue(
              selectedFood,
              "aminoAcids.histidine",
              servingSize.amount,
              servingSize.unit,
            ),
            isoleucine: calculateNutritionValue(
              selectedFood,
              "aminoAcids.isoleucine",
              servingSize.amount,
              servingSize.unit,
            ),
            leucine: calculateNutritionValue(selectedFood, "aminoAcids.leucine", servingSize.amount, servingSize.unit),
            lysine: calculateNutritionValue(selectedFood, "aminoAcids.lysine", servingSize.amount, servingSize.unit),
            methionine: calculateNutritionValue(
              selectedFood,
              "aminoAcids.methionine",
              servingSize.amount,
              servingSize.unit,
            ),
            phenylalanine: calculateNutritionValue(
              selectedFood,
              "aminoAcids.phenylalanine",
              servingSize.amount,
              servingSize.unit,
            ),
            threonine: calculateNutritionValue(
              selectedFood,
              "aminoAcids.threonine",
              servingSize.amount,
              servingSize.unit,
            ),
            tryptophan: calculateNutritionValue(
              selectedFood,
              "aminoAcids.tryptophan",
              servingSize.amount,
              servingSize.unit,
            ),
            valine: calculateNutritionValue(selectedFood, "aminoAcids.valine", servingSize.amount, servingSize.unit),
          }
        : undefined,
      fattyAcids: selectedFood.nutrients?.fattyAcids
        ? {
            saturated: calculateNutritionValue(
              selectedFood,
              "fattyAcids.saturated",
              servingSize.amount,
              servingSize.unit,
            ),
            monounsaturated: calculateNutritionValue(
              selectedFood,
              "fattyAcids.monounsaturated",
              servingSize.amount,
              servingSize.unit,
            ),
            polyunsaturated: calculateNutritionValue(
              selectedFood,
              "fattyAcids.polyunsaturated",
              servingSize.amount,
              servingSize.unit,
            ),
            omega3: calculateNutritionValue(selectedFood, "fattyAcids.omega3", servingSize.amount, servingSize.unit),
            omega6: calculateNutritionValue(selectedFood, "fattyAcids.omega6", servingSize.amount, servingSize.unit),
            trans: calculateNutritionValue(selectedFood, "fattyAcids.trans", servingSize.amount, servingSize.unit),
          }
        : undefined,
    }

    const newFood: FoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: selectedFood.name || selectedFood.foodName || selectedFood.description || "Unknown Food",
      source: selectedFood.source || "unknown",
      quantity: quantity,
      servingSize: {
        amount: servingSize.amount,
        unit: servingSize.unit,
        description: `${servingSize.amount} ${servingSize.unit}`,
      },
      nutrition,
      timestamp: Date.now(),
      isFavorite: selectedFood.isFavorite || false,
      category: selectedFood.category || "General",
    }

    console.log("New food entry:", newFood)

    // Add the new food item to the diary entries
    setDiaryEntries((prev) => {
      const newEntries = [...prev, newFood]
      console.log("Updated diary entries:", newEntries)
      return newEntries
    })

    // Add to recent foods
    addToRecentFoods(newFood)

    // Reset selection
    setSelectedFood(null)
    setQuantity(1)
    setSearchTerm("")
    setShowFoodDialog(false)

    // Set sort order to custom after adding a new item
    setSortOrder("custom")
  }

  // Add to recent foods
  const addToRecentFoods = async (food: FoodItem) => {
    if (!user?.uid) return

    try {
      console.log("Adding to recent foods:", food.name)
      const recentRef = collection(db, "users", user.uid, "recentFoods")

      // Check if already exists
      const q = query(recentRef, where("name", "==", food.name), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Update existing entry
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, { timestamp: Date.now() })
      } else {
        // Add new entry
        await addDoc(recentRef, {
          ...food,
          timestamp: Date.now(),
        })
      }

      // Refresh recent foods
      await loadRecentFoods()
    } catch (error) {
      console.error("Error adding to recent foods:", error)
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (food: FoodItem) => {
    if (!user?.uid) return

    try {
      console.log(`${food.isFavorite ? "Removing from" : "Adding to"} favorites:`, food.name)

      if (food.isFavorite) {
        // Remove from favorites
        const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
        const q = query(favoritesRef, where("name", "==", food.name), limit(1))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref)
        }
      } else {
        // Add to favorites
        const favoritesRef = collection(db, "users", user.uid, "favoriteFoods")
        await addDoc(favoritesRef, {
          ...food,
          isFavorite: true,
          timestamp: Date.now(),
        })
      }

      // Update diary entries
      setDiaryEntries((prev) =>
        prev.map((entry) => {
          if (isFoodItem(entry) && entry.name === food.name) {
            return { ...entry, isFavorite: !food.isFavorite }
          }
          return entry
        }),
      )

      // Refresh favorite foods
      await loadFavoriteFoods()
    } catch (error) {
      console.error("Error toggling favorite status:", error)
    }
  }

  // Calculate nutrition value based on serving size
  const calculateNutritionValue = (food: any, nutrient: string, amount: number, unit = "g") => {
    // Convert to grams for consistent calculation
    const amountInGrams = unit === "g" ? amount : convertAmount(amount, unit, "g")

    // Default per 100g
    const baseAmount = 100
    const ratio = amountInGrams / baseAmount

    // Try to get the nutrient value from different possible structures
    let value = 0

    // Handle nested properties like "vitamins.a"
    if (nutrient.includes(".")) {
      const [category, specificNutrient] = nutrient.split(".")
      if (food.nutrients && food.nutrients[category] && food.nutrients[category][specificNutrient] !== undefined) {
        value = food.nutrients[category][specificNutrient]
      }
    } else {
      if (food.nutrients && food.nutrients[nutrient] !== undefined) {
        value = food.nutrients[nutrient]
      } else if (food.nutrition && food.nutrition[nutrient] !== undefined) {
        value = food.nutrition[nutrient]
      } else if (food.nutritionalInfo && food.nutritionalInfo[nutrient] !== undefined) {
        value = food.nutritionalInfo[nutrient]
      } else if (nutrient === "carbs" && food.nutrients && food.nutrients.carbohydrates !== undefined) {
        value = food.nutrients.carbohydrates
      } else if (nutrient === "carbs" && food.nutrition && food.nutrition.carbohydrates !== undefined) {
        value = food.nutrition.carbohydrates
      }
    }

    return Math.round(value * ratio * 10) / 10 // Round to 1 decimal place
  }

  // Update food serving size with unit conversion
  const updateFoodServingSize = (id: string, amount: number, unit: string) => {
    if (amount <= 0) return

    setDiaryEntries((prev) =>
      prev.map((entry) => {
        if (isFoodItem(entry) && entry.id === id) {
          // If the unit is changing, we need to adjust the nutrition values
          const oldUnit = entry.servingSize.unit
          const oldAmount = entry.servingSize.amount

          // Calculate the ratio between old and new serving sizes in grams
          const oldAmountInGrams = oldUnit === "g" ? oldAmount : convertAmount(oldAmount, oldUnit, "g")
          const newAmountInGrams = unit === "g" ? amount : convertAmount(amount, unit, "g")
          const nutritionRatio = newAmountInGrams / oldAmountInGrams

          // Update the nutrition values based on the new serving size
          const updatedNutrition = {
            calories: Math.round(entry.nutrition.calories * nutritionRatio * 10) / 10,
            protein: Math.round(entry.nutrition.protein * nutritionRatio * 10) / 10,
            carbs: Math.round(entry.nutrition.carbs * nutritionRatio * 10) / 10,
            fat: Math.round(entry.nutrition.fat * nutritionRatio * 10) / 10,
            fiber: entry.nutrition.fiber ? Math.round(entry.nutrition.fiber * nutritionRatio * 10) / 10 : undefined,
            sugar: entry.nutrition.sugar ? Math.round(entry.nutrition.sugar * nutritionRatio * 10) / 10 : undefined,
            sodium: entry.nutrition.sodium ? Math.round(entry.nutrition.sodium * nutritionRatio * 10) / 10 : undefined,
          }

          // Update extended nutrition data if available
          if (entry.nutrition.vitamins) {
            updatedNutrition.vitamins = {}
            Object.entries(entry.nutrition.vitamins).forEach(([key, value]) => {
              if (value !== undefined) {
                updatedNutrition.vitamins![key as keyof typeof entry.nutrition.vitamins] =
                  Math.round(value * nutritionRatio * 10) / 10
              }
            })
          }

          if (entry.nutrition.minerals) {
            updatedNutrition.minerals = {}
            Object.entries(entry.nutrition.minerals).forEach(([key, value]) => {
              if (value !== undefined) {
                updatedNutrition.minerals![key as keyof typeof entry.nutrition.minerals] =
                  Math.round(value * nutritionRatio * 10) / 10
              }
            })
          }

          if (entry.nutrition.aminoAcids) {
            updatedNutrition.aminoAcids = {}
            Object.entries(entry.nutrition.aminoAcids).forEach(([key, value]) => {
              if (value !== undefined) {
                updatedNutrition.aminoAcids![key as keyof typeof entry.nutrition.aminoAcids] =
                  Math.round(value * nutritionRatio * 10) / 10
              }
            })
          }

          if (entry.nutrition.fattyAcids) {
            updatedNutrition.fattyAcids = {}
            Object.entries(entry.nutrition.fattyAcids).forEach(([key, value]) => {
              if (value !== undefined) {
                updatedNutrition.fattyAcids![key as keyof typeof entry.nutrition.fattyAcids] =
                  Math.round(value * nutritionRatio * 10) / 10
              }
            })
          }

          return {
            ...entry,
            servingSize: {
              amount,
              unit,
              description: `${amount} ${unit}`,
            },
            nutrition: updatedNutrition,
          }
        }
        return entry
      }),
    )
  }

  // Add note to diary
  const addNoteToDiary = () => {
    if (!newNote.trim()) return

    console.log("Adding note to diary:", newNote)

    const note: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: newNote.trim(),
      timestamp: Date.now(),
    }

    // Add the new note to the diary entries
    setDiaryEntries((prev) => {
      const newEntries = [...prev, note]
      console.log("Updated diary entries:", newEntries)
      return newEntries
    })

    setNewNote("")
    setShowNoteDialog(false)

    // Set sort order to custom after adding a new item
    setSortOrder("custom")
  }

  // Add water intake
  const addWaterIntake = () => {
    console.log(`Adding water intake: ${waterAmount}ml`)

    const newWaterEntry: WaterIntake = {
      amount: waterAmount,
      timestamp: Date.now(),
    }

    setWaterIntake((prev) => [...prev, newWaterEntry])
    setShowWaterDialog(false)
  }

  // Start editing a note
  const startEditingNote = (id: string | null) => {
    setEditingNoteId(id)
  }

  // Save edited note
  const saveEditedNote = (id: string, content: string) => {
    setDiaryEntries((prev) =>
      prev.map((entry) => {
        if (isNoteItem(entry) && entry.id === id) {
          return { ...entry, content }
        }
        return entry
      }),
    )
    setEditingNoteId(null)
  }

  // Remove entry from diary
  const removeEntryFromDiary = (id: string) => {
    setDiaryEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  // Remove water entry
  const removeWaterEntry = (timestamp: number) => {
    setWaterIntake((prev) => prev.filter((entry) => entry.timestamp !== timestamp))
  }

  // Update daily goals
  const updateDailyGoals = async (newGoals: Partial<DailyGoals>) => {
    if (!user?.uid) return

    try {
      console.log("Updating daily goals:", newGoals)
      const updatedGoals = { ...dailyGoals, ...newGoals }
      setDailyGoals(updatedGoals)

      const goalsDocRef = doc(db, "users", user.uid, "nutrition", "dailyGoals")
      await updateDoc(goalsDocRef, updatedGoals)

      console.log("Daily goals updated successfully")
    } catch (error) {
      console.error("Error updating daily goals:", error)
    }
  }

  // Handle date change
  const handleDateChange = (date: string) => {
    console.log("Changing date to:", date)
    setSelectedDate(date)
  }

  // Go to previous day
  const goToPreviousDay = () => {
    const currentDate = parseISO(selectedDate)
    const previousDay = subDays(currentDate, 1)
    handleDateChange(format(previousDay, "yyyy-MM-dd"))
  }

  // Go to next day
  const goToNextDay = () => {
    const currentDate = parseISO(selectedDate)
    const nextDay = addDays(currentDate, 1)
    handleDateChange(format(nextDay, "yyyy-MM-dd"))
  }

  // Go to today
  const goToToday = () => {
    handleDateChange(new Date().toISOString().split("T")[0])
  }

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setDiaryEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        // Set sort order to custom after manual reordering
        setSortOrder("custom")

        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setIsDragging(false)
  }

  // If there's an error loading user data, show an error message with a retry button
  if (authError) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white">{authError}</p>
          <Button onClick={refreshUserData} className="bg-orange-600 hover:bg-orange-700 w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If still loading, show a loading indicator
  if (authLoading || isUserLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  return (
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
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setShowNoteDialog(true)}>
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
                        <span className="text-xs text-gray-400 ml-1">({Math.round(food.nutrition.calories)} kcal)</span>
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
                        <span className="text-xs text-gray-400 ml-1">({Math.round(food.nutrition.calories)} kcal)</span>
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
              <SortableContext items={sortedDiaryEntries.map((item) => item.id)} strategy={verticalListSortingStrategy}>
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
          {waterIntake.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                Water Intake
              </h3>
              <div className="space-y-2">
                {waterIntake.map((entry) => (
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

          {/* Detailed Micronutrient Sections */}
          <div className="mt-6 space-y-4">
            <Accordion type="multiple" value={expandedNutrients} className="bg-gray-800 rounded-md">
              {/* Vitamins Section */}
              <AccordionItem value="vitamins" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("vitamins")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Vitamins
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {dailyGoals.vitamins &&
                      Object.entries(dailyGoals.vitamins).map(([key, goal]) => {
                        if (!goal) return null
                        const current = dailyTotals.vitamins?.[key as keyof typeof dailyTotals.vitamins] || 0
                        const vitaminName = getVitaminName(key)
                        const unit = getVitaminUnit(key)
                        const color = getVitaminColor(key)

                        return (
                          <NutrientBar
                            key={key}
                            name={vitaminName}
                            current={current}
                            goal={goal}
                            unit={unit}
                            color={color}
                          />
                        )
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Minerals Section */}
              <AccordionItem value="minerals" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("minerals")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Minerals
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {dailyGoals.minerals &&
                      Object.entries(dailyGoals.minerals).map(([key, goal]) => {
                        if (!goal) return null
                        const current = dailyTotals.minerals?.[key as keyof typeof dailyTotals.minerals] || 0
                        const mineralName = getMineralName(key)
                        const unit = getMineralUnit(key)
                        const color = getMineralColor(key)

                        return (
                          <NutrientBar
                            key={key}
                            name={mineralName}
                            current={current}
                            goal={goal}
                            unit={unit}
                            color={color}
                          />
                        )
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Amino Acids Section */}
              <AccordionItem value="aminoAcids" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("aminoAcids")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Amino Acids
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {dailyGoals.aminoAcids &&
                      Object.entries(dailyGoals.aminoAcids).map(([key, goal]) => {
                        if (!goal) return null
                        const current = dailyTotals.aminoAcids?.[key as keyof typeof dailyTotals.aminoAcids] || 0
                        const aminoAcidName = getAminoAcidName(key)

                        return (
                          <NutrientBar
                            key={key}
                            name={aminoAcidName}
                            current={current}
                            goal={goal}
                            unit="mg"
                            color="bg-purple-500"
                          />
                        )
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Fatty Acids Section */}
              <AccordionItem value="fattyAcids" className="border-b-0">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("fattyAcids")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Fatty Acids
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {dailyGoals.fattyAcids &&
                      Object.entries(dailyGoals.fattyAcids).map(([key, goal]) => {
                        if (!goal) return null
                        const current = dailyTotals.fattyAcids?.[key as keyof typeof dailyTotals.fattyAcids] || 0
                        const fattyAcidName = getFattyAcidName(key)
                        const color = getFattyAcidColor(key)

                        return (
                          <NutrientBar
                            key={key}
                            name={fattyAcidName}
                            current={current}
                            goal={goal}
                            unit="g"
                            color={color}
                          />
                        )
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Detailed Micronutrient Charts */}
          <div className="mt-6 space-y-6">
            <Accordion type="multiple" value={expandedNutrients} className="bg-gray-800 rounded-md">
              {/* Vitamins Chart */}
              <AccordionItem value="vitamins-chart" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("vitamins-chart")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Vitamins Chart
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NutrientChart
                    distribution={vitaminDistribution}
                    getColor={getVitaminColor}
                    getName={getVitaminName}
                    title="Vitamins"
                    emptyMessage="No vitamin data tracked yet"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Minerals Chart */}
              <AccordionItem value="minerals-chart" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("minerals-chart")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Minerals Chart
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NutrientChart
                    distribution={mineralDistribution}
                    getColor={getMineralColor}
                    getName={getMineralName}
                    title="Minerals"
                    emptyMessage="No mineral data tracked yet"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Amino Acids Chart */}
              <AccordionItem value="amino-acids-chart" className="border-b border-gray-700">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("amino-acids-chart")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Amino Acids Chart
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NutrientChart
                    distribution={aminoAcidDistribution}
                    getColor={() => "bg-purple-500"}
                    getName={getAminoAcidName}
                    title="Amino Acids"
                    emptyMessage="No amino acid data tracked yet"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Fatty Acids Chart */}
              <AccordionItem value="fatty-acids-chart" className="border-b-0">
                <AccordionTrigger
                  onClick={() => toggleNutrientSection("fatty-acids-chart")}
                  className="px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Fatty Acids Chart
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NutrientChart
                    distribution={fattyAcidDistribution}
                    getColor={getFattyAcidColor}
                    getName={getFattyAcidName}
                    title="Fatty Acids"
                    emptyMessage="No fatty acid data tracked yet"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            <Button variant="outline" onClick={() => setShowWaterDialog(false)} className="border-gray-700 text-white">
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
      <Dialog open={activeTab === "goals"} onOpenChange={(open) => !open && setActiveTab("diary")}>
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
                <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 text-white">Basic Nutrients</AccordionTrigger>
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
