# BLOQUE A — AUDIT DE MOTORES E INTEGRACIONES
> **I15.1–I15.14** — Auditoría de cómo cada motor usa datos internos y cómo se verá afectado por integraciones externas.
> Fecha: 2026-03-15. Basado en lectura directa de migraciones SQL y TypeScript.
>
> **Archivos auditados:**
> - `supabase/migrations/20260224000007_probability_engine.sql`
> - `supabase/migrations/20260224000009_viability_engine.sql`
> - `supabase/migrations/20260224000025_viability_decisions.sql`
> - `supabase/migrations/20260224000003_gap_fixes_obvs_canonical_queries.sql`
> - `supabase/migrations/20260224000006_execution_rate_functions.sql`
> - `supabase/migrations/20260224000002_fase2_engine_tables.sql`
> - `src/lib/next-action.ts`
> - `src/hooks/useNovaDataOptimized.ts`
> - `src/components/project/ProjectCRMTab.tsx`
> - `supabase/migrations/20260224000001_complete_fresh_schema.sql`

---

## I15.2 — Probability Engine

### Inputs actuales (con pesos)

| Input | Peso | Fuente exacta | Fallback si nulo |
|---|---|---|---|
| `phase_score_input` | 35% | `project_phase_state.phase_score` | `COALESCE(v, 0)` |
| `execution_rate_input` | 20% | `tasks` (status, completed_at, function_type) + `project_functions` | 0 |
| `validation_strength_input` | 15% | `obvs` (tipo, obv_outcome, fecha) | 0 |
| `revenue_momentum_input` | 15% | `key_metrics.mrr` (últimas 2 filas por `date DESC`) | 30 (neutral) |
| `capacity_health_input` | 15% | `obvs` (pending count) + `tasks` (done en 7d) | 100/70/30 |

### Estado cuando falta data
- `data_completeness < 20` → `status = 'inactive'`, `probability_score = NULL`
- `20–49` → `status = 'low_confidence'`
- `≥ 50` → `status = 'active'`
- Todas las funciones tienen fallback — el motor nunca falla por NULL, produce scores bajos

### Punto de integración para Finance Agent
**Tabla destino:** `key_metrics.mrr` (columna `mrr`, junto con `project_id` y `date`)
**Trigger:** `trg_key_metrics_probability` — `AFTER INSERT OR UPDATE OF mrr ON key_metrics` → dispara `run_probability_engine()` automáticamente con `trigger_source='acceleration'`
**Conclusión:** La arquitectura ya está lista para recibir MRR de Stripe. Finance Agent escribe en `key_metrics` (vía guard) → el engine recalcula solo.

### Punto de integración para Sales Agent
**No hay trigger directo.** El pipeline de HubSpot no tiene un campo equivalente a `key_metrics.mrr`.
**Camino recomendado:** Sales Agent calcula una estimación de MRR basada en `deal.amount × deal.probability × conversion_rate_histórica` y la escribe en `key_metrics.mrr` como fuente `'hubspot_pipeline'`.
**Riesgo:** Estimación de pipeline → MRR es una proyección, no revenue real. Debe tener `confidence < 0.8` salvo que sea pipeline en etapa `negociacion` o `cerrado_ganado`.

### Qué inputs deben seguir siendo internos (I15.11)
- `execution_rate` (tasks + project_functions): los datos de Asana/Trello podrían alimentarlo en v2, pero requieren normalización a `task.status` interno. Dejar interno en v1.
- `validation_strength` (OBVs): dato estratégico que el founder registra manualmente. No tiene equivalente externo natural. Seguir interno.
- `capacity_health` (OBVs pending + tasks done 7d): datos de actividad interna. Seguir interno.

---

## I15.4 — Viability Engine

### Triggers y fuentes

| Trigger | Condición | Fuentes de datos |
|---|---|---|
| T1 stagnation | `iteration_velocity=0 AND phase_score<75` | `obvs` (últimos 28d) + `project_phase_state.phase_score` |
| T2 margin_risk | `≥2 meses en últimos 90d con revenue>0 AND revenue<costs` | `financial_projections` (year, month, revenue, cogs, payroll, marketing_spend, infrastructure, other_costs) |
| T3 overload | `mrr_growth_rate >= benchmark_p50 AND capacity_health<55` | `key_metrics.mrr_growth_rate` + `benchmarks` + `project_economic_profile.model_type` + `projects.cluster` |
| T4 weak_validation | `validation_strength<40 AND phase_entered_at ≤ 42 días` | `project_probability.validation_strength_input` + `project_phase_state.phase_entered_at` |

