import { memo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, TrendingUp, Shield, Layers, CheckCircle2, ArrowRight, Zap, AlertTriangle, BarChart2, Radio, ChevronRight, Mic, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';
import { getNextAction } from '@/lib/next-action';
import { CostOfIgnoring } from './CostOfIgnoring';
import { MeetingInsightsCard } from '@/components/integrations/MeetingInsightsCard';
import { UnlockModeCard } from './UnlockModeCard';
import { trackEngineViewed, trackNextActionClicked } from '@/lib/analytics';
import { useAgentContext } from '@/hooks/useAgentContext';
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge';

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
// Next Action (v1.2)
//
// Fuente de verdad única para recomendaciones del engine.
// Solo visible cuando hay señal clara y acción obvia.
// Sin señal → null → no se renderiza nada.
//
// Prioridad:
//   1. Riesgo crítico (siempre)
//   2. Riesgo alto en fase 3+ (contextual)
//   3. Fase 1: hard signal no cumplida o demand débil → OBV
//   4. Fase 2: demand débil sin hard signal → OBV
//   5. Fase 2: demand débil + hard signal + score alto → canal
//   6. Fase 2: demand ok + prob inactive/low → métricas
//   7. Fase 3: ops débiles (none o basic) → OBV operativo
//   8. Fase 3: ops ok pero hard signal sin cumplir → consolidar
//   9. Fase 4: ops degradadas en escala → OBV operativo urgente
//  10. Fase 4: sin señal de crecimiento cuantificada → añadir métricas
//  11. Fase 4: hard signal no cumplida (general) → revisar condiciones
//  12. Fase 4: hard signal cumplida → mantener momentum
//  13. Resto → null
//
// Inputs usados: phase, phaseScore, hardSignalMet, riskStatus, riskLevel,
//   probStatus, coverage (demand/delivery/cash).
//
// Nota: caso demandWeak + hardSignalMet=true es teóricamente improbable
// (hard signal F2 requiere OBV de revenue que debería elevar demand coverage),
// pero se mantiene por si coverage y hard signal divergen en edge cases reales.
//
// Fase 4 (Escala — terminal en v1): nunca devuelve null.
//   opsWeak en fase 4 = regresión operativa en escala (delivery/cash debilitados).
//   probStatus proxy de crecimiento (O4.1): inactive/low_confidence → sin datos MRR.
//   hard_signal_met = O4.1≥33 AND O4.2≥50 AND risk NOT IN ('high','critical').
//
// actionType:
//   'create_obv'  → navegar a tab OBVs
//   'add_metrics' → navegar a tab Financiero
//   (sin tipo)    → solo texto, sin botón
// =============================================================================
// Agent risk driver labels — I15.90
// Mapea insight_type a etiqueta legible para el tooltip de presión de agentes
// =============================================================================

const AGENT_DRIVER_LABELS: Record<string, string> = {
  cash_flow_signal:         'flujo de caja',
  revenue_concentration:    'concentración de ingresos',
  task_completion_rate:     'tasa de ejecución baja',
  overdue_ratio:            'tareas vencidas',
  pipeline_conversion_rate: 'conversión de ventas baja',
  meeting_load:             'sobrecarga de reuniones',
  meeting_density:          'densidad de agenda alta',
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
// LastMeetingWidget — M18.23
// =============================================================================

const MEETING_TYPE_LABELS: Record<string, string> = {
  weekly:        'Semanal',
  strategic:     'Estratégica',
  sales:         'Ventas',
  retrospective: 'Retro',
  investor:      'Inversores',
  team:          'Equipo',
  kickoff:       'Kickoff',
  one_on_one:    '1:1',
};

interface LastMeetingRow {
  id:           string;
  title:        string;
  meeting_type: string;
  created_at:   string;
}

interface MeetingFulfillmentRow {
  fulfillment_rate: number | null;
  overdue_tasks:    number;
  total_tasks:      number;
}

function LastMeetingWidget({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();

  const { data: lastMeeting } = useQuery<LastMeetingRow | null>({
    queryKey:  ['last_completed_meeting', projectId],
    enabled:   !!projectId,
    staleTime: 3 * 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .from('meetings')
        .select('id, title, meeting_type, created_at')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });

  const { data: fulfillment } = useQuery<MeetingFulfillmentRow | null>({
    queryKey:  ['meeting_fulfillment_widget', lastMeeting?.id],
    enabled:   !!lastMeeting?.id,
    staleTime: 3 * 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .rpc('get_meeting_fulfillment', { p_meeting_id: lastMeeting!.id });
      return (data as MeetingFulfillmentRow | null) ?? null;
    },
  });

  if (!lastMeeting) return null;

  const rate      = fulfillment?.fulfillment_rate ?? null;
  const overdue   = fulfillment?.overdue_tasks ?? 0;
  const dateStr   = new Date(lastMeeting.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  });
  const typeLabel = MEETING_TYPE_LABELS[lastMeeting.meeting_type] ?? lastMeeting.meeting_type;

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Mic size={11} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Última reunión</span>
        </div>
        <button
          onClick={() => navigate(`/proyecto/${routeProjectId}/meetings`)}
          className="flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          Ver todas
          <ExternalLink size={10} />
        </button>
      </div>

      <div className="rounded-lg bg-muted/30 px-2.5 py-2 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground leading-snug line-clamp-1">
              {lastMeeting.title}
            </p>
            <p className="text-xs text-muted-foreground">{typeLabel} · {dateStr}</p>
          </div>
          {overdue > 0 && (
            <span className="shrink-0 flex items-center gap-0.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">
              <AlertTriangle size={9} />
              {overdue} venc.
            </span>
          )}
        </div>

        {rate !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  rate >= 0.7 ? 'bg-success' : rate >= 0.4 ? 'bg-warning' : 'bg-destructive'
                }`}
                style={{ width: `${Math.round(rate * 100)}%` }}
              />
            </div>
            <span className={`text-xs font-medium shrink-0 ${
              rate >= 0.7 ? 'text-success' : rate >= 0.4 ? 'text-warning' : 'text-destructive'
            }`}>
              {Math.round(rate * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

interface FunctionOwner {
  function_type: string;
  hasOwner: boolean;
}

interface ProjectEnginePanelProps {
  projectId?: string;
  engineData: ProjectEngineData | null | undefined;
  isLoading?: boolean;
  onAction?: (actionType: 'create_obv' | 'add_metrics' | 'define_channel' | 'create_task' | 'open_meeting') => void;
  viabilityStatus?: string;
  functionOwners?: FunctionOwner[];
  fastStartCompleted?: boolean;
  onNavigateToOnboarding?: () => void;
}

function ProjectEnginePanelComponent({ projectId, engineData, isLoading, onAction, viabilityStatus, functionOwners, fastStartCompleted, onNavigateToOnboarding }: ProjectEnginePanelProps) {
  const { data: agentCtx } = useAgentContext(projectId);

  // F19.B.4 — overdue tasks badge en panel
  const { data: overdueCount = 0 } = useQuery({
    queryKey:  ['overdue_tasks', projectId],
    enabled:   !!projectId,
    staleTime: 2 * 60_000,
    queryFn:   async () => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .neq('status', 'done')
        .lt('fecha_limite', new Date().toISOString())
      return count ?? 0
    },
  });
  const agentInsights  = agentCtx?.insights     ?? [];
  const agentRiskDelta = agentCtx?.riskModifier ?? null;

  // engine_viewed: fire once when engine has real data and is visible
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || !projectId || !engineData || fastStartCompleted === false) return;
    viewedRef.current = true;
    trackEngineViewed({
      project_id: projectId,
      phase: engineData.phaseState?.current_phase ?? undefined,
    });
  }, [projectId, engineData, fastStartCompleted]);
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

  // ── Estado onboarding pendiente (Day 0 sin configuración inicial) ───────────
  // Visible cuando el FastStartWizard no se ha completado.
  // No bloquea el dashboard — solo explica qué necesita el motor para activarse.
  if (fastStartCompleted === false) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          Motor del proyecto
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Antes de analizar tu proyecto, el motor necesita conocer tres piezas básicas:
        </p>
        <ul className="space-y-1.5">
          {['Problema principal', 'Cliente objetivo', 'Propuesta de valor'].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        {onNavigateToOnboarding && (
          <button
            onClick={onNavigateToOnboarding}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            Completar configuración inicial
            <ArrowRight size={11} />
          </button>
        )}
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

  // Next Action
  const nextAction = getNextAction(engineData);

  // Coverage
  const sortedCoverage = COVERAGE_ORDER.map(
    type => engineData?.coverage?.find(c => c.function_type === type)
         ?? { function_type: type, coverage_score: 0, coverage_level: 'none' }
  );

  const hasStructuralGap = sortedCoverage.some(c => c.coverage_level === 'none');

  const ownerMap = Object.fromEntries(
    (functionOwners ?? []).map(f => [f.function_type, f.hasOwner])
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          Motor del proyecto
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

      {/* T17.23 — Estado real */}
      <div className="flex items-center gap-1.5">
        <BarChart2 size={11} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Estado real</span>
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
          <div className="flex items-baseline gap-1.5">
            <p className={`text-sm font-bold ${riskCfg.color}`}>
              {riskScore != null ? Math.round(riskScore) : '—'}
            </p>
            {agentRiskDelta && riskStatus === 'active' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-xs font-medium cursor-help ${
                    agentRiskDelta.delta > 0 ? 'text-destructive/80' : 'text-success/80'
                  }`}>
                    {agentRiskDelta.delta > 0 ? `+${agentRiskDelta.delta}` : agentRiskDelta.delta} (no incluido)
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-48 text-xs">
                  Presión de agentes: {agentRiskDelta.drivers
                    .map((d) => AGENT_DRIVER_LABELS[d] ?? d)
                    .join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
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
          {sortedCoverage.map(c => {
            const hasOwner = ownerMap[c.function_type];
            const ownerKnown = c.function_type in ownerMap;
            return (
              <div key={c.function_type} className="flex items-center gap-2">
                {ownerKnown && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      hasOwner ? 'bg-success' : 'bg-muted-foreground/40'
                    }`}
                    title={hasOwner ? 'Con responsable' : 'Sin responsable'}
                  />
                )}
                <span className={`text-xs text-muted-foreground shrink-0 ${ownerKnown ? 'w-11' : 'w-12'}`}>
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
            );
          })}
        </div>
        {/* Gap estructural: solo visible cuando el engine tiene datos reales.
            Suprimido en Day 0 (probStatus=inactive) para no crear falsa alarma. */}
        {hasStructuralGap && probStatus !== 'inactive' && (
          <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-destructive/10">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span className="text-xs text-destructive font-medium">Gap estructural detectado</span>
          </div>
        )}
      </div>

      {/* Unlock Mode — U6.15 (antes de Next Action) */}
      <UnlockModeCard
        engineData={engineData}
        nextAction={nextAction}
        viabilityStatus={viabilityStatus}
        onCTA={onAction}
      />

      {/* T17.23 — Next Action */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <ChevronRight size={11} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Next Action</span>
        </div>
        {nextAction ? (
          <>
            <p className="text-xs font-medium text-foreground">{nextAction.title}</p>
            <p className="text-xs text-muted-foreground leading-snug">{nextAction.description}</p>
            {nextAction.actionType && nextAction.ctaLabel && onAction && (
              <button
                onClick={() => {
                  if (projectId) trackNextActionClicked({
                    project_id: projectId,
                    action_type: nextAction.actionType!,
                    phase: engineData?.phaseState?.current_phase ?? undefined,
                  });
                  onAction(nextAction.actionType!);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1"
              >
                {nextAction.ctaLabel}
                <ArrowRight size={11} />
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            El sistema aún no tiene suficiente información para recomendar el siguiente paso.
          </p>
        )}

        {/* T17.23 — Señales / T17.22 — fiabilidad + evidencia */}
        {agentInsights.length > 0 && (
          <div className="pt-1 space-y-1">
            <div className="flex items-center gap-1.5 pb-0.5">
              <Radio size={10} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Señales</span>
            </div>
            {agentInsights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-1.5 text-xs px-2 py-1.5 rounded-md ${
                  insight.content.severity === 'warning' || insight.content.severity === 'critical'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                    : insight.content.severity === 'attention'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                }`}
              >
                {/* T17.22 — icono según fiabilidad */}
                {insight.reliability_score !== undefined && insight.reliability_score < 0.5
                  ? <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                  : insight.reliability_score !== undefined && insight.reliability_score >= 0.8
                    ? <CheckCircle2 size={10} className="mt-0.5 shrink-0" />
                    : <Zap size={10} className="mt-0.5 shrink-0" />
                }
                <span className="leading-snug flex-1">{insight.content.summary}</span>
                {/* T17.22 — badge de tipo de evidencia */}
                {insight.evidence_type && (
                  <EvidenceBadge type={insight.evidence_type} compact />
                )}
              </div>
            ))}
          </div>
        )}

        {/* F19.B.4 — overdue tasks pill (solo si ≥2 tareas vencidas) */}
        {overdueCount >= 2 && (
          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 pt-1">
            <AlertTriangle size={10} className="shrink-0" />
            <span>{overdueCount} vencidas</span>
          </div>
        )}
      </div>

      {/* M18.5 — Meeting Agent insights */}
      <MeetingInsightsCard projectId={projectId} />

      {/* M18.23 — Última reunión completada */}
      {projectId && <LastMeetingWidget projectId={projectId} />}

      {/* Cost of Ignoring — U6.14 */}
      <CostOfIgnoring engineData={engineData} nextAction={nextAction} />

    </div>
  );
}

export const ProjectEnginePanel = memo(ProjectEnginePanelComponent);
