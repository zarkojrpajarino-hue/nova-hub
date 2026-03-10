-- =============================================================================
-- FASE 2 — ENGINE TABLES
-- Migración construida task a task según decisiones de Fase 1.
-- Aplicar DESPUÉS de 20260224000001_complete_fresh_schema.sql
-- =============================================================================

-- =============================================================================
-- CLEANUP: Drop placeholder tables created by migration 00001.
-- Migration 00001 included early-draft Fase 2 tables with incompatible schemas.
-- These DROP statements remove them before creating the final versions below.
-- CASCADE handles any FK dependencies between these tables.
-- =============================================================================
DROP TABLE IF EXISTS strategic_cycles            CASCADE;
DROP TABLE IF EXISTS project_function_coverage   CASCADE;
DROP TABLE IF EXISTS strategic_blocks            CASCADE;
DROP TABLE IF EXISTS decision_events             CASCADE;
DROP TABLE IF EXISTS project_protocols           CASCADE;
DROP TABLE IF EXISTS benchmarks                  CASCADE;
DROP TABLE IF EXISTS project_risk_score          CASCADE;
DROP TABLE IF EXISTS project_economic_profile_history CASCADE;
DROP TABLE IF EXISTS project_economic_profile    CASCADE;
DROP TABLE IF EXISTS project_viability_state     CASCADE;
DROP TABLE IF EXISTS project_probability_history CASCADE;
DROP TABLE IF EXISTS project_probability         CASCADE;
DROP TABLE IF EXISTS project_phase_state         CASCADE;
-- Drop any stale indexes from 00001 that referenced these tables
DROP INDEX IF EXISTS idx_project_phase_state_project;
DROP INDEX IF EXISTS idx_project_probability_project;
DROP INDEX IF EXISTS idx_prob_history_project_time;
DROP INDEX IF EXISTS idx_viability_state_project;
DROP INDEX IF EXISTS idx_economic_profile_project;
DROP INDEX IF EXISTS idx_econ_history_project_time;
DROP INDEX IF EXISTS idx_risk_score_project;
DROP INDEX IF EXISTS idx_function_coverage_project;
DROP INDEX IF EXISTS idx_decision_events_project_time;
DROP INDEX IF EXISTS idx_decision_events_type;
DROP INDEX IF EXISTS idx_strategic_blocks_project;
DROP INDEX IF EXISTS idx_strategic_blocks_open;
DROP INDEX IF EXISTS idx_project_protocols_project;
DROP INDEX IF EXISTS idx_project_protocols_active;
DROP INDEX IF EXISTS idx_strategic_cycles_project;
DROP INDEX IF EXISTS idx_benchmarks_category_segment;

-- =============================================================================
-- D2.21 — engine_versions
-- Debe existir antes que cualquier tabla con FK a engine_version.
-- =============================================================================

CREATE TABLE engine_versions (
  id           TEXT PRIMARY KEY,          -- "phase_v1.0", "probability_v1.0", etc.
  motor        TEXT NOT NULL              -- 'phase' | 'probability' | 'viability' | 'execution' | 'risk'
                 CHECK (motor IN ('phase', 'probability', 'viability', 'execution', 'risk')),
  deployed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed data v1 — ON CONFLICT DO NOTHING para idempotencia en re-ejecución
INSERT INTO engine_versions (id, motor, deployed_at, notes) VALUES
  ('phase_v1.0',       'phase',       NOW(), 'Fórmula inicial — F1.5/F1.6/F1.7'),
  ('probability_v1.0', 'probability', NOW(), 'Fórmula inicial — F1.4'),
  ('viability_v1.0',   'viability',   NOW(), 'Triggers iniciales — F1.10'),
  ('execution_v1.0',   'execution',   NOW(), 'Fórmula inicial — F1.1'),
  ('risk_v1.0',        'risk',        NOW(), 'Fórmula inicial — R1.1–R1.5')
ON CONFLICT (id) DO NOTHING;

-- Garantía de unicidad: solo 1 versión activa por motor en todo momento.
-- Cuando se deploya una nueva versión → SET is_active=FALSE en la anterior primero.
CREATE UNIQUE INDEX idx_engine_versions_one_active_per_motor
  ON engine_versions (motor)
  WHERE is_active = TRUE;

-- =============================================================================
-- D2.1 — project_phase_state
-- Estado actual de fase por proyecto. Una fila por proyecto.
-- Fuente de verdad del Phase Engine en tiempo real.
-- =============================================================================

CREATE TABLE project_phase_state (
  project_id            UUID        PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  current_phase         SMALLINT    NOT NULL CHECK (current_phase BETWEEN 1 AND 4),
  phase_score           NUMERIC(5,2) NOT NULL CHECK (phase_score BETWEEN 0 AND 100),
  hard_signal_met       BOOLEAN     NOT NULL DEFAULT FALSE,
  phase_status          TEXT        NOT NULL CHECK (phase_status IN ('healthy', 'friction', 'critical')),
  phase_entered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  phase_last_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_calculated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version        TEXT        NOT NULL REFERENCES engine_versions(id)
);

COMMENT ON TABLE project_phase_state IS
  'Estado actual de fase. Actualizado en cada recálculo. Una fila por proyecto.';
COMMENT ON COLUMN project_phase_state.phase_entered_at IS
  'Timestamp en que el proyecto entró en la fase actual. Usado para calcular weeks_in_phase en query.';
COMMENT ON COLUMN project_phase_state.phase_last_changed_at IS
  'Última vez que current_phase cambió (distinto de last_calculated_at que se actualiza siempre).';

-- =============================================================================
-- project_phase_history
-- Snapshot en cada recálculo programado o evento fuerte.
-- NO se inserta por cada acción de UI.
-- =============================================================================

CREATE TABLE project_phase_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase           SMALLINT    NOT NULL CHECK (phase BETWEEN 1 AND 4),
  phase_score     NUMERIC(5,2) NOT NULL CHECK (phase_score BETWEEN 0 AND 100),
  hard_signal_met BOOLEAN     NOT NULL,
  phase_status    TEXT        NOT NULL CHECK (phase_status IN ('healthy', 'friction', 'critical')),

  -- change_reason: solo se rellena cuando la fase cambió en este recálculo.
  -- NULL = recálculo sin cambio de fase (score evolucionó, fase igual).
  change_reason   TEXT        CHECK (change_reason IN ('threshold_met', 'acceleration_signal', 'regression')),

  -- trigger_source: qué disparó este recálculo.
  trigger_source  TEXT        NOT NULL CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression')),

  calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version  TEXT        NOT NULL REFERENCES engine_versions(id)
);

CREATE INDEX idx_phase_history_project_time
  ON project_phase_history (project_id, calculated_at DESC);

COMMENT ON TABLE project_phase_history IS
  'Snapshots del Phase Engine. Inserta en: weekly_job, acceleration_signal, regression. No en cada click de UI.';
COMMENT ON COLUMN project_phase_history.change_reason IS
  'NULL = recálculo sin cambio de fase. Relleno solo cuando current_phase cambió.';
COMMENT ON COLUMN project_phase_history.trigger_source IS
  'Por qué se disparó este recálculo: cron semanal, señal de aceleración, o regresión detectada.';

-- =============================================================================
-- D2.2 — project_probability
-- Estado actual del Probability Engine. Una fila por proyecto.
-- Los 5 inputs se persisten como snapshot de cálculo (no fuente de verdad).
-- =============================================================================

CREATE TABLE project_probability (
  project_id                  UUID        PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Score final
  probability_score           NUMERIC(5,2)
                                CHECK (probability_score BETWEEN 0 AND 100),

  -- Estado del motor (F1.4 + F1.13)
  -- 'inactive'      → <2 inputs con datos reales (Day 1 Problem)
  -- 'low_confidence'→ data_completeness_score < 50
  -- 'active'        → operando normalmente
  probability_status          TEXT        NOT NULL DEFAULT 'inactive'
                                CHECK (probability_status IN ('inactive', 'low_confidence', 'active')),

  -- Constraint: score NULL solo si inactive
  CONSTRAINT probability_null_only_if_inactive CHECK (
    (probability_status = 'inactive'  AND probability_score IS NULL)
    OR
    (probability_status != 'inactive' AND probability_score IS NOT NULL)
  ),

  -- 5 inputs (snapshot del momento de cálculo — no fuente de verdad)
  phase_score_input           NUMERIC(5,2) CHECK (phase_score_input BETWEEN 0 AND 100),
  execution_rate_input        NUMERIC(5,2) CHECK (execution_rate_input BETWEEN 0 AND 100),
  validation_strength_input   NUMERIC(5,2) CHECK (validation_strength_input BETWEEN 0 AND 100),
  revenue_momentum_input      NUMERIC(5,2) CHECK (revenue_momentum_input BETWEEN 0 AND 100),
  capacity_health_input       NUMERIC(5,2) CHECK (capacity_health_input BETWEEN 0 AND 100),

  -- Data completeness (F1.13)
  data_completeness_score     NUMERIC(5,2) NOT NULL DEFAULT 0
                                CHECK (data_completeness_score BETWEEN 0 AND 100),

  last_calculated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version              TEXT        NOT NULL REFERENCES engine_versions(id)
);

COMMENT ON TABLE project_probability IS
  'Estado actual del Probability Engine. Inputs guardados como snapshot para debugging y calibración.';
