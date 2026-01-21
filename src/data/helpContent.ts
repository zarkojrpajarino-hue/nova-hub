import { HelpContent } from '@/components/ui/section-help';

// ============================================
// DASHBOARD
// ============================================

export const HELP_DASHBOARD: HelpContent = {
  title: 'Dashboard Principal',
  description: 'Vista ejecutiva del rendimiento global del equipo NOVA. Aquí encontrarás el resumen de todos los KPIs, alertas inteligentes y el progreso hacia los objetivos del curso.',
  howItWorks: 'El dashboard agrega automáticamente los datos de los 9 socios del equipo. Los objetivos se multiplican x9 (por cada socio) para mostrar las metas colectivas. Las tarjetas de progreso se actualizan en tiempo real.',
  dataSource: 'Los datos provienen de la vista "member_stats" de Supabase, que consolida OBVs validados, Learning Paths completados, Book Points, Community Points y métricas financieras de cada socio.',
  validation: 'Solo aparecen datos de KPIs que han sido validados mediante el sistema de validación circular (2 de 3 aprobaciones requeridas en máximo 3 días).',
  tips: [
    'Haz clic en cualquier tarjeta de KPI para ver el desglose por socio',
    'El gráfico de evolución semanal te ayuda a identificar tendencias',
    'Las alertas inteligentes priorizan acciones urgentes automáticamente',
  ],
};

export const HELP_STAT_CARDS: HelpContent = {
  title: 'Tarjetas de KPIs',
  description: 'Muestran el progreso agregado del equipo hacia cada objetivo: OBVs, Learning Paths (LP), Book Points (BP), Community Points (CP), Facturación y Margen.',
  howItWorks: 'Cada tarjeta suma los valores de los 9 socios y los compara con el objetivo total del equipo. La barra de progreso indica el porcentaje de cumplimiento.',
  dataSource: 'Tabla "member_stats": campos obvs, lps, bps, cps, facturacion, margen. Objetivos desde tabla "objectives" multiplicados x9.',
  validation: 'Los valores mostrados solo incluyen KPIs que han pasado el proceso de validación circular.',
  tips: [
    'Verde = 80%+ del objetivo cumplido',
    'Amarillo = 50-80% del objetivo',
    'El objetivo individual por socio es el total dividido entre 9',
  ],
};

export const HELP_WEEKLY_CHART: HelpContent = {
  title: 'Evolución Semanal',
  description: 'Gráfico que muestra la evolución de los KPIs principales a lo largo de las semanas del curso académico.',
  howItWorks: 'Se calculan los totales semanales de cada KPI y se representan en un gráfico de líneas. Permite identificar tendencias, picos de actividad y semanas con bajo rendimiento.',
  dataSource: 'Vista "weekly_evolution" que agrupa los datos por semana desde las tablas de OBVs, KPIs y transacciones financieras.',
  tips: [
    'Pasa el cursor sobre los puntos para ver valores exactos',
    'Usa el selector para cambiar entre diferentes métricas',
    'Compara diferentes semanas para identificar patrones',
  ],
};

export const HELP_TOP_RANKINGS: HelpContent = {
  title: 'Top Rankings',
  description: 'Muestra el Top 3 de socios en cada categoría de KPI, fomentando la competencia sana y reconociendo el esfuerzo.',
  howItWorks: 'Ordena los 9 socios por cada métrica (OBVs, Margen, LPs, etc.) y muestra los tres primeros con sus valores actuales.',
  dataSource: 'Datos ordenados de "member_stats" por cada campo de KPI.',
  tips: [
    'El ranking se actualiza en tiempo real',
    'Haz clic en un socio para ver su perfil completo',
    'Cambia entre pestañas para ver diferentes categorías',
  ],
};

export const HELP_RECENT_ACTIVITY: HelpContent = {
  title: 'Actividad Reciente',
  description: 'Feed cronológico de las últimas acciones realizadas por el equipo: nuevos OBVs, validaciones, leads creados, etc.',
  howItWorks: 'Registra automáticamente cada acción importante en la plataforma y la muestra en orden cronológico inverso (más recientes primero).',
  dataSource: 'Tabla "activity_log" que registra eventos con timestamp, tipo de acción, usuario y detalles.',
  tips: [
    'Filtra por tipo de actividad usando las pestañas',
    'Haz clic en una actividad para ver más detalles',
    'Útil para mantenerte al día con el trabajo del equipo',
  ],
};

export const HELP_PENDING_VALIDATIONS: HelpContent = {
  title: 'Validaciones Pendientes',
  description: 'Lista de OBVs y KPIs de tus compañeros que requieren tu validación para ser contabilizados oficialmente.',
  howItWorks: 'El sistema de validación circular te asigna automáticamente como validador de tus 3 compañeros anteriores en la lista. Tienes 3 días para validar cada item.',
  dataSource: 'Vista "pending_validations" que filtra entries donde tu ID está en validators_pending y status = "pending".',
  validation: 'Sistema circular: cada persona valida a las 3 anteriores en la lista. Si no validas en 3 días, quedas bloqueado para subir nuevos KPIs.',
  tips: [
    'Revisa las evidencias antes de validar',
    'Puedes rechazar con comentario si algo no está correcto',
    '¡Valida a tiempo para no quedar bloqueado!',
  ],
};

export const HELP_SMART_ALERTS: HelpContent = {
  title: 'Alertas Inteligentes',
  description: 'Sistema de notificaciones prioritarias que identifica situaciones que requieren atención inmediata.',
  howItWorks: 'Analiza los datos del equipo y genera alertas automáticas: socios rezagados, leads sin seguimiento, fechas límite próximas, validaciones vencidas, etc.',
  dataSource: 'Algoritmo que analiza "member_stats", "leads", "tasks", "obvs" y "pending_validations" para detectar anomalías y situaciones críticas.',
  tips: [
    'Las alertas rojas son urgentes - actúa primero en ellas',
    'Haz clic en una alerta para ir directamente al área afectada',
    'Puedes silenciar alertas temporalmente si ya estás trabajando en ellas',
  ],
};

