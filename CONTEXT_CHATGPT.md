# Optimus-K — Contexto Completo del Proyecto

> Documento generado para dar contexto total a cualquier IA o colaborador nuevo.
> Última actualización: 2026-02-23

---

## 1. Qué es Optimus-K

**Propuesta de valor:**
Optimus-K es la plataforma de gestión estratégica para emprendedores y equipos early-stage que necesitan operar con criterio: valida oportunidades con peers, trackea KPIs reales, gestiona su pipeline de ventas y toma decisiones con IA — todo en un solo lugar, sin dispersarse entre Notion, Excel y HubSpot.

**En una frase:** Startup OS para equipos que quieren pasar de la intuición al sistema.

**Qué NO es:**
- No es un generador de tráfico ni leads (el usuario trae sus propias oportunidades)
- No es un CRM genérico
- No es una herramienta de notas (aunque tiene espacio personal)
- No está diseñado para solopreneurs — es para equipos con roles definidos

---

## 2. Usuario Principal

**Perfil:**
Emprendedor activo (18-35 años) que ya tiene un proyecto en marcha o está en proceso de lanzarlo. Trabaja en equipo pequeño (2-8 personas), con roles definidos (ventas, finanzas, tech, marketing, operaciones, estrategia). Tiene energía pero le falta sistema: sus datos están dispersos, tarda en saber si sus acciones generan resultado real, y necesita validación externa para no engañarse.

**Problema hoy:** Usa Notion para todo y Excel para lo financiero, pero ninguno le da el ciclo completo: idea → validación → venta → aprendizaje.

**Roles de especialización:**
- `sales` — CRM, scoring de leads, pitch generation
- `finance` — Proyecciones, cash flow, cobros
- `ai_tech` — Implementación técnica, integraciones
- `marketing` — Contenido, análisis de competencia
- `operations` — Ejecución de tareas, procesos
- `strategy` — Dirección general, benchmarking, OKRs

**Niveles de acceso:**
- `admin` — Acceso total, gestión de usuarios y proyectos
- `tlt` (Top-Level Talent) — Formadores senior, validan KPIs, mentorizan
- `member` — Usuario estándar

---

## 3. Modelo de Negocio

**Tipo:** SaaS mensual por usuario/proyecto

**Estado actual:** Pagos desactivados (ENABLE_PAYMENTS = false), en fase de construcción

**Planes previstos (cuando se active Stripe):**

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Proyectos | 3 | 25 | Ilimitado |
| Miembros | 5 | 25 | Ilimitado |
| Storage | 5 GB | 100 GB | Ilimitado |
| Requests IA/mes | 50 | 1.000 | Ilimitado |
| Historial analytics | 30 días | 365 días | Ilimitado |
| Sistema Masters | No | Sí | Sí |
| API Access | No | No | Sí |

**Integración:** Stripe (keys en .env.example, listo para activar)

---

## 4. Competencia

**Directos:** Ninguno hace exactamente lo mismo.

**Indirectos:**
- **Notion** — Gestión de info, pero sin validación, sin finanzas, sin IA contextual
- **Monday / Asana** — Gestión de tareas, pero sin KPIs, CRM ni validación peer
- **HubSpot** — CRM potente, pero sin KPIs, masters, validaciones ni IA generativa

**Ventaja diferencial:** El ciclo completo en un solo sistema — desde la idea hasta el cobro, con validación peer-to-peer y IA que entiende el contexto del proyecto.

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React | 18.3.1 |
| Lenguaje | TypeScript | 5.8.3 |
| Build | Vite | 5.4.19 |
| Estilos | TailwindCSS | 3.4.17 |
| UI Components | shadcn/ui (Radix UI) | Latest |
| Estado servidor | React Query | 5.83.0 |
| Routing | React Router | 6.30.1 |
| Formularios | React Hook Form + Zod | 7.61 + 3.25 |
| Gráficos | Recharts | 2.15.4 |
| Base de datos | Supabase PostgreSQL | — |
| Auth | Supabase Auth (JWT) | — |
| Serverless | Deno Edge Functions (Supabase) | — |
| LLM | Anthropic Claude API | claude-3-5-sonnet |
| Testing | Vitest + React Testing Library | 3.2.4 |
| Error tracking | Sentry | 10.39.0 |
| Despliegue | Vercel (frontend) + Supabase (backend) | — |

