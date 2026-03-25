/**
 * DASHBOARD VIEW - Enterprise Edition
 *
 * Vista principal que consolida métricas de toda la organización.
 * Engine-governed cockpit (top) + legacy team widgets (bottom).
 */

import { useMemo, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Loader2, AlertTriangle, CheckCircle2, Calendar, CheckSquare, Plus, Sparkles, ShoppingCart, ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useMemberStats, useObjectives, useProjectEngineData, useProjectViabilityState, useProjectFunctions } from '@/hooks/useNovaDataOptimized';
import { useProjectStats } from '@/hooks/useProjects';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { usePhaseFeatures } from '@/hooks/usePhaseFeatures';
import type { PhaseStatKey } from '@/lib/phase-features';
// S5.2 — Lazy load chart components (recharts is heavy)
const WeeklyEvolutionChart = lazy(() =>
  import('@/components/dashboard/WeeklyEvolutionChart').then(m => ({ default: m.WeeklyEvolutionChart }))
);
import { TopRankingsWidget } from '@/components/dashboard/TopRankingsWidget';
// RecentActivityFeed removed — V4.4.13 (queryFn returns [] always, activity_log table does not exist)
import { PendingValidationsWidget } from '@/components/dashboard/PendingValidationsWidget';
import { SmartAlertsWidget } from '@/components/dashboard/SmartAlertsWidget';
import { EmptyStateDashboard } from '@/components/dashboard/EmptyStateDashboard';
import { HelpWidget } from '@/components/ui/section-help';
import { DashboardPreviewModal } from '@/components/preview/DashboardPreviewModal';
import { OnboardingProgressBanner } from '@/components/onboarding/OnboardingProgressBanner';
import { RegenerationTriggersWidget } from '@/components/onboarding/RegenerationTriggersWidget';
import { GamificationWidget } from '@/components/onboarding/GamificationWidget';
import { OsWindow } from '@/components/ui/os-window';
import { supabase } from '@/integrations/supabase/client';

// ── Experience Engine imports ──
import { DashboardAdapter } from '@/components/project/DashboardAdapter';
import type { BlockDepth } from '@/lib/experience-engine';
import { resolveMacroRole } from '@/lib/experience-engine';
import { PHASE_METHODOLOGY, PHASE_LABELS, PHASE_DESCRIPTIONS } from '@/lib/engine';
import { NextActionFocusBlock } from '@/components/project/NextActionFocusBlock';
// MomentBanner removed — methodology block now shows phase methodology inline
import { ProjectEnginePanel } from '@/components/project/ProjectEnginePanel';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { AICallsNudge } from '@/components/subscription/AICallsNudge';
import { LeadConversionInsights } from '@/components/project/LeadConversionInsights';
import { TeamRecommendation } from '@/components/project/TeamRecommendation';

import { useTranslation } from 'react-i18next';
interface DashboardViewProps {
  onNewOBV?: () => void;
}

