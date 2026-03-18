-- ============================================================
-- 20260313000055_fase11_weekly_review_read_at.sql
--
-- V11.3: read_at en weekly_reviews
--
-- Qué hace:
--   ADD COLUMN read_at TIMESTAMPTZ a weekly_reviews.
--
-- Para qué sirve:
--   weekly_pending = latest_review.read_at IS NULL
--
--   Sin este campo no hay forma de distinguir una review que el
--   founder ya leyó de una que aún no ha visto. El criterio
--   "existe una review esta semana" no es suficiente — el founder
--   puede haber visitado el proyecto después de que se generó.
--
-- Cómo se usa:
--   1. Cron genera weekly_review el domingo → read_at = NULL.
--   2. Frontend detecta weekly_pending = read_at IS NULL.
--   3. Weekly Surface se activa.
--   4. Founder hace click en "Continue execution".
--   5. Frontend hace UPDATE weekly_reviews SET read_at = NOW()
--      WHERE id = <review_id>.
--   6. weekly_pending = FALSE.
--
-- Nota: read_at NULL en reviews antiguas (ya existentes) es OK —
--   esas reviews son de semanas pasadas y el hook solo mira la
--   más reciente. Si la más reciente es NULL, hay una review no leída.
--   Para reviews creadas antes de esta migración: read_at = NULL
--   las hace aparecer como "no leídas". Fix mínimo si hace falta:
--   UPDATE weekly_reviews SET read_at = created_at
--   WHERE created_at < NOW() - INTERVAL '7 days';
--   (ejecutar manualmente en prod si hay datos existentes)
--
-- Sin efectos sobre RLS ni índices existentes.
-- ============================================================

ALTER TABLE weekly_reviews
  ADD COLUMN read_at TIMESTAMPTZ;

COMMENT ON COLUMN weekly_reviews.read_at IS
  'Timestamp en que el founder marcó esta review como leída (click "Continue execution"). '
  'NULL = no leída / weekly_pending = TRUE. '
  'NOT NULL = leída / weekly_pending = FALSE. '
  'Seteado por el frontend vía UPDATE cuando el founder sale de la Weekly Surface.';
