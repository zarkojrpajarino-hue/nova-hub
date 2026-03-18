# INTEGRITY_PASS — F12.0
> Pasada de integridad pre-launch. No crea features. Solo clasifica, valida y detecta drift.
> Fecha: 2026-03-13. Evidencia: lectura directa de código y migraciones.

---

## 1. Executive Summary

| Categoría | Resultado |
|-----------|-----------|
| Features auditadas | 14 |
| fully_working | 8 |
| backend_only | 3 |
| deferred | 2 |
| ui_only (stub) | 1 |
| Señales core con drift | 1 (watch) |
| Señales core limpias | 6 |
| Flows que pasan | 2 |
| Flows con deuda | 2 |
| Flows que fallan | 1 |
| Bloqueantes pre-launch | 1 |

**Veredicto:** El sistema no está listo para uso real. Hay 1 bloqueante duro (ResetSurface) y 1 deuda de flow seria (WeeklySurface summary_json sin guard). El resto es sólido.

---

## 2. Feature Status Table

| Feature | Surface | status_real | source_of_truth | principal_gap | next_action |
|---------|---------|-------------|-----------------|---------------|-------------|
| Engine (phase / probability / risk / coverage) | engine | fully_working | project_phase_state, project_probability, project_risk_state, project_function_coverage | — | ninguna |
| Surface selection (priority logic) | all | fully_working | useActiveSurface hook | — | ninguna |
| ReentrySurface | reentry | fully_working | engineData + viabilityData + cycleData | edge: engineData null → fallback ok | ninguna |
| WeeklySurface | weekly | fully_working | weekly_reviews.summary_json | summary_json malformado → throw sin guard | añadir guard en summary_json access |
| ResetSurface (Strategic Reset Ritual) | reset | ui_only (stub) | submit_strategic_reset() (backend listo) | UI es placeholder; usuario no puede completar el ritual | implementar UI del ritual (FASE 13) |
| Weekly Review (generación automática) | — | fully_working | weekly_reviews (backend job) | generación no controlable desde UI — intencional en v1 | ninguna |
| WeeklyReviewDetail (U6.12) | engine | fully_working | weekly_reviews | — | ninguna |
| Feature Teasers (V11.4) | engine | fully_working | closedCyclesCount, viabilityStatus, latestWeeklyReview | — | ninguna |
| Function Coverage UI (V11.6) | engine | fully_working | project_function_coverage (engine), project_functions (owner) | nombre de owner no resuelto — intencional v1 | v1.1: vista SQL para nombre |
| Strategic Blocks | — | backend_only | strategic_blocks table | zero UI, zero hooks | FASE 13: hook + panel |
| Optimus / AI Advisor | — | backend_only | context packet (_000049), OPTIMUS_PROMPTS | zero UI (negocio-ia tab usa GeneratedBusinessDashboard, no Optimus) | FASE 13: surface de Optimus |
| Viability signals (banner + mode badge) | engine | fully_working | project_viability_state | — | ninguna |
| Cycle History | — | deferred | strategic_cycles (tabla existe) | solo teaser, sin UI ni hook | post-launch |
| Rescue Playbooks | — | deferred | ninguno definido en backend | solo teaser | post-launch |

---

## 3. Core Signals Audit

| Signal | computed_in | persisted_in | consumed_in | duplicated? | verdict |
|--------|-------------|-------------|-------------|-------------|---------|
| phase | run_phase_engine() (migr 00005, 00015, 00018) | project_phase_state | useProjectEngineData → ProjectEnginePanel, PhaseProgressBar, EngineIndicators, MiModeloView, ReentrySurface, getNextAction() | no | **clean** |
| viability | viability engine (migr 00026+) | project_viability_state | useProjectViabilityState → ViabilityBanner, ProjectEnginePanel, FeatureTeasersPanel, ProjectModeBadge, MiModeloView, ReentrySurface | no | **clean** |
| risk | risk engine (migr 00008+) | project_risk_state | useProjectEngineData → ProjectEnginePanel, RiskBreakdown, getNextAction() | no | **clean** |
| probability | probability engine (migr 00007) | project_probability | useProjectEngineData → ProjectEnginePanel, ProbabilityBreakdown, getNextAction(); lib/reentry.ts deriva probabilityTrend localmente con thresholds propios | sí — reentry.ts | **watch** |
| coverage | run_coverage_engine() (migr 00004, 00011) | project_function_coverage | useProjectEngineData → ProjectEnginePanel (barras + gap badge), MiModeloView, getNextAction() | no | **clean** |
| blocks | run_coverage_engine(), run_org_capacity_engine() | strategic_blocks | **ningún componente frontend** — zero hooks, zero UI | n/a | **backend_only** |
| next_action | getNextAction() — función pura en ProjectEnginePanel.tsx | no persiste (derivado en render) | ProjectEnginePanel, CostOfIgnoring, UnlockModeCard, ReentrySurface | no | **clean** |

