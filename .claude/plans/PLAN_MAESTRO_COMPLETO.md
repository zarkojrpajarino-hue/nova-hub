# PLAN MAESTRO COMPLETO — Nova Hub (Optimus-K)
> Fusión consolidada de: análisis multi-agente (PLAN_MEJORAS_ANALISIS_2026.md) + TASK_LIST.md pendientes
> + Fases 23-26 (Motor Progresión v2, Visibilidad, Ciclos Estratégicos, Equipo v2)
> Última actualización: 2026-03-21
> Prioridad: P0 = bug producción · P1 = bloquea valor/diferencial · P2 = mejora estructural · P3 = post-escala
> Estado: [ ] pendiente · [~] activo · [x] hecho

---

## VISIÓN GENERAL — SECUENCIA DE EJECUCIÓN

```
AHORA (bugs activos en producción)
  ↓
PRE-USUARIOS (infraestructura observable + fixes de schema)
  ↓
FASE 16 activa (conseguir usuarios reales — no construir más hasta datos)
  ↓
CON PRIMEROS USUARIOS (Day 1 XP + Motor Progresión v2 + Equipo v2 + features diferenciales)
  ↓
POST-VALIDACIÓN (Ciclos Estratégicos + Optimus Memory + monetización)
  ↓
POST-INTEGRACIONES REALES (Execution-to-Revenue + Financial Intelligence)
  ↓
POST-ESCALA (Ciclo Intelligence + Expansion + Cohort Benchmarking)
```

### Mapa de fases nuevas (23-31)

| Fase | Nombre | Origen | Nivel | Prerequisito |
|------|--------|--------|-------|-------------|
| **23** | Motor de Progresión v2 | Hoy (equipo/fases) | 3 | F16 activa |
| **24** | Visibilidad de Progresión y Metodología | Hoy (equipo/fases) | 3 | F23 |
| **25** | Ciclos Estratégicos | Hoy (equipo/fases) | 4 | F23 + graduados de Phase 4 |
| **26** | Sistema de Equipo v2 | Hoy (equipo/fases) | 3-4 | F23 |
| **27** | Proactive Intelligence | Plan agentes (era F23) | 3 | F16 activa |
| **28** | Optimus Personalization | Plan agentes (era F24) | 4 | F16 cerrada + O4.1 |
| **29** | Execution-to-Revenue Pipeline | Plan agentes (era F25) | 5 | B0.1 + I5.1 + I5.2 |
| **30** | Financial Intelligence Avanzada | Plan agentes (era F26) | 5 | F29 + ≥8 semanas Stripe |
| **31** | Ciclo Intelligence | Plan agentes (era F27) | 5 | F25 + ≥2 ciclos completados |

---

## NIVEL 0 — BUGS ACTIVOS EN PRODUCCIÓN (hacer hoy)

| ID | Qué | Timebox |
|---|---|---|
| **B0.1** | DEBT.5: `write_integration_to_engine_table()` llamado fuera del sync_run activo → MRR nunca llega al Phase Engine. Mover call dentro de `sync-stripe/hubspot/asana` mientras `status='running'` | 3–4h |
| **B0.2** | `auto-sync-finances` devuelve `generateMockTransactions()` para todos los providers. Eliminar completamente (sistema I15 lo reemplaza) o añadir guard `{ reason: 'deprecated' }` | 30min |
| **B0.3** | Slack schema mismatch: UI busca `enabled/notification_types/created_by`, DB tiene `is_active` sin los demás. Migración + fix queries en `SlackIntegration.tsx` | 2h |
| **B0B.1** | I15.DEBT.2: MRR diverge si upsert falla — sync_run queda `completed` con MRR sin actualizar. Verificar `write_status` antes de cerrar run; si falla → `status='partial'` | 1–2h |
| **B0B.2** | I15.DEBT.3: GCal eventos cancelados siguen activos en `integration_entities`. Descargar también `status='cancelled'` y hacer upsert. Calendar Agent filtra antes de emitir | 2h |
| **AUD.B.7** | Sync quality opaca: partial sync sin feedback al usuario ni al motor. Relacionado con B0B.1 — unificar fix | con B0B.1 |

---

## NIVEL 1 — PRE-USUARIOS (hacer antes de conseguir el primer usuario)

