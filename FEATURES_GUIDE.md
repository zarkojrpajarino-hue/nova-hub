# FEATURES GUIDE — Optimus-K
> Explicación completa de las 223 features: qué son, cómo funcionan, qué lógica tienen detrás.
> Documento de referencia para diseñar escenarios, tomar decisiones de producto y briefing de desarrollo.
> Última actualización: 2026-02-24

---

## CÓMO LEER ESTE DOCUMENTO

Para cada feature:
- **Qué es** — Lo que el usuario ve y hace
- **Lógica** — Reglas de negocio, mecánicas, límites, condiciones
- **Para quién** — Etapa (A=Sin idea / B=Con idea / C=Startup) y modo (Solo / Equipo)
- **Loop** — A qué acción del loop semanal sirve (1=Agenda, 2=Tareas, 3=OBVs/CRM, 4=KPIs/OKRs, 5=Finanzas, 6=Progreso)

---

# MÓDULO 1 — AUTENTICACIÓN Y ACCESO

---

### F001 · Login con email y contraseña
**Qué es:** El usuario introduce su email y contraseña para acceder a la plataforma.
**Lógica:** Supabase Auth gestiona la sesión. Se genera un JWT que se refresca automáticamente antes de expirar. Si el usuario no ha verificado su email, se le bloquea el acceso con mensaje de reenvío. Sesión persistente en localStorage. En caso de error de credenciales, mensaje específico sin revelar si el email existe (seguridad).
**Para quién:** Todos. Punto de entrada universal.
**Loop:** Transversal.

---

### F002 · Signup con verificación de email
**Qué es:** Registro de cuenta nueva con email + contraseña.
**Lógica:** Al registrarse, Supabase envía un email de confirmación. Hasta que el usuario haga click en el link, su cuenta existe pero no puede acceder al dashboard. Al confirmar, se crea automáticamente su registro en la tabla `members` con rol `member` por defecto. Si ya existe una cuenta con ese email, se muestra error sin revelar información.
**Para quién:** Todos. Primera acción en la app.
**Loop:** Transversal.

---

### F003 · Reset de contraseña
**Qué es:** El usuario solicita recuperar su contraseña olvidada.
**Lógica:** Introduce su email, Supabase genera un magic link temporal (expira en 1 hora). Al hacer click, se le redirige a un formulario donde establece nueva contraseña. Si el email no existe, no se muestra error (evita enumeración de usuarios).
**Para quién:** Todos.
**Loop:** Transversal.

---

### F004 · Gestión de sesión
**Qué es:** El sistema mantiene al usuario autenticado entre sesiones.
**Lógica:** JWT con refresh token automático. Si el token expira sin posibilidad de refresh (sesión inválida), se redirige automáticamente a `/auth`. El hook `useAuth` expone `isAuthenticated`, `loading` y `user` a toda la app. Las rutas protegidas verifican `isAuthenticated` antes de renderizar.
**Para quién:** Todos.
**Loop:** Transversal.

---

### F005 · Roles de usuario (admin / tlt / member)
**Qué es:** Cada usuario tiene un nivel de acceso que determina qué puede ver y hacer.
**Lógica:**
- `member` — Usuario estándar. Accede a todas las features de su proyecto.
- `tlt` (Top Level Talent) — Senior. Puede validar KPIs, mentorizar, tiene acceso a vistas de gestión.
- `admin` — Acceso total. Puede gestionar usuarios, cambiar configuración global, ver logs, acceder al panel de administración.
Los roles se asignan en la tabla `user_roles`. Un usuario puede tener distinto rol en distintas organizaciones/proyectos.
**Para quién:** Todos, pero afecta principalmente en equipos.
**Loop:** Transversal.

---

# MÓDULO 2 — ONBOARDING Y SETUP

---

### F006 · Selección de perfil de usuario (3 tipos)
**Qué es:** Primera pantalla post-registro. El usuario elige en cuál de las 3 etapas se encuentra.
**Lógica:** Tres opciones: "No tengo idea de negocio", "Tengo una idea", "Tengo una startup". Esta selección no es permanente — el sistema auto-avanza entre etapas según triggers (ver F007, F008, F009). La elección inicial configura el camino de onboarding que se muestra a continuación. Guardada en `onboarding_sessions.type`.
**Para quién:** Todos. Solo ocurre una vez.
**Loop:** Transversal — es la puerta de entrada.

---

### F007 · Onboarding generativo — Sin Idea
**Qué es:** Flujo de onboarding para quien no sabe qué negocio montar. La IA genera 3 opciones de negocio personalizadas.
**Lógica:** El usuario responde preguntas sobre sus skills, tiempo disponible, capital, motivaciones e industrias preferidas. La edge function `generate-business-options` procesa estas respuestas y genera 3 opciones con: nombre del negocio, descripción, fit score (0-100), modelo de ingresos, primeros pasos. El usuario elige una → eso crea su primer proyecto y lo avanza a la etapa B.
**Para quién:** Etapa A (Sin idea). Solo y equipo.
**Loop:** Transversal — es onboarding, no loop semanal.

---

### F008 · Onboarding competitivo — Con Idea
**Qué es:** Flujo para quien ya tiene una idea pero necesita validarla.
**Lógica:** El usuario describe su idea, mercado objetivo y competidores percibidos. La edge function `competitive-swot-generator` genera un SWOT completo con datos reales de mercado. Además, `validation_roadmaps` genera un roadmap de validación personalizado con hipótesis críticas ordenadas por importancia. Al final, el usuario tiene un plan de acción para las primeras semanas.
**Para quién:** Etapa B (Con idea). Solo y equipo.
**Loop:** Transversal.

---

### F009 · Onboarding Health Score — Startup
**Qué es:** Diagnóstico rápido para quien ya tiene clientes o facturación.
**Lógica:** El usuario responde sobre métricas actuales (MRR, churn, CAC, tamaño equipo, runway). El sistema calcula un "health score" (0-100) desglosado en 5 dimensiones: financiera, comercial, equipo, producto, mercado. Genera quick wins inmediatos (acciones de alto impacto en menos de 30 días) y un plan de acción priorizado.
**Para quién:** Etapa C (Startup). Solo y equipo.
**Loop:** Transversal.

---

### F010 · Crear primer proyecto
**Qué es:** Formulario para crear el proyecto principal del usuario.
**Lógica:** Campos: nombre del proyecto, industria (selector), fase actual (enum: idea/problema_validado/solución_validada/mvp/tracción/crecimiento), tipo (validación u operación), descripción breve. El proyecto queda como `project_id` central en toda la URL de la app (`/proyecto/:projectId/*`). El creador queda como `owner` y `admin` del proyecto automáticamente.
**Para quién:** Todos, al inicio.
**Loop:** Transversal.

---

### F011 · Wizard de onboarding completo
**Qué es:** Wizard de pasos que completa el perfil del proyecto tras crearlo.
**Lógica:** Multi-step con auto-save cada 10 segundos (`useAutoSave`). Pasos: idea detallada, equipo (solo o con roles), ubicación (ciudad/país para geo-intelligence), modelo de ingresos, competidores principales. Cada respuesta se guarda en `onboarding_sessions.responses` como JSONB. Al completar el 100% se marca `onboarding_completed = true` en `projects`. Hasta completarlo, el `OnboardingGate` bloquea acceso al dashboard.
**Para quién:** Todos.
**Loop:** Transversal.

---

### F012 · Selección y cambio de proyecto activo
**Qué es:** El usuario puede pertenecer a múltiples proyectos y cambiar entre ellos.
**Lógica:** El proyecto activo se persiste en `localStorage` como `currentProjectId`. Al cambiar de proyecto, React Query invalida todo el caché y recarga datos del nuevo proyecto. El `ProjectSelector` muestra todos los proyectos donde el usuario es miembro. El cambio es instantáneo. Las URLs siempre incluyen `/proyecto/:projectId/` para que cada vista sea bookmarkeable.
**Para quién:** Todos.
**Loop:** Transversal.

---

### F013 · Deep Setup (25 secciones progresivas)
**Qué es:** Setup avanzado opcional que profundiza en cada aspecto del negocio.
**Lógica:** 25 secciones organizadas en categorías (estrategia, mercado, producto, finanzas, equipo). Las secciones se desbloquean progresivamente — no puedes completar "Análisis de competidores" sin haber definido antes tu "Propuesta de valor". Cada sección tiene un estado (pending/in_progress/completed). El progreso total se muestra como % en el dashboard. No es obligatorio, pero cuanto más completo, más contexto tiene la IA para generar mejores análisis.
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

### F014 · Generación de roles del proyecto con IA
**Qué es:** La IA sugiere qué roles necesita el equipo basándose en el tipo de negocio.
**Lógica:** La edge function `generate-project-roles` analiza: industria, idea de negocio, modo de trabajo (solo/equipo). Genera roles 100% personalizados (no predefinidos) con: nombre del rol, responsabilidades clave, skills necesarios, % de tiempo estimado. En equipos, cada miembro elige su rol de especialización (`specialization_role`): sales / finance / ai_tech / marketing / operations / strategy. El rol define qué features son prominentes para esa persona en el dashboard.
**Para quién:** Etapas B y C. Solo en modo Equipo.
**Loop:** Transversal.

---

### F015 · Preguntas de onboarding por rol
**Qué es:** La IA genera preguntas específicas para evaluar a cada miembro según su rol.
**Lógica:** `generate-role-questions-v2` recibe el rol, el contexto del proyecto y los datos del miembro. Genera un cuestionario de evaluación personalizado que sirve para: calibrar el nivel actual del miembro, identificar gaps de conocimiento, personalizar el roadmap de aprendizaje (F094). Las respuestas se usan también para generar el playbook inicial del miembro.
**Para quién:** Etapas B y C. Equipo.
**Loop:** Transversal — ocurre al incorporarse al proyecto.

