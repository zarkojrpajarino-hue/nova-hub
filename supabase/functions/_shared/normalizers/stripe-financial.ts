/**
 * Normalizador financiero para Stripe — I15.31 + I15.36
 *
 * Funciones puras: raw Stripe payload → ContractEntity (INTEGRATION_DATA_CONTRACT.md §3-§4)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Convención monetaria: todos los importes en CENTAVOS (unidad mínima).
 * La UI divide por 100 para mostrar en EUR/USD. La tubería interna no hace conversiones.
 *
 * v1: solo normalizeStripeSubscription.
 * Futuro: normalizeStripeCharge, normalizeStripeCustomer (cuando se añadan esos endpoints).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato (subset de INTEGRATION_DATA_CONTRACT.md §3-§4)
// ──────────────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused'

export interface SubscriptionPayload {
  plan_name:             string            // R — price.nickname ?? price.id (fallback técnico)
  plan_name_is_fallback: boolean           // true si se usó price.id — calidad degradada
  status:                SubscriptionStatus // R — enum cerrado (ver STRIPE_STATUS_MAP)
  mrr_contribution:      number            // R — CENTAVOS/mes (entero, >= 0)
  customer_id?:          string            // O — ID externo del customer en Stripe
  trial_end?:            string            // O — ISO 8601
  cancel_at?:            string            // O — ISO 8601
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuándo corrió el sync
}

export interface ContractEntity {
  provider:         'stripe'
  entity_type:      'subscription'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — cuándo se creó en Stripe
  source_timestamp: string       // ISO 8601 — cuándo lo leyó el sync
  synced_at:        string       // ISO 8601 — cuándo se insertó en Optimus
  payload:          SubscriptionPayload
  confidence:       number       // 0.0–1.0 (fórmula en computeConfidence)
  is_complete:      boolean      // false si algún campo R está degradado
  missing_fields:   string[]     // campos R ausentes o inválidos
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// Mapeo de status Stripe → enum contractual cerrado
//
// Stripe statuses: active, trialing, past_due, canceled, cancelled, incomplete,
//                  incomplete_expired, unpaid, paused
// Contrato: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused'
// ──────────────────────────────────────────────────────────────────────────────

const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  'active':             'active',
  'trialing':           'trialing',
  'past_due':           'past_due',
  'canceled':           'cancelled',   // Stripe usa 1 'l'; contrato usa 2
  'cancelled':          'cancelled',   // defensivo — ambas formas aceptadas
  'incomplete':         'past_due',    // problema de cobro pendiente — conservador
  'incomplete_expired': 'cancelled',   // sin cobro y vencida — muerta
  'unpaid':             'past_due',    // idem — conservador
  'paused':             'paused',
}

// ──────────────────────────────────────────────────────────────────────────────
// Factores de normalización de intervalo → mensual
// 'year' → ÷12, 'week' → ×4.33, 'day' → ×30
// ──────────────────────────────────────────────────────────────────────────────

const INTERVAL_FACTORS: Record<string, number> = {
  'day':   30,
  'week':  4.33,
  'month': 1,
  'year':  1 / 12,
}

function intervalToMonthlyFactor(interval: string | undefined): number {
  return INTERVAL_FACTORS[interval ?? 'month'] ?? 1
}

// ──────────────────────────────────────────────────────────────────────────────
// mrrContributionCents — suma del MRR de todos los items en centavos/mes
// ──────────────────────────────────────────────────────────────────────────────

interface StripeItem {
  price: {
    unit_amount: number | null
    recurring?: { interval: string } | null
  }
  quantity?: number
}

function mrrContributionCents(items: { data: StripeItem[] }): number {
  return items.data.reduce((sum, item) => {
    const unitAmount = item.price.unit_amount ?? 0
    const qty        = item.quantity ?? 1
    const factor     = intervalToMonthlyFactor(item.price.recurring?.interval)
    return sum + Math.round(unitAmount * qty * factor)
  }, 0)
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — determinista, sobre los 3 campos required de subscription
//
// Required: plan_name, status, mrr_contribution
// schema_score = válidos / 3
//
// Umbrales del contrato §5:
//   < 0.5  → rechazado (normalizeStripeSubscription devuelve null)
//   ≥ 0.5  → aceptado con confidence degradada
//   = 1.0  → completo
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: SubscriptionPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  // plan_name: válido si string no-vacío (price.id como fallback también cuenta)
  if (typeof payload.plan_name !== 'string' || payload.plan_name.length === 0) {
    missing.push('plan_name')
  }

  // status: válido solo si está en el enum cerrado del contrato
  const VALID_STATUSES: SubscriptionStatus[] = ['active', 'trialing', 'past_due', 'cancelled', 'paused']
  if (!VALID_STATUSES.includes(payload.status)) {
    missing.push('status')
  }

  // mrr_contribution: válido si entero no-negativo (0 es válido — suscripción gratis)
  if (
    typeof payload.mrr_contribution !== 'number' ||
    !Number.isInteger(payload.mrr_contribution) ||
    payload.mrr_contribution < 0
  ) {
    missing.push('mrr_contribution')
  }

  const total = 3
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — fórmula determinista del contrato §5
//
// confidence = (0.5 × schema_score) + (0.3 × provider_score) + (0.2 × recency_score)
// provider_score = 0.8  (default — sin historial, beneficio de la duda)
// recency_score  = 1.0  (dato recién sincronizado)
//
// Casos:
//   schema_score=1.00 → confidence=0.94  (fiable — agentes usan para motor)
//   schema_score=0.67 → confidence=0.775 (usable — solo dato informativo)
//   schema_score=0.33 → confidence=0.607 (degradado — solo UI)
//   schema_score=0.00 → confidence=0.440 (rechazado — < 0.5)
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.8  // default: sin historial
  const RECENCY_SCORE  = 1.0  // dato recién sincronizado
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Tipo de entrada: minimal Stripe.Subscription (campos que usa el normalizador)
// No importar del SDK de Stripe — evita dependencia en tests y otros contextos
// ──────────────────────────────────────────────────────────────────────────────

interface RawStripeSubscription {
  id:        string
  status:    string
  customer:  string | { id: string } | null
  created:   number  // Unix timestamp
  trial_end: number | null
  cancel_at: number | null
  items: {
    data: Array<{
      price: {
        id:       string
        nickname: string | null
        unit_amount: number | null
        currency: string
        recurring?: { interval: string } | null
      }
      quantity?: number
    }>
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeStripeSubscription — función principal exportada
//
// Devuelve ContractEntity o null si el dato es irrecuperable (schema_score < 0.5
// o external_id ausente).
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeStripeSubscription(
  raw: RawStripeSubscription,
  ctx: SyncContext
): ContractEntity | null {
  // external_id siempre requerido — sin él el dato es irrecuperable
  if (!raw.id) return null

  const firstPrice = raw.items.data[0]?.price

  // plan_name: nickname preferido; price.id como fallback técnico (degradado)
  const planNameRaw     = firstPrice?.nickname ?? null
  const planNameFallback = firstPrice?.id ?? ''
  const planName         = planNameRaw ?? planNameFallback
  const planNameIsFallback = planNameRaw === null

  // status: mapeo cerrado — undefined si no hay mapeo (penaliza schema_score)
  const mappedStatus = STRIPE_STATUS_MAP[raw.status] as SubscriptionStatus | undefined

  // mrr_contribution en CENTAVOS/mes — sin división por 100
  const mrrCents = mrrContributionCents(raw.items)

  // customer_id: string externo (no UUID interno)
  const customerId: string | undefined =
    typeof raw.customer === 'string'
      ? raw.customer
      : (raw.customer as { id: string } | null)?.id ?? undefined

  const payload: SubscriptionPayload = {
    plan_name:             planName,
    plan_name_is_fallback: planNameIsFallback,
    status:                mappedStatus as SubscriptionStatus,  // undefined penaliza schema_score
    mrr_contribution:      mrrCents,
    ...(customerId  !== undefined && { customer_id: customerId }),
    ...(raw.trial_end   && { trial_end: new Date(raw.trial_end   * 1000).toISOString() }),
    ...(raw.cancel_at   && { cancel_at: new Date(raw.cancel_at   * 1000).toISOString() }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  // Rechazar si schema_score < 0.5 (menos de 2/3 campos required válidos)
  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  return {
    provider:         'stripe',
    entity_type:      'subscription',
    external_id:      raw.id,
    project_id:       ctx.project_id,
    occurred_at:      new Date(raw.created * 1000).toISOString(),
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
