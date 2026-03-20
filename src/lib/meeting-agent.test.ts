/**
 * Tests unitarios para classifyInsightImpact — M18.X.2
 * Tests unitarios para runMeetingAgentLocal — M18.1
 */

import { describe, it, expect } from 'vitest'
import { classifyInsightImpact, runMeetingAgentLocal, type MeetingInsightRow } from './meeting-agent'

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

function makeApprovedInsight(
  insight_type: MeetingInsightRow['insight_type'],
  content: Record<string, unknown> = {},
): MeetingInsightRow {
  return {
    id: `approved-${Math.random()}`,
    meeting_id: 'meeting-id',
    insight_type,
    content,
    review_status: 'approved',
    applied: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('runMeetingAgentLocal', () => {
  // M18.1 criterio: 1 decisión aprobada con stakeholders → 1 insight strategic_decision emitido
  it('1 decision aprobada con stakeholders → emite strategic_decision', () => {
    const insights = [
      makeApprovedInsight('decision', {
        summary: 'Decidimos pivotar al mercado B2B',
        stakeholders: ['investor-1'],
        clarity_score: 0.9,
        speaker_certainty: 'definitive',
      }),
    ]
    const result = runMeetingAgentLocal(insights, 0.85)

    expect(result.length).toBeGreaterThanOrEqual(1)
    const sd = result.find(r => r.insight_type === 'strategic_decision')
    expect(sd).toBeDefined()
    expect(sd!.confidence).toBeGreaterThanOrEqual(0.4)
    expect(sd!.entity_ids.length).toBeGreaterThanOrEqual(1)
  })

  it('sin decisiones aprobadas → no emite strategic_decision', () => {
    const insights = [
      makeApprovedInsight('task', { title: 'Actualizar docs' }),
      makeApprovedInsight('task', { title: 'Preparar demo' }),
      makeApprovedInsight('task', { title: 'Email a cliente' }),
    ]
    const result = runMeetingAgentLocal(insights, 0.8)

    const sd = result.find(r => r.insight_type === 'strategic_decision')
    expect(sd).toBeUndefined()
  })

  it('≥3 tasks aprobadas → emite commitment_cluster', () => {
    const insights = [
      makeApprovedInsight('task', { title: 'Task 1' }),
      makeApprovedInsight('task', { title: 'Task 2' }),
      makeApprovedInsight('task', { title: 'Task 3' }),
    ]
    const result = runMeetingAgentLocal(insights, 0.8)

    const cc = result.find(r => r.insight_type === 'commitment_cluster')
    expect(cc).toBeDefined()
  })

  it('blocker que aparece en historial → emite recurring_blocker', () => {
    const insights = [
      makeApprovedInsight('blocker', { title: 'Sin acceso a producción', severity: 'alto' }),
    ]
    const historical = ['Sin acceso a producción — desde hace 2 semanas']
    const result = runMeetingAgentLocal(insights, 0.8, historical)

    const rb = result.find(r => r.insight_type === 'recurring_blocker')
    expect(rb).toBeDefined()
  })

  it('metric con valor numérico → emite metric_update', () => {
    const insights = [
      makeApprovedInsight('metric', { name: 'MRR', value: 12000 }),
    ]
    const result = runMeetingAgentLocal(insights, 0.9)

    const mu = result.find(r => r.insight_type === 'metric_update')
    expect(mu).toBeDefined()
  })

  it('insights con confidence < 0.4 y sin entity_ids → filtrados', () => {
    // sin decisiones con stakeholders, sin tasks suficientes, sin blockers históricos,
    // sin metrics con valor numérico → nada emitido
    const insights = [
      makeApprovedInsight('decision', {
        summary: 'quizás algo',
        stakeholders: [],          // sin stakeholders → no strategic_decision
        clarity_score: 0.3,
      }),
    ]
    const result = runMeetingAgentLocal(insights, 0.3)
    // strategic_decision no se emite sin stakeholders; otros tipos sin data suficiente tampoco
    expect(result.every(r => r.confidence >= 0.4 || r.entity_ids.length > 0)).toBe(true)
  })
})

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
    const _insight = makeInsight('decision', {
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
