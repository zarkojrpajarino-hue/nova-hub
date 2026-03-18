# ENGINE_SPEC_V1.md
## Nova Hub — Engine Specification v1
### Fuente canónica de implementación. Cerrada para E4.3–E4.5.

**Fecha**: 2026-03-09
**Estado**: Autoritativo — implementar contra este documento, no contra ENGINE_DESIGN.md
**Autor**: Decisiones de diseño 2026-03-09 sobre base matemática FASE_1 (cerrada 2026-02-24)

---

## 0. Jerarquía de fuentes de verdad

Orden de autoridad (mayor = gana):

```
1. Migration SQL implementado         → hecho consumado; no revertir sin migración nueva
2. ENGINE_SPEC_V1.md  (este archivo)  → intención canónica para lo no implementado aún
3. FASE_1_MATEMATICA_Y_FUNDAMENTOS.md → base matemática de F1.1–F1.13
4. ENGINE_DESIGN.md                   → registro histórico de diseño únicamente
```

**Regla operativa**: si ENGINE_DESIGN.md contradice ENGINE_SPEC_V1.md o FASE_1 →
ENGINE_DESIGN.md está equivocado. No discutir. Implementar contra este archivo.

---

## 1. Mapeo legacy → canónico

### 1.1 Funciones críticas (canónico en SQL)

| Canónico (SQL) | Nombres alternativos en ENGINE_DESIGN.md | Tabla |
|---|---|---|
| `demand`   | Sales, Marketing, Ventas, Captación | `project_functions.function_type` |
| `delivery` | Operations, Ops, Entrega             | `project_functions.function_type` |
| `cash`     | Finance, Finanzas, Cobros            | `project_functions.function_type` |

ENGINE_DESIGN.md §5.2 usa "Sales / Marketing / Finance / Operations" como áreas funcionales.
Esos nombres son **etiquetas de UI**. El SQL de motores usa **siempre** demand/delivery/cash.
No existe función "Support" en motores — es informativo únicamente (tasks.function_type = 'support').

### 1.2 Fuente canónica para O2.3

| Fuente | Estado |
|---|---|
| `project_acquisition_channel` (migration 00012) | **CANÓNICA** — usar en E4.3 |
| `project_strategy_current.value_prop_text` | **DEPRECADA para O2.3** |
| `crm_leads` | **DEPRECADA para O2.3** |

ENGINE_DESIGN.md §2.2 define O2.3 usando `value_prop_text` + `crm_leads`.
Esa definición está **supersedida por migration 00012** y por este documento.

### 1.3 Columna de usuario en project_members

```sql
project_members.member_id  →  UUID REFERENCES profiles(id)
```

No existe `user_id` en `project_members`. Todo SQL nuevo usa `member_id`.

---

## 2. Fase 1 — Descubrimiento (congelada)

Ya implementada en migration 00005. **No modificar.**

**Fórmula canónica** (migration 00005 + FASE_1 F1.5):
```
phase1_score = (O1.1 × 0.40) + (O1.2 × 0.40) + (O1.3 × 0.20)
```

ENGINE_DESIGN.md muestra 0.40/0.30/0.30 — **incorrecto**. Migration 00005 gana.

---

## 3. Fase 2 — Validación (E4.3)

### Fórmula
```
phase2_score = (O2.1 × 0.45) + (O2.2 × 0.25) + (O2.3 × 0.30)
```
Fuente: ENGINE_DESIGN.md §2.2 — adoptada como canónica porque FASE_1 no define Fase 2.

### Hard signal para salir de Fase 2 (ambas condiciones obligatorias)
```
1. EXISTS(
     SELECT 1 FROM obvs
     WHERE project_id = $project_id
       AND tipo::text IN ('revenue_validation', 'venta')
       AND evidence_type = 'payment'         -- comprobante de pago real
       AND obv_outcome   = 'success'         -- resultado confirmado por founder
       AND created_at   >= NOW() - INTERVAL '90 days'
   )

2. COALESCE(revenue_momentum_input, 30) >= 40
   (desde project_probability — columna revenue_momentum_input del último run)
```

