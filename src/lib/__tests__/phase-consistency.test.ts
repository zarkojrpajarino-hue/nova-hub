/**
 * F19.V2.3 -- Phase consistency test
 *
 * Static consistency check: verifies that PHASE_TAB_CONFIG transitions
 * (teaser -> secondary/primary) match the documented feature_matrix.md.
 *
 * This test encodes the expected unlock phases from feature_matrix.md
 * and verifies PHASE_TAB_CONFIG agrees with them.
 */

import { describe, it, expect } from 'vitest'
import { PHASE_TAB_CONFIG, type TabStatus } from '../phase-features'

// Expected transitions from feature_matrix.md:
// A tab "unlocks" at the phase where it first transitions from 'teaser'
// to 'secondary' or 'primary'.
//
// Source: feature_matrix.md + PHASE_TAB_CONFIG definition
const EXPECTED_UNLOCK_PHASE: Record<string, number> = {
  dashboard:    0,  // primary in all phases
  tareas:       0,  // primary in all phases
  obvs:         1,  // teaser in 0, primary in 1
  equipo:       1,  // teaser in 0, secondary in 1
  reuniones:    1,  // teaser in 0, secondary in 1
  crm:          1,  // teaser in 0, secondary in 1 (V5.2.1)
  financiero:   2,  // teaser in 0-1, secondary in 2
  'negocio-ia': 3,  // teaser in 0-2, secondary in 3
  expansion:    3,  // teaser in 0-2, secondary in 3
}

function getUnlockPhase(tab: string): number | null {
  for (let phase = 0; phase <= 4; phase++) {
    const status = PHASE_TAB_CONFIG[phase]?.[tab]
    if (status === 'primary' || status === 'secondary') {
      return phase
    }
  }
  return null // never unlocked
}

describe('PHASE_TAB_CONFIG consistency with feature_matrix.md', () => {
  const tabs = Object.keys(EXPECTED_UNLOCK_PHASE)

  it.each(tabs)('tab "%s" unlocks at the expected phase', (tab) => {
    const actual = getUnlockPhase(tab)
    const expected = EXPECTED_UNLOCK_PHASE[tab]
    expect(actual).toBe(expected)
  })

  it('all tabs in PHASE_TAB_CONFIG are covered by expected unlock map', () => {
    const allTabs = new Set<string>()
    for (const phase of Object.values(PHASE_TAB_CONFIG)) {
      for (const tab of Object.keys(phase)) {
        allTabs.add(tab)
      }
    }
    for (const tab of allTabs) {
      expect(EXPECTED_UNLOCK_PHASE).toHaveProperty(tab)
    }
  })

  it('no tab goes from non-teaser back to teaser in later phases', () => {
    const allTabs = new Set<string>()
    for (const phase of Object.values(PHASE_TAB_CONFIG)) {
      for (const tab of Object.keys(phase)) allTabs.add(tab)
    }

    for (const tab of allTabs) {
      let unlocked = false
      for (let phase = 0; phase <= 4; phase++) {
        const status: TabStatus | undefined = PHASE_TAB_CONFIG[phase]?.[tab]
        if (!status) continue
        if (status === 'primary' || status === 'secondary') {
          unlocked = true
        }
        if (unlocked && status === 'teaser') {
          throw new Error(
            `Tab "${tab}" regresses to teaser at phase ${phase} after being unlocked`,
          )
        }
      }
    }
  })

  it('phases 0-4 all exist in PHASE_TAB_CONFIG', () => {
    for (let phase = 0; phase <= 4; phase++) {
      expect(PHASE_TAB_CONFIG).toHaveProperty(String(phase))
    }
  })
})
