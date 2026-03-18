/**
 * MI MODELO — Modelo Estratégico del Proyecto
 *
 * 5 bloques de datos del motor + onboarding:
 *   1. Fase Actual         → project_phase_state       (via useProjectEngineData)
 *   2. Contexto Económico  → onboarding_data.fase_a_answers
 *   3. Mercado             → projects.market_scope + country
 *   4. Estructura          → fase_a_answers.team_size + project_function_coverage
 *   5. Salud del Sistema   → project_probability + project_viability_state
 *
 * Realtime: useProjectRealtimeSync invalida ['project-engine', projectId]
 * cuando los engine tables se actualizan tras un OBV.
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { useProjectRealtimeSync } from '@/hooks/useRealtimeSubscription';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Target,
  Globe,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Minus,
} from 'lucide-react';
import type { FaseAAnswers } from '@/components/onboarding/fast-start/FaseACommon';

// ── Label maps ─────────────────────────────────────────────────────────────────

const SALES_CYCLE_LABELS: Record<string, string> = {
  days: 'Mismo día',
  weeks: '1–7 días',
  months: '1–4 semanas',
  quarters: '1–3 meses',
};

const MONETIZATION_LABELS: Record<string, string> = {
  transaccional: 'Venta única',
  suscripcion: 'Suscripción recurrente',
  ticket_alto: 'Ticket alto / servicio',
  contrato: 'Contrato / proyecto',
};

const MARKET_SCOPE_LABELS: Record<string, string> = {
  local: 'Local',
  national: 'Nacional',
  international: 'Internacional (global)',
};

const PHASE_STATUS_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  friction: 'Fricción',
  critical: 'Crítico',
};

const VIABILITY_STATUS_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  monitoring: 'En seguimiento',
  stagnation: 'Estancado',
  critical: 'Crítico',
};

const COVERAGE_LEVEL_LABELS: Record<string, string> = {
  none: 'Sin cobertura',
  basic: 'Básica',
  strong: 'Fuerte',
};

const FUNCTION_TYPE_LABELS: Record<string, string> = {
  demand: 'Demanda',
  delivery: 'Entrega',
  cash: 'Caja',
};

// ── Status color helpers ────────────────────────────────────────────────────────

type StatusVariant = 'healthy' | 'warning' | 'critical' | 'neutral';

function statusVariant(status: string): StatusVariant {
  if (['healthy', 'strong'].includes(status)) return 'healthy';
  if (['friction', 'monitoring', 'basic'].includes(status)) return 'warning';
  if (['critical', 'stagnation', 'none'].includes(status)) return 'critical';
  return 'neutral';
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const variant = statusVariant(status);
  const cls =
    variant === 'healthy'
      ? 'bg-green-100 text-green-800 border-green-200'
      : variant === 'warning'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : variant === 'critical'
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';

  const Icon =
    variant === 'healthy'
      ? CheckCircle2
      : variant === 'warning'
      ? AlertCircle
      : variant === 'critical'
      ? XCircle
      : Minus;

  return (
    <Badge className={`gap-1 ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ── Block header ────────────────────────────────────────────────────────────────

function BlockHeader({
  icon: Icon,
  title,
  color,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
    </div>
  );
}

// ── Row item ────────────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

// ── No-data placeholder ─────────────────────────────────────────────────────────

function NoEngineData({ message = 'Motor no ejecutado aún' }: { message?: string }) {
  return (
    <p className="text-sm text-gray-400 italic py-2">{message}</p>
  );
}

// ── Score bar ───────────────────────────────────────────────────────────────────

function ScoreBar({ score, color = 'bg-blue-500' }: { score: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">
        {score.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Main view ───────────────────────────────────────────────────────────────────

export function MiModeloView() {
  const { projectId } = useParams<{ projectId: string }>();

  // Realtime sync: when engine tables update, ['project-engine', projectId] is invalidated
  useProjectRealtimeSync(projectId);

  // Engine data: phase + probability + coverage (React Query, shared cache)
  const { data: engineData, isLoading: loadingEngine } = useProjectEngineData(projectId);

  // Project base data: name, market_scope, country, onboarding_data
  const { data: projectBase, isLoading: loadingProject } = useQuery({
    queryKey: ['project-base-model', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('nombre, country, market_scope, onboarding_data')
        .eq('id', projectId!)
        .maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  // Viability data: separate engine table, not in useProjectEngineData
  const { data: viabilityData } = useQuery({
    queryKey: ['project-viability-model', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_viability_state')
        .select('viability_status, active_trigger_count')
        .eq('project_id', projectId!)
        .maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const loading = loadingEngine || loadingProject;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const phaseState = engineData?.phaseState ?? null;
  const probability = engineData?.probability ?? null;
  const coverage = engineData?.coverage ?? [];

  const od = ((projectBase?.onboarding_data ?? {}) as Record<string, unknown>);
  const fa = (od.fase_a_answers as FaseAAnswers | undefined) ?? null;

  const FUNCTIONS = ['demand', 'delivery', 'cash'] as const;
  const coverageByType = Object.fromEntries(coverage.map((row) => [row.function_type, row]));

  return (
    <div>
      <NovaHeader
        title="Mi Modelo"
        subtitle="Modelo estratégico de tu proyecto"
      />

      <div className="p-6 space-y-6 max-w-5xl">

        {/* ── Bloque 1: Fase Actual ──────────────────────────────────────────── */}
        <Card className="border-2 border-blue-100">
          <CardContent className="pt-5 pb-5">
            <BlockHeader icon={Target} title="Fase Actual" color="bg-blue-500" />
            {phaseState ? (
              <div className="space-y-1">
                <DataRow
                  label="Fase del proyecto"
                  value={
                    <span className="font-bold text-blue-700">
                      Fase {phaseState.current_phase}
                    </span>
                  }
                />
                <div className="py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-500">Puntuación de fase</span>
                  </div>
                  <ScoreBar score={phaseState.phase_score} color="bg-blue-500" />
                </div>
                <DataRow
                  label="Estado"
                  value={
                    <StatusBadge
                      status={phaseState.phase_status}
                      label={PHASE_STATUS_LABELS[phaseState.phase_status] ?? phaseState.phase_status}
                    />
                  }
                />
                <DataRow
                  label="Señal de avance de fase"
                  value={
                    phaseState.hard_signal_met ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Cumplida
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                        Pendiente
                      </Badge>
                    )
                  }
                />
              </div>
            ) : (
              <NoEngineData />
            )}
          </CardContent>
        </Card>

        {/* ── Bloques 2 y 3 en grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bloque 2: Contexto Económico */}
          <Card className="border-2 border-green-100">
            <CardContent className="pt-5 pb-5">
              <BlockHeader icon={DollarSign} title="Contexto Económico" color="bg-green-500" />
              {fa ? (
                <div className="space-y-1">
                  {fa.monetization_type && (
                    <DataRow
                      label="Modelo de monetización"
                      value={MONETIZATION_LABELS[fa.monetization_type] ?? fa.monetization_type}
                    />
                  )}
                  {fa.sales_cycle && (
                    <DataRow
                      label="Ciclo de venta"
                      value={
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {SALES_CYCLE_LABELS[fa.sales_cycle] ?? fa.sales_cycle}
                        </div>
                      }
                    />
                  )}
                  {fa.avg_ticket != null && (
                    <DataRow
                      label="Ticket promedio"
                      value={
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                          €{fa.avg_ticket.toLocaleString()}
                        </div>
                      }
                    />
                  )}
                  {fa.generates_revenue && fa.mrr_monthly != null && fa.mrr_monthly > 0 && (
                    <DataRow
                      label="MRR actual"
                      value={`€${fa.mrr_monthly.toLocaleString()}/mes`}
                    />
                  )}
                  {!fa.monetization_type && !fa.sales_cycle && fa.avg_ticket == null && (
                    <NoEngineData message="Datos de onboarding incompletos" />
                  )}
                </div>
              ) : (
                <NoEngineData message="Completa el onboarding para ver este bloque" />
              )}
            </CardContent>
          </Card>

          {/* Bloque 3: Mercado */}
          <Card className="border-2 border-purple-100">
            <CardContent className="pt-5 pb-5">
              <BlockHeader icon={Globe} title="Mercado" color="bg-purple-500" />
              <div className="space-y-1">
                {projectBase?.market_scope && (
                  <DataRow
                    label="Alcance de mercado"
                    value={MARKET_SCOPE_LABELS[projectBase.market_scope] ?? projectBase.market_scope}
                  />
                )}
                {projectBase?.country && (
                  <DataRow label="País de operación" value={projectBase.country} />
                )}
                {fa?.goal_90d && (
                  <DataRow label="Objetivo 90 días" value={fa.goal_90d} />
                )}
                {!projectBase?.market_scope && !projectBase?.country && !fa?.goal_90d && (
                  <NoEngineData message="Completa el onboarding para ver este bloque" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bloque 4: Estructura ──────────────────────────────────────────── */}
        <Card className="border-2 border-orange-100">
          <CardContent className="pt-5 pb-5">
            <BlockHeader icon={Users} title="Estructura del Equipo" color="bg-orange-500" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Team size */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Equipo
                </p>
                {fa ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{fa.team_size}</span>
                    <span className="text-sm text-gray-500">
                      {fa.team_size === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                ) : (
                  <NoEngineData message="Completa el onboarding" />
                )}
                {fa?.active_customers != null && fa.active_customers > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {fa.active_customers} {fa.active_customers === 1 ? 'cliente activo' : 'clientes activos'}
                  </p>
                )}
              </div>

              {/* Function coverage */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Cobertura funcional
                </p>
                {coverage.length > 0 ? (
                  <div className="space-y-2">
                    {FUNCTIONS.map((ft) => {
                      const row = coverageByType[ft];
                      if (!row) return null;
                      const levelLabel = COVERAGE_LEVEL_LABELS[row.coverage_level] ?? row.coverage_level;
                      const barColor =
                        row.coverage_level === 'strong'
                          ? 'bg-green-500'
                          : row.coverage_level === 'basic'
                          ? 'bg-amber-400'
                          : 'bg-gray-300';
                      return (
                        <div key={ft}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-gray-600">
                              {FUNCTION_TYPE_LABELS[ft]}
                            </span>
                            <span className="text-xs text-gray-400">{levelLabel}</span>
                          </div>
                          <ScoreBar score={row.coverage_score} color={barColor} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <NoEngineData />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Bloque 5: Salud del Sistema ───────────────────────────────────── */}
        <Card className="border-2 border-red-100">
          <CardContent className="pt-5 pb-5">
            <BlockHeader icon={Activity} title="Salud del Sistema" color="bg-red-500" />

            {probability || viabilityData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Probability block */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Probabilidad de éxito
                  </p>
                  {probability ? (
                    <div className="space-y-3">
                      {probability.probability_score != null && (
                        <div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-bold text-gray-900">
                              {probability.probability_score.toFixed(0)}
                            </span>
                            <span className="text-sm text-gray-500">/ 100</span>
                          </div>
                          <ScoreBar
                            score={probability.probability_score}
                            color={
                              probability.probability_score >= 70
                                ? 'bg-green-500'
                                : probability.probability_score >= 40
                                ? 'bg-amber-400'
                                : 'bg-red-500'
                            }
                          />
                        </div>
                      )}
                      {probability.probability_score == null && (
                        <NoEngineData />
                      )}
                    </div>
                  ) : (
                    <NoEngineData />
                  )}
                </div>

                {/* Viability block */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Estado de viabilidad
                  </p>
                  {viabilityData ? (
                    <div className="space-y-3">
                      <StatusBadge
                        status={viabilityData.viability_status}
                        label={VIABILITY_STATUS_LABELS[viabilityData.viability_status] ?? viabilityData.viability_status}
                      />
                      {viabilityData.active_trigger_count > 0 && (
                        <p className="text-xs text-gray-500">
                          {viabilityData.active_trigger_count}{' '}
                          {viabilityData.active_trigger_count === 1
                            ? 'trigger activo'
                            : 'triggers activos'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <NoEngineData />
                  )}
                </div>
              </div>
            ) : (
              <NoEngineData />
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-400 pb-6">
          Los datos del motor se actualizan automáticamente al generar nuevas actividades.
        </p>
      </div>
    </div>
  );
}
