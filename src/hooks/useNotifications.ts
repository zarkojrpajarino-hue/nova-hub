import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useNotifications() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile?.id,
  });
}

export function useUnreadCount() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['notifications_unread_count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('leida', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', profile?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ leida: true })
        .eq('user_id', profile.id)
        .eq('leida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', profile?.id] });
    },
  });
}
