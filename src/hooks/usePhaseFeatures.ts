/**
 * usePhaseFeatures — F19.C.2
 *
 * Hook de configuración por fase.
 * Sin nuevas queries — lee engineData cacheado de useProjectEngineData.
 *
 * Expone:
 *   phase            → fase actual (1-4)
 *   getTabStatus     → 'primary' | 'secondary' | 'teaser'
 *   getTeaserReason  → texto explicativo para PhaseTeaserModal
 *   getUnlockCondition → condición de desbloqueo (1 línea)
 *   getPhaseStats    → array de stat keys para dashboard
 *   getRelevanceScore → 0-3 para Kanban sorting
 *   isFocusTab       → true si la tab tiene badge "★ Foco"
 */

import { useProjectEngineData } from '@/hooks/useNovaDataOptimized'
import {
  PHASE_TAB_CONFIG,
  TAB_TEASER_REASONS,
  TAB_UNLOCK_CONDITIONS,
  PHASE_STATS_CONFIG,
  PRIMARY_FOCUS_TABS,
  PHASE_RELEVANCE,
  type TabStatus,
  type PhaseStatKey,
} from '@/lib/phase-features'

export function usePhaseFeatures(projectId: string | undefined) {
  const { data: engineData } = useProjectEngineData(projectId)
  const phase = engineData?.phaseState?.current_phase ?? 1

  return {
    phase,

    getTabStatus: (tabId: string): TabStatus =>
      PHASE_TAB_CONFIG[phase]?.[tabId] ?? 'secondary',

    getTeaserReason: (tabId: string): string =>
      TAB_TEASER_REASONS[tabId]?.[phase] ??
      'Disponible en una fase posterior.',

    getUnlockCondition: (tabId: string): string =>
      TAB_UNLOCK_CONDITIONS[tabId] ?? 'Disponible en una fase posterior.',

    getPhaseStats: (): PhaseStatKey[] =>
      PHASE_STATS_CONFIG[phase] ?? PHASE_STATS_CONFIG[1],

    getRelevanceScore: (functionType: string | null | undefined): number =>
      PHASE_RELEVANCE[phase]?.[functionType ?? 'support'] ?? 1,

    isFocusTab: (tabId: string): boolean =>
      (PRIMARY_FOCUS_TABS[phase] ?? []).includes(tabId),
  }
}
