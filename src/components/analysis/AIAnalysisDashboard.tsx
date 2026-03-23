/**
 * AIAnalysisDashboard — F20.5
 *
 * Contenedor principal del análisis estratégico IA.
 * Renderiza secciones según nivel desbloqueado.
 * Secciones de nivel superior muestran AnalysisLevelTeaser, no placeholder vacío.
 */

import { useState } from 'react';
import { RefreshCw, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { AnalysisLevelTeaser } from './AnalysisLevelTeaser';
import { PreAnalysisDataReview, buildDataRows } from './PreAnalysisDataReview';
import { ExecutiveSummarySection, PhaseFitSection, UrgentDecisionsSection, ContradictionsSection } from './sections/Level1Sections';
import { FinancialPulseSection, PipelineTractionSection } from './sections/Level2Sections';
import { CrossSignalsSection, HardTruthsSection } from './sections/Level3Sections';
import type { ProjectAnalysisState } from '@/hooks/useProjectAnalysis';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';

import { useTranslation } from 'react-i18next';
interface AIAnalysisDashboardProps {
  projectId: string;
  projectName: string;
  analysisState: ProjectAnalysisState;
  currentPhase?: number;
  riskLevel?: string;
  probability?: number;
  mrr?: number | null;
  runway?: number | null;
  activeConnections?: Array<{ provider: string; last_sync_at: string }>;
  decisionCount?: number;
}

export function AIAnalysisDashboard({
  projectId: _projectId,
  projectName,
  analysisState,
  currentPhase,
  riskLevel,
  probability,
  mrr,
  runway,
  activeConnections,
  decisionCount,
}: AIAnalysisDashboardProps) {
  const { t } = useTranslation();
  const [showSources, setShowSources] = useState(false);
  const [showPreReview, setShowPreReview] = useState(false);

  const {
    unlockedLevel,
    nextLevelRequirements,
    cachedAnalysis,
    isStale,
    isGenerating,
    canRegenerate,
    nextRegenerationAt,
    generateAnalysis,
  } = analysisState;

  const level = unlockedLevel ?? 1;
  const sections = cachedAnalysis?.sections ?? {};

  const handleGenerateClick = () => {
    if (!canRegenerate) return;
    setShowPreReview(true);
  };

  const handleConfirmGenerate = async (additionalContext?: string) => {
    setShowPreReview(false);
    await generateAnalysis(additionalContext);
  };

  const dataRows = buildDataRows(level, {
    nombre: projectName,
    fase: currentPhase,
    riskLevel,
    probability,
    mrr,
    runway,
    connections: activeConnections,
    decisions: decisionCount,
  }, t);

  // ── Sin nivel desbloqueado ────────────────────────────────────────────────
  if (!unlockedLevel) {
    const daysLeft = nextLevelRequirements?.days_needed ?? 14;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Clock className="h-10 w-10 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t('analysis.análisisDisponibleEn', { days: daysLeft })}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {t('analysis.elAnálisisIaSeActiva')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{projectName}</h2>
            <Badge variant="outline" className="text-xs">
              {t('analysis.nivel')} {level}
            </Badge>
            {isStale && (
              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />{t('analysis.datosActualizadosRegenerar')}</Badge>
            )}
          </div>
          {cachedAnalysis && (
            <p className="text-xs text-gray-500 mt-1">
              {t('analysis.generadoHace')} {formatDistanceToNow(new Date(cachedAnalysis.generated_at), { addSuffix: true, locale: getDateFnsLocale() })}
              {' · '}
              <button
                className="underline hover:text-gray-700"
                onClick={() => setShowSources(v => !v)}
              >
                {showSources ? t('analysis.ocultarFuentes') : t('analysis.deDóndeVieneEsto')}
              </button>
            </p>
          )}
        </div>

        {/* Botón Regenerar */}
        <Button
          size="sm"
          variant={isStale ? 'default' : 'outline'}
          className="shrink-0 gap-1.5"
          onClick={handleGenerateClick}
          disabled={isGenerating || !canRegenerate}
        >
          {isGenerating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t('analysis.generando')}</>
          ) : cachedAnalysis ? (
            <><RefreshCw className="h-3.5 w-3.5" />{t('analysis.regenerar')}</>
          ) : (
            <>{t('analysis.generarAnálisis')}</>
          )}
        </Button>
      </div>

      {/* Rate limit info */}
      {!canRegenerate && nextRegenerationAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500 -mt-4">
          <Clock className="h-3.5 w-3.5" />
          {t('analysis.próximaRegeneración')} {nextRegenerationAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Panel de fuentes */}
      {showSources && cachedAnalysis && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('analysis.fuentesDeDatosUsadas')}</p>
          <div className="flex flex-wrap gap-2">
            {cachedAnalysis.data_sources.map((src, i) => (
              <SourceBadge
                key={i}
                type={src.type}
                source={src.name}
                timestamp={src.updated_at ?? undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sin análisis generado todavía */}
      {!cachedAnalysis && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-600 dark:text-gray-400">{t('analysis.noHayAnálisisGenerado')}</p>
          <Button onClick={handleGenerateClick} disabled={!canRegenerate}>{t('analysis.generarPrimerAnálisis')}</Button>
        </div>
      )}

      {/* Secciones Nivel 1 */}
      {cachedAnalysis && (
        <div className="space-y-4">
          {sections.executive_summary && (
            <ExecutiveSummarySection data={sections.executive_summary} />
          )}
          {sections.phase_fit && (
            <PhaseFitSection data={sections.phase_fit} />
          )}
          {sections.urgent_decisions && sections.urgent_decisions.length > 0 && (
            <UrgentDecisionsSection data={sections.urgent_decisions} />
          )}
          {sections.contradictions && sections.contradictions.length > 0 && (
            <ContradictionsSection data={sections.contradictions} />
          )}

          {/* Nivel 2 — gated o visible */}
          {unlockedLevel >= 2 ? (
            <>
              {sections.financial_pulse && (
                <FinancialPulseSection data={sections.financial_pulse} />
              )}
              {sections.pipeline_traction && (
                <PipelineTractionSection data={sections.pipeline_traction} />
              )}
            </>
          ) : nextLevelRequirements && (
            <AnalysisLevelTeaser targetLevel={2} requirements={nextLevelRequirements} />
          )}

          {/* Nivel 3 — gated o visible */}
          {unlockedLevel >= 3 ? (
            <>
              {sections.cross_signals && sections.cross_signals.length > 0 && (
                <CrossSignalsSection data={sections.cross_signals} />
              )}
              {sections.hard_truths && sections.hard_truths.length > 0 && (
                <HardTruthsSection data={sections.hard_truths} />
              )}
            </>
          ) : unlockedLevel >= 2 && nextLevelRequirements && (
            <AnalysisLevelTeaser targetLevel={3} requirements={nextLevelRequirements} />
          )}
        </div>
      )}

      {/* Pre-review modal */}
      <PreAnalysisDataReview
        open={showPreReview}
        level={level}
        dataRows={dataRows}
        isGenerating={isGenerating}
        onGenerate={handleConfirmGenerate}
        onClose={() => setShowPreReview(false)}
      />
    </div>
  );
}
