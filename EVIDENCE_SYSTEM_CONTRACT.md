# 📜 EVIDENCE SYSTEM - PRODUCTION CONTRACT

Este documento define el **contrato formal** del Evidence System para considerarlo production-ready.

---

## 🎯 Performance SLA (Service Level Agreement)

### Límites Absolutos por Feature Type

| Feature Type | Evidence Mode | p50 Target | p95 Max | Timeout Max | Status |
|--------------|---------------|-----------|---------|-------------|--------|
| **Tasks** | Hypothesis (default) | < 2s | < 3s | 3s | ⏳ Pending validation |
| **Tasks** | Balanced | < 3s | < 5s | 4s | ⏳ Pending validation |
| **CRM** | Balanced | < 5s | < 7s | 8s | ⏳ Pending validation |
| **Learning** | Balanced | < 8s | < 12s | 15s | ⏳ Pending validation |
| **Team** | Balanced | < 6s | < 10s | 12s | ⏳ Pending validation |
| **GeoIntelligence** | Balanced | < 7s | < 12s | 15s | ⏳ Pending validation |
| **Financial** | Strict | < 15s | < 30s | 35s | ⏳ Pending validation |
| **CRM** | Strict | < 10s | < 20s | 25s | ⏳ Pending validation |
| **Learning** | Strict | < 12s | < 25s | 30s | ⏳ Pending validation |

### Timeout Handling Contract

**Problema:** En producción habrá APIs lentas, rate limits, spikes.

**Solución:** Timeouts estrictos + degradación graceful.

**Comportamiento esperado al expirar timeout:**

```typescript
// Timeout expira durante retrieval
{
  success: true,  // ← Sistema sigue funcionando
  evidence_status: 'partial',  // o 'no_evidence' si no rescató nada
  sources_found: N,  // solo las que alcanzó antes de timeout
  timeout_occurred: true,
  timeout_details: {
    tier: 'official_apis',
    elapsed_ms: 8500,
    limit_ms: 8000
  },
  data: { /* output funcional */ }
}
```

**Reglas de timeout:**

1. **Timeout por tier:** Cada tier tiene timeout individual (2-5s dependiendo de complejidad)
2. **Early exit:** Si un tier timeout, continuar con el siguiente
3. **Never fail:** Timeout NO causa `success: false`
4. **Degradation:** `evidence_status` baja de `verified` → `partial` → `no_evidence`

**Acceptance criteria:**
- ✅ **PASS:** Cumple p50 + p95 + timeout handling testeado
- ⚠️ **WARNING:** Cumple p50 pero falla p95 → Hay outliers, investigar causas
- ❌ **FAIL:** Falla p50 O timeout causa error → **BLOCKER**

**Importante:**
- Medimos percentiles (p50/p95), NO promedios
- Timeout debe probarse simulando APIs lentas (no solo happy path)

---

## 🛡️ Graceful Degradation Contract

### Principio Fundamental
**El Evidence System NUNCA debe romper la funcionalidad core.**

### Separación Crítica: System Health vs Evidence Quality

**IMPORTANTE:** Separar dos conceptos que NO deben mezclarse:

1. **`success`** (boolean) → Salud del **sistema**
   - `true`: El sistema funciona (puede generar output)
   - `false`: Error de sistema (auth failure, storage error, parsing corrupto)

2. **`evidence_status`** (string) → Calidad de la **evidencia**
   - `'verified'`: Evidencias suficientes y relevantes
   - `'partial'`: Algunas evidencias, pero menos de lo ideal
   - `'no_evidence'`: Sin evidencias (hypothesis mode)
   - `'error'`: Error al buscar evidencias (pero output generado)

**Regla de oro:**
```typescript
// ✅ CORRECTO: Falta evidencia pero sistema funciona
{ success: true, evidence_status: 'no_evidence' }

// ❌ INCORRECTO: Confundir falta de evidencia con error de sistema
{ success: false, error: 'No sources found' }  // ← NUNCA hacer esto
```

**Excepción para `success: false`:**

Solo usar cuando hay **error de sistema**, no por falta de evidencia:

