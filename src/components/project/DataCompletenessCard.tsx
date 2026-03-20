/**
 * DataCompletenessCard — U6.V2.3
 *
 * Indicador de completitud de datos visible ANTES de los engine scores.
 * Solo aparece si data_completeness_score < 0.7 (< 7/10 inputs disponibles).
 *
 * Muestra: donut "X/10 inputs disponibles" + lista de inputs faltantes (máx 3)
 * + CTA por input para llevar al fundador a completarlos.
 *
 * Por qué existe: sin este card, un fundador Día 1 interpreta un score bajo
 * como "mi proyecto va mal" cuando la realidad es "tengo pocos datos".
 * Evita abandono en Day 1-7.
 *
 * Fuente de datos: engineData.probability._input + engineData.risk._input
 * (5 inputs de probabilidad + 5 inputs de riesgo = 10 total).
 * Degraded mode si v_engine_input_audit no está disponible.
 */

import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

interface DataCompletenessCardProps {
  engineData: ProjectEngineData | null | undefined;
  onNavigateToTab?: (tab: string) => void;
}

interface InputDef {
  id: string;
  label: string;
  tab: string;
  ctaLabel: string;
}

// Los 10 inputs del motor (5 prob + 5 riesgo)
const PROB_INPUTS: InputDef[] = [
  { id: 'phase_score_input',          label: 'Score de fase',          tab: 'obvs',        ctaLabel: 'Añadir OBVs' },
  { id: 'execution_rate_input',       label: 'Tasa de ejecución',      tab: 'tareas',      ctaLabel: 'Ver tareas' },
  { id: 'validation_strength_input',  label: 'Validaciones',           tab: 'obvs',        ctaLabel: 'Añadir validaciones' },
  { id: 'revenue_momentum_input',     label: 'Momentum de ingresos',   tab: 'financiero',  ctaLabel: 'Conectar ingresos' },
  { id: 'capacity_health_input',      label: 'Capacidad del equipo',   tab: 'financiero',  ctaLabel: 'Ver Mi Modelo' },
];

const RISK_INPUTS: InputDef[] = [
  { id: 'runway_factor_input',         label: 'Runway financiero',      tab: 'financiero',  ctaLabel: 'Añadir runway' },
  { id: 'execution_drop_input',        label: 'Caída de ejecución',     tab: 'tareas',      ctaLabel: 'Ver tareas' },
  { id: 'validation_weakness_input',   label: 'Debilidad de validación',tab: 'obvs',        ctaLabel: 'Añadir OBVs' },
  { id: 'revenue_concentration_input', label: 'Concentración de ingresos', tab: 'financiero', ctaLabel: 'Ver financiero' },
  { id: 'bottleneck_severity_input',   label: 'Cuellos de botella',     tab: 'tareas',      ctaLabel: 'Revisar tareas' },
];

export function DataCompletenessCard({ engineData, onNavigateToTab }: DataCompletenessCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const prob  = engineData?.probability;
  const risk  = engineData?.risk;

  // Calcular score promedio — usar el menor de los dos si ambos existen
  const probScore = prob?.data_completeness_score ?? 1;
  const riskScore = risk?.data_completeness_score ?? 1;
  const avgScore  = (probScore + riskScore) / 2;

  // Solo mostrar si score < 0.7
  if (avgScore >= 0.7) return null;

  // Determinar qué inputs faltan (null)
  const probRecord = prob as Record<string, unknown> | null | undefined;
  const riskRecord = risk as Record<string, unknown> | null | undefined;
  const missingInputs: InputDef[] = [];
  for (const def of PROB_INPUTS) {
    const val = probRecord?.[def.id];
    if (val === null || val === undefined) missingInputs.push(def);
  }
  for (const def of RISK_INPUTS) {
    const val = riskRecord?.[def.id];
    if (val === null || val === undefined) missingInputs.push(def);
  }

  const totalInputs   = 10;
  const presentInputs = totalInputs - missingInputs.length;
  const pct           = Math.round(avgScore * 100);

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4">
      <div className="flex items-start gap-3">
        {/* Donut mini */}
        <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
              className="text-amber-200 dark:text-amber-800" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${pct * 0.879} 87.96`}
              className="text-amber-500 dark:text-amber-400" strokeLinecap="round" />
          </svg>
          <span className="absolute text-xs font-bold text-amber-700 dark:text-amber-400">
            {pct}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {presentInputs}/{totalInputs} inputs disponibles
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-500 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
            Los scores del motor son aproximados. Con más datos mejorarán la precisión.
          </p>

          {/* Top 3 inputs faltantes */}
          {missingInputs.length > 0 && (
            <div className="space-y-1">
              {missingInputs.slice(0, 3).map(inp => (
                <div key={inp.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <Info size={10} className="shrink-0" />
                    {inp.label}
                  </div>
                  {onNavigateToTab && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-5 px-2 text-[10px] text-amber-700 dark:text-amber-400',
                        'hover:bg-amber-100 dark:hover:bg-amber-900/30',
                      )}
                      onClick={() => onNavigateToTab(inp.tab)}
                    >
                      {inp.ctaLabel}
                    </Button>
                  )}
                </div>
              ))}
              {missingInputs.length > 3 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500">
                  +{missingInputs.length - 3} inputs más sin datos
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
