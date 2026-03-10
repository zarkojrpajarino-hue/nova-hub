# SCENARIO MAP — Optimus-K
> Los 9 escenarios de usuario y cómo cada una de las 223 features se activa, oculta o está disponible para cada uno.
> Este documento define la experiencia completa de cada tipo de usuario.
> Última actualización: 2026-02-24

---

## CÓMO LEER ESTE DOCUMENTO

**Roles de feature por escenario:**
- 🔴 **CORE** — Mostrada en el sidebar, presentada en el onboarding del escenario, parte del loop semanal. El usuario la ve siempre.
- 🟡 **AVAILABLE** — Accesible si el usuario la busca, pero no destacada en la navegación principal. Puede aparecer en configuración o vistas secundarias.
- ⚫ **HIDDEN** — Completamente ausente de la UI. El usuario no la ve, no puede acceder a ella. Se activa si el usuario cambia de escenario.

**Los 9 escenarios:**

| ID | Nombre | Etapa | Modo | Business type |
|---|---|---|---|---|
| A1 | El Explorador Solo | A — Sin idea | Solo | Ninguno todavía |
| A2 | Los Co-founders Sin Rumbo | A — Sin idea | Equipo | Ninguno todavía |
| B1 | Validador Digital Solo | B — Con idea | Solo | Digital (SaaS/app/contenido) |
| B2 | Validador de Servicios Solo | B — Con idea | Solo | Servicios (consultoría/freelance) |
| B3 | Equipo Validador | B — Con idea | Equipo | Cualquiera |
| C1 | Solo Founder con Tracción | C — Startup | Solo | Cualquiera |
| C2 | Equipo Early Stage | C — Startup | Equipo | PMF phase |
| C3 | Equipo en Crecimiento | C — Startup | Equipo | Scaling |
| C4 | Equipo Maduro / Enterprise | C — Startup | Equipo | Consolidado / multi-producto |

**El loop semanal de 6 acciones:**
1. Agenda
2. Tareas
3. OBVs / CRM
4. KPIs / OKRs
5. Finanzas
6. Progreso personal

---

# PARTE 1 — DEFINICIÓN DE ESCENARIOS

---

## ESCENARIO A1 · El Explorador Solo

### Persona
Juan, 29 años, trabaja en una empresa de marketing. Lleva meses pensando en crear algo propio pero no sabe qué. Tiene 10-15 horas semanales, algo de ahorro (3-6 meses de runway si sale mal), y ganas de explorar antes de comprometerse. No tiene co-founder.

### Pain principal
"Quiero emprender pero no sé qué hacer. Tengo decenas de ideas vagas pero ninguna concreta. Me paralizo antes de empezar."

### Goal
Encontrar una idea de negocio que encaje con sus skills, tiempo y recursos. Pasar de parálisis a primera validación.

### Estado de éxito
Tener una idea concreta seleccionada, un primer plan de validación generado por IA, y haber tenido las primeras 3 conversaciones con potenciales clientes.

### Loop semanal adaptado para A1

| Acción | Qué hace Juan |
|---|---|
| 1. Agenda | Revisa las tareas de exploración de la semana. ¿A quién entrevistar? ¿Qué competidor investigar? ¿Qué recurso leer? |
| 2. Tareas | Ejecuta investigación: habla con personas, investiga mercados, prueba herramientas del sector. |
| 3. OBVs/CRM | **NO APLICA** — No tiene negocio todavía. Se convierte en "Conversaciones de exploración" (máx 5). |
| 4. KPIs/OKRs | Simple: "Esta semana tuve 3 conversaciones con potenciales usuarios". Métricas de exploración. |
| 5. Finanzas | **NO APLICA** — No hay ingresos ni gastos de negocio. |
| 6. Progreso | Completa módulos del Learning Path sobre emprendimiento, validación de ideas, research. |

### Primeras 4 semanas

**Semana 1 — Discovery:**
- Discovery path onboarding (12 preguntas sobre situación, skills, motivaciones)
- Recibe perfil de emprendedor + 3-5 ideas con fit score
- Elige o refina una idea
- La IA genera tareas de exploración iniciales para la semana

**Semana 2 — Investigación:**
- Investiga los competidores de la idea elegida (F041)
- Completa el buyer persona básico (N59)
- Realiza las primeras 2-3 entrevistas de descubrimiento

**Semana 3 — Refinamiento:**
- SWOT generado con IA (F043) con datos reales de los competidores investigados
- Refina la idea según los aprendizajes
- Primeras conversaciones con potenciales clientes registradas

**Semana 4 — Decisión:**
- Evalúa si seguir con esta idea o explorar otra
- Si sigue → pasa a etapa B (Validador)
- Si no → repite ciclo con nueva idea de la DB de ideas curadas

### Features por módulo

**🔴 CORE — Siempre visible, parte central de la experiencia**
- F001-F004 (Auth completa)
- F006 (Selección de perfil — elige "Sin Idea")
- F007 (Onboarding generativo sin idea)
- N65 (Discovery path — camino de 12 pasos)
- N67 (Curated Ideas Database — base de ideas curadas)
- F010 (Crear primer proyecto)
- F011 (Wizard de onboarding)
- F017 (Flag Solo vs Equipo → selecciona Solo)
- F021 (Weekly Insights — resumen semanal)
- F024 (Kanban de tareas — versión simplificada)
- F025 (Crear tareas manuales)
- F029 (Generar tareas con IA — enfocadas en exploración)
- F041 (Competitor analysis — para investigar la idea)
- F043 (SWOT generator — valida la idea)
- F044 (Market research — entiende el mercado)
- F094 (Learning roadmap — personalizado para explorador)
- F095 (Biblioteca de recursos)
- F096 (Progress tracking — streaks de aprendizaje)
- F093 (Gamification — badges y streaks motivan la consistencia)
- N01 (Dark mode)
- N02 (i18n — idioma de preferencia)
- N03 (Tours interactivos — guían al explorador paso a paso)