### Viability status mapping
```
healthy    = 0 active triggers
critical   = T2(HIGH) activo OR any trigger ≥3 ciclos consecutivos
stagnation = any trigger ≥2 ciclos
monitoring = ≥1 trigger activo, <2 ciclos
```

### HALLAZGO CRÍTICO: Viability Engine no tiene runway
El motor **no calcula ni consume `runway_months`**. El campo `project_economic_profile.cash_on_hand` existe (tabla del schema) pero el viability engine nunca lo lee.

**Consecuencia para Finance Agent:**
- Finance Agent puede calcular runway real desde datos de Stripe: `cash_on_hand / monthly_burn_rate`
- Pero no hay un trigger en el viability engine que responda a esa señal
- Opciones:
  - **Opción A (sin migración):** Finance Agent escribe en `financial_projections` con revenue/costs reales de Stripe → T2 se activa si hay meses negativos → indirect path funciona
  - **Opción B (requiere migración):** Añadir T5 `low_runway` al viability engine: `cash_on_hand / avg_monthly_burn < 3 meses` → `viability_status` puede ir a `monitoring` o `critical`. Más directo, más preciso.
- **v1 recomendación:** Usar Opción A. Finance Agent escribe en `financial_projections` (datos reales de Holded/Stripe). T2 se activa si hay flujo negativo. T5 se diseña en v1.1 cuando haya datos reales acumulados.

### Puntos de integración para Finance Agent
1. **`financial_projections`** — escribir revenue y costs reales de Stripe/Holded para mejorar T2
2. **`project_economic_profile.cash_on_hand`** — actualizar con saldo real de cuenta (si el proveedor lo expone)
3. **`key_metrics.mrr_growth_rate`** — actualizar con tasa de crecimiento real para T3

**Protección:** todas las escrituras pasan por `write_integration_to_engine_table()` con `confidence >= 0.8`.

### Qué inputs deben seguir siendo internos
- T1 (iteration_velocity): señal de actividad interna — sin equivalente externo
- T4 (validation_strength): OBVs son internos — sin equivalente externo directo

---

## I15.5 — Next Action Engine

### Inputs actuales
```typescript
const phase         = engineData.phaseState?.current_phase  ?? 1;
const phaseScore    = engineData.phaseState?.phase_score     ?? 0;
const hardSignalMet = engineData.phaseState?.hard_signal_met ?? false;
const riskStatus    = engineData.risk?.risk_status           ?? 'insufficient_data';
const riskLevel     = engineData.risk?.risk_level            ?? 'low';
const probStatus    = engineData.probability?.probability_status ?? 'inactive';
const coverage      = engineData.coverage ?? [];  // demand, delivery, cash coverage_level
```

**Cero datos de integración actualmente.** Función pura, determinista.

### 12 reglas de prioridad (resumen)
```
1. risk active + critical → bloquear todo
2. risk active + high + phase≥3 → escalar antes de avanzar
-- [injection point 2.5 — ver abajo] --
3. Phase 1: hard signal falta O demand weak → create_obv
4. Phase 2: demand weak + hard signal falta → create_obv
5. Phase 2: demand weak + hard signal + score≥70 → define_channel
6. Phase 2: demand OK + prob inactive/low → add_metrics
7. Phase 3: ops weak → create_obv
8. Phase 3: hard signal falta → create_obv
9. Phase 4: ops weak → create_obv
10. Phase 4: prob inactive/low → add_metrics
11. Phase 4: hard signal falta → add_metrics
12. Phase 4: hard signal OK → add_metrics (momentum)
else (phases 1-3) → null
```

### Punto de integración para AGENTS_CONTRACT synthesis output
**Regla 2.5** — entre reglas 2 y 3, no destructiva:
```typescript
// 2.5 — Critical synthesis insight (if synthesis_output provided)
if (synthesis_output?.primary_insight?.severity === 'critical'
    && synthesis_output.synthesis_confidence >= 0.8) {
  const { content, signal } = synthesis_output.primary_insight;
  return {
    title: content.summary,
    description: `${content.implication} (${signal.metric_name})`,
    actionType: /* mapear dominant_signal a actionType */,
  };
}
```

