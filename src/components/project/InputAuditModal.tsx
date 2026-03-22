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
import { cn } from '@/lib/utils';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

import { useTranslation } from 'react-i18next';
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
  { label: t('project.avanceDeFase'),      source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: t('project.añadirObvs') },
  { label: t('project.tasaDeEjecución'),   source: 'Motor (Tareas)', confidence: '—', tab: 'tareas',     ctaLabel: t('project.verTareas') },
  { label: t('project.validación'),          source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: t('project.añadirValidaciones') },
  { label: t('project.momentumIngresos'),   source: t('project.financiero'),     confidence: '—', tab: 'financiero', ctaLabel: t('project.verFinanciero') },
  { label: t('project.capacidadEquipo'),    source: t('project.motor'),          confidence: '—', tab: 'financiero', ctaLabel: t('project.verMiModelo') },
];

const RISK_ROWS: Omit<InputRow, 'value'>[] = [
  { label: t('project.runwayFinanciero'),      source: t('project.financiero'),     confidence: '—', tab: 'financiero', ctaLabel: t('project.añadirRunway') },
  { label: t('project.caídaDeEjecución'),     source: 'Motor (Tareas)', confidence: '—', tab: 'tareas',     ctaLabel: t('project.verTareas') },
  { label: t('project.fragilidadValidación'),  source: 'Motor (OBVs)',   confidence: '—', tab: 'obvs',       ctaLabel: t('project.añadirObvs') },
  { label: t('project.concentraciónRevenue'),  source: t('project.financiero'),     confidence: '—', tab: 'financiero', ctaLabel: t('project.verFinanciero') },
  { label: t('project.bloqueosActivos'),       source: t('project.motor'),          confidence: '—', tab: 'tareas',     ctaLabel: t('project.revisarTareas') },
];

function formatValue(v: number | null): string {
  if (v === null) return '—';
  return Math.round(v).toString();
}

function confidenceLabel(v: number | null): string {
  if (v === null) return t('project.sinDatos');
  if (v >= 70) return t('project.alta');
  if (v >= 40) return t('project.media');
  return t('project.baja');
}

export function InputAuditModal({
  type,
  probability,
  risk,
  onNavigateToTab,
  onClose,
}: InputAuditModalProps) {
  const { t } = useTranslation();
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
              {isProbability ? 'Inputs de probabilidad': t('project.inputsDeRiesgo')}
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
            <span className="col-span-5">{t('project.input')}</span>
            <span className="col-span-2 text-right">{t('project.valor')}</span>
            <span className="col-span-3 text-right">{t('project.confianza')}</span>
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
                row.confidence === t('project.sinDatos') ? 'text-muted-foreground' :
                row.confidence === t('project.alta') ? 'text-success' :
                row.confidence === t('project.media') ? 'text-warning' : 'text-destructive',
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

        <p className="text-[10px] text-muted-foreground mt-3">{t('project.fuenteMotorDelProyecto')}</p>
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
      aria-label={t('project.verInputsDelMotor')}
      title={t('project.verInputsDelMotor')}
    >
      <Info size={12} />
    </button>
  );
}
