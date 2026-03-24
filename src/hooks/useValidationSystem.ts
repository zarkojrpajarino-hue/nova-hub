import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ValidationOrder {
  id: string;
  user_id: string;
  position: number;
  month_year: string;
  profile?: {
    id: string;
    nombre: string;
    color: string;
    avatar: string | null;
  };
}

export interface ValidatorStats {
  id: string;
  user_id: string;
  total_validations: number;
  on_time_validations: number;
  late_validations: number;
  missed_validations: number;
  is_blocked: boolean;
  blocked_until: string | null;
}

export interface PendingValidationItem {
  id: string;
  kpi_id: string | null;
  obv_id: string | null;
  validator_id: string;
  owner_id: string;
  item_type: 'kpi' | 'obv';
  deadline: string;
  validated_at: string | null;
  is_late: boolean;
  created_at: string;
  // Enriched data
  owner_nombre?: string;
  owner_color?: string;
  titulo?: string;
}

// Hook para obtener el orden de validación actual
export function useValidationOrder() {
  return useQuery({
    queryKey: ['validation_order'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data: orderData, error } = await supabase
        .from('validation_order')
        .select('*')
        .eq('month_year', currentMonth)
        .order('position');
      
      if (error) throw error;
      
      // Enrich with profile data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color, avatar');
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (orderData || []).map(order => ({
        ...order,
        profile: profileMap.get(order.user_id),
      })) as ValidationOrder[];
    },
  });
}

// Hook para obtener los validadores de un usuario específico
export function useMyValidators(userId?: string) {
  return useQuery({
    queryKey: ['my_validators', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .rpc('get_validators_for_user', { p_user_id: userId });
      
      if (error) throw error;
      
      // Get profile data for validators
      const validatorIds = (data || []).map((v: { validator_id: string }) => v.validator_id);
      
      if (validatorIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color, avatar')
        .in('id', validatorIds);
      
      return profiles || [];
    },
    enabled: !!userId,
  });
}

// Hook para obtener estadísticas de validador
export function useValidatorStats(userId?: string) {
  return useQuery({
    queryKey: ['validator_stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('validator_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ValidatorStats | null;
    },
    enabled: !!userId,
  });
}

// Hook para verificar si el usuario actual está bloqueado
export function useIsBlocked() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['is_blocked', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      
      const { data, error } = await supabase
        .rpc('is_user_blocked', { p_user_id: profile.id });
      
      if (error) {
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!profile?.id,
  });
}

// Hook para obtener validaciones pendientes del usuario actual
export function useMyPendingValidations() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['my_pending_validations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('pending_validations')
        .select('*')
        .eq('validator_id', profile.id)
        .is('validated_at', null)
        .order('deadline');
      
      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // Batch-fetch all owner profiles in one query (fixes N+1 waterfall)
      const ownerIds = [...new Set(data.map(pv => pv.owner_id).filter(Boolean))];
      const { data: owners } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, nombre, color').in('id', ownerIds)
        : { data: [] };
      const ownerMap = new Map((owners ?? []).map(o => [o.id, o]));

      // Batch-fetch all KPI titles in one query
      const kpiIds = data.map(pv => pv.kpi_id).filter(Boolean) as string[];
      const { data: kpis } = kpiIds.length > 0
        ? await supabase.from('kpis').select('id, titulo').in('id', kpiIds)
        : { data: [] };
      const kpiMap = new Map((kpis ?? []).map(k => [k.id, k.titulo]));

      // Batch-fetch all OBV titles in one query
      const obvIds = data.map(pv => pv.obv_id).filter(Boolean) as string[];
      const { data: obvs } = obvIds.length > 0
        ? await supabase.from('obvs').select('id, titulo').in('id', obvIds)
        : { data: [] };
      const obvMap = new Map((obvs ?? []).map(o => [o.id, o.titulo]));

      // Enrich all items without extra queries
      return data.map(pv => {
        const owner = ownerMap.get(pv.owner_id);
        const titulo = pv.kpi_id ? kpiMap.get(pv.kpi_id) : pv.obv_id ? obvMap.get(pv.obv_id) : undefined;
        return {
          ...pv,
          item_type: pv.item_type as 'kpi' | 'obv',
          owner_nombre: owner?.nombre,
          owner_color: owner?.color,
          titulo,
        } as PendingValidationItem;
      });
    },
    enabled: !!profile?.id,
  });
}

// Hook para obtener todas las estadísticas de validadores (para rankings)
export function useAllValidatorStats() {
  return useQuery({
    queryKey: ['all_validator_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validator_stats')
        .select('*')
        .order('on_time_validations', { ascending: false });
      
      if (error) throw error;
      
      // Enrich with profile data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color, avatar');
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(stats => ({
        ...stats,
        profile: profileMap.get(stats.user_id),
      }));
    },
  });
}

// Hook para verificar si puede subir KPI/OBV (no bloqueado)
export function useCanUpload() {
  const { data: isBlocked, isLoading } = useIsBlocked();
  
  return {
    canUpload: !isBlocked,
    isBlocked: !!isBlocked,
    isLoading,
  };
}
