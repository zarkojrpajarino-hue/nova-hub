import { useState, useEffect } from 'react';
import { Rocket, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OnboardingProgress } from './OnboardingProgress';
import { useOnboardingEdit } from '@/hooks/useOnboardingEdit';
import {
  VALIDACION_STEPS,
  OPERACION_STEPS,
  IDEA_STEPS,
  VALIDACION_TEMPRANA_STEPS,
  TRACCION_STEPS,
  CONSOLIDADO_STEPS,
  defaultValidacionData,
  defaultOperacionData,
  defaultIdeaData,
  defaultValidacionTempranaData,
  defaultTraccionData,
  defaultConsolidadoData,
  validacionSchema,
  operacionSchema,
  ideaSchema,
  validacionTempranaSchema,
  traccionSchema,
  consolidadoSchema,
  type ValidacionData,
  type OperacionData,
  type OnboardingData,
  type IdeaData,
  type ValidacionTempranaData,
  type TraccionData,
  type ConsolidadoData,
  type StateBasedOnboardingData,
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
import { StepEquipo } from './steps/StepEquipo';
import { StepStateSelection } from './steps/StepStateSelection';
import {
  StepProblemDiscovery,
  StepSolutionHypothesis,
  StepHypothesesToValidate,
  StepValidationPlan,
} from './steps/IdeaSteps';
import {
  StepCurrentStatus,
  StepFeedbackLearning,
  StepPMFValidation,
  StepNextSteps,
} from './steps/ValidationTempranaSteps';
import {
  StepKeyMetrics,
  StepGrowthEngine,
  StepOperationsTeam,
  StepGrowthPlan,
} from './steps/TraccionSteps';
import {
  StepBusinessMetrics,
  StepTeamOrganization,
  StepGTMProduct,
  StepStrategicObjectives,
} from './steps/ConsolidadoSteps';

type ProjectState = 'idea' | 'validacion_temprana' | 'traccion' | 'consolidado';

interface OnboardingWizardProps {
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_data?: OnboardingData | null;
    project_state?: ProjectState | null;
  };
  onComplete?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  useStateBased?: boolean; // Enable state-based onboarding for new projects
}

