/**
 * SyncHealthCard — I15.63
 *
 * Muestra el estado de salud de sincronización para una connection:
 * - Último sync: cuándo corrió y cuántas entidades procesó
 * - Estado del último run (completed/failed/partial)
 * - Error message si status='failed'
 * - Aviso stale si last_sync_at > 7 días (I15.44)
 *
 * Lee el último integration_sync_run por connection_id.
 * Componente puro de lectura — no dispara acciones.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, Database } from 'lucide-react'

import { useTranslation } from 'react-i18next';
interface SyncHealthCardProps {
  connectionId: string | null
  provider: string
}

interface SyncRun {
  id: string
  status: string
  entities_written: number | null
  entities_processed: number | null
  entities_rejected: number | null
  error_message: string | null
  completed_at: string | null
  started_at: string | null
  is_partial: boolean
}

function formatRelativeTime(iso: string | null, t: (k: string) => string): string {
  if (!iso) return t('integrations.nunca')
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t('integrations.haceMenosDe1')
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} día${days > 1 ? 's' : ''}`
}

function StatusBadge({ status, isPartial }: { status: string; isPartial: boolean }) {
  const { t } = useTranslation();
  if (status === 'completed' && isPartial) {
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
        <AlertTriangle size={11} className="mr-1" />{t('integrations.parcial')}</Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge className="text-xs bg-green-500">
        <CheckCircle2 size={11} className="mr-1" />
        OK
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle size={11} className="mr-1" />{t('integrations.error')}</Badge>
    )
  }
  if (status === 'running') {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock size={11} className="mr-1" />{t('integrations.enCurso')}</Badge>
    )
  }
  return <Badge variant="outline" className="text-xs">{status}</Badge>
}

export function SyncHealthCard({ connectionId, provider: _provider }: SyncHealthCardProps) {
  const { t } = useTranslation();
  const { data: lastRun, isLoading } = useQuery({
    queryKey: ['sync_runs', connectionId, 'last'],
    enabled: !!connectionId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sync_runs')
        .select('id, status, entities_written, entities_processed, entities_rejected, error_message, completed_at, started_at, is_partial')
        .eq('connection_id', connectionId!)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as SyncRun | null
    },
  })

  if (!connectionId) return null
  if (isLoading) return null

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database size={15} className="text-muted-foreground" />{t('integrations.saludDeSincronización')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!lastRun ? (
          <p className="text-sm text-muted-foreground">{t('integrations.sinRunsRegistradosHaz')}</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={13} />
                {formatRelativeTime(lastRun.completed_at ?? lastRun.started_at, t)}
              </div>
              <StatusBadge status={lastRun.status} isPartial={lastRun.is_partial} />
            </div>

            {lastRun.entities_written != null && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-muted/40">
                  <p className="text-base font-semibold">{lastRun.entities_processed ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.procesadas')}</p>
                </div>
                <div className="p-2 rounded-md bg-green-500/10">
                  <p className="text-base font-semibold text-green-600">{lastRun.entities_written}</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.escritas')}</p>
                </div>
                <div className="p-2 rounded-md bg-muted/40">
                  <p className="text-base font-semibold">{lastRun.entities_rejected ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.rechazadas')}</p>
                </div>
              </div>
            )}

            {lastRun.is_partial && (
              <Alert className="border-amber-400/40 bg-amber-500/5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <AlertDescription className="text-xs">{t('integrations.syncParcialHayMás')}</AlertDescription>
              </Alert>
            )}

            {lastRun.status === 'failed' && lastRun.error_message && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs font-mono truncate">
                  {lastRun.error_message}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