// ============================================
// MI ESPACIO
// ============================================

export const HELP_MI_ESPACIO: HelpContent = {
  title: 'Mi Espacio Personal',
  description: 'Tu dashboard personalizado con tus KPIs individuales, proyectos asignados, tareas pendientes y progreso personal hacia los objetivos del curso.',
  howItWorks: 'Muestra tus datos filtrados por tu ID de usuario. Incluye tu progreso en cada KPI comparado con el objetivo individual (1/9 del objetivo del equipo).',
  dataSource: 'Tabla "member_stats" filtrada por tu email. Proyectos desde "project_members" y tareas desde "tasks".',
  tips: [
    'Revisa tu espacio diariamente para mantenerte enfocado',
    'Los gráficos de progreso te muestran dónde necesitas mejorar',
    'Desde aquí puedes subir nuevos OBVs rápidamente',
  ],
};

export const HELP_MIS_KPIS: HelpContent = {
  title: 'Mis KPIs Personales',
  description: 'Detalle de tus métricas individuales: OBVs, Learning Paths, Book Points, Community Points, Facturación y Margen.',
  howItWorks: 'Cada tarjeta muestra tu valor actual vs. el objetivo individual. El objetivo es el total del equipo dividido entre 9 socios.',
  dataSource: 'Campos de "member_stats" para tu usuario: obvs, lps, bps, cps, facturacion, margen.',
  validation: 'Solo se muestran KPIs que han sido validados. Los pendientes aparecen como "En validación".',
  tips: [
    'El objetivo individual es 1/9 del objetivo total del equipo',
    'Haz clic en un KPI para ver el historial detallado',
    'Puedes editar tu base de KPIs con el botón de edición',
  ],
};

export const HELP_MIS_PROYECTOS: HelpContent = {
  title: 'Mis Proyectos',
  description: 'Lista de proyectos en los que participas, tu rol en cada uno y el estado actual de cada proyecto.',
  howItWorks: 'Filtra la tabla "project_members" por tu ID y muestra los proyectos asociados con tu rol asignado.',
  dataSource: 'Relación "project_members" → "projects" filtrada por tu member_id.',
  tips: [
    'Haz clic en un proyecto para ver su detalle completo',
    'El icono indica si eres líder del proyecto',
    'Los proyectos se ordenan por actividad reciente',
  ],
};

export const HELP_MIS_TAREAS: HelpContent = {
  title: 'Mis Tareas',
  description: 'Lista de tareas asignadas a ti, organizadas por urgencia: vencidas, hoy y próximas.',
  howItWorks: 'Muestra tareas donde eres el "assignee_id" ordenadas por fecha de vencimiento. Las tareas con playbook incluyen guías paso a paso.',
  dataSource: 'Tabla "tasks" filtrada por assignee_id = tu ID de usuario.',
  tips: [
    'Las tareas vencidas aparecen en rojo - ¡priorízalas!',
    'Las tareas con icono de libro tienen un playbook IA con instrucciones detalladas',
    'Puedes filtrar por proyecto o tipo de tarea',
  ],
};

// ============================================
// CENTRO DE OBVs
// ============================================

export const HELP_OBV_CENTER: HelpContent = {
  title: 'Centro de OBVs',
  description: 'Hub central para gestionar tus Observaciones de Valor (OBVs): subirlas, validar las de compañeros y revisar el historial.',
  howItWorks: 'Los OBVs son el principal KPI de LEINN. Cada OBV registra una actividad de valor realizada: reuniones con clientes, ventas, eventos, etc.',
  dataSource: 'Tabla "obvs" con campos: título, descripción, fecha, evidencia_url, owner_id, proyecto_id, validations.',
  validation: 'Sistema circular: Al subir un OBV, se asignan como validadores las 3 personas anteriores en la lista del mes. Tienes 3 días para que te validen.',
  tips: [
    'Incluye siempre evidencia (fotos, documentos, links a Drive)',
    'Sé específico en la descripción del valor generado',
    'Las OBVs de venta incluyen datos financieros automáticamente',
  ],
};

export const HELP_SUBIR_OBV: HelpContent = {
  title: 'Subir Nuevo OBV',
  description: 'Formulario para registrar una nueva Observación de Valor con toda la información requerida.',
  howItWorks: 'Completa el formulario con título, descripción, fecha, proyecto asociado y adjunta evidencia. Al guardar, se asignan validadores automáticamente según el sistema circular.',
  dataSource: 'Crea un nuevo registro en la tabla "obvs" y genera entradas en "pending_validations" para los 3 validadores asignados.',
  validation: 'Los validadores son las 3 personas anteriores a ti en la lista circular del mes. Tienen 3 días para aprobar o rechazar.',
  tips: [
    'La evidencia puede ser: fotos, documentos PDF, links a Drive',
    'Sé claro y específico en el título',
    'Asocia el OBV al proyecto correcto para mejor tracking',
  ],
};

export const HELP_VALIDAR_OBVS: HelpContent = {
  title: 'Validar OBVs',
  description: 'Lista de OBVs de tus compañeros que requieren tu validación como parte del sistema circular.',
  howItWorks: 'Revisa la información y evidencia de cada OBV. Aprueba si es correcto o rechaza con comentario si hay problemas. Tienes 3 días desde que se subió.',
  dataSource: 'Vista "pending_validations" filtrada por tu ID como validador pendiente.',
  validation: 'Tu voto se suma a los otros validadores. Con 2 aprobaciones el OBV se valida. Con 2 rechazos se devuelve al autor. ¡Si no validas a tiempo, quedas bloqueado!',
  tips: [
    'Revisa siempre la evidencia antes de aprobar',
    'Si rechazas, deja un comentario constructivo',
    '¡Valida a tiempo para evitar el bloqueo!',
  ],
};

