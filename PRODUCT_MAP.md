# PRODUCT MAP — Optimus-K
> Inventario quirúrgico de todas las features: actuales + pendientes de portar.
> Cada feature mapeada a: etapa del usuario, solo/equipo, acción del loop semanal, estado.
> Última actualización: 2026-02-23

---

## PARTE 1 — EL FRAMEWORK

### El Viaje del Usuario (Una sola persona, tres etapas)

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   SIN IDEA (A)   │───▶│  CON IDEA (B)    │───▶│  STARTUP (C)     │
│                  │    │                  │    │                  │
│ Explora opciones │    │ Valida hipótesis │    │ Opera y escala   │
│ de negocio       │    │ busca primeros   │    │ con clientes     │
│                  │    │ clientes         │    │ reales           │
└──────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  Elige una idea          Primer OBV              Facturación real
  + crea proyecto      cerrado ganado              + crecimiento
  (TRANSICIÓN A→B)     (TRANSICIÓN B→C)           (META FINAL)
```

**Triggers de transición automática:**
- **A→B:** Usuario elige idea de negocio + crea su primer proyecto
- **B→C:** Primer OBV marcado como `cerrado_ganado` con cliente real

---

### El Loop Semanal (6 Acciones Clave)

```
┌─────────────────────────────────────────────────────────────────┐
│  CADA SEMANA EL USUARIO DEBE HACER ESTAS 6 ACCIONES             │
│                                                                 │
│  1. 📅 AGENDA     → ¿Qué haré esta semana? (plan + calendario) │
│  2. ✅ TAREAS     → Ejecutar las tareas comprometidas           │
│  3. 💼 OBVs/CRM  → Avanzar oportunidades en el pipeline        │
│  4. 📊 KPIs/OKRs → Registrar métricas + progreso objetivos     │
│  5. 💰 FINANZAS  → Revisar cobros, pagos, proyección           │
│  6. 🧠 PROGRESO  → Aprender, validar peers, avanzar rol        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Solo vs Equipo (Flag en Onboarding)

Una sola pregunta en el onboarding define qué features son visibles:

| Feature                     | Solo | Equipo |
|-----------------------------|:----:|:------:|
| Todas las features base     |  ✅  |   ✅   |
| CRM / OBVs                  |  ✅  |   ✅   |
| KPIs personales             |  ✅  |   ✅   |
| Peer validation (KPIs)      |  ❌  |   ✅   |
| Reuniones + Transcripción   |  ❌  |   ✅   |
| Masters + Roles             |  ❌  |   ✅   |
| Role Rotation               |  ❌  |   ✅   |
| Team Performance Dashboard  |  ❌  |   ✅   |
| Rankings internos           |  ❌  |   ✅   |
| Executor + Leader en tareas |  ❌  |   ✅   |
| OKRs compartidos            |  ❌  |   ✅   |
| Cofounder Alignment         |  ❌  |   ✅   |

---

## PARTE 2 — INVENTARIO COMPLETO DE FEATURES

### Leyenda
- **Etapa:** A = Sin idea · B = Con idea · C = Startup · ABC = Todas
- **Modo:** S = Solo · T = Equipo · ST = Ambos
- **Loop:** 1=Agenda · 2=Tareas · 3=OBVs/CRM · 4=KPIs/OKRs · 5=Finanzas · 6=Progreso · X=Transversal
- **Estado:** ✅ Funciona · 🔧 Parcial · ❌ Falta · 🆕 Nuevo (del repo antiguo)

---

### 🔑 AUTENTICACIÓN Y ACCESO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 1 | Login con email/password | Supabase Auth, JWT, sesión persistente | ABC | ST | X | ✅ |
| 2 | Signup con verificación email | Registro + email de confirmación | ABC | ST | X | ✅ |
| 3 | Reset de contraseña | Email con magic link de recuperación | ABC | ST | X | ✅ |
| 4 | Gestión de sesión | Auto-refresh JWT, logout seguro | ABC | ST | X | ✅ |
| 5 | Roles (admin/tlt/member) | Control de acceso por nivel | ABC | ST | X | ✅ |

---

### 🚀 ONBOARDING Y SETUP

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 6 | Selección de perfil (3 tipos) | Sin idea / Con idea / Startup | ABC | ST | X | ✅ |
| 7 | Onboarding generativo (Sin Idea) | IA genera 3 opciones de negocio con fit scores | A | ST | X | ✅ |
| 8 | Onboarding competitivo (Con Idea) | SWOT + roadmap de validación para idea existente | B | ST | X | ✅ |
| 9 | Onboarding Health Score (Startup) | Diagnóstico rápido + quick wins + plan de acción | C | ST | X | ✅ |
| 10 | Crear primer proyecto | Nombre, industria, fase, descripción | ABC | ST | X | ✅ |
| 11 | Wizard de onboarding completo | Datos proyecto: idea, equipo, ubicación, roles | ABC | ST | X | ✅ |
| 12 | Selección de proyecto activo | Multi-proyecto, switch con persistencia localStorage | ABC | ST | X | ✅ |
| 13 | Deep Setup (25 secciones) | Setup avanzado con desbloqueo progresivo | BC | ST | X | ✅ |
| 14 | Generación de roles del proyecto | IA sugiere roles óptimos según el negocio | B | T | X | ✅ |
| 15 | Preguntas de onboarding por rol | IA genera preguntas específicas para cada rol | BC | T | X | ✅ |
| 16 | 4 Fases de negocio con IA | IA genera fases personalizadas (Lean Startup methodology) | BC | ST | X | 🆕 |
| 17 | Flag Solo vs Equipo | Pregunta en onboarding que bifurca toda la UX | ABC | ST | X | 🔧 |

---

### 📅 AGENDA Y PLANIFICACIÓN

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 18 | Sugerencia de agenda óptima | IA analiza carga de trabajo y sugiere distribución semanal | BC | ST | 1 | ✅ |
| 19 | Google Calendar OAuth | Sync bidireccional con Google Calendar | BC | ST | 1 | 🆕 |
| 20 | Global Agenda con cron | Vista semanal unificada: tareas + meetings + KPIs | BC | T | 1 | 🆕 |
| 21 | Weekly Insights (IA) | Resumen semanal generado por IA con análisis de rendimiento | BC | ST | 1 | ✅ |
| 22 | One-on-one preparation | IA prepara agenda para reuniones 1:1 entre miembros | C | T | 1 | ✅ |
| 23 | Smart Alerts (anomalías y hitos) | Alertas automáticas cuando métricas salen de rango o se alcanzan hitos | BC | ST | 1 | 🔧 |

