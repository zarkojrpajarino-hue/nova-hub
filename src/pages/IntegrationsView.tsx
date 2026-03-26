/**
 * INTEGRATIONS VIEW
 *
 * Página de configuración de integraciones externas
 * Slack, Webhooks, APIs, etc.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlackIntegration } from '@/components/integrations/SlackIntegration';
import { StripeIntegration } from '@/components/integrations/StripeIntegration';
import { HoldedIntegration } from '@/components/integrations/HoldedIntegration';
import { AsanaIntegration } from '@/components/integrations/AsanaIntegration';
import { HubSpotIntegration } from '@/components/integrations/HubSpotIntegration';
import { GoogleCalendarIntegration } from '@/components/integrations/GoogleCalendarIntegration';
import { TrelloIntegration } from '@/components/integrations/TrelloIntegration';
import { SlackSyncIntegration } from '@/components/integrations/SlackSyncIntegration';
import { NotionIntegration } from '@/components/integrations/NotionIntegration';
import { IntegrationRecommendationsPanel } from '@/components/integrations/IntegrationRecommendationsPanel';
import { ExternalLink, Zap, MessageSquare, Code, ArrowRight, CreditCard, FileText, TrendingUp, Users, Clock, CheckCircle2, AlertCircle, AlertTriangle, CheckSquare, CalendarDays, Settings2, LayoutGrid, BookOpen, PartyPopper, CheckCircle, Target, Rocket } from 'lucide-react';
import { HelpWidget } from '@/components/ui/section-help';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrationConnections, useSyncQuality, type IntegrationConnectionStatus, type SyncQuality } from '@/hooks/useIntegrationConnections';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourcePreferencesPanel } from '@/components/evidence/SourcePreferencesPanel';
import { TrustScreen } from '@/components/integrations/TrustScreen';
import { FinancialIntelligencePanel } from '@/components/integrations/panels/FinancialIntelligencePanel';
import { SalesIntelligencePanel } from '@/components/integrations/panels/SalesIntelligencePanel';
import { ExecutionIntelligencePanel } from '@/components/integrations/panels/ExecutionIntelligencePanel';
import { TeamIntelligencePanel } from '@/components/integrations/panels/TeamIntelligencePanel';
import { CalendarIntelligencePanel } from '@/components/integrations/panels/CalendarIntelligencePanel';
import { IntegrationHealthPanel } from '@/components/integrations/panels/IntegrationHealthPanel';
import { UpgradePromptModal } from '@/components/subscription/UpgradePromptModal';
import { usePlanTierLimits } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';

import { useTranslation } from 'react-i18next';
// AUD.B.7 — Badge de calidad de sync (migration 20260326000009)
function SyncQualityBadge({ quality }: { quality: SyncQuality | undefined }) {
  const { t } = useTranslation();
  if (!quality || !quality.has_quality_warning) return null
  const pct = quality.quality_pct != null ? Math.round(quality.quality_pct * 100) : null
  return (
    <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
      <AlertTriangle size={11} className="mr-1" />
      {pct != null ? `datos incompletos (${pct}% sync)` : 'sync parcial'}
    </Badge>
  )
}

// Badge que refleja estado real de integration_connections (I15.58 + I15.60)
// isLoading: muestra skeleton mientras la query de connections está cargando (evita falso t('integrations.disponible10'))
function ConnectionBadge({ status, isLoading }: { status: IntegrationConnectionStatus; isLoading: boolean }) {
  if (isLoading) {
    return <Badge variant="outline" className="text-xs opacity-40 animate-pulse">{t('integrations.cargando')}</Badge>
  }
  if (status.status === 'active' && status.is_stale) {
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
        <AlertTriangle size={11} className="mr-1" />{t('integrations.stale')}</Badge>
    )
  }
  if (status.status === 'active') {
    return (
      <Badge className="text-xs bg-green-500">
        <CheckCircle2 size={11} className="mr-1" />{t('integrations.conectado')}</Badge>
    )
  }
  if (status.status === 'error') {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle size={11} className="mr-1" />{t('integrations.error')}</Badge>
    )
  }
  // not_connected | disconnected
  return (
    <Badge variant="outline" className="text-xs">{t('integrations.disponible')}</Badge>
  )
}

interface IntegrationsViewProps {
  isDemoMode?: boolean;
}

// Componente interno que renderiza el contenido
function IntegrationsContent({ isDemoMode = false }: IntegrationsViewProps = {}) {
  const { t } = useTranslation();
  const { goBack, canGoBack } = useNavigation();
  const { currentProject } = useCurrentProject();
  const demoData = PREMIUM_DEMO_DATA.integrations;
  const { getStatus, isLoading, connections } = useIntegrationConnections(currentProject?.id);
  const { data: syncQuality = {} } = useSyncQuality(currentProject?.id);
  const hasAnyActive = !isLoading && Object.values(connections).some((c) => c.status === 'active');

  // Integration plan limit check
  const { canUseFeatureByTier } = usePlanTierLimits(currentProject?.id);
  const [showIntegrationUpgrade, setShowIntegrationUpgrade] = useState(false);
  const integrationsAllowed = canUseFeatureByTier('integrations');

  // T17.27 — Sheet de preferencias de fuente
  const [sourcePrefsOpen, setSourcePrefsOpen] = useState(false);
  const activeProviders = new Set(
    Object.entries(connections)
      .filter(([, c]) => c.status === 'active')
      .map(([provider]) => provider)
  );

  // Controlled tab state — permite navegar desde IntegrationRecommendationsPanel (I15.74)
  const [activeTab, setActiveTab] = useState('slack');

  // Fase del proyecto — para IntegrationRecommendationsPanel (I15.67 + I15.68)
  const { data: phaseData } = useQuery({
    queryKey: ['project_phase_state', currentProject?.id],
    enabled: !!currentProject?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('project_phase_state')
        .select('current_phase')
        .eq('project_id', currentProject!.id)
        .maybeSingle();
      return data;
    },
  });
  const currentPhase = phaseData?.current_phase ?? 0;

  // Contexto para el motor de recomendaciones (I15.70)
  const connectedProviders = Object.entries(connections)
    .filter(([, c]) => c.status === 'active')
    .map(([provider]) => provider);
  const recommendationCtx = {
    current_phase: currentPhase,
    connected_providers: connectedProviders,
    mrr: null,  // I15.75 DEBT — mrr no disponible en este nivel; se filtra por fase y conexión
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Back Button */}
      {canGoBack && (
        <BackButton onClick={goBack} />
      )}

      {/* Header — T17.27 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('integrations.integraciones')}</h1>
          <p className="text-muted-foreground">{t('integrations.conectaNovaHubCon')}</p>
        </div>
        {hasAnyActive && !isDemoMode && (
          <button
            onClick={() => setSourcePrefsOpen(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 shrink-0"
          >
            <Settings2 size={14} />{t('integrations.configurarFuentes')}</button>
        )}
      </div>

      {/* Integration upgrade banner for Free plan */}
      {isPaymentsEnabled() && !integrationsAllowed && (
        <Alert className="border-purple-200 bg-purple-50">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-purple-800 font-medium">
              {t('pricing.integrationsRequirePro')}
            </span>
            <Button
              size="sm"
              onClick={() => setShowIntegrationUpgrade(true)}
              className="bg-purple-600 hover:bg-purple-700 ml-4"
            >
              {t('pricing.viewPlans')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Integration upgrade modal */}
      <UpgradePromptModal
        isOpen={showIntegrationUpgrade}
        onClose={() => setShowIntegrationUpgrade(false)}
        title={t('pricing.integrationsUpgradeTitle')}
        description={t('pricing.integrationsUpgradeDesc')}
        recommendedPlan="pro"
        variant="integration"
      />

      {/* T17.27 — Sheet de preferencias de fuente */}
      <Sheet open={sourcePrefsOpen} onOpenChange={setSourcePrefsOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-base">{t('integrations.configurarFuentesDeDatos')}</SheetTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Ajusta qué fuentes usa el sistema de evidencia y con qué peso.
              Solo se muestran las integraciones activas de este proyecto.
            </p>
          </SheetHeader>
          <div className="pt-4">
            {currentProject?.id ? (
              <SourcePreferencesPanel
                projectId={currentProject.id}
                activeProviders={activeProviders}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t('integrations.sinProyectoActivo')}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* I15.62 — Estado vacío: ninguna integración activa */}
      {!isLoading && !hasAnyActive && !isDemoMode && (
        <div className="rounded-lg border-2 border-dashed border-border/60 p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary/60" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-lg">{t('integrations.sinIntegracionesActivas')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('integrations.conectaStripeParaImportar')}<br />{t('integrations.optimusUsaráLosDatos')}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t('integrations.eligeUnProveedorAbajo')}</p>
        </div>
      )}

      {/* How It Works */}
      <HowItWorks
        title={t('integrations.sistemaDeIntegraciones')}
        description={t('integrations.conectaNovaHubCon11')}
        whatIsIt={t('integrations.integraNovaHubCon')}
        dataInputs={[
          {
            from: t('integrations.herramientasExternas'),
            items: [
              "Eventos de Slack (mensajes, menciones)",
              "Transacciones de Stripe (pagos, suscripciones)",
              "Facturas de Holded (cobros, clientes)"
            ]
          }
        ]}
        dataOutputs={[
          {
            to: t('integrations.tusHerramientas'),
            items: [
              t('integrations.notificacionesAutomáticasEnSlack'),
              t('integrations.webhooksPersonalizados12'),
              t('integrations.sincronizaciónBidireccionalDeDatos')
            ]
          }
        ]}
        nextStep={{
          action: t('integrations.configuraTuPrimeraIntegración'),
          destination: t('integrations.automatizaTuFlujoDe')
        }}
        premiumFeature="api_access"
        requiredPlan="advanced"
      />

      {/* I15.67–I15.68 — Panel de recomendaciones contextuales (no en modo demo) */}
      {!isDemoMode && !isLoading && (
        <IntegrationRecommendationsPanel
          ctx={recommendationCtx}
          onNavigate={setActiveTab}
        />
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Slack Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('slack')}>
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
                <CardTitle className="text-lg">{t('integrations.slack')}</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">{t('integrations.activo')}</Badge>
              </div>
            </div>
            <CardDescription>{t('integrations.outputonlyEnvíaAlertasA')}</CardDescription>
          </CardHeader>
        </Card>

        {/* Stripe Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('stripe')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{t('integrations.stripe')}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('stripe')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['stripe']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Suscripciones activas → <span className="font-mono text-xs">key_metrics.mrr</span> → Financial Engine recalcula probabilidad de éxito (peso 15%).
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Holded Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('holded')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-cyan-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{t('integrations.holded')}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('holded')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['holded']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Facturas y cobros → <span className="font-mono text-xs">key_metrics</span> → <span className="font-mono text-xs">runway_months</span> más preciso con datos reales de Holded.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Asana Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('asana')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <CheckSquare className="w-7 h-7 text-pink-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{t('integrations.asana')}</CardTitle>
                <div className="mt-1">
                  <ConnectionBadge status={getStatus('asana')} isLoading={isLoading} />
                </div>
              </div>
            </div>
            <CardDescription>
              Tareas del workspace → <span className="font-mono text-xs">tasks</span> con <span className="font-mono text-xs">external_provider='asana'</span> → ejecución real visible sin entrada manual.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* HubSpot Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('hubspot')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{t('integrations.hubspot')}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('hubspot')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['hubspot']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Deals del CRM → <span className="font-mono text-xs">integration_entities</span> con <span className="font-mono text-xs">entity_type='deal'</span> → pipeline de ventas real sin entrada manual.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Google Calendar Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('google-calendar')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{t('integrations.googleCalendar')}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('google_calendar')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['google_calendar']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Reuniones del calendario → <span className="font-mono text-xs">integration_entities</span> con <span className="font-mono text-xs">entity_type='calendar_event'</span> → carga de reuniones visible sin entrada manual.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Trello Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('trello')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <LayoutGrid className="w-7 h-7 text-sky-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Trello</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('trello')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['trello']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Cards de tableros → <span className="font-mono text-xs">integration_entities</span> con <span className="font-mono text-xs">entity_type='card'</span> → ejecución y progreso visible.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Slack Sync Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('slack')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-violet-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Slack Sync</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('slack')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['slack']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Actividad de canales → <span className="font-mono text-xs">integration_entities</span> con <span className="font-mono text-xs">entity_type='channel_activity'</span> → comunicación del equipo visible.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Notion Card */}
        <Card className="hover-lift cursor-pointer border-2 hover:border-primary/50 transition-all" onClick={() => setActiveTab('notion')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Notion</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConnectionBadge status={getStatus('notion')} isLoading={isLoading} />
                  <SyncQualityBadge quality={syncQuality['notion']} />
                </div>
              </div>
            </div>
            <CardDescription>
              Páginas y bases de datos → <span className="font-mono text-xs">integration_entities</span> → cobertura de documentación y frescura visible.
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
                <CardTitle className="text-lg">{t('integrations.webhooks')}</CardTitle>
                <Badge variant="outline" className="text-xs mt-1">{t('integrations.próximamente')}</Badge>
              </div>
            </div>
            <CardDescription>{t('integrations.envíaEventosAUrls')}</CardDescription>
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
                <Badge variant="outline" className="text-xs mt-1">{t('integrations.próximamente')}</Badge>
              </div>
            </div>
            <CardDescription>
              Accede a tus datos desde aplicaciones externas vía API
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs — controlado para permitir navegación desde el panel de recomendaciones (I15.74) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="slack" className="gap-2">
            <MessageSquare size={16} />{t('integrations.slack')}</TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard size={16} />{t('integrations.stripe')}</TabsTrigger>
          <TabsTrigger value="holded" className="gap-2">
            <FileText size={16} />{t('integrations.holded')}</TabsTrigger>
          <TabsTrigger value="asana" className="gap-2">
            <CheckSquare size={16} />{t('integrations.asana')}</TabsTrigger>
          <TabsTrigger value="hubspot" className="gap-2">
            <TrendingUp size={16} />{t('integrations.hubspot')}</TabsTrigger>
          <TabsTrigger value="google-calendar" className="gap-2">
            <CalendarDays size={16} />{t('integrations.googleCalendar')}</TabsTrigger>
          <TabsTrigger value="trello" className="gap-2">
            <LayoutGrid size={16} />Trello</TabsTrigger>
          <TabsTrigger value="notion" className="gap-2">
            <BookOpen size={16} />Notion</TabsTrigger>
          <TabsTrigger value="webhooks" disabled>
            <Zap size={16} />{t('integrations.webhooks')}</TabsTrigger>
          <TabsTrigger value="api" disabled>
            <Code size={16} />
            API
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <TrendingUp size={16} />{t('integrations.intelligence')}
          </TabsTrigger>
          <TabsTrigger value="trust" className="gap-2">
            <Settings2 size={16} />{t('integrations.trustTab')}
          </TabsTrigger>
        </TabsList>

        {/* Slack Tab */}
        <TabsContent value="slack" className="space-y-6">
          {/* Instructions Card */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Como configurar Slack
              </CardTitle>
              <CardDescription>{t('integrations.sigueEstosPasosPara')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{t('integrations.accedeALaDocumentación')}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{t('integrations.veALaPágina')}</p>
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
                  <h4 className="font-semibold mb-1">{t('integrations.creaUnaIncomingWebhook')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Click en t('integrations.createYourSlackApp') y sigue el asistente. Cuando te pida permisos,
                    asegúrate de activar t('integrations.incomingWebhooks').
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{t('integrations.seleccionaElCanal')}</h4>
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
                  <h4 className="font-semibold mb-1">{t('integrations.pegaLaUrlAbajo')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa el botón t('integrations.añadirWebhook') de abajo, pega la URL, selecciona los tipos de
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
                  <h4 className="font-semibold mb-1 text-green-600 dark:text-green-400">{t('integrations.listoYaRecibirásNotificaciones')}</h4>
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
                  <MessageSquare className="h-5 w-5 text-purple-600" />{t('integrations.vistaPreviewSlackConectado')}</CardTitle>
                <CardDescription>{t('integrations.asíSeVeríaTu')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{demoData.slack.stats.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">{t('integrations.totalEvents')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{demoData.slack.stats.activeUsers}</div>
                      <div className="text-xs text-muted-foreground">{t('integrations.activeUsers')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{demoData.slack.connected_channels}</div>
                      <div className="text-xs text-muted-foreground">{t('integrations.connectedChannels')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{demoData.slack.stats.avgResponseTime}</div>
                      <div className="text-xs text-muted-foreground">{t('integrations.avgResponse')}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />{t('integrations.notificacionesRecientes')}</h4>
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
                  <h4 className="font-semibold mb-3">{t('integrations.canalesConfigurados')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {demoData.slack.channels.map((channel) => (
                      <div key={channel.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-semibold">{channel.name}</span>
                          <Badge variant={channel.enabled ? "default" : "secondary"} className="text-xs">
                            {channel.enabled ? 'Activo': t('integrations.inactivo')}
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
              <CardTitle>{t('integrations.eventosQueDisparanNotificaciones')}</CardTitle>
              <CardDescription>{t('integrations.estosSonLosTipos')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <PartyPopper size={20} />
                    <span className="font-medium text-sm">{t('integrations.leadGanado')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando un lead se cierra con estado "cerrado_ganado"
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={20} />
                    <span className="font-medium text-sm">{t('integrations.obvValidado')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('integrations.cuandoUnObvRecibe')}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={20} />
                    <span className="font-medium text-sm">{t('integrations.objetivoAlcanzado')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('integrations.cuandoSeCompletaUn')}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket size={20} />
                    <span className="font-medium text-sm">{t('integrations.hitoDelProyecto')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('integrations.hitosImportantesEnLa')}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✔️</span>
                    <span className="font-medium text-sm">{t('integrations.tareaCompletada')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('integrations.notificaciónCuandoSeCompletan')}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👋</span>
                    <span className="font-medium text-sm">{t('integrations.nuevoMiembro')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('integrations.cuandoAlguienSeUne')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slack Sync — bidirectional data sync (separate from webhook output) */}
          <SlackSyncIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-6">
          {/* Instructions Card */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💳 Configurar Stripe
              </CardTitle>
              <CardDescription>{t('integrations.conectaTuCuentaDe')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{t('integrations.accedeATuDashboard')}</h4>
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
                  <h4 className="font-semibold mb-1">{t('integrations.copiaTuSecretKey')}</h4>
                  <p className="text-sm text-muted-foreground">Busca la clave que empieza con<code className="bg-muted px-1 rounded">sk_live_...</code> o <code className="bg-muted px-1 rounded">sk_test_...</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{t('integrations.pegaLaClaveAbajo')}</h4>
                  <p className="text-sm text-muted-foreground">{t('integrations.seGuardaráDeForma')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Integration Component */}
          <StripeIntegration projectId={currentProject?.id} />

          {/* Demo Preview Stripe */}
          {isDemoMode && (
            <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />{t('integrations.vistaPreviewStripeConectado')}</CardTitle>
                <CardDescription>{t('integrations.asíSeVeríanTus')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas principales */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        €{(demoData.stripe.preview.totalRevenue / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">{t('integrations.totalRevenue')}</div>
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
                      <div className="text-xs text-muted-foreground">{t('integrations.subscriptions')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {demoData.stripe.preview.churnRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">{t('integrations.churnRate')}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transacciones recientes */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />{t('integrations.transaccionesRecientes')}</h4>
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
                  <h4 className="font-semibold mb-3">{t('integrations.planesMásPopulares')}</h4>
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
          <HoldedIntegration projectId={currentProject?.id} />

          {/* Demo Preview Holded */}
          {isDemoMode && (
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600" />{t('integrations.vistaPreviewHoldedConectado')}</CardTitle>
                <CardDescription>{t('integrations.asíSeVeríanTus8')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas principales */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        €{(demoData.holded.preview.totalAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">{t('integrations.facturadoTotal')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        €{(demoData.holded.preview.pendingAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-muted-foreground">{t('integrations.pendienteCobro')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {demoData.holded.preview.totalInvoices}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('integrations.facturas')}</div>
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
                    <FileText className="h-4 w-4 text-cyan-500" />{t('integrations.facturasRecientes')}</h4>
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
                                {inv.status === 'paid' ? 'Pagada': inv.status === 'overdue' ? 'Vencida': t('integrations.pendiente')}
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
                  <h4 className="font-semibold mb-3">{t('integrations.evoluciónMensual')}</h4>
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

        {/* Asana Tab — I15.94 */}
        <TabsContent value="asana" className="space-y-6">
          <AsanaIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* HubSpot Tab — I15.93 */}
        <TabsContent value="hubspot" className="space-y-6">
          <HubSpotIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* Google Calendar Tab — I15.97 */}
        <TabsContent value="google-calendar" className="space-y-6">
          <GoogleCalendarIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* Trello Tab */}
        <TabsContent value="trello" className="space-y-6">
          <TrelloIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* Notion Tab */}
        <TabsContent value="notion" className="space-y-6">
          <NotionIntegration projectId={currentProject?.id} />
        </TabsContent>

        {/* Webhooks Tab (placeholder) */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>{t('integrations.webhooksPersonalizados')}</CardTitle>
              <CardDescription>{t('integrations.próximamenteDisponible')}</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* API Tab (placeholder) */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API REST</CardTitle>
              <CardDescription>{t('integrations.próximamenteDisponible')}</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* I15.98–102 + I15.108 — Intelligence & Health Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <FinancialIntelligencePanel projectId={currentProject?.id} />
          <SalesIntelligencePanel projectId={currentProject?.id} />
          <ExecutionIntelligencePanel projectId={currentProject?.id} />
          <TeamIntelligencePanel projectId={currentProject?.id} />
          <CalendarIntelligencePanel projectId={currentProject?.id} />
          <IntegrationHealthPanel projectId={currentProject?.id} />
        </TabsContent>

        {/* I15.116–121 — Trust & Transparency Tab */}
        <TabsContent value="trust" className="space-y-6">
          <TrustScreen projectId={currentProject?.id} />
        </TabsContent>
      </Tabs>

      <HelpWidget section="integrations" />
    </div>
  );
}

// Componente principal exportado SIN FeatureGate
// Integraciones es accesible para todos
export default function IntegrationsView(props: IntegrationsViewProps) {
  return <IntegrationsContent {...props} />;
}