COMMENT ON COLUMN project_probability.probability_score IS
  'NULL solo si status=inactive. En low_confidence el score existe pero se etiqueta con advertencia.';
COMMENT ON COLUMN project_probability.phase_score_input IS
  'Snapshot del valor usado en el cálculo. No es la fuente de verdad — leer project_phase_state para valor actual.';

-- =============================================================================
-- D2.3 — project_probability_history
-- Snapshot en cada recálculo programado o evento fuerte.
-- Misma política que project_phase_history: weekly_job + acceleration + regression.
-- =============================================================================

CREATE TABLE project_probability_history (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  probability_score           NUMERIC(5,2) CHECK (probability_score BETWEEN 0 AND 100),
  probability_status          TEXT        NOT NULL
                                CHECK (probability_status IN ('inactive', 'low_confidence', 'active')),

  -- 5 inputs snapshot
  phase_score_input           NUMERIC(5,2) CHECK (phase_score_input BETWEEN 0 AND 100),
  execution_rate_input        NUMERIC(5,2) CHECK (execution_rate_input BETWEEN 0 AND 100),
  validation_strength_input   NUMERIC(5,2) CHECK (validation_strength_input BETWEEN 0 AND 100),
  revenue_momentum_input      NUMERIC(5,2) CHECK (revenue_momentum_input BETWEEN 0 AND 100),
  capacity_health_input       NUMERIC(5,2) CHECK (capacity_health_input BETWEEN 0 AND 100),

  data_completeness_score     NUMERIC(5,2) NOT NULL DEFAULT 0
                                CHECK (data_completeness_score BETWEEN 0 AND 100),

  trigger_source              TEXT        NOT NULL
                                CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression')),

  calculated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version              TEXT        NOT NULL REFERENCES engine_versions(id)
);

CREATE INDEX idx_probability_history_project_time
  ON project_probability_history (project_id, calculated_at DESC);

COMMENT ON TABLE project_probability_history IS
  'Snapshots del Probability Engine. Inserta en: weekly_job, acceleration, regression. Series temporales para calibración v2.';

-- =============================================================================
-- D2.4 — project_viability_state
-- Resumen del nivel de atención requerido por proyecto.
-- En v1: solo recomienda, no bloquea. Preparado para v2 con bloqueo.
-- =============================================================================

CREATE TABLE project_viability_state (
  project_id                UUID        PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Resumen de estado (semántica v1: badge + priorización, sin bloqueo)
  -- healthy:    0 triggers activos
  -- monitoring: ≥1 trigger activo, ninguno repetido ≥2 ciclos
  -- stagnation: mismo trigger activo ≥2 evaluaciones consecutivas
  -- critical:   ≥3 ciclos consecutivos O T2 (cash flow) con HIGH confidence (inmediato)
  viability_status          TEXT        NOT NULL DEFAULT 'healthy'
                              CHECK (viability_status IN ('healthy', 'monitoring', 'stagnation', 'critical')),

  -- Contadores para calcular status sin queries pesadas a viability_events
  active_trigger_count      INTEGER     NOT NULL DEFAULT 0 CHECK (active_trigger_count >= 0),
  trigger_consecutive_max   INTEGER     NOT NULL DEFAULT 0 CHECK (trigger_consecutive_max >= 0),
  top_trigger_consecutive   INTEGER     NOT NULL DEFAULT 0 CHECK (top_trigger_consecutive >= 0),

  -- Trigger más persistente o severo activo (para UI sin join)
  top_trigger_type          TEXT        CHECK (top_trigger_type IN (
                              'stagnation', 'margin_risk', 'overload', 'weak_validation'
                            )),

  -- T2 override: si TRUE → viability_status = 'critical' independientemente de contadores
  t2_cash_flow_active       BOOLEAN     NOT NULL DEFAULT FALSE,

  last_evaluated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version            TEXT        NOT NULL REFERENCES engine_versions(id)
);

COMMENT ON TABLE project_viability_state IS
  'Resumen del Viability Engine. v1: solo recomienda. v2: puede bloquear. Contadores desnormalizados para queries baratas.';
COMMENT ON COLUMN project_viability_state.trigger_consecutive_max IS
  'Máximo de semanas consecutivas que lleva activo cualquier trigger. Determina viability_status junto con t2_cash_flow_active.';
COMMENT ON COLUMN project_viability_state.t2_cash_flow_active IS
  'TRUE si T2 (cash_flow<0 ≥2m, HIGH confidence) está activo. Fuerza viability_status=critical inmediatamente.';
COMMENT ON COLUMN project_viability_state.top_trigger_type IS
  'Trigger más persistente o severo para mostrar en UI sin join a viability_events.';

-- =============================================================================
-- D2.5 — project_economic_profile
-- Perfil económico operativo. No duplica projects.model_type —
-- es snapshot versionable para motores + histórico de supuestos.
-- =============================================================================

CREATE TABLE project_economic_profile (
  project_id              UUID        PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Clasificación (snapshot para motores — fuente de verdad para engines)
  model_type              TEXT        NOT NULL
                            CHECK (model_type IN ('saas','service','physical','marketplace','agency','unknown')),
  pricing_model           TEXT        NOT NULL DEFAULT 'unknown'
                            CHECK (pricing_model IN ('subscription','usage','one_off','hybrid','unknown')),
  revenue_type            TEXT        NOT NULL DEFAULT 'mixed'
                            CHECK (revenue_type IN ('recurring','transactional','mixed')),

  -- Inputs económicos declarados / benchmarked / computed
  avg_ticket              NUMERIC(10,2)  NULL CHECK (avg_ticket > 0),
  sales_cycle_days        INTEGER        NULL CHECK (sales_cycle_days > 0),
  gross_margin_target     NUMERIC(5,2)   NULL CHECK (gross_margin_target BETWEEN 0 AND 100),
  cac_estimate            NUMERIC(10,2)  NULL CHECK (cac_estimate >= 0),

  -- R1.4 — RevenueConcentration input
  -- Porcentaje de revenue del cliente principal sobre el total (declarado por founder).
  -- NULL → RevenueConcentration no contribuye al RiskScore.
  top_client_revenue_percent  NUMERIC(5,2)   NULL CHECK (top_client_revenue_percent BETWEEN 0 AND 100),

  -- R1.1 — RunwayFactor input
  -- Cash disponible en caja al momento de la declaración.
  -- NULL → RunwayFactor no se calcula.
  cash_on_hand                NUMERIC(14,2)  NULL CHECK (cash_on_hand >= 0),
  cash_on_hand_updated_at     TIMESTAMPTZ    NULL,

  -- Origen de cada campo: JSONB { "avg_ticket": "declared", "sales_cycle_days": "benchmark", ... }
  -- Valores válidos por campo: 'declared' | 'benchmark' | 'computed'
  -- Controlado en app layer en v1.
  field_sources           JSONB          NOT NULL DEFAULT '{}',

  -- Confianza derivada (no declarada por founder)
  -- Regla: peso declared=1.0, computed=0.8, benchmark=0.5, missing=0.0
  -- AVG(pesos de campos presentes) × 100
  -- model_type/pricing_model/revenue_type siempre peso=1.0 (selección explícita)
  confidence_score        NUMERIC(5,2)   NOT NULL DEFAULT 0
                            CHECK (confidence_score BETWEEN 0 AND 100),
  confidence_level        TEXT           NOT NULL DEFAULT 'low'
                            CHECK (confidence_level IN ('low', 'medium', 'high')),
  -- ≥75 → high | 50–74 → medium | <50 → low

  last_updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  engine_version          TEXT           NOT NULL REFERENCES engine_versions(id)
);

COMMENT ON TABLE project_economic_profile IS
  'Perfil económico operativo. Snapshot versionable para motores. No reemplaza projects.model_type (UX rápida) — los motores usan este.';
COMMENT ON COLUMN project_economic_profile.field_sources IS
  'JSONB con origen de cada campo: {"avg_ticket":"declared","sales_cycle_days":"benchmark",...}. Valores: declared|benchmark|computed.';
COMMENT ON COLUMN project_economic_profile.confidence_score IS
  'Derivado automáticamente de field_sources. Nunca lo declara el founder. Pesos: declared=1.0, computed=0.8, benchmark=0.5, missing=0.0.';

-- =============================================================================
-- D2.6 — project_economic_profile_history
-- Event log de cambios (append-only). Solo inserta cuando cambia algo real.
-- NO inserta semanalmente — solo en cambios de founder o motor.
-- =============================================================================

CREATE TABLE project_economic_profile_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Qué cambió y por qué
  changed_fields    JSONB       NOT NULL,
  -- Estructura: { "avg_ticket": {"old": 500, "new": 750}, "model_type": {"old": "service", "new": "saas"} }

  change_reason     TEXT        NOT NULL
                      CHECK (change_reason IN ('founder_update', 'computed_update', 'confidence_updated', 'benchmark_sync')),

  -- engine_version aplica cuando el cambio lo generó un motor (no founder_update)
  engine_version    TEXT        REFERENCES engine_versions(id),

  -- Snapshot completo del perfil en el momento del cambio (para auditoría fácil)
  profile_snapshot  JSONB       NOT NULL DEFAULT '{}',

  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Umbral de inserción: confidence_score solo genera history si cambia ≥5 puntos (evitar ruido)
