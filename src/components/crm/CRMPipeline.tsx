import { useState } from 'react';
import { Plus, Loader2, Calendar, User, LayoutGrid, List, Table as TableIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PIPELINE_STAGES, LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

type ViewMode = 'kanban' | 'list' | 'table';

interface CRMPipelineProps {
  projectId?: string;
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
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter leads by search term
  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.nombre.toLowerCase().includes(term) ||
      lead.empresa?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term)
    );
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !profile?.id) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return;

    queryClient.setQueryData(['pipeline_global'], (old: Lead[] | undefined) =>
      old?.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );

    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: newStatus as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

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

  const handleAddLead = (stageId: string = 'frio') => {
    setInitialStatus(stageId);
    setShowForm(true);
  };

  const getMember = (id: string | null) => members.find(m => m.id === id);
  const getProject = (id: string) => projects.find(p => p.id === id);
  const getStage = (status: string) => PIPELINE_STAGES.find(s => s.id === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stageTotals = PIPELINE_STAGES.reduce((acc, stage) => {
    const stageLeads = filteredLeads.filter(l => l.status === stage.id);
    acc[stage.id] = {
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0),
    };
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Pipeline de Leads</h3>
          <p className="text-sm text-muted-foreground">
            {filteredLeads.length} leads • €{filteredLeads.reduce((s, l) => s + (l.valor_potencial || 0), 0).toLocaleString()} valor total
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'kanban' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Kanban"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Lista"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'table' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Tabla"
            >
              <TableIcon size={16} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button onClick={() => handleAddLead()}>
            <Plus size={16} className="mr-2" />
            <span className="hidden sm:inline">Añadir Lead</span>
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage, i) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id);
              const stageData = stageTotals[stage.id];
              
              return (
                <div 
                  key={stage.id} 
                  className="min-w-[260px] flex-shrink-0 animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
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
                                  <p className="font-semibold text-sm mb-1">{lead.nombre}</p>
                                  {lead.empresa && (
                                    <p className="text-xs text-muted-foreground mb-2">{lead.empresa}</p>
                                  )}

                                  {lead.valor_potencial && lead.valor_potencial > 0 && (
                                    <p className="text-sm font-bold text-green-600 mb-2">
                                      €{lead.valor_potencial.toLocaleString()}
                                    </p>
                                  )}

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
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay leads que mostrar
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const responsable = getMember(lead.responsable_id);
              const project = getProject(lead.project_id);
              const stage = getStage(lead.status);
              const isOverdue = lead.proxima_accion_fecha && 
                new Date(lead.proxima_accion_fecha) < new Date();

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Status badge */}
                      <Badge 
                        variant="outline"
                        className="shrink-0"
                        style={{ 
                          borderColor: stage?.color,
                          color: stage?.color,
                          backgroundColor: `${stage?.color}10`
                        }}
                      >
                        {stage?.label}
                      </Badge>
                      
                      {/* Lead info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{lead.nombre}</p>
                          {lead.empresa && (
                            <span className="text-muted-foreground text-sm truncate">• {lead.empresa}</span>
                          )}
                        </div>
                        {lead.proxima_accion && (
                          <p className={cn(
                            "text-xs mt-0.5 truncate",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {lead.proxima_accion_fecha && (
                              <span>
                                {new Date(lead.proxima_accion_fecha).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                })} - 
                              </span>
                            )}
                            {lead.proxima_accion}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Value */}
                      {lead.valor_potencial && lead.valor_potencial > 0 && (
                        <span className="font-bold text-green-600">
                          €{lead.valor_potencial.toLocaleString()}
                        </span>
                      )}
                      
                      {/* Project badge */}
                      {!projectId && project && (
                        <div 
                          className="text-[11px] px-2 py-1 rounded-md hidden sm:inline-flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${project.color}15`,
                            color: project.color 
                          }}
                        >
                          {project.icon} {project.nombre}
                        </div>
                      )}
                      
                      {/* Responsable */}
                      {responsable && (
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: responsable.color }}
                          title={responsable.nombre}
                        >
                          {responsable.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Valor</TableHead>
                {!projectId && <TableHead>Proyecto</TableHead>}
                <TableHead>Próxima Acción</TableHead>
                <TableHead>Responsable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={projectId ? 5 : 6} className="text-center py-8 text-muted-foreground">
                    No hay leads que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const responsable = getMember(lead.responsable_id);
                  const project = getProject(lead.project_id);
                  const stage = getStage(lead.status);
                  const isOverdue = lead.proxima_accion_fecha && 
                    new Date(lead.proxima_accion_fecha) < new Date();

                  return (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.nombre}</p>
                          {lead.empresa && (
                            <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: stage?.color,
                            color: stage?.color,
                            backgroundColor: `${stage?.color}10`
                          }}
                        >
                          {stage?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.valor_potencial && lead.valor_potencial > 0 ? (
                          <span className="font-semibold text-green-600">
                            €{lead.valor_potencial.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {!projectId && (
                        <TableCell>
                          {project ? (
                            <div 
                              className="text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                              style={{ 
                                backgroundColor: `${project.color}15`,
                                color: project.color 
                              }}
                            >
                              {project.icon} {project.nombre}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {lead.proxima_accion ? (
                          <div className={cn("text-sm", isOverdue && "text-destructive")}>
                            {lead.proxima_accion_fecha && (
                              <span className="font-medium">
                                {new Date(lead.proxima_accion_fecha).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            )}
                            <p className="text-muted-foreground truncate max-w-[150px]">{lead.proxima_accion}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {responsable ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: responsable.color }}
                            >
                              {responsable.nombre.charAt(0)}
                            </div>
                            <span className="text-sm">{responsable.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadForm
        projectId={projectId}
        projects={projects}
        members={members}
        open={showForm}
        onOpenChange={setShowForm}
        initialStatus={initialStatus}
      />

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
