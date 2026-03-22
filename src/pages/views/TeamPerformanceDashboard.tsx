/**
 * TEAM PERFORMANCE DASHBOARD
 *
 * Dashboard para Project Owners ver:
 * - Exploraciones activas de su equipo
 * - Matriz de fit scores por rol
 * - Competencias en curso
 * - Sugerencias de rotación
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  Trophy,
  AlertTriangle,
  Clock,
  TrendingUp,
  Lightbulb,
  Calendar,
} from 'lucide-react';
import { RoleInsightsPanel } from '@/components/exploration/RoleInsightsPanel';
import { OneOnOnePrep } from '@/components/team/OneOnOnePrep';
import { OptimalScheduleSuggester } from '@/components/team/OptimalScheduleSuggester';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { TeamPerformancePreviewModal } from '@/components/preview/TeamPerformancePreviewModal';

import { useTranslation } from 'react-i18next';
interface TeamPerformanceDashboardProps {
  isDemoMode?: boolean; // Viene de FeatureGate cuando está bloqueado
}

// Componente interno que renderiza el contenido
function TeamPerformanceContent({ isDemoMode: _isDemoMode = false }: TeamPerformanceDashboardProps = {}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { goBack, canGoBack } = useNavigation();
  const { currentProject: _contextProject } = useCurrentProject();
  const [myProjects, setMyProjects] = useState<Record<string, unknown>[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [explorations, setExplorations] = useState<Record<string, unknown>[]>([]);
  const [competitions, setCompetitions] = useState<Record<string, unknown>[]>([]);
  const [roleInsights, setRoleInsights] = useState<Record<string, unknown>[]>([]);
  const [selectedInsightRole, setSelectedInsightRole] = useState<string>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    loadRoleInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInsightRole]);

  const loadData = async () => {
    try {
      // TODOS LOS PROYECTOS (no solo mis proyectos)
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('nombre', { ascending: true });

      setMyProjects(projects || []);

      if (projects && projects.length > 0) {
        setSelectedProject(projects[0].id);
        await loadProjectData(projects[0].id);
      }
    } catch (_error) {
      toast.error(t('teamPerformanceDashboard.errorAlCargarLos'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    try {
      // Exploraciones activas en el proyecto
      const { data: exp } = await supabase
        .from('role_exploration_periods')
        .select(`
          *,
          member:members(id, nombre, email)
        `)
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      setExplorations(exp || []);

      // Competencias activas
      const { data: comp } = await supabase
        .from('active_role_competitions')
        .select('*')
        .eq('project_id', projectId);

      setCompetitions(comp || []);
    } catch (_error) {
      // intentionally empty
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    loadProjectData(projectId);
  };

  const loadRoleInsights = async () => {
    try {
      const { data } = await supabase
        .from('role_insights')
        .select('*')
        .eq('role', selectedInsightRole)
        .order('created_at', { ascending: false });

      setRoleInsights(data || []);
    } catch (_error) {
      // intentionally empty
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (myProjects.length === 0) {
    return (
      <div className="space-y-6">
        {canGoBack && (
          <div className="px-6 pt-6">
            <BackButton onClick={goBack} />
          </div>
        )}
        <div className="px-6">
          <h1 className="text-3xl font-bold">{t('teamPerformanceDashboard.vistaGlobalDeEquipos')}</h1>
        </div>
        <div className="px-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('teamPerformanceDashboard.noHayProyectosAún')}</h3>
              <p className="text-muted-foreground">{t('teamPerformanceDashboard.cuandoSeCreenProyectos')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const _currentProject = myProjects.find((p) => p.id === selectedProject);
  const needsAttention = explorations.filter(
    (e) => new Date(e.end_date) <= new Date() || (e.peer_feedback_count || 0) < 2
  );

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
          <BarChart3 className="text-primary" />{t('teamPerformanceDashboard.vistaGlobalDeEquipos')}</h1>
        <p className="text-muted-foreground mt-2">{t('teamPerformanceDashboard.vistaConsolidadaDePerformance')}</p>
      </div>

      {/* How it works */}
      <div className="px-6">
        <HowItWorks
          title={t('teamPerformanceDashboard.cómoFunciona')}
          description={t('teamPerformanceDashboard.dashboardParaProjectOwnersadmins')}
          whatIsIt={t('teamPerformanceDashboard.vistaAgregadaQueMuestra')}
          dataInputs={[
            {
              from: t('teamPerformanceDashboard.exploraciónDeRoles'),
              items: [
                t('teamPerformanceDashboard.exploracionesActivasPorProyecto'),
                t('teamPerformanceDashboard.fitScoresActualesDe'),
                t('teamPerformanceDashboard.feedbackPendienteDeDarrecibir'),
              ],
            },
            {
              from: t('teamPerformanceDashboard.caminoAMaster'),
              items: [
                t('teamPerformanceDashboard.competenciasActivasEntreMiembros'),
                t('teamPerformanceDashboard.progresoHaciaRequisitosDe'),
              ],
            },
            {
              from: t('teamPerformanceDashboard.rankings'),
              items: [
                t('teamPerformanceDashboard.rankingConsolidadoDeTodos'),
                t('teamPerformanceDashboard.tendenciasDeFitScore'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('teamPerformanceDashboard.insightsDeEquipo'),
              items: [
                'Qué equipos necesitan atención (bajo fit score promedio)',
                t('teamPerformanceDashboard.exploracionesQueExpiranPronto'),
                t('teamPerformanceDashboard.miembrosSinFeedbackSuficiente'),
              ],
            },
            {
              to: 'Recomendaciones IA',
              items: [
                t('teamPerformanceDashboard.sugerenciasDeRotaciónDe'),
                t('teamPerformanceDashboard.quéMiembrosDeberíanCambiar'),
                t('teamPerformanceDashboard.gapsDeTalentoEn'),
              ],
            },
          ]}
          nextStep={{
            action: 'Identifica problemas de equipo → Toma acciones (rotaciones, feedback, support)',
            destination: t('teamPerformanceDashboard.filtraPorProyectoPara'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
          premiumFeature="advanced_analytics"
          requiredPlan="advanced"
        />
      </div>

      {/* Project Selector */}
      {myProjects.length > 1 && (
        <div className="flex gap-2 px-6">
          {myProjects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? 'default' : 'outline'}
              onClick={() => handleProjectChange(project.id)}
            >
              {project.nombre}
            </Button>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('teamPerformanceDashboard.exploracionesActivas')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{explorations.length}</div>
            <p className="text-xs text-muted-foreground">
              {competitions.length} en competencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('teamPerformanceDashboard.requierenAtención')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsAttention.length}</div>
            <p className="text-xs text-muted-foreground">{t('teamPerformanceDashboard.períodosFinalizadosOCon')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('teamPerformanceDashboard.fitScorePromedio')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {explorations.length > 0
                ? (
                    explorations.reduce((acc, e) => acc + (e.fit_score || 0), 0) /
                    explorations.filter((e) => e.fit_score).length
                  ).toFixed(1)
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">{t('teamPerformanceDashboard.delEquipoActual')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-6 px-6">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Clock size={16} />
            Exploraciones Activas
            {explorations.length > 0 && (
              <Badge variant="secondary">{explorations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="competitions" className="gap-2">
            <Trophy size={16} />
            Competencias
            {competitions.length > 0 && (
              <Badge variant="secondary">{competitions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <BarChart3 size={16} />{t('teamPerformanceDashboard.matrizDeFit')}</TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb size={16} />{t('teamPerformanceDashboard.insightsDelEquipo')}</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar size={16} />
            Agendar Reunión IA
          </TabsTrigger>
          <TabsTrigger value="one-on-one" className="gap-2">
            <Calendar size={16} />
            Preparar 1-on-1
          </TabsTrigger>
        </TabsList>

        {/* Active Explorations */}
        <TabsContent value="active" className="space-y-4">
          {explorations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('teamPerformanceDashboard.sinExploracionesActivas')}</h3>
                <p className="text-muted-foreground">{t('teamPerformanceDashboard.agregaMiembrosAlProyecto')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {explorations.map((exp) => {
                const daysRemaining = Math.max(
                  0,
                  Math.ceil(
                    (new Date(exp.end_date).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                );
                const isExpired = daysRemaining === 0;
                const needsFeedback = (exp.peer_feedback_count || 0) < 2;

                return (
                  <Card key={exp.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="capitalize flex items-center gap-2">
                            {exp.member?.nombre}
                            {exp.competing_with && exp.competing_with.length > 0 && (
                              <Badge variant="secondary">{t('teamPerformanceDashboard.enCompetencia')}</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {exp.role}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={isExpired ? 'destructive' : 'secondary'}
                          className="gap-1"
                        >
                          <Clock size={12} />
                          {isExpired ? 'Finalizado': `${daysRemaining}d`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{exp.tasks_completed || 0}</div>
                          <div className="text-xs text-muted-foreground">{t('teamPerformanceDashboard.tareas')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{exp.obvs_completed || 0}</div>
                          <div className="text-xs text-muted-foreground">{t('teamPerformanceDashboard.obvs')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {exp.peer_feedback_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('teamPerformanceDashboard.feedback')}</div>
                        </div>
                      </div>

                      {/* Fit Score */}
                      {exp.fit_score && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('teamPerformanceDashboard.fitScore')}</span>
                            <span className="font-bold text-primary">{exp.fit_score.toFixed(1)}/5.0</span>
                          </div>
                          <Progress value={(exp.fit_score / 5) * 100} className="h-2" />
                        </div>
                      )}

                      {/* Alerts */}
                      {(isExpired || needsFeedback) && (
                        <div className="space-y-2">
                          {isExpired && (
                            <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-500/10 p-2 rounded">
                              <AlertTriangle size={16} className="mt-0.5" />
                              <span>{t('teamPerformanceDashboard.períodoFinalizadoRequiereDecisión')}</span>
                            </div>
                          )}
                          {needsFeedback && (
                            <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-500/10 p-2 rounded">
                              <AlertTriangle size={16} className="mt-0.5" />
                              <span>{t('teamPerformanceDashboard.pocoFeedbackRecibidoSolicitar')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Competitions */}
        <TabsContent value="competitions" className="space-y-4">
          {competitions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('teamPerformanceDashboard.sinCompetenciasActivas')}</h3>
                <p className="text-muted-foreground">{t('teamPerformanceDashboard.lasCompetenciasAparecenCuando')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {competitions.map((comp, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      <Trophy className="text-yellow-600" />
                      {comp.role}
                    </CardTitle>
                    <CardDescription>
                      {comp.participants_count} participantes compitiendo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Participantes:</span>
                        <span className="text-sm font-medium">
                          {comp.participant_names?.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fit Score más alto:</span>
                        <span className="text-lg font-bold text-primary">
                          {comp.top_fit_score?.toFixed(1) || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Finaliza:</span>
                        <span className="text-sm">
                          {new Date(comp.competition_end_date).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fit Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('teamPerformanceDashboard.matrizDeFitScores')}</CardTitle>
              <CardDescription>{t('teamPerformanceDashboard.visualizaElDesempeñoDe')}</CardDescription>
            </CardHeader>
            <CardContent>
              {explorations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('teamPerformanceDashboard.sinDatosDeExploraciones')}</p>
              ) : (
                <div className="space-y-3">
                  {explorations.map((exp) => (
                    <div key={exp.id} className="flex items-center gap-4">
                      <div className="w-32 font-medium truncate">{exp.member?.nombre}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <Badge variant="outline" className="capitalize w-24">
                          {exp.role}
                        </Badge>
                        <Progress
                          value={exp.fit_score ? (exp.fit_score / 5) * 100 : 0}
                          className="h-3 flex-1"
                        />
                        <span className="w-12 text-right font-bold">
                          {exp.fit_score ? exp.fit_score.toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights del Equipo */}
        <TabsContent value="insights">
          <div className="space-y-4">
            {/* Selector de rol */}
            <div className="flex gap-2 flex-wrap">
              {['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'customer'].map((role) => (
                <Button
                  key={role}
                  variant={selectedInsightRole === role ? 'default' : 'outline'}
                  onClick={() => setSelectedInsightRole(role)}
                  className="capitalize"
                >
                  {role.replace('_', ' ')}
                </Button>
              ))}
            </div>

            {/* Panel de insights */}
            <RoleInsightsPanel
              role={selectedInsightRole}
              insights={roleInsights}
              currentUserId={user?.id}
            />
          </div>
        </TabsContent>

        {/* Optimal Schedule */}
        <TabsContent value="schedule">
          <OptimalScheduleSuggester />
        </TabsContent>

        {/* One-on-One Prep */}
        <TabsContent value="one-on-one">
          <OneOnOnePrep />
        </TabsContent>
      </Tabs>

      <HelpWidget section="team-performance" />

      <TeamPerformancePreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
}

// Componente principal exportado SIN FeatureGate
// Vista Global es accesible para todos
export function TeamPerformanceDashboard(props: TeamPerformanceDashboardProps) {
  return <TeamPerformanceContent {...props} />;
}
