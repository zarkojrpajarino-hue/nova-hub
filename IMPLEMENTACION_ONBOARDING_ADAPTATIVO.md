# Implementación: Sistema de Onboarding Adaptativo

## 🎯 Objetivo

Crear diferentes flujos de onboarding basados en el estado del proyecto (madurez del negocio):
- **Idea/Exploración**: Sin clientes, sin ingresos
- **Validación Temprana**: 1-10 clientes, €0-1k/mes
- **Tracción**: 10-100 clientes, €1-10k/mes
- **Consolidado**: 100+ clientes, €10k+/mes

## ✅ Completado

### 1. Base de Datos (Migration)
**Archivo**: `supabase/migrations/20260128_add_project_state.sql`

```sql
-- Enum para estados de proyecto
CREATE TYPE public.project_state AS ENUM (
  'idea',                -- No customers, no revenue
  'validacion_temprana', -- 1-10 customers, €0-1k/month
  'traccion',            -- 10-100 customers, €1-10k/month
  'consolidado'          -- 100+ customers, €10k+/month
);

-- Nueva columna en projects
ALTER TABLE public.projects ADD COLUMN project_state public.project_state DEFAULT 'idea';
```

**⚠️ IMPORTANTE**: Este SQL debe ejecutarse en Supabase Dashboard → SQL Editor

### 2. TypeScript Types
**Archivo**: `src/integrations/supabase/types.ts`

- ✅ Añadido `project_state` enum
- ✅ Añadido campo `project_state` a tabla `projects`
- ✅ Actualizado en Row, Insert y Update interfaces

### 3. Schemas de Validación (Zod)
**Archivo**: `src/components/onboarding/types.ts`

- ✅ `ideaSchema` - Para proyectos en exploración
- ✅ `validacionTempranaSchema` - Para primeros clientes
- ✅ `traccionSchema` - Para negocios en crecimiento
- ✅ `consolidadoSchema` - Para empresas establecidas
- ✅ Step definitions para cada estado
- ✅ Default data para cada estado

### 4. Componentes de Steps por Estado

#### a) Selección de Estado (Step 0)
**Archivo**: `src/components/onboarding/steps/StepStateSelection.tsx`
- ✅ UI con 4 cards para seleccionar estado
- ✅ Descripciones y ejemplos para cada estado
- ✅ Diseño visual atractivo con iconos

#### b) Idea State Steps
**Archivo**: `src/components/onboarding/steps/IdeaSteps.tsx`
- ✅ StepProblemDiscovery - Descubrimiento del problema
- ✅ StepSolutionHypothesis - Hipótesis de solución
- ✅ StepHypothesesToValidate - Hipótesis a validar
- ✅ StepValidationPlan - Plan de validación

#### c) Validación Temprana Steps
**Archivo**: `src/components/onboarding/steps/ValidationTempranaSteps.tsx`
- ✅ StepCurrentStatus - Estado actual (clientes, MRR)
- ✅ StepFeedbackLearning - Aprendizajes
- ✅ StepPMFValidation - Validación PMF
- ✅ StepNextSteps - Próximos pasos

#### d) Tracción Steps
**Archivo**: `src/components/onboarding/steps/TraccionSteps.tsx`
- ✅ StepKeyMetrics - Métricas clave (MRR, CAC, LTV, Churn)
- ✅ StepGrowthEngine - Motor de crecimiento
- ✅ StepOperationsTeam - Operaciones y equipo
- ✅ StepGrowthPlan - Plan de crecimiento

#### e) Consolidado Steps
**Archivo**: `src/components/onboarding/steps/ConsolidadoSteps.tsx`
- ✅ StepBusinessMetrics - Métricas del negocio (ARR, NRR)
- ✅ StepTeamOrganization - Equipo y organización
- ✅ StepGTMProduct - Go-to-Market y producto
- ✅ StepStrategicObjectives - Objetivos estratégicos

## 🔄 En Progreso / Pendiente

