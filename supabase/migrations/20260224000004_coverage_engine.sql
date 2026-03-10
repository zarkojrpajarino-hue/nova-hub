-- =============================================================================
-- MIGRACIÓN 00004 — COVERAGE ENGINE
-- run_coverage_engine: calcula project_function_coverage por función.
-- Triggers de evento: tasks, strategic_blocks, process_artifacts, project_functions.
-- Motor: 'execution' (no existe motor separado 'coverage' en engine_versions v1).
-- =============================================================================

-- =============================================================================
-- CORRECCIÓN DE COMENTARIO — tasks_execution_score
-- El COMMENT en migration 00002 dice status='completed' pero el enum real de
-- task_status es ('todo','doing','done','blocked'). El valor correcto es 'done'.
-- Se actualiza aquí para alinear documentación con schema real.
-- =============================================================================
COMMENT ON COLUMN project_function_coverage.tasks_execution_score IS
  '30 si ≥3 tareas con status=''done'', function_type en {demand,delivery,cash} en últimos 28 días (4 weeks). 0 si menos.';

-- =============================================================================
-- run_coverage_engine(p_project_id UUID)
--
-- Recalcula las 3 filas de project_function_coverage para un proyecto.
-- UPSERT idempotente: seguro llamar varias veces consecutivas.
--
-- INPUTS POR FUNCIÓN (demand / delivery / cash):
--
-- 1. owner_assigned_score (0|30)
--    30 si project_functions.owner_user_id IS NOT NULL para esta función.
--
-- 2. tasks_execution_score (0|30)
--    30 si COUNT(tasks con status='done', function_type=ft, completed_at >= NOW()-28d) >= 3
--    NOTA: el enum task_status usa 'done', NO 'completed'. Ver corrección de COMMENT arriba.
--
-- 3. block_health_score (0|20)
--    20 si NO existe strategic_block activo (resolved_at IS NULL) con
--    impact_weight >= 70 (crítico) que apunte a esta función.
--    "Apunta a esta función":
--      - function_id → project_functions.function_type = ft
--      - task_id     → tasks.function_type = ft
--    Bloques sin función específica (execution_drop, cash_bottleneck sin FK)
--    no penalizan el score individual por función.
--
-- 4. process_score (0|20)
--    20 si EXISTS process_artifacts con:
--      - function_type = ft
--      - checklist_items_count >= 5
--      - last_used_at IS NOT NULL
--      - last_used_at >= NOW() - 60 días (ventana global v1;
--        en v2 se ajustará por fase: 60d si fase ≤2, 30d si fase >2)
--
-- coverage_score = suma (0–100)
-- coverage_level:  ≥70 → strong | 40–69 → basic | <40 → none
--
-- ENGINE_VERSION: motor='execution' (coverage vive dentro de execution en v1).
-- =============================================================================

