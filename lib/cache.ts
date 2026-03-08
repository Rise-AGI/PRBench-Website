import { kv } from "@vercel/kv"
import type { AllResults } from "./types"

const CACHE_KEY = "prbench:eval-reports"
const CACHE_TTL = 3600 // 1 hour in seconds

/**
 * Get cached results from Vercel KV
 */
export async function getCachedResults(): Promise<AllResults | null> {
  try {
    const cached = await kv.get<AllResults>(CACHE_KEY)
    return cached
  } catch (error) {
    console.error("Error reading from cache:", error)
    return null
  }
}

/**
 * Set cached results in Vercel KV
 */
export async function setCachedResults(results: AllResults): Promise<void> {
  try {
    await kv.set(CACHE_KEY, results, { ex: CACHE_TTL })
    console.log(`Cached ${results.code_only.length + results.full_codex.length} reports for ${CACHE_TTL}s`)
  } catch (error) {
    console.error("Error writing to cache:", error)
  }
}

/**
 * Invalidate cache (for manual refresh)
 */
export async function invalidateCache(): Promise<void> {
  try {
    await kv.del(CACHE_KEY)
    console.log("Cache invalidated")
  } catch (error) {
    console.error("Error invalidating cache:", error)
  }
}

/**
 * Get cache metadata
 */
export async function getCacheMetadata() {
  try {
    const ttl = await kv.ttl(CACHE_KEY)
    return {
      exists: ttl > 0,
      ttl,
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
    }
  } catch (error) {
    console.error("Error getting cache metadata:", error)
    return { exists: false, ttl: -1, expiresAt: null }
  }
}
