import { NextResponse } from "next/server"
import { fetchAllEvalReports, getRateLimit } from "@/lib/github-api"
import { getCachedResults, setCachedResults } from "@/lib/cache"
import type { AllResults } from "@/lib/types"

// Force dynamic rendering - no static optimization
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Try to get cached results first
        const cached = await getCachedResults()

        if (cached) {
          console.log("Serving from cache")

          // Stream cached results
          for (const report of cached.code_only) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "report",
                  category: "code_only",
                  report,
                }) + "\n"
              )
            )
          }

          for (const report of cached.full_codex) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "report",
                  category: "full_codex",
                  report,
                }) + "\n"
              )
            )
          }

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                timestamp: new Date().toISOString(),
                cached: true,
              }) + "\n"
            )
          )

          controller.close()
          return
        }

        // Cache miss - fetch from GitHub
        console.log("Cache miss - fetching from GitHub")

        // Check rate limit
        const rateLimit = await getRateLimit()
        if (rateLimit && rateLimit.remaining < 10) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "GitHub API rate limit nearly exceeded",
                remaining: rateLimit.remaining,
                reset: new Date(rateLimit.reset * 1000).toISOString(),
              }) + "\n"
            )
          )
          controller.close()
          return
        }

        // Collect results for caching
        const results: AllResults = {
          code_only: [],
          full_codex: [],
        }

        // Fetch all reports with streaming callback
        await fetchAllEvalReports((report, category) => {
          // Add to results for caching
          if (category === "code_only") {
            results.code_only.push(report)
          } else {
            results.full_codex.push(report)
          }

          // Send each report immediately as it's fetched
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "report",
                category,
                report,
              }) + "\n"
            )
          )
        })

        // Cache the results
        await setCachedResults(results)

        // Send completion signal
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "complete",
              timestamp: new Date().toISOString(),
              cached: false,
            }) + "\n"
          )
        )

        controller.close()
      } catch (error) {
        console.error("Stream error:", error)
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              error: "Failed to fetch evaluation reports",
              message: error instanceof Error ? error.message : "Unknown error",
            }) + "\n"
          )
        )
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
    },
  })
}
