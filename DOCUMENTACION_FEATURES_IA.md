# 🤖 DOCUMENTACIÓN COMPLETA: Features con IA en Nova Hub

---

## 🎉 ✅ MIGRACIÓN A CLAUDE COMPLETADA (2026-01-28)

**TODAS las funciones con IA ahora usan Claude 3.5 Sonnet!**

- ✅ **extract-business-info** → Claude 3.5 Sonnet
- ✅ **generate-playbook** → Claude 3.5 Sonnet (MIGRADO)
- ✅ **generate-tasks-v2** → Claude 3.5 Sonnet (MIGRADO)
- ✅ **generate-role-questions** → Claude 3.5 Sonnet (MIGRADO)
- ✅ **generate-role-questions-v2** → Claude 3.5 Sonnet (MIGRADO)
- ✅ **generate-task-completion-questions** → Claude 3.5 Sonnet (MIGRADO)

**Ver detalles de la migración**: `MIGRACION_A_CLAUDE_COMPLETADA.md`

---

## 📋 RESUMEN EJECUTIVO

**Total de Edge Functions revisadas**: 9
**Functions que usan IA**: 6
**Functions sin IA**: 3

### API Keys Utilizadas:
- **ANTHROPIC_API_KEY** (Claude 3.5 Sonnet): 6 funciones ✅ (100%)
- **LOVABLE_API_KEY** (Gemini): 0 funciones (obsoleto, puede eliminarse)

---

## 🔍 ANÁLISIS DETALLADO POR FUNCIÓN

### 1. ✅ **extract-business-info** (Claude 3.5 Sonnet)
**Ubicación**: `supabase/functions/extract-business-info/index.ts`
**API Key**: `ANTHROPIC_API_KEY` ✅
**Modelo**: `claude-3-5-sonnet-20241022`
**Endpoint**: `https://api.anthropic.com/v1/messages`

**Qué hace**:
- Extrae información de negocio desde URLs proporcionadas
- Analiza páginas web para obtener: problema que resuelve, cliente objetivo, solución, hipótesis
- Se usa durante el onboarding del proyecto para autocompletar datos

**Llamada en Frontend**:
- Hook: `useAIOnboarding.ts`
- Componente: Wizard de creación de proyectos

**Datos que requiere**:
```typescript
{
  url: string,
  project_phase: string,
  context_type: string
}
```

**Ejemplo de uso**:
```typescript
const { data, error } = await supabase.functions.invoke('extract-business-info', {
  body: { url: 'https://startup.com', project_phase: 'idea', context_type: 'business' }
});
```

---

### 2. ⚠️ **generate-playbook** (Gemini 2.5 Flash)
**Ubicación**: `supabase/functions/generate-playbook/index.ts`
**API Key**: `LOVABLE_API_KEY` ⚠️
**Modelo**: `google/gemini-2.5-flash`
**Endpoint**: `https://ai.lovable.dev/v1/chat/completions`

**Qué hace**:
- Genera playbooks personalizados basados en el desempeño del usuario en su rol
- Analiza tareas completadas, OBVs, insights previos
- Produce guía paso a paso con recursos y herramientas

**Datos que analiza**:
- Rol actual del usuario
- Tareas completadas vs pendientes
- OBVs validadas
- Fase del proyecto
- Insights previos del usuario

**Respuesta esperada**:
```json
{
  "playbook": {
    "titulo": "string",
    "resumen": "string",
    "pasos": [...],
    "herramientas": [...],
    "recursos": [...]
  }
}
```

---

### 3. ⚠️ **generate-tasks-v2** (Gemini 2.5 Flash)
**Ubicación**: `supabase/functions/generate-tasks-v2/index.ts`
**API Key**: `LOVABLE_API_KEY` ⚠️
**Modelo**: `google/gemini-2.5-flash`
**Endpoint**: `https://ai.lovable.dev/v1/chat/completions`

**Qué hace**:
- Genera tareas personalizadas para cada miembro del equipo
- 1 tarea por miembro, adaptada a su rol y contexto del proyecto
- Incluye playbooks completos de ejecución