### Observabilidad (F16 Bloque A — infraestructura)
| ID | Qué | Estado |
|---|---|---|
| **U16.1** | Activar PostHog con key real (`VITE_POSTHOG_KEY` en .env + Vercel) | [~] código listo |
| **U16.2** | Activar Sentry con DSN real (`VITE_SENTRY_DSN` en .env + Vercel) | [~] código listo |
| **U16.3** | Configurar Resend: `supabase secrets set RESEND_API_KEY + NOTIFICATION_FROM_EMAIL + APP_URL` | [~] código listo |
| **V11.V2.1** | Añadir 4 eventos PostHog: `trackFocusBlockCtaClicked`, `trackTaskSiguienteAccionConverted`, `trackPhaseTeaserTabClicked`, `trackPhaseTeaserOverride` | 1h |
| **AUD.A.4** | PostHog no instrumentado en Focus Block — cubierto por V11.V2.1 | con V11.V2.1 |

### Seguridad
| ID | Qué | Timebox |
|---|---|---|
| **I5.4** | `SUPABASE_ANON_KEY` hardcodeada en `StripeIntegration.tsx` y otros. Mover a `import.meta.env` o usar `supabase.functions.invoke()` nativo | 2h |

### Fixes de schema de BD (prerequisitos bloqueantes)
| ID | Qué | Timebox |
|---|---|---|
| **D2.V2.1** | `ALTER TABLE tasks ADD COLUMN external_provider TEXT, external_id TEXT, external_sync_at TIMESTAMPTZ` — prerequisito para distinguir tareas de Asana de tareas manuales | 1h |
| **D2.V2.2** | `ALTER TABLE obvs ADD COLUMN source TEXT DEFAULT 'internal'` + índice `idx_obvs_source` — prerequisito para CRM híbrido HubSpot + OBVs manuales | 1h |
| **I15.V2.1** | Añadir `'meeting_intelligence'` al enum de providers en `integration_connections` — prerequisito para que F18 use infraestructura I15 | 1h |

### Fixes de engine/triggers (prerequisitos de FASE 19)
| ID | Qué | Timebox |
|---|---|---|
| **E4.V2.1** | SQL RPC `get_project_task_stats(project_id UUID)` → `{ overdue_count, done_this_week, total_open }` — usado por `buildNextAction()` para detectar ≥3 overdue | 2h |
| **E4.V2.2** | Trigger `trg_task_feedback_engine` — tarea `status='done'` + `resultado IS NOT NULL` → `run_phase_engine('task_completed_with_feedback')`. Task Loop no propaga señal sin esto | 2h |

### Fixes de Optimus pre-usuarios
| ID | Qué | Timebox |
|---|---|---|
| **O4.4** | `ritual-optimus`: añadir rate limit (ciclo completado en ≤7d → `already_completed_this_week`) + wrap `JSON.parse` en try-catch | 1–2h |
| **O4.3** | `ai-business-advisor`: `LIMIT 20` en historial + ventana deslizante | 1h |
| **AUD.B.1** | Outputs de Optimus sin validación de schema en runtime — añadir Zod parse del LLM output en `ritual-optimus` y `ai-business-advisor` | 1–2h |

---

## NIVEL 2 — FASE 16 (conseguir usuarios — no construir mientras)

| ID | Qué | Criterio de cierre |
|---|---|---|
| **U16.4** | Conseguir 5–10 founders reales con proyecto real en marcha | 5 onboardings completos (Fase A) |
| **U16.5** | Observar 4 momentos: onboarding drop / FirstSteps click / Focus Block CTR / integración first sync | Datos de cada momento aunque sean de usuarios distintos |
| **U16.6** | Calibración de notificaciones: unread <10%, críticas <2/semana, ningún tipo con ruido >0.6 | Gate sostenido 2 semanas |
| **A16.V2.2** | Focus Block CTR ≥ 40% antes de escalar de 10 a 50+ usuarios | Medir durante U16.4 |

---

## NIVEL 3 — CON PRIMEROS USUARIOS (ejecutar en paralelo con F16)

### Day 1 Experience (crítico para retención)
| ID | Qué | Timebox |
|---|---|---|
| **O5.V2.2** | Empty state Day 1 de alto valor: qué muestra Focus Block + Optimus + dashboard con cero datos. Mock guiado (no demo). CTA contextual según tipo de proyecto | 4–5h |
| **AUD.A.5** | Empty state Day 1 sin demo guiado — mismo ítem que O5.V2.2 | con O5.V2.2 |
| **O5.V2.1** | Guardar `solo_mode: boolean` en `onboarding_data` — evita query extra en `useProjectContext()` | 1h |
| **U6.V2.3** | `DataCompletenessCard` — visible antes de engine scores si `data_completeness_score < 0.7`. Evita que el founder interprete score bajo como "proyecto va mal" en lugar de "pocos datos" | 3h |

