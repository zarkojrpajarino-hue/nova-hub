import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, Users, Kanban, FileCheck,
  TrendingUp, Target, Loader2, MoreVertical, Trash2, Sparkles, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProjects, useProjectTeamMembers, useProjectStats, useProjectLeads,
  useProjectEngineData, useProjectViabilityState,
  useMarkWeeklyReviewRead, useUpdateLastSeenAt,
} from '@/hooks/useNovaDataOptimized';
import { useActiveSurface } from '@/hooks/useActiveSurface';
import { WeeklySurface } from '@/components/project/WeeklySurface';
import { ResetSurface } from '@/components/project/ResetSurface';
import { ReentrySurface } from '@/components/project/ReentrySurface';
import { useProjectRealtimeSync } from '@/hooks/useRealtimeSubscription';
import { trackReentry } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { ProjectDashboardTab } from '@/components/project/ProjectDashboardTab';
import { ProjectTeamTab } from '@/components/project/ProjectTeamTab';
import { ProjectCRMTab } from '@/components/project/ProjectCRMTab';
import { ProjectTasksTab } from '@/components/project/ProjectTasksTab';
import { ProjectOBVsTab } from '@/components/project/ProjectOBVsTab';
import { ProjectFinancialTab } from '@/components/project/ProjectFinancialTab';
import { ProjectHelpMenu } from '@/components/project/ProjectHelpMenu';
import { EngineIndicators } from '@/components/project/EngineIndicators';
import { PhaseProgressBar } from '@/components/project/PhaseProgressBar';
import { ViabilityBanner } from '@/components/project/ViabilityBanner';
import { RegressionBanner } from '@/components/project/RegressionBanner';
import { PhaseTransitionToast } from '@/components/project/PhaseTransitionToast';
import { ProjectModeBadge } from '@/components/project/ProjectModeBadge';
import { PhaseHorizonHint } from '@/components/project/PhaseHorizonHint';
import { HelpWidget } from '@/components/ui/section-help';
import { PhaseTeaserModal } from '@/components/project/PhaseTeaserModal';
import { usePhaseFeatures } from '@/hooks/usePhaseFeatures';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { MemberOnboarding } from '@/components/roles/MemberOnboarding';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
const GeneratedBusinessDashboard = lazy(() => import('@/components/generative/GeneratedBusinessDashboard').then(m => ({ default: m.GeneratedBusinessDashboard })));
const ExpansionIntelligencePage = lazy(() => import('@/components/expansion/ExpansionIntelligencePage').then(m => ({ default: m.ExpansionIntelligencePage })));
// RoleAcceptanceGate eliminado - los roles se auto-aceptan tras onboarding

const TABS = [
  { id: 'dashboard', label: t('project.dashboard'), icon: LayoutDashboard },
  { id: 'equipo', label: t('project.equipo'), icon: Users },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'tareas', label: t('project.tareas'), icon: Kanban },
  { id: 'obvs', label: t('project.obvs'), icon: FileCheck },
  { id: 'financiero', label: t('project.financiero'), icon: TrendingUp },
  { id: 'negocio-ia', label: 'Negocio IA', icon: Sparkles },
  { id: 'expansion', label: t('project.expansión'), icon: Globe },
];

