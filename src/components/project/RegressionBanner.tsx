import { useState, useEffect } from 'react';
import { TrendingDown, X, ChevronRight } from 'lucide-react';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

import { useTranslation } from 'react-i18next';
// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegressionInfo {
  type: 'phase_drop' | 'score_drop';
  fromPhase: number;
  toPhase: number;
  scoreDelta: number;       // negative = dropped (e.g. -22)
  latestCalcAt: string;     // discriminator for sessionStorage key
}

// ── Derivation (exported — also used by PhaseProgressBar for Level 1 signal) ──

// eslint-disable-next-line react-refresh/only-export-components
export function deriveRegression(
  history: ProjectEngineData['phaseHistory'],
): RegressionInfo | null {
  if (history.length < 2) return null;

  const curr = history[0]; // más reciente
  const prev = history[1];

  // Regresión fuerte: fase bajó
  if (curr.phase < prev.phase) {
    return {
      type: 'phase_drop',
      fromPhase: prev.phase,
      toPhase: curr.phase,
      scoreDelta: Math.round(curr.phase_score - prev.phase_score),
      latestCalcAt: curr.calculated_at,
    };
  }

  // Regresión suave: misma fase, caída de score >= 15 puntos
  const scoreDrop = Math.round(prev.phase_score - curr.phase_score);
  if (curr.phase === prev.phase && scoreDrop >= 15) {
    return {
      type: 'score_drop',
      fromPhase: curr.phase,
      toPhase: curr.phase,
      scoreDelta: -scoreDrop,
      latestCalcAt: curr.calculated_at,
    };
  }

  return null;
}

// ── Copy ──────────────────────────────────────────────────────────────────────

const COPY: Record<RegressionInfo['type'], { title: string; body: string }> = {
  phase_drop: {
    title: t('project.elProyectoHaRetrocedido'),
    body:  t('project.laFaseActualSe'),
  },
  score_drop: {
    title: t('project.seDetectóUnaPérdida'),
    body:  t('project.algunasSeñalesDelProyecto'),
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface RegressionBannerProps {
  engineData: ProjectEngineData | null | undefined;
  projectId: string;
  onCTA?: () => void; // navegar al panel del engine
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegressionBanner({ engineData, projectId, onCTA }: RegressionBannerProps) {
  const { t } = useTranslation();
  const regression = deriveRegression(engineData?.phaseHistory ?? []);

  const dKey = regression
    ? `regression:${projectId}:${regression.type}:${regression.latestCalcAt}`
    : null;

  const [dismissed, setDismissed] = useState(() =>
    dKey ? !!sessionStorage.getItem(dKey) : false,
  );

  // Re-sincronizar si cambia el evento de regresión (nueva evaluación)
  useEffect(() => {
    setDismissed(dKey ? !!sessionStorage.getItem(dKey) : false);
  }, [dKey]);

  if (!regression || dismissed) return null;

  const copy = COPY[regression.type];

  function handleDismiss() {
    if (dKey) sessionStorage.setItem(dKey, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{copy.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{copy.body}</p>
        {onCTA && (
          <button
            onClick={onCTA}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >{t('project.verQuéRecuperar')}<ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label={t('project.cerrarAvisoDeRegresión')}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
