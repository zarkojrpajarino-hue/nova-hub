/**
 * 🏠 ROOT REDIRECT
 *
 * Componente que maneja la lógica de redirección inicial
 * - Si no autenticado → /auth
 * - Si no tiene proyectos → /create-first-project
 * - Si no tiene proyecto seleccionado → /select-project
 * - Si tiene proyecto seleccionado → /proyecto/:projectId
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Loader2 } from 'lucide-react';

export function RootRedirect() {
  console.log('🚀 RootRedirect component mounted!');

  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, profile } = useAuth();
  const { currentProject, userProjects, isLoading: projectsLoading } = useCurrentProject();

  console.log('📊 RootRedirect state:', {
    authLoading,
    projectsLoading,
    isAuthenticated,
    hasProfile: !!profile,
    profileId: profile?.id,
    projectsCount: userProjects?.length || 0,
    currentProjectId: currentProject?.id
  });

  useEffect(() => {
    console.log('🔄 RootRedirect: useEffect triggered', {
      authLoading,
      projectsLoading,
      isAuthenticated,
      hasProfile: !!profile,
      projectsCount: userProjects?.length || 0,
      currentProjectId: currentProject?.id
    });

    // CRÍTICO: Esperar a que TODO esté cargado (auth, profile, y proyectos)
    if (authLoading || projectsLoading || (isAuthenticated && !profile)) {
      console.log('⏳ RootRedirect: Still loading...', {
        authLoading,
        projectsLoading,
        waitingForProfile: isAuthenticated && !profile
      });
      return;
    }

    console.log('✅ RootRedirect: Everything loaded!', {
      isAuthenticated,
      projectsCount: userProjects.length,
      projects: userProjects.slice(0, 3).map(p => ({ id: p.id, nombre: p.nombre })),
      currentProject: currentProject?.id
    });

    // Si no está autenticado, ir a login
    if (!isAuthenticated) {
      console.log('➡️ Redirecting to /auth (not authenticated)');
      navigate('/auth', { replace: true });
      return;
    }

    // Si no tiene proyectos, ir a seleccionar tipo de onboarding
    if (!userProjects || userProjects.length === 0) {
      console.log('➡️ Redirecting to /select-onboarding-type (no projects)');
      navigate('/select-onboarding-type', { replace: true });
      return;
    }

    // Si tiene proyectos pero no hay uno seleccionado, ir a seleccionar
    if (!currentProject) {
      console.log('➡️ Redirecting to /select-project (no current project)', {
        availableProjects: userProjects.length
      });
      navigate('/select-project', { replace: true });
      return;
    }

    // Si tiene proyecto seleccionado, ir al dashboard de ese proyecto
    console.log(`➡️ Redirecting to /proyecto/${currentProject.id} (all good!)`);
    navigate(`/proyecto/${currentProject.id}`, { replace: true });
  }, [isAuthenticated, authLoading, projectsLoading, profile, currentProject, userProjects, navigate]);

  // Loading state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 nova-gradient rounded-xl flex items-center justify-center font-bold text-xl text-primary-foreground animate-pulse mx-auto mb-4">
          N
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
      </div>
    </div>
  );
}
