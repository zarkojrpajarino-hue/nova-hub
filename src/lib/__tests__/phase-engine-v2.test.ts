/**
 * P23.11 — Tests unitarios del motor de progresión v2 (FASE 23)
 *
 * Tests de lógica pura frontend:
 * 1. PHASE_LABELS incluye Phase 0
 * 2. PHASE_TAB_CONFIG incluye Phase 0 con teasers correctos
 * 3. PHASE_RELEVANCE[0] existe con todos los valores en 0
 * 4. PHASE_STATS_CONFIG[0] incluye ideas_explored y problems_identified
 * 5. getPhaseRelevanceScore funciona para Phase 0
 * 6. PRIMARY_FOCUS_TABS[0] existe
 * 7. TAB_TEASER_REASONS incluye Phase 0
 *
 * Nota: Los tests de SQL (compute_phase0_score, fast-track cascada,
 * graduación, regresión) se verifican contra BD real, no en vitest.
 */

import { describe, it, expect } from 'vitest'
import { PHASE_LABELS, PHASE_DESCRIPTIONS } from '../engine'
import {
  PHASE_TAB_CONFIG,
  PHASE_RELEVANCE,
  PHASE_STATS_CONFIG,
  PRIMARY_FOCUS_TABS,
  TAB_TEASER_REASONS,
  getPhaseRelevanceScore,
} from '../phase-features'

describe('Phase Engine v2 — engine.ts', () => {
  it('PHASE_LABELS includes Phase 0 = Exploración', () => {
    expect(PHASE_LABELS[0]).toBe('Exploración')
  })

  it('PHASE_LABELS has 5 entries (0-4)', () => {
    expect(Object.keys(PHASE_LABELS)).toHaveLength(5)
    for (let i = 0; i <= 4; i++) {
      expect(PHASE_LABELS[i]).toBeDefined()
    }
  })

  it('PHASE_DESCRIPTIONS includes Phase 0', () => {
    expect(PHASE_DESCRIPTIONS[0]).toContain('exploración')
  })

  it('PHASE_DESCRIPTIONS has 5 entries (0-4)', () => {
    expect(Object.keys(PHASE_DESCRIPTIONS)).toHaveLength(5)
  })
})

describe('Phase Engine v2 — phase-features.ts', () => {
  it('PHASE_TAB_CONFIG[0] exists with dashboard and tareas as primary', () => {
    const p0 = PHASE_TAB_CONFIG[0]
    expect(p0).toBeDefined()
    expect(p0.dashboard).toBe('primary')
    expect(p0.tareas).toBe('primary')
  })

  it('PHASE_TAB_CONFIG[0] has all other tabs as teaser', () => {
    const p0 = PHASE_TAB_CONFIG[0]
    expect(p0.obvs).toBe('teaser')
    expect(p0.equipo).toBe('teaser')
    expect(p0.crm).toBe('teaser')
    expect(p0.financiero).toBe('teaser')
    expect(p0['negocio-ia']).toBe('teaser')
    expect(p0.reuniones).toBe('teaser')
  })

  it('PHASE_RELEVANCE[0] has all function types at 0', () => {
    const p0 = PHASE_RELEVANCE[0]
    expect(p0).toBeDefined()
    expect(p0.demand).toBe(0)
    expect(p0.delivery).toBe(0)
    expect(p0.cash).toBe(0)
    expect(p0.support).toBe(0)
  })

  it('getPhaseRelevanceScore returns 1 (default) for Phase 0 unknown type', () => {
    // Phase 0 has all values as 0, but unknown types default to 1
    expect(getPhaseRelevanceScore('unknown_type', 0)).toBe(1)
  })

  it('getPhaseRelevanceScore returns 0 for Phase 0 known types', () => {
    expect(getPhaseRelevanceScore('demand', 0)).toBe(0)
    expect(getPhaseRelevanceScore('delivery', 0)).toBe(0)
    expect(getPhaseRelevanceScore('cash', 0)).toBe(0)
    expect(getPhaseRelevanceScore('support', 0)).toBe(0)
  })

  it('PHASE_STATS_CONFIG[0] includes exploration-specific stats', () => {
    const stats = PHASE_STATS_CONFIG[0]
    expect(stats).toBeDefined()
    expect(stats).toContain('ideas_explored')
    expect(stats).toContain('problems_identified')
    expect(stats).toContain('days_active')
  })

  it('PRIMARY_FOCUS_TABS[0] exists', () => {
    expect(PRIMARY_FOCUS_TABS[0]).toBeDefined()
    expect(PRIMARY_FOCUS_TABS[0]).toContain('dashboard')
    expect(PRIMARY_FOCUS_TABS[0]).toContain('tareas')
  })

  it('TAB_TEASER_REASONS includes Phase 0 entries', () => {
    expect(TAB_TEASER_REASONS.crm?.[0]).toBeDefined()
    expect(TAB_TEASER_REASONS.financiero?.[0]).toBeDefined()
    expect(TAB_TEASER_REASONS['negocio-ia']?.[0]).toBeDefined()
    expect(TAB_TEASER_REASONS.obvs?.[0]).toBeDefined()
  })

  it('All phases 0-4 have PHASE_TAB_CONFIG entries', () => {
    for (let i = 0; i <= 4; i++) {
      expect(PHASE_TAB_CONFIG[i]).toBeDefined()
      expect(PHASE_TAB_CONFIG[i].dashboard).toBeDefined()
      expect(PHASE_TAB_CONFIG[i].tareas).toBeDefined()
    }
  })

  it('All phases 0-4 have PHASE_RELEVANCE entries', () => {
    for (let i = 0; i <= 4; i++) {
      expect(PHASE_RELEVANCE[i]).toBeDefined()
    }
  })

  it('All phases 0-4 have PHASE_STATS_CONFIG entries', () => {
    for (let i = 0; i <= 4; i++) {
      expect(PHASE_STATS_CONFIG[i]).toBeDefined()
      expect(PHASE_STATS_CONFIG[i].length).toBeGreaterThan(0)
    }
  })
})
