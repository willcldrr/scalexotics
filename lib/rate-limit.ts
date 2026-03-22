/**
 * Simple in-memory rate limiter for API routes
 *
 * For production with multiple instances, use Redis-based rate limiting:
 * - @upstash/ratelimit with Upstash Redis
 * - Or implement with your own Redis instance
 *
 * This implementation works for single-instance deployments.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  limit: number
  // Time window in seconds
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID, phone number)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  const existing = rateLimitStore.get(key)

  // If no existing entry or window has expired, create new entry
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt,
    }
  }

  // Check if limit exceeded
  if (existing.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  // Increment count
  existing.count++
  rateLimitStore.set(key, existing)

  return {
    success: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  }
}

// Preset configurations
export const RATE_LIMITS = {
  // Lead capture: 10 requests per minute per IP
  leadCapture: { limit: 10, windowSeconds: 60 },
  // SMS webhook: 100 requests per minute per phone number
  smsWebhook: { limit: 100, windowSeconds: 60 },
  // API endpoints: 60 requests per minute per IP
  api: { limit: 60, windowSeconds: 60 },
  // Auth endpoints: 5 requests per minute per IP (prevent brute force)
  auth: { limit: 5, windowSeconds: 60 },
}
