# PLAN STITCH -- DISENAR TODAS LAS PANTALLAS DE LA APP

> Generado: 2026-03-25
> Objetivo: disenar con Stitch MCP absolutamente TODAS las pantallas y rutas de Optimus-K
> Referencia logica: EXPERIENCE_MATRIX.md (que ve cada usuario en cada fase/rol)
> Referencia UX: SUPER_PLAN_UX_DEFINITIVO (107 tareas de codigo)
> Brand: brand_system_definitivo.md (#5CE1E6 cyan, #FF66C4 pink, #000000, #FFFFFF, #7C3AED violeta)
> Fonts: Archivo Black (titulos UPPERCASE), Chau Philomene One (bold/datos), Poppins (body)
> Estilo: Mission Control Editorial -- PostHog meets Linear

---

## INVENTARIO COMPLETO: 84 PANTALLAS EXISTENTES + 20 NUEVAS

### A. STANDALONE PAGES (13 con ruta)

| # | Ruta | Componente | Archivo | Disenar |
|---|---|---|---|---|
| A1 | `/` y `/landing` | LandingPage | src/pages/LandingPage.tsx | SI -- hero + features + pricing + CTA |
| A2 | `/auth` | AuthPage | src/pages/AuthPage.tsx | SI -- login/signup branded dark |
| A3 | `/home` | RootRedirect | src/pages/RootRedirect.tsx | NO (logica pura, sin UI) |
| A4 | `/select-onboarding-type` | SelectOnboardingTypePage | src/pages/SelectOnboardingTypePage.tsx | SI -- 4 cards |
| A5 | `/select-project` | SelectProjectPage | src/pages/SelectProjectPage.tsx | SI -- grid proyectos + fase badge |
| A6 | `/create-first-project` | CreateFirstProjectPage | src/pages/CreateFirstProjectPage.tsx | SI -- formulario centrado |
| A7 | `/onboarding/:projectId` | OnboardingPage | src/pages/OnboardingPage.tsx | SI -- wizard multi-step |
| A8 | `/emergency-onboarding/:projectId` | EmergencyOnboardingPage | src/pages/EmergencyOnboardingPage.tsx | SI -- version rapida <=3min |
| A9 | `/proyecto/:id/deep-setup/*` | DeepSetupPage | src/pages/DeepSetupPage.tsx | SI -- setup avanzado |
| A10 | `/proyecto/:id/primer-inicio` | PrimerInicioPage | src/pages/PrimerInicioPage.tsx | SI -- loop 2 min activacion |
| A11 | `/evidence-test` | EvidenceTestPage | src/pages/EvidenceTestPage.tsx | NO (dev/QA) |
| A12 | `/invite/:token` | InvitePage | src/pages/InvitePage.tsx | SI -- 3 pantallas (proyecto+rol, foco, accion) |
| A13 | `*` (404) | NotFound | src/pages/NotFound.tsx | SI -- branded con logo K |

**Disenar: 11 de 13** (excluir RootRedirect y EvidenceTestPage)

### B. DASHBOARD NESTED VIEWS (26 con ruta)

#### Core (4)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B1 | `` (index) | DashboardView | 15 variantes: 5 fases x 3 roles |
| B2 | `mi-espacio` | MiEspacioView | por rol |
| B3 | `mi-desarrollo` | MiDesarrolloView | phase >= 3 |
| B4 | `mi-modelo` | MiModeloView | phase >= 2 |

#### Crear y validar (3)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B5 | `proyectos` | ProjectsView | -- |
| B6 | `validaciones` | ValidacionesView | -- |
| B7 | `obvs` | OBVCenterView | 5 tabs + empty states |

#### Ejecutar (7)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B8 | `startup-os` | StartupOSView | por fase |
| B9 | `crm` | CRMView | 6 tabs + empty + AI panels |
| B10 | `financiero` | FinancieroView | 3 tabs + forecasts |
| B11 | `meetings` | MeetingIntelligencePage | -- |
| B12 | `meeting-review/:id` | MeetingReviewPage | -- |
| B13 | `analisis-ia` | AIAnalysisPage | 3 niveles |
| B14 | `toolkit` | FounderToolkitPage | cards lock/unlock |

#### Equipo (5)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B15 | `exploration` | ExplorationDashboard | -- |
| B16 | `path-to-master` | PathToMasterPage | -- |
| B17 | `rankings` | RankingsView | tabs por metrica |
| B18 | `masters` | MastersView | -- |
| B19 | `rotacion` | RoleRotationView | -- |

#### Medir (3)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B20 | `kpis` | KPIsView | 3 tabs (LP, BP, CP) |
| B21 | `analytics` | AnalyticsView | 7 tabs |
| B22 | `team-performance` | TeamPerformanceDashboard | -- |

#### Sistema (4)
| # | Sub-ruta | Componente | Variantes |
|---|---|---|---|
| B23 | `settings` | SettingsView | 5 tabs |
| B24 | `integrations` | IntegrationsView | 8 providers + health |
| B25 | `notificaciones` | NotificationsView | -- |
| B26 | `pricing` | PricingPage | 3 tiers |

**Disenar: 26 views**

### C. MODALES Y OVERLAYS (40 pantallas)

#### C1. Onboarding y bienvenida (3)
| # | Componente | Archivo |
|---|---|---|
| C1 | WelcomeModal | src/components/onboarding/WelcomeModal.tsx |
| C2 | FirstActionModal | src/components/onboarding/FirstActionModal.tsx |
| C3 | FastStartWizard | src/components/onboarding/FastStartWizard.tsx |

#### C2. Fase y sistema (3)
| # | Componente | Archivo |
|---|---|---|
| C4 | PhaseTransitionModal | src/components/nova/PhaseTransitionModal.tsx |
| C5 | PhaseTeaserModal | src/components/project/PhaseTeaserModal.tsx |
| C6 | InputAuditModal | src/components/project/InputAuditModal.tsx |

#### C3. Subscripcion (2)
| # | Componente | Archivo |
|---|---|---|
| C7 | PlanSelectionModal | src/components/subscription/PlanSelectionModal.tsx |
| C8 | UpgradePromptModal | src/components/subscription/UpgradePromptModal.tsx |

#### C4. Preview modals -- HowItWorks (21)
| # | Componente |
|---|---|
| C9-C29 | DashboardPreviewModal, AnalyticsPreviewModal, CRMPreviewModal, CaminoMasterPreviewModal, ExplorationDashboardPreviewModal, FinancieroPreviewModal, GenerativeOnboardingPreviewModal, IntegrationsPreviewModal, KPIsPreviewModal, MastersPreviewModal, MiDesarrolloPreviewModal, MiEspacioPreviewModal, NotificationsPreviewModal, OBVCenterPreviewModal, RankingsPreviewModal, RoleRotationPreviewModal, SettingsPreviewModal, TeamPerformancePreviewModal, ValidacionesPreviewModal, OBVPreviewDetail, OBVPreviewList |

> Los preview modals son demostraciones interactivas de cada vista. Se pueden disenar como variantes de las vistas principales.

#### C5. Feature dialogs (19)
| # | Componente | Contexto |
|---|---|---|
| C30 | OBVFormContainer | Wizard 5 steps |
| C31 | LeadDetail | Ficha lead CRM |
| C32 | CreateProjectDialog | Crear proyecto |
| C33 | DeleteProjectDialog | Eliminar proyecto |
| C34 | DeletedProjectsDialog | Restaurar proyectos |
| C35 | InviteMemberWizard | Invitar miembro |
| C36 | InviteLinkDialog | Link invitacion |
| C37 | RolesExplanationModal | Explicar roles |
| C38 | ApplyForMasterDialog | Aplicar master |
| C39 | CreateRotationDialog | Crear rotacion |
| C40 | StartChallengeDialog | Iniciar reto |
| C41 | TaskCompletionDialog | Completar tarea |
| C42 | StartMeetingModal | Iniciar reunion |
| C43 | EvidencePreviewModal | Preview evidencia |
| C44 | PreGenerationModal | Pre-busqueda |
| C45 | StrictModeExitDialog | Salir modo estricto |
| C46 | FeedbackReceivedModal | Feedback recibido |
| C47 | SelfEvaluationModal | Auto-evaluacion |
| C48 | GlobalSearch (Cmd+K) | Busqueda global |

**Disenar: ~30 modales clave** (los delete/confirmation dialogs se resuelven con 1 template)

### D. COMPONENTES NUEVOS PLANIFICADOS (del SUPER_PLAN_UX_DEFINITIVO)

| # | Componente | Tipo | Bloque origen |
|---|---|---|---|
| D1 | MethodologyBadge | header shared | B2 |
| D2 | MethodologyExplainer | modal | B2 |
| D3 | PhaseGraduationAnnouncement | modal | B4 |
| D4 | QuickActionModal | modal | B1 |
| D5 | ImpactFeedback | overlay | B1 |
| D6 | ActionCompletedFeedback | overlay | B1 |
| D7 | TeamInviteBanner | banner | B3 |
| D8 | SourceConflictAlert | warning | B5 |
| D9 | EvidenceReasoningChain | modal | B5 |
| D10 | DailyCheckIn | dashboard component | B9 |
| D11 | WeeklyProgressDigest | banner | B9 |
| D12 | DataQualityNudge | banner | B10 |
| D13 | DataQualityBar | component | B10 |
| D14 | MethodologyGuard/Warning | inline warning | B8 |
| D15 | TaskRewriteSuggestion | inline suggestion | B8 |
| D16 | MethodologyRoleBadge | badge | B8 |
| D17 | ResumenCard | card generico | B3 |
| D18 | ResumenFinanciero | card | B3 |
| D19 | ResumenCRM | card | B3 |
| D20 | InsightConfidenceBadge | badge | B5 |

**Disenar: 20 componentes nuevos**

### E. SIDEBAR (3 variantes)

| # | Variante | Items visibles |
|---|---|---|
| E1 | Phase 0-1 | 4-14 items. Secciones colapsadas. Teasers con lock. |
| E2 | Phase 2-3 | 15-22 items. Badges "NEW" 7 dias. Contadores por seccion. |
| E3 | Phase 4 | 24 items. 4 secciones: Tu proyecto, Crecer, Analizar, Equipo. |

---

## ORDEN DE EJECUCION EN STITCH

### RONDA 1 -- Criticas (disenar ANTES de codear B1-B2-B8)

| # | Pantalla | Por que primero |
|---|---|---|
| S.1 | Dashboard Founder Phase 0 (Zen Mode) | Define la primera impresion. 4 bloques, minimalista. |
| S.2 | Dashboard Founder Phase 1 | El caso mas comun. MethodologyBadge + NextAction hero. |
| S.3 | Dashboard Founder Phase 2-3 | Full analytics + progressive disclosure. |
| S.4 | Dashboard Growth Phase 2 | CRM primary, financial hidden. Valida rol diferenciado. |
| S.5 | Dashboard Operations Phase 3 | Tasks + Financial primary. Valida otro rol. |
| S.6 | Sidebar Phase 1 vs Phase 3 | Contraste minimalista vs expandido. |
| S.7 | LandingPage | Cara publica del producto. Hero + features + pricing. |
| S.8 | OnboardingPage (FastStartWizard) | Flujo critico de activacion. Wizard + Q4 team_mode. |
| S.9 | InvitePage (3 pantallas) | Primer contacto del invitado. Fase + rol + accion. |
| S.10 | QuickActionModal + ImpactFeedback | Loop de 2 min: accion rapida + resultado visible. |
| S.11 | MethodologyExplainer modal | Explicar framework. Core del diferenciador. |
| S.12 | PhaseGraduationAnnouncement | Ceremonia + nueva metodologia + what's new. |

### RONDA 2 -- Todas las vistas principales

| # | Pantallas |
|---|---|
| S.13-S.15 | AuthPage, SelectOnboardingTypePage, PrimerInicioPage |
| S.16-S.18 | SelectProjectPage, CreateFirstProjectPage, NotFound 404 |
| S.19-S.24 | MiEspacioView, MiDesarrolloView, MiModeloView, ProjectsView, ValidacionesView, OBVCenterView |
| S.25-S.31 | StartupOSView, CRMView, FinancieroView, MeetingIntelligencePage, AIAnalysisPage, FounderToolkitPage, MeetingReviewPage |
| S.32-S.36 | ExplorationDashboard, PathToMasterPage, RankingsView, MastersView, RoleRotationView |
| S.37-S.39 | KPIsView, AnalyticsView, TeamPerformanceDashboard |
| S.40-S.43 | SettingsView, IntegrationsView, NotificationsView, PricingPage |

### RONDA 3 -- Modales y dialogs

| # | Pantallas |
|---|---|
| S.44-S.46 | WelcomeModal, FirstActionModal, PhaseTransitionModal |
| S.47-S.48 | PlanSelectionModal, UpgradePromptModal |
| S.49-S.52 | OBVFormContainer (5 steps), LeadDetail, CreateProjectDialog, InviteMemberWizard |
| S.53-S.56 | InviteLinkDialog, StartMeetingModal, TaskCompletionDialog, GlobalSearch |
| S.57-S.60 | RolesExplanationModal, PhaseTeaserModal, DailyCheckIn, DataQualityNudge |

### RONDA 4 -- Componentes nuevos del SUPER_PLAN_UX

| # | Pantallas |
|---|---|
| S.61-S.64 | MethodologyBadge, MethodologyRoleBadge, ActionCompletedFeedback, TeamInviteBanner |
| S.65-S.68 | SourceConflictAlert, EvidenceReasoningChain, InsightConfidenceBadge, DataQualityBar |
| S.69-S.72 | ResumenCard, ResumenFinanciero, ResumenCRM, WeeklyProgressDigest |

### RONDA 5 -- Assets con nano-banana-2

| # | Asset |
|---|---|
| S.73 | Ilustraciones 5 fases (Design Thinking, Customer Discovery, PMF, Unit Economics, Scaling Up) |
| S.74 | Iconos 3 macro-roles (Founder, Growth, Operations) |
| S.75 | Empty state illustrations (5 variantes: sin OBVs, sin leads, sin tareas, sin equipo, sin datos) |
| S.76 | Hero image para landing page |

---

## RESUMEN NUMERICO

| Categoria | Pantallas | Disenar en Stitch |
|---|---|---|
| A. Standalone pages | 13 | 11 |
| B. Dashboard views | 26 | 26 (+ 15 variantes dashboard) |
| C. Modales existentes | 48 | ~30 (template para confirms) |
| D. Componentes nuevos | 20 | 20 |
| E. Sidebar variantes | 3 | 3 |
| F. Assets nano-banana | 4 | 4 |
| **TOTAL** | **114** | **~94 disenos** |

**15 variantes de dashboard** (5 fases x 3 roles) -- la pantalla mas compleja
**5 rondas de ejecucion** -- criticas primero, assets al final
**Referencia obligatoria:** EXPERIENCE_MATRIX.md para saber que bloques/items aparecen en cada variante
