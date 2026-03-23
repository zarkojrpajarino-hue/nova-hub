/**
 * Normalizador financiero para Holded
 *
 * Funcion pura: raw Holded Invoice -> ContractEntity (INTEGRATION_DATA_CONTRACT.md S3-S4)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Estados de factura: paid | pending | overdue | draft
 *
 * Hard reject: external_id (id) ausente -> null.
 * No hay hard reject en contact_name — su ausencia penaliza schema_score hasta rechazo.
 *
 * schema_score: 3 required (invoice_number/id, total_cents, status)
 * Rechazo si < 0.5 (= si faltan 2+ de los 3 campos).
 *
 * Write target: tabla `key_metrics` (WRITE-THROUGH via finance agent).
 *
 * PROVIDER_SCORE = 0.85 — Holded es autoritativo para facturacion.
 *
 * v1: solo normalizeHoldedInvoice.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft'

export interface InvoicePayload {
  invoice_number: string        // R — id o numero de factura
  contact_name:   string        // O — nombre del contacto/cliente
  total_cents:    number        // R — total en centimos (amount * 100)
  currency:       string        // O — codigo ISO de moneda (EUR, USD, etc.)
  status:         InvoiceStatus // R — paid | pending | overdue | draft
  issued_at:      string        // O — ISO 8601 — fecha de emision
  due_at?:        string        // O — ISO 8601 — fecha de vencimiento
  items_count:    number        // O — numero de lineas de la factura
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuando corrio el sync
}

export interface ContractEntity {
  provider:         'holded'
  entity_type:      'invoice'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — fecha de la factura
  source_timestamp: string
  synced_at:        string
  payload:          InvoicePayload
  confidence:       number
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// Raw Holded Invoice — campos del API de Holded
// ──────────────────────────────────────────────────────────────────────────────

export interface RawHoldedInvoice {
  id:          string
  contactName: string | null
  contactId:   string | null
  total:       number | null       // Amount in currency units (e.g. 100.50)
  subtotal:    number | null
  currency:    string | null
  status:      string | null       // paid, pending, overdue, draft
  date:        number | null       // Unix timestamp (seconds)
  dueDate:     number | null       // Unix timestamp (seconds)
  items:       unknown[] | null
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 3 required fields (invoice_number, total_cents, status)
//
// schema_score = validos / 3
// Rechazo si < 0.5 (= si faltan 2+ de los 3 campos).
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: InvoicePayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.invoice_number !== 'string' || payload.invoice_number.length === 0) {
    missing.push('invoice_number')
  }

  if (typeof payload.total_cents !== 'number' || isNaN(payload.total_cents)) {
    missing.push('total_cents')
  }

  const VALID_STATUSES: InvoiceStatus[] = ['paid', 'pending', 'overdue', 'draft']
  if (!VALID_STATUSES.includes(payload.status)) {
    missing.push('status')
  }

  const total = 3
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — formula S5 del contrato
// 0.5*schema + 0.3*provider + 0.2*recency
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.85  // Holded es autoritativo para facturacion
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Convert Unix timestamp (seconds) to ISO 8601 string */
function unixToISO(ts: number | null | undefined): string | undefined {
  if (ts === null || ts === undefined || ts === 0) return undefined
  try {
    return new Date(ts * 1000).toISOString()
  } catch {
    return undefined
  }
}

/** Convert currency amount to cents (integer) */
function toCents(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || isNaN(amount)) return 0
  return Math.round(amount * 100)
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeHoldedInvoice — funcion principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id (id) ausente
//   - schema_score < 0.5 (2+ required ausentes)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeHoldedInvoice(
  raw: RawHoldedInvoice,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.id) return null

  // Normalizar status
  const VALID_STATUSES: InvoiceStatus[] = ['paid', 'pending', 'overdue', 'draft']
  const rawStatus = (raw.status ?? '').toLowerCase() as InvoiceStatus
  const status: InvoiceStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'draft'

  // Convertir amounts a cents
  const totalCents = toCents(raw.total)

  // Convertir timestamps
  const issuedAt = unixToISO(raw.date) ?? ctx.source_timestamp
  const dueAt    = unixToISO(raw.dueDate)

  const payload: InvoicePayload = {
    invoice_number: raw.id,
    contact_name:   raw.contactName ?? '',
    total_cents:    totalCents,
    currency:       raw.currency ?? 'EUR',
    status,
    issued_at:      issuedAt,
    ...(dueAt && { due_at: dueAt }),
    items_count:    Array.isArray(raw.items) ? raw.items.length : 0,
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  // occurred_at: fecha de emision de la factura; fallback a source_timestamp
  const occurredAt = issuedAt

  return {
    provider:         'holded',
    entity_type:      'invoice',
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
