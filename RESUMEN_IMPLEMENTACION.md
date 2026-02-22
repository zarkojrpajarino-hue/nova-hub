# 🎯 Resumen: Sistema de Onboarding Adaptativo

## ✅ LO QUE HE COMPLETADO

### 1. Base de Datos ✅
**Archivo**: `supabase/migrations/20260128_add_project_state.sql`
- Enum `project_state` con 4 valores
- Campo `project_state` añadido a tabla `projects`
- Índice para performance

**⚠️ PENDIENTE**: Ejecutar este SQL en Supabase Dashboard

### 2. TypeScript Types ✅
**Archivo**: `src/integrations/supabase/types.ts`
- Enum `project_state` añadido
- Campo `project_state` en interfaces Row/Insert/Update

### 3. Schemas de Validación ✅
**Archivo**: `src/components/onboarding/types.ts`
- 4 schemas Zod (ideaSchema, validacionTempranaSchema, traccionSchema, consolidadoSchema)
- Step definitions para cada estado (IDEA_STEPS, VALIDACION_TEMPRANA_STEPS, etc.)
- Default data para cada estado
- Validaciones específicas por estado (ej: ARR mínimo €120k para consolidado)

### 4. Componentes de UI ✅
**Archivos creados**:
- `steps/StepStateSelection.tsx` - Selección visual de estado (Step 0)
- `steps/IdeaSteps.tsx` - 4 steps para proyectos en exploración
- `steps/ValidationTempranaSteps.tsx` - 4 steps para primeros clientes
- `steps/TraccionSteps.tsx` - 4 steps para crecimiento
- `steps/ConsolidadoSteps.tsx` - 4 steps para empresas establecidas

Total: **1 step de selección + 16 steps específicos por estado** ✅

### 5. Guías de Implementación ✅
**Archivos creados**:
- `IMPLEMENTACION_ONBOARDING_ADAPTATIVO.md` - Overview completo
- `ONBOARDING_WIZARD_UPDATE_GUIDE.md` - Guía paso a paso de cambios en OnboardingWizard

---

## 🔄 LO QUE FALTA POR HACER

### 1. Actualizar OnboardingWizard 🔴 CRÍTICO
**Archivo**: `src/components/onboarding/OnboardingWizard.tsx`
**Guía**: Ver `ONBOARDING_WIZARD_UPDATE_GUIDE.md`

**Cambios necesarios**:
- [ ] Añadir imports de nuevos componentes (8 líneas)
- [ ] Actualizar interface Props (2 líneas)
- [ ] Añadir state management (5 líneas)
- [ ] Añadir helper functions (60 líneas)
- [ ] Actualizar handleNext (15 líneas)
- [ ] Actualizar validateAndSubmit (25 líneas)
- [ ] Añadir render functions (120 líneas)
- [ ] Actualizar render principal (5 líneas)

**Estimación**: 30-45 minutos

### 2. Aplicar Migration en Supabase 🔴 CRÍTICO
**Archivo**: `supabase/migrations/20260128_add_project_state.sql`

**Pasos**:
1. Ir a Supabase Dashboard
2. SQL Editor
3. Copiar y pegar el contenido del archivo
4. Ejecutar
5. Verificar: `SELECT * FROM projects LIMIT 1;` debería mostrar columna `project_state`

**Estimación**: 2 minutos

### 3. Mejorar AI Task Generator 🟡 IMPORTANTE
**Archivo**: `supabase/functions/generate-tasks-v2/index.ts`

**Cambios**:
```typescript
// Línea ~30 - Leer project_state
const { data: projectData } = await supabase
  .from('projects')
  .select('nombre, onboarding_data, project_state') // AÑADIR project_state
  .eq('id', projectId)
  .single();

// Línea ~50 - Enriquecer prompt
const systemPrompt = `
Eres un experto en startups y generación de tareas accionables.

