# PLAN MAESTRO DE MEJORAS — Análisis Exhaustivo 2026-03-20
> Origen: análisis multi-agente (5 agentes + lectura directa de código).
> Este plan captura TODOS los hallazgos del análisis y los convierte en tareas ejecutables.
> Prioridad: P0 = bugs en producción · P1 = diferencial bloqueado · P2 = mejora estructural · P3 = feature nueva

---

## BLOQUE 0 — BUGS CRÍTICOS EN PRODUCCIÓN (hacer antes de cualquier otra cosa)

Estos 3 problemas están activos en producción ahora mismo. No son mejoras — son correcciones urgentes.

### B0.1 — DEBT.5: Motor writes no funcionan (Stripe → Phase Engine roto)
**P0 — CRÍTICO**
- **Síntoma:** `write_integration_to_engine_table()` se invoca desde `financeAgentService` DESPUÉS de que el sync termina, pero la RPC requiere `sync_run.status='running'`.
- **Impacto:** `key_metrics.mrr` nunca se actualiza desde Stripe. El Phase Engine nunca ve MRR real. Los datos de Stripe flotan en `integration_entities` sin propagarse al motor.
- **Fix:** Mover el call a `write_integration_to_engine_table()` dentro de `sync-stripe/index.ts` mientras `status='running'` (Paso 8 del flujo ya tiene el lugar exacto). Lo mismo para `sync-hubspot` y `sync-asana`.
- **Archivos:** `supabase/functions/sync-stripe/index.ts` · `supabase/functions/sync-hubspot/index.ts` · `supabase/functions/sync-asana/index.ts`
- **Timebox:** 3–4h

### B0.2 — `auto-sync-finances` devuelve datos mock en producción
**P0 — CRÍTICO**
- **Síntoma:** Todos los providers (Holded, QuickBooks, Xero, PayPal, incluso Stripe) en `auto-sync-finances` llaman `generateMockTransactions()`. Los comentarios dicen "En producción: usar SDK real" pero el SDK está comentado.
- **Impacto:** Si un usuario conecta cualquier provider y usa esta función, ve datos inventados. Datos falsos pueden alimentar decisiones reales del founder.
- **Fix A (recomendado):** Eliminar `auto-sync-finances` completamente. El sistema I15 (`sync-stripe`, `sync-hubspot`, etc.) reemplaza esta función correctamente.
- **Fix B (alternativo):** Añadir guard al inicio: `return { ok: false, reason: 'deprecated_use_sync_provider_directly' }` con mensaje claro.
- **Archivos:** `supabase/functions/auto-sync-finances/index.ts`
- **Timebox:** 30min

### B0.3 — Slack schema mismatch (queries fallan silenciosamente)
**P0 — ALTO**
- **Síntoma:** `SlackIntegration.tsx` busca columnas `enabled`, `notification_types`, `created_by` en tabla `slack_webhooks`. La DB tiene `is_active`, sin `notification_types`, sin `created_by`.
- **Impacto:** Todas las queries de Slack fallan. La integración Slack en UI es no funcional aunque tenga botones activos.
- **Fix:** Migración que renombra `is_active → enabled` + añade `notification_types TEXT[]` + `created_by UUID` + `last_used_at TIMESTAMPTZ`. Actualizar queries en `SlackIntegration.tsx`.
- **Archivos:** Nueva migración SQL + `src/components/integrations/SlackIntegration.tsx`
- **Timebox:** 2h

---

## BLOQUE 0B — DEUDAS TÉCNICAS DE INTEGRACIONES (I15.DEBT pendientes)

### B0B.1 — I15.DEBT.2: MRR diverge si upsert falla parcialmente
**P1 — ALTO**
- **Problema:** Si `write_integration_to_engine_table()` falla en el upsert de `key_metrics`, el sync_run se marca `completed` pero el MRR en BD no se actualizó. No hay error visible. La UI muestra MRR correcto del run anterior pero el founder cree que está actualizado.
- **Fix:** En `sync-stripe/index.ts`, verificar `write_status` antes de marcar el sync_run como `completed`. Si `write_status !== 'written'`, marcar sync_run como `status='partial'` (nuevo estado) con `error_message='motor_write_failed'`. La UI de `SyncHealthCard` ya muestra el estado `is_partial` — solo necesita reconocer el nuevo estado.
- **Archivos:** `supabase/functions/sync-stripe/index.ts` · Nueva migración (enum `sync_run_status` añadir `'partial'`)
- **Timebox:** 1–2h

### B0B.2 — I15.DEBT.3: GCal eventos cancelados quedan activos en `integration_entities`
**P1 — MEDIO**
- **Problema:** `sync-google-calendar` solo inserta eventos nuevos. Si un evento es cancelado o borrado en Google Calendar, permanece en `integration_entities` como activo. El Calendar Agent puede emitir insights sobre reuniones que ya no existen.
- **Fix:** En `sync-google-calendar`, incluir eventos con `status='cancelled'` en la descarga y hacer upsert con `status='cancelled'` en `integration_entities`. El Calendar Agent filtra `status != 'cancelled'` antes de emitir insights.
- **Archivos:** `supabase/functions/sync-google-calendar/index.ts` · `src/services/calendarAgentService.ts`
- **Timebox:** 2h

### B0B.3 — I15.DEBT.4: `invalidateQueries` silencioso tras sync
**P2 — MEDIO**
- **Problema:** Tras un sync exitoso, si `invalidateQueries` falla (React Query en estado inconsistente), la UI sigue mostrando datos stale sin ningún aviso. El founder ve el spinner completar y asume que los datos se actualizaron.
- **Fix:** En los mutation hooks que llaman a sync (`useStripeSync`, `useHubSpotSync`, etc.), añadir `onSettled` que siempre llama `refetch()` como fallback si `invalidateQueries` no dispara actualización visible en 2s.
- **Archivos:** Hooks de sync en `src/hooks/` o `src/components/integrations/`
- **Timebox:** 1–2h

---

## BLOQUE 1 — ENGINES: CORRECCIONES MATEMÁTICAS

### E1.1 — Phase-Probability dependency lag (primer ciclo frío artificial)
**P1 — ALTO**
- **Problema:** El Probability Engine en Fase 2 lee `iteration_velocity_score` y `current_phase` de la corrida anterior. En el primer run, `momentum = 0` artificialmente. El founder completa una semana productiva y el engine devuelve probability deprimida.
- **Fix:** Añadir lógica de "primer ciclo": si `project_probability_history` tiene 0 o 1 rows, usar `iteration_velocity_score = base_velocity_from_task_count` en lugar de 0. Alternativa: no incluir `momentum` en el cálculo hasta el 2º run y compensar con los otros 4 inputs al 100%.
- **Archivos:** Migration en `compute_probability_score()` SQL function
- **Timebox:** 2–3h

### E1.2 — O3.3 cap artificial a 60 penaliza solo founders injustamente
**P1 — MEDIO**
- **Problema:** `operations_maturity_score` capea en 60 como proxy de "sin delegación no hay madurez operacional". Un solo founder muy organizado nunca puede superar el 60% aunque su ejecución sea sólida.
- **Fix:** Separar el cap por `solo_mode`. Si `onboarding_data.solo_mode = true`, el cap sube a 85 (asume que la madurez de operaciones de un solo founder se mide diferente). Si `solo_mode = false`, mantener el cap en 75 (no 60, también demasiado bajo).
- **Archivos:** Engine SQL + leer `onboarding_data.solo_mode` desde `projects`
- **Timebox:** 2h

