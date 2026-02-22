/**
 * 🎓 LEARNING ROADMAP PAGE
 *
 * Página principal del roadmap de aprendizaje
 * Solo visible para proyectos en modo individual
 */

import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { useGenerateLearningRoadmap } from '@/hooks/useGenerateLearningRoadmap';
import { LearningRoadmapView } from '@/components/learning/LearningRoadmapView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';

export function LearningRoadmapPage() {
  const navigate = useNavigate();
  const { currentProject } = useCurrentProject();
  const { profile } = useAuth();
  const generateRoadmap = useGenerateLearningRoadmap();
  const [hasRoadmap, setHasRoadmap] = useState(false);

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Selecciona un Proyecto
            </h2>
            <p className="text-gray-600 mb-6">
              Para ver tu roadmap de aprendizaje, primero selecciona un proyecto
            </p>
            <Button onClick={() => navigate('/select-project')}>
              Ver Proyectos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentProject.work_mode !== 'individual') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Roadmap No Disponible
            </h2>
            <p className="text-gray-600 mb-6">
              El roadmap de aprendizaje solo está disponible para proyectos en modo individual.
              Este proyecto está configurado en modo: <strong>{currentProject.work_mode}</strong>
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerateRoadmap = async () => {
    if (!currentProject || !user) return;

    try {
      toast.info('Generando roadmap personalizado con IA... ✨');

      await generateRoadmap.mutateAsync({
        project_id: currentProject.id,
        member_id: profile?.id || '',
        project_name: currentProject.nombre,
        industry: currentProject.industry || 'General',
        business_idea: currentProject.descripcion || currentProject.nombre,
      });

      setHasRoadmap(true);
      toast.success('¡Roadmap generado exitosamente!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar roadmap');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Mi Roadmap de Aprendizaje
            </h1>
            <p className="text-gray-600">
              Aprende todos los roles de tu proyecto de forma secuencial
            </p>
          </div>

          <Button
            onClick={handleGenerateRoadmap}
            disabled={generateRoadmap.isPending}
            variant="outline"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateRoadmap.isPending ? 'Generando...' : 'Regenerar Roadmap'}
          </Button>
        </div>
      </div>

      {/* Roadmap View */}
      {profile && (
        <LearningRoadmapView
          projectId={currentProject.id}
          memberId={profile.id}
        />
      )}
    </div>
  );
}
