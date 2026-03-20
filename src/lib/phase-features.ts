/**
 * phase-features.ts — F19.C.1
 *
 * Fuente de verdad de adaptación por fase para FASE 19.
 * Importado por: usePhaseFeatures (F19.C.2), KanbanColumn (F19.B.5),
 *                ProjectPage (F19.C.3), ProjectDashboardTab (F19.C.5).
 *
 * No importa componentes ni hooks — es pura data.
 */

// ── 1. Status de cada tab por fase ────────────────────────────────────────────
//
// primary   → foco principal de la fase, aparece destacado
// secondary → disponible pero no es la prioridad, tono apagado
// teaser    → bloqueado con Lock + modal explicativo (PhaseTeaserModal)

export type TabStatus = 'primary' | 'secondary' | 'teaser'

// F19.V2.3 — AUDIT NOTE:
// `reuniones` aparece aquí pero NO existe como tab en ProjectPage.tsx TABS array todavía.
// El tab está planificado pero sin implementar. Mientras tanto:
//   - getTabStatus('reuniones') retorna el valor abajo (inofensivo — nunca se renderiza)
//   - NextActionFocusBlock 'open_meeting' navega a 'tareas' como fallback
// Al implementar el tab 'reuniones': añadirlo a TABS en ProjectPage.tsx.
export const PHASE_TAB_CONFIG: Record<number, Record<string, TabStatus>> = {
  1: {
    dashboard:    'primary',
    obvs:         'primary',
    tareas:       'primary',
    equipo:       'secondary',
    crm:          'teaser',
    financiero:   'teaser',
    'negocio-ia': 'teaser',
    reuniones:    'secondary',  // tab planificado — aún no en ProjectPage TABS
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
  },
}

// Tabs que son el foco principal de la fase (para badge "★ Foco")
export const PRIMARY_FOCUS_TABS: Record<number, string[]> = {
  1: ['obvs', 'tareas'],
  2: ['obvs', 'tareas'],
  3: ['crm', 'tareas'],
  4: ['tareas', 'crm'],
}

// ── 2. Por qué es teaser — texto para PhaseTeaserModal ────────────────────────

export const TAB_TEASER_REASONS: Record<string, Partial<Record<number, string>>> = {
  crm: {
    1: 'El CRM cobra valor cuando tienes leads cualificados. Ahora el foco es validar el problema con evidencia real.',
  },
  financiero: {
    1: 'Las finanzas importan cuando hay ingresos. Ahora el objetivo es validar la demanda.',
    2: 'En Fase 2 el foco es la solución. Financiero se activa cuando entras en Revenue.',
  },
  'negocio-ia': {
    1: 'Las proyecciones generativas son precisas cuando hay modelo validado. Disponible en Fase 3.',
    2: 'Disponible cuando el modelo de negocio esté validado con ingresos reales.',
  },
}

// La condición de desbloqueo para cada tab (para PhaseTeaserModal)
export const TAB_UNLOCK_CONDITIONS: Record<string, string> = {
  crm:          'Entras en Fase 2 con al menos 1 lead cualificado registrado.',
  financiero:   'Entras en Fase 3 con al menos 1 ingreso registrado.',
  'negocio-ia': 'Entras en Fase 3 con modelo de negocio validado.',
}

// ── 3. Stats relevantes por fase — para ProjectDashboardTab ──────────────────

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

export const PHASE_STATS_CONFIG: Record<number, PhaseStatKey[]> = {
  1: ['total_obvs', 'leads_count', 'team_count', 'days_active'],
  2: ['total_obvs', 'leads_count', 'conversion_rate', 'team_count'],
  3: ['facturacion', 'leads_ganados', 'team_count', 'margen'],
  4: ['facturacion', 'margen', 'leads_ganados', 'team_count'],
}

// ── 4. Phase relevance por task function_type — para KanbanColumn ─────────────
//
// Escala 0-3: 3 = crítico para esta fase, 0 = no relevante.
// Usado en: getPhaseRelevanceScore() para ordenar columna 'todo'.

export const PHASE_RELEVANCE: Record<number, Record<string, number>> = {
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
