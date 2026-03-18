# BENCHMARKS V1 — Nova Hub

> Referencia de benchmarks para el engine y Optimus.
> Versión: v1.0 · Fecha: 2026-03-12
>
> **Dos tipos de benchmark en este documento:**
> 1. **Financial benchmarks** → se insertan en tabla `benchmarks` (6 métricas × model_type).
> 2. **Process benchmarks** → referencia para Optimus, no entran en DB.
>
> Fuente: Opción C híbrido (curado + interno). Schema: `benchmarks.source_type IN ('curated', 'internal')`.
> Confidence scores v1 = 50–65 (curado sin datos internos). Revisar cuando `n_proyectos_validos >= 10`.

---

## Por qué importan los benchmarks ahora

**G4.3 activo:** El Viability Engine T3 (overload) compara `v_growth_real >= v_benchmark_p50`.
Si no existe fila en `benchmarks` para el `model_type`/`cluster` del proyecto, `v_benchmark_p50 = NULL`
y la comparación T3 siempre es FALSE — el trigger de overload nunca dispara.

**Fix inmediato:** seedear al menos `model_type='unknown'`, `region_cluster='unknown'`
para que todos los proyectos sin clasificar reciban el fallback correcto.

**Dónde se usan en el engine:**

| metric_name | Engine function | Migración | Efecto |
|---|---|---|---|
| `crecimiento_p50` | Viability T3 (overload) | 00009 | T3 usa p50 como umbral de overload |
| `margen_estimado` | O4.2 margin_stability | 00015 | Contexto de margen vs mercado |
| `crecimiento_p50` | O4.1 avg_growth_4m | 00015 | La escala 5%→33/10%→67/15%→100 es implícita en el engine |
| `conversion_media` | No usa directamente en v1 | — | Referencia Optimus en Phase 2–3 |
| `ciclo_venta_medio` | No usa directamente en v1 | — | Referencia Optimus en Phase 2–3 |
| `ticket_medio` | No usa directamente en v1 | — | Referencia Optimus en Phase 3–4 |
| `cac_estimado` | No usa directamente en v1 | — | Referencia Optimus en Phase 3–4 |

---

## Parte 1 — Financial Benchmarks (→ tabla `benchmarks`)

### Schema de referencia

```
industry       TEXT    (general | saas | fintech | marketplace | ...)
model_type     TEXT    (saas | service | physical | marketplace | agency | unknown)
region_cluster TEXT    (unknown para catch-all v1)
metric_name    TEXT    (6 valores con CHECK)
p25 / p50 / p75 NUMERIC
source_type    TEXT    (curated)
confidence_score INTEGER (0–95)
```

---

### 1.1 — `crecimiento_p50` (tasa de crecimiento mensual, decimal)

Derivado del engine spec: la escala de O4.1 usa `avg_growth / 0.15 × 100`, lo que implica:
- 5% mensual = p25 (mínimo funcional)
- 10% mensual = p50 (expected)
- 15% mensual = p75 (strong)

Estos valores son base para todos los model_types. La diferencia está en el contexto: un 5% para una agencia es más difícil de sostener que para SaaS.

| model_type | p25 | p50 | p75 | confidence |
|---|---|---|---|---|
| saas | 0.05 | 0.10 | 0.20 | 65 |
| service | 0.03 | 0.07 | 0.15 | 60 |
| marketplace | 0.08 | 0.15 | 0.30 | 55 |
| agency | 0.03 | 0.06 | 0.12 | 60 |
| physical | 0.02 | 0.05 | 0.10 | 55 |
| unknown | 0.04 | 0.08 | 0.15 | 50 |

> Nota: `unknown` p50=0.08 (8% mensual) reemplaza el fallback hardcodeado `COALESCE(v_benchmark_p50, 0.05)` de G4.3.
> Seedear `unknown` primero — resuelve el gap activo.

---

### 1.2 — `margen_estimado` (margen bruto estimado, decimal)

| model_type | p25 | p50 | p75 | confidence |
|---|---|---|---|---|
| saas | 0.40 | 0.65 | 0.80 | 65 |
| service | 0.20 | 0.35 | 0.55 | 65 |
| marketplace | 0.15 | 0.25 | 0.40 | 60 |
| agency | 0.25 | 0.40 | 0.60 | 60 |
| physical | 0.10 | 0.25 | 0.45 | 55 |
| unknown | 0.20 | 0.35 | 0.55 | 50 |

---

### 1.3 — `conversion_media` (tasa lead→cliente o trial→pago, decimal)

| model_type | p25 | p50 | p75 | confidence |
|---|---|---|---|---|
| saas | 0.01 | 0.03 | 0.08 | 60 |
| service | 0.05 | 0.15 | 0.30 | 60 |
| marketplace | 0.02 | 0.05 | 0.12 | 55 |
| agency | 0.10 | 0.25 | 0.45 | 55 |
| physical | 0.03 | 0.08 | 0.18 | 55 |
| unknown | 0.03 | 0.08 | 0.20 | 50 |