| Scenario | success | evidence_status | Justificación |
|----------|---------|-----------------|---------------|
| No encontró sources | `true` | `'no_evidence'` | Sistema funciona, solo falta evidencia |
| API timeout | `true` | `'partial'` o `'error'` | Sistema funciona, retrieval falló |
| Auth failure (Supabase) | `false` | N/A | Sistema roto, no puede funcionar |
| Storage error (DB down) | `false` | N/A | Sistema roto, no puede guardar |
| Parsing corrupto (malformed data) | `false` | N/A | Sistema roto, data inválida |
| User sin permisos | `false` | N/A | Sistema roto, unauthorized |

**Por qué importa:**

Si mezclas errores de sistema con falta de evidencia:
- ❌ Logs se llenan de "errores" que no son bugs
- ❌ Alertas se disparan por falta de sources (falsos positivos)
- ❌ Debugging se vuelve imposible (no sabes si es bug o dato faltante)

### Definición Precisa de Coverage (ANTI-GAMING)

**Problema:** `coverage_percentage` puede inflarse definiendo pocos claims.

**Solución:** Definición formal que no puede manipularse.

#### Fórmula Oficial
```typescript
coverage_percentage = (supported_claims / evidence_required_claims) * 100

where:
  supported_claims = claims with evidence_level >= 'medium'
  evidence_required_claims = claims where requires_evidence === true
```

#### Reglas de Conteo

**1. Solo cuentan claims que REQUIEREN evidencia:**
```typescript
// ✅ Cuenta para coverage
{ claim: "Salarios de developers en Madrid €45-60k", requires_evidence: true }

// ❌ NO cuenta para coverage (es creativo/interno)
{ claim: "Tareas priorizadas por impacto", requires_evidence: false }
```

**2. Niveles de evidencia:**
```typescript
evidence_level = 'strong'   → cuenta como 1.0
evidence_level = 'medium'   → cuenta como 1.0
evidence_level = 'weak'     → cuenta como 0.5  // ← DECIDIDO: 0.5, no 0
evidence_level = 'none'     → cuenta como 0.0
```

**Rationale para weak = 0.5:**
- Penaliza claims débilmente soportados
- Pero da crédito parcial (mejor que nada)
- Incentiva buscar sources más fuertes

#### Ejemplo de Cálculo (No Manipulable)

**Escenario A: Gaming attempt (muchos claims sin requires_evidence)**
```typescript
claims = [
  { text: "Tasks basadas en proyecto", requires_evidence: false },  // ← NO cuenta
  { text: "Tasks basadas en proyecto", requires_evidence: false },  // ← NO cuenta
  { text: "Tasks basadas en proyecto", requires_evidence: false },  // ← NO cuenta
  { text: "Benchmark industria: 2-3 días", requires_evidence: true, level: 'medium' }  // ← Cuenta
]

// Coverage = 1 / 1 = 100% (solo 1 claim requiere evidencia)
// ⚠️ Parece alto, pero es correcto (el único claim factual está soportado)
```

**Escenario B: Legítimo (varios claims factuales)**
```typescript
claims = [
  { text: "Salario dev Madrid €45-60k", requires_evidence: true, level: 'strong' },  // 1.0
  { text: "Cost of living index 72", requires_evidence: true, level: 'medium' },     // 1.0
  { text: "Población Madrid 3.3M", requires_evidence: true, level: 'weak' },         // 0.5
  { text: "Competidores encontrados: 5", requires_evidence: true, level: 'none' }    // 0.0
]

// Coverage = (1.0 + 1.0 + 0.5 + 0.0) / 4 = 62.5%
```

#### Validación Anti-Gaming

Para evitar manipulación, **auditar periódicamente**:

```typescript
// Red flag: Ratio de claims sin requires_evidence muy alto
const creative_ratio = claims.filter(c => !c.requires_evidence).length / claims.length;

if (creative_ratio > 0.80) {
  // ⚠️ Warning: Puede estar evitando claims factuales para inflar coverage
  logWarning('High creative_ratio detected', { feature, creative_ratio });
}
```

**Target healthy ratio:**
- ✅ creative_ratio < 0.70 → Balance normal
- ⚠️ creative_ratio 0.70-0.85 → Revisar si claims están bien clasificados
- ❌ creative_ratio > 0.85 → Posible gaming, auditar manualmente