export const HELP_MIS_OBVS: HelpContent = {
  title: 'Mis OBVs',
  description: 'Historial completo de todos los OBVs que has subido, con su estado de validación actual.',
  howItWorks: 'Lista cronológica de tus OBVs mostrando: validados (verde), pendientes (amarillo), rechazados (rojo).',
  dataSource: 'Tabla "obvs" filtrada por tu owner_id, ordenada por fecha descendente.',
  tips: [
    'Puedes editar OBVs rechazados y reenviarlos',
    'Filtra por estado para ver solo los pendientes',
    'Exporta tu historial para reportes personales',
  ],
};

// ============================================
// OTROS KPIs (LP, BP, CP)
// ============================================

export const HELP_KPIS: HelpContent = {
  title: 'Otros KPIs',
  description: 'Gestión de Learning Paths (LP), Book Points (BP) y Community Points (CP) - los tres KPIs de desarrollo personal.',
  howItWorks: 'Cada pestaña te permite registrar y ver el progreso en cada tipo de KPI. LPs y BPs requieren validación circular, los CPs se registran inmediatamente.',
  dataSource: 'Tabla "kpis" con type: "lp", "bp" o "cp" y sus respectivas validaciones.',
  validation: 'LP y BP: Sistema circular (3 validadores, 3 días). CP: Sin validación, se suma inmediatamente.',
  tips: [
    'LP: Cursos y certificaciones completadas (requiere validación)',
    'BP: Libros leídos - indica cuántos puntos vale cada libro',
    'CP: Actividades de comunidad - se suman inmediatamente sin validación',
  ],
};

export const HELP_LP: HelpContent = {
  title: 'Learning Paths (LP)',
  description: 'Registro de cursos, certificaciones, bootcamps y cualquier formación completada que contribuya a tu desarrollo profesional.',
  howItWorks: 'Sube la evidencia de completar un learning path (certificado, diploma, captura de pantalla) con descripción de lo aprendido. Cada LP vale 1 punto.',
  dataSource: 'Tabla "kpis" con type = "lp": título, descripción, fecha_completado, evidencia_url.',
  validation: 'Sistema circular: las 3 personas anteriores en la lista te validan. Tienen 3 días para aprobar.',
  tips: [
    'Incluye el certificado o prueba de completado',
    'Especifica la plataforma (Coursera, Udemy, etc.)',
    'Indica las horas invertidas en la descripción',
  ],
};

export const HELP_BP: HelpContent = {
  title: 'Book Points (BP)',
  description: 'Registro de libros leídos relacionados con emprendimiento, liderazgo, negocios o desarrollo personal.',
  howItWorks: 'Indica el número de Book Points que otorga el libro (según su complejidad/longitud). Sube evidencia y descripción. Los puntos se suman al validarse.',
  dataSource: 'Tabla "kpis" con type = "bp" y campo cp_points para indicar cuántos puntos vale el libro.',
  validation: 'Sistema circular: las 3 personas anteriores te validan. Los puntos indicados se suman a tu contador al aprobarse.',
  tips: [
    'Indica cuántos Book Points vale el libro según su tamaño',
    'Escribe un resumen de al menos 200 palabras',
    'Incluye 3-5 aprendizajes clave aplicables',
  ],
};

export const HELP_CP: HelpContent = {
  title: 'Community Points (CP)',
  description: 'Registro de actividades de impacto en la comunidad: eventos, charlas, networking, voluntariado, mentorías.',
  howItWorks: 'Los Community Points se registran y suman inmediatamente sin necesidad de validación. Cada actividad vale 1 CP.',
  dataSource: 'Tabla "kpis" con type = "cp". Los CPs se guardan con status "validated" directamente.',
  tips: [
    'No necesitan validación - se suman automáticamente',
    'Describe el impacto generado (personas alcanzadas, valor aportado)',
    'Incluye evidencia aunque no sea obligatoria para tu registro',
  ],
};

// ============================================
// SISTEMA DE VALIDACIÓN CIRCULAR
// ============================================

export const HELP_VALIDACION_CIRCULAR: HelpContent = {
  title: 'Sistema de Validación Circular',
  description: 'Sistema donde cada persona valida a las 3 anteriores en una lista ordenada que rota mensualmente.',
  howItWorks: 'La lista de orden se define mensualmente. Cuando subes un KPI/OBV, automáticamente se asignan como validadores las 3 personas que están encima de ti en la lista (de forma circular).',
  dataSource: 'Tabla "validation_order" con la posición de cada usuario por mes. Tabla "validator_stats" para tracking de rendimiento.',
  validation: 'Tienes 3 días para validar. Si pasas el plazo, quedas bloqueado para subir nuevos KPIs hasta que completes tus validaciones pendientes.',
  tips: [
    'Revisa diariamente tus validaciones pendientes',
    'El bloqueo se levanta automáticamente al validar tus pendientes',
    'La lista rota cada mes para que todos validen a diferentes personas',
  ],
};

export const HELP_BLOQUEO_VALIDACION: HelpContent = {
  title: 'Bloqueo por Validación Tardía',
  description: 'Penalización que impide subir nuevos KPIs cuando tienes validaciones vencidas sin completar.',
  howItWorks: 'Si pasan más de 3 días desde que se te asignó una validación sin que la completes, quedas bloqueado. No podrás subir OBVs ni KPIs hasta que valides todos tus pendientes.',
  dataSource: 'Tabla "validator_stats" campo is_blocked. Se actualiza automáticamente mediante triggers.',
  tips: [
    'Revisa el banner de bloqueo para ver cuántas validaciones te faltan',
    'El bloqueo se levanta inmediatamente al validar todo',
    'Prioriza validar antes de subir nuevos KPIs',
  ],
};