-- Esto se controla en la lógica de la edge function, no en DB constraint.

CREATE INDEX idx_economic_history_project_time
  ON project_economic_profile_history (project_id, changed_at DESC);

COMMENT ON TABLE project_economic_profile_history IS
  'Event log append-only. Inserta solo cuando cambia ≥1 campo relevante o confidence_score cambia ≥5 puntos.';
COMMENT ON COLUMN project_economic_profile_history.changed_fields IS
  'JSONB con old/new por campo modificado. Estructura: {"campo": {"old": valor_anterior, "new": valor_nuevo}}.';
COMMENT ON COLUMN project_economic_profile_history.profile_snapshot IS
  'Snapshot completo del perfil en el momento del cambio para facilitar auditoría sin reconstruir desde history.';

-- =============================================================================
-- D2.22 — project_strategy_current
-- Hipótesis estratégica actual del proyecto.
-- Fuente de verdad para D5 de data_completeness_score (F1.13):
--   segment_text, problem_text, value_prop_text — cada uno ≥10 chars para contar.
-- NO tiene engine_version: es datos del founder, no output de motor.
-- =============================================================================

CREATE TABLE project_strategy_current (
  project_id        UUID        PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Hipótesis estratégica actual (mínimo 10 chars por campo para contar en D5)
  segment_text      TEXT,
  problem_text      TEXT,
  value_prop_text   TEXT,

  -- version_number: se incrementa en cada cambio sustantivo (pivot tracking v2)
  version_number    INTEGER     NOT NULL DEFAULT 1 CHECK (version_number >= 1),

  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE project_strategy_current IS
  'Hipótesis estratégica actual. Fuente de verdad para data_completeness_score D5. Un pivot = nueva versión en strategic_model_versions (D2.20).';
COMMENT ON COLUMN project_strategy_current.segment_text IS
  'Segmento objetivo. Necesita ≥10 caracteres para contar en data_completeness_score D5 (F1.13).';
COMMENT ON COLUMN project_strategy_current.problem_text IS
  'Problema que resuelve. Necesita ≥10 caracteres para contar en data_completeness_score D5 (F1.13).';
COMMENT ON COLUMN project_strategy_current.value_prop_text IS
  'Propuesta de valor. Necesita ≥10 caracteres para contar en data_completeness_score D5 (F1.13).';

-- =============================================================================
-- D2.23 — project_functions
-- 3 funciones críticas fijas por proyecto: demand, delivery, cash.
-- Creadas automáticamente por trigger al insertar en projects.
-- Fuente de verdad para Function Coverage (F1.11) y BottleneckSeverity (R1.5).
-- NOTA: documented_process_id FK a process_artifacts se añade tras crear D2.24
--       para resolver la dependencia circular entre ambas tablas.
-- =============================================================================

CREATE TABLE project_functions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  function_type         TEXT        NOT NULL
                          CHECK (function_type IN ('demand', 'delivery', 'cash')),

  -- Owner de esta función (NULL = sin responsable → señal de bloqueo)
  owner_user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Proceso documentado principal (FK añadida vía ALTER después de D2.24)
  documented_process_id UUID        NULL,

  -- Invariante: exactamente 1 fila por tipo por proyecto
  UNIQUE (project_id, function_type),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE project_functions IS
  '3 funciones críticas fijas por proyecto (demand, delivery, cash). Creadas por trigger al insertar proyecto. No configurables por founder en v1.';
COMMENT ON COLUMN project_functions.owner_user_id IS
  'NULL = función sin responsable. Condición de bloqueo para coverage_score y block_type=function_no_owner en strategic_blocks.';
COMMENT ON COLUMN project_functions.documented_process_id IS
  'FK a process_artifacts(id) — proceso principal documentado para esta función. Añadida vía ALTER después de crear process_artifacts.';

-- NOTA: La inicialización completa del proyecto (project_functions incluida)
-- se realiza en fn_initialize_project_data() definida después de que todas
-- las tablas dependientes existan en esta migración. Ver sección
-- "TRIGGER DE INICIALIZACIÓN DE PROYECTO" más adelante.

-- =============================================================================
-- D2.24 — process_artifacts
-- Procesos documentados por función crítica.
-- Fuente para documented_process_exists (F1.11):
--   checklist_items_count ≥ 5 AND last_used_at within ventana por fase.
-- =============================================================================

CREATE TABLE process_artifacts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Función crítica que cubre este proceso
  function_type         TEXT        NOT NULL
                          CHECK (function_type IN ('demand', 'delivery', 'cash')),

  title                 TEXT        NOT NULL,

  -- Para documented_process_exists: necesita ≥5 items para contar
  checklist_items_count INTEGER     NOT NULL DEFAULT 0
                          CHECK (checklist_items_count >= 0),

  -- Última vez que se marcó ≥1 item en ejecución real (no solo creación del doc).
  -- documented_process_exists usa: within 60d si phase ≤ 2, within 30d si phase > 2.
  last_used_at          TIMESTAMPTZ NULL,

  -- Referencia opcional a documento externo (URL, doc id, etc.)
  link_or_doc_id        TEXT        NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_process_artifacts_project_function
  ON process_artifacts (project_id, function_type);

COMMENT ON TABLE process_artifacts IS
  'Procesos documentados por función crítica. documented_process_exists = TRUE si checklist_items_count ≥ 5 AND last_used_at dentro de ventana según fase.';
COMMENT ON COLUMN process_artifacts.checklist_items_count IS
  'Número de items del checklist. Mínimo 5 para que documented_process_exists sea TRUE (F1.11).';
COMMENT ON COLUMN process_artifacts.last_used_at IS
  'Última ejecución real (≥1 item marcado). Ventana: 60 días si phase ≤ 2, 30 días si phase > 2.';

-- Resolución de dependencia circular D2.23 ↔ D2.24:
-- project_functions.documented_process_id → process_artifacts.id
-- Se añade aquí, después de crear ambas tablas.
ALTER TABLE project_functions
  ADD CONSTRAINT fk_project_functions_documented_process
  FOREIGN KEY (documented_process_id)
  REFERENCES process_artifacts(id)
  ON DELETE SET NULL;

-- =============================================================================
-- D2.10 — strategic_blocks
-- Fuente única de verdad de bloqueos activos por proyecto.
-- Alimenta BottleneckSeverity (R1.5). Una tarea está bloqueada si existe
-- un registro activo con block_type='task_blocked' para ese task_id.
-- No existe tasks.is_blocked — esta tabla es la autoridad.
-- Aplica DESPUÉS de D2.23 (project_functions) para poder usar la FK.
-- =============================================================================

CREATE TABLE strategic_blocks (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Categoría del bloqueo (ENUM fijo v1 — con escape hatch 'other')
  block_type          TEXT          NOT NULL
                        CHECK (block_type IN (
                          'task_blocked',       -- tarea específica bloqueada (manual)
                          'function_no_owner',  -- función crítica sin owner (engine o manual)
                          'execution_drop',     -- caída de execution rate detectada por engine
                          'cash_bottleneck',    -- bloqueo de flujo de caja
                          'other'               -- escape hatch controlado
                        )),

  -- Quién generó el bloqueo
  origin              TEXT          NOT NULL
                        CHECK (origin IN ('manual', 'engine')),

  -- Referencias a entidades bloqueadas (nullable — depende del block_type)
  -- function_id: se usa en 'function_no_owner'
  -- task_id:     se usa en 'task_blocked'
  function_id         UUID          REFERENCES project_functions(id) ON DELETE SET NULL,
  task_id             UUID          REFERENCES tasks(id) ON DELETE SET NULL,

  -- Descripción legible (para UI y auditoría)
  description         TEXT,

  -- ============================================================
  -- Severidad calculada (persistida — actualizada por cron semanal)
  -- Fórmula F1.7: impact_weight = (funcion_critica?40:20) + MIN(40, weeks×10) + execution_penalty
  -- ============================================================
  impact_weight       NUMERIC(5,2)  NOT NULL DEFAULT 0
                        CHECK (impact_weight BETWEEN 0 AND 100),
  weeks_active        INTEGER       NOT NULL DEFAULT 0
                        CHECK (weeks_active >= 0),
  last_evaluated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Versión del engine que calculó el último impact_weight.
  -- NULL hasta la primera evaluación por cron.
  -- Se rellena incluso para bloques manuales (auditoría de severidad).
  engine_version      TEXT          REFERENCES engine_versions(id),

  -- ============================================================
  -- Estado y ciclo de vida
  -- ============================================================
  status              TEXT          NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'monitoring', 'resolved')),

  first_detected_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ   NULL,

  -- Cuántas veces se reabrió dentro de ventana 7 días desde resolved_at
  reopen_count        INTEGER       NOT NULL DEFAULT 0
                        CHECK (reopen_count >= 0),

  -- Quién creó el bloque (principalmente relevante cuando origin = 'manual')
  created_by          UUID          REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índice principal para BottleneckSeverity:
-- Bloques activos por proyecto, ordenados por severidad descendente
CREATE INDEX idx_strategic_blocks_project_active
  ON strategic_blocks (project_id, status, impact_weight DESC)
  WHERE resolved_at IS NULL;

-- Índice para badge en task view: "¿está esta tarea bloqueada?"
CREATE INDEX idx_strategic_blocks_task
  ON strategic_blocks (task_id)
  WHERE task_id IS NOT NULL AND resolved_at IS NULL;

