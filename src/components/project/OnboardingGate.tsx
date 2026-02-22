import { useState } from 'react';
import { Rocket, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import type { Project } from '@/hooks/useNovaData';

interface OnboardingGateProps {
  project: Project;
}

export function OnboardingGate({ project }: OnboardingGateProps) {
  const queryClient = useQueryClient();
  const [isGeneratingRoles, setIsGeneratingRoles] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const handleOnboardingComplete = async () => {
    // After onboarding wizard completes, generate roles with AI
    setIsGeneratingRoles(true);
    
    try {
      const { error } = await supabase.functions.invoke('generate-project-roles', {
        body: { 
          project_id: project.id,
          onboarding_data: project.onboarding_data,
        },
      });

      if (error) throw error;

      toast.success('¡Roles asignados! Esperando aceptación del equipo.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
    } catch (error) {
      console.error('Error generating roles:', error);
      toast.error('Error al generar roles');
    } finally {
      setIsGeneratingRoles(false);
    }
  };

  if (isGeneratingRoles) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-pulse"
                style={{ background: `${project.color}25` }}
              >
                {project.icon}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Sparkles size={20} className="text-white animate-spin" />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <h3 className="text-xl font-bold">Asignando roles con IA...</h3>
              <p className="text-muted-foreground">
                Analizando experiencia del equipo para asignar roles óptimos
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
              <Loader2 size={16} className="animate-spin" />
              <span>Optimizando para máxima exploración de roles</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="p-6">
        <OnboardingWizard 
          project={{
            id: project.id,
            nombre: project.nombre,
            tipo: project.tipo || 'validacion',
            color: project.color || '#6366F1',
            icon: project.icon || '📁',
            onboarding_data: project.onboarding_data as never,
          }}
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full overflow-hidden">
        <CardHeader 
          className="text-center border-b"
          style={{ background: `linear-gradient(135deg, ${project.color}15 0%, transparent 100%)` }}
        >
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: `${project.color}25` }}
            >
              {project.icon}
            </div>
            <div>
              <CardTitle className="text-2xl">{project.nombre}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {project.tipo === 'validacion' ? 'Proyecto de Validación' : 'Proyecto en Operación'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Rocket size={32} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold">Onboarding Requerido</h3>
            <p className="text-muted-foreground">
              Antes de empezar, necesitamos conocer los detalles del proyecto 
              para asignar los roles óptimos al equipo.
            </p>
          </div>


          <div className="space-y-2 text-sm">
            <h4 className="font-medium">¿Qué sucederá?</h4>
            <ol className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>Seleccionas los miembros del equipo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>Completas los datos del proyecto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">3</span>
                <span>La IA asigna roles óptimos según experiencia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">4</span>
                <span>¡El proyecto se desbloquea automáticamente!</span>
              </li>
            </ol>
          </div>

          <Button 
            className="w-full h-12 text-lg"
            onClick={() => setShowWizard(true)}
            style={{ background: project.color }}
          >
            <Rocket size={20} className="mr-2" />
            Comenzar Onboarding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