export function OnboardingWizard({
  project,
  onComplete,
  onCancel,
  editMode = false,
  useStateBased = true, // Enable by default for new projects
}: OnboardingWizardProps) {
  const queryClient = useQueryClient();

  // Determine if using state-based onboarding (for new projects or if explicitly enabled)
  const usingStateBased = useStateBased && !project.onboarding_data;
  const isValidacion = project.tipo === 'validacion';

  // State for state-based onboarding
  const [projectState, setProjectState] = useState<ProjectState | null>(
    project.project_state || null
  );

  // Helper: Get steps based on approach
  const getStepsForState = (state: ProjectState | null) => {
    if (!state) return IDEA_STEPS; // Default to IDEA steps if no state selected
    switch (state) {
      case 'idea': return IDEA_STEPS;
      case 'validacion_temprana': return VALIDACION_TEMPRANA_STEPS;
      case 'traccion': return TRACCION_STEPS;
      case 'consolidado': return CONSOLIDADO_STEPS;
      default: return IDEA_STEPS;
    }
  };

  // Determine steps based on approach
  const steps = usingStateBased
    ? getStepsForState(projectState)
    : isValidacion
    ? VALIDACION_STEPS
    : OPERACION_STEPS;

  const { saveOnboardingData, isSaving: isSavingEdit } = useOnboardingEdit({
    projectId: project.id,
    onSuccess: onComplete,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Load existing team members in edit mode
  useEffect(() => {
    if (editMode) {
      const loadMembers = async () => {
        const { data } = await supabase
          .from('project_members')
          .select('member_id')
          .eq('project_id', project.id);

        if (data) {
          setSelectedMembers(data.map(m => m.member_id));
        }
      };
      loadMembers();
    }
  }, [editMode, project.id]);

  // Legacy onboarding data (validacion/operacion)
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

  // State-based onboarding data
  const [ideaData, setIdeaData] = useState<IdeaData>(defaultIdeaData);
  const [validacionTempranaData, setValidacionTempranaData] = useState<ValidacionTempranaData>(
    defaultValidacionTempranaData
  );
  const [traccionData, setTraccionData] = useState<TraccionData>(defaultTraccionData);
  const [consolidadoData, setConsolidadoData] = useState<ConsolidadoData>(defaultConsolidadoData);

  // Helper: Get current state data
  const getStateData = (): StateBasedOnboardingData | null => {
    switch (projectState) {
      case 'idea': return ideaData;
      case 'validacion_temprana': return validacionTempranaData;
      case 'traccion': return traccionData;
      case 'consolidado': return consolidadoData;
      default: return null;
    }
  };

  // Helper: Get state schema
  const getStateSchema = () => {
    switch (projectState) {
      case 'idea': return ideaSchema;
      case 'validacion_temprana': return validacionTempranaSchema;
      case 'traccion': return traccionSchema;
      case 'consolidado': return consolidadoSchema;
      default: return null;
    }
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    if (usingStateBased) {
      const stateData = getStateData();
      if (stateData) {
        localStorage.setItem(`onboarding-draft-${project.id}`, JSON.stringify(stateData));
      }
    } else {
      const data = isValidacion ? validacionData : operacionData;
      localStorage.setItem(`onboarding-draft-${project.id}`, JSON.stringify(data));
    }
  }, [
    validacionData,
    operacionData,
    ideaData,
    validacionTempranaData,
    traccionData,
    consolidadoData,
    project.id,
    isValidacion,
    usingStateBased,
  ]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`onboarding-draft-${project.id}`);
    if (draft && !project.onboarding_data) {
      try {
        const parsed = JSON.parse(draft);
        if (usingStateBased && 'state' in parsed) {
          // State-based draft
          switch (parsed.state) {
            case 'idea': setIdeaData(parsed); break;
            case 'validacion_temprana': setValidacionTempranaData(parsed); break;
            case 'traccion': setTraccionData(parsed); break;
            case 'consolidado': setConsolidadoData(parsed); break;
          }
        } else if ('tipo' in parsed) {
          // Legacy draft
          if (parsed.tipo === 'validacion') {
            setValidacionData(parsed);
          } else {
            setOperacionData(parsed);
          }
        }
      } catch (e) {
        // Ignore invalid drafts
      }
    }
  }, [project.id, project.onboarding_data, usingStateBased]);

  const handleNext = async () => {
    // For state-based onboarding, validate state selection on step 0
    if (usingStateBased && currentStep === 0 && !projectState) {
      toast.error('Selecciona el estado de tu proyecto');
      return;
    }

    // Validate team selection on step 1 (or step 0 for legacy)
    const teamStepIndex = usingStateBased ? 1 : 0;
    if (currentStep === teamStepIndex && selectedMembers.length < 2) {
      toast.error('Selecciona al menos 2 miembros para el equipo');
      return;
    }

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
    // Validate team selection
    if (selectedMembers.length < 2) {
      toast.error('Selecciona al menos 2 miembros para el equipo');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Get data and schema based on onboarding type
      let data: any;
      let schema: any;

      if (usingStateBased) {
        data = getStateData();
        schema = getStateSchema();

        if (!data || !schema) {
          toast.error('Error: Estado del proyecto no válido');
          setIsSubmitting(false);
          return;
        }
      } else {
        data = isValidacion ? validacionData : operacionData;
        schema = isValidacion ? validacionSchema : operacionSchema;
      }

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

      // Use edit hook if in edit mode
      if (editMode) {
        await saveOnboardingData(data, selectedMembers);
        return; // Hook handles success callback
      }

      // Original onboarding flow (first time)
      // First, remove existing members (in case of re-onboarding)
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id);

      // Insert new project members
      const membersToInsert = selectedMembers.map(memberId => ({
        project_id: project.id,
        member_id: memberId,
        role: null, // Will be assigned by AI
        role_accepted: false,
      }));

      const { error: membersError } = await supabase
        .from('project_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      // Save onboarding data to database
      const updateData: any = {
        onboarding_completed: true,
        onboarding_data: data,
      };

      // Save project_state for state-based onboarding
      if (usingStateBased && projectState) {
        updateData.project_state = projectState;
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (error) throw error;

      // Clear draft
      localStorage.removeItem(`onboarding-draft-${project.id}`);

      toast.success('¡Equipo configurado! Generando roles con IA...');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
      onComplete?.();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error('Error al guardar el onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER FUNCTIONS - STATE-BASED
  // ============================================

  const renderStateBasedStep = (): React.ReactNode => {
    // Step 0: State selection
    if (currentStep === 0) {
      return (
        <StepStateSelection
          selectedState={projectState}
          onChange={setProjectState}
        />
      );
    }

    // Step 1: Team selection (same for all states)
    if (currentStep === 1) {
      return (
        <StepEquipo
          projectId={project.id}
          selectedMembers={selectedMembers}
          onChange={setSelectedMembers}
          minMembers={2}
          maxMembers={6}
        />
      );
    }

    // Steps 2+: State-specific
    if (!projectState) return null;

    switch (projectState) {
      case 'idea':
        return renderIdeaSteps();
      case 'validacion_temprana':
        return renderValidacionTempranaSteps();
      case 'traccion':
        return renderTraccionSteps();
      case 'consolidado':
        return renderConsolidadoSteps();
      default:
        return null;
    }
  };

  const renderIdeaSteps = () => {
    const props = {
      data: ideaData,
      onChange: (partial: Partial<IdeaData>) => setIdeaData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 2: return <StepProblemDiscovery {...props} />;
      case 3: return <StepSolutionHypothesis {...props} />;
      case 4: return <StepHypothesesToValidate {...props} />;
      case 5: return <StepValidationPlan {...props} />;
      default: return null;
    }
  };

  const renderValidacionTempranaSteps = () => {
    const props = {
      data: validacionTempranaData,
      onChange: (partial: Partial<ValidacionTempranaData>) =>
        setValidacionTempranaData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 2: return <StepCurrentStatus {...props} />;
      case 3: return <StepFeedbackLearning {...props} />;
      case 4: return <StepPMFValidation {...props} />;
      case 5: return <StepNextSteps {...props} />;
      default: return null;
    }
  };

  const renderTraccionSteps = () => {
    const props = {
      data: traccionData,
      onChange: (partial: Partial<TraccionData>) =>
        setTraccionData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 2: return <StepKeyMetrics {...props} />;
      case 3: return <StepGrowthEngine {...props} />;
      case 4: return <StepOperationsTeam {...props} />;
      case 5: return <StepGrowthPlan {...props} />;
      default: return null;
    }
  };

  const renderConsolidadoSteps = () => {
    const props = {
      data: consolidadoData,
      onChange: (partial: Partial<ConsolidadoData>) =>
        setConsolidadoData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 2: return <StepBusinessMetrics {...props} />;
      case 3: return <StepTeamOrganization {...props} />;
      case 4: return <StepGTMProduct {...props} />;
      case 5: return <StepStrategicObjectives {...props} />;
      default: return null;
    }
  };

  // ============================================
  // RENDER FUNCTIONS - LEGACY (VALIDACION/OPERACION)
  // ============================================

  const renderValidacionStep = () => {
    // Step 0 is always team selection
    if (currentStep === 0) {
      return (
        <StepEquipo
          projectId={project.id}
          selectedMembers={selectedMembers}
          onChange={setSelectedMembers}
          minMembers={2}
          maxMembers={6}
        />
      );
    }

    const props = {
      data: validacionData,
      onChange: (partial: Partial<ValidacionData>) =>
        setValidacionData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 1: return <StepProblema {...props} />;
      case 2: return <StepCliente {...props} />;
      case 3: return <StepSolucion {...props} />;
      case 4: return <StepHipotesis {...props} />;
      case 5: return <CoreaEspanaStep {...props} />;
      case 6: return <StepMetricas {...props} />;
      case 7: return <StepRecursos {...props} />;
      default: return null;
    }
  };

  const renderOperacionStep = () => {
    // Step 0 is always team selection
    if (currentStep === 0) {
      return (
        <StepEquipo
          projectId={project.id}
          selectedMembers={selectedMembers}
          onChange={setSelectedMembers}
          minMembers={2}
          maxMembers={6}
        />
      );
    }

    const props = {
      data: operacionData,
      onChange: (partial: Partial<OperacionData>) =>
        setOperacionData(prev => ({ ...prev, ...partial })),
      errors,
    };

    switch (currentStep) {
      case 1: return <StepCanvas1 {...props} />;
      case 2: return <StepCanvas2 {...props} />;
      case 3: return <StepFinanzas {...props} />;
      case 4: return <StepClientes {...props} />;
      case 5: return <StepObjetivos {...props} />;
      default: return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  // Helper: Get state label for header
  const getStateLabel = () => {
    if (!usingStateBased) {
      return isValidacion ? '🧪 Lean Startup' : '🚀 Negocio Validado';
    }

    if (!projectState) return '🎯 Estado del Proyecto';

    switch (projectState) {
      case 'idea': return '💡 Idea / Exploración';
      case 'validacion_temprana': return '🌱 Validación Temprana';
      case 'traccion': return '📈 Proyecto con Tracción';
      case 'consolidado': return '🏢 Negocio Consolidado';
      default: return '🎯 Estado del Proyecto';
    }
  };

  // Helper: Get badge color
  const getBadgeClasses = () => {
    if (!usingStateBased) {
      return isValidacion
        ? 'bg-amber-500/15 text-amber-600'
        : 'bg-green-500/15 text-green-600';
    }

    if (!projectState) return 'bg-gray-500/15 text-gray-600';

    switch (projectState) {
      case 'idea': return 'bg-amber-500/15 text-amber-600';
      case 'validacion_temprana': return 'bg-green-500/15 text-green-600';
      case 'traccion': return 'bg-blue-500/15 text-blue-600';
      case 'consolidado': return 'bg-purple-500/15 text-purple-600';
      default: return 'bg-gray-500/15 text-gray-600';
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
                {usingStateBased ? 'Onboarding Adaptativo' : `Onboarding - ${isValidacion ? 'Modo Validación' : 'Modo Operación'}`}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full',
              getBadgeClasses()
            )}
          >
            {getStateLabel()}
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
        {usingStateBased
          ? renderStateBasedStep()
          : isValidacion
          ? renderValidacionStep()
          : renderOperacionStep()}
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
              disabled={isSubmitting || isSavingEdit}
              className={editMode ? '' : 'bg-green-600 hover:bg-green-700'}
            >
              {isSubmitting || isSavingEdit ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editMode ? (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
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
