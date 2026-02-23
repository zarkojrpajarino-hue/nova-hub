/**
 * LEARNING PATH LIST
 *
 * Lista de learning paths generados por IA
 * Conecta con edge function: generate-learning-path
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, BookOpen, Clock, Target, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  target_role: string;
  estimated_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress_percentage: number;
  total_steps: number;
  completed_steps: number;
  created_at: string;
  status: 'active' | 'completed' | 'paused';
}

interface LearningPathListProps {
  onSelectPath: (pathId: string) => void;
  onGenerateNew: () => void;
}

export function LearningPathList({ onSelectPath, onGenerateNew }: LearningPathListProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch learning paths
  const { data: paths = [], isLoading, refetch } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_steps(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((path: Record<string, unknown> & { learning_path_steps?: Array<{ count: number }> }) => ({
        ...path,
        total_steps: path.learning_path_steps?.[0]?.count || 0,
      }));
    },
  });

  const handleQuickGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: _data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: {
          quick: true, // Generate based on current context
        },
      });

      if (error) throw error;

      toast.success('Learning Path generado exitosamente');
      refetch();
    } catch (_error) {
      toast.error('Error al generar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return difficulty;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Mis Learning Paths</h3>
          <p className="text-sm text-muted-foreground">
            Planes de aprendizaje personalizados generados por IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleQuickGenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar Rápido
              </>
            )}
          </Button>
          <Button onClick={onGenerateNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Learning Path
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {paths.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl nova-gradient flex items-center justify-center mb-4 opacity-50">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No tienes Learning Paths aún</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Genera tu primer plan de aprendizaje personalizado basado en tu rol actual
              y objetivos de carrera
            </p>
            <div className="flex gap-2">
              <Button onClick={handleQuickGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generar Automáticamente
              </Button>
              <Button onClick={onGenerateNew} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Paths Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path: LearningPath) => (
            <Card
              key={path.id}
              className="cursor-pointer hover:-translate-y-0.5 hover:border-primary/50 transition-all"
              onClick={() => onSelectPath(path.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">{path.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {path.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={getDifficultyColor(path.difficulty)}
                  >
                    {getDifficultyLabel(path.difficulty)}
                  </Badge>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target size={12} />
                    {path.target_role}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {path.estimated_weeks} semanas
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {path.total_steps} pasos
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-semibold">
                      {path.completed_steps}/{path.total_steps} completados
                    </span>
                  </div>
                  <Progress value={path.progress_percentage} className="h-2" />
                </div>

                {/* Status Badge */}
                {path.status === 'active' && path.progress_percentage > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-green-500 font-medium">En progreso</span>
                  </div>
                )}
                {path.status === 'completed' && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    ✓ Completado
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
