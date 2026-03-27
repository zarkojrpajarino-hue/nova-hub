/**
 * phase-features.ts — F19.C.1
 *
 * Fuente de verdad de adaptación por fase para FASE 19.
 * Importado por: usePhaseFeatures (F19.C.2), KanbanColumn (F19.B.5),
 *                ProjectDashboardTab (F19.C.5), NovaSidebar (SIDEBAR_PHASE_CONFIG).
 *
 * No importa componentes ni hooks — es pura data.
 */

// ── 1. Status de cada tab por fase ────────────────────────────────────────────
//
// primary   → foco principal de la fase, aparece destacado
// secondary → disponible pero no es la prioridad, tono apagado
// teaser    → bloqueado con Lock + modal explicativo (PhaseTeaserModal)

export type TabStatus = 'primary' | 'secondary' | 'teaser'

// `reuniones` aparece aquí pero el tab aún no está implementado como vista.
// getTabStatus('reuniones') retorna el valor abajo (inofensivo — nunca se renderiza).
// NextActionFocusBlock 'open_meeting' navega a 'tareas' como fallback.
export const PHASE_TAB_CONFIG: Record<number, Record<string, TabStatus>> = {
  0: {
    dashboard:    'primary',
    obvs:         'teaser',
    tareas:       'primary',
    equipo:       'teaser',
    crm:          'teaser',
    financiero:   'teaser',
    'negocio-ia': 'teaser',
    reuniones:    'teaser',
    expansion:    'teaser',
  },
  1: {
    dashboard:    'primary',
    obvs:         'primary',
    tareas:       'primary',
    equipo:       'secondary',
    crm:          'secondary',
    financiero:   'teaser',
    'negocio-ia': 'teaser',
    reuniones:    'secondary',
    expansion:    'teaser',
  },
  2: {
    dashboard:    'primary',
    obvs:         'primary',
    tareas:       'primary',
    equipo:       'secondary',
    crm:          'secondary',
    financiero:   'secondary',
    'negocio-ia': 'teaser',
    reuniones:    'secondary',
    expansion:    'teaser',
  },
  3: {
    dashboard:    'primary',
    obvs:         'secondary',
    tareas:       'primary',
    equipo:       'primary',
    crm:          'primary',
    financiero:   'primary',
    'negocio-ia': 'secondary',
    reuniones:    'primary',
    expansion:    'secondary',   // F22: disponible en Fase 3+ (readiness gate en componente)
  },
  4: {
    dashboard:    'primary',
    obvs:         'secondary',
    tareas:       'primary',
    equipo:       'primary',
    crm:          'primary',
    financiero:   'primary',
    'negocio-ia': 'primary',
    reuniones:    'primary',
    expansion:    'primary',
  },
}

// Tabs que son el foco principal de la fase (para badge "★ Foco")
export const PRIMARY_FOCUS_TABS: Record<number, string[]> = {
  0: ['dashboard', 'tareas'],
  1: ['obvs', 'tareas'],
  2: ['obvs', 'tareas'],
  3: ['crm', 'tareas'],
  4: ['tareas', 'crm'],
}

// ── 2. Por qué es teaser — texto para PhaseTeaserModal ────────────────────────

export const TAB_TEASER_REASONS: Record<string, Partial<Record<number, string>>> = {
  obvs: {
    0: 'Las validaciones se desbloquean cuando tengas una idea seleccionada. Ahora el foco es explorar.',
  },
  equipo: {
    0: 'El equipo cobra sentido cuando tengas un proyecto definido. Primero, elige tu idea.',
  },
  crm: {
    0: 'El CRM se activa cuando tengas clientes potenciales. Ahora el foco es explorar ideas.',
  },
  financiero: {
    0: 'Las finanzas importan cuando hay un negocio en marcha. Primero, valida tu idea.',
    1: 'Las finanzas importan cuando hay ingresos. Ahora el objetivo es validar la demanda.',
  },
  'negocio-ia': {
    0: 'Las proyecciones IA necesitan datos reales. Disponible a partir de Fase 3.',
    1: 'Las proyecciones generativas son precisas cuando hay modelo validado. Disponible en Fase 3.',
    2: 'Disponible cuando el modelo de negocio esté validado con ingresos reales.',
  },
  reuniones: {
    0: 'Las reuniones se desbloquean cuando tengas equipo y proyecto definido.',
  },
  expansion: {
    0: 'La expansión internacional se desbloquea en Fase 3 con MRR estable.',
    1: 'Primero valida tu problema. La expansión viene después de tener revenue.',
    2: 'Valida tu solución primero. Expansion Intelligence se activa en Fase 3.',
  },
}

