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
import { trackProjectCreated } from '@/lib/analytics';

import { useTranslation } from 'react-i18next';
export function CreateFirstProjectPage() {
  const { t } = useTranslation();
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
      title: t('createFirstProject.basadasEnTuPerfil'),
      subtitle: t('createFirstProject.basadasEnTuPerfil'),
      icon: Sparkles,
    },
    'idea': {
      title: t('createFirstProject.validaciónEstratégicaDeTu'),
      subtitle: t('createFirstProject.validaciónEstratégicaDeTu'),
      icon: Rocket,
    },
    'existing': {
      title: t('createFirstProject.detectaBottlenecksRealesY'),
      subtitle: t('createFirstProject.detectaBottlenecksRealesY'),
      icon: Building2,
    },
  };

  const handleStartOnboarding = async () => {
    if (!profile) {
      toast.error(t('createFirstProject.debesEstarAutenticadoPara'));
      return;
    }

    setIsCreatingProject(true);

    try {
      // Create minimal project with creator and onboarding type
      const onboardingType = typeMapping[typeParam] || 'generative';

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          nombre: t('createFirstProject.nuevoProyecto'),
          descripcion: t('createFirstProject.proyectoEnConfiguración'),
          created_by: profile.id,
          onboarding_data: {
            onboarding_type: onboardingType
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add creator as project member
      await supabase
        .from('project_members')
        .insert({ project_id: newProject.id, member_id: profile.id, is_lead: true });

      trackProjectCreated({ project_id: newProject.id });

      // Navigate to standalone onboarding experience
      navigate(`/onboarding/${newProject.id}`);

    } catch (_error) {
      toast.error(t('createFirstProject.errorAlCrearEl'));
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
            <p className="text-muted-foreground mb-6">{t('createFirstProject.vamosAGuiarteA')}</p>
            <Button
              onClick={handleStartOnboarding}
              size="lg"
              className="w-full max-w-md"
              disabled={isCreatingProject}
            >
              {isCreatingProject ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('createFirstProject.preparandoOnboarding')}</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />{t('createFirstProject.comenzarOnboarding')}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
