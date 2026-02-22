/**
 * EVIDENCE SYSTEM INSTRUMENTATION - DENO/EDGE FUNCTIONS
 *
 * Versión para Supabase Edge Functions (Deno runtime)
 * Logging estructurado para medir comportamiento real bajo carga real.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  metadata?: Record<string, any>;
}

/**
 * Log de generación completa (desde edge function)
 * Persiste en Supabase para análisis posterior
 */
export async function logEvidenceGeneration(
  supabase: SupabaseClient,
  metrics: EvidenceGenerationMetrics
): Promise<string | null> {
  try {
    // Calcular waste_flag
    const coverageWaste = metrics.sources_found > 0 && (metrics.coverage_percentage || 0) < 30;
    const citationWaste = metrics.sources_found > 0 && (metrics.citation_utilization || 0) < 0.25;
    metrics.waste_flag = coverageWaste || citationWaste;

    // Persistir en DB (service role, no RLS)
    const { data, error } = await supabase
      .from('evidence_generation_metrics')
      .insert(metrics)
      .select('id')
      .single();

    if (error) {
      console.error('[Evidence Instrumentation] Failed to log metrics:', error);
      return null;
    }

    // Retornar generation_id para vincular eventos UI
    return data?.id || null;
  } catch (err) {
    console.error('[Evidence Instrumentation] Error in logEvidenceGeneration:', err);
    return null;
  }
}

/**
 * Helper para crear tracker de métricas durante edge function execution
 */
export class EvidenceMetricsTracker {
  private startTime: number;
  private retrievalStartTime?: number;
  private generationStartTime?: number;

  public feature: string;
  public profile: string;
  public mode: 'hypothesis' | 'balanced' | 'strict';
  public userId: string;
  public projectId: string;

  public sourcesFound: number = 0;
  public sourcesCited: number = 0;
  public evidenceStatus: 'verified' | 'partial' | 'no_evidence' | 'error' = 'no_evidence';
  public timeoutOccurred: boolean = false;
  public timedOutTiers: string[] = [];
  public tierDurations: Record<string, number> = {};
  public metadata: Record<string, any> = {};

  constructor(
    feature: string,
    profile: string,
    mode: 'hypothesis' | 'balanced' | 'strict',
    userId: string,
    projectId: string
  ) {
    this.startTime = performance.now();
    this.feature = feature;
    this.profile = profile;
    this.mode = mode;
    this.userId = userId;
    this.projectId = projectId;
  }

  startRetrieval() {
    this.retrievalStartTime = performance.now();
  }

  endRetrieval(sourcesFound: number = 0) {
    if (!this.retrievalStartTime) {
      console.warn('[Evidence Tracker] endRetrieval called without startRetrieval');
      return 0;
    }
    this.sourcesFound = sourcesFound;
    return performance.now() - this.retrievalStartTime;
  }

  startGeneration() {
    this.generationStartTime = performance.now();
  }

  endGeneration(sourcesCited: number = 0) {
    if (!this.generationStartTime) {
      console.warn('[Evidence Tracker] endGeneration called without startGeneration');
      return 0;
    }
    this.sourcesCited = sourcesCited;
    return performance.now() - this.generationStartTime;
  }

  recordTierDuration(tier: string, durationMs: number) {
    this.tierDurations[tier] = durationMs;
  }

  recordTierTimeout(tier: string) {
    this.timeoutOccurred = true;
    if (!this.timedOutTiers.includes(tier)) {
      this.timedOutTiers.push(tier);
    }
  }

  setEvidenceStatus(status: 'verified' | 'partial' | 'no_evidence' | 'error') {
    this.evidenceStatus = status;
  }

  /**
   * Finaliza tracking y persiste en DB
   */
  async finish(supabase: SupabaseClient): Promise<string | null> {
    const totalLatency = performance.now() - this.startTime;
    const retrievalTime = this.retrievalStartTime
      ? (performance.now() - this.retrievalStartTime)
      : 0;
    const generationTime = this.generationStartTime
      ? (performance.now() - this.generationStartTime)
      : undefined;

    // Calcular citation_utilization
    const citationUtilization = this.sourcesFound > 0
      ? this.sourcesCited / this.sourcesFound
      : undefined;

    // Calcular coverage (si está en metadata)
    const coveragePercentage = this.metadata.coverage_percentage;

    const metrics: EvidenceGenerationMetrics = {
      feature: this.feature,
      profile: this.profile,
      mode: this.mode,
      user_id: this.userId,
      project_id: this.projectId,

      total_latency_ms: Math.round(totalLatency),
      retrieval_time_ms: Math.round(retrievalTime),
      generation_time_ms: generationTime ? Math.round(generationTime) : undefined,

      sources_found: this.sourcesFound,
      sources_cited: this.sourcesCited,
      citation_utilization: citationUtilization,
      coverage_percentage: coveragePercentage,

      evidence_status: this.evidenceStatus,
      timeout_occurred: this.timeoutOccurred,
      timed_out_tiers: this.timedOutTiers.length > 0 ? this.timedOutTiers : undefined,
      tier_durations_ms: Object.keys(this.tierDurations).length > 0 ? this.tierDurations : undefined,

      waste_flag: false, // Se calcula en logEvidenceGeneration
      metadata: this.metadata,
    };

    return await logEvidenceGeneration(supabase, metrics);
  }
}
