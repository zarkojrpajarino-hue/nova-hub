/**
 * useFounderTool — F21.4–F21.8 (shared)
 *
 * Hook compartido para las 6 herramientas del Founder Toolkit.
 * Lee de founder_tool_cache, llama al edge function correspondiente,
 * gestiona rate limit (1 generación/24h, bypass si stale).
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ToolType } from '@/lib/toolkit-unlock-engine';

// ── Slug de edge function por herramienta ─────────────────────────────────────

const EDGE_FN: Record<ToolType, string> = {
  buyer_persona: 'generate-buyer-persona-v2',
  lead_scoring: 'generate-lead-scoring-v2',
  sales_playbook: 'generate-sales-playbook-v2',
  brand_kit: 'generate-brand-kit-v2',
  comms_guide: 'generate-comms-guide-v2',
  customer_journey: 'generate-customer-journey-v2',
};

const TOOL_LABEL: Record<ToolType, string> = {
  buyer_persona: 'Buyer Persona',
  lead_scoring: 'Lead Scoring',
  sales_playbook: 'Sales Playbook',
  brand_kit: 'Brand Kit',
  comms_guide: 'Guía de Comunicación',
  customer_journey: 'Customer Journey',
};

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface FounderToolDataSource {
  name: string;
  type: 'observed' | 'declared' | 'estimated' | 'inferred';
  updated_at: string | null;
}

export interface FounderToolState<T = Record<string, unknown>> {
  output: T | null;
  dataSources: FounderToolDataSource[];
  generatedAt: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  isStale: boolean;
  canRegenerate: boolean;
  nextRegenerationAt: Date | null;
  generate: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFounderTool<T = Record<string, unknown>>(
  projectId: string | undefined,
  toolType: ToolType,
): FounderToolState<T> {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Leer caché
  const { data: cached, isLoading } = useQuery({
    queryKey: ['founder-tool', projectId, toolType],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('founder_tool_cache')
        .select('*')
        .eq('project_id', projectId!)
        .eq('tool_type', toolType)
        .maybeSingle();
      return data ?? null;
    },
  });

  // Stale: expirado
  const isStale = !!cached && new Date() > new Date(cached.expires_at);

  // Rate limit: dentro de 24h y no stale
  const within24h = cached
    ? Date.now() - new Date(cached.generated_at).getTime() < 24 * 3_600_000
    : false;
  const canRegenerate = !within24h || isStale || !cached;
  const nextRegenerationAt =
    within24h && !isStale && cached
      ? new Date(new Date(cached.generated_at).getTime() + 24 * 3_600_000)
      : null;

  // Función de generación
  const generate = async () => {
    if (!projectId) return;
    if (!canRegenerate) {
      const time = nextRegenerationAt?.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      toast.warning(`Próxima regeneración disponible${time ? ' a las ' + time : ' en 24h'}`);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke(EDGE_FN[toolType], {
        body: { project_id: projectId },
      });
      if (response.error) throw response.error;

      await queryClient.invalidateQueries({ queryKey: ['founder-tool', projectId, toolType] });
      await queryClient.invalidateQueries({ queryKey: ['toolkit-unlocks', projectId] });
      toast.success(`${TOOL_LABEL[toolType]} generado`);
    } catch (err) {
      console.error(`${toolType} generation error:`, err);
      toast.error(`Error generando ${TOOL_LABEL[toolType]}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    output: cached ? (cached.output as T) : null,
    dataSources: (cached?.data_sources ?? []) as FounderToolDataSource[],
    generatedAt: cached?.generated_at ?? null,
    isLoading,
    isGenerating,
    isStale,
    canRegenerate,
    nextRegenerationAt,
    generate,
  };
}
