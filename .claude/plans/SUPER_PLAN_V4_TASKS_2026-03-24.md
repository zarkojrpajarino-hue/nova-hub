# SUPER PLAN V4 — TODAS LAS TAREAS
> Consolidacion de 7 agentes (15 roles). Objetivo: llevar el scorecard de 5.7 a 9.0.
> Generado: 2026-03-24. Organizado por prioridad de ejecucion.

---

## SCORECARD ACTUAL vs TARGET

| Dimension | v4 Actual | Target | Delta |
|---|---|---|---|
| Seguridad | 5/10 | 9/10 | +4 |
| Performance | 7/10 | 9/10 | +2 |
| UX/Retencion | 6/10 | 9/10 | +3 |
| Monetizacion | 3/10 | 8/10 | +5 |
| Datos | 4/10 | 8/10 | +4 |
| IA | 7/10 | 9/10 | +2 |
| Docs | 8/10 | 9/10 | +1 |
| Tests | 4/10 | 8/10 | +4 |
| Arquitectura | 7/10 | 9/10 | +2 |
| Escalabilidad | 6/10 | 8/10 | +2 |
| **MEDIA** | **5.7/10** | **8.8/10** | **+3.1** |

---

## BLOQUE 0 — BUGS CRITICOS (P0, fix inmediato)
> Sin esto, la app tiene crashes, auth roto, y datos incorrectos.
> **Scorecard impact:** Seguridad +2, Arquitectura +1

- [ ] **V4.0.1** Fix 16 queries `.from('members')` → `profiles` en 8 archivos
  > useValidationSystem.ts (L63,94,175,225), ExplorationDashboard.tsx (L67,109,166,188,213),
  > OBVCenterView.tsx (L113), PathToMasterPage.tsx (L69,115), StartChallengeDialog.tsx (L85),
  > ChallengeChecker.tsx (L162), OneOnOnePrep.tsx (L59), AITaskRouter.tsx (L59)
- [ ] **V4.0.2** Fix FeatureGate.tsx: mover FEATURE_INFO (L88-146) con t() dentro del componente
  > t() fuera de React component = crash en runtime
- [ ] **V4.0.3** Anadir 14 edge functions faltantes a config.toml con verify_jwt=false
  > agent-synthesis, connect-holded/notion/slack/trello, send-weekly-summary,
  > sync-holded/notion/slack/trello, trial-email-triggers
  > Sin esto, se despliegan con verify_jwt=true y ES256 falla silenciosamente
- [ ] **V4.0.4** Fix .env: copiar API key valida de .env.txt a .env (o unificar)
  > .env tiene key expirada. Scripts/procesos que leen .env fallan con 401
- [ ] **V4.0.5** Fix import duplicado SourceBadge en OptimusProfileCard.tsx (L12,15)
- [ ] **V4.0.6** Push 5+ commits pendientes a origin/main

---

## BLOQUE 1 — UX DASHBOARD (P0, maximo impacto en retencion)
> El NextAction esta enterrado. El dashboard abruma. Esto cambia D1 retention.
> **Scorecard impact:** UX/Retencion +2, Arquitectura +0.5

### B1.A — Reordenar componentes del dashboard

- [ ] **V4.1.1** Mover MomentBanner a posicion 1 en ProjectDashboardTab.tsx (actual L105 → antes de L95)
- [ ] **V4.1.2** Mover NextActionFocusBlock a posicion 2 (actual L108 → justo despues de MomentBanner)
  > El propio codigo dice "primer elemento del dashboard" en comentario L107 pero esta en pos 5
- [ ] **V4.1.3** Mover TrialCountdownBanner a posicion 3 (actual L90, despues de NextAction)
- [ ] **V4.1.4** FaseBPanel collapsed por defecto — header "Completa tu proyecto 2/5" expandible
- [ ] **V4.1.5** Fusionar FirstStepsPanel + FaseBPanel en checklist unica de 3-4 items con prioridad

### B1.B — Zen Mode (D1-D7 simplificado)

