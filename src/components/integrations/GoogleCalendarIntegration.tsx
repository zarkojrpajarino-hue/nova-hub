/**
 * GOOGLE CALENDAR INTEGRATION — I15.97
 *
 * Conecta Google Calendar via OAuth 2.0, importa eventos del calendario
 * primario y los almacena en integration_entities para el Calendar Agent.
 *
 * Edge functions: connect-google-calendar, sync-google-calendar
 *
 * Flujo OAuth:
 *   1. Pulsar "Conectar" → llama connect-google-calendar[get_auth_url]
 *   2. Redirección a Google OAuth (consent screen)
 *   3. Google redirige a /integrations?gcal_code=...&state=...
 *   4. Componente detecta gcal_code en URL → llama connect-google-calendar[exchange_code]
 *   5. Tokens almacenados cifrados → conexión activa
 *
 * Qué entra:   Eventos del calendario primario (título, inicio, fin, asistentes)
 * Dónde va:    integration_entities (entity_type='calendar_event')
 * Qué cambia:  v1: eventos almacenados para Calendar Agent (I15.82).
 *              v2: hidratación a tabla meetings con historial completo.
 *
 * PREREQUISITO (para el usuario):
 *   1. Crear proyecto en Google Cloud Console
 *   2. Habilitar Google Calendar API
 *   3. Crear credenciales OAuth 2.0 (Web App) con redirect URI: [origin]/integrations
 *   4. El administrador de Optimus debe configurar GOOGLE_OAUTH_CLIENT_ID y
 *      GOOGLE_OAUTH_CLIENT_SECRET en las variables de entorno de Supabase
 */

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, CheckCircle2, AlertCircle, Calendar, RefreshCw, ListChecks,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SyncHealthCard } from './SyncHealthCard'
import { CalendarInsightsCard } from './CalendarInsightsCard'
import { runCalendarAgent } from '@/services/calendarAgentService'
import type { Session } from '@supabase/supabase-js'

const FUNCTIONS_URL     = 'https://zzxngvqwmnouchbulvlo.supabase.co/functions/v1'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eG5ndnF3bW5vdWNoYnVsdmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDkyNDEsImV4cCI6MjA4NzQ4NTI0MX0.u0bzjhkbHrijmuvKecdRsdxYN4qn43g1fhayP7SiOvs'

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

interface GoogleCalendarIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  entities_synced:   number
  entities_written:  number
  entities_rejected: number
  is_partial:        boolean
}

