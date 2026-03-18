/**
 * calendar-agent — I15.82 (pure computation layer)
 *
 * Funciones puras: dada una lista de integration_entities de tipo 'calendar_event',
 * computa CalendarInsight siguiendo AGENTS_CONTRACT.md.
 *
 * Sin efectos secundarios. Sin llamadas a DB.
 *
 * v1 insight_types disponibles con datos Google Calendar:
 *   - meeting_load      — horas de reunión en los próximos 7 días (min 1 evento futuro)
 *   - meeting_density   — % de la semana laboral (40h) ocupada en reuniones (min 3 eventos futuros)
 *
 * Deferred (requieren datos que no existen aún en v1):
 *   - meeting_overrun   — reuniones que empiezan antes que la anterior acabe (requiere historial)
 *   - focus_block_ratio — bloques de tiempo libre vs reuniones (requiere calendario completo)
 *
 * Ventana de análisis: eventos futuros (start_at > ahora) dentro de los próximos 7 días.
 * El sync cubre ±30d — filtramos aquí para relevancia operacional inmediata.
 *
 * Fuente de datos: integration_entities[entity_type='calendar_event', provider='google_calendar']
 * Destino: integration_insights (NO motor tables en v1 — I15.DEBT.5)
 */

import type { EvidenceType, SourceUsed, SourceDiscarded } from '@/lib/evidence'

export type CalendarInsightType = 'meeting_load' | 'meeting_density'

export interface CalendarEventEntityRow {
  id:         string
  confidence: number
  occurred_at: string  // = start_at del evento (ISO 8601)
  payload: {
    title:            string
    start_at:         string  // ISO 8601
    end_at:           string  // ISO 8601
    attendee_count?:  number
    organizer_email?: string
    location?:        string
  }
}

export interface CalendarInsightData {
  insight_type: CalendarInsightType
  /** AGENTS_CONTRACT.md §4.2 */
  signal: {
    metric_name:   string
    current_value: number
    period_days:   number
    data_points:   number
  }
  /** AGENTS_CONTRACT.md §4.3 */
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence:         number
  entity_ids:         string[]
  include_in_context: boolean
  /** En horas — el servicio calcula expires_at = generated_at + expires_hours */
  expires_hours:      number
  /** T17.16 — metadata de evidencia */
  evidence_type:     EvidenceType
  sources_used:      SourceUsed[]
  sources_discarded: SourceDiscarded[]
}

// Semana laboral estándar en horas — denominador para meeting_density
const WORK_HOURS_PER_WEEK = 40

// Ventana de análisis hacia adelante en días
const LOOKAHEAD_DAYS = 7

// ──────────────────────────────────────────────────────────────────────────────
// computeMeetingDurationHours — duración de un evento en horas (decimal)
// ──────────────────────────────────────────────────────────────────────────────

function computeMeetingDurationHours(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime()
  const end   = new Date(endAt).getTime()
  if (isNaN(start) || isNaN(end) || end <= start) return 0
  return (end - start) / 3_600_000
}

// ──────────────────────────────────────────────────────────────────────────────
// filterUpcomingEvents — filtra eventos con start_at en los próximos LOOKAHEAD_DAYS
// ──────────────────────────────────────────────────────────────────────────────

