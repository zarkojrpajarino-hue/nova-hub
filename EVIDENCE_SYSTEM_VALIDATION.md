# 🧪 EVIDENCE SYSTEM - VALIDATION CHECKLIST

## ⚡ Performance Testing (CRÍTICO)

### Acceptance Gate
**Este benchmarking es OBLIGATORIO antes de considerar el sistema production-ready.**

No es opcional. Si no se puede correr ahora, al menos el "cómo" debe estar ultra concreto.

---

### Test 1: Baseline sin Evidence System

**Setup:**
```typescript
// En EvidenceAIGenerator.tsx, agregar flag temporal:
const EVIDENCE_DISABLED = true; // ← Para medir baseline

if (EVIDENCE_DISABLED) {
  // Skip evidence modal, call function directly
  const result = await supabase.functions.invoke(functionName, { body });
  return result;
}
```

**Protocolo de medición:**

1. **Instrumentar con timestamps:**
   ```typescript
   const startTime = performance.now();
   const result = await supabase.functions.invoke(...);
   const endTime = performance.now();
   const duration = endTime - startTime;

   // Log to analytics
   await logMetric({
     feature: 'AITaskGenerator',
     mode: 'baseline',
     duration_ms: duration,
     timestamp: new Date().toISOString()
   });
   ```

2. **Ejecutar N veces por feature:**
   - [ ] AITaskGenerator - 20 ejecuciones
   - [ ] AILeadFinder - 20 ejecuciones
   - [ ] LearningPathGenerator - 20 ejecuciones
   - [ ] OneOnOnePrep - 20 ejecuciones
   - [ ] GeoIntelligenceSelector - 20 ejecuciones

3. **Calcular percentiles:**
   ```typescript
   const durations = [/* array of 20 measurements */];
   durations.sort((a, b) => a - b);

   const p50 = durations[Math.floor(durations.length * 0.5)];
   const p95 = durations[Math.floor(durations.length * 0.95)];

   console.log({ feature, p50, p95 });
   ```

**Output esperado:**
```json
{
  "AITaskGenerator": { "p50": 2.1, "p95": 2.8 },
  "AILeadFinder": { "p50": 3.4, "p95": 4.2 },
  // ...
}
```

### Test 2: Con Evidence Mode = Balanced

**Métricas a medir:** p50 (mediana) + p95 (worst case aceptable)

**Límites absolutos por tipo de feature:**

| Feature Type | p50 Target | p95 Max | Rationale |
|--------------|-----------|---------|-----------|
| **Tasks** (AITaskGenerator, Router, Executor) | < 3s | < 5s | Decisiones internas, retrieval mínimo |
| **CRM** (AILeadFinder) | < 5s | < 7s | Búsqueda rápida, no bloquear prospecting |
| **Learning** (LearningPathGenerator) | < 8s | < 12s | Contenido más profundo, usuario espera |
| **Team** (OneOnOnePrep, Scheduling) | < 6s | < 10s | Preparación de meeting, no urgente |
| **GeoIntelligence** | < 7s | < 12s | APIs externas, pero crítico para onboarding |

**Acceptance criteria:**
- ✅ Cumple p50 + p95 → OK
- ⚠️ Cumple p50 pero falla p95 → Hay outliers, investigar
- ❌ Falla p50 → **BLOCKER** - Reducir scope inmediatamente

**Importante:** Un incremento del 30% puede ser OK (2s→2.6s) o fatal (12s→16s). Por eso medimos límites absolutos.

### Test 3: Con Evidence Mode = Strict

**Solo para features donde tiene sentido:** financial, CRM, learning

**Límites absolutos:**

| Feature Type | p50 Target | p95 Max |
|--------------|-----------|---------|
| **Financial (strict)** | < 15s | < 30s |
| **CRM (strict)** | < 10s | < 20s |
| **Learning (strict)** | < 12s | < 25s |

**Acceptance criteria:**
- ✅ Cumple límites → OK (el usuario pidió strict, acepta esperar)
- ❌ p95 > 30s → Timeout probable - Reducir tiers o implementar early-exit

---

## 🎯 Coverage Testing

### Por Profile:

#### Tasks Profile (ULTRA-LIVIANO + CLAIM-BASED RETRIEVAL)

**Mecanismo de activación de retrieval:**

La clave es que **retrieval solo se activa si el output va a incluir números externos**.

**Implementación:**

