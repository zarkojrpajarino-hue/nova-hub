/**
 * useIntegrationConnections
 *
 * Lee el estado de las connections de integración para el proyecto actual.
 * Devuelve un mapa provider → IntegrationConnectionStatus.
 *
 * is_stale: derivado en lectura — true si last_sync_at > 7 días (I15.44).
 * No persiste estado mutable — solo lectura de integration_connections.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export type ConnectionStatus = 'active' | 'error' | 'disconnected' | 'not_connected'

export interface IntegrationConnectionStatus {
  connection_id: string | null
  status: ConnectionStatus
  connected_at: string | null
  last_sync_at: string | null
  error_message: string | null
  is_stale: boolean        // last_sync_at > 7 días (I15.44)
}

type RawConnection = {
  id: string
  provider: string
  status: string
  connected_at: string | null
  last_sync_at: string | null
  error_message: string | null
}

const STALE_THRESHOLD_DAYS = 7

function computeIsStale(last_sync_at: string | null): boolean {
  if (!last_sync_at) return false
  const diff = Date.now() - new Date(last_sync_at).getTime()
  return diff > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
}

function toConnectionStatus(raw: RawConnection): IntegrationConnectionStatus {
  return {
    connection_id: raw.id,
    status: (raw.status as ConnectionStatus) ?? 'not_connected',
    connected_at: raw.connected_at,
    last_sync_at: raw.last_sync_at,
    error_message: raw.error_message,
    is_stale: computeIsStale(raw.last_sync_at),
  }
}

const NOT_CONNECTED: IntegrationConnectionStatus = {
  connection_id: null,
  status: 'not_connected',
  connected_at: null,
  last_sync_at: null,
  error_message: null,
  is_stale: false,
}

// AUD.B.7 — Calidad del último sync por provider
export interface SyncQuality {
  provider:          string
  quality_pct:       number      // 0–1, 1 = sin entidades procesadas
  has_quality_warning: boolean
  last_sync_at:      string | null
  last_sync_status:  string | null
}

export function useSyncQuality(projectId: string | undefined) {
  return useQuery({
    queryKey:  ['sync_quality', projectId],
    enabled:   !!projectId,
    staleTime: 60_000,
    queryFn:   async () => {
      const { data, error } = await supabase
        .from('integration_sync_quality')
        .select('provider, quality_pct, has_quality_warning, last_sync_at, last_sync_status')
        .eq('project_id', projectId!)

      if (error) throw error
      const byProvider: Record<string, SyncQuality> = {}
      for (const row of data ?? []) {
        byProvider[row.provider as string] = row as SyncQuality
      }
      return byProvider
    },
  })
}

export function useIntegrationConnections(projectId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration_connections', projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('id, provider, status, connected_at, last_sync_at, error_message')
        .eq('project_id', projectId!)
        .neq('status', 'disconnected')

      if (error) throw error
      return (data ?? []) as RawConnection[]
    },
  })

  const byProvider: Record<string, IntegrationConnectionStatus> = {}
  for (const row of data ?? []) {
    byProvider[row.provider] = toConnectionStatus(row)
  }

  return {
    connections: byProvider,
    isLoading,
    error,
    refetch,
    getStatus: (provider: string): IntegrationConnectionStatus =>
      byProvider[provider] ?? NOT_CONNECTED,
  }
}
