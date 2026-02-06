import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = userId || ip // Use user ID if authenticated, otherwise IP

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // First request or window expired, start new window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return next()
    }

    if (record.count >= config.max) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message:
          config.message ||
          `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      })
    }

    // Increment count
    record.count++
    rateLimitStore.set(key, record)
    next()
  }
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Preset configurations
 */
export const rateLimitPresets = {
  // AI generation: 10 requests per hour
  aiGeneration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message:
      'You have exceeded the AI generation limit. Please try again later or upgrade your plan.',
  }),

  // Database provisioning: 20 per day (increased for development)
  databaseProvisioning: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 20, // Increased from 5 to 20
    message:
      'You have exceeded the daily database provisioning limit. Please try again tomorrow or upgrade your plan.',
  }),

  // API calls: 100 per minute
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many API requests. Please slow down.',
  }),

  // Strict: 10 per minute
  strict: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests. Please try again in a moment.',
  }),
}