- [ ] **V4.1.6** Implementar flag `zen_mode` en onboarding_data — activo por defecto, dismiss manual
- [ ] **V4.1.7** D0: solo NextAction + ProjectTimeline (3 componentes max)
- [ ] **V4.1.8** D1: + FirstStepsPanel compacto
- [ ] **V4.1.9** D3: + FaseBPanel collapsed + TrialCountdown (si trial)
- [ ] **V4.1.10** D7: + Stats Grid (solo no-zero) + DataCompletenessCard
- [ ] **V4.1.11** D14: + PlanLimitsIndicator
- [ ] **V4.1.12** Transition a full dashboard: phase >= 2 OR daysActive >= 21 OR user dismiss
- [ ] **V4.1.13** Toggle "Vista simplificada | Ver todo" al final del dashboard

### B1.C — Stats y zero-values

- [ ] **V4.1.14** Nunca renderizar StatCard con valor 0 — reemplazar con CTA contextual
  > "OBVs: 0" → "Crea tu primera OBV →"
- [ ] **V4.1.15** Score siempre acompanado de la accion que lo mejora
  > "Score: 42% — Crear 1 OBV validada puede subir ~15%"
- [ ] **V4.1.16** Contexto temporal en metricas: "Score: 42% (+8 pts este mes)"

### B1.D — Sidebar adaptativo por fase

- [ ] **V4.1.17** Ocultar OptimusProfileCard hasta que perfil exista
- [ ] **V4.1.18** Ocultar PlanLimitsIndicator en Fase 0 (daysActive < 14)
- [ ] **V4.1.19** Ocultar LeadConversionInsights hasta Fase 2 o leadsCount > 0
- [ ] **V4.1.20** Ocultar DataCompletenessGuide hasta que exista 1+ engine input
- [ ] **V4.1.21** Reordenar sidebar: Engine → Teasers → DataCompleteness → Leads → Investor → Profile → Limits → Timeline

### B1.E — Emociones y microcopy

- [ ] **V4.1.22** Reframe "Friccion" → "Ganando traccion" en engine.ts labels
- [ ] **V4.1.23** Anadir micro-celebraciones en moment-detector: primera tarea, primera OBV, primer miembro
- [ ] **V4.1.24** PhaseRoadmap: collapsed por defecto, solo dots de progreso visibles
- [ ] **V4.1.25** FirstStepsPanel: 1 CTA hero + "2 mas por hacer" colapsado (no 3 paralelos)

---

## BLOQUE 2 — SEGURIDAD (P0-P1)
> Vectores de ataque reales con JWT valido. Fix antes de lanzar.
> **Scorecard impact:** Seguridad +2

### B2.A — RLS critico

- [ ] **V4.2.1** Fix RLS competitor_snapshots: reemplazar USING(true) FOR ALL → solo project members
- [ ] **V4.2.2** Fix RLS market_intelligence: idem
- [ ] **V4.2.3** Fix RLS ai_analysis_cache INSERT/UPDATE: restringir a project members
- [ ] **V4.2.4** Fix RLS metric_alerts/ai_recommendations/weekly_insights INSERT: restringir

### B2.B — Edge functions membership

- [ ] **V4.2.5** Aplicar verifyProjectMembership a las 20 edge functions mas criticas
  > Prioridad: analyze-project-v4, generate-tasks-v2, generate-strategic-cycle,
  > generate-email-pitch, export-excel, analyze-competitors, market-research,
  > generate-financial-projections, generate-buyer-persona-v2, generate-lead-scoring-v2,
  > ritual-optimus, evaluate-meeting-alignment, generate-pitch-deck, geo-intelligence,
  > send-email-real, scrape-and-extract, validate-monetization, generate-content-calendar,
  > growth-playbook-generator, learning-path-generator
- [ ] **V4.2.6** Anadir verifyProjectMembership a las 44 restantes (batch)

### B2.C — Input sanitizacion

- [ ] **V4.2.7** Aplicar sanitizePromptInput a las 31 edge functions sin proteccion
- [ ] **V4.2.8** Fix upsert_obv_participants: anadir auth.uid() check

### B2.D — Guardrails IA

- [ ] **V4.2.9** Reescribir generate-testimonial con guardrails (nunca inventar claims, disclaimer obligatorio)
- [ ] **V4.2.10** Anadir disclaimer "datos estimados, no verificados" a market-research outputs
- [ ] **V4.2.11** Anadir disclaimer a generate-financial-projections outputs
- [ ] **V4.2.12** Fix enrich-project-intelligence: eliminar o reescribir (es zombie + miente)

