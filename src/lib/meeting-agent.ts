/**
 * MEETING AGENT — Impact & Validation Layer (Bloque X) + Meeting Agent (Bloque A)
 *
 * Bloque X: clasifica cada insight por nivel de impacto y calcula fiabilidad combinada.
 * Bloque A: `runMeetingAgentLocal()` — genera integration_insights desde insights aprobados.
 *
 * combined_reliability = transcriptionConfidence × clarity_score × certainty_weight
 * - high + combined_reliability < 0.5 → degrada a medium
 * - medium + combined_reliability < 0.3 → degrada a low
 * El motor NUNCA recibe señales con combined_reliability < 0.5.
 */

import type { EvidenceType, SourceUsed, SourceDiscarded } from '@/lib/evidence'

// ─── Tipos base ─────────────────────────────────────────────────────────────

/**
 * Row de la tabla `meeting_insights`.
 * El campo `content` es JSONB — sus campos varían según insight_type.
 * En M18.X.3 se añaden `content.clarity_score` y `content.speaker_certainty`.
 */
export interface MeetingInsightRow {
  id: string
  meeting_id: string
  /** Tipo según analyze-meeting: 'task'|'decision'|'lead'|'obv_update'|'blocker'|'metric' */
  insight_type: 'task' | 'decision' | 'lead' | 'obv_update' | 'blocker' | 'metric'
  /** JSONB — campos disponibles varían según insight_type */
  content: Record<string, unknown>
  /** Estado de revisión del founder */
  review_status: 'pending_review' | 'approved' | 'rejected'
  applied: boolean
  applied_entity_id?: string | null
  created_at: string
  updated_at: string
}

// ─── Contrato del gate ───────────────────────────────────────────────────────

/**
 * Insight enriquecido con clasificación de impacto y fiabilidad combinada.
 * Producido por `classifyInsightImpact()`.
 */
export interface MeetingInsightWithImpact {
  id: string
  insight_type: string

  /**
   * Nivel de impacto determinado por las 8 reglas de clasificación.
   * - low   → Level 1 Informativo: solo guarda, nunca toca el motor
   * - medium → Level 2 Operativo: crea tasks, auto-aprobado
   * - high  → Level 3 Estratégico: requiere aprobación del founder
   */
  impact_level: 'low' | 'medium' | 'high'

  /**
   * Qué tan explícita y afirmativa es la afirmación en la transcripción.
   * 1.0 = "cerramos el contrato el viernes" · 0.5 = "deberíamos cerrar" · 0.2 = "quizás explorar"
   * Leído de content.clarity_score si existe (añadido en M18.X.3); si no, default 0.7.
   */
  clarity_score: number

  /**
   * Certeza con la que el speaker emitió el insight.
   * - definitive: "cerramos", "decidimos", "hay que hacer X"
   * - conditional: "deberíamos", "podríamos", "cuando sea posible"
   * - speculative: "quizás", "a lo mejor", "en algún momento"
   * Leído de content.speaker_certainty si existe (añadido en M18.X.3); si no, default 'conditional'.
   */
  speaker_certainty: 'definitive' | 'conditional' | 'speculative'

  /**
   * Fiabilidad combinada: transcriptionConfidence × clarity_score × certainty_weight.
   * certainty_weight: definitive=1.0, conditional=0.7, speculative=0.3
   * Gate: combined_reliability < 0.5 → high se degrada a medium.
   *       combined_reliability < 0.3 → medium se degrada a low.
   */
  combined_reliability: number

  /**
   * true solo si impact_level === 'high' && !auto_degraded.
   * Estos insights disparan el flujo de confirmación del founder.
   */
  requires_confirmation: boolean

  /**
   * true si el nivel original fue degradado por baja fiabilidad combinada.
   * Un insight degradado no toca el motor aunque esté aprobado.
   */
  auto_degraded: boolean

  /** Razón de degradación, presente solo si auto_degraded === true. */
  degradation_reason?: string
}

// ─── Lógica de clasificación ────────────────────────────────────────────────

/** Peso de certeza del speaker para el cálculo de fiabilidad combinada. */
const CERTAINTY_WEIGHT: Record<'definitive' | 'conditional' | 'speculative', number> = {
  definitive:  1.0,
  conditional: 0.7,
  speculative: 0.3,
}