---

### F016 · 4 Fases de negocio con IA *(por implementar)*
**Qué es:** La IA genera un plan de 4 fases personalizadas para el negocio basado en metodología Lean Startup / Scaling Up.
**Lógica:** `generate-business-phases` analiza el tipo de negocio, industria y fase actual. Genera 4 fases progresivas con: nombre, descripción, duración estimada en semanas, objetivos concretos, checklist de hitos, playbook de acciones. Cada fase tiene un sistema de verificación (`check-phase-completion`) que evalúa si el equipo está listo para avanzar a la siguiente. Las tareas de cada semana se generan ancladas a la fase activa.
**Para quién:** Etapas B y C.
**Loop:** Transversal — estructura todo lo demás.

---

### F017 · Flag Solo vs Equipo *(completar)*
**Qué es:** Una pregunta en el onboarding que bifurca toda la experiencia de usuario.
**Lógica:** Si el usuario responde "Solo": se ocultan de la navegación y del dashboard todos los módulos que requieren equipo (Masters, Rankings, Meetings, Role Rotation, Peer Validation, Team Performance). El sidebar muestra versión simplificada. Si responde "Equipo": se muestran todos los módulos. Este flag se puede cambiar en Settings si el usuario luego forma equipo. Guardado en `projects.work_mode`.
**Para quién:** Todos.
**Loop:** Transversal — afecta toda la UX.

---

# MÓDULO 3 — AGENDA Y PLANIFICACIÓN

---

### F018 · Sugerencia de agenda óptima con IA
**Qué es:** La IA analiza la carga de trabajo actual y sugiere cómo distribuir las tareas en la semana.
**Lógica:** `suggest-optimal-schedule` analiza: tareas pendientes y sus prioridades, disponibilidad del usuario (horas/días configuradas), meetings programados, deadlines. Genera una distribución horaria óptima por día: qué tareas hacer el lunes, cuánto tiempo dedicar a CRM el martes, etc. La sugerencia es orientativa — el usuario puede aceptarla o ajustarla.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda. Es el primer paso del loop semanal.

---

### F019 · Google Calendar OAuth *(por implementar)*
**Qué es:** Sincronización bidireccional entre la app y Google Calendar.
**Lógica:** OAuth 2.0 con Google. Al conectar: las tareas con fecha asignada se crean como eventos en Google Calendar. Los eventos de Google Calendar se pueden importar como tareas. Sync automático cuando hay cambios. Tokens guardados en `google_calendar_tokens` con refresh automático. La sincronización se ejecuta vía `sync-calendar-events`. El usuario puede elegir qué calendarios sincronizar y si la sync es bidireccional o solo exportar.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda.

---

### F020 · Global Agenda con cron *(por implementar)*
**Qué es:** Vista unificada de toda la semana: tareas + meetings + KPIs pendientes en un solo calendario.
**Lógica:** Vista tipo calendario (día/semana/mes) que agrega todas las acciones comprometidas. Las tareas aparecen coloreadas por área (marketing=azul, ventas=verde, etc.). Los meetings aparecen con su duración. Los KPIs con deadline esta semana aparecen destacados. Un cron semanal (lunes 9am) genera automáticamente el resumen de la semana y envía notificación. En modo equipo, el admin puede ver el calendario completo del equipo y detectar conflictos.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 1 — Agenda.

---

### F021 · Weekly Insights con IA
**Qué es:** Resumen semanal generado automáticamente que analiza qué pasó la semana anterior.
**Lógica:** Cron job los lunes. `generate-weekly-insights` analiza: OBVs avanzados/cerrados, tareas completadas vs planeadas, KPIs registrados, finanzas de la semana. Genera un informe con: highlights (lo mejor), concerns (lo preocupante), next steps (recomendaciones para esta semana), cambios en competidores detectados. Se muestra en el dashboard como widget y se puede enviar al email. Guardado en tabla `weekly_insights`.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda. Es el primer item que ve el usuario al abrir la app el lunes.

---

### F022 · Preparación de one-on-one con IA
**Qué es:** La IA prepara automáticamente la agenda para reuniones 1:1 entre miembros.
**Lógica:** `prepare-one-on-one` recibe: quién se reúne con quién, fecha, datos históricos de ambos miembros. Genera agenda con: tareas completadas desde el último 1:1, objetivos de carrera del miembro, gaps de rendimiento detectados, feedback pendiente del líder, preguntas sugeridas para el líder. El miembro también puede añadir sus propios puntos antes de la reunión.
**Para quién:** Etapa C. Equipo.
**Loop:** 1 — Agenda.

---

### F023 · Smart Alerts *(parcial — completar UI)*
**Qué es:** El sistema genera alertas automáticas cuando algo requiere atención urgente.
**Lógica:** Un sistema de reglas (`alert_rules`) define qué condiciones disparan alertas. Ejemplos: runway < 3 meses → alerta crítica roja; OKR con progreso < 20% a mitad de trimestre → alerta amarilla; lead caliente sin actividad > 7 días → alerta azul; KPI validador incumplió deadline → alerta interna. Las alertas aparecen en el dashboard y se pueden enviar a Slack. El usuario puede hacer snooze (24h, 48h, 1 semana) o marcar como resuelta. La tabla `metric_alerts` ya existe en BD.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda. Aparecen al inicio de cada jornada para priorizar el día.

---

# MÓDULO 4 — TAREAS

---

### F024 · Kanban de tareas (4 estados)
**Qué es:** Tablero visual de tareas con 4 columnas: Por hacer / Haciendo / Hecho / Bloqueado.
**Lógica:** Drag-and-drop entre columnas vía `@hello-pangea/dnd`. Al mover una tarea a "Bloqueado", se pide indicar el motivo (quién la bloquea, por qué). Al moverla a "Hecho", si está configurado el sistema de feedback loop (F028), se abre automáticamente el diálogo de completación. Las tarjetas muestran: título, asignado, prioridad (color), deadline (rojo si vencido), área. El estado se persiste en tiempo real via Supabase.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas. Es el espacio central de ejecución semanal.

---

### F025 · Creación de tareas manuales
**Qué es:** Formulario para crear una tarea desde cero.
**Lógica:** Campos: título (obligatorio), descripción, miembro asignado (en equipo), prioridad (alta/media/baja), fecha límite, área/categoría, tipo (individual o colaborativa en modo equipo). En modo Equipo con Executor+Leader: al crear la tarea se asigna también un líder/validador (distinto del ejecutor). Las tareas se guardan en `tasks` con el `project_id` activo. Se puede adjuntar playbook generado por IA al crearla.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F026 · AI Task Executor
**Qué es:** La IA ejecuta la tarea automáticamente — no solo ayuda, la completa.
**Lógica:** `ai-task-executor` es el "unicorn feature". Recibe la descripción de la tarea y el contexto del proyecto. Dependiendo del tipo de tarea: si es "encontrar leads" → ejecuta búsqueda real vía scraping + IA y devuelve lista de leads con contactos; si es "redactar propuesta" → genera el documento completo listo para enviar; si es "analizar competidor" → ejecuta análisis y devuelve informe. El resultado se muestra con: pasos realizados, tiempo de ejecución, tokens usados. El usuario puede copiar, descargar o aplicar el resultado directamente al sistema.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F027 · AI Task Router
**Qué es:** Clasificador inteligente que determina qué tipo de ejecución necesita una tarea.
**Lógica:** `ai-task-router` usa NLP para analizar la descripción de la tarea y determina: el tipo de worker necesario (lead_finder, content_writer, analyst, etc.), los parámetros de ejecución, el coste estimado en créditos, si el usuario tiene límite disponible. Si el usuario describe "busca 10 clientes en Madrid del sector hostelería", el router detecta que necesita el worker de lead finding y extrae los parámetros. Esto permite que el AI Task Executor funcione correctamente sin que el usuario tenga que especificar el tipo de worker.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F028 · Preguntas de completitud (feedback loop)
**Qué es:** Al marcar una tarea como completada, la IA genera un cuestionario de cierre.
**Lógica:** `generate-task-completion-questions` genera preguntas específicas según el tipo de tarea. El usuario debe responder: resultado obtenido (éxito/parcial/fallido), porcentaje de éxito (0-100), insight principal aprendido, siguiente acción derivada, nivel de dificultad (1-5). En modo Equipo con Executor+Leader: las respuestas del ejecutor van al líder, quien tiene 48h para validar o rechazar. Si el líder rechaza, la tarea vuelve a "Haciendo" con comentario de corrección. Este feedback se usa para mejorar las sugerencias de IA futuras.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F029 · Generación de tareas con IA
**Qué es:** La IA genera una lista de tareas relevantes para el proyecto.
**Lógica:** `generate-tasks-v2` analiza: fase del proyecto, OBVs activos en el pipeline, leads calientes en CRM, OKRs con menor progreso, historial de tareas completadas. Genera tareas accionables con: título claro, descripción del entregable esperado, área/categoría, prioridad sugerida, duración estimada. El usuario puede aceptar todas, seleccionar algunas o pedir nueva generación. Las tareas generadas se marcan con `ai_generated = true` en BD.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F030 · Metodología Executor + Leader *(por implementar)*
**Qué es:** En equipos, cada tarea tiene un ejecutor (quien la hace) y un líder (quien la valida).
**Lógica:** Inspirado en metodologías ágiles. Al crear una tarea en modo equipo: se asigna `user_id` (ejecutor) y `leader_id` (validador). El ejecutor completa la tarea y envía para revisión. El líder tiene 48h para: aprobar (tarea pasa a Done) o rechazar con comentario (tarea vuelve a Doing). Si el líder no responde en 48h, la tarea se auto-aprueba. El líder no tiene por qué ser del mismo área — permite que cualquier miembro valide tareas de otro área, fomentando entendimiento cross-funcional sin rotar especializaciones. Los líderes acumulan puntos de validación que impactan en su ranking.
**Para quién:** Etapas B y C. Solo en modo Equipo.
**Loop:** 2 — Tareas.