---

## BLOQUE 3 — IA OPTIMIZACION (P1)
> Reducir costes 67%, eliminar zombies, proteger outputs.
> **Scorecard impact:** IA +2, Datos +1

### B3.A — Model downgrade

- [ ] **V4.3.1** Downgrade a Haiku: competitive-swot-generator, cofounder-alignment-analyzer,
  > generate-content-calendar, suggest-buyer-persona, validate-monetization,
  > extract-business-info, geo-intelligence, generate-weekly-insights,
  > scrape-and-extract (x3 calls)
- [ ] **V4.3.2** Consolidar vendor: generate-learning-roadmap y generate-project-roles de OpenAI → Haiku

### B3.B — JSON safety

- [ ] **V4.3.3** Aplicar safeJsonParse a 11 funciones: analyze-competitors, analyze-meeting,
  > competitor-intelligence-cron, generate-financial-projections, generate-weekly-insights,
  > generate-tasks-v2, generate-lead-scoring-v2, scrape-and-extract (x3),
  > suggest-buyer-persona, ritual-optimus, get-meeting-brief

### B3.C — Zombies

- [ ] **V4.3.4** Eliminar 22 edge functions zombie (lista en EDGE_FUNCTION_AUDIT.md)
- [ ] **V4.3.5** Eliminar tablas muertas o marcar como deprecated:
  > cobros_parciales, voice_onboarding_transcripts, validation_roadmaps,
  > master_mentoring, ai_source_registry, beta_testers

### B3.D — Logging y caching

- [ ] **V4.3.6** Aplicar aiLogger a las 35 funciones que no lo usan
- [ ] **V4.3.7** Implementar cache en generate-business-ideas (resultado por onboarding_type + inputs hash)
- [ ] **V4.3.8** Implementar cache en generate-strategic-cycle (por project_id + cycle period)

---

## BLOQUE 4 — ARQUITECTURA (P1)
> Fix deuda tecnica, migrar hooks legacy, mejorar reactividad.
> **Scorecard impact:** Arquitectura +2, Performance +1

### B4.A — Legacy hooks

- [ ] **V4.4.1** Migrar 18 archivos que importan useNovaData → useNovaDataOptimized
  > Mantener backward compat exports marcados @deprecated
- [ ] **V4.4.2** Anadir staleTime a 16 hooks sin el (lista completa en plan V4)
- [ ] **V4.4.3** Eliminar phantom fields de ProjectMemberWithProfile (is_lead, role_accepted, etc.)

### B4.B — Mutations e invalidacion

- [ ] **V4.4.4** useCreateTask: anadir invalidacion de queryKeys.engine.* al completar tarea
- [ ] **V4.4.5** useUpsertOBVParticipants: anadir invalidacion de queryKeys.engine.*
- [ ] **V4.4.6** useCRMPipeline.handleDragEnd: corregir queryKey de invalidacion
- [ ] **V4.4.7** useDevelopment, useMasters, useNotificationsV2: usar queryKeys factory

### B4.C — Performance

- [ ] **V4.4.8** Lazy-load SmartAlertsWidget, PendingValidationsWidget (below-the-fold)
- [ ] **V4.4.9** Lazy-load preview modals (cada uno 700-1400 lineas, solo se usa on click)
- [ ] **V4.4.10** Fix DashboardView: useMemo para membersForRanking (re-render innecesario)
- [ ] **V4.4.11** Fix useMyPendingValidations N+1 waterfall → JOIN en una sola query

### B4.D — Limpieza

- [ ] **V4.4.12** Eliminar 10 archivos .tsx.bak en src/components/preview/
- [ ] **V4.4.13** Eliminar RecentActivityFeed (devuelve [] siempre — dead code)
- [ ] **V4.4.14** Eliminar WhatIfSimulator (Pearson con N=4 = invalido)
- [ ] **V4.4.15** Eliminar OptimusProfileCard del dashboard (mover a Settings si se quiere conservar)
- [ ] **V4.4.16** Limpiar 2 stashes huerfanos y 2 branches worktree-agent

