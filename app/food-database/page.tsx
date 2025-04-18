"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FoodSearch } from "@/components/food-search"
import { IFCTDataUploader } from "@/components/ifct-data-uploader"
import { useAuth } from "@/lib/use-auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function FoodDatabasePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("search")

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Food Database</h1>
        <p className="text-muted-foreground mt-1">Search for foods in both IFCT (Indian) and USDA databases</p>
      </div>

      <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search">Search Foods</TabsTrigger>
          <TabsTrigger value="upload">Upload IFCT Data</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
          <FoodSearch />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          {user ? (
            <IFCTDataUploader />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>You must be logged in to upload IFCT data.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
