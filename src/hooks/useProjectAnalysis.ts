/**
 * useProjectAnalysis — FASE 20
 *
 * Gestiona el análisis estratégico IA en 3 niveles:
 *   Nivel 1 (día 14+): solo datos declarados
 *   Nivel 2 (+1 integración, 30d+): datos de integración
 *   Nivel 3 (2+ integraciones, 60d+, 5+ decision_events): señales cruzadas
 *
 * F20.12: Rate limit — 1 análisis/nivel/24h, bypass si isStale
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface AnalysisDataSource {
  name: string;
  type: 'observed' | 'declared' | 'estimated' | 'inferred';
  updated_at: string | null;
}

export interface AnalysisSection {
  executive_summary?: {
    paragraph: string;
    strengths: string[];
    risks: string[];
    momentum_score: number;
  };
  phase_fit?: {
    verdict: 'Sí' | 'No' | 'Parcialmente';
    reasons: Array<{ text: string; reliability: number }>;
    recommendation: string;
    benchmark_note: string;
  };
  urgent_decisions?: Array<{
    title: string;
    context: string;
    consequence: string;
    cta: { label: string; view: string };
  }>;
  financial_pulse?: {
    mrr_current: number | null;
    mrr_trend: 'subiendo' | 'estable' | 'bajando' | null;
    runway_months: number | null;
    burn_signal: string | null;
    data_freshness_note: string | null;
  };
  pipeline_traction?: {
    deals_count: number | null;
    close_rate_note: string | null;
    at_risk_count: number | null;
    revenue_potential: number | null;
    source: 'stripe' | 'hubspot' | 'obvs' | null;
  };
  cross_signals?: Array<{
    signal: string;
    sources: string[];
    reliability: number;
    implication: string;
  }>;
  hard_truths?: Array<{
    truth: string;
    data_support: string;
    source: string;
    risk_if_ignored: string;
    reliability: number;
  }>;
}

export interface CachedAnalysis {
  sections: AnalysisSection;
  confidence_overall: number;
  cached: boolean;
  generated_at: string;
  is_stale: boolean;
  data_sources: AnalysisDataSource[];
  tokens_used?: number;
}

export interface NextLevelRequirements {
  days_needed?: number;
  needs_integration?: boolean;
  needs_more_integrations?: boolean;
  needs_decisions?: number;
}

export interface ProjectAnalysisState {
  unlockedLevel: 1 | 2 | 3 | null;
  nextLevelRequirements: NextLevelRequirements | null;
  cachedAnalysis: CachedAnalysis | null;
  isStale: boolean;
  isGenerating: boolean;
  canRegenerate: boolean;       // false si dentro de 24h y no stale
  nextRegenerationAt: Date | null;
  generateAnalysis: (additionalContext?: string) => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectAnalysis(
  projectId: string | undefined,
  level: 1 | 2 | 3,
): ProjectAnalysisState {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Datos de desbloqueo ───────────────────────────────────────────────────
  const { data: unlockData } = useQuery({
    queryKey: ['analysis-unlock', projectId],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [
        { data: project },
        { data: connections },
        { count: decisionCount },
      ] = await Promise.all([
        supabase.from('projects').select('created_at').eq('id', projectId!).single(),
        supabase.from('integration_connections').select('id').eq('project_id', projectId!).eq('status', 'active'),
        supabase.from('decision_events').select('id', { count: 'exact', head: true }).eq('project_id', projectId!),
      ]);

      const createdAt = project?.created_at ? new Date(project.created_at) : new Date();
      const daysActive = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
      const activeConnections = connections?.length ?? 0;
      const decisions = decisionCount ?? 0;

      return { daysActive, activeConnections, decisions };
    },
  });

  // ── Caché del análisis ────────────────────────────────────────────────────
  const { data: cachedRow } = useQuery({
    queryKey: ['analysis-cache', projectId, level],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .eq('project_id', projectId!)
        .eq('analysis_level', level)
        .maybeSingle();
      return data;
    },
  });

  // ── Última sincronización de integraciones (stale detection) ──────────────
  const { data: lastSync } = useQuery({
    queryKey: ['analysis-last-sync', projectId],
    enabled: !!projectId,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_connections')
        .select('last_sync_at')
        .eq('project_id', projectId!)
        .eq('status', 'active')
        .order('last_sync_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.last_sync_at ?? null;
    },
  });

  // ── Calcular nivel desbloqueado ───────────────────────────────────────────
  const { daysActive = 0, activeConnections = 0, decisions = 0 } = unlockData ?? {};

  let unlockedLevel: 1 | 2 | 3 | null = null;
  let nextLevelRequirements: NextLevelRequirements | null = null;

  if (daysActive >= 60 && activeConnections >= 2 && decisions >= 5) {
    unlockedLevel = 3;
  } else if (daysActive >= 30 && activeConnections >= 1) {
    unlockedLevel = 2;
    nextLevelRequirements = {
      days_needed: daysActive < 60 ? 60 - daysActive : undefined,
      needs_more_integrations: activeConnections < 2,
      needs_decisions: decisions < 5 ? 5 - decisions : undefined,
    };
  } else if (daysActive >= 14) {
    unlockedLevel = 1;
    nextLevelRequirements = {
      days_needed: daysActive < 30 ? 30 - daysActive : undefined,
      needs_integration: activeConnections === 0,
    };
  } else {
    nextLevelRequirements = { days_needed: 14 - daysActive };
  }

  // ── Stale y rate limit ────────────────────────────────────────────────────
  const isStale = !!cachedRow && !!(
    lastSync && lastSync > cachedRow.generated_at
  ) || !!(cachedRow && new Date() > new Date(cachedRow.expires_at));

  const cachedAnalysis: CachedAnalysis | null = cachedRow
    ? {
        sections: cachedRow.output?.sections ?? {},
        confidence_overall: cachedRow.output?.confidence_overall ?? 0,
        cached: true,
        generated_at: cachedRow.generated_at,
        is_stale: isStale,
        data_sources: cachedRow.data_sources ?? [],
        tokens_used: cachedRow.tokens_used,
      }
    : null;

  // F20.12: rate limit client-side
  const within24h = cachedRow
    ? Date.now() - new Date(cachedRow.generated_at).getTime() < 24 * 3_600_000
    : false;
  const canRegenerate = !within24h || isStale || !cachedRow;
  const nextRegenerationAt = within24h && !isStale && cachedRow
    ? new Date(new Date(cachedRow.generated_at).getTime() + 24 * 3_600_000)
    : null;

  // ── Mutación de generación ────────────────────────────────────────────────
  const generateAnalysis = async (additionalContext?: string) => {
    if (!projectId) return;
    if (!canRegenerate) {
      toast.warning(`Próxima regeneración disponible ${nextRegenerationAt ? 'a las ' + nextRegenerationAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : 'en 24h'}`);
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sin sesión');

      const response = await supabase.functions.invoke('analyze-project-v4', {
        body: { project_id: projectId, level, additional_context: additionalContext },
      });

      if (response.error) throw response.error;

      // Invalidar caché local para releer
      await queryClient.invalidateQueries({ queryKey: ['analysis-cache', projectId, level] });
      toast.success(`Análisis nivel ${level} generado`);
    } catch (err) {
      console.error('generateAnalysis error:', err);
      toast.error('Error generando el análisis');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    unlockedLevel,
    nextLevelRequirements,
    cachedAnalysis,
    isStale,
    isGenerating,
    canRegenerate,
    nextRegenerationAt,
    generateAnalysis,
  };
}
