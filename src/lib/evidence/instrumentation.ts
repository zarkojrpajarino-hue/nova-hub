/**
 * EVIDENCE SYSTEM INSTRUMENTATION
 *
 * Logging estructurado para medir comportamiento real bajo carga real.
 * NO console.log - estos datos van a analytics/DB.
 */

import { supabase } from '@/integrations/supabase/client';

export interface EvidenceGenerationMetrics {
  // Identificación
  feature: string;
  profile: string;
  mode: 'hypothesis' | 'balanced' | 'strict';
  user_id: string;
  project_id: string;

  // Latency (ms)
  total_latency_ms: number;
  retrieval_time_ms: number;
  generation_time_ms?: number;
  validation_time_ms?: number;

  // Retrieval
  sources_found: number;
  sources_cited: number;
  coverage_percentage?: number;
  citation_utilization?: number;

  // Status
  evidence_status: 'verified' | 'partial' | 'no_evidence' | 'error';

  // Timeouts (DETALLADOS)
  timeout_occurred: boolean;
  timed_out_tiers?: string[];  // ['official_apis', 'web_news']
  tier_durations_ms?: Record<string, number>;  // { user_docs: 600, official_apis: 4000 }
  retrieval_early_exit?: boolean;

  // Waste
  waste_flag: boolean;

  // Metadata extensible (JSONB)
  metadata?: Record<string, unknown>;
}

export interface UserEvent {
  generation_id: string;  // UUID de la generación
  user_id: string;
  event_type: 'opened_report' | 'changed_mode' | 'regenerated' | 'clicked_search_more' | 'export_attempted' | 'export_blocked' | 'closed_modal';
  event_data?: Record<string, unknown>;
}

/**
 * Log de generación completa (desde backend/edge function)
 * Persiste en Supabase para análisis posterior
 */
export async function logEvidenceGeneration(metrics: EvidenceGenerationMetrics): Promise<string | null> {
  try {
    // Calcular waste_flag
    const coverageWaste = metrics.sources_found > 0 && (metrics.coverage_percentage || 0) < 30;
    const citationWaste = metrics.sources_found > 0 && (metrics.citation_utilization || 0) < 0.25;
    metrics.waste_flag = coverageWaste || citationWaste;

    // Persistir en DB (desde service role, no RLS)
    const { data, error } = await supabase
      .from('evidence_generation_metrics')
      .insert(metrics)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log evidence metrics:', error);
      return null;
    }

    // Retornar generation_id para vincular eventos UI
    return data?.id || null;
  } catch (err) {
    console.error('Error in logEvidenceGeneration:', err);
    return null;
  }
}

/**
 * Log de evento UI (desde cliente)
 * Para medir fricción y comportamiento de usuario
 */
export async function logUserEvent(event: UserEvent) {
  try {
    const { error } = await supabase
      .from('evidence_user_events')
      .insert(event);

    if (error) {
      console.error('Failed to log user event:', error);
    }
  } catch (err) {
    console.error('Error in logUserEvent:', err);
  }
}

/**
 * Helper para calcular percentiles después de N generaciones
 * (Para dashboards, no en tiempo real)
 */
export async function calculatePercentiles(feature: string, mode: string, days = 7) {
  const { data, error } = await supabase
    .from('evidence_generation_metrics')
    .select('total_latency_ms')
    .eq('feature', feature)
    .eq('mode', mode)
    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('total_latency_ms');

  if (error || !data) return { p50: null, p95: null };

  const latencies = data.map(d => d.total_latency_ms);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  return { p50, p95 };
}

/**
 * Helper para detectar comportamiento de usuario
 * (El verdadero test: ¿lo están usando bien?)
 */
export async function getUserBehaviorMetrics(days = 7) {
  const { data, error } = await supabase
    .from('evidence_generation_metrics')
    .select('*')
    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (error || !data) return null;

  const total = data.length;
  const switchedToHypothesis = data.filter(d => d.user_changed_mode && d.mode === 'hypothesis').length;
  const regenerated = data.filter(d => d.user_regenerated).length;
  const openedReport = data.filter(d => d.user_opened_report).length;
  const ignoredReport = total - openedReport;

  return {
    total_generations: total,

    // ⚠️ RED FLAG: Muchos cambian a hypothesis = fricción
    switched_to_hypothesis_rate: switchedToHypothesis / total,

    // ⚠️ RED FLAG: Muchos regeneran = defaults mal calibrados
    regeneration_rate: regenerated / total,

    // ⚠️ RED FLAG: Nadie abre report = sobre-ingenierización
    report_ignored_rate: ignoredReport / total,
  };
}

/**
 * Schema de la tabla (crear migration)
 */
export const EVIDENCE_METRICS_SCHEMA = `
CREATE TABLE IF NOT EXISTS evidence_generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación
  feature TEXT NOT NULL,
  profile TEXT NOT NULL,
  mode TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Latency
  total_latency_ms INTEGER NOT NULL,
  retrieval_time_ms INTEGER NOT NULL,
  generation_time_ms INTEGER NOT NULL,

  -- Retrieval
  sources_found INTEGER NOT NULL,
  sources_cited INTEGER NOT NULL,
  coverage_percentage NUMERIC(5,2),
  citation_utilization NUMERIC(5,2),

  -- Retrieval por tier (JSON)
  retrieval_by_tier JSONB,

  -- Status
  evidence_status TEXT NOT NULL,
  timeout_occurred BOOLEAN DEFAULT false,
  timeout_tier TEXT,

  -- Errors
  error_occurred BOOLEAN DEFAULT false,
  error_type TEXT,
  error_details TEXT,

  -- User behavior
  user_changed_mode BOOLEAN DEFAULT false,
  user_opened_report BOOLEAN DEFAULT false,
  user_regenerated BOOLEAN DEFAULT false,

  -- Waste
  waste_type TEXT,

  -- Índices para queries rápidas
  CONSTRAINT valid_mode CHECK (mode IN ('hypothesis', 'balanced', 'strict')),
  CONSTRAINT valid_evidence_status CHECK (evidence_status IN ('verified', 'partial', 'no_evidence', 'error'))
);

CREATE INDEX idx_evidence_metrics_feature ON evidence_generation_metrics(feature);
CREATE INDEX idx_evidence_metrics_mode ON evidence_generation_metrics(mode);
CREATE INDEX idx_evidence_metrics_timestamp ON evidence_generation_metrics(timestamp DESC);
CREATE INDEX idx_evidence_metrics_user ON evidence_generation_metrics(user_id);

-- RLS
ALTER TABLE evidence_generation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON evidence_generation_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert metrics"
  ON evidence_generation_metrics FOR INSERT
  WITH CHECK (true);
`;
