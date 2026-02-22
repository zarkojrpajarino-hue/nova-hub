/**
 * NOTIFICATION CENTER V2
 *
 * Centro de notificaciones mejorado con:
 * - Filtros por prioridad y tipo
 * - Búsqueda
 * - Agrupación por fecha
 * - Snooze y archive
 * - Quick actions
 */

import { useState } from 'react';
import {
  Bell,
  Filter,
  Search,
  CheckCheck,
  Archive,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useGroupedNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useSnoozeNotification,
  useArchiveNotification,
  useUnreadNotificationsCount,
} from '@/hooks/useNotificationsV2';
import type {
  NotificationFilters,
  NotificationPriority,
  NotificationType,
  Notification,
} from '@/types/notifications';
import { NOTIFICATION_CONFIG, PRIORITY_CONFIG } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ALL_PRIORITIES: NotificationPriority[] = ['critical', 'high', 'medium', 'low'];

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onArchive: (id: string) => void;
}

function NotificationItem({ notification, onRead, onSnooze, onArchive }: NotificationItemProps) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const priorityConfig = PRIORITY_CONFIG[notification.priority];

  const handleAction = () => {
    if (notification.action_url) {
      window.location.href = notification.action_url;
      onRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all hover:shadow-md',
        notification.read
          ? 'bg-muted/30 border-border/50'
          : 'bg-card border-border shadow-sm hover-lift'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg', config.bgColor)}>
          <span>{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn('font-medium text-sm', notification.read && 'text-muted-foreground')}>
              {notification.title}
            </h4>
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 h-5', priorityConfig.badgeColor)}
            >
              {priorityConfig.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {notification.action_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={handleAction}
                >
                  {notification.action_label || 'Ver'}
                  <ExternalLink size={12} className="ml-1" />
                </Button>
              )}

              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onRead(notification.id)}
                >
                  <CheckCheck size={14} />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 px-2">
                    <Clock size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Posponer</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem onClick={() => onSnooze(notification.id, 60)}>
                    1 hora
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={() => onSnooze(notification.id, 180)}>
                    3 horas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={() => onSnooze(notification.id, 1440)}>
                    1 día
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => onArchive(notification.id)}
              >
                <Archive size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenterV2() {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    priority: [],
    type: [],
    read: undefined,
    search: '',
  });

  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const groupedNotifications = useGroupedNotifications(filters);
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const snoozeNotification = useSnoozeNotification();
  const archiveNotification = useArchiveNotification();

  const handlePriorityToggle = (priority: NotificationPriority) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority?.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...(prev.priority || []), priority],
    }));
  };

  const _handleTypeToggle = (type: NotificationType) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type?.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...(prev.type || []), type],
    }));
  };

  const clearFilters = () => {
    setFilters({
      priority: [],
      type: [],
      read: undefined,
      search: '',
    });
  };

  const hasActiveFilters =
    (filters.priority && filters.priority.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    filters.read !== undefined ||
    (filters.search && filters.search.length > 0);

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

      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Notificaciones</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck size={14} className="mr-2" />
                Marcar todas leídas
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Filters Bar */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar notificaciones..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-9 h-9"
              />
            </div>

            {/* Priority Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter size={14} />
                  Prioridad
                  {filters.priority && filters.priority.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {filters.priority.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_PRIORITIES.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={filters.priority?.includes(priority)}
                    onCheckedChange={() => handlePriorityToggle(priority)}
                  >
                    <Badge
                      variant="outline"
                      className={cn('mr-2', PRIORITY_CONFIG[priority].badgeColor)}
                    >
                      {PRIORITY_CONFIG[priority].label}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Read/Unread Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Estado
                  {filters.read !== undefined && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={filters.read === false}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, read: checked ? false : undefined }))
                  }
                >
                  Sin leer
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.read === true}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, read: checked ? true : undefined }))
                  }
                >
                  Leídas
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} className="mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1 px-6 custom-scrollbar">
          {groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell size={32} className="text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">Sin notificaciones</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'No hay notificaciones que coincidan con los filtros'
                  : 'Estás al día con todas tus notificaciones'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={(id) => markAsRead.mutate(id)}
                        onSnooze={(id, minutes) => snoozeNotification.mutate({ id, minutes })}
                        onArchive={(id) => archiveNotification.mutate(id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
