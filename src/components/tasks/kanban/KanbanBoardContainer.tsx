import { Plus, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { DragDropContext } from '@hello-pangea/dnd';
import { useTaskKanban, TASK_COLUMNS } from '@/hooks/useTaskKanban';
import { KanbanColumn } from './KanbanColumn';
import { TaskForm } from '../TaskForm';
import { TaskPlaybookViewer } from '../TaskPlaybookViewer';
import { TaskCompletionDialog } from '../TaskCompletionDialog';
import type { Json } from '@/integrations/supabase/types';

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface KanbanBoardContainerProps {
  projectId: string;
  projectMembers: Member[];
}

export function KanbanBoardContainer({ projectId, projectMembers }: KanbanBoardContainerProps) {
  const {
    tasks,
    isLoading,
    showForm,
    setShowForm,
    selectedTaskForPlaybook,
    setSelectedTaskForPlaybook,
    taskToComplete,
    setTaskToComplete,
    taskToDelete,
    setTaskToDelete,
    isDeleting,
    handleDragEnd,
    handleCompleteClick,
    handleTaskComplete,
    handleDeleteTask,
    canDeleteTask,
    hasPlaybook,
  } = useTaskKanban(projectId);

  const getAssignee = (assigneeId: string | null) =>
    projectMembers.find(m => m.id === assigneeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
          <Plus size={14} className="mr-2" />
          Manual
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {TASK_COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                getAssignee={getAssignee}
                canDeleteTask={canDeleteTask}
                hasPlaybook={hasPlaybook}
                onCompleteClick={handleCompleteClick}
                onPlaybookClick={setSelectedTaskForPlaybook}
                onDeleteClick={setTaskToDelete}
              />
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Form Dialog */}
      <TaskForm
        projectId={projectId}
        projectMembers={projectMembers}
        open={showForm}
        onOpenChange={setShowForm}
      />

      {/* Playbook Dialog */}
      <Dialog
        open={!!selectedTaskForPlaybook}
        onOpenChange={(open) => !open && setSelectedTaskForPlaybook(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Playbook de la tarea
            </DialogTitle>
          </DialogHeader>
          {selectedTaskForPlaybook?.playbook && (
            <TaskPlaybookViewer
              playbook={selectedTaskForPlaybook.playbook as Json}
              taskTitle={selectedTaskForPlaybook.titulo}
              onClose={() => setSelectedTaskForPlaybook(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Task Completion Dialog */}
      {taskToComplete && (
        <TaskCompletionDialog
          open={!!taskToComplete}
          onOpenChange={(open) => !open && setTaskToComplete(null)}
          task={{
            id: taskToComplete.id,
            titulo: taskToComplete.titulo,
            descripcion: taskToComplete.descripcion,
            playbook: taskToComplete.playbook as Json,
            metadata: taskToComplete.metadata as Json,
          }}
          onComplete={handleTaskComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la tarea "{taskToDelete?.titulo}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