---

### F031 · Time Tracking por tarea *(por implementar)*
**Qué es:** Registro del tiempo real dedicado a cada tarea.
**Lógica:** Temporizador integrado en la tarjeta de tarea: start/pause/stop. Al parar, el tiempo se suma a `task_time_logs` con start_time, end_time, duration_minutes. El usuario puede también ingresar tiempo manualmente. Los reportes muestran: tiempo por área, tiempo por tipo de tarea, horas semanales. En equipo: el admin ve distribución del tiempo de todo el equipo. El time tracking alimenta el algoritmo de sugerencia de agenda (F018).
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

### F025b · Task Swapping con IA *(por implementar)*
**Qué es:** El usuario puede cambiar una tarea asignada por una alternativa generada por IA.
**Lógica:** El sistema permite un máximo de cambios del 50% del total de tareas de la fase (con un mínimo garantizado de 3 cambios). Al solicitar swap: el usuario indica el motivo (obligatorio); la edge function `generate-task-alternatives` genera 5 alternativas con pros/contras para cada una; el usuario elige cuál quiere en su lugar. En modo Equipo: si un líder cambia la tarea de otro miembro, el sistema envía email de aviso al ejecutor y genera una alerta smart. El historial de swaps se guarda en `task_swaps`. Límite: máximo 1-2 swaps por semana para evitar que se usen como escape de tareas difíciles.
**Para quién:** Etapas B y C. Ambos modos.
**Loop:** 2 — Tareas.

---

### F025c · AI Resources Panel por tarea *(por implementar)*
**Qué es:** Para cada tarea, la IA genera recursos específicos: tutoriales, herramientas, templates, contenido.
**Lógica:** `generate-task-ai-resources` analiza el tipo de tarea y genera: tutoriales recomendados (con links), herramientas específicas para ese tipo de trabajo, templates descargables, y si es tarea de marketing/ventas: genera el contenido directamente (email de ventas, post de redes, script de vídeo, anuncio). Los recursos se guardan en `ai_task_resources` y aparecen como panel lateral en la vista de la tarea. El usuario puede marcar recursos como "útil" para mejorar futuras recomendaciones.
**Para quién:** Etapas B y C.
**Loop:** 2 — Tareas.

---

# MÓDULO 5 — OBVs / CRM

---

### F032 · Pipeline Kanban (7 estados)
**Qué es:** Tablero visual del proceso de ventas con drag-and-drop.
**Lógica:** 7 columnas: Frío → Tibio → Hot → Propuesta → Negociación → Cerrado Ganado → Cerrado Perdido. Cada columna muestra el número de leads y el valor total acumulado. Al mover un lead entre columnas, se registra automáticamente en `obv_pipeline_history` con timestamp y autor (en equipos). Al mover a "Cerrado Ganado" con datos de facturación → se convierte en OBV de tipo `venta` y alimenta el dashboard financiero. Al mover a "Cerrado Perdido" → solicita motivo de pérdida (guardado en `lost_reasons`).
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F033 · Creación de OBV unificado (wizard 6 pasos)
**Qué es:** El registro central de la plataforma. Un OBV es simultáneamente: oportunidad de negocio, validación, factura y cobro.
**Lógica:** Wizard de 6 pasos:
1. Tipo: exploracion (entrevista/investigación) / validacion (test de hipótesis) / venta (deal real)
2. Proyecto asociado
3. Info básica: título, descripción, fecha
4. Datos del contacto: nombre, empresa, email, teléfono, cargo
5. Datos comerciales (solo si es venta): producto, cantidad, precio unitario, total, IVA, forma de pago, participantes del equipo con % de contribución
6. Evidencia: adjuntar archivos, URL o descripción de la validación

Un OBV de tipo `venta` completamente rellenado se convierte en: registro CRM + factura + tracking de cobro, todo en una sola entidad. La tabla `obvs` tiene 48 columnas que cubren todo el ciclo.
**Para quién:** Etapas A (exploracion) / B y C (todos los tipos).
**Loop:** 3 — OBVs/CRM.

---

### F034 · OBV tipos: exploración / validación / venta
**Qué es:** Un mismo flujo sirve para 3 niveles distintos de interacción con el mercado.
**Lógica:**
- **Exploración** (`obv_type = exploracion`): Para entrevistas de descubrimiento, investigación de mercado. No requiere datos financieros. Se valida con 2+ votos de equipo confirmando que la info fue útil.
- **Validación** (`obv_type = validacion`): Para testar una hipótesis de negocio (ej: "el cliente pagaría X€ por esto"). Requiere evidencia adjunta. La validación peer (2+ votos) confirma que la hipótesis fue correctamente testada.
- **Venta** (`obv_type = venta`): Deal real con facturación. Requiere datos completos: cliente, producto, precio, IVA, forma de pago. Se integra con finanzas automáticamente.

Este sistema unificado permite al usuario Sin Idea usar OBVs de exploración para aprender del mercado, y al Startup usarlos de venta para cobrar.
**Para quién:** A (exploración), B (validación y venta pequeña), C (venta).
**Loop:** 3 — OBVs/CRM.

---

### F035 · Historial del pipeline
**Qué es:** Registro completo de todos los movimientos de un OBV por el pipeline.
**Lógica:** Cada cambio de estado en el pipeline queda registrado en `obv_pipeline_history` con: estado anterior, estado nuevo, timestamp, quién hizo el cambio (en equipos). Esto permite: calcular deal velocity (tiempo medio en cada etapa, F043), detectar leads estancados (sin movimiento > X días), analizar dónde se pierden más leads. El historial es visible en la vista de detalle del OBV.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F036 · Cobros parciales
**Qué es:** Un OBV de venta puede cobrarse en múltiples pagos.
**Lógica:** Tabla `cobros_parciales` vinculada al OBV. Cada cobro tiene: fecha, importe, método de pago, referencia. El sistema calcula automáticamente: total cobrado, pendiente de cobro, % cobrado. El estado de cobro del OBV (`cobro_estado`) se actualiza automáticamente: pendiente → parcial → cobrado. Los días de retraso se calculan como: fecha real de cobro completo - fecha esperada de cobro. El dashboard financiero (F058) agrega estos datos.
**Para quién:** Etapa C.
**Loop:** 3 — OBVs/CRM (registro) y 5 — Finanzas (seguimiento).

---

### F037 · AI Lead Scoring
**Qué es:** La IA puntúa automáticamente cada lead de 0 a 100 y lo clasifica (A/B/C/D).
**Lógica:** `calculate-lead-score` analiza 5 dimensiones:
- **Fit score** (25%): ¿Encaja el lead con el buyer persona del proyecto?
- **Engagement score** (20%): ¿Cuántas interacciones ha habido? ¿Con qué frecuencia?
- **Intent score** (25%): ¿Ha pedido demo, propuesta, precio? ¿Señales de compra activas?
- **Buying power score** (20%): Tamaño de empresa, cargo del contacto, presupuesto estimado.
- **Velocity score** (10%): ¿Cuánto tiempo lleva en el pipeline? Los leads que avanzan rápido puntúan más.

Clasificación: A (90-100) = caliente y listo; B (70-89) = prometedor; C (40-69) = interesado pero frío; D (<40) = no cualificado. La puntuación se actualiza automáticamente con cada interacción.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F038 · AI Lead Finder
**Qué es:** La IA encuentra automáticamente leads potenciales para el negocio.
**Lógica:** `ai-lead-finder` es el segundo "unicorn feature". Recibe: perfil de cliente ideal, industria, ubicación geográfica, número de leads deseados. Ejecuta búsqueda combinada vía scraping de Google Maps, LinkedIn y webs de empresas. Por cada lead encontrado: extrae nombre, cargo, empresa, email (si disponible), teléfono, web. Calcula relevance score (0-100) basado en el match con el ICP. Genera pitch de apertura personalizado. Los leads se importan directamente al CRM con un click.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F039 · Email Pitch Generator
**Qué es:** La IA genera emails de prospección ultra-personalizados para cada lead.
**Lógica:** `generate-email-pitch` recibe: datos del lead (nombre, empresa, cargo), contexto del proyecto (producto, propuesta de valor), pain points identificados, tono deseado (formal/casual/directo), tipo de template (frío, seguimiento, reactivación). Genera: asunto (con A/B test de 2 opciones), cuerpo del email personalizado con referencia específica al negocio del lead, CTA claro, posdata. Muestra estimación de tasa de respuesta esperada. El email se puede copiar, descargar o enviar directamente si Resend está configurado.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F040 · Extracción de info de empresa
**Qué es:** La IA extrae automáticamente datos de un contacto/empresa desde una URL o texto libre.
**Lógica:** `extract-business-info` acepta: URL de web de empresa, perfil de LinkedIn, texto pegado manualmente. Extrae: nombre empresa, industria, tamaño estimado, descripción del negocio, email de contacto, teléfono, redes sociales, ubicación. Pre-rellena el formulario de creación de OBV/lead. Útil cuando el usuario está mirando la web de un potencial cliente y quiere crear el lead rápidamente sin copiar datos manualmente.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### F041 · Generación de testimonial
**Qué es:** Al cerrar un deal ganado, la IA redacta automáticamente un testimonial del cliente.
**Lógica:** `generate-testimonial` recibe: datos del cliente, producto/servicio vendido, feedback recibido en el proceso de venta. Genera un testimonial en primera persona del cliente (que luego puede enviarse al cliente para su aprobación). El testimonial se guarda en el OBV y puede exportarse al Brand Kit o landing page generada.
**Para quién:** Etapa C.
**Loop:** 3 — OBVs/CRM.

