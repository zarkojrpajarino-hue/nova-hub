/**
 * EXPLORATION PROGRESS CARD
 *
 * Muestra el progreso de un período de exploración de rol
 * - Días restantes
 * - Tareas completadas
 * - Fit score actual
 * - Acciones disponibles
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExplorationProgressCardProps {
  exploration: {
    id: string;
    role: string;
    start_date: string;
    end_date: string;
    tasks_completed: number;
    obvs_completed: number;
    fit_score: number | null;
    peer_feedback_count: number;
    peer_feedback_avg: number | null;
    competing_with: string[] | null;
    status: string;
  };
  projectName: string;
  onSelfEvaluate?: () => void;
  onViewFeedback?: () => void;
}

export function ExplorationProgressCard({
  exploration,
  projectName,
  onSelfEvaluate,
  onViewFeedback,
}: ExplorationProgressCardProps) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(exploration.end_date);
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setDaysRemaining(0);
        setHoursRemaining(0);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      setDaysRemaining(days);
      setHoursRemaining(hours);
      setIsExpired(false);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [exploration.end_date]);

  const isCompeting = exploration.competing_with && exploration.competing_with.length > 0;
  const needsSelfEval = isExpired && exploration.status === 'active';
  const hasMinimalFeedback = exploration.peer_feedback_count < 2;

  // Colores según días restantes
  const urgencyColor = daysRemaining <= 2 ? 'text-red-600' : daysRemaining <= 5 ? 'text-yellow-600' : 'text-green-600';
  const urgencyBg = daysRemaining <= 2 ? 'bg-red-500/10' : daysRemaining <= 5 ? 'bg-yellow-500/10' : 'bg-green-500/10';

  return (
    <Card className={cn(
      'hover-lift transition-all',
      isExpired && 'border-yellow-500',
      isCompeting && 'border-purple-500'
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 capitalize">
              {exploration.role}
              {isCompeting && (
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                  <Users size={12} className="mr-1" />
                  En Competencia
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{projectName}</CardDescription>
          </div>

          {/* Countdown */}
          <div className={cn(
            'flex flex-col items-end gap-1 px-3 py-2 rounded-lg',
            urgencyBg
          )}>
            <div className={cn('flex items-center gap-1 text-sm font-bold', urgencyColor)}>
              <Clock size={14} />
              {isExpired ? (
                <span>Finalizado</span>
              ) : daysRemaining === 0 ? (
                <span>{hoursRemaining}h</span>
              ) : (
                <span>{daysRemaining}d {hoursRemaining}h</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {isExpired ? 'Requiere evaluación' : 'restantes'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Métricas de Progreso */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={16} />
              <span>Tareas</span>
            </div>
            <p className="text-2xl font-bold">{exploration.tasks_completed}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target size={16} />
              <span>OBVs</span>
            </div>
            <p className="text-2xl font-bold">{exploration.obvs_completed}</p>
          </div>
        </div>

        {/* Fit Score */}
        {exploration.fit_score !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp size={16} className="text-primary" />
                <span>Fit Score Actual</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {exploration.fit_score.toFixed(1)}
              </span>
            </div>
            <Progress value={(exploration.fit_score / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {exploration.fit_score >= 4.0 ? '✅ Excelente' : exploration.fit_score >= 3.0 ? '⚠️ Puede mejorar' : '❌ Bajo'}
            </p>
          </div>
        )}

        {/* Peer Feedback */}
        <div className={cn(
          'p-3 rounded-lg',
          hasMinimalFeedback ? 'bg-yellow-500/10' : 'bg-green-500/10'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className={hasMinimalFeedback ? 'text-yellow-600' : 'text-green-600'} />
              <span className="text-sm font-medium">Feedback Recibido</span>
            </div>
            <Badge variant={hasMinimalFeedback ? 'secondary' : 'default'}>
              {exploration.peer_feedback_count} evaluaciones
            </Badge>
          </div>

          {exploration.peer_feedback_avg && (
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {exploration.peer_feedback_avg.toFixed(1)}/5.0
            </p>
          )}
        </div>

        {/* Warnings/Alerts */}
        {needsSelfEval && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-yellow-600">Acción requerida</p>
              <p className="text-muted-foreground">Completa tu auto-evaluación para finalizar el período</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {needsSelfEval && onSelfEvaluate && (
            <Button onClick={onSelfEvaluate} className="flex-1" size="sm">
              Completar Auto-Evaluación
            </Button>
          )}

          {onViewFeedback && exploration.peer_feedback_count > 0 && (
            <Button onClick={onViewFeedback} variant="outline" className="flex-1" size="sm">
              Ver Feedback ({exploration.peer_feedback_count})
            </Button>
          )}
        </div>

        {/* Competencia Info */}
        {isCompeting && (
          <div className="text-xs text-center text-muted-foreground p-2 bg-purple-500/5 rounded">
            Compitiendo con {exploration.competing_with!.length} persona(s) más
          </div>
        )}
      </CardContent>
    </Card>
  );
}
