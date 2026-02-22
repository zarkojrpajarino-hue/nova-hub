/**
 * ULTRA-PERSONALIZED ONBOARDING VIEW
 *
 * Vista wrapper para el EnhancedOnboardingWizard
 * Auto-inicia el wizard para el flujo de primer proyecto
 */

import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedOnboardingWizard } from '@/components/onboarding/EnhancedOnboardingWizard';
import { Loader2 } from 'lucide-react';

export function UltraOnboardingView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleComplete = () => {
    // Al completar, redirigir al dashboard del proyecto
    navigate(`/proyecto/${projectId}`);
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Cargando onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedOnboardingWizard
          projectId={projectId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
