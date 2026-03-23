/**
 * TRELLO INTEGRATION
 *
 * Conecta Trello via API Key + Token, importa cards de boards abiertos
 * y las almacena en integration_entities.
 *
 * Edge functions: connect-trello, sync-trello
 *
 * Que entra:   Cards de boards Trello (nombre, estado, lista, labels, due date)
 * Donde va:    integration_entities (entity_type='card')
 * Que cambia:  Optimus ve cards reales de Trello — cobertura operativa sin entrada manual
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
  LayoutGrid, ListChecks,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SyncHealthCard } from './SyncHealthCard'
import { ExecutionInsightsCard } from './ExecutionInsightsCard'
import { ApiKeyGuide } from './ApiKeyGuide'
import { runExecutionAgent } from '@/services/executionAgentService'
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

interface TrelloIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced: number
  boards_synced:   number
  is_partial:      boolean
}

export function TrelloIntegration({ projectId }: TrelloIntegrationProps) {
  const { t } = useTranslation();
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey]                       = useState('')
  const [token, setToken]                         = useState('')
  const [isLoading, setIsLoading]                 = useState(false)
  const [isSyncing, setIsSyncing]                 = useState(false)
  const [isConnected, setIsConnected]             = useState(false)
  const [connectionId, setConnectionId]           = useState<string | null>(null)
  const [username, setUsername]                    = useState<string | null>(null)
  const [boardCount, setBoardCount]               = useState<number | null>(null)
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
      .eq('provider', 'trello')
      .in('status', ['active', 'error'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.status === 'active') {
          setIsConnected(true)
          setConnectionId(data.id)
          const meta = data.metadata as Record<string, unknown> | null
          setUsername((meta?.username as string) ?? null)
          setBoardCount((meta?.board_count as number) ?? null)
          if (data.last_sync_at) setHasPriorSync(true)
        } else if (data.status === 'error') {
          setConnectionError(data.error_message ?? t('integrations.trelloConnectionFailed'))
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleConnect = async () => {
    if (!projectId) {
      toast.error(t('integrations.noHayProyectoActivo'))
      return
    }
    if (!apiKey.trim() || !token.trim()) {
      toast.error(t('integrations.trelloEnterBothFields'))
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
        res = await fetch(`${FUNCTIONS_URL}/connect-trello`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, api_key: apiKey, token }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg =
          data?.reason === 'invalid_credentials' ? t('integrations.trelloInvalidCredentials') :
          data?.reason === 'no_boards' ? t('integrations.trelloNoBoards') :
          `Error: ${data?.reason ?? 'unknown'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setUsername(data.username ?? null)
      setBoardCount(data.board_count ?? null)
      setIsConnected(true)
      setApiKey('')
      setToken('')
      toast.success(t('integrations.trelloConnectedSuccess'))
    } catch (err) {
      toast.error('Error: ' + (err instanceof Error ? err.message : String(err)))
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
        res = await fetch(`${FUNCTIONS_URL}/sync-trello`, {
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
        toast.error(`Sync error: ${data?.reason ?? 'unknown'}`)
        return
      }

      setLastSync(new Date().toLocaleString('es-ES'))
      setSyncResult(data as SyncResult)
      setHasPriorSync(true)

      void queryClient.invalidateQueries({ queryKey: ['sync_runs', connId] })

      // Execution Agent: analizar entidades post-sync y emitir insights
      if (projectId && connId) {
        void runExecutionAgent(projectId, connId).then((result) => {
          if (result.insights_emitted > 0) {
            void queryClient.invalidateQueries({ queryKey: ['execution_insights', projectId] })
          }
        }).catch((_err) => {
          // El Execution Agent falla silenciosamente
        })
      }

      const msg = data.is_partial
        ? t('integrations.trelloSyncPartial', { synced: data.entities_synced, boards: data.boards_synced })
        : t('integrations.trelloSyncComplete', { synced: data.entities_synced, boards: data.boards_synced })
      toast.success(msg)
    } catch (err) {
      toast.error('Sync error: ' + (err instanceof Error ? err.message : String(err)))
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
                <LayoutGrid size={22} className="text-blue-500" />
                Trello
                {username && (
                  <span className="text-sm font-normal text-muted-foreground">· @{username}</span>
                )}
                {boardCount !== null && (
                  <span className="text-sm font-normal text-muted-foreground">· {boardCount} {t('integrations.trelloBoards')}</span>
                )}
              </CardTitle>
              <CardDescription>{t('integrations.trelloDescription')}</CardDescription>
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
                  <strong>{t('integrations.trelloNoteLabel')}:</strong> {t('integrations.trelloNoteText')}{' '}
                  <a
                    href="https://trello.com/power-ups/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.trelloPowerUpsAdmin')}<ExternalLink size={12} />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trello-api-key">{t('integrations.trelloApiKey')}</Label>
                  <ApiKeyGuide provider="trello" />
                </div>
                <Input
                  id="trello-api-key"
                  type="password"
                  placeholder={t('integrations.trelloApiKeyPlaceholder')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trello-token">{t('integrations.trelloToken')}</Label>
                <Input
                  id="trello-token"
                  type="password"
                  placeholder={t('integrations.trelloTokenPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.trelloCredentialsEncrypted')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !apiKey.trim() || !token.trim() || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.trelloReconnect')
                ) : (
                  t('integrations.trelloConnect')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.trelloActiveDescription')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('integrations.trelloLastSync')}: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.trelloCardsSynced')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-green-600">{syncResult.boards_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.trelloBoardsSynced')}</div>
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
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.trelloConnectedWhatNext')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">{t('integrations.trelloStep1Title')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.trelloStep1Description', { username: username ?? 'Trello' })}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">{t('integrations.trelloStep2Title')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.trelloStep2Description')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.trelloStep3Title')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.trelloStep3Description')}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="trello" />
      )}

      {/* Execution Agent insights */}
      {isConnected && (
        <ExecutionInsightsCard projectId={projectId} />
      )}

      {/* Que entra / Donde va / Que cambia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-blue-500" />{t('integrations.quéEntraDóndeVa')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.trelloInputData')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.trelloInputFields')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">entity_type='card'</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéCambia')}</p>
                <p className="font-medium">{t('integrations.trelloWhatChanges')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.trelloWhatChangesDetail')}</p>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéNoEntra')}</p>
                <p className="font-medium">{t('integrations.trelloExcludedData')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.trelloExcludedDetail')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.idempotencia')}</p>
                <p className="font-mono text-[11px]">provider='trello'</p>
                <p className="text-muted-foreground mt-0.5">+ external_id (card ID)</p>
                <p className="text-muted-foreground">{t('integrations.trelloNoDuplicates')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.trelloLimits')}</p>
                <p className="font-medium">{t('integrations.trelloLimitsValue')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.trelloLimitsDetail')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
