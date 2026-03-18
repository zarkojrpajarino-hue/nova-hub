# TASK LIST — Nova Hub (Optimus-K)
> Lista completa de todas las tareas, ordenadas por fases de ejecución.
> Para detalle de cada tarea → ver MASTER_ACTION_PLAN.md
> Estado: [ ] Pendiente · [x] Completado · [~] En progreso · [!] Diferido (con motivo)
>
> **Última actualización: 2026-03-19 (Bloque 1 + FASE 19 completados)**
>
> ### Estado real por fase
> | Fase | Estado | Notas |
> |------|--------|-------|
> | FASE 1 — Matemática y fundamentos | ✅ CERRADA v1 12/12 + 2 v2 pendientes | Congelada — v1 no tocar |
> | FASE 2 — Base de datos | ✅ CERRADA v1 19/19 + 2 v2 pendientes | Columnas tasks/obvs pendientes de migrar |
> | FASE 3 — Fixes de código | ✅ CERRADA v1 5/6 + 1 v2 pendiente | C3.4 parcialmente cerrable con datos Asana |
> | FASE 4 — Engines backend | ✅ CERRADA v1 24/24 + 2 v2 pendientes | Migraciones 00004–00028 |
> | FASE 5 — Onboarding | ✅ CERRADA v1 9/11 + 1 v2 pendiente | O5.4 + O5.7 diferidos (requieren usuarios reales) |
> | FASE 6 — UX Core | ✅ CERRADA v1 15/15 + 2 v2 pendientes | |
> | FASE 7 — Notificaciones | ✅ CERRADA v1 7/7 + 2 v2 pendientes | |
> | Calibración post-F7 | ⏸ BLOQUEADA | Infraestructura lista · requiere usuarios reales |
> | FASE 8 — Optimus | ✅ CERRADA v1 7/13 + 2 v2 pendientes | Bloque C diferido (requiere datos acumulados) |
> | FASE 9 — Contenido y playbooks | ✅ CERRADA v1 8/8 + 2 v2 pendientes | |
> | FASE 10 — Strategic Reset | ✅ CERRADA v1 5/5 + 2 v2 pendientes | |
> | FASE 11 — Features por fase | ✅ CERRADA v1 10/10 + 2 v2 pendientes | PostHog instalado, VITE_POSTHOG_KEY pendiente |
> | FASE 12 — Sistemas avanzados | ⏸ POST-MVP 0/8 | No bloquea lanzamiento |
> | FASE 13 — Edge Cases | ✅ CERRADA v1 8/10 + 2 v2 pendientes | EC13.5 + EC13.9 diferidos con criterio |
> | FASE 14 — Monetización | ⏸ POST-VALIDACIÓN 0/5 + 1 v2 pendiente | Solo tras usuarios validados |
> | FASE 15 — Integraciones y agentes | ✅ CERRADA v1 (2026-03-18) + 2 v2 pendientes | 4 providers · 4 agentes · motor writes en prod |
> | FASE 16 — Adquisición y validación | 🔄 ACTIVA + 2 v2 pendientes | |
| **FASE 18 — Meeting Intelligence** | **🔄 ACTIVA Bloque X ✅ · Bloque A ✅** | **En curso** |
> | FASE 17 — Evidencia, fiabilidad y transparencia | ✅ CERRADA v1 32/32 + 4/5 v2 completadas | T17.V2.3 diferido hasta FASE 18 |
> | FASE 18 — Meeting Intelligence: cierre de loop estratégico | ⏸ POST-F16 0/49 + 3 v2 pendientes | Prerequisito: FASE 16 activa + Bloque 0 completado |
> | FASE 19 — Foco, Loop y Adaptación | ✅ CERRADA v1 14/14 + 3 v2 pendientes | Focus Block · Task Loop · UX Adaptativa |
> | FASE 20 — Análisis Estratégico IA v4 | ⏸ POST-F16 0/12 + 2 v2 pendientes | Prerequisito: FASE 16 activa + proyecto ≥14 días · Niveles se desbloquean con integraciones |
> | FASE 21 — Founder Toolkit | ⏸ POST-F16 0/8 + 2 v2 pendientes | Prerequisito: FASE 16 activa · Herramientas se desbloquean por triggers de comportamiento real |
> | FASE 22 — Expansion Intelligence | ⏸ POST-F21 0/9 + 2 v2 pendientes | Prerequisito: Fase 3+ · MRR estable 2 meses · riesgo no crítico · 1 integración activa |
>
> **Deudas técnicas abiertas:** I15.DEBT.2 (MRR diverge si upsert falla) · I15.DEBT.3 (GCal cancelados) · I15.FIX.7 (verify_jwt revierte en redeploys)
> **Diferidos conscientes F15 v2:** I15.91 (Holded) · I15.95 (Trello) · I15.96 (Slack) · I15.81 (Team Agent) · Bloques I–M

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

### Mejoras v2 — Formalizar matemática de sistemas nuevos (FASE 17/18)

- [ ] **F1.V2.1** Formalizar `combined_reliability` de Meeting Intelligence como spec matemática — el Bloque X de FASE 18 define `combined_reliability = transcription_confidence × clarity_score × speaker_certainty_weight`, pero estos 3 componentes y sus pesos no tienen spec matemática formal como sí la tienen Iteration Velocity (F1.1) o Risk Score (R1.1–R1.5). Sin una decisión formal aquí, cada iteración puede cambiar los pesos sin revisar el impacto en el resto del sistema. Definir: escala de cada componente (0–1), casos extremos (grabación inaudible, sin hablantes identificados), umbral de rechazo del insight (si combined_reliability < X → no emitir).
- [ ] **F1.V2.2** Extender la spec de `evidence_quality_score` (F1.2) con la escala de `SOURCE_WEIGHTS` — F1.2 definió el concepto de pesos de evidencia, pero FASE 17 T17.2 los implementó como constantes TypeScript sin una decisión formal de qué justifica cada peso. Documentar aquí: por qué Stripe=1.0, Holded=0.9, HubSpot=0.8, user_manual=0.6, ai_inferred=0.35. Con criterios formales en la spec matemática, cambiar un peso en el futuro requiere actualizar esta decisión — no solo editar un archivo TS.

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

### Mejoras v2 — Columnas y tablas que faltaron para sistemas nuevos (FASE 15/17/18)

- [ ] **D2.V2.1** `ALTER TABLE tasks ADD COLUMN external_provider TEXT, external_id TEXT, external_sync_at TIMESTAMPTZ` — I15.38 lo menciona como prerrequisito del normalizador de Asana pero la migración nunca se ejecutó. Sin estas columnas, las tareas importadas desde Asana no son distinguibles de las tareas manuales y la ejecución de FASE 19 B.5 (phase-relevant sorting) no puede separar tareas internas de externas.
- [ ] **D2.V2.2** `ALTER TABLE obvs ADD COLUMN source TEXT DEFAULT 'internal'` — I15.45 define que los deals de HubSpot entran como OBVs con `source='hubspot'`, pero la columna no existe en el schema actual. Sin ella, el CRM híbrido de FASE 15 no puede coexistir deals externos con OBVs manuales sin colisiones. Añadir también índice `idx_obvs_source` para filtros frecuentes.

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

### Mejoras v2 — Cerrar deuda técnica con datos ahora disponibles (FASE 15/19)

- [ ] **C3.V2.1** Cerrar C3.4 parcialmente usando `task_completion_rate` de Asana (Execution Agent, FASE 15) — C3.4 estaba diferido porque `execution_history` no existía. Con FASE 15, el Execution Agent escribe en `integration_entities` el estado de tareas de Asana por miembro (`assignee_external_id`). Esto cubre el input `execution_history` para los roles de delivery y operations (los dos más comunes). No cierra los 6 roles completos, pero cierra los 2 más importantes con datos reales verificados. El proxy `compute_role_execution_health` seguirá activo para roles sin datos de Asana.

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

### Mejoras v2 — Adaptación a FASE 19 (buildNextAction + Task Loop)

- [ ] **E4.V2.1** SQL RPC `get_project_task_stats(project_id UUID)` → devuelve `{ overdue_count INT, done_this_week INT, total_open INT }`. Necesario para que `buildNextAction()` (F19.A.2) detecte "≥3 overdue → CTA prioritario" sin añadir queries extra al dashboard. Una sola RPC vs 3 queries individuales.
- [ ] **E4.V2.2** Trigger `trg_task_feedback_engine` — al completar una tarea con `status='done'` AND `resultado IS NOT NULL` (feedback del loop F19.B.1) → ejecutar `run_phase_engine(project_id, 'task_completed_with_feedback')`. Actualmente E4.24 ejecuta el engine en "tarea completada" pero no distingue si hay feedback o no. Sin este trigger, el Task Loop de FASE 19 no propaga señal al motor.
- [x] **E4.V2.3** SQL view `v_engine_input_audit` — devuelve inputs de cada motor con fuente y timestamp. Prerequisito de FASE 17 (T17.3) y FASE 20 (F20.4 PreAnalysisDataReview).
  > `SELECT motor_name, input_key, input_value, source_type, source_description, captured_at, confidence FROM ...` via JOIN de tablas de output de engines + `integration_connections` para resolver `source_type`.
  > `source_type` = `'integration'|'declaration'|'computed'|'peer_validated'|'default'`. Ejemplo: `phase_engine | O2.1_verified_payments | 2 | integration | Stripe webhook · 2026-03-17 | 0.95`.
  > View SECURITY INVOKER. Sin tabla nueva — lee de `project_phase_state`, `project_probability`, `project_risk_score`, `project_economic_profile`, `key_metrics` + `inputs_sources JSONB` (E4.V2.4). Sin esta view, FASE 17 no puede construir la UI de "¿de dónde viene este dato?". Crear antes de iniciar FASE 17.
- [x] **E4.V2.4** Columna `inputs_sources JSONB` en tablas de output de engines — añadir a `project_phase_state`, `project_probability`, `project_risk_score`, `project_viability_state`, `project_economic_profile`.
  > Estructura: `{ "input_key": { "value": X, "source": "stripe|manual|computed", "captured_at": "ISO", "confidence": 0.9 }, ... }`. Actualizar cada función de engine para escribir este JSON al calcular.
  > Migración: ALTER TABLE en las 5 tablas (nullable, sin DEFAULT — NULL = registros pre-V4). Backfill: `inputs_sources = NULL` para histórico. En adelante, cada engine run escribe el JSON. Con este campo, `v_engine_input_audit` es una lectura directa sin joins complejos.

---

## FASE 5 — ONBOARDING Y PRIMERA EXPERIENCIA ✅ v1 CERRADA 9/11
> Requiere Fase 4 (engines calculando) para que los resultados tengan sentido.
> **v1 cerrada 2026-03-18.** 2 tareas diferidas conscientemente hasta validación con usuarios reales.

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

### Mejoras v2 — Adaptación a FASE 19 (useProjectContext)

- [ ] **O5.V2.1** Guardar `solo_mode: boolean` en `onboarding_data` durante Fase A — derivado de la pregunta "¿trabajas solo o con equipo?" (ya existe en SelectOnboardingTypePage). Alimenta `useProjectContext()` (F19.A.1) sin query adicional. Sin este campo, `useProjectContext` tiene que contar `project_members` en cada render para derivar `mode: 'solo'|'team'`, lo que añade una query que podría haberse evitado en onboarding.
- [ ] **O5.V2.2** Diseñar empty state de alto valor para Day 1 sin datos — actualmente onboarding cubre el flow técnico pero no el valor percibido en el primer login con cero integraciones, cero tareas, cero historial. Definir qué muestra el Focus Block, Optimus y el dashboard cuando no hay datos: mock guiado (no demo), acción concreta de "primer paso" según tipo de proyecto (idea/existing/scaling), y mensaje que explica POR QUÉ conectar una integración cambia lo que el sistema puede decirte. Sin un Day 1 de alto valor percibido, el 60% de founders abandona antes de que el sistema tenga datos suficientes para ser útil.
- [ ] **O5.V2.3** Modo Emergencia — 3er path de onboarding para fundadores con negocio en marcha y un problema urgente que resolver. Actualmente `SelectOnboardingTypePage` ofrece 2 paths: Discovery (idea) y Deep Setup (negocio existente estructurado). Añadir 3er path "Tengo un problema urgente" (⚡ Modo Emergencia) para fundadores que no tienen 20 minutos pero sí tienen un problema real que está costando dinero.
  > **Flujo — 4 pantallas en ≤3 minutos:**
  > **Pantalla 1 — Categoría del problema:** 6 opciones con icono + descripción breve: Facturación caída · Pipeline bloqueado · Equipo en conflicto · Cash en riesgo · Tracción estancada · Otro. Solo selección, sin campos libres aún.
  > **Pantalla 2 — Contexto mínimo:** 3 preguntas condicionales por categoría. Ej. Facturación: "¿En cuánto ha caído? (%, €)" + "¿Cuándo empezó?" + "¿Ya tienes identificada la causa o no sabes por dónde empezar?". Max 1 campo libre de texto por pantalla. El resto selección múltiple.
  > **Pantalla 3 — Diagnóstico Optimus:** edge function `emergency-diagnosis` recibe categoría + respuestas → diagnóstico directo 2-3 líneas + 3 tareas concretas priorizadas. Las 3 tareas se pre-crean en vista previa editable. El founder puede modificar los títulos antes de confirmar.
  > **Pantalla 4 — Setup mínimo:** nombre del proyecto + tipo de negocio (B2B/B2C/marketplace) + sector → crear proyecto directamente en estado operativo. Las 3 tareas se crean en `tasks` con `function_type` correcto + `source='emergency'` + `emergency_session_id`. Sin onboarding largo.
  > **In-app trigger:** el mismo modal de emergencia (pantallas 2-4) se activa para proyectos existentes cuando `project_risk_score.level = 'critical'`. Botón "⚡ Modo Emergencia" en `UnlockModeCard` cuando `isRiskCritical`. El founder con proyecto en crisis accede al diagnóstico sin crear nuevo proyecto.
  > **Migración:** tabla `emergency_sessions (id UUID, project_id UUID, problem_category TEXT, problem_answers JSONB, diagnosis JSONB, tasks_created INTEGER, triggered_from TEXT DEFAULT 'onboarding', created_at TIMESTAMPTZ)`. RLS: project members read/write. Índice en `project_id`.
  > **Nota técnica:** `HealthDiagnosticSection.tsx` en deep-setup/existing es un stub no funcional (health_score=72 hardcodeado, fake setTimeout 2.5s). Debe reescribirse usando `emergency-diagnosis` como backend — el Modo Emergencia de onboarding y el diagnóstico del deep-setup comparten el mismo edge function.
  > **Criterio:** usuario nuevo elige "Problema urgente" → en ≤3 minutos tiene proyecto creado + diagnóstico + 3 tareas concretas. Proyecto existente con `risk_level=critical` → botón visible en `UnlockModeCard` → diagnóstico en modal sin abandonar el proyecto actual.

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

### Mejoras v2 — Adaptación a FASE 19 (NextActionFocusBlock + WeeklySurface)

- [ ] **U6.V2.1** `ReentrySurface` → integrar `NextActionFocusBlock` (F19.A.4) al inicio del panel — actualmente `ReentrySurface` tiene su propio CTA pero no está conectada al Focus Block. Cuando FASE 19 construya el bloque, `ReentrySurface` debe renderizarlo en primer lugar (antes del estado de cambios), para que el primer elemento que ve un usuario que vuelve sea siempre "qué hacer ahora". Un usuario que regresa después de 7+ días necesita la señal más directa posible sin fricción de lectura.
- [ ] **U6.V2.2** `WeeklySurface` → añadir sección "Foco de la próxima semana" al final — actualmente la superficie solo muestra el review retrospectivo. Con `buildNextAction()` disponible (F19.A.2), el Weekly puede cerrar con la acción prioritaria de la semana siguiente. Convierte el review en un ciclo completo: pasado → presente → próximo paso.
- [ ] **U6.V2.3** `DataCompletenessCard` — indicador de completitud de datos antes de los engine scores
  > Colocado ANTES de `PhaseProgressBar` en `ProjectDashboardTab`. Solo visible si `data_completeness_score < 0.7` (7/10 inputs) — por encima, no mostrar (el sistema tiene suficiente data).
  > Contenido: donut "X/10 inputs disponibles" + lista de los inputs faltantes más críticos (máximo 3 + "Ver todos") + CTA por input ("Añadir en Mi Modelo", "Conectar Stripe", etc.). Datos desde `project_economic_profile.data_completeness_score` (E4.17).
  > Por qué crítico: sin completeness visible, el founder interpreta un score bajo como "mi proyecto va mal" cuando en realidad es "tengo pocos datos". Esta confusión causa abandono en Day 1-7. Impacto directo en retención. Prerequisito: E4.V2.4 disponible para saber qué inputs faltan.
- [ ] **U6.V2.4** `InputAuditModal` — modal de transparencia expandible desde cualquier score del engine
  > Trigger: botón discreto "ⓘ" junto al título en `RiskBreakdown`, `ProbabilityBreakdown` y `PhaseProgressBar`. Al clicar: modal small (max-w-md).
  > Contenido: tabla `Input | Valor | Fuente | Recogido | Confianza | [Actualizar]`. Datos desde `v_engine_input_audit` (E4.V2.3). Ejemplo: "runway_factor | 2.3 meses | Stripe (estimado) | hace 3 días | 0.80 | [Actualizar]". "[Actualizar]" navega al campo editable en Mi Modelo o lanza sync de la integración.
  > Sin E4.V2.3 disponible: modal muestra versión degradada "Fuente: disponible cuando conectes integraciones". No bloquear el desarrollo de esta UI por el backend.
  > Es la implementación principal de la regla de transparencia para el motor. El founder entiende el sistema en lugar de confiar ciegamente en un número.

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

### Mejoras v2 — Adaptación a FASE 18/19 (Meeting Intelligence + Task Loop)

- [ ] **N7.V2.1** Nuevo tipo de notificación `overdue_tasks_warning` — HIGH priority, ventana dedup 3 días. Trigger: `overdue_count >= 3` en `get_project_task_stats()` (E4.V2.1). Sin este tipo, el Task Loop de FASE 19 detecta tareas vencidas pero no puede escalar la señal fuera de la app. Formato: "Tienes N tareas vencidas — tu score de ejecución está en riesgo". Añadir a `run_notification_batch()` y a los caps existentes.
- [ ] **N7.V2.2** Nuevo tipo de notificación `meeting_suggested` — MEDIUM priority, ventana dedup 7 días. Trigger: `detect_meeting_triggers()` (M18.I.1) detecta ≥3 señales activas. Sin este tipo, las sugerencias de Meeting Intelligence (Bloque I de FASE 18) solo aparecen en el dashboard si el usuario abre la app — nunca llegan como notificación push. Formato: "Optimus detectó 3 señales que convergen — puede ser buen momento para una reunión de revisión".
- [ ] **N7.V2.3** Filtro de notificaciones por fase — tab "Relevante a mi fase" en `NotificationsView`
  > Fase 1: muestra solo `idea_validation`, `risk_*`, `probability_*`. Oculta `team_bottleneck` (sin equipo), `meeting_suggested` (sin historial).
  > Fase 2: añade `revenue_signals`, `validation_progress`.
  > Fase 3: añade `execution_health`, `team_bottleneck`, `bottleneck_detected`.
  > Fase 4: todas las categorías. Sin filtro, un founder Fase 1 ve "execution_health baja" que no le importa aún. UX progresiva aplicada a notificaciones.
- [ ] **N7.V2.4** Campo `root_cause_inputs JSONB` en tabla `notifications` + modal "¿Por qué recibí esto?"
  > Estructura: `{ signal_type: 'risk_critical', inputs: [{ name: 'runway_days', value: 14, source: 'HubSpot' }, ...] }`. Se escribe al emitir la notificación desde `notify_risk_changes()` etc.
  > UI: clic en notificación → expandible "¿Por qué?" → muestra inputs + fuentes que dispararon la señal. Ejemplo: "Risk Critical porque: runway=14 días (HubSpot) + execution_drop=25% (Computed)". Sin esto, el founder ve la alarma pero no sabe qué la causó ni cómo actuar.
  > **Nota:** N7.V2.1 y N7.V2.2 deben PROMOVERSE A CORE cuando FASE 19 (Task Loop) y FASE 18 (Meeting Intelligence) comiencen respectivamente — no son "mejoras opcionales" sino types requeridos por esas fases.

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

### Mejoras v2 — Adaptación a FASE 18 (Meeting Intelligence → Optimus)

- [ ] **P8.V2.1** `behavioral_block` — activación acelerada vía insights de reuniones (FASE 18 Bloque X). Actualmente P8.6 requiere 3+ semanas de `decision_events` acumulados. Con Meeting Intelligence, un insight tipo `blocker` que aparece en 2+ reuniones consecutivas debe poder activar `behavioral_block` antes del periodo mínimo. Añadir condición en `get_optimus_context()`: si `meeting_insights` tiene ≥2 blocker insights con mismo `insight_type` en las últimas 4 semanas → marcar `behavioral_block_candidate: true`. No reemplaza P8.6 — lo complementa con señal cualitativa más rápida.
- [ ] **P8.V2.2** Añadir `recent_decisions_from_meetings` al context packet de Optimus — `get_optimus_context()` debe incluir las 3 decisiones más recientes de `meeting_insights` (tipo `decision`, `status='approved'`). Actualmente el context packet no tiene datos de reuniones. Optimus en modo estándar o estricto necesita saber si ya se tomaron decisiones recientes antes de recomendar de nuevo. Añadir campo `recent_decisions: [{summary, decided_at}]` (max 3) al JSON de salida.
- [ ] **P8.V2.3** Mecanismo de feedback explícito en respuestas de Optimus — añadir thumbs up/down + categoría (irrelevante / equivocado / mal timing / muy obvio) en cada respuesta de Optimus. Guardar en tabla `optimus_feedback_events` con campos: `response_id`, `project_id`, `phase`, `feedback_type` (up/down), `category`, `created_at`. Sin feedback explícito, el único indicador de calidad es el CTR del Focus Block (PostHog) — útil para adopción pero ciego a errores cualitativos. Con 3 meses de datos, `optimus_feedback_events` permite identificar qué tipos de insight fallan en qué fase, y ajustar prompts con evidencia real en lugar de intuición.

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

### Mejoras v2 — Adaptación a FASE 19 (Focus Block + buildNextAction)

- [ ] **PL9.V2.1** Actualizar `OPTIMUS_PROMPTS.md` — añadir `focus_block_context` como input opcional del base template. Cuando `buildNextAction()` (F19.A.2) produce un output con `priority: 'critical'`, ese contexto debe entrar en el prompt de Optimus para que el coaching sea coherente con el foco activo del usuario. Sin esta actualización, Optimus puede recomendar algo diferente a lo que el Focus Block muestra — dos señales en conflicto en la misma pantalla.
- [ ] **PL9.V2.2** Actualizar `BENCHMARKS_V1.md` — añadir benchmarks de proceso para las nuevas métricas de FASE 19: (a) task completion rate semanal (rangos: <40% bajo / 40–70% esperado / >70% fuerte), (b) meeting-to-action conversion rate (insights de reunión que generan tareas: <20% bajo / 20–50% esperado / >50% fuerte). Ambas métricas serán comparables entre proyectos una vez FASE 19 esté en producción.

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

### Mejoras v2 — Adaptación a FASE 19 (Focus Block + Meeting decisions)

