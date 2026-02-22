/**
 * NOTIFICATION TYPES V2
 *
 * Tipos completos para el sistema de notificaciones mejorado
 */

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationType =
  // Existentes
  | 'nuevas_obvs'
  | 'validaciones'
  | 'tareas'
  // Nuevas v2
  | 'lead_inactive'
  | 'task_overdue'
  | 'validation_expiring'
  | 'project_inactive'
  | 'objective_near'
  | 'welcome'
  | 'project_deleted'
  | 'role_accepted'
  | 'lead_won'
  | 'obv_validated';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  snoozed_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  priority?: NotificationPriority[];
  type?: NotificationType[];
  read?: boolean;
  archived?: boolean;
  search?: string;
}

export interface NotificationGroup {
  date: string;
  label: string;
  notifications: Notification[];
}

export const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  bgColor: string;
  defaultPriority: NotificationPriority;
}> = {
  // Existentes
  nuevas_obvs: {
    icon: '📋',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    defaultPriority: 'medium',
  },
  validaciones: {
    icon: '✅',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'medium',
  },
  tareas: {
    icon: '📌',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    defaultPriority: 'medium',
  },
  // Nuevas v2
  lead_inactive: {
    icon: '🔥',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    defaultPriority: 'high',
  },
  task_overdue: {
    icon: '⏰',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'high',
  },
  validation_expiring: {
    icon: '⚠️',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    defaultPriority: 'high',
  },
  project_inactive: {
    icon: '📊',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    defaultPriority: 'medium',
  },
  objective_near: {
    icon: '🎯',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    defaultPriority: 'medium',
  },
  welcome: {
    icon: '👋',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    defaultPriority: 'low',
  },
  project_deleted: {
    icon: '🗑️',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    defaultPriority: 'medium',
  },
  role_accepted: {
    icon: '✅',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'low',
  },
  lead_won: {
    icon: '🎉',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'low',
  },
  obv_validated: {
    icon: '✅',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'low',
  },
};

export const PRIORITY_CONFIG: Record<NotificationPriority, {
  label: string;
  color: string;
  badgeColor: string;
  sortOrder: number;
}> = {
  critical: {
    label: 'Crítica',
    color: 'text-red-600',
    badgeColor: 'bg-red-500/20 text-red-600 border-red-500/30',
    sortOrder: 0,
  },
  high: {
    label: 'Alta',
    color: 'text-orange-600',
    badgeColor: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    sortOrder: 1,
  },
  medium: {
    label: 'Media',
    color: 'text-blue-600',
    badgeColor: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    sortOrder: 2,
  },
  low: {
    label: 'Baja',
    color: 'text-gray-600',
    badgeColor: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
    sortOrder: 3,
  },
};
