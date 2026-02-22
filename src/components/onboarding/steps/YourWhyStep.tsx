/**
 * YOUR WHY STEP
 *
 * Emotional context - el "por qué" profundo del founder
 * Ayuda a personalizar motivaciones y detectar si es sustainable long-term
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Heart, TrendingUp, Users, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { YourWhy } from '@/types/ultra-onboarding';

interface YourWhyStepProps {
  yourWhy: Partial<YourWhy>;
  onChange: (why: Partial<YourWhy>) => void;
}

export function YourWhyStep({ yourWhy, onChange }: YourWhyStepProps) {
  const updateWhy = <K extends keyof YourWhy>(
    key: K,
    value: YourWhy[K]
  ) => {
    onChange({ ...yourWhy, [key]: value });
  };

  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const personalStoryWords = wordCount(yourWhy.personal_story || '');
  const problemPassionWords = wordCount(yourWhy.problem_passion || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">❤️ Tu "Por Qué" Profundo</h2>
        <p className="text-gray-600">
          La motivación real detrás de tu startup. Esto determina tu resiliencia cuando las cosas se pongan difíciles.
        </p>
      </div>

      {/* Primary Motivation */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            ¿Qué te motiva principalmente?
          </CardTitle>
          <CardDescription>
            Sé honesto/a - no hay respuesta correcta, solo la tuya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={yourWhy.primary_motivation}
            onValueChange={(value) =>
              updateWhy('primary_motivation', value as YourWhy['primary_motivation'])
            }
          >
            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-blue-50 to-cyan-50">
              <RadioGroupItem value="solve_problem" id="solve_problem" className="mt-1" />
              <Label htmlFor="solve_problem" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🎯 Resolver un problema que me obsesiona</div>
                <div className="text-sm text-gray-600">
                  Hay algo roto en el mundo que necesito arreglar
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50">
              <RadioGroupItem value="financial_freedom" id="financial_freedom" className="mt-1" />
              <Label htmlFor="financial_freedom" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">💰 Libertad financiera</div>
                <div className="text-sm text-gray-600">
                  Quiero control de mi tiempo y recursos económicos
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50">
              <RadioGroupItem value="prove_myself" id="prove_myself" className="mt-1" />
              <Label htmlFor="prove_myself" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🏆 Demostrar algo (a mí mismo/a o a otros)</div>
                <div className="text-sm text-gray-600">
                  Necesito probar que puedo construir algo grande
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-amber-50 to-orange-50">
              <RadioGroupItem value="build_legacy" id="build_legacy" className="mt-1" />
              <Label htmlFor="build_legacy" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🌟 Construir un legado</div>
                <div className="text-sm text-gray-600">
                  Quiero crear algo que trascienda y tenga impacto duradero
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-cyan-50 to-teal-50">
              <RadioGroupItem value="autonomy" id="autonomy" className="mt-1" />
              <Label htmlFor="autonomy" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🦅 Autonomía y control</div>
                <div className="text-sm text-gray-600">
                  No quiero trabajar para nadie más, ser mi propio/a jefe/a
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50">
              <RadioGroupItem value="creative_expression" id="creative_expression" className="mt-1" />
              <Label htmlFor="creative_expression" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🎨 Expresión creativa</div>
                <div className="text-sm text-gray-600">
                  Quiero construir productos hermosos que amo
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-2 p-4 rounded-lg border-2 border-transparent hover:border-pink-200 cursor-pointer">
              <RadioGroupItem value="help_others" id="help_others" className="mt-1" />
              <Label htmlFor="help_others" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">🤝 Ayudar a otros</div>
                <div className="text-sm text-gray-600">
                  Me motiva genuinamente mejorar la vida de las personas
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Contextual insights */}
          {yourWhy.primary_motivation === 'prove_myself' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>💡 Insight:</strong> "Demostrar algo" es válido como motivación inicial, pero
                long-term necesitas conectar con un propósito más profundo. ¿Qué pasa después de demostrarlo?
              </div>
            </div>
          )}

          {yourWhy.primary_motivation === 'solve_problem' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>✅ Fuerte motivación:</strong> Problem-driven founders tienen 2.3x más probabilidad
                de persistir cuando las cosas se ponen difíciles. Tu obsesión es un activo.
              </div>
            </div>
          )}

          {yourWhy.primary_motivation === 'financial_freedom' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💰 Importante:</strong> Libertad financiera es una meta válida, pero combínala
                con algo más. Los founders puramente money-driven se queman rápido. Conecta con un propósito adicional.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Story */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Tu historia personal
          </CardTitle>
          <CardDescription>
            ¿Qué experiencia de vida te llevó a querer hacer esto?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={yourWhy.personal_story || ''}
              onChange={(e) => updateWhy('personal_story', e.target.value)}
              placeholder="Ej: 'Mi mamá tuvo un negocio que quebró por no tener las herramientas correctas. Vi cómo el estrés financiero afectó nuestra familia. Desde entonces supe que quería construir herramientas que ayudaran a pequeños negocios a sobrevivir y crecer.'"
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-700">
                Comparte tu historia real. Esto nos ayuda a personalizar tu roadmap.
              </p>
              <span className={`text-xs font-medium ${personalStoryWords >= 50 ? 'text-green-600' : 'text-gray-700'}`}>
                {personalStoryWords} palabras {personalStoryWords >= 50 ? '✓' : '(mín. 50)'}
              </span>
            </div>
          </div>

          {personalStoryWords >= 100 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>📖 Historia poderosa:</strong> Founders con historias personales claras comunican
                mejor su visión, levantan funding más fácil, y atraen mejores talentos. Tu historia es tu ventaja.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problem Passion */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            ¿Por qué ESTE problema específicamente?
          </CardTitle>
          <CardDescription>
            ¿Qué te hace la persona ideal para resolver esto?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={yourWhy.problem_passion || ''}
              onChange={(e) => updateWhy('problem_passion', e.target.value)}
              placeholder="Ej: 'Trabajé 5 años en marketing para PYMEs y vi el mismo problema repetirse: gastan miles en ads sin saber si funcionan. Conozco el dolor desde adentro. Tengo las conexiones, entiendo el mercado, y sé exactamente qué features necesitan vs qué les venden.'"
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-700">
                ¿Qué unique insight o experiencia tienes que te da ventaja?
              </p>
              <span className={`text-xs font-medium ${problemPassionWords >= 40 ? 'text-purple-600' : 'text-gray-700'}`}>
                {problemPassionWords} palabras {problemPassionWords >= 40 ? '✓' : '(mín. 40)'}
              </span>
            </div>
          </div>

          {problemPassionWords >= 60 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <strong>🎯 Domain expertise:</strong> Tu experiencia directa en el problema es tu moat.
                Esto te da velocity en decisiones de producto y credibilidad con usuarios.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Who Benefits */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            ¿A quién ayudará esto realmente?
          </CardTitle>
          <CardDescription>
            Describe a las personas cuyas vidas mejorarás
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yourWhy.who_benefits || ''}
            onChange={(e) => updateWhy('who_benefits', e.target.value)}
            placeholder="Ej: 'Madres emprendedoras que tienen productos increíbles pero no saben cómo venderlos online. Personas con talento pero sin acceso a capital o conocimiento de marketing digital. Quiero nivelar el playing field.'"
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Visualiza personas reales. Esto te ayudará cuando necesites recordar por qué empezaste.
          </p>
        </CardContent>
      </Card>

      {/* What Success Looks Like */}
      <Card className="border-2 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            ¿Cómo es el éxito para ti en 5 años?
          </CardTitle>
          <CardDescription>
            Más allá de métricas, ¿qué tiene que ser verdad?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yourWhy.success_vision || ''}
            onChange={(e) => updateWhy('success_vision', e.target.value)}
            placeholder="Ej: 'En 5 años, cuando conozco a un pequeño negocio exitoso, hay 40% de probabilidad de que usen nuestra herramienta. Cuando alguien dice 'voy a emprender', su amigo le recomienda nuestro producto. Y yo puedo trabajar desde donde quiera, con un equipo pequeño pero increíble.'"
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Sé específico. ¿Qué debe cambiar en el mundo para que te sientas exitoso/a?
          </p>
        </CardContent>
      </Card>

      {/* Completion Summary */}
      {personalStoryWords >= 50 && problemPassionWords >= 40 && yourWhy.primary_motivation && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-pink-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-pink-900 mb-2">
                ✨ Tu "Por Qué" está claro
              </div>
              <div className="text-sm text-pink-800">
                Este contexto emocional nos ayudará a:
              </div>
              <ul className="text-sm text-pink-800 mt-2 space-y-1 ml-4">
                <li>• Personalizar recomendaciones según tu motivación real</li>
                <li>• Detectar cuando tu roadmap se aleje de tu propósito</li>
                <li>• Recordarte tu "why" cuando las cosas se pongan difíciles</li>
                <li>• Conectarte con recursos y personas alineados con tu visión</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