---

### Contrato por Escenario

#### 1. Fuentes Disponibles (Happy Path)
```typescript
{
  success: true,
  evidence_status: 'verified',
  sources_found: 5,
  coverage_percentage: 80,
  data: { /* output completo */ }
}
```
**UI:** Badge "✓ Verificado" + link a evidence report

#### 2. Fuentes Parciales
```typescript
{
  success: true,
  evidence_status: 'partial',
  sources_found: 1,  // < minSourcesOverall
  coverage_percentage: 30,
  data: { /* output completo */ }
}
```
**UI:** Badge "⚠️ Datos limitados" + botón "Reintentar búsqueda"

#### 3. Sin Fuentes (Hypothesis Mode)
```typescript
{
  success: true,
  evidence_status: 'no_evidence',
  sources_found: 0,
  coverage_percentage: 0,
  data: { /* output completo (qualitative) */ }
}
```
**UI:** Badge "💡 Hipótesis" + botón "🔍 Buscar más evidencia"

**Crítico:** En TODOS los casos, `success: true` y `data` presente.

#### 4. Error en Retrieval (APIs down, timeout)
```typescript
{
  success: true,  // ← No rompe
  evidence_status: 'error',
  sources_found: 0,
  error_details: "Timeout en official_apis",
  data: { /* output sin evidencia externa */ }
}
```
**UI:** Badge "⚠️ Error en búsqueda" + botón "Reintentar" + output funcional

**NUNCA:**
- ❌ Devolver `success: false` si la generación core funcionó
- ❌ Devolver `data: null`
- ❌ Lanzar error que mate la UI
- ❌ Bloquear al usuario sin output

---

## ⚙️ Claim-Based Retrieval (Tasks Profile)

### Problema
Tasks son decisiones **internas**. Buscar evidencia externa por defecto es waste.

### Solución: Activación Condicional (HEURÍSTICA + FALLBACK)

**IMPORTANTE:** La detección automática es una **heurística**, no una regla perfecta.

#### Mecanismo Multi-Layer

**Layer 1: Input Heuristic (rápido, 90% accuracy)**
```typescript
// Detectar keywords en user input
const needsExternalData = /comparado|benchmark|industria|promedio|estándar|competencia|según mercado|vs competidores/.test(userInput);

if (needsExternalData) {
  activateClaim({ requires_evidence: true });
}
```

**Layer 2: Output Analysis (post-generation, 100% accuracy)**
```typescript
// Después de generar, analizar si output incluye números externos
const outputHasQuantitatives = /\d+%|\d+\s*(horas|días|semanas)|promedio de \d+/.test(output);
const outputHasExternalClaims = /según industria|comparado con|benchmark de/.test(output);

if ((outputHasQuantitatives || outputHasExternalClaims) && sources_found === 0) {
  // Marcar claims como "unsupported"
  addWarning({
    type: 'unsupported_quantitative',
    message: 'Output incluye datos cuantitativos sin evidencia externa',
    claims: extractQuantitativeClaims(output)
  });
}
```

**Layer 3: Strict Mode Override**
```typescript
// User cambia a strict en modal
if (evidenceMode === 'strict') {
  activateClaim({ requires_evidence: true });  // Forzado
}
```

#### Fallback Strategy

Si la heurística falla (no detecta en input pero output lo necesita):

1. **En balanced mode:**
   - Generar output sin retrieval
   - Post-análisis detecta quantitatives no soportados
   - Mostrar warning en UI: "⚠️ Datos estimados sin benchmark externo"
   - Botón: "🔍 Buscar evidencias para estos datos"

2. **En strict mode:**
   - Siempre hacer retrieval (no confiar en heurística)

#### Target Metrics

- **90%** de tasks normales → retrieval = 0
- **< 5%** false positives (retrieval activado innecesariamente)
- **< 5%** false negatives (output cuantitativo sin evidencia)

#### Test Cases

