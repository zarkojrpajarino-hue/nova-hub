/**
 * PATH TO MASTER PAGE
 *
 * Página dedicada que explica TODO el sistema de forma intuitiva
 * Incluye: Qué es, Cómo funciona, Requisitos, Tipos de desafío, FAQ
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  HelpCircle,
  Trophy,
  Target,
  Clock,
  Users,
  TrendingUp,
  Zap,
  BookOpen,
} from 'lucide-react';
import { PathToMaster } from '@/components/exploration/PathToMaster';
import { PathToMasterProgress } from '@/components/exploration/PathToMasterProgress';
import { ActiveChallengeView } from '@/components/exploration/ActiveChallengeView';
// import { ChallengeChecker } from '@/components/challenges/ChallengeChecker';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { CaminoMasterPreviewModal } from '@/components/preview/CaminoMasterPreviewModal';

import { useTranslation } from 'react-i18next';
export function PathToMasterPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { goBack, canGoBack } = useNavigation();
  const [activeExploration, setActiveExploration] = useState<Record<string, unknown> | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Record<string, unknown> | null>(null);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallengeRole, setSelectedChallengeRole] = useState<string>('sales');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const allRoles = [
    'sales',
    'finance',
    'ai_tech',
    'marketing',
    'operations',
    'strategy',
    'customer',
  ];

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Obtener member_id
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user!.id)
        .single();

      if (!member) return;

      // Cargar exploración activa t('pathToMaster.caminoAMaster0')
      const { data: exploration } = await supabase
        .from('path_to_master_active')
        .select('*')
        .eq('member_id', member.id)
        .single();

      setActiveExploration(exploration);

      // Cargar desafío activo (si existe)
      const { data: challenge } = await supabase
        .from('master_challenges')
        .select('*')
        .or(`master_id.eq.${member.id},challenger_id.eq.${member.id}`)
        .eq('status', 'in_progress')
        .single();

      setActiveChallenge(challenge);

      // Cargar roles actuales
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
    } finally {
      setLoading(false);
    }
  };

  const handleStartExploration = async (role: string) => {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user!.id)
      .single();

    const { error } = await supabase.rpc('start_path_to_master', {
      p_member_id: member!.id,
      p_role: role,
      p_project_id: null,
    });

    if (!error) {
      loadData(); // Recargar
    }
  };

  if (loading) {
    return <div className="p-6">{t('pathToMaster.cargando')}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      {canGoBack && (
        <BackButton onClick={goBack} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Rocket className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold">🚀 Camino a Master</h1>
            <p className="text-muted-foreground">{t('pathToMaster.dominaCualquierRolDesafía')}</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <HowItWorks
        title={t('pathToMaster.cómoFunciona1')}
        description={t('pathToMaster.sistemaDeMaestríaEn')}
        whatIsIt={t('pathToMaster.programaAvanzadoDondePuedes')}
        dataInputs={[
          {
            from: t('pathToMaster.exploraciónDeRoles'),
            items: [
              t('pathToMaster.tuFitScorePromedio'),
              t('pathToMaster.semanasAcumuladasExplorandoEse'),
              t('pathToMaster.rankingActualEnEl'),
            ],
          },
          {
            from: t('pathToMaster.proyectos'),
            items: [
              'Tareas completadas a tiempo (% de cumplimiento)',
              t('pathToMaster.obvsValidadasRelacionadasCon'),
              t('pathToMaster.performanceEnProyectosCon'),
            ],
          },
          {
            from: 'Equipo (Peer Feedback)',
            items: [
              t('pathToMaster.feedbackPositivosRecibidosDel'),
              t('pathToMaster.validaciónDeSoftSkills'),
            ],
          },
        ]}
        dataOutputs={[
          {
            to: t('pathToMaster.badgeDeMaster'),
            items: [
              'Si ganas el desafío, recibes badge público de "Master of [Rol]"',
              t('pathToMaster.aparecesEnRankingsComo'),
              t('pathToMaster.tuNombreApareceEn'),
            ],
          },
          {
            to: t('pathToMaster.miDesarrollo'),
            items: [
              t('pathToMaster.masterRoleSeConvierte'),
              t('pathToMaster.playbooksAvanzadosDeMaster'),
              t('pathToMaster.insightsIaEspecíficosPara'),
            ],
          },
          {
            to: t('pathToMaster.oportunidades'),
            items: [
              t('pathToMaster.prioridadEnProyectosQue'),
              t('pathToMaster.posibilidadDeMentorearA'),
              t('pathToMaster.credibilidadProfesionalValidadaObjetivamente'),
            ],
          },
        ]}
        nextStep={{
          action: t('pathToMaster.completaExploraciónCumple6'),
          destination: t('pathToMaster.veAMiProgreso'),
        }}
        onViewPreview={() => setShowPreviewModal(true)}
      />

      <Tabs defaultValue={activeExploration ? 'mi-progreso' : 'que-es'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="que-es" className="gap-2">
            <BookOpen size={16} />{t('pathToMaster.quéEs')}</TabsTrigger>
          <TabsTrigger value="mi-progreso" className="gap-2">
            <Target size={16} />{t('pathToMaster.miProgreso')}</TabsTrigger>
          <TabsTrigger value="explorar" className="gap-2">
            <Rocket size={16} />{t('pathToMaster.explorarRol')}</TabsTrigger>
          <TabsTrigger value="desafios" className="gap-2">
            <Trophy size={16} />{t('pathToMaster.desafíos')}</TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle size={16} />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* ¿QUÉ ES? */}
        <TabsContent value="que-es" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📖 ¿Qué es t('pathToMaster.caminoAMaster0')?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-base">
                <strong>{t('pathToMaster.caminoAMaster')}</strong> es un sistema que te permite{' '}
                <strong>explorar y dominar CUALQUIER rol</strong> de la empresa, incluso si
                ya tienes roles asignados en Fase 3.
              </p>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  💡 Concepto Principal
                </h4>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>✅ Siempre abierto - explora cuando quieras</li>
                  <li>✅ No hay límite de roles que puedes aprender</li>
                  <li>✅ Basado 100% en datos objetivos</li>
                  <li>✅ Puedes desafiar al Master actual si cumples requisitos</li>
                  <li>✅ Todo es transparente y público</li>
                </ul>
              </div>

              <h4 className="font-semibold text-lg mt-6">{t('pathToMaster.cómoFunciona')}</h4>

              <div className="space-y-4">
                {/* Paso 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold">{t('pathToMaster.seleccionaUnRol')}</h5>
                    <p className="text-muted-foreground text-sm">
                      Elige cualquier rol que quieras aprender (Sales, Finance, AI Tech,
                      Marketing, etc.)
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold">Explora (2-4 semanas)</h5>
                    <p className="text-muted-foreground text-sm">
                      Trabajas en proyectos con ese rol, completas tareas, recibes feedback.
                      Tu progreso se trackea automáticamente en tiempo real.
                    </p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold">Especialízate (2-4 semanas)</h5>
                    <p className="text-muted-foreground text-sm">
                      Sube tu fit score completando más tareas a tiempo, recibiendo feedback
                      positivo, validando OBVs.
                    </p>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold">{t('pathToMaster.desafíaAlMaster')}</h5>
                    <p className="text-muted-foreground text-sm">
                      Si cumples TODOS los requisitos, puedes desafiar al Master actual del
                      rol en una competencia directa.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requisitos */}
          <Card className="border-2 border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-amber-500" />
                Requisitos para Desafiar (TODOS obligatorios)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.fitScore')}</h5>
                  </div>
                  <p className="text-2xl font-bold">4.2+</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.promedioDeTusExploraciones')}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.experiencia')}</h5>
                  </div>
                  <p className="text-2xl font-bold">4+ semanas</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.mínimoEnElRol')}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.ranking')}</h5>
                  </div>
                  <p className="text-2xl font-bold">Top 3</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.delLeaderboard')}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.tareasATiempo')}</h5>
                  </div>
                  <p className="text-2xl font-bold">80%+</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.consistenciaEnEntregas')}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.feedback')}</h5>
                  </div>
                  <p className="text-2xl font-bold">3+ positivos</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.validaciónDelEquipo')}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-primary" />
                    <h5 className="font-semibold">{t('pathToMaster.obvs')}</h5>
                  </div>
                  <p className="text-2xl font-bold">2+ validados</p>
                  <p className="text-xs text-muted-foreground">{t('pathToMaster.objetivosCompletados')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Desafío */}
          <Card>
            <CardHeader>
              <CardTitle>⚔️ Tipos de Desafío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-2">
                <h5 className="font-bold mb-2">1️⃣ Performance Battle (2 semanas)</h5>
                <p className="text-sm text-muted-foreground mb-2">{t('pathToMaster.competenciaDirectaEnMétricas')}</p>
                <p className="text-sm">
                  <strong>Ganador:</strong> Quien tenga mayor puntuación (fórmula
                  transparente)
                </p>
              </div>

              <div className="p-4 rounded-lg border-2">
                <h5 className="font-bold mb-2">2️⃣ Project Showdown (3 semanas)</h5>
                <p className="text-sm text-muted-foreground mb-2">{t('pathToMaster.ambosLideranUnProyecto')}</p>
                <p className="text-sm">
                  <strong>Ganador:</strong>{t('pathToMaster.quienTengaMayorDe')}</p>
              </div>

              <div className="p-4 rounded-lg border-2">
                <h5 className="font-bold mb-2">3️⃣ Peer Vote (1 semana)</h5>
                <p className="text-sm text-muted-foreground mb-2">{t('pathToMaster.elEquipoVotaDirectamente')}</p>
                <p className="text-sm">
                  <strong>Ganador:</strong> Master necesita 51%, Retador necesita 60%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MI PROGRESO */}
        <TabsContent value="mi-progreso">
          {activeExploration ? (
            <PathToMasterProgress
              explorationId={activeExploration.id}
              role={activeExploration.role}
              startDate={activeExploration.start_date}
              endDate={activeExploration.end_date}
              currentFitScore={activeExploration.fit_score || 0}
              currentRanking={null}
              weeksExplored={Math.floor((activeExploration.duration_days || 0) / 7)}
              tasksCompleted={activeExploration.tasks_completed || 0}
              tasksOnTime={activeExploration.tasks_on_time || 0}
              totalTasks={(activeExploration.tasks_completed || 0) + 2}
              positiveFeedback={5}
              obvsValidated={activeExploration.obvs_validated || 0}
              masterName={t('pathToMaster.pedro')}
              masterFitScore={4.7}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Rocket size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">{t('pathToMaster.noTienesNingunaExploración')}</p>
                <Button onClick={() => {}}>{t('pathToMaster.comenzarExploración')}</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EXPLORAR ROL */}
        <TabsContent value="explorar">
          <PathToMaster
            currentRoles={currentRoles}
            allRoles={allRoles}
            onStartExploration={handleStartExploration}
          />
        </TabsContent>

        {/* DESAFÍOS */}
        <TabsContent value="desafios" className="space-y-6">
          {activeChallenge ? (
            <ActiveChallengeView {...activeChallenge} />
          ) : (
            <>
              {/* Selector de Rol */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('pathToMaster.seleccionaUnRolPara')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {allRoles.map((role) => (
                      <Button
                        key={role}
                        variant={selectedChallengeRole === role ? 'default' : 'outline'}
                        onClick={() => setSelectedChallengeRole(role)}
                        className="capitalize"
                      >
                        {role.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Checker - TEMPORALMENTE DESHABILITADO */}
              {/* <ChallengeChecker
                role={selectedChallengeRole}
                currentUserId={user!.id}
                onChallengeSuccess={() => {
                  loadData();
                }}
              /> */}

              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('pathToMaster.sistemaDeDesafíosTemporalmente')}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-4">
          {[
            {
              q: t('pathToMaster.puedoExplorarVariosRoles'),
              a: 'No, solo puedes tener UNA exploración Camino a Master activa a la vez. Termina la actual antes de empezar otra.',
            },
            {
              q: t('pathToMaster.quéPasaSiNo'),
              a: t('pathToMaster.puedesExtenderLaExploración'),
            },
            {
              q: t('pathToMaster.puedoDesafiarAlMismo'),
              a: 'Sí, pero el Master tiene un "cooldown" de 3 meses entre desafíos. Si lo desafiaste hace 2 meses, debes esperar 1 mes más.',
            },
            {
              q: t('pathToMaster.quéPasaSiGano'),
              a: 'Te conviertes en el nuevo Master del rol, ganas un badge especial, y ese rol puede convertirse en tu "rol estrella" si quieres.',
            },
            {
              q: t('pathToMaster.quéPasaSiPierdo'),
              a: t('pathToMaster.nadaMaloPuedesIntentarlo'),
            },
            {
              q: t('pathToMaster.losRequisitosSonNegociables'),
              a: t('pathToMaster.noSonObjetivosY'),
            },
            {
              q: t('pathToMaster.puedoVerElProgreso'),
              a: t('pathToMaster.síTodoEsPúblico'),
            },
          ].map((faq, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base flex items-start gap-2">
                  <HelpCircle size={18} className="flex-shrink-0 mt-1" />
                  {faq.q}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <HelpWidget section="path-to-master" />

      <CaminoMasterPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
}
