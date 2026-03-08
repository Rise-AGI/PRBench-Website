import { NextResponse } from "next/server"
import { fetchSingleEvalReport } from "@/lib/github-api"
import { getCachedResults } from "@/lib/cache"

// Revalidate every hour
export const revalidate = 3600

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; task: string }> }
) {
  try {
    const { category, task } = await params

    // Validate category
    if (category !== "code_only" && category !== "full_codex") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Try to get from cache first
    const cached = await getCachedResults()
    if (cached) {
      const reports = category === "code_only" ? cached.code_only : cached.full_codex
      const report = reports.find((r) => r.task_id === task)

      if (report) {
        return NextResponse.json(
          { data: report, cached: true },
          {
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
          }
        )
      }
    }

    // Cache miss or report not found - fetch from GitHub
    const report = await fetchSingleEvalReport(category, task)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(
      { data: report, cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching single report:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}