---

### F042 · Buyer Persona Generator
**Qué es:** La IA define el perfil de cliente ideal (ICP) del proyecto.
**Lógica:** `suggest-buyer-persona` analiza: los OBVs cerrados ganados (qué tipo de cliente compró), los cerrados perdidos (qué tipo no compró), la descripción del proyecto, la industria. Genera 3-5 buyer personas con: nombre ficticio, cargo típico, empresa tipo, objetivos, pain points, canales preferidos, proceso de decisión de compra, objeciones típicas. Las personas se usan para calibrar el AI Lead Scoring (F037) y personalizar los Email Pitches (F039).
**Para quién:** Etapa B.
**Loop:** 3 — OBVs/CRM.

---

### F043 · Deal Velocity *(por implementar)*
**Qué es:** Mide cuánto tiempo tarda un deal en recorrer el pipeline y predice cuándo cerrará.
**Lógica:** Calcula el tiempo promedio (en días) que un lead permanece en cada etapa del pipeline basándose en el historial. Detecta automáticamente "stalled deals": leads que llevan más tiempo del promedio en una etapa sin movimiento. Para cada stalled deal genera la acción recomendada (llamar, enviar propuesta, hacer seguimiento). Dashboard con: funnel de velocidad por etapa, días promedio de ciclo de venta completo, forecast de cierre a 30/60/90 días. Guardado en `deal_velocity_cache`.
**Para quién:** Etapa C.
**Loop:** 3 — OBVs/CRM.

---

### F044 · Customer Journey Mapping *(por implementar)*
**Qué es:** Mapa visual del recorrido del cliente desde que descubre el problema hasta que es cliente fiel.
**Lógica:** 4 etapas configurables: Awareness (descubrimiento) → Consideration (evaluación) → Decision (compra) → Retention (fidelización). Para cada etapa el usuario define: puntos de contacto con el cliente, emociones del cliente en esa etapa, oportunidades de mejora. El mapa se alimenta con los datos reales del CRM: en qué fuentes entran más leads, en qué etapa del pipeline se pierden más, etc. Es tanto una herramienta de diseño estratégico como de análisis de datos reales.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

# MÓDULO 6 — KPIs / OKRs

---

### F046 · LP (Learning Path Points)
**Qué es:** Puntos que el usuario gana por completar módulos de aprendizaje.
**Lógica:** El usuario crea un KPI de tipo `LP` indicando: qué módulo completó (curso, certificación, workshop), evidencia (URL del certificado, captura, descripción), número de puntos que solicita (según duración e impacto del aprendizaje). Va a la cola de validación (F050) donde 2+ compañeros deben aprobarlo. Al aprobarse, los puntos se acumulan en `member_kpi_base.lps`. Los LP se muestran en el ranking de progreso personal (F117).
**Para quién:** Todos.
**Loop:** 6 — Progreso personal.

---

### F047 · BP (Book Points)
**Qué es:** Puntos que el usuario gana por leer y resumir libros de negocio.
**Lógica:** Similar a LP pero para lectura. El usuario debe adjuntar: título y autor del libro, resumen propio de al menos 200 palabras, 3 aprendizajes clave aplicables al proyecto. Los validadores verifican que el resumen sea genuino y relevante. El sistema anti-gaming detecta si varios miembros suben el mismo libro en el mismo período (asigna validadores distintos para evitar colusión).
**Para quién:** Todos.
**Loop:** 6 — Progreso personal.

---

### F048 · CP (Community Points)
**Qué es:** Puntos por contribuir a la comunidad de la plataforma.
**Lógica:** Acciones que generan CP: dar feedback útil en una validación de otro miembro, escribir un insight en Mi Espacio que otros miembros marquen como valioso, compartir un recurso que el equipo adopta, mentorizar a otro miembro. Los CP son más difíciles de ganar que LP y BP porque requieren impacto en otros, no solo esfuerzo propio. Solo disponible en modo Equipo.
**Para quién:** Todos. Solo en modo Equipo.
**Loop:** 6 — Progreso personal.

---

### F049 · Sistema de evidencias (3 niveles de rigor)
**Qué es:** Sistema para validar que el contenido generado por IA está respaldado por fuentes reales.
**Lógica:** Tres niveles:
- **Hypothesis** (bajo): La IA genera con su conocimiento interno, sin fuentes externas verificadas. Marcado con banner amarillo "Hipótesis no verificada". Útil para explorar ideas rápidamente.
- **Standard**: La IA busca fuentes en la BD del proyecto (documentos subidos, datos del CRM) + fuentes externas generales. Cita las fuentes usadas.
- **Strict** (alto): La IA solo genera si encuentra evidencia suficiente en las fuentes verificadas del proyecto. Si no hay suficiente evidencia, muestra diálogo de "modo estricto no cumplido" con opciones: buscar más fuentes, continuar como hypothesis, o cancelar.

El usuario elige el nivel según la importancia de la decisión que está tomando.
**Para quién:** Etapas B y C.
**Loop:** 4 — KPIs/OKRs.

---

### F050 · Peer Validation de KPIs
**Qué es:** Los KPIs subidos por un miembro deben ser validados por compañeros antes de acreditar los puntos.
**Lógica — el sistema más complejo de la app:**
1. El miembro sube un KPI con evidencia.
2. El sistema asigna automáticamente 2 validadores usando el orden de rotación del mes (`validation_order`). La rotación garantiza que todos validan a todos de forma equitativa a lo largo del tiempo.
3. Los validadores tienen 5-7 días para aprobar o rechazar con comentario.
4. Con 2+ aprobaciones → KPI `validated`, puntos acreditados automáticamente.
5. Con 2+ rechazos → KPI `rejected`, el miembro puede corregir y resubir.
6. Si un validador no responde en el plazo: queda marcado como `late` en `validator_stats`. Con 3 `late` consecutivos → `is_blocked = true` durante 1 semana (no puede subir sus propios KPIs).
7. Anti-colusión: el sistema detecta si dos miembros siempre se validan mutuamente y varía los asignados.
**Para quién:** Etapas B y C. Solo en modo Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### F051 · Validator Stats
**Qué es:** Tracking del historial de validación de cada miembro como validador.
**Lógica:** Tabla `validator_stats` registra por cada miembro: total de validaciones recibidas, completadas a tiempo, completadas tarde, perdidas (no respondió). Se calcula `cumplimiento_rate` = on_time / total. El ranking de validadores se muestra en la vista de Rankings (F114) como incentivo para ser buen validador. El admin puede ver el historial completo y contactar a validadores con bajo rendimiento.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### F052 · Cola de validaciones pendientes
**Qué es:** Vista centralizada con todos los KPIs y OBVs que el usuario debe validar esta semana.
**Lógica:** Agrega en una sola lista: KPIs pendientes de validar asignados al usuario + OBVs pendientes de validar del proyecto. Ordenados por deadline (más urgentes primero). Para cada item: muestra título, creador, evidencia adjunta, fecha límite, botones de aprobar/rechazar + campo de comentario. Al votar, se actualiza el contador y si se alcanza el quórum (2+ votos) se auto-aprueba/rechaza el item. La cola aparece como widget en el Dashboard principal con badge de contador.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### F053 · Anti-gaming mechanics
**Qué es:** Sistema de reglas que evitan que los miembros se "trampen" mutuamente los puntos.
**Lógica:** Reglas implementadas:
- Rotación mensual de validadores (nadie valida siempre a los mismos).
- Deadline obligatorio de 5-7 días para validar.
- Bloqueo temporal si incumples deadlines repetidamente.
- Detección de patrones: si A siempre aprueba a B y B siempre aprueba a A, el sistema interviene cambiando asignaciones.
- Los comentarios de rechazo son obligatorios (no se puede rechazar sin explicar por qué).
- Historial completo visible para el admin.
- Los validadores que sistemáticamente rechazan sin justificación también pierden reputación en `validator_stats`.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### F054 · OKRs completo *(parcial — completar UI)*
**Qué es:** Sistema de Objectives and Key Results para tracking de objetivos trimestrales/anuales.
**Lógica:** Estructura jerárquica: Objective (qué queremos lograr) → Key Results (cómo mediremos el éxito). Un Objective puede tener múltiples KRs. Cada KR tiene: valor inicial, valor objetivo, valor actual, unidad (€, %, usuarios, etc.), status (on_track/at_risk/achieved). El progreso del Objective es la media ponderada de sus KRs. Vistas: semanal (check-in de cada KR), trimestral (burndown del ciclo), mapa de dependencias (este KR depende de aquel). La tabla `okrs` ya existe en BD.
**Para quién:** Etapas B y C.
**Loop:** 4 — KPIs/OKRs.

---

