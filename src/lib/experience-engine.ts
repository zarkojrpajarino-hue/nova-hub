/**
 * Experience Engine — Decision system for adaptive UX
 *
 * This is the CORE of Optimus-K UX. It decides EXACTLY what each user sees,
 * with what depth, and why. No component renders without consulting this engine.
 *
 * 10 dashboard blocks (not 80 components):
 *   1. NextAction      — What to do now
 *   2. Methodology     — Why (framework + phase)
 *   3. CoreStats       — 4 numbers max
 *   4. PhaseEngine     — Score + hard signal
 *   5. Tasks           — Summary or full
 *   6. OBVs            — Summary or full
 *   7. CRMSummary      — Pipeline or teaser
 *   8. FinancialSummary — Revenue or teaser
 *   9. TeamStatus      — Team or solo
 *   10. Alerts         — Moments + warnings
 *
 * Rules:
 *   - PRIMARY: max 6 blocks above fold
 *   - SECONDARY: max 3 blocks below fold (compact)
 *   - DEEP: everything else (sidebar, tabs, navigation)
 *   - HIDDEN: not rendered at all
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type DashboardBlock =
  | 'next_action'
  | 'methodology'
  | 'core_stats'
  | 'phase_engine'
  | 'tasks'
  | 'obvs'
  | 'crm_summary'
  | 'financial_summary'
  | 'team_status'
  | 'alerts';

export type BlockDepth = 'full' | 'summary' | 'teaser' | 'hidden';
export type BlockPriority = 'primary' | 'secondary' | 'deep' | 'hidden';

export type MacroRole = 'founder' | 'growth' | 'operations';
export type TeamMode = 'solo' | 'team' | 'hiring';

export type DataMaturity = 'empty' | 'minimal' | 'growing' | 'rich';

export interface ExperienceContext {
  phase: number;                    // 0-4
  macroRole: MacroRole;             // founder, growth, operations
  teamMode: TeamMode;               // solo, team, hiring
  dataMaturity: DataMaturity;        // empty, minimal, growing, rich
  daysActive: number;               // days since project creation
  isZenMode: boolean;               // first 7 days, phase < 2
  // Data availability (for transition triggers)
  totalOBVs: number;
  totalLeads: number;
  totalTasks: number;
  teamSize: number;
  hasRevenue: boolean;              // facturacion > 0
  hasIntegrations: boolean;         // integration_connections.length > 0
  kpiCount: number;
  phaseSCore: number;               // 0-100
}

export interface BlockConfig {
  block: DashboardBlock;
  priority: BlockPriority;
  depth: BlockDepth;
  reason: string;                   // Why this decision (for debugging + transparency)
}

export interface DashboardConfig {
  primary: BlockConfig[];           // max 6, above fold
  secondary: BlockConfig[];         // max 3, below fold compact
  deep: BlockConfig[];              // sidebar, tabs, navigation
  hidden: BlockConfig[];            // not rendered
}

// ── Data Maturity Calculator ─────────────────────────────────────────────────

export function computeDataMaturity(ctx: Pick<ExperienceContext, 'totalOBVs' | 'totalLeads' | 'totalTasks' | 'hasRevenue' | 'hasIntegrations' | 'kpiCount' | 'daysActive'>): DataMaturity {
  const score =
    (ctx.totalOBVs >= 5 ? 2 : ctx.totalOBVs >= 1 ? 1 : 0) +
    (ctx.totalLeads >= 10 ? 2 : ctx.totalLeads >= 1 ? 1 : 0) +
    (ctx.totalTasks >= 10 ? 2 : ctx.totalTasks >= 1 ? 1 : 0) +
    (ctx.hasRevenue ? 2 : 0) +
    (ctx.hasIntegrations ? 2 : 0) +
    (ctx.kpiCount >= 3 ? 1 : 0) +
    (ctx.daysActive >= 30 ? 1 : 0);

  if (score === 0) return 'empty';
  if (score <= 3) return 'minimal';
  if (score <= 7) return 'growing';
  return 'rich';
}

// ── Macro Role Resolver ──────────────────────────────────────────────────────

export function resolveMacroRole(specializationRole: string | null, isLead: boolean): MacroRole {
  if (isLead || specializationRole === 'strategy') return 'founder';
  if (specializationRole === 'sales' || specializationRole === 'marketing') return 'growth';
  // operations, finance, ai_tech, null → operations
  return 'operations';
}

// ── Transition Triggers ──────────────────────────────────────────────────────
// These define WHEN a block transitions between depths.
// Each trigger is a pure function: context → boolean

const TRANSITIONS: Record<DashboardBlock, {
  toSummary?: (ctx: ExperienceContext) => boolean;
  toFull?: (ctx: ExperienceContext) => boolean;
}> = {
  next_action: {}, // Always primary, no transitions
  methodology: {}, // Always primary, no transitions
  core_stats: {
    toSummary: (ctx) => ctx.totalOBVs > 0 || ctx.totalTasks > 0 || ctx.teamSize > 1,
  },
  phase_engine: {}, // Always visible
  tasks: {
    toSummary: (ctx) => ctx.totalTasks >= 1,
    toFull: (ctx) => ctx.totalTasks >= 5 && ctx.phase >= 2,
  },
  obvs: {
    toSummary: (ctx) => ctx.totalOBVs >= 1,
    toFull: (ctx) => ctx.totalOBVs >= 3 && ctx.phase >= 1,
  },
  crm_summary: {
    toSummary: (ctx) => ctx.totalLeads >= 1,
    toFull: (ctx) => ctx.totalLeads >= 5 && ctx.phase >= 2,
  },
  financial_summary: {
    toSummary: (ctx) => ctx.hasRevenue,
    toFull: (ctx) => ctx.hasRevenue && ctx.daysActive >= 90 && ctx.phase >= 3,
  },
  team_status: {
    toSummary: (ctx) => ctx.teamSize >= 2 || ctx.teamMode === 'hiring',
    toFull: (ctx) => ctx.teamSize >= 4 && ctx.phase >= 3,
  },
  alerts: {
    toSummary: () => true, // Always at least summary
  },
};

// ── Core Decision Function ───────────────────────────────────────────────────

export function getDashboardConfig(ctx: ExperienceContext): DashboardConfig {
  const blocks = ALL_BLOCKS.map(block => resolveBlock(block, ctx));

  const primary = blocks
    .filter(b => b.priority === 'primary')
    .slice(0, 6); // HARD LIMIT: max 6

  const secondary = blocks
    .filter(b => b.priority === 'secondary')
    .slice(0, 3); // HARD LIMIT: max 3

  const deep = blocks.filter(b => b.priority === 'deep');
  const hidden = blocks.filter(b => b.priority === 'hidden');

  return { primary, secondary, deep, hidden };
}

const ALL_BLOCKS: DashboardBlock[] = [
  'next_action',
  'methodology',
  'core_stats',
  'phase_engine',
  'tasks',
  'obvs',
  'crm_summary',
  'financial_summary',
  'team_status',
  'alerts',
];

// ── Block Resolution (the actual decisions) ──────────────────────────────────

function resolveBlock(block: DashboardBlock, ctx: ExperienceContext): BlockConfig {
  const depth = resolveDepth(block, ctx);
  const priority = resolvePriority(block, ctx, depth);
  const reason = explainDecision(block, ctx, depth, priority);

  return { block, priority, depth, reason };
}

function resolveDepth(block: DashboardBlock, ctx: ExperienceContext): BlockDepth {
  // Zen mode overrides: only essential blocks
  if (ctx.isZenMode) {
    const zenVisible: DashboardBlock[] = ['next_action', 'methodology', 'phase_engine', 'alerts'];
    if (!zenVisible.includes(block)) return 'hidden';
  }

  // Role-based hiding: Growth doesn't see financial, Ops doesn't see CRM full
  if (ctx.macroRole === 'growth' && block === 'financial_summary') {
    if (ctx.phase < 3) return 'hidden';
    return 'teaser'; // Growth sees financial as teaser in Phase 3+
  }
  if (ctx.macroRole === 'operations' && block === 'crm_summary') {
    if (ctx.phase < 3) return 'hidden';
    return 'summary'; // Ops sees CRM as summary in Phase 3+
  }

  // Phase-based gating
  const phaseGates: Partial<Record<DashboardBlock, number>> = {
    crm_summary: 1,        // CRM available from Phase 1
    financial_summary: 2,   // Financial available from Phase 2
    team_status: 0,         // Always available (adapts by teamMode)
  };

  const minPhase = phaseGates[block];
  if (minPhase !== undefined && ctx.phase < minPhase) return 'teaser';

  // Transition triggers: teaser → summary → full
  const triggers = TRANSITIONS[block];
  if (triggers?.toFull?.(ctx)) return 'full';
  if (triggers?.toSummary?.(ctx)) return 'summary';

  // Defaults by phase
  if (ctx.phase <= 1) return 'summary';
  return 'full';
}

function resolvePriority(block: DashboardBlock, ctx: ExperienceContext, depth: BlockDepth): BlockPriority {
  if (depth === 'hidden') return 'hidden';
  if (depth === 'teaser') return 'deep'; // Teasers go to sidebar/deep

  // Always primary (never demoted)
  const alwaysPrimary: DashboardBlock[] = ['next_action', 'methodology'];
  if (alwaysPrimary.includes(block)) return 'primary';

  // Phase engine: primary in Phase 0-1 (user needs to understand), secondary later
  if (block === 'phase_engine') {
    return ctx.phase <= 1 ? 'primary' : 'secondary';
  }

  // Alerts: primary if there are active warnings, secondary otherwise
  if (block === 'alerts') return 'secondary';

  // Core stats: primary if data exists, hidden if empty
  if (block === 'core_stats') {
    return depth !== 'hidden' ? 'primary' : 'hidden';
  }

  // Role-specific primary blocks
  if (ctx.macroRole === 'growth') {
    if (block === 'crm_summary' && depth === 'full') return 'primary';
    if (block === 'obvs' && ctx.phase >= 2) return 'secondary';
  }
  if (ctx.macroRole === 'operations') {
    if (block === 'tasks' && depth === 'full') return 'primary';
    if (block === 'financial_summary' && depth !== 'hidden') return 'primary';
  }
  if (ctx.macroRole === 'founder') {
    // Founder: phase determines what's primary
    if (ctx.phase <= 1 && (block === 'obvs' || block === 'tasks')) return 'primary';
    if (ctx.phase >= 2 && block === 'crm_summary' && depth !== 'hidden') return 'primary';
    if (ctx.phase >= 3 && block === 'financial_summary' && depth !== 'hidden') return 'primary';
  }

  // Team status: primary only if team exists or hiring
  if (block === 'team_status') {
    if (ctx.teamMode === 'solo' && ctx.teamSize <= 1) return 'deep';
    if (ctx.teamSize >= 2) return 'secondary';
    return 'deep';
  }

  // Default: secondary
  return 'secondary';
}

function explainDecision(block: DashboardBlock, ctx: ExperienceContext, depth: BlockDepth, priority: BlockPriority): string {
  if (depth === 'hidden' && ctx.isZenMode) return 'Hidden by Zen Mode (first 7 days, simplify)';
  if (depth === 'hidden') return `Hidden: not relevant for ${ctx.macroRole} in Phase ${ctx.phase}`;
  if (depth === 'teaser') return `Teaser: available in Phase ${getUnlockPhase(block)}`;
  if (priority === 'primary') return `Primary: core for ${ctx.macroRole} in Phase ${ctx.phase}`;
  if (priority === 'secondary') return `Secondary: useful but not the focus now`;
  return `Deep: accessible via navigation`;
}

function getUnlockPhase(block: DashboardBlock): number {
  const gates: Partial<Record<DashboardBlock, number>> = {
    crm_summary: 1,
    financial_summary: 2,
    team_status: 1,
  };
  return gates[block] ?? 0;
}

// ── Sidebar Decision ─────────────────────────────────────────────────────────

export type SidebarItemVisibility = 'visible' | 'teaser' | 'hidden';

export interface SidebarConfig {
  items: Array<{
    id: string;
    visibility: SidebarItemVisibility;
    reason: string;
  }>;
}

export function getSidebarConfig(ctx: ExperienceContext): SidebarConfig {
  // Import from phase-features.ts SIDEBAR_PHASE_CONFIG at runtime
  // This function adds ROLE filtering on top of phase filtering
  const items = SIDEBAR_ITEMS.map(id => {
    const phaseVisibility = getPhaseVisibility(id, ctx.phase);

    // Role override: hide items not relevant to role
    if (ctx.macroRole === 'growth') {
      if (['financiero', 'mi-desarrollo', 'mi-modelo'].includes(id) && ctx.phase < 3) {
        return { id, visibility: 'hidden' as SidebarItemVisibility, reason: 'Not relevant for Growth role' };
      }
    }
    if (ctx.macroRole === 'operations') {
      if (['crm', 'exploration', 'rankings'].includes(id) && ctx.phase < 3) {
        return { id, visibility: 'hidden' as SidebarItemVisibility, reason: 'Not relevant for Operations role' };
      }
    }

    // Team section: show as teaser for solo founders (not hidden)
    if (TEAM_ITEMS.includes(id) && ctx.teamMode === 'solo' && ctx.teamSize <= 1) {
      if (ctx.phase >= 1) {
        return { id, visibility: 'teaser' as SidebarItemVisibility, reason: 'Invite team to unlock' };
      }
      return { id, visibility: 'hidden' as SidebarItemVisibility, reason: 'Solo mode, Phase 0' };
    }

    return { id, visibility: phaseVisibility, reason: `Phase ${ctx.phase} config` };
  });

  return { items };
}

function getPhaseVisibility(id: string, phase: number): SidebarItemVisibility {
  // Simplified version — in production, reads from SIDEBAR_PHASE_CONFIG
  const alwaysVisible = ['dashboard', 'settings', 'notificaciones', 'startup-os'];
  if (alwaysVisible.includes(id)) return 'visible';

  const phase1 = ['mi-espacio', 'proyectos', 'validaciones', 'obvs', 'crm', 'kpis'];
  if (phase1.includes(id)) return phase >= 1 ? 'visible' : 'hidden';

  const phase2 = ['financiero', 'mi-modelo', 'integrations'];
  if (phase2.includes(id)) {
    if (phase >= 2) return 'visible';
    if (phase >= 1) return 'teaser';
    return 'hidden';
  }

  const phase3 = ['meetings', 'analisis-ia', 'toolkit', 'exploration', 'rankings', 'analytics', 'team-performance', 'mi-desarrollo'];
  if (phase3.includes(id)) {
    if (phase >= 3) return 'visible';
    if (phase >= 2) return 'teaser';
    return 'hidden';
  }

  const phase4 = ['path-to-master', 'masters', 'rotacion'];
  if (phase4.includes(id)) return phase >= 4 ? 'visible' : 'hidden';

  return 'visible';
}

const SIDEBAR_ITEMS = [
  'dashboard', 'mi-espacio', 'mi-desarrollo', 'mi-modelo',
  'proyectos', 'validaciones', 'obvs',
  'startup-os', 'crm', 'financiero', 'meetings', 'analisis-ia', 'toolkit',
  'exploration', 'path-to-master', 'rankings', 'masters', 'rotacion',
  'kpis', 'analytics', 'team-performance',
  'settings', 'integrations', 'notificaciones',
];

const TEAM_ITEMS = ['exploration', 'path-to-master', 'rankings', 'masters', 'rotacion'];