### E1.3 — Viability T3 usa benchmark confidence=50 sin moderación visible
**P1 — MEDIO**
- **Problema:** El umbral T3 del Viability Engine usa benchmarks con `confidence_score=50` (unknown) sin moderar el resultado. Un proyecto con benchmarks desconocidos puede recibir señal de viabilidad crítica basada en comparaciones sin base real.
- **Fix:** Si `benchmark.confidence_score < 60`, reducir el peso del benchmark en T3 al 50% y marcar el resultado como `low_benchmark_confidence=true` en `project_viability_state`. La UI de viabilidad debe mostrar aviso cuando `low_benchmark_confidence=true`.
- **Archivos:** `run_viability_engine()` SQL function + `ViabilityBanner.tsx`
- **Timebox:** 2–3h

---

## BLOQUE 2 — ENGINES: FEATURES NUEVAS DIFERENCIALES

### E2.1 — Runway to Phase N (predicción de avance de fase)
**P1 — MUY ALTO · KILLER FEATURE**
- **Qué:** "A este ritmo, estás a N semanas de entrar en Fase 3. Los 2 blockers son: validación de cliente + OBV comercial."
- **Por qué diferencial:** El número 40% de probabilidad es opaco. "3 semanas si resuelves X" es accionable. Ningún competidor tiene esto.
- **Implementación:**
  1. SQL function `compute_runway_to_next_phase(p_project_id UUID)` que:
     - Calcula delta entre `phase_score.current` y threshold de la fase siguiente
     - Toma los últimos 4 runs de `project_phase_history` para calcular tasa de mejora semanal
     - Divide delta / tasa_semanal → semanas estimadas
     - Identifica los 2 inputs con mayor gap respecto al threshold (los "blockers")
     - Si `iteration_velocity < baseline`, proyecta con baseline mínimo razonable
  2. Nueva columna `runway_estimate JSONB` en `project_phase_state`: `{ weeks: N, blockers: [{input, gap, weight}], confidence: 0.6, computed_at }`
  3. Componente `RunwayEstimate.tsx` en `ProjectEnginePanel`: "Estimado: ~N semanas · Blockers: [X, Y]"
- **Archivos:** Nueva migration · `src/components/project/RunwayEstimate.tsx` · `ProjectEnginePanel.tsx`
- **Timebox:** 4–6h

### E2.2 — Risk Mitigation Playbooks (de score a acciones concretas)
**P2 — ALTO**
- **Qué:** Cuando `risk_score > 60`, el sistema no solo muestra el score. Muestra 3 acciones concretas por cada risk_driver activo. "Concentración de cliente al 35%: [1] Diversifica pipeline ahora, [2] Contacta 3 nuevos leads esta semana, [3] Activa Buyer Persona para segmento nuevo."
- **Implementación:**
  1. Archivo `src/lib/risk-playbooks.ts`: mapa estático de `risk_driver → playbook[3 acciones]` para los 5 vectores del Risk Engine (runway, execution_drop, validation_weakness, revenue_concentration, bottleneck_severity)
  2. Función `getRiskPlaybook(risk_input_key, risk_value)` que devuelve las 3 acciones calibradas
  3. Componente `RiskPlaybookPanel.tsx` que aparece debajo de `RiskBreakdown` cuando `risk_level = 'high' | 'critical'`
  4. Las acciones del playbook pueden crear tareas directamente en el sistema (botón "Crear tarea")
- **Archivos:** `src/lib/risk-playbooks.ts` · `src/components/project/RiskPlaybookPanel.tsx` · `RiskBreakdown.tsx`
- **Timebox:** 5–6h

### E2.3 — Dynamic Hard Signals by `sales_cycle` (thresholds adaptativos)
**P2 — MEDIO**
- **Problema:** Los hard signals de cada fase son estáticos y asumen un ciclo de venta genérico. Un negocio enterprise con ciclo de venta de 6 meses necesita un threshold distinto en "OBV comercial cerrado" que un negocio B2C con ciclo de 1 semana. Con thresholds fijos, el engine penaliza a proyectos enterprise que están ejecutando correctamente.
- **Fix:**
  1. Campo `sales_cycle_type: 'short'|'medium'|'long'` en `project_economic_profile` (derivado de `avg_sales_cycle_days` o declarado en onboarding)
  2. Función `get_phase_thresholds(phase, sales_cycle_type)` que devuelve thresholds calibrados: para `sales_cycle='long'`, el threshold de OBVs comerciales en Fase 2 baja de 2 a 1 pero exige `pipeline_value > X`
  3. Actualizar `compute_phase_score_fase2()` y `compute_phase_score_fase3()` para leer thresholds dinámicos
- **Archivos:** `ENGINE_SPEC_V1.md` (decisión) · Migraciones de engines · `project_economic_profile`
- **Timebox:** 4–5h

### E2.4 — Economic incoherences visibles en UI
**P2 — MEDIO**
- **Problema:** El engine detecta 4 casos de incoherencia del modelo económico (ej: `revenue_type='saas'` pero `avg_ticket > 10000` → incoherente con SaaS típico) pero ningún componente de UI muestra estas incoherencias al founder. Se detectan en BD y desaparecen.
- **Fix:**
  1. Leer `project_economic_profile.model_incoherences JSONB` (ya existe si E4.19 está implementado)
  2. Componente `ModelIncoherenceAlert.tsx`: alerta inline en "Mi Modelo" cuando hay incoherencias. "Tu modelo declara SaaS pero el ticket promedio (€8,500) no es típico de SaaS B2C. ¿Es B2B Enterprise? Actualizar el tipo puede cambiar tus benchmarks."
  3. CTA que lleva a corregir el campo incoherente en Mi Modelo
- **Archivos:** `src/components/project/ModelIncoherenceAlert.tsx` · sección "Mi Modelo"
- **Timebox:** 2–3h

### E2.5 — Cohort Benchmarking (mi proyecto vs proyectos similares del sistema)
**P3 — MEDIO**
- **Qué:** En lugar de benchmarks estáticos externos, usar datos de proyectos reales de Nova Hub para comparar. "Tu task_completion_rate (62%) está por encima de la media de proyectos B2B SaaS en Fase 2 (48%)."
- **Prerequisito:** ≥50 proyectos con datos reales (post-F16 con usuarios reales). Diferir hasta entonces.
- **Implementación futura:** SQL function `compute_cohort_benchmarks(sector, phase, project_type)` sobre `project_phase_state` + anonimización.
- **Timebox:** Diferir a post-escala

---

## BLOQUE 3 — UX: CORRECCIONES ESTRUCTURALES

### U3.1 — ProjectEnginePanel 685 líneas — split de responsabilidades
**P2 — ALTO**
- **Problema:** Un componente renderiza: estado general, métricas individuales, historial de fases, next action, integraciones, Optimus, KPIs, contexto de equipo. Frágil y difícil de mantener.
- **Fix:** Extraer sub-componentes independientes:
  - `EngineStatusHeader` (estado general + fase + probability)
  - `EngineMetricsBreakdown` (breakdown individual de cada engine)
  - `PhaseHistoryTimeline` (historial)
  - `NextActionSection` (ya existe como `NextActionFocusBlock`)
  - `IntegrationsSummary` (cards de integraciones conectadas)
  - `ProjectEnginePanel` queda como orquestador puro (layouting)
