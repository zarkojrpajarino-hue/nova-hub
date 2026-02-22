/**
 * LOCATION STEP
 * Geo-personalization - Diferentes outputs para cada onboarding type
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, TrendingUp, Users, DollarSign, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface LocationStepProps {
  answers: {
    city?: string;
    country?: string;
    local_context?: {
      investors: Array<{
        name: string;
        type: string;
        focus: string;
        website?: string;
      }>;
      accelerators: Array<{
        name: string;
        focus: string;
        website?: string;
      }>;
      costs: {
        dev_salary_range: string;
        office_coworking: string;
        avg_burn_rate: string;
      };
      grants: Array<{
        name: string;
        amount: string;
        eligibility: string;
      }>;
      regulations: Array<{
        area: string;
        description: string;
      }>;
      events: Array<{
        name: string;
        type: string;
      }>;
    };
  };
  onChange: (field: string, value: unknown) => void;
  onboardingType: 'generative' | 'idea' | 'existing'; // Added to personalize by type
}

export function LocationStep({ answers, onChange, onboardingType }: LocationStepProps) {
  const [city, setCity] = useState(answers.city || '');
  const [country, setCountry] = useState(answers.country || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLocalContext = async () => {
    if (!city || !country) {
      alert('Por favor ingresa ciudad y país');
      return;
    }

    setIsGenerating(true);

    // Save location
    onChange('city', city);
    onChange('country', country);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Use mock data directly (Edge Function not deployed yet)
    // TODO: Deploy generate-local-context Edge Function for real geo-intelligence
    onChange('local_context', generateMockData(city, country, onboardingType));

    setIsGenerating(false);
  };

  const generateMockData = (city: string, country: string, _type: string) => {
    // Mock data - would be real data from API
    if (country.toLowerCase() === 'españa' || country.toLowerCase() === 'spain') {
      return {
        investors: [
          {
            name: 'K Fund',
            type: 'VC',
            focus: 'Pre-seed, Seed (€500K-€3M)',
            website: 'kfund.vc',
          },
          {
            name: 'Seaya Ventures',
            type: 'VC',
            focus: 'Series A-B (€5M-€20M)',
            website: 'seaya.vc',
          },
          {
            name: 'JME Ventures',
            type: 'VC',
            focus: 'Early stage tech',
            website: 'jmeventures.com',
          },
        ],
        accelerators: [
          {
            name: 'Lanzadera',
            focus: 'Early-stage startups',
            website: 'lanzadera.es',
          },
          {
            name: 'Demium Startups',
            focus: 'Idea → MVP acceleration',
            website: 'demium.com',
          },
        ],
        costs: {
          dev_salary_range: '€45K-€70K/año',
          office_coworking: '€200-€500/mes',
          avg_burn_rate: '€12K-€18K/mes (team of 3-4)',
        },
        grants: [
          {
            name: 'ENISA',
            amount: 'Hasta €300K',
            eligibility: 'Startups innovadoras con tracción',
          },
          {
            name: 'CDTI',
            amount: 'Hasta €200K',
            eligibility: 'I+D+i projects',
          },
        ],
        regulations: [
          {
            area: 'Legal Structure',
            description: 'SL (Sociedad Limitada) es lo más común. €3K capital mínimo.',
          },
          {
            area: 'GDPR',
            description: 'Obligatorio cumplir GDPR si manejas datos de usuarios EU.',
          },
        ],
        events: [
          {
            name: 'South Summit',
            type: 'Conference (anual)',
          },
          {
            name: 'Startup Grind Madrid',
            type: 'Monthly meetups',
          },
        ],
      };
    }

    // Default US data
    return {
      investors: [
        {
          name: 'Y Combinator',
          type: 'Accelerator + VC',
          focus: 'Pre-seed ($500K)',
          website: 'ycombinator.com',
        },
        {
          name: 'First Round Capital',
          type: 'VC',
          focus: 'Seed ($1M-$3M)',
          website: 'firstround.com',
        },
      ],
      accelerators: [
        {
          name: 'Y Combinator',
          focus: 'World-class accelerator',
          website: 'ycombinator.com',
        },
        {
          name: 'Techstars',
          focus: 'Mentorship-driven',
          website: 'techstars.com',
        },
      ],
      costs: {
        dev_salary_range: '$100K-$180K/year',
        office_coworking: '$400-$800/month',
        avg_burn_rate: '$25K-$40K/month (team of 3-4)',
      },
      grants: [
        {
          name: 'SBIR/STTR',
          amount: 'Up to $1.5M',
          eligibility: 'Tech R&D companies',
        },
      ],
      regulations: [
        {
          area: 'Legal Structure',
          description: 'Delaware C-Corp is standard for VC-backed startups',
        },
        {
          area: 'Privacy',
          description: 'CCPA compliance required if serving California users',
        },
      ],
      events: [
        {
          name: 'TechCrunch Disrupt',
          type: 'Conference (annual)',
        },
      ],
    };
  };

  const localContext = answers.local_context;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">📍 ¿Desde Dónde Emprendes?</h2>
        <p className="text-gray-600">
          Tu ubicación importa. La IA generará contexto local: inversores, costos, regulaciones,
          eventos y recursos <strong>específicos de tu ciudad</strong>.
        </p>
      </div>

      {/* Location Input */}
      {!localContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Tu Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ciudad *</Label>
              <Input
                placeholder="Ej: Madrid, San Francisco, London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>País *</Label>
              <Input
                placeholder="Ej: España, USA, UK"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!localContext && !isGenerating && (
        <Button
          size="lg"
          onClick={generateLocalContext}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generar Contexto Local
        </Button>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              <div>
                <div className="font-bold text-lg">Generando contexto de {city}, {country}...</div>
                <div className="text-sm text-gray-600">
                  Buscando inversores, costos, regulaciones y eventos locales...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {localContext && (
        <div className="space-y-6">
          {/* Success Alert */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Contexto generado!</strong> Aquí está el ecosistema de {city}, {country}
              específicamente para tu etapa.
            </AlertDescription>
          </Alert>

          {/* Investors */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                {onboardingType === 'existing' ? 'Inversores Series A+ en tu zona' : 'Inversores Locales'}
              </CardTitle>
              <CardDescription>
                {onboardingType === 'generative' && 'Pre-seed y angels en tu región'}
                {onboardingType === 'idea' && 'Seed stage investors cerca de ti'}
                {onboardingType === 'existing' && 'VCs que pueden liderar tu Series A/B'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {localContext.investors.map((investor, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-blue-900">{investor.name}</div>
                        <div className="text-sm text-gray-600">{investor.focus}</div>
                      </div>
                      <Badge className="bg-blue-600">{investor.type}</Badge>
                    </div>
                    {investor.website && (
                      <a
                        href={`https://${investor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        {investor.website}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accelerators (only for generative and idea) */}
          {(onboardingType === 'generative' || onboardingType === 'idea') && (
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Aceleradoras en tu Zona
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {localContext.accelerators.map((acc, idx) => (
                    <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="font-bold text-purple-900">{acc.name}</div>
                      <div className="text-sm text-gray-600">{acc.focus}</div>
                      {acc.website && (
                        <a
                          href={`https://${acc.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                        >
                          {acc.website}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Costs */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                {onboardingType === 'existing' ? 'Costos de Hiring en tu Ciudad' : 'Costos Operativos Locales'}
              </CardTitle>
              <CardDescription>
                {onboardingType === 'existing'
                  ? 'Salarios de mercado para tu próximo hiring'
                  : 'Para calcular burn rate y runway'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Dev Salary:</span>
                  <span className="text-green-700 font-bold">{localContext.costs.dev_salary_range}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Coworking:</span>
                  <span className="text-green-700 font-bold">{localContext.costs.office_coworking}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Avg Burn Rate:</span>
                  <span className="text-green-700 font-bold">{localContext.costs.avg_burn_rate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grants */}
          {localContext.grants.length > 0 && (
            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  Grants & Funding (No-Dilutive)
                </CardTitle>
                <CardDescription>Disponibles en {country}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {localContext.grants.map((grant, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-yellow-900">{grant.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{grant.eligibility}</div>
                        </div>
                        <Badge className="bg-yellow-600">{grant.amount}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regulations (only for existing) */}
          {onboardingType === 'existing' && localContext.regulations.length > 0 && (
            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Regulaciones Clave en {country}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {localContext.regulations.map((reg, idx) => (
                    <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="font-bold text-red-900">{reg.area}</div>
                      <div className="text-sm text-gray-700 mt-1">{reg.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events */}
          <Card className="border-2 border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                Eventos & Comunidad
              </CardTitle>
              <CardDescription>
                {onboardingType === 'generative' && 'Para networking y encontrar co-founders'}
                {onboardingType === 'idea' && 'Para conseguir beta testers y early adopters'}
                {onboardingType === 'existing' && 'Para networking con investors y partners'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {localContext.events.map((event, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-cyan-50 rounded">
                    <span className="font-medium">{event.name}</span>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Change Location Button */}
          <Button
            variant="outline"
            onClick={() => {
              onChange('local_context', undefined);
              setCity('');
              setCountry('');
            }}
            className="w-full"
          >
            🔄 Cambiar ubicación
          </Button>
        </div>
      )}

      {/* Info */}
      {!localContext && !isGenerating && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Por qué importa:</strong> Los roadmaps generados incluirán costos reales de tu ciudad,
            warm intros a investors locales, y tácticas específicas de tu mercado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
