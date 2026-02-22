# 📘 DOCUMENTACIÓN COMPLETA - ESTRUCTURA DE LA APP

## 🎯 Visión General

OPTIMUS-K está organizada en **6 secciones principales** con **32 subsecciones** en total. Cada sección tiene un propósito específico en el journey del emprendedor, desde la ideación hasta la ejecución y medición.

---

## 🏠 1. CORE (3 subsecciones)

**Propósito**: Funciones esenciales personales y espacio de trabajo individual.

### 1.1 Dashboard
- **Ruta**: `/proyecto/:projectId`
- **Propósito**: Vista principal del proyecto con resumen ejecutivo
- **Datos que consume**:
  - Métricas del proyecto (MRR, CAC, LTV, Runway)
  - Tareas pendientes del usuario
  - Próximas reuniones
  - Notificaciones importantes
  - Estado del onboarding
- **Onboarding types**: Todos (generative, idea, existing)
- **Modo trabajo**: Individual + Team
- **Por qué es útil**: Es el "home base" donde ves el estado global del proyecto en un vistazo. Es donde aterrizas cada vez que entras.
- **Alineada con**: Mi Espacio (datos personales), Startup OS (métricas operativas)
- **Requiere plan**: ❌ Free (accesible a todos)

### 1.2 Mi Espacio
- **Ruta**: `/proyecto/:projectId/mi-espacio`
- **Propósito**: Workspace personal del miembro (tareas, calendario, aprendizaje)
- **Datos que consume**:
  - Tareas asignadas a mí (de la tabla `tasks`)
  - Mi calendario personal (`calendar_events`)
  - Mi progreso en skills (`learning_paths`, `skill_checkpoints`)
  - Mis OBVs pendientes (`obvs`)
- **Onboarding types**: Todos
- **Modo trabajo**: Individual
- **Por qué es útil**: Es tu espacio privado donde gestionas TU trabajo dentro del equipo. No ves las tareas de otros, solo las tuyas.
- **Alineada con**: Mi Desarrollo (tu crecimiento profesional), Dashboard (overview general)
- **Requiere plan**: ❌ Free

### 1.3 Mi Desarrollo
- **Ruta**: `/proyecto/:projectId/mi-desarrollo`
- **Propósito**: Tracking de tu crecimiento profesional y skills
- **Datos que consume**:
  - Mi learning path (`learning_paths`)
  - Skills adquiridas vs objetivo (`skills`, `skill_checkpoints`)
  - Certificaciones y logros (`achievements`)
  - Feedback recibido de 1-on-1s (`one_on_ones`)
  - Progreso hacia rol Master (`master_progress`)
- **Onboarding types**: Todos
- **Modo trabajo**: Individual
- **Por qué es útil**: Convierte tu trabajo en un startup en un camino profesional medible. Ves qué habilidades has desarrollado y cuáles te faltan.
- **Alineada con**: Camino a Master (objetivo final), Path to Master (visión de equipo)
- **Requiere plan**: ❌ Free

---

## 🚀 2. CREAR & VALIDAR (4 subsecciones)

**Propósito**: Desde la idea hasta la validación del mercado.

### 2.1 Proyectos
- **Ruta**: `/proyecto/:projectId/proyectos`
- **Propósito**: Gestión de proyectos/iniciativas dentro del startup
- **Datos que consume**:
  - Lista de proyectos (`projects`)
  - Estado de cada proyecto (en onboarding, activo, pausado)
  - Miembros asignados (`project_members`)
  - Progreso general
- **Onboarding types**: Todos
- **Modo trabajo**: Team
- **Por qué es útil**: Un startup puede tener múltiples proyectos/productos. Aquí los gestionas todos.
- **Alineada con**: Dashboard (overview), Tareas (ejecución)
- **Requiere plan**: ❌ Free

### 2.2 Generative Onboarding
- **Ruta**: `/proyecto/:projectId/generative-onboarding`
- **Propósito**: Sistema de onboarding híbrido (Fast Start + Deep Setup)
- **Datos que consume**:
  - Respuestas del onboarding (`project_metadata`)
  - Business model generado por IA
  - Market research automático
  - Competidores identificados
  - Financial projections
- **Onboarding types**: Generative (usuarios sin idea clara)
- **Modo trabajo**: Individual → Team (empieza solo, luego invitas)
- **Por qué es útil**: Si no sabes qué hacer, la IA te propone 3 ideas personalizadas basadas en tu perfil, skills y ubicación geográfica.
- **Alineada con**: Validaciones (siguiente paso), Startup OS (operaciones)
- **Requiere plan**: 🔒 Starter+ (AI feature)
- **Datos generados**:
  - 3 business ideas con fit score
  - Geo-intelligence (competidores locales, inversores)
  - Financial projections
  - Learning path personalizado

