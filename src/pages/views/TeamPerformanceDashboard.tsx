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
  CheckCircle2,
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
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { TeamPerformancePreviewModal } from '@/components/preview/TeamPerformancePreviewModal';

interface TeamPerformanceDashboardProps {
  isDemoMode?: boolean; // Viene de FeatureGate cuando está bloqueado
}

// Componente interno que renderiza el contenido
function TeamPerformanceContent({ isDemoMode = false }: TeamPerformanceDashboardProps = {}) {
  const { user } = useAuth();
  const { goBack, canGoBack } = useNavigation();
  const { currentProject: contextProject } = useCurrentProject();
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [explorations, setExplorations] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [roleInsights, setRoleInsights] = useState<any[]>([]);
  const [selectedInsightRole, setSelectedInsightRole] = useState<string>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    loadRoleInsights();
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
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
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
    } catch (error) {
      console.error('Error loading project data:', error);
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
    } catch (error) {
      console.error('Error loading insights:', error);
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
          <h1 className="text-3xl font-bold">Vista Global de Equipos</h1>
        </div>
        <div className="px-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos aún</h3>
              <p className="text-muted-foreground">
                Cuando se creen proyectos, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentProject = myProjects.find((p) => p.id === selectedProject);
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
          <BarChart3 className="text-primary" />
          Vista Global de Equipos
        </h1>
        <p className="text-muted-foreground mt-2">
          Vista consolidada de performance de todos los equipos y proyectos
        </p>
      </div>

      {/* How it works */}
      <div className="px-6">
        <HowItWorks
          title="Cómo funciona"
          description="Dashboard para Project Owners/Admins monitorear salud del equipo"
          whatIsIt="Vista agregada que muestra exploraciones activas de roles en TODOS los proyectos, fit scores promedio por equipo, competencias en curso, y alertas de atención (ej: exploraciones sin feedback suficiente). Diseñado para owners/managers que necesitan visibilidad cross-proyecto del progreso del equipo en encontrar sus roles ideales."
          dataInputs={[
            {
              from: 'Exploración de Roles',
              items: [
                'Exploraciones activas por proyecto',
                'Fit Scores actuales de cada miembro en su rol',
                'Feedback pendiente de dar/recibir',
              ],
            },
            {
              from: 'Camino a Master',
              items: [
                'Competencias activas entre miembros',
                'Progreso hacia requisitos de Master',
              ],
            },
            {
              from: 'Rankings',
              items: [
                'Ranking consolidado de todos los proyectos',
                'Tendencias de fit score del equipo',
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Insights de equipo',
              items: [
                'Qué equipos necesitan atención (bajo fit score promedio)',
                'Exploraciones que expiran pronto sin completar',
                'Miembros sin feedback suficiente',
              ],
            },
            {
              to: 'Recomendaciones IA',
              items: [
                'Sugerencias de rotación de roles entre proyectos',
                'Qué miembros deberían cambiar de rol',
                'Gaps de talento en cada proyecto',
              ],
            },
          ]}
          nextStep={{
            action: 'Identifica problemas de equipo → Toma acciones (rotaciones, feedback, support)',
            destination: 'Filtra por proyecto para deep dive, o ve a Rotación para proponer cambios',
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
            <CardTitle className="text-sm font-medium">Exploraciones Activas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Requieren Atención</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsAttention.length}</div>
            <p className="text-xs text-muted-foreground">
              Períodos finalizados o con poco feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fit Score Promedio</CardTitle>
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
            <p className="text-xs text-muted-foreground">Del equipo actual</p>
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
            <BarChart3 size={16} />
            Matriz de Fit
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb size={16} />
            Insights del Equipo
          </TabsTrigger>
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
                <h3 className="text-lg font-semibold mb-2">Sin exploraciones activas</h3>
                <p className="text-muted-foreground">
                  Agrega miembros al proyecto para iniciar exploraciones
                </p>
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
                              <Badge variant="secondary">En competencia</Badge>
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
                          {isExpired ? 'Finalizado' : `${daysRemaining}d`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{exp.tasks_completed || 0}</div>
                          <div className="text-xs text-muted-foreground">Tareas</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{exp.obvs_completed || 0}</div>
                          <div className="text-xs text-muted-foreground">OBVs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {exp.peer_feedback_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Feedback</div>
                        </div>
                      </div>

                      {/* Fit Score */}
                      {exp.fit_score && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Fit Score</span>
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
                              <span>Período finalizado - Requiere decisión</span>
                            </div>
                          )}
                          {needsFeedback && (
                            <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-500/10 p-2 rounded">
                              <AlertTriangle size={16} className="mt-0.5" />
                              <span>Poco feedback recibido - Solicitar a más miembros</span>
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
                <h3 className="text-lg font-semibold mb-2">Sin competencias activas</h3>
                <p className="text-muted-foreground">
                  Las competencias aparecen cuando 2+ usuarios exploran el mismo rol
                </p>
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
              <CardTitle>Matriz de Fit Scores por Miembro</CardTitle>
              <CardDescription>
                Visualiza el desempeño de cada miembro en diferentes roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {explorations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Sin datos de exploraciones aún
                </p>
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
