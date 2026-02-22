/**
 * DELETED PROJECTS DIALOG
 *
 * Muestra el historial de proyectos eliminados
 * con opción de restaurar cada uno.
 */

import { useState } from 'react';
import { History, Loader2, RotateCcw, Calendar, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeletedProject {
  id: string;
  nombre: string;
  descripcion: string;
  icon: string;
  color: string;
  tipo: 'validacion' | 'operacion';
  deleted_at: string;
  deleted_by_name: string;
  deleted_by_email: string;
  deletion_reason: string | null;
}

export function DeletedProjectsDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deletedProjects, setDeletedProjects] = useState<DeletedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchDeletedProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deleted_projects')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedProjects(data || []);
    } catch (error) {
      console.error('Error fetching deleted projects:', error);
      toast.error('Error al cargar proyectos eliminados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (projectId: string, projectName: string) => {
    setRestoringId(projectId);

    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) {
        toast.error('Perfil no encontrado');
        return;
      }

      // Call restore function
      const { error } = await supabase.rpc('restore_project', {
        p_project_id: projectId,
        p_restored_by: profile.id,
      });

      if (error) throw error;

      toast.success(`Proyecto "${projectName}" restaurado correctamente`);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['active_projects'] });

      // Refresh list
      fetchDeletedProjects();
    } catch (error) {
      console.error('Error restoring project:', error);
      toast.error(error instanceof Error ? error.message : 'Error al restaurar el proyecto');
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchDeletedProjects();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History size={16} />
          Historial de Eliminados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <History className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Proyectos Eliminados</DialogTitle>
              <DialogDescription>
                Historial de proyectos eliminados con opción de restaurar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : deletedProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">No hay proyectos eliminados</p>
              <p className="text-sm text-muted-foreground">
                Los proyectos que elimines aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Eliminado</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${project.color}20` }}
                          >
                            {project.icon}
                          </div>
                          <div>
                            <p className="font-medium">{project.nombre}</p>
                            {project.descripcion && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {project.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.tipo === 'operacion' ? 'default' : 'secondary'}>
                          {project.tipo === 'operacion' ? '🚀 Operación' : '🧪 Validación'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <Calendar size={12} />
                            <span>
                              {format(new Date(project.deleted_at), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User size={12} />
                            <span className="text-xs">{project.deleted_by_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.deletion_reason ? (
                          <div className="flex items-start gap-2 max-w-xs">
                            <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.deletion_reason}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin razón</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleRestore(project.id, project.nombre)}
                          disabled={restoringId === project.id}
                        >
                          {restoringId === project.id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              Restaurar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