- [ ] **SR10.V2.1** Al completar el ritual → invalidar React Query key del Focus Block. Actualmente `submitRitual` invalida `['strategic_cycles', ...]` pero no el Focus Block (F19.A.4). Tras un ritual, el foco cambia — `buildNextAction()` debe recalcular con el nuevo estado del ciclo. Sin esta invalidación, el Focus Block puede mostrar el foco anterior durante horas hasta el siguiente polling.
- [ ] **SR10.V2.2** Añadir pregunta opcional al ritual: "¿Qué decisiones clave tomaste en reuniones este ciclo?". Input de texto libre, guardado en `ritual_responses.meeting_decisions_summary`. Alimenta `recent_decisions_from_meetings` en el context packet de Optimus (P8.V2.2). No obligatorio — un founder solo puede no tener reuniones, y no hay que penalizarle.
- [ ] **SR10.V2.3** Decision retrospective loop — 30 días después de cada `decision_event` con `importance >= 'high'`, disparar notificación tipo "¿Cómo resultó la decisión: X?". Input libre → guardado en `decision_events.outcome_summary` + `outcome_at`. Trigger: `pg_cron` job diario que busca `decision_events WHERE importance >= 'high' AND outcome_summary IS NULL AND created_at <= NOW() - INTERVAL '30 days'`. Output alimenta: evidence system (el outcome de una decisión es evidencia `observed` de lo que funciona), context packet de Optimus (no recomendar lo que ya se intentó con outcome negativo), y benchmarks internos de cohorte (A12.V2.1). Sin este loop el sistema captura decisiones pero nunca aprende de sus resultados — la tabla `decision_events` acumula datos sin cierre.

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

### Mejoras v2 — Adaptación a FASE 17/18/19 (eventos + feature matrix)

- [ ] **V11.V2.1** Añadir 4 nuevos eventos PostHog a `src/lib/analytics.ts` para los sistemas de FASE 19: `trackFocusBlockCtaClicked(projectId, actionType)`, `trackTaskSiguienteAccionConverted(projectId)`, `trackPhaseTeaserTabClicked(projectId, tabName, currentPhase)`, `trackPhaseTeaserOverride(projectId, tabName)`. Sin estos eventos, no hay forma de medir si el Focus Block genera engagement ni si los teasers adaptativos frenan o incentivan al usuario — métricas críticas para decidir si escalar FASE 19.
- [ ] **V11.V2.2** Actualizar `feature_matrix.md` — añadir las nuevas features de FASE 17/18/19: Focus Block, Task Loop, Phase-adaptive tabs, Meeting Intelligence (grabación → insights → motor), Proactive suggestions, In-meeting co-pilot, Evidence system, Source weights. Matrix actual tiene 32 features y está desactualizada tras estas 3 fases. Actualizar tabla de implementadas/pendientes/diferidas.

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

### Mejoras v2 — Inteligencia de cohorte

- [ ] **A12.V2.1** Cohort intelligence — aprender de todos los proyectos para mejorar recomendaciones individuales. Cuando haya ≥30 proyectos activos con historial de `decision_events` + `decision_events.outcome_summary` (SR10.V2.3) + `project_phase_history`, construir benchmarks internos reales: qué decisiones tomaron founders en Fase 1/2 que alcanzaron Fase 3+ en <6 meses, qué tácticas de OBV tienen mayor tasa de validación, qué combinación de integraciones correlaciona con mayor iteration velocity. Datos anonimizados y agregados — nunca cruzar proyectos de forma identificable. Output: nueva columna en `benchmarks` con `source='cohort_internal'` que Optimus puede usar en lugar de benchmarks curados manualmente (PL9.3). Este es el moat de largo plazo: cuantos más proyectos, mejores las recomendaciones. Prerequisito: SR10.V2.3 en producción + N≥30 proyectos con outcomes registrados.

---

## FASE 13 — EDGE CASES ✅ v1 CERRADA 8/10
> Diseñar respuesta del sistema antes de lanzar.
> **v1 cerrada 2026-03-18.** Mapa completo auditado 2026-03-13. 2 diferidos con criterio (EC13.5 requiere sistema de invitaciones · EC13.9 requiere datos reales de revenue verificable).

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

### Mejoras v2 — Adaptación a FASE 19 (useProjectContext) + FASE 17 (evidence weights)

- [ ] **EC13.V2.1** `useProjectContext()` — `mode: 'solo'|'team'` debe contar solo miembros con `role_accepted = true`. Actualmente si se usa `project_members.count`, incluye invitaciones pendientes o miembros no aceptados, lo que hace que un founder solo aparezca como "team" si alguien recibió una invitación pero nunca la aceptó. El context incorrecto afecta todos los comportamientos adaptativos de FASE 19.
- [ ] **EC13.V2.2** Cerrar EC13.9 (revenue weight ×0.7) usando el sistema de evidencia de FASE 17 — en lugar del multiplicador binario 0.7, usar `SOURCE_WEIGHTS` por `evidence_type`: `observed` (desde Stripe) = 1.0, `declared` (entrada manual) = 0.7, `estimated` = 0.5, `inferred` = 0.3. Esto cierra la deuda técnica con la arquitectura correcta (no un hack de multiplicador) una vez que FASE 17 esté en producción.

---

## FASE 14 — MONETIZACIÓN 0/5
> Solo cuando el producto está validado con usuarios reales.

- [ ] **M14.1** Definir tiers de plan (Free / Pro / Business con límites por feature)
- [ ] **M14.2** Implementar plan limits enforcement en backend
- [ ] **M14.3** Activar ENABLE_PAYMENTS = true + configurar Stripe
- [ ] **M14.4** Upgrade hints en momentos de valor percibido
- [ ] **M14.5** Onboarding a planes (después del onboarding A, no durante)

### Mejoras v2 — Adaptación a FASE 19 (Phase-adaptive upgrade hints)

- [ ] **M14.V2.1** `PHASE_TAB_CONFIG` (F19.C.3) → conectar teasers con upgrade hints — cuando un usuario en Fase 1 ve un teaser de una feature de Fase 3, el mensaje debe decir "Se desbloquea cuando alcances la Fase 3" en lugar de solo el tier de plan. Los dos sistemas son ortogonales (fase vs plan) y deben coordinarse: si una feature requiere Fase 3 Y plan Pro, mostrar ambas condiciones. Sin esta coordinación, el usuario puede hacer upgrade de plan y seguir sin acceso porque su proyecto está en Fase 1.
- [ ] **M14.V2.2** Investor readiness summary — vista consolidada para cuando el founder entra en modo fundraising. Consolida: `project_phase_state.current_phase` + progression history, `project_probability` + trend, KPIs clave (MRR, iteration velocity, risk score), `integration_insights` activos, últimas decisiones de `decision_events`, y cohort benchmark position (A12.V2.1 cuando disponible). Formato exportable a PDF. Trigger de acceso: un `decision_event` con `category='fundraising'` O el founder activa manualmente "Modo Investor". Este momento tiene disposición a pagar directa — un founder que está a punto de levantar capital necesita exactamente esto y no tiene tiempo de construirlo. Es también una ventana de upgrade natural: "Para incluir X en tu Investor Summary, necesitas plan Pro".

---

## FASE 15 — INTEGRACIONES, HIDRATACIÓN Y AGENTES EXTERNOS ✅ v1 CERRADA (2026-03-18)
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
- [x] **I15.DEBT.5** Motor writes del Finance Agent bloqueados por constraint de sync_run status
  > **Cerrado 2026-03-18.** Problema adicional descubierto: `write_integration_to_engine_table` es `SECURITY DEFINER GRANT TO service_role` — el cliente (JWT de usuario) no puede llamarla independientemente del status del sync_run. Solución implementada: motor writes embebidos en los edge functions durante el sync (sync_run todavía 'running'). (1) `supabase/migrations/20260318000003_debt5_relax_write_guard.sql` — relaja guard de `status='running'` a `status IN ('running','completed','partial')` para habilitar futuros edge functions de agentes post-sync. (2) `sync-stripe` Paso 8b: computa `revenue_concentration` inline sobre `acceptedEntities` → `write_integration_to_engine_table(target='project_economic_profile', payload={top_client_revenue_percent})`, confidence check >= 0.8, min 3 clientes con customer_id. (3) `sync-hubspot` Paso 6: por cada deal con confidence >= 0.8 → `write_integration_to_engine_table(target='obvs', payload={external_id, titulo, tipo='venta', pipeline_status, fecha, valor_potencial})`, mapeo HubSpot stage → lead_status ENUM. (4) `financeAgentService.ts` + `salesAgentService.ts`: campo `motor_write` en integration_insights documenta target y edge function que ejecuta el write.
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
- [x] **I15.79** Crear Sales Agent
  > **CERRADO 2026-03-18:** `src/lib/sales-agent.ts` — lógica pura: `computeOpenPipelineValue` (min 1 deal activo, 24h, siempre emite, severity='info') + `computePipelineConversionRate` (min 3 deals cerrados, 7d, solo emite si hay deals perdidos, severity info/attention/warning). Confidence = avg_entity_confidence × completeness_factor (§5). action_hints: verb·objeto·destino·horizonte temporal. `src/services/salesAgentService.ts` — lee `integration_entities[entity_type='deal', provider='hubspot']`, anti-spam §10, inserta en `integration_insights[agent_type='sales']`. `src/components/integrations/SalesInsightsCard.tsx` — mismo patrón que ExecutionInsightsCard con badge "Sales Agent". Integrado en `HubSpotIntegration.tsx`: corre post-sync silenciosamente. `useAgentContext.ts` actualizado: incluye 'sales' en agent_type filter. `agent-synthesis.ts` actualizado: `pipeline_conversion_rate` en RISK_DELTA (warning: +7, critical: +12). `ProjectEnginePanel.tsx` actualizado: label 'conversión de ventas baja' en AGENT_DRIVER_LABELS. **Sin motor writes en v1** — escribe `revenue_momentum` al Phase Engine en v2. **Deferred insight_types:** `pipeline_velocity` (requiere historial de stage), `deal_stagnation` (requiere historial de movimiento).
- [x] **I15.80** Crear Execution Agent
  > `src/lib/execution-agent.ts` — lógica pura: `computeTaskCompletionRate` (min 5 tasks, 48h) + `computeOverdueRatio` (min 3 open con due_date, 24h, solo emite si hay >=1 vencida). Confidence = avg_entity_confidence × completeness_factor (§5). `src/services/executionAgentService.ts` — lee `integration_entities[entity_type='task', provider='asana']`, anti-spam §10, inserta en `integration_insights[agent_type='execution']`. `src/components/integrations/ExecutionInsightsCard.tsx` — mismo patrón que FinanceInsightsCard con badge "Execution Agent". Integrado en `AsanaIntegration.tsx`: corre post-sync silenciosamente. **Deferred insight_types:** `execution_drop` (requiere 2+ syncs históricos), `milestone_at_risk` (requiere entidades milestone). **Sin motor writes en v1** — escribe `execution_health` al Phase Engine en v2 (AGENTS_CONTRACT.md §3).
- [!] **I15.81** Crear Team Agent
  > DIFERIDO — Slack es output-only. No importa datos de equipo. Sin fuente de datos de comunicación/actividad real, el agente no tiene señal.
- [x] **I15.82** Crear Calendar Agent
  > `src/lib/calendar-agent.ts` — lógica pura: `computeMeetingLoad` (min 1 evento futuro, próximos 7d, severity info/attention/warning por horas, 24h) + `computeMeetingDensity` (min 3 eventos futuros, % de 40h/semana ocupado en reuniones, 48h). Confidence = avg_entity_confidence × completeness_factor. `src/services/calendarAgentService.ts` — lee `integration_entities[entity_type='calendar_event', provider='google_calendar']`, anti-spam §10, inserta en `integration_insights[agent_type='calendar']`. `src/components/integrations/CalendarInsightsCard.tsx` — mismo patrón que SalesInsightsCard con badge "Calendar Agent". Integrado en `GoogleCalendarIntegration.tsx`: corre post-sync silenciosamente. `RISK_DELTA`: meeting_load(warn=4,crit=8) + meeting_density(warn=4,crit=7). `useAgentContext`: añadido 'calendar'. `AGENT_DRIVER_LABELS`: meeting_load + meeting_density. **Sin motor writes en v1** — I15.DEBT.5.
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
- [!] **I15.91** Integración Holded — 2º provider (fix stub: tablas, auth, sync real, lado de gastos/payroll/márgenes)
  > DIFERIDO v1 — Completa el lado de gastos/payroll que Stripe no ve. Desbloquea `runway_estimate` en Finance Agent. Prioridad alta en v2 cuando haya usuarios reales con datos financieros.
- [x] **I15.92** Integración Stripe — 1er provider, primer corte (conexión + import manual + write-through + efecto en motor. Sin webhooks/incremental/backfill en v1)
  > **CERRADO 2026-03-18:** `connect-stripe` + `sync-stripe` — validación de API key, paginación de suscripciones activas, normalización via `stripe-financial.ts`, upsert en `integration_entities`, Finance Agent local, write_integration_to_engine_table → key_metrics (MRR en centavos), run_probability_engine, snapshots pre/post. `StripeIntegration.tsx` con UI completa + SyncHealthCard + FinanceInsightsCard. Migración `20260318000002` aplicada (expires_at, include_in_context, generated_at en integration_insights). Validado con cuenta Stripe live (0 suscripciones activas — sistema correcto).

**Ventas:**
- [x] **I15.93** Integración HubSpot — 3er provider (desde cero)
  > **CERRADO 2026-03-18:** `connect-hubspot` — valida Private App Token via `/account-info/v3/details`, extrae portalId, upserta integration_connections con metadata={portal_id}, guarda token cifrado. `sync-hubspot` — full sync (GET /crm/v3/objects/deals) + incremental (POST /crm/v3/objects/deals/search con hs_lastmodifieddate >= last_sync_at), paginación cursor-based (máx 10p/1000 deals), normaliza via `normalizeHubSpotDeal`, upserta integration_entities. Sin motor writes en v1 — deals van a integration_entities (hidratación a `obvs`: BLOQUE D/E, I15.45). `HubSpotIntegration.tsx` — UI con token input, tutorial post-conexión, stats sync, SyncHealthCard, tabla Qué entra·Dónde va·Qué cambia. `IntegrationsView.tsx` — HubSpot card en grid + tab añadido. **I15.79 desbloqueado cuando haya datos reales en integration_entities[entity_type='deal'].**

**Operaciones:**
- [x] **I15.94** Integración Asana (desde cero)
  > `supabase/functions/connect-asana/index.ts` — valida PAT contra Asana /users/me, extrae workspace_gid, upserta integration_connections con metadata={workspace_gid, workspace_name}, guarda PAT cifrado via upsert_integration_credential. `supabase/functions/sync-asana/index.ts` — full+incremental sync (modified_since), paginación cursor-based (máx 10p/1000t), normaliza via normalizeAsanaTask, upserta integration_entities, escribe tasks con confidence>=0.8 via write_integration_to_engine_table(target='tasks'). Status mapping: open→todo, completed→done. Sin run_probability_engine (tasks no afectan motor financiero). `src/components/integrations/AsanaIntegration.tsx` — UI con PAT input, tutorial post-conexión, stats de sync, SyncHealthCard, tabla "Qué entra·Dónde va·Qué cambia". `IntegrationsView.tsx` — Asana card en grid + tab añadido. **Prerrequisito verificado:** columnas tasks.external_provider/external_id/external_synced_at ya existían en migración 20260315000004. **I15.80 desbloqueado cuando haya datos reales en integration_entities[entity_type='task'].**
- [!] **I15.95** Integración Trello (desde cero)
  > DIFERIDO v1 — Duplica cobertura de Asana sin añadir señal nueva. Solo si hay demanda explícita de usuarios con Trello como herramienta principal.

**Comunicación:**
- [!] **I15.96** Integración Slack (fix schema mismatch + completar notification_types)
  > DIFERIDO v1 — Slack es output-only; no aporta señal de agente. Útil como canal de notificación cuando haya usuarios activos, no como fuente de datos.

**Agenda:**
- [x] **I15.97** Integración Google Calendar (fix OAuth token persistence + sync)
  > `supabase/functions/connect-google-calendar/index.ts` — OAuth 2.0 dual-mode (get_auth_url / exchange_code), state=btoa(project_id), access_type=offline, prompt=consent. `supabase/functions/sync-google-calendar/index.ts` — refresca access_token vía refresh_token en cada run, ventana ±30d, singleEvents=true, normaliza vía `_shared/normalizers/gcal-calendar.ts`, upserta en `integration_entities[entity_type='calendar_event']`. Sin motor writes en v1. `src/components/integrations/GoogleCalendarIntegration.tsx` — detecta OAuth return (code+state en URL), exchange_code, SyncHealthCard post-sync. `IntegrationsView.tsx` — card + TabsTrigger + TabsContent.

### BLOQUE I — Superficies de inteligencia
> **Deuda de diseño registrada (2026-03-15):** los paneles de inteligencia deben resolver el estado
> "insight ya visto por el founder". Sin esto, los agentes pueden mostrar el mismo insight repetidamente
> aunque el founder ya lo haya procesado. No es anti-ruido de emisión (ya cubierto en AGENTS_CONTRACT.md §10)
> — es estado de lectura de UI. Decisión a tomar antes de implementar estos paneles: ¿insight se marca
> como "leído" por sesión, por fecha, o por confirmación explícita del founder?
> **DIFERIDO v1** — Los agentes ya muestran insights en cards individuales (FinanceInsightsCard, SalesInsightsCard, etc.). Paneles unificados son v2 cuando haya datos reales y demanda de consolidación.

- [!] **I15.98** Financial Intelligence Panel
  > DIFERIDO v1 — FinanceInsightsCard en StripeIntegration cubre la necesidad inmediata.
- [!] **I15.99** Sales Intelligence Panel
  > DIFERIDO v1 — SalesInsightsCard en HubSpotIntegration cubre la necesidad inmediata.
- [!] **I15.100** Execution Intelligence Panel
  > DIFERIDO v1 — ExecutionInsightsCard en AsanaIntegration cubre la necesidad inmediata.
- [!] **I15.101** Team Intelligence Panel
  > DIFERIDO v1 — Team Agent diferido (I15.81). Sin agente, no hay panel.
- [!] **I15.102** Calendar Intelligence Panel
  > DIFERIDO v1 — CalendarInsightsCard en GoogleCalendarIntegration cubre la necesidad inmediata.

### BLOQUE J — Observabilidad
> **DIFERIDO v1** — SyncHealthCard cubre observabilidad mínima. Bloques J–M son v2/v3.

- [!] **I15.103** Eventos de conexión
- [!] **I15.104** Eventos de sync
- [!] **I15.105** Eventos de insight generado
- [!] **I15.106** Eventos de acción recomendada
- [!] **I15.107** Integrar errores de integraciones con Sentry
- [!] **I15.108** Panel interno de salud de integraciones

### BLOQUE K — Seguridad
> **DIFERIDO v1** — Cifrado de credenciales ya implementado (pgcrypto, I15.DEBT.5). RLS activo. Resto es hardening para escala.

- [!] **I15.109** Cifrado de credenciales (reemplaza api_key plano actual)
  > Ya implementado vía pgcrypto + upsert_integration_credential/decrypt_integration_credential.
- [!] **I15.110** Rotación de tokens
- [!] **I15.111** Permisos por rol
- [!] **I15.112** Audit log
- [!] **I15.113** Política de borrado
- [!] **I15.114** Limitación de scopes
- [!] **I15.115** Protección contra abuso de API

### BLOQUE L — Experiencia de confianza
> **DIFERIDO v1** — Sin usuarios reales en producción, esta superficie no tiene ROI.

- [!] **I15.116** Pantalla de confianza
- [!] **I15.117** Explicar qué datos se usan
- [!] **I15.118** Explicar qué datos no se usan
- [!] **I15.119** Mostrar permisos solicitados
- [!] **I15.120** Mostrar actividad de integración
- [!] **I15.121** Mostrar valor generado por integración

### BLOQUE M — Estrategia de producto
> **DIFERIDO v1** — Decisiones de pricing y roadmap son post-validación con usuarios reales.

- [!] **I15.122** Definir integraciones core
- [!] **I15.123** Definir integraciones beta
- [!] **I15.124** Definir impacto en pricing futuro
- [!] **I15.125** Definir límites por plan
- [!] **I15.126** Definir roadmap de providers

### Mejoras v2 — Adaptación a FASE 18 (Meeting Intelligence) + FASE 19 (buildNextAction)

- [ ] **I15.V2.1** Añadir `'meeting_intelligence'` al enum de providers en `integration_connections` — FASE 18 necesita un `integration_connection` para rastrear conexiones de procesamiento de audio/transcripción (Whisper). Sin este provider type, Meeting Intelligence no puede usar la infraestructura de integraciones existente (sync runs, entities, insights) y tendría que reinventar su propio sistema de estado de conexión.
- [ ] **I15.V2.2** Contract de I15.81 (Team Agent, diferido) — especificar que su `integration_insights` payload incluya `{ overdue_count: number, blocked_members: string[] }`. `buildNextAction()` (F19.A.2) necesita consumir esta señal del Team Agent. Documentar en `AGENTS_CONTRACT.md` para que cuando I15.81 se implemente, el contrato de output ya esté definido y sea compatible con FASE 19.

---

## FASE 16 — ADQUISICIÓN Y VALIDACIÓN CON USUARIOS REALES 🔄 ACTIVA 0/6
> **Esta es la fase activa real a 2026-03-18.**
> El producto está construido y validado técnicamente. El siguiente bloqueo no es de código — es de datos.
> Sin usuarios reales no se puede calibrar notificaciones, validar onboarding, ni activar PostHog/Sentry.
>
> **Criterio de cierre:** 5–10 usuarios reales han completado onboarding + visto Next Action + (al menos 1) conectado una integración.
> **No construir nada más hasta tener señal real de estos 3 momentos.**

### Bloque A — Infraestructura de observabilidad (hacer antes de conseguir usuarios)

- [ ] **U16.1** Activar PostHog con key real
  > `VITE_POSTHOG_KEY` en `.env.local` + `.env.production`. V11.7 ya instrumentó los 8 eventos clave (project_created, onboarding_started/completed, engine_viewed, next_action_clicked, ritual_completed, reentry). Sin key, todos los eventos son no-ops silenciosos.
  > **Criterio:** ver eventos llegar al dashboard de PostHog con 1 sesión real.

- [ ] **U16.2** Activar Sentry con DSN real
  > `VITE_SENTRY_DSN` en `.env`. Sentry ya está instalado (V11.7). Sin DSN, los errores en producción son invisibles.
  > **Criterio:** ver 1 error de prueba llegando al dashboard de Sentry.

- [ ] **U16.3** Configurar Resend para emails críticos
  > `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` + `APP_URL` en secrets de Supabase edge functions. N7.6 ya implementó el pipeline completo de `send-critical-notifications`. Sin key, los emails críticos no se envían.
  > **Criterio:** recibir 1 email de prueba de tipo `viability_critical` o `probability_critical`.

### Bloque B — Adquisición y observación (core de la fase)

- [ ] **U16.4** Conseguir primeros 5–10 usuarios reales
  > No beta testers que "echen un vistazo". Founders reales con un proyecto real en marcha.
  > Canal más directo sin red existente: comunidades de founders (Indie Hackers, Product Hunt, grupos de WhatsApp/Slack de emprendedores locales).
  > **Criterio:** 5 usuarios que completen onboarding Fase A completa (no solo se registren).

- [ ] **U16.5** Observar 3 momentos críticos con datos reales
  > **A — Onboarding:** ¿terminan Fase A? ¿dónde abandonan? (PostHog: funnel onboarding_started → onboarding_completed)
  > **B — FirstSteps:** ¿actúan sobre alguna de las 3 acciones propuestas? ¿o las ignoran? (PostHog: next_action_clicked)
  > **C — Agents:** si alguno conecta una integración, ¿leen los insights? ¿les cambia algo?
  > **Criterio:** tener datos reales para cada uno de los 3 momentos, aunque sean de 3 usuarios distintos.

- [ ] **U16.6** Primera calibración de notificaciones (gate post-Fase 7)
  > Ejecutar las 3 queries del panel de observación de la Calibración post-Fase 7 con datos reales.
  > Verificar: unread < 10% · críticas/usuario/semana < 2 · ningún tipo con ruido > 0.6.
  > **Criterio:** los 5 criterios del gate se sostienen con datos reales durante 2 semanas.
  > **Bloquea:** escalar usuarios o activar emails masivos hasta que pase este gate.

### Mejoras v2 — Conexión con FASE 19 (Focus Block como señal de adquisición)

