# SUPER PLAN UX DEFINITIVO — 85 TAREAS + 47 PANTALLAS (v2)

> Generado: 2026-03-25 (actualizado con feedback v2)
> Basado en: 9 agentes de auditoria profunda + decisiones de producto aprobadas
> Objetivo: UX 10/10 — cada pantalla, cada fase, cada rol perfectamente adaptado
> Principio: accion inmediata + resultado visible + contexto metodologico
> REGLA CLAVE: TODOS los usuarios ven SIEMPRE fase + metodologia + por que
> REGLA OPERATIVA: La metodologia NO es solo informativa — AFECTA decisiones
> REGLA CALIDAD: Sin datos de calidad, todo el sistema pierde valor

---

## INVENTARIO COMPLETO DE PANTALLAS (47 pantallas a disenar)

### A. STANDALONE (14 pantallas)

| # | Ruta | Componente | Que es | Disenar en Stitch |
|---|---|---|---|---|
| A1 | `/` | LandingPage | Landing publica | SI — hero + features + pricing |
| A2 | `/auth` | AuthPage | Login/Signup | SI — branded dark |
| A3 | `/select-onboarding-type` | SelectOnboardingTypePage | Elegir path | SI — 4 cards |
| A4 | `/onboarding/:id` | FastStartWizard | Onboarding principal | SI — cada step |
| A5 | `/emergency-onboarding/:id` | EmergencyOnboardingPage | Onboarding urgente | SI |
| A6 | `/proyecto/:id/deep-setup/*` | DeepSetupPage | Setup avanzado | SI |
| A7 | `/proyecto/:id/primer-inicio` | PrimerInicioPage | Activacion post-onboarding | SI — loop 2 min |
| A8 | `/select-project` | SelectProjectPage | Selector de proyecto | SI |
| A9 | `/create-first-project` | CreateFirstProjectPage | Crear proyecto | SI |
| A10 | `/invite/:token` | InvitePage | Invitado acepta | SI — 3 pantallas nuevas |
| A11 | `/home` | RootRedirect | Redireccion post-login | NO (logica) |
| A12 | `/evidence-test` | EvidenceTestPage | Testing interno | NO |
| A13 | `/pricing` | PricingPageView | Precios | SI |
| A14 | `*` | NotFound | 404 | SI — branded |

### B. DASHBOARD + VISTAS PRINCIPALES (25 pantallas)

| # | Ruta nested | Vista | Disenar | Variantes por fase/rol |
|---|---|---|---|---|
| B1 | `` (root) | DashboardView | SI | 5 fases x 3 roles = 15 variantes |
| B2 | `mi-espacio` | MiEspacioView | SI | por rol |
| B3 | `mi-desarrollo` | MiDesarrolloView | SI | |
| B4 | `mi-modelo` | MiModeloView | SI | |
| B5 | `proyectos` | ProjectsView | SI | |
| B6 | `validaciones` | ValidacionesView | SI | |
| B7 | `obvs` | OBVCenterView | SI | 5 tabs |
| B8 | `crm` | CRMView | SI | 6 tabs + empty state |
| B9 | `startup-os` | StartupOSView | SI | |
| B10 | `financiero` | FinancieroView | SI | 3 tabs |
| B11 | `meetings` | MeetingIntelligencePage | SI | |
| B12 | `analisis-ia` | AIAnalysisPage | SI | 3 niveles |
| B13 | `toolkit` | FounderToolkitPage | SI | |
| B14 | `exploration` | ExplorationDashboard | SI | |
| B15 | `rankings` | RankingsView | SI | |
| B16 | `masters` | MastersView | SI | |
| B17 | `rotacion` | RoleRotationView | SI | |
| B18 | `kpis` | KPIsView | SI | 3 tabs |
| B19 | `analytics` | AnalyticsView | SI | 7 tabs |
| B20 | `team-performance` | TeamPerformanceDashboard | SI | |
| B21 | `settings` | SettingsView | SI | 5 tabs |
| B22 | `integrations` | IntegrationsView | SI | + health dashboard |
| B23 | `notificaciones` | NotificationsView | SI | |
| B24 | `path-to-master` | PathToMasterPage | SI | |
| B25 | `meeting-review/:id` | MeetingReviewPage | SI | |