### FASE 23 — Motor de Progresión v2 (12 tareas — detalle en TASK_LIST.md)
> **Objetivo:** Unificar user_stage→phase, añadir Phase 0, fast-track para startups existentes, graduación Phase 4→Ciclos.
> **Bloques:** A (Phase 0 + unificación) · B (Fast-track + seedeo) · C (Graduación + regresión) · D (Tests)
> **Tareas clave:**
| ID | Qué | Timebox est. |
|---|---|---|
| **P23.1** | Migración Phase 0: fórmula O0.1/O0.2/O0.3, hard signal 0→1 | 4–6h |
| **P23.2** | Mapeo onboarding_type→phase + campo `entry_mode` (bootcamp/fast_track/cycle_direct) | 3–4h |
| **P23.3** | Unificar user_stage→phase: crear `getPhaseInstructions()`, deprecar legacy | 4–5h |
| **P23.5** | Seedeo datos onboarding "existing" → key_metrics, obvs, project_members | 3–4h |
| **P23.6** | Fast-track + gate duro ciclo directo (4 condiciones obligatorias) | 3–4h |
| **P23.8** | Graduación: phase4_score ≥75 sostenido 28 días → graduated=true | 2–3h |
| **P23.10** | Regresión ciclos→fases: si score < 50 por 2 semanas → graduated=false | 2–3h |

### FASE 24 — Visibilidad de Progresión y Metodología (10 tareas — detalle en TASK_LIST.md)
> **Objetivo:** El usuario entiende dónde está, por qué, y qué hacer para avanzar. Metodología visible.
> **Tareas clave:**
| ID | Qué | Timebox est. |
|---|---|---|
| **V24.1** | `PhaseRoadmap`: mapa visual fases 0-4, fase actual resaltada | 3–4h |
| **V24.2** | `PhaseExplainer`: "Estás en Fase 1 porque llevas N/10 entrevistas" | 2–3h |
| **V24.3** | `PhaseUnlockChecklist`: checklist de hard signals para avanzar | 2–3h |
| **V24.5** | Tareas taggeadas con `phase_impact` → badge en KanbanCard | 2–3h |
| **V24.7** | Metodología automática por fase (Lean Startup → Scaling Up → OKR) | 2–3h |

### FASE 26 — Sistema de Equipo v2 (14 tareas — detalle en TASK_LIST.md)
> **Objetivo:** Invitación por enlace, mini-onboarding de rol, dashboard y tareas por rol, guía de hiring.
> **Tareas clave:**
| ID | Qué | Timebox est. |
|---|---|---|
| **EQ26.1** | Tabla `project_invitations` con token criptográfico + expiración | 2–3h |
| **EQ26.2** | UI generación enlace: selector rol, copiar enlace, revocar | 3–4h |
| **EQ26.3** | Ruta `/invite/:token` — landing pública + aceptación | 4–5h |
| **EQ26.4** | Mini-onboarding 4 pantallas: Bienvenida→Perfil→Responsabilidades→Primera misión | 5–6h |
| **EQ26.7** | Dashboard filtrado por rol (métricas de área) | 4–5h |
| **EQ26.8** | Permisos por rol: hook `useRolePermissions` + matriz fundador/sales/mkt/ops/fin/tech | 3–4h |
| **EQ26.11** | Edge fn `generate-hiring-guidance`: salary, equity, canales, preguntas | 3–4h |

### FASE 27 — Proactive Intelligence (antes "FASE 23" del plan agentes)
> **Objetivo:** El sistema detecta cuándo el founder necesita actuar sin que lo pida.
| ID | Qué | Timebox |
|---|---|---|
| **PI27.1** | SQL `detect_signal_convergence()` — ≥3 señales activas = momento detectado | 3h |
| **PI27.2** | Trigger AFTER INSERT en `project_phase_state` → evalúa convergencia | 1h |
| **PI27.3** | `MomentDetectorBanner.tsx` — banner encima de todo + Optimus pre-cargado | 2h |
| **PI27.4** | SQL `compute_runway_to_next_phase()` → weeks + top 2 blockers | 4–6h |
| **PI27.5** | `RunwayEstimate.tsx` — "~N semanas · Blockers: [X, Y]" | 2h |
| **PI27.6** | Notificación `type='moment_detected'` integrada en sistema N7 | 1h |
| **PI27.7** | Cron diario `trigger-moment-detection` edge function | 1h |

