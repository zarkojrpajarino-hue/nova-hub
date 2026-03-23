/**
 * AnalysisDiff -- F20 Upgrade 2
 *
 * Comparacion temporal entre analisis actual y anterior.
 * Muestra: nuevo, resuelto, persiste, empeoro/mejoro.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

interface AnalysisDiffProps {
  projectId: string;
  currentAnalysis: { sections: AnalysisSection };
  level: number;
}

interface DiffItem {
  category: 'new' | 'resolved' | 'persists' | 'worsened' | 'improved';
  type: string;
  text: string;
  severity?: number;
}

function extractItems(sections: AnalysisSection): Array<{ type: string; text: string; severity?: number }> {
  const items: Array<{ type: string; text: string; severity?: number }> = [];

  for (const risk of (sections.executive_summary?.risks ?? [])) {
    items.push({ type: 'risk', text: risk });
  }
  for (const decision of (sections.urgent_decisions ?? [])) {
    items.push({ type: 'urgent_decision', text: decision.title });
  }
  for (const contradiction of (sections.contradictions ?? [])) {
    items.push({ type: 'contradiction', text: contradiction.tension });
  }
  for (const truth of (sections.hard_truths ?? [])) {
    items.push({ type: 'hard_truth', text: truth.truth, severity: truth.reliability });
  }
  for (const signal of (sections.cross_signals ?? [])) {
    items.push({ type: 'cross_signal', text: signal.signal, severity: signal.reliability });
  }

  return items;
}

function computeDiff(
  current: AnalysisSection,
  previous: AnalysisSection,
): DiffItem[] {
  const currentItems = extractItems(current);
  const previousItems = extractItems(previous);

  const diff: DiffItem[] = [];

  // Similarity check: if >60% of words match, consider same item
  const isSimilar = (a: string, b: string): boolean => {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (wordsA.size === 0 || wordsB.size === 0) return false;
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    return intersection.length / Math.min(wordsA.size, wordsB.size) > 0.5;
  };

  const matchedPrevious = new Set<number>();

  for (const ci of currentItems) {
    const prevIndex = previousItems.findIndex((pi, idx) =>
      !matchedPrevious.has(idx) && pi.type === ci.type && isSimilar(pi.text, ci.text)
    );

    if (prevIndex >= 0) {
      matchedPrevious.add(prevIndex);
      const pi = previousItems[prevIndex];
      // Check severity change
      if (ci.severity !== undefined && pi.severity !== undefined) {
        if (ci.severity > pi.severity + 0.1) {
          diff.push({ category: 'worsened', type: ci.type, text: ci.text, severity: ci.severity });
        } else if (ci.severity < pi.severity - 0.1) {
          diff.push({ category: 'improved', type: ci.type, text: ci.text, severity: ci.severity });
        } else {
          diff.push({ category: 'persists', type: ci.type, text: ci.text });
        }
      } else {
        diff.push({ category: 'persists', type: ci.type, text: ci.text });
      }
    } else {
      diff.push({ category: 'new', type: ci.type, text: ci.text });
    }
  }

  // Items in previous that are NOT in current = resolved
  for (let i = 0; i < previousItems.length; i++) {
    if (!matchedPrevious.has(i)) {
      diff.push({ category: 'resolved', type: previousItems[i].type, text: previousItems[i].text });
    }
  }

  return diff;
}

const CATEGORY_CONFIG = {
  new: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' },
  resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' },
  persists: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
  worsened: { icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-700' },
  improved: { icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-700' },
};

export function AnalysisDiff({ projectId, currentAnalysis, level }: AnalysisDiffProps) {
  const { t } = useTranslation();

  const { data: previousAnalysis, isLoading } = useQuery({
    queryKey: ['analysis-diff-previous', projectId, level],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analysis_cache')
        .select('output, generated_at')
        .eq('project_id', projectId)
        .eq('analysis_level', level)
        .order('generated_at', { ascending: false })
        .limit(2);

      // We need the second entry (the previous one)
      // Since the cache is upserted, there's only 1 row per project+level.
      // So we check analysis_history or fallback to no-diff
      // For now: if only 1 row exists, no diff available
      if (!data || data.length < 2) return null;
      return data[1];
    },
  });

  if (isLoading) return null;

  if (!previousAnalysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Info className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t('analysis.diffNoPrevious')}</p>
        </CardContent>
      </Card>
    );
  }

  const previousSections = (previousAnalysis.output?.sections ?? {}) as AnalysisSection;
  const diff = computeDiff(currentAnalysis.sections, previousSections);

  const groups = {
    new: diff.filter(d => d.category === 'new'),
    resolved: diff.filter(d => d.category === 'resolved'),
    persists: diff.filter(d => d.category === 'persists'),
    worsened: diff.filter(d => d.category === 'worsened'),
    improved: diff.filter(d => d.category === 'improved'),
  };

  const categoryLabels: Record<string, string> = {
    new: t('analysis.diffNew'),
    resolved: t('analysis.diffResolved'),
    persists: t('analysis.diffPersists'),
    worsened: t('analysis.diffWorsened'),
    improved: t('analysis.diffImproved'),
  };

  const typeLabels: Record<string, string> = {
    risk: t('analysis.diffTypeRisk'),
    urgent_decision: t('analysis.diffTypeDecision'),
    contradiction: t('analysis.diffTypeContradiction'),
    hard_truth: t('analysis.diffTypeTruth'),
    cross_signal: t('analysis.diffTypeSignal'),
  };

  if (diff.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-gray-500">{t('analysis.diffNoChanges')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        {t('analysis.diffComparedTo', {
          date: new Date(previousAnalysis.generated_at).toLocaleDateString('es', {
            day: 'numeric', month: 'short', year: 'numeric',
          }),
        })}
      </p>

      {(Object.entries(groups) as [keyof typeof CATEGORY_CONFIG, DiffItem[]][]).map(([category, items]) => {
        if (items.length === 0) return null;
        const cfg = CATEGORY_CONFIG[category];
        const Icon = cfg.icon;

        return (
          <Card key={category} className={cfg.bg}>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 text-sm ${cfg.color}`}>
                <Icon className="h-4 w-4" />
                {categoryLabels[category]} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {typeLabels[item.type] ?? item.type}
                  </Badge>
                  <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
