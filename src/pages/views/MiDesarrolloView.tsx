import { useState, useMemo, useEffect } from 'react';
import { Loader2, TrendingUp, Lightbulb, BookOpen, Trophy, Target, Sparkles, GraduationCap } from 'lucide-react';
import { BadgesList } from '@/components/exploration/BadgesList';
import { supabase } from '@/integrations/supabase/client';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRolePerformance, useRoleRankings, type RoleRanking } from '@/hooks/useDevelopment';
import { useProjectMembers, type ProjectMember } from '@/hooks/useNovaData';
import { RolePerformanceCard } from '@/components/development/RolePerformanceCard';
import { InsightsList } from '@/components/development/InsightsList';
import { PlaybookViewer } from '@/components/development/PlaybookViewer';
import { MentorChat } from '@/components/coach/MentorChat';
import { LearningPathList } from '@/components/learning/LearningPathList';
import { LearningPathViewer } from '@/components/learning/LearningPathViewer';
import { LearningPathGenerator } from '@/components/learning/LearningPathGenerator';
import { ROLE_CONFIG } from '@/data/mockData';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { MiDesarrolloPreviewModal } from '@/components/preview/MiDesarrolloPreviewModal';

import { useTranslation } from 'react-i18next';
export function MiDesarrolloView() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // Only real data - no demo mode
  const { data: performances = [], isLoading: loadingPerformance } = useRolePerformance(profile?.id);
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: rankings = [] } = useRoleRankings();

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('rendimiento');
  const [badges, setBadges] = useState<{ earned: Record<string, unknown>[]; all: Record<string, unknown>[] }>({ earned: [], all: [] });
  const [learningPathView, setLearningPathView] = useState<'list' | 'viewer' | 'generator'>('list');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get user's roles
  const userRoles = useMemo(() => {
    const roles = projectMembers
      .filter((pm: ProjectMember) => pm.member_id === profile?.id)
      .map((pm: ProjectMember) => pm.role);
    return [...new Set(roles)] as string[];
  }, [projectMembers, profile?.id]);

  // Get rankings for current user
  const userRankings = useMemo(() => {
    return rankings.reduce((acc: Record<string, { position: number; previousPosition: number | null }>, r: RoleRanking) => {
      if (r.user_id === profile?.id) {
        acc[`${r.role_name}-${r.project_id}`] = {
          position: r.ranking_position,
          previousPosition: r.previous_position,
        };
      }
      return acc;
    }, {} as Record<string, { position: number; previousPosition: number | null }>);
  }, [rankings, profile?.id]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (performances.length === 0) return null;
    
    const avgTaskRate = performances.reduce((sum, p) => sum + p.task_completion_rate, 0) / performances.length;
    const totalOBVs = performances.reduce((sum, p) => sum + p.validated_obvs, 0);
    const totalFacturacion = performances.reduce((sum, p) => sum + p.total_facturacion, 0);
    const avgScore = performances.reduce((sum, p) => sum + p.performance_score, 0) / performances.length;
    
    return { avgTaskRate, totalOBVs, totalFacturacion, avgScore };
  }, [performances]);

  useEffect(() => {
    if (profile?.id) {
      loadBadges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadBadges = async () => {
    try {
      const { data: earned } = await supabase
        .from('member_badges')
        .select('*')
        .eq('member_id', profile!.id);

      const { data: all } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('badge_category, points_value', { ascending: false });

      setBadges({ earned: earned || [], all: all || [] });
    } catch (_error) {
      // intentionally empty
    }
  };

  // Learning Path handlers
  const handleSelectPath = (pathId: string) => {
    setSelectedPathId(pathId);
    setLearningPathView('viewer');
  };

  const handleGenerateNew = () => {
    setLearningPathView('generator');
  };

  const handleBackToList = () => {
    setLearningPathView('list');
    setSelectedPathId(null);
  };

  const handlePathGenerated = (pathId: string) => {
    setSelectedPathId(pathId);
    setLearningPathView('viewer');
  };

  // Get current role for coach context
  const currentRole = userRoles.length > 0 ? userRoles[0] : undefined;
  const currentFitScore = performances.length > 0 ? performances[0].performance_score : undefined;

  if (loadingPerformance) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader
        title={t('miDesarrollo.miDesarrollo')}
        subtitle={t('miDesarrollo.trackeaTuPerformancePor')}
        showBackButton={true}
      />

      <div className="p-8">
        {/* How it works */}
        <HowItWorks
          title={t('miDesarrollo.cómoFunciona')}
          description={t('miDesarrollo.sistemaDeDesarrolloProfesional')}
          whatIsIt={t('miDesarrollo.plataformaDeGrowthPersonal')}
          dataInputs={[
            {
              from: t('miDesarrollo.proyectos'),
              items: [
                t('miDesarrollo.rolesAsignadosEnCada'),
                t('miDesarrollo.tareasCompletadasPorRol'),
                t('miDesarrollo.resultadosFinancierosPorProyecto'),
              ],
            },
            {
              from: t('miDesarrollo.centroObvs'),
              items: [
                t('miDesarrollo.obvsCompletadasPorTi'),
                t('gamification.obvsValidadasQuality'),
                t('miDesarrollo.objetivosCumplidos'),
              ],
            },
            {
              from: t('miDesarrollo.kpis'),
              items: [
                t('miDesarrollo.learningPathsCompletados'),
                t('miDesarrollo.bookPointsAcumulados'),
                t('miDesarrollo.communityPoints'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('miDesarrollo.fitScorePorRol'),
              items: [
                t('miDesarrollo.puntuación0100DeTu'),
                t('miDesarrollo.comparativaConTopPerformers'),
                t('miDesarrollo.rankingDentroDelProyecto'),
              ],
            },
            {
              to: t('gamification.insightsIA'),
              items: [
                t('gamification.queEstasHaciendoBien'),
                t('miDesarrollo.áreasDeMejoraEspecíficas'),
                t('miDesarrollo.accionesRecomendadasParaSubir'),
              ],
            },
            {
              to: t('miDesarrollo.playbooksPersonalizados'),
              items: [
                t('gamification.bestPractices'),
                t('miDesarrollo.templatesYFrameworksEspecíficos'),
                t('miDesarrollo.recursosDeAprendizajeCurados'),
              ],
            },
          ]}
          nextStep={{
            action: t('miDesarrollo.revisaTuFitScore'),
            destination: t('miDesarrollo.usaKpisParaTrackear'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.avgScore.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.puntuaciónPromedio')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Target className="text-success" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.avgTaskRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.completitudTareas')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="text-amber-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.totalOBVs}</p>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.obvsValidadas')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userRoles.length}</p>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.rolesActivos')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="rendimiento" className="gap-2">
                <TrendingUp size={16} />{t('miDesarrollo.rendimiento')}</TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb size={16} />{t('miDesarrollo.insights')}</TabsTrigger>
              <TabsTrigger value="playbook" className="gap-2">
                <BookOpen size={16} />{t('miDesarrollo.playbook')}</TabsTrigger>
              <TabsTrigger value="coach" className="gap-2">
                <Sparkles size={16} />
                {t('gamification.coachIA')}
              </TabsTrigger>
              <TabsTrigger value="learning-paths" className="gap-2">
                <GraduationCap size={16} />{t('miDesarrollo.learningPaths')}</TabsTrigger>
              <TabsTrigger value="logros" className="gap-2">
                <Trophy size={16} />{t('miDesarrollo.logros')}</TabsTrigger>
            </TabsList>

            {activeTab === 'rendimiento' && userRoles.length > 0 && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('miDesarrollo.filtrarPorRol')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('miDesarrollo.todosLosRoles')}</SelectItem>
                  {userRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_CONFIG[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Rendimiento Tab */}
          <TabsContent value="rendimiento">
            {performances.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <TrendingUp size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">{t('miDesarrollo.sinDatosDeRendimiento')}</h3>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.necesitasEstarAsignadoA')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performances
                  .filter(p => selectedRole === 'all' || p.role_name === selectedRole)
                  .map(performance => (
                    <RolePerformanceCard
                      key={`${performance.project_id}-${performance.role_name}`}
                      performance={performance}
                      ranking={userRankings[`${performance.role_name}-${performance.project_id}`]}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardContent className="p-6">
                <InsightsList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playbook Tab */}
          <TabsContent value="playbook">
            {userRoles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">{t('miDesarrollo.sinRolesAsignados')}</h3>
                  <p className="text-sm text-muted-foreground">{t('miDesarrollo.úneteAUnProyecto')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {userRoles.map(role => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <Badge
                        key={role}
                        variant={selectedRole === role ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => setSelectedRole(role)}
                        style={selectedRole === role ? {} : { borderColor: config?.color, color: config?.color }}
                      >
                        {config?.icon && <config.icon size={14} className="mr-1" />}
                        {config?.label || role}
                      </Badge>
                    );
                  })}
                </div>
                
                {selectedRole && selectedRole !== 'all' && (
                  <PlaybookViewer roleName={selectedRole} />
                )}
                
                {selectedRole === 'all' && userRoles.length > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">{t('miDesarrollo.seleccionaUnRolPara')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Coach IA Tab */}
          <TabsContent value="coach">
            <MentorChat currentRole={currentRole} fitScore={currentFitScore} />
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="learning-paths">
            {learningPathView === 'list' && (
              <LearningPathList
                onSelectPath={handleSelectPath}
                onGenerateNew={handleGenerateNew}
              />
            )}
            {learningPathView === 'viewer' && selectedPathId && (
              <LearningPathViewer
                pathId={selectedPathId}
                onBack={handleBackToList}
              />
            )}
            {learningPathView === 'generator' && (
              <LearningPathGenerator
                onComplete={handlePathGenerated}
                onCancel={handleBackToList}
              />
            )}
          </TabsContent>

          {/* Logros */}
          <TabsContent value="logros">
            <BadgesList earnedBadges={badges.earned} allBadges={badges.all} />
          </TabsContent>
        </Tabs>
      </div>

      <HelpWidget section="mi-desarrollo" />
      <MiDesarrolloPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
