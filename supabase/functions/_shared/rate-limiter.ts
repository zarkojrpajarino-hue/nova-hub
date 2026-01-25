/**
 * Rate limiter for Edge Functions
 * Uses in-memory storage with automatic cleanup
 *
 * IMPORTANT: This is a basic in-memory rate limiter.
 * For production, consider using Redis or Supabase Edge Function KV
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store: Map<identifier, Map<endpoint, RateLimitEntry>>
const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, endpoints] of rateLimitStore.entries()) {
    for (const [endpoint, entry] of endpoints.entries()) {
      if (entry.resetTime < now) {
        endpoints.delete(endpoint);
      }
    }
    if (endpoints.size === 0) {
      rateLimitStore.delete(identifier);
    }
  }
}, 5 * 60 * 1000);

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

/**
 * Check rate limit for a given identifier and endpoint
 *
 * @param identifier - User ID, IP address, or other unique identifier
 * @param endpoint - Name of the endpoint being accessed
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const resetTime = now + config.windowMs;

  // Get or create user's endpoint map
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, new Map());
  }

  const userEndpoints = rateLimitStore.get(identifier)!;

  // Get or create endpoint entry
  if (!userEndpoints.has(endpoint)) {
    userEndpoints.set(endpoint, {
      count: 0,
      resetTime,
    });
  }

  const entry = userEndpoints.get(endpoint)!;

  // Reset if window expired
  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = resetTime;
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

  // Increment counter
  entry.count++;

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
