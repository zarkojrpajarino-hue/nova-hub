# TASK LIST — Nova Hub (Optimus-K)
> Lista completa de todas las tareas, ordenadas por fases de ejecución.
> Para detalle de cada tarea → ver MASTER_ACTION_PLAN.md
> Estado: [ ] Pendiente · [x] Completado · [~] En progreso · [!] Diferido (con motivo)
>
> **Última actualización: 2026-03-18**
> Progreso global: ~233/321 tareas · F15: ~106/168 · Bloque 0 cerrado (10/10) · Bloque B cerrado (20/20) · **Bloque C cerrado** · **Bloque E cerrado** · **Bloque F cerrado (10/10)** · **I15.77 cerrado · I15.78 cerrado · I15.94 cerrado · I15.80 cerrado · I15.83–I15.89 cerrado**
> **Deudas abiertas BLOQUE C:** I15.DEBT.2 (MRR diverge si upsert falla) · I15.DEBT.3 (GCal cancelados) · I15.FIX.7 (verify_jwt revierte en redeploys)
> **Prerrequisitos para BLOQUE E/F — migraciones aplicadas 2026-03-18:** ✅
> - `integration_entities.last_seen_at TIMESTAMPTZ` (I15.41) — aplicado
> - `integration_sync_runs.pagination_cursor TEXT` + `is_partial BOOLEAN NOT NULL DEFAULT false` (I15.43) — aplicado
> Migración local: `20260318000001_bloque_c_sync_prerequisites.sql`.
> **Prerrequisito adicional identificado en I15.47 (antes de orquestador Asana):**
> - `tasks.external_provider TEXT`, `tasks.external_id TEXT`, `tasks.external_sync_at TIMESTAMPTZ` — pendiente de migración antes de implementar sync-asana.
> **Documentos creados esta semana:** INTEGRATION_INVENTORY.md · INTEGRATION_DATA_CONTRACT.md · AGENTS_CONTRACT.md · BLOQUE_A_AUDIT.md · BLOQUE_A2_AUDIT.md · INTEGRATION_ARCHITECTURE.md · INTEGRATION_WRITE_GUARD.md

---

## FASE 1 — MATEMÁTICA Y FUNDAMENTOS ✅ 12/12
> Cerrada: 2026-02-24. Congelada. No modificar.

- [x] **F1.1** Cerrar la fórmula definitiva de Iteration Velocity (ventana, inputs, normalización)
- [x] **F1.2** Definir evidence_quality_score (escala, tipos de evidencia, pesos)
- [x] **F1.3** Resolver capacidad del solo founder (baseline 120 unidades o umbrales diferentes)
- [x] **F1.4** Decidir estrategia Day 1 Probability (opción A/B/C/D — cuál se implementa)
- [x] **F1.5** Definir thresholds de Fase 1 (igual nivel de detalle que Fase 2)
- [x] **F1.6** Definir thresholds de Fase 3 (igual nivel de detalle que Fase 2)
- [x] **F1.7** Definir thresholds de Fase 4 (igual nivel de detalle que Fase 2)
- [x] **F1.8** Confirmar OBV types necesarios en schema
- [x] **F1.9** Decidir fuente de Benchmarks v1 (Opción A curado / B interno / C híbrido)
- [x] **F1.10** Suavizar Viability Engine: en v1 NO bloquear tareas — solo recomendar y registrar
- [x] **F1.11** Simplificar Function Coverage v1: cobertura manual + penalización simple
- [x] **F1.12** Añadir campo `engine_version TEXT` a tablas de motores
- [x] **F1.13** Definir data_completeness_score (5 dimensiones, umbrales, efecto en sistema)

---

## FASE 2 — BASE DE DATOS ✅ 19/19
> Cerrada: 2026-02-24. Todas las migraciones aplicadas.

### Nuevas tablas
- [x] **D2.1** Crear tabla `project_phase_state` + `project_phase_history`
- [x] **D2.2** Crear tabla `project_probability`
- [x] **D2.3** Crear tabla `project_probability_history`
- [x] **D2.4** Crear tabla `project_viability_state`
- [x] **D2.5** Crear tabla `project_economic_profile`
- [x] **D2.6** Crear tabla `project_economic_profile_history`
- [x] **D2.7** Crear tabla `project_risk_score` + `project_risk_score_history`
- [x] **D2.8** Crear tabla `project_function_coverage`
- [x] **D2.9** Crear tabla `decision_events`
- [x] **D2.10** Crear tabla `strategic_blocks`
- [x] **D2.11** Crear tabla `project_protocols`
- [x] **D2.12** Crear tabla `strategic_cycles`
- [x] **D2.13** Crear tabla `benchmarks`
- [x] **D2.20** Crear tabla `strategic_model_versions` (pivot tracking computable)

### Modificaciones a tablas existentes
- [x] **D2.14** `ALTER TABLE tasks ADD COLUMN leader_id UUID`
- [x] **D2.15** `ALTER TABLE projects ADD COLUMN country, market_scope, cluster`
- [x] **D2.16** `ALTER TABLE project_members ADD COLUMN performance_score_v2`
- [x] **D2.17** Auditar y añadir OBV types al ENUM `obv_type` + campos auto-tipo F1.8
- [x] **D2.18** `ALTER TABLE project_roles ADD COLUMN maps_to_specialization`

### Tablas adicionales de Fase 1
- [x] **D2.21** Crear tabla `engine_versions`
- [x] **D2.22** Crear tabla `project_strategy_current`
- [x] **D2.23** Crear tabla `project_functions` + trigger `trg_create_project_functions`
- [x] **D2.24** Crear tabla `process_artifacts`
- [x] **D2.25** Crear tabla `viability_events`

### Matemática Risk Score
- [x] **R1.1** Definir RunwayFactor
- [x] **R1.2** Definir ExecutionDrop
- [x] **R1.3** Definir ValidationWeakness
- [x] **R1.4** Definir RevenueConcentration
- [x] **R1.5** Definir BottleneckSeverity

### RLS
- [x] **D2.19** Añadir RLS policies a todas las tablas nuevas

---

## FASE 3 — FIXES DE CÓDIGO EXISTENTE ✅ 5/6 (C3.4 diferido)
> Bugs confirmados por auditoría. No requieren Fase 1 ni 2.
> **1 tarea diferida** (ver nota).

- [x] **C3.1** Fix `InviteMemberWizard.tsx` — reemplazar `setTimeout` falso por búsqueda real en `profiles` + INSERT en `project_members`
- [x] **C3.2** Conectar selección de rol → `project_members.role` (specialization_role ENUM)
- [x] **C3.3** Unificar los 2 sistemas de roles: eliminado `project_roles` (tabla ghost), fuente única `specialization_role` ENUM con lista estática `ROLE_OPTIONS`
- [!] **C3.4** Fix `calculate_role_performance_score` — implementar las 6 fórmulas por rol
  > **DIFERIDO — v2. Motivo: deuda de datos, no de código.**
  > Las fórmulas completas requieren ~10 inputs (execution_history, task_completion_rates,
  > role_specific_kpis, etc.) que no existen en la DB actual. Fabricar la métrica con
  > inputs inexistentes produciría un número sin base real.
  > `compute_role_execution_health` (migration 00006) cubre el proxy operacional suficiente
  > para v1. Revisar en v2 cuando haya datos reales de rol acumulados.
- [x] **C3.5** Añadir campo `leader_id` al formulario de creación/edición de tareas
  > Ya existía: `formData.leaderId` + `leader_id` en INSERT confirmados en TaskForm.tsx (líneas 43, 80).
- [x] **C3.6** Validar leader ≠ executor en task creation (frontend TaskForm.tsx + CHECK constraint DB — migración 00032)

---

## FASE 4 — ENGINES BACKEND ✅ 24/24
> Completada. Todas las migraciones confirmadas (00004–00028).

### Phase Engine
- [x] **E4.1** Phase engine como función SQL `run_phase_engine` — migrations 00004/00022
- [x] **E4.2** Calculador Fase 1 (Descubrimiento) con thresholds — migration 00005
- [x] **E4.3** Calculador Fase 2 (Validación) con thresholds — migration 00014
- [x] **E4.4** Calculador Fase 3 (Operación) con thresholds — migration 00015
- [x] **E4.5** Calculador Fase 4 (Escala) con thresholds — migration 00018
- [x] **E4.6** Lógica de avance de fase (score ≥75% + hard signal → propuesta) — migration 00005
- [x] **E4.7** Lógica de regresión de fase (6 semanas < 50% → fase -1) — migration 00022

### Probability Engine
- [x] **E4.8** `compute-probability-score` (5 inputs, pesos) — migration 00007
- [x] **E4.9** Conectar CRM pipeline → revenue_momentum — migration 00023
- [x] **E4.10** Conectar peer validation de KPIs → validation_strength — migration 00003

### Viability Engine
- [x] **E4.11** `run_viability_engine` (3 estados, T1–T4) — migration 00009
- [x] **E4.12** Cooldown de 30 días post-decisión — migration 00025
- [x] **E4.13** Las 3 Paths (pivot segmento / pivot valor / pausar) — migration 00025

### Organizational Engine
- [x] **E4.14** `run_org_capacity_engine` (role fill ratio + coverage → org_health) — migration 00026
- [x] **E4.15** Detección de bottlenecks por función — migration 00026
- [x] **E4.16** Detección de rol crítico vacío por fase — migration 00026

### Economic Profile
- [x] **E4.17** `detect-economic-profile` (avg_ticket, gross_margin, revenue_type) — migration 00024
- [x] **E4.18** Detección de cambio de perfil — migration 00024
- [x] **E4.19** Detección de incoherencia del modelo (4 casos) — migration 00024

### Risk Score
- [x] **E4.20** `RiskScore` (5 inputs, 4 niveles) — migration 00008

### Conexiones entre engines
- [x] **E4.21** role_performance → Phase Score (execution_health 20%) — migrations 00006/00007
- [x] **E4.22** `suggest-bottleneck-challenge` + activate_challenge — migration 00027

### Cron jobs y triggers
- [x] **E4.23** Cron semanal (Phase → Probability → Risk → Viability) — migrations 00004/00007/00008/00021
- [x] **E4.24** Triggers on-demand (OBV validado, tarea completada, lead won) — migration 00028

---

## FASE 5 — ONBOARDING Y PRIMERA EXPERIENCIA 9/11
> Requiere Fase 4 (engines calculando) para que los resultados tengan sentido.
> **2 tareas diferidas** (ver notas).

- [x] **O5.1** Onboarding Fase A (preguntas comunes obligatorias) — `FaseACommon.tsx` (Q2–Q10) con rehidratación
- [x] **O5.2** Primera pregunta de entrada ("¿en qué punto estás?") → 3 sub-estados — `SelectOnboardingTypePage.tsx` (generative / idea / existing)
- [x] **O5.3** Flujo "sin idea" → generación de ideas + selección — `GenerativeFastStart.tsx`
- [!] **O5.4** Adaptar edge function `generate-business-ideas` al nuevo formato (perfil + riesgos + experimento 7 días)
  > **DIFERIDO — pendiente validación con usuarios reales.**
  > Perfeccionar el formato y contenido de las ideas generadas tiene sentido solo
  > cuando sepamos si el path generativo tiene adopción real. Optimizar sin datos
  > de uso = riesgo de pulir lo equivocado. Revisar tras primeros 20-30 usuarios.
- [x] **O5.5** Discovery Path sub-estado "Sin hipótesis" — screening binario en IdeaFastStart + `DiscoveryThinkingForm.tsx` (5 pasos DT → hipótesis estructurada)
- [x] **O5.6** Location Layer como campo obligatorio en onboarding — `location_country` en FaseACommon, guardado en `projects.country`
- [!] **O5.7** Double filter para ideas (Nivel 1 hard filter + Nivel 2 warning)
  > **DIFERIDO — pendiente validación con usuarios reales.**
  > Filtrar ideas antes de mostrarlas puede reducir fricción o puede causar drop-off
  > si el usuario no ve opciones que le interesan. Decisión de producto que requiere
  > datos de comportamiento antes de implementar.
- [x] **O5.8** Mostrar "Perfil Operativo Detectado" al terminar onboarding — `OnboardingProfileCard.tsx` (display only, 5 perfiles heurísticos derivados de monetization_type, estimación inicial)
- [x] **O5.9** Post-onboarding first 15 minutos — `FirstStepsPanel.tsx` (3 acciones: motor ref + validación por hypothesis_maturity + operativa por monetización; dismiss con first_15_shown en onboarding_data)
- [x] **O5.10** Construir onboarding Fase B — `FaseBPanel.tsx` (5 ítems en 3 bloques: sector, competidores, canal de adquisición, primer OBV, asunción más arriesgada; progreso en onboarding_data sin tabla nueva; auto-dismiss al completar; scroll reactivo a AcquisitionChannelEditor)
- [x] **O5.11** Construir sección "Mi Modelo" (5 bloques, sección permanente) — `MiModeloView.tsx` (Fase Actual, Contexto Económico, Mercado, Estructura, Salud; sidebar nav + route confirmados)

---

## FASE 6 — UX CORE (superficies del motor) 15/15 ✅
> Requiere Fase 4 + Fase 5.
> **Refactor estructural** (post-U6.10): `useProjectEngineData` refactorizado como aggregador puro. 4 hooks de dominio: `useProjectPhaseData` · `useProjectProbabilityData` · `useProjectRiskData` · `useProjectCoverageData`. Keys con prefijo `['project-engine', projectId, '<dominio>']` — invalidación realtime por prefijo funciona sin cambios. `ProjectEngineData` interface y API de retorno `{ data, isLoading }` sin cambios. Consumers existentes intactos. tsc limpio.

- [x] **U6.1** Header: 3 indicadores permanentes — `EngineIndicators.tsx` (Fase N + dot status / 5 dots probabilidad + número / dot + label riesgo). Reemplaza Quick stats. `useProjectEngineData` compartido (queryKey `['project-engine', projectId]`, sin request extra). tsc limpio.
- [x] **U6.2** Phase progress bar — `PhaseProgressBar.tsx`: barra `phase_score/100` con color por `phase_status` (success/warning/destructive) + etiqueta "Fase N — label" + "Señal dura cumplida/Falta señal dura" con icono. Fuente única: `phaseState`. Encima de las tabs (visible en todas). tsc limpio.
- [x] **U6.3** Phase Score breakdown view + Next Action engine (outcomes + hard signal + próxima acción recomendada) — `ProjectEnginePanel.tsx` con `getNextAction` v1.1
- [x] **U6.4** Probability breakdown — `ProbabilityBreakdown.tsx`: 5 inputs (barras con color ≥70 verde/≥40 naranja/<40 rojo) + tendencia real desde `project_probability_history` (últimas 2 filas, delta sin inventar) + badge "Confianza baja" si `low_confidence`. Invisible si `inactive`. Hook expandido: 5 inputs en `probability` + `probabilityHistory[]`. tsc limpio.
- [x] **U6.5** Risk Score display — `RiskBreakdown.tsx`: nivel principal (Bajo/Medio/Alto/Crítico) + 5 factores con colores invertidos (≥70 rojo · 30–69 naranja · <30 verde, mayor valor = mayor riesgo) + tendencia desde `project_risk_score_history` con colores invertidos (subida = rojo) + `inputs_available/5 datos` + confianza. Invisible si `insufficient_data`. Hook expandido: 5 inputs + `inputs_available` + `riskHistory[]`. tsc limpio.
- [x] **U6.6** Regression UX — `RegressionBanner.tsx`: dos niveles (señal compacta en `PhaseProgressBar` + banner inline). Regresión fuerte = `phase_drop` (fase baja de N a N-1); suave = `score_drop` (misma fase, caída ≥15 pts). Dismissible por sesión via sessionStorage key con `latestCalcAt` — reaparece si hay nueva evaluación. Copy no punitivo. CTA "Ver qué recuperar" → dashboard tab. `deriveRegression()` exportada y reutilizada en `PhaseProgressBar`. 7ª query paralela en `useProjectEngineData`: `project_phase_history` LIMIT 2. tsc limpio.
- [x] **U6.7** Viability state banners — `ViabilityBanner.tsx`: amarillo (monitoring/stagnation) dismissible por sessionStorage + rojo (critical) colapsable en sesión. Copy por `top_trigger_type` (4 triggers) + copia especial si `t2_cash_flow_active`. Hook separado `useProjectViabilityState` (queryKey `['project-viability', projectId]`). Colocado antes de `PhaseProgressBar`. tsc limpio.
- [x] **U6.8** Empty states del motor — `EngineEmptyState.tsx` (card reutilizable: icon + title + description + CTA opcional). 5 superficies cubiertas: Phase (`!phaseState` → CTA "Crear primer OBV" → tab OBVs), Probability (`inactive` → CTA "Añadir métricas" → tab Financiero), Risk (`insufficient_data` → hint "Inputs N/5", sin CTA), Viability (sin row → no render, sin cambios), Next Action (null → texto fallback inline en panel). tsc limpio.
- [x] **U6.9** Phase transition UX — `PhaseTransitionToast.tsx`: toast flotante (fixed bottom-right, z-50, 320px) con fade-in animation. Trigger: `phaseHistory[0].phase > phaseHistory[1].phase`. Persistencia: sessionStorage key `phase_transition_seen_${projectId}_${toPhase}` — una vez por transición. Auto-dismiss 4s. Contenido: Sparkles icon + "Proyecto avanzó a Fase N" + fase description (de nueva constante `PHASE_DESCRIPTIONS` en `engine.ts`) + CTA "Ver qué cambia" → dashboard tab + "Continuar". Hook `usePhaseTransition` inline en el componente. tsc limpio.
- [x] **U6.10** Build Mode vs Rescue Mode — `ProjectModeBadge.tsx`: badge compacto (dos líneas, px-2.5 py-1.5) en header entre EngineIndicators y HelpMenu. `deriveProjectMode()` exportada: Rescue si `risk_level==='high'|'critical'` OR `viability_status==='critical'`, Build en cualquier otro caso (incluye datos ausentes → default Build). Sin modal, sin banner, sin cambios en navegación. tsc limpio. (visual distinto, mismo sistema)
- [x] **U6.11** Dynamic phase horizon — `PhaseHorizonHint.tsx`: 4 salidas (soon/stable/gradual/correction) + null para fase 4 o sin historia. `derivePhaseHorizon()` exportada: lógica pura, sin queries nuevas, reutiliza `phaseHistory` existente. Subtexto debajo de `PhaseProgressBar`. No muestra fechas, no promete avance. tsc limpio. (trayectoria, no deadline fijo)
- [x] **U6.12** Weekly Review digest UI (in-app, email diferido N7.6) — **Migración 00034** (`weekly_reviews` table con snapshot semanal: phase, mrr, runway, tasks_completed, obvs_count, sales_count, summary_json, has_regression, has_transition; RLS `auth_is_project_member`; índice `project_id, week_end_date DESC`). SQL function `generate_weekly_review_for_project(UUID)` + wrapper `generate_all_weekly_reviews()` (SECURITY DEFINER, pg_cron `30 23 * * 0` cada domingo). Edge function `generate-weekly-reviews/index.ts` para trigger HTTP manual. Hook `useLatestWeeklyReview` en `useNovaDataOptimized`. UI: `WeeklyReviewCard.tsx` (headline + highlights verdes + warnings rojos/amber + next_step + "Ver detalle") + `WeeklyReviewDetail.tsx` (modal con snapshot completo: fase, MRR, runway, actividad de la semana, highlights, warnings, next step). Integrado en `ProjectDashboardTab` debajo de `RiskBreakdown`. Empty state "Aún no hay review semanal". Desviación del spec: pg_cron llama SQL function directamente (sin pg_net) igual que viability engine; edge function disponible para trigger HTTP manual. tsc limpio.
- [x] **U6.13** Notification center renovado — **Migración 00033** (rename `titulo→title`, `mensaje→message`, `leida→read`, `tipo→type`; add `mark_all_notifications_read` + `archive_notification` RPCs; no snooze v1). **G9.1** fix: unread count ahora filtra `read=false AND archived=false`. **G9.2** paginación: `limit` param en `useNotifications`, `PAGE_SIZE=20`, "Cargar más" en UI. Renovación UI: 4 filter tabs (Todas/Sin leer/Actividad/Sistema), prioridad visual con borde izquierdo de color (critical=red/high=orange), empty state descriptivo, sin snooze. Actualización de todos los consumers del sistema viejo (`useNotifications.ts`, `NotificationDropdown.tsx`, `NotificationBell.tsx`, `NotificationList.tsx`, `NotificationsView.tsx`, `demoData.ts`, `supabase/types.ts`, `types/notifications.ts`). tsc limpio.
- [x] **U6.14** "Cost of Ignoring" visualization — `CostOfIgnoring.tsx` dentro de `ProjectEnginePanel` debajo de Next Action. `deriveCostOfIgnoring()` exportada: prioridad risk_active_high > create_obv_fase3 > create_obv > add_metrics > define_channel > genérico. Severity low/medium/high con badge de color. 1–2 consecuencias como bullets. Rescue Mode proxy via `riskStatus=active + riskLevel=high|critical` (elevación completa con viabilityData diferida a v2). `NextAction` type exportado de `ProjectEnginePanel`. tsc limpio. (Trayectoria A vs B)
- [x] **U6.15** Modo Desbloqueo UX — `UnlockModeCard.tsx` dentro de `ProjectEnginePanel` antes de Next Action. `deriveUnlockMode()` exportada: activa si `isViabilityCritical || isRiskCritical || isPhaseDrop || isHighCostAction`. Si hay nextAction → palanca principal + consecuencias de CostOfIgnoring. Sin nextAction → copia específica por condición (viabilidad/riesgo). Visual: `bg-destructive/10`, Unlock icon, "Empieza por esto", "Por qué importa". CTA "Ir a resolverlo" reutiliza `onAction` prop. `viabilityStatus` threaded desde `useProjectViabilityState` en ProjectDashboardTab (React Query cache = sin request extra). tsc limpio.

---

## FASE 7 — NOTIFICACIONES LAYERS 1–5 7/7 ✅
> Requiere Fase 4 (engines generando outputs).
> Diseño aprobado 2026-03-11. Orden de ejecución: N7.0 → N7.1 → N7.3 → N7.4 → N7.2 → N7.5 → N7.6.
> Decisiones fijas: Layer 1 en N7.0, cron 6h, cap silencioso + bypass critical, nuevos tipos completos.
> Backup `migrations_backup/20260128_notifications_v2.sql` tiene Layer 1 pre-diseñado con 3 referencias rotas a arreglar.