---

## BLOQUE 5 — MONETIZACION (P1)
> Activar pagos. Sin esto, 0 revenue.
> **Scorecard impact:** Monetizacion +5

- [ ] **V4.5.1** Crear edge function create-checkout-session (Stripe Checkout)
- [ ] **V4.5.2** Configurar 2 productos en Stripe Dashboard (Pro $19/mo, Scale $49/mo)
- [ ] **V4.5.3** Resolver inconsistencia PLAN_LIMITS vs PLAN_TIERS en features.ts (unificar)
- [ ] **V4.5.4** Subir PLAN_TIERS.free.aiCalls de 10 a 20
- [ ] **V4.5.5** Implementar contador real de AI calls (incrementar en ai_generations_log, verificar antes de llamar)
- [ ] **V4.5.6** Implementar 3 upgrade nudges: 10a llamada IA, 3er miembro, 2o proyecto
- [ ] **V4.5.7** Crear link a Stripe Customer Portal (self-service billing)
- [ ] **V4.5.8** Fix FeatureGate t() bug (ya en V4.0.2 — prerequisito)
- [ ] **V4.5.9** Activar ENABLE_PAYMENTS=true en staging, probar E2E
- [ ] **V4.5.10** Activar ENABLE_PAYMENTS=true en produccion

---

## BLOQUE 6 — DATOS Y ANALYTICS (P2)
> Explotar datos que ya existen pero nadie usa.
> **Scorecard impact:** Datos +3

- [ ] **V4.6.1** Weekly Digest automatico: cron + Haiku + email via send-email-real
  > Resumen 3-5 bullets por proyecto activo, coste ~$0.003/digest
- [ ] **V4.6.2** Crear frontend para competitive_analysis (ya se llenan por IA, sin UI)
- [ ] **V4.6.3** Crear frontend para weekly_insights (idem)
- [ ] **V4.6.4** Crear frontend para financial_projections (idem — tab Financiero)
- [ ] **V4.6.5** Implementar TTFV tracking (Time to First Value) en PostHog
- [ ] **V4.6.6** Implementar churn risk score: combinar last_login + activity_log + obvs + tasks
- [ ] **V4.6.7** Fix MRR milestones hardcoded EUR → moneda del usuario en moment-detector
- [ ] **V4.6.8** Fix stagnation warning: ajustar umbral 8 semanas por fase (Fase 0 = mas tolerante)

---

## BLOQUE 7 — TESTS (P2)
> 18 lib files sin tests. Cubrir logica critica.
> **Scorecard impact:** Tests +4

- [ ] **V4.7.1** Tests para next-action.ts (12 branches, 0 tests)
- [ ] **V4.7.2** Tests para engine-delta.ts (5 metricas × 4 direcciones)
- [ ] **V4.7.3** Tests para moment-detector.ts: 4 casos faltantes (team_growth, phase_speed, bottleneck, low_runway)
- [ ] **V4.7.4** Tests para phase-features.ts: getPhaseRelevanceScore, Phase 0/4 edge cases
- [ ] **V4.7.5** Tests para useRolePermissions: 8 branches de computePermissions
- [ ] **V4.7.6** Tests para toolkit-unlock-engine.ts
- [ ] **V4.7.7** Tests para gamification.ts
- [ ] **V4.7.8** Tests para reentry.ts, optimus.ts, pearson.ts
- [ ] **V4.7.9** Tests para agent-synthesis.ts, context-aggregator.ts
- [ ] **V4.7.10** Tests para build-next-action.ts: 3 casos faltantes (urgent decisions, warning insights, escalateToMeeting)

---

## BLOQUE 8 — FEATURES NUEVAS (P2-P3)
> Oportunidades detectadas por los agentes para multiplicar valor.
> **Scorecard impact:** UX +1, Monetizacion +1, Datos +1

- [ ] **V4.8.1** "Investor Update" one-click generator
  > Edge function + componente. Auto-genera email mensual con datos del Phase Engine.
  > Viral loop: inversor recomienda a portafolio. Painkiller: founder NECESITA actualizar datos.
- [ ] **V4.8.2** "First Action Modal" post-onboarding
  > Modal 1 pantalla: "Tu primera accion: [NextAction]. Hazla ahora." Impacto: +15-20% D1
