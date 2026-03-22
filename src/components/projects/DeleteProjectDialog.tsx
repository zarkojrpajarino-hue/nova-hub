/**
 * DELETE PROJECT DIALOG
 *
 * Diálogo de confirmación para eliminar un proyecto.
 * Requiere escribir "ELIMINAR" para confirmar.
 * Elimina en cascada: OBVs, leads, tasks, members.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  trigger,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');

  const isConfirmed = confirmText === 'ELIMINAR';

  const handleDelete = async () => {
    if (!isConfirmed) {
      toast.error('Escribe "ELIMINAR" para confirmar');
      return;
    }

    setIsDeleting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('projects.noAutenticado'));
        setIsDeleting(false);
        return;
      }

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) {
        toast.error(t('projects.perfilNoEncontrado'));
        setIsDeleting(false);
        return;
      }

      // Call soft delete function
      const { error } = await supabase.rpc('soft_delete_project', {
        p_project_id: projectId,
        p_deleted_by: profile.id,
        p_reason: reason.trim() || null,
      });

      if (error) throw error;

      toast.success(t('projects.proyectoMovidoAEliminados'));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['active_projects'] });

      // Close dialog
      setOpen(false);

      // Navigate to projects view
      navigate('/proyectos');
    } catch (_error) {
      toast.error(error instanceof Error ? error.message : t('projects.errorAlEliminarEl'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 size={16} />{t('projects.eliminarProyecto')}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t('projects.eliminarProyecto')}</DialogTitle>
            </div>
          </div>
          <DialogDescription>{t('projects.estaAcciónEs')}<span className="font-bold text-destructive">irreversible</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info notice */}
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              ℹ️ Eliminación segura
            </p>
            <p className="text-sm text-muted-foreground">
              El proyecto será movido al historial de eliminados. Podrás restaurarlo en cualquier
              momento desde el botón t('projects.historialDeEliminados') en la vista de proyectos.
            </p>
          </div>

          {/* What will be hidden */}
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
              📦 Se ocultarán temporalmente:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• El proyecto: <span className="font-medium">{projectName}</span></li>
              <li>• Todos los datos asociados (OBVs, leads, tareas)</li>
              <li>• Historial de validaciones y cambios</li>
            </ul>
          </div>

          {/* Reason (optional) */}
          <div>
            <Label htmlFor="reason">Razón de eliminación (opcional)</Label>
            <Input
              id="reason"
              placeholder={t('projects.ejProyectoCanceladoFinalizado')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
              disabled={isDeleting}
              maxLength={200}
            />
          </div>

          {/* Confirmation input */}
          <div>
            <Label htmlFor="confirm">Escribe<span className="font-bold text-destructive">ELIMINAR</span> para confirmar
            </Label>
            <Input
              id="confirm"
              placeholder={t('projects.eliminar')}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="mt-2 font-mono"
              disabled={isDeleting}
            />
          </div>

          {/* Additional info */}
          <p className="text-xs text-muted-foreground">
            💡 Los datos no se borrarán permanentemente. Podrás restaurar el proyecto cuando quieras.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>{t('projects.cancelar')}</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />{t('projects.eliminando')}</>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />{t('projects.eliminarDefinitivamente')}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