// La condición de desbloqueo para cada tab (para PhaseTeaserModal)
export const TAB_UNLOCK_CONDITIONS: Record<string, string> = {
  crm:          'Se desbloquea en Fase 1 como herramienta secundaria.',
  financiero:   'Se desbloquea en Fase 2 como herramienta secundaria.',
  'negocio-ia': 'Entras en Fase 3 con modelo de negocio validado.',
}

// ── 3. Sidebar item visibility por fase — para NovaSidebar (Bloque A) ────────
//
// visible → render normal
// teaser  → opacity-50, Lock icon, tooltip con razón, click muestra toast
// hidden  → no se renderiza

export type SidebarItemStatus = 'visible' | 'teaser' | 'hidden'

const ALL_SIDEBAR_ITEMS = [
  'dashboard', 'mi-espacio', 'mi-desarrollo', 'mi-modelo',
  'proyectos', 'validaciones', 'obvs',
  'startup-os', 'crm', 'financiero', 'meetings', 'analisis-ia', 'toolkit',
  'exploration', 'path-to-master', 'rankings', 'masters', 'rotacion',
  'kpis', 'analytics', 'team-performance',
  'settings', 'integrations', 'notificaciones',
] as const

export const SIDEBAR_PHASE_CONFIG: Record<number, Record<string, SidebarItemStatus>> = {
  0: {
    'dashboard': 'visible',
    'mi-espacio': 'hidden',
    'mi-desarrollo': 'hidden',
    'mi-modelo': 'hidden',
    'proyectos': 'hidden',
    'validaciones': 'hidden',
    'obvs': 'hidden',
    'startup-os': 'hidden',
    'crm': 'hidden',
    'financiero': 'hidden',
    'meetings': 'hidden',
    'analisis-ia': 'hidden',
    'toolkit': 'hidden',
    'exploration': 'hidden',
    'path-to-master': 'hidden',
    'rankings': 'hidden',
    'masters': 'hidden',
    'rotacion': 'hidden',
    'kpis': 'hidden',
    'analytics': 'hidden',
    'team-performance': 'hidden',
    'settings': 'visible',
    'integrations': 'hidden',
    'notificaciones': 'visible',
  },
  1: {
    'dashboard': 'visible',
    'mi-espacio': 'visible',
    'mi-desarrollo': 'hidden',
    'mi-modelo': 'hidden',
    'proyectos': 'visible',
    'validaciones': 'visible',
    'obvs': 'visible',
    'startup-os': 'visible',
    'crm': 'visible',
    'financiero': 'teaser',
    'meetings': 'hidden',
    'analisis-ia': 'hidden',
    'toolkit': 'hidden',
    'exploration': 'hidden',
    'path-to-master': 'hidden',
    'rankings': 'hidden',
    'masters': 'hidden',
    'rotacion': 'hidden',
    'kpis': 'visible',
    'analytics': 'hidden',
    'team-performance': 'hidden',
    'settings': 'visible',
    'integrations': 'teaser',
    'notificaciones': 'visible',
  },
  2: {
    'dashboard': 'visible',
    'mi-espacio': 'visible',
    'mi-desarrollo': 'hidden',
    'mi-modelo': 'visible',
    'proyectos': 'visible',
    'validaciones': 'visible',
    'obvs': 'visible',
    'startup-os': 'visible',
    'crm': 'visible',
    'financiero': 'visible',
    'meetings': 'teaser',
    'analisis-ia': 'teaser',
    'toolkit': 'teaser',
    'exploration': 'hidden',
    'path-to-master': 'hidden',
    'rankings': 'hidden',
    'masters': 'hidden',
    'rotacion': 'hidden',
    'kpis': 'visible',
    'analytics': 'hidden',
    'team-performance': 'hidden',
    'settings': 'visible',
    'integrations': 'visible',
    'notificaciones': 'visible',
  },
  3: {
    'dashboard': 'visible',
    'mi-espacio': 'visible',
    'mi-desarrollo': 'visible',
    'mi-modelo': 'visible',
    'proyectos': 'visible',
    'validaciones': 'visible',
    'obvs': 'visible',
    'startup-os': 'visible',
    'crm': 'visible',
    'financiero': 'visible',
    'meetings': 'visible',
    'analisis-ia': 'visible',
    'toolkit': 'visible',
    'exploration': 'visible',
    'path-to-master': 'hidden',
    'rankings': 'visible',
    'masters': 'hidden',
    'rotacion': 'hidden',
    'kpis': 'visible',
    'analytics': 'visible',
    'team-performance': 'visible',
    'settings': 'visible',
    'integrations': 'visible',
    'notificaciones': 'visible',
  },
  // Phase 4: everything visible
  4: Object.fromEntries(ALL_SIDEBAR_ITEMS.map(id => [id, 'visible' as SidebarItemStatus])),
}

