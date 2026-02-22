/**
 * TYPE SELECTION STEP
 * Permite al usuario elegir entre 3 tipos de onboarding
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { OnboardingType } from '@/types/ultra-onboarding';

interface TypeSelectionStepProps {
  onSelect: (type: OnboardingType) => void;
  selected: OnboardingType | null;
}

export function TypeSelectionStep({ onSelect, selected }: TypeSelectionStepProps) {
  const types = [
    {
      id: 'generative' as OnboardingType,
      icon: Lightbulb,
      title: 'Generación de Ideas',
      subtitle: 'No tengo idea clara aún',
      description: 'La IA analizará tus skills, industria e intereses para generar 5-10 ideas personalizadas basadas en gaps de mercado.',
      features: [
        'Análisis de competidores para identificar gaps',
        '5-10 ideas generadas con scoring',
        'Validation roadmap por idea',
        'Branding automático',
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      time: '20-25 min',
    },
    {
      id: 'idea' as OnboardingType,
      icon: Target,
      title: 'Tengo una Idea',
      subtitle: 'Quiero validarla y empezar',
      description: 'Auto-rellenamos el 80% del onboarding desde tu web/LinkedIn/competidores. Solo confirma y arranca.',
      features: [
        'Auto-fill desde URLs (web + LinkedIn)',
        'Análisis competitivo automático',
        'SWOT auto-generado',
        'Validation experiments priorizados',
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
      time: '15-20 min',
    },
    {
      id: 'existing' as OnboardingType,
      icon: TrendingUp,
      title: 'Startup Funcionando',
      subtitle: 'Quiero escalar inteligentemente',
      description: 'Conecta Stripe, Analytics y LinkedIn. Extraemos métricas y generamos plan de scaling basado en 100+ data points reales.',
      features: [
        'Auto-fill desde Stripe + Analytics (90%)',
        'PMF Score (0-100) calculado',
        'Growth bottleneck analysis',
        'Hiring plan + financial projections',
      ],
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      time: '25-30 min',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
      purple: {
        border: 'border-purple-300',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-700',
      },
      blue: {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
      },
      green: {
        border: 'border-green-300',
        bg: 'bg-green-50',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-700',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">¿En Qué Etapa Estás?</h2>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Cada onboarding está ultra-personalizado para tu etapa. Incluye auto-relleno con IA
          para que hagas el <strong>mínimo esfuerzo posible</strong>.
        </p>
      </div>

      {/* Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map((type) => {
          const Icon = type.icon;
          const colors = getColorClasses(type.color);
          const isSelected = selected === type.id;

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-xl ${
                isSelected
                  ? `border-4 ${colors.border} shadow-2xl scale-105`
                  : 'border-2 hover:border-gray-300'
              }`}
              onClick={() => onSelect(type.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`h-8 w-8 ${colors.text}`} />
                  </div>
                  {isSelected && (
                    <div className="bg-green-100 rounded-full p-1">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                </div>

                <CardTitle className="text-xl mb-1">{type.title}</CardTitle>
                <CardDescription className="text-sm font-medium text-gray-600">
                  {type.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {type.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase">Incluye:</div>
                  {type.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Time Badge */}
                <div className="pt-2 flex items-center justify-between">
                  <Badge className={colors.badge}>
                    ⏱️ {type.time}
                  </Badge>
                  {isSelected && (
                    <span className="text-xs font-semibold text-green-600">
                      ✓ Seleccionado
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <div className="font-bold text-lg mb-2">Auto-Relleno Inteligente en TODOS los Onboardings</div>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• <strong>Generative:</strong> Analizamos competidores → Generamos ideas basadas en gaps</li>
              <li>• <strong>Idea:</strong> Tu web + LinkedIn + competidores → Pre-rellena 80% del onboarding</li>
              <li>• <strong>Existing:</strong> Stripe + Analytics + LinkedIn → Extrae métricas y pre-rellena 90%</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-blue-700">
              👉 Resultado: Solo confirmas datos. El resto lo hace la IA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
