import { useState } from 'react';
import { Bot, Loader2, Sparkles, Check, X, Calendar, Flag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GeneratedTask {
  assignee: string;
  titulo: string;
  descripcion: string;
  prioridad: number;
  fecha_limite: string;
  selected?: boolean;
}

interface ProjectContext {
  id: string;
  nombre: string;
  fase: string;
  tipo: string;
  onboarding_data: Record<string, unknown> | null;
  team: Array<{ id: string; nombre: string; role: string }>;
  obvs_count: number;
  leads_count: number;
  last_activity: string | null;
}

interface AITaskGeneratorProps {
  project: ProjectContext;
  onComplete?: () => void;
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Alta', color: '#EF4444' },
  2: { label: 'Media', color: '#F59E0B' },
  3: { label: 'Baja', color: '#22C55E' },
};

export function AITaskGenerator({ project, onComplete }: AITaskGeneratorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedTasks([]);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('generate-tasks', {
        body: {
          project: {
            nombre: project.nombre,
            fase: project.fase,
            tipo: project.tipo,
            onboarding_data: project.onboarding_data,
            team: project.team.map(m => ({ nombre: m.nombre, role: m.role })),
            obvs_count: project.obvs_count,
            leads_count: project.leads_count,
            last_activity: project.last_activity,
          }
        }
      });

      if (funcError) throw funcError;

      if (data.error) {
        setError(data.error);
        return;
      }

      const tasks = (data.tasks || []).map((t: GeneratedTask) => ({
        ...t,
        selected: true,
      }));

      setGeneratedTasks(tasks);
      
      if (tasks.length === 0) {
        setError('No se pudieron generar tareas. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
      setError('Error al generar tareas. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (index: number) => {
    setGeneratedTasks(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleSave = async () => {
    const selectedTasks = generatedTasks.filter(t => t.selected);
    if (selectedTasks.length === 0) {
      toast.error('Selecciona al menos una tarea');
      return;
    }

    setIsSaving(true);

    try {
      // Map assignee names to IDs
      const tasksToInsert = selectedTasks.map(task => {
        const member = project.team.find(m => 
          m.nombre.toLowerCase().includes(task.assignee.toLowerCase()) ||
          task.assignee.toLowerCase().includes(m.nombre.toLowerCase())
        );

        return {
          project_id: project.id,
          titulo: task.titulo,
          descripcion: task.descripcion,
          prioridad: task.prioridad,
          fecha_limite: task.fecha_limite,
          assignee_id: member?.id || null,
          status: 'todo' as const,
          ai_generated: true,
        };
      });

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (insertError) throw insertError;

      toast.success(`${selectedTasks.length} tareas creadas con IA`);
      queryClient.invalidateQueries({ queryKey: ['project_tasks', project.id] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
      
      setIsOpen(false);
      setGeneratedTasks([]);
      onComplete?.();
    } catch (err) {
      console.error('Error saving tasks:', err);
      toast.error('Error al guardar las tareas');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = generatedTasks.filter(t => t.selected).length;

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => {
          setIsOpen(true);
          handleGenerate();
        }}
        className="gap-2"
      >
        <Bot className="w-4 h-4" />
        <span className="hidden sm:inline">Generar tareas con IA</span>
        <span className="sm:hidden">IA</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Generar Tareas con IA
            </DialogTitle>
            <DialogDescription>
              La IA analizará tu proyecto y generará tareas específicas para esta semana
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-purple-500" />
                  </div>
                  <Loader2 className="w-6 h-6 absolute -bottom-1 -right-1 animate-spin text-purple-500" />
                </div>
                <p className="mt-4 font-medium">Analizando proyecto...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generando tareas personalizadas para tu equipo
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <p className="mt-4 font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>
                <Button variant="outline" className="mt-4" onClick={handleGenerate}>
                  Reintentar
                </Button>
              </div>
            ) : generatedTasks.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm text-muted-foreground">
                    {generatedTasks.length} tareas generadas
                  </p>
                  <p className="text-sm font-medium">
                    {selectedCount} seleccionadas
                  </p>
                </div>

                {generatedTasks.map((task, index) => {
                  const priority = PRIORITY_CONFIG[task.prioridad] || PRIORITY_CONFIG[2];
                  const member = project.team.find(m => 
                    m.nombre.toLowerCase().includes(task.assignee.toLowerCase()) ||
                    task.assignee.toLowerCase().includes(m.nombre.toLowerCase())
                  );

                  return (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-xl p-4 transition-all cursor-pointer",
                        task.selected 
                          ? "border-primary bg-primary/5" 
                          : "border-border opacity-60"
                      )}
                      onClick={() => toggleTask(index)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.selected}
                          onCheckedChange={() => toggleTask(index)}
                          className="mt-0.5"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className="text-[10px] h-5"
                              style={{ borderColor: priority.color, color: priority.color }}
                            >
                              <Flag className="w-2.5 h-2.5 mr-1" />
                              {priority.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              <Sparkles className="w-2.5 h-2.5 mr-1" />
                              IA
                            </Badge>
                          </div>

                          <p className="font-medium text-sm mb-1">{task.titulo}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {task.descripcion}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className={cn(!member && "text-warning")}>
                                {member?.nombre || task.assignee}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.fecha_limite).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {generatedTasks.length > 0 && !isGenerating && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGenerate}
                disabled={isSaving}
              >
                <Bot className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving || selectedCount === 0}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Guardar {selectedCount} tarea{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
