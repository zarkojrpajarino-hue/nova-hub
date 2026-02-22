/**
 * NOTIFICATION LIST
 *
 * Lista de notificaciones con filtros, mark as read, y acciones
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Trophy,
  Rocket,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationListProps {
  userId: string;
  onNotificationRead?: () => void;
  onClose?: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  challenge: Trophy,
  role_assignment: Rocket,
  feedback: MessageSquare,
  performance: TrendingUp,
  deadline: Clock,
};

const typeColors: Record<string, string> = {
  success: 'text-green-600 bg-green-500/10',
  warning: 'text-yellow-600 bg-yellow-500/10',
  info: 'text-blue-600 bg-blue-500/10',
  challenge: 'text-purple-600 bg-purple-500/10',
  role_assignment: 'text-primary bg-primary/10',
  feedback: 'text-pink-600 bg-pink-500/10',
  performance: 'text-emerald-600 bg-emerald-500/10',
  deadline: 'text-orange-600 bg-orange-500/10',
};

export function NotificationList({ userId, onNotificationRead, onClose }: NotificationListProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filter]);

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unread') {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
      );

      onNotificationRead?.();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.info('No hay notificaciones sin leer');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      await loadNotifications();
      onNotificationRead?.();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar como leídas');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
      onClose?.();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="ghost" size="sm" className="gap-2">
              <CheckCheck size={16} />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Todas {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Sin leer {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications */}
      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Info;
              const colorClass = typeColors[notification.type] || typeColors.info;
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent/50 transition-colors cursor-pointer group relative',
                    isUnread && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn('font-semibold text-sm', isUnread && 'text-primary')}>{notification.title}</h4>
                        {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                        </span>

                        {notification.priority === 'high' && (
                          <span className="text-xs font-semibold text-destructive">Prioridad alta</span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
