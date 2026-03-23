import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plug,
  Zap,
  Check,
  Settings,
  Key,
  Webhook,
  Code,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  BarChart,
} from 'lucide-react';

interface IntegrationsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for integrations marketplace
const integrations = [
  { id: 1, name: t('preview.slack'), category: t('preview.communication'), icon: '💬', color: 'bg-purple-100 text-purple-600' },
  { id: 2, name: t('preview.hubspot'), category: 'CRM', icon: '🎯', color: 'bg-orange-100 text-orange-600' },
  { id: 3, name: t('preview.salesforce'), category: 'CRM', icon: '☁️', color: 'bg-blue-100 text-blue-600' },
  { id: 4, name: t('preview.googleWorkspace'), category: t('preview.productivity'), icon: '📧', color: 'bg-red-100 text-red-600' },
  { id: 5, name: t('preview.microsoftTeams'), category: t('preview.communication'), icon: '👥', color: 'bg-indigo-100 text-indigo-600' },
  { id: 6, name: t('preview.jira'), category: t('preview.projectManagement'), icon: '🎫', color: 'bg-blue-100 text-blue-600' },
  { id: 7, name: t('preview.notion'), category: t('preview.productivity'), icon: '📝', color: 'bg-gray-100 text-gray-600' },
  { id: 8, name: t('preview.asana'), category: t('preview.projectManagement'), icon: '✓', color: 'bg-pink-100 text-pink-600' },
  { id: 9, name: t('preview.stripe'), category: t('preview.payments'), icon: '💳', color: 'bg-purple-100 text-purple-600' },
  { id: 10, name: t('preview.zapier'), category: t('preview.automation'), icon: '⚡', color: 'bg-orange-100 text-orange-600' },
  { id: 11, name: t('preview.github'), category: t('preview.development'), icon: '🐙', color: 'bg-gray-100 text-gray-600' },
  { id: 12, name: t('preview.intercom'), category: t('preview.customerSupport'), icon: '💬', color: 'bg-blue-100 text-blue-600' },
];

// Mock data for connected apps
const connectedApps = [
  { id: 1, name: t('preview.slack'), status: 'active', lastSync: '2 min ago', events: '1.2K', icon: '💬' },
  { id: 2, name: t('preview.hubspot'), status: 'active', lastSync: '15 min ago', events: '856', icon: '🎯' },
  { id: 3, name: t('preview.googleWorkspace'), status: 'active', lastSync: '1 hour ago', events: '2.4K', icon: '📧' },
  { id: 4, name: t('preview.jira'), status: 'warning', lastSync: '3 hours ago', events: '432', icon: '🎫' },
  { id: 5, name: t('preview.stripe'), status: 'active', lastSync: '30 min ago', events: '178', icon: '💳' },
  { id: 6, name: t('preview.github'), status: 'error', lastSync: '2 days ago', events: '0', icon: '🐙' },
];

