# TASK LIST — Nova Hub (Optimus-K)
> Lista completa de todas las tareas pendientes, ordenadas por fases de ejecución.
> Para detalle de cada tarea → ver MASTER_ACTION_PLAN.md
> Estado: [ ] Pendiente · [x] Completado · [~] En progreso · [!] Bloqueado

---

## FASE 1 — MATEMÁTICA Y FUNDAMENTOS
> Completar antes de tocar cualquier código. Si cambias fórmulas después de crear tablas, migras todo.

### Fórmulas y definiciones
- [x] **F1.1** Cerrar la fórmula definitiva de Iteration Velocity (ventana, inputs, normalización)
- [x] **F1.2** Definir evidence_quality_score (escala, tipos de evidencia, pesos)
- [x] **F1.3** Resolver capacidad del solo founder (baseline 120 unidades o umbrales diferentes)
- [x] **F1.4** Decidir estrategia Day 1 Probability (opción A/B/C/D — cuál se implementa)
- [x] **F1.5** Definir thresholds de Fase 1 (igual nivel de detalle que Fase 2 — ya está en plan)
- [x] **F1.6** Definir thresholds de Fase 3 (igual nivel de detalle que Fase 2)
- [x] **F1.7** Definir thresholds de Fase 4 (igual nivel de detalle que Fase 2)
- [x] **F1.8** Confirmar OBV types necesarios en schema (customer_discovery, revenue_validation, etc.)
- [x] **F1.9** Decidir fuente de Benchmarks v1 (Opción A curado / B interno / C híbrido)

### Ajustes al plan (recomendación ChatGPT)
- [x] **F1.10** Suavizar Viability Engine: en v1 NO bloquear tareas — solo recomendar y registrar
- [x] **F1.11** Simplificar Function Coverage v1: cobertura manual + penalización simple (sin role emergence automático)
- [x] **F1.12** Añadir campo `engine_version TEXT` a las tablas de motores (para trackear cambios de fórmula)
- [x] **F1.13** Definir data_completeness_score (5 dimensiones, umbrales, efecto en sistema)

---

## FASE 2 — BASE DE DATOS
> Solo cuando Fase 1 está cerrada y congelada.

### Nuevas tablas
- [x] **D2.1** Crear tabla `project_phase_state` (+ campo engine_version) + `project_phase_history`
- [x] **D2.2** Crear tabla `project_probability` (+ campo engine_version)
- [x] **D2.3** Crear tabla `project_probability_history`
- [x] **D2.4** Crear tabla `project_viability_state` (+ campo engine_version)
- [x] **D2.5** Crear tabla `project_economic_profile`
- [x] **D2.6** Crear tabla `project_economic_profile_history`
- [x] **D2.7** Crear tabla `project_risk_score` (+ project_risk_score_history)
- [x] **D2.8** Crear tabla `project_function_coverage`
- [x] **D2.9** Crear tabla `decision_events`
- [x] **D2.10** Crear tabla `strategic_blocks`
- [x] **D2.11** Crear tabla `project_protocols`
- [x] **D2.12** Crear tabla `strategic_cycles`
- [x] **D2.13** Crear tabla `benchmarks`

### Nuevas tablas adicionales (añadidas en Fase 1)
- [x] **D2.20** Crear tabla `strategic_model_versions` (pivot tracking computable)
  - Campos: project_id, version_number, segment_text, problem_text, value_prop_text, changed_fields JSONB, created_at, created_by
  - Un pivot_event = nuevo record con changed_fields incluyendo segment/problem/value_prop

### Modificaciones a tablas existentes
- [x] **D2.14** `ALTER TABLE tasks ADD COLUMN leader_id UUID`
- [x] **D2.15** `ALTER TABLE projects ADD COLUMN country, market_scope, cluster`
- [x] **D2.16** `ALTER TABLE project_members ADD COLUMN performance_score_v2`
- [x] **D2.17** Auditar y añadir OBV types necesarios al ENUM `obv_type` + campos auto-tipo F1.8
- [x] **D2.18** `ALTER TABLE project_roles ADD COLUMN maps_to_specialization`

