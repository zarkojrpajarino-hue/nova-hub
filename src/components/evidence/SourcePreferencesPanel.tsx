/**
 * SourcePreferencesPanel — T17.25
 *
 * Permite al usuario configurar qué fuentes usa el sistema de evidencia
 * y con qué peso. Solo muestra fuentes realmente conectadas.
 *
 * Reglas de diseño (AGENTS_CONTRACT.md §12 + T17.25):
 * - Solo fuentes con integration_connections.status='active' son configurables.
 * - Si todas las conexiones activas están desactivadas → mostrar advertencia,
 *   bloquear guardar (constraint: al menos 1 fuente habilitada).
 * - Modo básico: solo toggle on/off.
 * - Modo avanzado: toggle + slider de peso (0.1–1.0).
 * - 3 presets disponibles en la cabecera.
 */

import { useState } from 'react'
import { Settings2, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useSourcePreferences, getDefaultWeight, PRESET_VERIFIED, PRESET_MANUAL, type SourcePref } from '@/hooks/useSourcePreferences'
import type { ProviderSlug } from '@/lib/evidence'
import { trackSourcePreferenceChanged } from '@/lib/analytics'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata visual de cada proveedor
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderMeta {
  label:       string
  description: string
  color:       string  // Tailwind text color
}

const PROVIDER_META: Record<ProviderSlug, ProviderMeta> = {
  stripe:          { label: 'Stripe Payments',    description: 'Ingresos, suscripciones, pagos',     color: 'text-indigo-500' },
  holded:          { label: 'Holded ERP',          description: 'Contabilidad, facturas, márgenes',   color: 'text-emerald-600' },
  hubspot:         { label: 'HubSpot CRM',         description: 'Pipeline de ventas, deals',           color: 'text-orange-500' },
  asana:           { label: 'Asana',               description: 'Tareas, sprints, ejecución',          color: 'text-pink-500' },
  google_calendar: { label: 'Google Calendar',     description: 'Reuniones, agenda, carga horaria',   color: 'text-blue-500' },
  user_manual:     { label: 'Entradas manuales',   description: 'Datos declarados por ti',            color: 'text-muted-foreground' },
  ai_inferred:     { label: 'Inferencias IA',      description: 'Derivadas por el sistema',           color: 'text-purple-500' },
}

// Las fuentes que pueden venir de integration_connections (provider field)
const INTEGRATION_PROVIDERS: ProviderSlug[] = [
  'stripe', 'holded', 'hubspot', 'asana', 'google_calendar',
]

