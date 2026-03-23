/**
 * Pearson correlation coefficient — pure frontend calculation.
 * r = (nSxy - SxSy) / sqrt((nSx2 - (Sx)^2)(nSy2 - (Sy)^2))
 *
 * Returns { r, strength, label } where:
 *   - r is the coefficient (-1 to 1)
 *   - strength: 'strong' | 'moderate' | 'weak'
 *   - label: human-readable i18n key suffix
 */

export interface PearsonResult {
  r: number
  strength: 'strong' | 'moderate' | 'weak'
}

export function pearsonCorrelation(x: number[], y: number[]): PearsonResult | null {
  const n = Math.min(x.length, y.length)
  if (n < 4) return null // Need at least 4 data points

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  )

  // If denominator is 0, one of the series is constant — no correlation meaningful
  if (denominator === 0) return { r: 0, strength: 'weak' }

  const r = Math.round((numerator / denominator) * 100) / 100
  const absR = Math.abs(r)

  const strength: PearsonResult['strength'] =
    absR > 0.6 ? 'strong' : absR > 0.3 ? 'moderate' : 'weak'

  return { r, strength }
}

/**
 * Correlation color class based on strength.
 */
export function correlationColor(strength: PearsonResult['strength']): string {
  switch (strength) {
    case 'strong': return 'text-green-600'
    case 'moderate': return 'text-amber-600'
    case 'weak': return 'text-muted-foreground'
  }
}

export function correlationBgColor(strength: PearsonResult['strength']): string {
  switch (strength) {
    case 'strong': return 'bg-green-50 border-green-200'
    case 'moderate': return 'bg-amber-50 border-amber-200'
    case 'weak': return 'bg-muted/50 border-border'
  }
}