// ============================================
// TAREAS CON PLAYBOOK IA
// ============================================

export const HELP_TAREAS_PLAYBOOK: HelpContent = {
  title: 'Tareas con Playbook IA',
  description: 'Las tareas generadas por IA incluyen un playbook con instrucciones paso a paso, tips y checklist para completarlas exitosamente.',
  howItWorks: 'Al generar tareas con el botón "✨ Generar con IA", la inteligencia artificial crea tareas contextualizadas al proyecto con playbooks detallados que guían su ejecución.',
  dataSource: 'Campo "playbook" en tabla "tasks" con estructura JSON: pasos, tips, checklist, contexto.',
  tips: [
    'Haz clic en "Playbook" para ver las instrucciones detalladas',
    'El playbook incluye pasos específicos para tu proyecto',
    'Usa el checklist para asegurar que no olvidas nada',
  ],
};

// ============================================
// FINANCIERO
// ============================================

export const HELP_FINANCIERO: HelpContent = {
  title: 'Control Financiero',
  description: 'Visión completa de las finanzas del equipo: facturación, márgenes, cobros pendientes y proyecciones.',
  howItWorks: 'Agrega datos financieros de todos los proyectos y socios para mostrar métricas consolidadas y desglosadas.',
  dataSource: 'Vistas "financial_metrics" y "pending_payments" que calculan totales desde OBVs de venta.',
  tips: [
    'Revisa semanalmente para detectar desviaciones',
    'Los márgenes por proyecto ayudan a priorizar',
    'Las proyecciones se basan en tendencias históricas',
  ],
};

export const HELP_DASHBOARD_FINANCIERO: HelpContent = {
  title: 'Dashboard Financiero',
  description: 'Métricas clave: facturación total, margen bruto, cobrado vs pendiente, y comparativas vs. objetivos.',
  howItWorks: 'Suma todas las OBVs de venta y calcula facturación, margen y estado de cobro. Compara con objetivos del curso.',
  dataSource: 'Tabla "obvs" donde es_venta = true. Campos: facturacion, margen, estado_cobro, importe_cobrado.',
  tips: [
    'El margen es facturación menos costes directos',
    'Los pagos vencidos aparecen destacados en rojo',
    'Haz clic en un proyecto para ver su detalle financiero',
  ],
};

export const HELP_GESTION_COBROS: HelpContent = {
  title: 'Gestión de Cobros',
  description: 'Control de facturas emitidas: pendientes de cobro, cobradas parcialmente, y vencidas.',
  howItWorks: 'Lista todas las OBVs de venta con su estado de cobro. Permite actualizar estados y registrar cobros parciales.',
  dataSource: 'Vista "pending_payments" con campos: numero_factura, importe, estado_cobro, fecha_cobro_esperada, dias_vencido.',
  tips: [
    'Las facturas vencidas aparecen en rojo',
    'Actualiza el estado cuando recibas un cobro',
    'Los cobros parciales se registran por separado',
  ],
};

export const HELP_PROYECCIONES: HelpContent = {
  title: 'Proyecciones Financieras',
  description: 'Estimaciones de facturación y margen para los próximos meses basadas en pipeline y tendencias.',
  howItWorks: 'Algoritmo que analiza: leads del CRM (ponderados por probabilidad), tendencia histórica, y estacionalidad.',
  dataSource: 'Combinación de "leads" (valor_potencial × probabilidad), OBVs históricas, y modelos predictivos.',
  tips: [
    'Las proyecciones son estimaciones, no garantías',
    'Se actualizan automáticamente al cambiar el pipeline',
    'Útil para planificar recursos y objetivos',
  ],
};

// ============================================
// CRM
// ============================================

export const HELP_CRM: HelpContent = {
  title: 'CRM Global',
  description: 'Pipeline de ventas unificado de todos los proyectos. Gestiona leads, oportunidades y el embudo de conversión.',
  howItWorks: 'Agrega todos los leads de todos los proyectos en una vista Kanban unificada. Permite filtrar por proyecto, responsable o estado.',
  dataSource: 'Vista "pipeline_global" que une "leads" con "projects" y "profiles" (responsables).',
  tips: [
    'Arrastra leads entre columnas para cambiar su estado',
    'Filtra por proyecto para ver solo ese pipeline',
    'Los leads sin actividad en 7 días aparecen marcados',
  ],
};

export const HELP_CRM_OVERVIEW: HelpContent = {
  title: 'Resumen del Pipeline',
  description: 'Métricas agregadas del embudo: leads por etapa, valor total, tasa de conversión, tiempo promedio de cierre.',
  howItWorks: 'Calcula métricas del pipeline completo: cuenta leads por status, suma valores potenciales, analiza conversiones.',
  dataSource: 'Agregaciones sobre la tabla "leads": COUNT, SUM(valor_potencial), análisis de timestamps de cambio de estado.',
  tips: [
    'El embudo muestra cuántos leads hay en cada etapa',
    'La tasa de conversión indica efectividad comercial',
    'Compara valores potenciales por proyecto',
  ],
};

export const HELP_CRM_PIPELINE: HelpContent = {
  title: 'Pipeline Kanban',
  description: 'Vista Kanban del embudo de ventas con columnas por estado: Frío, Tibio, Caliente, Negociación, Cerrado.',
  howItWorks: 'Arrastra leads entre columnas para actualizar su estado. Cada movimiento se registra en el historial.',
  dataSource: 'Tabla "leads" con campos: nombre, empresa, status, valor_potencial, responsable_id, proxima_accion.',
  tips: [
    'Haz clic en un lead para ver su historial completo',
    'La próxima acción te recuerda qué hacer con cada lead',
    'Completa los leads ganados para convertirlos en OBVs de venta',
  ],
};

// ============================================
// ANALYTICS
// ============================================

