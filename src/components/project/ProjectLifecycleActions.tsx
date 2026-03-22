/**
 * A12.3+A12.4 — ProjectLifecycleActions
 *
 * Botones de pausar/archivar proyecto.
 * Se muestra en settings o team tab.
 */

import { Pause, Play, Archive, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePauseProject, useArchiveProject } from '@/hooks/useProjectLifecycle';

import { useTranslation } from 'react-i18next';
interface ProjectLifecycleActionsProps {
  projectId: string;
  isPaused: boolean;
  isArchived: boolean;
}

export function ProjectLifecycleActions({ projectId, isPaused, isArchived }: ProjectLifecycleActionsProps) {
  const { t } = useTranslation();
  const [confirmAction, setConfirmAction] = useState<'pause' | 'archive' | null>(null);
  const pauseProject = usePauseProject();
  const archiveProject = useArchiveProject();

  if (isArchived) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Archive className="h-4 w-4" />
        <span>{t('project.esteProyectoEstáArchivado')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {isPaused ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => pauseProject.mutate({ projectId, pause: false })}
            disabled={pauseProject.isPending}
          >
            <Play className="h-3.5 w-3.5" />{t('project.reactivar')}</Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setConfirmAction('pause')}
          >
            <Pause className="h-3.5 w-3.5" />{t('project.pausar')}</Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-red-600 hover:text-red-700"
          onClick={() => setConfirmAction('archive')}
        >
          <Archive className="h-3.5 w-3.5" />{t('project.archivar')}</Button>
      </div>

      {/* Confirmation dialogs */}
      <AlertDialog open={confirmAction === 'pause'} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />{t('project.pausarEsteProyecto')}</AlertDialogTitle>
            <AlertDialogDescription>
              Los engines dejarán de recalcular mientras esté pausado.
              Podrás reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('project.cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                pauseProject.mutate({ projectId, pause: true });
                setConfirmAction(null);
              }}
            >{t('project.pausarProyecto')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'archive'} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />{t('project.archivarEsteProyecto')}</AlertDialogTitle>
            <AlertDialogDescription>
              El proyecto se ocultará de la lista principal y será de solo lectura.
              No se eliminan datos. Contacta soporte para desarchivarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('project.cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                archiveProject.mutate({ projectId });
                setConfirmAction(null);
              }}
            >{t('project.archivarProyecto')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