COMMENT ON TABLE strategic_blocks IS
  'Fuente única de verdad de bloqueos activos. Una tarea está bloqueada si existe registro activo con block_type=task_blocked. Alimenta BottleneckSeverity (R1.5).';
COMMENT ON COLUMN strategic_blocks.impact_weight IS
  'Calculado por cron semanal con fórmula F1.7. Persistido para queries rápidas en BottleneckSeverity. DEFAULT 0 hasta primera evaluación.';
COMMENT ON COLUMN strategic_blocks.engine_version IS
  'Versión que calculó el último impact_weight. NULL hasta primera evaluación por cron. Se rellena también para bloques manuales.';
COMMENT ON COLUMN strategic_blocks.reopen_count IS
  'Se incrementa cuando el bloque se reactiva dentro de 7 días de su resolución. Si >7 días, se crea nuevo bloque con nuevo id.';
COMMENT ON COLUMN strategic_blocks.task_id IS
  'Referencia a la tarea bloqueada. Usado en block_type=task_blocked. La UI consulta esta tabla para mostrar badge de bloqueo en tasks.';
COMMENT ON COLUMN strategic_blocks.function_id IS
  'Referencia a la función sin cobertura. Usado principalmente en block_type=function_no_owner.';

-- =============================================================================
-- D2.7 — project_risk_score
-- Estado actual del Risk Score por proyecto. Una fila por proyecto.
-- 5 inputs con redistribución proporcional de pesos cuando alguno es NULL.
-- Requiere ≥3 inputs con valor para calcular; si <3 → risk_status='insufficient_data'.
-- =============================================================================

CREATE TABLE project_risk_score (
  project_id                    UUID          PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Score final y clasificación
  -- NULL solo si risk_status = 'insufficient_data'
  risk_score                    NUMERIC(5,2)  NULL
                                  CHECK (risk_score BETWEEN 0 AND 100),

  -- Umbrales: <30 → low | 30–54.99 → medium | 55–79.99 → high | ≥80 → critical
  risk_level                    TEXT          NOT NULL DEFAULT 'low'
                                  CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Estado del motor:
  -- 'active'            → ≥3 inputs disponibles, score calculado
  -- 'low_confidence'    → ≥3 inputs pero data_completeness_score < 50
  -- 'insufficient_data' → <3 inputs con valor, score NULL
  risk_status                   TEXT          NOT NULL DEFAULT 'insufficient_data'
                                  CHECK (risk_status IN ('active', 'low_confidence', 'insufficient_data')),

  -- Constraint: score NULL solo si insufficient_data
  CONSTRAINT risk_null_only_if_insufficient CHECK (
    (risk_status = 'insufficient_data' AND risk_score IS NULL)
    OR
    (risk_status != 'insufficient_data' AND risk_score IS NOT NULL)
  ),

  -- ============================================================
  -- 5 inputs snapshot (valores usados en el cálculo — no fuente de verdad)
  -- NULL cuando el input no pudo calcularse (ver R1.1–R1.5 para condiciones)
  -- ============================================================
  runway_factor_input           NUMERIC(5,2)  NULL CHECK (runway_factor_input           BETWEEN 0 AND 100),
  revenue_concentration_input   NUMERIC(5,2)  NULL CHECK (revenue_concentration_input   BETWEEN 0 AND 100),
  execution_drop_input          NUMERIC(5,2)  NULL CHECK (execution_drop_input          BETWEEN 0 AND 100),
  validation_weakness_input     NUMERIC(5,2)  NULL CHECK (validation_weakness_input     BETWEEN 0 AND 100),
  bottleneck_severity_input     NUMERIC(5,2)  NULL CHECK (bottleneck_severity_input     BETWEEN 0 AND 100),

  -- Cuántos de los 5 inputs tenían valor en este cálculo (para auditoría)
  inputs_available              SMALLINT      NOT NULL DEFAULT 0
                                  CHECK (inputs_available BETWEEN 0 AND 5),

  -- Data completeness (F1.13) — si < 50 → risk_status = 'low_confidence'
  data_completeness_score       NUMERIC(5,2)  NOT NULL DEFAULT 0
                                  CHECK (data_completeness_score BETWEEN 0 AND 100),

  last_calculated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  engine_version                TEXT          NOT NULL REFERENCES engine_versions(id)
);

COMMENT ON TABLE project_risk_score IS
  'Estado actual del Risk Score. 5 inputs con redistribución proporcional cuando alguno es NULL. Requiere ≥3 inputs para calcular.';
COMMENT ON COLUMN project_risk_score.risk_level IS
  'Derivado del score: <30→low | 30–54.99→medium | 55–79.99→high | ≥80→critical. Recalibrar en v2 con distribuciones reales.';
COMMENT ON COLUMN project_risk_score.risk_status IS
  'active: score calculado con confianza. low_confidence: data_completeness<50. insufficient_data: <3 inputs disponibles, score=NULL.';
COMMENT ON COLUMN project_risk_score.inputs_available IS
  'Número de inputs (0–5) que tenían valor en el último cálculo. Útil para auditoría y UI (mostrar cuántos datos faltan).';
COMMENT ON COLUMN project_risk_score.runway_factor_input IS
  'Snapshot del RunwayFactor usado (R1.1). NULL si cash_on_hand no declarado o sin ≥2 meses de datos de costes.';
COMMENT ON COLUMN project_risk_score.revenue_concentration_input IS
  'Snapshot del RevenueConcentration usado (R1.4). NULL si top_client_revenue_percent no declarado.';
COMMENT ON COLUMN project_risk_score.execution_drop_input IS
  'Snapshot del ExecutionDrop usado (R1.2). NULL si <6 semanas de historial de execution_rate.';
COMMENT ON COLUMN project_risk_score.validation_weakness_input IS
  'Snapshot del ValidationWeakness usado (R1.3). NULL si validation_strength no disponible.';
COMMENT ON COLUMN project_risk_score.bottleneck_severity_input IS
  'Snapshot del BottleneckSeverity usado (R1.5). 0 si no hay bloques activos (nunca NULL en v1).';

-- =============================================================================
-- project_risk_score_history
-- Snapshot en cada recálculo programado o evento fuerte.
-- trigger_source = 'block_event' cuando un bloque crítico aparece o desaparece.
-- =============================================================================

CREATE TABLE project_risk_score_history (
  id                            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                    UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  risk_score                    NUMERIC(5,2)  NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level                    TEXT          NOT NULL
                                  CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_status                   TEXT          NOT NULL
                                  CHECK (risk_status IN ('active', 'low_confidence', 'insufficient_data')),

  -- 5 inputs snapshot
  runway_factor_input           NUMERIC(5,2)  NULL CHECK (runway_factor_input           BETWEEN 0 AND 100),
  revenue_concentration_input   NUMERIC(5,2)  NULL CHECK (revenue_concentration_input   BETWEEN 0 AND 100),
  execution_drop_input          NUMERIC(5,2)  NULL CHECK (execution_drop_input          BETWEEN 0 AND 100),
  validation_weakness_input     NUMERIC(5,2)  NULL CHECK (validation_weakness_input     BETWEEN 0 AND 100),
  bottleneck_severity_input     NUMERIC(5,2)  NULL CHECK (bottleneck_severity_input     BETWEEN 0 AND 100),

  inputs_available              SMALLINT      NOT NULL DEFAULT 0
                                  CHECK (inputs_available BETWEEN 0 AND 5),
  data_completeness_score       NUMERIC(5,2)  NOT NULL DEFAULT 0
                                  CHECK (data_completeness_score BETWEEN 0 AND 100),

  -- Qué disparó este recálculo
  -- 'weekly_job'   → cron semanal estándar
  -- 'block_event'  → un strategic_block crítico apareció o fue resuelto
  trigger_source                TEXT          NOT NULL
                                  CHECK (trigger_source IN ('weekly_job', 'block_event')),

  calculated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  engine_version                TEXT          NOT NULL REFERENCES engine_versions(id)
);

CREATE INDEX idx_risk_score_history_project_time
  ON project_risk_score_history (project_id, calculated_at DESC);

COMMENT ON TABLE project_risk_score_history IS
  'Snapshots del Risk Score Engine. Inserta en: weekly_job, block_event (bloque crítico aparece/desaparece). Series temporales para calibración v2.';
COMMENT ON COLUMN project_risk_score_history.trigger_source IS
  'block_event: cuando un strategic_block con impact_weight alto aparece o pasa a resolved. weekly_job: recálculo estándar semanal.';

-- =============================================================================
-- D2.8 — project_function_coverage
-- Estado actual de cobertura por función crítica por proyecto.
-- PK compuesta: (project_id, function_type). Sin historial en v1.
--
-- Recálculo disparado por (edge function, no DB trigger):
--   - cron semanal (seguridad base)
--   - asignación/remoción de owner en project_functions
--   - task pasa a status='completed' con function_type ∈ {demand,delivery,cash}
--   - bloque activo creado o resuelto en strategic_blocks
--   - process_artifact actualizado (checklist_items_count o last_used_at)
-- =============================================================================