### C. MODALES Y OVERLAYS (8 pantallas clave)

| # | Modal | Disenar | Por que |
|---|---|---|---|
| C1 | MethodologyExplainer | SI | NUEVO — explica framework |
| C2 | PhaseGraduationAnnouncement | SI | NUEVO — ceremonia + what's new |
| C3 | QuickActionModal | SI | NUEVO — accion en 1 click |
| C4 | ImpactFeedback | SI | NUEVO — resultado post-accion |
| C5 | TeamInviteBanner | SI | NUEVO — banner ligero equipo |
| C6 | SourceConflictAlert | SI | NUEVO — warning de datos |
| C7 | EvidenceReasoningChain | SI | NUEVO — por que este numero |
| C8 | FirstActionModal | SI | POST-onboarding accion |

**TOTAL: 47 pantallas a disenar (14 standalone + 25 vistas + 8 modales)**
**Dashboard tiene 15 variantes (5 fases x 3 macro-roles)**

---

## DECISIONES DE PRODUCTO APROBADAS

### Metodologia por fase (TODOS los usuarios la ven SIEMPRE)
- F0: Design Thinking — Empatizar + Definir
- F1: Customer Discovery + Problem/Solution Fit (sintesis + pivotar/seguir)
- F2: PMF = Activacion + Retencion (activacion ANTES de retencion)
- F3: Unit Economics Pragmatico (canal funciona/no, margen aprox)
- F4: Scaling Up — Crecimiento estructurado

### Visibilidad metodologica (REGLA ABSOLUTA)
- Fase + metodologia visibles en TODAS las pantallas (header badge)
- Cada tarea lleva badge de metodologia
- Cada OBV explica su proposito dentro del framework
- Invitados ven fase + metodologia en su onboarding
- HowItWorks de cada feature referencia la metodologia

### Roles
- 3 macro-roles UI: Founder/Strategy, Growth (sales+marketing), Operations (ops+finance+tech)
- 6 sub-roles internos: sales, marketing, finance, operations, ai_tech, strategy
- Dashboard: progressive disclosure (profundidad diferente por rol)
- Permisos: founder todo, Growth invita Growth, Operations invita Ops

### Equipo
- team_mode: solo/team/hiring (editable, auto-ajustable)
- Post-onboarding: banner ligero (no bloqueante) si team_mode='team'
- Nudges inteligentes: max 1/48h, priorizados
- team_size_declared + team_members_count (ambos)
- team_mode auto-ajusta: solo→team si invita

### Loop de 2 minutos
- Accion flexible (real o dummy guiado)
- Resultado visible inmediato ("Pipeline ahora: 1 lead")
- Contexto metodologico ("Esto es Customer Discovery")
- Post-accion: "Esto acaba de impactar el proyecto"

---

## BLOQUE 1 — LOOP DE 2 MINUTOS (P0)

### B1.A — Primer loop del founder (5 tareas)

- [ ] **UX.1.1** Redisenar NextActionFocusBlock: incluir contexto metodologico. "Fase 1: Customer Discovery — tu siguiente paso es [accion]". PHASE_METHODOLOGY de engine.ts.
- [ ] **UX.1.2** Crear ActionCompletedFeedback: tras completar accion, mostrar resultado + impacto. "OBV creada. Score +5%." Micro-animacion.
- [ ] **UX.1.3** Redisenar FirstStepsPanel: primera accion micro. F0="Elige problema", F1="Crea OBV rapida", F2="Registra usuario activado".
- [ ] **UX.1.4** Crear QuickActionModal: completar accion SIN navegar. Pre-rellena, 1-2 campos, submit → resultado visible.
- [ ] **UX.1.5** Crear ImpactFeedback: tras accion significativa, mostrar impacto. "Pipeline: 1 lead" / "MRR: X" / "Score: 42% (+5)".

