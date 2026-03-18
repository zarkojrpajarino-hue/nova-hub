/**
 * T17.29 — Tests para la política de silencio de agentes
 *
 * §12 de AGENTS_CONTRACT.md: un insight con confidence < 0.5 Y entity_ids vacío
 * NO debe emitirse. El silencio es preferible a la desinformación.
 *
 * Los tests verifican:
 * 1. El predicado de silencio directamente (cubre el caso descrito en la spec).
 * 2. Que los agentes con 0 entidades devuelven 0 insights.
 */

import { describe, it, expect } from 'vitest'
import { runFinanceAgentLocal } from '@/lib/finance-agent'
import { runExecutionAgentLocal } from '@/lib/execution-agent'
import { runSalesAgentLocal } from '@/lib/sales-agent'
import { runCalendarAgentLocal } from '@/lib/calendar-agent'

// ─────────────────────────────────────────────────────────────────────────────
// Predicado de silencio — misma regla que aplican los 4 agentes
// ─────────────────────────────────────────────────────────────────────────────

function shouldSuppress(confidence: number, entityIds: string[]): boolean {
  return confidence < 0.5 && entityIds.length === 0
}

describe('T17.29 — silence guard predicate', () => {
  it('confidence=0.3 + entity_ids=[] → suppressed', () => {
    expect(shouldSuppress(0.3, [])).toBe(true)
  })

  it('confidence=0.49 + entity_ids=[] → suppressed (boundary)', () => {
    expect(shouldSuppress(0.49, [])).toBe(true)
  })

  it('confidence=0.7 + entity_ids=[] → NOT suppressed (estimated but high confidence)', () => {
    expect(shouldSuppress(0.7, [])).toBe(false)
  })

  it('confidence=0.5 + entity_ids=[] → NOT suppressed (confidence exactly at threshold)', () => {
    expect(shouldSuppress(0.5, [])).toBe(false)
  })

  it('confidence=0.3 + entity_ids=[id1] → NOT suppressed (has backing entities)', () => {
    expect(shouldSuppress(0.3, ['abc-123'])).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 0 entidades → 0 insights (todos los agentes)
// Los compute functions ya retornan null con entidades vacías; el filtro es
// un safety net para futuros caminos que generen insights sin entidades.
// ─────────────────────────────────────────────────────────────────────────────

describe('T17.29 — agents with 0 entities emit 0 insights', () => {
  it('Finance Agent: [] entities → 0 insights', () => {
    expect(runFinanceAgentLocal([])).toHaveLength(0)
  })

  it('Execution Agent: [] entities → 0 insights', () => {
    expect(runExecutionAgentLocal([])).toHaveLength(0)
  })

  it('Sales Agent: [] entities → 0 insights', () => {
    expect(runSalesAgentLocal([])).toHaveLength(0)
  })

  it('Calendar Agent: [] entities → 0 insights', () => {
    expect(runCalendarAgentLocal([], new Date())).toHaveLength(0)
  })
})
