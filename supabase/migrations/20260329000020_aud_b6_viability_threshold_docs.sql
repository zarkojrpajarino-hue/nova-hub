-- =============================================================================
-- AUD.B.6 — Document viability threshold criteria with COMMENT ON
-- =============================================================================
-- The thresholds T1-T4 in run_viability_engine() were defined in F1.10 but
-- lacked formal SQL-level documentation of WHY each value was chosen.
-- This migration adds COMMENT ON to the viability_events table and its columns.
-- No logic change — documentation only.
-- =============================================================================

COMMENT ON TABLE viability_events IS
  'F1.10 · Viability warning events. Each row = one trigger condition evaluated per project. '
  'Triggers: T1(stagnation) T2(margin_risk) T3(overload) T4(weak_validation). '
  'Motor de advertencia — no bloquea, no altera scores.';

COMMENT ON COLUMN viability_events.trigger_type IS
  'Trigger identifier. Values: '
  'stagnation (T1): iteration_velocity=0 in 28d AND phase_score<75 — project stuck with no outcomes for a full sprint cycle. '
  'Threshold 75: matches phase advancement minimum (ENGINE_SPEC_V1 §Phase). '
  'margin_risk (T2): ≥2 months with revenue>0 AND costs>revenue (negative margin). '
  'Only fires at HIGH confidence (requires cost data registered). Immediate → critical status. '
  'Threshold 2 months: avoids false positive from single bad month. '
  'overload (T3): growth_rate ≥ sector_p50_benchmark AND capacity_health<55. '
  'Threshold 55: midpoint of org capacity scale (0-100) — below indicates team strain. '
  'Benchmark fallback: 5% monthly if no sector benchmark available (F1.10 spec). '
  'weak_validation (T4): validation_strength<40 AND ≥42 days (6 weeks) in same phase. '
  'Threshold 40: below this, peer validation is statistically unreliable. '
  'Threshold 42d: two full sprint cycles stuck — enough signal that progress is genuinely blocked.';

COMMENT ON COLUMN viability_events.consecutive_count IS
  'How many consecutive engine runs found this trigger active. '
  'consecutive_count ≥ 2 → viability_status=stagnation. '
  'consecutive_count ≥ 3 → viability_status=critical. '
  'Rationale: one occurrence could be noise; two is a pattern; three is systemic.';

COMMENT ON COLUMN viability_events.confidence IS
  'Data confidence for this trigger evaluation. '
  'T2 requires HIGH (cost data present). Others default to LOW until integration data arrives. '
  'LOW confidence triggers still create events but do not escalate to critical.';
