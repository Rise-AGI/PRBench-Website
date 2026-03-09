import { NextResponse } from "next/server"
import { fetchAllEvalReports, getRateLimit } from "@/lib/github-api"
import { getCachedResults, setCachedResults } from "@/lib/cache"

// Force dynamic rendering - no static optimization
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Try to get cached results first
    const cached = await getCachedResults()
    if (cached) {
      console.log("Returning cached results")
      return NextResponse.json({
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      })
    }

    // Check rate limit
    const rateLimit = await getRateLimit()
    if (rateLimit && rateLimit.remaining < 10) {
      return NextResponse.json(
        {
          error: "GitHub API rate limit nearly exceeded",
          remaining: rateLimit.remaining,
          reset: new Date(rateLimit.reset * 1000).toISOString(),
        },
        { status: 429 }
      )
    }

    // Fetch all eval reports
    console.log("Fetching fresh data from GitHub")
    const results = await fetchAllEvalReports()

    // Cache the results
    await setCachedResults(results)

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      cached: false,
      rateLimit: rateLimit
        ? {
            remaining: rateLimit.remaining,
            limit: rateLimit.limit,
            reset: new Date(rateLimit.reset * 1000).toISOString(),
          }
        : null,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch evaluation reports",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
