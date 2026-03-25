/**
 * Experience Engine — 3 Critical Scenario Verification
 *
 * These tests simulate EXACTLY what the UI renders and verify:
 * 1. Max 6 primary blocks
 * 2. Nothing irrelevant sneaks in
 * 3. Depth is correct (full/summary/teaser)
 * 4. Legacy blocks don't contradict the engine
 */

import { describe, it, expect } from 'vitest';
import { getDashboardConfig, type ExperienceContext, type DashboardBlock } from '../experience-engine';

function makeCtx(overrides: Partial<ExperienceContext> = {}): ExperienceContext {
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

function getAllBlocks(config: ReturnType<typeof getDashboardConfig>) {
  return [...config.primary, ...config.secondary, ...config.deep, ...config.hidden];
}

function getBlock(config: ReturnType<typeof getDashboardConfig>, block: DashboardBlock) {
  return getAllBlocks(config).find(b => b.block === block);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1: Founder · Phase 1 · Solo · Week 2
// ═══════════════════════════════════════════════════════════════════════════════

describe('SCENARIO 1: Founder P1 Solo', () => {
  const ctx = makeCtx();
  const config = getDashboardConfig(ctx);

  // CHECK 1: Max 6 primary
  it('has at most 6 primary blocks', () => {
    expect(config.primary.length).toBeLessThanOrEqual(6);
    expect(config.primary.length).toBeGreaterThanOrEqual(3); // at least 3 meaningful
  });

  // CHECK 2: Nothing irrelevant sneaks in
  it('financial_summary is NOT primary (no revenue)', () => {
    const block = getBlock(config, 'financial_summary');
    expect(block?.priority).not.toBe('primary');
    expect(block?.depth).toBe('teaser'); // Phase 1, no revenue
  });

  it('crm_summary is NOT primary (0 leads)', () => {
    const block = getBlock(config, 'crm_summary');
    expect(block?.priority).not.toBe('primary');
  });

  it('team_status is deep (solo mode, 1 person)', () => {
    const block = getBlock(config, 'team_status');
    expect(block?.priority).toBe('deep');
  });

  // CHECK 3: Depth correct
  it('next_action is primary with non-hidden depth', () => {
    const block = getBlock(config, 'next_action');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).not.toBe('hidden');
  });

  it('core_stats is summary (has OBVs)', () => {
    const block = getBlock(config, 'core_stats');
    expect(block?.depth).toBe('summary');
  });

  it('phase_engine is primary in Phase 1', () => {
    const block = getBlock(config, 'phase_engine');
    expect(block?.priority).toBe('primary');
  });

  it('obvs is primary for founder Phase 1', () => {
    const block = getBlock(config, 'obvs');
    expect(block?.priority).toBe('primary');
  });

  // CHECK 4: No legacy contradictions
  it('all 10 blocks are accounted for (none missing)', () => {
    const allBlocks = getAllBlocks(config);
    expect(allBlocks.length).toBe(10);
    const blockNames = allBlocks.map(b => b.block);
    expect(blockNames).toContain('next_action');
    expect(blockNames).toContain('methodology');
    expect(blockNames).toContain('core_stats');
    expect(blockNames).toContain('phase_engine');
    expect(blockNames).toContain('tasks');
    expect(blockNames).toContain('obvs');
    expect(blockNames).toContain('crm_summary');
    expect(blockNames).toContain('financial_summary');
    expect(blockNames).toContain('team_status');
    expect(blockNames).toContain('alerts');
  });

  // LEGACY CHECK: things that SHOULD be hidden in this scenario
  it('no financial stats should be visible (Phase 1, no revenue)', () => {
    const financial = getBlock(config, 'financial_summary');
    expect(financial?.depth).toBe('teaser');
    expect(financial?.priority).toBe('deep'); // teasers go to deep
  });

  // SUMMARY: what Founder P1 Solo sees
  it('primary blocks are exactly the right ones', () => {
    const primaryNames = config.primary.map(b => b.block);
    expect(primaryNames).toContain('next_action');
    expect(primaryNames).toContain('methodology');
    expect(primaryNames).toContain('core_stats');
    expect(primaryNames).toContain('phase_engine');
    // OBVs and Tasks are primary for founder P1
    expect(primaryNames).toContain('obvs');
    expect(primaryNames).toContain('tasks');
    // CRM and Financial should NOT be primary
    expect(primaryNames).not.toContain('crm_summary');
    expect(primaryNames).not.toContain('financial_summary');
    expect(primaryNames).not.toContain('team_status');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 2: Founder · Phase 2 · Rich Data
// ═══════════════════════════════════════════════════════════════════════════════

describe('SCENARIO 2: Founder P2 Rich', () => {
  const ctx = makeCtx({
    phase: 2,
    daysActive: 60,
    totalOBVs: 10,
    totalLeads: 15,
    totalTasks: 25,
    hasRevenue: true,
    hasIntegrations: true,
    kpiCount: 3,
    phaseSCore: 72,
  });
  const config = getDashboardConfig(ctx);

  // CHECK 1: Max 6 primary
  it('has at most 6 primary blocks', () => {
    expect(config.primary.length).toBeLessThanOrEqual(6);
  });

  // CHECK 2: CRM is now primary (15 leads = full)
  it('crm_summary is primary with full depth', () => {
    const block = getBlock(config, 'crm_summary');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).toBe('full');
  });

  // CHECK 3: Financial is summary (revenue but < 90 days)
  it('financial_summary is summary depth (revenue, 60 days)', () => {
    const block = getBlock(config, 'financial_summary');
    expect(block?.depth).toBe('summary');
  });

  it('financial_summary is secondary or primary (not hidden)', () => {
    const block = getBlock(config, 'financial_summary');
    expect(block?.priority).not.toBe('hidden');
    // Financial in Phase 2 for founder = primary (has revenue, growing)
  });

  // CHECK: Phase engine is secondary in Phase 2
  it('phase_engine is secondary in Phase 2', () => {
    const block = getBlock(config, 'phase_engine');
    expect(block?.priority).toBe('secondary');
  });

  // CHECK: Team status is deep (solo)
  it('team_status is deep (still solo)', () => {
    const block = getBlock(config, 'team_status');
    expect(block?.priority).toBe('deep');
  });

  // CHECK: core_stats shows data (OBVs, leads, revenue)
  it('core_stats is summary or full (has rich data)', () => {
    const block = getBlock(config, 'core_stats');
    expect(['summary', 'full']).toContain(block?.depth);
    expect(block?.priority).toBe('primary');
  });

  // No legacy contradictions: all blocks present
  it('all 10 blocks accounted for', () => {
    expect(getAllBlocks(config).length).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3: Growth · Phase 2
// ═══════════════════════════════════════════════════════════════════════════════

describe('SCENARIO 3: Growth P2', () => {
  const ctx = makeCtx({
    phase: 2,
    macroRole: 'growth',
    teamMode: 'team',
    teamSize: 3,
    daysActive: 45,
    totalLeads: 8,
    totalOBVs: 5,
    totalTasks: 15,
    hasRevenue: true,
    kpiCount: 2,
    phaseSCore: 55,
  });
  const config = getDashboardConfig(ctx);

  // CHECK 1: Max 6 primary
  it('has at most 6 primary blocks', () => {
    expect(config.primary.length).toBeLessThanOrEqual(6);
  });

  // CHECK 2: CRM is primary for Growth
  it('crm_summary is primary for growth role', () => {
    const block = getBlock(config, 'crm_summary');
    expect(block?.priority).toBe('primary');
    expect(block?.depth).toBe('full'); // 8 leads = full
  });

  // CHECK 3: Financial is HIDDEN for Growth in Phase 2
  it('financial_summary is hidden for growth (not their domain)', () => {
    const block = getBlock(config, 'financial_summary');
    expect(block?.depth).toBe('hidden');
    expect(block?.priority).toBe('hidden');
  });

  // CHECK: Growth doesn't see financial stats
  it('financial block nowhere in primary or secondary', () => {
    const visible = [...config.primary, ...config.secondary];
    const financialVisible = visible.find(b => b.block === 'financial_summary');
    expect(financialVisible).toBeUndefined();
  });

  // CHECK: team_status visible (in a team) but may overflow to deep due to 3-secondary limit
  it('team_status has summary depth (team of 3) and is not hidden', () => {
    const block = getBlock(config, 'team_status');
    expect(block?.depth).toBe('summary');
    // Priority may be 'secondary' or 'deep' (overflow from secondary limit of 3)
    expect(['secondary', 'deep']).toContain(block?.priority);
  });

  // No legacy contradictions
  it('all 10 blocks accounted for', () => {
    expect(getAllBlocks(config).length).toBe(10);
  });

  // CRITICAL: Growth should NOT see founder-only blocks as primary
  it('phase_engine is secondary (not growth primary concern)', () => {
    const block = getBlock(config, 'phase_engine');
    expect(block?.priority).toBe('secondary');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-SCENARIO: Verify display budget limits
// ═══════════════════════════════════════════════════════════════════════════════

describe('Display Budget Limits (all scenarios)', () => {
  const scenarios: Array<{ name: string; ctx: ExperienceContext }> = [
    { name: 'Founder P0 Zen', ctx: makeCtx({ phase: 0, isZenMode: true, totalOBVs: 0, totalTasks: 0 }) },
    { name: 'Founder P1 Solo', ctx: makeCtx() },
    { name: 'Founder P2 Rich', ctx: makeCtx({ phase: 2, totalLeads: 15, totalOBVs: 10, hasRevenue: true, daysActive: 60 }) },
    { name: 'Growth P2', ctx: makeCtx({ phase: 2, macroRole: 'growth', teamMode: 'team', teamSize: 3, totalLeads: 8 }) },
    { name: 'Ops P3', ctx: makeCtx({ phase: 3, macroRole: 'operations', teamMode: 'team', teamSize: 4, hasRevenue: true, totalTasks: 50, daysActive: 120 }) },
    { name: 'Founder P4 Graduated', ctx: makeCtx({ phase: 4, teamMode: 'team', teamSize: 5, hasRevenue: true, totalLeads: 50, totalOBVs: 30, totalTasks: 100, daysActive: 270, hasIntegrations: true }) },
  ];

  for (const { name, ctx } of scenarios) {
    it(`${name}: max 6 primary, max 3 secondary`, () => {
      const config = getDashboardConfig(ctx);
      expect(config.primary.length).toBeLessThanOrEqual(6);
      expect(config.secondary.length).toBeLessThanOrEqual(3);
    });

    it(`${name}: all 10 blocks present`, () => {
      const config = getDashboardConfig(ctx);
      expect(getAllBlocks(config).length).toBe(10);
    });

    it(`${name}: no block has undefined depth`, () => {
      const config = getDashboardConfig(ctx);
      for (const block of getAllBlocks(config)) {
        expect(block.depth).toBeDefined();
        expect(['full', 'summary', 'teaser', 'hidden']).toContain(block.depth);
      }
    });

    it(`${name}: every block has a reason`, () => {
      const config = getDashboardConfig(ctx);
      for (const block of getAllBlocks(config)) {
        expect(block.reason).toBeTruthy();
        expect(block.reason.length).toBeGreaterThan(5);
      }
    });
  }
});
