/**
 * Rate Limiting Utility
 *
 * Provides IP-based rate limiting for API endpoints to prevent:
 * - Brute force attacks
 * - Email enumeration
 * - OTP flooding
 * - API abuse
 *
 * Uses in-memory storage (resets on server restart).
 * For production with multiple instances, consider using Redis/Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Key format: `${identifier}:${endpoint}`
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Identifier for the endpoint (used in error messages) */
  endpoint: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Time in milliseconds until the rate limit resets */
  resetIn: number;
  /** HTTP headers to include in the response */
  headers: Record<string, string>;
}

/**
 * Extract client IP from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(request: Request): string {
  // Vercel / common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Vercel specific
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Real IP header (nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback - should not happen in production
  return 'unknown';
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (IP address, user ID, phone number, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();

  const key = `${identifier}:${config.endpoint}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': (config.maxRequests - 1).toString(),
        'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
      },
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
  };

  if (entry.count > config.maxRequests) {
    headers['Retry-After'] = Math.ceil(resetIn / 1000).toString();
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      headers,
    };
  }

  return {
    allowed: true,
    remaining,
    resetIn,
    headers,
  };
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const RATE_LIMITS = {
  /** Email check: 5 requests per minute per IP */
  CHECK_EMAIL: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    endpoint: 'check-email',
  },
  /** OTP sending: 3 requests per 10 minutes per phone number */
  SEND_OTP: {
    maxRequests: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
    endpoint: 'send-otp',
  },
  /** AI chat: 20 requests per minute per IP */
  TANYA_TANAM: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    endpoint: 'tanya-tanam',
  },
  /** General API: 100 requests per minute per IP */
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    endpoint: 'general',
  },
} as const;

/**
 * Create a rate-limited JSON response for blocked requests
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message?: string
) {
  // Import dynamically to avoid issues with edge runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server');

  const retryAfterSeconds = Math.ceil(result.resetIn / 1000);

  return NextResponse.json(
    {
      success: false,
      error: message || `Terlalu banyak permintaan. Coba lagi dalam ${retryAfterSeconds} detik.`,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: result.headers,
    }
  );
}
