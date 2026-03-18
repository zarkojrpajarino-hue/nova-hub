/**
 * Normalizador comercial para HubSpot — I15.32 + I15.37
 *
 * Función pura: raw HubSpot Deal → ContractEntity (INTEGRATION_DATA_CONTRACT.md §3-§4)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Convención monetaria: amount en CENTAVOS (Math.round(parseFloat(amount) × 100)).
 * raw.amount llega como string en la API v3 de HubSpot — parseFloat + NaN → 0 → hard reject.
 *
 * Hard rejects (antes de schema_score):
 *   external_id ausente → null
 *   amount_cents ≤ 0 (null / vacío / NaN / cero) → null
 *
 * HUBSPOT_STAGE_MAP v1: IDs default del pipeline HubSpot + labels comunes en minúscula.
 * Stage no mapeado → undefined → penaliza schema_score, no rechaza.
 *
 * PROVIDER_SCORE = 0.8 — heurística provisional v1, sin historial.
 *
 * v1: solo normalizeHubSpotDeal.
 * Futuro: normalizeHubSpotContact, normalizeHubSpotCompany (cuando BLOQUE D defina CRM).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export type DealStage =
  | 'prospect'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface DealPayload {
  deal_name:    string     // R — dealname de HubSpot
  stage:        DealStage  // R — enum cerrado (ver HUBSPOT_STAGE_MAP)
  amount_cents: number     // R — CENTAVOS, entero > 0
  owner_id?:    string     // O — hubspot_owner_id
  close_date?:  string     // O — ISO 8601
  pipeline_id?: string     // O — pipeline ID de HubSpot
  currency?:    string     // O — ISO 4217 (EUR, USD…)
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuándo corrió el sync
}

export interface ContractEntity {
  provider:         'hubspot'
  entity_type:      'deal'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — createdate del deal
  source_timestamp: string       // ISO 8601 — cuándo lo leyó el sync
  synced_at:        string       // ISO 8601 — cuándo se insertó en Optimus
  payload:          DealPayload
  confidence:       number       // 0.0–1.0
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// HUBSPOT_STAGE_MAP v1
//
// IDs default del pipeline estándar de HubSpot + labels comunes normalizados.
// Versionado explícito: bump a v2 al añadir stages. No modificar sin versionar.
// Stage no reconocido → undefined → schema_score penalizado.
// ──────────────────────────────────────────────────────────────────────────────

const HUBSPOT_STAGE_MAP: Record<string, DealStage> = {
  // IDs default del pipeline HubSpot (snake_case sin espacios)
  'appointmentscheduled':  'prospect',
  'qualifiedtobuy':        'qualified',
  'presentationscheduled': 'proposal',
  'decisionmakerboughtin': 'negotiation',
  'contractsent':          'negotiation',
  'closedwon':             'closed_won',
  'closedlost':            'closed_lost',
  // Labels comunes normalizados (lowercase)
  'prospect':              'prospect',
  'lead':                  'prospect',
  'discovery':             'prospect',
  'qualified':             'qualified',
  'proposal':              'proposal',
  'demo':                  'proposal',
  'negotiation':           'negotiation',
  'negotiating':           'negotiation',
  'closed won':            'closed_won',
  'won':                   'closed_won',
  'closed lost':           'closed_lost',
  'lost':                  'closed_lost',
}

// ──────────────────────────────────────────────────────────────────────────────
// amountToCents
//
// HubSpot API v3 devuelve amount como string ("1500.00").
// parseFloat("") → NaN → 0 → hard reject en llamador.
// parseFloat("abc") → NaN → 0 → hard reject en llamador.
// ──────────────────────────────────────────────────────────────────────────────

function amountToCents(raw: string | null | undefined): number {
  if (raw == null || raw === '') return 0
  const parsed = parseFloat(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100)
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — determinista
//
// Required: deal_name, stage, amount_cents
// schema_score = válidos / 3
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: DealPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.deal_name !== 'string' || payload.deal_name.length === 0) {
    missing.push('deal_name')
  }

  const VALID_STAGES: DealStage[] = [
    'prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
  ]
  if (!VALID_STAGES.includes(payload.stage)) {
    missing.push('stage')
  }

  // amount_cents: hard reject ya ocurrió antes — este check es defensivo
  if (
    typeof payload.amount_cents !== 'number' ||
    !Number.isInteger(payload.amount_cents) ||
    payload.amount_cents <= 0
  ) {
    missing.push('amount_cents')
  }

  const total = 3
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — fórmula §5 del contrato
//
// (0.5 × schema_score) + (0.3 × provider_score) + (0.2 × recency_score)
// PROVIDER_SCORE = 0.8 — heurística provisional v1, sin historial de calidad HubSpot.
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.8  // provisional v1
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Tipo de entrada — campos mínimos de HubSpot Deal API v3
// ──────────────────────────────────────────────────────────────────────────────

interface RawHubSpotDeal {
  id: string
  properties: {
    dealname:         string | null
    amount:           string | null  // string en API v3 — puede ser "0", "", null
    dealstage:        string | null
    closedate:        string | null  // ISO 8601 o null
    hubspot_owner_id: string | null
    pipeline:         string | null
    currency:         string | null
    createdate:       string | null  // ISO 8601
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeHubSpotDeal — función principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id ausente
//   - amount_cents ≤ 0 (null / NaN / cero)
//   - schema_score < 0.5
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeHubSpotDeal(
  raw: RawHubSpotDeal,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard 1: external_id requerido — sin él el dato es irrecuperable
  if (!raw.id) return null

  const props = raw.properties

  // Hard guard 2: amount — NaN / 0 → deal sin valor → no es entidad útil para el motor
  const amountCents = amountToCents(props.amount)
  if (amountCents <= 0) return null

  // stage: normalizar a lowercase para cubrir variantes de label
  const stageLower = (props.dealstage ?? '').toLowerCase().trim()
  const mappedStage = HUBSPOT_STAGE_MAP[stageLower] as DealStage | undefined

  const payload: DealPayload = {
    deal_name:    props.dealname ?? '',
    stage:        mappedStage as DealStage,  // undefined penaliza schema_score
    amount_cents: amountCents,
    ...(props.hubspot_owner_id && { owner_id:    props.hubspot_owner_id }),
    ...(props.closedate        && { close_date:  props.closedate }),
    ...(props.pipeline         && { pipeline_id: props.pipeline }),
    ...(props.currency         && { currency:    props.currency }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  // Rechazar si schema_score < 0.5 (menos de 2/3 campos required válidos)
  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  // occurred_at: createdate del deal; fallback a source_timestamp si ausente
  const occurredAt = props.createdate ?? ctx.source_timestamp

  return {
    provider:         'hubspot',
    entity_type:      'deal',
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
