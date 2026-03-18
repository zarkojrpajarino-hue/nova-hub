-- ============================================================================
-- MIGRACIÓN 00045 — Fix: notify_bottlenecks — column "created_at" no existe
--
-- Root cause:
--   notify_bottlenecks() (migration 00036) referencia
--   strategic_blocks.created_at en la condición:
--     AND created_at > NOW() - INTERVAL '6 hours'
--
--   La tabla strategic_blocks (migration 00002) NO tiene columna created_at.
--   Usa first_detected_at (TIMESTAMPTZ NOT NULL DEFAULT NOW()).
--
--   Impacto: dentro del loop per-proyecto de run_notification_batch(),
--   notify_bottlenecks lanza "column created_at does not exist" para CADA
--   proyecto. El EXCEPTION WHEN OTHERS captura el error y hace ROLLBACK de
--   todo el bloque BEGIN...EXCEPTION para ese proyecto, incluyendo las
--   notificaciones ya insertadas por notify_phase_changes (1),
--   notify_viability_changes (2) y notify_risk_changes (3). Resultado:
--   cero notificaciones de layers 2–5 a pesar de que las funciones
--   individuales funcionan correctamente.
--
-- Fix: cambiar created_at → first_detected_at en la query de strategic_blocks.
-- También: DROP de funciones de diagnóstico temporales 00043–00044.
-- ============================================================================

-- ── Fix notify_bottlenecks ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_bottlenecks(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block        RECORD;
  v_owner_id     UUID;
  v_project_name TEXT;
  v_project_url  TEXT;
BEGIN
  v_owner_id := get_project_owner(p_project_id);
  IF v_owner_id IS NULL THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- ── L5.3: bottleneck_detected ─────────────────────────────────────────────
  -- Bloqueos activos aparecidos en las últimas 6 horas (nueva aparición en ciclo).
  -- Fix 00045: strategic_blocks usa first_detected_at, no created_at.
  FOR v_block IN
    SELECT id, block_type, description
    FROM   strategic_blocks
    WHERE  project_id        = p_project_id
      AND  resolved_at       IS NULL
      AND  first_detected_at > NOW() - INTERVAL '6 hours'
  LOOP
    IF NOT check_notification_cap(v_owner_id, 'high') THEN
      EXIT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE  user_id            = v_owner_id
        AND  type               = 'bottleneck_detected'
        AND  metadata->>'block_id' = v_block.id::text
        AND  created_at         > NOW() - INTERVAL '7 days'
    ) THEN
      PERFORM create_notification(
        v_owner_id, 'bottleneck_detected', 'high',
        'Bloqueo detectado',
        format('"%s" tiene un nuevo bloqueo activo: %s',
          v_project_name,
          COALESCE(v_block.description, v_block.block_type)
        ),
        v_project_url, 'Ver bloqueos',
        jsonb_build_object(
          'project_id', p_project_id,
          'block_id',   v_block.id,
          'block_type', v_block.block_type
        )
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION notify_bottlenecks(UUID) IS
  'L5.3: bottleneck_detected para bloqueos activos creados en las últimas 6h. '
  'Fix 00045: usa first_detected_at (strategic_blocks no tiene created_at).';

-- ── Cleanup: funciones de diagnóstico temporales ────────────────────────────

DROP FUNCTION IF EXISTS debug_notification_batch();
DROP FUNCTION IF EXISTS debug_batch_loop();