// Mock data for Slack integration detail
const slackConfig = {
  webhooks: [
    { id: 1, url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX', channel: '#general' },
    { id: 2, url: 'https://hooks.slack.com/services/T00000000/B00000001/YYYYYYYYYYYY', channel: '#alerts' },
  ],
  scopes: [
    'chat:write',
    'channels:read',
    'users:read',
    'files:write',
  ],
};

// Mock data for API access
const apiKeys = [
  { id: 1, name: t('preview.productionApiKey'), key: 'sk_live_51Abc...XYZ123', created: '2024-01-15', lastUsed: '2 hours ago' },
  { id: 2, name: t('preview.developmentApiKey'), key: 'sk_test_51Def...ABC456', created: '2024-02-01', lastUsed: '5 min ago' },
];

// Mock data for Zapier workflows
const zapierWorkflows = [
  { id: 1, name: t('preview.newLeadSlackNotification'), status: 'active', runs: '2.4K', icon: '🎯→💬' },
  { id: 2, name: t('preview.formSubmitHubspotContact'), status: 'active', runs: '1.8K', icon: '📝→🎯' },
  { id: 3, name: t('preview.paymentSuccessEmailSlack'), status: 'active', runs: '856', icon: '💳→📧' },
];

export const IntegrationsPreviewModal: React.FC<IntegrationsPreviewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedKey, setCopiedKey] = useState<number | null>(null);

  const totalSlides = 6;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleCopyKey = (keyId: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        // Slide 0: Intro
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
              <Plug className="h-10 w-10" />
            </div>
            <h3 className="mb-3 text-2xl font-bold">{t('preview.conectaTuStackTecnológico')}</h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              Integra Nova Hub con más de 12 herramientas y plataformas que ya utilizas.
              Sincroniza datos, automatiza workflows y centraliza tu operación.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-3xl font-bold text-purple-600">12</div>
                <div className="text-sm text-muted-foreground">{t('preview.integraciones')}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-3xl font-bold text-blue-600">API</div>
                <div className="text-sm text-muted-foreground">{t('preview.accesoCompleto')}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-2 text-3xl font-bold text-green-600">∞</div>
                <div className="text-sm text-muted-foreground">{t('preview.webhooks')}</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">{t('preview.advancedPlanFeature')}</Badge>
          </div>
        );

      case 1:
        // Slide 1: Marketplace - Grid de 12 integraciones
        return (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />{t('preview.marketplaceDeIntegraciones')}</h3>
              <p className="text-sm text-muted-foreground">{t('preview.exploraYConectaLas')}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="group cursor-pointer rounded-lg border bg-card p-4 transition-all hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${integration.color}`}>
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{integration.name}</div>
                      <div className="text-xs text-muted-foreground">{integration.category}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full group-hover:bg-purple-50 group-hover:border-purple-300"
                  >{t('preview.conectar')}</Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        // Slide 2: Connected apps - 6 apps ya conectadas con status
        return (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />{t('preview.appsConectadas')}</h3>
              <p className="text-sm text-muted-foreground">{t('preview.gestionaTusIntegracionesActivas')}</p>
            </div>

            <div className="space-y-3">
              {connectedApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold">{app.name}</div>
                      {getStatusIcon(app.status)}
                      <Badge
                        variant="secondary"
                        className={
                          app.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : app.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {app.status === 'active' ? 'Active': app.status === 'warning' ? 'Warning': t('preview.error')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last sync: {app.lastSync}
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart className="h-3 w-3" />
                        {app.events} events
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        // Slide 3: Integration detail - Config de Slack con webhooks, scopes
        return (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">💬</span>{t('preview.configuraciónDeSlack')}</h3>
              <p className="text-sm text-muted-foreground">{t('preview.gestionaWebhooksPermisosY')}</p>
            </div>

            <div className="space-y-4">
              {/* Webhooks Section */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Webhook className="h-4 w-4 text-purple-600" />{t('preview.webhooks')}</div>
                  <Button size="sm" variant="outline">{t('preview.addWebhook')}</Button>
                </div>
                <div className="space-y-2">
                  {slackConfig.webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="rounded-md bg-muted p-3 text-sm"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{webhook.channel}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">{t('preview.active')}</Badge>
                      </div>
                      <code className="block truncate text-xs text-muted-foreground">
                        {webhook.url}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scopes Section */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <Settings className="h-4 w-4 text-blue-600" />{t('preview.oauthScopes')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {slackConfig.scopes.map((scope, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                      <code>{scope}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">{t('preview.conectadoCorrectamente')}</div>
                    <div className="text-blue-700">{t('preview.workspaceNovaHubTeam')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        // Slide 4: API access - API keys, rate limits, documentation
        return (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />{t('preview.apiAccess')}</h3>
              <p className="text-sm text-muted-foreground">{t('preview.gestionaTusApiKeys')}</p>
            </div>

            <div className="space-y-4">
              {/* API Keys */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">{t('preview.apiKeys')}</div>
                  <Button size="sm" variant="outline">{t('preview.generateNewKey')}</Button>
                </div>
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="rounded-md border bg-muted p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-sm">{apiKey.name}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">{t('preview.active')}</Badge>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <code className="flex-1 truncate text-xs bg-background px-2 py-1 rounded">
                          {apiKey.key}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(apiKey.id, apiKey.key)}
                        >
                          {copiedKey === apiKey.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {apiKey.created}</span>
                        <span>Last used: {apiKey.lastUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Limits */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 font-semibold">{t('preview.rateLimits')}</div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{t('preview.requestsThisMonth')}</span>
                      <span className="font-medium">18,432 / 100,000</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full w-[18%] rounded-full bg-gradient-to-r from-purple-500 to-blue-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-muted p-3">
                      <div className="text-muted-foreground mb-1">{t('preview.rateLimit')}</div>
                      <div className="font-semibold">1000 req/min</div>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <div className="text-muted-foreground mb-1">{t('preview.burstLimit')}</div>
                      <div className="font-semibold">5000 req/sec</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-900 mb-1">
                      <Code className="inline h-4 w-4 mr-1" />{t('preview.apiDocumentation')}</div>
                    <div className="text-sm text-purple-700">{t('preview.guíasCompletasEjemplosY')}</div>
                  </div>
                  <Button size="sm" variant="outline" className="border-purple-300">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        // Slide 5: Zapier & webhooks - Automation workflows
        return (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />{t('preview.automatizaciónConZapier')}</h3>
              <p className="text-sm text-muted-foreground">{t('preview.conectaNovaHubCon')}</p>
            </div>

            <div className="space-y-4">
              {/* Active Workflows */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">{t('preview.workflowsActivos')}</div>
                  <Button size="sm" variant="outline">{t('preview.createWorkflow')}</Button>
                </div>
                <div className="space-y-2">
                  {zapierWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center gap-3 rounded-md border bg-muted p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg">
                        {workflow.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{workflow.name}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {workflow.status}
                          </div>
                          <div>{workflow.runs} runs</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Triggers */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 font-semibold flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-blue-600" />{t('preview.webhookTriggers')}</div>
                <div className="space-y-2 text-sm">
                  <div className="rounded-md bg-muted p-3">
                    <div className="mb-1 font-medium">{t('preview.newLeadCreated')}</div>
                    <code className="block text-xs text-muted-foreground truncate">
                      https://api.novahub.com/webhooks/leads/new
                    </code>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="mb-1 font-medium">{t('preview.taskCompleted')}</div>
                    <code className="block text-xs text-muted-foreground truncate">
                      https://api.novahub.com/webhooks/tasks/completed
                    </code>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="mb-1 font-medium">{t('preview.paymentReceived')}</div>
                    <code className="block text-xs text-muted-foreground truncate">
                      https://api.novahub.com/webhooks/payments/received
                    </code>
                  </div>
                </div>
              </div>

              {/* Integration Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="mb-1 text-2xl font-bold text-purple-600">5.2K</div>
                  <div className="text-xs text-muted-foreground">{t('preview.totalEvents')}</div>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="mb-1 text-2xl font-bold text-green-600">99.8%</div>
                  <div className="text-xs text-muted-foreground">{t('preview.successRate')}</div>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="mb-1 text-2xl font-bold text-blue-600">3</div>
                  <div className="text-xs text-muted-foreground">{t('preview.zapsActive')}</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-purple-600" />Integraciones<Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">{t('preview.advancedPlan')}</Badge>
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>{t('preview.interactivePreviewOfIntegrations')}</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 max-h-[calc(90vh-180px)]">
          {renderSlide()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />{t('preview.anterior')}</Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-purple-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
          >
            {currentSlide === totalSlides - 1 ? (
              <>{t('preview.finalizar')}<CheckCircle2 className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>{t('preview.siguiente')}<ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Premium Feature Badge */}
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Desbloquea integraciones ilimitadas y acceso completo a la API
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">{t('preview.actualizarAAdvanced')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

