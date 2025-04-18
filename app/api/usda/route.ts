import { NextResponse } from "next/server"
import { searchFoods, getFoodDetails } from "@/lib/usda-api"

// Cache for storing API responses to reduce API calls
const apiCache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 3600000 // 1 hour in milliseconds

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
    // Check cache first
    const cacheKey = action === "search" ? `search-${query}` : `details-${fdcId}`
    const now = Date.now()

    if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
      console.log(`Using cached data for ${cacheKey}`)
      return NextResponse.json(apiCache[cacheKey].data)
    }

    let result

    if (action === "search" && query) {
      result = await searchFoods(query, 25, 1, apiKey)

      // Cache the result
      apiCache[cacheKey] = {
        data: result,
        timestamp: now,
      }

      return NextResponse.json(result)
    } else if (action === "details" && fdcId) {
      result = await getFoodDetails(fdcId, apiKey)

      // Cache the result
      apiCache[cacheKey] = {
        data: result,
        timestamp: now,
      }

      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("USDA API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch data from USDA API" }, { status: 500 })
  }
}