- **Archivos:** `src/components/project/ProjectEnginePanel.tsx` → split en 5 archivos
- **Timebox:** 4–5h (refactor puro, sin cambio de comportamiento)

### U3.2 — WeeklySurface redundancia (dos bloques "foco")
**P2 — MEDIO**
- **Problema:** El Weekly Review muestra dos bloques de tipo "foco" con información redundante. El founder ve el mismo punto de acción formulado dos veces con diferente granularidad.
- **Fix:** Consolidar en un único bloque de foco al FINAL del review (retrospectiva → presente → próximo paso). El primero se elimina; el segundo se reformula como "Foco semana siguiente" con el output de `buildNextAction()`.
- **Archivos:** `src/components/project/WeeklySurface.tsx`
- **Timebox:** 1–2h

### U3.3 — Señal Explainer ("¿Por qué?")
**P1 — ALTO · DIFERENCIAL**
- **Qué:** Al lado de cada Next Action y de cada score del engine, un botón "¿Por qué?" que muestra exactamente qué signals dispararon esta recomendación con sus valores reales. "Tu risk_score subió de 38 a 52 por: 2 blockers abiertos + 0 OBVs esta semana + runway estimado < 3 meses."
- **Por qué diferencial:** Convierte el engine de caja negra a sistema de aprendizaje. El founder entiende el modelo. Trust crece. Engagement también.
- **Implementación:**
  1. Extender `buildNextAction()` para incluir `signals_fired: [{signal_name, value, threshold, weight}]`
  2. `SignalExplainerPopover.tsx`: popover activado por botón ⓘ junto al Next Action y junto a cada score
  3. Datos desde `v_engine_input_audit` (E4.V2.3 ya planificado) + `inputs_sources JSONB` (E4.V2.4)
- **Archivos:** `src/lib/build-next-action.ts` · `src/components/project/SignalExplainerPopover.tsx`
- **Timebox:** 3–4h

### U3.4 — Next Action snooze/reject (feedback del founder al engine)
**P2 — MEDIO**
- **Qué:** El founder puede rechazar o posponer una Next Action. "Esta acción no aplica porque [X]" → el engine aprende qué tipo de recomendaciones rechaza este founder.
- **Implementación:**
  1. Botones "Posponer 1 semana" y "No aplica" en `NextActionFocusBlock`
  2. Tabla `next_action_feedback (project_id, action_type, action_key, feedback_type: 'snoozed'|'rejected', reason, created_at)`
  3. `buildNextAction()` excluye acciones rechazadas en los últimos 14 días (snoozed) o 30 días (rejected)
- **Archivos:** `src/components/project/NextActionFocusBlock.tsx` · Nueva migration · `src/lib/build-next-action.ts`
- **Timebox:** 3–4h

### U3.5 — Phase 4 null Next Action (estado sin documentar)
**P1 — MEDIO**
- **Problema:** Cuando el proyecto llega a Fase 4, `getNextAction()` devuelve `null`. No hay estado documentado ni componente para este caso. El founder en Fase 4 ve el Focus Block vacío o en fallback genérico.
- **Fix:**
  1. Añadir caso `phase === 4` en `buildNextAction()`: devolver un Next Action específico de Fase 4 con foco en escala ("Optimiza el canal que ya funciona", "Delega el siguiente proceso operativo")
  2. Empty state específico de Fase 4 en `NextActionFocusBlock.tsx`: "Estás en Fase 4. El foco ahora es escalar lo que ya funciona." con CTA a F22 Expansion Intelligence cuando esté disponible
- **Archivos:** `src/lib/build-next-action.ts` · `src/components/project/NextActionFocusBlock.tsx`
- **Timebox:** 1–2h

### U3.6 — Milestone Replay (hitos superados por ciclo)
**P3 — BAJO**
- **Qué:** El founder puede ver "qué hitos superé en el ciclo anterior" — no solo el estado actual sino el arco de lo logrado.
- **Implementación:** Sección colapsable en `ReentrySurface` que lista los `project_phase_history` rows del ciclo cerrado: "Ciclo 1: avanzaste de Fase 1 a Fase 2 · completaste 23 tareas · cerraste 4 OBVs comerciales."
- **Timebox:** 2–3h

### U3.7 — Next Cycle Advisor (qué enfocar en el próximo ciclo)
**P2 — MEDIO**
- **Qué:** Al entrar al nuevo ciclo (post-Reset), Optimus genera una recomendación específica de enfoque para el ciclo basada en los datos del ciclo anterior. "El ciclo pasado tu mayor gap fue validación. Este ciclo: prioriza 2 OBVs comerciales antes de semana 2."
- **Implementación:**
  1. En `ResetSurface` al completar el ritual, llamar a edge function `generate-next-cycle-advisor` con `{ previous_cycle_data, phase_state, top_gaps }`
  2. Resultado guardado en `strategic_cycles.cycle_advisor_json`
  3. `NextCycleAdvisorCard.tsx` en `ReentrySurface` al inicio del nuevo ciclo
- **Timebox:** 3–4h

### U3.8 — Reentry no muestra múltiples ciclos cerrados
**P3 — BAJO**
- **Problema:** Si hay más de 1 ciclo cerrado, ReentrySurface solo muestra el más reciente. El founder que vuelve después de 3 ciclos no ve el arco completo de lo que ha logrado.
- **Fix:** Mostrar los últimos 3 ciclos en `ReentrySurface` con delta de mejora entre ciclos.
- **Timebox:** 2h

---

## BLOQUE 4 — OPTIMUS: CORRECCIONES Y MEJORAS

### O4.1 — Feedback loop real (RPC que procese votos)
**P1 — CRÍTICO para personalización**
- **Problema:** `OptimusFeedback.tsx` recoge thumbs up/down + categoría pero no hay RPC que procese esos votos. Son decorativos.
- **Fix:**
  1. Verificar/crear tabla `optimus_feedback (id, project_id, user_id, block_type, feedback_type: 'positive'|'negative', category, created_at)`
  2. RPC `submit_optimus_feedback()` con anti-spam (1 voto por bloque por sesión)
  3. Confirmar que `OptimusFeedback.tsx` llama a esta RPC correctamente
  4. El feedback se almacena. El módulo O4.2 (Optimus Memory) lo usa.
- **Archivos:** Nueva migration · `src/components/project/OptimusFeedback.tsx` · `supabase/functions/_shared/`
- **Timebox:** 2–3h

### O4.2 — Optimus Memory (personalización basada en historial del founder)
**P1 — ALTO · DIFERENCIAL**
- **Qué:** El LLM de Optimus recibe un perfil del founder que se construye con el tiempo: qué tipos de consejos rechaza, en qué bloque está crónicamente atascado, cuántas veces ha rechazado la misma recomendación, qué modo prefiere.
- **Por qué diferencial:** Convierte Optimus de LLM genérico a advisor que aprende. En 3 meses, el Optimus de un founder es distinto al de otro aunque tengan el mismo tipo de negocio.
- **Implementación:**
  1. Tabla `optimus_profile (project_id, rejected_categories TEXT[], preferred_mode TEXT, block_weeks TEXT[], total_feedback INT, last_updated TIMESTAMPTZ)`
  2. SQL function `compute_optimus_profile(project_id)` que agrega los últimos 30 feedbacks
  3. Modificar `ritual-optimus/index.ts` para incluir el perfil en el system prompt: "Este founder rechaza consistentemente consejos de tipo 'estructura_equipo'. Prioriza consejos accionables de ventas."
  4. Cron semanal que actualiza el perfil
