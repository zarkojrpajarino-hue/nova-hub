import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PhaseHorizon = 'soon' | 'stable' | 'gradual' | 'correction' | null;

// ── Derivation ────────────────────────────────────────────────────────────────
// Fuente: phaseState + últimas 2 entradas de phaseHistory.
// Fase 4 → null (ya no hay fase siguiente).
// Sin 2 puntos de historia → null (no inventar trayectoria).

export function derivePhaseHorizon(
  phaseState: ProjectEngineData['phaseState'],
  phaseHistory: ProjectEngineData['phaseHistory'],
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

  // Pronto: señal dura cumplida + score alto
  if (hardSignal && score >= 80) return 'soon';

  // Avance estable: progresión clara
  if (scoreDelta >= 10 && score >= 50) return 'stable';

  // Avance gradual: positivo pero lento
  return 'gradual';
}

// ── Config ────────────────────────────────────────────────────────────────────

const HORIZON_CONFIG: Record<NonNullable<PhaseHorizon>, {
  copy: string;
  icon: LucideIcon;
  className: string;
}> = {
  soon:       { copy: 'progreso estable hacia la siguiente fase',  icon: TrendingUp,   className: 'text-success'          },
  stable:     { copy: 'progreso estable hacia la siguiente fase',  icon: TrendingUp,   className: 'text-success'          },
  gradual:    { copy: 'aún faltan varias iteraciones',             icon: Clock,        className: 'text-muted-foreground' },
  correction: { copy: 'fase en corrección antes de avanzar',      icon: TrendingDown, className: 'text-warning'          },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PhaseHorizonHintProps {
  engineData: ProjectEngineData | null | undefined;
}

export function PhaseHorizonHint({ engineData }: PhaseHorizonHintProps) {
  const horizon = derivePhaseHorizon(
    engineData?.phaseState ?? null,
    engineData?.phaseHistory ?? [],
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
