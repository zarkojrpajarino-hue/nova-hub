/**
 * NOTION INTEGRATION
 *
 * Conecta Notion via Internal Integration Token, importa paginas y databases
 * del workspace y las almacena en integration_entities.
 *
 * Edge functions: connect-notion, sync-notion
 *
 * Que entra:   Paginas y databases del workspace Notion (titulo, fecha edicion, estructura)
 * Donde va:    integration_entities (entity_type='page' | 'database')
 * Que cambia:  Optimus ve conocimiento real del equipo — documentacion, wikis, bases de datos
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
  FileText, ListChecks,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SyncHealthCard } from './SyncHealthCard'
import { GenericInsightsCard } from './GenericInsightsCard'
import { ApiKeyGuide } from './ApiKeyGuide'
import type { Session } from '@supabase/supabase-js'

import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/config'

import { useTranslation } from 'react-i18next'

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

interface NotionIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:   number
  pages_synced:      number
  databases_synced:  number
  is_partial:        boolean
}

export function NotionIntegration({ projectId }: NotionIntegrationProps) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey]                       = useState('')
  const [isLoading, setIsLoading]                 = useState(false)
  const [isSyncing, setIsSyncing]                 = useState(false)
  const [isConnected, setIsConnected]             = useState(false)
  const [connectionId, setConnectionId]           = useState<string | null>(null)
  const [workspaceName, setWorkspaceName]         = useState<string | null>(null)
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
      .eq('provider', 'notion')
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
          setWorkspaceName(meta?.workspace_name ?? null)
          if (data.last_sync_at) setHasPriorSync(true)
        } else if (data.status === 'error') {
          setConnectionError(data.error_message ?? t('integrations.laConexiónAnteriorFalló'))
        }
      })
  }, [projectId])

  const handleConnect = async () => {
    if (!projectId) {
      toast.error(t('integrations.noHayProyectoActivo'))
      return
    }
    if (!apiKey.trim()) {
      toast.error(t('integrations.introduceElTokenDe'))
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
        res = await fetch(`${FUNCTIONS_URL}/connect-notion`, {
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
          data?.reason === 'invalid_token' ? t('integrations.tokenInválidoVerificaQue') :
          data?.reason === 'no_access' ? t('integrations.elTokenNoTieneAcceso') :
          `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setWorkspaceName(data.workspace_name ?? null)
      setIsConnected(true)
      setApiKey('')
      toast.success(t('integrations.notionConectadoSincroniza'))
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
        res = await fetch(`${FUNCTIONS_URL}/sync-notion`, {
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
        ? t('integrations.syncParcialNotion', { pages: data.pages_synced, databases: data.databases_synced })
        : t('integrations.syncCompletadoNotion', { pages: data.pages_synced, databases: data.databases_synced })
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
                <FileText size={22} className="text-gray-700 dark:text-gray-300" />
                Notion
                {workspaceName && (
                  <span className="text-sm font-normal text-muted-foreground">{workspaceName}</span>
                )}
              </CardTitle>
              <CardDescription>{t('integrations.importaPáginasYBases')}</CardDescription>
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
                  <strong>{t('integrations.nota')}:</strong> {t('integrations.necesitasUnInternal')}{' '}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.myIntegrationsEnNotion')}<ExternalLink size={12} />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notion-token">{t('integrations.internalIntegrationToken')}</Label>
                  <ApiKeyGuide provider="notion" />
                </div>
                <Input
                  id="notion-token"
                  type="password"
                  placeholder="ntn_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.elTokenSeCifra')}</p>
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
                  t('integrations.reconectarNotion')
                ) : (
                  t('integrations.conectarNotion')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.lasPáginasSeSincronizan')}</p>
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
                      <div className="font-mono font-semibold text-green-600">{syncResult.pages_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.páginas')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.databases_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.databases')}</div>
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
        <Card className="border-gray-500/20 bg-gray-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.notionConectadoQuéPasará')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">{t('integrations.pulsaSincronizarAhora')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.optimusPediráANotion', { workspace: workspaceName })}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">{t('integrations.páginasYDatabasesSeImportan')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.cadaPáginaApareceEnEntities')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.syncsIncrementales')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.losSiguienteSyncsSoloDescargan')}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="notion" />
      )}

      {/* Knowledge Agent insights */}
      {isConnected && (
        <GenericInsightsCard
          projectId={projectId}
          agentType="notion_knowledge"
          title={t('integrations.análisisDeDocumentación')}
          icon={<FileText size={15} className="text-gray-600 dark:text-gray-400" />}
          badgeLabel="Knowledge Agent"
          sourceLabel="Notion"
        />
      )}

      {/* Que entra / Donde va / Que cambia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-gray-600" />{t('integrations.quéSeSincroniza')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 — Pages */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.páginasDeNotion')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.títuloFechaEdiciónEstructura')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">entity_type=<span className="font-mono">page</span></p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéCambia')}</p>
                <p className="font-medium">{t('integrations.conocimientoRealVisible')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.wikisDocs')}</p>
              </div>
            </div>

            {/* Fila 2 — Databases */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.databasesDeNotion')}</p>
                <p className="text-muted-foreground mt-0.5">{t('integrations.schemaPropiedades')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">entity_type=<span className="font-mono">database</span></p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.idempotencia')}</p>
                <p className="font-mono text-[11px]">provider='notion'</p>
                <p className="text-muted-foreground mt-0.5">+ external_id</p>
                <p className="text-muted-foreground">{t('integrations.unSyncNoDuplica')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
