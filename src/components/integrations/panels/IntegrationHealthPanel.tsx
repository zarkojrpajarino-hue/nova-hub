/**
 * IntegrationHealthPanel — I15.108
 *
 * Internal health dashboard for all integrations.
 * Shows: connection status, sync success rate, error counts, last sync times.
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface IntegrationHealthPanelProps {
  projectId: string | undefined
}

export function IntegrationHealthPanel({ projectId }: IntegrationHealthPanelProps) {
  const { t } = useTranslation()

  const { data: connections } = useQuery({
    queryKey: ['health_connections', projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_connections')
        .select('id, provider, status, connected_at, last_sync_at, error_count')
        .eq('project_id', projectId!)
      return data ?? []
    },
  })

  const { data: recentSyncs } = useQuery({
    queryKey: ['health_syncs', projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('integration_sync_runs')
        .select('id, status, started_at, completed_at, entities_synced, error_message, connection_id')
        .order('started_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })

  if (!projectId) return null

  const activeConnections = (connections ?? []).filter(c => c.status === 'active')
  const errorConnections = (connections ?? []).filter(c => c.status === 'error')
  const successSyncs = (recentSyncs ?? []).filter(s => s.status === 'completed')
  const failedSyncs = (recentSyncs ?? []).filter(s => s.status === 'failed')
  const syncSuccessRate = (recentSyncs ?? []).length > 0
    ? Math.round((successSyncs.length / (recentSyncs ?? []).length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity size={18} />
          {t('integrations.health.title')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('integrations.health.description')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{activeConnections.length}</div>
            <div className="text-xs text-muted-foreground">{t('integrations.health.activeConnections')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-red-500">{errorConnections.length}</div>
            <div className="text-xs text-muted-foreground">{t('integrations.health.errors')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{syncSuccessRate}%</div>
            <div className="text-xs text-muted-foreground">{t('integrations.health.syncSuccessRate')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{(recentSyncs ?? []).length}</div>
            <div className="text-xs text-muted-foreground">{t('integrations.health.totalSyncs')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('integrations.health.connectionStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          {(connections ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('integrations.health.noConnections')}</p>
          ) : (
            <div className="space-y-2">
              {(connections ?? []).map(conn => (
                <div key={conn.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    {conn.status === 'active' ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                    <span className="text-sm font-medium capitalize">{conn.provider.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {conn.last_sync_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(conn.last_sync_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <Badge variant={conn.status === 'active' ? 'secondary' : 'destructive'} className="text-xs">
                      {conn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sync runs */}
      {failedSyncs.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={14} /> {t('integrations.health.failedSyncs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {failedSyncs.slice(0, 5).map(sync => (
                <div key={sync.id} className="text-xs text-muted-foreground flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{sync.error_message ?? 'Unknown error'}</span>
                  <span>{new Date(sync.started_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