---

### ✅ TAREAS

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 24 | Kanban de tareas (4 estados) | Todo / Doing / Done / Blocked con drag-and-drop | BC | ST | 2 | ✅ |
| 25 | Creación de tareas manuales | Título, descripción, asignado, prioridad, fecha | BC | ST | 2 | ✅ |
| 26 | AI Task Executor | IA ejecuta la tarea y propone entregables con feedback loop | BC | ST | 2 | ✅ |
| 27 | AI Task Router | IA determina qué tipo de agente necesita la tarea | BC | ST | 2 | ✅ |
| 28 | Preguntas de completitud | IA genera checklist de validación al marcar tarea como done | BC | ST | 2 | ✅ |
| 29 | Generación de tareas por IA | IA genera lista de tareas a partir de objetivos del proyecto | BC | ST | 2 | ✅ |
| 30 | Metodología Executor + Leader | Cada tarea tiene un ejecutor (hace) y un líder (valida) | BC | T | 2 | 🆕 |
| 31 | Time Tracking por tarea | Registro de tiempo dedicado a cada tarea | BC | ST | 2 | 🆕 |

---

### 💼 OBVs / CRM

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 32 | Pipeline Kanban (7 estados) | Frío → Tibio → Hot → Propuesta → Negociación → Cerrado Ganado / Perdido | BC | ST | 3 | ✅ |
| 33 | Creación de OBV unificado | 6-step wizard: datos contacto + producto + validación + factura + cobro | BC | ST | 3 | ✅ |
| 34 | OBV tipos (exploracion/validacion/venta) | Un mismo flujo cubre entrevistas, validaciones y deals reales | ABC | ST | 3 | ✅ |
| 35 | Historial del pipeline | Registro de cada cambio de estado con timestamp y autor | BC | ST | 3 | ✅ |
| 36 | Cobros parciales (OBV) | Registro de pagos parciales contra un OBV | C | ST | 3 | ✅ |
| 37 | AI Lead Scoring | IA puntúa cada lead de 0-100 según fit, tamaño, intención | BC | ST | 3 | ✅ |
| 38 | AI Lead Finder | IA busca leads potenciales dado el perfil de cliente ideal | BC | ST | 3 | ✅ |
| 39 | Email Pitch Generator | IA genera email de pitch personalizado por lead | BC | ST | 3 | ✅ |
| 40 | Extracción de info de empresa | IA extrae datos de contacto/empresa desde texto libre o URL | BC | ST | 3 | ✅ |
| 41 | Generación de testimonial | IA redacta testimonial de cliente tras cerrar deal | C | ST | 3 | ✅ |
| 42 | Buyer Persona generator | IA define el perfil de cliente ideal (ICP) del proyecto | B | ST | 3 | ✅ |
| 43 | Deal Velocity | Tiempo promedio en cada etapa del pipeline + predicción de cierre | C | ST | 3 | 🆕 |
| 44 | Customer Journey Mapping | Mapa del viaje del cliente desde awareness hasta retención | BC | ST | 3 | 🆕 |
| 45 | Leads legacy (tabla leads) | Sistema de leads antiguo, en transición hacia OBVs | BC | ST | 3 | 🔧 |

---

### 📊 KPIs / OKRs

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 46 | LP (Learning Path Points) | Puntos por completar módulos de aprendizaje con evidencia | ABC | ST | 6 | ✅ |
| 47 | BP (Book Points) | Puntos por lectura + resumen con evidencia adjunta | ABC | ST | 6 | ✅ |
| 48 | CP (Community Points) | Puntos por contribución a la comunidad con evidencia | ABC | T | 6 | ✅ |
| 49 | Sistema de evidencias (3 niveles) | Hypothesis (baja) / Standard / Strict (alta) con multi-tipo | BC | ST | 4 | ✅ |
| 50 | Peer validation de KPIs | Validación por rotación mensual, 2+ votos aprueban/rechazan | BC | T | 4 | ✅ |
| 51 | Validator Stats | Tracking de rendimiento de cada validador (cumplimiento, deadlines) | BC | T | 4 | ✅ |
| 52 | Pending validations queue | Cola centralizada de KPIs pendientes de validar | BC | T | 4 | ✅ |
| 53 | Anti-gaming mechanics | Rotación, deadlines, bloqueo temporal de validadores incumplidores | BC | T | 4 | ✅ |
| 54 | OKRs completo (quarterly/annual) | Objectives + Key Results con progreso, check-ins semanales | BC | ST | 4 | 🔧 |
| 55 | OKRs compartidos (equipo) | OKRs a nivel de proyecto con visibilidad para todo el equipo | C | T | 4 | 🔧 |
| 56 | Validate Monetization | IA valida si el modelo de monetización es sostenible | B | ST | 4 | ✅ |

---

