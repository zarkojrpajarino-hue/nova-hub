import { Bell, FileCheck, FileX, CheckCircle2, ListTodo, Trophy, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, Notification } from '@/hooks/useNotifications';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';

const getNotificationIcon = (tipo: string | null) => {
  switch (tipo) {
    case 'obv_nueva':
      return <FileCheck size={16} className="text-primary" />;
    case 'obv_aprobada':
      return <CheckCircle2 size={16} className="text-green-500" />;
    case 'obv_rechazada':
      return <FileX size={16} className="text-destructive" />;
    case 'tarea_asignada':
      return <ListTodo size={16} className="text-blue-500" />;
    case 'lead_ganado':
      return <Trophy size={16} className="text-yellow-500" />;
    default:
      return <Bell size={16} className="text-muted-foreground" />;
  }
};

export function NotificationDropdown() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const { navigate } = useNavigation();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.leida) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to relevant section
    if (notification.link) {
      const viewName = notification.link.replace('/', '');
      navigate(viewName);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tienes notificaciones
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.leida && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    !notification.leida && "font-medium"
                  )}>
                    {notification.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.mensaje}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                {notification.link && (
                  <ExternalLink size={12} className="flex-shrink-0 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-primary justify-center"
              onClick={() => navigate('notificaciones')}
            >
              Ver todas las notificaciones
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