### 2.3 Validaciones
- **Ruta**: `/proyecto/:projectId/validaciones`
- **Propósito**: Validar tu idea con el mercado antes de construir
- **Datos que consume**:
  - Experimentos de validación (`validation_experiments`)
  - Resultados de encuestas/tests
  - Métricas de landing pages
  - Feedback de early adopters
  - SWOT analysis vs competidores
- **Onboarding types**: Idea, Existing (usuarios con algo en mente)
- **Modo trabajo**: Individual + Team
- **Por qué es útil**: Evita construir algo que nadie quiere. Valida hipótesis con data real.
- **Alineada con**: Centro OBVs (resultados convertidos en OBVs), CRM (leads de validación)
- **Requiere plan**: ❌ Free (básico), 🔒 Pro (AI-powered SWOT)
- **Datos que genera**:
  - SWOT matrix vs competidores
  - Market gaps con opportunity scores
  - Go-to-Market strategy
  - Roadmap de experimentos

### 2.4 Centro OBVs
- **Ruta**: `/proyecto/:projectId/obvs`
- **Propósito**: Gestión de OBVs (Objetivos + Resultados Clave)
- **Datos que consume**:
  - OBVs del proyecto (`obvs`)
  - KPIs asociados (`kpis`)
  - Progreso en tiempo real
  - Check-ins semanales
- **Onboarding types**: Todos (especialmente Existing)
- **Modo trabajo**: Team
- **Por qué es útil**: Sistema de objetivos trimestrales que mantiene al equipo enfocado en lo que importa.
- **Alineada con**: KPIs (métricas detalladas), Dashboard (overview)
- **Requiere plan**: ❌ Free

---

## 💼 3. EJECUTAR (4 subsecciones)

**Propósito**: Operaciones diarias del startup.

### 3.1 Startup OS
- **Ruta**: `/proyecto/:projectId/startup-os`
- **Propósito**: Dashboard operativo con todas las métricas de negocio
- **Datos que consume**:
  - Financial metrics (`key_metrics`)
  - MRR, CAC, LTV, Churn, Runway
  - Growth rate
  - Cash flow
  - Competitor intelligence (scraping automático)
  - AI Business Advisor insights
- **Onboarding types**: Existing (startups operando)
- **Modo trabajo**: Founders/Leadership
- **Por qué es útil**: Es el "operating system" del startup. Ves salud financiera, competencia, y tienes un AI advisor que te da recomendaciones.
- **Alineada con**: Financiero (profundidad en finanzas), Analytics (análisis avanzado)
- **Requiere plan**: ❌ Free (básico), 🔒 Advanced (AI Advisor + Competitor Intelligence)
- **Sub-features**:
  - Founder Metrics Dashboard (MRR, CAC, LTV, Runway, Churn)
  - Financial Projections (3 escenarios: conservative, realistic, optimistic)
  - Competitor Intelligence (monitoreo automático con cron jobs)
  - Content Calendar + AI Writer
  - Social Proof Generator
  - Launch Checklist
  - AI Business Advisor (RAG chat con context de tu startup)
  - Weekly Insights automáticos

### 3.2 CRM Global
- **Ruta**: `/proyecto/:projectId/crm`
- **Propósito**: Gestión de leads, clientes y pipeline de ventas
- **Datos que consume**:
  - Leads (`leads`)
  - Conversaciones (`lead_interactions`)
  - Pipeline stages
  - Deal values
  - Conversion rates
  - AI-powered lead scoring
- **Onboarding types**: Idea, Existing (necesitan vender)
- **Modo trabajo**: Team (sales + marketing)
- **Por qué es útil**: CRM especializado en startups early-stage. Incluye AI para encontrar leads y scoring.
- **Alineada con**: Validaciones (leads de experimentos), Financiero (revenue tracking)
- **Requiere plan**: ❌ Free (50 leads), 🔒 Pro (500 leads), 🔒 Enterprise (unlimited)
- **Features**:
  - AI Lead Finder (encuentra leads automáticamente)
  - Lead scoring automático
  - Pipeline visual
  - Email tracking
  - Integration con LinkedIn

### 3.3 Financiero
- **Ruta**: `/proyecto/:projectId/financiero`
- **Propósito**: Gestión financiera profunda (accounting + projections)
- **Datos que consume**:
  - Transacciones (`transactions`)
  - Categorías de gastos
  - Runway calculations
  - Budget vs actual
  - Financial projections
  - P&L statements
