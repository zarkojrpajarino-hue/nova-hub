import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { memo } from 'react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { EngineEmptyState } from './EngineEmptyState';

interface ProbabilityBreakdownProps {
  probability: ProjectEngineData['probability'];
  probabilityHistory: ProjectEngineData['probabilityHistory'];
  onCTA?: () => void;
}

// ── Input config ──────────────────────────────────────────────────────────────

const INPUTS: {
  key: keyof NonNullable<ProjectEngineData['probability']>;
  label: string;
}[] = [
  { key: 'phase_score_input',         label: 'Avance de fase'    },
  { key: 'execution_rate_input',      label: 'Ejecución'         },
  { key: 'validation_strength_input', label: 'Validación'        },
  { key: 'revenue_momentum_input',    label: 'Revenue'           },
  { key: 'capacity_health_input',     label: 'Equipo'            },
];

function inputBarColor(value: number): string {
  if (value >= 70) return 'bg-success';
  if (value >= 40) return 'bg-warning';
  return 'bg-destructive';
}

// ── Trend ─────────────────────────────────────────────────────────────────────

function computeTrend(history: ProjectEngineData['probabilityHistory']): number | null {
  if (history.length < 2) return null;
  const curr = history[0].probability_score;
  const prev = history[1].probability_score;
  if (curr == null || prev == null) return null;
  const delta = Math.round(curr - prev);
  return delta === 0 ? null : delta;
}

// ── Component ─────────────────────────────────────────────────────────────────

function ProbabilityBreakdownComponent({
  probability,
  probabilityHistory,
  onCTA,
}: ProbabilityBreakdownProps) {
  // Sin datos, inactivo o confianza baja (EC13.7: no mostrar número bajo hasta tener datos reales)
  if (!probability || probability.probability_status !== 'active') {
    const isBuilding = probability?.probability_status === 'low_confidence';
    return (
      <EngineEmptyState
        icon={TrendingUp}
        title={
          isBuilding
            ? "El motor se está configurando con los primeros datos"
            : "Aún no hay datos suficientes para estimar la probabilidad de avance"
        }
        description={
          isBuilding
            ? "Continúa añadiendo métricas y actividad para obtener tu primera estimación."
            : "El motor necesita más señales del proyecto para activarse."
        }
        cta={onCTA ? { label: 'Añadir métricas', onClick: onCTA } : undefined}
      />
    );
  }

  const score    = probability.probability_score != null ? Math.round(probability.probability_score) : null;
  const conf     = Math.round(probability.data_completeness_score);
  const isLowConf = probability.probability_status === 'low_confidence';
  const trend    = computeTrend(probabilityHistory);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Probabilidad de avance</h3>
        <div className="flex items-center gap-2">
          {/* Trend */}
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend > 0 ? 'text-success' : 'text-destructive'
            }`}>
              {trend > 0
                ? <TrendingUp  className="h-3.5 w-3.5" />
                : <TrendingDown className="h-3.5 w-3.5" />
              }
              {trend > 0 ? `+${trend}` : trend}
            </span>
          )}
          {/* Score badge */}
          {score != null && (
            <span className="text-lg font-bold tabular-nums">{score}</span>
          )}
          {/* Low confidence warning */}
          {isLowConf && (
            <span className="text-[11px] text-warning bg-warning/10 px-2 py-0.5 rounded-md font-medium">
              Confianza baja
            </span>
          )}
        </div>
      </div>

      {/* 5 inputs */}
      <div className="space-y-2.5">
        {INPUTS.map(({ key, label }) => {
          const raw = probability[key] as number | null;
          const val = raw != null ? Math.round(raw) : null;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                {val != null && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${inputBarColor(val)}`}
                    style={{ width: `${val}%` }}
                  />
                )}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                {val != null ? val : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer — confianza */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
        <Minus className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          Confianza del modelo: {conf}%
        </span>
      </div>
    </div>
  );
}

export const ProbabilityBreakdown = memo(ProbabilityBreakdownComponent);