// Por qué un sidebar item está bloqueado (teaser) — textos para tooltip/toast
export const SIDEBAR_TEASER_REASONS: Record<string, string> = {
  'crm': 'sidebar.teaser.crm',
  'financiero': 'sidebar.teaser.financiero',
  'meetings': 'sidebar.teaser.meetings',
  'analisis-ia': 'sidebar.teaser.analisisIa',
  'toolkit': 'sidebar.teaser.toolkit',
  'integrations': 'sidebar.teaser.integrations',
}

// ── 4. Stats relevantes por fase — para ProjectDashboardTab ─────────────────

export type PhaseStatKey =
  | 'total_obvs'
  | 'leads_count'
  | 'team_count'
  | 'days_active'
  | 'conversion_rate'
  | 'facturacion'
  | 'leads_ganados'
  | 'close_rate'
  | 'margen'
  | 'mrr_growth'
  | 'ideas_explored'
  | 'problems_identified'
  | 'tasks_completed_weekly'
  | 'lead_conversion_rate'  // V5.2.7 — cerrado_ganado / total_leads
  | 'kpi_count'             // V5.2.8 — KPIs registered in project

export const PHASE_STATS_CONFIG: Record<number, PhaseStatKey[]> = {
  0: ['ideas_explored', 'problems_identified', 'days_active', 'team_count'],
  1: ['total_obvs', 'kpi_count', 'tasks_completed_weekly', 'days_active'],          // V5.2.8: kpi_count as secondary signal
  2: ['total_obvs', 'kpi_count', 'tasks_completed_weekly', 'conversion_rate'],       // V5.2.8: kpi_count as secondary signal
  3: ['facturacion', 'lead_conversion_rate', 'leads_ganados', 'margen'],             // V5.2.7: lead_conversion_rate
  4: ['facturacion', 'margen', 'lead_conversion_rate', 'leads_ganados'],             // V5.2.7: lead_conversion_rate
}

/**
 * V5.2.8 — KPI graduation threshold per phase.
 * Dashboard / next-action should display: "Phase-relevant KPIs: X/TARGET needed for graduation".
 */
export const KPI_GRADUATION_THRESHOLD: Record<number, number> = {
  0: 0,
  1: 3,
  2: 3,
  3: 5,
  4: 5,
}

// ── 4b. Task completion scoring by function_type ─────────────────────────────
//
// En Fases 1–2 las tareas completadas semanalmente contribuyen como señal secundaria.
// El peso depende del function_type: demand tasks valen 3x, delivery 1x.
// Usado en: computeTaskCompletionScore() para alimentar el phase scoring.

export const TASK_COMPLETION_WEIGHTS: Record<string, number> = {
  demand:   3,
  delivery: 1,
  cash:     1,
  support:  0,
}

/**
 * Computa un score de tareas completadas ponderado por relevancia de fase.
 * @param completedTasks - Array de { function_type: string } tareas completadas esta semana
 * @param phase - Fase actual del proyecto (0–4)
 * @returns Score ponderado (0+). Solo contribuye en fases 1–2.
 */
export function computeTaskCompletionScore(
  completedTasks: { function_type: string | null }[],
  phase: number,
): number {
  // Solo contribuye en fases 1–2
  if (phase < 1 || phase > 2) return 0;
  return completedTasks.reduce((acc, t) => {
    const ft = t.function_type ?? 'support';
    return acc + (TASK_COMPLETION_WEIGHTS[ft] ?? 0);
  }, 0);
}

// ── 5. Phase relevance por task function_type — para KanbanColumn ─────────────
//
// Escala 0-3: 3 = crítico para esta fase, 0 = no relevante.
// Usado en: getPhaseRelevanceScore() para ordenar columna 'todo'.

export const PHASE_RELEVANCE: Record<number, Record<string, number>> = {
  0: { demand: 0, delivery: 0, cash: 0, support: 0 },
  1: { demand: 3, delivery: 1, cash: 1, support: 0 },
  2: { demand: 3, delivery: 2, cash: 1, support: 0 },
  3: { demand: 2, delivery: 3, cash: 3, support: 1 },
  4: { demand: 2, delivery: 2, cash: 2, support: 2 },
}

/**
 * Devuelve la relevancia (0-3) de un function_type para la fase actual.
 * Tasks con relevance=3 → punto de color en KanbanCard.
 */
export function getPhaseRelevanceScore(
  functionType: string | null | undefined,
  phase: number,
): number {
  const ft = functionType ?? 'support'
  return PHASE_RELEVANCE[phase]?.[ft] ?? 1
}
