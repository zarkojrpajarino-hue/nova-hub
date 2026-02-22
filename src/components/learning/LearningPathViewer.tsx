/**
 * LEARNING PATH VIEWER
 *
 * Vista detallada de un learning path con todos sus pasos
 * Permite marcar pasos como completados y trackear progreso
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, CheckCircle2, Circle, Clock, BookOpen, Target, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LearningPathStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  estimated_hours: number;
  resources: Array<{
    type: 'article' | 'video' | 'course' | 'book' | 'practice';
    title: string;
    url?: string;
    description?: string;
  }>;
  skills_gained: string[];
  is_completed: boolean;
  completed_at?: string;
}

interface LearningPathViewerProps {
  pathId: string;
  onBack: () => void;
}

export function LearningPathViewer({ pathId, onBack }: LearningPathViewerProps) {
  const queryClient = useQueryClient();

  // Fetch path details
  const { data: path, isLoading: loadingPath } = useQuery({
    queryKey: ['learning-path', pathId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch steps
  const { data: steps = [], isLoading: loadingSteps } = useQuery({
    queryKey: ['learning-path-steps', pathId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_path_steps')
        .select('*')
        .eq('path_id', pathId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Toggle step completion
  const toggleStepMutation = useMutation({
    mutationFn: async ({ stepId, isCompleted }: { stepId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('learning_path_steps')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', stepId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path-steps', pathId] });
      queryClient.invalidateQueries({ queryKey: ['learning-path', pathId] });
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const handleToggleStep = (stepId: string, isCompleted: boolean) => {
    toggleStepMutation.mutate({ stepId, isCompleted });
  };

  if (loadingPath || loadingSteps) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!path) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Learning Path no encontrado</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter(s => s.is_completed).length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const totalHours = steps.reduce((sum, step) => sum + (step.estimated_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button onClick={onBack} variant="ghost" size="icon" className="mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{path.title}</h2>
          <p className="text-muted-foreground mb-4">{path.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-primary" />
              <span className="font-medium">Objetivo:</span>
              <span>{path.target_role}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              <span>{totalHours}h estimadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary" />
              <span>{steps.length} pasos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tu Progreso</CardTitle>
              <CardDescription>
                {completedSteps} de {steps.length} pasos completados
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step: LearningPathStep, index: number) => (
          <Card
            key={step.id}
            className={`transition-all ${
              step.is_completed
                ? 'bg-green-500/5 border-green-500/20'
                : 'hover:border-primary/50'
            }`}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={step.is_completed}
                  onCheckedChange={() => handleToggleStep(step.id, step.is_completed)}
                  className="mt-1"
                />

                {/* Step Number */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    step.is_completed
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.is_completed ? <CheckCircle2 size={18} /> : step.step_number}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <CardTitle className={`text-base ${step.is_completed ? 'line-through opacity-60' : ''}`}>
                      {step.title}
                    </CardTitle>
                    <Badge variant="outline" className="flex-shrink-0">
                      {step.estimated_hours}h
                    </Badge>
                  </div>
                  <CardDescription className="mb-3">{step.description}</CardDescription>

                  {/* Skills */}
                  {step.skills_gained && step.skills_gained.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                        Habilidades que desarrollarás:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.skills_gained.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {step.resources && step.resources.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Recursos recomendados:
                        </p>
                        <div className="space-y-2">
                          {step.resources.map((resource, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm bg-background/50 p-2 rounded-lg"
                            >
                              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{resource.title}</p>
                                {resource.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {resource.description}
                                  </p>
                                )}
                              </div>
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-primary hover:underline"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Completion timestamp */}
                  {step.is_completed && step.completed_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                      ✓ Completado el{' '}
                      {new Date(step.completed_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getResourceIcon(type: string) {
  switch (type) {
    case 'article':
      return '📄';
    case 'video':
      return '🎥';
    case 'course':
      return '🎓';
    case 'book':
      return '📚';
    case 'practice':
      return '💪';
    default:
      return '📌';
  }
}
