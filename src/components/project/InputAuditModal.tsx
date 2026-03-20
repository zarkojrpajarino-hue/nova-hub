/**
 * InputAuditModal — U6.V2.4
 *
 * Modal de transparencia expandible desde cualquier score del motor.
 * Trigger: botón discreto "ⓘ" junto al título en RiskBreakdown y ProbabilityBreakdown.
 *
 * Muestra tabla: Input | Valor | Fuente | Confianza | [Actualizar]
 * Datos desde v_engine_input_audit (E4.V2.3) cuando esté disponible.
 * Degraded mode: usa los valores ya en engineData.probability / engineData.risk.
 *
 * "[Actualizar]" navega al tab correspondiente donde el usuario puede editar el valor.
 */

import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

interface InputAuditModalProps {
  type: 'probability' | 'risk';
  probability?: ProjectEngineData['probability'];
  risk?: ProjectEngineData['risk'];
  onNavigateToTab?: (tab: string) => void;
  onClose: () => void;
}

interface InputRow {
  label: string;
  value: number | null;
  source: string;
  confidence: string;
  tab: string;
  ctaLabel: string;
}

const PROB_ROWS: Omit<InputRow, 'value'>[] = [
  { label: 'Avance de fase',      source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: 'Añadir OBVs' },
  { label: 'Tasa de ejecución',   source: 'Motor (Tareas)', confidence: '—', tab: 'tareas',     ctaLabel: 'Ver tareas' },
  { label: 'Validación',          source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: 'Añadir validaciones' },
  { label: 'Momentum ingresos',   source: 'Financiero',     confidence: '—', tab: 'financiero', ctaLabel: 'Ver financiero' },
  { label: 'Capacidad equipo',    source: 'Motor',          confidence: '—', tab: 'financiero', ctaLabel: 'Ver Mi Modelo' },
];

const RISK_ROWS: Omit<InputRow, 'value'>[] = [
  { label: 'Runway financiero',      source: 'Financiero',     confidence: '—', tab: 'financiero', ctaLabel: 'Añadir runway' },
  { label: 'Caída de ejecución',     source: 'Motor (Tareas)', confidence: '—', tab: 'tareas',     ctaLabel: 'Ver tareas' },
  { label: 'Fragilidad validación',  source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: 'Añadir OBVs' },
  { label: 'Concentración revenue',  source: 'Financiero',     confidence: '—', tab: 'financiero', ctaLabel: 'Ver financiero' },
  { label: 'Bloqueos activos',       source: 'Motor',          confidence: '—', tab: 'tareas',     ctaLabel: 'Revisar tareas' },
];

function formatValue(v: number | null): string {
  if (v === null) return '—';
  return Math.round(v).toString();
}

function confidenceLabel(v: number | null): string {
  if (v === null) return 'Sin datos';
  if (v >= 70) return 'Alta';
  if (v >= 40) return 'Media';
  return 'Baja';
}

export function InputAuditModal({
  type,
  probability,
  risk,
  onNavigateToTab,
  onClose,
}: InputAuditModalProps) {
  const isProbability = type === 'probability';
  const baseRows = isProbability ? PROB_ROWS : RISK_ROWS;

  const rawValues: (number | null)[] = isProbability
    ? [
        probability?.phase_score_input ?? null,
        probability?.execution_rate_input ?? null,
        probability?.validation_strength_input ?? null,
        probability?.revenue_momentum_input ?? null,
        probability?.capacity_health_input ?? null,
      ]
    : [
        risk?.runway_factor_input ?? null,
        risk?.execution_drop_input ?? null,
        risk?.validation_weakness_input ?? null,
        risk?.revenue_concentration_input ?? null,
        risk?.bottleneck_severity_input ?? null,
      ];

  const rows: InputRow[] = baseRows.map((def, i) => ({
    ...def,
    value: rawValues[i],
    confidence: confidenceLabel(rawValues[i]),
  }));

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {isProbability ? 'Inputs de probabilidad' : 'Inputs de riesgo'}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Estos son los valores que el motor usa para calcular el score.
          {!isProbability
            ? ' Valores más altos = mayor riesgo.'
            : ' Valores más altos = mayor probabilidad de avance.'}
        </p>

        {/* Tabla degraded mode (sin v_engine_input_audit) */}
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
            <span className="col-span-5">Input</span>
            <span className="col-span-2 text-right">Valor</span>
            <span className="col-span-3 text-right">Confianza</span>
            <span className="col-span-2" />
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 items-center py-1.5 text-xs border-b border-border/50 last:border-0">
              <span className="col-span-5 text-foreground">{row.label}</span>
              <span className={cn(
                'col-span-2 text-right font-mono',
                row.value === null ? 'text-muted-foreground' : 'text-foreground',
              )}>
                {formatValue(row.value)}
              </span>
              <span className={cn(
                'col-span-3 text-right',
                row.confidence === 'Sin datos' ? 'text-muted-foreground' :
                row.confidence === 'Alta' ? 'text-success' :
                row.confidence === 'Media' ? 'text-warning' : 'text-destructive',
              )}>
                {row.confidence}
              </span>
              <div className="col-span-2 flex justify-end">
                {onNavigateToTab && (
                  <button
                    className="text-[10px] text-primary underline underline-offset-2 hover:no-underline"
                    onClick={() => { onNavigateToTab(row.tab); onClose(); }}
                  >
                    {row.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3">
          Fuente: Motor del proyecto · Actualización: siguiente ejecución del motor
        </p>
      </div>
    </div>
  );
}

// ── Trigger button ────────────────────────────────────────────────────────────
// Pequeño botón ⓘ para colocar junto al título de cualquier score.
interface InputAuditTriggerProps {
  onClick: () => void;
}

export function InputAuditTrigger({ onClick }: InputAuditTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Ver inputs del motor"
      title="Ver inputs del motor"
    >
      <Info size={12} />
    </button>
  );
}
