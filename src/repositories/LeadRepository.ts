import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type LeadStatus = Database['public']['Enums']['lead_status'];

export class LeadRepository {
  /**
   * Find a lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find all leads for a project
   */
  async findByProject(projectId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find all leads globally (across all projects)
   */
  async findAll(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new lead
   */
  async create(lead: LeadInsert): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a lead
   */
  async update(id: string, updates: LeadUpdate): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update lead status
   */
  async updateStatus(id: string, status: LeadStatus): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Record lead status change in history
   */
  async recordStatusChange(
    leadId: string,
    oldStatus: LeadStatus,
    newStatus: LeadStatus,
    changedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('lead_history')
      .insert({
        lead_id: leadId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: changedBy,
      });

    if (error) throw error;
  }
}

export const leadRepository = new LeadRepository();