- [ ] **A16.V2.1** Incluir `focus_block_cta_clicked` (V11.V2.1) en los momentos de observación de U16.5 — el clic en el CTA del Focus Block es la señal de engagement más directa del sistema. Un usuario que lo pulsa está siguiendo la recomendación del motor. Añadir a la lista de 3 momentos clave (onboarding completado + Next Action visto + integración conectada) como cuarto momento opcional pero prioritario.
- [ ] **A16.V2.2** Añadir criterio de paso: Focus Block click-through rate ≥ 40% antes de escalar adquisición — si el Focus Block existe pero el 60%+ de usuarios lo ignora, el problema no es de distribución sino de relevancia de la recomendación. Escalar con ese ratio produciría usuarios que no se activan. Este criterio debe medirse en U16.4 (observación de 10 usuarios) antes de escalar a 50+.

---

## FASE 17 — SISTEMA DE EVIDENCIA, FIABILIDAD Y TRANSPARENCIA ✅ CERRADA v1 32/32 + 4/5 v2 completadas
> **Prerequisito obligatorio:** FASE 16 Bloque A completa + al menos 1 integración con datos reales en producción.
> Sin datos reales, no hay conflictos reales entre fuentes. Diseñar resolución de conflictos en el vacío produce
> lógica que no responde a los problemas que realmente ocurren.
>
> **Principio central:** ningún output del sistema (insight, recomendación, métrica) existe sin procedencia,
> fiabilidad y explicación. El usuario puede saber, para cada dato: de dónde viene · cómo de fiable es ·
> qué alternativas se descartaron · si es un dato observado o una inferencia.
>
> **Lo que ya existe y NO se duplica:**
> - `confidence` (0–1) en `integration_entities`, `integration_insights`, `integration_write_log`
> - `source_timestamp` en las tres tablas + tablas de motor (`key_metrics`, `financial_projections`, `project_economic_profile`)
> - `integration_source` + `source_confidence` en tablas de motor
> - `detectConflicts()` en `agent-synthesis.ts` (conflictos entre insights de agente)
> - Guard `write_integration_to_engine_table()` con idempotencia y log de writes
>
> **Lo que esta fase construye encima de eso:**
> `evidence_type` (observed|declared|inferred|estimated) · `SOURCE_WEIGHTS` por proveedor ·
> `resolveConflict()` formal · `sources_used/sources_discarded` en insights ·
> UI "¿De dónde sale esto?" · preferencias de fuente por proyecto
>
> **Orden de ejecución obligatorio:**
> Bloque A (contratos TypeScript) → Bloque C (migraciones) → Bloque B (motor pesos) →
> Bloque D (agentes) → Bloque E (UI trazabilidad) → Bloque F (control usuario) → Bloque G (auditoría)
>
> **Criterio de cierre:** cada insight en producción tiene `evidence_type` correcto · UI muestra
> fuentes con un click · usuario puede desactivar una fuente y ver efecto en insights · tsc limpio.

### BLOQUE A — Contrato de evidencia en TypeScript
> Primero. Define los tipos que usan todos los demás bloques. Sin este bloque no se puede construir nada más.
> Archivo destino: `src/lib/evidence.ts` (archivo nuevo — no toca código existente).

- [x] **T17.1** Definir interfaces `EvidenceRecord` y `EvidenceType` en `src/lib/evidence.ts`
  > Nuevo archivo. Define los contratos que usa todo el sistema de evidencia.
  > ```typescript
  > export type EvidenceType = 'observed' | 'declared' | 'inferred' | 'estimated'
  > // observed:  dato directamente medido por una fuente externa (Stripe reporta MRR real)
  > // declared:  dato introducido por el usuario sin verificación externa (MRR manual)
  > // inferred:  derivado por IA a partir de otros datos (riesgo calculado de múltiples señales)
  > // estimated: aproximación cuando no hay dato concreto (benchmark sectorial)
  >
  > export interface EvidenceRecord {
  >   value:           unknown          // el valor del dato
  >   field:           string           // qué mide (mrr, pipeline_value, task_completion_rate...)
  >   source:          ProviderSlug     // quién lo aporta
  >   type:            EvidenceType     // naturaleza del dato
  >   confidence:      number           // 0–1 heredado de integration_entities.confidence
  >   timestamp:       string           // ISO — cuándo se obtuvo en la fuente
  >   trace_id:        string           // entity_id | insight_id | write_log_id
  >   raw_reference?:  string           // external_id de integration_entities (trazabilidad máxima)
  >   expires_at?:     string           // ISO — si el dato tiene caducidad
  > }
  >
  > export type ProviderSlug =
  >   'stripe' | 'hubspot' | 'asana' | 'google_calendar' |
  >   'holded' | 'user_manual' | 'ai_inferred'
  > ```
  > **Criterio:** `tsc --noEmit` limpio tras crear el archivo con estas interfaces.

- [x] **T17.2** Definir `SOURCE_WEIGHTS` y `FIELD_COMPATIBILITY` en `src/lib/evidence.ts`
  > Registros de pesos por defecto por proveedor y compatibilidad de fuente por campo.
  > ```typescript
  > export const SOURCE_WEIGHTS: Record<ProviderSlug, number> = {
  >   stripe:           1.0,   // datos financieros verificados por pasarela de pago
  >   holded:           0.9,   // datos contables verificados (ERP)
  >   hubspot:          0.8,   // pipeline CRM declarado por el equipo comercial
  >   asana:            0.8,   // estado de tareas registrado en herramienta de ejecución
  >   google_calendar:  0.75,  // agenda real sincronizada — no refleja calidad, solo tiempo
  >   user_manual:      0.6,   // declaración del founder sin verificación externa
  >   ai_inferred:      0.35,  // derivación algorítmica a partir de otras señales
  > }
  >
  > // Qué fuentes son válidas para qué campos.
  > // Si una fuente no está en la lista de un campo → compatibilidad = 0 → nunca gana en conflicto.
  > export const FIELD_COMPATIBILITY: Record<string, ProviderSlug[]> = {
  >   mrr:                    ['stripe', 'holded', 'user_manual'],
  >   pipeline_value:         ['hubspot', 'user_manual'],
  >   task_completion_rate:   ['asana', 'user_manual'],
  >   meeting_load_hours:     ['google_calendar', 'user_manual'],
  >   cash_on_hand:           ['holded', 'stripe', 'user_manual'],
  >   top_client_revenue_pct: ['stripe', 'holded', 'user_manual'],
  >   cac_estimate:           ['hubspot', 'user_manual', 'ai_inferred'],
  >   gross_margin:           ['holded', 'user_manual', 'ai_inferred'],
  > }
  > ```
  > **Criterio:** cada campo mapeado tiene al menos 1 fuente válida. Los pesos son justificables.

- [x] **T17.3** Implementar `normalizeToEvidence()` para filas de `integration_entities`
  > Función en `src/lib/evidence.ts`. Convierte una fila de `integration_entities` en `EvidenceRecord`.
  > Mapeo de `entity_type` → `field`:
  > - `subscription` → `mrr` (usa `payload.mrr_contribution` como value)
  > - `deal` → `pipeline_value` (usa `payload.amount_cents`)
  > - `task` → `task_completion_rate` (derivado de payload.status)
  > - `calendar_event` → `meeting_load_hours` (derivado de payload.duration)
  > `evidence_type = 'observed'` siempre para entidades de integración (dato directo de proveedor).
  > `source = entity.provider as ProviderSlug`
  > `trace_id = entity.id`
  > `raw_reference = entity.external_id`
  > `confidence = entity.confidence`
  > `timestamp = entity.source_timestamp ?? entity.synced_at`
  > **Criterio:** test unitario con 1 subscription row de Stripe → EvidenceRecord correcto.

- [x] **T17.4** Implementar `normalizeToEvidence()` para filas de `integration_insights`
  > Segunda sobrecarga de `normalizeToEvidence()` para insights ya emitidos por agentes.
  > `evidence_type`:
  > - Si `insight.agent_type IN ('finance','sales','execution','calendar')` → `'observed'`
  >   (el agente procesa datos directos de proveedor)
  > - Si `entity_ids` está vacío → `'estimated'` (sin trazabilidad a entidades concretas)
  > - Si generado por síntesis de múltiples agentes → `'inferred'`
  > `confidence = insight.confidence`
  > `trace_id = insight.id`
  > `timestamp = insight.source_timestamp`
  > **Criterio:** insight de Finance Agent con entity_ids poblado → type='observed'. Insight sin entity_ids → type='estimated'.

### BLOQUE B — Motor de pesos y resolución de conflictos
> Depende de Bloque A. Implementa la lógica que decide qué dato es "verdad" cuando hay múltiples fuentes.
> No toca `agent-synthesis.ts` — ese resuelve conflictos entre insights. Este bloque resuelve conflictos entre datos crudos.

- [x] **T17.5** Implementar `computeEvidenceScore()` en `src/lib/evidence.ts`
  > Fórmula: `score = weight_source × confidence × recency_factor × compatibility_factor`
  > ```typescript
  > function computeRecencyFactor(timestamp: string): number {
  >   const ageMs = Date.now() - new Date(timestamp).getTime()
  >   const h = ageMs / 3_600_000
  >   if (h < 1)   return 1.0
  >   if (h < 6)   return 0.9
  >   if (h < 24)  return 0.8
  >   if (h < 72)  return 0.7
  >   if (h < 168) return 0.5  // < 7 días
  >   return 0.3               // más de 7 días
  > }
  >
  > export function computeEvidenceScore(
  >   evidence: EvidenceRecord,
  >   preferences?: ProjectSourcePreferences,
  > ): number {
  >   const pref = preferences?.[evidence.source]
  >   if (pref?.enabled === false) return 0  // fuente desactivada por usuario → nunca gana
  >   const weight = pref?.weight_override ?? SOURCE_WEIGHTS[evidence.source] ?? 0
  >   const compat = FIELD_COMPATIBILITY[evidence.field]?.includes(evidence.source) ? 1 : 0
  >   return weight × evidence.confidence × computeRecencyFactor(evidence.timestamp) × compat
  > }
  > ```
  > **Criterio:** Stripe mrr confidence=0.9 synced hace 1h → score ≥ 0.85.
  > user_manual mrr confidence=0.9 introduced hace 3 días → score < 0.45.

- [x] **T17.6** Implementar `resolveConflict()` en `src/lib/evidence.ts`
  > Toma múltiples `EvidenceRecord` para el mismo `field`. Retorna ganador + descartados + razón.
  > ```typescript
  > export interface ConflictResolution {
  >   winner:            EvidenceRecord
  >   score:             number
  >   alternatives:      Array<{ evidence: EvidenceRecord; score: number; reason: string }>
  >   resolution_basis:  string   // texto legible: "Stripe supera a input manual (score 0.85 vs 0.42)"
  > }
  >
  > export function resolveConflict(
  >   evidences: EvidenceRecord[],
  >   preferences?: ProjectSourcePreferences,
  > ): ConflictResolution
  > ```
  > Si solo hay 1 evidencia → winner directo, alternatives vacío.
  > Si score máximo empate entre 2 fuentes → priorizar la de mayor `SOURCE_WEIGHTS` base (desempate determinista).
  > Si todas las evidencias tienen score = 0 (fuentes incompatibles o desactivadas) → retornar evidencia más reciente con `resolution_basis = 'fallback_recency'`.
  > **Criterio:** [Stripe confidence=0.9, synced 1h] vs [user_manual confidence=0.9, introduced 5d] → Stripe gana. Razón legible en `resolution_basis`.

- [x] **T17.7** Implementar `computeReliabilityScore()` en `src/lib/evidence.ts`
  > Score de fiabilidad final de un insight para ajustar severidad en UI.
  > `reliabilityScore = avg(computeEvidenceScore(e) for e in sources_used)`
  > Si `sources_used` vacío → `reliabilityScore = insight.confidence × SOURCE_WEIGHTS.ai_inferred`
  > Exportado para uso en `agent-synthesis.ts` (T17.13) y en insight cards (T17.16–T17.19).
  > **Criterio:** insight con 3 entidades Stripe confidence=0.85 → reliabilityScore ≥ 0.8.
  > Insight sin entidades (estimado) → reliabilityScore ≤ 0.35.

- [x] **T17.8** Test unitario de Bloque B (Vitest)
  > `src/lib/__tests__/evidence.test.ts`
  > Casos obligatorios:
  > 1. `resolveConflict` Stripe vs user_manual mismo campo → Stripe gana
  > 2. `resolveConflict` fuente incompatible (HubSpot para mrr) → descartada
  > 3. `resolveConflict` fuente desactivada por preferencias → score=0
  > 4. `computeRecencyFactor` dato de hace 8 días → 0.3
  > 5. `computeEvidenceScore` usuario deshabilita Stripe → score=0
  > **Criterio:** todos los tests en verde. `vitest run src/lib/__tests__/evidence.test.ts` limpio.

### BLOQUE C — Migraciones DB (schema de evidencia)
> Depende de Bloque A (para entender qué campos añadir). Independiente de Bloque B.
> Puede hacerse en paralelo con Bloque B.

- [x] **T17.9** Migración: añadir campos de evidencia a `integration_insights`
  > Nuevo archivo: `supabase/migrations/20260319000001_fase17_evidence_schema.sql`
  > ```sql
  > ALTER TABLE integration_insights
  >   ADD COLUMN IF NOT EXISTS evidence_type    TEXT
  >     CHECK (evidence_type IN ('observed','declared','inferred','estimated'))
  >     DEFAULT 'inferred',
  >   ADD COLUMN IF NOT EXISTS sources_used     JSONB NOT NULL DEFAULT '[]',
  >   ADD COLUMN IF NOT EXISTS sources_discarded JSONB NOT NULL DEFAULT '[]',
  >   ADD COLUMN IF NOT EXISTS low_evidence_quality BOOLEAN NOT NULL DEFAULT FALSE;
  >
  > -- Índice para filtrar insights de baja calidad en síntesis
  > CREATE INDEX IF NOT EXISTS idx_integration_insights_evidence_type
  >   ON integration_insights (project_id, evidence_type)
  >   WHERE low_evidence_quality = FALSE;
  > ```
  > Schema de `sources_used` (array de objetos):
  > `[{ "source": "stripe", "confidence": 0.9, "timestamp": "ISO", "entity_count": 3 }]`
  > Schema de `sources_discarded`:
  > `[{ "source": "user_manual", "score": 0.38, "reason": "lower_score_than_stripe" }]`
  > **Criterio:** migración aplicada en prod sin error. `integration_insights` existentes tienen defaults correctos.

- [x] **T17.10** Migración: tabla `project_source_preferences`
  > En el mismo archivo `20260319000001_fase17_evidence_schema.sql` o en uno separado.
  > ```sql
  > CREATE TABLE IF NOT EXISTS project_source_preferences (
  >   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  >   project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  >   source         TEXT NOT NULL,
  >   enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  >   weight_override NUMERIC
  >     CHECK (weight_override IS NULL OR weight_override BETWEEN 0.1 AND 1.0),
  >   excluded_fields TEXT[] NOT NULL DEFAULT '{}',
  >   updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  >   UNIQUE (project_id, source)
  > );
  >
  > ALTER TABLE project_source_preferences ENABLE ROW LEVEL SECURITY;
  >
  > CREATE POLICY "source_prefs: members read/write"
  >   ON project_source_preferences
  >   USING (auth_is_project_member(project_id))
  >   WITH CHECK (auth_is_project_member(project_id));
  > ```
  > **Criterio:** migración limpia. RLS activo. Un proyecto no puede leer preferencias de otro.

- [x] **T17.11** Migración: backfill de `evidence_type` en insights existentes
  > ```sql
  > -- Insights de agentes reales con entidades concretas → 'observed'
  > UPDATE integration_insights
  >   SET evidence_type = 'observed'
  >   WHERE agent_type IN ('finance', 'sales', 'execution', 'calendar')
  >     AND jsonb_array_length(entity_ids::jsonb) > 0
  >     AND evidence_type = 'inferred';  -- solo los que tienen el default
  >
  > -- Insights sin trazabilidad a entidades → 'estimated'
  > UPDATE integration_insights
  >   SET evidence_type = 'estimated',
  >       low_evidence_quality = TRUE
  >   WHERE entity_ids = '{}'
  >     AND confidence < 0.5
  >     AND evidence_type = 'inferred';
  > ```
  > **Criterio:** 0 filas con `evidence_type IS NULL`. Los insights de Stripe tienen type='observed'.

### BLOQUE D — Adaptación de agentes
> Depende de Bloques A y C. Los agentes deben poblar los nuevos campos al emitir insights.
> No cambia la lógica de cómputo — solo añade metadata de evidencia al output.

- [x] **T17.12** Actualizar `src/lib/finance-agent.ts` — añadir evidence metadata al output
  > `FinanceInsightData` añade:
  > ```typescript
  > evidence_type:      EvidenceType     // 'observed' siempre — datos de Stripe
  > sources_used:       SourceUsed[]     // [{ source: 'stripe', confidence, timestamp, entity_count }]
  > sources_discarded:  SourceDiscarded[] // [] en Finance Agent v1 (fuente única)
  > ```
  > En `computeCashFlowSignal()` y `computeRevenueConcentration()`: al construir el insight,
  > agregar `sources_used` con agregado de la `confidence` media de las entidades usadas y su count.
  > `evidence_type = 'observed'` siempre (datos de Stripe = observados directamente).
  > **Criterio:** `runFinanceAgentLocal()` retorna insights con los 3 campos nuevos correctamente poblados.

- [x] **T17.13** Actualizar `src/services/financeAgentService.ts` — persistir evidence metadata
  > En el objeto `rows` del paso 5 (INSERT en `integration_insights`), añadir:
  > ```typescript
  > evidence_type:      insight.evidence_type,
  > sources_used:       insight.sources_used,
  > sources_discarded:  insight.sources_discarded,
  > low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
  > ```
  > No cambia ninguna otra lógica. Backwards compatible: el insert sigue funcionando aunque
  > los campos tengan valores por defecto en filas antiguas.
  > **Criterio:** tras sync de Stripe, nueva fila en `integration_insights` tiene `evidence_type='observed'` y `sources_used` con al menos 1 entry.

- [x] **T17.14** Actualizar `src/lib/sales-agent.ts` y `src/services/salesAgentService.ts`
  > Mismo patrón que T17.12 + T17.13.
  > Sales Agent: datos de HubSpot → `evidence_type = 'observed'`.
  > `sources_used = [{ source: 'hubspot', confidence: avg_entity_confidence, timestamp, entity_count }]`
  > **Criterio:** insight de Sales Agent en DB tiene `evidence_type='observed'` con source='hubspot'.

- [x] **T17.15** Actualizar `src/lib/execution-agent.ts` y `src/services/executionAgentService.ts`
  > Asana → `evidence_type = 'observed'`. Mismo patrón.
  > **Criterio:** insight de Execution Agent con source='asana' en sources_used.

- [x] **T17.16** Actualizar `src/lib/calendar-agent.ts` y `src/services/calendarAgentService.ts`
  > Google Calendar → `evidence_type = 'observed'`. Mismo patrón.
  > **Criterio:** insight de Calendar Agent con source='google_calendar' en sources_used.

- [x] **T17.17** Actualizar `agent-synthesis.ts` — añadir reliability_score y evidence_type a `SynthesizedInsight`
  > En la interface `SynthesizedInsight`, añadir:
  > ```typescript
  > reliability_score: number     // computeReliabilityScore() sobre sources_used del insight
  > evidence_type:     EvidenceType
  > sources:           Array<{ source: ProviderSlug; confidence: number; synced_at: string }>
  > ```
  > En `synthesizeAgentContext()`: al construir cada SynthesizedInsight desde un insight de DB,
  > computar `reliability_score` usando T17.7.
  > **Ajuste de severidad por fiabilidad:**
  > Si `reliability_score < 0.4` → downgrade severity 1 nivel (critical→warning, warning→attention, attention→info).
  > Esto evita que datos de mala calidad generen alarmas agresivas.
  > Verificar que callers existentes de `synthesizeAgentContext()` siguen compilando (campos nuevos opcionales con `??`).
  > **Criterio:** tsc limpio. SynthesizedInsight existente con insight de Stripe: reliability_score ≥ 0.8. Insight sin entidades: severity downgraded 1 nivel.

### BLOQUE E — Trazabilidad en UI
> Depende de Bloques C y D (los insights en DB tienen los nuevos campos).
> Esta es la parte más visible para el usuario — "¿de dónde sale esto?"

- [x] **T17.18** Componente `EvidenceBadge` — etiqueta visual del tipo de dato
  > Nuevo archivo: `src/components/evidence/EvidenceBadge.tsx`
  > Muestra el tipo de dato de forma compacta y comprensible:
  > - `observed` → badge verde · texto "Dato verificado" · tooltip "Medido directamente por [proveedor]"
  > - `declared` → badge azul · texto "Dato declarado" · tooltip "Introducido manualmente — sin verificación externa"
  > - `inferred` → badge ámbar · texto "Inferido" · tooltip "Calculado por el sistema a partir de otras señales"
  > - `estimated` → badge gris · texto "Estimado" · tooltip "Aproximación — sin dato concreto disponible"
  > Props: `type: EvidenceType, source?: ProviderSlug, compact?: boolean`
  > **Criterio:** renderiza correctamente los 4 tipos. Tooltip visible en hover. tsc limpio.

- [x] **T17.19** Componente `SourcesPanel` — desglose de procedencia por insight
  > Nuevo archivo: `src/components/evidence/SourcesPanel.tsx`
  > UI colapsable (no modal). Trigger: botón "Ver fuentes" discreto bajo cada insight card.
  > Muestra cuando está expandido:
  > ```
  > Fuentes usadas
  > ├── Stripe    ████████░░  confianza 87%  · sincronizado hace 2h
  > └── [vacío si solo 1 fuente]
  >
  > Fuentes descartadas
  > └── Input manual  descartado · menor fiabilidad que Stripe (score 0.38 vs 0.85)
  >
  > Tipo de dato: Dato verificado [EvidenceBadge]
  > Recencia:     hace 2 horas
  > Entidades:    3 suscripciones activas
  > ```
  > Props: `sources_used: SourceUsed[], sources_discarded: SourceDiscarded[], evidence_type: EvidenceType, generated_at: string`
  > **Criterio:** se expande/colapsa sin re-render del insight card. tsc limpio.

- [x] **T17.20** Integrar `SourcesPanel` + `EvidenceBadge` en `FinanceInsightsCard.tsx`
  > En `src/components/integrations/FinanceInsightsCard.tsx`:
  > - Añadir `EvidenceBadge` junto al badge de severidad (arriba derecha de cada insight)
  > - Añadir `SourcesPanel` colapsado al pie de cada insight card
  > - Leer `sources_used`, `sources_discarded`, `evidence_type` de `insight` (ya en DB tras T17.13)
  > Si `sources_used` está vacío (insights anteriores a FASE 17) → no renderizar SourcesPanel (invisible, sin error).
  > **Criterio:** FinanceInsightsCard muestra EvidenceBadge en cada insight. "Ver fuentes" funciona. No rompe insights sin metadata.

- [x] **T17.21** Integrar en `SalesInsightsCard.tsx`, `ExecutionInsightsCard.tsx`, `CalendarInsightsCard.tsx`
  > Mismo patrón que T17.20 para los 3 componentes restantes.
  > **Criterio:** los 4 insight cards muestran procedencia. tsc limpio.

- [x] **T17.22** Mostrar `reliability_score` en `ProjectEnginePanel` — sección de agentes
  > En la sección de señales de agente dentro de `ProjectEnginePanel.tsx`:
  > - Junto a cada señal activa, mostrar `EvidenceBadge` con su `evidence_type`
  > - Si `reliability_score < 0.5` → añadir indicador visual "baja fiabilidad" (icono de alerta pequeño)
  > - Si `reliability_score ≥ 0.8` → indicador "dato verificado" (check pequeño)
  > No cambiar `getNextAction()` ni la lógica del motor — solo overlay visual.
  > **Criterio:** al haber insights activos de Finance Agent, ProjectEnginePanel muestra su tipo de evidencia. tsc limpio.

