/**
 * Normalizador de comunicacion para Slack
 *
 * Funcion pura: raw Slack channel data -> ContractEntity (INTEGRATION_DATA_CONTRACT.md)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Entidad: channel_activity — un registro por canal con metricas agregadas.
 * No se normaliza por mensaje individual; el valor esta en el agregado.
 *
 * schema_score: 2 required (channel_name, message_count)
 * Rechazo si < 0.5 (= ambos ausentes).
 *
 * PROVIDER_SCORE = 0.9 — Slack es autoritativo para comunicacion.
 *
 * v1: solo normalizeSlackChannel.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export interface RawSlackChannelData {
  channel_id:        string
  channel_name:      string
  message_count:     number
  unique_authors:    number
  latest_message_at: string | null
  member_count:      number
}

export interface ChannelActivityPayload {
  channel_name:      string
  message_count:     number
  unique_authors:    number
  latest_message_at?: string
  member_count:      number
  messages_per_day:  number
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuando corrio el sync
}

export interface ContractEntity {
  provider:         'slack'
  entity_type:      'channel_activity'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601
  source_timestamp: string
  synced_at:        string
  payload:          ChannelActivityPayload
  confidence:       number
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 2 required fields (channel_name, message_count)
//
// schema_score = validos / 2
// Rechazo si < 0.5 (= ambos ausentes).
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: ChannelActivityPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.channel_name !== 'string' || payload.channel_name.length === 0) {
    missing.push('channel_name')
  }

  if (typeof payload.message_count !== 'number' || payload.message_count < 0) {
    missing.push('message_count')
  }

  const total = 2
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — formula del contrato
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.9  // Slack es autoritativo para comunicacion
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeSlackChannel — funcion principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id (channel_id) ausente
//   - schema_score < 0.5 (ambos required ausentes)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeSlackChannel(
  raw: RawSlackChannelData,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.channel_id) return null

  // messages_per_day: aggregate over 7 days
  const messagesPerDay = raw.message_count / 7

  const payload: ChannelActivityPayload = {
    channel_name:      raw.channel_name ?? '',
    message_count:     raw.message_count ?? 0,
    unique_authors:    raw.unique_authors ?? 0,
    member_count:      raw.member_count ?? 0,
    messages_per_day:  Math.round(messagesPerDay * 100) / 100,
    ...(raw.latest_message_at && { latest_message_at: raw.latest_message_at }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  return {
    provider:         'slack',
    entity_type:      'channel_activity',
    external_id:      raw.channel_id,
    project_id:       ctx.project_id,
    occurred_at:      raw.latest_message_at ?? ctx.source_timestamp,
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
