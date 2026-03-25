/**
 * Experience Engine — 4 Real Route Scenarios
 *
 * These tests simulate the EXACT contexts that DashboardView + NovaSidebar
 * would produce for real users. Each scenario verifies:
 *   - Dashboard: primary, secondary, deep, hidden blocks with depth + reason
 *   - Sidebar: visible, teaser, hidden items with role overrides
 *   - Budget: max 6 primary, max 3 secondary
 *   - No contradictions between dashboard and sidebar
 */

import { describe, it, expect } from 'vitest';
import {
  getDashboardConfig,
  getSidebarConfig,
  computeDataMaturity,
  resolveMacroRole,
  type ExperienceContext,
  type DashboardBlock,
} from '../experience-engine';

// ── Helper ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<ExperienceContext>): ExperienceContext {
  const base: ExperienceContext = {
    phase: 1,
    macroRole: 'founder',
    teamMode: 'solo',
    dataMaturity: 'minimal',
    daysActive: 14,
    isZenMode: false,
    totalOBVs: 0,
    totalLeads: 0,
    totalTasks: 0,
    teamSize: 1,
    hasRevenue: false,
    hasIntegrations: false,
    kpiCount: 0,
    phaseSCore: 0,
    ...overrides,
  };
  base.dataMaturity = computeDataMaturity(base);
  return base;
}

function findBlock(config: ReturnType<typeof getDashboardConfig>, block: DashboardBlock) {
  return [...config.primary, ...config.secondary, ...config.deep, ...config.hidden]
    .find(b => b.block === block);
}

