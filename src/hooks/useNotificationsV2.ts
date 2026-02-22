/**
 * NOTIFICATIONS V2 HOOK
 *
 * Hook mejorado con:
 * - Tiempo real con Supabase Realtime
 * - Filtros avanzados
 * - Agrupación por fecha
 * - Snooze y archive
 * - Contador de no leídas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type {
  Notification,
  NotificationFilters,
  NotificationGroup,
  NotificationPriority,
} from '@/types/notifications';
import { isToday, isYesterday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Fetch notifications with filters
export function useNotifications(filters?: NotificationFilters) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Setup realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          // Show toast for high/critical priority
          const newNotification = payload.new as Notification;
          if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
            toast(newNotification.title, {
              description: newNotification.message,
              action: newNotification.action_url ? {
                label: newNotification.action_label || 'Ver',
                onClick: () => window.location.href = newNotification.action_url!,
              } : undefined,
            });

            // Play sound for critical
            if (newNotification.priority === 'critical') {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(() => {/* Ignore errors */});
            }
          }

          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, queryClient]);

  return useQuery({
    queryKey: ['notifications', profile?.id, filters],
    queryFn: async () => {
      if (!profile?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.read !== undefined) {
        query = query.eq('read', filters.read);
      }

      if (filters?.archived !== undefined) {
        query = query.eq('archived', filters.archived);
      }

      const { data, error } = await query;

      if (error) throw error;

      let notifications = data as Notification[];

      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        notifications = notifications.filter(
          (n) =>
            n.title.toLowerCase().includes(searchLower) ||
            n.message.toLowerCase().includes(searchLower)
        );
      }

      return notifications;
    },
    enabled: !!profile?.id,
  });
}

// Get unread count
export function useUnreadNotificationsCount() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        
        ;

      if (error) throw error;

      return count || 0;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refetch every 30s
  });
}

// Mark as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// Mark all as read
export function useMarkAllNotificationsRead() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No profile');

      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: profile.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`${count} notificaciones marcadas como leídas`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// Snooze notification
export function useSnoozeNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const { error } = await supabase.rpc('snooze_notification', {
        p_notification_id: id,
        p_minutes: minutes,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Notificación pospuesta por ${variables.minutes} minutos`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Archive notification
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('archive_notification', {
        p_notification_id: notificationId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notificación archivada');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// Group notifications by date
export function useGroupedNotifications(filters?: NotificationFilters): NotificationGroup[] {
  const { data: notifications = [] } = useNotifications(filters);

  const grouped: NotificationGroup[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);

    if (isToday(date)) {
      today.push(notification);
    } else if (isYesterday(date)) {
      yesterday.push(notification);
    } else if (date >= startOfWeek(new Date(), { locale: es })) {
      thisWeek.push(notification);
    } else {
      older.push(notification);
    }
  });

  if (today.length > 0) {
    grouped.push({ date: 'today', label: 'Hoy', notifications: today });
  }
  if (yesterday.length > 0) {
    grouped.push({ date: 'yesterday', label: 'Ayer', notifications: yesterday });
  }
  if (thisWeek.length > 0) {
    grouped.push({ date: 'this-week', label: 'Esta semana', notifications: thisWeek });
  }
  if (older.length > 0) {
    grouped.push({ date: 'older', label: 'Anteriores', notifications: older });
  }

  return grouped;
}

// Get notifications by priority (for dashboard)
export function useNotificationsByPriority() {
  const { data: notifications = [] } = useNotifications({ read: false });

  const byPriority: Record<NotificationPriority, Notification[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  notifications.forEach((notification) => {
    byPriority[notification.priority].push(notification);
  });

  return byPriority;
}
