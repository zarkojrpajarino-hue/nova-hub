# SUPER PLAN V5 — 64 TAREAS → SCORECARD 10/10

> Generado: 2026-03-24. Basado en 6 agentes de auditoría profunda.
> Objetivo: llevar todas las dimensiones al 10/10.

---

## SCORECARD ACTUAL vs TARGET

| Dimension | Actual | Target | Delta |
|---|---|---|---|
| Seguridad | 7.5 | 10 | +2.5 |
| Performance | 8 | 10 | +2 |
| UX/Retencion | 7.5 | 10 | +2.5 |
| Monetizacion | 5 | 10 | +5 |
| Datos | 7 | 10 | +3 |
| IA | 7.5 | 10 | +2.5 |
| Tests | 9 | 10 | +1 |
| Arquitectura | 7.5 | 10 | +2.5 |
| Producto/PMF | 5.5 | 10 | +4.5 |
| **MEDIA** | **7.2** | **10** | **+2.8** |

---

## SEMANA 1 — CRITICAL FIXES (P0, no avanzar sin esto)

### S1.A — Crashes y bloqueos (4 tareas)

- [ ] **V5.1.1** Fix ErrorBoundary: usa t() sin import. Class component no puede usar hooks. Usar i18next singleton directamente: `import i18n from 'i18next'; i18n.t('key')`.
  > FILE: src/components/ErrorBoundary.tsx:40,43,47,63,69
  > AGENTE: Frontend Arch #1

- [ ] **V5.1.2** Add timeout a RootRedirect: si auth/projects no cargan en 10s, mostrar error page con "Retry".
  > FILE: src/pages/RootRedirect.tsx:25-51
  > AGENTE: UX Flows #3

- [ ] **V5.1.3** Fix FastStartWizard error recovery: no auto-avanzar a fase-a si load falla. Mostrar error state con "Retry" o "Go Back".
  > FILE: src/components/onboarding/FastStartWizard.tsx:79-82
  > AGENTE: UX Flows #2

- [ ] **V5.1.4** Fix Auth.tsx validation error: variable `error` referenciada en catch pero es `_error`. Mapear todos los ZodError consistentemente.
  > FILE: src/pages/Auth.tsx:45-50
  > AGENTE: UX Flows #1

### S1.B — Indices criticos DB (3 tareas)

- [ ] **V5.1.5** Add index project_phase_state(project_id) — CRITICAL para phase engine a escala.
  > TABLE: project_phase_state
  > AGENTE: DBA #4.1

- [ ] **V5.1.6** Add index project_phase_history(project_id, created_at DESC) — dashboard speed.
  > TABLE: project_phase_history
  > AGENTE: DBA #4.2

- [ ] **V5.1.7** Add 4 composite indexes: validation_order(month_year, position), kpi_validaciones(kpi_id, approved), obvs(project_id, cobro_estado), activity_log(user_id, created_at DESC).
  > AGENTE: DBA #3.1-3.4

### S1.C — Seguridad critica (4 tareas)

- [ ] **V5.1.8** Sanitizar email PII en generate-tasks-v2: reemplazar email con member_id en prompt context.
  > FILE: supabase/functions/generate-tasks-v2/index.ts:228,806-810
  > AGENTE: AI/LLM #9

- [ ] **V5.1.9** Add FK obvs.responsable_id → profiles(id) ON DELETE SET NULL.
  > TABLE: obvs
  > AGENTE: DBA #2.1

- [ ] **V5.1.10** Add UNIQUE constraint kpi_validaciones(kpi_id, validator_id) + obv_validaciones(obv_id, validator_id).
  > AGENTE: DBA #2.2

- [ ] **V5.1.11** Wrap project_documents FTS en security function (fts_project_documents_safe) con project_members filter.
  > AGENTE: DBA #6.1

### S1.D — AI cost optimization (3 tareas)