### B1.B — Primer loop del invitado (5 tareas)

- [ ] **UX.1.6** InvitePage pantalla 1: proyecto + macro-rol + fase + metodologia. "Fase 1: Customer Discovery. Validando demanda."
- [ ] **UX.1.7** InvitePage pantalla 2: foco del rol. Growth="pipeline, leads, conversion". Ops="ejecucion, procesos".
- [ ] **UX.1.8** InvitePage pantalla 3: accion flexible. "Anade lead O usa ejemplo" / "Registra ingreso O usa datos demo".
- [ ] **UX.1.9** Post-accion invitado: ImpactFeedback. "Pipeline: 1 lead. Esto impacto el proyecto."
- [ ] **UX.1.10** Redirigir invitado a dashboard adaptado por macro-rol.

---

## BLOQUE 2 — METODOLOGIA VISIBLE PARA TODOS (P0)

### B2.A — UI de metodologia (5 tareas)

- [ ] **UX.2.1** Crear MethodologyBadge: badge en header de TODAS las pantallas. "Lean Startup — Customer Discovery". Click → expande.
- [ ] **UX.2.2** Crear MethodologyExplainer modal: 3 principios + como se traduce en tareas + por que esta metodologia.
- [ ] **UX.2.3** PhaseTransitionModal: al graduar, explicar nueva metodologia. "Pasas a PMF. Foco: activacion + retencion."
- [ ] **UX.2.4** Badge de metodologia en TaskCard y OBVCard: "Customer Discovery" si demand en F1. El usuario entiende POR QUE.
- [ ] **UX.2.5** Actualizar prompt generate-tasks-v2: "Genera tareas de Customer Discovery + Problem/Solution Fit. Incluye sintesis de patterns y decision pivotar/seguir."

### B2.B — Metodologia en onboarding y HowItWorks (3 tareas)

- [ ] **UX.2.6** FaseA completion: explicar metodologia asignada. "Fase 1: Customer Discovery. Validaremos tu hipotesis."
- [ ] **UX.2.7** HowItWorks de CADA feature: seccion "Metodologia" con framework + proposito.
- [ ] **UX.2.8** Crear PHASE_METHODOLOGY_DETAIL: nombre, 3 principios, frameworks (JTBD, Running Lean...), duracion, objetivo.

---

## BLOQUE 3 — EQUIPO Y ROLES (P0-P1)

### B3.A — Team mode en onboarding (4 tareas)

- [ ] **UX.3.1** Q4 FaseA: 3 opciones solo/team/hiring → team_mode. Editable en Settings, auto-ajustable.
- [ ] **UX.3.2** Si team='team': banner ligero post-onboarding "Tu equipo deberia estar aqui. Invitar | Despues".
- [ ] **UX.3.3** Auto-ajustar team_mode: solo→team si invita. Editable en Settings.
- [ ] **UX.3.4** Mantener team_size_declared + team_members_count. Usar ambos en AI context.

### B3.B — Macro-roles UI (4 tareas)

- [ ] **UX.3.5** Crear MACRO_ROLE_CONFIG: 3 macro → 6 sub. UI invitacion muestra macros primero.
- [ ] **UX.3.6** InviteLinkDialog: paso 1=macro-rol, paso 2=sub-especializar opcional.
- [ ] **UX.3.7** InviteMemberWizard: misma logica macro-roles.
- [ ] **UX.3.8** Permisos: founder todo, Growth invita Growth, Operations invita Ops.

### B3.C — Dashboard progressive disclosure (6 tareas)