- [x] **T17.23** Separación semántica dato vs inferencia vs recomendación en UI
  > Regla de diseño implementada como constraint en código, no solo como guía:
  > En `ProjectEnginePanel.tsx`, los 3 tipos de output nunca aparecen mezclados visualmente:
  > - Dato observado: sección "Estado real" (métricas del motor con EvidenceBadge)
  > - Inferencia del agente: sección "Señales" (insight cards con EvidenceBadge 'inferred')
  > - Recomendación: sección "Next Action" (getNextAction output — sin EvidenceBadge, es acción)
  > Añadir subtítulos de sección si no existen. No cambiar lógica, solo visual.
  > **Criterio:** el usuario puede distinguir visualmente "lo que sabe el sistema" de "lo que el sistema propone hacer".

### BLOQUE F — Control del usuario (preferencias de fuente)
> Depende de Bloques A, B y C. Permite al usuario ajustar qué fuentes usa el sistema.
> **Constraint de diseño:** nunca permitir configuración que rompa el sistema (pesos = 0 en todas las fuentes, etc.).

- [x] **T17.24** Hook `useSourcePreferences(projectId)` en `src/hooks/useSourcePreferences.ts`
  > Lee y mutatea `project_source_preferences` vía Supabase client.
  > ```typescript
  > interface UseSourcePreferencesReturn {
  >   preferences:      ProjectSourcePreferences   // Record<ProviderSlug, { enabled, weight_override }>
  >   isLoading:        boolean
  >   updatePreference: (source: ProviderSlug, update: Partial<SourcePref>) => Promise<void>
  >   resetPreference:  (source: ProviderSlug) => Promise<void>  // vuelve a defaults
  >   resetAll:         () => Promise<void>
  > }
  > ```
  > `ProjectSourcePreferences` exportado desde `src/lib/evidence.ts`.
  > queryKey: `['source_preferences', projectId]`
  > Invalidación tras mutación.
  > **Criterio:** un toggle en UI persiste en DB tras reload. Reset vuelve a defaults.

- [x] **T17.25** Componente `SourcePreferencesPanel` en `src/components/evidence/SourcePreferencesPanel.tsx`
  > Solo muestra fuentes que el proyecto tiene **realmente conectadas** (join con `integration_connections`).
  > Si no hay ninguna conexión activa → empty state "Conecta una integración para configurar sus fuentes".
  > Por cada fuente conectada:
  > ```
  > [toggle] Stripe Payments     Peso: ████████░░  (slider 0.1–1.0, solo en modo avanzado)
  > [toggle] HubSpot CRM
  > ```
  > 3 presets en la parte superior:
  > - "Balanceado" → restaura todos los SOURCE_WEIGHTS a sus defaults
  > - "Solo datos verificados" → stripe=1.0, holded=0.9, user_manual=0.2, ai_inferred=0.1
  > - "Priorizar mis datos" → user_manual=0.9, ai_inferred=0.3, externos=0.5
  > **Modo avanzado** (toggle "Configuración avanzada") → muestra slider de peso por fuente.
  > Bounds slider: mínimo 0.1, máximo 1.0. No permitir deshabilitar TODAS las fuentes a la vez.
  > **Criterio:** toggle de una fuente desactivada → después del siguiente sync el sistema no usa esa fuente. Preset "Solo datos verificados" funciona.

- [x] **T17.26** Integrar preferencias en `computeEvidenceScore()` (T17.5 ya tiene el parámetro)
  > Verificar que T17.5 usa `preferences` correctamente:
  > - fuente con `enabled=false` → score = 0 independientemente de confidence
  > - fuente con `weight_override` → usar ese peso en lugar de `SOURCE_WEIGHTS[source]`
  > Los agentes no cambian su lógica de cómputo — las preferencias se aplican en la resolución,
  > no en la detección de señales. Un agente Finance sigue detectando insights de Stripe aunque
  > Stripe esté "desactivado" — simplemente su insight tendrá score=0 en la síntesis.
  > **Criterio:** desactivar Stripe en preferencias → `computeEvidenceScore()` retorna 0 para cualquier EvidenceRecord con source='stripe'.

- [x] **T17.27** Punto de entrada UI para `SourcePreferencesPanel`
  > En `src/components/integrations/IntegrationsView.tsx`:
  > - Añadir botón "Configurar fuentes" en la cabecera de la vista de integraciones
  > - Abre `SourcePreferencesPanel` como Sheet (panel lateral) o como sección expandible bajo el grid de integraciones
  > - No es modal — el usuario puede ver las integraciones mientras configura preferencias
  > **Criterio:** flujo completo: IntegrationsView → "Configurar fuentes" → toggle Stripe → reload insight cards → EvidenceBadge actualizado. tsc limpio.

### BLOQUE G — Auditoría interna y calidad de evidencia
> Puede hacerse en paralelo con Bloques E y F. No tiene dependencias de UI.

- [x] **T17.28** Función SQL `get_evidence_audit(p_project_id UUID)` — debug interno
  > ```sql
  > CREATE OR REPLACE FUNCTION get_evidence_audit(p_project_id UUID)
  > RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
  > BEGIN
  >   RETURN jsonb_build_object(
  >     'insights_by_type',     (SELECT jsonb_object_agg(evidence_type, count)
  >                              FROM (SELECT evidence_type, COUNT(*) as count
  >                                    FROM integration_insights
  >                                    WHERE project_id = p_project_id
  >                                      AND expires_at > NOW()
  >                                    GROUP BY evidence_type) t),
  >     'low_quality_count',    (SELECT COUNT(*) FROM integration_insights
  >                              WHERE project_id = p_project_id
  >                                AND low_evidence_quality = TRUE
  >                                AND expires_at > NOW()),
  >     'sources_distribution', (SELECT jsonb_agg(DISTINCT source)
  >                              FROM integration_insights,
  >                                   jsonb_array_elements(sources_used) AS s(elem)
  >                              WHERE project_id = p_project_id
  >                                AND expires_at > NOW()),
  >     'last_conflict',        (SELECT MAX(source_timestamp) FROM integration_insights
  >                              WHERE project_id = p_project_id
  >                                AND jsonb_array_length(sources_discarded) > 0)
  >   );
  > END; $$;
  > ```
  > Uso: llamar desde SQL Editor de Supabase para diagnosticar calidad de evidencia por proyecto.
  > No se expone en UI v1 — es herramienta interna de soporte.
  > **Criterio:** función ejecuta sin error. Retorna JSONB con los 4 campos para un proyecto con Stripe conectado.

- [x] **T17.29** Lógica de `low_evidence_quality` en agentes — silencio cuando datos son insuficientes
  > En `src/lib/finance-agent.ts`, `sales-agent.ts`, `execution-agent.ts`, `calendar-agent.ts`:
  > Si el insight a emitir tiene `confidence < 0.5` Y `entity_ids.length === 0` → NO emitir el insight.
  > Retornar de la función con array vacío para ese insight_type.
  > Esto implementa AGENTS_CONTRACT.md §12 (política de silencio) reforzado por calidad de evidencia.
  > Caso contrario actual: un insight estimado con baja confianza se emite y aparece en UI
  > como si fuera información válida. Con este cambio, el silencio es preferible a la desinformación.
  > **Criterio:** test unitario: agent con 0 entidades y confidence 0.3 → 0 insights emitidos.
  > Agent con 0 entidades pero confidence 0.7 (ej. benchmark curado) → insight emitido con type='estimated'.

- [x] **T17.30** Migración de backfill de `evidence_type` e inicialización de `sources_used`
  > (ya definida en T17.11 — esta tarea es la verificación post-migración)
  > Queries de verificación a ejecutar tras la migración:
  > ```sql
  > -- Verificar que no hay NULLs
  > SELECT COUNT(*) FROM integration_insights WHERE evidence_type IS NULL;  -- debe ser 0
  > SELECT COUNT(*) FROM integration_insights WHERE sources_used IS NULL;   -- debe ser 0
  >
  > -- Distribución de tipos
  > SELECT evidence_type, COUNT(*) FROM integration_insights GROUP BY evidence_type;
  >
  > -- Insights sin metadata (anteriores a FASE 17) — deben tener defaults correctos
  > SELECT COUNT(*) FROM integration_insights WHERE sources_used = '[]'::jsonb;
  > ```
  > **Criterio:** los 3 SELECTs devuelven resultados coherentes. 0 NULLs en campos nuevos.

- [x] **T17.31** Verificación de compatibilidad backwards — tsc + smoke test
  > 1. `tsc --noEmit` limpio en todo el proyecto
  > 2. `vitest run` sobre tests existentes — ningún test roto
  > 3. Smoke test manual: conectar a Stripe → sync → ver insight en FinanceInsightsCard con EvidenceBadge → expandir SourcesPanel → ver fuentes correctas
  > 4. Verificar que `synthesizeAgentContext()` sigue retornando insights sin cambios en callers (ProjectEnginePanel)
  > **Criterio:** 0 errores TypeScript. 0 tests rotos. Smoke test completado en entorno local.

- [x] **T17.32** Instrumentación PostHog — medir adopción de trazabilidad
  > En `src/lib/analytics.ts`, añadir:
  > ```typescript
  > trackEvidenceInspected(projectId: string, insightType: string, evidenceType: EvidenceType): void
  > trackSourcePreferenceChanged(projectId: string, source: ProviderSlug, action: 'enabled'|'disabled'|'weight_changed'): void
  > ```
  > Disparar `trackEvidenceInspected` cuando el usuario expande SourcesPanel.
  > Disparar `trackSourcePreferenceChanged` cuando el usuario cambia una preferencia.
  > Sin esto, no se sabe si el usuario usa la trazabilidad o la ignora — y eso determina si vale la pena seguir inviriendo en Bloque F.
  > **Criterio:** eventos aparecen en PostHog con 1 sesión real de prueba. tsc limpio.

### Mejoras v2 — Conexión con FASE 18 (Meeting insights) + FASE 19 (Focus Block)

- [x] **T17.V2.1** Label de fiabilidad + fuente visible en `NextActionFocusBlock` sin expandir señales — cuando el Next Action viene de un agent signal, muestra icono + "Alta fiabilidad · Stripe" o "Muy incierto · estimaciones IA" bajo el título. Implementado en `build-next-action.ts` (reliabilityInfo) + `NextActionFocusBlock.tsx` (RELIABILITY_CONFIG + render).
- [x] **T17.V2.2** `buildNextAction()` degrada urgency a 'medium' si `reliability_score < 0.4` — agent signal con `severity='critical'` pero reliability baja ya no eleva urgencia a 'high'. Implementado en rama criticalInsight de `build-next-action.ts`.
- [ ] **T17.V2.3** Meeting insights (FASE 18 Bloque X) deben usar `EvidenceType` del sistema de evidencia — el `combined_reliability` de Bloque X (transcription_confidence × clarity_score × speaker_certainty_weight) debe mapearse a `EvidenceType`: >0.8 = `'observed'`, 0.6–0.8 = `'declared'`, 0.4–0.6 = `'inferred'`, <0.4 = `'estimated'`. Este mapeo es la interfaz oficial entre Meeting Intelligence y el sistema de evidencia. Sin él, los insights de reunión no son comparables con insights de integraciones en términos de fiabilidad.
- [x] **T17.V2.4** `getReliabilityLabel(score)` en `evidence.ts` — wrapper semántico: ≥0.75 = "Alta fiabilidad", ≥0.45 = "Fiabilidad media", <0.45 = "Muy incierto". Devuelve `{ label, level }` con level para aplicar color en cualquier componente.
- [x] **T17.V2.5** Warning de calidad en `SourcePreferencesPanel` — cuando el usuario desactiva todas las integraciones externas (deja solo user_manual + ai_inferred), muestra banner ámbar: "Has desactivado todas las fuentes externas. El sistema usará solo datos manuales e inferencias IA…".

---

## FASE 18 — MEETING INTELLIGENCE: CIERRE DE LOOP ESTRATÉGICO ⏸ POST-F16 0/49
> **Prerequisito obligatorio:** FASE 16 activa + Bloque 0 completado (sanear bugs y datos mock).
>
> **Por qué esta feature es el núcleo del sistema:**
> No es una feature aislada. Es el tejido conectivo de toda la plataforma.
> Las reuniones son donde ocurre todo lo real — las decisiones, los problemas, los compromisos.
> Sin Meeting Intelligence, el motor calcula con datos del pasado. Con él, el sistema aprende
> en tiempo real de lo que realmente está pasando en el proyecto.
>
> **El loop completo bidireccional que esta fase construye:**
> ```
> CRM (leads estancados) ──────────────────┐
> KPIs degradados ──────────────────────────┤
> Bloqueos estratégicos activos ────────────┼──→ Bloque I detecta → sugiere reunión con agenda
> Socios inactivos ──────────────────────────┤
> Compromisos vencidos ─────────────────────┘
>
>   ↓ reunión ocurre — con brief del motor (Bloque B) y guía táctica (Bloque J)
>   ↓ notas inline en tiempo real (Bloque J) · check-in de temas a mitad (Bloque J)
>
> Bloque X: clasifica impacto (low/medium/high) · filtra por fiabilidad combinada
>   ↓ solo high + aprobado por founder → motor
>
> Meeting Agent (Bloque A) → integration_insights
>   ├── Tareas                → sistema de tareas (tasks)
>   ├── Decisiones            → decision_events → run_phase_engine
>   ├── Leads                 → CRM actualizado
>   ├── OBVs                  → OBV tracker actualizado
>   ├── Métricas              → key_metrics actualizado
>   └── Bloqueos recurrentes  → strategic_blocks (Bloque E)
>
> Motor actualizado → Optimus context (Bloque A) → brief de próxima reunión (Bloque B)
>   └── Bloque I vuelve a detectar nuevas necesidades de reunión → loop cierra
> ```
>
> **Lo que ya existe y NO se duplica:**
> - Pipeline completo: grabación → Whisper → GPT-4o → review → apply (~7.400 líneas)
> - `MeetingInsightsReview.tsx`: approve/reject/edit por insight, agrupado por tipo
> - `MeetingCompletionSummary.tsx`: resumen post-apply con stats y links (desconectado)
> - `meeting_insights`, `meeting_ai_questions`, `meeting_decisions` en DB con RLS
> - `apply-meeting-insights` crea tasks/leads/OBVs directamente
> - `integration_insights` + agent system (Finance, Sales, Execution, Calendar agents)
> - Google Calendar sincronizado (integration_entities[calendar_event])
>
> **Lo que esta fase construye encima:**
> Meeting Agent · Impact & Validation gate · pre-meeting brief · pantalla de review propia ·
> co-piloto en reunión (notas live + check-in temas) · sugerencias proactivas de reunión ·
> commitment tracking · pattern detection · strategic alignment score · modo solo/equipo
>
> **Orden de ejecución obligatorio:**
> Bloque 0 (fix + modo solo) → **Bloque X (gate)** → Bloque A (motor) → Bloque B (pre-meeting) →
> Bloque C (calidad) → Bloque D (compromisos) → Bloque E (patrones) → Bloque F (alignment) →
> Bloque G (UX + review screen) → Bloque H (evidencia F17) →
> **Bloque I (sugerencias proactivas)** → **Bloque J (co-piloto)**
>
> **Bloques I y J dependen de A+B+D+E** — necesitan datos reales del motor y de reuniones anteriores.
>
> **Criterio de cierre:** una reunión real completa modifica el estado del motor ·
> Optimus muestra contexto de decisiones recientes · el founder ve si sus compromisos se cumplen ·
> el motor sugiere la próxima reunión · el sistema guía al founder durante la reunión.

### BLOQUE 0 — Saneamiento ✅ 6/6
> Bugs activos y datos mock que hacen que el sistema actual falle silenciosamente en producción.
> Son horas de trabajo, no días. Sin esto Bloque A no tiene base sólida.

- [x] **M18.0.1** Fix bugs de variable shadowing en `LiveMeetingRecorder.tsx`
  > Mismo patrón que G7.1 y G8.1. En 4 bloques catch del archivo:
  > parámetro `_error` pero el cuerpo del catch referencia `error` (undefined).
  > Fix: renombrar parámetro a `error` en los 4 catch blocks (~líneas 144, 205, 255, 346).
  > Impacto actual: errores de permiso de micrófono, fallos de grabación y errores de upload
  > fallan silenciosamente — el usuario ve un spinner infinito sin mensaje.
  > **Criterio:** negar permiso de micrófono → toast "Permiso denegado" visible. tsc limpio.

- [x] **M18.0.2** Fix bugs de variable shadowing en `analyze-meeting/index.ts` y `apply-meeting-insights/index.ts`
  > `analyze-meeting/index.ts` ~línea 187: catch nombra `parseError` pero cuerpo usa `error`.
  > `apply-meeting-insights/index.ts` ~línea 163: patrón de error handling retorna Response
  > dentro de catch que no tiene sentido — debería retornar JSON de error consistente.
  > Fix: usar nombre consistente + retornar `new Response(JSON.stringify({error: e.message}), {status:500})`.
  > **Criterio:** forzar error de parsing en GPT-4 respuesta → error visible en logs de Supabase, no silencio.

- [x] **M18.0.3** Conectar datos reales en `MeetingIntelligencePage.tsx`
  > Actualmente pasa datos mock hardcodeados como participants y OBVs al flow.
  > `// (en producción vendría de la BD)` — ese comentario lleva ahí desde el inicio.
  > Fix: usar `useProjectMembers(projectId)` para participants y `useProjectOBVs(projectId)` para OBVs.
  > Sin esto, GPT-4 asigna tasks a member IDs ficticios que no existen → apply falla silenciosamente.
  > **Criterio:** crear reunión real → insights con assigned_to que corresponde a member real del proyecto.

- [x] **M18.0.4** Conectar `MeetingCompletionSummary` al flujo
  > El componente `src/components/meetings/MeetingCompletionSummary.tsx` está completamente implementado
  > pero nunca se renderiza. `MeetingIntelligencePage.tsx` no lo incluye en el state machine.
  > Fix: tras `apply-meeting-insights` exitoso, mostrar `MeetingCompletionSummary` con los counts reales
  > (N tasks creadas, N leads, N OBVs actualizados) antes de volver a idle.
  > **Criterio:** completar flujo completo → pantalla de resumen visible con datos reales.

- [x] **M18.0.5** Quitar `language: 'es'` hardcodeado en `transcribe-meeting/index.ts`
  > Whisper soporta auto-detección de idioma omitiendo el parámetro `language`.
  > Con el valor hardcodeado, reuniones en inglés o con mezcla español/inglés producen
  > transcripciones degradadas.
  > Fix: eliminar `language: 'es'`. Añadir `language` como parámetro opcional del request body
  > para que el frontend lo pueda pasar explícitamente si se desea.
  > **Criterio:** reunión en inglés transcrita correctamente sin especificar idioma.

- [x] **M18.0.6** Modo solo vs modo equipo — adaptar UX según tamaño del equipo
  > La feature tiene valor para un solo founder (reuniones con clientes, inversores, partners)
  > pero algunas partes (asignación a miembros, insights de "actividad de socios") no aplican.
  > En `MeetingIntelligencePage.tsx`: al cargar, comprobar count de `project_members`.
  > **Si 0 miembros (solo mode):**
  > - Ocultar selector de participantes — el founder es el único implícito
  > - Ocultar asignación de tasks a "miembro" — asignadas al founder por defecto
  > - Ocultar sección "Actividad de socios" en suggestions (Bloque I)
  > - Mostrar banner contextual: "Invita a tu equipo para activar colaboración en reuniones"
  > **Si ≥1 miembro (team mode):**
  > - Flujo completo sin restricciones
  > - Sugerencias de reunión incluyen detección de inactividad de socios (Bloque I)
  > Implementar como `useMeetingMode(projectId)` hook que devuelve `{ mode: 'solo' | 'team', memberCount }`.
  > **Criterio:** proyecto sin miembros → selector de participantes oculto · tasks asignadas al founder.
  > Proyecto con 1+ miembro → flujo completo visible.

### BLOQUE X — Impact & Validation Layer (prerequisito de Bloque A)
> **Por qué existe este bloque:** el pipeline reunión → motor es demasiado directo sin un gate.
> Una afirmación vaga en una reunión mal grabada no puede mover el motor de la misma forma que
> una decisión explícita, aprobada y con transcripción fiable.
> Este bloque clasifica cada insight por nivel de impacto, mide la fiabilidad combinada
> (transcripción × claridad × certeza del speaker) y solo deja pasar al motor
> lo que es estratégico + verificado + aprobado por el founder.
>
> **Los tres niveles:**
> - **Level 1 — Informativo** (`low`): contexto, observaciones sueltas, ideas vagas. Nunca toca el motor.
> - **Level 2 — Operativo** (`medium`): compromisos, action items, follow-ups. Solo crea tasks, auto-aprobado.
> - **Level 3 — Estratégico** (`high`): decisiones con stakeholders, bloqueadores críticos, métricas explícitas.
>   Requiere aprobación del founder → dispara decision_events + run_phase_engine.
>
> **Umbral de fiabilidad combinada:**
> `combined_reliability = transcription_confidence × clarity_score × speaker_certainty_weight`
> Si `combined_reliability < 0.5` → high se degrada a medium. Si `< 0.3` → medium se degrada a low.
> El motor nunca recibe una señal con `combined_reliability < 0.5`.
>
> Depende de Bloque 0 completado (clarity_score requiere audio procesado con confianza real).

- [x] **M18.X.1** Definir contrato TypeScript `MeetingInsightWithImpact`
  > Extender el tipo de insight de reunión con los campos necesarios para el gate.
  > En `src/lib/meeting-agent.ts` (creado en M18.1), añadir interface:
  > ```typescript
  > export interface MeetingInsightWithImpact {
  >   id: string
  >   insight_type: string
  >   impact_level: 'low' | 'medium' | 'high'   // Level 1/2/3
  >   clarity_score: number                        // 0–1: qué tan explícita es la afirmación
  >   speaker_certainty: 'definitive' | 'conditional' | 'speculative'
  >   combined_reliability: number                 // calculado: tc × clarity × certainty_weight
  >   requires_confirmation: boolean               // true solo si high + combined_reliability ≥ 0.5
  >   auto_degraded: boolean                       // true si fue high/medium degradado por baja fiabilidad
  >   degradation_reason?: string                  // por qué se degradó (para mostrar al usuario)
  > }
  > ```
  > Mapeo insight_type → impacto por defecto (la función de clasificación puede sobreescribir):
  > - `decision` → high (si stakeholders no vacíos y clarity_score ≥ 0.7), medium en caso contrario
  > - `blocker` + severity=critical → high; blocker + severity!=critical → medium
  > - `metric_update` con valor numérico explícito → high; sin valor → low
  > - `commitment`, `action_item`, `follow_up` → medium
  > - `context`, `info_share`, resto → low
  > **Criterio:** type compila sin errores. Todos los campos tienen JSDoc con la regla que los gobierna.

- [x] **M18.X.2** Implementar `classifyInsightImpact()` — función pura en `meeting-agent.ts`
  > ```typescript
  > export function classifyInsightImpact(
  >   insight: MeetingInsightRow,
  >   transcriptionConfidence: number,
  > ): MeetingInsightWithImpact
  > ```
  > Reglas de clasificación (en orden de prioridad):
  > 1. `decision` + stakeholders.length ≥ 1 + clarity_score ≥ 0.7 → **high**
  > 2. `decision` sin stakeholders o clarity_score < 0.7 → **medium**
  > 3. `blocker` + severity='critical' → **high**
  > 4. `blocker` + severity!='critical' → **medium**
  > 5. `metric_update` + payload tiene `value` numérico → **high**
  > 6. `metric_update` sin valor numérico → **low**
  > 7. `commitment`|`action_item`|`follow_up` → **medium**
  > 8. todo lo demás → **low**
  > Después de clasificar: aplicar degradación por `combined_reliability`:
  > - `speaker_certainty_weight`: definitive=1.0, conditional=0.7, speculative=0.3
  > - `combined_reliability = transcriptionConfidence × clarity_score × speaker_certainty_weight`
  > - Si high + combined_reliability < 0.5 → degradar a medium, `auto_degraded=true`,
  >   `degradation_reason = 'Baja fiabilidad combinada (${combined_reliability.toFixed(2)})'`
  > - Si medium + combined_reliability < 0.3 → degradar a low, igual patrón
  > `requires_confirmation = impact_level === 'high' && !auto_degraded`
  > **Criterio:** test unitario con 6 casos (uno por cada regla clave) → clasificación correcta en todos.

