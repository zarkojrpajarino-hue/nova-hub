/**
 * STRIPE INTEGRATION
 *
 * Componente para configurar integración con Stripe
 * Conecta con edge function: sync-stripe
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StripeIntegration() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!apiKey.startsWith('sk_')) {
      toast.error('API Key debe empezar con "sk_"');
      return;
    }

    setIsLoading(true);
    try {
      // Guardar en tabla financial_integrations
      const { error } = await supabase
        .from('financial_integrations')
        .upsert({
          provider: 'stripe',
          api_key: apiKey,
          is_active: true,
        });

      if (error) throw error;

      setIsConnected(true);
      toast.success('¡Stripe conectado exitosamente!');
      setApiKey(''); // Limpiar por seguridad

      // Hacer primera sincronización
      await handleSync();
    } catch (error: any) {
      console.error('Error conectando Stripe:', error);
      toast.error('Error al conectar: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe', {
        body: { manual: true },
      });

      if (error) throw error;

      setLastSync(new Date().toLocaleString('es-ES'));
      toast.success(`Sincronización completada: ${data?.transactionsCount || 0} transacciones`);
    } catch (error: any) {
      console.error('Error sincronizando:', error);
      toast.error('Error en sincronización: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('financial_integrations')
        .update({ is_active: false })
        .eq('provider', 'stripe');

      if (error) throw error;

      setIsConnected(false);
      toast.success('Stripe desconectado');
    } catch (error: any) {
      console.error('Error desconectando:', error);
      toast.error('Error al desconectar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M2 10h20M2 10v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9M2 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" stroke="#635BFF" strokeWidth="2"/>
                </svg>
                Stripe
              </CardTitle>
              <CardDescription>
                Sincroniza automáticamente tus transacciones de Stripe
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
              <Alert>
                <AlertDescription>
                  <strong>Nota:</strong> Necesitas una API Key de Stripe. La encuentras en{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Stripe Dashboard
                    <ExternalLink size={12} />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="stripe-key">Secret Key (sk_...)</Label>
                <Input
                  id="stripe-key"
                  type="password"
                  placeholder="sk_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Tu API Key se guarda encriptada y nunca se comparte.
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !apiKey}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar Stripe'
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                  ✓ Integración activa
                </p>
                <p className="text-xs text-muted-foreground">
                  Las transacciones se sincronizan automáticamente cada hora.
                </p>
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

                <Button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Desconectar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What gets synced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Qué se sincroniza?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Pagos exitosos</p>
                <p className="text-xs text-muted-foreground">
                  Todos los charges con estado "succeeded"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Suscripciones</p>
                <p className="text-xs text-muted-foreground">
                  Revenue recurrente de subscriptions activas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Metadatos de cliente</p>
                <p className="text-xs text-muted-foreground">
                  Email, nombre, país del cliente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Fees de Stripe</p>
                <p className="text-xs text-muted-foreground">
                  Se calcula automáticamente el margen neto
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