- [ ] **V5.1.12** Downgrade generate-lead-scoring-v2 de Sonnet-4 a Haiku-4.5. Ahorro: $18K/año @ 1K users.
  > FILE: supabase/functions/generate-lead-scoring-v2/index.ts:160
  > AGENTE: AI/LLM #1

- [ ] **V5.1.13** Downgrade analyze-project-v4 followup mode de Sonnet-4 a Haiku-4.5. Ahorro: $9K/año.
  > FILE: supabase/functions/analyze-project-v4/index.ts
  > AGENTE: AI/LLM #1

- [ ] **V5.1.14** Delete market-research function (zombie, 4 LLM calls, $0.12/call, 0 frontend refs).
  > FILE: supabase/functions/market-research/
  > AGENTE: AI/LLM #2

---

## SEMANA 2 — PRODUCTO/PMF (coherencia de fases)

### S2.A — Phase coherencia (5 tareas)

- [ ] **V5.2.1** Unlock CRM "Lead Capture" en Phase 1: Kanban + CSV import, sin AI. Cambiar phase-features.ts crm de 'teaser' a 'secondary' en Phase 1.
  > FILE: src/lib/phase-features.ts:39-44
  > AGENTE: Product #10

- [ ] **V5.2.2** Unlock Financial "Quick Record" en Phase 2: input MRR simple + fecha, sin charts. Cambiar financiero de 'teaser' a 'secondary' en Phase 2.
  > FILE: src/lib/phase-features.ts:209
  > AGENTE: Product #12

- [ ] **V5.2.3** Implementar Phase 4 regression: si consecutive_low_score >= 3 AND hard signals unmet >4 semanas → regression a Phase 3 con notificacion.
  > FILE: src/lib/next-action.ts:165-211
  > AGENTE: Product #1

- [ ] **V5.2.4** Add minimum revenue threshold para Phase 2 hard signal: OBV revenue evidence >= 50 EUR (o 1% del target).
  > FILE: ENGINE_SPEC_V1.md + next-action.ts:131-139
  > AGENTE: Product #2

- [ ] **V5.2.5** Add tasks_completed_per_week como secondary signal en Phase 1-2 scoring, weighted por function_type relevance.
  > FILE: src/lib/phase-features.ts:282-287
  > AGENTE: Product #5

### S2.B — Module coupling (4 tareas)

- [ ] **V5.2.6** Auto-crear OBV draft cuando lead.status → cerrado_ganado (con confirmacion manual). Sync lead.valor_potencial → OBV.facturacion.
  > FILE: src/hooks/useCRMPipeline (handleDragEnd), OBV creation logic
  > AGENTE: Product #4

- [ ] **V5.2.7** Include lead closing rate (cerrado_ganado / total) como componente en Phase 3 hard signal scoring.
  > AGENTE: Product #4

- [ ] **V5.2.8** Conectar KPIs al phase scoring: add kpi_count como secondary signal en Phase 1-2. Display "Phase-relevant KPIs: X/3 needed".
  > AGENTE: Product #9

- [ ] **V5.2.9** Conectar Analytics insights a next-action: leer ai_analysis_cache.urgent_decisions en buildNextAction(). If benchmarking bottom 20% → elevate risk.
  > FILE: src/lib/build-next-action.ts
  > AGENTE: Product #6

### S2.C — Predictive moments (3 tareas)

- [ ] **V5.2.10** Add predictive moment "trajectory_warning": if phase_score < 50 AND weeksInPhase > budget/2, fire warning.
  > FILE: src/lib/moment-detector.ts
  > AGENTE: Product #3

- [ ] **V5.2.11** Add "coverage_gap" moment: if ANY function_type (demand/delivery/cash) es "none" por >2 semanas, highlight en next-action.
  > AGENTE: Product #3

- [ ] **V5.2.12** Add "churn_risk" moment: if first_customer >30d ago AND MRR stagnant + team shrinking, warn founder.
  > AGENTE: Product #3

