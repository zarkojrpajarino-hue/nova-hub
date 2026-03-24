/**
 * V4.6.2 — CompetitiveAnalysisView
 *
 * Card/table showing stored competitive_analysis data for the current project.
 * Columns: competitors, benchmarks, SWOT, market_gaps, recommended_strategy.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Json } from '@/integrations/supabase/types';

interface CompetitiveRow {
  id: string;
  project_id: string;
  competitors: Json | null;
  benchmarks: Json | null;
  swot: Json | null;
  market_gaps: Json | null;
  recommended_strategy: Json | null;
  generated_at: string | null;
  updated_at: string | null;
}

export function CompetitiveAnalysisView() {
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();

  const { data, isLoading } = useQuery({
    queryKey: ['competitive_analysis', currentProject?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitive_analysis')
        .select('*')
        .eq('project_id', currentProject!.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CompetitiveRow | null;
    },
    enabled: !!currentProject?.id,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('analytics.competitiveAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('analytics.competitiveNoData')}</p>
        </CardContent>
      </Card>
    );
  }

  const competitors = Array.isArray(data.competitors) ? data.competitors : [];
  const benchmarks = data.benchmarks as Record<string, unknown> | null;
  const swot = data.swot as Record<string, unknown> | null;
  const marketGaps = Array.isArray(data.market_gaps) ? data.market_gaps : [];
  const strategy = Array.isArray(data.recommended_strategy)
    ? data.recommended_strategy
    : data.recommended_strategy
      ? [data.recommended_strategy]
      : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('analytics.competitiveAnalysis')}
            </CardTitle>
            {data.generated_at && (
              <span className="text-xs text-muted-foreground">
                {t('analytics.competitiveGeneratedAt', {
                  date: new Date(data.generated_at).toLocaleDateString(),
                })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Competitors */}
          {competitors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                {t('analytics.competitiveCompetitors')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {competitors.map((c, i) => (
                  <Badge key={i} variant="secondary">
                    {typeof c === 'string' ? c : (c as Record<string, unknown>)?.name ?? JSON.stringify(c)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SWOT */}
          {swot && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                {t('analytics.competitiveSWOT')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((key) => {
                  const items = Array.isArray(swot[key]) ? (swot[key] as string[]) : [];
                  if (items.length === 0) return null;
                  const labels: Record<string, string> = {
                    strengths: t('analytics.competitiveStrengths'),
                    weaknesses: t('analytics.competitiveWeaknesses'),
                    opportunities: t('analytics.competitiveOpportunities'),
                    threats: t('analytics.competitiveThreats'),
                  };
                  return (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{labels[key]}</p>
                      <ul className="text-sm space-y-0.5">
                        {items.map((item, j) => (
                          <li key={j}>- {String(item)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Market Gaps */}
          {marketGaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                {t('analytics.competitiveMarketGaps')}
              </h4>
              <ul className="text-sm space-y-1">
                {marketGaps.map((gap, i) => (
                  <li key={i} className="text-muted-foreground">
                    - {typeof gap === 'string' ? gap : JSON.stringify(gap)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benchmarks */}
          {benchmarks && Object.keys(benchmarks).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('analytics.competitiveBenchmarks')}</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(benchmarks).map(([key, val]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <p className="text-sm font-medium">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy */}
          {strategy.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('analytics.competitiveStrategy')}</h4>
              <ul className="text-sm space-y-1">
                {strategy.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    - {typeof s === 'string' ? s : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
