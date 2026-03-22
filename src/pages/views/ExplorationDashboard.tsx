/**
 * EXPLORATION DASHBOARD
 *
 * Vista principal para usuarios en período de exploración de roles
 * Muestra:
 * - Exploraciones activas
 * - Progreso en tiempo real
 * - Feedback pendiente de dar
 * - Historial de exploraciones pasadas
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationProgressCard } from '@/components/feedback/ExplorationProgressCard';
import { PeerFeedbackForm } from '@/components/feedback/PeerFeedbackForm';
import { SelfEvaluationModal } from '@/components/feedback/SelfEvaluationModal';
import { FeedbackReceivedModal } from '@/components/feedback/FeedbackReceivedModal';
import { PhaseTimeline } from '@/components/exploration/PhaseTimeline';
import { PathToMaster } from '@/components/exploration/PathToMaster';
import { Rocket, Users, History, MessageSquare, Trophy, Target } from 'lucide-react';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { ExplorationDashboardPreviewModal } from '@/components/preview/ExplorationDashboardPreviewModal';

import { useTranslation } from 'react-i18next';
export function ExplorationDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { goBack, canGoBack } = useNavigation();
  const [activeExplorations, setActiveExplorations] = useState<Record<string, unknown>[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Record<string, unknown>[]>([]);
  const [pastExplorations, setPastExplorations] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Record<string, unknown> | null>(null);

  // Path to Master
  const [phaseProgress, setPhaseProgress] = useState<Record<string, unknown> | null>(null);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [allRoles] = useState<string[]>(['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'customer']);

  // Modals
  const [selfEvalModal, setSelfEvalModal] = useState<{ open: boolean; exploration: Record<string, unknown>; projectName: string } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; explorationId: string; role: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadExplorations();
      loadPendingFeedback();
      loadPhaseProgress();
      loadCurrentRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadExplorations = async () => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) return;

      // Exploraciones activas
      const { data: active } = await supabase
        .from('role_exploration_periods')
        .select(`
          *,
          project:projects(nombre)
        `)
        .eq('member_id', member.id)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      // Exploraciones pasadas
      const { data: past } = await supabase
        .from('role_exploration_periods')
        .select(`
          *,
          project:projects(nombre)
        `)
        .eq('member_id', member.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);

      setActiveExplorations(active || []);
      setPastExplorations(past || []);
    } catch (_error) {
      toast.error(t('explorationDashboard.errorAlCargarLas'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingFeedback = async () => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) return;

      // Obtener proyectos donde soy miembro
      const { data: myProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('member_id', member.id);

      if (!myProjects || myProjects.length === 0) return;

      const projectIds = myProjects.map((p) => p.project_id);

      // Obtener exploraciones activas de otros miembros en mis proyectos
      const { data: explorations } = await supabase
        .from('role_exploration_periods')
        .select(`
          *,
          member:members(id, nombre, email),
          project:projects(nombre)
        `)
        .in('project_id', projectIds)
        .eq('status', 'active')
        .neq('member_id', member.id);

      if (!explorations) return;

      // Verificar cuáles ya tienen mi feedback
      const { data: givenFeedback } = await supabase
        .from('peer_feedback')
        .select('exploration_period_id')
        .eq('from_member_id', member.id);

      const givenIds = new Set((givenFeedback || []).map((f) => f.exploration_period_id));

      // Filtrar solo los que NO tienen mi feedback
      const pending = explorations.filter((exp) => !givenIds.has(exp.id));

      setPendingFeedback(pending);
    } catch (_error) {
      // intentionally empty
    }
  };

  const handleFeedbackSuccess = () => {
    setSelectedFeedback(null);
    loadPendingFeedback();
    toast.success(t('explorationDashboard.graciasPorTuFeedback'));
  };

  const loadPhaseProgress = async () => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) return;

      const { data: progress } = await supabase
        .from('member_phase_progress')
        .select('*')
        .eq('member_id', member.id)
        .single();

      setPhaseProgress(progress);
    } catch (_error) {
      // intentionally empty
    }
  };

  const loadCurrentRoles = async () => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) return;

      const { data: progress } = await supabase
        .from('member_phase_progress')
        .select('star_role, secondary_role')
        .eq('member_id', member.id)
        .single();

      if (progress) {
        const roles = [progress.star_role, progress.secondary_role].filter(Boolean);
        setCurrentRoles(roles);
      }
    } catch (_error) {
      // intentionally empty
    }
  };

  const handleStartExploration = async (role: string) => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) throw new Error(t('explorationDashboard.usuarioNoEncontrado'));

      const { error } = await supabase.rpc('start_path_to_master', {
        p_member_id: member.id,
        p_role: role,
        p_project_id: null,
      });

      if (error) throw error;

      toast.success('🚀 Exploración iniciada!');
      loadCurrentRoles();
      loadExplorations();
    } catch (_error) {
      toast.error(error instanceof Error ? error.message : t('explorationDashboard.noSePudoIniciar'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {canGoBack && (
        <div className="px-6 pt-6">
          <BackButton onClick={goBack} />
        </div>
      )}

      {/* Header */}
      <div className="px-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Rocket className="text-primary" />{t('explorationDashboard.exploraciónDeRoles')}</h1>
        <p className="text-muted-foreground mt-2">{t('explorationDashboard.descubreTuRolIdeal')}</p>
      </div>

      {/* How it works */}
      <div className="px-6">
        <HowItWorks
          title={t('explorationDashboard.cómoFunciona')}
          description={t('explorationDashboard.sistemaDeDescubrimientoDe')}
          whatIsIt={t('explorationDashboard.procesoDe3Fases')}
          dataInputs={[
            {
              from: t('explorationDashboard.proyectos'),
              items: [
                'Tareas reales asignadas por rol (ej: si exploras CMO, haces growth hacking)',
                t('explorationDashboard.performanceMedidaTareasCompletadas'),
                'Resultados tangibles (leads, revenue, etc.)',
              ],
            },
            {
              from: 'Equipo (Peer Feedback)',
              items: [
                t('explorationDashboard.feedback360DeCompañeros'),
                t('explorationDashboard.evaluacionesSobreSoftSkills'),
                t('explorationDashboard.autoevaluaciónPropiaAlFinalizar'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('explorationDashboard.fitScorePorRol'),
              items: [
                t('explorationDashboard.puntuación0100QueCombina'),
                t('explorationDashboard.rankingDeTus7'),
                'Star Role (top 1) y Secondary Role (top 2)',
              ],
            },
            {
              to: t('explorationDashboard.miDesarrollo'),
              items: [
                t('explorationDashboard.tuFitScorePor'),
                t('explorationDashboard.playbooksPersonalizadosSegúnTu'),
                t('explorationDashboard.insightsIaSobreCómo'),
              ],
            },
            {
              to: t('explorationDashboard.equipo'),
              items: [
                t('explorationDashboard.rankingsDeQuiénMejor'),
                t('explorationDashboard.pathToMasterRoadmap'),
              ],
            },
          ]}
          nextStep={{
            action: t('explorationDashboard.úneteAProyectoExplora'),
            destination: t('explorationDashboard.veAMiDesarrollo'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6 px-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="active" className="gap-2">
            <Rocket size={16} />
            Activas
            {activeExplorations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeExplorations.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="timeline" className="gap-2">
            <Target size={16} />{t('explorationDashboard.miProgreso')}</TabsTrigger>

          <TabsTrigger value="path-to-master" className="gap-2">
            <Trophy size={16} />{t('explorationDashboard.caminoAMaster')}</TabsTrigger>

          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare size={16} />
            Feedback Pendiente
            {pendingFeedback.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingFeedback.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="history" className="gap-2">
            <History size={16} />{t('explorationDashboard.historial')}</TabsTrigger>
        </TabsList>

        {/* Exploraciones Activas */}
        <TabsContent value="active" className="space-y-4">
          {activeExplorations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Rocket size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('explorationDashboard.noTienesExploracionesActivas')}</h3>
                <p className="text-muted-foreground">{t('explorationDashboard.úneteAUnProyecto')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeExplorations.map((exploration) => (
                <ExplorationProgressCard
                  key={exploration.id}
                  exploration={exploration}
                  projectName={exploration.project?.nombre || t('explorationDashboard.proyecto')}
                  onSelfEvaluate={() => {
                    setSelfEvalModal({
                      open: true,
                      exploration: exploration,
                      projectName: exploration.project?.nombre || t('explorationDashboard.proyecto'),
                    });
                  }}
                  onViewFeedback={() => {
                    setFeedbackModal({
                      open: true,
                      explorationId: exploration.id,
                      role: exploration.role,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Feedback Pendiente */}
        <TabsContent value="feedback" className="space-y-4">
          {selectedFeedback ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedFeedback(null)}
                className="mb-4"
              >
                ← Volver a la lista
              </Button>

              <PeerFeedbackForm
                toMember={selectedFeedback.member}
                explorationPeriod={selectedFeedback}
                currentUserId={user!.id}
                onSuccess={handleFeedbackSuccess}
              />
            </div>
          ) : pendingFeedback.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('explorationDashboard.todoAlDía')}</h3>
                <p className="text-muted-foreground">{t('explorationDashboard.noTienesFeedbackPendiente')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingFeedback.map((item) => (
                <Card key={item.id} className="hover-lift cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={20} />
                      {item.member?.nombre}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {item.role} • {item.project?.nombre}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Finaliza: {new Date(item.end_date).toLocaleDateString('es-ES')}
                      </div>
                      <Button
                        onClick={() => setSelectedFeedback(item)}
                        size="sm"
                      >{t('explorationDashboard.darFeedback')}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Historial */}
        <TabsContent value="history" className="space-y-4">
          {pastExplorations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <History size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('explorationDashboard.sinHistorialAún')}</h3>
                <p className="text-muted-foreground">{t('explorationDashboard.tusExploracionesCompletadasAparecerán')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastExplorations.map((exploration) => (
                <Card key={exploration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold capitalize">{exploration.role}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exploration.project?.nombre}
                        </p>
                      </div>

                      {exploration.fit_score && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {exploration.fit_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('explorationDashboard.fitScore')}</div>
                        </div>
                      )}

                      <Badge
                        variant={exploration.status === 'completed' ? 'default' : 'secondary'}
                        className="ml-4"
                      >
                        {exploration.status === 'completed' ? 'Completado': t('explorationDashboard.cancelado')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Mi Progreso */}
        <TabsContent value="timeline">
          {phaseProgress ? (
            <PhaseTimeline
              currentPhase={phaseProgress.current_phase}
              phase1StartedAt={phaseProgress.phase_1_started_at}
              phase1CompletedAt={phaseProgress.phase_1_completed_at}
              phase2StartedAt={phaseProgress.phase_2_started_at}
              phase2CompletedAt={phaseProgress.phase_2_completed_at}
              phase3StartedAt={phaseProgress.phase_3_started_at}
              rolesExploredPhase1={phaseProgress.roles_explored_phase_1 || []}
              top2Roles={phaseProgress.top_2_roles || []}
              starRole={phaseProgress.star_role}
              starRoleFitScore={phaseProgress.star_role_fit_score}
              secondaryRole={phaseProgress.secondary_role}
              secondaryRoleFitScore={phaseProgress.secondary_role_fit_score}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Target size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('explorationDashboard.cargandoTuProgreso')}</h3>
                <p className="text-muted-foreground">{t('explorationDashboard.esperaUnMomentoMientras')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Camino a Master */}
        <TabsContent value="path-to-master">
          <PathToMaster
            currentRoles={currentRoles}
            allRoles={allRoles}
            onStartExploration={handleStartExploration}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selfEvalModal && (
        <SelfEvaluationModal
          open={selfEvalModal.open}
          onClose={() => {
            setSelfEvalModal(null);
            loadExplorations();
          }}
          exploration={selfEvalModal.exploration}
          projectName={selfEvalModal.projectName}
        />
      )}

      {feedbackModal && (
        <FeedbackReceivedModal
          open={feedbackModal.open}
          onClose={() => setFeedbackModal(null)}
          explorationPeriodId={feedbackModal.explorationId}
          role={feedbackModal.role}
        />
      )}

      {/* Preview Modal */}
      <ExplorationDashboardPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />

      {/* Help Widget */}
      <HelpWidget section="exploration" />
    </div>
  );
}
