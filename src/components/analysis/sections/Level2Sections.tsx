/**
 * Level2Sections — F20.7
 *
 * FinancialPulseSection + PipelineTractionSection
 * Visibles cuando level >= 2 desbloqueado.
 */

import { TrendingUp, TrendingDown, Minus, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/shared/SourceBadge';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

// ── Financial Pulse ───────────────────────────────────────────────────────────

const TREND_CONFIG = {
  subiendo: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-600', label: 'Subiendo' },
  estable:  { icon: <Minus className="h-4 w-4" />,       color: 'text-amber-600', label: 'Estable'  },
  bajando:  { icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-600',   label: 'Bajando'  },
};

export function FinancialPulseSection({ data }: { data: NonNullable<AnalysisSection['financial_pulse']> }) {
  const trend = data.mrr_trend ? TREND_CONFIG[data.mrr_trend] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-green-600" />
            Pulso financiero
          </CardTitle>
          <SourceBadge type="observed" source="Stripe / métricas" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principales */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">MRR</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {data.mrr_current !== null && data.mrr_current !== undefined
                ? `€${data.mrr_current.toLocaleString('es')}`
                : '—'}
            </p>
            {trend && (
              <div className={`flex items-center justify-center gap-1 text-xs mt-0.5 ${trend.color}`}>
                {trend.icon}
                {trend.label}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Runway</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {data.runway_months !== null && data.runway_months !== undefined
                ? `${data.runway_months}m`
                : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Estado</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
              {data.burn_signal ? (
                <span className="line-clamp-2">{data.burn_signal}</span>
              ) : '—'}
            </p>
          </div>
        </div>

        {/* Nota de frescura de datos */}
        {data.data_freshness_note && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {data.data_freshness_note}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pipeline Traction ─────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  stripe:  'Stripe',
  hubspot: 'HubSpot',
  obvs:    'OBVs (declarado)',
};

export function PipelineTractionSection({ data }: { data: NonNullable<AnalysisSection['pipeline_traction']> }) {
  const sourceType = data.source === 'stripe' || data.source === 'hubspot' ? 'observed' : 'declared';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-purple-600" />
            Pipeline y tracción
          </CardTitle>
          {data.source && (
            <SourceBadge
              type={sourceType}
              source={SOURCE_LABELS[data.source] ?? data.source}
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-0.5">Deals activos</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {data.deals_count ?? '—'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-0.5">En riesgo (&gt;30d sin mov.)</p>
            <p className={`text-xl font-bold ${(data.at_risk_count ?? 0) > 0 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
              {data.at_risk_count ?? '—'}
            </p>
          </div>
        </div>

        {data.revenue_potential !== null && data.revenue_potential !== undefined && (
          <div className="rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 px-3 py-2">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Revenue potencial</p>
            <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
              €{data.revenue_potential.toLocaleString('es')}
            </p>
          </div>
        )}

        {data.close_rate_note && (
          <p className="text-xs text-gray-500 italic">{data.close_rate_note}</p>
        )}
      </CardContent>
    </Card>
  );
}
