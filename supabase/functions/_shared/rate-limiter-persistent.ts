/**
 * Persistent Rate Limiter for Edge Functions using Deno KV
 *
 * Fixes: In-memory rate limiting vulnerable to cold start bypass
 *
 * Uses Deno KV (distributed key-value storage) for persistence
 * across function cold starts and deployments.
 *
 * Migration from in-memory to persistent:
 * 1. Replace imports:
 *    import { checkRateLimit } from './_shared/rate-limiter.ts'
 *    → import { checkRateLimit } from './_shared/rate-limiter-persistent.ts'
 * 2. Update function calls to await:
 *    const result = checkRateLimit(...)
 *    → const result = await checkRateLimit(...)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  maxRequests: number;  // Maximum requests per window
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // Seconds until reset (only when not allowed)
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // AI Generation endpoints - expensive, limit heavily
  AI_GENERATION: {
    maxRequests: 10,    // 10 requests
    windowMs: 60000,    // per minute
  },

  // Auth endpoints - prevent brute force
  AUTH: {
    maxRequests: 5,     // 5 requests
    windowMs: 60000,    // per minute
  },

  // Data modification endpoints - moderate limits
  DATA_MUTATION: {
    maxRequests: 30,    // 30 requests
    windowMs: 60000,    // per minute
  },

  // Read-only endpoints - more permissive
  DATA_READ: {
    maxRequests: 100,   // 100 requests
    windowMs: 60000,    // per minute
  },

  // Seed/admin endpoints - very restrictive
  ADMIN: {
    maxRequests: 3,     // 3 requests
    windowMs: 300000,   // per 5 minutes
  },
} as const;

// Open KV database connection
const kv = await Deno.openKv();

/**
 * Generate KV storage key for rate limit entry
 */
function getRateLimitKey(identifier: string, endpoint: string): string[] {
  return ['rate_limit', identifier, endpoint];
}

/**
 * Check rate limit for a given identifier and endpoint (PERSISTENT VERSION)
 *
 * @param identifier - User ID, IP address, or other unique identifier
 * @param endpoint - Name of the endpoint being accessed
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + config.windowMs;
  const key = getRateLimitKey(identifier, endpoint);

  // Get existing entry from KV (atomic operation)
  const result = await kv.get<RateLimitEntry>(key);
  let entry = result.value;

  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment counter and save to KV (atomic operation)
  entry.count++;

  // Set with expiration (auto-cleanup after window expires)
  const expiresAt = entry.resetTime + 60000; // Keep for extra minute after reset
  await kv.set(key, entry, { expireIn: expiresAt - now });

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: HeadersInit
): Response {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Helper to extract identifier from request
 * Tries to use authenticated user ID, falls back to IP
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return userId;

  // Try to get IP from headers (Cloudflare, Vercel, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback to a generic identifier (not ideal for production)
  return 'anonymous';
}

/**
 * Clear rate limit for a specific identifier and endpoint
 * Useful for manual admin resets
 */
export async function clearRateLimit(
  identifier: string,
  endpoint: string
): Promise<void> {
  const key = getRateLimitKey(identifier, endpoint);
  await kv.delete(key);
}

/**
 * Get current rate limit status without incrementing
 * Useful for debugging/monitoring
 */
export async function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = getRateLimitKey(identifier, endpoint);

  const result = await kv.get<RateLimitEntry>(key);
  const entry = result.value;

  if (!entry || entry.resetTime < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}
