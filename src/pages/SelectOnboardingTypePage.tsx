/**
 * 🎯 SELECT ONBOARDING TYPE PAGE
 *
 * Pantalla inicial cuando el usuario no tiene proyectos
 * Le permite elegir entre 3 tipos de onboarding según su situación
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Rocket, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function SelectOnboardingTypePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { userProjects, isLoading: projectsLoading } = useCurrentProject();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // CRITICAL: Redirect to /select-project if user already has projects
  useEffect(() => {
    console.log('🔍 SelectOnboardingType: Checking if should be here...', {
      projectsLoading,
      hasProfile: !!profile,
      projectsCount: userProjects.length
    });

    // Wait for everything to load
    if (projectsLoading || !profile) {
      console.log('⏳ SelectOnboardingType: Still loading...');
      return;
    }

    // If user has projects, they shouldn't be here - redirect to select-project
    if (userProjects.length > 0) {
      console.log('➡️ SelectOnboardingType: User has projects, redirecting to /select-project');
      navigate('/select-project', { replace: true });
    } else {
      console.log('✅ SelectOnboardingType: User has no projects, staying here');
    }
  }, [profile, userProjects, projectsLoading, navigate]);

  const onboardingTypes = [
    {
      id: 'generative',
      icon: Lightbulb,
      title: '¿Quieres emprender pero no tienes idea?',
      subtitle: 'IA te genera 3 opciones de negocio personalizadas según tu perfil, skills y ubicación',
      features: [
        'Geo-intelligence (competidores, inversores locales)',
        '3 business options con fit score',
        'Proyecciones financieras realistas',
        'Learning path personalizado'
      ],
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'idea',
      icon: Rocket,
      title: 'Tengo una idea y quiero emprenderla',
      subtitle: 'Análisis SWOT competitivo con market gaps y estrategia de diferenciación',
      features: [
        'SWOT matrix vs competidores',
        'Market gaps con opportunity scores',
        'Estrategia de Go-to-Market',
        'Roadmap de validación con experimentos'
      ],
      color: 'from-blue-600 to-purple-600',
    },
    {
      id: 'existing',
      icon: Building2,
      title: 'Tengo una startup existente',
      subtitle: 'Growth diagnostic con truth-o-meter: detecta bottlenecks reales y plan de acción',
      features: [
        'Health score + diagnóstico honesto',
        'Benchmarking vs industria',
        '3 escenarios (status quo, fix, growth)',
        'Action plan priorizado + quick wins'
      ],
      color: 'from-purple-600 to-pink-600',
    },
  ];

  const handleSelectType = async (typeId: string) => {
    if (!profile) {
      toast.error('Debes estar autenticado para crear un proyecto');
      return;
    }

    setIsCreating(true);
    setSelectedType(typeId);

    try {
      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('No se pudo obtener el usuario autenticado');
        setIsCreating(false);
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
        setIsCreating(false);
        return;
      }

      // Create project with onboarding type
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          nombre: 'Nuevo Proyecto',
          descripcion: 'Proyecto en configuración',
          creator_id: memberData.id,
          owner_id: memberData.id,
          metadata: {
            onboarding_type: typeId
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      // Navigate directly to onboarding
      navigate(`/onboarding/${newProject.id}`);

    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
      setIsCreating(false);
      setSelectedType(null);
    }
  };

  // Capitalizar primera letra del nombre
  const displayName = profile?.nombre
    ? profile.nombre.charAt(0).toUpperCase() + profile.nombre.slice(1).toLowerCase()
    : 'a Optimus-K';

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center py-6 px-4">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header - Compacto */}
        <div className="text-center mb-6">
          {/* Logo - Más pequeño */}
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-purple-500/50">
              O
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                OPTIMUS-K
              </span>
              <span className="ml-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-bold shadow-lg">
                BETA
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
            {userProjects.length === 0 ? (
              <>¡Bienvenid@ {displayName}!</>
            ) : (
              <>Crear Nuevo Proyecto</>
            )}
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            {userProjects.length === 0 ? (
              <>
                Crea tu primer proyecto con nuestro onboarding inteligente.
                <span className="block text-cyan-300 font-semibold mt-1">Selecciona el tipo que mejor describa tu situación</span>
              </>
            ) : (
              <>
                Selecciona qué tipo de proyecto quieres crear.
                <span className="block text-cyan-300 font-semibold mt-1">Cada onboarding está personalizado para tu situación</span>
              </>
            )}
          </p>
        </div>

        {/* Onboarding Type Cards - Altura uniforme y más compactas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {onboardingTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="h-full flex flex-col bg-white/95 backdrop-blur border-2 border-white/20 transition-all cursor-pointer hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] hover:border-purple-400/50 group relative overflow-hidden"
                onClick={() => handleSelectType(type.id)}
              >
                {/* Efecto de fondo animado */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                <CardHeader className="relative z-10 pb-3">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2 text-gray-900 font-extrabold leading-tight">
                    {type.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-700 font-medium leading-snug">
                    {type.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 flex-1 flex flex-col pb-4">
                  <div className="flex-1 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Lo que haremos</p>
                    </div>
                    <ul className="space-y-2">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-900 font-semibold group/item">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover/item:scale-110 transition-transform">
                            <span className="text-white text-xs font-bold">{idx + 1}</span>
                          </div>
                          <span className="pt-0.5 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full group-hover:scale-105 transition-all duration-300 text-base font-bold shadow-lg h-11 bg-gradient-to-r ${type.color} hover:shadow-xl`}
                    disabled={isCreating}
                  >
                    {isCreating && selectedType === type.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 text-white animate-spin" />
                        <span className="text-white">Creando...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white">Seleccionar</span>
                        <ArrowRight className="ml-2 h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Text - Más compacto */}
        <div className="text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
            <p className="text-sm text-white font-medium flex items-center gap-2 justify-center">
              <span className="text-lg">💡</span>
              <span>No te preocupes, podrás ajustar la configuración en cualquier momento</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
