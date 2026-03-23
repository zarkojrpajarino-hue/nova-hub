/**
 * Normalizador operativo para Trello
 *
 * Funcion pura: raw Trello Card → ContractEntity (INTEGRATION_DATA_CONTRACT.md §3-§4)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Estado binario: open | completed — based on card.closed / card.dueComplete.
 *
 * Hard reject: external_id (card.id) ausente → null.
 * No hay hard reject en card_name — su ausencia penaliza schema_score hasta rechazo.
 *
 * schema_score: 2 required (card_name, status) — entidad simple como Asana tasks.
 * Rechazo si < 0.5 (= si falta alguno de los dos campos).
 *
 * PROVIDER_SCORE = 0.75 — Trello es menos estructurado que Asana (no tiene assignee/sections nativos).
 *
 * v1: solo normalizeTrelloCard.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export type CardStatus = 'open' | 'completed'

export interface CardPayload {
  card_name:    string       // R — name de la card en Trello
  status:       CardStatus   // R — open | completed
  list_name?:   string       // O — nombre de la lista donde esta la card
  board_name?:  string       // O — nombre del board
  due_date?:    string       // O — ISO 8601 date
  is_overdue:   boolean      // siempre presente
  labels:       string[]     // nombres de las labels (puede estar vacio)
  member_count: number       // cantidad de miembros asignados
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuando corrio el sync
}

export interface ContractEntity {
  provider:         'trello'
  entity_type:      'card'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — dateLastActivity de la card
  source_timestamp: string
  synced_at:        string
  payload:          CardPayload
  confidence:       number
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 2 required fields (card_name, status)
//
// schema_score = validos / 2
// Rechazo si < 0.5 (= 0/2 — ambos ausentes).
// Con 1/2 valido → score = 0.5 → pasa el umbral con confidence degradada.
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: CardPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.card_name !== 'string' || payload.card_name.length === 0) {
    missing.push('card_name')
  }

  const VALID_STATUSES: CardStatus[] = ['open', 'completed']
  if (!VALID_STATUSES.includes(payload.status)) {
    missing.push('status')
  }

  const total = 2
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — formula §5 del contrato
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.75  // Trello es menos estructurado que Asana
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Tipo de entrada — campos de Trello Card API
// ──────────────────────────────────────────────────────────────────────────────

export interface RawTrelloCard {
  id:               string
  name:             string | null
  closed:           boolean
  due:              string | null  // ISO 8601 o null
  dueComplete:      boolean
  dateLastActivity: string | null  // ISO 8601
  idList:           string
  idMembers:        string[]
  labels:           Array<{ id: string; name: string; color?: string }>
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeTrelloCard — funcion principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id (id) ausente
//   - schema_score < 0.5 (ambos required ausentes)
//
// listNameMap: Map<listId, listName> para resolver el nombre de la lista
// boardName: nombre del board (opcional)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeTrelloCard(
  raw: RawTrelloCard,
  ctx: SyncContext,
  listNameMap: Map<string, string>,
  boardName?: string,
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.id) return null

  // Status: closed=true OR dueComplete=true → 'completed', todo lo demas → 'open'
  const status: CardStatus = raw.closed === true || raw.dueComplete === true ? 'completed' : 'open'

  // is_overdue: tiene due date, no esta completada, y la fecha ya paso
  let isOverdue = false
  if (raw.due && status === 'open') {
    isOverdue = new Date(raw.due) < new Date()
  }

  // Labels: extraer nombres
  const labels = (raw.labels ?? []).map((l) => l.name).filter(Boolean)

  // List name from map
  const listName = listNameMap.get(raw.idList) ?? undefined

  const payload: CardPayload = {
    card_name:    raw.name ?? '',
    status,
    is_overdue:   isOverdue,
    labels,
    member_count: (raw.idMembers ?? []).length,
    ...(listName  && { list_name: listName }),
    ...(boardName && { board_name: boardName }),
    ...(raw.due   && { due_date: raw.due }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  // occurred_at: dateLastActivity de la card; fallback a source_timestamp
  const occurredAt = raw.dateLastActivity ?? ctx.source_timestamp

  return {
    provider:         'trello',
    entity_type:      'card',
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
