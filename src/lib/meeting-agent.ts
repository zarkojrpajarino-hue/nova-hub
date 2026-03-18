/**
 * MEETING AGENT — Impact & Validation Layer (Bloque X)
 *
 * Clasifica cada insight por nivel de impacto y calcula fiabilidad combinada.
 * Gate: solo lo estratégico + fiable + aprobado toca el motor.
 *
 * combined_reliability = transcriptionConfidence × clarity_score × certainty_weight
 * - high + combined_reliability < 0.5 → degrada a medium
 * - medium + combined_reliability < 0.3 → degrada a low
 * El motor NUNCA recibe señales con combined_reliability < 0.5.
 */

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
