/**
 * Tests unitarios para classifyInsightImpact — M18.X.2
 * 6 casos cubriendo las reglas de clasificación clave + degradación por fiabilidad.
 */

import { describe, it, expect } from 'vitest'
import { classifyInsightImpact, type MeetingInsightRow } from './meeting-agent'

// ─── Helper ────────────────────────────────────────────────────────────────

function makeInsight(
  insight_type: MeetingInsightRow['insight_type'],
  content: Record<string, unknown> = {},
): MeetingInsightRow {
  return {
    id: 'test-id',
    meeting_id: 'meeting-id',
    insight_type,
    content,
    review_status: 'pending_review',
    applied: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('classifyInsightImpact', () => {
  // Caso 1 — Regla 1: decision con stakeholders + clarity ≥ 0.7 + buena confianza → high
  it('decision con stakeholders y clarity ≥ 0.7 → high, requires_confirmation=true', () => {
    const insight = makeInsight('decision', {
      stakeholders: ['user-1'],
      clarity_score: 0.85,
      speaker_certainty: 'definitive',
    })
    const result = classifyInsightImpact(insight, 0.9)

    expect(result.impact_level).toBe('high')
    expect(result.requires_confirmation).toBe(true)
    expect(result.auto_degraded).toBe(false)
    // combined = 0.9 × 0.85 × 1.0 = 0.765 → no degrada
    expect(result.combined_reliability).toBeCloseTo(0.765, 2)
  })

  // Caso 2 — Regla 2: decision sin stakeholders → medium
  it('decision sin stakeholders → medium', () => {
    const insight = makeInsight('decision', {
      stakeholders: [],
      clarity_score: 0.9,
      speaker_certainty: 'definitive',
    })
    const result = classifyInsightImpact(insight, 0.9)

    expect(result.impact_level).toBe('medium')
    expect(result.requires_confirmation).toBe(false)
  })

  // Caso 3 — Regla 3: blocker crítico → high
  it('blocker crítico → high', () => {
    const insight = makeInsight('blocker', {
      severity: 'crítico',
      clarity_score: 0.8,
      speaker_certainty: 'definitive',
    })
    const result = classifyInsightImpact(insight, 0.85)

    expect(result.impact_level).toBe('high')
    expect(result.auto_degraded).toBe(false)
    // combined = 0.85 × 0.8 × 1.0 = 0.68 → no degrada (≥ 0.5)
    expect(result.combined_reliability).toBeCloseTo(0.68, 2)
  })

  // Caso 4 — Regla 5: metric con valor numérico → high
  it('metric con valor numérico → high', () => {
    const insight = makeInsight('metric', {
      value: 42500,
      clarity_score: 0.9,
      speaker_certainty: 'definitive',
    })
    const result = classifyInsightImpact(insight, 0.95)

    expect(result.impact_level).toBe('high')
    expect(result.requires_confirmation).toBe(true)
  })

  // Caso 5 — Regla 7: task → medium (operativo, auto-aprobado)
  it('task → medium, no requiere confirmación', () => {
    const insight = makeInsight('task', {
      title: 'Actualizar la demo',
      clarity_score: 0.8,
      speaker_certainty: 'definitive',
    })
    const result = classifyInsightImpact(insight, 0.9)

    expect(result.impact_level).toBe('medium')
    expect(result.requires_confirmation).toBe(false)
    expect(result.auto_degraded).toBe(false)
  })

  // Caso 6 — Degradación: decision estratégica pero speaker especulativo + baja confianza →
  //          combined_reliability < 0.5 → auto_degraded=true, impact_level='medium'
  it('decision con speaker especulativo y baja confianza → degrada a medium', () => {
    const insight = makeInsight('decision', {
      stakeholders: ['user-1'],
      clarity_score: 0.6,
      speaker_certainty: 'speculative',  // weight = 0.3
    })
    // combined = 0.7 × 0.6 × 0.3 = 0.126 → < 0.5 → degrada high→medium
    // Pero primero: clarity_score=0.6 < 0.7 → Regla 2 → medium ya de base
    // Para forzar el caso de degradación, usar clarity ≥ 0.7 y bajo transcription
    const insightHigh = makeInsight('decision', {
      stakeholders: ['user-1'],
      clarity_score: 0.75,            // ≥ 0.7 → clasificaría como high
      speaker_certainty: 'speculative', // weight = 0.3
    })
    // combined = 0.4 × 0.75 × 0.3 = 0.09 → < 0.5 → degrada high→medium
    const result = classifyInsightImpact(insightHigh, 0.4)

    expect(result.impact_level).toBe('medium')
    expect(result.auto_degraded).toBe(true)
    expect(result.requires_confirmation).toBe(false)
    expect(result.degradation_reason).toMatch(/Baja fiabilidad combinada/)
    expect(result.combined_reliability).toBeCloseTo(0.4 * 0.75 * 0.3, 4)
  })
})