1. **En FUNCTION_CLAIMS para tasks:**
   ```typescript
   // La mayoría de claims NO requieren evidencia
   {
     claim: "Tareas generadas basadas en contexto del proyecto",
     requires_evidence: false,  // ← DEFAULT
     minSources: 0
   }

   // Solo si usuario pide comparación con industria:
   {
     claim: "Tiempo estimado comparado con benchmark de industria",
     requires_evidence: true,  // ← Solo si user pidió "comparado con..."
     minSources: 2
   }
   ```

2. **Detección automática en prompt:**
   ```typescript
   // Si user input contiene keywords:
   const needsExternalData = /comparado|benchmark|industria|promedio|estándar/.test(userInput);

   if (needsExternalData) {
     // Activar claim con requires_evidence: true
   } else {
     // retrieval = 0 (solo contexto interno)
   }
   ```

**Test cases:**

- [ ] **Generación normal**: "Genera tareas para esta semana"
  - Expected: retrieval = 0, sources = 0, output basado en internal_data ✅

- [ ] **Con benchmark externo**: "Genera tareas con tiempo promedio de la industria"
  - Expected: retrieval activado, busca en official_apis, cita benchmarks ✅

- [ ] **Modo strict manual**: Usuario cambia a strict en modal
  - Expected: retrieval forzado aunque no haya claim factual (user override) ✅

**Expected behavior:**
```typescript
// Normal (hypothesis) → retrieval=0, sources=0 → OK
// Con benchmark (balanced) → retrieval=1, sources=2+ → OK
// Strict manual (strict) → retrieval=1, sources=2+ → Required
```

#### Financial Profile

**GeoIntelligence - Graceful Degradation Contract:**

Testear con 2 ciudades grandes + 3 pequeñas:
- [ ] Madrid (grande) → ¿Encuentra datos en official_apis?
- [ ] Barcelona (grande) → ¿Encuentra datos en official_apis?
- [ ] Cuenca (pequeña) → ¿Degrada sin romper?
- [ ] Teruel (pequeña) → ¿Degrada sin romper?
- [ ] Soria (pequeña) → ¿Degrada sin romper?

**Contrato de comportamiento:**

```typescript
// SIEMPRE debe devolver un resultado útil
interface GeoIntelligenceResult {
  success: true,
  data: {
    city: string,
    country: string,
    evidence_status: 'verified' | 'partial' | 'no_evidence',
    sources_found: number,
    // ... rest of data (SIEMPRE presente, aunque sea qualitative)
  }
}

// NUNCA debe romper con error si no hay fuentes
```

**Expected behavior por escenario:**

1. **Ciudad grande + APIs disponibles:**
   ```typescript
   evidence_status = 'verified'
   sources_found >= minSourcesOverall
   UI: Muestra datos con badge "✓ Verificado"
   ```

2. **Ciudad pequeña + APIs sin datos:**
   ```typescript
   evidence_status = 'no_evidence'
   sources_found = 0
   UI: Muestra datos con badge "⚠️ Hipótesis" + botón "🔍 Buscar más evidencia"
   Output: DEBE ser cualitativo pero útil (no romper)
   ```

3. **APIs down / timeout:**
   ```typescript
   evidence_status = 'partial'
   sources_found < minSourcesOverall
   UI: Muestra datos con badge "⚠️ Datos limitados" + retry button
   ```

**Crítico:** El sistema NUNCA debe fallar silenciosamente ni devolver null. Siempre generar output útil.

#### CRM Profile
- [ ] **AILeadFinder**: ¿Encuentra competidores reales?
- [ ] **AILeadFinder**: ¿Datos de LinkedIn/Crunchbase accesibles?

#### Learning Profile
- [ ] **LearningPathGenerator**: ¿Encuentra cursos reales?
- [ ] **LearningPathGenerator**: ¿APIs educativas (Coursera, Udemy) disponibles?

---

## 🔍 Retrieval Strategy Validation

### Test por Tier:

#### Tier 1: user_docs
- [ ] ¿Extracción de PDF/CSV funciona?
- [ ] ¿Tags manuales se aplican correctamente?
- [ ] ¿Búsqueda semántica sobre docs?

#### Tier 2: official_apis
- [ ] ¿Qué APIs están realmente integradas?
- [ ] ¿Rate limits manejados?
- [ ] ¿Fallback a web_news si API falla?

#### Tier 3: internal_data
- [ ] ¿Consultas a DB optimizadas?
- [ ] ¿Índices en tablas relevantes?

#### Tier 4: web_news
- [ ] ¿Web scraping permitido legalmente?
- [ ] ¿Fuentes confiables definidas?

---

## 🚨 Red Flags a Vigilar