- **Onboarding types**: Existing (con operaciones)
- **Modo trabajo**: Founders/CFO
- **Por qué es útil**: Profundiza en las finanzas que Startup OS muestra en dashboard. Permite planning detallado.
- **Alineada con**: Startup OS (métricas high-level), KPIs (financial KPIs)
- **Requiere plan**: ❌ Free (básico), 🔒 Pro (projections), 🔒 Advanced (multi-currency + integrations)

### 3.4 Meeting Intelligence
- **Ruta**: `/proyecto/:projectId/meetings`
- **Propósito**: Graba, transcribe y extrae insights automáticos de reuniones
- **Datos que consume**:
  - Meeting recordings (`meeting_recordings`)
  - Transcriptions (Whisper API)
  - AI-extracted insights (GPT-4)
  - Action items automáticos
  - Preguntas IA generadas durante la reunión
- **Onboarding types**: Todos (especialmente Existing con equipos)
- **Modo trabajo**: Team
- **Por qué es útil**: Nunca más olvides qué se decidió en una reunión. La IA extrae automáticamente decisiones, tareas y insights.
- **Alineada con**: Mi Espacio (tareas generadas), Centro OBVs (decisiones estratégicas)
- **Requiere plan**: 🔒 Pro (10 meetings/month), 🔒 Advanced (unlimited)
- **Flow completo**:
  1. Pre-reunión: Configuras tipo, participantes, objetivos
  2. Durante: IA Facilitador sugiere preguntas basadas en objetivos
  3. Grabación: Upload de audio
  4. Transcripción: Whisper API
  5. Análisis: GPT-4 extrae insights
  6. Revisión: Apruebas insights antes de aplicarlos
  7. Integración: Se crean automáticamente tareas, OBVs, actualizaciones de KPIs
  8. Notificaciones: El equipo recibe resumen

---

## 👥 4. EQUIPO (5 subsecciones)

**Propósito**: Gestión del talento y desarrollo del equipo.

### 4.1 Exploración de Roles
- **Ruta**: `/proyecto/:projectId/exploration`
- **Propósito**: Sistema de rotación de roles para que el equipo explore diferentes skills
- **Datos que consume**:
  - Roles disponibles (`roles`)
  - Miembros y sus skills actuales (`members`, `skills`)
  - Historial de rotaciones (`role_rotations`)
  - Feedback de cada rotación
- **Onboarding types**: Todos (equipos en formación)
- **Modo trabajo**: Team
- **Por qué es útil**: En early-stage, todos hacen de todo. Esto sistematiza la exploración para que el equipo descubra sus fortalezas.
- **Alineada con**: Camino a Master (desarrollo profesional), Rotación (gestión de turnos)
- **Requiere plan**: ❌ Free

### 4.2 Camino a Master
- **Ruta**: `/proyecto/:projectId/path-to-master`
- **Propósito**: Sistema de progresión profesional desde Junior hasta Master
- **Datos que consume**:
  - Learning paths personalizados (`learning_paths`)
  - Skill checkpoints (`skill_checkpoints`)
  - Certificaciones (`achievements`)
  - Feedback de 1-on-1s
  - Progreso hacia Master (`master_progress`)
- **Onboarding types**: Todos
- **Modo trabajo**: Individual + Team (progress visible)
- **Por qué es útil**: Convierte trabajar en un startup en un camino profesional claro. Sabes qué aprender para llegar a Master.
- **Alineada con**: Mi Desarrollo (vista individual), Rankings (comparación con equipo)
- **Requiere plan**: ❌ Free (básico), 🔒 Pro (AI-generated paths)
- **Niveles**:
  - Junior (0-6 meses)
  - Mid (6-18 meses)
  - Senior (18-36 meses)
  - Master (36+ meses)

### 4.3 Rankings
- **Ruta**: `/proyecto/:projectId/rankings`
- **Propósito**: Leaderboard del equipo por skills, OBVs completados, contribuciones
- **Datos que consume**:
  - Skills adquiridas por miembro
  - OBVs completados
  - Tareas finalizadas
  - Quality scores
  - Peer feedback
- **Onboarding types**: Todos
- **Modo trabajo**: Team
- **Por qué es útil**: Gamifica el progreso. Crea competencia sana y visibilidad de quién está creciendo más rápido.
- **Alineada con**: Camino a Master (progreso individual), Masters (objetivo aspiracional)
- **Requiere plan**: ❌ Free

