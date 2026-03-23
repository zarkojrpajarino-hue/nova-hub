/**
 * STRIPE INTEGRATION
 *
 * Conecta Stripe, importa suscripciones activas y escribe MRR via write_integration_to_engine_table().
 * Edge functions: connect-stripe, sync-stripe
 */

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/config'
import { SyncBanner } from './SyncBanner'
import { SyncHealthCard } from './SyncHealthCard'
import { ApiKeyGuide } from './ApiKeyGuide'
import { FinanceInsightsCard } from './FinanceInsightsCard'
import type { EngineSnapshot } from '@/lib/engine-delta'
import { runFinanceAgent } from '@/services/financeAgentService'
import type { Session } from '@supabase/supabase-js'

import { useTranslation } from 'react-i18next';
// Obtiene el token más fresco posible.
// Intenta getSession() (siempre devuelve el token actual) con un timeout de 2s.
// Si tarda más de 2s (lock retenido por fetchProfile), cae al session del contexto.
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

interface StripeIntegrationProps {
  projectId: string | undefined
}

interface SyncResult {
  pre_engine_snapshot: EngineSnapshot | null
  post_engine_snapshot: EngineSnapshot
  mrr: number
  entities_synced: number
  log_id: string | null
  write_status: string
}

export function StripeIntegration({ projectId }: StripeIntegrationProps) {
  const { t } = useTranslation();
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)  // I15.66
  const [hasPriorSync, setHasPriorSync] = useState(false)                     // I15.65: tutorial no reaparece si ya hubo sync

  // Carga conexión existente desde DB al montar (I15.66: detecta 'error'; I15.65: lee last_sync_at)
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('integration_connections')
      .select('id, status, error_message, last_sync_at')
      .eq('project_id', projectId)
      .eq('provider', 'stripe')
      .in('status', ['active', 'error'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.status === 'active') {
          setIsConnected(true)
          setConnectionId(data.id)
          // I15.65: si last_sync_at existe → ya hubo al menos un sync → no mostrar tutorial post-conexión
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
    if (!apiKey.startsWith('sk_')) {
      toast.error('La API Key debe empezar con "sk_"')
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
        res = await fetch(`${FUNCTIONS_URL}/connect-stripe`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ project_id: projectId, api_key: apiKey }),
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = await res.json()

      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`)
      if (!data?.ok) {
        const msg = data?.reason === 'invalid_key'
          ? t('integrations.apiKeyInválidaVerifica')
          : `Error al conectar: ${data?.reason ?? 'desconocido'}`
        toast.error(msg)
        return
      }

      setConnectionId(data.connection_id)
      setIsConnected(true)
      setApiKey('')
      toast.success('Stripe conectado — haz clic en Sincronizar Ahora para importar tus datos')
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
      const timeout = setTimeout(() => controller.abort(), 30_000)
      let res: Response
      try {
        res = await fetch(`${FUNCTIONS_URL}/sync-stripe`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
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
      setHasPriorSync(true)  // I15.65: oculta el tutorial post-conexión tras primer sync exitoso
      // Invalidar query de sync_runs para que SyncHealthCard muestre el run recién completado
      // I15.DEBT.4: usar connId (ya resuelve overrideConnectionId) en lugar de connectionId
      // del state (puede no estar actualizado si sync se lanza inmediatamente tras connect)
      void queryClient.invalidateQueries({ queryKey: ['sync_runs', connId] })
      // mrr viene en CENTAVOS — dividir por 100 para mostrar en euros
      const mrrEuros = data.mrr != null ? (data.mrr / 100).toFixed(2) : '0.00'
      toast.success(`Sync completado — ${data.entities_synced} suscripciones, MRR €${mrrEuros}`)
      // I15.78 — Finance Agent: analizar entidades post-sync y emitir insights
      if (projectId && connId) {
        void runFinanceAgent(projectId, connId).then((result) => {
          if (result.insights_emitted > 0) {
            // Invalidar para que FinanceInsightsCard recargue
            void queryClient.invalidateQueries({ queryKey: ['finance_insights', projectId] })
          }
        }).catch((_err) => {
          // El Finance Agent falla silenciosamente — no interrumpe el flujo de sync
        })
      }
    } catch (err) {
      toast.error('Error en sincronización: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SyncBanner — visible tras sync exitoso */}
      {syncResult?.post_engine_snapshot && (
        <SyncBanner
          pre={syncResult.pre_engine_snapshot}
          post={syncResult.post_engine_snapshot}
          onDismiss={() => setSyncResult(null)}
        />
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 10h20M2 10v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9M2 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"
                    stroke="#635BFF"
                    strokeWidth="2"
                  />
                </svg>{t('integrations.stripe')}</CardTitle>
              <CardDescription>{t('integrations.importaSuscripcionesActivasPara')}</CardDescription>
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
              {/* I15.66 — Reconexión: alerta cuando hay conexión previa en estado error */}
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
                  <strong>Nota:</strong> Necesitas una API Key de Stripe. La encuentras en{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >{t('integrations.stripeDashboard')}<ExternalLink size={12} />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stripe-key">Secret Key (sk_...)</Label>
                  <ApiKeyGuide provider="stripe" />
                </div>
                <Input
                  id="stripe-key"
                  type="password"
                  placeholder={t('integrations.sklive')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t('integrations.tuApiKeySe')}</p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !apiKey || !projectId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : connectionError ? (
                  t('integrations.reconectarStripe')
                ) : (
                  t('integrations.conectarStripe')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">{t('integrations.integraciónActiva')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.lasSuscripcionesSeSincronizan')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última sincronización: {lastSync}
                  </p>
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

      {/* I15.65 — Tutorial post-conexión: solo si nunca ha habido sync (sesión ni DB) */}
      {isConnected && !lastSync && !syncResult && !hasPriorSync && (
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />{t('integrations.stripeConectadoQuéPasará')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium">Pulsa t('integrations.sincronizarAhora6')</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.optimusPediráAStripe')}<span className="font-mono">status=active</span>.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium">MRR se escribe en<span className="font-mono text-xs">key_metrics</span></p>
                  <p className="text-xs text-muted-foreground">{t('integrations.elTotalDeSuscripciones')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium">{t('integrations.financialEngineRecalcula')}</p>
                  <p className="text-xs text-muted-foreground">{t('integrations.probabilityFaseYRiesgo')}</p>
                </div>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">{t('integrations.siNoTienesSuscripciones')}</p>
          </CardContent>
        </Card>
      )}

      {/* Sync Health — I15.63 */}
      {isConnected && (
        <SyncHealthCard connectionId={connectionId} provider="stripe" />
      )}

      {/* Finance Agent insights — I15.78 */}
      {isConnected && (
        <FinanceInsightsCard projectId={projectId} />
      )}

      {/* I15.64 — Qué dato entra, qué módulo hidrata, qué cambia en Optimus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('integrations.quéEntraDóndeVa')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/50">
            {/* Fila 1 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.suscripcionesActivas')}</p>
                <p className="text-muted-foreground">status=active en Stripe</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.móduloEnOptimus')}</p>
                <p className="font-medium font-mono">key_metrics.mrr</p>
                <p className="text-muted-foreground">suma de precios en centavos</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.efecto')}</p>
                <p className="font-medium">{t('integrations.financialEngine')}</p>
                <p className="text-muted-foreground">peso 15% en probability</p>
              </div>
            </div>
            {/* Fila 2 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">Precio × 12</p>
                <p className="text-muted-foreground">calculado al escribir</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.móduloEnOptimus')}</p>
                <p className="font-medium font-mono">key_metrics.arr</p>
                <p className="text-muted-foreground">mrr × 12, automático</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.efecto')}</p>
                <p className="font-medium">{t('integrations.dashboardFinanciero')}</p>
                <p className="text-muted-foreground">{t('integrations.arrActualizado')}</p>
              </div>
            </div>
            {/* Fila 3 */}
            <div className="grid grid-cols-3 gap-2 py-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.datoDeEntrada')}</p>
                <p className="font-medium">{t('integrations.númSuscripciones')}</p>
                <p className="text-muted-foreground">count de aceptadas</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.móduloEnOptimus')}</p>
                <p className="font-medium font-mono">key_metrics.total_customers</p>
                <p className="text-muted-foreground">clientes activos</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>{t('integrations.efecto')}</p>
                <p className="font-medium">{t('integrations.rankingsTeam')}</p>
                <p className="text-muted-foreground">base de clientes real</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">{t('integrations.noSeSincronizanHistorial')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