CONTEXTO DEL PROYECTO:
- Nombre: ${projectData.nombre}
- Estado: ${projectData.project_state || 'idea'}

${getStateInstructions(projectData.project_state)}

Onboarding Data: ${JSON.stringify(projectData.onboarding_data)}

[... resto del prompt ...]
`;

// AÑADIR helper function
function getStateInstructions(state: string): string {
  switch (state) {
    case 'idea':
      return `- Proyecto en exploración. Enfócate en VALIDACIÓN de problema/solución.
- Tareas ideales: entrevistas, landing pages, MVPs, experimentos baratos.
- NO sugieras escalar, contratar, o métricas avanzadas.`;

    case 'validacion_temprana':
      return `- Proyecto con primeros clientes (1-10). Enfócate en PRODUCT-MARKET FIT.
- Tareas ideales: onboarding, métricas de retención, feedback loops, iteración rápida.
- NO sugieras expansión o escala prematura.`;

    case 'traccion':
      return `- Proyecto en crecimiento (10-100 clientes). Enfócate en ESCALAR y OPTIMIZAR.
- Tareas ideales: optimizar CAC/LTV, automatizar procesos, mejorar conversión, nuevos canales.
- NO sugieras validación de problema (ya está validado).`;

    case 'consolidado':
      return `- Empresa establecida (100+ clientes). Enfócate en EXPANSIÓN y ESTRATEGIA.
- Tareas ideales: nuevos mercados, partnerships, team building, fundraising, optimización de margen.
- NO sugieras tareas básicas de validación.`;

    default:
      return '- Estado no definido. Genera tareas generales de startup.';
  }
}
```

**Después de cambios**:
```bash
cd supabase/functions/generate-tasks-v2
supabase functions deploy generate-tasks-v2
```

**Estimación**: 15 minutos

### 4. Create/Delete Projects UI 🟢 NICE TO HAVE
**Archivo**: `src/pages/views/ProjectsView.tsx`

**Añadir**:
- Botón "+ Nuevo Proyecto"
- Diálogo de creación que use OnboardingWizard con `useStateBased={true}`
- Botón "Eliminar Proyecto" en settings
- Modal de confirmación con input "ELIMINAR"

**Estimación**: 45-60 minutos

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### DÍA 1 (HOY) - CRÍTICO
1. **[5 min]** Aplicar migration en Supabase Dashboard
2. **[45 min]** Actualizar OnboardingWizard siguiendo la guía
3. **[10 min]** Probar crear proyecto nuevo y verificar que funciona
4. **[15 min]** Actualizar AI Task Generator (Edge Function)
5. **[10 min]** Probar generar tareas y verificar que son contextualizadas

**Total: ~90 minutos**

### DÍA 2 (MAÑANA) - NICE TO HAVE
6. **[60 min]** Implementar Create/Delete Projects UI
7. **[30 min]** Testing exhaustivo de los 4 flujos

**Total: ~90 minutos**

---

## 📋 CHECKLIST FINAL

### Pre-requisitos
- [x] Migration SQL creada
- [x] TypeScript types actualizados
- [x] Schemas Zod definidos
- [x] Componentes de UI creados
- [x] Guías de implementación escritas

### Implementación
- [ ] Migration ejecutada en Supabase
- [ ] OnboardingWizard actualizado
- [ ] Compilación sin errores TypeScript
- [ ] Edge Function actualizada y desplegada

### Testing
- [ ] Crear proyecto estado "Idea" funciona
- [ ] Crear proyecto estado "Validación Temprana" funciona
- [ ] Crear proyecto estado "Tracción" funciona
- [ ] Crear proyecto estado "Consolidado" funciona
- [ ] AI genera tareas relevantes para "Idea"
- [ ] AI genera tareas relevantes para "Consolidado"
- [ ] Proyectos legacy siguen funcionando
- [ ] Edit mode funciona correctamente