---

## SEMANA 3 — MONETIZACION (activar revenue)

### S3.A — Activate payments (5 tareas)

- [ ] **V5.3.1** Crear productos reales en Stripe Dashboard: Pro ($29/mo, $278/yr), Scale ($79/mo, $758/yr).
  > AGENTE: Monetizacion #2

- [ ] **V5.3.2** Actualizar STRIPE_PRICE_CONFIG con price IDs reales de Stripe.
  > FILE: supabase/functions/create-checkout-session/index.ts:17-25
  > AGENTE: Monetizacion #2

- [ ] **V5.3.3** Set STRIPE_SECRET_KEY en .env + Supabase secrets.
  > AGENTE: Monetizacion #2

- [ ] **V5.3.4** Set ENABLE_PAYMENTS=true en config/features.ts.
  > FILE: src/config/features.ts:31
  > AGENTE: Monetizacion #2

- [ ] **V5.3.5** Deploy stripe-webhooks edge function para subscription lifecycle events.
  > AGENTE: Monetizacion #3

### S3.B — Expand free tier (2 tareas)

- [ ] **V5.3.6** Expandir free: 1→3 proyectos, 20→50 AI calls, 3→7 members, 30→90 dias analytics.
  > FILE: src/config/features.ts:87-98
  > AGENTE: Monetizacion #1

- [ ] **V5.3.7** Extender trial de 14 a 21 dias.
  > AGENTE: Monetizacion #5

### S3.C — Upgrade triggers (5 tareas)

- [ ] **V5.3.8** Mapear 5 "aha moments" a upgrade modals: first_obv_validated → "Scale unlocks benchmarking", 3+ members → "Pro: priority support", 5+ AI calls → "Pro: advanced analytics", KPI trending up → "Scale: predictive", first integration → "Scale: sync".
  > AGENTE: Monetizacion #3, Product #13

- [ ] **V5.3.9** Trial countdown visible en header: banner sticky a 7d, 3d, 1d. Red banner ultimo dia.
  > FILE: src/components/subscription/TrialCountdownBanner.tsx
  > AGENTE: Monetizacion #5

- [ ] **V5.3.10** Add AICallsNudge a CRM AI panels, Lead Scoring, Task Generation (no solo dashboard).
  > AGENTE: Monetizacion #4

- [ ] **V5.3.11** Implementar annual pricing real: add price_annual a PLAN_TIERS, update create-checkout-session para yearly billing_cycle.
  > FILE: src/config/features.ts, create-checkout-session
  > AGENTE: Monetizacion #6

- [ ] **V5.3.12** Add downgrade/cancel flow in-app: "Manage subscription" en Settings con cancel CTA + soft landing ("tell us why").
  > AGENTE: Monetizacion #7

### S3.D — Limit enforcement (2 tareas)

- [ ] **V5.3.13** Server-side member limit: reject invite si project_members.count >= tier.members.
  > AGENTE: Monetizacion #4

- [ ] **V5.3.14** Server-side project limit: reject creation si user projects >= tier.projects.
  > AGENTE: Monetizacion #4

---

## SEMANA 4 — UX PERFECCION

### S4.A — Error recovery (4 tareas)

- [ ] **V5.4.1** OBV form "Save Draft" confirmation before cancel. Persist draft to localStorage.
  > FILE: src/components/nova/obv-form/OBVFormContainer.tsx
  > AGENTE: UX #6

- [ ] **V5.4.2** OBV form re-validate on each step change. Show step-level error badges. Block "Next" if validation fails.
  > FILE: src/components/nova/obv-form/OBVFormContainer.tsx:54-60
  > AGENTE: UX #5

- [ ] **V5.4.3** TaskForm inline field-level validation: red border + error text below title field. Disable Submit if title empty.
  > FILE: src/components/tasks/TaskForm.tsx:56-80
  > AGENTE: UX #11

