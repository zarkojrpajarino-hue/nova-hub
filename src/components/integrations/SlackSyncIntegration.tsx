/**
 * SLACK SYNC INTEGRATION — Channel Activity Reader
 *
 * Conecta Slack via Bot User OAuth Token (xoxb-), importa actividad de canales
 * y la almacena como integration_entities (channel_activity).
 *
 * SEPARADO de SlackIntegration.tsx (webhooks de salida). Este lee datos DE Slack.
 *
 * Edge functions: connect-slack, sync-slack
 *
 * Que entra:   Actividad de canales publicos (mensajes, autores, miembros)
 * Donde va:    integration_entities (entity_type='channel_activity')
 * Que cambia:  Optimus ve comunicacion real del equipo sin entrada manual
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
  MessageSquare, BarChart3,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SyncHealthCard } from './SyncHealthCard'
import { GenericInsightsCard } from './GenericInsightsCard'
import { ApiKeyGuide } from './ApiKeyGuide'
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

interface SlackSyncIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:  number
  channels_synced:  number
  total_messages:   number
  is_partial:       boolean
}

export function SlackSyncIntegration({ projectId }: SlackSyncIntegrationProps) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [botToken, setBotToken]                   = useState('')
  const [isLoading, setIsLoading]                 = useState(false)
  const [isSyncing, setIsSyncing]                 = useState(false)
  const [isConnected, setIsConnected]             = useState(false)
  const [connectionId, setConnectionId]           = useState<string | null>(null)
  const [teamName, setTeamName]                   = useState<string | null>(null)
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
      .eq('provider', 'slack')
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
          setTeamName(meta?.team_name ?? null)
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
    if (!botToken.trim()) {
      toast.error(t('integrations.slackIntroduceTuBotToken'))
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
        res = await fetch(`${FUNCTIONS_URL}/connect-slack`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, bot_token: botToken }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg =
          data?.reason === 'invalid_token' ? t('integrations.slackTokenInválido') :
          `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setTeamName(data.team_name ?? null)
      setIsConnected(true)
      setBotToken('')
      toast.success(t('integrations.slackConectadoSincronizar'))
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
        res = await fetch(`${FUNCTIONS_URL}/sync-slack`, {
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

      const msg = data.is_partial
        ? t('integrations.slackSyncParcial', { channels: data.channels_synced, messages: data.total_messages })
        : t('integrations.slackSyncCompletado', { channels: data.channels_synced, messages: data.total_messages })
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
                <MessageSquare size={22} className="text-violet-500" />
                {t('integrations.slackSync')}
                {teamName && (
                  <span className="text-sm font-normal text-muted-foreground">{teamName}</span>
                )}
              </CardTitle>
              <CardDescription>{t('integrations.slackSyncDescripción')}</CardDescription>
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
                  <strong>{t('integrations.slackGuíaTítulo')}</strong>{' '}
                  {t('integrations.slackGuíaTexto')}{' '}
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.slackApiApps')}<ExternalLink size={12} />
                  </a>
                  {' '}{t('integrations.slackGuíaScopes')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-bot-token">{t('integrations.slackBotToken')}</Label>
                  <ApiKeyGuide provider="slack" />
                </div>
                <Input
                  id="slack-bot-token"
                  type="password"
                  placeholder="xoxb-..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.slackTokenCifrado')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !botToken.trim() || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.slackReconectar')
                ) : (
                  t('integrations.slackConectar')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm text-violet-700 dark:text-violet-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.slackActividadCanales')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('integrations.slackÚltimaSincronización')}: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.channels_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.slackCanales')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-violet-600">{syncResult.total_messages}</div>
                      <div className="text-muted-foreground">{t('integrations.slackMensajes')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.slackEntidades')}</div>
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
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.slackConectadoQuéPasará')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">{t('integrations.slackPaso1Título')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.slackPaso1Desc', { team: teamName })}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">{t('integrations.slackPaso2Título')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.slackPaso2Desc')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.slackPaso3Título')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.slackPaso3Desc')}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="slack" />
      )}

      {/* Communication Agent insights */}
      {isConnected && (
        <GenericInsightsCard
          projectId={projectId}
          agentType="slack_communication"
          title={t('integrations.análisisDeComunicación')}
          icon={<MessageSquare size={15} className="text-violet-500" />}
          badgeLabel="Communication Agent"
          sourceLabel="Slack"
        />
      )}

      {/* Que entra - Donde va - Que cambia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 size={16} className="text-violet-500" />{t('integrations.quéEntraDóndeVa')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.slackDatoEntrada')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.slackDatoEntradaDetalle')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.slackEntityType')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéCambia')}</p>
                <p className="font-medium">{t('integrations.slackQuéCambia')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.slackQuéCambiaDetalle')}</p>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéNoEntra')}</p>
                <p className="font-medium">{t('integrations.slackQuéNoEntra')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.slackQuéNoEntraDetalle')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.idempotencia')}</p>
                <p className="font-mono text-[11px]">provider='slack'</p>
                <p className="text-muted-foreground mt-0.5">+ external_id (channel ID)</p>
                <p className="text-muted-foreground">{t('integrations.slackIdempotenciaDetalle')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.slackVentana')}</p>
                <p className="font-medium">{t('integrations.slackVentanaValor')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.slackVentanaDetalle')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
