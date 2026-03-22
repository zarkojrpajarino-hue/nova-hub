-- =============================================================================
-- H7.9 — Cron Staggering
--
-- Separa los 14 cron jobs para evitar colisiones de BD.
-- Pipeline semanal: 5 min entre cada engine (00:00 → 00:30).
-- Jobs diarios: separados por 5 min cuando colisionaban.
-- =============================================================================

-- ── Pipeline semanal (Domingo) ─────────────────────────────────────────────

SELECT cron.unschedule('weekly-phase-engine');
SELECT cron.schedule('weekly-phase-engine', '0 0 * * 0',
  $$SELECT run_phase_engine(id) FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-coverage-engine');
SELECT cron.schedule('weekly-coverage-engine', '5 0 * * 0',
  $$SELECT run_coverage_engine(id) FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-probability-engine');
SELECT cron.schedule('weekly-probability-engine', '10 0 * * 0',
  $$SELECT run_probability_engine(id, 'weekly_job') FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-risk-engine');
SELECT cron.schedule('weekly-risk-engine', '15 0 * * 0',
  $$SELECT run_risk_engine(id, 'weekly_job') FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-viability-engine');
SELECT cron.schedule('weekly-viability-engine', '20 0 * * 0',
  $$SELECT run_viability_engine(id) FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-economic-profile');
SELECT cron.schedule('weekly-economic-profile', '25 0 * * 0',
  $$SELECT run_economic_profile_engine(id, 'weekly_job') FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

SELECT cron.unschedule('weekly-org-capacity');
SELECT cron.schedule('weekly-org-capacity', '30 0 * * 0',
  $$SELECT run_org_capacity_engine(id, 'weekly_job') FROM projects WHERE deleted_at IS NULL AND paused_at IS NULL$$);

-- ── Jobs domingo noche (separar reviews y optimus) ─────────────────────────

SELECT cron.unschedule('weekly-reviews-generator');
SELECT cron.schedule('weekly-reviews-generator', '0 22 * * 0',
  $$SELECT generate_all_weekly_reviews()$$);

SELECT cron.unschedule('weekly-optimus-profiles');
SELECT cron.schedule('weekly-optimus-profiles', '5 22 * * 0',
  $$SELECT update_all_optimus_profiles()$$);

-- ── Jobs diarios (separar colisiones 08:00) ────────────────────────────────

SELECT cron.unschedule('notification-health-snapshot');
SELECT cron.schedule('notification-health-snapshot', '55 7 * * *',
  $$SELECT capture_notification_health_snapshot('production')$$);

SELECT cron.unschedule('daily_bet_invalidation_check');
SELECT cron.schedule('daily_bet_invalidation_check', '5 8 * * *',
  $$SELECT refresh_bet_invalidations()$$);

-- cycle-checks ya está en lunes 08:00, sin colisión → no tocar
-- daily-trial-expiration ya está en 06:00, sin colisión → no tocar
-- notification-batch cada 6h, sin colisión → no tocar