export function DashboardView({ onNewOBV }: DashboardViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<{ progress: number; fastStartCompleted: boolean; deepSetupSections: string[]; onboardingType: string } | null>(null);
  const [userId, setUserId] = useState<string>('');
  // V5.4.9 — Revenue confirmation banner for existing/scale businesses
  const [showRevenueBanner, setShowRevenueBanner] = useState(false);
  const { data: members = [], isLoading: loadingMembers } = useMemberStats();
  const { data: objectives = [] } = useObjectives();
  const { data: projectStats } = useProjectStats(projectId);

  // Load onboarding progress and user ID
  useEffect(() => {
    const loadOnboardingProgress = async () => {
      if (!projectId) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      const { data: project } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();

      const od = project?.onboarding_data as Record<string, unknown> | null;
      if (od?.fast_start_completed) {
        setOnboardingProgress({
          progress: (od?.onboarding_progress as number) || 25,
          fastStartCompleted: (od?.fast_start_completed as boolean) || false,
          deepSetupSections: (od?.deep_setup_sections as string[]) || [],
          onboardingType: (od?.onboarding_type as string) || 'idea',
        });

        // V5.4.9 — Check if existing/scale business needs revenue OBV confirmation
        const obType = od?.onboarding_type as string | undefined;
        if (obType === 'existing') {
          const faseA = od?.fase_a_answers as Record<string, unknown> | undefined;
          if (faseA?.generates_revenue) {
            // Check if user has at least 1 OBV of type venta
            const { count } = await supabase
              .from('obvs')
              .select('id', { count: 'exact', head: true })
              .eq('project_id', projectId)
              .eq('tipo', 'venta');
            if (count === 0) {
              setShowRevenueBanner(true);
            }
          }
        }
      }
    };

    loadOnboardingProgress();
  }, [projectId]);

  // ── Experience Engine data ────────────────────────────────────────────────
  // Project fetch — separate queries to avoid RLS join failures
  const { data: project } = useQuery({
    queryKey: ['project-basic', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nombre, created_at, created_by, onboarding_data, onboarding_completed, tipo')
        .eq('id', projectId!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        nombre: string;
        created_at: string;
        created_by: string | null;
        onboarding_data: Record<string, unknown> | null;
        onboarding_completed: boolean;
        tipo: string;
      } | null;
    },
    staleTime: 2 * 60_000,
    enabled: !!projectId,
  });
  const { data: engineData, isLoading: engineLoading } = useProjectEngineData(projectId);
  // Use phase from engineData (same query, no duplication, same RLS path)
  const currentPhase = engineData?.phaseState?.current_phase ?? 0;
  const { data: viabilityData } = useProjectViabilityState(projectId);
  const { data: functionOwners } = useProjectFunctions(projectId);
  const { permissions: rolePermissions } = useRolePermissions(projectId);
  const phaseFeatures = usePhaseFeatures(projectId);
  const phaseStats = phaseFeatures.getPhaseStats();
  const macroRole = useMemo(
    () => resolveMacroRole(rolePermissions.role, rolePermissions.isLead),
    [rolePermissions.role, rolePermissions.isLead],
  );

  // daysActive only meaningful when project is loaded (avoids zen mode flash with daysActive=0)
  const daysActive = project?.created_at
    ? Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86400000)
    : -1; // -1 = unknown (project not loaded yet)
  const [zenDismissed, setZenDismissed] = useState(false);
  useEffect(() => {
    if (!projectId) return;
    try { setZenDismissed(JSON.parse(localStorage.getItem(`zen_dismissed_${projectId}`) || 'false')); }
    catch { /* ignore */ }
  }, [projectId]);
  const isZenMode = !zenDismissed && daysActive >= 0 && daysActive < 7 && currentPhase < 2;

  // Minimal count queries (head-only, no full data)
  // Count OBVs as leads proxy (no separate leads table — CRM uses obvs with pipeline_status)
  const { data: leadsCount = 0 } = useQuery({
    queryKey: ['obvs-count', projectId],
    queryFn: async () => {
      const { count } = await supabase
        .from('obvs')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!);
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!projectId,
  });

  const { data: activeIntegrationsCount = 0 } = useQuery({
    queryKey: ['integration-connections-count', projectId],
    queryFn: async () => {
      const { count } = await supabase
        .from('integration_connections')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .eq('status', 'active');
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!projectId,
  });

  // Roles + member IDs from project_members (not useMemberStats which has RLS issues)
  const { data: projectMembersData = [] } = useQuery({
    queryKey: ['project-members-basic', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_members')
        .select('member_id, role')
        .eq('project_id', projectId!);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
    enabled: !!projectId,
  });
  const memberIds = useMemo(() => projectMembersData.map(m => m.member_id), [projectMembersData]);
  const memberRoles = useMemo(() => projectMembersData.filter(m => m.role).map(m => m.role as string), [projectMembersData]);

  const { data: kpiCount = 0 } = useQuery({
    queryKey: ['kpi-count', projectId, memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return 0;
      const { count } = await supabase
        .from('kpis')
        .select('id', { count: 'exact', head: true })
        .in('owner_id', memberIds);
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!projectId && memberIds.length > 0,
  });

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const { data: tasksCompletedWeekly = 0 } = useQuery({
    queryKey: ['tasks-completed-weekly', projectId, weekStart],
    queryFn: async () => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .eq('status', 'done')
        .gte('updated_at', weekStart);
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!projectId,
  });

  const resolvedTeamMode = (() => {
    const onboardingTeamMode = project?.onboarding_data?.team_mode;
    if (onboardingTeamMode === 'hiring') return 'hiring' as const;
    if (onboardingTeamMode === 'team' || members.length > 1) return 'team' as const;
    return 'solo' as const;
  })();

  // Translate engine tab names to real routes
  const handleNavigateToTab = useCallback((tab: string) => {
    if (!projectId) return;
    const routeMap: Record<string, string> = {
      obvs: 'obvs', crm: 'crm', financiero: 'financiero', tareas: 'startup-os',
      equipo: 'exploration', 'negocio-ia': 'analisis-ia', meetings: 'meetings',
    };
    navigate(`/proyecto/${projectId}/${routeMap[tab] || tab}`);
  }, [projectId, navigate]);

  // Map objectives to easily accessible format
  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      obvs: 150, lps: 18, bps: 66, cps: 40, facturacion: 15000, margen: 7500,
    };
    objectives.forEach(obj => { map[obj.name] = obj.target_value; });
    return map;
  }, [objectives]);

  const totals = useMemo(() => {
    return members.reduce((acc, m) => ({
      obvs: acc.obvs + (Number(m.obvs) || 0),
      lps: acc.lps + (Number(m.lps) || 0),
      bps: acc.bps + (Number(m.bps) || 0),
      cps: acc.cps + (Number(m.cps) || 0),
      facturacion: acc.facturacion + (Number(m.facturacion) || 0),
      margen: acc.margen + (Number(m.margen) || 0),
    }), { obvs: 0, lps: 0, bps: 0, cps: 0, facturacion: 0, margen: 0 });
  }, [members]);

  // ── Engine block renderers ──────────────────────────────────────────────
  const engineRenderers = useMemo(() => [
    {
      block: 'next_action' as const,
      render: (_depth: BlockDepth) => projectId ? (
        <NextActionFocusBlock projectId={projectId} onNavigateToTab={handleNavigateToTab} />
      ) : null,
    },
    {
      block: 'methodology' as const,
      render: (_depth: BlockDepth) => {
        // Wait for engineData to resolve the real phase (avoids showing phase 0 on load)
        const phase = engineData?.phaseState?.current_phase ?? null;
        if (phase === null) return null; // Loading — don't show wrong methodology
        const methodology = PHASE_METHODOLOGY[phase] || PHASE_METHODOLOGY[0];
        const phaseLabel = PHASE_LABELS[phase] || PHASE_LABELS[0];
        const phaseDesc = PHASE_DESCRIPTIONS[phase] || PHASE_DESCRIPTIONS[0];
        return (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t('project.methodologyLabel')}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {phaseLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">{methodology}</p>
            <p className="text-xs text-muted-foreground">{phaseDesc}</p>
          </div>
        );
      },
    },
    {
      block: 'core_stats' as const,
      render: () => null, // Rendered directly below as CoreStatsBlock (avoids re-render loops)
    },
    {
      block: 'phase_engine' as const,
      render: (_depth: BlockDepth) => projectId ? (
        <ProjectEnginePanel
          projectId={projectId}
          engineData={engineData}
          isLoading={engineLoading}
          viabilityStatus={viabilityData?.viability_status}
          functionOwners={functionOwners}
          fastStartCompleted={project?.onboarding_data?.fast_start_completed === true}
          onNavigateToOnboarding={() => navigate(`/onboarding/${projectId}`)}
          onAction={(actionType: string) => {
            if (actionType === 'create_obv') handleNavigateToTab('obvs');
            else if (actionType === 'add_metrics') handleNavigateToTab('financiero');
            else if (actionType === 'create_task') handleNavigateToTab('tareas');
          }}
        />
      ) : null,
    },
    {
      block: 'alerts' as const,
      render: () => null, // TrialCountdownBanner + AICallsNudge render null when inactive → avoid empty wrapper
    },
    {
      block: 'crm_summary' as const,
      render: (depth: BlockDepth) => {
        if (!projectId) return null;
        if (depth === 'teaser') return (
          <div className="p-4 rounded-2xl bg-card/50 opacity-60">
            <p className="text-sm text-muted-foreground">{t('project.crmUnlocksWithLeads')}</p>
          </div>
        );
        return <LeadConversionInsights projectId={projectId} />;
      },
    },
    {
      block: 'financial_summary' as const,
      render: (depth: BlockDepth) => {
        if (depth === 'teaser') return (
          <div className="p-4 rounded-2xl bg-card/50 opacity-60">
            <p className="text-sm text-muted-foreground">{t('project.financialUnlocksWithRevenue')}</p>
          </div>
        );
        if (depth === 'summary') return (
          <div className="p-4 rounded-2xl bg-card">
            <p className="text-sm font-medium">{t('project.facturación')}: €{totals.facturacion}</p>
          </div>
        );
        return null;
      },
    },
    {
      block: 'team_status' as const,
      render: (depth: BlockDepth) => {
        if (!projectId || depth === 'teaser') return null;
        return (
          <TeamRecommendation
            projectId={projectId}
            currentPhase={currentPhase}
            teamSize={members.length}
            existingRoles={memberRoles}
          />
        );
      },
    },
    { block: 'obvs' as const, render: (_depth: BlockDepth) => null },
    { block: 'tasks' as const, render: (_depth: BlockDepth) => null },
  ], [projectId, currentPhase, members, totals, leadsCount, daysActive, isZenMode, tasksCompletedWeekly, engineData, engineLoading, viabilityData, functionOwners, project, projectStats, memberRoles, phaseStats, handleNavigateToTab, navigate, t]);

  // Team objectives (calculated from individual targets)
  const teamObjectives = {
    obvs: objectivesMap.obvs * Math.max(members.length, 1),
    lps: objectivesMap.lps * Math.max(members.length, 1),
    bps: objectivesMap.bps * Math.max(members.length, 1),
    cps: objectivesMap.cps * Math.max(members.length, 1),
    facturacion: objectivesMap.facturacion * Math.max(members.length, 1),
    margen: objectivesMap.margen * Math.max(members.length, 1),
  };

  // V4.4.10: Memoize to avoid re-renders of TopRankingsWidget
  const membersForRanking = useMemo(() =>
    members.map(m => ({
      id: m.id,
      nombre: m.nombre,
      color: m.color || '#6366F1',
      obvs: Number(m.obvs) || 0,
      margen: Number(m.margen) || 0,
      lps: Number(m.lps) || 0,
      bps: Number(m.bps) || 0,
      cps: Number(m.cps) || 0,
      facturacion: Number(m.facturacion) || 0,
    })),
    [members]
  );

  // O5.V2.2 — Check if user has zero data
  const hasZeroData = members.length === 0
    && totals.obvs === 0
    && totals.lps === 0
    && totals.facturacion === 0;

  // Don't block entire page on loadingMembers — engine section renders independently

  return (
    <>
      <NovaHeader
        title={t('dashboard.dashboard')}
        subtitle={t('dashboard.consolidaMétricasDeProyectos')}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* O5.V2.2 — Empty state for Day 1 (above engine — only shows when zero data) */}
        {projectId && hasZeroData && (
          <EmptyStateDashboard
            projectId={projectId}
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* Onboarding Progress Banner — only first 7 days */}
        {projectId && daysActive < 7 && onboardingProgress && onboardingProgress.progress < 100 && (
          <OnboardingProgressBanner
            projectId={projectId}
            progress={onboardingProgress.progress}
            fastStartCompleted={onboardingProgress.fastStartCompleted}
            deepSetupSections={onboardingProgress.deepSetupSections}
            onboardingType={onboardingProgress.onboardingType}
          />
        )}

        {/* V5.4.9 — Revenue confirmation banner (critical CTA, stays above engine) */}
        {showRevenueBanner && projectId && (
          <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <ShoppingCart className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
              {t('onboardingBanner.confirmRevenue')}
            </p>
            <button
              onClick={() => navigate(`/proyecto/${projectId}/obvs?new=true`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors shrink-0"
            >
              {t('onboardingBanner.createRevenueOBV')}
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── EXPERIENCE ENGINE — Strategic Cockpit ── */}
        {projectId && project && (
          <DashboardAdapter
            phase={currentPhase}
            daysActive={Math.max(daysActive, 0)}
            isZenMode={isZenMode}
            specializationRole={rolePermissions.role}
            isLead={rolePermissions.isLead}
            teamMode={resolvedTeamMode}
            teamSize={members.length}
            totalOBVs={totals.obvs}
            totalLeads={leadsCount}
            totalTasks={tasksCompletedWeekly}
            hasRevenue={totals.facturacion > 0}
            hasIntegrations={activeIntegrationsCount > 0}
            kpiCount={kpiCount}
            phaseScore={engineData?.phaseState?.phase_score ?? 0}
            projectId={projectId}
            renderers={engineRenderers}
          />
        )}

        {/* Core Stats — rendered outside DashboardAdapter to avoid re-render loops */}
        {projectId && project && (leadsCount > 0 || kpiCount > 0 || tasksCompletedWeekly > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {leadsCount > 0 && (
              <StatCard icon={FileCheck} value={leadsCount} label={t('project.obvs')} progress={0} color="#5CE1E6" delay={1} />
            )}
            {kpiCount > 0 && (
              <StatCard icon={Trophy} value={kpiCount} label={t('project.kpis')} progress={0} color="#FF66C4" delay={2} />
            )}
            {tasksCompletedWeekly > 0 && (
              <StatCard icon={CheckSquare} value={tasksCompletedWeekly} label={t('project.tareasSemanales')} progress={0} color="#5CE1E6" delay={3} />
            )}
          </div>
        )}

        {/* Zen mode dismiss */}
        {isZenMode && projectId && (
          <button
            onClick={() => { setZenDismissed(true); localStorage.setItem(`zen_dismissed_${projectId}`, 'true'); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t('project.showFullDashboard')}
          </button>
        )}

        {/* ── TEAM OVERVIEW — Legacy widgets below engine ── */}
        <div className="border-t border-border pt-6 mt-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t('dashboard.teamOverview', 'Team Overview')}
          </h3>
        </div>

        {/* S4.5 — Quick Actions (secondary shortcuts) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/obvs?new=true` : '/tasks?new=true')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors border border-primary/20"
          >
            <Plus size={16} />
            {t('dashboard.quickNewTask')}
          </button>
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/obvs?new=true` : '/obv-center?new=true')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium transition-colors border border-green-500/20"
          >
            <ShoppingCart size={16} />
            {t('dashboard.quickNewSale')}
          </button>
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/analisis-ia` : '/ai-analysis')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-sm font-medium transition-colors border border-purple-500/20"
          >
            <Sparkles size={16} />
            {t('dashboard.quickAIAnalysis')}
          </button>
        </div>

        {/* ── LEGACY WIDGETS — Team Overview (below engine) ── */}

        {/* How it works — collapsed by default (defaultExpanded=false) */}
        <HowItWorks
          title={t('dashboard.cómoFunciona')}
          description={t('dashboard.vistaGeneralConsolidadaDe')}
          whatIsIt={t('dashboard.dashboardPrincipalQueAgrega')}
          onViewPreview={() => setShowPreviewModal(true)}
          dataInputs={[
            {
              from: t('dashboard.todasLasSecciones'),
              items: [
                t('dashboard.centroObvsTotalDe'),
                t('dashboard.crmPipelineValueY'),
                t('dashboard.financieroRevenueYMárgenes'),
                t('dashboard.equipoFitScoresY'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Tú (decisiones)',
              items: [
                t('dashboard.vista360DeLa'),
                t('dashboard.alertasDeProblemasCríticos'),
                t('dashboard.quéPriorizarHoy'),
              ],
            },
          ]}
          nextStep={{
            action: t('dashboard.identificaProblemasOCuellos'),
            destination: 'Navega a la sección específica para profundizar (Proyectos, CRM, etc.)',
          }}
        />

        {/* KPIs Grid — financial stats hidden for Growth (phase < 3) to match engine */}
        <OsWindow title={t('dashboard.kpisDelEquipo')} icon={TrendingUp} variant="compact">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={FileCheck}
              value={totals.obvs}
              label={t('dashboard.obvsTotales')}
              progress={(totals.obvs / teamObjectives.obvs) * 100}
              target={teamObjectives.obvs}
              color="#6366F1"
              delay={1}
            />
            <StatCard
              icon={BookOpen}
              value={totals.lps}
              label={t('dashboard.learningPaths')}
              progress={(totals.lps / teamObjectives.lps) * 100}
              target={teamObjectives.lps}
              color="#F59E0B"
              delay={2}
            />
            <StatCard
              icon={Trophy}
              value={totals.bps}
              label={t('dashboard.bookPoints')}
              progress={(totals.bps / teamObjectives.bps) * 100}
              target={teamObjectives.bps}
              color="#22C55E"
              delay={3}
            />
            <StatCard
              icon={Users}
              value={totals.cps}
              label={t('dashboard.communityPoints')}
              progress={(totals.cps / teamObjectives.cps) * 100}
              target={teamObjectives.cps}
              color="#EC4899"
              delay={4}
            />
            {/* Financial stats: hidden for Growth when phase < 3 (matches engine financial_summary logic) */}
            {!(macroRole === 'growth' && currentPhase < 3) && (
              <>
                <StatCard
                  icon={TrendingUp}
                  value={`€${(totals.facturacion/1000).toFixed(1)}K`}
                  label={t('dashboard.facturación')}
                  progress={(totals.facturacion / teamObjectives.facturacion) * 100}
                  target={`€${teamObjectives.facturacion/1000}K`}
                  color="#3B82F6"
                  delay={5}
                />
                <StatCard
                  icon={Wallet}
                  value={`€${(totals.margen/1000).toFixed(1)}K`}
                  label={t('dashboard.margenBruto')}
                  progress={(totals.margen / teamObjectives.margen) * 100}
                  target={`€${teamObjectives.margen/1000}K`}
                  color="#22C55E"
                  delay={6}
                />
              </>
            )}
          </div>
        </OsWindow>

        {/* Charts & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OsWindow title={t('dashboard.evoluciónSemanal')} icon={TrendingUp}>
              <Suspense fallback={<div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <WeeklyEvolutionChart hideHeader />
              </Suspense>
            </OsWindow>
          </div>
          <OsWindow title={t('dashboard.alertasInteligentes')} icon={AlertTriangle}>
            <SmartAlertsWidget hideHeader />
          </OsWindow>
        </div>

        {/* Onboarding Widgets - Only show if Fast Start completed */}
        {projectId && userId && onboardingProgress && onboardingProgress.fastStartCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GamificationWidget projectId={projectId} userId={userId} />
            <RegenerationTriggersWidget projectId={projectId} />
          </div>
        )}

        {/* Top 3 Rankings */}
        <OsWindow title={t('dashboard.topPerformers')} icon={Trophy}>
          <TopRankingsWidget members={membersForRanking} hideHeader />
        </OsWindow>

        {/* Validations */}
        <OsWindow title={t('dashboard.validacionesPendientes')} icon={CheckCircle2}>
          <PendingValidationsWidget hideHeader />
        </OsWindow>
      </div>

      {/* Floating Help Widget */}
      <HelpWidget section="dashboard" />

      {/* Dashboard Preview Modal */}
      <DashboardPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