export const HELP_ANALYTICS: HelpContent = {
  title: 'Análisis y Reportes',
  description: 'Herramientas avanzadas de análisis: comparativas entre socios, proyectos, evolución temporal y predicciones.',
  howItWorks: 'Combina datos de todas las fuentes para generar visualizaciones comparativas y análisis de tendencias.',
  dataSource: 'Agregación de "member_stats", "project_stats", "obvs", "leads" y datos históricos.',
  tips: [
    'Usa filtros para comparar períodos específicos',
    'Exporta reportes en CSV o PDF',
    'Las predicciones usan IA para proyectar tendencias',
  ],
};

export const HELP_COMPARATIVA_SOCIOS: HelpContent = {
  title: 'Comparativa entre Socios',
  description: 'Tabla y gráficos que comparan el rendimiento de los 9 socios en todas las métricas.',
  howItWorks: 'Muestra todos los KPIs de cada socio lado a lado. El gráfico radar visualiza fortalezas y debilidades.',
  dataSource: 'Vista "member_stats" completa con todos los campos de KPI.',
  tips: [
    'El radar muestra el perfil de cada socio',
    'Ordena por cualquier columna para ver rankings',
    'Compara con el promedio del equipo',
  ],
};

export const HELP_COMPARATIVA_PROYECTOS: HelpContent = {
  title: 'Comparativa entre Proyectos',
  description: 'Análisis comparativo del rendimiento de cada proyecto: OBVs, ventas, leads, y equipo.',
  howItWorks: 'Agrega métricas por proyecto y las presenta en gráficos comparativos.',
  dataSource: 'Vista "project_stats" con totales de cada proyecto.',
  tips: [
    'Identifica qué proyectos necesitan más atención',
    'Compara tamaño de equipo vs. resultados',
    'Analiza la efectividad comercial de cada proyecto',
  ],
};

export const HELP_PREDICCIONES: HelpContent = {
  title: 'Predicciones IA',
  description: 'Proyecciones inteligentes sobre rendimiento futuro basadas en tendencias y patrones históricos.',
  howItWorks: 'Algoritmos de IA analizan datos históricos para predecir: socios en riesgo, proyectos prometedores, facturación esperada.',
  dataSource: 'Modelo predictivo alimentado por todas las tablas históricas del sistema.',
  tips: [
    'Las predicciones se actualizan semanalmente',
    'Usa las alertas para anticipar problemas',
    'Las recomendaciones son orientativas, no deterministas',
  ],
};

// ============================================
// RANKINGS
// ============================================

export const HELP_RANKINGS: HelpContent = {
  title: 'Rankings del Equipo',
  description: 'Sistema de rankings que muestra la posición de cada socio en diferentes categorías de rendimiento.',
  howItWorks: 'Ordena a los 9 socios por cada métrica y muestra su posición. Incluye tendencias (subiendo/bajando) respecto al período anterior.',
  dataSource: 'Tabla "role_rankings" con posición, score y previous_position para calcular tendencias.',
  tips: [
    'Los rankings fomentan competencia sana',
    'Mira las tendencias, no solo la posición actual',
    'Filtra por rol para ver rankings específicos',
  ],
};

export const HELP_RANKING_ROLES: HelpContent = {
  title: 'Rankings por Rol',
  description: 'Rankings específicos según el rol en los proyectos: comerciales, técnicos, coordinadores, etc.',
  howItWorks: 'Agrupa socios por su rol y compara métricas relevantes para cada tipo de rol usando pesos específicos.',
  dataSource: 'Cruce de "project_members" (roles) con métricas de rendimiento, usando la función calculate_role_performance_score.',
  tips: [
    'Los comerciales se comparan por leads y ventas',
    'Los técnicos por tareas y OBVs de entrega',
    'Los coordinadores por gestión y cumplimiento general',
  ],
};

// ============================================
// MI DESARROLLO
// ============================================

export const HELP_MI_DESARROLLO: HelpContent = {
  title: 'Mi Desarrollo Profesional',
  description: 'Espacio para reflexionar sobre tu crecimiento, documentar insights y acceder a guías de rol personalizadas.',
  howItWorks: 'Combina tus métricas de rendimiento con herramientas de reflexión y playbooks generados por IA para tu rol actual.',
  dataSource: 'Tablas "user_insights" (tus reflexiones), "user_playbooks" (guías), y vista "user_role_performance" (tu rendimiento).',
  tips: [
    'Registra insights semanalmente para mejor seguimiento',
    'Los playbooks se adaptan a tu rol y experiencia',
    'Revisa tu progreso mensualmente con el equipo',
  ],
};

export const HELP_INSIGHTS: HelpContent = {
  title: 'Mis Insights',
  description: 'Diario de aprendizajes y reflexiones sobre tu trabajo, logros, retos y lecciones aprendidas.',
  howItWorks: 'Registra insights categorizados (logro, aprendizaje, reto, feedback). Son privados por defecto pero puedes compartirlos.',
  dataSource: 'Tabla "user_insights": tipo, titulo, contenido, tags, proyecto relacionado.',
  tips: [
    'Escribe al menos un insight por semana',
    'Relaciona insights con proyectos específicos',
    'Revísalos antes de reuniones de feedback',
  ],
};

export const HELP_PLAYBOOKS: HelpContent = {
  title: 'Playbooks de Rol',
  description: 'Guías personalizadas generadas por IA para tu rol actual con best practices y consejos específicos.',
  howItWorks: 'La IA analiza tu rol, experiencia y rendimiento para generar un playbook con recomendaciones específicas, fortalezas y áreas de mejora.',
  dataSource: 'Tabla "user_playbooks" generada por Edge Function "generate-playbook" con contexto de tu perfil y métricas.',
  tips: [
    'Regenera el playbook cuando cambies de rol',
    'Los playbooks incluyen objetivos sugeridos',
    'Comparte secciones útiles con el equipo',
  ],
};

