import { memo } from 'react';
import { Activity, TrendingUp, Shield, Layers, CheckCircle2 } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';

// =============================================================================
// Phase status
// =============================================================================

function phaseStatusConfig(status: string) {
  switch (status) {
    case 'healthy':  return { label: 'Saludable', color: 'text-success',      bg: 'bg-success/10' };
    case 'critical': return { label: 'Crítico',   color: 'text-destructive',  bg: 'bg-destructive/10' };
    default:         return { label: 'Fricción',  color: 'text-warning',      bg: 'bg-warning/10' };
  }
}

// =============================================================================
// Probability card
//
// probability_status (DB): 'inactive' | 'low_confidence' | 'active'
// Color: low_confidence → warning siempre (dato poco fiable).
//        active → derivado del score (>60 success, >30 warning, resto destructive).
// =============================================================================

function probCardConfig(status: string, score: number | null) {
  if (status === 'inactive') {
    return { color: 'text-muted-foreground', bg: 'bg-muted/30' };
  }
  if (status === 'low_confidence') {
    return { color: 'text-warning', bg: 'bg-warning/10' };
  }
  // active
  const s = score ?? 0;
  if (s > 60) return { color: 'text-success',     bg: 'bg-success/10' };
  if (s > 30) return { color: 'text-warning',     bg: 'bg-warning/10' };
  return        { color: 'text-destructive', bg: 'bg-destructive/10' };
}

// =============================================================================
// Risk card
//
// risk_status (DB): 'insufficient_data' | 'low_confidence' | 'active'
// risk_level  (DB): 'low' | 'medium' | 'high' | 'critical'
// insufficient_data → neutral (no mostrar un nivel de riesgo ficticio).
// low_confidence → warning fijo (poco fiable).
// active → color por risk_level.
// =============================================================================

function riskCardConfig(status: string, level: string) {
  if (status === 'insufficient_data') {
    return { color: 'text-muted-foreground', bg: 'bg-muted/30' };
  }
  if (status === 'low_confidence') {
    return { color: 'text-warning', bg: 'bg-warning/10' };
  }
  // active — color by risk level
  switch (level) {
    case 'low':      return { color: 'text-success',     bg: 'bg-success/10' };
    case 'medium':   return { color: 'text-warning',     bg: 'bg-warning/10' };
    case 'high':
    case 'critical': return { color: 'text-destructive', bg: 'bg-destructive/10' };
    default:         return { color: 'text-success',     bg: 'bg-success/10' };
  }
}

// =============================================================================
// Mensajes accionables (v1)
//
// data_completeness_score escala 0–100 (migration 00007: "D1+D2+D3+D4+D5, cap 100")
// Sin breakdown de inputs individuales. Máximo 1 línea visible por indicador.
// =============================================================================

function probMessage(
  status: string,
  score: number | null,
  completeness: number
): string | null {
  if (status === 'inactive') return null;
  const conf = Math.round(completeness);
  if (status === 'low_confidence') return `Confianza baja (${conf}%)`;
  // active — label por score
  const s = score ?? 0;
  const label = s > 60 ? 'Señal fuerte' : s > 30 ? 'Señal media' : 'Señal débil';
  return `${label} · Confianza ${conf}%`;
}

function riskMessage(
  status: string,
  level: string,
  completeness: number
): string {
  if (status === 'insufficient_data') return 'Datos insuficientes';
  const conf = Math.round(completeness);
  if (status === 'low_confidence') return `Datos insuficientes · Confianza ${conf}%`;
  // active — label por risk_level
  const label =
    level === 'critical' ? 'Acción inmediata'   :
    level === 'high'     ? 'Atención requerida' :
    level === 'medium'   ? 'Riesgo moderado'    :
                           'Sin alertas';
  return `${label} · Confianza ${conf}%`;
}

// =============================================================================
// Coverage
// =============================================================================

const COVERAGE_LABELS: Record<string, string> = {
  demand:   'Demanda',
  delivery: 'Entrega',
  cash:     'Caja',
};

const COVERAGE_ORDER = ['demand', 'delivery', 'cash'];

// =============================================================================
// Component
// =============================================================================

interface ProjectEnginePanelProps {
  engineData: ProjectEngineData | null | undefined;
  isLoading?: boolean;
}

