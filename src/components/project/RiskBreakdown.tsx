import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { EngineEmptyState } from './EngineEmptyState';
import { InputAuditModal, InputAuditTrigger } from './InputAuditModal';
import { SourceBadge } from '@/components/shared/SourceBadge';
interface RiskBreakdownProps {
  risk: ProjectEngineData['risk'];
  riskHistory: ProjectEngineData['riskHistory'];
  onNavigateToTab?: (tab: string) => void;
}

// ── Factor config ─────────────────────────────────────────────────────────────
//
// Semántica invertida respecto a probabilidad:
//   mayor valor = mayor riesgo en ese factor.
// Colores: ≥70 destructive · 30–69 warning · <30 success

function getFactors(t: (k: string) => string) {
  return [
    { key: 'runway_factor_input' as const,          label: t('project.pistaFinanciera')      },
    { key: 'execution_drop_input' as const,         label: t('project.caídaDeEjecución')    },
    { key: 'validation_weakness_input' as const,    label: t('project.fragilidadValidación') },
    { key: 'revenue_concentration_input' as const,  label: t('project.concentraciónRevenue') },
    { key: 'bottleneck_severity_input' as const,    label: t('project.bloqueosActivos')      },
  ];
}

function getRiskLevelLabel(level: string, t: (k: string) => string): string {
  const labels: Record<string, string> = {
    low:      t('project.bajo'),
    medium:   t('project.medio'),
    high:     t('project.alto'),
    critical: t('project.crítico'),
  };
  return labels[level] ?? level;
}

const RISK_LEVEL_COLOR: Record<string, string> = {
  low:      'text-success',
  medium:   'text-warning',
  high:     'text-destructive',
  critical: 'text-destructive',
};

function factorBarColor(value: number): string {
  if (value >= 70) return 'bg-destructive';
  if (value >= 30) return 'bg-warning';
  return 'bg-success';
}

// ── Trend ─────────────────────────────────────────────────────────────────────
// Para riesgo: delta positivo (subió) es negativo. Se muestra igual que probabilidad
// pero el color se invierte: subida de riesgo → rojo, bajada → verde.

function computeTrend(history: ProjectEngineData['riskHistory']): number | null {
  if (history.length < 2) return null;
  const curr = history[0].risk_score;
  const prev = history[1].risk_score;
  if (curr == null || prev == null) return null;
  const delta = Math.round(curr - prev);
  return delta === 0 ? null : delta;
}

// ── Component ─────────────────────────────────────────────────────────────────

function RiskBreakdownComponent({ risk, riskHistory, onNavigateToTab }: RiskBreakdownProps) {
  const { t } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  if (!risk || risk.risk_status === 'insufficient_data') {
    const available = risk?.inputs_available ?? 0;
    return (
      <EngineEmptyState
        icon={Shield}
        title={t('project.elSistemaTodavíaNo')}
        description={`Inputs disponibles: ${available}/5. Se necesitan más datos para activar el motor de riesgo.`}
      />
    );
  }

  const score     = risk.risk_score != null ? Math.round(risk.risk_score) : null;
  const level     = risk.risk_level;
  const conf      = Math.round(risk.data_completeness_score);
  const available = risk.inputs_available;
  const isLowConf = risk.risk_status === 'low_confidence';
  const trend     = computeTrend(riskHistory);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          {t('project.factoresDeRiesgo')}
          <InputAuditTrigger onClick={() => setAuditOpen(true)} />
        </h3>
        <div className="flex items-center gap-2">
          <SourceBadge type="estimated" source={t('transparency.motorDelProyecto')} reliability={0.5} size="sm" />
          {/* Trend — delta positivo = riesgo subió (malo) → rojo */}
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend > 0 ? 'text-destructive' : 'text-success'
            }`}>
              {trend > 0
                ? <TrendingUp  className="h-3.5 w-3.5" />
                : <TrendingDown className="h-3.5 w-3.5" />
              }
              {trend > 0 ? `+${trend}` : trend}
            </span>
          )}
          {/* Level + score */}
          <span className={`text-lg font-bold ${RISK_LEVEL_COLOR[level] ?? ''}`}>
            {getRiskLevelLabel(level, t)}
          </span>
          {score != null && (
            <span className="text-sm text-muted-foreground tabular-nums">({score})</span>
          )}
          {isLowConf && (
            <span className="text-[11px] text-warning bg-warning/10 px-2 py-0.5 rounded-md font-medium">{t('project.confianzaBaja')}</span>
          )}
        </div>
      </div>

      {/* 5 factores */}
      <div className="space-y-2.5">
        {getFactors(t).map(({ key, label }) => {
          const raw = risk[key] as number | null;
          const val = raw != null ? Math.round(raw) : null;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                {val != null && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${factorBarColor(val)}`}
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

      {/* Footer — datos disponibles + confianza */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Minus className="h-3 w-3" />
          {available}/5 datos disponibles
        </span>
        <span className="text-[11px] text-muted-foreground">
          Confianza: {conf}%
        </span>
      </div>

      {/* U6.V2.4 — Modal de inputs del motor */}
      {auditOpen && (
        <InputAuditModal
          type="risk"
          risk={risk}
          onNavigateToTab={onNavigateToTab}
          onClose={() => setAuditOpen(false)}
        />
      )}
    </div>
  );
}

export const RiskBreakdown = memo(RiskBreakdownComponent);