---

## 6. Arquitectura

```
Presentation Layer
  src/pages/ (52 páginas)
  src/components/ (~456 componentes)
        |
Service Layer (lógica de negocio)
  src/services/ (5 servicios)
        |
Repository Layer (acceso a datos)
  src/repositories/ (5 repositorios)
        |
Supabase
  PostgreSQL + RLS + Auth + Realtime
  + 58 Deno Edge Functions
```

**Estado global:**
- React Query → estado del servidor (caché, sincronización)
- 4 Contexts → CurrentProject, DemoMode, Navigation, Search (Cmd+K)
- localStorage → proyecto activo persistido

**Seguridad:**
- RLS habilitado en TODAS las tablas
- JWT validado en todas las edge functions
- Rate limiting (Deno KV persistente) en 28 funciones IA
- CORS con whitelist de origins (ALLOWED_ORIGINS)
- XSS sanitizado en componentes de contenido generado

---

## 7. Módulos Principales

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs consolidados, rankings, actividad reciente, validaciones pendientes |
| **CRM** | Pipeline Kanban (frío → cerrado ganado), AI lead scoring, email pitch generator |
| **OBVs** | Registro unificado: validaciones + CRM + ventas + facturación en uno |
| **KPIs** | LP (Learning Path), BP (Book Point), CP (Community Point) con validación peer |
| **Tareas** | Kanban, AI Task Executor con feedback loop |
| **Analytics** | Benchmarking, radar charts, evolución temporal, predicciones IA |
| **Financiero** | Proyecciones, cash flow, cobros, deuda, márgenes |
| **Masters** | Programa de maestría con solicitudes, votación y desafíos entre roles |
| **Rankings** | Leaderboards por métrica (OBVs, facturación, KPIs, etc.) |
| **Meetings** | Transcripción de reuniones + extracción de tareas/leads/decisiones con IA |
| **Mi Espacio** | Notas, insights, reflexiones personales |
| **Mi Desarrollo** | Roadmap de aprendizaje, playbooks por rol |

---

## 8. Sistema OBV (núcleo de la plataforma)

Un **OBV** es el registro unificado central. Combina en una sola entidad:

- **Datos CRM:** contacto (nombre, empresa, email, teléfono)
- **Pipeline:** estado (frío → cerrado ganado), valor potencial
- **Ventas:** producto, cantidad, precio, facturación
- **Costes:** desglose JSONB (materiales, subcontratación, herramientas, marketing, logística, comisiones)
- **Facturación:** número de factura, IVA, total, forma de pago
- **Cobro:** estado, fecha esperada, fecha real, días de retraso (calculado automáticamente)
- **Validación peer:** votos de aprobación, historial de cambios

**Tipos:**
- `exploracion` — entrevistas, investigación de mercado
- `validacion` — validación de problema/solución
- `venta` — deals reales con facturación

**Flujo de vida:**
```
Crear OBV → Enriquecer (datos contacto + producto) → Pipeline (frío → caliente)
→ Validación peer (2+ votos) → Factura → Cobro
```

---

## 9. Sistema KPI (LP/BP/CP)

**Tres tipos de puntos:**
- **LP (Learning Path):** Completar módulos de aprendizaje
- **BP (Book Point):** Lectura y estudio con evidencia
- **CP (Community Point):** Contribución a la comunidad

**Flujo de validación:**
1. Usuario crea KPI con título, descripción y URL de evidencia
2. Se asigna a validadores por rotación mensual
3. Con 2+ aprobaciones → validated / 2+ rechazos → rejected
4. Puntos acumulan en member_kpi_base

**Sistema anti-trampas:**
- Validadores asignados por rotación
- Deadline de 5-7 días para validar
- Validadores que no cumplen son bloqueados temporalmente
- Tracking de rendimiento por validador (validator_stats)

---

## 10. Sistema Masters

**Qué es:** Sistema de progresión por rol. Los mejores en cada especialización pueden convertirse en "Master" de ese rol.

