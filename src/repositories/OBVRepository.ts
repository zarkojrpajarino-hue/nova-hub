import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type OBV = Database['public']['Tables']['obvs']['Row'];
type OBVInsert = Database['public']['Tables']['obvs']['Insert'];
type OBVUpdate = Database['public']['Tables']['obvs']['Update'];

/**
 * Repository for OBV (Objetivo de Valor de Negocio) data access
 */
export class OBVRepository {
  /**
   * Find OBV by ID with full relations
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('obvs')
      .select(`
        *,
        profiles:owner_id(id, nombre, color),
        projects:project_id(id, nombre, icon, color),
        leads:lead_id(id, titulo, empresa),
        obv_participants(
          id,
          member_id,
          rol_contribucion,
          porcentaje,
          profiles:member_id(id, nombre, color)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find OBVs by project
   */
  async findByProject(projectId: string): Promise<OBV[]> {
    const { data, error } = await supabase
      .from('obvs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find pending OBVs for validation
   */
  async findPendingForValidation(excludeOwnerId: string) {
    const { data, error } = await supabase
      .from('obvs')
      .select(`
        *,
        profiles:owner_id(id, nombre, color),
        projects:project_id(id, nombre, icon, color)
      `)
      .eq('status', 'pending')
      .neq('owner_id', excludeOwnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create OBV
   */
  async create(obv: OBVInsert): Promise<OBV> {
    const { data, error } = await supabase
      .from('obvs')
      .insert(obv)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update OBV
   */
  async update(id: string, updates: OBVUpdate): Promise<OBV> {
    const { data, error } = await supabase
      .from('obvs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete OBV
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('obvs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Update OBV status
   */
  async updateStatus(id: string, status: Database['public']['Enums']['obv_status']): Promise<void> {
    const { error } = await supabase
      .from('obvs')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add participant to OBV
   */
  async addParticipant(obvId: string, memberId: string, rolContribucion: string, porcentaje: number) {
    const { error } = await supabase
      .from('obv_participants')
      .insert({
        obv_id: obvId,
        member_id: memberId,
        rol_contribucion: rolContribucion,
        porcentaje,
      });

    if (error) throw error;
  }

  /**
   * Remove participant from OBV
   */
  async removeParticipant(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('obv_participants')
      .delete()
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Get OBV validation count
   */
  async getValidationCount(obvId: string): Promise<number> {
    const { count, error } = await supabase
      .from('obv_validaciones')
      .select('*', { count: 'exact', head: true })
      .eq('obv_id', obvId);

    if (error) throw error;
    return count || 0;
  }
}

// Singleton instance
export const obvRepository = new OBVRepository();
