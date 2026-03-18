/**
 * NOTIFICATION TYPES V2
 *
 * Tipos completos para el sistema de notificaciones.
 * Layer 1: actividad de usuario
 * Layer 2: Phase Engine
 * Layer 3: Probability Engine
 * Layer 4: Viability Engine
 * Layer 5: Risk/Org Engine
 */

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationType =
  // ── Layer 1: Actividad (existentes) ──────────────────────────────────────
  | 'nuevas_obvs'
  | 'validaciones'
  | 'tareas'
  | 'lead_inactive'
  | 'task_overdue'
  | 'validation_expiring'
  | 'project_inactive'
  | 'objective_near'
  | 'welcome'
  | 'project_deleted'
  | 'role_accepted'
  | 'lead_won'
  | 'obv_validated'
  // ── Layer 2: Phase Engine ─────────────────────────────────────────────────
  | 'phase_advanced'
  | 'phase_regressed'
  | 'phase_critical'
  | 'hard_signal_reached'
  | 'phase_stagnant'
  // ── Layer 3: Probability Engine ───────────────────────────────────────────
  | 'probability_drop'
  | 'probability_critical'
  | 'probability_recovered'
  // ── Layer 4: Viability Engine ─────────────────────────────────────────────
  | 'viability_critical'
  | 'viability_monitoring'
  | 'viability_resolved'
  | 'cash_flow_alert'
  // ── Layer 5: Risk / Org Engine ────────────────────────────────────────────
  | 'risk_critical'
  | 'risk_elevated'
  | 'bottleneck_detected';

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
  // ── Layer 1: Actividad ───────────────────────────────────────────────────
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
  // ── Layer 2: Phase Engine ────────────────────────────────────────────────
  phase_advanced: {
    icon: '🚀',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'high',
  },
  phase_regressed: {
    icon: '📉',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'critical',
  },
  phase_critical: {
    icon: '🔴',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'high',
  },
  hard_signal_reached: {
    icon: '🏁',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'high',
  },
  phase_stagnant: {
    icon: '⏸️',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    defaultPriority: 'medium',
  },
  // ── Layer 3: Probability Engine ──────────────────────────────────────────
  probability_drop: {
    icon: '📉',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    defaultPriority: 'high',
  },
  probability_critical: {
    icon: '🚨',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'critical',
  },
  probability_recovered: {
    icon: '📈',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'low',
  },
  // ── Layer 4: Viability Engine ────────────────────────────────────────────
  viability_critical: {
    icon: '🚨',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'critical',
  },
  viability_monitoring: {
    icon: '👁️',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    defaultPriority: 'medium',
  },
  viability_resolved: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    defaultPriority: 'low',
  },
  cash_flow_alert: {
    icon: '💸',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'critical',
  },
  // ── Layer 5: Risk / Org Engine ───────────────────────────────────────────
  risk_critical: {
    icon: '⚠️',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    defaultPriority: 'critical',
  },
  risk_elevated: {
    icon: '⚠️',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    defaultPriority: 'high',
  },
  bottleneck_detected: {
    icon: '🚧',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    defaultPriority: 'high',
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