CREATE OR REPLACE FUNCTION run_coverage_engine(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver            TEXT;
  v_ft             TEXT;
  v_owner_score    SMALLINT;
  v_tasks_score    SMALLINT;
  v_block_score    SMALLINT;
  v_process_score  SMALLINT;
  v_total          SMALLINT;
  v_level          TEXT;
  v_owner_uid      UUID;
  v_tasks_done_4w  BIGINT;
  v_has_crit_block BOOLEAN;
  v_has_process    BOOLEAN;
BEGIN
  -- Resolver versión activa del motor (execution cubre coverage en v1)
  SELECT id INTO v_ver
  FROM engine_versions
  WHERE motor = 'execution' AND is_active = TRUE
  LIMIT 1;

  IF v_ver IS NULL THEN
    v_ver := 'execution_v1.0';  -- fallback defensivo
  END IF;

  -- -----------------------------------------------------------------------
  -- Loop sobre las 3 funciones críticas
  -- -----------------------------------------------------------------------
  FOREACH v_ft IN ARRAY ARRAY['demand', 'delivery', 'cash'] LOOP

    -- ------------------------------------------------------------------
    -- Score 1: owner_assigned_score
    -- ------------------------------------------------------------------
    SELECT owner_user_id
    INTO   v_owner_uid
    FROM   project_functions
    WHERE  project_id   = p_project_id
      AND  function_type = v_ft;

    v_owner_score := CASE WHEN v_owner_uid IS NOT NULL THEN 30 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 2: tasks_execution_score
    -- Enum task_status: 'todo' | 'doing' | 'done' | 'blocked'
    -- Ventana: 28 días = 4 semanas rolling
    -- ------------------------------------------------------------------
    SELECT COUNT(*)
    INTO   v_tasks_done_4w
    FROM   tasks
    WHERE  project_id    = p_project_id
      AND  function_type = v_ft
      AND  status        = 'done'
      AND  completed_at >= NOW() - INTERVAL '28 days';

    v_tasks_score := CASE WHEN v_tasks_done_4w >= 3 THEN 30 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 3: block_health_score
    -- Crítico = impact_weight >= 70 AND resolved_at IS NULL
    -- Función-específico = function_id → project_functions.function_type = ft
    --                    OR task_id   → tasks.function_type = ft
    -- ------------------------------------------------------------------
    SELECT EXISTS (
      SELECT 1
      FROM   strategic_blocks sb
      WHERE  sb.project_id    = p_project_id
        AND  sb.resolved_at   IS NULL
        AND  sb.impact_weight >= 70
        AND  (
          -- bloque apunta a función vía project_functions
          (sb.function_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM project_functions pf
            WHERE  pf.id           = sb.function_id
              AND  pf.function_type = v_ft
          ))
          OR
          -- bloque apunta a tarea que pertenece a esta función
          (sb.task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE  t.id           = sb.task_id
              AND  t.function_type = v_ft
          ))
        )
    ) INTO v_has_crit_block;

    v_block_score := CASE WHEN NOT v_has_crit_block THEN 20 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 4: process_score
    -- documented_process_exists = checklist_items_count >= 5
    --                           AND last_used_at IS NOT NULL
    --                           AND last_used_at >= NOW() - 60 días (v1 global)
    -- ------------------------------------------------------------------
    SELECT EXISTS (
      SELECT 1
      FROM   process_artifacts
      WHERE  project_id             = p_project_id
        AND  function_type          = v_ft
        AND  checklist_items_count >= 5
        AND  last_used_at           IS NOT NULL
        AND  last_used_at          >= NOW() - INTERVAL '60 days'
    ) INTO v_has_process;

    v_process_score := CASE WHEN v_has_process THEN 20 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Coverage total + clasificación
    -- ≥70 → strong | 40–69 → basic | <40 → none
    -- ------------------------------------------------------------------
    v_total := v_owner_score + v_tasks_score + v_block_score + v_process_score;

    v_level := CASE
      WHEN v_total >= 70 THEN 'strong'
      WHEN v_total >= 40 THEN 'basic'
      ELSE                    'none'
    END;

    -- ------------------------------------------------------------------
    -- UPSERT idempotente
    -- ------------------------------------------------------------------
    INSERT INTO project_function_coverage (
      project_id,          function_type,
      owner_assigned_score, tasks_execution_score,
      block_health_score,   process_score,
      coverage_score,       coverage_level,
      last_calculated_at,   engine_version
    )
    VALUES (
      p_project_id,  v_ft,
      v_owner_score, v_tasks_score,
      v_block_score, v_process_score,
      v_total,       v_level,
      NOW(),         v_ver
    )
    ON CONFLICT (project_id, function_type) DO UPDATE SET
      owner_assigned_score  = EXCLUDED.owner_assigned_score,
      tasks_execution_score = EXCLUDED.tasks_execution_score,
      block_health_score    = EXCLUDED.block_health_score,
      process_score         = EXCLUDED.process_score,
      coverage_score        = EXCLUDED.coverage_score,
      coverage_level        = EXCLUDED.coverage_level,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version;

  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_coverage_engine(UUID) IS
  'Recalcula project_function_coverage para las 3 funciones (demand/delivery/cash). UPSERT idempotente. Llamado por triggers de evento y por pg_cron semanal. Motor: execution_v1.0.';