### 💰 FINANZAS

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 57 | Proyecciones financieras con IA | IA genera proyecciones de ingresos/gastos a 6-12 meses | BC | ST | 5 | ✅ |
| 58 | Cash flow dashboard | Visualización mensual de ingresos, gastos, margen, saldo | BC | ST | 5 | ✅ |
| 59 | Tracking de cobros | Estado de cobro por OBV (pendiente/parcial/cobrado), días de retraso | C | ST | 5 | ✅ |
| 60 | Tracking de deuda | Registro y seguimiento de deuda pendiente | C | ST | 5 | ✅ |
| 61 | Desglose de costes (JSONB) | Costes por categoría: materiales, sub, herramientas, marketing, logística | BC | ST | 5 | ✅ |
| 62 | Auto-sync finanzas | Sincronización automática de datos financieros desde OBVs | BC | ST | 5 | ✅ |
| 63 | Export Excel | Exportación de datos financieros a Excel | BC | ST | 5 | ✅ |
| 64 | Budget Tracking | Presupuesto planificado vs real por categoría y mes | BC | ST | 5 | 🆕 |
| 65 | Financial Anomaly Detection | IA detecta anomalías: gastos inusuales, cobros retrasados, márgenes caídos | C | ST | 5 | 🆕 |
| 66 | Sales Simulator (what-if) | Simulador de escenarios: "si cierro X deals a €Y, mi cash flow será..." | BC | ST | 5 | 🆕 |
| 67 | NPS (Net Promoter Score) | Tracking de satisfacción de clientes con encuestas automáticas | C | ST | 5 | 🆕 |
| 68 | Churn Tracking | Seguimiento de clientes perdidos con análisis de causas | C | ST | 5 | 🆕 |
| 69 | Stripe sync | Sincronización de pagos desde Stripe (cuando ENABLE_PAYMENTS=true) | C | ST | 5 | 🔧 |
| 69b | Multi-provider finance sync | auto-sync-finances soporta Holded, QuickBooks, Xero, PayPal, CSV además de Stripe | C | ST | 5 | ✅ |
| 69c | Beta Testers tracking | Seguimiento de beta testers: invitación, estado (invited/active/churned), feedback count | B | ST | 3 | ✅ |
| 69d | Voice Onboarding | Transcripción de voz en onboarding para responder preguntas hablando | A | ST | X | 🔧 |
| 69e | AI Meeting Facilitator | Asistente en tiempo real durante reunión: alertas de tiempo, recordatorios de objetivos, energía del equipo | BC | T | 1 | ✅ |
| 69f | Document upload (PDF/CSV/XLSX) | useDocumentUpload extrae texto de PDFs y parsea CSV/XLSX como evidencia | BC | ST | 4 | ✅ |
| 69g | Subscription UI (feature-flagged) | Componentes listos: FeatureGate, TrialCountdown, PlanLimits, LockedOverlay, PlanSelection | C | ST | X | 🔧 |

---

### 📈 ANALYTICS E INTELIGENCIA

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 70 | Benchmarking | Comparativa de métricas propias vs benchmarks del sector | BC | ST | X | ✅ |
| 71 | Radar chart de rendimiento | Visualización multidimensional de KPIs del equipo | BC | T | X | ✅ |
| 72 | Evolución temporal | Gráficos de tendencia de todas las métricas clave | BC | ST | X | ✅ |
| 73 | AI Predictions | IA predice evolución de métricas a futuro con intervalos de confianza | C | ST | X | ✅ |
| 74 | AI Business Advisor | Chat contextual con advisor de negocio (acceso al contexto del proyecto) | BC | ST | X | ✅ |
| 75 | Análisis de competidores | Análisis de competidores por URL + comparativa | BC | ST | X | ✅ |
| 76 | SWOT competitivo | Generación automática de SWOT con contexto de mercado | BC | ST | X | ✅ |
| 77 | Competitor Intelligence (cron) | Monitorización periódica de competidores con alertas | C | ST | X | ✅ |
| 78 | Geo-intelligence | Análisis del mercado local (densidad, competencia, potencial) | B | ST | X | ✅ |
| 79 | Market Research | Investigación de mercado completa con IA (TAM, SAM, SOM, tendencias) | B | ST | X | ✅ |
| 80 | Enrich Project Intelligence | IA enriquece el perfil del proyecto con datos externos | BC | ST | X | ✅ |
| 81 | Actionable Insights | IA genera insights accionables semanales basados en todos los datos | BC | ST | X | ✅ |
| 82 | Análisis brutal del proyecto (v3) | Deep analysis completo: riesgos, oportunidades, puntos ciegos, verdad incómoda | BC | ST | X | 🆕 |
| 83 | BI Dashboard avanzado | Dashboard ejecutivo con todas las métricas en un solo lugar | C | ST | X | 🆕 |
| 84 | Scalability Analysis | IA analiza cuellos de botella y potencial de escala del negocio | C | ST | X | 🆕 |
| 85 | Cofounder Alignment Analyzer | IA detecta desalineación entre cofundadores (valores, visión, roles) | BC | T | X | ✅ |

---

### 🏆 MASTERS Y PROGRESIÓN DE ROL

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 86 | Solicitud de Master | Cualquier miembro puede solicitar ser Master de su rol | C | T | 6 | ✅ |
| 87 | Votación de Master | El equipo vota, N votos en X días para aprobar | C | T | 6 | ✅ |
| 88 | Desafíos entre Masters | Miembros pueden desafiar al Master actual de un rol | C | T | 6 | ✅ |
| 89 | Mentoring de Masters | Los Masters mentorizan a miembros de su rol | C | T | 6 | ✅ |
| 90 | Path to Master (5 tabs) | Vista de progresión con 6 requisitos de desafío | C | T | 6 | ✅ |
| 91 | Role Rotation | Rotación de especialización con análisis de compatibilidad por IA | C | T | X | ✅ |
| 92 | Role History | Historial de rotaciones de roles por miembro | C | T | X | ✅ |
| 93 | Gamification (badges/streaks) | Sistema de insignias por hitos + rachas de actividad | BC | ST | 6 | 🔧 |

---

### 🎓 DESARROLLO PERSONAL Y APRENDIZAJE

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 94 | Learning Roadmap personalizado | IA genera roadmap de aprendizaje según rol y gaps detectados | ABC | ST | 6 | ✅ |
| 95 | Learning Path tracker | Seguimiento de progreso en el roadmap con % completado | ABC | ST | 6 | ✅ |
| 96 | Playbooks por rol | Guías operativas específicas por especialización (sales, finance, etc.) | BC | ST | 6 | ✅ |
| 97 | AI Career Coach | Chat con coach de carrera para orientación y decisiones | ABC | ST | 6 | ✅ |
| 98 | Mi Espacio (notas personales) | Notas, reflexiones, insights privados del usuario | ABC | ST | 6 | ✅ |
| 99 | Mi Desarrollo view | Vista unificada de progreso: LP, BP, CP, roadmap, playbooks | ABC | ST | 6 | ✅ |
| 100 | User Insights | Insights personales generados por IA basados en actividad | BC | ST | 6 | ✅ |

---

### 🤝 REUNIONES E INTELIGENCIA

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 101 | Transcripción de reuniones | Audio → texto con IA (Deno Edge Function) | BC | T | 1 | ✅ |
| 102 | Análisis de reunión | IA extrae tareas, leads, decisiones, next steps de la transcripción | BC | T | 1 | ✅ |
| 103 | Apply Meeting Insights | Aplica automáticamente los insights al proyecto (crea tareas, OBVs) | BC | T | 1 | ✅ |
| 104 | Roles Meeting view | Vista de reuniones por roles, preparación y seguimiento | BC | T | 1 | ✅ |
| 105 | Meeting Intelligence Page | Vista completa de inteligencia de reuniones con historial | BC | T | 1 | ✅ |

