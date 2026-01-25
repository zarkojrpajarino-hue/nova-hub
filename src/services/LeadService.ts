import { leadRepository } from '@/repositories/LeadRepository';
import type { Database } from '@/integrations/supabase/types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type LeadStatus = Database['public']['Enums']['lead_status'];

export class LeadService {
  /**
   * Get a lead by ID
   */
  async getById(id: string) {
    return leadRepository.findById(id);
  }

  /**
   * Get all leads for a project
   */
  async getByProject(projectId: string) {
    return leadRepository.findByProject(projectId);
  }

  /**
   * Get all leads globally
   */
  async getAll() {
    return leadRepository.findAll();
  }

  /**
   * Create a new lead
   */
  async create(leadData: LeadInsert) {
    // Business logic: Validate required fields
    if (!leadData.nombre || !leadData.project_id) {
      throw new Error('Nombre y proyecto son requeridos');
    }

    return leadRepository.create(leadData);
  }

  /**
   * Update a lead
   */
  async update(id: string, updates: LeadUpdate) {
    return leadRepository.update(id, updates);
  }

  /**
   * Update lead status and record history
   */
  async updateStatus(
    id: string,
    newStatus: LeadStatus,
    oldStatus: LeadStatus,
    userId: string
  ) {
    // Update status
    await leadRepository.updateStatus(id, newStatus);

    // Record history
    await leadRepository.recordStatusChange(id, oldStatus, newStatus, userId);
  }

  /**
   * Delete a lead
   */
  async delete(id: string) {
    return leadRepository.delete(id);
  }
}

export const leadService = new LeadService();
