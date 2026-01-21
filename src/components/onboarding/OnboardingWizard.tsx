import { useState, useEffect } from 'react';
import { Rocket, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OnboardingProgress } from './OnboardingProgress';
import { 
  VALIDACION_STEPS, 
  OPERACION_STEPS,
  defaultValidacionData,
  defaultOperacionData,
  validacionSchema,
  operacionSchema,
  type ValidacionData,
  type OperacionData,
  type OnboardingData,
} from './types';
import { 
  StepProblema, 
  StepCliente, 
  StepSolucion, 
  StepHipotesis, 
  StepMetricas, 
  StepRecursos 
} from './steps/ValidacionSteps';
import { 
  StepCanvas1, 
  StepCanvas2, 
  StepFinanzas, 
  StepClientes, 
  StepObjetivos 
} from './steps/OperacionSteps';
import { CoreaEspanaStep } from './steps/CoreaEspanaStep';

interface OnboardingWizardProps {
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_data?: OnboardingData | null;
  };
  onComplete?: () => void;
  onCancel?: () => void;
}

export function OnboardingWizard({ project, onComplete, onCancel }: OnboardingWizardProps) {
  const queryClient = useQueryClient();
  const isValidacion = project.tipo === 'validacion';
  const steps = isValidacion ? VALIDACION_STEPS : OPERACION_STEPS;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize data from existing onboarding_data or defaults
  const [validacionData, setValidacionData] = useState<ValidacionData>(() => {
    if (project.onboarding_data && 'tipo' in project.onboarding_data && project.onboarding_data.tipo === 'validacion') {
      return project.onboarding_data as ValidacionData;
    }
    return defaultValidacionData;
  });

  const [operacionData, setOperacionData] = useState<OperacionData>(() => {
    if (project.onboarding_data && 'tipo' in project.onboarding_data && project.onboarding_data.tipo === 'operacion') {
      return project.onboarding_data as OperacionData;
    }
    return defaultOperacionData;
  });

  // Auto-save draft to localStorage
  useEffect(() => {
    const data = isValidacion ? validacionData : operacionData;
    localStorage.setItem(`onboarding-draft-${project.id}`, JSON.stringify(data));
  }, [validacionData, operacionData, project.id, isValidacion]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`onboarding-draft-${project.id}`);
    if (draft && !project.onboarding_data) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.tipo === 'validacion') {
          setValidacionData(parsed);
        } else {
          setOperacionData(parsed);
        }
      } catch (e) {
        // Ignore invalid drafts
      }
    }
  }, [project.id, project.onboarding_data]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const validateAndSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const data = isValidacion ? validacionData : operacionData;
      const schema = isValidacion ? validacionSchema : operacionSchema;
      
      // Validate with zod
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          fieldErrors[err.path.join('.')] = err.message;
        });
        setErrors(fieldErrors);
        toast.error('Por favor, revisa los campos marcados');
        setIsSubmitting(false);
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('projects')
        .update({
          onboarding_completed: true,
          onboarding_data: data,
        })
        .eq('id', project.id);

      if (error) throw error;

      // Clear draft
      localStorage.removeItem(`onboarding-draft-${project.id}`);
      
      toast.success('¡Onboarding completado!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onComplete?.();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error('Error al guardar el onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderValidacionStep = () => {
    const props = {
      data: validacionData,
      onChange: (partial: Partial<ValidacionData>) => 
        setValidacionData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 0: return <StepProblema {...props} />;
      case 1: return <StepCliente {...props} />;
      case 2: return <StepSolucion {...props} />;
      case 3: return <StepHipotesis {...props} />;
      case 4: return <CoreaEspanaStep {...props} />;
      case 5: return <StepMetricas {...props} />;
      case 6: return <StepRecursos {...props} />;
      default: return null;
    }
  };

  const renderOperacionStep = () => {
    const props = {
      data: operacionData,
      onChange: (partial: Partial<OperacionData>) => 
        setOperacionData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 0: return <StepCanvas1 {...props} />;
      case 1: return <StepCanvas2 {...props} />;
      case 2: return <StepFinanzas {...props} />;
      case 3: return <StepClientes {...props} />;
      case 4: return <StepObjetivos {...props} />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader 
        className="border-b"
        style={{ background: `linear-gradient(135deg, ${project.color}10 0%, transparent 100%)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${project.color}25` }}
            >
              {project.icon}
            </div>
            <div>
              <CardTitle>{project.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Onboarding - {isValidacion ? 'Modo Validación' : 'Modo Operación'}
              </p>
            </div>
          </div>
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full",
            isValidacion 
              ? "bg-amber-500/15 text-amber-600" 
              : "bg-green-500/15 text-green-600"
          )}>
            {isValidacion ? '🧪 Lean Startup' : '🚀 Negocio Validado'}
          </span>
        </div>
      </CardHeader>

      {/* Progress */}
      <div className="px-6 py-4 bg-muted/30 border-b overflow-x-auto">
        <OnboardingProgress 
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Content */}
      <CardContent className="p-6 min-h-[350px]">
        {isValidacion ? renderValidacionStep() : renderOperacionStep()}
      </CardContent>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev}>
              <ChevronLeft size={16} className="mr-1" />
              Anterior
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Siguiente
              <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={validateAndSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Rocket size={16} className="mr-2" />
                  Completar Onboarding
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