**🟡 AVAILABLE — Accesible pero no destacada**
- F012 (Cambio de proyecto — si crea más de uno)
- F013 (Deep Setup — opcional, avanza si quiere más contexto)
- F018 (Sugerencia de agenda IA)
- F023 (Smart Alerts — básicas)
- F025b (Task Swapping — disponible pero raramente usado en A)
- F025c (AI Resources Panel — para cada tarea de exploración)
- F026 (AI Task Executor — para tareas de research)
- F027 (AI Task Router)
- F028 (Feedback loop al completar tareas)
- F042 (Buyer persona generator — básico)
- N57 (AARRR model — educacional, para entender el modelo de crecimiento)
- N64 (Sales Simulator — educacional, para aprender a vender)
- N04 (PWA — instalar en móvil)
- N05 (Keyboard shortcuts)
- N09 (Multi-org — si quiere separar proyectos de exploración)

**⚫ HIDDEN — No existe en la UI de A1**
- F008 (Onboarding Con Idea) — se activa si pasa a B
- F009 (Onboarding Health Score) — solo en C
- F014, F015 (Roles y preguntas por rol) — solo en Equipo
- F016 (4 Fases de negocio) — no tiene negocio todavía
- F020 (Global Agenda con cron) — no tiene equipo
- F022 (Preparación de one-on-one) — solo en equipos
- F030 (Executor + Leader) — solo en equipos
- F031 (Time Tracking) — nivel de complejidad innecesario en A
- F033-F040 (OBV/CRM completo) — no tiene negocio ni pipeline
- F045 (Pitch Deck) — sin negocio definido
- F046 (Playbook generator) — sin procesos definidos
- F047 (Geo-intelligence) — sin mercado objetivo definido
- F049 (Evidence system) — sin hipótesis formales
- F050 (Peer Validation) — solo en equipos
- F051-F063 (KPIs completos y Learning Points) — sin negocio
- F064-F074 (Financiero) — sin ingresos
- F075-F082 (Analytics) — sin datos
- F086-F090 (Masters) — solo en equipos maduros
- F091-F092 (Rankings) — solo en equipos
- F097-F104 (Meetings) — sin equipo
- N10-N14 (Org avanzado + Integrations) — innecesario en A
- N15-N18 (HubSpot, Zapier, API, Webhooks) — nivel enterprise
- N31-N36 (OKR avanzado) — sin OKRs todavía
- N41-N43 (Ratios financieros) — sin finanzas
- N47-N48 (Cohort, Heatmap) — sin datos
- N70-N73 (API Keys, Admin) — solo enterprise

---

## ESCENARIO A2 · Los Co-founders Sin Rumbo

### Persona
Sara y Marcos, amigos de 27 y 30 años. Llevan 3 meses diciendo "deberíamos montar algo juntos" pero no llegan a nada concreto. Tienen energía y buena dinámica entre ellos, pero les falta foco. Cada uno tiene ~8 horas semanales.

### Pain principal
"Tenemos ganas pero no idea. Nos reunimos, hablamos de opciones y no decidimos nada. Se nos pasa el tiempo."

### Goal
Alinearse en una sola idea, dividir el trabajo de exploración entre los dos, y llegar a una decisión conjunta validada.

### Estado de éxito
Decisión unánime sobre una idea + primeras 5 conversaciones con potenciales clientes entre los dos.

### Loop semanal adaptado para A2

| Acción | Qué hacen |
|---|---|
| 1. Agenda | Planifican juntos quién hace qué esta semana. Se dividen las tareas de exploración. |
| 2. Tareas | Cada uno ejecuta sus tareas de investigación de forma independiente. |
| 3. OBVs/CRM | Conversaciones de exploración compartidas — máx 10 entre los dos. |
| 4. KPIs/OKRs | KPI compartido: "Conversaciones realizadas esta semana". |
| 5. Finanzas | No aplica. |
| 6. Progreso | Learning individual + primeras dinámicas de equipo. |

### Diferencias vs A1
- El flag Equipo está activo → se activan funciones colaborativas básicas
- Tareas pueden asignarse entre Sara y Marcos
- Hay un "estado de acuerdo" visible para cada idea explorada
- El onboarding pregunta si prefieren explorar juntos (mismas ideas) o en paralelo (ideas distintas que luego comparan)
- No hay Masters ni Rankings todavía (demasiado early)
- Sí hay actividad compartida en el feed

### Features adicionales vs A1 (A2 tiene todo de A1 +)

**🔴 CORE adicionales en A2:**
- F014 (Generación de roles con IA — para definir quién se enfoca en qué área de exploración)
- F025 (Asignación de tareas entre miembros)
- N09 (Invitación al co-founder al proyecto)

**🟡 AVAILABLE adicionales en A2:**
- F015 (Preguntas de onboarding por rol — básico)
- F020 (Global Agenda — ver qué tiene el otro esta semana)
- N10 (Org Settings — básico)
- N11 (Permisos básicos)

**⚫ Siguen HIDDEN en A2 (mismos que A1 + algunas excepciones):**
- F030 (Executor + Leader) — demasiado early para A
- F050 (Peer Validation) — todavía sin KPIs formales
- F086-F090 (Masters) — sin estructura de equipo formal todavía
- F091-F092 (Rankings) — sin métricas todavía

---

## ESCENARIO B1 · Validador Digital Solo

