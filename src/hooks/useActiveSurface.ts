/**
 * useActiveSurface — AUD.M.3
 *
 * Máquina de estados explícita para la superficie activa del proyecto.
 *
 * Estados posibles:
 *   'engine'  — dashboard normal (estado base)
 *   'weekly'  — revisión semanal pendiente de leer
 *   'reset'   — ritual estratégico pendiente (siempre gana sobre weekly)
 *
 * Prioridad de transición (inmutable):
 *   reset > weekly > engine
 *
 * Transiciones:
 *   → reset   : ritualPending = true
 *   → weekly  : latestReview.read_at === null
 *   → engine  : fallback (ninguna condición anterior activa)
 *
 * Retorno automático a 'engine':
 *   - Tras leer weekly: useMarkWeeklyReviewRead() invalida ['weekly-review'],
 *     hasUnreadWeekly pasa a false, surface vuelve a 'engine' en el siguiente render.
 *   - Tras completar ritual: useSubmitRitual() invalida ['ritual-pending'],
 *     ritualPending pasa a false, surface vuelve a 'engine'.
 *   - No se usa setTimeout ni estado local — la transición es reactiva (React Query).
 *
 * isReentry: ausencia > 7 días desde last_seen_at. Usado como capa previa
 * en ProjectPage para mostrar ReentrySurface antes de cualquier surface.
 * No afecta la prioridad de surface.
 */

import {
  useProjectUserState,
  useRitualPending,
  useLatestWeeklyReview,
} from '@/hooks/useNovaDataOptimized';

export type ProjectSurface = 'engine' | 'weekly' | 'reset';

export interface ActiveSurfaceState {
  surface: ProjectSurface;
  isReentry: boolean;
  lastSeenAt: string | null;    // para calcular absenceDays en ReentrySurface
  weeklyReviewId: string | null;
  isLoading: boolean;
}

const REENTRY_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function useActiveSurface(
  projectId: string | undefined,
  userId: string | undefined,
): ActiveSurfaceState {
  const { data: lastSeenAt, isLoading: loadingUserState } = useProjectUserState(projectId, userId);
  const { data: ritualPending = false, isLoading: loadingRitual } = useRitualPending(projectId);
  const { data: latestReview, isLoading: loadingReview } = useLatestWeeklyReview(projectId);

  const isLoading = loadingUserState || loadingRitual || loadingReview;

  const isReentry =
    lastSeenAt != null &&
    Date.now() - new Date(lastSeenAt).getTime() > REENTRY_THRESHOLD_MS;

  const hasUnreadWeekly =
    latestReview != null && latestReview.read_at === null;

  // Máquina de estados: prioridad reset > weekly > engine
  let surface: ProjectSurface;
  if (ritualPending) surface = 'reset';
  else if (hasUnreadWeekly) surface = 'weekly';
  else surface = 'engine';

  return {
    surface,
    isReentry,
    lastSeenAt: lastSeenAt ?? null,
    weeklyReviewId: latestReview?.id ?? null,
    isLoading,
  };
}