- [x] **M18.X.3** Añadir `clarity_score` y `speaker_certainty` al output de `analyze-meeting/index.ts`
  > Claude (tras M18.10) debe emitir por cada insight dos campos nuevos:
  > ```typescript
  > clarity_score: number        // 0.0–1.0
  > // 1.0 = "cerramos el contrato con Acme el viernes" (explícito, afirmativo)
  > // 0.6 = "deberíamos cerrar ese contrato" (condicional)
  > // 0.2 = "tal vez en algún momento deberíamos explorar" (especulativo)
  > speaker_certainty: 'definitive' | 'conditional' | 'speculative'
  > // definitive: "cerramos", "decidimos", "hay que hacer X"
  > // conditional: "deberíamos", "podríamos", "cuando sea posible"
  > // speculative: "quizás", "a lo mejor", "en algún momento"
  > ```
  > Añadir estas instrucciones al system prompt de analyze-meeting:
  > "For each insight, evaluate how explicitly and certainly it was stated.
  >  clarity_score: 1.0=stated fact, 0.5=conditional plan, 0.2=vague possibility.
  >  speaker_certainty: definitive (closed statements), conditional (plans), speculative (ideas)."
  > Guardar en `meeting_insights.payload.clarity_score` y `payload.speaker_certainty`.
  > Migración: añadir columna generada o usar payload JSONB ya existente (sin migración nueva, solo payload).
  > **Criterio:** reunión con "decidimos pivotar" → clarity_score ≥ 0.8, speaker_certainty='definitive'.
  >  "quizás deberíamos explorar esto" → clarity_score ≤ 0.35, speaker_certainty='speculative'.

- [x] **M18.X.4** Gate de motor en `apply-meeting-insights/index.ts`
  > Este es el enforcement point del Bloque X. Antes de ejecutar M18.3 (decision_events) y M18.4 (run_phase_engine):
  > ```typescript
  > const classifiedInsights = insights.map(i =>
  >   classifyInsightImpact(i, meeting.transcription_confidence ?? 0.6)
  > )
  >
  > // Solo los high + aprobados + combined_reliability ≥ 0.5 tocan el motor
  > const engineEligible = classifiedInsights.filter(
  >   i => i.impact_level === 'high' && i.requires_confirmation && i.status === 'approved'
  > )
  >
  > // Medium: crear tasks sin confirmación
  > const taskEligible = classifiedInsights.filter(
  >   i => (i.impact_level === 'medium' || i.impact_level === 'high') && i.status !== 'rejected'
  > )
  >
  > // Low: guardar en meeting_insights, no crear nada activo
  > ```
  > Si un insight es `high` pero `auto_degraded=true` → tratarlo como `medium` (no toca motor).
  > Añadir al response body de `apply-meeting-insights`:
  > `{ insights_degraded: N, engine_writes_blocked: N, reason: string[] }` para debugging/auditoría.
  > **Criterio:** decisión vaga con speaker_certainty='speculative' → combined_reliability < 0.5 →
  > `auto_degraded=true` → no crea decision_event, no dispara motor, crea task normal.

- [x] **M18.X.5** UX de confirmación por nivel de impacto en `MeetingInsightsReview.tsx`
  > Rediseñar el flujo de review para reflejar los tres niveles con fricción proporcional:
  > - **Level 3 — Estratégico** (high): badge rojo "Estratégico · requiere aprobación".
  >   Botón "Confirmar decisión estratégica" prominente. No se puede ignorar.
  >   Si fue auto-degradado → badge ámbar "Estratégico degradado a Operativo · baja confianza" + tooltip con razón.
  > - **Level 2 — Operativo** (medium): badge ámbar "Operativo · se aplica automáticamente".
  >   Solo botón "Rechazar" para excluirlo. Sin confirmación positiva requerida.
  > - **Level 1 — Informativo** (low): colapsado por defecto. Badge gris "Informativo".
  >   "Ver contexto" para expandir. No genera acciones. No tiene botones de aprobación.
  > Header de la sección: "N insights estratégicos requieren tu confirmación · M operativos · K informativos"
  > Al hacer scroll, los Level 3 no aprobados tienen sticky indicator arriba: "⚠ 2 decisiones pendientes"
  > **Criterio:** reunión con 1 decisión explícita + 2 action items + 1 idea vaga →
  > 1 insight con botón "Confirmar", 2 auto-aplicados, 1 colapsado. tsc limpio.

- [x] **M18.X.6** Indicador de fiabilidad en `MeetingInsightsReview.tsx` y `MeetingCompletionSummary.tsx`
  > Para cada insight en la review, mostrar barra de fiabilidad combinada:
  > `combined_reliability = tc × clarity × certainty` — valor visual 0–100%.
  > ```
  > Fiabilidad: ████████░░ 82%  (Transcripción 90% · Claridad 85% · Certeza: Definitivo)
  > Fiabilidad: ████░░░░░░ 38%  ⚠ Degradado — bajo la decisión toca motor si apruebas manualmente
  > ```
  > En `MeetingCompletionSummary.tsx` (M18.0.4): añadir sección "Calidad de la sesión":
  > - `transcription_confidence` de la reunión (badge verde/ámbar/rojo)
  > - N insights estratégicos confirmados / N totales high clasificados
  > - N insights degradados por baja fiabilidad (con razón resumida)
  > - "Fiabilidad media de los insights aplicados: 74%"
  > **Criterio:** reunión con audio mediocre (tc=0.55) + 2 insights degradados → summary muestra
  > "2 insights reclasificados por baja fiabilidad" con fiabilidad media visible.

### BLOQUE A — Meeting Agent: integración con el motor de fases ✅ 6/6
> El cambio más importante de la fase. Conecta reuniones → motor.
> Depende de Bloque 0 **y Bloque X** completados.
> Sin el gate de Bloque X, este bloque permitiría que cualquier insight toque el motor.
> Sigue el mismo patrón de Finance Agent (I15.78) y Sales Agent (I15.79).

- [x] **M18.1** Crear `src/lib/meeting-agent.ts` — lógica pura del Meeting Agent
  > Función pura `runMeetingAgentLocal(insights: MeetingInsightRow[]): MeetingAgentInsightData[]`
  > Lee los `meeting_insights` aprobados de una reunión y genera `integration_insights`.
  > **Tipos de insight del Meeting Agent:**
  > - `strategic_decision` (severity warning/critical) — decisiones de alto impacto detectadas
  >   → `min 1 decision aprobada con stakeholders != vacío`
  > - `commitment_cluster` (severity info/attention) — ≥3 tasks creadas en una reunión
  >   → señal de reunión muy orientada a acción
  > - `recurring_blocker` (severity attention/warning) — blocker que aparece en ≥2 reuniones
  >   → depende de historial: usa `meeting_insights` anteriores del mismo `insight_type=blocker`
  > - `metric_update` (severity info) — métrica actualizada en reunión con valor explícito
  >   → conecta directamente con key_metrics si la métrica es MRR o similar
  > `expires_hours` por tipo: strategic_decision=168h (7d) · commitment_cluster=48h · recurring_blocker=336h (14d) · metric_update=24h
  > Anti-spam §10: mismas ventanas que Finance/Sales Agent.
  > **Criterio:** test unitario: 1 decisión aprobada con stakeholders → 1 insight `strategic_decision` emitido.

- [x] **M18.2** Crear `src/services/meetingAgentService.ts` — DB interface del Meeting Agent
  > Sigue el patrón de `financeAgentService.ts` y `salesAgentService.ts` exactamente.
  > `runMeetingAgent(projectId, meetingId)`:
  > 1. Lee `meeting_insights` aprobados del meetingId
  > 2. Obtiene `sync_run_id` — el Meeting Agent no tiene connection_id (no es un provider externo).
  >    Solución: crear un `integration_connections` especial con `provider='meeting_intelligence'`
  >    al primer uso si no existe. El `sync_run_id` es el meeting_id mapeado a un run.
  > 3. Corre `runMeetingAgentLocal(insights)`
  > 4. Anti-spam sobre `integration_insights[agent_type='meeting']`
  > 5. Inserta nuevos insights con `evidence_type='observed'` (transcript verificable)
  > Llamar desde `apply-meeting-insights` al final, tras aplicar todos los insights.
  > **Criterio:** tras apply-meeting-insights, nueva fila en integration_insights con agent_type='meeting'.

- [x] **M18.3** Conectar decisiones de reunión → `decision_events`
  > La tabla `decision_events` existe (creada en FASE 2 D2.9) pero nunca se escribe desde reuniones.
  > En `apply-meeting-insights/index.ts`, para cada insight de tipo `decision` aprobado:
  > ```sql
  > INSERT INTO decision_events (project_id, decision_type, description, context, triggered_by, created_at)
  > VALUES ($1, 'meeting_decision', $2, $3, 'meeting_intelligence', NOW())
  > ```
  > Esto alimenta P8.6 (behavioral_block detection, diferido en FASE 8) con datos reales de decisiones.
  > **Criterio:** aprobar 1 decision insight en reunión → nueva fila en decision_events visible en Supabase.

- [x] **M18.4** `apply-meeting-insights` dispara `run_phase_engine` tras aplicar
  > Al final de `apply-meeting-insights/index.ts`, después de aplicar todos los insights:
  > ```typescript
  > // Si se crearon tasks o se actualizaron OBVs → puede haber cambio de fase
  > if (tasksCreated > 0 || obvsUpdated > 0) {
  >   await supabaseAdmin.rpc('run_phase_engine', {
  >     p_project_id: meetingId_projectId,
  >     p_trigger_source: 'meeting_intelligence'
  >   })
  > }
  > ```
  > Añadir `'meeting_intelligence'` al CHECK constraint de `trigger_source` en `project_phase_history`
  > (mismo patrón que `'integration'` añadido en migración 20260315000006).
  > **Criterio:** aplicar insights con ≥1 tarea creada → `project_phase_history` nueva fila con trigger_source='meeting_intelligence'.

- [x] **M18.5** Crear `src/components/integrations/MeetingInsightsCard.tsx`
  > Componente para mostrar insights activos del Meeting Agent en el contexto del proyecto.
  > Mismo patrón que `FinanceInsightsCard.tsx` y `SalesInsightsCard.tsx`.
  > Lee `integration_insights[agent_type='meeting']` via `getActiveMeetingInsights(projectId)`.
  > Badge "Meeting Agent" en azul oscuro. Severity badges idénticos.
  > Añadir `getActiveMeetingInsights` a `meetingAgentService.ts`.
  > Colocar en `ProjectEnginePanel` junto al resto de agent signals.
  > **Criterio:** tras una reunión con decisión aprobada, card visible en ProjectEnginePanel con insight. tsc limpio.

- [x] **M18.6** Añadir contexto de reuniones recientes a `get_optimus_context()`
  > En `supabase/migrations/20260319000002_fase18_optimus_meeting_context.sql`:
  > Añadir a la función SQL `get_optimus_context(p_project_id, p_user_id?)`:
  > ```sql
  > 'recent_decisions', (
  >   SELECT jsonb_agg(jsonb_build_object(
  >     'description', payload->>'description',
  >     'meeting_date', source_timestamp,
  >     'confidence', confidence
  >   ) ORDER BY source_timestamp DESC)
  >   FROM integration_insights
  >   WHERE project_id = p_project_id
  >     AND agent_type = 'meeting'
  >     AND insight_type = 'strategic_decision'
  >     AND expires_at > NOW()
  >   LIMIT 3
  > )
  > ```
  > Así Optimus sabe qué decisiones estratégicas se tomaron recientemente en reuniones.
  > **Criterio:** proyecto con decisión de reunión aprobada → `get_optimus_context` incluye `recent_decisions` no vacío.

### BLOQUE B — Pre-meeting intelligence (Optimus antes de la reunión)
> Depende de Bloque A. Convierte el sistema de reactivo a proactivo.

- [ ] **M18.7** Edge function `get-meeting-brief/index.ts`
  > Nueva edge function. Genera el brief pre-reunión para el founder.
  > Input: `{ project_id, meeting_type, objectives?, estimated_duration_min? }`
  > Flow:
  > 1. Llama `get_optimus_context(project_id)` — estado completo del motor
  > 2. Lee últimas 3 reuniones del mismo `meeting_type` — qué se discutió antes
  > 3. Lee `integration_insights` activos — señales de agentes relevantes
  > 4. Llama Claude (claude-sonnet-4-6) con prompt especializado:
  >    - Estado actual del motor (fase, probabilidad, riesgo, bloqueos)
  >    - Contexto de reuniones anteriores del mismo tipo
  >    - Señales de agentes activos
  >    - Tipo de reunión y objetivos declarados
  > Output schema:
  > ```typescript
  > {
  >   headline: string           // "Antes de tu cliente: probabilidad bajó 12pts esta semana"
  >   engine_status: string      // resumen del motor en 1 frase
  >   key_signals: string[]      // máx 3 señales relevantes para este tipo de reunión
  >   suggested_topics: string[] // qué cubrir dado el estado del motor
  >   risk_flags: string[]       // qué evitar o manejar con cuidado
  >   confidence: number         // 0–1
  > }
  > ```
  > **Criterio:** invocar con proyecto en fase 2, risk_level=high → brief menciona el riesgo activo.

- [ ] **M18.8** UI "Brief pre-reunión" en `StartMeetingModal.tsx` paso 2
  > En el paso 2 (Strategic Context) del wizard de configuración de reunión:
  > Añadir sección "Estado del motor" que muestra el brief generado por `get-meeting-brief`.
  > Se carga automáticamente al llegar al paso 2 (spinner mientras carga, no bloqueante).
  > Si la edge function falla → sección no aparece, wizard sigue funcionando normal.
  > Layout: card compacta con headline + key_signals como bullets + risk_flags en ámbar.
  > CTA "Usar sugerencia" junto a cada `suggested_topic` para añadirlo a los objetivos.
  > **Criterio:** abrir modal de reunión con proyecto conectado a Stripe → brief cargado con datos reales del engine.

- [ ] **M18.9** Google Calendar → auto-crear meeting record
  > Cuando el usuario tiene Google Calendar sincronizado (`integration_connections[provider='google_calendar']`):
  > En `GoogleCalendarIntegration.tsx`, tras un sync exitoso, mostrar lista de eventos futuros (próximas 48h)
  > con botón "Iniciar reunión" por cada uno.
  > Al pulsar: pre-popula `StartMeetingModal` con title del evento, participants de los attendees del evento
  > (mapeados a project_members por email), y duration del evento.
  > No crear el meeting record hasta que el usuario confirme — el modal sigue siendo el punto de entrada.
  > **Criterio:** evento de GCal con 2 attendees que son project_members → StartMeetingModal pre-populado con esos datos.

### BLOQUE C — Calidad y fidelidad de transcripción/análisis
> Depende de Bloque 0. Mejora la calidad de los datos de entrada al sistema.

- [ ] **M18.10** Migrar `analyze-meeting` de GPT-4o a Claude (claude-sonnet-4-6)
  > El proyecto ya tiene `ANTHROPIC_API_KEY` configurado. Usar Claude en lugar de GPT-4o:
  > - Mejor comprensión del contexto en español
  > - Costes más predecibles
  > - Coherencia con el resto del sistema (Optimus ya usa Claude)
  > Cambiar en `analyze-meeting/index.ts`: sustituir `openai.chat.completions.create()` por
  > `Anthropic().messages.create()` con claude-sonnet-4-6, max_tokens=4096, temperature=0.3.
  > Ajustar el prompt para el formato de Claude (system + user en lugar de roles GPT).
  > Mantener el JSON response format — Claude también soporta JSON estructurado.
  > **Criterio:** análisis de reunión real con Claude → mismos 6 tipos de insights extraídos correctamente.

- [ ] **M18.11** Añadir `transcription_confidence` a `meetings` table
  > Migración: `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS transcription_confidence NUMERIC`
  > Whisper `verbose_json` incluye `avg_logprob` (log-probabilidad media de la transcripción) por segmento.
  > Calcular confidence como `EXP(avg(avg_logprob))` de todos los segmentos → valor 0–1.
  > Guardar en `meetings.transcription_confidence` junto al transcript.
  > Usar este valor en M18.10 como input al prompt de análisis: baja confianza → Claude más conservador.
  > Conectar con FASE 17: `low_evidence_quality = transcription_confidence < 0.6` para insights de reunión.
  > **Criterio:** audio de baja calidad (ruido) → transcription_confidence < 0.7 · audio limpio → > 0.85.

- [ ] **M18.12** Validación mínima de calidad antes de analizar
  > En `transcribe-meeting/index.ts`, tras transcribir:
  > Si `transcription_confidence < 0.4` → guardar transcript pero NO auto-disparar analyze-meeting.
  > En su lugar: mostrar aviso al usuario "Calidad de audio baja (40%). La transcripción puede tener errores.
  > ¿Continuar con el análisis o subir de nuevo?"
  > Si confirma → analizar con flag `low_quality=true` en la petición.
  > Si < 0.2 → rechazar directamente: "Audio no procesable. Sube un archivo de mayor calidad."
  > **Criterio:** audio de prueba de 5 segundos con ruido fuerte → aviso de baja calidad visible.

- [ ] **M18.13** Diarización básica de speakers en transcript
  > Whisper `verbose_json` incluye `segments` con timestamps. No incluye speaker IDs.
  > Implementación pragmática sin servicio de diarización externo:
  > Dividir transcript en bloques por pausas largas (gap > 2s entre segmentos).
  > Etiquetar como "Participante A", "Participante B", etc. basado en cambios de tono detectables
  > (heurística simple — no identificación por voz).
  > Si los participants están definidos y hay N participantes → sugerir asignación manual post-transcripción.
  > Guardar transcript estructurado como array de `{ speaker_hint, text, start_time, end_time }` en JSONB.
  > **Criterio:** transcript de reunión con 2 speakers → bloques de texto claramente separados por speaker_hint.

### BLOQUE D — Cierre del loop de compromisos
> Depende de Bloque A. Sin Meeting Agent emitiendo insights, no hay qué trackear.

- [ ] **M18.14** Añadir `meeting_id` a `tasks.source_context` para trazabilidad
  > Las tasks creadas desde `apply-meeting-insights` ya tienen `source='meeting_intelligence'`.
  > Añadir también `meeting_id` en `source_context JSONB` o nuevo campo `meeting_id UUID REFERENCES meetings(id)`.
  > Migración: `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL`
  > Actualizar `apply-meeting-insights` para poblar `meeting_id` en cada task creada.
  > **Criterio:** task creada desde reunión → `task.meeting_id` contiene el UUID de la reunión.

- [ ] **M18.15** Función SQL `get_meeting_fulfillment(p_meeting_id UUID)` → commitment tracking
  > ```sql
  > CREATE OR REPLACE FUNCTION get_meeting_fulfillment(p_meeting_id UUID)
  > RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
  > -- Retorna:
  > -- { total_tasks, completed_tasks, overdue_tasks, fulfillment_rate, tasks_list }
  > ```
  > `fulfillment_rate = completed_tasks / total_tasks` (0–1)
  > Task overdue = `status != 'done' AND fecha_limite < NOW()`
  > **Criterio:** reunión con 3 tasks creadas (1 completada, 2 pendientes) → fulfillment_rate=0.33.

- [ ] **M18.16** `MeetingHistory.tsx` — mostrar fulfillment rate por reunión
  > En cada card de reunión completada en `MeetingHistory.tsx`:
  > Añadir indicador visual de fulfillment rate:
  > - ≥ 0.8: verde "80% compromisos cumplidos"
  > - 0.5–0.79: ámbar "50% compromisos cumplidos"
  > - < 0.5: rojo "25% compromisos cumplidos · 2 vencidos"
  > Si 0 tasks creadas → no mostrar indicador (reunión sin compromisos explícitos).
  > Hook `useMeetingFulfillment(meetingId)` que llama `get_meeting_fulfillment`.
  > **Criterio:** reunión con tasks en distintos estados → fulfillment rate visible en color correcto.

- [ ] **M18.17** Notificación de compromisos de reunión vencidos (Layer 1)
  > En `run_notification_batch()` (migración `00050+`), añadir nueva función de Layer 1:
  > `notify_overdue_meeting_commitments(project_id)`:
  > - Busca tasks con `meeting_id IS NOT NULL AND status != 'done' AND fecha_limite < NOW()`
  > - Si hay ≥ 2 overdue → emit `meeting_commitments_overdue` (HIGH, 3d window)
  > Copy: "Tienes N compromisos de reunión vencidos · [Ver tareas]"
  > **Criterio:** 2 tasks de reunión vencidas → notificación HIGH visible en notification center.

### BLOQUE E — Detección de patrones
> Depende de Bloque A (Meeting Agent emitiendo insights) + al menos 3 reuniones en DB.
> Este bloque convierte el historial de reuniones en señal estratégica.

- [ ] **M18.18** Función SQL `detect_meeting_patterns(p_project_id UUID)`
  > ```sql
  > CREATE OR REPLACE FUNCTION detect_meeting_patterns(p_project_id UUID)
  > RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
  > -- Analiza meeting_insights de las últimas N reuniones y detecta:
  > -- recurring_topics: temas/blockers que aparecen en ≥2 reuniones (por similarity de title)
  > -- unresolved_blockers: blockers de reunión sin task completada asociada
  > -- meeting_type_frequency: qué tipos de reunión dominan (señal de uso)
  > -- avg_fulfillment_rate: media de fulfillment en últimas 5 reuniones
  > $$;
  > ```
  > Implementación pragmática: `ILIKE '%keyword%'` para detectar temas similares.
  > No require ML — usa comparación textual de titles de blockers.
  > **Criterio:** 3 reuniones con blocker "falta de recursos técnicos" → aparece en `recurring_topics`.

- [ ] **M18.19** Conectar patrones recurrentes → `strategic_blocks`
  > Si `detect_meeting_patterns` detecta un blocker que aparece en ≥ 3 reuniones:
  > Crear automáticamente un `strategic_block` con:
  > - `block_type = 'structural'`
  > - `description = título del blocker recurrente`
  > - `source = 'meeting_pattern'`
  > - `first_detected_at = fecha de la primera reunión donde apareció`
  > Este es el primer mecanismo que alimenta `strategic_blocks` automáticamente
  > (actualmente solo se crean manualmente o por el Org Engine).
  > Ejecutar como parte de `runMeetingAgent()` (M18.1) → comprueba historial antes de emitir.
  > **Criterio:** blocker en 3 reuniones → nueva fila en strategic_blocks visible en ProjectEnginePanel.

- [ ] **M18.20** UI "Temas sin resolver" en `MeetingHistory.tsx`
  > Sección colapsable al top de MeetingHistory con output de `detect_meeting_patterns`:
  > - Lista de blockers recurrentes con conteo de reuniones donde apareció
  > - Fulfillment rate histórico (últimas 5 reuniones)
  > - Si fulfillment_rate < 0.5 consistentemente → banner "Tus reuniones generan compromisos que no se cumplen"
  > Este panel solo aparece cuando hay ≥ 3 reuniones completadas.
  > **Criterio:** 3+ reuniones con blocker recurrente → sección visible con el tema identificado.

### BLOQUE F — Strategic alignment
> Depende de Bloque A y Bloque D. Evalúa si las reuniones avanzan el proyecto o lo distraen.

- [ ] **M18.21** Edge function `evaluate-meeting-alignment/index.ts`
  > Post-meeting: Claude evalúa si la reunión avanzó las prioridades del motor.
  > Input: `{ meeting_id }` — carga meeting_insights aprobados + get_optimus_context
  > Prompt a Claude: "Dado el estado del motor (fase X, riesgo Y, bloqueo Z) y los insights de esta reunión
  > (N compromisos, M decisiones), ¿cuánto avanzó esta reunión la prioridad actual del proyecto?"
  > Output schema:
  > ```typescript
  > {
  >   alignment_score: number  // 0–1
  >   aligned_insights: string[]    // insights que avanzan la fase actual
  >   distraction_insights: string[] // compromisos que no están alineados con la prioridad
  >   summary: string               // "Esta reunión avanzó X, pero generó distracción en Y"
  > }
  > ```
  > Guardar en `meetings.alignment_data JSONB` (columna nueva en migración).
  > Llamar automáticamente tras `apply-meeting-insights`.
  > **Criterio:** reunión de ventas cuando el motor dice "necesitas validar hipótesis" → alignment_score < 0.6.

