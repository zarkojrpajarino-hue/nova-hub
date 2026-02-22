/**
 * COMPETITOR INTELLIGENCE STEP
 * Para GENERATIVE Onboarding - Auto-genera ideas desde competidores
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, TrendingUp, Target, Lightbulb, X } from 'lucide-react';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface CompetitorIntelligenceStepProps {
  answers: {
    competitor_urls?: string[];
    extracted_data?: {
      competitors: Array<{
        name: string;
        url: string;
        value_prop: string;
        target_audience: string;
        business_model: string;
        pricing: string;
        key_features: string[];
        gaps: string[];
      }>;
      generated_ideas?: Array<{
        title: string;
        description: string;
        based_on_gap: string;
        target_icp: string;
        difficulty: 'easy' | 'medium' | 'hard';
        market_opportunity: string;
      }>;
    };
  };
  onChange: (field: string, value: unknown) => void;
}

export function CompetitorIntelligenceStep({ answers, onChange }: CompetitorIntelligenceStepProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [urls, setUrls] = useState<string[]>(answers.competitor_urls || ['', '', '']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addMoreUrl = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const removeUrl = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const analyzeCompetitors = async () => {
    const validUrls = urls.filter(url => url.trim() !== '' && url.includes('.'));

    if (validUrls.length < 2) {
      alert('Por favor ingresa al menos 2 URLs de competidores');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Save URLs
    onChange('competitor_urls', validUrls);

    // Simulate analysis steps
    const steps = [
      { msg: 'Scrapeando competidores...', duration: 2000, progress: 20 },
      { msg: 'Analizando value propositions...', duration: 2000, progress: 40 },
      { msg: 'Identificando gaps de mercado...', duration: 2000, progress: 60 },
      { msg: 'Generando ideas basadas en gaps...', duration: 2500, progress: 80 },
      { msg: 'Priorizando oportunidades...', duration: 1500, progress: 100 },
    ];

    for (const step of steps) {
      setCurrentStep(step.msg);
      setProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Call Edge Function
    try {
      const response = await fetch('/api/scrape-and-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generative',
          urls: validUrls,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onChange('extracted_data', data.data);
      } else {
        // Fallback: Mock data for demo
        onChange('extracted_data', generateMockData(validUrls));
      }
    } catch (error) {
      console.error('Error analyzing competitors:', error);
      // Fallback: Mock data
      onChange('extracted_data', generateMockData(validUrls));
    }

    setIsAnalyzing(false);
  };

  const generateMockData = (validUrls: string[]) => {
    return {
      competitors: validUrls.map((url, idx) => ({
        name: `Competitor ${idx + 1}`,
        url,
        value_prop: 'Automated workflow management for teams',
        target_audience: 'SMB teams (10-50 people)',
        business_model: 'SaaS subscription',
        pricing: '$10-50/user/month',
        key_features: ['Task management', 'Collaboration', 'Automations', 'Integrations'],
        gaps: [
          'No mobile-first experience',
          'Overwhelming UI for small teams',
          'No AI-powered suggestions',
          'Expensive for startups',
        ],
      })),
      generated_ideas: [
        {
          title: 'Mobile-First Task Manager for Solopreneurs',
          description: 'Ultra-simple task manager optimized for mobile, with AI auto-prioritization',
          based_on_gap: 'Competitors are desktop-first, complex UI, expensive for solo users',
          target_icp: 'Solo founders, freelancers, side-project builders',
          difficulty: 'medium' as const,
          market_opportunity: 'Huge - 50M+ solopreneurs worldwide',
        },
        {
          title: 'AI-Powered Meeting Notes & Action Items',
          description: 'Auto-transcribe meetings, extract action items, create tasks automatically',
          based_on_gap: 'No competitor integrates AI transcription natively',
          target_icp: 'Remote teams, consultants, agencies',
          difficulty: 'medium' as const,
          market_opportunity: 'Medium - growing remote work trend',
        },
      ],
    };
  };

  const extracted = answers.extracted_data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">🔍 Análisis de Competidores con IA</h2>
        <p className="text-gray-600">
          Dinos 2-5 startups que te inspiran. La IA analizará sus features, pricing, gaps
          y generará ideas basadas en oportunidades no explotadas.
        </p>
      </div>

      {/* URL Inputs */}
      {!extracted && (
        <Card>
          <CardHeader>
            <CardTitle>URLs de Competidores</CardTitle>
            <CardDescription>
              Ingresa URLs de startups en el espacio que te interesa (ej: notion.so, airtable.com)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-gray-700">
                    {index === 0 && '(Requerido)'}
                    {index === 1 && '(Requerido)'}
                    {index > 1 && '(Opcional)'}
                  </Label>
                  <Input
                    placeholder={`https://competidor${index + 1}.com`}
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
                {index > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrl(index)}
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {urls.length < 5 && (
              <Button
                variant="outline"
                onClick={addMoreUrl}
                className="w-full"
              >
                + Añadir otro competidor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Button with Evidence System */}
      {!extracted && !isAnalyzing && (
        <EvidenceAIGenerator
          functionName="competitor-intelligence"
          projectId={currentProject?.id || ''}
          userId={user?.id || ''}
          buttonLabel="🔍 Analizar Competidores con IA + Evidencias"
          buttonSize="lg"
          additionalParams={{
            type: 'generative',
            competitor_urls: urls.filter(url => url.trim()),
          }}
          onGenerationComplete={(result) => {
            if (result.content?.data) {
              onChange('extracted_data', result.content.data);
            }
          }}
        />
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <div>
                  <div className="font-bold text-lg">{currentStep}</div>
                  <div className="text-sm text-gray-600">Esto puede tomar 2-3 minutos...</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-right text-sm font-medium text-purple-600">
                {progress}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {extracted && (
        <div className="space-y-6">
          {/* Success Alert */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>¡Análisis completado!</strong> La IA ha identificado {extracted.competitors.length} competidores
              y generado {extracted.generated_ideas?.length || 0} ideas basadas en gaps de mercado.
            </AlertDescription>
          </Alert>

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Análisis de Competidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extracted.competitors.map((comp, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                    <div className="font-bold text-lg mb-2">{comp.name}</div>
                    <div className="text-sm text-gray-600 mb-3">{comp.url}</div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-700">Value Prop:</div>
                        <div className="text-sm">{comp.value_prop}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">Target:</div>
                        <div className="text-sm">{comp.target_audience}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">Pricing:</div>
                        <div className="text-sm">{comp.pricing}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">Model:</div>
                        <div className="text-sm">{comp.business_model}</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Key Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {comp.key_features.map((f, i) => (
                          <Badge key={i} variant="secondary">{f}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-orange-600 mb-1">🔴 Gaps Identificados:</div>
                      <ul className="text-sm space-y-1">
                        {comp.gaps.map((g, i) => (
                          <li key={i} className="text-orange-700">• {g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generated Ideas */}
          {extracted.generated_ideas && extracted.generated_ideas.length > 0 && (
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Ideas Generadas por IA
                </CardTitle>
                <CardDescription>
                  Basadas en gaps y oportunidades no explotadas por competidores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extracted.generated_ideas.map((idea, idx) => {
                    const difficultyColors = {
                      easy: 'bg-green-100 text-green-700 border-green-300',
                      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                      hard: 'bg-red-100 text-red-700 border-red-300',
                    };

                    return (
                      <div key={idx} className="p-5 border-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="font-bold text-xl text-purple-900">{idea.title}</div>
                          <Badge className={difficultyColors[idea.difficulty]}>
                            {idea.difficulty === 'easy' && '🟢 Easy'}
                            {idea.difficulty === 'medium' && '🟡 Medium'}
                            {idea.difficulty === 'hard' && '🔴 Hard'}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3">{idea.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-orange-600">Gap Explotado:</span>
                            <span className="text-gray-700">{idea.based_on_gap}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600">Target ICP:</span>
                            <span className="text-gray-700">{idea.target_icp}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-green-600">Market Opportunity:</span>
                              <span className="text-gray-700 ml-2">{idea.market_opportunity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Re-analyze Button */}
          <Button
            variant="outline"
            onClick={() => {
              onChange('extracted_data', undefined);
              setUrls(answers.competitor_urls || ['', '', '']);
            }}
            className="w-full"
          >
            🔄 Analizar otros competidores
          </Button>
        </div>
      )}

      {/* Info */}
      {!extracted && !isAnalyzing && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Tip:</strong> Cuantos más competidores analices, más insights obtendrás.
            La IA identificará gaps que NADIE está resolviendo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