### 4.4 Masters
- **Ruta**: `/proyecto/:projectId/masters`
- **Propósito**: Hall of Fame de los miembros que llegaron a nivel Master
- **Datos que consume**:
  - Miembros con nivel Master
  - Sus skills certificadas
  - Proyectos que lideraron
  - Mentees que han ayudado
  - Badges especiales
- **Onboarding types**: Todos
- **Modo trabajo**: Team (inspiracional)
- **Por qué es útil**: Reconocimiento público a los que llegaron al top. Motiva al resto del equipo.
- **Alineada con**: Camino a Master (aspiración), Rankings (visibilidad)
- **Requiere plan**: ❌ Free

### 4.5 Rotación
- **Ruta**: `/proyecto/:projectId/rotacion`
- **Propósito**: Gestión de turnos y rotaciones de responsabilidades
- **Datos que consume**:
  - Schedules de rotación (`rotation_schedules`)
  - Disponibilidad de miembros
  - Roles a cubrir
  - Historial de asignaciones
- **Onboarding types**: Todos (equipos en operación)
- **Modo trabajo**: Team
- **Por qué es útil**: Automatiza la rotación de responsabilidades (ej: quién hace support esta semana, quién lidera el sprint, etc.)
- **Alineada con**: Exploración de Roles (parte del sistema de rotación)
- **Requiere plan**: ❌ Free

---

## 📊 5. MEDIR (3 subsecciones)

**Propósito**: Analytics y métricas avanzadas.

### 5.1 KPIs
- **Ruta**: `/proyecto/:projectId/kpis`
- **Propósito**: Gestión de KPIs del proyecto (no financieros)
- **Datos que consume**:
  - KPIs definidos (`kpis`)
  - Valores históricos (`kpi_values`)
  - Targets vs actual
  - Trends
  - Alerts de red flags
- **Onboarding types**: Todos (especialmente Existing)
- **Modo trabajo**: Team
- **Por qué es útil**: Define y trackea las métricas que importan (ej: DAU, retention, NPS, etc.)
- **Alineada con**: Centro OBVs (OBVs tienen KPIs asociados), Startup OS (financial KPIs)
- **Requiere plan**: ❌ Free

### 5.2 Analytics
- **Ruta**: `/proyecto/:projectId/analytics`
- **Propósito**: Analytics avanzados con ML predictions y anomaly detection
- **Datos que consume**:
  - Todas las métricas del proyecto
  - User behavior analytics
  - Funnel analysis
  - Cohort analysis
  - Churn predictions (ML)
  - Growth forecasts
- **Onboarding types**: Existing (con data histórica)
- **Modo trabajo**: Founders/Data team
- **Por qué es útil**: Análisis profundo con IA para predecir churn, forecasts de crecimiento, y detectar anomalías.
- **Alineada con**: Startup OS (métricas operativas), KPIs (métricas específicas)
- **Requiere plan**: 🔒 Advanced (feature premium)

### 5.3 Vista Global (Team Performance)
- **Ruta**: `/proyecto/:projectId/team-performance`
- **Propósito**: Dashboard de performance del equipo completo
- **Datos que consume**:
  - Productividad por miembro
  - Velocity del equipo
  - Burndown charts
  - Skills coverage
  - Colaboración metrics
  - Feedback trends
- **Onboarding types**: Todos (equipos establecidos)
- **Modo trabajo**: Leadership
- **Por qué es útil**: Vista de CEO/CTO del performance del equipo. Identifica bottlenecks y skills gaps.
- **Alineada con**: Rankings (individual performance), Analytics (advanced metrics)
- **Requiere plan**: 🔒 Advanced

---

## ⚙️ 6. SISTEMA (3 subsecciones)

**Propósito**: Configuración y administración.

### 6.1 Configuración
- **Ruta**: `/proyecto/:projectId/settings`
- **Propósito**: Settings del proyecto (no del usuario)
- **Datos que consume**:
  - Project metadata
  - Team settings
  - Permissions
  - Billing (si payments enabled)
  - Onboarding type y configuración
- **Onboarding types**: Todos
- **Modo trabajo**: Admin/Owner
- **Por qué es útil**: Gestiona configuración del proyecto, permisos, miembros, etc.
- **Alineada con**: Proyectos (lista de proyectos)
- **Requiere plan**: ❌ Free

### 6.2 Integraciones
- **Ruta**: `/proyecto/:projectId/integrations`
- **Propósito**: Conectar servicios externos (Slack, GitHub, Stripe, etc.)
- **Datos que consume**:
  - Integrations configuradas (`integrations`)
  - API keys
  - Webhooks
  - Sync status
