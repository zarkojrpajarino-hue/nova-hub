import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
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

interface Stage {
  id: string;
  label: string;
  color: string;
}

interface ListViewProps {
  filteredLeads: Lead[];
  projectId?: string;
  getMember: (id: string | null) => Member | undefined;
  getProject: (id: string) => Project | undefined;
  getStage: (status: string) => Stage | undefined;
  onLeadClick: (lead: Lead) => void;
}

export const ListView = memo(function ListView({
  filteredLeads,
  projectId,
  getMember,
  getProject,
  getStage,
  onLeadClick,
}: ListViewProps) {
  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay leads que mostrar
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredLeads.map((lead) => {
        const responsable = getMember(lead.responsable_id);
        const project = getProject(lead.project_id);
        const stage = getStage(lead.status);
        const isOverdue = lead.proxima_accion_fecha &&
          new Date(lead.proxima_accion_fecha) < new Date();

        return (
          <div
            key={lead.id}
            onClick={() => onLeadClick(lead)}
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
      })}
    </div>
  );
});
