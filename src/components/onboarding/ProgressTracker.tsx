/**
 * PROGRESS TRACKER (CAPA 9 - PROGRESSIVE PROFILING)
 *
 * Barra de progreso gamificada con fases
 * Muestra % completion y features desbloqueadas
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingPhase } from '@/types/ultra-onboarding';

interface ProgressTrackerProps {
  currentPhase: OnboardingPhase;
  completionPercentage: number;
  onboardingType: 'generative' | 'idea' | 'existing';
}

interface Phase {
  id: OnboardingPhase;
  label: string;
  description: string;
  unlockAt: number; // percentage
}

const phases: Phase[] = [
  {
    id: 'essentials',
    label: 'Essentials',
    description: 'Información básica (5-10 min)',
    unlockAt: 0,
  },
  {
    id: 'deep_dive',
    label: 'Deep Dive',
    description: 'Análisis detallado (cuando vuelvas)',
    unlockAt: 40,
  },
  {
    id: 'continuous',
    label: 'Continuous',
    description: 'Optimización ongoing',
    unlockAt: 75,
  },
];

interface UnlockableFeature {
  name: string;
  unlockAt: number;
  icon: string;
  description: string;
}

const featuresByType: Record<string, UnlockableFeature[]> = {
  generative: [
    {
      name: 'Business Options',
      unlockAt: 30,
      icon: '💡',
      description: '3 opciones de negocio generadas',
    },
    {
      name: 'Financial Projections',
      unlockAt: 50,
      icon: '📊',
      description: 'Proyecciones detalladas',
    },
    {
      name: 'Learning Path',
      unlockAt: 70,
      icon: '📚',
      description: 'Roadmap personalizado',
    },
    {
      name: 'AI Business Advisor',
      unlockAt: 100,
      icon: '🤖',
      description: 'Chat con contexto completo',
    },
  ],
  idea: [
    {
      name: 'Competitive Analysis',
      unlockAt: 30,
      icon: '🎯',
      description: 'SWOT vs competidores',
    },
    {
      name: 'Market Gaps',
      unlockAt: 50,
      icon: '💎',
      description: 'Oportunidades detectadas',
    },
    {
      name: 'Validation Roadmap',
      unlockAt: 70,
      icon: '🧪',
      description: 'Experimentos sugeridos',
    },
    {
      name: 'AI Business Advisor',
      unlockAt: 100,
      icon: '🤖',
      description: 'Chat con contexto completo',
    },
  ],
  existing: [
    {
      name: 'Growth Diagnostic',
      unlockAt: 30,
      icon: '🏥',
      description: 'Health score + bottlenecks',
    },
    {
      name: 'Benchmarking',
      unlockAt: 50,
      icon: '📈',
      description: 'Comparación vs industria',
    },
    {
      name: 'Action Plan',
      unlockAt: 70,
      icon: '🎯',
      description: 'Roadmap priorizado',
    },
    {
      name: 'AI Business Advisor',
      unlockAt: 100,
      icon: '🤖',
      description: 'Chat con contexto completo',
    },
  ],
};

export function ProgressTracker({ currentPhase, completionPercentage, onboardingType }: ProgressTrackerProps) {
  const features = featuresByType[onboardingType] || featuresByType.generative;

  const getPhaseStatus = (phase: Phase) => {
    if (completionPercentage >= phase.unlockAt) {
      return phases.findIndex((p) => p.id === currentPhase) >= phases.findIndex((p) => p.id === phase.id)
        ? 'completed'
        : 'available';
    }
    return 'locked';
  };

  return (
    <div className="space-y-6">
      {/* Main Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">Tu Progreso</h3>
              <p className="text-sm text-gray-600">
                Fase: <span className="font-semibold capitalize">{currentPhase.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-xs text-gray-600">Completado</div>
            </div>
          </div>

          <Progress value={completionPercentage} className="h-3 mb-4" />

          {/* Motivational Message */}
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            {completionPercentage < 30 && (
              <p className="text-sm text-gray-700">
                🚀 <span className="font-semibold">Genial start!</span> Completa al 30% para desbloquear análisis
                competitivo.
              </p>
            )}
            {completionPercentage >= 30 && completionPercentage < 50 && (
              <p className="text-sm text-gray-700">
                💪 <span className="font-semibold">Vas muy bien!</span> Al 50% desbloqueas proyecciones financieras.
              </p>
            )}
            {completionPercentage >= 50 && completionPercentage < 75 && (
              <p className="text-sm text-gray-700">
                🔥 <span className="font-semibold">Casi ahí!</span> Al 75% entras en modo continuous optimization.
              </p>
            )}
            {completionPercentage >= 75 && completionPercentage < 100 && (
              <p className="text-sm text-gray-700">
                ⭐ <span className="font-semibold">Excelente!</span> Completa al 100% para desbloquear AI Business
                Advisor.
              </p>
            )}
            {completionPercentage === 100 && (
              <p className="text-sm text-gray-700">
                🎉 <span className="font-semibold">Perfecto!</span> Tienes acceso completo a todas las features.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Fases del Onboarding</h4>
          <div className="space-y-3">
            {phases.map((phase, idx) => {
              const status = getPhaseStatus(phase);
              const isActive = currentPhase === phase.id;

              return (
                <div
                  key={phase.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : status === 'available'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      isActive
                        ? 'bg-blue-500 text-white'
                        : status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'available'
                        ? 'bg-gray-300 text-gray-700'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : status === 'locked' ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold">{phase.label}</h5>
                      {isActive && <Badge className="bg-blue-600 text-xs">Actual</Badge>}
                      {status === 'completed' && <Badge className="bg-green-600 text-xs">✓ Completada</Badge>}
                      {status === 'locked' && (
                        <Badge variant="secondary" className="text-xs">
                          Desbloquea al {phase.unlockAt}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unlockable Features */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold">Features Desbloqueables</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {features.map((feature) => {
              const isUnlocked = completionPercentage >= feature.unlockAt;

              return (
                <div
                  key={feature.name}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    isUnlocked
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                        isUnlocked ? 'bg-white' : 'bg-gray-100 grayscale'
                      )}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm">{feature.name}</h5>
                        {isUnlocked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                      {!isUnlocked && (
                        <p className="text-xs text-purple-600 mt-1 font-medium">
                          Desbloquea al {feature.unlockAt}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Milestone */}
      {completionPercentage < 100 && (
        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Próximo Milestone</h4>
              {(() => {
                const nextFeature = features.find((f) => f.unlockAt > completionPercentage);
                if (nextFeature) {
                  const remaining = nextFeature.unlockAt - completionPercentage;
                  return (
                    <p className="text-sm text-purple-800">
                      Completa <span className="font-semibold">{remaining}%</span> más para desbloquear{' '}
                      <span className="font-semibold">{nextFeature.name}</span> {nextFeature.icon}
                    </p>
                  );
                }
                return (
                  <p className="text-sm text-purple-800">
                    ¡Estás en la recta final! Completa el onboarding para acceso total.
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