function filterUpcomingEvents(
  entities: CalendarEventEntityRow[],
  now: Date,
): CalendarEventEntityRow[] {
  const nowMs   = now.getTime()
  const limitMs = nowMs + LOOKAHEAD_DAYS * 24 * 3_600_000

  return entities.filter((e) => {
    const startMs = new Date(e.payload.start_at).getTime()
    return !isNaN(startMs) && startMs > nowMs && startMs <= limitMs
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// computeMeetingLoad
//
// Total de horas de reunión en los próximos 7 días.
// Min: 1 evento futuro (§5 — data_points_min=1 para snapshots).
// Umbrales de severidad:
//   < 8h  → info      (carga ligera, sin acción necesaria)
//   8-16h → attention  (semana densa, hay que priorizar)
//   >16h  → warning    (semana sobrecargada — riesgo de foco)
// include_in_context: cuando hay carga real (attention o warning).
// expires_at: 24h (revisión diaria del horizonte).
// ──────────────────────────────────────────────────────────────────────────────

export function computeMeetingLoad(
  entities: CalendarEventEntityRow[],
  now = new Date(),
): CalendarInsightData | null {
  const upcoming = filterUpcomingEvents(entities, now)

  // §5 — min 1 evento futuro
  if (upcoming.length < 1) return null

  const avgConf = upcoming.reduce((s, e) => s + e.confidence, 0) / upcoming.length
  if (avgConf < 0.5) return null

  const totalHours = upcoming.reduce(
    (s, e) => s + computeMeetingDurationHours(e.payload.start_at, e.payload.end_at),
    0,
  )
  const roundedHours = Math.round(totalHours * 10) / 10

  const severity: CalendarInsightData['content']['severity'] =
    totalHours >= 16 ? 'warning' :
    totalHours >= 8  ? 'attention' :
    'info'

  // Distribución por días para el summary
  const byDay = new Map<string, number>()
  for (const e of upcoming) {
    const day = e.payload.start_at.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + computeMeetingDurationHours(e.payload.start_at, e.payload.end_at))
  }
  const busiestDay = Array.from(byDay.entries()).sort((a, b) => b[1] - a[1])[0]
  const busiestDayHours = busiestDay ? Math.round(busiestDay[1] * 10) / 10 : 0

  // Completeness: min=1 (§5), escalado hasta 5 para máxima confidence
  const completeness = Math.min(1.0, upcoming.length / 5)
  const confidence = avgConf * completeness

  return {
    insight_type: 'meeting_load',
    signal: {
      metric_name:   'meeting_hours_next_7d',
      current_value: roundedHours,
      period_days:   LOOKAHEAD_DAYS,
      data_points:   upcoming.length,
    },
    content: {
      summary: `${roundedHours}h en reuniones los próximos 7 días (${upcoming.length} reunión${upcoming.length !== 1 ? 'es' : ''}).${busiestDayHours > 0 ? ` Día más cargado: ${busiestDay![0]} con ${busiestDayHours}h.` : ''}`,
      implication:
        totalHours >= 16
          ? 'Semana muy cargada. Más de la mitad de la jornada laboral está en reuniones — el tiempo de foco profundo está en riesgo.'
          : totalHours >= 8
            ? 'Semana densa en reuniones. Priorizar qué reuniones requieren tu presencia puede liberar bloques de trabajo estratégico.'
            : 'Carga de reuniones ligera. Hay espacio para trabajo de foco profundo.',
      severity,
      action_hint:
        totalHours >= 16
          ? `Revisa tu calendario de los próximos 7 días: identifica las ${Math.ceil(upcoming.length * 0.3)} reuniones menos críticas y delega o cancela al menos 2 para proteger bloques de ≥2h.`
          : totalHours >= 8
            ? `Agrupa reuniones en bloques de mañana o tarde para preservar al menos un bloque diario de ≥2h sin interrupciones.`
            : undefined,
    },
    confidence,
    entity_ids:         upcoming.map((e) => e.id),
    include_in_context: severity !== 'info',
    expires_hours:      24,
    evidence_type:     'observed',
    sources_used:      [{ source: 'google_calendar', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: upcoming.length }],
    sources_discarded: [],
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeMeetingDensity
//
// Porcentaje de la semana laboral (40h) ocupado por reuniones.
// Min: 3 eventos futuros para que el ratio tenga sentido estadístico.
// Umbrales:
//   < 20% → info       (normal — reuniones no dominan la semana)
//   20-40% → attention  (meetings empiezan a comprimir el tiempo libre)
//   > 40% → warning     (más de 2 días enteros en reuniones)
// No emite si totalHours = 0 (defensivo — cubierto por duration check).
// expires_at: 48h.
// ──────────────────────────────────────────────────────────────────────────────

export function computeMeetingDensity(
  entities: CalendarEventEntityRow[],
  now = new Date(),
): CalendarInsightData | null {
  const upcoming = filterUpcomingEvents(entities, now)

  // §5 — min 3 eventos futuros
  if (upcoming.length < 3) return null

  const totalHours = upcoming.reduce(
    (s, e) => s + computeMeetingDurationHours(e.payload.start_at, e.payload.end_at),
    0,
  )

  if (totalHours === 0) return null

  const avgConf    = upcoming.reduce((s, e) => s + e.confidence, 0) / upcoming.length
  const completeness = Math.min(1.0, upcoming.length / 3)
  const confidence = avgConf * completeness

  if (confidence < 0.5) return null

  const densityPct = Math.round((totalHours / WORK_HOURS_PER_WEEK) * 100)

  const severity: CalendarInsightData['content']['severity'] =
    densityPct > 40 ? 'warning' :
    densityPct >= 20 ? 'attention' :
    'info'

  // Contar reuniones con otros asistentes (colaborativas) para dar contexto
  const collaborative = upcoming.filter((e) => (e.payload.attendee_count ?? 0) > 1)

  return {
    insight_type: 'meeting_density',
    signal: {
      metric_name:   'meeting_density_pct',
      current_value: densityPct,
      period_days:   LOOKAHEAD_DAYS,
      data_points:   upcoming.length,
    },
    content: {
      summary: `${densityPct}% de la semana laboral en reuniones (${Math.round(totalHours * 10) / 10}h de ${WORK_HOURS_PER_WEEK}h).${collaborative.length > 0 ? ` ${collaborative.length} reunión${collaborative.length !== 1 ? 'es' : ''} con otros asistentes.` : ''}`,
      implication:
        densityPct > 40
          ? 'Más del 40% de la jornada está en reuniones. El tiempo disponible para trabajo estratégico es insuficiente.'
          : densityPct >= 20
            ? 'Las reuniones empiezan a comprimir el espacio de trabajo independiente. Considerar optimización.'
            : 'Densidad de reuniones saludable. La mayor parte de la semana está disponible para trabajo enfocado.',
      severity,
      action_hint:
        densityPct > 40
          ? `Con ${densityPct}% del tiempo en reuniones, identifica cuáles pueden convertirse en updates asíncronos (Notion, Loom) para recuperar al menos 4h de foco semanal.`
          : densityPct >= 20
            ? `Agrupa las reuniones en 2-3 días concentrados para mantener días completos de trabajo profundo.`
            : undefined,
    },
    confidence,
    entity_ids:         upcoming.map((e) => e.id),
    include_in_context: densityPct >= 20,
    expires_hours:      48,
    evidence_type:     'observed',
    sources_used:      [{ source: 'google_calendar', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: upcoming.length }],
    sources_discarded: [],
  }
}

/** Ejecuta todos los cómputos del Calendar Agent v1 sobre un conjunto de entidades. */
export function runCalendarAgentLocal(
  entities: CalendarEventEntityRow[],
  now = new Date(),
): CalendarInsightData[] {
  return [
    computeMeetingLoad(entities, now),
    computeMeetingDensity(entities, now),
  ]
    .filter((x): x is CalendarInsightData => x !== null)
    // T17.29 — §12 política de silencio: dato estimado con baja confianza y sin entidades → no emitir
    .filter(x => !(x.confidence < 0.5 && x.entity_ids.length === 0))
}
