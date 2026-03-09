import { NextResponse } from "next/server"
import { getCacheMetadata } from "@/lib/cache"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const metadata = await getCacheMetadata()

    return NextResponse.json(
      {
        success: true,
        cache: metadata,
        timestamp: new Date().toISOString(),
        env: {
          hasKvUrl: !!process.env.KV_REST_API_URL,
          hasKvToken: !!process.env.KV_REST_API_TOKEN,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("Error getting cache status:", error)
    return NextResponse.json(
      {
        error: "Failed to get cache status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