- **Archivos:** Nueva migration · `supabase/functions/ritual-optimus/index.ts` · `supabase/functions/ai-business-advisor/index.ts`
- **Timebox:** 5–6h

### O4.3 — ai-business-advisor: N+1 queries + límite de historial
**P2 — MEDIO**
- **Problema:** La función carga el historial de conversación sin límite. Conversaciones largas degradan latencia linealmente.
- **Fix:** Añadir `LIMIT 20` a la query de historial. Si hay más de 20 mensajes, usar ventana deslizante (últimos 20 + primer mensaje del contexto para preservar sistema).
- **Archivos:** `supabase/functions/ai-business-advisor/index.ts`
- **Timebox:** 1h

### O4.4 — ritual-optimus: rate limit + JSON.parse sin try-catch
**P2 — MEDIO**
- **Problema:** La función no tiene rate limit. Si el founder recarga el Strategic Reset repetidamente, puede acumular costes de LLM. Además, `JSON.parse` del output del LLM no está en try-catch.
- **Fix:**
  1. Rate limit: verificar si hay un `strategic_cycles` row activo con `ritual_completed_at IS NOT NULL AND ritual_completed_at > NOW() - interval '7 days'` → devolver `{ ok: false, reason: 'already_completed_this_week' }`
  2. Wrap `JSON.parse(llmOutput)` en try-catch. Si falla, devolver la respuesta como texto no estructurado en lugar de crashear.
- **Archivos:** `supabase/functions/ritual-optimus/index.ts`
- **Timebox:** 1–2h

### O4.5 — Optimus schema: añadir campos de profundidad
**P2 — MEDIO**
- **Problema:** El schema actual `{primary, alternative}` no incluye `time_to_act` (urgencia), `prerequisites` (qué debe pasar antes) ni `role` (quién debe ejecutar esto en el equipo).
- **Fix:** Extender schema Zod en `src/lib/optimus.ts`:
  ```typescript
  {
    primary: { ..., time_to_act: 'immediate'|'this_week'|'next_cycle', prerequisites?: string[], role?: string },
    alternative: { ..., invalidation_condition: string }
  }
  ```
  Actualizar prompts en `OPTIMUS_PROMPTS.md` + las 3 edge functions de Optimus para incluir estos campos.
- **Archivos:** `src/lib/optimus.ts` · `OPTIMUS_PROMPTS.md` · `ritual-optimus` · `ai-business-advisor`
- **Timebox:** 2–3h

### O4.6 — ai-task-router: clarificar `classifyTask()` y `extractExecutionParams()`
**P2 — MEDIO**
- **Problema:** Las funciones `classifyTask()` y `extractExecutionParams()` en `ai-task-router/index.ts` tienen implementación opaca — no es claro qué criterios usa para clasificar ni si el output es determinista. Si el clasificador falla silenciosamente, el router puede ejecutar el task type incorrecto.
- **Fix:**
  1. Leer el código actual y verificar si usa regex, LLM call o lógica hardcoded
  2. Si usa LLM sin schema Zod → añadir validación del output con fallback a `'generic'`
  3. Añadir logging: `{ input_task, classified_type, confidence, params_extracted }` en cada invocación
  4. Test unitario con al menos 5 tipos de tarea conocidos
- **Archivos:** `supabase/functions/ai-task-router/index.ts`
- **Timebox:** 2–3h

### O4.7 — Optimus Advisor Mode (chat con historial de decisiones)
**P3 — DIFERENCIAL**
- **Qué:** Optimus como conversación persistente donde el founder puede preguntar "¿por qué me recomendaste X la semana pasada?" y Optimus responde con el contexto de la decisión histórica. Actualmente cada sesión es stateless.
- **Implementación:**
  1. Tabla `optimus_decision_log (id, project_id, session_id, block_type, primary_advice, context_snapshot JSONB, created_at)` — persiste cada output de Optimus con el contexto del engine en ese momento
  2. `ai-business-advisor` incluye los últimos 5 `optimus_decision_log` rows en el contexto
  3. UI: timeline de decisiones Optimus en pestaña "Historial" del panel de Optimus
- **Timebox:** 5–6h

### O4.8 — Decision Simulation (A vs B con outcome proyectado)
**P3 — DIFERENCIAL**
- **Qué:** El founder puede pedir "simula qué pasa si elijo modelo freemium vs premium" y Optimus proyecta el impacto en los engines: "Freemium → menor avg_ticket → Fase 2 más lenta · Premium → mayor friction → menos OBVs en mes 1 pero mejor economic_profile a 6 meses."
- **Implementación:**
  1. Edge function `simulate-decision`: recibe `{ decision_a, decision_b, project_context }` → LLM con system prompt de simulación + datos reales del engine → output `{ scenario_a_impact, scenario_b_impact, recommendation }`
  2. UI: modal activado desde `ai-business-advisor` con prompt especial "Simular decisión"
- **Timebox:** 5–6h

### O4.9 — Evidence Validation Assistant (conflicto fuente manual vs integración)
**P3 — MEDIO**
- **Qué:** Cuando hay conflicto entre datos declarados manualmente y datos de integración (ej: founder dice MRR=€5k, Stripe dice MRR=€3.2k), Optimus ayuda al founder a entender la discrepancia en lugar de resolverla silenciosamente por peso de fuente.
- **Implementación:**
  1. Detectar conflictos en `evidence.ts` cuando `resolveConflict()` tiene score delta < 0.2 (ambas fuentes casi igual de confiables pero valores distintos)
  2. En lugar de resolver automáticamente, emitir `notification` con `type='evidence_conflict'`
  3. Modal `EvidenceConflictModal.tsx`: muestra las dos fuentes, sus valores, sus pesos, y permite al founder confirmar cuál es correcto
- **Timebox:** 3–4h

### O4.10 — Bloque escalada para traction/clarity (block_weeks_active)
**P2 — MEDIO**
- **Problema:** La escalada de bloques Optimus (clarity → traction → structural → behavioral) requiere `block_weeks_active` para avanzar. Este contador no existe. Los bloques no escalan aunque el founder lleve semanas en el mismo punto.
- **Fix:** Columna `block_weeks_active INT DEFAULT 0` en `strategic_blocks`. Trigger `AFTER UPDATE` cuando `block_type` no cambia entre dos runs consecutivos → `block_weeks_active += 1`. El engine de Optimus lee este campo para escalar el bloque.
- **Archivos:** Nueva migration · `supabase/functions/ritual-optimus/index.ts`
- **Timebox:** 2–3h

---

## BLOQUE 5 — INTEGRACIONES: COMPLETAR EL SISTEMA

### I5.1 — Holded normalizer + agente real (I15.91)
**P1 — ALTO** (España = mercado principal, Holded es el ERP dominante)
- **Qué:** Implementar el normalizer real de Holded para facturas y gastos. Sin Holded, los founders españoles no pueden conectar su contabilidad y el Finance Agent no emite expense_spike ni runway_estimate.
- **Implementación:**
  1. `supabase/functions/_shared/normalizers/holded-financial.ts`: mapear Invoice/Expense de Holded API → `ContractEntity`
  2. `supabase/functions/connect-holded/index.ts`: OAuth Holded + crear `integration_connections`
  3. `supabase/functions/sync-holded/index.ts`: descarga facturas/gastos, normaliza, motor write
  4. Extender `financeAgentService.ts` para incluir fuente `holded`
