import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, TrendingUp, Target, Users, Wallet, Calendar, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/nova/StatCard';
import { ROLE_CONFIG } from '@/data/mockData';
import type { Project } from '@/hooks/useNovaData';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { PlanLimitsIndicator } from '@/components/subscription/PlanLimitsIndicator';
import { AcquisitionChannelEditor } from './AcquisitionChannelEditor';
import { useProjectEngineData, useProjectViabilityState, useProjectFunctions } from '@/hooks/useNovaDataOptimized';
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
import { OptimusProfileCard } from './OptimusProfileCard';
import { ProjectTimeline } from './ProjectTimeline';
import { TeamRecommendation } from './TeamRecommendation';
import { LeadConversionInsights } from './LeadConversionInsights';
import { DataCompletenessGuide } from './DataCompletenessGuide';
import { GraduationCelebration } from './GraduationCelebration';
import { InvestorSummary } from './InvestorSummary';

import { useTranslation } from 'react-i18next';
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* PI27.5 — Moment Banner (celebraciones + coaching proactivo) */}
      <MomentBanner projectId={project.id} />

      {/* F19.A.3 — Next Action Focus Block (primer elemento del dashboard) */}
      <NextActionFocusBlock
        projectId={project.id}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Trial Countdown Banner — [B3/U3.5] No mostrar Day 0-2 (ansiedad innecesaria) — hidden in Zen Mode */}
      {!isZenMode && Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86_400_000) >= 3 && (
        <TrialCountdownBanner projectId={project.id} />
      )}

      {/* O5.9 — Primeros pasos (visible una vez, post-onboarding) */}
      <FirstStepsPanel projectId={project.id} onNavigateToTab={onNavigateToTab} />

      {/* O5.10 — Completa tu proyecto (perfil estratégico + primeras acciones) — hidden in Zen Mode */}
      {!isZenMode && (
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

      {/* EQ26.10 — Team Recommendation (solo Fase 2+ — en Fase 0-1 el founder está solo) */}
      {currentPhase >= 2 && (
        <TeamRecommendation
          projectId={project.id}
          currentPhase={currentPhase}
          teamSize={teamMembers.length}
          existingRoles={teamMembers.map(m => m.role)}
        />
      )}

      {/* Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Stats Grid — F19.C.5: adaptadas por fase (no mostrar €0 en fases tempranas) */}
          {/* V4.1.14: hide zero-value stats — Zen Mode: hide entire grid unless any stat > 0 */}
          {(!isZenMode || totalOBVs > 0 || leadsCount > 0 || teamMembers.length > 0 || facturacion > 0 || margen > 0 || Number(stats?.leads_ganados ?? 0) > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {phaseStats.includes('total_obvs' as PhaseStatKey) && totalOBVs > 0 && (
              <StatCard icon={FileCheck} value={totalOBVs} label={t('project.obvs')} progress={0} color="#6366F1" delay={1} />
            )}
            {phaseStats.includes('leads_count' as PhaseStatKey) && leadsCount > 0 && (
              <StatCard icon={Target} value={leadsCount} label={t('project.leads')} progress={0} color="#F59E0B" delay={2} />
            )}
            {phaseStats.includes('team_count' as PhaseStatKey) && teamMembers.length > 0 && (
              <StatCard icon={Users} value={teamMembers.length} label={t('project.miembros')} progress={0} color="#EC4899" delay={3} />
            )}
            {phaseStats.includes('days_active' as PhaseStatKey) && (
              <StatCard
                icon={Calendar}
                value={Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86_400_000)}
                label={t('project.díasActivo')}
                progress={0}
                color="#8B5CF6"
                delay={4}
              />
            )}
            {phaseStats.includes('conversion_rate' as PhaseStatKey) && Number(stats?.leads_ganados ?? 0) > 0 && (
              <StatCard
                icon={TrendingUp}
                value={`${Math.round((Number(stats?.leads_ganados ?? 0) / Math.max(leadsCount, 1)) * 100)}%`}
                label={t('project.conversión')}
                progress={0}
                color="#3B82F6"
                delay={4}
              />
            )}
            {phaseStats.includes('facturacion' as PhaseStatKey) && facturacion > 0 && (
              <StatCard icon={TrendingUp} value={`€${facturacion}`} label={t('project.facturación')} progress={0} color="#3B82F6" delay={4} />
            )}
            {phaseStats.includes('margen' as PhaseStatKey) && margen > 0 && (
              <StatCard icon={Wallet} value={`€${margen}`} label={t('project.margen')} progress={0} color="#22C55E" delay={5} />
            )}
            {phaseStats.includes('leads_ganados' as PhaseStatKey) && Number(stats?.leads_ganados ?? 0) > 0 && (
              <StatCard icon={Target} value={Number(stats?.leads_ganados ?? 0)} label={t('project.leadsGanados0')} progress={0} color="#22C55E" delay={5} />
            )}
          </div>
          )}

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

          {/* F29 — Execution trends + Pipeline velocity (phase 2+) */}
          {/* V4.4.14: WhatIfSimulator removed from dashboard (kept in component library for analytics tab) */}
          {currentPhase >= 2 && (
            <>
              <ExecutionTrendsCard projectId={project.id} />
              <TeamContributionHeatmap projectId={project.id} />
              <PipelineVelocityCard projectId={project.id} />
            </>
          )}

          {/* Probability breakdown — U6.4 — [B3/U3.2] Ocultar en Fase 0-1 */}
          {currentPhase >= 2 && (
            <ProbabilityBreakdown
              probability={engineData?.probability ?? null}
              probabilityHistory={engineData?.probabilityHistory ?? []}
              onCTA={onNavigateToTab ? () => onNavigateToTab('financiero') : undefined}
              onNavigateToTab={onNavigateToTab}
            />
          )}

          {/* Risk breakdown — U6.5 — [B3/U3.2] Ocultar en Fase 0-1 */}
          {currentPhase >= 2 && (
            <RiskBreakdown
              risk={engineData?.risk ?? null}
              riskHistory={engineData?.riskHistory ?? []}
              onNavigateToTab={onNavigateToTab}
            />
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

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {/* ProjectEnginePanel — always visible (kept in Zen Mode) */}
          <ProjectEnginePanel
            projectId={project.id}
            engineData={engineData}
            isLoading={engineLoading}
            viabilityStatus={viabilityData?.viability_status}
            functionOwners={functionOwners}
            fastStartCompleted={fastStartCompleted}
            onNavigateToOnboarding={() => navigate(`/onboarding/${project.id}`)}
            onAction={onNavigateToTab ? (actionType) => {
              if (actionType === 'create_obv') onNavigateToTab('obvs');
              else if (actionType === 'add_metrics') onNavigateToTab('financiero');
              else if (actionType === 'create_task') onNavigateToTab('tareas');
              else if (actionType === 'define_channel') {
                const el = document.getElementById('acquisition-channel-editor');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  el.style.boxShadow = '0 0 0 3px var(--color-primary)';
                  setTimeout(() => { el.style.boxShadow = ''; }, 2000);
                }
              }
            } : undefined}
          />
          {/* Sidebar items hidden in Zen Mode */}
          {!isZenMode && (
            <>
              <OptimusProfileCard projectId={project.id} />
              <PlanLimitsIndicator projectId={project.id} />
              <FeatureTeasersPanel projectId={project.id} />
              {showDelegationHint && (
                <FunctionDelegationHint
                  onNavigateToTeam={onNavigateToTab ? () => onNavigateToTab('equipo') : undefined}
                />
              )}
              <DataCompletenessGuide projectId={project.id} />
              {currentPhase >= 2 && (
                <InvestorSummary
                  projectId={project.id}
                  projectName={project.nombre || t('project.miProyecto')}
                  engineData={engineData}
                />
              )}
              <LeadConversionInsights projectId={project.id} />
            </>
          )}
          {/* ProjectTimeline — always visible (kept in Zen Mode) */}
          <ProjectTimeline projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectDashboardTab = memo(ProjectDashboardTabComponent);