- [ ] **M18.22** Meeting quality score visible en `MeetingCompletionSummary.tsx`
  > `quality_score = (compromisos_accionables / duracion_min) × alignment_score × fulfillment_predictor`
  > - compromisos_accionables = tasks + decisions con assigned_to definido
  > - fulfillment_predictor basado en historial de fulfillment del proyecto
  > Mostrar en `MeetingCompletionSummary`:
  > - Score numérico (0–100)
  > - Label: Reunión muy ejecutiva · Reunión operativa · Reunión estratégica · Reunión de alineación
  > - "¿Esta reunión avanzó tu fase actual?" (alignment summary de M18.21)
  > **Criterio:** reunión de 30min con 3 tasks asignadas y alignment_score 0.8 → quality_score > 70.

- [ ] **M18.23** Widget "Última reunión" en `ProjectEnginePanel`
  > Sección compacta en ProjectEnginePanel (debajo de los agent signals) que muestra:
  > - Fecha y tipo de la última reunión completada
  > - Fulfillment rate de sus compromisos
  > - Si hay compromisos vencidos → badge rojo con count
  > - Link a MeetingHistory
  > Solo visible si hay al menos 1 reunión completada con insights aplicados.
  > **Criterio:** reunión completada hace 3 días con 2 tasks vencidas → widget visible con badge rojo.

### BLOQUE G — UX y superficies mejoradas
> Depende de Bloques D, E, F. Consolida la experiencia en superficies coherentes.

- [ ] **M18.24** Dashboard de Meeting Intelligence — KPIs en `MeetingHistory.tsx`
  > Header de MeetingHistory con 4 stats cards:
  > - Total reuniones (mes actual)
  > - Tiempo total en reuniones (horas) — `sum(estimated_duration_min) / 60`
  > - Tasks generadas / tasks completadas (compromisos cumplidos)
  > - Alignment score medio (últimas 5 reuniones)
  > **Criterio:** con ≥3 reuniones → las 4 métricas muestran valores reales.

- [ ] **M18.25** Timeline de decisiones — vista cruzada reuniones × ciclos estratégicos
  > Nueva vista `MeetingDecisionTimeline.tsx` accesible desde MeetingHistory.
  > Muestra en orden cronológico: decisiones de reunión + hitos de strategic_cycles + phase transitions.
  > Permite ver si las decisiones de reunión alinearon con los momentos clave del motor.
  > Implementado como lista ordenada por fecha, sin diagrama complejo.
  > Lee de: `decision_events[source='meeting_intelligence']` + `project_phase_history` + `strategic_cycles`.
  > **Criterio:** 2 reuniones con decisiones + 1 phase transition → timeline muestra los 3 eventos ordenados.

- [ ] **M18.26** Integrar meetings en `WeeklyReviewCard.tsx`
  > La `generate_weekly_review_for_project()` ya calcula tasks y OBVs de la semana.
  > Añadir: reuniones completadas esa semana + total compromisos + fulfillment rate semanal.
  > Migración en la función SQL: añadir subquery sobre `meetings WHERE completed_at > week_start`.
  > **Criterio:** semana con 1 reunión completada → WeeklyReview incluye "1 reunión · 3 compromisos · 67% cumplidos".

- [ ] **M18.G.1** Pantalla de review post-reunión como experiencia full-screen
  > `MeetingInsightsReview.tsx` existe y tiene approve/reject/edit, pero está embebido como paso
  > en el wizard de `MeetingIntelligencePage.tsx` — no tiene presencia visual suficiente para la
  > importancia de la decisión que se le pide al founder.
  > Crear ruta dedicada `/meeting-review/:meetingId` con `MeetingReviewPage.tsx`.
  > **Layout 3 columnas:**
  > - Izquierda (30%): transcript completo, scrollable, con fragmentos resaltados por insight
  > - Centro (45%): insights agrupados por nivel de impacto (Level 3 primero, Level 2, Level 1)
  >   con el diseño de fricción proporcional de M18.X.5. Barra de fiabilidad por insight (M18.X.6).
  > - Derecha (25%): resumen ejecutivo en vivo — se actualiza según los insights aprobados.
  >   "Si aplicas esto: N tareas · M decisiones · K leads · Impacto en motor: [si/no]"
  > **CTA final:** "Aplicar insights aprobados" (prominente) | "Guardar sin aplicar" | "Revisar más tarde"
  > Tras aplicar → `MeetingCompletionSummary` in-page con acciones contextuales directas:
  > - Task creada → botón "Ver tarea" abre side panel (no navega fuera)
  > - Lead creado → botón "Ver en CRM" abre side panel
  > - Decisión confirmada → badge "Registrada en el motor" con link a decision_events
  > Accesible también desde `MeetingHistory.tsx` para revisar cualquier reunión pasada.
  > Redirección automática desde el wizard al finalizar análisis, con deep link compartible.
  > **Criterio:** reunión analizada → redirige a /meeting-review/:id con transcript + insights clasificados.
  > Al aplicar: MeetingCompletionSummary visible in-page · "Ver tarea" abre side panel sin navegar.

### BLOQUE H — Integración con FASE 17 (evidence system)
> Depende de FASE 17 Bloque A + Bloque D de esta fase.
> Las reuniones son evidencia observada y verificable — deben integrarse con el sistema de evidencia.

- [ ] **M18.27** `evidence_type = 'observed'` para insights de reunión con transcripción
  > En `meetingAgentService.ts` (M18.2): al insertar integration_insights del Meeting Agent,
  > poblar `evidence_type`:
  > - Si `meeting.transcription_confidence ≥ 0.7` → `'observed'` (transcripción fiable)
  > - Si `0.4 ≤ transcription_confidence < 0.7` → `'declared'` (dato registrado, calidad media)
  > - Si `transcription_confidence < 0.4` → `'estimated'` (baja fiabilidad)
  > `sources_used = [{ source: 'meeting_intelligence', confidence: transcription_confidence, entity_count: approved_insights_count }]`
  > **Criterio:** reunión con audio claro → evidence_type='observed' en integration_insights del Meeting Agent.

- [ ] **M18.28** `SourcesPanel` en `MeetingInsightsReview.tsx` — mostrar fragmento del transcript
  > Al expandir "Ver fuentes" en cada insight de `MeetingInsightsReview`:
  > Mostrar el fragmento del transcript que generó el insight (si disponible en payload).
  > Formato: "Extraído de: '[...fragmento de 100 chars...]' · minuto 12:34"
  > Añadir `transcript_fragment` y `transcript_timestamp` al payload que `analyze-meeting` guarda
  > por cada insight (pedir a Claude que incluya evidencia textual del transcript).
  > **Criterio:** insight de tipo "decision" → "Ver fuentes" muestra el fragmento del transcript que lo justifica.

- [ ] **M18.29** Fiabilidad de insights de reunión basada en `transcription_confidence`
  > En `computeEvidenceScore()` (T17.5 de FASE 17):
  > Para evidencias con `source = 'meeting_intelligence'`:
  > `base_weight = SOURCE_WEIGHTS.meeting_intelligence ?? 0.75`
  > `confidence = meeting.transcription_confidence × insight.confidence`
  > Si la reunión no tiene transcription_confidence (reunión anterior a FASE 18) → usar 0.6 como fallback.
  > Añadir `'meeting_intelligence'` a `FIELD_COMPATIBILITY` para los campos que el Meeting Agent puede actualizar.
  > **Criterio:** insight de reunión con transcription_confidence=0.9 → computeEvidenceScore ≥ 0.7.

---

## FASE 19 — FOCO, LOOP Y ADAPTACIÓN ✅ CERRADA 14/14
> **Prerequisito:** FASE 16 activa. No depende de FASE 17 ni FASE 18 — se puede ejecutar en paralelo.
>
> **El problema que resuelve:**
> El sistema tiene todas las piezas correctas pero no están orquestadas.
> `getNextAction()` existe con 13 reglas y calcula la acción correcta. Los agent signals existen.
> El feedback de tareas se captura. Pero el usuario entra al dashboard y ve stats (€0, 0 leads)
> antes de ver qué tiene que hacer. Y cuando completa una tarea con "siguiente_accion" definida,
> esa información se guarda en la base de datos y nunca vuelve al usuario como acción.
>
> Esta fase no añade features nuevas. **Orquesta las que ya existen.**
>
> **El sistema resultante:**
> ```
> Usuario entra al proyecto
>     ↓
> [FOCUS BLOCK — full width, primer elemento visible]
> "Tu prioridad ahora: Valida la demanda con más evidencia"
> [Crear OBV →]   [¿Por qué? ▼ — señales que lo generaron]
>     ↓
> Ejecuta la acción
>     ↓
> Si es una tarea → TaskCompletionDialog
>   → "¿Crear siguiente paso: [texto de siguiente_accion]?" [Crear en 1 click]
>   → Si demand + éxito → "¿Registrar como OBV?" [Crear en 1 click]
>     ↓
> Motor actualizado → nuevo Focus Block
> ```
>
> **Lo que NO cambia:** la lógica del motor, las reglas del engine, el Kanban, el resto de features.
> Solo cambia dónde aparece y cómo se conecta lo que ya existe.
>
> **Paralela a F17/F18** porque no toca integraciones, meetings, ni el sistema de evidencia.
> Se puede implementar mientras F17/F18 esperan datos reales.
>
> **Orden de ejecución:** Bloque A → Bloque B → Bloque C
> Bloque A es el cambio más visible e impactante. Bloque B cierra los loops.
> Bloque C completa la adaptación por fase.

### BLOQUE A — Focus Block: Next Action como centro visual absoluto
> Reposiciona y amplía lo que ya existe. `getNextAction()` ya calcula correctamente.
> El problema es que está en col-span-3 sidebar, enterrado bajo datos analíticos.
> Este bloque lo saca al primer plano y lo enriquece con señales de agents + tasks.

- [x] **F19.A.1** Extender `getNextAction()` → `buildNextAction()` con signals de agents y tareas
  > Nuevo archivo `src/lib/build-next-action.ts` (no modifica el existente — backward compatible).
  > ```typescript
  > export function buildNextAction(
  >   engineData:    ProjectEngineData | null | undefined,
  >   agentInsights: AgentInsight[],           // de useAgentContext()
  >   taskStats:     { overdueCount: number },  // de useOverdueTasks()
  >   context:       ProjectContext,            // de useProjectContext() — F19.A.2
  > ): EnrichedNextAction
  >
  > export interface EnrichedNextAction {
  >   title:       string
  >   description: string
  >   type:        'obv' | 'task' | 'meeting' | 'metric' | 'none'
  >   urgency:     'low' | 'medium' | 'high'
  >   source:      'engine' | 'agents' | 'tasks'
  >   actionType?: 'create_obv' | 'add_metrics' | 'define_channel' | 'create_task' | 'open_meeting'
  >   ctaLabel?:   string
  >   signals:     string[]  // razones legibles: ["3 tareas vencidas", "Finance Agent: riesgo de caja"]
  > }
  > ```
  > **Lógica de prioridad (orden estricto):**
  > 1. `riskLevel === 'critical'` → siempre gana (regla existente, preserved)
  > 2. `overdueCount ≥ 3` → "Tienes N tareas bloqueando el avance" · type='task' · urgency='high'
  > 3. Agent insight con `severity === 'critical'` → acción del agente · source='agents'
  > 4. `overdueCount ≥ 1` → añadir a `signals[]` como nota, pero NO bloquear Next Action del motor
  > 5. Agent insight con `severity === 'warning'` → añadir a `signals[]`
  > 6. Reglas 1–13 del `getNextAction()` existente → el fallback base
  > **Solo/equipo:** si `context.mode === 'solo'` → tipo 'meeting' solo para reuniones externas,
  > nunca para coordinación interna. Preferir 'task' o 'obv' siempre que sea posible.
  > **Criterio:** proyecto con 4 tareas vencidas + risk=medium → buildNextAction devuelve
  > type='task', urgency='high', source='tasks', signals incluye "4 tareas vencidas".

- [x] **F19.A.2** `useProjectContext()` — Context Layer solo/equipo/complejidad
  > Nuevo hook `src/hooks/useProjectContext.ts`:
  > ```typescript
  > export interface ProjectContext {
  >   mode:                   'solo' | 'team'
  >   teamSize:               number
  >   operationalComplexity:  'low' | 'medium' | 'high'
  >   // low:    phase 1-2 + sin integraciones
  >   // medium: phase 2-3 o con 1 integración activa
  >   // high:   phase 3-4 o con 2+ integraciones activas
  > }
  > export function useProjectContext(projectId: string): { data: ProjectContext }
  > ```
  > Lee: `project_members count` + `current_phase` + `integration_connections count`.
  > Computado client-side, sin RPC nueva. Cacheado con React Query, staleTime=5min.
  > Usado por: `buildNextAction()` (F19.A.1) · `NextActionFocusBlock` (F19.A.3) ·
  > `usePhaseFeatures()` (F19.C.2) · Meeting Intelligence solo mode (M18.0.6).
  > **Criterio:** proyecto sin miembros + phase 1 → `{ mode: 'solo', teamSize: 0, complexity: 'low' }`.
  > Proyecto con 3 miembros + 2 integraciones + phase 3 → `{ mode: 'team', teamSize: 3, complexity: 'high' }`.

- [x] **F19.A.3** Componente `NextActionFocusBlock.tsx` — el centro visual del dashboard
  > Nuevo componente `src/components/project/NextActionFocusBlock.tsx`.
  > Aparece como el PRIMER elemento del dashboard, antes de las stats, full width (col-span-12).
  > **Layout:**
  > ```
  > ┌─────────────────────────────────────────────────────────────┐
  > │  [badge urgencia]  TU PRIORIDAD AHORA                       │
  > │                                                             │
  > │  [título grande — 1.5rem bold]                              │
  > │  [descripción — 1 línea, muted]                             │
  > │                                                             │
  > │  [CTA BUTTON grande]     [Ver señales ▼]                    │
  > └─────────────────────────────────────────────────────────────┘
  > ```
  > Badge de urgencia: rojo="Urgente" · ámbar="Esta semana" · azul="En progreso"
  > CTA redirige según `actionType`:
  > - `create_obv` → navega a tab OBVs (igual que hoy en ProjectEnginePanel)
  > - `add_metrics` / `define_channel` → navega a tab correspondiente
  > - `create_task` → abre `TaskForm` pre-rellenado con el contexto del next action
  > - `open_meeting` → abre `StartMeetingModal` pre-rellenado (mode=team only)
  > **"Ver señales ▼"** expande panel inline con:
  > - Lista de `signals[]` de buildNextAction (máx 3 bullets)
  > - Phase actual + score como contexto
  > - "Calculado por: Motor del proyecto + [N agentes activos]"
  > Si no hay Next Action (caso null): no renderizar nada — no mostrar empty state.
  > **Solo mode:** si type='meeting' → no mostrar (buildNextAction ya lo filtra, pero doble seguro).
  > **Criterio:** proyecto fase 1 sin hard signal → Focus Block visible con "Valida el problema"
  > y CTA "Crear OBV" antes de cualquier stat. tsc limpio.

- [x] **F19.A.4** `ProjectDashboardTab.tsx` — reposicionar Next Action al top, desduplicar del panel
  > Integrar `NextActionFocusBlock` y `buildNextAction` en el dashboard.
  > Cambios en `ProjectDashboardTab.tsx`:
  > 1. Añadir `NextActionFocusBlock` ANTES del grid de cols (antes de las stats):
  >    ```tsx
  >    <NextActionFocusBlock engineData={engineData} projectId={project.id} />
  >    <div className="grid grid-cols-12 gap-6"> ← stats y sidebar existentes
  >    ```
  > 2. En `ProjectEnginePanel` (col-span-3): eliminar la sección "Next Action" del panel
  >    (líneas 449-477 del panel) ya que ahora vive en el Focus Block.
  >    El panel queda como vista analítica pura: fase · probabilidad · riesgo · cobertura · agent signals.
  > 3. `useOverdueTasks(projectId)` — nuevo hook mínimo:
  >    ```typescript
  >    const { data: overdueCount = 0 } = useQuery({
  >      queryKey: ['overdue_tasks', projectId],
  >      queryFn: () => supabase.from('tasks')
  >        .select('id', { count: 'exact', head: true })
  >        .eq('project_id', projectId)
  >        .neq('status', 'done')
  >        .lt('fecha_limite', new Date().toISOString())
  >        .then(r => r.count ?? 0)
  >    })
  >    ```
  > **Criterio:** abrir dashboard → Focus Block visible antes de stats · panel lateral sin Next Action duplicado.
  > Abrir dashboard con tareas vencidas → Focus Block muestra urgencia alta. tsc limpio.

### BLOQUE B — Task Loop Cerrado
> Cierra los 3 gaps más importantes del sistema de tareas:
> el feedback que se tira, la IA sin contexto real, y las acciones sin conexión entre módulos.

- [x] **F19.B.1** `siguiente_accion` → sugerencia de nueva tarea al cerrar TaskCompletionDialog
  > En `TaskCompletionDialog.tsx`, al hacer submit exitoso:
  > Si `feedback.siguiente_accion` tiene texto (longitud > 5 chars):
  > En lugar de cerrar el dialog directamente, mostrar un paso extra inline:
  > ```
  > ✓ Tarea completada
  >
  > Siguiente paso detectado:
  > "[texto de siguiente_accion]"
  >
  > [Crear tarea →]    [Ignorar]
  > ```
  > Al clicar "Crear tarea": llama `taskService.create()` con:
  > - `titulo`: feedback.siguiente_accion (primeros 80 chars si es largo)
  > - `prioridad`: misma que la tarea completada
  > - `function_type`: mismo que la tarea completada
  > - `assignee_id`: mismo que la tarea completada
  > - `ai_generated`: false (la originó el usuario en su feedback)
  > - `metadata`: `{ origin: 'task_feedback', source_task_id: taskId }`
  > Toast: "Tarea creada · [nombre]"
  > Invalida queryKey `['project_tasks', projectId]`.
  > Al clicar "Ignorar" → cierra sin crear. Sin fricción.
  > **Criterio:** completar tarea con siguiente_accion="Llamar a 3 clientes esta semana" →
  > paso extra visible → clicar Crear → nueva tarea en Kanban column='todo'. tsc limpio.

- [x] **F19.B.2** `AITaskGenerator` con contexto real del motor (reemplazar ENUM legacy)
  > `ProjectTasksTab.tsx` línea 88 pasa `fase: project.fase` — ENUM legacy ('validacion', 'revenue').
  > Cambio: añadir datos del motor al contexto pasado a la edge function.
  > ```typescript
  > const aiProjectContext = project ? {
  >   ...campos existentes,
  >   // Nuevo: reemplazar ENUM con datos reales del motor
  >   current_phase:    engineData?.phaseState?.current_phase ?? 1,
  >   phase_score:      engineData?.phaseState?.phase_score   ?? 0,
  >   hard_signal_met:  engineData?.phaseState?.hard_signal_met ?? false,
  >   risk_level:       engineData?.risk?.risk_level ?? 'low',
  >   demand_coverage:  coverageLevel('demand'),
  >   delivery_coverage: coverageLevel('delivery'),
  > } : null
  > ```
  > En la edge function `generate-tasks/index.ts` (o equivalente): actualizar el system prompt
  > para usar estos campos. Ejemplo de instrucción añadida:
  > "This project is in phase {current_phase}/4 with a phase score of {phase_score}/100.
  >  Hard signal met: {hard_signal_met}. Risk: {risk_level}. Demand coverage: {demand_coverage}.
  >  Generate tasks specific to THIS phase and momentum. Phase 1 = discovery tasks.
  >  Phase 3 = operational consolidation. Do NOT generate generic tasks."
  > **Criterio:** proyecto Fase 1 con demanda débil → AITaskGenerator propone tareas de discovery
  > (entrevistas, validaciones). Mismo proyecto en Fase 3 → propone tareas de delivery y cobros.

- [x] **F19.B.3** Task `demand` completada con éxito → sugerencia de OBV
  > En `useTaskKanban.ts` función `handleTaskComplete()`, después de llamar
  > `taskService.completeWithFeedback()` con éxito:
  > Si `taskToComplete.function_type === 'demand'` AND `feedback.resultado === 'exito'`:
  > Disparar un evento que `TaskCompletionDialog` ya procesó.
  > **Implementación:** en `TaskCompletionDialog.tsx`, en el mismo paso extra de F19.B.1,
  > si se cumplen las condiciones (demand + exito), añadir segunda sugerencia:
  > ```
  > ✓ Tarea de demanda completada con éxito
  >
  > Siguiente paso: "[siguiente_accion]"   [Crear tarea →]
  >
  > ¿Fue una validación con un cliente?
  > [Registrar como OBV →]    [No por ahora]
  > ```
  > "Registrar como OBV": navega a tab OBVs con query param `?prefill=titulo_de_la_tarea`.
  > `ProjectOBVsTab.tsx` lee el query param y abre CreateOBVDialog pre-rellenado.
  > Migración: ninguna. Solo lógica de UI y navegación.
  > **Criterio:** tarea function_type='demand', resultado='exito' → después de B.1, aparece
  > "¿Registrar como OBV?" y al clicar navega a OBVs con el título pre-cargado.

- [x] **F19.B.4** Tareas vencidas → signal en Focus Block y badge en ProjectEnginePanel
  > `useOverdueTasks(projectId)` (creado en F19.A.4) ya existe.
  > **En Focus Block (F19.A.3):** si `overdueCount ≥ 1` y el Next Action NO es ya de tipo task:
  > Mostrar nota secundaria debajo del CTA:
  > `⚠ También tienes N tarea(s) vencida(s) · [Ver tareas]`
  > Link navega a tab Tareas. No compite visualmente con el Next Action principal.
  > **En ProjectEnginePanel**, debajo de los agent signals (línea ~497):
  > Si `overdueCount ≥ 2`: añadir pill rojo `⚠ N vencidas` con link a tab Tareas.
  > Si `overdueCount === 1`: no mostrar (1 tarea vencida es normal, 2+ es señal).
  > **Criterio:** 3 tareas vencidas → pill rojo en panel + nota en Focus Block.
  > 1 tarea vencida → nada visible (sin ruido innecesario).

- [x] **F19.B.5** Phase-relevant sorting y badge en Kanban columna `todo`
  > Función `getPhaseRelevanceScore(functionType, phase)` en `src/lib/phase-features.ts` (F19.C.1):
  > ```typescript
  > // Phase 1-2: demand es crítico
  > // Phase 3:   delivery y cash son críticos
  > // Phase 4:   todo igual
  > const PHASE_RELEVANCE: Record<number, Record<string, number>> = {
  >   1: { demand: 3, delivery: 1, cash: 1, support: 0 },
  >   2: { demand: 3, delivery: 2, cash: 1, support: 0 },
  >   3: { demand: 2, delivery: 3, cash: 3, support: 1 },
  >   4: { demand: 2, delivery: 2, cash: 2, support: 2 },
  > }
  > ```
  > En `KanbanColumn.tsx` columna 'todo': ordenar tasks por
  > `phaseRelevanceScore(task.function_type, currentPhase) × (4 - task.prioridad)` desc.
  > Tasks con relevance=3: añadir un punto de color primario a la izquierda del título en `TaskCard.tsx`.
  > No es texto, no es badge — solo un punto de 6px. Mínimo ruido visual, máxima señal.
  > `currentPhase` se pasa desde `ProjectTasksTab` → `KanbanBoard` → `KanbanBoardContainer` → `KanbanColumn`.
  > **Criterio:** proyecto Fase 1 con 5 tareas mixtas → las de function_type='demand' aparecen
  > primero en 'todo' con punto de color. tsc limpio.