- [ ] **UX.3.9** Crear useDashboardLayout: lee macro-rol, retorna orden + profundidad por seccion.
- [ ] **UX.3.10** ProjectDashboardTab: Founder=todo, Growth=CRM completo+Financial resumen, Ops=Tasks completo+CRM resumen.
- [ ] **UX.3.11** Crear ResumenCard generico: version compacta de cualquier seccion. 3 metricas + "Ver completo".
- [ ] **UX.3.12** Sidebar filtra por fase + rol combinados (useRolePermissions + SIDEBAR_PHASE_CONFIG).
- [ ] **UX.3.13** MiEspacioView adaptado por rol.
- [ ] **UX.3.14** Crear ResumenFinanciero (para Growth) y ResumenCRM (para Ops).

### B3.D — Nudges inteligentes (3 tareas)

- [ ] **UX.3.15** Rate limiting nudges: max 1/48h, priorizar overload > revenue > fase > tiempo.
- [ ] **UX.3.16** 4 triggers equipo en moment-detector: sobrecarga, primera venta, graduation, tiempo sin equipo.
- [ ] **UX.3.17** TeamRecommendation desde Phase 1 (no solo 2+). Phase 0-1: "Founders con equipo avanzan 40% mas rapido."

---

## BLOQUE 4 — SIDEBAR + NAVEGACION (P1)

- [ ] **UX.4.1** Sidebar 4 secciones colapsables: "Tu proyecto", "Crecer", "Analizar", "Equipo".
- [ ] **UX.4.2** Contador por seccion. Secciones vacias se ocultan.
- [ ] **UX.4.3** PhaseGraduationAnnouncement: "What's New" al avanzar de fase. Nuevas herramientas + nueva metodologia.
- [ ] **UX.4.4** Premium features con icono Lock en sidebar + tooltip "Plan Pro".
- [ ] **UX.4.5** Distinguir teaser (fase) vs lock (plan) visualmente.

---

## BLOQUE 5 — HOWITWORKS + EVIDENCE (P1-P2)

### B5.A — HowItWorks refresh (4 tareas)

- [ ] **UX.5.1** Actualizar 12 HowItWorks stale con features V4/V5.
- [ ] **UX.5.2** Anadir HowItWorks a 3 vistas faltantes (GenerativeOnboarding, MiModelo, StartupOS).
- [ ] **UX.5.3** Seccion "Metodologia" en cada HowItWorks.
- [ ] **UX.5.4** Seccion "Fuentes de datos" mas visible con SourceBadge.

### B5.B — Evidence mejoras (5 tareas)

- [ ] **UX.5.5** EvidenceReasoningChain: "Por que este numero?" Fuente ganadora, score, descartados.
- [ ] **UX.5.6** SourceConflictAlert: warning cuando 2 fuentes divergen >20%.
- [ ] **UX.5.7** InsightConfidenceBadge: badge numerico por insight. Verde/Ambar/Rojo.
- [ ] **UX.5.8** IntegrationHealthDashboard: estado de cada integracion (verde/amarillo/rojo).
- [ ] **UX.5.9** SourcePreferencesPanel mas visible: banner cuando confianza <0.45.

---

## BLOQUE 6 — UX POLISH (P2)

- [ ] **UX.6.1** ModalTemplate estandarizado para los 18 preview modals.
- [ ] **UX.6.2** Zen Mode toggle mas visible (banner top, no boton tiny).
- [ ] **UX.6.3** FirstStepsPanel recuperable (accesible desde Settings si se dismissea).
- [ ] **UX.6.4** Empty states para KPIs, Financiero, Validaciones con CTA + HowItWorks.
- [ ] **UX.6.5** Verificar 5 colores oficiales usados correctamente.
- [ ] **UX.6.6** Crear BRAND_GUIDE.md (5 colores, logo, gradients, fonts, reglas).
- [ ] **UX.6.7** Reemplazar 1px borders en enterprise.css con tonal shifts.

---