| User Input | Output Type | Retrieval Expected | Rationale |
|------------|-------------|-------------------|-----------|
| "Genera tareas para esta semana" | Interno | ❌ NO | Decisión interna |
| "Genera tareas con tiempo promedio de industria" | Cuantitativo externo | ✅ YES | Heuristic detecta "promedio de industria" |
| "Genera tareas comparado con competencia" | Cuantitativo externo | ✅ YES | Heuristic detecta "comparado" |
| "Genera tareas optimizadas" | Interno | ❌ NO (pero check output) | Ambiguo, confiar en post-analysis |

**Importante:** Esto es MVP. En futuro, usar LLM para clasificar intent más precisamente.

---

## 📊 Retrieval Waste Metric (AMPLIADO)

### Definición
**Waste:** Cuando buscas evidencias pero luego no las usas.

Hay **dos tipos de waste:**

1. **Coverage Waste:** Buscaste sources pero coverage es bajo
2. **Citation Waste:** Encontraste sources pero el modelo no las citó

### Fórmulas

#### 1. Coverage Waste (original)
```typescript
coverage_waste = (sources_found > 0 && coverage_percentage < threshold) ? 1 : 0
coverage_waste_rate = sum(coverage_waste) / total_generations
```

**Thresholds:**
- Balanced: coverage >= 30%
- Strict: coverage >= 50%

#### 2. Citation Utilization (NUEVO)
```typescript
citation_utilization = cited_sources / retrieved_sources

// Example:
// Retrieved 10 sources, model cited 2 → utilization = 0.20 (20%)
```

**Target:**
- ✅ utilization >= 0.50 → Retrieval eficiente (mitad de sources se usan)
- ⚠️ utilization 0.25-0.50 → Subóptimo (muchas sources no se citan)
- ❌ utilization < 0.25 → **PROBLEMA** - Prompts no citan O sources irrelevantes

#### 3. Retrieval Cost (NUEVO)
```typescript
avg_retrieval_cost_ms = total_retrieval_time_ms / total_generations
avg_retrieval_calls = total_api_calls / total_generations

// Track per tier:
cost_by_tier = {
  user_docs: { avg_ms: 120, avg_calls: 1 },
  official_apis: { avg_ms: 2400, avg_calls: 3 },
  internal_data: { avg_ms: 80, avg_calls: 1 },
  web_news: { avg_ms: 3200, avg_calls: 5 }
}
```

**Utilidad:** Identificar qué tier es más caro para optimizar.

### Red Flags (AMPLIADO)

| sources_found | coverage_% | cited | utilization | Waste Type | Root Cause | Fix |
|---------------|------------|-------|-------------|------------|------------|-----|
| 10 | 0% | 0 | 0.00 | ✅✅ BOTH | Prompts no citan | Forzar citación en prompt |
| 8 | 15% | 1 | 0.12 | ✅✅ BOTH | Model ignora sources | Revisar prompt + sources relevancia |
| 5 | 60% | 2 | 0.40 | ⚠️ Citation | Sources parcialmente útiles | Mejorar queryHints |
| 3 | 80% | 3 | 1.00 | ❌ NONE | Perfecto | - |
| 0 | 0% | 0 | N/A | ❌ NONE | Hypothesis mode | Expected |

### Target Metrics (CONSOLIDADO)

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| **coverage_waste_rate** | < 20% | 20-40% | > 40% |
| **citation_utilization** | >= 0.50 | 0.25-0.50 | < 0.25 |
| **avg_retrieval_cost_ms** | < 2000ms | 2000-4000ms | > 4000ms |

### Diagnóstico por Síntoma

**Síntoma 1:** coverage_waste alto + utilization bajo
- **Causa:** Sources irrelevantes O prompts no citan
- **Fix:** Ajustar queryHints/synonyms + mejorar prompt

**Síntoma 2:** coverage_waste bajo + utilization bajo
- **Causa:** Model encuentra sources pero solo cita pocas
- **Fix:** Prompt forzar "cita al menos N sources"

**Síntoma 3:** retrieval_cost alto + utilization bajo
- **Causa:** Buscando en tiers caros sin ROI
- **Fix:** Eliminar tiers costosos (ej: web_news) del tierOrder

**Importante:** Si waste_rate > 40% O utilization < 0.25, mejor **apagar retrieval** que malgastar recursos.

---

## ✅ Production Readiness Checklist