**Contexto que analiza**:
```typescript
{
  project: { nombre, descripcion, fase, tipo, project_state },
  onboarding: { problema, cliente_objetivo, solucion, hipotesis, metricas },
  team: [{ nombre, role, tareas_completadas, obvs_validadas }],
  metrics: { obvs_total, leads_total, tareas_pendientes },
  history: { ultimas_obvs, ultimos_leads }
}
```

**Características especiales**:
- Genera tareas según **estado del proyecto** (idea, validacion_temprana, traccion, consolidado)
- Cada tarea incluye playbook con: preparación, pasos detallados, herramientas, recursos, checklist

**Ejemplo de tarea generada**:
```json
{
  "assignee_nombre": "María",
  "titulo": "Realizar 10 entrevistas de validación con clientes potenciales",
  "tipo_tarea": "validacion",
  "prioridad": 1,
  "tiempo_estimado_horas": 8,
  "playbook": {
    "pasos": [...],
    "herramientas": [...],
    "checklist_final": [...]
  }
}
```

---

### 4. ❌ **generate-project-roles** (SIN IA)
**Ubicación**: `supabase/functions/generate-project-roles/index.ts`
**API Key**: Ninguna
**Tipo**: Algoritmo basado en reglas

**Qué hace**:
- Asigna roles a miembros del proyecto basándose en:
  - Roles previos (intenta asignar roles nuevos para rotar experiencia)
  - Zarko siempre recibe rol 'ai_tech'
  - Rotación inteligente para que todos experimenten diferentes roles

**NO requiere IA** - es lógica programática.

---

### 5. ⚠️ **generate-role-questions** (Gemini 3 Flash Preview)
**Ubicación**: `supabase/functions/generate-role-questions/index.ts`
**API Key**: `LOVABLE_API_KEY` ⚠️
**Modelo**: `google/gemini-3-flash-preview`
**Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`

**Qué hace**:
- Genera 5 preguntas para reuniones de rol
- Preguntas ayudan a compartir aprendizajes entre proyectos
- Basadas en el rol específico y miembros que lo tienen

**Entrada**:
```typescript
{
  role: {
    roleLabel: string,
    roleDescription: string,
    members: [{ nombre, projectName }]
  }
}
```

**Salida**:
```json
{
  "questions": [
    {
      "pregunta": "...",
      "objetivo": "qué busca explorar esta pregunta"
    }
  ]
}
```

---

### 6. ⚠️ **generate-role-questions-v2** (Gemini 2.5 Flash)
**Ubicación**: `supabase/functions/generate-role-questions-v2/index.ts`
**API Key**: `LOVABLE_API_KEY` ⚠️
**Modelo**: `google/gemini-2.5-flash`
**Endpoint**: `https://ai.lovable.dev/v1/chat/completions`

**Qué hace**:
- Versión mejorada de generate-role-questions
- Genera preguntas **con guías de facilitación completas**
- Incluye agenda sugerida para la reunión
- Analiza métricas reales de cada miembro (tareas, OBVs, insights)

**Contexto completo por miembro**:
```typescript
{
  nombre: string,
  project_nombre: string,
  project_fase: string,
  tareas_completadas_semana: number,
  tareas_pendientes: number,
  obvs_mes: number,
  ultimas_tareas: [{ titulo, completada }],
  insights: [{ tipo, titulo }]
}
```

**Categorías de preguntas**:
- RESULTADOS: Celebrar victorias
- APRENDIZAJES: Compartir descubrimientos
- DESAFIOS: Exponer bloqueos
- COLABORACION: Sinergias entre proyectos
- MEJORA_CONTINUA: Optimizaciones

**Respuesta incluye**:
```json
{
  "questions": [{
    "pregunta": "...",
    "categoria": "resultados|aprendizajes|...",
    "prioridad": 1-3,
    "tiempo_sugerido_minutos": number,
    "guia": {
      "objetivo_de_la_pregunta": "...",
      "como_introducirla": "...",
      "preguntas_de_seguimiento": [...],
      "dinamica_sugerida": {...},
      "accion_resultante": "..."
    }
  }],
  "agenda_sugerida": {
    "apertura": "...",
    "desarrollo": "...",
    "cierre": "..."
  }
}
```

