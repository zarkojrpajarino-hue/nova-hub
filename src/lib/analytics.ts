/**
 * ANALYTICS — V11.7
 *
 * Módulo central de instrumentación de producto.
 * Todos los eventos pasan por aquí — un solo lugar para cambiar nombres,
 * propiedades o el proveedor.
 *
 * Proveedor: PostHog. Si VITE_POSTHOG_KEY no está configurado,
 * posthog.capture() es no-op (la librería no dispara nada).
 *
 * Convención de props: snake_case (estándar PostHog).
 *
 * Eventos del funnel principal:
 *   project_created → onboarding_started → onboarding_completed
 *   → engine_viewed → next_action_clicked → ritual_completed → reentry
 */

import posthog from 'posthog-js';

export function trackProjectCreated(props: { project_id: string }) {
  posthog.capture('project_created', props);
}

export function trackOnboardingStarted(props: { project_id: string }) {
  posthog.capture('onboarding_started', props);
}

export function trackOnboardingCompleted(props: { project_id: string }) {
  posthog.capture('onboarding_completed', props);
}

export function trackEngineViewed(props: { project_id: string; phase?: number }) {
  posthog.capture('engine_viewed', props);
}

/**
 * Fires both next_action_clicked AND first_engine_action.
 * In PostHog, use first-occurrence filter on either event to build the funnel.
 */
export function trackNextActionClicked(props: {
  project_id: string;
  action_type: string;
  phase?: number;
}) {
  posthog.capture('next_action_clicked', props);
  posthog.capture('first_engine_action', props);
}

export function trackRitualCompleted(props: {
  project_id: string;
  evaluation: string;
  phase?: number;
}) {
  posthog.capture('ritual_completed', props);
}

export function trackReentry(props: { project_id: string; absence_days: number }) {
  posthog.capture('reentry', props);
}

// ─────────────────────────────────────────────────────────────────────────────
// T17.32 — Evidencia y preferencias de fuente
// Mide si el usuario usa la trazabilidad (y si vale la pena seguir inviriendo en ella).
// ─────────────────────────────────────────────────────────────────────────────

export function trackEvidenceInspected(props: {
  project_id: string;
  insight_type: string;
  evidence_type: string;
}) {
  posthog.capture('evidence_inspected', props);
}

export function trackSourcePreferenceChanged(props: {
  project_id: string;
  source: string;
  action: 'enabled' | 'disabled' | 'weight_changed' | 'reset' | 'reset_all' | 'preset_applied';
  preset?: string;
}) {
  posthog.capture('source_preference_changed', props);
}

// ─────────────────────────────────────────────────────────────────────────────
// F19 — Focus Block · Task Loop · Ritual
// V11.V2.1 — 4 eventos para los sistemas de FASE 19.
// ─────────────────────────────────────────────────────────────────────────────

export function trackFocusBlockImpression(props: {
  project_id: string;
  urgency: string;
  source: string;
  phase?: number;
}) {
  posthog.capture('focus_block_impression', props);
}

export function trackFocusBlockCTAClicked(props: {
  project_id: string;
  action_type: string;
  urgency: string;
  source: string;
}) {
  posthog.capture('focus_block_cta_clicked', props);
}

/**
 * ENGINE BEHAVIOR FUNNEL — The chain that proves the system works:
 *   focus_block_impression → focus_block_cta_clicked → action_completed_post_cta → session_return_d1
 *
 * This event fires AFTER the user completes the action that the CTA suggested.
 * E.g., CTA = "Crear OBV" → user creates OBV → this fires.
 * The `originated_from` field links it back to the CTA click.
 */
export function trackActionCompletedPostCTA(props: {
  project_id: string;
  action_type: string;       // create_obv, add_metrics, create_task, define_channel, etc.
  originated_from: 'next_action' | 'first_steps' | 'moment' | 'nudge' | 'direct';
  time_to_complete_ms: number; // Time between CTA click and action completion
  phase: number;
}) {
  posthog.capture('action_completed_post_cta', props);
}

