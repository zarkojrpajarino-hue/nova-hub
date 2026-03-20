# Feature Matrix — Nova Hub
> V11.1 Audit + V11.2 Output
> Versión: v1.0 · Fecha: 2026-03-12
>
> Clasificación completa de features por superficie, fase, modo y viabilidad.
> Fuente de verdad para V11.3 (visibility system) y V11.4 (teaser UX).
>
> Referencia de superficies: SURFACES_V1.md
> Referencia de reglas: SURFACES_V1.md §System Rules

---

## Leyenda

| Campo | Valores |
|---|---|
| surface | Engine · Weekly · Reset · History · Nav (capa de navegación, no superficie) |
| phase | all · 1–3 · ≥2 · etc. (SMALLINT 1–4 en `project_phase_state.current_phase`) |
| mode | both · build · rescue |
| viability | all · at_risk+ · critical |
| status | ✅ impl · ❌ pending · ⏸ deferred |

---

## Surface 1 — Engine (estado continuo)

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| phase_state display | `ProjectEnginePanel` | Engine | all | both | all | ✅ impl |
| viability_state display | `ProjectEnginePanel` + `ViabilityBanner` | Engine | all | both | all | ✅ impl |
| probability_state display | `ProjectEnginePanel` (ProbabilityCard) | Engine | all | both | all | ✅ impl |
| coverage_state display | `ProjectEnginePanel` (CoverageCards) | Engine | all | both | all | ✅ impl |
| risk_state display | `ProjectEnginePanel` (RiskCard) | Engine | all | both | all | ✅ impl |
| phase_progress_bar | `PhaseProgressBar` | Engine | all | both | all | ✅ impl (U6.2) |
| mode_badge | `ProjectModeBadge` | Engine | all | both | all | ✅ impl (U6.10) |
| Next Action | `getNextAction()` in `ProjectEnginePanel` | Engine | 1–3 | both | all | ✅ impl (XE.3 v1.1) |
| CostOfIgnoring | `CostOfIgnoring` | Engine | 1–3 | both | all | ✅ impl |
| ProbabilityBreakdown | `ProbabilityBreakdown` | Engine | all | both | all | ✅ impl |
| RiskBreakdown | `RiskBreakdown` | Engine | all | both | all | ✅ impl |
| RegressionBanner | `RegressionBanner` | Engine | ≥2 phases seen | both | all | ✅ impl |
| ViabilityBanner | `ViabilityBanner` | Engine | all | both | at_risk+ | ✅ impl |
| PhaseHorizonHint | `PhaseHorizonHint` | Engine | all | both | all | ✅ impl |
| **Optimus interpretation** | — | Engine | all | both | all | ❌ pending FASE 11 |

### Next Action — cobertura por fase

| Fase | Condición → acción | Cubierta |
|---|---|---|
| 1 | !hard_signal_met OR demand=weak → crear OBV | ✅ |
| 2a | demand=weak AND !hard_signal_met → crear OBV | ✅ |
| 2b | demand=weak AND hard_signal_met AND phase_score≥70 → definir canal | ✅ |
| 2c | demand=ok AND probability=inactive → añadir métricas | ✅ |
| 3a | delivery=weak OR cash=weak → crear OBV | ✅ |
| 3b | ops=ok AND !hard_signal_met → crear OBV | ✅ |
| **4** | **ningún tier definido** | **❌ sin cobertura** |
| any | risk=critical → reduce riesgo primero | ✅ |
| 3+ | risk=high → resolver riesgo | ✅ |

> **Gap:** Next Action no tiene lógica para Phase 4. Retorna `null`. Registrado como agujero — tratamiento posterior.

---

## Surface 2 — Weekly Review (semanas 1–3)

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| signal_changes | — (UI pendiente) | Weekly | all | both | all | ❌ pending FASE 11 |
| engine_warnings | — (UI pendiente) | Weekly | all | both | all | ❌ pending FASE 11 |
| focus_confirmation (Next Action en contexto semanal, read-only) | — (UI pendiente) | Weekly | all | both | all | ❌ pending FASE 11 |
| **WeeklyReview full-page surface** | — | Weekly | all | both | all | ❌ pending FASE 11 |

**Condición de activación:** `weekly_review_pending = true`
(EXISTS weekly_review no leída para esta semana y proyecto — generada dom 23:30 UTC semanas 1–3).

**Backend:** `weekly_reviews` table ✅, `generate_weekly_review_for_project()` ✅ (migr 00034).

### WeeklyReviewCard — posición actual (violación)

`WeeklyReviewCard` + `WeeklyReviewDetail` existen como componentes pero viven en `ProjectDashboardTab` (tab Dashboard de ProjectPage). **Esto viola Rule 2:** mezcla contexto continuo (Engine Surface) con contexto semanal (Weekly Surface) en pantalla simultánea.