### UI/UX
- [ ] Create Projects UI implementada
- [ ] Delete Projects UI implementada
- [ ] Testing end-to-end completo

---

## 🚀 CÓMO PROCEDER

### Opción A: Todo de una vez
```bash
# 1. Aplicar migration (Supabase Dashboard)
# 2. Actualizar OnboardingWizard (seguir guía)
# 3. Probar
npm run dev
# 4. Actualizar Edge Function
cd supabase/functions/generate-tasks-v2
# (hacer cambios)
supabase functions deploy generate-tasks-v2
```

### Opción B: Paso a paso (RECOMENDADO)
```bash
# Paso 1: Migration + Types
# - Ejecutar SQL en Supabase Dashboard
# - Verificar que compile: npm run dev

# Paso 2: OnboardingWizard
# - Aplicar cambios sección por sección de la guía
# - Compilar después de cada sección
# - Probar crear proyecto nuevo

# Paso 3: AI Task Generator
# - Actualizar Edge Function
# - Deploy
# - Probar generar tareas

# Paso 4: Create/Delete UI
# - Implementar UI
# - Probar end-to-end
```

---

## 📊 IMPACTO ESPERADO

### Experiencia del Usuario
```
ANTES:
Usuario crea proyecto "Consolidado con 200 clientes"
  → Onboarding pregunta sobre hipótesis de validación ❌
  → AI sugiere "hacer entrevistas para validar problema" ❌
  → Usuario frustrardo con preguntas irrelevantes ❌

DESPUÉS:
Usuario crea proyecto "Consolidado con 200 clientes"
  → Selecciona estado "Consolidado" ✅
  → Onboarding pregunta sobre ARR, team, GTM strategy ✅
  → AI sugiere "optimizar NRR, explorar nuevo mercado, contratar VP Sales" ✅
  → Usuario satisfecho con recomendaciones relevantes ✅
```

### Calidad de Datos
- Datos más relevantes y accionables por proyecto
- Métricas apropiadas al estado del negocio
- Mejor contexto para IA

### Escalabilidad
- Fácil añadir nuevos estados en el futuro
- Código modular y mantenible
- Backward compatible con proyectos existentes

---

## 🎓 APRENDIZAJES TÉCNICOS

### Arquitectura
- **Onboarding adaptativo** basado en estado
- **Enums en PostgreSQL** para valores válidos
- **JSONB flexible** para datos variados por estado
- **Zod schemas** con validaciones específicas
- **Backward compatibility** mediante flags condicionales

### Mejores Prácticas
- ✅ Separación de concerns (1 archivo por estado)
- ✅ Type safety completo con TypeScript
- ✅ Validación en client y schema
- ✅ Defaults sensibles para cada estado
- ✅ Progressive enhancement (legacy → state-based)

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

**AHORA MISMO**:
1. Lee `ONBOARDING_WIZARD_UPDATE_GUIDE.md` completa
2. Abre `src/components/onboarding/OnboardingWizard.tsx`
3. Aplica los cambios sección por sección
4. Compila después de cada sección: `npm run dev`
5. Cuando compile sin errores, ve a Supabase Dashboard y aplica la migration

**Pregúntame si**:
- Hay errores de TypeScript que no entiendas
- Necesitas ayuda con alguna sección específica
- Quieres que aplique yo los cambios directamente
- Tienes dudas sobre la arquitectura o decisiones de diseño

**¿Quieres que continúe implementando el OnboardingWizard directamente?**

Puedo:
- A) Aplicar todos los cambios del ONBOARDING_WIZARD_UPDATE_GUIDE.md automáticamente
- B) Explicarte alguna parte específica primero
- C) Hacer cambios adicionales que necesites

---

**Estado actual**: 70% completado
**Tiempo estimado para completar**: 90 minutos
**Bloqueador crítico**: OnboardingWizard actualización
**Siguiente paso**: Actualizar `OnboardingWizard.tsx`