- **Timebox:** 8–10h

### I5.2 — HubSpot deal history (pipeline_velocity bloqueado)
**P2 — ALTO**
- **Problema:** El Sales Agent solo emite `open_pipeline_value` (total). Falta `pipeline_velocity` (velocidad de cierre) y `deal_stagnation` (deals bloqueados). Ambos requieren historial de transiciones de deals.
- **Fix:** Tabla `integration_deal_history (id, entity_id, connection_id, from_stage, to_stage, transitioned_at, days_in_stage, confidence)`. Actualizar `sync-hubspot` para capturar cambios de stage. Actualizar `salesAgentService.ts` para computar velocity.
- **Archivos:** Nueva migration · `supabase/functions/sync-hubspot/index.ts` · `src/services/salesAgentService.ts`
- **Timebox:** 5–6h

### I5.3 — Asana pagination: lógica de cursor indefinida
**P3 — BAJO**
- **Problema:** `MAX_PAGES = 10` limita a 1000 tareas. La lógica de continuación con `pagination_cursor` no está claramente implementada (¿reset o continúa?).
- **Fix:** Documentar explícitamente en el código si el cursor es persistente entre runs o se resetea. Si resetea, añadir log de advertencia cuando `entities_processed = MAX_PAGES * 100` ("posible truncación").
- **Timebox:** 1h

### I5.4 — Credenciales hardcodeadas en componentes (security)
**P1 — ALTO**
- **Problema:** `SUPABASE_ANON_KEY` y `FUNCTIONS_URL` están hardcodeadas en `StripeIntegration.tsx` y posiblemente otros componentes de integración.
- **Fix:** Mover a `import.meta.env.VITE_SUPABASE_ANON_KEY` (ya disponible en el proyecto). O mejor: usar `supabase.functions.invoke()` nativa que no requiere pasar la key explícitamente.
- **Archivos:** Todos los `*Integration.tsx` en `src/components/integrations/`
- **Timebox:** 2h

### I5.6 — Zapier/Make webhook genérico (integrar cualquier SaaS no soportado)
**P3 — MEDIO**
- **Qué:** Un webhook genérico que permite a founders conectar cualquier herramienta no soportada nativamente (Pipedrive, Paypal, Xero, Salesforce, etc.) enviando datos que se normalizan a `ContractEntity`.
- **Implementación:**
  1. Edge function `receive-webhook`: acepta POST con `{ provider, entity_type, payload }` y un API key de validación
  2. Normalizer genérico `generic-webhook.ts`: valida schema mínimo (`external_id`, `occurred_at`, `value`) con schema_score por campos presentes
  3. Almacena en `integration_entities[provider='zapier'|'make'|provider_custom]`
  4. Los agentes existentes pueden leer estas entities si `entity_type` coincide ('subscription', 'deal', 'task')
- **Timebox:** 6–8h

### I5.7 — GitHub Activity como proxy de ejecución técnica
**P3 — BAJO**
- **Qué:** Para proyectos con equipo técnico donde Asana no es la herramienta principal, los commits y PRs de GitHub son señal de ejecución real. Un sprint productivo en GitHub debe reflejarse en `iteration_velocity`.
- **Implementación:**
  1. `connect-github/index.ts`: OAuth GitHub App + crear `integration_connections`
  2. `sync-github/index.ts`: GitHub API → lista de commits/PRs/issues cerrados → normalizar como `ContractEntity[entity_type='technical_task']`
  3. Execution Agent reconoce `entity_type='technical_task'` además de `'task'`
- **Timebox:** 6–8h

### I5.5 — Anti-spam 15% threshold: verificar implementación
**P2 — MEDIO**
- **Problema:** El AGENTS_CONTRACT §10 especifica que un insight no se re-emite si el valor cambió < 15%. No es claro si `financeAgentService.ts` compara `current_value` vs `previous_value` del insight anterior.
- **Fix:** Leer `financeAgentService.ts` líneas 99-150 y verificar. Si no está implementado, añadir: `const delta = Math.abs(newValue - prevValue) / prevValue; if (delta < 0.15) return { skipped: true, reason: 'below_threshold' }`.
- **Timebox:** 1–2h

---

## BLOQUE 6 — FEATURES NUEVAS — DIFERENCIALES REALES

Estas son features que no existen en ningún competidor y que Nova Hub puede construir porque ya tiene los datos.

### F6.1 — Moment Detector (auto-trigger proactivo)
**P1 — KILLER FEATURE · MUY ALTA PRIORIDAD**
- **Qué:** Cuando 3+ señales del engine convergen (ej: risk escalada + probability baja + task completion baja + 0 OBVs en 2 semanas), el sistema propone automáticamente una acción concreta sin que el founder tenga que abrir nada.
- **Por qué diferencial:** El sistema pasa de "yo muestro información" a "yo detecto que necesitas actuar ahora". Ningún SaaS de gestión hace esto. Es el paso de dashboard a advisor activo.
- **Implementación:**
  1. SQL function `detect_signal_convergence(p_project_id UUID)`:
     - Input: últimas filas de los 5 engines
     - Output: `{ converged: boolean, signals: string[], recommended_action: 'strategic_reset'|'meeting_review'|'emergency_mode'|'optimus_session', urgency: 'low'|'medium'|'high' }`
     - Regla: si ≥3 de estos criterios → `converged=true`:
       - `risk_score > 55` (señal rojo)
       - `probability < 35%` (señal muy baja)
       - `task_completion_rate < 30%` en los últimos 7 días
       - 0 OBVs creados en los últimos 14 días
       - `iteration_velocity < baseline_velocity * 0.5`
  2. Trigger `AFTER INSERT` en `project_phase_state` → llama `detect_signal_convergence` → si `converged=true` → insert en `notifications` con `type='moment_detected'`, `priority='critical'`
  3. UI: `MomentDetectorBanner.tsx` — aparece encima de todo cuando `type='moment_detected'` sin leer. "El sistema detectó que necesitas actuar. [Ver diagnóstico]" → lleva a Optimus pre-cargado con el contexto de convergencia.
  4. Edge function `trigger-moment-detection`: endpoint manual para testing + llamado desde cron diario
- **Archivos:** Nueva migration · `src/components/project/MomentDetectorBanner.tsx` · Nueva edge function
- **Timebox:** 6–8h

### F6.2 — Execution-to-Revenue Pipeline (Asana → HubSpot → Stripe correlación)
**P1 — KILLER FEATURE · ÚNICO EN EL MERCADO**
- **Qué:** El sistema vincula tareas completadas (Asana) con deals cerrados (HubSpot) y suscripciones activadas (Stripe). Resultado: "Tu onboarding completado el día 15 correlaciona con el deal cerrado 3 días después por €5,000."
- **Por qué diferencial:** Es el único SaaS que puede mostrar la correlación directa entre lo que el founder ejecutó y los euros que generó. No es gestión de proyectos ni CRM — es CRM de causalidad.
- **Prerequisito:** B0.1 resuelto + I5.1 (Holded) + I5.2 (HubSpot deal history)
- **Implementación:**
  1. SQL function `detect_execution_revenue_correlation(p_project_id UUID)`:
     - Une `integration_entities[type='task', status='completed']` (Asana) con `integration_entities[type='deal', stage='closed_won']` (HubSpot) y `integration_entities[type='subscription', status='active']` (Stripe)
     - Ventana temporal: si task_completed → deal_closed en ≤7 días → correlación alta (confidence 0.7)
     - Si task_completed → deal_closed en 7–21 días → correlación media (confidence 0.5)
  2. `integration_insights[insight_type='execution_revenue_correlation']` con narrative generada
  3. Componente `ExecutionRevenueCard.tsx`: "Esta semana completaste 5 tareas de onboarding → 2 deals cerrados → €8,500 generados."