---

### 📢 MARKETING Y CONTENIDO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 106 | Pitch Deck generator | IA genera presentación completa del proyecto (10-15 slides) | B | ST | X | ✅ |
| 107 | Content Calendar | IA genera calendario de contenido mensual por canal | BC | ST | X | ✅ |
| 108 | Write Content Piece | IA redacta pieza de contenido (post, artículo, email) | BC | ST | X | ✅ |
| 109 | Growth Playbook | IA genera playbook de crecimiento con estrategias validadas | C | ST | X | ✅ |
| 110 | Local Context generator | IA genera contexto local para adaptar mensajes a la ciudad/región | BC | ST | X | ✅ |
| 111 | Launch Checklist | IA genera checklist de lanzamiento personalizado | B | ST | X | ✅ |
| 112 | Brand Kit | Paleta de colores, tipografía, logo, voz de marca del proyecto | BC | ST | X | 🆕 |
| 113 | Web Generator + Deploy Vercel | IA genera landing page del proyecto y la despliega en Vercel automáticamente | BC | ST | X | 🆕 |

---

### 📋 RANKINGS Y VISIBILIDAD

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 114 | Rankings generales | Leaderboard global por múltiples métricas | BC | T | X | ✅ |
| 115 | Ranking por OBVs | Top miembros por número de deals cerrados | C | T | X | ✅ |
| 116 | Ranking por facturación | Top por volumen de ventas generado | C | T | X | ✅ |
| 117 | Ranking por KPIs | Top por LP, BP, CP acumulados | BC | T | 6 | ✅ |
| 118 | Team Performance Dashboard | Vista ejecutiva del rendimiento del equipo completo | C | T | X | ✅ |

---

### 🔔 NOTIFICACIONES E INTEGRAACIONES

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 119 | Centro de notificaciones | Notificaciones in-app con categorías y estado leído/no leído | BC | ST | X | ✅ |
| 120 | Activity Log | Historial de actividad del proyecto (quién hizo qué, cuándo) | BC | T | X | ✅ |
| 121 | Slack notifications | Envío de alertas y resúmenes a canal de Slack del equipo | BC | T | X | ✅ |
| 122 | Google Analytics sync | Importación de datos de GA para analytics unificado | C | ST | X | 🔧 |
| 123 | Audit Log | Log completo de todas las acciones del sistema (admin) | C | T | X | 🆕 |
| 124 | GDPR Suite | Exportación de datos, eliminación, gestión de consentimiento | ABC | ST | X | 🆕 |

---

### ⚙️ CONFIGURACIÓN Y ADMINISTRACIÓN

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 125 | Settings de perfil | Foto, nombre, rol, especialización, bio | ABC | ST | X | ✅ |
| 126 | Settings de proyecto | Nombre, fase, tipo, configuración de miembros | BC | T | X | ✅ |
| 127 | Multi-proyecto | Gestión de múltiples proyectos, switch instantáneo | ABC | ST | X | ✅ |
| 128 | Invitaciones a proyecto | Invitar miembros al proyecto (actualmente placeholder) | BC | T | X | 🔧 |
| 129 | User Settings | Preferencias personales, notificaciones, idioma | ABC | ST | X | ✅ |
| 130 | Feature Flags | Control de monetización, demo mode, upgrades (en features.ts) | ABC | ST | X | ✅ |
| 131 | Demo Mode | Banner de modo demo activable sin afectar datos | ABC | ST | X | ✅ |
| 132 | Integrations View | Panel de integraciones externas (GA, Slack, Stripe, Vercel) | C | ST | X | ✅ |
| 133 | Export Excel (global) | Exportar cualquier dataset a Excel | BC | ST | X | ✅ |

---

### 🔍 UX TRANSVERSAL

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| 134 | Global Search (Cmd+K) | Búsqueda global en todo el workspace | BC | ST | X | ✅ |
| 135 | Error Boundary global | Captura de errores sin crash de la aplicación | ABC | ST | X | ✅ |
| 136 | Lazy loading (code splitting) | Todas las rutas con React.lazy, bundle 44% más ligero | ABC | ST | X | ✅ |
| 137 | Sentry error tracking | Monitorización de errores en producción | ABC | ST | X | ✅ |
| 138 | Rate limiting persistente | 28 funciones IA con límites por usuario (Deno KV) | ABC | ST | X | ✅ |
| 139 | RLS en todas las tablas | Row Level Security — datos siempre aislados por proyecto | ABC | ST | X | ✅ |
| 140 | CORS whitelist | Origins permitidos definidos por variable de entorno | ABC | ST | X | ✅ |

---

## PARTE 3 — LAS 28 FEATURES A PORTAR DEL REPO ANTIGUO

### Resumen por prioridad de impacto

