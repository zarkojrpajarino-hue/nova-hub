import { kpiRepository } from '@/repositories/KPIRepository';
import type { Database } from '@/integrations/supabase/types';

type KPIInsert = Database['public']['Tables']['kpis']['Insert'];
type KPIUpdate = Database['public']['Tables']['kpis']['Update'];
type KPIType = Database['public']['Enums']['kpi_type'];

export class KPIService {
  /**
   * Get a KPI by ID
   */
  async getById(id: string) {
    return kpiRepository.findById(id);
  }

  /**
   * Get all KPIs for a user
   */
  async getByOwner(ownerId: string) {
    return kpiRepository.findByOwner(ownerId);
  }

  /**
   * Get KPIs by type for a user
   */
  async getByTypeAndOwner(type: KPIType, ownerId: string) {
    return kpiRepository.findByTypeAndOwner(type, ownerId);
  }

  /**
   * Get pending KPIs for validation
   */
  async getPendingForValidation(userId: string, type?: KPIType, limit = 20) {
    return kpiRepository.findPendingForValidation(userId, type, limit);
  }

  /**
   * Create a new KPI
   * Business logic: Validate required fields and evidence
   */
  async create(kpiData: KPIInsert) {
    // Validate required fields
    if (!kpiData.titulo || !kpiData.type || !kpiData.owner_id) {
      throw new Error('Título, tipo y propietario son requeridos');
    }

    // Validate evidence URL if provided
    if (kpiData.evidence_url) {
      try {
        new URL(kpiData.evidence_url);
      } catch {
        throw new Error('URL de evidencia inválida');
      }
    }

    // Set default status if not provided
    if (!kpiData.status) {
      kpiData.status = 'pending';
    }

    return kpiRepository.create(kpiData);
  }

  /**
   * Update a KPI
   */
  async update(id: string, updates: KPIUpdate) {
    return kpiRepository.update(id, updates);
  }

  /**
   * Validate a KPI
   * Business logic: Check validation count and update status
   */
  async validate(
    kpiId: string,
    validatorId: string,
    approved: boolean,
    comentario?: string
  ) {
    // Add validation
    await kpiRepository.addValidation(kpiId, validatorId, approved, comentario);

    // Get validation counts
    const counts = await kpiRepository.getValidationCount(kpiId);

    // Business logic: Auto-approve/reject based on votes
    const requiredValidations = 2;

    if (counts.approved >= requiredValidations) {
      await kpiRepository.updateStatus(kpiId, 'validated');
    } else if (counts.rejected >= requiredValidations) {
      await kpiRepository.updateStatus(kpiId, 'rejected');
    }
  }

  /**
   * Delete a KPI
   */
  async delete(id: string) {
    return kpiRepository.delete(id);
  }

  /**
   * Calculate KPI points based on type
   * Business logic for point calculation
   */
  calculatePoints(type: KPIType, customPoints?: number): number {
    if (customPoints) return customPoints;

    // Default point values by type
    const pointMap: Record<KPIType, number> = {
      lp: 1, // Learning Path
      bp: 1, // Book Point
      cp: 1, // Community Point
    };

    return pointMap[type] || 1;
  }
}

export const kpiService = new KPIService();
