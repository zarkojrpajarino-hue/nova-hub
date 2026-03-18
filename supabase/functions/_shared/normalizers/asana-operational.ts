/**
 * Normalizador operativo para Asana — I15.33 + I15.38
 *
 * Función pura: raw Asana Task → ContractEntity (INTEGRATION_DATA_CONTRACT.md §3-§4)
 * Sin efectos secundarios. Sin llamadas a DB ni a APIs externas.
 *
 * Estado binario: open | completed — Asana no tiene estados intermedios reales.
 * in_progress vive en secciones (heurística frágil, no incluida en v1).
 *
 * Hard reject: external_id (gid) ausente → null.
 * No hay hard reject en task_name — su ausencia penaliza schema_score hasta rechazo.
 *
 * schema_score: 2 required (task_name, status) — entidad más simple que deal/subscription.
 * Rechazo si < 0.5 (= si falta alguno de los dos campos).
 *
 * Write target: tabla `tasks` (WRITE-THROUGH).
 * Prerrequisito de I15.38: columnas external_provider, external_id, external_sync_at
 * en la tabla tasks — migración no incluida aquí (scope del normalizador, no del contrato).
 *
 * PROVIDER_SCORE = 0.8 — heurística provisional v1.
 *
 * v1: solo normalizeAsanaTask.
 * Futuro: normalizeAsanaProject (cuando BLOQUE D defina uso de project como contenedor).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos del contrato
// ──────────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'open' | 'completed'

export interface TaskPayload {
  task_name:            string      // R — name del task en Asana
  status:               TaskStatus  // R — open | completed
  assignee_external_id?: string     // O — GID del usuario asignado en Asana
  due_date?:            string      // O — ISO 8601 date (due_at preferido; due_on fallback)
  completed_at?:        string      // O — ISO 8601 — cuándo se completó
  section?:             string      // O — nombre de la sección/columna en Asana
  project_external_id?: string      // O — GID del proyecto Asana al que pertenece
}

export interface SyncContext {
  connection_id:    string
  sync_run_id:      string
  project_id:       string
  source_timestamp: string  // ISO 8601 — cuándo corrió el sync
}

export interface ContractEntity {
  provider:         'asana'
  entity_type:      'task'
  external_id:      string
  project_id:       string
  occurred_at:      string       // ISO 8601 — created_at del task
  source_timestamp: string
  synced_at:        string
  payload:          TaskPayload
  confidence:       number
  is_complete:      boolean
  missing_fields:   string[]
  sync_run_id:      string
  connection_id:    string
}

// ──────────────────────────────────────────────────────────────────────────────
// computeSchemaScore — 2 required fields (task_name, status)
//
// schema_score = válidos / 2
// Rechazo si < 0.5 (= 0/2 — ambos ausentes).
// Con 1/2 válido → score = 0.5 → pasa el umbral con confidence degradada.
// ──────────────────────────────────────────────────────────────────────────────

function computeSchemaScore(payload: TaskPayload): { score: number; missing: string[] } {
  const missing: string[] = []

  if (typeof payload.task_name !== 'string' || payload.task_name.length === 0) {
    missing.push('task_name')
  }

  const VALID_STATUSES: TaskStatus[] = ['open', 'completed']
  if (!VALID_STATUSES.includes(payload.status)) {
    missing.push('status')
  }

  const total = 2
  const valid = total - missing.length
  return { score: valid / total, missing }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeConfidence — fórmula §5 del contrato
// ──────────────────────────────────────────────────────────────────────────────

function computeConfidence(schema_score: number): number {
  const PROVIDER_SCORE = 0.8  // provisional v1
  const RECENCY_SCORE  = 1.0
  return (0.5 * schema_score) + (0.3 * PROVIDER_SCORE) + (0.2 * RECENCY_SCORE)
}

// ──────────────────────────────────────────────────────────────────────────────
// Tipo de entrada — campos mínimos de Asana Task API v1
// ──────────────────────────────────────────────────────────────────────────────

interface RawAsanaTask {
  gid:          string
  name:         string | null
  completed:    boolean
  created_at:   string | null  // ISO 8601
  completed_at: string | null  // ISO 8601 o null
  due_at:       string | null  // ISO 8601 con hora (preferido)
  due_on:       string | null  // YYYY-MM-DD sin hora (fallback)
  assignee: { gid: string } | null
  memberships?: Array<{
    section?: { gid: string; name: string } | null
  }>
  projects?: Array<{ gid: string }>
}

// ──────────────────────────────────────────────────────────────────────────────
// normalizeAsanaTask — función principal exportada
//
// Devuelve ContractEntity o null si:
//   - external_id (gid) ausente
//   - schema_score < 0.5 (ambos required ausentes)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizeAsanaTask(
  raw: RawAsanaTask,
  ctx: SyncContext
): ContractEntity | null {
  // Hard guard: external_id requerido
  if (!raw.gid) return null

  // Status: binario. completed=true → 'completed', todo lo demás → 'open'
  const status: TaskStatus = raw.completed === true ? 'completed' : 'open'

  // due_date: preferir due_at (con hora) sobre due_on (solo fecha)
  const dueDate = raw.due_at ?? raw.due_on ?? undefined

  // section: primer membership con sección definida
  const section = raw.memberships?.find((m) => m.section?.name)?.section?.name ?? undefined

  // project_external_id: primer proyecto
  const projectExternalId = raw.projects?.[0]?.gid ?? undefined

  const payload: TaskPayload = {
    task_name:  raw.name ?? '',
    status,
    ...(raw.assignee?.gid    && { assignee_external_id: raw.assignee.gid }),
    ...(dueDate              && { due_date:              dueDate }),
    ...(raw.completed_at     && { completed_at:          raw.completed_at }),
    ...(section              && { section }),
    ...(projectExternalId    && { project_external_id:   projectExternalId }),
  }

  const { score: schemaScore, missing } = computeSchemaScore(payload)

  if (schemaScore < 0.5) return null

  const confidence = computeConfidence(schemaScore)

  // occurred_at: created_at del task; fallback a source_timestamp
  const occurredAt = raw.created_at ?? ctx.source_timestamp

  return {
    provider:         'asana',
    entity_type:      'task',
    external_id:      raw.gid,
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
