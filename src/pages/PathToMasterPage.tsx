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
import { Badge } from '@/components/ui/badge';
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
  Award,
  BookOpen,
} from 'lucide-react';
import { PathToMaster } from '@/components/exploration/PathToMaster';
import { PathToMasterProgress } from '@/components/exploration/PathToMasterProgress';
import { ActiveChallengeView } from '@/components/exploration/ActiveChallengeView';
import { ChallengeChecker } from '@/components/challenges/ChallengeChecker';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { CaminoMasterPreviewModal } from '@/components/preview/CaminoMasterPreviewModal';

export function PathToMasterPage() {
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

      // Cargar exploración activa "Camino a Master"
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
    } catch (error) {
      console.error('Error loading data:', error);
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
    return <div className="p-6">Cargando...</div>;
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
            <p className="text-muted-foreground">
              Domina cualquier rol, desafía al Master actual y gana tu badge
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <HowItWorks
        title="Cómo funciona"
        description="Sistema de maestría en roles con competencia meritocrática"
        whatIsIt="Programa avanzado donde puedes convertirte en MASTER de cualquier rol (CEO, CTO, CMO, etc.) después de completar Exploración de Roles. Requiere cumplir 6 requisitos objetivos (Fit Score 4.2+, 4+ semanas experiencia, Top 3 ranking, 80%+ tareas a tiempo, 3+ feedback positivos, 2+ OBVs validados). Una vez cumplidos, desafías al Master actual en una competencia pública de 1-3 semanas."
        dataInputs={[
          {
            from: 'Exploración de Roles',
            items: [
              'Tu Fit Score promedio en el rol que quieres masterizar',
              'Semanas acumuladas explorando ese rol',
              'Ranking actual en el leaderboard del rol',
            ],
          },
          {
            from: 'Proyectos',
            items: [
              'Tareas completadas a tiempo (% de cumplimiento)',
              'OBVs validadas relacionadas con el rol',
              'Performance en proyectos con ese rol',
            ],
          },
          {
            from: 'Equipo (Peer Feedback)',
            items: [
              'Feedback positivos recibidos del equipo',
              'Validación de soft skills por peers',
            ],
          },
        ]}
        dataOutputs={[
          {
            to: 'Badge de Master',
            items: [
              'Si ganas el desafío, recibes badge público de "Master of [Rol]"',
              'Apareces en Rankings como Master actual',
              'Tu nombre aparece en Masters Hall of Fame',
            ],
          },
          {
            to: 'Mi Desarrollo',
            items: [
              'Master Role se convierte en tu rol destacado',
              'Playbooks avanzados de Master disponibles',
              'Insights IA específicos para mantener/mejorar maestría',
            ],
          },
          {
            to: 'Oportunidades',
            items: [
              'Prioridad en proyectos que necesiten ese rol',
              'Posibilidad de mentorear a otros en ese rol',
              'Credibilidad profesional validada objetivamente',
            ],
          },
        ]}
        nextStep={{
          action: 'Completa exploración → Cumple 6 requisitos → Desafía Master → Gana competencia',
          destination: 'Ve a Mi Progreso para ver requisitos, Desafíos para lanzar challenge',
        }}
        onViewPreview={() => setShowPreviewModal(true)}
      />

      <Tabs defaultValue={activeExploration ? 'mi-progreso' : 'que-es'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="que-es" className="gap-2">
            <BookOpen size={16} />
            ¿Qué es?
          </TabsTrigger>
          <TabsTrigger value="mi-progreso" className="gap-2">
            <Target size={16} />
            Mi Progreso
          </TabsTrigger>
          <TabsTrigger value="explorar" className="gap-2">
            <Rocket size={16} />
            Explorar Rol
          </TabsTrigger>
          <TabsTrigger value="desafios" className="gap-2">
            <Trophy size={16} />
            Desafíos
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle size={16} />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* ¿QUÉ ES? */}
        <TabsContent value="que-es" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📖 ¿Qué es "Camino a Master"?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-base">
                <strong>Camino a Master</strong> es un sistema que te permite{' '}
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

              <h4 className="font-semibold text-lg mt-6">¿Cómo funciona?</h4>

              <div className="space-y-4">
                {/* Paso 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold">Selecciona un Rol</h5>
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
                    <h5 className="font-semibold">Desafía al Master</h5>
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
                    <h5 className="font-semibold">Fit Score</h5>
                  </div>
                  <p className="text-2xl font-bold">4.2+</p>
                  <p className="text-xs text-muted-foreground">Promedio de tus exploraciones</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-primary" />
                    <h5 className="font-semibold">Experiencia</h5>
                  </div>
                  <p className="text-2xl font-bold">4+ semanas</p>
                  <p className="text-xs text-muted-foreground">Mínimo en el rol</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={18} className="text-primary" />
                    <h5 className="font-semibold">Ranking</h5>
                  </div>
                  <p className="text-2xl font-bold">Top 3</p>
                  <p className="text-xs text-muted-foreground">Del leaderboard</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={18} className="text-primary" />
                    <h5 className="font-semibold">Tareas a Tiempo</h5>
                  </div>
                  <p className="text-2xl font-bold">80%+</p>
                  <p className="text-xs text-muted-foreground">Consistencia en entregas</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-primary" />
                    <h5 className="font-semibold">Feedback</h5>
                  </div>
                  <p className="text-2xl font-bold">3+ positivos</p>
                  <p className="text-xs text-muted-foreground">Validación del equipo</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-primary" />
                    <h5 className="font-semibold">OBVs</h5>
                  </div>
                  <p className="text-2xl font-bold">2+ validados</p>
                  <p className="text-xs text-muted-foreground">Objetivos completados</p>
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
                <p className="text-sm text-muted-foreground mb-2">
                  Competencia directa en métricas objetivas: tasks, OBVs, feedback, etc.
                </p>
                <p className="text-sm">
                  <strong>Ganador:</strong> Quien tenga mayor puntuación (fórmula
                  transparente)
                </p>
              </div>

              <div className="p-4 rounded-lg border-2">
                <h5 className="font-bold mb-2">2️⃣ Project Showdown (3 semanas)</h5>
                <p className="text-sm text-muted-foreground mb-2">
                  Ambos lideran un proyecto y el equipo vota por el mejor
                </p>
                <p className="text-sm">
                  <strong>Ganador:</strong> Quien tenga mayor % de votos del equipo
                </p>
              </div>

              <div className="p-4 rounded-lg border-2">
                <h5 className="font-bold mb-2">3️⃣ Peer Vote (1 semana)</h5>
                <p className="text-sm text-muted-foreground mb-2">
                  El equipo vota directamente sin competencia activa
                </p>
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
              masterName="Pedro"
              masterFitScore={4.7}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Rocket size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No tienes ninguna exploración activa
                </p>
                <Button onClick={() => {}}>Comenzar Exploración</Button>
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
                  <CardTitle>Selecciona un rol para ver requisitos de desafío</CardTitle>
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
                  <p className="text-muted-foreground">
                    Sistema de desafíos temporalmente deshabilitado mientras se arregla un error
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-4">
          {[
            {
              q: '¿Puedo explorar varios roles a la vez?',
              a: 'No, solo puedes tener UNA exploración "Camino a Master" activa a la vez. Termina la actual antes de empezar otra.',
            },
            {
              q: '¿Qué pasa si no cumplo los requisitos a tiempo?',
              a: 'Puedes extender la exploración 1-2 semanas más, o simplemente intentarlo de nuevo más adelante. No hay penalización.',
            },
            {
              q: '¿Puedo desafiar al mismo Master varias veces?',
              a: 'Sí, pero el Master tiene un "cooldown" de 3 meses entre desafíos. Si lo desafiaste hace 2 meses, debes esperar 1 mes más.',
            },
            {
              q: '¿Qué pasa si gano el desafío?',
              a: 'Te conviertes en el nuevo Master del rol, ganas un badge especial, y ese rol puede convertirse en tu "rol estrella" si quieres.',
            },
            {
              q: '¿Qué pasa si pierdo el desafío?',
              a: 'Nada malo. Puedes intentarlo de nuevo después del cooldown. No pierdes tu fit score ni tu progreso.',
            },
            {
              q: '¿Los requisitos son negociables?',
              a: 'No. Son objetivos y públicos para mantener la meritocracia. TODOS deben cumplir los mismos requisitos.',
            },
            {
              q: '¿Puedo ver el progreso de otros?',
              a: 'Sí, todo es público y transparente. Puedes ver el fit score, ranking y progreso de cualquier persona.',
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
