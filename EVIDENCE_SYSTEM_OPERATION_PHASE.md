# 🔬 EVIDENCE SYSTEM - OPERATION PHASE

## 🎯 CAMBIO DE FASE RECONOCIDO

### ❌ Fase Anterior (Diseño)
```
Diseñar → Optimizar → Más features → Más métricas
```

**Problema:** Complejidad acumulada sin validación real.

### ✅ Fase Actual (Operación)
```
Instrumentar → Medir → Ajustar con datos reales
```

**Objetivo:** Comportamiento real bajo carga real.

---

## 🚫 LO QUE NO HACEMOS

**STOP BUILDING:**
- ❌ Más perfiles
- ❌ Más métricas en el contrato
- ❌ Más heurísticas
- ❌ Más optimizaciones especulativas

**Razón:** El riesgo NO es diseño. Es complejidad sin validación.

---

## ✅ PRIORIDADES ABSOLUTAS (EN ORDEN)

### 1️⃣ Instrumentación Real (COMPLETADO ✅)

**Archivo:** `src/lib/evidence/instrumentation.ts`

**Qué hace:**
- Log estructurado de cada generación
- Persiste en DB (tabla `evidence_generation_metrics`)
- Métricas automáticas: latency, retrieval, coverage, waste, user behavior
- Cálculo de percentiles (p50, p95)
- Detección de comportamiento de usuario

**Métricas críticas:**
```typescript
{
  total_latency_ms,
  retrieval_time_ms,
  sources_found,
  sources_cited,
  citation_utilization,
  evidence_status,
  timeout_occurred,
  user_changed_mode,      // ⚠️ CRÍTICO
  user_opened_report,     // ⚠️ CRÍTICO
  user_regenerated,       // ⚠️ CRÍTICO
}
```

**Schema SQL:** Incluido en el archivo.

**Action item:**
- [ ] Crear migration para `evidence_generation_metrics`
- [ ] Integrar `logEvidenceGeneration()` en cada feature
- [ ] Verificar que datos se persisten correctamente

---

### 2️⃣ Timeout Handling (COMPLETADO ✅)

**Archivo:** `src/lib/evidence/timeout-handler.ts`

**Qué hace:**
- Hard cap global: 40s absoluto
- Soft caps por tier (3-10s dependiendo de tier)
- AbortController real (no Promise.race)
- Early exit si tier timeout
- Logging explícito de qué tier falló
- NUNCA bloquear respuesta final

**Reglas:**
```typescript
// Si tier timeout:
- Continuar con siguiente tier
- evidence_status baja (verified → partial → no_evidence)
- NUNCA success: false

// Si global timeout (40s):
- Cortar retrieval inmediatamente
- Devolver sources encontrados hasta ese momento
- success: true, evidence_status: 'partial' o 'no_evidence'
```

**Action item:**
- [ ] Integrar `multiTierRetrieval()` en edge functions
- [ ] Testear con API mock lenta (20s delay)
- [ ] Validar que timeout NO rompe generación

---

### 3️⃣ El Test Real (PENDIENTE ⏳)

**NO es p95.**

**ES comportamiento de usuario:**

#### Test 1: ¿Fricción?
```sql
SELECT
  COUNT(*) FILTER (WHERE user_changed_mode = true) * 100.0 / COUNT(*) AS switched_rate
FROM evidence_generation_metrics
WHERE mode = 'hypothesis';
```

**Red flag:** `switched_rate > 30%` → Usuarios huyen de evidence system.

**Acción:** Revisar defaults. Quizás `balanced` es too much.

---

#### Test 2: ¿Defaults mal calibrados?
```sql
SELECT
  COUNT(*) FILTER (WHERE user_regenerated = true) * 100.0 / COUNT(*) AS regen_rate
FROM evidence_generation_metrics;
```

**Red flag:** `regen_rate > 20%` → Evidencia insuficiente frecuentemente.

**Acción:** Bajar minSourcesOverall o mejorar retrieval.

---

#### Test 3: ¿Sobre-ingenierización?
```sql
SELECT
  COUNT(*) FILTER (WHERE user_opened_report = false) * 100.0 / COUNT(*) AS ignored_rate
FROM evidence_generation_metrics;
```

**Red flag:** `ignored_rate > 70%` → Nadie lee el report.

**Acción:** Simplificar UI o eliminar report (waste de desarrollo).

---

## ⚠️ Riesgo Real: UX Psicológico

### Pregunta Mental

**Un founder quiere generar tareas rápido.**

¿Siente que el sistema lo está:
- ✅ Ayudando (dándole confianza con fuentes)?
- ❌ Auditando (forzándolo a esperar, ser riguroso)?

**El equilibrio es delicado.**

### Síntomas de Fricción

