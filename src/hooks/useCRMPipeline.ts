import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/lib/queryKeys';
import { leadService } from '@/services/LeadService';
import { obvService } from '@/services/OBVService';
import { PIPELINE_STAGES } from '@/components/crm/pipeline-stages';
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
  const { t } = useTranslation();

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

      const stageName = PIPELINE_STAGES.find(s => s.id === newStatus)?.label ?? newStatus;
      toast.success(t('crmView.leadMoved', { stage: stageName }));

      // V5.2.6 — Auto-create OBV draft when lead transitions to cerrado_ganado
      if (newStatus === 'cerrado_ganado') {
        const closedLead = leads.find(l => l.id === leadId);
        if (closedLead) {
          try {
            const obv = await obvService.create({
              titulo: `${t('crm.obvFromDeal')}: ${closedLead.nombre}`,
              tipo: 'venta',
              obv_outcome: 'pending',
              owner_id: profile.id,
              project_id: closedLead.project_id,
              facturacion: closedLead.valor_potencial ?? 0,
              empresa: closedLead.empresa,
              nombre_contacto: closedLead.nombre,
              email_contacto: closedLead.email,
              telefono_contacto: closedLead.telefono,
              source: 'crm_auto',
              pipeline_status: 'cerrado_ganado',
              status: 'draft',
            });
            toast.success(t('crm.obvCreatedFromDeal'), {
              action: {
                label: t('crm.viewObv'),
                onClick: () => {
                  window.location.hash = `#/obvs/${obv.id}`;
                },
              },
            });
          } catch (_obvError) {
            // OBV creation failure should not block the lead status update
            toast.warning(t('crm.obvCreationFailed'));
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.leads.pipeline });
      // V4.4.6: Use queryKeys.leads.all for broad invalidation instead of raw string
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      // Also invalidate legacy key used by ProjectCRMTab (prefix match)
      queryClient.invalidateQueries({ queryKey: ['project_leads'] as const });
    } catch (_error) {
      toast.error('Error al mover el lead');
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.pipeline });
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
