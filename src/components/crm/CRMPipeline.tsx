import { useState } from 'react';
import { Plus, Loader2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PIPELINE_STAGES, LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';

interface Lead {
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
  created_at: string;
  updated_at: string;
  proyecto_nombre?: string;
  proyecto_color?: string;
  responsable_nombre?: string;
}

interface CRMPipelineProps {
  projectId?: string; // If provided, filter by project
  leads: Lead[];
  projects: Array<{ id: string; nombre: string; icon: string; color: string }>;
  members: Array<{ id: string; nombre: string; color: string }>;
  isLoading: boolean;
}

export function CRMPipeline({ projectId, leads, projects, members, isLoading }: CRMPipelineProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [initialStatus, setInitialStatus] = useState('frio');

  const handleDragEnd = async (result: DropResult) => {
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
      // Update lead status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: newStatus as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Insert history record
      const { error: historyError } = await supabase
        .from('lead_history')
        .insert({
          lead_id: leadId,
          old_status: oldStatus as any,
          new_status: newStatus as any,
          changed_by: profile.id,
        });

      if (historyError) console.error('Error inserting history:', historyError);
      
      const stageName = PIPELINE_STAGES.find(s => s.id === newStatus)?.label;
      toast.success(`Lead movido a ${stageName}`);
      
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
      queryClient.invalidateQueries({ queryKey: ['project_leads'] });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error al mover el lead');
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
    }
  };

  const handleAddLead = (stageId: string) => {
    setInitialStatus(stageId);
    setShowForm(true);
  };

  const getMember = (id: string | null) => members.find(m => m.id === id);
  const getProject = (id: string) => projects.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals per stage
  const stageTotals = PIPELINE_STAGES.reduce((acc, stage) => {
    const stageLeads = leads.filter(l => l.status === stage.id);
    acc[stage.id] = {
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0),
    };
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Pipeline de Leads</h3>
          <p className="text-sm text-muted-foreground">
            {leads.length} leads • €{leads.reduce((s, l) => s + (l.valor_potencial || 0), 0).toLocaleString()} valor total
          </p>
        </div>
        <Button onClick={() => handleAddLead('frio')}>
          <Plus size={16} className="mr-2" />
          Añadir Lead
        </Button>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage, i) => {
            const stageLeads = leads.filter(l => l.status === stage.id);
            const stageData = stageTotals[stage.id];
            
            return (
              <div 
                key={stage.id} 
                className="min-w-[260px] flex-shrink-0 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Column Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 rounded-t-xl"
                  style={{ 
                    background: 'hsl(var(--muted))',
                    borderTop: `3px solid ${stage.color}` 
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ background: stage.color }}
                    />
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stageData.value > 0 && (
                      <span className="text-xs text-muted-foreground">
                        €{stageData.value.toLocaleString()}
                      </span>
                    )}
                    <span className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-xs font-semibold">
                      {stageData.count}
                    </span>
                  </div>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "bg-background/50 rounded-b-xl p-2 min-h-[400px] space-y-2 transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
                      )}
                    >
                      {stageLeads.map((lead, index) => {
                        const responsable = getMember(lead.responsable_id);
                        const project = getProject(lead.project_id);
                        const isOverdue = lead.proxima_accion_fecha && 
                          new Date(lead.proxima_accion_fecha) < new Date();
                        
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedLead(lead)}
                                className={cn(
                                  "bg-card border border-border rounded-xl p-4 cursor-pointer",
                                  "hover:border-primary/30 transition-all",
                                  snapshot.isDragging && "shadow-lg ring-2 ring-primary"
                                )}
                              >
                                {/* Name & company */}
                                <p className="font-semibold text-sm mb-1">{lead.nombre}</p>
                                {lead.empresa && (
                                  <p className="text-xs text-muted-foreground mb-2">{lead.empresa}</p>
                                )}

                                {/* Value */}
                                {lead.valor_potencial && lead.valor_potencial > 0 && (
                                  <p className="text-sm font-bold text-success mb-2">
                                    €{lead.valor_potencial.toLocaleString()}
                                  </p>
                                )}

                                {/* Project badge (only in global view) */}
                                {!projectId && project && (
                                  <div 
                                    className="text-[11px] px-2 py-1 rounded-md inline-flex items-center gap-1 mb-2"
                                    style={{ 
                                      backgroundColor: `${project.color}15`,
                                      color: project.color 
                                    }}
                                  >
                                    {project.icon} {project.nombre}
                                  </div>
                                )}

                                {/* Next action */}
                                {lead.proxima_accion_fecha && (
                                  <div className={cn(
                                    "flex items-center gap-1.5 text-xs mb-2",
                                    isOverdue ? "text-destructive" : "text-muted-foreground"
                                  )}>
                                    <Calendar size={10} />
                                    {new Date(lead.proxima_accion_fecha).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    {lead.proxima_accion && (
                                      <span className="truncate max-w-[100px]">- {lead.proxima_accion}</span>
                                    )}
                                  </div>
                                )}

                                {/* Responsable */}
                                {responsable && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                                    <div 
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ backgroundColor: responsable.color }}
                                    >
                                      {responsable.nombre.charAt(0)}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {responsable.nombre}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {/* Add lead button */}
                      <button 
                        onClick={() => handleAddLead(stage.id)}
                        className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={14} />
                        Añadir
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Lead form modal */}
      <LeadForm
        projectId={projectId}
        projects={projects}
        members={members}
        open={showForm}
        onOpenChange={setShowForm}
        initialStatus={initialStatus}
      />

      {/* Lead detail sheet */}
      <LeadDetail
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        members={members}
        projectName={selectedLead ? getProject(selectedLead.project_id)?.nombre : undefined}
      />
    </div>
  );
}
