/**
 * PHASE TIMELINE
 *
 * Timeline visual de las 3 fases de exploración de roles
 * Muestra progreso actual, tiempo restante, y próximos pasos
 */

import { Check, Clock, Lock, Rocket, Star, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PhaseTimelineProps {
  currentPhase: 1 | 2 | 3;
  phase1StartedAt?: string | null;
  phase1CompletedAt?: string | null;
  phase2StartedAt?: string | null;
  phase2CompletedAt?: string | null;
  phase3StartedAt?: string | null;
  rolesExploredPhase1?: string[];
  top2Roles?: string[];
  starRole?: string | null;
  secondaryRole?: string | null;
  totalWeeksElapsed?: number;
}

export function PhaseTimeline({
  currentPhase,
  phase1CompletedAt,
  phase2CompletedAt,
  rolesExploredPhase1 = [],
  top2Roles = [],
  starRole,
  secondaryRole,
  totalWeeksElapsed = 0,
}: PhaseTimelineProps) {
  const phases = [
    {
      number: 1,
      title: 'Exploración',
      description: 'Prueba 4 roles diferentes',
      duration: '4 semanas',
      icon: Rocket,
      color: 'bg-blue-500',
      completed: !!phase1CompletedAt,
      current: currentPhase === 1,
      details: rolesExploredPhase1.length > 0
        ? `Roles: ${rolesExploredPhase1.join(', ')}`
        : 'Explora el máximo de roles posibles',
    },
    {
      number: 2,
      title: 'Especialización',
      description: 'Profundiza en tus 2 mejores roles',
      duration: '2 semanas',
      icon: Star,
      color: 'bg-amber-500',
      completed: !!phase2CompletedAt,
      current: currentPhase === 2,
      details: top2Roles.length > 0
        ? `Roles: ${top2Roles.join(', ')}`
        : 'Perfecciona tus mejores roles',
    },
    {
      number: 3,
      title: 'Master',
      description: '1 rol estrella + sistema de desafíos',
      duration: 'Permanente',
      icon: Trophy,
      color: 'bg-purple-500',
      completed: !!starRole,
      current: currentPhase === 3,
      details: starRole
        ? `⭐ ${starRole}${secondaryRole ? ` + 🥈 ${secondaryRole}` : ''}`
        : 'Conviértete en Master de tu rol',
    },
  ];

  const progressPercent = ((currentPhase - 1) / 2) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tu Viaje de Especialización</h2>
          <p className="text-muted-foreground">
            {totalWeeksElapsed} semana{totalWeeksElapsed !== 1 ? 's' : ''} en progreso
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          Fase {currentPhase} de 3
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-sm text-muted-foreground text-right">
          {Math.round(progressPercent)}% completado
        </p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Connecting Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border -z-10" />

        {phases.map((phase) => {
          const Icon = phase.icon;
          const isLocked = currentPhase < phase.number;

          return (
            <Card
              key={phase.number}
              className={cn(
                'transition-all duration-300',
                phase.current && 'border-primary shadow-lg',
                phase.completed && 'border-success/50 bg-success/5'
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
                      phase.completed
                        ? 'bg-success text-success-foreground'
                        : phase.current
                        ? `${phase.color} text-white`
                        : 'bg-muted text-muted-foreground',
                      isLocked && 'opacity-50'
                    )}
                  >
                    {phase.completed ? (
                      <Check size={28} />
                    ) : isLocked ? (
                      <Lock size={28} />
                    ) : (
                      <Icon size={28} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">
                        Fase {phase.number}: {phase.title}
                      </h3>
                      {phase.completed && (
                        <Badge variant="outline" className="text-success border-success">
                          <Check size={12} className="mr-1" />
                          Completada
                        </Badge>
                      )}
                      {phase.current && !phase.completed && (
                        <Badge variant="default">
                          <Clock size={12} className="mr-1 animate-pulse" />
                          En Progreso
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-3">
                      {phase.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={14} />
                        <span>{phase.duration}</span>
                      </div>

                      {phase.details && (
                        <div className="text-foreground font-medium">
                          {phase.details}
                        </div>
                      )}
                    </div>

                    {/* Phase-specific info */}
                    {phase.number === 1 && phase.current && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm">
                        💡 <strong>Objetivo:</strong> Prueba el máximo número de roles posibles para descubrir dónde destacas naturalmente.
                      </div>
                    )}

                    {phase.number === 2 && phase.current && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">
                        💡 <strong>Objetivo:</strong> Sube tu fit score en tus 2 mejores roles para destacar frente a la competencia.
                      </div>
                    )}

                    {phase.number === 3 && phase.current && (
                      <div className="mt-4 p-3 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 text-sm">
                        💡 <strong>Objetivo:</strong> Conviértete en Master de tu rol estrella y defiende tu título en desafíos.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Steps */}
      {currentPhase < 3 && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">📋 Próximos pasos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {currentPhase === 1 && (
                <>
                  <li>• Completa tareas en tu rol actual</li>
                  <li>• Da feedback a tus compañeros</li>
                  <li>• Registra insights de tu experiencia</li>
                  <li>• Al finalizar la semana, rotarás al siguiente rol</li>
                </>
              )}
              {currentPhase === 2 && (
                <>
                  <li>• Profundiza en tus 2 mejores roles</li>
                  <li>• Sube tu fit score con trabajo de calidad</li>
                  <li>• Recibe más feedback de tu equipo</li>
                  <li>• Prepárate para competir por Master</li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
