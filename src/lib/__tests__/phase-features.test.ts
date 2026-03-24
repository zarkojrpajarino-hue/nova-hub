/**
 * V4.7.4 — Tests for phase-features.ts
 *
 * Tests for getPhaseRelevanceScore + Phase 0 and Phase 4 edge cases
 * on PHASE_TAB_CONFIG, SIDEBAR_PHASE_CONFIG, PRIMARY_FOCUS_TABS, PHASE_STATS_CONFIG.
 */

import { describe, it, expect } from 'vitest';
import {
  getPhaseRelevanceScore,
  PHASE_TAB_CONFIG,
  PHASE_RELEVANCE,
  SIDEBAR_PHASE_CONFIG,
  PRIMARY_FOCUS_TABS,
  PHASE_STATS_CONFIG,
} from '../phase-features';

// ── getPhaseRelevanceScore ───────────────────────────────────────

describe('getPhaseRelevanceScore', () => {
  it('returns correct relevance for demand in phase 1', () => {
    expect(getPhaseRelevanceScore('demand', 1)).toBe(3);
  });

  it('returns correct relevance for delivery in phase 3', () => {
    expect(getPhaseRelevanceScore('delivery', 3)).toBe(3);
  });

  it('returns correct relevance for cash in phase 3', () => {
    expect(getPhaseRelevanceScore('cash', 3)).toBe(3);
  });

  it('returns 0 for all function_types in phase 0', () => {
    expect(getPhaseRelevanceScore('demand', 0)).toBe(0);
    expect(getPhaseRelevanceScore('delivery', 0)).toBe(0);
    expect(getPhaseRelevanceScore('cash', 0)).toBe(0);
    expect(getPhaseRelevanceScore('support', 0)).toBe(0);
  });

  it('returns 2 for all function_types in phase 4 (balanced)', () => {
    expect(getPhaseRelevanceScore('demand', 4)).toBe(2);
    expect(getPhaseRelevanceScore('delivery', 4)).toBe(2);
    expect(getPhaseRelevanceScore('cash', 4)).toBe(2);
    expect(getPhaseRelevanceScore('support', 4)).toBe(2);
  });

  it('falls back to "support" when functionType is null', () => {
    expect(getPhaseRelevanceScore(null, 1)).toBe(0); // support in phase 1 = 0
    expect(getPhaseRelevanceScore(null, 3)).toBe(1); // support in phase 3 = 1
  });

  it('falls back to "support" when functionType is undefined', () => {
    expect(getPhaseRelevanceScore(undefined, 2)).toBe(0); // support in phase 2 = 0
  });

  it('returns default 1 for unknown function_type', () => {
    expect(getPhaseRelevanceScore('unknown_type', 1)).toBe(1);
    expect(getPhaseRelevanceScore('xyz', 3)).toBe(1);
  });

  it('returns default 1 for unknown phase', () => {
    expect(getPhaseRelevanceScore('demand', 99)).toBe(1);
  });
});

// ── Phase 0 edge cases ──────────────────────────────────────────

describe('Phase 0 — PHASE_TAB_CONFIG', () => {
  const phase0 = PHASE_TAB_CONFIG[0];

  it('dashboard is primary in phase 0', () => {
    expect(phase0['dashboard']).toBe('primary');
  });

  it('tareas is primary in phase 0', () => {
    expect(phase0['tareas']).toBe('primary');
  });

  it('most tabs are teaser in phase 0', () => {
    const teaserTabs = ['obvs', 'equipo', 'crm', 'financiero', 'negocio-ia', 'reuniones', 'expansion'];
    for (const tab of teaserTabs) {
      expect(phase0[tab]).toBe('teaser');
    }
  });
});

describe('Phase 0 — SIDEBAR_PHASE_CONFIG', () => {
  const phase0 = SIDEBAR_PHASE_CONFIG[0];

  it('only dashboard, startup-os, settings, notificaciones are visible', () => {
    const visible = Object.entries(phase0)
      .filter(([, status]) => status === 'visible')
      .map(([key]) => key);
    expect(visible.sort()).toEqual(['dashboard', 'notificaciones', 'settings', 'startup-os'].sort());
  });

  it('everything else is hidden (not teaser) in phase 0', () => {
    const nonVisible = Object.entries(phase0)
      .filter(([, status]) => status !== 'visible');
    for (const [, status] of nonVisible) {
      expect(status).toBe('hidden');
    }
  });
});

describe('Phase 0 — PRIMARY_FOCUS_TABS', () => {
  it('phase 0 focus is dashboard and tareas', () => {
    expect(PRIMARY_FOCUS_TABS[0]).toEqual(['dashboard', 'tareas']);
  });
});

describe('Phase 0 — PHASE_STATS_CONFIG', () => {
  it('phase 0 stats include ideas_explored and problems_identified', () => {
    expect(PHASE_STATS_CONFIG[0]).toContain('ideas_explored');
    expect(PHASE_STATS_CONFIG[0]).toContain('problems_identified');
  });
});

describe('Phase 0 — PHASE_RELEVANCE', () => {
  it('all relevance scores are 0 in phase 0', () => {
    const scores = Object.values(PHASE_RELEVANCE[0]);
    expect(scores.every((s) => s === 0)).toBe(true);
  });
});

// ── Phase 4 edge cases ──────────────────────────────────────────

describe('Phase 4 — PHASE_TAB_CONFIG', () => {
  const phase4 = PHASE_TAB_CONFIG[4];

  it('no tabs are teaser in phase 4 (all unlocked)', () => {
    for (const [tab, status] of Object.entries(phase4)) {
      expect(status).not.toBe('teaser');
    }
  });

  it('core business tabs are primary in phase 4', () => {
    expect(phase4['dashboard']).toBe('primary');
    expect(phase4['tareas']).toBe('primary');
    expect(phase4['crm']).toBe('primary');
    expect(phase4['financiero']).toBe('primary');
    expect(phase4['negocio-ia']).toBe('primary');
    expect(phase4['equipo']).toBe('primary');
    expect(phase4['expansion']).toBe('primary');
    expect(phase4['reuniones']).toBe('primary');
  });

  it('has all the same tabs as phase 0', () => {
    const tabs0 = Object.keys(PHASE_TAB_CONFIG[0]).sort();
    const tabs4 = Object.keys(PHASE_TAB_CONFIG[4]).sort();
    expect(tabs4).toEqual(tabs0);
  });
});

describe('Phase 4 — SIDEBAR_PHASE_CONFIG', () => {
  const phase4 = SIDEBAR_PHASE_CONFIG[4];

  it('all sidebar items are visible in phase 4', () => {
    for (const [, status] of Object.entries(phase4)) {
      expect(status).toBe('visible');
    }
  });
});

describe('Phase 4 — PRIMARY_FOCUS_TABS', () => {
  it('phase 4 focus includes tareas and crm', () => {
    expect(PRIMARY_FOCUS_TABS[4]).toContain('tareas');
    expect(PRIMARY_FOCUS_TABS[4]).toContain('crm');
  });
});

describe('Phase 4 — PHASE_STATS_CONFIG', () => {
  it('phase 4 stats include facturacion and margen', () => {
    expect(PHASE_STATS_CONFIG[4]).toContain('facturacion');
    expect(PHASE_STATS_CONFIG[4]).toContain('margen');
  });
});

describe('Phase 4 — PHASE_RELEVANCE', () => {
  it('all relevance scores are 2 in phase 4 (balanced)', () => {
    const scores = Object.values(PHASE_RELEVANCE[4]);
    expect(scores.every((s) => s === 2)).toBe(true);
  });
});
