/**
 * ONBOARDING STEP GUIDE
 *
 * Guía visual lateral que muestra todos los pasos del onboarding
 * con checkmarks verdes según el usuario completa cada paso
 */

import { Check, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
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
      label: t('generative.tuSituaciónActual'),
      description: t('generative.quéHacesAhora'),
    },
    {
      id: 'sin-idea-frustrations',
      label: t('generative.tusFrustraciones'),
      description: '3-5 pain points',
    },
    {
      id: 'sin-idea-time',
      label: t('generative.tiempoDisponible'),
      description: t('generative.fulltimeOParttime'),
    },
    {
      id: 'sin-idea-capital',
      label: t('generative.capitalInicial'),
      description: t('generative.cuántoPuedesInvertir'),
    },
    {
      id: 'sin-idea-type',
      label: t('generative.tipoDeNegocio'),
      description: t('generative.productoServicioApp'),
    },
    {
      id: 'ideas-list',
      label: t('generative.seleccionarIdea'),
      description: t('generative.iaGenera510Ideas'),
    },
    {
      id: 'generating-business',
      label: 'Generación IA',
      description: t('generative.creandoNegocioCompleto'),
    },
    {
      id: 'preview-ready',
      label: t('generative.revisarYAprobar'),
      description: t('generative.brandingProductosWeb'),
    },
  ],
  tengo_idea: [
    {
      id: 'tengo-idea-sentence',
      label: t('generative.tuIdeaEn1'),
      description: t('generative.describeTuProyecto'),
    },
    {
      id: 'tengo-idea-target',
      label: t('generative.clienteObjetivo'),
      description: t('generative.buyerPersona'),
    },
    {
      id: 'tengo-idea-monetization',
      label: t('generative.monetización'),
      description: t('generative.modeloDeNegocio'),
    },
    {
      id: 'tengo-idea-built',
      label: t('generative.loQueHasConstruido'),
      description: t('generative.webPrototipoSocial'),
    },
    {
      id: 'tengo-idea-competitors',
      label: t('generative.competencia'),
      description: t('generative.análisisDeMercado'),
    },
    {
      id: 'tengo-idea-resources',
      label: t('generative.tusRecursos'),
      description: t('generative.budgetTiempoSkills'),
    },
    {
      id: 'generating-business',
      label: 'Generación IA',
      description: t('generative.creandoNegocioCompleto'),
    },
    {
      id: 'preview-ready',
      label: t('generative.revisarYAprobar'),
      description: t('generative.brandingProductosWeb'),
    },
  ],
  startup_funcionando: [
    {
      id: 'startup-web',
      label: t('generative.webDeTuStartup'),
      description: 'URL para análisis IA',
    },
    {
      id: 'startup-social',
      label: t('generative.redesSociales'),
      description: t('generative.perfilesSociales'),
    },
    {
      id: 'startup-tools',
      label: t('generative.herramientasQueUsas'),
      description: t('generative.stackTecnológico'),
    },
    {
      id: 'startup-metrics',
      label: t('generative.métricasClave'),
      description: t('generative.mrrCacChurn'),
    },
    {
      id: 'startup-challenge',
      label: t('generative.desafíoPrincipal'),
      description: t('generative.quéQuieresMejorar'),
    },
    {
      id: 'generating-business',
      label: 'Análisis IA',
      description: t('generative.auditCompleto'),
    },
    {
      id: 'preview-ready',
      label: t('generative.planDeCrecimiento'),
      description: t('generative.estrategiaPersonalizada'),
    },
  ],
};

export function OnboardingStepGuide({
  type,
  currentStep,
  completedSteps,
  className,
}: OnboardingStepGuideProps) {
  const { t } = useTranslation();
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
          <h3 className="font-bold text-lg">{t('generative.tuProgreso')}</h3>
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