| Síntoma | Significado | Acción |
|---------|-------------|--------|
| Usuarios cambian a hypothesis | Sistema too serious para tareas simples | Hacer hypothesis default para tasks |
| Usuarios cierran modal de evidencia | Pre-modal es molesto | Hacerlo opcional, mostrar solo en strict |
| Usuarios ignoran report | Sobre-ingenierizado | Simplificar o eliminar |
| Generación > 5s percibida como lenta | Fatiga cognitiva | Reducir tiers o hacer retrieval async |

---

## 📊 Dashboard de Métricas (TO BUILD)

**Prioridad:** Después de tener datos (1 semana de producción).

**Queries clave:**

### 1. Performance por Feature
```sql
SELECT
  feature,
  mode,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_latency_ms) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms) AS p95
FROM evidence_generation_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY feature, mode
ORDER BY feature, mode;
```

### 2. Waste Rate
```sql
SELECT
  feature,
  COUNT(*) FILTER (WHERE waste_type != 'none') * 100.0 / COUNT(*) AS waste_rate
FROM evidence_generation_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY feature
HAVING waste_rate > 20
ORDER BY waste_rate DESC;
```

### 3. User Behavior (EL MÁS IMPORTANTE)
```sql
SELECT
  feature,
  COUNT(*) AS total,
  AVG(CASE WHEN user_changed_mode THEN 1 ELSE 0 END) AS switched_rate,
  AVG(CASE WHEN user_regenerated THEN 1 ELSE 0 END) AS regen_rate,
  AVG(CASE WHEN user_opened_report THEN 1 ELSE 0 END) AS report_open_rate
FROM evidence_generation_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY feature
ORDER BY total DESC;
```

---

## 🔥 Action Items (ESTA SEMANA)

### Día 1-2: Integración de Instrumentación
- [ ] Crear migration para `evidence_generation_metrics`
- [ ] Integrar `logEvidenceGeneration()` en:
  - [ ] AILeadFinder
  - [ ] AITaskGenerator
  - [ ] LearningPathGenerator
  - [ ] OneOnOnePrep
  - [ ] GeoIntelligenceSelector
- [ ] Testear que datos se persisten

### Día 3-4: Integración de Timeout Handling
- [ ] Integrar `multiTierRetrieval()` en edge functions principales:
  - [ ] `ai-lead-finder`
  - [ ] `generate-tasks-v2`
  - [ ] `generate-learning-path`
  - [ ] `geo-intelligence`
- [ ] Testear con API mock lenta
- [ ] Validar que timeout no rompe

### Día 5-7: Medición Real
- [ ] Deploy a staging con instrumentación
- [ ] Ejecutar 50-100 generaciones variadas
- [ ] Analizar queries de métricas
- [ ] Identificar red flags

---

## 🎯 Criterios de Éxito (1 Semana)

**NO es "sistema perfecto".**

**ES:**
1. ✅ Datos fluyendo a DB (instrumentación funciona)
2. ✅ Timeouts no rompen generación (degradación funciona)
3. ✅ Podemos responder:
   - ¿Cuál es el p95 real de cada feature?
   - ¿Cuántos usuarios cambian a hypothesis?
   - ¿Cuántos ignoran el report?
   - ¿Dónde está el waste?

**Con esos datos → Ajustar defaults.**

Sin esos datos → Todo es especulación.

---

## 💡 Insights Esperados (Hipótesis)

Después de medir, probablemente encontraremos:

1. **Tasks:** p95 OK pero `switched_to_hypothesis` alto → Hacer hypothesis default
2. **CRM:** `regen_rate` alto → Bajar minSourcesOverall de 2 a 1
3. **Learning:** `report_ignored_rate` alto → Simplificar UI del report
4. **Financial:** p95 cerca del límite → Reducir web_news del tierOrder

**Pero son solo hipótesis.**

**Los datos dirán la verdad.**

---

## 🚨 Red Flags para Rollback

Si en los primeros 7 días vemos:

1. ❌ p95 > SLA en >50% de features → System too slow
2. ❌ `switched_to_hypothesis` > 40% → Friction too high
3. ❌ Error rate > 5% → Bugs en timeout/degradation
4. ❌ User complaints sobre lentitud > 10% → UX broken

**→ Rollback evidence system, volver a generación sin evidencia.**

**Mejor sin evidence que con bad UX.**

---

## 📝 Lecciones del Cambio de Fase

### Lo que aprendimos:
1. ✅ Diseño sólido NO es suficiente
2. ✅ Complejidad sin validación es riesgo
3. ✅ Métricas de usuario > métricas técnicas
4. ✅ p95 no captura UX psicológico

### Lo que hacemos ahora:
1. ✅ Instrumentar TODO
2. ✅ Medir comportamiento real
3. ✅ Ajustar con datos, no suposiciones
4. ✅ Priorizar UX sobre perfección técnica

**Fase de operación → Data-driven decisions.**
