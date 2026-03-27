/**
 * 🏠 ROOT REDIRECT
 *
 * Componente que maneja la lógica de redirección inicial
 * - Si no autenticado → /auth
 * - Si no tiene proyectos → /create-first-project
 * - Si no tiene proyecto seleccionado → /select-project
 * - Si tiene proyecto seleccionado → /proyecto/:projectId
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { OptimusLogo } from '@/components/brand/OptimusLogo';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useTranslation } from 'react-i18next';
export function RootRedirect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, profileLoading } = useAuth();
  const { currentProject, userProjects, isLoading: projectsLoading } = useCurrentProject();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout: if loading doesn't complete in 30s, force redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      // Force redirect even if still loading — don't leave user stuck
      if (isAuthenticated && userProjects && userProjects.length > 0) {
        const projectId = currentProject?.id || userProjects[0]?.id;
        if (projectId) navigate(`/proyecto/${projectId}`, { replace: true });
      } else if (isAuthenticated) {
        navigate('/select-onboarding-type', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 30_000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, currentProject, userProjects, navigate]);

  useEffect(() => {
    // DEBUG: track state in document.title (Vite doesn't strip this)
    document.title = `[auth:${!authLoading} prof:${!profileLoading} projL:${projectsLoading} projs:${userProjects?.length ?? '?'} saved:${!!localStorage.getItem('nova-hub:current-project-id')}]`;

    // Wait for auth to settle first
    if (authLoading || profileLoading) {
      return;
    }

    // Not authenticated → landing
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Fast path: if we have a saved project ID in localStorage, go directly
    const savedProjectId = localStorage.getItem('nova-hub:current-project-id');
    if (savedProjectId) {
      navigate(`/proyecto/${savedProjectId}`, { replace: true });
      return;
    }

    // No saved project — wait for the projects query
    if (projectsLoading) {
      return;
    }

    // Loading completed — cancel timeout state
    setTimedOut(false);

    // No projects → onboarding
    if (!userProjects || userProjects.length === 0) {
      navigate('/select-onboarding-type', { replace: true });
      return;
    }

    // Has projects but none selected → select page
    if (!currentProject) {
      navigate('/select-project', { replace: true });
      return;
    }

    // Has selected project → dashboard
    navigate(`/proyecto/${currentProject.id}`, { replace: true });
  }, [isAuthenticated, authLoading, projectsLoading, profileLoading, currentProject, userProjects, navigate]);

  // Timeout error state
  if (timedOut && (authLoading || projectsLoading || profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('rootRedirect.timeoutTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('rootRedirect.timeoutDescription')}</p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('rootRedirect.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <OptimusLogo size={48} className="animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">{t('rootRedirect.cargando')}</p>
      </div>
    </div>
  );
}