**Por qué después de risk (1-2) y antes de fase 1 (3):**
- El risk engine ya procesa señales críticas internas — no duplicar
- Una señal crítica de Finance/Sales Agent es más urgente que las reglas por fase
- Las reglas por fase (3-12) quedan intactas — sin rotura de compatibilidad

**Condición para activar:** `severity='critical' AND synthesis_confidence >= 0.8`
No activar con `severity='warning'` — esas se muestran como contexto en el panel de Optimus, no como next action.

### Return type
```typescript
type NextAction = {
  title: string;
  description: string;
  actionType?: 'create_obv' | 'add_metrics' | 'define_channel';
  ctaLabel?: string;
} | null;
```

---

## I15.6 — CRM Interno

### Tablas
- `obvs` — tabla unificada para OBVs estratégicos Y pipeline comercial. Columna clave: `pipeline_status` (enum `lead_status`)
- `obv_participantes` — split de crédito entre miembros
- `obv_pipeline_history` — historial de transiciones de etapa

### Pipeline stages (7 etapas)
```
frio → tibio → hot → propuesta → negociacion → cerrado_ganado / cerrado_perdido
```

### HALLAZGO CRÍTICO: CRM no alimenta los motores
Los datos del CRM (`leads_ganados`, `lead_conversion_rate`) son **exclusivamente informativos en dashboards**. `revenue_momentum` (15% del Probability Engine) lee `key_metrics.mrr` manual, no el pipeline del CRM.

**Consecuencia:** Un proyecto con 10 deals en `negociacion` vale €50k en pipeline. Ese pipeline no afecta el `probability_score` en absoluto hasta que el founder entre manualmente el MRR en `key_metrics`.

**Esto es una brecha intencional o accidental?** Probablemente accidental. La corrección obvia es que el Sales Agent puede bridgear esta brecha: calcular una estimación de MRR basada en el pipeline real y escribirla en `key_metrics`.

### Compatibilidad con HubSpot deals (integration_entities type='deal')
**Camino de menor fricción:**
1. `ProjectCRMTab.tsx` hace dos queries: una a `obvs` (internos) + una a `integration_entities` donde `entity_type='deal'`
2. Ambas fuentes se normalizan a la misma interface `Lead` (con campo `source: 'internal' | 'hubspot'`)
3. Drag-drop: interno → UPDATE `obvs.pipeline_status`; externo → llamada a edge function para sync-back al provider
4. Stats del pipeline: ambas fuentes sumadas

**Mapa de etapas HubSpot → interno:**
```
'negotiation'     → 'negociacion'
'presentation'    → 'propuesta'
'qualifiedtobuy'  → 'hot'
'identified'      → 'tibio'
'closedwon'       → 'cerrado_ganado'
'closedlost'      → 'cerrado_perdido'
```

### Qué inputs deben seguir siendo internos
- `validation_strength` (OBVs): ninguna herramienta externa mide esto
- `pipeline_status` transitions: las etapas internas del CRM deben seguir siendo editables manualmente aunque haya sync con HubSpot

---

## I15.10 — Qué inputs del motor pueden venir de integraciones

| Motor | Input | Provider potencial | Tabla de escritura | Condición |
|---|---|---|---|---|
| Probability | `revenue_momentum` | Stripe (MRR real) | `key_metrics.mrr` | confidence ≥ 0.8, trigger automático |
| Probability | `revenue_momentum` | HubSpot (pipeline → MRR estimado) | `key_metrics.mrr` | confidence < 0.8 por ser estimación |
| Viability | T2 (margin_risk) | Holded (facturas reales) | `financial_projections` | confidence ≥ 0.8 |
| Viability | T3 (overload) | Stripe (mrr_growth_rate real) | `key_metrics.mrr_growth_rate` | confidence ≥ 0.8 |
| Viability | cash_on_hand | Holded (saldo de cuenta) | `project_economic_profile.cash_on_hand` | confidence ≥ 0.8 |
| Next Action | synthesis_output | Finance/Sales Agent | Regla 2.5 en `getNextAction()` | severity=critical + confidence ≥ 0.8 |

---

## I15.11 — Qué inputs deben seguir siendo internos