---

### 1.4 — `ciclo_venta_medio` (días hasta cierre)

| model_type | p25 | p50 | p75 | confidence |
|---|---|---|---|---|
| saas | 7.00 | 14.00 | 30.00 | 60 |
| service | 14.00 | 30.00 | 60.00 | 65 |
| marketplace | 3.00 | 7.00 | 14.00 | 55 |
| agency | 21.00 | 45.00 | 90.00 | 60 |
| physical | 3.00 | 7.00 | 21.00 | 55 |
| unknown | 7.00 | 21.00 | 45.00 | 50 |

---

### 1.5 — `ticket_medio` (USD — requiere validación del usuario)

⚠️ **Alta varianza por industria.** Los valores abajo son relativos, no absolutos.
Confidence_score = 40 hasta validación. Actualizar por modelo + industria cuando haya datos internos.

| model_type | p25 (USD) | p50 (USD) | p75 (USD) | confidence |
|---|---|---|---|---|
| saas | 49 | 199 | 499 | 40 |
| service | 500 | 2000 | 8000 | 40 |
| marketplace | 25 | 100 | 400 | 40 |
| agency | 2000 | 8000 | 25000 | 40 |
| physical | 20 | 80 | 300 | 40 |
| unknown | 100 | 500 | 2000 | 35 |

> Para actualizar a confidence ≥ 60: necesita al menos `n_proyectos_validos >= 5` por model_type.

---

### 1.6 — `cac_estimado` (USD — requiere validación del usuario)

⚠️ Alta varianza. CAC depende del canal, el ticket, y la fase del proyecto.
Los valores abajo son para early-stage (Phase 2–3). Phase 4 será diferente.

| model_type | p25 (USD) | p50 (USD) | p75 (USD) | confidence |
|---|---|---|---|---|
| saas | 50 | 300 | 1000 | 40 |
| service | 100 | 500 | 2000 | 40 |
| marketplace | 20 | 100 | 400 | 40 |
| agency | 200 | 800 | 3000 | 40 |
| physical | 15 | 80 | 350 | 40 |
| unknown | 50 | 300 | 1500 | 35 |

> Ratio sanidad: CAC debería ser < 3× ticket_medio en Phase 3, < 1× en Phase 4.

---

## Parte 2 — Process Benchmarks por Fase (→ referencia Optimus, no DB)

Estos benchmarks no tienen columna en `benchmarks`. Son valores de referencia que Optimus
usa para contextualizar el estado de avance del proyecto dentro de su fase.

---

### Fase 1 — Descubrimiento

**Señal esperada:** evidencia de que el problema es real y frecuente para un segmento.

| Signal | Low (sin avance) | Expected | Strong |
|---|---|---|---|
| Entrevistas realizadas | 0–2 | 3–10 | 10+ |
| Personas que describen el mismo problema espontáneamente | 0–1 | 2–3 | 4+ |
| demand_coverage | `none` | `basic` | `validated` |
| Semanas en Phase 1 sin señal | > 4 | 2–4 | < 2 |

**Señal de avance de fase:** `demand_coverage → 'basic'` tras 3+ personas describiendo el mismo problema sin sugerencia.

---

### Fase 2 — Validación

**Señal esperada:** problema confirmado, solución mínima probada, primera señal de pago real.

| Signal | Low | Expected | Strong |
|---|---|---|---|
| Personas del segmento objetivo entrevistadas | < 5 | 5–20 | 20+ |
| Usuarios que usaron el prototipo sin pedírselo | 0 | 1–2 | 3+ |
| Evidencia de pago real (OBV payment) | 0 | 1 | 2+ |
| revenue_momentum_input | < 30 | 30–50 | ≥ 60 |
| delivery_coverage | `none` | `basic` | `working` |

**Hard signal de avance de fase:** OBV payment verificado + revenue_momentum_input ≥ 40 (ambos).

---

### Fase 3 — Operación

**Señal esperada:** canal activo, crecimiento mensual medible, ejecución estable.

| Signal | Low | Expected | Strong |
|---|---|---|---|
| acquisition_channels_count | 0 | 1 | 2+ |
| Meses con MRR estable o creciente | 0–1 | 1–2 | ≥ 3 |
| tasks_done_28d | 0–2 | 3–5 | 6+ |
| iteration_velocity | < 2 | 2–3 | ≥ 4 |
| Crecimiento mensual | < 3% | 5–10% | ≥ 15% |

**Hard signal de avance de fase:** stable_months ≥ 3 + tasks_done_28d ≥ 3 + iteration_velocity ≥ 2 + phase3_score ≥ 75.

---

### Fase 4 — Escala

**Señal esperada:** crecimiento semanal consistente sin aumento proporcional de coste o esfuerzo.

