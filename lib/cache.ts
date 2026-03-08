import { kv } from "@vercel/kv"
import type { AllResults } from "./types"

const CACHE_KEY = "prbench:eval-reports"
const CACHE_TTL = 3600 // 1 hour in seconds

// Check if KV is available (environment variables are set)
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

/**
 * Get cached results from Vercel KV
 * Returns null if KV is not available (local development)
 */
export async function getCachedResults(): Promise<AllResults | null> {
  if (!isKVAvailable()) {
    console.log("KV cache not available (missing environment variables)")
    return null
  }

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
 * Silently skips if KV is not available (local development)
 */
export async function setCachedResults(results: AllResults): Promise<void> {
  if (!isKVAvailable()) {
    console.log("KV cache not available, skipping cache write")
    return
  }

  try {
    await kv.set(CACHE_KEY, results, { ex: CACHE_TTL })
    console.log(`Cached ${results.code_only.length + results.full_codex.length} reports for ${CACHE_TTL}s`)
  } catch (error) {
    console.error("Error writing to cache:", error)
  }
}

/**
 * Invalidate cache (for manual refresh)
 * Silently skips if KV is not available (local development)
 */
export async function invalidateCache(): Promise<void> {
  if (!isKVAvailable()) {
    console.log("KV cache not available, skipping cache invalidation")
    return
  }

  try {
    await kv.del(CACHE_KEY)
    console.log("Cache invalidated")
  } catch (error) {
    console.error("Error invalidating cache:", error)
  }
}

/**
 * Get cache metadata
 * Returns default values if KV is not available (local development)
 */
export async function getCacheMetadata() {
  if (!isKVAvailable()) {
    return { exists: false, ttl: -1, expiresAt: null, kvAvailable: false }
  }

  try {
    const ttl = await kv.ttl(CACHE_KEY)
    return {
      exists: ttl > 0,
      ttl,
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
      kvAvailable: true,
    }
  } catch (error) {
    console.error("Error getting cache metadata:", error)
    return { exists: false, ttl: -1, expiresAt: null, kvAvailable: true }
  }
}