| Input | Motor | Por qué interno |
|---|---|---|
| `phase_score` | Todos | El Phase Engine es el único motor con autoridad para calcularlo. |
| `hard_signal_met` | Phase, Next Action | Las hard signals son validaciones estratégicas — ningún provider externo puede certificarlas. |
| `validation_strength` | Probability, Viability | Los OBVs son evidencia registrada intencionalmente por el founder. No tiene equivalente externo. |
| `execution_rate` (v1) | Probability | Las tareas internas tienen contexto estratégico que Asana no conoce. Candidato a integración en v2. |
| `iteration_velocity` | Viability T1 | Señal de actividad en el sistema interno — sin equivalente externo directo. |
| `viability_status`, `current_phase`, `risk_level` | Optimus context | Siempre calculados por motores internos. Nunca sobreescritos por agentes (ver AGENTS_CONTRACT §3). |

---

## I15.12 — Reglas de precedencia datos externos vs internos

**Documentado en `INTEGRATION_DATA_CONTRACT.md §9`.**
Resumen: source_of_truth es per-proyecto, per-módulo. `internal_only` por defecto. Override a `external_primary` solo con integración activa + sync fresco. Estado `stale_external` cuando sync vencido — agentes no generan insights, motores no usan esos datos.

**Precisión añadida por esta auditoría:**
- Cuando Finance Agent escribe en `key_metrics.mrr`, el valor lleva el campo `integration_source=true`
- El trigger de `probability_engine` se dispara para ambas fuentes (manual e integración)
- En la UI, `key_metrics.mrr` con `integration_source=true` debe mostrarse con badge "Stripe" para que el founder sepa el origen

---

## I15.13 — Mecanismo de validación antes de entrar al motor

**Documentado en `INTEGRATION_DATA_CONTRACT.md §6` (validaciones) y `§7` (guard).**
Resumen:
1. Normalizador valida schema del entity_type
2. `confidence` calculado determinísticamente (§5)
3. Dato va a `integration_entities`
4. Agente genera insight con `entity_ids`
5. Si `insight.motor_write` presente → pasa por `write_integration_to_engine_table()` que verifica `confidence >= 0.8`
6. Solo entonces se escribe en tabla de motor

**El motor nunca valida datos de integración directamente.** La validación ocurre antes de que llegue al motor.

---

## I15.14 — Cómo cada motor se verá afectado por integraciones

| Motor | Impacto | Severidad del cambio | Qué NO cambia |
|---|---|---|---|
| **Phase Engine** | Sin impacto directo v1. Las hard signals siguen siendo internas. | Bajo | Toda la lógica de fase |
| **Probability Engine** | `revenue_momentum` puede recibir MRR de Stripe vía `key_metrics`. Trigger ya existe. | Bajo — additive | Los 4 inputs restantes, los pesos, la fórmula |
| **Risk Engine** | Sin impacto directo v1. Los 5 factores de riesgo son internos. | Bajo | Toda la lógica de riesgo |
| **Viability Engine** | T2 se mejora si `financial_projections` recibe datos reales de Holded. T3 si `key_metrics.mrr_growth_rate` viene de Stripe. No hay runway trigger hoy. | Medio — T2/T3 más fiables, gap de T5 runway | T1, T4, la lógica de status |
| **Next Action Engine** | Nueva regla 2.5 para escalada de insights críticos. Las 12 reglas actuales quedan intactas. | Bajo — additive | Las 12 reglas, el return type |
| **CRM (dashboard)** | Vista híbrida interna + HubSpot. Los datos internos no desaparecen. Pipeline stats unificados. | Medio — cambio de UI + schema `source` | El pipeline interno, las etapas, la pipeline_history |
| **`get_optimus_context()`** | Nuevo campo `integration_insights[]` (max 3). Los 22 campos actuales no cambian. | Bajo — additive | El context packet completo existente |

---

## Gaps identificados en esta auditoría

| Gap | Severidad | Acción |
|---|---|---|
| Viability no tiene runway trigger | 🟠 Alto | Diseñar T5 en v1.1 cuando Finance Agent tenga datos reales. Interim: T2 como proxy vía `financial_projections`. |
| CRM no alimenta `revenue_momentum` | 🟡 Normal | Sales Agent puede bridgear vía estimación de pipeline → `key_metrics.mrr`. Requiere normalización cuidadosa. |
| `key_metrics` no tiene campo `integration_source` | 🟡 Normal | Añadir al schema cuando se implemente Bloque B. Necesario para trazabilidad en UI. |
| HubSpot stage map sin especificar para todos los providers | 🟢 Bajo | Añadir al normalizador de HubSpot (I15.93) cuando se implemente. |

---

> **Bloque A2:** Ver `BLOQUE_A2_AUDIT.md`.

