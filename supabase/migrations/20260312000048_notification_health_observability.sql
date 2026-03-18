-- ============================================================================
-- MIGRACIÓN 00048 — Runtime observabilidad: 3 views + snapshot diario
--
-- Componentes:
--   1. notification_health_snapshots — histórico de métricas de salud
--   2. v_notif_health_volume         — volumen por tipo/severidad/día (14d)
--   3. v_notif_health_critical       — críticas: unread/emailed/read (14d)
--   4. v_notif_health_per_entity     — por usuario y proyecto (7d)
--   5. capture_notification_health_snapshot(env) — función de captura
--   6. pg_cron '0 8 * * *'           — snapshot diario automático 08:00 UTC
--
-- Propósito: proveer evidencia del comportamiento durante el calibration gate
-- (2 semanas mínimas) para justificar el paso a FASE 8.
-- Sin esto: al final de las 2 semanas solo existe "cómo está hoy".
-- Con esto: existe la serie temporal completa (día 1 → día 14).
-- ============================================================================


-- ── 1. Tabla de snapshots ────────────────────────────────────────────────────

CREATE TABLE notification_health_snapshots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  panel        TEXT        NOT NULL CHECK (panel IN ('volume', 'critical', 'per_entity')),
  environment  TEXT        NOT NULL DEFAULT 'production',
  data         JSONB       NOT NULL
);

CREATE INDEX idx_health_snapshots_panel_at
  ON notification_health_snapshots (panel, captured_at DESC);

COMMENT ON TABLE notification_health_snapshots IS
  'Snapshot diario de métricas de salud del motor de notificaciones. '
  '3 filas por ejecución (volume / critical / per_entity). '
  'Evidencia para el calibration gate FASE 7 → FASE 8.';

COMMENT ON COLUMN notification_health_snapshots.panel IS
  'volume: totales por tipo/severidad/día | '
  'critical: breakdown unread/emailed/read | '
  'per_entity: por usuario y proyecto';

COMMENT ON COLUMN notification_health_snapshots.environment IS
  'production | staging — separar contextos al comparar snapshots.';

-- RLS: datos internos — solo acceso con service role (bypasses RLS siempre)
ALTER TABLE notification_health_snapshots ENABLE ROW LEVEL SECURITY;


-- ── 2. Views de lectura inmediata ────────────────────────────────────────────
--
-- Accesibles desde el Supabase dashboard o via GET /rest/v1/<view> con
-- service role. No requieren copy-paste de SQL.
--
-- Nota RLS: views creadas por postgres (owner = superuser) con
-- security_invoker=false (default PG15) acceden a las tablas base como
-- el owner → bypasan RLS. Correcto para monitoreo interno.

-- ── View 1: Volumen por tipo/severidad/día ───────────────────────────────────

CREATE OR REPLACE VIEW v_notif_health_volume AS
SELECT DATE_TRUNC('day', created_at)::date AS day,
       priority,
       type,
       COUNT(*)                             AS total
FROM   notifications
WHERE  created_at > NOW() - INTERVAL '14 days'
GROUP  BY 1, 2, 3
ORDER  BY 1 DESC, 2, 4 DESC;

COMMENT ON VIEW v_notif_health_volume IS
  'Panel 1: volumen por tipo, severidad y día (últimos 14 días). '
  'Alarma: capa desaparecida (0 filas de un tipo que existía ayer) '
  'o spike > 2x en cualquier tipo/día.';

-- ── View 2: Estado de notificaciones críticas ────────────────────────────────

