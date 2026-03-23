/**
 * IDEA FAST START
 *
 * Para usuarios CON IDEA que quieren validarla.
 * Metodologia: Lean Startup (con hipotesis) / Design Thinking (sin hipotesis).
 *
 * Fases internas:
 *   screening     -> pregunta binaria t('onboarding.tienesHipotesisClara')
 *   with-hyp      -> flujo original: pitch + nombre + competitors + generate (Lean Startup)
 *   without-hyp   -> DiscoveryThinkingForm 5 pasos (O5.5)
 *
 * Smart features:
 *   OB.I.1 — Competitor URL input (optional, after pitch for 'structured')
 *   OB.I.3 — Hypothesis Score visual (after AI generation)
 *
 * OBJETIVO: 4 minutos, 75-85% completion
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Rocket,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  Info,
  X,
  Plus,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAllArtifacts, type AIGeneratedArtifacts } from '@/lib/ai-generators';
import { supabase } from '@/integrations/supabase/client';
import { FUNCTIONS_URL } from '@/integrations/supabase/config';
import type { FaseAAnswers } from './FaseACommon';
import { DiscoveryThinkingForm } from './DiscoveryThinkingForm';

import { useTranslation } from 'react-i18next';

type IdeaStep = 'form' | 'competitors' | 'generating' | 'score';

interface IdeaFastStartProps {
  projectId: string;
  faseAAnswers: FaseAAnswers;
  onComplete: (data: Record<string, unknown>) => void;
}

// ── OB.I.3: Hypothesis Score Card ─────────────────────────────────────────────

interface HypothesisScoreProps {
  artifacts: AIGeneratedArtifacts;
  formData: { project_name: string; business_description: string };
  onContinue: () => void;
}

function HypothesisScoreCard({ artifacts, formData, onContinue }: HypothesisScoreProps) {
  const { t } = useTranslation();

  // Derive sub-scores from the artifacts and input quality
  const totalScore = artifacts.total_confidence_score || 50;
  const descLength = formData.business_description.length;

  // Calculate sub-scores based on available data
  const problemClarity = Math.min(10, Math.round(totalScore / 10 * (descLength > 100 ? 1.1 : 0.9)));
  const marketSize = Math.min(10, Math.round(totalScore / 10 * 0.95));
  const solutionFit = Math.min(10, Math.round(totalScore / 10 * 1.05));
  const monetization = Math.min(10, Math.round(totalScore / 10 * 0.85));

  const subScores = [
    { label: t('onboarding.problemClarity'), score: problemClarity },
    { label: t('onboarding.marketSize'), score: marketSize },
    { label: t('onboarding.solutionFit'), score: solutionFit },
    { label: t('onboarding.monetization'), score: monetization },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-6 border-2 rounded-xl space-y-5 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('onboarding.hypothesisScore')}</h3>
          <span className="text-3xl font-bold text-primary">
            {totalScore}/100
          </span>
        </div>

        <div className="space-y-3">
          {subScores.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm w-40 text-gray-700">{item.label}</span>
              <div className="flex-1 bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary rounded-full h-2.5 transition-all duration-500"
                  style={{ width: `${item.score * 10}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600 w-10 text-right">{item.score}/10</span>
            </div>
          ))}
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            {t('onboarding.hypothesisScoreHint')}
          </AlertDescription>
        </Alert>
      </div>

      <Button
        onClick={onContinue}
        className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        {t('onboarding.continueToProject')}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function IdeaFastStart({ projectId, faseAAnswers, onComplete }: IdeaFastStartProps) {
  const { t } = useTranslation();
  // O5.5 -- madurez de hipotesis: null=sin responder, 'structured'=Lean Startup, 'partial'/'none'=DT
  const [hypothesisMaturity, setHypothesisMaturity] = useState<'none' | 'partial' | 'structured' | null>(null);

  const [ideaStep, setIdeaStep] = useState<IdeaStep>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArtifacts, setGeneratedArtifacts] = useState<AIGeneratedArtifacts | null>(null);

  // OB.I.1: Competitor URLs
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analyzingCompetitors, setAnalyzingCompetitors] = useState(false);

  const [formData, setFormData] = useState({
    project_name: '',
    business_description: '',
    use_autofill: false,
  });

  const canGenerate = () => {
    return (
      formData.project_name.trim().length >= 3 &&
      formData.business_description.trim().length >= 50
    );
  };

  // ── OB.I.1: Competitor URL management ───────────────────────────────────────
  const addCompetitorUrl = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };

  const removeCompetitorUrl = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  const validCompetitorUrls = competitorUrls.filter(u => u.trim().length > 0);

  const handleAnalyzeCompetitors = async () => {
    if (validCompetitorUrls.length === 0) {
      // Skip competitors, go straight to generation
      handleGenerate();
      return;
    }

    setAnalyzingCompetitors(true);

    try {
      const session = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/analyze-competitor-urls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: validCompetitorUrls,
          myIdea: formData.business_description,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setCompetitorAnalysis(result);
        toast.success(t('onboarding.competitorsAnalyzed'));
      }
    } catch (error) {
      // Non-blocking: competitor analysis failure shouldn't prevent generation
      console.error('Competitor analysis failed:', error);
      toast.error(t('onboarding.competitorAnalysisFailed'), {
        description: t('onboarding.continuingWithoutCompetitors'),
      });
    } finally {
      setAnalyzingCompetitors(false);
      // Proceed to generation regardless
      handleGenerate();
    }
  };

  const skipCompetitors = () => {
    handleGenerate();
  };

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIdeaStep('generating');
    setIsGenerating(true);

    try {
      // Generate AI artifacts from pitch + Fase A context + competitor data
      const input: Record<string, unknown> = {
        project_id: projectId,
        onboarding_type: 'idea',
        ...formData,
        location: faseAAnswers.location_country,
        mrr_monthly: faseAAnswers.mrr_monthly,
        active_customers: faseAAnswers.active_customers,
        team_size: faseAAnswers.team_size,
        monetization_type: faseAAnswers.monetization_type,
        market_scope: faseAAnswers.market_scope,
      };

      // Pass competitor data if available (OB.I.1)
      if (competitorAnalysis) {
        input.competitor_analysis = competitorAnalysis;
      }
      if (validCompetitorUrls.length > 0) {
        input.competitor_urls = validCompetitorUrls;
      }

      const artifacts = await generateAllArtifacts(input);
      setGeneratedArtifacts(artifacts);
      setIdeaStep('score');
    } catch (_error) {
      toast.error(t('onboarding.failedToValidateIdea'), {
        description: t('onboarding.pleaseTryAgainOr')
      });
      setIsGenerating(false);
      setIdeaStep('form');
    }
  };

  const handleScoreContinue = () => {
    if (!generatedArtifacts) return;

    onComplete({
      ...formData,
      ai_generated_artifacts: generatedArtifacts,
      fast_start_type: 'idea',
      hypothesis_maturity: 'structured',
      completed_at: new Date().toISOString(),
      competitor_urls: validCompetitorUrls.length > 0 ? validCompetitorUrls : undefined,
      competitor_analysis: competitorAnalysis || undefined,
    });

    toast.success(t('onboarding.ideaValidated'), {
      description: t('onboarding.yourBusinessStrategyIs')
    });
  };

  // ── O5.5: Screening ────────────────────────────────────────────────────────
  if (hypothesisMaturity === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t('onboarding.tienesUnaIdea')}</CardTitle>
                <CardDescription className="text-base mt-1">{t('onboarding.unaPreguntaParaOrientar')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 text-lg mb-1">{t('onboarding.enQuéPuntoEstá')}</p>
              <p className="text-sm text-muted-foreground">{t('onboarding.noNecesitasTenerNada')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-1.5 border-2 hover:border-primary hover:bg-primary/5 text-left items-start px-5"
                onClick={() => setHypothesisMaturity('structured')}
              >
                <span className="font-semibold">{t('onboarding.yaTengoUnaHipótesis')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('onboarding.séQuiénEsMi')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-1.5 border-2 hover:border-primary hover:bg-primary/5 text-left items-start px-5"
                onClick={() => setHypothesisMaturity('partial')}
              >
                <span className="font-semibold">{t('onboarding.tengoUnaIdeaPero')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('onboarding.intuyoElProblemaY')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-1.5 border-2 hover:border-primary hover:bg-primary/5 text-left items-start px-5"
                onClick={() => setHypothesisMaturity('none')}
              >
                <span className="font-semibold">{t('onboarding.quieroDescubrirUnaOportunidad')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('onboarding.tengoGanasDeEmprender')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── O5.5: Design Thinking path ('none' | 'partial') ────────────────────────
  if (hypothesisMaturity === 'partial' || hypothesisMaturity === 'none') {
    return (
      <DiscoveryThinkingForm
        hypothesisMaturity={hypothesisMaturity}
        onComplete={onComplete}
      />
    );
  }

  // ── Lean Startup path ('structured') ──────────────────────────────────────

  // Generating spinner
  if (ideaStep === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('onboarding.aiIsAnalyzingAnd')}</h3>
                <p className="text-muted-foreground max-w-md">{t('onboarding.creatingBusinessModelCanvas')}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <p className="text-sm text-muted-foreground">{t('onboarding.thisWillTakeApproximately')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OB.I.3: Hypothesis Score visual
  if (ideaStep === 'score' && generatedArtifacts) {
    return (
      <HypothesisScoreCard
        artifacts={generatedArtifacts}
        formData={formData}
        onContinue={handleScoreContinue}
      />
    );
  }

  // OB.I.1: Competitor URLs step
  if (ideaStep === 'competitors') {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  {t('onboarding.knowCompetitors')}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t('onboarding.competitorUrlDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>{t('onboarding.optional')}:</strong> {t('onboarding.competitorUrlHint')}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {competitorUrls.map((compUrl, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="https://competidor.com"
                    value={compUrl}
                    onChange={e => updateCompetitorUrl(i, e.target.value)}
                    className="bg-white"
                  />
                  {competitorUrls.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCompetitorUrl(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {competitorUrls.length < 5 && (
                <Button variant="outline" size="sm" onClick={addCompetitorUrl} className="gap-1">
                  <Plus className="h-3 w-3" />
                  {t('onboarding.addCompetitor')}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={skipCompetitors}
              >
                {t('onboarding.dontKnowCompetitors')}
              </button>

              <Button
                onClick={handleAnalyzeCompetitors}
                disabled={analyzingCompetitors}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {analyzingCompetitors ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('onboarding.analyzingCompetitors')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {validCompetitorUrls.length > 0
                      ? t('onboarding.analyzeAndContinue')
                      : t('onboarding.continueWithoutCompetitors')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form step ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                {t('onboarding.validateYourIdea')}
              </CardTitle>
              <CardDescription className="text-base mt-1">{t('onboarding.tellUsAboutYour')}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert for context */}
          <Alert className="bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Fast Start:</strong> {t('onboarding.wellAnalyzeYourIdea')}</AlertDescription>
          </Alert>

          {/* Question 1: Project Name (REQUIRED) */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <Label htmlFor="project_name" className="text-base font-bold text-gray-900">
                1. {t('onboarding.projectName')} <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">{t('onboarding.whatsTheNameOf')}</p>
            <Input
              id="project_name"
              type="text"
              placeholder={t('onboarding.egTaskflowFitcoachEcodelivery')}
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="ml-7 bg-white"
            />
            {formData.project_name.trim().length >= 3 && (
              <div className="flex items-center gap-1 text-xs text-green-600 ml-7">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t('onboarding.looksGood')}</span>
              </div>
            )}
          </div>

          {/* Question 2: Business Description (REQUIRED) */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <Label htmlFor="pitch" className="text-base font-bold text-gray-900">
                2. {t('onboarding.describeYourIdea')} <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              {t('onboarding.whatProblemMinChars')}
            </p>
            <Textarea
              id="pitch"
              placeholder={t('onboarding.exampleAMobileApp')}
              rows={6}
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="resize-none ml-7 bg-white"
            />
            <div className="flex items-center justify-between ml-7">
              <p className="text-xs text-gray-600">
                {formData.business_description.length} / 50 {t('onboarding.charsMinimum')}
              </p>
              {formData.business_description.length >= 50 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t('onboarding.greatDescription')}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={() => setIdeaStep('competitors')}
              disabled={!canGenerate() || isGenerating}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('onboarding.validatingIdea')}</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {t('onboarding.continueToValidation')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!canGenerate() && (
              <div className="flex flex-col gap-2 text-sm mt-3">
                {formData.project_name.trim().length < 3 && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('onboarding.pleaseEnterProjectName')}</span>
                  </div>
                )}
                {formData.business_description.trim().length < 50 && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('onboarding.pleaseProvideDetailedDesc')}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              {t('onboarding.fastStartTakes4Min')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