**Umbral 40**: calibración migration 00017 (2026-03-09).
`compute_revenue_momentum` retorna: creciente→60+, estable→40, cayendo→<40, sin datos→30 (COALESCE).
Con `>0` el default 30 siempre pasaba → condición vacía. Con `>=40` requiere MRR estable o creciente
en al menos 2 meses consecutivos. Un proyecto con 1 solo mes de MRR recibe 30 → no pasa. Correcto.

**Data path**: `key_metrics.mrr` → `compute_revenue_momentum` (motor prob) → `project_probability.revenue_momentum_input`.
UI: `KeyMetricsEditor` (tab Financiero del proyecto, sprint 2026-03-09).

**Dependencia de orden**: run_phase_engine escribe project_phase_state → dispara
trg_phase_state_probability → corre run_probability_engine. Por tanto cuando run_phase_engine
evalúa el hard signal #2, lee el valor del run ANTERIOR de probabilidad. Comportamiento correcto:
no se puede esperar a un probability run del mismo ciclo.
Si no hay fila en project_probability → COALESCE a 30 (neutral, 30<40 → hard signal #2 bloquea hasta que haya datos).

### Regression trigger
```
8 semanas con 0 actividad CRM + 0 OBV validations → regression warning
```

---

## 3.1 O2.1 — Revenue or commitment evidence (peso: 0.45)

**Fuente de datos**: tabla `obvs`

**Conflicto resuelto**: ENGINE_DESIGN.md describe estados Saludable/Fricción/Crítico sin fórmula
numérica. Este documento define la fórmula exacta.

```sql
-- SCHEMA CONFIRMADO (migration 00003):
--   obvs.obv_outcome   TEXT CHECK ('success','partial','fail') -- NULL = no documentado
--   obvs.evidence_type TEXT CHECK ('payment','interview_recording','public_url','screenshot','doc','other')
--   verification_multiplier → NO es columna; se computa inline desde tipo (ver v_obvs_canonical)
--   status = 'validated'    → NO aplica aquí; es kpi_status de la fila OBV, no el resultado

-- Pagos verificados: comprobante de pago real + resultado confirmado. Ventana 90 días.
verified_payments := COUNT(*) FROM obvs
  WHERE project_id   = $project_id
    AND tipo::text  IN ('revenue_validation', 'venta')
    AND evidence_type = 'payment'
    AND obv_outcome   = 'success'
    AND created_at   >= NOW() - INTERVAL '90 days';

-- Compromisos: LOI/pre-orders/acuerdos sin evidencia de pago. Sin ventana (acumulativos).
commitments := COUNT(*) FROM obvs
  WHERE project_id   = $project_id
    AND tipo::text  IN ('revenue_validation', 'venta')
    AND (evidence_type IS NULL OR evidence_type != 'payment')
    AND obv_outcome  IN ('success', 'partial');

-- Fórmula
O2.1 =
  CASE
    WHEN verified_payments >= 3  THEN 100
    WHEN verified_payments >= 2  THEN 90
    WHEN verified_payments >= 1  THEN 80
    WHEN commitments >= 3        THEN 75   -- 3 LOI/pre-orders = Saludable mínimo
    WHEN commitments >= 2        THEN 50
    WHEN commitments >= 1        THEN 30
    ELSE                              0
  END;
```

**Mapa de scores**:
| Evidencia | O2.1 | Zona |
|---|---|---|
| 0 evidencias | 0 | Crítico |
| 1 compromiso | 30 | Fricción |
| 2 compromisos | 50 | Fricción |
| ≥3 compromisos (LOI) | 75 | Saludable mínimo |
| 1 pago verificado | 80 | Saludable |
| 2 pagos verificados | 90 | Saludable |
| ≥3 pagos verificados | 100 | Saludable máximo |

**Nota**: compromisos sin pago verificado no superan 75 — correcto por diseño.
El hard signal de salida de Fase 2 requiere pago verificado igualmente.

---

## 3.2 O2.2 — Validated MVP tested (peso: 0.25)

**Fuente de datos**: tabla `obvs` + tabla `strategic_model_versions`

**Conflicto resuelto**: ENGINE_DESIGN.md dice "≥3 sessions with documented pivots = saludable".
Este documento separa sessions y pivots: sessions = base, pivot activo = indicador de iteración real.

```sql
-- Sessions de validación de producto con resultado documentado (success o partial)
product_sessions := COUNT(*) FROM obvs
  WHERE project_id  = $project_id
    AND tipo::text IN ('product_validation', 'validacion')
    AND obv_outcome IN ('success', 'partial');

-- Pivots recientes (28 días) = evidencia de bucle de aprendizaje activo
pivot_count := COUNT(*) FROM strategic_model_versions
  WHERE project_id = $project_id
    AND created_at >= NOW() - INTERVAL '28 days';

-- Fórmula
O2.2 =
  CASE
    WHEN product_sessions >= 3 AND pivot_count >= 1 THEN 100  -- sesiones + iteración activa
    WHEN product_sessions >= 3                       THEN 75   -- sesiones sin pivot reciente
    WHEN product_sessions >= 2                       THEN 55
    WHEN product_sessions >= 1                       THEN 30
    ELSE                                                  0
  END;
```

**Mapa de scores**:
| Sesiones | Pivot ≤28d | O2.2 | Zona |
|---|---|---|---|
| 0 | - | 0 | Crítico |
| 1 | cualquiera | 30 | Fricción |
| 2 | cualquiera | 55 | Fricción |
| 3+ | NO | 75 | Saludable |
| 3+ | SÍ | 100 | Saludable máximo |

---

## 3.3 O2.3 — Repeatable acquisition channel (peso: 0.30)

**Fuente de datos**: tabla `project_acquisition_channel` (migration 00012)
**Reemplaza**: `project_strategy_current.value_prop_text` + `crm_leads` (ENGINE_DESIGN.md §2.2)

```sql
-- Seleccionar canal primario con mayor score (tiebreak por updated_at)
primary_channel := (
  SELECT *
  FROM project_acquisition_channel
  WHERE project_id = $project_id
    AND is_primary = TRUE
  ORDER BY (
    CASE WHEN documented_playbook = TRUE THEN 3 ELSE 0 END
    + CASE WHEN last_validated_at >= NOW() - INTERVAL '60 days' THEN 2 ELSE 0 END
    + CASE WHEN estimated_cac IS NOT NULL THEN 1 ELSE 0 END
  ) DESC, updated_at DESC
  LIMIT 1
);

-- Fórmula
IF primary_channel IS NULL THEN
  O2.3 := 0;
ELSE
  score := 30;  -- base: canal primario declarado
  IF primary_channel.documented_playbook = TRUE THEN
    score := score + 30;
  END IF;
  IF primary_channel.last_validated_at >= NOW() - INTERVAL '60 days' THEN
    score := score + 25;
  END IF;
  IF primary_channel.estimated_cac IS NOT NULL THEN
    score := score + 15;
  END IF;
  O2.3 := score;
END IF;
```

**Mapa de scores**:
| Canal primario | Playbook | Validado ≤60d | CAC | O2.3 |
|---|---|---|---|---|
| NO | - | - | - | 0 |
| SÍ | NO | NO | NO | 30 |
| SÍ | SÍ | NO | NO | 60 |
| SÍ | NO | SÍ | NO | 55 |
| SÍ | NO | NO | SÍ | 45 |
| SÍ | SÍ | NO | SÍ | 75 |
| SÍ | SÍ | SÍ | NO | 85 |
| SÍ | SÍ | SÍ | SÍ | 100 |

**Regla multi-primary**: si existen múltiples filas con `is_primary = TRUE`, usar la de mayor
score individual (ORDER BY calculado arriba). Ties: `updated_at DESC`.

**Ventana de validación**: 60 días. Revisable en v2 con datos reales (propuesta inicial del founder).

**Nota UX**: `last_validated_at` solo se actualiza con acción explícita del usuario (botón
"Validado hoy"). No se auto-rellena. Sin ese botón en UI, factor +25 nunca contribuye.
Construir UI de AcquisitionChannelEditor antes de que O2.3 sea meaningful.

---

## 4. Fase 3 — Operación (E4.4, después de C3.4)

### Fórmula (canónica — FASE_1 F1.6)
```
phase3_score = (O3.1 × 0.40) + (O3.2 × 0.35) + (O3.3 × 0.25)
```

**Conflicto resuelto — pesos**: ENGINE_DESIGN.md muestra O3.2×0.25 + O3.3×0.35.
**INCORRECTO**. FASE_1 F1.6 dice 0.35/0.25. FASE_1 gana.

**Conflicto resuelto — definiciones**: ENGINE_DESIGN.md define O3.2 como "Team functional
with roles" y O3.3 como "OKRs connected to weekly execution". FASE_1 define O3.2 como
"Execution health" y O3.3 como "Independencia del founder".
**FASE_1 gana** para estructura y pesos. Decisión de usuario: O3.3 degradado en v1 (ver abajo).

### O3.1 — Estabilidad temporal (peso: 0.40)
Per FASE_1 F1.6 — sin cambios.
```
O3.1 = MIN(100, (stable_months_in_window / 3) × 100)
```
Definición de "mes estable": ver FASE_1 F1.6. Requiere datos de ingresos mensuales.

### O3.2 — Execution health (peso: 0.35)

```
bloqueo_penalty = MAX(0, 100 - (friction_count × 15) - (critical_count × 40))
O3.2 = (capacity_health × 0.50) + (execution_rate × 0.30) + (bloqueo_penalty × 0.20)

Si velocity = 0 durante ≥4 semanas: O3.2 = MIN(O3.2, 40)
```

**Implementación v1 (migration 00015)**: `friction_count` y `critical_count` NO existen en schema v1.
Proxy: `project_risk_score.risk_level` → bloqueo_penalty:
- 'low' → 100 | 'medium' → 70 | 'high' → 40 | 'critical' → 10 | NULL → 80 (neutral)

`capacity_health`: `compute_capacity_health()` (migration 00003).
`execution_rate`: `compute_execution_rate()` (migration 00006) — fase-aware, incluye role_health via C3.4.

**Dependencia C3.4**: `execution_rate` incluye `role_execution_health` (peso 0.20 en F2,
0.35 en F3). C3.4 (calculate_role_performance_score con 6 fórmulas) debe existir antes
de implementar E4.4. Bloqueo real.

### O3.3 — Independencia del founder — v1 rolling 28d proxy (peso: 0.25)

**Confirmado pre-E4.4**: `strategic_cycles` EXISTS. `tasks.strategic_cycle_id` NO EXISTE.

**PATCH 00017 (2026-03-09)**: se descartó `cycle.start_date` como referencia temporal.
Motivo: el cron de avance de ciclos (`closed_at` rollover) NO está implementado.
`strategic_cycles.closed_at` nunca se escribe → start_date = semana del onboarding,
invariante → `tasks_in_cycle` ≡ historial acumulado total, no actividad del ciclo actual.
Una ventana sin rotación no es una ventana.

**Implementación v1**: rolling 28 días, consistente con `compute_iteration_velocity`:

```sql
-- tasks_done_28d: tareas completadas en los últimos 28 días (rolling window)
-- Variable renombrada: tasks_in_cycle → tasks_done_28d
-- (evita sugerir relación con ciclos que no existe en v1)

tasks_done_28d := COUNT(*) FROM tasks
  WHERE project_id = $project_id
    AND status = 'done'
    AND completed_at >= NOW() - INTERVAL '28 days';

-- Score v1 (max 60 — no puede llegar a 100 sin datos explícitos de delegación)
O3.3 :=
  CASE
    WHEN tasks_done_28d >= 3 THEN 60   -- ejecución estructural mínima — cap v1
    WHEN tasks_done_28d >= 1 THEN 30   -- actividad reciente, no estructural todavía
    ELSE                          20   -- sin ejecución reciente
  END;
```

**Cap natural**: MAX O3.3 = 60. phase3_score cap = (100×0.40) + (100×0.35) + (60×0.25) = **90**.
Score 100 ("función operada por otra persona") requiere v2 con datos explícitos de delegación.

**DEUDA v2 (O3.3)**:
- `tasks.strategic_cycle_id` FK + UI para asignar tarea a ciclo → semántica de ciclo real
- `strategic_cycles` rollover: cron que cierra ciclo N (`closed_at`) y crea ciclo N+1
- `tasks_done_28d` → `tasks_in_cycle` cuando el rollover esté implementado

### Hard signal para salir de Fase 3 — v1 (2 condiciones, migration 00017)

FASE_1 F1.6 define 3 condiciones originales. En v1 se reducen a 2 por ausencia de data paths.

```
1. stable_months >= 3
   (count_stable_revenue_months: 3+ meses MRR estable/creciente en ventana 4m)
   Data path: key_metrics.mrr → KeyMetricsEditor (tab Financiero)

2. tasks_done_28d >= 3
   (tareas done en rolling 28d — NO tasks_in_cycle, ciclo rollover no implementado)
   Data path: tasks.completed_at → TaskCard (TaskCompletionDialog fuerza function_type)
```

**Condición eliminada en v1 (DEUDA v2)**:
```
[ELIMINADA] cost_data_months >= 2
  Razón: financial_projections (cogs, payroll, etc.) sin UI de entrada.
  Una condición muerta no endurece el sistema: lo rompe.
  Reincorporar en v2 cuando exista captura estructurada de costes desde UI.
  Candidato natural: componente O4.2 cuando exista.
```

**Gate completo de avance Fase 3→4** (migration 00017):
```
phase3_score >= 75
AND stable_months >= 3
AND tasks_done_28d >= 3
AND compute_iteration_velocity >= 2
```

---

## 5. Fase 4 — Escala (E4.5 — migration 00018)

### Fórmula (canónica — FASE_1 F1.7)
```
phase4_score = (O4.1 × 0.40) + (O4.2 × 0.35) + (O4.3 × 0.25)
```

**Conflictos resueltos**:

1. **Pesos**: ENGINE_DESIGN.md muestra 0.35/0.30/0.35. **INCORRECTO**. FASE_1 F1.7 dice
   0.40/0.35/0.25. FASE_1 gana.

2. **O4.1**: ENGINE_DESIGN.md dice "≤30% of revenue tasks to founder" (leverage métrica).
   FASE_1 F1.7 dice crecimiento financiero sostenido. **FASE_1 gana**.

3. **O4.2**: ENGINE_DESIGN.md dice "Finance, Sales, Marketing, Ops each with ≥1 active member"
   (4 departamentos). FASE_1 F1.7 dice capacity_health + execution_rate + margin_stability.
   Decisión de usuario 2026-03-09: **FASE_1 gana** (demand/delivery/cash, no 4 departamentos).

4. **O4.3**: ENGINE_DESIGN.md dice "Quarterly OKRs + monthly reviews documented". FASE_1 F1.7
   dice "funciones críticas delegadas a miembros distintos". **FASE_1 gana**.

### O4.1 — Crecimiento sostenido (peso: 0.40)
Per FASE_1 F1.7.
```
O4.1 = MAX(0, MIN(100, (avg_growth_4m / 0.15) × 100))
```
Ejemplos: 5%→33 | 10%→67 | 15%→100 | -5%→0

Data path: `key_metrics.mrr` → `compute_phase4_o41` (últimos 5 meses → 4 tasas MoM).
UI: KeyMetricsEditor (sprint 2026-03-09). `leader_id` alimenta O4.2, no O4.1.

### O4.2 — Execution & margin health (peso: 0.35)
Per FASE_1 F1.7.
```
variance_margen = (max_margen_4m - min_margen_4m) / promedio_margen_4m
margin_stability_score = MAX(0, MIN(100, (1 - variance_margen) × 100))

O4.2 = (capacity_health        × 0.40)
     + (execution_rate         × 0.30)
     + (margin_stability_score × 0.30)
```

Data paths:
- `capacity_health`: `compute_capacity_health()` (migration 00003)
- `execution_rate`: `compute_execution_rate()` (migration 00006) — fase-aware
- `margin_stability_score`: `obvs.margen` agregado mensual (últimos 4 meses).
  Default 50 (neutral) si < 2 meses de datos.

**Nota C3.5**: `execution_rate` incluye `role_execution_health` vía accountability_score.
C3.5 (leader_id en task form) no implementado en v1 → role_execution_health usa proxy
de migration 00006. E4.5 funciona sin C3.5; C3.5 mejora O4.2 en v2.

### O4.3 — Independencia del founder (peso: 0.25)
Per FASE_1 F1.7 — **implementación v1 sin automation_score**.
```
≥3 funciones delegadas (owner_user_id != founder_id)  → 100
≥2 funciones delegadas                                 →  70
< 2                                                    →  30
```
Fuente: `project_functions.owner_user_id` vs `projects.user_id`.
3 function_types (demand/delivery/cash) → ≥3 delegadas = organización no founder-centric.

**DEUDA v2 (O4.3 — automation pathway)**:
```
automation_score NO existe en schema (ninguna tabla, ninguna columna, ninguna UI).
Misma situación que financial_projections en migration 00017 → eliminado de v1.
Reincorporar cuando exista:
  tabla + UI (sistema_automatizado_real×40, proceso_con_checklist_activo×35,
              metricas_auto_generadas×25) + compute engine.
Pathway v2: Con automation_score ≥70 en ≥2 funciones strong → max O4.3 = 100
            para solo founder (actualmente cap = 70).
```

Cap natural v1 (solo founder → max O4.3=70): 100×0.40 + 100×0.35 + 70×0.25 = **92.5**

### Hard signal para salir de Fase 4 — v1 (informacional)

Fase 4 es terminal en v1. No hay avance de fase. `hard_signal_met` indica si el proyecto
opera a escala saludable.
```
1. O4.1 >= 33    → avg_growth_4m >= 5% (crecimiento real positivo)
2. O4.2 >= 50    → ejecución+margen no en rango crítico
3. project_risk_score.risk_level NOT IN ('high', 'critical')
```
Gate: todas las condiciones simultáneas → `hard_signal_met = TRUE` (solo informacional).

---

## 6. Arquitectura de fase — fuente de verdad

**Decisión 2026-03-09** (hallazgo post-E4.5):

| Campo | Tipo | Rol |
|---|---|---|
| `project_phase_state.current_phase` | SMALLINT (1–4) | **Source of truth** — output del engine |
| `projects.fase` | ENUM `project_phase` (6 valores) | Legacy/manual — modelo de producto distinto |

`projects.fase` tiene valores (`'idea'`, `'problema_validado'`, `'solucion_validada'`, `'mvp'`, `'traccion'`, `'crecimiento'`) que **no mapean 1-to-1** con las 4 fases del engine. Son modelos semánticos distintos. Forzar un mapeo introduciría semántica inventada.

**Reglas**:
- La UI lee `project.phase_state.current_phase` para lógica de engine
- `run_phase_engine` NO actualiza `projects.fase` — son modelos independientes
- Nadie escribe `projects.fase` por motivos de engine
- Reconciliación de los dos modelos: deuda v2 (requiere decisión de producto)

**Implementación**:
`useProjects()` (`src/hooks/useNovaDataOptimized.ts`) incluye LEFT JOIN a
`project_phase_state` → expone `project.phase_state.current_phase/phase_score/phase_status/hard_signal_met`.

```typescript
// Fase del engine (source of truth)
const enginePhase = project.phase_state?.current_phase ?? null;

// Fase legacy (no usar para lógica de engine)
// const legacyPhase = project.fase;
```

**P1 pendiente (UX)**: Componentes que muestran fase al usuario (badges, labels,
tabs condicionales) deben migrar a leer `phase_state.current_phase`.
Hasta entonces los dos modelos coexisten sin colisión.

---

## 7. Umbrales de fase (todas)

```
≥75 → Saludable (puede avanzar si hard signal met)
50–74 → Fricción
<50  → Crítico
```
Source: FASE_1 F1.5/F1.6/F1.7 (Fase 4 usa ≥80/60–79/<60 internamente para "healthy scale"
pero el Phase Engine evalúa avance con ≥75 estándar).

---

## 8. Items pendientes antes de implementar

| Item | Bloquea | Estado |
|---|---|---|
| Verificar existencia de `strategic_cycles` y `tasks.strategic_cycle_id` | E4.4 O3.3 proxy | PENDIENTE |
| C3.4 — calculate_role_performance_score (6 fórmulas) | E4.4 O3.2 completo | PENDIENTE |
| C3.5 — leader_id en task form + accountability_score | O4.2 v2 mejora | PENDIENTE (no bloquea E4.5 — proxy funcional) |
| ~~UI AcquisitionChannelEditor (botón "Validado hoy")~~ | O2.3 last_validated_at útil | CERRADO — ya existía antes de EP sprint (EP.1 audit 2026-03-10) |
| ~~Verificar campo `obv_outcome` en tabla `obvs`~~ | E4.3 O2.1 y O2.2 | CERRADO — existe en migration 00003 |
| ~~Verificar campo `strategic_cycle_id` en tabla `tasks`~~ | E4.4 O3.3 | CERRADO — NO existe; proxy temporal implementado en migration 00015 |
| ~~E4.5 Phase 4 Engine~~ | run_phase_engine Phase 4 block | CERRADO — migration 00018 |
| automation_score pathway O4.3 | O4.3 max=100 para solo founder | DEUDA v2 — no existe en schema |
| financial_projections UI | O4.2 cost_data_months | DEUDA v2 — eliminado de hard signal v1 |
| ~~phase_state en useProjects()~~ | UI consume engine phase | CERRADO — LEFT JOIN añadido, `phase_state.current_phase` disponible |
| ~~UI components migrar a `phase_state.current_phase`~~ | Badges, labels, tabs condicionales | CERRADO — OBVStep2Project + useOBVFormLogic → useNovaDataOptimized (EP.2 2026-03-10) |
| C3.4 — calculate_role_performance_score | E4.4 O3.2 completo | DEUDA v2 — ~10 inputs inexistentes en DB; compute_role_execution_health cubre proxy operacional |
| generate-tasks-v2 edge fn lee `projects.fase` (legacy enum) | AI context de fase | DEUDA v2 — decisión de producto pendiente sobre qué fase exponer al modelo |

---

## 9. Lo que ENGINE_DESIGN.md sigue siendo útil

- Notification taxonomy (§9) — 5 layers, 34 tipos — no contradice nada, reference válida
- Viability Engine states (§4) — no implementado aún, referencia válida
- Org Engine capacity formula (§5.1) — referencia válida hasta que se implemente
- Role performance formulas (§7.2) — referencia para C3.4
- Optimus context packet (Appendix B) — referencia de UX
- Solo vs Team adaptations (§10) — referencia válida

Para todo lo demás: ENGINE_SPEC_V1.md gana.

---

*Creado: 2026-03-09*
*Próxima revisión: después de primeros 30 proyectos con datos reales (calibración de umbrales O2.x)*
