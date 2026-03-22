/**
 * HOLDED INTEGRATION
 *
 * Componente para configurar integración con Holded.
 * Pendiente reescritura completa con patrón I15:
 * connect-holded → integration_connections + pgcrypto + sync-holded → integration_entities
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
// I15.0.4 — supabase import aislado (financial_integrations no existe — pendiente reescritura)
// import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiKeyGuide } from './ApiKeyGuide';

import { useTranslation } from 'react-i18next';
export function HoldedIntegration() {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, _setIsLoading] = useState(false);
  const [isSyncing, _setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, _setLastSync] = useState<string | null>(null);

  const handleConnect = async () => {
    // I15.0.4 — AISLADO: tabla financial_integrations no existe.
    // Pendiente reescritura completa (mismo patrón que StripeIntegration + integration_connections + pgcrypto).
    toast.error(t('integrations.holdedNoDisponibleAún'));
  };

  const handleSync = async () => {
    // I15.0.4 — AISLADO: auto-sync-finances depende de financial_integrations (no existe).
    toast.error(t('integrations.syncDeHoldedNo'));
  };

  const handleDisconnect = async () => {
    // I15.0.4 — AISLADO: tabla financial_integrations no existe.
    setIsConnected(false);
    toast.success(t('integrations.holdedDesconectado'));
  };

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
                </div>{t('integrations.holded')}</CardTitle>
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
              <Alert>
                <AlertDescription>
                  <strong>Cómo obtener tu API Key:</strong>
                  <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                    <li>Ve a{' '}
                      <a
                        href="https://app.holded.com/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Holded Settings → API
                        <ExternalLink size={12} />
                      </a>
                    </li>
                    <li>Click en t('integrations.generarNuevaApiKey')</li>
                    <li>{t('integrations.copiaLaKeyY')}</li>
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
                disabled={isLoading || !apiKey}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.conectando')}</>
                ) : (
                  t('integrations.conectarHolded')
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  ✓ Integración activa
                </p>
                <p className="text-xs text-muted-foreground">{t('integrations.facturasYCobrosSe')}</p>
                {lastSync && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última sincronización: {lastSync}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  variant="outline"
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('integrations.sincronizando')}</>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />{t('integrations.sincronizarAhora')}</>
                  )}
                </Button>

                <Button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  variant="destructive"
                >{t('integrations.desconectar')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What gets synced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('integrations.quéSeSincroniza')}</CardTitle>
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
                <p className="text-xs text-muted-foreground">
                  Datos de clientes (nombre, email, empresa)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('integrations.productosservicios')}</p>
                <p className="text-xs text-muted-foreground">{t('integrations.itemsFacturadosParaAnálisis')}</p>
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
              <span className="text-blue-500">•</span>{t('integrations.dashboardFinancieroActualizadoAutomáticamente')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">•</span>{t('integrations.alertasCuandoFacturasEstán')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">•</span>{t('integrations.mrrCalculadoAutomáticamenteDe')}</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-500">•</span>{t('integrations.proyeccionesDeRevenueCon')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
