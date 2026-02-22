/**
 * ✨ OPTIMIZED: Generic Supabase Query Hook
 *
 * Hook genérico reutilizable para eliminar duplicación de código
 * en queries de Supabase.
 *
 * ANTES: 30+ hooks con lógica similar duplicada
 * DESPUÉS: 1 hook genérico + configuración específica
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';

interface Filter {
  column: string;
  operator: FilterOperator;
  value: any;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

interface UseSupabaseQueryOptions<T> {
  /**
   * Tabla de Supabase
   */
  table: string;

  /**
   * Columnas a seleccionar (SQL select)
   * @default '*'
   * @example 'id, nombre, email'
   * @example '*, owner:members_public!owner_id(*)'
   */
  select?: string;

  /**
   * Filtros a aplicar
   * @example [{ column: 'status', operator: 'eq', value: 'active' }]
   */
  filters?: Filter[];

  /**
   * Ordenamiento
   * @example { column: 'created_at', ascending: false }
   */
  orderBy?: OrderBy;

  /**
   * Límite de resultados
   */
  limit?: number;

  /**
   * Habilitar query
   */
  enabled?: boolean;

  /**
   * Buscar un solo resultado
   */
  single?: boolean;

  /**
   * Query key base (se combinará con parámetros automáticamente)
   */
  queryKey: string[];

  /**
   * Opciones adicionales de React Query
   */
  queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>;
}

/**
 * Hook genérico para queries de Supabase
 *
 * @example
 * ```tsx
 * // Query simple
 * const { data: projects } = useSupabaseQuery({
 *   table: 'projects',
 *   queryKey: ['projects'],
 * });
 *
 * // Query con filtros y ordenamiento
 * const { data: leads } = useSupabaseQuery({
 *   table: 'leads',
 *   queryKey: ['project-leads', projectId],
 *   filters: [
 *     { column: 'project_id', operator: 'eq', value: projectId },
 *     { column: 'status', operator: 'neq', value: 'rejected' },
 *   ],
 *   orderBy: { column: 'created_at', ascending: false },
 *   limit: 50,
 *   enabled: !!projectId,
 * });
 *
 * // Query con JOINs
 * const { data: members } = useSupabaseQuery({
 *   table: 'project_members',
 *   select: `
 *     *,
 *     member:members_public!member_id(*)
 *   `,
 *   queryKey: ['project-members', projectId],
 *   filters: [{ column: 'project_id', operator: 'eq', value: projectId }],
 * });
 *
 * // Query single result
 * const { data: project } = useSupabaseQuery({
 *   table: 'projects',
 *   queryKey: ['project', projectId],
 *   filters: [{ column: 'id', operator: 'eq', value: projectId }],
 *   single: true,
 * });
 * ```
 */
export function useSupabaseQuery<T = any>({
  table,
  select = '*',
  filters = [],
  orderBy,
  limit,
  enabled = true,
  single = false,
  queryKey,
  queryOptions,
}: UseSupabaseQueryOptions<T>) {
  return useQuery<T>({
    queryKey: [...queryKey, { filters, orderBy, limit }],
    queryFn: async () => {
      let query = supabase.from(table).select(select);

      // Aplicar filtros
      filters.forEach(({ column, operator, value }) => {
        query = query.filter(column, operator, value);
      });

      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? false,
        });
      }

      // Aplicar límite
      if (limit) {
        query = query.limit(limit);
      }

      // Ejecutar query
      const { data, error } = single
        ? await (query as any).maybeSingle()
        : await query;

      if (error) throw error;
      return data as T;
    },
    enabled,
    ...queryOptions,
  });
}

/**
 * Hook para mutations genéricas de Supabase
 * (insert, update, delete)
 */
export function useSupabaseMutation<T = any>() {
  // Implementar en el futuro si es necesario
  // Por ahora, usar useMutation de React Query directamente
  return null;
}

/**
 * Ejemplos de migración de hooks existentes:
 *
 * ANTES (useProjects):
 * ```tsx
 * export function useProjects() {
 *   return useQuery({
 *     queryKey: ['projects'],
 *     queryFn: async () => {
 *       const { data, error } = await supabase
 *         .from('projects')
 *         .select('*')
 *         .order('nombre');
 *       if (error) throw error;
 *       return data;
 *     },
 *   });
 * }
 * ```
 *
 * DESPUÉS:
 * ```tsx
 * export function useProjects() {
 *   return useSupabaseQuery({
 *     table: 'projects',
 *     queryKey: ['projects'],
 *     orderBy: { column: 'nombre', ascending: true },
 *   });
 * }
 * ```
 *
 * AHORRO: ~10 líneas de código por hook
 * BENEFICIO: Lógica centralizada, fácil de mantener
 */