---

### 7. ⚠️ **generate-task-completion-questions** (Gemini 2.5 Flash)
**Ubicación**: `supabase/functions/generate-task-completion-questions/index.ts`
**API Key**: `LOVABLE_API_KEY` ⚠️
**Modelo**: `google/gemini-2.5-flash`
**Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`

**Qué hace**:
- Genera 2-3 preguntas de reflexión cuando un usuario completa una tarea
- Extrae aprendizajes y mejoras para el futuro
- Personalizado según el tipo de tarea completada

**Entrada**:
```typescript
{
  task: {
    titulo: string,
    descripcion: string,
    metadata: {
      tipo_tarea: string,
      resultado_esperado: string
    }
  }
}
```

**Fallback**: Si la IA falla, devuelve preguntas genéricas predefinidas.

---

## 🔄 CONVERSACIONES ENTRE ROLES (Role Meetings)

### ¿Qué son las Reuniones de Rol?
**Ubicación Frontend**: `src/pages/views/RolesMeetingView.tsx`
**Tablas DB**: `role_meetings`, `role_meeting_insights`

**Concepto**:
- Todos los miembros con el **mismo rol** de **diferentes proyectos** se reúnen
- Objetivo: Compartir aprendizajes, mejores prácticas, desafíos comunes
- Ejemplo: Todos los "Customer (Ventas)" de todos los proyectos en una reunión

**Cómo funcionan**:
1. Se crea un `role_meeting` para un rol específico en una fecha
2. La IA genera preguntas usando `generate-role-questions` o `generate-role-questions-v2`
3. Durante la reunión, cada miembro comparte insights
4. Los insights se guardan en `role_meeting_insights`

**Datos que se capturan**:
```typescript
role_meetings: {
  id: uuid,
  role: enum (sales, finance, ai_tech, etc.),
  fecha: date,
  ai_questions: json // preguntas generadas por IA
}

role_meeting_insights: {
  id: uuid,
  meeting_id: uuid, // FK a role_meetings
  member_id: uuid,
  project_id: uuid,
  tipo: string, // tipo de insight
  insight: string // el contenido del aprendizaje
}
```

**Flujo completo**:
```
1. Usuario click en "Preguntas IA" para un rol
   ↓
2. Frontend llama a generate-role-questions-v2
   ↓
3. IA analiza todos los miembros con ese rol
   ↓
4. IA genera 5 preguntas categorizadas con guías
   ↓
5. Se crea el role_meeting con ai_questions
   ↓
6. Durante reunión, miembros responden y comparten
   ↓
7. Se guardan role_meeting_insights
```

---

## ✅ TAREAS PENDIENTES

### 1. Migrar todas las funciones a Claude (Anthropic)
**Actualmente**: Solo `extract-business-info` usa Claude
**Objetivo**: Todas las 6 funciones con IA deberían usar Claude 3.5 Sonnet

**Beneficios**:
- ✅ Mayor calidad de respuestas
- ✅ Mejor contexto y razonamiento
- ✅ Respuestas en español más naturales
- ✅ Consistencia en toda la plataforma

**Cambios necesarios por función**:

#### A. generate-playbook
```typescript
// ANTES
const response = await fetch('https://ai.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [...]
  })
});

