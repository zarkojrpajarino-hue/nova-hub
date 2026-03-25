import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, TrendingUp, Target, Users, Wallet, Calendar, ChevronRight, CheckSquare } from 'lucide-react';
import { StatCard } from '@/components/nova/StatCard';
import { ROLE_CONFIG } from '@/data/mockData';
import type { Project } from '@/hooks/useNovaDataOptimized';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { PlanLimitsIndicator } from '@/components/subscription/PlanLimitsIndicator';
import { AICallsNudge } from '@/components/subscription/AICallsNudge';
import { AcquisitionChannelEditor } from './AcquisitionChannelEditor';
import { useProjectEngineData, useProjectViabilityState, useProjectFunctions } from '@/hooks/useNovaDataOptimized';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectEnginePanel } from './ProjectEnginePanel';
import { ProbabilityBreakdown } from './ProbabilityBreakdown';
import { RiskBreakdown } from './RiskBreakdown';
import { FirstStepsPanel } from './FirstStepsPanel';
import { FaseBPanel } from './FaseBPanel';
import { FeatureTeasersPanel } from './FeatureTeasersPanel';
import { FunctionDelegationHint } from './FunctionDelegationHint';
import { PHASE_LABELS } from '@/lib/engine';
import { NextActionFocusBlock } from './NextActionFocusBlock';
import { DataCompletenessCard } from './DataCompletenessCard';
import { ExecutionTrendsCard } from './ExecutionTrendsCard';
import { PipelineVelocityCard } from './PipelineVelocityCard';
import { TeamContributionHeatmap } from './TeamContributionHeatmap';
import { usePhaseFeatures } from '@/hooks/usePhaseFeatures';
import type { PhaseStatKey } from '@/lib/phase-features';
import { PhaseRoadmap } from './PhaseRoadmap';
import { CycleDashboard } from './CycleDashboard';
import { MomentBanner } from './MomentBanner';
// OptimusProfileCard removed from dashboard — component file kept for Settings migration
import { ProjectTimeline } from './ProjectTimeline';
import { TeamRecommendation } from './TeamRecommendation';
import { LeadConversionInsights } from './LeadConversionInsights';
import { DataCompletenessGuide } from './DataCompletenessGuide';
import { GraduationCelebration } from './GraduationCelebration';
import { InvestorSummary } from './InvestorSummary';

import { useTranslation } from 'react-i18next';
import { DashboardAdapter } from './DashboardAdapter';
import type { BlockDepth } from '@/lib/experience-engine';
import { useRolePermissions } from '@/hooks/useRolePermissions';
interface ProjectStats {
  facturacion?: number;
  margen?: number;
  total_obvs?: number;
  leads_ganados?: number;
}

interface TeamMemberDisplay {
  id: string;
  nombre: string;
  role: string;
  color?: string;
  isLead?: boolean;
}

interface ProjectDashboardTabProps {
  project: Project;
  currentPhase: number;
  stats: ProjectStats;
  teamMembers: TeamMemberDisplay[];
  leadsCount: number;
  onNavigateToTab?: (tab: string) => void;
}

