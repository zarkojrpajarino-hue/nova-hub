/**
 * V4.6.6 — Churn Risk Score
 *
 * Computes a 0-100 risk score based on:
 *   - Days since last login (weight 30)
 *   - Activity log frequency  (weight 25)
 *   - OBV count               (weight 25)
 *   - Task completion rate     (weight 20)
 *
 * Higher score = higher risk of churn.
 * Pure function — no side effects.
 */

export interface ChurnRiskInput {
  /** Days since the user's last login (0 = today) */
  daysSinceLastLogin: number;
  /** Number of activity_log entries in the last 30 days */
  activityCount30d: number;
  /** Total OBVs created by the user in this project */
  obvCount: number;
  /** Fraction of tasks assigned that are completed: done / total (0-1, NaN-safe) */
  taskCompletionRate: number;
}

export interface ChurnRiskResult {
  /** 0 = no risk, 100 = very high risk */
  score: number;
  /** Human-readable label */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Breakdown of each component (0-100 range each, before weighting) */
  breakdown: {
    loginRecency: number;
    activityFrequency: number;
    obvEngagement: number;
    taskCompletion: number;
  };
}

/**
 * Compute churn risk. All inputs are non-negative numbers.
 */
export function computeChurnRisk(input: ChurnRiskInput): ChurnRiskResult {
  // ── Login recency risk (0-100) ──
  // 0 days → 0, 3 days → 15, 7 days → 35, 14 days → 70, 30+ → 100
  const loginRisk = Math.min(100, (input.daysSinceLastLogin / 30) * 100);

  // ── Activity frequency risk (0-100) ──
  // 30+ activities/month → 0, 15 → 25, 5 → 75, 0 → 100
  const actRisk = input.activityCount30d >= 30
    ? 0
    : Math.min(100, ((30 - input.activityCount30d) / 30) * 100);

  // ── OBV engagement risk (0-100) ──
  // 10+ OBVs → 0, 5 → 25, 1 → 60, 0 → 100
  const obvRisk = input.obvCount >= 10
    ? 0
    : input.obvCount === 0
      ? 100
      : Math.min(100, ((10 - input.obvCount) / 10) * 100);

  // ── Task completion risk (0-100) ──
  // rate 1.0 → 0, 0.5 → 50, 0 → 100
  const safeRate = Number.isFinite(input.taskCompletionRate)
    ? Math.max(0, Math.min(1, input.taskCompletionRate))
    : 0;
  const taskRisk = (1 - safeRate) * 100;

  // Weighted sum
  const score = Math.round(
    loginRisk * 0.30 +
    actRisk * 0.25 +
    obvRisk * 0.25 +
    taskRisk * 0.20,
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  const level: ChurnRiskResult['level'] =
    clampedScore >= 75 ? 'critical' :
    clampedScore >= 50 ? 'high' :
    clampedScore >= 25 ? 'medium' : 'low';

  return {
    score: clampedScore,
    level,
    breakdown: {
      loginRecency: Math.round(loginRisk),
      activityFrequency: Math.round(actRisk),
      obvEngagement: Math.round(obvRisk),
      taskCompletion: Math.round(taskRisk),
    },
  };
}
