import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useProjectMembers, useMemberStats, usePipelineGlobal } from '@/hooks/useNovaData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export interface Participant {
  memberId: string;
  porcentaje: number;
}

export interface OBVFormData {
  tipo: string;
  projectId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  leadOption: 'existing' | 'new' | 'none';
  leadId: string;
  leadNombre: string;
  leadEmpresa: string;
  leadEmail: string;
  leadStatus: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  facturacion: number;
  costes: number;
  margen: number;
  participants: Participant[];
  evidenceUrl: string;
}

const initialFormData: OBVFormData = {
  tipo: 'validacion',
  projectId: '',
  titulo: '',
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  leadOption: 'none',
  leadId: '',
  leadNombre: '',
  leadEmpresa: '',
  leadEmail: '',
  leadStatus: 'frio',
  producto: '',
  cantidad: 1,
  precioUnitario: 0,
  facturacion: 0,
  costes: 0,
  margen: 0,
  participants: [],
  evidenceUrl: '',
};

/**
 * Custom hook for OBV form logic
 * Handles form state, validation, calculations, and submission
 */
export function useOBVFormLogic(onSuccess: () => void) {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: members = [] } = useMemberStats();
  const { data: leads = [] } = usePipelineGlobal();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OBVFormData>(initialFormData);

  const isVenta = formData.tipo === 'venta';
  const totalSteps = isVenta ? 6 : 5;

  // Get user's projects
  const userProjects = useMemo(() => {
    const userProjectIds = projectMembers
      .filter(pm => pm.member_id === profile?.id)
      .map(pm => pm.project_id);
    return projects.filter(p => userProjectIds.includes(p.id));
  }, [projects, projectMembers, profile?.id]);

  // Get project leads
  const projectLeads = useMemo(
    () => leads.filter(l => l.project_id === formData.projectId),
    [leads, formData.projectId]
  );

  // Get project members for participants
  const projectMembersList = useMemo(() => {
    if (!formData.projectId) return [];
    return projectMembers
      .filter(pm => pm.project_id === formData.projectId && pm.member_id !== profile?.id)
      .map(pm => {
        const member = members.find(m => m.id === pm.member_id);
        return member ? { id: member.id, nombre: member.nombre, color: member.color } : null;
      })
      .filter(Boolean);
  }, [formData.projectId, projectMembers, members, profile?.id]);

  // Auto-calculate facturacion and margen
  const updateSaleCalculations = useCallback((updates: Partial<OBVFormData>) => {
    const cantidad = updates.cantidad ?? formData.cantidad;
    const precioUnitario = updates.precioUnitario ?? formData.precioUnitario;
    const costes = updates.costes ?? formData.costes;
    const facturacion = cantidad * precioUnitario;
    const margen = facturacion - costes;

    setFormData(prev => ({
      ...prev,
      ...updates,
      facturacion,
      margen,
    }));
  }, [formData.cantidad, formData.precioUnitario, formData.costes]);

  // Navigation
  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return !!formData.tipo;
      case 2: return !!formData.projectId;
      case 3: return !!formData.titulo && !!formData.fecha;
      case 4: return formData.leadOption === 'none' ||
        formData.leadOption === 'existing' && !!formData.leadId ||
        formData.leadOption === 'new' && !!formData.leadNombre;
      case 5:
        if (isVenta) {
          return !!formData.producto && formData.facturacion > 0;
        }
        return true;
      case 6: return true;
      default: return true;
    }
  }, [step, formData, isVenta]);

  const handleNext = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Participant management
  const addParticipant = useCallback((memberId: string) => {
    if (formData.participants.find(p => p.memberId === memberId)) return;
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { memberId, porcentaje: 10 }],
    }));
  }, [formData.participants]);

  const removeParticipant = useCallback((memberId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.memberId !== memberId),
    }));
  }, []);

  const updateParticipantPercentage = useCallback((memberId: string, porcentaje: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.memberId === memberId ? { ...p, porcentaje } : p
      ),
    }));
  }, []);

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!profile?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setIsSubmitting(true);

    try {
      let leadId = formData.leadId || null;

      // Create new lead if needed
      if (formData.leadOption === 'new' && formData.leadNombre) {
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            project_id: formData.projectId,
            nombre: formData.leadNombre,
            empresa: formData.leadEmpresa || null,
            email: formData.leadEmail || null,
            status: formData.leadStatus as Database["public"]["Enums"]["lead_status"],
            responsable_id: profile.id,
            valor_potencial: isVenta ? formData.facturacion : null,
          })
          .select('id')
          .single();

        if (leadError) throw leadError;
        leadId = newLead.id;
      }

      // Create OBV
      const { data: newOBV, error: obvError } = await supabase
        .from('obvs')
        .insert({
          owner_id: profile.id,
          project_id: formData.projectId,
          lead_id: leadId,
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          fecha: formData.fecha,
          tipo: formData.tipo as Database["public"]["Enums"]["obv_type"],
          status: 'pending',
          es_venta: isVenta,
          producto: isVenta ? formData.producto : null,
          cantidad: isVenta ? formData.cantidad : null,
          precio_unitario: isVenta ? formData.precioUnitario : null,
          facturacion: isVenta ? formData.facturacion : null,
          costes: isVenta ? formData.costes : null,
          margen: isVenta ? formData.margen : null,
          evidence_url: formData.evidenceUrl || null,
        })
        .select('id')
        .single();

      if (obvError) throw obvError;

      // Add participants
      const participantsTotal = formData.participants.reduce((sum, p) => sum + p.porcentaje, 0);
      const ownerPercentage = 100 - participantsTotal;

      const allParticipants = [
        { obv_id: newOBV.id, member_id: profile.id, porcentaje: ownerPercentage },
        ...formData.participants.map(p => ({
          obv_id: newOBV.id,
          member_id: p.memberId,
          porcentaje: p.porcentaje,
        })),
      ];

      if (allParticipants.length > 0) {
        const { error: partError } = await supabase
          .from('obv_participantes')
          .insert(allParticipants);

        if (partError) throw partError;
      }

      toast.success('OBV creada correctamente');
      onSuccess();
    } catch (_error) {
      toast.error('Error al crear la OBV');
    } finally {
      setIsSubmitting(false);
    }
  }, [profile?.id, formData, isVenta, onSuccess]);

  return {
    // State
    step,
    isSubmitting,
    formData,
    setFormData,
    isVenta,
    totalSteps,

    // Computed
    userProjects,
    projectLeads,
    projectMembersList,

    // Actions
    updateSaleCalculations,
    canProceed,
    handleNext,
    handleBack,
    addParticipant,
    removeParticipant,
    updateParticipantPercentage,
    handleSubmit,
  };
}
