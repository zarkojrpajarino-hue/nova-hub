import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type OBV = Database['public']['Tables']['obvs']['Row'];
type OBVInsert = Database['public']['Tables']['obvs']['Insert'];
type OBVUpdate = Database['public']['Tables']['obvs']['Update'];
type OBVParticipant = Database['public']['Tables']['obv_participantes']['Insert'];

export class OBVRepository {
  /**
   * Find an OBV by ID
   */
  async findById(id: string): Promise<OBV | null> {
    const { data, error } = await supabase
      .from('obvs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find all OBVs for a project
   */
  async findByProject(projectId: string): Promise<OBV[]> {
    const { data, error } = await supabase
      .from('obvs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find all OBVs created by a user
   */
  async findByCreator(userId: string): Promise<OBV[]> {
    const { data, error } = await supabase
      .from('obvs')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new OBV
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
   * Update an OBV
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
   * Delete an OBV
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('obvs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add participants to an OBV
   */
  async addParticipants(participants: OBVParticipant[]): Promise<void> {
    const { error } = await supabase
      .from('obv_participantes')
      .insert(participants);

    if (error) throw error;
  }

  /**
   * Get participants for an OBV
   */
  async getParticipants(obvId: string) {
    const { data, error } = await supabase
      .from('obv_participantes')
      .select('*')
      .eq('obv_id', obvId);

    if (error) throw error;
    return data;
  }
}

export const obvRepository = new OBVRepository();