---

## I15.1 — Phase Engine

### Signature

```sql
run_phase_engine(p_project_id UUID, p_trigger_source TEXT DEFAULT 'weekly_job') RETURNS VOID
```

Archivos principales: `20260224000022_phase_regression.sql`, `20260224000014_phase2_engine.sql`, `20260224000015_phase3_engine.sql`, `20260224000018_phase4_engine.sql`.

### Inputs por fase

| Fase | Componente | Peso | Tabla/Columna | Externo posible |
|---|---|---|---|---|
| **F1** | O1.1 — Volumen entrevistas | 40% | `obvs.tipo` count (customer_discovery/exploracion) | No |
| | O1.2 — Claridad problema | 40% | `obvs.obv_outcome` | No |
| | O1.3 — Foco estrategia | 20% | `project_strategy_current` (segment_text, problem_text, value_prop_text) | No |
| **F2** | O2.1 — Revenue evidence | 45% | `obvs` (revenue_validation/venta + evidence_type='payment') | Sí — Stripe/Holded (ventas reales) |
| | O2.2 — MVP validado | 25% | `obvs` (product_validation/validacion) | No |
| | O2.3 — Canal adquisición | 30% | `project_acquisition_channel.estimated_cac` | Sí — Holded/HubSpot (CAC real) |
| | revenue_momentum_input | Gating | `project_probability.revenue_momentum_input` | Sí — vía chain automático (ver abajo) |
| **F3** | O3.1 — Estabilidad revenue | 40% | `key_metrics.mrr` (últimos 4 meses, umbral 75%) | **Sí — Stripe/Holded (MRR real)** |
| | O3.2 — Execution health | 35% | `project_risk_score.risk_level` + `compute_capacity_health()` + `compute_execution_rate()` | No directo |
| | O3.3 — Independencia founder | 25% | `strategic_cycles` + `tasks.completed_at` | No |
| **F4** | O4.1 — Growth sostenido | 40% | `key_metrics.mrr` (últimos 5 meses, avg growth MoM) | **Sí — Stripe/Holded** |
| | O4.2 — Márgenes/ejecución | 35% | `compute_capacity_health()` + `compute_execution_rate()` + `obvs.margen` | Parcial — Holded (costes) |
| | O4.3 — Delegación | 25% | `project_functions.owner_user_id` vs `projects.created_by` | No |

### Thresholds de avance de fase

- Avance: `phase_score >= 75 AND hard_signal AND iteration_velocity >= 2`
- Hard signal F1→F2: n_interviews ≥ 10 AND pct_dolor ≥ 30 AND strategy defined
- Hard signal F2→F3: `has_payment_obv = TRUE AND revenue_momentum_input >= 40`
- Hard signal F3→F4: `stable_months >= 3 AND tasks_done_28d >= 3`
- Regresión F2→F1: `consecutive_low_score >= 6 semanas` con score < 50

### Triggers automáticos

| Trigger | Tabla | Evento |
|---|---|---|
| `trg_obvs_phase` | obvs | INSERT/UPDATE obv_outcome, tipo |
| `trg_strategy_phase` | project_strategy_current | INSERT/UPDATE segment/problem/value_prop |
| `trg_pivots_phase` | strategic_model_versions | INSERT |
| `trg_coverage_phase` | project_function_coverage | UPDATE coverage_score |
| `trg_probability_phase` | project_probability | UPDATE revenue_momentum_input |
| `trg_tasks_done_phase` | tasks | UPDATE status='done' |
| Weekly cron | — | Domingo 00:00 UTC |

### Chain completo Stripe → Phase Engine

```
Stripe API
  → Finance Agent
  → write_integration_to_engine_table()
  → key_metrics.mrr (INSERT/UPDATE)
  → trg_key_metrics_probability fires
  → run_probability_engine()
  → project_probability.revenue_momentum_input actualizado
  → trg_probability_phase fires
  → run_phase_engine()
  → phase_score recalculado
```

**Implicación:** Un proyecto en Fase 3 con MRR real de Stripe avanza en O3.1 automáticamente. La cadena es completa sin intervención manual. El trigger `trg_key_metrics_probability` (ya existente) es el eslabón clave.

### HALLAZGO CRÍTICO: Phase 3 puede bloquearse sin datos reales