- [x] **N7.0** Layer 1 base + helpers — **Migración 00035**. `check_notification_cap(user_id, priority)`: daily 5 max + weekly 15 max + critical bypass. `notify_all_project_members()`: loop miembros con cap + dedup. Layer 1 cron (4): `notify_inactive_leads` (usa `obvs` no `leads`, `updated_at`), `notify_overdue_tasks` (fix: `titulo`/`fecha_limite`), `notify_expiring_validations` (reescrito con `obv_validaciones JOIN`), `notify_inactive_projects`. Layer 1 triggers (5): welcome, project_deleted, role_accepted, lead_won (trigger en `obvs.pipeline_status='cerrado_ganado'`), obv_validated. `run_notification_batch()` inicial. pg_cron `0 */6 * * *`. `notify_near_objectives` omitido: schema mismatch objectives/member_stats.
- [x] **N7.1** Layer 2 — **Migración 00036** (junto con N7.2-N7.5). `notify_phase_changes(project_id)`: `phase_advanced` (HIGH), `phase_regressed` (CRITICAL), `phase_critical` (HIGH), `hard_signal_reached` (HIGH, solo owner, 30d window), `phase_stagnant` (MEDIUM, 3+ semanas, score delta<5pts).
- [x] **N7.2** Layer 3 — **Migración 00036**. `notify_probability_changes(project_id)`: `probability_drop` (HIGH, delta<-15), `probability_critical` (CRITICAL, score<20), `probability_recovered` (LOW, delta>+20 AND prev<30).
- [x] **N7.3** Layer 4 — **Migración 00036**. `notify_viability_changes(project_id)`: `viability_critical` (CRITICAL, 3d window), `viability_monitoring` (MEDIUM, 7d), `viability_resolved` (LOW, 30d), `cash_flow_alert` (CRITICAL, t2_cash_flow_active=true, 3d).
- [x] **N7.4** Layer 5 — **Migración 00036**. `notify_risk_changes(project_id)`: `risk_critical` (CRITICAL, 3d), `risk_elevated` (HIGH, 7d). `notify_bottlenecks(project_id)`: `bottleneck_detected` (HIGH, owner, bloques creados en últimas 6h, 7d window). `run_notification_batch()` extendido con loop por proyecto + EXCEPTION aislado. tsc limpio.
- [x] **N7.5** Hard caps — incluido en N7.0 migration como `check_notification_cap(user_id, priority)`. Daily 5 max, weekly 15 max, critical bypass silencioso.
- [x] **N7.6** Email canal crítico — **Migración 00038** (`notifications.emailed_at TIMESTAMPTZ` + índice parcial `WHERE emailed_at IS NULL`). Edge function `send-critical-notifications/index.ts`: sin validateAuth (service role), protegida por `CRON_SECRET` header, busca los 3 tipos críticos con `emailed_at IS NULL AND created_at > 24h`, dedup 24h por tipo/proyecto, `serviceClient.auth.admin.getUserById` para email del usuario, send via Resend (`RESEND_API_KEY + NOTIFICATION_FROM_EMAIL + APP_URL` env vars), marca `emailed_at = now()` solo si envío ok. Compatibilidad con scheduler externo (Vercel cron, GitHub Actions, manual). Sin unsubscribe v1. tsc limpio.

---

## CALIBRACIÓN POST-FASE 7 — Gate para FASE 8

> **STATUS: DEFERRED — pending production users**
> **REASON:** Requires real user behavior. Simulation data confirms infrastructure works;
> calibration thresholds (unread < 10%, critical/user/week < 2, noise < 0.6, email 5–60%)
> can only be validated with genuine usage patterns.
> **INFRASTRUCTURE: Ready**
> - Motor de notificaciones: verificado (34 notificaciones en 1 ejecución, 29 críticas)
> - Batch con aislamiento per-step: migración 00047 ✓
> - Dedup y caps activos: ventanas configuradas, bypass crítico funcional ✓
> - G9.7 (viability_resolved espurio): cerrado en migración 00047 ✓
> - Observabilidad: 3 views + snapshot diario pg_cron + baseline 2026-03-12 ✓
>
> **CUANDO LANZAR LA APP:** esta calibración es lo primero a revisar antes de escalar
> usuarios o activar emails masivos. Revisar cada 3–4 días con las views y snapshots.
> No pasar a FASE 8 hasta que los 5 criterios se sostengan con datos reales.
>
> **Bootstrapping disponible:** `SELECT seed_simulation_data('<owner-uuid>');` — crea 20 proyectos
> simulados (5 familias × 4 variaciones) con estados precargados y ejecuta run_notification_batch().
> Limpieza: `DELETE FROM projects WHERE created_by = '<uuid>' AND icon = '🧪';`

### Señales a monitorizar (2 semanas mínimo tras lanzamiento)

| Señal | Query | Umbral de alarma |
|-------|-------|-----------------|
| A — Ruido | `unread / total por tipo` | > 0.6 en cualquier tipo → ajustar dedup window |
| B — Saturación | `COUNT críticas/usuario/semana` | > 3 → revisar caps o dedup |
| C — Email escalation | `emailed / total críticos (14d)` | < 5% = subnotificación · > 60% = ruido o thresholds agresivos · rango sano: 5–60% |

### Criterios de paso a FASE 8
> **BLOQUEADO** — se ejecuta cuando haya usuarios reales. Infraestructura lista, falta validación.

- [!] 2 semanas de datos reales en producción/staging
  > DIFERIDO — requiere usuarios reales. Snapshots diarios corriendo desde 2026-03-12.
- [!] Notificaciones críticas ignoradas (unread) < 10%
  > DIFERIDO — baseline actual: read_ratio=0.0 (datos de seed, sin usuarios reales).
- [!] Críticas por usuario/semana < 2 en media
  > DIFERIDO — verificar con `v_notif_health_per_entity` tras 7 días de uso real.
- [!] Ningún tipo con ratio ruido > 0.6 sin ajuste aplicado
  > DIFERIDO — verificar con `v_notif_health_volume` tras 14 días de uso real.
- [!] Ratio emailed/critical en rango 5–60% (< 5% = subnotificación, > 60% = ruido)
  > DIFERIDO — baseline actual: email_ratio=0.0 (edge function no activa en staging).

### Panel de observación activa (revisar cada 3-4 días)

**Panel 1 — Volumen y ruido** (`read_ratio < 0.4` → ruido · `email_ratio > 0.6` → escalado excesivo)
```sql
SELECT type,
       COUNT(*)                                                                    AS total,
       ROUND(AVG(CASE WHEN read              THEN 1 ELSE 0 END)::numeric, 2)      AS read_ratio,
       ROUND(AVG(CASE WHEN emailed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric, 2) AS email_ratio
FROM notifications
WHERE created_at > NOW() - INTERVAL '14 days'
GROUP BY type
ORDER BY total DESC;
```

**Panel 2 — Saturación por usuario** (>2 críticas/semana por usuario → revisar caps)
```sql
SELECT user_id,
       COUNT(*) FILTER (WHERE priority = 'critical') AS critical_count
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY critical_count DESC;
```

**Panel 3 — Diversidad temprana** (1 canal > 60% del total → señal de convergencia pre-FASE 8)
```sql
SELECT channel_type,
       COUNT(*) AS usage
FROM project_acquisition_channel
GROUP BY channel_type
ORDER BY usage DESC;
```

### Runtime health queries (copiar y ejecutar en Supabase SQL editor)

**Query 1 — Volumen por tipo/severidad/día** (detecta capa desaparecida o explosión de ruido)
```sql
SELECT DATE_TRUNC('day', created_at)::date AS day,
       priority,
       type,
       COUNT(*)                             AS total
FROM   notifications
WHERE  created_at > NOW() - INTERVAL '14 days'
GROUP  BY 1, 2, 3
ORDER  BY 1 DESC, 2, 4 DESC;
```

**Query 2 — Estado de críticas: unread / emailed / read** (salud real del canal)
```sql
SELECT type,
       COUNT(*)                                                                    AS total,
       COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NULL)                    AS unread_not_emailed,
       COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NOT NULL)                AS unread_emailed,
       COUNT(*) FILTER (WHERE read)                                                AS read_count,
       ROUND(AVG(CASE WHEN read THEN 1 ELSE 0 END)::numeric, 2)                  AS read_ratio,
       ROUND(AVG(CASE WHEN emailed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric, 2) AS email_ratio
FROM   notifications
WHERE  priority = 'critical'
  AND  created_at > NOW() - INTERVAL '14 days'
GROUP  BY type
ORDER  BY total DESC;
```

**Query 3 — Notificaciones por usuario y proyecto** (detecta spam, caps rotos, proyectos patológicos)
```sql
SELECT n.user_id,
       (n.metadata->>'project_id')::uuid AS project_id,
       p.nombre                           AS project_name,
       COUNT(*)                           AS total,
       COUNT(*) FILTER (WHERE n.priority = 'critical') AS critical_count
FROM   notifications n
LEFT   JOIN projects p ON p.id = (n.metadata->>'project_id')::uuid
WHERE  n.created_at > NOW() - INTERVAL '7 days'
GROUP  BY 1, 2, 3
ORDER  BY critical_count DESC, total DESC;
```

### Ajustes disponibles sin tocar el motor

- Ventanas de dedup (`p_dedup_days` en `notify_all_project_members`)
- Caps diarios/semanales en `check_notification_cap`
- Thresholds numéricos en `notify_probability_changes` (delta -15, score 20)
- Ventana de email en `send-critical-notifications` (actualmente 24h)

---

## FASE 8 — OPTIMUS (personaje y psicología) 7/13 — ✅ v1 CERRADA (2026-03-12)
> **v1 cerrada. Bloque B completo. Bloque C diferido por datos.**
> Entregables: context packet (00049) · detección 3 bloques inline · 3 modos automáticos ·
> OPTIMUS_CHARACTER.md (carácter + bloques + modos + superficie canónica + matriz 5 escenarios).
> Pendiente v1.1: primary_block + structured active_blocks en context packet (migración cuando haya frontend).
>
> Gate de calibración post-Fase 7: DIFERIDO (infraestructura lista, pendiente usuarios reales).
> Cuando la app tenga usuarios, activar el gate antes de escalar notificaciones.
>
> **Decisiones de arquitectura cerradas (2026-03-12):**
>
> **A1 — Arquitectura de blocks: Option A (mapeo, sin tabla nueva)**
> Optimus es una capa interpretativa del engine, no un motor paralelo.
> Lee phase_state + risk + viability + coverage + strategic_blocks en tiempo real y deriva el bloque.
> Flujo: Engine state → Optimus interpretation layer → Block detected → Recommendation.
> Sin `project_block_state` table — evita desincronización entre dos sistemas de estado.
>
> **A2 — Señal de clarity_block: proxy operacional**
> `clarity_block = phase=1 AND phase_score<35 AND coverage.demand='none'`
> Interpretación: proyecto en fase idea, sin señal de demanda, score bajo = "idea no está clara".
> Mejorable en v2 con campos `problem_defined`, `icp_defined`, `hypothesis_tested` si se crean.
>
> **A3 — Modos de Optimus: derivados automáticamente del engine (no elección del usuario)**
> `Exploración`: phase=1 AND phase_score<50 AND viability_status!='critical'
> `Estándar`: phase>=2 AND viability_status!='critical' AND risk_level!='critical'
> `Estricto`: viability_status='critical' OR risk_level='critical' OR phase_regressed=true
>
> **A4 — División de trabajo getNextAction ↔ Optimus (constraint inamovible)**
> `getNextAction()` → QUÉ hacer (táctica: próximo step, CTA). Ya implementado.
> `Optimus` → POR QUÉ + coaching + contexto de bloque + framing por modo. Nuevo.
> Nunca ambos generando recomendaciones independientes — crea conflicto de señales.
>
> **Inputs de riesgo pre-implementación (inamovibles):**
> - **Riesgo Goodhart (G4.7):** `signal_integrity` flag cuando `phase_score ↑ ≥15pts AND mrr unchanged AND viability unchanged` en 30d.
> - **Riesgo convergencia sistémica:** `getNextAction()` no persiste output → imposible detectar homogeneización. FASE 8 debe incluir `engine_recommendations` table. Señal: entropía de next_action cuando ≥30 proyectos activos.
> - **Bucle autorreferencial:** cruzar siempre outcome_metrics vs process_metrics. No solo histórico de acciones.
> - **Riesgo dataset collapse (≥100 proyectos):** contraejemplos desaparecen. Los tres riesgos son secuenciales.
> - **Schema de respuesta (constraint inamovible):** `{ primary: { action, reason, signal_basis, invalidation_condition, confidence }, alternative: { action, reason, confidence } | null }`. Nunca acción sola.
> - **Tracking de outcome (prerequisito P8.12):** `{ recommendation_id, outcome: accept|modify|reject, user_reasoning? }`. Los modify/reject son los contrafactuales más valiosos.
> - **Regla incertidumbre explícita:** si confidence=low, Optimus lo dice. Nunca ocultar señal débil.
>
> **6 tareas diferidas** (P8.6, P8.7, P8.8, P8.12 — datos post-lanzamiento; P8.9 — block_weeks_active; P8.11 — señal SWOT no estructurada).

### Bloque B — Implementación inmediata (datos existentes disponibles)
> Orden de ejecución: P8.2 primero (los detectores dependen del context packet estable).

- [x] **P8.2** Context packet — migración 00049. `get_optimus_context(project_id, user_id?)→JSONB`. 22 campos: phase(6)+viability(3)+risk(2)+probability(3)+coverage(3)+economic_profile(4)+operational(3)+blocks+mode+history(2). Block detection inline (Option A). Mode derivado del engine (Option A3). STABLE+SECURITY DEFINER. Verificado: estricto para viability=critical, estandar para healthy fase 3.
  > **v1.1 (anotado, no urgente):** dos cambios al context packet:
  > 1. Añadir `primary_block` — campo derivado con el bloque de mayor precedencia (`structural > clarity > traction`). Sin este campo, la precedencia es solo una regla de prompt. Con él es machine-readable y Optimus no puede confundirse cuando hay múltiples bloques activos.
  > 2. Cambiar `active_blocks: ["traction_block"]` a `active_blocks: [{ type, signal }]` para que `signal_basis` sea directamente extraíble. Migración de get_optimus_context cuando existan datos reales que validen cuáles señales son más diagnósticas.
- [x] **P8.4** Detección de traction_block v1 — lógica en `get_optimus_context.active_blocks`. `coverage.demand<='basic' OR acquisition_channels=none`. Consumible por Optimus como reason/signal_basis. UI: diferida (v2 solo si demuestra valor — badge/banner/tarjeta separados duplicarían getNextAction+notificaciones).
- [x] **P8.5** Detección de structural_block v1 — lógica en `get_optimus_context.active_blocks`. `t2_cash_flow_active OR strategic_blocks(function_no_owner|execution_drop) activos`. UI: diferida (mismo criterio que P8.4).
- [x] **P8.3** Detección de clarity_block v1 — proxy operacional en `get_optimus_context.active_blocks`. `phase=1 AND phase_score<35 AND demand='none'`. El más débil conceptualmente; v2 mejora con campos problem_defined/icp_defined. UI: diferida.
- [x] **P8.10** Los 3 Modos de Optimus v1 — derivación en `get_optimus_context.optimus_mode`. Reglas A3: estricto/estandar/exploracion. Verificado: viability=critical→estricto, healthy fase 3→estandar. Efecto sobre tono en OPTIMUS_CHARACTER.md (P8.1).
- [!] **P8.9** Escalada de bloqueo — semana 1 suave → semana 3 Modo Desbloqueo.
  > DIFERIDO — requiere `block_weeks_active` en el context packet. traction_block y clarity_block son estados derivados sin timestamp de inicio; solo structural_block tiene `first_detected_at` via strategic_blocks. Sin semanas activas por bloque la escalada no es fiable. Primer paso cuando haya datos reales: añadir `MIN(first_detected_at)` de strategic_blocks activos al packet.
- [!] **P8.11** Conectar SWOT/Competitors → structural_block.
  > DIFERIDO — schema verificado (2026-03-12): tablas `competitive_analysis` (swot JSONB generado por AI) y `competitor_snapshots` (changes_detected JSONB, alert_sent BOOL) existen pero no producen señal binaria de bloqueo estructural. Datos no estructurados sin scoring numérico extraíble. Integrar requeriría capa de scoring sobre SWOT que no existe en v1.
- [x] **P8.1** Crear `OPTIMUS_CHARACTER.md` — v1.0 en raíz del proyecto. Carácter, tono por modo (Exploración/Estándar/Estricto), 4 bloques + ejemplos por bloque, schema de respuesta inamovible, qué NO hace, tabla de riesgos sistémicos. T9.1 en FASE 9 eliminado (duplicado).

- [x] **P8.13** Definir superficie canónica de Optimus v1 — spec aprobada 2026-03-12, registrada en `OPTIMUS_CHARACTER.md §9`. Única superficie: `ProjectEnginePanel` debajo de Next Action. 3 estados UI (Normal/Sin datos/Error). `primary.action` ligado a `getNextAction()` output. Prohibición de superficies paralelas hasta v2. Decisión pendiente antes de implementar: si Optimus reemplaza o convive con `CostOfIgnoring` + `UnlockModeCard`.

### Bloque C — Post-lanzamiento (requieren datos acumulados)

- [!] **P8.6** Detección de behavioral_block (patrón de evitación)
  > DIFERIDO — requiere 3+ semanas de `decision_events` con comportamiento real.
  > Sin historial de decisiones no hay patrón detectable.
- [!] **P8.7** Detección de exceso de optimismo (proyecciones > resultados sistemáticamente)
  > DIFERIDO — requiere 4+ semanas de datos financieros reales vs proyecciones.
- [!] **P8.8** Detección de exceso de conservadurismo (score alto, retrasa avance)
  > DIFERIDO — requiere 4+ semanas de `decision_events` con outcomes.
- [!] **P8.12** Decision Accuracy Index (interno, nunca mostrado al usuario)
  > DIFERIDO — última tarea de la fase. Prerequisito: tabla `engine_recommendations` +
  > flujo completo: engine recommendation → user decision → outcome → accuracy.
  > Sin estos pasos DAI mide compliance, no calidad de decisión.

---

## FASE 9 — CONTENIDO Y PLAYBOOKS ✅ 8/8 CERRADA (2026-03-12)
> Arranca 2026-03-12. Orden: T9.4 primero (aterriza vocabulario del motor), T9.6 segundo
> (prompts Optimus usando ese vocabulario + primary_block como decisión ya tomada),
> luego playbooks y contenido complementario.
> Sin dependencias técnicas — trabajo de diseño puro.
>
> **Entregables:** MICROCOPY_SYSTEM.md · OPTIMUS_PROMPTS.md · BUILD_PLAYBOOKS.md ·
> RESCUE_PLAYBOOKS.md · STRATEGIC_RESET_RITUAL.md · BENCHMARKS_V1.md · DISCOVERY_PATH.md
> **Artefacto extra al cierre:** SYSTEM_OVERVIEW.md — mapa de dependencias entre artefactos
> + runtime layer + tabla de change impact. Generado al cerrar FASE 9.

- [x] **T9.1** ~~Crear OPTIMUS_CHARACTER.md~~ — eliminado, completado como P8.1 en FASE 8.
- [x] **T9.2** Escribir 5 playbooks de Build Mode — `BUILD_PLAYBOOKS.md` v1.0. 5 playbooks: Problem Discovery · Problem Validation · Solution Prototype · Early Traction · Early Growth. Estructura uniforme: Trigger/Context/Objective/Steps/Success Signal/Failure Signal/Common Mistakes/Next Move. Todos los triggers mapeados a campos de `get_optimus_context()`. Failure signals del engine (demand_coverage, delivery_coverage, acquisition_channels_count, probability_trend). Encadenamiento completo en sección final.
- [x] **T9.3** Escribir 5 playbooks de Rescue Mode — `RESCUE_PLAYBOOKS.md` v1.0. 5 playbooks: Cash Survival · Traction Recovery · Structural Fix · Project Reset · Focus Recovery. Triggers mapeados a viability, risk_level, traction_block, structural_block, phase_regressed, probability_trend. Failure signals del engine con tiempo explícito. Next Moves redirigidos a playbooks existentes (sin referencias huecas). Nota de behavioral_block como señal de entrada al failure de Focus Recovery.
- [x] **T9.4** Microcopy para todos los estados del motor — `MICROCOPY_SYSTEM.md` v1.0. 70 state_ids en 10 dominios: Phase(14) · Viability(6) · Risk(5) · Probability(9) · Coverage(9) · Empty states(5) · Optimus surface(6) · Blocks(4) · Stagnation(3) · Sistema(3). 3 reglas de consistencia fijadas (estado→implicación, sin jerga interna, tono proporcional). Índice completo al final. Segundo pase pendiente para ~20% de estados omitidos.
- [x] **T9.5** Las 5 preguntas del Strategic Reset Ritual — `STRATEGIC_RESET_RITUAL.md` v1.0. 5 preguntas orientadas a decisión (no reflexión): evidencia real mejorada, hipótesis debilitada, cuello único, qué parar, apuesta única con success_signal + invalidación. Output schema 7 campos → `strategic_cycles.ritual_responses`. Dos vías de trigger: regular (4 semanas) + urgencia (Rescue Mode Playbooks 4 y 5). Notas de implementación para FASE 10.
- [x] **T9.6** Prompts de Optimus — `OPTIMUS_PROMPTS.md` v1.0. Base template (input schema explícito + system prompt + reasoning guide + output schema + guardrails) + 7 CASE templates especializados: CASE-01 exploración+clarity, CASE-02 exploración+traction, CASE-03 estándar+traction, CASE-04 estándar+structural, CASE-05 estándar+stagnation, CASE-06 estricto+cash, CASE-07 estricto+viability_critical. Vocabulario anclado a MICROCOPY_SYSTEM.md. Checklist de aceptación contra §10 de OPTIMUS_CHARACTER.md al final.
- [x] **T9.7** Construir benchmarks v1 — `BENCHMARKS_V1.md` v1.0. Dos partes: (1) Financial benchmarks → tabla `benchmarks`: 6 métrics × 6 model_types con p25/p50/p75, confidence scores 40–65, SQL seed listo. (2) Process benchmarks → referencia Optimus por fase (no DB): Phase 1–4 con rangos low/expected/strong. Fix activo G4.3: SQL seed Prioridad 1 (`crecimiento_p50` × `unknown`) resuelve NULL en Viability T3. Confidence scores v1 = 50–65; ticket_medio y cac_estimado con confidence=40 hasta datos internos.
- [x] **T9.8** Content para Discovery Path — `DISCOVERY_PATH.md` v1.0. 3 artefactos operativos: (1) Interview Template: 6 secciones + red flags, preguntas sobre comportamiento pasado. (2) Persona Canvas: 7 campos basados en evidencia, umbrales de validación 3/5 entrevistas mapeados a demand_coverage. (3) 7-Day Guide: sprint de descubrimiento con output esperado y failure signal por día, tabla de decisión Día 7 → demand_coverage, conexión con engine. Tono de herramienta de ejecución, no de curso.

---

## FASE 10 — STRATEGIC RESET RITUAL Y CICLOS ✅ 5/5
> Cerrada: 2026-03-12. Migraciones 00050, 00051, 00052. OPTIMUS_PROMPTS.md §8.
> Requiere Fase 4 + Fase 8 + Fase 9.
>
> **Auditoría de runtime 2026-03-12:** `strategic_cycles.closed_at` nunca se escribe (sin función
> de cierre de ciclo). `ritual_responses` siempre NULL. No existe cron ni función para rollover
> ciclo N→N+1. `fn_initialize_project_data` crea solo ciclo 1. Weekly Loop no existe como
> orquestador unificado. Ver SYSTEM_OVERVIEW.md §Gaps para detalle completo.

