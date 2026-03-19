/**
 * Level3Sections — F20.8
 *
 * CrossSignalsSection + HardTruthsSection
 * Visibles cuando level >= 3 desbloqueado.
 * Umbral mínimo de fiabilidad 0.6 para Hard Truths.
 */

import { GitMerge, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/shared/SourceBadge';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

// ── Cross Signals ─────────────────────────────────────────────────────────────

export function CrossSignalsSection({ data }: { data: NonNullable<AnalysisSection['cross_signals']> }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitMerge className="h-5 w-5 text-blue-600" />
            Señales cruzadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No hay suficientes datos de múltiples fuentes para detectar correlaciones en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitMerge className="h-5 w-5 text-blue-600" />
          Señales cruzadas
        </CardTitle>
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

export function HardTruthsSection({ data }: { data: NonNullable<AnalysisSection['hard_truths']> }) {
  // Filtrar por umbral mínimo 0.6
  const validTruths = data.filter(t => t.reliability >= 0.6);

  if (!validTruths.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-red-600" />
            Hard Truths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No hay suficientes datos para emitir Hard Truths con fiabilidad ≥ 0.6 en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-5 w-5 text-red-600" />
          Hard Truths
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {validTruths.map((truth, i) => (
          <div
            key={i}
            className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 p-3 space-y-2"
          >
            {/* La verdad */}
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{truth.truth}</p>

            {/* Dato que la respalda */}
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

            {/* Consecuencia */}
            <div className="rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1.5">
              <p className="text-xs text-red-700 dark:text-red-300">
                <span className="font-medium">Si lo ignoras: </span>{truth.risk_if_ignored}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
