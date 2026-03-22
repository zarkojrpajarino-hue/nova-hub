import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, TrendingUp, Target, Users, Wallet, Calendar } from 'lucide-react';
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

  // EC13.6: Solo founder in Phase 4 — < 2 functions delegated to non-founders
  // "delegated" = owner_user_id IS NOT NULL AND != project creator (mirrors O4.3 SQL logic)
  const delegatedCount = (functionOwners ?? []).filter(
    f => f.owner_user_id !== null && f.owner_user_id !== project.created_by,
  ).length;
  const showDelegationHint = currentPhase === 4 && delegatedCount < 2;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trial Countdown Banner — [B3/U3.5] No mostrar Day 0-2 (ansiedad innecesaria) */}
      {Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86_400_000) >= 3 && (
        <TrialCountdownBanner projectId={project.id} />
      )}

      {/* O5.9 — Primeros pasos (visible una vez, post-onboarding) */}
      <FirstStepsPanel projectId={project.id} onNavigateToTab={onNavigateToTab} />

      {/* O5.10 — Completa tu proyecto (perfil estratégico + primeras acciones) */}
      <FaseBPanel
        projectId={project.id}
        totalOBVs={totalOBVs}
        onNavigateToTab={onNavigateToTab}
      />

      {/* PI27.5 — Moment Banner (celebraciones + coaching proactivo) */}
      <MomentBanner projectId={project.id} />

      {/* F19.A.3 — Next Action Focus Block (primer elemento del dashboard) */}
      <NextActionFocusBlock
        projectId={project.id}
        onNavigateToTab={onNavigateToTab}
      />

      {/* V24.1-4 / CE25.9 — Phase Roadmap o Cycle Dashboard según graduación */}
      {/* [B3/U3.2] Ocultar PhaseRoadmap completo en Fase 0-1 (abrumador) — solo mostrar en Fase 2+ */}
      {engineData?.phaseState?.graduated ? (
        <CycleDashboard projectId={project.id} graduated={true} />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {phaseStats.includes('total_obvs' as PhaseStatKey) && (
              <StatCard icon={FileCheck} value={totalOBVs} label="OBVs" progress={0} color="#6366F1" delay={1} />
            )}
            {phaseStats.includes('leads_count' as PhaseStatKey) && (
              <StatCard icon={Target} value={leadsCount} label="Leads" progress={0} color="#F59E0B" delay={2} />
            )}
            {phaseStats.includes('team_count' as PhaseStatKey) && (
              <StatCard icon={Users} value={teamMembers.length} label="Miembros" progress={0} color="#EC4899" delay={3} />
            )}
            {phaseStats.includes('days_active' as PhaseStatKey) && (
              <StatCard
                icon={Calendar}
                value={Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86_400_000)}
                label="Días activo"
                progress={0}
                color="#8B5CF6"
                delay={4}
              />
            )}
            {phaseStats.includes('conversion_rate' as PhaseStatKey) && (
              <StatCard
                icon={TrendingUp}
                value={`${Math.round((Number(stats?.leads_ganados ?? 0) / Math.max(leadsCount, 1)) * 100)}%`}
                label="Conversión"
                progress={0}
                color="#3B82F6"
                delay={4}
              />
            )}
            {phaseStats.includes('facturacion' as PhaseStatKey) && (
              <StatCard icon={TrendingUp} value={`€${facturacion}`} label="Facturación" progress={0} color="#3B82F6" delay={4} />
            )}
            {phaseStats.includes('margen' as PhaseStatKey) && (
              <StatCard icon={Wallet} value={`€${margen}`} label="Margen" progress={0} color="#22C55E" delay={5} />
            )}
            {phaseStats.includes('leads_ganados' as PhaseStatKey) && (
              <StatCard icon={Target} value={Number(stats?.leads_ganados ?? 0)} label="Leads ganados" progress={0} color="#22C55E" delay={5} />
            )}
          </div>

          {/* Team Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Equipo
          </h3>
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
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">
                      Lead
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileCheck size={18} className="text-primary" />
            Estado del Proyecto
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fase</span>
                <span className="font-medium">{currentPhase} — {PHASE_LABELS[currentPhase]}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <span className="font-medium">
                  {project.tipo === 'operacion' ? 'En operación' : 'En validación'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Onboarding</span>
                <span className={`font-medium ${project.onboarding_completed ? 'text-success' : 'text-warning'}`}>
                  {project.onboarding_completed ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-success/10 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Leads Ganados</p>
              <p className="text-2xl font-bold text-success">{stats?.leads_ganados || 0}</p>
            </div>
          </div>
        </div>
      </div>

          {/* U6.V2.3 — Data completeness warning antes de scores del motor */}
          <DataCompletenessCard
            engineData={engineData}
            onNavigateToTab={onNavigateToTab}
          />

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

          {/* Acquisition Channels (O2.3) — id para scroll desde FaseBPanel */}
          <div id="acquisition-channel-editor">
            <AcquisitionChannelEditor projectId={project.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
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
          <OptimusProfileCard projectId={project.id} />
          <PlanLimitsIndicator projectId={project.id} />
          <FeatureTeasersPanel projectId={project.id} />
          {showDelegationHint && (
            <FunctionDelegationHint
              onNavigateToTeam={onNavigateToTab ? () => onNavigateToTab('equipo') : undefined}
            />
          )}
          <DataCompletenessGuide projectId={project.id} />
          <LeadConversionInsights projectId={project.id} />
          <ProjectTimeline projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectDashboardTab = memo(ProjectDashboardTabComponent);
