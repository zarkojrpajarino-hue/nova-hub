/**
 * ✨ OPTIMIZED: Supabase Realtime Subscription Hook
 *
 * Hook optimizado para gestionar suscripciones Realtime de Supabase
 * con prevención de duplicados y cleanup automático.
 *
 * ANTES: Múltiples suscripciones duplicadas, memory leaks, throttling
 * DESPUÉS: Una suscripción por recurso, cleanup automático, invalidación selectiva
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  /**
   * Tabla de Supabase a escuchar
   */
  table: string;

  /**
   * Filtro opcional para eventos (ej: solo eventos de un proyecto específico)
   * @example { column: 'project_id', value: '123' }
   */
  filter?: {
    column: string;
    value: string | number;
  };

  /**
   * Query keys a invalidar cuando hay cambios
   * Soporta arrays de strings para invalidación múltiple
   * @example ['project-leads', projectId]
   */
  queryKey: string | string[];

  /**
   * Habilitar o deshabilitar la suscripción
   * Útil para suspender suscripciones cuando un componente no está visible
   */
  enabled?: boolean;

  /**
   * Eventos a escuchar (* para todos)
   * @default '*' (todos los eventos: INSERT, UPDATE, DELETE)
   */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';

  /**
   * Callback opcional cuando hay un cambio
   */
  onEvent?: (payload: Record<string, unknown>) => void;
}

/**
 * Hook para suscripción optimizada a cambios en tiempo real
 *
 * @example
 * ```tsx
 * // Escuchar cambios en leads de un proyecto
 * useRealtimeSubscription({
 *   table: 'leads',
 *   filter: { column: 'project_id', value: projectId },
 *   queryKey: ['project-leads', projectId],
 *   enabled: !!projectId,
 * });
 *
 * // Escuchar nuevas notificaciones
 * useRealtimeSubscription({
 *   table: 'notifications',
 *   filter: { column: 'user_id', value: userId },
 *   queryKey: ['notifications', userId],
 *   event: 'INSERT',
 *   onEvent: (payload) => {
 *     toast.info('Nueva notificación');
 *   },
 * });
 * ```
 */
export function useRealtimeSubscription({
  table,
  filter,
  queryKey,
  enabled = true,
  event = '*',
  onEvent,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // ✨ Prevenir suscripciones duplicadas
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Crear nombre único del canal para evitar colisiones
    const channelName = filter
      ? `${table}-${filter.column}-${filter.value}`
      : `${table}-all`;

    let channel = supabase.channel(channelName);

    // Configurar filtros si existen
    const postgresChangesConfig: { event: string; schema: string; table: string; filter?: string } = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      postgresChangesConfig.filter = `${filter.column}=eq.${filter.value}`;
    }

    // Suscribirse a cambios
    channel = channel.on(
      'postgres_changes',
      postgresChangesConfig,
      (payload) => {
        console.log(`[Realtime] ${table} change:`, payload.eventType);

        // Ejecutar callback si existe
        if (onEvent) {
          onEvent(payload);
        }

        // ✨ Invalidación selectiva de queries
        // Invalida solo las queries relacionadas con este recurso
        if (Array.isArray(queryKey)) {
          queryClient.invalidateQueries({
            queryKey,
            exact: false, // Invalida también queries con keys más específicas
          });
        } else {
          queryClient.invalidateQueries({
            queryKey: [queryKey],
            exact: false,
          });
        }
      }
    );

    // Suscribirse al canal
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to ${channelName}`);
      }
    });

    channelRef.current = channel;

    // ✨ Cleanup automático al desmontar
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${channelName}`);
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
    // filter object is tracked via filter?.column and filter?.value to avoid re-subscribing on reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter?.column, filter?.value, event, enabled, queryKey, onEvent, queryClient]);
}

/**
 * Hook especializado para suscripción a múltiples tablas
 * Útil para dashboards que necesitan actualizar varios recursos
 *
 * @example
 * ```tsx
 * useMultiRealtimeSubscription([
 *   { table: 'leads', queryKey: ['leads'] },
 *   { table: 'tasks', queryKey: ['tasks'] },
 *   { table: 'kpis', queryKey: ['kpis'] },
 * ]);
 * ```
 */
export function useMultiRealtimeSubscription(
  subscriptions: Array<Omit<UseRealtimeSubscriptionOptions, 'enabled'>>,
  enabled = true
) {
  subscriptions.forEach((sub) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRealtimeSubscription({
      ...sub,
      enabled,
    });
  });
}

/**
 * Hook para suscripción a cambios de un proyecto específico
 * Combina múltiples tablas relacionadas con un proyecto
 *
 * @example
 * ```tsx
 * useProjectRealtimeSync(projectId);
 * // Automáticamente sincroniza leads, tasks, y OBVs del proyecto
 * ```
 */
export function useProjectRealtimeSync(projectId: string | undefined) {
  useRealtimeSubscription({
    table: 'leads',
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
    queryKey: ['project-leads', projectId!],
    enabled: !!projectId,
  });

  useRealtimeSubscription({
    table: 'tasks',
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
    queryKey: ['project-tasks', projectId!],
    enabled: !!projectId,
  });

  useRealtimeSubscription({
    table: 'objectives',
    filter: projectId ? { column: 'project_id', value: projectId } : undefined,
    queryKey: ['project-obvs', projectId!],
    enabled: !!projectId,
  });
}

/**
 * GUÍA DE USO:
 *
 * 1. DASHBOARD GLOBAL:
 * ```tsx
 * function DashboardView() {
 *   useMultiRealtimeSubscription([
 *     { table: 'projects', queryKey: ['projects'] },
 *     { table: 'members_public', queryKey: ['profiles'] },
 *     { table: 'activities', queryKey: ['activities'] },
 *   ]);
 *   // ...
 * }
 * ```
 *
 * 2. PÁGINA DE PROYECTO:
 * ```tsx
 * function ProjectPage({ projectId }: { projectId: string }) {
 *   // Automáticamente sincroniza todas las tablas relacionadas
 *   useProjectRealtimeSync(projectId);
 *   // ...
 * }
 * ```
 *
 * 3. NOTIFICACIONES:
 * ```tsx
 * function NotificationsProvider() {
 *   const { profile } = useAuth();
 *
 *   useRealtimeSubscription({
 *     table: 'notifications',
 *     filter: { column: 'user_id', value: profile?.id! },
 *     queryKey: ['notifications', profile?.id!],
 *     event: 'INSERT',
 *     enabled: !!profile?.id,
 *     onEvent: (payload) => {
 *       toast.info(payload.new.message);
 *     },
 *   });
 * }
 * ```
 *
 * 4. SUSPENDER CUANDO NO ESTÁ VISIBLE:
 * ```tsx
 * function CRMView() {
 *   const [isVisible, setIsVisible] = useState(true);
 *
 *   useRealtimeSubscription({
 *     table: 'leads',
 *     queryKey: ['leads'],
 *     enabled: isVisible, // ✨ Solo sincroniza cuando está visible
 *   });
 * }
 * ```
 */

/**
 * NOTAS DE PERFORMANCE:
 *
 * - Supabase tiene límite de 2 eventos/segundo por canal
 * - Cada suscripción consume una conexión WebSocket
 * - Máximo ~100 canales concurrentes por cliente
 * - Usar filtros siempre que sea posible para reducir tráfico
 * - Suspender suscripciones cuando componentes no están visibles
 * - Invalidación selectiva reduce re-renders innecesarios
 */