### Detalle — probability: watch

`lib/reentry.ts` deriva `probabilityTrend` ('growing' | 'stable' | 'declining') aplicando thresholds locales sobre `probability_score`. Es una clasificación para display, no una señal de Engine. Aceptable en v1, pero si el Engine añade `probability_trend` como columna persistida (ya existe en el context packet de Optimus), este derivado local quedaría huérfano. Anotar para sincronizar en v2.

---

## 4. End-to-End Flows

| Flow | Trigger | Expected surface | Success condition | Failure mode | Verdict |
|------|---------|-----------------|------------------|-------------|---------|
| Entrada normal | last_seen_at < 7d, ritualPending=false, hasUnreadWeekly=false | engine | ProjectDashboardTab con engineData, next action, coverage | engineData null → EngineEmptyState (cubierto) | **pass** |
| Weekly review | weekly_reviews.read_at IS NULL | weekly | WeeklySurface muestra headline/highlights/warnings; "Continuar" → markRead → surface = engine | summary_json malformado → throw en `summary.headline` sin guard | **pass_with_debt** |
| Ritual semana 4 | ritualPending = true (cycle_due OR urgent_reset_requested) | reset | ResetSurface permite completar ritual → submit_strategic_reset() → ritualPending = false → surface = engine | UI es stub. No hay form, no hay submit. Usuario atrapado en surface sin salida. | **fail** |
| Re-entry + urgencia | last_seen_at > 7d | reentry | ReentrySurface muestra resumen de ausencia + urgencias; "Ver estado actual" → onAcknowledge → surface activa subyacente | engineData null → fallback ok; si surface subyacente = reset → usuario ve reentry + luego stub (doble frustración) | **pass_with_debt** |

### Detalle — Flow 3: fail

`ResetSurface` es un placeholder explícito:
```
// ResetSurface.tsx:39
<p className="text-sm text-muted-foreground">
  Ritual UI — implementación pendiente
</p>
```

`onComplete` en `ProjectPage.tsx:233` tiene el callback vacío:
```typescript
onComplete={() => {
  // surface cambia automáticamente cuando ritual_pending = false
  // (invalidateQueries en submit_strategic_reset handler futuro)
}}
```

Cuando `ritualPending = true`, el sistema muestra ResetSurface y el usuario no tiene forma de salir hasta que alguien cambie el estado en DB externamente. **Esto es un bloqueante para usuarios reales.**

### Detalle — Flow 2: pass_with_debt

`WeeklySurface.tsx:49`:
```typescript
const summary = review.summary_json;
// ...
<h2>{summary.headline}</h2>      // throw si summary_json malformado
{summary.highlights.map(...)}     // throw si highlights undefined
```
No hay guard. Si `weekly_reviews.summary_json` tiene un schema inesperado, la surface crashea. El backend genera estos datos pero un row corrupto o de migración anterior podría romper la UI silenciosamente.

---

## 5. Analytics Integrity

*(Post V11.5 — solo confirmar estado)*

| Panel | Role | Risk post-V11.5 | Verdict | Action |
|-------|------|-----------------|---------|--------|
| AnalyticsFilters | filtro de UI | ok | keep | ninguna |
| PartnerComparisonTable | agrega + compara | ok | keep | ninguna |
| PartnerRadarChart | visualización normalizada | ok | keep | ninguna |
| ProjectComparisonCharts | compara proyectos | ok | keep | ninguna |
| TemporalEvolutionChart | evolución temporal | fixed (casing) | keep | ninguna — fix aplicado |
| ActivityHeatmap | conteo de OBVs por día | fixed (label) | keep | ninguna — fix aplicado |
| PredictionsWidget | proyección lineal | mejorado (labels neutros, teamSize dinámico) | keep with debt | targets hardcodeados, sin integración con Engine — v1.1 |