### Fase 1: Medición (OBLIGATORIO)
- [ ] Benchmarks de performance ejecutados (20 runs por feature)
- [ ] Percentiles calculados (p50, p95) para cada modo
- [ ] Comparación vs SLA documentada
- [ ] Retrieval waste medido
- [ ] Graceful degradation testeado (ciudades pequeñas, APIs down)

### Fase 2: Validación (BLOCKER si falla)
- [ ] Todas las features cumplen p50 target
- [ ] p95 no supera max (outliers controlados)
- [ ] waste_rate < 40% en todos los profiles
- [ ] GeoIntelligence funciona con 5 ciudades test (2 grandes, 3 pequeñas)
- [ ] Error scenarios no rompen UI (APIs down, timeout, sin datos)

### Fase 3: Optimización (Si es necesario)
- [ ] Features que fallan p95 → Reducir tierOrder
- [ ] Features con waste alto → Ajustar queryHints
- [ ] Profiles con retrieval innecesario → Cambiar a hypothesis default
- [ ] Timeouts implementados por tier (5s max cada uno)

### Fase 4: Monitoreo (Post-deploy)
- [ ] Dashboard de analytics configurado
- [ ] Alertas de p95 > threshold
- [ ] Alertas de waste_rate > 30%
- [ ] User feedback sobre "útil vs molesto" recolectado

---

## 🚪 Production Readiness Gate (PASS/FAIL)

### Criterios Duros para Deploy

Este es el **acceptance gate** final. Debe cumplirse **TODO** para considerar production-ready.

---

### ✅ PASS CRITERIA (Todos deben cumplirse)

#### 1. Performance SLA
- [ ] **p50 dentro de target** para cada feature type
- [ ] **p95 dentro de max** para cada feature type
- [ ] **timeout handling testeado** (simulando APIs down) → No rompe

**Test:** 20 runs por feature, calcular percentiles, comparar vs tabla SLA.

---

#### 2. Evidence Status Funcionando
- [ ] **4 escenarios testeados:**
  - `verified` (sources >= minSourcesOverall, coverage >= 50%)
  - `partial` (sources < minSourcesOverall O coverage 20-50%)
  - `no_evidence` (sources = 0)
  - `error` (API down/timeout)
- [ ] **NUNCA** `success: false` por falta de evidencia
- [ ] **SIEMPRE** output funcional (incluso en `no_evidence`)

**Test:** Ejecutar cada feature en 4 condiciones (mock APIs para forzar escenarios).

---

#### 3. Waste Metrics Bajo Control
- [ ] **coverage_waste_rate < 20%** (global)
- [ ] **citation_utilization > 0.25** (global)
- [ ] **avg_retrieval_cost_ms < 2000ms** (global)

**Test:** 50 generaciones en producción (o staging), medir métricas, validar umbrales.

---

#### 4. GeoIntelligence Reliability
- [ ] **5 ciudades testeadas:**
  - 2 grandes (Madrid, Barcelona) → `verified` o `partial`
  - 3 pequeñas (Cuenca, Teruel, Soria) → `no_evidence` PERO output útil
- [ ] **success: true** en TODAS (incluso sin datos)
- [ ] **UI muestra badge correcto** según evidence_status

**Test:** Ejecutar GeoIntelligence con 5 ciudades, validar degradación.

---

#### 5. Claim-Based Retrieval (Tasks)
- [ ] **90% de tasks normales** → retrieval = 0
- [ ] **< 5% false positives** (retrieval activado innecesariamente)
- [ ] **< 5% false negatives** (output cuantitativo sin evidencia)

**Test:** 100 generaciones tasks variadas, medir activación de retrieval.

---

#### 6. Timeout No Causa Bloqueos
- [ ] **API timeout testeado** en cada profile
- [ ] **evidence_status baja** (verified → partial → no_evidence)
- [ ] **NUNCA bloqueo total** (siempre devuelve output)

**Test:** Mock API con delay 20s, validar comportamiento.

---

### ❌ FAIL CRITERIA (Cualquiera bloquea deploy)

#### Blockers Absolutos

