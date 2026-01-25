import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface TableViewProps {
  filteredLeads: Lead[];
  projectId?: string;
  getMember: (id: string | null) => Member | undefined;
  getProject: (id: string) => Project | undefined;
  getStage: (status: string) => Stage | undefined;
  onLeadClick: (lead: Lead) => void;
}

export const TableView = memo(function TableView({
  filteredLeads,
  projectId,
  getMember,
  getProject,
  getStage,
  onLeadClick,
}: TableViewProps) {
  if (filteredLeads.length === 0) {
    return (
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
            <TableRow>
              <TableCell colSpan={projectId ? 5 : 6} className="text-center py-8 text-muted-foreground">
                No hay leads que mostrar
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
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
          {filteredLeads.map((lead) => {
            const responsable = getMember(lead.responsable_id);
            const project = getProject(lead.project_id);
            const stage = getStage(lead.status);
            const isOverdue = lead.proxima_accion_fecha &&
              new Date(lead.proxima_accion_fecha) < new Date();

            return (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onLeadClick(lead)}
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
          })}
        </TableBody>
      </Table>
    </div>
  );
});