## BLOQUE 7 — DISENAR PANTALLAS EN STITCH (P0, antes de codear)

### 7.A — Pantallas criticas (disenar PRIMERO)

- [ ] **UX.7.1** Stitch: Dashboard Founder Phase 0 (Zen Mode) — minimalista, 1 accion
- [ ] **UX.7.2** Stitch: Dashboard Founder Phase 1 — con MethodologyBadge + NextAction
- [ ] **UX.7.3** Stitch: Dashboard Founder Phase 2-3 — full analytics + progressive
- [ ] **UX.7.4** Stitch: Dashboard Growth — CRM completo, financial resumen
- [ ] **UX.7.5** Stitch: Dashboard Operations — Tasks completo, CRM resumen
- [ ] **UX.7.6** Stitch: Onboarding Q4 team_mode (solo/team/hiring)
- [ ] **UX.7.7** Stitch: InvitePage 3 pantallas (proyecto+rol, foco, accion)
- [ ] **UX.7.8** Stitch: QuickActionModal + ImpactFeedback
- [ ] **UX.7.9** Stitch: MethodologyExplainer modal
- [ ] **UX.7.10** Stitch: PhaseGraduationAnnouncement
- [ ] **UX.7.11** Stitch: Sidebar agrupado Phase 1 vs Phase 3
- [ ] **UX.7.12** Stitch: Landing page hero + features + pricing

### 7.B — Todas las vistas (disenar en paralelo con codigo)

- [ ] **UX.7.13** Stitch: AuthPage (login/signup branded)
- [ ] **UX.7.14** Stitch: SelectOnboardingTypePage (4 cards)
- [ ] **UX.7.15** Stitch: CRMView (6 tabs + empty + AI)
- [ ] **UX.7.16** Stitch: FinancieroView (3 tabs + forecasts)
- [ ] **UX.7.17** Stitch: OBVCenterView (5 tabs)
- [ ] **UX.7.18** Stitch: KPIsView (3 KPI types)
- [ ] **UX.7.19** Stitch: AnalyticsView (7 tabs)
- [ ] **UX.7.20** Stitch: SettingsView (5 tabs + ManageSubscription)
- [ ] **UX.7.21** Stitch: IntegrationsView + HealthDashboard
- [ ] **UX.7.22** Stitch: MeetingIntelligencePage
- [ ] **UX.7.23** Stitch: AIAnalysisPage (3 niveles)
- [ ] **UX.7.24** Stitch: FounderToolkitPage
- [ ] **UX.7.25** Stitch: NotFound (404 branded)

### 7.C — Assets con nano-banana-2

- [ ] **UX.7.26** nano-banana: Ilustraciones para 5 fases (Design Thinking, Customer Discovery, PMF, Unit Economics, Scaling Up)
- [ ] **UX.7.27** nano-banana: Iconos para 3 macro-roles (Founder, Growth, Operations)
- [ ] **UX.7.28** nano-banana: Empty state illustrations (5 variantes)
- [ ] **UX.7.29** nano-banana: Hero image para landing

---

## RESUMEN NUMERICO FINAL

| Bloque | Tareas | Prioridad |
|---|---|---|
| B1 — Loop 2 minutos | 10 | P0 |
| B2 — Metodologia visible | 8 | P0 |
| B3 — Equipo y roles | 17 | P0-P1 |
| B4 — Sidebar + navegacion | 5 | P1 |
| B5 — HowItWorks + Evidence | 9 | P1-P2 |
| B6 — UX Polish | 7 | P2 |
| B7 — Disenar pantallas | 29 | P0 (antes de codear) |
| **TOTAL** | **85 tareas** | |

**47 pantallas** a disenar en Stitch
**4 assets** a generar con nano-banana-2
**56 tareas** de codigo
**15 variantes** de dashboard (5 fases x 3 roles)

---

## LOGICA DE EQUIPO DEFINITIVA

