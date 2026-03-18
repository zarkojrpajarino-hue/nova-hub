# SYSTEM OVERVIEW — Nova Hub

> Mapa de dependencias entre artefactos de diseño y runtime.
> Versión: v1.1 · Fecha: 2026-03-12
>
> Una página. Para saber qué revisar cuando cambia algo.

---

## Stack de decisión

```
Engine (DB computations)
  → project_phase_state, project_probability, project_risk_score,
    project_viability_state, project_economic_profile
         ↓ populates
get_optimus_context()  [migración 00049]
         ↓ reads from
benchmarks table  [BENCHMARKS_V1.md — seed pendiente, G4.3 activo]
         ↓ feeds into
OPTIMUS_PROMPTS.md  (7 CASEs semanales + §8 ritual — interpreta señales del engine)
         ↓ vocabulary from
MICROCOPY_SYSTEM.md  (70 state_ids — copy para UI y Optimus)
         ↓ tactical action from
BUILD_PLAYBOOKS.md / RESCUE_PLAYBOOKS.md  (10 playbooks — qué hacer)
         ↓ structured decision via
STRATEGIC_RESET_RITUAL.md  (cada 4 semanas — → strategic_cycles.ritual_responses)
         ↓ generates new signal via
DISCOVERY_PATH.md  (Interview Template + Persona Canvas + 7-Day Guide)
         ↓ updates
demand_coverage → engine recalculates → loop restart
```

---

## Runtime layer (estado real, verificado 2026-03-12)

### Cron pipeline — domingo UTC

```
00:00  weekly-phase-engine          → run_phase_engine()
00:30  weekly-probability-engine    → run_probability_engine()
01:00  weekly-risk-engine           → run_risk_engine()
01:30  weekly-viability-engine      → run_viability_engine()
02:00  weekly-economic-profile-engine → run_economic_profile_engine()
02:30  weekly-org-capacity-engine   → run_org_capacity_engine()
23:30  weekly-reviews-generator     → generate_all_weekly_reviews()
```

### Otros crons

```
cada 6h       notification-batch             → run_notification_batch()
08:00 UTC     notification-health-snapshot   → capture_notification_health_snapshot()
lun 08:00 UTC cycle-checks                   → run_strategic_cycle_checks()
```

**Coordinación semanal:**
- Dom 23:30 → `generate_all_weekly_reviews()` (semanas 1–3 del ciclo — skip semana 4)
- Lun 08:00 → `run_strategic_cycle_checks()` (safety net ritual + auto-cierre grace period)

### Triggers en tiempo real

```
INSERT projects → trg_initialize_project_data()
  → crea strategic_cycles ciclo 1 (cycle_index=1, start_date=lunes, end_date=+27d)

INSERT/UPDATE obvs → trg_obvs_insert_outcome_phase()
  → dispara run_phase_engine() si obv_outcome NOT NULL
```

---

## FASE 10 — Estado post-implementación (v1.1)

FASE 10 cerrada 2026-03-12. Migraciones 00050–00052.

| Ítem | Estado | Migración |
|---|---|---|
| `close_strategic_cycle()` — cierra ciclo + crea N+1 | ✅ Implementado | 00050 |
| Rollover automático (crear ciclo N+1) | ✅ Implementado en `close_strategic_cycle()` | 00050 |
| `submit_strategic_reset()` — escribe `ritual_responses` | ✅ Implementado | 00050 |
| Cron lunes 08:00 (`run_strategic_cycle_checks()`) | ✅ Implementado | 00051 |
| Skip semana 4 en `generate_all_weekly_reviews()` | ✅ Implementado | 00051 |
| `get_ritual_optimus_context()` — bundle para R10.2 | ✅ Implementado | 00052 |
| Template Optimus ritual (OPTIMUS_PROMPTS.md §8) | ✅ Implementado | — |
| UI surface para el ritual | ❌ Pendiente | FASE 11 |

**Gaps residuales:**
- **G4.3 (activo):** `benchmarks` table vacía — ejecutar SQL seed de `BENCHMARKS_V1.md` antes de Phase 4.
- **Storage del output Optimus ritual** (`optimus_cycle_interpretation JSONB`): diferido a FASE 11 si lo requiere el frontend.

---

## Change impact table

Si modificas algo de esta columna, revisa lo que aparece en la otra.

| Si modificas... | Revisa... |
|---|---|
| Campos de `get_optimus_context()` | `OPTIMUS_PROMPTS.md` (input schema §1), `MICROCOPY_SYSTEM.md` (state_ids) |
| Valores de `demand_coverage` enum | `BUILD_PLAYBOOKS.md` (triggers/signals), `RESCUE_PLAYBOOKS.md`, `BENCHMARKS_V1.md`, `DISCOVERY_PATH.md` (Day 5, Day 7) |
| Thresholds de avance de fase | `BENCHMARKS_V1.md` (process benchmarks Phase 1–4), `BUILD_PLAYBOOKS.md` (hard signals) |
| Modos de Optimus (exploracion/estandar/estricto) | `OPTIMUS_PROMPTS.md` (todos los CASEs), `OPTIMUS_CHARACTER.md` |
| Triggers o acciones de playbooks | `OPTIMUS_PROMPTS.md` (next moves en CASEs 01–07), `STRATEGIC_RESET_RITUAL.md` (exit paths) |
| Schema de `strategic_cycles` | `STRATEGIC_RESET_RITUAL.md` (output schema + campos), `BENCHMARKS_V1.md` (notas implementación) |
| Tabla `benchmarks` (métricas o model_types) | `ENGINE_SPEC_V1.md` (Viability T3, O4.1), `BENCHMARKS_V1.md` |
| Vocabulario de `MICROCOPY_SYSTEM.md` | `OPTIMUS_PROMPTS.md` (vocabulary anchors en cada CASE), UI components |

---

## Artefactos del sistema

| Archivo | Qué es | Escribe en DB |
|---|---|---|
| `ENGINE_SPEC_V1.md` | Spec autoritativa del engine — fórmulas, thresholds, gates | No |
| `OPTIMUS_CHARACTER.md` | Carácter, modos, restricciones y superficie canónica de Optimus | No |
| `MICROCOPY_SYSTEM.md` | Diccionario de copy para todos los estados del engine (70 state_ids) | No |
| `OPTIMUS_PROMPTS.md` | Templates de prompts por modo + bloque (7 CASEs + §8 ritual) | No |
| `BUILD_PLAYBOOKS.md` | 5 playbooks de Build Mode con triggers del engine | No |
| `RESCUE_PLAYBOOKS.md` | 5 playbooks de Rescue Mode con triggers del engine | No |
| `STRATEGIC_RESET_RITUAL.md` | Las 5 preguntas + schema de output del ritual | → `strategic_cycles.ritual_responses` (implementado) |
| `BENCHMARKS_V1.md` | Financial benchmarks (DB) + process benchmarks (Optimus) | → `benchmarks` (seed pendiente) |
| `DISCOVERY_PATH.md` | Interview Template + Persona Canvas + 7-Day Guide | → `demand_coverage` indirectamente (vía OBVs/events) |

---

## Acción pendiente con impacto activo

**G4.3 (abierto):** `benchmarks` table está vacía. Viability T3 usa `COALESCE(v_benchmark_p50, 0.05)` como fallback. Ejecutar SQL seed de `BENCHMARKS_V1.md` (Prioridad 1) antes de que haya proyectos reales en Phase 4.

---

*v1.1 — 2026-03-12*
*Para spec del engine → ENGINE_SPEC_V1.md.*
*FASE 10 cerrada — ver estado post-implementación arriba.*
