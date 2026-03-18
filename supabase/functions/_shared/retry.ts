/**
 * withRetry — helper genérico de retry + backoff exponencial.
 *
 * Uso:
 *   const { result, attempts } = await withRetry(() => stripe.subscriptions.list(...))
 *
 * - Reintenta solo errores transitorios: 429, >=500, y errores de red sin statusCode.
 * - No reintenta: 400, 401, 403, 422 (errores del cliente → no van a mejorar).
 * - Devuelve { result, attempts } para que el caller pueda registrar retry_count.
 */

interface RetryOptions {
  /** Número máximo de intentos totales (incluye el primero). Default: 3 */
  maxAttempts?: number
  /** Delay base en ms. Cada reintento: baseDelayMs * 2^(attempt-1). Default: 1000 */
  baseDelayMs?: number
}

function isRetryable(err: unknown): boolean {
  const status = (err as { statusCode?: number })?.statusCode
  if (status === undefined || status === null) return true // error de red — siempre reintentar
  return status === 429 || status >= 500
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<{ result: T; attempts: number }> {
  const { maxAttempts = 3, baseDelayMs = 1000 } = options
  let lastErr: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      return { result, attempts: attempt }
    } catch (err) {
      lastErr = err
      // Si el error no es transitorio o ya agotamos intentos, propagar
      if (!isRetryable(err) || attempt === maxAttempts) throw err
      // Espera exponencial: 1s, 2s, 4s (cap implícito en maxAttempts=3)
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)))
    }
  }

  throw lastErr
}