### 5. Actualizar OnboardingWizard
**Archivo**: `src/components/onboarding/OnboardingWizard.tsx`

**Cambios necesarios**:

```typescript
// 1. Importar nuevos componentes
import { StepStateSelection } from './steps/StepStateSelection';
import {
  StepProblemDiscovery,
  StepSolutionHypothesis,
  StepHypothesesToValidate,
  StepValidationPlan,
} from './steps/IdeaSteps';
// ... importar de ValidationTempranaSteps, TraccionSteps, ConsolidadoSteps

// 2. Añadir state management
const [projectState, setProjectState] = useState<ProjectState | null>(null);
const [stateBasedData, setStateBasedData] = useState<StateBasedOnboardingData | null>(null);

// 3. Determinar steps según el estado
const getStepsForState = (state: ProjectState) => {
  switch (state) {
    case 'idea': return IDEA_STEPS;
    case 'validacion_temprana': return VALIDACION_TEMPRANA_STEPS;
    case 'traccion': return TRACCION_STEPS;
    case 'consolidado': return CONSOLIDADO_STEPS;
    default: return IDEA_STEPS;
  }
};

// 4. Renderizar steps según el estado
const renderStateBasedStep = () => {
  if (!projectState) return <StepStateSelection />;

  // Step 1: Team selection (mismo para todos)
  if (currentStep === 1) return <StepEquipo />;

  // Steps 2+: Según el estado
  switch (projectState) {
    case 'idea':
      return renderIdeaSteps();
    case 'validacion_temprana':
      return renderValidacionTempranaSteps();
    // ... etc
  }
};

// 5. Guardar project_state en DB
await supabase
  .from('projects')
  .update({
    project_state: projectState,
    onboarding_completed: true,
    onboarding_data: stateBasedData,
  })
  .eq('id', project.id);
```

### 6. Mejorar Prompt de AI Task Generator
**Archivo**: `supabase/functions/generate-tasks-v2/index.ts`

**Enriquecer el prompt con contexto de estado**:

```typescript
const systemPrompt = `
Eres un experto en startups y generación de tareas accionables.

CONTEXTO DEL PROYECTO:
- Nombre: ${projectName}
- Estado: ${projectState}
${
  projectState === 'idea'
    ? '- El proyecto está en fase de exploración. Enfócate en validación de problema/solución.'
    : projectState === 'validacion_temprana'
    ? '- El proyecto tiene sus primeros clientes. Enfócate en product-market fit y retención.'
    : projectState === 'traccion'
    ? '- El proyecto está en crecimiento. Enfócate en escalar, optimizar métricas y operaciones.'
    : '- El proyecto está consolidado. Enfócate en expansión, optimización y estrategia.'
}

Onboarding Data: ${JSON.stringify(onboardingData)}

INSTRUCCIONES:
- Genera 5 tareas accionables ALINEADAS con el estado del proyecto
- Para proyectos "idea": tareas de validación (entrevistas, MVP, tests)
- Para proyectos "validacion_temprana": tareas de PMF (onboarding, métricas, feedback)
- Para proyectos "traccion": tareas de growth (optimización, canales, procesos)
- Para proyectos "consolidado": tareas estratégicas (expansión, team, partnerships)
- NO sugieras validar el problema si el proyecto ya tiene 50 clientes
`;
```

### 7. Create/Delete Projects UI
**Archivo**: `src/pages/views/ProjectsView.tsx`

**Añadir botones**:
- Botón "+ Nuevo Proyecto"
- Diálogo con wizard que incluya selección de estado
- Botón "Eliminar Proyecto" en settings
- Modal de confirmación con texto "ELIMINAR"

## 📋 Checklist de Implementación

### Paso 1: Aplicar Migration
- [ ] Ir a Supabase Dashboard → SQL Editor
- [ ] Ejecutar `supabase/migrations/20260128_add_project_state.sql`
- [ ] Verificar que el enum se creó correctamente
- [ ] Verificar que la columna `project_state` existe en `projects`