// user_manual y ai_inferred son siempre configurables (no requieren conexión)
const ALWAYS_AVAILABLE: ProviderSlug[] = ['user_manual', 'ai_inferred']

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface SourcePreferencesPanelProps {
  projectId: string
  /** Mapa provider → status activo (de useIntegrationConnections) */
  activeProviders: Set<string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SourcePreferencesPanel({
  projectId,
  activeProviders,
}: SourcePreferencesPanelProps) {
  const { preferences, isLoading, updatePreference, resetPreference, resetAll } =
    useSourcePreferences(projectId)

  const [advancedMode, setAdvancedMode] = useState(false)
  const [savingSource, setSavingSource] = useState<string | null>(null)

  // Fuentes configurables: conectadas activas + siempre disponibles
  const configurableSources: ProviderSlug[] = [
    ...INTEGRATION_PROVIDERS.filter(p => activeProviders.has(p)),
    ...ALWAYS_AVAILABLE,
  ]

  // Estado vacío: ninguna integración activa (excepto siempre-disponibles)
  const hasNoIntegrations = !INTEGRATION_PROVIDERS.some(p => activeProviders.has(p))

  // Constraint: al menos 1 fuente habilitada
  const enabledCount = configurableSources.filter(s => preferences[s].enabled).length
  const allDisabled  = enabledCount === 0

  // ── Toggle fuente ─────────────────────────────────────────────────────────
  async function handleToggle(source: ProviderSlug, enabled: boolean) {
    // Bloquear deshabilitar si solo queda 1 habilitada
    if (!enabled && enabledCount <= 1) return
    setSavingSource(source)
    try {
      await updatePreference(source, { enabled })
    } finally {
      setSavingSource(null)
    }
  }

  // ── Cambio de peso ────────────────────────────────────────────────────────
  async function handleWeightChange(source: ProviderSlug, value: number[]) {
    const weight = Math.round(value[0] * 10) / 10  // redondear a 1 decimal
    setSavingSource(source)
    try {
      await updatePreference(source, { weight_override: weight })
    } finally {
      setSavingSource(null)
    }
  }

  // ── Reset fuente ──────────────────────────────────────────────────────────
  async function handleReset(source: ProviderSlug) {
    setSavingSource(source)
    try {
      await resetPreference(source)
    } finally {
      setSavingSource(null)
    }
  }

  // ── Preset: Balanceado (resetAll) ─────────────────────────────────────────
  async function applyPresetBalanced() {
    trackSourcePreferenceChanged({ project_id: projectId, source: 'all', action: 'preset_applied', preset: 'balanced' })
    await resetAll()
  }

  // ── Preset: Solo datos verificados ───────────────────────────────────────
  async function applyPresetVerified() {
    trackSourcePreferenceChanged({ project_id: projectId, source: 'all', action: 'preset_applied', preset: 'verified' })
    await resetAll()
    for (const [source, pref] of Object.entries(PRESET_VERIFIED) as [ProviderSlug, SourcePref][]) {
      if (configurableSources.includes(source)) {
        await updatePreference(source, pref)
      }
    }
  }

  // ── Preset: Priorizar mis datos ───────────────────────────────────────────
  async function applyPresetManual() {
    trackSourcePreferenceChanged({ project_id: projectId, source: 'all', action: 'preset_applied', preset: 'manual' })
    await resetAll()
    for (const [source, pref] of Object.entries(PRESET_MANUAL) as [ProviderSlug, SourcePref][]) {
      if (configurableSources.includes(source)) {
        await updatePreference(source, pref)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Fuentes de datos</span>
        </div>
        <button
          onClick={() => setAdvancedMode(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {advancedMode ? 'Modo básico' : 'Configuración avanzada'}
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={applyPresetBalanced}
          className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
        >
          Balanceado
        </button>
        <button
          onClick={applyPresetVerified}
          className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
        >
          Solo datos verificados
        </button>
        <button
          onClick={applyPresetManual}
          className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
        >
          Priorizar mis datos
        </button>
      </div>

      {/* Empty state: ninguna integración conectada */}
      {hasNoIntegrations && (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Conecta una integración para configurar sus fuentes.
          </p>
        </div>
      )}

      {/* Constraint warning */}
      {allDisabled && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={12} />
          Al menos una fuente debe estar habilitada.
        </div>
      )}

      {/* Source list */}
      <div className="space-y-2">
        {configurableSources.map(source => {
          const pref    = preferences[source]
          const meta    = PROVIDER_META[source]
          const isSaving = savingSource === source
          const defaultWeight = getDefaultWeight(source)
          const currentWeight = pref.weight_override ?? defaultWeight
          const isOverridden  = pref.weight_override !== undefined

          return (
            <div
              key={source}
              className={`rounded-lg border p-3 transition-colors ${
                pref.enabled ? 'border-border/60 bg-card' : 'border-border/30 bg-muted/20'
              }`}
            >
              {/* Row: toggle + label + optional reset */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={pref.enabled}
                  disabled={isSaving || (!pref.enabled && enabledCount === 0)}
                  onCheckedChange={v => handleToggle(source, v)}
                  className="shrink-0 h-5 w-9"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${pref.enabled ? meta.color : 'text-muted-foreground'}`}>
                    {meta.label}
                    {isSaving && <span className="ml-1.5 text-muted-foreground/60 font-normal">Guardando…</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{meta.description}</p>
                </div>
                {/* Peso actual */}
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${!pref.enabled ? 'opacity-40' : ''}`}
                >
                  {(currentWeight * 100).toFixed(0)}%
                </Badge>
                {/* Reset si hay override */}
                {isOverridden && (
                  <button
                    onClick={() => handleReset(source)}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                    title="Restaurar peso por defecto"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </div>

              {/* Slider — solo en modo avanzado + fuente habilitada */}
              {advancedMode && pref.enabled && (
                <div className="mt-2.5 px-0.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Peso</span>
                    <span className="font-mono">{currentWeight.toFixed(1)}</span>
                  </div>
                  <Slider
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={[currentWeight]}
                    onValueCommit={v => handleWeightChange(source, v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground/60">
                    <span>0.1</span>
                    <span>Default: {defaultWeight.toFixed(1)}</span>
                    <span>1.0</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Nota de comportamiento */}
      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        Los cambios se aplican en el siguiente análisis. Los datos ya sincronizados no se eliminan
        — solo dejan de usarse en resoluciones futuras.
      </p>
    </div>
  )
}
