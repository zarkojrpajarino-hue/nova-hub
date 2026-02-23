/**
 * AUTO-FILL STEP
 * Para IDEA Onboarding - Auto-rellena desde web, LinkedIn, competidores
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, Globe, Linkedin, Target, TrendingUp, X, Mic, MessageSquare, Instagram, Twitter, Facebook } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  currentRecognition?: SpeechRecognitionInstance;
}

interface AutoFillStepProps {
  answers: {
    business_pitch?: string;
    social_media_urls?: {
      instagram?: string;
      twitter?: string;
      facebook?: string;
      tiktok?: string;
    };
    your_website_url?: string;
    linkedin_urls?: string[];
    competitor_urls?: string[];
    extracted_data?: {
      your_startup: {
        value_prop: string;
        target_audience: string;
        key_features: string[];
        pricing: string;
        industry: string;
      };
      founders: Array<{
        name: string;
        linkedin: string;
        background: string;
        skills: string[];
        unfair_advantages: string[];
      }>;
      competitors: Array<{
        name: string;
        url: string;
        differentiation: string;
      }>;
      competitive_analysis: {
        your_differentiation: string[];
        market_gaps: string[];
        swot: {
          strengths: string[];
          weaknesses: string[];
          opportunities: string[];
          threats: string[];
        };
      };
    };
  };
  onChange: (field: string, value: unknown) => void;
}

export function AutoFillStep({ answers, onChange }: AutoFillStepProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [businessPitch, setBusinessPitch] = useState(answers.business_pitch || '');
  const [socialMedia, setSocialMedia] = useState(answers.social_media_urls || {});
  const [isRecording, setIsRecording] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(answers.your_website_url || '');
  const [linkedinUrls, setLinkedinUrls] = useState<string[]>(answers.linkedin_urls || ['']);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(answers.competitor_urls || ['', '']);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const addLinkedinUrl = () => {
    if (linkedinUrls.length < 5) {
      setLinkedinUrls([...linkedinUrls, '']);
    }
  };

  const removeLinkedinUrl = (index: number) => {
    setLinkedinUrls(linkedinUrls.filter((_, i) => i !== index));
  };

  const addCompetitorUrl = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };

  const removeCompetitorUrl = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      // Start recording
      const recognition = new (window as WindowWithSpeech).webkitSpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setBusinessPitch(prev => prev + ' ' + transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);

      // Store recognition instance for stopping later
      (window as WindowWithSpeech).currentRecognition = recognition;
    } else {
      // Stop recording
      if ((window as WindowWithSpeech).currentRecognition) {
        (window as WindowWithSpeech).currentRecognition!.stop();
      }
      setIsRecording(false);
    }
  };

  const _autoFill = async () => {
    const validLinkedins = linkedinUrls.filter(url => url.trim() !== '');
    const validCompetitors = competitorUrls.filter(url => url.trim() !== '');

    if (!businessPitch && !websiteUrl && validLinkedins.length === 0 && validCompetitors.length === 0 && !socialMedia.instagram && !socialMedia.twitter) {
      alert('Por favor cuéntanos tu negocio o ingresa al menos una URL (website, LinkedIn, redes sociales o competidores)');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Save inputs
    onChange('business_pitch', businessPitch);
    onChange('social_media_urls', socialMedia);
    onChange('your_website_url', websiteUrl);
    onChange('linkedin_urls', validLinkedins);
    onChange('competitor_urls', validCompetitors);

    // Simulate analysis steps
    const steps = [
      { msg: '🌐 Analizando tu web...', duration: 2000, progress: 15 },
      { msg: '👤 Extrayendo founder profiles...', duration: 2000, progress: 30 },
      { msg: '🔍 Scrapeando competidores...', duration: 2500, progress: 50 },
      { msg: '🧠 Generando análisis competitivo...', duration: 2500, progress: 70 },
      { msg: '🎯 Identificando tu diferenciación...', duration: 2000, progress: 85 },
      { msg: '✨ Pre-rellenando respuestas...', duration: 1500, progress: 100 },
    ];

    for (const step of steps) {
      setCurrentStep(step.msg);
      setProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Call Edge Function for real AI analysis
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          type: 'idea',
          business_pitch: businessPitch,
          social_media_urls: socialMedia,
          website_url: websiteUrl,
          linkedin_urls: validLinkedins,
          competitor_urls: validCompetitors,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onChange('extracted_data', result.data);
      } else {
        onChange('extracted_data', generateMockData());
      }
    } catch (_error) {
      // Fallback to mock data if Edge Function fails
      onChange('extracted_data', generateMockData());
    }

    setIsAnalyzing(false);
  };

  const generateMockData = () => {
    return {
      your_startup: {
        value_prop: 'AI-powered task management that learns your priorities',
        target_audience: 'Solo founders and small teams (1-10 people)',
        key_features: ['AI auto-prioritization', 'Voice input', 'Mobile-first', 'Slack integration'],
        pricing: 'Free tier + $9/mo Pro',
        industry: 'SaaS B2B (Productivity)',
      },
      founders: [
        {
          name: 'Founder 1',
          linkedin: linkedinUrls[0] || '',
          background: '10 years in product management at Google, built internal tools for 5000+ employees',
          skills: ['Product Management', 'AI/ML', 'Growth Marketing', 'Team Leadership'],
          unfair_advantages: [
            'Deep product experience at scale',
            'Network of 200+ PMs who could be early adopters',
            'Technical background - can ship MVP solo',
          ],
        },
      ],
      competitors: competitorUrls.filter(u => u).map((url, idx) => ({
        name: `Competitor ${idx + 1}`,
        url,
        differentiation: 'Desktop-first, complex UI, expensive for small teams',
      })),
      competitive_analysis: {
        your_differentiation: [
          'Mobile-first (competitors are desktop-first)',
          'AI-native (competitors bolt-on AI)',
          'Affordable for solopreneurs ($9 vs $15-50)',
          'Voice input (unique feature)',
        ],
        market_gaps: [
          'No competitor targets solo founders specifically',
          'All competitors have overwhelming UI',
          'No mobile-optimized solution exists',
        ],
        swot: {
          strengths: [
            'Founder has PM experience at scale',
            'Strong network for early adoption',
            'Affordable pricing → low barrier',
            'Mobile-first → huge TAM (mobile-only users)',
          ],
          weaknesses: [
            'Solo founder (no co-founder yet)',
            'No funding raised',
            'Crowded market (50+ competitors)',
          ],
          opportunities: [
            'Remote work trend → more solo founders',
            'Mobile usage increasing',
            'AI becoming table stakes → early mover advantage',
          ],
          threats: [
            'Notion/ClickUp could add mobile-first features',
            'Well-funded competitors (Asana $1.5B, Monday $7B)',
            'Low switching costs → need strong retention',
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
        <h2 className="text-2xl font-bold mb-2 text-gray-900">🚀 Auto-Relleno Inteligente con IA</h2>
        <p className="text-gray-700 text-base">
          Cuéntanos tu negocio o comparte URLs. La IA extraerá información y
          pre-rellenará el 80% del onboarding. Solo tendrás que revisar y confirmar.
        </p>
      </div>

      {/* Input Forms */}
      {!extracted && (
        <div className="space-y-6">
          {/* Business Pitch - NEW */}
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Cuéntanos tu negocio
              </CardTitle>
              <CardDescription>
                Escribe o graba hablando sobre tu idea. La IA extraerá toda la información.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="Ej: Estamos creando una plataforma SaaS para ayudar a pequeños negocios a automatizar su contabilidad. Nuestro target son empresas de 5-50 empleados que gastan mucho tiempo en tareas manuales..."
                  value={businessPitch}
                  onChange={(e) => setBusinessPitch(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className="absolute bottom-3 right-3"
                  onClick={toggleVoiceRecording}
                >
                  <Mic className={`h-4 w-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                  {isRecording ? 'Detener' : 'Grabar voz'}
                </Button>
              </div>
              <p className="text-xs text-purple-700">
                💡 Puedes escribir o grabarte hablando. La IA extraerá: problema, solución, target audience, competencia, etc.
              </p>
            </CardContent>
          </Card>

          {/* Social Media - NEW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-600" />
                Redes Sociales
              </CardTitle>
              <CardDescription>
                Si tienes presencia en redes sociales (opcional pero útil)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Instagram className="h-3 w-3" /> Instagram
                  </Label>
                  <Input
                    placeholder="@tu_cuenta o URL"
                    value={socialMedia.instagram || ''}
                    onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Twitter className="h-3 w-3" /> Twitter/X
                  </Label>
                  <Input
                    placeholder="@tu_cuenta o URL"
                    value={socialMedia.twitter || ''}
                    onChange={(e) => setSocialMedia(prev => ({ ...prev, twitter: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Facebook className="h-3 w-3" /> Facebook
                  </Label>
                  <Input
                    placeholder="URL de tu página"
                    value={socialMedia.facebook || ''}
                    onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" /> TikTok
                  </Label>
                  <Input
                    placeholder="@tu_cuenta o URL"
                    value={socialMedia.tiktok || ''}
                    onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-700 mt-2">
                IA extraerá: audiencia, engagement, tipo de contenido, posicionamiento
              </p>
            </CardContent>
          </Card>

          {/* Your Website */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Tu Web/Landing Page
              </CardTitle>
              <CardDescription>
                Si ya tienes web o landing page (aunque sea básica)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://tu-startup.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <p className="text-xs text-gray-700 mt-2">
                IA extraerá: value prop, features, target audience, pricing
              </p>
            </CardContent>
          </Card>

          {/* LinkedIn Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                LinkedIn de Founder(s)
              </CardTitle>
              <CardDescription>
                La IA identificará tu background y unfair advantages automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedinUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="https://linkedin.com/in/tu-perfil"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...linkedinUrls];
                        newUrls[index] = e.target.value;
                        setLinkedinUrls(newUrls);
                      }}
                    />
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLinkedinUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {linkedinUrls.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addLinkedinUrl}
                  className="w-full"
                  size="sm"
                >
                  + Añadir otro founder
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Competitors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                URLs de Competidores
              </CardTitle>
              <CardDescription>
                La IA hará análisis competitivo automático y SWOT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitorUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`https://competidor${index + 1}.com`}
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...competitorUrls];
                        newUrls[index] = e.target.value;
                        setCompetitorUrls(newUrls);
                      }}
                    />
                  </div>
                  {index > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompetitorUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {competitorUrls.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addCompetitorUrl}
                  className="w-full"
                  size="sm"
                >
                  + Añadir otro competidor
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auto-Fill Button with Evidence System */}
      {!extracted && !isAnalyzing && (
        <EvidenceAIGenerator
          functionName="idea-autofill"
          projectId={currentProject?.id || ''}
          userId={user?.id || ''}
          buttonLabel="🤖 Auto-Rellenar con IA + Evidencias"
          buttonSize="lg"
          additionalParams={{
            type: 'idea',
            business_pitch: businessPitch,
            social_media_urls: socialMedia,
            website_url: websiteUrl,
            linkedin_urls: linkedinUrls.filter(url => url.trim()),
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
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <div>
                  <div className="font-bold text-lg">{currentStep}</div>
                  <div className="text-sm text-gray-600">Analizando y pre-rellenando...</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-right text-sm font-medium text-blue-600">
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
              <strong>✅ Auto-relleno completado!</strong> Hemos pre-rellenado información de tu startup,
              founders y competidores. Revisa y confirma los datos extraídos.
            </AlertDescription>
          </Alert>

          {/* Your Startup */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Tu Startup (Extraído)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-700">Value Proposition</Label>
                  <p className="font-medium">{extracted.your_startup.value_prop}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Target Audience</Label>
                  <p className="font-medium">{extracted.your_startup.target_audience}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Industry</Label>
                  <p className="font-medium">{extracted.your_startup.industry}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Pricing</Label>
                  <p className="font-medium">{extracted.your_startup.pricing}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-700">Key Features</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extracted.your_startup.key_features.map((f, i) => (
                      <Badge key={i} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Founders */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                Founder Profile(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extracted.founders.map((founder, idx) => (
                  <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-bold mb-2">{founder.name}</div>
                    <div className="text-sm mb-3 text-gray-700">{founder.background}</div>

                    <div className="mb-3">
                      <Label className="text-xs text-gray-700">Skills</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {founder.skills.map((s, i) => (
                          <Badge key={i} className="bg-blue-100 text-blue-700">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-green-600 font-semibold">✨ Unfair Advantages Identificados:</Label>
                      <ul className="text-sm mt-1 space-y-1">
                        {founder.unfair_advantages.map((adv, i) => (
                          <li key={i} className="text-green-700">• {adv}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Analysis */}
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Análisis Competitivo (Auto-generado)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Your Differentiation */}
                <div>
                  <Label className="text-sm font-bold text-green-600">✅ Tu Diferenciación:</Label>
                  <ul className="text-sm mt-2 space-y-1">
                    {extracted.competitive_analysis.your_differentiation.map((diff, i) => (
                      <li key={i} className="text-gray-700">• {diff}</li>
                    ))}
                  </ul>
                </div>

                {/* Market Gaps */}
                <div>
                  <Label className="text-sm font-bold text-blue-600">🎯 Market Gaps Identificados:</Label>
                  <ul className="text-sm mt-2 space-y-1">
                    {extracted.competitive_analysis.market_gaps.map((gap, i) => (
                      <li key={i} className="text-gray-700">• {gap}</li>
                    ))}
                  </ul>
                </div>

                {/* SWOT */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="font-bold text-green-700 mb-2">💪 Strengths</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.strengths.slice(0, 3).map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="font-bold text-red-700 mb-2">⚠️ Weaknesses</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.weaknesses.slice(0, 3).map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-bold text-blue-700 mb-2">🚀 Opportunities</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.opportunities.slice(0, 3).map((o, i) => (
                        <li key={i}>• {o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 rounded border border-orange-200">
                    <div className="font-bold text-orange-700 mb-2">🔴 Threats</div>
                    <ul className="text-xs space-y-1">
                      {extracted.competitive_analysis.swot.threats.slice(0, 3).map((t, i) => (
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
            🔄 Volver a analizar
          </Button>
        </div>
      )}

      {/* Info */}
      {!extracted && !isAnalyzing && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Tip:</strong> Cuanta más información proporciones, mejor será el pre-relleno.
            Puedes saltar cualquier campo si no aplica.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
