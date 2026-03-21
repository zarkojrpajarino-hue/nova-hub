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

interface ProjectLifecycleActionsProps {
  projectId: string;
  isPaused: boolean;
  isArchived: boolean;
}

export function ProjectLifecycleActions({ projectId, isPaused, isArchived }: ProjectLifecycleActionsProps) {
  const [confirmAction, setConfirmAction] = useState<'pause' | 'archive' | null>(null);
  const pauseProject = usePauseProject();
  const archiveProject = useArchiveProject();

  if (isArchived) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Archive className="h-4 w-4" />
        <span>Este proyecto está archivado.</span>
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
            <Play className="h-3.5 w-3.5" />
            Reactivar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setConfirmAction('pause')}
          >
            <Pause className="h-3.5 w-3.5" />
            Pausar
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-red-600 hover:text-red-700"
          onClick={() => setConfirmAction('archive')}
        >
          <Archive className="h-3.5 w-3.5" />
          Archivar
        </Button>
      </div>

      {/* Confirmation dialogs */}
      <AlertDialog open={confirmAction === 'pause'} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Pausar este proyecto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los engines dejarán de recalcular mientras esté pausado.
              Podrás reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                pauseProject.mutate({ projectId, pause: true });
                setConfirmAction(null);
              }}
            >
              Pausar proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'archive'} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Archivar este proyecto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El proyecto se ocultará de la lista principal y será de solo lectura.
              No se eliminan datos. Contacta soporte para desarchivarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                archiveProject.mutate({ projectId });
                setConfirmAction(null);
              }}
            >
              Archivar proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
