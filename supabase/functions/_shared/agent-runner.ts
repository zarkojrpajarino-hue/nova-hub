/**
 * agent-runner.ts — Server-side agent execution post-sync
 *
 * Portable agent logic for Deno edge functions.
 * Called at the end of each sync to generate insights automatically.
 *
 * Architecture:
 *   sync-stripe completes → calls runPostSyncAgents() →
 *   reads entities → computes insights (pure) → anti-spam filter →
 *   writes to integration_insights
 *
 * Why server-side: previously agents ran client-side (browser) only when
 * the user visited the integrations page. Result: 0 insights generated.
 * Now they run automatically after every sync.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ══════════════════════════════════════════════════════════════════
// Anti-spam (port of src/lib/agent-antispam.ts)
// ══════════════════════════════════════════════════════════════════

const VALUE_CHANGE_THRESHOLD = 0.15

function hasSignificantValueChange(current: number, previous: number): boolean {
  if (previous === 0 && current === 0) return false
  if (previous === 0 || current === 0) return true
  return Math.abs(current - previous) / Math.abs(previous) >= VALUE_CHANGE_THRESHOLD
}

function extractSignalValue(payload: Record<string, unknown> | null): number | null {
  if (!payload) return null
  const signal = payload['signal']
  if (typeof signal !== 'object' || signal === null) return null
  const value = (signal as Record<string, unknown>)['current_value']
  return typeof value === 'number' ? value : null
}

// ══════════════════════════════════════════════════════════════════
// Finance Agent (port of src/lib/finance-agent.ts)
// ══════════════════════════════════════════════════════════════════

interface SubscriptionEntity {
  id: string
  confidence: number
  payload: {
    status: string
    mrr_contribution: number
    customer_id?: string
    cancel_at?: string
    trial_end?: string
  }
}

interface InsightData {
  insight_type: string
  signal: { metric_name: string; current_value: number; period_days: number; data_points: number }
  content: { summary: string; implication: string; severity: string; action_hint?: string }
  confidence: number
  entity_ids: string[]
  include_in_context: boolean
  expires_hours: number
  evidence_type: string
  sources_used: Array<{ source: string; confidence: number; timestamp: string; entity_count: number }>
  sources_discarded: unknown[]
}

const REVENUE_STATUSES = new Set(['active', 'trialing'])

function computeCashFlowSignal(entities: SubscriptionEntity[]): InsightData | null {
  const active = entities.filter(e => REVENUE_STATUSES.has(e.payload.status))
  if (active.length < 1) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  if (avgConf < 0.5) return null

  const totalMrrCents = active.reduce((s, e) => s + e.payload.mrr_contribution, 0)
  const mrrEuros = totalMrrCents / 100
  const isPositive = totalMrrCents > 0

  return {
    insight_type: 'cash_flow_signal',
    signal: { metric_name: 'mrr_total_euros', current_value: mrrEuros, period_days: 0, data_points: active.length },
    content: {
      summary: isPositive
        ? `MRR activo: €${mrrEuros.toFixed(2)} de ${active.length} suscripción${active.length > 1 ? 'es' : ''}.`
        : `Sin revenue activo. ${entities.length} suscripción${entities.length !== 1 ? 'es' : ''} en Stripe sin MRR generado.`,
      implication: isPositive
        ? 'Financial Engine usa este MRR real en lugar de estimaciones manuales.'
        : 'Financial Engine sigue usando estimaciones manuales de MRR.',
      severity: isPositive ? 'info' : 'attention',
      ...((!isPositive) && { action_hint: 'Activa o verifica las suscripciones en Stripe.' }),
    },
    confidence: avgConf,
    entity_ids: active.map(e => e.id),
    include_in_context: true,
    expires_hours: 24,
    evidence_type: 'observed',
    sources_used: [{ source: 'stripe', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: active.length }],
    sources_discarded: [],
  }
}

function computeRevenueConcentration(entities: SubscriptionEntity[]): InsightData | null {
  const active = entities.filter(e => REVENUE_STATUSES.has(e.payload.status) && e.payload.customer_id)
  if (active.length < 3) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  const confidence = avgConf * Math.min(1.0, active.length / 3)
  if (confidence < 0.5) return null

  const byCustomer = new Map<string, number>()
  for (const e of active) {
    byCustomer.set(e.payload.customer_id!, (byCustomer.get(e.payload.customer_id!) ?? 0) + e.payload.mrr_contribution)
  }

  const totalMrr = Array.from(byCustomer.values()).reduce((s, v) => s + v, 0)
  if (totalMrr === 0) return null

  const topMrr = Math.max(...byCustomer.values())
  const pct = Math.round((topMrr / totalMrr) * 100)
  const severity = pct > 50 ? 'warning' : pct > 30 ? 'attention' : 'info'

  return {
    insight_type: 'revenue_concentration',
    signal: { metric_name: 'top_customer_mrr_pct', current_value: pct, period_days: 0, data_points: byCustomer.size },
    content: {
      summary: `Cliente principal: ${pct}% del MRR total (${byCustomer.size} clientes).`,
      implication: pct > 50
        ? 'Riesgo de concentración alto. Perder ese cliente reduciría el MRR más del 50%.'
        : pct > 30
          ? 'Concentración moderada. Diversificar reduciría riesgo financiero.'
          : 'Revenue bien distribuido.',
      severity,
      action_hint: pct > 30 ? `Diversifica: abre conversaciones comerciales nuevas (concentración: ${pct}%).` : undefined,
    },
    confidence,
    entity_ids: active.map(e => e.id),
    include_in_context: pct > 30,
    expires_hours: 7 * 24,
    evidence_type: 'observed',
    sources_used: [{ source: 'stripe', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: active.length }],
    sources_discarded: [],
  }
}

// ── New Finance insights: churn, ARPU, revenue at risk ──────────

function computeChurnRisk(entities: SubscriptionEntity[]): InsightData | null {
  const canceling = entities.filter(e => e.payload.cancel_at || e.payload.status === 'canceled')
  const active = entities.filter(e => REVENUE_STATUSES.has(e.payload.status))
  if (active.length < 2 || canceling.length === 0) return null

  const avgConf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length
  if (avgConf < 0.5) return null

  const churnPct = Math.round((canceling.length / (active.length + canceling.length)) * 100)
  const lostMrrCents = canceling.reduce((s, e) => s + e.payload.mrr_contribution, 0)
  const lostMrrEuros = lostMrrCents / 100

  return {
    insight_type: 'churn_risk',
    signal: { metric_name: 'churn_rate_pct', current_value: churnPct, period_days: 0, data_points: canceling.length },
    content: {
      summary: `${canceling.length} suscripciones canceladas/cancelándose (${churnPct}%). MRR en riesgo: €${lostMrrEuros.toFixed(2)}.`,
      implication: churnPct > 20 ? 'Churn alto — investigar causa raíz.' : churnPct > 10 ? 'Churn moderado.' : 'Churn controlado.',
      severity: churnPct > 20 ? 'warning' : churnPct > 10 ? 'attention' : 'info',
      action_hint: churnPct > 10 ? `Contacta a los ${canceling.length} clientes que cancelaron. €${lostMrrEuros.toFixed(0)} de MRR recuperable.` : undefined,
    },
    confidence: avgConf, entity_ids: canceling.map(e => e.id), include_in_context: churnPct > 10, expires_hours: 7 * 24,
    evidence_type: 'observed', sources_used: [{ source: 'stripe', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: canceling.length }], sources_discarded: [],
  }
}

function computeARPU(entities: SubscriptionEntity[]): InsightData | null {
  const active = entities.filter(e => REVENUE_STATUSES.has(e.payload.status) && e.payload.customer_id)
  if (active.length < 2) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  if (avgConf < 0.5) return null

  const uniqueCustomers = new Set(active.map(e => e.payload.customer_id!)).size
  const totalMrrCents = active.reduce((s, e) => s + e.payload.mrr_contribution, 0)
  const arpuEuros = (totalMrrCents / uniqueCustomers) / 100

  return {
    insight_type: 'arpu',
    signal: { metric_name: 'arpu_euros', current_value: arpuEuros, period_days: 0, data_points: uniqueCustomers },
    content: {
      summary: `ARPU: €${arpuEuros.toFixed(2)}/mes (${uniqueCustomers} clientes).`,
      implication: 'Revenue promedio por cliente. Subir ARPU es más eficiente que adquirir clientes nuevos.',
      severity: 'info',
    },
    confidence: avgConf, entity_ids: active.map(e => e.id), include_in_context: true, expires_hours: 7 * 24,
    evidence_type: 'observed', sources_used: [{ source: 'stripe', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: active.length }], sources_discarded: [],
  }
}

function computeRevenueAtRisk(entities: SubscriptionEntity[]): InsightData | null {
  const atRisk = entities.filter(e => e.payload.status === 'past_due' || e.payload.status === 'unpaid')
  if (atRisk.length === 0) return null

  const avgConf = atRisk.reduce((s, e) => s + e.confidence, 0) / atRisk.length
  if (avgConf < 0.5) return null

  const riskMrrCents = atRisk.reduce((s, e) => s + e.payload.mrr_contribution, 0)
  const riskEuros = riskMrrCents / 100

  return {
    insight_type: 'revenue_at_risk',
    signal: { metric_name: 'at_risk_mrr_euros', current_value: riskEuros, period_days: 0, data_points: atRisk.length },
    content: {
      summary: `€${riskEuros.toFixed(2)} de MRR en riesgo (${atRisk.length} suscripciones con pago fallido).`,
      implication: 'Pagos fallidos = revenue que se pierde si no se recupera en días.',
      severity: riskEuros > 100 ? 'critical' : 'warning',
      action_hint: `Revisa ${atRisk.length} suscripciones con pago pendiente en Stripe.`,
    },
    confidence: avgConf, entity_ids: atRisk.map(e => e.id), include_in_context: true, expires_hours: 24,
    evidence_type: 'observed', sources_used: [{ source: 'stripe', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: atRisk.length }], sources_discarded: [],
  }
}

// ══════════════════════════════════════════════════════════════════
// Main: run agents post-sync
// ══════════════════════════════════════════════════════════════════

export interface PostSyncResult {
  insights_emitted: number
  insights_skipped: number
  agent_type: string
}

/**
 * Run the appropriate agent after a sync completes.
 * Called from sync-stripe, sync-hubspot, etc.
 */
