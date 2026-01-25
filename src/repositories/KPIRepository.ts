import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type KPI = Database['public']['Tables']['kpis']['Row'];
type KPIInsert = Database['public']['Tables']['kpis']['Insert'];
type KPIUpdate = Database['public']['Tables']['kpis']['Update'];
type KPIStatus = Database['public']['Enums']['kpi_status'];
type KPIType = Database['public']['Enums']['kpi_type'];

export class KPIRepository {
  /**
   * Find a KPI by ID
   */
  async findById(id: string): Promise<KPI | null> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find all KPIs for a user
   */
  async findByOwner(ownerId: string): Promise<KPI[]> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find KPIs by type and owner
   */
  async findByTypeAndOwner(type: KPIType, ownerId: string): Promise<KPI[]> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('type', type)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find pending KPIs for validation (excluding user's own)
   * Returns KPIs with owner info and existing validations
   */
  async findPendingForValidation(userId: string, type?: KPIType, limit = 20) {
    // Fetch pending KPIs
    let query = supabase
      .from('kpis')
      .select('*')
      .eq('status', 'pending')
      .neq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: kpis, error: kpisError } = await query;
    if (kpisError) throw kpisError;
    if (!kpis?.length) return [];

    // Fetch validations for these KPIs
    const kpiIds = kpis.map(k => k.id);
    const { data: validaciones, error: validacionesError } = await supabase
      .from('kpi_validaciones')
      .select('*')
      .in('kpi_id', kpiIds);

    if (validacionesError) throw validacionesError;

    // Fetch owner profiles
    const ownerIds = [...new Set(kpis.map(k => k.owner_id))];
    const { data: owners, error: ownersError } = await supabase
      .from('members')
      .select('id, nombre, color')
      .in('id', ownerIds);

    if (ownersError) throw ownersError;

    // Fetch validator profiles
    const validatorIds = [...new Set((validaciones || []).map(v => v.validator_id))];
    const { data: validators, error: validatorsError } = await supabase
      .from('members')
      .select('id, nombre')
      .in('id', validatorIds);

    if (validatorsError) throw validatorsError;

    // Map data
    const ownersMap = new Map(owners?.map(o => [o.id, o]) || []);
    const validatorsMap = new Map(validators?.map(v => [v.id, v.nombre]) || []);

    // Combine data and filter out already voted
    return kpis
      .map(kpi => {
        const kpiValidations = (validaciones || [])
          .filter(v => v.kpi_id === kpi.id)
          .map(v => ({
            validator_id: v.validator_id,
            approved: v.approved || false,
            comentario: v.comentario,
            validator_nombre: validatorsMap.get(v.validator_id) || 'Desconocido',
          }));

        const owner = ownersMap.get(kpi.owner_id);

        return {
          ...kpi,
          owner: owner || { id: kpi.owner_id, nombre: 'Desconocido', color: '#6366F1' },
          validations: kpiValidations,
        };
      })
      .filter(kpi => !kpi.validations.some(v => v.validator_id === userId)) as any;
  }

  /**
   * Create a new KPI
   */
  async create(kpi: KPIInsert): Promise<KPI> {
    const { data, error } = await supabase
      .from('kpis')
      .insert(kpi)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a KPI
   */
  async update(id: string, updates: KPIUpdate): Promise<KPI> {
    const { data, error } = await supabase
      .from('kpis')
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
   * Update KPI status
   */
  async updateStatus(id: string, status: KPIStatus): Promise<void> {
    const { error } = await supabase
      .from('kpis')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a KPI
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add validation to a KPI
   */
  async addValidation(
    kpiId: string,
    validatorId: string,
    approved: boolean,
    comentario?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('kpi_validaciones')
      .insert({
        kpi_id: kpiId,
        validator_id: validatorId,
        approved,
        comentario,
      });

    if (error) throw error;
  }

  /**
   * Get validation count for a KPI
   */
  async getValidationCount(kpiId: string): Promise<{ approved: number; rejected: number }> {
    const { data, error } = await supabase
      .from('kpi_validaciones')
      .select('approved')
      .eq('kpi_id', kpiId);

    if (error) throw error;

    const approved = data.filter(v => v.approved).length;
    const rejected = data.filter(v => !v.approved).length;

    return { approved, rejected };
  }
}

export const kpiRepository = new KPIRepository();