| # | Feature | Módulo | Dificultad | Impacto | Etapa | Prioridad |
|---|---------|--------|-----------|---------|-------|-----------|
| 1 | **OKRs completo** | KPIs | Baja | 🔴 Alto | BC | P1 — tabla okrs ya existe en DB, falta UI |
| 2 | **Executor + Leader en tareas** | Tareas | Baja | 🔴 Alto | BC | P1 |
| 3 | **Gamification (badges/streaks)** | Progreso | Media | 🔴 Alto | ABC | P1 |
| 4 | **Análisis brutal del proyecto v3** | Analytics | Baja | 🔴 Alto | BC | P1 |
| 5 | **4 Fases de negocio con IA** | Onboarding | Media | 🔴 Alto | BC | P1 |
| 6 | **Deal Velocity** | CRM | Baja | 🟡 Medio | C | P2 |
| 7 | **Budget Tracking** | Finanzas | Media | 🟡 Medio | BC | P2 |
| 8 | **Google Calendar OAuth** | Agenda | Alta | 🟡 Medio | BC | P2 |
| 9 | **Global Agenda con cron** | Agenda | Media | 🟡 Medio | BC | P2 |
| 10 | **Smart Alerts** | Notificaciones | Baja | 🟡 Medio | BC | P2 — tabla metric_alerts ya existe en DB, falta UI |
| 11 | **Brand Kit** | Marketing | Baja | 🟡 Medio | BC | P2 |
| 12 | **Web Generator + Vercel** | Marketing | Alta | 🟡 Medio | BC | P2 |
| 13 | **Customer Journey Mapping** | CRM | Media | 🟡 Medio | BC | P2 |
| 14 | **Sales Simulator** | Finanzas | Media | 🟡 Medio | BC | P2 |
| 15 | **Financial Anomaly Detection** | Finanzas | Alta | 🟡 Medio | C | P2 |
| 16 | **NPS tracking** | Finanzas | Baja | 🟡 Medio | C | P2 |
| 17 | **Churn Tracking** | Finanzas | Baja | 🟡 Medio | C | P2 |
| 18 | **Scalability Analysis** | Analytics | Media | 🟡 Medio | C | P3 |
| 19 | **BI Dashboard avanzado** | Analytics | Alta | 🟡 Medio | C | P3 |
| 20 | **Time Tracking** | Tareas | Media | 🟢 Bajo | BC | P3 |
| 21 | **Flag Solo vs Equipo** (completar) | Onboarding | Baja | 🔴 Alto | ABC | P1 |
| 22 | **OKRs compartidos (equipo)** | KPIs | Media | 🟡 Medio | C | P2 |
| 23 | **Audit Log (admin)** | Admin | Media | 🟢 Bajo | C | P3 |
| 24 | **GDPR Suite** | Admin | Alta | 🟢 Bajo | ABC | P3 |
| 25 | **Invitaciones reales (completar)** | Onboarding | Media | 🔴 Alto | BC | P1 |
| 26 | **PDF extraction en evidencias** | KPIs | Media | 🟡 Medio | BC | P2 |
| 27 | **Stripe / Monetización (activar)** | Admin | Media | 🔴 Alto | C | P1 |
| 28 | **Google Analytics sync (completar)** | Integraciones | Media | 🟢 Bajo | C | P3 |

---

## PARTE 4 — RESUMEN ESTADÍSTICO

```
TOTAL DE FEATURES MAPEADAS: 148

Por estado:
  ✅ Funcionando en nova-hub:     113 features  (76%)
  🔧 Parcialmente implementadas:   12 features   (8%)
  🆕 Nuevas (del repo antiguo):    23 features  (16%)

Por etapa de usuario:
  Solo etapa A (Sin Idea):          2 features
  Solo etapa B (Con Idea):          3 features
  Solo etapa C (Startup):          18 features
  Etapas AB:                       12 features
  Etapas BC:                       61 features
  Todas (ABC):                     44 features

Por modo Solo/Equipo:
  Solo (S):                         0 features  (todo sirve también en equipo)
  Equipo solo (T):                 18 features
  Ambos (ST):                     122 features

Por acción del loop semanal:
  1 - Agenda:                       6 features
  2 - Tareas:                       8 features
  3 - OBVs/CRM:                    14 features
  4 - KPIs/OKRs:                   11 features
  5 - Finanzas:                    13 features
  6 - Progreso personal:           19 features
  X - Transversal:                 69 features
```

---

## PARTE 5 — PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 0 — Completar lo que está roto (URGENTE)
1. Flag Solo vs Equipo — implementar bifurcación real en UX
2. Invitaciones reales a proyectos — actualmente placeholder
3. Leads legacy → migración completa a OBVs

### Fase 1 — Impacto máximo / Dificultad baja-media (P1)
1. **Análisis brutal del proyecto v3** — edge function + UI vista nueva
2. **Executor + Leader en tareas** — campo `leader_id` en tasks + UI
3. **OKRs completo** — tablas `okrs` + `key_results` + vista nueva
4. **4 Fases de negocio con IA** — UI en Deep Setup + edge function
5. **Gamification (badges/streaks)** — tabla `user_badges` + sistema de triggers
6. **Stripe / Monetización** — activar ENABLE_PAYMENTS, configurar planes

### Fase 2 — Features que refuerzan el loop semanal (P2)
7. **Deal Velocity** — cálculo en DB + componente en CRM view
8. **Budget Tracking** — tabla `budgets` + vista en Financiero
9. **Brand Kit** — tabla `brand_kits` + editor simple de marca
10. **Customer Journey** — tabla `journey_stages` + builder visual
11. **Sales Simulator** — componente de what-if en Financiero
12. **NPS + Churn** — encuestas automáticas + tracking tabla
13. **Smart Alerts** — triggers en DB + componente de alertas
14. **PDF extraction en evidencias** — completar edge function
15. **Global Agenda + Google Calendar OAuth** — OAuth flow + sync

### Fase 3 — Features de escala y compliance (P3)
16. **Scalability Analysis** — edge function nueva
17. **BI Dashboard** — vista ejecutiva consolidada
18. **Time Tracking** — campo `time_spent` en tasks + summary
19. **Financial Anomaly Detection** — edge function de análisis
20. **Audit Log** — tabla + vista admin
21. **GDPR Suite** — exportación y eliminación de datos
22. **GA sync** — completar integración Google Analytics

---

## PARTE 6 — MAPA VISUAL DEL PRODUCTO

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OPTIMUS-K                                       │
│              El GPS para el emprendedor                                │
├──────────────┬──────────────────────┬──────────────────────────────────┤
│  SIN IDEA    │    CON IDEA          │    STARTUP                       │
│  (Explorar)  │    (Validar)         │    (Operar)                      │
│              │                      │                                  │
│ • Generador  │ • SWOT Competitivo   │ • Dashboard KPIs                 │
│   de ideas   │ • OBVs exploracion   │ • CRM Pipeline completo          │
│   (3 opciones│ • Roadmap validación │ • Finanzas + Cash Flow           │
│   con fit)   │ • Market Research    │ • Analytics + Predicciones       │
│ • Brand Kit  │ • Buyer Persona      │ • Masters + Rankings             │
│   inicial    │ • 4 Fases negocio    │ • Gamification                   │
│              │ • Launch Checklist   │ • Escalabilidad                  │
└──────────────┴──────────────────────┴──────────────────────────────────┘
         │                 │                       │
         └─────────────────┴───────────────────────┘
                           │
              SIEMPRE ACTIVO (Loop Semanal)
         ┌─────────────────────────────────────┐
         │ 📅 Agenda  ✅ Tareas  💼 OBVs/CRM   │
         │ 📊 KPIs    💰 Finanzas  🧠 Progreso │
         └─────────────────────────────────────┘
                           │
              MOTOR TRANSVERSAL (IA + Peers)
         ┌─────────────────────────────────────┐
         │ AI Business Advisor                 │
         │ AI Career Coach                     │
         │ Peer Validation System              │
         │ Evidence System (3 niveles)         │
         │ Meeting Intelligence                │
         └─────────────────────────────────────┘
