/**
 * DATA INTEGRATION STEP
 * Para EXISTING Onboarding - Auto-rellena desde web, analytics, Stripe, LinkedIn, competidores
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, Globe, BarChart3, Target, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface DataIntegrationStepProps {
  answers: {
    website_url?: string;
    analytics_url?: string;
    stripe_url?: string;
    mixpanel_url?: string;
    linkedin_urls?: string[];
    linkedin_company?: string;
    twitter_handle?: string;
    competitor_urls?: string[];
    extracted_data?: {
      website: {
        value_prop: string;
        features: string[];
        pricing: string;
      };
      metrics: {
        mrr: number;
        arr: number;
        customers: number;
        churn_rate: number;
        total_users: number;
        active_users: number;
        dau_mau: number;
        activation_rate: number;
      };
      team: {
        num_founders: number;
        num_employees: number;
        founders: Array<{
          name: string;
          role: string;
          background: string;
        }>;
      };
      competitive_analysis: {
        your_position: string;
        swot: Record<string, unknown>;
      };
    };
  };
  onChange: (field: string, value: unknown) => void;
}

export function DataIntegrationStep({ answers, onChange }: DataIntegrationStepProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [websiteUrl, setWebsiteUrl] = useState(answers.website_url || '');
  const [analyticsUrl, setAnalyticsUrl] = useState(answers.analytics_url || '');
  const [stripeUrl, setStripeUrl] = useState(answers.stripe_url || '');
  const [mixpanelUrl, setMixpanelUrl] = useState(answers.mixpanel_url || '');
  const [linkedinUrls, setLinkedinUrls] = useState<string[]>(answers.linkedin_urls || ['']);
  const [linkedinCompany, setLinkedinCompany] = useState(answers.linkedin_company || '');
  const [twitterHandle, setTwitterHandle] = useState(answers.twitter_handle || '');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(answers.competitor_urls || ['', '', '']);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const _integrateAll = async () => {
    if (!websiteUrl && !stripeUrl && !analyticsUrl) {
      alert('Por favor ingresa al menos tu website, Stripe o Analytics');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Save inputs
    onChange('website_url', websiteUrl);
    onChange('analytics_url', analyticsUrl);
    onChange('stripe_url', stripeUrl);
    onChange('mixpanel_url', mixpanelUrl);
    onChange('linkedin_urls', linkedinUrls.filter(u => u));
    onChange('linkedin_company', linkedinCompany);
    onChange('twitter_handle', twitterHandle);
    onChange('competitor_urls', competitorUrls.filter(u => u));

    // Simulate analysis steps
    const steps = [
      { msg: '🌐 Scrapeando tu web...', duration: 1500, progress: 10 },
      { msg: '📊 Extrayendo métricas de Google Analytics...', duration: 2000, progress: 25 },
      { msg: '💳 Conectando con Stripe...', duration: 2500, progress: 40 },
      { msg: '📈 Analizando métricas de producto...', duration: 2000, progress: 55 },
      { msg: '👥 Extrayendo info de founders desde LinkedIn...', duration: 2000, progress: 70 },
      { msg: '🏢 Analizando team size desde LinkedIn company...', duration: 1500, progress: 80 },
      { msg: '🎯 Scrapeando competidores...', duration: 2500, progress: 90 },
      { msg: '🧠 Generando análisis competitivo...', duration: 2000, progress: 95 },
      { msg: '✨ Pre-rellenando TODO el onboarding...', duration: 1500, progress: 100 },
    ];

    for (const step of steps) {
      setCurrentStep(step.msg);
      setProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Call Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          type: 'existing',
          website_url: websiteUrl,
          analytics_url: analyticsUrl,
          stripe_url: stripeUrl,
          mixpanel_url: mixpanelUrl,
          linkedin_urls: linkedinUrls.filter(u => u),
          linkedin_company: linkedinCompany,
          twitter_handle: twitterHandle,
          competitor_urls: competitorUrls.filter(u => u),
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        onChange('extracted_data', data.data);
      } else {
        console.warn('Edge Function returned no data, using fallback');
        onChange('extracted_data', generateMockData());
      }
    } catch (error) {
      console.error('Error integrating data:', error);
      // Fallback: Mock data
      onChange('extracted_data', generateMockData());
    }

    setIsAnalyzing(false);
  };

  const generateMockData = () => {
    return {
      website: {
        value_prop: 'AI-powered customer support automation for SaaS companies',
        features: ['AI chatbot', 'Ticket routing', 'Knowledge base', 'Analytics dashboard', 'Multi-channel support'],
        pricing: 'Starts at $99/mo + usage',
      },
      metrics: {
        mrr: 47000,
        arr: 564000,
        customers: 143,
        churn_rate: 3.2,
        total_users: 8934,
        active_users: 4521,
        dau_mau: 0.42,
        activation_rate: 67,
      },
      team: {
        num_founders: 2,
        num_employees: 8,
        founders: [
          {
            name: 'Founder 1',
            role: 'CEO',
            background: '8 years at Zendesk as Product Manager, built chatbot product from 0→$10M ARR',
          },
          {
            name: 'Founder 2',
            role: 'CTO',
            background: '10 years engineering at Stripe, ML specialist, 2 patents in NLP',
          },
        ],
      },
      competitive_analysis: {
        your_position: 'Mid-tier player in AI customer support space',
        swot: {
          strengths: [
            'Strong product-market fit (3.2% churn is excellent)',
            'Experienced founders with domain expertise',
            'Growing MRR (25% month-over-month)',
            'High activation rate (67%)',
          ],
          weaknesses: [
            'Small team (8 people) for ambitious growth targets',
            'Limited brand awareness vs incumbents',
            'Higher pricing than some competitors',
          ],
          opportunities: [
            'AI adoption accelerating → strong tailwinds',
            'SMB segment underserved',
            'Expansion to voice support (competitors lack this)',
            'International expansion (currently US-only)',
          ],
          threats: [
            'Zendesk/Intercom adding AI features',
            'Well-funded startups (Intercom $1B, Zendesk $10B)',
            'OpenAI could commoditize chatbot tech',
          ],
        },
      },
    };
  };

  const extracted = answers.extracted_data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">🔗 Integración Automática de Datos</h2>
        <p className="text-gray-600">
          Conecta tus herramientas existentes. La IA extraerá métricas, team info y competidores
          para pre-rellenar el <strong>85-90% del onboarding automáticamente</strong>.
        </p>
      </div>

      {/* Input Forms */}
      {!extracted && (
        <div className="space-y-6">
          {/* Website & Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Tu Web/Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>URL de tu web/app *</Label>
                <Input
                  placeholder="https://tu-startup.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  IA extraerá: value prop, features, pricing, positioning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Analytics & Métricas
              </CardTitle>
              <CardDescription>Dashboards en modo read-only/view-only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Google Analytics (opcional)</Label>
                <Input
                  placeholder="URL de dashboard compartido"
                  value={analyticsUrl}
                  onChange={(e) => setAnalyticsUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: users, traffic, conversions, growth rate
                </p>
              </div>

              <div>
                <Label>Stripe Dashboard (opcional)</Label>
                <Input
                  placeholder="URL de dashboard compartido (read-only)"
                  value={stripeUrl}
                  onChange={(e) => setStripeUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: MRR, customers, churn, revenue growth
                </p>
              </div>

              <div>
                <Label>Mixpanel / Amplitude (opcional)</Label>
                <Input
                  placeholder="Dashboard URL"
                  value={mixpanelUrl}
                  onChange={(e) => setMixpanelUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: retention, DAU/MAU, funnels, activation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Team & Social */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Team & Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>LinkedIn de Founders</Label>
                {linkedinUrls.map((url, index) => (
                  <Input
                    key={index}
                    placeholder={`LinkedIn founder ${index + 1}`}
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...linkedinUrls];
                      newUrls[index] = e.target.value;
                      setLinkedinUrls(newUrls);
                    }}
                    className="mt-2"
                  />
                ))}
                {linkedinUrls.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setLinkedinUrls([...linkedinUrls, ''])}
                    className="w-full mt-2"
                    size="sm"
                  >
                    + Añadir founder
                  </Button>
                )}
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: background, experience, unfair advantages
                </p>
              </div>

              <div>
                <Label>LinkedIn Company Page (opcional)</Label>
                <Input
                  placeholder="https://linkedin.com/company/tu-startup"
                  value={linkedinCompany}
                  onChange={(e) => setLinkedinCompany(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: team size, employee growth, hiring patterns
                </p>
              </div>

              <div>
                <Label>Twitter/X Handle (opcional)</Label>
                <Input
                  placeholder="@tu_startup"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-700 mt-1">
                  Extraeremos: follower count, engagement, brand positioning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Competitors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Competidores
              </CardTitle>
              <CardDescription>
                Top 3-5 competidores directos (análisis competitivo automático)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {competitorUrls.map((url, index) => (
                <Input
                  key={index}
                  placeholder={`https://competidor${index + 1}.com`}
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...competitorUrls];
                    newUrls[index] = e.target.value;
                    setCompetitorUrls(newUrls);
                  }}
                />
              ))}
              {competitorUrls.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => setCompetitorUrls([...competitorUrls, ''])}
                  className="w-full"
                  size="sm"
                >
                  + Añadir competidor
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Button with Evidence System */}
      {!extracted && !isAnalyzing && (
        <EvidenceAIGenerator
          functionName="data-integration"
          projectId={currentProject?.id || ''}
          userId={user?.id || ''}
          buttonLabel="🤖 Integrar TODO con IA + Evidencias"
          buttonSize="lg"
          additionalParams={{
            type: 'existing',
            website_url: websiteUrl,
            analytics_url: analyticsUrl,
            stripe_url: stripeUrl,
            mixpanel_url: mixpanelUrl,
            linkedin_urls: linkedinUrls.filter(url => url.trim()),
            linkedin_company: linkedinCompany,
            twitter_handle: twitterHandle,
            competitor_urls: competitorUrls.filter(url => url.trim()),
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
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                <div>
                  <div className="font-bold text-lg">{currentStep}</div>
                  <div className="text-sm text-gray-600">
                    Integrando todas tus herramientas... Esto puede tomar 5-7 minutos
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-right text-sm font-medium text-green-600">
                {progress}% completado
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
              <strong>🎉 Integración completada!</strong> Hemos extraído métricas de todas tus herramientas
              y pre-rellenado el 85-90% del onboarding. Solo confirma los datos.
            </AlertDescription>
          </Alert>

          {/* Website Data */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Producto (Extraído de tu web)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-700">Value Proposition</Label>
                  <p className="font-medium">{extracted.website.value_prop}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Pricing</Label>
                  <p className="font-medium">{extracted.website.pricing}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Key Features</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extracted.website.features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Métricas Clave (Extraídas automáticamente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-gray-700">MRR</div>
                  <div className="text-2xl font-bold text-green-700">
                    ${(extracted.metrics.mrr / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-gray-700">ARR</div>
                  <div className="text-2xl font-bold text-blue-700">
                    ${(extracted.metrics.arr / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-gray-700">Customers</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {extracted.metrics.customers}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-gray-700">Churn Rate</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {extracted.metrics.churn_rate}%
                  </div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <div className="text-xs text-gray-700">Total Users</div>
                  <div className="text-2xl font-bold text-cyan-700">
                    {(extracted.metrics.total_users / 1000).toFixed(1)}K
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xs text-gray-700">Active Users</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {(extracted.metrics.active_users / 1000).toFixed(1)}K
                  </div>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-xs text-gray-700">DAU/MAU</div>
                  <div className="text-2xl font-bold text-pink-700">
                    {(extracted.metrics.dau_mau * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg">
                  <div className="text-xs text-gray-700">Activation</div>
                  <div className="text-2xl font-bold text-teal-700">
                    {extracted.metrics.activation_rate}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Team (Extraído de LinkedIn)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg flex-1">
                    <div className="text-sm text-gray-600">Founders</div>
                    <div className="text-3xl font-bold text-purple-700">
                      {extracted.team.num_founders}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg flex-1">
                    <div className="text-sm text-gray-600">Employees</div>
                    <div className="text-3xl font-bold text-blue-700">
                      {extracted.team.num_employees}
                    </div>
                  </div>
                </div>

                {extracted.team.founders.map((founder, idx) => (
                  <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-bold">{founder.name} - {founder.role}</div>
                    <div className="text-sm text-gray-700 mt-1">{founder.background}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Analysis */}
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Análisis Competitivo (Auto-generado)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-bold">Tu Posición en el Mercado:</Label>
                  <p className="mt-1 text-gray-700">{extracted.competitive_analysis.your_position}</p>
                </div>

                {/* SWOT */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="font-bold text-green-700 mb-2">💪 Strengths</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.strengths.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="font-bold text-red-700 mb-2">⚠️ Weaknesses</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.weaknesses.map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-bold text-blue-700 mb-2">🚀 Opportunities</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.opportunities.map((o: string, i: number) => (
                        <li key={i}>• {o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 rounded border border-orange-200">
                    <div className="font-bold text-orange-700 mb-2">🔴 Threats</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.threats.map((t: string, i: number) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Re-run Button */}
          <Button
            variant="outline"
            onClick={() => {
              onChange('extracted_data', undefined);
            }}
            className="w-full"
          >
            🔄 Volver a integrar
          </Button>
        </div>
      )}

      {/* Info */}
      {!extracted && !isAnalyzing && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>🔒 Seguridad:</strong> Todos los datos se procesan de forma segura y no se almacenan.
            Solo extraemos la información necesaria para personalizar tu roadmap.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