**Fix requerido en V11.3:** eliminar WeeklyReviewCard del Dashboard tab. Redirigir a la Weekly Surface cuando `weekly_review_pending = true`.

---

## Surface 3 — Strategic Reset Ritual (semana 4 / urgencia)

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| Q1–Q5 ritual inputs | — (UI pendiente) | Reset | all | both | all | ❌ pending FASE 11 |
| Optimus ritual interpretation | — (UI pendiente) | Reset | all | both | all | ❌ pending FASE 11 |
| cycle_evaluation display | — (UI pendiente) | Reset | all | both | all | ❌ pending FASE 11 |
| next cycle bet (next_bet + success_signal + invalidation_condition) | — (UI pendiente) | Reset | all | both | all | ❌ pending FASE 11 |
| **Strategic Reset Ritual full-page surface** | — | Reset | all | both | all | ❌ pending FASE 11 |

**Condición de activación:** `ritual_pending = cycle_due OR urgent_reset_requested`

**Backend:** `submit_strategic_reset()` ✅, `close_strategic_cycle()` ✅, `get_ritual_optimus_context()` ✅ (migr 00050–00052). Optimus template §8 ✅.

**Migración pendiente:** `ALTER TABLE strategic_cycles ADD COLUMN urgent_reset_requested BOOLEAN DEFAULT FALSE`.

**Nota sobre StrategicQuestionsStep.tsx:** este componente existe en `src/components/generative/` pero corresponde al flujo de onboarding generativo, no al ritual periódico. Son componentes distintos.

---

## Surface 4 — Cycle History (memoria histórica)

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| cycle_index | — (UI pendiente) | History | ≥1 ciclo cerrado | both | all | ⏸ deferred |
| evaluation por ciclo | — (UI pendiente) | History | ≥1 ciclo cerrado | both | all | ⏸ deferred |
| key_learning por ciclo | — (UI pendiente) | History | ≥1 ciclo cerrado | both | all | ⏸ deferred |
| bottleneck por ciclo | — (UI pendiente) | History | ≥1 ciclo cerrado | both | all | ⏸ deferred |
| next_bet por ciclo | — (UI pendiente) | History | ≥1 ciclo cerrado | both | all | ⏸ deferred |
| **Cycle History full-page surface** | — | History | ≥2 ciclos cerrados | both | all | ⏸ deferred |

**Condición de valor:** el founder necesita ≥2 ciclos completados con ritual para que la UI tenga utilidad real (~2 meses de uso). Datos disponibles en `strategic_cycles` tras primer ciclo cerrado.

**Backend:** datos en `strategic_cycles` ✅ disponibles tras primer ciclo cerrado.

---

## Capa de navegación (no superficie)

| Feature | Component | Surface | Condición | Status |
|---|---|---|---|---|
| Re-entry summary layer | — (V11.0, UI pendiente) | Nav → luego surface activa | `last_seen_at > 7d` | ❌ pending FASE 11 |
| urgent_reset_requested flag | DB migration | Nav (trigger de Surface 3) | Rescue Playbook recomienda reset | ❌ migración pendiente FASE 11 |

**Re-entry orden de navegación (fijo):**
1. Mostrar re-entry summary ("Since you were away")
2. Al acknowledge → `ritual_pending=true` → Surface 3 · `weekly_pending=true` → Surface 2 · else → Surface 1

**Fuente de last_seen_at:** tabla `project_user_state (project_id, user_id, last_seen_at TIMESTAMPTZ)` — per-project, no global.

---

## Features FASE 17 — Focus Block

Acción prioritaria inteligente. `buildNextAction()` + `NextActionFocusBlock` + digest mode.

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| Focus Block — acción principal calculada | `NextActionFocusBlock` + `buildNextAction()` | Engine | all | both | all | ✅ impl (F19.C) |
| Digest Mode — condensado cuando ≥3 insights | `NextActionFocusBlock` (isDigestMode) | Engine | all | both | all | ✅ impl (AUD.M.4) |
| Low reliability warning | `NextActionFocusBlock` (F19.V2.1) | Engine | all | both | all | ✅ impl |
| Focus Block context → Optimus input | `get_optimus_context()` + `OPTIMUS_PROMPTS.md §1` | Engine | all | both | all | ✅ impl (PL9.V2.1) |
| Data completeness card (U6.V2.3) | `DataCompletenessCard` | Engine | all | both | all | ✅ impl |
| Input audit modal (U6.V2.4) | `InputAuditModal` + `InputAuditTrigger` | Engine | all | both | all | ✅ impl |

---

## Features FASE 18 — Task Loop

Ciclo de ejecución + feedback de tareas.

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| task_completion_rate benchmark | `BENCHMARKS_V1.md §Parte 3` | Engine | all | both | all | ✅ impl (PL9.V2.2) |
| Phase-adaptive tab lock (F19.C.3/4) | `usePhaseFeatures` + `PhaseTeaserModal` | Engine | 1–3 | both | all | ✅ impl |
| FaseB progress timestamps (AUD.B.8) | `FaseBPanel.recordItemCompleted()` | Engine | 1 | both | all | ✅ impl |
| Optimus Zod runtime validation | `src/lib/optimus.ts` | Engine | all | both | all | ❌ pending (AUD.B.1) |