export default function ProjectPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teaserTabClicked, setTeaserTabClicked] = useState<string | null>(null);
  const phaseFeatures = usePhaseFeatures(projectId);
  const { permissions } = useRolePermissions(projectId);

  const { data: projects = [], isLoading: loadingProject } = useProjects();

  // ✨ OPTIMIZADO: Usar hooks específicos por proyecto en lugar de globales
  const { data: teamMembersData = [] } = useProjectTeamMembers(projectId);
  const { data: stats } = useProjectStats(projectId);
  const { data: projectLeads = [] } = useProjectLeads(projectId);
  const { data: engineData } = useProjectEngineData(projectId);
  const { data: viabilityData } = useProjectViabilityState(projectId);

  // ── Surface selection — V11.3 ─────────────────────────────────────────────
  //
  // Prioridad: reset > weekly > engine
  // isReentry: capa previa, independiente de la prioridad de superficies.
  //
  // capturedReentry: isReentry se captura UNA VEZ cuando los datos cargan.
  // Esto evita que la actualización de last_seen_at (que ocurre en el mismo
  // useEffect) haga que isReentry se vuelva false antes de que el founder
  // haya tenido la oportunidad de ver el re-entry summary.
  const { surface, isReentry: rawIsReentry, weeklyReviewId, lastSeenAt, isLoading: surfaceLoading } =
    useActiveSurface(projectId, profile?.id);

  const capturedReentry = useRef<boolean | null>(null);
  const [reentryAcknowledged, setReentryAcknowledged] = useState(false);
  // Escape hatch temporal: permite salir de ResetSurface sin completar el ritual.
  // Se resetea en cada sesión (no persiste). El ritual sigue pendiente en backend.
  const [ritualSkipped, setRitualSkipped] = useState(false);
  const { mutate: markRead } = useMarkWeeklyReviewRead();
  const { mutate: updateLastSeen } = useUpdateLastSeenAt();

  // Capturar re-entry y actualizar last_seen_at una sola vez al cargar datos
  useEffect(() => {
    if (surfaceLoading || capturedReentry.current !== null) return;
    capturedReentry.current = rawIsReentry;
    if (rawIsReentry && projectId && lastSeenAt) {
      const absenceDays = Math.floor(
        (Date.now() - new Date(lastSeenAt).getTime()) / 86_400_000,
      );
      trackReentry({ project_id: projectId, absence_days: absenceDays });
    }
    if (projectId && profile?.id) {
      updateLastSeen({ projectId, userId: profile.id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceLoading, rawIsReentry, projectId, profile?.id, updateLastSeen]);

  const isReentry = capturedReentry.current ?? false;
  const showReentry = isReentry && !reentryAcknowledged;

  // Superficie visible:
  //   re-entry tiene prioridad hasta que se acknowledge
  //   ritualSkipped permite salir de reset temporalmente (escape hatch — sin completar ritual)
  const activeSurface = showReentry ? 'reentry' : (ritualSkipped && surface === 'reset' ? 'engine' : surface);

  // Realtime: sincroniza datos del proyecto y tablas del engine en tiempo real.
  // Las tablas engine (project_phase_state, project_probability, etc.) requieren
  // migration 00020 para estar en la publication de Supabase Realtime.
  useProjectRealtimeSync(projectId);

  const project = projects.find(p => p.id === projectId);

  // ✨ OPTIMIZADO: Ya no necesitamos useMemo porque los datos ya vienen unidos
  // teamMembersData ya incluye member info gracias al JOIN en la query
  const teamMembers = useMemo(() => {
    return teamMembersData.map(tm => ({
      ...tm.member,
      member_id: tm.member_id,
      role: tm.role,
      isLead: tm.is_lead,
      role_accepted: tm.role_accepted,
      role_responsibilities: tm.role_responsibilities,
    }));
  }, [teamMembersData]);

  // Check if current user is a member
  const isProjectMember = teamMembers.some(m => m?.id === profile?.id);

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">{t('project.proyectoNoEncontrado')}</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />{t('project.volver')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${project.color}20` }}
            >
              {project.icon}
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{project.nombre}</h1>
              <p className="text-sm text-muted-foreground">
                Fase {project.phase_state?.current_phase ?? 1} • {project.tipo === 'operacion' ? t('project.enOperación') : t('project.enValidación')}
              </p>
            </div>

            {/* Engine indicators (U6.1) */}
            <EngineIndicators engineData={engineData} />

            {/* Build / Rescue mode badge (U6.10) */}
            <ProjectModeBadge engineData={engineData} viabilityData={viabilityData} />

            {/* Help Menu */}
            <ProjectHelpMenu />

            {isProjectMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DeleteProjectDialog
                    projectId={project.id}
                    projectName={project.nombre}
                    trigger={
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 size={16} className="mr-2" />{t('project.eliminarProyecto')}</DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Content — surface-driven (V11.3) */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeSurface === 'reentry' ? (
          // Capa de re-entry: siempre primero cuando hay ausencia > 7d
          <ReentrySurface
            projectId={projectId!}
            lastSeenAt={lastSeenAt ?? new Date().toISOString()}
            onAcknowledge={() => setReentryAcknowledged(true)}
            onNavigateToTab={setActiveTab}
          />
        ) : activeSurface === 'weekly' ? (
          // Surface 2: Weekly Review (full page — Rule 2)
          <WeeklySurface
            projectId={projectId!}
            onContinue={() => {
              if (weeklyReviewId) {
                markRead({ reviewId: weeklyReviewId, projectId: projectId! });
              }
            }}
          />
        ) : activeSurface === 'reset' ? (
          // Surface 3: Strategic Reset Ritual (full page — Rule 2)
          <ResetSurface
            projectId={projectId!}
            onComplete={() => {
              // submit_strategic_reset() ya cerró el ciclo y creó el N+1.
              // Invalida ritual-pending → useActiveSurface recomputa → surface = 'engine'.
              queryClient.invalidateQueries({ queryKey: ['ritual-pending', projectId] });
            }}
            onSkip={() => setRitualSkipped(true)}
          />
        ) : (
          // Surface 1: Engine (default — estado continuo)
          <>
            {/* Viability banner — U6.7 */}
            <ViabilityBanner viabilityData={viabilityData} projectId={projectId!} />

            {/* Regression banner — U6.6 */}
            <RegressionBanner
              engineData={engineData}
              projectId={projectId!}
              onCTA={() => setActiveTab('dashboard')}
            />

            {/* Phase progress bar — U6.2 */}
            <PhaseProgressBar engineData={engineData} onCTA={() => setActiveTab('obvs')} />

            {/* Phase horizon hint — U6.11 */}
            <PhaseHorizonHint engineData={engineData} />

            {/* F19.C.4 — PhaseTeaserModal */}
            {teaserTabClicked && (
              <PhaseTeaserModal
                open={!!teaserTabClicked}
                onOpenChange={(open) => !open && setTeaserTabClicked(null)}
                tabId={teaserTabClicked}
                reason={phaseFeatures.getTeaserReason(teaserTabClicked)}
                unlockCondition={phaseFeatures.getUnlockCondition(teaserTabClicked)}
                onOpenAnyway={() => setActiveTab(teaserTabClicked)}
              />
            )}

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                // F19.C.3: interceptar teaser tabs
                if (phaseFeatures.getTabStatus(value) === 'teaser') {
                  setTeaserTabClicked(value)
                  return
                }
                setActiveTab(value)
              }}
            >
              <TabsList className={`grid mb-6`} style={{ gridTemplateColumns: `repeat(${TABS.filter(t => permissions.visibleTabs.includes(t.id)).length}, 1fr)` }}>
                {TABS.filter(tab => permissions.visibleTabs.includes(tab.id)).map(tab => {
                  const tabStatus = phaseFeatures.getTabStatus(tab.id)
                  const isFocus   = phaseFeatures.isFocusTab(tab.id)
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'flex items-center gap-2 relative',
                        tabStatus === 'secondary' && 'text-muted-foreground/70',
                        tabStatus === 'teaser'    && 'opacity-50',
                      )}
                    >
                      {tabStatus === 'teaser'
                        ? <Lock size={12} className="text-muted-foreground" />
                        : <tab.icon size={16} />
                      }
                      <span className="hidden sm:inline">{tab.label}</span>
                      {isFocus && (
                        <span className="text-[8px] font-semibold bg-primary/10 text-primary px-1 rounded">
                          ★
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="dashboard">
                <ProjectDashboardTab
                  project={project}
                  currentPhase={project.phase_state!.current_phase}
                  stats={stats}
                  teamMembers={teamMembers}
                  leadsCount={projectLeads.length}
                  onNavigateToTab={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="equipo">
                <ProjectTeamTab
                  project={project}
                  teamMembers={teamMembers}
                />
              </TabsContent>

              <TabsContent value="crm">
                <ProjectCRMTab
                  projectId={projectId!}
                  projectName={project?.nombre || ''}
                />
              </TabsContent>

              <TabsContent value="tareas">
                <ProjectTasksTab projectId={projectId!} project={project} />
              </TabsContent>

              <TabsContent value="obvs">
                <ProjectOBVsTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="financiero">
                <ProjectFinancialTab
                  stats={stats}
                  projectId={projectId!}
                />
              </TabsContent>

              <TabsContent value="negocio-ia">
                <Suspense fallback={<div className="py-8 text-center text-muted-foreground">{t('project.cargando')}</div>}><GeneratedBusinessDashboard /></Suspense>
              </TabsContent>

              <TabsContent value="expansion">
                <Suspense fallback={<div className="py-8 text-center text-muted-foreground">{t('project.cargando')}</div>}><ExpansionIntelligencePage projectId={projectId!} /></Suspense>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <HelpWidget section="project" />

      {/* Phase transition celebration — U6.9 */}
      <PhaseTransitionToast
        engineData={engineData}
        projectId={projectId!}
        onViewDetails={() => setActiveTab('dashboard')}
      />
    </div>
  );
}
