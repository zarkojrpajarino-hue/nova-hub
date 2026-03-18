/**
 * Normalizador de calendario para Google Calendar — I15.35 + I15.39
 *
 * Función pura: raw Google Calendar Event → ContractEntity
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Hard rejects (antes de schema_score):
 *   external_id ausente          → null
 *   title (summary) vacío/null   → null
 *   start.dateTime ausente       → null  ← cubre all-day events (solo tienen start.date)
 *   end.dateTime ausente         → null  ← mismo motivo
 *
 * ALL-DAY EVENTS: Google Calendar devuelve start.date (YYYY-MM-DD) sin start.dateTime
 * para eventos de día completo. Sin rango temporal con hora exacta, fuera en v1.
 * Esto sesga la fuente hacia reuniones con hora exacta — consecuencia explícita del diseño.
 *
 * schema_score: 3 required (title, start_at, end_at).
 * Todos están cubiertos por hard guards → schema_score = 1.0 siempre para eventos aceptados.
 * Consecuencia: confidence = 0.94 siempre. No es un bug — el contrato es estricto en entrada.
 *
 * attendee_count: opcional — muchos eventos válidos llegan sin esta info o con 0.
 * organizer_email: opcional — incluir si viene sin coste adicional en el payload.
 *
 * Write target: tabla `meetings` (creada en I15.A2.9).
 *
 * PROVIDER_SCORE = 0.8 — heurística provisional v1.
 *
 * v1: solo normalizeGCalEvent.
 * Futuro: all-day events como tipo separado cuando haya caso de uso claro.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export interface CalendarEventPayload {
  title:            string   // R — summary del evento
  start_at:         string   // R — ISO 8601 con hora (start.dateTime)
  end_at:           string   // R — ISO 8601 con hora (end.dateTime)
  attendee_count?:  number   // O — número de asistentes (int ≥ 0)
  organizer_email?: string   // O — email del organizador
  meeting_type?:    string   // O — reservado para clasificación futura
  location?:        string   // O — location del evento
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuándo corrió el sync
}

export interface ContractEntity {
  provider:         'google_calendar'
  entity_type:      'calendar_event'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — start_at del evento
  source_timestamp: string
  synced_at:        string
  payload:          CalendarEventPayload
  confidence:       number       // 0.94 siempre en v1 (schema_score = 1.0 post-guards)
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 3 required (title, start_at, end_at)
//
// Todos cubiertos por hard guards → score = 1.0 siempre para eventos aceptados.
// El check es defensivo — protege si se llama a esta función sin pasar por los guards.
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: CalendarEventPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.title !== 'string' || payload.title.length === 0) {
    missing.push('title')
  }
  if (typeof payload.start_at !== 'string' || payload.start_at.length === 0) {
    missing.push('start_at')
  }
  if (typeof payload.end_at !== 'string' || payload.end_at.length === 0) {
    missing.push('end_at')
  }

  const total = 3
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — fórmula §5 del contrato
// Con schema_score = 1.0 siempre: confidence = 0.5 + 0.24 + 0.2 = 0.94
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.8  // provisional v1
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Tipo de entrada — Google Calendar Events API v3
//
// Campos relevantes del objeto Event:
//   start.dateTime — ISO 8601 con hora (timed events)
//   start.date     — YYYY-MM-DD (all-day events — RECHAZADO en v1)
//   attendees      — array de asistentes (puede ser undefined si no hay)
//   status         — "confirmed" | "tentative" | "cancelled"
// ──────────────────────────────────────────────────────────────────────────────

interface RawGCalEvent {
  id:       string
  summary:  string | null | undefined
  start: {
    dateTime?: string  // ISO 8601 — presente en timed events
    date?:     string  // YYYY-MM-DD — presente en all-day events
  }
  end: {
    dateTime?: string
    date?:     string
  }
  created:    string | null | undefined  // ISO 8601
  organizer?: { email?: string } | null
  attendees?: Array<{ email: string; responseStatus?: string }> | null
  location?:  string | null
  status?:    string | null  // "confirmed" | "tentative" | "cancelled"
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeGCalEvent — función principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id ausente
//   - title (summary) vacío/null
//   - start.dateTime ausente (all-day o malformado)
//   - end.dateTime ausente
//   - schema_score < 0.5 (defensivo — cubierto por guards en condiciones normales)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeGCalEvent(
  raw: RawGCalEvent,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard 1: external_id requerido
  if (!raw.id) return null

  // Hard guard 2: title requerido
  const title = raw.summary?.trim() ?? ''
  if (!title) return null

  // Hard guard 3: start.dateTime requerido
  // Ausente → all-day event (tiene start.date en su lugar) → reject en v1
  const startAt = raw.start.dateTime
  if (!startAt) return null

  // Hard guard 4: end.dateTime requerido — misma razón
  const endAt = raw.end.dateTime
  if (!endAt) return null

  // attendee_count: número de asistentes (excluye al organizador si ya está en attendees)
  const attendeeCount = raw.attendees != null ? raw.attendees.length : undefined

  const payload: CalendarEventPayload = {
    title,
    start_at: startAt,
    end_at:   endAt,
    ...(attendeeCount !== undefined   && { attendee_count:  attendeeCount }),
    ...(raw.organizer?.email          && { organizer_email: raw.organizer.email }),
    ...(raw.location                  && { location:        raw.location }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  // Defensivo — en condiciones normales nunca llega aquí tras los guards
  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  // occurred_at: start_at del evento (más relevante que created para contexto de agenda)
  const occurredAt = startAt

  return {
    provider:         'google_calendar',
    entity_type:      'calendar_event',
    external_id:      raw.id,
    project_id:       ctx.project_id,
    occurred_at:      occurredAt,
    source_timestamp: ctx.source_timestamp,
    synced_at:        new Date().toISOString(),
    payload,
    confidence,
    is_complete:      missing.length === 0,
    missing_fields:   missing,
    sync_run_id:      ctx.sync_run_id,
    connection_id:    ctx.connection_id,
  }
}
