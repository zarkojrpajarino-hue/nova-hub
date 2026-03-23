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