### Persona
Elena, 32 años, desarrolladora. Tiene una idea para un SaaS de gestión de inventario para pequeñas tiendas. Quiere validar antes de dedicar 6 meses a construirlo. Trabaja sola (no tiene co-founder ni equipo). Tiene ahorros para 4 meses sin ingresos.

### Pain principal
"¿Alguien pagará por esto antes de que lo construya? No quiero pasar meses programando algo que nadie quiera."

### Goal
Conseguir 5+ letras de intención o pre-ventas de potenciales clientes antes de escribir una línea de código.

### Estado de éxito
5 conversaciones de validación con usuarios reales + 3 compromisos escritos de "pagaría X por esto" + hipótesis críticas validadas o refutadas.

### Loop semanal adaptado para B1

| Acción | Qué hace Elena |
|---|---|
| 1. Agenda | Planifica: ¿a quién contactar esta semana? ¿Qué hipótesis validar? ¿Qué contenido/landing preparar? |
| 2. Tareas | Outreach a potenciales usuarios, entrevistas, iteración de la propuesta de valor. |
| 3. OBVs/CRM | **CORE** — Cada conversación es un OBV de tipo `validación`. Tracking de leads calientes. |
| 4. KPIs/OKRs | Entrevistas realizadas, tasa de interés ("¿pagarías?"), NPS del concepto (0-10). |
| 5. Finanzas | Básico — registra pre-ventas si las hay. |
| 6. Progreso | Aprende sobre ventas, validación de hipótesis, técnicas de outreach. |

### Primeras 4 semanas

**Semana 1 — Setup y primeras hipótesis:**
- Completa onboarding "Con Idea" (F008): describe la idea, mercado, competidores
- La IA genera SWOT (F043) y roadmap de validación (F046)
- Define las 3 hipótesis críticas (F049 — Evidence System)
- La IA genera tareas de la semana: "habla con 5 tiendas pequeñas", "busca grupos de Facebook de dueños de tiendas", "crea landing mínima"

**Semana 2 — Primeras conversaciones:**
- Primer outreach vía email pitch generado por IA (F038)
- Registra los primeros OBVs de validación (F033)
- Mapea las objeciones encontradas

**Semana 3 — Iteración:**
- Ajusta el mensaje según el feedback
- La IA puntúa los OBVs y señala los leads más calientes (F037)
- Actualiza las hipótesis según evidencias (F049)

**Semana 4 — Decisión:**
- Revisa el estado de las hipótesis: ¿validadas, refutadas, o sin datos?
- Si tiene 3+ compromisos → pasa a construir (etapa C early)
- Si no → pivota o busca nuevo segmento

### Features por módulo

**🔴 CORE:**
- F001-F004 (Auth)
- F006 (Perfil — elige "Tengo una idea")
- F008 (Onboarding Con Idea — SWOT + roadmap de validación)
- F010, F011 (Crear proyecto + Wizard)
- F016 (4 Fases de negocio — define en qué fase está)
- F017 (Flag Solo)
- F018 (Sugerencia de agenda IA)
- F021 (Weekly Insights)
- F023 (Smart Alerts)
- F024 (Kanban de tareas)
- F025 (Crear tareas)
- F025b (Task Swapping)
- F026 (AI Task Executor)
- F027 (AI Task Router)
- F028 (Feedback loop)
- F029 (AI gen tareas)
- F032 (OBV list)
- F033 (OBV wizard — tipo validación)
- F034 (OBV stages)
- F035 (Pipeline Kanban)
- F036 (CRM contacts)
- F038 (Email pitch generator — para outreach de validación)
- F041 (Competitor analysis)
- F042 (Buyer persona generator)
- F043 (SWOT generator)
- F044 (Market research)
- F046 (Playbook generator — playbook de validación)
- F049 (Evidence system — hipótesis con nivel de evidencia)
- F051-F055 (KPIs básicos — aprobación/rechazo validaciones)
- F094 (Learning roadmap — validación + ventas)
- F095 (Biblioteca de recursos)
- F096 (Progress tracking)
- F093 (Gamification)
- N57 (AARRR — entiende el modelo de crecimiento)
- N59 (Buyer Persona Builder — perfil del cliente ideal)
- N64 (Sales Simulator — practica el pitch de validación)
- N65 (Startup onboarding path — 9 pasos)

**🟡 AVAILABLE:**
- F013 (Deep Setup — si quiere más contexto)
- F019 (Google Calendar)
- F025c (AI Resources Panel)
- F037 (AI Lead Scoring — básico)
- F039 (Sales Briefing)
- F040 (AI follow-up)
- F045 (Pitch Deck — básico)
- F047 (Geo-intelligence)
- F056-F063 (KPIs formales — básicos, sin peer validation)
- F064-F074 (Financiero — básico, para pre-ventas)
- N03 (Tours)
- N04 (PWA)
- N58 (Customer Journey Map)
- N60 (Product Roadmap visual)

**⚫ HIDDEN:**
- F007 (Onboarding Sin Idea) — ya tiene idea
- F009 (Onboarding Health Score) — solo en C
- F014, F015 (Roles — sin equipo)
- F020 (Global Agenda cron) — sin equipo
- F022 (One-on-one prep) — sin equipo
- F030 (Executor + Leader) — sin equipo
- F031 (Time Tracking) — no prioritario en validación
- F050 (Peer Validation) — sin equipo
- F075-F082 (Analytics avanzados) — sin datos suficientes
- F086-F090 (Masters) — sin equipo
- F091-F092 (Rankings) — sin equipo
- F097-F104 (Meetings Intel) — sin equipo
- N15, N16 (HubSpot, Zapier) — nivel enterprise
- N17, N18 (API, Webhooks) — nivel enterprise
- N31-N36 (OKRs avanzados) — aún en validación
- N41-N43 (Ratios financieros) — sin ingresos
- N44-N45 (Debt, Finance sync) — sin estructura financiera
- N47-N48 (Cohort, Heatmap) — sin suficientes datos
- N67 (Curated Ideas) — ya tiene idea
- N70-N73 (API Keys, Admin) — solo enterprise

