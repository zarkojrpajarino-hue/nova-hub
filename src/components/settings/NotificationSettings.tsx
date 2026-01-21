import { useState, useEffect } from 'react';
import { Bell, FileCheck, Check, ClipboardList, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserSettings, useUpdateUserSettings, type NotificationSettings } from '@/hooks/useSettings';

const NOTIFICATION_OPTIONS = [
  {
    key: 'nuevas_obvs' as const,
    label: 'Nuevas OBVs',
    description: 'Notificar cuando alguien suba una OBV para validar',
    icon: FileCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
  },
  {
    key: 'validaciones' as const,
    label: 'Validaciones',
    description: 'Notificar cuando validen o rechacen mis OBVs/KPIs',
    icon: Check,
    color: 'text-green-500',
    bgColor: 'bg-green-500/15',
  },
  {
    key: 'tareas' as const,
    label: 'Tareas Asignadas',
    description: 'Notificar cuando me asignen una nueva tarea',
    icon: ClipboardList,
    color: 'text-primary',
    bgColor: 'bg-primary/15',
  },
  {
    key: 'resumen_semanal' as const,
    label: 'Resumen Semanal',
    description: 'Recibir resumen por email cada lunes',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/15',
    disabled: true,
    badge: 'Próximamente',
  },
];

export function NotificationSettings() {
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
      toast.success('Preferencias guardadas');
    } catch (error) {
      toast.error('Error al guardar');
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
            <Bell size={20} />
            Preferencias de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Configura qué notificaciones quieres recibir
          </p>

          <div className="space-y-4">
            {NOTIFICATION_OPTIONS.map(option => (
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
            <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</>
          ) : (
            'Guardar preferencias'
          )}
        </Button>
      </div>
    </div>
  );
}
