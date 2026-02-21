/**
 * Distributed Rate Limiting with Upstash Redis
 * 
 * Production-grade rate limiting for serverless environments.
 * Uses Upstash Redis for sliding window rate limiting.
 * Automatically synchronized across all edge nodes.
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis connection from environment variables
const redis = Redis.fromEnv()

// Create the Upload Limiter (5 requests per 1 minute)
export const uploadLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'hsdc:ratelimit:upload',
})

// Create the Recovery Limiter (10 requests per 1 minute)
export const recoveryLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'hsdc:ratelimit:recovery',
})

/**
 * Checks if a user has exceeded their rate limit.
 * Uses sliding window algorithm for accurate tracking.
 * 
 * @param userId - The ID of the authenticated user
 * @param limiter - The specific Ratelimit instance to check against
 * @returns Object with limit, remaining requests, and reset time
 * @throws Error if the rate limit is exceeded
 */
export async function checkRateLimit(userId: string, limiter: Ratelimit): Promise<{ limit: number; remaining: number }> {
  if (!userId) {
    throw new Error('User ID required for rate limiting')
  }

  const { success, limit, remaining, reset } = await limiter.limit(userId)

  if (!success) {
    const resetTime = new Date(reset).toLocaleTimeString()
    throw new Error(`Rate limit exceeded. Please try again after ${resetTime}.`)
  }

  return { limit, remaining }
}
