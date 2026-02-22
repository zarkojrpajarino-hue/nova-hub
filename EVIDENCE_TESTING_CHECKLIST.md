# Evidence System - Testing Checklist

## ✅ Migration Aplicada (COMPLETADO)

Las siguientes tablas están creadas:
- `evidence_generation_metrics`
- `evidence_user_events`

---

## 🧪 Test 1: Verificar Edge Functions Instrumentadas

### Funciones listas para test:
1. ✅ **ai-lead-finder** (profile: 'crm')
2. ✅ **generate-tasks-v2** (profile: 'tasks')

---

## 📝 Plan de Testing

### A. Test Manual desde UI (Recomendado - 5 min)

#### Test de `generate-tasks-v2`:

1. **Abrir la aplicación** en http://localhost:5173 (o tu URL de dev)
2. **Navegar a un proyecto**
3. **Ir a la sección de Tareas**
4. **Buscar el botón de "Generar tareas con IA"** (componente `AITaskGenerator`)
5. **Click en el botón** para generar tareas
6. **Observar**:
   - ✅ La generación debe funcionar normalmente
   - ✅ Debe aparecer el modal de evidence (si está configurado)
   - ✅ Debe recibir respuesta con `generation_id`

#### Test de `ai-lead-finder`:

1. **Navegar a CRM o Leads**
2. **Buscar el botón de "Buscar leads con IA"** (componente `AILeadFinder`)
3. **Click en el botón**
4. **Observar**:
   - ✅ La generación debe funcionar normalmente
   - ✅ Debe recibir respuesta con `generation_id`

---

### B. Verificar datos en Supabase (2 min)

Después de ejecutar las funciones, verifica que los datos llegaron:

#### Query 1: Ver todas las métricas registradas

```sql
SELECT
  id,
  feature,
  profile,
  mode,
  created_at,
  total_latency_ms,
  sources_found,
  evidence_status
FROM evidence_generation_metrics
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:**
- Debes ver 1-2 filas (según cuántas funciones ejecutaste)
- `feature` = 'task_generation' o 'ai_lead_finder'
- `profile` = 'tasks' o 'crm'
- `mode` = 'hypothesis' o 'balanced'
- `total_latency_ms` > 0
- `sources_found` > 0

---

#### Query 2: Ver detalles completos de una generación

```sql
SELECT
  id,
  feature,
  profile,
  mode,
  total_latency_ms,
  retrieval_time_ms,
  generation_time_ms,
  sources_found,
  sources_cited,
  citation_utilization,
  evidence_status,
  timeout_occurred,
  timed_out_tiers,
  tier_durations_ms,
  waste_flag,
  metadata,
  created_at
FROM evidence_generation_metrics
ORDER BY created_at DESC
LIMIT 1;
```

**Validar:**
- ✅ `total_latency_ms` es la suma de retrieval + generation
- ✅ `tier_durations_ms` contiene duración de tiers (JSON)
- ✅ `metadata` contiene información adicional (JSON)
- ✅ `evidence_status` es 'verified', 'partial', o 'no_evidence'
- ✅ `waste_flag` se calculó automáticamente

---

#### Query 3: Verificar que user_id y project_id están correctos

```sql
SELECT
  feature,
  user_id,
  project_id,
  created_at
FROM evidence_generation_metrics
ORDER BY created_at DESC;
```

**Validar:**
- ✅ `user_id` es un UUID válido (debe coincidir con tu usuario)
- ✅ `project_id` es un UUID válido (debe coincidir con tu proyecto)

---

### C. Test Directo via API (Alternativa - 10 min)

Si no tienes la UI corriendo, puedes testear directamente las edge functions:

#### Test `generate-tasks-v2`:

```bash
# Reemplaza con tus valores reales
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-tasks-v2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_UUID",
    "evidence_mode": "balanced"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "tasks": [...],
  "generated": 3,
  "saved": 3,
  "generation_id": "uuid-aqui"
}
```

Nota el `generation_id` - luego búscalo en la BD.

---

#### Test `ai-lead-finder`:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/ai-lead-finder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_UUID",
    "project_id": "YOUR_PROJECT_UUID",
    "search_params": {
      "quantity": 5,
      "industry": "retail"
    },
    "evidence_mode": "balanced"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "suggested_leads": [...],
  "total_found": 10,
  "generation_id": "uuid-aqui"
}
```

---

## ✅ Checklist de Validación

Después de ejecutar los tests, valida:

- [ ] **Edge functions funcionan normalmente** (no hubo errores)
- [ ] **Respuestas incluyen `generation_id`**
- [ ] **Datos aparecen en `evidence_generation_metrics`**
- [ ] **Campos obligatorios están presentes:**
  - [ ] `feature`, `profile`, `mode`
  - [ ] `user_id`, `project_id`
  - [ ] `total_latency_ms`, `retrieval_time_ms`
  - [ ] `sources_found`, `sources_cited`
  - [ ] `evidence_status`
- [ ] **Campos opcionales tienen sentido:**
  - [ ] `tier_durations_ms` es un objeto JSON válido
  - [ ] `metadata` contiene información relevante
  - [ ] `waste_flag` se calculó (true/false)
- [ ] **Latencias son razonables:**
  - [ ] `total_latency_ms` < 40000 (menos de 40 segundos)
  - [ ] `retrieval_time_ms` > 0

---

## 🚨 Problemas Comunes

### Problema 1: "generation_id is null"
**Causa:** Error al insertar en la BD (probablemente RLS policies)
**Solución:** Verificar que service role key está configurado en edge function

### Problema 2: "No rows in evidence_generation_metrics"
**Causa:** El logging falló silenciosamente
**Solución:** Revisar logs de edge function con `supabase functions logs`

### Problema 3: "user_id is null"
**Causa:** No se está pasando el user_id correcto al tracker
**Solución:** Verificar que `authUserId` está definido antes de crear el tracker

---

## 📊 Queries de Análisis (Bonus)

Una vez tengas algunos datos, puedes correr:

### Performance por feature:
```sql
SELECT
  feature,
  profile,
  mode,
  COUNT(*) as total_gens,
  AVG(total_latency_ms)::INTEGER as avg_latency_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER as p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER as p95_ms
FROM evidence_generation_metrics
GROUP BY feature, profile, mode;
```

### Waste rate:
```sql
SELECT
  feature,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE waste_flag = true) as waste_count,
  (COUNT(*) FILTER (WHERE waste_flag = true) * 100.0 / COUNT(*))::NUMERIC(5,2) as waste_rate
FROM evidence_generation_metrics
GROUP BY feature;
```

---

## ✅ Resultado Esperado

Si todo está bien, deberías ver:

1. ✅ **2 filas en `evidence_generation_metrics`** (una por cada función ejecutada)
2. ✅ **Todas las columnas críticas pobladas** (latencias, sources, status)
3. ✅ **Metadata relevante en JSONB** (específico a cada función)
4. ✅ **No errores en logs de edge functions**

**Si todos los checks pasan** → Instrumentación funciona correctamente ✅

**Si hay problemas** → Revisar logs de edge function y validar configuración

---

## 🎯 Siguiente Paso

Una vez validado que las 2 funciones funcionan:
→ Proceder a **Opción 1: Integrar las 4 edge functions restantes**
