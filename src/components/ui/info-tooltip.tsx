/* eslint-disable react-refresh/only-export-components */
/**
 * INFO TOOLTIP
 *
 * Tooltip reutilizable para explicar métricas y conceptos
 */

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  title: string;
  description: string;
  formula?: string;
  example?: string;
  className?: string;
  iconSize?: number;
}

export function InfoTooltip({
  title,
  description,
  formula,
  example,
  className,
  iconSize = 14,
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn('inline-flex items-center cursor-help', className)} type="button">
            <HelpCircle size={iconSize} className="text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>

            {formula && (
              <div className="p-2 rounded bg-muted/50 border border-border">
                <p className="text-xs font-mono">{formula}</p>
              </div>
            )}

            {example && (
              <div className="pt-2 border-t">
                <p className="text-xs">
                  <strong>Ejemplo:</strong> {example}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Tooltips predefinidos para métricas comunes
export const METRIC_TOOLTIPS = {
  fitScore: {
    title: 'Fit Score',
    description:
      'Puntuación de desempeño en un rol específico. Mide qué tan bien encajas en ese rol basado en datos objetivos y feedback.',
    formula: '50% métricas objetivas + 30% feedback + 20% auto-evaluación',
    example: 'Un Fit Score de 4.2+ te permite desafiar al Master del rol.',
  },
  obvs: {
    title: 'OBVs (Observaciones Basadas en Valor)',
    description:
      'Acciones concretas que generan valor medible: reuniones con clientes, ventas cerradas, experimentos validados, etc.',
    example: 'Demo con cliente, primera venta, validación de hipótesis.',
  },
  tasksOnTime: {
    title: 'Tareas a Tiempo',
    description:
      'Porcentaje de tareas completadas antes o en la fecha límite. Mide tu consistencia y fiabilidad.',
    formula: '(Tareas a tiempo / Total de tareas) × 100',
    example: 'Si completas 8 de 10 tareas a tiempo, tienes 80%.',
  },
  ranking: {
    title: 'Ranking del Rol',
    description:
      'Tu posición en el leaderboard del rol, ordenado por Fit Score. Se actualiza semanalmente.',
    example: 'Top 3 es requisito para desafiar al Master.',
  },
  peerFeedback: {
    title: 'Feedback de Compañeros',
    description:
      'Evaluaciones que tus compañeros hacen de tu desempeño en el rol. Vale 30% del Fit Score.',
    example: 'Necesitas mínimo 3 feedbacks positivos para desafiar.',
  },
  badges: {
    title: 'Badges y Logros',
    description:
      'Insignias que ganas al completar desafíos, fases y hitos específicos. Algunos son únicos y muy difíciles de conseguir.',
    example: 'Badge "Invencible" requiere defender tu título de Master 3 veces.',
  },
  challenges: {
    title: 'Desafíos a Masters',
    description:
      'Competencias formales donde puedes disputar el título de Master de un rol. Requiere cumplir 8 requisitos estrictos.',
    example: 'Performance Battle: competir en métricas durante 2 semanas.',
  },
  phase: {
    title: 'Fase Actual',
    description:
      'Tu progreso en el "Camino a Master": Fase 1 (Exploración), Fase 2 (Especialización), Fase 3 (Master).',
    example: 'En Fase 1 exploras 4 roles diferentes, 1 semana cada uno.',
  },
  consistency: {
    title: 'Consistencia',
    description:
      'Varianza en tu Fit Score a lo largo del tiempo. Baja varianza indica desempeño estable.',
    formula: 'Varianza < 0.5 es requisito para desafiar',
    example: 'Fit scores de 4.2, 4.3, 4.1 = alta consistencia (baja varianza).',
  },
  leadConversion: {
    title: 'Conversión de Leads',
    description: 'Porcentaje de leads que se convierten en clientes de pago.',
    formula: '(Leads ganados / Total de leads) × 100',
    example: '5 leads ganados de 20 totales = 25% conversión.',
  },
};
