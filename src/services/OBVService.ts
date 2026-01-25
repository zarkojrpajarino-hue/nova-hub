import { obvRepository } from '@/repositories/OBVRepository';
import type { Database } from '@/integrations/supabase/types';

type OBVInsert = Database['public']['Tables']['obvs']['Insert'];

export interface OBVFormData {
  titulo: string;
  tipo: string;
  cantidad: number;
  precioUnitario: number;
  costes: number;
  descripcion?: string;
  proyecto_id: string;
  owner_id: string;
  lead_id?: string;
}

export interface OBVParticipant {
  member_id: string;
  rol_contribucion: string;
  porcentaje: number;
}

/**
 * Service for OBV business logic
 * Contains domain rules and calculations
 */
export class OBVService {
  /**
   * Calculate sales figures (business rule)
   */
  private calculateSales(cantidad: number, precioUnitario: number, costes: number) {
    // Business rule: Facturación = cantidad × precio unitario
    const facturacion = cantidad * precioUnitario;

    // Business rule: Margen = facturación - costes
    const margen = facturacion - costes;

    // Business rule: Margen porcentual
    const margenPorcentual = facturacion > 0 ? (margen / facturacion) * 100 : 0;

    return {
      facturacion,
      margen,
      margenPorcentual: Math.round(margenPorcentual * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Validate OBV data before creation
   */
  private validateOBVData(formData: OBVFormData) {
    const errors: string[] = [];

    if (!formData.titulo || formData.titulo.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    }

    if (formData.cantidad <= 0) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (formData.precioUnitario < 0) {
      errors.push('El precio unitario no puede ser negativo');
    }

    if (formData.costes < 0) {
      errors.push('Los costes no pueden ser negativos');
    }

    // Business rule: Costes shouldn't exceed revenue
    const facturacion = formData.cantidad * formData.precioUnitario;
    if (formData.costes > facturacion) {
      errors.push('Los costes no pueden superar la facturación');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Validate participants total percentage
   */
  private validateParticipants(participants: OBVParticipant[]) {
    if (participants.length === 0) return;

    const totalPercentage = participants.reduce((sum, p) => sum + p.porcentaje, 0);

    // Business rule: Participants must sum to 100%
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point errors
      throw new Error(`Los porcentajes de participación deben sumar 100% (actual: ${totalPercentage}%)`);
    }

    // Business rule: Each participant must have > 0%
    const invalidParticipant = participants.find(p => p.porcentaje <= 0);
    if (invalidParticipant) {
      throw new Error('Todos los participantes deben tener un porcentaje mayor a 0%');
    }
  }

  /**
   * Create OBV with participants and calculated values
   */
  async createOBVWithParticipants(
    formData: OBVFormData,
    participants: OBVParticipant[]
  ) {
    // Validate input
    this.validateOBVData(formData);
    this.validateParticipants(participants);

    // Calculate business values
    const { facturacion, margen } = this.calculateSales(
      formData.cantidad,
      formData.precioUnitario,
      formData.costes
    );

    // Create OBV
    const obvData: OBVInsert = {
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      cantidad: formData.cantidad,
      precio_unitario: formData.precioUnitario,
      costes: formData.costes,
      facturacion,
      margen,
      descripcion: formData.descripcion?.trim() || null,
      project_id: formData.proyecto_id,
      owner_id: formData.owner_id,
      lead_id: formData.lead_id || null,
      status: 'pending',
    };

    const obv = await obvRepository.create(obvData);

    // Add participants
    for (const participant of participants) {
      await obvRepository.addParticipant(
        obv.id,
        participant.member_id,
        participant.rol_contribucion,
        participant.porcentaje
      );
    }

    return obv;
  }

  /**
   * Update OBV with recalculation
   */
  async updateOBV(
    obvId: string,
    updates: Partial<OBVFormData>
  ) {
    const currentOBV = await obvRepository.findById(obvId);
    if (!currentOBV) {
      throw new Error('OBV no encontrado');
    }

    // Merge updates with current values
    const mergedData = {
      cantidad: updates.cantidad ?? currentOBV.cantidad,
      precioUnitario: updates.precioUnitario ?? currentOBV.precio_unitario,
      costes: updates.costes ?? currentOBV.costes,
    };

    // Recalculate if financial data changed
    const { facturacion, margen } = this.calculateSales(
      mergedData.cantidad,
      mergedData.precioUnitario,
      mergedData.costes
    );

    const obvUpdates = {
      ...updates,
      facturacion,
      margen,
      cantidad: mergedData.cantidad,
      precio_unitario: mergedData.precioUnitario,
      costes: mergedData.costes,
    };

    return await obvRepository.update(obvId, obvUpdates);
  }

  /**
   * Get OBV validation progress
   */
  async getValidationProgress(obvId: string, requiredValidations = 3) {
    const count = await obvRepository.getValidationCount(obvId);

    return {
      current: count,
      required: requiredValidations,
      percentage: Math.round((count / requiredValidations) * 100),
      isComplete: count >= requiredValidations,
    };
  }
}

// Singleton instance
export const obvService = new OBVService();