### F055 · OKRs compartidos (equipo) *(parcial)*
**Qué es:** Los OKRs a nivel de proyecto son visibles para todo el equipo.
**Lógica:** Dos niveles de OKRs: personales (solo visibles para el miembro) y de proyecto (visibles para todos). Los OKRs de proyecto se generan con `generate-organizational-okrs` que los ancla a la fase actual del negocio. Cada miembro tiene KRs personales asignados que contribuyen al KR del proyecto (con `contribution_weight`). La vista de equipo muestra el progreso global y la contribución individual de cada miembro.
**Para quién:** Etapa C. Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### F056 · Validate Monetization
**Qué es:** La IA evalúa si el modelo de monetización del proyecto es viable.
**Lógica:** `validate-monetization` recibe: modelo de ingresos, mercado objetivo, precio planificado, CAC estimado, LTV esperado, competencia y sus precios. Genera un informe con: score de viabilidad (0-100), pros y contras del modelo, 3 ejemplos de empresas exitosas con modelo similar, recomendaciones de ajuste (precio, segmento, canal), alertas de riesgo (ej: "precio muy bajo vs CAC estimado = no rentable"). Útil antes de lanzar para validar que el modelo tiene sentido matemáticamente.
**Para quién:** Etapa B.
**Loop:** 4 — KPIs/OKRs.

---

# MÓDULO 7 — FINANZAS

---

### F057 · Proyecciones financieras con IA
**Qué es:** La IA genera proyecciones de ingresos y gastos a 6-12 meses vista.
**Lógica:** `generate-financial-projections` recibe: modelo de precios, CAC actual, churn rate, cash inicial, tamaño del equipo, estructura de costes fijos/variables. Genera: P&L mensual proyectado, cash flow proyectado, KPIs calculados (MRR, ARR, burn rate, runway en meses). Tres escenarios: conservador, realista, optimista. Los datos se guardan en `financial_projections` y se muestran en gráficos de líneas con la línea real encima cuando los datos van llegando. Exportable a Excel con un click.
**Para quién:** Etapas B y C.
**Loop:** 5 — Finanzas.

---

### F058 · Cash Flow Dashboard
**Qué es:** Visualización mensual del estado financiero real: ingresos, gastos, margen y saldo.
**Lógica:** Agrega automáticamente datos de: OBVs cobrados (ingresos), gastos registrados manualmente o importados, datos de Stripe/Holded/QuickBooks (si integrados). Muestra por mes: barra de ingresos vs gastos, margen neto, saldo acumulado. Indicadores de alerta: si el saldo proyectado es negativo en los próximos 3 meses → alerta roja. Si el margen cae más de 20% vs mes anterior → alerta amarilla. El dashboard se actualiza en tiempo real cuando se registra un cobro de OBV.
**Para quién:** Etapas B y C.
**Loop:** 5 — Finanzas.

---

### F059 · Tracking de cobros
**Qué es:** Seguimiento del estado de cobro de cada OBV de venta.
**Lógica:** Para cada OBV de tipo `venta`, el sistema muestra: importe total, importe cobrado (suma de cobros parciales F036), importe pendiente, fecha esperada de cobro, días de retraso (calculados automáticamente como: hoy - fecha_esperada_cobro, solo si positivo). Vista de "Cobros pendientes" ordenada por urgencia (más días de retraso primero). El sistema genera alertas (F023) cuando un cobro lleva más de 30 días de retraso.
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

### F060 · Tracking de deuda
**Qué es:** Registro de deuda financiera del proyecto (préstamos, créditos, deuda con proveedores).
**Lógica:** El usuario registra: acreedor, importe total, importe pagado, cuota mensual, tipo de interés, fecha de vencimiento. El dashboard muestra la deuda total pendiente, el calendario de pagos de los próximos 6 meses, la carga financiera mensual (cuotas/ingresos %). Las deudas con fecha de pago inminente generan alertas (F023).
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

### F062 · Auto-sync finanzas
**Qué es:** Sincronización automática de datos financieros desde los OBVs hacia el dashboard.
**Lógica:** Cada vez que un OBV de tipo `venta` cambia de estado o se registra un cobro parcial, `auto-sync-finances` actualiza automáticamente: `financial_metrics` del proyecto, el cash flow del mes actual, los totales de facturación en `member_kpi_base`. El provider de sync soporta múltiples fuentes: Stripe, Holded, QuickBooks, Xero, PayPal, o CSV manual. El sync es incremental (solo datos nuevos desde la última sync).
**Para quién:** Etapas B y C.
**Loop:** 5 — Finanzas.

---

### F064 · Budget Tracking *(por implementar)*
**Qué es:** Comparativa de presupuesto planificado vs gasto real por categoría y mes.
**Lógica:** El usuario define un presupuesto mensual por categoría (marketing, desarrollo, operaciones, RRHH, etc.). El sistema compara automáticamente con los gastos reales registrados. Muestra: % de desviación por categoría, categorías sobre presupuesto (rojo), categorías bajo presupuesto (verde), proyección de gasto a fin de mes. Útil para equipos que necesitan control de costes. Guardado en `budget_items`.
**Para quién:** Etapas B y C.
**Loop:** 5 — Finanzas.

---

### F065 · Financial Anomaly Detection *(por implementar)*
**Qué es:** La IA detecta automáticamente comportamientos anómalos en las finanzas.
**Lógica:** La función RPC `detect_financial_anomalies()` se ejecuta semanalmente. Analiza: gastos que superan 2x el promedio de los últimos 3 meses en la misma categoría, margen que cae más del 15% vs mes anterior, cobros que llevan más de 60 días de retraso sin resolverse, burn rate que supera el runway esperado, ingresos estancados durante 3+ meses consecutivos. Por cada anomalía detectada genera una alerta (F023) con descripción, impacto estimado y acción recomendada.
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

### F066 · Sales Simulator (what-if)
**Qué es:** Simulador de escenarios financieros: "¿qué pasa si cierro X deals a Y€?".
**Lógica:** El usuario define parámetros hipotéticos: número de deals cerrados al mes, precio promedio por deal, % de descuento, plazo de cobro. El simulador calcula: impacto en MRR, impacto en cash flow a 3/6/12 meses, runway resultante, mes en que se alcanza break-even. Permite comparar hasta 3 escenarios en paralelo (conservador, realista, optimista) con gráficos superpuestos. No modifica datos reales, es solo simulación.
**Para quién:** Etapas B y C.
**Loop:** 5 — Finanzas.

---

### F067 · NPS (Net Promoter Score) *(por implementar)*
**Qué es:** Tracking de la satisfacción de clientes mediante la pregunta "¿recomendarías este producto?".
**Lógica:** Sistema de encuestas automáticas enviadas a clientes después de X días de uso o tras cerrar un servicio. La pregunta clásica NPS: "¿Con qué probabilidad recomendarías X a un amigo? (0-10)". Clasificación automática: 9-10 = Promotor, 7-8 = Neutral, 0-6 = Detractor. Cálculo: NPS = % Promotores - % Detractores. El dashboard muestra evolución del NPS a lo largo del tiempo. NPS < 0 genera alerta automática.
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

### F068 · Churn Tracking *(por implementar)*
**Qué es:** Seguimiento de clientes perdidos y análisis de causas.
**Lógica:** Cuando un OBV de cliente recurrente pasa a "Cerrado Perdido" o se marca manualmente como churned, se registra en `lost_reasons` con: cliente, producto, motivo (precio / competencia / falta de valor / soporte / timing), valor perdido. Dashboard de churn: tasa mensual de churn, valor ARR perdido, principales motivos (pie chart). Proyección de churn rate basada en tendencia actual. Compara el cohort de clientes que churnearon vs los que retuvieron para identificar patrones.
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

# MÓDULO 8 — ANALYTICS E INTELIGENCIA

---

### F070 · Benchmarking
**Qué es:** Comparativa de las métricas propias vs benchmarks del sector.
**Lógica:** Usa la tabla `kpi_benchmarks` que contiene: métricas promedio y percentiles (p25, p10) por industria. Muestra para cada KPI del proyecto: valor actual vs media del sector vs top 25% del sector. Indicadores: "Estás en el percentil 40 de tu industria en margen bruto". Fuente de los benchmarks: datos curados de informes públicos del sector, actualizados trimestralmente.
**Para quién:** Etapas B y C.
**Loop:** Transversal — revisión estratégica.

---

### F074 · AI Business Advisor
**Qué es:** Chat inteligente con un advisor de negocio que conoce el contexto completo del proyecto.
**Lógica:** A diferencia de un chatbot genérico, el Business Advisor tiene acceso RAG (Retrieval-Augmented Generation) a todos los datos del proyecto: OBVs, KPIs, finanzas, equipo, competidores, historial. Las respuestas están fundamentadas en los datos reales. El usuario puede preguntar: "¿Por qué estoy perdiendo deals en la fase de negociación?", "¿Qué mes debo esperar para ser rentable?", "¿Dónde está el cuello de botella de mi equipo?". El historial de chat se guarda en `advisor_chats` para mantener contexto entre sesiones.
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

### F075 · Análisis de competidores
**Qué es:** Análisis detallado de competidores directos con estrategias de diferenciación.
**Lógica:** `analyze-competitor-urls` recibe URLs de competidores. Scraping + IA extrae: propuesta de valor, pricing, features principales, positioning, puntos débiles, audiencia objetivo. Genera informe con: tabla comparativa (tú vs competidor 1 vs competidor 2), gaps de mercado no cubiertos por ninguno, estrategias de diferenciación recomendadas. El cron `competitor-intelligence-cron` re-escanea semanalmente para detectar cambios de precio o features y genera alertas automáticas.
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