-- =============================================================================
-- TRIGGER 1 — tasks
-- Dispara run_coverage_engine cuando:
--   a) status cambia A 'done'
--   b) status cambia DESDE 'done' (tarea reabierta → puede bajar el score)
--   c) function_type cambia (la función anterior pierde la tarea, la nueva la gana)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_tasks_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Casos relevantes:
  -- INSERT: nueva tarea done desde el inicio (raro pero posible)
  -- UPDATE: cambio de status hacia/desde done, o cambio de function_type
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'done' AND NEW.project_id IS NOT NULL THEN
      PERFORM run_coverage_engine(NEW.project_id);
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- status pasó a 'done' o salió de 'done' → afecta tasks_execution_score
    IF (NEW.status = 'done' AND OLD.status <> 'done')
    OR (OLD.status = 'done' AND NEW.status <> 'done')
    -- function_type cambió en tarea done → afecta coverage de ambas funciones
    OR (NEW.status = 'done'
        AND OLD.function_type IS DISTINCT FROM NEW.function_type)
    THEN
      PERFORM run_coverage_engine(NEW.project_id);
    END IF;
  END IF;

  RETURN NULL;  -- AFTER trigger, valor de retorno ignorado
END;
$$;

CREATE OR REPLACE TRIGGER trg_tasks_coverage
  AFTER INSERT OR UPDATE OF status, function_type, completed_at
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_tasks_coverage();

-- =============================================================================
-- TRIGGER 2 — strategic_blocks
-- Dispara run_coverage_engine cuando:
--   a) Se inserta un bloque nuevo (puede bajar block_health_score)
--   b) resolved_at cambia (resolución → puede subir el score)
--   c) impact_weight cambia (puede cruzar el umbral 70 en cualquier dirección)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_blocks_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_coverage_engine(NEW.project_id);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.resolved_at IS DISTINCT FROM NEW.resolved_at
    OR OLD.impact_weight IS DISTINCT FROM NEW.impact_weight
    THEN
      PERFORM run_coverage_engine(NEW.project_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_blocks_coverage
  AFTER INSERT OR UPDATE OF resolved_at, impact_weight
  ON strategic_blocks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_blocks_coverage();

-- =============================================================================
-- TRIGGER 3 — process_artifacts
-- Dispara run_coverage_engine cuando:
--   a) Se inserta un artefacto nuevo
--   b) checklist_items_count cambia (puede cruzar el umbral 5)
--   c) last_used_at cambia (puede entrar o salir de la ventana 60d)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_artifacts_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_coverage_engine(NEW.project_id);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.checklist_items_count IS DISTINCT FROM NEW.checklist_items_count
    OR OLD.last_used_at IS DISTINCT FROM NEW.last_used_at
    THEN
      PERFORM run_coverage_engine(NEW.project_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_artifacts_coverage
  AFTER INSERT OR UPDATE OF checklist_items_count, last_used_at
  ON process_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_artifacts_coverage();

-- =============================================================================
-- TRIGGER 4 — project_functions (owner_user_id)
-- No estaba en la spec original de 3 triggers pero es necesario:
-- si no se añade, owner_assigned_score no se actualiza cuando el founder
-- asigna o cambia el owner de una función. Sin este trigger el score queda
-- desactualizado hasta el cron semanal.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_functions_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_coverage_engine(NEW.project_id);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
      PERFORM run_coverage_engine(NEW.project_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_functions_coverage
  AFTER INSERT OR UPDATE OF owner_user_id
  ON project_functions
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_functions_coverage();

-- =============================================================================
-- pg_cron: backstop semanal
-- Domingo 00:00 UTC — recalcula coverage de todos los proyectos activos.
-- (UTC+9 KST = domingo 09:00 → lunes 09:00 local si se cambia a lunes 00:00 UTC)
-- Para ajustar a "lunes por la mañana KST": cambiar a '0 15 * * 0' (UTC)
-- =============================================================================

SELECT cron.schedule(
  'weekly-coverage-engine',
  '0 0 * * 0',
  $$
    SELECT run_coverage_engine(id)
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
