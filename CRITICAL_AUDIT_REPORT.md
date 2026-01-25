# 🔴 CRITICAL CODEBASE AUDIT REPORT - Nova Hub

**Fecha:** 2026-01-25
**Evaluación General:** 6.8/10 (Mejoró de 5.2/10, pero aún hay problemas críticos)
**Prioridad:** ACCIÓN INMEDIATA REQUERIDA

---

## 🚨 CRITICAL ISSUES (4) - FIX IMMEDIATELY

### 1. Race Condition en useAuth Hook
**Severidad:** CRÍTICA 🔴  
**Archivo:** `src/hooks/useAuth.ts:21-83`  
**Riesgo:** Estado de autenticación inconsistente, usuarios pueden ver datos incorrectos

**Problema:**
```typescript
// sessionChecked puede establecerse antes que el listener reciba eventos
supabase.auth.getSession().then(({ data: { session } }) => {
  sessionChecked = true;  // RACE CONDITION
  setLoading(false);
});
```

**Impacto:** Loading infinito, autenticación fallida, datos de usuario incorrectos

---

### 2. .single() Sin Manejo de Errores Adecuado  
**Severidad:** CRÍTICA 🔴  
**Archivos:** 27 instancias en repositories  
**Riesgo:** Crashes cuando no se encuentra un registro

**Problema:**
```typescript
// LeadRepository.ts:18 - Falla si el lead no existe
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('id', id)
  .single();  // Lanza excepción si no hay resultados

if (error) throw error;  // Error genérico, sin contexto
```

**Impacto:** Errores 500, aplicación crashea, experiencia de usuario rota

---

### 3. Optimistic Updates Sin Rollback Garantizado
**Severidad:** CRÍTICA 🔴  
**Archivos:** `useCRMPipeline.ts:99-120`, `useTaskKanban.ts:77-96`  
**Riesgo:** Datos fantasma en UI, inconsistencias de estado

**Problema:**
```typescript
// Actualización optimista
queryClient.setQueryData(['pipeline_global'], (old) =>
  old?.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
);

try {
  await leadService.updateStatus(...);
} catch (error) {
  // Solo invalida - NO garantiza rollback al estado anterior
  queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
}
```

**Impacto:** Usuario ve cambios que no se guardaron, confusión total

---

### 4. RLS Policy Permite Modificaciones No Autorizadas
**Severidad:** CRÍTICA 🔴  
**Archivo:** `supabase/migrations/20260121034436_*.sql:369-389`  
**Riesgo:** Cualquier miembro del proyecto puede modificar CUALQUIER lead

**Problema:**
```sql
FOR UPDATE TO authenticated USING (
  -- CUALQUIER miembro puede actualizar CUALQUIER lead del proyecto
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = leads.project_id 
    AND pm.member_id = public.get_profile_id(auth.uid())
  )
);
```

**Impacto:** Violación de seguridad, modificaciones no autorizadas

---

## ⚠️ HIGH SEVERITY ISSUES (5) - FIX THIS WEEK

### 5. useState Mal Usado en TaskCompletionDialog
**Severidad:** ALTA 🟠  
**Archivo:** `src/components/tasks/TaskCompletionDialog.tsx:88`  
**Problema:** Código que nunca se ejecuta

```typescript
// ESTO NO HACE NADA - useState NO ejecuta funciones
useState(() => {
  if (open && aiQuestions.length === 0) {
    generateAIQuestions();  // NUNCA SE LLAMA
  }
});
```

**Fix:** Cambiar a `useEffect`

---

### 6. Type Assertions Sin Validación Runtime
**Severidad:** ALTA 🟠  
**Archivos:** `EvidenceUrlInput.tsx:77-78`, `RolesMeetingView.tsx:50-51`

**Problema:**
```typescript
<span>{getDriveTypeIcon(urlInfo!.type)}</span>  // Puede crashear
```

**Impacto:** Runtime crashes, pantalla blanca

---

### 7. Error en Fetch de Profile Sin Retry
**Severidad:** ALTA 🟠  
**Archivo:** `src/hooks/useAuth.ts:25-41`

**Problema:** Usuario autenticado pero sin perfil = funciones rotas

---

### 8. Lead UPDATE RLS Demasiado Permisivo
**Severidad:** ALTA 🟠  
**Archivo:** RLS policies

**Problema:** Cualquier miembro puede actualizar leads de otros