| Signal | Low | Expected | Strong |
|---|---|---|---|
| Crecimiento mensual promedio (4 meses) | < 5% | 5–10% | ≥ 15% |
| margin_stability_score | < 40 | 40–60 | ≥ 75 |
| Roles delegados (no solo founder) | < 2 | 2 | ≥ 3 |
| CAC vs ticket_medio ratio | > 3× | 1–3× | < 1× |
| probability_trend | declining/stable | stable/growing | growing sostenido 3+ semanas |

**Hard signal (informacional en v1):** O4.1 ≥ 33 (avg_growth ≥ 5%) + O4.2 ≥ 50 + risk_level no en high/critical.

---

## Cómo usa Optimus estos benchmarks

**Financial benchmarks (Parte 1):**
Optimus recibe el contexto del engine (`get_optimus_context()`). El engine ya calcula scores
normalizados usando los benchmarks de DB. Optimus no accede a la tabla directamente — opera
con los campos derivados (phase_score, probability_score, viability_status).

**Process benchmarks (Parte 2):**
Optimus los usa como referencia contextual cuando interpreta señales débiles. Por ejemplo:
si `demand_coverage = 'basic'` pero solo hay 1 entrevista, la confianza es menor que si hay 6.
La tabla de Process Benchmarks da a Optimus el lenguaje para calibrar su confidence.

**Conexión con OPTIMUS_PROMPTS.md:**
- CASE-01/02 (exploración): usa Fase 1 y Fase 2 process benchmarks
- CASE-03/04 (estándar): usa Fase 3 process benchmarks + conversion/CAC financiero
- CASE-05/06/07 (stagnation/estricto): usa crecimiento mensual y márgenes

---

## Seed data — Priority order

```
Prioridad 1 (resuelve G4.3 activo): crecimiento_p50 × unknown
Prioridad 2: crecimiento_p50 × todos los model_types
Prioridad 3: margen_estimado × todos los model_types
Prioridad 4: conversion_media + ciclo_venta_medio
Prioridad 5: ticket_medio + cac_estimado (con confidence = 40, revisión pendiente)
```

**SQL seed — Prioridad 1 (fix G4.3):**

```sql
INSERT INTO benchmarks (industry, model_type, region_cluster, metric_name, p25, p50, p75, source_type, confidence_score, source_notes)
VALUES
  ('general', 'unknown',     'unknown', 'crecimiento_p50', 0.04, 0.08, 0.15, 'curated', 50, 'Fallback v1. Reemplaza COALESCE 0.05 hardcoded en Viability T3.'),
  ('general', 'saas',        'unknown', 'crecimiento_p50', 0.05, 0.10, 0.20, 'curated', 65, 'Early-stage SaaS monthly MRR growth. Curated v1.'),
  ('general', 'service',     'unknown', 'crecimiento_p50', 0.03, 0.07, 0.15, 'curated', 60, 'Early-stage service/consulting monthly revenue growth.'),
  ('general', 'marketplace',  'unknown', 'crecimiento_p50', 0.08, 0.15, 0.30, 'curated', 55, 'Early-stage marketplace GMV/revenue monthly growth.'),
  ('general', 'agency',      'unknown', 'crecimiento_p50', 0.03, 0.06, 0.12, 'curated', 60, 'Early-stage agency monthly revenue growth.'),
  ('general', 'physical',    'unknown', 'crecimiento_p50', 0.02, 0.05, 0.10, 'curated', 55, 'Early-stage physical product monthly revenue growth.')
ON CONFLICT (industry, model_type, region_cluster, metric_name, source_type) DO NOTHING;
```

> Ejecutar este SQL en Supabase antes de que Viability T3 tenga proyectos reales en Phase 4.

---

## Notas de implementación

**Confidence scores en v1:**
- 65: curado desde benchmarks públicos de referencia (SaaS, servicios B2B).
- 55–60: estimado con menos datos de referencia.
- 40–50: alta varianza, requiere validación con datos internos.
- Umbral de actualización: cuando `n_proyectos_validos >= 10` por fila, recalcular desde datos internos y cambiar `source_type → 'internal'`.

**Lo que falta para v2:**
- Benchmarks por `industry` específica (fintech, healthtech, edtech).
- Benchmarks por `region_cluster` real (latam, europe, usa).
- Integración de `n_proyectos_validos` desde datos internos acumulados.
- `ticket_medio` y `cac_estimado` validados por industry real.

**Fuente v1:** Opción C híbrido (F1.9). Los valores de `crecimiento_p50` están anclados en la escala
del engine spec (O4.1: 5%→33, 10%→67, 15%→100). Los demás valores son curados desde referencias
públicas de early-stage startups. Confidence < 60 hasta tener datos internos.

---

*v1.0 — 2026-03-12*
*Para el engine que usa estos benchmarks → ENGINE_SPEC_V1.md (O4.1, O4.2, Viability T3).*
*Para Optimus y playbooks → OPTIMUS_PROMPTS.md, BUILD_PLAYBOOKS.md.*
*Para gap activo G4.3 → ejecutar SQL seed Prioridad 1 antes de lanzar.*