/**
 * Fires when user returns after 12h+ absence.
 * Combined with action_completed_post_cta, this measures retention.
 */
export function trackSessionReturn(props: {
  project_id: string;
  hours_since_last: number;
  phase: number;
  actions_last_session: number; // How many actions they completed last time
}) {
  posthog.capture('session_return', props);
}

export function trackTaskLoopTriggered(props: {
  project_id: string;
  task_count: number;
}) {
  posthog.capture('task_loop_triggered', props);
}

export function trackRitualStarted(props: {
  project_id: string;
  phase?: number;
}) {
  posthog.capture('ritual_started', props);
}

// V11.V2.1 — Phase teaser & task conversion events
export function trackPhaseTeaserTabClicked(props: {
  project_id: string;
  tab_name: string;
  current_phase: number;
}) {
  posthog.capture('phase_teaser_tab_clicked', props);
}

export function trackPhaseTeaserOverride(props: {
  project_id: string;
  tab_name: string;
}) {
  posthog.capture('phase_teaser_override', props);
}

export function trackTaskSiguienteAccionConverted(props: {
  project_id: string;
}) {
  posthog.capture('task_siguiente_accion_converted', props);
}

export function trackFocusBlockCtaClicked(props: {
  project_id: string;
  action_type: string;
}) {
  posthog.capture('focus_block_cta_clicked_v2', props);
}

// ─────────────────────────────────────────────────────────────────────────────
// I15.103–I15.107 — Integration observability events
// Track integration lifecycle: connection, sync, insights, actions, errors.
// ─────────────────────────────────────────────────────────────────────────────

/** I15.103 — Integration connected or disconnected */
export function trackIntegrationConnected(props: {
  project_id: string;
  provider: string;
  action: 'connected' | 'disconnected' | 'reconnected';
}) {
  posthog.capture('integration_connected', props);
}

/** I15.104 — Sync completed (success or partial) */
export function trackIntegrationSyncCompleted(props: {
  project_id: string;
  provider: string;
  status: 'completed' | 'partial' | 'failed';
  entities_synced?: number;
  duration_ms?: number;
}) {
  posthog.capture('integration_sync_completed', props);
}

/** I15.105 — Agent insight generated */
export function trackIntegrationInsightGenerated(props: {
  project_id: string;
  agent_type: string;
  insight_type: string;
  severity: string;
}) {
  posthog.capture('integration_insight_generated', props);
}

/** I15.106 — Action recommended by agent */
export function trackIntegrationActionRecommended(props: {
  project_id: string;
  agent_type: string;
  insight_type: string;
  action_hint: string;
}) {
  posthog.capture('integration_action_recommended', props);
}

/** I15.107 — Integration error occurred */
export function trackIntegrationError(props: {
  project_id: string;
  provider: string;
  error_type: string;
  error_message?: string;
}) {
  posthog.capture('integration_error', props);
}

// ─────────────────────────────────────────────────────────────────────────────
// V4.6.5 — TTFV (Time to First Value) tracking
// Fires when a user completes their first meaningful action:
//   first OBV, first task completed, first KPI.
// timeFromSignup = seconds between profile creation and this event.
// ─────────────────────────────────────────────────────────────────────────────

export type TTFVAction = 'first_obv' | 'first_task_completed' | 'first_kpi';

/**
 * Track Time-to-First-Value.
 * Call this from moment-detector handlers when first_obv, first_task_completed
 * or first_kpi moments are detected.
 */
export function trackTTFV(props: {
  project_id: string;
  action: TTFVAction;
  time_from_signup_seconds: number;
}) {
  posthog.capture('ttfv', {
    project_id: props.project_id,
    action: props.action,
    timeFromSignup: props.time_from_signup_seconds,
  });
}