- [ ] **V5.4.4** Task limit error (5 active): show modal with list of active tasks + "Complete" quick actions.
  > FILE: src/components/tasks/TaskForm.tsx:72-80
  > AGENTE: UX #12

### S4.B — Empty states y CTAs (4 tareas)

- [ ] **V5.4.5** CRM pipeline empty state: show CTA "No leads yet. Use AI Lead Finder or Add Lead manually." con botones.
  > FILE: src/pages/views/CRMView.tsx:38-50
  > AGENTE: UX #8

- [ ] **V5.4.6** Drag-drop feedback: toast o card highlight flash cuando lead status cambia. Disable drag until save completes.
  > AGENTE: UX #9

- [ ] **V5.4.7** "New Project" button visible en NovaSidebar o dashboard toolbar (no solo en project selector).
  > AGENTE: UX #4

- [ ] **V5.4.8** Sidebar "NEW" badge persistente 7 dias o hasta click (no desaparecer rapido).
  > FILE: src/components/nova/NovaSidebar.tsx:132-147
  > AGENTE: UX #13

### S4.C — Onboarding funnel (3 tareas)

- [ ] **V5.4.9** Fast-track validation gating: require >=1 OBV revenue_validation con evidence antes de Phase 2+ entry. Banner "Confirm your revenue with an OBV".
  > FILE: src/components/onboarding/FastStartWizard.tsx:96-99
  > AGENTE: Product #7

- [ ] **V5.4.10** Add granular funnel tracking: trackOnboardingStepCompleted(step, timeSpent) en cada transicion. trackFirstActionTaken post-onboarding.
  > AGENTE: Product #8

- [ ] **V5.4.11** Abandoned-onboarding recovery: si onboarding no completa en 24h, fire moment "onboarding_abandoned" con deep link para resumir.
  > AGENTE: Product #8

---

## SEMANA 5 — ARQUITECTURA

### S5.A — Component splitting (4 tareas)

- [ ] **V5.5.1** Split OBVCenterPreviewModal (1397 LOC): extraer OBVList, OBVDetail, OBVFilters, OBVTabs + demo data a /data/.
  > AGENTE: Frontend #3

- [ ] **V5.5.2** Split MiEspacioPreviewModal (1121 LOC): extraer secciones en sub-components.
  > AGENTE: Frontend #3

- [ ] **V5.5.3** Split StartMeetingModal (1111 LOC): extraer steps en sub-components.
  > AGENTE: Frontend #3

- [ ] **V5.5.4** Split useNovaDataOptimized (1103 LOC): extraer en 5 domain hooks (useProjects, useProjectMembers, useLeads, useMemberStats, useProjectStats) de max 200 LOC cada uno.
  > AGENTE: Frontend #5

### S5.B — State y error handling (4 tareas)

- [ ] **V5.5.5** Consolidar Context vs React Query: CurrentProjectContext solo almacena projectId + switchProject(). Proyecto real viene de useProject(id) via React Query.
  > FILE: src/contexts/CurrentProjectContext.tsx:69-97
  > AGENTE: Frontend #6

- [ ] **V5.5.6** Add React error boundaries por seccion: CRM, OBV, Analytics, Finance. Cada uno con "Something went wrong" + Retry.
  > AGENTE: Frontend #7

- [ ] **V5.5.7** Standardize mutation invalidation: usar parent queryKeys, no invalidar children manualmente. Crear invalidation helpers.
  > AGENTE: Frontend #4

- [ ] **V5.5.8** Fix 11 `as any`: crear tipos propios para Supabase RPCs (founder_tool_cache, decision_retrospectives) y jsPDF module augmentation.
  > AGENTE: Frontend #2

### S5.C — RLS hardening (3 tareas)

- [ ] **V5.5.9** Replace WITH CHECK(true) en metric_alerts, ai_recommendations, weekly_insights con project_id validation.
  > AGENTE: DBA #1.2

