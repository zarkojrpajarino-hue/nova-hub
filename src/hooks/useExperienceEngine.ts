/**
 * useExperienceEngine — Hook that connects the Experience Engine to React components.
 *
 * Reads project context (phase, role, team, data) and returns the dashboard config.
 * Components consult this hook instead of doing their own `if phase >= 2` checks.
 */

import { useMemo } from 'react';
import {
  getDashboardConfig,
  getSidebarConfig,
  computeDataMaturity,
  resolveMacroRole,
  type ExperienceContext,
  type DashboardConfig,
  type SidebarConfig,
  type DashboardBlock,
  type BlockDepth,
  type BlockPriority,
} from '@/lib/experience-engine';

interface UseExperienceEngineInput {
  projectId: string | undefined;
  phase: number;
  daysActive: number;
  isZenMode: boolean;
  // Role
  specializationRole: string | null;
  isLead: boolean;
  // Team
  teamMode: 'solo' | 'team' | 'hiring';
  teamSize: number;
  // Data
  totalOBVs: number;
  totalLeads: number;
  totalTasks: number;
  hasRevenue: boolean;
  hasIntegrations: boolean;
  kpiCount: number;
  phaseScore: number;
}

interface UseExperienceEngineResult {
  dashboard: DashboardConfig;
  sidebar: SidebarConfig;
  // Convenience helpers
  shouldShow: (block: DashboardBlock) => boolean;
  getDepth: (block: DashboardBlock) => BlockDepth;
  getPriority: (block: DashboardBlock) => BlockPriority;
  getReason: (block: DashboardBlock) => string;
  isPrimary: (block: DashboardBlock) => boolean;
  isHidden: (block: DashboardBlock) => boolean;
  context: ExperienceContext;
}

export function useExperienceEngine(input: UseExperienceEngineInput): UseExperienceEngineResult {
  const context: ExperienceContext = useMemo(() => ({
    phase: input.phase,
    macroRole: resolveMacroRole(input.specializationRole, input.isLead),
    teamMode: input.teamMode,
    dataMaturity: computeDataMaturity({
      totalOBVs: input.totalOBVs,
      totalLeads: input.totalLeads,
      totalTasks: input.totalTasks,
      hasRevenue: input.hasRevenue,
      hasIntegrations: input.hasIntegrations,
      kpiCount: input.kpiCount,
      daysActive: input.daysActive,
    }),
    daysActive: input.daysActive,
    isZenMode: input.isZenMode,
    totalOBVs: input.totalOBVs,
    totalLeads: input.totalLeads,
    totalTasks: input.totalTasks,
    teamSize: input.teamSize,
    hasRevenue: input.hasRevenue,
    hasIntegrations: input.hasIntegrations,
    kpiCount: input.kpiCount,
    phaseSCore: input.phaseScore,
  }), [
    input.phase, input.specializationRole, input.isLead,
    input.teamMode, input.teamSize, input.daysActive, input.isZenMode,
    input.totalOBVs, input.totalLeads, input.totalTasks,
    input.hasRevenue, input.hasIntegrations, input.kpiCount, input.phaseScore,
  ]);

  const dashboard = useMemo(() => getDashboardConfig(context), [context]);
  const sidebar = useMemo(() => getSidebarConfig(context), [context]);

  // Build lookup map for O(1) access
  const blockMap = useMemo(() => {
    const map = new Map<DashboardBlock, { depth: BlockDepth; priority: BlockPriority; reason: string }>();
    for (const list of [dashboard.primary, dashboard.secondary, dashboard.deep, dashboard.hidden]) {
      for (const b of list) {
        map.set(b.block, { depth: b.depth, priority: b.priority, reason: b.reason });
      }
    }
    return map;
  }, [dashboard]);

  const shouldShow = (block: DashboardBlock): boolean => {
    const entry = blockMap.get(block);
    return entry ? entry.depth !== 'hidden' : false;
  };

  const getDepth = (block: DashboardBlock): BlockDepth => {
    return blockMap.get(block)?.depth ?? 'hidden';
  };

  const getPriority = (block: DashboardBlock): BlockPriority => {
    return blockMap.get(block)?.priority ?? 'hidden';
  };

  const getReason = (block: DashboardBlock): string => {
    return blockMap.get(block)?.reason ?? 'Unknown';
  };

  const isPrimary = (block: DashboardBlock): boolean => {
    return getPriority(block) === 'primary';
  };

  const isHidden = (block: DashboardBlock): boolean => {
    return getDepth(block) === 'hidden';
  };

  return {
    dashboard,
    sidebar,
    shouldShow,
    getDepth,
    getPriority,
    getReason,
    isPrimary,
    isHidden,
    context,
  };
}