- **Timebox:** 8–10h (requiere I5.2 primero)

### F6.3 — Cash Flow Stress Test (escenarios financieros)
**P2 — ALTO**
- **Qué:** "Si pierdes tu top cliente (35% MRR), tu runway cae de 6 meses a 3 meses." "Si crecimiento baja al 5%/mes, breakeven en 18 meses en lugar de 8."
- **Implementación:**
  1. SQL function `run_cash_flow_stress_test(p_project_id UUID)`:
     - Input: MRR actual + top_client_revenue_percent + expense_estimate + growth_rate
     - Escenarios: `churn_top_client`, `growth_halved`, `no_new_revenue`
     - Output: `{ scenarios: [{name, new_runway_months, new_mrr, breakeven_delta}] }`
  2. Threshold: solo emite si `revenue_concentration > 30%` OR `runway < 6 months`
  3. `CashFlowStressCard.tsx` en el panel financiero con visualización de los 3 escenarios
- **Archivos:** Nueva migration · `src/components/project/CashFlowStressCard.tsx`
- **Timebox:** 5–6h

### F6.4 — Ciclo Intelligence (aprendizaje entre ciclos estratégicos)
**P2 — DIFERENCIAL**
- **Qué:** Al cerrar un Strategic Reset (ciclo), el sistema compara: qué se comprometió el founder vs qué hizo. "Ciclo 2 vs Ciclo 1: mejoraste task completion +20%, pero las validaciones bajaron 40%. Patrón detectado: priorizas ejecución sobre validación en semanas de alto riesgo."
- **Implementación:**
  1. Al crear un `strategic_cycles` row con `commitments_json` (qué se propone hacer)
  2. Al cerrar el ciclo: SQL function `compute_cycle_delta(cycle_id)` compara compromisos con datos reales
  3. Tabla `cycle_intelligence (cycle_id, commitments_met INT, commitments_total INT, patterns_detected JSONB, delta_vs_previous JSONB)`
  4. Componente `CycleIntelligenceCard.tsx` en `ReentrySurface` (visible al entrar al siguiente ciclo)
- **Prerequisito:** Que `strategic_cycles.commitments_json` se llene durante el Strategic Reset (añadir campo al ResetSurface)
- **Timebox:** 6–8h

### F6.5 — Predictive MRR (proyección basada en historial real)
**P2 — ALTO**
- **Qué:** Finance Agent predice MRR a 3 meses basado en tasa de crecimiento histórica de Stripe + churn rate + CAC estimado.
- **Implementación:**
  1. `compute_mrr_forecast(p_project_id UUID)`: regresión lineal simple sobre últimas 8 semanas de `key_metrics[metric_key='mrr']`
  2. `integration_insights[insight_type='mrr_forecast', confidence=0.55–0.75]`
  3. `MRRForecastCard.tsx`: línea actual + proyección + banda de confianza
- **Prerequisito:** ≥4 runs de Stripe sync con datos reales
- **Timebox:** 4–5h

### F6.6 — Churn Risk Scoring (detección temprana de pérdida de cliente)
**P2 — ALTO**
- **Qué:** Cruza datos de reuniones (Meeting Intelligence) + deals (HubSpot) para detectar riesgo de churn de clientes actuales. "Cliente X: no ha habido reunión en 3 semanas + deal en negotiation sin progreso 21 días → riesgo de churn ALTO."
- **Implementación:**
  1. SQL function `detect_churn_risk(p_project_id UUID)` en `financeAgentService`
  2. `integration_insights[insight_type='churn_risk', severity='warning'|'critical']`
  3. `ChurnRiskAlert.tsx` en el panel de CRM
- **Timebox:** 5–6h

---

## BLOQUE 7 — F17–F22: GAPS Y MEJORAS POR FEATURE

### ARQ.1 — F17+F18+F19 como sistema cerrado: el founder IS the CRM
**P1 — ARQUITECTÓNICO · NO ES UNA FEATURE — ES UNA DECISIÓN DE DISEÑO**
- **Problema:** F17 (evidencia), F18 (meeting intelligence) y F19 (task loop) están implementados como features independientes pero tienen una tesis común que no está articulada en ningún lugar del código ni de la UI: **el sistema de Nova Hub trata al founder como CRM de sí mismo**. Cada reunión, cada tarea completada, cada validación es un dato que el sistema registra, pondera y convierte en acción. Eso no lo tiene ningún competidor — pero tampoco lo ve el founder porque no hay ningún componente que conecte los tres loops visualmente.
- **Fix — no es código sino diseño:**
  1. Definir en `ENGINE_SPEC_V1.md` (o documento nuevo `CLOSED_LOOP_DESIGN.md`) la tesis explícita: "El loop cerrado = Task (F19) → Evidence (F17) → Meeting Decision (F18) → Next Action (F19) → Task". Cada vuelta del loop incrementa la calidad de los datos del engine.
  2. `ClosedLoopWidget.tsx`: visualización compacta del loop en `ProjectEnginePanel` — muestra cuántas vueltas ha dado el founder (cuántas tareas completadas con feedback + cuántas reuniones analizadas + cuántas decisiones tomadas) como indicador de madurez del sistema.
  3. El onboarding debe explicar este loop en el Day 1: "Cada tarea que completas con resultado, cada reunión que analizas, cada validación que cierras — el sistema aprende. En 4 semanas, Nova Hub conoce tu negocio mejor que cualquier otra herramienta."
- **Timebox:** 2h (documento) + 3h (widget) + 1h (onboarding copy)

### F17 — Evidence System: formalizar SOURCE_WEIGHTS como spec matemática
**P2 — MEDIO**
- Actualizar `ENGINE_SPEC_V1.md` con la justificación formal de cada peso: por qué `Stripe=1.0`, `ai_inferred=0.35`, etc.
- Añadir a `F1.V2.2` del TASK_LIST (ya identificado como deuda).
- **Timebox:** 2h (solo documentación, no código)

### F18 — Meeting Intelligence: auto-trigger + spec matemática `combined_reliability`
**P1 — ALTO**

**F18.A — Auto-trigger de reuniones:**
- **Problema:** Meeting Intelligence solo actúa cuando el founder abre conscientemente la reunión. Si la reunión fue hace 3 días, perdió relevancia.
- **Fix:** Webhook de transcripción completada → notificación automática "Tienes una reunión sin revisar que puede afectar tu fase actual."
- **Timebox:** 3h

**F18.B — Spec matemática `combined_reliability`:**
- **Problema:** `combined_reliability = transcription_confidence × clarity_score × speaker_certainty_weight` no tiene spec formal. Sin decisiones de escala y casos extremos, los pesos pueden cambiar sin control.
- **Fix:** Añadir spec a `ENGINE_SPEC_V1.md` + `F1.V2.1` del TASK_LIST.
- **Timebox:** 2h (documentación)

