/**
 * meetingAgentService — M18.2 (DB interface para Meeting Agent)
 *
 * Lee meeting_insights aprobados, ejecuta el Meeting Agent puro,
 * aplica anti-spam §10 e inserta integration_insights.
 *
 * El Meeting Agent no tiene `integration_connections` externo.
 * Solución: connection virtual con provider='meeting_intelligence',
 * creada al primer uso. sync_run_id = run creado por meeting_id.
 */

import { supabase } from '@/integrations/supabase/client'
import {
  runMeetingAgentLocal,
  type MeetingInsightRow,
  type MeetingAgentInsightData,
} from '@/lib/meeting-agent'
import { type EvidenceType, type SourceUsed, type SourceDiscarded } from '@/lib/evidence'

export interface RunMeetingAgentResult {
  insights_emitted:       number
  insights_skipped_dedup: number
  insight_types:          string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Obtiene o crea la connection virtual 'meeting_intelligence' para el proyecto.
 * Esta connection representa al Meeting Agent como fuente interna.
 */
async function getOrCreateMeetingConnection(projectId: string): Promise<string> {
  // Buscar connection existente
  const { data: existing } = await supabase
    .from('integration_connections')
    .select('id')
    .eq('project_id', projectId)
    .eq('provider', 'meeting_intelligence')
    .eq('status', 'active')
    .maybeSingle()

  if (existing) return existing.id

  // Crear connection virtual
  const { data: created, error } = await supabase
    .from('integration_connections')
    .insert({
      project_id:  projectId,
      provider:    'meeting_intelligence',
      status:      'active',
      config:      { virtual: true, description: 'Meeting Intelligence Agent — conexión interna' },
    })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(`Meeting Agent: no se pudo crear connection — ${error?.message ?? 'unknown'}`)
  }
  return created.id
}

/**
 * Crea un sync_run para el Meeting Agent vinculado a la reunión.
 * La reunión actúa como "sync" del agente.
 */