### Tablas de Fase 1 no incluidas anteriormente
- [x] **D2.21** Crear tabla `engine_versions` (FK desde tablas históricas — F1.12)
- [x] **D2.22** Crear tabla `project_strategy_current` (fuente de segment/problem/value_prop — F1.13)
- [x] **D2.23** Crear tabla `project_functions` (3 funciones fijas por proyecto — F1.11) + trigger trg_create_project_functions
- [x] **D2.24** Crear tabla `process_artifacts` (procesos documentados por función — F1.11)
- [x] **D2.25** Crear tabla `viability_events` (triggers del Viability Engine + FK opcional a decision_events — F1.10)

### Matemática Risk Score (mini Fase R1 — debe cerrarse antes de implementar D2.7)
- [x] **R1.1** Definir RunwayFactor (cálculo, mínimo 2 meses, mapping a escala 0–100)
- [x] **R1.2** Definir ExecutionDrop (ventana + baseline)
- [x] **R1.3** Definir ValidationWeakness (mapping desde validation_strength a riesgo)
- [x] **R1.4** Definir RevenueConcentration (fuente de datos, cálculo)
- [x] **R1.5** Definir BottleneckSeverity (agregación desde critical_blocks)

### RLS policies
- [x] **D2.19** Añadir RLS policies a todas las tablas nuevas (4 patrones + 3 helper functions)

---

## FASE 3 — FIXES DE CÓDIGO EXISTENTE (deuda técnica real)
> Bugs confirmados por auditoría. No requieren Fase 1 ni 2 para empezar.

- [ ] **C3.1** Fix `InviteMemberWizard.tsx` — reemplazar `setTimeout` falso por mutación real a DB
- [ ] **C3.2** Conectar selección de rol del wizard → guardar en `project_members.role`
- [ ] **C3.3** Unificar los 2 sistemas de roles (`project_roles` ↔ `project_members.role`)
- [ ] **C3.4** Fix `calculate_role_performance_score` — implementar las 6 fórmulas por rol (no genérica)
- [ ] **C3.5** Añadir campo `leader_id` al formulario de creación/edición de tareas
- [ ] **C3.6** Validar leader ≠ executor en task creation (enforced en frontend y backend)

---

## FASE 4 — ENGINES BACKEND (núcleo invisible)
> Requiere Fase 1 (matemática) + Fase 2 (DB) completadas.

### Phase Engine
- [x] **E4.1** Crear edge function `compute-phase-score` — implementado como función SQL `run_phase_engine` (migrations 00004/00022)
- [x] **E4.2** Implementar calculador Fase 1 (Descubrimiento) con thresholds
- [x] **E4.3** Implementar calculador Fase 2 (Validación) con thresholds
- [x] **E4.4** Implementar calculador Fase 3 (Operación) con thresholds
- [x] **E4.5** Implementar calculador Fase 4 (Escala) con thresholds
- [x] **E4.6** Implementar lógica de avance de fase (score ≥75% + hard signal → propuesta)
- [x] **E4.7** Implementar lógica de regresión de fase (6 semanas < 50% → fase -1) — migration 00022

### Probability Engine
- [x] **E4.8** Crear edge function `compute-probability-score` (5 inputs, pesos) — migration 00007
- [x] **E4.9** Conectar CRM pipeline → revenue_momentum (leads en stage tardío) — migration 00023
- [x] **E4.10** Conectar peer validation de KPIs → validation_strength — CERRADO: implementado en migration 00003 (OBV-based, compute_validation_strength)

### Viability Engine (v1 — solo recomendaciones, sin bloqueos)
- [ ] **E4.11** Crear edge function `evaluate-viability` (3 estados)
- [ ] **E4.12** Implementar cooldown de 30 días post-decisión
- [ ] **E4.13** Implementar las 3 Paths (pivot segmento / pivot valor / pausar)

### Organizational Engine
- [ ] **E4.14** Crear edge function `compute-org-capacity`
- [ ] **E4.15** Implementar detección de bottlenecks por rol
- [ ] **E4.16** Implementar detección de rol crítico vacío por fase

