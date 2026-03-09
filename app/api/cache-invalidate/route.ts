import { NextResponse } from "next/server"
import { invalidateCache } from "@/lib/cache"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST() {
  try {
    await invalidateCache()

    return NextResponse.json(
      {
        success: true,
        message: "Cache invalidated successfully",
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("Error invalidating cache:", error)
    return NextResponse.json(
      {
        error: "Failed to invalidate cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