**Flujo:**
1. Usuario solicita ser Master de un rol
2. El equipo vota (requiere N votos en X días)
3. Si aprobado → activo como team_master
4. Los Masters pueden ser desafiados por otros miembros
5. Los Masters mentorizan a otros

**Roles con Master:** sales, finance, ai_tech, marketing, operations, strategy

---

## 11. Rutas de la Aplicación

```
/auth                                → Login / Signup
/                                    → Root redirect (lógica de redirección)
/select-onboarding-type              → Selección de tipo de usuario
/create-first-project                → Crear primer proyecto
/onboarding/:projectId               → Wizard de onboarding
/proyecto/:projectId/deep-setup/*    → Setup avanzado
/proyecto/:projectId/dashboard       → Dashboard principal
/proyecto/:projectId/crm             → CRM / Pipeline
/proyecto/:projectId/obvs            → Centro de OBVs
/proyecto/:projectId/kpis            → KPIs (LP/BP/CP)
/proyecto/:projectId/validaciones    → Cola de validaciones
/proyecto/:projectId/financiero      → Dashboard financiero
/proyecto/:projectId/analytics       → Analytics avanzado
/proyecto/:projectId/rankings        → Leaderboards
/proyecto/:projectId/masters         → Sistema de masters
/proyecto/:projectId/meetings        → Inteligencia de reuniones
/proyecto/:projectId/mi-espacio      → Espacio personal
/proyecto/:projectId/mi-desarrollo   → Desarrollo personal
/proyecto/:projectId/settings        → Configuración
/proyecto/:projectId/notificaciones  → Centro de notificaciones
```

---

## 12. Flujo de Onboarding

**3 caminos según perfil:**

```
Auth → SelectOnboardingType
         |
         ├── "No tengo idea" → Generative AI (genera 3 opciones de negocio con fit scores)
         ├── "Tengo una idea" → Competitive SWOT + roadmap de validación
         └── "Tengo startup" → Health score + quick wins + plan de acción
                    |
            CreateFirstProject
                    |
            OnboardingWizard (datos del proyecto: nombre, industria, idea, equipo, ubicación)
                    |
            Dashboard
```

---

## 13. Edge Functions (58 funciones Deno)

Todas siguen el mismo patrón de seguridad:
```
CORS preflight → Auth JWT → Rate limit → Validar input → Fetch contexto DB → LLM call → Guardar DB → Response
```

**Generación IA (23):** generate-business-ideas, generate-business-options, generate-complete-business, generate-pitch-deck, generate-email-pitch, generate-financial-projections, generate-launch-checklist, generate-learning-path, generate-learning-roadmap, generate-playbook, generate-predictions, generate-project-roles, generate-role-questions, generate-role-questions-v2, generate-task-completion-questions, generate-tasks-v2, generate-testimonial, generate-weekly-insights, generate-content-calendar, generate-local-context, write-content-piece, extract-business-info, generate-actionable-insights

**Análisis e inteligencia (15):** analyze-competitors, analyze-competitor-urls, competitive-swot-generator, competitor-intelligence-cron, enrich-project-intelligence, calculate-lead-score, calculate-fit-score, cofounder-alignment-analyzer, geo-intelligence, market-research, validate-monetization, suggest-buyer-persona, analyze-meeting, apply-meeting-insights, growth-playbook-generator

**AI Workers (5):** ai-business-advisor, ai-career-coach, ai-lead-finder, ai-task-executor, ai-task-router

**Reuniones (3):** transcribe-meeting, analyze-meeting, apply-meeting-insights

**Integraciones y sync (7):** auto-sync-finances, sync-stripe, google-analytics-sync, send-email-real, send-slack-notification, deploy-to-vercel, suggest-optimal-schedule

**Utilidades (5):** approve-generation-preview, export-excel, prepare-one-on-one, seed-users, seed-projects

---

## 14. Base de Datos

**Proyecto Supabase:** aguuckggskweobxeosrq
**URL:** https://aguuckggskweobxeosrq.supabase.co
**Extensions:** uuid-ossp, pg_cron
**RLS:** Habilitado en todas las tablas
**Nota:** `profiles` es una VIEW sobre la tabla `members` (no tabla propia)

