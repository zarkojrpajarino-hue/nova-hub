/**
 * REALITY CHECK STEP
 *
 * Commitment level & reality checks para expectations realistas
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Clock, DollarSign, Lightbulb, Users } from 'lucide-react';
import type { RealityCheckAnswers } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';

interface RealityCheckStepProps {
  answers: Partial<RealityCheckAnswers>;
  onChange: (answers: Partial<RealityCheckAnswers>) => void;
}

export function RealityCheckStep({ answers, onChange }: RealityCheckStepProps) {
  const updateAnswer = <K extends keyof RealityCheckAnswers>(
    key: K,
    value: RealityCheckAnswers[K]
  ) => {
    onChange({ ...answers, [key]: value });
  };

  const getRunwayColor = (months: number) => {
    if (months < 3) return 'text-red-600';
    if (months < 6) return 'text-orange-600';
    if (months < 12) return 'text-blue-600';
    return 'text-green-600';
  };

  const getRunwayEmoji = (months: number) => {
    if (months < 3) return '🔴';
    if (months < 6) return '🟡';
    if (months < 12) return '🟢';
    return '✅';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💭 Reality Check</h2>
        <p className="text-gray-600">
          Seamos honestos sobre tu situación real. Esto nos ayuda a darte recomendaciones realistas.
        </p>
      </div>

      {/* Time Commitment */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Dedicación de Tiempo
          </CardTitle>
          <CardDescription>
            ¿Cuánto tiempo puedes dedicar realmente a esto?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={answers.time_commitment}
            onValueChange={(value) =>
              updateAnswer('time_commitment', value as RealityCheckAnswers['time_commitment'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="full_time" id="full_time" />
              <Label htmlFor="full_time" className="flex-1 cursor-pointer">
                <div className="font-semibold">Full-time (40+ horas/semana)</div>
                <div className="text-sm text-gray-600">Puedo dedicarme 100% a esto</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="part_time" id="part_time" />
              <Label htmlFor="part_time" className="flex-1 cursor-pointer">
                <div className="font-semibold">Part-time (~20 horas/semana)</div>
                <div className="text-sm text-gray-600">Trabajo/otras responsabilidades</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="side_project" id="side_project" />
              <Label htmlFor="side_project" className="flex-1 cursor-pointer">
                <div className="font-semibold">Side project (5-10 horas/semana)</div>
                <div className="text-sm text-gray-600">Fines de semana y noches</div>
              </Label>
            </div>
          </RadioGroup>

          {answers.time_commitment === 'side_project' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>Expectativa realista:</strong> Con 5-10h/semana, el progreso será 4-5x más
                lento. Considera delegar partes o simplificar mucho el alcance inicial.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Runway */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Runway Financiero
          </CardTitle>
          <CardDescription>¿Cuántos meses puedes sobrevivir sin ingresos?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {getRunwayEmoji(answers.financial_runway_months || 0)} Meses de runway:
              </span>
              <span className={cn('text-2xl font-bold', getRunwayColor(answers.financial_runway_months || 0))}>
                {answers.financial_runway_months || 0}
              </span>
            </div>

            <Slider
              value={[answers.financial_runway_months || 6]}
              onValueChange={([value]) => updateAnswer('financial_runway_months', value)}
              max={24}
              step={1}
              className="w-full"
            />

            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-bold text-red-600">{'<3'}</div>
                <div>Alto riesgo</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">3-6</div>
                <div>Arriesgado</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">6-12</div>
                <div>Viable</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">12+</div>
                <div>Ideal</div>
              </div>
            </div>
          </div>

          {(answers.financial_runway_months || 0) < 6 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>⚠️ Runway muy corto:</strong> Con menos de 6 meses de runway, NO
                recomendamos dejar tu trabajo todavía. Primero valida tu idea mientras mantienes
                ingresos estables.
              </div>
            </div>
          )}

          {(answers.financial_runway_months || 0) >= 12 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>✅ Excelente posición:</strong> Con 12+ meses de runway, tienes el tiempo
                necesario para validar, iterar y construir algo sólido sin presión financiera.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Level */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            Experiencia Emprendedora
          </CardTitle>
          <CardDescription>¿Es tu primer startup o ya lo has intentado antes?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.entrepreneurial_experience}
            onValueChange={(value) =>
              updateAnswer('entrepreneurial_experience', value as RealityCheckAnswers['entrepreneurial_experience'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="first_time" id="first_time" />
              <Label htmlFor="first_time" className="flex-1 cursor-pointer">
                <div className="font-semibold">Sí, primera vez</div>
                <div className="text-sm text-gray-600">Nunca he emprendido antes</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="failed_before" id="failed_before" />
              <Label htmlFor="failed_before" className="flex-1 cursor-pointer">
                <div className="font-semibold">He intentado antes (no funcionó)</div>
                <div className="text-sm text-gray-600">Aprendí mucho de la experiencia</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="sold_before" id="sold_before" />
              <Label htmlFor="sold_before" className="flex-1 cursor-pointer">
                <div className="font-semibold">He vendido una startup antes</div>
                <div className="text-sm text-gray-600">Tengo experiencia de éxito</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-purple-200 cursor-pointer">
              <RadioGroupItem value="serial" id="serial" />
              <Label htmlFor="serial" className="flex-1 cursor-pointer">
                <div className="font-semibold">Serial entrepreneur</div>
                <div className="text-sm text-gray-600">He lanzado múltiples proyectos</div>
              </Label>
            </div>
          </RadioGroup>

          {answers.entrepreneurial_experience === 'first_time' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 First-time founder:</strong> Te daremos extra guidance en errores comunes
                y best practices. La mayoría falla por construir sin validar primero.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Support */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            Soporte Familiar
          </CardTitle>
          <CardDescription>
            ¿Tu pareja/familia apoya tu decisión de emprender?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.family_support}
            onValueChange={(value) =>
              updateAnswer('family_support', value as RealityCheckAnswers['family_support'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer">
              <RadioGroupItem value="full_support" id="full_support" />
              <Label htmlFor="full_support" className="flex-1 cursor-pointer">
                <div className="font-semibold">Sí, apoyo total</div>
                <div className="text-sm text-gray-600">Están emocionados y me animan</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer">
              <RadioGroupItem value="neutral" id="neutral" />
              <Label htmlFor="neutral" className="flex-1 cursor-pointer">
                <div className="font-semibold">Neutrales</div>
                <div className="text-sm text-gray-600">No se oponen pero no están emocionados</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer">
              <RadioGroupItem value="have_doubts" id="have_doubts" />
              <Label htmlFor="have_doubts" className="flex-1 cursor-pointer">
                <div className="font-semibold">Tienen dudas/preocupaciones</div>
                <div className="text-sm text-gray-600">Están preocupados por la estabilidad</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer">
              <RadioGroupItem value="not_applicable" id="not_applicable" />
              <Label htmlFor="not_applicable" className="flex-1 cursor-pointer">
                <div className="font-semibold">No aplica</div>
                <div className="text-sm text-gray-600">Vivo solo/a, mi decisión</div>
              </Label>
            </div>
          </RadioGroup>

          {answers.family_support === 'have_doubts' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>Importante:</strong> Tener el apoyo familiar es crucial para el long-term.
                Considera compartir tu plan con ellos, mostrar research, y establecer milestones
                claros para tranquilizarlos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competition for Attention */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle>⏰ ¿Qué más estás haciendo actualmente?</CardTitle>
          <CardDescription>Selecciona todos los que apliquen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 'full_time_job', label: 'Full-time job', description: '40h/semana trabajo' },
              { id: 'freelancing', label: 'Freelancing/consulting', description: 'Trabajo independiente' },
              { id: 'other_projects', label: 'Otros proyectos/startups', description: 'Divido mi atención' },
              { id: 'family_kids', label: 'Familia/hijos pequeños', description: 'Responsabilidades familiares' },
              { id: 'studying', label: 'Estudiando', description: 'Universidad o cursos' },
              { id: 'nothing', label: 'Nada, 100% dedicado a esto', description: 'Full focus' },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-3 rounded-lg border-2 border-transparent hover:border-gray-300"
              >
                <Checkbox
                  id={item.id}
                  checked={answers.competition_for_attention?.includes(item.id as any)}
                  onCheckedChange={(checked) => {
                    const current = answers.competition_for_attention || [];
                    const updated = checked
                      ? [...current, item.id as any]
                      : current.filter((i) => i !== item.id);
                    updateAnswer('competition_for_attention', updated);
                  }}
                />
                <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </Label>
              </div>
            ))}
          </div>

          {answers.competition_for_attention?.includes('full_time_job') &&
            !answers.competition_for_attention?.includes('nothing') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>💼 Recomendación:</strong> No dejes tu trabajo hasta haber validado el
                  problema, tener primeros clientes, y ver product-market fit signals. Bootstrappea
                  mientras tienes ingreso estable.
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
