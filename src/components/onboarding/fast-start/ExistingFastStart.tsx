/**
 * EXISTING FAST START
 *
 * Para usuarios CON STARTUP EXISTENTE que quieren escalar
 * Metodologia: Scaling Up + 4 Decisions Framework
 *
 * OBJETIVO: 5 minutos, 75-85% completion
 * INPUT: Metricas clave + Data Integration opcional
 * OUTPUT: Health Score + Growth diagnostic + 3 escenarios
 *
 * Steps:
 *   1. URL AutoFill (optional) — OB.E.1
 *   2. Form (project_name + business_description)
 *   3. Connect tools (optional) — OB.E.3
 *   4. AI generation
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Database,
  Info,
  Globe,
  Link2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAllArtifacts } from '@/lib/ai-generators';
import { supabase } from '@/integrations/supabase/client';
import { FUNCTIONS_URL } from '@/integrations/supabase/config';
import type { FaseAAnswers } from './FaseACommon';

import { useTranslation } from 'react-i18next';

type ExistingStep = 'url-autofill' | 'form' | 'connect-tools' | 'generating';

interface ExistingFastStartProps {
  projectId: string;
  faseAAnswers: FaseAAnswers;
  onComplete: (data: Record<string, unknown>) => void;
}

const INTEGRATION_PROVIDERS = ['stripe', 'hubspot', 'asana', 'slack', 'notion', 'trello'] as const;

export function ExistingFastStart({ projectId, faseAAnswers, onComplete }: ExistingFastStartProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<ExistingStep>('url-autofill');
  const [isGenerating, setIsGenerating] = useState(false);

  // URL AutoFill state (OB.E.1)
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [extractError, setExtractError] = useState('');

  const [formData, setFormData] = useState({
    project_name: '',
    business_description: '',
    industry: '',
    use_data_integration: false,
  });

  // MRR y clientes vienen de Fase A (Q2-Q3)
  const canGenerate = () => {
    return (
      formData.project_name.trim().length >= 3 &&
      formData.business_description.trim().length >= 30
    );
  };

  // ── OB.E.1: URL extraction ──────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setExtractError('');

    try {
      const session = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/extract-business-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          project_phase: 'traccion',
          context_type: 'own_business',
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || t('onboarding.extractionFailed'));
      }

      const data = result.data || result;

      if (data.nombre_sugerido) {
        setFormData(prev => ({ ...prev, project_name: data.nombre_sugerido }));
      }
      if (data.descripcion) {
        setFormData(prev => ({ ...prev, business_description: data.descripcion }));
      }
      if (data.industria) {
        setFormData(prev => ({ ...prev, industry: data.industria }));
      }

      setExtracted(true);
      toast.success(t('onboarding.dataExtracted'), {
        description: t('onboarding.reviewAndEditBelow'),
      });
      setStep('form');
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('onboarding.extractionFailed');
      setExtractError(msg);
      toast.error(t('onboarding.extractionFailed'), {
        description: t('onboarding.youCanTypeManually'),
      });
    } finally {
      setExtracting(false);
    }
  };

  const skipUrl = () => {
    setStep('form');
  };

  // ── OB.E.3: Integration tools ───────────────────────────────────────────────
  const skipIntegrations = () => {
    handleGenerate();
  };

  const handleProviderClick = (provider: string) => {
    // Navigate to integrations page for this provider after onboarding
    // For now, store the intent and proceed with generation
    toast.info(t('onboarding.connectAfterSetup'), {
      description: t('onboarding.connectAfterSetupDesc'),
    });
  };

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setStep('generating');
    setIsGenerating(true);

    try {
      // Generate AI artifacts from existing business data + Fase A context
      const input = {
        project_id: projectId,
        onboarding_type: 'existing',
        ...formData,
        existing_metrics: {
          mrr: faseAAnswers.mrr_monthly ?? 0,
          customers: faseAAnswers.active_customers ?? 0,
        },
        team_size: faseAAnswers.team_size,
        monetization_type: faseAAnswers.monetization_type,
        sales_cycle: faseAAnswers.sales_cycle,
        market_scope: faseAAnswers.market_scope,
        location: faseAAnswers.location_country,
        source_url: url || undefined,
      };

      const artifacts = await generateAllArtifacts(input);

      // Complete Fast Start with generated data
      onComplete({
        ...formData,
        ai_generated_artifacts: artifacts,
        fast_start_type: 'existing',
        completed_at: new Date().toISOString(),
        fase_a: faseAAnswers,
        source_url: url || undefined,
      });

      toast.success(t('onboarding.businessAnalyzed'), {
        description: t('onboarding.yourGrowthDiagnosticIs')
      });
    } catch (_error) {
      toast.error(t('onboarding.failedToAnalyzeBusiness'), {
        description: t('onboarding.pleaseTryAgainOr')
      });
      setIsGenerating(false);
      setStep('form');
    }
  };

  // ── Render: generating spinner ──────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('onboarding.aiIsAnalyzingYour')}</h3>
                <p className="text-muted-foreground max-w-md">{t('onboarding.creatingHealthScoreGrowth')}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <p className="text-sm text-muted-foreground">{t('onboarding.thisWillTakeApproximately')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: URL AutoFill (Step 1) — OB.E.1 ─────────────────────────────────
  if (step === 'url-autofill') {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  {t('onboarding.pasteYourUrl')}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t('onboarding.urlAutoFillDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-purple-50 border-purple-200">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                <strong>Smart AutoFill:</strong> {t('onboarding.urlAutoFillHint')}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-600" />
                <Label className="text-base font-bold text-gray-900">
                  {t('onboarding.yourWebsiteUrl')}
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://tuempresa.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="bg-white"
                />
                <Button
                  onClick={handleExtract}
                  disabled={extracting || !url.trim()}
                  className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
                >
                  {extracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('onboarding.extract')
                  )}
                </Button>
              </div>

              {extractError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 py-2 px-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={skipUrl}
              >
                {t('onboarding.continueWithoutUrl')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Connect tools (Step 3) — OB.E.3 ────────────────────────────────
  if (step === 'connect-tools') {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Database className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  {t('onboarding.connectTools')}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t('onboarding.connectToolsDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-pink-50 border-pink-200">
              <Info className="h-4 w-4 text-pink-600" />
              <AlertDescription className="text-pink-900">
                <strong>{t('onboarding.optional')}:</strong> {t('onboarding.connectToolsHint')}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-3">
              {INTEGRATION_PROVIDERS.map(provider => (
                <button
                  key={provider}
                  type="button"
                  className="p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 text-center transition-colors flex flex-col items-center gap-2"
                  onClick={() => handleProviderClick(provider)}
                >
                  <Database className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize">{provider}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={skipIntegrations}
              >
                {t('onboarding.skipForNow')}
              </button>

              <Button
                onClick={handleGenerate}
                disabled={!canGenerate() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t('onboarding.analyzeBusinessAndGenerate')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Form (Step 2) ───────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                {t('onboarding.analyzeYourBusiness')}
              </CardTitle>
              <CardDescription className="text-base mt-1">{t('onboarding.shareYourKeyMetrics')}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert for context */}
          {extracted && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {t('onboarding.dataExtractedFromUrl')}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-purple-50 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Fast Start:</strong> {t('onboarding.wellAnalyzeYourBusiness')}</AlertDescription>
          </Alert>

          {/* Question 1: Company Name (REQUIRED) */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <Label htmlFor="project_name" className="text-base font-bold text-gray-900">
                1. {t('onboarding.companyName')} <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">{t('onboarding.whatsTheNameOf')}</p>
            <Input
              id="project_name"
              type="text"
              placeholder={t('onboarding.egAcmeIncTechflow')}
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
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <Label htmlFor="description" className="text-base font-bold text-gray-900">
                2. {t('onboarding.whatDoesBusinessDo')} <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              {t('onboarding.briefDescriptionMinChars')}
            </p>
            <Textarea
              id="description"
              placeholder={t('onboarding.exampleB2bSaasPlatform')}
              rows={4}
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="resize-none ml-7 bg-white"
            />
            <div className="flex items-center justify-between ml-7">
              <p className="text-xs text-gray-600">
                {formData.business_description.length} / 30 {t('onboarding.charsMinimum')}
              </p>
              {formData.business_description.length >= 30 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t('onboarding.perfect')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Industry (auto-filled or manual) */}
          {formData.industry && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <Label className="text-base font-medium text-gray-900">
                  {t('onboarding.detectedIndustry')}
                </Label>
              </div>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="bg-white"
              />
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-6 border-t">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('url-autofill')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('onboarding.back')}
              </Button>
              <Button
                onClick={() => setStep('connect-tools')}
                disabled={!canGenerate() || isGenerating}
                className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('onboarding.analyzingBusiness')}</>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t('onboarding.continueToGenerate')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            {!canGenerate() && (
              <div className="flex flex-col gap-2 text-sm mt-3">
                {formData.project_name.trim().length < 3 && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('onboarding.pleaseEnterCompanyName')}</span>
                  </div>
                )}
                {formData.business_description.trim().length < 30 && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('onboarding.pleaseProvideDescription')}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              {t('onboarding.fastStartTakes5Min')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
