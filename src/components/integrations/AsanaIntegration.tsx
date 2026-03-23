/**
 * ASANA INTEGRATION — I15.94
 *
 * Conecta Asana via Personal Access Token (PAT), importa tareas del workspace
 * y las escribe en la tabla `tasks` via write_integration_to_engine_table().
 *
 * Edge functions: connect-asana, sync-asana
 *
 * Qué entra:   Tareas del workspace Asana (nombre, estado, fecha límite)
 * Dónde va:    integration_entities → tabla `tasks` (external_provider='asana')
 * Qué cambia:  Optimus ve tareas reales — cobertura de ejecución sin entrada manual
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
  CheckSquare, ListChecks,
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

interface AsanaIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:  number
  tasks_written:    number
  tasks_skipped:    number
  tasks_rejected:   number
  is_partial:       boolean
}

export function AsanaIntegration({ projectId }: AsanaIntegrationProps) {
  const { t } = useTranslation();
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [pat, setPat]                           = useState('')
  const [isLoading, setIsLoading]               = useState(false)
  const [isSyncing, setIsSyncing]               = useState(false)
  const [isConnected, setIsConnected]           = useState(false)
  const [connectionId, setConnectionId]         = useState<string | null>(null)
  const [workspaceName, setWorkspaceName]       = useState<string | null>(null)
  const [lastSync, setLastSync]                 = useState<string | null>(null)
  const [syncResult, setSyncResult]             = useState<SyncResult | null>(null)
  const [connectionError, setConnectionError]   = useState<string | null>(null)
  const [hasPriorSync, setHasPriorSync]         = useState(false)

  // Carga conexión existente desde DB al montar
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('integration_connections')
      .select('id, status, error_message, last_sync_at, metadata')
      .eq('project_id', projectId)
      .eq('provider', 'asana')
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
    if (!pat.trim()) {
      toast.error(t('integrations.introduceTuPersonalAccess'))
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
        res = await fetch(`${FUNCTIONS_URL}/connect-asana`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ project_id: projectId, pat }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg =
          data?.reason === 'invalid_pat' ? t('integrations.patInválidoVerificaQue') :
          data?.reason === 'no_workspace' ? t('integrations.noSeEncontróNingún') :
          `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setWorkspaceName(data.workspace_name ?? null)
      setIsConnected(true)
      setPat('')
      toast.success('Asana conectado — haz clic en Sincronizar Ahora para importar tus tareas')
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
      const timeout = setTimeout(() => controller.abort(), 60_000)  // 60s — más tareas que stripe
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/sync-asana`, {
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
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })

      // I15.80 — Execution Agent: analizar entidades post-sync y emitir insights
      if (projectId && connId) {
        void runExecutionAgent(projectId, connId).then((result) => {
          if (result.insights_emitted > 0) {
            void queryClient.invalidateQueries({ queryKey: ['execution_insights', projectId] })
          }
        }).catch((_err) => {
          // El Execution Agent falla silenciosamente — no interrumpe el flujo de sync
        })
      }

      const msg = data.is_partial
        ? `Sync parcial — ${data.tasks_written} tareas escritas (se superó el límite de 1000 tareas)`
        : `Sync completado — ${data.entities_synced} tareas, ${data.tasks_written} escritas`
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
                <CheckSquare size={22} className="text-pink-500" />
                Asana
                {workspaceName && (
                  <span className="text-sm font-normal text-muted-foreground">· {workspaceName}</span>
                )}
              </CardTitle>
              <CardDescription>{t('integrations.importaTareasDelWorkspace')}</CardDescription>
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
              {/* Reconexión */}
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
                  <strong>Nota:</strong> Necesitas un Personal Access Token de Asana. Lo encuentras en{' '}
                  <a
                    href="https://app.asana.com/0/my-apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.myAppsEnAsana')}<ExternalLink size={12} />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="asana-pat">{t('integrations.personalAccessToken')}</Label>
                  <ApiKeyGuide provider="asana" />
                </div>
                <Input
                  id="asana-pat"
                  type="password"
                  placeholder={t('integrations.112345abc')}
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.elPatSeCifra')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !pat.trim() || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.reconectarAsana')
                ) : (
                  t('integrations.conectarAsana')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.lasTareasSeSincronizan')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última sincronización: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">{t('integrations.procesadas')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-green-600">{syncResult.tasks_written}</div>
                      <div className="text-muted-foreground">{t('integrations.escritas')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.tasks_skipped}</div>
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

      {/* Tutorial post-conexión — solo si nunca ha habido sync */}
      {isConnected && !lastSync && !syncResult && !hasPriorSync && (
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.asanaConectadoQuéPasará')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">Pulsa t('integrations.sincronizarAhora0')</p>
                  <p className="text-xs text-muted-foreground">
                    Optimus pedirá a Asana la lista de tareas de tu workspace ({workspaceName}).
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">Las tareas se escriben en<span className="font-mono text-xs">tasks</span></p>
                  <p className="text-xs text-muted-foreground">
                    Cada tarea de Asana aparece en tu vista de Tareas junto a las tareas manuales.
                    Las tareas importadas se identifican con <span className="font-mono text-xs">external_provider='asana'</span>.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.syncsIncrementales')}</p>
                  <p className="text-xs text-muted-foreground">
                    Los siguientes syncs solo descargan tareas modificadas desde el último sync.
                    Las tareas completadas antes de conectar Asana se marcan como históricas.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="asana" />
      )}

      {/* Execution Agent insights — I15.80 */}
      {isConnected && (
        <ExecutionInsightsCard projectId={projectId} />
      )}

      {/* Qué entra · Dónde va · Qué cambia — I15.64 pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-pink-500" />{t('integrations.quéEntraDóndeVa')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.tareasDeAsana')}</p>
                <p className="text-muted-foreground mt-0.5">nombre, estado (open/completed), fecha límite, sección</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.dóndeVa')}</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">→ tabla <span className="font-mono">tasks</span></p>
                <p className="text-muted-foreground">vía write guard</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéCambia')}</p>
                <p className="font-medium">{t('integrations.tareasRealesVisibles')}</p>
                <p className="text-muted-foreground mt-0.5">sin entrada manual — junto a tareas de Optimus</p>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.quéNoEntra')}</p>
                <p className="font-medium">{t('integrations.subtareasDependencias')}</p>
                <p className="text-muted-foreground mt-0.5">custom fields, attachments, comentarios</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.idempotencia')}</p>
                <p className="font-mono text-[11px]">external_provider='asana'</p>
                <p className="text-muted-foreground mt-0.5">+ external_id (GID)</p>
                <p className="text-muted-foreground">un sync no duplica tareas</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.tareasHistóricas')}</p>
                <p className="font-medium">status=done_historical</p>
                <p className="text-muted-foreground mt-0.5">completadas antes de conectar — no cuentan en execution_rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