**F18.C — Combined reliability visible en UI:**
- Mostrar `combined_reliability` en `MeetingInsightsReview.tsx` con label explicativo: "Fiabilidad del análisis: 78% — basado en calidad de audio + claridad de discurso + identificación de hablantes."
- **Timebox:** 2h

### F19 — Focus Block + Task Loop: Optimus schema extension
**P2 — MEDIO**
- Extender el schema de Optimus con `time_to_act`, `prerequisites`, `role` (ya en O4.5).
- Conectar `ReentrySurface` con `NextActionFocusBlock` (ya en U6.V2.1 del TASK_LIST).
- **Timebox:** Ya cubierto en O4.5

### F20 — Análisis Estratégico: reformular constraints de output del LLM
**P1 — ALTO**
- **Problema:** El output de `analyze-project-v4` es texto libre genérico. Sin constraints, el LLM produce algo intercambiable con cualquier prompt genérico a GPT-4.
- **Fix:** Reformular los prompts de los 3 niveles con datos reales inyectados como constraints obligatorios:
  - "Genera un 'hard truth' basado EXCLUSIVAMENTE en estos datos reales: [risk_score=X, iteration_velocity=Y, task_completion_rate=Z]. La verdad incómoda debe citar al menos 2 de estos números."
  - Estructura de output obligatoria: `{ hard_truth: string (cita datos), root_cause: string, 3_concrete_actions: string[] }`
- **Archivos:** `supabase/functions/analyze-project-v4/index.ts` + prompts internos
- **Timebox:** 3–4h

### F21 — Founder Toolkit: dar contexto de fase a tools genéricos
**P2 — MEDIO**
- **Problema:** 4 de 6 tools (email pitch, content calendar, learning path, sales playbook) son genéricos. Sin datos del proyecto en el prompt, su output es equivalente a ChatGPT.
- **Fix:** Inyectar en el contexto de cada tool: `{ current_phase, phase_score, top_risk_driver, recent_obvs_count, mrr_if_available, sector }`. El output se vuelve específico al proyecto real.
- **Archivos:** Edge functions de cada tool + `FounderToolkitPage.tsx`
- **Timebox:** 4h (2 tools/hora × 4 tools)
- **⛔ REGLA DE DESARROLLO:** No añadir ningún tool nuevo al Founder Toolkit hasta que estos 4 tengan contexto de fase inyectado y verificado con outputs reales. Un tool nuevo genérico no añade valor diferencial — solo añade superficie de mantenimiento.

### F22 — Expansion Intelligence: implementación inicial mínima
**P3 — BAJO** (prerequisitos: proyecto en Fase 3+, MRR estable ≥2 meses)
- El plan de F22 (0/9 tareas) está correcto — es post-escala.
- Lo que sí se puede hacer ahora: preparar el schema de datos que F22 necesitará (`expansion_signals`, `geo_intelligence_cache`).
- **Timebox:** Diferir hasta primeros usuarios en Fase 3 con MRR estable.

---

## BLOQUE 8 — NUEVAS FASES PROPUESTAS

### FASE 23 — Proactive Intelligence (Moment Detector + Runway to Phase N)
> **Prerequisito:** FASE 16 cerrada (usuarios reales con datos). F6.1 + E2.1 de este plan.
> **Objetivo:** El sistema deja de ser reactivo. Detecta cuándo el founder necesita actuar sin que lo pida.

**Tareas:**
- [ ] **P23.1** SQL function `detect_signal_convergence()` — 5 señales, 3+ activas = momento detectado
- [ ] **P23.2** Trigger `AFTER INSERT ON project_phase_state` → evalúa convergencia
- [ ] **P23.3** `MomentDetectorBanner.tsx` — UI del momento detectado
- [ ] **P23.4** SQL function `compute_runway_to_next_phase()` — proyección semanal
- [ ] **P23.5** `RunwayEstimate.tsx` — "~N semanas · Blockers: [X, Y]"
- [ ] **P23.6** Notificación de tipo `moment_detected` integrada en sistema N7
- [ ] **P23.7** Cron diario `trigger-moment-detection` edge function

### FASE 24 — Optimus Personalization (Optimus Memory + Feedback Real)
> **Prerequisito:** FASE 16 cerrada. O4.1 (feedback real) + O4.2 (memoria).
> **Objetivo:** Optimus aprende de cada interacción con el founder. En 1 mes da consejos distintos a cada founder.

**Tareas:**
- [ ] **P24.1** Tabla `optimus_feedback` + RPC `submit_optimus_feedback()`
- [ ] **P24.2** Conectar `OptimusFeedback.tsx` a RPC real (eliminar comportamiento decorativo)
- [ ] **P24.3** Tabla `optimus_profile` (perfil por founder)
- [ ] **P24.4** SQL function `compute_optimus_profile(project_id)` — agrega últimos 30 feedbacks
- [ ] **P24.5** Cron semanal de actualización de perfil
- [ ] **P24.6** Inyectar perfil en system prompt de `ritual-optimus`
- [ ] **P24.7** Inyectar perfil en `ai-business-advisor`
- [ ] **P24.8** `OptimusProfileCard.tsx` — muestra al founder su perfil ("Rechazas consejos de estructura: 4 veces")

### FASE 25 — Execution-to-Revenue (Causalidad Asana → HubSpot → Stripe)
> **Prerequisito:** B0.1 + I5.1 + I5.2 resueltos. ≥3 founders con las 3 integraciones activas.
> **Objetivo:** El primer SaaS que muestra correlación directa entre tareas ejecutadas y euros generados.

**Tareas:**
- [ ] **P25.1** Tabla `integration_deal_history` (historial de transiciones de deals HubSpot)
- [ ] **P25.2** Actualizar `sync-hubspot` para capturar transiciones de stage
- [ ] **P25.3** SQL function `detect_execution_revenue_correlation()`
- [ ] **P25.4** `integration_insights[type='execution_revenue_correlation']`
- [ ] **P25.5** `ExecutionRevenueCard.tsx` — visualización de la correlación
- [ ] **P25.6** Integrar correlación en Optimus context (`get_optimus_context()`)
- [ ] **P25.7** `SalesAgentService` — añadir `pipeline_velocity` usando deal history

### FASE 26 — Financial Intelligence Avanzada (Stress Test + Predictive MRR + Churn)
> **Prerequisito:** FASE 25. ≥8 semanas de datos reales de Stripe.
> **Objetivo:** Finance Agent emite insights predictivos y preventivos, no solo descriptivos.

**Tareas:**
- [ ] **P26.1** SQL function `run_cash_flow_stress_test()` — 3 escenarios
- [ ] **P26.2** `CashFlowStressCard.tsx` — visualización de escenarios
- [ ] **P26.3** SQL function `compute_mrr_forecast()` — regresión lineal 8 semanas
- [ ] **P26.4** `MRRForecastCard.tsx` — proyección con banda de confianza
- [ ] **P26.5** SQL function `detect_churn_risk()` — Meeting + HubSpot cruzados
- [ ] **P26.6** `ChurnRiskAlert.tsx` — alerta proactiva en CRM panel
- [ ] **P26.7** Integrar todos los insights predictivos en la síntesis de Optimus