1. ❌ **Alguna feature falla p50 target** → BLOCKER
2. ❌ **waste_rate > 40%** en cualquier profile → BLOCKER
3. ❌ **GeoIntelligence rompe** con ciudades pequeñas (en vez de degradar) → BLOCKER
4. ❌ **Hay casos donde `success: false`** por error en evidencia → BLOCKER
5. ❌ **No se ejecutaron benchmarks** (sin datos = sin deploy) → BLOCKER
6. ❌ **Timeout causa error fatal** en cualquier feature → BLOCKER
7. ❌ **citation_utilization < 0.20** (global) → BLOCKER (retrieval inútil)

**Acción:** NO deploy hasta fix.

---

### ⚠️ WARNINGS (Tolerables con plan de mejora)

Permitido ir a producción, pero con **plan de mejora documentado**:

1. ⚠️ **p95 ligeramente sobre max** (< 20% exceso) → Investigar outliers, plan 30 días
2. ⚠️ **waste_rate 20-30%** → Subóptimo, plan de optimización 60 días
3. ⚠️ **Algunas ciudades pequeñas sin datos** → OK si degrada gracefully
4. ⚠️ **citation_utilization 0.20-0.25** → Subóptimo, mejorar prompts

**Acción:** Deploy permitido, pero tracking semanal + deadline para fix.

---

### 📊 Scorecard de Readiness

Completar antes de deploy:

| Criterion | Status | Evidence | Blocker? |
|-----------|--------|----------|----------|
| Performance SLA (p50) | ⏳ | Pending benchmarks | ❌ YES |
| Performance SLA (p95) | ⏳ | Pending benchmarks | ❌ YES |
| Timeout handling | ⏳ | Pending test | ❌ YES |
| Evidence status (4 scenarios) | ⏳ | Pending test | ❌ YES |
| Never success:false | ⏳ | Pending validation | ❌ YES |
| coverage_waste_rate < 20% | ⏳ | Pending measurement | ❌ YES |
| citation_utilization > 0.25 | ⏳ | Pending measurement | ❌ YES |
| GeoIntelligence (5 cities) | ⏳ | Pending test | ❌ YES |
| Claim-based retrieval (tasks) | ⏳ | Pending test | ❌ YES |

**Decisión:**
- ✅ **PASS:** Todos los blockers resueltos → **DEPLOY**
- ⚠️ **PASS WITH WARNINGS:** Blockers OK, warnings con plan → **DEPLOY + TRACKING**
- ❌ **FAIL:** Algún blocker pendiente → **NO DEPLOY**

---

### 🔄 Post-Deploy Monitoring (Primeros 7 días)

Después de deploy, validar que el sistema se comporta en producción real:

**Daily checks:**
- [ ] p95 sigue dentro de SLA
- [ ] waste_rate no aumentó
- [ ] No hay error spikes por timeout
- [ ] User satisfaction tracking

**Criterio de rollback:**
- ❌ p95 excede SLA por >50% durante 2 días consecutivos
- ❌ waste_rate > 40% durante 3 días
- ❌ User complaints sobre lentitud > 10% de usuarios
- ❌ Errors relacionados con evidence > 1% de requests

---

## 📈 Success Metrics (Post-Deploy)

Después de 1 semana en producción, evaluar:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| p50 compliance rate | > 90% | - | ⏳ |
| p95 compliance rate | > 80% | - | ⏳ |
| waste_rate (global) | < 25% | - | ⏳ |
| User satisfaction | > 4/5 | - | ⏳ |
| Degradation success | 100% | - | ⏳ |
| Timeout rate | < 1% | - | ⏳ |

**Criterio de éxito:**
- ✅ 5/6 métricas en target → Sistema estable
- ⚠️ 3-4/6 → Necesita ajustes
- ❌ < 3/6 → Rollback, system no está listo

---

## 🔄 Iteración Continua

Este contrato NO es estático. Se revisa cada quarter:

1. **Q Review:** ¿Los SLAs siguen siendo apropiados?
2. **Profile Tuning:** ¿Algún profile necesita ajuste de tiers?
3. **New Features:** ¿Nuevas features de IA necesitan Evidence System?
4. **Waste Analysis:** ¿Podemos reducir waste_rate aún más?

**Responsable:** Tech lead del Evidence System
**Frecuencia:** Cada 3 meses
**Output:** Updated contract + optimization roadmap
