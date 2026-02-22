/**
 * INTEGRATIONS VIEW
 *
 * Página de configuración de integraciones externas
 * Slack, Webhooks, APIs, etc.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlackIntegration } from '@/components/integrations/SlackIntegration';
import { StripeIntegration } from '@/components/integrations/StripeIntegration';
import { HoldedIntegration } from '@/components/integrations/HoldedIntegration';
import { ExternalLink, Zap, MessageSquare, Code, ArrowRight, CreditCard, FileText, TrendingUp, Users, Clock } from 'lucide-react';
import { HelpWidget } from '@/components/ui/section-help';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';
import { HowItWorks } from '@/components/ui/how-it-works';
import { IntegrationsPreviewModal } from '@/components/preview/IntegrationsPreviewModal';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface IntegrationsViewProps {
  isDemoMode?: boolean;
}

// Componente interno que renderiza el contenido
function IntegrationsContent({ isDemoMode = false }: IntegrationsViewProps = {}) {
  const { goBack, canGoBack } = useNavigation();
  const { currentProject: _currentProject } = useCurrentProject();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const demoData = PREMIUM_DEMO_DATA.integrations;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Back Button */}
      {canGoBack && (
        <BackButton onClick={goBack} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Integraciones</h1>
        <p className="text-muted-foreground">
          Conecta Nova Hub con tus herramientas favoritas para automatizar tu flujo de trabajo
        </p>
      </div>

      {/* How It Works */}
      <HowItWorks
        title="Sistema de Integraciones"
        description="Conecta Nova Hub con tu stack tecnológico"
        whatIsIt="Integra Nova Hub con Slack, Stripe, Holded y más. Automatiza notificaciones, sincroniza datos financieros y conecta tu flujo de trabajo. Acceso completo a API REST para integraciones personalizadas."
        dataInputs={[
          {
            from: "Herramientas externas",
            items: [
              "Eventos de Slack (mensajes, menciones)",
              "Transacciones de Stripe (pagos, suscripciones)",
              "Facturas de Holded (cobros, clientes)"
            ]
          }
        ]}
        dataOutputs={[
          {
            to: "Tus herramientas",
            items: [
              "Notificaciones automáticas en Slack",
              "Webhooks personalizados",
              "Sincronización bidireccional de datos"
            ]
          }
        ]}
        nextStep={{
          action: "Configura tu primera integración",
          destination: "Automatiza tu flujo de trabajo"
        }}
        onViewPreview={() => setShowPreviewModal(true)}
        premiumFeature="api_access"
        requiredPlan="advanced"
      />

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Slack Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6ZM18 9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7Z"
                    fill="#E01E5A"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Slack</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  Activo
                </Badge>
              </div>
            </div>
            <CardDescription>
              Recibe notificaciones automáticas de eventos importantes en tu workspace
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stripe Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Stripe</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  Disponible
                </Badge>
              </div>
            </div>
            <CardDescription>
              Sincroniza transacciones, suscripciones y revenue de Stripe
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Holded Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-cyan-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Holded</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  Disponible
                </Badge>
              </div>
            </div>
            <CardDescription>
              Importa facturas, clientes y cobros desde Holded automáticamente
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Webhooks Card */}
        <Card className="hover-lift opacity-60 cursor-not-allowed">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Webhooks</CardTitle>
                <Badge variant="outline" className="text-xs mt-1">
                  Próximamente
                </Badge>
              </div>
            </div>
            <CardDescription>
              Envía eventos a URLs personalizadas para integraciones custom
            </CardDescription>
          </CardHeader>
        </Card>

        {/* API Card */}
        <Card className="hover-lift opacity-60 cursor-not-allowed">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Code className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">API REST</CardTitle>
                <Badge variant="outline" className="text-xs mt-1">
                  Próximamente
                </Badge>
              </div>
            </div>
            <CardDescription>
              Accede a tus datos desde aplicaciones externas vía API
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="slack" className="space-y-6">
        <TabsList>
          <TabsTrigger value="slack" className="gap-2">
            <MessageSquare size={16} />
            Slack
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard size={16} />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="holded" className="gap-2">
            <FileText size={16} />
            Holded
          </TabsTrigger>
          <TabsTrigger value="webhooks" disabled>
            <Zap size={16} />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api" disabled>
            <Code size={16} />
            API
          </TabsTrigger>
        </TabsList>

        {/* Slack Tab */}
        <TabsContent value="slack" className="space-y-6">
          {/* Instructions Card */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 Cómo configurar Slack
              </CardTitle>
              <CardDescription>
                Sigue estos pasos para recibir notificaciones automáticas en tu workspace de Slack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Accede a la documentación de Slack</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ve a la página oficial de Incoming Webhooks de Slack
                  </p>
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    api.slack.com/messaging/webhooks
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Crea una Incoming Webhook</h4>
                  <p className="text-sm text-muted-foreground">
                    Click en "Create your Slack app" y sigue el asistente. Cuando te pida permisos,
                    asegúrate de activar "Incoming Webhooks".
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Selecciona el canal</h4>
                  <p className="text-sm text-muted-foreground">
                    Elige el canal de Slack donde quieres recibir las notificaciones (ej: #general,
                    #proyectos, #ventas, etc.)
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Copia la Webhook URL</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Slack te dará una URL que se ve así:
                  </p>
                  <code className="text-xs bg-muted px-3 py-1.5 rounded block">
                    https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
                  </code>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Pega la URL abajo</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa el botón "Añadir Webhook" de abajo, pega la URL, selecciona los tipos de
                    notificaciones y guarda.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-green-600 dark:text-green-400">
                    ¡Listo! Ya recibirás notificaciones
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cuando sucedan eventos importantes (lead ganado, OBV validado, etc.), recibirás
                    un mensaje automático en tu canal de Slack.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Note */}
          <Alert>
            <ArrowRight className="w-4 h-4" />
            <AlertDescription>
              <strong>Nota:</strong> NO necesitas API Key de Slack. La Webhook URL es todo lo que
              necesitas. Es completamente gratuito y no tiene límites de uso.
            </AlertDescription>
          </Alert>

          {/* Slack Integration Component */}
          <SlackIntegration isDemoMode={isDemoMode} />

          {/* Demo Preview si está en modo demo */}
          {isDemoMode && (
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Vista Preview - Slack Conectado
                </CardTitle>
                <CardDescription>
                  Así se vería tu workspace con Nova Hub conectado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{demoData.slack.stats.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">Total Events</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{demoData.slack.stats.activeUsers}</div>
                      <div className="text-xs text-muted-foreground">Active Users</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{demoData.slack.connected_channels}</div>
                      <div className="text-xs text-muted-foreground">Connected Channels</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{demoData.slack.stats.avgResponseTime}</div>
                      <div className="text-xs text-muted-foreground">Avg Response</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Notificaciones Recientes
                  </h4>
                  <div className="space-y-2">
                    {demoData.slack.recent_notifications.map((notif) => (
                      <div key={notif.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{notif.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notif.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{notif.channel}</Badge>
                              <span className="text-xs text-muted-foreground">{notif.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <h4 className="font-semibold mb-3">Canales Configurados</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {demoData.slack.channels.map((channel) => (
                      <div key={channel.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-semibold">{channel.name}</span>
                          <Badge variant={channel.enabled ? "default" : "secondary"} className="text-xs">
                            {channel.enabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {channel.members}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {channel.events_today} hoy
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos que disparan notificaciones</CardTitle>
              <CardDescription>
                Estos son los tipos de eventos que puedes recibir en Slack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎉</span>
                    <span className="font-medium text-sm">Lead ganado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando un lead se cierra con estado "cerrado_ganado"
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✅</span>
                    <span className="font-medium text-sm">OBV validado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando un OBV recibe suficientes validaciones
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-sm">Objetivo alcanzado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando se completa un objetivo del proyecto
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🚀</span>
                    <span className="font-medium text-sm">Hito del proyecto</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hitos importantes en la vida del proyecto
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✔️</span>
                    <span className="font-medium text-sm">Tarea completada</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notificación cuando se completan tareas importantes
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👋</span>
                    <span className="font-medium text-sm">Nuevo miembro</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando alguien se une al equipo del proyecto
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-6">
          {/* Instructions Card */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💳 Configurar Stripe
              </CardTitle>
              <CardDescription>
                Conecta tu cuenta de Stripe para sincronizar transacciones automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Accede a tu Dashboard de Stripe</h4>
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    dashboard.stripe.com/apikeys
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Copia tu Secret Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Busca la clave que empieza con <code className="bg-muted px-1 rounded">sk_live_...</code> o <code className="bg-muted px-1 rounded">sk_test_...</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Pega la clave abajo</h4>
                  <p className="text-sm text-muted-foreground">
                    Se guardará de forma segura y encriptada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Integration Component */}
          <StripeIntegration />

          {/* Demo Preview Stripe */}
          {isDemoMode && (
            <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Vista Preview - Stripe Conectado
                </CardTitle>
                <CardDescription>
                  Así se verían tus transacciones de Stripe sincronizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas principales */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        €{(demoData.stripe.preview.totalRevenue / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">Total Revenue</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        €{(demoData.stripe.preview.mrr / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted-foreground">MRR</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {demoData.stripe.preview.activeSubscriptions}
                      </div>
                      <div className="text-xs text-muted-foreground">Subscriptions</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {demoData.stripe.preview.churnRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Churn Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transacciones recientes */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Transacciones Recientes
                  </h4>
                  <div className="space-y-2">
                    {demoData.stripe.preview.recentTransactions.map((txn) => (
                      <div key={txn.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{txn.customer}</p>
                            <p className="text-xs text-muted-foreground">{txn.customer_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">€{txn.amount.toLocaleString()}</p>
                            <div className="flex items-center gap-2 justify-end">
                              <Badge variant={txn.status === 'succeeded' ? 'default' : 'secondary'} className="text-xs">
                                {txn.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{txn.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{txn.plan}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Plans */}
                <div>
                  <h4 className="font-semibold mb-3">Planes Más Populares</h4>
                  <div className="space-y-2">
                    {demoData.stripe.preview.topPlans.map((plan, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{plan.count} suscripciones</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">€{(plan.revenue / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-muted-foreground">revenue total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Holded Tab */}
        <TabsContent value="holded" className="space-y-6">
          {/* Instructions Card */}
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Configurar Holded
              </CardTitle>
              <CardDescription>
                Sincroniza facturas, clientes y cobros desde tu cuenta de Holded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Ve a la configuración de API</h4>
                  <a
                    href="https://app.holded.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    app.holded.com/settings/api
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Genera una nueva API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Click en "Generar nueva API Key" y copia el código generado
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Pega la API Key abajo</h4>
                  <p className="text-sm text-muted-foreground">
                    Se iniciará la sincronización automática de tus datos financieros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holded Integration Component */}
          <HoldedIntegration />

          {/* Demo Preview Holded */}
          {isDemoMode && (
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600" />
                  Vista Preview - Holded Conectado
                </CardTitle>
                <CardDescription>
                  Así se verían tus facturas y cobros sincronizados desde Holded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas principales */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        €{(demoData.holded.preview.totalAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">Facturado Total</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        €{(demoData.holded.preview.pendingAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">Pendiente Cobro</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {demoData.holded.preview.totalInvoices}
                      </div>
                      <div className="text-xs text-muted-foreground">Facturas</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        <Clock className="h-6 w-6 inline" />
                      </div>
                      <div className="text-xs text-muted-foreground">{demoData.holded.preview.avgPaymentTimeDays}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Facturas recientes */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-500" />
                    Facturas Recientes
                  </h4>
                  <div className="space-y-2">
                    {demoData.holded.preview.recentInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-mono text-xs font-semibold">{inv.number}</p>
                              <Badge
                                variant={
                                  inv.status === 'paid'
                                    ? 'default'
                                    : inv.status === 'overdue'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {inv.status === 'paid' ? 'Pagada' : inv.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{inv.client}</p>
                            <p className="text-xs text-muted-foreground">{inv.client_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">€{inv.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.status === 'paid' && inv.paid_date
                                ? `Pagada ${inv.paid_date}`
                                : inv.status === 'overdue' && inv.days_overdue
                                ? `${inv.days_overdue} días vencida`
                                : `Vence ${inv.due_date}`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue mensual */}
                <div>
                  <h4 className="font-semibold mb-3">Evolución Mensual</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {demoData.holded.preview.monthlyRevenue.map((month, idx) => (
                      <div key={idx} className="text-center p-2 rounded-lg border bg-card">
                        <div className="text-xs text-muted-foreground mb-1">{month.month}</div>
                        <div className="text-sm font-bold text-green-600">
                          €{(month.amount / 1000).toFixed(0)}K
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Webhooks Tab (placeholder) */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks Personalizados</CardTitle>
              <CardDescription>Próximamente disponible</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* API Tab (placeholder) */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API REST</CardTitle>
              <CardDescription>Próximamente disponible</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <HelpWidget section="integrations" />

      {/* Preview Modal */}
      <IntegrationsPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
}

// Componente principal exportado SIN FeatureGate
// Integraciones es accesible para todos
export default function IntegrationsView(props: IntegrationsViewProps) {
  return <IntegrationsContent {...props} />;
}