O3.1 (40% del score de Fase 3) requiere `key_metrics.mrr` con **mínimo 4 meses** de datos y estabilidad en el último mes. Un proyecto que entra en Fase 3 sin Finance Agent activo necesita 4 meses de entradas manuales antes de poder avanzar. Finance Agent con Stripe acelera esto desde el primer sync.

### Qué inputs deben seguir siendo internos

- Todas las OBVs (F1, F2, F4.2): la evidencia estratégica la registra el founder
- `hard_signal_met`: ningún provider externo puede certificar validaciones estratégicas
- `iteration_velocity`: actividad interna del sistema
- `project_functions` (F4.3): delegación → datos organizativos internos

---

## I15.3 — Risk Engine

### Signature

```sql
run_risk_engine(p_project_id UUID, p_trigger_source TEXT DEFAULT 'weekly_job') RETURNS VOID
```

Archivo principal: `20260224000008_risk_engine.sql`.

### Los 5 factores de riesgo

| Factor | Peso | Tabla/Columna | Puede venir de externo |
|---|---|---|---|
| **R1.1 RunwayFactor** | 25% | `project_economic_profile.cash_on_hand` + `financial_projections` (burn rate) | **Sí — Finance Agent** |
| **R1.2 ExecutionDrop** | 20% | `project_probability_history.execution_rate_input` (ventana 14d vs 14-56d) | No directo |
| **R1.3 ValidationWeakness** | 20% | `project_probability_history.validation_strength_input` (vs 28d atrás) | No |
| **R1.4 RevenueConcentration** | 20% | `project_economic_profile.top_client_revenue_percent` | Sí — Holded/HubSpot |
| **R1.5 BottleneckSeverity** | 15% | `strategic_blocks.impact_weight` (bloques activos) | No |

### Cálculo de risk_level

```
Si inputs disponibles < 3 → risk_status = 'insufficient_data', risk_score = NULL
Si ≥ 3 → redistribuir pesos pro-rata sobre disponibles
risk_score (0-100) → risk_level: <30=low | 30-55=medium | 55-80=high | ≥80=critical
```

### Lógica R1.1 RunwayFactor (detalle)

```sql
net_burn_month = MAX(0, AVG(total_costs - revenue)) -- últimos 90 días en financial_projections
runway_months  = cash_on_hand / net_burn_month

Escala: ≥12m→0  |  9-12m→20  |  6-9m→40  |  3-6m→70  |  1-3m→90  |  <1m→100
NULL si: cash_on_hand IS NULL OR < 2 meses con costes > 0
```

**Punto de integración Finance Agent:**
- `project_economic_profile.cash_on_hand` → balance real de cuenta (Holded o API bancaria)
- `financial_projections` (revenue, cogs, payroll, etc.) → datos reales de Holded/Stripe
- Trigger `trg_fn_economic_profile_risk` se dispara cuando cambia `cash_on_hand` → recalcula R1.1 automáticamente

### Triggers automáticos

| Trigger | Tabla | Evento |
|---|---|---|
| `trg_fn_blocks_risk` | strategic_blocks | UPDATE resolved_at, status, impact_weight |
| `trg_fn_economic_profile_risk` | project_economic_profile | INSERT/UPDATE cash_on_hand, top_client_revenue_percent |
| `trg_fn_probability_risk` | project_probability | INSERT/UPDATE execution_rate_input, validation_strength_input |
| Weekly cron | — | Domingo 01:00 UTC (1h después del Phase Engine) |

### Timing relevante

Risk Engine corre a 01:00 UTC, Phase Engine a 00:00 UTC. Phase 3 lee `project_risk_score.risk_level` cuando se ejecuta el Phase Engine. En la cadena semanal, Phase leerá el risk_score de la semana anterior (calculado hace 7 días), no el de esta madrugada. En condiciones normales esto es correcto — el cambio de riesgo es gradual. Si el riesgo sube bruscamente (nueva señal crítica), hay un desfase de 1 semana. **Esto es por diseño y aceptable en v1.**

### CORRECCIÓN A BLOQUE_A_AUDIT §I15.4

El hallazgo original indicaba que el sistema no tiene señal de runway. **Corrección:** el Risk Engine SÍ tiene runway signal via R1.1 (25% del risk_score), leyendo desde `project_economic_profile.cash_on_hand`. La Viability Engine NO tiene runway trigger (T1-T4 confirmados). Risk y Viability son motores distintos — Risk monitoriza factores de riesgo (incluyendo runway), Viability monitoriza salud estratégica (stagnation, cashflow negativo, overload, validación débil). La arquitectura es consistente.

