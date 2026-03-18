/**
 * MEETING AGENT — Impact & Validation Layer (Bloque X)
 * Versión Deno para edge functions.
 *
 * Lógica idéntica a src/lib/meeting-agent.ts — mantener en sincronía.
 * No puede importarse desde src/lib/ en Deno, por eso existe esta copia.
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface MeetingInsightRow {
  id: string;
  meeting_id: string;
  insight_type: 'task' | 'decision' | 'lead' | 'obv_update' | 'blocker' | 'metric';
  content: Record<string, unknown>;
  review_status: 'pending_review' | 'approved' | 'rejected';
  applied: boolean;
  applied_entity_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingInsightWithImpact {
  id: string;
  insight_type: string;
  /** low=informativo · medium=operativo · high=estratégico */
  impact_level: 'low' | 'medium' | 'high';
  clarity_score: number;
  speaker_certainty: 'definitive' | 'conditional' | 'speculative';
  /** transcriptionConfidence × clarity_score × certainty_weight */
  combined_reliability: number;
  /** true solo si high + !auto_degraded → dispara confirmación del founder */
  requires_confirmation: boolean;
  auto_degraded: boolean;
  degradation_reason?: string;
}

// ─── Implementación ─────────────────────────────────────────────────────────

const CERTAINTY_WEIGHT: Record<'definitive' | 'conditional' | 'speculative', number> = {
  definitive:  1.0,
  conditional: 0.7,
  speculative: 0.3,
};

export function classifyInsightImpact(
  insight: MeetingInsightRow,
  transcriptionConfidence: number,
): MeetingInsightWithImpact {
  const { id, insight_type, content } = insight;

  const clarity_score: number =
    typeof content.clarity_score === 'number' ? content.clarity_score : 0.7;

  const rawCertainty = content.speaker_certainty as string | undefined;
  const speaker_certainty: 'definitive' | 'conditional' | 'speculative' =
    rawCertainty === 'definitive' || rawCertainty === 'speculative'
      ? rawCertainty
      : 'conditional';

  const stakeholders = Array.isArray(content.stakeholders) ? content.stakeholders : [];
  const severity = typeof content.severity === 'string' ? content.severity.toLowerCase() : '';
  const hasNumericValue = typeof content.value === 'number';

  let impact_level: 'low' | 'medium' | 'high';

  if (insight_type === 'decision') {
    impact_level =
      stakeholders.length >= 1 && clarity_score >= 0.7 ? 'high' : 'medium';
  } else if (insight_type === 'blocker') {
    impact_level =
      severity === 'critical' || severity === 'crítico' ? 'high' : 'medium';
  } else if (insight_type === 'metric') {
    impact_level = hasNumericValue ? 'high' : 'low';
  } else if (
    insight_type === 'task' ||
    insight_type === 'lead' ||
    insight_type === 'obv_update'
  ) {
    impact_level = 'medium';
  } else {
    impact_level = 'low';
  }

  const certainty_weight = CERTAINTY_WEIGHT[speaker_certainty];
  const combined_reliability = transcriptionConfidence * clarity_score * certainty_weight;

  let auto_degraded = false;
  let degradation_reason: string | undefined;

  if (impact_level === 'high' && combined_reliability < 0.5) {
    impact_level = 'medium';
    auto_degraded = true;
    degradation_reason = `Baja fiabilidad combinada (${combined_reliability.toFixed(2)})`;
  } else if (impact_level === 'medium' && combined_reliability < 0.3) {
    impact_level = 'low';
    auto_degraded = true;
    degradation_reason = `Baja fiabilidad combinada (${combined_reliability.toFixed(2)})`;
  }

  const requires_confirmation = impact_level === 'high' && !auto_degraded;

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
  };
}