- [x] **R10.1** Strategic Reset Ritual (trigger cada 4 semanas) — migración `00051`. Trigger automático implementado vía: (1) `submit_strategic_reset()` para cierre inmediato cuando el founder completa el ritual. (2) `run_strategic_cycle_checks()` cron lunes 08:00 para auto-cierre: safety net (ritual done pero ciclo abierto) + auto-cierre sin ritual tras 7 días de grace period.
- [x] **R10.2** Las 5 preguntas del ritual con Optimus — migración `00052` + `OPTIMUS_PROMPTS.md §8`. `get_ritual_optimus_context(project_id, next_action)` ensambla bundle completo: cycle_evaluation, ritual_responses, engine_at_open, engine_at_close (snapshot del ciclo N+1), next_action (parámetro del frontend desde getNextAction()). Template §8: input schema 6 campos, system prompt retrospectivo+prospectivo, reasoning guide con cycle delta, output schema 9 campos (cycle_evaluation, summary, main_learning, key_bottleneck, recommended_action, next_bet, success_signal, invalidation_condition, confidence), guardrails (recommended_action = next_action, Q5 validados no ecoados, key_bottleneck de engine_at_close, tono por evaluación). Sin persistencia — storage Opción A diferida a FASE 11.
- [x] **R10.3** Evaluación del ciclo (🟢 Sólido / 🟠 Inestable / 🔴 Crítico) — migración `00050`. `cycle_evaluation TEXT CHECK IN ('progress','stagnation','regression')`. Lógica en `close_strategic_cycle()`: regression si viability=critical OR phase_regressed; progress si phase_score subió AND probability_trend=growing (AND estricto, v1); stagnation en resto.
- [x] **R10.4** Registro en `strategic_cycles` al completar cada ritual — migración `00050`. `submit_strategic_reset()` + `close_strategic_cycle()`. Valida 7 campos del schema del ritual. Guard anti-doble-disparo. Auth check.
- [x] **R10.5** Coordinar Weekly Loop vs Ritual (semana 4 = ritual reemplaza loop) — migración `00051`. `generate_all_weekly_reviews()` modificada: skip proyectos en semana 4 (últimos 7 días del ciclo, `CURRENT_DATE >= end_date - 6`). Cron Sunday 23:30 inalterado. Nuevo cron Monday 08:00 → `run_strategic_cycle_checks()`.

---

## FASE 11 — FEATURES POR FASE Y MODO ✅ 10/10
> Requiere Fase 4 + Fase 5.
> S11.1 y S11.2 son prerequisito de V11.1 — definen la estructura antes de clasificar.
> V11.0 es prerequisito de V11.3 — afecta navegación y visibilidad.

### Bloque S — Superficies (prerequisito)

- [x] **S11.1** Definir superficies v1 — `SURFACES_V1.md` v1.2. 4 superficies: Engine (estado continuo), Weekly Review (semanas 1–3), Strategic Reset Ritual (semana 4), Cycle History (memoria histórica). 4 System Rules: 1 action authority, 1 surface = 1 time context, ritual ends in decision, Optimus rendering contract (no alternative, no confidence). Tabla de asignación feature → superficie. Change impact table. Re-entry navigation order (V11.0). Navigation model completo (system-driven states, prioridad, re-entry prepend).
- [x] **S11.2** Mapear componentes actuales a sus superficies — tabla de implementación por superficie en `SURFACES_V1.md`: qué está implementado (✅) vs. qué falta construir (❌ Pendiente FASE 11). Input completo para V11.1.

### Bloque V — Features y visibilidad

- [x] **V11.1** Auditar features actuales y clasificar cada una (fase / mode / viability state) — audit completo: 32 features, 4 superficies + capa nav. Violaciones de Rule detectadas: WeeklyReviewCard en contexto incorrecto (Rule 2). Gap confirmado: Next Action sin cobertura Phase 4. Ver `feature_matrix.md`.
- [x] **V11.2** Crear `feature_matrix.md` — v1.0 creado 2026-03-12. 32 features clasificadas por superficie/fase/modo/viabilidad. Resumen: 14 implementadas, 12 pendientes, 6 diferidas. Tabla de violaciones de reglas. Tabla de gaps de cobertura.
- [x] **V11.0** Re-entry summary layer (absence > 7d) — `src/lib/reentry.ts`: payload derivado puro (computeReentryPayload, computeChanges, computeUrgencies, deriveHeadline, deriveSummary) + UI labels (CHANGE_LABELS, PHASE_LABEL, VIABILITY_LABEL, TREND_LABEL, BLOCK_LABEL). `ReentrySurface.tsx` full UI: header (headline + días fuera), resumen (2 frases), estado actual (4 tiles), cambios detectados (max 4, CHANGE_PRIORITY), urgencias activas (max 3, badges crítico/alto/medio), CTA "Ver estado actual". `useStrategicCyclesWhileAway` hook. ProjectPage: `lastSeenAt` destructurado de useActiveSurface + pasado como prop. tsc limpio. Fix: viabilityStatus enum real ('monitoring'|'stagnation') vs spec ('at_risk').
- [x] **V11.3** Implementar sistema de visibilidad de features en frontend — navegación de superficies v1: surface selection algorithm (`useActiveSurface`), `WeeklySurface` full page, `ResetSurface` stub, `ReentrySurface` stub. WeeklyReviewCard eliminada de ProjectDashboardTab (Rule 2 fix). Migration 00055 (`weekly_reviews.read_at`). `useMarkWeeklyReviewRead`, `useUpdateLastSeenAt` mutations. `capturedReentry` pattern para isReentry estable durante sesión. tsc limpio.
- [x] **V11.4** Implementar teaser UX para features bloqueadas por fase — `src/lib/teasers.ts` (getFeatureTeasers, max 2, priority order), `FeatureTeaserCard.tsx`, `FeatureTeasersPanel.tsx`. Hook `useClosedCyclesCount` añadido a useNovaDataOptimized. Placement en sidebar de ProjectDashboardTab debajo de PlanLimitsIndicator. tsc limpio.
- [x] **V11.5** Revisar módulo Analytics: separar lo que engines calculan de lo que es propio — `ANALYTICS_AUDIT.md` producido. 3 fixes: ActivityHeatmap label ("evidencias registradas"), TemporalEvolutionChart casing bug (LP→lp/BP→bp/CP→cp), PredictionsWidget (at_risk/behind → below_pace/off_track; hardcoded 9 → teamSize dinámico). Confirmado: ningún panel de Analytics redefine estado del engine.
- [x] **V11.6** Implementar Function Coverage v1 (manual + penalización simple) — expone infraestructura existente (`run_coverage_engine()`). Hook `useProjectFunctions` (function_type + hasOwner boolean). ProjectEnginePanel: dot indicador por función (verde/gris), badge "Brecha estructural" cuando coverage_level=none. tsc limpio.
- [x] **V11.7** Instrumentación de producto mínima — `posthog-js` instalado. `src/lib/analytics.ts`: 8 funciones tipadas (trackProjectCreated, trackOnboardingStarted, trackOnboardingCompleted, trackEngineViewed, trackNextActionClicked, trackRitualCompleted, trackReentry). PostHog init condicional en `main.tsx` (no-op sin VITE_POSTHOG_KEY). Disparadores: project_created en 3 puntos de creación (CreateFirstProjectPage, SelectOnboardingTypePage, CreateProjectDialog); onboarding_started/completed en FastStartWizard; engine_viewed (con useRef anti-doble-fire) + next_action_clicked en ProjectEnginePanel; ritual_completed en ResetSurface tras submitRitual; reentry en ProjectPage useEffect cuando capturedReentry=true. tsc limpio. Nota: Sentry ya estaba instalado, pendiente de VITE_SENTRY_DSN real en .env.local.

---

## FASE 12 — SISTEMAS AVANZADOS 0/8
> Post-MVP. No bloquea el lanzamiento.

- [ ] **A12.1** Project history / timeline (fases + pivotes + decisiones + hitos)
- [ ] **A12.2** Múltiples proyectos (límites por plan, dashboard resumen)
- [ ] **A12.3** Proyecto pausado (preservar datos, engines pausados)
- [ ] **A12.4** Proyecto archivado (cerrar definitivo, no borrar)
- [ ] **A12.5** Member deletion y redistribución de tareas/OBVs
- [ ] **A12.6** Project graduation state (éxito sostenido 12+ semanas)
- [ ] **A12.7** Iteration Velocity tracking en Weekly Digest
- [ ] **A12.8** Integración Slack mejorada (Layer 2 y 4 → canales del equipo)

---

## FASE 13 — EDGE CASES 8/10 🔄 EN CURSO
> Diseñar respuesta del sistema antes de lanzar.
> Mapa completo auditado 2026-03-13. Ver detalle por caso abajo.

- [x] **EC13.1** Usuario no completa / interrumpe el ritual — 3 sub-casos cerrados:
  - EC13.1a (abandono form): **Regla** — estado en `useState`, aceptable en v1, ritual diseñado para sesión única.
  - EC13.1b (fallo parcial SQL): **Cerrado como inexistente** — función sin EXCEPTION WHEN OTHERS ni COMMIT explícito; fallo en `close_strategic_cycle()` hace rollback completo de la transacción. Estado roto imposible.
  - EC13.1c (Optimus timeout): **Código** — `AbortSignal.timeout(30_000)` en `functions.invoke`. Spinner ya no cuelga indefinidamente.
  - EC13.1d (doble submit multi-tab): **Código** — catch del mensaje "No cycle available" + banner "El ritual ya fue completado en otra sesión" + botón "Ir al nuevo ciclo". Sin error crudo.
- [x] **EC13.2** Onboarding incompleto (Fase A sin Fase B — sistema funciona parcialmente) — **Regla**: engine arranca en `inactive/insufficient_data/friction`, ProjectEnginePanel muestra placeholders sin crash. No bloquear al usuario.
- [x] **EC13.3** Datos inconsistentes en onboarding (guardar + marcar + Optimus pregunta) — **Regla**: mismo comportamiento que EC13.2. Engine graceful con datos parciales.
- [x] **EC13.4** Cambio radical de modelo de negocio (pivot total) — **Código**: migración 00055 añade `close_reason='pivot'` al constraint + `close_cycle_for_pivot()` SECURITY DEFINER. Hook `useCloseCycleForPivot`. StrategyEditor detecta pivot total (3/3 campos cambian desde hipótesis completa ≥10 chars) y muestra prompt inline "Cerrar ciclo actual / Mantener ciclo". No automático — decisión del founder.
- [!] **EC13.5** Miembro que nunca acepta invitación (expirar en 30 días)
  > DIFERIDO — No hay sistema de invitaciones real en v1: el wizard añade directamente a `project_members` si el email existe (InviteMemberWizard.tsx). FASE 7 lo implementa.
- [x] **EC13.6** Solo founder en Fase 4 — **Código**: `created_by` añadido a `Project` type; `useProjectFunctions` expone `owner_user_id`; `FunctionDelegationHint.tsx` muestra techo de 92.5% en sidebar cuando `phase=4 && delegatedCount<2`. O4.2 criterio diferente (ajuste de pesos para solo founder) → **diferido a v1.1** (requiere migración SQL + calibración; spec no define fórmula exacta).
- [x] **EC13.7** Day 1 Probability demotivante — **Código**: `low_confidence` status ya no muestra número en header (EngineIndicators) ni en breakdown (ProbabilityBreakdown). Ambos muestran estado "construyendo" hasta que `probability_status = 'active'`. Implementado en `ProbabilityBreakdown.tsx` + `EngineIndicators.tsx`.
- [x] **EC13.8** Proyecto sin actividad 60 días — **Código (frontend)**: `TriggerReason` ampliado con `inactive_60d`; `triggerReason()` detecta ≥60 días; `deriveHeadline()` cubre el caso; ReentrySurface muestra banner "Riesgo de abandono" con framing de severidad mayor.
  > **SUB-TAREA DIFERIDA — Email sequence**: secuencia de re-engagement por email requiere pg_cron + SMTP + tabla de tracking de envíos (anti-spam). No hay infraestructura de email en el proyecto. Implementar cuando se configure el sistema de email (FASE 15+).
- [!] **EC13.9** Datos de revenue no verificables (peso reducido × 0.7 sin evidencia)
  > DIFERIDO — El peso 0.7 no está implementado en probability_engine (migration 00007). El engine usa `key_metrics.mrr` directamente sin distinción verificado/no verificado. Era intención de spec, no implementación. No rompe nada; dejar para v1.1.
- [x] **EC13.10** Conflicto de ownership de OBV (split 50/50, historial preservado) — **Código**: migración 000056 añade `upsert_obv_participants()` SECURITY DEFINER (DELETE+INSERT atómico). Hook `useUpsertOBVParticipants`. `ProjectOBVsTab` muestra participantes existentes y permite al owner editar el reparto inline. `owner_id` de la tabla `obvs` nunca cambia (historial preservado).

---

## FASE 14 — MONETIZACIÓN 0/5
> Solo cuando el producto está validado con usuarios reales.

- [ ] **M14.1** Definir tiers de plan (Free / Pro / Business con límites por feature)
- [ ] **M14.2** Implementar plan limits enforcement en backend
- [ ] **M14.3** Activar ENABLE_PAYMENTS = true + configurar Stripe
- [ ] **M14.4** Upgrade hints en momentos de valor percibido
- [ ] **M14.5** Onboarding a planes (después del onboarding A, no durante)

---

## FASE 15 — INTEGRACIONES, HIDRATACIÓN Y AGENTES EXTERNOS 114/181
> Convierte Optimus en la capa de inteligencia sobre herramientas externas.
> Principio central: herramientas externas = datos operativos · Optimus = interpretación estratégica.
> Las integraciones no son plugins — son fuentes de datos que alimentan el sistema operativo del founder.
>
> **Prerequisito: FASE 14 (monetización) iniciada + producto validado con usuarios reales.**
> BLOQUE 0 y BLOQUE A pueden hacerse antes — son solo lectura, audit y documentación, sin código.
>
> **Código preexistente roto (inventariado en I15.0.10):**
> - `StripeIntegration.tsx` + `sync-stripe`: tablas `financial_integrations`, `synced_transactions`, `subscription_metrics` no existen. Usa mock data. No llama a la API real de Stripe.
> - `HoldedIntegration.tsx` + `auto-sync-finances`: mismas tablas ausentes, switch de providers incompleto.
> - `SlackIntegration.tsx` + `send-slack-notification`: `slack_webhooks` existe pero sin columnas `notification_types`, `last_used_at` que el componente lee. Falla en runtime.
> - `google-analytics-sync`: OAuth flow diseñado pero sin tabla para persistir tokens. Cada sesión pierde las credenciales.
> - HubSpot, Asana, Trello, Google Calendar: no existe nada en el repo.
>
> **Orden de ejecución correcto:**
> Bloque 0 (saneamiento) → Bloque A + A2 (auditoría motor + módulos) → Bloque G0 (contrato canónico de agentes) → Bloque B (arquitectura base) → Bloque C–D (normalización + hidratación) → Bloque E–F (UX progresiva) → 1 provider real bien hecho → 1 agente real bien hecho → generalizar

### BLOQUE 0 — Saneamiento de integraciones existentes
> Empieza aquí. No se construye nada hasta que el código existente esté limpio o retirado.
> Fallar en este bloque contamina toda la fase.

- [x] **I15.0.1** Auditar todas las integraciones/stubs existentes y clasificar cada una: reutilizable / rescatable / eliminar
  > Auditoría completa 2026-03-15. Resultados en `INTEGRATION_INVENTORY.md`. Stripe: reescribir. Holded: reescribir. Slack: rescatar (schema fix). GA: borrar. Content Calendar: conservar (no es integración externa).
- [x] **I15.0.2** Desactivar cualquier entrypoint de UI que hoy rompa en runtime
  > **CERRADO 2026-03-17:** `IntegrationsPreviewModal` eliminado de `IntegrationsView.tsx` — import borrado, estado `showPreviewModal` eliminado, bloque JSX removido. El modal mostraba 12 integraciones mock (Slack, HubSpot, Salesforce, etc.) como si fueran reales/conectables.
- [x] **I15.0.3** Ocultar la sección Integraciones al usuario hasta que exista arquitectura funcional mínima
  > **CERRADO 2026-03-17:** Ruta `/integrations` desactivada en `Index.tsx` — lazy import y `<Route>` comentados con nota `I15.0.3`. La URL simplemente no matchea y React Router la ignora. Reactivar cuando existan al menos 2 integraciones funcionales.
- [x] **I15.0.4** Eliminar o aislar dependencias a tablas inexistentes (`financial_integrations`, `synced_transactions`, `subscription_metrics`)
  > **CERRADO 2026-03-17:** `HoldedIntegration.tsx` aislado — `import supabase` comentado, `handleConnect`/`handleSync`/`handleDisconnect` reemplazados por toast "no disponible". El componente renderiza sin crash y mantiene la estructura visual como referencia UX para la futura reescritura (mismo patrón que StripeIntegration).
- [x] **I15.0.5** Eliminar mock data engañosa en integraciones visibles (`sync-stripe` genera transacciones ficticias)
  > **CERRADO 2026-03-17:** `sync-stripe` completamente reescrita. Ya NO genera mock data — llama a la API real de Stripe, importa suscripciones activas reales, calcula MRR real y lo escribe en `key_metrics` via `write_integration_to_engine_table()`. Verificado: sync completado con `ok:true, write_status:written`.
- [x] **I15.0.6** Corregir schema defectuoso de `slack_webhooks` o retirar el componente temporalmente
  > **CERRADO 2026-03-17:** Schema de `slack_webhooks` corregido via Management API — `is_active` renombrado a `enabled`, añadidos `notification_types TEXT[] DEFAULT ARRAY[]::TEXT[]`, `last_used_at TIMESTAMPTZ`, `created_by UUID`. Verificado con `information_schema.columns`. Migración local: `20260317000001_bloque0_slack_webhooks_fix.sql`.
- [x] **I15.0.7** Marcar `StripeIntegration` y `HoldedIntegration` como `legacy_stub` hasta que existan tablas reales
  > **CERRADO 2026-03-17 — DECISIÓN CAMBIADA:** `StripeIntegration` ya NO es un stub — es funcional. El plan de "marcar como legacy" quedó obsoleto. `HoldedIntegration` sigue pendiente como stub.
- [x] **I15.0.8** Auditar edge functions existentes y decidir por cada una: conservar / reescribir / borrar
  > `sync-stripe` → reescribir · `auto-sync-finances` → reescribir · `send-slack-notification` → rescatar · `google-analytics-sync` → borrar · `generate-content-calendar` → conservar (no integración externa). Ver `INTEGRATION_INVENTORY.md §10`.
- [x] **I15.0.9** Cerrar exposición de credenciales en texto plano (api_key sin cifrar en stubs existentes)
  > **CERRADO 2026-03-17:** `integration_credentials` con cifrado `pgp_sym_encrypt` (pgcrypto) + encoding 'escape'. RPCs `upsert_integration_credential` y `decrypt_integration_credential` verificadas en producción. API Key de Stripe almacenada cifrada y descifrada correctamente. Nunca en texto plano.
- [x] **I15.0.10** Documentar inventario real de integraciones presentes en el código (estado, riesgo, decisión)
  > `INTEGRATION_INVENTORY.md` creado 2026-03-15. Cubre todos los archivos UI, edge functions, schema mismatches, mock data, credenciales y plan de ejecución.

### BLOQUE 0-FIX — Hotfixes de implementación Stripe (2026-03-16/17)
> Bugs no previstos en el plan original encontrados durante la implementación real del flujo connect→sync.
> Todos cerrados. Documentados aquí para trazabilidad y como referencia para HoldedIntegration y otras.

- [x] **I15.FIX.1** StripeIntegration se redirigía a `/auth` al pulsar "Conectar Stripe"
  > **CAUSA:** `supabase.functions.invoke` usa `fetchWithAuth` internamente → si el token está cerca de expirar llama a `_callRefreshToken()` → si falla → `_removeSession()` → evento `SIGNED_OUT` → redirect. **FIX:** sustituir `supabase.functions.invoke` por `fetch` nativo con `Authorization: Bearer ${access_token}` + header `apikey` (requerido por CDN de Supabase). Añadir helper `getFreshSession()` con Promise.race entre `getSession()` y timeout 2s para evitar race entre session stale y lock de GoTrueClient. `StripeIntegration.tsx`.

- [x] **I15.FIX.2** HTTP 401 "Invalid JWT" en `connect-stripe` y `sync-stripe`
  > **CAUSA:** este proyecto usa ES256 (ECDSA asimétrico) para tokens de usuario. El gateway de Supabase con `verify_jwt: true` (default) intenta verificar con el JWT secret HS256 del proyecto → mismatch de algoritmo → rechazo. Token confirmado via log: prefijo `eyJhbGciOiJFUzI1NiI` (ES256). **FIX:** `PATCH /v1/projects/{ref}/functions/{slug}` con `{"verify_jwt": false}` via Management API en ambas funciones. La auth queda en `validateAuth()` → `supabase.auth.getUser()` (valida server-side, agnóstico al algoritmo). Aplicado a `connect-stripe` y `sync-stripe`.

- [x] **I15.FIX.3** `getSession()` en `handleConnect` colgaba indefinidamente
  > **CAUSA:** GoTrueClient v2.93.x usa `_acquireLock` → `pendingInLock` sin timeout en modo fallback. El segundo evento `SIGNED_IN` dispara `fetchProfile()` en `AuthContext`, que hace una query a Supabase → `fetchWithAuth` → `getSession()` → adquiere el lock. Si el usuario pulsa el botón mientras `fetchProfile` corre, el `getSession()` de `handleConnect` queda en cola indefinida. **FIX:** `session` del contexto `useAuth()` + `getFreshSession()` con race/timeout 2s. `StripeIntegration.tsx`.

- [x] **I15.FIX.4** Pantalla en blanco si `fetchProfile` falla + `AbortError` crasheaba el auth
  > **CAUSA:** (1) `RootRedirect` bloqueaba en `isAuthenticated && !profile` — si `fetchProfile` falla, `profile` queda `null` para siempre → spinner infinito. (2) El `getSession()` paralelo en `AuthContext` no tenía `.catch()` → `AbortError` hacía que `loading` se quedara `true` para siempre. **FIX:** añadir estado `profileLoading: boolean` a `AuthContext` (tiene fin definido, a diferencia de `profile`); `RootRedirect` espera `profileLoading`; añadir `.catch()` con fallback `resolveLoading()`. `AuthContext.tsx` + `RootRedirect.tsx`.

- [x] **I15.FIX.5** RPC `upsert_integration_credential` fallaba con HTTP 500
  > **CAUSA:** `pgcrypto` instalado en schema `extensions` (estándar Supabase), no en `public`. La función PL/pgSQL no encontraba `pgp_sym_encrypt` en el search_path por defecto (`public`). **FIX:** `CREATE OR REPLACE FUNCTION ... SET search_path = public, extensions`. Verificado con roundtrip encrypt→decode→decrypt. Aplicado via Management API.

- [ ] **I15.FIX.7** `verify_jwt` revierte a `true` en cada redeploy de edge functions
  > **CAUSA:** Supabase no persiste la configuración `verify_jwt: false` en el repositorio — es metadata del proyecto en la plataforma. Cada deploy (`supabase functions deploy`) resetea el valor al default (`true`). Este proyecto usa ES256, incompatible con la verificación HS256 del gateway, así que cualquier redeploy rompe la auth silenciosamente hasta que se re-aplique el PATCH.
  > **FIX pendiente:** dos opciones — (A) añadir script `scripts/post-deploy.sh` que ejecute los dos `curl PATCH` automáticamente y documentarlo en README como paso obligatorio post-deploy; (B) configurar `supabase/config.toml` con `[functions.sync-stripe] verify_jwt = false` si la versión de CLI lo soporta. Verificar opción B primero (sin deuda de script). Funciones afectadas: `sync-stripe`, `connect-stripe`.

