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
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, profile } = useAuth();
  const { currentProject, userProjects, isLoading: projectsLoading } = useCurrentProject();

  useEffect(() => {
    // CRÍTICO: Esperar a que TODO esté cargado (auth, profile, y proyectos)
    if (authLoading || projectsLoading || (isAuthenticated && !profile)) {
      return;
    }

    // Si no está autenticado, ir a login
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    // Si no tiene proyectos, ir a seleccionar tipo de onboarding
    if (!userProjects || userProjects.length === 0) {
      navigate('/select-onboarding-type', { replace: true });
      return;
    }

    // Si tiene proyectos pero no hay uno seleccionado, ir a seleccionar
    if (!currentProject) {
      navigate('/select-project', { replace: true });
      return;
    }

    // Si tiene proyecto seleccionado, ir al dashboard de ese proyecto
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
