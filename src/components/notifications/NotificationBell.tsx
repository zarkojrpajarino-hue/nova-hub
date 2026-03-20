/**
 * NOTIFICATION BELL
 *
 * Campana de notificaciones con contador en tiempo real
 * usando Supabase Realtime para actualizaciones instantáneas
 */

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationList } from './NotificationList';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { currentProject } = useCurrentProject();
  const [currentPhase, setCurrentPhase] = useState<number | undefined>(undefined);

  // DEUDA.PE.14: fetch current_phase from project_phase_state — CurrentProjectContext
  // queries projects table without join, so phase_state is not available there.
  useEffect(() => {
    if (!currentProject?.id) return;
    supabase
      .from('project_phase_state')
      .select('current_phase')
      .eq('project_id', currentProject.id)
      .single()
      .then(({ data }) => {
        if (data) setCurrentPhase(data.current_phase as number);
      });
  }, [currentProject?.id]);

  useEffect(() => {
    if (!userId) return;

    // Load initial unread count
    loadUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Reload count when notifications change
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (_error) {
      // intentionally empty
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell size={20} className={cn(unreadCount > 0 && 'text-primary animate-pulse')} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList
          userId={userId}
          onNotificationRead={loadUnreadCount}
          onClose={() => setIsOpen(false)}
          phase={currentPhase}
        />
      </PopoverContent>
    </Popover>
  );
}