- [x] **I15.FIX.6** RPC `decrypt_integration_credential` fallaba con "convert_from(text, unknown) does not exist"
  > **CAUSA:** (1) mismo problema de `search_path` que FIX.5. (2) `pgp_sym_decrypt` ya devuelve `text` directamente — el `convert_from(result, 'UTF8')` era incorrecto porque `convert_from` espera `bytea` como primer argumento, pero recibía el `text` que devuelve `pgp_sym_decrypt`. **FIX:** `SET search_path = public, extensions` + eliminar `convert_from` wrapper. La función devuelve `pgp_sym_decrypt(decode(credential_enc, 'escape'), p_app_secret)` directamente. Verificado en producción: sync completado con `ok:true`.

### BLOQUE A — Auditoría de compatibilidad con el motor
> Sin esto el sistema se rompe. Hacerlo antes de construir arquitectura. Solo lectura y documentación.

- [x] **I15.1** Auditar cómo el Phase Engine usa datos operativos actuales
  > Auditado 2026-03-15. `run_phase_engine(project_id, trigger_source)`. 4 calculadores: F1 (OBVs + estrategia, 100% interno), F2 (OBVs + revenue_momentum_input, parcialmente mejorable con Stripe/Holded), F3 (key_metrics.mrr ×4meses + risk_level, MRR puede venir de Stripe), F4 (key_metrics.mrr ×5meses + márgenes + delegación). Chain completo: Stripe→Finance Agent→key_metrics.mrr→trg_key_metrics_probability→run_probability_engine→revenue_momentum_input→trg_probability_phase→run_phase_engine. **Gap crítico:** F3 requiere ≥4 meses de key_metrics.mrr — sin Stripe el avance depende de entrada manual. Ver `BLOQUE_A_AUDIT.md §I15.1`.
- [x] **I15.2** Auditar cómo el Probability Engine calcula sus inputs
  > Auditado 2026-03-15. 5 inputs: phase_score×35%, execution_rate×20%, validation_strength×15%, revenue_momentum×15% (desde `key_metrics.mrr`), capacity_health×15%. Punto de integración: Finance Agent escribe en `key_metrics.mrr` → trigger `trg_key_metrics_probability` dispara automáticamente. Ver `BLOQUE_A_AUDIT.md §I15.2`.
- [x] **I15.3** Auditar cómo el Risk Engine detecta señales
  > Auditado 2026-03-15. 5 factores: R1.1 RunwayFactor×25% (`project_economic_profile.cash_on_hand` + `financial_projections`), R1.2 ExecutionDrop×20%, R1.3 ValidationWeakness×20%, R1.4 RevenueConcentration×20% (`top_client_revenue_percent`), R1.5 BottleneckSeverity×15%. **Corrección a auditoría anterior:** Risk Engine SÍ tiene runway signal (R1.1) — no Viability Engine. Finance Agent actualiza `cash_on_hand` → `trg_fn_economic_profile_risk` dispara. Corre domingo 01:00 UTC (1h después de Phase Engine). Ver `BLOQUE_A_AUDIT.md §I15.3`.
- [x] **I15.4** Auditar cómo el Viability Engine evalúa el proyecto
  > Auditado 2026-03-15. T1-T4 documentados. Gap confirmado: Viability no tiene runway trigger (ese es Risk R1.1, no Viability). Finance Agent puede mejorar T2 vía `financial_projections` y T3 vía `key_metrics.mrr_growth_rate`. Ver `BLOQUE_A_AUDIT.md §I15.4`.
- [x] **I15.5** Auditar cómo el Next Action Engine genera recomendaciones
  > Auditado 2026-03-15. `src/lib/next-action.ts`: 12 reglas de prioridad, cero datos de integración actualmente. Punto de integración: regla 2.5 para synthesis insights críticos con confidence ≥ 0.8. Ver `BLOQUE_A_AUDIT.md §I15.5`.
- [x] **I15.6** Auditar cómo el CRM interno alimenta métricas
  > Auditado 2026-03-15. CRM (`obvs`) NO alimenta revenue_momentum. Pipeline = dashboard-only. HubSpot path: vista híbrida con campo `source`. Ver `BLOQUE_A_AUDIT.md §I15.6`.
- [x] **I15.7** Auditar cómo OBVs y tareas impactan ejecución
  > Auditado 2026-03-15. `compute_validation_strength()`: top 5 OBVs × (obv_outcome × tipo_multiplier × recency_decay). `compute_iteration_velocity()`: COUNT OBVs con obv_outcome IS NOT NULL en 28d. Sin `source`/`external_id` en `obvs` — HubSpot deals no serían trazables. 7 valores en `obv_type` ENUM (3 legacy ES + 4 canonical EN). Ver `BLOQUE_A_AUDIT.md §I15.7`.
- [x] **I15.8** Auditar cómo el Weekly Review consume datos
  > Auditado 2026-03-15. Tabla `weekly_reviews` EXISTE y es funcional. Cron domingo 23:30 UTC. Determinista sin IA. Fuentes: project_phase_state, key_metrics (mrr, runway), tasks (completadas esa semana), obvs (esa semana). `read_at` controla Weekly Surface activation. FASE 15: mejora automáticamente si Stripe/Asana/HubSpot populan las tablas fuente. Ver `BLOQUE_A_AUDIT.md §I15.8`.
- [x] **I15.9** Auditar cómo Strategic Cycles capturan progreso
  > Auditado 2026-03-15. Tabla `strategic_cycles`: id, cycle_index, start_date, end_date (28d), closed_at, close_reason (manual/scheduled/pivot), engine_snapshot JSONB. Ciclos son contenedores de medición — engines no leen de strategic_cycles (excepción: Phase Engine O3.3 lee tareas del ciclo actual). Sin función de retrospectiva/tendencia (gap normal). FASE 15: transparente — external data mejora engines dentro del ciclo, no el ciclo en sí. Ver `BLOQUE_A_AUDIT.md §I15.9`.
- [x] **I15.10** Identificar qué inputs del motor pueden venir de integraciones
  > Documentado en `BLOQUE_A_AUDIT.md §I15.10`. Tabla completa: Probability (`revenue_momentum` ← Stripe via `key_metrics.mrr`), Viability (T2 ← Holded via `financial_projections`, T3 ← Stripe via `key_metrics.mrr_growth_rate`), Next Action (synthesis_output, regla 2.5).
- [x] **I15.11** Identificar qué inputs deben seguir siendo internos
  > Documentado en `BLOQUE_A_AUDIT.md §I15.11`. Internos: phase_score, hard_signal_met, validation_strength, execution_rate (v1), iteration_velocity, viability_status, current_phase, risk_level.
- [x] **I15.12** Diseñar reglas de precedencia entre datos externos e internos
  > Cubierto por `INTEGRATION_DATA_CONTRACT.md §9`. source_of_truth per-proyecto per-módulo, `internal_only` por defecto, estado `stale_external` explícito, fallback a internal si sync roto.
- [x] **I15.13** Diseñar mecanismo de validación de datos externos antes de entrar al motor
  > Cubierto por `INTEGRATION_DATA_CONTRACT.md §6` (validaciones) y `§7` (guard `write_integration_to_engine_table()`). El motor nunca valida datos de integración directamente.
- [x] **I15.14** Documentar cómo cada motor se verá afectado por integraciones
  > Documentado en `BLOQUE_A_AUDIT.md §I15.14`. Tabla completa por motor: Phase (sin impacto v1), Probability (additive, trigger ya existe), Risk (sin impacto v1), Viability (T2/T3 mejoran, gap T5 runway), Next Action (regla 2.5 additive), CRM (vista híbrida, medio impacto).
- [x] **I15.A.15** Definir "Integration Data Contract" — documento que especifica: qué tipos de datos externos pueden entrar al sistema, qué formato deben tener, qué validaciones pasan, dónde se almacenan, qué motores pueden leerlos. Evita datos inconsistentes, imports caóticos y agentes trabajando con basura.
  > `INTEGRATION_DATA_CONTRACT.md` v1.0 creado 2026-03-15. 15 secciones: propósito, 15 entity_types (v1+v2), schema canónico, payloads por tipo, confidence determinista (3 componentes), validaciones, almacenamiento+pipeline, normalización por provider, hidratación per-proyecto (no hardcoded), acceso por motor/agente, staleness, seguridad, compatibilidad con motores existentes, contrato de errores, versioning.
- [x] **I15.A.ARCH** Crear INTEGRATION_ARCHITECTURE.md — diagrama capstone del sistema completo
  > `INTEGRATION_ARCHITECTURE.md` creado 2026-03-15. 13 secciones: principio base (datos externos→tablas internas→triggers→motores), diagrama completo de extremo a extremo, tabla de infra por bloque, estados source_of_truth (internal_only/external_primary/hybrid/stale_external), confidence pipeline (3 componentes, umbrales 0.6/0.8), trigger chain completo Stripe→Phase (sin modificar motores), mapa providers→tablas→motores, scope Stripe v1 fijo, gaps v1.1 (RunwayFactor, obvs, key_metrics, tasks), módulos pasivos (Weekly Review, Cycles, Next Action), invariantes de diseño (8), orden de implementación recomendado.
- [x] **I15.A.GUARD** Especificar `write_integration_to_engine_table()` — único punto de acceso autorizado para escrituras de agentes en tablas de motor
  > `INTEGRATION_WRITE_GUARD.md` creado 2026-03-15. Decisiones confirmadas: stored procedure PostgreSQL (atomicidad via RPC), payload_hash = MD5(canonical_json recursivo), Sales→key_metrics PROHIBIDO en v1 explícito, idempotencia via UNIQUE constraint. 13 secciones: principio fundamental, EngineTarget, tipos TypeScript (AgentType/MotorWrite/WriteContext/WriteResult/WriteRejectionReason), matriz de autorización, reglas de identidad por target (key_metrics=primer día UTC del mes, financial_projections=projection_month, economic_profile=singleton, tasks/obvs=external_provider+external_id), cálculo payload_hash (MD5+canonical_json recursivo), stored procedure (firma+6 pasos atómicos), schema integration_write_log (UNIQUE NULLS NOT DISTINCT), patrón RPC TypeScript, catálogo 7 errores, 8 invariantes, dependencias de implementación.

### BLOQUE A2 — Compatibilidad con módulos nativos
> No basta con alimentar el engine. Hay que ver cómo las integraciones alimentan los módulos internos.
> Debe hacerse en paralelo con BLOQUE A, antes de diseñar la arquitectura.
> `BLOQUE_A2_AUDIT.md` creado 2026-03-15. Todos los módulos auditados. Nueva tarea I15.A2.9 identificada.

- [x] **I15.A2.1** Auditar CRM nativo actual y su compatibilidad con hidratación externa
  > Ver BLOQUE_A_AUDIT.md §I15.6 + BLOQUE_A2_AUDIT.md §I15.A2.1. Modo: HÍBRIDO. HubSpot vía vista unificada con campo source. CRM no alimenta revenue_momentum — Sales Agent bridgea esto.
- [x] **I15.A2.2** Auditar módulo financiero actual y compatibilidad con fuentes externas
  > Ver BLOQUE_A2_AUDIT.md §I15.A2.2. key_metrics + financial_projections + economic_profile existen pero sin integration_source. financial_integrations/synced_transactions/subscription_metrics NO existen. Modo: WRITE-THROUGH.
- [x] **I15.A2.3** Auditar tareas/ejecución y compatibilidad con Asana/Trello
  > Ver BLOQUE_A2_AUDIT.md §I15.A2.3. tasks table existe sin external_provider/external_id. Execution engine contará tareas importadas automáticamente. Modo: WRITE-THROUGH. Requiere añadir 3 columnas.
- [x] **I15.A2.4** Auditar calendario y compatibilidad con Google Calendar
  > Ver BLOQUE_A2_AUDIT.md §I15.A2.4. HALLAZGO: meetings table NO existe en migraciones — hooks + 3 edge functions rotos. Google Calendar: cero código. Diferido hasta I15.97. Bug pre-15 registrado en I15.A2.9.
- [x] **I15.A2.5** Definir qué módulos internos aceptan hidratación externa parcial
  > key_metrics, financial_projections, economic_profile.cash_on_hand, tasks, CRM obvs (deals HubSpot). Ver tabla en BLOQUE_A2_AUDIT.md §I15.A2.5.
- [x] **I15.A2.6** Definir qué módulos deben seguir siendo solo internos
  > project_phase_state, project_probability (score), project_viability_state, project_risk_score, obvs (OBVs estratégicos), strategic_cycles, strategic_blocks, validation_strength, iteration_velocity. Ver BLOQUE_A2_AUDIT.md §I15.A2.6.
- [x] **I15.A2.7** Definir si cada módulo será read-only, write-through o híbrido
  > key_metrics=write-through, financial_projections=write-through, economic_profile=write-through parcial, tasks=write-through, CRM=híbrido, meetings=diferido, motores=read-only absoluto. Ver BLOQUE_A2_AUDIT.md §I15.A2.7.
- [x] **I15.A2.8** Definir cómo afecta cada sync a la UX actual del módulo
  > key_metrics: badge "Sincronizado desde Stripe" + override posible. tasks: badge provider en Kanban + filtros. CRM: columna source en pipeline. meetings: diferido. Ver BLOQUE_A2_AUDIT.md §I15.A2.8.
- [x] **I15.A2.9** 🔴 Crear tabla `meetings` + tablas satélite — runtime failures resueltos
  > Migración creada: `20260315000001_pr1_create_meetings_tables.sql`. Crea 6 tablas: meetings (schema completo derivado de Meeting interface + edge functions), meeting_participants, meeting_insights, meeting_ai_questions, meeting_ai_recommendations, meeting_decisions. RLS en todas. Índices en project_id y meeting_id.
  > Schema mínimo del user descartado porque useCreateMeeting hace INSERT con meeting_type/status/created_by — sin esas columnas el insert falla. useMeetings.ts no requirió cambios de código.
  > **Bugs pre-existentes deferred (no runtime failures continuos):**
  > - useMeetingParticipants: join `member:members(*)` falla — tabla real es `project_members` (solo falla al navegar a detalle de reunión)
  > - analyze-meeting: `from('members').select('id, nombre, rol')` — tabla/columnas incorrectas (solo falla al invocar explícitamente)
  > - apply-meeting-insights: INSERTs a tasks usan `proyecto_id`/`estado`/`asignado_a` vs `project_id`/`status`/`assignee_id` del schema real (solo falla al aplicar insights aprobados)

### BLOQUE B — Arquitectura de integraciones
> **Orden de ejecución confirmado (2026-03-15) — no cambiar:**
> 1. PR1: meetings migration + useMeetings.ts repair
> 2. Migraciones Bloque B tablas base (integration_connections, integration_sync_runs+snapshots, integration_entities, integration_insights, integration_credentials)
> 3. Migración integration_write_log
> 4. Stored procedure write_integration_to_engine_table()
> 5. Helper src/lib/canonical-hash.ts
> 6. Stripe adapter mínimo (connect + manual import)
> 7. Finance Agent mínimo (mrr_trend → key_metrics)
> 8. src/lib/engine-delta.ts
> 9. SYNC_BANNER (verificar pureza next_action primero)
> Sin webhooks. Sin sync incremental. Sin scope extra en Stripe v1.

- [x] **I15.15** Definir principios del sistema de integraciones
  > Documentado en INTEGRATION_ARCHITECTURE.md §1-§3. Principio base: datos externos → tablas internas → triggers → motores. Los motores no saben el origen de sus datos.
- [x] **I15.16** Definir taxonomy de providers
  > Documentado en INTEGRATION_DATA_CONTRACT.md + integration_connections.provider TEXT: 'stripe'|'holded'|'hubspot'|'asana'|'trello'|'google_calendar'. Orden de ejecución fijado: Stripe → Holded → HubSpot → resto.
- [x] **I15.17** Definir contrato técnico común para providers
  > INTEGRATION_DATA_CONTRACT.md v1.0 + AGENTS_CONTRACT.md. ContractEntity schema canónico, confidence determinista (3 componentes), validaciones, normalización por provider.
- [x] **I15.18** Diseñar interfaz provider_adapter
  > INTEGRATION_ARCHITECTURE.md §2 + §7. Provider adapter: valida schema, mapea a ContractEntity, calcula confidence, descarta confidence < 0.6. No escribe en motor directamente — solo via write_integration_to_engine_table().
- [x] **I15.19** Crear tabla `integration_connections`
  > `20260315000002_bloque_b_integration_tables.sql`. UNIQUE (project_id, provider). connected_at = NOW() al conectar, nunca retroactivo. RLS: project_members.member_id = get_profile_id(auth.uid()).
- [x] **I15.20** Crear tabla `integration_sync_runs`
  > Incluye `pre_engine_snapshot JSONB` + `post_engine_snapshot JSONB` desde el primer día. Schema: { probability: {value, status}, phase: {current_phase, phase_score}, risk: {level, score}, economic_profile: {mrr, runway_months} }. Sin delta_insights — narrativa generada en lectura. Ver INTEGRATION_ARCHITECTURE.md §14.
- [x] **I15.21** Crear tabla `integration_entities`
  > UNIQUE (connection_id, provider, entity_type, external_id). Confidence check. Status: pending→processed|rejected|stale.
- [x] **I15.22** Crear tabla `integration_insights`
  > Insights derivados por agentes desde entities. Status: pending→written|rejected|skipped.
- [x] **I15.23** Crear tabla `integration_credentials` (reemplaza api_key plano en stubs existentes)
  > RLS: service_role only. credential_enc = pgp_sym_encrypt(value, app_secret). UNIQUE (connection_id, credential_key).
- [x] **I15.24** Definir RLS para integraciones
  > Implementado en 20260315000002 + 20260315000003. Patrón: project_members.member_id = get_profile_id(auth.uid()). Excepción: integration_credentials + integration_write_log → service_role only (FORCE ROW LEVEL SECURITY).
- [x] **I15.25** Definir estados de conexión
  > integration_connections.status: 'pending'|'active'|'paused'|'error'|'disconnected'. Implementado en 20260315000002.
- [x] **I15.26** Definir estados de sync
  > integration_sync_runs.status: 'running'|'completed'|'failed'|'partial'. trigger_type: 'manual'|'scheduled'|'webhook'. Implementado en 20260315000002.
- [x] **I15.27** Diseñar sistema de retry y backoff
  > **CERRADO 2026-03-17:** `_shared/retry.ts` — helper `withRetry<T>({ maxAttempts=3, baseDelayMs=1000 })`. Devuelve `{ result, attempts }`. Reintenta solo en: sin statusCode (network), 429 (rate limit), >=500 (server errors). No reintenta: 400, 401, 403, 422 (errores del cliente). Backoff exponencial: 1s, 2s (cap en 3 intentos). `sync-stripe` usa `withRetry` en `stripe.subscriptions.list()`, registra `retry_count = attempts - 1` en `integration_sync_runs`. `connect-stripe` usa `withRetry` en la llamada de validación. Schema: `integration_sync_runs.retry_count INTEGER DEFAULT 0`. Migración: `20260317000002_bloque_b_retry_versioning.sql`. Desplegado.
- [x] **I15.28** Diseñar control de idempotencia
  > UNIQUE NULLS NOT DISTINCT (project_id, sync_run_id, target, logical_period, payload_hash) en integration_write_log. Idempotencia estructural via constraint DB, no lógica de aplicación. payload_hash = MD5(canonical_json recursivo). Ver INTEGRATION_WRITE_GUARD.md §8.
- [x] **I15.29** Diseñar sistema de versionado de integraciones
  > **CERRADO 2026-03-17:** Versionado explícito mínimo, sin auto-migration. Dos columnas nuevas: `integration_sync_runs.adapter_version TEXT DEFAULT '1.0'` (versión de la edge function/lógica) + `integration_entities.contract_version TEXT DEFAULT '1.0'` (versión del ContractEntity schema de INTEGRATION_DATA_CONTRACT.md). Constantes `ADAPTER_VERSION = '1.0'` y `CONTRACT_VERSION = '1.0'` en `sync-stripe/index.ts` — bumping manual al cambiar la lógica. Filas antiguas ya tienen `'1.0'` por DEFAULT — correcto para el estado inicial. No hay rollback ni auto-migration en v1. Migración: `20260317000002_bloque_b_retry_versioning.sql`.
- [x] **I15.30** Crear contrato para normalización de datos
  > INTEGRATION_DATA_CONTRACT.md v1.0. ContractEntity schema, 15 entity_types, confidence pipeline, validaciones, normalización por provider, staleness, versioning.
- [x] **I15.GUARD.impl** Implementar stored procedure `write_integration_to_engine_table()`
  > 20260315000004_bloque_b_write_guard_procedure.sql. Incluye: pgcrypto extension, ALTER TABLE (5 tablas motor + traceabilidad columns), ALTER TYPE task_status ADD 'done_historical', 5 sub-handlers privados (_integration_write_key_metrics, _write_financial_projections, _write_economic_profile, _write_task, _write_obv), stored procedure principal (6 pasos atómicos: validación→idempotencia→log_pending→write→log_result). SECURITY DEFINER, GRANT solo a service_role.
- [x] **I15.GUARD.hash** Helper `src/lib/canonical-hash.ts` — md5CanonicalJson(payload)
  > Función pura. canonicalJson recursivo (ordena claves en todos los niveles). createHash('md5'). Hash siempre calculado en TypeScript, nunca en SQL.
- [x] **I15.GUARD.fix** Correcciones pre-test al stored procedure — migración 20260315000005
  > Bug 1: EXCEPTION handler usaba UPDATE sobre fila deshecha por savepoint + RAISE que revertía el handler. Fix: v_write_reason := SQLERRM, INSERT nuevo rejected, RETURN sin RAISE. Bug 2: 'outbound_contact' no existe en obv_type ENUM ('exploracion','validacion','venta'). Fix: default 'validacion'. Bug 3: ON CONFLICT ON CONSTRAINT para partial unique indexes (CREATE UNIQUE INDEX, no CONSTRAINT). Fix: ON CONFLICT (cols) WHERE predicate en _write_task y _write_obv.
- [x] **I15.TEST.km** Test manual write_integration_to_engine_table() → key_metrics — PASSED
  > Ejecutado 2026-03-15 contra NovaCRM Seed (zzxngvqwmnouchbulvlo). CHECK1: fila key_metrics con mrr=5000, integration_source=stripe, source_confidence=0.90 ✓. CHECK2: integration_write_log status=written, sync_run_id correcto, source_timestamp+confidence ✓. CHECK3: run_probability_engine() disparado, last_calculated_at actualizado — mrr histórico 2020-01 no mueve revenue_momentum (como esperado). CHECK4: segunda llamada idéntica → duplicate_skipped con mismo log_id ✓. CHECK5: segundo sync_run mismo payload → ok:true (mismo ts + misma confidence = no stale, no lower → UPSERT idempotente en datos, nuevo log entry — comportamiento correcto del guard). Hallazgo: integration_write_log.sync_run_id FK sin ON DELETE CASCADE — borrar sync_run requiere borrar write_log primero. No bloquea operativa; pendiente fix en migración futura.
  > **NOTA 2026-03-17 — RE-VERIFICACIÓN PENDIENTE:** sync-stripe reescrito con normalizador + centavos. El test anterior usó mrr=5000 (euros, payload crudo). Ahora el payload es ContractEntity normalizado y mrr en centavos. La cuenta tiene 0 suscripciones activas → mrr=0 centavos=0 euros (sin conflicto de valor). Re-ejecutar desde la app tras deploy para confirmar: (a) integration_entities guarda payload ContractEntity con contract_version='1.0', (b) key_metrics.mrr=0 sigue escribiéndose correctamente, (c) write_status='written'.