// ============================================
// ROTACIÓN DE ROLES
// ============================================

export const HELP_ROTACION: HelpContent = {
  title: 'Rotación de Roles',
  description: 'Sistema para gestionar el intercambio de roles entre proyectos, fundamental en la metodología LEINN.',
  howItWorks: 'Permite solicitar intercambios de rol con otros socios, ver historial de rotaciones y recibir sugerencias de IA sobre roles ideales.',
  dataSource: 'Tablas "role_rotation_requests", "project_members" (roles actuales), "role_history".',
  tips: [
    'La rotación cada 3-6 meses es recomendada',
    'Considera tus fortalezas y áreas a desarrollar',
    'Consulta las sugerencias de IA antes de decidir',
  ],
};

export const HELP_SOLICITAR_ROTACION: HelpContent = {
  title: 'Solicitar Cambio de Rol',
  description: 'Formulario para solicitar formalmente un intercambio de rol con otro socio.',
  howItWorks: 'Selecciona el proyecto, tu rol actual, el rol deseado y con quién quieres intercambiar. Ambos deben aceptar para completar el swap.',
  dataSource: 'Crea registro en "role_rotation_requests" con status "pending". Requiere aceptación de ambas partes.',
  tips: [
    'Ambas partes deben aceptar para completar el intercambio',
    'El score de rendimiento se resetea al cambiar de rol',
    'Habla primero con el otro socio antes de solicitar',
  ],
};

export const HELP_IA_ROTACION: HelpContent = {
  title: 'Sugerencias IA de Rotación',
  description: 'Recomendaciones inteligentes de roles ideales basadas en tu perfil, rendimiento y gaps del equipo.',
  howItWorks: 'La IA analiza tus fortalezas, áreas de mejora, historial de roles y necesidades actuales del equipo para sugerir rotaciones beneficiosas.',
  dataSource: 'Edge Function que analiza member_stats, role_history, project_needs y calcula compatibilidad con calculate_rotation_compatibility.',
  tips: [
    'Las sugerencias consideran el balance del equipo',
    'No son obligatorias, solo orientativas',
    'El score de compatibilidad indica la probabilidad de éxito',
  ],
};

// ============================================
// MASTERS
// ============================================

export const HELP_MASTERS: HelpContent = {
  title: 'Masters del Equipo',
  description: 'Sistema de reconocimiento para los expertos en cada rol. Los Masters mentorean y pueden ser retados por otros socios.',
  howItWorks: 'Aplica para ser Master cuando tengas excelente rendimiento. El equipo vota tu aplicación. Los Masters activos pueden ser retados.',
  dataSource: 'Tablas "team_masters", "master_applications", "master_challenges", "master_votes".',
  validation: 'Aplicación por votación: necesitas 5 votos a favor del equipo para ser nombrado Master.',
  tips: [
    'Necesitas >70% de rendimiento y >3 meses en el rol para aplicar',
    'Los Masters reciben más visibilidad y responsabilidades',
    'Puedes retar a un Master si crees que puedes superarlo',
  ],
};

export const HELP_APLICAR_MASTER: HelpContent = {
  title: 'Aplicar a Master',
  description: 'Formulario de aplicación para convertirte en Master de un rol específico.',
  howItWorks: 'Completa el formulario con tu motivación y logros. El equipo tiene 7 días para votar. Necesitas 5 votos a favor.',
  dataSource: 'Crea registro en "master_applications". Los votos se registran en "master_votes".',
  validation: 'check_master_eligibility verifica: rendimiento >70%, >3 meses en rol, no ser Master activo, no tener aplicación pendiente.',
  tips: [
    'Destaca tus logros específicos en el rol',
    'El equipo puede ver tu historial de rendimiento',
    'Si te rechazan, puedes volver a aplicar después de 30 días',
  ],
};

// ============================================
// PROYECTO (Vista individual)
// ============================================

export const HELP_PROYECTO: HelpContent = {
  title: 'Dashboard de Proyecto',
  description: 'Vista completa de un proyecto específico: equipo, KPIs, tareas, CRM, finanzas, OBVs y onboarding.',
  howItWorks: 'Agrega toda la información del proyecto en pestañas organizadas. Los datos se filtran por project_id.',
  dataSource: 'Múltiples tablas filtradas por project_id: project_members, tasks, leads, obvs, transactions.',
  tips: [
    'Usa las pestañas para navegar entre secciones',
    'El dashboard muestra KPIs clave del proyecto',
    'Completa el onboarding para desbloquear todas las funciones',
  ],
};

export const HELP_PROYECTO_DASHBOARD: HelpContent = {
  title: 'Resumen del Proyecto',
  description: 'KPIs principales del proyecto: progreso de equipo, OBVs, pipeline de leads, finanzas.',
  howItWorks: 'Widgets que muestran métricas agregadas específicas de este proyecto.',
  dataSource: 'Vista "project_stats" filtrada por este project_id.',
  tips: [
    'Las tarjetas de KPI son clicables para más detalle',
    'Compara con el promedio de otros proyectos',
    'Revisa el dashboard al inicio de cada semana',
  ],
};

export const HELP_PROYECTO_OBV: HelpContent = {
  title: 'OBVs del Proyecto',
  description: 'Todos los OBVs asociados a este proyecto, filtrados por estado, tipo y fecha.',
  howItWorks: 'Lista OBVs donde el project_id coincide con este proyecto. Permite filtrar y ordenar.',
  dataSource: 'Tabla "obvs" filtrada por project_id, ordenada por fecha.',
  tips: [
    'Filtra por socio para ver contribuciones individuales',
    'Las OBVs de venta aparecen con icono especial',
    'Puedes subir nuevas OBVs directamente desde aquí',
  ],
};

