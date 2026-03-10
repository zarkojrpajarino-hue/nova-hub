# FASE 1 — MATEMÁTICA Y FUNDAMENTOS
> Documento definitivo. Cerrada: 2026-02-24.
> Toda la matemática, umbrales, fórmulas y definiciones del sistema están aquí.
> Esta fase debe estar congelada antes de tocar cualquier código o base de datos.

---

## Índice

- [F1.1 — Iteration Velocity](#f11--iteration-velocity)
- [F1.2 — evidence_quality_score](#f12--evidence_quality_score)
- [F1.3 — Capacidad del solo founder](#f13--capacidad-del-solo-founder)
- [F1.4 — Day 1 Probability](#f14--day-1-probability)
- [F1.5 — Thresholds Fase 1 (Descubrimiento)](#f15--thresholds-fase-1-descubrimiento)
- [F1.6 — Thresholds Fase 3 (Operación)](#f16--thresholds-fase-3-operación)
- [F1.7 — Thresholds Fase 4 (Escala)](#f17--thresholds-fase-4-escala)
- [F1.8 — OBV Types](#f18--obv-types)
- [F1.9 — Benchmarks v1](#f19--benchmarks-v1)
- [F1.10 — Viability Engine v1](#f110--viability-engine-v1)
- [F1.11 — Function Coverage v1](#f111--function-coverage-v1)
- [F1.12 — engine_version](#f112--engine_version)
- [F1.13 — data_completeness_score](#f113--data_completeness_score)
- [Tablas nuevas identificadas para Fase 2](#tablas-nuevas-identificadas-para-fase-2)

---

## F1.1 — Iteration Velocity

### Qué cuenta como iteración
Solo OBVs con resultado documentado (positivo o negativo).

**NO cuentan:** tareas, KPIs, reuniones, documentos, trabajo interno.

Una iteración = Hipótesis → Acción real en mercado → Resultado registrado.

### Ventana temporal
Rolling 28 días. Nunca mes calendario.

### Normalización
No se normaliza por número de miembros del equipo.
Mide velocidad de aprendizaje del proyecto, no productividad individual.

### Clasificación
```
0   → Crítico
1   → Fricción
2   → Saludable mínimo
3   → Alto rendimiento
4+  → Excelente
```

### Fórmula
```
iteration_velocity = COUNT(OBVs con resultado documentado en últimos 28 días)
velocity_score = MIN(100, iteration_velocity × 25)
```

### execution_rate
```
execution_rate =
  (velocity_score        × wV)
+ (task_completion_rate  × wT)
+ (role_execution_health × wR)

Pesos por fase (siempre suman 1.00):
  Fase 1:  wV=0.60  wT=0.25  wR=0.15
  Fase 2:  wV=0.55  wT=0.30  wR=0.15
  Fase 3:  wV=0.45  wT=0.35  wR=0.20
  Fase 4:  wV=0.35  wT=0.45  wR=0.20
```

### Integración en motores

**Phase Engine:**
- velocity = 0 → no puede avanzar de fase
- velocity ≥ 1 → puede avanzar si lo demás es fuerte
- NO es gate duro independiente; condición estructural mínima

**Probability Engine:**
- velocity vive dentro de `execution_rate` (no como variable independiente)

**Risk Score:**
- velocity = 0 durante 4 semanas → ExecutionDrop = alto → warning
- velocity = 0 durante 8 semanas → estado ESTANCAMIENTO

**Viability Engine:**
- velocity = 0 + phase_score estancado + probability < 50 durante 8 semanas → revisión estructural

### Edge cases
```
OBV creado sin resultado         → NO cuenta
OBV con resultado negativo       → SÍ cuenta
OBV duplicado                    → solo si resultado distinto
OBV editado                      → no genera nueva iteración
OBV cancelado                    → no cuenta
Proyecto pausado                 → velocity se congela (no baja)
```

---

## F1.2 — evidence_quality_score

### Fórmula principal
```
final_evidence_score = MIN(100,
  evidence_base_score × verification_multiplier × decay_factor
)
```

### evidence_base_score
```
Pago real verificable (factura, Stripe)    → 90
Contrato / LOI firmado                     → 80
Entrevista grabada                         → 75
Test landing con métricas verificables     → 70
Screenshot conversación cliente real       → 65
Encuesta estructurada                      → 55
Texto auto-declarado                       → 30
Sin evidencia                              →  0
```

### verification_multiplier
Solo se aplica el más alto — nunca se acumulan.
```
Peer validated    → ×1.15
URL externa       → ×1.10
Auto-declarado    → ×1.00
Inconsistente     → ×0.70
```

### decay_factor
```
decay_factor = MAX(0.50, 1 - ((semanas_desde_creación - 8) × 0.10))

Semanas 0–8  → 1.00  (sin decay)
Semana 9     → 0.90
Semana 10    → 0.80
Semana 13+   → 0.50  (floor)
```

### validation_strength
```
validation_raw = Σ(final_evidence_score × type_weight) / Σ(type_weight)

Pesos por tipo de OBV:
  revenue_validation   → ×1.3
  product_validation   → ×1.1
  customer_discovery   → ×1.0
  operational_system   → ×0.8

consistency_factor = MIN(1.2, 1 + (n_OBVs_validos / 10))

validation_strength = MIN(100, validation_raw × consistency_factor)
```

### Penalización O1.2
```
si n_entrevistas < 5 → O1.2_score = base × 0.5
```

---

## F1.3 — Capacidad del solo founder

### Baseline
100 unidades para todos (equipo y solo founder). Sin diferencia de baseline.

### Costes de actividad
```
                    EQUIPO    SOLO FOUNDER
OBV activo           10            7
Tarea activa          3            2
Reunión              10            6  (solo founder: solo externas)
```

### Umbrales de alerta
```
                    WARNING     CRÍTICO
Equipo               ≥75%        ≥85%
Solo founder         ≥80%        ≥92%
```

### capacity_health
```
capacity_health = MAX(0, 100 - capacity_used_percent)
```

---

## F1.4 — Day 1 Probability

### Estado inicial
```
probability_status = "INACTIVE"
display = "N/A"
```

### Condición de activación
≥2 de estos 5 inputs tienen datos reales distintos del default:
```
1. phase_score > 0
2. execution_rate > 0
3. validation_strength > 0
4. revenue_momentum con dato real
5. capacity_health con ≥1 actividad real (tarea/OBV/reunión)
   → si sin actividad: capacity_health_status = "NO_SIGNAL" (no cuenta)
```

### Mientras INACTIVE
- Sin notificaciones de probabilidad
- Sin Viability Engine
- Sin color rojo
- El sistema está en modo "arranque"

### Fórmula de probability
```
probability =
  (phase_score         × 0.35)
+ (execution_rate      × 0.20)
+ (validation_strength × 0.15)
+ (revenue_momentum    × 0.15)
+ (capacity_health     × 0.15)
= 1.00
```

---

## F1.5 — Thresholds Fase 1 (Descubrimiento)

### Hard Signal — los 3 son obligatorios
```
1. ≥10 entrevistas reales documentadas
2. ≥30% confirman el problema como frecuente y relevante
3. Problema + segmento explícitamente definidos en el sistema
```

### Definición de PIVOT
Cambio guardado en {segment, problem, value_prop} → crea registro en `strategic_model_versions`.
```
pivot_count = registros en strategic_model_versions en las últimas 4 semanas
```

### O1.1 — Volumen de entrevistas (peso: 0.40)
```
O1.1 = MIN(100, (n_entrevistas / 10) × 100)
```

### O1.2 — Validación del dolor (peso: 0.40)
```
O1.2 = MIN(100, (pain_percent / 30) × 100)

PENALIZACIÓN muestra pequeña:
  si n_entrevistas < 5 → O1.2_score = O1.2_calculado × 0.5
```

### O1.3 — Claridad del segmento (peso: 0.20)
```
Preciso + ≤1 pivot           → 100
Definido + ≤2 pivots         →  75
Amplio + 2–3 pivots          →  50
Indefinido o ≥4 pivots       →   0
```

### Fórmula Phase 1 Score
```
phase1_score = (O1.1 × 0.40) + (O1.2 × 0.40) + (O1.3 × 0.20)

≥75%    → Saludable
50–74%  → Fricción
<50%    → Crítico
```

### Alertas temporales
```
4 semanas sin entrevista         → Warning
6 semanas con <5 entrevistas     → Fricción
8 semanas con <5 entrevistas     → Crítico
Solo founder: +2 semanas en todos los umbrales
```

### Requisitos numéricos solo founder
Mismos que equipo (10 entrevistas, 30%). Sin reducción.

---

## F1.6 — Thresholds Fase 3 (Operación)

### Hard Signal — los 3 son obligatorios
```
1. ≥3 meses estables dentro de ventana de 4 meses
2. Cash flow positivo/neutral (confidence: HIGH) durante esos meses
3. ≥1 función crítica NO exclusivamente dependiente del founder
```

### Definición de "mes estable"
```
Mes 1:  siempre PASS
Mes 2:  ingresos_m2 ≥ 0.75 × ingresos_m1
Mes 3+: ingresos_mN ≥ 0.75 × AVG(m-1, m-2) AND cash_flow ≥ 0

Adicional:
  No puede haber 2 meses negativos consecutivos
  Ningún mes puede estar < -20% del promedio anterior
```

### Cash flow confidence
```
HIGH: costes reales registrados en ≥2 de 3 meses → puede avanzar a F4
LOW:  margen estimado por model_type → puede operar pero NO gradúa a F4

Márgenes estimados por model_type:
  SaaS → 75% | Service → 50% | Physical product → 35%
  Marketplace → 60% | Agency → 55% | Unknown → 50%
```

### O3.1 — Estabilidad temporal (peso: 0.40)
```
O3.1 = MIN(100, (stable_months_in_window / 3) × 100)
```

### O3.2 — Execution health (peso: 0.35)
```
O3.2 = (capacity_health × 0.50) + (execution_rate × 0.30) + (bloqueo_penalty × 0.20)

bloqueo_penalty = MAX(0, 100 - (friction_count × 15) - (critical_count × 40))

Si velocity = 0 durante ≥4 semanas:
  → O3.2_score = MIN(O3.2_score, 40)
```

### O3.3 — Independencia del founder (peso: 0.25)
```
≥1 función operada por otra persona            → 100
Procesos documentados (sin otro operador)      →  60
Founder central, sin sistema                   →  20

Solo founder: max O3.3 = 60 → cap natural phase3_score = 90
```

### Fórmula Phase 3 Score
```
phase3_score = (O3.1 × 0.40) + (O3.2 × 0.35) + (O3.3 × 0.25)

≥75%    → Saludable
50–74%  → Fricción
<50%    → Crítico
```

### Alertas temporales
```
8 sem sin 2 meses consecutivos estables  → Warning
12 sem sin estabilidad                   → Fricción
20 sem sin estabilidad                   → Crítico estructural
Solo founder: +2 semanas en todos los umbrales
```

### Duración esperada: 8–16 semanas

---

## F1.7 — Thresholds Fase 4 (Escala)

### Hard Signal — 6 condiciones obligatorias
```
1. ≥3 meses con crecimiento ≥10% dentro de ventana de 4 meses
2. Sin 2 meses negativos consecutivos
3. Sin ningún mes por debajo de -10%
4. Promedio de los 4 meses ≥10%
5. Margen bruto estable: variance_margen ≤ 0.15
6. Sin critical_block activo durante el período
```
*capacity_health se evalúa como variable continua en O4.2, no como gate duro.*

**Tolerancia ventana:** rolling 4 meses. Hard signal = ≥3 de 4 meses cumplen condiciones individuales.

### variance_margen (definición exacta)
```
variance_margen = (max_margen_4m - min_margen_4m) / promedio_margen_4m
(rango relativo sobre el promedio; unidad: decimal — 0.15 = 15%)
```

### O4.1 — Crecimiento sostenido (peso: 0.40)
```
O4.1 = MAX(0, MIN(100, (avg_growth_4m / 0.15) × 100))

Ejemplos:
   5% → 33  |  10% → 67  |  15% → 100  |  20% → 100 (cap)  |  -5% → 0 (floor)
```

### O4.2 — Execution & margin health (peso: 0.35)
```
margin_stability_score = MAX(0, MIN(100, (1 - variance_margen) × 100))

O4.2 = (capacity_health        × 0.40)
     + (execution_rate         × 0.30)
     + (margin_stability_score × 0.30)

Suma de pesos: 1.00 ✅
```

### O4.3 — Independencia del founder (peso: 0.25)
```
≥3 funciones críticas en manos de miembros distintos → 100
≥2 funciones críticas delegadas                      →  70
Founder central, sin sistema                         →  30

Solo founder:
  Max O4.3 = 70 (sin automatización estructural)
  Con automation_score ≥70 en ≥2 funciones con coverage_level = strong → max 100

Cap natural solo (sin automatización): 100×0.40 + 100×0.35 + 70×0.25 = 92.5
```

### Fórmula Phase 4 Score
```
phase4_score = (O4.1 × 0.40) + (O4.2 × 0.35) + (O4.3 × 0.25)

≥80%    → Healthy scale
60–79%  → Fragile scale
<60%    → Unstructured growth
```

### Definición: automation_score
```
automation_score =
    (sistema_automatizado_real    ? 40 : 0)
  + (proceso_con_checklist_activo ? 35 : 0)
  + (metricas_auto_generadas      ? 25 : 0)

sistema_automatizado_real = TRUE si cumple ≥1 categoría:
  A) Integración externa vía API/webhook (sin intervención manual)
  B) Pipeline de datos automatizado (event/scheduler, sin intervención manual)
  C) Sistema de notificaciones auto-disparadas (rule-based)
  D) Proceso recurrente con scheduler (cron/trigger)

NO califica: dashboards manuales, docs Notion, plantillas, scripts manuales
REQUISITO ADICIONAL: conectado al proyecto + ejecutado ≥1 vez en últimos 30 días

Umbral ≥70 requiere sistema_automatizado_real:
  sistema + proceso = 75 ✅  |  sistema + métricas = 65 ✗  |  proceso + métricas = 60 ✗
```

### Definición: coverage_level
```
coverage_score =
    (owner_user_id IS NOT NULL   ? 30 : 0)
  + (tasks_done_4w ≥ 3          ? 30 : 0)
  + (sin critical_block activo  ? 20 : 0)
  + (documented_process_exists  ? 20 : 0)

≥70 → strong  |  40–69 → basic  |  <40 → none
```

### Definición: critical_block
```
duration_points = MIN(40, duration_weeks × 10)

execution_penalty:
  0  si execution_rate ≥ 70
  10 si 50 ≤ execution_rate < 70
  20 si execution_rate < 50
  (v1: usar execution_rate global como proxy)

impact_weight =
    (funcion_critica ? 40 : 20)
  + duration_points
  + execution_penalty

impact_weight ≥ 70  → critical_block
40–69               → friction_block
<40                 → minor_signal

funcion_critica = TRUE si function.type ∈ {demand, delivery, cash}
No editable por el founder. Sub-funciones mapeadas internamente a las 3 macro-funciones.
```

### Alertas temporales
```
4 sem sin crecimiento ≥10%   → Warning
8 sem sin hard signal        → Fricción
16 sem sin graduación        → Crítico estructural
Solo founder: +2 semanas en todos los umbrales
```

### Duración esperada: 12–24 semanas

---

## F1.8 — OBV Types

### 4 tipos formales
```
customer_discovery   → peso ×1.0  (entrevistas, descubrimiento de problema)
product_validation   → peso ×1.1  (validación de que la solución funciona)
revenue_validation   → peso ×1.3  (alguien paga — señal estructural superior)
operational_system   → peso ×0.8  (validación de proceso interno)
```

### Relevancia por fase (orientativa, no restrictiva)
```
Fase 1 → customer_discovery (principal)
Fase 2 → product_validation + revenue_validation
Fase 3 → revenue_validation + operational_system
Fase 4 → operational_system (principal)
```
Tipos disponibles en todas las fases. El Phase Engine usa relevancia contextual, no bloqueo.

### Regla: un OBV = un tipo primario
```
"¿El problema existe?"      → customer_discovery
"¿La solución funciona?"    → product_validation
"¿Alguien paga?"            → revenue_validation
"¿El proceso funciona?"     → operational_system
```

### payment_high_confidence (fuente única: verification_multiplier)
NO existe `payment_confidence` como campo separado.

```
payment_high_confidence = TRUE
si verification_multiplier ∈ {1.10 (URL), 1.15 (peer)}

→ activa: auto-type revenue_validation, phase_acceleration_signal,
          cuenta para hard signals F2/F3/F4

payment_high_confidence = FALSE
si verification_multiplier ∈ {1.00, 0.70}
→ se registra, no dispara aceleración ni hard signals
```

### 3 rutas para payment_high_confidence = TRUE

**Ruta A — URL verificable** → multiplier = 1.10
Enlace a recibo/factura con ID, fecha e importe visibles.

**Ruta B — Peer validation** → multiplier = 1.15
```
Peer debe cumplir TODAS:
  - No es el founder principal del proyecto
  - Pertenece al mismo proyecto (miembro/colaborador invitado)
  - Rol ≠ 'viewer'
  - Cuenta con ≥7 días de antigüedad
  - ≥1 acción real en cualquier proyecto (tarea completada o OBV validado)

Solo founders sin colaboradores: esta ruta no está disponible.
```

**Ruta C — Campos estructurados + adjunto** → multiplier = 1.10
```
Formulario: provider, transaction_id (≥8 chars), amount (>0),
            currency, date, customer_identifier (hashed), attachment

Condición: payment_date within last 90 days AND date ≤ today
Si pago > 90 días → LOW confidence (se registra, no activa hard signals)
```

### Forzado automático por pago verificado
```
si evidence_type = payment_verified AND evidence_status = active
→ obv.type = revenue_validation (auto)
→ event_log: type_auto_updated=TRUE, reason="verified_payment_detected"
→ Notificación al founder

Revierte si: evidence deleted / invalid / test_mode / refund / dispute_flag=TRUE
Stripe test mode excluido explícitamente.
```

### Señal de aceleración de fase
```
si current_phase = 1 AND existe OBV revenue_validation con evidence activa
→ phase_acceleration_signal = TRUE
→ Phase Engine recalcula inmediatamente
→ Notificación: "Has registrado un ingreso. Recalculando tu fase..."
El Phase Score decide si se puede avanzar. No hay condiciones adicionales.
```

---

## F1.9 — Benchmarks v1

### Estrategia
- v1 = Curados (Opción A)
- Arquitectura preparada para Híbrido (Opción C) desde el día 1
- v2+: transición automática cuando n_proyectos_validos ≥30 por segmento

### Schema: tabla `benchmarks`
```sql
benchmarks
- id               UUID
- industry         TEXT
- model_type       TEXT    -- SaaS, Service, Physical, Marketplace, Agency, Unknown
- region_cluster   TEXT
- metric_name      TEXT
- p25              NUMERIC
- p50              NUMERIC
- p75              NUMERIC
- source_type      TEXT    -- 'curated' | 'internal'
- confidence_score INTEGER -- 0–100
- updated_at       TIMESTAMPTZ
```

### Métricas v1 y uso en motores
```
margen_estimado      → F3/F4 Phase Engine (estructural — definido por model_type)
crecimiento_p50      → Probability Engine (estructural — revenue_momentum_score)
conversión_media     → Dashboard (informativo)
ciclo_venta_medio    → Dashboard (informativo — alerta si > p75)
ticket_medio         → Dashboard (informativo)
CAC_estimado         → Dashboard (informativo)
```

### revenue_momentum_score
```
Caso normal (crecimiento_p50_benchmark > 0):
  growth_vs_benchmark = crecimiento_real / crecimiento_p50_benchmark

Caso fallback (crecimiento_p50_benchmark ≤ 0):
  growth_vs_benchmark = crecimiento_real / 0.05
  UI: "Benchmark sectorial no positivo; usando referencia absoluta (5%/mes)."

revenue_momentum_score = MAX(0, MIN(100, (growth_vs_benchmark / 1.5) × 100))

Calibración:
  Ratio 1.0× → ~67  |  Ratio 1.5× → 100  |  ≤0 → 0
  (p50 exacto no da score perfecto; se requiere 1.5× para score 100)
```

### confidence_score
```
curated default                    → 60
curated con fuente externa validada → 70
internal n < 30                    → 50
internal 30–99                     → 80
internal 100–299                   → 90
internal ≥300                      → 95
Cap absoluto: 95 (nunca 100)

UI: 0–49=Baja | 50–69=Media | 70–84=Alta | 85–95=Muy alta
```

---

## F1.10 — Viability Engine v1

### Filosofía
Motor de advertencia estratégica — no bloquea, no penaliza, no altera scores.
En v1 construye confianza. En v2 puede volverse más firme.

### Evaluación
Cron job semanal (cada lunes). Todos los proyectos activos.

### 4 Triggers

**T1 — Estancamiento prolongado**
```
iteration_velocity = 0 durante ≥4 semanas
AND phase_score < 75
→ "Tu proyecto no está generando aprendizaje activo."
```

**T2 — Ingresos sin margen**
```
ingresos > 0 AND cash_flow < 0 durante ≥2 meses
AND cash_flow_confidence = HIGH

Si confidence = LOW:
  No se emite viability_event.
  Solo banner: "Para evaluar sostenibilidad financiera, registra tus costes reales."
→ "Estás creciendo ingresos sin sostenibilidad financiera."
```

**T3 — Crecimiento con sobrecarga**
```
crecimiento_real ≥ crecimiento_p50_benchmark AND capacity_health < 55 durante ≥4 semanas
Fallback si benchmark ≤ 0: crecimiento_real ≥ 0.05 (5% mensual)
→ "El crecimiento está tensionando tu sistema."
```

**T4 — Validación débil persistente**
```
validation_strength < 40 AND ≥6 semanas en misma fase
→ "Las señales de validación siguen siendo débiles."
```

### Schema: viability_events
```sql
viability_events
- project_id          UUID
- trigger_type        TEXT   -- stagnation | margin_risk | overload | weak_validation
- metrics_snapshot    JSONB
- timestamp           TIMESTAMPTZ
- recommendation_text TEXT
- founder_response    TEXT   -- accept | ignore | postpone
- postpone_until      DATE   -- nullable
- resolved_at         TIMESTAMPTZ  -- nullable
- engine_version      TEXT REFERENCES engine_versions(id)
```

### Respuestas del founder
```
Acción    Silencia    Registro    Comportamiento
accept    Oculta      Sí          Ejecuta acción sugerida (si aplica)
ignore    1 semana    Sí          postpone_until = current_week + 1
postpone  2 semanas   Sí          postpone_until = current_week + 2

Si mismo trigger activo 2 evaluaciones consecutivas sin accept:
  → nota adicional: "Esta es la segunda vez que detectamos este patrón."
  Sin castigo. Sin cambio de estado.
```

### Formato UX
```
⚠ Observación estratégica
Detectamos [condición].
Recomendación: [acción sugerida].
[Aceptar recomendación]  [Revisar más tarde]  [Ignorar]

Nunca: rojo, "crítico", "fallando", lenguaje alarmista.
```

### Lo que NO hace en v1
No activa Rescue Mode, no altera Probability, no altera Phase, no bloquea avance, no penaliza.

---

## F1.11 — Function Coverage v1

### 3 funciones críticas fijas
```
demand   → captar demanda
delivery → entregar valor
cash     → cobrar + controlar caja
```
Instanciadas automáticamente al crear proyecto. El founder no puede crear nuevas en v1.

### Schema: project_functions
```sql
project_functions
- id                    UUID
- project_id            UUID
- function_type         ENUM(demand, delivery, cash)
- owner_user_id         UUID NULL
- documented_process_id UUID NULL  -- FK a process_artifacts
- created_at            TIMESTAMPTZ
- updated_at            TIMESTAMPTZ
```

### Schema: tasks (campo añadido)
```sql
tasks.function_type  ENUM(demand, delivery, cash, support)  NULL  DEFAULT NULL

NULL     = sin clasificar (no cuenta para coverage_score)
support  = tarea no crítica (no cuenta para coverage_score)
```
Selector obligatorio en UI. El motor no asume default.

### Schema: process_artifacts
```sql
process_artifacts
- id                    UUID
- project_id            UUID
- function_type         ENUM(demand, delivery, cash)
- title                 TEXT
- checklist_items_count INT
- last_used_at          TIMESTAMPTZ  -- fecha del último item marcado en ejecución real
- link_or_doc_id        TEXT NULL
- created_at            TIMESTAMPTZ
```
"Used" = al menos 1 item del checklist marcado en ejecución real (no solo creado).

### Regla: documented_process_exists
```
process_recent_window = current_phase ≤ 2 ? 60 días : 30 días

documented_process_exists = TRUE si:
  function_type = [función evaluada]
  AND checklist_items_count ≥ 5
  AND last_used_at within process_recent_window
```

### Regla: tasks_done_4w
```
tasks_done_4w = COUNT(tasks)
  WHERE task.status = 'completed'
    AND completed_at within last 28 días
    AND function_type ∈ {demand, delivery, cash}

No cuentan: in_progress, validated, review, cancelled, NULL, support
```

### coverage_score por función
```
coverage_score =
  (owner_user_id IS NOT NULL  ? 30 : 0)
+ (tasks_done_4w ≥ 3         ? 30 : 0)
+ (no critical_block activo  ? 20 : 0)
+ (documented_process_exists ? 20 : 0)

≥70 → strong  |  40–69 → basic  |  <40 → none
```

### Support functions
Opcionales, solo dashboard informativo, sin impacto en motores.
Ejemplos: legal, hiring, finance-ops, partnerships.

### Expectativas por fase
```
Proyecto sano F3: ≥1 función con coverage = strong
Proyecto sano F4: 2–3 funciones con coverage = strong
```

---

## F1.12 — engine_version

### Decisión
Tabla FK — no string libre, no regex. Garantiza integridad real.

### Schema: engine_versions
```sql
engine_versions
- id           TEXT PRIMARY KEY   -- "phase_v1.0"
- motor        TEXT NOT NULL      -- 'phase' | 'probability' | 'viability' | 'execution'
- deployed_at  TIMESTAMPTZ NOT NULL
- notes        TEXT
- is_active    BOOLEAN DEFAULT TRUE
```

### Tablas que llevan engine_version
```sql
-- FK en tablas de outputs calculados:
engine_version TEXT NOT NULL REFERENCES engine_versions(id)

Tablas:
  phase_history        → "phase_v1.0"
  probability_history  → "probability_v1.0"
  viability_events     → "viability_v1.0"
  execution_history    → "execution_v1.0"
```

### Constantes en código
```typescript
const PHASE_ENGINE_VERSION       = "phase_v1.0"
const PROBABILITY_ENGINE_VERSION = "probability_v1.0"
const VIABILITY_ENGINE_VERSION   = "viability_v1.0"
const EXECUTION_ENGINE_VERSION   = "execution_v1.0"
```
Si el valor no existe en DB → FK falla inmediatamente. Error ruidoso > error silencioso.

### Protocolo de nueva versión
```
1. INSERT en engine_versions (id, motor, deployed_at, notes)
2. Actualizar constante en código
3. Desplegar función
4. Opcional: is_active = FALSE en versión anterior
```

### Seed data v1
```sql
INSERT INTO engine_versions (id, motor, deployed_at, notes) VALUES
  ('phase_v1.0',       'phase',       NOW(), 'Fórmula inicial F1.5/F1.6/F1.7'),
  ('probability_v1.0', 'probability', NOW(), 'Fórmula inicial F1.4'),
  ('viability_v1.0',   'viability',   NOW(), 'Triggers iniciales F1.10'),
  ('execution_v1.0',   'execution',   NOW(), 'Fórmula inicial F1.1');
```

---

## F1.13 — data_completeness_score

### Propósito
Mide densidad y verificabilidad de datos registrados.
No mide calidad ni éxito. Evita que el sistema produzca outputs correctos sobre datos vacíos.

### 5 dimensiones

**D1 — Activity Coverage (máx 20 pts)**
```
≥1 OBV en últimas 4 semanas                                             → 10 pts
≥3 tareas completed en 4 semanas
  con function_type ∈ {demand, delivery, cash} AND status='completed'   → 10 pts

NULL y support no cuentan.
```

**D2 — Financial Data (máx 25 pts)**
```
costes registrados en últimos 3 meses   → 15 pts
ingresos registrados en últimos 3 meses → 10 pts

Solo margen estimado o datos > 3 meses → 0 pts
```

**D3 — Evidence Quality (máx 20 pts)**
```
≥1 OBV con verification_multiplier ≥ 1.10  → 20 pts
≥1 OBV con verification_multiplier = 1.00  → 10 pts
else (incluido 0.70)                        →  0 pts

No acumulativo. Si hay evidencia inconsistente (0.70): nota UX, 0 pts.
```

**D4 — Function Structure (máx 20 pts)**
```
≥1 función strong                          → 20 pts
≥2 funciones basic (sin ninguna strong)    → 15 pts
≥1 función basic  (sin ninguna strong)     → 10 pts
todas none                                 →  0 pts

strong domina — no suma con basic.
```

**D5 — Strategic Definition (máx 15 pts)**
```
segment definido   → 5 pts
problem definido   → 5 pts
value_prop def.    → 5 pts

Válido si: NOT NULL AND length ≥ 10 chars
Fuente: project_strategy_current (inicializada con NULLs al crear proyecto)
```

### Fórmula
```
data_completeness_score = D1 + D2 + D3 + D4 + D5
Cap: 100
```

### Umbrales
```
< 50    → LOW CONFIDENCE  → probability_status = "LOW CONFIDENCE"
50–69   → Medium confidence (UI badge)
≥ 70    → High confidence
```

### Efecto en el sistema
```
NO altera ninguna fórmula
NO bloquea acciones
NO cambia Phase

< 50 → banner: "Tus métricas se calculan con datos incompletos."
Viability Engine no dispara T2 (cash flow) si D2 = 0
```

### Display
```
Header: Probability: 62  |  Confidence: Medium (58/100)
Tooltip: breakdown D1–D5 con puntos obtenidos y qué falta
```

### Schema: project_strategy_current
```sql
project_strategy_current
- project_id  UUID PRIMARY KEY
- segment     TEXT NULL
- problem     TEXT NULL
- value_prop  TEXT NULL
- updated_at  TIMESTAMPTZ

-- Al crear proyecto:
INSERT INTO project_strategy_current(project_id, segment, problem, value_prop)
VALUES (new_project_id, NULL, NULL, NULL)

-- strategic_model_versions trackea cambios (pivots).
-- project_strategy_current es la fuente actual para D5.
```

---

## Tablas nuevas identificadas para Fase 2

| Tabla | Definida en |
|-------|-------------|
| `project_functions` | F1.11 |
| `process_artifacts` | F1.11 |
| `engine_versions` | F1.12 |
| `viability_events` | F1.10 |
| `strategic_model_versions` | F1.5 |
| `project_strategy_current` | F1.13 |
| `benchmarks` | F1.9 |

---

## Notas de implementación

1. **Instrumentación es crítica.** Muchas métricas dependen de que el usuario registre bien. Sin UX que fuerce el registro correcto, los motores producen outputs falsos. Considerar `data_completeness_score` visible y prominente desde el primer día.

2. **Calibración sin usuarios.** Los pesos y umbrales están razonados, no validados. En v2 recalibrar con datos reales. Monitorear distribuciones de scores: si el 90% de proyectos tiene probability > 70, los umbrales son demasiado laxos.

3. **Tests automáticos obligatorios.** Rolling windows + batch semanal + resets condicionales (3-de-4-meses) tienen edge cases complejos. Crear fixtures de test para cada edge case definido en F1 antes de implementar en producción.

4. **payment_verified en v1 no es automático.** Requiere URL, peer, o campos estructurados. Una imagen sin ID verificable es LOW confidence.