### Economic Profile
- [x] **E4.17** Crear edge function `detect-economic-profile` — migration 00024 (compute conservador: avg_ticket, gross_margin_target, revenue_type + confidence_score)
- [x] **E4.18** Implementar detección de cambio de perfil — migration 00024 (historial por cambios materiales en 7 campos)
- [x] **E4.19** Implementar detección de incoherencia del modelo (4 casos) — migration 00024 (saas_transactional, subscription_no_mrr, high_ticket_no_pipeline, concentrated_scalable)

### Risk Score
- [x] **E4.20** Implementar cálculo de `RiskScore` (5 inputs, 4 niveles) — migration 00008

### Conexiones entre engines
- [x] **E4.21** Conectar role_performance → Phase Score (execution_health 20%) — migration 00006/00007
- [ ] **E4.22** Crear edge function `suggest-bottleneck-challenge`

### Cron jobs
- [x] **E4.23** Configurar cron semanal (domingo 23:00): Phase(00:00) → Probability(00:30) → Risk(01:00) → Viability(01:30) — migrations 00004/00007/00008/00021
- [ ] **E4.24** Configurar triggers on-demand (OBV validado, tarea completada, lead won)

---

## FASE 5 — ONBOARDING Y PRIMERA EXPERIENCIA
> Requiere Fase 4 (engines calculando) para que los resultados tengan sentido.

- [ ] **O5.1** Diseñar y construir onboarding Fase A (10 preguntas obligatorias, 3-4 min)
- [ ] **O5.2** Implementar primera pregunta de entrada ("¿en qué punto estás?") → 3 sub-estados
- [ ] **O5.3** Implementar flujo "sin idea" → generación de 3 ideas con viabilidad desde min 1
- [ ] **O5.4** Adaptar edge function `generate-business-ideas` al nuevo formato (perfil + riesgos + experimento 7 días)
- [ ] **O5.5** Implementar Discovery Path sub-estado "Sin hipótesis" (solo muestra flujo Design Thinking)
- [ ] **O5.6** Implementar Location Layer como campo obligatorio en onboarding
- [ ] **O5.7** Implementar double filter para ideas (Nivel 1 hard filter + Nivel 2 warning)
- [ ] **O5.8** Mostrar "Perfil Operativo Detectado" al terminar onboarding (tarjeta con expectativas)
- [ ] **O5.9** Diseñar y construir post-onboarding first 15 minutos (flujo completo)
- [ ] **O5.10** Construir onboarding Fase B (progresiva, completa en 2 semanas)
- [ ] **O5.11** Construir sección "Mi Modelo" (5 bloques, sección permanente)

---

## FASE 6 — UX CORE (superficies del motor)
> Requiere Fase 4 + Fase 5.

- [ ] **U6.1** Header: implementar 3 indicadores permanentes (Fase %, Probability ●●●○○, Riesgo ●)
- [ ] **U6.2** Phase progress bar (4 fases, fill hasta score actual)
- [ ] **U6.3** Phase Score breakdown view (outcomes + hard signal + próxima acción)
- [ ] **U6.4** Probability breakdown (5 inputs + tendencia vs semana pasada)
- [ ] **U6.5** Risk Score display (punto en header + detalle on demand)
- [ ] **U6.6** Regression UX (experiencia de ir hacia atrás — no punitiva)
- [ ] **U6.7** Viability state banners (amarillo sticky / rojo que no desaparece)
- [ ] **U6.8** Diseñar y construir empty states específicos para cada engine
- [ ] **U6.9** Phase transition UX (confirmación + celebración + preview nueva fase)
- [ ] **U6.10** Build Mode vs Rescue Mode (visual distinto, mismo sistema)
- [ ] **U6.11** Dynamic phase horizon (trayectoria, no deadline fijo)
- [ ] **U6.12** Weekly Review digest UI (in-app + email)
- [ ] **U6.13** Notification center renovado (filtros por layer, prioridad visual, snooze)
- [ ] **U6.14** "Cost of Ignoring" visualization (Trayectoria A vs B)
- [ ] **U6.15** Modo Desbloqueo UX (7 días, 1 objetivo, max 3 tareas)