async function createMeetingAgentRun(
  connectionId: string,
  meetingId:    string,
): Promise<string> {
  const { data, error } = await supabase
    .from('integration_sync_runs')
    .insert({
      connection_id: connectionId,
      status:        'completed',
      started_at:    new Date().toISOString(),
      completed_at:  new Date().toISOString(),
      entities_found: 0,
      entities_created: 0,
      entities_updated: 0,
      metadata: { meeting_id: meetingId, source: 'meeting_intelligence' },
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Meeting Agent: no se pudo crear sync_run — ${error?.message ?? 'unknown'}`)
  }
  return data.id
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Ejecuta el Meeting Agent para una reunión completada.
 * Llamar desde apply-meeting-insights tras aplicar todos los insights.
 *
 * Flujo:
 * 1. Leer meeting_insights aprobados de la reunión
 * 2. Obtener/crear integration_connection virtual para meeting_intelligence
 * 3. Crear sync_run vinculado a la reunión
 * 4. Leer historial de blockers anteriores del proyecto (para recurring_blocker)
 * 5. Computar insights (pure function)
 * 6. Anti-spam §10: excluir tipos vigentes
 * 7. Insertar integration_insights
 */
export async function runMeetingAgent(
  projectId: string,
  meetingId:  string,
): Promise<RunMeetingAgentResult> {
  // ── 1. Leer insights aprobados ────────────────────────────────────────────
  const { data: rawInsights, error: insightsErr } = await supabase
    .from('meeting_insights')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('review_status', 'approved')

  if (insightsErr) throw new Error(`Meeting Agent: error leyendo insights — ${insightsErr.message}`)

  const insights = (rawInsights ?? []) as MeetingInsightRow[]
  if (insights.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 2. Obtener/crear connection virtual ───────────────────────────────────
  const connectionId = await getOrCreateMeetingConnection(projectId)

  // ── 3. Crear sync_run para esta reunión ───────────────────────────────────
  const syncRunId = await createMeetingAgentRun(connectionId, meetingId)

  // ── 4. Historial de blockers del proyecto (últimas 10 reuniones) ──────────
  const { data: historicalBlockerRows } = await supabase
    .from('meeting_insights')
    .select('content')
    .eq('insight_type', 'blocker')
    .eq('review_status', 'approved')
    .neq('meeting_id', meetingId)  // excluir la reunión actual
    .order('created_at', { ascending: false })
    .limit(50)

  const historicalBlockerTitles = (historicalBlockerRows ?? [])
    .map(r => (r.content as Record<string, unknown>).title as string | undefined)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)

  // ── 5. Obtener transcription_confidence de la reunión ─────────────────────
  const { data: meeting } = await supabase
    .from('meetings')
    .select('ai_confidence_score')
    .eq('id', meetingId)
    .maybeSingle()

  const transcriptionConfidence = (meeting as { ai_confidence_score?: number } | null)?.ai_confidence_score ?? 0.6

  // ── 6. Computar insights (pure) ─────────────────────────────────────────
  const candidates: MeetingAgentInsightData[] = runMeetingAgentLocal(
    insights,
    transcriptionConfidence,
    historicalBlockerTitles,
  )

  if (candidates.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 7. Anti-spam: excluir tipos que aún no han expirado (§10) ─────────────
  const candidateTypes = candidates.map(c => c.insight_type)
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('integration_insights')
    .select('insight_type')
    .eq('project_id', projectId)
    .eq('agent_type', 'meeting')
    .in('insight_type', candidateTypes)
    .gt('expires_at', now)

  const existingTypes = new Set((existing ?? []).map((r: { insight_type: string }) => r.insight_type))
  const toEmit = candidates.filter(c => !existingTypes.has(c.insight_type))
  const skipped = candidates.length - toEmit.length

  if (toEmit.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: skipped, insight_types: [] }
  }

  // ── 8. Insertar insights ──────────────────────────────────────────────────
  const generatedAt = new Date()

  // M18.27 — evidence_type basado en transcription_confidence (meeting-level)
  const evidenceType: EvidenceType =
    transcriptionConfidence >= 0.7 ? 'observed' :
    transcriptionConfidence >= 0.4 ? 'declared' :
    'estimated'

  const meetingSources: SourceUsed[] = [{
    source:       'meeting_intelligence',
    confidence:   transcriptionConfidence,
    timestamp:    generatedAt.toISOString(),
    entity_count: insights.length,
  }]

  const rows = toEmit.map(insight => {
    const expiresAt = new Date(generatedAt.getTime() + insight.expires_hours * 3_600_000)
    return {
      sync_run_id:        syncRunId,
      project_id:         projectId,
      agent_type:         'meeting',
      insight_type:       insight.insight_type,
      entity_ids:         insight.entity_ids,
      payload: {
        signal:  insight.signal,
        content: insight.content,
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
      evidence_type:        evidenceType,           // M18.27: override con tc-based value
      sources_used:         meetingSources,          // M18.27: meeting_intelligence source
      sources_discarded:    insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5,
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Meeting Agent: error escribiendo insights — ${insertErr.message}`)

  // ── M18.19: detectar blockers recurrentes → strategic_blocks (non-fatal) ───
  try {
    await detectAndPersistRecurringBlockers(projectId)
  } catch {
    // no romper el flujo principal si falla la detección de patrones
  }

  return {
    insights_emitted:       toEmit.length,
    insights_skipped_dedup: skipped,
    insight_types:          toEmit.map(c => c.insight_type),
  }
}

// ─── M18.19: Detectar blockers recurrentes y persistir como strategic_blocks ──

interface RecurringTopic {
  blocker_title: string
  meeting_count: number
  first_seen_at: string
  last_seen_at:  string
}

interface MeetingPatternsResult {
  recurring_topics:       RecurringTopic[]
  unresolved_blockers:    unknown[]
  meeting_type_frequency: Record<string, number>
  avg_fulfillment_rate:   number | null
  blocker_threshold_met:  boolean
}

/**
 * M18.19: Llama detect_meeting_patterns y si blocker_threshold_met=true,
 * crea strategic_blocks para los blockers en ≥3 reuniones.
 * Llamada al final de runMeetingAgent() para cerrar el loop patrones → motor.
 */
export async function detectAndPersistRecurringBlockers(
  projectId: string,
): Promise<{ blocks_created: number }> {
  const { data, error } = await supabase
    .rpc('detect_meeting_patterns', { p_project_id: projectId })

  if (error || !data) return { blocks_created: 0 }

  const patterns = data as MeetingPatternsResult
  if (!patterns.blocker_threshold_met) return { blocks_created: 0 }

  // Filtrar los que tienen ≥ 3 reuniones (threshold para strategic_block)
  const threshold3 = (patterns.recurring_topics ?? []).filter(t => t.meeting_count >= 3)
  if (threshold3.length === 0) return { blocks_created: 0 }

  let created = 0
  for (const topic of threshold3) {
    const { data: blockId, error: upsertErr } = await supabase
      .rpc('upsert_recurring_blocker_as_strategic_block', {
        p_project_id:    projectId,
        p_description:   topic.blocker_title,
        p_first_seen_at: topic.first_seen_at,
      })

    if (!upsertErr && blockId) created++
  }

  return { blocks_created: created }
}

/**
 * Lee los patrones detectados de reuniones para un proyecto.
 * Usado por useMeetingPatterns en MeetingHistory.
 */
export async function getMeetingPatterns(projectId: string): Promise<MeetingPatternsResult | null> {
  const { data, error } = await supabase
    .rpc('detect_meeting_patterns', { p_project_id: projectId })

  if (error || !data) return null
  return data as MeetingPatternsResult
}

// T17.V2.3 — tipo tipado para insights del Meeting Agent con campos de evidencia
export interface MeetingInsight {
  id:                string
  insight_type:      string
  payload:           unknown
  confidence:        number | null
  generated_at:      string
  expires_at:        string | null
  evidence_type:     EvidenceType | null
  sources_used:      SourceUsed[]
  sources_discarded: SourceDiscarded[]
}

/**
 * Lee los insights activos (no expirados) del Meeting Agent para un proyecto.
 * Usado por MeetingInsightsCard.
 */
export async function getActiveMeetingInsights(projectId: string): Promise<MeetingInsight[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'meeting')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Meeting Agent: error leyendo insights — ${error.message}`)
  return (data ?? []) as MeetingInsight[]
}
