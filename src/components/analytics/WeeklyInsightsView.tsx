/**
 * V4.6.3 — WeeklyInsightsView
 *
 * Displays weekly_insights records for the current project.
 * Shows date range, summary, highlights, concerns, recommendations.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, Lightbulb, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Json } from '@/integrations/supabase/types';

interface WeeklyInsightRow {
  id: string;
  project_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  highlights: Json | null;
  concerns: Json | null;
  competitor_changes: Json | null;
  recommendations: Json | null;
  next_week_priorities: Json | null;
  created_at: string;
  sent_at: string | null;
}

export function WeeklyInsightsView() {
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();

  const { data: insights, isLoading } = useQuery({
    queryKey: ['weekly_insights', currentProject?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_insights')
        .select('*')
        .eq('project_id', currentProject!.id)
        .order('week_end', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as WeeklyInsightRow[];
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

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('analytics.weeklyInsights')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('analytics.weeklyInsightsNoData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CalendarDays className="h-5 w-5" />
        {t('analytics.weeklyInsights')}
      </h3>
      {insights.map((insight) => {
        const highlights = Array.isArray(insight.highlights) ? (insight.highlights as string[]) : [];
        const concerns = Array.isArray(insight.concerns) ? (insight.concerns as string[]) : [];
        const recommendations = Array.isArray(insight.recommendations) ? (insight.recommendations as string[]) : [];
        const priorities = Array.isArray(insight.next_week_priorities) ? (insight.next_week_priorities as string[]) : [];

        return (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {t('analytics.weeklyInsightsPeriod', {
                    start: new Date(insight.week_start).toLocaleDateString(),
                    end: new Date(insight.week_end).toLocaleDateString(),
                  })}
                </CardTitle>
                {insight.sent_at && (
                  <Badge variant="outline" className="text-xs">
                    {t('analytics.weeklyInsightsSent')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Summary */}
              <p className="text-sm">{insight.summary}</p>

              {/* Highlights */}
              {highlights.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('analytics.weeklyInsightsHighlights')}
                  </p>
                  <ul className="text-sm space-y-0.5 text-muted-foreground">
                    {highlights.map((h, i) => <li key={i}>- {String(h)}</li>)}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {concerns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('analytics.weeklyInsightsConcerns')}
                  </p>
                  <ul className="text-sm space-y-0.5 text-muted-foreground">
                    {concerns.map((c, i) => <li key={i}>- {String(c)}</li>)}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {t('analytics.weeklyInsightsRecommendations')}
                  </p>
                  <ul className="text-sm space-y-0.5 text-muted-foreground">
                    {recommendations.map((r, i) => <li key={i}>- {String(r)}</li>)}
                  </ul>
                </div>
              )}

              {/* Next week priorities */}
              {priorities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold flex items-center gap-1 mb-1">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {t('analytics.weeklyInsightsPriorities')}
                  </p>
                  <ul className="text-sm space-y-0.5 text-muted-foreground">
                    {priorities.map((p, i) => <li key={i}>- {String(p)}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
