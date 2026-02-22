/**
 * AI TASK ROUTER
 *
 * Rutea tareas automáticamente al miembro más adecuado del equipo
 * Conecta con edge function: ai-task-router
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Sparkles, Users, Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface TaskRoutingResult {
  task: string;
  recommended_member: {
    id: string;
    name: string;
    role: string;
    fit_score: number;
    relevant_experience: string[];
    current_workload: string;
  };
  reasoning: string;
  alternative_members: Array<{
    id: string;
    name: string;
    fit_score: number;
  }>;
}

export function AITaskRouter() {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();
  const [taskDescription, setTaskDescription] = useState('');
  const [routingResult, setRoutingResult] = useState<TaskRoutingResult | null>(null);

  // Fetch team members for context
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombre, email, color')
        .order('nombre');

      if (error) throw error;
      return data;
    },
  });

  const handleRoutingComplete = (result: any) => {
    if (result.error) {
      toast.error('Error al rutear: ' + result.error);
      return;
    }

    setRoutingResult(result.content);
    toast.success('Tarea ruteada exitosamente');
  };

  const handleRoutingError = (error: Error) => {
    console.error('Error routing task:', error);
    toast.error('Error al rutear: ' + error.message);
  };

  const handleAssign = async () => {
    if (!routingResult) return;

    try {
      // Create task assigned to recommended member
      const { error } = await supabase.from('tasks').insert({
        titulo: taskDescription.substring(0, 100),
        descripcion: taskDescription,
        assigned_to: routingResult.recommended_member.id,
        status: 'pending',
        prioridad: 'medium',
      });

      if (error) throw error;

      toast.success(`Tarea asignada a ${routingResult.recommended_member.name}`);
      setTaskDescription('');
      setRoutingResult(null);
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast.error('Error al asignar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl nova-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>AI Task Router</CardTitle>
              <CardDescription>
                Rutea automáticamente tareas al miembro más adecuado del equipo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe la tarea</CardTitle>
          <CardDescription>
            La IA analizará skills, workload actual y experiencia de cada miembro para recomendar a
            quién asignarla
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Descripción de la tarea *</Label>
            <Textarea
              id="taskDescription"
              placeholder="Ej: Diseñar el nuevo landing page para la campaña de Black Friday. Necesita conocimientos de UX/UI y experiencia con herramientas de diseño..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={5}
            />
          </div>

          <EvidenceAIGenerator
            functionName="ai-task-router"
            evidenceProfile="tasks"
            projectId={currentProject?.id || ''}
            userId={user?.id || ''}
            buttonLabel="Rutear con IA"
            buttonSize="lg"
            buttonClassName="w-full"
            additionalParams={{
              taskDescription,
            }}
            onGenerationComplete={handleRoutingComplete}
            onError={handleRoutingError}
          />
        </CardContent>
      </Card>

      {/* Routing Result */}
      {routingResult && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base">Recomendación de asignación</CardTitle>
              </div>
              <Button onClick={handleAssign} className="gap-2">
                <Target size={14} />
                Asignar tarea
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recommended Member */}
            <div className="p-4 rounded-lg border-2 border-green-500/20 bg-background">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-green-500 text-white text-lg font-bold">
                    {routingResult.recommended_member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">
                      {routingResult.recommended_member.name}
                    </h3>
                    <Badge className="bg-green-500">
                      Mejor match: {Math.round(routingResult.recommended_member.fit_score)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {routingResult.recommended_member.role}
                  </p>

                  {/* Experience */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Experiencia relevante:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {routingResult.recommended_member.relevant_experience.map((exp, idx) => (
                        <Badge key={idx} variant="outline">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Workload */}
                  <div className="mt-3 p-2 rounded bg-muted/50">
                    <p className="text-xs">
                      <strong>Carga actual:</strong> {routingResult.recommended_member.current_workload}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp size={14} />
                Por qué esta persona:
              </p>
              <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                {routingResult.reasoning}
              </p>
            </div>

            {/* Alternative Members */}
            {routingResult.alternative_members.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Users size={14} />
                  Alternativas:
                </p>
                <div className="space-y-2">
                  {routingResult.alternative_members.map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{alt.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{alt.name}</span>
                      </div>
                      <Badge variant="outline">{Math.round(alt.fit_score)}% match</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
