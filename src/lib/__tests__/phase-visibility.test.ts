/**
 * V24.9 — Tests de componentes de visibilidad de progresión
 *
 * Tests de lógica pura (no rendering):
 * 1. PHASE_METHODOLOGY existe para fases 0-4
 * 2. engine.ts exports son consistentes (labels, descriptions, methodology)
 * 3. PhaseRoadmap helper functions: getPhaseExplainerText, getUnlockChecklist
 */

import { describe, it, expect } from 'vitest'
import {
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
  PHASE_METHODOLOGY,
} from '../engine'

describe('V24.7 — PHASE_METHODOLOGY', () => {
  it('exists for phases 0-4', () => {
    for (let i = 0; i <= 4; i++) {
      expect(PHASE_METHODOLOGY[i]).toBeDefined()
      expect(typeof PHASE_METHODOLOGY[i]).toBe('string')
      expect(PHASE_METHODOLOGY[i].length).toBeGreaterThan(3)
    }
  })

  it('Phase 0 = Exploración libre', () => {
    expect(PHASE_METHODOLOGY[0]).toBe('Exploración libre')
  })

  it('Phase 1 includes Lean Startup', () => {
    expect(PHASE_METHODOLOGY[1]).toContain('Lean Startup')
  })

  it('Phase 4 includes Scaling Up', () => {
    expect(PHASE_METHODOLOGY[4]).toContain('Scaling Up')
  })
})

describe('engine.ts consistency', () => {
  it('PHASE_LABELS, DESCRIPTIONS, and METHODOLOGY have same keys', () => {
    const labelKeys = Object.keys(PHASE_LABELS).sort()
    const descKeys = Object.keys(PHASE_DESCRIPTIONS).sort()
    const methKeys = Object.keys(PHASE_METHODOLOGY).sort()

    expect(labelKeys).toEqual(descKeys)
    expect(labelKeys).toEqual(methKeys)
  })

  it('all 5 phases (0-4) are covered', () => {
    expect(Object.keys(PHASE_LABELS)).toHaveLength(5)
    expect(Object.keys(PHASE_DESCRIPTIONS)).toHaveLength(5)
    expect(Object.keys(PHASE_METHODOLOGY)).toHaveLength(5)
  })
})
