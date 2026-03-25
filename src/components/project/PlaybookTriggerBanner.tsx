/**
 * PlaybookTriggerBanner — AUD.M.2
 *
 * Lee el estado del engine (riesgo, fase, herramientas generadas) y sugiere
 * automáticamente la herramienta del Founder Toolkit más relevante para el momento.
 *
 * Muestra máximo 1 sugerencia (la de mayor prioridad). Se oculta si:
 *   - No hay proyecto
 *   - Todas las herramientas desbloqueadas ya están generadas
 *   - La sugerencia fue descartada por el usuario (localStorage)
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, X, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectRiskData } from '@/hooks/useNovaDataOptimized';
import type { ToolType } from '@/lib/toolkit-unlock-engine';

import { useTranslation } from 'react-i18next';
// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TriggerRule {
  tool: ToolType;
  label: string;
  reason: string;
  priority: number;  // menor = más urgente
  condition: (ctx: TriggerContext) => boolean;
}

interface TriggerContext {
  phase:          number;
  riskLevel:      string | null;
  generatedTools: ToolType[];
  leadsCount:     number;
}

// ── Reglas de sugerencia (prioridad ascendente = más urgente) ─────────────────

function getTriggerRules(t: (key: string) => string): TriggerRule[] { return [
  {
    tool:     'sales_playbook',
    label:    t('project.salesPlaybook'),
    reason:   t('project.tuNivelDeRiesgo'),
    priority: 1,
    condition: ctx =>
      (ctx.riskLevel === 'high' || ctx.riskLevel === 'critical') &&
      !ctx.generatedTools.includes('sales_playbook'),
  },
  {
    tool:     'buyer_persona',
    label:    t('project.buyerPersona'),
    reason:   t('project.estásEnFase2'),
    priority: 2,
    condition: ctx =>
      ctx.phase >= 2 &&
      !ctx.generatedTools.includes('buyer_persona'),
  },
  {
    tool:     'lead_scoring',
    label:    t('project.leadScoring'),
    reason:   t('project.con5ContactosEn'),
    priority: 3,
    condition: ctx =>
      ctx.leadsCount >= 5 &&
      !ctx.generatedTools.includes('lead_scoring'),
  },
  {
    tool:     'brand_kit',
    label:    t('project.brandKit'),
    reason:   t('project.tienesBuyerPersonaGenerada'),
    priority: 4,
    condition: ctx =>
      ctx.generatedTools.includes('buyer_persona') &&
      !ctx.generatedTools.includes('brand_kit'),
  },
  {
    tool:     'comms_guide',
    label:    t('project.guíaDeComunicación'),
    reason:   t('project.conBrandKitListo'),
    priority: 5,
    condition: ctx =>
      ctx.generatedTools.includes('brand_kit') &&
      !ctx.generatedTools.includes('comms_guide'),
  },
  {
    tool:     'customer_journey',
    label:    t('project.customerJourney'),
    reason:   t('project.tienesClientesActivosMapear'),
    priority: 6,
    condition: ctx =>
      ctx.phase >= 3 &&
      !ctx.generatedTools.includes('customer_journey'),
  },
]; }

// ── Hooks de datos ────────────────────────────────────────────────────────────

function useGeneratedTools(projectId: string | undefined) {
  const { t } = useTranslation();
  return useQuery<ToolType[]>({
    queryKey:  ['playbook-trigger-tools', projectId],
    enabled:   !!projectId,
    staleTime: 2 * 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .from('founder_tool_cache' as never)
        .select('tool_type')
        .eq('project_id', projectId!);
      return ((data ?? []) as { tool_type: string }[]).map(r => r.tool_type as ToolType);
    },
  });
}

function useLeadsCount(projectId: string | undefined) {
  return useQuery<number>({
    queryKey:  ['playbook-trigger-leads', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async () => {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!);
      return count ?? 0;
    },
  });
}

// ── Componente ────────────────────────────────────────────────────────────────

interface PlaybookTriggerBannerProps {
  projectId:   string | undefined;
  phase:       number;
  onNavigate?: (section: string) => void;  // callback para ir a la sección toolkit
}

const DISMISSED_KEY = (projectId: string, tool: ToolType) =>
  `ptb_dismissed_${projectId}_${tool}`;

export function PlaybookTriggerBanner({
  projectId,
  phase,
  onNavigate,
}: PlaybookTriggerBannerProps) {
  const { t } = useTranslation();
  const TRIGGER_RULES = getTriggerRules(t);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (!projectId) return new Set();
    const stored = TRIGGER_RULES
      .map(r => DISMISSED_KEY(projectId, r.tool))
      .filter(k => localStorage.getItem(k) === '1');
    return new Set(stored);
  });

  const riskData      = useProjectRiskData(projectId);
  const { data: generatedTools = [] } = useGeneratedTools(projectId);
  const { data: leadsCount = 0 }      = useLeadsCount(projectId);

  const riskLevel = riskData?.data?.risk?.risk_level ?? null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ctx: TriggerContext = {
    phase,
    riskLevel,
    generatedTools,
    leadsCount,
  };

  // Primera regla que aplica y no está descartada
  const suggestion = useMemo(() => {
    return TRIGGER_RULES
      .sort((a, b) => a.priority - b.priority)
      .find(rule =>
        rule.condition(ctx) &&
        !dismissed.has(DISMISSED_KEY(projectId ?? '', rule.tool)),
      ) ?? null;
  }, [ctx, dismissed, projectId]);

  if (!projectId || !suggestion) return null;

  const handleDismiss = () => {
    const key = DISMISSED_KEY(projectId, suggestion.tool);
    localStorage.setItem(key, '1');
    setDismissed(prev => new Set([...prev, key]));
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950/30">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          Sugerencia: {suggestion.label}
        </p>
        <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-300">
          {suggestion.reason}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300"
          onClick={() => onNavigate?.('toolkit')}
        >
          <Sparkles className="h-3 w-3" />Abrir<ArrowRight className="h-3 w-3" />
        </Button>
        <button
          onClick={handleDismiss}
          aria-label={t('project.descartarSugerencia')}
          className="rounded p-0.5 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 dark:hover:bg-indigo-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
