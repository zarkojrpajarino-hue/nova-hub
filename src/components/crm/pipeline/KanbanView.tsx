import { memo } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PIPELINE_STAGES } from '../LeadForm';
import { cn } from '@/lib/utils';
import type { Lead } from '@/hooks/useCRMPipeline';

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

interface KanbanViewProps {
  filteredLeads: Lead[];
  stageTotals: Record<string, { count: number; value: number }>;
  projectId?: string;
  getMember: (id: string | null) => Member | undefined;
  getProject: (id: string) => Project | undefined;
  onDragEnd: (result: DropResult) => void;
  onLeadClick: (lead: Lead) => void;
  onAddLead: (stageId: string) => void;
}

export const KanbanView = memo(function KanbanView({
  filteredLeads,
  stageTotals,
  projectId,
  getMember,
  getProject,
  onDragEnd,
  onLeadClick,
  onAddLead,
}: KanbanViewProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                              onClick={() => onLeadClick(lead)}
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
                      onClick={() => onAddLead(stage.id)}
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
  );
});