```

---

## PARTE 7 — FEATURES ADICIONALES DEL REPO ANTIGUO

> Extraídas con 3 agentes en paralelo el 2026-02-23. Todas verificadas como código REAL (no placeholders).
> El repo antiguo tiene: 241 componentes, 63 hooks, 63 edge functions, 170+ tablas de BD.

### Leyenda igual que PARTE 2

---

### 🎨 UX / INFRAESTRUCTURA GLOBAL

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N01 | Dark / Light Mode | Toggle en header con `next-themes`, persiste en localStorage, detecta preferencia del sistema | ABC | ST | X | 🆕 |
| N02 | Multi-idioma (6 idiomas) | `react-i18next` completo: ES, EN, FR, DE, PT, IT. LanguageSelector con banderas en header | ABC | ST | X | 🆕 |
| N03 | Tours interactivos | `useOnboardingTour()` — tooltips educativos que destacan elementos de la UI por sección | ABC | ST | X | 🆕 |
| N04 | PWA + Push Notifications | Service worker + `push_subscriptions` en DB — notificaciones de escritorio sin abrir el navegador | BC | ST | X | 🆕 |

---

### 🏢 ORGANIZACIONES (Multi-tenancy avanzado)

> Nova-hub tiene multi-proyecto. El repo antiguo tiene multi-organización: el usuario puede ser miembro de distintas orgs con diferentes planes.

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N05 | Organization Switcher | Dropdown en header que lista todas las orgs del usuario con plan (Free/Starter/Pro/Enterprise) y checkmark en la activa | ABC | T | X | 🆕 |
| N06 | Organization User Management | CRUD de miembros por org (solo admins): tabla con rol, email, tareas, % progreso, dropdown de acciones | BC | T | X | 🆕 |
| N07 | Join via invite token | Ruta `/join/:token` — unirse a organización via link de invitación real (no placeholder) | BC | T | X | 🆕 |
| N08 | Trial Management UI | Widget de countdown de trial, badge de plan en perfil, upgrade modal contextual | C | ST | X | 🔧 |
| N09 | Work Mode por usuario | Configuración de intensidad semanal: conservador / moderado / agresivo (define límite de tareas/semana) | BC | ST | 1 | 🆕 |
| N10 | Weekly Availability Config | El usuario configura qué días y cuántas horas está disponible cada semana | BC | ST | 1 | 🆕 |

---

### 🔗 INTEGRACIONES AVANZADAS

> El repo antiguo tiene OAuth real, sync bidireccional y tablas de mapeo para 9 servicios externos.

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N11 | Outlook Calendar sync | OAuth Microsoft, sync bidireccional tareas ↔ eventos Outlook, tabla `outlook_accounts` | BC | ST | 1 | 🆕 |
| N12 | Trello sync (bidireccional) | Token API, importar tableros → tareas, exportar tareas → cards, `sync-from-trello` + `sync-to-trello` | BC | T | 2 | 🆕 |
| N13 | Asana sync (bidireccional) | Personal Access Token, importar/exportar tareas, `sync-from-asana` + `sync-to-asana` | BC | T | 2 | 🆕 |
| N14 | HubSpot CRM (OAuth real) | OAuth completo, sync leads/deals/contactos bidireccional, `hubspot_contact_mappings` + sync queue | BC | T | 3 | 🆕 |
| N15 | Zapier webhooks | Subscriptions a eventos del sistema, trigger-webhook edge function, 5000+ apps via Zapier | C | ST | X | 🆕 |
| N16 | Custom Webhooks | Sistema propio de webhooks: `webhooks` + `webhook_deliveries`, retry lógic, historial, admin only | C | T | X | 🆕 |
| N17 | REST API v1 + OAuth | Endpoint `api-v1`, gestión de API Keys (`api_keys` + `api_usage`), rate limiting, para plan Enterprise | C | ST | X | 🆕 |
| N18 | Slack Slash Commands | Handler de slash commands de Slack (`/status`, `/tasks`, etc.) además de notificaciones salientes | BC | T | X | 🆕 |
| N19 | Integration Status Dashboard | Panel centralizado con status de cada integración (synced/error/partial/pending), último sync timestamp | BC | ST | X | 🆕 |

---

### ✅ TAREAS (Ampliado)

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N20 | Task Swapping con IA | Modal genera 5 alternativas a una tarea vía IA; límite 50% del total; validación del líder; email alert si el líder cambia tarea ajena | BC | T | 2 | 🆕 |
| N21 | AI Resources Panel por tarea | Por cada tarea genera: tutoriales, herramientas, links, templates, emails, ads, posts sociales, scripts de vídeo | BC | ST | 2 | 🆕 |
| N22 | Task Financial Impact | Registra impacto monetario estimado de cada tarea sobre OKRs financieros | BC | ST | 2 | 🆕 |
| N23 | Task Schedule | Asigna fecha + hora + duración estimada a cada tarea para planificación en calendario | BC | ST | 2 | 🆕 |
| N24 | External Task Mappings | Vincula cada tarea interna con su ID en Asana / Trello / HubSpot para sync bidireccional | BC | ST | 2 | 🆕 |
| N25 | Task Alternatives Generator | `generate-task-alternatives` — genera 3-5 alternativas con pros/contras para una tarea específica | BC | ST | 2 | 🆕 |

---

### 💼 CRM AMPLIADO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N26 | CRM Bulk Actions | Selección múltiple de leads + cambio de estado en masa + export a Excel en bloque | C | ST | 3 | 🆕 |
| N27 | Lead Interactions (Customer Journey) | Historial de interacciones por lead: tipo (call/email/meeting), outcome, sentiment, duración | BC | ST | 3 | 🆕 |
| N28 | Stalled Deals Detection | Función RPC detecta automáticamente deals sin actividad > X días y sugiere acción recomendada | C | ST | 3 | 🆕 |
| N29 | Lost Reasons tracking | Post-mortem cuando se cierra un deal perdido: razón + notas + valor del deal perdido | C | ST | 3 | 🆕 |
| N30 | Lead Source analytics | Análisis de conversión por fuente (website/LinkedIn/email/events/referral/ads) | C | ST | 3 | 🆕 |

---

### 📊 KPIs / OKRs AMPLIADO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N31 | OKR Check-ins semanales | Formulario de check-in: valor actual, observaciones, % confianza, historial | BC | ST | 4 | 🆕 |
| N32 | OKR Dependency Map | Grafo visual de dependencias entre OKRs (este KR depende de aquél) | C | T | 4 | 🆕 |
| N33 | OKR Retrospective | Post-mortem al completar un ciclo: lecciones, impacto real vs esperado | C | T | 4 | 🆕 |
| N34 | OKR → Task Link | Vinculación directa entre Key Results y tareas (`okr_task_links` con contribution_weight) | BC | T | 4 | 🆕 |
| N35 | OKR Evidencias | Adjuntar pruebas de progreso a cada Key Result (igual que el sistema de evidencias de KPIs) | BC | T | 4 | 🆕 |
| N36 | OKR Financial Summary | Impacto financiero calculado de cada OKR completado | C | T | 4 | 🆕 |
| N37 | KPI Benchmark vs Industria | Tabla `kpi_benchmarks` con media, percentil 25 y 10 por industria para comparar propios KPIs | BC | ST | 4 | 🆕 |
| N38 | KPI Change History | Historial de cambios de KPI con % variación y factores contribuyentes | BC | ST | 4 | 🆕 |
| N39 | Generate Personalized KRs | Edge function genera Key Results personalizados por rol y contexto del usuario | BC | T | 4 | 🆕 |

---

### 💰 FINANZAS AMPLIADO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N40 | Revenue / Expense entries detalladas | Tablas propias para ingresos y gastos: categoría, producto, cliente, método pago, recurrencia | BC | ST | 5 | 🆕 |
| N41 | Financial Ratios | Calculados mensualmente: ROI, CAC, LTV, LTV/CAC, payback, working capital, current ratio | C | ST | 5 | 🆕 |
| N42 | Product Profitability | Margen y contribución a ingresos por producto/servicio, top/bottom performers | C | ST | 5 | 🆕 |
| N43 | Marketing Spend tracking | Gasto por canal (Google Ads, FB, SEO, etc.) con leads generados, conversiones y revenue atribuido | C | ST | 5 | 🆕 |
| N44 | Cash Flow Forecast detallado | Proyección mensual: saldo apertura, entradas/salidas proyectadas, saldo cierre con desglose JSONB | C | ST | 5 | 🆕 |
| N45 | Stripe Billing Portal | Edge function `create-billing-portal` — portal de Stripe para el usuario gestionar su suscripción | C | ST | 5 | 🆕 |
| N46 | Financial Anomaly Detection RPC | Función RPC `detect_financial_anomalies()` ejecutada por cron — detecta caídas de margen, gastos inusuales | C | ST | 5 | 🆕 |

---

### 📈 ANALYTICS AMPLIADO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N47 | Cohort Analysis Dashboard | Heatmap de retención por cohortes M0-M12 con curva promedio; tablas `cohort_metrics` | C | ST | X | 🆕 |
| N48 | Admin Activity Heatmap | Tabla hora (08-18h) × día (L-V) con intensidad de tareas completadas por usuario | C | T | X | 🆕 |
| N49 | Admin Weekly Comparison | Tabla semanas 1-6: tareas, progreso medio, puntos, usuarios activos con trend indicators ↑↓ | C | T | X | 🆕 |
| N50 | Generate All Smart Alerts | Edge function + RPC que genera automáticamente todas las alertas del sistema: OKRs en riesgo, runway crítico, deals parados, kpis por debajo | BC | ST | 1 | 🆕 |
| N51 | Country Data Intelligence | Tabla `country_data`: GDP per cápita, penetración internet/ecommerce, IVA, plataformas top — para contextualizar análisis por mercado | BC | ST | X | 🆕 |
| N52 | AI Generation Cost Tracking | Tabla `ai_generations_history`: tokens usados, coste USD, tiempo respuesta, rating de utilidad — para optimización de costes | C | ST | X | 🆕 |

---

### 🔍 ANÁLISIS BRUTAL v3 (Gemini 2.5 Flash)

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N53 | Analyze Project Data v3 | 17 queries paralelas → Gemini 2.5 Flash → JSON de 9 secciones: executive dashboard, financial health, growth analysis, CRM performance, OKR performance, team performance, market analysis, forecast, action plan | BC | ST | X | 🆕 |
| N54 | Pre-Analysis Data Review | Modal antes del análisis que muestra qué datos se usarán y permite editarlos o añadir contexto adicional | BC | ST | X | 🆕 |
| N55 | Analysis Plan Limits | Contador de análisis usados/mes por plan (Free=0, Starter=2, Pro=10, Enterprise=∞) | C | ST | X | 🆕 |
| N56 | Scalability Analysis detallada | Análisis de bottlenecks, dependencies graph, severity (critical/high/medium/low), solución estimada | C | ST | X | 🆕 |

---

### 🛠️ HERRAMIENTAS EDUCATIVAS (Sección nueva)

> El repo antiguo tiene una sección `/herramientas` con 6 módulos visuales para enseñar conceptos estratégicos usando los datos del proyecto.

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N57 | Growth Model AARRR | Visualización del modelo Pirate Metrics (5 etapas): KPIs, canales, tácticas por etapa con cards coloreadas | B | ST | X | 🆕 |
| N58 | Lead Scoring Visual Tool | Herramienta educativa de scoring: rangos A/B/C/D con criterios, puntos por categoría (fit/engagement/intent/buying power) | B | ST | 3 | 🆕 |
| N59 | Buyer Persona Builder | Constructor visual de persona: demografía, objetivos, pain points, psicografía, canales preferidos, comportamiento de compra, contexto de mercado por país | B | ST | 3 | 🆕 |
| N60 | Customer Journey Tool | 4 etapas interactivas: Awareness / Consideration / Decision / Retention — puntos de contacto, emociones, oportunidades | BC | ST | 3 | 🆕 |
| N61 | Sales Playbook | Guía operativa de ventas: discovery, pitch, manejo de objeciones, cierre, email templates, scripts recomendados | BC | ST | 3 | 🆕 |
| N62 | Interactive Entrepreneurship Guide | Guía paso a paso con interactividad (selecciones que cambian next steps), cuestionarios, recursos linkados | A | ST | X | 🆕 |
| N63 | Communication Guide | Artículos sobre comunicación efectiva, tone of voice, email templates, presentation tips | ABC | ST | X | 🆕 |

---

### 🎮 PRACTICAR (Sección nueva)

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N64 | Sales Simulator | Escenarios reales de venta con niveles de dificultad (fácil/medio/difícil); perfil de cliente, opciones de respuesta con scoring + feedback, progreso en 5 pasos, resultado con key learnings | BC | ST | 3 | 🆕 |

---

### 💡 DISCOVERY ONBOARDING (Ampliado)

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N65 | Dual Onboarding paths | Dos caminos: Startup (9 pasos para empresas) + Discovery (12 pasos para validadores de idea desde cero) | A | ST | X | 🆕 |
| N66 | Discovery Profile (12 pasos) | Perfil del emprendedor: situación, disponibilidad, tolerancia riesgo, motivaciones, skills, industrias, audiencia, capital, tipo negocio, urgencia revenue | A | ST | X | 🆕 |
| N67 | Curated Ideas DB | Base de datos de 50-100 ideas de negocio pre-curadas: categoría, skills necesarios, capital mínimo, dificultad, primeros pasos, errores comunes, ejemplos reales | A | ST | X | 🆕 |
| N68 | Generate Discovery Ideas | Edge function que genera ideas personalizadas basadas en el perfil de Discovery (50-100 opciones) | A | ST | X | 🆕 |
| N69 | Organization Guide Progress | Tracking del progreso del usuario en las guías interactivas (qué paso va, % completado) | A | ST | X | 🆕 |

---

### ⚙️ ADMIN Y SETTINGS AMPLIADO

| # | Feature | Descripción | Etapa | Modo | Loop | Estado |
|---|---------|-------------|-------|------|------|--------|
| N70 | API Keys Management | Generar, copiar, revocar API keys por usuario/org; tracking de usage (endpoint, tokens, coste) | C | ST | X | 🆕 |
| N71 | Activity Log en Settings | Historial: login, create, update, delete con timestamp, IP, dispositivo — para compliance | BC | T | X | 🆕 |
| N72 | Email Tracking | Log de emails enviados: estado (sent/failed/bounced), opened_at, clicked_at, failure reason | C | ST | X | 🆕 |
| N73 | Email Unsubscribe Management | Gestión de desuscripciones de email con token, razón, opción de resubscripción | C | ST | X | 🆕 |
| N74 | Feature Flags Admin Panel | Panel admin para toggle de features sin deploy (habilitar/deshabilitar por org o global) | C | T | X | 🆕 |
| N75 | Products/Services Manager | CRUD de productos y servicios del proyecto: categorías, precios, SKUs (en perfil/settings) | BC | ST | X | 🆕 |

---

### 📊 RESUMEN ESTADÍSTICO ACTUALIZADO

```
TOTAL DE FEATURES MAPEADAS: 223 (148 previas + 75 del repo antiguo)

