import { NextResponse } from "next/server"
import { searchFoods, getFoodDetails } from "@/lib/usda-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const query = searchParams.get("query")
  const fdcId = searchParams.get("fdcId")

  // Get the API key from environment variables
  const apiKey = process.env.USDA_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "USDA API key not configured" }, { status: 500 })
  }

  try {
    if (action === "search" && query) {
      const results = await searchFoods(query, 25, 1, apiKey)
      return NextResponse.json(results)
    } else if (action === "details" && fdcId) {
      const food = await getFoodDetails(fdcId, apiKey)
      return NextResponse.json(food)
    } else {
      return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("USDA API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch data from USDA API" }, { status: 500 })
  }
}