**Confirmado:** ningún panel de Analytics redefine estado del proyecto ni recalcula señales del engine.

---

## 6. Hallazgos Críticos

### A. Bloqueantes

**B1 — ResetSurface: stub que atrapa usuarios**
Cuando `ritualPending = true`, el usuario entra en ResetSurface y no puede salir. No hay form, no hay submit, no hay bypass. Para cualquier proyecto que llegue a semana 4 de ciclo o tenga `urgent_reset_requested = true`, la experiencia queda rota.
- **Impacto:** alto — afecta a cualquier proyecto activo con ciclo cerrado
- **Fix:** implementar UI mínima del ritual (FASE 13 o antes de launch)

### B. Deuda aceptable v1

**D1 — WeeklySurface: summary_json sin guard**
`review.summary_json.headline` se accede directamente sin validar el schema. Un row corrupto o generado por una versión diferente del backend crashea la surface.
- **Impacto:** medio — solo si backend genera datos malformados
- **Fix:** añadir guard `summary?.headline ?? 'Revisión semanal'`

**D2 — probability: derivación local en reentry.ts**
`lib/reentry.ts` clasifica `probabilityTrend` con thresholds propios. Funcionalmente correcto en v1, pero divergirá si el Engine persiste `probability_trend`.
- **Impacto:** bajo en v1, medio si Optimus se integra
- **Fix:** sincronizar en v2 cuando `probability_trend` sea accesible desde client

**D3 — PredictionsWidget: targets semestrales hardcodeados**
Targets (`150 obvs`, `18 lps`, etc.) son constantes fijas aunque `teamSize` ya es dinámico.
- **Impacto:** bajo — afecta precisión de proyecciones, no UX core
- **Fix:** tabla configurable de objetivos en v2

**D4 — ReentrySurface: si surface subyacente = reset, doble frustración**
Tras acknowledge de re-entry, el usuario puede aterrizar en ResetSurface (stub). No es un bug de lógica, sino consecuencia de B1.
- **Fix:** se resuelve automáticamente cuando B1 se implementa

### C. Diferidos legítimos

**L1 — Strategic Blocks: backend listo, frontend pendiente**
`strategic_blocks` genera señales en backend pero no hay UI ni hooks. Intencional — los bloques se usan internamente en el engine para penalizar scores, pero no se muestran al usuario todavía.

**L2 — Cycle History / Rescue Playbooks: solo teasers**
Ambas features tienen teaser visible pero sin implementación. Correcto: el teaser es la feature v1.

**L3 — Optimus context packet: backend listo, sin surface**
El context packet de Optimus existe en migraciones pero no hay componente UI de Optimus. `negocio-ia` tab muestra `GeneratedBusinessDashboard` (branding/productos generativos), no Optimus.

**L4 — Owner name resolution en Function Coverage**
`project_functions.owner_user_id` no se resuelve a nombre visible. Intencional en v1 — dot booleano es suficiente.

---

## 7. Launch Readiness Verdict

### ready_now
- Engine (phase, probability, risk, coverage) — computación, persistencia, UI
- Surface selection y prioridad (reset > weekly > engine)
- ReentrySurface
- WeeklySurface (con caveat D1)
- Weekly Review (generación automática + display)
- Feature Teasers (V11.4)
- Function Coverage UI (V11.6)
- Viability signals (banner, mode badge)
- Analytics module (post V11.5)
- MiModeloView
- Tabs: equipo, CRM, tareas, OBVs, financiero

### must_fix_before_launch
- **B1** — ResetSurface: necesita UI mínima funcional. Cualquier proyecto en semana 4 queda bloqueado.
- **D1** — WeeklySurface: añadir guard en `summary_json` access para evitar crash por dato malformado.

### post_launch_only
- Strategic Blocks UI (L1)
- Optimus surface (L3)
- Cycle History UI (L2)
- Rescue Playbooks UI (L2)
- Owner name resolution (L4)
- PredictionsWidget integración con Engine (D3)
- probability_trend sincronización (D2)