### BLOQUE C — Normalización de datos

- [x] **I15.31** Definir entidades financieras
  > **CERRADO 2026-03-17:** 3 decisiones confirmadas: (1) plan_name = price.nickname ?? price.id con `plan_name_is_fallback:true` cuando es fallback. (2) mrr_contribution en CENTAVOS en toda la tubería — UI divide por 100. (3) status mapeado a enum cerrado `active|trialing|past_due|cancelled|paused` via STRIPE_STATUS_MAP (cubre 'canceled'→'cancelled', 'incomplete'→'past_due', 'unpaid'→'past_due'). schema_score determinista: 3 required fields, rechazo si <0.5. confidence = 0.5×schema + 0.3×0.8 + 0.2×1.0. Entidad v1: subscription. Futuro: financial_transaction, customer.
- [x] **I15.36** Crear normalizador financiero
  > **CERRADO 2026-03-17:** `supabase/functions/_shared/normalizers/stripe-financial.ts` — función pura `normalizeStripeSubscription(raw: RawStripeSubscription, ctx: SyncContext): ContractEntity | null`. Sin efectos secundarios. Helpers: mrrContributionCents, computeSchemaScore (3 required, determinista), computeConfidence (fórmula §5). sync-stripe reescrito como orquestador puro — normalización delegada completamente. Finance Agent suma mrr_contribution en centavos. write guard escribe centavos en key_metrics.mrr. StripeIntegration.tsx toast corregido (÷100 para display en EUR). Desplegado.
- [x] **I15.32** Definir entidades comerciales
  > **CERRADO 2026-03-17:** Proveedor v1: HubSpot. Entidad v1: `deal` (contact diferido a BLOQUE D — no alimenta el motor en v1).
  >
  > **4 decisiones de contrato:**
  > 1. **amount_cents:** entero en CENTAVOS, > 0. Guard duro: si `amount` es null/undefined/0 → `return null` antes de schema_score. Misma convención que I15.31 — Finance Agent no distingue unidades por proveedor.
  > 2. **stage:** enum cerrado `prospect|qualified|proposal|negotiation|closed_won|closed_lost` via `HUBSPOT_STAGE_MAP`. Mapping explícito y versionado (v1 del mapa = default HubSpot pipeline IDs + variantes de label en minúscula). Stage no mapeado → `undefined` → penaliza schema_score, no rechaza (mismo patrón que STRIPE_STATUS_MAP).
  > 3. **schema_score:** 3 required: `deal_name` (string no vacío), `stage` (en enum), `amount_cents` (int > 0). score = válidos/3. Rechazo si < 0.5. confidence = 0.5×schema + 0.3×0.8 + 0.2×1.0.
  > 4. **Hard rejects:** (a) `external_id` ausente → null, (b) `amount_cents` = 0 o ausente → null. Ambos antes de schema_score.
  >
  > **DealPayload v1:** `deal_name: string` (R), `stage: DealStage` (R), `amount_cents: number` (R, int > 0), `owner_id?: string` (O), `close_date?: string` (O, ISO 8601), `pipeline_id?: string` (O), `currency?: string` (O, ISO 4217).
  >
  > **HUBSPOT_STAGE_MAP v1 — IDs default + labels comunes normalizados:**
  > `appointmentscheduled→prospect`, `qualifiedtobuy→qualified`, `presentationscheduled→proposal`, `decisionmakerboughtin→negotiation`, `contractsent→negotiation`, `closedwon→closed_won`, `closedlost→closed_lost`. Labels: `prospect/lead/discovery→prospect`, `qualified→qualified`, `proposal/demo→proposal`, `negotiation/negotiating→negotiation`, `closed won/won→closed_won`, `closed lost/lost→closed_lost`.
  > Futuro: financial_transaction, contact (cuando BLOQUE D defina el uso en CRM).
- [x] **I15.33** Definir entidades operativas
  > **CERRADO 2026-03-18:** Proveedor v1: Asana. Entidad v1: `task` (project diferido — no alimenta execution_rate directamente).
  >
  > **Decisiones de contrato:**
  > 1. **status:** enum binario `open | completed`. Asana no tiene estados intermedios reales — in_progress vive en secciones (heurística frágil, no v1). ASANA_STATUS_MAP: `completed=true → 'completed'`, todo lo demás → `'open'`.
  > 2. **schema_score:** 2 required: `task_name` (string no vacío), `status` (en enum). score = válidos/2. Rechazo si < 0.5 (= si falta alguno de los dos). Pattern simplificado respecto a deals/subscriptions — tarea es una entidad más simple, no forzar 3 campos.
  > 3. **Hard reject:** external_id ausente → null. No hay guard duro adicional (task sin nombre penaliza schema_score hasta rechazo).
  > 4. **Write target:** tabla `tasks` (WRITE-THROUGH). Prerrequisito de I15.38: añadir columnas `external_provider TEXT`, `external_id TEXT`, `external_sync_at TIMESTAMPTZ` — migración no incluida aquí, scope del normalizador, no del contrato.
  > 5. **confidence:** misma fórmula §5 con PROVIDER_SCORE=0.8 provisional.
  >
  > **TaskPayload v1:** `task_name: string` (R), `status: 'open'|'completed'` (R), `assignee_external_id?: string` (O), `due_date?: string` (O, ISO 8601), `completed_at?: string` (O, ISO 8601), `section?: string` (O), `project_external_id?: string` (O).

- [!] **I15.34** Definir entidades de comunicación
  > DIFERIDO — Slack es canal de salida (notificaciones), no fuente de datos en v1. No hay target de motor claro para communication entities. Sin impacto en execution_rate, revenue_momentum ni ningún engine input v1. Revisar en v2 cuando exista caso de uso concreto (p.ej. actividad de canal → señal de equipo activo).

- [x] **I15.35** Definir entidades de calendario
  > **CERRADO 2026-03-18:** Proveedor v1: Google Calendar. Entidad v1: `calendar_event`.
  >
  > **Decisiones de contrato:**
  > 1. **Hard rejects** (antes de schema_score): external_id ausente → null. `title` vacío/null → null. `start_at` ausente → null. `end_at` ausente → null. Sin rango temporal completo, fuera — sin soporte de all-day ni eventos sin fin en v1.
  > 2. **schema_score:** 3 required: `title`, `start_at`, `end_at`. Todos cubiertos por hard guards → schema_score siempre 1.0 para eventos que pasen los guards. Consecuencia explícita del diseño: confidence = 0.94 siempre (no es bug — refleja que el contrato es estricto en entrada).
  > 3. **attendee_count:** NO required. Muchos eventos válidos llegan sin esta info. Optional en payload.
  > 4. **Write target:** tabla `meetings` (creada en I15.A2.9).
  > 5. **confidence:** misma fórmula §5 con PROVIDER_SCORE=0.8 provisional.
  >
  > **CalendarEventPayload v1:** `title: string` (R), `start_at: string` (R, ISO 8601), `end_at: string` (R, ISO 8601), `attendee_count?: number` (O, int ≥ 0), `organizer_email?: string` (O — si viene fácil en la API), `meeting_type?: string` (O), `location?: string` (O).
- [x] **I15.36** Crear normalizador financiero
  > Ver nota en I15.31 arriba — cerrado en el mismo commit.
- [x] **I15.37** Crear normalizador comercial
  > **CERRADO 2026-03-17:** `supabase/functions/_shared/normalizers/hubspot-commercial.ts` — función pura `normalizeHubSpotDeal(raw: RawHubSpotDeal, ctx: SyncContext): ContractEntity | null`. Hard guards: (1) external_id ausente → null, (2) amountToCents(raw.amount) ≤ 0 → null (cubre null/vacío/NaN/cero). `raw.amount` tratado como string via `parseFloat` + `Math.round` — no asume número. HUBSPOT_STAGE_MAP v1 (21 entradas: IDs default + labels comunes lowercase). schema_score 3 required (deal_name, stage, amount_cents). confidence = fórmula §5 con PROVIDER_SCORE=0.8 provisional. Sin efectos secundarios.
- [x] **I15.38** Crear normalizador operativo
  > **CERRADO 2026-03-18:** `asana-operational.ts` — `normalizeAsanaTask`. Hard guard: gid ausente → null. Status: `completed === true → 'completed'`, else → `'open'`. due_date: due_at preferido sobre due_on. schema_score 2 required. Prerrequisito de integración: columnas external_provider/external_id/external_sync_at en tasks — migración pendiente en I15.38.
- [x] **I15.39** Crear normalizador de calendario
  > **CERRADO 2026-03-18:** `gcal-calendar.ts` — `normalizeGCalEvent`. 4 hard guards: external_id, title, start.dateTime, end.dateTime. All-day events rechazados por ausencia de start.dateTime (solo tienen start.date). schema_score = 1.0 siempre post-guards → confidence = 0.94 constante. occurred_at = start_at.
- [ ] **I15.DEBT.3** Filtrar eventos GCal con status="cancelled" antes de normalizar
  > **Deuda registrada 2026-03-18.** `normalizeGCalEvent` no filtra eventos cancelados — un evento cancelado con title/start/end válidos pasa todos los guards y entra como `calendar_event` activo en `integration_entities`. Esto contamina la señal de actividad de agenda. No es deduplicación — es filtro semántico de validez. Fix: añadir hard guard `if (raw.status === 'cancelled') return null` en `normalizeGCalEvent`, antes del schema_score. Impacto: bajo en v1 (GCal no suele incluir cancelados en el listado default de events.list), pero a confirmar con el orquestador cuando se implemente sync-gcal.
- [!] **I15.40** Crear normalizador de comunicación
- [x] **I15.41** Diseñar deduplicación
  > **CERRADO 2026-03-18.** Dedup estructural ya existe: UNIQUE (connection_id, provider, entity_type, external_id) + upsert, payload_hash en write_log. No se borran entidades que desaparecen. **Adición v1:** `last_seen_at TIMESTAMPTZ` en `integration_entities` — actualizado en cada sync que vuelve a ver la entidad. `status='stale'` definido en schema pero NO aplicado automáticamente — se aplicará en v2. **Prerrequisito:** migración para añadir `last_seen_at`.

- [x] **I15.42** Diseñar incremental sync
  > **CERRADO 2026-03-18.** Full sync en primer run, incremental desde el segundo usando `last_sync_at` como cursor. Filtros reales: HubSpot `lastmodifieddate[gte]`, Asana `modified_since`, GCal `updatedMin`. **Stripe — bounded rescan:** no tiene filtro `updated` nativo — descarga todos los activos en cada run. No es incremental real: cambios sobre objetos viejos no se detectan. Documentado como bounded rescan para no mentir en el diseño. Escalar requiere webhooks.

- [x] **I15.43** Diseñar full sync inicial
  > **CERRADO 2026-03-18.** Primer sync = full scan con paginación cursor-based. Cursores: Stripe `starting_after+has_more`, HubSpot `paginationToken`, Asana `offset`, GCal `pageToken`. Límite: 10 páginas/1000 entidades por run → `status='partial'` si se supera. **Cursor persistido:** `pagination_cursor TEXT` + `is_partial BOOLEAN` en `integration_sync_runs`. Sin persistencia, "continúa desde donde se quedó" no existe. **Prerrequisito:** migración para añadir estas dos columnas.

- [x] **I15.44** Diseñar control de staleness
  > **CERRADO 2026-03-18.** Staleness = propiedad derivada calculada en lectura. `is_stale = last_sync_at < NOW() - INTERVAL '7 days'`. Connection permanece `status='active'` — no hay transición automática a 'paused' en v1 (no existe cron ni automatización real; aplicar paused sin mecanismo sería estado mentira). Efectos: (1) UI avisa "Sin sync desde hace X días". (2) Motor reduce confianza en datos stale — implementación concreta diferida a BLOQUE D.
- [x] **I15.DEBT.1** Cachear ContractEntity normalizadas en sync-stripe antes de agregación Finance Agent
  > **CERRADO 2026-03-17:** `acceptedEntities: ContractEntity[]` acumulada en Paso 5 (bucle de inserción). Paso 6 (Finance Agent) usa `acceptedEntities.reduce(...)` — elimina el segundo bucle sobre `rawSubscriptions`. `ContractEntity` importado como type desde stripe-financial.ts. Una sola llamada a `normalizeStripeSubscription` por suscripción.
- [x] **I15.TEST.km.v2** Re-verificar sync-stripe end-to-end con payload normalizado (centavos)
  > **CERRADO 2026-03-17.** Sync ejecutado con JWT real. CHECK A: integration_entities=0 filas ✅ (cuenta sin suscripciones activas). CHECK B: key_metrics.mrr="0.00" (NUMERIC), integration_source="stripe", source_confidence="1.000" ✅. CHECK C: integration_write_log.status="written", agent_type="finance", target="key_metrics", confidence="1.000" ✅. verify_jwt había revertido a true — re-aplicado false en sync-stripe y connect-stripe (mismo fix que I15.FIX.2).
  > **Nota de límite:** con mrr=0 la convención de centavos no se puede distinguir de la de euros. La validación real de escala (centavos vs euros) requiere una cuenta con suscripciones activas y MRR > 0. Pendiente de verificar cuando exista una cuenta de test con datos reales.
- [ ] **I15.DEBT.2** MRR puede divergir de `integration_entities` si un upsert falla en DB
  > **Deuda registrada 2026-03-17.** Finance Agent suma `acceptedEntities` (normalizadas en memoria), pero si el upsert de una entidad a `integration_entities` falla, esa entidad sí contribuye al MRR escrito en `key_metrics` aunque no haya quedado persistida. Resultado: el agente cree que X suscripciones existen, el motor recibe MRR de X, pero `integration_entities` tiene X-N. Solución v2: mover la agregación Finance Agent al final del bucle solo sobre entidades con `entityIds` exitosos — o hacer el check post-upsert. Sin bloqueo operativo en v1 (errores de upsert son raros con idempotencia via UNIQUE constraint).
- [ ] **I15.DEBT.4** `queryClient.invalidateQueries` falla silenciosamente en flujo connect→sync inmediato
  > **Deuda registrada 2026-03-18.** En `StripeIntegration`, tras un connect exitoso el user puede pulsar "Sincronizar Ahora" antes de que `connectionId` del state se asiente. La invalidación `invalidateQueries(['sync_runs', connectionId])` usa el `connectionId` del state (puede ser null o el valor pre-connect). SyncHealthCard no se actualiza en ese caso. No rompe funcionalidad — el user ve el resultado al recargar o en la siguiente query stale. Sin bloqueo operativo. Fix v2: pasar `overrideConnectionId` a la invalidación también.
- [ ] **I15.DEBT.5** Motor writes del Finance Agent bloqueados por constraint de sync_run status
  > **Deuda registrada 2026-03-18.** `write_integration_to_engine_table()` requiere `sync_run.status='running'` (PASO 1b del guard). El Finance Agent corre post-sync cuando el sync_run ya está en `status='completed'`. La función rechaza la llamada con `invalid_sync_run`. Impacto v1: Finance Agent no puede escribir en `project_economic_profile.top_client_revenue_percent` ni otros targets de motor (solo emite `integration_insights`). Soluciones v2: (A) modificar el guard para aceptar el `sync_run_id` del agente aunque esté completado — añadir permiso explícito por `agent_type`; (B) el Finance Agent crea su propio `sync_run` de tipo `agent_analysis`; (C) sync-stripe llama al agente internamente antes de marcar el sync_run como `completed`. Opción A es la más limpia. Sin bloqueo operativo: el Financial Engine lee `key_metrics.mrr` (ya hidratado por el sync), el agente solo añade análisis encima.

### BLOQUE D — Hidratación de módulos internos
> Cuando una herramienta externa se conecta, debe alimentar módulos internos — no crear una vista paralela.

- [x] **I15.45** Definir qué integraciones hidratan CRM interno
  > **CERRADO 2026-03-18.**
  > - **Módulo:** CRM — pipeline de deals/ventas
  > - **Proveedor v1:** HubSpot
  > - **Tabla/target:** `integration_entities` (entity_type='deal') → hidratación en `obvs` con `source='hubspot'` (implementación en BLOQUE E)
  > - **Modo de precedencia:** `external_primary` para campos importables del deal (deal_name, stage, amount_cents)
  > - **Qué hidrata:** deals de HubSpot como OBVs tipo 'venta' con source=hubspot — stage mapeado, amount en centavos, owner_id, close_date
  > - **Siempre manual:** OBVs estratégicos (validaciones, discoveries, exploraciones) — nunca sobrescritos por HubSpot. La distinción es `obvs.source`: NULL o 'internal' = manual, 'hubspot' = externo
  > - **Fuera en v1:** contact hydration, company hydration, deal activity history, pipeline multi-etapa custom

- [x] **I15.46** Definir qué integraciones hidratan módulo financiero
  > **CERRADO 2026-03-18.**
  > - **Módulo:** Financiero — key_metrics, financial_projections, economic_profile
  > - **Proveedor v1:** Stripe (key_metrics.mrr) — Holded definido pero sin conexión implementada aún
  > - **Tabla/target:** `key_metrics` (mrr, arr, total_customers via write guard)
  > - **Modo de precedencia:** `external_primary` cuando Stripe activo — datos de Stripe tienen precedencia sobre entrada manual de MRR
  > - **Qué hidrata:** `key_metrics.mrr` (suma de suscripciones activas en centavos), `key_metrics.arr` (mrr × 12, calculado al escribir), `key_metrics.total_customers` (count de entidades aceptadas)
  > - **Siempre manual:** `runway_months`, `burn_rate`, `cash_balance` (sin fuente externa en v1), `financial_projections` completo (hasta que Holded esté conectado), `mrr_growth_rate` (calculado internamente por el motor)
  > - **Fuera en v1:** Holded hydration (connection no implementada), churn_rate desde Stripe, CAC/LTV externos

- [x] **I15.47** Definir qué integraciones hidratan tareas
  > **CERRADO 2026-03-18.**
  > - **Módulo:** Tasks — ejecución operativa
  > - **Proveedor v1:** Asana
  > - **Tabla/target:** `tasks` (WRITE-THROUGH) — requiere columnas `external_provider`, `external_id`, `external_sync_at` (prerrequisito de migración para orquestador, no añadidas aún)
  > - **Modo de precedencia:** `external_primary` para tareas importadas — campos de Asana no se sobrescriben manualmente en Optimus
  > - **Qué hidrata:** `task_name`, `status` (open/completed), `due_date`, `assignee_external_id`, `section`, `project_external_id`
  > - **Siempre manual:** tareas creadas en Optimus sin external_provider (no se tocan). Priority, notas internas, `leader_id`, subtareas estratégicas
  > - **Fuera en v1:** Trello, subtareas de Asana, dependencias, jerarquía de proyectos, custom fields

- [x] **I15.48** Definir qué integraciones hidratan calendario
  > **CERRADO 2026-03-18.**
  > - **Módulo:** Calendario — reuniones y contexto de agenda
  > - **Proveedor v1:** Google Calendar
  > - **Tabla/target:** `meetings` (WRITE-THROUGH, tabla creada en I15.A2.9)
  > - **Modo de precedencia:** `external_primary` — eventos de GCal no se editan en Optimus; Optimus es read-only sobre el calendario
  > - **Qué hidrata:** `title` (summary), `start_at`, `end_at`, `attendee_count`, `organizer_email`, `location`
  > - **Siempre manual:** `meeting_type`, notas e insights del meeting, action items, decisiones capturadas — toda la capa de análisis post-reunión es interna
  > - **Fuera en v1:** all-day events (rechazados en normalizer), series recurrentes como entidad agrupada, Microsoft Calendar / Outlook, aceptación/rechazo de invitaciones
- [x] **I15.49** Definir modo source_of_truth (externo vs interno)
  > **CERRADO 2026-03-18.** Marco: una sola fuente de verdad por módulo por proyecto. Sin mezcla implícita.
  >
  > **3 estados — cadena de fallback:**
  > - `internal_only` — sin conexión activa; motor lee solo datos internos.
  > - `external_primary` — conexión activa + último sync ≤ 7 días; dato externo tiene precedencia sobre interno.
  > - `stale_external` — conexión activa pero sin sync hace >7 días. **Estado diagnóstico, no de lectura.** El motor se comporta como `internal_only`. No hay retorno automático a external_primary — requiere sync exitoso.
  >
  > **Implementación:** derivado en lectura a partir de `integration_connections.status + last_sync_at`. No se persiste en DB en v1 — sin estado mutable adicional que pueda desincronizarse.
  >
  > **Mapa proveedor → módulo (sin hybrid):**
  > - `stripe` → `key_metrics` → `external_primary`
  > - `holded` → `financial_projections`, `economic_profile` → `external_primary`
  > - `asana` → `tasks` → `external_primary`
  > - `google_calendar` → `meetings` → `external_primary`
  > - `hubspot` → CRM → `external_primary` solo para campos importables (deals externos)
  >
  > **Hybrid excluido de I15.49:** la lógica de qué campos de HubSpot/CRM conviven con OBVs manuales pertenece a reglas de merge (I15.50–I15.51), no al estado base de fuente de verdad. Mezclarlos aquí contaminaría el marco con lógica de hidratación.
- [x] **I15.50** Diseñar resolución de conflictos
  > **CERRADO 2026-03-18.** Regla base: bajo `external_primary`, el valor externo gana en campos hidratados. Sin excepción en v1.
  >
  > **Regla completa (3 partes):**
  > 1. **Overwrite:** si el campo fue hidratado por sync y llega un valor nuevo externo, se sobreescribe.
  > 2. **Notificación requerida (parte de la regla, no adorno UX):** el sistema registra y muestra que el valor fue actualizado por sync externo — sin esto la regla es invisible para el usuario y produce confusión.
  > 3. **Override manual:** diferido a I15.54 — en v1 no existe mecanismo para que el usuario bloquee un campo hidratado.
  >
  > **Qué no está cubierto en v1:** campos mixtos (parte manual, parte externo en la misma entidad) — resueltos en I15.51 por coexistencia, no por merge de campos.
- [x] **I15.51** Diseñar merge entre datos manuales y externos
  > **CERRADO 2026-03-18.** Principio dominante: **coexistencia** — CRM, tasks y meetings son entidades separadas identificadas por `source` / `external_provider`. No hay merge de registros en v1.
  >
  > **Merge real solo en `key_metrics`:** una sola fila por período (`period_start`, `connection_id`). Bajo `external_primary`, el valor externo sobreescribe el manual. Regla de I15.50 aplicada directamente.
  >
  > **Coexistencia en práctica:**
  > - `obvs`: un OBV manual y un deal de HubSpot son entidades distintas — el motor las cuenta por separado.
  > - `tasks`: tarea manual y tarea de Asana son filas distintas — identificadas por `external_provider='asana'` vs `external_provider=null`.
  > - `meetings`: cada evento de GCal es una fila propia en `integration_entities` — no se fusiona con notas manuales en v1.
  >
  > **Convivencia HubSpot/OBVs:** deals externos entran como `external_primary` en CRM. OBVs manuales permanecen como `internal_only`. Motor los agrega — no los colapsa.
