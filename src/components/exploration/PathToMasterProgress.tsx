/**
 * PATH TO MASTER PROGRESS
 *
 * Componente visual con countdown en tiempo real, roadmap y requisitos
 * Muestra EXACTAMENTE dónde está el usuario y qué le falta
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathToMasterProgressProps {
  explorationId: string;
  role: string;
  startDate: string;
  endDate: string;
  currentFitScore: number;
  currentRanking: number | null;
  weeksExplored: number;
  tasksCompleted: number;
  tasksOnTime: number;
  totalTasks: number;
  positiveFeedback: number;
  obvsValidated: number;
  masterName: string;
  masterFitScore: number;
}

interface Requirement {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  met: boolean;
  icon: React.ReactNode;
  description: string;
}

export function PathToMasterProgress({
  explorationId: _explorationId,
  role,
  startDate,
  endDate,
  currentFitScore,
  currentRanking,
  weeksExplored,
  tasksCompleted,
  tasksOnTime,
  totalTasks,
  positiveFeedback,
  obvsValidated,
  masterName,
  masterFitScore,
}: PathToMasterProgressProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Calcular tiempo restante en tiempo real
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('¡Exploración completada!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [endDate]);

  // Calcular progreso general
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percent = Math.min(Math.max((elapsed / total) * 100, 0), 100);

    setProgressPercent(percent);
  }, [startDate, endDate]);

  // Calcular % de tareas a tiempo
  const tasksOnTimePercent = totalTasks > 0 ? (tasksOnTime / totalTasks) * 100 : 0;

  // Valores seguros con fallbacks
  const safeFitScore = currentFitScore || 0;
  const safeWeeksExplored = weeksExplored || 0;
  const safeRanking = currentRanking || 99;
  const safeTasksOnTimePercent = isNaN(tasksOnTimePercent) ? 0 : tasksOnTimePercent;
  const safePositiveFeedback = positiveFeedback || 0;
  const safeObvsValidated = obvsValidated || 0;

  // Requisitos para desafiar
  const requirements: Requirement[] = [
    {
      id: 'fit_score',
      label: 'Fit Score',
      current: safeFitScore,
      target: 4.2,
      unit: '',
      met: safeFitScore >= 4.2,
      icon: <TrendingUp size={16} />,
      description: 'Promedio de rendimiento en el rol',
    },
    {
      id: 'weeks',
      label: 'Semanas Explorando',
      current: safeWeeksExplored,
      target: 4,
      unit: 'sem',
      met: safeWeeksExplored >= 4,
      icon: <Clock size={16} />,
      description: 'Experiencia mínima requerida',
    },
    {
      id: 'ranking',
      label: 'Ranking',
      current: safeRanking,
      target: 3,
      unit: '',
      met: currentRanking !== null && currentRanking <= 3,
      icon: <Trophy size={16} />,
      description: 'Posición en el leaderboard del rol',
    },
    {
      id: 'tasks_on_time',
      label: 'Tareas a Tiempo',
      current: safeTasksOnTimePercent,
      target: 80,
      unit: '%',
      met: safeTasksOnTimePercent >= 80,
      icon: <Target size={16} />,
      description: 'Consistencia en entregas',
    },
    {
      id: 'feedback',
      label: 'Feedback Positivo',
      current: safePositiveFeedback,
      target: 3,
      unit: '',
      met: safePositiveFeedback >= 3,
      icon: <CheckCircle2 size={16} />,
      description: 'Validación del equipo',
    },
    {
      id: 'obvs',
      label: 'OBVs Validados',
      current: safeObvsValidated,
      target: 2,
      unit: '',
      met: safeObvsValidated >= 2,
      icon: <CheckCircle2 size={16} />,
      description: 'Objetivos de negocio completados',
    },
  ];

  const requirementsMet = requirements.filter((r) => r.met).length;
  const allRequirementsMet = requirementsMet === requirements.length;

  // Gap con el Master
  const fitScoreGap = masterFitScore - currentFitScore;

  return (
    <div className="space-y-6">
      {/* Header con Countdown */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Trophy className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Camino a Master - {role}</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Tu progreso hacia el desafío
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Clock size={24} />
                {timeRemaining}
              </div>
              <p className="text-xs text-muted-foreground">Tiempo restante</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso general</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Visual */}
      <Card>
        <CardHeader>
          <CardTitle>📍 Roadmap de Aprendizaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fase 1: Exploración */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              <h4 className="font-semibold">Semana 1-2: Exploración Básica</h4>
              <Badge variant="secondary">Completado</Badge>
            </div>
            <div className="ml-7 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span>Completar 10 tareas [{tasksCompleted}/10]</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span>Recibir 3 feedback [{positiveFeedback}/3]</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span>Validar 2 OBVs [{obvsValidated}/2]</span>
              </div>
            </div>
          </div>

          {/* Fase 2: Especialización */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {weeksExplored >= 3 ? (
                <CheckCircle2 className="text-green-500" size={20} />
              ) : (
                <Circle className="text-muted-foreground" size={20} />
              )}
              <h4 className="font-semibold">Semana 3-4: Especialización</h4>
              {weeksExplored >= 3 ? (
                <Badge variant="secondary">En progreso</Badge>
              ) : (
                <Badge variant="outline">Bloqueado</Badge>
              )}
            </div>
            <div className="ml-7 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {currentFitScore >= 4.0 ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <Circle size={14} className="text-muted-foreground" />
                )}
                <span>
                  Subir fit score a 4.0 [{currentFitScore.toFixed(1)}/4.0]
                </span>
              </div>
              <div className="flex items-center gap-2">
                {tasksOnTimePercent >= 80 ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <Circle size={14} className="text-muted-foreground" />
                )}
                <span>
                  Completar tareas 80% a tiempo [{Math.round(tasksOnTimePercent)}%/80%]
                </span>
              </div>
              <div className="flex items-center gap-2">
                {positiveFeedback >= 3 ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <Circle size={14} className="text-muted-foreground" />
                )}
                <span>Mantener feedback positivo [{positiveFeedback}/3+]</span>
              </div>
            </div>
          </div>

          {/* Fase 3: Elegible para Desafiar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {allRequirementsMet ? (
                <CheckCircle2 className="text-amber-500" size={20} />
              ) : (
                <Lock className="text-muted-foreground" size={20} />
              )}
              <h4 className="font-semibold">Semana 5+: Elegible para Desafiar</h4>
              {allRequirementsMet ? (
                <Badge variant="default" className="bg-amber-500">
                  ¡Disponible!
                </Badge>
              ) : (
                <Badge variant="outline">Bloqueado</Badge>
              )}
            </div>
            <div className="ml-7 space-y-1 text-sm">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-muted-foreground" />
                  )}
                  <span>
                    {req.label}: {(req.current || 0).toFixed(req.unit ? 0 : 1)}
                    {req.unit}/{req.target}
                    {req.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requisitos Detallados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>✅ Requisitos para Desafiar</span>
            <Badge variant={allRequirementsMet ? 'default' : 'secondary'}>
              {requirementsMet}/{requirements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {requirements.map((req) => (
              <Card
                key={req.id}
                className={cn(
                  'border-2',
                  req.met ? 'border-green-500/50 bg-green-500/5' : 'border-muted'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="text-green-500" size={18} />
                      ) : (
                        <Circle className="text-muted-foreground" size={18} />
                      )}
                      <span className="font-semibold text-sm">{req.label}</span>
                    </div>
                    {req.icon}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {req.current.toFixed(req.unit ? 0 : 1)}
                        {req.unit}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {req.target}
                        {req.unit}
                      </span>
                    </div>

                    <Progress
                      value={Math.min((req.current / req.target) * 100, 100)}
                      className="h-2"
                    />

                    <p className="text-xs text-muted-foreground">{req.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximo Hito */}
      {!allRequirementsMet && (
        <Card className="border-2 border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">💡 Próximo Hito</h4>
                {(() => {
                  const nextReq = requirements.find((r) => !r.met);
                  if (!nextReq) return null;

                  const gap = nextReq.target - nextReq.current;

                  return (
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>{nextReq.label}:</strong> Faltan{' '}
                        {gap.toFixed(nextReq.unit ? 0 : 1)}
                        {nextReq.unit} para alcanzar el mínimo
                      </p>
                      <p className="text-muted-foreground">
                        {nextReq.id === 'fit_score' &&
                          'Sugerencia: Completa más tareas a tiempo y recibe feedback positivo'}
                        {nextReq.id === 'weeks' &&
                          `Sugerencia: Continúa trabajando, faltan ${Math.ceil(gap)} semanas`}
                        {nextReq.id === 'ranking' &&
                          'Sugerencia: Sube tu fit score para mejorar tu posición'}
                        {nextReq.id === 'tasks_on_time' &&
                          `Sugerencia: Planifica mejor tus tareas para cumplir deadlines`}
                        {nextReq.id === 'feedback' &&
                          'Sugerencia: Pide feedback a tus compañeros sobre tu trabajo'}
                        {nextReq.id === 'obvs' &&
                          'Sugerencia: Propón y completa objetivos de negocio'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Actual */}
      <Card className="border-2 border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">👑 Master Actual: {masterName}</h4>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fit Score:</span>
                  <span className="font-bold ml-1">{masterFitScore.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tu gap:</span>
                  <span className="font-bold ml-1 text-amber-600">
                    {fitScoreGap.toFixed(1)} puntos
                  </span>
                </div>
              </div>
            </div>
            {allRequirementsMet && (
              <Button size="lg" className="gap-2">
                <Trophy size={16} />
                Crear Desafío
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