---

## ESCENARIO B2 · Validador de Servicios Solo

### Persona
Carlos, 35 años, consultor de marketing en una agencia. Quiere ofrecer servicios de marketing digital directamente a PYMEs sin intermediarios. Su producto = él mismo. No necesita construir nada, solo conseguir clientes.

### Pain principal
"Sé hacer marketing, pero no sé venderme. Tengo miedo al rechazo. No sé cómo estructurar una propuesta ni a quién contactar primero."

### Goal
Conseguir sus primeros 3 clientes de pago en los próximos 60 días.

### Estado de éxito
3 clientes activos pagando, pipeline de 10+ leads activos, proceso de ventas documentado.

### Loop semanal adaptado para B2

| Acción | Qué hace Carlos |
|---|---|
| 1. Agenda | Planifica: ¿cuántos outreaches esta semana? ¿A qué vertical? ¿Qué propuestas enviar? |
| 2. Tareas | Escribe propuestas, hace follow-ups, investiga empresas objetivo. |
| 3. OBVs/CRM | **CORE** — Cada PYMA potencial es un OBV de tipo `venta`. Kanban de pipeline. |
| 4. KPIs/OKRs | Outreaches enviados, reuniones conseguidas, propuestas enviadas, cierres. |
| 5. Finanzas | Registra los primeros ingresos, controla cobros. |
| 6. Progreso | Aprende sobre ventas B2B de servicios, propuestas de valor. |

### Diferencias clave vs B1
- El OBV principal es tipo **`venta`** (no validación) desde el principio — ya sabe lo que ofrece
- El CRM es más activo: más leads, más rápido, más volumen de outreach
- El Email Pitch Generator (F038) es CORE y se usa masivamente
- Las finanzas son activas desde semana 2-3 (primeros cobros)
- El foco es en técnicas de venta y propuesta, no en validación de hipótesis
- El Evidence System (F049) no es tan relevante — no valida hipótesis, valida clientes
- El Sales Simulator (N64) es CORE — practica el manejo de objeciones

### Features adicionales vs B1

**🔴 CORE que en B1 eran AVAILABLE (o distintos):**
- OBV tipo `venta` como principal (B1 usaba `validación`)
- F038 (Email Pitch) — mucho más activo, múltiples pitches por semana
- F039 (Sales Briefing por empresa) — investiga cada cliente antes de contactar
- F040 (AI Follow-up) — secuencias automáticas de seguimiento
- F047 (Geo-intelligence) — para identificar PYMEs en zonas específicas
- N64 (Sales Simulator) — práctica intensiva
- F064-F074 (Financiero básico) — desde semana 3, cuando llegan los primeros cobros

**🟡 AVAILABLE en B2 pero no en B1:**
- F049 (Evidence System) — menos relevante en servicios, pero disponible
- N57 (AARRR) — útil para entender el modelo de crecimiento

**⚫ Siguen HIDDEN igual que B1**

---

## ESCENARIO B3 · Equipo Validador

### Persona
Ana (CEO, estrategia), Pedro (tech/producto) y Laura (marketing). Tres personas, idea de SaaS B2B para gestión de proyectos en empresas de construcción. Cada uno tiene ~20 horas semanales. Llevan 2 semanas juntos.

### Pain principal
"Somos tres personas con skills distintos. ¿Cómo coordinamos sin que nadie pise el trabajo del otro? ¿Cómo medimos si estamos avanzando?"

### Goal
Validar el problema, el mercado y el modelo de ingresos con datos reales antes de construir. Dividir el trabajo de validación eficientemente.

### Estado de éxito
10+ entrevistas de validación, 5+ compromisos de pago pre-venta, roles definidos y equipo coordinado.

### Loop semanal adaptado para B3

| Acción | Qué hace el equipo |
|---|---|
| 1. Agenda | Reunión de planificación semanal (30 min). Ana asigna tareas según rol. |
| 2. Tareas | Ana → estrategia + pitch deck. Pedro → demo técnica. Laura → outreach + contenido. Executor+Leader en todas las tareas. |
| 3. OBVs/CRM | Pipeline compartido. Laura lleva el outreach, Ana cierra las reuniones. |
| 4. KPIs/OKRs | KPIs individuales por rol + OKR compartido de equipo. |
| 5. Finanzas | Básico — tracking de pre-ventas. |
| 6. Progreso | Learning individual + primeras dinámicas de equipo (sin Masters todavía en B). |

### Features adicionales vs B1/B2

**🔴 CORE adicionales en B3:**
- F014 (Generación de roles con IA — tres roles definidos)
- F015 (Preguntas de onboarding por rol — onboarding personalizado por persona)
- F030 (Executor + Leader — todas las tareas tienen ejecutor y validador)
- F050 (Peer Validation — validación de KPIs entre miembros)
- F020 (Global Agenda — ver disponibilidad de todo el equipo)
- N09 (Invitación a miembros del equipo)
- N11 (Permisos por rol)
- N31 (OKR Check-ins semanales)

**🟡 AVAILABLE adicionales en B3:**
- F022 (One-on-one prep — básico, para reuniones entre Ana y cada miembro)
- F086-F090 (Masters) — puede empezar a definir quién es "el experto" en qué, aunque es early
- F091-F092 (Rankings) — básico, para motivación

**⚫ Siguen HIDDEN:**
- N32 (OKR Dependency Map) — demasiado early para B
- N41-N43 (Ratios financieros) — sin suficiente historial
- N47-N48 (Cohort, Heatmap) — sin datos
- F097-F104 (Meetings Intel) — no tienen suficientes reuniones formales