### Señal Explainer — transparencia del engine (diferencial inmediato)
| ID | Qué | Timebox |
|---|---|---|
| **U3.3** | Botón "¿Por qué?" junto a cada Next Action y score. Muestra signals exactas con valores reales | 3–4h |
| **U6.V2.4** | `InputAuditModal` — tabla `Input / Valor / Fuente / Recogido / Confianza / [Actualizar]` activada desde ⓘ en cada score | 3h |
| **N7.V2.4** | Campo `root_cause_inputs JSONB` en `notifications` + modal "¿Por qué recibí esta notificación?" | 2–3h |
| **AUD.M.10** | Datos de onboarding no fluyen a engines para contextualización — incluir `onboarding_data` relevante en el prompt | 2h |

### Arquitectura cerrada F17+F18+F19 (tesis del sistema)
| ID | Qué | Timebox |
|---|---|---|
| **ARQ.1** | Documento `CLOSED_LOOP_DESIGN.md` + `ClosedLoopWidget.tsx` + copy onboarding Day 1 explicando el loop Task→Evidence→Meeting→NextAction | 6h |
| **T17.V2.3** | Meeting insights usan `EvidenceType`: combined_reliability >0.8=`observed`, 0.6–0.8=`declared`, 0.4–0.6=`inferred`, <0.4=`estimated` | 2h |
| **EC13.V2.2** | Revenue weight: reemplazar multiplicador ×0.7 por `SOURCE_WEIGHTS` por `evidence_type` | 2h |
| **F19.V2.1** | Focus Block nota cuando `reliability_score < 0.5`: "⚠ Señal basada en estimación" | 2h |
| **F19.V2.2** | Task Loop escala a Meeting Intelligence cuando misma tarea ≥30 días sin completar (solo si `mode='team'`) | 2h |

### Optimus feedback real (prerequisito de personalización)
| ID | Qué | Timebox |
|---|---|---|
| **O4.1** | Tabla `optimus_feedback` + RPC `submit_optimus_feedback()`. Conectar `OptimusFeedback.tsx`. Anti-spam 1 voto/bloque/sesión | 2–3h |
| **P8.V2.1** | `behavioral_block` activado via Meeting Intelligence: ≥2 blocker insights del mismo tipo en 4 semanas | 2h |
| **P8.V2.2** | Añadir `recent_decisions_from_meetings` al context packet de Optimus | 2h |

### F20 Análisis Estratégico — reformular ANTES de seguir construyendo
| ID | Qué | Timebox |
|---|---|---|
| **F20** | Reformular prompts de `analyze-project-v4` con datos reales obligatorios. ⛔ No construir F20.1–12 hasta verificado con datos reales | 3–4h |
| **F20.V2.5** | Calibración prompt datos escasos | con F16 datos |
| **F20.1–F20.12** | Construir F20 completo (migración + edge fn + hooks + UI + rate limit) | ~22h |
| **F20.V2.3** | Conectar Focus Block con urgent_decisions de F20 | 2h |
| **F20.V2.4** | Guardar `additional_context` en caché | 1h |

### UX fixes estructurales
| ID | Qué | Timebox |
|---|---|---|
| **U3.1** | Split `ProjectEnginePanel.tsx` (685L) en 5 sub-componentes orquestados | 4–5h |
| **U3.2** | `WeeklySurface`: eliminar bloque "foco" duplicado | 1–2h |
| **U6.V2.1** | `ReentrySurface` → integrar `NextActionFocusBlock` en primer lugar | 2h |
| **U6.V2.2** | `WeeklySurface` → sección "Foco próxima semana" al final | 2h |
| **U3.5** | Phase 4 null Next Action — añadir caso `phase===4` en `buildNextAction()` | 1–2h |
| **AUD.M.4** | `buildNextAction()` sin gestión de saturación de señales (5+ simultáneas) — cap a 3 máx | 2h |
| **AUD.M.3** | Superficies sin lógica de transición explícita — documentar state machine de `useActiveSurface.ts` | 2h |

### Notificaciones mejoras
| ID | Qué | Timebox |
|---|---|---|
| **N7.V2.1** | Nuevo tipo `overdue_tasks_warning` — HIGH priority, dedup 3 días | 2h |
| **N7.V2.3** | Tab "Relevante a mi fase" en `NotificationsView` | 2h |
| **SR10.V2.1** | Tras completar ritual → invalidar React Query key del Focus Block | 1h |

### Engine fixes matemáticos
| ID | Qué | Timebox |
|---|---|---|
| **E1.1** | Phase-Probability primer ciclo frío: usar `base_velocity_from_task_count` en lugar de 0 | 2–3h |
| **E1.2** | O3.3 cap solo founders: si `solo_mode=true` → cap sube de 60 a 85 | 2h |
| **E1.3** | Viability T3 benchmark `confidence<60` → peso al 50% + flag `low_benchmark_confidence=true` | 2–3h |
| **E2.4** | Economic incoherences visibles: `ModelIncoherenceAlert.tsx` en "Mi Modelo" | 2–3h |

