"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Database, BookOpen, ChefHat } from "lucide-react"
import { useAuth } from "@/lib/use-auth"

export default function FoodDatabasePage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "ifct" | "usda" | "custom">("all")

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      // For now, just show a placeholder result to demonstrate the UI works
      setSearchResults([
        {
          id: "placeholder1",
          name: "Rice, white, long-grain, regular, raw",
          calories: 365,
          protein: 7.13,
          fat: 0.66,
          carbs: 80,
          source: "usda",
          category: "Grains",
        },
        {
          id: "placeholder2",
          name: "Dal, yellow, cooked",
          calories: 116,
          protein: 9,
          fat: 0.4,
          carbs: 20,
          source: "ifct",
          category: "Legumes",
        },
      ])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Filter results based on active tab
  const filteredResults = searchResults.filter((result) => {
    if (activeTab === "all") return true
    return result.source === activeTab
  })

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Food Database</h1>
        <p className="text-muted-foreground mt-1">Search for foods in both IFCT (Indian) and USDA databases</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Food Search</CardTitle>
          <CardDescription>Search for foods in IFCT, USDA, and custom foods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search for a food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                <Search className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>

            {searchResults.length > 0 && (
              <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Results</TabsTrigger>
                  <TabsTrigger value="ifct">IFCT</TabsTrigger>
                  <TabsTrigger value="usda">USDA</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.map((food) => (
                      <FoodCard key={`${food.source}-${food.id}`} food={food} />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="ifct" className="mt-4">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.map((food) => (
                      <FoodCard key={`${food.source}-${food.id}`} food={food} />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="usda" className="mt-4">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.map((food) => (
                      <FoodCard key={`${food.source}-${food.id}`} food={food} />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.map((food) => (
                      <FoodCard key={`${food.source}-${food.id}`} food={food} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!isSearching && searchTerm && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No results found for "{searchTerm}"</div>
            )}

            {!searchTerm && <div className="text-center py-8 text-muted-foreground">Enter a food item to search</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Food card component
function FoodCard({ food }: { food: any }) {
  // Determine background color based on source
  const getBgColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-50"
      case "usda":
        return "bg-blue-50"
      case "custom":
        return "bg-green-50"
      default:
        return "bg-gray-50"
    }
  }

  // Determine badge color based on source
  const getBadgeColor = (source: string) => {
    switch (source) {
      case "ifct":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "usda":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "custom":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get icon based on source
  const getIcon = (source: string) => {
    switch (source) {
      case "ifct":
        return <BookOpen className="h-3 w-3 mr-1" />
      case "usda":
        return <Database className="h-3 w-3 mr-1" />
      case "custom":
        return <ChefHat className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className={`p-2 ${getBgColor(food.source)}`}>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={getBadgeColor(food.source)}>
            {getIcon(food.source)}
            {food.source.toUpperCase()}
          </Badge>
          {food.category && <span className="text-xs text-muted-foreground">{food.category}</span>}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2">{food.name}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Energy</div>
            <div className="font-medium">{food.calories} kcal</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Protein</div>
            <div className="font-medium">{food.protein} g</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Fat</div>
            <div className="font-medium">{food.fat} g</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-sm text-muted-foreground">Carbs</div>
            <div className="font-medium">{food.carbs} g</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