- [ ] **V5.5.10** Replace USING(true) SELECT en kpis, obvs, tasks, member_kpi_base con project-member filter.
  > AGENTE: DBA #1.1

- [ ] **V5.5.11** Replace project_id IN (SELECT...) RLS patterns con EXISTS(project_members) join (okrs, competitor_snapshots).
  > AGENTE: DBA #1.3

---

## SEMANA 6 — IA Y DATOS AVANZADOS

### S6.A — AI caching y quality (4 tareas)

- [ ] **V5.6.1** Add cache generate-buyer-persona-v2 (TTL 30 dias).
  > AGENTE: AI/LLM #3

- [ ] **V5.6.2** Add cache generate-financial-projections (TTL 7 dias).
  > AGENTE: AI/LLM #3

- [ ] **V5.6.3** Add cache generate-brand-kit-v2 (TTL 180 dias).
  > AGENTE: AI/LLM #3

- [ ] **V5.6.4** Add hallucination disclaimers en UI: cuando confidence_overall < 0.6, mostrar "Analisis preliminar" badge. Cuando cached=true, mostrar "Basado en datos de hace X dias".
  > AGENTE: AI/LLM #11

### S6.B — AI nuevas features (4 tareas)

- [ ] **V5.6.5** AI Phase Graduation advisor: analizar decision_events + cycle performance para recomendar graduacion con confidence score.
  > AGENTE: AI/LLM #5

- [ ] **V5.6.6** AI Deal Stage Prediction: analizar lead history + engagement para predecir siguiente etapa probable.
  > AGENTE: AI/LLM #6

- [ ] **V5.6.7** AI Anomaly Detection: flag KPI movements inusuales (MRR drop >20%, CAC spike, churn jump).
  > AGENTE: AI/LLM #6

- [ ] **V5.6.8** AI Cycle Feedback Loop: a cycle+30d, auto-check si success_signal mejoro. Feed resultado al prompt del siguiente ciclo.
  > AGENTE: AI/LLM #8

### S6.C — Data cleanup (3 tareas)

- [ ] **V5.6.9** Archive tablas orphaned: lead_history, objectives, slack_webhooks → schema deprecated.
  > AGENTE: DBA #4.3

- [ ] **V5.6.10** Selective .select() en repositories: OBVRepository y KPIRepository solo columnas necesarias, no SELECT *.
  > AGENTE: DBA #5.1

- [ ] **V5.6.11** Push CRM filters a DB: crear RPC get_crm_leads(project_id, status) en vez de filtrar client-side.
  > AGENTE: DBA #5.2

### S6.D — Tests y polish (3 tareas)

- [ ] **V5.6.12** Add tests para useNovaDataOptimized (hook composition, query invalidation).
  > AGENTE: Frontend #9

- [ ] **V5.6.13** Add tests para CurrentProjectContext (state transitions, sync con React Query).
  > AGENTE: Frontend #9

- [ ] **V5.6.14** Add per-function rate limits en AI edge functions (o tiered cost budgeting $5/day/user).
  > AGENTE: AI/LLM #12

---

## RESUMEN NUMERICO

| Semana | Tareas | Dimension principal | Impacto |
|---|---|---|---|
| S1 — Critical Fixes | 14 | Seguridad + Performance + UX | +2 scorecard |
| S2 — Producto/PMF | 12 | Producto + Datos | +3 scorecard |
| S3 — Monetizacion | 14 | Monetizacion | +4 scorecard |
| S4 — UX Perfeccion | 11 | UX + Producto | +1.5 scorecard |
| S5 — Arquitectura | 11 | Arquitectura + Seguridad | +2 scorecard |
| S6 — IA y Datos | 14 | IA + Datos + Tests | +1.5 scorecard |
| **TOTAL** | **76 tareas** | | **7.2 → 10.0** |
