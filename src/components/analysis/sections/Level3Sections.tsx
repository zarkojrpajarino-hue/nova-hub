/**
 * Level3Sections — F20.8
 *
 * CrossSignalsSection + HardTruthsSection
 * Visibles cuando level >= 3 desbloqueado.
 * Umbral mínimo de fiabilidad 0.6 para Hard Truths.
 */

import { useState } from 'react';
import { GitMerge, Eye, ListPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

import { useTranslation } from 'react-i18next';
// ── Cross Signals ─────────────────────────────────────────────────────────────

export function CrossSignalsSection({ data }: { data: NonNullable<AnalysisSection['cross_signals']> }) {
  const { t } = useTranslation();
  if (!data.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitMerge className="h-5 w-5 text-blue-600" />{t('analysis.señalesCruzadas')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('analysis.noHaySuficientesDatos')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitMerge className="h-5 w-5 text-blue-600" />{t('analysis.señalesCruzadas')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((signal, i) => (
          <div
            key={i}
            className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{signal.signal}</p>
              <SourceBadge
                type={signal.reliability >= 0.7 ? 'observed' : 'declared'}
                reliability={signal.reliability}
                size="sm"
                className="shrink-0"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {signal.sources.map((s, j) => (
                <span
                  key={j}
                  className="inline-flex text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded px-1.5 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 italic">
              → {signal.implication}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Hard Truths ───────────────────────────────────────────────────────────────

function TruthCard({ truth, i, projectId, onTaskCreated, taskCreated }: {
  truth: NonNullable<AnalysisSection['hard_truths']>[number];
  i: number;
  projectId?: string;
  onTaskCreated?: (index: number) => void;
  taskCreated?: boolean;
}) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!projectId || taskCreated) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        project_id: projectId,
        titulo: truth.truth.slice(0, 250),
        descripcion: truth.data_support,
        status: 'todo',
        ai_generated: true,
        metadata: {
          source: 'ai_analysis',
          insight_type: 'hard_truth',
        },
      });
      if (error) throw error;
      onTaskCreated?.(i);
      toast.success(t('analysis.taskCreatedFromAnalysis'));
    } catch {
      toast.error(t('analysis.taskCreateError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      key={i}
      className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 p-3 space-y-2"
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{truth.truth}</p>
      <div className="flex items-start gap-2">
        <SourceBadge
          type={truth.reliability >= 0.7 ? 'observed' : 'declared'}
          source={truth.source}
          reliability={truth.reliability}
          size="sm"
          className="shrink-0 mt-0.5"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400">{truth.data_support}</p>
      </div>
      <div className="rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1.5">
        <p className="text-xs text-red-700 dark:text-red-300">
          <span className="font-medium">{t('analysis.siLoIgnoras')}: </span>{truth.risk_if_ignored}
        </p>
      </div>
      {/* Upgrade 3: Create task button */}
      {projectId && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleCreateTask}
          disabled={creating || taskCreated}
        >
          <ListPlus className="h-3 w-3" />
          {taskCreated ? t('analysis.taskCreated') : t('analysis.createTask')}
        </Button>
      )}
    </div>
  );
}

export function HardTruthsSection({ data, projectId }: { data: NonNullable<AnalysisSection['hard_truths']>; projectId?: string }) {
  const { t } = useTranslation();
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set());
  const strong = data.filter(item => item.reliability >= 0.6);
  const uncertain = data.filter(item => item.reliability < 0.6);

  const handleTaskCreated = (index: number) => {
    setCreatedTasks(prev => new Set(prev).add(index));
  };

  if (!strong.length && !uncertain.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-red-600" />{t('analysis.hardTruths')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('analysis.noHaySuficientesDatos1')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hard Truths confirmadas (reliability ≥ 0.6) */}
      {strong.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5 text-red-600" />{t('analysis.hardTruths')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strong.map((truth, i) => (
              <TruthCard key={i} truth={truth} i={i} projectId={projectId} onTaskCreated={handleTaskCreated} taskCreated={createdTasks.has(i)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hipótesis a vigilar (reliability < 0.6) — bloque separado */}
      {uncertain.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <Eye className="h-5 w-5" />{t('analysis.hipótesisAVigilar')}</CardTitle>
            <p className="text-xs text-amber-600 dark:text-amber-500">{t('analysis.verdadesPosiblesAúnNo')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {uncertain.map((truth, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-3 space-y-2"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{truth.truth}</p>
                <div className="flex items-start gap-2">
                  <SourceBadge
                    type="estimated"
                    source={truth.source}
                    reliability={truth.reliability}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">{truth.data_support}</p>
                </div>
                <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1.5">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-medium">{t('analysis.aVigilar')}: </span>{truth.risk_if_ignored}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
