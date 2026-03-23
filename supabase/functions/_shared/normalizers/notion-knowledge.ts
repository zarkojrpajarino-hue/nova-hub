/**
 * Normalizador de conocimiento para Notion
 *
 * Funciones puras: raw Notion Page/Database -> ContractEntity
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Dos tipos de entidad:
 *   - page:     paginas de Notion (titulo, fecha edicion, estructura)
 *   - database: bases de datos de Notion (titulo, propiedades, schema)
 *
 * schema_score (page): 2 required (title, last_edited_at)
 * schema_score (database): 2 required (title, last_edited_at)
 * Rechazo si < 0.5 (= ambos ausentes).
 *
 * PROVIDER_SCORE = 0.85 — Notion es autoritativo para conocimiento.
 *
 * v1: normalizeNotionPage, normalizeNotionDatabase.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export interface RawNotionPage {
  id:               string
  properties:       Record<string, any>
  parent:           { type: string; [key: string]: any }
  created_time:     string    // ISO 8601
  last_edited_time: string    // ISO 8601
  archived:         boolean
  url:              string
}

export interface PagePayload {
  title:           string
  last_edited_at:  string
  created_at:      string
  parent_type:     'workspace' | 'page' | 'database'
  is_archived:     boolean
  days_since_edit: number
}

export interface RawNotionDatabase {
  id:               string
  title:            Array<{ plain_text: string }>
  created_time:     string
  last_edited_time: string
  properties:       Record<string, any>
}

export interface DatabasePayload {
  title:           string
  property_count:  number
  last_edited_at:  string
  created_at:      string
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuando corrio el sync
}

export interface ContractEntity {
  provider:         'notion'
  entity_type:      'page' | 'database'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — created_time de la entidad
  source_timestamp: string
  synced_at:        string
  payload:          PagePayload | DatabasePayload
  confidence:       number
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// extractTitle — extrae titulo de la estructura compleja de properties de Notion
// ──────────────────────────────────────────────────────────────────────────────

function extractTitle(page: RawNotionPage): string {
  if (page.properties) {
    for (const [, prop] of Object.entries(page.properties)) {
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title.map((t: any) => t.plain_text).join('')
      }
    }
  }
  return 'Untitled'
}

// ──────────────────────────────────────────────────────────────────────────────
// extractDatabaseTitle — extrae titulo del array title de un database
// ──────────────────────────────────────────────────────────────────────────────

function extractDatabaseTitle(db: RawNotionDatabase): string {
  if (db.title && db.title.length > 0) {
    return db.title.map((t) => t.plain_text).join('')
  }
  return 'Untitled Database'
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 2 required fields (title, last_edited_at)
//
// schema_score = validos / 2
// Rechazo si < 0.5 (= ambos ausentes).
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(title: string, lastEditedAt: string): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof title !== 'string' || title.length === 0 || title === 'Untitled') {
    missing.push('title')
  }

  if (typeof lastEditedAt !== 'string' || lastEditedAt.length === 0) {
    missing.push('last_edited_at')
  }

  const total = 2
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — formula §5 del contrato
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.85  // Notion es autoritativo para conocimiento
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// resolveParentType — determina el tipo de parent de una pagina
// ──────────────────────────────────────────────────────────────────────────────

function resolveParentType(parent: { type: string }): 'workspace' | 'page' | 'database' {
  if (parent.type === 'database_id') return 'database'
  if (parent.type === 'page_id') return 'page'
  return 'workspace'
}

// ──────────────────────────────────────────────────────────────────────────────
// daysSince — calcula dias desde una fecha ISO 8601
// ──────────────────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeNotionPage — funcion principal para paginas
//
// Devuelve ContractEntity o null si:
//   - external_id (id) ausente
//   - schema_score < 0.5 (ambos required ausentes)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeNotionPage(
  raw: RawNotionPage,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.id) return null

  const title = extractTitle(raw)
  const lastEditedAt = raw.last_edited_time ?? ''
  const createdAt = raw.created_time ?? ctx.source_timestamp

  const { score: schemaScore, missing } = computeSchemaScore(title, lastEditedAt)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  const payload: PagePayload = {
    title,
    last_edited_at:  lastEditedAt,
    created_at:      createdAt,
    parent_type:     resolveParentType(raw.parent ?? { type: 'workspace' }),
    is_archived:     raw.archived ?? false,
    days_since_edit: daysSince(lastEditedAt || createdAt),
  }

  return {
    provider:         'notion',
    entity_type:      'page',
    external_id:      raw.id,
    project_id:       ctx.project_id,
    occurred_at:      createdAt,
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

// ──────────────────────────────────────────────────────────────────────────────
// normalizeNotionDatabase — funcion principal para databases
//
// Devuelve ContractEntity o null si:
//   - external_id (id) ausente
//   - schema_score < 0.5 (ambos required ausentes)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeNotionDatabase(
  raw: RawNotionDatabase,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.id) return null

  const title = extractDatabaseTitle(raw)
  const lastEditedAt = raw.last_edited_time ?? ''
  const createdAt = raw.created_time ?? ctx.source_timestamp

  const { score: schemaScore, missing } = computeSchemaScore(title, lastEditedAt)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  const propertyCount = raw.properties ? Object.keys(raw.properties).length : 0

  const payload: DatabasePayload = {
    title,
    property_count:  propertyCount,
    last_edited_at:  lastEditedAt,
    created_at:      createdAt,
  }

  return {
    provider:         'notion',
    entity_type:      'database',
    external_id:      raw.id,
    project_id:       ctx.project_id,
    occurred_at:      createdAt,
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