export function GoogleCalendarIntegration({ projectId }: GoogleCalendarIntegrationProps) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting]       = useState(false)
  const [isExchanging, setIsExchanging]       = useState(false)
  const [isSyncing, setIsSyncing]             = useState(false)
  const [isConnected, setIsConnected]         = useState(false)
  const [connectionId, setConnectionId]       = useState<string | null>(null)
  const [accountEmail, setAccountEmail]       = useState<string | null>(null)
  const [lastSync, setLastSync]               = useState<string | null>(null)
  const [syncResult, setSyncResult]           = useState<SyncResult | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [hasPriorSync, setHasPriorSync]       = useState(false)
  const [isLoading, setIsLoading]             = useState(true)

  // Cargar conexión existente desde DB al montar
  useEffect(() => {
    if (!projectId) { setIsLoading(false); return }
    supabase
      .from('integration_connections')
      .select('id, status, error_message, last_sync_at, metadata')
      .eq('project_id', projectId)
      .eq('provider', 'google_calendar')
      .in('status', ['active', 'error'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setIsLoading(false)
        if (!data) return
        if (data.status === 'active') {
          setIsConnected(true)
          setConnectionId(data.id)
          const meta = data.metadata as Record<string, string> | null
          setAccountEmail(meta?.account_email ?? null)
          if (data.last_sync_at) setHasPriorSync(true)
        } else if (data.status === 'error') {
          setConnectionError(data.error_message ?? 'La conexión anterior falló. Vuelve a conectar.')
        }
      })
  }, [projectId])

  // Detectar retorno de OAuth — gcal_code en URL params
  useEffect(() => {
    if (!projectId) return
    const url = new URL(window.location.href)
    const gcalCode  = url.searchParams.get('gcal_code')
    const gcalState = url.searchParams.get('gcal_state')

    if (!gcalCode || !gcalState) return

    // Limpiar params de URL para no re-ejecutar si el componente se monta de nuevo
    url.searchParams.delete('gcal_code')
    url.searchParams.delete('gcal_state')
    window.history.replaceState({}, '', url.toString())

    // Intercambiar code por tokens
    void handleExchangeCode(gcalCode, gcalState)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleConnect = async () => {
    if (!projectId) {
      toast.error('No hay proyecto activo')
      return
    }

    setIsConnecting(true)
    try {
      const freshSession = await getFreshSession(session)
      if (!freshSession) {
        toast.error('Sesión expirada — recarga la página e inicia sesión de nuevo')
        return
      }

      // redirect_uri = origen actual + /integrations
      // Google redirigirá aquí con ?gcal_code=...&gcal_state=...
      const redirectUri = `${window.location.origin}/integrations`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/connect-google-calendar`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            project_id:   projectId,
            action:       'get_auth_url',
            redirect_uri: redirectUri,
          }),
        })
      } finally {
        clearTimeout(timeout)
      }

      const data = await res.json()
      if (!res.ok || !data?.auth_url) {
        if (data?.reason === 'google_oauth_not_configured') {
          toast.error('Google OAuth no está configurado en esta instancia de Optimus. Contacta al administrador.')
        } else {
          toast.error(`Error obteniendo URL de autorización: ${data?.reason ?? 'desconocido'}`)
        }
        return
      }

      // Redirigir a Google OAuth
      // Google devolverá: /integrations?code=...&state=... — necesitamos renombrar params
      // para distinguirlos de otros posibles params de la app.
      // Añadimos un redirect_uri personalizado que ya incluye los parámetros correctos.
      // En realidad Google usa 'code' y 'state' como params fijos — los detectamos
      // como 'gcal_code' y 'gcal_state' mediante el state de la URL de auth que
      // contiene el project_id. Sin embargo, Google no renombra params.
      // SOLUCIÓN: usar la URL tal cual — el componente detecta 'code' en URL params.
      window.location.href = data.auth_url
    } catch (err) {
      toast.error('Error al iniciar OAuth: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleExchangeCode = async (code: string, state: string) => {
    if (!projectId) return

    setIsExchanging(true)
    try {
      const freshSession = await getFreshSession(session)
      if (!freshSession) {
        toast.error('Sesión expirada — recarga la página e inicia sesión de nuevo')
        return
      }

      const redirectUri = `${window.location.origin}/integrations`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/connect-google-calendar`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey':        SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            project_id:   projectId,
            action:       'exchange_code',
            code,
            state,
            redirect_uri: redirectUri,
          }),
        })
      } finally {
        clearTimeout(timeout)
      }

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        toast.error(`Error completando la autorización: ${data?.reason ?? 'desconocido'}`)
        return
      }

      setConnectionId(data.connection_id)
      setAccountEmail(data.account_email ?? null)
      setIsConnected(true)
      toast.success('Google Calendar conectado — haz clic en "Sincronizar Ahora" para importar tus eventos')
    } catch (err) {
      toast.error('Error al completar OAuth: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsExchanging(false)
    }
  }

  const handleSync = async (overrideConnectionId?: string) => {
    const connId = overrideConnectionId ?? connectionId
    if (!projectId || !connId) {
      toast.error('Conexión no disponible')
      return
    }

    setIsSyncing(true)
    setSyncResult(null)
    try {
      const freshSession = await getFreshSession(session)
      if (!freshSession) {
        toast.error('Sesión expirada — recarga la página e inicia sesión de nuevo')
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/sync-google-calendar`, {
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

      if (!res.ok) {
        if (data?.reason === 'token_refresh_failed') {
          toast.error('El acceso a Google Calendar ha expirado o fue revocado. Vuelve a conectar.')
          setIsConnected(false)
          setConnectionError('Acceso revocado — vuelve a autorizar con Google.')
          return
        }
        throw new Error(data?.reason ?? data?.message ?? `HTTP ${res.status}`)
      }
      if (!data?.ok) {
        toast.error(`Error en sync: ${data?.reason ?? 'desconocido'}`)
        return
      }

      setLastSync(new Date().toLocaleString('es-ES'))
      setSyncResult(data as SyncResult)
      setHasPriorSync(true)

      void queryClient.invalidateQueries({ queryKey: ['sync_runs', connId] })

      // Correr Calendar Agent silenciosamente tras sync exitoso
      void runCalendarAgent(projectId, connId).then((result) => {
        if (result.insights_emitted > 0) {
          void queryClient.invalidateQueries({ queryKey: ['calendar_insights', projectId] })
        }
      }).catch((err) => {
        console.warn('Calendar Agent error (non-blocking):', err)
      })

      const msg = data.is_partial
        ? `Sync parcial — ${data.entities_written} eventos importados (se superó el límite)`
        : `Sync completado — ${data.entities_synced} eventos, ${data.entities_written} importados`
      toast.success(msg)
    } catch (err) {
      toast.error('Error en sincronización: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSyncing(false)
    }
  }

  // Detectar retorno de OAuth estándar (Google usa 'code' y 'state' params)
  useEffect(() => {
    if (!projectId || isExchanging || isConnected) return
    const url = new URL(window.location.href)
    const code  = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) return

    // Verificar que el state corresponde a este proyecto (base64 del project_id)
    let stateProjectId = ''
    try {
      stateProjectId = atob(state)
    } catch { return }

    if (stateProjectId !== projectId) return

    // Limpiar params de URL
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, '', url.toString())

    void handleExchangeCode(code, state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isConnected])

  if (isLoading || isExchanging) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 size={16} className="animate-spin" />
        {isExchanging ? 'Completando autorización con Google...' : 'Cargando...'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={22} className="text-blue-500" />
                Google Calendar
                {accountEmail && (
                  <span className="text-sm font-normal text-muted-foreground">· {accountEmail}</span>
                )}
              </CardTitle>
              <CardDescription>
                Importa eventos del calendario primario para trackear reuniones y carga operativa
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge className="bg-green-500">
                <CheckCircle2 size={12} className="mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline">
                <AlertCircle size={12} className="mr-1" />
                Desconectado
              </Badge>
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
                    <strong>Conexión interrumpida.</strong> {connectionError}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertDescription className="space-y-2">
                  <p>
                    Al pulsar "Conectar", serás redirigido a Google para autorizar el acceso
                    de <strong>solo lectura</strong> a tu calendario.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Optimus solo lee eventos — nunca crea, modifica ni elimina eventos de tu calendario.
                    El token se almacena cifrado y se renueva automáticamente.
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || !projectId}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando autorización...
                  </>
                ) : connectionError ? (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Reconectar Google Calendar
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Conectar con Google
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  Integración activa
                </p>
                <p className="text-xs text-muted-foreground">
                  Importa eventos de los próximos 30 días y los últimos 30 días.
                  Acceso de solo lectura — nunca se modifican eventos.
                </p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última sincronización: {lastSync}
                  </p>
                )}
                {syncResult && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_synced}</div>
                      <div className="text-muted-foreground">Procesados</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold text-green-600">{syncResult.entities_written}</div>
                      <div className="text-muted-foreground">Importados</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono font-semibold">{syncResult.entities_rejected}</div>
                      <div className="text-muted-foreground">Rechazados</div>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Ahora
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tutorial post-conexión — solo si nunca ha habido sync */}
      {isConnected && !lastSync && !syncResult && !hasPriorSync && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />
              Google Calendar conectado — qué pasará a continuación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">Pulsa "Sincronizar Ahora"</p>
                  <p className="text-xs text-muted-foreground">
                    Optimus descargará los eventos de tu calendario de los últimos 30 días y los próximos 30.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">Los eventos se almacenan en <span className="font-mono text-xs">integration_entities</span></p>
                  <p className="text-xs text-muted-foreground">
                    Eventos de día completo se descartan en v1 (solo reuniones con hora exacta).
                    El Calendar Agent los analizará para detectar patrones de carga operativa.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">Token automático</p>
                  <p className="text-xs text-muted-foreground">
                    No necesitas volver a autorizar — el token se renueva automáticamente en cada sync.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Sync Health */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="google_calendar" />
      )}

      {/* Calendar Agent Insights */}
      {isConnected && hasPriorSync && (
        <CalendarInsightsCard projectId={projectId} />
      )}

      {/* Qué entra · Dónde va · Qué cambia — I15.64 pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={16} className="text-blue-500" />
            Qué entra · Dónde va · Qué cambia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Dato de entrada</p>
                <p className="font-medium">Eventos del calendario</p>
                <p className="text-muted-foreground mt-0.5">título, inicio, fin, asistentes, organizador</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Dónde va</p>
                <p className="font-mono text-[11px]">integration_entities</p>
                <p className="text-muted-foreground mt-0.5">entity_type='calendar_event'</p>
                <p className="text-muted-foreground">provider='google_calendar'</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Qué cambia</p>
                <p className="font-medium">Reuniones reales visibles</p>
                <p className="text-muted-foreground mt-0.5">base para Calendar Agent — carga operativa y patrones</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Qué no entra (v1)</p>
                <p className="font-medium">Eventos de día completo</p>
                <p className="text-muted-foreground mt-0.5">calendarios secundarios, eventos sin hora exacta</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Ventana</p>
                <p className="font-mono text-[11px]">±30 días desde hoy</p>
                <p className="text-muted-foreground mt-0.5">30 días atrás + 30 días adelante</p>
                <p className="text-muted-foreground">fija en v1 — expandible en v2</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>Próxima fase</p>
                <p className="font-medium">Calendar Agent activo</p>
                <p className="text-muted-foreground mt-0.5">analiza carga semanal de reuniones y densidad respecto a la jornada laboral</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