CREATE TABLE project_function_coverage (
  project_id              UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  function_type           TEXT        NOT NULL
                            CHECK (function_type IN ('demand', 'delivery', 'cash')),

  -- ============================================================
  -- 4 componentes del coverage_score (F1.11)
  -- Valores binarios por criterio: el score se obtiene sumando los 4
  -- ============================================================

  -- Criterio 1: ¿tiene owner asignado? → 30 pts si TRUE
  owner_assigned_score    SMALLINT    NOT NULL DEFAULT 0
                            CHECK (owner_assigned_score IN (0, 30)),

  -- Criterio 2: ≥3 tareas completadas (status='completed') en últimos 28 días
  --             con function_type ∈ {demand,delivery,cash} → 30 pts si TRUE
  tasks_execution_score   SMALLINT    NOT NULL DEFAULT 0
                            CHECK (tasks_execution_score IN (0, 30)),

  -- Criterio 3: sin bloqueo activo (strategic_blocks activo con function_id
  --             apuntando a esta función) → 20 pts si TRUE
  block_health_score      SMALLINT    NOT NULL DEFAULT 0
                            CHECK (block_health_score IN (0, 20)),

  -- Criterio 4: proceso documentado activo (process_artifacts con
  --             checklist_items_count ≥ 5 AND last_used_at within ventana) → 20 pts si TRUE
  process_score           SMALLINT    NOT NULL DEFAULT 0
                            CHECK (process_score IN (0, 20)),

  -- Score total = suma de los 4 criterios (0–100)
  coverage_score          SMALLINT    NOT NULL DEFAULT 0
                            CHECK (coverage_score BETWEEN 0 AND 100),

  -- Clasificación derivada del score:
  -- none:   coverage_score = 0
  -- basic:  1 ≤ coverage_score ≤ 69
  -- strong: coverage_score ≥ 70
  coverage_level          TEXT        NOT NULL DEFAULT 'none'
                            CHECK (coverage_level IN ('none', 'basic', 'strong')),

  last_calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version          TEXT        NOT NULL REFERENCES engine_versions(id),

  PRIMARY KEY (project_id, function_type)
);

COMMENT ON TABLE project_function_coverage IS
  'Estado actual de cobertura funcional. Una fila por (project_id, function_type). Recalculado en cron semanal y en eventos de cambio estructural (owner, task, block, process).';
COMMENT ON COLUMN project_function_coverage.owner_assigned_score IS
  '30 si project_functions.owner_user_id IS NOT NULL para esta función. 0 si sin owner.';
COMMENT ON COLUMN project_function_coverage.tasks_execution_score IS
  '30 si ≥3 tareas con status=completed, function_type en {demand,delivery,cash} en últimos 28 días. 0 si menos.';
COMMENT ON COLUMN project_function_coverage.block_health_score IS
  '20 si NO existe bloqueo activo en strategic_blocks apuntando a esta función. 0 si hay bloqueo activo.';
COMMENT ON COLUMN project_function_coverage.process_score IS
  '20 si existe process_artifact con checklist_items_count ≥ 5 AND last_used_at dentro de ventana (60d si phase ≤ 2, 30d si phase > 2). 0 si no.';
COMMENT ON COLUMN project_function_coverage.coverage_level IS
  'Derivado del score: 0→none | 1–69→basic | ≥70→strong. strong = función con cobertura mínima operativa (F1.11).';

-- =============================================================================
-- D2.9 — decision_events
-- Registro central de decisiones estratégicas y respuestas a recomendaciones
-- del sistema. Auditable, independiente de motores, extensible a v2.
-- No tiene engine_version — es log humano, no output de motor.
-- Debe crearse ANTES de viability_events (D2.25) que tiene FK opcional a esta.
-- =============================================================================