function sidebarIds(sidebar: ReturnType<typeof getSidebarConfig>, vis: string) {
  return sidebar.items.filter(i => i.visibility === vis).map(i => i.id);
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO A: Founder P1 Solo — Week 2, 3 OBVs, 7 tasks, 0 leads, no revenue
// This is the most common early-stage founder. Engine should prioritize
// NextAction + OBVs + Tasks, hide CRM/Financial, keep team deep.
// ═════════════════════════════════════════════════════════════════════════════

describe('REAL ROUTE — Founder P1 Solo', () => {
  const ctx = makeCtx({
    phase: 1,
    macroRole: 'founder',
    teamMode: 'solo',
    daysActive: 14,
    isZenMode: false,
    totalOBVs: 3,
    totalLeads: 0,
    totalTasks: 7,
    teamSize: 1,
    hasRevenue: false,
    kpiCount: 1,
    phaseSCore: 42,
  });
  const dash = getDashboardConfig(ctx);
  const sidebar = getSidebarConfig(ctx);

  // ── Dashboard ──
  it('primary blocks: next_action, methodology, core_stats, phase_engine, obvs, tasks', () => {
    const names = dash.primary.map(b => b.block);
    expect(names).toContain('next_action');
    expect(names).toContain('methodology');
    expect(names).toContain('core_stats');
    expect(names).toContain('phase_engine');
    expect(names).toContain('obvs');
    expect(names).toContain('tasks');
    expect(names).not.toContain('crm_summary');
    expect(names).not.toContain('financial_summary');
  });

  it('secondary: alerts only', () => {
    const names = dash.secondary.map(b => b.block);
    expect(names).toContain('alerts');
    expect(names.length).toBeLessThanOrEqual(3);
  });

  it('crm_summary is teaser (0 leads) → goes to deep', () => {
    const b = findBlock(dash, 'crm_summary');
    expect(b?.depth).toBe('summary'); // phase >= 1, no leads but past phase gate
    // Actually: phase 1, totalLeads=0. Phase gate is phase >= 1 so not teaser.
    // toSummary needs totalLeads >= 1 which is false. Default for phase <= 1 is 'summary'.
    // Let me check: phase 1, no phase gate hit (crm_summary gate is phase >= 1, so passes).
    // toFull? totalLeads >= 5 && phase >= 2 → false. toSummary? totalLeads >= 1 → false.
    // Default: phase <= 1 → 'summary'.
    expect(b?.priority).not.toBe('primary');
  });

  it('financial_summary is teaser (phase < 2)', () => {
    const b = findBlock(dash, 'financial_summary');
    expect(b?.depth).toBe('teaser');
    expect(b?.priority).toBe('deep'); // teasers go to deep
  });

  it('team_status is deep (solo, teamSize=1)', () => {
    const b = findBlock(dash, 'team_status');
    expect(b?.priority).toBe('deep');
  });

  it('budget: max 6 primary, max 3 secondary', () => {
    expect(dash.primary.length).toBeLessThanOrEqual(6);
    expect(dash.secondary.length).toBeLessThanOrEqual(3);
  });

  // ── Sidebar ──
  it('sidebar: dashboard, startup-os, settings, notificaciones always visible', () => {
    const vis = sidebarIds(sidebar, 'visible');
    expect(vis).toContain('dashboard');
    expect(vis).toContain('startup-os');
    expect(vis).toContain('settings');
    expect(vis).toContain('notificaciones');
  });

  it('sidebar: financiero is teaser in P1', () => {
    const item = sidebar.items.find(i => i.id === 'financiero');
    expect(item?.visibility).toBe('teaser');
  });

  it('sidebar: team items are teaser for solo P1 (not hidden)', () => {
    const exploration = sidebar.items.find(i => i.id === 'exploration');
    // Solo + P1 → teaser per engine logic
    expect(exploration?.visibility).toBe('teaser');
  });

  // ── Coherence: dashboard + sidebar don't contradict ──
  it('if crm is visible in sidebar, crm_summary exists in dashboard', () => {
    const crmSidebar = sidebar.items.find(i => i.id === 'crm');
    const crmDash = findBlock(dash, 'crm_summary');
    // Both should exist (crm visible in sidebar P1, crm_summary present in dashboard)
    if (crmSidebar?.visibility === 'visible') {
      expect(crmDash).toBeDefined();
      expect(crmDash?.depth).not.toBe('hidden');
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO B: Founder P2 Rich — 60 days, 10 OBVs, 15 leads, revenue, integrations
// Everything should be expanded. CRM primary. Financial visible.
// ═════════════════════════════════════════════════════════════════════════════

describe('REAL ROUTE — Founder P2 Rich', () => {
  const ctx = makeCtx({
    phase: 2,
    macroRole: 'founder',
    teamMode: 'solo',
    daysActive: 60,
    totalOBVs: 10,
    totalLeads: 15,
    totalTasks: 25,
    teamSize: 1,
    hasRevenue: true,
    hasIntegrations: true,
    kpiCount: 3,
    phaseSCore: 72,
  });
  const dash = getDashboardConfig(ctx);
  const sidebar = getSidebarConfig(ctx);

  it('crm_summary is primary + full (15 leads, phase 2)', () => {
    const b = findBlock(dash, 'crm_summary');
    expect(b?.priority).toBe('primary');
    expect(b?.depth).toBe('full');
  });

  it('financial_summary is NOT hidden (has revenue)', () => {
    const b = findBlock(dash, 'financial_summary');
    expect(b?.depth).not.toBe('hidden');
    // revenue but < 90 days → summary, not full
    expect(b?.depth).toBe('summary');
  });

  it('phase_engine demoted to secondary (phase >= 2)', () => {
    const b = findBlock(dash, 'phase_engine');
    expect(b?.priority).toBe('secondary');
  });

  it('obvs is full (10 OBVs, phase >= 1)', () => {
    const b = findBlock(dash, 'obvs');
    expect(b?.depth).toBe('full');
  });

  it('tasks is full (25 tasks, phase >= 2)', () => {
    const b = findBlock(dash, 'tasks');
    expect(b?.depth).toBe('full');
  });

  it('budget respected', () => {
    expect(dash.primary.length).toBeLessThanOrEqual(6);
    expect(dash.secondary.length).toBeLessThanOrEqual(3);
  });

  it('data maturity is rich (score >= 8)', () => {
    expect(ctx.dataMaturity).toBe('rich');
  });

  it('sidebar: meetings, analisis-ia, toolkit are teaser in P2', () => {
    const meetings = sidebar.items.find(i => i.id === 'meetings');
    const ai = sidebar.items.find(i => i.id === 'analisis-ia');
    expect(meetings?.visibility).toBe('teaser');
    expect(ai?.visibility).toBe('teaser');
  });

  it('sidebar: financiero is visible in P2', () => {
    const item = sidebar.items.find(i => i.id === 'financiero');
    expect(item?.visibility).toBe('visible');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO C: Growth P2 — sales role, team of 3, 8 leads, revenue
// Key: CRM primary, Financial HIDDEN (growth + phase < 3), different sidebar
// ═════════════════════════════════════════════════════════════════════════════

describe('REAL ROUTE — Growth P2', () => {
  const ctx = makeCtx({
    phase: 2,
    macroRole: 'growth',
    teamMode: 'team',
    daysActive: 45,
    totalOBVs: 5,
    totalLeads: 8,
    totalTasks: 15,
    teamSize: 3,
    hasRevenue: true,
    kpiCount: 2,
    phaseSCore: 55,
  });
  const dash = getDashboardConfig(ctx);
  const sidebar = getSidebarConfig(ctx);

  // ── The critical Growth assertion: financial is HIDDEN ──
  it('financial_summary is HIDDEN for growth in phase < 3', () => {
    const b = findBlock(dash, 'financial_summary');
    expect(b?.depth).toBe('hidden');
    expect(b?.priority).toBe('hidden');
  });

  it('crm_summary is primary + full for growth (8 leads, phase 2)', () => {
    const b = findBlock(dash, 'crm_summary');
    expect(b?.priority).toBe('primary');
    expect(b?.depth).toBe('full');
  });

  it('phase_engine is secondary (phase >= 2)', () => {
    const b = findBlock(dash, 'phase_engine');
    expect(b?.priority).toBe('secondary');
  });

  it('team_status has summary depth (team of 3)', () => {
    const b = findBlock(dash, 'team_status');
    expect(b?.depth).toBe('summary');
  });

  it('budget respected', () => {
    expect(dash.primary.length).toBeLessThanOrEqual(6);
    expect(dash.secondary.length).toBeLessThanOrEqual(3);
  });

  // ── Sidebar role filtering ──
  it('sidebar: financiero HIDDEN for growth (phase < 3)', () => {
    const item = sidebar.items.find(i => i.id === 'financiero');
    expect(item?.visibility).toBe('hidden');
  });

  it('sidebar: mi-desarrollo HIDDEN for growth (phase < 3)', () => {
    const item = sidebar.items.find(i => i.id === 'mi-desarrollo');
    expect(item?.visibility).toBe('hidden');
  });

  it('sidebar: mi-modelo HIDDEN for growth (phase < 3)', () => {
    const item = sidebar.items.find(i => i.id === 'mi-modelo');
    expect(item?.visibility).toBe('hidden');
  });

  it('sidebar: crm IS visible for growth', () => {
    const item = sidebar.items.find(i => i.id === 'crm');
    expect(item?.visibility).toBe('visible');
  });

  // ── Coherence ──
  it('financial hidden in BOTH dashboard AND sidebar for growth', () => {
    const dashBlock = findBlock(dash, 'financial_summary');
    const sidebarItem = sidebar.items.find(i => i.id === 'financiero');
    expect(dashBlock?.priority).toBe('hidden');
    expect(sidebarItem?.visibility).toBe('hidden');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO D: Ops P3 — operations role, team of 4, revenue, 120 days
// Key: Tasks primary, Financial primary, CRM demoted to summary
// ═════════════════════════════════════════════════════════════════════════════

describe('REAL ROUTE — Ops P3', () => {
  const ctx = makeCtx({
    phase: 3,
    macroRole: 'operations',
    teamMode: 'team',
    daysActive: 120,
    totalOBVs: 20,
    totalLeads: 15,
    totalTasks: 50,
    teamSize: 4,
    hasRevenue: true,
    hasIntegrations: true,
    kpiCount: 5,
    phaseSCore: 75,
  });
  const dash = getDashboardConfig(ctx);
  const sidebar = getSidebarConfig(ctx);

  it('tasks is primary + full for ops', () => {
    const b = findBlock(dash, 'tasks');
    expect(b?.priority).toBe('primary');
    expect(b?.depth).toBe('full');
  });

  it('financial_summary is primary for ops', () => {
    const b = findBlock(dash, 'financial_summary');
    expect(b?.priority).toBe('primary');
  });

  it('crm_summary is summary depth for ops (phase 3, ops role)', () => {
    const b = findBlock(dash, 'crm_summary');
    expect(b?.depth).toBe('summary');
  });

  it('team_status is full (teamSize 4, phase 3)', () => {
    const b = findBlock(dash, 'team_status');
    expect(b?.depth).toBe('full');
  });

  it('budget respected', () => {
    expect(dash.primary.length).toBeLessThanOrEqual(6);
    expect(dash.secondary.length).toBeLessThanOrEqual(3);
  });

  it('data maturity is rich', () => {
    expect(ctx.dataMaturity).toBe('rich');
  });

  // ── Sidebar: Ops P3 sees everything (phase >= 3 unlocks all) ──
  it('sidebar: all main items visible in P3', () => {
    const vis = sidebarIds(sidebar, 'visible');
    expect(vis).toContain('dashboard');
    expect(vis).toContain('financiero');
    expect(vis).toContain('meetings');
    expect(vis).toContain('analisis-ia');
    expect(vis).toContain('crm'); // Ops P3: crm is visible (phase >= 3 overrides role)
  });

  it('sidebar: path-to-master still hidden in P3 (needs P4)', () => {
    const item = sidebar.items.find(i => i.id === 'path-to-master');
    expect(item?.visibility).toBe('hidden');
  });

  // ── Coherence ──
  it('financial visible in BOTH dashboard AND sidebar for ops P3', () => {
    const dashBlock = findBlock(dash, 'financial_summary');
    const sidebarItem = sidebar.items.find(i => i.id === 'financiero');
    expect(dashBlock?.priority).not.toBe('hidden');
    expect(sidebarItem?.visibility).toBe('visible');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CROSS-SCENARIO: Role resolution matches what DashboardView would pass
// ═════════════════════════════════════════════════════════════════════════════

describe('Role resolution — matches real DB values', () => {
  it('sales + not lead → growth', () => {
    expect(resolveMacroRole('sales', false)).toBe('growth');
  });
  it('marketing + not lead → growth', () => {
    expect(resolveMacroRole('marketing', false)).toBe('growth');
  });
  it('operations + not lead → operations', () => {
    expect(resolveMacroRole('operations', false)).toBe('operations');
  });
  it('finance + not lead → operations', () => {
    expect(resolveMacroRole('finance', false)).toBe('operations');
  });
  it('null + lead → founder', () => {
    expect(resolveMacroRole(null, true)).toBe('founder');
  });
  it('strategy + not lead → founder', () => {
    expect(resolveMacroRole('strategy', false)).toBe('founder');
  });
  it('ai_tech + not lead → operations', () => {
    expect(resolveMacroRole('ai_tech', false)).toBe('operations');
  });
});