---

## FASE 7 — NOTIFICACIONES LAYERS 2–5
> Requiere Fase 4 (engines generando outputs).

- [ ] **N7.1** Layer 2: implementar 6 tipos Phase Engine notifications
- [ ] **N7.2** Layer 3: implementar 4 tipos Probability Engine notifications
- [ ] **N7.3** Layer 4: implementar 5 tipos Viability Engine notifications
- [ ] **N7.4** Layer 5: implementar 6 tipos Org Engine notifications (team-only)
- [ ] **N7.5** Implementar hard caps (max 5/día, max 15/semana, snooze 7 días)
- [ ] **N7.6** Implementar email channel para Layer 2 y 4 (phase transitions + viability alerts)

---

## FASE 8 — OPTIMUS (personaje y psicología)
> Puede empezarse en paralelo con Fase 6.

- [ ] **P8.1** Crear documento `OPTIMUS_CHARACTER.md` (carácter, tono, límites, ejemplos)
- [ ] **P8.2** Implementar context packet en todas las conversaciones con Optimus
- [ ] **P8.3** Implementar detección de clarity_block (hipótesis cambia cada semana)
- [ ] **P8.4** Implementar detección de traction_block (actividad alta, outcomes sin moverse)
- [ ] **P8.5** Implementar detección de structural_block (rol crítico vacío + capital + no progress)
- [ ] **P8.6** Implementar detección de behavioral_block (patrón de evitación)
- [ ] **P8.7** Implementar detección de exceso de optimismo (proyecciones > resultados sistemáticamente)
- [ ] **P8.8** Implementar detección de exceso de conservadurismo (score alto, retrasa avance)
- [ ] **P8.9** Implementar escalada de bloqueo (semana 1 suave → semana 3 Modo Desbloqueo)
- [ ] **P8.10** Implementar los 3 Modos de Optimus (Exploración / Estándar / Estricto)
- [ ] **P8.11** Conectar SWOT/Competitors → structural_block detection
- [ ] **P8.12** Implementar Decision Accuracy Index (interno, nunca mostrado al usuario)

---

## FASE 9 — CONTENIDO Y PLAYBOOKS
> Puede hacerse en paralelo con Fase 7 y 8.

- [ ] **T9.1** Crear OPTIMUS_CHARACTER.md con tono, voz, ejemplos buenos/malos
- [ ] **T9.2** Escribir 5 playbooks de Build Mode (Fases 1–4)
- [ ] **T9.3** Escribir 5 playbooks de Rescue Mode
- [ ] **T9.4** Escribir microcopy para todos los estados del motor (saludable/fricción/crítico/regresión)
- [ ] **T9.5** Escribir las 5 preguntas del Strategic Reset Ritual
- [ ] **T9.6** Escribir prompts de Optimus para cada combinación crítica de contexto
- [ ] **T9.7** Construir benchmarks v1 (valores curados por fase + tipo de negocio)
- [ ] **T9.8** Escribir content para Discovery Path (template entrevista, persona canvas, guía 7 días)

---

## FASE 10 — STRATEGIC RESET RITUAL Y CICLOS
> Requiere Fase 4 + Fase 8.

- [ ] **R10.1** Implementar Strategic Reset Ritual (trigger cada 4 semanas)
- [ ] **R10.2** Implementar las 5 preguntas del ritual con Optimus
- [ ] **R10.3** Implementar evaluación del ciclo (🟢 Sólido / 🟠 Inestable / 🔴 Crítico)
- [ ] **R10.4** Crear registro en `strategic_cycles` al completar cada ritual
- [ ] **R10.5** Coordinar Weekly Loop vs Ritual (semana 4 = ritual reemplaza acciones del loop)

---

## FASE 11 — FEATURES POR FASE Y MODO
> Requiere Fase 4 + Fase 5.

