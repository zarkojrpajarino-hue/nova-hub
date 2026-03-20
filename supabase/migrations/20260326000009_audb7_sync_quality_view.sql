-- =============================================================================
-- MIGRACIÓN 20260326000009 — AUD.B.7: integration_sync_quality VIEW
--
-- Problema: cuando un sync de integración termina parcialmente (ej. Stripe
-- solo sincroniza 45 de 50 transacciones), los engines reciben datos
-- incompletos sin ninguna señal visual para el fundador. El Focus Block
-- puede mostrar un score basado en datos parciales sin advertencia.
--
-- Solución: vista integration_sync_quality que agrega la calidad del último
-- sync por connection. quality_pct = entities_written / entities_processed.
-- Threshold de warning: < 0.90 (< 90% de entidades procesadas escritas).
-- Status 'partial' siempre genera warning independientemente del %.
--
-- La vista se usa desde el hook useSyncQuality en el frontend para mostrar
-- "⚠ datos incompletos (X% sync)" junto al badge de estado de cada integración.
--
-- Decisión de diseño: VIEW en lugar de TABLE — la calidad es 100% derivada
-- de integration_sync_runs, no tiene estado propio. La vista siempre refleja
-- el último sync sin necesidad de triggers ni backfill.
-- =============================================================================

-- security_invoker = true: la vista hereda RLS del CALLER, no del definer.
-- Garantiza que project_id está protegido por las policies de integration_sync_runs.
CREATE OR REPLACE VIEW integration_sync_quality
  WITH (security_invoker = true)
AS
SELECT
  r.project_id,
  r.connection_id,
  r.provider,
  r.status                              AS last_sync_status,
  r.entities_processed,
  r.entities_written,
  r.entities_rejected,
  r.entities_skipped,
  r.completed_at                        AS last_sync_at,
  CASE
    WHEN r.entities_processed = 0 THEN 1.0
    ELSE ROUND(r.entities_written::NUMERIC / r.entities_processed, 3)
  END                                   AS quality_pct,
  -- Warning cuando: status='partial' O quality_pct < 0.90
  (
    r.status = 'partial'
    OR (
      r.entities_processed > 0
      AND r.entities_written::NUMERIC / r.entities_processed < 0.90
    )
  )                                     AS has_quality_warning
FROM integration_sync_runs r
WHERE r.status IN ('completed', 'partial')
  AND r.completed_at = (
    -- Solo el sync más reciente por connection
    SELECT MAX(r2.completed_at)
    FROM   integration_sync_runs r2
    WHERE  r2.connection_id = r.connection_id
      AND  r2.status IN ('completed', 'partial')
  );

COMMENT ON VIEW integration_sync_quality IS
  'AUD.B.7: Calidad del último sync por connection. '
  'quality_pct = entities_written / entities_processed (0–1). '
  'has_quality_warning = true si status=partial o quality_pct < 0.90. '
  'Usada por useSyncQuality() para mostrar badge de advertencia en IntegrationsView.';

-- Permisos para authenticated
GRANT SELECT ON integration_sync_quality TO authenticated;
