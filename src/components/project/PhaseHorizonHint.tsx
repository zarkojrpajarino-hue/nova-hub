import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

import { useTranslation } from 'react-i18next';
// ── Types ─────────────────────────────────────────────────────────────────────

export type PhaseHorizon = 'soon' | 'stable' | 'gradual' | 'correction' | 'counter_trend' | null;

// ── Derivation ────────────────────────────────────────────────────────────────
// Fuente: phaseState + últimas 2 entradas de phaseHistory.
// Fase 4 → null (ya no hay fase siguiente).
// Sin 2 puntos de historia → null (no inventar trayectoria).

const RISK_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

// eslint-disable-next-line react-refresh/only-export-components
export function derivePhaseHorizon(
  phaseState:   ProjectEngineData['phaseState'],
  phaseHistory: ProjectEngineData['phaseHistory'],
  riskHistory?: ProjectEngineData['riskHistory'],
): PhaseHorizon {
  if (!phaseState || phaseHistory.length < 2) return null;

  // Fase 4 = techo, no hay horizonte de avance
  if (phaseState.current_phase >= 4) return null;

  const curr       = phaseHistory[0];
  const prev       = phaseHistory[1];
  const scoreDelta = Math.round(curr.phase_score - prev.phase_score);
  const score      = Math.round(phaseState.phase_score);
  const hardSignal = phaseState.hard_signal_met;

  // Corrección: delta negativo o plano → no proyectar avance
  if (scoreDelta <= 0) return 'correction';

  // AUD.B.10 — contratendencia: el score avanza pero el riesgo también sube.
  // t('project.fase3CercanaPero') — la fase progresa sobre cimientos inestables.
  const riskWorsening =
    riskHistory != null &&
    riskHistory.length >= 2 &&
    (RISK_ORDER[riskHistory[0].risk_level] ?? 0) > (RISK_ORDER[riskHistory[1].risk_level] ?? 0);

  // Pronto: señal dura cumplida + score alto
  if (hardSignal && score >= 80) return riskWorsening ? 'counter_trend' : 'soon';

  // Avance estable: progresión clara
  if (scoreDelta >= 10 && score >= 50) return riskWorsening ? 'counter_trend' : 'stable';

  // Avance gradual: positivo pero lento (riskWorsening ya implica counter_trend en casos anteriores)
  return 'gradual';
}

// ── Config ────────────────────────────────────────────────────────────────────

const HORIZON_CONFIG: Record<NonNullable<PhaseHorizon>, {
  copy: string;
  icon: LucideIcon;
  className: string;
}> = {
  soon:          { copy: 'progreso estable hacia la siguiente fase',           icon: TrendingUp,   className: 'text-success'          },
  stable:        { copy: 'progreso estable hacia la siguiente fase',           icon: TrendingUp,   className: 'text-success'          },
  gradual:       { copy: 'aún faltan varias iteraciones',                      icon: Clock,        className: 'text-muted-foreground' },
  correction:    { copy: 'fase en corrección antes de avanzar',                icon: TrendingDown, className: 'text-warning'          },
  counter_trend: { copy: 'avance de fase con riesgo subiendo — atención aquí', icon: TrendingDown, className: 'text-orange-500'       },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PhaseHorizonHintProps {
  engineData: ProjectEngineData | null | undefined;
}

export function PhaseHorizonHint({ engineData }: PhaseHorizonHintProps) {
  const { t } = useTranslation();
  const horizon = derivePhaseHorizon(
    engineData?.phaseState ?? null,
    engineData?.phaseHistory ?? [],
    engineData?.riskHistory,
  );

  if (!horizon) return null;

  const { copy, icon: Icon, className } = HORIZON_CONFIG[horizon];

  return (
    <div className={`flex items-center gap-1.5 mb-4 ${className}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="text-[11px]">
        <span className="font-medium">Horizonte dinámico:</span> {copy}
      </span>
    </div>
  );
}
