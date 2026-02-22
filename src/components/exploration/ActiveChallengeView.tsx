/**
 * ACTIVE CHALLENGE VIEW
 *
 * Muestra desafíos activos en tiempo real con métricas actualizadas
 * Visualización clara de quién va ganando
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Trophy, Target, TrendingUp, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeMetrics {
  tasks_completed: number;
  tasks_on_time_percent: number;
  obvs_validated: number;
  feedback_score: number;
  initiative: number;
}

interface ActiveChallengeViewProps {
  challengeId: string;
  role: string;
  challengeType: 'performance' | 'project' | 'peer_vote';
  startDate: string;
  endDate: string;
  masterName: string;
  challengerName: string;
  masterMetrics: ChallengeMetrics;
  challengerMetrics: ChallengeMetrics;
  votingProgress?: {
    total_voters: number;
    votes_cast: number;
  };
}

export function ActiveChallengeView({
  challengeId: _challengeId,
  role,
  challengeType,
  startDate: _startDate,
  endDate,
  masterName,
  challengerName,
  masterMetrics,
  challengerMetrics,
  votingProgress,
}: ActiveChallengeViewProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [masterScore, setMasterScore] = useState<number>(0);
  const [challengerScore, setChallengerScore] = useState<number>(0);

  // Countdown en tiempo real
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('¡Desafío finalizado!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      setTimeRemaining(`${days} días, ${hours} horas`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  // Calcular puntuaciones en tiempo real (solo para Performance Battle)
  useEffect(() => {
    if (challengeType === 'performance') {
      // Fórmula: 30% tasks + 20% on-time + 20% obvs + 20% feedback + 10% initiative
      const calculateScore = (metrics: ChallengeMetrics) => {
        const tasksScore = (metrics.tasks_completed / 10) * 30; // Max 10 tasks
        const onTimeScore = metrics.tasks_on_time_percent * 0.2;
        const obvsScore = (metrics.obvs_validated / 10) * 20; // Max 10 obvs
        const feedbackScore = (metrics.feedback_score / 5) * 20; // Max 5.0
        const initiativeScore = (metrics.initiative / 5) * 10; // Max 5

        return tasksScore + onTimeScore + obvsScore + feedbackScore + initiativeScore;
      };

      setMasterScore(calculateScore(masterMetrics));
      setChallengerScore(calculateScore(challengerMetrics));
    }
  }, [challengeType, masterMetrics, challengerMetrics]);

  const renderPerformanceBattle = () => {
    const metrics = [
      {
        label: 'Tasks completadas',
        weight: '30%',
        masterValue: masterMetrics.tasks_completed,
        challengerValue: challengerMetrics.tasks_completed,
        max: 10,
        icon: <CheckCircle2 size={16} />,
      },
      {
        label: 'Tasks a tiempo',
        weight: '20%',
        masterValue: masterMetrics.tasks_on_time_percent,
        challengerValue: challengerMetrics.tasks_on_time_percent,
        max: 100,
        icon: <Clock size={16} />,
        suffix: '%',
      },
      {
        label: 'OBVs validados',
        weight: '20%',
        masterValue: masterMetrics.obvs_validated,
        challengerValue: challengerMetrics.obvs_validated,
        max: 10,
        icon: <Target size={16} />,
      },
      {
        label: 'Feedback score',
        weight: '20%',
        masterValue: masterMetrics.feedback_score,
        challengerValue: challengerMetrics.feedback_score,
        max: 5,
        icon: <TrendingUp size={16} />,
        decimals: 1,
      },
      {
        label: 'Iniciativa',
        weight: '10%',
        masterValue: masterMetrics.initiative,
        challengerValue: challengerMetrics.initiative,
        max: 5,
        icon: <Zap size={16} />,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Métricas individuales */}
        {metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="font-medium">{metric.label}</span>
                <Badge variant="outline" className="text-xs">
                  {metric.weight}
                </Badge>
              </div>
            </div>

            {/* Comparación visual */}
            <div className="grid grid-cols-2 gap-4">
              {/* Master */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">👑 {masterName}</span>
                  <span className="font-bold">
                    {metric.decimals
                      ? metric.masterValue.toFixed(metric.decimals)
                      : metric.masterValue}
                    {metric.suffix || ''}/{metric.max}
                    {metric.suffix || ''}
                  </span>
                </div>
                <Progress
                  value={(metric.masterValue / metric.max) * 100}
                  className="h-2"
                />
              </div>

              {/* Challenger */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">🥊 {challengerName}</span>
                  <span className="font-bold">
                    {metric.decimals
                      ? metric.challengerValue.toFixed(metric.decimals)
                      : metric.challengerValue}
                    {metric.suffix || ''}/{metric.max}
                    {metric.suffix || ''}
                  </span>
                </div>
                <Progress
                  value={(metric.challengerValue / metric.max) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Puntuación total */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">🏆 PUNTUACIÓN TOTAL</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Master */}
            <Card className={cn('border-2', masterScore > challengerScore && 'border-amber-500')}>
              <CardContent className="p-4 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className="text-2xl">
                    {masterName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{masterName}</p>
                <p className="text-xs text-muted-foreground mb-2">Master Actual</p>
                <div className="text-3xl font-bold text-amber-500">
                  {masterScore.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">/100 puntos</p>
              </CardContent>
            </Card>

            {/* Challenger */}
            <Card
              className={cn('border-2', challengerScore > masterScore && 'border-primary')}
            >
              <CardContent className="p-4 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className="text-2xl">
                    {challengerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{challengerName}</p>
                <p className="text-xs text-muted-foreground mb-2">Retador</p>
                <div className="text-3xl font-bold text-primary">
                  {challengerScore.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">/100 puntos</p>
              </CardContent>
            </Card>
          </div>

          {/* Ganador actual */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-1">Ganador Actual</p>
            <p className="text-xl font-bold">
              {masterScore > challengerScore
                ? `👑 ${masterName}`
                : challengerScore > masterScore
                ? `🥊 ${challengerName}`
                : '🤝 Empate'}
            </p>
            {masterScore !== challengerScore && (
              <p className="text-sm text-muted-foreground mt-1">
                {masterScore > challengerScore ? challengerName : masterName} está a{' '}
                {Math.abs(masterScore - challengerScore).toFixed(0)} puntos
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPeerVote = () => {
    if (!votingProgress) return null;

    const votingPercent =
      (votingProgress.votes_cast / votingProgress.total_voters) * 100;

    return (
      <div className="space-y-6">
        {/* Progreso de votación */}
        <Card className="border-2 border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">📊 Progreso de Votación</h4>
                <Badge variant="secondary">
                  {votingProgress.votes_cast}/{votingProgress.total_voters} votos
                </Badge>
              </div>
              <Progress value={votingPercent} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {votingPercent < 100
                  ? `Faltan ${votingProgress.total_voters - votingProgress.votes_cast} personas por votar`
                  : 'Todos han votado - Resultados se revelan al finalizar'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Perfiles */}
        <div className="grid grid-cols-2 gap-4">
          {/* Master */}
          <Card>
            <CardContent className="p-4">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarFallback className="text-3xl">
                  {masterName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-bold text-center mb-2">👑 {masterName}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fit Score:</span>
                  <span className="font-bold">{masterMetrics.feedback_score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proyectos:</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo Master:</span>
                  <span className="font-bold">4 meses</span>
                </div>
              </div>
              <div className="mt-3 p-2 rounded bg-amber-500/10 text-center">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Necesita: 51% de votos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Challenger */}
          <Card>
            <CardContent className="p-4">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarFallback className="text-3xl">
                  {challengerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-bold text-center mb-2">🥊 {challengerName}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fit Score:</span>
                  <span className="font-bold">
                    {challengerMetrics.feedback_score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proyectos:</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semanas:</span>
                  <span className="font-bold">6</span>
                </div>
              </div>
              <div className="mt-3 p-2 rounded bg-primary/10 text-center">
                <p className="text-xs font-semibold text-primary">Necesita: 60% de votos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nota sobre resultados */}
        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            🔒 Los resultados de la votación son anónimos y se revelarán automáticamente
            cuando finalice el desafío
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                ⚔️ Desafío Activo:{' '}
                {challengeType === 'performance'
                  ? 'Performance Battle'
                  : challengeType === 'project'
                  ? 'Project Showdown'
                  : 'Peer Vote'}
              </h3>
              <p className="text-sm text-muted-foreground font-normal">
                Rol: {role}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <Clock size={20} />
              {timeRemaining}
            </div>
            <p className="text-xs text-muted-foreground">Tiempo restante</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {challengeType === 'performance' && renderPerformanceBattle()}
        {challengeType === 'peer_vote' && renderPeerVote()}
        {challengeType === 'project' && (
          <div className="text-center p-8 text-muted-foreground">
            Project Showdown en progreso - Los resultados se evaluarán al finalizar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
