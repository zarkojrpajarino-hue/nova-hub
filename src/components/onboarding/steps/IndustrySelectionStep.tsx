/**
 * INDUSTRY SELECTION STEP
 *
 * Permite seleccionar industria para branching de preguntas específicas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Store,
  Code,
  Heart,
  GraduationCap,
  DollarSign,
  Plane,
  Home,
  Smartphone,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import type { IndustrySelection } from '@/types/ultra-onboarding';

interface IndustrySelectionStepProps {
  industry: Partial<IndustrySelection>;
  onChange: (industry: Partial<IndustrySelection>) => void;
}

export function IndustrySelectionStep({ industry, onChange }: IndustrySelectionStepProps) {
  const updateIndustry = <K extends keyof IndustrySelection>(
    key: K,
    value: IndustrySelection[K]
  ) => {
    onChange({ ...industry, [key]: value });
  };

  const industries = [
    {
      id: 'saas_b2b',
      icon: Code,
      label: 'SaaS B2B',
      description: 'Software para empresas, subscripciones',
      examples: 'Slack, Salesforce, Notion',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    },
    {
      id: 'ecommerce',
      icon: Store,
      label: 'E-commerce / Marketplace',
      description: 'Venta de productos físicos o marketplace',
      examples: 'Shopify stores, Etsy-like, Amazon-like',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    },
    {
      id: 'consumer_app',
      icon: Smartphone,
      label: 'Consumer App (B2C)',
      description: 'App móvil o web para consumidores',
      examples: 'TikTok, Duolingo, fitness apps',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    },
    {
      id: 'health_wellness',
      icon: Heart,
      label: 'Health & Wellness',
      description: 'Salud, fitness, mental health',
      examples: 'Headspace, Calm, telemedicina',
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
    },
    {
      id: 'education_edtech',
      icon: GraduationCap,
      label: 'Education / EdTech',
      description: 'Aprendizaje online, cursos, tutorías',
      examples: 'Coursera, MasterClass, Duolingo',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    },
    {
      id: 'fintech',
      icon: DollarSign,
      label: 'FinTech',
      description: 'Servicios financieros, payments, crypto',
      examples: 'Stripe, Revolut, Coinbase',
      color: 'from-green-600 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-50',
    },
    {
      id: 'travel_hospitality',
      icon: Plane,
      label: 'Travel & Hospitality',
      description: 'Turismo, hoteles, experiencias',
      examples: 'Airbnb, Booking.com, GetYourGuide',
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-sky-50 to-blue-50',
    },
    {
      id: 'real_estate_proptech',
      icon: Home,
      label: 'Real Estate / PropTech',
      description: 'Bienes raíces, rentas, construcción',
      examples: 'Zillow, Opendoor, property management',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    },
    {
      id: 'professional_services',
      icon: Briefcase,
      label: 'Professional Services',
      description: 'Consulting, agencies, servicios B2B',
      examples: 'Agencies, fractional services, consulting',
      color: 'from-gray-600 to-slate-700',
      bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
    },
    {
      id: 'other',
      icon: Sparkles,
      label: 'Otra industria',
      description: 'No encaja en las categorías anteriores',
      examples: 'Especifica tu industria',
      color: 'from-violet-500 to-fuchsia-600',
      bgColor: 'bg-gradient-to-br from-violet-50 to-fuchsia-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🏢 ¿En qué industria estás?</h2>
        <p className="text-gray-600">
          Esto nos permite hacer preguntas ultra-específicas para tu vertical
        </p>
      </div>

      {/* Industry Selection */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Selecciona tu industria principal
          </CardTitle>
          <CardDescription>
            Elige la que mejor describe tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={industry.industry_vertical}
            onValueChange={(value) =>
              updateIndustry('industry_vertical', value as IndustrySelection['industry_vertical'])
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industries.map((ind) => {
                const Icon = ind.icon;
                const isSelected = industry.industry_vertical === ind.id;

                return (
                  <div
                    key={ind.id}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${ind.bgColor} border-blue-400 shadow-lg ring-2 ring-blue-200`
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                    }`}
                    onClick={() => updateIndustry('industry_vertical', ind.id as IndustrySelection['industry_vertical'])}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={ind.id} id={ind.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={ind.id} className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${ind.color} flex items-center justify-center shadow-md`}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="font-bold text-gray-900">{ind.label}</div>
                          </div>
                          <div className="text-sm text-gray-700 mb-2 font-medium">
                            {ind.description}
                          </div>
                          <div className="text-xs text-gray-700 italic">
                            Ej: {ind.examples}
                          </div>
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Next Steps Info */}
      {industry.industry_vertical && industry.industry_vertical !== 'other' && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-blue-900 mb-2">
                ✨ Siguiente: Preguntas específicas para {industries.find(i => i.id === industry.industry_vertical)?.label}
              </div>
              <div className="text-sm text-blue-800">
                Te haremos preguntas ultra-relevantes para tu industria. Por ejemplo:
              </div>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                {industry.industry_vertical === 'saas_b2b' && (
                  <>
                    <li>• ¿Cuál es tu ICP (Ideal Customer Profile)?</li>
                    <li>• ¿Pricing basado en seats, usage, o flat fee?</li>
                    <li>• ¿Sales-led o product-led growth?</li>
                  </>
                )}
                {industry.industry_vertical === 'ecommerce' && (
                  <>
                    <li>• ¿Dropshipping, inventory propio, o print-on-demand?</li>
                    <li>• ¿Cuál es tu AOV (Average Order Value)?</li>
                    <li>• ¿Estrategia de fulfillment?</li>
                  </>
                )}
                {industry.industry_vertical === 'consumer_app' && (
                  <>
                    <li>• ¿Freemium, ads, subscriptions, o transactions?</li>
                    <li>• ¿Cuál es tu engagement loop?</li>
                    <li>• ¿Network effects o viral growth?</li>
                  </>
                )}
                {industry.industry_vertical === 'health_wellness' && (
                  <>
                    <li>• ¿Necesitas certificaciones médicas?</li>
                    <li>• ¿B2C directo o B2B2C (employers/insurance)?</li>
                    <li>• ¿Estrategia de compliance y HIPAA?</li>
                  </>
                )}
                {industry.industry_vertical === 'education_edtech' && (
                  <>
                    <li>• ¿B2C (estudiantes) o B2B (escuelas)?</li>
                    <li>• ¿Modelo de certificación o skill-building?</li>
                    <li>• ¿Contenido propietario o marketplace de instructores?</li>
                  </>
                )}
                {industry.industry_vertical === 'fintech' && (
                  <>
                    <li>• ¿Regulaciones financieras aplicables?</li>
                    <li>• ¿Partnership con bancos o licencia propia?</li>
                    <li>• ¿Revenue via interchange, fees, o interest?</li>
                  </>
                )}
                {industry.industry_vertical === 'travel_hospitality' && (
                  <>
                    <li>• ¿Modelo de comisión, booking fee, o subscription?</li>
                    <li>• ¿Inventory propio o agregador?</li>
                    <li>• ¿Estrategia de supply acquisition?</li>
                  </>
                )}
                {industry.industry_vertical === 'real_estate_proptech' && (
                  <>
                    <li>• ¿Marketplace, SaaS para agentes, o iBuyer?</li>
                    <li>• ¿Revenue via commissions o subscription?</li>
                    <li>• ¿Estrategia para supply (listings)?</li>
                  </>
                )}
                {industry.industry_vertical === 'professional_services' && (
                  <>
                    <li>• ¿Modelo de pricing (hourly, project, retainer)?</li>
                    <li>• ¿Target SMBs o enterprise?</li>
                    <li>• ¿Sales motion (inbound, outbound, referrals)?</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {industry.industry_vertical === 'other' && (
        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="text-sm text-purple-800">
            <strong>💡 Otra industria:</strong> Continuaremos con preguntas generales aplicables
            a cualquier startup. Si tu vertical es muy específico, cuéntanos más en las siguientes secciones.
          </div>
        </div>
      )}
    </div>
  );
}