export const HELP_PROYECTO_EQUIPO: HelpContent = {
  title: 'Equipo del Proyecto',
  description: 'Miembros del proyecto con sus roles, estado de aceptación y métricas de rendimiento.',
  howItWorks: 'Lista los registros de "project_members" para este proyecto con info de cada socio.',
  dataSource: 'Tabla "project_members" JOIN "profiles" filtrado por project_id.',
  tips: [
    'Cada socio debe aceptar su rol para que cuente',
    'Haz clic en un socio para ver su perfil completo',
    'El performance score se calcula automáticamente',
  ],
};

export const HELP_PROYECTO_TAREAS: HelpContent = {
  title: 'Tareas del Proyecto',
  description: 'Kanban de tareas específicas de este proyecto, con soporte para tareas IA con playbooks.',
  howItWorks: 'Tablero Kanban con tareas filtradas por este proyecto. Permite crear manualmente o generar con IA.',
  dataSource: 'Tabla "tasks" filtrada por project_id. Las tareas IA incluyen campo "playbook" con instrucciones.',
  tips: [
    'Usa "Generar con IA" para crear tareas contextualizadas',
    'Las tareas con playbook tienen un libro azul para ver la guía',
    'Arrastra tareas entre columnas para cambiar estado',
  ],
};

export const HELP_PROYECTO_CRM: HelpContent = {
  title: 'CRM del Proyecto',
  description: 'Pipeline de ventas específico de este proyecto: leads, oportunidades y clientes.',
  howItWorks: 'Kanban de leads filtrado solo por este proyecto con todas las funciones del CRM global.',
  dataSource: 'Tabla "leads" filtrada por project_id.',
  tips: [
    'Cada proyecto tiene su propio pipeline',
    'Los leads cerrados-ganados generan notificación al equipo',
    'Registra todas las interacciones en las notas',
  ],
};

export const HELP_PROYECTO_FINANCIERO: HelpContent = {
  title: 'Finanzas del Proyecto',
  description: 'Estado financiero del proyecto: facturación, gastos, margen y cobros pendientes.',
  howItWorks: 'Agrega todas las OBVs de venta asociadas a este proyecto para calcular métricas financieras.',
  dataSource: 'Tabla "obvs" donde es_venta = true AND project_id = este proyecto.',
  tips: [
    'Actualiza el estado de cobro cuando recibas pagos',
    'El margen objetivo es 50% de la facturación',
    'Los costes se registran en cada OBV de venta',
  ],
};

export const HELP_PROYECTO_ONBOARDING: HelpContent = {
  title: 'Onboarding del Proyecto',
  description: 'Proceso guiado para configurar completamente un nuevo proyecto: equipo, roles, objetivos y plan.',
  howItWorks: 'Wizard de varios pasos que recopila toda la información necesaria para lanzar el proyecto correctamente.',
  dataSource: 'Campo "onboarding_data" en tabla "projects" almacena respuestas. "onboarding_completed" indica si finalizó.',
  tips: [
    'Completa todos los pasos para desbloquear el dashboard',
    'Puedes editar las respuestas después',
    'El onboarding define roles y responsabilidades iniciales',
  ],
};

// ============================================
// SETTINGS
// ============================================

export const HELP_SETTINGS: HelpContent = {
  title: 'Configuración',
  description: 'Ajustes de tu perfil, notificaciones y preferencias de la aplicación.',
  howItWorks: 'Permite personalizar tu experiencia en la plataforma y gestionar tu cuenta.',
  dataSource: 'Tabla "profiles" para datos personales, "user_settings" para preferencias de notificación.',
  tips: [
    'Mantén tu email actualizado',
    'Configura notificaciones según tu preferencia',
    'El color te identifica en gráficos y rankings',
  ],
};

export const HELP_PERFIL: HelpContent = {
  title: 'Mi Perfil',
  description: 'Edita tu información personal: nombre, avatar, color identificador y especialización.',
  howItWorks: 'Los cambios se guardan automáticamente y se reflejan en toda la plataforma.',
  dataSource: 'Tabla "profiles" - campos editables por el usuario.',
  tips: [
    'El color te identifica en gráficos y rankings',
    'La especialización aparece en tu tarjeta de socio',
    'El avatar se muestra en comentarios y actividad',
  ],
};

export const HELP_NOTIFICACIONES: HelpContent = {
  title: 'Notificaciones',
  description: 'Configura qué notificaciones quieres recibir: validaciones, tareas, OBVs, resumen semanal.',
  howItWorks: 'Activa/desactiva categorías de notificaciones. Los cambios se aplican inmediatamente.',
  dataSource: 'Tabla "user_settings" con campo notifications (JSONB) con preferencias por categoría.',
  tips: [
    'Las validaciones pendientes siempre generan notificación',
    'El resumen semanal es opcional',
    'Las notificaciones de bloqueo no se pueden desactivar',
  ],
};

export const HELP_ADMIN: HelpContent = {
  title: 'Panel de Administración',
  description: 'Configuración avanzada solo para Team Leads y Admins: gestión de objetivos, permisos y datos del equipo.',
  howItWorks: 'Permite modificar objetivos del equipo, gestionar roles de usuario y acceder a funciones administrativas.',
  dataSource: 'Tablas "objectives", "user_roles". Solo accesible con rol "admin" o "tlt" en user_roles.',
  validation: 'Acceso restringido verificado por RLS con función has_role().',
  tips: [
    'Los cambios en objetivos afectan a todos los dashboards',
    'Puedes asignar rol admin a otros usuarios',
    'La base de KPIs permite ajustes manuales',
  ],
};

// ============================================
// NOTIFICATIONS VIEW
// ============================================