// DESPUÉS
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [...]
  })
});
```

#### B. generate-tasks-v2
- Cambiar endpoint y headers (igual que arriba)
- Ajustar `max_tokens` de 8000 a límite de Claude
- Mantener estructura de prompts (Claude soporta mismo formato)

#### C. generate-role-questions
- Eliminar `tools` y `tool_choice` (no necesario con Claude)
- Claude responde directamente en JSON si se le pide

#### D. generate-role-questions-v2
- Mismo proceso que generate-role-questions

#### E. generate-task-completion-questions
- Cambios mínimos, solo endpoint y headers

### 2. Verificar "Cómo Funciona" en todas las secciones
**Ubicación**: `src/data/helpContent.ts`
**Objetivo**: Asegurar que TODAS las secciones tienen explicación completa

**Secciones a verificar**:
```typescript
export const HELP_CONTENT = {
  'roles-meeting': { ... }, // ✅ Ya existe
  'tasks': { ... },
  'obvs': { ... },
  'leads': { ... },
  'kpis': { ... },
  'team': { ... },
  'finance': { ... },
  'playbooks': { ... },
  // ... verificar todas
}
```

---

## 📊 COMPARATIVA: LOVABLE (Gemini) vs ANTHROPIC (Claude)

| Aspecto | Gemini (actual) | Claude (propuesto) |
|---------|-----------------|-------------------|
| **Calidad respuestas** | ⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente |
| **Español nativo** | ⭐⭐⭐ Bueno | ⭐⭐⭐⭐⭐ Nativo |
| **Razonamiento** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ Superior |
| **Contexto largo** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ Mejor |
| **JSON estructurado** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ Perfecto |
| **Costo** | 💰 Económico | 💰💰 Medio |
| **Velocidad** | ⚡⚡⚡ Rápido | ⚡⚡ Medio |

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Migración a Claude (2-3 horas)
1. **Crear función helper compartida** para llamadas a Claude
   ```typescript
   // supabase/functions/_shared/anthropic-client.ts
   export async function callClaude(systemPrompt, userPrompt, maxTokens = 4096) {
     const ANTHROPIC_API_KEY = requireEnv('ANTHROPIC_API_KEY');
     const response = await fetch('https://api.anthropic.com/v1/messages', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'x-api-key': ANTHROPIC_API_KEY,
         'anthropic-version': '2023-06-01',
       },
       body: JSON.stringify({
         model: 'claude-3-5-sonnet-20241022',
         max_tokens: maxTokens,
         messages: [
           { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
         ]
       })
     });

     if (!response.ok) {
       throw new Error(`Claude API error: ${response.status}`);
     }

     const data = await response.json();
     return data.content[0].text;
   }
   ```

2. **Migrar funciones una por una**:
   - ✅ extract-business-info (ya usa Claude)
   - [ ] generate-playbook
   - [ ] generate-tasks-v2
   - [ ] generate-role-questions
   - [ ] generate-role-questions-v2
   - [ ] generate-task-completion-questions

3. **Probar cada función** después de migrar

### Fase 2: Verificar documentación (1 hora)
1. Auditar `helpContent.ts`
2. Agregar secciones faltantes
3. Asegurar que cada feature tiene:
   - Título claro
   - Descripción de qué hace
   - Cómo se usa
   - Ejemplo visual o caso de uso

### Fase 3: Testing y validación (1 hora)
1. Probar cada feature con IA
2. Verificar respuestas en español
3. Validar formato JSON
4. Confirmar que rate limiting funciona

---

## ⚠️ NOTAS IMPORTANTES

1. **ANTHROPIC_API_KEY ya está configurado** en Supabase Secrets ✅
2. **LOVABLE_API_KEY puede ser eliminado** después de la migración
3. **Rate limiting** ya está implementado para todas las funciones (15 requests/hora)
4. **Costos estimados**: Claude es ~2-3x más caro que Gemini, pero la calidad lo justifica
5. **Compatibilidad**: Todos los prompts actuales funcionan con Claude sin cambios mayores

---

## 📝 RESUMEN

**Estado actual**:
- 6 funciones con IA
- 1 usa Claude ✅ (extract-business-info)
- 5 usan Gemini ⚠️ (todas las demás)

**Objetivo**:
- ✅ Migrar todas a Claude 3.5 Sonnet (ANTHROPIC_API_KEY)
- ✅ Verificar documentación completa en todas las secciones
- ✅ Testing exhaustivo

**Tiempo estimado total**: 4-5 horas

**Prioridad**: ALTA - Mejorar calidad de respuestas IA en toda la plataforma

---

**Fecha de creación**: 2026-01-28
**Revisado por**: Claude Sonnet 4.5
**Última actualización**: 2026-01-28