### F082 · Análisis Brutal del Proyecto v3 *(por implementar)*
**Qué es:** El análisis más profundo y honesto que puede hacer la IA sobre el estado real del negocio.
**Lógica:** `analyze-project-data-v3` ejecuta 17 queries paralelas que recopilan todos los datos del proyecto (OBVs, finanzas, equipo, leads, OKRs, competidores, mercado). Usa Gemini 2.5 Flash para generar un análisis de 9 secciones: executive dashboard (score 0-100, health status), financial health (métricas + trends + warning signs), growth analysis (bottlenecks + oportunidades + amenazas), CRM performance (pipeline health + win rate + forecast), OKR performance, team performance, market analysis, financial forecast a 12 meses, action plan (inmediato + corto plazo + estratégico). Antes de generar, muestra un modal de "Pre-Analysis Review" donde el usuario puede ver qué datos se usarán y añadir contexto adicional (preguntas específicas, métricas actualizadas). La "Opinión Honesta" incluye verdades incómodas que el sistema detecta en los datos.
**Para quién:** Etapas B y C.
**Loop:** Transversal — análisis profundo mensual o trimestral.

---

# MÓDULO 9 — MASTERS Y PROGRESIÓN DE ROL

---

### F086 · Solicitud de Master
**Qué es:** Un miembro puede postularse para convertirse en el "Master" de su especialización.
**Lógica:** El Master es el referente de un rol dentro del equipo. Para solicitar: el miembro debe cumplir requisitos mínimos (nivel de KPIs, OBVs validados, antigüedad en el rol). Rellena: motivación, logros en el rol, evidencias de excelencia. La solicitud va a votación del equipo completo. Solo puede haber un Master por rol en cada proyecto.
**Para quién:** Etapa C. Equipo.
**Loop:** 6 — Progreso personal.

---

### F087 · Votación de Master
**Qué es:** El equipo decide democráticamente si aprobar o rechazar una solicitud de Master.
**Lógica:** Al crear la solicitud se abre un período de votación (configurable, típicamente 7 días). Cada miembro del proyecto puede votar sí/no con comentario opcional. Para aprobarse: se requiere mayoría simple (>50% de votos emitidos). Si la votación no alcanza quórum mínimo (>50% de miembros vota) en el plazo → la solicitud expira. El resultado se notifica a todos. Si es aprobado, el miembro anterior en ese rol pierde el título de Master (o puede permanecer si el proyecto decide tener múltiples Masters por rol).
**Para quién:** Etapa C. Equipo.
**Loop:** 6 — Progreso personal.

---

### F088 · Desafíos entre Masters
**Qué es:** Un miembro puede retar al Master actual de un rol para tomar su posición.
**Lógica:** El desafío puede ser de dos tipos:
- **Performance contest**: Durante un período definido (ej: 4 semanas), el retador y el Master compiten en métricas del rol. Quien tenga mejores métricas al final gana.
- **Direct challenge**: El retador propone un reto específico (ej: "cerraré más OBVs que el Master este mes"). El equipo evalúa el resultado.

El ganador obtiene/mantiene el título de Master. El perdedor no puede retar de nuevo durante 60 días.
**Para quién:** Etapa C. Equipo.
**Loop:** 6 — Progreso personal.

---

### F089 · Mentoring de Masters
**Qué es:** Los Masters tienen la responsabilidad de mentorizar a los miembros de su rol.
**Lógica:** El Master puede: organizar sesiones de mentoring con miembros de su rol, crear recursos de aprendizaje específicos para el rol, dar feedback en la validación de KPIs de su área. Las sesiones de mentoring se registran en `master_mentoring` con: fecha, temas tratados, objetivos del mentorizado, progreso. El Master acumula puntos de mentoring que impactan en su score de liderazgo y en el ranking.
**Para quién:** Etapa C. Equipo.
**Loop:** 6 — Progreso personal.

---

### F091 · Role Rotation
**Qué es:** Los miembros pueden solicitar cambiar su especialización a otro rol.
**Lógica:** Tipos de solicitud: swap (intercambio de roles entre dos miembros), transfer (cambio de rol sin intercambio), promote (ascenso a un rol más senior). Antes de aprobar, `cofounder-alignment-analyzer` calcula un "compatibility score" (0-100) que estima si el cambio beneficia al equipo basándose en: skills del solicitante, gaps actuales del equipo, historial de rendimiento. El solicitante indica motivo. El receptor (en caso de swap) debe aceptar. El admin tiene veto. El historial completo queda en `role_history`.
**Para quién:** Etapa C. Equipo.
**Loop:** Transversal.

---

### F093 · Gamification — Badges y Streaks *(parcial — completar)*
**Qué es:** Sistema de recompensas que incentiva el uso consistente y los logros en la plataforma.
**Lógica:**
**Badges** (19 tipos con rareza common/rare/epic/legendary): Se desbloquean automáticamente al cumplir condiciones. Ejemplos: "Primer OBV" (common), "10 KPIs validados" (rare), "Master de Ventas" (epic), "100 semanas de racha" (legendary). Al desbloquear un badge: modal animado con confetti y efecto bounce según rareza. Los badges tienen puntos de valor según rareza.

**Streaks**: Contador de semanas consecutivas donde el usuario completó al menos las 6 acciones del loop semanal. Milestones: 4 semanas = badge, 12 semanas = badge, 52 semanas = badge legendary. Si se rompe la racha → notificación de aviso. Si se pierde 1 semana → se puede recuperar con "comodín de racha" (1 por trimestre).

**Puntos**: Cada acción acumula puntos: tarea completada (+10), tarea validada por líder (+20), OBV cerrado (+50), OKR completado (+100), badge desbloqueado (+valor del badge). Los puntos alimentan el leaderboard (F114).
**Para quién:** Etapas B y C.
**Loop:** 6 — Progreso personal.

---

# MÓDULO 10 — DESARROLLO PERSONAL Y APRENDIZAJE

---

### F094 · Learning Roadmap personalizado
**Qué es:** La IA genera un roadmap de aprendizaje personalizado según el rol y los gaps detectados.
**Lógica:** `generate-learning-roadmap` analiza: rol de especialización del miembro, nivel actual (basado en KPIs y historial), objetivos del proyecto, fase del negocio. Genera un roadmap estructurado en semanas con: recursos a consumir (libros, cursos, artículos), habilidades a desarrollar, proyectos prácticos relacionados con tareas reales del proyecto, hitos de progreso. El roadmap se adapta dinámicamente cuando el miembro completa items o cuando el proyecto cambia de fase.
**Para quién:** Todos.
**Loop:** 6 — Progreso personal.

---

### F096 · Playbooks por rol
**Qué es:** Guías operativas específicas para cada especialización que explican cómo hacer el trabajo correctamente.
**Lógica:** `generate-playbook` genera un playbook personalizado para el rol del miembro en el contexto específico del proyecto. Contenido: responsabilidades detalladas del rol, procesos paso a paso para las actividades más importantes, métricas de éxito del rol, errores comunes y cómo evitarlos, recursos y herramientas recomendadas, plan de 90 días para el nuevo en el rol. Los playbooks se actualizan cuando el proyecto cambia de fase. El usuario puede añadir notas propias al playbook.
**Para quién:** Etapas B y C.
**Loop:** 6 — Progreso personal.

---

### F097 · AI Career Coach
**Qué es:** Chat con un coach de carrera para decisiones profesionales y personales.
**Lógica:** A diferencia del Business Advisor (F074) que habla del negocio, el Career Coach habla del individuo. Tiene acceso al perfil del usuario, su historial de KPIs, roles desempeñados, logros, fortalezas y áreas de mejora detectadas. Puede ayudar con: decidir si cambiar de especialización, prepararse para un desafío de Master, identificar los próximos pasos en su carrera emprendedora, reflexionar sobre qué está funcionando y qué no. Las conversaciones son privadas (no visibles para el equipo ni el admin).
**Para quién:** Todos.
**Loop:** 6 — Progreso personal.

---

# MÓDULO 11 — REUNIONES E INTELIGENCIA

---

### F101 · Transcripción de reuniones
**Qué es:** Convierte el audio de una reunión en texto automáticamente.
**Lógica:** `transcribe-meeting` usa OpenAI Whisper API. El usuario puede: subir un archivo de audio de una reunión ya grabada, o usar el grabador en vivo (`LiveMeetingRecorder`) que graba directamente desde el navegador. La transcripción identifica diferentes hablantes si están definidos como participantes. El resultado es texto completo con timestamps. La transcripción se guarda en la reunión y sirve como input para el análisis (F102).
**Para quién:** Etapas B y C. Equipo.
**Loop:** 1 — Agenda (reuniones de planificación semanal).

---

### F102 · Análisis de reunión con IA
**Qué es:** La IA extrae los puntos clave de la transcripción de la reunión.
**Lógica:** `analyze-meeting` procesa la transcripción y extrae automáticamente: tareas comprometidas (con responsable y deadline si se mencionaron), decisiones tomadas, leads o clientes mencionados, blockers identificados, métricas mencionadas, next steps acordados. Cada item extraído es revisable: el usuario puede aprobar, editar o eliminar antes de aplicar al sistema.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 1 — Agenda.

---

### F103 · Apply Meeting Insights
**Qué es:** Aplica automáticamente los insights de la reunión al sistema (crea tareas, OBVs, actualiza métricas).
**Lógica:** `apply-meeting-insights` toma los items aprobados en F102 y los aplica: crea tareas en el Kanban con el responsable asignado, crea OBVs para los leads mencionados, actualiza el estado de OBVs existentes si se discutieron en la reunión, registra las decisiones en el Activity Log. Con un solo click, la reunión queda "procesada" y todos los compromisos están en el sistema. Evita el problema clásico de que las decisiones de las reuniones quedan en el aire.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 1 — Agenda.

---

