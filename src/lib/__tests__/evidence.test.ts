/**
 * T17.8 — Tests unitarios del motor de evidencia (Bloque B)
 *
 * Casos obligatorios del spec:
 * 1. resolveConflict Stripe vs user_manual mismo campo → Stripe gana
 * 2. resolveConflict fuente incompatible (HubSpot para mrr) → descartada
 * 3. resolveConflict fuente desactivada por preferencias → score=0
 * 4. computeRecencyFactor dato de hace 8 días → 0.3
 * 5. computeEvidenceScore usuario deshabilita Stripe → score=0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  computeRecencyFactor,
  computeEvidenceScore,
  computeReliabilityScore,
  resolveConflict,
  type EvidenceRecord,
  type ProjectSourcePreferences,
  type SourceUsed,
} from '../evidence'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

function hoursAgo(h: number): string {
  return msAgo(h * 3_600_000)
}

function daysAgo(d: number): string {
  return hoursAgo(d * 24)
}

function makeEvidence(
  overrides: Partial<EvidenceRecord> & { source: EvidenceRecord['source'] },
): EvidenceRecord {
  return {
    value:      100,
    field:      'mrr',
    type:       'observed',
    confidence: 0.9,
    timestamp:  hoursAgo(0.5),
    trace_id:   'test-trace',
    ...overrides,
  }
}

// ─── T17.8 Caso 4 — computeRecencyFactor ─────────────────────────────────────

describe('computeRecencyFactor', () => {
  it('dato < 1h → 1.0', () => {
    expect(computeRecencyFactor(hoursAgo(0.5))).toBe(1.0)
  })

  it('dato 3h → 0.9', () => {
    expect(computeRecencyFactor(hoursAgo(3))).toBe(0.9)
  })

  it('dato 12h → 0.8', () => {
    expect(computeRecencyFactor(hoursAgo(12))).toBe(0.8)
  })

  it('dato 2 días → 0.7', () => {
    expect(computeRecencyFactor(daysAgo(2))).toBe(0.7)
  })

  it('dato 5 días → 0.5', () => {
    expect(computeRecencyFactor(daysAgo(5))).toBe(0.5)
  })

  // CASO OBLIGATORIO 4: dato de hace 8 días → 0.3
  it('dato de hace 8 días → 0.3', () => {
    expect(computeRecencyFactor(daysAgo(8))).toBe(0.3)
  })
})

// ─── T17.8 Caso 5 — computeEvidenceScore ─────────────────────────────────────

describe('computeEvidenceScore', () => {
  it('Stripe mrr confidence=0.9 hace 1h → score ≥ 0.85', () => {
    const evidence = makeEvidence({ source: 'stripe', field: 'mrr', confidence: 0.9, timestamp: hoursAgo(0.5) })
    const score = computeEvidenceScore(evidence)
    expect(score).toBeGreaterThanOrEqual(0.85)
  })

  it('user_manual mrr confidence=0.9 hace 3 días → score < 0.45', () => {
    const evidence = makeEvidence({ source: 'user_manual', field: 'mrr', confidence: 0.9, timestamp: daysAgo(3) })
    const score = computeEvidenceScore(evidence)
    expect(score).toBeLessThan(0.45)
  })

  // CASO OBLIGATORIO 5: fuente desactivada por preferencias → score=0
  it('usuario deshabilita Stripe → score=0', () => {
    const evidence = makeEvidence({ source: 'stripe', field: 'mrr', confidence: 0.9 })
    const prefs: Partial<ProjectSourcePreferences> = {
      stripe: { enabled: false },
    }
    const score = computeEvidenceScore(evidence, prefs as ProjectSourcePreferences)
    expect(score).toBe(0)
  })

  it('fuente incompatible para campo → score=0 (HubSpot para mrr)', () => {
    const evidence = makeEvidence({ source: 'hubspot', field: 'mrr', confidence: 0.9 })
    const score = computeEvidenceScore(evidence)
    expect(score).toBe(0)
  })

  it('weight_override aplica cuando está definido', () => {
    const evidence = makeEvidence({ source: 'stripe', field: 'mrr', confidence: 1.0, timestamp: hoursAgo(0.5) })
    const prefs: Partial<ProjectSourcePreferences> = {
      stripe: { enabled: true, weight_override: 0.5 },
    }
    const scoreWithOverride = computeEvidenceScore(evidence, prefs as ProjectSourcePreferences)
    const scoreDefault      = computeEvidenceScore(evidence)
    expect(scoreWithOverride).toBeLessThan(scoreDefault)
  })
})

// ─── T17.8 Casos 1, 2, 3 — resolveConflict ───────────────────────────────────

describe('resolveConflict', () => {
  // CASO OBLIGATORIO 1: Stripe vs user_manual mismo campo → Stripe gana
  it('Stripe vs user_manual mismo campo (mrr) → Stripe gana', () => {
    const stripe     = makeEvidence({ source: 'stripe',      field: 'mrr', confidence: 0.9, timestamp: hoursAgo(1) })
    const userManual = makeEvidence({ source: 'user_manual', field: 'mrr', confidence: 0.9, timestamp: daysAgo(5) })

    const result = resolveConflict([stripe, userManual])

    expect(result.winner.source).toBe('stripe')
    expect(result.score).toBeGreaterThan(0)
    expect(result.resolution_basis).toContain('stripe')
    expect(result.resolution_basis).toContain('user_manual')
  })

  // CASO OBLIGATORIO 2: fuente incompatible (HubSpot para mrr) → descartada
  it('HubSpot en campo mrr → incompatible, score=0 en alternatives', () => {
    const stripe  = makeEvidence({ source: 'stripe',  field: 'mrr', confidence: 0.9 })
    const hubspot = makeEvidence({ source: 'hubspot', field: 'mrr', confidence: 0.95 })

    const result = resolveConflict([stripe, hubspot])

    expect(result.winner.source).toBe('stripe')
    const hubspotAlt = result.alternatives.find(a => a.evidence.source === 'hubspot')
    expect(hubspotAlt).toBeDefined()
    expect(hubspotAlt!.score).toBe(0)
    expect(hubspotAlt!.reason).toBe('incompatible_or_disabled')
  })

  // CASO OBLIGATORIO 3: fuente desactivada por preferencias → score=0
  it('fuente desactivada en preferencias → score=0 en alternatives', () => {
    const stripe     = makeEvidence({ source: 'stripe',      field: 'mrr', confidence: 0.9 })
    const userManual = makeEvidence({ source: 'user_manual', field: 'mrr', confidence: 0.9 })
    const prefs: Partial<ProjectSourcePreferences> = {
      stripe: { enabled: false },
    }

    const result = resolveConflict([stripe, userManual], prefs as ProjectSourcePreferences)

    // Con Stripe desactivado, user_manual gana
    expect(result.winner.source).toBe('user_manual')
    const stripeAlt = result.alternatives.find(a => a.evidence.source === 'stripe')
    expect(stripeAlt!.score).toBe(0)
  })

  it('única evidencia → winner directo, alternatives vacío', () => {
    const stripe = makeEvidence({ source: 'stripe', field: 'mrr' })
    const result = resolveConflict([stripe])
    expect(result.winner.source).toBe('stripe')
    expect(result.alternatives).toHaveLength(0)
  })

  it('todas score=0 → fallback_recency, winner = más reciente', () => {
    const old    = makeEvidence({ source: 'hubspot', field: 'mrr', timestamp: daysAgo(10) })
    const recent = makeEvidence({ source: 'hubspot', field: 'mrr', timestamp: daysAgo(1) })

    const result = resolveConflict([old, recent])
    expect(result.resolution_basis).toBe('fallback_recency')
    expect(result.winner.timestamp).toBe(recent.timestamp)
  })
})

// ─── computeReliabilityScore ──────────────────────────────────────────────────

describe('computeReliabilityScore', () => {
  it('3 entidades Stripe confidence=0.85 → reliabilityScore ≥ 0.8', () => {
    const sources: SourceUsed[] = [
      { source: 'stripe', confidence: 0.85, timestamp: hoursAgo(0.5), entity_count: 3 },
    ]
    const score = computeReliabilityScore(sources)
    expect(score).toBeGreaterThanOrEqual(0.8)
  })

  it('insight sin entidades (fallback) → reliabilityScore ≤ 0.35', () => {
    const score = computeReliabilityScore([], 0.9)
    expect(score).toBeLessThanOrEqual(0.35)
  })

  it('fallback sin confidence → 0', () => {
    const score = computeReliabilityScore([])
    expect(score).toBe(0)
  })
})