/**
 * Clasifica un insight de reunión por nivel de impacto y fiabilidad combinada.
 *
 * Reglas de clasificación (en orden de prioridad):
 * 1. decision + stakeholders.length ≥ 1 + clarity_score ≥ 0.7 → high
 * 2. decision sin stakeholders o clarity_score < 0.7            → medium
 * 3. blocker + severity='critical'/'crítico'                    → high
 * 4. blocker + severity!='critical'                             → medium
 * 5. metric + content.value numérico                            → high
 * 6. metric sin valor numérico                                  → low
 * 7. task | lead | obv_update                                   → medium
 * 8. todo lo demás                                              → low
 *
 * Degradación por combined_reliability (aplicada tras clasificación base):
 * - high   + combined_reliability < 0.5 → medium, auto_degraded=true
 * - medium + combined_reliability < 0.3 → low,    auto_degraded=true
 *
 * @param insight               - Row de `meeting_insights`
 * @param transcriptionConfidence - Confianza de la transcripción (0–1). Default recomendado: 0.6.
 */
export function classifyInsightImpact(
  insight: MeetingInsightRow,
  transcriptionConfidence: number,
): MeetingInsightWithImpact {
  const { id, insight_type, content } = insight

  // 1. Leer clarity_score y speaker_certainty del JSONB (añadidos por M18.X.3)
  //    Defaults conservadores: clarity_score=0.7, speaker_certainty='conditional'
  const clarity_score: number =
    typeof content.clarity_score === 'number' ? content.clarity_score : 0.7

  const rawCertainty = content.speaker_certainty as string | undefined
  const speaker_certainty: 'definitive' | 'conditional' | 'speculative' =
    rawCertainty === 'definitive' || rawCertainty === 'speculative'
      ? rawCertainty
      : 'conditional'

  // 2. Clasificar nivel de impacto base
  const stakeholders = Array.isArray(content.stakeholders) ? content.stakeholders : []
  const severity = typeof content.severity === 'string' ? content.severity.toLowerCase() : ''
  const hasNumericValue = typeof content.value === 'number'

  let impact_level: 'low' | 'medium' | 'high'

  if (insight_type === 'decision') {
    // Reglas 1 y 2
    impact_level =
      stakeholders.length >= 1 && clarity_score >= 0.7 ? 'high' : 'medium'
  } else if (insight_type === 'blocker') {
    // Reglas 3 y 4 — soportar tanto 'critical' (en) como 'crítico' (es)
    impact_level =
      severity === 'critical' || severity === 'crítico' ? 'high' : 'medium'
  } else if (insight_type === 'metric') {
    // Reglas 5 y 6
    impact_level = hasNumericValue ? 'high' : 'low'
  } else if (
    insight_type === 'task' ||
    insight_type === 'lead' ||
    insight_type === 'obv_update'
  ) {
    // Regla 7
    impact_level = 'medium'
  } else {
    // Regla 8
    impact_level = 'low'
  }

  // 3. Calcular fiabilidad combinada
  const certainty_weight = CERTAINTY_WEIGHT[speaker_certainty]
  const combined_reliability = transcriptionConfidence * clarity_score * certainty_weight

  // 4. Aplicar degradación por baja fiabilidad
  let auto_degraded = false
  let degradation_reason: string | undefined

  if (impact_level === 'high' && combined_reliability < 0.5) {
    impact_level = 'medium'
    auto_degraded = true
    degradation_reason = `Baja fiabilidad combinada (${combined_reliability.toFixed(2)})`
  } else if (impact_level === 'medium' && combined_reliability < 0.3) {
    impact_level = 'low'
    auto_degraded = true
    degradation_reason = `Baja fiabilidad combinada (${combined_reliability.toFixed(2)})`
  }

  // 5. requires_confirmation: solo high no degradados
  const requires_confirmation = impact_level === 'high' && !auto_degraded

  return {
    id,
    insight_type,
    impact_level,
    clarity_score,
    speaker_certainty,
    combined_reliability,
    requires_confirmation,
    auto_degraded,
    ...(degradation_reason !== undefined ? { degradation_reason } : {}),
  }
}

// ─── Bloque A — Meeting Agent: integration_insights ─────────────────────────

export type MeetingAgentInsightType =
  | 'strategic_decision'  // ≥1 decisión aprobada con stakeholders → motor
  | 'commitment_cluster'  // ≥3 tasks creadas → señal de reunión muy ejecutiva
  | 'recurring_blocker'   // blocker en ≥2 reuniones → bloqueo estructural
  | 'metric_update'       // métrica con valor numérico explícito

/**
 * Insight generado por el Meeting Agent.
 * Misma forma que FinanceInsightData — se inserta en integration_insights.
 */