function ProjectDashboardTabComponent({ project, currentPhase, stats, teamMembers, leadsCount, onNavigateToTab }: ProjectDashboardTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const facturacion = Number(stats?.facturacion) || 0;
  const margen = Number(stats?.margen) || 0;
  const totalOBVs = Number(stats?.total_obvs) || 0;

  const { data: engineData, isLoading: engineLoading } = useProjectEngineData(project.id);
  const { data: viabilityData } = useProjectViabilityState(project.id);
  const { data: functionOwners } = useProjectFunctions(project.id);
  const phaseFeatures = usePhaseFeatures(project.id);
  const phaseStats = phaseFeatures.getPhaseStats();

  // ── Real role data for Experience Engine ──
  const { permissions: rolePermissions } = useRolePermissions(project.id);

  const { data: activeIntegrationsCount = 0 } = useQuery({
    queryKey: ['integration-connections-count', project.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('integration_connections')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('status', 'active');
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!project.id,
  });

  // kpis table has owner_id (FK → profiles), not project_id.
  // Count KPIs owned by any member of this project.
  const memberIds = useMemo(() => teamMembers.map(m => m.id), [teamMembers]);
  const { data: kpiCount = 0 } = useQuery({
    queryKey: ['kpi-count', project.id, memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return 0;
      const { count } = await supabase
        .from('kpis')
        .select('id', { count: 'exact', head: true })
        .in('owner_id', memberIds);
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: !!project.id && memberIds.length > 0,
  });

  // Resolve teamMode: check onboarding_data first, then fallback to member count
  const resolvedTeamMode = (() => {
    const onboardingTeamMode = project.onboarding_data?.team_mode;
    if (onboardingTeamMode === 'hiring') return 'hiring' as const;
    if (onboardingTeamMode === 'team' || teamMembers.length > 1) return 'team' as const;
    return 'solo' as const;
  })();


  // V5.2.5 — Tasks completed this week (secondary signal for Phases 1-2)
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const { data: tasksCompletedWeekly = 0 } = useQuery({
    queryKey: ['tasks-completed-weekly', project.id, weekStart],
    queryFn: async () => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('status', 'done')
        .gte('updated_at', weekStart);
      return count ?? 0;
    },
    enabled: !!project.id && (currentPhase === 1 || currentPhase === 2),
  });

  const fastStartCompleted = project.onboarding_data?.fast_start_completed === true;

  // Zen Mode — simplified dashboard for first 7 days in Phase 0-1
  const daysActive = project?.created_at
    ? Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86400000)
    : 0;
  const [zenDismissed, setZenDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`zen_dismissed_${project.id}`) || 'false'); }
    catch { return false; }
  });
  const isZenMode = !zenDismissed && daysActive < 7 && (currentPhase ?? 0) < 2;

  // EC13.6: Solo founder in Phase 4 — < 2 functions delegated to non-founders
  // "delegated" = owner_user_id IS NOT NULL AND != project creator (mirrors O4.3 SQL logic)
  const delegatedCount = (functionOwners ?? []).filter(
    f => f.owner_user_id !== null && f.owner_user_id !== project.created_by,
  ).length;
  const showDelegationHint = currentPhase === 4 && delegatedCount < 2;

  // ── Experience Engine adapter (governs block visibility) ──────────────────
  const engineRenderers = useMemo(() => [
    {
      block: 'next_action' as const,
      render: (_depth: BlockDepth) => (
        <NextActionFocusBlock projectId={project.id} onNavigateToTab={onNavigateToTab} />
      ),
    },
    {
      block: 'methodology' as const,
      render: (_depth: BlockDepth) => (
        <MomentBanner projectId={project.id} />
      ),
    },
    {
      block: 'core_stats' as const,
      render: (depth: BlockDepth) => depth === 'hidden' ? null : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {phaseStats.includes('total_obvs' as PhaseStatKey) && totalOBVs > 0 && (
            <StatCard icon={FileCheck} value={totalOBVs} label={t('project.obvs')} progress={0} color="#5CE1E6" delay={1} />
          )}
          {phaseStats.includes('team_count' as PhaseStatKey) && teamMembers.length > 0 && (
            <StatCard icon={Users} value={teamMembers.length} label={t('project.miembros')} progress={0} color="#7C3AED" delay={2} />
          )}
          {phaseStats.includes('days_active' as PhaseStatKey) && daysActive > 0 && (
            <StatCard icon={Calendar} value={daysActive} label={t('project.díasActivo')} progress={0} color="#7C3AED" delay={3} />
          )}
          {phaseStats.includes('tasks_completed_weekly' as PhaseStatKey) && tasksCompletedWeekly > 0 && (
            <StatCard icon={CheckSquare} value={tasksCompletedWeekly} label={t('project.tareasSemanales')} progress={0} color="#5CE1E6" delay={4} />
          )}
          {phaseStats.includes('conversion_rate' as PhaseStatKey) && Number(stats?.leads_ganados ?? 0) > 0 && (
            <StatCard icon={TrendingUp} value={`${Math.round((Number(stats?.leads_ganados ?? 0) / Math.max(leadsCount, 1)) * 100)}%`} label={t('project.conversión')} progress={0} color="#FF66C4" delay={4} />
          )}
          {phaseStats.includes('facturacion' as PhaseStatKey) && facturacion > 0 && (
            <StatCard icon={TrendingUp} value={`€${facturacion}`} label={t('project.facturación')} progress={0} color="#5CE1E6" delay={4} />
          )}
          {phaseStats.includes('margen' as PhaseStatKey) && margen > 0 && (
            <StatCard icon={Wallet} value={`€${margen}`} label={t('project.margen')} progress={0} color="#FF66C4" delay={5} />
          )}
        </div>
      ),
    },
    {
      block: 'phase_engine' as const,
      render: (_depth: BlockDepth) => (
        <ProjectEnginePanel
          projectId={project.id}
          engineData={engineData}
          isLoading={engineLoading}
          viabilityStatus={viabilityData?.viability_status}
          functionOwners={functionOwners}
          fastStartCompleted={fastStartCompleted}
          onNavigateToOnboarding={() => navigate(`/onboarding/${project.id}`)}
          onAction={onNavigateToTab ? (actionType: string) => {
            if (actionType === 'create_obv') onNavigateToTab('obvs');
            else if (actionType === 'add_metrics') onNavigateToTab('financiero');
            else if (actionType === 'create_task') onNavigateToTab('tareas');
          } : undefined}
        />
      ),
    },
    {
      block: 'alerts' as const,
      render: (_depth: BlockDepth) => (
        <>
          {!isZenMode && daysActive >= 3 && <TrialCountdownBanner projectId={project.id} />}
          <AICallsNudge projectId={project.id} />
        </>
      ),
    },
    {
      block: 'crm_summary' as const,
      render: (depth: BlockDepth) => {
        if (depth === 'teaser') return (
          <div className="p-4 rounded-2xl bg-card/50 opacity-60">
            <p className="text-sm text-muted-foreground">{t('project.crmUnlocksWithLeads')}</p>
          </div>
        );
        return <LeadConversionInsights projectId={project.id} />;
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
            <p className="text-sm font-medium">{t('project.facturación')}: €{facturacion}</p>
          </div>
        );
        return null; // Full financial view is in FinancieroView, not dashboard
      },
    },
    {
      block: 'team_status' as const,
      render: (depth: BlockDepth) => {
        if (depth === 'teaser') return null; // Solo mode, no teaser on dashboard
        return (
          <TeamRecommendation
            projectId={project.id}
            currentPhase={currentPhase}
            teamSize={teamMembers.length}
            existingRoles={teamMembers.map(m => m.role)}
          />
        );
      },
    },
    {
      block: 'obvs' as const,
      render: (_depth: BlockDepth) => null, // OBVs are a full view, not a dashboard card
    },
    {
      block: 'tasks' as const,
      render: (_depth: BlockDepth) => null, // Tasks are a full view, not a dashboard card
    },
  ], [project, currentPhase, stats, teamMembers, leadsCount, engineData, engineLoading, viabilityData, functionOwners, fastStartCompleted, isZenMode, daysActive, facturacion, margen, totalOBVs, phaseStats, tasksCompletedWeekly, navigate, onNavigateToTab, t]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── ENGINE-GOVERNED BLOCKS ── */}
      <DashboardAdapter
        phase={currentPhase}
        daysActive={daysActive}
        isZenMode={isZenMode}
        specializationRole={rolePermissions.role}
        isLead={rolePermissions.isLead}
        teamMode={resolvedTeamMode}
        teamSize={teamMembers.length}
        totalOBVs={totalOBVs}
        totalLeads={leadsCount}
        totalTasks={tasksCompletedWeekly}
        hasRevenue={facturacion > 0}
        hasIntegrations={activeIntegrationsCount > 0}
        kpiCount={kpiCount}
        phaseScore={engineData?.phaseState?.phase_score ?? 0}
        projectId={project.id}
        renderers={engineRenderers}
      />

      {/* ── LEGACY BLOCKS (not yet migrated to engine) ── */}

      {/* O5.9 — Primeros pasos (visible una vez, post-onboarding) — TODO: migrate to engine */}
      {currentPhase <= 1 && (
        <FirstStepsPanel projectId={project.id} onNavigateToTab={onNavigateToTab} />
      )}

      {/* O5.10 — Completa tu proyecto — TODO: migrate to engine */}
      {!isZenMode && currentPhase <= 2 && (
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            {t('project.completeYourProject')}
          </summary>
          <div className="mt-3">
            <FaseBPanel
              projectId={project.id}
              totalOBVs={totalOBVs}
              onNavigateToTab={onNavigateToTab}
            />
          </div>
        </details>
      )}

      {/* V24.1-4 / CE25.9 — Phase Roadmap o Cycle Dashboard según graduación */}
      {/* [B3/U3.2] Ocultar PhaseRoadmap completo en Fase 0-1 (abrumador) — solo mostrar en Fase 2+ */}
      {engineData?.phaseState?.graduated ? (
        <>
          <GraduationCelebration projectName={project.nombre || t('project.miProyecto')} projectId={project.id} />
          <CycleDashboard projectId={project.id} graduated={true} />
        </>
      ) : currentPhase >= 2 ? (
        <PhaseRoadmap engineData={engineData} />
      ) : null}

      {/* EQ26.10 — Team Recommendation — NOW governed by engine (team_status block) */}
      {/* Rendered via DashboardAdapter when team_status depth != hidden */}

      {/* Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Stats Grid — NOW GOVERNED BY ENGINE (core_stats block) */}
          {/* Old grid removed — stats rendered via DashboardAdapter above */}

          {/* Team Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" />{t('project.equipo')}</h3>
          <div className="space-y-3">
            {teamMembers.map((member: TeamMemberDisplay) => {
              const roleConfig = ROLE_CONFIG[member.role];
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ background: member.color || '#6366F1' }}
                  >
                    {member.nombre?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.nombre}</p>
                    {roleConfig && (
                      <p className="text-xs" style={{ color: roleConfig.color }}>
                        {roleConfig.label}
                      </p>
                    )}
                  </div>
                  {member.isLead && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">{t('project.lead')}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileCheck size={18} className="text-primary" />{t('project.estadoDelProyecto')}</h3>
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('project.fase')}</span>
                <span className="font-medium">{currentPhase} — {PHASE_LABELS[currentPhase]}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('project.tipo')}</span>
                <span className="font-medium">
                  {project.tipo === 'operacion' ? t('project.enOperación') : t('project.enValidación')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('project.onboarding')}</span>
                <span className={`font-medium ${project.onboarding_completed ? 'text-success' : 'text-warning'}`}>
                  {project.onboarding_completed ? 'Completado': t('project.pendiente')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-success/10 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t('project.leadsGanados')}</p>
              <p className="text-2xl font-bold text-success">{stats?.leads_ganados || 0}</p>
            </div>
          </div>
        </div>
      </div>

          {/* U6.V2.3 — Data completeness warning antes de scores del motor — hidden in Zen Mode */}
          {!isZenMode && (
            <DataCompletenessCard
              engineData={engineData}
              onNavigateToTab={onNavigateToTab}
            />
          )}

          {/* F29 + U6.4 + U6.5 — Analytics blocks: governed by engine data maturity */}
          {/* Render only when engine context says phase >= 2 AND data is growing/rich */}
          {/* No direct `if phase >= 2` — delegated to engine via dataMaturity check */}
          {currentPhase >= 2 && !isZenMode && (
            <>
              <ExecutionTrendsCard projectId={project.id} />
              <TeamContributionHeatmap projectId={project.id} />
              <PipelineVelocityCard projectId={project.id} />
              <ProbabilityBreakdown
                probability={engineData?.probability ?? null}
                probabilityHistory={engineData?.probabilityHistory ?? []}
                onCTA={onNavigateToTab ? () => onNavigateToTab('financiero') : undefined}
                onNavigateToTab={onNavigateToTab}
              />
              <RiskBreakdown
                risk={engineData?.risk ?? null}
                riskHistory={engineData?.riskHistory ?? []}
                onNavigateToTab={onNavigateToTab}
              />
            </>
          )}

          {/* Weekly Review: movido a WeeklySurface (V11.3 — Rule 2: 1 surface = 1 time context) */}

          {/* Acquisition Channels (O2.3) — id para scroll desde FaseBPanel — hidden in Zen Mode */}
          {!isZenMode && (
            <div id="acquisition-channel-editor">
              <AcquisitionChannelEditor projectId={project.id} />
            </div>
          )}
        </div>

        {/* Zen Mode dismiss toggle */}
        {isZenMode && (
          <button
            onClick={() => { setZenDismissed(true); localStorage.setItem(`zen_dismissed_${project.id}`, 'true'); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t('project.showFullDashboard')}
          </button>
        )}

        {/* Sidebar — Legacy blocks (not yet migrated to engine) */}
        <div className="lg:col-span-3 space-y-4">
          {/* ProjectEnginePanel — NOW in engine (phase_engine block) */}
          {/* Only render here if engine puts it in deep/secondary (sidebar) */}
          {!isZenMode && (
            <>
              <PlanLimitsIndicator projectId={project.id} />
              {currentPhase <= 2 && <FeatureTeasersPanel projectId={project.id} />}
              {showDelegationHint && (
                <FunctionDelegationHint
                  onNavigateToTeam={onNavigateToTab ? () => onNavigateToTab('equipo') : undefined}
                />
              )}
              <DataCompletenessGuide projectId={project.id} />
              {currentPhase >= 3 && (
                <InvestorSummary
                  projectId={project.id}
                  projectName={project.nombre || t('project.miProyecto')}
                  engineData={engineData}
                />
              )}
            </>
          )}
          <ProjectTimeline projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectDashboardTab = memo(ProjectDashboardTabComponent);