---

## ESCENARIO C1 · Solo Founder con Tracción

### Persona
Miguel, 38 años. Lleva 18 meses con su agencia de automatizaciones con IA para ecommerce. Tiene 12 clientes activos, MRR de 8.500€. Todo el negocio vive en su cabeza: leads en emails, facturas en Excel, tareas en notas de papel. Trabaja 60h/semana y siente que no puede crecer más sin sistemas.

### Pain principal
"Tengo tracción real pero soy el cuello de botella de todo. Si me pongo enfermo, el negocio para. Necesito sistematizar antes de crecer."

### Goal
Sistematizar las operaciones: pipeline de ventas organizado, finanzas controladas, tareas priorizadas, KPIs medibles.

### Estado de éxito
Pipeline CRM con todos los leads activos, finanzas actualizadas con proyecciones a 6 meses, KPIs clave definidos y medidos semanalmente.

### Loop semanal adaptado para C1

| Acción | Qué hace Miguel |
|---|---|
| 1. Agenda | Revisa Weekly Insights automáticos. Prioriza las 5 cosas más importantes de la semana. |
| 2. Tareas | Ejecuta en todas las áreas: ventas, entrega de servicio, producto, operaciones. AI Task Executor para tareas repetitivas. |
| 3. OBVs/CRM | Pipeline completo: cold → warm → propuesta → cierre. 3-5 nuevos leads por semana. |
| 4. KPIs/OKRs | MRR, churn, NPS, CAC, LTV/CAC ratio. OKRs trimestrales propios. |
| 5. Finanzas | Cash flow semanal, colecciones pendientes, proyecciones a 90 días. |
| 6. Progreso | Aprende sobre gestión de negocios, automatización, escalado en solitario. |

### Features por módulo

**🔴 CORE:**
- F001-F004, F006, F009 (Auth + Onboarding Health Score)
- F010-F013 (Proyecto + Deep Setup — ahora sí llena los 25 pasos)
- F016-F018 (Fases + Solo flag + Agenda IA)
- F021-F023 (Weekly Insights + Smart Alerts)
- F024-F029 (Kanban completo + AI Task Executor)
- F025b, F025c (Swap + Resources)
- F032-F040 (OBV/CRM completo — tipo `venta` principalmente)
- F041-F047 (Todos los AI de CRM: lead scoring, pitch, briefing, follow-up, SWOT, market, geo)
- F049 (Evidence System — para hipótesis de crecimiento)
- F056-F063 (KPIs completos — define y mide sus métricas clave)
- F064-F074 (Financiero completo: cash flow, colecciones, deuda, proyecciones)
- F075-F082 (Analytics: benchmarking, radar, evolución temporal, predict)
- F094-F096 (Learning + Progress)
- F093 (Gamification)
- N31 (OKR Check-ins)
- N41 (Financial Ratios — LTV/CAC, payback, márgenes)
- N57 (AARRR — modelo de crecimiento)
- N59 (Buyer Persona Builder)

**🟡 AVAILABLE:**
- F019 (Google Calendar)
- F031 (Time Tracking — útil para calcular coste por cliente)
- F045 (Pitch Deck)
- F046 (Playbook)
- N04 (PWA)
- N32 (OKR Dependency Map — solo, pero puede visualizar sus propias dependencias)
- N42 (Product Profitability — si tiene varios servicios)
- N43 (Advanced FP&A)
- N58 (Customer Journey)
- N60 (Product Roadmap)
- N64 (Sales Simulator — para mejorar técnica de cierre)

**⚫ HIDDEN:**
- F014, F015 (Roles — sin equipo)
- F020 (Global Agenda cron — sin equipo)
- F022 (One-on-one) — sin equipo
- F030 (Executor + Leader) — sin equipo
- F050 (Peer Validation) — sin equipo
- F086-F090 (Masters) — sin equipo
- F091-F092 (Rankings) — sin equipo
- F097-F104 (Meetings Intel) — sin equipo formal
- N09-N11 (Org avanzado) — sin equipo
- N15-N18 (HubSpot, Zapier, API, Webhooks) — aún no prioridad
- N47-N48 (Cohort, Heatmap) — sin suficientes datos por usuario
- N70-N73 (Admin/API Keys) — solo enterprise

---

## ESCENARIO C2 · Equipo Early Stage

### Persona
Startup de 5 personas (CEO, CTO, Sales, Marketing, Customer Success). 80 clientes, MRR de 22.000€. Han encontrado product-market fit pero empiezan a perder velocidad: confusión de roles, duplicación de trabajo, falta de alineación estratégica.

### Pain principal
"Crecemos pero perdemos eficiencia. El equipo no está alineado. Los objetivos están en la cabeza del CEO, no en un sistema compartido."

### Goal
Sistematizar la ejecución de todo el equipo: OKRs compartidos, roles claros, pipeline unificado, finanzas controladas.

### Estado de éxito
Equipo operando autónomamente con el sistema semanal, OKRs de trimestre definidos y medidos, pipeline de ventas unificado, finanzas actualizadas.

### Loop semanal adaptado para C2

| Acción | Qué hace el equipo |
|---|---|
| 1. Agenda | Weekly planning (CEO convoca). Cada miembro reporta el estado de sus OKRs. Smart Alerts revisadas. |
| 2. Tareas | Especialización por rol. Executor + Leader en todas las tareas críticas. |
| 3. OBVs/CRM | Pipeline de ventas compartido. Sales lleva los leads, Customer Success los retiene. |
| 4. KPIs/OKRs | OKRs de empresa + KPIs individuales por rol. Check-ins semanales. |
| 5. Finanzas | Cash flow, burn rate, MRR tracking, proyecciones. |
| 6. Progreso | Masters system activo. Rankings. One-on-ones semanales. |

