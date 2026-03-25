/**
 * DashboardAdapter — Maps Experience Engine blocks to actual React components.
 *
 * This is the ONLY place where engine decisions become rendered components.
 * No `if phase >= 2` or `if role === 'growth'` anywhere else in the dashboard.
 *
 * Architecture:
 *   Engine (pure logic) → Hook (React bridge) → Adapter (component mapping) → UI
 *
 * Debug mode: set localStorage 'optimus_debug_engine' = 'true' to see decisions.
 */

import { type ReactNode } from 'react';
import { useExperienceEngine } from '@/hooks/useExperienceEngine';
import type { DashboardBlock, BlockDepth } from '@/lib/experience-engine';

// ── Types ────────────────────────────────────────────────────────────────────

interface BlockRenderer {
  block: DashboardBlock;
  render: (depth: BlockDepth) => ReactNode;
}

interface DashboardAdapterProps {
  // Engine inputs
  phase: number;
  daysActive: number;
  isZenMode: boolean;
  specializationRole: string | null;
  isLead: boolean;
  teamMode: 'solo' | 'team' | 'hiring';
  teamSize: number;
  totalOBVs: number;
  totalLeads: number;
  totalTasks: number;
  hasRevenue: boolean;
  hasIntegrations: boolean;
  kpiCount: number;
  phaseScore: number;
  projectId: string;
  // Block renderers (provided by parent)
  renderers: BlockRenderer[];
}

// ── Debug overlay ────────────────────────────────────────────────────────────

function DebugBadge({ block, depth, priority, reason }: {
  block: string; depth: string; priority: string; reason: string;
}) {
  const isDebug = typeof window !== 'undefined' &&
    localStorage.getItem('optimus_debug_engine') === 'true';
  if (!isDebug) return null;

  const colors: Record<string, string> = {
    primary: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    secondary: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    deep: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    hidden: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className={`text-[10px] font-mono px-2 py-1 rounded border mb-1 ${colors[priority] || colors.deep}`}>
      [{block}] {priority}/{depth} — {reason}
    </div>
  );
}

// ── Adapter Component ────────────────────────────────────────────────────────

export function DashboardAdapter({
  phase, daysActive, isZenMode, specializationRole, isLead,
  teamMode, teamSize, totalOBVs, totalLeads, totalTasks,
  hasRevenue, hasIntegrations, kpiCount, phaseScore, projectId,
  renderers,
}: DashboardAdapterProps) {
  const engine = useExperienceEngine({
    projectId,
    phase,
    daysActive,
    isZenMode,
    specializationRole,
    isLead,
    teamMode,
    teamSize,
    totalOBVs,
    totalLeads,
    totalTasks,
    hasRevenue,
    hasIntegrations,
    kpiCount,
    phaseScore,
  });

  const rendererMap = new Map(renderers.map(r => [r.block, r.render]));

  const renderBlock = (block: DashboardBlock): ReactNode => {
    if (engine.isHidden(block)) return null;

    const render = rendererMap.get(block);
    if (!render) return null;

    const depth = engine.getDepth(block);
    const content = render(depth);
    if (!content) return null; // Don't render wrapper div for empty content

    const priority = engine.getPriority(block);
    const reason = engine.getReason(block);

    return (
      <div key={block} data-engine-block={block} data-engine-priority={priority} data-engine-depth={depth}>
        <DebugBadge block={block} depth={depth} priority={priority} reason={reason} />
        {content}
      </div>
    );
  };

  return (
    <>
      {/* PRIMARY: above fold, max 6 */}
      <div className="space-y-6">
        {engine.dashboard.primary.map(b => renderBlock(b.block))}
      </div>

      {/* SECONDARY: below fold, compact, max 3 */}
      {engine.dashboard.secondary.length > 0 && (
        <div className="space-y-4 mt-6">
          {engine.dashboard.secondary.map(b => renderBlock(b.block))}
        </div>
      )}

      {/* DEEP: accessible but not prominent */}
      {engine.dashboard.deep.length > 0 && (
        <div className="space-y-4 mt-6 opacity-90">
          {engine.dashboard.deep.map(b => renderBlock(b.block))}
        </div>
      )}
    </>
  );
}
