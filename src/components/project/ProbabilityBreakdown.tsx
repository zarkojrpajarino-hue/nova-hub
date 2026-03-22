import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { EngineEmptyState } from './EngineEmptyState';
import { InputAuditModal, InputAuditTrigger } from './InputAuditModal';
import { SourceBadge } from '@/components/shared/SourceBadge';
interface ProbabilityBreakdownProps {
  probability: ProjectEngineData['probability'];
  probabilityHistory: ProjectEngineData['probabilityHistory'];
  onCTA?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

// ── Input config ──────────────────────────────────────────────────────────────

function getInputs(t: (k: string) => string) {
  return [
    { key: 'phase_score_input' as const,         label: t('project.avanceDeFase')    },
    { key: 'execution_rate_input' as const,      label: t('project.ejecución')       },
    { key: 'validation_strength_input' as const, label: t('project.validación')      },
    { key: 'revenue_momentum_input' as const,    label: t('project.revenue')         },
    { key: 'capacity_health_input' as const,     label: t('project.equipo')          },
  ];
}

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
  onNavigateToTab,
}: ProbabilityBreakdownProps) {
  const { t } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  // Sin datos, inactivo o confianza baja (EC13.7: no mostrar número bajo hasta tener datos reales)
  if (!probability || probability.probability_status !== 'active') {
    const isBuilding = probability?.probability_status === 'low_confidence';
    return (
      <EngineEmptyState
        icon={TrendingUp}
        title={
          isBuilding
            ? t('project.elMotorSeEstá')
            : t('project.aúnNoHayDatos')
        }
        description={
          isBuilding
            ? t('project.continúaAñadiendoMétricasY')
            : t('project.elMotorNecesitaMás')
        }
        cta={onCTA ? { label: t('project.añadirMétricas'), onClick: onCTA } : undefined}
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
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          {t('project.probabilidadDeAvance')}
          <InputAuditTrigger onClick={() => setAuditOpen(true)} />
        </h3>
        <div className="flex items-center gap-2">
          <SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.5} size="sm" />
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
            <span className="text-[11px] text-warning bg-warning/10 px-2 py-0.5 rounded-md font-medium">{t('project.confianzaBaja')}</span>
          )}
        </div>
      </div>

      {/* 5 inputs */}
      <div className="space-y-2.5">
        {getInputs(t).map(({ key, label }) => {
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

      {/* U6.V2.4 — Modal de inputs del motor */}
      {auditOpen && (
        <InputAuditModal
          type="probability"
          probability={probability}
          onNavigateToTab={onNavigateToTab}
          onClose={() => setAuditOpen(false)}
        />
      )}
    </div>
  );
}

export const ProbabilityBreakdown = memo(ProbabilityBreakdownComponent);
