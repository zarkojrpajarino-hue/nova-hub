/**
 * NOTIFICATION CENTER V2 — Renovado U6.13
 *
 * Cambios vs versión anterior:
 * - G9.1: unread count correcto (read=false + archived=false)
 * - G9.2: paginación con t('notifications.cargarMás0')
 * - Filtros simplificados: 4 tabs (Todas / Sin leer / Actividad / Sistema)
 * - Prioridad visual mejorada: borde izquierdo de color + badge
 * - Empty state descriptivo
 * - Sin snooze (diferido a v2)
 */

import { useState } from 'react';
import { Bell, CheckCheck, Archive, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useGroupedNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useArchiveNotification,
  useUnreadNotificationsCount,
  PAGE_SIZE,
} from '@/hooks/useNotificationsV2';
import type {
  NotificationFilters,
  Notification,
} from '@/types/notifications';
import { NOTIFICATION_CONFIG, PRIORITY_CONFIG } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';

import { useTranslation } from 'react-i18next';
// ── Tipos de actividad vs sistema ────────────────────────────────────────────

const ACTIVITY_TYPES = new Set([
  // Layer 1 — actividad de usuario
  'nuevas_obvs', 'validaciones', 'tareas',
  'lead_inactive', 'task_overdue', 'validation_expiring',
  'objective_near', 'lead_won', 'obv_validated', 'project_inactive',
  // Layer 2–5 — eventos del motor
  'phase_advanced', 'phase_regressed', 'phase_critical', 'hard_signal_reached', 'phase_stagnant',
  'probability_drop', 'probability_critical', 'probability_recovered',
  'viability_critical', 'viability_monitoring', 'viability_resolved', 'cash_flow_alert',
  'risk_critical', 'risk_elevated', 'bottleneck_detected',
]);

const SYSTEM_TYPES = new Set([
  'welcome', 'project_deleted', 'role_accepted',
]);

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'activity' | 'system';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',      label: t('notifications.todas')      },
  { id: 'unread',   label: t('notifications.sinLeer')   },
  { id: 'activity', label: t('notifications.actividad')  },
  { id: 'system',   label: t('notifications.sistema')    },
];

function tabToFilters(tab: FilterTab): NotificationFilters {
  switch (tab) {
    case 'unread':   return { read: false, archived: false };
    case 'activity': return { type: Array.from(ACTIVITY_TYPES) as NotificationFilters['type'], archived: false };
    case 'system':   return { type: Array.from(SYSTEM_TYPES)   as NotificationFilters['type'], archived: false };
    default:         return { archived: false };
  }
}

// ── Priority border helper ────────────────────────────────────────────────────

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500',
  high:     'border-l-4 border-l-orange-400',
  medium:   'border-l-2 border-l-border',
  low:      'border-l-2 border-l-border/50',
};

// ── Notification item ─────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onRead:    (id: string) => void;
  onArchive: (id: string) => void;
}

function NotificationItem({ notification, onRead, onArchive }: NotificationItemProps) {
  const { t } = useTranslation();
  const config         = NOTIFICATION_CONFIG[notification.type] ?? NOTIFICATION_CONFIG['welcome'];
  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const borderClass    = PRIORITY_BORDER[notification.priority] ?? PRIORITY_BORDER.medium;

  const handleAction = () => {
    if (notification.action_url) {
      window.location.href = notification.action_url;
      onRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        borderClass,
        notification.read
          ? 'bg-muted/20 border-border/40'
          : 'bg-card border-border shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        {!notification.read && (
          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
        {notification.read && <span className="mt-1.5 h-2 w-2 shrink-0" />}

        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base',
          config.bgColor,
        )}>
          <span>{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h4 className={cn('font-medium text-sm leading-snug', notification.read && 'text-muted-foreground')}>
              {notification.title}
            </h4>
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0', priorityConfig.badgeColor)}
            >
              {priorityConfig.label}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
            </span>

            <div className="flex items-center gap-1">
              {notification.action_url && (
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={handleAction}>
                  {notification.action_label || 'Ver'}
                  <ExternalLink size={11} className="ml-1" />
                </Button>
              )}

              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  title={t('notifications.marcarComoLeída')}
                  onClick={() => onRead(notification.id)}
                >
                  <CheckCheck size={13} />
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                title={t('notifications.archivar')}
                onClick={() => onArchive(notification.id)}
              >
                <Archive size={13} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationCenterV2() {
  const [open, setOpen]         = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [limit, setLimit]       = useState(PAGE_SIZE);

  const filters = tabToFilters(activeTab);

  const { data: unreadCount = 0 }   = useUnreadNotificationsCount();
  const groupedNotifications        = useGroupedNotifications(filters, limit);
  const totalNotifications          = groupedNotifications.reduce((sum, g) => sum + g.notifications.length, 0);

  const markAsRead    = useMarkNotificationRead();
  const markAllRead   = useMarkAllNotificationsRead();
  const archiveNotif  = useArchiveNotification();

  // Reset limit when tab changes
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setLimit(PAGE_SIZE);
  };

  const handleLoadMore = () => setLimit(prev => prev + PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse-glow"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">{t('notifications.notificaciones')}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} sin leer` : t('notifications.todoAlDía')}
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck size={13} className="mr-1.5" />{t('notifications.marcarTodasLeídas')}</Button>
            )}
          </div>
        </DialogHeader>

        {/* Filter tabs */}
        <div className="px-5 pt-3 pb-2 border-b shrink-0">
          <div className="flex gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {tab.label}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-destructive text-destructive-foreground text-[9px] px-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="flex-1 px-5">
          {groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Bell size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{t('notifications.noHayNotificacionesRecientes')}</p>
              <p className="text-xs text-muted-foreground max-w-56 leading-relaxed">{t('notifications.cuandoElSistemaDetecte')}</p>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={(id) => markAsRead.mutate(id)}
                        onArchive={(id) => archiveNotif.mutate(id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {totalNotifications === limit && (
                <div className="flex justify-center pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1"
                    onClick={handleLoadMore}
                  >
                    <ChevronDown size={14} />{t('notifications.cargarMás')}</Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