### Features por módulo

**🔴 CORE:**
- Todo lo de C1 (como base)
- F014, F015 (Roles + preguntas por rol — onboarding de cada miembro)
- F020 (Global Agenda del equipo)
- F022 (Preparación one-on-one — CEO hace 1:1 con cada miembro)
- F030 (Executor + Leader)
- F050 (Peer Validation)
- F086-F090 (Masters — empieza a definir quién es experto en qué)
- F091-F092 (Rankings — motiva al equipo)
- F097-F104 (Meetings Intelligence — todas las reuniones grabadas y analizadas)
- N09-N11 (Org settings + permisos por rol)
- N31-N33 (OKR Check-ins + Dependency Map + Retrospective)
- N35 (OKR Contribution view — quién está contribuyendo a qué OKR)

**🟡 AVAILABLE:**
- N12-N14 (Trello, Asana, Outlook integrations)
- N15, N16 (HubSpot, Zapier — si tienen CRM previo)
- N17, N18 (REST API, Webhooks — para integraciones básicas)
- N41-N43 (Ratios financieros, FP&A)
- N42 (Product Profitability)
- N44, N45 (Debt tracking, Multi-source finance)
- N46 (AI Beta Testers)
- N47 (Cohort Analysis — si tienen suficientes datos)
- N48 (Admin Heatmap)
- N34 (OKR Coaching IA)
- N36 (OKR Analytics)
- N60-N63 (Educational tools para el equipo)

**⚫ HIDDEN:**
- N67 (Curated Ideas) — ya tienen negocio definido
- N65 (Discovery Onboarding) — ya superado
- N07 (Multi-org) — todavía una sola organización
- N70 (API Keys) — no es C3/C4 todavía
- N72, N73 (Admin avanzado) — para C3+

---

## ESCENARIO C3 · Equipo en Crecimiento

### Persona
Startup de 12 personas. MRR de 85.000€. Product-market fit claro, ahora en fase de escalar: entrando en nuevos mercados, ampliando producto, posibles primeros managers. El CEO ya no puede estar en todo.

### Pain principal
"Crecemos rápido pero perdemos calidad. Los nuevos mercados tienen dinámicas distintas. Necesito visibilidad total sin estar en cada reunión."

### Goal
Escalar con control: analytics avanzados, benchmarks vs industria, procesos maduros, equipo autónomo.

### Estado de éxito
Dashboard ejecutivo con todas las métricas clave. Equipo funcionando autónomamente. KPIs vs benchmarks de industria favorables.

### Diferencias vs C2 — features adicionales

**🔴 CORE adicionales en C3:**
- N41 (Financial Ratios) — ahora sí es crítico: LTV/CAC, payback, márgenes por producto
- N43 (Advanced FP&A) — proyecciones más sofisticadas con escenarios
- N47 (Cohort Analysis) — con volumen de clientes suficiente, esto es estratégico
- N48 (Admin Heatmap) — el CEO ve dónde trabaja cada área y detecta cuellos de botella
- N36 (OKR Analytics) — análisis histórico de OKRs para mejorar próximo trimestre
- N37 (KPI Benchmark vs Industria) — comparar métricas con el sector
- N17, N18 (REST API, Webhooks) — integraciones con sistemas externos

**🟡 AVAILABLE adicionales en C3:**
- N07, N08 (Multi-org, Org Switcher) — si empiezan expansión multi-mercado
- N70 (API Keys management) — para partners y integraciones enterprise
- N15, N16 (HubSpot, Zapier) — ahora son prioritarias para automatizar
- N44, N45 (Debt tracking, Multi-source finance)

**⚫ Siguen HIDDEN:**
- N67 (Curated Ideas), N65 (Discovery path)
- Features de etapa A y B que ya superaron

---

## ESCENARIO C4 · Equipo Maduro / Enterprise

### Persona
Empresa de 30+ personas. Múltiples productos o mercados. Revenue significativo (>200k€ MRR). Posibles inversores o Series A. Necesitan governance, control y transparencia a nivel empresa.

### Pain principal
"La complejidad es enorme. Diferentes equipos, diferentes productos, diferentes mercados. Necesito una capa estratégica que unifique todo."

### Goal
Gestión estratégica enterprise: multi-org, API integrations, governance, reporting ejecutivo.

### Estado de éxito
Plataforma integrada con todos los sistemas de la empresa, reporting automático para board, equipo autónomo por departamento.

### Diferencias vs C3 — features adicionales

**🔴 CORE adicionales en C4:**
- N07, N08 (Multi-org + Org Switcher) — gestionar múltiples unidades de negocio
- N70 (API Keys) — integrar con sistemas enterprise (ERP, BI, Data Warehouse)
- N71-N73 (Admin Settings, Heatmap avanzado, Webhooks) — governance completo
- N17, N18 (REST API, Webhooks) — integraciones bidireccionales con ecosistema
- N15, N16 (HubSpot, Zapier) — automatización total de workflows

**🟡 AVAILABLE en C4:**
- N69 (Subscription UI) — gestión de planes y facturación de la propia plataforma
- N46 (AI Beta Testers) — programa de beta testers para nuevas features

---

# PARTE 2 — MATRIZ DE REFERENCIA RÁPIDA

> Clave: 🔴 CORE | 🟡 AVAILABLE | ⚫ HIDDEN

## Módulo 1 — Autenticación

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F001 Login email/pass | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F002 Signup + email verify | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F003 Reset contraseña | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F004 Gestión de sesión | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F005 Roles admin/tlt/member | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🟡 | 🔴 | 🔴 | 🔴 |

