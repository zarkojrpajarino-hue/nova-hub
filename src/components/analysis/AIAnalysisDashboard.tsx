/**
 * AIAnalysisDashboard — F20.5
 *
 * Contenedor principal del análisis estratégico IA.
 * Renderiza secciones según nivel desbloqueado.
 * Secciones de nivel superior muestran AnalysisLevelTeaser, no placeholder vacío.
 */

import { useState } from 'react';
import { RefreshCw, Loader2, Clock, AlertTriangle, Crown, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { AnalysisLevelTeaser } from './AnalysisLevelTeaser';
import { PreAnalysisDataReview, buildDataRows } from './PreAnalysisDataReview';
import { ExecutiveSummarySection, PhaseFitSection, UrgentDecisionsSection, ContradictionsSection } from './sections/Level1Sections';
import { FinancialPulseSection, PipelineTractionSection } from './sections/Level2Sections';
import { CrossSignalsSection, HardTruthsSection } from './sections/Level3Sections';
import { AnalysisChat } from './AnalysisChat';
import { AnalysisDiff } from './AnalysisDiff';
import { InvestorExport } from './InvestorExport';
import { UpgradePromptModal } from '@/components/subscription/UpgradePromptModal';
import { useAICallsRemaining } from '@/hooks/useAICallCounter';
import { useCurrentPlanTier } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';
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
  projectId,
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
  const [activeTab, setActiveTab] = useState<'analysis' | 'diff'>('analysis');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLevelUpgradeModal, setShowLevelUpgradeModal] = useState(false);

  // AI call limit tracking
  const aiCalls = useAICallsRemaining(projectId);
  // Plan tier for level gating
  const { tierKey } = useCurrentPlanTier(projectId);

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
    // Check AI call limit before allowing generation
    if (isPaymentsEnabled() && aiCalls.limitReached) {
      setShowUpgradeModal(true);
      return;
    }
    if (!canRegenerate) return;
    setShowPreReview(true);
  };

  const handleConfirmGenerate = async (additionalContext?: string, focusArea?: string) => {
    setShowPreReview(false);
    await generateAnalysis(additionalContext, focusArea);
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
            {isPaymentsEnabled() && !aiCalls.isUnlimited && (
              <Badge
                variant="outline"
                className={`text-xs ${aiCalls.limitReached ? 'text-red-600 border-red-300' : 'text-gray-500'}`}
              >
                {t('pricing.aiUsageBadge', { used: aiCalls.used, limit: aiCalls.limit })}
              </Badge>
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

        <div className="flex items-center gap-2 shrink-0">
        {/* Investor Export — Upgrade 5 */}
        {cachedAnalysis && (
          <InvestorExport
            projectId={projectId}
            analysis={{
              sections: cachedAnalysis.sections,
              confidence_overall: cachedAnalysis.confidence_overall,
              generated_at: cachedAnalysis.generated_at,
            }}
            projectName={projectName}
            currentPhase={currentPhase}
            probability={probability}
            mrr={mrr}
            runway={runway}
          />
        )}

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

      {/* Tab switcher — Upgrade 2 */}
      {cachedAnalysis && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analysis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('analysis.tabAnalysis')}
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'diff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('analysis.tabChanges')}
          </button>
        </div>
      )}

      {/* Diff tab — Upgrade 2 */}
      {cachedAnalysis && activeTab === 'diff' && (
        <AnalysisDiff
          projectId={projectId}
          currentAnalysis={{ sections: cachedAnalysis.sections }}
          level={level}
        />
      )}

      {/* Secciones Nivel 1 */}
      {cachedAnalysis && activeTab === 'analysis' && (
        <div className="space-y-4">
          {sections.executive_summary && (
            <ExecutiveSummarySection data={sections.executive_summary} />
          )}
          {sections.phase_fit && (
            <PhaseFitSection data={sections.phase_fit} />
          )}
          {sections.urgent_decisions && sections.urgent_decisions.length > 0 && (
            <UrgentDecisionsSection data={sections.urgent_decisions} projectId={projectId} />
          )}
          {sections.contradictions && sections.contradictions.length > 0 && (
            <ContradictionsSection data={sections.contradictions} />
          )}

          {/* Nivel 2 — plan-gated (requires Pro+) then data-gated */}
          {isPaymentsEnabled() && tierKey === 'free' ? (
            <Card className="border-purple-200 bg-purple-50/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setShowLevelUpgradeModal(true)}>
              <CardContent className="flex items-center gap-3 py-4">
                <Crown className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-800 text-sm">{t('pricing.level2RequiresPro')}</p>
                  <p className="text-xs text-purple-600">{t('pricing.upgradeForDeeper')}</p>
                </div>
              </CardContent>
            </Card>
          ) : unlockedLevel >= 2 ? (
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

          {/* Nivel 3 — plan-gated (requires Scale) then data-gated */}
          {isPaymentsEnabled() && (tierKey === 'free' || tierKey === 'pro') && unlockedLevel >= 2 ? (
            <Card className="border-blue-200 bg-blue-50/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setShowLevelUpgradeModal(true)}>
              <CardContent className="flex items-center gap-3 py-4">
                <Rocket className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">{t('pricing.level3RequiresScale')}</p>
                  <p className="text-xs text-blue-600">{t('pricing.upgradeForCrossSignals')}</p>
                </div>
              </CardContent>
            </Card>
          ) : unlockedLevel >= 3 ? (
            <>
              {sections.cross_signals && sections.cross_signals.length > 0 && (
                <CrossSignalsSection data={sections.cross_signals} />
              )}
              {sections.hard_truths && sections.hard_truths.length > 0 && (
                <HardTruthsSection data={sections.hard_truths} projectId={projectId} />
              )}
            </>
          ) : unlockedLevel >= 2 && nextLevelRequirements && (
            <AnalysisLevelTeaser targetLevel={3} requirements={nextLevelRequirements} />
          )}
        </div>
      )}

      {/* Follow-up Chat — Upgrade 1 */}
      {cachedAnalysis && activeTab === 'analysis' && (
        <AnalysisChat
          projectId={projectId}
          analysisResult={cachedAnalysis.sections as unknown as Record<string, unknown>}
        />
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

      {/* AI call limit upgrade prompt */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={t('pricing.aiLimitReachedTitle', { used: aiCalls.used, limit: aiCalls.limit })}
        description={t('pricing.aiLimitReachedDesc')}
        recommendedPlan="pro"
        variant="ai"
      />

      {/* Analysis level upgrade prompt */}
      <UpgradePromptModal
        isOpen={showLevelUpgradeModal}
        onClose={() => setShowLevelUpgradeModal(false)}
        title={t('pricing.analysisLevelUpgradeTitle')}
        description={t('pricing.analysisLevelUpgradeDesc')}
        recommendedPlan={tierKey === 'free' ? 'pro' : 'scale'}
        variant="analysis"
      />
    </div>
  );
}
