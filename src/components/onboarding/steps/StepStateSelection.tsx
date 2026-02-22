/**
 * STEP: Project State Selection
 *
 * First question in adaptive onboarding: "¿En qué estado está tu proyecto?"
 *
 * Routes to different onboarding flows based on business maturity:
 * - Idea/Exploración: No customers, no revenue
 * - Validación Temprana: 1-10 customers, €0-1k/month
 * - Proyecto con Tracción: 10-100 customers, €1-10k/month
 * - Negocio Consolidado: 100+ customers, €10k+/month
 */

import { Lightbulb, Sprout, TrendingUp, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ProjectState = 'idea' | 'validacion_temprana' | 'traccion' | 'consolidado';

interface StepStateSelectionProps {
  selectedState: ProjectState | null;
  onChange: (state: ProjectState) => void;
}

interface StateOption {
  value: ProjectState;
  icon: typeof Lightbulb;
  title: string;
  description: string;
  examples: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
}

const STATE_OPTIONS: StateOption[] = [
  {
    value: 'idea',
    icon: Lightbulb,
    title: 'Idea / Exploración',
    description: 'Estoy explorando una idea de negocio',
    examples: [
      'No tengo clientes todavía',
      'Estoy validando el problema',
      'Tengo hipótesis por confirmar',
    ],
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30 hover:border-amber-500',
    bgColor: 'bg-amber-500/5 hover:bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
  {
    value: 'validacion_temprana',
    icon: Sprout,
    title: 'Validación Temprana',
    description: 'Tengo primeros clientes y estoy validando',
    examples: [
      '1-10 clientes activos',
      '€0-1,000/mes de ingresos',
      'Validando product-market fit',
    ],
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500/30 hover:border-green-500',
    bgColor: 'bg-green-500/5 hover:bg-green-500/10',
    iconColor: 'text-green-600',
  },
  {
    value: 'traccion',
    icon: TrendingUp,
    title: 'Proyecto con Tracción',
    description: 'Negocio en crecimiento con tracción demostrada',
    examples: [
      '10-100 clientes activos',
      '€1,000-10,000/mes de ingresos',
      'Crecimiento mes a mes',
    ],
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-500',
    bgColor: 'bg-blue-500/5 hover:bg-blue-500/10',
    iconColor: 'text-blue-600',
  },
  {
    value: 'consolidado',
    icon: Building2,
    title: 'Negocio Consolidado',
    description: 'Empresa establecida con operación estable',
    examples: [
      '100+ clientes activos',
      '€10,000+/mes de ingresos',
      'Equipo y procesos establecidos',
    ],
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30 hover:border-purple-500',
    bgColor: 'bg-purple-500/5 hover:bg-purple-500/10',
    iconColor: 'text-purple-600',
  },
];

export function StepStateSelection({ selectedState, onChange }: StepStateSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">¿En qué estado está tu proyecto?</h2>
        <p className="text-muted-foreground">
          Esto nos ayudará a personalizar las preguntas y recomendaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedState === option.value;

          return (
            <Card
              key={option.value}
              className={cn(
                'p-6 cursor-pointer transition-all duration-200 border-2',
                option.borderColor,
                option.bgColor,
                isSelected && 'ring-4 ring-offset-2 ring-primary/20 scale-[1.02]'
              )}
              onClick={() => onChange(option.value)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                      `bg-gradient-to-br ${option.color}`
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Examples */}
                <div className="space-y-2 pl-[72px]">
                  {option.examples.map((example, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={cn('w-1.5 h-1.5 rounded-full', option.iconColor)} />
                      <span className="text-muted-foreground">{example}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              ¿Por qué preguntamos esto?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Cada estado requiere un enfoque diferente. Si tu proyecto está consolidado, no
              necesitas validar hipótesis básicas. Si es una idea, necesitas explorar el problema
              antes de pensar en facturación. Adaptamos las preguntas a tu realidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
