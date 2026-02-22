/**
 * 🤖 AI FACILITATOR
 *
 * Facilitador inteligente que da recomendaciones proactivas durante la reunión
 * Funcionalidades:
 * - Alertas de tiempo (si te pasas de la duración estimada)
 * - Recordatorios de objetivos no cubiertos
 * - Sugerencias para cerrar temas
 * - Recomendaciones basadas en el tipo de reunión
 * - Alertas de energía del equipo
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  Users,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AIFacilitatorProps {
  meetingType: string;
  objectives?: string;
  estimatedDurationMin: number;
  recordingTime: number; // en segundos
  isMinimized?: boolean;
}

interface Recommendation {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: string;
  dismissed: boolean;
}

export function AIFacilitator({
  meetingType,
  objectives,
  estimatedDurationMin,
  recordingTime,
  isMinimized = false,
}: AIFacilitatorProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [minimized, setMinimized] = useState(isMinimized);

  // Calcular progreso de tiempo
  const timeProgress = useMemo(() => {
    const estimatedSeconds = estimatedDurationMin * 60;
    return (recordingTime / estimatedSeconds) * 100;
  }, [recordingTime, estimatedDurationMin]);

  const minutesElapsed = Math.floor(recordingTime / 60);
  const minutesRemaining = estimatedDurationMin - minutesElapsed;

  /**
   * Genera recomendaciones basadas en el contexto actual
   */
  useEffect(() => {
    const newRecommendations: Recommendation[] = [];

    // 1. Alertas de tiempo
    if (timeProgress >= 90) {
      newRecommendations.push({
        id: 'time-90',
        type: 'warning',
        icon: AlertTriangle,
        title: 'Tiempo casi agotado',
        message: `Quedan ${minutesRemaining} minutos. Considera comenzar a cerrar la reunión.`,
        action: 'Cerrar temas',
        dismissed: false,
      });
    } else if (timeProgress >= 75) {
      newRecommendations.push({
        id: 'time-75',
        type: 'warning',
        icon: Clock,
        title: 'Entrando en el tramo final',
        message: `Quedan ${minutesRemaining} minutos. Es buen momento para resumir acuerdos.`,
        action: 'Resumir',
        dismissed: false,
      });
    } else if (timeProgress >= 50) {
      newRecommendations.push({
        id: 'time-50',
        type: 'info',
        icon: Clock,
        title: 'Mitad del tiempo',
        message: 'Llevas el 50% del tiempo. Verifica que estés avanzando según lo planeado.',
        dismissed: false,
      });
    }

    // 2. Recomendaciones según tipo de reunión
    const meetingTypeRecommendations = getMeetingTypeRecommendations(
      meetingType,
      minutesElapsed,
      timeProgress
    );
    newRecommendations.push(...meetingTypeRecommendations);

    // 3. Recomendación de energía (cada 30 minutos)
    if (minutesElapsed > 0 && minutesElapsed % 30 === 0) {
      newRecommendations.push({
        id: `energy-${minutesElapsed}`,
        type: 'tip',
        icon: Zap,
        title: 'Momento para un break',
        message: `Llevas ${minutesElapsed} minutos. Considera hacer una pausa de 2-3 minutos.`,
        action: 'Pausar',
        dismissed: false,
      });
    }

    // 4. Recordatorio de objetivos (a los 10 minutos si hay objetivos)
    if (objectives && minutesElapsed === 10) {
      newRecommendations.push({
        id: 'objectives-reminder',
        type: 'info',
        icon: Target,
        title: 'Verifica los objetivos',
        message: 'Revisa que estés abordando los objetivos planteados para esta reunión.',
        dismissed: false,
      });
    }

    // Actualizar recomendaciones (mantener las no descartadas)
    setRecommendations((prev) => {
      // Mantener recomendaciones anteriores no descartadas
      const existingDismissed = prev.filter((r) => r.dismissed);

      // Filtrar nuevas recomendaciones que no hayan sido descartadas antes
      const filtered = newRecommendations.filter(
        (newRec) => !existingDismissed.some((dismissed) => dismissed.id === newRec.id)
      );

      // Combinar, evitando duplicados
      const combined = [...prev.filter((r) => !r.dismissed), ...filtered];

      // Eliminar duplicados por ID
      const unique = combined.reduce((acc, rec) => {
        if (!acc.some((r) => r.id === rec.id)) {
          acc.push(rec);
        }
        return acc;
      }, [] as Recommendation[]);

      return unique;
    });
  }, [recordingTime, meetingType, objectives, timeProgress, minutesElapsed, minutesRemaining]);

  /**
   * Descarta una recomendación
   */
  const dismissRecommendation = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, dismissed: true } : rec))
    );
  };

  const activeRecommendations = recommendations.filter((r) => !r.dismissed);

  if (activeRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50">
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
            IA Facilitador
            {activeRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeRecommendations.length}
              </Badge>
            )}
          </CardTitle>
          {minimized ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </CardHeader>

      {!minimized && (
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          {activeRecommendations.map((rec) => {
            const Icon = rec.icon;
            const colors = {
              warning: {
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                text: 'text-orange-900',
                icon: 'text-orange-600',
              },
              info: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-900',
                icon: 'text-blue-600',
              },
              success: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-900',
                icon: 'text-green-600',
              },
              tip: {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-900',
                icon: 'text-purple-600',
              },
            };

            const colorScheme = colors[rec.type];

            return (
              <Alert
                key={rec.id}
                className={`${colorScheme.bg} ${colorScheme.border} relative`}
              >
                <Icon className={`h-4 w-4 ${colorScheme.icon}`} />
                <AlertDescription className={colorScheme.text}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{rec.title}</p>
                      <p className="text-xs mt-1">{rec.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissRecommendation(rec.id)}
                      className="h-6 w-6 p-0 hover:bg-white/50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {rec.action && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        💡 {rec.action}
                      </Badge>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Genera recomendaciones específicas según el tipo de reunión
 */
function getMeetingTypeRecommendations(
  meetingType: string,
  minutesElapsed: number,
  timeProgress: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  switch (meetingType) {
    case 'sprint_planning':
      if (minutesElapsed === 15) {
        recommendations.push({
          id: 'sprint-15',
          type: 'info',
          icon: Target,
          title: 'Sprint Planning Check',
          message: '¿Ya revisaste las user stories y su priorización?',
          dismissed: false,
        });
      }
      if (timeProgress >= 70) {
        recommendations.push({
          id: 'sprint-70',
          type: 'tip',
          icon: CheckCircle2,
          title: 'Cierre de Sprint Planning',
          message: 'Asegúrate de tener: capacidad del equipo, tareas estimadas y sprint goal claro.',
          dismissed: false,
        });
      }
      break;

    case 'retrospective':
      if (minutesElapsed === 10) {
        recommendations.push({
          id: 'retro-10',
          type: 'tip',
          icon: Users,
          title: 'Fomenta la participación',
          message: '¿Todos han compartido al menos una opinión? Pregunta a quienes no han hablado.',
          dismissed: false,
        });
      }
      if (timeProgress >= 60) {
        recommendations.push({
          id: 'retro-60',
          type: 'info',
          icon: TrendingUp,
          title: 'Define acciones concretas',
          message: 'Momento de convertir feedback en action items para el próximo sprint.',
          dismissed: false,
        });
      }
      break;

    case 'one_on_one':
      if (minutesElapsed === 5) {
        recommendations.push({
          id: '1on1-5',
          type: 'tip',
          icon: Users,
          title: 'Crea espacio seguro',
          message: 'Pregunta cómo se siente la persona antes de entrar en temas de trabajo.',
          dismissed: false,
        });
      }
      if (timeProgress >= 75) {
        recommendations.push({
          id: '1on1-75',
          type: 'info',
          icon: Target,
          title: 'Define próximos pasos',
          message: '¿Quedaron claros los objetivos y el apoyo que darás?',
          dismissed: false,
        });
      }
      break;

    case 'quarterly_planning':
      if (minutesElapsed === 20) {
        recommendations.push({
          id: 'quarterly-20',
          type: 'info',
          icon: Target,
          title: 'Revisa OKRs',
          message: '¿Ya definieron los Objectives y Key Results principales del trimestre?',
          dismissed: false,
        });
      }
      if (timeProgress >= 80) {
        recommendations.push({
          id: 'quarterly-80',
          type: 'warning',
          icon: AlertTriangle,
          title: 'Verifica alineación',
          message: 'Asegúrate de que los OKRs estén alineados con la estrategia de la compañía.',
          dismissed: false,
        });
      }
      break;

    case 'client_demo':
      if (minutesElapsed === 5) {
        recommendations.push({
          id: 'demo-5',
          type: 'tip',
          icon: Sparkles,
          title: 'Comienza con contexto',
          message: 'Recuerda al cliente el problema que resuelven las features que mostrarás.',
          dismissed: false,
        });
      }
      if (timeProgress >= 65) {
        recommendations.push({
          id: 'demo-65',
          type: 'info',
          icon: Target,
          title: 'Recolecta feedback',
          message: 'Pregunta específicamente qué les gustó y qué mejorarían.',
          dismissed: false,
        });
      }
      break;

    case 'daily_standup':
      if (minutesElapsed === 10) {
        recommendations.push({
          id: 'daily-10',
          type: 'warning',
          icon: Clock,
          title: 'Daily muy largo',
          message: 'Los standups deben ser breves (5-15 min). Considera tomar temas offline.',
          dismissed: false,
        });
      }
      break;

    default:
      // Recomendaciones generales
      if (minutesElapsed === 20) {
        recommendations.push({
          id: 'general-20',
          type: 'info',
          icon: CheckCircle2,
          title: 'Check de progreso',
          message: '¿Estás avanzando en los temas clave? Ajusta si es necesario.',
          dismissed: false,
        });
      }
      break;
  }

  return recommendations;
}