### BLOQUE C — UX Adaptativa Real
> Sustituye los 4 teasers de texto por un sistema real de atención jerarquizada por fase.
> Depende de F19.A.2 (`useProjectContext`) para el Context Layer.

- [x] **F19.C.1** `src/lib/phase-features.ts` — fuente de verdad de adaptación por fase
  > Nuevo archivo. Define tres estructuras:
  > ```typescript
  > // 1. Status de cada tab por fase
  > export type TabStatus = 'primary' | 'secondary' | 'teaser'
  > export const PHASE_TAB_CONFIG: Record<number, Record<string, TabStatus>> = {
  >   1: { dashboard:'primary', obvs:'primary', tareas:'primary',
  >        equipo:'secondary', crm:'teaser', financiero:'teaser',
  >        'negocio-ia':'teaser', reuniones:'secondary' },
  >   2: { dashboard:'primary', obvs:'primary', tareas:'primary',
  >        equipo:'secondary', crm:'secondary', financiero:'secondary',
  >        'negocio-ia':'teaser', reuniones:'secondary' },
  >   3: { dashboard:'primary', obvs:'secondary', tareas:'primary',
  >        equipo:'primary', crm:'primary', financiero:'primary',
  >        'negocio-ia':'secondary', reuniones:'primary' },
  >   4: { dashboard:'primary', obvs:'secondary', tareas:'primary',
  >        equipo:'primary', crm:'primary', financiero:'primary',
  >        'negocio-ia':'primary', reuniones:'primary' },
  > }
  >
  > // 2. Por qué es teaser (para el modal explicativo — F19.C.4)
  > export const TAB_TEASER_REASONS: Record<string, Record<number, string>> = {
  >   crm:          { 1: 'El CRM cobra valor cuando tienes leads cualificados. Ahora el foco es validar el problema.' },
  >   financiero:   { 1: 'Las finanzas importan cuando hay ingresos. Ahora el objetivo es validar la demanda.',
  >                   2: 'En Fase 2 el foco es la solución. Financiero se activa cuando entras en Revenue.' },
  >   'negocio-ia': { 1: 'Las proyecciones generativas son precisas cuando hay modelo validado. Disponible en Fase 3.',
  >                   2: 'Disponible cuando el modelo de negocio esté validado.' },
  > }
  >
  > // 3. Stats relevantes por fase (para F19.C.5)
  > export const PHASE_STATS_CONFIG: Record<number, string[]> = {
  >   1: ['total_obvs', 'leads_count', 'team_count', 'days_active'],
  >   2: ['total_obvs', 'leads_count', 'conversion_rate', 'team_count'],
  >   3: ['facturacion', 'leads_ganados', 'close_rate', 'team_count'],
  >   4: ['facturacion', 'margen', 'leads_ganados', 'team_count', 'mrr_growth'],
  > }
  >
  > // 4. Phase relevance por task function_type (para F19.B.5)
  > export const PHASE_RELEVANCE: Record<number, Record<string, number>> = { ... }
  > ```
  > **Criterio:** importar en F19.C.2 y F19.B.5 sin errores. tsc limpio.

- [x] **F19.C.2** `usePhaseFeatures(projectId)` — hook de configuración por fase
  > Nuevo hook `src/hooks/usePhaseFeatures.ts`:
  > ```typescript
  > export function usePhaseFeatures(projectId: string) {
  >   const { data: engineData } = useProjectEngineData(projectId)
  >   const phase = engineData?.phaseState?.current_phase ?? 1
  >   return {
  >     phase,
  >     getTabStatus: (tabId: string): TabStatus =>
  >       PHASE_TAB_CONFIG[phase]?.[tabId] ?? 'secondary',
  >     getTeaserReason: (tabId: string): string =>
  >       TAB_TEASER_REASONS[tabId]?.[phase] ?? 'Disponible en una fase posterior.',
  >     getPhaseStats: (): string[] =>
  >       PHASE_STATS_CONFIG[phase] ?? PHASE_STATS_CONFIG[1],
  >     getRelevanceScore: (functionType: string): number =>
  >       PHASE_RELEVANCE[phase]?.[functionType ?? 'support'] ?? 1,
  >   }
  > }
  > ```
  > Sin nuevas queries — lee `engineData` que ya está cacheado en `useProjectEngineData`.
  > **Criterio:** proyecto Fase 1 → `getTabStatus('crm') === 'teaser'`.
  > Proyecto Fase 3 → `getTabStatus('crm') === 'primary'`. tsc limpio.

- [x] **F19.C.3** `ProjectPage.tsx` — tabs con visual status por fase
  > Integrar `usePhaseFeatures` en `ProjectPage.tsx`:
  > **primary tabs:** render idéntico al actual (sin cambio visual).
  > **secondary tabs:** `TabsTrigger` con `className="text-muted-foreground/70"` + tooltip
  > "Este módulo no es el foco en tu Fase X — pero está disponible".
  > **teaser tabs:** `TabsTrigger` con icono `Lock` (10px) antes del label + opacidad 50%.
  > Al hacer click en teaser tab → NO navegar al tab, mostrar `PhaseTeaserModal` (F19.C.4).
  > Implementar interceptando `onValueChange` del `<Tabs>`:
  > ```typescript
  > const handleTabChange = (value: string) => {
  >   if (phaseFeatures.getTabStatus(value) === 'teaser') {
  >     setTeaserTabClicked(value)   // opens modal
  >     return                        // no navegar
  >   }
  >   setActiveTab(value)
  > }
  > ```
  > Añadir badge "★ Foco" pequeño (8px de texto, bg-primary/10) en la 1-2 tabs primary más
  > importantes para la fase (definidas en PHASE_TAB_CONFIG como `primary_focus: true`).
  > **Criterio:** proyecto Fase 1 → tab CRM con Lock + opacidad. Click en CRM → modal,
  > no cambia de tab. Tab OBVs con badge "★ Foco". tsc limpio.

- [x] **F19.C.4** `PhaseTeaserModal.tsx` — explicación al clicar un tab bloqueado
  > Nuevo componente `src/components/project/PhaseTeaserModal.tsx`.
  > Se abre cuando el usuario clica una tab con status 'teaser'.
  > **Layout:**
  > ```
  > ┌────────────────────────────────────┐
  > │  🔒 [Nombre del módulo]            │
  > │                                    │
  > │  [Razón: por qué no ahora]         │
  > │                                    │
  > │  Se activa cuando:                 │
  > │  [unlock_condition — 1 línea]      │
  > │                                    │
  > │  [Entendido]   [Abrir de todas formas →] │
  > └────────────────────────────────────┘
  > ```
  > Tamaño small (max-w-sm). No bloquea la app.
  > "Abrir de todas formas" → navega al tab igualmente (power user escape hatch).
  > El texto de razón viene de `getTeaserReason(tabId)` de F19.C.2.
  > **Criterio:** Fase 1, click en CRM → modal visible con razón específica para CRM en Fase 1.
  > Click "Abrir de todas formas" → navega a CRM normalmente.

- [x] **F19.C.5** Dashboard stats adaptadas por fase (eliminar stats desalentadoras)
  > En `ProjectDashboardTab.tsx`, el grid de 5 StatCards muestra siempre:
  > OBVs · Leads · Miembros · Facturación (€0) · Margen (€0).
  > En Fase 1, mostrar €0 y €0 es desmotivador y no relevante.
  > **Cambio:** usar `getPhaseStats()` de F19.C.2 para determinar qué stats mostrar:
  > - Fase 1: OBVs · Leads · Miembros · Días activo · [vacío]
  > - Fase 2: OBVs · Leads · Tasa conversión leads→OBV · Miembros · [vacío]
  > - Fase 3: Facturación · Leads ganados · Miembros · Margen · [vacío]
  > - Fase 4: Facturación · Margen · Leads · Miembros · [MRR si disponible]
  > "Días activo" = `Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86_400_000)`.
  > "Tasa conversión" = `leads_ganados / max(leads_count, 1) × 100`.
  > Stats que ahora muestran €0 en fases tempranas → simplemente no aparecen.
  > **Criterio:** proyecto Fase 1 → no se muestra Facturación ni Margen.
  > Proyecto Fase 3 → Facturación y Margen visibles con valores reales.

### Mejoras v2 — Conexión con FASE 17 (evidence quality) + FASE 18 (Meeting loop)

- [ ] **F19.V2.1** Focus Block debe mostrar aviso de baja fiabilidad cuando el Next Action se basa en datos estimados — si el agent signal que eleva la urgencia tiene `reliability_score < 0.5` (T17.V2.2), el Focus Block añade una nota secundaria discreta: "⚠ Señal basada en estimación · Conecta [proveedor] para confirmarla". No bloquea la acción — el usuario sigue viendo el CTA principal — pero tiene el contexto de calidad del dato. Sin esto, el Focus Block puede recomendar urgencia alta por una estimación de riesgo sin respaldo real, erosionando la confianza en el sistema.
- [ ] **F19.V2.2** Task Loop (F19.B) debe escalar a Meeting Intelligence cuando la misma tarea lleva 2 ciclos consecutivos (≥30 días) sin completarse — en `buildNextAction()`, si `overdueCount ≥ 1` y la tarea más antigua vencida tiene `fecha_limite < NOW() - 30 days`, añadir a `signals[]`: "Esta tarea lleva más de 30 días sin resolverse — puede necesitar una decisión en reunión". Cambiar `type` a `'meeting'` solo si `context.mode === 'team'` (un solo founder no puede reunirse con sí mismo). Este puente convierte el Task Loop en detonador de Meeting Intelligence sin requerir código nuevo en FASE 18.
- [ ] **F19.V2.3** Test de consistencia `PHASE_TAB_CONFIG` ↔ `feature_matrix.md` — `feature_matrix.md` define `phase_unlock` por feature. `PHASE_TAB_CONFIG` define el status por tab por fase. Estas dos fuentes pueden divergir. Añadir test Vitest en `src/lib/__tests__/phase-consistency.test.ts` que valide: para cada tab en `PHASE_TAB_CONFIG`, la fase en que pasa de `teaser` a `secondary` o `primary` debe coincidir con el `phase_unlock` de la feature correspondiente en `feature_matrix.md`. Documentación ejecutable — no un test de runtime, sino de consistencia entre artefactos de diseño.

---

## INFRAESTRUCTURA COMPARTIDA — Prerrequisitos para FASE 20–22 ⏸ POST-F19 0/3
> Tres piezas de infraestructura compartida que deben existir antes de implementar FASE 20, 21 y 22. No son features — son fundaciones. Sin ellas, bloques críticos de las 3 fases fallan en producción.
> Pueden construirse en paralelo con FASE 17/18/19 desde el primer día — no requieren que esas fases estén completas.

- [x] **INFRA.1** Migración — tabla `country_data` (prerrequisito F21.4 + F22.4)
  > Necesaria para: Buyer Persona v2 (enriquecimiento geográfico) + Expansion Intelligence (scoring dimensional por país). Sin ella, ambas funciones hacen fallback a "datos no disponibles".
  > Columnas: `country_code CHAR(2) PRIMARY KEY`, `country_name TEXT`, `continent TEXT`, `gdp_per_capita_usd INTEGER`, `internet_penetration NUMERIC`, `startup_density_rank SMALLINT` (1-50, 1=mejor), `ecommerce_penetration NUMERIC`, `median_age NUMERIC`, `languages TEXT[]`, `business_culture JSONB` (ej. `{formality: 'high', punctuality: 'critical', negotiation_style: 'direct'}`), `regulatory_ease_score NUMERIC(3,1)` (1.0-5.0, fuente World Bank Ease of Doing Business), `cost_of_living_index NUMERIC` (base 100 = Madrid). RLS: public read.
  > Seed inicial: 30 países (España, Alemania, Francia, UK, Portugal, Italia, Países Bajos, Polonia, Suecia, Noruega, Dinamarca, EE.UU., México, Argentina, Colombia, Chile, Brasil, Singapur, EAU, Israel, India, Australia, Japón, Corea del Sur, Canadá, Suiza, Bélgica, Austria, Irlanda, Finlandia). Actualización anual.

- [x] **INFRA.2** `src/components/shared/SourceBadge.tsx` — componente de transparencia unificado (prerrequisito F20.9 + F21 + F22)
  > El componente existente `src/components/ui/data-source-badge.tsx` usa `source: 'proyecto'|'validaciones'|'crm'` — incompatible con el sistema de evidencia de FASE 17. NO modificar el existente (rompe componentes actuales).
  > Crear componente NUEVO en `/shared/`:
  > ```typescript
  > interface SourceBadgeProps {
  >   type: 'observed' | 'declared' | 'estimated' | 'inferred'
  >   source?: string        // "Stripe" | "HubSpot" | "manual" | etc.
  >   reliability?: number   // 0-1 → muestra como porcentaje en tooltip
  >   timestamp?: string     // ISO → renderiza "hace 3 días"
  >   label?: string         // override del texto del badge
  > }
  > ```
  > Colores Tailwind: `observed` = `bg-green-100 text-green-800` · `declared` = `bg-blue-100 text-blue-800` · `estimated` = `bg-orange-100 text-orange-800` · `inferred` = `bg-gray-100 text-gray-700`. Tooltip al hover con fuente + reliability + timestamp.
  > Crear ANTES de FASE 20 para que F20 + F21 + F22 usen la misma implementación. Si cada fase lo implementa por su cuenta, habrá 3 versiones divergentes.

- [ ] **INFRA.3** Seed data `expansion_events` + gobernanza (prerrequisito F22.8)
  > La tabla `expansion_events` se crea en F22.3, pero necesita datos iniciales para que F22.8 no esté vacía en el lanzamiento.
  > Seed mínimo: 40 eventos en Europa Occidental + 10 en LATAM. Categorías: conferencias de startups (SaaS, Fintech, eCommerce, HealthTech, EdTech) + demo days de aceleradoras + meetups de founders en capitales clave.
  > Gobernanza: revisión trimestral (enero · abril · julio · octubre). Script pg_cron de limpieza: `DELETE FROM expansion_events WHERE event_date < NOW() - INTERVAL '7 days'`. Sin este cron, la tabla acumula eventos pasados y F22.8 los muestra al usuario.

---

## FASE 20 — ANÁLISIS ESTRATÉGICO IA v4 ⏸ POST-F16 0/12
> Prerequisito: FASE 16 activa + proyecto con ≥14 días de actividad. Paralela a FASE 17 — puede ejecutarse sin ella pero se enriquece con los SOURCE_WEIGHTS de T17.2.
> El análisis IA más potente del mercado para founders: diagnóstico con datos reales de integraciones, consciente de la fase del proyecto, con trail de evidencias. 3 niveles que se desbloquean progresivamente — el founder nunca ve una feature vacía ni una promesa sin datos.
>
> **Niveles de desbloqueo:**
> - Nivel 1 (día 14+, 0 integraciones): Resumen ejecutivo + Phase Fit + 3 decisiones urgentes. Solo datos declarados en onboarding.
> - Nivel 2 (+1 integración, 30+ días): Nivel 1 + Pulso financiero + Pipeline & tracción. Datos reales de Stripe o HubSpot.
> - Nivel 3 (2+ integraciones, 60+ días, 5+ decision_events): Nivel 2 + Señales cruzadas + Hard Truths. Correlaciones entre fuentes.
>
> **Principio global de transparencia:** cada sección tiene un bloque plegable "¿De dónde viene esto?" con lista de fuentes (Stripe/HubSpot/declarado/estimado), fecha de última actualización por fuente, y `SourceBadge` por dato (observed/declared/estimated/inferred). No es nota al pie — es parte del diseño visual principal.

### BLOQUE A — Infraestructura

- [ ] **F20.1** Migración — tabla `ai_analysis_cache`
  > Columnas: `id UUID`, `project_id UUID REFERENCES projects`, `analysis_level SMALLINT CHECK (level IN (1,2,3))`, `generated_at TIMESTAMPTZ`, `expires_at TIMESTAMPTZ`, `prompt_hash TEXT` (SHA256 del input — detecta invalidación por nuevos datos), `data_sources JSONB` (fuentes usadas + fecha por fuente), `output JSONB`, `tokens_used INTEGER`, `model TEXT`. RLS: project members read · owner delete. Índice en `(project_id, analysis_level, generated_at DESC)`. TTL por nivel: Nivel 1 = 7 días · Nivel 2 = 3 días · Nivel 3 = 2 días.

- [ ] **F20.2** Edge function `analyze-project-v4` — análisis 3 niveles condicional
  > Input: `project_id`, `level` (1/2/3), `additional_context?: string` (del PreAnalysisModal).
  > Recopilación según nivel: Nivel 1 → onboarding_data + project_phase_state + project_risk_score + decision_events últimas 10 + benchmarks. Nivel 2 → Nivel 1 + integration_entities[subscription, deal] + integration_insights + key_metrics. Nivel 3 → Nivel 2 + project_economic_profile + project_probability_history (90d) + strategic_blocks.
  > `buildAnalysisPrompt(level, projectData, additionalContext)` — el prompt de Nivel 3 incluye instrucción explícita de encontrar contradicciones entre fuentes (ej. pipeline HubSpot sube pero MRR Stripe baja = señal cruzada real). Output JSON: secciones activas según nivel + `data_sources[]` por sección + `reliability_scores{}` por dato + `confidence_overall` (0-1).
  > Rate limit: 1 análisis/24h por nivel por proyecto. Excepción: si datos de integración son más recientes que la última generación → `isStale = true` → permite regenerar. Guardar en `ai_analysis_cache`. Usar `RateLimitPresets.AI_GENERATION` (G8.2).

- [ ] **F20.3** Hook `useProjectAnalysis(projectId)` — desbloqueo + caché + stale detection
  > Calcula `unlockedLevel: 1|2|3|null`: Nivel 1 = `days_active ≥ 14`. Nivel 2 = `integration_connections.status='active' COUNT ≥ 1 AND days_active ≥ 30`. Nivel 3 = `integration_connections COUNT ≥ 2 AND days_active ≥ 60 AND decision_events COUNT ≥ 5`.
  > Lee `ai_analysis_cache` para el nivel activo. Si caché expirado o `prompt_hash` diferente (nuevos datos) → `isStale: true` → botón "Regenerar" activo.
  > Expone: `{ unlockedLevel, nextLevelRequirements, cachedAnalysis, isStale, isGenerating, generateAnalysis(additionalContext) }`.

### BLOQUE B — UX y Componentes

- [ ] **F20.4** `PreAnalysisDataReview.tsx` — modal de revisión de datos antes de generar
  > Se muestra SIEMPRE antes de llamar a la edge function. El usuario ve exactamente qué datos usará la IA: tabla con columnas `Fuente | Dato | Valor actual | Última actualización | Fiabilidad`. Filas según nivel: Nivel 1 → fase actual, risk score, últimas 3 decisiones, datos de onboarding. Nivel 2 → añade MRR (Stripe), nº deals activos (HubSpot), churn rate. Nivel 3 → añade integration_insights, economic profile, probability trend 90d.
  > Campo opcional "Contexto adicional" (max 300 chars): el founder añade urgencias, preguntas específicas o cambios recientes que la IA no conoce. Va al prompt como `additional_context`.
  > Botones: "Actualizar datos" (→ settings integraciones) + "Generar análisis →" (→ llama F20.2).
  > **Regla de transparencia:** si el usuario no ve este modal, no ve el análisis. No hay bypass. Este modal es el punto de transparencia obligatorio del sistema.

- [ ] **F20.5** `AIAnalysisDashboard.tsx` — contenedor principal con nivel-gates
  > Renderiza el análisis según nivel desbloqueado. Secciones de nivel superior bloqueadas muestran `AnalysisLevelTeaser` (F20.10), no placeholder vacío.
  > Header: nombre del proyecto + badge "Nivel N" + fecha de generación + botón "Regenerar" si `isStale` + botón "¿De dónde viene esto?" (abre panel de fuentes global).
  > Secciones: Nivel 1 siempre visible si desbloqueado → Nivel 2 debajo (gated) → Nivel 3 al final (gated).

- [ ] **F20.6** Nivel 1 — `ExecutiveSummarySection` + `PhaseFitSection` + `UrgentDecisionsSection`
  > **ExecutiveSummarySection:** párrafo 3-5 líneas + 3 bullets fortalezas + 3 bullets riesgos inmediatos + score de momentum (1-10) con gauge visual. Source: onboarding + phase_state + risk_score.
  > **PhaseFitSection:** ¿El proyecto está haciendo lo correcto para su fase? Respuesta directa (Sí/No/Parcialmente) + 2-3 razones concretas + recomendación de foco + benchmark de la fase (de `benchmarks` table). Badge de fiabilidad en cada razón.
  > **UrgentDecisionsSection:** 3 decisiones prioritarias para esta semana, ordenadas por impacto. Cada decisión: título + contexto (1 línea) + consecuencia de no decidir + CTA navegable a la app ("Ir a OBVs", "Ver pipeline", etc.).

- [ ] **F20.7** Nivel 2 — `FinancialPulseSection` + `PipelineTractionSection`
  > **FinancialPulseSection:** MRR actual + tendencia 90d (sparkline de `key_metrics` history) + runway estimado + cash flow signal. Si datos > 3 días de antigüedad: badge "Datos pueden estar desactualizados · Sincronizar Stripe". Si no hay Stripe: sección oculta con teaser "Conecta Stripe para ver tu pulso financiero real".
  > **PipelineTractionSection:** deals en pipeline + close rate real vs benchmark de la fase + deals en riesgo (>30 días sin movimiento) + revenue potencial. Si no hay HubSpot: usa OBVs tipo venta con badge `declared`. Siempre indica fuente.

- [ ] **F20.8** Nivel 3 — `CrossSignalsSection` + `HardTruthsSection`
  > **CrossSignalsSection:** correlaciones entre fuentes que el founder no vería manualmente. Ej: "Pipeline HubSpot creció 40% pero MRR Stripe subió solo 12% → posible problema de conversión o pricing." Cada señal tiene badge `observed/declared/estimated` según SOURCE_WEIGHTS. Mínimo 2 fuentes reales para emitir señal cruzada.
  > **HardTruthsSection:** 2-3 verdades incómodas que los datos muestran claramente. Sin suavizar. Cada una: el dato que la respalda + la fuente + qué riesgo representa si se ignora. Umbral mínimo de fiabilidad: 0.6 — sin datos suficientes, no se genera Hard Truth (mostrar "No hay suficientes datos para Hard Truths en este momento").

### BLOQUE C — Transparencia y Acceso

- [ ] **F20.9** Usar `SourceBadge` de INFRA.2 — no crear instancia propia
  > **No implementar aquí.** INFRA.2 crea el componente compartido `src/components/shared/SourceBadge.tsx` antes de FASE 20. Esta tarea consiste únicamente en: (1) verificar que INFRA.2 está completa, (2) importar y usar el componente en `AIAnalysisDashboard` y en todas las secciones (F20.6, F20.7, F20.8).
  > Si INFRA.2 no está lista cuando se llega aquí, BLOQUEAR — no crear versión local del badge que luego diverge.
  > Variantes usadas en F20: `observed` (Stripe/HubSpot real) · `declared` (input del founder) · `estimated` (cálculo del sistema) · `inferred` (inferencia IA sin fuente directa). Ver INFRA.2 para especificación completa de colores y tooltip.

- [ ] **F20.10** `AnalysisLevelTeaser.tsx` — unlock requirements por nivel
  > Aparece dentro del dashboard donde estaría el nivel bloqueado. Lista de requirements con checkmark verde (cumplido) o gris (pendiente). CTA directo al action necesario ("Conectar Stripe", "Tomar más decisiones", "Esperar X días"). Los requirements vienen de la misma lógica de `useProjectAnalysis` — sin duplicar condiciones. No es un overlay bloqueante — el análisis del nivel actual es completamente visible.