- [ ] **V11.1** Auditar las 223 features actuales y clasificar cada una (fase / mode / viability state)
- [ ] **V11.2** Crear `feature_matrix.md` con los 223 items clasificados
- [ ] **V11.3** Implementar sistema de visibilidad de features en frontend (FeatureVisibility config)
- [ ] **V11.4** Implementar teaser UX para features bloqueadas por fase
- [ ] **V11.5** Revisar módulo Analytics: separar lo que engines ya calculan de lo que es propio
- [ ] **V11.6** Implementar Function Coverage v1 (manual + penalización simple)

---

## FASE 12 — SISTEMAS AVANZADOS
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

## FASE 13 — EDGE CASES
> Diseñar respuesta del sistema antes de lanzar.

- [ ] **EC13.1** Usuario no completa el ritual (reagendar, mencionar, no forzar)
- [ ] **EC13.2** Onboarding incompleto (Fase A sin Fase B — sistema funciona parcialmente)
- [ ] **EC13.3** Datos inconsistentes en onboarding (guardar + marcar + Optimus pregunta)
- [ ] **EC13.4** Cambio radical de modelo de negocio (pivot total — archivar ciclo anterior)
- [ ] **EC13.5** Miembro que nunca acepta invitación (expirar en 30 días)
- [ ] **EC13.6** Solo founder en Fase 4 (O4.2 con criterio diferente, Optimus alerta)
- [ ] **EC13.7** Day 1 Probability demotivante (implementar solución elegida en F1.4)
- [ ] **EC13.8** Proyecto sin actividad 60 días (secuencia de emails, no spam)
- [ ] **EC13.9** Datos de revenue no verificables (peso reducido × 0.7 sin evidencia)
- [ ] **EC13.10** Conflicto de ownership de OBV (split 50/50, historial preservado)

---

## FASE 14 — MONETIZACIÓN
> Solo cuando el producto está validado con usuarios reales.

- [ ] **M14.1** Definir tiers de plan (Free / Pro / Business con límites por feature)
- [ ] **M14.2** Implementar plan limits enforcement en backend
- [ ] **M14.3** Activar ENABLE_PAYMENTS = true + configurar Stripe
- [ ] **M14.4** Implementar upgrade hints en momentos de valor percibido
- [ ] **M14.5** Onboarding a planes (después del onboarding A, no durante)

---

## RESUMEN TOTAL

| Fase | Nombre | Tareas | Depende de |
|------|--------|--------|------------|
| 1 | Matemática y fundamentos | 12 | Nada — empezar aquí |
| 2 | Base de datos | 19 | Fase 1 |
| 3 | Fixes de código (bugs reales) | 6 | Nada — puede empezar ya |
| 4 | Engines backend | 24 | Fases 1 + 2 |
| 5 | Onboarding y primera experiencia | 11 | Fase 4 |
| 6 | UX Core | 15 | Fases 4 + 5 |
| 7 | Notificaciones | 6 | Fase 4 |
| 8 | Optimus y psicología | 12 | Fases 4 + 6 |
| 9 | Contenido y playbooks | 8 | Puede empezar ya (trabajo de diseño) |
| 10 | Strategic Reset Ritual | 5 | Fases 4 + 8 |
| 11 | Features por fase | 6 | Fases 4 + 5 |
| 12 | Sistemas avanzados | 8 | Post-MVP |
| 13 | Edge cases | 10 | Antes de lanzar |
| 14 | Monetización | 5 | Producto validado |
| **TOTAL** | | **147** | |

---

## Lo que puedes empezar HOY (sin dependencias)

```
AHORA MISMO (sin esperar nada):
  ├── Fase 1: F1.1 → F1.9   (cerrar matemática — trabajo de diseño puro)
  ├── Fase 3: C3.1 → C3.6   (fixes de código — bugs reales ya auditados)
  └── Fase 9: T9.1 → T9.8   (contenido — trabajo independiente del código)
```

---

*Última actualización: 2026-02-24*
*Para detalle de cada tarea → MASTER_ACTION_PLAN.md*
*Para fórmulas y especificaciones técnicas → ENGINE_DESIGN.md*
