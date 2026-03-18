-- ============================================================================
-- MIGRACIÓN 00038 — N7.6: columna emailed_at en notifications
--
-- Añade emailed_at TIMESTAMPTZ para tracking de emails enviados por
-- el canal crítico (phase_regressed / viability_critical / cash_flow_alert).
--
-- La columna actúa como:
--   - marca de "ya enviado" (IS NULL → pendiente de email)
--   - timestamp del envío (para auditoría y dedup de 24h)
--
-- Solo las notificaciones de los 3 tipos críticos usan esta columna.
-- El resto permanece NULL indefinidamente (sin impacto en queries existentes).
-- ============================================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

-- Índice parcial: solo filas pendientes de email (emailed_at IS NULL).
-- Evita scan completo de la tabla cuando el edge function busca emails a enviar.
CREATE INDEX IF NOT EXISTS idx_notifications_email_queue
  ON notifications (type, created_at DESC)
  WHERE emailed_at IS NULL;

COMMENT ON COLUMN notifications.emailed_at IS
  'Timestamp del envío del email crítico. NULL = no enviado (o tipo no aplica). '
  'Solo phase_regressed, viability_critical, cash_flow_alert se marcan.';