- [x] **I15.52** Diseñar fallback si una integración falla
  > **CERRADO 2026-03-18.** Dos escenarios distintos, respuestas distintas.
  >
  > **A — Fallo durante sync activo** (red, rate limit, 5xx del provider):
  > - `integration_sync_runs.status = 'failed'` + `error_message`.
  > - Datos ya escritos en `integration_entities` permanecen (upsert idempotente — no hay rollback parcial).
  > - Si había cursor activo: `is_partial=true` + `pagination_cursor` guardado — permite reanudar en v2.
  > - Motor sigue usando datos de último sync exitoso — no hay modo degradado especial; los datos simplemente son stale (I15.44).
  >
  > **B — Fallo al iniciar sync** (token inválido, conexión revocada):
  > - `integration_connections.status = 'error'` + `error_message`.
  > - No se crea `sync_run`.
  > - UI notifica que la conexión está en error y requiere reconexión.
  >
  > **Qué NO existe en v1:** retry automático, circuit breaker formal, queue de eventos fallidos. Sin cron, no hay automatismo posible. El fallback es honesto: preservar lo existente + notificar al usuario.
  >
  > **Garantía de entrega: at-least-once, NOT exactly-once.** Si el sistema falla entre páginas, el cursor puede perderse y la página se re-procesa en el siguiente sync completo → duplicados posibles (resueltos por UNIQUE constraint + upsert idempotente). No hay garantía de exactamente una vez por entidad por sync. Esta limitación es explícita y conocida — no debe asumirse lo contrario al diseñar BLOQUE E o los orquestadores.
- [x] **I15.53** Diseñar trazabilidad de origen de datos
  > **CERRADO 2026-03-18.** Principio: cualquier dato en Optimus que venga de una fuente externa debe poder ser trazado hasta su origen — proveedor, conexión, sync_run y timestamp de la fuente.
  >
  > **Cadena de trazabilidad existente (`integration_entities`):**
  > - `provider` — quién generó el dato (stripe, hubspot, asana, google_calendar)
  > - `connection_id` → `integration_connections` — qué conexión del usuario
  > - `sync_run_id` → `integration_sync_runs` — cuándo se sincronizó, status, is_partial
  > - `synced_at` — cuándo se escribió en Optimus
  > - `source_timestamp` — cuándo corrió el sync (reloj del sistema, no del provider)
  >
  > **Marcadores pendientes en tablas hidratadas (prereqs de BLOQUE E):**
  > - `tasks`: columnas `external_provider`, `external_id`, `external_sync_at` — ya registrado como prereq de I15.47
  > - `obvs`: columna `source` — ya registrado como prereq de I15.45
  > - `key_metrics`: `integration_source` ya existe (evidenciado en I15.TEST.km.v2: `integration_source: "stripe"`)
  >
  > **Exposición en UI (parte de la regla de I15.50):**
  > - Tooltip o badge en el campo: "Sincronizado desde [provider] el [synced_at]"
  > - Sin pantalla de auditoría completa en v1 — la trazabilidad es por campo, visible en contexto
  >
  > **Qué NO existe en v1:** audit log de cambios individuales por campo (field-level history), diff entre valor anterior y nuevo post-sync, exportación de trazabilidad.
- [x] **I15.54** Permitir override manual
  > **CERRADO 2026-03-18.** Diseño: el usuario puede marcar un campo hidratado como "bloqueado" para que futuros syncs no lo sobreescriban.
  >
  > **Decisiones de diseño — dos niveles distintos según tipo de tabla:**
  >
  > **Nivel entidad (tasks, meetings):** el bloqueo aplica a la entidad completa, no a campos individuales. Bajo `external_primary`, Asana/GCal owns todo el record — no tiene sentido bloquear `due_date` pero no `status`. Override = "no sincronizar esta entidad desde el provider". Implementación: flag `sync_locked BOOLEAN` en la fila (o lista de external_ids excluidos por connection).
  >
  > **Nivel campo (tablas agregadas: key_metrics):** el bloqueo aplica por campo nombrado. Útil para "Stripe puede actualizar MRR pero no sobreescribir mi ajuste manual de runway_months". Implementación: columna `locked_fields JSONB` con array de nombres de campo bloqueados.
  >
  > **Regla:** no forzar locked_fields en tasks/meetings — el modelo no encaja y produciría lock parcial incoherente. La granularidad debe seguir la naturaleza de la tabla.
  >
  > - **Comportamiento del sync:** write guard omite silenciosamente campos/entidades bloqueadas.
  > - **Notificación:** UI indica qué está bloqueado y permite desbloquear.
  >
  > **Implementación:** diferida a BLOQUE E — requiere UI + write guard diferenciado por nivel. Este ítem cierra el diseño conceptual; la migración y el código van en I15.E.override.
- [x] **I15.55** Diseñar preview antes de importar
  > **CERRADO 2026-03-18.** Diseño: antes de ejecutar un sync completo por primera vez (o manualmente), el usuario ve qué se va a importar sin que se escriba nada.
  >
  > **Decisiones de diseño:**
  > - **Trigger:** botón "Vista previa" en la card de integración antes del primer sync, o en sync manual explícito.
  > - **Implementación:** dry_run mode en el orquestador — ejecuta normalización pero omite los upserts. Devuelve lista de entidades que se crearían/actualizarían con counts por tipo.
  > - **Granularidad del preview:** counts por entity_type + muestra de los primeros N registros (no dump completo — protege privacidad y rendimiento).
  > - **Sin persistencia:** el preview no guarda nada — si el usuario aprueba, se lanza el sync real.
  >
  > **Implementación:** diferida a BLOQUE E — requiere UI y flag `dry_run` en edge functions de sync. Este ítem cierra el diseño conceptual.
- [x] **I15.56** Diseñar desconexión segura
  > **CERRADO 2026-03-18.** Diseño: cuando el usuario desconecta una integración, el sistema debe comunicar claramente qué datos quedan y cuáles desaparecen.
  >
  > **Decisiones de diseño (2 modos — usuario elige en UI):**
  > - **Modo A — Retener datos:** `integration_entities` y tablas hidratadas mantienen sus datos. `integration_connections.status = 'disconnected'`. Motor pasa a `internal_only` para ese módulo. Los datos quedan como snapshot histórico sin future updates.
  > - **Modo B — Limpiar datos:** borra `integration_entities` de esa connection, revierte campos hidratados a NULL/manual. Irreversible — requiere confirmación explícita.
  >
  > **Comportamiento default:** Modo A (retener). El Modo B requiere confirmación "Entiendo que se eliminarán X entidades".
  >
  > **Qué pasa con credentials:** `integration_credentials` se borra siempre (tokens externos no tienen razón de persistir sin conexión activa). Separado de los datos.
  >
  > **Agujero conocido — Modo B sin trazabilidad completa:** para saber qué limpiar al desconectar, el sistema necesita rastrear todos los writes hechos por esa `connection_id`. `integration_entities` ya tiene `connection_id` (limpiable). Pero `key_metrics` solo tiene `integration_source` (string: "stripe") — no tiene `connection_id`. Si un proyecto tiene dos connections Stripe activas (edge case), el Modo B no puede distinguir qué filas borrar.
  >
  > **Prerequisito de Modo B:** `key_metrics` debe almacenar `connection_id` junto a `integration_source` para que la limpieza sea segura. Sin este dato, el Modo B es peligroso en producción. Prereq registrado para BLOQUE E (I15.E.disconnect_prereq).
  >
  > **Comportamiento seguro en v1:** Modo A (retener) es siempre seguro. Modo B solo implementar cuando `connection_id` esté linkado en todos los writes hidratados.
  >
  > **Implementación:** diferida a BLOQUE E con la condición anterior. Este ítem cierra el diseño conceptual.

### BLOQUE E — UX de integraciones

- [x] **I15.57** Crear sección Integraciones
  > `src/pages/IntegrationsView.tsx` existe. Estructura: header + HowItWorks + grid cards + tabs (Slack/Stripe/Holded). BUG CORREGIDO 2026-03-18: `setShowPreviewModal` no definido → eliminado el prop `onViewPreview` de HowItWorks (opcional). Pendiente: añadir providers HubSpot/Asana/GCal al grid y a los tabs.
- [x] **I15.58** Crear cards de integración
  > Grid existe. Status real desde DB: `useIntegrationConnections` hook creado (`src/hooks/useIntegrationConnections.ts`) — lee `integration_connections`, calcula `is_stale` en lectura. `ConnectionBadge` componente inline en IntegrationsView muestra Conectado/Error/Stale/Disponible según estado real para Stripe y Holded. Slack mantiene badge separado (usa `slack_webhooks`, no `integration_connections`). Pendiente: añadir cards HubSpot, Asana, Google Calendar cuando sus sync functions existan.
- [x] **I15.59** Crear tutoriales de conexión
  > Existen para Slack (5 pasos), Stripe (3 pasos), Holded (3 pasos) como Cards dentro de cada tab. Pendiente añadir los nuevos providers cuando se creen sus tabs.
- [x] **I15.60** Crear estados visuales (conectado / sync / error / desconectado)
  > `ConnectionBadge` cubre: Conectado (green), Error (destructive), Stale (amber, I15.44), Disponible (outline). StripeIntegration.tsx tiene spinner durante sync activo (isSyncing). HoldedIntegration.tsx también tiene spinner. Falta: estado 'stale' visible en componente de detalle (actualmente solo en card del grid). Estado 'error' en detalle tampoco muestra error_message de DB aún.
- [x] **I15.61** Crear vista de detalle por integración
  > `StripeIntegration.tsx` cubre detalle completo para Stripe. `HoldedIntegration.tsx` existe como stub. `SlackIntegration.tsx` completo. Pendiente: componentes para HubSpot, Asana, Google Calendar.
- [x] **I15.62** Crear estado vacío
  > Banner dashed en `IntegrationsView` — visible cuando `!isLoading && !hasAnyActive && !isDemoMode`. Muestra icono, "Sin integraciones activas", descripción breve de valor (Stripe → MRR, Holded → facturas) y CTA "elige un proveedor abajo". Se oculta en modo demo para no interferir con el preview de datos.
- [x] **I15.63** Mostrar salud de sincronización
  > `SyncHealthCard.tsx` creado. Lee último `integration_sync_run` por `connection_id`. Muestra: timestamp relativo, badge de estado (OK/Error/Parcial/En curso), grid de entidades procesadas/escritas/rechazadas, alert de sync parcial, alert de error con message. Integrado en `StripeIntegration.tsx` (visible cuando está conectado). Pendiente: integrar en HoldedIntegration, y futuros providers (HubSpot, Asana, GCal).
- [x] **I15.64** Crear explicación de valor por integración
  > Sección "Qué entra · Dónde va · Qué cambia" en `StripeIntegration.tsx` — tabla 3 columnas: dato de entrada / módulo en Optimus / efecto. Filas: suscripciones activas → key_metrics.mrr → Financial Engine (peso 15%); precio×12 → key_metrics.arr → automático; núm. suscripciones → key_metrics.total_customers → Rankings. Footer explícito de qué NO se sincroniza. Cards del grid actualizadas: Slack = "output-only, no importa datos"; Stripe = "Suscripciones → key_metrics.mrr → probability"; Holded = "facturas → runway_months + nota de pendiente".
- [x] **I15.65** Crear tutorial post-conexión
  > Panel 3 pasos en `StripeIntegration.tsx`. Condición: `isConnected && !lastSync && !syncResult && !hasPriorSync`. `hasPriorSync` se carga desde `last_sync_at` en DB al montar (fix edge case de recarga: 2026-03-18) y se setea a true tras sync exitoso. Pasos concretos: (1) sincronizar → Stripe envía suscripciones activas; (2) MRR en key_metrics; (3) Financial Engine recalcula. Footer honesto sobre MRR=0 sin suscripciones.
- [x] **I15.66** Diseñar UX de reconexión
  > `StripeIntegration.tsx` ampliado: `useEffect` ahora detecta `status IN ('active', 'error')`. Si `status='error'`, guarda `connectionError` con el mensaje de error de DB. En el form: Alert destructive "Conexión interrumpida" con el error_message. Botón cambia de "Conectar Stripe" → "Reconectar Stripe". Pendiente: aplicar mismo patrón a HoldedIntegration cuando Holded esté implementado.
- [x] **I15.E.DELTA** Crear `src/lib/engine-delta.ts` — función pura `computeEngineDelta(pre, post)` que compara snapshots y genera narrativa causal determinista
  > **COMPLETADO** (archivo existe). `computeEngineDelta(pre, post): EngineDeltaItem[]` implementado. 5 métricas: probability, phase_score, risk.score, mrr, runway_months. `direction`: up/down/unchanged/new. `isBusinessImprovement` solo para MRR con pre no-null y after > before. Nota: falta check `confidence >= 0.8` de la regla de copy — actualmente no se verifica en la función (no tiene acceso a confidence del snapshot). Gap menor, registrado.
- [x] **I15.E.SYNC_BANNER** Mostrar narrativa causal post-sync en UI
  > **COMPLETADO** (`SyncBanner.tsx` existe + integrado en `StripeIntegration.tsx`). Flujo: sync exitoso → `setSyncResult(data)` → SyncBanner recibe pre/post snapshots → `computeEngineDelta` → renderiza solo cambios (direction !== 'unchanged'). Regla de copy implementada parcialmente: `isBusinessImprovement` aplica la condición "externo gana" pero no verifica confidence ≥ 0.8 (gap de I15.E.DELTA). El texto "mejora de evaluación" vs "mejora del negocio" funciona por el flag pero no hay fallback explícito en el copy.
- [x] **I15.E.CONNECT_UX.guide** Tutorial visual en modal de conexión
  > `ApiKeyGuide.tsx` creado. Componente `<ApiKeyGuide provider="stripe|holded">` — botón "¿Dónde está mi API Key?" junto al label del input, abre Dialog. Contenido: zona GIF_PLACEHOLDER (bloque marcado, listo para reemplazar con `<img>` cuando exista el asset) + instrucciones texto paso a paso por provider. Stripe: 4 pasos (localizar sk_, reveal, copiar antes de que desaparezca, pegar) con warning explícito "Stripe solo muestra la key una vez". Holded: 4 pasos equivalentes. Integrado en StripeIntegration.tsx y HoldedIntegration.tsx. Extensible a nuevos providers añadiendo entrada en `GUIDES`.
- [ ] **I15.E.CONNECT_UX.oauth** Stripe Connect OAuth — reemplazar el input de API key por un flujo OAuth donde el usuario autoriza con su cuenta de Stripe directamente (sin copiar claves). Requiere cuenta Stripe Platform + configurar OAuth redirect en Stripe Dashboard. Aplica también como patrón para HubSpot OAuth (futuro). Prioridad: después de que el flujo manual funcione correctamente en producción.
  > Acordado 2026-03-16 como solución óptima a largo plazo. El flujo OAuth elimina el problema de API keys completamente — el usuario nunca toca una clave. A corto plazo implementar I15.E.CONNECT_UX.guide; a medio plazo migrar a OAuth.

### BLOQUE F — Desbloqueo progresivo de integraciones

- [x] **I15.67** Diseñar sistema de visibilidad progresiva
  > Panel `IntegrationRecommendationsPanel` renderizado condicionalmente según fase y conexiones activas. Fase < 2 → aviso "se activan en Fase 2". Fase ≥ 2 → recomendaciones activas. Completamente desaparecido si todo conectado.
- [x] **I15.68** Ocultar integraciones en proyectos tempranos (misma lógica que FeatureTeasersPanel)
  > `isEarlyPhase(current_phase < 2)` en `integration-recommendations.ts`. Panel muestra aviso visual con ícono Lock en fase 1. No oculta los tabs (regresión UX innecesaria) — solo no recomienda nada.
- [x] **I15.69** Definir triggers de recomendación
  > Stripe: `phase >= 2 AND !connected('stripe')`. Holded: `phase >= 2 AND !connected('holded')`. Orden = prioridad (Stripe primero). MRR no incluido en trigger v1 — siempre null en este contexto (DEBT pendiente I15.75).
- [x] **I15.70** Crear integration_recommendation_engine
  > `src/lib/integration-recommendations.ts`. Función pura `getIntegrationRecommendations(ctx)`. Patrón exacto de `teasers.ts`: `ALL_RECOMMENDATIONS` array con `isActive` predicate, slice(0, MAX_RECOMMENDATIONS). Exports: `getIntegrationRecommendations`, `isEarlyPhase`, tipos `IntegrationRecommendation`, `IntegrationRecommendationContext`.
- [x] **I15.71** Crear cards de recomendación contextual
  > `src/components/integrations/IntegrationRecommendationCard.tsx`. Card con icono por provider, Badge "Optimus", reason, bloque impact ("Efecto:"), CTA con ArrowRight. `src/components/integrations/IntegrationRecommendationsPanel.tsx` — recibe ctx + onNavigate, renderiza grid de hasta 2 cards.
- [x] **I15.72** Crear explicación causal (por qué esta herramienta ahora)
  > Campo `reason` por recomendación: "dato que entra / módulo que hidrata / efecto en Optimus". Stripe: "MRR manual → Stripe reemplaza con datos reales → Financial Engine recalcula probabilidad (peso 15%)". Holded: "proyecciones manuales ±40% → facturas reales → runway_months ±5%".
- [x] **I15.73** Limitar número de recomendaciones visibles
  > `MAX_RECOMMENDATIONS = 2` en `integration-recommendations.ts`. `slice(0, MAX_RECOMMENDATIONS)` en `getIntegrationRecommendations`.
- [x] **I15.74** Medir aceptación de integraciones
  > Callback `onAccept` en `IntegrationRecommendationCard`. `onNavigate(tab)` en panel → cambia `activeTab` en `IntegrationsView` (tab ahora controlado con `value` + `onValueChange`). Trazabilidad implícita: si usuario conecta desde el tab navegado por recomendación, `integration_connections.connected_at` registra el momento. Medición explícita de "clic en CTA → conexión completada" queda como DEBT si se necesita analytics granular.
- [x] **I15.75** Evitar recomendar herramientas irrelevantes al modelo de negocio
  > BLOQUE F v1: todos los proyectos en fase ≥ 2 reciben las mismas recomendaciones. Filtrado por `project_type` (SaaS vs service vs marketplace) no implementado — requiere exponer `project_type` en `IntegrationRecommendationContext`. Registrado como DEBT en comentario inline del archivo.
- [x] **I15.76** Diseñar mensajes de Optimus recomendando herramientas
  > Campo `reason` es el mensaje de Optimus — concreto, causal, sin texto marketinero. Badge "Optimus" en el card identifica la fuente. Mensajes revisados: datos reales, módulos nombrados, efectos medibles.

### BLOQUE G0 — Contrato canónico de agentes
> Obligatorio antes de implementar ningún agente.
> Sin esto los agentes crean señales conflictivas, banalización y un segundo motor caótico.
> Equivalente a OPTIMUS_CHARACTER.md pero para el sistema de agentes completo.
> Este documento debe existir y estar aprobado antes de arrancar cualquier tarea de BLOQUE G.

- [x] **I15.G0.1** Definir propósito exacto de cada agente (qué dominio observa, qué no toca)
- [x] **I15.G0.2** Definir qué decisiones puede influir cada agente
- [x] **I15.G0.3** Definir qué decisiones no puede tocar ningún agente (reservado al engine central)
- [x] **I15.G0.4** Definir formato obligatorio de output de agente
- [x] **I15.G0.5** Definir niveles de confidence y umbrales mínimos para emitir insight
- [x] **I15.G0.6** Definir cuándo un agente informa (dato) y cuándo recomienda (acción)
- [x] **I15.G0.7** Definir cómo escalan al engine central sin sobreescribir `getNextAction()`
- [x] **I15.G0.8** Definir reglas anti-contradicción entre agentes
- [x] **I15.G0.9** Definir síntesis final única para evitar 5 voces paralelas al founder
- [x] **I15.G0.10** Definir límites anti-ruido y anti-Goodhart (mismos riesgos que G4.7 — señal de gaming)
- [x] **I15.G0.11** Definir trazabilidad del insight al dato origen (de qué tabla/sync viene la afirmación)
- [x] **I15.G0.12** Definir política de "no insight" cuando no haya base de datos suficiente
  > Todo el Bloque G0 cubierto en `AGENTS_CONTRACT.md` v1.0 (2026-03-15). 13 secciones: dominio por agente, jerarquía de autoridad, decisiones reservadas al engine central, schema AgentInsight + catálogo de insight_types, umbrales de data_points por tipo, informa vs recomienda, escalada como contexto (cap 3 insights), anti-contradicción (motor central gana), síntesis determinista con prioridad Finance>Sales>Execution>Team>Calendar, anti-ruido (ventanas por severidad) + anti-Goodhart (signal_integrity check), trazabilidad entity_ids→sync_run, política de silencio, tabla de invariantes de aceptación.

### BLOQUE G — Agentes especializados
> RIESGO ALTO: 5 agentes que generan insights y conectan al engine = segundo motor en paralelo.
> Prerequisito completo: BLOQUE G0 aprobado + BLOQUE A + A2 cerrados.
> I15.G0.1–I15.G0.12 son prerequisito de cada tarea de este bloque.

- [x] **I15.77** Definir contrato base de agente (schema de insight, guardrails, anti-ruido)
  > `AGENTS_CONTRACT.md` cubre los cuatro puntos de aceptación: (1) no-emission §12 — data_points, confidence, stale, no-entities → silencio; (2) umbrales mínimos §5 — tabla por insight_type con completeness_factor; (3) anti-spam §10 — ventanas por severity; (4) trazabilidad §11 — entity_ids → integration_entities → connection → sync_run. **3 gaps encontrados y cerrados en esta revisión:** (a) `integration_insights` table faltaba `expires_at` + `include_in_context` — migración `20260318000002_bloque_g_insights_schema_fix.sql` añade ambas columnas con índices; (b) `expires_at` por insight_type no estaba definido — tabla añadida al §10 del contrato; (c) `generated_at` vs `source_timestamp` — aclarado en comentario de la migración. Finance Agent puede leer `key_metrics.mrr` (hidratado por Stripe sync) como input, y escribir a `project_economic_profile.arr_estimado` vía guard; esto no requiere cambio de contrato (target_table='project_economic_profile' ya estaba en §2 + §4.4).
- [x] **I15.78** Crear Finance Agent
  > `src/lib/finance-agent.ts` — lógica pura: `computeCashFlowSignal` (min 1 sub activa) + `computeRevenueConcentration` (min 3 subs con customer_id). Anti-spam §10 por expires_at. Confidence hereda de entidades × completeness_factor (§5). `src/services/financeAgentService.ts` — lee `integration_entities`, obtiene `sync_run_id` del último sync completado, aplica anti-spam, inserta en `integration_insights`, invalida cache `['finance_insights', projectId]`. `src/components/integrations/FinanceInsightsCard.tsx` — lee insights activos (expires_at > now), display con severity badge, summary, implication, action_hint, trazabilidad (data_points + timestamp). Integrado en `StripeIntegration.tsx`: corre post-sync silenciosamente (falla no interrumpe flujo). **Motor writes: NO en v1** — I15.DEBT.5. **Deferred insight_types:** `mrr_trend` (requiere 2+ syncs), `runway_estimate` (requiere Holded), `expense_spike` (requiere entidades expense).
