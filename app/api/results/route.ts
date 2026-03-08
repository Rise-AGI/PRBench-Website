import { NextResponse } from "next/server"
import { fetchAllEvalReports, getRateLimit } from "@/lib/github-api"

// Cache duration: 1 hour
export const revalidate = 3600

export async function GET() {
  try {
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
    const results = await fetchAllEvalReports()

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
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
