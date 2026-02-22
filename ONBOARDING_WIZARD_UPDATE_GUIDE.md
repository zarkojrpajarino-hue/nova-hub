# OnboardingWizard Update Guide

## Archivo: `src/components/onboarding/OnboardingWizard.tsx`

Esta guía muestra los cambios exactos necesarios para integrar el onboarding adaptativo.

---

## 1. IMPORTS (Líneas 1-38)

### Añadir después de línea 10:

```typescript
import {
  VALIDACION_STEPS,
  OPERACION_STEPS,
  // NEW: State-based imports
  IDEA_STEPS,
  VALIDACION_TEMPRANA_STEPS,
  TRACCION_STEPS,
  CONSOLIDADO_STEPS,
  defaultValidacionData,
  defaultOperacionData,
  // NEW: State-based defaults
  defaultIdeaData,
  defaultValidacionTempranaData,
  defaultTraccionData,
  defaultConsolidadoData,
  validacionSchema,
  operacionSchema,
  // NEW: State-based schemas
  ideaSchema,
  validacionTempranaSchema,
  traccionSchema,
  consolidadoSchema,
  type ValidacionData,
  type OperacionData,
  type OnboardingData,
  // NEW: State-based types
  type IdeaData,
  type ValidacionTempranaData,
  type TraccionData,
  type ConsolidadoData,
  type StateBasedOnboardingData,
} from './types';
```

### Añadir después de línea 38:

```typescript
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
```

---

## 2. TYPES (Línea 40)

### Actualizar interface:

```typescript
interface OnboardingWizardProps {
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_data?: OnboardingData | null;
    project_state?: 'idea' | 'validacion_temprana' | 'traccion' | 'consolidado' | null; // NEW
  };
  onComplete?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  useStateBased?: boolean; // NEW: Flag to use state-based onboarding
}
```

---

## 3. COMPONENT BODY (Línea 54)

### Añadir después de línea 56 (después de `const isValidacion`):

```typescript
export function OnboardingWizard({
  project,
  onComplete,
  onCancel,
  editMode = false,
  useStateBased = true, // NEW: Enable state-based by default for new projects
}: OnboardingWizardProps) {
  const queryClient = useQueryClient();

  // NEW: Determine if using state-based onboarding
  const usingStateBased = useStateBased && !project.onboarding_data; // Use state-based for new projects
  const isValidacion = project.tipo === 'validacion';

  // NEW: State for state-based onboarding
  const [projectState, setProjectState] = useState<'idea' | 'validacion_temprana' | 'traccion' | 'consolidado' | null>(
    project.project_state || null
  );

  // NEW: Determine steps based on approach
  const steps = usingStateBased && projectState
    ? getStepsForState(projectState)
    : isValidacion
    ? VALIDACION_STEPS
    : OPERACION_STEPS;

  // ... rest of existing code
```

### Añadir helper function ANTES del return (después de las funciones render):

```typescript
  // NEW: Get steps for state-based onboarding
  const getStepsForState = (state: typeof projectState) => {
    switch (state) {
      case 'idea': return IDEA_STEPS;
      case 'validacion_temprana': return VALIDACION_TEMPRANA_STEPS;
      case 'traccion': return TRACCION_STEPS;
      case 'consolidado': return CONSOLIDADO_STEPS;
      default: return IDEA_STEPS;
    }
  };

  // NEW: State-based data management
  const [ideaData, setIdeaData] = useState<IdeaData>(defaultIdeaData);
  const [validacionTempranaData, setValidacionTempranaData] = useState<ValidacionTempranaData>(defaultValidacionTempranaData);
  const [traccionData, setTraccionData] = useState<TraccionData>(defaultTraccionData);
  const [consolidadoData, setConsolidadoData] = useState<ConsolidadoData>(defaultConsolidadoData);

  // NEW: Get current state data
  const getStateData = () => {
    switch (projectState) {
      case 'idea': return ideaData;
      case 'validacion_temprana': return validacionTempranaData;
      case 'traccion': return traccionData;
      case 'consolidado': return consolidadoData;
      default: return null;
    }
  };

  // NEW: Get state schema
  const getStateSchema = () => {
    switch (projectState) {
      case 'idea': return ideaSchema;
      case 'validacion_temprana': return validacionTempranaSchema;
      case 'traccion': return traccionSchema;
      case 'consolidado': return consolidadoSchema;
      default: return null;
    }
  };
```

