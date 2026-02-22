/**
 * 🎓 LEARNING ROADMAP VIEW
 *
 * Vista del roadmap de aprendizaje para modo individual
 * Muestra roles en secuencia con progreso y desbloqueo gradual
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Lock,
  PlayCircle,
  BookOpen,
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningRoadmapStep {
  id: string;
  role_name: string;
  description: string;
  step_order: number;
  status: 'locked' | 'active' | 'completed';
  tasks_required: number;
  tasks_completed: number;
  obvs_required: number;
  obvs_completed: number;
  estimated_weeks: number;
  skills_to_learn: string[];
  unlock_criteria: string;
}

interface LearningRoadmapViewProps {
  projectId: string;
  memberId: string;
}

export function LearningRoadmapView({
  projectId,
  memberId,
}: LearningRoadmapViewProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Fetch roadmap steps
  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['learning-roadmap', projectId, memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_roadmap_steps')
        .select('*')
        .eq('project_id', projectId)
        .eq('member_id', memberId)
        .order('step_order');

      if (error) throw error;

      // Calcular status de cada paso
      return (data || []).map((step, index) => {
        const isCompleted = step.completed_at !== null;
        const isActive = !isCompleted && (index === 0 || data[index - 1]?.completed_at);
        const isLocked = !isActive && !isCompleted;

        return {
          ...step,
          status: isCompleted ? 'completed' : isActive ? 'active' : 'locked',
        } as LearningRoadmapStep;
      });
    },
    enabled: !!projectId && !!memberId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay roadmap de aprendizaje
          </h3>
          <p className="text-gray-600 mb-4">
            Genera un roadmap personalizado con IA para comenzar tu viaje de aprendizaje
          </p>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Roadmap con IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeStep = steps.find((s) => s.status === 'active');
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const overallProgress = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {completedSteps} de {steps.length} roles completados
              </span>
              <span className="text-sm font-semibold text-primary">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {activeStep && (
              <p className="text-sm text-gray-600">
                Actualmente aprendiendo: <strong>{activeStep.role_name}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isSelected = selectedStep === step.id;
          const progressPercentage =
            ((step.tasks_completed + step.obvs_completed) /
              (step.tasks_required + step.obvs_required)) *
            100;

          return (
            <Card
              key={step.id}
              className={cn(
                'transition-all cursor-pointer',
                step.status === 'active' && 'border-2 border-primary',
                step.status === 'completed' && 'bg-green-50 border-green-200',
                step.status === 'locked' && 'opacity-60',
                isSelected && 'shadow-lg'
              )}
              onClick={() => setSelectedStep(isSelected ? null : step.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div
                      className={cn(
                        'rounded-full p-3',
                        step.status === 'completed' && 'bg-green-500',
                        step.status === 'active' && 'bg-primary',
                        step.status === 'locked' && 'bg-gray-300'
                      )}
                    >
                      {step.status === 'completed' && (
                        <CheckCircle className="h-6 w-6 text-white" />
                      )}
                      {step.status === 'active' && (
                        <PlayCircle className="h-6 w-6 text-white" />
                      )}
                      {step.status === 'locked' && (
                        <Lock className="h-6 w-6 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Paso {step.step_order}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            step.status === 'completed' && 'bg-green-500',
                            step.status === 'active' && 'bg-primary',
                            step.status === 'locked' && 'bg-gray-400'
                          )}
                        >
                          {step.status === 'completed' && 'Completado'}
                          {step.status === 'active' && 'En Progreso'}
                          {step.status === 'locked' && 'Bloqueado'}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-bold mb-1">
                        {step.role_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>

                      {/* Progress for active step */}
                      {step.status === 'active' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progreso</span>
                            <span className="font-semibold">
                              {progressPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time estimate */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tiempo estimado</p>
                    <p className="text-sm font-semibold">
                      {step.estimated_weeks}{' '}
                      {step.estimated_weeks === 1 ? 'semana' : 'semanas'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Details */}
              {isSelected && (
                <CardContent className="space-y-4 border-t pt-4">
                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Requisitos para Completar
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Tareas</p>
                        <p className="text-lg font-bold">
                          {step.tasks_completed} / {step.tasks_required}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">OBVs</p>
                        <p className="text-lg font-bold">
                          {step.obvs_completed} / {step.obvs_required}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills to Learn */}
                  {step.skills_to_learn && step.skills_to_learn.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Habilidades a Desarrollar
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {step.skills_to_learn.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlock Criteria */}
                  {step.status === 'locked' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <Lock className="h-4 w-4 inline mr-1" />
                        {step.unlock_criteria || 'Completa el paso anterior para desbloquear'}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  {step.status === 'active' && (
                    <Button className="w-full">
                      Ir a Tareas del Rol
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