### Founder Toolkit — arreglar antes de crecer
| ID | Qué | Timebox |
|---|---|---|
| **F21** | Inyectar `{ current_phase, phase_score, top_risk_driver, recent_obvs_count, mrr_if_available, sector }` en los 4 tools genéricos. ⛔ No añadir tools nuevos hasta esto resuelto | 4h |
| **AUD.M.8** | Toolkit sin herramientas para Fase 3+ — planificar 3 tools nuevos post-validación | planificar |
| **AUD.B.9** | Toolkit sin re-use de contexto anterior — si generó Buyer Persona, el siguiente tool lo usa | 2h |
| **AUD.M.6** | Feedback loop: outputs del Toolkit deben poder convertirse en tareas | 2h |

### Meeting Intelligence gaps
| ID | Qué | Timebox |
|---|---|---|
| **F18.A** | Auto-trigger: transcripción completada → notificación automática | 3h |
| **F18.B** | `combined_reliability` spec matemática en `ENGINE_SPEC_V1.md` | 2h |
| **F18.C** | `combined_reliability` visible en `MeetingInsightsReview.tsx` | 2h |
| **AUD.M.5** | Pre-meeting brief es stub no funcional — implementar o eliminar | 3h |
| **AUD.M.11** | Meeting blocker recurrente vs agudo tratados igual — diferenciar | 2h |
| **AUD.C.3** | Meeting Intelligence genera insights pero NO escribe al motor | 3h |

---

## NIVEL 4 — POST-VALIDACIÓN (≥10 usuarios, datos reales de F16)

### FASE 25 — Ciclos Estratégicos (13 tareas — detalle en TASK_LIST.md)
> **Objetivo:** Después de completar fases 0-4 (bootcamp), la app genera ciclos de 90 días infinitos.
> **Tareas clave:**
| ID | Qué | Timebox est. |
|---|---|---|
| **CE25.1** | Tabla `strategic_cycles` (score, objectives JSONB, status, ends_at) | 2–3h |
| **CE25.2** | Tabla `cycle_objective_progress` + cron semanal | 2–3h |
| **CE25.3** | RPC `compute_cycle_score(cycle_id)` | 2h |
| **CE25.4** | Edge fn `generate-strategic-cycle` (Claude 3.5, 7 fuentes de contexto) | 6–8h |
| **CE25.5** | Ciclo de Estabilización (primer ciclo semi-guiado, 4 ejes fijos) | 4–5h |
| **CE25.9** | `CycleDashboard`: título, días restantes, score, progreso por objetivo | 4–5h |
| **CE25.11** | Integración con generate-tasks-v2 (instrucciones de ciclo en prompt) | 2–3h |

### FASE 28 — Optimus Personalization (antes "FASE 24" del plan agentes)
> **Objetivo:** Optimus aprende de cada interacción. En 1 mes da consejos distintos a cada founder.
| ID | Qué | Timebox |
|---|---|---|
| **OP28.1** | Tabla `optimus_profile` por founder | 1h |
| **OP28.2** | SQL `compute_optimus_profile()` — agrega últimos 30 feedbacks | 2h |
| **OP28.3** | Cron semanal de actualización de perfil | 1h |
| **OP28.4** | Inyectar perfil en `ritual-optimus` system prompt | 1h |
| **OP28.5** | Inyectar perfil en `ai-business-advisor` | 1h |
| **OP28.6** | `OptimusProfileCard.tsx` — muestra perfil al founder | 1–2h |

### Optimus schema y calidad
| ID | Qué | Timebox |
|---|---|---|
| **O4.5** | Extender schema Zod: añadir `time_to_act`, `prerequisites`, `role` | 2–3h |
| **O4.6** | `ai-task-router`: clarificar `classifyTask()`, Zod output, logging, tests | 2–3h |
| **O4.10** | `block_weeks_active INT` en `strategic_blocks` + trigger de incremento | 2–3h |
| **O4.9** | Evidence Validation Assistant: conflicto score delta < 0.2 → notificación + modal | 3–4h |
| **PL9.V2.1** | `OPTIMUS_PROMPTS.md`: añadir `focus_block_context` cuando `priority='critical'` | 1h |
| **PL9.V2.2** | `BENCHMARKS_V1.md`: task completion rate semanal + meeting-to-action conversion | 1h |
| **AUD.B.2** | Block detection duplicado backend/frontend — unificar | 2h |