---

### 9. Metadata/Playbook Sin Validación
**Severidad:** ALTA 🟠  
**Archivo:** `TaskCompletionDialog.tsx:59-85`

**Problema:** Datos sin tipo enviados a funciones AI

---

## 📊 MEDIUM SEVERITY ISSUES (16)

### Componentes Grandes (Still God Objects)
- `OnboardingWizard.tsx` - 351 líneas
- `OBVValidationList.tsx` - 338 líneas

### Parsing Sin Validación
- `parseFloat()` sin validar = NaN en BD
- `parseInt()` sin validar = Infinity posible

### LocalStorage Sin Try-Catch
- JSON.parse puede fallar silenciosamente

### RLS Incompleto
- `lead_history` visible para TODOS

### Sin Retry Logic
- Solo 1 reintento, sin backoff exponencial

### N+1 Query Patterns
- Algunas queries ineficientes

### Sin Paginación
- Hard-coded `.limit(20)`

### Type Casting a `any`
- 33 instancias en tests

### Console Logs en Producción
- 27 archivos con console.error/log

### Error Handling Inconsistente
- Algunos componentes tienen try-catch, otros no

### Missing Accessibility
- ARIA labels faltantes

### CORS Sin Validación Estricta
- Header Origin sin whitelist estricto

### Rate Limiting En Memoria
- Fácil de bypassear con múltiples instancias

### Sin Índices en Foreign Keys
- `leads.project_id`, `obvs.owner_id`, etc.

### Sin Audit Logging
- Tabla existe pero nunca se usa

### Sin Documentación Arquitectura
- No hay README de arquitectura

---

## 🔢 SEVERITY SUMMARY

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 CRÍTICA | 4 | REQUIERE ACCIÓN INMEDIATA |
| 🟠 ALTA | 5 | ARREGLAR ESTA SEMANA |
| 🟡 MEDIA | 16 | ARREGLAR ESTE MES |
| 🟢 BAJA | 5 | BACKLOG |
| **TOTAL** | **30** | **30 problemas identificados** |

---

## 📈 METRICS COMPARISON

| Métrica | Antes Refactor | Después Refactor | Post-Audit |
|---------|----------------|------------------|------------|
| **Calidad General** | 5.2/10 | 8.5/10 | 6.8/10 ⬇️ |
| **Seguridad** | 4/10 | 7/10 | 5/10 ⬇️ |
| **Bugs Críticos** | 20+ | 0 | 4 ⬆️ |
| **Arquitectura** | 3/10 | 9/10 | 9/10 ✅ |
| **Testing** | 50% | 50% | 50% ❌ |

**Nota:** La calidad bajó post-audit porque se descubrieron problemas que no se detectaron en el refactor inicial.

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### FASE CRÍTICA (HOY - 24h)
1. ✅ Fix useAuth race condition
2. ✅ Fix .single() error handling en repositories
3. ✅ Fix optimistic update rollback
4. ✅ Fix RLS policies para leads

### FASE ALTA (Esta Semana)
5. Fix useState bug en TaskCompletionDialog
6. Agregar runtime checks para type assertions
7. Implementar retry logic en profile fetch
8. Validar metadata/playbook antes de enviar a AI

### FASE MEDIA (Este Mes)
9. Refactorizar OnboardingWizard y OBVValidationList
10. Agregar validación de parsing
11. Implementar RLS completo
12. Agregar índices a BD
13. Estandarizar error handling
14. Implementar audit logging

---

## 🏆 RECOMENDACIONES FINALES

**Para alcanzar 9.0/10:**
1. Arreglar TODOS los problemas críticos (4)
2. Arreglar TODOS los problemas altos (5)
3. Implementar tests E2E
4. Agregar monitoring de errores (Sentry)
5. Implementar rate limiting persistente
6. Agregar paginación a todas las listas
7. Mejorar accessibility (WCAG AA)
8. Documentar arquitectura

**Esfuerzo Estimado:**
- Críticos: 2-3 días
- Altos: 1 semana
- Medios: 2-3 semanas
- **Total: ~1 mes** para llegar a 9.0/10

---

**Estado Actual:** ⚠️ PRODUCCIÓN CON RIESGOS  
**Estado Objetivo:** ✅ PRODUCCIÓN SEGURA Y ROBUSTA  
**Tiempo Estimado:** 4 semanas de trabajo enfocado

