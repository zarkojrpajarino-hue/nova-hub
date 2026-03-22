/**
 * agent-antispam — I5.5 (Anti-spam value-change threshold)
 *
 * AGENTS_CONTRACT.md §10: "Re-emisión permitida cuando el valor del signal
 * cambia en >= 15% respecto al insight anterior del mismo tipo."
 *
 * Helper puro sin side effects — usado por los 5 agent services.
 */

/** Umbral de cambio mínimo para re-emitir un insight (15%) */
export const VALUE_CHANGE_THRESHOLD = 0.15

/**
 * Determina si el cambio entre dos valores es significativo (>= threshold).
 *
 * Casos especiales:
 * - Ambos 0 → no significativo (nada cambió)
 * - Uno es 0 y el otro no → siempre significativo (aparición/desaparición)
 */
export function hasSignificantValueChange(
  currentValue: number,
  previousValue: number,
  threshold: number = VALUE_CHANGE_THRESHOLD,
): boolean {
  if (previousValue === 0 && currentValue === 0) return false
  if (previousValue === 0 || currentValue === 0) return true
  return Math.abs(currentValue - previousValue) / Math.abs(previousValue) >= threshold
}

/**
 * Extrae `signal.current_value` del payload de un integration_insight.
 * Retorna null si el payload no tiene la estructura esperada.
 */
export function extractSignalValue(
  payload: Record<string, unknown> | null | undefined,
): number | null {
  if (!payload) return null
  const signal = payload['signal']
  if (typeof signal !== 'object' || signal === null) return null
  const value = (signal as Record<string, unknown>)['current_value']
  return typeof value === 'number' ? value : null
}