### F069e · AI Meeting Facilitator
**Qué es:** Asistente de IA activo durante la reunión que ayuda en tiempo real.
**Lógica:** Durante la reunión, el facilitador monitoriza: tiempo transcurrido vs duración planificada (alerta cuando queda 10% del tiempo), objetivos definidos al inicio vs lo que se ha discutido (avisa si no se han cubierto), energía del equipo estimada por el patrón de participación (alerta si hay silencio prolongado de algún miembro), temas que se desvían del objetivo de la reunión. Genera sugerencias contextuales: "Quedan 5 minutos, no se ha cerrado el punto de pricing". La facilitación es no intrusiva — el usuario elige si activarla.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 1 — Agenda.

---

# MÓDULO 12 — MARKETING Y CONTENIDO

---

### F106 · Pitch Deck Generator
**Qué es:** La IA genera una presentación completa del proyecto para inversores o clientes.
**Lógica:** `generate-pitch-deck` usa todos los datos del proyecto: idea, mercado (TAM/SAM/SOM si están en Deep Setup), modelo de ingresos, equipo, tracción (OBVs cerrados, MRR), competidores, propuesta de valor. Genera presentación de 10-15 slides con: problema, solución, mercado, producto, modelo de negocio, tracción, equipo, ask (si es para inversores). El contenido se adapta al tipo de audiencia (inversores vs clientes vs partners). Exportable como PDF o descargable.
**Para quién:** Etapa B.
**Loop:** Transversal.

---

### F112 · Brand Kit *(por implementar)*
**Qué es:** Generador y gestor de la identidad visual del proyecto.
**Lógica:** `generate-brand-kit` genera una propuesta de identidad visual: paleta de 5 colores (con psicología de cada color explicada), tipografías (heading + body + accent, importadas de Google Fonts), tono de voz (profesional/casual/friendly/authoritative con ejemplos de copy), variantes de logo (conceptos generados). El usuario puede ajustar cada elemento. La identidad se exporta como: CSS variables listas para usar en código, JSON de configuración, guía PDF de marca. Los colores del Brand Kit se importan automáticamente a la landing page generada (F113) y al web de la empresa.
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

### F113 · Web Generator + Deploy Vercel *(por implementar)*
**Qué es:** La IA genera una landing page completa del proyecto y la despliega automáticamente en Vercel.
**Lógica:** `approve-generation-preview` / `deploy-to-vercel`. El usuario define: secciones de la landing (hero, features, beneficios, testimonials, CTA, footer), colores (del Brand Kit si existe), tipografías, SEO (título, descripción meta). La IA genera el HTML/CSS completo responsive. El usuario puede previsualizar en iframe y editar el código si quiere. Con un click: `deploy-to-vercel` crea el proyecto en Vercel, despliega el HTML, devuelve la URL pública en vivo. La URL se guarda en el perfil del proyecto.
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

# MÓDULO 13 — RANKINGS Y VISIBILIDAD

---

### F114 · Rankings generales
**Qué es:** Leaderboard del equipo ordenado por múltiples métricas.
**Lógica:** El ranking muestra a todos los miembros del proyecto ordenados por: puntos totales de gamificación, OBVs cerrados, facturación generada, KPIs validados, tareas completadas. El usuario puede cambiar la métrica de ordenación. El ranking propio aparece siempre destacado (aunque esté en posición 10). Los cambios de posición se notifican ("Has subido al puesto 3 en OBVs este mes"). El ranking reinicia mensualmente para que nadie quede perpetuamente último.
**Para quién:** Etapas B y C. Equipo.
**Loop:** Transversal.

---

### F118 · Team Performance Dashboard
**Qué es:** Vista ejecutiva del rendimiento completo del equipo.
**Lógica:** Dashboard con: productividad media del equipo (tareas completadas / tareas planeadas %), heatmap de actividad por hora y día (cuándo trabaja el equipo), comparativa semana vs semana (evolución de las últimas 6 semanas), identificación de miembros en riesgo (bajo rendimiento sostenido) y top performers, distribución de carga de trabajo (¿está bien balanceada entre miembros?). Solo visible para admins. Los datos son siempre anónimos en vistas compartidas con el equipo.
**Para quién:** Etapa C. Equipo.
**Loop:** Transversal.

---

# MÓDULO 14 — NOTIFICACIONES E INTEGRACIONES

---

### F119 · Centro de notificaciones
**Qué es:** Bandeja de entrada de todas las notificaciones del sistema.
**Lógica:** Tipos de notificaciones: KPI/OBV pendiente de validar (con countdown del deadline), tarea asignada, validación resuelta (aprobada/rechazada con comentario del validador), alerta financiera, hito alcanzado, badge desbloqueado, mención en comentario. Las notificaciones tienen: prioridad (crítica/alta/normal), estado leído/no leído, acción directa (ir al item relevante). El badge de notificaciones se actualiza en tiempo real via Supabase Realtime. El usuario puede configurar qué tipos recibir por cada canal (in-app, email, Slack).
**Para quién:** Etapas B y C.
**Loop:** Transversal.

---

# MÓDULO 15 — FEATURES ADICIONALES DEL REPO ANTIGUO

---

### N01 · Dark / Light Mode *(por implementar)*
**Qué es:** El usuario puede elegir entre interfaz clara y oscura.
**Lógica:** `next-themes` gestiona el tema a nivel de `ThemeProvider` en el root de la app. Detecta automáticamente la preferencia del sistema (prefers-color-scheme). El usuario puede sobreescribir con toggle en el header (icono sol/luna). La preferencia se persiste en localStorage. Todos los componentes shadcn/ui son compatibles con dark mode via CSS variables de Tailwind. Los toasts (Sonner) también respetan el tema.
**Para quién:** Todos.
**Loop:** Transversal.

---

### N02 · Multi-idioma (i18n, 6 idiomas) *(por implementar)*
**Qué es:** La app está disponible en 6 idiomas.
**Lógica:** `react-i18next` con archivos de traducción en `locales/`. Idiomas: Español (defecto), English, Français, Deutsch, Português, Italiano. El selector de idioma (`LanguageSelector`) está en el header con banderas emoji. Al cambiar: `i18n.changeLanguage()` actualiza toda la UI en tiempo real sin recargar. La preferencia se guarda en `user_settings`. El contenido generado por IA se genera en el idioma seleccionado por el usuario (el prompt incluye instrucción de idioma).
**Para quién:** Todos.
**Loop:** Transversal.

---

### N05 · Organization Switcher — Multi-organización *(por implementar)*
**Qué es:** Un usuario puede pertenecer a múltiples organizaciones y cambiar entre ellas.
**Lógica:** A diferencia de multi-proyecto (donde el usuario tiene varios proyectos dentro de la misma organización), multi-organización permite que el mismo usuario sea miembro de organizaciones completamente independientes (ej: su startup + la startup de un amigo donde es advisor). El switcher muestra todas las orgs con su plan (Free/Starter/Pro/Enterprise). Al cambiar de org: se recarga todo el contexto, RLS cambia el tenant activo, el usuario ve solo los datos de la nueva org. El rol puede ser diferente en cada org.
**Para quién:** Todos.
**Loop:** Transversal.

---

### N09 · Work Mode por usuario *(por implementar)*
**Qué es:** El usuario configura la intensidad de trabajo de cada semana.
**Lógica:** Tres modos: Conservador (pocas tareas, ritmo sostenible), Moderado (carga normal), Agresivo (máximo rendimiento, muchas tareas). El modo se configura semana a semana (puede variar según la semana). Impacta en: número máximo de tareas que se le asignan esa semana, sugerencia de agenda (F018), alertas de sobrecarga. Útil para emprendedores con trabajo paralelo o compromisos variables. Guardado en `user_weekly_data` con la semana de referencia.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda.

---

### N10 · Weekly Availability Config *(por implementar)*
**Qué es:** El usuario define qué días de la semana está disponible y cuántas horas.
**Lógica:** Formulario semanal: checkbox por día (lunes a domingo) + horas disponibles ese día. La disponibilidad alimenta: el algoritmo de distribución de tareas (no se asignan tareas en días no disponibles), la sugerencia de agenda óptima (F018), el calendario de Google (F019) que refleja los bloques disponibles. Si el usuario no configura su disponibilidad antes del miércoles de cada semana, el sistema envía un recordatorio. Guardado en `user_weekly_availability`.
**Para quién:** Etapas B y C.
**Loop:** 1 — Agenda.

---

### N12 · Trello sync bidireccional *(por implementar)*
**Qué es:** Sincronización de tareas entre la app y tableros de Trello.
**Lógica:** Conexión via Trello API Key + Token. Configuración: qué tablero de Trello mapea a qué proyecto de la app, qué listas de Trello mapean a qué estados (To Do, Doing, Done, Blocked). Sync bidireccional: tareas creadas en la app → aparecen como cards en Trello; cards movidas en Trello → actualizan estado en la app. Sync manual (botón) o automático cada X horas. El mapeo se guarda en `external_task_mappings`. Útil para equipos que ya usan Trello y no quieren perder ese flujo.
**Para quién:** Etapas B y C. Equipo.
**Loop:** 2 — Tareas.

---

### N14 · HubSpot CRM integration *(por implementar)*
**Qué es:** Sincronización bidireccional entre el CRM de la app y HubSpot.
**Lógica:** OAuth completo con HubSpot. Import: trae contactos y deals de HubSpot como leads/OBVs en la app. Export: empuja leads/OBVs creados en la app hacia HubSpot como contactos y deals. El mapeo de campos es configurable (qué campo de HubSpot corresponde a qué campo de OBV). Los cambios se sincronizan via `hubspot_sync_queue` (procesamiento en batch para no sobrecargar la API de HubSpot). Útil para startups que ya tienen historial en HubSpot y quieren el sistema sin perder datos.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### N20 · Task Swapping con IA *(por implementar)*
**Qué es:** Ver F025b — Swap de tareas con alternativas generadas por IA y límites anti-abuso.
*(Detalle completo en F025b del Módulo 4)*