### Qué inputs deben seguir siendo internos

- R1.3 (ValidationWeakness): OBVs son validaciones estratégicas, sin equivalente externo
- R1.5 (BottleneckSeverity): `strategic_blocks` es información organizativa del founder
- `risk_level` output: siempre calculado por el Risk Engine, nunca sobreescrito por agentes (ver AGENTS_CONTRACT §3)

---

## I15.7 — OBVs/Tasks (módulo base)

### Schema `obvs` (campos relevantes para FASE 15)

```
obvs: id, project_id, owner_id
  tipo             obv_type ENUM (customer_discovery|product_validation|revenue_validation|operational_system + 3 alias ES)
  status           kpi_status (pending|validated|rejected)
  obv_outcome      TEXT (success|partial|fail|NULL)
  evidence_type    TEXT (payment|interview_recording|...)
  fecha            DATE
  pipeline_status  lead_status ENUM (frio→cerrado_ganado/cerrado_perdido)
  es_venta         BOOLEAN
  facturacion, costes, margen
  valor_potencial, nombre_contacto, empresa
  ...+ 30 campos de cobro, IVA, presupuesto
```

**Sin campos de origen externo.** No existe `source`, `external_id`, ni `integration_source`.

### Cómo `validation_strength` usa `obvs`

```sql
-- compute_validation_strength() — migration 00003
-- Lee los top 5 OBVs del proyecto por score calculado

score_per_obv = base_score × verification_multiplier × recency_decay

base_score          : success→100 | partial→60 | fail→20 | NULL→50
verification_mult   : revenue_validation→1.3 | product_validation→1.1 | customer_discovery→1.0 | operational_system→0.8
recency_decay       : fecha < 56d atrás → ×0.8

Returns: AVG(top 5 scores), 0 si sin OBVs
```

### Cómo `iteration_velocity` usa `obvs`

```sql
-- compute_iteration_velocity() — migration 00003
-- Cuenta OBVs con obv_outcome IS NOT NULL en ventana rolling 28d
-- Returns INTEGER: 0=critical | 1=friction | 2=healthy | 3=high | 4+=excellent
```

**Implicación FASE 15:** HubSpot puede aportar deals con obv_outcome='success' si la integración los normaliza correctamente y los escribe en `obvs` con `tipo='revenue_validation'`. Eso aumentaría directamente `validation_strength` y `iteration_velocity`. Pero sin `source` y `external_id`, no hay trazabilidad.

### Gap principal

`obvs` no tiene campo de origen — OBVs importados de HubSpot son indistinguibles de OBVs internos. Añadir `external_provider` y `external_id` en Bloque B antes de cualquier import de HubSpot deals.

---

## I15.8 — Weekly Review

### Estado: FUNCIONAL

La tabla `weekly_reviews` **existe y está operativa** (migración `20260311000034_weekly_reviews.sql`).

### Schema

```
weekly_reviews: id, project_id
  week_start_date, week_end_date  DATE
  phase, phase_score, phase_status
  mrr, runway_months
  tasks_completed, obvs_count, sales_count
  summary_json JSONB — { headline, highlights[], warnings[], next_step }
  has_regression, has_transition  BOOLEAN
  read_at TIMESTAMPTZ (NULL = no leído)
  UNIQUE(project_id, week_end_date)
```

### Fuentes de datos

| Campo | Tabla origen |
|---|---|
| phase, phase_score, phase_status | `project_phase_state` |
| mrr | `key_metrics.mrr` |
| runway_months | `key_metrics.runway_months` |
| tasks_completed | `tasks` WHERE status='done' AND completed_at esta semana |
| obvs_count | `obvs` WHERE fecha esta semana |
| sales_count | `obvs` WHERE fecha esta semana AND es_venta=TRUE |

**Todo interno.** No hay fuentes externas en el weekly review.

### Generación

- Cron: domingo 23:30 UTC (después de Phase a 00:00 y Risk a 01:00)
- `generate_weekly_review_for_project()` — determinista, sin IA
- UPSERT por `(project_id, week_end_date)` — idempotente
- 9 templates de headline según fase + actividad

### Surface activation

`useActiveSurface()` en `useNovaDataOptimized.ts` prioriza:
1. **reset** — si `ritual_pending = TRUE`
2. **weekly** — si latest review `read_at IS NULL` (no leído)
3. **engine** — default