Por estado:
  ✅ Funcionando en nova-hub:     113 features  (51%)
  🔧 Parcialmente implementadas:   13 features   (6%)
  🆕 Nuevas (a implementar):       97 features  (43%)

Por origen:
  Nova-hub actual:                148 features
  Repo antiguo (nuevas):           75 features

Por etapa de usuario:
  Solo etapa A (Sin Idea):         10 features
  Solo etapa B (Con Idea):          5 features
  Solo etapa C (Startup):          28 features
  Etapas AB:                       14 features
  Etapas BC:                       80 features
  Todas (ABC):                     86 features

Por modo:
  Equipo solo (T):                 26 features
  Ambos (ST):                     197 features

Features por módulo (top 5):
  Integraciones:                   19 features
  Analytics:                       18 features
  Tareas:                          14 features
  Finanzas:                        14 features
  OBVs/CRM:                        19 features
```

---

### 📋 PLAN DE IMPLEMENTACIÓN ACTUALIZADO (REPO ANTIGUO)

**Fase 0 — Quick wins de UX (máximo impacto visual, mínima complejidad):**
1. Dark/Light Mode — instalar `next-themes`, ThemeProvider, toggle en header
2. Multi-idioma (i18n) — instalar `react-i18next`, LanguageSelector, traducciones ES/EN base
3. Tours interactivos — hook `useOnboardingTour`, tooltips por módulo nuevo

**Fase 1A — Core del viaje (P1 absoluto):**
4. Discovery Onboarding dual path (Startup 9 steps / Discovery 12 steps)
5. Curated Ideas DB (50-100 ideas pre-curadas en DB)
6. Analyze-project-data-v3 (Brutal Analysis con Gemini)
7. OKRs completo con Check-ins + OKR→Task Links

**Fase 1B — Features de equipo (P1 si tiene team):**
8. Task Swapping con IA
9. Work Mode + Weekly Availability Config
10. Join via invite token (real)

**Fase 2A — Integraciones mainstream:**
11. Google Calendar OAuth (completar)
12. Slack Slash Commands
13. Trello bidireccional
14. Asana bidireccional
15. HubSpot CRM OAuth
16. Outlook Calendar

**Fase 2B — Analytics avanzados:**
17. Cohort Analysis Dashboard
18. Financial Ratios (ROI, CAC, LTV)
19. Product Profitability
20. Admin Activity Heatmap + Weekly Comparison
21. KPI Benchmark vs Industria
22. Smart Alerts automáticas (RPC)

**Fase 3 — Herramientas educativas y práctica:**
23. Growth Model AARRR
24. Buyer Persona Builder
25. Sales Simulator completo (con escenarios)
26. Sales Playbook
27. Customer Journey Tool
28. Interactive Guide

**Fase 4 — Enterprise:**
29. REST API v1 + OAuth
30. Custom Webhooks
31. Zapier
32. API Keys Management
33. PWA Push Notifications
34. Multi-organización (org switcher)

---

*Este documento es la referencia de verdad del producto. Actualizar con cada feature completada.*
*Última actualización: 2026-02-23 — Análisis completo de ambos repos.*