export const HELP_NOTIFICATIONS_VIEW: HelpContent = {
  title: 'Centro de Notificaciones',
  description: 'Todas tus notificaciones en un solo lugar: validaciones pendientes, tareas asignadas, leads ganados, bloqueos y más.',
  howItWorks: 'Las notificaciones se generan automáticamente por triggers de base de datos cuando ocurren eventos relevantes. Puedes marcarlas como leídas.',
  dataSource: 'Tabla "notifications" filtrada por tu user_id, ordenada por fecha de creación.',
  tips: [
    'Las notificaciones no leídas aparecen resaltadas',
    'Haz clic en una notificación para ir al elemento relacionado',
    'Usa "Marcar todas como leídas" para limpiar la bandeja',
  ],
};

// ============================================
// PROJECTS VIEW
// ============================================

export const HELP_PROJECTS_VIEW: HelpContent = {
  title: 'Vista General de Proyectos',
  description: 'Lista de todos los proyectos del equipo NOVA con acceso rápido a sus dashboards individuales.',
  howItWorks: 'Muestra los proyectos activos con sus métricas principales, fase actual y miembros del equipo.',
  dataSource: 'Tabla "projects" con join a "project_stats" para métricas agregadas y "project_members" para el equipo.',
  tips: [
    'Haz clic en un proyecto para ver su dashboard completo',
    'Los iconos y colores ayudan a identificar cada proyecto',
    'Puedes ver los roles de cada miembro desde aquí',
  ],
};

// ============================================
// ROLES MEETING
// ============================================

export const HELP_ROLES_MEETING: HelpContent = {
  title: 'Reunión de Roles',
  description: 'Espacio para las reuniones semanales de coordinación entre roles del mismo tipo (todos los COOs, todos los CEOs, etc.).',
  howItWorks: 'Muestra todos los roles activos con sus miembros. Permite generar preguntas con IA para facilitar las reuniones de coordinación.',
  dataSource: 'Cruce de "project_members" con "profiles" agrupado por tipo de rol.',
  tips: [
    'Usa el generador IA para crear preguntas de reflexión',
    'Comparte best practices entre proyectos',
    'Las reuniones de rol mejoran la coordinación del equipo',
  ],
};

// ============================================
// HELPER FUNCTION
// ============================================

const helpMap: Record<string, HelpContent> = {
  'dashboard': HELP_DASHBOARD,
  'dashboard.stats': HELP_STAT_CARDS,
  'dashboard.weekly': HELP_WEEKLY_CHART,
  'dashboard.rankings': HELP_TOP_RANKINGS,
  'dashboard.activity': HELP_RECENT_ACTIVITY,
  'dashboard.validations': HELP_PENDING_VALIDATIONS,
  'dashboard.alerts': HELP_SMART_ALERTS,
  'mi-espacio': HELP_MI_ESPACIO,
  'mi-espacio.kpis': HELP_MIS_KPIS,
  'mi-espacio.proyectos': HELP_MIS_PROYECTOS,
  'mi-espacio.tareas': HELP_MIS_TAREAS,
  'mi-desarrollo': HELP_MI_DESARROLLO,
  'notificaciones': HELP_NOTIFICATIONS_VIEW,
  'proyectos': HELP_PROJECTS_VIEW,
  'obvs': HELP_OBV_CENTER,
  'obvs.subir': HELP_SUBIR_OBV,
  'obvs.validar': HELP_VALIDAR_OBVS,
  'obvs.mis': HELP_MIS_OBVS,
  'kpis': HELP_KPIS,
  'kpis.lp': HELP_LP,
  'kpis.bp': HELP_BP,
  'kpis.cp': HELP_CP,
  'validacion': HELP_VALIDACION_CIRCULAR,
  'validacion.bloqueo': HELP_BLOQUEO_VALIDACION,
  'tareas.playbook': HELP_TAREAS_PLAYBOOK,
  'financiero': HELP_FINANCIERO,
  'financiero.dashboard': HELP_DASHBOARD_FINANCIERO,
  'financiero.cobros': HELP_GESTION_COBROS,
  'financiero.proyecciones': HELP_PROYECCIONES,
  'crm': HELP_CRM,
  'crm.overview': HELP_CRM_OVERVIEW,
  'crm.pipeline': HELP_CRM_PIPELINE,
  'analytics': HELP_ANALYTICS,
  'analytics.socios': HELP_COMPARATIVA_SOCIOS,
  'analytics.proyectos': HELP_COMPARATIVA_PROYECTOS,
  'analytics.predicciones': HELP_PREDICCIONES,
  'rankings': HELP_RANKINGS,
  'rankings.roles': HELP_RANKING_ROLES,
  'desarrollo': HELP_MI_DESARROLLO,
  'desarrollo.insights': HELP_INSIGHTS,
  'desarrollo.playbooks': HELP_PLAYBOOKS,
  'rotacion': HELP_ROTACION,
  'rotacion.solicitar': HELP_SOLICITAR_ROTACION,
  'rotacion.ia': HELP_IA_ROTACION,
  'masters': HELP_MASTERS,
  'masters.aplicar': HELP_APLICAR_MASTER,
  'proyecto': HELP_PROYECTO,
  'proyecto.dashboard': HELP_PROYECTO_DASHBOARD,
  'proyecto.obvs': HELP_PROYECTO_OBV,
  'proyecto.equipo': HELP_PROYECTO_EQUIPO,
  'proyecto.tareas': HELP_PROYECTO_TAREAS,
  'proyecto.crm': HELP_PROYECTO_CRM,
  'proyecto.financiero': HELP_PROYECTO_FINANCIERO,
  'proyecto.onboarding': HELP_PROYECTO_ONBOARDING,
  'settings': HELP_SETTINGS,
  'settings.perfil': HELP_PERFIL,
  'settings.notificaciones': HELP_NOTIFICACIONES,
  'settings.admin': HELP_ADMIN,
  'notifications': HELP_NOTIFICATIONS_VIEW,
  'projects': HELP_PROJECTS_VIEW,
  'roles-meeting': HELP_ROLES_MEETING,
};

export function getHelp(section: string): HelpContent | undefined {
  return helpMap[section];
}