---

## Features FASE 19 — Meeting Intelligence

Reuniones registradas, decisiones aprobadas, señales de bloqueo.

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| meeting_to_action_conversion benchmark | `BENCHMARKS_V1.md §Parte 3` | Engine | ≥2 | both | all | ✅ impl (PL9.V2.2) |
| recent_decisions_from_meetings en Optimus | `get_optimus_context()` SQL | Engine | all | both | all | ❌ pending (P8.V2.2) |
| behavioral_block accelerated activation | `strategic_blocks` trigger | Engine | ≥3 weeks | both | all | ❌ pending (P8.V2.1) |
| Optimus feedback UI (thumbs up/down) | migration + component | Engine | all | both | all | ❌ pending (P8.V2.3) |
| Optimus additional_context cache | `analyze-project-v4` + `useProjectAnalysis` | Engine | all | both | all | ❌ pending (F20.V2.4) |
| Optimus scarce-data calibration | `analyze-project-v4` prompt | Engine | all | both | all | ❌ pending (F20.V2.5) |

---

## Features transversales (UX/Surfaces post-V11.1)

| Feature | Component | Surface | Phase | Mode | Viability | Status |
|---|---|---|---|---|---|---|
| Reentry Surface (>7d ausencia) | `ReentrySurface` + `useActiveSurface` | Nav | all | both | all | ✅ impl (V11.3) |
| useActiveSurface extracted (AUD.M.3) | `src/hooks/useActiveSurface.ts` | Nav | all | both | all | ✅ impl |
| Phase-filtered notifications (N7.V2.3) | `NotificationList` phase tab | Nav | all | both | all | ✅ impl |
| Weekly surface with Focus context (U6.V2.2) | `WeeklySurface` | Weekly | all | both | all | ✅ impl |

---

## Resumen de estado

| Surface / Fase | Features totales | Implementadas | Pendientes | Diferidas |
|---|---|---|---|---|
| Engine (V11.1) | 15 | 14 | 1 (Optimus UI) | 0 |
| Weekly | 4 | 0 | 4 | 0 |
| Reset | 5 | 0 | 5 | 0 |
| History | 6 | 0 | 0 | 6 |
| Nav (capa) | 2 | 0 | 2 | 0 |
| FASE 17 — Focus Block | 6 | 5 | 1 (AUD.B.1) | 0 |
| FASE 18 — Task Loop | 4 | 3 | 1 (AUD.B.1 shared) | 0 |
| FASE 19 — Meeting Intelligence | 6 | 1 | 5 | 0 |
| Transversal UX | 4 | 4 | 0 | 0 |
| **TOTAL** | **52** | **27** | **19** | **6** |

---

## Violaciones de System Rules detectadas

| Regla | Violación | Componente | Fix |
|---|---|---|---|
| Rule 2 (1 surface = 1 time context) | `WeeklyReviewCard` vive en Dashboard tab (Engine context) | `ProjectDashboardTab` → `WeeklyReviewCard` | Eliminar del tab. Activar Weekly Surface cuando `weekly_review_pending=true`. |
| Rule 4 (Optimus rendering contract) | Optimus UI no implementada — violación no verificable aún | — | Al implementar: solo renderizar `primary.action`, `primary.reason`, `primary.signal_basis`. Nunca `alternative.*` ni `confidence`. |

---

## Gaps de cobertura

| Gap | Superficie | Severidad | Tratamiento |
|---|---|---|---|
| ~~Next Action sin cobertura Phase 4~~ | Engine | — | ✅ Resuelto — `getNextAction()` v1.2 (XE.10, 2026-03-12). Tiers 9–12 cubren Phase 4: ops débiles → OBV, sin MRR → métricas, !hardSignal → métricas, hardSignal → mantener momentum. |
| Optimus UI ausente (Surface 1) | Engine | Alta | Implementar en FASE 11 con contrato de renderizado de Rule 4. |
| WeeklyReviewCard en contexto incorrecto | Engine/Weekly | Alta | Fix en V11.3 al implementar el sistema de visibilidad. |
| urgent_reset_requested sin migración | Surface 3 nav | Alta | ALTER TABLE antes de implementar Surface 3 UI. |
| project_user_state tabla inexistente | Nav (re-entry) | Media | Migración en V11.0 antes de V11.3. |

---

*v1.1 — 2026-03-20 — FASE 17/18/19 features añadidas (V11.V2.2)*
*v1.0 — 2026-03-12*
*Para especificación de superficies → SURFACES_V1.md.*
*Para implementación de visibilidad → V11.3.*
*Para teaser UX → V11.4.*