### FASE 27 — Ciclo Intelligence (Aprendizaje entre ciclos estratégicos)
> **Prerequisito:** ≥2 ciclos completados con datos reales. `strategic_cycles` con `commitments_json`.
> **Objetivo:** El founder ve la diferencia entre lo que cree que es y lo que los datos dicen que hace.

**Tareas:**
- [ ] **P27.1** Campo `commitments_json JSONB` en `strategic_cycles` (qué se compromete al entrar)
- [ ] **P27.2** UI para capturar compromisos en `ResetSurface` al iniciar ciclo
- [ ] **P27.3** SQL function `compute_cycle_delta(cycle_id)` — compromisos vs realidad
- [ ] **P27.4** Tabla `cycle_intelligence`
- [ ] **P27.5** `CycleIntelligenceCard.tsx` en `ReentrySurface`
- [ ] **P27.6** Detección de patrones del founder (patrón de 3+ ciclos)
- [ ] **P27.7** Integrar patrones en Optimus como input de personalización

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
AHORA (bugs en producción):
  B0.2 (auto-sync mock — 30min) → B0.3 (Slack schema — 2h) → B0.1 (DEBT.5 — 3-4h)

ANTES DE ESCALAR USUARIOS:
  I5.4 (credenciales hardcoded) → O4.4 (ritual-optimus fixes) → O4.3 (advisor limit)

CON PRIMEROS USUARIOS (FASE 16 activa):
  E2.1 (Runway to Phase N) → U3.3 (Señal Explainer) → O4.1 (feedback real) → FASE 23

ANTES DE ESCALAR FEATURES DE F20 (no esperar a usuarios):
  F20 (prompts con constraints — no construir nivel 2/3 de F20 hasta que nivel 1 cite datos reales)

POST-USUARIOS VALIDADOS (≥10 usuarios, datos reales):
  O4.2 (Optimus Memory) → FASE 24

POST-INTEGRACIONES REALES (≥5 founders con Stripe):
  I5.1 (Holded) → I5.2 (HubSpot deal history) → FASE 25

POST-ESCALA (≥8 semanas datos):
  FASE 26 → FASE 27
```

---

## RESUMEN DE TAREAS POR PRIORIDAD

| ID | Tarea | Prioridad | Timebox |
|---|---|---|---|
| B0.1 | DEBT.5: motor writes en producción | P0 CRÍTICO | 3–4h |
| B0.2 | auto-sync-finances eliminar/deshabilitar | P0 CRÍTICO | 30min |
| B0.3 | Slack schema mismatch fix | P0 ALTO | 2h |
| B0B.1 | I15.DEBT.2: MRR diverge si upsert falla | P1 ALTO | 1–2h |
| B0B.2 | I15.DEBT.3: GCal eventos cancelados activos | P1 MEDIO | 2h |
| B0B.3 | I15.DEBT.4: invalidateQueries silencioso | P2 MEDIO | 1–2h |
| E2.1 | Runway to Phase N | P1 KILLER | 4–6h |
| F6.1 | Moment Detector | P1 KILLER | 6–8h |
| F6.2 | Execution-to-Revenue Pipeline | P1 KILLER | 8–10h |
| ARQ.1 | F17+F18+F19 sistema cerrado (diseño + widget + onboarding) | P1 ARQUITECTÓNICO | 6h |
| O4.1 | Optimus feedback real (RPC) | P1 CRÍTICO | 2–3h |
| O4.2 | Optimus Memory | P1 ALTO | 5–6h |
| U3.3 | Señal Explainer | P1 ALTO | 3–4h |
| U3.5 | Phase 4 null Next Action | P1 MEDIO | 1–2h |
| I5.4 | Credenciales hardcodeadas | P1 SECURITY | 2h |
| F18.A | Meeting auto-trigger | P1 ALTO | 3h |
| E1.1 | Phase-Probability primer ciclo frío | P1 MEDIO | 2–3h |
| E1.2 | O3.3 cap solo founders | P1 MEDIO | 2h |
| E1.3 | Viability T3 benchmark sin moderación | P1 MEDIO | 2–3h |
| F20  | Análisis Estratégico prompts con constraints | P1 ALTO | 3–4h |
| I5.1 | Holded normalizer real | P1 ALTO | 8–10h |
| E2.2 | Risk Mitigation Playbooks | P2 ALTO | 5–6h |
| E2.3 | Dynamic Hard Signals by sales_cycle | P2 MEDIO | 4–5h |
| E2.4 | Economic incoherences visibles en UI | P2 MEDIO | 2–3h |
| U3.1 | ProjectEnginePanel split | P2 ALTO | 4–5h |
| U3.2 | WeeklySurface redundancia | P2 MEDIO | 1–2h |
| U3.4 | Next Action snooze/reject | P2 MEDIO | 3–4h |
| U3.7 | Next Cycle Advisor | P2 MEDIO | 3–4h |
| O4.4 | ritual-optimus rate limit + try-catch | P2 MEDIO | 1–2h |
| O4.3 | ai-business-advisor limit historial | P2 MEDIO | 1h |
| O4.5 | Optimus schema extensión | P2 MEDIO | 2–3h |
| O4.6 | ai-task-router clarificar classifyTask() | P2 MEDIO | 2–3h |
| O4.10 | block_weeks_active escalada Optimus | P2 MEDIO | 2–3h |
| O4.9 | Evidence Validation Assistant | P2 MEDIO | 3–4h |
| F18.B | combined_reliability spec matemática | P2 DOC | 2h |
| F18.C | combined_reliability visible en UI | P2 MEDIO | 2h |
| F21  | Founder Toolkit contexto de fase | P2 MEDIO | 4h |
| I5.2 | HubSpot deal history | P2 ALTO | 5–6h |
| I5.5 | Anti-spam 15% threshold verificar | P2 MEDIO | 1–2h |
| F6.3 | Cash Flow Stress Test | P2 ALTO | 5–6h |
| F6.5 | Predictive MRR | P2 ALTO | 4–5h |
| F6.6 | Churn Risk Scoring | P2 ALTO | 5–6h |
| F6.4 | Ciclo Intelligence | P2 DIFERENCIAL | 6–8h |
| O4.7 | Optimus Advisor Mode (chat + historial) | P3 DIFERENCIAL | 5–6h |
| O4.8 | Decision Simulation (A vs B) | P3 DIFERENCIAL | 5–6h |
| U3.6 | Milestone Replay | P3 BAJO | 2–3h |
| U3.8 | Reentry múltiples ciclos | P3 BAJO | 2h |
| I5.3 | Asana pagination documentar | P3 BAJO | 1h |
| I5.6 | Zapier/Make webhook genérico | P3 MEDIO | 6–8h |
| I5.7 | GitHub Activity proxy ejecución | P3 BAJO | 6–8h |
| E2.5 | Cohort Benchmarking | P3 DIFERIR | Post-escala |
| F22  | Expansion Intelligence | P3 DIFERIR | Post-escala |

**Total ítems: 52**
**Total horas estimadas (P0+P1):** ~90–110h
**Total horas estimadas (P2):** ~75–90h
**Total horas estimadas (P3+nuevas fases):** ~70–85h

---

*Plan creado: 2026-03-20. Origen: análisis multi-agente exhaustivo.*
*Revisar y priorizar con el usuario antes de ejecutar cualquier tarea de P2 o superior.*
