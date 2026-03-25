/**
 * PI27.4 — PhaseRunwayIndicator
 *
 * Muestra estimación de semanas hasta la siguiente fase.
 * Integrado en PhaseRoadmap (sección expandida).
 */

import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { estimatePhaseRunway, type PhaseRunwayInput } from '@/lib/phase-runway-estimator';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
interface PhaseRunwayIndicatorProps {
  engineData: ProjectEngineData;
  scoreHistory: number[];  // últimas 8 semanas
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: t('project.altaConfianza'),
  medium: t('project.confianzaMedia'),
  low: t('project.pocaData'),
};

export function PhaseRunwayIndicator({ engineData, scoreHistory }: PhaseRunwayIndicatorProps) {
  const { t } = useTranslation();
  if (!engineData.phaseState) return null;

  const ps = engineData.phaseState;
  if (ps.current_phase >= 4 && ps.graduated) return null;  // No runway for graduated

  const input: PhaseRunwayInput = {
    currentPhase: ps.current_phase,
    currentScore: ps.phase_score,
    scoreHistory,
    hardSignalMet: ps.hard_signal_met,
    iterationVelocity: 2, // Default — no tenemos velocity en el frontend query
  };

  const estimate = estimatePhaseRunway(input);

  if (estimate.weeksEstimate === 'ready') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
      <div className="flex justify-end mb-2"><SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.4} size="sm" /></div>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>{estimate.explanation}</span>
      </div>
    );
  }

  if (estimate.weeksEstimate === 'stalled') {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div>
          <span>{estimate.explanation}</span>
          <span className="text-[10px] text-muted-foreground ml-1">({CONFIDENCE_LABELS[estimate.confidence]})</span>
        </div>
      </div>
    );
  }

  const weeks = estimate.weeksEstimate;
  const color = weeks <= 3 ? 'text-green-600 bg-green-50' : weeks <= 8 ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg p-2 ${color}`}>
      <Clock className="h-4 w-4 shrink-0" />
      <div>
        <span className="font-medium">~{weeks} semana{weeks > 1 ? 's' : ''}</span>
        <span className="ml-1">{estimate.explanation}</span>
        <span className="text-[10px] text-muted-foreground ml-1">({CONFIDENCE_LABELS[estimate.confidence]})</span>
      </div>
    </div>
  );
}
