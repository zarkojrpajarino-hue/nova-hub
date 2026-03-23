/**
 * HUBSPOT INTEGRATION — I15.93
 *
 * Conecta HubSpot via Private App Token, importa deals del CRM
 * y los almacena en integration_entities para futuras fases de hidratación.
 *
 * Edge functions: connect-hubspot, sync-hubspot
 *
 * Qué entra:   Deals de HubSpot CRM (nombre, stage, amount, close date)
 * Dónde va:    integration_entities (entity_type='deal', provider='hubspot')
 * Qué cambia:  v1: deals almacenados para análisis futuro.
 *              v2 (BLOQUE D/E): hidratación a `obvs` con source='hubspot'.
 *              Sales Agent (I15.79): análisis de pipeline cuando haya datos.
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
  TrendingUp, ListChecks,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { trackIntegrationConnected, trackIntegrationSyncCompleted, trackIntegrationError } from '@/lib/analytics'
import { SyncHealthCard } from './SyncHealthCard'
import { SalesInsightsCard } from './SalesInsightsCard'
import { runSalesAgent } from '@/services/salesAgentService'
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

interface HubSpotIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:   number
  entities_written:  number
  entities_rejected: number
  is_partial:        boolean
}

export function HubSpotIntegration({ projectId }: HubSpotIntegrationProps) {
  const { t } = useTranslation();
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [accessToken, setAccessToken]         = useState('')
  const [isLoading, setIsLoading]             = useState(false)
  const [isSyncing, setIsSyncing]             = useState(false)
  const [isConnected, setIsConnected]         = useState(false)
  const [connectionId, setConnectionId]       = useState<string | null>(null)
  const [portalId, setPortalId]               = useState<string | null>(null)
  const [lastSync, setLastSync]               = useState<string | null>(null)
  const [syncResult, setSyncResult]           = useState<SyncResult | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [hasPriorSync, setHasPriorSync]       = useState(false)

  // Cargar conexión existente desde DB al montar
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('integration_connections')
      .select('id, status, error_message, last_sync_at, metadata')
      .eq('project_id', projectId)
      .eq('provider', 'hubspot')
      .in('status', ['active', 'error'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.status === 'active') {
          setIsConnected(true)
          setConnectionId(data.id)
          const meta = data.metadata as Record<string, string> | null
          setPortalId(meta?.portal_id ?? null)
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
    if (!accessToken.trim()) {
      toast.error(t('integrations.introduceTuPrivateApp'))
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
        res = await fetch(`${FUNCTIONS_URL}/connect-hubspot`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, access_token: accessToken }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg =
          data?.reason === 'invalid_token'
            ? t('integrations.tokenInválidoVerificaQue')
            : `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setPortalId(data.portal_id ?? null)
      setIsConnected(true)
      setAccessToken('')
      if (projectId) trackIntegrationConnected({ project_id: projectId, provider: 'hubspot', action: 'connected' })
      toast.success('HubSpot conectado — haz clic en Sincronizar Ahora para importar tus deals')
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
        res = await fetch(`${FUNCTIONS_URL}/sync-hubspot`, {
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

      // I15.79 — Sales Agent: analizar deals post-sync y emitir insights
      if (projectId && connId) {
        void runSalesAgent(projectId, connId).then((result) => {
          if (result.insights_emitted > 0) {
            void queryClient.invalidateQueries({ queryKey: ['sales_insights', projectId] })
          }
        }).catch((_err) => {
          // El Sales Agent falla silenciosamente — no interrumpe el flujo de sync
        })
      }

      const msg = data.is_partial
        ? `Sync parcial — ${data.entities_written} deals importados (se superó el límite de 1000)`
        : `Sync completado — ${data.entities_synced} deals, ${data.entities_written} importados`
      toast.success(msg)
    } catch (err) {
      toast.error('Error en sincronización: ' + (err instanceof Error ? err.message : String(err)))
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
                <TrendingUp size={22} className="text-orange-500" />
                HubSpot
                {portalId && (
                  <span className="text-sm font-normal text-muted-foreground">· Portal {portalId}</span>
                )}
              </CardTitle>
              <CardDescription>{t('integrations.importaDealsDelCrm')}</CardDescription>
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
                  <strong>Nota:</strong> Necesitas un Private App Token de HubSpot. Lo generas en{' '}
                  <a
                    href="https://app.hubspot.com/private-apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.privateAppsEnHubspot')}<ExternalLink size={12} />
                  </a>
                  . Asegúrate de activar el scope <span className="font-mono text-xs">crm.objects.deals.read</span>.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="hubspot-token">{t('integrations.privateAppToken')}</Label>
                <Input
                  id="hubspot-token"
                  type="password"
                  placeholder={t('integrations.pateu1')}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.elTokenSeCifra')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !accessToken.trim() || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.reconectarHubspot')
                ) : (
                  t('integrations.conectarHubspot')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.losDealsSeSincronizan')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última sincronización: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.procesados')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-green-600">{syncResult.entities_written}</div>
                      <div className="text-muted-foreground">{t('integrations.importados')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_rejected}</div>
                      <div className="text-muted-foreground">{t('integrations.rechazados')}</div>
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

      {/* Tutorial post-conexión — solo si nunca ha habido sync */}
      {isConnected && !lastSync && !syncResult && !hasPriorSync && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.hubspotConectadoQuéPasará')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">Pulsa t('integrations.sincronizarAhora0')</p>
                  <p className="text-xs text-muted-foreground">
                    Optimus pedirá a HubSpot todos los deals de tu CRM (portal {portalId}).
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">Los deals se almacenan en<span className="font-mono text-xs">integration_entities</span></p>
                  <p className="text-xs text-muted-foreground">
                    Cada deal importado incluye nombre, stage, importe y fecha de cierre.
                    Los deals sin importe o sin nombre válido se rechazan automáticamente.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.syncsIncrementales')}</p>
                  <p className="text-xs text-muted-foreground">
                    Los siguientes syncs solo descargan deals modificados desde el último sync.
                    El Sales Agent analizará el pipeline una vez implementado (próxima fase).
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="hubspot" />
      )}

      {/* Sales Agent insights — I15.79 */}
      {isConnected && (
        <SalesInsightsCard projectId={projectId} />
      )}

      {/* Qué entra · Dónde va · Qué cambia — I15.64 pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-orange-500" />{t('integrations.quéEntraDóndeVa')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.dealsDeHubspot')}</p>
                <p className="text-muted-foreground mt-0.5">nombre, stage, importe, fecha cierre, owner</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">entity_type='deal'</p>
                <p className="text-muted-foreground">provider='hubspot'</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéCambia')}</p>
                <p className="font-medium">{t('integrations.pipelineDeVentasReal')}</p>
                <p className="text-muted-foreground mt-0.5">base para Sales Agent y análisis de revenue</p>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Qué no entra (v1)</p>
                <p className="font-medium">{t('integrations.contactosEmpresas')}</p>
                <p className="text-muted-foreground mt-0.5">notas, actividades, workflows, custom properties</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.idempotencia')}</p>
                <p className="font-mono text-[11px]">provider='hubspot'</p>
                <p className="text-muted-foreground mt-0.5">+ external_id (deal ID)</p>
                <p className="text-muted-foreground">un sync no duplica deals</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.próximaFase')}</p>
                <p className="font-medium">Hidratación CRM (BLOQUE D)</p>
                <p className="text-muted-foreground mt-0.5">deals → obvs con source='hubspot' — visible en CRM nativo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