---

## 4. UPDATE handleNext (Línea 123)

### Reemplazar handleNext completo:

```typescript
  const handleNext = async () => {
    // NEW: For state-based onboarding, validate state selection on step 0
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
```

---

## 5. UPDATE validateAndSubmit (Línea 143)

### Reemplazar la parte de validación (línea 154-169):

```typescript
    try {
      // NEW: Get data and schema based on onboarding type
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

      // ... rest of existing code (save to DB, etc.)
```

### Actualizar el UPDATE query (línea 199):

```typescript
      // Save onboarding data to database
      const updateData: any = {
        onboarding_completed: true,
        onboarding_data: data,
      };

      // NEW: Save project_state for state-based onboarding
      if (usingStateBased && projectState) {
        updateData.project_state = projectState;
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);
```

---

## 6. ADD RENDER FUNCTIONS FOR STATE-BASED STEPS

### Añadir ANTES de las funciones render existentes (línea 224):

```typescript
  // NEW: Render state-based steps
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

  // NEW: Render functions for each state
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
```

---

## 7. UPDATE RENDER (Línea 331)

### Reemplazar el CardContent (línea 331):

```typescript
      {/* Content */}
      <CardContent className="p-6 min-h-[350px]">
        {usingStateBased
          ? renderStateBasedStep()
          : isValidacion
          ? renderValidacionStep()
          : renderOperacionStep()}
      </CardContent>
```

---

## 8. UPDATE HEADER BADGE (Línea 310)

### Actualizar el badge para mostrar el estado:

```typescript
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full",
            usingStateBased && projectState
              ? projectState === 'idea'
                ? "bg-amber-500/15 text-amber-600"
                : projectState === 'validacion_temprana'
                ? "bg-green-500/15 text-green-600"
                : projectState === 'traccion'
                ? "bg-blue-500/15 text-blue-600"
                : "bg-purple-500/15 text-purple-600"
              : isValidacion
                ? "bg-amber-500/15 text-amber-600"
                : "bg-green-500/15 text-green-600"
          )}>
            {usingStateBased && projectState
              ? projectState === 'idea'
                ? '💡 Idea'
                : projectState === 'validacion_temprana'
                ? '🌱 Validación'
                : projectState === 'traccion'
                ? '📈 Tracción'
                : '🏢 Consolidado'
              : isValidacion
                ? '🧪 Lean Startup'
                : '🚀 Negocio Validado'}
          </span>
```

---

## TESTING CHECKLIST

Después de aplicar todos los cambios:

- [ ] npm run dev funciona sin errores
- [ ] No hay errores de TypeScript
- [ ] Crear proyecto nuevo muestra Step 0 de selección de estado
- [ ] Seleccionar "Idea" muestra los 4 steps correctos
- [ ] Completar onboarding guarda `project_state` en DB
- [ ] Proyectos legacy (validacion/operacion) siguen funcionando
- [ ] Edit mode funciona correctamente
- [ ] Validación de formularios funciona en cada step
- [ ] Auto-save a localStorage funciona
- [ ] Al completar, se invalidan las queries correctamente

---

## NOTAS IMPORTANTES

1. **Backward Compatibility**: El código mantiene compatibilidad con proyectos existentes usando `usingStateBased` flag
2. **Default Behavior**: Nuevos proyectos usan state-based, existentes usan legacy
3. **Gradual Migration**: Se puede añadir UI para que usuarios actualicen su estado
4. **Type Safety**: Todos los nuevos tipos están correctamente tipados con TypeScript
5. **Validation**: Cada estado tiene su propio schema de Zod con validaciones específicas

---

**SIGUIENTE PASO**: Aplicar estos cambios uno por uno, probando después de cada sección
