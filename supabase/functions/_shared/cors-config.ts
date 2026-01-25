/**
 * Secure CORS Configuration
 *
 * Replaces the wildcard CORS ('*') with environment-based origin whitelist
 * to prevent CSRF attacks and unauthorized cross-origin requests.
 */

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:5173',
];

/**
 * Gets secure CORS headers based on request origin
 * @param origin - The Origin header from the request
 * @returns HeadersInit with appropriate CORS headers
 */
export function getCorsHeaders(origin: string | null): HeadersInit {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handles CORS preflight (OPTIONS) requests
 * @param origin - The Origin header from the request
 * @returns Response with CORS headers
 */
export function handleCorsPreflightRequest(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