El `read_at` (migración `20260313000055_fase11_weekly_review_read_at.sql`) controla qué ve el founder al abrir el dashboard.

### Relación con FASE 15

La Weekly Review mejora automáticamente si:
- Stripe → `key_metrics.mrr` real → el campo `mrr` del review es real
- Asana → `tasks` con completed_at correcto → `tasks_completed` refleja trabajo real
- HubSpot → OBVs con tipo='revenue_validation' → `sales_count` refleja deals reales

No requiere cambios en el weekly review ni en la función de generación. **El módulo es pasivo: consume lo que hay en las tablas internas.**

---

## I15.9 — Strategic Cycles

### Estado: INFRAESTRUCTURA COMPLETA, REPORTING FALTA

### Schema `strategic_cycles`

```
strategic_cycles: id, project_id
  cycle_index     INTEGER (1, 2, 3... secuencial)
  start_date      DATE (lunes, ISO week)
  end_date        DATE (start_date + 27 días = 28 días)
  closed_at       TIMESTAMPTZ (NULL = activo)
  close_reason    TEXT (manual|scheduled|pivot)
  engine_snapshot JSONB — { phase, probability, risk, viability, completeness }
  ritual_responses JSONB NULL
  decision_event_id UUID
  UNIQUE(project_id, cycle_index)
```

### Ciclo de vida

1. Proyecto creado → trigger `fn_initialize_project_data()` crea ciclo 1 con `start_date = lunes actual`
2. Cada semana: `run_phase_engine()` y `run_risk_engine()` trabajan dentro del ciclo activo (no leen `strategic_cycles`)
3. Cuando `NOW() > end_date`: cron cierra el ciclo, captura `engine_snapshot`, crea ciclo N+1
4. `close_reason = 'pivot'` si founder cambió los 3 pilares del modelo (migración `20260313000055_ec13_4_pivot_close.sql`)

### Qué engines leen de `strategic_cycles`

- **Phase Engine (O3.3, O4.x):** lee `strategic_cycles` para calcular "tareas hechas desde inicio del ciclo" como proxy de independencia del founder
- **Risk Engine:** NO lee strategic_cycles directamente
- **Probability Engine:** NO lee strategic_cycles
- Los ciclos son **contenedores de medición**, no fuentes de datos para motores

### Gaps

| Gap | Severidad | Acción |
|---|---|---|
| Sin función de retrospectiva (ciclo N vs N-1) | 🟡 Normal | Diseñar cuando exista Cycle History feature. El `engine_snapshot` tiene los datos — falta la función de comparación. |
| Sin análisis de tendencias multi-ciclo | 🟡 Normal | Mismo bloque que retrospectiva |
| `ritual_responses` siempre NULL en v1 | 🟡 Normal | Se popula cuando el founder hace el Strategic Reset. Feature implementada en UI. |

### Relación con FASE 15

Los ciclos son transparentes a las integraciones. External data mejora los engines que trabajan dentro del ciclo — el ciclo solo captura el estado al cierre. **No requiere cambios en `strategic_cycles` para FASE 15.**

---

## Gaps adicionales identificados (Bloque A completo)

| Gap | Motor | Severidad | Acción |
|---|---|---|---|
| Phase 3 O3.1 necesita ≥4 meses `key_metrics.mrr` — sin Stripe el avance es lento | Phase Engine | 🟠 Alto | Finance Agent con Stripe es el desbloqueador natural. Stripe v1 → MRR real → cadena automática |
| Risk Engine timing: Phase lee risk_score con 7d de desfase en cadena semanal | Risk + Phase | 🟢 Bajo | Aceptable en v1. Solo afecta cambios bruscos de riesgo. Documentado como comportamiento intencional |
| `obvs` sin `external_provider`/`external_id` | OBVs | 🟠 Alto | Añadir en Bloque B antes de cualquier import de HubSpot deals |
| Weekly Review: `mrr` puede ser NULL si no hay key_metrics — headline degradado | Weekly Review | 🟡 Normal | Finance Agent con Stripe resuelve esto como efecto secundario |
| Ciclos sin función de retrospectiva/tendencia | Strategic Cycles | 🟡 Normal | Diseñar cuando se implemente Cycle History (feature gated por closedCyclesCount) |

---

> **Bloque A cerrado.** I15.1, I15.3, I15.7, I15.8, I15.9 auditados.
> **Próximo:** INTEGRATION_ARCHITECTURE.md — diagrama capstone.