CREATE TABLE decision_events (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Categoría de la decisión
  -- 'system_recommendation' → founder responde a algo que el motor sugirió
  -- 'strategic_change'      → pivot de segmento, modelo, propuesta de valor
  -- 'structural_change'     → cambio en equipo, roles, funciones críticas
  -- 'manual_acknowledgment' → founder documenta decisión sin prompt del sistema
  decision_category     TEXT        NOT NULL
                          CHECK (decision_category IN (
                            'system_recommendation',
                            'strategic_change',
                            'structural_change',
                            'manual_acknowledgment'
                          )),

  -- Quién originó la decisión
  -- 'system'  → motor recomendó, founder responde
  -- 'founder' → iniciativa propia del founder
  origin                TEXT        NOT NULL
                          CHECK (origin IN ('system', 'founder')),

  -- Descripción de la decisión (para UI, historial y Optimus context)
  title                 TEXT        NOT NULL,
  description           TEXT,

  -- Referencia polimórfica a la entidad relacionada (opcional)
  -- Permite navegar desde el decision_event a lo que lo originó
  -- Ejemplos: ('viability_trigger', <viability_event_id>)
  --           ('phase_advance', <project_phase_state.project_id>)
  --           ('strategic_block', <strategic_blocks.id>)
  related_entity_type   TEXT        NULL,
  related_entity_id     UUID        NULL,

  -- Contexto adicional libre (para extensibilidad sin migrar schema)
  -- Ejemplos: {"from_model_type": "service", "to_model_type": "saas"}
  metadata              JSONB       NOT NULL DEFAULT '{}',

  -- Outcome (siempre NULL en v1 — preparado para Decision Accuracy Index P8.12)
  -- 'positive' | 'negative' | 'neutral' | 'unknown'
  outcome_status        TEXT        NULL
                          CHECK (outcome_status IN ('positive', 'negative', 'neutral', 'unknown')),

  decided_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Quién tomó o registró la decisión
  -- NULL cuando origin = 'system' y aún no hay respuesta del founder
  decided_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_decision_events_project_time
  ON decision_events (project_id, decided_at DESC);

CREATE INDEX idx_decision_events_category
  ON decision_events (project_id, decision_category);

COMMENT ON TABLE decision_events IS
  'Registro central de decisiones estratégicas y respuestas a recomendaciones del sistema. Auditable, sin engine_version. Preparado para Decision Accuracy Index (P8.12) en v2.';
COMMENT ON COLUMN decision_events.decision_category IS
  'Categoría semántica: system_recommendation (respuesta a motor), strategic_change (pivot), structural_change (equipo/roles), manual_acknowledgment (founder documenta).';
COMMENT ON COLUMN decision_events.related_entity_type IS
  'Tipo de entidad relacionada (polimórfico): viability_trigger, phase_advance, strategic_block, etc. Permite navegar al origen sin FK dura.';
COMMENT ON COLUMN decision_events.outcome_status IS
  'Siempre NULL en v1. Se rellena en v2 cuando se implemente Decision Accuracy Index (P8.12). No eliminar — evita migración futura.';

-- =============================================================================
-- D2.25 — viability_events
-- Una fila por trigger activo por proyecto (modelo de estado).
-- PK lógica: (project_id, trigger_type).
-- consecutive_count persiste la consecutividad sin queries pesadas.
-- hidden_until persiste el cooldown del founder (ignore/postpone).
-- Respuesta del founder vive en decision_events (FK opcional).
-- Debe crearse DESPUÉS de decision_events (D2.9) por la FK.
-- =============================================================================

CREATE TABLE viability_events (
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Los 4 triggers del Viability Engine (F1.10)
  trigger_type          TEXT        NOT NULL
                          CHECK (trigger_type IN (
                            'stagnation',       -- T1: proyecto estancado
                            'margin_risk',      -- T2: riesgo de flujo de caja (solo HIGH confidence)
                            'overload',         -- T3: sobrecarga operativa
                            'weak_validation'   -- T4: validación externa débil
                          )),

  -- Cuántas evaluaciones semanales consecutivas lleva activo este trigger.
  -- Se incrementa en cada cron si el trigger sigue presente.
  -- Se resetea a 1 si el trigger vuelve a activarse después de resolverse.
  consecutive_count     INTEGER     NOT NULL DEFAULT 1
                          CHECK (consecutive_count >= 1),

  -- Confianza del engine en este trigger (crítico para T2/margin_risk:
  -- solo se activa si confidence_level = 'high')
  confidence_level      TEXT        NOT NULL DEFAULT 'low'
                          CHECK (confidence_level IN ('low', 'medium', 'high')),

  first_triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_evaluated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- NULL = trigger activo | NOT NULL = trigger resuelto
  -- Al reactivarse: resolved_at = NULL, consecutive_count = 1
  resolved_at           TIMESTAMPTZ NULL,

  -- Cooldown de respuesta del founder:
  -- accept   → hidden_until = NULL (trigger procesado, visible)
  -- ignore   → hidden_until = NOW() + 7 days
  -- postpone → hidden_until = NOW() + 14 days
  -- El cron evalúa: WHERE hidden_until IS NULL OR hidden_until < NOW()
  hidden_until          TIMESTAMPTZ NULL,

  -- FK opcional → decision_events (se crea cuando el founder responde)
  -- NULL = founder no ha respondido aún
  -- Se limpia a NULL si el trigger se resetea por re-activación post-resolución
  decision_event_id     UUID        REFERENCES decision_events(id) ON DELETE SET NULL,

  engine_version        TEXT        NOT NULL REFERENCES engine_versions(id),

  PRIMARY KEY (project_id, trigger_type)
);

-- Índice para el cron: evaluar triggers que no están en cooldown y están activos
CREATE INDEX idx_viability_events_active
  ON viability_events (project_id, trigger_type, consecutive_count)
  WHERE resolved_at IS NULL;

COMMENT ON TABLE viability_events IS
  'Una fila por trigger activo por proyecto (modelo de estado). PK: (project_id, trigger_type). Historial via decision_events + project_risk_score_history.';
COMMENT ON COLUMN viability_events.consecutive_count IS
  'Evaluaciones semanales consecutivas activo. Se incrementa en cron si sigue presente. Se resetea a 1 en re-activación post-resolución.';
COMMENT ON COLUMN viability_events.confidence_level IS
  'Confianza del engine. T2 (margin_risk) solo se activa si confidence_level=high. Afecta viability_status en project_viability_state.';
COMMENT ON COLUMN viability_events.hidden_until IS
  'Cooldown por respuesta founder: ignore→+7d, postpone→+14d, accept→NULL. El cron filtra: hidden_until IS NULL OR hidden_until < NOW().';
COMMENT ON COLUMN viability_events.decision_event_id IS
  'FK opcional a decision_events. NULL hasta que el founder responde. Se limpia (NULL) si el trigger se reactiva después de resolverse.';

-- =============================================================================
-- D2.13 — benchmarks
-- Valores de referencia sectoriales para los motores.
-- Arquitectura híbrida v1: source_type='curated' (datos externos validados).
-- source_type='internal' disponible para transición progresiva en v2
-- cuando n_proyectos_validos ≥ 30 por segmento.
-- =============================================================================

CREATE TABLE benchmarks (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clasificadores del benchmark (definen qué segmento aplica)
  industry            TEXT          NOT NULL,
  model_type          TEXT          NOT NULL
                        CHECK (model_type IN ('saas', 'service', 'physical', 'marketplace', 'agency', 'unknown')),
  region_cluster      TEXT          NOT NULL,

  -- Métrica que contiene este row (6 métricas v1)
  metric_name         TEXT          NOT NULL
                        CHECK (metric_name IN (
                          'margen_estimado',    -- F3/F4 Phase Engine — estructural
                          'crecimiento_p50',    -- Probability Engine — revenue_momentum_score
                          'conversion_media',   -- Dashboard — informativo
                          'ciclo_venta_medio',  -- Dashboard — informativo (alerta si > p75)
                          'ticket_medio',       -- Dashboard — informativo
                          'cac_estimado'        -- Dashboard — informativo
                        )),

  -- Percentiles (rangos, no valores únicos)
  p25                 NUMERIC(10,4) NULL,
  p50                 NUMERIC(10,4) NULL,
  p75                 NUMERIC(10,4) NULL,

  -- Fuente y confianza
  -- 'curated'  → datos externos validados (confidence_score 60–70)
  -- 'internal' → datos internos de proyectos Nova Hub (confidence_score según n)
  source_type         TEXT          NOT NULL
                        CHECK (source_type IN ('curated', 'internal')),

  -- confidence_score según tabla F1.9:
  -- curated: 60 (default), 70 (con fuente externa validada)
  -- internal: n<30→50, 30–99→80, 100–299→90, ≥300→95. Cap: 95.
  confidence_score    INTEGER       NOT NULL DEFAULT 60
                        CHECK (confidence_score BETWEEN 0 AND 95),

  -- Solo relevante para source_type='internal': número de proyectos que
  -- contribuyeron al benchmark. Determina confidence_score.
  n_proyectos_validos INTEGER       NULL
                        CHECK (n_proyectos_validos >= 0),

  -- Notas de fuente (para trazabilidad en curated)
  source_notes        TEXT          NULL,

  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Unicidad: un benchmark por combinación clasificador + métrica + fuente
  UNIQUE (industry, model_type, region_cluster, metric_name, source_type)
);

CREATE INDEX idx_benchmarks_lookup
  ON benchmarks (industry, model_type, region_cluster, metric_name);

COMMENT ON TABLE benchmarks IS
  'Benchmarks sectoriales. Arquitectura híbrida: curated v1, internal en v2 cuando n≥30. Rangos p25/p50/p75 — no valores únicos.';
COMMENT ON COLUMN benchmarks.confidence_score IS
  'Tabla F1.9: curated→60/70 | internal: n<30→50, 30-99→80, 100-299→90, ≥300→95. Cap absoluto: 95.';
COMMENT ON COLUMN benchmarks.n_proyectos_validos IS
  'Solo para source_type=internal. Determina confidence_score según tabla F1.9. NULL para source_type=curated.';
COMMENT ON COLUMN benchmarks.metric_name IS
  'crecimiento_p50 → alimenta revenue_momentum_score (Probability Engine). Resto: dashboard informativo o Phase Engine estructural.';

-- =============================================================================
-- D2.20 — strategic_model_versions
-- Log append-only de cambios en la hipótesis estratégica.
-- Cada INSERT representa un pivot o cambio sustantivo en segment/problem/value_prop.
-- pivot_count = COUNT de filas en últimas 4 semanas (O1.3 Phase Engine).
-- No se actualiza — solo inserta.
-- =============================================================================

CREATE TABLE strategic_model_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Número de versión (coincide con project_strategy_current.version_number
  -- al momento del cambio)
  version_number  INTEGER     NOT NULL CHECK (version_number >= 1),

  -- Snapshot completo de la hipótesis en esta versión
  segment_text    TEXT,
  problem_text    TEXT,
  value_prop_text TEXT,

  -- Qué campos cambiaron respecto a la versión anterior y sus valores old/new
  -- Estructura: {"segment_text": {"old": "...", "new": "..."}}
  -- Permite identificar qué tipo de pivot fue (segmento, problema, propuesta)
  changed_fields  JSONB       NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_strategic_versions_project_time
  ON strategic_model_versions (project_id, created_at DESC);

COMMENT ON TABLE strategic_model_versions IS
  'Log append-only de pivots y cambios estratégicos. pivot_count = COUNT de filas en últimas 4 semanas (O1.3 Phase Engine). Solo INSERT, nunca UPDATE.';
COMMENT ON COLUMN strategic_model_versions.changed_fields IS
  'JSONB con campos modificados y sus valores old/new. Permite identificar tipo de pivot sin leer versión anterior.';
COMMENT ON COLUMN strategic_model_versions.version_number IS
  'Correlaciona con project_strategy_current.version_number al momento del cambio. Permite reconstruir historial secuencial.';

-- =============================================================================
-- D2.11 — project_protocols
-- Reglas y rituales transversales de proyecto.
-- Diferencia con process_artifacts:
--   process_artifacts = cómo se EJECUTA una función crítica (checklist operativo)
--   project_protocols  = cómo se DECIDE / cómo funciona el sistema (cadencias, acuerdos)
-- Sin score, sin historial, sin engine_version en v1.
-- =============================================================================

CREATE TABLE project_protocols (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  protocol_type   TEXT        NOT NULL
                    CHECK (protocol_type IN (
                      'weekly_review',       -- cadencia de revisión semanal
                      'prioritization',      -- regla de prioridades (ICE, RICE, etc.)
                      'decision_rule',       -- cómo se aprueban cambios de scope / decisiones
                      'incident_response',   -- protocolo de critical blocks / incidentes
                      'other'                -- escape hatch controlado
                    )),

  title           TEXT        NOT NULL,
  description     TEXT,
  link_or_doc_id  TEXT        NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_protocols_project
  ON project_protocols (project_id, is_active);

COMMENT ON TABLE project_protocols IS
  'Reglas y rituales transversales del proyecto. Diferente de process_artifacts (ejecución operativa por función). Sin score ni engine en v1.';
COMMENT ON COLUMN project_protocols.protocol_type IS
  'Categoría del protocolo: weekly_review, prioritization, decision_rule, incident_response, other.';

-- =============================================================================
-- D2.12 — strategic_cycles
-- Contenedor temporal de 4 semanas por proyecto.
-- Guarda snapshot de engines al cierre + estado del ritual (cuando exista en v2).
-- Ciclos alineados al lunes (ISO week). end_date = start_date + 27 días (28 días inclusive).
-- =============================================================================

CREATE TABLE strategic_cycles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Índice secuencial del ciclo (1, 2, 3...). Un ciclo por proyecto a la vez.
  cycle_index         INTEGER     NOT NULL CHECK (cycle_index >= 1),

  -- start_date: lunes (ISO week) — calculado por app layer.
  -- end_date:   start_date + 27 días (4 semanas completas, inclusive).
  start_date          DATE        NOT NULL,
  end_date            DATE        NOT NULL,

  closed_at           TIMESTAMPTZ NULL,
  close_reason        TEXT        NULL
                        CHECK (close_reason IN ('manual', 'scheduled')),

  -- Snapshot de motores al momento del cierre.
  -- Estructura esperada:
  -- {
  --   "phase":       {"current_phase": 1, "phase_score": 67.5, "phase_status": "healthy"},
  --   "probability": {"probability_score": 42.0, "probability_status": "active"},
  --   "risk":        {"risk_score": 35.0, "risk_level": "medium", "risk_status": "active"},
  --   "viability":   {"viability_status": "monitoring"},
  --   "completeness":{"data_completeness_score": 68.0}
  -- }
  engine_snapshot     JSONB       NOT NULL DEFAULT '{}',

  -- Respuestas del ritual estratégico (5 preguntas). NULL en v1 — ritual no implementado aún.
  -- En v2: JSONB con answers del founder al cerrar el ciclo con Optimus.
  ritual_responses    JSONB       NULL,

  -- FK opcional → decision_events (cuando cerrar el ciclo sea una decisión explícita)
  -- NULL en v1.
  decision_event_id   UUID        NULL REFERENCES decision_events(id) ON DELETE SET NULL,

  -- Invariante: un ciclo por índice por proyecto
  UNIQUE (project_id, cycle_index)
);

CREATE INDEX idx_strategic_cycles_project_time
  ON strategic_cycles (project_id, start_date DESC);

COMMENT ON TABLE strategic_cycles IS
  'Contenedor de 4 semanas por proyecto. Ciclos alineados al lunes (ISO week). Snapshot de engines al cierre. ritual_responses NULL en v1.';
COMMENT ON COLUMN strategic_cycles.engine_snapshot IS
  'JSONB con estado de phase/probability/risk/viability/completeness al cierre del ciclo. Permite comparar evolución entre ciclos.';
COMMENT ON COLUMN strategic_cycles.ritual_responses IS
  'NULL en v1 — ritual estratégico no implementado. En v2: respuestas del founder a las 5 preguntas del Strategic Reset Ritual (R10.x).';
COMMENT ON COLUMN strategic_cycles.end_date IS
  'start_date + 27 días (28 días inclusive = 4 semanas completas). Calculado por app layer al crear el ciclo.';

-- =============================================================================
-- TRIGGER DE INICIALIZACIÓN DE PROYECTO
-- Se define AQUÍ: después de que todas las tablas referenciadas existen.
-- Inicializa filas baseline en todas las state tables para que la UI
-- nunca rompa con NULLs en Day 1, antes del primer cron semanal.
-- Los engines siempre hacen UPSERT como defensa adicional.
-- Todos los INSERTs usan ON CONFLICT DO NOTHING → trigger idempotente.
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_initialize_project_data()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_ver       TEXT;
  v_probability_ver TEXT;
  v_viability_ver   TEXT;
  v_execution_ver   TEXT;
  v_risk_ver        TEXT;
  v_start_date      DATE;
BEGIN
  -- Resolver versiones activas por motor desde DB (sin hardcodear strings).
  -- Fallback al id convencional si el seed no corrió (no debería ocurrir).
  SELECT id INTO v_phase_ver       FROM engine_versions WHERE motor = 'phase'       AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_probability_ver FROM engine_versions WHERE motor = 'probability' AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_viability_ver   FROM engine_versions WHERE motor = 'viability'   AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_execution_ver   FROM engine_versions WHERE motor = 'execution'   AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_risk_ver        FROM engine_versions WHERE motor = 'risk'        AND is_active = TRUE LIMIT 1;

  IF v_phase_ver       IS NULL THEN v_phase_ver       := 'phase_v1.0';       END IF;
  IF v_probability_ver IS NULL THEN v_probability_ver := 'probability_v1.0'; END IF;
  IF v_viability_ver   IS NULL THEN v_viability_ver   := 'viability_v1.0';   END IF;
  IF v_execution_ver   IS NULL THEN v_execution_ver   := 'execution_v1.0';   END IF;
  IF v_risk_ver        IS NULL THEN v_risk_ver        := 'risk_v1.0';        END IF;

  -- Lunes de la semana actual (ISO week) para el primer ciclo estratégico
  v_start_date := date_trunc('week', CURRENT_DATE)::date;

  -- ── project_functions (3 funciones críticas fijas) ─────────────────────────
  INSERT INTO project_functions (project_id, function_type)
  VALUES
    (NEW.id, 'demand'),
    (NEW.id, 'delivery'),
    (NEW.id, 'cash')
  ON CONFLICT (project_id, function_type) DO NOTHING;

  -- ── project_phase_state ────────────────────────────────────────────────────
  -- phase_status='friction' y no 'critical': Day 1 sin datos no es señal de crisis.
  INSERT INTO project_phase_state (
    project_id, current_phase, phase_score, hard_signal_met,
    phase_status, phase_entered_at, phase_last_changed_at,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, 1, 0, FALSE, 'friction', NOW(), NOW(), NOW(), v_phase_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_probability ────────────────────────────────────────────────────
  -- 'inactive': <2 inputs con datos reales disponibles en Day 1.
  INSERT INTO project_probability (
    project_id, probability_status, data_completeness_score,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, 'inactive', 0, NOW(), v_probability_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_viability_state ────────────────────────────────────────────────
  -- 'healthy': sin triggers activos en Day 1.
  INSERT INTO project_viability_state (
    project_id, viability_status, active_trigger_count,
    trigger_consecutive_max, top_trigger_consecutive,
    last_evaluated_at, engine_version
  ) VALUES (
    NEW.id, 'healthy', 0, 0, 0, NOW(), v_viability_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_risk_score ─────────────────────────────────────────────────────
  -- 'insufficient_data': 0 inputs disponibles en Day 1.
  INSERT INTO project_risk_score (
    project_id, risk_score, risk_level, risk_status,
    inputs_available, data_completeness_score,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, NULL, 'low', 'insufficient_data',
    0, 0, NOW(), v_risk_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_strategy_current ───────────────────────────────────────────────
  -- Todos los campos de hipótesis NULL: el founder los completa en onboarding.
  INSERT INTO project_strategy_current (
    project_id, version_number, last_updated_at
  ) VALUES (
    NEW.id, 1, NOW()
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_economic_profile ───────────────────────────────────────────────
  -- Valores 'unknown': el founder declara en onboarding / perfil económico.
  INSERT INTO project_economic_profile (
    project_id, model_type, pricing_model, revenue_type,
    field_sources, confidence_score, confidence_level,
    last_updated_at, engine_version
  ) VALUES (
    NEW.id, 'unknown', 'unknown', 'mixed',
    '{}', 0, 'low', NOW(), v_execution_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_function_coverage (3 filas — una por función crítica) ──────────
  -- score=0, level='none': sin datos de tareas, owner, blocks ni proceso.
  INSERT INTO project_function_coverage (
    project_id, function_type,
    owner_assigned_score, tasks_execution_score,
    block_health_score, process_score,
    coverage_score, coverage_level,
    last_calculated_at, engine_version
  ) VALUES
    (NEW.id, 'demand',   0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver),
    (NEW.id, 'delivery', 0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver),
    (NEW.id, 'cash',     0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver)
  ON CONFLICT (project_id, function_type) DO NOTHING;

  -- ── strategic_cycles (ciclo 1 — lunes de la semana actual) ────────────────
  -- El cron semanal cierra el ciclo cuando now() > end_date y crea el siguiente.
  INSERT INTO strategic_cycles (
    project_id, cycle_index, start_date, end_date
  ) VALUES (
    NEW.id, 1, v_start_date, v_start_date + 27
  ) ON CONFLICT (project_id, cycle_index) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE OR REPLACE TRIGGER (PG 14+ / Supabase PG 15): idempotente en re-ejecución
CREATE OR REPLACE TRIGGER trg_initialize_project_data
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION fn_initialize_project_data();

-- =============================================================================
-- ALTERACIONES A TABLAS EXISTENTES (D2.14 – D2.18)
-- Aplicar en el mismo orden. Usar IF NOT EXISTS donde corresponde
-- para idempotencia si la migración se re-aplica parcialmente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- D2.14 — tasks: añadir leader_id + function_type
-- leader_id  = responsable del resultado (distinto del ejecutor/assignee).
-- function_type = función estratégica de la tarea (demand/delivery/cash).
--   Requerido por project_function_coverage para tasks_execution_score.
--   NULL permitido para tareas sin función asignada.
-- -----------------------------------------------------------------------------
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS leader_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS function_type TEXT
    CHECK (function_type IN ('demand', 'delivery', 'cash'));

COMMENT ON COLUMN tasks.leader_id IS
  'Responsable del resultado de la tarea. Distinto de assignee_id (ejecutor). NULL en proyectos solo founder. Validación leader ≠ executor en app layer.';
COMMENT ON COLUMN tasks.function_type IS
  'Función estratégica a la que pertenece la tarea: demand, delivery o cash. NULL = tarea transversal. Usado por project_function_coverage para tasks_execution_score.';

-- Índices en tasks — requeridos por los engines (placement: AFTER function_type existe)
-- tasks_done_4w filtra: status=done AND function_type IS NOT NULL AND completed_at within 28d
CREATE INDEX IF NOT EXISTS idx_tasks_project_completed
  ON tasks (project_id, completed_at DESC)
  WHERE status = 'done';

CREATE INDEX IF NOT EXISTS idx_tasks_function_completed
  ON tasks (function_type, completed_at DESC)
  WHERE status = 'done' AND function_type IS NOT NULL;

-- -----------------------------------------------------------------------------
-- D2.15 — projects: añadir Location Layer
-- Requerido en onboarding (pregunta 8-9). Alimenta benchmark lookup
-- (region_cluster) y futuras comparaciones geográficas.
-- -----------------------------------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS market_scope TEXT
    CHECK (market_scope IN ('local', 'global')),
  ADD COLUMN IF NOT EXISTS cluster      TEXT
    CHECK (cluster IN ('EU', 'US', 'LATAM', 'APAC', 'Other'));

COMMENT ON COLUMN projects.country IS
  'ISO 3166-1 alpha-2. Requerido en onboarding Fase A (pregunta 8).';
COMMENT ON COLUMN projects.market_scope IS
  'local = opera principalmente en su país. global = opera internacionalmente. Onboarding Fase A (pregunta 9).';
COMMENT ON COLUMN projects.cluster IS
  'Cluster geográfico derivado de country. Usado para benchmark lookup en tabla benchmarks.region_cluster.';

-- -----------------------------------------------------------------------------
-- D2.16 — project_members: añadir performance_score_v2
-- Placeholder para el nuevo cálculo de performance por rol (E4.x).
-- NULL hasta que el engine implemente las 6 fórmulas por rol (C3.4).
-- La columna existente performance_score (v1) se mantiene sin tocar.
-- -----------------------------------------------------------------------------
ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS performance_score_v2 NUMERIC(5,2)
    CHECK (performance_score_v2 BETWEEN 0 AND 100);

COMMENT ON COLUMN project_members.performance_score_v2 IS
  'Nuevo cálculo de performance por rol (6 fórmulas específicas — C3.4). NULL hasta implementar engine. performance_score (v1) permanece sin tocar.';

-- -----------------------------------------------------------------------------
-- D2.17 — obvs: añadir tipos al ENUM + campos de gestión de tipo automático
-- Tipos añadidos (F1.8): product_validation (×1.1), operational_system (×0.8)
-- Los tipos originales (customer_discovery, revenue_validation) ya existen.
-- Campos de auto-tipo: para cuando el engine fuerza revenue_validation
--   al detectar evidence_type=payment_verified + evidence_status=active.
-- -----------------------------------------------------------------------------

-- Añadir valores al ENUM obv_type (IF NOT EXISTS requiere Postgres 12+)
ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'product_validation';
ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'operational_system';

-- Campos para gestión de tipo automático (F1.8)
ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS type_auto_updated        BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS type_auto_update_reason  TEXT,
  ADD COLUMN IF NOT EXISTS type_declared_original   obv_type,
  ADD COLUMN IF NOT EXISTS dispute_flag             BOOLEAN   NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN obvs.type_auto_updated IS
  'TRUE cuando el engine forzó el tipo (ej: payment_verified → revenue_validation). FALSE = tipo declarado por founder.';
COMMENT ON COLUMN obvs.type_declared_original IS
  'Tipo original declarado por el founder antes del auto-update. NULL si nunca hubo auto-update.';
COMMENT ON COLUMN obvs.type_auto_update_reason IS
  'Razón del auto-update: "payment_verified_evidence_active", etc. Para audit trail y UI explicativo.';
COMMENT ON COLUMN obvs.dispute_flag IS
  'TRUE si el founder disputó el auto-update de tipo. Cuando TRUE, el engine revierte a type_declared_original.';

-- -----------------------------------------------------------------------------
-- D2.18 — project_roles: añadir maps_to_specialization
-- Conecta el rol interno del proyecto con una especialización reconocida.
-- TEXT en v1 (sin ENUM fijo) — se formaliza en v2 cuando se tenga lista estable.
-- NOTA: wrapped en DO block por si project_roles no existe en el entorno de destino.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_roles'
  ) THEN
    ALTER TABLE project_roles
      ADD COLUMN IF NOT EXISTS maps_to_specialization TEXT;
    COMMENT ON COLUMN project_roles.maps_to_specialization IS
      'Especialización estándar a la que mapea este rol interno. TEXT en v1 (sin ENUM). Permite comparaciones cross-proyecto en v2.';
  END IF;
END $$;

-- =============================================================================
-- D2.19 — ROW LEVEL SECURITY (RLS) — Todas las tablas nuevas
--
-- Modelo de acceso v1:
--   'owner'   → SELECT + escritura completa (configuración + datos)
--   'member'  → SELECT todo + escribir tareas, OBVs, blocks manuales, decisiones
--   'viewer'  → solo SELECT
--   service_role (edge functions / cron) → bypass RLS implícito en Supabase
--
-- Nota: las tablas de engines son SOLO LECTURA para clientes.
--       La escritura en ellas ocurre vía service_role (bypass RLS).
-- =============================================================================

-- ============================================================
-- Helper functions (SECURITY DEFINER para evitar recursión RLS)
-- ============================================================

-- member_id is the FK to profiles (not user_id — actual column name in project_members)
CREATE OR REPLACE FUNCTION auth_is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND member_id = auth.uid()
  );
$$;

-- owner = created_by on projects table (no owner role in project_members)
CREATE OR REPLACE FUNCTION auth_is_project_owner(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND created_by = auth.uid()
  );
$$;

-- writer = any project member (all members can write operational data)
CREATE OR REPLACE FUNCTION auth_is_project_writer(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth_is_project_member(p_project_id)
      OR auth_is_project_owner(p_project_id);
$$;

-- ============================================================
-- PATRÓN 1: Tablas públicas / semi-públicas (sin project_id)
-- ============================================================

-- engine_versions: lectura pública, escritura solo service_role
ALTER TABLE engine_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engine_versions: public read"
  ON engine_versions FOR SELECT
  TO authenticated
  USING (true);

-- benchmarks: lectura para miembros autenticados, escritura solo service_role
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "benchmarks: authenticated read"
  ON benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- PATRÓN 2: Tablas de engine — solo lectura para clientes
-- Escritura exclusiva por service_role (edge functions / cron)
-- ============================================================

ALTER TABLE project_phase_state         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phase_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_probability         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_probability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_viability_state     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risk_score          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risk_score_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_function_coverage   ENABLE ROW LEVEL SECURITY;
ALTER TABLE viability_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_economic_profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phase_state: members read"
  ON project_phase_state FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "phase_history: members read"
  ON project_phase_history FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "probability: members read"
  ON project_probability FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "probability_history: members read"
  ON project_probability_history FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "viability_state: members read"
  ON project_viability_state FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "risk_score: members read"
  ON project_risk_score FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "risk_score_history: members read"
  ON project_risk_score_history FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "function_coverage: members read"
  ON project_function_coverage FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "viability_events: members read"
  ON viability_events FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "economic_profile_history: members read"
  ON project_economic_profile_history FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

-- ============================================================
-- PATRÓN 3: Tablas de configuración — owner escribe, todos leen
-- ============================================================

ALTER TABLE project_functions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_protocols         ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_artifacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_strategy_current  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_economic_profile  ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_model_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_cycles          ENABLE ROW LEVEL SECURITY;

-- project_functions
CREATE POLICY "project_functions: members read"
  ON project_functions FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "project_functions: owner write"
  ON project_functions FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- project_protocols
CREATE POLICY "project_protocols: members read"
  ON project_protocols FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "project_protocols: owner write"
  ON project_protocols FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- process_artifacts
CREATE POLICY "process_artifacts: members read"
  ON process_artifacts FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "process_artifacts: owner write"
  ON process_artifacts FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- project_strategy_current
CREATE POLICY "strategy_current: members read"
  ON project_strategy_current FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "strategy_current: owner write"
  ON project_strategy_current FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- project_economic_profile (founder declara campos: ticket, cac, etc.)
CREATE POLICY "economic_profile: members read"
  ON project_economic_profile FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "economic_profile: owner write"
  ON project_economic_profile FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- strategic_model_versions (append-only; INSERT por owner en cada pivot)
CREATE POLICY "model_versions: members read"
  ON strategic_model_versions FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "model_versions: owner insert"
  ON strategic_model_versions FOR INSERT TO authenticated
  WITH CHECK (auth_is_project_owner(project_id));

-- strategic_cycles (owner crea/cierra ciclos)
CREATE POLICY "strategic_cycles: members read"
  ON strategic_cycles FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "strategic_cycles: owner write"
  ON strategic_cycles FOR ALL TO authenticated
  USING (auth_is_project_owner(project_id))
  WITH CHECK (auth_is_project_owner(project_id));

-- ============================================================
-- PATRÓN 4: Tablas operativas — owner + member escriben
-- ============================================================

ALTER TABLE strategic_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_events   ENABLE ROW LEVEL SECURITY;

-- strategic_blocks: lectura para todos, INSERT restringido a origin='manual'
-- Los bloques origin='engine' los inserta el service_role (bypass RLS)
CREATE POLICY "strategic_blocks: members read"
  ON strategic_blocks FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "strategic_blocks: writers insert manual"
  ON strategic_blocks FOR INSERT TO authenticated
  WITH CHECK (
    auth_is_project_writer(project_id)
    AND origin = 'manual'
  );

CREATE POLICY "strategic_blocks: writers update"
  ON strategic_blocks FOR UPDATE TO authenticated
  USING (auth_is_project_writer(project_id))
  WITH CHECK (auth_is_project_writer(project_id));

-- decision_events: owner + member pueden crear decisiones propias
CREATE POLICY "decision_events: members read"
  ON decision_events FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

CREATE POLICY "decision_events: writers insert"
  ON decision_events FOR INSERT TO authenticated
  WITH CHECK (auth_is_project_writer(project_id));

-- decision_events: solo quien la creó puede actualizarla (o el owner)
CREATE POLICY "decision_events: creator or owner update"
  ON decision_events FOR UPDATE TO authenticated
  USING (
    auth_is_project_owner(project_id)
    OR decided_by = auth.uid()
  )
  WITH CHECK (
    auth_is_project_owner(project_id)
    OR decided_by = auth.uid()
  );