```
ONBOARDING FOUNDER:
  Q4: "Como es tu equipo?" → [Solo] [Con equipo] [Buscando]
  Si team → "Cuantos?" + banner ligero post-onboarding
  Si solo → experiencia individual
  Si hiring → nudges inteligentes por comportamiento
  team_mode editable en Settings, auto-ajusta solo→team

INVITACION:
  Founder → macro-rol (Founder/Growth/Operations)
  Opcionalmente → sub-rol (sales/marketing dentro de Growth)
  Growth puede invitar Growth, Ops puede invitar Ops

INVITADO LLEGA:
  P1: proyecto + macro-rol + fase + "Estamos en Customer Discovery"
  P2: foco del rol + herramientas que vera
  P3: accion flexible (real O ejemplo guiado)
  POST: impacto visible "Esto acaba de cambiar el proyecto"
  → Dashboard adaptado por progressive disclosure

DASHBOARD POR ROL:
  Founder: TODO completo
  Growth: CRM completo | Financial resumen | Tasks resumen
  Operations: Tasks completo | CRM resumen | Financial segun sub-rol

NUDGES: max 1/48h, priorizados overload > revenue > fase > tiempo
AUTO-AJUSTE: solo→team si invita
AMBOS: team_size_declared + team_members_count

METODOLOGIA VISIBLE Y OPERATIVA:
  Header badge en TODAS las pantallas
  Tareas con badge de metodologia
  OBVs con proposito dentro del framework
  Invitados ven metodologia en su onboarding
  HowItWorks referencia metodologia
  PhaseGraduation explica nueva metodologia
  BLOQUEADOR SUAVE: frena acciones fuera de fase
  REESCRITURA: sugiere reformular tareas segun metodologia
  PRIORIDAD: ordena tareas por relevancia metodologica

METODOLOGIA x ROL (misma fase, diferente accion):
  Founder F1: "Valida problema"
  Growth F1: "Consigue evidencia de demanda"
  Operations F1: "Facilita ejecucion de entrevistas"
```

---

## BLOQUE 8 — METODOLOGIA OPERATIVA (P0, diferenciador real)

> La metodologia NO es un badge — es un SISTEMA que afecta decisiones.

### B8.A — Bloqueador suave de acciones incorrectas (3 tareas)

- [ ] **UX.8.1** Crear MethodologyGuard: cuando usuario crea tarea/OBV que no encaja con la fase, mostrar warning suave. Ej F1 usuario crea "desarrollar producto" → "Estas en Customer Discovery. Construir ahora puede invalidar aprendizaje. Seguro?" No bloquea, frena.
  > Logica: mapear keywords por fase. F0=explorar/investigar, F1=validar/entrevistar, F2=activar/retener, F3=optimizar/margen, F4=escalar/delegar. Si tarea no matchea → warning.
  > Crear: src/lib/methodology-guard.ts + src/components/shared/MethodologyWarning.tsx

- [ ] **UX.8.2** Integrar MethodologyGuard en TaskForm: SOLO en acciones claramente desalineadas (no saltar siempre). Banner ambar suave, no modal bloqueante. Ej: crear "producto" en F1 → warning. Crear "entrevista" en F1 → nada.
  > FILE: src/components/tasks/TaskForm.tsx

- [ ] **UX.8.3** Integrar MethodologyGuard en OBVForm: al seleccionar tipo, si no encaja con fase, mostrar contexto. F1 + tipo='venta' → "En Customer Discovery, las OBVs de venta son prematuras. Quieres crear una de validacion?"
  > FILE: src/components/nova/obv-form/OBVStep1Type.tsx

### B8.B — Reescritura inteligente de tareas (3 tareas)

- [ ] **UX.8.4** Crear TaskRewriteSuggestion: cuando usuario crea tarea generica ("hacer web", "crear producto"), el sistema sugiere reformulacion alineada con metodologia. "Quieres reformular como validacion? Ej: 'testear landing con 10 usuarios'".
  > Crear: src/components/tasks/TaskRewriteSuggestion.tsx
  > Logica: llamar LLM (Haiku) con titulo + fase + metodologia → devuelve 1-2 sugerencias

