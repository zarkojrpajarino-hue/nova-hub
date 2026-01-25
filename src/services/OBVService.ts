import { obvRepository } from '@/repositories/OBVRepository';
import { leadRepository } from '@/repositories/LeadRepository';
import type { Database } from '@/integrations/supabase/types';

type OBVInsert = Database['public']['Tables']['obvs']['Insert'];
type OBVUpdate = Database['public']['Tables']['obvs']['Update'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export class OBVService {
  async getById(id: string) {
    return obvRepository.findById(id);
  }

  async getByProject(projectId: string) {
    return obvRepository.findByProject(projectId);
  }

  async getByCreator(userId: string) {
    return obvRepository.findByCreator(userId);
  }

  async create(obvData: OBVInsert) {
    if (!obvData.titulo || !obvData.project_id) {
      throw new Error('Título y proyecto son requeridos');
    }
    return obvRepository.create(obvData);
  }

  async createWithLead(
    obvData: OBVInsert,
    leadData?: LeadInsert
  ) {
    let leadId: string | undefined;

    if (leadData) {
      const lead = await leadRepository.create(leadData);
      leadId = lead.id;
    }

    const obv = await obvRepository.create({
      ...obvData,
      lead_id: leadId,
    });

    return { obv, leadId };
  }

  async createWithParticipants(
    obvData: OBVInsert,
    participants: Array<{
      user_id: string;
      porcentaje_participacion: number;
      facturacion?: number;
      margen?: number;
    }>
  ) {
    const obv = await obvRepository.create(obvData);

    const participantRecords = participants.map(p => ({
      obv_id: obv.id,
      user_id: p.user_id,
      porcentaje_participacion: p.porcentaje_participacion,
      facturacion: p.facturacion || 0,
      margen: p.margen || 0,
    }));

    await obvRepository.addParticipants(participantRecords);

    return obv;
  }

  async update(id: string, updates: OBVUpdate) {
    return obvRepository.update(id, updates);
  }

  async delete(id: string) {
    return obvRepository.delete(id);
  }

  async getParticipants(obvId: string) {
    return obvRepository.getParticipants(obvId);
  }
}

export const obvService = new OBVService();