export async function runPostSyncAgents(
  serviceClient: SupabaseClient,
  projectId: string,
  connectionId: string,
  provider: string,
  syncRunId: string,
): Promise<PostSyncResult> {
  switch (provider) {
    case 'stripe':
      return runFinanceAgentServer(serviceClient, projectId, connectionId, syncRunId)
    case 'hubspot': {
      const { runSalesAgentServer } = await import('./agent-runner-providers.ts')
      return runSalesAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'asana': {
      const { runExecutionAgentServer } = await import('./agent-runner-providers.ts')
      return runExecutionAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'google_calendar': {
      const { runCalendarAgentServer } = await import('./agent-runner-providers.ts')
      return runCalendarAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'holded': {
      const { runHoldedFinanceAgentServer } = await import('./agent-runner-providers.ts')
      return runHoldedFinanceAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'trello': {
      const { runTrelloExecutionAgentServer } = await import('./agent-runner-providers.ts')
      return runTrelloExecutionAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'slack': {
      const { runSlackCommunicationAgentServer } = await import('./agent-runner-providers.ts')
      return runSlackCommunicationAgentServer(serviceClient, projectId, syncRunId)
    }
    case 'notion': {
      const { runNotionKnowledgeAgentServer } = await import('./agent-runner-providers.ts')
      return runNotionKnowledgeAgentServer(serviceClient, projectId, syncRunId)
    }
    default:
      return { insights_emitted: 0, insights_skipped: 0, agent_type: provider }
  }
}

async function runFinanceAgentServer(
  client: SupabaseClient,
  projectId: string,
  connectionId: string,
  syncRunId: string,
): Promise<PostSyncResult> {
  // 1. Read subscription entities
  const { data: rawEntities } = await client
    .from('integration_entities')
    .select('id, confidence, payload')
    .eq('project_id', projectId)
    .eq('entity_type', 'subscription')
    .eq('provider', 'stripe')
    .neq('status', 'rejected')

  const entities: SubscriptionEntity[] = (rawEntities ?? []).map(r => ({
    id: r.id,
    confidence: r.confidence,
    payload: {
      status: (r.payload as Record<string, unknown>)['status'] as string ?? 'cancelled',
      mrr_contribution: typeof (r.payload as Record<string, unknown>)['mrr_contribution'] === 'number'
        ? (r.payload as Record<string, unknown>)['mrr_contribution'] as number : 0,
      customer_id: typeof (r.payload as Record<string, unknown>)['customer_id'] === 'string'
        ? (r.payload as Record<string, unknown>)['customer_id'] as string : undefined,
      cancel_at: (r.payload as Record<string, unknown>)['cancel_at'] as string | undefined,
      trial_end: (r.payload as Record<string, unknown>)['trial_end'] as string | undefined,
    },
  }))

  if (entities.length === 0) {
    return { insights_emitted: 0, insights_skipped: 0, agent_type: 'finance' }
  }

  // 2. Compute insights (pure) — 5 insight generators
  const candidates = [
    computeCashFlowSignal(entities),
    computeRevenueConcentration(entities),
    computeChurnRisk(entities),
    computeARPU(entities),
    computeRevenueAtRisk(entities),
  ].filter((x): x is InsightData => x !== null)
    .filter(x => !(x.confidence < 0.5 && x.entity_ids.length === 0))

  if (candidates.length === 0) {
    return { insights_emitted: 0, insights_skipped: 0, agent_type: 'finance' }
  }

  // 3. Anti-spam: check existing insights
  const now = new Date().toISOString()
  const candidateTypes = candidates.map(c => c.insight_type)

  const { data: existing } = await client
    .from('integration_insights')
    .select('id, insight_type, payload')
    .eq('project_id', projectId)
    .eq('agent_type', 'finance')
    .in('insight_type', candidateTypes)
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  const latestByType = new Map<string, { id: string; payload: Record<string, unknown> | null }>()
  for (const row of existing ?? []) {
    if (!latestByType.has(row.insight_type)) {
      latestByType.set(row.insight_type, { id: row.id, payload: row.payload as Record<string, unknown> | null })
    }
  }

  const toEmit: InsightData[] = []
  const idsToExpire: string[] = []

  for (const candidate of candidates) {
    const prev = latestByType.get(candidate.insight_type)
    if (!prev) {
      toEmit.push(candidate)
    } else {
      const prevValue = extractSignalValue(prev.payload)
      if (prevValue !== null && hasSignificantValueChange(candidate.signal.current_value, prevValue)) {
        toEmit.push(candidate)
        idsToExpire.push(prev.id)
      }
    }
  }

  if (toEmit.length === 0) {
    return { insights_emitted: 0, insights_skipped: candidates.length, agent_type: 'finance' }
  }

  // Soft-expire replaced insights
  if (idsToExpire.length > 0) {
    await client
      .from('integration_insights')
      .update({ expires_at: now })
      .in('id', idsToExpire)
  }

  // 4. Write new insights
  const generatedAt = new Date()
  const rows = toEmit.map(insight => {
    const expiresAt = new Date(generatedAt.getTime() + insight.expires_hours * 3_600_000)
    return {
      sync_run_id: syncRunId,
      project_id: projectId,
      agent_type: 'finance',
      insight_type: insight.insight_type,
      entity_ids: insight.entity_ids,
      payload: { signal: insight.signal, content: insight.content },
      confidence: insight.confidence,
      source_timestamp: generatedAt.toISOString(),
      generated_at: generatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status: 'active',
      evidence_type: insight.evidence_type,
      sources_used: insight.sources_used,
      sources_discarded: insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
    }
  })

  await client.from('integration_insights').insert(rows)

  console.log(`[agent-runner] Finance Agent: ${toEmit.length} insights emitted for project ${projectId}`)

  return {
    insights_emitted: toEmit.length,
    insights_skipped: candidates.length - toEmit.length,
    agent_type: 'finance',
  }
}