CREATE OR REPLACE VIEW v_notif_health_critical AS
SELECT type,
       COUNT(*)                                                                     AS total,
       COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NULL)                     AS unread_not_emailed,
       COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NOT NULL)                 AS unread_emailed,
       COUNT(*) FILTER (WHERE read)                                                 AS read_count,
       ROUND(AVG(CASE WHEN read                  THEN 1 ELSE 0 END)::numeric, 2)   AS read_ratio,
       ROUND(AVG(CASE WHEN emailed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric, 2)  AS email_ratio
FROM   notifications
WHERE  priority   = 'critical'
  AND  created_at > NOW() - INTERVAL '14 days'
GROUP  BY type
ORDER  BY total DESC;

COMMENT ON VIEW v_notif_health_critical IS
  'Panel 2: breakdown de críticas (últimos 14 días). '
  'Gate: read_ratio > 0.90 (críticas ignoradas < 10%) · '
  'email_ratio 0.05–0.60 (ni subnotificación ni ruido).';

-- ── View 3: Notificaciones por usuario y proyecto ────────────────────────────

CREATE OR REPLACE VIEW v_notif_health_per_entity AS
SELECT n.user_id,
       (n.metadata->>'project_id')::uuid AS project_id,
       p.nombre                           AS project_name,
       COUNT(*)                           AS total,
       COUNT(*) FILTER (WHERE n.priority = 'critical') AS critical_count
FROM   notifications n
LEFT   JOIN projects p ON p.id = (n.metadata->>'project_id')::uuid
WHERE  n.created_at > NOW() - INTERVAL '7 days'
GROUP  BY 1, 2, 3
ORDER  BY critical_count DESC, total DESC;

COMMENT ON VIEW v_notif_health_per_entity IS
  'Panel 3: notificaciones por usuario y proyecto (últimos 7 días). '
  'Alarma: user critical_count > 2/semana (caps rotos) · '
  'project total >> resto (proyecto patológico).';


-- ── 3. Función de captura ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION capture_notification_health_snapshot(
  p_environment TEXT DEFAULT 'production'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_volume     JSONB;
  v_critical   JSONB;
  v_per_entity JSONB;
BEGIN
  -- Panel 1: volume
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'day',      day,
        'priority', priority,
        'type',     type,
        'total',    total
      ) ORDER BY day DESC, total DESC
    ),
    '[]'::jsonb
  )
  INTO v_volume
  FROM (
    SELECT DATE_TRUNC('day', created_at)::date AS day,
           priority, type, COUNT(*) AS total
    FROM   notifications
    WHERE  created_at > NOW() - INTERVAL '14 days'
    GROUP  BY 1, 2, 3
  ) sub;

  -- Panel 2: critical
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'type',               type,
        'total',              total,
        'unread_not_emailed', unread_not_emailed,
        'unread_emailed',     unread_emailed,
        'read_count',         read_count,
        'read_ratio',         read_ratio,
        'email_ratio',        email_ratio
      ) ORDER BY total DESC
    ),
    '[]'::jsonb
  )
  INTO v_critical
  FROM (
    SELECT type,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NULL)     AS unread_not_emailed,
           COUNT(*) FILTER (WHERE NOT read AND emailed_at IS NOT NULL) AS unread_emailed,
           COUNT(*) FILTER (WHERE read)                                 AS read_count,
           ROUND(AVG(CASE WHEN read                  THEN 1 ELSE 0 END)::numeric, 2) AS read_ratio,
           ROUND(AVG(CASE WHEN emailed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric, 2) AS email_ratio
    FROM   notifications
    WHERE  priority   = 'critical'
      AND  created_at > NOW() - INTERVAL '14 days'
    GROUP  BY type
  ) sub;

  -- Panel 3: per_entity
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id',        user_id,
        'project_id',     project_id,
        'project_name',   project_name,
        'total',          total,
        'critical_count', critical_count
      ) ORDER BY critical_count DESC, total DESC
    ),
    '[]'::jsonb
  )
  INTO v_per_entity
  FROM (
    SELECT n.user_id,
           (n.metadata->>'project_id')::uuid AS project_id,
           p.nombre AS project_name,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE n.priority = 'critical') AS critical_count
    FROM   notifications n
    LEFT   JOIN projects p ON p.id = (n.metadata->>'project_id')::uuid
    WHERE  n.created_at > NOW() - INTERVAL '7 days'
    GROUP  BY 1, 2, 3
  ) sub;

  INSERT INTO notification_health_snapshots (panel, environment, data)
  VALUES
    ('volume',     p_environment, v_volume),
    ('critical',   p_environment, v_critical),
    ('per_entity', p_environment, v_per_entity);
END;
$$;

COMMENT ON FUNCTION capture_notification_health_snapshot(TEXT) IS
  'Captura los 3 paneles de salud en notification_health_snapshots. '
  'Llamada por pg_cron diariamente a las 08:00 UTC. '
  'p_environment: production | staging (default: production).';


-- ── 4. pg_cron: snapshot diario 08:00 UTC ────────────────────────────────────

SELECT cron.schedule(
  'notification-health-snapshot',
  '0 8 * * *',
  $$SELECT capture_notification_health_snapshot('production');$$
);


-- ── 5. Snapshot inicial (baseline día 0) ─────────────────────────────────────
--
-- Captura el estado actual como punto de partida de la serie temporal.
-- Sin esto, el día 1 del pg_cron sería el primer dato y se perdería el baseline.

SELECT capture_notification_health_snapshot('production');