### Paso 2: Actualizar OnboardingWizard
- [ ] Importar nuevos componentes de steps
- [ ] Añadir state management para `projectState`
- [ ] Implementar lógica de routing según estado
- [ ] Implementar renderizado condicional de steps
- [ ] Actualizar función `validateAndSubmit` para guardar `project_state`

### Paso 3: Mejorar Edge Function
- [ ] Abrir `supabase/functions/generate-tasks-v2/index.ts`
- [ ] Añadir `project_state` al contexto del prompt
- [ ] Añadir instrucciones condicionales según el estado
- [ ] Desplegar la función actualizada

### Paso 4: UI de Create/Delete Projects
- [ ] Añadir botón "+ Nuevo Proyecto" en ProjectsView
- [ ] Crear diálogo de creación con wizard
- [ ] Integrar selección de estado en el wizard
- [ ] Añadir botón "Eliminar Proyecto"
- [ ] Implementar confirmación de eliminación

### Paso 5: Testing
- [ ] Crear proyecto nuevo en estado "Idea"
- [ ] Verificar que muestra los steps correctos
- [ ] Completar onboarding y verificar que se guarda `project_state`
- [ ] Generar tareas con IA y verificar que son relevantes al estado
- [ ] Repetir para los otros 3 estados

## 🎨 Flujo de Usuario (UX)

```
1. Usuario crea nuevo proyecto
   ↓
2. Step 0: "¿En qué estado está tu proyecto?"
   → Selecciona: Idea / Validación / Tracción / Consolidado
   ↓
3. Step 1: Selección de Equipo
   (Mismo para todos los estados)
   ↓
4. Steps 2-5: Onboarding específico del estado
   → Idea: Problema → Solución → Hipótesis → Plan
   → Validación: Status → Feedback → PMF → Next Steps
   → Tracción: Metrics → Growth → Ops → Plan
   → Consolidado: Business → Team → GTM → Strategy
   ↓
5. Completa onboarding
   ↓
6. AI Task Generator usa project_state para generar tareas relevantes
   ✓ Proyecto "Idea" → Tareas de validación
   ✓ Proyecto "Consolidado" → Tareas estratégicas
```

## 📊 Impacto Esperado

### Antes (Onboarding genérico)
- ❌ Mismas preguntas para todos los proyectos
- ❌ IA sugiere "validar problema" a proyectos con clientes
- ❌ No alineado con la realidad del proyecto

### Después (Onboarding adaptativo)
- ✅ Preguntas específicas según madurez
- ✅ IA genera tareas contextualizadas
- ✅ Mejor experiencia del usuario
- ✅ Datos más útiles y accionables

## 🚀 Próximos Pasos

1. **INMEDIATO**: Aplicar la migration en Supabase
2. **HOY**: Actualizar OnboardingWizard con routing de estados
3. **HOY**: Mejorar prompt de AI Task Generator
4. **MAÑANA**: Implementar UI de Create/Delete Projects
5. **TESTING**: Probar los 4 flujos de onboarding

## 📝 Notas Técnicas

- Los estados usan un enum en PostgreSQL para garantizar valores válidos
- Los schemas de Zod validan los datos según el estado (ej: ARR mínimo €120k para "consolidado")
- El campo `onboarding_data` (JSONB) almacena datos flexibles por estado
- Compatible con onboarding legacy (validacion/operacion) sin romper nada
- Los componentes de steps están separados por archivo para mejor mantenibilidad

## ⚠️ Consideraciones

- **No romper proyectos existentes**: Los proyectos sin `project_state` se tratarán como 'idea' por defecto
- **Migración gradual**: Permitir que usuarios actualicen su estado desde la UI
- **Edge Function**: Necesita redespliegue tras actualizar el prompt
- **Testing exhaustivo**: Probar TODOS los estados antes de production

---

**Estado del proyecto**: ⚠️ 70% completado - Falta integrar en OnboardingWizard y mejorar Edge Function
