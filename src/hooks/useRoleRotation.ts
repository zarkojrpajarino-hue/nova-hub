import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { mapDatabaseError, logError } from '@/lib/errorMapper';

export interface RoleRotationRequest {
  id: string;
  requester_id: string;
  requester_project_id: string;
  requester_current_role: string;
  target_user_id: string | null;
  target_project_id: string | null;
  target_role: string | null;
  request_type: 'swap' | 'transfer' | 'rotation';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  reason: string | null;
  compatibility_score: number | null;
  compatibility_analysis: {
    score?: number;
    recommendation?: string;
    user1_performance?: number;
    user2_performance?: number;
    risks?: string[];
  };
  requester_accepted: boolean;
  target_accepted: boolean;
  admin_approved: boolean | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  requester?: { id: string; nombre: string; avatar: string | null };
  target_user?: { id: string; nombre: string; avatar: string | null };
  requester_project?: { id: string; nombre: string; color: string | null };
  target_project?: { id: string; nombre: string; color: string | null };
}

export interface RoleHistory {
  id: string;
  user_id: string;
  project_id: string;
  old_role: string | null;
  new_role: string;
  change_type: 'assignment' | 'swap' | 'transfer' | 'rotation' | 'promotion';
  rotation_request_id: string | null;
  previous_performance_score: number | null;
  notes: string | null;
  created_at: string;
  user?: { id: string; nombre: string; avatar: string | null };
  project?: { id: string; nombre: string; color: string | null };
}

export interface CompatibilityAnalysis {
  score: number;
  user1_performance: number;
  user2_performance: number;
  user1_target_experience: number;
  user2_target_experience: number;
  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
  risks: string[];
}

// Type for inserting rotation requests
type RotationRequestInsert = {
  requester_id: string;
  requester_project_id: string;
  requester_current_role: string;
  target_user_id?: string;
  target_project_id?: string;
  target_role?: string;
  request_type: 'swap' | 'transfer' | 'rotation';
  reason?: string;
  compatibility_score?: number;
  compatibility_analysis?: Record<string, unknown>;
  requester_accepted: boolean;
};

// Fetch rotation requests
export function useRotationRequests(status?: string) {
  return useQuery({
    queryKey: ['rotation_requests', status],
    queryFn: async () => {
      let query = supabase
        .from('role_rotation_requests')
        .select(`
          *,
          requester:profiles!role_rotation_requests_requester_id_fkey(id, nombre, avatar),
          target_user:profiles!role_rotation_requests_target_user_id_fkey(id, nombre, avatar),
          requester_project:projects!role_rotation_requests_requester_project_id_fkey(id, nombre, color),
          target_project:projects!role_rotation_requests_target_project_id_fkey(id, nombre, color)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RoleRotationRequest[];
    },
  });
}

// Fetch my rotation requests
export function useMyRotationRequests() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['my_rotation_requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('role_rotation_requests')
        .select(`
          *,
          requester:profiles!role_rotation_requests_requester_id_fkey(id, nombre, avatar),
          target_user:profiles!role_rotation_requests_target_user_id_fkey(id, nombre, avatar),
          requester_project:projects!role_rotation_requests_requester_project_id_fkey(id, nombre, color),
          target_project:projects!role_rotation_requests_target_project_id_fkey(id, nombre, color)
        `)
        .or(`requester_id.eq.${profile.id},target_user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as RoleRotationRequest[];
    },
    enabled: !!profile?.id,
  });
}

// Fetch role history
export function useRoleHistory(userId?: string) {
  return useQuery({
    queryKey: ['role_history', userId],
    queryFn: async () => {
      let query = supabase
        .from('role_history')
        .select(`
          *,
          user:profiles!role_history_user_id_fkey(id, nombre, avatar),
          project:projects!role_history_project_id_fkey(id, nombre, color)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RoleHistory[];
    },
  });
}

// Calculate compatibility
export function useCalculateCompatibility() {
  return useMutation({
    mutationFn: async ({
      user1Id,
      user2Id,
      role1,
      role2,
    }: {
      user1Id: string;
      user2Id: string;
      role1: string;
      role2: string;
    }) => {
      const { data, error } = await supabase.rpc('calculate_rotation_compatibility', {
        p_user1_id: user1Id,
        p_user2_id: user2Id,
        p_role1: role1,
        p_role2: role2,
      });
      if (error) throw error;
      return data as unknown as CompatibilityAnalysis;
    },
  });
}

// Create rotation request
export function useCreateRotationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Omit<RotationRequestInsert, 'requester_accepted'>) => {
      const insertData: RotationRequestInsert = {
        requester_id: request.requester_id,
        requester_project_id: request.requester_project_id,
        requester_current_role: request.requester_current_role,
        target_user_id: request.target_user_id,
        target_project_id: request.target_project_id,
        target_role: request.target_role,
        request_type: request.request_type,
        reason: request.reason,
        compatibility_score: request.compatibility_score,
        compatibility_analysis: request.compatibility_analysis,
        requester_accepted: true,
      };

      const { data, error } = await supabase
        .from('role_rotation_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation_requests'] });
      queryClient.invalidateQueries({ queryKey: ['my_rotation_requests'] });
      toast.success('Solicitud de rotación creada');
    },
    onError: (error) => {
      logError('useCreateRotationRequest', error);
      toast.error(mapDatabaseError(error, 'rotation'));
    },
  });
}

// Respond to rotation request
export function useRespondToRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      accept,
      isRequester,
    }: {
      requestId: string;
      accept: boolean;
      isRequester: boolean;
    }) => {
      const updateField = isRequester ? 'requester_accepted' : 'target_accepted';
      
      const updateData: Record<string, unknown> = {
        [updateField]: accept,
        updated_at: new Date().toISOString(),
      };

      if (!accept) {
        updateData.status = 'rejected';
      }

      const { data, error } = await supabase
        .from('role_rotation_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rotation_requests'] });
      queryClient.invalidateQueries({ queryKey: ['my_rotation_requests'] });
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
      
      if (data.status === 'completed') {
        toast.success('¡Rotación completada! Los roles han sido intercambiados.');
      } else if (data.status === 'rejected') {
        toast.info('Solicitud rechazada');
      } else {
        toast.success('Respuesta registrada');
      }
    },
    onError: (error) => {
      logError('useRespondToRotation', error);
      toast.error(mapDatabaseError(error, 'rotation'));
    },
  });
}

// Cancel rotation request
export function useCancelRotationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('role_rotation_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation_requests'] });
      queryClient.invalidateQueries({ queryKey: ['my_rotation_requests'] });
      toast.success('Solicitud cancelada');
    },
    onError: (error) => {
      logError('useCancelRotationRequest', error);
      toast.error(mapDatabaseError(error, 'rotation'));
    },
  });
}