- [ ] **UX.8.5** Integrar TaskRewriteSuggestion en TaskForm: tras escribir titulo, si detecta tarea generica, mostrar chip "Reformular segun [Customer Discovery]" con sugerencia.
  > FILE: src/components/tasks/TaskForm.tsx

- [ ] **UX.8.6** Actualizar generate-tasks-v2: las tareas generadas por IA SIEMPRE incluyen referencia a la metodologia. Cada tarea tiene campo `methodology_context`: "Esta tarea es parte de Customer Discovery: validar demanda real antes de construir."
  > FILE: supabase/functions/generate-tasks-v2/index.ts

### B8.C — Prioridad visual por metodologia (2 tareas)

- [ ] **UX.8.7** Ordenar tareas en Kanban por relevancia metodologica: tareas alineadas con la fase actual arriba (verde), tareas de otras fases abajo (gris). Usar PHASE_RELEVANCE de phase-features.ts.
  > FILE: src/components/tasks/ (Kanban view)

- [ ] **UX.8.8** Crear MethodologyRoleBadge: mismo badge de metodologia pero con traduccion por rol. Founder="Valida problema", Growth="Consigue evidencia de demanda", Operations="Facilita entrevistas". Usar PHASE_METHODOLOGY_DETAIL + macro-rol.
  > Crear: extension de MethodologyBadge.tsx

---

## BLOQUE 9 — SEGUNDO LOOP / RETENCION (P0, sin esto no hay D2)

> El primer loop trae al usuario. El segundo loop lo hace VOLVER.

### B9.A — Continuidad dia 2-7 (5 tareas)

- [ ] **UX.9.1** Crear DailyCheckIn component: al volver al dashboard despues de >12h, mostrar pregunta contextual. F0: "Hablaste con alguien sobre tu idea?" F1: "Completaste alguna entrevista?" F2: "Algun usuario se activo?"
  > Crear: src/components/project/DailyCheckIn.tsx
  > Respuestas: Si → registra insight/OBV rapido. No → recordatorio con contexto.

- [ ] **UX.9.2** Si responde "Si" al check-in: formulario rapido para registrar insight. "Que aprendiste?" (1 campo) → crea nota/OBV automaticamente. "Insight registrado. Tu proyecto tiene 3 validaciones."
  > Integrar en DailyCheckIn.tsx

- [ ] **UX.9.3** Si responde "No": mostrar micro-coaching. "Sin validaciones, el analisis pierde fuerza. Hoy intenta [accion especifica segun NextAction]." Con boton directo a la accion.
  > Integrar en DailyCheckIn.tsx

- [ ] **UX.9.4** Crear WeeklyProgressDigest component: cada lunes, mostrar resumen de la semana. "Esta semana: 3 tareas, 1 OBV, score +5%. La semana que viene: [NextAction]." Motivacional pero con datos reales.
  > Crear: src/components/project/WeeklyProgressDigest.tsx
  > Aparece como banner top del dashboard los lunes

- [ ] **UX.9.5** Implementar consistencia tracking (NO gamificacion infantil): "3 dias seguidos registrando evidencia" con tono profesional. Mostrar en MiEspacioView. Sin emojis de fuego, sin "racha". Refuerza consistencia, no competicion.
  > Crear: src/lib/consistency-tracker.ts + display en MiEspacioView

### B9.B — Conexion con fases avanzadas (2 tareas)

- [ ] **UX.9.6** DailyCheckIn adapta preguntas por fase Y rol. Growth F1: "Conseguiste algun lead calificado?" Ops F2: "Se activo algun nuevo usuario?" Finance F3: "Hubo algun cobro esta semana?"
  > Usar PHASE_METHODOLOGY_DETAIL + macro-rol