## Módulo 2 — Onboarding y Setup

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F006 Selección de perfil (3 tipos) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F007 Onboarding Sin Idea | 🔴 | 🔴 | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ |
| F008 Onboarding Con Idea | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | ⚫ | ⚫ | ⚫ | ⚫ |
| F009 Onboarding Health Score | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 |
| F010 Crear primer proyecto | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F011 Wizard onboarding completo | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F012 Selección y cambio de proyecto | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F013 Deep Setup (25 secciones) | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F014 Generación de roles con IA | ⚫ | 🟡 | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F015 Preguntas onboarding por rol | ⚫ | 🟡 | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F016 4 Fases de negocio con IA | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F017 Flag Solo vs Equipo | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 3 — Agenda y Planificación

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F018 Sugerencia agenda IA | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F019 Google Calendar OAuth | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| F020 Global Agenda con cron | ⚫ | 🟡 | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F021 Weekly Insights con IA | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F022 Preparación one-on-one IA | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F023 Smart Alerts | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 4 — Tareas

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F024 Kanban de tareas (4 estados) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F025 Creación de tareas manuales | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F025b Task Swapping con IA | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F025c AI Resources Panel | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| F026 AI Task Executor | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F027 AI Task Router | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F028 Preguntas de completitud | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F029 Generación de tareas IA | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F030 Executor + Leader | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F031 Time Tracking | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |

## Módulo 5 — OBV / CRM

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F032 OBV List + filtros | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F033 OBV Wizard creación | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F034 OBV Stages (6 fases) | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F035 Pipeline Kanban | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F036 CRM Contacts | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F037 AI Lead Scoring | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F038 Email Pitch Generator | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F039 Sales Briefing por empresa | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F040 AI Follow-up automático | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F041 Competitor Analysis | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F042 Buyer Persona Generator | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| F043 SWOT Generator | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F044 Market Research IA | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F045 Pitch Deck Generator | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| F046 Playbook Generator | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F047 Geo-Intelligence | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F048 OBV Types (validación/venta/exploración) | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 6 — Evidencia y Validación

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F049 Evidence System (3 niveles) | ⚫ | ⚫ | 🔴 | 🟡 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 |
| F050 Peer Validation (rotación) | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F051 KPI Registry | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F052 KPI Approval Flow | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F053 KPI Deadline Tracking | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F054 Validator Stats | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| F055 Learning Points (LP/BP/CP) | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 7 — KPIs y OKRs

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F056 KPI Dashboard | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F057 OKR Creation + KeyResults | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F058 OKR Progress Tracking | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F059 OKR Histórico | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F060 Learning Path (LP) Tracking | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F061 Book Points (BP) | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F062 Community Points (CP) | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F063 KPI Prediction IA | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 8 — Financiero

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F064 Cash Flow Tracker | ⚫ | ⚫ | 🟡 | 🔴 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F065 Proyecciones Financieras IA | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F066 Colecciones y cobros | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F067 Tracking de deuda | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 |
| F068 Runway Calculator | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F069 MRR / ARR Tracking | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F070 Escenarios financieros (what-if) | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 |
| F071 Ingreso/Gasto categorizado | ⚫ | ⚫ | 🟡 | 🔴 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F072 Financial Health Score | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F073 Stripe Sync | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 |
| F074 Export financiero Excel/CSV | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 9 — Analytics

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F075 Benchmarking Radar | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F076 Performance Temporal | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F077 Predicciones IA | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F078 Rankings de equipo | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F079 Comparativa histórica | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| F080 Growth Insights IA | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| F081 Executive Dashboard | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 |
| F082 Analyze Project v3 (Brutal) | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 10 — Masters

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F086 Maestría — Postulación | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F087 Maestría — Votación | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F088 Maestría — Título + Badge | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F089 Maestría — Desafíos | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F090 Maestría — Mentoring | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 |

## Módulo 11 — Rankings

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F091 Ranking de equipo | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F092 Ranking histórico + evolución | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 |

## Módulo 12 — Gamification

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F093 Gamification (badges/streaks/points) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 13 — Learning

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F094 Learning Roadmap personalizado | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F095 Biblioteca de recursos | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| F096 Progress Tracking | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

## Módulo 14 — Meetings

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| F097 Meeting Intelligence | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F098 Transcripción automática | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F099 Extracción de insights | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F100 Action items automáticos | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F101 Sentiment Analysis | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 |
| F102 Resumen ejecutivo meeting | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F103 Meeting Facilitator IA | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| F104 Historial de meetings | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |

## Módulo 15 — Features del Repo Antiguo

