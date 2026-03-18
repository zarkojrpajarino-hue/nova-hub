/**
 * execution-agent — I15.80 (pure computation layer)
 *
 * Funciones puras: dada una lista de integration_entities de tipo 'task',
 * computa AgentInsight siguiendo AGENTS_CONTRACT.md.
 *
 * Sin efectos secundarios. Sin llamadas a DB.
 *
 * v1 insight_types disponibles con datos Asana:
 *   - task_completion_rate — % tareas completadas (min 5 tasks, §5)
 *   - overdue_ratio        — proporción de tareas vencidas sobre activas con fecha (min 3 open con due_date)
 *
 * Deferred (requieren datos que no existen aún en v1):
 *   - execution_drop    — caída vs período anterior (requiere 2+ syncs históricos)
 *   - milestone_at_risk — requiere entidades de tipo 'milestone' o 'project_item' (no en scope)
 *
 * Fuente de datos: integration_entities[entity_type='task', provider='asana']
 * Destino: integration_insights (NO motor tables en v1 — Execution Agent escribe
 *          execution_health al Phase Engine en v2, AGENTS_CONTRACT.md §3)
 */

export type ExecutionInsightType = 'task_completion_rate' | 'overdue_ratio'

export interface TaskEntityRow {
  id: string
  confidence: number
  payload: {
    task_name:            string
    status:               'open' | 'completed'
    due_date?:            string   // ISO date YYYY-MM-DD (o ISO timestamp)
    completed_at?:        string
    section?:             string
    project_external_id?: string
    assignee_external_id?: string
  }
}

export interface ExecutionInsightData {
  insight_type: ExecutionInsightType
  /** AGENTS_CONTRACT.md §4.2 */
  signal: {
    metric_name:  string
    current_value: number
    period_days:  number    // 0 = snapshot
    data_points:  number
  }
  /** AGENTS_CONTRACT.md §4.3 */
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence:         number
  entity_ids:         string[]
  include_in_context: boolean
  /** En horas — el servicio calcula expires_at = generated_at + expires_hours */
  expires_hours:      number
}

// ──────────────────────────────────────────────────────────────────────────────
// computeTaskCompletionRate
//
// % de tareas completadas sobre el total del workspace.
// Min: 5 tareas (§5 — snapshot con volumen mínimo).
// expires_at: 48h (§10 — severity='info'|'attention'|'warning').
// ──────────────────────────────────────────────────────────────────────────────

export function computeTaskCompletionRate(
  entities: TaskEntityRow[],
): ExecutionInsightData | null {
  // §5 min data_points
  if (entities.length < 5) return null

  const avgConf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length
  const completeness = Math.min(1.0, entities.length / 5)
  const confidence = avgConf * completeness

  if (confidence < 0.5) return null

  const completed = entities.filter((e) => e.payload.status === 'completed')
  const completionPct = Math.round((completed.length / entities.length) * 100)

  const severity =
    completionPct >= 60 ? 'info' :
    completionPct >= 30 ? 'attention' :
    'warning'

  return {
    insight_type: 'task_completion_rate',
    signal: {
      metric_name:   'task_completion_pct',
      current_value: completionPct,
      period_days:   0,  // snapshot — no hay ventana histórica en v1
      data_points:   entities.length,
    },
    content: {
      summary: `${completionPct}% de tareas completadas (${completed.length}/${entities.length}).`,
      implication:
        completionPct >= 60
          ? 'Ejecución en buen estado. La mayoría de tareas importadas de Asana están completadas.'
          : completionPct >= 30
            ? 'Más de la mitad de las tareas están abiertas. Revisa si hay bloqueos o prioridades mal definidas.'
            : 'Tasa de completado baja. La mayor parte del trabajo importado de Asana está sin resolver.',
      severity,
      action_hint:
        completionPct < 30
          ? 'Identifica las tareas bloqueadas o sin responsable y actualiza su estado en Asana.'
          : undefined,
    },
    confidence,
    entity_ids:         entities.map((e) => e.id),
    include_in_context: completionPct < 60,  // solo relevante si hay problema
    expires_hours:      48,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeOverdueRatio
//
// Proporción de tareas abiertas vencidas (due_date < hoy) sobre activas con fecha.
// Min: 3 tareas open con due_date para que el ratio tenga significado.
// Solo emite si hay al menos 1 tarea vencida (ratio=0 → silencio).
// expires_at: 24h (§10 — severity='attention'|'warning').
// ──────────────────────────────────────────────────────────────────────────────

export function computeOverdueRatio(
  entities: TaskEntityRow[],
): ExecutionInsightData | null {
  const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD

  // Solo tareas abiertas con fecha límite definida
  const openWithDue = entities.filter(
    (e) => e.payload.status === 'open' && e.payload.due_date,
  )

  // §5 — min 3 para que el ratio sea estadísticamente significativo
  if (openWithDue.length < 3) return null

  // Normalizar due_date: tomar solo la parte de fecha (YYYY-MM-DD)
  const overdue = openWithDue.filter((e) => {
    const dueDay = e.payload.due_date!.split('T')[0]
    return dueDay < today
  })

  // Silencio si no hay vencidas — ejecución en buen estado
  if (overdue.length === 0) return null

  const overdueRatio = Math.round((overdue.length / openWithDue.length) * 100)

  const avgConf = openWithDue.reduce((s, e) => s + e.confidence, 0) / openWithDue.length
  const completeness = Math.min(1.0, openWithDue.length / 3)
  const confidence = avgConf * completeness

  if (confidence < 0.5) return null

  const severity = overdueRatio > 50 ? 'warning' : overdueRatio > 20 ? 'attention' : 'info'

  return {
    insight_type: 'overdue_ratio',
    signal: {
      metric_name:   'overdue_task_pct',
      current_value: overdueRatio,
      period_days:   0,
      data_points:   openWithDue.length,
    },
    content: {
      summary: `${overdueRatio}% de tareas activas vencidas (${overdue.length}/${openWithDue.length} con fecha límite).`,
      implication:
        overdueRatio > 50
          ? 'Más de la mitad del trabajo activo con fecha límite está vencido. Riesgo de bloqueo operativo.'
          : overdueRatio > 20
            ? 'Hay tareas vencidas significativas. Pueden estar bloqueando otras o sin responsable.'
            : 'Hay tareas vencidas puntuales. Revisa si son bloqueadas o requieren re-priorización.',
      severity,
      action_hint:
        overdueRatio > 20
          ? 'Revisa las tareas vencidas en Asana y actualiza su estado o fecha límite.'
          : undefined,
    },
    confidence,
    entity_ids:         overdue.map((e) => e.id),
    include_in_context: overdueRatio > 20,
    expires_hours:      24,
  }
}

/** Ejecuta todos los cómputos del Execution Agent v1 sobre un conjunto de entidades. */
export function runExecutionAgentLocal(
  entities: TaskEntityRow[],
): ExecutionInsightData[] {
  return [
    computeTaskCompletionRate(entities),
    computeOverdueRatio(entities),
  ].filter((x): x is ExecutionInsightData => x !== null)
}