---

### N31 · OKR Check-ins semanales *(por implementar)*
**Qué es:** Actualización semanal del progreso de cada Key Result con reflexión.
**Lógica:** Cada lunes, el usuario ve un formulario de check-in para cada KR activo: valor actual (numérico), observaciones de la semana (qué avanzó, qué bloqueó), nivel de confianza en alcanzar el objetivo (0-100%). El historial de check-ins permite ver la evolución semana a semana. Si la confianza cae por debajo del 30%, el KR se marca automáticamente como `at_risk` y se genera una alerta (F023). El check-in es obligatorio — si el usuario no lo completa antes del viernes, se le recuerda y su validator_stats se ve afectado.
**Para quién:** Etapas B y C.
**Loop:** 4 — KPIs/OKRs.

---

### N32 · OKR Dependency Map *(por implementar)*
**Qué es:** Grafo visual que muestra qué Key Results dependen de otros.
**Lógica:** El usuario puede definir: "este KR no puede avanzar hasta que aquel otro KR esté al 50%". Las dependencias se guardan en `okr_dependencies`. El mapa visual muestra: nodos (KRs) conectados por flechas de dependencia, colores según estado (verde=on track, amarillo=at risk, rojo=off track), bloqueadores críticos (KRs que están bloqueando varios otros). Permite identificar el "cuello de botella" de los OKRs: el KR bloqueador de todo lo demás.
**Para quién:** Etapa C. Equipo.
**Loop:** 4 — KPIs/OKRs.

---

### N37 · KPI Benchmark vs Industria *(por implementar)*
**Qué es:** Compara los KPIs del proyecto con los promedios y percentiles de la industria.
**Lógica:** La tabla `kpi_benchmarks` contiene: por industria y por KPI (margen bruto, churn rate, CAC, LTV, NPS, tiempo medio de venta, etc.) los valores: promedio del sector, percentil 25 (bueno), percentil 10 (excelente). El usuario ve: dónde están sus métricas vs el sector, en qué percentil se encuentran, qué métricas están por debajo de la media del sector (requieren atención). Los benchmarks se actualizan trimestralmente con datos de informes públicos.
**Para quién:** Etapas B y C.
**Loop:** 4 — KPIs/OKRs.

---

### N41 · Financial Ratios *(por implementar)*
**Qué es:** Cálculo automático de ratios financieros clave.
**Lógica:** Calculados mensualmente y guardados en `financial_ratios_cache`: ROI (retorno sobre inversión), CAC (coste de adquisición de cliente), LTV (valor de vida del cliente), LTV/CAC ratio (debe ser >3x para ser sostenible), Payback period (meses para recuperar el CAC), Working capital ratio, Current ratio, Gross margin %, Net margin %. Para cada ratio: valor actual, evolución vs mes anterior, comparativa vs benchmark del sector (de F037). Alerta automática si LTV/CAC < 3 o si el payback supera 12 meses.
**Para quién:** Etapa C.
**Loop:** 5 — Finanzas.

---

### N47 · Cohort Analysis Dashboard *(por implementar)*
**Qué es:** Análisis de retención de clientes por cohortes.
**Lógica:** Agrupa clientes por mes de adquisición (cohorte). Para cada cohorte muestra qué % de clientes sigue activo a los M1, M3, M6, M12. Visualización en heatmap: filas = cohortes, columnas = meses de retención, color = % retención (verde>80%, amarillo 40-80%, rojo<40%). Permite identificar: ¿Los clientes adquiridos en diciembre se retienen mejor que los de junio? ¿Hay un "cliff" de abandono en el mes 3? Responde la pregunta: ¿Estamos mejorando la retención con el tiempo?
**Para quién:** Etapa C.
**Loop:** Transversal.

---

### N53 · Analyze Project Data v3 — Análisis Brutal *(por implementar)*
**Qué es:** Ver F082 — Análisis profundo con Gemini 2.5 Flash, 17 queries, 9 secciones de output.
*(Detalle completo en F082 del Módulo 8)*

---

### N57 · Growth Model AARRR *(por implementar)*
**Qué es:** Visualización y análisis del modelo de crecimiento Pirate Metrics.
**Lógica:** Las 5 etapas del modelo con datos reales del proyecto: Acquisition (leads captados, coste por lead, canales principales), Activation (% que llegan a primera venta, tiempo hasta primer valor), Retention (churn rate, DAU/MAU si aplica, NPS), Revenue (ARPU, MRR, LTV), Referral (tasa de referidos, viral coefficient). Para cada etapa: KPIs reales del proyecto + benchmarks del sector + tácticas recomendadas específicas para el negocio. No es solo teoría — usa los datos reales del CRM y finanzas para alimentar cada métrica.
**Para quién:** Etapa B.
**Loop:** Transversal.

---

### N59 · Buyer Persona Builder visual *(por implementar)*
**Qué es:** Constructor visual de perfiles de cliente ideal con datos reales del CRM.
**Lógica:** Combina: datos generados por IA (`suggest-buyer-persona`, F042) con datos reales de los OBVs cerrados ganados. El builder permite definir y visualizar: datos demográficos (edad, cargo, empresa tipo, ubicación), psicográficos (motivaciones, valores, estilo de vida), comportamiento de compra (proceso de decisión, objeciones típicas, canales preferidos), contexto de mercado por país (IVA, penetración digital, plataformas dominantes de la tabla `country_data`). Las personas se exportan como PDF para usar en pitches y propuestas.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM.

---

### N64 · Sales Simulator *(por implementar)*
**Qué es:** Entorno de práctica de ventas con escenarios reales y scoring.
**Lógica:** Biblioteca de escenarios (fácil/medio/difícil) con perfiles de cliente tipo. En cada escenario: el "cliente" dice algo, el usuario elige entre 3-4 respuestas posibles, cada respuesta tiene una puntuación (+10 a +50 puntos) y un feedback inmediato explicando por qué era buena o mala. El progreso avanza en 5 pasos: discovery → presentación → objeciones → negociación → cierre. Al finalizar: puntuación total, evaluación (Excelente/Bueno/Mejorable), key learnings específicos. El simulator está conectado con el Sales Playbook (N61) — cuando el usuario falla en una técnica, le apunta al recurso del playbook donde puede mejorar esa habilidad.
**Para quién:** Etapas B y C.
**Loop:** 3 — OBVs/CRM (es práctica directamente aplicable a ventas reales).

---

### N65 · Dual Onboarding — Startup vs Discovery *(por implementar)*
**Qué es:** Dos caminos de onboarding radicalmente distintos según si el usuario tiene empresa o está explorando.
**Lógica:**
- **Startup path (9 pasos)**: Para quien ya tiene empresa. Recoge: visión, estudio de mercado (TAM/SAM/SOM), modelo de negocio (Canvas simplificado), producto (MVP + roadmap), go-to-market, recursos, validaciones realizadas, timeline de hitos.
- **Discovery path (12 pasos)**: Para quien explora. Recoge: situación actual (empleado/desempleado/estudiante), disponibilidad semanal (horas), tolerancia al riesgo (escala 1-5), motivaciones (dinero/impacto/libertad/etc.), skills (código/ventas/marketing/etc.), industrias preferidas, audiencia (B2B/B2C), capital disponible, tipo de negocio preferido (SaaS/servicios/físico), urgencia de ingresos (meses).

El Discovery path termina en `DiscoveryResults`: perfil de emprendedor generado, 3-5 ideas de negocio con fit score personalizado, siguiente paso recomendado. Las ideas provienen de la base de datos de `curated_ideas` (50-100 ideas pre-curadas) filtradas y rankeadas según el perfil.
**Para quién:** Etapa A (Discovery) y B-C (Startup).
**Loop:** Transversal.

---

### N67 · Curated Ideas Database *(por implementar)*
**Qué es:** Base de datos de 50-100 ideas de negocio pre-curadas y validadas.
**Lógica:** Cada idea en `curated_ideas` tiene: nombre, categoría (tech_saas/servicios/ecommerce/marketplace/educación), descripción del negocio, audiencia objetivo, problema que resuelve, modelo de ingresos, skills necesarios, capital mínimo, horas semanales mínimas, dificultad (1-5), tiempo estimado a primer ingreso, ejemplos reales de negocios similares exitosos, primeros pasos concretos, errores comunes a evitar, recursos recomendados. El algoritmo de matching calcula un fit score para cada idea basándose en el perfil del usuario del Discovery path (F066). Las ideas con mayor fit se muestran primero.
**Para quién:** Etapa A.
**Loop:** Transversal.

---

### N70 · API Keys Management *(por implementar)*
**Qué es:** Los usuarios con plan Enterprise pueden generar claves de API para integrar la plataforma con sus sistemas.
**Lógica:** Panel en Settings > API. El usuario puede: generar nuevas API keys (se muestran solo una vez, luego solo el prefix), copiar, regenerar (invalida la anterior), revocar. Cada key tiene: prefix visible, hash almacenado (nunca el valor completo), fecha de creación, fecha de último uso, límite de requests. El endpoint `api-v1` valida la key en cada request. El usage se registra en `api_usage` (endpoint, método, tokens usados, coste). El admin puede ver el uso agregado de todas las keys de la organización.
**Para quién:** Etapa C.
**Loop:** Transversal.

---

*Fin del documento. 223 features explicadas.*
*Actualizar cuando se implemente o modifique una feature.*
*Última actualización: 2026-02-24*
