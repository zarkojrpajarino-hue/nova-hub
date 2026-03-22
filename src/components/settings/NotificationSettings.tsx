import { useState, useEffect } from 'react';
import { Bell, FileCheck, Check, ClipboardList, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserSettings, useUpdateUserSettings, type NotificationSettings } from '@/hooks/useSettings';

import { useTranslation } from 'react-i18next';
function getNOTIFICATION_OPTIONS(t: (k: string) => string) {
  return [
  {
    key: 'nuevas_obvs' as const,
    label: t('settings.nuevasObvs'),
    description: t('settings.notificarCuandoAlguienSuba'),
    icon: FileCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
  },
  {
    key: 'validaciones' as const,
    label: t('settings.validaciones'),
    description: t('settings.notificarCuandoValidenO'),
    icon: Check,
    color: 'text-green-500',
    bgColor: 'bg-green-500/15',
  },
  {
    key: 'tareas' as const,
    label: t('settings.tareasAsignadas'),
    description: t('settings.notificarCuandoMeAsignen'),
    icon: ClipboardList,
    color: 'text-primary',
    bgColor: 'bg-primary/15',
  },
  {
    key: 'resumen_semanal' as const,
    label: t('settings.resumenSemanal'),
    description: t('settings.recibirResumenPorEmail'),
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/15',
    disabled: true,
    badge: t('settings.próximamente'),
  },
];
}

export function NotificationSettings() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    nuevas_obvs: true,
    validaciones: true,
    tareas: true,
    resumen_semanal: false,
  });

  // Sync with fetched settings
  useEffect(() => {
    if (settings?.notifications) {
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(notifications);
      toast.success(t('settings.preferenciasGuardadas'));
    } catch (_error) {
      toast.error(t('settings.errorAlGuardar'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />{t('settings.preferenciasDeNotificaciones')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">{t('settings.configuraQuéNotificacionesQuieres')}</p>

          <div className="space-y-4">
            {getNOTIFICATION_OPTIONS(t).map(option => (
              <div 
                key={option.key}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${option.bgColor} flex items-center justify-center`}>
                    <option.icon size={18} className={option.color} />
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {option.badge && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      {option.badge}
                    </span>
                  )}
                  <Switch
                    checked={notifications[option.key]}
                    onCheckedChange={() => handleToggle(option.key)}
                    disabled={option.disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <><Loader2 size={16} className="mr-2 animate-spin" />{t('settings.guardando')}</>
          ) : (
            t('settings.guardarPreferencias')
          )}
        </Button>
      </div>
    </div>
  );
}
