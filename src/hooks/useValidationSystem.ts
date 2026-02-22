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
        .from('members')
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
        .from('members')
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
        console.error('Error checking blocked status:', error);
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
      
      // Enrich with owner and item data
      const enriched: PendingValidationItem[] = [];
      
      for (const pv of data || []) {
        const item: PendingValidationItem = {
          ...pv,
          item_type: pv.item_type as 'kpi' | 'obv',
        };
        
        // Get owner info
        const { data: owner } = await supabase
          .from('members')
          .select('nombre, color')
          .eq('id', pv.owner_id)
          .single();
        
        if (owner) {
          item.owner_nombre = owner.nombre;
          item.owner_color = owner.color;
        }
        
        // Get item title
        if (pv.kpi_id) {
          const { data: kpi } = await supabase
            .from('kpis')
            .select('titulo')
            .eq('id', pv.kpi_id)
            .single();
          item.titulo = kpi?.titulo;
        } else if (pv.obv_id) {
          const { data: obv } = await supabase
            .from('obvs')
            .select('titulo')
            .eq('id', pv.obv_id)
            .single();
          item.titulo = obv?.titulo;
        }
        
        enriched.push(item);
      }
      
      return enriched;
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
        .from('members')
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