### Risk Playbooks y Engine mejoras
| ID | Qué | Timebox |
|---|---|---|
| **E2.2** | `risk-playbooks.ts` + `RiskPlaybookPanel.tsx` — 3 acciones por risk_driver cuando `risk_score>60` | 5–6h |
| **E2.3** | Dynamic Hard Signals by `sales_cycle_type` — thresholds adaptativos enterprise | 4–5h |
| **AUD.B.6** | Viability thresholds T1–T4 sin documentación de criterio — añadir en `ENGINE_SPEC_V1.md` | 2h |
| **AUD.B.10** | `PhaseHorizonHint` sin señal de contratendencia — añadir caso "Avance con riesgo" | 1–2h |

### Especificaciones matemáticas pendientes
| ID | Qué | Timebox |
|---|---|---|
| **F1.V2.1** | Formalizar `combined_reliability` como spec en `ENGINE_SPEC_V1.md` | 2h |
| **F1.V2.2** | Extender spec `evidence_quality_score` con justificación de cada `SOURCE_WEIGHT` | 1h |

### Next Action mejoras
| ID | Qué | Timebox |
|---|---|---|
| **U3.4** | Next Action snooze/reject: tabla `next_action_feedback` + `buildNextAction()` respeta historial | 3–4h |
| **U3.7** | Next Cycle Advisor: edge fn + `NextCycleAdvisorCard.tsx` en `ReentrySurface` | 3–4h |
| **AUD.M.12** | `useProjectContext` no personaliza urgency según complejidad operativa | 2h |

### Onboarding avanzado
| ID | Qué | Timebox |
|---|---|---|
| **O5.V2.3** | Modo Emergencia: 3er path onboarding (⚡ "Tengo un problema urgente") — 4 pantallas, edge fn, 3 tareas | 8–10h |
| **SR10.V2.2** | Pregunta opcional al ritual: "¿Qué decisiones clave tomaste en reuniones?" | 1h |
| **SR10.V2.3** | Decision retrospective loop: 30d post-decisión → "¿Cómo resultó?" | 3–4h |
| **AUD.M.1** | Strategic Reset sin mecanismo de "apuesta fallida" — registrar decisión fallida | 2h |
| **AUD.M.9** | WeeklyReview sin causalidad — "¿Qué causó este cambio?" | 3h |

### UX adicional
| ID | Qué | Timebox |
|---|---|---|
| **EC13.V2.1** | `useProjectContext()` — contar solo miembros con `role_accepted=true` | 1h |
| **U3.6** | Milestone Replay en `ReentrySurface` — hitos del ciclo cerrado | 2–3h |
| **U3.8** | Reentry múltiples ciclos — mostrar últimos 3 con delta | 2h |
| **F19.V2.3** | Test consistencia `PHASE_TAB_CONFIG` ↔ `feature_matrix.md` | 2h |
| **V11.V2.2** | Actualizar `feature_matrix.md` con F17/18/19 features | 1h |
| **AUD.B.8** | Onboarding Fase B sin tracking granular de completitud | 2h |

### Integración Holded + HubSpot deal history
| ID | Qué | Timebox |
|---|---|---|
| **I5.1** | Holded normalizer real: `connect-holded` + `sync-holded` + `holded-financial.ts` | 8–10h |
| **I5.2** | HubSpot deal history: tabla + capturar transiciones + `pipeline_velocity` | 5–6h |
| **I15.V2.2** | Documentar contrato Team Agent I15.81 en `AGENTS_CONTRACT.md` | 1h |
| **C3.V2.1** | Cerrar C3.4: usar `task_completion_rate` de Asana para roles delivery/operations | 3h |

### I15 verificaciones
| ID | Qué | Timebox |
|---|---|---|
| [x] **I5.5** | ~~Anti-spam 15% threshold~~ ✅ Implementado 2026-03-21. Helper `agent-antispam.ts` + 17 tests + 5 servicios actualizados | — |
| **B0B.3** | I15.DEBT.4: `invalidateQueries` silencioso — añadir `onSettled` con `refetch()` fallback | 1–2h |
| **I5.3** | Asana pagination: documentar lógica de cursor explícitamente | 1h |
| **AUD.C.5** | Datos de integraciones no retroalimentan motores — verificar HubSpot y Asana tras B0.1 | con B0.1 |

---

## NIVEL 5 — POST-INTEGRACIONES REALES (≥5 founders con Stripe + HubSpot activos)

