/**
 * ONBOARDING TYPE SELECTOR
 *
 * Selector para elegir el tipo de onboarding según la situación del usuario:
 * 1. Sin idea - Persona que no tiene una idea pero quiere emprender
 * 2. Tengo idea - Tiene una idea de negocio
 * 3. Startup funcionando - Startup que ya está operando
 * 4. Empresa establecida - Empresa consolidada
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Rocket, Building, ArrowRight } from 'lucide-react';

export type OnboardingType = 'sin_idea' | 'tengo_idea' | 'startup_funcionando';

interface OnboardingTypeSelectorProps {
  onSelectType: (type: OnboardingType) => void;
}

const ONBOARDING_TYPES = [
  {
    id: 'sin_idea' as OnboardingType,
    icon: Lightbulb,
    title: 'No tengo idea',
    description: 'Quiero emprender pero aún no sé qué negocio montar',
    subtitle: 'Ideal para: Aspirantes a emprendedores',
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    features: [
      'IA genera 5-10 ideas desde tus frustraciones',
      'Análisis de mercado y competencia',
      'Negocio completo en 10 minutos',
    ],
  },
  {
    id: 'tengo_idea' as OnboardingType,
    icon: Rocket,
    title: 'Tengo una idea',
    description: 'Ya sé qué negocio quiero pero necesito estructurarlo y validarlo',
    subtitle: 'Ideal para: Emprendedores con visión',
    color: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    features: [
      'Valida tu idea con análisis competitivo',
      'Branding + Productos + Pricing automáticos',
      '3 experimentos de validación específicos',
    ],
  },
  {
    id: 'startup_funcionando' as OnboardingType,
    icon: Building,
    title: 'Startup funcionando',
    description: 'Tengo una startup operando y quiero estructurarla mejor o escalarla',
    subtitle: 'Ideal para: Startups early-stage',
    color: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    features: [
      'Importa tu negocio actual (web, redes, métricas)',
      'Audit automático con IA',
      'Plan de growth personalizado',
    ],
  },
];

export function OnboardingTypeSelector({ onSelectType }: OnboardingTypeSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¿En qué etapa estás?</h2>
        <p className="text-muted-foreground">
          Selecciona la opción que mejor describa tu situación actual
        </p>
      </div>

      {/* Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ONBOARDING_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.id}
              className="group cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
              onClick={() => onSelectType(type.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-14 h-14 rounded-xl ${type.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-7 h-7 ${type.iconColor}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl mb-1">{type.title}</CardTitle>
                <CardDescription className="text-sm">{type.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{type.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Qué incluye:
                  </p>
                  <ul className="space-y-1.5">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Hint */}
                <div className="pt-3">
                  <Button
                    variant="ghost"
                    className="w-full group-hover:bg-primary/5 transition-colors"
                  >
                    Comenzar onboarding
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            <strong>💡 Tip:</strong> No te preocupes si cambias de etapa. Podrás actualizar el
            tipo de onboarding en cualquier momento desde la configuración del proyecto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
