/**
 * GOALS AND STRATEGY STEP
 *
 * Exit strategy & funding goals para alinear roadmap
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Target, TrendingUp, DollarSign, Lightbulb, AlertCircle } from 'lucide-react';
import type { GoalsAndStrategy } from '@/types/ultra-onboarding';

interface GoalsAndStrategyStepProps {
  goals: Partial<GoalsAndStrategy>;
  onChange: (goals: Partial<GoalsAndStrategy>) => void;
}

export function GoalsAndStrategyStep({ goals, onChange }: GoalsAndStrategyStepProps) {
  const updateGoal = <K extends keyof GoalsAndStrategy>(
    key: K,
    value: GoalsAndStrategy[K]
  ) => {
    onChange({ ...goals, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎯 Tus Metas y Estrategia</h2>
        <p className="text-gray-600">
          Define tu north star. Esto cambia completamente el roadmap que te daremos.
        </p>
      </div>

      {/* Final Goal */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            ¿Cuál es tu meta final con esto?
          </CardTitle>
          <CardDescription>
            Sé honesto/a - no hay respuesta correcta, solo diferentes paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={goals.final_goal}
            onValueChange={(value) =>
              updateGoal('final_goal', value as GoalsAndStrategy['final_goal'])
            }
          >
            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-green-50 to-blue-50">
              <RadioGroupItem value="lifestyle_business" id="lifestyle" className="mt-1" />
              <Label htmlFor="lifestyle" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">💼 Lifestyle Business</div>
                <div className="text-sm text-gray-600 mb-2">
                  100K-1M€/año, libertad de tiempo y ubicación, profitable desde día 1
                </div>
                <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                  Bootstrap friendly • Sustainable • Low stress
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-orange-50 to-yellow-50">
              <RadioGroupItem value="acquisition" id="acquisition" className="mt-1" />
              <Label htmlFor="acquisition" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🚀 Acquisition Exit</div>
                <div className="text-sm text-gray-600 mb-2">
                  Vender en 3-5 años, maximizar valor, strategic acquisition
                </div>
                <div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block">
                  Grow fast • Show traction • Build moat
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50">
              <RadioGroupItem value="ipo_unicorn" id="unicorn" className="mt-1" />
              <Label htmlFor="unicorn" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🦄 IPO / Unicorn Path</div>
                <div className="text-sm text-gray-600 mb-2">
                  Venture scale, IPO, construir empresa de $1B+
                </div>
                <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded inline-block">
                  VC-backed • Hyper growth • Massive TAM needed
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-cyan-50 to-teal-50">
              <RadioGroupItem value="social_impact" id="impact" className="mt-1" />
              <Label htmlFor="impact" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🌍 Social Impact</div>
                <div className="text-sm text-gray-600 mb-2">
                  Beneficio social &gt; profit, B-Corp, grants, sustainable
                </div>
                <div className="text-xs text-cyan-700 bg-cyan-100 px-2 py-1 rounded inline-block">
                  Mission-driven • Grants available • Long-term
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="experiment_learn" id="experiment" className="mt-1" />
              <Label htmlFor="experiment" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🧪 Experimentar y Aprender</div>
                <div className="text-sm text-gray-600 mb-2">
                  Aprender entrepreneurship, probar cosas, ver qué funciona
                </div>
                <div className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                  Learning mode • Low pressure • Iterate fast
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Contextual tips */}
          {goals.final_goal === 'lifestyle_business' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>✅ Lifestyle approach:</strong> Focus en profitability rápida, unit
                economics sanos, low CAC. Evita venture debt. Target: 40-60% profit margin.
              </div>
            </div>
          )}

          {goals.final_goal === 'ipo_unicorn' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <strong>⚠️ Unicorn path:</strong> Necesitas: TAM $10B+, 3-4x YoY growth, network
                effects o moat fuerte, team excepcional, fundraise obligatorio. Solo ~0.1% llegan.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funding Strategy */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Estrategia de Funding
          </CardTitle>
          <CardDescription>¿Planeas fundraise o ir bootstrapped?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={goals.funding_strategy}
            onValueChange={(value) =>
              updateGoal('funding_strategy', value as GoalsAndStrategy['funding_strategy'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="bootstrap" id="bootstrap" />
              <Label htmlFor="bootstrap" className="flex-1 cursor-pointer">
                <div className="font-semibold">Bootstrap (profitable desde día 1)</div>
                <div className="text-sm text-gray-600">
                  Sin inversores, crecimiento orgánico, mantener equity
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="raise_seed" id="seed" />
              <Label htmlFor="seed" className="flex-1 cursor-pointer">
                <div className="font-semibold">Raise Seed (100K-500K)</div>
                <div className="text-sm text-gray-600">
                  Angel/seed round para acelerar growth
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="raise_series_a" id="series_a" />
              <Label htmlFor="series_a" className="flex-1 cursor-pointer">
                <div className="font-semibold">Raise Series A+ (1M+)</div>
                <div className="text-sm text-gray-600">Venture scale, hypergrowth mode</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="not_sure" id="not_sure" />
              <Label htmlFor="not_sure" className="flex-1 cursor-pointer">
                <div className="font-semibold">No estoy seguro/a</div>
                <div className="text-sm text-gray-600">Depende de la tracción que logre</div>
              </Label>
            </div>
          </RadioGroup>

          {/* If planning to raise */}
          {(goals.funding_strategy === 'raise_seed' ||
            goals.funding_strategy === 'raise_series_a') && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">¿Cuándo planeas fundraise?</Label>
              <RadioGroup
                value={goals.fundraise_timeline}
                onValueChange={(value) =>
                  updateGoal('fundraise_timeline', value as GoalsAndStrategy['fundraise_timeline'])
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="next_3_months" id="next_3" />
                  <Label htmlFor="next_3" className="cursor-pointer text-sm">
                    En próximos 3 meses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6_12_months" id="6_12" />
                  <Label htmlFor="6_12" className="cursor-pointer text-sm">
                    En 6-12 meses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="after_traction" id="after_traction" />
                  <Label htmlFor="after_traction" className="cursor-pointer text-sm">
                    Después de tener tracción (12+ meses)
                  </Label>
                </div>
              </RadioGroup>

              {goals.fundraise_timeline === 'next_3_months' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <strong>Reality check:</strong> VCs quieren ver: problem validation, early
                    traction, strong team, clear differentiation. Si no tienes esto, considera
                    esperar 6 meses y construir primero.
                  </div>
                </div>
              )}
            </div>
          )}

          {goals.funding_strategy === 'bootstrap' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>💪 Bootstrap:</strong> Mantén control total, cero dilución, sustainable
                growth. Historias de éxito: Basecamp, Mailchimp, TinyLetter. Focus en cash flow
                positivo ASAP.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-gray-600" />
            ¿Por qué esto es importante para ti?
          </CardTitle>
          <CardDescription>Ayúdanos a entender tu motivación real (opcional)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={goals.why_this_matters || ''}
            onChange={(e) => updateGoal('why_this_matters', e.target.value)}
            placeholder="Ej: 'Quiero libertad financiera para pasar más tiempo con mi familia' o 'Quiero demostrar que puedo construir algo grande' o 'Quiero resolver este problema que me frustra hace años'"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Esto nos ayuda a personalizar las recomendaciones según tus motivaciones reales.
          </p>
        </CardContent>
      </Card>

      {/* Summary Box */}
      {goals.final_goal && goals.funding_strategy && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-blue-900 mb-2">Tu Path:</div>
              <div className="text-sm text-blue-800">
                {goals.final_goal === 'lifestyle_business' &&
                  'Construirás un negocio sustainable, profitable, que te dé libertad. Roadmap enfocado en unit economics, CAC bajo, y retention.'}
                {goals.final_goal === 'acquisition' &&
                  'Tu objetivo es construir valor y vender en 3-5 años. Roadmap enfocado en growth metrics, moat building, y strategic positioning.'}
                {goals.final_goal === 'ipo_unicorn' &&
                  'Vas por el unicorn path. Roadmap enfocado en TAM massive, network effects, hypergrowth, y fundraising.'}
                {goals.final_goal === 'social_impact' &&
                  'Tu misión es impacto social. Roadmap enfocado en beneficio social, grants, sustainable model, y community.'}
                {goals.final_goal === 'experiment_learn' &&
                  'Estás en modo aprendizaje. Roadmap enfocado en quick experiments, fast iteration, y minimal viable products.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
