/**
 * SLACK INTEGRATION COMPONENT
 *
 * Configura webhooks de Slack por proyecto
 * Permite activar/desactivar y elegir tipos de notificaciones
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Power, TestTube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface SlackWebhook {
  id: string;
  project_id: string | null;
  webhook_url: string;
  enabled: boolean;
  notification_types: string[];
  last_used_at: string | null;
  created_at: string;
}

function getNOTIFICATION_TYPES(t: (k: string) => string) {
  return [
  { value: 'lead_won', label: t('integrations.leadGanado'), icon: '🎉' },
  { value: 'obv_validated', label: t('integrations.obvValidado'), icon: '✅' },
  { value: 'objective_reached', label: t('integrations.objetivoAlcanzado'), icon: '🎯' },
  { value: 'project_milestone', label: t('integrations.hitoDelProyecto'), icon: '🚀' },
  { value: 'task_completed', label: t('integrations.tareaCompletada'), icon: '✔️' },
  { value: 'new_member', label: t('integrations.nuevoMiembro'), icon: '👋' },
];
}

interface SlackIntegrationProps {
  projectId?: string;
  isDemoMode?: boolean;
}

export function SlackIntegration({ projectId, isDemoMode = false }: SlackIntegrationProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['lead_won', 'obv_validated']);

  // Fetch webhooks (disabled in demo mode)
  const { data: webhooks = [], isLoading, isError } = useQuery({
    queryKey: ['slack-webhooks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('slack_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SlackWebhook[];
    },
    enabled: !isDemoMode, // Don't fetch if demo mode
    retry: 1, // Only retry once
    staleTime: 30000, // 30 seconds
  });

  // Create webhook
  const createWebhook = useMutation({
    mutationFn: async () => {
      if (!webhookUrl) throw new Error(t('integrations.urlRequerida'));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('integrations.noAutenticado'));

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      const { error } = await supabase.from('slack_webhooks').insert({
        project_id: projectId || null,
        webhook_url: webhookUrl,
        notification_types: selectedTypes,
        created_by: profile?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('integrations.webhookDeSlackConfigurado'));
      setWebhookUrl('');
      setSelectedTypes(['lead_won', 'obv_validated']);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['slack-webhooks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('integrations.errorAlConfigurarWebhook'));
    },
  });

  // Toggle enabled
  const toggleWebhook = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('slack_webhooks')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slack-webhooks'] });
    },
  });

  // Delete webhook
  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('slack_webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('integrations.webhookEliminado'));
      queryClient.invalidateQueries({ queryKey: ['slack-webhooks'] });
    },
  });

  // Test webhook
  const testWebhook = async (webhook: SlackWebhook) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          project_id: webhook.project_id,
          notification_type: 'test',
          message: ':wave: ¡Hola desde Nova Hub! Esta es una notificación de prueba.',
          metadata: { test: true },
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(t('integrations.mensajeDePruebaEnviado'));
      } else {
        toast.error(t('integrations.errorAlEnviarMensaje'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('integrations.errorAlEnviarMensaje'));
    }
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6ZM18 9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7Z"
                  fill="#E01E5A"
                />
              </svg>
            </div>
            <div>
              <CardTitle>{t('integrations.integraciónConSlack')}</CardTitle>
              <CardDescription>{t('integrations.recibeNotificacionesAutomáticasEn')}</CardDescription>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={14} />{t('integrations.añadirWebhook')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('integrations.configurarSlackWebhook')}</DialogTitle>
                <DialogDescription>{t('integrations.creaUnWebhookEn')}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Instructions */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                    📌 Cómo obtener un webhook de Slack:
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                    <li>
                      Ve a{' '}
                      <a
                        href="https://api.slack.com/messaging/webhooks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        api.slack.com/messaging/webhooks
                      </a>
                    </li>
                    <li>{t('integrations.creaUnaNuevaIncoming')}</li>
                    <li>{t('integrations.seleccionaElCanalDonde')}</li>
                    <li>Copia la Webhook URL</li>
                  </ol>
                </div>

                {/* Webhook URL */}
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder={t('integrations.httpshooksslackcomservices')}
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Notification Types */}
                <div>
                  <Label>{t('integrations.tiposDeNotificaciones')}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {getNOTIFICATION_TYPES(t).map((type) => (
                      <div
                        key={type.value}
                        onClick={() => handleTypeToggle(type.value)}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-all',
                          selectedTypes.includes(type.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>{t('integrations.cancelar')}</Button>
                <Button
                  onClick={() => createWebhook.mutate()}
                  disabled={createWebhook.isPending || !webhookUrl}
                >
                  {createWebhook.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />{t('integrations.configurando')}</>
                  ) : (
                    t('integrations.configurar')
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !isDemoMode ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError && !isDemoMode ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">{t('integrations.errorAlCargarWebhooks')}</p>
            <p className="text-xs text-muted-foreground">{t('integrations.verificaQueLaTabla')}</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {isDemoMode
                ? 'Configura webhooks para recibir notificaciones automáticas en Slack': t('integrations.noHayWebhooksConfigurados')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 rounded-lg border hover-lift transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                        {webhook.enabled ? 'Activo': t('integrations.inactivo')}
                      </Badge>
                      {webhook.last_used_at && (
                        <span className="text-xs text-muted-foreground">
                          Último uso: {new Date(webhook.last_used_at).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-mono text-muted-foreground truncate mb-2">
                      {webhook.webhook_url}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {webhook.notification_types.map((type) => {
                        const config = getNOTIFICATION_TYPES(t).find((t) => t.value === type);
                        return (
                          <Badge key={type} variant="outline" className="text-xs">
                            {config?.icon} {config?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testWebhook(webhook)}
                    >
                      <TestTube size={14} />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleWebhook.mutate({ id: webhook.id, enabled: !webhook.enabled })
                      }
                    >
                      <Power
                        size={14}
                        className={webhook.enabled ? 'text-green-500' : 'text-gray-500'}
                      />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(t('integrations.eliminarEsteWebhook'))) {
                          deleteWebhook.mutate(webhook.id);
                        }
                      }}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
