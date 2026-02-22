import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leadService } from '@/services/LeadService';
import { PIPELINE_STAGES } from '@/components/crm/LeadForm';
import type { DropResult } from '@hello-pangea/dnd';
import type { Database } from '@/integrations/supabase/types';

export interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  status: string;
  valor_potencial: number | null;
  notas: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  responsable_id: string | null;
  project_id: string;
  created_at: string | null;
  updated_at: string | null;
  proyecto_nombre?: string;
  proyecto_color?: string;
  responsable_nombre?: string;
}

export type ViewMode = 'kanban' | 'list' | 'table';

interface Project {
  id: string;
  nombre: string;
  icon: string;
  color: string;
}

interface Member {
  id: string;
  nombre: string;
  color: string;
}

export function useCRMPipeline(
  leads: Lead[],
  projects: Project[],
  members: Member[],
  defaultView: ViewMode = 'kanban'
) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [initialStatus, setInitialStatus] = useState('frio');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter leads by search term
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(lead =>
      lead.nombre.toLowerCase().includes(term) ||
      lead.empresa?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term)
    );
  }, [leads, searchTerm]);

  // Calculate stage totals
  const stageTotals = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, stage) => {
      const stageLeads = filteredLeads.filter(l => l.status === stage.id);
      acc[stage.id] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0),
      };
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
  }, [filteredLeads]);

  // Helper functions
  const getMember = useCallback((id: string | null) => members.find(m => m.id === id), [members]);
  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getStage = useCallback((status: string) => PIPELINE_STAGES.find(s => s.id === status), []);

  // Drag and drop handler
  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !profile?.id) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return;

    // Optimistic update
    queryClient.setQueryData(['pipeline_global'], (old: Lead[] | undefined) =>
      old?.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );

    try {
      await leadService.updateStatus(
        leadId,
        newStatus as Database["public"]["Enums"]["lead_status"],
        oldStatus as Database["public"]["Enums"]["lead_status"],
        profile.id
      );

      const stageName = PIPELINE_STAGES.find(s => s.id === newStatus)?.label;
      toast.success(`Lead movido a ${stageName}`);

      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
      queryClient.invalidateQueries({ queryKey: ['project_leads'] });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error al mover el lead');
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
    }
  }, [profile?.id, queryClient]);

  const handleAddLead = useCallback((stageId: string = 'frio') => {
    setInitialStatus(stageId);
    setShowForm(true);
  }, []);

  return {
    // State
    showForm,
    setShowForm,
    selectedLead,
    setSelectedLead,
    initialStatus,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,

    // Computed
    filteredLeads,
    stageTotals,

    // Helpers
    getMember,
    getProject,
    getStage,

    // Actions
    handleDragEnd,
    handleAddLead,
  };
}
