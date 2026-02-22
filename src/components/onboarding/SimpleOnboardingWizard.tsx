/**
 * 🎯 SIMPLE ONBOARDING WIZARD
 * Onboarding profesional, claro e intuitivo
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  MapPin,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Definir los pasos según el tipo de onboarding
const STEPS_BY_TYPE: Record<OnboardingType, Step[]> = {
  generative: [
    { id: 'profile', label: 'Tu Perfil', icon: User, description: 'Cuéntanos sobre ti' },
    { id: 'location', label: 'Ubicación', icon: MapPin, description: 'Dónde estás y operas' },
    { id: 'skills', label: 'Tus Skills', icon: Briefcase, description: 'Tu experiencia y habilidades' },
    { id: 'interests', label: 'Intereses', icon: Lightbulb, description: 'Qué te apasiona' },
    { id: 'situation', label: 'Tu Situación', icon: Users, description: 'Recursos disponibles' },
    { id: 'preferences', label: 'Preferencias', icon: Target, description: 'Tipo de negocio que buscas' },
  ],
  idea: [
    { id: 'profile', label: 'Tu Perfil', icon: User, description: 'Información básica' },
    { id: 'idea', label: 'Tu Idea', icon: Lightbulb, description: 'Describe tu negocio' },
    { id: 'problem', label: 'Problema', icon: Target, description: 'Qué problema resuelves' },
    { id: 'solution', label: 'Solución', icon: TrendingUp, description: 'Cómo lo resuelves' },
    { id: 'team', label: 'Equipo', icon: Users, description: 'Quién está contigo' },
    { id: 'market', label: 'Mercado', icon: MapPin, description: 'A quién te diriges' },
  ],
  existing: [
    { id: 'profile', label: 'Tu Perfil', icon: User, description: 'Información básica' },
    { id: 'business', label: 'Tu Negocio', icon: Building2, description: 'Descripción actual' },
    { id: 'products', label: 'Productos', icon: Briefcase, description: 'Qué vendes' },
    { id: 'customers', label: 'Clientes', icon: Users, description: 'A quién vendes' },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp, description: 'Números actuales' },
    { id: 'goals', label: 'Objetivos', icon: Target, description: 'Dónde quieres llegar' },
  ],
};

interface Props {
  projectId: string;
  onComplete: () => void;
}

export function SimpleOnboardingWizard({ projectId, onComplete }: Props) {
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Cargar tipo de onboarding del proyecto
  useEffect(() => {
    const loadProject = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (project?.metadata?.onboarding_type) {
        setOnboardingType(project.metadata.onboarding_type);
      } else {
        setOnboardingType('idea'); // Default
      }
      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  if (loading || !onboardingType) {
    return <div>Cargando...</div>;
  }

  const steps = STEPS_BY_TYPE[onboardingType];
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      // Guardar y completar
      setSaving(true);
      try {
        await supabase
          .from('projects')
          .update({
            metadata: {
              onboarding_type: onboardingType,
              onboarding_data: formData,
              onboarding_completed: true,
            }
          })
          .eq('id', projectId);

        toast.success('¡Onboarding completado!');
        onComplete();
      } catch (error) {
        console.error('Error saving:', error);
        toast.error('Error al guardar');
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const updateFormData = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Stepper Horizontal */}
      <Card className="mb-8 bg-white/80 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${isActive ? 'bg-purple-600 text-white scale-110' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-medium ${isActive ? 'text-purple-600' : 'text-gray-700'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Paso Actual */}
      <Card className="bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">{currentStep.label}</CardTitle>
          <CardDescription className="text-base">{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Renderizar campos según el paso */}
          <StepContent
            stepId={currentStep.id}
            onboardingType={onboardingType}
            formData={formData}
            updateFormData={updateFormData}
          />

          {/* Botones de Navegación */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={saving}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isLastStep ? (
                <>
                  {saving ? 'Guardando...' : 'Completar'}
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para renderizar el contenido de cada paso
function StepContent({
  stepId,
  onboardingType,
  formData,
  updateFormData
}: {
  stepId: string;
  onboardingType: OnboardingType;
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  // Renderizar campos específicos para cada paso
  switch (stepId) {
    case 'profile':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Tu nombre completo</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role">Tu rol actual</Label>
            <Input
              id="role"
              placeholder="Ej: Product Manager, Desarrollador, etc."
              value={formData.role || ''}
              onChange={(e) => updateFormData('role', e.target.value)}
            />
          </div>
        </div>
      );

    case 'location':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              placeholder="España"
              value={formData.country || ''}
              onChange={(e) => updateFormData('country', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              placeholder="Madrid"
              value={formData.city || ''}
              onChange={(e) => updateFormData('city', e.target.value)}
            />
          </div>
        </div>
      );

    case 'idea':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="business_name">Nombre de tu idea/negocio</Label>
            <Input
              id="business_name"
              placeholder="Ej: Mi Startup SaaS"
              value={formData.business_name || ''}
              onChange={(e) => updateFormData('business_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Describe tu idea en pocas palabras</Label>
            <Textarea
              id="description"
              placeholder="¿Qué hace tu negocio? ¿A quién ayuda?"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
            />
          </div>
        </div>
      );

    case 'problem':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="problem">¿Qué problema específico resuelves?</Label>
            <Textarea
              id="problem"
              placeholder="Describe el dolor o necesidad que atiendes"
              rows={4}
              value={formData.problem || ''}
              onChange={(e) => updateFormData('problem', e.target.value)}
            />
          </div>
        </div>
      );

    case 'solution':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="solution">¿Cómo lo resuelves?</Label>
            <Textarea
              id="solution"
              placeholder="Explica tu solución y por qué es mejor"
              rows={4}
              value={formData.solution || ''}
              onChange={(e) => updateFormData('solution', e.target.value)}
            />
          </div>
        </div>
      );

    case 'team':
      return (
        <div className="space-y-4">
          <div>
            <Label>¿Trabajas solo o en equipo?</Label>
            <RadioGroup
              value={formData.team_type || ''}
              onValueChange={(value) => updateFormData('team_type', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solo" id="solo" />
                <Label htmlFor="solo">Solo (solopreneur)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="co-founders" id="co-founders" />
                <Label htmlFor="co-founders">Con co-founders</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team">Con equipo completo</Label>
              </div>
            </RadioGroup>
          </div>
          {formData.team_type !== 'solo' && (
            <div>
              <Label htmlFor="team_size">¿Cuántas personas son?</Label>
              <Input
                id="team_size"
                type="number"
                min="1"
                placeholder="3"
                value={formData.team_size || ''}
                onChange={(e) => updateFormData('team_size', e.target.value)}
              />
            </div>
          )}
        </div>
      );

    case 'market':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="target_market">¿Quién es tu cliente ideal?</Label>
            <Textarea
              id="target_market"
              placeholder="Describe a tu cliente objetivo (edad, ocupación, necesidades, etc.)"
              rows={4}
              value={formData.target_market || ''}
              onChange={(e) => updateFormData('target_market', e.target.value)}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-700">
          <p>Este paso está en construcción</p>
          <p className="text-sm mt-2">Haz clic en "Siguiente" para continuar</p>
        </div>
      );
  }
}