export interface MeetingAgentInsightData {
  insight_type:       MeetingAgentInsightType
  signal: {
    metric_name:   string
    current_value: number
    period_days:   number
    data_points:   number
  }
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence:         number
  entity_ids:         string[]   // IDs de meeting_insights que originaron este insight
  include_in_context: boolean
  /** En horas — el servicio calcula expires_at = generated_at + expires_hours */
  expires_hours: number
  evidence_type:      EvidenceType
  sources_used:       SourceUsed[]
  sources_discarded:  SourceDiscarded[]
}

// ─── Compute functions ───────────────────────────────────────────────────────

/**
 * Regla 1 — strategic_decision:
 * ≥1 decisión aprobada con stakeholders != vacíos → señal estratégica al motor.
 * expires_hours: 168h (7 días).
 */
export function computeStrategicDecision(
  insights:              MeetingInsightRow[],
  transcriptionConfidence: number,
): MeetingAgentInsightData | null {
  const decisions = insights.filter(
    i => i.insight_type === 'decision' &&
         i.review_status === 'approved' &&
         Array.isArray(i.content.stakeholders) &&
         (i.content.stakeholders as unknown[]).length >= 1,
  )

  if (decisions.length === 0) return null

  const avgConf =
    (decisions.reduce((s, d) => {
      const cs = typeof d.content.clarity_score === 'number' ? d.content.clarity_score : 0.7
      return s + cs
    }, 0) / decisions.length) * transcriptionConfidence

  if (avgConf < 0.4) return null  // §5 mínimo de confianza

  const severity: MeetingAgentInsightData['content']['severity'] =
    avgConf >= 0.75 ? 'warning' : 'attention'

  const titles = decisions
    .map(d => (d.content.title as string | undefined) ?? 'decisión sin título')
    .slice(0, 3)
    .join(', ')

  return {
    insight_type: 'strategic_decision',
    signal: {
      metric_name:   'strategic_decisions_count',
      current_value: decisions.length,
      period_days:   0,
      data_points:   decisions.length,
    },
    content: {
      summary:    `${decisions.length} decisión${decisions.length > 1 ? 'es' : ''} estratégica${decisions.length > 1 ? 's' : ''} aprobada${decisions.length > 1 ? 's' : ''}: ${titles}.`,
      implication: 'Estas decisiones deben reflejarse en el motor de fases. Se han registrado en decision_events.',
      severity,
      action_hint: 'Revisa que las decisiones estén alineadas con la prioridad actual del proyecto.',
    },
    confidence:         avgConf,
    entity_ids:         decisions.map(d => d.id),
    include_in_context: true,
    expires_hours:      168,  // 7 días
    evidence_type:      transcriptionConfidence >= 0.7 ? 'observed' : 'declared',
    sources_used:       [{ source: 'user_manual', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: decisions.length }],
    sources_discarded:  [],
  }
}

/**
 * Regla 2 — commitment_cluster:
 * ≥3 tasks creadas en una reunión → señal de reunión muy orientada a acción.
 * expires_hours: 48h.
 */
export function computeCommitmentCluster(
  insights: MeetingInsightRow[],
): MeetingAgentInsightData | null {
  const tasks = insights.filter(
    i => i.insight_type === 'task' && i.review_status === 'approved',
  )

  if (tasks.length < 3) return null

  const assignedCount = tasks.filter(t => t.content.assigned_to).length
  const severity: MeetingAgentInsightData['content']['severity'] =
    tasks.length >= 5 ? 'attention' : 'info'

  return {
    insight_type: 'commitment_cluster',
    signal: {
      metric_name:   'tasks_from_meeting',
      current_value: tasks.length,
      period_days:   0,
      data_points:   tasks.length,
    },
    content: {
      summary:    `${tasks.length} compromisos generados en esta reunión${assignedCount > 0 ? ` (${assignedCount} asignados)` : ''}.`,
      implication: 'Reunión de alta acción. Verifica el fulfillment en las próximas 48h para evitar backlog de compromisos.',
      severity,
      action_hint: tasks.length >= 5
        ? `${tasks.length} compromisos es una carga alta. Prioriza los 3 más críticos y delega el resto.`
        : undefined,
    },
    confidence:         0.85,
    entity_ids:         tasks.map(t => t.id),
    include_in_context: tasks.length >= 5,
    expires_hours:      48,
    evidence_type:      'observed',
    sources_used:       [{ source: 'user_manual', confidence: 0.85, timestamp: new Date().toISOString(), entity_count: tasks.length }],
    sources_discarded:  [],
  }
}

/**
 * Regla 3 — recurring_blocker:
 * Blocker cuyo título aparece en historicalBlockerTitles (reuniones anteriores).
 * expires_hours: 336h (14 días).
 */
