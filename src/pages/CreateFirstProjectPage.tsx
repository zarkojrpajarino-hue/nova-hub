/**
 * 🎉 CREATE FIRST PROJECT PAGE
 *
 * Página de bienvenida cuando el usuario no tiene proyectos
 * Lanza el sophisticated GenerativeOnboardingWizard
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Rocket, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CreateFirstProjectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'generacion-ideas';
  const { profile } = useAuth();

  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Map URL types to onboarding types
  const typeMapping: Record<string, string> = {
    'generative': 'generative',
    'idea': 'idea',
    'existing': 'existing',
  };

  // Contenido adaptado según el tipo
  const typeContent = {
    'generative': {
      title: '💡 IA te genera 3 opciones de negocio',
      subtitle: 'Basadas en tu perfil, skills y ubicación',
      icon: Sparkles,
    },
    'idea': {
      title: '🎯 Análisis competitivo SWOT',
      subtitle: 'Validación estratégica de tu idea',
      icon: Rocket,
    },
    'existing': {
      title: '📈 Growth Diagnostic',
      subtitle: 'Detecta bottlenecks reales y plan de acción',
      icon: Building2,
    },
  };

  const handleStartOnboarding = async () => {
    if (!profile) {
      toast.error('Debes estar autenticado para crear un proyecto');
      return;
    }

    setIsCreatingProject(true);

    try {
      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('No se pudo obtener el usuario autenticado');
        setIsCreatingProject(false);
        return;
      }

      // Get member ID from members table using auth_id
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (memberError || !memberData) {
        console.error('Error getting member:', memberError);
        toast.error('No se pudo encontrar tu perfil de miembro');
        setIsCreatingProject(false);
        return;
      }

      console.log('✅ Member found:', memberData.id);

      // Create minimal project with creator, owner, and onboarding type
      const onboardingType = typeMapping[typeParam] || 'generative';

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          nombre: 'Nuevo Proyecto',
          descripcion: 'Proyecto en configuración',
          creator_id: memberData.id,
          owner_id: memberData.id,
          metadata: {
            onboarding_type: onboardingType
          }
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Minimal project created:', newProject.id);

      // Navigate to standalone onboarding experience
      navigate(`/onboarding/${newProject.id}`);

    } catch (error) {
      console.error('Error creating minimal project:', error);
      toast.error('Error al crear el proyecto');
      setIsCreatingProject(false);
    }
  };

  const content = typeContent[typeParam as keyof typeof typeContent] || typeContent['generative'];
  const IconComponent = content.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl mb-2">
            {content.title}
          </CardTitle>
          <CardDescription>
            {content.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-6">
              Vamos a guiarte a través de nuestro onboarding inteligente que te ayudará a estructurar tu proyecto con IA.
            </p>
            <Button
              onClick={handleStartOnboarding}
              size="lg"
              className="w-full max-w-md"
              disabled={isCreatingProject}
            >
              {isCreatingProject ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparando onboarding...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Comenzar Onboarding
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