- [!] **I15.79** Crear Sales Agent
  > DIFERIDO — HubSpot sync no existe. Prerequisito: I15.93 (Integración HubSpot). Sin datos de ventas reales, el agente sería un stub sin señal.
- [x] **I15.80** Crear Execution Agent
  > `src/lib/execution-agent.ts` — lógica pura: `computeTaskCompletionRate` (min 5 tasks, 48h) + `computeOverdueRatio` (min 3 open con due_date, 24h, solo emite si hay >=1 vencida). Confidence = avg_entity_confidence × completeness_factor (§5). `src/services/executionAgentService.ts` — lee `integration_entities[entity_type='task', provider='asana']`, anti-spam §10, inserta en `integration_insights[agent_type='execution']`. `src/components/integrations/ExecutionInsightsCard.tsx` — mismo patrón que FinanceInsightsCard con badge "Execution Agent". Integrado en `AsanaIntegration.tsx`: corre post-sync silenciosamente. **Deferred insight_types:** `execution_drop` (requiere 2+ syncs históricos), `milestone_at_risk` (requiere entidades milestone). **Sin motor writes en v1** — escribe `execution_health` al Phase Engine en v2 (AGENTS_CONTRACT.md §3).
- [!] **I15.81** Crear Team Agent
  > DIFERIDO — Slack es output-only. No importa datos de equipo. Sin fuente de datos de comunicación/actividad real, el agente no tiene señal.
- [!] **I15.82** Crear Calendar Agent
  > DIFERIDO — GCal sync no existe. Prerequisito: I15.97 (Integración Google Calendar).
- [x] **I15.83** Definir formato estándar de insight — `SynthesizedInsight` en agent-synthesis.ts + `InsightPayload` en cards individuales. Implementado en AGENTS_CONTRACT.md §4.
- [x] **I15.84** Diseñar reglas anti-ruido — anti-spam por `expires_at` en integration_insights; `include_in_context` flag para filtrar en síntesis. AGENTS_CONTRACT.md §10.
- [x] **I15.85** Diseñar sistema de confidence — Finance Agent: r²×direction×recency. Execution Agent: avg_confidence×completeness_factor(min=5). AGENTS_CONTRACT.md §5.
- [x] **I15.86** Diseñar sistema de priorización entre agentes — `prioritizeInsights()` en agent-synthesis.ts: severity×100 + agent_weight×10 + confidence×9. AGENTS_CONTRACT.md §7.3.
- [x] **I15.87** Diseñar síntesis entre agentes — `synthesizeAgentContext()` en agent-synthesis.ts: top N priorizados excluyendo conflictivos (loser excluido). v1 max=2.
- [x] **I15.88** Diseñar resolución de conflictos entre agentes — `detectConflicts()` en agent-synthesis.ts: mismo dominio + delta severidad ≥ 2. Finance+Execution ortogonales → [] en v1.
- [x] **I15.89** Conectar agentes con Next Action — `useAgentContext` hook + sección de señales de agente en ProjectEnginePanel dentro del div Next Action. Sin sobreescribir getNextAction.
- [x] **I15.90** Definir impacto en Risk/Probability — `computeAgentRiskModifier()` en agent-synthesis.ts mapea insights activos a delta numérico (cash_flow/revenue_concentration/task_completion_rate/overdue_ratio × severity). `useAgentContext` retorna `riskModifier`. ProjectEnginePanel muestra `+N ag.` junto al score del motor cuando hay presión de agentes. Motor DB intacto — overlay cliente v1, DB write vía trigger en v2.

### BLOQUE H — Providers
> Cada provider requiere: conexión · sync inicial · sync incremental · manejo de errores · normalización.

**Orden de ejecución de providers (decidido 2026-03-15):** Stripe → Holded → HubSpot → resto.
> Stripe primero: valida arquitectura completa (conexión→sync→normalización→integration_entities→Finance Agent→write_integration_to_engine_table→motor) y entrega verdad económica útil (MRR real, trigger automático en probabilidad). Holded segundo: completa lo que Stripe no ve (gastos, payroll, márgenes). HubSpot tercero: ventas/pipeline.
>
> **Scope Stripe v1 (no cambiar):** conexión + import manual inicial + write-through limpio + efecto en motor. Sin webhooks, sin sync incremental, sin backfill perfecto en el primer corte. Eso va en v2 cuando la arquitectura esté validada con datos reales.

**Finanzas:**
- [ ] **I15.91** Integración Holded — 2º provider (fix stub: tablas, auth, sync real, lado de gastos/payroll/márgenes)
- [ ] **I15.92** Integración Stripe — 1er provider, primer corte (conexión + import manual + write-through + efecto en motor. Sin webhooks/incremental/backfill en v1)

**Ventas:**
- [ ] **I15.93** Integración HubSpot — 3er provider (desde cero)

**Operaciones:**
- [x] **I15.94** Integración Asana (desde cero)
  > `supabase/functions/connect-asana/index.ts` — valida PAT contra Asana /users/me, extrae workspace_gid, upserta integration_connections con metadata={workspace_gid, workspace_name}, guarda PAT cifrado via upsert_integration_credential. `supabase/functions/sync-asana/index.ts` — full+incremental sync (modified_since), paginación cursor-based (máx 10p/1000t), normaliza via normalizeAsanaTask, upserta integration_entities, escribe tasks con confidence>=0.8 via write_integration_to_engine_table(target='tasks'). Status mapping: open→todo, completed→done. Sin run_probability_engine (tasks no afectan motor financiero). `src/components/integrations/AsanaIntegration.tsx` — UI con PAT input, tutorial post-conexión, stats de sync, SyncHealthCard, tabla "Qué entra·Dónde va·Qué cambia". `IntegrationsView.tsx` — Asana card en grid + tab añadido. **Prerrequisito verificado:** columnas tasks.external_provider/external_id/external_synced_at ya existían en migración 20260315000004. **I15.80 desbloqueado cuando haya datos reales en integration_entities[entity_type='task'].**
- [ ] **I15.95** Integración Trello (desde cero)

**Comunicación:**
- [ ] **I15.96** Integración Slack (fix schema mismatch + completar notification_types)

**Agenda:**
- [ ] **I15.97** Integración Google Calendar (fix OAuth token persistence + sync)

### BLOQUE I — Superficies de inteligencia
> **Deuda de diseño registrada (2026-03-15):** los paneles de inteligencia deben resolver el estado
> "insight ya visto por el founder". Sin esto, los agentes pueden mostrar el mismo insight repetidamente
> aunque el founder ya lo haya procesado. No es anti-ruido de emisión (ya cubierto en AGENTS_CONTRACT.md §10)
> — es estado de lectura de UI. Decisión a tomar antes de implementar estos paneles: ¿insight se marca
> como "leído" por sesión, por fecha, o por confirmación explícita del founder?

- [ ] **I15.98** Financial Intelligence Panel
- [ ] **I15.99** Sales Intelligence Panel
- [ ] **I15.100** Execution Intelligence Panel
- [ ] **I15.101** Team Intelligence Panel
- [ ] **I15.102** Calendar Intelligence Panel

### BLOQUE J — Observabilidad

- [ ] **I15.103** Eventos de conexión
- [ ] **I15.104** Eventos de sync
- [ ] **I15.105** Eventos de insight generado
- [ ] **I15.106** Eventos de acción recomendada
- [ ] **I15.107** Integrar errores de integraciones con Sentry
- [ ] **I15.108** Panel interno de salud de integraciones

### BLOQUE K — Seguridad

- [ ] **I15.109** Cifrado de credenciales (reemplaza api_key plano actual)
- [ ] **I15.110** Rotación de tokens
- [ ] **I15.111** Permisos por rol
- [ ] **I15.112** Audit log
- [ ] **I15.113** Política de borrado
- [ ] **I15.114** Limitación de scopes
- [ ] **I15.115** Protección contra abuso de API

### BLOQUE L — Experiencia de confianza

- [ ] **I15.116** Pantalla de confianza
- [ ] **I15.117** Explicar qué datos se usan
- [ ] **I15.118** Explicar qué datos no se usan
- [ ] **I15.119** Mostrar permisos solicitados
- [ ] **I15.120** Mostrar actividad de integración
- [ ] **I15.121** Mostrar valor generado por integración

### BLOQUE M — Estrategia de producto

- [ ] **I15.122** Definir integraciones core
- [ ] **I15.123** Definir integraciones beta
- [ ] **I15.124** Definir impacto en pricing futuro
- [ ] **I15.125** Definir límites por plan
- [ ] **I15.126** Definir roadmap de providers

---

## TAREAS EXTRA (surgidas por el camino)
> Tareas no planificadas en el roadmap original que se hicieron por necesidad técnica o de producto.
> Se listan aquí para no perder el rastro de trabajo real hecho.

- [x] **XE.1** Eliminación completa del sistema `OnboardingWizard` — ~40 archivos borrados
  > Surgió al auditar el código: el wizard era autorreferencial (escribía en el mismo tab que lo leía)
  > y no tenía consumidores externos reales. Código muerto con apariencia de feature.
  > _Hecho: 2026-03-10_

- [x] **XE.2** Auditoría y cierre de `ENGINE_SPEC_V1.md §8` (EP sprint)
  > Surgió al revisar pendientes del engine. Se encontró que EP.1 (AcquisitionChannelEditor
  > "Validado hoy") ya estaba implementado antes del sprint — la spec estaba desactualizada.
  > EP.2 (badges → phase_state.current_phase) sí era trabajo real y se completó.
  > EP.3 (C3.4) derivó a DIFERIDO por deuda de datos.
  > _Hecho: 2026-03-10_

- [x] **XE.3** Next Action engine centralizado (`getNextAction` v1.2 en `src/lib/next-action.ts`)
  > v1.1: función única con 8 reglas priorizadas en `ProjectEnginePanel.tsx`.
  > v1.2 (2026-03-13): extraída a `src/lib/next-action.ts` para reutilización en ResetSurface
  > (contexto §8 para Optimus). Imports actualizados en ProjectEnginePanel, ReentrySurface,
  > CostOfIgnoring, UnlockModeCard. tsc limpio. Esto cubre parcialmente U6.3.
  > _Hecho: 2026-03-10 / actualizado 2026-03-13_

- [x] **XE.8** B1 — ResetSurface ritual UI completo (pre-launch bloqueante)
  > Q1–Q5 form (7 campos) + submit_strategic_reset() + Edge Function `ritual-optimus` (§8 Optimus)
  > + output display (next_bet arriba, summary, main_learning, key_bottleneck, recommended_action).
  > Fallback si Optimus falla: muestra cycle_evaluation + "Comenzar ciclo N+1" disponible.
  > ProjectPage.tsx: onComplete() invalida ['ritual-pending', projectId] → surface → 'engine'.
  > Escape hatch (onSkip) conservado para salida antes de completar.
  > _Hecho: 2026-03-13_

- [x] **XE.4** TASK_LIST.md como documento vivo — establecido como fuente de verdad de progreso
  > Surgió al detectar que el seguimiento de tareas estaba disperso en planes desactualizados.
  > Se consolidó todo en este archivo con estados verificados contra código real.
  > _Hecho: 2026-03-11_

- [x] **XE.5** `seed_simulation_data(p_owner_id UUID)` — bootstrapping para calibration gate
  > Surgió del problema de bootstrapping: el calibration gate requiere 14 días de datos reales,
  > pero sin usuarios no hay datos. Solución: 20 proyectos simulados (5 familias × 4 variaciones)
  > con estados de motor precargados y run_notification_batch() al final.
  > Migración **00039**. Limpieza: `DELETE FROM projects WHERE created_by = $owner AND icon = '🧪'`.
  > _Hecho: 2026-03-11_

- [x] **XE.6** Calibración del motor de notificaciones — 3 bugs críticos encontrados y cerrados
  > Surgió al ejecutar el seed contra la DB remota y validar los paneles de calibración.
  > G9.10: `run_notification_batch()` Layer 1 only (migration 00036 no se aplicó → 00042 fuerza re-aplicación).
  > G9.11: `notify_bottlenecks` referenciaba `strategic_blocks.created_at` (columna no existe, es `first_detected_at`) → 00045.
  > G9.12: `notify_probability_changes` usaba `format('%.0f')` inválido en PostgreSQL → `%s + ROUND()::TEXT` → 00046.
  > Los 3 bugs causaban que el `EXCEPTION WHEN OTHERS` del loop per-proyecto hiciera rollback silencioso de todas las notificaciones de layers 2-5.
  > Estado final: batch genera 34 notificaciones (29 críticas) en una sola ejecución para 40 proyectos simulados.
  > También corregida query Panel 3 del calibration gate: `acquisition_channels → project_acquisition_channel`.
  > _Hecho: 2026-03-11_

- [x] **XE.7** Fix G9.7 + aislamiento per-step en run_notification_batch — migración 00047
  > G9.7: `notify_viability_changes` emitía `viability_resolved` para cualquier proyecto
  > con `viability_status='healthy'`, aunque nunca hubiera tenido un evento crítico o de
  > monitoreo. Fix: EXISTS check sobre `notifications` donde `type IN ('viability_critical',
  > 'viability_monitoring') AND metadata->>'project_id' = p_project_id::text AND created_at
  > > NOW() - INTERVAL '60 days'`. Sin evento previo en 60 días → no se emite resolved.
  > Aislamiento per-step: el loop por proyecto pasa de 1 BEGIN...EXCEPTION cubriendo 5
  > funciones a 5 bloques BEGIN...EXCEPTION individuales. Un fallo en notify_bottlenecks
  > ya no descarta las notificaciones generadas por notify_phase_changes/viability/risk.
  > RAISE WARNING incluye project_id, nombre de función y SQLERRM para diagnóstico.
  > _Hecho: 2026-03-12_

- [x] **XE.10** Next Action Phase 4 — `getNextAction()` v1.2 en `ProjectEnginePanel.tsx`
  > Gap detectado en V11.1 audit: `getNextAction()` cubría fases 1–3, devolvía `null` en Phase 4.
  > Phase 4 = Escala (terminal en v1). Añadidos tiers 9–12: (9) ops degradadas → create_obv;
  > (10) sin datos MRR (probStatus=inactive/low_confidence) → add_metrics; (11) hard signal no
  > cumplida → add_metrics revisar condiciones; (12) hard signal cumplida → add_metrics mantener
  > momentum. Phase 4 nunca devuelve null. probStatus = proxy O4.1 (crecimiento MRR);
  > opsWeak en Phase 4 = regresión operativa (pasaron Phase 3, algo se degradó).
  > _Hecho: 2026-03-12_

- [ ] **XE.9** Tabla de contrato engine → notificaciones — documento de referencia (no migración)
  > Riesgo de deriva semántica detectado en auditoría de interfaces 2026-03-12: los tipos de
  > notificación pueden desacoplarse silenciosamente del significado actual del engine si alguien
  > cambia un threshold o renombra un estado. Artefacto mínimo: tabla con columnas
  > `señal_engine | función_notify | tipo_notificacion | copy | threshold | resolved_exige_antecedente`.
  > No requiere migración — es documentación operacional. Crear antes de que haya más de 2
  > desarrolladores tocando el sistema de notificaciones.

- [x] **XE.8** Runtime observabilidad — 3 views + snapshot diario — migración 00048
  > Componentes: tabla `notification_health_snapshots` (captured_at, panel, environment, data JSONB;
  > RLS enabled; índice en panel+captured_at). 3 views SECURITY INVOKER: `v_notif_health_volume`
  > (volumen tipo/severidad/día, 14d), `v_notif_health_critical` (unread/emailed/read ratio, 14d),
  > `v_notif_health_per_entity` (por usuario y proyecto, 7d). Función
  > `capture_notification_health_snapshot(env TEXT DEFAULT 'production')` SECURITY DEFINER — inserta
  > 3 filas. pg_cron `0 8 * * *` UTC diario. Snapshot inicial insertado al final de la migración
  > como baseline día 0 (2026-03-12 07:45 UTC, 3 filas: 29 críticas, read_ratio=0.0, email_ratio=0.0).
  > Sin esto, al fin de las 2 semanas solo habría punto actual; con esto existe serie temporal completa.
  > _Hecho: 2026-03-12_

---

## RESUMEN TOTAL

| Fase | Nombre                     | Hecho | Total | Estado              | Depende de     |
|------|----------------------------|-------|-------|---------------------|----------------|
| 1    | Matemática y fundamentos   | 12    | 12    | ✅ 100%             | Nada           |
| 2    | Base de datos              | 19    | 19    | ✅ 100%             | Fase 1         |
| 3    | Fixes de código            | 5     | 6     | ✅ 83% (1 dif.)     | Nada           |
| 4    | Engines backend            | 24    | 24    | ✅ 100%             | Fases 1+2      |
| 5    | Onboarding                 | 9     | 11    | 🔄 82%              | Fase 4         |
| 6    | UX Core                    | 15    | 15    | ✅ 100%             | Fases 4+5      |
| 7    | Notificaciones             | 7     | 7     | ✅ 100%             | Fase 4         |
| 8    | Optimus y psicología       | 7     | 13    | ✅ v1 (6 dif.)      | Fases 4+6      |
| 9    | Contenido y playbooks      | 8     | 8     | ✅ 100%             | Nada           |
| 10   | Strategic Reset Ritual     | 5     | 5     | ✅ 100%             | Fases 4+8      |
| 11   | Features por fase y modo   | 10    | 10    | ✅ 100%             | Fases 4+5      |
| 12   | Sistemas avanzados         | 0     | 8     | ❌ 0% (post-MVP)    | Post-MVP       |
| 13   | Edge cases                 | 8     | 10    | 🔄 80%              | Antes lanzar   |
| 14   | Monetización               | 0     | 5     | ❌ 0%               | Prod. validado |
| 15   | Integraciones y agentes    | 25    | 157   | 🔄 16%              | F14 + usuarios |
| **TOTAL** |                     | **152**| **310**| **49%**           |               |

> Nota: 10 tareas extra (XE): 9 completadas, 1 pendiente (XE.9). Total con XE: 161/320.

---

## Tareas diferidas — resumen

| ID    | Descripción                              | Motivo                                                    | Revisar cuando                         |
|-------|------------------------------------------|-----------------------------------------------------------|----------------------------------------|
| C3.4  | calculate_role_performance_score         | ~10 inputs inexistentes en DB. Métrica sin base real.     | v2, con datos reales acumulados        |
| O5.4  | Adaptar generate-business-ideas edge fn  | Optimizar antes de saber si el path generativo tiene uso. | Tras primeros 20-30 usuarios reales    |
| O5.7  | Double filter para ideas                 | Riesgo de drop-off sin datos de comportamiento.           | Tras primeros datos de conversión      |
| P8.9  | Escalada de bloqueo (block_weeks_active) | traction/clarity sin timestamp de inicio; solo structural tiene first_detected_at. | Cuando block_weeks_active derivable desde historial |
| P8.11 | Conectar SWOT → structural_block        | competitive_analysis.swot es JSONB AI, sin scoring numérico extraíble. | v2 si se añade capa de scoring sobre SWOT |

---

## Agujeros detectados — registro acumulado

> Gaps encontrados durante implementación y auditoría. No son bugs bloqueantes salvo los marcados 🔴.
> Se tratan cuando se considere oportuno: en la tarea original, como XE, o como v2.
> Severidad: 🔴 Crítico · 🟠 Alto · 🟡 Normal · 🟢 Bajo/v2
> Última auditoría completa: 2026-03-11 (análisis automatizado backend + frontend)

---

### FASE 2 — Base de datos

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G2.1 | 🟠 | `obvs.responsable_id` FK | Sin `ON DELETE SET NULL`: cuando un `profiles` se borra, los OBVs quedan con FK colgante. `tasks.leader_id` sí tiene el SET NULL. | OBVs huérfanos; queries de owner-responsable inconsistentes | `ALTER TABLE obvs ALTER COLUMN responsable_id ADD ... ON DELETE SET NULL` |
| G2.2 | 🟡 | Engine history tables | Faltan índices compuestos en `project_phase_history`, `project_probability_history`, `viability_events`, `project_function_coverage`. Los crons hacen full-scan en proyectos con historial largo. | Degradación de rendimiento con volumen | Añadir `CREATE INDEX` compuestos en migración 00033+ |
| G2.3 | ✅ | RLS — `project_economic_profile` y `project_org_state` | ~~Sin políticas RLS~~ — **CERRADO** por migration 00029 (2026-03-10): añade `ALTER TABLE project_org_state ENABLE ROW LEVEL SECURITY` + policy "org_state: members read". `project_economic_profile` tenía policy desde migration 00001. Verificado con Read directo de 00029. |
| G2.4 | 🟠 | `engine_version NOT NULL` FK en todas las tablas de motor | FK obligatoria (`project_phase_state`, `project_probability`, `project_risk_score`, `project_viability_state`, `project_economic_profile`) sin DEFAULT garantizado si `engine_versions` no está seed. El trigger `fn_initialize_project_data` hardcodea fallbacks frágiles. Migración 00010 demostró el patrón es propenso a errores (puso `'risk'` como engine_version de economic_profile, corregido en 00024). | Creación de proyectos puede fallar con FK violation en edge cases | Añadir DEFAULT explícito o hacer nullable para fase inicial; resolver antes de G5.3 y G5.9 |
| G2.5 | 🟡 | `onboarding_data` JSONB blob | Columna catch-all sin schema versioning, sin índices, sin validación de claves. Typos como `first_steps_complet` fallan silenciosamente. El frontend castea a `Record<string, unknown>` en 11+ lugares. | Datos silenciosamente perdidos; difícil de migrar si cambia la estructura | Definir interface TypeScript centralizada; añadir índice GIN; considerar tabla `onboarding_steps` a largo plazo |

---

### FASE 3 — Fixes de código

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G3.1 | 🟢 | C3.6 — TaskForm.tsx | Validación leader ≠ executor solo en frontend. El CHECK constraint DB (migration 00032) es la garantía real. El frontend puede bypassearse con llamada directa a API. | Bajo — constraint DB protege la invariante | Documentado. Como está es correcto. |

---