export function computeRecurringBlocker(
  insights:              MeetingInsightRow[],
  historicalBlockerTitles: string[],
): MeetingAgentInsightData | null {
  const blockers = insights.filter(
    i => i.insight_type === 'blocker' && i.review_status === 'approved',
  )

  if (blockers.length === 0 || historicalBlockerTitles.length === 0) return null

  // Detectar blockers que ya aparecieron antes (comparación case-insensitive, 5+ chars coinciden)
  const recurring = blockers.filter(b => {
    const title = ((b.content.title as string | undefined) ?? '').toLowerCase()
    return historicalBlockerTitles.some(h => {
      const hLow = h.toLowerCase()
      return title.length >= 5 && hLow.length >= 5 &&
        (title.includes(hLow.slice(0, 8)) || hLow.includes(title.slice(0, 8)))
    })
  })

  if (recurring.length === 0) return null

  const first = recurring[0]
  const title = (first.content.title as string | undefined) ?? 'blocker sin título'
  const severity: MeetingAgentInsightData['content']['severity'] =
    ((first.content.severity as string | undefined) ?? '').toLowerCase() === 'crítico'
      ? 'critical'
      : 'warning'

  return {
    insight_type: 'recurring_blocker',
    signal: {
      metric_name:   'recurring_blocker_count',
      current_value: recurring.length,
      period_days:   30,
      data_points:   recurring.length,
    },
    content: {
      summary:    `Blocker recurrente detectado: "${title}". Aparece en ≥2 reuniones.`,
      implication: 'Este bloqueo no se está resolviendo entre reuniones. Podría convertirse en un bloqueo estructural.',
      severity,
      action_hint: 'Define un responsable y fecha de resolución específica para este blocker.',
    },
    confidence:         0.75,
    entity_ids:         recurring.map(r => r.id),
    include_in_context: true,
    expires_hours:      336,  // 14 días
    evidence_type:      'observed',
    sources_used:       [{ source: 'user_manual', confidence: 0.75, timestamp: new Date().toISOString(), entity_count: recurring.length }],
    sources_discarded:  [],
  }
}

/**
 * Regla 4 — metric_update:
 * Métrica con valor numérico explícito → conecta con key_metrics.
 * expires_hours: 24h.
 */
export function computeMetricUpdate(
  insights: MeetingInsightRow[],
): MeetingAgentInsightData | null {
  const metrics = insights.filter(
    i => i.insight_type === 'metric' &&
         i.review_status === 'approved' &&
         typeof i.content.value === 'number',
  )

  if (metrics.length === 0) return null

  const first = metrics[0]
  const name  = (first.content.name  as string | undefined) ?? 'métrica'
  const value = first.content.value as number
  const unit  = (first.content.unit  as string | undefined) ?? ''

  return {
    insight_type: 'metric_update',
    signal: {
      metric_name:   name,
      current_value: value,
      period_days:   0,
      data_points:   metrics.length,
    },
    content: {
      summary:     `Métrica actualizada en reunión: ${name} = ${value}${unit ? ` ${unit}` : ''}.`,
      implication: 'Valor reportado en reunión. Verificar contra datos del sistema para mayor precisión.',
      severity:    'info',
      action_hint: metrics.length > 1
        ? `${metrics.length} métricas discutidas. Revisa y sincroniza con tu sistema de KPIs.`
        : undefined,
    },
    confidence:         0.7,
    entity_ids:         metrics.map(m => m.id),
    include_in_context: true,
    expires_hours:      24,
    evidence_type:      'declared',
    sources_used:       [{ source: 'user_manual', confidence: 0.7, timestamp: new Date().toISOString(), entity_count: metrics.length }],
    sources_discarded:  [],
  }
}

/**
 * Ejecuta todos los cómputos del Meeting Agent sobre los insights aprobados.
 *
 * @param insights               - Rows de meeting_insights (approved) de una reunión
 * @param transcriptionConfidence - Confianza de la transcripción (0–1); default 0.6
 * @param historicalBlockerTitles - Títulos de blockers de reuniones anteriores (para recurring_blocker)
 */
export function runMeetingAgentLocal(
  insights:                MeetingInsightRow[],
  transcriptionConfidence: number = 0.6,
  historicalBlockerTitles: string[] = [],
): MeetingAgentInsightData[] {
  return [
    computeStrategicDecision(insights, transcriptionConfidence),
    computeCommitmentCluster(insights),
    computeRecurringBlocker(insights, historicalBlockerTitles),
    computeMetricUpdate(insights),
  ]
    .filter((x): x is MeetingAgentInsightData => x !== null)
    // §12 política de silencio: no emitir si confianza < 0.4 y sin entity_ids
    .filter(x => !(x.confidence < 0.4 && x.entity_ids.length === 0))
}