function ProjectEnginePanelComponent({ engineData, isLoading }: ProjectEnginePanelProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  // Phase
  const phase       = engineData?.phaseState?.current_phase ?? 1;
  const phaseScore  = engineData?.phaseState?.phase_score   ?? 0;
  const phaseStatus = engineData?.phaseState?.phase_status  ?? 'friction';
  const hardSignal  = engineData?.phaseState?.hard_signal_met ?? false;
  const statusCfg   = phaseStatusConfig(phaseStatus);

  // Probability
  const prob         = engineData?.probability;
  const probStatus   = prob?.probability_status ?? 'inactive';
  const probScore    = prob?.probability_score ?? null;
  const probComp     = prob?.data_completeness_score ?? 0;
  const probCfg      = probCardConfig(probStatus, probScore);
  const probBadge    = probMessage(probStatus, probScore, probComp);

  // Risk
  const risk         = engineData?.risk;
  const riskStatus   = risk?.risk_status ?? 'insufficient_data';
  const riskLevel    = risk?.risk_level  ?? 'low';
  const riskScore    = risk?.risk_score  ?? null;
  const riskComp     = risk?.data_completeness_score ?? 0;
  const riskCfg      = riskCardConfig(riskStatus, riskLevel);
  const riskBadge    = riskMessage(riskStatus, riskLevel, riskComp);

  // Coverage
  const sortedCoverage = COVERAGE_ORDER.map(
    type => engineData?.coverage?.find(c => c.function_type === type)
         ?? { function_type: type, coverage_score: 0, coverage_level: 'none' }
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          Engine
        </h3>
        {hardSignal && (
          <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 size={11} />
            Señal activa
          </span>
        )}
      </div>

      {/* Phase */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate">
            Fase {phase} — {PHASE_LABELS[phase] ?? `Fase ${phase}`}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium ${statusCfg.color} ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(2, phaseScore)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(phaseScore)} / 100
        </p>
      </div>

      {/* Probability + Risk */}
      <div className="flex gap-2">

        {/* Probability */}
        <div className={`flex-1 rounded-xl p-2.5 ${probCfg.bg}`}>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp size={11} className={probCfg.color} />
            <span className="text-xs text-muted-foreground">Prob.</span>
          </div>
          <p className={`text-sm font-bold ${probCfg.color}`}>
            {probScore != null ? `${Math.round(probScore)}%` : '—'}
          </p>
          {probBadge && (
            <p className={`text-xs ${probCfg.color} opacity-75`}>{probBadge}</p>
          )}
        </div>

        {/* Risk */}
        <div className={`flex-1 rounded-xl p-2.5 ${riskCfg.bg}`}>
          <div className="flex items-center gap-1 mb-0.5">
            <Shield size={11} className={riskCfg.color} />
            <span className="text-xs text-muted-foreground">Riesgo</span>
          </div>
          <p className={`text-sm font-bold ${riskCfg.color}`}>
            {riskScore != null ? Math.round(riskScore) : '—'}
          </p>
          {riskBadge && (
            <p className={`text-xs ${riskCfg.color} opacity-75`}>{riskBadge}</p>
          )}
        </div>

      </div>

      {/* Coverage */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layers size={11} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Cobertura</span>
        </div>
        <div className="space-y-2">
          {sortedCoverage.map(c => (
            <div key={c.function_type} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">
                {COVERAGE_LABELS[c.function_type] ?? c.function_type}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    c.coverage_level === 'strong' ? 'bg-success' :
                    c.coverage_level === 'basic'  ? 'bg-warning' :
                    'bg-muted-foreground/20'
                  }`}
                  style={{ width: `${Math.max(c.coverage_score ?? 0, 0)}%` }}
                />
              </div>
              <span className={`text-xs w-11 text-right shrink-0 ${
                c.coverage_level === 'strong' ? 'text-success' :
                c.coverage_level === 'basic'  ? 'text-warning' :
                'text-muted-foreground'
              }`}>
                {c.coverage_level === 'strong' ? 'Fuerte' :
                 c.coverage_level === 'basic'  ? 'Básica' :
                 'Ninguna'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export const ProjectEnginePanel = memo(ProjectEnginePanelComponent);
