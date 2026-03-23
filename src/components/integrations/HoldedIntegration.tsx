/**
 * HOLDED INTEGRATION
 *
 * Conecta Holded via API Key, importa facturas y las escribe en
 * key_metrics via write_integration_to_engine_table().
 *
 * Edge functions: connect-holded, sync-holded
 *
 * Que entra:   Facturas de Holded (numero, total, estado, cliente, fecha)
 * Donde va:    integration_entities -> key_metrics (external_provider='holded')
 * Que cambia:  Optimus ve datos financieros reales — dashboard financiero sin entrada manual
 */

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw,
  ListChecks,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SyncHealthCard } from './SyncHealthCard'
import { ApiKeyGuide } from './ApiKeyGuide'
import { FinanceInsightsCard } from './FinanceInsightsCard'
import type { Session } from '@supabase/supabase-js'

import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/config'

import { useTranslation } from 'react-i18next';

async function getFreshSession(fallback: Session | null): Promise<Session | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), 2000)
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timer)
      resolve(data.session)
    }).catch(() => {
      clearTimeout(timer)
      resolve(fallback)
    })
  })
}

interface HoldedIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:    number
  invoices_written:   number
  invoices_skipped:   number
  invoices_rejected:  number
  is_partial:         boolean
}

export function HoldedIntegration({ projectId }: HoldedIntegrationProps) {
  const { t } = useTranslation();
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey]                       = useState('')
  const [isLoading, setIsLoading]                 = useState(false)
  const [isSyncing, setIsSyncing]                 = useState(false)
  const [isConnected, setIsConnected]             = useState(false)
  const [connectionId, setConnectionId]           = useState<string | null>(null)
  const [lastSync, setLastSync]                   = useState<string | null>(null)
  const [syncResult, setSyncResult]               = useState<SyncResult | null>(null)
  const [connectionError, setConnectionError]     = useState<string | null>(null)
  const [hasPriorSync, setHasPriorSync]           = useState(false)

  // Carga conexion existente desde DB al montar
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('integration_connections')
      .select('id, status, error_message, last_sync_at, metadata')
      .eq('project_id', projectId)
      .eq('provider', 'holded')
      .in('status', ['active', 'error'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.status === 'active') {
          setIsConnected(true)
          setConnectionId(data.id)
          if (data.last_sync_at) setHasPriorSync(true)
        } else if (data.status === 'error') {
          setConnectionError(data.error_message ?? t('integrations.laConexiónAnteriorFalló'))
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleConnect = async () => {
    if (!projectId) {
      toast.error(t('integrations.noHayProyectoActivo'))
      return
    }
    if (!apiKey.trim()) {
      toast.error(t('integrations.introduceApiKeyHolded'))
      return
    }

    setIsLoading(true)
    try {
      const freshSession = await getFreshSession(session)
      if (!freshSession) {
        toast.error(t('integrations.sesiónExpiradaRecargaLa'))
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/connect-holded`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, api_key: apiKey }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg =
          data?.reason === 'invalid_api_key' ? t('integrations.apiKeyInválidaVerificaHolded') :
          `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setIsConnected(true)
      setApiKey('')
      toast.success(t('integrations.holdedConectadoSincronizar'))
    } catch (err) {
      toast.error('Error al conectar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (overrideConnectionId?: string) => {
    const connId = overrideConnectionId ?? connectionId
    if (!projectId || !connId) {
      toast.error(t('integrations.conexiónNoDisponible'))
      return
    }

    setIsSyncing(true)
    setSyncResult(null)
    try {
      const freshSession = await getFreshSession(session)
      if (!freshSession) {
        toast.error(t('integrations.sesiónExpiradaRecargaLa'))
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/sync-holded`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, connection_id: connId }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.reason ?? data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        toast.error(`Error en sync: ${data?.reason ?? 'desconocido'}`)
        return
      }

      setLastSync(new Date().toLocaleString('es-ES'))
      setSyncResult(data as SyncResult)
      setHasPriorSync(true)

      void queryClient.invalidateQueries({ queryKey: ['sync_runs', connId] })
      void queryClient.invalidateQueries({ queryKey: ['key_metrics', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['finance_insights', projectId] })

      const msg = data.is_partial
        ? t('integrations.holdedSyncParcial', { written: data.invoices_written })
        : t('integrations.holdedSyncCompletado', { synced: data.entities_synced, written: data.invoices_written })
      toast.success(msg)
    } catch (err) {
      toast.error('Error en sincronizacion: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                  H
                </div>
                {t('integrations.holded')}
              </CardTitle>
              <CardDescription>{t('integrations.sincronizaFacturasClientesY')}</CardDescription>
            </div>
            {isConnected ? (
              <Badge className="bg-green-500">
                <CheckCircle2 size={12} className="mr-1" />{t('integrations.conectado')}</Badge>
            ) : (
              <Badge variant="outline">
                <AlertCircle size={12} className="mr-1" />{t('integrations.desconectado')}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              {/* Reconexion */}
              {connectionError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t('integrations.conexiónInterrumpida')}</strong> {connectionError}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertDescription>
                  <strong>{t('integrations.holdedGuiaTitulo')}</strong>
                  <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                    <li>
                      {t('integrations.holdedGuiaPaso1')}{' '}
                      <a
                        href="https://app.holded.com/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Holded Settings &rarr; API
                        <ExternalLink size={12} />
                      </a>
                    </li>
                    <li>{t('integrations.holdedGuiaPaso2')}</li>
                    <li>{t('integrations.holdedGuiaPaso3')}</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="holded-key">{t('integrations.apiKey')}</Label>
                  <ApiKeyGuide provider="holded" />
                </div>
                <Input
                  id="holded-key"
                  type="password"
                  placeholder={t('integrations.tuApiKeyDe')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.tuApiKeySe')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !apiKey.trim() || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.reconectarHolded')
                ) : (
                  t('integrations.conectarHolded')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.facturasYCobrosSe')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('integrations.últimaSincronización')}: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.procesadas')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-green-600">{syncResult.invoices_written}</div>
                      <div className="text-muted-foreground">{t('integrations.escritas')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.invoices_skipped}</div>
                      <div className="text-muted-foreground">{t('integrations.sinCambios')}</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleSync()}
                disabled={isSyncing}
                variant="outline"
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.sincronizando')}</>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />{t('integrations.sincronizarAhora')}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tutorial post-conexion — solo si nunca ha habido sync */}
      {isConnected && !lastSync && !syncResult && !hasPriorSync && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.holdedConectadoQuePasara')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">{t('integrations.holdedTutorialPaso1Titulo')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.holdedTutorialPaso1Desc')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">{t('integrations.holdedTutorialPaso2Titulo')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.holdedTutorialPaso2Desc')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.holdedTutorialPaso3Titulo')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.holdedTutorialPaso3Desc')}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="holded" />
      )}

      {/* Finance Insights */}
      {isConnected && (
        <FinanceInsightsCard projectId={projectId} />
      )}

      {/* Que se sincroniza */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-blue-500" />{t('integrations.quéSeSincroniza')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('integrations.facturasEmitidas')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.todasLasFacturasCon')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('integrations.estadoDeCobros')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.quéFacturasEstánPagadas')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('integrations.clientes')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.holdedClientesDesc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader>
          <CardTitle className="text-base">{t('integrations.beneficiosDeLaIntegración')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-blue-500">&bull;</span>{t('integrations.dashboardFinancieroActualizadoAutomáticamente')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">&bull;</span>{t('integrations.alertasCuandoFacturasEstán')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">&bull;</span>{t('integrations.mrrCalculadoAutomáticamenteDe')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">&bull;</span>{t('integrations.proyeccionesDeRevenueCon')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
