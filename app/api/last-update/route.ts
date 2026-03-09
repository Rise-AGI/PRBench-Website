import { NextResponse } from "next/server"
import { getLatestCommitDate } from "@/lib/github-api"
import { getCachedLastUpdate, setCachedLastUpdate } from "@/lib/cache"

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    // Check cache first
    const cached = await getCachedLastUpdate()
    if (cached) {
      return NextResponse.json({ timestamp: cached, cached: true })
    }

    // Fetch from GitHub
    const timestamp = await getLatestCommitDate()

    if (!timestamp) {
      return NextResponse.json({ error: "Failed to fetch last update" }, { status: 500 })
    }

    // Cache the result
    await setCachedLastUpdate(timestamp)

    return NextResponse.json({ timestamp, cached: false })
  } catch (error) {
    console.error("Error in last-update API:", error)
    return NextResponse.json(
      { error: "Failed to fetch last update" },
      { status: 500 }
    )
  }
}