### FASE 29 — Execution-to-Revenue Pipeline (antes "FASE 25" del plan agentes)
> **Objetivo:** Correlación directa entre tareas ejecutadas y euros generados. Killer feature #3.
| ID | Qué | Timebox |
|---|---|---|
| **ER29.1** | Tabla `integration_deal_history` (historial transiciones deals HubSpot) | 2h |
| **ER29.2** | Actualizar `sync-hubspot` para capturar transiciones de stage | 3h |
| **ER29.3** | SQL `detect_execution_revenue_correlation()` — Asana→HubSpot→Stripe | 4h |
| **ER29.4** | `integration_insights[type='execution_revenue_correlation']` | 1h |
| **ER29.5** | `ExecutionRevenueCard.tsx` — "Completaste X tareas → 2 deals → €8,500" | 2h |
| **ER29.6** | Integrar correlación en `get_optimus_context()` | 1h |
| **ER29.7** | `SalesAgentService` — añadir `pipeline_velocity` usando deal history | 2h |
| **AUD.A.3** | `analyze-project-v4` debe leer `integration_insights` activos antes de generar | 2h |

### FASE 30 — Financial Intelligence Avanzada (antes "FASE 26" del plan agentes)
> **Objetivo:** Finance Agent emite insights predictivos y preventivos, no solo descriptivos.
| ID | Qué | Timebox |
|---|---|---|
| **FI30.1** | SQL `run_cash_flow_stress_test()` — 3 escenarios | 3h |
| **FI30.2** | `CashFlowStressCard.tsx` — visualización de escenarios | 2h |
| **FI30.3** | SQL `compute_mrr_forecast()` — regresión lineal 8 semanas | 2h |
| **FI30.4** | `MRRForecastCard.tsx` — proyección con banda de confianza | 2h |
| **FI30.5** | SQL `detect_churn_risk()` — Meeting + HubSpot cruzados | 3h |
| **FI30.6** | `ChurnRiskAlert.tsx` | 1h |
| **FI30.7** | Integrar insights predictivos en síntesis Optimus | 2h |

### FASE 31 — Ciclo Intelligence (antes "FASE 27" del plan agentes)
> **Objetivo:** El founder ve la diferencia entre lo que cree que es y lo que los datos dicen que hace.
| ID | Qué | Timebox |
|---|---|---|
| **CI31.1** | Campo `commitments_json JSONB` en `strategic_cycles` | 1h |
| **CI31.2** | UI para capturar compromisos en `ResetSurface` al iniciar ciclo | 2h |
| **CI31.3** | SQL `compute_cycle_delta(cycle_id)` — compromisos vs realidad | 3h |
| **CI31.4** | Tabla `cycle_intelligence` | 1h |
| **CI31.5** | `CycleIntelligenceCard.tsx` en `ReentrySurface` | 2h |
| **CI31.6** | Detección de patrones del founder (≥3 ciclos) | 3h |
| **CI31.7** | Integrar patrones en Optimus como input de personalización | 2h |

### Optimus avanzado
| ID | Qué | Timebox |
|---|---|---|
| **O4.7** | Optimus Advisor Mode: tabla `optimus_decision_log` + últimos 5 en contexto + timeline en UI | 5–6h |
| **O4.8** | Decision Simulation A vs B: edge fn `simulate-decision` + modal | 5–6h |

---

## NIVEL 6 — SISTEMAS AVANZADOS Y POST-ESCALA

### Sistemas avanzados (FASE 12 — post-MVP)
| ID | Qué |
|---|---|
| **A12.1** | Project history/timeline: fases + pivotes + decisiones + hitos |
| **A12.2** | Múltiples proyectos: límites por plan, dashboard resumen |
| **A12.3** | Proyecto pausado: preservar datos, engines pausados |
| **A12.4** | Proyecto archivado: cerrar definitivo, no borrar |
| **A12.5** | Member deletion y redistribución tareas/OBVs |
| **A12.6** | Project graduation state: éxito sostenido 12+ semanas |
| **A12.7** | Iteration Velocity tracking en Weekly Digest |
| **A12.8** | Slack mejorada: Layer 2 y 4 → canales del equipo |
| **AUD.M.7** | F20 Nivel 3 debe incluir plan de acción con pasos concretos |

### Monetización (FASE 14 — post-validación con usuarios reales)
| ID | Qué |
|---|---|
| **M14.1** | Definir tiers: Free / Pro / Business con límites por feature |
| **M14.2** | Plan limits enforcement en backend |
| **M14.3** | `ENABLE_PAYMENTS=true` + configurar Stripe Connect |
| **M14.4** | Upgrade hints en momentos de valor percibido |
| **M14.5** | Onboarding a planes (después del onboarding A, no durante) |
| **M14.V2.1** | `PHASE_TAB_CONFIG` + upgrade hints coordinados |
| **M14.V2.2** | Investor readiness summary: exportable |

