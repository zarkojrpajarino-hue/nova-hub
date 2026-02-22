/**
 * TIMING ANALYSIS STEP
 *
 * "Why now?" analysis - Market timing & catalysts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, TrendingUp, Zap, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { TimingAnalysis } from '@/types/ultra-onboarding';

interface TimingAnalysisStepProps {
  timing: Partial<TimingAnalysis>;
  onChange: (timing: Partial<TimingAnalysis>) => void;
}

export function TimingAnalysisStep({ timing, onChange }: TimingAnalysisStepProps) {
  const updateTiming = <K extends keyof TimingAnalysis>(
    key: K,
    value: TimingAnalysis[K]
  ) => {
    onChange({ ...timing, [key]: value });
  };

  const marketCatalysts = [
    {
      id: 'tech_breakthrough',
      label: 'Avance tecnológico reciente',
      description: 'Nueva tech hace esto posible ahora (AI, blockchain, etc.)',
      icon: Zap
    },
    {
      id: 'regulation_change',
      label: 'Cambio regulatorio',
      description: 'Nueva ley/regulación crea oportunidad',
      icon: Clock
    },
    {
      id: 'behavior_shift',
      label: 'Cambio de comportamiento',
      description: 'COVID, remote work, nuevos hábitos de consumo',
      icon: TrendingUp
    },
    {
      id: 'market_gap',
      label: 'Gap en el mercado',
      description: 'Competidor grande dejó espacio o falló',
      icon: Lightbulb
    },
    {
      id: 'cost_decrease',
      label: 'Disminución de costos',
      description: 'Cloud, APIs, herramientas hacen esto económico ahora',
      icon: TrendingUp
    },
    {
      id: 'demographic_shift',
      label: 'Cambio demográfico',
      description: 'Nueva generación con nuevas necesidades',
      icon: TrendingUp
    },
  ];

  const selectedCatalysts = timing.market_catalysts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">⏰ ¿Por Qué Ahora?</h2>
        <p className="text-gray-600">
          Timing is everything. ¿Por qué este es el momento perfecto para tu startup?
        </p>
      </div>

      {/* Market Timing */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Timing del Mercado
          </CardTitle>
          <CardDescription>
            ¿Es el momento correcto para esto?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={timing.market_timing}
            onValueChange={(value) =>
              updateTiming('market_timing', value as TimingAnalysis['market_timing'])
            }
          >
            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50">
              <RadioGroupItem value="perfect_timing" id="perfect_timing" className="mt-1" />
              <Label htmlFor="perfect_timing" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🎯 Timing perfecto</div>
                <div className="text-sm text-gray-600">
                  El mercado está maduro, hay catalizadores claros, momentum fuerte
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-blue-50 to-cyan-50">
              <RadioGroupItem value="early_but_right" id="early_but_right" className="mt-1" />
              <Label htmlFor="early_but_right" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🌱 Early pero correcto</div>
                <div className="text-sm text-gray-600">
                  Tendencia emergente, seré first-mover con ventaja
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-amber-50 to-yellow-50">
              <RadioGroupItem value="opportunistic" id="opportunistic" className="mt-1" />
              <Label htmlFor="opportunistic" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">💡 Oportunista</div>
                <div className="text-sm text-gray-600">
                  Veo una ventana de oportunidad que cerrará pronto
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="timeless_problem" id="timeless_problem" className="mt-1" />
              <Label htmlFor="timeless_problem" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">♾️ Problema atemporal</div>
                <div className="text-sm text-gray-600">
                  No depende de timing, siempre ha sido un problema
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer bg-gradient-to-r from-orange-50 to-red-50">
              <RadioGroupItem value="too_early" id="too_early" className="mt-1" />
              <Label htmlFor="too_early" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">⚠️ Tal vez muy temprano</div>
                <div className="text-sm text-gray-600">
                  El mercado no está listo todavía, pero apuesto a que lo estará
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Timing insights */}
          {timing.market_timing === 'too_early' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Red flag:</strong> "Too early" es la segunda causa más común de fracaso
                después de "no hay mercado". ¿Puedes esperar y construir cuando esté maduro?
              </div>
            </div>
          )}

          {timing.market_timing === 'perfect_timing' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>✅ Strong signal:</strong> Perfect timing + ejecución sólida = high
                probability de éxito. Asegúrate de moverte rápido.
              </div>
            </div>
          )}

          {timing.market_timing === 'early_but_right' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>🌊 Early mover:</strong> First-mover advantage es real pero requiere educar
                al mercado. Necesitarás runway largo y paciencia.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Catalysts */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            ¿Qué está catalizando esta oportunidad?
          </CardTitle>
          <CardDescription>
            Selecciona los factores que hacen que AHORA sea el momento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketCatalysts.map((catalyst) => {
            const Icon = catalyst.icon;
            const isSelected = selectedCatalysts.includes(catalyst.id as TimingAnalysis['market_catalysts'][number]);

            return (
              <div
                key={catalyst.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 border-purple-200 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const current = selectedCatalysts;
                  const updated = isSelected
                    ? current.filter((id) => id !== catalyst.id)
                    : [...current, catalyst.id as TimingAnalysis['market_catalysts'][number]];
                  updateTiming('market_catalysts', updated);
                }}
              >
                <div className={`mt-1 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Checkbox
                      id={catalyst.id}
                      checked={isSelected}
                      onCheckedChange={() => {
                        const current = selectedCatalysts;
                        const updated = isSelected
                          ? current.filter((id) => id !== catalyst.id)
                          : [...current, catalyst.id as TimingAnalysis['market_catalysts'][number]];
                        updateTiming('market_catalysts', updated);
                      }}
                    />
                    <Label htmlFor={catalyst.id} className="font-semibold cursor-pointer">
                      {catalyst.label}
                    </Label>
                  </div>
                  <div className={`text-sm ml-6 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                    {catalyst.description}
                  </div>
                </div>
              </div>
            );
          })}

          {selectedCatalysts.length === 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>Importante:</strong> Si no hay catalizadores claros, ¿por qué ahora y no hace
                5 años? Necesitas una respuesta fuerte a "Why now?".
              </div>
            </div>
          )}

          {selectedCatalysts.length >= 2 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>🚀 Múltiples vientos a favor:</strong> Varios catalizadores convergiendo =
                momentum de mercado fuerte. Aprovecha esta ola.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Why Now Explanation */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Explica tu "Why Now?"
          </CardTitle>
          <CardDescription>
            ¿Por qué este es el momento perfecto para atacar este problema?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={timing.why_now_explanation || ''}
            onChange={(e) => updateTiming('why_now_explanation', e.target.value)}
            placeholder="Ej: 'ChatGPT democratizó IA hace 2 años. Ahora cualquier founder puede integrar AI sin contratar ML engineers. Pero las herramientas no-code todavía no aprovechan esto - siguen sin IA. Hay una ventana de 12-18 meses antes de que Webflow/Bubble integren AI nativamente. Ese es nuestro window.'"
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Esta es tu thesis. Investors preguntarán "Why now?" - necesitas respuesta clara.
          </p>
        </CardContent>
      </Card>

      {/* Window of Opportunity */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            ¿Cuánto dura tu ventana de oportunidad?
          </CardTitle>
          <CardDescription>
            ¿Qué tan urgente es ejecutar esto?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={timing.window_duration}
            onValueChange={(value) =>
              updateTiming('window_duration', value as TimingAnalysis['window_duration'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
              <RadioGroupItem value="short_6_months" id="short_6_months" />
              <Label htmlFor="short_6_months" className="flex-1 cursor-pointer">
                <div className="font-semibold">🔥 Corta (6 meses)</div>
                <div className="text-sm text-gray-600">Urgencia extrema, first-mover crítico</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
              <RadioGroupItem value="medium_1_2_years" id="medium_1_2_years" />
              <Label htmlFor="medium_1_2_years" className="flex-1 cursor-pointer">
                <div className="font-semibold">⏰ Media (1-2 años)</div>
                <div className="text-sm text-gray-600">Ventana razonable para ejecutar</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
              <RadioGroupItem value="long_3_plus_years" id="long_3_plus_years" />
              <Label htmlFor="long_3_plus_years" className="flex-1 cursor-pointer">
                <div className="font-semibold">📅 Larga (3+ años)</div>
                <div className="text-sm text-gray-600">Tendencia estructural, no hay rush</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
              <RadioGroupItem value="evergreen" id="evergreen" />
              <Label htmlFor="evergreen" className="flex-1 cursor-pointer">
                <div className="font-semibold">♾️ Evergreen</div>
                <div className="text-sm text-gray-600">
                  Problema permanente, timing no es factor crítico
                </div>
              </Label>
            </div>
          </RadioGroup>

          {timing.window_duration === 'short_6_months' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>⚠️ Ventana corta:</strong> Con solo 6 meses, necesitas execution impecable y
                full-time dedication. No hay tiempo para side-project mode. ¿Puedes comprometerte?
              </div>
            </div>
          )}

          {timing.window_duration === 'evergreen' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 Problema evergreen:</strong> Sin urgencia de timing, puedes tomarte tiempo
                para validar correctamente y construir sustainable advantage.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Could Close the Window */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            ¿Qué podría cerrar tu ventana?
          </CardTitle>
          <CardDescription>
            ¿Qué evento haría que esta oportunidad desaparezca?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={timing.window_closing_risk || ''}
            onChange={(e) => updateTiming('window_closing_risk', e.target.value)}
            placeholder="Ej: 'Si OpenAI lanza GPT Store con monetización nativa, mi marketplace de GPTs pierde sentido' o 'Si Google integra esta feature en Gmail, game over' o 'Nueva regulación europea podría prohibir este modelo de negocio'"
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Identify riesgos existenciales. Esto te ayuda a priorizar velocity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