- [ ] **UX.9.7** Conectar insights del check-in con el phase engine: cada "Si" con insight registrado alimenta el phase_score. El usuario VE que su check-in impacta su progreso. "Tu insight subio el score 2 puntos."
  > Conectar con useMomentDetector + phase scoring

---

## BLOQUE 10 — DATA QUALITY NUDGES (P0-P1, sin datos de calidad todo falla)

> Si el usuario genera datos basura, F29/F30/F31 = ruido.
> Los nudges educan sin bloquear.

### B10.A — Quality checks en creacion (4 tareas)

- [ ] **UX.10.1** Crear DataQualityNudge component: banner informativo (no bloqueante) que aparece cuando detecta datos incompletos. Tono educativo, no punitivo.
  > Crear: src/components/shared/DataQualityNudge.tsx

- [ ] **UX.10.2** Nudge en tareas: "Has creado 5 tareas sin categoria (function_type) → esto reducira la calidad del analisis IA. Quieres categorizarlas ahora?" Con boton "Categorizar".
  > Trigger: tasks sin function_type > 3 en los ultimos 7 dias
  > FILE: ProjectDashboardTab.tsx o TasksView

- [ ] **UX.10.3** Nudge en OBVs: "Esta OBV no tiene resultado (outcome) → no se podra usar para analisis. Quieres completarla?" Con link directo.
  > Trigger: OBV status='draft' sin outcome > 48h
  > FILE: OBVCenterView o dashboard

- [ ] **UX.10.4** Nudge en metricas: "Tu MRR no se actualiza desde hace 3 semanas → las predicciones pierden precision. Actualizar ahora?" Con link a Financial.
  > Trigger: key_metrics.date mas reciente > 21 dias
  > FILE: dashboard o Financial

### B10.B — Quality score visible (3 tareas)

- [ ] **UX.10.5** Crear DataQualityScore: NO mostrar % abstracto. Siempre con explicacion + CTA exacto. "Te faltan categoria en 4 tareas y resultado en 2 OBVs" con botones directos a cada item. Barra visual opcional, pero el texto es lo que importa.
  > Crear: src/lib/data-quality.ts + src/components/project/DataQualityBar.tsx

- [ ] **UX.10.6** Integrar DataQualityScore en AI analysis: cuando el score es bajo (<50%), el analisis IA muestra disclaimer "Analisis basado en datos incompletos. Mejora la calidad para resultados mas precisos." con link a nudges.
  > FILE: AIAnalysisDashboard.tsx

- [ ] **UX.10.7** Quality score impacta confidence: en evidence.ts, anadir data_quality_factor al calculo de confidence. Datos incompletos → confidence baja automaticamente. El usuario VE que completar datos mejora la fiabilidad.
  > FILE: src/lib/evidence.ts (scoring formula)

---

## RESUMEN NUMERICO ACTUALIZADO

| Bloque | Tareas | Prioridad | Impacto |
|---|---|---|---|
| B1 — Loop 2 minutos | 10 | P0 | Retencion D1 |
| B2 — Metodologia visible | 8 | P0 | Credibilidad |
| B3 — Equipo y roles | 17 | P0-P1 | Experiencia diferenciada |
| B4 — Sidebar + navegacion | 5 | P1 | Descubrimiento |
| B5 — HowItWorks + Evidence | 9 | P1-P2 | Transparencia |
| B6 — UX Polish | 7 | P2 | Consistencia |
| B7 — Disenar pantallas Stitch | 29 | P0 | Referencia visual |
| **B8 — Metodologia operativa** | **8** | **P0** | **Diferenciador real** |
| **B9 — Segundo loop / Retencion** | **7** | **P0** | **D2-D7 retention** |
| **B10 — Data quality nudges** | **7** | **P0-P1** | **Calidad del sistema** |
| **TOTAL** | **107 tareas** | | |
