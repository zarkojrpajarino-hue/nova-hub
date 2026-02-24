# MASTER ACTION PLAN — Nova Hub (Optimus-K)
> **Fuente:** ENGINE_DESIGN.md + chattt.txt (documento fundacional) + chatttt2.txt (documento avanzado) + auditoría de código Claude
> **Fecha:** 2026-02-24
> **Estado:** PLAN DE DISEÑO E IMPLEMENTACIÓN — no ejecutado aún
> **Propósito:** Lista completa y ordenada de TODO lo que falta para que el sistema esté terminado

---

## Índice

| Tier | Nombre | Items | Tipo |
|------|--------|-------|------|
| [TIER 0](#tier-0-fundamentos-matemáticos-y-de-datos) | Fundamentos — Matemáticas y datos | 8 | Diseño + DB |
| [TIER 1](#tier-1-los-4-motores-estratégicos) | Los 4 motores estratégicos | 12 | Backend + Lógica |
| [TIER 2](#tier-2-onboarding--primera-experiencia) | Onboarding y primera experiencia | 10 | UX + Backend |
| [TIER 3](#tier-3-ux-core--superficies-del-motor) | UX Core — Superficies del motor | 14 | Frontend |
| [TIER 4](#tier-4-sistema-de-roles-fix-crítico) | Sistema de roles — Fix crítico | 8 | Backend + Frontend |
| [TIER 5](#tier-5-optimus--psicología-del-sistema) | Optimus y psicología del sistema | 12 | IA + UX |
| [TIER 6](#tier-6-notificaciones-layers-2-5) | Notificaciones (Layers 2–5) | 6 | Backend |
| [TIER 7](#tier-7-content--playbooks) | Contenido y playbooks | 7 | Contenido |
| [TIER 8](#tier-8-features-por-fase-y-modo) | Features por fase y modo | 6 | Arquitectura |
| [TIER 9](#tier-9-sistemas-avanzados) | Sistemas avanzados | 8 | Backend + UX |
| [TIER 10](#tier-10-monetización--planes) | Monetización y planes | 5 | Backend + UX |
| [TIER 11](#tier-11-edge-cases) | Edge cases | 10 | Backend + UX |
| [TIER 12](#tier-12-mvp-scope) | Definición del MVP real | — | Estrategia |

---

## TIER 0: Fundamentos Matemáticos y de Datos

> **Bloquea todo lo demás.** Sin estas definiciones, ningún motor puede implementarse.
> **Tipo:** Diseño + base de datos + lógica pura

### 0.1 — Iteration Velocity — definición encontrada en chattt.txt ✅

**Origen:** chattt.txt (documento fundacional) — ya definida, solo falta implementar.

**Definición:**
```
iteration_velocity = número de experimentos reales ejecutados por mes
                     (OBV tipo exploración/validación creado + resultado registrado)

Saludable:  ≥ 2 iteraciones/mes
Fricción:   1 iteración/mes
Crítico:    0 iteraciones en 4 semanas
```

**Normalización a 0–100 para usar en motores:**
```
velocity_score = MIN(100, iteration_velocity × 25)
// 0 iteraciones = 0, 2 = 50, 4+ = 100
```

**Ventana:** 4 semanas rolling. Solo OBVs con resultado documentado cuentan (no tareas sueltas).

**Impacto:** Probability Engine (como sub-input de execution_rate) + Viability Engine (patrón de inactividad) + Weekly Digest ("Tu velocidad de iteración subió/bajó X% vs ciclo anterior").

---

### 0.2 — Definir evidence_quality_score

**Problema:** La fórmula de `validation_strength` incluye `evidence_quality_score × 15` pero **nunca se define** qué es ni cómo se calcula.

**Tarea:** Especificar:
```
evidence_quality_score = f(
  tipo_de_evidencia,      // ¿screenshot < entrevista < pago?
  fuente_externa,         // ¿link verificable?
  antigüedad,             // ¿relevancia temporal?
  peer_confirmation       // ¿alguien más lo validó?
)
```
Definir la escala (0–10? 0–100?), los pesos, y qué tipo de evidencia da qué puntuación.

---

### 0.3 — Resolver el math del solo founder

**Problema:** La capacidad base es 100 unidades/semana. Una semana normal de solo founder:
- 3 OBVs activos: -30 unidades
- 8 tareas: -24 unidades
- 2 reuniones: -20 unidades
- **Total consumido: 74/100 → ya al 74% de carga → casi en warning**

Con el ajuste `× 0.85`, la capacidad efectiva = 85 unidades. 74 consumidas = **87% de carga → CRITICAL por definición.**

**Tarea:** Revisar los umbrales para solo:
- ¿El solo founder debe tener un baseline diferente? (¿120 unidades?)
- ¿O los umbrales de warning/crítico cambian para solo? (80% → 90% en solo)
- ¿O el cálculo de OBVs/tareas/reuniones se pondera diferente para uno solo?

Documentar la decisión y actualizar ENGINE_DESIGN.md §5 y §10.

---

### 0.4 — Calibrar el "Day 1 Probability Problem"

**Problema:** En Fase 1, día 1, sin datos:
```
probability = (0 × 0.35) + (50 default × 0.20) + (0 × 0.15) + (30 neutral × 0.15) + (0 × 0.15)
            = 0 + 10 + 0 + 4.5 + 0
            = 14.5 / 100 → CRÍTICO
```
Un usuario nuevo ve inmediatamente que su probabilidad es "crítica". Esto **mata la motivación.**

**Opciones a decidir:**
- A) Bloquear el score hasta semana 3 (mostrar "Recopilando datos...")
- B) Warm start: primeros 30 días tienen valores base elevados que se ajustan progresivamente
- C) Solo mostrar el score una vez que hay al menos 2 inputs con datos reales
- D) El score inicial es "N/A" con un mensaje: "Tu probabilidad se activa cuando completes tu primera validación"

---

### 0.5 — Definir los OBV types que existen en schema

**Problema:** La fase 1 tiene como hard signal:
> "At least 1 OBV with type=`customer_discovery` in status=`validated`"

Pero **no sabemos si `customer_discovery` existe como type válido en el schema actual** de OBVs.

**Tarea:** Auditar la tabla `obvs` (o `validaciones`):
- ¿Qué tipos de OBV existen actualmente?
- ¿Existe `type` o `category` como campo?
- Añadir los tipos necesarios para cada hard signal:
  - Fase 1: `customer_discovery`
  - Fase 2: `revenue_validation`
  - Fase 3: `operational_system`

---

### 0.6 — Risk Score — fórmula ausente del plan ✅ [+chattt.txt]

**Origen:** chattt.txt — completamente distinto al Probability Engine. Es el "Índice de Riesgo Operativo".

**Propósito:** Mientras el Probability Engine mide *momentum de avance*, el Risk Score mide *riesgo de colapso*. Son complementarios. Uno motiva, el otro disciplina.

**Fórmula:**
```
RiskScore =
  (RunwayFactor × 0.25)           // ¿Cuántos meses de runway quedan?
+ (RevenueConcentration × 0.20)   // ¿Depende de 1 cliente para >50% ingresos?
+ (ExecutionDrop × 0.20)          // ¿El loop semanal no se completa?
+ (ValidationWeakness × 0.20)     // ¿0 validaciones externas?
+ (BottleneckSeverity × 0.15)     // ¿Hay un rol crítico bloqueado?

→ Clasificado: Bajo / Medio / Alto / Crítico
```

**Cómo se muestra:**
- Discreto en el header: `Riesgo: ●` (punto de color: verde/amarillo/naranja/rojo)
- Solo se detalla en 3 momentos: cuando sube de categoría, en estancamiento, en Simulación Mode
- NUNCA se muestra como "probabilidad de fracaso" — siempre como "riesgo estructural actual"

**Ejemplo de output:**
```
⚠ Riesgo estructural: Alto
  · Sobrecarga operativa (al 132% de capacidad)
  · Canal de adquisición no validado
  · Dependencia de 1 cliente (73% de ingresos)
```

**Nueva tabla requerida:**
```sql
CREATE TABLE project_risk_score (
  project_id UUID,
  risk_level TEXT,  -- bajo|medio|alto|critico
  runway_factor NUMERIC(5,2),
  revenue_concentration NUMERIC(5,2),
  execution_drop NUMERIC(5,2),
  validation_weakness NUMERIC(5,2),
  bottleneck_severity NUMERIC(5,2),
  calculated_at TIMESTAMPTZ
);
```

---

### 0.7 — Phase 2 — thresholds concretos ✅ [+chattt.txt]

**Origen:** chattt.txt — los números exactos ya están definidos. Solo falta implementarlos.

**Outcome 2.1 — Problema-Solución validado:**
```
Saludable:  ≥10 entrevistas + interés ≥20%
Fricción:   <10 entrevistas tras 4 semanas, interés 10–15%
Crítico:    <10 entrevistas tras 8 semanas, interés <10% tras 2 iteraciones
```

**Outcome 2.2 — Primer ingreso o intención fuerte:**
```
Saludable:  ≥1 ingreso real antes de semana 6
            O ≥3 pre-compromisos (LOI, reserva, pago parcial)
Fricción:   0 ingresos en semana 6–8, conversión 5–10%
Crítico:    0 ingresos tras semana 10–12, conversión <5%,
            ≥3 iteraciones sin mejora
```

**Outcome 2.3 — Canal reproducible inicial:**
```
Saludable:  Canal genera leads consistentes 2 semanas seguidas + CAC estimado
Fricción:   Leads irregulares, sin medición de CAC
Crítico:    0 leads consistentes tras 6 semanas,
            dependencia de referrals casuales únicamente
```

**Alerta de inviabilidad Fase 2 (activa si se dan TODOS):**
- 0 ingresos
- ≥3 iteraciones sin mejora métrica
- Canal no identificado
- Conversión <5%
- Validación externa negativa repetida
- Todo ello durante 8–12 semanas

**Ajuste por work_mode:**
```
Solo founder:  +2 semanas de tolerancia en cada umbral
Equipo:        Menor tolerancia, ritmo esperado mayor
               Si no hay reuniones estructuradas → penalización execution_rate
```

**Tarea:** Replicar esta misma estructura de thresholds para Fase 1, 3 y 4 (aún no definidos con este nivel de detalle).

---

### 0.8 — Definir la Location Layer (datos obligatorios)

**Originado en:** chatttt2.txt análisis.

Todo proyecto debe tener como datos de base:
```
location = {
  country: "ES",                    // ISO 3166-1 alpha-2
  market_scope: "local" | "global", // ¿opera solo en su país o internacionalmente?
  cluster: "EU" | "US" | "LATAM" | "APAC" | "Other"
}
```

**Tarea:** Definir:
- ¿Es obligatorio en onboarding? (Sí — no se puede saltar)
- ¿Afecta thresholds del motor? (¿LATAM startup tiene tolerancias diferentes?)
- ¿De dónde vienen los benchmarks por región? (Fuente pendiente — ver 0.7)
- ¿Cómo se usa en el contexto de Optimus? ("En Europa, el ciclo de validación es...")

---

### 0.7 — Benchmarks v1 — Fuente y contenido

**Originado en:** chatttt2.txt + análisis previo.

El sistema compara al usuario con su industria/fase/región. Pero **los benchmarks no existen.**

**Tarea:** Decidir la estrategia:
- **Opción A: Benchmarks curados (manual v1)** — Define tú mismo los valores mínimos/medios/buenos por fase + tipo de negocio. Fuentes: Carta.com (SaaS), First Round reports, Lean Startup data, LATAM startup studies.
- **Opción B: Benchmarks internos (generados de usuarios reales)** — Primeras 500 empresas alimentan los benchmarks automáticamente. Requiere masa crítica.
- **Opción C: Híbrido** — v1 con valores curados, v2 con datos reales del producto.

Crear tabla `benchmarks`:
```sql
CREATE TABLE benchmarks (
  phase INTEGER,
  metric TEXT,
  market_scope TEXT,
  cluster TEXT,
  economic_profile TEXT,
  p25 NUMERIC,  -- percentil 25 (bajo)
  p50 NUMERIC,  -- mediano
  p75 NUMERIC,  -- bueno
  p90 NUMERIC,  -- excelente
  source TEXT,
  updated_at TIMESTAMPTZ
);
```

---

### 0.8 — Nuevas tablas de base de datos

Además de las 4 tablas de ENGINE_DESIGN.md (`project_phase_state`, `project_probability`, `project_viability_state`, `project_economic_profile`), se necesitan:

```sql
-- Historial de probabilidad (trending)
CREATE TABLE project_probability_history (
  project_id UUID,
  week_number INTEGER,
  probability_score NUMERIC(5,2),
  fase_score NUMERIC(5,2),
  execution_rate NUMERIC(5,2),
  validation_strength NUMERIC(5,2),
  revenue_momentum NUMERIC(5,2),
  capacity_health NUMERIC(5,2),
  recorded_at TIMESTAMPTZ
);

-- Cobertura funcional (ver Tier 4)
CREATE TABLE project_function_coverage (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  function TEXT, -- demand_generation|closing|cash_control|delivery_ops|direction_strategy|automation_tech
  owner_member_id UUID REFERENCES project_members(id) NULLABLE,
  coverage_level TEXT, -- full|partial|none
  source TEXT, -- assigned|observed|inferred
  impact_weight NUMERIC(3,2),
  updated_at TIMESTAMPTZ
);

-- Tracking de decisiones (ver Tier 5)
CREATE TABLE decision_events (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  recommendation_type TEXT,
  recommendation_content TEXT,
  accepted BOOLEAN,
  dismissed_reason TEXT NULLABLE,
  context_metrics JSONB, -- snapshot del estado en el momento
  resultado_posterior JSONB NULLABLE, -- resultado 30 días después
  created_at TIMESTAMPTZ
);

-- Bloques estratégicos detectados (ver Tier 5)
CREATE TABLE strategic_blocks (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  block_type TEXT, -- clarity_block|traction_block|structural_block|behavioral_block
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ NULLABLE,
  evidence JSONB,
  mode_activated TEXT NULLABLE -- modo_desbloqueo|build|rescue
);

-- Protocolo activo del proyecto
CREATE TABLE project_protocols (
  project_id UUID PRIMARY KEY REFERENCES projects(id),
  primary_protocol TEXT, -- playbook ID
  secondary_protocol TEXT NULLABLE, -- max 1 secondary
  activated_at TIMESTAMPTZ,
  mode TEXT -- build|rescue
);

-- Ciclos estratégicos (Reset Ritual)
CREATE TABLE strategic_cycles (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  cycle_number INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ NULLABLE,
  evaluation TEXT NULLABLE, -- solido|inestable|critico
  auto_diagnosis JSONB,
  founder_answers JSONB,
  structural_decision TEXT NULLABLE
);

-- Location Layer
ALTER TABLE projects ADD COLUMN country TEXT;
ALTER TABLE projects ADD COLUMN market_scope TEXT; -- local|global
ALTER TABLE projects ADD COLUMN cluster TEXT;      -- EU|US|LATAM|APAC|Other
```

---

## TIER 1: Los 4 Motores Estratégicos

> **Depende de:** TIER 0 completado
> **Tipo:** Backend (Deno Edge Functions) + PostgreSQL + cron jobs

### 1.1 — Phase Engine: implementar compute-phase-score

Crear edge function `compute-phase-score` que:
1. Lee outcomes de cada fase (OBVs, tasks, KPIs, CRM data)
2. Aplica pesos por fase (ENGINE_DESIGN.md §2.2)
3. Verifica hard signals (requiere TIER 0.5 — OBV types)
4. Escribe resultado en `project_phase_state`
5. Dispara notificaciones si score cambia de banda (saludable/fricción/crítico)

**Submódulos:**
- Calculador Fase 1 (Descubrimiento)
- Calculador Fase 2 (Validación)
- Calculador Fase 3 (Operación)
- Calculador Fase 4 (Escala)

---

### 1.2 — Phase Engine: lógica de avance y regresión

Implementar en `compute-phase-score`:
- **ADVANCE:** score ≥ 75% + hard signal → propuesta a usuario → confirmar → log
- **REGRESS WARNING:** 4 semanas < 50% → notificación + 30 días recovery window
- **REGRESS:** 6 semanas < 50% → phase -= 1 → Viability notificada → preserve data at 40%

**Importante:** La regresión NO borra datos. Solo cambia `current_phase` y resetea score parcialmente.

---

### 1.3 — Probability Engine: implementar compute-probability-score

Crear edge function `compute-probability-score`:
1. Lee los 5 inputs (fase_score, execution_rate, validation_strength, revenue_momentum, capacity_health)
2. Aplica pesos (35/20/15/15/15)
3. Escribe en `project_probability` + `project_probability_history`
4. Detecta si algún input = 0 (dispara `probability_input_zero` notification)
5. Detecta drops >15 puntos en una semana (dispara `probability_drop`)

**Requiere:** TIER 0.2 (evidence_quality_score) + TIER 0.4 (Day 1 calibration) + TIER 0.3 (solo math)

---

### 1.4 — Probability Engine: conexión con CRM pipeline

**Gap identificado:** Revenue momentum usa `revenue_records` pero **NO usa datos del CRM pipeline.**

Un proyecto con 5 deals en "Proposal" stage tiene revenue momentum que el motor no ve.

**Tarea:** Añadir a la fórmula de `revenue_momentum`:
```
pipeline_signal = (
  leads_in_late_stages × avg_deal_value × win_rate_estimate
) / monthly_revenue_target

revenue_momentum_adjusted = revenue_momentum + (pipeline_signal × 0.20)
```

Decidir si pipeline_signal es input adicional o modificador de revenue_momentum.

---

### 1.5 — Probability Engine: conexión con peer validation

**Gap identificado:** `validation_strength` incluye `peer_validations_received × 5` pero el módulo de peer validation KPIs **no alimenta esta tabla.**

**Tarea:** Crear trigger o proceso que cuando `kpi_validations` recibe una peer validation, actualiza `validation_strength` en `project_probability`.

---

### 1.6 — Viability Engine: implementar evaluate-viability

Crear edge function `evaluate-viability`:
1. Lee `project_probability_history` (últimas N semanas)
2. Cuenta semanas consecutivas por debajo de umbrales
3. Transiciona entre estados (SALUDABLE → ESTANCAMIENTO → CRÍTICO)
4. Dispara las 3 Paths cuando corresponde
5. Gestiona el cooldown de 30 días post-decisión

---

### 1.7 — Organizational Engine: implementar compute-org-capacity

Crear edge function `compute-org-capacity`:
1. Lee `project_members`, `tasks`, `obvs`, `meetings` por proyecto
2. Calcula capacity units por miembro
3. Detecta bottlenecks (role > 60% OBVs / 70% tasks)
4. Detecta empty critical roles por fase
5. Escribe `capacity_health` en formato para Probability Engine
6. Dispara notificaciones Layer 5

**Requiere:** TIER 0.3 (solo math) resuelto primero.

---

### 1.8 — Economic Profile: implementar detect-economic-profile

Crear edge function `detect-economic-profile`:
1. En `project_created`: detectar perfil desde datos de onboarding
2. A las 4 semanas: revisar con datos reales de CRM + OBVs
3. Aplicar ajustes de thresholds según perfil (ENGINE_DESIGN.md §6.3)
4. User puede override desde Settings > Perfil Económico

**Adición [+chattt.txt] — UX del Perfil Económico Detectado:**

Después del onboarding, Optimus muestra una tarjeta:
```
📊 Perfil Operativo Detectado
Modelo:          B2B · Ticket medio-alto
Ciclo de venta:  4–8 semanas
Monetización:    Proyecto / contrato
Intensidad:      Baja infraestructura

En base a esto:
  Tiempo esperado para validar ingresos: 6–10 semanas
  Conversión saludable estimada:         8–15%
  Iteraciones mínimas recomendadas:      2/mes

[Ajustar perfil si no es correcto →]
```

Esto elimina la sensación de "el sistema me pone en rojo sin razón" para negocios con ciclo largo.

---

### 1.9 — Economic Profile: detección de incoherencia del modelo ✅ [+chattt.txt]

**Origen:** chattt.txt — feature completamente ausente del plan actual.

El sistema detecta cuando el modelo económico elegido es **estructuralmente incoherente**, no simplemente que va mal.

**4 patrones de incoherencia:**
```
Caso A: Ticket bajo + ciclo largo
  Ticket: <100€, Ciclo: >4 semanas, Esfuerzo comercial: alto
  → Modelo insostenible: el coste de vender supera el margen.
  Optimus: "El esfuerzo comercial estimado supera el margen por cliente."

Caso B: Suscripción sin retención
  MRR creciendo pero retención <50% a 2 meses
  → No es SaaS real. Es venta recurrente disfrazada.
  Optimus: "La retención actual no sostiene un modelo de suscripción."

Caso C: B2B enterprise + solo founder + runway corto
  Ciclo 3–6 meses + equipo = 1 + runway < 6 meses
  → Desalineación riesgo–estructura.
  Optimus: "Tu ciclo de venta supera tu runway disponible."

Caso D: Servicio manual intentando escalar como producto
  Cada cliente requiere trabajo manual, margen decreciente
  → No es modelo escalable aún.
  Optimus: "Tu modelo requiere personalización por cliente. Escalar requiere estandarizar primero."
```

**Output al usuario:**
```
🟠 Desalineación estructural detectada

Tu modelo actual: B2B · Ticket 120€ · Ciclo 5 semanas
Problema: El esfuerzo comercial supera el margen por cliente.
Impacto: Probabilidad de estancamiento en 12 semanas: 68%

Alternativas:
  · Aumentar ticket a ≥300€
  · Reducir ciclo con oferta estandarizada
  · Cambiar a modelo retainer mensual
```

**Nunca dice "modelo incorrecto".** Dice "desalineación estructural" con evidencia y alternativas.

---

### 1.10 — Economic Profile: historial de versiones ✅ [+chattt.txt]

**Origen:** chattt.txt — no está en el plan actual.

Cuando el modelo económico cambia (de proyecto a suscripción, de B2C a B2B, etc.), el sistema:
1. Detecta el cambio (ingresos recurrentes por 6–8 semanas, ticket cambia >30%, ciclo se acorta/alarga)
2. Propone actualización con impacto visualizado:
   ```
   Perfil actual:   Proyecto B2B · ciclo 6–8 semanas
   Perfil detectado: Suscripción B2B · ciclo 2–4 semanas

   Si actualizas: nuevos umbrales + nuevo ritmo esperado + nuevo cálculo de probabilidad
   [Actualizar perfil] [Mantener actual]
   ```
3. Si el usuario confirma → guarda versión anterior con timestamp
4. El historial de perfiles es parte del Project Timeline (TIER 8.6)

**Tabla adicional:**
```sql
CREATE TABLE project_economic_profile_history (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  sales_cycle TEXT,
  monetization_type TEXT,
  capital_intensity TEXT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  change_reason TEXT  -- 'auto_detected'|'manual_override'|'phase_transition'
);
```

---

### 1.9 — Cron jobs: orquestación semanal

Configurar cron jobs en Supabase (pg_cron o Deno cron):
```
Domingo 23:00 UTC:
  1. compute-org-capacity (todos los proyectos activos)
  2. compute-phase-score (todos los proyectos activos)
  3. compute-probability-score (todos los proyectos activos)
  4. evaluate-viability (todos los proyectos activos)
  5. trigger-engine-notifications (procesar outputs → crear notificaciones)
  6. send-weekly-digest (generar y enviar resumen semanal por email)
```

---

### 1.10 — On-demand recalculation triggers

Para que el sistema no espere hasta el domingo:
- **OBV validado** → recalcular Phase Score → recalcular Probability
- **Tarea completada** → recalcular execution_rate → recalcular Probability
- **CRM lead movido a "Won"** → recalcular revenue_momentum → recalcular Probability
- **Miembro añadido/removido** → recalcular org_capacity → recalcular Probability

Implementar como database triggers o Supabase webhooks → edge functions.

---

### 1.11 — Conectar role_performance → Phase Score (Gap 2)

Implementar el componente `execution_health` de la Phase Score formula:
```
Phase Score = (
  outcome_scores_weighted  × 0.70 +
  execution_health         × 0.20 +  // promedio de roles críticos
  validation_quality       × 0.10
)
```

`execution_health` = promedio de performance scores de los roles críticos para la fase actual.
Si un rol crítico está vacío → contribuye 0 (penalización estructural).

---

### 1.12 — Bottleneck → Challenge suggestion (Gap 3)

Implementar `suggest-bottleneck-challenge`:
- Cuando Org Engine detecta bottleneck → verificar si hay challenge activo para ese rol
- Si no → Optimus propone challenge de 14 días
- Usuario acepta → Challenge creado con tipo `bottleneck_relief`
- Outcome del challenge → alimenta `execution_rate` de Probability Engine

---

## TIER 2: Onboarding y Primera Experiencia

> **Depende de:** TIER 0 (Location Layer, Economic Profile detection)
> **Tipo:** UX + Backend + Lógica de flujo

### 2.1 — Las 10 preguntas exactas del onboarding

Diseñar y construir el onboarding con exactamente estas preguntas (en 2 fases):

**FASE A — Obligatoria (3–4 minutos, no se puede saltar):**
1. ¿En qué punto está tu proyecto? (Fase detection inicial — ver 2.3)
2. ¿Generas ingresos hoy? Si sí → ¿cuánto al mes?
3. ¿Cuántos clientes activos tienes?
4. ¿Cuántas personas trabajan en esto contigo? (team size → work_mode)
5. ¿Cuál es tu ticket promedio por cliente?
6. ¿Cuánto tiempo pasa entre tu primer contacto y el pago? (→ sales_cycle)
7. ¿Cómo monetizas? (transaccional / suscripción / ticket alto / contrato) (→ monetization_type)
8. ¿En qué país operas principalmente? (→ Location Layer)
9. ¿Tu mercado es local o global? (→ market_scope)
10. ¿Cuál es tu objetivo principal en los próximos 90 días?

**FASE B — Progresiva (se completa en las primeras 2 semanas):**
- Capital intensity (→ economic_profile)
- Sectores / industria específica
- Competidores (usado en SWOT)
- Canal de adquisición actual

---

### 2.2 — Diseño UX del onboarding 2-fases

- Fase A: pantalla dedicada, sin navegación lateral visible, progress bar de 10 preguntas
- Bienvenida: "Vamos a entender dónde estás en 3 minutos."
- Al terminar Fase A: setup inicial completo, llevar al dashboard
- Fase B: aparece como "Completa tu perfil estratégico" en banner dismissible del dashboard
- Completion de Fase B: desbloquea features adicionales

---

### 2.3 — Discovery Path como sub-estado de Fase 1

**Originado en:** chatttt2.txt + chattt.txt.

La primera pregunta del onboarding define el sub-estado inicial (no un onboarding distinto):

```
"¿En qué punto estás ahora?"
  → "Quiero empezar desde cero"    → Fase 1 · Sub-estado: Sin hipótesis
  → "Tengo una idea"               → Fase 1 · Sub-estado: Hipótesis definida
  → "Ya estoy operando"            → Motor calcula fase real con datos del onboarding
```

**Sub-estado "Sin hipótesis" (usuario sin idea):**
- La app muestra SOLO el flujo de exploración / generación de ideas
- NO se muestran CRM, KPIs de ventas, OBVs de revenue
- Solo: generador de ideas IA, interview tracker, hypothesis builder, persona canvas
- El sub-estado desaparece cuando se elige y documenta la primera hipótesis

**Sub-estado "Hipótesis definida":**
- Se salta generación de ideas
- Empieza directamente en: validación de problema, entrevistas, test inicial

**Estado "Ya estoy operando":**
- El motor calcula la fase real con los datos del onboarding (ingresos, clientes, equipo)
- Puede colocarlo en Validación / Operación / Escala según resultados

---

### 2.3b — Idea generation con viabilidad desde el minuto 1 ✅ [+chattt.txt]

**Origen:** chattt.txt — diseño específico del flujo para usuarios "sin idea".

**NO es solo inspiración.** Cada idea generada viene con filtro de viabilidad estructural inmediato.

**Flujo completo:**
1. Optimus pregunta: intereses, habilidades, restricciones de tiempo y dinero
2. Genera 3 opciones de negocio. Cada opción incluye:
   ```
   Idea: [nombre + descripción en 1 línea]
   Por qué encaja contigo: [match con intereses/habilidades]
   Perfil económico estimado: B2C · Ticket bajo · Ciclo corto
   Riesgos principales: [2–3 riesgos concretos]
   Primer experimento de 7 días: [OBV específico para validarla]
   ```
3. El usuario elige una opción (o la descarta todas → regenerar)
4. Al elegir → automáticamente:
   - Fase = 1 · Sub-estado = "Hipótesis definida"
   - Se crea el primer OBV con el experimento de 7 días pre-cargado
   - Economic Profile detectado desde el perfil estimado de la idea elegida

**Criterio de las 3 ideas:**
- Idea 1: Menor riesgo, mayor velocidad de validación (servicios digitales, consultoría)
- Idea 2: Mayor potencial de escala, más capital requerido (tech/SaaS)
- Idea 3: Basada en el interés más fuerte del usuario, sin filtro de viabilidad

**Conecta con:** `generate-business-ideas` edge function (ya existe — adaptar output al nuevo formato).

---

### 2.4 — Double filter para ideas

**Originado en:** chatttt2.txt.

Cuando un usuario ingresa una nueva idea o hipótesis de negocio, el sistema aplica 2 filtros:

**Filtro Nivel 1 — Hard filter (incoherencia estructural):**
- ¿La idea describe un problema real o solo una solución?
- ¿Tiene segmento de cliente identificable?
- Si NO pasa → no se guarda como hipótesis válida. Optimus redirige: "Antes de esto, definamos el problema."

**Filtro Nivel 2 — Warning (riesgo alto pero posible):**
- ¿El mercado es demasiado amplio? ("todos")
- ¿El ciclo de venta proyectado no coincide con el modelo económico?
- Si activa warning → se guarda pero con banner amarillo + sugerencia de Optimus

---

### 2.5 — Modelo Estratégico como sección permanente

**Originado en:** chatttt2.txt.

Reemplazar el concepto de "onboarding completado" por "Modelo Estratégico" — sección viva que siempre existe y se actualiza.

5 bloques del Modelo Estratégico:
1. **Fase actual** (calculada por Phase Engine, no declarada)
2. **Modelo Económico** (ciclo de venta + tipo monetización + intensidad de capital)
3. **Mercado** (segmento + geografía + scope)
4. **Estructura** (team size + work_mode + función coverage)
5. **Salud** (probability score + viability state + last week execution)

Accesible desde el sidebar como ítem permanente: "Mi Modelo"

---

### 2.6 — Reality Mode vs Simulation Mode

**Originado en:** chatttt2.txt.

El sistema opera siempre en **Reality Mode** por defecto.

**Simulation Mode (sandbox):**
- Permite al usuario "jugar" con escenarios: "¿Qué pasaría si cierro 3 deals este mes?"
- No afecta los scores reales
- Los engines corren en paralelo con datos ficticios
- Al salir: "Volver a tu situación real"
- **No mostrar en MVP v1** — es una feature de v2

---

### 2.7 — Los 3 Modos de Optimus

**Originado en:** chatttt2.txt.

El usuario elige su modo de operación (o Optimus lo detecta y sugiere):

| Modo | Threshold score para avanzar | Tolerancia de inactividad | Tono |
|------|------------------------------|---------------------------|------|
| **Exploración** | 65% | 5 semanas | Curioso, exploratorio |
| **Estándar** | 75% | 3 semanas | Directo, motivador |
| **Estricto** | 85% | 2 semanas | Exigente, sin excusas |

El modo afecta:
- Thresholds del Phase Engine
- Frecuencia de notificaciones
- Tono de los mensajes de Optimus
- Velocidad de escalada de alertas

**Importante:** Modo = parámetro del proyecto, no del usuario (un usuario puede tener proyecto en Exploración y otro en Estricto).

---

### 2.8 — Post-onboarding: los primeros 15 minutos

**Gap crítico identificado por Claude:** No existe diseño para lo que pasa justo después de terminar el onboarding.

**Tarea:** Diseñar el flujo completo:
1. Pantalla: "Tu perfil está listo. Esto es lo que Optimus detectó." → mostrar Modelo Estratégico v1
2. Primera sugerencia de Optimus según fase detectada:
   - Fase 1 → "Te propongo tu primera entrevista de descubrimiento"
   - Fase 2 → "Veo que tienes clientes. Documentemos tu primera validación de revenue"
   - Fase 3+ → "Empecemos con tu primera OBV de sistema operacional"
3. Crear el primer OBV automáticamente (con confirmación del usuario)
4. Mostrar el header con Phase Score inicial + Probability Score inicial
5. Opcional: tour de 3 slides del dashboard

---

### 2.9 — Mentira en onboarding / datos incorrectos

**Edge case, pero importante de diseñar (ver Tier 11.4).**

Si los datos de onboarding son contradictorios (ej: "genero €50K/mes" pero "tengo 0 clientes"), el sistema debe:
1. No bloquear — guardar y continuar
2. Marcar como "datos pendientes de verificación"
3. Optimus en la primera sesión: "Noto una inconsistencia en tu perfil. Cuéntame más sobre..."

---

### 2.10 — Strategic Reset Ritual (ciclos de 4 semanas)

**Originado en:** chatttt2.txt.

Cada 4 semanas, el sistema propone (no obliga) un ritual de reset estratégico:

**4 pasos del ritual:**
1. **Auto-diagnóstico:** El sistema presenta las métricas de las últimas 4 semanas
2. **5 preguntas:** Optimus hace 5 preguntas de reflexión (¿Qué funcionó? ¿Qué no? ¿Qué evitaste? ¿Qué aprendiste? ¿Cuál es tu apuesta para el próximo ciclo?)
3. **Decisión estructural:** ¿Continuar igual / ajustar / pivote / pausa?
4. **Nuevo ciclo:** Se crea registro en `strategic_cycles` con estado del ciclo: 🟢 Sólido / 🟠 Inestable / 🔴 Crítico

El ritual genera un `strategic_cycle` record y alimenta el historial del proyecto.

---

## TIER 3: UX Core — Superficies del Motor

> **Depende de:** TIER 1 (engines calculando datos)
> **Tipo:** Frontend React/TypeScript

### 3.1 — Header permanente: 3 indicadores siempre visibles

El header principal (en todas las vistas del proyecto) debe mostrar:
```
[Logo] [Proyecto actual]    [FASE 2 · 67%] [●●●○○ 54] [Riesgo: ●]    [Avatar]
```

Donde:
- **FASE N · X%** — fase actual + phase score (badge color: verde/amarillo/rojo)
- **●●●○○ N** — probability score en escala de 5 puntos (nunca el número exacto)
- **Riesgo: ●** — viability state como punto de color (verde/amarillo/rojo)

Al hacer hover: tooltip con "Tu probabilidad de avance es 54/100. El factor más bajo es execution_rate (32%)."

---

### 3.2 — Phase progress bar

En la vista de Dashboard y en "Mi Modelo":
- Barra horizontal dividida en 4 fases
- La fase actual tiene fill gradient hasta el score actual
- Las fases completadas están llenas
- Las fases futuras están vacías con outline

Hacer clic en cualquier fase → ver outcomes y score detallado.

---

### 3.3 — Phase Score breakdown view

Vista expandible (en Dashboard o Mi Modelo) que muestra:
```
FASE 2: VALIDACIÓN — 67% (Fricción)
─────────────────────────────────────
O2.1 — Revenue evidence     ████░░  45% (Saludable mínimo: 50%)
O2.2 — MVP testing          ██████  72% ✓
O2.3 — Acquisition channel  ██░░░░  28% ← Factor más bajo
─────────────────────────────────────
Hard signal: ❌ No revenue OBV validado aún
─────────────────────────────────────
Próxima acción: Documenta tu primera venta o compromiso de compra
```

---

### 3.4 — Probability Engine breakdown

Vista expandible (al hacer clic en el indicator del header):
```
PROBABILIDAD DE AVANCE — 54/100 (Fricción)
─────────────────────────────────────────────
Fase score         ████████░░  67  (peso: 35%)
Execution rate     █████░░░░░  52  (peso: 20%)  ← Bajo
Validation         ███████░░░  63  (peso: 15%)
Revenue momentum   ████████░░  71  (peso: 15%)
Capacity health    ████░░░░░░  38  (peso: 15%)  ← Bajo
─────────────────────────────────────────────
Tendencia: ↓ -8 puntos vs semana pasada
```

---

### 3.5 — Regression UX — La experiencia de ir hacia atrás

**Gap crítico no diseñado.** Si ocurre una regresión de fase:

**Lo que NO se debe hacer:** mensaje de error brutal, datos borrados, sensación de castigo.

**Diseño propuesto:**
1. Notificación especial (tipo distinto visualmente): "Tu proyecto ha entrado en revisión de Fase 1"
2. Pantalla de transición: "Esta no es una derrota. Es datos." → explicar qué causó la regresión
3. Las 3 Paths aparecen (mismas del Viability Engine)
4. Optimus: "Llevas 6 semanas sin OBVs. Hablemos de qué está bloqueándote."
5. Dashboard muestra "Modo Recuperación" con las 3 acciones más prioritarias

---

### 3.6 — Viability state UI

**SALUDABLE:** Sin banner. Solo el punto verde en el header.

**ESTANCAMIENTO:** Banner amarillo sticky en el top del dashboard:
```
⚠️ Tu proyecto lleva 8 semanas sin avanzar. [Ver las 3 opciones →]
```

**CRÍTICO:** Banner rojo que NO desaparece hasta que el usuario elige una path:
```
🔴 Tu modelo necesita revisión estratégica. [Iniciar revisión — obligatorio]
```

Al entrar en modo CRÍTICO: nueva creación de OBVs/tareas bloqueada hasta que se reconoce el estado.

---

### 3.7 — Empty states para cada engine

Diseñar estados vacíos específicos (no genéricos):

| Situación | Empty State |
|-----------|-------------|
| Phase score: 0 datos | "Completa tu primera validación para activar el motor de fase" |
| Probability: < semana 2 | "Tu probabilidad se activa a partir de la semana 3" |
| Org Engine: solo | "Eres el único, pero no estás solo. Optimus monitorea tu carga." |
| Org Engine: equipo, 0 datos | "Añade a tu equipo para activar el motor organizacional" |
| Function Coverage: vacío | "¿Quién hace qué? Asigna funciones a los miembros de tu equipo." |
| Benchmarks: no disponible | "Los benchmarks se activan cuando tu sector tiene datos suficientes" |

---

### 3.8 — Modo Desbloqueo UX

**Originado en:** chatttt2.txt. Activado cuando se detecta `behavioral_block`.

El sistema detecta que el founder lleva N semanas evitando una acción específica (ej: nunca habla con clientes, evita cerrar deals, siempre postpone tareas de finanzas).

**"Modo Desbloqueo" — 7 días:**
- Duración fija: 7 días
- 1 objetivo único (no negociable)
- Máximo 3 tareas en ese período
- Obligatorio 1 experimento/test real
- Al final: Optimus hace check-in: "¿Completaste el test? ¿Qué aprendiste?"

UX: modo visual distinto en el dashboard durante los 7 días. Resto de features atenuadas (no bloqueadas).

---

### 3.9 — "Cost of Ignoring" visualization

**Originado en:** chatttt2.txt.

Cuando Optimus hace una recomendación que el usuario ignora repetidamente, después de 2 rechazos mostrar:

```
┌──────────────────────────────────────────────────────────┐
│  Si actúas ahora:    Trayectoria A → [gráfico ascendente] │
│  Si sigues igual:    Trayectoria B → [gráfico plano]      │
│                                                            │
│  Diferencia estimada en 90 días: X leads, Y revenue       │
└──────────────────────────────────────────────────────────┘
```

No es amenaza. Es visualización de oportunidad perdida. Datos reales del motor.

---

### 3.10 — Weekly Review digest UI (en-app)

Además del email (Appendix C de ENGINE_DESIGN.md), el digest debe existir como vista in-app:
- Accesible desde el sidebar: "Resumen Semanal"
- Muestra el digest del domingo (formato ENGINE_DESIGN.md Appendix C)
- Historial de semanas anteriores navegable
- Acción rápida: "Confirmar mis 3 acciones para esta semana"

---

### 3.11 — Build Mode vs Rescue Mode

**Originado en:** chatttt2.txt.

El "motor" tiene 2 estados operacionales:

**Build Mode** (estado normal):
- Objetivo: construir, validar, escalar
- Optimus: proactivo, sugiere próximos pasos
- Playbooks: expansión y crecimiento

**Rescue Mode** (activado por Viability Engine en ESTANCAMIENTO/CRÍTICO):
- Objetivo: estabilizar y recuperar
- Optimus: enfocado en 1 cosa a la vez
- Playbooks: tracción de emergencia, cash generation, team alignment
- UI: paleta visual diferente (no alarmante, pero distinta)
- Duración: máximo 12 semanas → si no recupera → Viability CRÍTICO

Transición Build → Rescue: automática por Viability Engine
Transición Rescue → Build: 4 semanas consecutivas con probability ≥ 60

---

### 3.12 — Dynamic phase horizon

**Originado en:** chatttt2.txt.

En lugar de mostrar un deadline fijo ("completarás Fase 2 en 8 semanas"), mostrar una trayectoria:

```
Al ritmo actual:  ────────────────────────────── [Fase 3 en ~14 semanas]
Ritmo objetivo:   ──────────── [Fase 3 en ~6 semanas]
Diferencia:       Si completas [acción X] podrías acortar en 8 semanas
```

Dinámico: se actualiza cada semana según execution_rate real.

---

### 3.13 — Phase transition UX

Cuando Phase Engine propone avanzar de fase (score ≥ 75% + hard signal):

1. Notificación especial (celebratoria pero sustantiva)
2. Vista de confirmación:
   - "Estás listo para Fase 3: Operación"
   - Resumen de lo logrado en Fase 2
   - Preview de los 3 nuevos Outcomes de Fase 3
   - Botón: "Confirmar avance"
3. Post-confirmación: animación + "Bienvenido a Fase 3"
4. Primera sugerencia de Optimus para Fase 3
5. Features desbloqueadas por nueva fase aparecen marcadas como "Nuevo"

---

### 3.14 — Notification center renovado

El notification center actual necesita adaptarse a los 5 layers:
- Filtros por layer: Operacional / Fase / Probabilidad / Viabilidad / Organización
- Indicador de prioridad visual (crítico = rojo, alto = naranja, medio = amarillo, bajo = gris)
- Snooze (7 días) en cada notificación
- Agrupamiento: máximo 5/día (hard cap)
- Digest dominical substituye notificaciones Layer 3 de la semana

---

## TIER 4: Sistema de Roles — Fix Crítico

> **BUGS ACTUALES:** InviteMemberWizard = simulación pura (setTimeout). project_members.role nunca se asigna desde ningún flujo. calculate_role_performance_score ignora el parámetro role. Dos sistemas de roles paralelos sin conexión.
> **Depende de:** TIER 0.8 (tablas), TIER 1.11 (role → Phase Score)
> **Tipo:** Backend + Frontend — fixes de código existente

### 4.1 — Fix InviteMemberWizard — persistir datos reales

Archivo: `src/components/roles/InviteMemberWizard.tsx`

El `handleSubmit` actual usa `setTimeout` de simulación. Reemplazar con:
1. Mutación real a `project_members` (INSERT o UPDATE)
2. Guardar el campo `role` (specialization_role ENUM)
3. Guardar `is_lead` si se selecciona
4. En caso de error: mostrar toast de error real, no de éxito falso
5. Post-éxito: invalidar query de `project_members`

---

### 4.2 — Unificar los 2 sistemas de roles

**Problema actual:**
- `project_roles` table: descripciones de rol generadas por IA (AI job descriptions)
- `project_members.role`: ENUM de especialización (sales/finance/ai_tech/etc.)

Son dos cosas distintas que el wizard mezcla.

**Solución:**
- `project_roles` → renombrar conceptualmente a "role_descriptions" o "role_profiles" (descripciones para atraer miembros)
- `project_members.role` → es la especialización real (lo que se asigna al invitar)
- El wizard: al seleccionar un `project_role` para el invite, mapear automáticamente al `specialization_role` ENUM correspondiente

Crear mapping table si es necesario:
```sql
-- O simplemente añadir campo a project_roles:
ALTER TABLE project_roles ADD COLUMN maps_to_specialization specialization_role;
```

---

### 4.3 — Fix calculate_role_performance_score — usar el parámetro role

La función SQL actual recibe `_role_name TEXT` pero usa siempre la misma fórmula genérica:
```sql
score = (obvs_count × 10) + (kpis_count × 5) + (tasks_completed × 2)
```

Reemplazar con las 6 fórmulas diferenciadas de ENGINE_DESIGN.md §7.2:
- SALES: peso en leads_closed_won + CRM advancement
- FINANCE: peso en cash_flow_accuracy + collections
- MARKETING: peso en leads_generated + conversion_rate
- OPERATIONS: peso en tasks_on_time + processes_documented
- AI_TECH: peso en mvp_milestones + delivery_velocity
- STRATEGY: peso en OKRs_on_track + pivots_documented

---

### 4.4 — Añadir leader_id a tasks table

```sql
ALTER TABLE tasks ADD COLUMN leader_id UUID REFERENCES profiles(id);
```

Actualizar el task creation form:
- Campo "Ejecutor" (assignee_id) — quien hace el trabajo
- Campo "Líder" (leader_id) — quien es responsable del resultado
- Validación: leader ≠ executor (enforced)
- En solo mode: leader_id = null (no mostrar el campo)

---

### 4.5 — Function Coverage: implementar las 6 funciones

**Originado en:** chatttt2.txt.

Las 6 funciones estructurales (diferentes de los 6 roles de especialización):

| Función | Descripción | Ejemplo de quien la cubre |
|---------|-------------|---------------------------|
| Demand Generation | Generar demanda / awareness | Marketing, Growth |
| Closing | Cerrar ventas | Sales |
| Cash Control | Controlar finanzas | Finance, founder |
| Delivery/Ops | Entregar el producto/servicio | Operations, Tech |
| Direction/Strategy | Estrategia y dirección | Founder, Strategy |
| Automation/Tech | Automatizar y construir tech | Tech, AI |

**Diferencia clave:** Un mismo miembro puede cubrir 2-3 funciones. Una función puede estar cubierta por múltiples miembros. Esto es más flexible que el sistema de roles.

Implementar `project_function_coverage` (tabla ya definida en TIER 0.8).

---

### 4.6 — Role emergence desde comportamiento

**Originado en:** chatttt2.txt.

No obligar a asignar roles desde el inicio. Observar durante 2-4 semanas quién hace qué:
- ¿Quién crea más OBVs de tipo revenue? → sugerir Sales role
- ¿Quién completa más tareas de tipo finance? → sugerir Finance role
- ¿Quién tiene más actividad en CRM? → sugerir Sales role

Después de 2 semanas: "Optimus detectó que [Nombre] actúa principalmente como [rol]. ¿Quieres asignarlo oficialmente?"

El sistema guarda la sugerencia y el usuario confirma/rechaza.

---

### 4.7 — Role change UX

Si un miembro cambia de rol (raro pero posible):
1. Preservar historial de performance del rol anterior
2. El performance score del nuevo rol empieza desde 0 pero con nota "Rol anterior: [X] · Score anterior: [Y]"
3. Notificación al proyecto: "El rol de [Nombre] cambió de [X] a [Y]"
4. Phase Score se recalcula con nueva distribución de critical roles

---

### 4.8 — Empty role display

Si un rol crítico para la fase actual está vacío:
- En la vista de equipo: mostrar el slot vacío con estado "Rol sin cubrir"
- Tooltip: "Este rol es crítico en Fase [N]. Sin él, tu Phase Score tiene una penalización de -X puntos."
- CTA: "¿Quieres cubrir este rol? Invita a alguien o asúmelo tú."
- Si el founder lo asume → asignar founder con flag `is_also_covering_role = true`

---

## TIER 5: Optimus — Psicología del Sistema

> **Depende de:** TIER 1 (engines) + TIER 2 (onboarding) + TIER 4 (roles)
> **Tipo:** IA (prompts) + UX + Backend (decision tracking)

### 5.1 — Definir el carácter completo de Optimus

**Gap crítico:** El tono, personalidad y voz de Optimus están completamente indefinidos en código y diseño.

**Tarea:** Crear documento `OPTIMUS_CHARACTER.md` con:
- **Quién es:** Mentor estratégico senior con experiencia en startups. No es un chatbot. Es un advisor con criterio.
- **Qué NO es:** Un motivational speaker. No usa frases vacías. No celebra cosas que no merecen celebración.
- **Tono:** Directo pero cálido. Dice las cosas que el founder necesita escuchar, no las que quiere escuchar.
- **Lenguaje:** Español natural, no corporativo. Sin jerga innecesaria.
- **Límites:** No hace promesas. No predice. Trabaja con datos, no con esperanza.

Ejemplos de respuestas:
- MAL: "¡Excelente avance! Sigues en el camino correcto."
- BIEN: "Cerraste 2 deals esta semana. El patrón de lo que funcionó: contacto directo por WhatsApp. Replícalo."

---

### 5.2 — Optimus context packet en todas las conversaciones

El sistema inyecta en cada conversación con Optimus el contexto completo del motor (ENGINE_DESIGN.md Appendix B):
```json
{
  "current_phase": 2,
  "phase_score": 62,
  "phase_state": "friccion",
  "probability_score": 54,
  "probability_trend": "declining",
  "viability_state": "saludable",
  "bottleneck_role": "sales",
  "economic_profile": { "sales_cycle": "medio", "monetization": "suscripcion", "capital": "bajo" },
  "user_role": "strategy",
  "weeks_in_current_phase": 6,
  "active_blocks": ["clarity_block"],
  "optimus_mode": "estandar",
  "last_ritual_completed": "2026-02-10"
}
```

Optimus responde diferente según este contexto. No responde genérico.

---

### 5.3 — Detection de patrones psicológicos

**Originado en:** chatttt2.txt.

El sistema detecta silenciosamente:

**Patrón de evitación estratégica:**
- Mismo tipo de tarea/OBV postponeado N veces
- Sesiones de Optimus sin acciones resultantes
- Trigger: activar Modo Desbloqueo (TIER 3.8)

**Exceso de optimismo:**
- Execution rate real sistemáticamente por debajo de compromisos
- Revenue actuals < proyecciones propias > 2 ciclos consecutivos
- Decisiones tomadas ignorando la recomendación de Optimus con frecuencia
- Trigger: Optimus dice explícitamente: "Noto que tus proyecciones tienden a ser más optimistas que los resultados. ¿Hablamos de eso?"

**Exceso de conservadurismo:**
- Score alto pero el founder retrasa avance de fase
- Múltiples oportunidades de venta sin acción
- Sistematicamente rechaza recomendaciones de escala
- Trigger: "Tus números muestran que estás listo para el siguiente nivel. ¿Qué te está frenando?"

---

### 5.4 — Structural block detection

**Originado en:** chatttt2.txt.

Los 4 tipos de bloqueos estructurales:

| Block Type | Señal | Trigger |
|-----------|-------|---------|
| `clarity_block` | Hipótesis cambia cada semana, no hay foco | 3+ cambios de hipótesis en 4 semanas |
| `traction_block` | Actividad alta pero 0 avance en outcomes | execution_rate alta + fase_score sin moverse 6 semanas |
| `structural_block` | Falta un recurso crítico (rol, capital, tech) | critical_role vacío + capital_intensity alta + no progress |
| `behavioral_block` | Patrón de evitación específica | mismo elemento evitado N veces |

Cuando se detecta: crear registro en `strategic_blocks` + informar a Optimus en context packet.

---

### 5.5 — Conectar SWOT/Competitors → structural_block

**Gap identificado por Claude:** Los módulos de SWOT y análisis de competidores existen pero no conectan con la detección de bloques estructurales.

**Tarea:** Si SWOT detecta una debilidad crítica que no está siendo atendida → marcar como posible `structural_block`. Si hay un competidor con ventaja significativa en el área de menor score → añadir al contexto de Optimus.

---

### 5.6 — Decision Accuracy Index (interno)

**Originado en:** chatttt2.txt.

El sistema trackea todas las recomendaciones de Optimus y si fueron aceptadas o rechazadas. 30 días después, evalúa el resultado:

```
decision_accuracy = (
  casos donde seguir recomendación = mejor resultado / total recomendaciones seguidas
)
```

**IMPORTANTE:**
- **No mostrar al usuario nunca** (evita manipulación o inseguridad)
- Solo uso interno para mejorar los prompts de Optimus
- Si accuracy < 60% → revisar el prompt de recomendaciones para ese tipo

Guardar en `decision_events` (tabla definida en TIER 0.8).

---

### 5.7 — Protocol system: Playbook base + AI adaptation

**Originado en:** chatttt2.txt.

Cada proyecto tiene:
- 1 playbook principal activo (metodología probada)
- Máximo 1 playbook secundario simultáneamente
- IA adapta el playbook al contexto específico del proyecto

Ejemplo:
- Playbook base: "Lean Customer Discovery" (pasos fijos, probados)
- AI adaptation: Optimus adapta la pregunta de entrevista según el sector/país del proyecto

La IA nunca reemplaza el playbook. Lo adapta en lenguaje y contexto, pero no cambia los pasos.

---

### 5.8 — Proyecto "graduation" — estado de éxito

**Gap identificado por Claude:** El sistema nunca define qué pasa cuando un proyecto "termina bien."

**Tarea:** Definir el estado de graduación:
- Condición: Fase 4 mantenida por ≥ 12 semanas con probability ≥ 75%
- Optimus propone: "Has completado el ciclo de Optimus. Tu proyecto está en escala sostenida."
- Opciones: Archivat como "Completado con éxito" / Continuar en modo mantenimiento / Crear proyecto hijo (expansión)
- El proyecto graduado aparece en el portfolio del usuario con badge

---

### 5.9 — Detección de patrón del Optimus por modo

Según el modo activo (Exploración/Estándar/Estricto):

**Exploración:** Optimus hace preguntas más abiertas. "¿Qué más podrías explorar?" Tolera ambigüedad.

**Estándar:** Optimus equilibra exploración y ejecución. Pregunta y también dirige.

**Estricto:** Optimus es directo y exigente. "No hay avance desde hace 3 semanas. Necesitas una decisión hoy."

Implementar como parámetro en el system prompt de Optimus.

---

### 5.10 — Patrón de evitación → escalada progresiva

```
Semana 1: Optimus pregunta suavemente
Semana 2: Optimus nombra el patrón directamente
Semana 3: Modo Desbloqueo activado (automático)
Semana 4 sin desbloqueo: structural_block marcado como behavioral
```

---

### 5.11 — Primeras sesiones de Optimus por fase

Diseñar los primeros mensajes de Optimus cuando se entra en cada fase:
- **Fase 1:** "Tu misión ahora es encontrar un problema real. No una solución. Un problema. ¿Con quién puedes hablar esta semana?"
- **Fase 2:** "Tienes una hipótesis. Ahora necesitas alguien que pague por ella. ¿Quién es tu primer intento de venta?"
- **Fase 3:** "Tienes tracción. El riesgo ahora es crecer sin sistema. ¿Qué procesos repetitivos necesitas documentar primero?"
- **Fase 4:** "El riesgo de Fase 4 es depender de ti. ¿Qué puedes dejar de hacer tú esta semana?"

---

### 5.12 — Respuesta a la pregunta pendiente de chatttt2.txt

La última pregunta de ChatGPT (línea 7143):
> "¿Quieres que el sistema detecte patrones de 'exceso de optimismo' o 'exceso de conservadurismo' en la toma de decisiones del founder y lo señale explícitamente?"

**Respuesta de diseño:** Sí, y ya está especificado en TIER 5.3. El sistema lo detecta y Optimus lo nombra explícitamente — pero siempre desde datos, nunca como juicio personal. No es "eres demasiado optimista" sino "tus proyecciones han sido X% más altas que los resultados en los últimos 3 ciclos. ¿Ajustamos cómo proyectamos?"

---

## TIER 6: Notificaciones — Layers 2–5

> **Depende de:** TIER 1 (engines generando datos)
> **Layer 1 ya funciona. Construir layers 2–5.**

### 6.1 — Layer 2: Phase Engine notifications (6 tipos)

Implementar en `trigger-engine-notifications`:
- `phase_score_warning` — score < 50%
- `phase_score_critical` — score < 30%
- `phase_advance_ready` — score ≥ 75% + hard signal
- `phase_advanced` — transición confirmada
- `phase_regression_warning` — 4 semanas < 50%
- `phase_regressed` — fase decrementada

---

### 6.2 — Layer 3: Probability Engine notifications (4 tipos)

- `probability_drop` — caída >15 puntos en una semana
- `probability_critical` — score < 30 por 2 semanas
- `probability_high` — score ≥ 80 por primera vez
- `probability_input_zero` — cualquier input en 0

---

### 6.3 — Layer 4: Viability Engine notifications (5 tipos)

- `viability_stagnation_warning` — 6 semanas < 50%
- `viability_stagnation` — 8 semanas (obligatorio)
- `viability_critical` — 12 semanas (bloquea nuevas tareas/OBVs)
- `viability_path_chosen` — usuario elige una path
- `viability_recovery` — recuperación confirmada

---

### 6.4 — Layer 5: Org Engine notifications (6 tipos, team-only)

- `org_capacity_warning` — miembro > 80%
- `org_capacity_critical` — miembro > 95%
- `org_bottleneck_detected` — rol > 60% OBVs
- `org_role_empty_warning` — rol crítico vacío 2+ semanas
- `org_role_empty_critical` — rol crítico vacío 4+ semanas
- `org_challenge_suggested` — bottleneck sin challenge activo

---

### 6.5 — Notification volume control

Implementar hard caps:
- Máximo 5 notificaciones/día por proyecto (priorización por severidad)
- Máximo 15/semana
- Snooze individual: 7 días
- Digest dominical: agrupa Layer 3 de toda la semana en 1 mensaje
- Archivado: nunca borrar, siempre archivable

---

### 6.6 — Email channel para Layer 2 y 4

Implementar envío de email (via Resend o similar) para:
- Phase transitions (Layer 2: `phase_advance_ready`, `phase_regressed`)
- Viability alerts (Layer 4: `viability_stagnation`, `viability_critical`)

NO enviar email para Layer 1 (ya en-app), Layer 3 (ruido), Layer 5 (interno).

---

## TIER 7: Contenido y Playbooks

> **Depende de:** TIER 5 (Optimus character definido)
> **Tipo:** Contenido estratégico + AI prompts

### 7.1 — Playbooks library v1

Definir y escribir los playbooks base:

**Playbooks de Build Mode:**
1. Lean Customer Discovery (Fase 1)
2. Revenue Validation Sprint (Fase 2)
3. Repeatable Sales Playbook (Fase 2/3)
4. Operations Systemization (Fase 3)
5. Scaling Without Founder (Fase 4)

**Playbooks de Rescue Mode:**
1. Emergency Cash Generation (< 60 días de runway)
2. Pivot Segment Protocol (cambiar quién compra)
3. Pivot Value Protocol (cambiar qué se vende)
4. Team Alignment Crisis (equipo desalineado)
5. Solo Founder Burn Recovery (agotamiento)

Para cada playbook: nombre, cuándo activar, pasos (3–7 pasos), KPIs de éxito, duración estimada.

---

### 7.2 — Microcopy para todos los estados del motor

Escribir los textos exactos (en español) para:
- Cada estado de Viability (saludable/estancamiento/crítico)
- Cada transición de fase (advance + regression)
- Cada empty state (definidos en TIER 3.7)
- Cada notificación de los 4 layers
- Los 3 Paths del Viability Engine
- El Weekly Digest (formato Appendix C de ENGINE_DESIGN.md)
- El Modelo Estratégico (cabeceras y labels)

**Principio:** Nunca usar "fracaso", "abandonar", "imposible". Siempre frame de aprendizaje y estrategia.

---

### 7.3 — Prompts de Optimus por contexto

Escribir los system prompts de Optimus para cada combinación crítica:
- Fase 1 + clarity_block
- Fase 2 + traction_block + revenue_momentum bajo
- Fase 3 + bottleneck en Sales
- Fase 4 + founder > 50% de tareas críticas
- Modo Estricto + 3 semanas sin avance
- Viability ESTANCAMIENTO + path selection
- Post-ritual + ciclo 🔴 Crítico

---

### 7.4 — Benchmarks v1 curados (si se elige Opción A del TIER 0.7)

Definir valores concretos para benchmarks por:
- Fase 1: número de entrevistas, tiempo en fase, % con hipótesis documentada
- Fase 2: semanas hasta primera venta, % que hacen pivot, conversion rate inicial
- Fase 3: MoM growth promedio, team size típico, OKR adoption rate
- Fase 4: % revenue sin founder, churn rate, team to revenue ratio

Fuentes: CB Insights, First Round Capital reports, Carta benchmarks, Stripe Atlas data, Endeavor LATAM.

---

### 7.5 — Discovery Path content (Fase 1 sub-estado)

Contenido específico para el sub-estado "Sin hipótesis" de Fase 1:
- Template de entrevista de descubrimiento (5 preguntas)
- Template de hipótesis (problema / segmento / propuesta de valor)
- Persona canvas simplificado
- Guía: "Cómo ir de idea a primera hipótesis en 7 días"

---

### 7.6 — 5 preguntas del Strategic Reset Ritual

Las 5 preguntas exactas que Optimus hace en cada ritual de 4 semanas:
1. "De todo lo que hiciste este ciclo, ¿qué generó movimiento real?"
2. "¿Qué evitaste hacer? ¿Por qué?"
3. "¿Qué creyó tu sistema que funcionaría y no funcionó?"
4. "¿Qué aprendiste que no esperabas aprender?"
5. "¿Cuál es tu apuesta más importante para el próximo ciclo?"

---

### 7.7 — Weekly Loop vs Strategic Reset Ritual — coordinación

**Gap identificado por Claude:** El Weekly Loop (domingo) y el Reset Ritual (cada 4 semanas) pueden solaparse o contradecirse.

**Diseño de coordinación:**
- Semanas 1, 2, 3: Weekly Loop normal (resumen + 3 acciones)
- Semana 4: Weekly Loop + Ritual (el ritual reemplaza la parte de "3 acciones" del loop)
- El ritual puede postponerse 1 semana si el usuario está en Modo Desbloqueo
- No pueden estar activos simultáneamente

---

## TIER 8: Features por Fase y Modo

> **Depende de:** TIER 1 + TIER 2 + TIER 3 completados
> **Tipo:** Arquitectura de feature flags + UX

### 8.1 — Auditoría completa de las 223 features

Clasificar CADA feature existente por:
1. **Fase mínima requerida** (1/2/3/4)
2. **Work mode** (individual/equipo_pequeño/equipo_establecido)
3. **Viability state** (disponible en saludable/estancamiento/crítico)
4. **Mode** (Build/Rescue)
5. **Priority** (core/secondary/advanced)

Resultado esperado: tabla completa `feature_matrix.md` con los 223 items clasificados.

---

### 8.2 — Feature visibility system en código

Implementar sistema en el frontend que, dado el estado actual del proyecto:
```typescript
interface FeatureVisibility {
  featureId: string;
  visible: boolean;
  reason?: string; // "Disponible en Fase 2" | "Solo en equipo"
  teaser?: boolean; // Mostrar bloqueada con preview
}
```

Cada feature tiene su configuración en `src/config/features.ts` expandida con los 5 parámetros de clasificación.

---

### 8.3 — Teaser UX para features bloqueadas

Features no disponibles en la fase/modo actual se muestran como:
- Visibles en sidebar pero con candado
- Al hacer clic: "Esta feature se activa en Fase 3 — a tu ritmo actual, en ~X semanas"
- NO bloquear con paywall si no hay planes (ENABLE_PAYMENTS = false)
- Bloquear solo por lógica de fase/modo

---

### 8.4 — Analytics módulo: evitar redundancia con engines

**Gap identificado por Claude:** El módulo de Analytics puede ser redundante con lo que los engines ya calculan.

**Tarea:** Revisar qué hace Analytics actualmente y distinguir:
- **Cosas que el engine ya calcula** → Analytics las muestra como visualización del engine (no recalcular)
- **Cosas que el engine no calcula** → Analytics tiene valor propio (benchmarks comparativos, tendencias históricas largas, exportación)

Evitar tener dos fuentes de verdad para los mismos datos.

---

### 8.5 — Feature matrix: qué va en MVP v1

Ver TIER 12 para la definición completa del MVP. Aquí: asegurar que el feature flag system soporte versiones:
```typescript
FEATURES = {
  PHASE_ENGINE: { enabled: true, sinceVersion: '2.0' },
  PROBABILITY_ENGINE: { enabled: true, sinceVersion: '2.0' },
  SIMULATION_MODE: { enabled: false, sinceVersion: '3.0' }, // v3
  MULTI_PROJECT: { enabled: false, sinceVersion: '2.1' },   // v2.1
}
```

---

### 8.6 — Feature: Historial del proyecto (timeline)

**Originado en:** ChatGPT bloque 10.

Vista timeline del proyecto mostrando:
- Fases completadas (fecha inicio/fin + score final)
- Pivotes tomados (con motivo)
- Decisiones estratégicas (de `decision_events`)
- Ciclos estratégicos y su evaluación
- Hitos: primera venta, primer equipo, primer OBV validado
- Exportable a PDF

Accesible desde: "Mi Modelo" → tab "Historia"

---

## TIER 9: Sistemas Avanzados

> **Depende de:** TIER 1–8 funcionales
> **Tipo:** Features adicionales de valor diferencial

### 9.1 — Múltiples proyectos

**Gap identificado por Claude:** No está definido cómo funciona el sistema cuando un usuario tiene múltiples proyectos.

**Diseño:**
- Selector de proyecto en el header (ya existe: `SelectProjectPage`)
- Cada proyecto tiene su propio estado completo de los 4 engines
- Dashboard multiproyecto: vista resumen de todos los proyectos del usuario
- Límite por plan: 1 proyecto (Free), 3 proyectos (Pro), ilimitados (Business)
- Los engines corren independientemente por proyecto

---

### 9.2 — Proyecto pausado

Estado `paused` para proyectos (Path 3 de Viability Engine):
- Todos los datos preservados
- Los engines dejan de recalcular (no consumir compute)
- Se puede reactivar en cualquier momento
- Al reactivar: Phase Score se restaura al 40% del valor pre-pausa
- Notificación mensual: "Tu proyecto [X] sigue pausado. ¿Quieres retomarlo?"

---

### 9.3 — Proyecto archivado (cierre definitivo)

Diferente de pausa. Definitivo:
- Estado `archived` (no `deleted`)
- Datos preservados indefinidamente
- No se puede reactivar directamente (requiere crear nuevo proyecto)
- En el portfolio del usuario: aparece como "Cerrado" con fecha y último estado
- No hay emails ni notificaciones para proyectos archivados

---

### 9.4 — Member deletion y redistribución

**Edge case del TIER 11.**

Si un miembro se va del proyecto:
1. Sus tareas activas se quedan sin assignee (no se borran)
2. Optimus sugiere redistribución: "3 tareas de [Nombre] quedaron sin asignar. ¿A quién las asignas?"
3. Sus OBVs activos se transfieren al miembro de mayor rol en esa función
4. Su performance history se preserva
5. El Org Engine recalcula capacidad inmediatamente

---

### 9.5 — Project model change

**Edge case.** Si el modelo de negocio cambia radicalmente (pivot):
- El Economic Profile se recalcula
- Los thresholds de los engines se ajustan
- El historial de fase anterior se preserva como "Fase previa al pivote"
- Optimus: "Has cambiado tu modelo. Ajustando los parámetros del sistema..."
- Los OBVs y tareas del modelo anterior se archivan (no borran)

---

### 9.6 — Export functionality

- Export del Modelo Estratégico (PDF/Excel)
- Export del historial del proyecto (PDF)
- Export de financial projections (Excel — ya parcialmente existe)
- Export de KPIs report
- Para uso en pitch decks, reportes de inversores, retrospectivas

---

### 9.7 — Iteration Velocity tracking (una vez definido en TIER 0.1)

Implementar el cálculo y mostrar como metric en el Weekly Digest y en el breakdown de Probability Engine.

Mostrar también tendencia: "Tu velocity de iteración subió un 30% respecto al ciclo anterior."

---

### 9.8 — Integración Slack mejorada

La integración de Slack existe pero conectarla a:
- Notificaciones Layer 2 (phase transitions) → canal del equipo
- Notificaciones Layer 4 (viability alerts) → canal privado del founder
- Weekly Digest → canal del equipo el domingo
- Bottleneck detection → canal del equipo

---

## TIER 10: Monetización y Planes

> **Estado actual:** ENABLE_PAYMENTS = false. Diseñar antes de activar.
> **Depende de:** TIER 8.1 (feature matrix) para saber qué va en cada plan

### 10.1 — Definir los tiers de plan

**Propuesta inicial a validar:**

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Proyectos | 1 | 3 | Ilimitados |
| Miembros | 1 (solo) | 5 | Ilimitados |
| Engines activos | Phase only | Phase + Probability | Los 4 |
| Optimus conversaciones/mes | 10 | 100 | Ilimitadas |
| Benchmarks | No | Sí | Sí + custom |
| Export | No | PDF | PDF + Excel |
| Notificaciones layers | Layer 1 | L1+L2+L4 | Todos |
| Strategic Reset Ritual | No | Sí | Sí |
| Historial | 3 meses | 12 meses | Ilimitado |

---

### 10.2 — Upgrade hints (SHOW_UPGRADE_HINTS)

Activar gradualmente:
1. Primero: telemetría de qué features usan más los usuarios Free
2. Mostrar hints solo en los momentos de mayor valor percibido
3. No interrumpir el flujo principal con upgrade prompts

---

### 10.3 — Plan limits enforcement

Implementar en el backend:
- Middleware que verifica plan_level antes de ejecutar features premium
- Si límite alcanzado: no error duro, sino redirect a upgrade page
- Mantener contadores en DB: `user_plan_usage` table

---

### 10.4 — Stripe integration

Con ENABLE_PAYMENTS = true:
- Stripe Checkout para suscripción
- Webhook para sync de estado de plan (activar/cancelar)
- Período de prueba (14 días Pro gratis)
- Cancelación → downgrade automático a Free (no borrar datos, solo limitar acceso)

---

### 10.5 — Onboarding a planes

El flujo de selección de plan ocurre:
- Después del onboarding A (Fase 2 del onboarding)
- O cuando el usuario intenta usar una feature Pro por primera vez
- Nunca interrumpir el onboarding inicial con ventas

---

## TIER 11: Edge Cases

> **Todos deben tener diseño de respuesta del sistema — no pueden quedar sin manejar**

### 11.1 — Usuario no completa el ritual (ritual ignorado)

Si el usuario no hace el Strategic Reset en la semana 4:
- Sistema lo reagenda automáticamente a semana 5
- En semana 6: Optimus lo menciona en la próxima interacción: "No hicimos el ritual de este ciclo. ¿Quieres hacerlo ahora rápido?"
- Si se ignora 3 ciclos seguidos: no se fuerza, pero se marca como `behavioral_block` potential

---

### 11.2 — Onboarding incompleto

Si el usuario completa solo la Fase A pero no la Fase B:
- El sistema funciona con datos parciales
- Los engines que pueden calcular, calculan
- Los engines que necesitan datos de Fase B → estado "datos insuficientes"
- No bloquear. Recordar suavemente.

---

### 11.3 — Datos inconsistentes en onboarding

Si Q2 dice "€50K/mes de ingresos" pero Q3 dice "0 clientes activos":
- Guardar sin bloquear
- Marcar como `data_inconsistency = true`
- Optimus en primera sesión: "Quiero entender mejor tu situación. Me dijiste que generas €50K pero sin clientes activos. ¿Cómo funciona eso?"

---

### 11.4 — Cambio radical de modelo de negocio

Si el founder decide cambiar completamente de mercado, producto y segmento:
- Trigger: usuario marca como "Pivote total" desde Settings
- Sistema pregunta: "¿Esto es un ajuste o un pivote completo?"
- Pivote completo: archiva el "Proyecto anterior" bajo el mismo ID con timestamp
- Nuevo ciclo empieza desde Fase 1 sub-estado "Con experiencia previa"
- El historial de aprendizaje se preserva y Optimus lo usa como contexto

---

### 11.5 — Miembro que nunca acepta su rol

Si se invita a un miembro y no acepta en 14 días:
- Notificación al admin: "La invitación de [Nombre] lleva 14 días sin respuesta."
- A los 30 días: invitación expirada automáticamente
- Opciones: reenviar / cancelar / invitar a otra persona para ese rol

---

### 11.6 — Solo founder llega a Fase 4

Matemáticamente problemático (ver TIER 0.3). En Fase 4:
- O4.2 requiere: "Finance, Sales, Marketing, Ops cada uno con ≥1 miembro activo"
- Impossible para solo founder

**Diseño:** En Fase 4, si work_mode = individual:
- Optimus alerta explícitamente: "Escalar en solitario más allá de este punto es un riesgo estructural"
- El O4.2 se evalúa con criterio diferente: ¿Hay freelancers/contractors para cada función?
- Los O4.1 y O4.3 tienen más peso (40% + 60%)

---

### 11.7 — Probability score Day 1 = demotivante

Ver TIER 0.4. Diseñar la solución elegida (Opción A, B, C o D) e implementarla de forma que el primer contacto del usuario con el Probability Engine sea motivador, no deflactante.

---

### 11.8 — Proyecto sin ningún movimiento durante 60 días

Edge case de abandono silencioso:
- Email a los 30 días: "¿Sigues trabajando en [Proyecto]?"
- Email a los 60 días: "Tu proyecto ha estado inactivo. ¿Quieres pausarlo o seguimos?"
- A los 90 días: notificación in-app única. Después: nada más. No spamear.

---

### 11.9 — Datos de revenue no confiables (auto-declarados)

El sistema confía en los datos que el founder introduce. No tiene forma de verificar externamente (sin integración bancaria).

**Diseño:**
- Pedir evidencia adjunta cuando se registra revenue > umbral (ej: >€5K en un mes)
- Si no hay evidencia → el dato se cuenta con peso reducido en `revenue_momentum` (× 0.7)
- Peer validation puede "confirmar" un dato de revenue (sube el peso a ×1.0)

---

### 11.10 — Conflicto entre dos miembros sobre ownership de un OBV

Si dos miembros reclaman el crédito de una validación:
- Sistema asigna a quien lo creó por defecto
- Admin puede reasignar
- Ambos reciben crédito parcial si el admin lo decide (50/50 split en performance score)
- Historial de cambios preservado

---

## TIER 12: Definición del MVP Real

> **Pregunta central:** ¿Qué necesita estar funcionando para que un founder real pueda usar esto?
> **Principio:** Mejor menos y que funcione que más y roto.

### MVP v1 — Lo que debe estar funcionando en el lanzamiento

**Engine Layer:**
- [x] Phase Engine calculando (Fases 1 y 2 principalmente — donde están los usuarios early stage)
- [x] Probability Engine con los 5 inputs
- [x] Notification Layer 1 (ya existe) + Layer 2 (phase transitions)
- [ ] Viability Engine (simplificado: solo SALUDABLE / ESTANCAMIENTO — sin CRÍTICO en v1)
- [ ] Org Engine (solo capacidad básica, sin bottleneck detection en v1)

**Onboarding:**
- [x] Onboarding Fase A (10 preguntas, datos mínimos)
- [x] Location Layer capturado
- [x] Economic Profile detectado automáticamente
- [ ] Post-onboarding first 15 minutes diseñados

**UX Surface:**
- [ ] Header con los 3 indicadores
- [ ] Phase Score breakdown view
- [ ] Probability breakdown (on demand)
- [x] Notification center (ya existe, adaptar a 5 layers)
- [ ] Modelo Estratégico (sección "Mi Modelo")

**Roles:**
- [ ] Fix InviteMemberWizard (persistir datos reales)
- [ ] Fix calculate_role_performance_score (usar role parameter)
- [x] leader_id en tasks (migración simple)

**Optimus:**
- [ ] Character definido (prompt system)
- [ ] Context packet inyectado en cada conversación
- [ ] Detección de 2 tipos de bloques (clarity + traction)

**Contenido:**
- [ ] Playbooks de Build Mode (Fases 1 y 2)
- [ ] Microcopy para estados principales

**Excluido del MVP v1 (va a v2+):**
- Simulation Mode
- Decision Accuracy Index (interno)
- Strategic Reset Ritual completo
- Modo Desbloqueo
- Cost of Ignoring visualization
- Multi-proyecto
- Monetización (ENABLE_PAYMENTS sigue en false)
- Analytics redundancy cleanup
- Benchmarks externos
- Viability Engine CRÍTICO (complejidad alta, impacto en usuarios early = bajo)
- Build Mode / Rescue Mode visual distinction
- Org Engine bottleneck → Challenge suggestion

---

### Orden de construcción sugerido

```
SPRINT 1 (fundamentos sin UX visible):
  ├── TIER 0: Todas las definiciones matemáticas resueltas
  ├── TIER 0.8: Tablas de DB creadas
  └── TIER 4.1-4.4: Fixes de roles (bugs existentes)

SPRINT 2 (engines backend):
  ├── TIER 1.1-1.3: Phase Engine + Probability Engine
  ├── TIER 1.8: Economic Profile detection
  └── TIER 1.9: Cron jobs configurados

SPRINT 3 (onboarding + primera experiencia):
  ├── TIER 2.1-2.5: Onboarding rediseñado
  ├── TIER 2.8: Post-onboarding first 15 min
  └── TIER 6.1-6.2: Notifications Layer 2-3

SPRINT 4 (UX core):
  ├── TIER 3.1-3.4: Header + Phase progress + breakdowns
  ├── TIER 3.5-3.6: Regression UX + Viability state UI
  ├── TIER 3.7: Empty states
  └── TIER 3.14: Notification center renovado

SPRINT 5 (Optimus):
  ├── TIER 5.1: Character document
  ├── TIER 5.2: Context packet implementado
  ├── TIER 5.3: Block detection (clarity + traction)
  └── TIER 7.3: Prompts por contexto

SPRINT 6 (contenido):
  ├── TIER 7.1: Playbooks v1 (5 de Build)
  ├── TIER 7.2: Microcopy completo
  └── TIER 7.6-7.7: Ritual questions + Loop/Ritual coordination

SPRINT 7 (features avanzadas, post-MVP):
  ├── TIER 1.4-1.7: Engines avanzados
  ├── TIER 3.8-3.13: UX avanzada
  ├── TIER 5.4-5.12: Optimus avanzado
  ├── TIER 6.3-6.6: Notification layers 4-5
  └── TIER 9: Sistemas avanzados

SPRINT 8 (monetización):
  └── TIER 10: Completo
```

---

## Resumen ejecutivo — ¿Cuánto falta?

| Categoría | Items totales | En MVP v1 | Post-MVP |
|-----------|--------------|-----------|----------|
| Definiciones matemáticas | 8 | 6 | 2 |
| Backend / Engines | 12 | 5 | 7 |
| Onboarding / Primera experiencia | 10 | 7 | 3 |
| UX Core | 14 | 8 | 6 |
| Roles fix | 8 | 4 | 4 |
| Optimus / Psicología | 12 | 4 | 8 |
| Notificaciones | 6 | 2 | 4 |
| Contenido / Playbooks | 7 | 5 | 2 |
| Features por fase | 6 | 3 | 3 |
| Sistemas avanzados | 8 | 0 | 8 |
| Monetización | 5 | 0 | 5 |
| Edge cases | 10 | 5 | 5 |
| **TOTAL** | **106** | **49** | **57** |

---

## Lo que ChatGPT tenía y Claude añadió (delta)

Los ítems marcados como **[+Claude]** son adiciones al inventario de ChatGPT:

- **[+Claude]** Broken solo founder math → TIER 0.3
- **[+Claude]** Day 1 Probability demotivating → TIER 0.4
- **[+Claude]** OBV types audit → TIER 0.5
- **[+Claude]** CRM pipeline → Revenue Momentum gap → TIER 1.4
- **[+Claude]** Peer validation → Probability gap → TIER 1.5
- **[+Claude]** Role system bugs (InviteMemberWizard = fake) → TIER 4.1-4.4
- **[+Claude]** calculate_role_performance_score ignores role → TIER 4.3
- **[+Claude]** Two parallel role systems → TIER 4.2
- **[+Claude]** SWOT/Competitors → structural_block connection → TIER 5.5
- **[+Claude]** Analytics redundancy with engines → TIER 8.4
- **[+Claude]** Project graduation state → TIER 5.8
- **[+Claude]** Weekly Loop vs Ritual coordination → TIER 7.7
- **[+Claude]** Answer to ChatGPT's final unanswered question → TIER 5.12
- **[+Claude]** Revenue data trustworthiness problem → TIER 11.9
- **[+Claude]** Solo founder in Fase 4 math problem → TIER 11.6

---

*Generado: 2026-02-24*
*Fuentes: chattt.txt (documento fundacional ChatGPT) + chatttt2.txt (documento avanzado ChatGPT) + ENGINE_DESIGN.md (síntesis Claude) + auditoría de código Nova Hub*
*Autores: Claude Code (Anthropic) + ChatGPT (OpenAI) — revisión final: Zarko*

---

## Adiciones de chattt.txt — Resumen de lo incorporado

| Item | Sección | Estado antes |
|------|---------|-------------|
| Iteration Velocity — definición concreta | TIER 0.1 | "Pendiente de definir" → ✅ Definida |
| Risk Score formula (5 inputs, 4 niveles) | TIER 0.6 (nuevo) | No existía |
| Phase 2 thresholds exactos (3 outcomes) | TIER 0.7 (nuevo) | Solo referencia genérica |
| Economic Profile UX (tarjeta post-onboarding) | TIER 1.8 | Incompleto |
| Detección de incoherencia del modelo (4 casos) | TIER 1.9 (nuevo) | No existía |
| Historial de versiones del Economic Profile | TIER 1.10 (nuevo) | No existía |
| Idea generation con viabilidad desde min 1 | TIER 2.3b (nuevo) | Solo mencionado |
| 1 sistema con múltiples puntos de entrada (no 3 onboardings) | TIER 2.1, 2.3 | Reforzado |
