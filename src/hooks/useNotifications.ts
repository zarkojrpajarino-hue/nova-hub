import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  titulo: string | null;
  mensaje: string | null;
  tipo: string | null;
  link: string | null;
  leida: boolean | null;
  created_at: string | null;
}

// Separate hook for realtime subscription to avoid hook ordering issues
export function useNotificationsRealtime() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const profileId = profile?.id;

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', profileId] });
          queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', profileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);
}

export function useNotifications() {
  const { profile } = useAuth();
  const profileId = profile?.id;

  // Setup realtime subscription
  useNotificationsRealtime();

  return useQuery({
    queryKey: ['notifications', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profileId,
  });
}

export function useUnreadCount() {
  const { profile } = useAuth();
  const profileId = profile?.id;

  return useQuery({
    queryKey: ['notifications_unread_count', profileId],
    queryFn: async () => {
      if (!profileId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId)
        .eq('leida', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!profileId,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const profileId = profile?.id;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profileId] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', profileId] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const profileId = profile?.id;

  return useMutation({
    mutationFn: async () => {
      if (!profileId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ leida: true })
        .eq('user_id', profileId)
        .eq('leida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profileId] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', profileId] });
    },
  });
}
