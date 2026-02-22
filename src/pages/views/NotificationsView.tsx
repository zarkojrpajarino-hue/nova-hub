import { useState } from 'react';
import { Bell, FileCheck, FileX, CheckCircle2, ListTodo, Trophy, ExternalLink, Check } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { HelpWidget } from '@/components/ui/section-help';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_NOTIFICATIONS } from '@/data/demoData';
import { HowItWorks } from '@/components/ui/how-it-works';
import { NotificationsPreviewModal } from '@/components/preview/NotificationsPreviewModal';

interface NotificationsViewProps {
  onNewOBV?: () => void;
  onNavigate: (view: string) => void;
}

const getNotificationIcon = (tipo: string | null) => {
  switch (tipo) {
    case 'obv_nueva':
      return <FileCheck size={20} className="text-primary" />;
    case 'obv_aprobada':
      return <CheckCircle2 size={20} className="text-green-500" />;
    case 'obv_rechazada':
      return <FileX size={20} className="text-destructive" />;
    case 'tarea_asignada':
      return <ListTodo size={20} className="text-blue-500" />;
    case 'lead_ganado':
      return <Trophy size={20} className="text-yellow-500" />;
    default:
      return <Bell size={20} className="text-muted-foreground" />;
  }
};

const getNotificationColor = (tipo: string | null) => {
  switch (tipo) {
    case 'obv_nueva':
      return 'border-l-primary';
    case 'obv_aprobada':
      return 'border-l-green-500';
    case 'obv_rechazada':
      return 'border-l-destructive';
    case 'tarea_asignada':
      return 'border-l-blue-500';
    case 'lead_ganado':
      return 'border-l-yellow-500';
    default:
      return 'border-l-muted-foreground';
  }
};

export function NotificationsView({ onNewOBV, onNavigate }: NotificationsViewProps) {
  const { isDemoMode } = useDemoMode();
  const { data: realNotifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Transform demo notifications to match the expected format
  const demoNotificationsFormatted = DEMO_NOTIFICATIONS.map(n => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensaje: n.mensaje,
    leida: n.leida,
    created_at: n.fecha,
    link: n.tipo === 'obv_nueva' ? '/obvs' : n.tipo === 'tarea_asignada' ? '/mi-espacio' : null,
    user_id: '1',
  }));

  const notifications = isDemoMode ? demoNotificationsFormatted : realNotifications;

  const handleNotificationClick = (notification: Notification | typeof demoNotificationsFormatted[0]) => {
    if (!notification.leida && !isDemoMode) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.link) {
      const viewName = notification.link.replace('/', '');
      onNavigate(viewName);
    }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = notification.created_at 
      ? format(new Date(notification.created_at), 'yyyy-MM-dd')
      : 'unknown';
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'unknown') return 'Sin fecha';
    
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoy';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ayer';
    } else {
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NovaHeader
        title="Notificaciones"
        subtitle={`${unreadCount} sin leer`}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 max-w-4xl mx-auto">
        {/* How It Works */}
        <div className="mb-6">
          <HowItWorks
            title="Centro de Notificaciones"
            description="Mantente informado de todo lo importante"
            whatIsIt="Sistema de notificaciones en tiempo real que te mantiene al tanto de tareas asignadas, menciones, validaciones de OBVs, leads ganados y eventos importantes. Configura tus preferencias de notificación por email, Slack o in-app."
            dataInputs={[
              {
                from: "Eventos del sistema",
                items: [
                  "Tareas asignadas o completadas",
                  "Menciones en comentarios",
                  "Validaciones de OBVs",
                  "Leads ganados y eventos CRM"
                ]
              }
            ]}
            dataOutputs={[
              {
                to: "Tu bandeja de notificaciones",
                items: [
                  "Notificaciones in-app organizadas",
                  "Emails según tus preferencias",
                  "Mensajes de Slack automáticos"
                ]
              }
            ]}
            nextStep={{
              action: "Configura tus preferencias",
              destination: "Configuración > Notificaciones"
            }}
            onViewPreview={() => setShowPreviewModal(true)}
          />
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="text-primary" size={24} />
            <h2 className="text-lg font-semibold">Historial de notificaciones</h2>
          </div>
          {unreadCount > 0 && !isDemoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check size={16} className="mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Notifications list */}
        {isLoading && !isDemoMode ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes notificaciones</h3>
            <p className="text-muted-foreground">
              Las notificaciones aparecerán aquí cuando haya actividad relevante.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatDateHeader(date)}
                </h3>
                <div className="space-y-2">
                  {dateNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        "p-4 border-l-4 cursor-pointer transition-all hover:shadow-md",
                        getNotificationColor(notification.tipo),
                        !notification.leida && "bg-accent/30"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm",
                              !notification.leida && "font-semibold"
                            )}>
                              {notification.titulo}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.mensaje}
                          </p>
                          {notification.link && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                              <ExternalLink size={12} />
                              <span>Ver detalles</span>
                            </div>
                          )}
                        </div>
                        {!notification.leida && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <HelpWidget section="notificaciones" />

      {/* Preview Modal */}
      <NotificationsPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
}