### FASE 4 — Engines backend

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G4.1 | ✅ | Acceleration triggers — migration 00019 + 00031 | ~~OBV no recalcula fase~~ — **CERRADO** por cadena: migration 00019 añadió `trg_obvs_insert_outcome_phase` (INSERT con obv_outcome NOT NULL → run_phase_engine) + migration 00031 hizo `obv_outcome NOT NULL` → toda creación de OBV dispara recálculo. Verificado con Read directo de ambas migraciones. |
| G4.2 | 🟠 | Economic profile engine — migration 00024 | `run_economic_profile_engine` hace UPSERT en `project_economic_profile` pero **nunca inserta en `project_economic_profile_history`**. Todos los demás motores (Phase, Probability, Risk, Viability) sí insertan en sus history tables. | Sin trazabilidad de evolución del perfil económico. Imposible detectar cuándo cambió el `model_type`. | Añadir INSERT INTO `project_economic_profile_history` al final de la función, igual que hace el phase engine |
| G4.3 | 🟡 | Viability T3 — migration 00009 | El trigger T3 (overload) compara `v_growth_real >= v_benchmark_p50`. Si no hay benchmark para el cluster/modelo, `v_benchmark_p50` es NULL → la comparación es siempre FALSE (SQL 3VL). La spec F1.10 dice fallback al 5% mensual. | T3 nunca activa para clusters o modelos sin benchmark curado. Proyectos en overload no reciben alerta. | `v_benchmark_p50 := COALESCE(v_benchmark_p50, 0.05)` antes de la comparación |
| G4.4 | 🟡 | `compute_data_completeness` — migration 00007 | La variable `v_has_obv_4w BOOLEAN` se inicializa pero la subquery que la puebla puede devolver 0 filas (proyecto sin OBVs). En ese caso, la variable queda uninitialized → posible NULL exception en PostgreSQL. | Proyectos recién creados podrían crashear el cálculo de data_completeness | Añadir `v_has_obv_4w := FALSE` como valor inicial; `COALESCE` en la asignación |
| G4.5 | 🟡 | `run_org_capacity_engine` — migration 00026 | Si todos los miembros de un proyecto son eliminados, `v_total_members = 0`. La línea `role_fill_ratio = v_roles_filled / v_total_members` produce división por cero. | Engine crash en proyectos que quedan sin miembros | Añadir guard: `IF v_total_members = 0 THEN RETURN; END IF;` |
| G4.6 | 🟡 | Engine chain — crons 00004/00007/00021 | La cadena Phase → Probability → Risk → Viability → Economic → Org corre secuencialmente en crons separados. Si cualquier engine falla, los siguientes operan con datos de la semana anterior. No hay retry ni atomicidad entre motores. | Inconsistencias de datos visibles en el dashboard cuando un engine falla silenciosamente | Añadir tabla `engine_run_log` con status por motor; implementar retry a nivel de cron scheduler |
| G4.7 | 🟡 | `compute_validation_strength` — migration 00003 | Divergencia entre spec F1.2 y implementación. **Spec:** decay gradual `MAX(0.50, 1 - (semanas-8) × 0.10)` floor 0.50. **Implementado:** decay binario `IF fecha < 56d THEN ×0.80 ELSE ×1.00` floor 0.80. OBV débil de 6+ meses decae a 24 pts (no a 15 pts del spec). Anti-gaming de evidencia vieja existe pero es menos pronunciado de lo diseñado. Relevante para calibración de `signal_integrity` en FASE 8. | Protección parcial contra gaming de validation_strength con OBVs débiles y antiguos | Implementar decay gradual del spec: `GREATEST(0.50, 1.0 - (EXTRACT(WEEK FROM AGE(CURRENT_DATE, o.fecha)) - 8) * 0.10)` cuando semanas > 8 |

---

### FASE 5 — Onboarding y primera experiencia

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G5.1  | 🟡 | O5.5 — DiscoveryThinkingForm | Validación mínimo 15 chars en `riskiest_assumption` sin contador visual. Botón deshabilitado sin feedback. | UX — confusión | Añadir contador `N/15 caracteres` bajo el textarea |
| G5.2  | 🟡 | O5.5 — DiscoveryThinkingForm | `formatHypothesis` produce texto pobre si los inputs DT son muy cortos o genéricos. Sin validación de calidad mínima. | Calidad de datos de hipótesis | Añadir longitud mínima por campo (≥10 chars en pasos 1–4) |
| G5.3  | 🟡 | O5.8 — OnboardingProfileCard | Display-only: no escribe en `project_economic_profile`. Motor usa valores por defecto indefinidamente si el usuario no completa el perfil manualmente. | Motor económico con datos pobres | Resolver G2.4 (FK), luego añadir escritura al completar onboarding |
| G5.4  | 🟢 | O5.9 — FirstStepsPanel | `grid-cols-3` sin responsive. En mobile el panel queda muy estrecho. | Visual en móvil | `grid-cols-1 sm:grid-cols-3` |
| G5.5  | 🟡 | O5.9 — FirstStepsPanel | Action 1 es solo texto; sin scroll al ProjectEnginePanel lateral. El usuario tiene que buscar visualmente. | Fricción de navegación | Añadir scroll/CTA al panel lateral |
| G5.6  | 🟢 | O5.9 — FirstStepsPanel | Dismiss silencioso: si el write de `first_15_shown: true` falla, el panel reaparece en el siguiente reload. | Experiencia ocasionalmente inconsistente | Retry o confirmación visual de guardado |
| G5.7  | 🟡 | O5.10 — FaseBPanel | Dos paneles simultáneos (FirstStepsPanel + FaseBPanel) si el usuario no ha descartado el primero. Saturación visual. | UX — sobrecarga | No renderizar FaseBPanel hasta `first_15_shown === true` |
| G5.8  | 🟢 | O5.10 — FaseBPanel | `removeCompetitor` puede vaciar la lista sin hint orientativo. | UX menor | Mostrar `"Añade al menos 1 competidor"` al quedar vacío |
| G5.9  | 🟡 | O5.10 — FaseBPanel | `capital_intensity` excluido por `engine_version NOT NULL FK`. Perfil económico incompleto desde el onboarding. | Perfil económico incompleto | Resolver G2.4, luego añadir ítem 6 a FaseBPanel |
| G5.10 | 🟡 | O5.11 — MiModeloView | `hypothesis_maturity` y `riskiest_assumption` disponibles en `onboarding_data` pero no visibles en ningún bloque del Modelo. | Datos estratégicos invisibles | Sub-bloque "Hipótesis" en Bloque 1 o Bloque 2 |
| G5.11 | 🟠 | O5.1 — FaseACommon | Sin guardado intermedio entre preguntas. Un refresh durante las 9 preguntas (Q2–Q10) pierde todas las respuestas. | Pérdida de datos de onboarding | `useEffect` que guarda `onboarding_data.fase_a_draft` al cambiar cada respuesta; rehidratar al montar |
| G5.12 | 🟡 | O5.1 — AcquisitionChannelEditor | Sin constraint de unicidad por `channel_type` + `project_id`. El usuario puede añadir "SEO" dos veces sin error. | Datos duplicados en canales | `UNIQUE(project_id, channel_type)` en DB + validación frontend pre-insert |
| G5.13 | 🟡 | O5.1 — AcquisitionChannelEditor | `is_primary` no se desactiva en otros canales al activar uno. Puede haber múltiples canales primary simultáneos. | Integridad de datos — semántica ambigua de "principal" | Al toggle `is_primary: true`, actualizar todos los demás a false en la misma transacción |
| G5.14 | 🟡 | O5.1 — AcquisitionChannelEditor | Validación CAC incompleta: `parseFloat('abc')` devuelve `NaN`; el check `isNaN` existe pero el draft "abc" persiste en estado local. | Datos inválidos persistentes en UI | Validar antes de `parseFloat`; resetear draft si inválido |
| G5.15 | 🟠 | O5.10 — FaseBPanel | `mergeOD` hace read-then-write no atómico. Dos guardados simultáneos (ej. guardar sector mientras se añade competidor) pueden sobreescribirse. | Pérdida silenciosa de datos | Usar RPC con `UPDATE ... SET onboarding_data = onboarding_data || $patch` directamente, o serializar las escrituras |
| G5.16 | 🟡 | O5.10 — FaseBPanel | Auto-dismiss se dispara a los 2.5s aunque el usuario esté editando un campo activo. Puede interrumpir una escritura en curso. | UX — pérdida de contexto activo | Pausar el countdown si algún input tiene foco: `document.activeElement` check |

---

### FASE 6 — UX Core

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G6.1  | 🟡 | U6.1 — EngineIndicators | Tooltip "El factor más bajo es X (N%)" del spec no implementable sin exponer los 5 inputs individuales del probability engine en el hook. | Tooltip menos informativo | Expandir `useProjectEngineData` con los 5 inputs en U6.4 |
| G6.2  | 🟡 | U6.1 — EngineIndicators | En móvil el header no tiene espacio para los 3 indicadores. | Visual en móvil | `hidden md:flex` o versión condensada |
| G6.3  | 🟡 | ProjectPage — header | El header lee `project` de `useProjects()` que no se refresca cuando los stats del engine cambian. Puede mostrar fase o score desactualizados hasta page reload. | Header inconsistente con dashboard | Invalidar `['projects', 'with-phase-state']` desde `useProjectRealtimeSync` cuando cambien tablas de engine |
| G6.4  | 🟡 | ProjectDashboardTab — StatCards | Todos los StatCards tienen `progress={0}` hardcodeado. Las barras de progreso se ven incompletas o abandonadas. | UX — percepción de feature rota | Decidir: eliminar la barra de progreso de StatCard, o conectar a datos reales (ej. OBVs creados / objetivo de la fase) |
| G6.5  | ✅ | ProjectEnginePanel — getNextAction | ~~Sin CTA en regla 5~~ — **CERRADO** 2026-03-11: añadido `actionType: 'define_channel'` + `ctaLabel: 'Ir al canal'` a regla 5. Handler en `ProjectDashboardTab` hace scroll a `#acquisition-channel-editor` con highlight 2s. tsc limpio. |
| G6.6  | 🟠 | ProjectEnginePanel — getNextAction | La regla 2 ("riesgo alto") solo se activa en fase ≥3. Proyectos en fases 1–2 con `risk_level: 'high'` no reciben ningún aviso en el panel. | Proyectos early-stage en riesgo alto sin guía | Añadir regla independiente de fase para `risk_level === 'high'` en fases 1–2 |
| G6.7  | 🟡 | useRealtimeSubscription | Los handlers de `CHANNEL_ERROR` y `SUBSCRIBED` están vacíos. Si la conexión Realtime muere, no hay retry, no hay notificación al usuario, no hay fallback a polling. | Datos congelados silenciosamente después de desconexión | Añadir reconexión automática con backoff exponencial + indicador visual de "offline" |
| G6.8  | 🟡 | useProjectRealtimeSync | Al cambiar el estado de un engine, se invalida `['project-engine', projectId]` pero **no** `['projects', 'with-phase-state']`. El header del ProjectPage puede mostrar la fase anterior. | Fase del header desactualizada tras recálculo | Añadir invalidación de `['projects', 'with-phase-state']` en el handler de realtime |
| G6.9  | 🟢 | ProjectPage — tab state | `activeTab` es `useState('dashboard')` — se resetea a "dashboard" en cada page reload. El usuario pierde la tab activa. | UX menor | Persistir en `sessionStorage` o en URL params (`?tab=obvs`) |
| G6.10 | 🟡 | U6.14/U6.15 — CostOfIgnoring + UnlockModeCard | `deriveCostOfIgnoring` devuelve `severity: 'high'` para **cualquier** `create_obv` sin importar contexto (reglas 2 y 3 en CostOfIgnoring.tsx). Como `getNextAction` devuelve `create_obv` cuando faltan OBVs de validación (caso muy común en fases 1–2), `UnlockModeCard` se activa casi siempre en proyectos tempranos. Riesgo de banalización: si la alarma aparece constantemente, deja de servir de señal. | UnlockModeCard pierde valor de señal en proyectos early-stage | Calibración en v2 tras casos reales: añadir condición extra (`score < 40` OR `riskStatus === 'active'`) para `create_obv` genérico; reservar `high` + UnlockMode para create_obv en fase 3 (base operativa débil) o combinado con riesgo activo. |

---

### FASE 7 — Auth / Routing / Páginas restantes

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G7.1 | 🟡 | Auth.tsx · AuthPage.tsx | Variable shadowing en catch: `catch (_error)` pero el check es `if (error instanceof z.ZodError)`. `error` no está en scope → la validación Zod falla silenciosamente, el formulario nunca muestra errores de formato. Supabase rechaza el login igualmente pero con mensajes menos precisos. Confirmado en `Auth.tsx:43-47` y 4 lugares de `AuthPage.tsx`. | UX — mensajes de error imprecisos en login/signup | Cambiar `error` → `_error` en las 4 condiciones (`_error instanceof z.ZodError`) |
| G7.2 | 🟡 | useAuth.ts | `onAuthStateChange` no maneja `TOKEN_REFRESHED`. Si el token Supabase se renueva silenciosamente durante la sesión, el estado de auth no se notifica explícitamente. En la práctica `autoRefreshToken: true` en el cliente ya lo gestiona, pero hooks derivados (ej. perfil, roles) no se invalidarán. | Baja probabilidad de datos de perfil stale | Añadir `case 'TOKEN_REFRESHED': queryClient.invalidateQueries(['profile'])` en el listener |
| G7.3 | 🟢 | errorHandler.ts:315 | TODO pendiente: integración Sentry. Errores en producción no se envían a ningún sistema de tracking externo. | Debugging producción sin observabilidad | Integrar Sentry cuando se pase a producción real |
| G7.4 | 🟡 | PrimerInicioPage.tsx | No verificado si implementa guard `first_steps_completed: true → redirect dashboard`. Si no existe, el usuario puede volver a ver el wizard de primer inicio tras completarlo. | UX — wizard repetible | Verificar e implementar el guard de redirect |

---

### Edge Functions / API

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G8.1 | 🟡 | generate-business-ideas:92, generate-complete-business, ai-task-router | Variable shadowing en catch: `catch (_e)` pero check `if (error instanceof Response)` — mismo patrón que G7.1 pero en edge functions. El bloque de error handling de parse falla silenciosamente. Confirmado en `generate-business-ideas/index.ts:92-93`. | Parse errors no propagados correctamente | Cambiar `error` → `_e` en las condiciones de catch |
| G8.2 | 🟠 | generate-business-ideas, generate-financial-projections, generate-complete-business, export-excel | Ninguna de las funciones AI más costosas tiene rate limiting. Solo `ai-task-router` y `seed-users` usan el rate limiter persistente. Un usuario puede llamar `generate-complete-business` (16K tokens) sin límite. | Coste ilimitado en Anthropic | Añadir `RateLimitPresets.AI_GENERATION` (10 req/min) a todas las funciones AI |
| G8.3 | 🟡 | generate-financial-projections | Usa `validateAuth()` (valida JWT) pero no `validateAuthWithUserId(req, user_id)` — no verifica que el `projectId` del body pertenezca al usuario autenticado. Un usuario puede pasar un `projectId` ajeno. | Leak de proyecciones financieras de otros usuarios | Añadir check de ownership: `SELECT 1 FROM projects WHERE id=$projectId AND owner_id=auth.uid()` antes de procesar |
| G8.4 | 🟡 | Múltiples edge functions | Validación de inputs inconsistente: solo funciones de tipo `seed-*` usan `validateRequestSafe()` con schemas Zod. Resto (generate-*, export-excel, sync-stripe) solo hace checks null manuales. Valores como `growth_rate_monthly < 0` o `churn_rate > 100` pasan sin error. | Datos inválidos generan proyecciones absurdas | Aplicar `_shared/validation-schemas.ts` a todas las funciones con body de entrada |

---

### CRM / Tabs

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G10.1 | 🟡 | LeadDetail.tsx:147-160 | Editar un lead desde el panel lateral usa `supabase.from('leads').update()` directamente — no pasa por `leadService.recordStatusChange()`. Si el usuario cambia el status desde LeadDetail, el cambio se guarda en `leads` pero **no crea registro en `lead_history`**. Solo las transiciones via Kanban (drag & drop → `useCRMPipeline`) registran historial. | Audit trail incompleto — historial de CRM inconsistente | En `handleSave()`, detectar si `editData.status !== lead.status` y llamar a `leadService.updateStatus()` en vez del update directo para ese campo |

---

### Notificaciones / Suscripciones

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G9.1 | 🟡 | useNotificationsV2.ts:135-138 | `useUnreadNotificationsCount` no filtra por `read: false` — cuenta TODAS las notificaciones del usuario. El badge muestra el total, no las no leídas. Confirmado: query solo filtra por `user_id`. | Badge de notificaciones incorrecto | Añadir `.eq('read', false).eq('archived', false)` a la query |
| G9.2 | 🟡 | NotificationCenterV2.tsx | Sin paginación ni límite en la query de notificaciones — con volumen alto renderiza todos los items a la vez. Sin impacto en v1 dado el volumen esperado, pero no escalable. | Performance con >500 notificaciones | Añadir `.limit(50)` + "cargar más" en v2 |
| G9.3 | 🟠 | TrialCountdownBanner.tsx:37-40 | Flujo de upgrade completamente no implementado: `handlePlanSelected` solo cierra el modal (TODO explícito). Usuario que intenta hacer upgrade desde el banner llega a un modal que no hace nada. Confirmado: comentario `// TODO: Implementar upgrade en Fase 7`. | Conversión a plan de pago bloqueada | Implementar integración Stripe Checkout en Fase 7 |
| G9.4 | 🟠 | PlanLimitsIndicator + BD | Límites de plan son display-only. No existe trigger ni RLS policy que bloquee INSERT cuando `members_count >= plan.max_members`. Un usuario en plan Starter puede añadir miembros más allá del límite desde el backend. | Business logic bypass — plan enforcement roto | Añadir trigger `BEFORE INSERT ON project_members` que verifique límite del plan activo |
| G9.5 | 🟡 | useNovaData.ts (hook legacy) | 54 archivos importan `useNovaData` (queryKey `['projects']`) en lugar de `useNovaDataOptimized` (queryKey `['projects', 'with-phase-state']`). Dos caches separados: components con hook viejo nunca reciben `phase_state`. Confirmado: `grep -r "useNovaData'" src | grep -v Optimized` devuelve 54 archivos. | Datos de fase stale en componentes legacy | Migrar los 54 archivos a `useNovaDataOptimized` y eliminar el hook viejo |
| G9.6 | 🟡 | migration 00036 — `run_notification_batch()` | La función itera sobre todos los proyectos activos y ejecuta 5 queries por proyecto (phase, viability, risk, bottleneck, probability). Complejidad O(n_proyectos × 5 queries) por ciclo de 6h. Sin impacto en v1 con volumen bajo, pero se convierte en hotspot a partir de ~200 proyectos activos. Sin índice de cobertura en las tablas de salida de engine. | Degradación de rendimiento del cron con escala | Añadir índice `(project_id, created_at DESC)` en `project_phase_history`, `project_risk_score`, `project_viability_state`; considerar batch paralelo por proyecto |
| G9.7 | 🟡 | migration 00036 — `notify_viability_changes()` | `viability_resolved` se emite cuando `status = 'healthy'` con dedup de 30 días. Proyectos que siempre están en estado healthy reciben una notificación "Riesgo de viabilidad resuelto" cada 30 días sin que haya habido crisis previa. | Ruido — notificaciones spurias sin evento real | Añadir check de estado anterior: solo emitir `viability_resolved` si existe un `viability_critical` o `viability_monitoring` reciente (ej. últimos 60 días) en la tabla `notifications` |
| G9.8 | ✅ | migration 00037 — `notify_phase_changes()` | **CERRADO 2026-03-11** — `v_phase_regressed_fired BOOLEAN := FALSE` añadido al DECLARE. Se activa al entrar en el bloque `phase_regressed`; condición de `phase_critical` cambiada a `v_phase_status = 'critical' AND NOT v_phase_regressed_fired`. Supresión intra-ciclo sin query adicional. |
| G9.9 | ✅ | migration 00037 — `notify_phase_changes()` + `notify_probability_changes()` | **CERRADO 2026-03-11** — `OFFSET 1 LIMIT 1` sustituido por `WHERE calculated_at < (SELECT MAX(calculated_at) FROM ... WHERE project_id = p_project_id) ORDER BY calculated_at DESC LIMIT 1` en ambas funciones. Fix aplicado también a `project_probability_history` (misma causa raíz). |
| G9.10 | ✅ | migration 00036 — `run_notification_batch()` Layer 1 only | **CERRADO 2026-03-11** — El `CREATE OR REPLACE FUNCTION run_notification_batch()` de migration 00036 no se aplicó en el DB desplegado (posible fallo de statement sin rollback visible). La versión activa era la de 00035 (Layer 1 only). Evidencia: llamadas directas a `notify_viability_changes` generaban notificaciones; el batch no. Fix: migration 00042 fuerza re-aplicación de la versión completa Layer 1+2-5. Verificado: batch genera 33 notificaciones layer 2-5. |
| G9.11 | ✅ | migration 00036 — `notify_bottlenecks()` | **CERRADO 2026-03-11** — `notify_bottlenecks` referenciaba `strategic_blocks.created_at` pero la tabla usa `first_detected_at`. Causaba `column "created_at" does not exist` para cada proyecto → EXCEPTION WHEN OTHERS hacía rollback de todas las notificaciones del bloque (pasos 1-4: phase, viability, risk). Fix: migration 00045 — `created_at → first_detected_at`. |
| G9.12 | ✅ | migration 00037 — `notify_probability_changes()` | **CERRADO 2026-03-11** — Tres llamadas a `format()` usaban `%.0f` (C-printf) que PostgreSQL no soporta. Lanzaba `ERROR 22023: unrecognized format() type specifier "."` para proyectos con `probability_score < 20` (condición `probability_critical`). Al ser paso 5 del loop, el EXCEPTION hacía rollback de pasos 1-4. Fix: migration 00046 — `%.0f → %s + ROUND()::TEXT` en los 3 format strings. Verificado: batch genera `probability_critical` correctamente. |

---

### Backend Security / Auth

| ID   | Sev | Componente | Descripción | Impacto | Fix sugerido |
|------|-----|-----------|-------------|---------|--------------|
| G11.1 | 🟡 | migration 00052 — `get_ritual_optimus_context()` | Función `SECURITY DEFINER` sin auth check interno. Cualquier usuario autenticado puede llamarla con un `project_id` ajeno y leer `ritual_responses`, `engine_snapshot` y `cycle_evaluation` del ciclo cerrado de ese proyecto. Confirmado: función no tiene `IF auth.uid() NOT IN (SELECT member_id FROM project_members...)`. Las demás funciones del ciclo (`submit_strategic_reset`, `close_strategic_cycle`) sí verifican membresía. | Lectura de datos estratégicos privados cross-project | Añadir guard al inicio: `IF NOT auth_is_project_member(p_project_id) THEN RAISE EXCEPTION 'access denied'; END IF;` — patrón igual a `submit_strategic_reset` |

---

### Resumen por severidad

| Sev | Count | Gaps más críticos |
|-----|-------|-------------------|
| ✅ Cerrados | 8 | G4.1 · G2.3 · G6.5 · G9.8 · G9.9 · G9.10 (batch Layer 1 only) · G9.11 (bottlenecks created_at) · G9.12 (%.0f format) |
| 🟠 Alto    | 8 | G2.4 FK · G4.2 history · G5.11 refresh · G5.15 race · G6.6 CTA risk · G8.2 rate limit AI · G9.3 upgrade stub · G9.4 plan limits sin enforcement |
| 🟡 Normal  | 36 | Indexes, NULL, validaciones, auth, UX, edge functions, notificaciones, hook legacy, CRM audit, calibración motor notificaciones, G11.1 auth check |
| 🟢 Bajo/v2 | 6  | Mobile responsive, tab state, hints menores, Sentry |

---

*Última actualización: 2026-03-13*
*Para detalle de cada tarea → MASTER_ACTION_PLAN.md*
*Para fórmulas y especificaciones técnicas → ENGINE_SPEC_V1.md*