| Feature | A1 | A2 | B1 | B2 | B3 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|---|---|---|
| N01 Dark Mode | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N02 i18n (6 idiomas) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N03 Tours interactivos | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 |
| N04 PWA (instalación móvil) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N05 Keyboard shortcuts | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N06 Performance metrics | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N07 Multi-org | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| N08 Org Switcher | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| N09 Custom Invite Token | ⚫ | 🔴 | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| N10 Org Settings | ⚫ | 🟡 | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| N11 Permission Levels | ⚫ | 🟡 | ⚫ | ⚫ | 🔴 | ⚫ | 🔴 | 🔴 | 🔴 |
| N12 Trello Integration | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| N13 Asana Integration | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| N14 Outlook Integration | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 |
| N15 HubSpot Integration | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| N16 Zapier Integration | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| N17 REST API pública | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N18 Webhooks salientes | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N19 Document Upload | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N20 Task Swapping (alias F025b) | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N21 Bulk CRM Actions | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N22 Stalled Deals Alerts | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N23 CRM Activity Timeline | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N24 Multi-contact per OBV | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N31 OKR Check-ins semanales | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N32 OKR Dependency Map | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| N33 OKR Retrospective | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N34 OKR Coaching IA | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N35 OKR Contribution view | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| N36 OKR Analytics histórico | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N37 KPI Benchmark vs Industria | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N41 Financial Ratios | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N42 Product Profitability | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N43 Advanced FP&A | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N44 Debt Tracking avanzado | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 |
| N45 Multi-source Finance Sync | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N46 AI Beta Testers | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N47 Cohort Analysis | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N48 Admin Heatmap | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 |
| N51 Team Performance Comparison | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| N52 Personal Weekly Comparison | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N53 Brutal Analysis v3 (alias F082) | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |
| N57 Growth Model AARRR | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 |
| N58 Customer Journey Map | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N59 Buyer Persona Builder visual | ⚫ | ⚫ | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 |
| N60 Product Roadmap visual | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N61 Sales Playbook | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N62 Hiring Guide IA | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| N63 Investor Deck Generator | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 |
| N64 Sales Simulator | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 |
| N65 Dual Onboarding (Startup/Discovery) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| N66 Voice Onboarding | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ⚫ | ⚫ | ⚫ | ⚫ |
| N67 Curated Ideas Database | 🔴 | 🔴 | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ |
| N68 Document Upload | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| N69 Subscription UI | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🔴 |
| N70 API Keys Management | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 |
| N71 Admin Settings | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| N72 Admin Heatmap (avanzado) | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🔴 | 🔴 |
| N73 Webhook Management | ⚫ | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | 🟡 | 🔴 | 🔴 |
| N74 Gamification Config Admin | ⚫ | ⚫ | ⚫ | ⚫ | 🟡 | ⚫ | 🔴 | 🔴 | 🔴 |
| N75 Reports Export (PDF/Excel) | ⚫ | ⚫ | 🟡 | 🟡 | 🟡 | 🔴 | 🔴 | 🔴 | 🔴 |

---

# PARTE 3 — RESUMEN ESTADÍSTICO POR ESCENARIO

| Escenario | CORE 🔴 | AVAILABLE 🟡 | HIDDEN ⚫ | % visible |
|---|---|---|---|---|
| A1 · Explorador Solo | 28 | 22 | 173 | 22% |
| A2 · Co-founders Sin Rumbo | 32 | 27 | 164 | 26% |
| B1 · Validador Digital Solo | 58 | 35 | 130 | 42% |
| B2 · Validador de Servicios Solo | 62 | 33 | 128 | 42% |
| B3 · Equipo Validador | 74 | 42 | 107 | 52% |
| C1 · Solo Founder con Tracción | 82 | 28 | 113 | 49% |
| C2 · Equipo Early Stage | 118 | 52 | 53 | 76% |
| C3 · Equipo en Crecimiento | 142 | 40 | 41 | 81% |
| C4 · Equipo Maduro / Enterprise | 158 | 28 | 37 | 83% |

---

# PARTE 4 — REGLAS DE TRANSICIÓN

## Cuándo un usuario avanza de escenario

El sistema detecta automáticamente cuándo un usuario ha superado su escenario actual y sugiere el avance. No hay bloqueos duros — las transiciones son sugeridas, no forzadas.

| De | A | Trigger |
|---|---|---|
| A → B | B1/B2/B3 | Idea seleccionada + primeras 3 tareas completadas |
| B → C | C1/C2 | 3+ OBVs cerrados en estado "ganado" O primer ingreso registrado |
| Solo → Equipo | Cambia modo | Primer miembro adicional invitado al proyecto |
| B1 → B2 | Cambio de tipo | Usuario cambia el tipo de su negocio de Digital a Servicios |
| C2 → C3 | Crecimiento | >50 clientes activos O >5 miembros en el equipo O 6+ meses en C2 |
| C3 → C4 | Escala | >20 miembros O multi-proyectos activos O solicitud de plan Enterprise |

## Qué pasa con los datos al transicionar
- Todos los datos se mantienen — las transiciones no borran nada
- Las features que pasan de HIDDEN a AVAILABLE/CORE se muestran con un banner "Nuevo para ti: [feature]"
- El onboarding contextual (tours) se activa para las nuevas features desbloqueadas
- Los KPIs y OBVs del pasado siguen siendo accesibles y aparecen en el historial

---

# PARTE 5 — PRINCIPIOS DE DISEÑO POR ESCENARIO

## Principio 1: Progresividad
El usuario nunca se siente abrumado. En A1, solo ve lo esencial. Cada transición añade features gradualmente. La sidebar crece con el usuario.

## Principio 2: Intención sobre funcionalidad
Cada escenario tiene un objetivo primario. Todo el UI se orienta hacia ese objetivo. El dashboard del A1 grita "¿Has tenido conversaciones esta semana?". El de C2 grita "¿Cómo van tus OKRs este trimestre?".

## Principio 3: Solo si es necesario
Una feature que en C2 tiene sentido puede ser ruido en B1. El criterio no es "¿puede el usuario usarla?" sino "¿le ayuda en su objetivo actual sin distraerle?".

## Principio 4: Reversibilidad
Cambiar de Solo a Equipo debe ser fácil. Bajar de C2 a C1 (si el equipo se reduce) debe ser posible sin perder datos. El sistema es flexible, no un embudo sin retorno.

## Principio 5: La IA compensa la complejidad
Cuanto más complejo es el escenario (C3, C4), más trabajo hace la IA para reducir el overhead cognitivo. Los análisis brutales, los weekly insights y las predicciones compensan la complejidad operativa de los escenarios avanzados.

---

*Fin del documento. 9 escenarios × 223 features mapeadas.*
*Usar junto con FEATURES_GUIDE.md (explicaciones) y PRODUCT_MAP.md (inventario).*
*Última actualización: 2026-02-24*