- [ ] **F20.11** Ruta + navegación + PostHog
  > Nueva tab "Análisis IA" en `ProjectPage.tsx`. Status: si `unlockedLevel = null` → teaser del nivel 1 con días faltantes; si desbloqueado → badge "Nivel N disponible" o "Nivel N generado".
  > Route: `<Route path="/proyecto/:id/analisis" element={<AIAnalysisPage />} />` en `Index.tsx`. `AIAnalysisPage.tsx` con guards + `useProjectAnalysis` + render de `AIAnalysisDashboard`.
  > PostHog: `trackAnalysisUnlockLevel(projectId, level)`, `trackAnalysisGenerated(projectId, level, tokensUsed)`, `trackAnalysisSectionViewed(projectId, sectionName)`.

- [ ] **F20.12** Rate limit + cost guard
  > Hard limit: 1 análisis/nivel/24h por proyecto (F20.2 ya lo maneja). Mostrar al usuario "Próxima regeneración disponible en X horas" si intenta dentro de la ventana. Excepción: `isStale = true` (nuevos datos de integración) → permite regenerar aunque no hayan pasado 24h. Lógica en `useProjectAnalysis` — no duplicar en la UI.

### Mejoras v2

- [ ] **F20.V2.1** Análisis de posición en cohorte — cuando A12.V2.1 esté en producción (≥30 proyectos con outcomes), añadir sección "¿Cómo estás respecto a proyectos similares?" en Nivel 2+. Posición percentil en iteration velocity, probability score y time-to-phase-2 para proyectos del mismo cluster. Badge `observed` (datos reales del sistema). El moat de largo plazo: cuantos más proyectos, más valiosa esta sección. Prerequisito: A12.V2.1 en prod + N≥30 proyectos con outcomes.
- [ ] **F20.V2.2** Exportar análisis a PDF — botón "Descargar PDF" en `AIAnalysisDashboard`. Edge function `export-analysis-pdf` (HTML → PDF con puppeteer o similar). Incluye todas las secciones visibles + data sources + fecha de generación + nivel del análisis. Útil para investor meetings (M14.V2.2) y como artefacto de decisión.

---

## FASE 21 — FOUNDER TOOLKIT ⏸ POST-F16 0/8
> Prerequisito: FASE 16 activa. Paralela a FASE 20 — comparte `SourceBadge` (F20.9) y `founder_tool_cache` como patrón de caché.
> 6 herramientas generativas que se construyen sobre datos reales del negocio. Cada herramienta tiene un trigger específico basado en acciones del founder, no en tiempo. El toolkit no se muestra todo a la vez — se desbloquea tool a tool conforme el negocio crece. Nunca se muestra una herramienta vacía.
>
> **Triggers de desbloqueo (en orden natural):**
> 1. **Buyer Persona:** 1er lead en CRM o primera OBV tipo contacto-cliente
> 2. **Lead Scoring:** 5+ leads en CRM
> 3. **Sales Playbook:** 1er deal cerrado (OBV `pipeline_status='cerrado_ganado'` o HubSpot `closed_won`)
> 4. **Brand Kit:** Buyer Persona generada + 1er email pitch (integration_insights tipo `email_pitch`)
> 5. **Guía de Comunicación:** Brand Kit generado + 2+ pitches enviados
> 6. **Customer Journey:** 10+ clientes activos (Stripe subscriptions) O datos de churn de Stripe
>
> **Principio de transparencia:** cada herramienta generada muestra en qué datos se basó. Buyer Persona: onboarding sector + leads CRM + country_data. Lead Scoring: deals HubSpot + OBV history. Etc. Sin caja negra.

### BLOQUE A — Motor de Desbloqueo

- [ ] **F21.1** `src/lib/toolkit-unlock-engine.ts` — lógica pura de triggers
  > Función pura `computeToolkitUnlocks(projectData): ToolkitUnlockState`. Input: `leads_count`, `deals_count`, `closed_deals_count`, `pitches_count`, `active_customers_count`, `has_stripe`, `has_buyer_persona`, `has_brand_kit`.
  > Output por tool: `status: 'locked'|'available'|'generated'`. Si `available`: `unlock_reason: string` (descripción del trigger cumplido). Si `locked`: `missing_for_unlock: string[]` (qué falta).
  > Sin side effects, sin queries. Testeable en aislamiento. Añadir tests en `src/lib/__tests__/toolkit-unlock.test.ts`.

- [ ] **F21.2** Hook `useToolkitUnlocks(projectId)` + migración `founder_tool_cache`
  > Hook llama a `computeToolkitUnlocks` con datos reales: `useProjectEngineData` (fase, risk) + query a `integration_entities` (leads/deals COUNT) + query a `integration_insights` (pitches COUNT) + `integration_connections` (has_stripe). Refresca al cambiar entities o insights (staleTime 5min).
  > **Migración tabla `founder_tool_cache`:** `id UUID`, `project_id UUID`, `tool_type TEXT CHECK (IN buyer_persona|lead_scoring|sales_playbook|brand_kit|comms_guide|customer_journey)`, `generated_at TIMESTAMPTZ`, `expires_at TIMESTAMPTZ`, `data_sources JSONB`, `output JSONB`, `prompt_hash TEXT`. UNIQUE `(project_id, tool_type)`. RLS: project members read · owner delete/upsert. TTL: buyer_persona=30d · lead_scoring=7d · sales_playbook=14d · brand_kit=30d · comms_guide=30d · customer_journey=14d.

### BLOQUE B — UI del Toolkit

- [ ] **F21.3** `FounderToolkitPage.tsx` + `ToolkitCardGrid` — página principal
  > Route: `/proyecto/:id/toolkit`. Tab "Toolkit" en `ProjectPage` — visible en Fase 1+ (no es teaser — siempre hay al menos el trigger de Buyer Persona visible). Grid de 6 `ToolCard` componentes.
  > **ToolCard** (locked): fondo gris + candado + "Necesitas: [unlock_reason]". **ToolCard** (available): highlight + "Generar [nombre] →" CTA. **ToolCard** (generated): color completo + fecha de generación + "Ver" + "Regenerar" (si `isStale`).
  > Orden: primero tools `available`, luego `generated`, al fondo `locked`. Sin abrumar: el scroll natural muestra el siguiente paso. Las tools locked no compiten visualmente con las disponibles.

### BLOQUE C — Las 6 Herramientas

- [ ] **F21.4** Edge function `generate-buyer-persona-v2` + `BuyerPersonaView.tsx`
  > Input: `project_id`. Data: `onboarding_data` (sector, mercado, tipo negocio, canal adquisición) + leads de CRM (títulos, etapas, notas) + `projects.country` → enriquecimiento con `country_data` si existe (tabla demográfica) o country_context curado por región.
  > Output: nombre de persona + edad media + cargo/rol + 3 pain points + 3 motivaciones de compra + canal de contacto preferido + objeciones típicas + quote representativo.
  > `BuyerPersonaView.tsx`: card visual con initials-avatar, datos estructurados, bloque "Basado en" plegable con N leads usados + `SourceBadge` por campo. Botón "Regenerar" si hay nuevos leads (`isStale`).

- [ ] **F21.5** Edge function `generate-lead-scoring-v2` + `LeadScoringView.tsx`
  > Input: `project_id`. Data: deals HubSpot (stage, amount, días en pipeline) + OBVs tipo venta (pipeline_status, valor_estimado) + buyer_persona si existe.
  > Output: 3-5 criterios de scoring (fit + timing + budget + engagement + persona match) con peso sugerido + score actual de leads existentes (0-100) + top 3 leads "hot".
  > `LeadScoringView.tsx`: tabla de leads con scores + matriz de criterios con pesos ajustables por el founder (guardados en `onboarding_data.lead_scoring_weights`). Badge hot/warm/cold por lead.

- [ ] **F21.6** Edge function `generate-sales-playbook-v2` + `SalesPlaybookView.tsx`
  > Input: `project_id`. Data: deals cerrados (nombre, importe, días en pipeline) + OBVs cerrados_ganados + buyer_persona si existe + objeciones registradas en leads.
  > Output: 5-7 pasos del proceso de venta (con duración estimada) + 3-5 objeciones comunes + respuestas a cada objeción + "momento de cierre" ideal + señales de compra de los deals ganados.
  > `SalesPlaybookView.tsx`: vista de libro con pasos acordeón + sección de objeciones expandible + tips de cierre. Exportable a texto plano (copiar para WhatsApp/Slack al equipo).

- [ ] **F21.7** Edge functions `generate-brand-kit-v2` + `generate-comms-guide-v2` + vistas
  > **Brand Kit:** Input: buyer_persona + onboarding_data (sector, propuesta de valor) + primeros pitches (tono detectado). Output: propuesta de valor en 1 frase + 3 mensajes clave + tono de comunicación (formal/cercano/técnico) + palabras que usar/evitar + headline para web + tagline.
  > **Guía de Comunicación:** Input: brand_kit + 2+ pitches + feedback de leads (si existe). Output: adaptación del tono por canal (email/LinkedIn/WhatsApp) + plantilla de primer contacto por canal + señales de que el mensaje está funcionando.
  > `BrandKitView.tsx`: card con componentes del kit + `SourceBadge` por elemento. `CommsGuideView.tsx`: acordeones por canal con plantillas copiables con 1 click.

- [ ] **F21.8** Edge function `generate-customer-journey-v2` + `CustomerJourneyView.tsx`
  > Input: `project_id`. Data: Stripe subscriptions (created_at, churn events, plan) + leads ganados + buyer_persona + onboarding_data.
  > Output: 5-6 etapas del journey (Descubrimiento → Consideración → Decisión → Onboarding → Retención → Expansión/Churning) con: punto de contacto principal por etapa, emoción del cliente, fricción más común, acción del equipo recomendada.
  > `CustomerJourneyView.tsx`: diagrama horizontal con etapas + cards expandibles. Badge `observed/estimated` por etapa según origen de datos (Stripe = observed, onboarding = declared). Si no hay Stripe: genera con datos declarados + banner "Con Stripe, estas etapas serían más precisas".

### Mejoras v2

- [ ] **F21.V2.1** "Nuevos datos disponibles" — prompt de regeneración. Cuando una tool generada tiene `expires_at` próximo Y hay nuevos datos relevantes (ej. lead_scoring: nuevos deals desde la última generación), mostrar chip en la ToolCard: "Actualizar con N nuevos datos →". Sin notificación push — solo visual inline. El founder decide cuándo regenerar. Output anterior accesible hasta confirmar la regeneración.
- [ ] **F21.V2.2** Toolkit cross-linking — las herramientas se citan entre sí. Si Lead Scoring detecta que la Buyer Persona está desactualizada → nota inline "Esta herramienta sería más precisa con la Buyer Persona actualizada → Regenerar". Si Sales Playbook existe → Lead Scoring añade nota "Para usar estos scores en el campo, ver el Sales Playbook". Evita que el founder trate las herramientas como silos.

---

## FASE 22 — EXPANSION INTELLIGENCE ⏸ POST-F21 0/9
> Prerequisito: proyecto en Fase 3+ · MRR estable o creciente ≥2 meses · `risk_score.level != 'critical'` · al menos 1 integración activa con datos reales.
> La feature más diferencial de Optimus para founders con tracción: recomendaciones de expansión geográfica con datos reales del negocio, plan de exploración ejecutable (5 días, sin dejar el negocio) y contexto de mercado local. El founder puede escalar mientras viaja — o decidir no escalar con datos en la mano.
>
> **Por qué Fase 3+:** antes de Fase 3, hablar de expansión es una distracción peligrosa. En Fase 3 el modelo está validado y el riesgo de explorar mercados nuevos es manejable. Expansion Intelligence solo aparece cuando el negocio puede aguantar la distracción.
>
> **Principio de transparencia:** cada mercado recomendado muestra exactamente por qué fue seleccionado y qué dato del negocio lo activó. Sin cajas negras. El founder puede entender y refutar la recomendación si quiere.

### BLOQUE A — Readiness y Motor de Recomendación

- [ ] **F22.1** `src/lib/expansion-readiness-engine.ts` — lógica pura de condiciones
  > Función `computeExpansionReadiness(projectData): ExpansionReadinessState`. Checks: (1) `current_phase >= 3`, (2) MRR trend positivo o estable en últimos 60 días, (3) `risk_score.level != 'critical'`, (4) `integration_connections.status='active' COUNT >= 1`.
  > **Definición de "MRR trend estable":** usar los últimos 60 días de `key_metrics.mrr` (una fila por semana = 8-9 puntos). Calcular pendiente normalizada: `slope = (mrr[last] - mrr[first]) / mrr[first]`. Condición: `slope >= -0.05` (permite caída ≤5% — ruido normal) AND `NO hay ningún mes con caída >20% respecto al anterior` (detector de crisis). Si hay <4 puntos de historial: condición = `isStale`, no `false` (no bloquear por falta de datos insuficientes).
  > Output: `{ isReady: boolean, missingConditions: string[], readinessScore: 0-100, readinessLabel: string }`. Sin side effects. Testeable en aislamiento.

- [ ] **F22.2** Hook `useExpansionReadiness(projectId)` + `ExpansionReadinessTeaser.tsx`
  > Hook llama a `computeExpansionReadiness` con datos reales. Si `isReady = false`: componente `ExpansionReadinessTeaser.tsx` — muestra estado de cada condición con checkmark/pendiente + motivación anticipatoria "Cuando alcances Fase 3 con MRR estable, Optimus te mostrará los 3 mejores mercados para tu negocio". No es bloqueante — es un horizonte visible. Si `isReady = true`: muestra `ExpansionIntelligencePage` con caché o botón "Analizar mis mercados ideales →".

- [ ] **F22.3** Migración — tabla `expansion_analysis_cache` + tabla `expansion_events`
  > **`expansion_analysis_cache`:** `id UUID`, `project_id UUID`, `generated_at TIMESTAMPTZ`, `expires_at TIMESTAMPTZ` (TTL: 14 días), `input_snapshot JSONB` (datos del negocio usados), `output JSONB`, `markets JSONB[]`. RLS: project members read · owner delete. Índice en `(project_id, generated_at DESC)`.
  > **`expansion_events`:** `id UUID`, `country TEXT`, `city TEXT`, `sector TEXT[]`, `event_name TEXT`, `event_date DATE`, `url TEXT`, `cost_eur_approx INTEGER`, `why_relevant_template TEXT`. Tabla curada manualmente. Índice en `(country, event_date)`. Actualización trimestral.

- [ ] **F22.4** Edge function `analyze-expansion-v1` — 3 mercados ideales con plan
  > Input: `project_id`. Recopilación: business_model, sector, country actual, MRR, buyer_persona (si existe), team_size, acquisition_channels activos.
  > Selección de mercados: para cada mercado candidato top-20 por sector/modelo, score = `(market_size_fit × 0.3) + (regulatory_ease × 0.2) + (cultural_proximity × 0.2) + (startup_ecosystem_quality × 0.15) + (cost_of_living_founder × 0.15)`. Seleccionar top 3.
  > **Cálculo de cada dimensión** (normalizadas 0-1, todas usando `country_data` de INFRA.1):
  > - `market_size_fit`: `gdp_per_capita_usd / 80000` capped a 1.0 × `(50 - startup_density_rank) / 49`. Proxy de willingness-to-pay + densidad de mercado.
  > - `regulatory_ease`: `(regulatory_ease_score - 1) / 4` (convierte escala 1-5 a 0-1).
  > - `cultural_proximity`: LOOKUP tabla `country_proximity_scores(source, target)` hardcodeada con 50 pares frecuentes (basada en Hofstede distance + proximidad lingüística). Default: 0.5 para pares sin definir.
  > - `startup_ecosystem_quality`: `(50 - startup_density_rank) / 49` (rank 1 = mejor ecosistema).
  > - `cost_of_living_founder`: `100 / cost_of_living_index` capped a 1.0 (bajo coste = más meses de runway para exploración).
  > Por cada mercado: nombre, razón data-driven (qué dato del negocio lo activó), 6 dimensiones con score 1-5, plan de 5 días (día a día con actividades + coste estimado + "qué validar ese día" como hipótesis concreta), consejos culturales de negocio (2-3 puntos breves), coste total del viaje (rango min-max en €).
  > Guardar en `expansion_analysis_cache`. Rate limit: 1 análisis/14 días por proyecto (TTL de caché).

### BLOQUE B — UX

- [ ] **F22.5** `ExpansionIntelligencePage.tsx` — página principal
  > Route: `/proyecto/:id/expansion`. Tab "Expansión" en `ProjectPage` — si `!isReady`: muestra `ExpansionReadinessTeaser` (F22.2); si `isReady`: página completa. No es tab teaser genérico — tiene contenido real de readiness desde el primer día.
  > Si hay análisis: `ReadinessCheckSection` compacta (score + fecha) + 3 `ExpansionMarketCard` + `ExplorationPlanSection` accesible desde cada card + `UpcomingEventsSection`.

- [ ] **F22.6** `ReadinessCheckSection.tsx` + `ExpansionMarketCard.tsx`
  > **ReadinessCheckSection:** 4 checks con iconos (fase/MRR/riesgo/integración), readiness score global, fecha del último análisis. Versión compacta cuando hay análisis, versión completa cuando no.
  > **ExpansionMarketCard.tsx:** card por mercado con nombre del país/ciudad + score global + 6 dimensiones como barras horizontales (Tamaño de mercado · Facilidad regulatoria · Proximidad cultural · Ecosistema startup · Coste de exploración · Potencial de sinergias) + "Por qué para tu negocio" (1-2 líneas con la razón data-driven) + botón "Ver plan de 5 días →". `SourceBadge` (F20.9 — reutilizar) en las dimensiones que vienen de datos reales del negocio.

- [ ] **F22.7** `ExplorationPlanSection.tsx` — plan de 5 días por mercado
  > Se muestra en panel lateral o modal al clicar "Ver plan de 5 días →".
  > **Estructura fija por día** (no variable — el founder sabe qué esperar):
  > - Día 1: Llegada + reunión con acelerador/hub local + primer networking. Hipótesis: "¿Hay densidad real de startups activas o es un ecosistema aspiracional?"
  > - Día 2: 3-5 conversaciones con potenciales clientes o partners. Hipótesis: "¿El problema que resuelvo existe aquí con la misma intensidad?"
  > - Día 3: Asistencia a evento/conferencia/demo day (si hay en `expansion_events`). Hipótesis: "¿Hay interés real o es educativo?"
  > - Día 4: Seguimiento de las conversaciones más prometedoras + 1-2 reuniones adicionales. Hipótesis: "¿Cuál es el siguiente paso más probable con los contactos de los días anteriores?"
  > - Día 5: Go/No-Go decision + plan de retorno. Hipótesis: "¿Merece tomar presencia local o repetir el viaje en 6 meses?"
  > Por día: actividades sugeridas (generadas por AI según sector + mercado) + coste estimado (alojamiento + transporte). Coste total del viaje (rango min-max €). Consejos culturales: 2-3 bullets concretos basados en `country_data.business_culture`.

- [ ] **F22.8** `UpcomingEventsSection.tsx` — próximos eventos por mercado
  > Lista de hasta 3 eventos por mercado (desde `expansion_events`): nombre + fecha + ciudad + por qué relevante para este negocio + coste de entrada.
  > Query: `SELECT * FROM expansion_events WHERE country = $market AND event_date > NOW() AND $sector = ANY(sector) ORDER BY event_date LIMIT 3`.
  > **Si 0 eventos:** mostrar "No hay conferencias próximas en [país] para tu sector. Te recomendamos contactar directamente con:" + 2-3 aceleradoras/hubs del país (desde `expansion_events.reference_hubs JSONB` del registro del país si existe, sino generar con AI). No dejar la sección vacía — un founder que no hay evento puede contactar directamente.

- [ ] **F22.9** Panel de transparencia — "¿Por qué estos 3 mercados?"
  > Panel plegable al inicio de la página, siempre visible. Dos partes:
  > **Parte A:** Datos del negocio que influyeron en la recomendación — qué inputs se usaron + su valor + fuente. Ej: "Tu modelo B2B SaaS → priorizamos países con regulatory_ease>3.5. Tu MRR €8k/mes → filtramos países con gdp_per_capita<$25k".
  > **Parte B:** Top 5 del análisis — los 3 seleccionados + los 2 siguientes con su score y la razón principal por la que no entraron (ej: "Posición 4: Brasil — score 0.68, excluido por: regulatory_ease=2.1/5"). Si país 4 tiene score ≥ país 3 − 0.05: nota "Estuvieron muy cerca".
  > Sin este panel, el founder no puede refutar la recomendación. La transparencia es la condición de la confianza.

### Mejoras v2

- [ ] **F22.V2.1** Integrar con Modo Emergencia (O5.V2.3) — si el análisis de emergencia detecta "tracción estancada" en mercado local Y el proyecto cumple condiciones de readiness, mostrar Expansion Intelligence como posible solución: "¿Has considerado validar el mismo modelo en un mercado diferente? Tu negocio cumple las condiciones →". Convierte una crisis local en una oportunidad de expansión sin forzar el timing.
- [ ] **F22.V2.2** Actualización automática — si `expansion_analysis_cache` expira Y el proyecto sigue en Fase 3+ con MRR estable, mostrar chip en tab "Expansión": "Tu análisis de expansión está desactualizado (14 días). ¿Regenerar?". Sin auto-regenerar — el founder decide cuándo.

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

| Fase | Nombre                              | Hecho | Total | Estado                   | Depende de            |
|------|-------------------------------------|-------|-------|--------------------------|-----------------------|
| 1    | Matemática y fundamentos            | 12    | 12    | ✅ 100%                  | Nada                  |
| 2    | Base de datos                       | 19    | 19    | ✅ 100%                  | Fase 1                |
| 3    | Fixes de código                     | 5     | 6     | ✅ 83% (1 dif.)          | Nada                  |
| 4    | Engines backend                     | 24    | 24    | ✅ 100%                  | Fases 1+2             |
| 5    | Onboarding                          | 9     | 11    | ✅ v1 (2 dif.)           | Fase 4                |
| 6    | UX Core                             | 15    | 15    | ✅ 100%                  | Fases 4+5             |
| 7    | Notificaciones                      | 7     | 7     | ✅ 100%                  | Fase 4                |
| 8    | Optimus y psicología                | 7     | 13    | ✅ v1 (6 dif.)           | Fases 4+6             |
| 9    | Contenido y playbooks               | 8     | 8     | ✅ 100%                  | Nada                  |
| 10   | Strategic Reset Ritual              | 5     | 5     | ✅ 100%                  | Fases 4+8             |
| 11   | Features por fase y modo            | 10    | 10    | ✅ 100%                  | Fases 4+5             |
| 12   | Sistemas avanzados                  | 0     | 8     | ❌ 0% (post-MVP)         | Post-MVP              |
| 13   | Edge cases                          | 8     | 10    | ✅ v1 (2 dif.)           | Antes lanzar          |
| 14   | Monetización                        | 0     | 5     | ❌ 0%                    | Prod. validado        |
| 15   | Integraciones y agentes             | 25    | 157   | ✅ v1 cerrada            | F14 + usuarios        |
| 16   | Adquisición y validación            | 0     | 6     | 🔄 ACTIVA                | —                     |
| 17   | Evidencia, fiabilidad y transparencia   | 0     | 32    | ⏸ post-F16 Bloque A     | F16 + 1 integración   |
| 18   | Meeting Intelligence: cierre de loop    | 0     | 34    | ⏸ post-F16             | F16 + Bloque 0        |
| 19   | Foco, Loop y Adaptación             | 0     | 14    | ⏸ post-F16              | F16 · paralela F17/F18|
| —    | Infraestructura Compartida (F20-22) | 0     | 3     | ⏸ post-F19              | Paralela a F17/F18/F19|
| 20   | Análisis Estratégico IA v4          | 0     | 12    | ⏸ post-F16              | INFRA + F16 + ≥14 días|
| 21   | Founder Toolkit                     | 0     | 8     | ⏸ post-F16              | INFRA + F16 + triggers|
| 22   | Expansion Intelligence              | 0     | 9     | ⏸ post-F21              | INFRA + F3+ + MRR ok  |
| **TOTAL** |                               | **152**| **426**| **36%**              |                       |

> Nota: 10 tareas extra (XE): 9 completadas, 1 pendiente (XE.9). Total con XE: 161/386.

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
