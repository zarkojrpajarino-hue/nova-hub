/**
 * Experience Engine Tests
 *
 * Tests the Decision Engine that determines what each user sees.
 * Starting with the FIRST scenario: Founder, Phase 1, Solo, Week 2.
 * If this scenario works perfectly, the rest will follow.
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

// ── Helper ───────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<ExperienceContext> = {}): ExperienceContext {
  return {
    phase: 1,
    macroRole: 'founder',
    teamMode: 'solo',
    dataMaturity: 'minimal',
    daysActive: 14,
    isZenMode: false,
    totalOBVs: 3,
    totalLeads: 0,
    totalTasks: 7,
    teamSize: 1,
    hasRevenue: false,
    hasIntegrations: false,
    kpiCount: 1,
    phaseSCore: 42,
    ...overrides,
  };
}

function findBlock(config: ReturnType<typeof getDashboardConfig>, block: DashboardBlock) {
  return [...config.primary, ...config.secondary, ...config.deep, ...config.hidden]
    .find(b => b.block === block);
}

// ── Data Maturity ────────────────────────────────────────────────────────────

describe('computeDataMaturity', () => {
  it('returns empty when no data', () => {
    expect(computeDataMaturity({
      totalOBVs: 0, totalLeads: 0, totalTasks: 0,
      hasRevenue: false, hasIntegrations: false, kpiCount: 0, daysActive: 0,
    })).toBe('empty');
  });

  it('returns minimal with few data points', () => {
    expect(computeDataMaturity({
      totalOBVs: 1, totalLeads: 0, totalTasks: 2,
      hasRevenue: false, hasIntegrations: false, kpiCount: 0, daysActive: 5,
    })).toBe('minimal');
  });

  it('returns growing with moderate data', () => {
    expect(computeDataMaturity({
      totalOBVs: 3, totalLeads: 5, totalTasks: 10,
      hasRevenue: false, hasIntegrations: false, kpiCount: 1, daysActive: 30,
    })).toBe('growing');
  });

  it('returns rich with full data', () => {
    expect(computeDataMaturity({
      totalOBVs: 10, totalLeads: 20, totalTasks: 30,
      hasRevenue: true, hasIntegrations: true, kpiCount: 5, daysActive: 90,
    })).toBe('rich');
  });
});

// ── Macro Role Resolver ──────────────────────────────────────────────────────

describe('resolveMacroRole', () => {
  it('founder if isLead', () => {
    expect(resolveMacroRole('sales', true)).toBe('founder');
  });

  it('founder if strategy role', () => {
    expect(resolveMacroRole('strategy', false)).toBe('founder');
  });

  it('growth if sales', () => {
    expect(resolveMacroRole('sales', false)).toBe('growth');
  });

  it('growth if marketing', () => {
    expect(resolveMacroRole('marketing', false)).toBe('growth');
  });

  it('operations if finance', () => {
    expect(resolveMacroRole('finance', false)).toBe('operations');
  });

  it('operations if null', () => {
    expect(resolveMacroRole(null, false)).toBe('operations');
  });
});

// ── SCENARIO: Founder, Phase 1, Solo, Week 2 ────────────────────────────────

describe('Scenario: Founder, Phase 1, Solo, Week 2', () => {
  const ctx = makeContext(); // defaults = this exact scenario

  it('returns max 6 primary blocks', () => {
    const config = getDashboardConfig(ctx);
    expect(config.primary.length).toBeLessThanOrEqual(6);
  });

  it('returns max 3 secondary blocks', () => {
    const config = getDashboardConfig(ctx);
    expect(config.secondary.length).toBeLessThanOrEqual(3);
  });

  it('next_action is always primary', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'next_action');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).not.toBe('hidden');
  });

  it('methodology is always primary', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'methodology');
    expect(block?.priority).toBe('primary');
  });

  it('core_stats is primary (has OBVs + tasks)', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'core_stats');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).toBe('summary');
  });

  it('phase_engine is primary in Phase 1', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'phase_engine');
    expect(block?.priority).toBe('primary');
  });

  it('tasks is primary for founder Phase 1', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'tasks');
    expect(block?.priority).toBe('primary');
  });

  it('obvs is primary for founder Phase 1', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'obvs');
    expect(block?.priority).toBe('primary');
  });

  it('crm_summary is NOT primary (no leads yet)', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'crm_summary');
    // Phase 1 founder with 0 leads: CRM is teaser, goes to deep
    expect(block?.priority).not.toBe('primary');
  });

  it('financial_summary is teaser (Phase < 2)', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'financial_summary');
    expect(block?.depth).toBe('teaser');
  });

  it('team_status is deep (solo mode)', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'team_status');
    expect(block?.priority).toBe('deep');
  });

  it('alerts is secondary', () => {
    const config = getDashboardConfig(ctx);
    const block = findBlock(config, 'alerts');
    expect(block?.priority).toBe('secondary');
  });
});

// ── SCENARIO: Zen Mode (Day 0, Phase 0) ──────────────────────────────────────

describe('Scenario: Zen Mode (Phase 0, Day 0)', () => {
  const ctx = makeContext({
    phase: 0, daysActive: 0, isZenMode: true,
    totalOBVs: 0, totalLeads: 0, totalTasks: 0, teamSize: 1,
    kpiCount: 0, phaseSCore: 0,
  });

  it('max 4 blocks visible in zen mode', () => {
    const config = getDashboardConfig(ctx);
    const visible = [...config.primary, ...config.secondary, ...config.deep];
    expect(visible.length).toBeLessThanOrEqual(5);
  });

  it('next_action visible in zen', () => {
    const block = findBlock(getDashboardConfig(ctx), 'next_action');
    expect(block?.depth).not.toBe('hidden');
  });

  it('methodology visible in zen', () => {
    const block = findBlock(getDashboardConfig(ctx), 'methodology');
    expect(block?.depth).not.toBe('hidden');
  });

  it('core_stats hidden in zen (no data)', () => {
    const block = findBlock(getDashboardConfig(ctx), 'core_stats');
    expect(block?.depth).toBe('hidden');
  });

  it('crm hidden in zen', () => {
    const block = findBlock(getDashboardConfig(ctx), 'crm_summary');
    expect(block?.depth).toBe('hidden');
  });
});

// ── SCENARIO: Growth member, Phase 2 ────────────────────────────────────────

describe('Scenario: Growth member, Phase 2', () => {
  const ctx = makeContext({
    phase: 2, macroRole: 'growth', teamMode: 'team', teamSize: 3,
    totalLeads: 8, totalOBVs: 5, hasRevenue: true,
    daysActive: 45, isZenMode: false,
  });

  it('crm_summary is primary for growth', () => {
    const block = findBlock(getDashboardConfig(ctx), 'crm_summary');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).toBe('full');
  });

  it('financial_summary is hidden for growth in Phase 2', () => {
    const block = findBlock(getDashboardConfig(ctx), 'financial_summary');
    expect(block?.depth).toBe('hidden');
  });
});

// ── SCENARIO: Operations member, Phase 3 ────────────────────────────────────

describe('Scenario: Operations member, Phase 3', () => {
  const ctx = makeContext({
    phase: 3, macroRole: 'operations', teamMode: 'team', teamSize: 4,
    totalLeads: 15, totalOBVs: 20, totalTasks: 50, hasRevenue: true,
    daysActive: 120, isZenMode: false, hasIntegrations: true,
  });

  it('financial_summary is primary for ops', () => {
    const block = findBlock(getDashboardConfig(ctx), 'financial_summary');
    expect(block?.priority).toBe('primary');
  });

  it('tasks is primary for ops', () => {
    const block = findBlock(getDashboardConfig(ctx), 'tasks');
    expect(block?.priority).toBe('primary');
  });

  it('crm_summary is summary (not full) for ops', () => {
    const block = findBlock(getDashboardConfig(ctx), 'crm_summary');
    expect(block?.depth).toBe('summary');
  });
});

// ── Sidebar ──────────────────────────────────────────────────────────────────

describe('Sidebar config', () => {
  it('Phase 0 solo: minimal sidebar', () => {
    const ctx = makeContext({ phase: 0, teamMode: 'solo', teamSize: 1 });
    const sidebar = getSidebarConfig(ctx);
    const visible = sidebar.items.filter(i => i.visibility === 'visible');
    expect(visible.length).toBeLessThanOrEqual(6);
    expect(visible.map(i => i.id)).toContain('dashboard');
    expect(visible.map(i => i.id)).toContain('startup-os');
  });

  it('Growth Phase 2: financial hidden', () => {
    const ctx = makeContext({ phase: 2, macroRole: 'growth', teamMode: 'team', teamSize: 3 });
    const sidebar = getSidebarConfig(ctx);
    const financiero = sidebar.items.find(i => i.id === 'financiero');
    expect(financiero?.visibility).toBe('hidden');
  });

  it('Solo Phase 1: team items as teaser (not hidden)', () => {
    const ctx = makeContext({ phase: 1, teamMode: 'solo', teamSize: 1 });
    const sidebar = getSidebarConfig(ctx);
    const exploration = sidebar.items.find(i => i.id === 'exploration');
    expect(exploration?.visibility).toBe('teaser');
  });
});