- [ ] **V4.8.3** Daily push notification D1-D7
  > Cron 9am con momento + siguiente accion. "Tu proyecto lleva 3 dias sin actividad."
- [ ] **V4.8.4** Micro-celebraciones intermedias en moment-detector
  > first_task_completed, first_obv_validated, first_team_member, 5th_obv, 10th_task
- [ ] **V4.8.5** InvitePage: anadir explicacion del producto + mini-tour post-aceptacion
  > Actualmente el invitado no sabe que es Optimus-K
- [ ] **V4.8.6** Benchmarking anonimizado entre equipos de una aceleradora
  > PartnerComparisonTable ya existe — conectar con multi-team view
- [ ] **V4.8.7** "Verified Phase N" badge exportable para LinkedIn/pitch decks
  > Crea visibilidad externa del producto

---

## BLOQUE 9 — BUNDLE Y PERFORMANCE AVANZADA (P3)
> Optimizaciones de carga y rendimiento.
> **Scorecard impact:** Performance +1

- [ ] **V4.9.1** Split entry chunk (313KB gzip): extraer types.ts, i18n, shared components
- [ ] **V4.9.2** Verificar que i18n chunks se cargan dinamicamente (solo idioma activo)
- [ ] **V4.9.3** Anadir React.memo a 10 componentes hotspot (SmartAlertsWidget, EvolutionChart, etc.)
- [ ] **V4.9.4** Eliminar public/landing/stitch-refs/ (576KB PNGs de diseno, no para produccion)

---

## BLOQUE 10 — ESCALABILIDAD Y ROLES (P3)
> Preparar para multi-usuario real.
> **Scorecard impact:** Escalabilidad +2

- [ ] **V4.10.1** Implementar RLS server-side por rol (operations no ve financial data)
- [ ] **V4.10.2** Mover onboarding tracking de localStorage a servidor
- [ ] **V4.10.3** Fix type casts: resolver 11 `as any` en produccion con tipos correctos
- [ ] **V4.10.4** Resolver conflicto VITE_SUPABASE_PUBLISHABLE_KEY entre .env y .env.txt

---

## RESUMEN NUMERICO

| Bloque | Tareas | Prioridad | Esfuerzo est. |
|--------|--------|-----------|---------------|
| B0 — Bugs criticos | 6 | P0 | 1-2 dias |
| B1 — UX Dashboard | 25 | P0 | 5-7 dias |
| B2 — Seguridad | 12 | P0-P1 | 4-5 dias |
| B3 — IA Optimizacion | 8 | P1 | 3-4 dias |
| B4 — Arquitectura | 16 | P1 | 6-8 dias |
| B5 — Monetizacion | 10 | P1 | 4-5 dias |
| B6 — Datos | 8 | P2 | 3-4 dias |
| B7 — Tests | 10 | P2 | 5-6 dias |
| B8 — Features nuevas | 7 | P2-P3 | 5-7 dias |
| B9 — Bundle | 4 | P3 | 2-3 dias |
| B10 — Escalabilidad | 4 | P3 | 3-4 dias |
| **TOTAL** | **110 tareas** | | **~41-55 dias** |

---

## ORDEN DE EJECUCION RECOMENDADO

```
SEMANA 1: B0 (bugs criticos) + B1.A (reordenar dashboard)
SEMANA 2: B1.B-E (Zen Mode + stats + sidebar + emociones)
SEMANA 3: B2.A-B (RLS + membership edge fn)
SEMANA 4: B2.C-D (sanitizacion + guardrails) + B3.A-B (IA downgrade + JSON safety)
SEMANA 5: B4.A-B (legacy hooks + mutations)
SEMANA 6: B4.C-D (performance + limpieza) + B3.C-D (zombies + logging)
SEMANA 7: B5 (monetizacion completa)
SEMANA 8: B6 (datos y analytics)
SEMANA 9: B7 (tests)
SEMANA 10: B8.1-3 (Investor Update + First Action Modal + Daily push)
SEMANA 11: B8.4-7 + B9 (features + bundle)
SEMANA 12: B10 (escalabilidad) + scorecard final
```