- **Onboarding types**: Existing (con herramientas existentes)
- **Modo trabajo**: Admin/Tech lead
- **Por qué es útil**: Centraliza datos de todas tus herramientas en un solo lugar.
- **Alineada con**: Analytics (datos de integraciones), API Access (para custom integrations)
- **Requiere plan**: 🔒 Advanced (API access)
- **Integraciones disponibles**:
  - Slack (notificaciones)
  - GitHub (commits, PRs)
  - Stripe (pagos)
  - Google Analytics
  - HubSpot/Salesforce
  - Zapier (custom workflows)

### 6.3 Notificaciones
- **Ruta**: `/proyecto/:projectId/notificaciones`
- **Propósito**: Centro de notificaciones y alertas
- **Datos que consume**:
  - Notificaciones (`notifications`)
  - Alerts de KPIs
  - Tareas asignadas
  - Menciones
  - Updates del equipo
- **Onboarding types**: Todos
- **Modo trabajo**: Individual
- **Por qué es útil**: No te pierdas nada importante. Notificaciones inteligentes basadas en tus prioridades.
- **Alineada con**: Mi Espacio (tareas), Dashboard (overview)
- **Requiere plan**: ❌ Free

---

## 📋 RESUMEN DE PLANES

### ❌ FREE (Todo disponible en modo preview)
- Core completo (Dashboard, Mi Espacio, Mi Desarrollo)
- Proyectos básicos
- Centro OBVs
- CRM (50 leads)
- Financiero básico
- Equipo completo (Exploration, Paths, Rankings, Masters, Rotación)
- KPIs
- Configuración y Notificaciones

### 🔒 STARTER
- ✅ Todo lo de Free
- AI features:
  - Generative Onboarding
  - AI Lead Finder
  - AI Task Generation

### 🔒 PRO
- ✅ Todo lo de Starter
- CRM (500 leads)
- Meeting Intelligence (10 meetings/month)
- AI SWOT Analysis
- Financial Projections
- AI-generated Learning Paths

### 🔒 ADVANCED
- ✅ Todo lo de Pro
- Startup OS completo (AI Advisor + Competitor Intelligence)
- Analytics avanzados
- Vista Global (Team Performance)
- Integraciones
- Meeting Intelligence (unlimited)
- Financial multi-currency

### 🔒 ENTERPRISE
- ✅ Todo lo de Advanced
- Custom limits
- White label
- Custom domain
- Priority support
- API access completo
- Custom integrations

---

## 🔄 FLUJO POR ONBOARDING TYPE

### Generative (Sin idea clara)
**Flow**: Generative Onboarding → Validaciones → Centro OBVs → Startup OS → Team

**Secciones clave**:
1. Generative Onboarding (IA propone 3 ideas)
2. Validaciones (validar la idea elegida)
3. Startup OS (operaciones)
4. Exploración de Roles (formar equipo)
5. Mi Desarrollo (cada uno crece profesionalmente)

### Idea (Tengo una idea)
**Flow**: Validaciones → Centro OBVs → CRM → Startup OS → Team

**Secciones clave**:
1. Validaciones (SWOT vs competidores)
2. Centro OBVs (definir objetivos)
3. CRM (conseguir primeros clientes)
4. Financiero (track revenue)
5. Camino a Master (profesionalizar)

### Existing (Startup operando)
**Flow**: Startup OS → Analytics → Team Performance → Optimization

**Secciones clave**:
1. Startup OS (health check)
2. Financiero (cash flow management)
3. Analytics (growth insights)
4. Vista Global (team performance)
5. Meeting Intelligence (decision tracking)

---

## 💡 CONCLUSIÓN

**La app está diseñada como un "Operating System for Startups"** que cubre TODO el ciclo de vida:
- **Ideación** (Generative Onboarding)
- **Validación** (Validaciones, Centro OBVs)
- **Ejecución** (Startup OS, CRM, Financiero, Meetings)
- **Team Building** (Exploration, Paths, Rankings, Masters)
- **Growth** (Analytics, Team Performance)
- **Operations** (Settings, Integrations, Notifications)

**Cada sección está conectada con las demás** para que los datos fluyan automáticamente (ej: insights de Meeting Intelligence → tareas en Mi Espacio → progreso en OBVs → métricas en Startup OS).

**En modo preview (ENABLE_PAYMENTS = false)**: TODAS las funcionalidades están disponibles sin restricciones. Ideal para testing con conocidos antes de monetizar.