### 1. Retrieval Waste (MÉTRICA CRÍTICA)

**Definición:** Cuando el sistema busca evidencias pero luego no las usa.

**Fórmula:**
```typescript
waste_rate = (sources_found > 0 && coverage_percentage < threshold)
  ? 1
  : 0

// Aggregate:
waste_rate_total = sum(waste) / total_generations
```

**Thresholds por modo:**
- **Hypothesis:** No aplica (no busca)
- **Balanced:** threshold = 30% (si encuentra fuentes, al menos 30% deben citarse)
- **Strict:** threshold = 50% (si encuentra fuentes, al menos 50% deben citarse)

**Red flags:**

| Scenario | sources_found | coverage_% | Waste? | Acción |
|----------|---------------|------------|--------|--------|
| Búsqueda inútil | 5 | 0% | ✅ YES | Ajustar queryHints, prompts de citación |
| Búsqueda parcial | 3 | 20% | ✅ YES | Mejorar relevancia de sources |
| Búsqueda OK | 4 | 60% | ❌ NO | Todo bien |
| Sin búsqueda | 0 | 0% | ❌ NO | Hypothesis mode, esperado |

**Causas típicas de waste:**
1. **Profile mal asignado:** Busca en tiers irrelevantes
2. **Keywords genéricos:** Encuentra sources pero no relevantes
3. **Prompts no citan:** LLM genera sin usar las sources
4. **Claims desalineados:** Se busca para claims que no se usan

**Fix por causa:**
1. Revisar tierOrder y profile assignment
2. Agregar synonyms específicos al domain
3. Mejorar prompt para forzar citación
4. Alinear FUNCTION_CLAIMS con output real

**Target metric:**
- ✅ waste_rate < 20% → Sistema eficiente
- ⚠️ waste_rate 20-40% → Revisar prompts y claims
- ❌ waste_rate > 40% → **PROBLEMA SERIO** - Retrieval inútil

### 2. Timeout en Generación
**Síntoma:** Edge function tarda >30s

**Causas:**
- Demasiados tiers en parallel
- APIs externas lentas
- Sin timeout en retrieval

**Fix:**
- Reducir tierOrder (eliminar web_news si no es crítico)
- Implementar timeout por tier (5s max)
- Parallel requests con Promise.race

### 3. Degradación de UX
**Síntoma:** Usuario espera mucho tiempo para ver resultado

**Causas:**
- Modal de evidence bloquea generación
- Pre-search toma demasiado
- Report post-generation muy verbose

**Fix:**
- Hacer pre-search async (background)
- Mostrar preview de generación mientras busca evidencia
- Report colapsable por defecto

---

## 💡 Optimizaciones Futuras

### MentorChat: Evidence on Demand
```typescript
// Cuando el chat da números/benchmarks:
if (responseContainsFactualClaim(aiResponse)) {
  showButton("🔍 Respaldar con fuentes");
}

// Al hacer click:
// → Invocar Evidence System solo para ese claim específico
// → Mostrar mini-report inline en el chat
```

**Benefit:** Evidence solo cuando importa, sin romper flujo conversacional

### Smart Profile Detection
```typescript
// Auto-detectar profile basado en claim type:
if (claimType === 'financial_metric') → financial profile
if (claimType === 'market_size') → financial profile
if (claimType === 'skill_requirement') → learning profile
```

**Benefit:** Más preciso que inferir por function name

### Incremental Evidence
```typescript
// No esperar a tener TODAS las evidencias
// Mostrar generación + evidencias conforme llegan

1. Generación → Show immediately
2. Tier 1 results → Append
3. Tier 2 results → Append
4. Final report → Complete
```

**Benefit:** Percepción de velocidad mucho mejor

---

## ✅ Checklist Final

Antes de marcar Evidence System como "Production Ready":

- [ ] Performance tests completados (baseline, balanced, strict)
- [ ] Coverage tests por profile
- [ ] Retrieval strategy validada por tier
- [ ] Red flags identificados y mitigados
- [ ] Plan de optimizaciones futuras documentado
- [ ] Graceful degradation testeado (ciudades pequeñas, APIs down)
- [ ] User feedback sobre tiempo de espera recolectado
- [ ] Dashboards de analytics configurados (tiempo por tier, hit rate)

**Criterio de éxito:**
- 90% de generaciones completan en <15s (balanced mode)
- 70% de strict mode encuentra >2 sources relevantes
- 0% de timeouts en hypothesis mode
- User satisfaction >4/5 en "útil vs molesto"