**ENUMs:**
```
project_phase:        idea | problema_validado | solucion_validada | mvp | traccion | crecimiento
project_type:         validacion | operacion
obv_type:             exploracion | validacion | venta
lead_status:          frio | tibio | hot | propuesta | negociacion | cerrado_ganado | cerrado_perdido
task_status:          todo | doing | done | blocked
kpi_status:           pending | validated | rejected
specialization_role:  sales | finance | ai_tech | marketing | operations | strategy
app_role:             admin | tlt | member
```

**Tablas (45 total):**

- Usuarios: members, user_roles, user_settings, member_kpi_base
- Proyectos: projects, project_members, objectives
- OBVs: obvs (48 cols), obv_participantes, obv_validaciones, obv_pipeline_history, cobros_parciales
- Leads (legacy): leads, lead_history
- KPIs: kpis, kpi_validaciones
- Tareas: tasks
- Validaciones: pending_validations, validation_order, validator_stats
- Notificaciones: notifications, activity_log
- Masters: master_applications, master_votes, team_masters, master_challenges, master_mentoring, role_rotation_requests, role_history
- Desarrollo personal: user_insights, user_playbooks, role_rankings
- IA y caché: advisor_chats, ai_recommendations, weekly_insights, geo_intelligence_cache, competitive_analysis, learning_paths, generated_business_options, validation_roadmaps, growth_playbooks, ai_generation_logs
- Integraciones: slack_webhooks, project_documents, onboarding_sessions

---

## 15. Variables de Entorno

**Frontend (.env.local):**
```
VITE_SUPABASE_URL=https://aguuckggskweobxeosrq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=aguuckggskweobxeosrq
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx  (opcional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...    (cuando se activen pagos)
```

**Edge Functions (Supabase secrets):**
```
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ALLOWED_ORIGINS=https://tu-dominio.vercel.app,http://localhost:5173
CRON_SECRET=...
ADMIN_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_ANALYTICS_API_KEY=...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
VERCEL_TOKEN=...
```

---

## 16. Feature Flags (src/config/features.ts)

```
ENABLE_PAYMENTS = false       // Stripe desactivado (todo gratis por ahora)
DEMO_MODE = false             // Datos reales, no demo
SHOW_UPGRADE_HINTS = false    // Sin paywalls ni badges Pro
ENABLE_AI_FEATURES = true     // Todas las funciones IA activas
ENABLE_ANALYTICS = true       // Analytics avanzado activo
ENABLE_INTEGRATIONS = true    // Integraciones externas activas
```

Para activar monetización: ENABLE_PAYMENTS = true + configurar Stripe keys

---

## 17. Estado Actual del Código

- **Tests:** 1752/1752 pasando (175 archivos)
- **Build:** Sin errores (bundle principal: 104 kB gzip)
- **TypeScript:** 0 errores
- **ESLint:** 0 errores, 0 warnings
- **Code splitting:** React.lazy en todas las rutas (bundle principal reducido 44%)
- **Seguridad:** RLS + JWT + Rate limiting + CORS whitelist en todas las funciones

---

## 18. Despliegue

- **Frontend:** Vercel (auto-deploy desde GitHub main)
- **Base de datos:** Supabase PostgreSQL
- **Edge Functions:** Deno en Supabase
- **Pagos:** Stripe (pendiente de activar)
- **Editor visual:** Lovable (conectado via lovable-tagger en devDependencies)

---

## 19. Lo que Falta por Construir

**Monetización (pendiente):**
- Activar ENABLE_PAYMENTS = true cuando haya plan de pricing definido
- Configurar Stripe con precios reales

**Features incompletas (TODO en código):**
- Flujo de invitaciones reales a proyectos (actualmente placeholder)
- PDF extraction en Edge Function para el sistema de evidencias
- Deploy de algunas Edge Functions en producción (generate-local-context, generate-roadmap)

**Pendiente operacional:**
- Actualizar ALLOWED_ORIGINS con dominio real de producción
- Definir y activar el modelo de precios

---

## 20. Repositorio

- **GitHub:** https://github.com/zarkojrpajarino-hue/nova-hub
- **Branch principal:** main
- **Editor visual:** Lovable (https://lovable.dev)
- **Desarrollo local:** Claude Code (CLI de Anthropic)
