"use client"

import { useState } from "react"
import { FoodSearch } from "@/components/food-search"
import { useAuth } from "@/lib/use-auth"

export default function FoodDatabasePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"search">("search")

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Food Database</h1>
        <p className="text-muted-foreground mt-1">Search for foods in both IFCT (Indian) and USDA databases</p>
      </div>

      <FoodSearch />
    </div>
  )
}
