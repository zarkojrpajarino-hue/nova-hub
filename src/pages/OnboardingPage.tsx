/**
 * 🎯 ONBOARDING PAGE - Standalone Experience
 *
 * Experiencia de onboarding profesional separada del dashboard
 * Pantalla completa sin sidebar, con stepper horizontal
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FastStartWizard } from '@/components/onboarding/FastStartWizard';

export function OnboardingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [_projectName, setProjectName] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      const { data: project } = await supabase
        .from('projects')
        .select('nombre')
        .eq('id', projectId)
        .single();

      if (project) {
        setProjectName(project.nombre);
      }
      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  const handleComplete = () => {
    // Al completar, redirigir al dashboard del proyecto
    navigate(`/proyecto/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Cargando onboarding...</p>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <p className="text-red-600">Error: No se pudo cargar el proyecto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header con logo y título */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 py-6 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg">
                O
              </div>
              {/* Título */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bienvenido a <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">OPTIMUS-K</span>
                </h1>
                <p className="text-sm text-gray-600">
                  Completa este formulario y en minutos tendrás tu proyecto configurado
                </p>
              </div>
            </div>

            {/* Botón de Volver */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/select-onboarding-type')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar tipo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/select-onboarding-type')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del onboarding */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <FastStartWizard
          projectId={projectId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
