/**
 * evidence.ts — Sistema de evidencia, fiabilidad y transparencia
 *
 * Contratos TypeScript para FASE 17. Define los tipos y funciones que determinan
 * de dónde viene cada dato, cómo de fiable es, y qué alternativas se descartaron.
 *
 * Orden de ejecución: este archivo es Bloque A — prerequisito de todos los demás.
 */

// ─────────────────────────────────────────────────────────────────────────────
// T17.1 — Interfaces EvidenceRecord y EvidenceType
// ─────────────────────────────────────────────────────────────────────────────

export type EvidenceType = 'observed' | 'declared' | 'inferred' | 'estimated'
// observed:  dato directamente medido por una fuente externa (Stripe reporta MRR real)
// declared:  dato introducido por el usuario sin verificación externa (MRR manual)
// inferred:  derivado por IA a partir de otros datos (riesgo calculado de múltiples señales)
// estimated: aproximación cuando no hay dato concreto (benchmark sectorial)

export type ProviderSlug =
  | 'stripe'
  | 'hubspot'
  | 'asana'
  | 'google_calendar'
  | 'holded'
  | 'user_manual'
  | 'ai_inferred'

export interface EvidenceRecord {
  value:          unknown        // el valor del dato
  field:          string         // qué mide (mrr, pipeline_value, task_completion_rate...)
  source:         ProviderSlug   // quién lo aporta
  type:           EvidenceType   // naturaleza del dato
  confidence:     number         // 0–1 heredado de integration_entities.confidence
  timestamp:      string         // ISO — cuándo se obtuvo en la fuente
  trace_id:       string         // entity_id | insight_id | write_log_id
  raw_reference?: string         // external_id de integration_entities (trazabilidad máxima)
  expires_at?:    string         // ISO — si el dato tiene caducidad
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.2 — SOURCE_WEIGHTS y FIELD_COMPATIBILITY
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCE_WEIGHTS: Record<ProviderSlug, number> = {
  stripe:          1.0,  // datos financieros verificados por pasarela de pago
  holded:          0.9,  // datos contables verificados (ERP)
  hubspot:         0.8,  // pipeline CRM declarado por el equipo comercial
  asana:           0.8,  // estado de tareas registrado en herramienta de ejecución
  google_calendar: 0.75, // agenda real sincronizada — no refleja calidad, solo tiempo
  user_manual:     0.6,  // declaración del founder sin verificación externa
  ai_inferred:     0.35, // derivación algorítmica a partir de otras señales
}

// Qué fuentes son válidas para qué campos.
// Si una fuente no está en la lista de un campo → compatibilidad = 0 → nunca gana en conflicto.
export const FIELD_COMPATIBILITY: Record<string, ProviderSlug[]> = {
  mrr:                    ['stripe', 'holded', 'user_manual'],
  pipeline_value:         ['hubspot', 'user_manual'],
  task_completion_rate:   ['asana', 'user_manual'],
  meeting_load_hours:     ['google_calendar', 'user_manual'],
  cash_on_hand:           ['holded', 'stripe', 'user_manual'],
  top_client_revenue_pct: ['stripe', 'holded', 'user_manual'],
  cac_estimate:           ['hubspot', 'user_manual', 'ai_inferred'],
  gross_margin:           ['holded', 'user_manual', 'ai_inferred'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Types auxiliares para sources_used / sources_discarded
// (usados por Bloque D — agentes)
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceUsed {
  source:       ProviderSlug
  confidence:   number         // media de confidence de las entidades usadas
  timestamp:    string         // ISO — source_timestamp de las entidades
  entity_count: number
}

export interface SourceDiscarded {
  source: ProviderSlug
  score:  number
  reason: string
}

// Preferencias de fuente por proyecto — tabla project_source_preferences (T17.10)
export type ProjectSourcePreferences = Record<
  ProviderSlug,
  { enabled: boolean; weight_override?: number; excluded_fields?: string[] }
>

// ─────────────────────────────────────────────────────────────────────────────
// T17.3 — normalizeToEvidence() para filas de integration_entities
// ─────────────────────────────────────────────────────────────────────────────

interface IntegrationEntityRow {
  id:               string
  provider:         string
  entity_type:      string
  external_id:      string
  confidence:       number
  source_timestamp: string | null
  synced_at:        string
  payload:          Record<string, unknown>
}

/** Mapea entity_type → field semántico para la puntuación de evidencia */
function entityTypeToField(entityType: string): string {
  switch (entityType) {
    case 'subscription':    return 'mrr'
    case 'deal':            return 'pipeline_value'
    case 'task':            return 'task_completion_rate'
    case 'calendar_event':  return 'meeting_load_hours'
    default:                return entityType
  }
}

/** Extrae el value relevante del payload según el tipo de entidad */
function entityPayloadValue(entityType: string, payload: Record<string, unknown>): unknown {
  switch (entityType) {
    case 'subscription':    return payload['mrr_contribution']
    case 'deal':            return payload['amount_cents']
    case 'task':            return payload['status']
    case 'calendar_event':  return payload['duration']
    default:                return null
  }
}

export function normalizeToEvidence(entity: IntegrationEntityRow): EvidenceRecord
export function normalizeToEvidence(insight: IntegrationInsightRow): EvidenceRecord
export function normalizeToEvidence(
  row: IntegrationEntityRow | IntegrationInsightRow,
): EvidenceRecord {
  if ('entity_type' in row) {
    // Rama T17.3 — integration_entities
    const entity = row as IntegrationEntityRow
    return {
      value:         entityPayloadValue(entity.entity_type, entity.payload),
      field:         entityTypeToField(entity.entity_type),
      source:        entity.provider as ProviderSlug,
      type:          'observed',  // datos directos de proveedor — siempre observed
      confidence:    entity.confidence,
      timestamp:     entity.source_timestamp ?? entity.synced_at,
      trace_id:      entity.id,
      raw_reference: entity.external_id,
    }
  } else {
    // Rama T17.4 — integration_insights
    const insight = row as IntegrationInsightRow
    return {
      value:      insight.payload,
      field:      insight.insight_type,
      source:     insightAgentToProvider(insight.agent_type),
      type:       resolveInsightEvidenceType(insight),
      confidence: insight.confidence,
      timestamp:  insight.source_timestamp,
      trace_id:   insight.id,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.4 — normalizeToEvidence() para filas de integration_insights
// ─────────────────────────────────────────────────────────────────────────────

interface IntegrationInsightRow {
  id:               string
  agent_type:       string
  insight_type:     string
  entity_ids:       string[]
  confidence:       number
  source_timestamp: string
  payload:          Record<string, unknown>
}

/** Mapea agent_type → ProviderSlug */
function insightAgentToProvider(agentType: string): ProviderSlug {
  switch (agentType) {
    case 'finance':   return 'stripe'
    case 'sales':     return 'hubspot'
    case 'execution': return 'asana'
    case 'calendar':  return 'google_calendar'
    default:          return 'ai_inferred'
  }
}

/**
 * Resuelve evidence_type de un insight según las reglas T17.4:
 * - agente real con entidades → 'observed'
 * - sin entidades → 'estimated'
 * - síntesis de múltiples agentes → 'inferred'
 */
function resolveInsightEvidenceType(insight: IntegrationInsightRow): EvidenceType {
  const REAL_AGENTS = ['finance', 'sales', 'execution', 'calendar'] as const
  const isRealAgent = (REAL_AGENTS as readonly string[]).includes(insight.agent_type)

  if (insight.entity_ids.length === 0) return 'estimated'
  if (insight.agent_type === 'synthesis') return 'inferred'
  if (isRealAgent) return 'observed'
  return 'inferred'
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.5 — computeEvidenceScore()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recency factor por antigüedad del dato.
 * Exportado para tests unitarios (T17.8 caso 4).
 */
export function computeRecencyFactor(timestamp: string): number {
  const ageMs = Date.now() - new Date(timestamp).getTime()
  const h = ageMs / 3_600_000
  if (h < 1)   return 1.0
  if (h < 6)   return 0.9
  if (h < 24)  return 0.8
  if (h < 72)  return 0.7
  if (h < 168) return 0.5  // < 7 días
  return 0.3               // más de 7 días
}

/**
 * Puntuación de calidad de una evidencia concreta.
 * Fórmula: weight_source × confidence × recency_factor × compatibility_factor
 * Si la fuente está desactivada por preferencias → 0.
 * Si la fuente no es compatible con el campo → 0 (nunca gana en conflicto).
 */
export function computeEvidenceScore(
  evidence: EvidenceRecord,
  preferences?: ProjectSourcePreferences,
): number {
  const pref = preferences?.[evidence.source]
  if (pref?.enabled === false) return 0  // fuente desactivada por usuario → nunca gana
  const weight = pref?.weight_override ?? SOURCE_WEIGHTS[evidence.source] ?? 0
  const compat = FIELD_COMPATIBILITY[evidence.field]?.includes(evidence.source) ? 1 : 0
  return weight * evidence.confidence * computeRecencyFactor(evidence.timestamp) * compat
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.6 — resolveConflict()
// ─────────────────────────────────────────────────────────────────────────────

export interface ConflictResolution {
  winner:           EvidenceRecord
  score:            number
  alternatives:     Array<{ evidence: EvidenceRecord; score: number; reason: string }>
  resolution_basis: string  // texto legible: "stripe supera a user_manual (score 0.85 vs 0.42)"
}

/**
 * Resuelve qué evidencia gana cuando múltiples fuentes informan el mismo campo.
 * Reglas de desempate:
 * - Score máximo gana.
 * - Empate → mayor SOURCE_WEIGHTS base (determinista).
 * - Todos en 0 → fallback a la más reciente (resolution_basis = 'fallback_recency').
 */
export function resolveConflict(
  evidences: EvidenceRecord[],
  preferences?: ProjectSourcePreferences,
): ConflictResolution {
  if (evidences.length === 0) {
    throw new Error('resolveConflict: evidences array must not be empty')
  }

  if (evidences.length === 1) {
    return {
      winner:           evidences[0],
      score:            computeEvidenceScore(evidences[0], preferences),
      alternatives:     [],
      resolution_basis: `Única fuente: ${evidences[0].source}`,
    }
  }

  const scored = evidences.map(e => ({
    evidence: e,
    score:    computeEvidenceScore(e, preferences),
  }))

  // Todos en 0 → fallback a la más reciente
  const maxScore = Math.max(...scored.map(s => s.score))
  if (maxScore === 0) {
    const byRecency = [...evidences].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    const winner = byRecency[0]
    return {
      winner,
      score:        0,
      alternatives: scored
        .filter(s => s.evidence !== winner)
        .map(s => ({
          evidence: s.evidence,
          score:    0,
          reason:   'all_sources_incompatible_or_disabled',
        })),
      resolution_basis: 'fallback_recency',
    }
  }

  // Ordenar: score desc, tie-break por SOURCE_WEIGHTS base
  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (SOURCE_WEIGHTS[b.evidence.source] ?? 0) - (SOURCE_WEIGHTS[a.evidence.source] ?? 0)
  })

  const winner = sorted[0]
  const runnerUp = sorted[1]

  const alternatives = sorted.slice(1).map(s => ({
    evidence: s.evidence,
    score:    s.score,
    reason:   s.score === 0
      ? 'incompatible_or_disabled'
      : `lower_score_than_${winner.evidence.source}`,
  }))

  return {
    winner:           winner.evidence,
    score:            winner.score,
    alternatives,
    resolution_basis: `${winner.evidence.source} supera a ${runnerUp.evidence.source} (score ${winner.score.toFixed(2)} vs ${runnerUp.score.toFixed(2)})`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.7 — computeReliabilityScore()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score de fiabilidad de un insight basado en sus fuentes usadas.
 *
 * NOTA DE IMPLEMENTACIÓN: sources_used son SourceUsed[], no EvidenceRecord[].
 * Aplicar computeEvidenceScore directamente requeriría un `field` para el
 * factor de compatibilidad — pero las fuentes ya pasaron compat al ser seleccionadas.
 * Se calcula weight × confidence × recency (sin compat factor redundante).
 * Criterios del spec se cumplen: Stripe confidence=0.85 → score ≥ 0.8 ✓
 *
 * T17.26: si una fuente está desactivada en preferences → contribuye 0.
 * Si weight_override está presente → usar ese peso en lugar de SOURCE_WEIGHTS.
 * Si sources_used vacío → fallback a insight.confidence × ai_inferred weight.
 */
export function computeReliabilityScore(
  sourcesUsed: SourceUsed[],
  fallbackConfidence?: number,
  preferences?: ProjectSourcePreferences,
): number {
  if (sourcesUsed.length === 0) {
    const conf = fallbackConfidence ?? 0
    return conf * SOURCE_WEIGHTS.ai_inferred
  }

  // T17.26 — filtrar fuentes desactivadas por preferencias del usuario
  const activeSources = sourcesUsed.filter(
    s => preferences?.[s.source]?.enabled !== false
  )

  // Si el usuario desactivó todas las fuentes → fallback a ai_inferred weight
  if (activeSources.length === 0) {
    const conf = fallbackConfidence ?? 0
    return conf * SOURCE_WEIGHTS.ai_inferred
  }

  const total = activeSources.reduce((sum, s) => {
    // T17.26 — respetar weight_override si existe
    const weight  = preferences?.[s.source]?.weight_override ?? SOURCE_WEIGHTS[s.source] ?? 0
    const recency = computeRecencyFactor(s.timestamp)
    return sum + weight * s.confidence * recency
  }, 0)

  return total / activeSources.length
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.V2.4 — getReliabilityLabel()
// ─────────────────────────────────────────────────────────────────────────────

export interface ReliabilityLabel {
  label: string                     // texto para el usuario
  level: 'high' | 'medium' | 'low'  // para aplicar color
}

/**
 * Convierte un reliability_score numérico en una etiqueta legible.
 * Umbrales: ≥0.75 = alta fiabilidad, ≥0.45 = fiabilidad media, <0.45 = muy incierto.
 * Diseñado para mostrar junto a insights en Focus Block, ProjectEnginePanel, etc.
 */
export function getReliabilityLabel(score: number): ReliabilityLabel {
  if (score >= 0.75) return { label: 'Alta fiabilidad',  level: 'high'   }
  if (score >= 0.45) return { label: 'Fiabilidad media', level: 'medium' }
  return                    { label: 'Muy incierto',     level: 'low'    }
}