### Expansion Intelligence (FASE 22 — post Fase 3+ con MRR estable ≥2 meses)
| ID | Qué |
|---|---|
| **F22.1–F22.9** | Expansion readiness engine + análisis IA + UI completa (9 tareas) |
| **F22.V2.1** | Integrar con Modo Emergencia |
| **F22.V2.2** | Chip "Tu análisis de expansión está desactualizado" |
| **AUD.B.5** | Estimación temporal para mercados secundarios |
| **E2.5** | Cohort Benchmarking — prerequisito ≥50 proyectos activos |

### Cohort Intelligence (post-escala)
| ID | Qué |
|---|---|
| **A12.V2.1** | Benchmarks internos reales con ≥30 proyectos + outcomes |
| **F20.V2.1** | Análisis de posición en cohorte |

### Integraciones futuras
| ID | Qué |
|---|---|
| **I5.6** | Zapier/Make webhook genérico |
| **I5.7** | GitHub Activity como proxy de ejecución técnica |
| **I15.E.CONNECT_UX.oauth** | Stripe Connect OAuth |

---

## RESUMEN DE CONTEO

| Nivel | Ítems | Fases nuevas incluidas | Timebox estimado |
|---|---|---|---|
| 0 — Bugs producción | 6 | — | ~9h |
| 1 — Pre-usuarios | 12 | — | ~15h |
| 2 — FASE 16 activa | 4 | — | semanas/meses |
| 3 — Con primeros usuarios | ~100 | F23 (12) + F24 (10) + F26 (14) + F27 (7) | ~200–250h |
| 4 — Post-validación | ~55 | F25 (13) + F28 (6) | ~130–160h |
| 5 — Post-integraciones | ~25 | F29 (8) + F30 (7) + F31 (7) | ~60–75h |
| 6 — Post-escala | ~40 | — | ~120–150h |
| **TOTAL** | **~242 ítems** | **9 fases nuevas (23-31)** | **~550–670h** |

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
AHORA:
  B0.2 (30min) → B0.3 (2h) → B0.1 (3-4h)

ANTES DE USUARIOS:
  I5.4 (seguridad) → O4.4 + O4.3 (Optimus fixes) → AUD.B.1 (Zod)

FASE 16 ACTIVA:
  U16.4 (conseguir 5-10 founders)

CON PRIMEROS USUARIOS (en paralelo):
  FASE 23 (Motor Progresión v2) ← PRIMERO, fundacional
    ├→ FASE 24 (Visibilidad + Metodología)
    ├→ FASE 26 (Equipo v2)
    └→ FASE 27 (Proactive Intelligence)
  + Day 1 XP (O5.V2.2) + Señal Explainer (U3.3) + F20 prompts

POST-VALIDACIÓN (≥10 usuarios):
  FASE 25 (Ciclos Estratégicos) ← necesita graduados
  FASE 28 (Optimus Personalization)
  + Risk Playbooks + Engine fixes + Onboarding avanzado

POST-INTEGRACIONES (≥5 con Stripe+HubSpot):
  FASE 29 (Execution-to-Revenue)
  FASE 30 (Financial Intelligence)
  FASE 31 (Ciclo Intelligence)

POST-ESCALA:
  FASE 12 + FASE 14 + FASE 22 + Cohort
```

---

## REGLAS DE DESARROLLO (no negociables)

1. ⛔ **No construir F20.1–12 hasta que F20 (prompts con constraints) esté verificado con datos reales.**
2. ⛔ **No añadir tools nuevos al Founder Toolkit hasta que los 4 genéricos tengan contexto de fase.**
3. ⛔ **No escalar usuarios (>10) hasta que Focus Block CTR ≥ 40% (A16.V2.2).**
4. ⛔ **No activar emails masivos hasta que calibración N7 pase los 5 gates (U16.6).**
5. ⛔ **No implementar F22/F29/F30/F31 sin los datos reales que los prerequisitos exigen.**
6. ⛔ **No entrar a ciclo directo sin gate duro (4 condiciones, P23.6). Startups frágiles van a fases, no a ciclos.**
7. ✅ **FASE 16 no se cierra hasta tener señal real de 4 momentos críticos de usuario.**
8. ✅ **FASE 23 es fundacional — Fases 24, 25, 26, 27 dependen de ella.**

---

*Creado: 2026-03-20. Consolidado: 2026-03-21.*
*Fuentes: PLAN_MEJORAS_ANALISIS_2026.md (análisis multi-agente) + TASK_LIST.md Fases 23-26 (Motor Progresión + Visibilidad + Ciclos + Equipo)*
*I5.5 (anti-spam 15%) completado 2026-03-21 — helper agent-antispam.ts + 17 tests + 5 servicios*
