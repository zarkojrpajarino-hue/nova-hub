/**
 * ONBOARDING STEP GUIDE
 *
 * Guía visual lateral que muestra todos los pasos del onboarding
 * con checkmarks verdes según el usuario completa cada paso
 */

import { Check, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingType = 'sin_idea' | 'tengo_idea' | 'startup_funcionando';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface OnboardingStepGuideProps {
  type: OnboardingType;
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

// Definir steps para cada tipo de onboarding
const STEPS_BY_TYPE: Record<OnboardingType, Step[]> = {
  sin_idea: [
    {
      id: 'sin-idea-situation',
      label: 'Tu situación actual',
      description: '¿Qué haces ahora?',
    },
    {
      id: 'sin-idea-frustrations',
      label: 'Tus frustraciones',
      description: '3-5 pain points',
    },
    {
      id: 'sin-idea-time',
      label: 'Tiempo disponible',
      description: 'Full-time o part-time',
    },
    {
      id: 'sin-idea-capital',
      label: 'Capital inicial',
      description: '¿Cuánto puedes invertir?',
    },
    {
      id: 'sin-idea-type',
      label: 'Tipo de negocio',
      description: 'Producto, servicio, app...',
    },
    {
      id: 'ideas-list',
      label: 'Seleccionar idea',
      description: 'IA genera 5-10 ideas',
    },
    {
      id: 'generating-business',
      label: 'Generación IA',
      description: 'Creando negocio completo',
    },
    {
      id: 'preview-ready',
      label: 'Revisar y aprobar',
      description: 'Branding, productos, web',
    },
  ],
  tengo_idea: [
    {
      id: 'tengo-idea-sentence',
      label: 'Tu idea en 1 frase',
      description: 'Describe tu proyecto',
    },
    {
      id: 'tengo-idea-target',
      label: 'Cliente objetivo',
      description: 'Buyer persona',
    },
    {
      id: 'tengo-idea-monetization',
      label: 'Monetización',
      description: 'Modelo de negocio',
    },
    {
      id: 'tengo-idea-built',
      label: 'Lo que has construido',
      description: 'Web, prototipo, social',
    },
    {
      id: 'tengo-idea-competitors',
      label: 'Competencia',
      description: 'Análisis de mercado',
    },
    {
      id: 'tengo-idea-resources',
      label: 'Tus recursos',
      description: 'Budget, tiempo, skills',
    },
    {
      id: 'generating-business',
      label: 'Generación IA',
      description: 'Creando negocio completo',
    },
    {
      id: 'preview-ready',
      label: 'Revisar y aprobar',
      description: 'Branding, productos, web',
    },
  ],
  startup_funcionando: [
    {
      id: 'startup-web',
      label: 'Web de tu startup',
      description: 'URL para análisis IA',
    },
    {
      id: 'startup-social',
      label: 'Redes sociales',
      description: 'Perfiles sociales',
    },
    {
      id: 'startup-tools',
      label: 'Herramientas que usas',
      description: 'Stack tecnológico',
    },
    {
      id: 'startup-metrics',
      label: 'Métricas clave',
      description: 'MRR, CAC, Churn...',
    },
    {
      id: 'startup-challenge',
      label: 'Desafío principal',
      description: '¿Qué quieres mejorar?',
    },
    {
      id: 'generating-business',
      label: 'Análisis IA',
      description: 'Audit completo',
    },
    {
      id: 'preview-ready',
      label: 'Plan de crecimiento',
      description: 'Estrategia personalizada',
    },
  ],
};

export function OnboardingStepGuide({
  type,
  currentStep,
  completedSteps,
  className,
}: OnboardingStepGuideProps) {
  const steps = STEPS_BY_TYPE[type];

  const getCurrentStepIndex = () => {
    return steps.findIndex((s) => s.id === currentStep);
  };

  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  const isStepCurrent = (stepId: string) => {
    return currentStep === stepId;
  };

  const isStepUpcoming = (stepId: string) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    return stepIndex > currentIndex;
  };

  return (
    <div className={cn('w-80 bg-muted/30 border-r border-border p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Tu progreso</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {completedSteps.length} de {steps.length} pasos completados
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
            style={{
              width: `${(completedSteps.length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);
          const upcoming = isStepUpcoming(step.id);

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all',
                current && 'bg-primary/10 border-l-4 border-primary',
                completed && !current && 'opacity-70 hover:opacity-100',
                upcoming && 'opacity-40'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {completed ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                ) : current ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Circle className="h-3 w-3 text-white fill-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    current && 'text-primary',
                    completed && !current && 'text-foreground',
                    upcoming && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Tip:</strong> Cuanto más detallado seas, mejores resultados generará la IA
        </p>
      </div>
    </div>
  );
}
