/**
 * F31 Bloque B — FounderPatternsCard
 *
 * Shows behavioral patterns detected across strategic cycles.
 * Progressive confidence:
 *   observation (1 cycle) → early_signal (2) → pattern (3+)
 *
 * Tone: constructive, non-judgmental ("This is a mirror, not a verdict").
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ── Types ─────────────────────────────────────────────────────

interface FounderPattern {
  pattern_type: string;
  description: string;
  evidence: Array<Record<string, unknown>>;
  confidence: 'observation' | 'early_signal' | 'pattern';
  cycles_analyzed: number;
  recommendation: string | null;
}

interface FounderPatternsCardProps {
  projectId: string;
}

// ── Config ────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  observation: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  early_signal: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  pattern: { color: 'bg-green-500/10 text-green-600 border-green-500/30' },
} as const;

const PATTERN_ICONS: Record<string, typeof Eye> = {
  optimism_bias: TrendingDown,
  execution_decay: TrendingDown,
  cash_blindspot: AlertTriangle,
  category_imbalance: BarChart3,
  commitment_gap: Target,
};

// ── Hook ──────────────────────────────────────────────────────

function useFounderPatterns(projectId: string) {
  return useQuery({
    queryKey: ['founder-patterns', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_founder_patterns', {
        p_project_id: projectId,
      });
      if (error) throw error;
      return (data as unknown as FounderPattern[]) ?? [];
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 min — patterns don't change fast
  });
}

// ── Sub-components ────────────────────────────────────────────

function PatternItem({ pattern }: { pattern: FounderPattern }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const Icon = PATTERN_ICONS[pattern.pattern_type] ?? Eye;
  const confidenceCfg = CONFIDENCE_CONFIG[pattern.confidence];

  return (
    <div className="border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-3">
        <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{pattern.description}</p>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', confidenceCfg.color)}>
              {t(`project.confidence_${pattern.confidence}`)}
            </Badge>
          </div>

          {pattern.recommendation && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-500" />
              <span>{pattern.recommendation}</span>
            </div>
          )}

          {/* Evidence toggle */}
          {pattern.evidence.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {t('project.patternsEvidence', { count: pattern.cycles_analyzed })}
            </button>
          )}

          {expanded && (
            <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-2 space-y-1">
              {pattern.evidence.map((e, i) => (
                <div key={i} className="font-mono">
                  {Object.entries(e)
                    .filter(([k]) => k !== 'cycle_id')
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ')}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function FounderPatternsCard({ projectId }: FounderPatternsCardProps) {
  const { t } = useTranslation();
  const { data: patterns, isLoading, error } = useFounderPatterns(projectId);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (error) return null;

  // No cycles completed yet
  if (!patterns || patterns.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={16} className="text-muted-foreground" />
          <h3 className="text-base font-bold">{t('project.patternsTitle')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('project.patternsEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-primary" />
          <h3 className="text-base font-bold">{t('project.patternsTitle')}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('project.patternsSubtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {patterns.map((p, i) => (
          <PatternItem key={`${p.pattern_type}-${i}`} pattern={p} />
        ))}
      </div>
    </div>
  );
}
