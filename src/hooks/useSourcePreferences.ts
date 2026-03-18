/**
 * useSourcePreferences — T17.24
 *
 * Lee y mutatea project_source_preferences vía Supabase.
 * Expone la tabla como ProjectSourcePreferences (Record<ProviderSlug, {...}>).
 * Filas no presentes en DB → defaults (todos habilitados, sin overrides).
 *
 * queryKey: ['source_preferences', projectId]
 * Invalidación automática tras cada mutación.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  SOURCE_WEIGHTS,
  type ProviderSlug,
  type ProjectSourcePreferences,
} from '@/lib/evidence'
import { trackSourcePreferenceChanged } from '@/lib/analytics'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SourcePref {
  enabled:          boolean
  weight_override?: number       // 0.1–1.0, undefined = usar SOURCE_WEIGHTS default
  excluded_fields?: string[]
}

export interface UseSourcePreferencesReturn {
  preferences:      ProjectSourcePreferences
  isLoading:        boolean
  updatePreference: (source: ProviderSlug, update: Partial<SourcePref>) => Promise<void>
  resetPreference:  (source: ProviderSlug) => Promise<void>   // vuelve a defaults
  resetAll:         () => Promise<void>
}

type DbRow = {
  source:          string
  enabled:         boolean
  weight_override: number | null
  excluded_fields: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_SLUGS: ProviderSlug[] = [
  'stripe', 'hubspot', 'asana', 'google_calendar',
  'holded', 'user_manual', 'ai_inferred',
]

/** Preferencias por defecto: todas habilitadas, sin overrides */
function buildDefaults(): ProjectSourcePreferences {
  return Object.fromEntries(
    ALL_SLUGS.map(s => [s, { enabled: true, weight_override: undefined, excluded_fields: [] }])
  ) as ProjectSourcePreferences
}

/**
 * Convierte filas de DB a ProjectSourcePreferences, rellenando con defaults
 * las fuentes que no tienen fila en DB.
 */
function rowsToPreferences(rows: DbRow[]): ProjectSourcePreferences {
  const prefs = buildDefaults()
  for (const row of rows) {
    const source = row.source as ProviderSlug
    if (source in prefs) {
      prefs[source] = {
        enabled:          row.enabled,
        weight_override:  row.weight_override ?? undefined,
        excluded_fields:  row.excluded_fields ?? [],
      }
    }
  }
  return prefs
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSourcePreferences(projectId: string | undefined): UseSourcePreferencesReturn {
  const queryClient = useQueryClient()
  const queryKey = ['source_preferences', projectId]

  // ── Lectura ──────────────────────────────────────────────────────────────
  const { data: preferences = buildDefaults(), isLoading } = useQuery({
    queryKey,
    enabled:   !!projectId,
    staleTime: 60_000,
    queryFn:   async () => {
      const { data, error } = await supabase
        .from('project_source_preferences')
        .select('source, enabled, weight_override, excluded_fields')
        .eq('project_id', projectId!)
      if (error) throw error
      return rowsToPreferences((data ?? []) as DbRow[])
    },
  })

  // ── Mutación: upsert de una fuente ───────────────────────────────────────
  const { mutateAsync: upsertAsync } = useMutation({
    mutationFn: async ({
      source, update,
    }: { source: ProviderSlug; update: Partial<SourcePref> }) => {
      const current = preferences[source]
      const { error } = await supabase
        .from('project_source_preferences')
        .upsert({
          project_id:      projectId!,
          source,
          enabled:         update.enabled         ?? current.enabled,
          weight_override: update.weight_override  ?? current.weight_override ?? null,
          excluded_fields: update.excluded_fields  ?? current.excluded_fields ?? [],
          updated_at:      new Date().toISOString(),
        }, { onConflict: 'project_id,source' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  // ── Mutación: eliminar fila de una fuente (reset a defaults) ─────────────
  const { mutateAsync: deleteOneAsync } = useMutation({
    mutationFn: async (source: ProviderSlug) => {
      const { error } = await supabase
        .from('project_source_preferences')
        .delete()
        .eq('project_id', projectId!)
        .eq('source', source)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  // ── Mutación: eliminar todas las filas del proyecto (reset total) ─────────
  const { mutateAsync: deleteAllAsync } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('project_source_preferences')
        .delete()
        .eq('project_id', projectId!)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    preferences,
    isLoading,
    updatePreference: (source, update) => {
      // T17.32 — tracking PostHog
      if (projectId) {
        const action = update.enabled === false
          ? 'disabled'
          : update.enabled === true
            ? 'enabled'
            : 'weight_changed'
        trackSourcePreferenceChanged({ project_id: projectId, source, action })
      }
      return upsertAsync({ source, update })
    },
    resetPreference: (source) => {
      if (projectId) {
        trackSourcePreferenceChanged({ project_id: projectId, source, action: 'reset' })
      }
      return deleteOneAsync(source)
    },
    resetAll: () => {
      if (projectId) {
        trackSourcePreferenceChanged({
          project_id: projectId,
          source: 'all',
          action: 'reset_all',
        })
      }
      return deleteAllAsync()
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Presets de preferencias — T17.25
// ─────────────────────────────────────────────────────────────────────────────

/** Peso default de cada fuente (SOURCE_WEIGHTS) */
export const PRESET_BALANCED: Partial<Record<ProviderSlug, SourcePref>> = {}  // reset → usar defaults

/** Solo datos verificados: externos fuertes, entradas manuales débiles */
export const PRESET_VERIFIED: Partial<Record<ProviderSlug, SourcePref>> = {
  stripe:          { enabled: true,  weight_override: 1.0 },
  holded:          { enabled: true,  weight_override: 0.9 },
  hubspot:         { enabled: true,  weight_override: 0.8 },
  asana:           { enabled: true,  weight_override: 0.8 },
  google_calendar: { enabled: true,  weight_override: 0.75 },
  user_manual:     { enabled: true,  weight_override: 0.2 },
  ai_inferred:     { enabled: true,  weight_override: 0.1 },
}

/** Priorizar mis datos: manual alto, externos moderados */
export const PRESET_MANUAL: Partial<Record<ProviderSlug, SourcePref>> = {
  stripe:          { enabled: true,  weight_override: 0.5 },
  holded:          { enabled: true,  weight_override: 0.5 },
  hubspot:         { enabled: true,  weight_override: 0.5 },
  asana:           { enabled: true,  weight_override: 0.5 },
  google_calendar: { enabled: true,  weight_override: 0.5 },
  user_manual:     { enabled: true,  weight_override: 0.9 },
  ai_inferred:     { enabled: true,  weight_override: 0.3 },
}

/** Devuelve los pesos de SOURCE_WEIGHTS para mostrar en placeholder del slider */
export function getDefaultWeight(source: ProviderSlug): number {
  return SOURCE_WEIGHTS[source] ?? 0.5
}
