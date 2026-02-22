import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PendingValidation {
  id: string;
  type: 'obv' | 'bp' | 'lp' | 'cp';
  subtype?: string;
  titulo: string;
  owner_id: string;
  owner_nombre: string;
  owner_color: string;
  project_id?: string;
  project_nombre?: string;
  project_icon?: string;
  project_color?: string;
  created_at: string;
  validation_count: number;
}

export function usePendingValidations(limit = 10) {
  const { profile } = useAuth();
  const profileId = profile?.id;

  return useQuery({
    queryKey: ['pending_validations', profileId, limit],
    queryFn: async () => {
      if (!profileId) return [];

      // Fetch pending OBVs with validations in a single query using nested selects
      const { data: obvs, error: obvError } = await supabase
        .from('obvs')
        .select(`
          id,
          titulo,
          tipo,
          owner_id,
          project_id,
          created_at,
          projects!obvs_project_id_fkey(id, nombre, icon, color),
          obv_validaciones(validator_id)
        `)
        .eq('status', 'pending')
        .neq('owner_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (obvError) {
        console.error('Error fetching OBVs:', obvError);
      }

      // Fetch pending KPIs with validations in a single query
      const { data: kpis, error: kpiError } = await supabase
        .from('kpis')
        .select(`
          id,
          titulo,
          type,
          owner_id,
          created_at,
          profiles!kpis_owner_id_fkey(id, nombre, color),
          kpi_validaciones(validator_id)
        `)
        .eq('status', 'pending')
        .neq('owner_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (kpiError) {
        console.error('Error fetching KPIs:', kpiError);
      }

      // Process validations directly from nested data
      const votedObvIds = new Set<string>();
      const obvCountMap = new Map<string, number>();

      obvs?.forEach(obv => {
        const validations = obv.obv_validaciones as unknown as Array<{ validator_id: string }> || [];
        obvCountMap.set(obv.id, validations.length);
        if (validations.some(v => v.validator_id === profileId)) {
          votedObvIds.add(obv.id);
        }
      });

      const votedKpiIds = new Set<string>();
      const kpiCountMap = new Map<string, number>();

      kpis?.forEach(kpi => {
        const validations = kpi.kpi_validaciones as unknown as Array<{ validator_id: string }> || [];
        kpiCountMap.set(kpi.id, validations.length);
        if (validations.some(v => v.validator_id === profileId)) {
          votedKpiIds.add(kpi.id);
        }
      });

      // Build unified list
      const items: PendingValidation[] = [];

      // Add OBVs that user hasn't validated yet
      obvs?.filter(o => !votedObvIds.has(o.id)).forEach(obv => {
        const ownerProfile = obv.profiles as unknown as { id: string; nombre: string; color: string } | null;
        const project = obv.projects as unknown as { id: string; nombre: string; icon: string; color: string } | null;
        
        items.push({
          id: obv.id,
          type: 'obv',
          subtype: obv.tipo,
          titulo: obv.titulo,
          owner_id: obv.owner_id,
          owner_nombre: ownerProfile?.nombre || 'Desconocido',
          owner_color: ownerProfile?.color || '#6366F1',
          project_id: project?.id,
          project_nombre: project?.nombre,
          project_icon: project?.icon,
          project_color: project?.color,
          created_at: obv.created_at || '',
          validation_count: obvCountMap.get(obv.id) || 0,
        });
      });

      // Add KPIs that user hasn't validated yet
      kpis?.filter(k => !votedKpiIds.has(k.id)).forEach(kpi => {
        const ownerProfile = kpi.profiles as unknown as { id: string; nombre: string; color: string } | null;
        
        items.push({
          id: kpi.id,
          type: kpi.type as 'bp' | 'lp' | 'cp',
          titulo: kpi.titulo,
          owner_id: kpi.owner_id,
          owner_nombre: ownerProfile?.nombre || 'Desconocido',
          owner_color: ownerProfile?.color || '#6366F1',
          created_at: kpi.created_at || '',
          validation_count: kpiCountMap.get(kpi.id) || 0,
        });
      });

      // Sort by created_at and limit
      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
    enabled: !!profileId,
  });
}

export function useValidate() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const profileId = profile?.id;

  return useMutation({
    mutationFn: async ({ 
      item, 
      approved, 
      comentario 
    }: { 
      item: PendingValidation; 
      approved: boolean; 
      comentario?: string;
    }) => {
      if (!profileId) throw new Error('No profile');

      if (item.type === 'obv') {
        const { error } = await supabase.from('obv_validaciones').insert({
          obv_id: item.id,
          validator_id: profileId,
          approved,
          comentario,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kpi_validaciones').insert({
          kpi_id: item.id,
          validator_id: profileId,
          approved,
          comentario,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? '✓ Aprobado' : '✗ Rechazado');
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['pending_validations'] });
      queryClient.invalidateQueries({ queryKey: ['pending_validations_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending_obvs_for_validation'] });
      queryClient.invalidateQueries({ queryKey: ['pending_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['obvs'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
    onError: (error) => {
      console.error('Validation error:', error);
      toast.error('Error al validar');
    },
  });
}
